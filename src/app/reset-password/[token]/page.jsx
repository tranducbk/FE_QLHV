"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { jwtDecode } from "jwt-decode";
import { useRouter } from "next/navigation";
import { handleNotify } from "../../../components/notify";
import { BASE_URL } from "@/configs";
import {
  Form,
  Input,
  Button,
  Card,
  Typography,
  Divider,
  Alert,
  ConfigProvider,
  theme,
} from "antd";
import {
  LockOutlined,
  SafetyOutlined,
  ArrowLeftOutlined,
  EyeInvisibleOutlined,
  EyeOutlined,
} from "@ant-design/icons";
import Link from "next/link";

const { Title, Text } = Typography;
const { Password } = Input;

const ResetPassword = ({ params }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [tokenValid, setTokenValid] = useState(true);
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
          handleNotify("danger", "", error);
        }
      }
    };

    checkToken();
  }, []);

  const handleResetPassword = async (values) => {
    setLoading(true);
    try {
      await axios.post(`${BASE_URL}/user/reset-password/${params.token}`, {
        newPassword: values.newPassword,
        confirmPassword: values.confirmPassword,
      });
      handleNotify("success", "Thành công!", "Đặt lại mật khẩu thành công");
      router.push("/login");
    } catch (error) {
      if (error.response) {
        if (error.response.status === 400) {
          setTokenValid(false);
        } else {
          handleNotify("warning", "Cảnh báo!", error.response.data);
        }
      } else {
        handleNotify("danger", "Lỗi!", error);
      }
    } finally {
      setLoading(false);
    }
  };

  const cardStyle = {
    background: "rgba(255, 255, 255, 0.95)",
    backdropFilter: "blur(20px)",
    border: "1px solid rgba(255, 255, 255, 0.3)",
    boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.15)",
  };

  if (!tokenValid) {
    return (
      <ConfigProvider
        theme={{
          algorithm: theme.defaultAlgorithm,
          token: {
            colorPrimary: "#3b82f6",
            borderRadius: 8,
          },
        }}
      >
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

          <div className="h-screen flex items-center justify-center p-4 transition-all duration-300 pt-24">
            <Card
              className="w-full max-w-md border-0 transition-all duration-300"
              style={{
                background:
                  "linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(239, 246, 255, 0.9) 50%, rgba(238, 242, 255, 0.95) 100%)",
                backdropFilter: "blur(20px)",
                border: "1px solid rgba(255, 255, 255, 0.3)",
                boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.15)",
              }}
            >
              <div className="text-center">
                <div className="mb-6">
                  <SafetyOutlined className="text-6xl text-red-500" />
                </div>
                <Title level={3} className="text-red-600 mb-4">
                  Token không hợp lệ
                </Title>
                <Text className="text-gray-600 mb-6 block">
                  Link đặt lại mật khẩu đã hết hạn hoặc không hợp lệ. Vui lòng
                  yêu cầu link mới.
                </Text>
                <Link href="/forgot-password">
                  <Button
                    type="primary"
                    size="large"
                    icon={<ArrowLeftOutlined />}
                    className="h-12 px-8"
                  >
                    Quay lại trang quên mật khẩu
                  </Button>
                </Link>
              </div>
            </Card>
          </div>
        </div>
      </ConfigProvider>
    );
  }

  return (
    <ConfigProvider
      theme={{
        algorithm: theme.defaultAlgorithm,
        token: {
          colorPrimary: "#3b82f6",
          borderRadius: 8,
        },
      }}
    >
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
              <div className="flex items-center space-x-2">
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

        <div className="h-screen flex items-center justify-center p-4 transition-all duration-300 pt-24">
          <Card
            className="w-full max-w-md border-0 transition-all duration-300"
            style={cardStyle}
          >
            <div className="text-center mb-6">
              <div className="mb-4">
                <img
                  src="/image.png"
                  alt="Logo"
                  className="h-14 mx-auto mb-3 transition-all duration-300"
                />
              </div>
              <Title
                level={2}
                className="text-gray-800 mb-2 transition-colors duration-300"
              >
                Đặt lại mật khẩu
              </Title>
              <Text className="text-gray-600 transition-colors duration-300">
                Nhập mật khẩu mới của bạn
              </Text>
            </div>

            <Alert
              message="Lưu ý"
              description="Mật khẩu phải có ít nhất 6 ký tự và nên bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt."
              type="info"
              showIcon
              className="mb-4 transition-all duration-300"
            />

            <Form
              form={form}
              layout="vertical"
              onFinish={handleResetPassword}
              size="large"
              className="transition-all duration-300"
            >
              <Form.Item
                name="newPassword"
                label={
                  <span className="text-gray-700 transition-colors duration-300">
                    Mật khẩu mới
                  </span>
                }
                rules={[
                  { required: true, message: "Vui lòng nhập mật khẩu mới!" },
                  { min: 6, message: "Mật khẩu phải có ít nhất 6 ký tự!" },
                ]}
              >
                <Password
                  prefix={<LockOutlined className="text-gray-400" />}
                  placeholder="Nhập mật khẩu mới"
                  className="h-11 transition-all duration-300"
                  iconRender={(visible) =>
                    visible ? (
                      <EyeOutlined className="text-gray-400" />
                    ) : (
                      <EyeInvisibleOutlined />
                    )
                  }
                />
              </Form.Item>

              <Form.Item
                name="confirmPassword"
                label={
                  <span className="text-gray-700 transition-colors duration-300">
                    Xác nhận mật khẩu
                  </span>
                }
                dependencies={["newPassword"]}
                rules={[
                  { required: true, message: "Vui lòng xác nhận mật khẩu!" },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || getFieldValue("newPassword") === value) {
                        return Promise.resolve();
                      }
                      return Promise.reject(new Error("Mật khẩu không khớp!"));
                    },
                  }),
                ]}
              >
                <Password
                  prefix={<LockOutlined className="text-gray-400" />}
                  placeholder="Nhập lại mật khẩu mới"
                  className="h-11 transition-all duration-300"
                  iconRender={(visible) =>
                    visible ? (
                      <EyeOutlined className="text-gray-400" />
                    ) : (
                      <EyeInvisibleOutlined />
                    )
                  }
                />
              </Form.Item>

              <Form.Item className="mb-3">
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={loading}
                  className="w-full h-11 text-base font-medium transition-all duration-300"
                >
                  {loading ? "Đang xử lý..." : "Đặt lại mật khẩu"}
                </Button>
              </Form.Item>
            </Form>

            <Divider className="my-4 transition-all duration-300">
              <Text className="text-gray-500 transition-colors duration-300">
                hoặc
              </Text>
            </Divider>

            <div className="text-center">
              <Link href="/login">
                <Button
                  type="link"
                  icon={<ArrowLeftOutlined />}
                  className="text-blue-600 hover:text-blue-700 transition-colors duration-300"
                >
                  Quay lại trang đăng nhập
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </ConfigProvider>
  );
};

export default ResetPassword;
