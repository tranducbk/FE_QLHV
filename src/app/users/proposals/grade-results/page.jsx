"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import SideBar from "@/components/sidebar";
import Loader from "@/components/loader";
import { useLoading } from "@/hooks";
import axiosInstance from "@/utils/axiosInstance";
import { Select, ConfigProvider, theme } from "antd";
import { BASE_URL } from "@/configs";
import FileAttachmentButtons from "@/components/FileAttachmentButtons";

const handleNotify = (type, title, message) => {
  const event = new CustomEvent("notify", {
    detail: { type, title, message },
  });
  window.dispatchEvent(event);
};

const ProposalGradeResults = () => {
  const [proposals, setProposals] = useState([]);
  const [studentId, setStudentId] = useState(null);
  const [viewingProposal, setViewingProposal] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingProposal, setDeletingProposal] = useState(null);
  // Filters
  const [filterStatus, setFilterStatus] = useState(null);
  const [filterSemester, setFilterSemester] = useState(null);
  const [filterSchoolYear, setFilterSchoolYear] = useState(null);
  const [isDark, setIsDark] = useState(false);
  const { loading, withLoading } = useLoading(true);

  // Phát hiện theme hiện tại
  useEffect(() => {
    const checkTheme = () => {
      const isDarkMode = document.documentElement.classList.contains("dark");
      setIsDark(isDarkMode);
    };
    checkTheme();
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => observer.disconnect();
  }, []);

  // Lấy studentId từ userId
  const fetchStudentId = async () => {
    try {
      const userRes = await axiosInstance.get("/user/me");
      const userId = userRes.data.id;
      const res = await axiosInstance.get(`/student/by-user/${userId}`);
      setStudentId(res.data.id);
      return res.data.id;
    } catch (error) {
      console.error("Error fetching studentId:", error);
      return null;
    }
  };

  const fetchGradeResults = async () => {
    if (studentId) {
      try {
        const res = await axiosInstance.get(`/student/${studentId}/grades`);
        // Lấy proposals từ API response (đề xuất chờ duyệt/đã từ chối)
        setProposals(res.data.proposals || []);
      } catch (error) {
        console.log(error);
      }
    }
  };

  useEffect(() => {
    const loadData = async () => {
      await withLoading(async () => {
        await fetchStudentId();
      });
    };
    loadData();
  }, [withLoading]);

  useEffect(() => {
    if (studentId) {
      fetchGradeResults();
    }
  }, [studentId]);

  const getStatusBadge = (status) => {
    switch (status) {
      case "APPROVED":
        return (
          <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
            Đã duyệt
          </span>
        );
      case "PENDING":
        return (
          <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
            Chờ duyệt
          </span>
        );
      case "REJECTED":
        return (
          <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
            Từ chối
          </span>
        );
      default:
        return (
          <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200">
            Không xác định
          </span>
        );
    }
  };

  const handleViewDetail = (proposal) => {
    setViewingProposal(proposal);
    setShowDetailModal(true);
  };

  const handleDeleteClick = (proposal) => {
    setDeletingProposal(proposal);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!deletingProposal || !studentId) return;

    try {
      // Sử dụng proposalId để xóa chính xác đề xuất cần xóa
      await axiosInstance.delete(
        `/student/${studentId}/grades/proposal/${deletingProposal.id}`
      );
      handleNotify(
        "success",
        "Thành công",
        `Đã xóa đề xuất ${deletingProposal.semester} - ${deletingProposal.schoolYear}`
      );
      setShowDeleteModal(false);
      setDeletingProposal(null);
      fetchGradeResults();
    } catch (error) {
      handleNotify(
        "error",
        "Lỗi",
        error.response?.data?.message || "Không thể xóa đề xuất"
      );
    }
  };

  if (loading) {
    return <Loader text="Đang tải thông tin đề xuất..." />;
  }

  // Thống kê
  const pendingCount = proposals.filter(
    (r) => r.status === "PENDING"
  ).length;
  const approvedCount = proposals.filter(
    (r) => r.status === "APPROVED"
  ).length;
  const rejectedCount = proposals.filter(
    (r) => r.status === "REJECTED"
  ).length;

  // Get unique values for filters
  const uniqueSemesters = [
    ...new Set(proposals.map((r) => r.semester)),
  ].sort();
  const uniqueSchoolYears = [
    ...new Set(proposals.map((r) => r.schoolYear)),
  ]
    .sort()
    .reverse();

  // Filter results
  const filteredResults = proposals.filter((item) => {
    let matches = true;
    if (filterStatus) {
      matches = matches && item.status === filterStatus;
    }
    if (filterSemester) {
      matches = matches && item.semester === filterSemester;
    }
    if (filterSchoolYear) {
      matches = matches && item.schoolYear === filterSchoolYear;
    }
    return matches;
  });

  return (
    <>
      <div className="flex">
        <div>
          <SideBar />
        </div>
        <div className="flex-1 min-h-screen bg-gray-50 dark:bg-gray-900 ml-64">
          <div className="w-full pt-20 pl-5">
            <nav className="flex" aria-label="Breadcrumb">
              <ol className="inline-flex items-center space-x-1 md:space-x-2 rtl:space-x-reverse">
                <li className="inline-flex items-center">
                  <Link
                    href="/users"
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
                      Quản lý đề xuất
                    </div>
                  </div>
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
                      Kết quả học tập
                    </div>
                  </div>
                </li>
              </ol>
            </nav>
          </div>

          <div className="w-full pt-8 pb-5 pl-5 pr-6 mb-5 space-y-6">
            {/* Thong ke */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow duration-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                      Chờ duyệt
                    </p>
                    <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">
                      {pendingCount}
                    </p>
                  </div>
                  <div className="p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-full">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth="1.5"
                      stroke="currentColor"
                      className="w-6 h-6 text-yellow-600 dark:text-yellow-400"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                </div>
              </div>
              <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow duration-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                      Đã duyệt
                    </p>
                    <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                      {approvedCount}
                    </p>
                  </div>
                  <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-full">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth="1.5"
                      stroke="currentColor"
                      className="w-6 h-6 text-green-600 dark:text-green-400"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                </div>
              </div>
              <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow duration-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                      Từ chối
                    </p>
                    <p className="text-3xl font-bold text-red-600 dark:text-red-400">
                      {rejectedCount}
                    </p>
                  </div>
                  <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-full">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth="1.5"
                      stroke="currentColor"
                      className="w-6 h-6 text-red-600 dark:text-red-400"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Bang ket qua */}
            <div className="bg-white dark:bg-gray-800 rounded-lg w-full shadow-lg">
              <div className="flex justify-between items-center font-bold p-5 border-b border-gray-200 dark:border-gray-700">
                <div className="text-gray-900 dark:text-white">
                  <h1 className="text-2xl font-bold">
                    ĐỀ XUẤT KẾT QUẢ HỌC TẬP
                  </h1>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Theo dõi trạng thái phê duyệt kết quả học tập của bạn
                  </p>
                </div>
                <Link
                  href="/users/semester-results"
                  className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 border border-blue-600 hover:border-blue-700 rounded-lg transition-colors duration-200 flex items-center text-sm"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth="1.5"
                    stroke="currentColor"
                    className="w-4 h-4 mr-1.5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 4.5v15m7.5-7.5h-15"
                    />
                  </svg>
                  Thêm kết quả mới
                </Link>
              </div>

              {/* Bộ lọc */}
              <div className="p-5 border-b border-gray-200 dark:border-gray-700">
                <ConfigProvider
                  theme={{
                    algorithm: isDark
                      ? theme.darkAlgorithm
                      : theme.defaultAlgorithm,
                    token: {
                      colorPrimary: "#2563eb",
                      borderRadius: 8,
                      controlOutline: "rgba(37,99,235,0.2)",
                      colorBgContainer: isDark ? "#1f2937" : "#ffffff",
                      colorBgElevated: isDark ? "#1f2937" : "#ffffff",
                      colorText: isDark ? "#e5e7eb" : "#111827",
                      colorTextPlaceholder: isDark ? "#9ca3af" : "#9ca3af",
                      colorBorder: isDark ? "#374151" : "#d1d5db",
                    },
                  }}
                >
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Trạng thái
                      </label>
                      <Select
                        value={filterStatus}
                        onChange={setFilterStatus}
                        placeholder="Tất cả trạng thái"
                        allowClear
                        style={{ width: "100%", height: 36 }}
                        options={[
                          { value: "PENDING", label: "Chờ duyệt" },
                          { value: "APPROVED", label: "Đã duyệt" },
                          { value: "REJECTED", label: "Từ chối" },
                        ]}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Học kỳ
                      </label>
                      <Select
                        value={filterSemester}
                        onChange={setFilterSemester}
                        placeholder="Tất cả học kỳ"
                        allowClear
                        style={{ width: "100%", height: 36 }}
                        options={uniqueSemesters.map((sem) => ({
                          value: sem,
                          label: sem,
                        }))}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Năm học
                      </label>
                      <Select
                        value={filterSchoolYear}
                        onChange={setFilterSchoolYear}
                        placeholder="Tất cả năm học"
                        allowClear
                        style={{ width: "100%", height: 36 }}
                        options={uniqueSchoolYears.map((year) => ({
                          value: year,
                          label: year,
                        }))}
                      />
                    </div>
                  </div>
                </ConfigProvider>
              </div>

              <div className="w-full pl-6 pb-6 pr-6 mt-4">
                <div className="overflow-x-auto">
                  <table className="min-w-full border border-gray-200 dark:border-gray-700 text-center text-sm font-light text-gray-900 dark:text-white rounded-lg">
                    <thead className="bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600">
                      <tr>
                        <th className="border-r border-gray-200 dark:border-gray-600 py-3 px-4 text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                          Học kỳ
                        </th>
                        <th className="border-r border-gray-200 dark:border-gray-600 py-3 px-4 text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                          Năm học
                        </th>
                        <th className="border-r border-gray-200 dark:border-gray-600 py-3 px-4 text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                          GPA
                        </th>
                        <th className="border-r border-gray-200 dark:border-gray-600 py-3 px-4 text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                          Trạng thái
                        </th>
                        <th className="border-r border-gray-200 dark:border-gray-600 py-3 px-4 text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                          Ghi chú của Chỉ huy
                        </th>
                        <th className="border-r border-gray-200 dark:border-gray-600 py-3 px-4 text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                          Thời gian cập nhật
                        </th>
                        <th className="py-3 px-4 text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                          Hành động
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800">
                      {filteredResults.length === 0 ? (
                        <tr>
                          <td
                            colSpan="7"
                            className="py-8 text-gray-500 dark:text-gray-400"
                          >
                            Chưa có đề xuất kết quả học tập nào
                          </td>
                        </tr>
                      ) : (
                        filteredResults
                          .slice()
                          .sort((a, b) => {
                            // Sắp xếp theo thời gian cập nhật mới nhất
                            const dateA = new Date(a.updatedAt || a.createdAt || 0);
                            const dateB = new Date(b.updatedAt || b.createdAt || 0);
                            return dateB - dateA;
                          })
                          .map((item, index) => (
                            <tr
                              key={index}
                              className="border-b border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
                            >
                              <td className="whitespace-nowrap font-medium border-r border-gray-200 dark:border-gray-600 py-4 px-4">
                                {item.semester}
                              </td>
                              <td className="whitespace-nowrap font-medium border-r border-gray-200 dark:border-gray-600 py-4 px-4">
                                {item.schoolYear}
                              </td>
                              <td className="whitespace-nowrap font-medium border-r border-gray-200 dark:border-gray-600 py-4 px-4">
                                <div className="flex flex-col">
                                  <div className="font-medium text-blue-600 dark:text-blue-400">
                                    {item.averageGrade4?.toFixed(2) || "0.00"}
                                  </div>
                                  <div className="text-xs text-gray-500 dark:text-gray-400">
                                    {item.averageGrade10?.toFixed(2) || "0.00"}
                                  </div>
                                </div>
                              </td>
                              <td className="whitespace-nowrap border-r border-gray-200 dark:border-gray-600 py-4 px-4">
                                {getStatusBadge(item.status)}
                              </td>
                              <td className="border-r border-gray-200 dark:border-gray-600 py-4 px-4 max-w-xs">
                                <div className="text-sm text-gray-600 dark:text-gray-400 truncate">
                                  {item.adminNote || "-"}
                                </div>
                              </td>
                              <td className="whitespace-nowrap font-medium border-r border-gray-200 dark:border-gray-600 py-4 px-4">
                                {item.updatedAt
                                  ? new Date(item.updatedAt).toLocaleString(
                                      "vi-VN",
                                      {
                                        day: "2-digit",
                                        month: "2-digit",
                                        year: "numeric",
                                        hour: "2-digit",
                                        minute: "2-digit",
                                      }
                                    )
                                  : item.createdAt
                                  ? new Date(item.createdAt).toLocaleString(
                                      "vi-VN",
                                      {
                                        day: "2-digit",
                                        month: "2-digit",
                                        year: "numeric",
                                        hour: "2-digit",
                                        minute: "2-digit",
                                      }
                                    )
                                  : "-"}
                              </td>
                              <td className="py-4 px-4">
                                <div className="flex items-center justify-center space-x-1">
                                  <button
                                    onClick={() => handleViewDetail(item)}
                                    className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 p-2 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors duration-200"
                                    title="Xem chi tiết"
                                  >
                                    <svg
                                      xmlns="http://www.w3.org/2000/svg"
                                      fill="none"
                                      viewBox="0 0 24 24"
                                      strokeWidth="1.5"
                                      stroke="currentColor"
                                      className="w-5 h-5"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.639 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.639 0-8.573-3.007-9.963-7.178z"
                                      />
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                      />
                                    </svg>
                                  </button>
                                  {item.status === "PENDING" && (
                                    <button
                                      onClick={() => handleDeleteClick(item)}
                                      className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors duration-200"
                                      title="Xóa đề xuất"
                                    >
                                      <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        strokeWidth="1.5"
                                        stroke="currentColor"
                                        className="w-5 h-5"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
                                        />
                                      </svg>
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal xem chi tiet */}
      {showDetailModal && viewingProposal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 pt-10 p-4">
          <div className="bg-black bg-opacity-50 inset-0 fixed"></div>
          <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Kết quả học tập - {viewingProposal.semester} năm học{" "}
                {viewingProposal.schoolYear}
              </h2>
              <button
                onClick={() => {
                  setShowDetailModal(false);
                  setViewingProposal(null);
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
                  />
                </svg>
              </button>
            </div>
            <div className="overflow-y-auto max-h-[calc(95vh-120px)] p-6">
              {/* Trang thai */}
              <div className="mb-6 p-4 rounded-lg bg-gray-50 dark:bg-gray-700">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      Trạng thái phê duyệt
                    </h3>
                    {getStatusBadge(viewingProposal.status)}
                  </div>
                  {viewingProposal.approvedAt && (
                    <div className="text-right text-sm text-gray-600 dark:text-gray-400">
                      <div>
                        Ngày duyệt:{" "}
                        {new Date(
                          viewingProposal.approvedAt
                        ).toLocaleDateString("vi-VN")}
                      </div>
                    </div>
                  )}
                </div>
                {viewingProposal.adminNote && (
                  <div className="mt-4 p-3 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-600">
                    <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Ghi chú của Chỉ huy:
                    </div>
                    <div className="text-gray-600 dark:text-gray-400">
                      {viewingProposal.adminNote}
                    </div>
                  </div>
                )}
              </div>

              {/* File đính kèm */}
              {viewingProposal.attachmentFile && (
                <div className="mb-6 p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                    File đính kèm
                  </h3>
                  <FileAttachmentButtons fileName={viewingProposal.attachmentFile} />
                </div>
              )}

              {/* Thong tin tong quan */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {viewingProposal.totalCredits || 0}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Tổng tín chỉ
                  </div>
                </div>
                <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {viewingProposal.averageGrade4?.toFixed(2) || "0.00"}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    GPA (Hệ 4)
                  </div>
                </div>
                <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                    {viewingProposal.averageGrade10?.toFixed(2) || "0.00"}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    GPA (Hệ 10)
                  </div>
                </div>
                <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                    {viewingProposal.subjects?.length || 0}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Số môn học
                  </div>
                </div>
              </div>

              {/* Bang chi tiet mon hoc */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
                <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Chi tiết các môn học
                  </h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                          Mã môn
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                          Tên môn học
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                          Tín chỉ
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                          Điểm chữ
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                          Điểm hệ 4
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                          Điểm hệ 10
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {viewingProposal.subjects?.map((subject, index) => (
                        <tr
                          key={index}
                          className="hover:bg-gray-50 dark:hover:bg-gray-700"
                        >
                          <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                            {subject.subjectCode}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                            {subject.subjectName}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-center text-gray-900 dark:text-white">
                            {subject.credits}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-center">
                            <span
                              className={`px-2 py-1 text-xs font-medium rounded-full ${
                                subject.letterGrade === "A+" ||
                                subject.letterGrade === "A"
                                  ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                                  : subject.letterGrade === "B+" ||
                                    subject.letterGrade === "B"
                                  ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                                  : subject.letterGrade === "C+" ||
                                    subject.letterGrade === "C"
                                  ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                                  : subject.letterGrade === "D+" ||
                                    subject.letterGrade === "D"
                                  ? "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200"
                                  : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                              }`}
                            >
                              {subject.letterGrade}
                            </span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-center text-gray-900 dark:text-white">
                            {subject.gradePoint4?.toFixed(2) || "0.00"}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-center text-gray-900 dark:text-white">
                            {subject.gradePoint10?.toFixed(2) || "0.00"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal xác nhận xóa */}
      {showDeleteModal && deletingProposal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
          <div
            className="bg-black bg-opacity-50 inset-0 fixed"
            onClick={() => {
              setShowDeleteModal(false);
              setDeletingProposal(null);
            }}
          ></div>
          <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-lg w-full">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Xác nhận xóa đề xuất
              </h2>
            </div>
            <div className="p-6">
              <div className="flex items-center mb-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth="1.5"
                    stroke="currentColor"
                    className="w-6 h-6 text-red-600 dark:text-red-400"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
                    />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-gray-700 dark:text-gray-300">
                    Bạn có chắc chắn muốn xóa đề xuất kết quả học tập?
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    <strong>{deletingProposal.semester}</strong> năm học{" "}
                    <strong>{deletingProposal.schoolYear}</strong>
                  </p>
                </div>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                Hành động này không thể hoàn tác. Tất cả dữ liệu môn học trong
                đề xuất này sẽ bị xóa vĩnh viễn.
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setDeletingProposal(null);
                  }}
                  className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors duration-200"
                >
                  Hủy
                </button>
                <button
                  onClick={confirmDelete}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors duration-200"
                >
                  Xóa đề xuất
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ProposalGradeResults;
