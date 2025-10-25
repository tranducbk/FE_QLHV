"use client";

import Link from "next/link";
import { Card, Typography, Alert, Row, Col, Space } from "antd";
import {
  PhoneOutlined,
  MailOutlined,
  UserOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";

const { Title, Text, Paragraph } = Typography;
import { BASE_URL } from "@/configs";

const Contact = () => {
  const contactData = [
    {
      key: "1",
      name: "Bùi Đình Thế",
      position: "Hệ Trưởng",
      phone: "0123456789",
      email: "buidinhthe@gmail.com",
    },
    {
      key: "2",
      name: "Đặng Quốc Hưng",
      position: "Chính Trị Viên",
      phone: "0112233445",
      email: "dangquochung@gmail.com",
    },
    {
      key: "3",
      name: "Phạm Hữu Khôi",
      position: "Phó Hệ Trưởng",
      phone: "0111122222",
      email: "phamhuukhoi@gmail.com",
    },
  ];

  return (
    <div className="contact-page min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 transition-colors duration-300">
      {/* Main container with max width - reduced padding */}
      <div className="max-w-4xl mx-auto px-4 py-4">
        {/* Header - Compact */}
        <div className="text-center mb-6">
          <Link href="/login">
            <div className="inline-block">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full blur-lg opacity-20 dark:opacity-30"></div>
                <img
                  className="relative mx-auto h-20 w-auto drop-shadow-lg"
                  src="/logo-msa.png"
                  alt="Hệ học viên 5"
                />
              </div>
            </div>
          </Link>
          <Title
            level={2}
            className="mt-2 text-gray-900 dark:text-gray-100 transition-colors duration-200"
          >
            LIÊN HỆ
          </Title>
          <Paragraph className="text-gray-600 dark:text-gray-300 transition-colors duration-200 text-sm">
            Thông tin liên hệ với các chỉ huy hệ học viên
          </Paragraph>
        </div>

        {/* Contact Methods - Compact */}
        <Row gutter={[16, 16]} className="mb-6">
          <Col xs={24} lg={12}>
            <Card
              title={
                <Space>
                  <UserOutlined className="text-blue-500 dark:text-blue-400" />
                  <span className="text-gray-900 dark:text-gray-100">
                    Liên hệ trực tiếp
                  </span>
                </Space>
              }
              className="shadow-lg border-0 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm transition-all duration-300 hover:shadow-xl"
            >
              <Paragraph className="text-gray-600 dark:text-gray-300">
                Gặp trực tiếp chỉ huy tại phòng làm việc trong giờ hành chính.
              </Paragraph>
            </Card>
          </Col>

          <Col xs={24} lg={12}>
            <Card
              title={
                <Space>
                  <PhoneOutlined className="text-green-500 dark:text-green-400" />
                  <span className="text-gray-900 dark:text-gray-100">
                    Liên hệ gián tiếp
                  </span>
                </Space>
              }
              className="shadow-lg border-0 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm transition-all duration-300 hover:shadow-xl"
            >
              <Paragraph className="text-gray-600 dark:text-gray-300">
                Gọi điện thoại, nhắn tin hoặc gửi email theo thông tin bên dưới.
              </Paragraph>
            </Card>
          </Col>
        </Row>

        {/* Contact List - Compact */}
        <div className="space-y-3">
          {contactData.map((contact) => (
            <div
              key={contact.key}
              className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-lg p-4 shadow-md border border-gray-200 dark:border-gray-700"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                    <UserOutlined className="text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                      {contact.name}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {contact.position}
                    </p>
                  </div>
                </div>
                <div className="flex space-x-4">
                  <a
                    href={`tel:${contact.phone}`}
                    className="flex items-center text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 transition-colors"
                  >
                    <PhoneOutlined className="mr-1" />
                    <span className="text-sm">{contact.phone}</span>
                  </a>
                  <a
                    href={`mailto:${contact.email}`}
                    className="flex items-center text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                  >
                    <MailOutlined className="mr-1" />
                    <span className="text-sm">{contact.email}</span>
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Important Notice - Ultra Compact */}
        <div className="mt-4">
          <div className="bg-orange-50 dark:bg-amber-900/20 border border-orange-200 dark:border-amber-700 rounded-lg p-3">
            <div className="flex items-start">
              <ClockCircleOutlined className="text-orange-600 dark:text-orange-400 mt-0.5 mr-2 flex-shrink-0" />
              <div>
                <p className="text-sm text-orange-800 dark:text-orange-200 font-medium mb-1">
                  Lưu ý quan trọng
                </p>
                <p className="text-xs text-orange-700 dark:text-orange-300">
                  Không nên gọi điện hoặc gặp trực tiếp vào giờ ngủ trưa, ngủ
                  tối, không phải giờ làm việc nếu không phải công việc cấp
                  bách, quan trọng!
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Back to Login - Compact */}
        <div className="text-center mt-6">
          <Link
            href="/login"
            className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-500 dark:to-indigo-500 text-white font-medium rounded-lg hover:from-blue-500 hover:to-indigo-400 dark:hover:from-blue-400 dark:hover:to-indigo-400 transition-all duration-200 shadow-md hover:shadow-lg"
          >
            <UserOutlined className="mr-2" />
            Quay lại đăng nhập
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Contact;
