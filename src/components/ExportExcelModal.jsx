"use client";

import { ConfigProvider, theme, Select, Input } from "antd";
import { UNIT_OPTIONS_FOR_EXPORT, SEMESTER_OPTIONS } from "@/constants/units";

/**
 * Component modal để xuất Excel với các bộ lọc
 * @param {Object} props
 * @param {boolean} props.visible - Hiển thị modal
 * @param {Function} props.onClose - Hàm đóng modal
 * @param {Function} props.onConfirm - Hàm xác nhận export
 * @param {Object} props.filters - Object chứa các filter values
 * @param {Function} props.onFilterChange - Hàm cập nhật filter
 * @param {Array} props.filteredStudents - Danh sách học viên đã lọc
 * @param {Array} props.availableSchoolYears - Danh sách năm học có sẵn
 * @param {boolean} props.isDark - Chế độ dark mode
 * @param {boolean} props.showSemesterFilter - Hiển thị filter học kỳ (cho learning-results)
 */
const ExportExcelModal = ({
  visible,
  onClose,
  onConfirm,
  filters,
  onFilterChange,
  filteredStudents = [],
  availableSchoolYears = [],
  isDark = false,
  showSemesterFilter = false,
}) => {
  if (!visible) return null;

  const sortByOptions = showSemesterFilter
    ? [
        { value: "gpa", label: "GPA học kỳ" },
        { value: "cpa", label: "CPA tích lũy" },
      ]
    : [
        { value: "gpa", label: "GPA năm học" },
        { value: "cpa", label: "CPA tích lũy" },
      ];

  const sortOrderOptions = [
    { value: "desc", label: "Giảm dần (cao -> thấp)" },
    { value: "asc", label: "Tăng dần (thấp -> cao)" },
  ];

  const themeConfig = {
    algorithm: isDark ? theme.darkAlgorithm : theme.defaultAlgorithm,
    token: {
      colorPrimary: "#2563eb",
      borderRadius: 8,
      controlOutline: "rgba(37,99,235,0.2)",
    },
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
      <div
        className="bg-black bg-opacity-50 inset-0 fixed"
        onClick={onClose}
      ></div>
      <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {showSemesterFilter
              ? "Xuất kết quả học tập ra Excel"
              : "Xuất thống kê năm học ra Excel"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* 1. Unit Selection */}
          <div>
            <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              Chọn đơn vị
            </label>
            <ConfigProvider theme={themeConfig}>
              <Select
                mode="multiple"
                style={{ width: "100%" }}
                placeholder="Chọn đơn vị (bỏ trống để chọn tất cả)"
                allowClear
                value={filters.units}
                onChange={(values) => {
                  onFilterChange("units", values);
                  onFilterChange("studentIds", []); // Reset student selection
                }}
                    options={UNIT_OPTIONS_FOR_EXPORT}
              />
            </ConfigProvider>
          </div>

          {/* 2. Student Selection */}
          <div>
            <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              Chọn học viên cụ thể (tùy chọn)
            </label>
            <ConfigProvider theme={themeConfig}>
              <Select
                mode="multiple"
                style={{ width: "100%" }}
                placeholder="Chọn học viên (bỏ trống để chọn tất cả)"
                allowClear
                showSearch
                filterOption={(input, option) =>
                  option.label.toLowerCase().includes(input.toLowerCase())
                }
                value={filters.studentIds}
                onChange={(values) => onFilterChange("studentIds", values)}
                options={filteredStudents.map((s) => ({
                  value: s.studentId,
                  label: `${s.fullName} - ${s.studentCode}`,
                }))}
              />
            </ConfigProvider>
          </div>

          {/* 3. Semester Selection (chỉ cho learning-results) */}
          {showSemesterFilter && (
            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                Chọn học kỳ
              </label>
              <ConfigProvider theme={themeConfig}>
                <Select
                  mode="multiple"
                  style={{ width: "100%" }}
                  placeholder="Chọn học kỳ (bỏ trống để chọn tất cả)"
                  allowClear
                  value={filters.semesters}
                  onChange={(values) => onFilterChange("semesters", values)}
                    options={SEMESTER_OPTIONS}
                />
              </ConfigProvider>
            </div>
          )}

          {/* 4. School Year Selection */}
          <div>
            <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              Chọn năm học
            </label>
            <ConfigProvider theme={themeConfig}>
              <Select
                mode="multiple"
                style={{ width: "100%" }}
                placeholder="Chọn năm học (bỏ trống để chọn tất cả)"
                allowClear
                value={filters.schoolYears}
                onChange={(values) => onFilterChange("schoolYears", values)}
                options={availableSchoolYears.map((year) => ({
                  value: year,
                  label: year,
                }))}
              />
            </ConfigProvider>
          </div>

          {/* 5. GPA Range Filter */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                {showSemesterFilter ? "GPA từ" : "GPA năm từ"}
              </label>
              <ConfigProvider theme={themeConfig}>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  max="4"
                  placeholder="0.0"
                  value={filters.gpaMin}
                  onChange={(e) => onFilterChange("gpaMin", e.target.value)}
                />
              </ConfigProvider>
            </div>
            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                {showSemesterFilter ? "GPA đến" : "GPA năm đến"}
              </label>
              <ConfigProvider theme={themeConfig}>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  max="4"
                  placeholder="4.0"
                  value={filters.gpaMax}
                  onChange={(e) => onFilterChange("gpaMax", e.target.value)}
                />
              </ConfigProvider>
            </div>
          </div>

          {/* 6. CPA Range Filter */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                CPA từ
              </label>
              <ConfigProvider theme={themeConfig}>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  max="4"
                  placeholder="0.0"
                  value={filters.cpaMin}
                  onChange={(e) => onFilterChange("cpaMin", e.target.value)}
                />
              </ConfigProvider>
            </div>
            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                CPA đến
              </label>
              <ConfigProvider theme={themeConfig}>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  max="4"
                  placeholder="4.0"
                  value={filters.cpaMax}
                  onChange={(e) => onFilterChange("cpaMax", e.target.value)}
                />
              </ConfigProvider>
            </div>
          </div>

          {/* 7. Sort Options */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                Sắp xếp theo
              </label>
              <ConfigProvider theme={themeConfig}>
                <Select
                  style={{ width: "100%" }}
                  value={filters.sortBy}
                  onChange={(value) => onFilterChange("sortBy", value)}
                  options={sortByOptions}
                />
              </ConfigProvider>
            </div>
            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                Thứ tự
              </label>
              <ConfigProvider theme={themeConfig}>
                <Select
                  style={{ width: "100%" }}
                  value={filters.sortOrder}
                  onChange={(value) => onFilterChange("sortOrder", value)}
                  options={sortOrderOptions}
                />
              </ConfigProvider>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end space-x-3 p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            type="button"
            className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
            onClick={onClose}
          >
            Hủy
          </button>
          <button
            type="button"
            className="px-4 py-2 text-white bg-green-600 hover:bg-green-700 font-medium rounded-lg transition-colors"
            onClick={onConfirm}
          >
            Xuất Excel
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExportExcelModal;
