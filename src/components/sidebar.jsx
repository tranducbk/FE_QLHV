"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import Link from "next/link";
import axiosInstance from "@/utils/axiosInstance";
import { Menu, ConfigProvider, theme, Layout } from "antd";
import { useThemeContext } from "./ThemeProvider";
import { isSuperAdmin, isAdmin } from "@/utils/roleUtils";

const { Sider } = Layout;
import {
  HomeOutlined,
  CalendarOutlined,
  UserOutlined,
  BookOutlined,
  TrophyOutlined,
  BarChartOutlined,
  FileTextOutlined,
  StarOutlined,
  SettingOutlined,
  TeamOutlined,
  ClockCircleOutlined,
  FireOutlined,
  SafetyOutlined,
  EditOutlined,
  DollarOutlined,
  ScheduleOutlined,
  HeartOutlined,
  BulbOutlined,
  CheckSquareOutlined,
  CrownOutlined,
  AuditOutlined,
  NotificationOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  BankOutlined,
  TrophyFilled,
  BookFilled,
  CalendarFilled,
  UserFilled,
  SettingFilled,
  FileTextFilled,
  StarFilled,
  BarChartFilled,
  TeamFilled,
  ClockCircleFilled,
  FireFilled,
  SafetyFilled,
  EditFilled,
  DollarFilled,
  ScheduleFilled,
  HeartFilled,
  BulbFilled,
  CrownFilled,
  AuditFilled,
  NotificationFilled,
  CheckCircleFilled,
  ExclamationCircleFilled,
  ThunderboltOutlined,
} from "@ant-design/icons";

const { SubMenu } = Menu;

