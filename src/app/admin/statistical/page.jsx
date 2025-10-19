"use client";

import axios from "axios";
import { useState, useEffect, useRef } from "react";
import Chart from "chart.js/auto";
import Link from "next/link";
import { Select } from "antd";
import { BASE_URL } from "@/configs";
const Statictical = () => {
  const chartRef1 = useRef(null);
  const chartRef2 = useRef(null);
  const chartRef3 = useRef(null);
  const [learningClassification, setLearningClassification] = useState([]);
  const [learningResultBySemester, setLearningResultBySemester] = useState([]);
  const [learningResultByYear, setLearningResultByYear] = useState({
    schoolYear: null,
    data: [],
  });
  const [classStatsByYear, setClassStatsByYear] = useState({
    schoolYear: null,
    data: [],
  });
  const [topStudentsLatestYear, setTopStudentsLatestYear] = useState({
    schoolYear: null,
    topStudents: [],
  });
  const [availableSchoolYears, setAvailableSchoolYears] = useState([]);
  const [selectedYear, setSelectedYear] = useState("");
  const [filterUnits, setFilterUnits] = useState([]);
  const [filterTrainingRating, setFilterTrainingRating] = useState([]);

  const fetchLearningClassification = async () => {
    const token = localStorage.getItem("token");

    if (token) {
      try {
        const res = await axios.get(
          `${BASE_URL}/commander/learningClassification`,
          {
            headers: {
              token: `Bearer ${token}`,
            },
          }
        );

        setLearningClassification(res.data);
      } catch (error) {
        console.log(error);
      }
    }
  };

  const fetchLearningResultBySemester = async () => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const res = await axios.get(
          `${BASE_URL}/commander/learningResultBySemester`,
          { headers: { token: `Bearer ${token}` } }
        );
        setLearningResultBySemester(res.data);
      } catch (error) {
        console.log(error);
      }
    }
  };

  // Lấy thống kê theo NĂM HỌC mới nhất và gom nhóm theo mức GPA
  const fetchLearningResultByYear = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      // Lấy danh sách năm học, chọn năm mới nhất
      const yearsRes = await axios.get(
        `${BASE_URL}/commander/yearlyResults/years`,
        { headers: { token: `Bearer ${token}` } }
      );
      const years = yearsRes.data?.years || [];
      setAvailableSchoolYears(years);
      const latestYear = years[0] || null;
      if (!selectedYear && latestYear) setSelectedYear(latestYear);
      if (!latestYear) {
        setLearningResultByYear({ schoolYear: null, data: [] });
        return;
      }

      // Lấy dữ liệu theo năm học mới nhất
      const resultsRes = await axios.get(
        `${BASE_URL}/commander/yearlyResults?schoolYear=${encodeURIComponent(
          latestYear
        )}`,
        { headers: { token: `Bearer ${token}` } }
      );
      const results = resultsRes.data?.results || [];

      // Gom nhóm theo thang điểm hệ 4 (giống biểu đồ theo học kỳ)
      const buckets = [
        { classification: "Yếu", count: 0 },
        { classification: "Trung bình", count: 0 },
        { classification: "Khá", count: 0 },
        { classification: "Giỏi", count: 0 },
        { classification: "Xuất sắc", count: 0 },
      ];

      results.forEach((r) => {
        const g = Number(r.averageGrade4 || 0);
        if (g <= 1.995) buckets[0].count++;
        else if (g <= 2.495) buckets[1].count++;
        else if (g <= 3.195) buckets[2].count++;
        else if (g <= 3.595) buckets[3].count++;
        else buckets[4].count++;
      });

      setLearningResultByYear({ schoolYear: latestYear, data: buckets });

      // Gom số lượng theo ĐƠN VỊ để vẽ biểu đồ theo đơn vị
      const classCountsMap = new Map();
      results.forEach((r) => {
        const unitName = r.unit || r.unitName || "Chưa có đơn vị";
        classCountsMap.set(unitName, (classCountsMap.get(unitName) || 0) + 1);
      });
      // Bảo đảm luôn đủ 6 đơn vị theo thứ tự cố định
      const expectedUnits = [
        "L1 - H5",
        "L2 - H5",
        "L3 - H5",
        "L4 - H5",
        "L5 - H5",
        "L6 - H5",
      ];
      const classData = expectedUnits.map((unit) => ({
        className: unit,
        count: classCountsMap.get(unit) || 0,
      }));
      setClassStatsByYear({ schoolYear: latestYear, data: classData });
    } catch (error) {
      console.log(error);
    }
  };

  const fetchTopStudentsLatestYear = async (year) => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const url = `${BASE_URL}/commander/topStudents/latestYear${
          year ? `?schoolYear=${encodeURIComponent(year)}` : ""
        }`;
        const res = await axios.get(url, {
          headers: { token: `Bearer ${token}` },
        });
        setTopStudentsLatestYear(
          res.data || { schoolYear: null, topStudents: [] }
        );
      } catch (error) {
        console.log(error);
      }
    }
  };

  useEffect(() => {
    fetchLearningClassification();
    fetchLearningResultBySemester();
    fetchLearningResultByYear();
    // sẽ gọi sau khi selectedYear có giá trị
  }, []);

  useEffect(() => {
    if (selectedYear) {
      fetchTopStudentsLatestYear(selectedYear);
    }
  }, [selectedYear]);

  useEffect(() => {
    const ctx2 = document.getElementById("acquisitions2").getContext("2d");

    if (chartRef2.current !== null) {
      chartRef2.current.destroy();
    }
    if (chartRef3.current !== null) {
      chartRef3.current.destroy();
    }

    chartRef2.current = new Chart(ctx2, {
      type: "bar",
      data: {
        labels:
          learningResultByYear?.data?.map((row) => row.classification) || [],
        datasets: [
          {
            label: "Số học viên",
            data: learningResultByYear?.data?.map((row) => row.count) || [],
            backgroundColor: "rgba(255, 99, 132, 0.2)",
            borderColor: "rgba(255, 99, 132, 1)",
            borderWidth: 1,
          },
        ],
      },
      options: {
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              stepSize: 1,
            },
          },
        },
      },
    });

    // Biểu đồ theo đơn vị
    const ctx3 = document.getElementById("acquisitions3").getContext("2d");
    chartRef3.current = new Chart(ctx3, {
      type: "bar",
      data: {
        labels: classStatsByYear?.data?.map((row) => row.className) || [],
        datasets: [
          {
            label: "Số học viên theo đơn vị",
            data: classStatsByYear?.data?.map((row) => row.count) || [],
            backgroundColor: "rgba(99, 102, 241, 0.2)",
            borderColor: "rgba(99, 102, 241, 1)",
            borderWidth: 1,
          },
        ],
      },
      options: {
        scales: {
          y: {
            beginAtZero: true,
            ticks: { stepSize: 1 },
          },
        },
      },
    });

    return () => {
      if (chartRef2.current !== null) {
        chartRef2.current.destroy();
      }
      if (chartRef3.current !== null) {
        chartRef3.current.destroy();
      }
    };
  }, [learningResultByYear, classStatsByYear]);

  const handleExportFileWord = async (e, maxSemester) => {
    e.preventDefault();
    const token = localStorage.getItem("token");

    if (token) {
      try {
        const response = await axios.get(
          `${BASE_URL}/commander/listSuggestedReward/word`,
          {
            headers: {
              token: `Bearer ${token}`,
            },
            responseType: "blob",
          }
        );

        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute(
          "download",
          `Danh_sach_goi_y_khen_thuong_hoc_ky_${maxSemester}.docx`
        );
        document.body.appendChild(link);
        link.click();
        link.parentNode.removeChild(link);
      } catch (error) {
        console.error("Lỗi tải xuống file", error);
      }
    }
  };

  const handleExportTuitionFeeWord = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");

    if (token) {
      try {
        const params = new URLSearchParams();

        if (selectedSemester && selectedSemester !== "all") {
          params.append("semester", selectedSemester);
        }

        if (selectedSchoolYear && selectedSchoolYear !== "all") {
          params.append("schoolYear", selectedSchoolYear);
        }

        if (selectedUnit && selectedUnit !== "all") {
          params.append("unit", selectedUnit);
        }

        const response = await axios.get(
          `${BASE_URL}/commander/tuitionFee/word?${params.toString()}`,
          {
            headers: {
              token: `Bearer ${token}`,
            },
            responseType: "blob",
          }
        );

        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement("a");
        link.href = url;

        // Tạo tên file động
        let fileName = "Thong_ke_hoc_phi_he_hoc_vien_5";

        if (selectedSemester && selectedSemester !== "all") {
          fileName += `_${selectedSemester}`;
        } else {
          fileName += "_tat_ca_hoc_ky";
        }

        if (selectedSchoolYear && selectedSchoolYear !== "all") {
          fileName += `_${selectedSchoolYear}`;
        } else {
          fileName += "_tat_ca_nam_hoc";
        }

        if (selectedUnit && selectedUnit !== "all") {
          fileName += `_${selectedUnit}`;
        } else {
          fileName += "_tat_ca_don_vi";
        }

        fileName += ".docx";

        link.setAttribute("download", fileName);
        document.body.appendChild(link);
        link.click();
        link.parentNode.removeChild(link);
      } catch (error) {
        console.error("Lỗi tải xuống file Word", error);
      }
    }
  };

  return (
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
                    Thống kê
                  </div>
                </div>
              </li>
            </ol>
          </nav>
        </div>
        <div className="w-full pt-8 pb-5 pl-5 pr-6 mb-2">
          <div className="bg-white dark:bg-gray-800 rounded-lg w-full shadow-lg">
            <div className="flex justify-between font-bold p-5 border-b border-gray-200 dark:border-gray-600">
              <div className="text-gray-900 dark:text-white text-lg">
                <h1 className="text-2xl font-bold">THỐNG KÊ KẾT QUẢ HỌC TẬP</h1>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Quản lý và xem thống kê kết quả học tập của tất cả học viên
                </p>
              </div>
            </div>
            <div className="flex px-6 py-6 justify-around">
              <div className="text-center">
                <canvas id="acquisitions2" width="450" height="395"></canvas>
                <div className="text-sm font-bold text-red-600 dark:text-red-400 pt-2 pb-1">
                  Biểu đồ thống kê kết quả học tập theo năm học{" "}
                  {learningResultByYear?.schoolYear || "-"}
                </div>
              </div>
              <div className="text-center ml-8">
                <canvas id="acquisitions3" width="450" height="395"></canvas>
                <div className="text-sm font-bold text-indigo-600 dark:text-indigo-400 pt-2 pb-1">
                  Biểu đồ thống kê số lượng theo đơn vị năm{" "}
                  {classStatsByYear?.schoolYear || "-"}
                </div>
              </div>
            </div>
            {/* Top sinh viên theo lớp - theo năm học */}
            <div className="my-2 mx-5 pb-6">
              <div className="font-bold text-gray-900 dark:text-white mb-3">
                Danh sách đề xuất khen thưởng học viên - Năm học{" "}
                {topStudentsLatestYear?.schoolYear || "-"}
              </div>
              <div className="flex items-center gap-3 flex-wrap mb-3">
                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                    Năm học
                  </label>
                  <Select
                    value={selectedYear}
                    onChange={(val) => setSelectedYear(val)}
                    placeholder="Chọn năm học"
                    style={{ width: 260, height: 36 }}
                    options={(availableSchoolYears || []).map((y) => ({
                      value: y,
                      label: y,
                    }))}
                  />
                </div>
                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                    Đơn vị
                  </label>
                  <Select
                    mode="multiple"
                    allowClear
                    value={filterUnits}
                    onChange={(vals) => setFilterUnits(vals)}
                    placeholder="Chọn đơn vị"
                    style={{ width: 320, height: 36 }}
                    options={Array.from(
                      new Set(
                        (topStudentsLatestYear?.topStudents || []).map(
                          (x) => x.unit
                        )
                      )
                    )
                      .filter(Boolean)
                      .map((u) => ({ value: u, label: u }))}
                  />
                </div>
                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                    Kết quả rèn luyện
                  </label>
                  <Select
                    mode="multiple"
                    allowClear
                    value={filterTrainingRating}
                    onChange={(vals) => setFilterTrainingRating(vals)}
                    placeholder="Chọn kết quả rèn luyện"
                    style={{ width: 320, height: 36 }}
                    options={Array.from(
                      new Set(
                        (topStudentsLatestYear?.topStudents || []).map(
                          (x) => x.trainingRating
                        )
                      )
                    )
                      .filter(Boolean)
                      .map((rating) => ({ value: rating, label: rating }))}
                  />
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full border border-gray-200 dark:border-gray-700 text-center text-sm font-light text-gray-900 dark:text-white rounded-lg">
                  <thead className="bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600">
                    <tr>
                      <th className="border-r border-gray-200 dark:border-gray-600 py-3 px-4 text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                        STT
                      </th>
                      <th className="border-r border-gray-200 dark:border-gray-600 py-3 px-4 text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                        Họ và tên
                      </th>
                      <th className="border-r border-gray-200 dark:border-gray-600 py-3 px-4 text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                        Lớp
                      </th>
                      <th className="border-r border-gray-200 dark:border-gray-600 py-3 px-4 text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                        Đơn vị
                      </th>
                      <th className="border-r border-gray-200 dark:border-gray-600 py-3 px-4 text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                        Điểm TB hệ 4
                      </th>
                      <th className="border-r border-gray-200 dark:border-gray-600 py-3 px-4 text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                        Điểm TB hệ 10
                      </th>
                      <th className="py-3 px-4 text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                        Kết quả rèn luyện
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800">
                    {(topStudentsLatestYear?.topStudents || [])
                      .filter((i) => {
                        const unitMatch =
                          filterUnits.length === 0 ||
                          filterUnits.includes(i.unit);
                        const ratingMatch =
                          filterTrainingRating.length === 0 ||
                          filterTrainingRating.includes(i.trainingRating);
                        return unitMatch && ratingMatch;
                      })
                      .map((item, index) => (
                        <tr
                          key={`${item.classId}-${item.studentId}`}
                          className="border-b border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
                        >
                          <td className="whitespace-nowrap font-medium border-r border-gray-200 dark:border-gray-600 py-4 px-4">
                            {index + 1}
                          </td>
                          <td className="whitespace-nowrap font-medium border-r border-gray-200 dark:border-gray-600 py-4 px-4">
                            {item.fullName}
                          </td>
                          <td className="whitespace-nowrap font-medium border-r border-gray-200 dark:border-gray-600 py-4 px-4">
                            {item.className}
                          </td>
                          <td className="whitespace-nowrap font-medium border-r border-gray-200 dark:border-gray-600 py-4 px-4">
                            {item.unit}
                          </td>
                          <td className="whitespace-nowrap font-medium border-r border-gray-200 dark:border-gray-600 py-4 px-4">
                            {item.averageGrade4?.toFixed?.(2) ??
                              item.averageGrade4}
                          </td>
                          <td className="whitespace-nowrap font-medium border-r border-gray-200 dark:border-gray-600 py-4 px-4">
                            {item.averageGrade10?.toFixed?.(2) ??
                              item.averageGrade10}
                          </td>
                          <td className="whitespace-nowrap font-medium py-4 px-4">
                            {item.trainingRating || "Chưa có dữ liệu"}
                          </td>
                        </tr>
                      ))}
                    {(!topStudentsLatestYear?.topStudents ||
                      topStudentsLatestYear.topStudents.length === 0) && (
                      <tr>
                        <td colSpan={7} className="py-4 px-4 text-gray-400">
                          Không có dữ liệu
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
    </div>
  );
};

export default Statictical;
