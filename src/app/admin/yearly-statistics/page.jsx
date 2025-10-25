"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import Link from "next/link";
import { handleNotify } from "../../../components/notify";
import Loader from "@/components/loader";
import { useLoading } from "@/hooks";
import { BASE_URL } from "@/configs";
import {
  TreeSelect,
  ConfigProvider,
  theme,
  Input,
  Select,
  Row,
  Col,
  Card as AntCard,
  Table,
  Space,
  Button,
} from "antd";
import { useState as useThemeState } from "react";

const YearlyStatistics = () => {
  const [yearlyResults, setYearlyResults] = useState([]);
  const [schoolYears, setSchoolYears] = useState([]);
  const [selectedSchoolYear, setSelectedSchoolYear] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUnit, setSelectedUnit] = useState("all");
  const [availableUnits, setAvailableUnits] = useState([]);
  const { loading, withLoading } = useLoading(true);

  const [isDark, setIsDark] = useThemeState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentDetail, setStudentDetail] = useState(null);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [updateFormData, setUpdateFormData] = useState({
    partyRating: "",
    trainingRating: "",
    decisionNumber: "",
  });

  // Phát hiện theme hiện tại
  useEffect(() => {
    const checkTheme = () => {
      const isDarkMode = document.documentElement.classList.contains("dark");
      setIsDark(isDarkMode);
    };

    // Kiểm tra theme ban đầu
    checkTheme();

    // Theo dõi thay đổi theme
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const loadData = async () => {
      await withLoading(fetchInitialData);
    };
    loadData();
  }, [withLoading]);

  // Cleanup scroll khi component unmount
  useEffect(() => {
    return () => {
      document.body.style.overflow = "unset";
    };
  }, []);

  const fetchInitialData = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      // Gọi API để lấy dữ liệu thống kê năm học (không có tham số schoolYear)
      const res = await axios.get(`${BASE_URL}/commander/yearlyStatistics`, {
        headers: { token: `Bearer ${token}` },
      });


      // Xử lý dữ liệu từ API - đảm bảo có failedSubjects/debtCredits
      const processedData = (res.data || []).map((item) => {
        const subjects = Array.isArray(item.subjects) ? item.subjects : [];
        const failedSubjectsCalc = subjects.filter(
          (s) => s.letterGrade === "F" || s.gradePoint4 === 0
        ).length;
        const debtCreditsCalc = subjects.reduce((sum, s) => {
          const isDebt = s.letterGrade === "F" || s.gradePoint4 === 0;
          return sum + (isDebt ? s.credits || 0 : 0);
        }, 0);
        return {
          ...item,
          failedSubjects: item.failedSubjects ?? failedSubjectsCalc,
          debtCredits: item.debtCredits ?? debtCreditsCalc,
        };
      });

      // Lấy danh sách năm học từ dữ liệu
      const allSchoolYears = new Set();
      processedData.forEach((item) => {
        if (item.schoolYear && item.schoolYear !== "Tất cả") {
          allSchoolYears.add(item.schoolYear);
        }
      });

      const uniqueSchoolYears = Array.from(allSchoolYears).sort((a, b) =>
        b.localeCompare(a)
      );
      setSchoolYears(uniqueSchoolYears);

      // Set dữ liệu trực tiếp từ API
      setYearlyResults(processedData);

      // Lấy danh sách các đơn vị có sẵn từ dữ liệu
      const units = [
        ...new Set(
          processedData
            .map((item) => item.unit)
            .filter((unit) => unit && unit.trim())
        ),
      ];
      setAvailableUnits(units);

      // Mặc định chọn "Tất cả các năm"
      setSelectedSchoolYear("all");
    } catch (error) {
      setYearlyResults([]);
      setSchoolYears([]);
      setSelectedSchoolYear("");
    }
  };

  // Xử lý khi người dùng thay đổi năm học
  const handleSchoolYearChange = (newSchoolYear) => {
    setSelectedSchoolYear(newSchoolYear);

    if (newSchoolYear === "all") {
      // Nếu chọn "Tất cả các năm", gọi lại API để lấy tất cả dữ liệu
      withLoading(fetchInitialData);
      return;
    }

    // Nếu chọn năm học cụ thể, gọi API để lấy dữ liệu cho năm đó
    withLoading(() => fetchYearlyResultsForYear(newSchoolYear));
  };

  const fetchYearlyResultsForYear = async (year) => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const res = await axios.get(
        `${BASE_URL}/commander/yearlyStatistics?schoolYear=${year}`,
        {
          headers: { token: `Bearer ${token}` },
        }
      );

      // Đảm bảo có failedSubjects/debtCredits
      const normalized = (res.data || []).map((item) => {
        const subjects = Array.isArray(item.subjects) ? item.subjects : [];
        const failedSubjectsCalc = subjects.filter(
          (s) => s.letterGrade === "F" || s.gradePoint4 === 0
        ).length;
        const debtCreditsCalc = subjects.reduce((sum, s) => {
          const isDebt = s.letterGrade === "F" || s.gradePoint4 === 0;
          return sum + (isDebt ? s.credits || 0 : 0);
        }, 0);
        return {
          ...item,
          failedSubjects: item.failedSubjects ?? failedSubjectsCalc,
          debtCredits: item.debtCredits ?? debtCreditsCalc,
        };
      });
      setYearlyResults(normalized);
    } catch (error) {
      setYearlyResults([]);
    }
  };

  const fetchYearlyResults = async () => {
    const token = localStorage.getItem("token");
    if (!token || !selectedSchoolYear) return;

    try {
      let res;

      // Lấy tất cả dữ liệu thống kê năm học
      res = await axios.get(`${BASE_URL}/commander/yearlyStatistics`, {
        headers: { token: `Bearer ${token}` },
      });


      // Dữ liệu đã được xử lý từ backend, chỉ cần set
      const processedData = (res.data || []).map((item) => {
        const subjects = Array.isArray(item.subjects) ? item.subjects : [];
        const failedSubjectsCalc = subjects.filter(
          (s) => s.letterGrade === "F" || s.gradePoint4 === 0
        ).length;
        const debtCreditsCalc = subjects.reduce((sum, s) => {
          const isDebt = s.letterGrade === "F" || s.gradePoint4 === 0;
          return sum + (isDebt ? s.credits || 0 : 0);
        }, 0);
        return {
          ...item,
          failedSubjects: item.failedSubjects ?? failedSubjectsCalc,
          debtCredits: item.debtCredits ?? debtCreditsCalc,
        };
      });
      setYearlyResults(processedData);

      // Lấy danh sách các đơn vị có sẵn từ dữ liệu
      const units = [
        ...new Set(
          processedData
            .map((item) => item.unit)
            .filter((unit) => unit && unit.trim())
        ),
      ];
      setAvailableUnits(units);
    } catch (error) {
      setYearlyResults([]);
    }
  };

  // Lấy chi tiết 1 SV theo kỳ để xem
  const fetchStudentDetail = async (studentId, semester, schoolYear) => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      // Sử dụng dữ liệu đã có từ yearlyResults
      const studentData = yearlyResults.find(
        (item) => item.studentId === studentId && item.schoolYear === schoolYear
      );

      if (studentData) {
        setStudentDetail({
          ...studentData,
          totalCredits: studentData.totalCredits || 0,
          yearlyGPA: parseFloat(studentData.yearlyGPA) || 0,
          yearlyGrade10: parseFloat(studentData.yearlyGrade10) || 0,
          cumulativeGPA: parseFloat(studentData.cumulativeGPA) || 0,
          cumulativeGrade10: parseFloat(studentData.cumulativeGrade10) || 0,
          cumulativeCredit: parseFloat(studentData.cumulativeCredit) || 0,
          subjects: studentData.subjects || [],
          partyRating: studentData.partyRating,
          trainingRating: studentData.trainingRating,
          academicStatus: studentData.academicStatus,
        });
      } else {
        // Fallback: gọi API nếu không tìm thấy dữ liệu
        const res = await axios.get(
          `${BASE_URL}/grade/student/${studentId}/${semester}/${schoolYear}`,
          { headers: { token: `Bearer ${token}` } }
        );

        const data = res.data;
        if (data && data.subjects) {
          setStudentDetail({
            ...data,
            totalCredits:
              data.totalCredits ||
              data.subjects.reduce((sum, sub) => sum + (sub.credits || 0), 0),
            yearlyGPA:
              data.yearlyGPA ||
              data.subjects.reduce(
                (sum, sub) => sum + (sub.gradePoint4 || 0),
                0
              ) / data.subjects.length,
            yearlyGrade10:
              data.yearlyGrade10 ||
              data.subjects.reduce(
                (sum, sub) => sum + (sub.gradePoint10 || 0),
                0
              ) / data.subjects.length,
          });
        } else {
          setStudentDetail(data);
        }
      }
    } catch (error) {
      handleNotify("error", "Lỗi", "Không thể tải chi tiết điểm của sinh viên");
    }
  };

  const handleViewDetail = async (row) => {
    setSelectedStudent(row);
    setShowDetailModal(true);
    // Ngăn scroll body khi modal mở
    document.body.style.overflow = "hidden";
    await fetchStudentDetail(row.studentId, row.semesterCount, row.schoolYear);
  };

  const handleUpdateRating = (row) => {
    setSelectedStudent(row);
    setUpdateFormData({
      partyRating: row.partyRating?.rating || "",
      trainingRating: row.trainingRating || "",
      decisionNumber: row.partyRating?.decisionNumber || "",
    });
    setShowUpdateModal(true);
    // Ngăn scroll body khi modal mở
    document.body.style.overflow = "hidden";
  };

  const handleSubmitUpdate = async () => {
    const token = localStorage.getItem("token");
    if (!token || !selectedStudent) return;

    try {
      // Sử dụng yearlyResultId từ dữ liệu API
      const yearlyResultId = selectedStudent.yearlyResultId;

      if (!yearlyResultId) {
        handleNotify("danger", "Lỗi!", "Không tìm thấy kết quả năm học");
        return;
      }

      const response = await axios.put(
        `${BASE_URL}/commander/updateStudentRating/${yearlyResultId}`,
        {
          partyRating: updateFormData.partyRating,
          trainingRating: updateFormData.trainingRating,
          decisionNumber: updateFormData.decisionNumber,
          studentId: selectedStudent.studentId,
        },
        {
          headers: { token: `Bearer ${token}` },
        }
      );

      if (response.status === 200) {
        handleNotify("success", "Thành công", "Cập nhật xếp loại thành công");
        setShowUpdateModal(false);
        // Refresh data
        if (selectedSchoolYear === "all") {
          withLoading(fetchInitialData);
        } else {
          withLoading(() => fetchYearlyResultsForYear(selectedSchoolYear));
        }
      }
    } catch (error) {
      handleNotify("error", "Lỗi", "Không thể cập nhật xếp loại");
    }
  };

  // Tạo options cho Select năm học
  const schoolYearOptions = [
    { label: "Tất cả các năm", value: "all" },
    ...schoolYears.map((year) => ({
      label: `Năm học ${year}`,
      value: year,
    })),
  ];

  const getFilteredResults = () => {
    if (!yearlyResults) return [];

    let filtered = yearlyResults.filter((item) => {
      const matchesSearch =
        searchTerm === "" ||
        item.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.studentCode?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesUnit =
        selectedUnit === "all" ||
        item.unit === selectedUnit ||
        item.className === selectedUnit;

      return matchesSearch && matchesUnit;
    });

    // Sắp xếp theo thứ tự: năm học → đơn vị → tên
    return filtered.sort((a, b) => {
      // 1. Sắp xếp theo năm học (mới nhất trước)
      if (a.schoolYear !== b.schoolYear) {
        return b.schoolYear.localeCompare(a.schoolYear);
      }

      // 2. Trong cùng năm học, sắp xếp theo đơn vị từ L1-H5 đến L6-H5
      const unitOrder = {
        "L1 - H5": 1,
        "L2 - H5": 2,
        "L3 - H5": 3,
        "L4 - H5": 4,
        "L5 - H5": 5,
        "L6 - H5": 6,
      };
      const unitA = unitOrder[a.unit] || 999;
      const unitB = unitOrder[b.unit] || 999;
      if (unitA !== unitB) return unitA - unitB;

      // 3. Trong cùng đơn vị, sắp xếp theo tên học viên A-Z
      return a.fullName.localeCompare(b.fullName, "vi");
    });
  };

  // Đếm số sinh viên có điểm F
  const getStudentsWithFGrade = () => {
    return getFilteredResults().filter((item) => {
      // Kiểm tra nếu có subjects và có ít nhất 1 môn có điểm F
      return (
        item.subjects &&
        item.subjects.some(
          (subject) => subject.letterGrade === "F" || subject.gradePoint4 === 0
        )
      );
    }).length;
  };

  // Tính tổng GPA trung bình của năm học
  const getAverageYearlyGPA = () => {
    const results = getFilteredResults();
    if (results.length === 0) return 0;

    const totalGPA = results.reduce((sum, item) => {
      return sum + (parseFloat(item.yearlyGPA) || 0);
    }, 0);

    return (totalGPA / results.length).toFixed(2);
  };

  if (loading) {
    return <Loader text="Đang tải dữ liệu thống kê năm học..." />;
  }

  return (
    <>
      <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="flex-1 mx-6">
          <div className="w-full pt-20 px-4 md:px-6">
            <nav className="flex" aria-label="Breadcrumb">
              <ol className="inline-flex items-center space-x-1 md:space-x-2 rtl:space-x-reverse">
                <li className="inline-flex items-center">
                  <Link
                    href="/admin"
                    className="inline-flex items-center text-sm font-medium text-gray-700 hover:text-blue-600 dark:text-gray-400 dark:hover:text-white"
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
                    <div className="ms-1 text-sm font-medium text-gray-500 dark:text-gray-400">
                      Thống kê theo năm
                    </div>
                  </div>
                </li>
              </ol>
            </nav>
          </div>

          <div className="w-full pt-8 pb-5 mb-5">
            <div className="bg-white dark:bg-gray-800 rounded-lg w-full shadow-lg">
              <div className="font-bold p-4 md:p-5 flex flex-col md:flex-row justify-between md:items-center gap-3 border-b border-gray-200 dark:border-gray-700">
                <div className="text-gray-900 dark:text-white">
                  <h1 className="text-xl md:text-2xl font-bold">
                    THỐNG KÊ KẾT QUẢ HỌC TẬP THEO NĂM
                  </h1>
                  <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Quản lý và xem kết quả học tập của tất cả học viên
                  </p>
                </div>
                {/* <div className="flex gap-2">
                  <button
                    className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 border border-blue-600 hover:border-blue-700 rounded-lg transition-colors duration-200 flex items-center"
                    onClick={handleExportPDF}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth="1.5"
                      stroke="currentColor"
                      className="w-4 h-4 mr-2"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3"
                      />
                    </svg>
                    Xuất PDF
                  </button>
                </div> */}
              </div>

              <div className="w-full p-4 md:p-5">
                <div className="mb-4">
                  <Row gutter={[12, 12]} align="bottom">
                    <Col xs={24} sm={12} md={8} lg={6}>
                      <label
                        htmlFor="schoolYear"
                        className="block mb-1 text-xs md:text-sm font-medium text-gray-700 dark:text-gray-300"
                      >
                        Chọn năm học
                      </label>
                      <ConfigProvider
                        theme={{
                          algorithm: isDark
                            ? theme.darkAlgorithm
                            : theme.defaultAlgorithm,
                          token: {
                            colorPrimary: "#2563eb",
                            borderRadius: 8,
                            controlOutline: "rgba(37,99,235,0.2)",
                          },
                        }}
                      >
                        <Select
                          value={selectedSchoolYear}
                          onChange={handleSchoolYearChange}
                          placeholder="Chọn năm học"
                          style={{ width: "100%", height: 36 }}
                          options={schoolYearOptions}
                        />
                      </ConfigProvider>
                    </Col>

                    <Col xs={24} sm={12} md={8} lg={6}>
                      <label className="block mb-1 text-xs md:text-sm font-medium text-gray-700 dark:text-gray-300">
                        Đơn vị
                      </label>
                      <ConfigProvider
                        theme={{
                          algorithm: isDark
                            ? theme.darkAlgorithm
                            : theme.defaultAlgorithm,
                          token: {
                            colorPrimary: "#2563eb",
                            borderRadius: 8,
                            controlOutline: "rgba(37,99,235,0.2)",
                          },
                        }}
                      >
                        <Select
                          value={selectedUnit}
                          onChange={setSelectedUnit}
                          style={{ width: "100%", height: 36 }}
                          options={[
                            { value: "all", label: "Tất cả đơn vị" },
                            { value: "L1 - H5", label: "L1 - H5" },
                            { value: "L2 - H5", label: "L2 - H5" },
                            { value: "L3 - H5", label: "L3 - H5" },
                            { value: "L4 - H5", label: "L4 - H5" },
                            { value: "L5 - H5", label: "L5 - H5" },
                            { value: "L6 - H5", label: "L6 - H5" },
                          ]}
                        />
                      </ConfigProvider>
                    </Col>
                    <Col xs={24} sm={12} md={8} lg={6}>
                      <label className="block mb-1 text-xs md:text-sm font-medium text-gray-700 dark:text-gray-300">
                        Tìm kiếm
                      </label>
                      <input
                        size="small"
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Tên hoặc mã sinh viên..."
                        className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block px-3"
                        style={{ height: 36 }}
                      />
                    </Col>
                    <Col xs={12} sm={6} md={4} lg={3}>
                      <button
                        onClick={() => {
                          setSearchTerm("");
                          setSelectedUnit("all");
                          setSelectedSchoolYear("all");
                          withLoading(fetchInitialData);
                        }}
                        className="w-full h-9 bg-gray-500 hover:bg-gray-600 text-white font-medium rounded-lg text-xs md:text-sm px-2 md:px-4 transition-colors duration-200"
                      >
                        Xóa bộ lọc
                      </button>
                    </Col>
                    <Col xs={12} sm={6} md={4} lg={3}>
                      <Link
                        href="/admin/semester-management"
                        className="w-full h-9 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg text-xs md:text-sm px-2 md:px-4 transition-colors duration-200 flex items-center justify-center"
                      >
                        <svg
                          className="w-4 h-4 mr-1 md:mr-2"
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
                        <span className="hidden md:inline">Quản lý học kỳ</span>
                        <span className="md:hidden">Học kỳ</span>
                      </Link>
                    </Col>
                  </Row>
                </div>

                {/* Thống kê tổng quan */}
                {!loading && yearlyResults.length > 0 && (
                  <Row gutter={[12, 12]} className="mb-6">
                    <Col
                      xs={12}
                      sm={8}
                      md={6}
                      lg={selectedSchoolYear === "all" ? 6 : 4}
                    >
                      <div className="bg-blue-50 dark:bg-blue-900/20 p-3 md:p-4 rounded-lg h-full">
                        <div className="text-xl md:text-2xl font-bold text-blue-600 dark:text-blue-400">
                          {getFilteredResults().length}
                        </div>
                        <div className="text-xs md:text-sm text-gray-600 dark:text-gray-400">
                          {selectedSchoolYear === "all"
                            ? "Tổng số kết quả"
                            : "Tổng số sinh viên"}
                        </div>
                      </div>
                    </Col>
                    <Col
                      xs={12}
                      sm={8}
                      md={6}
                      lg={selectedSchoolYear === "all" ? 6 : 4}
                    >
                      <div className="bg-green-50 dark:bg-green-900/20 p-3 md:p-4 rounded-lg h-full">
                        <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                          {(() => {
                            const results = getFilteredResults();
                            if (results.length === 0) return "0.00";

                            const totalGPA = results.reduce((sum, item) => {
                              return sum + (parseFloat(item.yearlyGPA) || 0);
                            }, 0);

                            return (totalGPA / results.length).toFixed(2);
                          })()}
                        </div>
                        <div className="text-xs md:text-sm text-gray-600 dark:text-gray-400">
                          {selectedSchoolYear === "all"
                            ? "GPA trung bình tất cả năm"
                            : "GPA trung bình năm"}
                        </div>
                      </div>
                    </Col>

                    {/* CPA >= 3.2 */}
                    {selectedSchoolYear !== "all" && (
                      <Col xs={12} sm={8} md={6} lg={4}>
                        <div className="bg-teal-50 dark:bg-teal-900/20 p-3 md:p-4 rounded-lg h-full">
                          {(() => {
                            const results = getFilteredResults();
                            if (results.length === 0)
                              return (
                                <div className="text-sm font-bold text-teal-600 dark:text-teal-400 flex items-center justify-center h-8">
                                  Không có dữ liệu
                                </div>
                              );

                            const uniqueStudents = new Set();
                            const cpaGoodStudents = new Set(); // CPA >= 3.2

                            results.forEach((item) => {
                              const studentKey = `${item.studentId}-${item.schoolYear}`;
                              if (!uniqueStudents.has(studentKey)) {
                                uniqueStudents.add(studentKey);
                                const cpa = parseFloat(item.cumulativeGPA) || 0;
                                if (cpa >= 3.2) {
                                  cpaGoodStudents.add(item.studentId);
                                }
                              }
                            });

                            const totalUnique = uniqueStudents.size;
                            const cpaGoodCount = cpaGoodStudents.size;

                            return (
                              <div className="text-xl md:text-2xl font-bold text-teal-600 dark:text-teal-400">
                                {cpaGoodCount}/{totalUnique}
                              </div>
                            );
                          })()}
                          <div className="text-xs md:text-sm text-gray-600 dark:text-gray-400">
                            CPA ≥3.2
                          </div>
                        </div>
                      </Col>
                    )}
                    {/* Xuất sắc - GPA >= 3.6 */}
                    {selectedSchoolYear !== "all" && (
                      <Col xs={12} sm={8} md={6} lg={4}>
                        <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 md:p-4 rounded-lg h-full">
                          {(() => {
                            const results = getFilteredResults();
                            if (results.length === 0)
                              return (
                                <div className="text-sm font-bold text-yellow-600 dark:text-yellow-400 flex items-center justify-center h-8">
                                  Không có dữ liệu
                                </div>
                              );

                            const uniqueStudents = new Set();
                            const excellentStudents = new Set(); // GPA >= 3.6

                            results.forEach((item) => {
                              const studentKey = `${item.studentId}-${item.schoolYear}`;
                              if (!uniqueStudents.has(studentKey)) {
                                uniqueStudents.add(studentKey);
                                const gpa = parseFloat(item.yearlyGPA) || 0;
                                if (gpa >= 3.6) {
                                  excellentStudents.add(item.studentId);
                                }
                              }
                            });

                            const totalUnique = uniqueStudents.size;
                            const excellentCount = excellentStudents.size;

                            return (
                              <div className="text-xl md:text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                                {excellentCount}/{totalUnique}
                              </div>
                            );
                          })()}
                          <div className="text-xs md:text-sm text-gray-600 dark:text-gray-400">
                            Xuất sắc (≥3.6)
                          </div>
                        </div>
                      </Col>
                    )}

                    {/* Giỏi - GPA >= 3.2 */}
                    {selectedSchoolYear !== "all" && (
                      <Col xs={12} sm={8} md={6} lg={4}>
                        <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 md:p-4 rounded-lg h-full">
                          {(() => {
                            const results = getFilteredResults();
                            if (results.length === 0)
                              return (
                                <div className="text-sm font-bold text-yellow-600 dark:text-yellow-400 flex items-center justify-center h-8">
                                  Không có dữ liệu
                                </div>
                              );

                            const uniqueStudents = new Set();
                            const goodStudents = new Set(); // GPA >= 3.2

                            results.forEach((item) => {
                              const studentKey = `${item.studentId}-${item.schoolYear}`;
                              if (!uniqueStudents.has(studentKey)) {
                                uniqueStudents.add(studentKey);
                                const gpa = parseFloat(item.yearlyGPA) || 0;
                                if (gpa >= 3.2) {
                                  goodStudents.add(item.studentId);
                                }
                              }
                            });

                            const totalUnique = uniqueStudents.size;
                            const goodCount = goodStudents.size;

                            return (
                              <div className="text-xl md:text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                                {goodCount}/{totalUnique}
                              </div>
                            );
                          })()}
                          <div className="text-xs md:text-sm text-gray-600 dark:text-gray-400">
                            Giỏi (≥3.2)
                          </div>
                        </div>
                      </Col>
                    )}

                    {/* Khá - GPA >= 2.5 */}
                    {selectedSchoolYear !== "all" && (
                      <Col xs={12} sm={8} md={6} lg={4}>
                        <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 md:p-4 rounded-lg h-full">
                          {(() => {
                            const results = getFilteredResults();
                            if (results.length === 0)
                              return (
                                <div className="text-sm font-bold text-yellow-600 dark:text-yellow-400 flex items-center justify-center h-8">
                                  Không có dữ liệu
                                </div>
                              );

                            const uniqueStudents = new Set();
                            const averageStudents = new Set(); // GPA >= 2.5

                            results.forEach((item) => {
                              const studentKey = `${item.studentId}-${item.schoolYear}`;
                              if (!uniqueStudents.has(studentKey)) {
                                uniqueStudents.add(studentKey);
                                const gpa = parseFloat(item.yearlyGPA) || 0;
                                if (gpa >= 2.5) {
                                  averageStudents.add(item.studentId);
                                }
                              }
                            });

                            const totalUnique = uniqueStudents.size;
                            const averageCount = averageStudents.size;

                            return (
                              <div className="text-xl md:text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                                {averageCount}/{totalUnique}
                              </div>
                            );
                          })()}
                          <div className="text-xs md:text-sm text-gray-600 dark:text-gray-400">
                            Khá (≥2.5)
                          </div>
                        </div>
                      </Col>
                    )}

                    {/* Tổng tín chỉ tất cả năm (khi chọn "all") */}
                    {selectedSchoolYear === "all" && (
                      <Col xs={12} sm={8} md={6} lg={6}>
                        <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 md:p-4 rounded-lg h-full">
                          {(() => {
                            const results = getFilteredResults();
                            const totalCredits = results.reduce(
                              (sum, item) => sum + (item.totalCredits || 0),
                              0
                            );
                            return (
                              <div className="text-xl md:text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                                {totalCredits}
                              </div>
                            );
                          })()}
                          <div className="text-xs md:text-sm text-gray-600 dark:text-gray-400">
                            Tổng tín chỉ tất cả năm
                          </div>
                        </div>
                      </Col>
                    )}
                    <Col
                      xs={12}
                      sm={8}
                      md={6}
                      lg={selectedSchoolYear === "all" ? 6 : 4}
                    >
                      <div className="bg-red-50 dark:bg-red-900/20 p-3 md:p-4 rounded-lg h-full">
                        <div className="text-xl md:text-2xl font-bold text-red-600 dark:text-red-400">
                          {selectedSchoolYear === "all"
                            ? getFilteredResults().reduce(
                                (sum, item) => sum + (item.debtCredits || 0),
                                0
                              )
                            : getFilteredResults().reduce(
                                (sum, item) => sum + (item.failedSubjects || 0),
                                0
                              )}
                        </div>
                        <div className="text-xs md:text-sm text-gray-600 dark:text-gray-400">
                          {selectedSchoolYear === "all"
                            ? "Tổng tín chỉ nợ tất cả năm"
                            : "Tổng số môn nợ năm"}
                        </div>
                      </div>
                    </Col>
                    {selectedSchoolYear !== "all" && (
                      <Col xs={12} sm={8} md={6} lg={4}>
                        <div className="bg-purple-50 dark:bg-purple-900/20 p-3 md:p-4 rounded-lg h-full">
                          {(() => {
                            const results = getFilteredResults();
                            if (results.length === 0)
                              return (
                                <div className="text-sm font-bold text-purple-600 dark:text-purple-400 flex items-center justify-center h-8">
                                  Không có dữ liệu
                                </div>
                              );

                            // Đếm số sinh viên có rèn luyện tốt
                            const uniqueStudents = new Set();
                            const goodTrainingStudents = new Set();

                            results.forEach((item) => {
                              const studentKey = `${item.studentId}-${item.schoolYear}`;
                              if (!uniqueStudents.has(studentKey)) {
                                uniqueStudents.add(studentKey);
                                if (item.trainingRating === "Tốt") {
                                  goodTrainingStudents.add(item.studentId);
                                }
                              }
                            });

                            const totalUnique = uniqueStudents.size;
                            const displayText = `${goodTrainingStudents.size}/${totalUnique}`;

                            return (
                              <div className="text-xl md:text-2xl font-bold text-purple-600 dark:text-purple-400">
                                {displayText}
                              </div>
                            );
                          })()}
                          <div className="text-xs md:text-sm text-gray-600 dark:text-gray-400">
                            Rèn luyện tốt
                          </div>
                        </div>
                      </Col>
                    )}
                    {selectedSchoolYear !== "all" && (
                      <Col xs={12} sm={8} md={6} lg={4}>
                        <div className="bg-orange-50 dark:bg-orange-900/20 p-3 md:p-4 rounded-lg h-full">
                          {(() => {
                            const results = getFilteredResults();
                            if (results.length === 0)
                              return (
                                <div className="text-sm font-bold text-orange-600 dark:text-orange-400 flex items-center justify-center h-8">
                                  Không có dữ liệu
                                </div>
                              );

                            // Đếm số Đảng viên và không phải Đảng viên (unique students)
                            const uniqueStudents = new Set();
                            const partyMembers = new Set();
                            const nonPartyMembers = new Set();

                            results.forEach((item) => {
                              const studentKey = `${item.studentId}-${item.schoolYear}`;
                              if (!uniqueStudents.has(studentKey)) {
                                uniqueStudents.add(studentKey);
                                if (item.positionParty !== "Không") {
                                  partyMembers.add(item.studentId);
                                } else {
                                  nonPartyMembers.add(item.studentId);
                                }
                              }
                            });

                            const totalUnique =
                              partyMembers.size + nonPartyMembers.size;
                            const displayText = `${partyMembers.size}/${totalUnique}`;

                            return (
                              <div className="text-xl md:text-2xl font-bold text-orange-600 dark:text-orange-400">
                                {displayText}
                              </div>
                            );
                          })()}
                          <div className="text-xs md:text-sm text-gray-600 dark:text-gray-400">
                            Đảng viên
                          </div>
                        </div>
                      </Col>
                    )}

                    {/* HTXSNV - Học bổng xuất sắc nghiệp vụ */}
                    {selectedSchoolYear !== "all" && (
                      <Col xs={12} sm={8} md={6} lg={4}>
                        <div className="bg-green-50 dark:bg-green-900/20 p-3 md:p-4 rounded-lg h-full">
                          {(() => {
                            const results = getFilteredResults();
                            if (results.length === 0)
                              return (
                                <div className="text-sm font-bold text-green-600 dark:text-green-400 flex items-center justify-center h-8">
                                  Không có dữ liệu
                                </div>
                              );

                            const partyMembers = new Set();
                            const htxsnvStudents = new Set();

                            results.forEach((item) => {
                              const studentKey = `${item.studentId}-${item.schoolYear}`;
                              if (item.positionParty !== "Không") {
                                partyMembers.add(studentKey);
                                if (item.partyRating?.rating === "HTXSNV") {
                                  htxsnvStudents.add(item.studentId);
                                }
                              }
                            });

                            const totalPartyMembers = partyMembers.size;
                            const htxsnvCount = htxsnvStudents.size;

                            return (
                              <div className="text-xl md:text-2xl font-bold text-green-600 dark:text-green-400">
                                {htxsnvCount}/{totalPartyMembers}
                              </div>
                            );
                          })()}
                          <div className="text-xs md:text-sm text-gray-600 dark:text-gray-400">
                            HTXSNV
                          </div>
                        </div>
                      </Col>
                    )}

                    {/* HTTNV - Học bổng tài năng nghiệp vụ */}
                    {selectedSchoolYear !== "all" && (
                      <Col xs={12} sm={8} md={6} lg={4}>
                        <div className="bg-blue-50 dark:bg-blue-900/20 p-3 md:p-4 rounded-lg h-full">
                          {(() => {
                            const results = getFilteredResults();
                            if (results.length === 0)
                              return (
                                <div className="text-sm font-bold text-blue-600 dark:text-blue-400 flex items-center justify-center h-8">
                                  Không có dữ liệu
                                </div>
                              );

                            const partyMembers = new Set();
                            const httnvStudents = new Set();

                            results.forEach((item) => {
                              const studentKey = `${item.studentId}-${item.schoolYear}`;
                              if (item.positionParty !== "Không") {
                                partyMembers.add(studentKey);
                                if (item.partyRating?.rating === "HTTNV") {
                                  httnvStudents.add(item.studentId);
                                }
                              }
                            });

                            const totalPartyMembers = partyMembers.size;
                            const httnvCount = httnvStudents.size;

                            return (
                              <div className="text-xl md:text-2xl font-bold text-blue-600 dark:text-blue-400">
                                {httnvCount}/{totalPartyMembers}
                              </div>
                            );
                          })()}
                          <div className="text-xs md:text-sm text-gray-600 dark:text-gray-400">
                            HTTNV
                          </div>
                        </div>
                      </Col>
                    )}

                    {/* HTNV - Học bổng nghiệp vụ */}
                    {selectedSchoolYear !== "all" && (
                      <Col xs={12} sm={8} md={6} lg={4}>
                        <div className="bg-indigo-50 dark:bg-indigo-900/20 p-3 md:p-4 rounded-lg h-full">
                          {(() => {
                            const results = getFilteredResults();
                            if (results.length === 0)
                              return (
                                <div className="text-sm font-bold text-indigo-600 dark:text-indigo-400 flex items-center justify-center h-8">
                                  Không có dữ liệu
                                </div>
                              );

                            const partyMembers = new Set();
                            const htnvStudents = new Set();

                            results.forEach((item) => {
                              const studentKey = `${item.studentId}-${item.schoolYear}`;
                              if (item.positionParty !== "Không") {
                                partyMembers.add(studentKey);
                                if (item.partyRating?.rating === "HTNV") {
                                  htnvStudents.add(item.studentId);
                                }
                              }
                            });

                            const totalPartyMembers = partyMembers.size;
                            const htnvCount = htnvStudents.size;

                            return (
                              <div className="text-xl md:text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                                {htnvCount}/{totalPartyMembers}
                              </div>
                            );
                          })()}
                          <div className="text-xs md:text-sm text-gray-600 dark:text-gray-400">
                            HTNV
                          </div>
                        </div>
                      </Col>
                    )}
                  </Row>
                )}

                <div className="overflow-x-auto -mx-4 md:mx-0 shadow-md rounded-lg">
                  <div className="inline-block min-w-full align-middle">
                    <div className="overflow-hidden">
                      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 border border-gray-200 dark:border-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-700 sticky top-0 z-10">
                          <tr>
                            <th className="px-3 md:px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider border-r border-gray-200 dark:border-gray-600 whitespace-nowrap">
                              ĐƠN VỊ
                            </th>
                            <th className="px-3 md:px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider border-r border-gray-200 dark:border-gray-600 whitespace-nowrap">
                              HỌ VÀ TÊN
                            </th>
                            <th className="px-3 md:px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider border-r border-gray-200 dark:border-gray-600 whitespace-nowrap">
                              NĂM HỌC
                            </th>
                            <th className="px-3 md:px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider border-r border-gray-200 dark:border-gray-600 whitespace-nowrap">
                              GPA
                            </th>
                            <th className="px-3 md:px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider border-r border-gray-200 dark:border-gray-600 whitespace-nowrap">
                              CPA
                            </th>
                            <th className="px-3 md:px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider border-r border-gray-200 dark:border-gray-600 whitespace-nowrap">
                              TÍN CHỈ
                            </th>
                            <th className="px-3 md:px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider border-r border-gray-200 dark:border-gray-600 whitespace-nowrap">
                              MÔN NỢ
                            </th>
                            <th className="px-3 md:px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider whitespace-nowrap">
                              THAO TÁC
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                          {getFilteredResults().length > 0 ? (
                            getFilteredResults().map((item) => (
                              <tr
                                key={`${item.id}-${item.schoolYear}`}
                                className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                                onClick={() => handleViewDetail(item)}
                              >
                                <td className="px-3 md:px-6 py-3 md:py-4 whitespace-nowrap text-xs md:text-sm text-gray-900 dark:text-white border-r border-gray-200 dark:border-gray-600 text-center">
                                  {item.unit || "Chưa có đơn vị"}
                                </td>
                                <td className="px-3 md:px-6 py-3 md:py-4 whitespace-nowrap text-xs md:text-sm text-gray-900 dark:text-white border-r border-gray-200 dark:border-gray-600 text-center">
                                  <div>
                                    <div className="font-medium text-xs md:text-sm">
                                      {item.fullName}
                                    </div>
                                    <div className="text-[10px] md:text-xs text-gray-500">
                                      Mã: {item.studentCode || "N/A"}
                                    </div>
                                    <div className="text-[10px] md:text-xs text-gray-500">
                                      {item.className || "N/A"}
                                    </div>
                                  </div>
                                </td>
                                <td className="px-3 md:px-6 py-3 md:py-4 whitespace-nowrap text-xs md:text-sm text-gray-900 dark:text-white border-r border-gray-200 dark:border-gray-600 text-center">
                                  <div>
                                    <div className="font-medium text-xs md:text-sm">
                                      {item.schoolYear}
                                    </div>
                                    <div className="text-[10px] md:text-xs text-gray-500">
                                      {item.semesterCount || 0} HK
                                    </div>
                                  </div>
                                </td>
                                <td className="px-3 md:px-6 py-3 md:py-4 whitespace-nowrap text-xs md:text-sm text-gray-900 dark:text-white border-r border-gray-200 dark:border-gray-600 text-center">
                                  <div className="font-medium text-xs md:text-sm text-blue-600 dark:text-blue-400">
                                    {item.yearlyGPA &&
                                    !isNaN(parseFloat(item.yearlyGPA))
                                      ? parseFloat(item.yearlyGPA).toFixed(2)
                                      : "0.00"}
                                  </div>
                                  <div className="text-[10px] md:text-xs text-purple-600 dark:text-purple-400">
                                    {item.yearlyGrade10 &&
                                    !isNaN(parseFloat(item.yearlyGrade10))
                                      ? parseFloat(item.yearlyGrade10).toFixed(
                                          2
                                        )
                                      : "0.00"}
                                  </div>
                                </td>
                                <td className="px-3 md:px-6 py-3 md:py-4 whitespace-nowrap text-xs md:text-sm text-gray-900 dark:text-white border-r border-gray-200 dark:border-gray-600 text-center">
                                  <div className="flex flex-col">
                                    <div className="font-medium text-xs md:text-sm text-green-600 dark:text-green-400">
                                      {item.cumulativeGPA &&
                                      !isNaN(parseFloat(item.cumulativeGPA))
                                        ? parseFloat(
                                            item.cumulativeGPA
                                          ).toFixed(2)
                                        : item.cumulativeGrade4 &&
                                          !isNaN(
                                            parseFloat(item.cumulativeGrade4)
                                          )
                                        ? parseFloat(
                                            item.cumulativeGrade4
                                          ).toFixed(2)
                                        : "N/A"}
                                    </div>
                                    <div className="text-[10px] md:text-xs text-gray-500 dark:text-gray-400">
                                      {item.cumulativeGrade10 &&
                                      !isNaN(parseFloat(item.cumulativeGrade10))
                                        ? parseFloat(
                                            item.cumulativeGrade10
                                          ).toFixed(2)
                                        : "0.00"}
                                    </div>
                                  </div>
                                </td>
                                <td className="px-3 md:px-6 py-3 md:py-4 whitespace-nowrap text-xs md:text-sm text-gray-900 dark:text-white border-r border-gray-200 dark:border-gray-600 text-center">
                                  <div className="font-medium text-xs md:text-sm">
                                    {item.totalCredits || 0}
                                  </div>
                                  <div className="text-[10px] md:text-xs text-gray-500 dark:text-gray-400">
                                    Năm {item.studentLevel || 1}
                                  </div>
                                </td>
                                <td className="px-3 md:px-6 py-3 md:py-4 whitespace-nowrap text-xs md:text-sm text-gray-900 dark:text-white border-r border-gray-200 dark:border-gray-600 text-center">
                                  <div className="font-medium text-xs md:text-sm text-red-600 dark:text-red-400">
                                    {item.failedSubjects || 0}
                                  </div>
                                  <div className="text-[10px] md:text-xs text-gray-500 dark:text-gray-400">
                                    TC: {item.debtCredits || 0}
                                  </div>
                                </td>
                                <td className="px-3 md:px-6 py-3 md:py-4 whitespace-nowrap text-xs md:text-sm text-gray-900 dark:text-white text-center">
                                  <div className="flex justify-center space-x-1 md:space-x-2">
                                    <button
                                      className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300 p-1"
                                      title="Xem chi tiết"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleViewDetail(item);
                                      }}
                                    >
                                      <svg
                                        className="w-3 h-3 md:w-4 md:h-4"
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
                                    <button
                                      className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 p-1"
                                      title="Cập nhật xếp loại"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleUpdateRating(item);
                                      }}
                                    >
                                      <svg
                                        className="w-3 h-3 md:w-4 md:h-4"
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
                                  </div>
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td
                                colSpan="8"
                                className="text-center py-6 md:py-8 text-gray-500 dark:text-gray-400"
                              >
                                <div className="flex flex-col items-center">
                                  <svg
                                    className="w-8 h-8 md:w-12 md:h-12 mb-2 md:mb-4 text-gray-300 dark:text-gray-600"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                    xmlns="http://www.w3.org/2000/svg"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth="2"
                                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                    />
                                  </svg>
                                  <p className="text-sm md:text-lg font-medium">
                                    Không có dữ liệu
                                  </p>
                                  <p className="text-xs md:text-sm">
                                    Không tìm thấy kết quả
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
        </div>
      </div>

      {/* Modal chi tiết điểm */}
      {showDetailModal && selectedStudent && (
        <div className="fixed inset-0 flex items-center justify-center z-50 mt-14 p-4">
          <div className="bg-black bg-opacity-50 inset-0 fixed"></div>
          <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden mx-auto">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Chi tiết điểm năm học {selectedStudent.schoolYear} -{" "}
                {selectedStudent.fullName} ({selectedStudent.studentCode})
              </h2>
              <button
                onClick={() => {
                  setShowDetailModal(false);
                  setSelectedStudent(null);
                  setStudentDetail(null);
                  // Khôi phục scroll body khi đóng modal
                  document.body.style.overflow = "unset";
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
              {studentDetail ? (
                <>
                  {/* Thông tin tổng quan */}
                  <div className="grid grid-cols-1 md:grid-cols-7 gap-4 mb-6">
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                        {studentDetail.totalCredits || 0}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        Tổng tín chỉ
                      </div>
                    </div>
                    <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                      <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                        {studentDetail.yearlyGPA?.toFixed(2) || "0.00"}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        GPA năm học (Hệ 4)
                      </div>
                    </div>
                    <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
                      <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                        {studentDetail.yearlyGrade10?.toFixed(2) || "0.00"}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        GPA năm học (Hệ 10)
                      </div>
                    </div>
                    <div className="bg-emerald-50 dark:bg-emerald-900/20 p-4 rounded-lg">
                      <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                        {studentDetail.cumulativeGPA?.toFixed(2) ||
                          studentDetail.cumulativeGrade4?.toFixed(2) ||
                          "Chưa có điểm"}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        CPA tích lũy (Hệ 4)
                      </div>
                    </div>
                    <div className="bg-teal-50 dark:bg-teal-900/20 p-4 rounded-lg">
                      <div className="text-2xl font-bold text-teal-600 dark:text-teal-400">
                        {studentDetail.cumulativeGrade10?.toFixed(2) || "0.00"}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        CPA tích lũy (Hệ 10)
                      </div>
                    </div>
                    <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg">
                      <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                        {studentDetail.subjects?.length || 0}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        Số môn học
                      </div>
                    </div>
                    <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
                      {(() => {
                        const positionParty = studentDetail.positionParty;
                        const partyRating = studentDetail.partyRating;
                        const displayText =
                          positionParty === "Không"
                            ? "Chưa là Đảng viên"
                            : partyRating?.rating || "Chưa cập nhật";
                        const isSmallText =
                          displayText === "Chưa cập nhật" ||
                          displayText === "Chưa là Đảng viên";

                        return (
                          <div
                            className={`${
                              isSmallText
                                ? "text-sm font-bold"
                                : "text-2xl font-bold"
                            } text-red-600  mb-1 dark:text-red-400 flex items-center justify-center h-8`}
                          >
                            {displayText}
                          </div>
                        );
                      })()}
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        Xếp loại Đảng viên
                      </div>
                    </div>
                    <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-lg">
                      {(() => {
                        const trainingRating = studentDetail.trainingRating;
                        const displayText = trainingRating || "Chưa cập nhật";
                        const isSmallText = displayText === "Chưa cập nhật";

                        return (
                          <div
                            className={`${
                              isSmallText
                                ? "text-sm font-bold"
                                : "text-2xl font-bold"
                            } text-indigo-600  mb-1 dark:text-indigo-400 flex items-center justify-center h-8`}
                          >
                            {displayText}
                          </div>
                        );
                      })()}
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        Xếp loại Rèn luyện
                      </div>
                    </div>
                  </div>

                  {/* Bảng chi tiết môn học */}
                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
                    <div className="overflow-x-auto max-h-96 overflow-y-auto">
                      <table className="min-w-full">
                        <thead className="bg-gray-50 dark:bg-gray-700 sticky top-0 z-10 mb-4">
                          <tr>
                            <th className="px-4 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                              Mã môn
                            </th>
                            <th className="px-4 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                              Tên môn học
                            </th>
                            <th className="px-4 py-4 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                              Tín chỉ
                            </th>
                            <th className="px-4 py-4 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                              Điểm chữ
                            </th>
                            <th className="px-4 py-4 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                              Điểm hệ 4
                            </th>
                            <th className="px-4 py-4 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                              Điểm hệ 10
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                          {studentDetail.subjects?.map((subject, index) => (
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
                </>
              ) : (
                <div className="flex justify-center items-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                  <span className="ml-2 text-gray-600 dark:text-gray-400">
                    Đang tải chi tiết...
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal cập nhật xếp loại */}
      {showUpdateModal && selectedStudent && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
          <div className="bg-black bg-opacity-50 inset-0 fixed"></div>
          <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Cập nhật xếp loại - {selectedStudent.fullName}
              </h2>
              <button
                onClick={() => {
                  setShowUpdateModal(false);
                  setSelectedStudent(null);
                  setUpdateFormData({
                    partyRating: "",
                    trainingRating: "",
                    decisionNumber: "",
                  });
                  // Khôi phục scroll body khi đóng modal
                  document.body.style.overflow = "unset";
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
            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    Xếp loại rèn luyện
                  </label>
                  <ConfigProvider
                    theme={{
                      algorithm: isDark
                        ? theme.darkAlgorithm
                        : theme.defaultAlgorithm,
                    }}
                  >
                    <Select
                      value={updateFormData.trainingRating}
                      onChange={(value) =>
                        setUpdateFormData((prev) => ({
                          ...prev,
                          trainingRating: value,
                        }))
                      }
                      placeholder="Chọn xếp loại rèn luyện"
                      style={{ width: "100%" }}
                      options={[
                        { value: "", label: "Hãy chọn xếp loại rèn luyện" },
                        { value: "Tốt", label: "Tốt" },
                        { value: "Khá", label: "Khá" },
                        { value: "Trung bình", label: "Trung bình" },
                        { value: "Yếu", label: "Yếu" },
                      ]}
                    />
                  </ConfigProvider>
                </div>
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    Xếp loại Đảng viên
                    {selectedStudent &&
                      selectedStudent.positionParty &&
                      selectedStudent.positionParty !== "Không" && (
                        <span className="text-green-600 ml-2">(Đảng viên)</span>
                      )}
                    {selectedStudent &&
                      (!selectedStudent.positionParty ||
                        selectedStudent.positionParty === "Không") && (
                        <span className="text-red-600 ml-2">
                          (Chưa là Đảng viên)
                        </span>
                      )}
                  </label>
                  <ConfigProvider
                    theme={{
                      algorithm: isDark
                        ? theme.darkAlgorithm
                        : theme.defaultAlgorithm,
                    }}
                  >
                    <Select
                      value={updateFormData.partyRating}
                      onChange={(value) =>
                        setUpdateFormData((prev) => ({
                          ...prev,
                          partyRating: value,
                        }))
                      }
                      placeholder={
                        selectedStudent &&
                        selectedStudent.positionParty &&
                        selectedStudent.positionParty !== "Không"
                          ? "Chọn xếp loại Đảng viên"
                          : "Chỉ cập nhật được khi là Đảng viên"
                      }
                      style={{ width: "100%" }}
                      disabled={
                        !selectedStudent ||
                        !selectedStudent.positionParty ||
                        selectedStudent.positionParty === "Không"
                      }
                      options={[
                        { value: "", label: "Hãy chọn xếp loại Đảng viên" },
                        {
                          value: "HTXSNV",
                          label: "Hoàn thành xuất sắc nhiệm vụ",
                        },
                        { value: "HTTNV", label: "Hoàn thành tốt nhiệm vụ" },
                        { value: "HTNV", label: "Hoàn thành nhiệm vụ" },
                        { value: "KHTNV", label: "Không hoàn thành nhiệm vụ" },
                      ]}
                    />
                  </ConfigProvider>
                </div>

                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    Số quyết định
                  </label>
                  <input
                    type="text"
                    value={updateFormData.decisionNumber}
                    onChange={(e) =>
                      setUpdateFormData((prev) => ({
                        ...prev,
                        decisionNumber: e.target.value,
                      }))
                    }
                    placeholder={
                      selectedStudent &&
                      selectedStudent.positionParty &&
                      selectedStudent.positionParty !== "Không"
                        ? "Nhập số quyết định"
                        : "Chỉ cập nhật được khi là Đảng viên"
                    }
                    disabled={
                      !selectedStudent ||
                      !selectedStudent.positionParty ||
                      selectedStudent.positionParty === "Không"
                    }
                    className="bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  className="px-4 py-2 bg-gray-200 text-gray-500 rounded-lg hover:bg-gray-300 hover:text-gray-900"
                  onClick={() => {
                    setShowUpdateModal(false);
                    setSelectedStudent(null);
                    setUpdateFormData({
                      partyRating: "",
                      trainingRating: "",
                      decisionNumber: "",
                    });
                  }}
                >
                  Hủy
                </button>
                <button
                  type="button"
                  className="px-4 py-2 text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
                  onClick={handleSubmitUpdate}
                >
                  Cập nhật
                </button>
              </div>
            </div>
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
    </>
  );
};

export default YearlyStatistics;
