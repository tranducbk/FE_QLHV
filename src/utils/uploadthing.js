"use client";

import { generateUploadButton, generateUploadDropzone } from "@uploadthing/react";
import { BASE_URL } from "@/configs";

/**
 * Lấy access token từ localStorage
 */
export const getAuthToken = () => {
  if (typeof window !== "undefined") {
    try {
      return localStorage.getItem("accessToken") || "";
    } catch (error) {
      return "";
    }
  }
  return "";
};

/**
 * UploadThing components
 * Sử dụng với endpoint từ backend Express
 * Note: Headers sẽ được truyền trực tiếp vào component, không phải trong generateUploadButton
 */
export const UploadButton = generateUploadButton({
  url: `${BASE_URL}/api/uploadthing`,
});

export const UploadDropzone = generateUploadDropzone({
  url: `${BASE_URL}/api/uploadthing`,
});

