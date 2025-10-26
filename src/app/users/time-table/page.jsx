"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import SideBar from "@/components/sidebar";
import Loader from "@/components/loader";
import { useLoading } from "@/hooks";
import { handleNotify } from "../../../components/notify";
import { TIMETABLE_MESSAGES } from "@/constants/validationMessages";
import axiosInstance from "@/utils/axiosInstance";

const TimeTable = () => {
  const [timeTable, setTimeTable] = useState([]);
  const [showConfirmTimeTable, setShowConfirmTimeTable] = useState(false);
  const [timeTableId, setTimeTableId] = useState(null);
  const [showFormAddTimeTable, setShowFormAddTimeTable] = useState(false);
  const [isOpenTimeTable, setIsOpenTimeTable] = useState(false);
  const [editedTimeTable, setEditedTimeTable] = useState({});
  const [addFormDataTimeTable, setAddFormDataTimeTable] = useState({});
  const { loading, withLoading } = useLoading(true);
  const [studentId, setStudentId] = useState(null);

  const handleEditTimeTable = (id) => {
    const timeTableItem = timeTable.find((item) => item.id === id);
    if (timeTableItem) {
      // Parse time string to startTime and endTime
      let startTime = "";
      let endTime = "";
      if (timeTableItem.time && timeTableItem.time.includes(" - ")) {
        const timeParts = timeTableItem.time.split(" - ");
        startTime = timeParts[0];
        endTime = timeParts[1];
      }

      setEditedTimeTable({
        day: timeTableItem.day || "",
        subject: timeTableItem.subject || "",
        startTime: startTime,
        endTime: endTime,
        classroom: timeTableItem.classroom || "",
        schoolWeek: timeTableItem.schoolWeek || "",
        notes: timeTableItem.notes || "",
        time: timeTableItem.time || "",
      });
    }
    setTimeTableId(id);
    setIsOpenTimeTable(true);
  };

  const handleUpdateTimeTable = async (e, timeTableId) => {
    e.preventDefault();
    // Validate thời gian
    if (editedTimeTable.startTime && editedTimeTable.endTime) {
      const startTime = new Date(`2000-01-01T${editedTimeTable.startTime}:00`);
      const endTime = new Date(`2000-01-01T${editedTimeTable.endTime}:00`);

      if (startTime >= endTime) {
        handleNotify("danger", "Lỗi!", TIMETABLE_MESSAGES.INVALID_TIME);
        return;
      }
    }

    // Tạo time string từ startTime và endTime
    const timeString =
      editedTimeTable.startTime && editedTimeTable.endTime
        ? `${editedTimeTable.startTime} - ${editedTimeTable.endTime}`
        : editedTimeTable.time || "";

    const formData = {
      ...editedTimeTable,
      time: timeString,
    };

    try {
      const response = await axiosInstance.put(
        `/student/${studentId}/time-table/${timeTableId}`,
        formData
      );
      handleNotify(
        "success",
        "Thành công!",
        response.data.message ||
          "Chỉnh sửa lịch học thành công và đã cập nhật lịch cắt cơm tự động"
      );

      // Cập nhật schedule trong state thay vì refresh
      if (response.data.schedule) {
        setTimeTable((prev) => {
          const updated = prev.map((item) =>
            item.id === timeTableId ? response.data.schedule : item
          );
          // Sắp xếp lại theo thứ và thời gian
          return updated.sort((a, b) => {
            const dayOrder = {
              "Thứ 2": 1,
              "Thứ 3": 2,
              "Thứ 4": 3,
              "Thứ 5": 4,
              "Thứ 6": 5,
              "Thứ 7": 6,
              "Chủ nhật": 7,
            };
            if (dayOrder[a.day] !== dayOrder[b.day]) {
              return dayOrder[a.day] - dayOrder[b.day];
            }
            return a.startTime.localeCompare(b.startTime);
          });
        });
      }

      setIsOpenTimeTable(false);
    } catch (error) {
      console.error("Error updating time table:", error);
      const errorMessage =
        error.response?.data?.message ||
        error.response?.data ||
        "Có lỗi xảy ra khi cập nhật lịch học";
      handleNotify("danger", "Lỗi!", errorMessage);
      setIsOpenTimeTable(false);
    }
  };

  const handleAddFormTimeTable = async (e) => {
    e.preventDefault();

    // Validate thời gian
    if (addFormDataTimeTable.startTime && addFormDataTimeTable.endTime) {
      const startTime = new Date(
        `2000-01-01T${addFormDataTimeTable.startTime}:00`
      );
      const endTime = new Date(`2000-01-01T${addFormDataTimeTable.endTime}:00`);

      if (startTime >= endTime) {
        handleNotify("danger", "Lỗi!", TIMETABLE_MESSAGES.INVALID_TIME);
        return;
      }
    }

    // Tạo time string từ startTime và endTime
    const timeString =
      addFormDataTimeTable.startTime && addFormDataTimeTable.endTime
        ? `${addFormDataTimeTable.startTime} - ${addFormDataTimeTable.endTime}`
        : addFormDataTimeTable.time || "";

    const formData = {
      ...addFormDataTimeTable,
      time: timeString,
    };

    try {
      const response = await axiosInstance.post(
        `/student/${studentId}/time-table`,
        formData
      );
      handleNotify(
        "success",
        "Thành công!",
        response.data.message ||
          "Thêm lịch học thành công và đã cập nhật lịch cắt cơm tự động"
      );

      // Thêm schedule mới vào state thay vì refresh toàn bộ
      if (response.data.schedule) {
        setTimeTable((prev) => {
          const updated = [...prev, response.data.schedule];
          // Sắp xếp lại theo thứ và thời gian
          return updated.sort((a, b) => {
            const dayOrder = {
              "Thứ 2": 1,
              "Thứ 3": 2,
              "Thứ 4": 3,
              "Thứ 5": 4,
              "Thứ 6": 5,
              "Thứ 7": 6,
              "Chủ nhật": 7,
            };
            if (dayOrder[a.day] !== dayOrder[b.day]) {
              return dayOrder[a.day] - dayOrder[b.day];
            }
            return a.startTime.localeCompare(b.startTime);
          });
        });
      }

      setShowFormAddTimeTable(false);
      // Reset form
      setAddFormDataTimeTable({});
    } catch (error) {
      setShowFormAddTimeTable(false);
      const errorMessage =
        error.response?.data?.message ||
        error.response?.data ||
        "Có lỗi xảy ra khi thêm lịch học";
      handleNotify("danger", "Lỗi!", errorMessage);
    }
  };

  const handleDeleteTimeTable = (id) => {
    setTimeTableId(id);
    setShowConfirmTimeTable(true);
  };

  const handleConfirmDeleteTimeTable = (timeTableId) => {
    axiosInstance
      .delete(`/student/${studentId}/time-table/${timeTableId}`)
      .then((response) => {
        setTimeTable(
          timeTable.filter((timeTable) => timeTable.id !== timeTableId)
        );
        handleNotify(
          "success",
          "Thành công!",
          response.data.message ||
            "Xóa lịch học thành công và đã cập nhật lịch cắt cơm tự động"
        );
        fetchTimeTable();
      })
      .catch((error) => {
        const errorMessage =
          error.response?.data?.message ||
          error.response?.data ||
          "Có lỗi xảy ra khi xóa lịch học";
        handleNotify("danger", "Lỗi!", errorMessage);
      });

    setShowConfirmTimeTable(false);
  };

  const fetchTimeTable = async () => {
    if (studentId) {
      try {
        const res = await axiosInstance.get(`/student/${studentId}/time-table`);
        console.log("DEBUG - fetchTimeTable response:", res.data);

        // Sắp xếp theo thứ và thời gian bắt đầu
        const sortedTimeTable = res.data.sort((a, b) => {
          const dayOrder = {
            "Thứ 2": 1,
            "Thứ 3": 2,
            "Thứ 4": 3,
            "Thứ 5": 4,
            "Thứ 6": 5,
            "Thứ 7": 6,
            "Chủ nhật": 7,
          };

          // So sánh thứ trước
          if (dayOrder[a.day] !== dayOrder[b.day]) {
            return dayOrder[a.day] - dayOrder[b.day];
          }

          // Nếu cùng thứ thì so sánh thời gian bắt đầu
          return a.startTime.localeCompare(b.startTime);
        });

        setTimeTable(sortedTimeTable);
      } catch (error) {
        console.log(error);
      }
    }
  };

  // Hàm sắp xếp và gộp dữ liệu theo thứ và giờ
  const processTimeTableData = (data) => {
    if (!data || data.length === 0) return [];

    // Nhóm theo thứ
    const groupedByDay = {};
    data.forEach((item) => {
      if (!groupedByDay[item.day]) {
        groupedByDay[item.day] = [];
      }
      groupedByDay[item.day].push(item);
    });

    // Sắp xếp theo thứ tự thứ và giờ
    const dayOrder = {
      "Thứ 2": 1,
      "Thứ 3": 2,
      "Thứ 4": 3,
      "Thứ 5": 4,
      "Thứ 6": 5,
      "Thứ 7": 6,
      "Chủ nhật": 7,
    };

    // Sắp xếp các thứ theo thứ tự
    const sortedDays = Object.keys(groupedByDay).sort(
      (a, b) => (dayOrder[a] || 999) - (dayOrder[b] || 999)
    );

    const processedData = [];
    sortedDays.forEach((day) => {
      const dayItems = groupedByDay[day];

      // Sắp xếp theo giờ bắt đầu
      dayItems.sort((a, b) => {
        const timeA = a.startTime || "";
        const timeB = b.startTime || "";
        return timeA.localeCompare(timeB);
      });

      // Thêm dữ liệu đã xử lý
      dayItems.forEach((item, index) => {
        processedData.push({
          ...item,
          rowSpan: index === 0 ? dayItems.length : 0, // Gộp ô cho thứ
        });
      });
    });

    return processedData;
  };

  // Lấy studentId từ userId
  const fetchStudentId = async () => {
    try {
      // Lấy thông tin user từ API
      const userRes = await axiosInstance.get("/user/me");
      const userId = userRes.data.id;

      // Use helper route to convert userId to studentId
      const res = await axiosInstance.get(`/student/by-user/${userId}`);
      setStudentId(res.data.id);
      return res.data.id;
    } catch (error) {
      console.error("Error fetching studentId:", error);
      return null;
    }
  };

  useEffect(() => {
    const loadData = async () => {
      await withLoading(async () => {
        await fetchStudentId();
      });
    };
    loadData();
  }, [withLoading]);

  // Fetch time table when studentId is available
  useEffect(() => {
    if (studentId) {
      fetchTimeTable();
    }
  }, [studentId]);

  if (loading) {
    return <Loader text="Đang tải thông tin học tập..." />;
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
                      Học tập
                    </div>
                  </div>
                </li>
              </ol>
            </nav>
          </div>
          <div className="w-full pt-8 pb-5 pl-5 pr-6 mb-5 space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg w-full shadow-lg">
              <div className="flex justify-between font-bold p-5 border-b border-gray-200 dark:border-gray-700">
                <div className="text-gray-900 dark:text-white">
                  <h1 className="text-2xl font-bold">THỜI KHÓA BIỂU</h1>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Quản lý và xem thời khóa biểu
                  </p>
                </div>
                <div className="flex items-center">
                  <button
                    onClick={() => setShowFormAddTimeTable(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-1.5 px-3 border border-blue-600 hover:border-blue-700 rounded-lg transition-colors duration-200 flex items-center text-xs"
                  >
                    <svg
                      className="w-4 h-4 mr-1.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                      />
                    </svg>
                    Thêm lịch học
                  </button>
                </div>
              </div>
              <div className="w-full pl-6 pb-6 pr-6 mt-4">
                <div className="overflow-x-auto">
                  <table className="min-w-full border border-gray-200 dark:border-gray-700 text-center text-sm font-light text-gray-900 dark:text-white rounded-lg">
                    <thead className="bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600">
                      <tr>
                        <th
                          scope="col"
                          className="border-r border-gray-200 dark:border-gray-600 py-3 px-4 text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider"
                        >
                          Thứ
                        </th>
                        <th
                          scope="col"
                          className="border-r border-gray-200 dark:border-gray-600 py-3 px-4 text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider"
                        >
                          Thời gian
                        </th>
                        <th
                          scope="col"
                          className="border-r border-gray-200 dark:border-gray-600 py-3 px-4 text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider"
                        >
                          Môn học
                        </th>
                        <th
                          scope="col"
                          className="border-r border-gray-200 dark:border-gray-600 py-3 px-4 text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider"
                        >
                          Phòng học
                        </th>
                        <th
                          scope="col"
                          className="border-r border-gray-200 dark:border-gray-600 py-3 px-4 text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider"
                        >
                          Tuần học
                        </th>
                        <th
                          scope="col"
                          className="border-r border-gray-200 dark:border-gray-600 py-3 px-4 text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider"
                        >
                          Tùy chọn
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800">
                      {processTimeTableData(timeTable)?.map((item) => (
                        <tr
                          key={item.id}
                          className="border-b border-gray-200 dark:border-gray-600"
                        >
                          {item.rowSpan > 0 ? (
                            <td
                              className="whitespace-nowrap font-medium border-r border-gray-200 dark:border-gray-600 py-4 px-4"
                              rowSpan={item.rowSpan}
                            >
                              {item.day}
                            </td>
                          ) : null}
                          <td className="whitespace-nowrap font-medium border-r border-gray-200 dark:border-gray-600 py-4 px-4">
                            {item.startTime} - {item.endTime}
                          </td>
                          <td className="whitespace-nowrap font-medium border-r border-gray-200 dark:border-gray-600 py-4 px-4">
                            {item.subject || "N/A"}
                          </td>
                          <td className="whitespace-nowrap font-medium border-r border-gray-200 dark:border-gray-600 py-4 px-4">
                            {item.classroom || "N/A"}
                          </td>
                          <td className="whitespace-nowrap font-medium border-r border-gray-200 dark:border-gray-600 py-4 px-4">
                            {item.schoolWeek || "N/A"}
                          </td>
                          <td className="flex justify-center items-center space-x-2 py-4 px-4">
                            <button
                              data-modal-target="authentication-modal"
                              data-modal-toggle="authentication-modal"
                              type="button"
                              onClick={() => handleEditTimeTable(item.id)}
                              className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 p-2 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors duration-200"
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                strokeWidth="1.5"
                                stroke="currentColor"
                                className="w-5 h-5"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10"
                                />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleDeleteTimeTable(item.id)}
                              className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors duration-200"
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                strokeWidth="1.5"
                                stroke="currentColor"
                                className="w-5 h-5"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="m9.75 9.75 4.5 4.5m0-4.5-4.5 4.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                                />
                              </svg>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Thêm Thời Khóa Biểu */}
      {showFormAddTimeTable && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
          <div className="bg-black bg-opacity-50 inset-0 fixed"></div>
          <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white pr-12">
                Thêm thời khóa biểu
              </h2>
              <button
                onClick={() => setShowFormAddTimeTable(false)}
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
                  ></path>
                </svg>
              </button>
            </div>
            <div className="overflow-y-auto max-h-[calc(95vh-120px)]">
              <form
                onSubmit={handleAddFormTimeTable}
                className="p-4"
                id="infoFormTimeTable"
              >
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label
                      htmlFor="day"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                    >
                      Thứ
                    </label>
                    <select
                      id="day"
                      name="day"
                      value={addFormDataTimeTable.day}
                      onChange={(e) =>
                        setAddFormDataTimeTable({
                          ...addFormDataTimeTable,
                          day: e.target.value,
                        })
                      }
                      required
                      className="bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 transition-colors duration-200"
                    >
                      <option value="">Chọn thứ</option>
                      <option value="Thứ 2">Thứ 2</option>
                      <option value="Thứ 3">Thứ 3</option>
                      <option value="Thứ 4">Thứ 4</option>
                      <option value="Thứ 5">Thứ 5</option>
                      <option value="Thứ 6">Thứ 6</option>
                      <option value="Thứ 7">Thứ 7</option>
                      <option value="Chủ nhật">Chủ nhật</option>
                    </select>
                  </div>
                  <div>
                    <label
                      htmlFor="subject"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                    >
                      Môn học
                    </label>
                    <input
                      type="text"
                      id="subject"
                      name="subject"
                      value={addFormDataTimeTable.subject}
                      onChange={(e) =>
                        setAddFormDataTimeTable({
                          ...addFormDataTimeTable,
                          subject: e.target.value,
                        })
                      }
                      required
                      placeholder="VD: Toán học"
                      className="bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 transition-colors duration-200"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label
                      htmlFor="startTime"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                    >
                      Thời gian bắt đầu
                    </label>
                    <input
                      type="time"
                      id="startTime"
                      name="startTime"
                      value={addFormDataTimeTable.startTime}
                      onChange={(e) =>
                        setAddFormDataTimeTable({
                          ...addFormDataTimeTable,
                          startTime: e.target.value,
                        })
                      }
                      required
                      className="bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 transition-colors duration-200"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="endTime"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                    >
                      Thời gian kết thúc
                    </label>
                    <input
                      type="time"
                      id="endTime"
                      name="endTime"
                      value={addFormDataTimeTable.endTime}
                      onChange={(e) =>
                        setAddFormDataTimeTable({
                          ...addFormDataTimeTable,
                          endTime: e.target.value,
                        })
                      }
                      required
                      className="bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 transition-colors duration-200"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label
                      htmlFor="classroom"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                    >
                      Phòng học
                    </label>
                    <input
                      type="text"
                      id="classroom"
                      name="classroom"
                      value={addFormDataTimeTable.classroom}
                      onChange={(e) =>
                        setAddFormDataTimeTable({
                          ...addFormDataTimeTable,
                          classroom: e.target.value,
                        })
                      }
                      required
                      placeholder="VD: D3-101"
                      className="bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 transition-colors duration-200"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="schoolWeek"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                    >
                      Tuần học
                    </label>
                    <input
                      type="text"
                      id="schoolWeek"
                      name="schoolWeek"
                      value={addFormDataTimeTable.schoolWeek}
                      onChange={(e) =>
                        setAddFormDataTimeTable({
                          ...addFormDataTimeTable,
                          schoolWeek: e.target.value,
                        })
                      }
                      required
                      placeholder="VD: 1-15"
                      className="bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 transition-colors duration-200"
                    />
                  </div>
                </div>

                <div className="mb-4">
                  <label
                    htmlFor="notes"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                  >
                    Ghi chú
                  </label>
                  <textarea
                    id="notes"
                    name="notes"
                    value={addFormDataTimeTable.notes}
                    onChange={(e) =>
                      setAddFormDataTimeTable({
                        ...addFormDataTimeTable,
                        notes: e.target.value,
                      })
                    }
                    rows="3"
                    placeholder="Ghi chú về lịch học..."
                    className="bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 transition-colors duration-200"
                  />
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors duration-200"
                    onClick={() => setShowFormAddTimeTable(false)}
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200"
                  >
                    Thêm
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal Sửa Thời Khóa Biểu */}
      {isOpenTimeTable && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
          <div className="bg-black bg-opacity-50 inset-0 fixed"></div>
          <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white pr-12">
                Chỉnh sửa thời khóa biểu
              </h2>
              <button
                onClick={() => setIsOpenTimeTable(false)}
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
                  ></path>
                </svg>
              </button>
            </div>
            <div className="overflow-y-auto max-h-[calc(95vh-120px)]">
              <form
                onSubmit={(e) => handleUpdateTimeTable(e, timeTableId)}
                className="p-4"
                id="infoFormEditTimeTable"
              >
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label
                      htmlFor="day2"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                    >
                      Thứ
                    </label>
                    <select
                      id="day2"
                      name="day2"
                      value={editedTimeTable.day}
                      onChange={(e) =>
                        setEditedTimeTable({
                          ...editedTimeTable,
                          day: e.target.value,
                        })
                      }
                      className="bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 transition-colors duration-200"
                    >
                      <option value="">Chọn thứ</option>
                      <option value="Thứ 2">Thứ 2</option>
                      <option value="Thứ 3">Thứ 3</option>
                      <option value="Thứ 4">Thứ 4</option>
                      <option value="Thứ 5">Thứ 5</option>
                      <option value="Thứ 6">Thứ 6</option>
                      <option value="Thứ 7">Thứ 7</option>
                      <option value="Chủ nhật">Chủ nhật</option>
                    </select>
                  </div>
                  <div>
                    <label
                      htmlFor="subject2"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                    >
                      Môn học
                    </label>
                    <input
                      type="text"
                      id="subject2"
                      name="subject2"
                      value={editedTimeTable.subject}
                      onChange={(e) =>
                        setEditedTimeTable({
                          ...editedTimeTable,
                          subject: e.target.value,
                        })
                      }
                      placeholder="VD: Toán học"
                      className="bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 transition-colors duration-200"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label
                      htmlFor="startTime2"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                    >
                      Thời gian bắt đầu
                    </label>
                    <input
                      type="time"
                      id="startTime2"
                      name="startTime2"
                      value={editedTimeTable.startTime}
                      onChange={(e) =>
                        setEditedTimeTable({
                          ...editedTimeTable,
                          startTime: e.target.value,
                        })
                      }
                      className="bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 transition-colors duration-200"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="endTime2"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                    >
                      Thời gian kết thúc
                    </label>
                    <input
                      type="time"
                      id="endTime2"
                      name="endTime2"
                      value={editedTimeTable.endTime}
                      onChange={(e) =>
                        setEditedTimeTable({
                          ...editedTimeTable,
                          endTime: e.target.value,
                        })
                      }
                      className="bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 transition-colors duration-200"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label
                      htmlFor="classroom2"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                    >
                      Phòng học
                    </label>
                    <input
                      type="text"
                      id="classroom2"
                      name="classroom2"
                      value={editedTimeTable.classroom}
                      onChange={(e) =>
                        setEditedTimeTable({
                          ...editedTimeTable,
                          classroom: e.target.value,
                        })
                      }
                      placeholder="VD: D3-101"
                      className="bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 transition-colors duration-200"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="schoolWeek2"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                    >
                      Tuần học
                    </label>
                    <input
                      type="text"
                      id="schoolWeek2"
                      name="schoolWeek2"
                      value={editedTimeTable.schoolWeek}
                      onChange={(e) =>
                        setEditedTimeTable({
                          ...editedTimeTable,
                          schoolWeek: e.target.value,
                        })
                      }
                      placeholder="VD: 1-15"
                      className="bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 transition-colors duration-200"
                    />
                  </div>
                </div>

                <div className="mb-4">
                  <label
                    htmlFor="notes2"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                  >
                    Ghi chú
                  </label>
                  <textarea
                    id="notes2"
                    name="notes2"
                    value={editedTimeTable.notes}
                    onChange={(e) =>
                      setEditedTimeTable({
                        ...editedTimeTable,
                        notes: e.target.value,
                      })
                    }
                    rows="3"
                    placeholder="Ghi chú về lịch học..."
                    className="bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 transition-colors duration-200"
                  />
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors duration-200"
                    onClick={() => setIsOpenTimeTable(false)}
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200"
                  >
                    Cập nhật
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal Xác nhận xóa thời khóa biểu */}
      {showConfirmTimeTable && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
          <div className="bg-black bg-opacity-50 inset-0 fixed"></div>
          <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Xác nhận xóa
              </h2>
              <button
                onClick={() => setShowConfirmTimeTable(false)}
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
                  ></path>
                </svg>
              </button>
            </div>
            <div className="p-6">
              <div className="flex items-center justify-center mb-4">
                <svg
                  className="w-12 h-12 text-red-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                  ></path>
                </svg>
              </div>
              <p className="text-gray-700 dark:text-gray-300 text-center mb-6">
                Bạn có chắc chắn muốn xóa thời khóa biểu này?
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowConfirmTimeTable(false)}
                  className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors duration-200"
                >
                  Hủy
                </button>
                <button
                  onClick={() => handleConfirmDeleteTimeTable(timeTableId)}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors duration-200"
                >
                  Xóa
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default TimeTable;
