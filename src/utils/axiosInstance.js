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
const REFRESH_TOKEN_TIMEOUT = 10000;
const REQUEST_TIMEOUT = 30000;
const LOGOUT_TIMEOUT = 3000;
const REDIRECT_DELAY = 100;

const PUBLIC_ROUTES = ["/", "/login", "/forgot-password"];
const RESET_PASSWORD_PREFIX = "/reset-password/";

const STORAGE_KEYS = {
  ACCESS_TOKEN: "accessToken",
  USER_ROLE: "userRole",
  SESSION_EXPIRED: "showSessionExpiredNotification",
};

const HTTP_STATUS = {
  UNAUTHORIZED: 401,
  TOO_MANY_REQUESTS: 429,
};

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
 * Xóa cookie với options chuẩn
 */
const clearCookie = (name, domain = "") => {
  const options = [
    "path=/",
    "expires=Thu, 01 Jan 1970 00:00:00 UTC",
    "SameSite=None",
    "Secure",
    domain && `domain=${domain}`,
  ]
    .filter(Boolean)
    .join("; ");

  document.cookie = `${name}=; ${options}`;
};

/**
 * Xóa tất cả authentication data từ localStorage và cookies
 * Export để có thể sử dụng ở các component khác
 */
export const clearAuthData = () => {
  if (typeof window === "undefined") return;

  try {
    // Clear localStorage
    localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.USER_ROLE);

    // Clear cookies với domain hiện tại và parent domain
    const hostname = window.location.hostname;
    const domains = [hostname, `.${hostname}`];

    ["accessToken", "refreshToken"].forEach((tokenName) => {
      clearCookie(tokenName);
      domains.forEach((domain) => {
        try {
          clearCookie(tokenName, domain);
        } catch {
          // Ignore domain errors
        }
      });
    });
  } catch {
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
  } catch {
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
  } catch {
    // Expected: token có thể đã hết hạn
  }
};

/**
 * Kiểm tra xem route có phải là public route không
 */
const isPublicRoute = (pathname) => {
  return (
    PUBLIC_ROUTES.includes(pathname) ||
    pathname.startsWith(RESET_PASSWORD_PREFIX)
  );
};

/**
 * Xử lý khi phiên đăng nhập hết hạn
 * - Clear auth data
 * - Gọi logout API
 * - Hiển thị notification
 * - Redirect về login (nếu đang ở protected route)
 *
 * @param {string} reason - Lý do session expired (for logging)
 */
const handleSessionExpired = async () => {
  if (isRedirecting || typeof window === "undefined") {
    return;
  }

  const currentPath = window.location.pathname;

  // Clear auth data và logout
  clearAuthData();
  callLogoutAPI();

  // Nếu đang ở public route, chỉ clear data và show notification
  if (isPublicRoute(currentPath)) {
    showSessionExpiredNotification();
    return;
  }

  // Protected routes: redirect về login
  isRedirecting = true;
  sessionStorage.setItem(STORAGE_KEYS.SESSION_EXPIRED, "true");

  setTimeout(() => {
    window.location.href = "/login";
  }, REDIRECT_DELAY);
};

// ==================== AXIOS INSTANCE ====================
const axiosInstance = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
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
    if (typeof window !== "undefined") {
      try {
        const accessToken = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
        if (accessToken) {
          config.headers.Authorization = `Bearer ${accessToken}`;
        }
      } catch {
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

    if (!originalRequest) {
      return Promise.reject(error);
    }

    const status = error.response?.status;

    // Handle 429 Rate Limited - Retry với delay
    if (status === HTTP_STATUS.TOO_MANY_REQUESTS) {
      const retryAfter = error.response.headers["retry-after"] || 1;
      await new Promise((resolve) => setTimeout(resolve, retryAfter * 1000));
      return axiosInstance(originalRequest);
    }

    // Handle 401 Unauthorized - Refresh token
    if (status === HTTP_STATUS.UNAUTHORIZED) {
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
    handleSessionExpired();
    return Promise.reject(error);
  }

  // Nếu là lỗi "Bạn chưa đăng nhập" - không có token, đăng xuất ngay
  if (errorMessage.includes("Bạn chưa đăng nhập")) {
    handleSessionExpired();
    return Promise.reject(error);
  }

  // Kiểm tra retry count
  const retryCount = originalRequest._retryCount || 0;
  if (retryCount >= MAX_RETRY_ATTEMPTS) {
    handleSessionExpired();
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
    const refreshResponse = await axiosInstance.post(
      REFRESH_TOKEN_ENDPOINT,
      {},
      {
        withCredentials: true,
        timeout: REFRESH_TOKEN_TIMEOUT,
        skipAuthRefresh: true,
      }
    );

    // Lưu accessToken mới vào localStorage
    if (refreshResponse.data?.accessToken) {
      localStorage.setItem(
        STORAGE_KEYS.ACCESS_TOKEN,
        refreshResponse.data.accessToken
      );
    }

    processQueue(null, true);
    isRefreshing = false;

    return axiosInstance(originalRequest);
  } catch (refreshError) {
    processQueue(refreshError, false);
    isRefreshing = false;
    handleSessionExpired();
    return Promise.reject(refreshError);
  }
};

export default axiosInstance;
