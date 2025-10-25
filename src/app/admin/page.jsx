"use client";

import Link from "next/link";
import axios from "axios";
import dayjs from "dayjs";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { jwtDecode } from "jwt-decode";
import SideBar from "@/components/sidebar";
import Loader from "@/components/loader";
import { BASE_URL } from "@/configs";
import { useLoading } from "@/hooks";
import { Card, Row, Col, Statistic, Progress, Divider, Typography } from "antd";
import {
  UserOutlined,
  TrophyOutlined,
  ClockCircleOutlined,
  BookOutlined,
  RiseOutlined,
  FallOutlined,
  StarOutlined,
  BellOutlined,
  BankOutlined,
  ReadOutlined,
  CoffeeOutlined,
  SafetyOutlined,
  CrownOutlined,
  ShoppingOutlined,
} from "@ant-design/icons";

const { Title, Text } = Typography;

export default function Home() {
  const router = useRouter();

  // Redirect SUPER_ADMIN về trang quản lý admin users
  useEffect(() => {
    const token =
      localStorage.getItem("token") || localStorage.getItem("accessToken");
    if (token) {
      try {
        const decodedToken = jwtDecode(token);
        if (decodedToken.role === "SUPER_ADMIN") {
          router.push("/supper_admin");
        }
      } catch (error) {
        // Handle token decoding error
      }
    }
  }, [router]);
  const [learningResult, setLearningResult] = useState(null);
  const [student, setStudent] = useState(null);
  const [cutRice, setCutRice] = useState(null);
  const [achievement, setAchievement] = useState(null);
  const [trainingRatings, setTrainingRatings] = useState(null);
  const [semesters, setSemesters] = useState([]);
  const [detailedLearningResults, setDetailedLearningResults] = useState([]);
  const [dataIsLoaded, setDataIsLoaded] = useState(false);
  const [classes, setClasses] = useState([]);
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
        // Handle error silently
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
        // Handle error silently
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
        // Handle error silently
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
        // Handle error silently
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
        // Handle error silently
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
        // Handle error silently
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
        // Handle error silently
        setDetailedLearningResults([]);
      }
    }
  };

  const fetchUniversitiesAndOrganizations = async () => {
    const token = localStorage.getItem("token");

    if (token) {
      try {
        // Lấy danh sách tất cả universities
        const universitiesRes = await axios.get(`${BASE_URL}/university/`, {
          headers: {
            token: `Bearer ${token}`,
          },
        });

        const universities = universitiesRes.data || [];

        // Lấy hierarchy cho mỗi university
        const universitiesWithHierarchy = await Promise.all(
          universities.map(async (university) => {
            try {
              const hierarchyRes = await axios.get(
                `${BASE_URL}/university/${university.id}/hierarchy`,
                {
                  headers: {
                    token: `Bearer ${token}`,
                  },
                }
              );
              return {
                ...university,
                organizations: hierarchyRes.data.organizations || [],
              };
            } catch (error) {
              // Handle error silently
              return {
                ...university,
                organizations: [],
              };
            }
          })
        );

        setClasses(universitiesWithHierarchy);
      } catch (error) {
        // Handle error silently
        setClasses([]);
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
          fetchUniversitiesAndOrganizations(),
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

  // Lấy top 5 sinh viên có GPA cao nhất và GPA > 3.2
  const getTopStudents = () => {
    if (!detailedLearningResults || detailedLearningResults.length === 0) {
      return [];
    }

    return [...detailedLearningResults]
      .filter((student) => {
        const gpa =
          parseFloat(student.GPA) || parseFloat(student.averageGrade4) || 0;
        return gpa > 3.2;
      })
      .sort((a, b) => {
        const gpaA = parseFloat(a.GPA) || parseFloat(a.averageGrade4) || 0;
        const gpaB = parseFloat(b.GPA) || parseFloat(b.averageGrade4) || 0;
        return gpaB - gpaA;
      })
      .slice(0, 5);
  };

  const topStudents = getTopStudents();

  // Thống kê theo trường và khoa/viện
  const getUniversityStats = () => {
    if (!student || student.length === 0 || !classes || classes.length === 0) {
      return {
        totalUniversities: 0,
        totalOrganizations: 0,
        totalEducationLevels: 0,
        universities: [],
      };
    }

    // Đếm số lượng organizations (khoa/viện) cho mỗi university
    const universityMap = {};

    classes.forEach((university) => {
      if (!universityMap[university.id]) {
        universityMap[university.id] = {
          id: university.id,
          name: university.universityName,
          code: university.universityCode,
          studentCount: 0,
          organizationCount: university.organizations
            ? university.organizations.length
            : 0,
          educationLevelCount: 0,
          organizations: [],
        };
      }
    });

    // Đếm số sinh viên cho mỗi trường
    student.forEach((s) => {
      if (s.universityId && universityMap[s.universityId]) {
        universityMap[s.universityId].studentCount++;
      }
    });

    // Tính tổng số education levels
    classes.forEach((university) => {
      if (university.organizations) {
        university.organizations.forEach((org) => {
          if (universityMap[university.id]) {
            universityMap[university.id].educationLevelCount +=
              org.educationLevels ? org.educationLevels.length : 0;
            universityMap[university.id].organizations.push({
              name: org.organizationName,
              studentCount: org.totalStudents || 0,
            });
          }
        });
      }
    });

    const universitiesArray = Object.values(universityMap);

    return {
      totalUniversities: universitiesArray.length,
      totalOrganizations: universitiesArray.reduce(
        (sum, u) => sum + u.organizationCount,
        0
      ),
      totalEducationLevels: universitiesArray.reduce(
        (sum, u) => sum + u.educationLevelCount,
        0
      ),
      universities: universitiesArray.sort(
        (a, b) => b.studentCount - a.studentCount
      ),
    };
  };

  const universityStats = getUniversityStats();

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
                    <SafetyOutlined className="text-white text-lg" />
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
                      <ReadOutlined className="text-white text-lg" />
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

          {/* Row 2: Additional Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
            {/* Card 5: Top học viên */}
            <div className="bg-white/30 dark:bg-slate-800/30 backdrop-blur-md rounded-2xl p-4 border border-white/20 dark:border-slate-700/20 shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-yellow-600 rounded-xl flex items-center justify-center shadow-lg">
                    <CrownOutlined className="text-white text-lg" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">
                      Học viên xuất sắc
                    </h3>
                    <p className="text-slate-600 dark:text-slate-400 text-xs">
                      Top 5 GPA cao nhất (GPA &gt; 3.2)
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                {topStudents.length > 0 ? (
                  topStudents.map((student, index) => {
                    const gpa =
                      parseFloat(student.GPA) ||
                      parseFloat(student.averageGrade4) ||
                      0;
                    return (
                      <div
                        key={index}
                        className="bg-white/50 dark:bg-slate-700/50 rounded-lg p-2 flex items-center justify-between hover:bg-white/70 dark:hover:bg-slate-700/70 transition-all transform hover:scale-[1.02]"
                      >
                        <div className="flex items-center space-x-3">
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shadow-md ${
                              index === 0
                                ? "bg-gradient-to-br from-yellow-400 to-amber-500 text-white animate-pulse"
                                : index === 1
                                ? "bg-gradient-to-br from-slate-300 to-slate-400 text-slate-700"
                                : index === 2
                                ? "bg-gradient-to-br from-orange-400 to-amber-600 text-white"
                                : "bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-slate-300"
                            }`}
                          >
                            {index + 1}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                              {student.studentName || "N/A"}
                            </p>
                            <p className="text-xs text-slate-600 dark:text-slate-400">
                              {student.className || "N/A"}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                            {gpa.toFixed(2)}
                          </div>
                          <p className="text-xs text-slate-600 dark:text-slate-400">
                            GPA
                          </p>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="flex flex-col items-center justify-center py-8">
                    <div className="w-20 h-20 bg-gradient-to-br from-amber-100 to-yellow-100 dark:from-amber-900/20 dark:to-yellow-900/20 rounded-full flex items-center justify-center mb-3">
                      <CrownOutlined className="text-3xl text-amber-400 dark:text-amber-500" />
                    </div>
                    <p className="text-slate-600 dark:text-slate-400 font-medium">
                      Chưa có học viên đạt tiêu chuẩn
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                      (GPA &gt; 3.2)
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Card 6: Thống kê trường và khoa/viện */}
            <Link href="/admin/universities" className="block">
              <div className="bg-white/30 dark:bg-slate-800/30 backdrop-blur-md rounded-2xl p-4 border border-white/20 dark:border-slate-700/20 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 cursor-pointer">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                      <BankOutlined className="text-white text-lg" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">
                        Cơ sở đào tạo
                      </h3>
                      <p className="text-slate-600 dark:text-slate-400 text-xs">
                        Trường, khoa/viện gửi đào tạo
                      </p>
                    </div>
                  </div>
                </div>

                {/* Tổng quan số liệu */}
                <div className="grid grid-cols-3 gap-2 mb-3">
                  <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-lg p-3 text-center border border-blue-200 dark:border-blue-800">
                    <div className="text-2xl font-black text-blue-600 dark:text-blue-400">
                      {universityStats.totalUniversities}
                    </div>
                    <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Trường
                    </p>
                  </div>
                  <div className="bg-gradient-to-br from-teal-50 to-emerald-50 dark:from-teal-900/20 dark:to-emerald-900/20 rounded-lg p-3 text-center border border-teal-200 dark:border-teal-800">
                    <div className="text-2xl font-black text-teal-600 dark:text-teal-400">
                      {universityStats.totalOrganizations}
                    </div>
                    <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Khoa/Viện
                    </p>
                  </div>
                  <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-lg p-3 text-center border border-indigo-200 dark:border-indigo-800">
                    <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400">
                      {universityStats.totalEducationLevels}
                    </div>
                    <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      CTĐT
                    </p>
                  </div>
                </div>

                {/* Danh sách trường */}
                <div className="relative">
                  <div className="space-y-2">
                    {universityStats.universities.length > 0 ? (
                      <>
                        {universityStats.universities
                          .slice(0, 3)
                          .map((university, index) => (
                            <div
                              key={index}
                              className="bg-white/50 dark:bg-slate-700/50 rounded-lg p-2 hover:bg-white/70 dark:hover:bg-slate-700/70 transition-all"
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex-1">
                                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">
                                    {university.name}
                                  </p>
                                  <p className="text-xs text-slate-600 dark:text-slate-400">
                                    {university.organizationCount} khoa/viện •{" "}
                                    {university.educationLevelCount} CTĐT
                                  </p>
                                </div>
                                <div className="text-right ml-2">
                                  <div className="text-lg font-bold text-cyan-600 dark:text-cyan-400">
                                    {university.studentCount}
                                  </div>
                                  <p className="text-xs text-slate-600 dark:text-slate-400">
                                    HV
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))}
                        {universityStats.universities.length > 3 && (
                          <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-white/80 to-transparent dark:from-slate-800/80 dark:to-transparent pointer-events-none rounded-b-lg" />
                        )}
                      </>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-8">
                        <div className="w-20 h-20 bg-gradient-to-br from-cyan-100 to-blue-100 dark:from-cyan-900/20 dark:to-blue-900/20 rounded-full flex items-center justify-center mb-3">
                          <BankOutlined className="text-3xl text-cyan-500 dark:text-cyan-400" />
                        </div>
                        <p className="text-slate-600 dark:text-slate-400 font-medium">
                          Chưa có cơ sở đào tạo
                        </p>
                      </div>
                    )}
                  </div>
                  {universityStats.universities.length > 3 && (
                    <div className="mt-2 text-center">
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                        +{universityStats.universities.length - 3} trường khác
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </Link>
          </div>

          {/* Row 3: Wide Cards */}
          <div className="grid grid-cols-1 gap-4 mt-4">
            {/* Card 7: Xu hướng học tập */}
            <div className="bg-white/30 dark:bg-slate-800/30 backdrop-blur-md rounded-2xl p-4 border border-white/20 dark:border-slate-700/20 shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-rose-500 to-pink-600 rounded-xl flex items-center justify-center shadow-lg">
                    <RiseOutlined className="text-white text-lg" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">
                      Tổng quan hiệu suất
                    </h3>
                    <p className="text-slate-600 dark:text-slate-400 text-xs">
                      Phân tích hiệu suất học tập và rèn luyện
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Hiệu suất học tập */}
                <div className="bg-white/50 dark:bg-slate-700/50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                      Hiệu suất học tập
                    </h4>
                    {learningStats.total > 0 && (
                      <div className="flex items-center space-x-1">
                        {(learningStats.excellent + learningStats.good) /
                          learningStats.total >=
                        0.5 ? (
                          <RiseOutlined className="text-green-500 text-xs" />
                        ) : (
                          <FallOutlined className="text-orange-500 text-xs" />
                        )}
                        <span
                          className={`text-xs font-bold ${
                            (learningStats.excellent + learningStats.good) /
                              learningStats.total >=
                            0.5
                              ? "text-green-500"
                              : "text-orange-500"
                          }`}
                        >
                          {(
                            ((learningStats.excellent + learningStats.good) /
                              learningStats.total) *
                            100
                          ).toFixed(0)}
                          %
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-slate-600 dark:text-slate-400">
                        Giỏi/Xuất sắc
                      </span>
                      <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                        {learningStats.excellent + learningStats.good}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-slate-600 dark:text-slate-400">
                        Khá
                      </span>
                      <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
                        {learningStats.fair}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-slate-600 dark:text-slate-400">
                        TB/Yếu
                      </span>
                      <span className="text-sm font-bold text-orange-600 dark:text-orange-400">
                        {learningStats.average + learningStats.poor}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-slate-600 dark:text-slate-400">
                        Nợ môn
                      </span>
                      <span className="text-sm font-bold text-red-600 dark:text-red-400">
                        {learningStats.debt}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Hiệu suất rèn luyện */}
                <div className="bg-white/50 dark:bg-slate-700/50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                      Hiệu suất rèn luyện
                    </h4>
                    {trainingStats.totalStudents > 0 && (
                      <div className="flex items-center space-x-1">
                        {trainingStats.good / trainingStats.totalStudents >=
                        0.5 ? (
                          <RiseOutlined className="text-green-500 text-xs" />
                        ) : (
                          <FallOutlined className="text-orange-500 text-xs" />
                        )}
                        <span
                          className={`text-xs font-bold ${
                            trainingStats.good / trainingStats.totalStudents >=
                            0.5
                              ? "text-green-500"
                              : "text-orange-500"
                          }`}
                        >
                          {(
                            (trainingStats.good / trainingStats.totalStudents) *
                            100
                          ).toFixed(0)}
                          %
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-slate-600 dark:text-slate-400">
                        Tốt
                      </span>
                      <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                        {trainingStats.good}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-slate-600 dark:text-slate-400">
                        Khá
                      </span>
                      <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
                        {trainingStats.fair}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-slate-600 dark:text-slate-400">
                        Trung bình
                      </span>
                      <span className="text-sm font-bold text-orange-600 dark:text-orange-400">
                        {trainingStats.average}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-slate-600 dark:text-slate-400">
                        Yếu
                      </span>
                      <span className="text-sm font-bold text-red-600 dark:text-red-400">
                        {trainingStats.poor}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Tỷ lệ hoàn thành */}
                <div className="bg-white/50 dark:bg-slate-700/50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                      Tỷ lệ hoàn thành
                    </h4>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs text-slate-600 dark:text-slate-400">
                          Kết quả học tập
                        </span>
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                          {learningStats.total > 0
                            ? (
                                (learningStats.total / totalStudents) *
                                100
                              ).toFixed(0)
                            : 0}
                          %
                        </span>
                      </div>
                      <div className="bg-slate-200 dark:bg-slate-600 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-emerald-500 to-teal-500 h-2 rounded-full transition-all duration-500"
                          style={{
                            width: `${
                              learningStats.total > 0
                                ? (
                                    (learningStats.total / totalStudents) *
                                    100
                                  ).toFixed(0)
                                : 0
                            }%`,
                          }}
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs text-slate-600 dark:text-slate-400">
                          Đánh giá rèn luyện
                        </span>
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                          {trainingStats.totalStudents > 0
                            ? (
                                (trainingStats.total /
                                  trainingStats.totalStudents) *
                                100
                              ).toFixed(0)
                            : 0}
                          %
                        </span>
                      </div>
                      <div className="bg-slate-200 dark:bg-slate-600 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-purple-500 to-indigo-500 h-2 rounded-full transition-all duration-500"
                          style={{
                            width: `${
                              trainingStats.totalStudents > 0
                                ? (
                                    (trainingStats.total /
                                      trainingStats.totalStudents) *
                                    100
                                  ).toFixed(0)
                                : 0
                            }%`,
                          }}
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs text-slate-600 dark:text-slate-400">
                          Cắt cơm hôm nay
                        </span>
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                          {totalStudents > 0
                            ? (
                                (((cutRice?.breakfast || 0) +
                                  (cutRice?.lunch || 0) +
                                  (cutRice?.dinner || 0)) /
                                  (totalStudents * 3)) *
                                100
                              ).toFixed(0)
                            : 0}
                          %
                        </span>
                      </div>
                      <div className="bg-slate-200 dark:bg-slate-600 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-rose-500 to-pink-500 h-2 rounded-full transition-all duration-500"
                          style={{
                            width: `${
                              totalStudents > 0
                                ? (
                                    (((cutRice?.breakfast || 0) +
                                      (cutRice?.lunch || 0) +
                                      (cutRice?.dinner || 0)) /
                                      (totalStudents * 3)) *
                                    100
                                  ).toFixed(0)
                                : 0
                            }%`,
                          }}
                        />
                      </div>
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
