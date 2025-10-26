"use client";

import Header from "@/components/header";
import { MetadataContext, metadata } from "./metadataContext";
import { ThemeToggle } from "@/components/ThemeToggle";
import "./globals.css";

export default function UsersLayout({ children }) {
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
