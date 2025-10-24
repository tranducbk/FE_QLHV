"use client";

import axios from "axios";
import Link from "next/link";
import { jwtDecode } from "jwt-decode";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import SideBar from "@/components/sidebar";
import { ConfigProvider, TreeSelect, Select, theme } from "antd";
import { handleNotify } from "../../../components/notify";
import Loader from "@/components/loader";
import { useLoading } from "@/hooks";

import { BASE_URL } from "@/configs";
const TuitionFees = () => {
  const router = useRouter();
  const [tuitionFees, setTuitionFees] = useState(null);
  const [selectedSemesters, setSelectedSemesters] = useState([]); // nhiều học kỳ
  const [semesters, setSemesters] = useState([]);
  const [selectedClass, setSelectedClass] = useState(""); // lọc theo lớp
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportSelectedSemesters, setExportSelectedSemesters] = useState([]);
  const [exportSelectedUnits, setExportSelectedUnits] = useState([]);
  // Danh sách đơn vị cố định
  const units = [
    { id: "1", unitName: "L1 - H5" },
    { id: "2", unitName: "L2 - H5" },
    { id: "3", unitName: "L3 - H5" },
    { id: "4", unitName: "L4 - H5" },
    { id: "5", unitName: "L5 - H5" },
    { id: "6", unitName: "L6 - H5" },
  ];
  const [paymentStats, setPaymentStats] = useState({
    paidCount: 0,
    unpaidCount: 0,
    paidSum: 0,
    unpaidSum: 0,
  });
  const [isDark, setIsDark] = useState(false);
  const { loading, withLoading } = useLoading(true);

  const getSemesterLabel = (s) => {
    if (!s) return "";
    const code = s.code || "";
    // code có thể là HK1/HK2/HK3 hoặc dạng năm.kỳ cũ
    if (code.startsWith("HK")) {
      return s.schoolYear ? `${code} - ${s.schoolYear}` : code;
    }
    const parts = code.split(".");
    const term = parts.length > 1 ? parts[1] : "";
    return s.schoolYear && term ? `HK${term} - ${s.schoolYear}` : code;
  };

  const compareSemestersDesc = (a, b) => {
    const parse = (s) => {
      const code = s.code || "";
      if (code.startsWith("HK")) {
        const term = parseInt(code.replace("HK", "")) || 0;
        // schoolYear dạng "2023-2024" → lấy năm sau làm chuẩn
        let year = 0;
        if (s.schoolYear && typeof s.schoolYear === "string") {
          const m = s.schoolYear.match(/(\d{4})\D*(\d{4})/);
          year = m ? parseInt(m[2]) : 0;
        }
        return { year, term };
      }
      if (code.includes(".")) {
        const [y, t] = code.split(".");
        return { year: parseInt(y) || 0, term: parseInt(t) || 0 };
      }
      return { year: 0, term: 0 };
    };
    const pa = parse(a);
    const pb = parse(b);
    if (pb.year !== pa.year) return pb.year - pa.year;
    return pb.term - pa.term;
  };

  // Màu trạng thái học phí
  const getStatusClasses = (status) => {
    const s = String(status || "").toLowerCase();
    const isPaid = s.includes("đã thanh toán") || s.includes("đã đóng");
    const isUnpaid = s.includes("chưa thanh toán") || s.includes("chưa đóng");
    const isPending =
      s.includes("chờ") || s.includes("pending") || s.includes("đang xử lý");
    if (isPaid)
      return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
    if (isUnpaid)
      return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
    if (isPending)
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
    return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200";
  };

  const isPaidStatus = (status) => {
    const s = String(status || "").toLowerCase();
    return s.includes("đã thanh toán") || s.includes("đã đóng");
  };

  const isUnpaidStatus = (status) => {
    const s = String(status || "").toLowerCase();
    return s.includes("chưa thanh toán") || s.includes("chưa đóng");
  };

  const fetchTuitionFees = async () => {
    const token = localStorage.getItem("token");

    if (token) {
      try {
        const url = `${BASE_URL}/commander/tuitionFees`; // luôn lấy tất cả, lọc client-side
        const res = await axios.get(url, {
          headers: {
            token: `Bearer ${token}`,
          },
        });

        setTuitionFees(res.data);
        // stats sẽ tính lại trong useEffect theo bộ lọc
      } catch (error) {
      }
    }
  };

  useEffect(() => {
    const init = async () => {
      await withLoading(async () => {
        await fetchSemesters();
        await fetchTuitionFees();
      });
    };
    init();
  }, [withLoading]);

  // Theo dõi chế độ dark/light để đồng bộ màu AntD
  useEffect(() => {
    const root = document.documentElement;
    const update = () => setIsDark(root.classList.contains("dark"));
    update();
    const observer = new MutationObserver(update);
    observer.observe(root, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  const fetchSemesters = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      const res = await axios.get(`${BASE_URL}/semester`, {
        headers: { token: `Bearer ${token}` },
      });
      const list = res.data || [];
      const sorted = [...list].sort(compareSemestersDesc);
      setSemesters(sorted);
      // Mặc định không chọn (hiển thị tất cả)
    } catch (error) {
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    router.push(`/admin/tuition-fees`);
    const token = localStorage.getItem("token");

    if (token) {
      try {
        const url = `${BASE_URL}/commander/tuitionFees`;
        const res = await axios.get(url, {
          headers: {
            token: `Bearer ${token}`,
          },
        });

        if (res.status === 404) setTuitionFees([]);

        setTuitionFees(res.data);
        // stats sẽ tính lại theo bộ lọc phía dưới
      } catch (error) {
      }
    }
  };

  // Lọc theo nhiều học kỳ và lớp (nếu có chọn)
  const applySemesterFilter = (list) => {
    if (!Array.isArray(list)) return [];

    let filtered = list;

    // Lọc theo học kỳ
    if (selectedSemesters && selectedSemesters.length > 0) {
      const selectedSemesterData = selectedSemesters.map((semesterId) => {
        const semester = semesters.find((s) => s.id === semesterId);
        return {
          code: semester?.code,
          schoolYear: semester?.schoolYear,
        };
      });

      filtered = filtered.filter((item) => {
        return selectedSemesterData.some(
          (selected) =>
            selected.code === item.semester &&
            selected.schoolYear === item.schoolYear
        );
      });
    }

    // Lọc theo lớp
    if (selectedClass && selectedClass !== "Tất cả các lớp") {
      filtered = filtered.filter((item) => {
        return item.unit === selectedClass;
      });
    }

    return filtered;
  };

  // Tính lại thống kê khi dữ liệu hoặc bộ lọc thay đổi
  useEffect(() => {
    const list = applySemesterFilter(tuitionFees?.tuitionFees || []);
    const parseAmount = (v) => {
      const digits = String(v || "").replace(/[^0-9]/g, "");
      return digits ? parseInt(digits, 10) : 0;
    };
    let paidCount = 0,
      unpaidCount = 0,
      paidSum = 0,
      unpaidSum = 0;
    list.forEach((item) => {
      const s = String(item.status || "").toLowerCase();
      const amt = parseAmount(item.totalAmount);
      if (s.includes("đã thanh toán") || s.includes("đã đóng")) {
        paidCount += 1;
        paidSum += amt;
      } else if (s.includes("chưa thanh toán") || s.includes("chưa đóng")) {
        unpaidCount += 1;
        unpaidSum += amt;
      }
    });
    setPaymentStats({ paidCount, unpaidCount, paidSum, unpaidSum });
  }, [selectedSemesters, selectedClass, tuitionFees]);

  const filteredTuitionFees = applySemesterFilter(
    tuitionFees?.tuitionFees || []
  ).sort((a, b) => {
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

    // 2. Trong cùng đơn vị, sắp xếp theo tên học viên
    if (a.fullName !== b.fullName) {
      return a.fullName.localeCompare(b.fullName, "vi");
    }

    // 3. Trong cùng học viên, sắp xếp theo năm học (mới đến cũ)
    const yearA = a.schoolYear || "";
    const yearB = b.schoolYear || "";
    if (yearA !== yearB) {
      return yearB.localeCompare(yearA); // Năm mới trước
    }

    // 4. Trong cùng năm học, sắp xếp theo học kỳ (HK1, HK2, HK3)
    const semesterOrder = {
      HK1: 1,
      HK2: 2,
      HK3: 3,
    };
    const semesterA = semesterOrder[a.semester] || 999;
    const semesterB = semesterOrder[b.semester] || 999;
    return semesterA - semesterB;
  });
  const filteredTotalSum = filteredTuitionFees.reduce((sum, item) => {
    const digits = String(item.totalAmount || "").replace(/[^0-9]/g, "");
    const val = digits ? parseInt(digits, 10) : 0;
    return sum + val;
  }, 0);

  const updatePaymentStatus = async (studentId, feeId, nextStatus) => {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      const res = await axios.put(
        `${BASE_URL}/commander/${studentId}/tuitionFee/${feeId}/status`,
        { status: nextStatus },
        { headers: { token: `Bearer ${token}` } }
      );
      await fetchTuitionFees();
      const message = res?.data?.message || "Cập nhật trạng thái thành công";
      handleNotify("success", "Thành công!", `${message}: ${nextStatus}`);
    } catch (e) {
      const errorMessage =
        e?.response?.data?.message ||
        e?.response?.data ||
        "Không thể cập nhật trạng thái học phí";
      handleNotify("error", "Lỗi!", errorMessage);
    }
  };

  const formatNumberWithCommas = (number) => {
    if (number == null) {
      return "0";
    }
    // Chuyển đổi số thành chuỗi
    let numStr = number.toString();

    // Tách chuỗi thành các mảng con với 3 ký tự
    let parts = [];
    while (numStr.length > 3) {
      parts.unshift(numStr.slice(-3));
      numStr = numStr.slice(0, -3);
    }
    parts.unshift(numStr);

    return parts.join(".");
  };

  const handleExportFilePdf = async () => {
    const token = localStorage.getItem("token");

    if (token) {
      try {
        // Tạo tham số cho API
        const semesterParam =
          exportSelectedSemesters.length > 0
            ? exportSelectedSemesters
                .map((semesterId) => {
                  const semester = semesters.find((s) => s.id === semesterId);
                  return semester?.code;
                })
                .join(",")
            : "all";

        const schoolYearParam =
          exportSelectedSemesters.length > 0
            ? exportSelectedSemesters
                .map((semesterId) => {
                  const semester = semesters.find((s) => s.id === semesterId);
                  return semester?.schoolYear;
                })
                .filter(Boolean)
                .join(",")
            : "all";

        const unitParam =
          exportSelectedUnits.length > 0
            ? exportSelectedUnits.join(",")
            : "all";

          semesterParam,
          schoolYearParam,
          unitParam,
          exportSelectedSemesters,
          exportSelectedUnits,
        });

        const response = await axios.get(
          `${BASE_URL}/commander/tuitionFee/pdf?semester=${semesterParam}&schoolYear=${schoolYearParam}&unit=${unitParam}`,
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
        // Tạo tên file động dựa trên các tham số được chọn
        let fileName = "Thong_ke_hoc_phi_he_hoc_vien_5";

        // Thêm thông tin học kỳ
        if (exportSelectedSemesters.length > 0) {
          const semesterCodes = exportSelectedSemesters
            .map((semesterId) => {
              const semester = semesters.find((s) => s.id === semesterId);
              return semester?.code;
            })
            .filter(Boolean);
          fileName += `_${semesterCodes.join("_")}`;
        } else {
          fileName += "_tat_ca_hoc_ky";
        }

        // Thêm thông tin năm học
        if (exportSelectedSemesters.length > 0) {
          const schoolYears = exportSelectedSemesters
            .map((semesterId) => {
              const semester = semesters.find((s) => s.id === semesterId);
              return semester?.schoolYear;
            })
            .filter(Boolean);
          // Loại bỏ các năm học trùng lặp
          const uniqueSchoolYears = [...new Set(schoolYears)];
          fileName += `_${uniqueSchoolYears.join("_")}`;
        } else {
          fileName += "_tat_ca_nam_hoc";
        }

        // Thêm thông tin đơn vị
        if (exportSelectedUnits.length > 0) {
          fileName += `_${exportSelectedUnits.join("_")}`;
        } else {
          fileName += "_tat_ca_don_vi";
        }

        fileName += ".pdf";

        link.setAttribute("download", fileName);
        document.body.appendChild(link);
        link.click();
        link.parentNode.removeChild(link);

        // Đóng modal và reset
        setShowExportModal(false);
        setExportSelectedSemesters([]);
        setExportSelectedUnits([]);

        handleNotify("success", "Thành công", "Đã xuất file PDF");
      } catch (error) {
        console.error("Lỗi tải xuống file", error);
        handleNotify("error", "Lỗi", "Không thể xuất file PDF");
      }
    }
  };

  const handleExportFileWord = async () => {
    const token = localStorage.getItem("token");

    if (token) {
      try {
        // Tạo tham số cho API
        const semesterParam =
          exportSelectedSemesters.length > 0
            ? exportSelectedSemesters
                .map((semesterId) => {
                  const semester = semesters.find((s) => s.id === semesterId);
                  return semester?.code;
                })
                .join(",")
            : "all";

        const schoolYearParam =
          exportSelectedSemesters.length > 0
            ? exportSelectedSemesters
                .map((semesterId) => {
                  const semester = semesters.find((s) => s.id === semesterId);
                  return semester?.schoolYear;
                })
                .filter(Boolean)
                .join(",")
            : "all";

        const unitParam =
          exportSelectedUnits.length > 0
            ? exportSelectedUnits.join(",")
            : "all";

          semesterParam,
          schoolYearParam,
          unitParam,
          exportSelectedSemesters,
          exportSelectedUnits,
        });

        const response = await axios.get(
          `${BASE_URL}/commander/tuitionFee/word?semester=${semesterParam}&schoolYear=${schoolYearParam}&unit=${unitParam}`,
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

        // Tạo tên file động dựa trên các tham số được chọn
        let fileName = "Thong_ke_hoc_phi_he_hoc_vien_5";

        // Thêm thông tin học kỳ
        if (exportSelectedSemesters.length > 0) {
          const semesterCodes = exportSelectedSemesters
            .map((semesterId) => {
              const semester = semesters.find((s) => s.id === semesterId);
              return semester?.code;
            })
            .filter(Boolean);
          fileName += `_${semesterCodes.join("_")}`;
        } else {
          fileName += "_tat_ca_hoc_ky";
        }

        // Thêm thông tin năm học
        if (exportSelectedSemesters.length > 0) {
          const schoolYears = exportSelectedSemesters
            .map((semesterId) => {
              const semester = semesters.find((s) => s.id === semesterId);
              return semester?.schoolYear;
            })
            .filter(Boolean);
          // Loại bỏ các năm học trùng lặp
          const uniqueSchoolYears = [...new Set(schoolYears)];
          fileName += `_${uniqueSchoolYears.join("_")}`;
        } else {
          fileName += "_tat_ca_nam_hoc";
        }

        // Thêm thông tin đơn vị
        if (exportSelectedUnits.length > 0) {
          fileName += `_${exportSelectedUnits.join("_")}`;
        } else {
          fileName += "_tat_ca_don_vi";
        }

        fileName += ".docx";

        link.setAttribute("download", fileName);
        document.body.appendChild(link);
        link.click();
        link.parentNode.removeChild(link);

        // Đóng modal và reset
        setShowExportModal(false);
        setExportSelectedSemesters([]);
        setExportSelectedUnits([]);

        handleNotify("success", "Thành công", "Đã xuất file Word");
      } catch (error) {
        console.error("Lỗi tải xuống file Word", error);
        handleNotify("error", "Lỗi", "Không thể xuất file Word");
      }
    }
  };

  // semesters đã được sort mới → cũ
  const treeData = semesters.map((s) => ({
    title: getSemesterLabel(s),
    value: s.id,
    key: s.id,
  }));

  if (loading) {
    return <Loader text="Đang tải dữ liệu học phí..." />;
  }

  return (
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
                    Học phí học viên
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
                <h1 className="text-2xl font-bold">HỌC PHÍ HỌC VIÊN</h1>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Quản lý và xem học phí của tất cả học viên
                </p>
              </div>
              <button
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 border border-blue-600 hover:border-blue-700 rounded-lg transition-colors duration-200 flex items-center"
                onClick={() => setShowExportModal(true)}
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
                Xuất File
              </button>
            </div>
            <div className="w-full p-5">
              <form
                className="flex items-center gap-3 flex-wrap"
                onSubmit={(e) => handleSubmit(e)}
              >
                <div>
                  <label
                    htmlFor="semester"
                    className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    Chọn học kỳ
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
                    <TreeSelect
                      treeData={treeData}
                      treeCheckable
                      showCheckedStrategy={TreeSelect.SHOW_PARENT}
                      placeholder="Chọn học kỳ"
                      allowClear
                      showSearch={false}
                      style={{ width: 260, height: 36 }}
                      dropdownStyle={{
                        backgroundColor: isDark ? "#1f2937" : "#ffffff",
                        color: isDark ? "#e5e7eb" : "#111827",
                        border: `1px solid ${isDark ? "#374151" : "#e5e7eb"}`,
                        borderRadius: 8,
                      }}
                      tagRender={(props) => {
                        const { label, onClose } = props;
                        return (
                          <span
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-200 mr-1 mb-1"
                            onMouseDown={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                            }}
                          >
                            <span className="text-xs">{label}</span>
                            <button
                              onClick={onClose}
                              className="text-blue-600 hover:text-blue-800 dark:text-blue-300 dark:hover:text-blue-200"
                              aria-label="remove"
                            >
                              ×
                            </button>
                          </span>
                        );
                      }}
                      onChange={(values) => setSelectedSemesters(values)}
                    />
                  </ConfigProvider>
                </div>
                <div>
                  <label
                    htmlFor="class"
                    className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    Chọn lớp
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
                      placeholder="Chọn lớp"
                      allowClear
                      style={{ width: 160, height: 36 }}
                      value={selectedClass || undefined}
                      onChange={(value) => setSelectedClass(value || "")}
                      dropdownStyle={{
                        backgroundColor: isDark ? "#1f2937" : "#ffffff",
                        color: isDark ? "#e5e7eb" : "#111827",
                        border: `1px solid ${isDark ? "#374151" : "#e5e7eb"}`,
                        borderRadius: 8,
                      }}
                      options={[
                        { value: "Tất cả các lớp", label: "Tất cả các lớp" },
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
              </form>
            </div>
            {filteredTuitionFees.length > 0 && (
              <div className="w-full px-5 pb-3">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                    <div className="text-blue-800 dark:text-blue-200 font-semibold text-sm">
                      Tổng học phí (
                      {selectedSemesters.length > 0
                        ? `${selectedSemesters.length} học kỳ`
                        : "Tất cả"}
                      )
                    </div>
                    <div className="text-blue-900 dark:text-blue-100 font-bold text-xl mt-1">
                      {formatNumberWithCommas(filteredTotalSum)}đ
                    </div>
                  </div>
                  <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                    <div className="text-green-800 dark:text-green-200 font-semibold text-sm">
                      Đã thanh toán
                    </div>
                    <div className="flex items-end justify-between mt-1">
                      <div className="text-green-900 dark:text-green-100 font-bold text-xl">
                        {formatNumberWithCommas(paymentStats.paidSum)}đ
                      </div>
                      <div className="text-xs text-green-700 dark:text-green-300">
                        {paymentStats.paidCount} sinh viên
                      </div>
                    </div>
                  </div>
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                    <div className="text-red-800 dark:text-red-200 font-semibold text-sm">
                      Chưa thanh toán
                    </div>
                    <div className="flex items-end justify-between mt-1">
                      <div className="text-red-900 dark:text-red-100 font-bold text-xl">
                        {formatNumberWithCommas(paymentStats.unpaidSum)}đ
                      </div>
                      <div className="text-xs text-red-700 dark:text-red-300">
                        {paymentStats.unpaidCount} sinh viên
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div className="w-full p-5">
              <div className="overflow-x-auto">
                <table className="table-auto w-full divide-y divide-gray-200 dark:divide-gray-700 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th
                        scope="col"
                        className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider border-r border-gray-200 dark:border-gray-600 whitespace-nowrap"
                      >
                        ĐƠN VỊ
                      </th>
                      <th
                        scope="col"
                        className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider border-r border-gray-200 dark:border-gray-600 whitespace-nowrap"
                      >
                        HỌ VÀ TÊN
                      </th>
                      <th
                        scope="col"
                        className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider border-r border-gray-200 dark:border-gray-600 whitespace-nowrap"
                      >
                        TRƯỜNG
                      </th>
                      <th
                        scope="col"
                        className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider border-r border-gray-200 dark:border-gray-600 whitespace-nowrap"
                      >
                        HỌC KỲ
                      </th>
                      <th
                        scope="col"
                        className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider border-r border-gray-200 dark:border-gray-600 whitespace-nowrap"
                      >
                        LOẠI TIỀN
                      </th>
                      <th
                        scope="col"
                        className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider border-r border-gray-200 dark:border-gray-600 whitespace-nowrap"
                      >
                        SỐ TIỀN
                      </th>
                      <th
                        scope="col"
                        className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider whitespace-nowrap border-r border-gray-200 dark:border-gray-600"
                      >
                        TRẠNG THÁI
                      </th>
                      <th
                        scope="col"
                        className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider whitespace-nowrap"
                      >
                        CẬP NHẬT
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {filteredTuitionFees && filteredTuitionFees.length > 0 ? (
                      filteredTuitionFees.map((item) => (
                        <tr
                          key={item.id}
                          className="hover:bg-gray-50 dark:hover:bg-gray-700"
                        >
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white border-r border-gray-200 dark:border-gray-600 text-center">
                            {item.unit || "Chưa có lớp"}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white border-r border-gray-200 dark:border-gray-600 text-center">
                            {item.fullName}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white border-r border-gray-200 dark:border-gray-600 text-center">
                            {item.university}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white border-r border-gray-200 dark:border-gray-600 text-center">
                            <div className="font-medium">
                              {item.semester || "Chưa có học kỳ"}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              {item.schoolYear || "Chưa có năm học"}
                            </div>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white border-r border-gray-200 dark:border-gray-600 text-center">
                            {item.content}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white border-r border-gray-200 dark:border-gray-600 text-center font-medium">
                            {formatNumberWithCommas(item.totalAmount)}đ
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-center border-r border-gray-200 dark:border-gray-600">
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusClasses(
                                item.status
                              )}`}
                            >
                              {item.status}
                            </span>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-center">
                            <div className="flex flex-col gap-1">
                              <button
                                type="button"
                                onClick={() => {
                                  if (isPaidStatus(item.status)) {
                                    handleNotify(
                                      "warning",
                                      "Không hợp lệ",
                                      "Mục này đã ở trạng thái 'Đã thanh toán'"
                                    );
                                    return;
                                  }
                                  updatePaymentStatus(
                                    item.studentId,
                                    item.id,
                                    "Đã thanh toán"
                                  );
                                }}
                                className={`px-3 py-1 text-xs font-medium rounded-md border transition-colors duration-200 ${
                                  isPaidStatus(item.status)
                                    ? "bg-green-600/50 text-white/70 border-green-600 cursor-not-allowed"
                                    : "text-white bg-green-600 hover:bg-green-700 border-green-600"
                                }`}
                                disabled={isPaidStatus(item.status)}
                              >
                                Đã thanh toán
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  if (isUnpaidStatus(item.status)) {
                                    handleNotify(
                                      "warning",
                                      "Không hợp lệ",
                                      "Mục này đã ở trạng thái 'Chưa thanh toán'"
                                    );
                                    return;
                                  }
                                  updatePaymentStatus(
                                    item.studentId,
                                    item.id,
                                    "Chưa thanh toán"
                                  );
                                }}
                                className={`px-3 py-1 text-xs font-medium rounded-md border transition-colors duration-200 ${
                                  isUnpaidStatus(item.status)
                                    ? "bg-red-600/50 text-white/70 border-red-600 cursor-not-allowed"
                                    : "text-white bg-red-600 hover:bg-red-700 border-red-600"
                                }`}
                                disabled={isUnpaidStatus(item.status)}
                              >
                                Chưa thanh toán
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
                                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                              />
                            </svg>
                            <p className="text-lg font-medium">
                              Không có dữ liệu
                            </p>
                            <p className="text-sm">
                              Không tìm thấy thông tin học phí nào
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

      {/* Modal xuất PDF */}
      {showExportModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
          <div className="bg-black bg-opacity-50 inset-0 fixed"></div>
          <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Xuất PDF học phí
              </h2>
              <button
                onClick={() => {
                  setShowExportModal(false);
                  setExportSelectedSemesters([]);
                  setExportSelectedUnits([]);
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
              <div className="space-y-6">
                {/* Chọn học kỳ */}
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    Chọn học kỳ
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
                    <TreeSelect
                      treeData={treeData}
                      treeCheckable
                      showCheckedStrategy={TreeSelect.SHOW_PARENT}
                      placeholder="Chọn học kỳ để xuất PDF"
                      allowClear
                      showSearch={false}
                      style={{ width: "100%" }}
                      dropdownStyle={{
                        backgroundColor: isDark ? "#1f2937" : "#ffffff",
                        color: isDark ? "#e5e7eb" : "#111827",
                        border: `1px solid ${isDark ? "#374151" : "#e5e7eb"}`,
                        borderRadius: 8,
                      }}
                      tagRender={(props) => {
                        const { label, onClose } = props;
                        return (
                          <span
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-200 mr-1 mb-1"
                            onMouseDown={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                            }}
                          >
                            <span className="text-xs">{label}</span>
                            <button
                              onClick={onClose}
                              className="text-blue-600 hover:text-blue-800 dark:text-blue-300 dark:hover:text-blue-200"
                              aria-label="remove"
                            >
                              ×
                            </button>
                          </span>
                        );
                      }}
                      onChange={(values) => setExportSelectedSemesters(values)}
                    />
                  </ConfigProvider>
                </div>

                {/* Chọn lớp */}
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    Chọn đơn vị
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
                      mode="multiple"
                      placeholder="Chọn đơn vị để xuất PDF"
                      allowClear
                      style={{ width: "100%" }}
                      value={exportSelectedUnits}
                      onChange={setExportSelectedUnits}
                      dropdownStyle={{
                        backgroundColor: isDark ? "#1f2937" : "#ffffff",
                        color: isDark ? "#e5e7eb" : "#111827",
                        border: `1px solid ${isDark ? "#374151" : "#e5e7eb"}`,
                        borderRadius: 8,
                      }}
                      options={[
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

                {/* Thông báo */}
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                  <div className="flex items-start">
                    <svg
                      className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 mr-2 flex-shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <div className="text-sm text-blue-800 dark:text-blue-200">
                      <p className="font-medium">Lưu ý:</p>
                      <ul className="mt-1 list-disc list-inside space-y-1">
                        <li>
                          Để trống cả hai trường để xuất tất cả học kỳ và đơn vị
                        </li>
                        <li>
                          Có thể chọn nhiều học kỳ và nhiều đơn vị cùng lúc
                        </li>
                        <li>File PDF sẽ được tải xuống tự động</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 focus:ring-4 focus:outline-none focus:ring-gray-300 dark:focus:ring-gray-700"
                  onClick={() => {
                    setShowExportModal(false);
                    setExportSelectedSemesters([]);
                    setExportSelectedUnits([]);
                  }}
                >
                  Hủy
                </button>
                <button
                  type="button"
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg focus:ring-4 focus:outline-none focus:ring-green-300 dark:bg-green-600 dark:hover:bg-green-700 dark:focus:ring-green-800 flex items-center"
                  onClick={handleExportFileWord}
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
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  Xuất Word
                </button>
                <button
                  type="button"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg focus:ring-4 focus:outline-none focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800 flex items-center"
                  onClick={handleExportFilePdf}
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
                      d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3"
                    />
                  </svg>
                  Xuất PDF
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

        /* TreeSelect specific styles */
        .ant-tree-select .ant-select-selector {
          background-color: rgb(255 255 255) !important;
          border-color: rgb(209 213 219) !important; /* gray-300 */
          color: rgb(17 24 39) !important; /* gray-900 */
        }
        .ant-tree-select .ant-select-selection-placeholder {
          color: rgb(107 114 128) !important; /* gray-500 */
        }
        .ant-tree-select .ant-select-arrow,
        .ant-tree-select .ant-select-clear {
          color: rgb(107 114 128) !important;
        }
        .ant-tree-select-dropdown,
        :where(.css-dev-only-do-not-override-1g7t870).ant-tree-select-dropdown {
          background-color: rgb(255 255 255) !important;
          border: 1px solid rgb(229 231 235) !important; /* gray-200 */
          color: rgb(17 24 39) !important;
        }
        .ant-tree-select-tree .ant-tree-node-content-wrapper {
          color: rgb(17 24 39) !important;
        }
        .ant-tree-select-tree .ant-tree-node-content-wrapper:hover {
          background-color: rgba(
            59,
            130,
            246,
            0.12
          ) !important; /* blue-500/12 */
          color: rgb(30 58 138) !important;
        }
        .ant-tree-select-tree
          .ant-tree-node-selected
          .ant-tree-node-content-wrapper {
          background-color: rgba(
            59,
            130,
            246,
            0.18
          ) !important; /* blue-500/18 */
          color: rgb(30 58 138) !important;
          font-weight: 600 !important;
        }
        .ant-tree-select-tree .ant-tree-checkbox-inner {
          border-color: rgb(209 213 219) !important; /* gray-300 */
        }
        .ant-tree-select-tree
          .ant-tree-checkbox-checked
          .ant-tree-checkbox-inner {
          background-color: rgb(37 99 235) !important; /* blue-600 */
          border-color: rgb(37 99 235) !important; /* blue-600 */
        }
        /* Fix TreeSelect multiple selection display */
        .ant-tree-select .ant-select-selection-overflow {
          display: flex !important;
          flex-wrap: nowrap !important;
          overflow-x: auto !important;
          overflow-y: hidden !important;
          max-height: 32px !important;
        }
        .ant-tree-select .ant-select-selection-overflow-item {
          flex-shrink: 0 !important;
          margin-right: 4px !important;
        }
        .ant-tree-select .ant-select-selection-overflow::-webkit-scrollbar {
          height: 4px !important;
        }
        .ant-tree-select
          .ant-select-selection-overflow::-webkit-scrollbar-track {
          background: transparent !important;
        }
        .ant-tree-select
          .ant-select-selection-overflow::-webkit-scrollbar-thumb {
          background: rgb(209 213 219) !important;
          border-radius: 2px !important;
        }
        .ant-tree-select
          .ant-select-selection-overflow::-webkit-scrollbar-thumb:hover {
          background: rgb(156 163 175) !important;
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

        /* TreeSelect dark mode styles */
        .dark .ant-tree-select .ant-select-selector {
          background-color: rgb(55 65 81) !important; /* gray-700 */
          border-color: rgb(75 85 99) !important; /* gray-600 */
          color: rgb(255 255 255) !important;
        }
        .dark .ant-tree-select .ant-select-selection-placeholder {
          color: rgb(156 163 175) !important; /* gray-400 */
        }
        .dark .ant-tree-select .ant-select-arrow,
        .dark .ant-tree-select .ant-select-clear {
          color: rgb(209 213 219) !important; /* gray-300 */
        }
        .dark .ant-tree-select-dropdown,
        .dark
          :where(
            .css-dev-only-do-not-override-1g7t870
          ).ant-tree-select-dropdown {
          background-color: rgb(31 41 55) !important; /* gray-800 */
          border-color: rgb(55 65 81) !important; /* gray-700 */
          color: rgb(255 255 255) !important;
        }
        .dark .ant-tree-select-tree .ant-tree-node-content-wrapper {
          color: rgb(255 255 255) !important;
        }
        .dark .ant-tree-select-tree .ant-tree-node-content-wrapper:hover {
          background-color: rgba(
            59,
            130,
            246,
            0.25
          ) !important; /* blue-500/25 */
          color: rgb(255 255 255) !important;
        }
        .dark
          .ant-tree-select-tree
          .ant-tree-node-selected
          .ant-tree-node-content-wrapper {
          background-color: rgba(
            59,
            130,
            246,
            0.35
          ) !important; /* blue-500/35 */
          color: rgb(255 255 255) !important;
          font-weight: 600 !important;
        }
        .dark .ant-tree-select-tree .ant-tree-checkbox-inner {
          border-color: rgb(75 85 99) !important; /* gray-600 */
        }
        .dark
          .ant-tree-select-tree
          .ant-tree-checkbox-checked
          .ant-tree-checkbox-inner {
          background-color: rgb(37 99 235) !important; /* blue-600 */
          border-color: rgb(37 99 235) !important; /* blue-600 */
        }
        /* Fix TreeSelect multiple selection display in dark mode */
        .dark .ant-tree-select .ant-select-selection-overflow {
          display: flex !important;
          flex-wrap: nowrap !important;
          overflow-x: auto !important;
          overflow-y: hidden !important;
          max-height: 32px !important;
        }
        .dark .ant-tree-select .ant-select-selection-overflow-item {
          flex-shrink: 0 !important;
          margin-right: 4px !important;
        }
        .dark
          .ant-tree-select
          .ant-select-selection-overflow::-webkit-scrollbar {
          height: 4px !important;
        }
        .dark
          .ant-tree-select
          .ant-select-selection-overflow::-webkit-scrollbar-track {
          background: transparent !important;
        }
        .dark
          .ant-tree-select
          .ant-select-selection-overflow::-webkit-scrollbar-thumb {
          background: rgb(75 85 99) !important;
          border-radius: 2px !important;
        }
        .dark
          .ant-tree-select
          .ant-select-selection-overflow::-webkit-scrollbar-thumb:hover {
          background: rgb(107 114 128) !important;
        }
      `}</style>
    </div>
  );
};

export default TuitionFees;
