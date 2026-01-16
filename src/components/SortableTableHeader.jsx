/**
 * Component header có thể sắp xếp cho bảng
 * @param {Object} props
 * @param {string} props.title - Tiêu đề cột
 * @param {string} props.sortBy - Cột đang được sắp xếp ('gpa' hoặc 'cpa')
 * @param {string} props.currentSortBy - Cột hiện tại
 * @param {string} props.sortOrder - Thứ tự sắp xếp ('asc' hoặc 'desc')
 * @param {Function} props.onSort - Hàm xử lý khi click để sắp xếp
 */
const SortableTableHeader = ({
  title,
  sortBy,
  currentSortBy,
  sortOrder,
  onSort,
}) => {
  const isActive = currentSortBy === sortBy;

  return (
    <th
      className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider border-r border-gray-200 dark:border-gray-600 whitespace-nowrap cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
      onClick={() => onSort(sortBy)}
    >
      <div className="flex items-center justify-center gap-1">
        <span>{title}</span>
        <div className="flex flex-col">
          <svg
            className={`w-3 h-3 ${
              isActive && sortOrder === "asc"
                ? "text-blue-600 dark:text-blue-400"
                : "text-gray-400"
            }`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
          </svg>
          <svg
            className={`w-3 h-3 -mt-1 ${
              isActive && sortOrder === "desc"
                ? "text-blue-600 dark:text-blue-400"
                : "text-gray-400"
            }`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" />
          </svg>
        </div>
      </div>
    </th>
  );
};

export default SortableTableHeader;
