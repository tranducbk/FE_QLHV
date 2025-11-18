/**
 * Axios instance với auto-refresh token interceptor
 * Token được lưu trong httpOnly cookie (không cần manual handling)
 *
 * Features:
 * - Auto refresh token khi hết hạn
 * - Queue requests khi đang refresh token
 * - Auto redirect về login khi authentication failed
 * - Prevent multiple redirects
 * - Clean error handling
 */
import axios from "axios";
import { BASE_URL } from "@/configs";

// Constants
const AUTH_ERROR_MESSAGES = {
  NOT_LOGGED_IN: "Bạn chưa đăng nhập",
  TOKEN_EXPIRED: "Token đã hết hạn",
  TOKEN_INVALID: "Token không hợp lệ",
  SESSION_EXPIRED: "Phiên đăng nhập đã hết hạn",
};

const REFRESH_TOKEN_ENDPOINT = "/user/refresh-token";
const LOGIN_PATH = "/login";
const MAX_RETRY_ATTEMPTS = 1;
const REFRESH_TOKEN_TIMEOUT = 10000; // 10 seconds

// Tạo axios instance
const axiosInstance = axios.create({
  baseURL: BASE_URL,
  withCredentials: true, // Quan trọng! Để tự động gửi cookies
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 30000, // 30 giây timeout
});

// State management cho token refresh
let isRefreshing = false;
let failedQueue = [];
let isRedirecting = false; // Prevent multiple redirects

/**
 * Xử lý queue các requests đang chờ refresh token
 * @param {Error|null} error - Error nếu refresh thất bại
 * @param {boolean} success - Success flag
 */
const processQueue = (error, success = false) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(success);
    }
  });

  failedQueue = [];
};

/**
 * Kiểm tra xem error message có phải là auth error không
 * @param {string|object} errorData - Error data từ response
 * @returns {boolean}
 */
const isAuthError = (errorData) => {
  const errorMessage =
    typeof errorData === "string" ? errorData : errorData?.message || "";

  return Object.values(AUTH_ERROR_MESSAGES).some((msg) =>
    errorMessage.includes(msg)
  );
};

/**
 * Xóa tất cả authentication data
 */
const clearAuthData = () => {
  try {
    // Xóa localStorage
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");

    // Xóa cookies với đầy đủ options để đảm bảo xóa được
    const cookieOptions = [
      "path=/",
      "expires=Thu, 01 Jan 1970 00:00:00 UTC",
      "SameSite=None",
      "Secure",
    ].join("; ");

    document.cookie = `accessToken=; ${cookieOptions}`;
    document.cookie = `refreshToken=; ${cookieOptions}`;
  } catch (error) {
    console.error("Error clearing auth data:", error);
  }
};

/**
 * Redirect về trang đăng nhập với proper cleanup
 * @param {string} reason - Lý do redirect (optional, for logging)
 */
const redirectToLogin = (reason = "Authentication failed") => {
  // Prevent multiple redirects
  if (isRedirecting || typeof window === "undefined") {
    return;
  }

  // Không redirect nếu đang ở trang login
  if (window.location.pathname === LOGIN_PATH) {
    return;
  }

  isRedirecting = true;

  // Log for debugging (chỉ trong development)
  if (process.env.NODE_ENV === "development") {
    console.warn(`[Auth] Redirecting to login: ${reason}`);
  }

  // Clear auth data
  clearAuthData();

  // Show notification nếu có thể (dynamic import để tránh circular dependency)
  try {
    import("@/components/notify").then(({ handleNotify }) => {
      handleNotify(
        "warning",
        "Phiên đăng nhập đã hết hạn",
        "Vui lòng đăng nhập lại để tiếp tục sử dụng"
      );
    });
  } catch (error) {
    // Ignore nếu không import được
  }

  // Delay nhỏ để đảm bảo notification hiển thị
  setTimeout(() => {
    window.location.href = LOGIN_PATH;
  }, 100);
};

/**
 * Request interceptor: Thêm token vào header nếu cần
 */
