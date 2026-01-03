"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Header from "@/components/header";
import { MetadataContext, metadata } from "./metadataContext";
import { ThemeToggle } from "@/components/ThemeToggle";
import axiosInstance from "@/utils/axiosInstance";
import Loader from "@/components/loader";
import "./globals.css";

export default function UsersLayout({ children }) {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Kiểm tra token có tồn tại không
        const accessToken = localStorage.getItem("accessToken");
        if (!accessToken) {
          router.replace("/login");
          return;
        }

        // Kiểm tra authentication và role
        const response = await axiosInstance.get("/user/me");
        const user = response.data;

        // Nếu là admin hoặc super admin, redirect về trang phù hợp
        if (user?.role === "SUPER_ADMIN") {
          router.replace("/supper_admin");
          return;
        }

        if (user?.role === "ADMIN" || user?.admin === true) {
          router.replace("/admin");
          return;
        }

        // Đã authenticated và là user thường
        setIsAuthenticated(true);
      } catch (error) {
        // Token không hợp lệ hoặc hết hạn
        // Clear auth data và redirect về login
        localStorage.removeItem("accessToken");
        localStorage.removeItem("userRole");
        router.replace("/login");
      } finally {
        setIsChecking(false);
      }
    };

    checkAuth();
  }, [router]);

  // Hiển thị loader khi đang check auth
  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-dark-bg">
        <Loader />
      </div>
    );
  }

  // Chỉ render children khi đã authenticated
  if (!isAuthenticated) {
    return null;
  }

  return (
    <MetadataContext.Provider value={metadata}>
      <div className="min-h-screen bg-white dark:bg-dark-bg text-gray-900 dark:text-dark-text">
        <div>
          <Header />
          {/* Theme toggle button */}
          <div className="fixed top-4 right-4 z-50">
            <ThemeToggle />
          </div>
        </div>
        <div className="bg-gray-50 dark:bg-dark-surface min-h-screen">
          {children}
        </div>
      </div>
    </MetadataContext.Provider>
  );
}
