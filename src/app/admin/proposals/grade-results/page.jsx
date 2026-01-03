"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import SideBar from "@/components/sidebar";
import Loader from "@/components/loader";
import { useLoading } from "@/hooks";
import { handleNotify } from "@/components/notify";
import axiosInstance from "@/utils/axiosInstance";
import { Select, Input, ConfigProvider, theme } from "antd";
import { BASE_URL } from "@/configs";
import FileAttachmentButtons from "@/components/FileAttachmentButtons";

const AdminProposalGradeResults = () => {
  const [allResults, setAllResults] = useState([]);
  const [statusCounts, setStatusCounts] = useState({
    pending: 0,
    approved: 0,
    rejected: 0,
  });
  const [viewingSemester, setViewingSemester] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedResult, setSelectedResult] = useState(null);
  const [adminNote, setAdminNote] = useState("");
  const [selectedIds, setSelectedIds] = useState([]);
  const [showBulkApproveModal, setShowBulkApproveModal] = useState(false);
  const [showBulkRejectModal, setShowBulkRejectModal] = useState(false);
  const [bulkAdminNote, setBulkAdminNote] = useState("");
  // Filters
  const [filterStatus, setFilterStatus] = useState(null);
  const [filterSemester, setFilterSemester] = useState(null);
  const [filterSchoolYear, setFilterSchoolYear] = useState(null);
  const [searchText, setSearchText] = useState("");
  const [isDark, setIsDark] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
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

  const fetchStatusCounts = async () => {
    try {
      const res = await axiosInstance.get("/grade-approval/counts");
      setStatusCounts(res.data);
    } catch (error) {
      console.error("Error fetching status counts:", error);
    }
  };

  const fetchAllResults = async () => {
    try {
      const res = await axiosInstance.get("/grade-approval/all?limit=100");
      setAllResults(res.data.data || []);
    } catch (error) {
      console.error("Error fetching all results:", error);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      await withLoading(async () => {
        await fetchStatusCounts();
        await fetchAllResults();
      });
    };
    loadData();
  }, [withLoading]);

  // Khóa scroll nền khi bất kỳ modal nào mở
  useEffect(() => {
    const hasOpenModal =
      showDetailModal ||
      showApproveModal ||
      showRejectModal ||
      showBulkApproveModal ||
      showBulkRejectModal;

    if (hasOpenModal) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";

      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [
    showDetailModal,
    showApproveModal,
    showRejectModal,
    showBulkApproveModal,
    showBulkRejectModal,
  ]);

  // Reset phân trang & lựa chọn khi thay đổi bộ lọc / tìm kiếm
  useEffect(() => {
    setCurrentPage(1);
    setSelectedIds([]);
  }, [filterStatus, filterSemester, filterSchoolYear, searchText]);

  // Get unique values for filters
  const uniqueSemesters = [
    ...new Set(allResults.map((r) => r.semester)),
  ].sort();
  const uniqueSchoolYears = [...new Set(allResults.map((r) => r.schoolYear))]
    .sort()
    .reverse();

  // Filter results và sắp xếp theo ngày cập nhật mới nhất
  const filteredResults = allResults
    .filter((item) => {
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
      if (searchText) {
        const searchLower = searchText.toLowerCase();
        matches =
          matches &&
          (item.student?.fullName?.toLowerCase().includes(searchLower) ||
            item.student?.studentId?.toLowerCase().includes(searchLower));
      }
      return matches;
    })
    .sort((a, b) => {
      // Sắp xếp theo ngày cập nhật mới nhất
      const dateA = new Date(a.updatedAt || a.createdAt || 0);
      const dateB = new Date(b.updatedAt || b.createdAt || 0);
      return dateB - dateA;
    });

  // Get pending results for bulk actions
  const pendingResults = filteredResults.filter((r) => r.status === "PENDING");

  // Phân trang trên client
  const totalItems = filteredResults.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const paginatedResults = filteredResults.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  // Pending trên trang hiện tại (dùng cho chọn tất cả)
  const pendingCurrentPageResults = paginatedResults.filter(
    (r) => r.status === "PENDING"
  );

  const handlePageSizeChange = (value) => {
    setPageSize(value);
    setCurrentPage(1);
  };

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

  const getProposalTypeBadge = (proposalType) => {
    switch (proposalType) {
      case "CREATE":
        return (
          <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
            Thêm mới
          </span>
        );
      case "UPDATE":
        return (
          <span className="px-2 py-1 text-xs font-medium rounded-full bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">
            Cập nhật
          </span>
        );
      case "DELETE":
        return (
          <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
            Yêu cầu xóa
          </span>
        );
      default:
        return (
          <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
            Thêm mới
          </span>
        );
    }
  };

  const handleViewDetail = (result) => {
    setViewingSemester(result);
    setShowDetailModal(true);
  };

  const handleApprove = (result) => {
    setSelectedResult(result);
    setAdminNote("");
    setShowApproveModal(true);
  };

  const handleReject = (result) => {
    setSelectedResult(result);
    setAdminNote("");
    setShowRejectModal(true);
  };

  const confirmApprove = async () => {
    try {
      await axiosInstance.post(`/grade-approval/approve/${selectedResult.id}`, {
        adminNote: adminNote || null,
      });
      handleNotify("success", "Thành công", "Đã phê duyệt kết quả học tập");
      setShowApproveModal(false);
      setSelectedResult(null);
      setAdminNote("");
      fetchStatusCounts();
      fetchAllResults();
    } catch (error) {
      handleNotify(
        "error",
        "Lỗi",
        error.response?.data?.message || "Không thể phê duyệt"
      );
    }
  };

  const confirmReject = async () => {
    if (!adminNote.trim()) {
      handleNotify("warning", "Cảnh báo", "Vui lòng nhập lý do từ chối");
      return;
    }
    try {
      await axiosInstance.post(`/grade-approval/reject/${selectedResult.id}`, {
        adminNote: adminNote,
      });
      handleNotify("success", "Thành công", "Đã từ chối kết quả học tập");
      setShowRejectModal(false);
      setSelectedResult(null);
      setAdminNote("");
      fetchStatusCounts();
      fetchAllResults();
    } catch (error) {
      handleNotify(
        "error",
        "Lỗi",
        error.response?.data?.message || "Không thể từ chối"
      );
    }
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(pendingCurrentPageResults.map((r) => r.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((i) => i !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleBulkApprove = () => {
    if (selectedIds.length === 0) {
      handleNotify("warning", "Cảnh báo", "Vui lòng chọn ít nhất một kết quả");
      return;
    }
    setBulkAdminNote("");
    setShowBulkApproveModal(true);
  };

  const confirmBulkApprove = async () => {
    try {
      await axiosInstance.post("/grade-approval/approve-bulk", {
        proposalIds: selectedIds,
        adminNote: bulkAdminNote || "Duyệt đồng loạt",
      });
      handleNotify(
        "success",
        "Thành công",
        `Đã phê duyệt ${selectedIds.length} kết quả`
      );
      setSelectedIds([]);
      setShowBulkApproveModal(false);
      setBulkAdminNote("");
      fetchStatusCounts();
      fetchAllResults();
    } catch (error) {
      handleNotify(
        "error",
        "Lỗi",
        error.response?.data?.message || "Không thể phê duyệt"
      );
    }
  };

  const handleBulkReject = () => {
    if (selectedIds.length === 0) {
      handleNotify("warning", "Cảnh báo", "Vui lòng chọn ít nhất một kết quả");
      return;
    }
    setBulkAdminNote("");
    setShowBulkRejectModal(true);
  };

  const confirmBulkReject = async () => {
    if (!bulkAdminNote.trim()) {
      handleNotify("warning", "Cảnh báo", "Vui lòng nhập lý do từ chối");
      return;
    }
    try {
      await axiosInstance.post("/grade-approval/reject-bulk", {
        proposalIds: selectedIds,
        adminNote: bulkAdminNote,
      });
      handleNotify(
        "success",
        "Thành công",
        `Đã từ chối ${selectedIds.length} kết quả`
      );
      setSelectedIds([]);
      setShowBulkRejectModal(false);
      setBulkAdminNote("");
      fetchStatusCounts();
      fetchAllResults();
    } catch (error) {
      handleNotify(
        "error",
        "Lỗi",
        error.response?.data?.message || "Không thể từ chối"
      );
    }
  };

  if (loading) {
    return <Loader text="Đang tải danh sách đề xuất..." />;
  }

  return (
    <>
      {/* CSS cho Ant Design (Input, Select) đồng bộ với dark mode, giống admin/list-user */}
      <style jsx global>{`
        /* Input styles - Light mode */
        .ant-input {
          background-color: rgb(249 250 251) !important; /* gray-50 */
          border-color: rgb(209 213 219) !important; /* gray-300 */
          color: rgb(17 24 39) !important; /* gray-900 */
          border-radius: 8px !important;
          border-width: 1px !important;
        }
        .ant-input::placeholder {
          color: rgb(156 163 175) !important; /* gray-400 */
        }
        .ant-input:focus,
        .ant-input-focused {
          border-color: rgb(37 99 235) !important; /* blue-600 */
          box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.2) !important;
        }

        /* Input styles - Dark mode */
        .dark .ant-input {
          background-color: rgb(31 41 55) !important; /* gray-800 */
          border-color: rgb(75 85 99) !important; /* gray-600 */
          color: rgb(255 255 255) !important;
        }
        .dark .ant-input::placeholder {
          color: rgb(156 163 175) !important; /* gray-400 */
        }
        .dark .ant-input:focus,
        .dark .ant-input-focused {
          border-color: rgb(37 99 235) !important; /* blue-600 */
          box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.2) !important;
        }

        /* Select styles - giống admin/list-user */
        .ant-select .ant-select-selector {
          background-color: rgb(255 255 255) !important;
          border-color: rgb(209 213 219) !important; /* gray-300 */
          color: rgb(17 24 39) !important; /* gray-900 */
        }
        .ant-select .ant-select-selection-placeholder {
          color: rgb(107 114 128) !important; /* gray-500 */
        }
        /* Tokens chỉ áp dụng cho chế độ multiple */
        .ant-select-multiple .ant-select-selection-item {
          background-color: rgb(239 246 255) !important; /* blue-50 */
          border-color: rgb(191 219 254) !important; /* blue-200 */
          color: rgb(30 58 138) !important; /* blue-900 */
        }
        /* Single select: chữ rõ, không nền */
        .ant-select-single .ant-select-selector .ant-select-selection-item {
          background-color: transparent !important;
          color: rgb(17 24 39) !important; /* gray-900 */
          font-weight: 600;
        }
        .ant-select-arrow,
        .ant-select-clear {
          color: rgb(107 114 128);
        }
        .ant-select-dropdown {
          background-color: rgb(255 255 255) !important;
          border: 1px solid rgb(229 231 235) !important; /* gray-200 */
        }
        .ant-select-item {
          color: rgb(17 24 39) !important;
        }
        .ant-select-item-option-active:not(.ant-select-item-option-disabled) {
          background-color: rgba(
            59,
            130,
            246,
            0.12
          ) !important; /* blue-500/12 */
          color: rgb(30 58 138) !important;
        }
        .ant-select-item-option-selected:not(.ant-select-item-option-disabled) {
          background-color: rgba(
            59,
            130,
            246,
            0.18
          ) !important; /* blue-500/18 */
          color: rgb(30 58 138) !important;
          font-weight: 600 !important;
        }

        .dark .ant-select .ant-select-selector {
          background-color: rgb(55 65 81) !important; /* gray-700 */
          border-color: rgb(75 85 99) !important; /* gray-600 */
          color: rgb(255 255 255) !important;
        }
        .dark .ant-select .ant-select-selection-placeholder {
          color: rgb(156 163 175) !important; /* gray-400 */
        }
        /* Tokens ở chế độ multiple trong dark */
        .dark .ant-select-multiple .ant-select-selection-item {
          background-color: rgb(75 85 99) !important; /* gray-600 */
          border-color: rgb(75 85 99) !important;
          color: rgb(255 255 255) !important;
        }
        /* Single select dark: chữ rõ, không nền */
        .dark
          .ant-select-single
          .ant-select-selector
          .ant-select-selection-item {
          background-color: transparent !important;
          color: rgb(255 255 255) !important;
          font-weight: 600;
        }
        .dark .ant-select-arrow,
        .dark .ant-select-clear {
          color: rgb(209 213 219) !important; /* gray-300 */
        }
        .dark .ant-select-dropdown {
          background-color: rgb(31 41 55) !important; /* gray-800 */
          border-color: rgb(55 65 81) !important; /* gray-700 */
        }
        .dark .ant-select-item {
          color: rgb(255 255 255) !important;
        }
        .dark
          .ant-select-item-option-active:not(.ant-select-item-option-disabled) {
          background-color: rgba(
            59,
            130,
            246,
            0.25
          ) !important; /* blue-500/25 */
          color: rgb(255 255 255) !important;
        }
        .dark
          .ant-select-item-option-selected:not(
            .ant-select-item-option-disabled
          ) {
          background-color: rgba(
            59,
            130,
            246,
            0.35
          ) !important; /* blue-500/35 */
          color: rgb(255 255 255) !important;
          font-weight: 600 !important;
        }
      `}</style>
      <div className="flex">
        <div>
          <SideBar />
        </div>
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
                      Duyệt đề xuất
                    </div>
                  </div>
                </li>
                <li>
                  <div className="flex items-center">
                    <svg
                      className="rtl:rotate-180 w-3 h-3 mx-1"
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
            {/* Thong ke - giống user page */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow duration-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                      Chờ duyệt
                    </p>
                    <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">
                      {statusCounts.pending}
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
                      {statusCounts.approved}
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
                      {statusCounts.rejected}
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
              <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow duration-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                      Tổng cộng
                    </p>
                    <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                      {statusCounts.total ||
                        statusCounts.pending +
                          statusCounts.approved +
                          statusCounts.rejected}
                    </p>
                  </div>
                  <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth="1.5"
                      stroke="currentColor"
                      className="w-6 h-6 text-blue-600 dark:text-blue-400"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z"
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
                    DUYỆT ĐỀ XUẤT KẾT QUẢ HỌC TẬP
                  </h1>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Quản lý và phê duyệt kết quả học tập của học viên
                  </p>
                </div>
                {selectedIds.length > 0 && (
                  <div className="flex space-x-2">
                    <button
                      onClick={handleBulkApprove}
                      className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 flex items-center text-sm"
                    >
                      <svg
                        className="w-4 h-4 mr-1.5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      Duyệt {selectedIds.length} mục
                    </button>
                    <button
                      onClick={handleBulkReject}
                      className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 flex items-center text-sm"
                    >
                      <svg
                        className="w-4 h-4 mr-1.5"
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
                      Từ chối {selectedIds.length} mục
                    </button>
                  </div>
                )}
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
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Tìm kiếm
                      </label>
                      <Input
                        value={searchText}
                        onChange={(e) => setSearchText(e.target.value)}
                        placeholder="Họ tên, MSSV..."
                        allowClear
                        style={{ height: 36 }}
                      />
                    </div>
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
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th className="border-r border-gray-200 dark:border-gray-600 py-3 px-2">
                          <input
                            type="checkbox"
                            onChange={handleSelectAll}
                            checked={
                              selectedIds.length ===
                                pendingCurrentPageResults.length &&
                              pendingCurrentPageResults.length > 0
                            }
                            className="w-4 h-4 text-blue-600 rounded"
                          />
                        </th>
                        <th className="border-r border-gray-200 dark:border-gray-600 py-3 px-4 text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">
                          Học viên
                        </th>
                        <th className="border-r border-gray-200 dark:border-gray-600 py-3 px-4 text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">
                          Loại
                        </th>
                        <th className="border-r border-gray-200 dark:border-gray-600 py-3 px-4 text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">
                          Học kỳ
                        </th>
                        <th className="border-r border-gray-200 dark:border-gray-600 py-3 px-4 text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">
                          Năm học
                        </th>
                        <th className="border-r border-gray-200 dark:border-gray-600 py-3 px-4 text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">
                          GPA
                        </th>
                        <th className="border-r border-gray-200 dark:border-gray-600 py-3 px-4 text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">
                          Số môn
                        </th>
                        <th className="border-r border-gray-200 dark:border-gray-600 py-3 px-4 text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">
                          Trạng thái
                        </th>
                        <th className="border-r border-gray-200 dark:border-gray-600 py-3 px-4 text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">
                          Ngày cập nhật
                        </th>
                        <th className="py-3 px-4 text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">
                          Hành động
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800">
                      {filteredResults.length === 0 ? (
                        <tr>
                          <td
                            colSpan={10}
                            className="py-8 text-gray-500 dark:text-gray-400"
                          >
                            Không có đề xuất nào
                          </td>
                        </tr>
                      ) : (
                        paginatedResults.map((item, index) => (
                          <tr
                            key={index}
                            className="border-b border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
                          >
                            <td className="border-r border-gray-200 dark:border-gray-600 py-4 px-2">
                              {item.status === "PENDING" ? (
                                <input
                                  type="checkbox"
                                  checked={selectedIds.includes(item.id)}
                                  onChange={() => handleSelectOne(item.id)}
                                  className="w-4 h-4 text-blue-600 rounded"
                                />
                              ) : (
                                <span className="text-gray-300">-</span>
                              )}
                            </td>
                            <td className="whitespace-nowrap font-medium border-r border-gray-200 dark:border-gray-600 py-4 px-4">
                              <div className="flex flex-col">
                                <div className="font-medium">
                                  {item.student?.fullName || "-"}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {item.student?.studentId || "-"}
                                </div>
                              </div>
                            </td>
                            <td className="whitespace-nowrap border-r border-gray-200 dark:border-gray-600 py-4 px-4">
                              {getProposalTypeBadge(item.proposalType)}
                            </td>
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
                                <div className="text-xs text-gray-500">
                                  {item.averageGrade10?.toFixed(2) || "0.00"}
                                </div>
                              </div>
                            </td>
                            <td className="whitespace-nowrap font-medium border-r border-gray-200 dark:border-gray-600 py-4 px-4">
                              {item.subjects?.length || 0} môn
                            </td>
                            <td className="whitespace-nowrap border-r border-gray-200 dark:border-gray-600 py-4 px-4">
                              {getStatusBadge(item.status)}
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
                                : "-"}
                            </td>
                            <td className="py-4 px-4">
                              <div className="flex items-center justify-center space-x-1">
                                <button
                                  onClick={() => handleViewDetail(item)}
                                  className="text-blue-600 hover:text-blue-900 dark:text-blue-400 p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20"
                                  title="Xem chi tiết"
                                >
                                  <svg
                                    className="w-4 h-4"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth="2"
                                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                    />
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth="2"
                                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                    />
                                  </svg>
                                </button>
                                {item.status === "PENDING" && (
                                  <>
                                    <button
                                      onClick={() => handleApprove(item)}
                                      className="text-green-600 hover:text-green-900 dark:text-green-400 p-1.5 rounded-lg hover:bg-green-50 dark:hover:bg-green-900/20"
                                      title="Phê duyệt"
                                    >
                                      <svg
                                        className="w-4 h-4"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth="2"
                                          d="M5 13l4 4L19 7"
                                        />
                                      </svg>
                                    </button>
                                    <button
                                      onClick={() => handleReject(item)}
                                      className="text-red-600 hover:text-red-900 dark:text-red-400 p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
                                      title="Từ chối"
                                    >
                                      <svg
                                        className="w-4 h-4"
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
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
                {totalItems > 0 && (
                  <div className="flex justify-between items-center mr-5 pb-5 mt-4">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm ml-1 text-gray-700 dark:text-gray-300">
                        Hiển thị:
                      </span>
                      <Select
                        value={pageSize}
                        onChange={handlePageSizeChange}
                        style={{ width: 80 }}
                        options={[
                          { value: 5, label: "5" },
                          { value: 10, label: "10" },
                          { value: 20, label: "20" },
                          { value: 50, label: "50" },
                          { value: 100, label: "100" },
                        ]}
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        kết quả/trang
                      </span>
                    </div>
                    <div className="flex items-center space-x-4">
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        Trang {currentPage} / {totalPages} ({totalItems} kết
                        quả)
                      </span>
                      <nav aria-label="Page navigation">
                        <ul className="list-style-none flex">
                          <li>
                            <button
                              className={`relative mr-1 block rounded bg-transparent px-3 py-1.5 font-bold text-sm transition-all duration-300 ${
                                currentPage <= 1
                                  ? "opacity-50 cursor-not-allowed"
                                  : "hover:bg-blue-200 dark:hover:bg-blue-900/40"
                              }`}
                              onClick={() => {
                                if (currentPage > 1) {
                                  setCurrentPage(currentPage - 1);
                                }
                              }}
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
                                  d="M15.75 19.5 8.25 12l7.5-7.5"
                                />
                              </svg>
                            </button>
                          </li>
                          {Array.from(
                            { length: totalPages },
                            (_, index) => index + 1
                          ).map((pageNumber) => (
                            <li key={pageNumber}>
                              <button
                                className={`relative mr-1 block rounded bg-transparent px-3 py-1.5 font-bold text-sm transition-all duration-300 ${
                                  currentPage === pageNumber
                                    ? "bg-blue-200 dark:bg-blue-900/60"
                                    : "hover:bg-blue-200 dark:hover:bg-blue-900/40"
                                }`}
                                onClick={() => setCurrentPage(pageNumber)}
                              >
                                {pageNumber}
                              </button>
                            </li>
                          ))}
                          <li>
                            <button
                              className={`relative block rounded bg-transparent px-3 py-1.5 font-bold text-sm transition-all duration-300 ${
                                currentPage >= totalPages
                                  ? "opacity-50 cursor-not-allowed"
                                  : "hover:bg-blue-200 dark:hover:bg-blue-900/40"
                              }`}
                              onClick={() => {
                                if (currentPage < totalPages) {
                                  setCurrentPage(currentPage + 1);
                                }
                              }}
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
                                  d="m8.25 4.5 7.5 7.5-7.5 7.5"
                                />
                              </svg>
                            </button>
                          </li>
                        </ul>
                      </nav>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal xem chi tiet */}
      {showDetailModal && viewingSemester && (
        <div className="fixed inset-0 flex items-center justify-center z-50 pt-10 p-4">
          <div
            className="bg-black bg-opacity-50 inset-0 fixed"
            onClick={() => setShowDetailModal(false)}
          ></div>
          <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Chi tiết - {viewingSemester.student?.fullName} -{" "}
                {viewingSemester.semester}
              </h2>
              <button
                onClick={() => setShowDetailModal(false)}
                className="text-gray-400 hover:text-gray-600"
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
              {/* Thông tin học viên */}
              <div className="mb-6 p-4 rounded-lg bg-gray-50 dark:bg-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Thông tin học viên
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Họ tên:</span>{" "}
                    {viewingSemester.student?.fullName}
                  </div>
                  <div>
                    <span className="text-gray-500">MSSV:</span>{" "}
                    {viewingSemester.student?.studentId}
                  </div>
                  <div>
                    <span className="text-gray-500">Học kỳ:</span>{" "}
                    {viewingSemester.semester}
                  </div>
                  <div>
                    <span className="text-gray-500">Năm học:</span>{" "}
                    {viewingSemester.schoolYear}
                  </div>
                </div>
              </div>

              {/* File đính kèm */}
              {viewingSemester.attachmentFile && (
                <div className="mb-6 p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                    File đính kèm
                  </h3>
                  <FileAttachmentButtons fileName={viewingSemester.attachmentFile} />
                </div>
              )}

              {/* Loại đề xuất và Trạng thái */}
              <div className="mb-6 p-4 rounded-lg bg-gray-50 dark:bg-gray-700">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                        Loại đề xuất
                      </h3>
                      {getProposalTypeBadge(viewingSemester.proposalType)}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                        Trạng thái
                      </h3>
                      {getStatusBadge(viewingSemester.status)}
                    </div>
                  </div>
                  {viewingSemester.status === "PENDING" && (
                    <div className="flex space-x-2">
                      <button
                        onClick={() => {
                          setShowDetailModal(false);
                          handleApprove(viewingSemester);
                        }}
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm"
                      >
                        Phê duyệt
                      </button>
                      <button
                        onClick={() => {
                          setShowDetailModal(false);
                          handleReject(viewingSemester);
                        }}
                        className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm"
                      >
                        Từ chối
                      </button>
                    </div>
                  )}
                </div>
                {viewingSemester.adminNote && (
                  <div className="mt-4 p-3 bg-white dark:bg-gray-800 rounded border">
                    <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Ghi chú:
                    </div>
                    <div className="text-gray-600 dark:text-gray-400">
                      {viewingSemester.adminNote}
                    </div>
                  </div>
                )}
              </div>

              {/* Thông tin tổng quan */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {viewingSemester.totalCredits || 0}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Tổng tín chỉ
                  </div>
                </div>
                <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {viewingSemester.averageGrade4?.toFixed(2) || "0.00"}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    GPA (Hệ 4)
                  </div>
                </div>
                <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                    {viewingSemester.averageGrade10?.toFixed(2) || "0.00"}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    GPA (Hệ 10)
                  </div>
                </div>
                <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                    {viewingSemester.subjects?.length || 0}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Số môn học
                  </div>
                </div>
              </div>

              {/* Bảng chi tiết môn học */}
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
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Mã môn
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Tên môn học
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                          Tín chỉ
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                          Điểm chữ
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                          Điểm hệ 4
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                          Điểm hệ 10
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {viewingSemester.subjects?.map((subject, index) => (
                        <tr
                          key={index}
                          className="hover:bg-gray-50 dark:hover:bg-gray-700"
                        >
                          <td className="px-4 py-3 text-sm font-medium">
                            {subject.subjectCode}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            {subject.subjectName}
                          </td>
                          <td className="px-4 py-3 text-sm text-center">
                            {subject.credits}
                          </td>
                          <td className="px-4 py-3 text-sm text-center">
                            <span
                              className={`px-2 py-1 text-xs font-medium rounded-full ${
                                subject.letterGrade === "A+" ||
                                subject.letterGrade === "A"
                                  ? "bg-green-100 text-green-800"
                                  : subject.letterGrade === "B+" ||
                                    subject.letterGrade === "B"
                                  ? "bg-blue-100 text-blue-800"
                                  : subject.letterGrade === "C+" ||
                                    subject.letterGrade === "C"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : "bg-red-100 text-red-800"
                              }`}
                            >
                              {subject.letterGrade}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-center">
                            {subject.gradePoint4?.toFixed(2)}
                          </td>
                          <td className="px-4 py-3 text-sm text-center">
                            {subject.gradePoint10?.toFixed(2)}
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

      {/* Modal phê duyệt */}
      {showApproveModal && selectedResult && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
          <div
            className="bg-black bg-opacity-50 inset-0 fixed"
            onClick={() => setShowApproveModal(false)}
          ></div>
          <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Xác nhận phê duyệt
              </h2>
            </div>
            <div className="p-6">
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                Bạn có chắc chắn muốn phê duyệt kết quả học tập của{" "}
                <strong>{selectedResult.student?.fullName}</strong>?
              </p>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Ghi chú (không bắt buộc)
                </label>
                <textarea
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                  rows="3"
                  placeholder="Nhập ghi chú..."
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowApproveModal(false)}
                  className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg"
                >
                  Hủy
                </button>
                <button
                  onClick={confirmApprove}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg"
                >
                  Phê duyệt
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal từ chối */}
      {showRejectModal && selectedResult && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
          <div
            className="bg-black bg-opacity-50 inset-0 fixed"
            onClick={() => setShowRejectModal(false)}
          ></div>
          <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Xác nhận từ chối
              </h2>
            </div>
            <div className="p-6">
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                Bạn có chắc chắn muốn từ chối kết quả học tập của{" "}
                <strong>{selectedResult.student?.fullName}</strong>?
              </p>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 after:content-['*'] after:ml-0.5 after:text-red-500">
                  Lý do từ chối
                </label>
                <textarea
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                  rows="3"
                  placeholder="Nhập lý do từ chối..."
                  required
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowRejectModal(false)}
                  className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg"
                >
                  Hủy
                </button>
                <button
                  onClick={confirmReject}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg"
                >
                  Từ chối
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal duyệt đồng thời */}
      {showBulkApproveModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
          <div
            className="bg-black bg-opacity-50 inset-0 fixed"
            onClick={() => setShowBulkApproveModal(false)}
          ></div>
          <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Duyệt đồng thời {selectedIds.length} kết quả
              </h2>
            </div>
            <div className="p-6">
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                Bạn có chắc chắn muốn phê duyệt{" "}
                <strong>{selectedIds.length}</strong> kết quả học tập đã chọn?
              </p>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Ghi chú (không bắt buộc)
                </label>
                <textarea
                  value={bulkAdminNote}
                  onChange={(e) => setBulkAdminNote(e.target.value)}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                  rows="3"
                  placeholder="Nhập ghi chú..."
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowBulkApproveModal(false)}
                  className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg"
                >
                  Hủy
                </button>
                <button
                  onClick={confirmBulkApprove}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg"
                >
                  Phê duyệt tất cả
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal từ chối đồng thời */}
      {showBulkRejectModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
          <div
            className="bg-black bg-opacity-50 inset-0 fixed"
            onClick={() => setShowBulkRejectModal(false)}
          ></div>
          <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-lg w-full">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Từ chối đồng thời {selectedIds.length} kết quả
              </h2>
            </div>
            <div className="p-6">
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                Bạn có chắc chắn muốn từ chối{" "}
                <strong>{selectedIds.length}</strong> kết quả học tập đã chọn?
              </p>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 after:content-['*'] after:ml-0.5 after:text-red-500">
                  Lý do từ chối
                </label>
                <textarea
                  value={bulkAdminNote}
                  onChange={(e) => setBulkAdminNote(e.target.value)}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                  rows="3"
                  placeholder="Nhập lý do từ chối..."
                  required
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowBulkRejectModal(false)}
                  className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg"
                >
                  Hủy
                </button>
                <button
                  onClick={confirmBulkReject}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg"
                >
                  Từ chối tất cả
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AdminProposalGradeResults;
