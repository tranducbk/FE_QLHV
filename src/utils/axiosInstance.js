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

// Request interceptor để fallback localStorage
axiosInstance.interceptors.request.use(
  (config) => {
    // Fallback: Nếu cookies không có, gửi token từ localStorage
    if (
      !document.cookie.includes("accessToken") &&
      localStorage.getItem("accessToken")
    ) {
      config.headers.Authorization = `Bearer ${localStorage.getItem(
        "accessToken"
      )}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
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
        const refreshResponse = await axiosInstance.post(
          `/user/refresh-token`,
          {},
          {
            withCredentials: true,
            timeout: 10000,
          }
        );

        // Fallback: Lưu token mới vào localStorage nếu cookies không hoạt động
        if (refreshResponse.data.accessToken) {
          localStorage.setItem("accessToken", refreshResponse.data.accessToken);
          localStorage.setItem(
            "refreshToken",
            refreshResponse.data.refreshToken
          );
        }

        processQueue(null, true);
        isRefreshing = false;

        return axiosInstance(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, false);
        isRefreshing = false;

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
