"use client";

import axios from "axios";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { handleNotify } from "../../../../components/notify";
import { Select } from "antd";
import { BASE_URL } from "@/configs";

const AchievementStatistics = () => {
  const router = useRouter();
  const [students, setStudents] = useState([]);
  const [achievements, setAchievements] = useState({});
  const [loading, setLoading] = useState(false);
  const [showStatistics, setShowStatistics] = useState(true);
  const [showFormAdd, setShowFormAdd] = useState(false);
  const [showFormEdit, setShowFormEdit] = useState(false);
  const [editFormData, setEditFormData] = useState({});
  const [addFormData, setAddFormData] = useState({});
  const [selectedStudentForForm, setSelectedStudentForForm] = useState(null);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedUnit, setSelectedUnit] = useState("");
  const [statistics, setStatistics] = useState({
    totalStudents: 0,
    studentsWithAchievements: 0,
    totalAchievements: 0,
    totalAdvancedSoldier: 0,
    totalCompetitiveSoldier: 0,
    totalScientificTopics: 0,
    totalScientificInitiatives: 0,
    eligibleForMinistryReward: 0,
    eligibleForNationalReward: 0,
  });

  const [yearStats, setYearStats] = useState({
    advancedCount: 0,
    competitiveCount: 0,
    bkBqpCount: 0,
    cstdTqCount: 0,
  });

  const fetchStudentsAndAchievements = async () => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const res = await axios.get(`${BASE_URL}/commander/students`, {
          headers: { token: `Bearer ${token}` },
        });
        setStudents(res.data);

        // Fetch achievements for all students
        const achievementsData = {};
        let totalAchievements = 0;
        let totalAdvancedSoldier = 0;
        let totalCompetitiveSoldier = 0;
        let totalScientificTopics = 0;
        let totalScientificInitiatives = 0;
        let eligibleForMinistryReward = 0;
        let eligibleForNationalReward = 0;
        let studentsWithAchievements = 0;

        for (const student of res.data) {
          try {
            const achievementRes = await axios.get(
              `${BASE_URL}/achievement/admin/${student.id}`,
              {
                headers: { token: `Bearer ${token}` },
              }
            );
            const achievement = achievementRes.data;
            achievementsData[student.id] = achievement;

            if (achievement.yearlyAchievements.length > 0) {
              studentsWithAchievements++;
              totalAchievements += achievement.totalYears;
              totalAdvancedSoldier += achievement.totalAdvancedSoldier;
              totalCompetitiveSoldier += achievement.totalCompetitiveSoldier;
              totalScientificTopics += achievement.totalScientificTopics;
              totalScientificInitiatives +=
                achievement.totalScientificInitiatives;

              if (achievement.eligibleForMinistryReward) {
                eligibleForMinistryReward++;
              }
              if (achievement.eligibleForNationalReward) {
                eligibleForNationalReward++;
              }
            }
          } catch (error) {
            // If no achievement exists, create default structure
            achievementsData[student.id] = {
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
            };
          }
        }

        setAchievements(achievementsData);
        setStatistics({
          totalStudents: res.data.length,
          studentsWithAchievements,
          totalAchievements,
          totalAdvancedSoldier,
          totalCompetitiveSoldier,
          totalScientificTopics,
          totalScientificInitiatives,
          eligibleForMinistryReward,
          eligibleForNationalReward,
        });

        // Tính thống kê theo năm được chọn
        computeYearStats(achievementsData, selectedYear);
      } catch (error) {
        console.log("Error fetching statistics:", error.message || error);
        handleNotify("danger", "Lỗi!", "Không thể tải dữ liệu");
      } finally {
        setLoading(false);
      }
    }
  };

  const computeYearStats = (
    achievementsData,
    year,
    filteredStudents = null
  ) => {
    const y = parseInt(year);
    let advancedCount = 0;
    let competitiveCount = 0;
    let bkBqpCount = 0;
    let cstdTqCount = 0;
    const allowedIds = filteredStudents
      ? new Set(filteredStudents.map((s) => s.id))
      : null;
    Object.entries(achievementsData).forEach(([studentId, ach]) => {
      if (allowedIds && !allowedIds.has(studentId)) return;
      if (!ach || !Array.isArray(ach.yearlyAchievements)) return;
      ach.yearlyAchievements.forEach((ya) => {
        if (parseInt(ya.year) !== y) return;
        if (ya.title === "Chiến sĩ tiên tiến") advancedCount += 1;
        if (ya.title === "Chiến sĩ thi đua") competitiveCount += 1;
        if (ya.hasMinistryReward) bkBqpCount += 1;
        if (ya.hasNationalReward) cstdTqCount += 1;
      });
    });
    setYearStats({ advancedCount, competitiveCount, bkBqpCount, cstdTqCount });
  };

  const computeOverallStats = (studentsList, achievementsData) => {
    const filteredIds = new Set(studentsList.map((s) => s.id));
    let totalAchievements = 0;
    let totalAdvancedSoldier = 0;
    let totalCompetitiveSoldier = 0;
    let totalScientificTopics = 0;
    let totalScientificInitiatives = 0;
    let eligibleForMinistryReward = 0;
    let eligibleForNationalReward = 0;
    let studentsWithAchievements = 0;

    studentsList.forEach((student) => {
      const ach = achievementsData[student.id];
      if (!ach || !Array.isArray(ach.yearlyAchievements)) return;
      if (ach.yearlyAchievements.length > 0) {
        studentsWithAchievements++;
        totalAchievements += ach.totalYears || 0;
        totalAdvancedSoldier += ach.totalAdvancedSoldier || 0;
        totalCompetitiveSoldier += ach.totalCompetitiveSoldier || 0;
        totalScientificTopics += ach.totalScientificTopics || 0;
        totalScientificInitiatives += ach.totalScientificInitiatives || 0;
        if (ach.eligibleForMinistryReward) eligibleForMinistryReward++;
        if (ach.eligibleForNationalReward) eligibleForNationalReward++;
      }
    });

    setStatistics({
      totalStudents: studentsList.length,
      studentsWithAchievements,
      totalAchievements,
      totalAdvancedSoldier,
      totalCompetitiveSoldier,
      totalScientificTopics,
      totalScientificInitiatives,
      eligibleForMinistryReward,
      eligibleForNationalReward,
    });
  };

  const handleShowStatistics = async () => {
    setLoading(true);
    setShowStatistics(true);
    await fetchStudentsAndAchievements();
  };

  useEffect(() => {
    // Tự động tải thống kê khi mở trang
    setLoading(true);
    fetchStudentsAndAchievements();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!showStatistics) return;
    if (Object.keys(achievements).length === 0) return;
    const filteredStudents = selectedUnit
      ? students.filter((s) => s.unit === selectedUnit)
      : students;
    computeOverallStats(filteredStudents, achievements);
    computeYearStats(achievements, selectedYear, filteredStudents);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedYear, selectedUnit, achievements, students, showStatistics]);

  const handleAddYearlyAchievement = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    try {
      const response = await axios.post(
        `${BASE_URL}/achievement/admin/${selectedStudentForForm.id}`,
        addFormData,
        {
          headers: { token: `Bearer ${token}` },
        }
      );
      handleNotify("success", "Thành công!", "Thêm khen thưởng thành công");
      setShowFormAdd(false);
      setAddFormData({});
      setSelectedStudentForForm(null);
      fetchStudentsAndAchievements();
    } catch (error) {
      handleNotify(
        "danger",
        "Lỗi!",
        error.response?.data?.message || "Có lỗi xảy ra"
      );
    }
  };

  const handleUpdateYearlyAchievement = async (e, studentId, year) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    try {
      await axios.put(
        `${BASE_URL}/achievement/admin/${studentId}/${year}`,
        editFormData,
        {
          headers: { token: `Bearer ${token}` },
        }
      );
      handleNotify("success", "Thành công!", "Cập nhật khen thưởng thành công");
      setShowFormEdit(false);
      setEditFormData({});
      fetchStudentsAndAchievements();
    } catch (error) {
      handleNotify(
        "danger",
        "Lỗi!",
        error.response?.data?.message || "Có lỗi xảy ra"
      );
    }
  };

  const handleDeleteYearlyAchievement = async (studentId, year) => {
    const token = localStorage.getItem("token");
    try {
      await axios.delete(`${BASE_URL}/achievement/admin/${studentId}/${year}`, {
        headers: { token: `Bearer ${token}` },
      });
      handleNotify("success", "Thành công!", "Xóa khen thưởng thành công");
      fetchStudentsAndAchievements();
    } catch (error) {
      handleNotify(
        "danger",
        "Lỗi!",
        error.response?.data?.message || "Có lỗi xảy ra"
      );
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

  // Điều kiện chọn bằng khen theo từng học viên trong trang thống kê
  const canSelectMinistryRewardFor = (studentId) => {
    const ach = achievements[studentId];
    if (!ach) return false;
    const hasMinistryReward = ach.yearlyAchievements?.some(
      (ya) => ya.hasMinistryReward
    );
    if (hasMinistryReward) return false;

    const competitiveYears =
      ach.yearlyAchievements
        ?.filter((ya) => ya.title === "Chiến sĩ thi đua")
        ?.map((ya) => ya.year)
        ?.sort((a, b) => a - b) || [];
    if (competitiveYears.length < 2) return false;

    let maxConsecutive = 0;
    let currentConsecutive = 0;
    let consecutiveStartYear = 0;
    for (let i = 0; i < competitiveYears.length; i++) {
      if (i === 0 || competitiveYears[i] === competitiveYears[i - 1] + 1) {
        if (currentConsecutive === 0)
          consecutiveStartYear = competitiveYears[i];
        currentConsecutive++;
      } else {
        currentConsecutive = 1;
        consecutiveStartYear = competitiveYears[i];
      }
      if (currentConsecutive > maxConsecutive)
        maxConsecutive = currentConsecutive;
    }
    if (maxConsecutive < 2) return false;

    const currentYear = new Date().getFullYear();
    const secondYearOfStreak = consecutiveStartYear + 1;
    if (currentYear < secondYearOfStreak) return false;

    let hasApprovedScientific = false;
    ach.yearlyAchievements?.forEach((ya) => {
      if (ya.scientific) {
        if (ya.scientific.topics?.some((t) => t.status === "approved")) {
          hasApprovedScientific = true;
        }
        if (ya.scientific.initiatives?.some((i) => i.status === "approved")) {
          hasApprovedScientific = true;
        }
      }
    });
    return hasApprovedScientific;
  };

  const canSelectNationalRewardFor = (studentId) => {
    const ach = achievements[studentId];
    if (!ach) return false;
    const hasNationalReward = ach.yearlyAchievements?.some(
      (ya) => ya.hasNationalReward
    );
    if (hasNationalReward) return false;

    const competitiveYears =
      ach.yearlyAchievements
        ?.filter((ya) => ya.title === "Chiến sĩ thi đua")
        ?.map((ya) => ya.year)
        ?.sort((a, b) => a - b) || [];
    if (competitiveYears.length < 3) return false;

    let maxConsecutive = 0;
    let currentConsecutive = 0;
    let consecutiveStartYear = 0;
    for (let i = 0; i < competitiveYears.length; i++) {
      if (i === 0 || competitiveYears[i] === competitiveYears[i - 1] + 1) {
        if (currentConsecutive === 0)
          consecutiveStartYear = competitiveYears[i];
        currentConsecutive++;
      } else {
        currentConsecutive = 1;
        consecutiveStartYear = competitiveYears[i];
      }
      if (currentConsecutive > maxConsecutive)
        maxConsecutive = currentConsecutive;
    }
    if (maxConsecutive < 3) return false;

    const currentYear = new Date().getFullYear();
    const thirdYearOfStreak = consecutiveStartYear + 2;
    if (currentYear < thirdYearOfStreak) return false;

    let hasApprovedScientific = false;
    ach.yearlyAchievements?.forEach((ya) => {
      if (ya.scientific) {
        if (ya.scientific.topics?.some((t) => t.status === "approved")) {
          hasApprovedScientific = true;
        }
        if (ya.scientific.initiatives?.some((i) => i.status === "approved")) {
          hasApprovedScientific = true;
        }
      }
    });
    return hasApprovedScientific;
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Đang tải...</p>
          </div>
        </div>
      </div>
    );
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
        `,
        }}
      />
      <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="flex-1">
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
                    <Link
                      href="/admin/achievement"
                      className="ms-1 text-sm font-medium text-gray-500 hover:text-blue-600 md:ms-2 dark:text-gray-400 dark:hover:text-white"
                    >
                      Quản lý khen thưởng
                    </Link>
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
                      Thống kê khen thưởng
                    </div>
                  </div>
                </li>
              </ol>
            </nav>
          </div>

          <div className="w-full pt-8 pb-5 pl-5 pr-6 mb-5">
            <div className="bg-white dark:bg-gray-800 rounded-lg w-full shadow-lg">
              <div className="flex justify-between font-bold p-5 border-b border-gray-200 dark:border-gray-700">
                <div className="text-gray-900 dark:text-white">
                  <h1 className="text-2xl font-bold">
                    {" "}
                    THỐNG KÊ KHEN THƯỞNG TỔNG QUAN
                  </h1>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Quản lý và xem khen thưởng của tất cả học viên
                  </p>
                </div>
                <div className="flex space-x-2 items-center">
                  <Link
                    href="/admin/achievement"
                    className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
                  >
                    ← Quay lại
                  </Link>
                </div>
              </div>

              {/* Thống kê tổng quan */}
              {!showStatistics ? (
                <div className="p-5 text-center">
                  <div className="text-gray-500 dark:text-gray-400 text-lg mb-4">
                    Bấm nút "Xem thống kê" để hiển thị thống kê tổng quan
                  </div>
                </div>
              ) : (
                <div className="p-5">
                  {/* Bộ lọc theo năm */}
                  <div className="mb-6 flex items-end gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                        Chọn năm
                      </label>
                      <input
                        type="number"
                        value={selectedYear}
                        onChange={(e) => setSelectedYear(e.target.value)}
                        className="w-40 p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        style={{ height: 36 }}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                        Chọn đơn vị
                      </label>
                      <Select
                        value={selectedUnit}
                        onChange={setSelectedUnit}
                        placeholder="Chọn đơn vị"
                        style={{ width: 200, height: 36 }}
                        options={[
                          { value: "", label: "Tất cả đơn vị" },
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
                      <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300 opacity-0">
                        &nbsp;
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedYear(new Date().getFullYear());
                          setSelectedUnit("");
                        }}
                        className="h-9 px-4 bg-gray-500 hover:bg-gray-600 text-white rounded-lg text-sm font-medium"
                      >
                        Xóa bộ lọc
                      </button>
                    </div>
                  </div>

                  <h3 className="text-lg font-semibold mb-6 text-gray-900 dark:text-white">
                    Thống kê tổng quan
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
                    <div className="text-center p-4 bg-blue-50 dark:bg-blue-900 rounded-lg">
                      <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                        {statistics.totalStudents}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        Tổng học viên
                      </div>
                    </div>
                    <div className="text-center p-4 bg-green-50 dark:bg-green-900 rounded-lg">
                      <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                        {statistics.studentsWithAchievements}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        Có khen thưởng
                      </div>
                    </div>
                    <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-900 rounded-lg">
                      <div className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">
                        {yearStats.advancedCount}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        Tổng CSTT ({selectedYear})
                      </div>
                    </div>
                    <div className="text-center p-4 bg-purple-50 dark:bg-purple-900 rounded-lg">
                      <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                        {yearStats.competitiveCount}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        Tổng CSTĐ ({selectedYear})
                      </div>
                    </div>
                    <div className="text-center p-4 bg-indigo-50 dark:bg-indigo-900 rounded-lg">
                      <div className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">
                        {yearStats.bkBqpCount}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        BK BQP ({selectedYear})
                      </div>
                    </div>
                    <div className="text-center p-4 bg-teal-50 dark:bg-teal-900 rounded-lg">
                      <div className="text-3xl font-bold text-teal-600 dark:text-teal-400">
                        {yearStats.cstdTqCount}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        CSTĐ TQ ({selectedYear})
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    <div className="text-center p-4 bg-pink-50 dark:bg-pink-900 rounded-lg">
                      <div className="text-3xl font-bold text-pink-600 dark:text-pink-400">
                        {statistics.totalScientificTopics}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        Đề tài khoa học
                      </div>
                    </div>
                    <div className="text-center p-4 bg-orange-50 dark:bg-orange-900 rounded-lg">
                      <div className="text-3xl font-bold text-orange-600 dark:text-orange-400">
                        {statistics.totalScientificInitiatives}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        Sáng kiến khoa học
                      </div>
                    </div>
                    <div className="text-center p-4 bg-red-50 dark:bg-red-900 rounded-lg">
                      <div className="text-3xl font-bold text-red-600 dark:text-red-400">
                        {statistics.eligibleForMinistryReward}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        Đủ điều kiện BK BQP
                      </div>
                    </div>
                    <div className="text-center p-4 bg-teal-50 dark:bg-teal-900 rounded-lg">
                      <div className="text-3xl font-bold text-teal-600 dark:text-teal-400">
                        {statistics.eligibleForNationalReward}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        Đủ điều kiện CSTĐTQ
                      </div>
                    </div>
                  </div>

                  {/* Tỷ lệ phần trăm */}
                  <div className="mb-8">
                    <h4 className="text-md font-semibold mb-4 text-gray-900 dark:text-white">
                      Tỷ lệ phần trăm
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                            Học viên có khen thưởng
                          </span>
                          <span className="text-sm font-bold text-gray-900 dark:text-white">
                            {statistics.totalStudents > 0
                              ? (
                                  (statistics.studentsWithAchievements /
                                    statistics.totalStudents) *
                                  100
                                ).toFixed(1)
                              : 0}
                            %
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{
                              width: `${
                                statistics.totalStudents > 0
                                  ? (statistics.studentsWithAchievements /
                                      statistics.totalStudents) *
                                    100
                                  : 0
                              }%`,
                            }}
                          ></div>
                        </div>
                      </div>
                      <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                            Đủ điều kiện BK BQP
                          </span>
                          <span className="text-sm font-bold text-gray-900 dark:text-white">
                            {statistics.studentsWithAchievements > 0
                              ? (
                                  (statistics.eligibleForMinistryReward /
                                    statistics.studentsWithAchievements) *
                                  100
                                ).toFixed(1)
                              : 0}
                            %
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-green-600 h-2 rounded-full"
                            style={{
                              width: `${
                                statistics.studentsWithAchievements > 0
                                  ? (statistics.eligibleForMinistryReward /
                                      statistics.studentsWithAchievements) *
                                    100
                                  : 0
                              }%`,
                            }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Danh sách học viên có khen thưởng */}
                  <div className="mb-8">
                    <h4 className="text-md font-semibold mb-4 text-gray-900 dark:text-white">
                      Danh sách học viên có khen thưởng
                    </h4>
                    <div className="overflow-x-auto">
                      <table className="min-w-full border border-gray-200 dark:border-gray-700 text-sm">
                        <thead className="bg-gray-50 dark:bg-gray-700">
                          <tr>
                            <th className="border px-3 py-2 text-center">
                              Tên học viên
                            </th>
                            <th className="border px-3 py-2 text-center">
                              Mã học viên
                            </th>
                            <th className="border px-3 py-2 text-center">
                              Đơn vị
                            </th>
                            <th className="border px-3 py-2 text-center">
                              Trạng thái khen thưởng
                            </th>
                            <th className="border px-3 py-2 text-center">
                              Thao tác
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {(() => {
                            // Chỉ hiển thị học viên có khen thưởng
                            let list = students.filter((student) => {
                              const achievement = achievements[student.id];
                              const hasAchievements =
                                achievement &&
                                achievement.yearlyAchievements.length > 0;
                              return hasAchievements;
                            });

                            // Lọc theo đơn vị nếu được chọn
                            if (selectedUnit) {
                              list = list.filter(
                                (s) => s.unit === selectedUnit
                              );
                            }

                            // Sắp xếp theo thứ tự đơn vị từ L1-H5 đến L6-H5
                            const unitOrder = [
                              "L1 - H5",
                              "L2 - H5",
                              "L3 - H5",
                              "L4 - H5",
                              "L5 - H5",
                              "L6 - H5",
                            ];

                            const sortedList = list.sort((a, b) => {
                              const aIndex = unitOrder.indexOf(a.unit || "");
                              const bIndex = unitOrder.indexOf(b.unit || "");

                              // Nếu cả hai đều có trong danh sách, sắp xếp theo thứ tự
                              if (aIndex !== -1 && bIndex !== -1) {
                                return aIndex - bIndex;
                              }

                              // Nếu chỉ một trong hai có trong danh sách, ưu tiên cái có trong danh sách
                              if (aIndex !== -1) return -1;
                              if (bIndex !== -1) return 1;

                              // Nếu cả hai đều không có trong danh sách, sắp xếp theo tên
                              return (a.unit || "").localeCompare(b.unit || "");
                            });

                            return sortedList && sortedList.length > 0 ? (
                              sortedList.map((student) => {
                                const achievement = achievements[student.id];
                                const hasAchievements =
                                  achievement &&
                                  achievement.yearlyAchievements.length > 0;

                                return (
                                  <tr
                                    key={student.id}
                                    className="hover:bg-gray-50 dark:hover:bg-gray-700"
                                  >
                                    <td className="border px-3 py-2 text-center">
                                      {student.fullName || "Không có tên"}
                                    </td>
                                    <td className="border px-3 py-2 text-center">
                                      {student.studentId || "Không có mã"}
                                    </td>
                                    <td className="border px-3 py-2 text-center">
                                      {student.unit || "Không có đơn vị"}
                                    </td>
                                    <td className="border px-3 py-2 text-center">
                                      <span
                                        className={`px-2 py-1 rounded text-xs ${
                                          hasAchievements
                                            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                                            : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
                                        }`}
                                      >
                                        {hasAchievements
                                          ? "Có khen thưởng"
                                          : "Chưa có khen thưởng"}
                                      </span>
                                    </td>
                                    <td className="border px-3 py-2 text-center">
                                      <div className="flex flex-col space-y-2 w-48 mx-auto">
                                        <Link
                                          href={`/admin/achievement/${student.id}`}
                                          className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm flex items-center justify-center w-full"
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
                                              d="M11 5H6a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2v-5m-1.414-9.414a2 2 0 1 1 2.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                            />
                                          </svg>
                                          Quản lý khen thưởng
                                        </Link>
                                        <button
                                          onClick={() => {
                                            setSelectedStudentForForm(student);
                                            setShowFormAdd(true);
                                          }}
                                          className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm flex items-center justify-center w-full"
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
                                              d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                                            />
                                          </svg>
                                          Thêm khen thưởng
                                        </button>
                                      </div>
                                    </td>
                                  </tr>
                                );
                              })
                            ) : (
                              <tr>
                                <td
                                  className="border px-3 py-2 text-center text-gray-400"
                                  colSpan="5"
                                >
                                  Không có học viên nào có khen thưởng
                                </td>
                              </tr>
                            );
                          })()}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Chi tiết khen thưởng học viên */}
                  <div>
                    <h4 className="text-md font-semibold mb-4 text-gray-900 dark:text-white">
                      Chi tiết khen thưởng học viên
                    </h4>
                    <div className="overflow-x-auto">
                      <table className="min-w-full border border-gray-200 dark:border-gray-700 text-sm">
                        <thead className="bg-gray-50 dark:bg-gray-700">
                          <tr>
                            <th className="border px-3 py-2 text-center">
                              Tên học viên
                            </th>
                            <th className="border px-3 py-2 text-center">
                              Mã học viên
                            </th>
                            <th className="border px-3 py-2 text-center">
                              Đơn vị
                            </th>
                            <th className="border px-3 py-2 text-center">
                              Tổng năm
                            </th>
                            <th className="border px-3 py-2 text-center">
                              Chiến sĩ tiên tiến
                            </th>
                            <th className="border px-3 py-2 text-center">
                              Chiến sĩ thi đua
                            </th>
                            <th className="border px-3 py-2 text-center">
                              Đủ điều kiện BK BQP
                            </th>
                            <th className="border px-3 py-2 text-center">
                              Đủ điều kiện CSTĐ TQ
                            </th>
                            <th className="border px-3 py-2 text-center">
                              Thao tác
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {(() => {
                            const studentsWithAchievements = students.filter(
                              (student) => {
                                if (
                                  selectedUnit &&
                                  student.unit !== selectedUnit
                                )
                                  return false;
                                const achievement = achievements[student.id];
                                return (
                                  achievement &&
                                  achievement.yearlyAchievements.length > 0
                                );
                              }
                            );

                            // Sắp xếp theo thứ tự đơn vị từ L1-H5 đến L6-H5
                            const unitOrder = [
                              "L1 - H5",
                              "L2 - H5",
                              "L3 - H5",
                              "L4 - H5",
                              "L5 - H5",
                              "L6 - H5",
                            ];

                            const sortedStudents =
                              studentsWithAchievements.sort((a, b) => {
                                const aIndex = unitOrder.indexOf(a.unit || "");
                                const bIndex = unitOrder.indexOf(b.unit || "");

                                // Nếu cả hai đều có trong danh sách, sắp xếp theo thứ tự
                                if (aIndex !== -1 && bIndex !== -1) {
                                  return aIndex - bIndex;
                                }

                                // Nếu chỉ một trong hai có trong danh sách, ưu tiên cái có trong danh sách
                                if (aIndex !== -1) return -1;
                                if (bIndex !== -1) return 1;

                                // Nếu cả hai đều không có trong danh sách, sắp xếp theo tên
                                return (a.unit || "").localeCompare(
                                  b.unit || ""
                                );
                              });

                            if (sortedStudents.length > 0) {
                              return sortedStudents.map((student) => {
                                const achievement = achievements[student.id];
                                return (
                                  <tr
                                    key={student.id}
                                    className="hover:bg-gray-50 dark:hover:bg-gray-700"
                                  >
                                    <td className="border px-3 py-2 text-center">
                                      {student.fullName}
                                    </td>
                                    <td className="border px-3 py-2 text-center">
                                      {student.studentId}
                                    </td>
                                    <td className="border px-3 py-2 text-center">
                                      {student.unit}
                                    </td>
                                    <td className="border px-3 py-2 text-center font-bold">
                                      {achievement.totalYears}
                                    </td>
                                    <td className="border px-3 py-2 text-center">
                                      {achievement.totalAdvancedSoldier}
                                    </td>
                                    <td className="border px-3 py-2 text-center">
                                      {achievement.totalCompetitiveSoldier}
                                    </td>
                                    <td className="border px-3 py-2 text-center">
                                      <span
                                        className={`px-2 py-1 rounded text-xs ${
                                          achievement.eligibleForMinistryReward
                                            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                                            : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                                        }`}
                                      >
                                        {achievement.eligibleForMinistryReward
                                          ? "✓"
                                          : "✗"}
                                      </span>
                                    </td>
                                    <td className="border px-3 py-2 text-center">
                                      <span
                                        className={`px-2 py-1 rounded text-xs ${
                                          achievement.eligibleForNationalReward
                                            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                                            : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                                        }`}
                                      >
                                        {achievement.eligibleForNationalReward
                                          ? "✓"
                                          : "✗"}
                                      </span>
                                    </td>
                                    <td className="border px-3 py-2 text-center">
                                      <Link
                                        href={`/admin/achievement/${student.id}`}
                                        className="inline-flex items-center justify-center gap-1 mx-auto w-fit text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 px-2 py-1 rounded text-sm transition-colors"
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
                                    </td>
                                  </tr>
                                );
                              });
                            } else {
                              return (
                                <tr>
                                  <td
                                    className="border px-3 py-2 text-center text-gray-400"
                                    colSpan="9"
                                  >
                                    Không có học viên nào có khen thưởng
                                  </td>
                                </tr>
                              );
                            }
                          })()}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Form thêm khen thưởng */}
          {showFormAdd && (
            <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
              <div className="bg-black bg-opacity-50 inset-0 fixed"></div>
              <div className="relative mt-16 bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[85vh] overflow-y-auto">
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
                <form onSubmit={handleAddYearlyAchievement} className="p-4">
                  {!selectedStudentForForm && (
                    <div className="mb-4">
                      <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                        Chọn học viên
                      </label>
                      <select
                        value={selectedStudentForForm?.id || ""}
                        onChange={(e) => {
                          const student = students.find(
                            (s) => s.id === e.target.value
                          );
                          setSelectedStudentForForm(student);
                        }}
                        className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        required
                      >
                        <option value="">Chọn học viên</option>
                        {students &&
                          students.length > 0 &&
                          students.map((student) => (
                            <option key={student.id} value={student.id}>
                              {student.fullName} - {student.unit}
                            </option>
                          ))}
                      </select>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
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
                          required
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
                        <select
                          value={addFormData.title || ""}
                          onChange={(e) =>
                            setAddFormData({
                              ...addFormData,
                              title: e.target.value,
                            })
                          }
                          className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          required
                        >
                          <option value="">Chọn danh hiệu</option>
                          <option value="Chiến sĩ tiên tiến">
                            Chiến sĩ tiên tiến
                          </option>
                          <option value="Chiến sĩ thi đua">
                            Chiến sĩ thi đua
                          </option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                          Bằng khen
                        </label>
                        <select
                          value={
                            addFormData.hasMinistryReward
                              ? "bằng khen bộ quốc phòng"
                              : addFormData.hasNationalReward
                              ? "CSTĐ Toàn Quân"
                              : ""
                          }
                          onChange={(e) => {
                            const value = e.target.value;
                            setAddFormData({
                              ...addFormData,
                              hasMinistryReward:
                                value === "bằng khen bộ quốc phòng",
                              hasNationalReward: value === "CSTĐ Toàn Quân",
                            });
                          }}
                          className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        >
                          <option value="">Không có bằng khen</option>
                          <option
                            value="bằng khen bộ quốc phòng"
                            disabled={
                              !selectedStudentForForm ||
                              !canSelectMinistryRewardFor(
                                selectedStudentForForm.id
                              )
                            }
                          >
                            🏆 Bằng khen Bộ Quốc Phòng
                            {selectedStudentForForm &&
                              !canSelectMinistryRewardFor(
                                selectedStudentForForm.id
                              ) &&
                              " (Chưa đủ điều kiện)"}
                          </option>
                          <option
                            value="CSTĐ Toàn Quân"
                            disabled={
                              !selectedStudentForForm ||
                              !canSelectNationalRewardFor(
                                selectedStudentForForm.id
                              )
                            }
                          >
                            🥇 CSTĐ Toàn Quân
                            {selectedStudentForForm &&
                              !canSelectNationalRewardFor(
                                selectedStudentForForm.id
                              ) &&
                              " (Chưa đủ điều kiện)"}
                          </option>
                        </select>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                          Nghiên cứu khoa học
                        </label>
                        <div className="space-y-2">
                          <label className="flex items-center">
                            <input
                              type="radio"
                              name="addScientificType"
                              value="none"
                              checked={
                                !addFormData.scientific?.topics?.length &&
                                !addFormData.scientific?.initiatives?.length
                              }
                              onChange={() =>
                                setAddFormData({
                                  ...addFormData,
                                  scientific: { topics: [], initiatives: [] },
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
                              name="addScientificType"
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
                              name="addScientificType"
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
                              rows="4"
                            />
                            <select
                              value={
                                addFormData.scientific?.topics?.[0]?.status ||
                                "pending"
                              }
                              onChange={(e) =>
                                setAddFormData({
                                  ...addFormData,
                                  scientific: {
                                    ...addFormData.scientific,
                                    topics: [
                                      {
                                        ...addFormData.scientific.topics[0],
                                        status: e.target.value,
                                      },
                                    ],
                                  },
                                })
                              }
                              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            >
                              <option value="pending">Chờ duyệt</option>
                              <option value="approved">Đã duyệt</option>
                              <option value="rejected">Từ chối</option>
                            </select>
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
                              rows="4"
                            />
                            <select
                              value={
                                addFormData.scientific?.initiatives?.[0]
                                  ?.status || "pending"
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
                                        status: e.target.value,
                                      },
                                    ],
                                  },
                                })
                              }
                              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            >
                              <option value="pending">Chờ duyệt</option>
                              <option value="approved">Đã duyệt</option>
                              <option value="rejected">Từ chối</option>
                            </select>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

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
                  <div className="flex justify-end space-x-2 mt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setShowFormAdd(false);
                        setSelectedStudentForForm(null);
                      }}
                      className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500"
                    >
                      Hủy
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                    >
                      Thêm
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Form chỉnh sửa khen thưởng */}
          {showFormEdit && selectedStudentForForm && (
            <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
              <div className="bg-black bg-opacity-50 inset-0 fixed"></div>
              <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md">
                <div className="flex items-center justify-between p-4 border-b">
                  <h2 className="text-xl font-semibold">
                    Chỉnh sửa khen thưởng cho {selectedStudentForForm.fullName}
                  </h2>
                  <button
                    onClick={() => {
                      setShowFormEdit(false);
                      setSelectedStudentForForm(null);
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                </div>
                <form
                  onSubmit={(e) =>
                    handleUpdateYearlyAchievement(
                      e,
                      selectedStudentForForm.id,
                      editFormData.year
                    )
                  }
                  className="p-4 space-y-4"
                >
                  <div>
                    <label className="block text-sm font-medium mb-1">
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
                      className="w-full p-2 border rounded-lg"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
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
                      className="w-full p-2 border rounded-lg"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
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
                      className="w-full p-2 border rounded-lg"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Danh hiệu
                    </label>
                    <select
                      value={editFormData.title || ""}
                      onChange={(e) =>
                        setEditFormData({
                          ...editFormData,
                          title: e.target.value,
                        })
                      }
                      className="w-full p-2 border rounded-lg"
                      required
                    >
                      <option value="">Chọn danh hiệu</option>
                      <option value="Chiến sĩ tiên tiến">
                        Chiến sĩ tiên tiến
                      </option>
                      <option value="Chiến sĩ thi đua">Chiến sĩ thi đua</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
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
                      className="w-full p-2 border rounded-lg"
                      rows="3"
                    />
                  </div>
                  <div className="flex justify-end space-x-2">
                    <button
                      type="button"
                      onClick={() => {
                        setShowFormEdit(false);
                        setSelectedStudentForForm(null);
                      }}
                      className="px-4 py-2 bg-gray-200 rounded-lg"
                    >
                      Hủy
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg"
                    >
                      Cập nhật
                    </button>
                  </div>
                </form>
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
          `}</style>
        </div>
      </div>
    </>
  );
};

export default AchievementStatistics;
