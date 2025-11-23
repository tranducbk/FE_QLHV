/**
 * Axios Instance với Auto-Refresh Token Interceptor
 *
 * Quản lý authentication tokens thông qua httpOnly cookies với các tính năng:
 * - Tự động refresh accessToken khi hết hạn
 * - Queue requests khi đang refresh token
 * - Xử lý session expiration và logout tự động
 * - Fallback support cho localStorage (nếu cookies không hoạt động)
 *
 * @module utils/axiosInstance
 */
import axios from "axios";
import { BASE_URL } from "@/configs";

// ==================== CONSTANTS ====================
const REFRESH_TOKEN_ENDPOINT = "/user/refresh-token";
const MAX_RETRY_ATTEMPTS = 1;
const REFRESH_TOKEN_TIMEOUT = 10000; // 10 seconds
const REQUEST_TIMEOUT = 30000; // 30 seconds
const LOGOUT_TIMEOUT = 3000; // 3 seconds

// ==================== STATE MANAGEMENT ====================
let isRefreshing = false;
let failedQueue = [];
let isRedirecting = false;

// ==================== UTILITY FUNCTIONS ====================

/**
 * Xử lý queue các requests đang chờ refresh token
 * @param {Error|null} error - Error nếu refresh thất bại
 * @param {boolean} success - Success flag
 */
const processQueue = (error, success = false) => {
  failedQueue.forEach((promise) => {
    if (error) {
      promise.reject(error);
    } else {
      promise.resolve(success);
    }
  });
  failedQueue = [];
};

/**
 * Xóa tất cả authentication data từ localStorage và cookies
 * Export để có thể sử dụng ở các component khác
 */
export const clearAuthData = () => {
  try {
    // Clear accessToken và userRole từ localStorage
    // refreshToken chỉ có trong httpOnly cookie, sẽ được clear bởi backend
    localStorage.removeItem("accessToken");
    localStorage.removeItem("userRole");

    // Clear cookies với đầy đủ options
    const cookieOptions = [
      "path=/",
      "expires=Thu, 01 Jan 1970 00:00:00 UTC",
      "SameSite=None",
      "Secure",
    ].join("; ");

    // Xóa cookies với các path và domain khác nhau để đảm bảo
    document.cookie = `accessToken=; ${cookieOptions}`;
    document.cookie = `refreshToken=; ${cookieOptions}`;

    // Xóa với domain hiện tại và parent domain
    if (typeof window !== "undefined") {
      const hostname = window.location.hostname;
      const domains = [hostname, `.${hostname}`];

      domains.forEach((domain) => {
        try {
          document.cookie = `accessToken=; ${cookieOptions}; domain=${domain}`;
          document.cookie = `refreshToken=; ${cookieOptions}; domain=${domain}`;
        } catch (e) {
          // Ignore domain errors
        }
      });
    }
  } catch (error) {
    // Ignore errors
  }
};

/**
 * Hiển thị thông báo session expired
 */
const showSessionExpiredNotification = async () => {
  try {
    const { handleNotify } = await import("@/components/notify");
    handleNotify(
      "warning",
      "Phiên đăng nhập đã hết hạn",
      "Vui lòng đăng nhập lại để tiếp tục sử dụng"
    );
  } catch (error) {
    // Ignore nếu không import được (tránh circular dependency)
  }
};

/**
 * Gọi logout API (silent, không bắt buộc thành công)
 */
const callLogoutAPI = async () => {
  try {
    await axios.post(
      `${BASE_URL}/user/logout`,
      {},
      {
        withCredentials: true,
        timeout: LOGOUT_TIMEOUT,
      }
    );
  } catch (error) {
    // Expected: token có thể đã hết hạn
  }
};

/**
 * Xử lý khi phiên đăng nhập hết hạn
 * - Clear auth data
 * - Gọi logout API
 * - Hiển thị notification
 * - Redirect về trang chủ
 *
 * @param {string} reason - Lý do session expired (for logging)
 */
const handleSessionExpired = async (reason = "Session expired") => {
  if (isRedirecting || typeof window === "undefined") {
    return;
  }

  // Không redirect nếu đang ở trang chủ (tránh loop)
  const currentPath = window.location.pathname;
  if (currentPath === "/") {
    // Chỉ clear data, không redirect
    clearAuthData();
    callLogoutAPI();
    showSessionExpiredNotification();
    return;
  }

  isRedirecting = true;

  // Clear auth data
  clearAuthData();

  // Call logout API (non-blocking)
  callLogoutAPI();

  // Lưu flag để hiện thông báo ở page home (không hiện ở page hiện tại)
  sessionStorage.setItem("showSessionExpiredNotification", "true");

  // Redirect to home page
  setTimeout(() => {
    window.location.href = "/";
  }, 100);
};

// ==================== AXIOS INSTANCE ====================
const axiosInstance = axios.create({
  baseURL: BASE_URL,
  withCredentials: true, // Quan trọng: gửi cookies tự động
  headers: {
    "Content-Type": "application/json",
  },
  timeout: REQUEST_TIMEOUT,
});

