/**
 * Utility functions for Excel export functionality
 */

/**
 * Tạo URLSearchParams từ các filter options
 * @param {Object} filters - Object chứa các filter options
 * @returns {URLSearchParams} - URLSearchParams object
 */
export const buildExportParams = (filters) => {
  const params = new URLSearchParams();

  if (filters.units?.length > 0) {
    params.append("units", filters.units.join(","));
  }
  if (filters.studentIds?.length > 0) {
    params.append("studentIds", filters.studentIds.join(","));
  }
  if (filters.semesters?.length > 0) {
    params.append("semesters", filters.semesters.join(","));
  }
  if (filters.schoolYears?.length > 0) {
    params.append("schoolYears", filters.schoolYears.join(","));
  }
  if (filters.gpaMin) params.append("gpaMin", filters.gpaMin);
  if (filters.gpaMax) params.append("gpaMax", filters.gpaMax);
  if (filters.cpaMin) params.append("cpaMin", filters.cpaMin);
  if (filters.cpaMax) params.append("cpaMax", filters.cpaMax);
  
  params.append("sortBy", filters.sortBy || "gpa");
  params.append("sortOrder", filters.sortOrder || "desc");

  return params;
};

/**
 * Tạo tên file Excel từ các filter options
 * @param {string} baseName - Tên file cơ bản
 * @param {Array} schoolYears - Danh sách năm học
 * @returns {string} - Tên file
 */
export const generateExcelFileName = (baseName, schoolYears = []) => {
  let fileName = baseName;
  if (schoolYears.length > 0) {
    fileName += `_${schoolYears.join("_")}`;
  }
  return `${fileName}.xlsx`;
};

/**
 * Download file từ blob response
 * @param {Blob} blob - Blob data từ response
 * @param {string} fileName - Tên file để download
 */
export const downloadFile = (blob, fileName) => {
  const url = window.URL.createObjectURL(new Blob([blob]));
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", fileName);
  document.body.appendChild(link);
  link.click();
  link.parentNode.removeChild(link);
  window.URL.revokeObjectURL(url);
};

/**
 * Lấy danh sách học viên unique từ data
 * @param {Array} data - Danh sách data
 * @param {Array} filterUnits - Danh sách đơn vị để lọc (optional)
 * @returns {Array} - Danh sách học viên unique
 */
export const getUniqueStudents = (data, filterUnits = []) => {
  if (!data || data.length === 0) return [];

  let filtered = data;
  if (filterUnits.length > 0) {
    filtered = data.filter((item) => filterUnits.includes(item.unit));
  }

  const uniqueStudents = [];
  const seenIds = new Set();

  filtered.forEach((item) => {
    if (item.studentId && !seenIds.has(item.studentId)) {
      seenIds.add(item.studentId);
      uniqueStudents.push({
        studentId: item.studentId,
        fullName: item.fullName,
        studentCode: item.studentCode,
      });
    }
  });

  return uniqueStudents;
};

/**
 * Lấy danh sách năm học unique từ data
 * @param {Array} data - Danh sách data
 * @returns {Array} - Danh sách năm học đã sắp xếp
 */
export const getUniqueSchoolYears = (data) => {
  if (!data || data.length === 0) return [];

  const years = [...new Set(data.map((item) => item.schoolYear).filter(Boolean))];
  return years.sort((a, b) => b.localeCompare(a));
};
