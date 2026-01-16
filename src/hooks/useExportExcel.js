import { useState, useEffect, useCallback } from "react";
import axiosInstance from "@/utils/axiosInstance";
import { handleNotify } from "@/components/notify";
import {
  buildExportParams,
  generateExcelFileName,
  downloadFile,
  getUniqueStudents,
  getUniqueSchoolYears,
} from "@/utils/exportUtils";

/**
 * Custom hook để quản lý export Excel
 * @param {Object} config - Cấu hình cho export
 * @param {string} config.apiEndpoint - API endpoint để export
 * @param {string} config.baseFileName - Tên file cơ bản
 * @param {Array} config.data - Dữ liệu để lọc học viên
 */
export const useExportExcel = (config) => {
  const { apiEndpoint, baseFileName, data = [] } = config;

  // State cho export modal
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportFilters, setExportFilters] = useState({
    units: [],
    studentIds: [],
    semesters: [],
    schoolYears: [],
    gpaMin: "",
    gpaMax: "",
    cpaMin: "",
    cpaMax: "",
    sortBy: "gpa",
    sortOrder: "desc",
  });

  // State cho danh sách học viên và năm học
  const [filteredStudentsForExport, setFilteredStudentsForExport] = useState([]);
  const [availableSchoolYears, setAvailableSchoolYears] = useState([]);

  // Lấy danh sách năm học từ data
  useEffect(() => {
    const years = getUniqueSchoolYears(data);
    setAvailableSchoolYears(years);
  }, [data]);

  // Lọc học viên theo đơn vị đã chọn
  useEffect(() => {
    const students = getUniqueStudents(data, exportFilters.units);
    setFilteredStudentsForExport(students);
  }, [data, exportFilters.units]);

  // Reset form export
  const resetExportForm = useCallback(() => {
    setExportFilters({
      units: [],
      studentIds: [],
      semesters: [],
      schoolYears: [],
      gpaMin: "",
      gpaMax: "",
      cpaMin: "",
      cpaMax: "",
      sortBy: "gpa",
      sortOrder: "desc",
    });
  }, []);

  // Cập nhật filter
  const updateExportFilter = useCallback((key, value) => {
    setExportFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  }, []);

  // Xử lý export Excel
  const handleExport = useCallback(async () => {
    try {
      const params = buildExportParams(exportFilters);
      const response = await axiosInstance.get(`${apiEndpoint}?${params.toString()}`, {
        responseType: "blob",
      });

      const fileName = generateExcelFileName(
        baseFileName,
        exportFilters.schoolYears
      );
      downloadFile(response.data, fileName);

      setShowExportModal(false);
      resetExportForm();
      handleNotify("success", "Thành công!", "Xuất file Excel thành công");
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || "Có lỗi xảy ra khi xuất file Excel";
      handleNotify("danger", "Lỗi!", errorMessage);
    }
  }, [apiEndpoint, baseFileName, exportFilters, resetExportForm]);

  return {
    showExportModal,
    setShowExportModal,
    exportFilters,
    updateExportFilter,
    resetExportForm,
    handleExport,
    filteredStudentsForExport,
    availableSchoolYears,
  };
};
