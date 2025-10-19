"use client";

import { jwtDecode } from "jwt-decode";
import { useState, useEffect, Suspense } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import "core-js/stable/atob";
import axios from "axios";
import Link from "next/link";
import { BASE_URL } from "@/configs";
import { Menu, ConfigProvider, theme } from "antd";
import { useThemeContext } from "./ThemeProvider";
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
    const token = localStorage.getItem("token");

    if (token) {
      try {
        const decodedToken = jwtDecode(token);
        setToken(decodedToken);
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
          const res = await axios.get(
            `${BASE_URL}/student/${decodedToken.id}`,
            {
              headers: {
                token: `Bearer ${token}`,
              },
            }
          );

          setUserDetail(res.data);
        }
      } catch (error) {
        router.push("/login");
        console.log(error);
      }
    }
  };

  const updateSelectedKeys = () => {
    const currentPath = pathname;

    // User: map tab to submenu keys
    if (currentPath === "/users/learning-information") {
      const tab = searchParams?.get("tab") || "time-table";
      const key = `/users/learning-information?tab=${tab}`;
      setSelectedKeys([key]);
      setOpenKeys(["learning-user"]);
      return;
    }

    setSelectedKeys([currentPath]);

    // User: open training submenu for physical results/violations
    if (
      currentPath.startsWith("/users/phisical-result") ||
      currentPath.startsWith("/users/violations")
    ) {
      setOpenKeys(["training-user"]);
      return;
    }

    // User: open learning submenu for yearly statistics
    if (currentPath === "/users/yearly-statistics") {
      setOpenKeys(["learning-user"]);
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

  if (token?.admin) {
    return (
      <div className="h-full fixed shadow-xl">
        <div className="h-full bg-white hidden pt-20 hs-overlay hs-overlay-open:translate-x-0 -translate-x-full transition-all duration-300 transform z-40 w-64 border-gray-200 overflow-y-auto lg:block lg:translate-x-0 lg:end-auto lg:bottom-0 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-gray-100 [&::-webkit-scrollbar-thumb]:bg-gray-300 dark:[&::-webkit-scrollbar-track]:bg-slate-700 dark:[&::-webkit-scrollbar-thumb]:bg-slate-500 dark:bg-gray-800 dark:border-gray-700">
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
        </div>
      </div>
    );
  } else {
    return (
      <div className="h-screen fixed shadow-xl">
        <div className="h-screen hidden pt-20 hs-overlay hs-overlay-open:translate-x-0 -translate-x-full transition-all duration-300 transform z-40 w-64 bg-white border-gray-200 pb-10 overflow-y-auto lg:block lg:translate-x-0 lg:end-auto lg:bottom-0 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-gray-100 [&::-webkit-scrollbar-thumb]:bg-gray-300 dark:[&::-webkit-scrollbar-track]:bg-slate-700 dark:[&::-webkit-scrollbar-thumb]:bg-slate-500 dark:bg-gray-800 dark:border-gray-700">
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
                <Menu.Item
                  key="/users/learning-information?tab=time-table"
                  icon={<ScheduleOutlined />}
                >
                  Thời khóa biểu
                </Menu.Item>
                <Menu.Item
                  key="/users/learning-information?tab=results"
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
                <Menu.Item
                  key="/users/learning-information?tab=tuition-fee"
                  icon={<DollarOutlined />}
                >
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
        </div>
      </div>
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
