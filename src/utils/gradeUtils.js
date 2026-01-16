/**
 * Utility functions for grade calculations and filtering
 */

/**
 * Lấy giá trị số từ điểm (xử lý các trường hợp khác nhau)
 * @param {string|number} value - Giá trị điểm
 * @returns {number} - Giá trị số
 */
export const getNumericValue = (value) => {
  if (!value || value === "Chưa có điểm" || value === "0.00") return 0;
  const num = parseFloat(value);
  return isNaN(num) ? 0 : num;
};

/**
 * Lấy GPA của item (học kỳ)
 * @param {Object} item - Item chứa thông tin điểm
 * @returns {number} - GPA học kỳ
 */
export const getSemesterGPA = (item) => {
  return getNumericValue(
    item.semesterGPA || item.GPA || item.averageGrade4
  );
};

/**
 * Lấy CPA của item (tích lũy)
 * @param {Object} item - Item chứa thông tin điểm
 * @returns {number} - CPA tích lũy
 */
export const getCumulativeCPA = (item) => {
  return getNumericValue(
    item.CPA || item.cumulativeGrade4
  );
};

/**
 * Lấy GPA năm học của item
 * @param {Object} item - Item chứa thông tin điểm
 * @returns {number} - GPA năm học
 */
export const getYearlyGPA = (item) => {
  return getNumericValue(item.yearlyGPA);
};

/**
 * Lọc items theo khoảng điểm
 * @param {Array} items - Danh sách items
 * @param {Object} filters - Object chứa các filter
 * @param {Function} getGpaFunc - Hàm lấy GPA
 * @param {Function} getCpaFunc - Hàm lấy CPA
 * @returns {Array} - Danh sách items đã lọc
 */
export const filterByGradeRange = (items, filters, getGpaFunc, getCpaFunc) => {
  if (!items || items.length === 0) return [];

  return items.filter((item) => {
    const gpa = getGpaFunc(item);
    const cpa = getCpaFunc(item);

    const matchesGpaRange =
      (!filters.gpaMin || gpa >= parseFloat(filters.gpaMin)) &&
      (!filters.gpaMax || gpa <= parseFloat(filters.gpaMax));

    const matchesCpaRange =
      (!filters.cpaMin || cpa >= parseFloat(filters.cpaMin)) &&
      (!filters.cpaMax || cpa <= parseFloat(filters.cpaMax));

    return matchesGpaRange && matchesCpaRange;
  });
};

/**
 * Sắp xếp items theo GPA hoặc CPA
 * @param {Array} items - Danh sách items
 * @param {string} sortBy - 'gpa' hoặc 'cpa'
 * @param {string} sortOrder - 'asc' hoặc 'desc'
 * @param {Function} getGpaFunc - Hàm lấy GPA
 * @param {Function} getCpaFunc - Hàm lấy CPA
 * @returns {Array} - Danh sách items đã sắp xếp
 */
export const sortByGrade = (items, sortBy, sortOrder, getGpaFunc, getCpaFunc) => {
  if (!sortBy || !sortOrder) return items;

  return [...items].sort((a, b) => {
    let valueA, valueB;
    if (sortBy === "gpa") {
      valueA = getGpaFunc(a);
      valueB = getGpaFunc(b);
    } else if (sortBy === "cpa") {
      valueA = getCpaFunc(a);
      valueB = getCpaFunc(b);
    } else {
      return 0;
    }

    if (sortOrder === "asc") {
      return valueA - valueB;
    } else {
      return valueB - valueA;
    }
  });
};
