"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  MailOutlined,
  ArrowLeftOutlined,
  ExclamationCircleOutlined,
} from "@ant-design/icons";
import axiosInstance from "@/utils/axiosInstance";

const ForgotPassword = () => {
  const router = useRouter();

  useEffect(() => {
    const checkToken = async () => {
      try {
        // Lấy thông tin user từ API
        const userRes = await axiosInstance.get("/user/me");
        const userData = userRes.data;

        if (userData.admin === true) {
          // Kiểm tra commander role
          await axiosInstance.get(`/commander/${userData.id}`);
          router.push("/admin");
        } else {
          // Kiểm tra student role
          await axiosInstance.get(`/student/by-user/${userData.id}`);
          router.push("/users");
        }
      } catch (error) {
        // Handle token validation error - axiosInstance sẽ tự động xử lý
      }
    };

    checkToken();
  }, []);

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

      {/* Main container */}
      <div className="flex min-h-screen flex-col justify-center px-6 py-16 lg:px-8 pt-28">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
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
                Vui lòng liên hệ với phòng CNTT của HVKHQS để được cấp lại mật
                khẩu
              </p>
            </div>

            {/* Contact Information */}
            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center h-10 w-10 rounded-full bg-blue-100">
                      <MailOutlined className="h-5 w-5 text-blue-600" />
                    </div>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Thông tin liên hệ
                    </h3>
                    <div className="space-y-2 text-sm text-gray-600">
                      <p>
                        <strong>Phòng CNTT - HVKHQS</strong>
                      </p>
                      <p>📧 Email: cntt@hvkhqs.edu.vn</p>
                      <p>📞 Điện thoại: (024) 1234-5678</p>
                      <p>📍 Địa chỉ: Phòng 101, Tầng 1, Tòa nhà A</p>
                      <p>🕒 Giờ làm việc: 8:00 - 17:00 (Thứ 2 - Thứ 6)</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start">
                  <ExclamationCircleOutlined className="h-5 w-5 text-yellow-600 mt-0.5 mr-3" />
                  <div>
                    <h4 className="text-sm font-medium text-yellow-800 mb-1">
                      Lưu ý quan trọng
                    </h4>
                    <p className="text-sm text-yellow-700">
                      Khi liên hệ, vui lòng cung cấp thông tin: Họ tên, Mã học
                      viên, Email đăng ký để được hỗ trợ nhanh chóng.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Button */}
            <div className="mt-6">
              <a
                href="mailto:cntt@hvkhqs.edu.vn?subject=Yêu cầu cấp lại mật khẩu&body=Xin chào phòng CNTT,%0D%0A%0D%0ATôi là học viên của HVKHQS và cần được cấp lại mật khẩu.%0D%0A%0D%0AThông tin của tôi:%0D%0A- Họ tên: %0D%0A- Mã học viên: %0D%0A- Email đăng ký: %0D%0A%0D%0AXin cảm ơn!"
                className="w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                📧 Liên hệ ngay với phòng CNTT
              </a>
            </div>

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
