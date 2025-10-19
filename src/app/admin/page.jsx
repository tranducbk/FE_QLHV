"use client";

import Link from "next/link";
import axios from "axios";
import dayjs from "dayjs";
import { useState, useEffect } from "react";
import SideBar from "@/components/sidebar";
import Loader from "@/components/loader";
import { BASE_URL } from "@/configs";
import { useLoading } from "@/hooks";
import { Card, Row, Col, Statistic, Progress, Divider, Typography } from "antd";
import {
  UserOutlined,
  TrophyOutlined,
  ClockCircleOutlined,
  TeamOutlined,
  BookOutlined,
} from "@ant-design/icons";

const { Title, Text } = Typography;

export default function Home() {
  const [learningResult, setLearningResult] = useState(null);
  const [student, setStudent] = useState(null);
  const [cutRice, setCutRice] = useState(null);
  const [achievement, setAchievement] = useState(null);
  const [trainingRatings, setTrainingRatings] = useState(null);
  const [semesters, setSemesters] = useState([]);
  const [detailedLearningResults, setDetailedLearningResults] = useState([]);
  const [dataIsLoaded, setDataIsLoaded] = useState(false);
  const { loading, withLoading } = useLoading(true);

  const currentDate = new Date();
  const currentDayIndex = currentDate.getDay();
  const daysOfWeek = [
    "Chủ Nhật",
    "Thứ Hai",
    "Thứ Ba",
    "Thứ Tư",
    "Thứ Năm",
    "Thứ Sáu",
    "Thứ Bảy",
  ];

  const fetchLearningResult = async () => {
    const token = localStorage.getItem("token");

    if (token) {
      try {
        const res = await axios.get(`${BASE_URL}/commander/learningResultAll`, {
          headers: {
            token: `Bearer ${token}`,
          },
        });

        setLearningResult(res.data);
      } catch (error) {
        console.log(error);
      }
    }
  };

  const fetchStudent = async () => {
    const token = localStorage.getItem("token");

    if (token) {
      try {
        const res = await axios.get(`${BASE_URL}/commander/students`, {
          headers: {
            token: `Bearer ${token}`,
          },
        });

        setStudent(res.data);
      } catch (error) {
        console.log(error);
      }
    }
  };

  const fetchCutRice = async () => {
    const token = localStorage.getItem("token");

    if (token) {
      try {
        const res = await axios.get(`${BASE_URL}/commander/cutRiceByDate`, {
          headers: {
            token: `Bearer ${token}`,
          },
        });

        setCutRice(res.data);
      } catch (error) {
        console.log(error);
      }
    }
  };

  const fetchAchievement = async () => {
    const token = localStorage.getItem("token");

    if (token) {
      try {
        const res = await axios.get(`${BASE_URL}/commander/achievementAll`, {
          headers: {
            token: `Bearer ${token}`,
          },
        });

        setAchievement(res.data);
      } catch (error) {
        console.log(error);
      }
    }
  };

  const fetchTrainingRatings = async () => {
    const token = localStorage.getItem("token");

    if (token) {
      try {
        const res = await axios.get(`${BASE_URL}/commander/trainingRatings`, {
          headers: {
            token: `Bearer ${token}`,
          },
        });

        setTrainingRatings(res.data);
      } catch (error) {
        console.log(error);
        setTrainingRatings([]);
      }
    }
  };

  const fetchSemesters = async () => {
    const token = localStorage.getItem("token");

    if (token) {
      try {
        const res = await axios.get(`${BASE_URL}/semester`, {
          headers: {
            token: `Bearer ${token}`,
          },
        });

        setSemesters(res.data || []);
      } catch (error) {
        console.log(error);
        setSemesters([]);
      }
    }
  };

  const fetchDetailedLearningResults = async () => {
    const token = localStorage.getItem("token");

    if (token) {
      try {
        // Lấy học kỳ mới nhất trước
        const semesterRes = await axios.get(`${BASE_URL}/semester`, {
          headers: {
            token: `Bearer ${token}`,
          },
        });

        const semesters = semesterRes.data || [];

        if (semesters.length === 0) {
          setDetailedLearningResults([]);
          return;
        }

        // Tìm học kỳ mới nhất
        const sortedSemesters = semesters.sort((a, b) => {
          if (a.schoolYear !== b.schoolYear) {
            return b.schoolYear.localeCompare(a.schoolYear);
          }
          const semesterOrder = { HK1: 1, HK2: 2, HK3: 3 };
          return (semesterOrder[b.code] || 0) - (semesterOrder[a.code] || 0);
        });

        const latestSemester = sortedSemesters[0];

        // Lấy kết quả học tập chi tiết cho học kỳ mới nhất
        const res = await axios.get(
          `${BASE_URL}/commander/allStudentsGrades?semester=${latestSemester.code}&schoolYear=${latestSemester.schoolYear}`,
          {
            headers: {
              token: `Bearer ${token}`,
            },
          }
        );

        setDetailedLearningResults(res.data || []);
      } catch (error) {
        console.log("Error fetching detailed learning results:", error);
        setDetailedLearningResults([]);
      }
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      await withLoading(async () => {
        await Promise.all([
          fetchLearningResult(),
          fetchStudent(),
          fetchCutRice(),
          fetchAchievement(),
          fetchTrainingRatings(),
          fetchSemesters(),
          fetchDetailedLearningResults(),
        ]);
        setDataIsLoaded(true);
      });
    };

    fetchData();
  }, [withLoading]);

  if (loading) {
    return <Loader text="Đang tải dữ liệu dashboard..." />;
  }

  const totalStudents = student?.length || 0;
  const totalPersonnel = totalStudents + 3; // +3 chỉ huy
  const learningProgress =
    totalStudents > 0
      ? ((learningResult?.learningResults || 0) / totalStudents) * 100
      : 0;

  // Tìm học kỳ mới nhất
  const getLatestSemester = () => {
    if (!semesters || semesters.length === 0) return null;

    // Sắp xếp theo năm học và học kỳ
    const sortedSemesters = semesters.sort((a, b) => {
      // So sánh năm học trước
      if (a.schoolYear !== b.schoolYear) {
        return b.schoolYear.localeCompare(a.schoolYear);
      }
      // Nếu cùng năm học, so sánh học kỳ
      const semesterOrder = { HK1: 1, HK2: 2, HK3: 3 };
      return (semesterOrder[b.code] || 0) - (semesterOrder[a.code] || 0);
    });

    return sortedSemesters[0];
  };

  const latestSemester = getLatestSemester();

  // Tính toán tỷ lệ học tập chi tiết
  const getDetailedLearningStats = () => {
    if (!detailedLearningResults || detailedLearningResults.length === 0) {
      return {
        excellent: 0, // Xuất sắc (GPA >= 3.6)
        good: 0, // Giỏi (GPA >= 3.2)
        fair: 0, // Khá (GPA >= 2.5)
        average: 0, // Trung bình (GPA >= 2.0)
        poor: 0, // Yếu (GPA < 2.0)
        debt: 0, // Nợ môn
        total: 0,
      };
    }

    let stats = {
      excellent: 0,
      good: 0,
      fair: 0,
      average: 0,
      poor: 0,
      debt: 0,
      total: detailedLearningResults.length,
    };

    detailedLearningResults.forEach((student) => {
      const gpa =
        parseFloat(student.GPA) || parseFloat(student.averageGrade4) || 0;
      const hasDebt = student.failedSubjects > 0 || student.debtCredits > 0;
        
      if (hasDebt) {
        stats.debt++;
      } else if (gpa >= 3.6) {
        stats.excellent++;
      } else if (gpa >= 3.2) {
        stats.good++;
      } else if (gpa >= 2.5) {
        stats.fair++;
      } else if (gpa >= 2.0) {
        stats.average++;
      } else {
        stats.poor++;
      }
    });

    return stats;
  };

  const learningStats = getDetailedLearningStats();

  const getLatestSchoolYear = () => {
    if (!trainingRatings || trainingRatings.length === 0) return null;
    const schoolYears = [
      ...new Set(trainingRatings.map((item) => item.schoolYear)),
    ];
    return schoolYears.sort((a, b) => b.localeCompare(a))[0];
  };

  const getTrainingRatingStats = () => {
    if (!trainingRatings || trainingRatings.length === 0)
      return {
        total: 0,
        totalStudents: 0,
        good: 0,
        fair: 0,
        average: 0,
        poor: 0,
      };

    const latestYear = getLatestSchoolYear();
    const latestYearData = trainingRatings.filter(
      (item) => item.schoolYear === latestYear
    );

    const stats = {
      total: latestYearData.filter(
        (item) => item.trainingRating && item.trainingRating !== null
      ).length,
      totalStudents: latestYearData.length,
      good: latestYearData.filter((item) => item.trainingRating === "Tốt")
        .length,
      fair: latestYearData.filter((item) => item.trainingRating === "Khá")
        .length,
      average: latestYearData.filter(
        (item) => item.trainingRating === "Trung bình"
      ).length,
      poor: latestYearData.filter((item) => item.trainingRating === "Yếu")
        .length,
    };

    return stats;
  };

  const trainingStats = getTrainingRatingStats();
  const latestSchoolYear = getLatestSchoolYear();

  if (loading) {
    return <Loader text="Đang tải dữ liệu dashboard..." />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="pt-20 p-4">
        {/* Header bên trái */}
        <div className="mb-6">
          <div className="text-left">
            <h1 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-1">
              Dashboard Quản Lý
            </h1>
            <p className="text-slate-600 dark:text-slate-400 text-xs">
              Hệ thống quản lý học viên
            </p>
          </div>
        </div>

        {/* Grid Layout - 2x2 Cards */}
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
            {/* Card 1: Tổng quan quân số */}
            <div className="bg-white/30 dark:bg-slate-800/30 backdrop-blur-md rounded-2xl p-4 border border-white/20 dark:border-slate-700/20 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                    <TeamOutlined className="text-white text-lg" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">
                      Tổng quan quân số
                    </h3>
                    <p className="text-slate-600 dark:text-slate-400 text-xs">
                      Thống kê tổng thể
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-black text-blue-600 dark:text-blue-400">
                    {totalPersonnel}
                  </div>
                  <p className="text-slate-500 dark:text-slate-400 text-xs">
                    tổng quân số
                  </p>
                </div>
              </div>

              {/* Mini Chart */}
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-white/50 dark:bg-slate-700/50 rounded-lg p-3 text-center">
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-1">
                    <UserOutlined className="text-white text-sm" />
                  </div>
                  <div className="text-lg font-bold text-slate-800 dark:text-slate-200">
                    {totalStudents}
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    Học viên
                  </p>
                </div>
                <div className="bg-white/50 dark:bg-slate-700/50 rounded-lg p-3 text-center">
                  <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center mx-auto mb-1">
                    <UserOutlined className="text-white text-sm" />
                  </div>
                  <div className="text-lg font-bold text-slate-800 dark:text-slate-200">
                    3
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    Chỉ huy
                  </p>
                </div>
              </div>
            </div>

            {/* Card 2: Kết quả học tập */}
            <Link href="/admin/learning-results" className="block">
              <div className="bg-white/30 dark:bg-slate-800/30 backdrop-blur-md rounded-2xl p-4 border border-white/20 dark:border-slate-700/20 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 cursor-pointer">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg">
                      <BookOutlined className="text-white text-lg" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">
                        Kết quả học tập
                      </h3>
                      <p className="text-slate-600 dark:text-slate-400 text-xs">
                        {latestSemester
                          ? `${latestSemester.code} - ${latestSemester.schoolYear}`
                          : "Chưa có dữ liệu"}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                      {totalStudents}
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 text-xs">
                      Tổng học viên
                    </p>
                  </div>
                </div>

                {/* 4 Progress Rings */}
                <div className="grid grid-cols-4 gap-2 mb-3">
                  {/* Xuất sắc + Giỏi */}
                  <div className="flex flex-col items-center">
                    <div className="relative w-16 h-16">
                      <svg
                        className="w-16 h-16 transform -rotate-90"
                        viewBox="0 0 100 100"
                      >
                        <circle
                          cx="50"
                          cy="50"
                          r="35"
                          stroke="currentColor"
                          strokeWidth="6"
                          fill="none"
                          className="text-slate-200 dark:text-slate-700"
                        />
                        <circle
                          cx="50"
                          cy="50"
                          r="35"
                          stroke="currentColor"
                          strokeWidth="6"
                          fill="none"
                          strokeDasharray={`${2 * Math.PI * 35}`}
                          strokeDashoffset={`${
                            2 *
                            Math.PI *
                            35 *
                            (1 -
                              (learningStats.excellent + learningStats.good) /
                                learningStats.total)
                          }`}
                          className={`transition-all duration-1000 ease-out ${
                            learningStats.excellent + learningStats.good > 0
                              ? "text-emerald-500"
                              : "text-slate-200 dark:text-slate-700"
                          }`}
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-sm font-bold text-slate-800 dark:text-slate-200">
                          {learningStats.total > 0
                            ? (
                                ((learningStats.excellent +
                                  learningStats.good) /
                                  learningStats.total) *
                                100
                              ).toFixed(0)
                            : 0}
                          %
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                      Giỏi/XS
                    </p>
                  </div>

                  {/* Khá */}
                  <div className="flex flex-col items-center">
                    <div className="relative w-16 h-16">
                      <svg
                        className="w-16 h-16 transform -rotate-90"
                        viewBox="0 0 100 100"
                      >
                        <circle
                          cx="50"
                          cy="50"
                          r="35"
                          stroke="currentColor"
                          strokeWidth="6"
                          fill="none"
                          className="text-slate-200 dark:text-slate-700"
                        />
                        <circle
                          cx="50"
                          cy="50"
                          r="35"
                          stroke="currentColor"
                          strokeWidth="6"
                          fill="none"
                          strokeDasharray={`${2 * Math.PI * 35}`}
                          strokeDashoffset={`${
                            2 *
                            Math.PI *
                            35 *
                            (1 - learningStats.fair / learningStats.total)
                          }`}
                          className={`transition-all duration-1000 ease-out ${
                            learningStats.fair > 0
                              ? "text-blue-500"
                              : "text-slate-200 dark:text-slate-700"
                          }`}
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-sm font-bold text-slate-800 dark:text-slate-200">
                          {learningStats.total > 0
                            ? (
                                (learningStats.fair / learningStats.total) *
                                100
                              ).toFixed(0)
                            : 0}
                          %
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                      Khá
                    </p>
                  </div>

                  {/* TB/Yếu */}
                  <div className="flex flex-col items-center">
                    <div className="relative w-16 h-16">
                      <svg
                        className="w-16 h-16 transform -rotate-90"
                        viewBox="0 0 100 100"
                      >
                        <circle
                          cx="50"
                          cy="50"
                          r="35"
                          stroke="currentColor"
                          strokeWidth="6"
                          fill="none"
                          className="text-slate-200 dark:text-slate-700"
                        />
                        <circle
                          cx="50"
                          cy="50"
                          r="35"
                          stroke="currentColor"
                          strokeWidth="6"
                          fill="none"
                          strokeDasharray={`${2 * Math.PI * 35}`}
                          strokeDashoffset={`${
                            2 *
                            Math.PI *
                            35 *
                            (1 -
                              (learningStats.average + learningStats.poor) /
                                learningStats.total)
                          }`}
                          className={`transition-all duration-1000 ease-out ${
                            learningStats.average + learningStats.poor > 0
                              ? "text-orange-500"
                              : "text-slate-200 dark:text-slate-700"
                          }`}
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-sm font-bold text-slate-800 dark:text-slate-200">
                          {learningStats.total > 0
                            ? (
                                ((learningStats.average + learningStats.poor) /
                                  learningStats.total) *
                                100
                              ).toFixed(0)
                            : 0}
                          %
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                      TB/Yếu
                    </p>
                  </div>

                  {/* Nợ môn */}
                  <div className="flex flex-col items-center">
                    <div className="relative w-16 h-16">
                      <svg
                        className="w-16 h-16 transform -rotate-90"
                        viewBox="0 0 100 100"
                      >
                        <circle
                          cx="50"
                          cy="50"
                          r="35"
                          stroke="currentColor"
                          strokeWidth="6"
                          fill="none"
                          className="text-slate-200 dark:text-slate-700"
                        />
                        <circle
                          cx="50"
                          cy="50"
                          r="35"
                          stroke="currentColor"
                          strokeWidth="6"
                          fill="none"
                          strokeDasharray={`${2 * Math.PI * 35}`}
                          strokeDashoffset={`${
                            2 *
                            Math.PI *
                            35 *
                            (1 - learningStats.debt / learningStats.total)
                          }`}
                          className={`transition-all duration-1000 ease-out ${
                            learningStats.debt > 0
                              ? "text-red-500"
                              : "text-slate-200 dark:text-slate-700"
                          }`}
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-sm font-bold text-slate-800 dark:text-slate-200">
                          {learningStats.total > 0
                            ? (
                                (learningStats.debt / learningStats.total) *
                                100
                              ).toFixed(0)
                            : 0}
                          %
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                      Nợ môn
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-1 text-center">
                  <div className="bg-white/50 dark:bg-slate-700/50 rounded-lg p-2">
                    <div className="text-sm font-bold text-slate-800 dark:text-slate-200">
                      {learningStats.excellent + learningStats.good}
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      Giỏi/XS
                    </p>
                  </div>
                  <div className="bg-white/50 dark:bg-slate-700/50 rounded-lg p-2">
                    <div className="text-sm font-bold text-slate-800 dark:text-slate-200">
                      {learningStats.fair}
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      Khá
                    </p>
                  </div>
                  <div className="bg-white/50 dark:bg-slate-700/50 rounded-lg p-2">
                    <div className="text-sm font-bold text-slate-800 dark:text-slate-200">
                      {learningStats.average + learningStats.poor}
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      TB/Yếu
                    </p>
                  </div>
                  <div className="bg-white/50 dark:bg-slate-700/50 rounded-lg p-2">
                    <div className="text-sm font-bold text-slate-800 dark:text-slate-200">
                      {learningStats.debt}
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      Nợ môn
                    </p>
                  </div>
                </div>
              </div>
            </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Card 3: Lịch cắt cơm */}
            <Link href="/admin/cut-rice" className="block">
              <div className="bg-white/30 dark:bg-slate-800/30 backdrop-blur-md rounded-2xl p-4 border border-white/20 dark:border-slate-700/20 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 cursor-pointer">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center shadow-lg">
                      <ClockCircleOutlined className="text-white text-lg" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">
                        Lịch cắt cơm
                      </h3>
                      <p className="text-slate-600 dark:text-slate-400 text-xs">
                        {daysOfWeek[currentDayIndex]}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-black text-purple-600 dark:text-purple-400">
                      {(cutRice?.breakfast || 0) +
                        (cutRice?.lunch || 0) +
                        (cutRice?.dinner || 0)}
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 text-xs">
                      tổng suất
                    </p>
                  </div>
                </div>

                {/* Meal Schedule Cards */}
                <div className="grid grid-cols-3 gap-1">
                  <div className="bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-md p-2 text-center border border-yellow-200 dark:border-yellow-800">
                    <div className="text-lg font-black text-yellow-600 dark:text-yellow-400">
                      {cutRice?.breakfast || 0}
                    </div>
                    <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Sáng
                    </p>
                  </div>

                  <div className="bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 rounded-md p-2 text-center border border-orange-200 dark:border-orange-800">
                    <div className="text-lg font-black text-orange-600 dark:text-orange-400">
                      {cutRice?.lunch || 0}
                    </div>
                    <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Trưa
                    </p>
                  </div>

                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-md p-2 text-center border border-blue-200 dark:border-blue-800">
                    <div className="text-lg font-black text-blue-600 dark:text-blue-400">
                      {cutRice?.dinner || 0}
                    </div>
                    <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Tối
                    </p>
                  </div>
                </div>
              </div>
            </Link>

            {/* Card 4: Xếp loại rèn luyện */}
            <Link href="/admin/training-rating" className="block">
              <div className="bg-white/30 dark:bg-slate-800/30 backdrop-blur-md rounded-2xl p-4 border border-white/20 dark:border-slate-700/20 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 cursor-pointer">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                      <TrophyOutlined className="text-white text-lg" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">
                        Xếp loại rèn luyện
                      </h3>
                      <p className="text-slate-600 dark:text-slate-400 text-xs">
                        {latestSchoolYear
                          ? `Năm học ${latestSchoolYear}`
                          : "Chưa có dữ liệu"}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-black text-purple-600 dark:text-purple-400">
                      {trainingStats.total}/{trainingStats.totalStudents}
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 text-xs">
                      đã đánh giá
                    </p>
                  </div>
                </div>

                {/* Training Rating Types */}
                <div className="space-y-2">
                  <div className="grid grid-cols-4 gap-1">
                    <div className="bg-white/50 dark:bg-slate-700/50 rounded-lg p-2 text-center">
                      <div className="text-sm font-bold text-slate-800 dark:text-slate-200">
                        {trainingStats.good}
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-400">
                        Tốt
                      </p>
                    </div>
                    <div className="bg-white/50 dark:bg-slate-700/50 rounded-lg p-2 text-center">
                      <div className="text-sm font-bold text-slate-800 dark:text-slate-200">
                        {trainingStats.fair}
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-400">
                        Khá
                      </p>
                    </div>
                    <div className="bg-white/50 dark:bg-slate-700/50 rounded-lg p-2 text-center">
                      <div className="text-sm font-bold text-slate-800 dark:text-slate-200">
                        {trainingStats.average}
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-400">
                        Trung bình
                      </p>
                    </div>
                    <div className="bg-white/50 dark:bg-slate-700/50 rounded-lg p-2 text-center">
                      <div className="text-sm font-bold text-slate-800 dark:text-slate-200">
                        {trainingStats.poor}
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-400">
                        Yếu
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
