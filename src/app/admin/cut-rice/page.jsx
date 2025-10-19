"use client";

import axios from "axios";
import Link from "next/link";
import { jwtDecode } from "jwt-decode";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { handleNotify } from "../../../components/notify";
import Loader from "@/components/loader";
import { useLoading } from "@/hooks";
import { Select, ConfigProvider, theme } from "antd";

import { BASE_URL } from "@/configs";
const CutRice = () => {
  const router = useRouter();

  // Detect dark mode
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const checkDarkMode = () => {
      const isDarkMode = document.documentElement.classList.contains("dark");
      setIsDark(isDarkMode);
    };

    checkDarkMode();

    // Listen for theme changes
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, []);

  // Lấy ngày hiện tại
  const getCurrentDay = () => {
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 = Chủ nhật, 1 = Thứ 2, ..., 6 = Thứ 7
    return dayOfWeek;
  };
  const [cutRice, setCutRice] = useState(null);
  const [unit, setUnit] = useState("");
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const { loading, withLoading } = useLoading(true);
  const [formData, setFormData] = useState({
    monday: { breakfast: false, lunch: false, dinner: false },
    tuesday: { breakfast: false, lunch: false, dinner: false },
    wednesday: { breakfast: false, lunch: false, dinner: false },
    thursday: { breakfast: false, lunch: false, dinner: false },
    friday: { breakfast: false, lunch: false, dinner: false },
    saturday: { breakfast: false, lunch: false, dinner: false },
    sunday: { breakfast: false, lunch: false, dinner: false },
  });

  // Mapping để hiển thị tiếng Việt
  const dayDisplayMapping = {
    monday: "Thứ 2",
    tuesday: "Thứ 3",
    wednesday: "Thứ 4",
    thursday: "Thứ 5",
    friday: "Thứ 6",
    saturday: "Thứ 7",
    sunday: "Chủ nhật",
  };

  const unitMapping = {
    "L1 - H5": 1,
    "L2 - H5": 2,
    "L3 - H5": 3,
    "L4 - H5": 4,
    "L5 - H5": 5,
    "L6 - H5": 6,
  };

  // Hàm tính toán thống kê cắt cơm theo từng thứ
  const calculateStatistics = () => {
    if (!cutRice || cutRice.length === 0) {
      return {
        monday: { breakfast: 0, lunch: 0, dinner: 0 },
        tuesday: { breakfast: 0, lunch: 0, dinner: 0 },
        wednesday: { breakfast: 0, lunch: 0, dinner: 0 },
        thursday: { breakfast: 0, lunch: 0, dinner: 0 },
        friday: { breakfast: 0, lunch: 0, dinner: 0 },
        saturday: { breakfast: 0, lunch: 0, dinner: 0 },
        sunday: { breakfast: 0, lunch: 0, dinner: 0 },
      };
    }

    const stats = {
      monday: { breakfast: 0, lunch: 0, dinner: 0 },
      tuesday: { breakfast: 0, lunch: 0, dinner: 0 },
      wednesday: { breakfast: 0, lunch: 0, dinner: 0 },
      thursday: { breakfast: 0, lunch: 0, dinner: 0 },
      friday: { breakfast: 0, lunch: 0, dinner: 0 },
      saturday: { breakfast: 0, lunch: 0, dinner: 0 },
      sunday: { breakfast: 0, lunch: 0, dinner: 0 },
    };

    cutRice.forEach((item) => {
      // Thứ 2
      if (item.monday?.breakfast) stats.monday.breakfast++;
      if (item.monday?.lunch) stats.monday.lunch++;
      if (item.monday?.dinner) stats.monday.dinner++;

      // Thứ 3
      if (item.tuesday?.breakfast) stats.tuesday.breakfast++;
      if (item.tuesday?.lunch) stats.tuesday.lunch++;
      if (item.tuesday?.dinner) stats.tuesday.dinner++;

      // Thứ 4
      if (item.wednesday?.breakfast) stats.wednesday.breakfast++;
      if (item.wednesday?.lunch) stats.wednesday.lunch++;
      if (item.wednesday?.dinner) stats.wednesday.dinner++;

      // Thứ 5
      if (item.thursday?.breakfast) stats.thursday.breakfast++;
      if (item.thursday?.lunch) stats.thursday.lunch++;
      if (item.thursday?.dinner) stats.thursday.dinner++;

      // Thứ 6
      if (item.friday?.breakfast) stats.friday.breakfast++;
      if (item.friday?.lunch) stats.friday.lunch++;
      if (item.friday?.dinner) stats.friday.dinner++;

      // Thứ 7
      if (item.saturday?.breakfast) stats.saturday.breakfast++;
      if (item.saturday?.lunch) stats.saturday.lunch++;
      if (item.saturday?.dinner) stats.saturday.dinner++;

      // Chủ nhật
      if (item.sunday?.breakfast) stats.sunday.breakfast++;
      if (item.sunday?.lunch) stats.sunday.lunch++;
      if (item.sunday?.dinner) stats.sunday.dinner++;
    });

    return stats;
  };

  const fetchCutRice = async () => {
    const token = localStorage.getItem("token");

    if (token) {
      try {
        const res = await axios.get(`${BASE_URL}/commander/cutRice`, {
          headers: {
            token: `Bearer ${token}`,
          },
        });

        // Sắp xếp theo thứ tự lớp từ 1 đến 6
        const sortedData = res.data.sort((a, b) => {
          const unitOrder = {
            "L1 - H5": 1,
            "L2 - H5": 2,
            "L3 - H5": 3,
            "L4 - H5": 4,
            "L5 - H5": 5,
            "L6 - H5": 6,
          };
          return (unitOrder[a.unit] || 999) - (unitOrder[b.unit] || 999);
        });
        setCutRice(sortedData);
      } catch (error) {
        console.log(error);
      }
    }
  };

  useEffect(() => {
    const loadData = async () => {
      await withLoading(fetchCutRice);
    };
    loadData();
  }, [withLoading]);

  // Cleanup scroll khi component unmount
  useEffect(() => {
    return () => {
      document.body.style.overflow = "unset";
    };
  }, []);

  const handleUnitChange = async (newUnit) => {
    setUnit(newUnit);
    router.push(`/admin/cut-rice?unit=${newUnit}`);

    const fetchDataForUnit = async () => {
      const token = localStorage.getItem("token");

      if (token) {
        try {
          const res = await axios.get(
            `${BASE_URL}/commander/cutRice?unit=${newUnit}`,
            {
              headers: {
                token: `Bearer ${token}`,
              },
            }
          );

          if (res.status === 404) setCutRice([]);

          // Sắp xếp theo thứ tự lớp từ 1 đến 6
          const sortedData = res.data.sort((a, b) => {
            const unitOrder = {
              "L1 - H5": 1,
              "L2 - H5": 2,
              "L3 - H5": 3,
              "L4 - H5": 4,
              "L5 - H5": 5,
              "L6 - H5": 6,
            };
            return (unitOrder[a.unit] || 999) - (unitOrder[b.unit] || 999);
          });
          setCutRice(sortedData);
        } catch (error) {
          console.log(error);
        }
      }
    };

    withLoading(fetchDataForUnit);
  };

  const [showExportModal, setShowExportModal] = useState(false);
  const [
    showExportExcelWithScheduleModal,
    setShowExportExcelWithScheduleModal,
  ] = useState(false);
  const [exportSelectedUnits, setExportSelectedUnits] = useState([]);
  const [
    exportExcelWithScheduleSelectedUnits,
    setExportExcelWithScheduleSelectedUnits,
  ] = useState([]);

  const handleExportFileExcel = async (e) => {
    e.preventDefault();
    setShowExportModal(true);
  };

  const handleExportFileExcelWithSchedule = async (e) => {
    e.preventDefault();
    setShowExportExcelWithScheduleModal(true);
  };

  const handleConfirmExportExcelWithSchedule = async () => {
    const token = localStorage.getItem("token");

    if (token) {
      try {
        const unitParam =
          exportExcelWithScheduleSelectedUnits.length > 0
            ? exportExcelWithScheduleSelectedUnits.join(",")
            : "all";

        const response = await axios.get(
          `${BASE_URL}/commander/cutRice/excel-with-schedule?unit=${unitParam}`,
          {
            headers: {
              token: `Bearer ${token}`,
            },
            responseType: "blob",
          }
        );

        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", "");
        document.body.appendChild(link);
        link.click();
        link.parentNode.removeChild(link);

        setShowExportExcelWithScheduleModal(false);
        setExportExcelWithScheduleSelectedUnits([]);
        handleNotify(
          "success",
          "Thành công!",
          "Xuất file Excel lịch cắt cơm và học tập thành công"
        );
      } catch (error) {
        const errorMessage =
          error.response?.data?.message || "Có lỗi xảy ra khi xuất file Excel";
        handleNotify("danger", "Lỗi!", errorMessage);
      }
    }
  };

  const handleConfirmExport = async () => {
    const token = localStorage.getItem("token");

    if (token) {
      try {
        const unitParam =
          exportSelectedUnits.length > 0
            ? exportSelectedUnits.join(",")
            : "all";

        const response = await axios.get(
          `${BASE_URL}/commander/cutRice/excel?unit=${unitParam}`,
          {
            headers: {
              token: `Bearer ${token}`,
            },
            responseType: "blob",
          }
        );

        // Tạo tên file theo đơn vị được chọn
        let fileName = "Danh_sach_cat_com_he_hoc_vien_5";
        if (exportSelectedUnits.length > 0) {
          const unitNames = exportSelectedUnits.map((unit) =>
            unit.replace(/\s+/g, "_")
          );
          fileName += `_${unitNames.join("_")}`;
        } else {
          fileName += "_tat_ca_don_vi";
        }
        fileName += ".xlsx";

        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", fileName);
        document.body.appendChild(link);
        link.click();
        link.parentNode.removeChild(link);

        setShowExportModal(false);
        setExportSelectedUnits([]);
        handleNotify("success", "Thành công!", "Xuất file Excel thành công");
      } catch (error) {
        const errorMessage =
          error.response?.data?.message || "Có lỗi xảy ra khi xuất file Excel";
        handleNotify("danger", "Lỗi!", errorMessage);
      }
    }
  };

  const handleEditClick = async (cutRiceItem) => {
    setSelectedStudent(cutRiceItem);
    // Ngăn scroll ở body khi modal mở
    document.body.style.overflow = "hidden";
    const token = localStorage.getItem("token");
    try {
      const res = await axios.get(
        `${BASE_URL}/commander/cutRice/${cutRiceItem.id}`,
        {
          headers: { token: `Bearer ${token}` },
        }
      );
      // Nếu API trả về mảng, lấy phần tử đầu tiên
      const currentCutRice = Array.isArray(res.data) ? res.data[0] : res.data;
      if (currentCutRice) {
        setFormData({
          monday: currentCutRice.monday || {
            breakfast: false,
            lunch: false,
            dinner: false,
          },
          tuesday: currentCutRice.tuesday || {
            breakfast: false,
            lunch: false,
            dinner: false,
          },
          wednesday: currentCutRice.wednesday || {
            breakfast: false,
            lunch: false,
            dinner: false,
          },
          thursday: currentCutRice.thursday || {
            breakfast: false,
            lunch: false,
            dinner: false,
          },
          friday: currentCutRice.friday || {
            breakfast: false,
            lunch: false,
            dinner: false,
          },
          saturday: currentCutRice.saturday || {
            breakfast: false,
            lunch: false,
            dinner: false,
          },
          sunday: currentCutRice.sunday || {
            breakfast: false,
            lunch: false,
            dinner: false,
          },
        });
      } else {
        setFormData({
          monday: { breakfast: false, lunch: false, dinner: false },
          tuesday: { breakfast: false, lunch: false, dinner: false },
          wednesday: { breakfast: false, lunch: false, dinner: false },
          thursday: { breakfast: false, lunch: false, dinner: false },
          friday: { breakfast: false, lunch: false, dinner: false },
          saturday: { breakfast: false, lunch: false, dinner: false },
          sunday: { breakfast: false, lunch: false, dinner: false },
        });
      }
    } catch (error) {
      setFormData({
        monday: { breakfast: false, lunch: false, dinner: false },
        tuesday: { breakfast: false, lunch: false, dinner: false },
        wednesday: { breakfast: false, lunch: false, dinner: false },
        thursday: { breakfast: false, lunch: false, dinner: false },
        friday: { breakfast: false, lunch: false, dinner: false },
        saturday: { breakfast: false, lunch: false, dinner: false },
        sunday: { breakfast: false, lunch: false, dinner: false },
      });
    }
    setShowEditModal(true);
  };

  const handleCloseEditModal = () => {
    setShowEditModal(false);
    // Khôi phục scroll ở body khi đóng modal
    document.body.style.overflow = "unset";
  };

  const handleUpdateCutRice = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");

    if (token && selectedStudent) {
      try {
        const response = await axios.put(
          `${BASE_URL}/commander/cutRice/${selectedStudent.studentId}`,
          formData,
          {
            headers: {
              token: `Bearer ${token}`,
            },
          }
        );

        if (response.status === 200) {
          handleNotify("success", "Thành công!", response.data.message);
          handleCloseEditModal();
          withLoading(fetchCutRice); // Refresh data
        }
      } catch (error) {
        handleNotify(
          "danger",
          "Lỗi!",
          error.response?.data?.message || "Có lỗi xảy ra"
        );
      }
    }
  };

  const handleGenerateAutoCutRice = async () => {
    const token = localStorage.getItem("token");

    if (token) {
      try {
        // Hiển thị loading
        handleNotify(
          "info",
          "Đang xử lý...",
          "Đang tạo lịch cắt cơm tự động cho tất cả học viên"
        );

        const response = await axios.post(
          `${BASE_URL}/commander/cutRice/auto-generate`,
          {},
          {
            headers: {
              token: `Bearer ${token}`,
            },
          }
        );

        if (response.status === 200) {
          handleNotify("success", "Thành công!", response.data.message);
          withLoading(fetchCutRice); // Refresh data
        }
      } catch (error) {
        handleNotify(
          "danger",
          "Lỗi!",
          error.response?.data?.message ||
            "Có lỗi xảy ra khi tạo lịch cắt cơm tự động"
        );
      }
    }
  };

  const handleGenerateAutoCutRiceForStudent = async (cutRiceItem) => {
    const token = localStorage.getItem("token");

    if (token) {
      try {
        // Hiển thị loading
        handleNotify(
          "info",
          "Đang xử lý...",
          "Đang tạo lại lịch cắt cơm tự động cho sinh viên này"
        );

        const response = await axios.post(
          `${BASE_URL}/commander/cutRice/${cutRiceItem.studentId}/auto-generate`,
          {},
          {
            headers: {
              token: `Bearer ${token}`,
            },
          }
        );

        if (response.status === 200) {
          handleNotify("success", "Thành công!", response.data.message);
          withLoading(fetchCutRice); // Refresh data
        }
      } catch (error) {
        handleNotify(
          "danger",
          "Lỗi!",
          error.response?.data?.message ||
            "Có lỗi xảy ra khi tạo lại lịch cắt cơm tự động"
        );
      }
    }
  };

  if (loading) {
    return <Loader text="Đang tải dữ liệu cắt cơm..." />;
  }

  return (
    <>
      <div className="flex">
        <div className="flex-1 min-h-screen bg-gray-50 dark:bg-gray-900">
          <div className="w-full pt-20 pl-5">
            <nav className="flex" aria-label="Breadcrumb">
              <ol className="inline-flex items-center space-x-1 md:space-x-2 rtl:space-x-reverse">
                <li className="inline-flex items-center">
                  <Link
                    href="/admin"
                    className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-white"
                  >
                    <svg
                      className="w-3 h-3 me-2.5"
                      aria-hidden="true"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="m19.707 9.293-2-2-7-7a1 1 0 0 0-1.414 0l-7 7-2 2a1 1 0 0 0 1.414 1.414L2 10.414V18a2 2 0 0 0 2 2h3a1 1 0 0 0 1-1v-4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v4a1 1 0 0 0 1 1h3a2 2 0 0 0 2-2v-7.586l.293.293a1 1 0 0 0 1.414-1.414Z" />
                    </svg>
                    Trang chủ
                  </Link>
                </li>
                <li>
                  <div className="flex items-center">
                    <svg
                      className="rtl:rotate-180 w-3 h-3 mx-1"
                      aria-hidden="true"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 6 10"
                    >
                      <path
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="m1 9 4-4-4-4"
                      />
                    </svg>
                    <div className="ms-1 text-sm font-medium text-gray-500 md:ms-2 dark:text-gray-400">
                      Cắt cơm học viên
                    </div>
                  </div>
                </li>
              </ol>
            </nav>
          </div>
          <div className="w-full pt-8 pb-5 pl-5 pr-6 mb-5">
            <div className="bg-white dark:bg-gray-800 rounded-lg w-full shadow-lg">
              <div className="font-bold p-5 flex justify-between items-center border-b border-gray-200 dark:border-gray-700">
                <div className="text-gray-900 dark:text-white">
                  <h1 className="text-2xl font-bold">CẮT CƠM HỌC VIÊN</h1>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Quản lý và xem lịch cắt cơm của tất cả học viên
                  </p>
                </div>
                <div className="flex space-x-3">
                  <button
                    className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 border border-green-600 hover:border-green-700 rounded-lg transition-colors duration-200 flex items-center"
                    onClick={handleGenerateAutoCutRice}
                  >
                    <svg
                      className="w-4 h-4 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M13 10V3L4 14h7v7l9-11h-7z"
                      />
                    </svg>
                    Tạo tự động
                  </button>
                  <button
                    className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 border border-blue-600 hover:border-blue-700 rounded-lg transition-colors duration-200 flex items-center"
                    onClick={handleExportFileExcel}
                  >
                    <svg
                      className="w-4 h-4 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                    Xuất Excel
                  </button>
                  {/* <button
                    className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 border border-green-600 hover:border-green-700 rounded-lg transition-colors duration-200 flex items-center"
                    onClick={handleExportFileExcelWithSchedule}
                  >
                    <svg
                      className="w-4 h-4 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                    Xuất Excel (Lịch học)
                  </button> */}
                </div>
              </div>
              <div className="w-full pt-2 pl-5 pb-5 pr-5">
                <div className="w-full">
                  <div className="mb-4">
                    <div>
                      <label
                        htmlFor="unit"
                        className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300"
                      >
                        Chọn lớp
                      </label>
                      <select
                        id="unit"
                        value={unit}
                        onChange={(e) => handleUnitChange(e.target.value)}
                        className="bg-gray-50 border w-56 border-gray-300 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block pb-1 pt-1.5 pr-10 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                      >
                        <option value="">Tất cả</option>
                        <option value="L1 - H5">Lớp 1</option>
                        <option value="L2 - H5">Lớp 2</option>
                        <option value="L3 - H5">Lớp 3</option>
                        <option value="L4 - H5">Lớp 4</option>
                        <option value="L5 - H5">Lớp 5</option>
                        <option value="L6 - H5">Lớp 6</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Thống kê cắt cơm */}
                {cutRice && cutRice.length > 0 && (
                  <div className="mb-4">
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-700 dark:to-gray-600 rounded-lg p-4 border border-blue-200 dark:border-gray-600">
                      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center">
                        <svg
                          className="w-4 h-4 mr-2 text-blue-600 dark:text-blue-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                          />
                        </svg>
                        Thống kê cắt cơm theo tuần
                      </h3>
                      <div className="grid grid-cols-7 gap-2">
                        {(() => {
                          const stats = calculateStatistics();
                          const currentDay = getCurrentDay();
                          return [
                            { day: "Thứ 2", data: stats.monday, dayIndex: 1 },
                            { day: "Thứ 3", data: stats.tuesday, dayIndex: 2 },
                            {
                              day: "Thứ 4",
                              data: stats.wednesday,
                              dayIndex: 3,
                            },
                            { day: "Thứ 5", data: stats.thursday, dayIndex: 4 },
                            { day: "Thứ 6", data: stats.friday, dayIndex: 5 },
                            { day: "Thứ 7", data: stats.saturday, dayIndex: 6 },
                            {
                              day: "Chủ nhật",
                              data: stats.sunday,
                              dayIndex: 0,
                            },
                          ].map(({ day, data, dayIndex }) => {
                            const isToday = dayIndex === currentDay;
                            return (
                              <div
                                key={day}
                                className={`rounded-lg p-3 border transition-all duration-200 ${
                                  isToday
                                    ? "bg-yellow-100 dark:bg-yellow-900 border-yellow-300 dark:border-yellow-600 shadow-lg transform scale-105"
                                    : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 hover:shadow-md"
                                }`}
                              >
                                <div className="text-center mb-2">
                                  <div
                                    className={`text-xs font-medium ${
                                      isToday
                                        ? "text-yellow-800 dark:text-yellow-200"
                                        : "text-gray-500 dark:text-gray-400"
                                    }`}
                                  >
                                    {day}
                                  </div>
                                </div>
                                <div className="space-y-1">
                                  <div className="flex justify-between items-center">
                                    <span className="text-xs text-gray-600 dark:text-gray-400">
                                      Sáng:
                                    </span>
                                    <span className="text-sm font-semibold text-green-600 dark:text-green-400">
                                      {data.breakfast}
                                    </span>
                                  </div>
                                  <div className="flex justify-between items-center">
                                    <span className="text-xs text-gray-600 dark:text-gray-400">
                                      Trưa:
                                    </span>
                                    <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                                      {data.lunch}
                                    </span>
                                  </div>
                                  <div className="flex justify-between items-center">
                                    <span className="text-xs text-gray-600 dark:text-gray-400">
                                      Tối:
                                    </span>
                                    <span className="text-sm font-semibold text-purple-600 dark:text-purple-400">
                                      {data.dinner}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            );
                          });
                        })()}
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <div className="w-full pl-5 pb-5 pr-5">
                <div className="overflow-x-auto">
                  <table className="min-w-full border border-gray-200 dark:border-gray-700 text-center text-sm font-light text-gray-900 dark:text-white rounded-lg">
                    <thead className="border-b bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 font-medium">
                      <tr>
                        <th
                          scope="col"
                          className="border-r border-gray-200 dark:border-gray-600 py-4 px-2 text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                        >
                          LỚP
                        </th>
                        <th
                          scope="col"
                          className="border-r border-gray-200 dark:border-gray-600 py-2 text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                        >
                          HỌ VÀ TÊN
                        </th>

                        <th
                          scope="col"
                          className="border-r border-gray-200 dark:border-gray-600 py-2"
                        >
                          <div className="flex flex-col">
                            <div className="text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                              THỨ 2
                            </div>
                            <div className="grid grid-cols-3 gap-1 mt-2">
                              <div className="w-full flex-1 text-xs text-gray-500 dark:text-gray-300">
                                Sáng
                              </div>
                              <div className="w-full flex-1 text-xs text-gray-500 dark:text-gray-300">
                                Trưa
                              </div>
                              <div className="w-full flex-1 text-xs text-gray-500 dark:text-gray-300">
                                Tối
                              </div>
                            </div>
                          </div>
                        </th>

                        <th
                          scope="col"
                          className="border-r border-gray-200 dark:border-gray-600 py-1"
                        >
                          <div className="flex flex-col">
                            <div className="text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                              THỨ 3
                            </div>
                            <div className="grid grid-cols-3 gap-1 mt-2">
                              <div className="w-full flex-1 text-xs text-gray-500 dark:text-gray-300">
                                Sáng
                              </div>
                              <div className="w-full flex-1 text-xs text-gray-500 dark:text-gray-300">
                                Trưa
                              </div>
                              <div className="w-full flex-1 text-xs text-gray-500 dark:text-gray-300">
                                Tối
                              </div>
                            </div>
                          </div>
                        </th>
                        <th
                          scope="col"
                          className="border-r border-gray-200 dark:border-gray-600 py-1"
                        >
                          <div className="flex flex-col">
                            <div className="text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                              THỨ 4
                            </div>
                            <div className="grid grid-cols-3 gap-1 mt-2">
                              <div className="w-full flex-1 text-xs text-gray-500 dark:text-gray-300">
                                Sáng
                              </div>
                              <div className="w-full flex-1 text-xs text-gray-500 dark:text-gray-300">
                                Trưa
                              </div>
                              <div className="w-full flex-1 text-xs text-gray-500 dark:text-gray-300">
                                Tối
                              </div>
                            </div>
                          </div>
                        </th>
                        <th
                          scope="col"
                          className="border-r border-gray-200 dark:border-gray-600 py-1"
                        >
                          <div className="flex flex-col">
                            <div className="text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                              THỨ 5
                            </div>
                            <div className="grid grid-cols-3 gap-1 mt-2">
                              <div className="w-full flex-1 text-xs text-gray-500 dark:text-gray-300">
                                Sáng
                              </div>
                              <div className="w-full flex-1 text-xs text-gray-500 dark:text-gray-300">
                                Trưa
                              </div>
                              <div className="w-full flex-1 text-xs text-gray-500 dark:text-gray-300">
                                Tối
                              </div>
                            </div>
                          </div>
                        </th>
                        <th
                          scope="col"
                          className="border-r border-gray-200 dark:border-gray-600 py-1"
                        >
                          <div className="flex flex-col">
                            <div className="text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                              THỨ 6
                            </div>
                            <div className="grid grid-cols-3 gap-1 mt-2">
                              <div className="w-full flex-1 text-xs text-gray-500 dark:text-gray-300">
                                Sáng
                              </div>
                              <div className="w-full flex-1 text-xs text-gray-500 dark:text-gray-300">
                                Trưa
                              </div>
                              <div className="w-full flex-1 text-xs text-gray-500 dark:text-gray-300">
                                Tối
                              </div>
                            </div>
                          </div>
                        </th>
                        <th
                          scope="col"
                          className="border-r border-gray-200 dark:border-gray-600 py-1"
                        >
                          <div className="flex flex-col">
                            <div className="text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                              THỨ 7
                            </div>
                            <div className="grid grid-cols-3 gap-1 mt-2">
                              <div className="w-full flex-1 text-xs text-gray-500 dark:text-gray-300">
                                Sáng
                              </div>
                              <div className="w-full flex-1 text-xs text-gray-500 dark:text-gray-300">
                                Trưa
                              </div>
                              <div className="w-full flex-1 text-xs text-gray-500 dark:text-gray-300">
                                Tối
                              </div>
                            </div>
                          </div>
                        </th>
                        <th
                          scope="col"
                          className="border-r border-gray-200 dark:border-gray-600 py-1"
                        >
                          <div className="flex flex-col">
                            <div className="text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                              CHỦ NHẬT
                            </div>
                            <div className="grid grid-cols-3 gap-1 mt-2">
                              <div className="w-full flex-1 text-xs text-gray-500 dark:text-gray-300">
                                Sáng
                              </div>
                              <div className="w-full flex-1 text-xs text-gray-500 dark:text-gray-300">
                                Trưa
                              </div>
                              <div className="w-full flex-1 text-xs text-gray-500 dark:text-gray-300">
                                Tối
                              </div>
                            </div>
                          </div>
                        </th>
                        <th
                          scope="col"
                          className="border-r border-gray-200 dark:border-gray-600 py-2 text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                        >
                          THAO TÁC
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800">
                      {cutRice && cutRice.length > 0 ? (
                        cutRice.map((item) => (
                          <tr
                            key={item.id}
                            className="border-b border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
                          >
                            <td className="whitespace-nowrap font-medium border-r py-4 px-2 border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white">
                              {unitMapping[item.unit] || ""}
                            </td>
                            <td className="whitespace-nowrap font-medium border-r py-4 px-2 border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white">
                              {item.fullName}
                            </td>

                            <td className="whitespace-nowrap font-medium border-r border-gray-200 dark:border-gray-600">
                              <div className="grid grid-cols-3 gap-1">
                                <div className="w-full flex-1 text-gray-900 dark:text-white">
                                  {item.monday?.breakfast === true ? "x" : ""}
                                </div>
                                <div className="w-full flex-1 text-gray-900 dark:text-white">
                                  {item.monday?.lunch === true ? "x" : ""}
                                </div>
                                <div className="w-full flex-1 text-gray-900 dark:text-white">
                                  {item.monday?.dinner === true ? "x" : ""}
                                </div>
                              </div>
                            </td>
                            <td className="whitespace-nowrap font-medium border-r border-gray-200 dark:border-gray-600">
                              <div className="grid grid-cols-3 gap-1">
                                <div className="w-full flex-1 text-gray-900 dark:text-white">
                                  {item.tuesday?.breakfast === true ? "x" : ""}
                                </div>
                                <div className="w-full flex-1 text-gray-900 dark:text-white">
                                  {item.tuesday?.lunch === true ? "x" : ""}
                                </div>
                                <div className="w-full flex-1 text-gray-900 dark:text-white">
                                  {item.tuesday?.dinner === true ? "x" : ""}
                                </div>
                              </div>
                            </td>
                            <td className="whitespace-nowrap font-medium border-r border-gray-200 dark:border-gray-600">
                              <div className="grid grid-cols-3 gap-1">
                                <div className="w-full flex-1 text-gray-900 dark:text-white">
                                  {item.wednesday?.breakfast === true
                                    ? "x"
                                    : ""}
                                </div>
                                <div className="w-full flex-1 text-gray-900 dark:text-white">
                                  {item.wednesday?.lunch === true ? "x" : ""}
                                </div>
                                <div className="w-full flex-1 text-gray-900 dark:text-white">
                                  {item.wednesday?.dinner === true ? "x" : ""}
                                </div>
                              </div>
                            </td>
                            <td className="whitespace-nowrap font-medium border-r border-gray-200 dark:border-gray-600">
                              <div className="grid grid-cols-3 gap-1">
                                <div className="w-full flex-1 text-gray-900 dark:text-white">
                                  {item.thursday?.breakfast === true ? "x" : ""}
                                </div>
                                <div className="w-full flex-1 text-gray-900 dark:text-white">
                                  {item.thursday?.lunch === true ? "x" : ""}
                                </div>
                                <div className="w-full flex-1 text-gray-900 dark:text-white">
                                  {item.thursday?.dinner === true ? "x" : ""}
                                </div>
                              </div>
                            </td>
                            <td className="whitespace-nowrap font-medium border-r border-gray-200 dark:border-gray-600">
                              <div className="grid grid-cols-3 gap-1">
                                <div className="w-full flex-1 text-gray-900 dark:text-white">
                                  {item.friday?.breakfast === true ? "x" : ""}
                                </div>
                                <div className="w-full flex-1 text-gray-900 dark:text-white">
                                  {item.friday?.lunch === true ? "x" : ""}
                                </div>
                                <div className="w-full flex-1 text-gray-900 dark:text-white">
                                  {item.friday?.dinner === true ? "x" : ""}
                                </div>
                              </div>
                            </td>
                            <td className="whitespace-nowrap font-medium border-r border-gray-200 dark:border-gray-600">
                              <div className="grid grid-cols-3 gap-1">
                                <div className="w-full flex-1 text-gray-900 dark:text-white">
                                  {item.saturday?.breakfast === true ? "x" : ""}
                                </div>
                                <div className="w-full flex-1 text-gray-900 dark:text-white">
                                  {item.saturday?.lunch === true ? "x" : ""}
                                </div>
                                <div className="w-full flex-1 text-gray-900 dark:text-white">
                                  {item.saturday?.dinner === true ? "x" : ""}
                                </div>
                              </div>
                            </td>
                            <td className="whitespace-nowrap font-medium border-r border-gray-200 dark:border-gray-600">
                              <div className="grid grid-cols-3 gap-1">
                                <div className="w-full flex-1 text-gray-900 dark:text-white">
                                  {item.sunday?.breakfast === true ? "x" : ""}
                                </div>
                                <div className="w-full flex-1 text-gray-900 dark:text-white">
                                  {item.sunday?.lunch === true ? "x" : ""}
                                </div>
                                <div className="w-full flex-1 text-gray-900 dark:text-white">
                                  {item.sunday?.dinner === true ? "x" : ""}
                                </div>
                              </div>
                            </td>
                            <td className="whitespace-nowrap font-medium border-r border-gray-200 dark:border-gray-600 p-2">
                              <div className="flex flex-col space-y-1">
                                <button
                                  className="bg-blue-600 hover:bg-blue-700 text-white font-medium rounded text-xs w-full px-2 py-1 transition-colors duration-200"
                                  onClick={() => handleEditClick(item)}
                                >
                                  Chỉnh sửa
                                </button>
                                {item.isAutoGenerated === false && (
                                  <button
                                    className="bg-green-600 hover:bg-green-700 text-white font-medium rounded text-xs w-full px-2 py-1 transition-colors duration-200"
                                    onClick={() =>
                                      handleGenerateAutoCutRiceForStudent(item)
                                    }
                                  >
                                    Tạo lại
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td
                            colSpan="10"
                            className="text-center py-8 text-gray-500 dark:text-gray-400"
                          >
                            <div className="flex flex-col items-center">
                              <svg
                                className="w-12 h-12 mb-4 text-gray-300 dark:text-gray-600"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                                xmlns="http://www.w3.org/2000/svg"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth="2"
                                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                              </svg>
                              <p className="text-lg font-medium">
                                Không có dữ liệu
                              </p>
                              <p className="text-sm">
                                Không tìm thấy thông tin cắt cơm nào
                              </p>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal chỉnh sửa lịch cắt cơm */}
      {showEditModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4 overflow-hidden">
          <div
            className="bg-black bg-opacity-50 inset-0 fixed"
            onClick={handleCloseEditModal}
          ></div>
          <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-5xl max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Chỉnh sửa lịch cắt cơm - {selectedStudent?.fullName}
              </h2>
              <button
                onClick={handleCloseEditModal}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <svg
                  className="h-6 w-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  ></path>
                </svg>
              </button>
            </div>
            <div className="overflow-y-auto max-h-[calc(90vh-120px)]">
              <form onSubmit={handleUpdateCutRice} className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {Object.entries(formData).map(([day, meals]) => (
                    <div
                      key={day}
                      className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4"
                    >
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                        {dayDisplayMapping[day]}
                      </h3>
                      <div className="space-y-3">
                        {Object.entries(meals).map(([meal, checked]) => (
                          <label
                            key={meal}
                            className="flex items-center space-x-3"
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={(e) => {
                                setFormData((prev) => ({
                                  ...prev,
                                  [day]: {
                                    ...prev[day],
                                    [meal]: e.target.checked,
                                  },
                                }));
                              }}
                              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                            />
                            <span className="text-gray-900 dark:text-white">
                              {meal === "breakfast"
                                ? "Bữa sáng"
                                : meal === "lunch"
                                ? "Bữa trưa"
                                : "Bữa tối"}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex justify-end mt-6">
                  <button
                    type="button"
                    className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 hover:text-gray-900 dark:hover:text-gray-100 mr-2"
                    onClick={handleCloseEditModal}
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm w-full sm:w-auto dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
                  >
                    Cập nhật
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal xuất Excel */}
      {showExportModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
          <div className="bg-black bg-opacity-50 inset-0 fixed"></div>
          <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Xuất Excel
              </h2>
              <button
                onClick={() => {
                  setShowExportModal(false);
                  setExportSelectedUnits([]);
                }}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <svg
                  className="h-6 w-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  ></path>
                </svg>
              </button>
            </div>
            <div className="p-6">
              <div className="mb-4">
                <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Chọn đơn vị
                </label>
                <ConfigProvider
                  theme={{
                    algorithm: isDark
                      ? theme.darkAlgorithm
                      : theme.defaultAlgorithm,
                  }}
                >
                  <Select
                    mode="multiple"
                    style={{ width: "100%" }}
                    placeholder="Chọn đơn vị để xuất Excel"
                    allowClear
                    value={exportSelectedUnits}
                    onChange={setExportSelectedUnits}
                    options={[
                      { value: "L1 - H5", label: "L1 - H5" },
                      { value: "L2 - H5", label: "L2 - H5" },
                      { value: "L3 - H5", label: "L3 - H5" },
                      { value: "L4 - H5", label: "L4 - H5" },
                      { value: "L5 - H5", label: "L5 - H5" },
                      { value: "L6 - H5", label: "L6 - H5" },
                    ]}
                  />
                </ConfigProvider>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Chọn nhiều đơn vị hoặc để trống để xuất tất cả đơn vị.
                </p>
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 hover:text-gray-900 dark:hover:text-gray-100"
                  onClick={() => {
                    setShowExportModal(false);
                    setExportSelectedUnits([]);
                  }}
                >
                  Hủy
                </button>
                <button
                  type="button"
                  className="px-4 py-2 text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
                  onClick={handleConfirmExport}
                >
                  Xuất Excel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal xuất Excel với lịch học */}
      {showExportExcelWithScheduleModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
          <div className="bg-black bg-opacity-50 inset-0 fixed"></div>
          <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Xuất Excel (Lịch học)
              </h2>
              <button
                onClick={() => {
                  setShowExportExcelWithScheduleModal(false);
                  setExportExcelWithScheduleSelectedUnits([]);
                }}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <svg
                  className="h-6 w-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  ></path>
                </svg>
              </button>
            </div>
            <div className="p-6">
              <div className="mb-4">
                <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Chọn đơn vị
                </label>
                <ConfigProvider
                  theme={{
                    algorithm: isDark
                      ? theme.darkAlgorithm
                      : theme.defaultAlgorithm,
                  }}
                >
                  <Select
                    mode="multiple"
                    style={{ width: "100%" }}
                    placeholder="Chọn đơn vị để xuất Excel với lịch học"
                    allowClear
                    value={exportExcelWithScheduleSelectedUnits}
                    onChange={setExportExcelWithScheduleSelectedUnits}
                    options={[
                      { value: "L1 - H5", label: "L1 - H5" },
                      { value: "L2 - H5", label: "L2 - H5" },
                      { value: "L3 - H5", label: "L3 - H5" },
                      { value: "L4 - H5", label: "L4 - H5" },
                      { value: "L5 - H5", label: "L5 - H5" },
                      { value: "L6 - H5", label: "L6 - H5" },
                    ]}
                  />
                </ConfigProvider>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Chọn nhiều đơn vị hoặc để trống để xuất tất cả đơn vị.
                </p>
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 hover:text-gray-900 dark:hover:text-gray-100"
                  onClick={() => {
                    setShowExportExcelWithScheduleModal(false);
                    setExportExcelWithScheduleSelectedUnits([]);
                  }}
                >
                  Hủy
                </button>
                <button
                  type="button"
                  className="px-4 py-2 text-white bg-green-700 hover:bg-green-800 focus:ring-4 focus:outline-none focus:ring-green-300 font-medium rounded-lg text-sm dark:bg-green-600 dark:hover:bg-green-700 dark:focus:ring-green-800"
                  onClick={handleConfirmExportExcelWithSchedule}
                >
                  Xuất Excel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default CutRice;