// ==================== REQUEST INTERCEPTOR ====================
axiosInstance.interceptors.request.use(
  (config) => {
    // Skip interceptor cho refresh token endpoint
    if (
      config.url?.includes(REFRESH_TOKEN_ENDPOINT) ||
      config.skipAuthRefresh
    ) {
      return config;
    }

    // Gửi accessToken từ localStorage trong Authorization header
    // (accessToken không lưu trong cookie, chỉ refreshToken lưu trong httpOnly cookie)
    if (typeof window !== "undefined") {
      try {
        const accessToken = localStorage.getItem("accessToken");
        if (accessToken) {
          config.headers.Authorization = `Bearer ${accessToken}`;
        }
      } catch (error) {
        // Ignore localStorage errors (privacy mode, etc.)
      }
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// ==================== RESPONSE INTERCEPTOR ====================
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Skip nếu request đã bị cancel hoặc không có config
    if (!originalRequest) {
      return Promise.reject(error);
    }

    // Handle 429 Rate Limited - Retry với delay
    if (error.response?.status === 429) {
      const retryAfter = error.response.headers["retry-after"] || 1;
      await new Promise((resolve) => setTimeout(resolve, retryAfter * 1000));
      return axiosInstance(originalRequest);
    }

    // Handle 401 Unauthorized - Refresh token
    if (error.response?.status === 401) {
      return handleUnauthorizedError(originalRequest, error);
    }

    return Promise.reject(error);
  }
);

/**
 * Xử lý lỗi 401 Unauthorized
 * @param {Object} originalRequest - Request gốc bị lỗi
 * @param {Error} error - Error object
 * @returns {Promise}
 */
const handleUnauthorizedError = async (originalRequest, error) => {
  const errorData = error.response?.data;
  const requestUrl = originalRequest.url || "";
  const errorMessage =
    typeof errorData === "string" ? errorData : errorData?.message || "";

  // Skip refresh token endpoint để tránh infinite loop
  if (requestUrl.includes(REFRESH_TOKEN_ENDPOINT)) {
    handleSessionExpired("Refresh token failed");
    return Promise.reject(error);
  }

  // Nếu là lỗi "Bạn chưa đăng nhập" - không có token, đăng xuất ngay
  if (errorMessage.includes("Bạn chưa đăng nhập")) {
    handleSessionExpired("Not logged in");
    return Promise.reject(error);
  }

  // Kiểm tra retry count
  const retryCount = originalRequest._retryCount || 0;
  if (retryCount >= MAX_RETRY_ATTEMPTS) {
    handleSessionExpired("Max retry attempts reached");
    return Promise.reject(error);
  }

  // Nếu đang refresh token, đợi trong queue
  if (isRefreshing) {
    return waitForTokenRefresh(originalRequest);
  }

  // Bắt đầu refresh token process
  return refreshAccessToken(originalRequest, retryCount);
};

/**
 * Đợi token refresh hoàn tất và retry request
 * @param {Object} originalRequest - Request gốc
 * @returns {Promise}
 */
const waitForTokenRefresh = (originalRequest) => {
  return new Promise((resolve, reject) => {
    failedQueue.push({ resolve, reject });
  })
    .then(() => axiosInstance(originalRequest))
    .catch((err) => Promise.reject(err));
};

/**
 * Refresh access token
 * @param {Object} originalRequest - Request gốc
 * @param {number} retryCount - Số lần đã retry
 * @returns {Promise}
 */
const refreshAccessToken = async (originalRequest, retryCount) => {
  originalRequest._retryCount = retryCount + 1;
  originalRequest._retry = true;
  isRefreshing = true;

  try {
    // Gọi refresh token endpoint
    // refreshToken sẽ tự động được gửi từ httpOnly cookie với withCredentials: true
    // Không cần gửi refreshToken trong body
    const refreshResponse = await axiosInstance.post(
      REFRESH_TOKEN_ENDPOINT,
      {}, // Không cần gửi refreshToken trong body, đã có trong cookie
      {
        withCredentials: true, // Quan trọng: gửi httpOnly cookies
        timeout: REFRESH_TOKEN_TIMEOUT,
        skipAuthRefresh: true, // Tránh loop
      }
    );

    // Lưu accessToken mới vào localStorage (fallback)
    if (refreshResponse.data?.accessToken) {
      localStorage.setItem("accessToken", refreshResponse.data.accessToken);
    }

    // Process queue và retry requests
    processQueue(null, true);
    isRefreshing = false;

    // Retry original request với token mới
    return axiosInstance(originalRequest);
  } catch (refreshError) {
    // Refresh token thất bại - refreshToken đã hết hạn hoặc không hợp lệ
    processQueue(refreshError, false);
    isRefreshing = false;

    // Khi refreshToken hết hạn, chỉ cần clear token và logout
    handleSessionExpired("Refresh token expired");
    return Promise.reject(refreshError);
  }
};

export default axiosInstance;