// Component con để sử dụng useSearchParams
const SideBarContent = () => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { theme } = useThemeContext();
  const [userDetail, setUserDetail] = useState(null);
  const [token, setToken] = useState(null);
  const [openKeys, setOpenKeys] = useState([]);
  const [selectedKeys, setSelectedKeys] = useState([]);

  useEffect(() => {
    fetchUserDetail();
    updateSelectedKeys();
  }, [pathname, searchParams]);

  const fetchUserDetail = async () => {
    try {
      // Lấy thông tin user từ API
      const userRes = await axiosInstance.get("/user/me");
      const currentUser = userRes.data;
      setToken(currentUser);

      // Sử dụng utility function để kiểm tra role
      if (isAdmin(currentUser)) {
        const res = await axiosInstance.get(`/commander/${currentUser.id}`);
        setUserDetail(res.data);
      } else {
        // Get studentId from userId first
        const studentRes = await axiosInstance.get(
          `/student/by-user/${currentUser.id}`
        );

        const res = await axiosInstance.get(`/student/${studentRes.data.id}`);
        setUserDetail(res.data);
      }
    } catch (error) {
      router.push("/login");
      // Handle error silently
    }
  };

  const updateSelectedKeys = () => {
    const currentPath = pathname;

    setSelectedKeys([currentPath]);

    // User: open learning submenu for semester-results, time-table, tuition-fee, yearly-statistics
    if (
      currentPath.startsWith("/users/semester-results") ||
      currentPath.startsWith("/users/time-table") ||
      currentPath.startsWith("/users/tuition-fee") ||
      currentPath === "/users/yearly-statistics"
    ) {
      setOpenKeys(["learning-user"]);
      return;
    }

    // User: open training submenu for physical results/violations
    if (
      currentPath.startsWith("/users/phisical-result") ||
      currentPath.startsWith("/users/violations")
    ) {
      setOpenKeys(["training-user"]);
      return;
    }

    // Admin: Auto open submenu if current path is in submenu
    if (
      currentPath.startsWith("/admin/time-table") ||
      currentPath.startsWith("/admin/learning-results") ||
      currentPath.startsWith("/admin/party-rating") ||
      currentPath.startsWith("/admin/training-rating") ||
      currentPath.startsWith("/admin/semester-management") ||
      currentPath.startsWith("/admin/tuition-fees") ||
      currentPath.startsWith("/admin/yearly-statistics")
    ) {
      setOpenKeys(["learning"]);
    } else if (
      currentPath.startsWith("/admin/violation") ||
      currentPath.startsWith("/admin/physical-results")
    ) {
      setOpenKeys(["training"]);
    } else if (
      currentPath.startsWith("/admin/list-user") ||
      currentPath.startsWith("/admin/universities")
    ) {
      setOpenKeys(["student-management"]);
    } else if (currentPath.startsWith("/supper_admin")) {
      setOpenKeys([]);
    } else {
      setOpenKeys([]);
    }
  };

  const handleOpenChange = (keys) => {
    const latestOpenKey = keys.find((key) => openKeys.indexOf(key) === -1);
    if (latestOpenKey) {
      setOpenKeys([latestOpenKey]);
    } else {
      setOpenKeys([]);
    }
  };

  const handleMenuClick = ({ key }) => {
    router.push(key);
  };

  // Sidebar cho SUPER_ADMIN - chỉ quản lý admin users
  if (isSuperAdmin(token)) {
    return (
      <Sider
        width={256}
        collapsedWidth={0}
        breakpoint="lg"
        className="h-screen fixed left-0 top-0 pt-16 shadow-xl overflow-y-auto z-40
          [&::-webkit-scrollbar]:w-2
          [&::-webkit-scrollbar-thumb]:rounded-full
          [&::-webkit-scrollbar-track]:bg-gray-100
          [&::-webkit-scrollbar-thumb]:bg-gray-300
          dark:[&::-webkit-scrollbar-track]:bg-slate-700
          dark:[&::-webkit-scrollbar-thumb]:bg-slate-500"
        style={{
          backgroundColor: theme === "dark" ? "#1f2937" : "#ffffff",
          borderRight: `1px solid ${theme === "dark" ? "#374151" : "#e5e7eb"}`,
        }}
      >
        <ConfigProvider
          theme={{
            algorithm:
              theme === "dark" ? theme.darkAlgorithm : theme.defaultAlgorithm,
            token: {
              colorBgContainer: theme === "dark" ? "#1f2937" : "#ffffff",
              colorBgElevated: theme === "dark" ? "#374151" : "#ffffff",
              colorBorder: theme === "dark" ? "#4b5563" : "#e5e7eb",
              colorText: theme === "dark" ? "#f9fafb" : "#111827",
              colorTextSecondary: theme === "dark" ? "#d1d5db" : "#6b7280",
              colorPrimary: "#3b82f6",
              colorPrimaryHover: "#2563eb",
              colorPrimaryActive: "#1d4ed8",
            },
          }}
        >
          <Menu
            mode="inline"
            selectedKeys={selectedKeys}
            onClick={handleMenuClick}
            style={{
              width: "100%",
              border: "none",
              backgroundColor: "transparent",
            }}
            theme={theme}
          >
            <Menu.Item key={`/admin/${token?.id}`} icon={<UserOutlined />}>
              Thông tin cá nhân
            </Menu.Item>

            <Menu.Item key="/supper_admin" icon={<SettingOutlined />}>
              Quản lý Admin Users
            </Menu.Item>
          </Menu>
        </ConfigProvider>
      </Sider>
    );
  }

  // Sidebar cho ADMIN thường - quản lý hệ thống
  if (isAdmin(token)) {
    return (
      <Sider
        width={256}
        collapsedWidth={0}
        breakpoint="lg"
        className="h-screen fixed left-0 top-0 pt-16 shadow-xl overflow-y-auto z-40
          [&::-webkit-scrollbar]:w-2
          [&::-webkit-scrollbar-thumb]:rounded-full
          [&::-webkit-scrollbar-track]:bg-gray-100
          [&::-webkit-scrollbar-thumb]:bg-gray-300
          dark:[&::-webkit-scrollbar-track]:bg-slate-700
          dark:[&::-webkit-scrollbar-thumb]:bg-slate-500"
        style={{
          backgroundColor: theme === "dark" ? "#1f2937" : "#ffffff",
          borderRight: `1px solid ${theme === "dark" ? "#374151" : "#e5e7eb"}`,
        }}
      >
        <ConfigProvider
          theme={{
            algorithm:
              theme === "dark" ? theme.darkAlgorithm : theme.defaultAlgorithm,
            token: {
              colorBgContainer: theme === "dark" ? "#1f2937" : "#ffffff",
              colorBgElevated: theme === "dark" ? "#374151" : "#ffffff",
              colorBorder: theme === "dark" ? "#4b5563" : "#e5e7eb",
              colorText: theme === "dark" ? "#f9fafb" : "#111827",
              colorTextSecondary: theme === "dark" ? "#d1d5db" : "#6b7280",
              colorPrimary: "#3b82f6",
              colorPrimaryHover: "#2563eb",
              colorPrimaryActive: "#1d4ed8",
            },
          }}
        >
          <Menu
            mode="inline"
            openKeys={openKeys}
            selectedKeys={selectedKeys}
            onOpenChange={handleOpenChange}
            onClick={handleMenuClick}
            style={{
              width: "100%",
              border: "none",
              backgroundColor: "transparent",
            }}
            theme={theme}
          >
            <Menu.Item key="/admin" icon={<HomeOutlined />}>
              Tổng quan
            </Menu.Item>

            <Menu.Item key={`/admin/${token?.id}`} icon={<UserOutlined />}>
              Thông tin cá nhân
            </Menu.Item>

            <Menu.Item
              key="/admin/commander-duty-schedule"
              icon={<CalendarOutlined />}
            >
              Lịch trực
            </Menu.Item>

            <SubMenu
              key="student-management"
              icon={<TeamOutlined />}
              title="Quản lý học viên"
            >
              <Menu.Item key="/admin/list-user" icon={<TeamOutlined />}>
                Danh sách học viên
              </Menu.Item>
              <Menu.Item key="/admin/universities" icon={<BankOutlined />}>
                Quản lý trường
              </Menu.Item>
            </SubMenu>

            <SubMenu
              key="learning"
              icon={<BookOutlined />}
              title="Thông tin học tập"
            >
              <Menu.Item key="/admin/time-table" icon={<ScheduleOutlined />}>
                Lịch học
              </Menu.Item>
              <Menu.Item
                key="/admin/learning-results"
                icon={<TrophyOutlined />}
              >
                Kết quả học tập
              </Menu.Item>
              <Menu.Item
                key="/admin/yearly-statistics"
                icon={<BarChartOutlined />}
              >
                Thống kê theo năm
              </Menu.Item>
              <Menu.Item key="/admin/party-rating" icon={<StarOutlined />}>
                Xếp loại Đảng viên
              </Menu.Item>
              <Menu.Item key="/admin/tuition-fees" icon={<DollarOutlined />}>
                Học phí
              </Menu.Item>
            </SubMenu>
            <Menu.Item key="/admin/cut-rice" icon={<CheckSquareOutlined />}>
              Cắt cơm học viên
            </Menu.Item>

            <Menu.Item
              key="/admin/semester-management"
              icon={<CalendarOutlined />}
            >
              Quản lý các kì học
            </Menu.Item>

            {/* <Menu.Item
                key="/admin/vacation-schedules"
                icon={<CalendarOutlined />}
              >
                Tranh thủ học viên
              </Menu.Item> */}

            <Menu.Item
              key="/admin/training-rating"
              icon={<ThunderboltOutlined />}
            >
              Xếp loại rèn luyện
            </Menu.Item>
            {/* 
              <SubMenu
                key="training"
                icon={<TrophyOutlined />}
                title="Rèn luyện học viên"
              >
                <Menu.Item
                  key="/admin/violation"
                  icon={<ExclamationCircleOutlined />}
                >
                  Lỗi vi phạm
                </Menu.Item>
                <Menu.Item
                  key="/admin/physical-results"
                  icon={<HeartOutlined />}
                >
                  Kết quả thể lực
                </Menu.Item>
              </SubMenu>

              <Menu.Item key="/admin/list-guard" icon={<SafetyOutlined />}>
                Danh sách gác đêm
              </Menu.Item> */}

            {/* <Menu.Item key="/admin/list-help-cooking" icon={<FireOutlined />}>
                Danh sách giúp bếp
              </Menu.Item> */}

            {/* <Menu.Item
                key="/admin/regulatory-documents"
                icon={<FileTextOutlined />}
              >
                Văn bản quy định
              </Menu.Item> */}

            <Menu.Item key="/admin/achievement" icon={<CrownOutlined />}>
              Khen thưởng học viên
            </Menu.Item>

            <Menu.Item key="/admin/statistical" icon={<BarChartOutlined />}>
              Thống kê
            </Menu.Item>
          </Menu>
        </ConfigProvider>
      </Sider>
    );
  } else {
    return (
      <Sider
        width={256}
        collapsedWidth={0}
        breakpoint="lg"
        className="h-screen fixed left-0 top-0 pt-16 shadow-xl overflow-y-auto z-40 pb-10
          [&::-webkit-scrollbar]:w-2
          [&::-webkit-scrollbar-thumb]:rounded-full
          [&::-webkit-scrollbar-track]:bg-gray-100
          [&::-webkit-scrollbar-thumb]:bg-gray-300
          dark:[&::-webkit-scrollbar-track]:bg-slate-700
          dark:[&::-webkit-scrollbar-thumb]:bg-slate-500"
        style={{
          backgroundColor: theme === "dark" ? "#1f2937" : "#ffffff",
          borderRight: `1px solid ${theme === "dark" ? "#374151" : "#e5e7eb"}`,
        }}
      >
        <ConfigProvider
          theme={{
            algorithm:
              theme === "dark" ? theme.darkAlgorithm : theme.defaultAlgorithm,
            token: {
              colorBgContainer: theme === "dark" ? "#1f2937" : "#ffffff",
              colorBgElevated: theme === "dark" ? "#374151" : "#ffffff",
              colorBorder: theme === "dark" ? "#4b5563" : "#e5e7eb",
              colorText: theme === "dark" ? "#f9fafb" : "#111827",
              colorTextSecondary: theme === "dark" ? "#d1d5db" : "#6b7280",
              colorPrimary: "#3b82f6",
              colorPrimaryHover: "#2563eb",
              colorPrimaryActive: "#1d4ed8",
            },
          }}
        >
          <Menu
            mode="inline"
            openKeys={openKeys}
            selectedKeys={selectedKeys}
            onOpenChange={handleOpenChange}
            onClick={handleMenuClick}
            style={{
              width: "100%",
              border: "none",
              backgroundColor: "transparent",
            }}
            theme={theme}
          >
            <Menu.Item key="/users" icon={<HomeOutlined />}>
              Tổng quan
            </Menu.Item>

            <Menu.Item key={`/users/${token?.id}`} icon={<UserOutlined />}>
              Thông tin cá nhân
            </Menu.Item>

            <SubMenu
              key="learning-user"
              icon={<BookOutlined />}
              title="Học tập"
            >
              <Menu.Item key="/users/time-table" icon={<ScheduleOutlined />}>
                Thời khóa biểu
              </Menu.Item>
              <Menu.Item
                key="/users/semester-results"
                icon={<TrophyOutlined />}
              >
                Kết quả học tập
              </Menu.Item>
              <Menu.Item
                key="/users/yearly-statistics"
                icon={<BarChartOutlined />}
              >
                Thống kê theo năm
              </Menu.Item>
              <Menu.Item key="/users/tuition-fee" icon={<DollarOutlined />}>
                Học phí
              </Menu.Item>
            </SubMenu>

            <Menu.Item key="/users/cut-rice" icon={<CalendarOutlined />}>
              Lịch cắt cơm
            </Menu.Item>

            {/* <SubMenu
                key="training-user"
                icon={<HeartOutlined />}
                title="Rèn luyện"
              >
                <Menu.Item
                  key="/users/phisical-result"
                  icon={<HeartOutlined />}
                >
                  Kết quả thể lực
                </Menu.Item>
                <Menu.Item
                  key="/users/violations"
                  icon={<ExclamationCircleOutlined />}
                >
                  Lỗi vi phạm
                </Menu.Item>
              </SubMenu>

              <Menu.Item key="/users/vacation-schedule" icon={<BulbOutlined />}>
                Tranh thủ
              </Menu.Item>

              <Menu.Item key="/users/help-cooking" icon={<FireOutlined />}>
                Giúp bếp
              </Menu.Item> */}

            <Menu.Item
              key="/users/commander-duty-schedule"
              icon={<ClockCircleOutlined />}
            >
              Lịch trực chỉ huy
            </Menu.Item>

            {/* <Menu.Item key="/users/guard" icon={<SafetyOutlined />}>
                Lịch gác đêm
              </Menu.Item> */}

            <Menu.Item
              key="/users/regulatory-regime"
              icon={<FileTextOutlined />}
            >
              Chế độ quy định
            </Menu.Item>

            <Menu.Item key="/users/achievement" icon={<CrownOutlined />}>
              Khen thưởng
            </Menu.Item>
          </Menu>
        </ConfigProvider>
      </Sider>
    );
  }
};

const SideBar = () => {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SideBarContent />
    </Suspense>
  );
};

export default SideBar;
