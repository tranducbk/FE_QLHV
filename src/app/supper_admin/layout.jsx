"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Header from "@/components/header";
import axiosInstance from "@/utils/axiosInstance";
import "../admin/globals.css";

export default function SupperAdminLayout({ children }) {
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        await axiosInstance.get("/user/me");
      } catch (error) {
        router.push("/login");
      }
    };

    checkAuth();
  }, [router]);

  return (
    <div className="min-h-screen bg-white dark:bg-dark-bg text-gray-900 dark:text-dark-text transition-colors duration-200">
      <Header />
      <div className="pt-16">{children}</div>
    </div>
  );
}
