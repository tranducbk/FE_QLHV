"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import axiosInstance from "@/utils/axiosInstance";
import { isAdmin } from "@/utils/roleUtils";
import {
  GraduationCap,
  Users,
  BarChart3,
  Calendar,
  TrendingUp,
  AlertTriangle,
  Bell,
  ArrowRight,
  CheckCircle,
  Star,
  FileText,
  Clock,
  Trophy,
  MessageSquare,
} from "lucide-react";
import { BASE_URL } from "@/configs";

export default function HomePage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userType, setUserType] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const checkToken = async () => {
      try {
        console.log("🔍 Checking token on home page...");

        // Lấy thông tin user từ API
        const userRes = await axiosInstance.get("/user/me");
        const userData = userRes.data;

        console.log("🔍 User data:", userData);

        // Sử dụng utility function để kiểm tra role
        if (isAdmin(userData)) {
          console.log("🔍 User is admin, checking commander...");
          // Kiểm tra commander role
          await axiosInstance.get(`/commander/${userData.id}`);
          setIsLoggedIn(true);
          setUserType("admin");
          console.log("✅ Admin user logged in");
        } else {
          console.log("🔍 User is student, checking student...");
          // Kiểm tra student role
          await axiosInstance.get(`/student/by-user/${userData.id}`);
          setIsLoggedIn(true);
          setUserType("student");
          console.log("✅ Student user logged in");
        }
      } catch (error) {
        console.log(
          "❌ Token check failed:",
          error.response?.status,
          error.message
        );
        // Handle token validation error - axiosInstance sẽ tự động xử lý
        setIsLoggedIn(false);
        setUserType(null);
      }
    };

    checkToken();
  }, []);
  return (
    <div
      className="min-h-screen"
      style={{
        background: `linear-gradient(135deg, rgba(15, 23, 42, 0.9) 0%, rgba(30, 58, 138, 0.8) 30%, rgba(79, 70, 229, 0.7) 70%, rgba(147, 51, 234, 0.6) 100%), url('/hocvien.jpg')`,
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
            <div className="flex items-center space-x-2 hover:cursor-pointer transition-all duration-300 hover:opacity-80">
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
                href="#features"
                className="text-white/90 hover:text-white transition-colors font-medium"
              >
                Tính năng
              </a>
              <a
                href="#about"
                className="text-white/90 hover:text-white transition-colors font-medium"
              >
                Giới thiệu
              </a>
              <a
                href="#contact"
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
                  href="/login"
                  className="bg-white text-blue-600 px-4 py-2 rounded-full font-semibold hover:bg-white/90 transition-colors"
                >
                  Đăng nhập
                </a>
              )}
            </div>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section id="about" className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="text-white">
              <h1 className="text-3xl md:text-5xl font-bold leading-tight mb-6">
                Nền tảng Quản lý{" "}
                <span className="bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
                  Học viên
                </span>
                <br />
                <span className="text-white">Thông minh</span>
              </h1>
              <p className="text-xl text-white/90 mb-8 leading-relaxed">
                Giải pháp công nghệ tiên tiến cho việc quản lý sinh viên toàn
                diện tại Học viện Khoa học Quân sự. Tối ưu hóa quy trình hành
                chính, nâng cao chất lượng đào tạo và trải nghiệm học tập.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <a
                  href={
                    isLoggedIn
                      ? userType === "admin"
                        ? "/admin"
                        : "/users"
                      : "/login"
                  }
                  className="bg-white text-blue-600 px-8 py-4 rounded-full font-semibold hover:bg-white/90 transition-all hover:scale-105 flex items-center justify-center group shadow-lg"
                >
                  {isLoggedIn ? "Quản lý Học Viên" : "Truy cập hệ thống"}
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </a>
                <a
                  href="#features"
                  className="border-2 border-white text-white px-8 py-4 rounded-full font-semibold hover:bg-white hover:text-blue-600 transition-all hover:scale-105 flex items-center justify-center backdrop-blur-sm"
                >
                  Khám phá tính năng
                </a>
              </div>
            </div>
            <div className="relative">
              <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-8 border border-white/20 shadow-2xl">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/20 rounded-2xl p-6 text-center backdrop-blur-sm">
                    <Users className="h-12 w-12 text-white mx-auto mb-2" />
                    <div className="text-2xl font-bold text-white">100+</div>
                    <div className="text-white/80 text-sm">Sinh viên</div>
                  </div>
                  <div className="bg-white/20 rounded-2xl p-6 text-center backdrop-blur-sm">
                    <BarChart3 className="h-12 w-12 text-white mx-auto mb-2" />
                    <div className="text-2xl font-bold text-white">10+</div>
                    <div className="text-white/80 text-sm">Lớp học</div>
                  </div>
                  <div className="bg-white/20 rounded-2xl p-6 text-center backdrop-blur-sm">
                    <CheckCircle className="h-12 w-12 text-white mx-auto mb-2" />
                    <div className="text-2xl font-bold text-white">99%</div>
                    <div className="text-white/80 text-sm">Độ chính xác</div>
                  </div>
                  <div className="bg-white/20 rounded-2xl p-6 text-center backdrop-blur-sm">
                    <Star className="h-12 w-12 text-white mx-auto mb-2" />
                    <div className="text-2xl font-bold text-white">24/7</div>
                    <div className="text-white/80 text-sm">Hỗ trợ</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-gradient-to-br from-blue-100/95 via-indigo-100/90 to-purple-100/95 backdrop-blur-sm rounded-3xl p-8 md:p-12 border border-blue-200/50 shadow-2xl">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-gray-800 mb-4">
                Tính năng vượt trội
              </h2>
              <p className="text-xl text-gray-700 max-w-4xl mx-auto">
                Khám phá hệ sinh thái tính năng toàn diện, được thiết kế để tối
                ưu hóa hiệu quả quản lý giáo dục tại Học viện Khoa học Quân sự
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                {
                  icon: FileText,
                  title: "Quản lý hồ sơ học viên",
                  description:
                    "Hệ thống lưu trữ và quản lý thông tin học viên toàn diện với bảo mật cao và khả năng truy xuất nhanh chóng.",
                  color: "bg-blue-600",
                },
                {
                  icon: BarChart3,
                  title: "Quản lý kết quả học tập",
                  description:
                    "Theo dõi điểm số, xếp loại học tập và quản lý kết quả theo kỳ, năm học với hệ thống báo cáo chi tiết.",
                  color: "bg-emerald-600",
                },
                {
                  icon: Clock,
                  title: "Quản lý thời khóa biểu",
                  description:
                    "Sắp xếp và quản lý thời khóa biểu học tập, lịch thi, hoạt động ngoại khóa một cách khoa học và hiệu quả.",
                  color: "bg-violet-600",
                },
                {
                  icon: TrendingUp,
                  title: "Thống kê & báo cáo",
                  description:
                    "Tạo lập báo cáo thống kê đa chiều về tình hình học tập, khen thưởng và phân tích dữ liệu chuyên sâu.",
                  color: "bg-amber-600",
                },
                {
                  icon: Trophy,
                  title: "Quản lý khen thưởng",
                  description:
                    "Theo dõi và quản lý các danh hiệu khen thưởng, thành tích học tập và hoạt động của học viên.",
                  color: "bg-red-600",
                },
                {
                  icon: MessageSquare,
                  title: "Hệ thống thông báo",
                  description:
                    "Gửi thông báo tự động về kết quả học tập, lịch thi, thay đổi thời khóa biểu đến học viên và phụ huynh.",
                  color: "bg-indigo-600",
                },
              ].map((feature, index) => (
                <div
                  key={index}
                  className="group bg-white/80 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-2 border border-white/70 backdrop-blur-sm"
                >
                  <div
                    className={`${feature.color} w-14 h-14 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg`}
                  >
                    <feature.icon className="h-7 w-7 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-gray-700 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-8 md:p-12 border border-white/20">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-white mb-4">
                Hiệu quả được chứng minh
              </h2>
              <p className="text-xl text-white/90 max-w-3xl mx-auto">
                Những chỉ số thực tế khẳng định độ tin cậy và hiệu quả vượt trội
                của hệ thống
              </p>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
              {[
                {
                  number: "100+",
                  label: "Sinh viên được quản lý",
                  icon: Users,
                },
                {
                  number: "10+",
                  label: "Khoa/Ngành đào tạo",
                  icon: GraduationCap,
                },
                {
                  number: "99%",
                  label: "Độ tin cậy hệ thống",
                  icon: CheckCircle,
                },
                { number: "24/7", label: "Hỗ trợ kỹ thuật", icon: Star },
              ].map((stat, index) => (
                <div key={index} className="text-center group">
                  <div className="bg-white/20 rounded-2xl p-6 mb-4 group-hover:bg-white/30 transition-colors">
                    <stat.icon className="h-12 w-12 text-white mx-auto mb-4" />
                    <div className="text-4xl font-bold text-white mb-2">
                      {stat.number}
                    </div>
                    <div className="text-white/90 font-medium">
                      {stat.label}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer
        id="contact"
        className="bg-black/30 backdrop-blur-sm border-t border-white/20 py-16 px-4 sm:px-6 lg:px-8"
      >
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8 mb-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <img src="/logo-msa.png" alt="Logo" className="h-8 w-8" />
                <span className="text-xl font-bold text-white">
                  Học viện Khoa học Quân sự
                </span>
              </div>
              <p className="text-white/80 leading-relaxed">
                Nền tảng quản lý sinh viên hàng đầu, cung cấp giải pháp công
                nghệ toàn diện cho Học viện Khoa học Quân sự trong kỷ nguyên
                chuyển đổi số.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-white mb-4">
                Điều hướng
              </h3>
              <div className="space-y-2">
                {[
                  {
                    label: isLoggedIn
                      ? "Quản lý Học Viên"
                      : "Truy cập hệ thống",
                    href: isLoggedIn
                      ? userType === "admin"
                        ? "/admin"
                        : "/users"
                      : "/login",
                  },
                  { label: "Tính năng", href: "#features" },
                  { label: "Về chúng tôi", href: "#about" },
                  { label: "Liên hệ", href: "#contact" },
                ].map((link, index) => (
                  <a
                    key={index}
                    href={link.href}
                    className="block text-white/80 hover:text-white transition-colors"
                  >
                    {link.label}
                  </a>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Hỗ trợ</h3>
              <div className="space-y-2 text-white/80">
                <p>Email: support@hvkhqs.edu.vn</p>
                <p>Điện thoại: (+84) 12345678</p>
                <p>
                  Địa chỉ: 322E Lê Trọng Tấn, Phường Phương Liệt, Quận Thanh
                  Xuân, Thành phố Hà Nội
                </p>
              </div>
            </div>
          </div>

          <div className="border-t border-white/20 pt-8 text-center">
            <p className="text-white/60">
              &copy; 2025 Học viện Khoa học Quân sự. Bảo lưu mọi quyền sở hữu
              trí tuệ.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
