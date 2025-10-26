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
});

// KHÔNG CẦN request interceptor vì token trong httpOnly cookie tự động gửi

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
        // Gọi API refresh token (cookie tự động gửi refreshToken)
        await axios.post(
          `${BASE_URL}/user/refresh-token`,
          {},
          {
            withCredentials: true, // Gửi cookies
          }
        );

        // Token mới đã được lưu vào cookie bởi backend
        // Process tất cả requests đang chờ
        processQueue(null, true);

        isRefreshing = false;

        // Retry request ban đầu (cookie mới tự động gửi)
        return axiosInstance(originalRequest);
      } catch (refreshError) {
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
