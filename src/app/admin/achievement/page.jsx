"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { handleNotify } from "../../../components/notify";
import Loader from "@/components/loader";
import { Select } from "antd";
import { useModalScroll } from "../../../hooks/useModalScroll";
import { useLoading } from "@/hooks";
import axiosInstance from "@/utils/axiosInstance";

const Achievement = () => {
  const router = useRouter();
  const [students, setStudents] = useState([]);
  const [achievements, setAchievements] = useState({});
  const [filterYear, setFilterYear] = useState("");
  const [availableYears, setAvailableYears] = useState([]);
  const [filterStudentId, setFilterStudentId] = useState("");
  const [filterStudentKeyword, setFilterStudentKeyword] = useState("");
  const [filterClassId, setFilterClassId] = useState("");
  const [filterTitle, setFilterTitle] = useState("");
  const [showFormAdd, setShowFormAdd] = useState(false);
  const [showFormEdit, setShowFormEdit] = useState(false);
  const [editFormData, setEditFormData] = useState({});
  const [addFormData, setAddFormData] = useState({});
  const [selectedStudentForForm, setSelectedStudentForForm] = useState(null);
  const [recommendations, setRecommendations] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const { loading, withLoading } = useLoading(true);

  // Disable scroll when modal is open
  useModalScroll(showFormAdd || showFormEdit || showDeleteModal);

  const fetchStudents = async () => {
    try {
      // Lấy danh sách students từ API commander
      const res = await axiosInstance.get(`/commander/students`);

      // Đảm bảo res.data là mảng
      const studentsData = Array.isArray(res.data) ? res.data : [];
      setStudents(studentsData);

      // Fetch achievement và recommendations cho tất cả students SONG SONG
      const achievementsData = {};
      const recommendationsData = {};

      // Tạo promises cho achievements
      const achievementPromises = studentsData.map(async (student) => {
        try {
          const achievementRes = await axiosInstance.get(
            `/achievement/admin/${student.id}`
          );
          return {
            studentId: student.id,
            data: achievementRes.data,
            success: true,
          };
        } catch (error) {
          // If no achievement exists, create default structure
          return {
            studentId: student.id,
            data: {
              studentId: student.id,
              yearlyAchievements: [],
              totalYears: 0,
              totalAdvancedSoldier: 0,
              totalCompetitiveSoldier: 0,
              totalScientificTopics: 0,
              totalScientificInitiatives: 0,
              eligibleForMinistryReward: false,
              eligibleForNationalReward: false,
              nextYearRecommendations: {},
            },
            success: false,
          };
        }
      });

      // Chạy promises achievements trước
      const achievementResults = await Promise.all(achievementPromises);

      // Xử lý kết quả achievements
      achievementResults.forEach(({ studentId, data }) => {
        achievementsData[studentId] = data;
      });
      setAchievements(achievementsData);

      // Chỉ gọi API recommendations cho những student CÓ khen thưởng
      const studentsWithAchievements = achievementResults.filter(
        ({ data }) => data?.yearlyAchievements?.length > 0
      );

      const recommendationPromises = studentsWithAchievements.map(
        async ({ studentId }) => {
          try {
            const recRes = await axiosInstance.get(
              `/achievement/admin/${studentId}/recommendations`
            );
            return { studentId, data: recRes.data };
          } catch (error) {
            return { studentId, data: { suggestions: [] } };
          }
        }
      );

      // Chạy recommendations cho những student có khen thưởng
      const recommendationResults = await Promise.all(recommendationPromises);

      // Xử lý kết quả recommendations
      recommendationResults.forEach(({ studentId, data }) => {
        recommendationsData[studentId] = data;
      });
      setRecommendations(recommendationsData);

      // Lấy danh sách các năm học có trong DB (không trùng)
      const yearsSet = new Set();
      Object.values(achievementsData).forEach((ach) => {
        if (ach && Array.isArray(ach.yearlyAchievements)) {
          ach.yearlyAchievements.forEach((ya) => {
            if (ya.year) {
              yearsSet.add(ya.year);
            }
          });
        }
      });
      const sortedYears = Array.from(yearsSet)
        .sort((a, b) => b - a) // Sắp xếp giảm dần (mới nhất trước)
        .map((year) => ({
          value: year,
          label: `${year}-${year + 1}`,
        }));
      setAvailableYears(sortedYears);
    } catch (error) {
      // Handle error silently
    }
  };

  useEffect(() => {
    const loadData = async () => {
      await withLoading(fetchStudents);
    };
    loadData();
  }, [withLoading]);

  useEffect(() => {
    if (showFormAdd) {
      // Form opened
    }
  }, [showFormAdd, selectedStudentForForm, addFormData]);

  const handleAddYearlyAchievement = async (e) => {
    e.preventDefault();

    if (!selectedStudentForForm) {
      handleNotify("danger", "Lỗi!", "Vui lòng chọn học viên");
      return;
    }

    // Validation form data
    if (!addFormData.year) {
      handleNotify("danger", "Lỗi!", "Vui lòng nhập năm");
      return;
    }

    // Chỉ yêu cầu số quyết định, ngày quyết định, danh hiệu nếu KHÔNG chọn bằng khen
    const hasBangKhen = addFormData.hasMinistryReward || addFormData.hasNationalReward;
    if (!hasBangKhen) {
      if (!addFormData.decisionNumber) {
        handleNotify("danger", "Lỗi!", "Vui lòng nhập số quyết định");
        return;
      }

      if (!addFormData.decisionDate) {
        handleNotify("danger", "Lỗi!", "Vui lòng nhập ngày quyết định");
        return;
      }

      if (!addFormData.title) {
        handleNotify("danger", "Lỗi!", "Vui lòng chọn danh hiệu");
        return;
      }
    }

    // Validate điều kiện bằng khen
    if (addFormData.hasMinistryReward && !canSelectMinistryReward()) {
      handleNotify(
        "danger",
        "Lỗi!",
        `Không đủ điều kiện nhận BK BQP: ${getMinistryRewardReason()}`
      );
      return;
    }

    if (addFormData.hasNationalReward && !canSelectNationalReward()) {
      handleNotify(
        "danger",
        "Lỗi!",
        `Không đủ điều kiện nhận CSTĐ TQ: ${getNationalRewardReason()}`
      );
      return;
    }

    setSubmitting(true);
    try {
      const response = await axiosInstance.post(
        `/achievement/admin/${selectedStudentForForm.id}`,
        addFormData
      );
      const message = response.data.message || "Thêm khen thưởng thành công";
      handleNotify("success", "Thành công!", message);
      setShowFormAdd(false);
      setAddFormData({});
      setSelectedStudentForForm(null);

      // Refresh toàn bộ danh sách students để lấy achievement mới
      await fetchStudents();
    } catch (error) {
      console.error("Error adding achievement:", error);
      handleNotify(
        "danger",
        "Lỗi!",
        error.response?.data?.message || "Có lỗi xảy ra"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateYearlyAchievement = async (e, achievementId) => {
    e.preventDefault();

    // Validate điều kiện bằng khen cho form edit
    if (editFormData.hasMinistryReward && !canSelectMinistryRewardForEdit()) {
      handleNotify(
        "danger",
        "Lỗi!",
        `Không đủ điều kiện nhận BK BQP: ${getMinistryRewardReasonForEdit()}`
      );
      return;
    }

    if (editFormData.hasNationalReward && !canSelectNationalRewardForEdit()) {
      handleNotify(
        "danger",
        "Lỗi!",
        `Không đủ điều kiện nhận CSTĐ TQ: ${getNationalRewardReasonForEdit()}`
      );
      return;
    }

    setSubmitting(true);
    try {
      await axiosInstance.put(
        `/achievement/admin/${achievementId}`,
        editFormData
      );
      handleNotify("success", "Thành công!", "Cập nhật khen thưởng thành công");
      setShowFormEdit(false);
      setEditFormData({});
      await fetchStudents();
    } catch (error) {
      handleNotify(
        "danger",
        "Lỗi!",
        error.response?.data?.message || "Có lỗi xảy ra"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const openDeleteModal = (achievement, student) => {
    setDeleteTarget({ achievement, student });
    setShowDeleteModal(true);
  };

  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setDeleteTarget(null);
  };

  const handleDeleteYearlyAchievement = async () => {
    if (!deleteTarget) return;

    setSubmitting(true);
    try {
      await axiosInstance.delete(`/achievement/admin/${deleteTarget.achievement.id}`);
      handleNotify("success", "Thành công!", "Xóa khen thưởng thành công");
      closeDeleteModal();
      await fetchStudents();
    } catch (error) {
      handleNotify(
        "danger",
        "Lỗi!",
        error.response?.data?.message || "Có lỗi xảy ra"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const getTitleDisplay = (title) => {
    return title || "-";
  };

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const getScientificResearchDisplay = (achievement) => {
    if (!achievement || !achievement.scientific) return "Chưa có";

    const { topics, initiatives } = achievement.scientific;

    if (topics && topics.length > 0) {
      const topic = topics[0];
      const statusText =
        topic.status === "approved"
          ? "Đã duyệt"
          : topic.status === "rejected"
          ? "Từ chối"
          : "Chờ duyệt";
      return `Đề tài: ${topic.title || "N/A"} (${statusText})`;
    }

    if (initiatives && initiatives.length > 0) {
      const initiative = initiatives[0];
      const statusText =
        initiative.status === "approved"
          ? "Đã duyệt"
          : initiative.status === "rejected"
          ? "Từ chối"
          : "Chờ duyệt";
      return `Sáng kiến: ${initiative.title || "N/A"} (${statusText})`;
    }

    return "Chưa có";
  };

  const getRewardsDisplay = (achievement) => {
    if (!achievement) return "";

    const rewards = [];

    if (achievement.hasMinistryReward) {
      rewards.push("🥇 BK BQP");
    }

    if (achievement.hasNationalReward) {
      rewards.push("🎖️ CSTĐ TQ");
    }

    if (rewards.length === 0) {
      return "Chưa có";
    }

    return rewards.join(", ");
  };

  // Kiểm tra điều kiện chọn bằng khen Bộ Quốc Phòng
  // Lấy lý do tại sao chưa đủ điều kiện BK BQP
  const getMinistryRewardReason = () => {
    if (!selectedStudentForForm) return "Chưa chọn học viên";

    const achievement = achievements[selectedStudentForForm.id];
    if (!achievement) return "Không có dữ liệu thành tích";

    // Kiểm tra đã nhận bằng khen Bộ Quốc Phòng chưa
    const hasMinistryReward = achievement.yearlyAchievements?.some(
      (ya) => ya.hasMinistryReward
    );
    if (hasMinistryReward) return "Đã nhận BK BQP trước đó";

    const recommendations = achievement.nextYearRecommendations || {};
    const consecutiveYears = recommendations.consecutiveCompetitiveYears || 0;
    const lastYearWasAdvanced = recommendations.lastYearWasAdvanced || false;
    const eligibleMinistryRewardYear = recommendations.eligibleMinistryRewardYear || 0;

    if (lastYearWasAdvanced) {
      return "Chuỗi CSTĐ bị reset do năm gần nhất là CSTT";
    }

    if (consecutiveYears < 2) {
      return `Cần ${2 - consecutiveYears} năm CSTĐ liên tiếp nữa`;
    }

    // Kiểm tra NCKH ở 2 năm CSTĐ liên tiếp
    if (!achievement.eligibleForMinistryReward) {
      return "Cần có NCKH đã duyệt ở cả 2 năm CSTĐ liên tiếp";
    }

    // Kiểm tra năm nhập có đúng năm được phép không
    // Năm nhận BK BQP không cần có CSTĐ hay NCKH, chỉ cần 2 năm trước đủ
    const formYear = parseInt(addFormData.year) || 0;
    if (eligibleMinistryRewardYear > 0 && formYear !== eligibleMinistryRewardYear) {
      const details = recommendations.nationalRewardDetails || {};
      const firstYear = details.firstYearOfStreak || (eligibleMinistryRewardYear - 2);
      const secondYear = details.secondYearOfStreak || (eligibleMinistryRewardYear - 1);
      return `BK BQP chỉ được nhận vào năm ${eligibleMinistryRewardYear} (sau 2 năm CSTĐ ${firstYear}-${secondYear})`;
    }

    return "";
  };

  // Lấy lý do tại sao chưa đủ điều kiện CSTĐ TQ
  const getNationalRewardReason = () => {
    if (!selectedStudentForForm) return "Chưa chọn học viên";

    const achievement = achievements[selectedStudentForForm.id];
    if (!achievement) return "Không có dữ liệu thành tích";

    // Kiểm tra đã nhận CSTĐ Toàn Quân chưa
    const hasNationalReward = achievement.yearlyAchievements?.some(
      (ya) => ya.hasNationalReward
    );
    if (hasNationalReward) return "Đã nhận CSTĐ TQ trước đó";

    // Kiểm tra đã có BK BQP chưa
    const hasMinistryReward = achievement.yearlyAchievements?.some(
      (ya) => ya.hasMinistryReward
    );
    if (!hasMinistryReward) return "Phải có BK của Bộ trưởng BQP trước";

    // Kiểm tra năm nhập có đúng năm được phép không
    const recommendations = achievement.nextYearRecommendations || {};
    const eligibleNationalRewardYear = recommendations.eligibleNationalRewardYear || 0;
    const ministryRewardYear = recommendations.ministryRewardYear || 0;
    const formYear = parseInt(addFormData.year) || 0;

    if (eligibleNationalRewardYear > 0 && formYear !== eligibleNationalRewardYear) {
      return `CSTĐ TQ chỉ được nhận vào năm ${eligibleNationalRewardYear} (năm sau năm nhận BK BQP ${ministryRewardYear})`;
    }

    if (!achievement.eligibleForNationalReward) {
      return "Năm nhận BK của Bộ trưởng BQP cần có CSTĐ và NCKH đã duyệt";
    }

    return "";
  };

  const canSelectMinistryReward = () => {
    return getMinistryRewardReason() === "";
  };

  const canSelectNationalReward = () => {
    return getNationalRewardReason() === "";
  };

  // Lấy lý do không đủ điều kiện CSTĐ TQ cho form Edit
  const getNationalRewardReasonForEdit = () => {
    if (!editFormData.studentId) return "Không có dữ liệu";

    const achievement = achievements[editFormData.studentId];
    if (!achievement) return "Không có dữ liệu thành tích";

    // Kiểm tra bản ghi đang edit ĐÃ CÓ CSTĐ TQ từ trước chưa
    // Nếu đã có thì cho phép edit mà không cần validate lại
    const currentRecord = achievement.yearlyAchievements?.find(
      (ya) => ya.id === editFormData.id
    );
    if (currentRecord?.hasNationalReward) {
      return ""; // Bản ghi này đã có CSTĐ TQ, cho phép edit
    }

    // Kiểm tra các bản ghi KHÁC đã nhận CSTĐ TQ chưa
    const hasNationalRewardInOthers = achievement.yearlyAchievements?.some(
      (ya) => ya.id !== editFormData.id && ya.hasNationalReward
    );
    if (hasNationalRewardInOthers) return "Đã nhận CSTĐ TQ ở năm khác";

    // Kiểm tra đã có BK BQP chưa
    const hasMinistryReward = achievement.yearlyAchievements?.some(
      (ya) => ya.hasMinistryReward
    );
    if (!hasMinistryReward) return "Phải có BK của Bộ trưởng BQP trước";

    // Kiểm tra năm nhập có đúng năm được phép không
    const recommendations = achievement.nextYearRecommendations || {};
    const eligibleNationalRewardYear = recommendations.eligibleNationalRewardYear || 0;
    const ministryRewardYear = recommendations.ministryRewardYear || 0;
    const formYear = parseInt(editFormData.year) || 0;

    if (eligibleNationalRewardYear > 0 && formYear !== eligibleNationalRewardYear) {
      return `CSTĐ TQ chỉ được nhận vào năm ${eligibleNationalRewardYear} (năm sau năm nhận BK BQP ${ministryRewardYear})`;
    }

    if (!achievement.eligibleForNationalReward) {
      return "Năm nhận BK của Bộ trưởng BQP cần có CSTĐ và NCKH đã duyệt";
    }

    return "";
  };

  const canSelectNationalRewardForEdit = () => {
    return getNationalRewardReasonForEdit() === "";
  };

  // Lấy lý do không đủ điều kiện BK BQP cho form Edit
  const getMinistryRewardReasonForEdit = () => {
    if (!editFormData.studentId) return "Không có dữ liệu";

    const achievement = achievements[editFormData.studentId];
    if (!achievement) return "Không có dữ liệu thành tích";

    // Kiểm tra bản ghi đang edit ĐÃ CÓ BK BQP từ trước chưa
    // Nếu đã có thì cho phép edit mà không cần validate lại
    const currentRecord = achievement.yearlyAchievements?.find(
      (ya) => ya.id === editFormData.id
    );
    if (currentRecord?.hasMinistryReward) {
      return ""; // Bản ghi này đã có BK BQP, cho phép edit
    }

    // Kiểm tra các bản ghi KHÁC đã nhận BK BQP chưa
    const hasMinistryRewardInOthers = achievement.yearlyAchievements?.some(
      (ya) => ya.id !== editFormData.id && ya.hasMinistryReward
    );
    if (hasMinistryRewardInOthers) return "Đã nhận BK BQP ở năm khác";

    const recommendations = achievement.nextYearRecommendations || {};
    const consecutiveYears = recommendations.consecutiveCompetitiveYears || 0;
    const lastYearWasAdvanced = recommendations.lastYearWasAdvanced || false;
    const eligibleMinistryRewardYear = recommendations.eligibleMinistryRewardYear || 0;

    if (lastYearWasAdvanced) {
      return "Chuỗi CSTĐ bị reset do năm gần nhất là CSTT";
    }

    if (consecutiveYears < 2) {
      return `Cần ${2 - consecutiveYears} năm CSTĐ liên tiếp nữa`;
    }

    // Kiểm tra NCKH ở 2 năm CSTĐ liên tiếp
    if (!achievement.eligibleForMinistryReward) {
      return "Cần có NCKH đã duyệt ở cả 2 năm CSTĐ liên tiếp";
    }

    // Kiểm tra năm nhập có đúng năm được phép không
    const formYear = parseInt(editFormData.year) || 0;
    if (eligibleMinistryRewardYear > 0 && formYear !== eligibleMinistryRewardYear) {
      const details = recommendations.nationalRewardDetails || {};
      const firstYear = details.firstYearOfStreak || (eligibleMinistryRewardYear - 2);
      const secondYear = details.secondYearOfStreak || (eligibleMinistryRewardYear - 1);
      return `BK BQP chỉ được nhận vào năm ${eligibleMinistryRewardYear} (sau 2 năm CSTĐ ${firstYear}-${secondYear})`;
    }

    return "";
  };

  const canSelectMinistryRewardForEdit = () => {
    return getMinistryRewardReasonForEdit() === "";
  };

  if (loading) {
    return <Loader text="Đang tải dữ liệu khen thưởng..." />;
  }

  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `
          .ant-select .ant-select-selector {
            background-color: rgb(255 255 255) !important;
            border-color: rgb(209 213 219) !important;
            color: rgb(17 24 39) !important;
          }
          .ant-select .ant-select-selection-placeholder {
            color: rgb(156 163 175) !important;
          }
          .ant-select-multiple .ant-select-selection-item {
            background-color: rgb(239 246 255) !important;
            border-color: rgb(59 130 246) !important;
            color: rgb(30 64 175) !important;
          }
          .ant-select-single .ant-select-selector .ant-select-selection-item {
            color: rgb(17 24 39) !important;
          }
          .ant-select-arrow {
            color: rgb(107 114 128) !important;
          }
          .ant-select-clear {
            color: rgb(107 114 128) !important;
          }
          .ant-select-dropdown {
            background-color: rgb(255 255 255) !important;
            border-color: rgb(209 213 219) !important;
          }
          .ant-select-item {
            color: rgb(17 24 39) !important;
          }
          .ant-select-item-option-active {
            background-color: rgb(239 246 255) !important;
          }
          .ant-select-item-option-selected {
            background-color: rgb(59 130 246) !important;
            color: rgb(255 255 255) !important;
          }

          .dark .ant-select .ant-select-selector {
            background-color: rgb(55 65 81) !important;
            border-color: rgb(75 85 99) !important;
            color: rgb(255 255 255) !important;
          }
          .dark .ant-select .ant-select-selection-placeholder {
            color: rgb(156 163 175) !important;
          }
          .dark .ant-select-multiple .ant-select-selection-item {
            background-color: rgb(30 64 175) !important;
            border-color: rgb(59 130 246) !important;
            color: rgb(255 255 255) !important;
          }
          .dark .ant-select-single .ant-select-selector .ant-select-selection-item {
            color: rgb(255 255 255) !important;
          }
          .dark .ant-select-arrow {
            color: rgb(156 163 175) !important;
          }
          .dark .ant-select-clear {
            color: rgb(156 163 175) !important;
          }
          .dark .ant-select-dropdown {
            background-color: rgb(55 65 81) !important;
            border-color: rgb(75 85 99) !important;
          }
          .dark .ant-select-item {
            color: rgb(255 255 255) !important;
          }
          .dark .ant-select-item-option-active {
            background-color: rgb(30 64 175) !important;
          }
          .dark .ant-select-item-option-selected {
            background-color: rgb(59 130 246) !important;
            color: rgb(255 255 255) !important;
          }

          /* Hide datalist arrow */
          input[list]::-webkit-calendar-picker-indicator {
            display: none !important;
          }
          input[list]::-webkit-list-button {
            display: none !important;
          }
          input[list]::-webkit-clear-button {
            display: none !important;
          }
        `,
        }}
      />
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
                      Quản lý khen thưởng học viên
                    </div>
                  </div>
                </li>
              </ol>
            </nav>
          </div>
          <div className="w-full pt-8 pb-5 pl-5 pr-6 mb-5">
            <div className="bg-white dark:bg-gray-800 rounded-lg w-full shadow-lg">
              <div className="flex justify-between font-bold p-5 border-b border-gray-200 dark:border-gray-700">
                <div className="text-gray-900 pt-2 dark:text-white text-lg">
                  <h1 className="text-2xl font-bold">
                    QUẢN LÝ KHEN THƯỞNG HỌC VIÊN
                  </h1>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Quản lý và xem khen thưởng của tất cả học viên
                  </p>
                </div>

                <div className="flex space-x-2 items-center">
                  <Link
                    href="/admin/achievement/statistics"
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
                  >
                    Xem thống kê
                  </Link>
                  <button
                    onClick={() => {
                      setSelectedStudentForForm(null);
                      setShowFormAdd(true);
                    }}
                    disabled={submitting}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    + Thêm khen thưởng
                  </button>
                </div>
              </div>

              <div className="p-5">
                {/* Debug info */}
                <div className="mb-4 text-sm text-gray-600 dark:text-gray-400">
                  Tổng số học viên có khen thưởng:{" "}
                  {students
                    ? students.filter((student) => {
                        const achievement = achievements[student.id];
                        return (
                          achievement &&
                          achievement.yearlyAchievements.length > 0
                        );
                      }).length
                    : 0}
                </div>

                {/* Form tìm kiếm */}
                <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-700/30 rounded-lg border border-gray-200 dark:border-gray-700">
                  <div className="flex items-end gap-2">
                    <div>
                      <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                        Tìm theo năm học
                      </label>
                      <Select
                        value={filterYear}
                        onChange={setFilterYear}
                        placeholder="Chọn năm học"
                        style={{ width: 160, height: 36 }}
                        allowClear
                        options={[
                          { value: "", label: "Tất cả năm" },
                          ...availableYears,
                        ]}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                        Tìm học viên
                      </label>
                      <input
                        type="text"
                        value={filterStudentKeyword}
                        onChange={(e) => {
                          setFilterStudentKeyword(e.target.value);
                          setFilterStudentId("");
                        }}
                        placeholder="Nhập tên để tìm..."
                        className="w-48 p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        list="student-suggestions"
                        style={{ height: 36 }}
                      />
                      <datalist id="student-suggestions">
                        {students
                          .filter((s) =>
                            filterStudentKeyword
                              ? s.fullName
                                  .toLowerCase()
                                  .includes(filterStudentKeyword.toLowerCase())
                              : true
                          )
                          .slice(0, 10)
                          .map((s) => (
                            <option key={s.id} value={s.fullName} />
                          ))}
                      </datalist>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                        Chọn đơn vị
                      </label>
                      <Select
                        value={filterClassId}
                        onChange={setFilterClassId}
                        placeholder="Chọn đơn vị"
                        style={{ width: 200, height: 36 }}
                        options={[
                          { value: "", label: "Tất cả" },
                          { value: "L1 - H5", label: "L1 - H5" },
                          { value: "L2 - H5", label: "L2 - H5" },
                          { value: "L3 - H5", label: "L3 - H5" },
                          { value: "L4 - H5", label: "L4 - H5" },
                          { value: "L5 - H5", label: "L5 - H5" },
                          { value: "L6 - H5", label: "L6 - H5" },
                        ]}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                        Lọc theo danh hiệu
                      </label>
                      <Select
                        value={filterTitle}
                        onChange={setFilterTitle}
                        placeholder="Chọn danh hiệu"
                        style={{ width: 180, height: 36 }}
                        options={[
                          { value: "", label: "Tất cả" },
                          {
                            value: "Chiến sĩ tiên tiến",
                            label: "Chiến sĩ tiên tiến",
                          },
                          {
                            value: "Chiến sĩ thi đua",
                            label: "Chiến sĩ thi đua",
                          },
                        ]}
                      />
                    </div>
                    <div>
                      <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300 opacity-0">
                        &nbsp;
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setFilterYear("");
                          setFilterStudentId("");
                          setFilterStudentKeyword("");
                          setFilterClassId("");
                          setFilterTitle("");
                        }}
                        className="h-9 px-3 bg-gray-500 hover:bg-gray-600 text-white rounded-lg text-sm font-medium"
                      >
                        Xóa bộ lọc
                      </button>
                    </div>
                  </div>
                </div>

                {students && students.length > 0 ? (
                  <div className="space-y-6">
                    {(() => {
                      // Chỉ hiển thị học viên có khen thưởng
                      let filteredStudents = students.filter((student) => {
                        const achievement = achievements[student.id];
                        const hasAchievements =
                          achievement &&
                          achievement.yearlyAchievements.length > 0;
                        return hasAchievements;
                      });

                      // Lọc theo tên học viên
                      filteredStudents = filteredStudents.filter((s) =>
                        filterStudentId
                          ? s.id === filterStudentId
                          : filterStudentKeyword
                          ? s.fullName
                              .toLowerCase()
                              .includes(filterStudentKeyword.toLowerCase())
                          : true
                      );

                      // Lọc theo đơn vị
                      filteredStudents = filteredStudents.filter((s) =>
                        !filterClassId
                          ? true
                          : (s.unit || "")
                              .toLowerCase()
                              .includes(filterClassId.toLowerCase())
                      );

                      // Lọc theo năm nếu có
                      if (filterYear) {
                        filteredStudents = filteredStudents.filter(
                          (student) => {
                            const achievement = achievements[student.id];
                            return (
                              achievement &&
                              achievement.yearlyAchievements.some(
                                (ya) => String(ya.year) === String(filterYear)
                              )
                            );
                          }
                        );
                      }

                      // Lọc theo danh hiệu nếu có
                      if (filterTitle) {
                        filteredStudents = filteredStudents.filter(
                          (student) => {
                            const achievement = achievements[student.id];
                            return (
                              achievement &&
                              achievement.yearlyAchievements.some(
                                (ya) => ya.title === filterTitle
                              )
                            );
                          }
                        );
                      }

                      if (filteredStudents.length === 0) {
                        return (
                          <div className="text-center py-8">
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
                                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                                />
                              </svg>
                              <p className="text-lg font-medium text-gray-500 dark:text-gray-400">
                                Không tìm thấy học viên nào có khen thưởng
                              </p>
                              <p className="text-sm text-gray-400 dark:text-gray-500">
                                Vui lòng thử lại với từ khóa khác
                              </p>
                            </div>
                          </div>
                        );
                      }

                      return filteredStudents.map((student) => {
                        const achievement = achievements[student.id] || {
                          yearlyAchievements: [],
                          totalYears: 0,
                          totalAdvancedSoldier: 0,
                          totalCompetitiveSoldier: 0,
                          totalScientificTopics: 0,
                          totalScientificInitiatives: 0,
                          eligibleForMinistryReward: false,
                          eligibleForNationalReward: false,
                          nextYearRecommendations: {},
                        };
                        const rows = Array.isArray(
                          achievement.yearlyAchievements
                        )
                          ? achievement.yearlyAchievements
                              .filter((ya) =>
                                filterYear
                                  ? String(ya.year) === String(filterYear)
                                  : true
                              )
                              .filter((ya) =>
                                filterTitle ? ya.title === filterTitle : true
                              )
                              .slice()
                              .sort((a, b) => (a.year || 0) - (b.year || 0))
                          : [];

                        return (
                          <div
                            key={student.id}
                            className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
                          >
                            <div className="flex justify-between items-start mb-4">
                              <div>
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                  {student?.fullName || "Không có tên"}
                                </h3>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                  {student?.unit || "Không có đơn vị"} -{" "}
                                  {student?.studentId || "Không có mã"}
                                </p>
                              </div>
                              <div className="flex space-x-2">
                                <Link
                                  href={`/admin/achievement/${student.id}`}
                                  className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm flex items-center"
                                >
                                  <svg
                                    className="w-4 h-4 mr-1"
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
                                  Xem chi tiết
                                </Link>
                                <button
                                  onClick={() => {
                                    setSelectedStudentForForm(student);
                                    setShowFormAdd(true);
                                  }}
                                  disabled={submitting}
                                  className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  + Thêm khen thưởng
                                </button>
                              </div>
                            </div>

                            <div className="overflow-x-auto">
                              <table className="min-w-full border border-gray-200 dark:border-gray-700 text-sm text-center">
                                <thead className="bg-gray-50 dark:bg-gray-700">
                                  <tr>
                                    <th className="border px-3 py-2 text-center">
                                      Năm
                                    </th>
                                    <th className="border px-3 py-2 text-center">
                                      Số quyết định
                                    </th>
                                    <th className="border px-3 py-2 text-center">
                                      Ngày quyết định
                                    </th>
                                    <th className="border px-3 py-2 text-center">
                                      Danh hiệu
                                    </th>
                                    <th className="border px-3 py-2 text-center">
                                      Nghiên cứu khoa học
                                    </th>
                                    <th className="border px-3 py-2 text-center">
                                      Bằng khen
                                    </th>
                                    <th className="border px-3 py-2 text-center">
                                      Ghi chú
                                    </th>
                                    <th className="border px-3 py-2 text-center">
                                      Thao tác
                                    </th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {rows && rows.length > 0 ? (
                                    rows.map((ya, index) => {
                                      return (
                                        <tr
                                          key={index}
                                          className="hover:bg-gray-50 dark:hover:bg-gray-700"
                                        >
                                          <td className="border px-3 py-2">
                                            {ya.year || "-"}
                                          </td>
                                          <td className="border px-3 py-2">
                                            {ya.decisionNumber || "-"}
                                          </td>
                                          <td className="border px-3 py-2">
                                            {formatDate(ya.decisionDate)}
                                          </td>
                                          <td className="border px-3 py-2">
                                            {ya.title
                                              ? getTitleDisplay(ya.title)
                                              : "-"}
                                          </td>
                                          <td className="border px-3 py-2">
                                            {getScientificResearchDisplay(ya)}
                                          </td>
                                          <td className="border px-3 py-2">
                                            {getRewardsDisplay(ya)}
                                          </td>
                                          <td className="border px-3 py-2">
                                            {ya.notes || ""}
                                          </td>
                                          <td className="border px-3 py-2 text-center">
                                            <div className="flex justify-center space-x-2">
                                              <Link
                                                href={`/admin/achievement/${student.id}`}
                                                className="text-green-600 hover:text-green-800 p-1"
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
                                              </Link>
                                              <button
                                                onClick={() => {
                                                  setEditFormData({
                                                    ...ya,
                                                    studentId: student.id,
                                                  });
                                                  setSelectedStudentForForm(
                                                    student
                                                  );
                                                  setShowFormEdit(true);
                                                }}
                                                disabled={submitting}
                                                className="text-blue-600 hover:text-blue-800 p-1 disabled:opacity-50 disabled:cursor-not-allowed"
                                                title="Chỉnh sửa khen thưởng"
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
                                                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                                  />
                                                </svg>
                                              </button>
                                              <button
                                                onClick={() =>
                                                  openDeleteModal(ya, student)
                                                }
                                                disabled={submitting}
                                                className="text-red-600 hover:text-red-800 p-1 disabled:opacity-50 disabled:cursor-not-allowed"
                                                title="Xóa khen thưởng"
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
                                                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                                  />
                                                </svg>
                                              </button>
                                            </div>
                                          </td>
                                        </tr>
                                      );
                                    })
                                  ) : (
                                    <tr>
                                      <td className="border px-3 py-2 text-center text-gray-400"></td>
                                      <td className="border px-3 py-2 text-center text-gray-400"></td>
                                      <td className="border px-3 py-2 text-center text-gray-400"></td>
                                      <td className="border px-3 py-2 text-center text-gray-400"></td>
                                      <td className="border px-3 py-2 text-center text-gray-400"></td>
                                      <td className="border px-3 py-2 text-center text-gray-400"></td>
                                      <td className="border px-3 py-2 text-center text-gray-400"></td>
                                      <td className="border px-3 py-2 text-center text-gray-400"></td>
                                    </tr>
                                  )}
                                </tbody>
                              </table>
                            </div>

                            {/* Hiển thị suggestions */}
                            {(() => {
                              return recommendations[student.id]?.suggestions &&
                                recommendations[student.id].suggestions.length >
                                  0 ? (
                                <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg">
                                  <h4 className="text-sm font-semibold text-blue-800 dark:text-blue-200 mb-2">
                                    💡 Đề xuất khen thưởng:
                                  </h4>
                                  <ul className="space-y-1">
                                    {recommendations[
                                      student.id
                                    ].suggestions.map((suggestion, index) => (
                                      <li
                                        key={index}
                                        className="text-sm text-blue-700 dark:text-blue-300 flex items-start"
                                      >
                                        <span className="mr-2">•</span>
                                        {suggestion}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              ) : null;
                            })()}
                          </div>
                        );
                      });
                    })()}
                  </div>
                ) : (
                  <div className="text-center py-8">
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
                          d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
                        />
                      </svg>
                      <p className="text-lg font-medium text-gray-500 dark:text-gray-400">
                        Không có học viên nào có khen thưởng
                      </p>
                      <p className="text-sm text-gray-400 dark:text-gray-500">
                        {students === null || students === undefined
                          ? "Đang tải dữ liệu..."
                          : "Không tìm thấy học viên nào có khen thưởng trong hệ thống"}
                      </p>
                      <button
                        onClick={fetchStudents}
                        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                      >
                        Thử lại
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          {/* Form thêm khen thưởng */}
          {showFormAdd && (
            <div className="fixed inset-0 flex items-center justify-center z-50 p-4 pt-16">
              <div className="bg-black bg-opacity-50 inset-0 fixed"></div>
              <div id="add-achievement-modal" className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-6xl max-h-[92vh] overflow-y-auto">
                <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    {selectedStudentForForm
                      ? `Thêm khen thưởng cho ${selectedStudentForForm.fullName}`
                      : "Thêm khen thưởng"}
                  </h2>
                  <button
                    onClick={() => {
                      setShowFormAdd(false);
                      setSelectedStudentForForm(null);
                    }}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    ✕
                  </button>
                </div>

                <form onSubmit={handleAddYearlyAchievement} className="p-6" noValidate>
                  {/* Layout 2 cột - tỷ lệ 2:1 */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Cột trái - Thông tin khen thưởng */}
                    <div className="md:col-span-2 space-y-4">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white border-b pb-2">
                        Thông tin khen thưởng
                      </h3>

                      {!selectedStudentForForm && (
                        <div>
                          <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                            Chọn học viên
                          </label>
                          <Select
                            value={selectedStudentForForm?.id || undefined}
                            onChange={(value) => {
                              const student = students.find(
                                (s) => s.id === value
                              );
                              setSelectedStudentForForm(student);
                            }}
                            placeholder="Nhập tên hoặc MSSV để tìm..."
                            style={{ width: "100%" }}
                            showSearch
                            getPopupContainer={() => document.getElementById("add-achievement-modal")}
                            filterOption={(input, option) => {
                              const searchText = input.toLowerCase();
                              const student = students.find(
                                (s) => s.id === option.value
                              );
                              if (!student) return false;
                              return (
                                student.fullName
                                  ?.toLowerCase()
                                  .includes(searchText) ||
                                student.studentId
                                  ?.toLowerCase()
                                  .includes(searchText) ||
                                student.unit?.toLowerCase().includes(searchText)
                              );
                            }}
                            options={students.map((student) => ({
                              value: student.id,
                              label: `${student.fullName} - ${
                                student.studentId || ""
                              } - ${student.unit || ""}`,
                            }))}
                          />
                        </div>
                      )}

                      <div>
                        <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                          Năm
                        </label>
                        <input
                          type="number"
                          value={addFormData.year || ""}
                          onChange={(e) =>
                            setAddFormData({
                              ...addFormData,
                              year: parseInt(e.target.value),
                            })
                          }
                          className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                          Số quyết định
                        </label>
                        <input
                          type="text"
                          value={addFormData.decisionNumber || ""}
                          onChange={(e) =>
                            setAddFormData({
                              ...addFormData,
                              decisionNumber: e.target.value,
                            })
                          }
                          className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                          Ngày quyết định
                        </label>
                        <input
                          type="date"
                          value={addFormData.decisionDate || ""}
                          onChange={(e) =>
                            setAddFormData({
                              ...addFormData,
                              decisionDate: e.target.value,
                            })
                          }
                          className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                          Danh hiệu
                        </label>
                        <Select
                          value={addFormData.title || ""}
                          onChange={(value) =>
                            setAddFormData({
                              ...addFormData,
                              title: value,
                            })
                          }
                          placeholder="Chọn danh hiệu"
                          style={{ width: "100%" }}
                          getPopupContainer={() => document.getElementById("add-achievement-modal")}
                          options={[
                            { value: "", label: "Chọn danh hiệu" },
                            {
                              value: "Chiến sĩ tiên tiến",
                              label: "Chiến sĩ tiên tiến",
                            },
                            {
                              value: "Chiến sĩ thi đua",
                              label: "Chiến sĩ thi đua",
                            },
                          ]}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                          Bằng khen
                        </label>
                        <Select
                          value={
                            addFormData.hasMinistryReward
                              ? "bằng khen bộ quốc phòng"
                              : addFormData.hasNationalReward
                              ? "CSTĐ Toàn Quân"
                              : ""
                          }
                          onChange={(value) => {
                            setAddFormData({
                              ...addFormData,
                              hasMinistryReward:
                                value === "bằng khen bộ quốc phòng",
                              hasNationalReward: value === "CSTĐ Toàn Quân",
                            });
                          }}
                          placeholder="Chọn bằng khen"
                          style={{ width: "100%" }}
                          getPopupContainer={() => document.getElementById("add-achievement-modal")}
                          options={[
                            { value: "", label: "Không có bằng khen" },
                            {
                              value: "bằng khen bộ quốc phòng",
                              label: `🏆 BK của Bộ trưởng BQP${
                                !canSelectMinistryReward()
                                  ? ` ❌ ${getMinistryRewardReason()}`
                                  : ""
                              }`,
                              disabled: !canSelectMinistryReward(),
                            },
                            {
                              value: "CSTĐ Toàn Quân",
                              label: `🥇 CSTĐ Toàn Quân${
                                !canSelectNationalReward()
                                  ? ` ❌ ${getNationalRewardReason()}`
                                  : ""
                              }`,
                              disabled: !canSelectNationalReward(),
                            },
                          ]}
                        />
                      </div>
                    </div>

                    {/* Cột phải - Nghiên cứu khoa học */}
                    <div className="md:col-span-1 space-y-4">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white border-b pb-2">
                        Nghiên cứu khoa học (nếu có)
                      </h3>

                      <div>
                        <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                          Loại nghiên cứu khoa học
                        </label>
                        <div className="space-y-2">
                          <label className="flex items-center">
                            <input
                              type="radio"
                              name="scientificType"
                              value="none"
                              checked={
                                !addFormData.scientific?.topics?.length &&
                                !addFormData.scientific?.initiatives?.length
                              }
                              onChange={() =>
                                setAddFormData({
                                  ...addFormData,
                                  scientific: {
                                    topics: [],
                                    initiatives: [],
                                  },
                                })
                              }
                              className="mr-2"
                            />
                            <span className="text-sm text-gray-700 dark:text-gray-300">
                              Không có
                            </span>
                          </label>
                          <label className="flex items-center">
                            <input
                              type="radio"
                              name="scientificType"
                              value="topic"
                              checked={
                                addFormData.scientific?.topics?.length > 0
                              }
                              onChange={() =>
                                setAddFormData({
                                  ...addFormData,
                                  scientific: {
                                    topics: [
                                      {
                                        title: "",
                                        description: "",
                                        year:
                                          parseInt(addFormData.year) ||
                                          new Date().getFullYear(),
                                        status: "pending",
                                      },
                                    ],
                                    initiatives: [],
                                  },
                                })
                              }
                              className="mr-2"
                            />
                            <span className="text-sm text-gray-700 dark:text-gray-300">
                              Đề tài khoa học
                            </span>
                          </label>
                          <label className="flex items-center">
                            <input
                              type="radio"
                              name="scientificType"
                              value="initiative"
                              checked={
                                addFormData.scientific?.initiatives?.length > 0
                              }
                              onChange={() =>
                                setAddFormData({
                                  ...addFormData,
                                  scientific: {
                                    topics: [],
                                    initiatives: [
                                      {
                                        title: "",
                                        description: "",
                                        year:
                                          parseInt(addFormData.year) ||
                                          new Date().getFullYear(),
                                        status: "pending",
                                      },
                                    ],
                                  },
                                })
                              }
                              className="mr-2"
                            />
                            <span className="text-sm text-gray-700 dark:text-gray-300">
                              Sáng kiến khoa học
                            </span>
                          </label>
                        </div>
                      </div>

                      {addFormData.scientific?.topics?.length > 0 && (
                        <div>
                          <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                            Đề tài khoa học
                          </label>
                          <div className="space-y-2">
                            <input
                              type="text"
                              placeholder="Tên đề tài khoa học"
                              value={
                                addFormData.scientific?.topics?.[0]?.title || ""
                              }
                              onChange={(e) =>
                                setAddFormData({
                                  ...addFormData,
                                  scientific: {
                                    ...addFormData.scientific,
                                    topics: [
                                      {
                                        ...addFormData.scientific.topics[0],
                                        title: e.target.value,
                                      },
                                    ],
                                  },
                                })
                              }
                              className="w-full p-2 mb-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            />
                            <textarea
                              placeholder="Mô tả đề tài"
                              value={
                                addFormData.scientific?.topics?.[0]
                                  ?.description || ""
                              }
                              onChange={(e) =>
                                setAddFormData({
                                  ...addFormData,
                                  scientific: {
                                    ...addFormData.scientific,
                                    topics: [
                                      {
                                        ...addFormData.scientific.topics[0],
                                        description: e.target.value,
                                      },
                                    ],
                                  },
                                })
                              }
                              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                              rows="5"
                            />
                            <Select
                              value={
                                addFormData.scientific?.topics?.[0]?.status ||
                                "pending"
                              }
                              onChange={(value) =>
                                setAddFormData({
                                  ...addFormData,
                                  scientific: {
                                    ...addFormData.scientific,
                                    topics: [
                                      {
                                        ...addFormData.scientific.topics[0],
                                        status: value,
                                      },
                                    ],
                                  },
                                })
                              }
                              style={{ width: "100%" }}
                              getPopupContainer={() => document.getElementById("add-achievement-modal")}
                              options={[
                                { value: "pending", label: "Chờ duyệt" },
                                { value: "approved", label: "Đã duyệt" },
                                { value: "rejected", label: "Từ chối" },
                              ]}
                            />
                          </div>
                        </div>
                      )}

                      {addFormData.scientific?.initiatives?.length > 0 && (
                        <div>
                          <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                            Sáng kiến khoa học
                          </label>
                          <div className="space-y-2">
                            <input
                              type="text"
                              placeholder="Tên sáng kiến khoa học"
                              value={
                                addFormData.scientific?.initiatives?.[0]
                                  ?.title || ""
                              }
                              onChange={(e) =>
                                setAddFormData({
                                  ...addFormData,
                                  scientific: {
                                    ...addFormData.scientific,
                                    initiatives: [
                                      {
                                        ...addFormData.scientific
                                          .initiatives[0],
                                        title: e.target.value,
                                      },
                                    ],
                                  },
                                })
                              }
                              className="w-full p-2 mb-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            />
                            <textarea
                              placeholder="Mô tả sáng kiến"
                              value={
                                addFormData.scientific?.initiatives?.[0]
                                  ?.description || ""
                              }
                              onChange={(e) =>
                                setAddFormData({
                                  ...addFormData,
                                  scientific: {
                                    ...addFormData.scientific,
                                    initiatives: [
                                      {
                                        ...addFormData.scientific
                                          .initiatives[0],
                                        description: e.target.value,
                                      },
                                    ],
                                  },
                                })
                              }
                              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                              rows="5"
                            />
                            <Select
                              value={
                                addFormData.scientific?.initiatives?.[0]
                                  ?.status || "pending"
                              }
                              onChange={(value) =>
                                setAddFormData({
                                  ...addFormData,
                                  scientific: {
                                    ...addFormData.scientific,
                                    initiatives: [
                                      {
                                        ...addFormData.scientific
                                          .initiatives[0],
                                        status: value,
                                      },
                                    ],
                                  },
                                })
                              }
                              style={{ width: "100%" }}
                              getPopupContainer={() => document.getElementById("add-achievement-modal")}
                              options={[
                                { value: "pending", label: "Chờ duyệt" },
                                { value: "approved", label: "Đã duyệt" },
                                { value: "rejected", label: "Từ chối" },
                              ]}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Ghi chú - 1 hàng ngang dài bằng 2 cột */}
                  <div className="mt-4">
                    <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                      Ghi chú
                    </label>
                    <textarea
                      value={addFormData.notes || ""}
                      onChange={(e) =>
                        setAddFormData({
                          ...addFormData,
                          notes: e.target.value,
                        })
                      }
                      className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      rows="3"
                    />
                  </div>

                  <div className="flex justify-end space-x-2 mt-6">
                    <button
                      type="button"
                      onClick={() => {
                        setShowFormAdd(false);
                        setSelectedStudentForForm(null);
                      }}
                      disabled={submitting}
                      className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Hủy
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                    >
                      {submitting ? (
                        <>
                          <svg
                            className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            ></circle>
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            ></path>
                          </svg>
                          Đang thêm khen thưởng...
                        </>
                      ) : (
                        "Thêm khen thưởng"
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
          {/* Form chỉnh sửa khen thưởng */}
          {showFormEdit && selectedStudentForForm && (
            <div className="fixed inset-0 flex items-center justify-center z-50 p-4 pt-16 ">
              <div className="bg-black bg-opacity-50 inset-0 fixed"></div>
              <div id="edit-achievement-modal" className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-7xl max-h-[92vh] overflow-y-auto">
                <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Chỉnh sửa khen thưởng cho {selectedStudentForForm.fullName}
                  </h2>
                  <button
                    onClick={() => {
                      setShowFormEdit(false);
                      setSelectedStudentForForm(null);
                    }}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    ✕
                  </button>
                </div>
                <form
                  onSubmit={(e) =>
                    handleUpdateYearlyAchievement(e, editFormData.id)
                  }
                  className="p-4"
                  noValidate
                >
                  {/* Layout 2 cột - tỷ lệ 2:1 */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Cột trái - Thông tin cơ bản */}
                    <div className="md:col-span-2 space-y-4">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white border-b pb-2">
                        Thông tin cơ bản
                      </h3>

                      <div>
                        <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                          Học viên
                        </label>
                        <input
                          type="text"
                          value={selectedStudentForForm?.fullName || ""}
                          disabled
                          className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-600 text-gray-900 dark:text-white"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                          Năm
                        </label>
                        <input
                          type="number"
                          value={editFormData.year || ""}
                          onChange={(e) =>
                            setEditFormData({
                              ...editFormData,
                              year: parseInt(e.target.value),
                            })
                          }
                          className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                          Số quyết định
                        </label>
                        <input
                          type="text"
                          value={editFormData.decisionNumber || ""}
                          onChange={(e) =>
                            setEditFormData({
                              ...editFormData,
                              decisionNumber: e.target.value,
                            })
                          }
                          className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                          Ngày quyết định
                        </label>
                        <input
                          type="date"
                          value={
                            editFormData.decisionDate
                              ? new Date(editFormData.decisionDate)
                                  .toISOString()
                                  .split("T")[0]
                              : ""
                          }
                          onChange={(e) =>
                            setEditFormData({
                              ...editFormData,
                              decisionDate: e.target.value,
                            })
                          }
                          className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                          Danh hiệu
                        </label>
                        <Select
                          value={editFormData.title || ""}
                          onChange={(value) =>
                            setEditFormData({
                              ...editFormData,
                              title: value,
                            })
                          }
                          placeholder="Chọn danh hiệu"
                          style={{ width: "100%" }}
                          getPopupContainer={() => document.getElementById("edit-achievement-modal")}
                          options={[
                            { value: "", label: "Chọn danh hiệu" },
                            {
                              value: "Chiến sĩ tiên tiến",
                              label: "Chiến sĩ tiên tiến",
                            },
                            {
                              value: "Chiến sĩ thi đua",
                              label: "Chiến sĩ thi đua",
                            },
                          ]}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                          Bằng khen
                        </label>
                        <Select
                          value={
                            editFormData.hasMinistryReward
                              ? "bằng khen bộ quốc phòng"
                              : editFormData.hasNationalReward
                              ? "CSTĐ Toàn Quân"
                              : ""
                          }
                          onChange={(value) => {
                            setEditFormData({
                              ...editFormData,
                              hasMinistryReward:
                                value === "bằng khen bộ quốc phòng",
                              hasNationalReward: value === "CSTĐ Toàn Quân",
                            });
                          }}
                          placeholder="Chọn bằng khen"
                          style={{ width: "100%" }}
                          getPopupContainer={() => document.getElementById("edit-achievement-modal")}
                          options={(() => {
                            const canSelectBKBQP = canSelectMinistryRewardForEdit() || editFormData.hasMinistryReward;
                            const canSelectCSTDTQ = canSelectNationalRewardForEdit() || editFormData.hasNationalReward;

                            return [
                              { value: "", label: "Không có bằng khen" },
                              {
                                value: "bằng khen bộ quốc phòng",
                                label: `🏆 BK của Bộ trưởng BQP${
                                  !canSelectBKBQP
                                    ? ` ❌ ${getMinistryRewardReasonForEdit()}`
                                    : ""
                                }`,
                                disabled: !canSelectBKBQP,
                              },
                              {
                                value: "CSTĐ Toàn Quân",
                                label: `🥇 CSTĐ Toàn Quân${
                                  !canSelectCSTDTQ
                                    ? ` ❌ ${getNationalRewardReasonForEdit()}`
                                    : ""
                                }`,
                                disabled: !canSelectCSTDTQ,
                              },
                            ];
                          })()}
                        />
                      </div>
                    </div>

                    {/* Cột phải - Nghiên cứu khoa học */}
                    <div className="md:col-span-1 space-y-4">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white border-b pb-2">
                        Nghiên cứu khoa học (nếu có)
                      </h3>

                      <div>
                        <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                          Loại nghiên cứu khoa học
                        </label>
                        <div className="space-y-2">
                          <label className="flex items-center">
                            <input
                              type="radio"
                              name="editScientificType"
                              value="none"
                              checked={
                                !editFormData.scientific?.topics?.length &&
                                !editFormData.scientific?.initiatives?.length
                              }
                              onChange={() =>
                                setEditFormData({
                                  ...editFormData,
                                  scientific: {
                                    topics: [],
                                    initiatives: [],
                                  },
                                })
                              }
                              className="mr-2"
                            />
                            <span className="text-sm text-gray-700 dark:text-gray-300">
                              Không có
                            </span>
                          </label>
                          <label className="flex items-center">
                            <input
                              type="radio"
                              name="editScientificType"
                              value="topic"
                              checked={
                                editFormData.scientific?.topics?.length > 0
                              }
                              onChange={() =>
                                setEditFormData({
                                  ...editFormData,
                                  scientific: {
                                    topics: [
                                      {
                                        title: "",
                                        description: "",
                                        year:
                                          parseInt(editFormData.year) ||
                                          new Date().getFullYear(),
                                        status: "pending",
                                      },
                                    ],
                                    initiatives: [],
                                  },
                                })
                              }
                              className="mr-2"
                            />
                            <span className="text-sm text-gray-700 dark:text-gray-300">
                              Đề tài khoa học
                            </span>
                          </label>
                          <label className="flex items-center">
                            <input
                              type="radio"
                              name="editScientificType"
                              value="initiative"
                              checked={
                                editFormData.scientific?.initiatives?.length > 0
                              }
                              onChange={() =>
                                setEditFormData({
                                  ...editFormData,
                                  scientific: {
                                    topics: [],
                                    initiatives: [
                                      {
                                        title: "",
                                        description: "",
                                        year:
                                          parseInt(editFormData.year) ||
                                          new Date().getFullYear(),
                                        status: "pending",
                                      },
                                    ],
                                  },
                                })
                              }
                              className="mr-2"
                            />
                            <span className="text-sm text-gray-700 dark:text-gray-300">
                              Sáng kiến khoa học
                            </span>
                          </label>
                        </div>
                      </div>

                      {editFormData.scientific?.topics?.length > 0 && (
                        <div>
                          <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                            Đề tài khoa học
                          </label>
                          <div className="space-y-2">
                            <input
                              type="text"
                              placeholder="Tên đề tài khoa học"
                              value={
                                editFormData.scientific?.topics?.[0]?.title ||
                                ""
                              }
                              onChange={(e) =>
                                setEditFormData({
                                  ...editFormData,
                                  scientific: {
                                    ...editFormData.scientific,
                                    topics: [
                                      {
                                        ...editFormData.scientific.topics[0],
                                        title: e.target.value,
                                      },
                                    ],
                                  },
                                })
                              }
                              className="w-full p-2 mb-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            />
                            <textarea
                              placeholder="Mô tả đề tài"
                              value={
                                editFormData.scientific?.topics?.[0]
                                  ?.description || ""
                              }
                              onChange={(e) =>
                                setEditFormData({
                                  ...editFormData,
                                  scientific: {
                                    ...editFormData.scientific,
                                    topics: [
                                      {
                                        ...editFormData.scientific.topics[0],
                                        description: e.target.value,
                                      },
                                    ],
                                  },
                                })
                              }
                              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                              rows="5"
                            />
                            <Select
                              value={
                                editFormData.scientific?.topics?.[0]?.status ||
                                "pending"
                              }
                              onChange={(value) =>
                                setEditFormData({
                                  ...editFormData,
                                  scientific: {
                                    ...editFormData.scientific,
                                    topics: [
                                      {
                                        ...editFormData.scientific.topics[0],
                                        status: value,
                                      },
                                    ],
                                  },
                                })
                              }
                              style={{ width: "100%" }}
                              getPopupContainer={() => document.getElementById("edit-achievement-modal")}
                              options={[
                                { value: "pending", label: "Chờ duyệt" },
                                { value: "approved", label: "Đã duyệt" },
                                { value: "rejected", label: "Từ chối" },
                              ]}
                            />
                          </div>
                        </div>
                      )}

                      {editFormData.scientific?.initiatives?.length > 0 && (
                        <div>
                          <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                            Sáng kiến khoa học
                          </label>
                          <div className="space-y-2">
                            <input
                              type="text"
                              placeholder="Tên sáng kiến khoa học"
                              value={
                                editFormData.scientific?.initiatives?.[0]
                                  ?.title || ""
                              }
                              onChange={(e) =>
                                setEditFormData({
                                  ...editFormData,
                                  scientific: {
                                    ...editFormData.scientific,
                                    initiatives: [
                                      {
                                        ...editFormData.scientific
                                          .initiatives[0],
                                        title: e.target.value,
                                      },
                                    ],
                                  },
                                })
                              }
                              className="w-full p-2 mb-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            />
                            <textarea
                              placeholder="Mô tả sáng kiến"
                              value={
                                editFormData.scientific?.initiatives?.[0]
                                  ?.description || ""
                              }
                              onChange={(e) =>
                                setEditFormData({
                                  ...editFormData,
                                  scientific: {
                                    ...editFormData.scientific,
                                    initiatives: [
                                      {
                                        ...editFormData.scientific
                                          .initiatives[0],
                                        description: e.target.value,
                                      },
                                    ],
                                  },
                                })
                              }
                              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                              rows="5"
                            />
                            <Select
                              value={
                                editFormData.scientific?.initiatives?.[0]
                                  ?.status || "pending"
                              }
                              onChange={(value) =>
                                setEditFormData({
                                  ...editFormData,
                                  scientific: {
                                    ...editFormData.scientific,
                                    initiatives: [
                                      {
                                        ...editFormData.scientific
                                          .initiatives[0],
                                        status: value,
                                      },
                                    ],
                                  },
                                })
                              }
                              style={{ width: "100%" }}
                              getPopupContainer={() => document.getElementById("edit-achievement-modal")}
                              options={[
                                { value: "pending", label: "Chờ duyệt" },
                                { value: "approved", label: "Đã duyệt" },
                                { value: "rejected", label: "Từ chối" },
                              ]}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Ghi chú - 1 hàng ngang dài bằng 2 cột */}
                  <div className="mt-4">
                    <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                      Ghi chú
                    </label>
                    <textarea
                      value={editFormData.notes || ""}
                      onChange={(e) =>
                        setEditFormData({
                          ...editFormData,
                          notes: e.target.value,
                        })
                      }
                      className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      rows="3"
                    />
                  </div>

                  <div className="flex justify-end space-x-2 mt-6">
                    <button
                      type="button"
                      onClick={() => {
                        setShowFormEdit(false);
                        setSelectedStudentForForm(null);
                      }}
                      disabled={submitting}
                      className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Hủy
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                    >
                      {submitting ? (
                        <>
                          <svg
                            className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            ></circle>
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            ></path>
                          </svg>
                          Đang cập nhật...
                        </>
                      ) : (
                        "Cập nhật"
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
          {/* Modal xác nhận xóa */}
          {showDeleteModal && deleteTarget && (
            <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
              <div className="bg-black bg-opacity-50 inset-0 fixed" onClick={closeDeleteModal}></div>
              <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md">
                <div className="p-6">
                  <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 rounded-full bg-red-100 dark:bg-red-900/30">
                    <svg
                      className="w-6 h-6 text-red-600 dark:text-red-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-center text-gray-900 dark:text-white mb-2">
                    Xác nhận xóa khen thưởng
                  </h3>
                  <p className="text-center text-gray-600 dark:text-gray-400 mb-2">
                    Bạn có chắc chắn muốn xóa khen thưởng này?
                  </p>
                  <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-3 mb-4">
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      <span className="font-medium">Học viên:</span> {deleteTarget.student?.fullName}
                    </p>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      <span className="font-medium">Năm:</span> {deleteTarget.achievement?.year}
                    </p>
                    {deleteTarget.achievement?.title && (
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        <span className="font-medium">Danh hiệu:</span> {deleteTarget.achievement?.title}
                      </p>
                    )}
                  </div>
                  <p className="text-center text-sm text-red-600 dark:text-red-400 mb-4">
                    Hành động này không thể hoàn tác!
                  </p>
                  <div className="flex justify-center space-x-3">
                    <button
                      onClick={closeDeleteModal}
                      disabled={submitting}
                      className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors disabled:opacity-50"
                    >
                      Hủy
                    </button>
                    <button
                      onClick={handleDeleteYearlyAchievement}
                      disabled={submitting}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center"
                    >
                      {submitting ? (
                        <>
                          <svg
                            className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            ></circle>
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            ></path>
                          </svg>
                          Đang xóa...
                        </>
                      ) : (
                        "Xóa"
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
          {/* Loading overlay khi đang xử lý */}
          {submitting && !showFormAdd && !showFormEdit && !showDeleteModal && (
            <div className="fixed inset-0 flex items-center justify-center z-50">
              <div className="bg-black bg-opacity-50 inset-0 fixed"></div>
              <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 flex flex-col items-center">
                <svg
                  className="animate-spin h-10 w-10 text-blue-600 mb-3"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                <span className="text-gray-700 dark:text-gray-300 font-medium">
                  Đang xử lý...
                </span>
              </div>
            </div>
          )}
          <style jsx global>{`
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
            .ant-select-item-option-active:not(
                .ant-select-item-option-disabled
              ) {
              background-color: rgba(
                59,
                130,
                246,
                0.12
              ) !important; /* blue-500/12 */
              color: rgb(30 58 138) !important;
            }
            .ant-select-item-option-selected:not(
                .ant-select-item-option-disabled
              ) {
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
              .ant-select-item-option-active:not(
                .ant-select-item-option-disabled
              ) {
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
          `}</style>{" "}
        </div>
      </div>
    </>
  );
};

export default Achievement;
