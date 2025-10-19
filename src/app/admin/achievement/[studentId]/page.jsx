"use client";

import axios from "axios";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { handleNotify } from "../../../../components/notify";
import { BASE_URL } from "@/configs";

const StudentAchievement = () => {
  const router = useRouter();
  const params = useParams();
  const { studentId } = params;

  const [student, setStudent] = useState(null);
  const [achievement, setAchievement] = useState(null);
  const [recommendations, setRecommendations] = useState(null);
  const [showFormAdd, setShowFormAdd] = useState(false);
  const [showFormEdit, setShowFormEdit] = useState(false);
  const [editFormData, setEditFormData] = useState({});
  const [addFormData, setAddFormData] = useState({});
  const [loading, setLoading] = useState(true);

  const fetchStudentAndAchievement = async () => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        // Fetch student info
        const studentRes = await axios.get(
          `${BASE_URL}/commander/student/${studentId}`,
          {
            headers: { token: `Bearer ${token}` },
          }
        );
        setStudent(studentRes.data);

        // Fetch achievement
        try {
          const achievementRes = await axios.get(
            `${BASE_URL}/achievement/admin/${studentId}`,
            {
              headers: { token: `Bearer ${token}` },
            }
          );
          setAchievement(achievementRes.data);
          // Fetch recommendations (đề xuất)
          try {
            const recRes = await axios.get(
              `${BASE_URL}/achievement/admin/${studentId}/recommendations`,
              {
                headers: { token: `Bearer ${token}` },
              }
            );
            setRecommendations(recRes.data);
          } catch (e) {
            setRecommendations({ suggestions: [] });
          }
        } catch (error) {
          // If no achievement exists, create default structure
          setAchievement({
            studentId: studentId,
            yearlyAchievements: [],
            totalYears: 0,
            totalAdvancedSoldier: 0,
            totalCompetitiveSoldier: 0,
            totalScientificTopics: 0,
            totalScientificInitiatives: 0,
            eligibleForMinistryReward: false,
            eligibleForNationalReward: false,
            nextYearRecommendations: {},
          });
          setRecommendations({ suggestions: [] });
        }
      } catch (error) {
        console.log(error);
        handleNotify("danger", "Lỗi!", "Không thể tải dữ liệu học viên");
      } finally {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    if (studentId) {
      fetchStudentAndAchievement();
    }
  }, [studentId]);

  const handleAddYearlyAchievement = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    try {
      await axios.post(
        `${BASE_URL}/achievement/admin/${studentId}`,
        addFormData,
        {
          headers: { token: `Bearer ${token}` },
        }
      );
      handleNotify("success", "Thành công!", "Thêm khen thưởng thành công");
      setShowFormAdd(false);
      setAddFormData({});
      fetchStudentAndAchievement();
    } catch (error) {
      handleNotify(
        "danger",
        "Lỗi!",
        error.response?.data?.message || "Có lỗi xảy ra"
      );
    }
  };

  const handleUpdateYearlyAchievement = async (e, year) => {
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
      fetchStudentAndAchievement();
    } catch (error) {
      handleNotify(
        "danger",
        "Lỗi!",
        error.response?.data?.message || "Có lỗi xảy ra"
      );
    }
  };

  const handleDeleteYearlyAchievement = async (year) => {
    const token = localStorage.getItem("token");
    try {
      await axios.delete(`${BASE_URL}/achievement/admin/${studentId}/${year}`, {
        headers: { token: `Bearer ${token}` },
      });
      handleNotify("success", "Thành công!", "Xóa khen thưởng thành công");
      fetchStudentAndAchievement();
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

  const getScientificResearchDisplay = (ya) => {
    if (!ya || !ya.scientific) return "Chưa có";
    const { topics, initiatives } = ya.scientific;
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

  const getRewardsDisplay = (ya) => {
    if (!ya) return "-";
    const rewards = [];
    if (ya.hasMinistryReward) rewards.push("🏆 BK BQP");
    if (ya.hasNationalReward) rewards.push("🥇 CSTĐ TQ");
    return rewards.length > 0 ? rewards.join(", ") : "Chưa có";
  };

  // Điều kiện chọn bằng khen Bộ Quốc Phòng
  const canSelectMinistryReward = () => {
    if (!achievement) return false;
    // Không cho chọn nếu đã có bằng khen BQP
    const hasMinistryReward = achievement.yearlyAchievements?.some(
      (ya) => ya.hasMinistryReward
    );
    if (hasMinistryReward) return false;

    // Cần ít nhất 2 năm chiến sĩ thi đua liên tiếp
    const competitiveYears =
      achievement.yearlyAchievements
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

    // Cần có đề tài hoặc sáng kiến đã duyệt ở bất kỳ năm nào
    let hasApprovedScientific = false;
    achievement.yearlyAchievements?.forEach((ya) => {
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

  // Điều kiện chọn CSTĐ Toàn Quân
  const canSelectNationalReward = () => {
    if (!achievement) return false;
    // Không cho chọn nếu đã có CSTĐ Toàn Quân
    const hasNationalReward = achievement.yearlyAchievements?.some(
      (ya) => ya.hasNationalReward
    );
    if (hasNationalReward) return false;

    // Cần ít nhất 3 năm chiến sĩ thi đua liên tiếp
    const competitiveYears =
      achievement.yearlyAchievements
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

    // Cần có đề tài hoặc sáng kiến đã duyệt
    let hasApprovedScientific = false;
    achievement.yearlyAchievements?.forEach((ya) => {
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

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  // Trạng thái đã đạt bằng khen theo dữ liệu từng năm
  const hasMinistryRewardAchieved = achievement?.yearlyAchievements?.some(
    (ya) => ya.hasMinistryReward
  );
  const hasNationalRewardAchieved = achievement?.yearlyAchievements?.some(
    (ya) => ya.hasNationalReward
  );

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

  if (!student) {
    return (
      <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-gray-600 dark:text-gray-400">
              Không tìm thấy học viên
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
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
                      {student?.fullName || "Không có tên"}
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
                  KHEN THƯỞNG HỌC VIÊN: {student?.fullName || "Không có tên"}
                </div>
                <div className="flex items-center gap-2">
                  <Link
                    href="/admin/achievement"
                    className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-3 py-2 rounded-lg text-sm dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-200"
                  >
                    ← Quay lại
                  </Link>
                  <button
                    onClick={() => setShowFormAdd(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm"
                  >
                    + Thêm khen thưởng
                  </button>
                </div>
              </div>

              {/* Thông tin học viên */}
              <div className="p-5 border-b border-gray-200 dark:border-gray-700">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Mã học viên:
                    </span>
                    <p className="text-gray-900 dark:text-white">
                      {student?.studentId || "Không có mã"}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Đơn vị:
                    </span>
                    <p className="text-gray-900 dark:text-white">
                      {student?.unit || "Không có đơn vị"}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Cấp bậc:
                    </span>
                    <p className="text-gray-900 dark:text-white">
                      {student?.rank || "Không có cấp bậc"}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Chức vụ:
                    </span>
                    <p className="text-gray-900 dark:text-white">
                      {student?.positionGovernment || "Không có chức vụ"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Thống kê khen thưởng */}
              {achievement && (
                <div className="p-5 border-b border-gray-200 dark:border-gray-700">
                  <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
                    Thống kê khen thưởng
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                    <div className="text-center p-3 bg-green-50 dark:bg-green-900 rounded-lg">
                      <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                        {achievement.totalAdvancedSoldier}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        Chiến sĩ tiên tiến
                      </div>
                    </div>
                    <div className="text-center p-3 bg-yellow-50 dark:bg-yellow-900 rounded-lg">
                      <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                        {achievement.totalCompetitiveSoldier}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        Chiến sĩ thi đua
                      </div>
                    </div>
                    <div className="text-center p-3 bg-purple-50 dark:bg-purple-900 rounded-lg">
                      <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                        {achievement.totalScientificTopics}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        Đề tài khoa học
                      </div>
                    </div>
                    <div className="text-center p-3 bg-indigo-50 dark:bg-indigo-900 rounded-lg">
                      <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                        {achievement.totalScientificInitiatives}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        Sáng kiến khoa học
                      </div>
                    </div>
                    <div className="text-center p-3 bg-red-50 dark:bg-red-900 rounded-lg">
                      <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                        {hasMinistryRewardAchieved
                          ? "🏆"
                          : achievement.eligibleForMinistryReward
                          ? "✓"
                          : "✗"}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {hasMinistryRewardAchieved
                          ? "Đã đạt BK BQP"
                          : achievement.eligibleForMinistryReward
                          ? "Đủ điều kiện BK BQP"
                          : "Chưa đủ điều kiện BK BQP"}
                      </div>
                    </div>
                    <div className="text-center p-3 bg-orange-50 dark:bg-orange-900 rounded-lg">
                      <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                        {hasNationalRewardAchieved
                          ? "🥇"
                          : achievement.eligibleForNationalReward
                          ? "✓"
                          : "✗"}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {hasNationalRewardAchieved
                          ? "Đã đạt CSTĐ TQ"
                          : achievement.eligibleForNationalReward
                          ? "Đủ điều kiện CSTĐ TQ"
                          : "Chưa đủ điều kiện CSTĐ TQ"}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Bảng khen thưởng */}
              <div className="p-5">
                <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
                  Danh sách khen thưởng
                </h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full border border-gray-200 dark:border-gray-700 text-sm text-center">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th className="border px-3 py-2">Năm</th>
                        <th className="border px-3 py-2">Số quyết định</th>
                        <th className="border px-3 py-2">Ngày quyết định</th>
                        <th className="border px-3 py-2">Danh hiệu</th>
                        <th className="border px-3 py-2">
                          Nghiên cứu khoa học
                        </th>
                        <th className="border px-3 py-2">Bằng khen</th>
                        <th className="border px-3 py-2">Ghi chú</th>
                        <th className="border px-3 py-2">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      {achievement &&
                      achievement.yearlyAchievements.length > 0 ? (
                        achievement.yearlyAchievements
                          .slice()
                          .sort((a, b) => (a.year || 0) - (b.year || 0))
                          .map((ya, index) => (
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
                                {ya.title ? getTitleDisplay(ya.title) : "-"}
                              </td>
                              <td className="border px-3 py-2">
                                {getScientificResearchDisplay(ya)}
                              </td>
                              <td className="border px-3 py-2">
                                {getRewardsDisplay(ya)}
                              </td>
                              <td className="border px-3 py-2">
                                {ya.notes || "-"}
                              </td>
                              <td className="border px-3 py-2">
                                <div className="flex justify-center space-x-2">
                                  <button
                                    onClick={() => {
                                      setEditFormData(ya);
                                      setShowFormEdit(true);
                                    }}
                                    className="text-blue-600 hover:text-blue-800 p-1"
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
                                      handleDeleteYearlyAchievement(ya.year)
                                    }
                                    className="text-red-600 hover:text-red-800 p-1"
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
                          ))
                      ) : (
                        <tr>
                          <td
                            className="border px-3 py-2 text-center text-gray-400"
                            colSpan={8}
                          >
                            Không có dữ liệu
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
                {/* Đề xuất khen thưởng */}
                {recommendations?.suggestions &&
                  recommendations.suggestions.length > 0 && (
                    <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg">
                      <h4 className="text-md font-semibold text-blue-800 dark:text-blue-200 mb-2">
                        💡 Đề xuất khen thưởng
                      </h4>
                      <ul className="list-disc pl-5 space-y-1">
                        {recommendations.suggestions.map((s, idx) => (
                          <li
                            key={idx}
                            className="text-sm text-blue-700 dark:text-blue-300"
                          >
                            {s}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
              </div>
            </div>
          </div>

          {/* Form thêm khen thưởng */}
          {showFormAdd && (
            <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
              <div className="bg-black bg-opacity-50 inset-0 fixed"></div>
              <div className="relative mt-20 bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[85vh] overflow-y-auto">
                <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Thêm khen thưởng
                  </h2>
                  <button
                    onClick={() => setShowFormAdd(false)}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    ✕
                  </button>
                </div>
                <form onSubmit={handleAddYearlyAchievement} className="p-4">
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
                            disabled={!canSelectMinistryReward()}
                          >
                            🏆 Bằng khen Bộ Quốc Phòng
                            {!canSelectMinistryReward() &&
                              " (Chưa đủ điều kiện)"}
                          </option>
                          <option
                            value="CSTĐ Toàn Quân"
                            disabled={!canSelectNationalReward()}
                          >
                            🥇 CSTĐ Toàn Quân
                            {!canSelectNationalReward() &&
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
                      onClick={() => setShowFormAdd(false)}
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
          {showFormEdit && (
            <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
              <div className="bg-black bg-opacity-50 inset-0 fixed"></div>
              <div className="relative mt-14 bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[85vh] overflow-y-auto">
                <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Chỉnh sửa khen thưởng
                  </h2>
                  <button
                    onClick={() => setShowFormEdit(false)}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    ✕
                  </button>
                </div>
                <form
                  onSubmit={(e) =>
                    handleUpdateYearlyAchievement(e, editFormData.year)
                  }
                  className="p-4"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
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
                          required
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
                        <select
                          value={editFormData.title || ""}
                          onChange={(e) =>
                            setEditFormData({
                              ...editFormData,
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
                            editFormData.hasMinistryReward
                              ? "bằng khen bộ quốc phòng"
                              : editFormData.hasNationalReward
                              ? "CSTĐ Toàn Quân"
                              : ""
                          }
                          onChange={(e) => {
                            const value = e.target.value;
                            setEditFormData({
                              ...editFormData,
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
                            disabled={!canSelectMinistryReward()}
                          >
                            🏆 Bằng khen Bộ Quốc Phòng
                            {!canSelectMinistryReward() &&
                              " (Chưa đủ điều kiện)"}
                          </option>
                          <option
                            value="CSTĐ Toàn Quân"
                            disabled={!canSelectNationalReward()}
                          >
                            🥇 CSTĐ Toàn Quân
                            {!canSelectNationalReward() &&
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
                              name="editScientificType"
                              value="none"
                              checked={
                                !editFormData.scientific?.topics?.length &&
                                !editFormData.scientific?.initiatives?.length
                              }
                              onChange={() =>
                                setEditFormData({
                                  ...editFormData,
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
                              rows="4"
                            />
                            <select
                              value={
                                editFormData.scientific?.topics?.[0]?.status ||
                                "pending"
                              }
                              onChange={(e) =>
                                setEditFormData({
                                  ...editFormData,
                                  scientific: {
                                    ...editFormData.scientific,
                                    topics: [
                                      {
                                        ...editFormData.scientific.topics[0],
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
                              rows="4"
                            />
                            <select
                              value={
                                editFormData.scientific?.initiatives?.[0]
                                  ?.status || "pending"
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
                  <div>
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
                  <div className="flex justify-end space-x-2">
                    <button
                      type="button"
                      onClick={() => setShowFormEdit(false)}
                      className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500"
                    >
                      Hủy
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                    >
                      Cập nhật
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default StudentAchievement;
