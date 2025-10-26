"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { handleNotify } from "../../components/notify";
import { Input } from "antd";
import axiosInstance from "@/utils/axiosInstance";
import { getRedirectPath } from "@/utils/roleUtils";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const res = await axiosInstance.post(`/user/login`, {
        username,
        password,
      });

      const { user } = res.data;

      console.log("🔐 Login successful, user data:", user);
      console.log("🔐 Response headers:", res.headers);
      console.log("🔐 Cookies should be set by backend");

      handleNotify("success", "Thành công!", "Đăng nhập thành công");

      // Redirect ngay lập tức theo role
      console.log("User data:", user); // Debug log

      const redirectPath = getRedirectPath(user);
      console.log("Redirecting to:", redirectPath); // Debug log

      router.replace(redirectPath);
    } catch (error) {
      console.error("Login error:", error); // Debug log

      if (error.response) {
        const errorMessage =
          error.response.data?.message ||
          error.response.data ||
          "Tài khoản hoặc mật khẩu không đúng!";
        handleNotify("warning", "Cảnh báo!", errorMessage);
      } else {
        handleNotify("danger", "Lỗi!", error.message || "Có lỗi xảy ra");
      }
    } finally {
      setIsLoading(false);
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
        <header className="fixed top-0 w-full z-50 bg-gradient-to-r from-slate-900/95 via-blue-900/90 to-indigo-900/95 backdrop-blur-md border-b border-white/20">
          <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div
                className="flex items-center space-x-2 hover:cursor-pointer transition-all duration-300 hover:opacity-80"
                onClick={() => router.push("/")}
              >
                <img
                  src="/logo-msa.png"
                  alt="Logo"
                  className="h-12 my-1 transition-all duration-300 hover:scale-105 hover:cursor-pointer"
                />
                <span className="text-xl font-bold text-white hover:cursor-pointer transition-all duration-300 hover:text-blue-200">
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
                <a
                  href="/"
                  className="bg-white text-blue-600 px-4 py-2 rounded-full font-semibold hover:bg-white/90 transition-colors"
                >
                  Trang chủ
                </a>
              </div>
            </div>
          </nav>
        </header>

        {/* Main content */}
        <div className="flex min-h-screen flex-col justify-center px-6 py-12 lg:px-8 pt-24">
          <div className="sm:mx-auto sm:w-full sm:max-w-md">
            {/* Title */}
            <h2 className="mt-8 text-center text-3xl font-bold leading-9 tracking-tight text-white transition-colors duration-200">
              Đăng nhập
            </h2>
            <p className="mt-2 text-center text-sm text-white/90 transition-colors duration-200">
              Chào mừng bạn đến với hệ thống quản lý học viên - HVKHQS
            </p>
          </div>

          <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
            {/* Login card */}
            <div className="bg-gradient-to-br from-white/95 via-blue-50/90 to-indigo-50/95 backdrop-blur-sm py-8 px-6 shadow-xl rounded-2xl border border-white/30 transition-all duration-300 hover:shadow-2xl">
              <form className="space-y-6" onSubmit={handleLogin}>
                <div>
                  <label
                    htmlFor="username"
                    className="block text-sm font-medium leading-6 text-gray-900 transition-colors duration-200"
                  >
                    Tên đăng nhập
                  </label>
                  <div className="mt-2">
                    <Input
                      id="username"
                      name="username"
                      type="text"
                      autoComplete="username"
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Nhập tên đăng nhập"
                      className="w-full"
                      size="large"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <label
                      htmlFor="password"
                      className="block text-sm font-medium leading-6 text-gray-900 transition-colors duration-200"
                    >
                      Mật khẩu
                    </label>
                    <div className="text-sm">
                      <Link
                        href="/forgot-password"
                        tabIndex={-1}
                        className="font-semibold text-blue-600 hover:text-blue-500 transition-colors duration-200"
                      >
                        Quên mật khẩu?
                      </Link>
                    </div>
                  </div>
                  <div className="mt-2">
                    <Input.Password
                      id="password"
                      name="password"
                      autoComplete="current-password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Nhập mật khẩu"
                      className="w-full"
                      size="large"
                    />
                  </div>
                </div>

                <div>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="flex w-full justify-center rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-3 py-3 text-sm font-semibold leading-6 text-white shadow-sm hover:from-blue-500 hover:to-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                  >
                    {isLoading ? (
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
                        Đang đăng nhập...
                      </div>
                    ) : (
                      "Đăng nhập"
                    )}
                  </button>
                </div>
              </form>

              <div className="mt-6">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="bg-gradient-to-br from-white/95 via-blue-50/90 to-indigo-50/95 px-2 text-gray-500 transition-colors duration-200">
                      Cần hỗ trợ?
                    </span>
                  </div>
                </div>

                <p className="mt-6 text-center text-sm text-gray-600 transition-colors duration-200">
                  Bạn chưa có tài khoản?{" "}
                  <Link
                    href="/contact"
                    className="font-semibold leading-6 text-blue-600 hover:text-blue-500 transition-colors duration-200"
                  >
                    Liên hệ với quản trị viên
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Login;
