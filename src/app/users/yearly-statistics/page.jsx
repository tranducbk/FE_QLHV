"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import Link from "next/link";
import { jwtDecode } from "jwt-decode";
import { handleNotify } from "../../../components/notify";
import Loader from "@/components/loader";
import { useLoading } from "@/hooks";
import { BASE_URL } from "@/configs";
import { ConfigProvider, theme, Select } from "antd";
import { useState as useThemeState } from "react";
import SideBar from "@/components/sidebar";

const YearlyStatistics = () => {
  const [yearlyResults, setYearlyResults] = useState([]);
  const [schoolYears, setSchoolYears] = useState([]);
  const [selectedSchoolYear, setSelectedSchoolYear] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUnit, setSelectedUnit] = useState("all");
  const [availableUnits, setAvailableUnits] = useState([]);
  const { loading, withLoading } = useLoading(true);

  const [isDark, setIsDark] = useThemeState(false);

  // Function để tính toán kết quả năm học từ các học kỳ
  const calculateYearlyResultFromSemesters = (
    semesters,
    schoolYear,
    allSemesterResults
  ) => {
    if (!semesters || semesters.length === 0) return null;

    // Sắp xếp học kỳ theo thứ tự để đảm bảo tính toán đúng
    const sortedSemesters = semesters.sort((a, b) => {
      const semesterA = parseInt(a.semester.replace("HK", ""));
      const semesterB = parseInt(b.semester.replace("HK", ""));
      return semesterA - semesterB;
    });

    let totalCredits = 0;
    let totalGradePoints4 = 0;
    let totalGradePoints10 = 0;
    let totalDebt = 0;

    // Tính tổng từ tất cả học kỳ trong năm
    sortedSemesters.forEach((semester) => {
      totalCredits += semester.totalCredits || 0;
      totalGradePoints4 +=
        (semester.averageGrade4 || 0) * (semester.totalCredits || 0);
      totalGradePoints10 +=
        (semester.averageGrade10 || 0) * (semester.totalCredits || 0);

      // Tính số môn nợ dựa trên subjects có điểm F
      if (semester.subjects) {
        const failedSubjects = semester.subjects.filter(
          (subject) => subject.letterGrade === "F" || subject.gradePoint4 === 0
        );
        totalDebt += failedSubjects.reduce(
          (sum, subject) => sum + (subject.credits || 0),
          0
        );
      } else {
        totalDebt += semester.totalDebt || 0;
      }
    });

    // Tính GPA trung bình của năm học
    const yearlyGPA = totalCredits > 0 ? totalGradePoints4 / totalCredits : 0;
    const yearlyGrade10 =
      totalCredits > 0 ? totalGradePoints10 / totalCredits : 0;

    // Tính CPA tích lũy từ tất cả học kỳ đã học (không chỉ năm học này)
    let cumulativeTotalCredits = 0;
    let cumulativeTotalGradePoints4 = 0;
    let cumulativeTotalGradePoints10 = 0;

    // Sắp xếp tất cả học kỳ theo thứ tự thời gian
    const allSortedSemesters = allSemesterResults.sort((a, b) => {
      // So sánh năm học trước
      const yearComparison = a.schoolYear.localeCompare(b.schoolYear);
      if (yearComparison !== 0) return yearComparison;

      // Nếu cùng năm, so sánh học kỳ
      const semesterA = parseInt(a.semester.replace("HK", ""));
      const semesterB = parseInt(b.semester.replace("HK", ""));
      return semesterA - semesterB;
    });

    // Tính tích lũy từ tất cả học kỳ cho đến học kỳ cuối cùng của năm học này
    const lastSemesterOfYear = sortedSemesters[sortedSemesters.length - 1];
    let reachedTargetYear = false;

    allSortedSemesters.forEach((semester) => {
      // Dừng khi đã tính đến học kỳ cuối cùng của năm học hiện tại
      if (
        semester.schoolYear === schoolYear &&
        semester.semester === lastSemesterOfYear.semester
      ) {
        reachedTargetYear = true;
      }

      if (!reachedTargetYear) {
        cumulativeTotalCredits += semester.totalCredits || 0;
        cumulativeTotalGradePoints4 +=
          (semester.averageGrade4 || 0) * (semester.totalCredits || 0);
        cumulativeTotalGradePoints10 +=
          (semester.averageGrade10 || 0) * (semester.totalCredits || 0);
      }
    });

    // Tính CPA tích lũy
    const cumulativeGPA =
      cumulativeTotalCredits > 0
        ? cumulativeTotalGradePoints4 / cumulativeTotalCredits
        : 0;
    const cumulativeGrade10 =
      cumulativeTotalCredits > 0
        ? cumulativeTotalGradePoints10 / cumulativeTotalCredits
        : 0;

    return {
      schoolYear,
      yearlyGPA: yearlyGPA.toFixed(2),
      yearlyGrade10: yearlyGrade10.toFixed(2),
      totalCredits,
      totalDebt,
      cumulativeGPA: cumulativeGPA.toFixed(2),
      cumulativeGrade10: cumulativeGrade10.toFixed(2),
      cumulativeCredit: cumulativeTotalCredits,
      semesterCount: sortedSemesters.length,
      semesters: sortedSemesters.map((s) => s.semester),
    };
  };
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentDetail, setStudentDetail] = useState(null);

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
      await withLoading(fetchSchoolYears);
    };
    loadData();
  }, [withLoading]);

  useEffect(() => {
    if (selectedSchoolYear) {
      withLoading(fetchYearlyResults);
    }
  }, [selectedSchoolYear, withLoading]);

  const fetchSchoolYears = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      // Lấy dữ liệu kết quả học tập của user hiện tại
      const decodedToken = jwtDecode(token);
      const gradeRes = await axios.get(`${BASE_URL}/grade/${decodedToken.id}`, {
        headers: { token: `Bearer ${token}` },
      });

      const semesterResults = gradeRes.data.semesterResults || [];
      console.log("User semester results:", semesterResults);

      // Lấy danh sách các năm học có dữ liệu kết quả học tập
      const yearsWithData = [
        ...new Set(
          semesterResults.map((result) => result.schoolYear).filter(Boolean)
        ),
      ];

      // Sắp xếp theo thứ tự giảm dần (năm mới nhất trước)
      const sortedYears = yearsWithData.sort((a, b) => b.localeCompare(a));

      setSchoolYears(sortedYears);

      if (sortedYears.length > 0) {
        // Mặc định chọn "Tất cả các năm"
        setSelectedSchoolYear("all");
      }
    } catch (error) {
      console.log("Error fetching school years:", error);
      setSchoolYears([]);
      setSelectedSchoolYear("");
    }
  };

  const fetchYearlyResults = async () => {
    const token = localStorage.getItem("token");
    if (!token || !selectedSchoolYear) return;

    try {
      // Lấy dữ liệu kết quả học tập của user hiện tại
      const decodedToken = jwtDecode(token);
      const res = await axios.get(`${BASE_URL}/grade/${decodedToken.id}`, {
        headers: { token: `Bearer ${token}` },
      });

      const semesterResults = res.data.semesterResults || [];
      const yearlyResults = res.data.yearlyResults || [];
      const positionParty = res.data.positionParty || "Không";

      let finalResults = [];

      if (selectedSchoolYear === "all") {
        // Hiển thị tất cả các năm học
        const allYears = [
          ...new Set(
            semesterResults.map((result) => result.schoolYear).filter(Boolean)
          ),
        ];

        allYears.forEach((year) => {
          // Lọc kết quả năm học theo năm
          const filteredYearlyResults = yearlyResults.filter(
            (result) => result.schoolYear === year
          );

          if (filteredYearlyResults.length > 0) {
            // Thêm positionParty và chuẩn hóa failedSubjects/debtCredits nếu thiếu
            const resultsWithPositionParty = filteredYearlyResults.map(
              (result) => {
                const subjects = Array.isArray(result.subjects)
                  ? result.subjects
                  : [];
                const failedSubjectsCalc = subjects.filter(
                  (s) => s.letterGrade === "F" || s.gradePoint4 === 0
                ).length;
                const debtCreditsCalc = subjects.reduce((sum, s) => {
                  const isDebt = s.letterGrade === "F" || s.gradePoint4 === 0;
                  return sum + (isDebt ? s.credits || 0 : 0);
                }, 0);
                return {
                  ...result,
                  positionParty: positionParty,
                  failedSubjects: result.failedSubjects ?? failedSubjectsCalc,
                  debtCredits: result.debtCredits ?? debtCreditsCalc,
                };
              }
            );
            finalResults.push(...resultsWithPositionParty);
          } else {
            // Tạo từ dữ liệu học kỳ nếu không có kết quả năm học
            const semestersInYear = semesterResults.filter(
              (result) => result.schoolYear === year
            );

            if (semestersInYear.length > 0) {
              const yearlyResult = calculateYearlyResultFromSemesters(
                semestersInYear,
                year,
                semesterResults
              );
              // Thêm positionParty vào kết quả tính toán
              finalResults.push({
                ...yearlyResult,
                positionParty: positionParty,
              });
            }
          }
        });
      } else {
        // Lọc kết quả năm học theo năm được chọn
        const filteredYearlyResults = yearlyResults.filter(
          (result) => result.schoolYear === selectedSchoolYear
        );

        // Nếu không có kết quả năm học, tạo từ dữ liệu học kỳ
        if (filteredYearlyResults.length === 0) {
          // Lọc học kỳ theo năm học được chọn
          const semestersInYear = semesterResults.filter(
            (result) => result.schoolYear === selectedSchoolYear
          );

          if (semestersInYear.length > 0) {
            // Tính toán kết quả năm học từ các học kỳ
            const yearlyResult = calculateYearlyResultFromSemesters(
              semestersInYear,
              selectedSchoolYear,
              semesterResults
            );
            // Thêm positionParty vào kết quả tính toán
            finalResults = [
              {
                ...yearlyResult,
                positionParty: positionParty,
              },
            ];
          }
        } else {
          // Thêm positionParty và chuẩn hóa failedSubjects/debtCredits nếu thiếu
          finalResults = filteredYearlyResults.map((result) => {
            const subjects = Array.isArray(result.subjects)
              ? result.subjects
              : [];
            const failedSubjectsCalc = subjects.filter(
              (s) => s.letterGrade === "F" || s.gradePoint4 === 0
            ).length;
            const debtCreditsCalc = subjects.reduce((sum, s) => {
              const isDebt = s.letterGrade === "F" || s.gradePoint4 === 0;
              return sum + (isDebt ? s.credits || 0 : 0);
            }, 0);
            return {
              ...result,
              positionParty: positionParty,
              failedSubjects: result.failedSubjects ?? failedSubjectsCalc,
              debtCredits: result.debtCredits ?? debtCreditsCalc,
            };
          });
        }
      }

      // Sắp xếp kết quả theo năm học (mới nhất trước)
      if (selectedSchoolYear === "all") {
        finalResults.sort((a, b) => b.schoolYear.localeCompare(a.schoolYear));
      }

      setYearlyResults(finalResults);
      setAvailableUnits([]); // Không cần đơn vị cho user view
    } catch (error) {
      console.log("Error fetching yearly results:", error);
      setYearlyResults([]);
    }
  };

  // Lấy chi tiết 1 SV theo kỳ để xem
  const fetchStudentDetail = async (studentId, semester, schoolYear) => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      // Gọi API từ bên học viên để lấy chi tiết điểm
      const res = await axios.get(
        `${BASE_URL}/grade/student/${studentId}/${semester}/${schoolYear}`,
        { headers: { token: `Bearer ${token}` } }
      );

      // Kiểm tra và format dữ liệu trả về
      const data = res.data;
      if (data && data.subjects) {
        // Đảm bảo dữ liệu có đầy đủ thông tin cần thiết
        setStudentDetail({
          ...data,
          totalCredits:
            data.totalCredits ||
            data.subjects.reduce((sum, sub) => sum + (sub.credits || 0), 0),
          averageGrade4:
            data.averageGrade4 ||
            data.subjects.reduce(
              (sum, sub) => sum + (sub.gradePoint4 || 0),
              0
            ) / data.subjects.length,
          averageGrade10:
            data.averageGrade10 ||
            data.subjects.reduce(
              (sum, sub) => sum + (sub.gradePoint10 || 0),
              0
            ) / data.subjects.length,
        });
      } else {
        setStudentDetail(data);
      }
    } catch (error) {
      console.log("Error fetching student detail:", error);
      handleNotify("error", "Lỗi", "Không thể tải chi tiết điểm của sinh viên");
    }
  };

  const handleViewDetail = async (row) => {
    setSelectedStudent(row);
    setShowDetailModal(true);

    // Lấy dữ liệu học kỳ của năm học được chọn
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const decodedToken = jwtDecode(token);
        const res = await axios.get(`${BASE_URL}/grade/${decodedToken.id}`, {
          headers: { token: `Bearer ${token}` },
        });

        const semesterResults = res.data.semesterResults || [];
        const positionParty = res.data.positionParty;
        const semestersInYear = semesterResults.filter(
          (result) => result.schoolYear === row.schoolYear
        );

        if (semestersInYear.length > 0) {
          // Tạo dữ liệu tổng hợp từ các học kỳ
          const combinedData = {
            schoolYear: row.schoolYear,
            totalCredits: row.totalCredits || 0,
            averageGrade4: parseFloat(row.averageGrade4) || 0,
            averageGrade10: parseFloat(row.averageGrade10) || 0,
            cumulativeGrade4: parseFloat(row.cumulativeGrade4) || 0,
            cumulativeGrade10: parseFloat(row.cumulativeGrade10) || 0,
            cumulativeCredits: parseFloat(row.cumulativeCredits) || 0,
            positionParty: positionParty,
            trainingRating: row.trainingRating,
            partyRating: row.partyRating, // Thêm partyRating từ row
            subjects: [],
          };

          // Gộp tất cả môn học từ các học kỳ
          semestersInYear.forEach((semester) => {
            if (semester.subjects) {
              combinedData.subjects.push(...semester.subjects);
            }
          });
          setStudentDetail(combinedData);
        }
      } catch (error) {
        console.log("Error fetching semester details:", error);
        handleNotify("error", "Lỗi", "Không thể tải chi tiết điểm");
      }
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

    // Sắp xếp theo thứ tự: đơn vị → tên → GPA
    return filtered.sort((a, b) => {
      // 1. Sắp xếp theo đơn vị từ L1-H5 đến L6-H5
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

      // 2. Trong cùng đơn vị, sắp xếp theo tên học viên A-Z
      if (a.fullName !== b.fullName) {
        return a.fullName.localeCompare(b.fullName, "vi");
      }

      // 3. Trong cùng học viên, sắp xếp theo GPA (cao đến thấp)
      const gpaA = parseFloat(a.yearlyGPA) || 0;
      const gpaB = parseFloat(b.yearlyGPA) || 0;
      return gpaB - gpaA; // GPA cao trước
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
    return <Loader text="Đang tải thống kê năm học..." />;
  }

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

          <div className="w-full pt-8 pb-5 pl-5 pr-6 mb-5">
            <div className="bg-white dark:bg-gray-800 rounded-lg w-full shadow-lg">
              <div className="font-bold p-5 flex justify-between items-center border-b border-gray-200 dark:border-gray-700">
                <div className="text-gray-900 dark:text-white">
                  <h1 className="text-2xl font-bold">
                    THỐNG KÊ KẾT QUẢ HỌC TẬP THEO NĂM
                  </h1>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Quản lý và xem thống kê kết quả học tập theo năm
                  </p>
                </div>
                <Link
                  href="/users/learning-information?tab=results"
                  className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 border border-blue-500 hover:border-blue-600 rounded-lg transition-colors duration-200 flex items-center"
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
                      d="M10 19l-7-7m0 0l7-7m-7 7h18"
                    />
                  </svg>
                  Trở lại kết quả học tập
                </Link>
              </div>

              <div className="w-full p-5">
                <div className="mb-4">
                  <div className="flex items-end gap-4">
                    <div>
                      <label
                        htmlFor="schoolYear"
                        className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300"
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
                          onChange={setSelectedSchoolYear}
                          placeholder="Chọn năm học"
                          style={{ width: 200 }}
                          options={schoolYearOptions}
                        />
                      </ConfigProvider>
                    </div>
                  </div>
                </div>

                {/* Thống kê tổng quan */}
                {!loading && yearlyResults.length > 0 && (
                  <div
                    className={`grid grid-cols-1 gap-4 mb-6 ${
                      selectedSchoolYear === "all"
                        ? "md:grid-cols-4"
                        : "md:grid-cols-6"
                    }`}
                  >
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                        {selectedSchoolYear === "all"
                          ? yearlyResults.length
                          : yearlyResults[0]?.semesterIds?.length ||
                            yearlyResults[0]?.semesters?.length ||
                            yearlyResults[0]?.semesterCount ||
                            0}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {selectedSchoolYear === "all"
                          ? "Số năm học có dữ liệu"
                          : "Số học kỳ trong năm"}
                      </div>
                    </div>
                    <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                      <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                        {selectedSchoolYear === "all"
                          ? (
                              yearlyResults.reduce(
                                (sum, item) =>
                                  sum + (parseFloat(item.averageGrade4) || 0),
                                0
                              ) / yearlyResults.length || 0
                            ).toFixed(2)
                          : yearlyResults[0]?.averageGrade4?.toFixed(2) ||
                            "0.00"}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {selectedSchoolYear === "all"
                          ? "GPA trung bình tất cả năm"
                          : "GPA năm học (Hệ 4)"}
                      </div>
                    </div>
                    <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
                      <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                        {selectedSchoolYear === "all"
                          ? yearlyResults.reduce(
                              (sum, item) => sum + (item.totalSubjects || 0),
                              0
                            )
                          : yearlyResults[0]?.totalSubjects || 0}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {selectedSchoolYear === "all"
                          ? "Tổng số môn tất cả năm"
                          : "Tổng số môn năm học"}
                      </div>
                    </div>
                    <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
                      <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                        {selectedSchoolYear === "all"
                          ? yearlyResults.reduce(
                              (sum, item) => sum + (item.failedSubjects || 0),
                              0
                            )
                          : yearlyResults[0]?.failedSubjects || 0}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {selectedSchoolYear === "all"
                          ? "Tổng số môn nợ tất cả năm"
                          : "Số môn nợ năm học"}
                      </div>
                    </div>
                    {selectedSchoolYear !== "all" && (
                      <>
                        <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
                          {(() => {
                            // Sử dụng positionParty từ yearlyResults đầu tiên
                            const positionParty =
                              yearlyResults[0]?.positionParty;
                            const partyRating = yearlyResults[0]?.partyRating;

                            if (positionParty === "Không") {
                              return (
                                <div className="text-sm font-bold text-red-600 mb-1 dark:text-red-400 flex items-center justify-center h-8">
                                  Chưa là Đảng viên
                                </div>
                              );
                            } else if (partyRating && partyRating.rating) {
                              return (
                                <div className="flex flex-col items-center justify-center h-8">
                                  <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                                    {partyRating.rating}
                                  </div>
                                  <div className="text-xs text-red-600 dark:text-red-400">
                                    Số QĐ: {partyRating.decisionNumber}
                                  </div>
                                </div>
                              );
                            } else {
                              return (
                                <div className="text-sm font-bold text-red-600 mb-1 dark:text-red-400 flex items-center justify-center h-8">
                                  Chưa cập nhật
                                </div>
                              );
                            }
                          })()}
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            Xếp loại Đảng viên
                          </div>
                        </div>
                        <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
                          {(() => {
                            const trainingRating =
                              yearlyResults[0]?.trainingRating;
                            const displayText =
                              trainingRating || "Chưa cập nhật";
                            const isSmallText = displayText === "Chưa cập nhật";

                            return (
                              <div
                                className={`${
                                  isSmallText
                                    ? "text-sm font-bold flex items-center justify-center h-8"
                                    : "text-2xl font-bold"
                                } text-purple-600 mb-2 dark:text-purple-400`}
                              >
                                {displayText}
                              </div>
                            );
                          })()}
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            Xếp loại Rèn luyện
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                )}

                <div className="overflow-x-auto">
                  <table className="table-auto w-full divide-y divide-gray-200 dark:divide-gray-700 border border-gray-200 dark:border-gray-700 rounded-lg">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider border-r border-gray-200 dark:border-gray-600 whitespace-nowrap">
                          NĂM HỌC
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider border-r border-gray-200 dark:border-gray-600 whitespace-nowrap">
                          SỐ HỌC KỲ
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider border-r border-gray-200 dark:border-gray-600 whitespace-nowrap">
                          GPA
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider border-r border-gray-200 dark:border-gray-600 whitespace-nowrap">
                          CPA TÍCH LŨY
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider border-r border-gray-200 dark:border-gray-600 whitespace-nowrap">
                          TC TÍCH LŨY
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider border-r border-gray-200 dark:border-gray-600 whitespace-nowrap">
                          MÔN NỢ
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider border-r border-gray-200 dark:border-gray-600 whitespace-nowrap">
                          XẾP LOẠI Đảng viên
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider border-r border-gray-200 dark:border-gray-600 whitespace-nowrap">
                          XLRL
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider whitespace-nowrap">
                          THAO TÁC
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {loading ? (
                        <tr>
                          <td
                            colSpan="9"
                            className="text-center py-8 text-gray-500 dark:text-gray-400"
                          >
                            <div className="flex flex-col items-center">
                              <svg
                                className="animate-spin h-8 w-8 text-blue-500 mb-4"
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
                              <p>Đang tải dữ liệu...</p>
                            </div>
                          </td>
                        </tr>
                      ) : yearlyResults.length > 0 ? (
                        yearlyResults.map((item, index) => (
                          <tr
                            key={index}
                            className="hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                            onClick={() => handleViewDetail(item)}
                          >
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white border-r border-gray-200 dark:border-gray-600 text-center">
                              {item.schoolYear}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white border-r border-gray-200 dark:border-gray-600 text-center">
                              {item.semesterIds?.length ||
                                item.semesters?.length ||
                                item.semesterCount ||
                                0}{" "}
                              học kỳ
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white border-r border-gray-200 dark:border-gray-600 text-center">
                              <div className="font-medium text-blue-600 dark:text-blue-400">
                                {item.averageGrade4?.toFixed(2) || "0.00"}
                              </div>

                              <div className="font-medium text-purple-600 dark:text-purple-400">
                                {item.averageGrade10?.toFixed(2) || "0.00"}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white border-r border-gray-200 dark:border-gray-600 text-center">
                              <div className="font-medium text-green-600 dark:text-green-400">
                                {item.cumulativeGrade4?.toFixed(2) || "0.00"}
                              </div>

                              <div className="font-medium text-green-600 dark:text-green-400">
                                {item.cumulativeGrade10?.toFixed(2) || "0.00"}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white border-r border-gray-200 dark:border-gray-600 text-center">
                              <div className="font-medium">
                                {item.cumulativeCredits || 0} tín chỉ
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                Năm {item.studentLevel || 1}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white border-r border-gray-200 dark:border-gray-600 text-center">
                              <div className="font-semibold text-red-600 dark:text-red-400 text-base">
                                {item.failedSubjects || 0}
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                TC nợ: {item.debtCredits || 0}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white border-r border-gray-200 dark:border-gray-600 text-center">
                              <div className="font-medium text-orange-600 dark:text-orange-400">
                                {(() => {
                                  // Sử dụng positionParty từ từng item
                                  const positionParty = item.positionParty;
                                  const partyRating = item.partyRating;

                                  if (positionParty === "Không") {
                                    return "Chưa là Đảng viên";
                                  } else if (
                                    partyRating &&
                                    partyRating.rating
                                  ) {
                                    return (
                                      <div className="flex flex-col">
                                        <div className="font-bold">
                                          {partyRating.rating}
                                        </div>
                                        <div className="text-xs">
                                          Số QĐ: {partyRating.decisionNumber}
                                        </div>
                                      </div>
                                    );
                                  } else {
                                    return "Chưa cập nhật";
                                  }
                                })()}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white border-r border-gray-200 dark:border-gray-600 text-center">
                              <div className="font-medium text-purple-600 dark:text-purple-400">
                                {item.trainingRating || "Chưa cập nhật"}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white text-center">
                              <div className="flex justify-center space-x-2">
                                <button
                                  className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                                  title="Xem chi tiết"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleViewDetail(item);
                                  }}
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
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td
                            colSpan="9"
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
                                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                />
                              </svg>
                              <p className="text-lg font-medium">
                                Không có dữ liệu
                              </p>
                              <p className="text-sm">
                                Không tìm thấy kết quả học tập nào cho năm học
                                này
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

      {/* Modal chi tiết điểm */}
      {showDetailModal && selectedStudent && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
          <div className="bg-black bg-opacity-50 inset-0 fixed"></div>
          <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Chi tiết điểm năm học {selectedStudent.schoolYear}
              </h2>
              <button
                onClick={() => {
                  setShowDetailModal(false);
                  setSelectedStudent(null);
                  setStudentDetail(null);
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
                  <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-6">
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
                        {studentDetail.averageGrade4?.toFixed(2) || "0.00"}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        GPA (Hệ 4)
                      </div>
                    </div>
                    <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
                      <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                        {studentDetail.averageGrade10?.toFixed(2) || "0.00"}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        GPA (Hệ 10)
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
                        // Sử dụng positionParty từ studentDetail
                        const positionParty = studentDetail.positionParty;
                        const partyRating = studentDetail.partyRating;

                        if (positionParty === "Không") {
                          return (
                            <div className="text-sm font-bold text-red-600 mb-1 dark:text-red-400 flex items-center justify-center h-8">
                              Chưa là Đảng viên
                            </div>
                          );
                        } else if (partyRating && partyRating.rating) {
                          return (
                            <div className="text-2xl mb-2 font-bold text-red-600 dark:text-red-400 flex items-center justify-center h-8">
                              {partyRating.rating}
                            </div>
                          );
                        } else {
                          return (
                            <div className="text-sm font-bold text-red-600 mb-1 dark:text-red-400 flex items-center justify-center h-8">
                              Chưa cập nhật
                            </div>
                          );
                        }
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
                    <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        Chi tiết các môn học năm học {studentDetail.schoolYear}
                      </h3>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="min-w-full">
                        <thead className="bg-gray-50 dark:bg-gray-700">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                              Mã môn
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                              Tên môn học
                            </th>
                            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                              Tín chỉ
                            </th>
                            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                              Điểm chữ
                            </th>
                            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                              Điểm hệ 4
                            </th>
                            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
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
    </>
  );
};

export default YearlyStatistics;
