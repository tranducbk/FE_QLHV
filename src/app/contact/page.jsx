"use client";

import Link from "next/link";
import { Card, Table, Typography, Divider, Alert, Row, Col, Space } from "antd";
import {
  PhoneOutlined,
  MailOutlined,
  UserOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";
import { ThemeToggle } from "../../components/ThemeToggle";

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
      name: "Nguyễn Văn Y",
      position: "Chính Trị Viên",
      phone: "0112233445",
      email: "nguyenvany@gmail.com",
    },
    {
      key: "3",
      name: "Phạm Hữu Khôi",
      position: "Phó Hệ Trưởng",
      phone: "0111122222",
      email: "phamhuukhoi@gmail.com",
    },
  ];

  const columns = [
    {
      title: "Tên chỉ huy",
      dataIndex: "name",
      key: "name",
      render: (text) => (
        <Space>
          <UserOutlined className="text-blue-500 dark:text-blue-400" />
          <span className="font-medium text-gray-900 dark:text-gray-100">
            {text}
          </span>
        </Space>
      ),
    },
    {
      title: "Chức vụ",
      dataIndex: "position",
      key: "position",
      render: (text) => (
        <span className="text-gray-600 dark:text-gray-300">{text}</span>
      ),
    },
    {
      title: "Số điện thoại",
      dataIndex: "phone",
      key: "phone",
      render: (text) => (
        <Space>
          <PhoneOutlined className="text-green-500 dark:text-green-400" />
          <span className="font-mono text-gray-900 dark:text-gray-100">
            {text}
          </span>
        </Space>
      ),
    },
    {
      title: "Địa chỉ email",
      dataIndex: "email",
      key: "email",
      render: (text) => (
        <Space>
          <MailOutlined className="text-blue-500 dark:text-blue-400" />
          <span className="font-mono text-sm text-gray-900 dark:text-gray-100">
            {text}
          </span>
        </Space>
      ),
    },
  ];

  return (
    <div className="contact-page min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 transition-colors duration-300">
      {/* Theme toggle button */}
      <div className="fixed top-6 right-6 z-50">
        <ThemeToggle />
      </div>

      {/* Main container with max width */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/login">
            <div className="inline-block">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full blur-lg opacity-20 dark:opacity-30"></div>
                <img
                  className="relative mx-auto h-28 w-auto drop-shadow-lg"
                  src="/logo-msa.png"
                  alt="Hệ học viên 5"
                />
              </div>
            </div>
          </Link>
          <Title
            level={1}
            className="mt-2 text-gray-900 dark:text-gray-100 transition-colors duration-200"
          >
            LIÊN HỆ
          </Title>
          <Paragraph className="text-gray-600 dark:text-gray-300 transition-colors duration-200">
            Thông tin liên hệ với các chỉ huy hệ học viên
          </Paragraph>
        </div>

        {/* Contact Methods */}
        <Row gutter={[24, 24]} className="mb-8">
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

        {/* Contact Table */}
        <Card
          title={
            <span className="text-gray-900 dark:text-gray-100">
              Danh sách liên hệ
            </span>
          }
          className="shadow-lg border-0 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm transition-all duration-300"
        >
          <div className="overflow-x-auto">
            <Table
              columns={columns}
              dataSource={contactData}
              pagination={false}
              className="contact-table"
              scroll={{ x: 600 }}
            />
          </div>
        </Card>

        {/* Important Notice */}
        <div className="mt-8">
          <Alert
            message={
              <span className="text-amber-800 dark:text-amber-200 font-medium">
                Lưu ý quan trọng
              </span>
            }
            description={
              <div className="space-y-2">
                <Paragraph className="mb-0 text-red-600 dark:text-red-400">
                  <ClockCircleOutlined className="mr-2" />
                  Không nên gọi điện hoặc gặp trực tiếp vào giờ ngủ trưa, ngủ
                  tối, không phải giờ làm việc nếu không phải công việc cấp
                  bách, quan trọng!
                </Paragraph>
                <Paragraph className="mb-0 text-gray-600 dark:text-gray-400 text-sm">
                  Vui lòng tôn trọng thời gian nghỉ ngơi của các chỉ huy.
                </Paragraph>
              </div>
            }
            type="warning"
            showIcon
            className="shadow-lg border-0 bg-orange-50 dark:bg-amber-900/20 transition-all duration-300"
          />
        </div>

        {/* Back to Login */}
        <div className="text-center mt-8">
          <Link
            href="/login"
            className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-500 dark:to-indigo-500 text-white font-medium rounded-lg hover:from-blue-500 hover:to-indigo-400 dark:hover:from-blue-400 dark:hover:to-indigo-400 transition-all duration-200 shadow-lg hover:shadow-xl"
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
