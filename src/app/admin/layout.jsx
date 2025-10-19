"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Header from "@/components/header";
import { MetadataContext, metadata } from "./metadataContext";
import { ThemeToggle } from "@/components/ThemeToggle";
import Sidebar from "@/components/sidebar";
import "./globals.css";

export default function RootLayout({ children }) {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      router.push("/login");
    } else {
      const currentPath = window.location.pathname;

      if (currentPath === "/login" || currentPath === "/register") {
        router.push("/admin");
      } else {
        router.push(currentPath);
      }
    }
  }, []);

  return (
    <MetadataContext.Provider value={metadata}>
      <div className="min-h-screen bg-white dark:bg-dark-bg text-gray-900 dark:text-dark-text transition-colors duration-200">
        <div className="flex">
          <div className="w-60">
            <Sidebar />
          </div>
          <div className="flex-1">
            <Header />
            <div className="ml-4">{children}</div>
          </div>
          <div className="fixed top-4 right-4 z-50">
            <ThemeToggle />
          </div>
        </div>
      </div>
    </MetadataContext.Provider>
  );
}
