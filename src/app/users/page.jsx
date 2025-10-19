"use client";

import Link from "next/link";
import axios from "axios";
import dayjs from "dayjs";
import { jwtDecode } from "jwt-decode";
import { useState, useEffect } from "react";
import SideBar from "@/components/sidebar";
import Loader from "@/components/loader";
import { BASE_URL } from "@/configs";
import { useLoading } from "@/hooks";

export default function Home() {
  const [learningResult, setLearningResult] = useState(null);
  const [achievement, setAchievement] = useState([]);
  const [commanderDutySchedule, setCommanderDutySchedule] = useState(null);
  const [semesterResults, setSemesterResults] = useState([]);
  const [tuitionFee, setTuitionFee] = useState([]);
  const [timeTable, setTimeTable] = useState([]);
  const [cutRice, setCutRice] = useState(null);
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { loading, withLoading } = useLoading(true);

  const fetchLearningResult = async () => {
    const token = localStorage.getItem("token");

    if (token) {
      const decodedToken = jwtDecode(token);
      try {
        const res = await axios.get(
          `${BASE_URL}/student/${decodedToken.id}/learning-information`,
          {
            headers: {
              token: `Bearer ${token}`,
            },
          }
        );

        setLearningResult(res.data);
      } catch (error) {
        console.log(error);
      }
    }
  };

  const fetchSemesterResults = async () => {
    const token = localStorage.getItem("token");

    if (token) {
      const decodedToken = jwtDecode(token);
      try {
        const res = await axios.get(`${BASE_URL}/grade/${decodedToken.id}`, {
          headers: {
            token: `Bearer ${token}`,
          },
        });

        setSemesterResults(res.data.semesterResults || []);
      } catch (error) {
        console.log(error);
      }
    }
  };

  const fetchTuitionFee = async () => {
    const token = localStorage.getItem("token");

    if (token) {
      const decodedToken = jwtDecode(token);
      try {
        const res = await axios.get(
          `${BASE_URL}/student/${decodedToken.id}/tuition-fee`,
          {
            headers: {
              token: `Bearer ${token}`,
            },
          }
        );

        setTuitionFee(res.data);
      } catch (error) {
        console.log(error);
      }
    }
  };

  const fetchTimeTable = async () => {
    const token = localStorage.getItem("token");

    if (token) {
      const decodedToken = jwtDecode(token);
      try {
        const res = await axios.get(
          `${BASE_URL}/student/${decodedToken.id}/time-table`,
          {
            headers: {
              token: `Bearer ${token}`,
            },
          }
        );

        setTimeTable(res.data);
      } catch (error) {
        console.log(error);
      }
    }
  };

  const fetchCutRice = async () => {
    const token = localStorage.getItem("token");

    if (token) {
      try {
        const decodedToken = jwtDecode(token);
        const res = await axios.get(
          `${BASE_URL}/student/${decodedToken.id}/cut-rice`,
          {
            headers: {
              token: `Bearer ${token}`,
            },
          }
        );

        if (res.data && typeof res.data === "object") {
          setCutRice(res.data);
        } else {
          setCutRice(null);
        }
      } catch (error) {
        console.log(error);
        setCutRice(null);
      }
    }
  };

  const fetchProfile = async () => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const decodedToken = jwtDecode(token);
        const res = await axios.get(`${BASE_URL}/student/${decodedToken.id}`, {
          headers: {
            token: `Bearer ${token}`,
          },
        });
        setProfile(res.data);
      } catch (error) {
        console.log(error);
      }
    }
  };

  // Removed: fetchPhisicalResult function

  // Removed: fetchVacationSchedule function

  const fetchAchievement = async () => {
    const token = localStorage.getItem("token");

    if (token) {
      try {
        const decodedToken = jwtDecode(token);
        const res = await axios.get(
          `${BASE_URL}/achievement/${decodedToken.id}`,
          {
            headers: {
              token: `Bearer ${token}`,
            },
          }
        );

        setAchievement(res.data);
      } catch (error) {
        console.log(error);
      }
    }
  };

  // Removed: fetchHelpCooking function

  const fetchSchedule = async () => {
    const token = localStorage.getItem("token");

    if (token) {
      try {
        const currentDate = new Date();
        const currentYear = currentDate.getFullYear();
        const currentMonth = currentDate.getMonth() + 1;

        const res = await axios.get(
          `${BASE_URL}/user/commanderDutySchedule?page=1&year=${currentYear}&month=${currentMonth}`,
          {
            headers: {
              token: `Bearer ${token}`,
            },
          }
        );

        // Lấy dữ liệu của phần tử có ngày là ngày hiện tại
        currentDate.setHours(0, 0, 0, 0); // Đặt giờ, phút, giây, mili giây về 0

        const currentSchedule = res.data?.schedules?.find((schedule) => {
          const scheduleDate = new Date(schedule.workDay);
          scheduleDate.setHours(0, 0, 0, 0); // Đặt giờ, phút, giây, mili giây về 0

          return scheduleDate.getTime() === currentDate.getTime();
        });

        setCommanderDutySchedule(currentSchedule);
      } catch (error) {
        console.log(error);
        setCommanderDutySchedule(null);
      }
    }
  };

  const refreshAllData = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([
        fetchLearningResult(),
        fetchSemesterResults(),
        fetchTuitionFee(),
        fetchTimeTable(),
        fetchCutRice(),
        fetchAchievement(),
        fetchSchedule(),
        fetchProfile(),
      ]);
    } catch (error) {
      console.error("Error refreshing data:", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const initialLoad = async () => {
    setIsLoading(true);
    try {
      await withLoading(async () => {
        await Promise.all([
          fetchLearningResult(),
          fetchSemesterResults(),
          fetchTuitionFee(),
          fetchTimeTable(),
          fetchCutRice(),
          fetchAchievement(),
          fetchSchedule(),
          fetchProfile(),
        ]);
      });
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    initialLoad();
  }, [withLoading]);

  // Tính toán thống kê
  const getLatestSemester = () => {
    if (semesterResults.length > 0) {
      const latest = semesterResults[semesterResults.length - 1];
      return {
        semester: latest.semester,
        gpa4: latest.averageGrade4?.toFixed(2) || "0.00",
        gpa10: latest.averageGrade10?.toFixed(2) || "0.00",
        credits: latest.totalCredits || 0,
        subjects: latest.subjects?.length || 0,
      };
    }
    return null;
  };

  const getUnpaidTuition = () => {
    return tuitionFee.filter(
      (fee) =>
        fee.status?.toLowerCase().includes("chưa thanh toán") ||
        fee.status?.toLowerCase().includes("chưa đóng")
    ).length;
  };

  const getUnpaidTuitionAmount = () => {
    const unpaidFees = tuitionFee.filter(
      (fee) =>
        fee.status?.toLowerCase().includes("chưa thanh toán") ||
        fee.status?.toLowerCase().includes("chưa đóng")
    );
    return unpaidFees.reduce(
      (total, fee) => total + (parseInt(fee.totalAmount) || 0),
      0
    );
  };

  const getPaidTuitionAmount = () => {
    const paidFees = tuitionFee.filter(
      (fee) =>
        !fee.status?.toLowerCase().includes("chưa thanh toán") &&
        !fee.status?.toLowerCase().includes("chưa đóng")
    );
    return paidFees.reduce(
      (total, fee) => total + (parseInt(fee.totalAmount) || 0),
      0
    );
  };

  const getTotalTuitionAmount = () => {
    return tuitionFee.reduce(
      (total, fee) => total + (parseInt(fee.totalAmount) || 0),
      0
    );
  };

  const getTodayClasses = () => {
    const today = new Date().toLocaleDateString("vi-VN", { weekday: "long" });
    const dayMap = {
      "Thứ Hai": "Thứ 2",
      "Thứ Ba": "Thứ 3",
      "Thứ Tư": "Thứ 4",
      "Thứ Năm": "Thứ 5",
      "Thứ Sáu": "Thứ 6",
      "Thứ Bảy": "Thứ 7",
      "Chủ Nhật": "Chủ nhật",
    };
    const todayKey = dayMap[today] || today;
    return timeTable.filter((item) => item.day === todayKey).length;
  };

  const getTodayTimeTablePreview = () => {
    const today = new Date().toLocaleDateString("vi-VN", { weekday: "long" });
    const dayMap = {
      "Thứ Hai": "Thứ 2",
      "Thứ Ba": "Thứ 3",
      "Thứ Tư": "Thứ 4",
      "Thứ Năm": "Thứ 5",
      "Thứ Sáu": "Thứ 6",
      "Thứ Bảy": "Thứ 7",
      "Chủ Nhật": "Chủ nhật",
    };
    const todayKey = dayMap[today] || today;
    const list = timeTable
      .filter((i) => i.day === todayKey)
      .sort((a, b) => (a.startTime || "").localeCompare(b.startTime || ""))
      .slice(0, 2);
    return list;
  };

  const getTodayCutRice = () => {
    if (!cutRice) return null;
    const jsDay = new Date().getDay();
    const map = {
      1: "monday",
      2: "tuesday",
      3: "wednesday",
      4: "thursday",
      5: "friday",
      6: "saturday",
      0: "sunday",
    };
    const key = map[jsDay];
    return cutRice[key] || { breakfast: false, lunch: false, dinner: false };
  };

  // Tính toán thống kê khen thưởng
  const getAchievementStats = () => {
    if (!achievement || !achievement.yearlyAchievements) {
      return {
        totalCount: 0,
        currentYearTitle: "Chưa có khen thưởng",
        latestTitle: "Chưa có dữ liệu",
        latestYear: "Chưa có dữ liệu",
      };
    }

    const currentYear = new Date().getFullYear();
    const currentYearAchievements = achievement.yearlyAchievements.filter(
      (item) => item.year === currentYear
    );

    const latestAchievement =
      achievement.yearlyAchievements.length > 0
        ? achievement.yearlyAchievements[
            achievement.yearlyAchievements.length - 1
          ]
        : null;

    // Lấy danh hiệu của năm hiện tại (nếu có nhiều thì lấy cái đầu tiên)
    const currentYearTitle =
      currentYearAchievements.length > 0
        ? currentYearAchievements[0].title
        : "Chưa có dữ liệu";

    return {
      totalCount: achievement.yearlyAchievements.length,
      currentYearTitle: currentYearTitle,
      latestTitle: latestAchievement?.title || "Chưa có dữ liệu",
      latestYear: latestAchievement?.year || "Chưa có dữ liệu",
    };
  };

  const getLatestSchoolYearStats = () => {
    if (!semesterResults || semesterResults.length === 0) return null;
    const valid = semesterResults.filter(
      (s) => s && s.schoolYear && typeof s.totalCredits === "number"
    );
    if (valid.length === 0) return null;
    const years = [...new Set(valid.map((s) => s.schoolYear))];
    if (years.length === 0) return null;
    const latestYear = years.sort((a, b) => b.localeCompare(a))[0];
    const inYear = valid.filter((s) => s.schoolYear === latestYear);
    let totalCredits = 0;
    let totalGradePoints4 = 0;
    let totalGradePoints10 = 0;
    let totalSubjects = 0;
    inYear.forEach((s) => {
      const credits = s.totalCredits || 0;
      const g4 = s.averageGrade4 || 0;
      const g10 = s.averageGrade10 || 0;
      totalCredits += credits;
      totalGradePoints4 += g4 * credits;
      totalGradePoints10 += g10 * credits;
      totalSubjects += s.subjects?.length || 0;
    });
    const gpa4 =
      totalCredits > 0 ? (totalGradePoints4 / totalCredits).toFixed(2) : "0.00";
    const gpa10 =
      totalCredits > 0
        ? (totalGradePoints10 / totalCredits).toFixed(2)
        : "0.00";
    return {
      schoolYear: latestYear,
      gpa4,
      gpa10,
      credits: totalCredits,
      subjects: totalSubjects,
    };
  };

  const latestSemester = getLatestSemester();
  const unpaidCount = getUnpaidTuition();
  const todayClasses = getTodayClasses();
  const achievementStats = getAchievementStats();

  if (loading) {
    return <Loader text="Đang tải dữ liệu cá nhân..." />;
  }

  return (
    <div className="flex">
      <div>
        <SideBar />
      </div>
      <div className="flex-1 min-h-screen bg-gray-50 dark:bg-gray-900 ml-64">
        <div className="w-full pt-20 pl-5 pr-6 mb-5">
          {/* Header */}
          <div className="mb-8">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  Tổng quan học tập và rèn luyện
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  Chào mừng bạn trở lại! Đây là tổng quan về tình hình học tập
                  và rèn luyện của bạn.
                </p>
              </div>
              <button
                onClick={refreshAllData}
                disabled={isRefreshing}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition-colors"
                title="Làm mới dữ liệu"
              >
                <svg
                  className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                {isRefreshing ? "Đang tải..." : "Làm mới"}
              </button>
            </div>
          </div>

          {/* Thống kê nhanh */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center">
                <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                  <svg
                    className="w-6 h-6 text-blue-600 dark:text-blue-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                    />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    GPA hiện tại
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {latestSemester ? latestSemester.gpa4 : "0.00"}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center">
                <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-lg">
                  <svg
                    className="w-6 h-6 text-green-600 dark:text-green-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Tín chỉ tích lũy
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {latestSemester ? latestSemester.credits : 0}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center">
                <div className="p-3 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg">
                  <svg
                    className="w-6 h-6 text-yellow-600 dark:text-yellow-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                    />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Học phí chưa đóng
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {unpaidCount}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center">
                <div className="p-3 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                  <svg
                    className="w-6 h-6 text-purple-600 dark:text-purple-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Lớp học hôm nay
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {todayClasses}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Các module chính */}
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {/* Học tập */}
            <Link href="/users/learning-information" className="group">
              <div className="bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-2xl p-6 shadow-lg border border-blue-200 dark:border-blue-700 transition-all duration-300 hover:shadow-xl hover:scale-105 h-64">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                    <svg
                      className="w-8 h-8 text-blue-600 dark:text-blue-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                      />
                    </svg>
                  </div>
                  <svg
                    className="w-6 h-6 text-blue-600 dark:text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-blue-900 dark:text-blue-100 mb-2">
                  Học tập
                </h3>
                <div className="h-24 flex flex-col justify-between text-blue-800 dark:text-blue-200">
                  <div className="space-y-2">
                    {(() => {
                      const latestYear = getLatestSchoolYearStats();
                      return (
                        <>
                          <div className="flex justify-between text-sm">
                            <span>GPA năm (hệ 4):</span>
                            <span className="font-semibold">
                              {latestYear
                                ? latestYear.gpa4
                                : latestSemester
                                ? latestSemester.gpa4
                                : "Chưa có dữ liệu"}
                            </span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>Năm học:</span>
                            <span className="font-semibold">
                              {latestYear
                                ? latestYear.schoolYear
                                : "Chưa có dữ liệu"}
                            </span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>Tổng tín chỉ năm:</span>
                            <span className="font-semibold">
                              {latestYear
                                ? latestYear.credits
                                : latestSemester
                                ? latestSemester.credits
                                : "Chưa có dữ liệu"}
                            </span>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </div>
              </div>
            </Link>

            {/* Cắt cơm hôm nay */}
            <Link href="/users/cut-rice" className="group">
              <div className="bg-gradient-to-br from-rose-50 to-pink-100 dark:from-rose-900/20 dark:to-pink-900/20 rounded-2xl p-6 shadow-lg border border-rose-200 dark:border-rose-700 transition-all duration-300 hover:shadow-xl hover:scale-105 h-64">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-rose-100 dark:bg-rose-900/30 rounded-xl">
                    <svg
                      className="w-8 h-8 text-rose-600 dark:text-rose-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M5 3v8M7 3v8M9 3v8M5 11h4M7 11v10"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M18 3a3 3 0 013 3c0 2-2 4-3 4v11"
                      />
                    </svg>
                  </div>
                  <svg
                    className="w-6 h-6 text-rose-600 dark:text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-rose-900 dark:text-rose-100 mb-2">
                  Cắt cơm hôm nay
                </h3>
                <div className="h-24 flex flex-col justify-center text-rose-800 dark:text-rose-200">
                  {(() => {
                    const today = getTodayCutRice();
                    return (
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Bữa sáng</span>
                          <span className="inline-flex items-center justify-center h-5 w-5 rounded border border-rose-300 dark:border-rose-700 text-xs font-semibold">
                            {today?.breakfast ? "x" : ""}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Bữa trưa</span>
                          <span className="inline-flex items-center justify-center h-5 w-5 rounded border border-rose-300 dark:border-rose-700 text-xs font-semibold">
                            {today?.lunch ? "x" : ""}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Bữa tối</span>
                          <span className="inline-flex items-center justify-center h-5 w-5 rounded border border-rose-300 dark:border-rose-700 text-xs font-semibold">
                            {today?.dinner ? "x" : ""}
                          </span>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>
            </Link>

            {/* Thời khóa biểu hôm nay */}
            <Link
              href="/users/learning-information?tab=time-table"
              className="group"
            >
              <div className="bg-gradient-to-br from-emerald-50 to-green-100 dark:from-emerald-900/20 dark:to-green-900/20 rounded-2xl p-6 shadow-lg border border-emerald-200 dark:border-emerald-700 transition-all duration-300 hover:shadow-xl hover:scale-105 h-64">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl">
                    <svg
                      className="w-8 h-8 text-emerald-600 dark:text-emerald-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                  <svg
                    className="w-6 h-6 text-emerald-600 dark:text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-emerald-900 dark:text-emerald-100 mb-2">
                  Thời khóa biểu hôm nay
                </h3>
                <div className="h-24 flex flex-col justify-between text-emerald-800 dark:text-emerald-200">
                  <div className="flex justify-between">
                    <span>Số lớp hôm nay:</span>
                    <span className="font-semibold">{todayClasses}</span>
                  </div>
                  <div className="flex-1 overflow-hidden">
                    {todayClasses === 0 ? (
                      <div className="text-sm text-emerald-600 dark:text-emerald-400 italic">
                        Không có lớp học
                      </div>
                    ) : (
                      <div className="space-y-1">
                        {getTodayTimeTablePreview().map((c, index) => (
                          <div
                            key={c.id}
                            className="flex justify-between text-sm"
                          >
                            <span className="truncate">
                              {c.subject || "N/A"}
                            </span>
                            <span className="font-semibold ml-2 flex-shrink-0">
                              {c.startTime} - {c.endTime}
                            </span>
                          </div>
                        ))}
                        {todayClasses > 2 && (
                          <div className="text-xs text-emerald-600 dark:text-emerald-400 italic">
                            ... Bấm để xem thêm
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </Link>

            {/* Lịch trực chỉ huy */}
            <Link href="/users/commander-duty-schedule" className="group">
              <div className="bg-gradient-to-br from-orange-50 to-amber-100 dark:from-orange-900/20 dark:to-amber-900/20 rounded-2xl p-6 shadow-lg border border-orange-200 dark:border-orange-700 transition-all duration-300 hover:shadow-xl hover:scale-105 h-64">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-xl">
                    <svg
                      className="w-8 h-8 text-orange-600 dark:text-orange-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <svg
                    className="w-6 h-6 text-orange-600 dark:text-orange-400 opacity-0 group-hover:opacity-100 transition-opacity"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-orange-900 dark:text-orange-100 mb-2">
                  Lịch trực chỉ huy
                </h3>
                <div className="h-24 flex flex-col justify-center text-orange-800 dark:text-orange-200">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Ngày hôm nay:</span>
                      <span className="font-semibold">
                        {new Date().toLocaleDateString("vi-VN")}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Trực hôm nay:</span>
                      <span className="font-semibold">
                        {commanderDutySchedule
                          ? "Đã có lịch trực"
                          : "Chưa có lịch trực"}
                      </span>
                    </div>
                    {commanderDutySchedule && (
                      <>
                        <div className="flex justify-between text-sm">
                          <span>Chỉ huy:</span>
                          <span className="font-semibold">
                            {commanderDutySchedule.fullName ||
                              "Chưa có dữ liệu"}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Cấp bậc:</span>
                          <span className="font-semibold text-xs">
                            {commanderDutySchedule.rank || "Chưa có dữ liệu"}
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </Link>

            {/* Học phí */}
            <Link
              href="/users/learning-information?tab=tuition-fee"
              className="group"
            >
              <div className="bg-gradient-to-br from-violet-50 to-purple-100 dark:from-violet-900/20 dark:to-purple-900/20 rounded-2xl p-6 shadow-lg border border-violet-200 dark:border-violet-700 transition-all duration-300 hover:shadow-xl hover:scale-105 h-64">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-violet-100 dark:bg-violet-900/30 rounded-xl">
                    <svg
                      className="w-8 h-8 text-violet-600 dark:text-violet-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                      />
                    </svg>
                  </div>
                  <svg
                    className="w-6 h-6 text-violet-600 dark:text-violet-400 opacity-0 group-hover:opacity-100 transition-opacity"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-violet-900 dark:text-violet-100 mb-2">
                  Học phí
                </h3>
                <div className="h-24 flex flex-col justify-center text-violet-800 dark:text-violet-200">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Tổng số tiền:</span>
                      <span className="font-semibold">
                        {getTotalTuitionAmount().toLocaleString("vi-VN")} VNĐ
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Chưa đóng:</span>
                      <span className="font-semibold text-red-600 dark:text-red-400">
                        {getUnpaidTuitionAmount().toLocaleString("vi-VN")} VNĐ
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Đã đóng:</span>
                      <span className="font-semibold text-green-600 dark:text-green-400">
                        {getPaidTuitionAmount().toLocaleString("vi-VN")} VNĐ
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </Link>

            {/* Thông tin giấy tờ */}
            <div className="group">
              <div className="bg-gradient-to-br from-slate-50 to-gray-100 dark:from-slate-900/20 dark:to-gray-900/20 rounded-2xl p-6 shadow-lg border border-slate-200 dark:border-slate-700 transition-all duration-300 hover:shadow-xl hover:scale-105 h-64">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-slate-100 dark:bg-slate-900/30 rounded-xl">
                    <svg
                      className="w-8 h-8 text-slate-700 dark:text-slate-300"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M16 7H8a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2V9a2 2 0 00-2-2z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M12 11h4m-8 4h8"
                      />
                    </svg>
                  </div>
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">
                  Thông tin giấy tờ
                </h3>
                <div className="h-24 flex flex-col justify-center text-slate-800 dark:text-slate-200">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>CCCD:</span>
                      <span className="font-semibold">
                        {profile?.cccdNumber || "Chưa có dữ liệu"}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Số thẻ Đảng viên:</span>
                      <span className="font-semibold">
                        {profile?.partyMemberCardNumber || "Chưa có dữ liệu"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
