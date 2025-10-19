"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { jwtDecode } from "jwt-decode";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  MailOutlined,
  ArrowLeftOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
} from "@ant-design/icons";
import { BASE_URL } from "@/configs";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [correct, setCorrect] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
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
            router.push("/admin");
          } else {
            await axios.get(`${BASE_URL}/student/${decodedToken.id}`, {
              headers: {
                token: `Bearer ${token}`,
              },
            });
            router.push("/users");
          }
        } catch (error) {
          console.log(error);
        }
      }
    };

    checkToken();
  }, []);

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await axios.post(`${BASE_URL}/user/forgot-password`, {
        email,
      });
      setCorrect(true);
    } catch (error) {
      if (error.response) {
        setError(error.response.data);
      } else {
        console.log(error);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
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
              className="flex items-center space-x-2"
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

      {/* Main container */}
      <div className="flex min-h-screen flex-col justify-center px-6 py-16 lg:px-8 pt-28">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          {/* Loading overlay */}
          {loading && (
            <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center">
              <div className="bg-white rounded-lg p-6 shadow-xl">
                <div className="flex items-center space-x-3">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                  <span className="text-gray-700">Đang gửi email...</span>
                </div>
              </div>
            </div>
          )}

          {/* Card */}
          <div className="bg-gradient-to-br from-white/95 via-blue-50/90 to-indigo-50/95 backdrop-blur-sm rounded-2xl shadow-xl border border-white/30 p-8">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 mb-4">
                <MailOutlined className="h-4 w-4 text-blue-600" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                Quên mật khẩu
              </h2>
              <p className="text-gray-600">
                Nhập email của bạn để nhận link đặt lại mật khẩu
              </p>
            </div>

            {/* Form */}
            <form className="space-y-6" onSubmit={handleForgotPassword}>
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Địa chỉ email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 w-10 flex items-center justify-center pointer-events-none">
                    <MailOutlined className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="email"
                    name="email"
                    readOnly={correct}
                    type="email"
                    autoComplete="email"
                    required
                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    placeholder="example@email.com"
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              {/* Error message */}
              {error && (
                <div className="flex items-center p-4 text-sm text-red-800 bg-red-50 border border-red-200 rounded-lg">
                  <ExclamationCircleOutlined className="mr-2 text-red-500" />
                  {error}
                </div>
              )}

              {/* Success message */}
              {correct && (
                <div className="flex items-center p-4 text-sm text-green-800 bg-green-50 border border-green-200 rounded-lg">
                  <CheckCircleOutlined className="mr-2 text-green-500" />
                  Vui lòng kiểm tra email của bạn và làm theo hướng dẫn!
                </div>
              )}

              {/* Submit button */}
              <div>
                {!correct && (
                  <button
                    type="submit"
                    disabled={loading}
                    className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
                  >
                    {loading ? (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Đang gửi...
                      </div>
                    ) : (
                      "Gửi link đặt lại mật khẩu"
                    )}
                  </button>
                )}
              </div>
            </form>

            {/* Back to login */}
            <div className="mt-6 text-center">
              <Link
                href="/login"
                className="inline-flex items-center text-sm text-blue-600 hover:text-blue-500 transition-colors duration-200"
              >
                <ArrowLeftOutlined className="mr-1" />
                Quay lại đăng nhập
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
