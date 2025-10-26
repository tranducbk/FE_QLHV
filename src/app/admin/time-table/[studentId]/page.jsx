"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import Loader from "@/components/loader";
import { useLoading } from "@/hooks";
import axiosInstance from "@/utils/axiosInstance";

import { BASE_URL } from "@/configs";
const TimeTableDetail = ({ params }) => {
  const [timeTable, setTimeTable] = useState([]);
  const { loading, withLoading } = useLoading(true);

  const fetchTimeTable = async () => {
    try {
      const res = await axiosInstance.get(
        `/commander/${params.studentId}/timeTable`
      );

        setTimeTable(res.data);
      } catch (error) {
        console.log(error);
      }
    }
  

  useEffect(() => {
    const loadData = async () => {
      await withLoading(fetchTimeTable);
    };
    loadData();
  }, [withLoading]);

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
        const timeA = a.time ? a.time.split("-")[0].trim() : "";
        const timeB = b.time ? b.time.split("-")[0].trim() : "";
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

  const processedTimeTable = processTimeTableData(timeTable);

  if (loading) {
    return <Loader text="Đang tải dữ liệu lịch học..." />;
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
                <li className="inline-flex items-center">
                  <Link
                    href="/admin/time-table"
                    className="inline-flex items-center text-sm font-medium text-gray-700 hover:text-blue-600 dark:text-gray-400 dark:hover:text-white"
                  >
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
                    Lịch học học viên
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
                    <div className="ms-1 text-sm font-medium text-gray-500 dark:text-gray-400 md:ms-2">
                      Chi tiết
                    </div>
                  </div>
                </li>
              </ol>
            </nav>
          </div>
          <div className="w-full pt-8 pb-5 pl-5 pr-6 mb-5">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 w-full">
              <div className="font-bold pt-5 pl-5 pb-5 pr-5 uppercase text-gray-900 dark:text-white">
                <div className="flex justify-between items-center">
                  <div>
                    TKB HỌC VIÊN {timeTable ? timeTable[0]?.fullName : ""}
                  </div>
                  <Link
                    href="/admin/time-table"
                    className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors duration-200"
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
                    Quay lại danh sách
                  </Link>
                </div>
              </div>
              <div className="w-full pl-5 pb-5 pr-5">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 border border-gray-200 dark:border-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th
                          scope="col"
                          className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider border-r border-gray-200 dark:border-gray-600 whitespace-nowrap"
                        >
                          Thứ
                        </th>
                        <th
                          scope="col"
                          className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider border-r border-gray-200 dark:border-gray-600 whitespace-nowrap"
                        >
                          Thời gian
                        </th>
                        <th
                          scope="col"
                          className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider border-r border-gray-200 dark:border-gray-600 whitespace-nowrap"
                        >
                          Môn học
                        </th>
                        <th
                          scope="col"
                          className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider border-r border-gray-200 dark:border-gray-600 whitespace-nowrap"
                        >
                          Phòng học
                        </th>
                        <th
                          scope="col"
                          className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider border-r border-gray-200 dark:border-gray-600 whitespace-nowrap"
                        >
                          Tuần học
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {processedTimeTable?.map((item, index) => (
                        <tr
                          key={item.id || index}
                          className="border-b border-gray-200 dark:border-gray-700"
                        >
                          {item.rowSpan > 0 ? (
                            <td
                              className="px-4 py-4 text-center border-r border-gray-200 dark:border-gray-600"
                              rowSpan={item.rowSpan}
                            >
                              <span className="font-medium text-gray-900 dark:text-white">
                                {item.day}
                              </span>
                            </td>
                          ) : null}
                          <td className="px-4 py-4 text-center border-r border-gray-200 dark:border-gray-600">
                            <span className="font-medium text-gray-900 dark:text-white">
                              {item.time}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-center border-r border-gray-200 dark:border-gray-600">
                            <span className="font-medium text-gray-900 dark:text-white">
                              {item.subject || "N/A"}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-center border-r border-gray-200 dark:border-gray-600">
                            <span className="font-medium text-gray-900 dark:text-white">
                              {item.classroom}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-center border-r border-gray-200 dark:border-gray-600">
                            <span className="font-medium text-gray-900 dark:text-white">
                              {item.schoolWeek}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {processedTimeTable?.length === 0 && (
                  <div className="text-center py-8">
                    <div className="text-gray-500 dark:text-gray-400">
                      Không có dữ liệu lịch học
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default TimeTableDetail;
