/**
 * Axios instance với auto-refresh token interceptor
 * Token được lưu trong httpOnly cookie (không cần manual handling)
 */
import axios from "axios";
import { BASE_URL } from "@/configs";

// Tạo axios instance
const axiosInstance = axios.create({
  baseURL: BASE_URL,
  withCredentials: true, // Quan trọng! Để tự động gửi cookies
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 30000, // 30 giây timeout
});

// Request interceptor để debug cookies
axiosInstance.interceptors.request.use(
  (config) => {
    console.log(
      "🍪 Request interceptor - Cookies being sent:",
      document.cookie
    );
    console.log("🍪 Request URL:", config.url);
    console.log("🍪 withCredentials:", config.withCredentials);
    console.log("🍪 Base URL:", config.baseURL);
    return config;
  },
  (error) => {
    console.error("🍪 Request interceptor error:", error);
    return Promise.reject(error);
  }
);

// Response interceptor: Tự động refresh token khi 401
let isRefreshing = false;
let failedQueue = [];

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

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Xử lý lỗi 429 (Rate Limited)
    if (error.response?.status === 429) {
      console.warn("⚠️ Rate limited, waiting before retry...");
      // Đợi 1 giây trước khi retry
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return axiosInstance(originalRequest);
    }

    // Nếu lỗi 401 và chưa retry
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // Nếu đang refresh, đợi trong queue
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(() => {
            return axiosInstance(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        console.log("🔄 Attempting to refresh token...");

        // Gọi API refresh token (cookie tự động gửi refreshToken)
        await axiosInstance.post(
          `/user/refresh-token`,
          {},
          {
            withCredentials: true, // Gửi cookies
            timeout: 10000, // 10 giây timeout
          }
        );

        console.log("✅ Token refreshed successfully");

        // Token mới đã được lưu vào cookie bởi backend
        // Process tất cả requests đang chờ
        processQueue(null, true);

        isRefreshing = false;

        // Retry request ban đầu (cookie mới tự động gửi)
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        console.error(
          "❌ Token refresh failed:",
          refreshError.response?.status
        );

        // Refresh token hết hạn hoặc không hợp lệ
        processQueue(refreshError, false);
        isRefreshing = false;

        // Redirect đến login
        if (typeof window !== "undefined") {
          window.location.href = "/login";
        }

        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
