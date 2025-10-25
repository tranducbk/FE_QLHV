"use client";

import { jwtDecode } from "jwt-decode";
import axios from "axios";
import dayjs from "dayjs";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  BellOutlined,
  UserOutlined,
  LogoutOutlined,
  SettingOutlined,
  MenuOutlined,
  CloseOutlined,
  DownOutlined,
  BulbOutlined,
} from "@ant-design/icons";
import {
  Layout,
  Avatar,
  Dropdown,
  Badge,
  Button,
  Menu,
  Typography,
  Space,
  Divider,
  Card,
  Tag,
  theme,
  Drawer,
} from "antd";
import TabNotification from "./tabNotification";
import { ThemeToggle } from "./ThemeToggle";
import { useThemeContext } from "./ThemeProvider";
import { BASE_URL } from "@/configs";

const { Header: AntHeader } = Layout;
const { Text, Title } = Typography;

const Header = () => {
  const [user, setUser] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const [userDetail, setUserDetail] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [documents, setDocuments] = useState([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const router = useRouter();
  const frameRef = useRef(null);
  const { token: themeToken } = theme.useToken();
  const { theme: currentTheme } = useThemeContext();

  // Helper function để check admin (xử lý cả boolean và string)
  const checkIsAdmin = () => {
    return (
      userDetail?.isAdmin === true ||
      userDetail?.isAdmin === "TRUE" ||
      user?.isAdmin === true ||
      user?.isAdmin === "TRUE" ||
      userDetail?.role === "ADMIN" ||
      userDetail?.role === "SUPER_ADMIN" ||
      user?.role === "ADMIN" ||
      user?.role === "SUPER_ADMIN"
    );
  };

  useEffect(() => {
    // Chỉ fetch notifications nếu đã có thông tin user
    if (user !== null) {
      fetchDocuments();
      const interval = setInterval(fetchDocuments, 50000);
      return () => clearInterval(interval);
    }
  }, [user]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mediaQuery = window.matchMedia("(min-width: 768px)");
    const updateMatch = () => setIsDesktop(mediaQuery.matches);
    updateMatch();
    mediaQuery.addEventListener("change", updateMatch);
    return () => mediaQuery.removeEventListener("change", updateMatch);
  }, []);

  const fetchDocuments = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const decodedToken = jwtDecode(token);

      // CHỈ fetch notifications cho student
      // Admin sẽ nhận thông báo từ hệ thống khác (khi student cập nhật data)
      if (!checkIsAdmin()) {
        const res = await axios.get(
          `${BASE_URL}/commander/studentNotifications/${decodedToken.id}`,
          {
            headers: {
              token: `Bearer ${token}`,
            },
          }
        );
        setDocuments(res.data || []);
      } else {
        // TODO: Implement admin notifications
        // Admin sẽ nhận thông báo khi:
        // - Student cập nhật học phí
        // - Student cập nhật kết quả học tập
        // - Student cập nhật thông tin cá nhân
        setDocuments([]);
      }
    } catch (error) {
      // Handle error silently
      setDocuments([]);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (frameRef.current && !frameRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    fetchData();
    fetchUserDetail();
  }, []);

  const fetchUserDetail = async () => {
    const token = localStorage.getItem("token");

    if (token) {
      try {
        const decodedToken = jwtDecode(token);
        if (decodedToken.admin === true) {
          const res = await axios.get(
            `${BASE_URL}/commander/${decodedToken.id}`,
            {
              headers: {
                token: `Bearer ${token}`,
              },
            }
          );

          setUserDetail(res.data);
        } else {
          // Get studentId from userId first
          const studentRes = await axios.get(
            `${BASE_URL}/student/by-user/${decodedToken.id}`,
            {
              headers: {
                token: `Bearer ${token}`,
              },
            }
          );

          const res = await axios.get(
            `${BASE_URL}/student/${studentRes.data.id}`,
            {
              headers: {
                token: `Bearer ${token}`,
              },
            }
          );

          setUserDetail(res.data);
        }
      } catch (error) {
        // Handle error silently
      }
    }
  };

  const fetchData = async () => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const decodedToken = jwtDecode(token);

        const res = await axios.get(`${BASE_URL}/user/${decodedToken.id}`, {
          headers: {
            token: `Bearer ${token}`,
          },
        });

        setUser(res.data);
        // Response received
      } catch (error) {
        // Handle error silently
      }
    }
  };

  const handleLogout = async () => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        await axios.post(`${BASE_URL}/user/logout`, null, {
          headers: {
            token: `Bearer ${token}`,
          },
        });

        localStorage.removeItem("token");
        router.push("/login");
      } catch (error) {
        // Handle error silently
      }
    }
  };

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  const handleDropdownClick = () => {
    setDropdownOpen(!dropdownOpen);
  };

  const handleOutsideClick = () => {
    setDropdownOpen(false);
  };

  const handleUpdateIsRead = async (e, notificationId, notification) => {
    e.preventDefault();
    const token = localStorage.getItem("token");

    if (token) {
      try {
        const decodedToken = jwtDecode(token);
        const isAdmin = checkIsAdmin();

        // Đánh dấu đã đọc
        await axios.put(
          `${BASE_URL}/commander/notification/${decodedToken.id}/${notificationId}`,
          { isRead: true },
          {
            headers: {
              token: `Bearer ${token}`,
            },
          }
        );

        setDocuments((prevDocs) =>
          prevDocs.map((doc) =>
            doc.id === notificationId ? { ...doc, isRead: true } : doc
          )
        );

        setDropdownOpen(false);

        // Điều hướng thông minh dựa trên role (ADMIN hoặc USER)
        let targetUrl = isAdmin ? "/admin" : "/users"; // Default

        if (notification?.link) {
          // Nếu có link từ backend, điều chỉnh dựa vào role hiện tại
          // Backend lưu link với /users, nhưng frontend cần chuyển đổi cho đúng role
          let backendLink = notification.link;

          // Nếu là admin và link bắt đầu bằng /users, chuyển thành /admin
          if (isAdmin && backendLink.startsWith("/users")) {
            // Mapping các route từ user sang admin
            if (backendLink.includes("/semester-results")) {
              targetUrl = backendLink.replace(
                "/users/semester-results",
                "/admin/learning-results"
              );
            } else if (backendLink.includes("/tuition-fee")) {
              targetUrl = backendLink.replace(
                "/users/tuition-fee",
                "/admin/tuition-fees"
              );
            } else if (backendLink.includes("/yearly-statistics")) {
              targetUrl = backendLink.replace(
                "/users/yearly-statistics",
                "/admin/yearly-statistics"
              );
            } else if (backendLink.includes("/time-table")) {
              targetUrl = backendLink.replace(
                "/users/time-table",
                "/admin/time-table"
              );
            } else if (backendLink.includes("/cut-rice")) {
              targetUrl = backendLink.replace(
                "/users/cut-rice",
                "/admin/cut-rice"
              );
            } else if (backendLink.includes("/commander-duty-schedule")) {
              targetUrl = backendLink.replace(
                "/users/commander-duty-schedule",
                "/admin/commander-duty-schedule"
              );
            } else if (backendLink.includes("/achievement")) {
              targetUrl = backendLink.replace(
                "/users/achievement",
                "/admin/achievement"
              );
            } else if (backendLink.match(/^\/users\/\d+$/)) {
              // Pattern: /users/{id} -> /admin/{id}
              targetUrl = backendLink.replace("/users/", "/admin/");
            } else if (backendLink === "/users") {
              targetUrl = "/admin";
            } else {
              // Các route khác giữ nguyên hoặc về trang chính
              targetUrl = "/admin";
            }
          } else {
            // Giữ nguyên link nếu là user hoặc link đã đúng
            targetUrl = backendLink;
          }
        } else if (notification?.type) {
          // Map type sang URL tương ứng theo role
          const baseRoute = isAdmin ? "/admin" : "/users";

          switch (notification.type) {
            case "new_semester":
            case "semester_result":
            case "learning_result":
              // Kết quả học tập
              targetUrl = isAdmin
                ? "/admin/learning-results"
                : "/users/semester-results";
              break;
            case "update_info":
            case "profile_update":
              // Thông tin cá nhân
              targetUrl = `${baseRoute}/${decodedToken.id}`;
              break;
            case "tuition_fee":
            case "payment":
              // Học phí
              targetUrl = isAdmin
                ? "/admin/tuition-fees"
                : "/users/tuition-fee";
              break;
            case "party_rating":
              // Xếp loại Đảng viên
              targetUrl = isAdmin
                ? "/admin/party-rating"
                : "/users/yearly-statistics";
              break;
            case "training_rating":
              // Xếp loại rèn luyện
              targetUrl = isAdmin
                ? "/admin/training-rating"
                : "/users/yearly-statistics";
              break;
            case "yearly_statistics":
              // Thống kê theo năm
              targetUrl = isAdmin
                ? "/admin/yearly-statistics"
                : "/users/yearly-statistics";
              break;
            case "time_table":
            case "schedule":
              // Thời khóa biểu / Lịch học
              targetUrl = isAdmin ? "/admin/time-table" : "/users/time-table";
              break;
            case "cut_rice":
            case "meal":
              // Cắt cơm
              targetUrl = isAdmin ? "/admin/cut-rice" : "/users/cut-rice";
              break;
            case "commander_duty":
            case "duty_schedule":
              // Lịch trực chỉ huy
              targetUrl = `${baseRoute}/commander-duty-schedule`;
              break;
            case "achievement":
            case "award":
              // Khen thưởng
              targetUrl = `${baseRoute}/achievement`;
              break;
            case "regulation":
            case "regulatory_regime":
              // Chế độ quy định (chỉ user có)
              targetUrl = isAdmin ? baseRoute : "/users/regulatory-regime";
              break;
            case "semester_management":
              // Quản lý kì học (chỉ admin có)
              targetUrl = isAdmin ? "/admin/semester-management" : baseRoute;
              break;
            case "list_user":
            case "student_management":
              // Danh sách học viên (chỉ admin có)
              targetUrl = isAdmin ? "/admin/list-user" : baseRoute;
              break;
            case "statistical":
              // Thống kê (chỉ admin có)
              targetUrl = isAdmin ? "/admin/statistical" : baseRoute;
              break;
            default:
              // Mặc định về trang tổng quan
              targetUrl = baseRoute;
          }
        }

        router.push(targetUrl);
      } catch (error) {
        // Handle error silently
      }
    }
  };

  const unreadCount = Array.isArray(documents)
    ? documents.filter((doc) => !doc.isRead).length
    : 0;

  const userMenuItems = [
    {
      key: "profile",
      icon: <UserOutlined className="text-gray-700 dark:text-gray-300" />,
      label: (
        <Link
          href={checkIsAdmin() ? `/admin/${user?.id}` : `/users/${user?.id}`}
          className="text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 block w-full"
        >
          <Space direction="vertical" size={0}>
            <Text strong className="text-gray-900 dark:text-white">
              {userDetail?.fullName || "Thông tin cá nhân"}
            </Text>
            <Text
              type="secondary"
              style={{ fontSize: "12px" }}
              className="text-gray-600 dark:text-gray-400"
            >
              {userDetail?.email}
            </Text>
          </Space>
        </Link>
      ),
      className: "hover:bg-gray-50 dark:hover:bg-gray-700",
    },
    {
      type: "divider",
      className: "border-gray-200 dark:border-gray-600",
    },
    {
      key: "settings",
      icon: <SettingOutlined className="text-gray-700 dark:text-gray-300" />,
      label: (
        <Link
          href="/change-password"
          className="!text-gray-900 dark:!text-white hover:!text-blue-600 dark:hover:!text-blue-400 block w-full"
        >
          Đổi mật khẩu
        </Link>
      ),
      className: "hover:bg-gray-50 dark:hover:bg-gray-700",
    },
    {
      key: "theme",
      icon: <BulbOutlined className="text-gray-700 dark:text-gray-300" />,
      label: (
        <div className="flex items-center justify-between w-full">
          <span className="text-gray-900 dark:text-white">Chế độ tối</span>
          <ThemeToggle />
        </div>
      ),
      className: "hover:bg-gray-50 dark:hover:bg-gray-700",
      onClick: (e) => {
        e.domEvent.stopPropagation();
      },
    },
    {
      type: "divider",
      className: "border-gray-200 dark:border-gray-600",
    },
    {
      key: "logout",
      icon: <LogoutOutlined className="text-gray-700 dark:text-gray-300" />,
      label: (
        <span className="text-gray-900 dark:text-white hover:text-red-600 dark:hover:text-red-400 block w-full cursor-pointer">
          Đăng xuất
        </span>
      ),
      onClick: handleLogout,
      className: "hover:bg-gray-50 dark:hover:bg-gray-700",
    },
  ];

  const notificationItems =
    Array.isArray(documents) && documents.length > 0
      ? documents.map((doc) => ({
          key: doc.id,
          label: (
            <Card
              size="small"
              style={{
                margin: "4px 0",
                backgroundColor: doc.isRead
                  ? themeToken.colorBgContainer
                  : themeToken.colorPrimaryBg,
                border: `1px solid ${themeToken.colorBorder}`,
                opacity: doc.isRead ? 0.7 : 1,
                cursor: "pointer",
              }}
              onClick={(e) => handleUpdateIsRead(e, doc.id, doc)}
            >
              <Space direction="vertical" size={4} style={{ width: "100%" }}>
                <Space>
                  <Text strong>{doc.title || "Thông báo"}</Text>
                  {!doc.isRead && (
                    <Tag color="blue" size="small">
                      Mới
                    </Tag>
                  )}
                </Space>
                {doc?.content && (
                  <Text
                    type="secondary"
                    style={{
                      fontSize: "12px",
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                      wordBreak: "break-word",
                      whiteSpace: "pre-wrap",
                    }}
                  >
                    {doc.content}
                  </Text>
                )}
                <Text type="secondary" style={{ fontSize: "11px" }}>
                  {dayjs(doc.createdAt).format("DD/MM/YYYY HH:mm")}
                </Text>
              </Space>
            </Card>
          ),
        }))
      : [
          {
            key: "empty",
            label: (
              <Card
                size="small"
                style={{
                  margin: "4px 0",
                  backgroundColor: themeToken.colorBgContainer,
                  border: `1px solid ${themeToken.colorBorder}`,
                  textAlign: "center",
                }}
              >
                <Text type="secondary" style={{ fontSize: "12px" }}>
                  Không có thông báo
                </Text>
              </Card>
            ),
          },
        ];

  const mobileMenuItems = [
    {
      key: "profile",
      icon: <UserOutlined className="text-gray-700 dark:text-gray-300" />,
      label: (
        <Link
          href={checkIsAdmin() ? `/admin/${user?.id}` : `/users/${user?.id}`}
          onClick={() => setMobileMenuOpen(false)}
          className="text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 block w-full"
        >
          <Space direction="vertical" size={0}>
            <Text strong className="text-gray-900 dark:text-white">
              {userDetail?.fullName || "Thông tin cá nhân"}
            </Text>
            <Text
              type="secondary"
              style={{ fontSize: "12px" }}
              className="text-gray-600 dark:text-gray-400"
            >
              {userDetail?.email}
            </Text>
          </Space>
        </Link>
      ),
      className: "hover:bg-gray-50 dark:hover:bg-gray-700",
    },
    {
      type: "divider",
      className: "border-gray-200 dark:border-gray-600",
    },
    {
      key: "settings",
      icon: <SettingOutlined className="text-gray-700 dark:text-gray-300" />,
      label: (
        <Link
          href="/change-password"
          onClick={() => setMobileMenuOpen(false)}
          className="text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 block w-full"
        >
          Đổi mật khẩu
        </Link>
      ),
      className: "hover:bg-gray-50 dark:hover:bg-gray-700",
    },
    {
      type: "divider",
      className: "border-gray-200 dark:border-gray-600",
    },
    {
      key: "logout",
      icon: <LogoutOutlined className="text-gray-700 dark:text-gray-300" />,
      label: (
        <span className="text-gray-900 dark:text-white hover:text-red-600 dark:hover:text-red-400 block w-full cursor-pointer">
          Đăng xuất
        </span>
      ),
      onClick: () => {
        handleLogout();
        setMobileMenuOpen(false);
      },
      className: "hover:bg-gray-50 dark:hover:bg-gray-700",
    },
  ];

  // Reusable button components
  const NotificationButton = ({ className = "" }) => (
    <Button
      type="text"
      icon={<BellOutlined />}
      size="large"
      onClick={() => setDropdownOpen((prev) => !prev)}
      className={`theme-button-primary ${className}`}
    />
  );

  const UserMenuButton = () => (
    <Button
      type="text"
      onClick={() => toggleDropdown()}
      className="theme-button-secondary"
    >
      <Avatar
        src={userDetail?.avatar || user?.avatar}
        icon={<UserOutlined />}
        size="small"
        style={{ marginRight: 8 }}
      />
      <div className="flex flex-col items-start mr-2">
        <Text strong className="text-sm leading-tight theme-text-primary">
          {user?.username}
        </Text>
        <Text
          type="secondary"
          className="text-xs leading-tight theme-text-secondary"
        >
          {checkIsAdmin() ? "Quản trị viên" : "Học viên"}
        </Text>
      </div>
      <DownOutlined className="text-xs theme-icon" />
    </Button>
  );

  const MobileMenuButton = () => (
    <Button
      type="text"
      icon={mobileMenuOpen ? <CloseOutlined /> : <MenuOutlined />}
      onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
      className="theme-button-primary"
    />
  );

  return (
    <>
      <AntHeader className="theme-header">
        {/* Logo and Brand */}
        <div className="flex items-center">
          <Link
            href={`/${checkIsAdmin() ? "admin" : "users"}`}
            className="flex items-center hover:cursor-pointer transition-all duration-200 hover:opacity-80"
          >
            <img
              src="/image.png"
              className="h-8 md:h-10 mr-3 hover:cursor-pointer transition-all duration-200 hover:scale-105"
              alt="H5 Logo"
            />
            <Title
              level={4}
              className="theme-title mt-3 hover:cursor-pointer transition-all duration-200 hover:text-blue-600 dark:hover:text-blue-400"
            >
              HỆ HỌC VIÊN 5
            </Title>
          </Link>
        </div>

        {/* Desktop Actions */}
        <div className="hidden md:flex items-center space-x-4">
          {/* Notifications - Only for USER role */}
          {isDesktop && user?.role === "USER" && (
            <Dropdown
              menu={{
                items: notificationItems,
                className:
                  "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 notification-dropdown-menu",
                style: {
                  maxHeight: "500px",
                  overflowY: "auto",
                  width: "360px",
                  padding: "8px",
                },
              }}
              open={dropdownOpen}
              onOpenChange={setDropdownOpen}
              placement="bottomRight"
              trigger={[]}
              overlayClassName="notification-dropdown"
            >
              <Badge count={unreadCount} size="small">
                <NotificationButton />
              </Badge>
            </Dropdown>
          )}

          {/* User Menu */}
          <Dropdown
            menu={{
              items: userMenuItems,
              className:
                "min-w-[200px] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg",
            }}
            open={isOpen}
            onOpenChange={setIsOpen}
            placement="bottomRight"
            trigger={["click"]}
          >
            <UserMenuButton />
          </Dropdown>
        </div>

        {/* Mobile Actions */}
        <div className="flex md:hidden items-center space-x-2">
          {/* Notifications - Only for USER role */}
          {!isDesktop && user?.role === "USER" && (
            <Dropdown
              menu={{
                items: notificationItems,
                className:
                  "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 notification-dropdown-menu",
                style: {
                  maxHeight: "400px",
                  overflowY: "auto",
                  width: "300px",
                  padding: "8px",
                },
              }}
              open={dropdownOpen}
              onOpenChange={setDropdownOpen}
              placement="bottomRight"
              trigger={[]}
              overlayClassName="notification-dropdown"
            >
              <Badge count={unreadCount} size="small">
                <NotificationButton />
              </Badge>
            </Dropdown>
          )}

          {/* Mobile Menu Button */}
          <MobileMenuButton />
        </div>
      </AntHeader>

      {/* Mobile Menu Drawer */}
      <Drawer
        title={
          <div className="flex items-center">
            <Avatar
              src={
                userDetail?.avatar ||
                "https://i.pinimg.com/736x/81/09/3a/81093a0429e25b0ff579fa41aa96c421.jpg"
              }
              size="large"
              icon={<UserOutlined />}
              style={{ marginRight: 12 }}
            />
            <div>
              <Text strong style={{ color: themeToken.colorText }}>
                {userDetail?.fullName || "Thông tin cá nhân"}
              </Text>
              <br />
              <Text type="secondary" style={{ fontSize: "12px" }}>
                {userDetail?.email}
              </Text>
            </div>
          </div>
        }
        placement="right"
        onClose={() => setMobileMenuOpen(false)}
        open={mobileMenuOpen}
        width={280}
        bodyStyle={{ padding: 0 }}
        headerStyle={{
          background: themeToken.colorBgContainer,
          borderBottom: `1px solid ${themeToken.colorBorder}`,
        }}
      >
        <Menu
          mode="inline"
          items={mobileMenuItems}
          style={{
            border: "none",
            background: "transparent",
          }}
        />
      </Drawer>
    </>
  );
};

export default Header;
