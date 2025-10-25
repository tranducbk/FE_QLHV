"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import Link from "next/link";
import { handleNotify } from "../../../components/notify";
import Loader from "@/components/loader";
import { BASE_URL } from "@/configs";
import { useLoading } from "@/hooks";
import { TreeSelect, ConfigProvider, theme, Input, Select } from "antd";
import { useState as useThemeState } from "react";

const PartyRating = () => {
  const [partyRatings, setPartyRatings] = useState([]);
  const [schoolYears, setSchoolYears] = useState([]);
  const [selectedSchoolYear, setSelectedSchoolYear] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const { loading, withLoading } = useLoading(true);
  const [selectedUnit, setSelectedUnit] = useState("all");
  const [availableUnits, setAvailableUnits] = useState([]);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [updateFormData, setUpdateFormData] = useState({
    partyRating: "",
    decisionNumber: "",
  });

  const [showBulkUpdateModal, setShowBulkUpdateModal] = useState(false);
  const [selectedStudentsForBulk, setSelectedStudentsForBulk] = useState([]);
  const [bulkUpdateData, setBulkUpdateData] = useState({
    partyRating: "",
    decisionNumber: "",
  });
  const [bulkFilterUnit, setBulkFilterUnit] = useState("all");
  const [bulkSearchTerm, setBulkSearchTerm] = useState("");

  const [isDark, setIsDark] = useThemeState(false);

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

  useEffect(() => {
    const loadData = async () => {
      await withLoading(fetchInitialData);
    };
    loadData();
  }, [withLoading]);

  const fetchInitialData = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const res = await axios.get(
        `${BASE_URL}/commander/allStudentsForPartyRating`,
        {
          headers: { token: `Bearer ${token}` },
        }
      );

      console.log("Party ratings data:", res.data);

      const processedData = res.data || [];

      const allSchoolYears = new Set();
      processedData.forEach((item) => {
        if (
          item.schoolYear &&
          item.schoolYear !== "Tất cả" &&
          item.schoolYear !== "Chưa có dữ liệu"
        ) {
          allSchoolYears.add(item.schoolYear);
        }
      });

      const uniqueSchoolYears = Array.from(allSchoolYears).sort((a, b) =>
        b.localeCompare(a)
      );

      setSchoolYears(uniqueSchoolYears);
      setPartyRatings(processedData);

      const units = [
        ...new Set(
          processedData
            .map((item) => item.unit)
            .filter((unit) => unit && unit.trim())
        ),
      ];
      setAvailableUnits(units);

      if (uniqueSchoolYears.length > 0) {
        // Tự động chọn năm học mới nhất
        const latest = uniqueSchoolYears[0];
        setSelectedSchoolYear(latest);
        await fetchPartyRatingsForYear(latest);
      } else {
        // Nếu không có năm học nào, hiển thị tất cả sinh viên
        setSelectedSchoolYear("all");
      }
    } catch (error) {
      console.log("Error fetching initial data:", error);
      setPartyRatings([]);
      setSchoolYears([]);
      setSelectedSchoolYear("");
    }
  };

  const handleSchoolYearChange = (newSchoolYear) => {
    setSelectedSchoolYear(newSchoolYear);
    fetchPartyRatingsForYear(newSchoolYear);
  };

  const fetchPartyRatingsForYear = async (year) => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const res = await axios.get(
        `${BASE_URL}/commander/allStudentsForPartyRating?schoolYear=${year}`,
        {
          headers: { token: `Bearer ${token}` },
        }
      );

      console.log(`Party ratings data for ${year}:`, res.data);
      const data = res.data || [];
      setPartyRatings(data);
      const units = [
        ...new Set(
          data.map((item) => item.unit).filter((unit) => unit && unit.trim())
        ),
      ];
      setAvailableUnits(units);
    } catch (error) {
      console.log("Error fetching party ratings for year:", error);
      setPartyRatings([]);
    }
  };

  const handleUpdateRating = (row) => {
    setSelectedStudent(row);
    setUpdateFormData({
      partyRating: row.partyRating?.rating || "",
      decisionNumber: row.partyRating?.decisionNumber || "",
    });
    setShowUpdateModal(true);
  };

  const handleSubmitUpdate = async () => {
    const token = localStorage.getItem("token");
    if (!token || !selectedStudent) return;

    try {
      const yearlyResultId = selectedStudent.yearlyResultId || "null";

      const response = await axios.put(
        `${BASE_URL}/commander/updateStudentRating/${yearlyResultId}`,
        {
          partyRating: updateFormData.partyRating,
          decisionNumber: updateFormData.decisionNumber,
          studentId: selectedStudent.studentId,
          schoolYear: selectedStudent.schoolYear, // Gửi schoolYear để backend có thể tạo mới nếu cần
        },
        {
          headers: { token: `Bearer ${token}` },
        }
      );

      if (response.status === 200 || response.status === 201) {
        handleNotify(
          "success",
          "Thành công",
          "Cập nhật xếp loại Đảng viên thành công"
        );
        setShowUpdateModal(false);
        setSelectedStudent(null);
        setUpdateFormData({
          partyRating: "",
          decisionNumber: "",
        });

        if (selectedSchoolYear === "all") {
          fetchInitialData();
        } else {
          fetchPartyRatingsForYear(selectedSchoolYear);
        }
      }
    } catch (error) {
      console.log("Error updating party rating:", error);
      const errorMsg = error.response?.data?.message || "Không thể cập nhật xếp loại Đảng viên";
      handleNotify("error", "Lỗi", errorMsg);
    }
  };

  const handleBulkUpdate = () => {
    setShowBulkUpdateModal(true);
    setSelectedStudentsForBulk([]);
    setBulkUpdateData({
      partyRating: "",
      decisionNumber: "",
    });
    setBulkFilterUnit("all");
    setBulkSearchTerm("");
  };

  const getFilteredStudentsForBulk = () => {
    if (!partyRatings) return [];

    let filtered = partyRatings.filter((item) => {
      const matchesSearch =
        bulkSearchTerm === "" ||
        item.fullName?.toLowerCase().includes(bulkSearchTerm.toLowerCase()) ||
        item.studentCode?.toLowerCase().includes(bulkSearchTerm.toLowerCase());

      const matchesUnit =
        bulkFilterUnit === "all" || item.unit === bulkFilterUnit;

      return matchesSearch && matchesUnit;
    });

    return filtered.filter(
      (item) => item.positionParty && item.positionParty !== "Không"
    );
  };

  const handleSelectAllStudents = () => {
    const filteredStudents = getFilteredStudentsForBulk();
    setSelectedStudentsForBulk(filteredStudents.map((student) => student.id));
  };

  const handleDeselectAllStudents = () => {
    setSelectedStudentsForBulk([]);
  };

  const handleSelectStudent = (studentId) => {
    setSelectedStudentsForBulk((prev) =>
      prev.includes(studentId)
        ? prev.filter((id) => id !== studentId)
        : [...prev, studentId]
    );
  };

  const handleBulkSubmitUpdate = async () => {
    if (selectedStudentsForBulk.length === 0) {
      handleNotify(
        "warning",
        "Cảnh báo",
        "Vui lòng chọn ít nhất một sinh viên"
      );
      return;
    }

    if (!bulkUpdateData.partyRating) {
      handleNotify("warning", "Cảnh báo", "Vui lòng chọn xếp loại Đảng viên");
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const filteredStudents = getFilteredStudentsForBulk();
      const studentsToUpdate = filteredStudents.filter((student) =>
        selectedStudentsForBulk.includes(student.id)
      );

      let successCount = 0;
      let errorCount = 0;

      for (const student of studentsToUpdate) {
        try {
          const yearlyResultId = student.yearlyResultId || "null";

          const response = await axios.put(
            `${BASE_URL}/commander/updateStudentRating/${yearlyResultId}`,
            {
              partyRating: bulkUpdateData.partyRating,
              decisionNumber: bulkUpdateData.decisionNumber,
              studentId: student.studentId,
              schoolYear: student.schoolYear, // Gửi schoolYear để backend có thể tạo mới nếu cần
            },
            {
              headers: { token: `Bearer ${token}` },
            }
          );

          if (response.status === 200 || response.status === 201) {
            successCount++;
          }
        } catch (error) {
          console.log(`Error updating student ${student.fullName}:`, error);
          errorCount++;
        }
      }

      if (successCount > 0) {
        handleNotify(
          "success",
          "Thành công",
          `Cập nhật thành công ${successCount} sinh viên${
            errorCount > 0 ? `, ${errorCount} lỗi` : ""
          }`
        );
        setShowBulkUpdateModal(false);
        setSelectedStudentsForBulk([]);
        if (selectedSchoolYear === "all") {
          fetchInitialData();
        } else {
          fetchPartyRatingsForYear(selectedSchoolYear);
        }
      } else {
        handleNotify("error", "Lỗi", "Không thể cập nhật bất kỳ sinh viên nào");
      }
    } catch (error) {
      console.log("Error in bulk update:", error);
      handleNotify(
        "error",
        "Lỗi",
        "Có lỗi xảy ra trong quá trình cập nhật đồng loạt"
      );
    }
  };

  const schoolYearOptions = [
    ...schoolYears.map((year) => ({
      label: `Năm học ${year}`,
      value: year,
    })),
  ];

  const getFilteredResults = () => {
    if (!partyRatings) return [];

    let filtered = partyRatings.filter((item) => {
      const matchesSearch =
        searchTerm === "" ||
        item.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.studentCode?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesUnit =
        selectedUnit === "all" ||
        item.unit === selectedUnit ||
        item.className === selectedUnit;

      // Lọc theo năm học được chọn
      const matchesSchoolYear = item.schoolYear === selectedSchoolYear;

      return matchesSearch && matchesUnit && matchesSchoolYear;
    });

    return filtered.sort((a, b) => {
      if (a.schoolYear !== b.schoolYear) {
        return b.schoolYear.localeCompare(a.schoolYear);
      }

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

      return a.fullName.localeCompare(b.fullName, "vi");
    });
  };

  if (loading) {
    return <Loader text="Đang tải dữ liệu xếp loại Đảng viên..." />;
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
                      Xếp loại Đảng viên
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
                    XẾP LOẠI ĐẢNG VIÊN THEO NĂM
                  </h1>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Quản lý và xem xếp loại Đảng viên
                  </p>
                </div>
                <button
                  onClick={handleBulkUpdate}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg text-sm transition-colors duration-200 flex items-center"
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
                      d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4"
                    />
                  </svg>
                  Cập nhật đồng loạt
                </button>
              </div>

              <div className="w-full p-5">
                <div className="mb-4">
                  <form className="flex items-center gap-3 flex-wrap">
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
                          onChange={handleSchoolYearChange}
                          placeholder="Chọn năm học"
                          style={{ width: 260, height: 36 }}
                          options={schoolYearOptions}
                        />
                      </ConfigProvider>
                    </div>

                    <div>
                      <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
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
                          style={{ width: 160, height: 36 }}
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
                    </div>
                    <div>
                      <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                        Tìm kiếm
                      </label>
                      <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Tên hoặc mã sinh viên..."
                        className="bg-gray-50 dark:bg-gray-700 border w-64 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block h-9 px-3"
                      />
                    </div>
                    <div className="pt-6">
                      <button
                        onClick={() => {
                          setSearchTerm("");
                          setSelectedUnit("all");
                        }}
                        className="h-9 bg-gray-500 hover:bg-gray-600 text-white font-medium rounded-lg text-sm w-full sm:w-auto px-4 transition-colors duration-200 flex items-center"
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
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                        Xóa bộ lọc
                      </button>
                    </div>
                  </form>
                </div>

                <div className="overflow-x-auto">
                  <table className="table-auto w-full divide-y divide-gray-200 dark:divide-gray-700 border border-gray-200 dark:border-gray-700 rounded-lg">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider border-r border-gray-200 dark:border-gray-600 whitespace-nowrap">
                          ĐƠN VỊ
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider border-r border-gray-200 dark:border-gray-600 whitespace-nowrap">
                          HỌ VÀ TÊN
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider border-r border-gray-200 dark:border-gray-600 whitespace-nowrap">
                          MÃ SINH VIÊN
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider border-r border-gray-200 dark:border-gray-600 whitespace-nowrap">
                          LỚP
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider border-r border-gray-200 dark:border-gray-600 whitespace-nowrap">
                          TRƯỜNG
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider border-r border-gray-200 dark:border-gray-600 whitespace-nowrap">
                          NĂM HỌC
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider border-r border-gray-200 dark:border-gray-600 whitespace-nowrap">
                          XẾP LOẠI Đảng viên
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
                            colSpan="8"
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
                      ) : getFilteredResults().length > 0 ? (
                        getFilteredResults().map((item) => (
                          <tr
                            key={`${item.id}-${item.schoolYear}`}
                            className="hover:bg-gray-50 dark:hover:bg-gray-700"
                          >
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white border-r border-gray-200 dark:border-gray-600 text-center">
                              {item.unit || "Chưa có đơn vị"}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white border-r border-gray-200 dark:border-gray-600 text-center">
                              <div className="font-medium">{item.fullName}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white border-r border-gray-200 dark:border-gray-600 text-center">
                              {item.studentCode || "Chưa có mã SV"}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white border-r border-gray-200 dark:border-gray-600 text-center">
                              {item.className || "Chưa có lớp"}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white border-r border-gray-200 dark:border-gray-600 text-center">
                              {item.university || "Chưa có trường"}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white border-r border-gray-200 dark:border-gray-600 text-center">
                              {item.schoolYear}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white border-r border-gray-200 dark:border-gray-600 text-center">
                              <div className="font-medium text-orange-600 dark:text-orange-400">
                                {(() => {
                                  if (item.positionParty === "Không") {
                                    return "Chưa là Đảng viên";
                                  }
                                  return (
                                    item.partyRating?.rating || "Chưa cập nhật"
                                  );
                                })()}
                              </div>
                              {item.positionParty !== "Không" &&
                                item.partyRating?.decisionNumber && (
                                  <div className="text-xs text-gray-500 mt-1">
                                    QĐ: {item.partyRating.decisionNumber}
                                  </div>
                                )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white text-center">
                              <div className="flex justify-center space-x-2">
                                <button
                                  className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                                  title="Cập nhật xếp loại Đảng viên"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleUpdateRating(item);
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
                                Không tìm thấy dữ liệu xếp loại Đảng viên nào
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

      {/* Modal Cập nhật xếp loại Đảng viên */}
      {showUpdateModal && selectedStudent && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
          <div className="bg-black bg-opacity-50 inset-0 fixed"></div>
          <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Cập nhật xếp loại Đảng viên - {selectedStudent.fullName}
              </h2>
              <button
                onClick={() => {
                  setShowUpdateModal(false);
                  setSelectedStudent(null);
                  setUpdateFormData({
                    partyRating: "",
                    decisionNumber: "",
                  });
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

      {/* Modal cập nhật đồng loạt */}
      {showBulkUpdateModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
          <div className="bg-black bg-opacity-50 inset-0 fixed"></div>
          <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[95vh] overflow-auto mt-6 md:mt-10">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Cập nhật đồng loạt xếp loại Đảng viên
              </h2>
              <button
                onClick={() => {
                  setShowBulkUpdateModal(false);
                  setSelectedStudentsForBulk([]);
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

            <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
              <div className="space-y-6">
                {/* Bộ lọc và tìm kiếm */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                  <div>
                    <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                      Tìm kiếm theo tên/mã
                    </label>
                    <input
                      type="text"
                      value={bulkSearchTerm}
                      onChange={(e) => setBulkSearchTerm(e.target.value)}
                      placeholder="Nhập tên hoặc mã sinh viên..."
                      className="bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full h-10 px-3"
                    />
                  </div>

                  <div>
                    <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                      Lọc theo đơn vị
                    </label>
                    <ConfigProvider
                      theme={{
                        algorithm: isDark
                          ? theme.darkAlgorithm
                          : theme.defaultAlgorithm,
                      }}
                    >
                      <Select
                        value={bulkFilterUnit}
                        onChange={setBulkFilterUnit}
                        size="large"
                        style={{ width: "100%" }}
                        options={[
                          { value: "all", label: "Tất cả đơn vị" },
                          ...availableUnits.map((u) => ({
                            value: u,
                            label: u,
                          })),
                        ]}
                      />
                    </ConfigProvider>
                  </div>
                </div>

                <div className="flex items-center justify-start md:justify-end gap-2">
                  <button
                    onClick={handleSelectAllStudents}
                    className="px-3 h-10 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg transition-colors duration-200"
                  >
                    Chọn tất cả
                  </button>
                  <button
                    onClick={handleDeselectAllStudents}
                    className="px-3 h-10 bg-red-600 hover:bg-red-700 text-white text-sm rounded-lg transition-colors duration-200"
                  >
                    Bỏ chọn tất cả
                  </button>
                </div>

                {/* Thông tin cập nhật */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                      Số quyết định
                    </label>
                    <input
                      type="text"
                      value={bulkUpdateData.decisionNumber}
                      onChange={(e) =>
                        setBulkUpdateData((prev) => ({
                          ...prev,
                          decisionNumber: e.target.value,
                        }))
                      }
                      placeholder="Nhập số quyết định"
                      className="bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full h-10 px-3"
                    />
                  </div>

                  <div>
                    <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                      Xếp loại Đảng viên
                    </label>
                    <ConfigProvider
                      theme={{
                        algorithm: isDark
                          ? theme.darkAlgorithm
                          : theme.defaultAlgorithm,
                      }}
                    >
                      <Select
                        value={bulkUpdateData.partyRating}
                        onChange={(value) =>
                          setBulkUpdateData((prev) => ({
                            ...prev,
                            partyRating: value,
                          }))
                        }
                        placeholder="Chọn xếp loại Đảng viên"
                        size="large"
                        style={{ width: "100%" }}
                        options={[
                          { value: "", label: "Hãy chọn xếp loại Đảng viên" },
                          {
                            value: "HTXSNV",
                            label: "Hoàn thành xuất sắc nhiệm vụ",
                          },
                          { value: "HTTNV", label: "Hoàn thành tốt nhiệm vụ" },
                          { value: "HTNV", label: "Hoàn thành nhiệm vụ" },
                          {
                            value: "KHTNV",
                            label: "Không hoàn thành nhiệm vụ",
                          },
                        ]}
                      />
                    </ConfigProvider>
                  </div>
                </div>

                {/* Danh sách sinh viên */}
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                      Danh sách sinh viên Đảng viên (
                      {getFilteredStudentsForBulk().length})
                    </h3>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Đã chọn: {selectedStudentsForBulk.length} sinh viên
                    </div>
                  </div>

                  <div className="border border-gray-200 dark:border-gray-600 rounded-lg overflow-hidden">
                    <div className="max-h-64 overflow-y-auto">
                      {getFilteredStudentsForBulk().length > 0 ? (
                        getFilteredStudentsForBulk().map((student) => (
                          <div
                            key={student.id}
                            className={`flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 ${
                              selectedStudentsForBulk.includes(student.id)
                                ? "bg-blue-50 dark:bg-blue-900/20"
                                : ""
                            }`}
                          >
                            <div className="flex items-center space-x-3">
                              <input
                                type="checkbox"
                                checked={selectedStudentsForBulk.includes(
                                  student.id
                                )}
                                onChange={() => handleSelectStudent(student.id)}
                                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                              />
                              <div>
                                <div className="font-medium text-gray-900 dark:text-white">
                                  {student.fullName}
                                </div>
                                <div className="text-sm text-gray-500 dark:text-gray-400">
                                  {student.studentCode} - {student.className}
                                </div>
                              </div>
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {student.unit}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                          Không có sinh viên Đảng viên nào phù hợp với bộ lọc
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3 p-6 border-t border-gray-200 dark:border-gray-700">
              <button
                type="button"
                className="px-4 py-2 bg-gray-200 text-gray-500 rounded-lg hover:bg-gray-300 hover:text-gray-900"
                onClick={() => {
                  setShowBulkUpdateModal(false);
                  setSelectedStudentsForBulk([]);
                }}
              >
                Hủy
              </button>
              <button
                type="button"
                className="px-4 py-2 text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
                onClick={handleBulkSubmitUpdate}
                disabled={selectedStudentsForBulk.length === 0}
              >
                Cập nhật ({selectedStudentsForBulk.length} sinh viên)
              </button>
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

export default PartyRating;