axiosInstance.interceptors.request.use(
  (config) => {
    // Skip interceptor cho refresh token endpoint để tránh loop
    // Refresh token endpoint sẽ tự xử lý authentication
    if (
      config.url?.includes(REFRESH_TOKEN_ENDPOINT) ||
      config.skipAuthRefresh
    ) {
      return config;
    }

    // Fallback: Nếu cookies không có, gửi token từ localStorage
    if (typeof window !== "undefined") {
      try {
        const hasCookieToken = document.cookie.includes("accessToken");
        const localStorageToken = localStorage.getItem("accessToken");

        if (!hasCookieToken && localStorageToken) {
          config.headers.Authorization = `Bearer ${localStorageToken}`;
        }
      } catch (error) {
        // Ignore localStorage errors (có thể do privacy mode)
        if (process.env.NODE_ENV === "development") {
          console.warn("[Auth] Failed to read token from storage:", error);
        }
      }
    }

    return config;
  },
  (error) => Promise.reject(error)
);

/**
 * Response interceptor: Xử lý errors và auto-refresh token
 */
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Skip nếu request đã bị cancel hoặc không có config
    if (!originalRequest) {
      return Promise.reject(error);
    }

    // Xử lý lỗi 429 (Rate Limited) - Retry với delay
    if (error.response?.status === 429) {
      const retryAfter = error.response.headers["retry-after"] || 1;
      await new Promise((resolve) => setTimeout(resolve, retryAfter * 1000));
      return axiosInstance(originalRequest);
    }

    // Xử lý lỗi 401 (Unauthorized)
    if (error.response?.status === 401) {
      const errorData = error.response?.data;
      const requestUrl = originalRequest.url || "";

      // Skip refresh token endpoint để tránh infinite loop
      if (requestUrl.includes(REFRESH_TOKEN_ENDPOINT)) {
        redirectToLogin("Refresh token failed");
        return Promise.reject(error);
      }

      // Nếu là auth error message rõ ràng, redirect ngay không cần refresh
      if (isAuthError(errorData)) {
        redirectToLogin("Auth error detected");
        return Promise.reject(error);
      }

      // Nếu đã retry quá số lần cho phép, redirect về login
      const retryCount = originalRequest._retryCount || 0;
      if (retryCount >= MAX_RETRY_ATTEMPTS) {
        redirectToLogin("Max retry attempts reached");
        return Promise.reject(error);
      }

      // Nếu đang refresh token, đợi trong queue
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(() => {
            // Retry original request sau khi refresh thành công
            return axiosInstance(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      // Bắt đầu refresh token process
      originalRequest._retryCount = retryCount + 1;
      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Gọi refresh token endpoint
        const refreshResponse = await axiosInstance.post(
          REFRESH_TOKEN_ENDPOINT,
          {},
          {
            withCredentials: true,
            timeout: REFRESH_TOKEN_TIMEOUT,
            // Skip interceptor cho refresh request
            skipAuthRefresh: true,
          }
        );

        // Lưu token mới vào localStorage (fallback nếu cookies không hoạt động)
        if (refreshResponse.data?.accessToken) {
          localStorage.setItem("accessToken", refreshResponse.data.accessToken);
          if (refreshResponse.data.refreshToken) {
            localStorage.setItem(
              "refreshToken",
              refreshResponse.data.refreshToken
            );
          }
        }

        // Process queue và retry các requests đang chờ
        processQueue(null, true);
        isRefreshing = false;

        // Retry original request với token mới
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        // Refresh token thất bại
        processQueue(refreshError, false);
        isRefreshing = false;

        // Log error trong development
        if (process.env.NODE_ENV === "development") {
          console.error("[Auth] Refresh token failed:", refreshError);
        }

        // Redirect về login
        redirectToLogin("Refresh token failed");
        return Promise.reject(refreshError);
      }
    }

    // Xử lý các lỗi khác (403, 404, 500, etc.)
    // Có thể thêm custom handling ở đây nếu cần

    return Promise.reject(error);
  }
);

export default axiosInstance;
