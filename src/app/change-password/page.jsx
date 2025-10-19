"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { jwtDecode } from "jwt-decode";
import { useRouter } from "next/navigation";
import { handleNotify } from "../../components/notify";
import { BASE_URL } from "@/configs";
import {
  LockOutlined,
  EyeOutlined,
  EyeInvisibleOutlined,
  ArrowLeftOutlined,
} from "@ant-design/icons";

const ChangePassword = () => {
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userType, setUserType] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const checkToken = async () => {
      const token = localStorage.getItem("token");
      if (token) {
        try {
          const decodedToken = jwtDecode(token);
          if (decodedToken.admin === true) {
            await axios.get(`${BASE_URL}/commander/${decodedToken.id}`, {
              headers: {
                token: `Bearer ${token}`,
              },
            });
            setIsLoggedIn(true);
            setUserType("admin");
          } else {
            await axios.get(`${BASE_URL}/student/${decodedToken.id}`, {
              headers: {
                token: `Bearer ${token}`,
              },
            });
            setIsLoggedIn(true);
            setUserType("student");
          }
        } catch (error) {
          console.log("Token invalid:", error);
          localStorage.removeItem("token");
        }
      }
    };

    checkToken();
  }, []);

  const handleChangePassword = async (e) => {
    e.preventDefault();

    // Validation
    if (newPassword !== confirmPassword) {
      handleNotify("warning", "Cảnh báo!", "Mật khẩu xác nhận không khớp");
      return;
    }

    if (newPassword.length < 6) {
      handleNotify(
        "warning",
        "Cảnh báo!",
        "Mật khẩu mới phải có ít nhất 6 ký tự"
      );
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const decodedToken = jwtDecode(token);
      await axios.put(
        `${BASE_URL}/user/${decodedToken.id}`,
        {
          password,
          newPassword,
          confirmPassword,
        },
        {
          headers: {
            token: `Bearer ${token}`,
          },
        }
      );
      handleNotify("success", "Thành công!", "Đổi mật khẩu thành công");
      router.push("/login");
    } catch (error) {
      if (error.response) {
        handleNotify("warning", "Cảnh báo!", error.response.data);
      } else {
        handleNotify("danger", "Lỗi!", "Có lỗi xảy ra, vui lòng thử lại");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div
        className="min-h-screen"
        style={{
          background: `linear-gradient(135deg, rgba(15, 23, 42, 0.9) 0%, rgba(30, 58, 138, 0.8) 30%, rgba(79, 70, 229, 0.7) 70%, rgba(147, 51, 234, 0.6) 100%), url('/hvkhqs.jpg')`,
          backgroundSize: "cover",
          backgroundPosition: "center center",
          backgroundRepeat: "no-repeat",
          backgroundAttachment: "fixed",
        }}
      >
        {/* Header */}
        <header className="fixed top-0 w-full z-50 bg-gradient-to-r from-slate-900/95 via-blue-900/90 to-indigo-900/95 backdrop-blur-md border-b border-white/20">
          <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div
                className="flex items-center space-x-2 cursor-pointer"
                onClick={() => router.push("/")}
              >
                <img
                  src="/logo-msa.png"
                  alt="Logo"
                  className="h-12 my-1 transition-all duration-300"
                />
                <span className="text-xl font-bold text-white">
                  HỌC VIỆN KHOA HỌC QUÂN SỰ
                </span>
              </div>
              <div className="hidden md:flex items-center space-x-8">
                <a
                  href="/#features"
                  className="text-white/90 hover:text-white transition-colors font-medium"
                >
                  Tính năng
                </a>
                <a
                  href="/#about"
                  className="text-white/90 hover:text-white transition-colors font-medium"
                >
                  Giới thiệu
                </a>
                <a
                  href="/#contact"
                  className="text-white/90 hover:text-white transition-colors font-medium"
                >
                  Liên hệ
                </a>
                {isLoggedIn ? (
                  <a
                    href={userType === "admin" ? "/admin" : "/users"}
                    className="bg-white text-blue-600 px-4 py-2 rounded-full font-semibold hover:bg-white/90 transition-colors"
                  >
                    Quản lý Học Viên
                  </a>
                ) : (
                  <a
                    href="/"
                    className="bg-white text-blue-600 px-4 py-2 rounded-full font-semibold hover:bg-white/90 transition-colors"
                  >
                    Trang chủ
                  </a>
                )}
              </div>
            </div>
          </nav>
        </header>

        <div className="flex min-h-screen flex-col justify-center px-6 py-12 lg:px-8 pt-28">
          <div className="sm:mx-auto sm:w-full sm:max-w-md">
            {/* Card */}
            <div className="bg-gradient-to-br from-white/95 via-blue-50/90 to-indigo-50/95 backdrop-blur-sm rounded-2xl shadow-xl border border-white/30 p-6">
              {/* Header */}
              <div className="text-center mb-6">
                <div className="mx-auto flex items-center justify-center h-10 w-10 rounded-full bg-blue-100 mb-3">
                  <LockOutlined className="h-4 w-4 text-blue-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-1">
                  Đổi mật khẩu
                </h2>
                <p className="text-gray-600 text-sm">
                  Vui lòng nhập mật khẩu cũ và mật khẩu mới
                </p>
              </div>

              {/* Form */}
              <form className="space-y-4" onSubmit={handleChangePassword}>
                {/* Mật khẩu cũ */}
                <div>
                  <label
                    htmlFor="password"
                    className="block text-sm font-medium leading-6 text-gray-900 transition-colors duration-200"
                  >
                    Mật khẩu cũ
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      name="password"
                      type={showOldPassword ? "text" : "password"}
                      required
                      className="block w-full pl-3 pr-10 py-3 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      placeholder="Nhập mật khẩu cũ"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                      onClick={() => setShowOldPassword(!showOldPassword)}
                    >
                      {showOldPassword ? (
                        <EyeInvisibleOutlined />
                      ) : (
                        <EyeOutlined />
                      )}
                    </button>
                  </div>
                </div>

                {/* Mật khẩu mới */}
                <div>
                  <label
                    htmlFor="newPassword"
                    className="block text-sm font-medium leading-6 text-gray-900 transition-colors duration-200"
                  >
                    Mật khẩu mới
                  </label>
                  <div className="relative">
                    <input
                      id="newPassword"
                      name="newPassword"
                      type={showNewPassword ? "text" : "password"}
                      required
                      className="block w-full pl-3 pr-10 py-3 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      placeholder="Nhập mật khẩu mới"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                    >
                      {showNewPassword ? (
                        <EyeInvisibleOutlined />
                      ) : (
                        <EyeOutlined />
                      )}
                    </button>
                  </div>
                </div>

                {/* Xác nhận mật khẩu mới */}
                <div>
                  <label
                    htmlFor="confirmPassword"
                    className="block text-sm font-medium leading-6 text-gray-900 transition-colors duration-200"
                  >
                    Xác nhận mật khẩu mới
                  </label>
                  <div className="relative">
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      required
                      className="block w-full pl-3 pr-10 py-3 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      placeholder="Nhập lại mật khẩu mới"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                    >
                      {showConfirmPassword ? (
                        <EyeInvisibleOutlined />
                      ) : (
                        <EyeOutlined />
                      )}
                    </button>
                  </div>
                  {confirmPassword && newPassword !== confirmPassword && (
                    <p className="text-xs text-red-500 mt-1">
                      Mật khẩu xác nhận không khớp
                    </p>
                  )}
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="flex w-full justify-center rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-3 py-3 text-sm font-semibold leading-6 text-white shadow-sm hover:from-blue-500 hover:to-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                >
                  {loading ? (
                    <div className="flex items-center">
                      <svg
                        className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Đang xử lý...
                    </div>
                  ) : (
                    "Đổi mật khẩu"
                  )}
                </button>
              </form>

              {/* Back to Login */}
              <div className="mt-4 text-center">
                <button
                  onClick={() => router.back()}
                  className="inline-flex items-center text-sm text-gray-600 hover:text-blue-600 transition-colors"
                >
                  <ArrowLeftOutlined className="mr-1" />
                  Quay lại
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ChangePassword;
