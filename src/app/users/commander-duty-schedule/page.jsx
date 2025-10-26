"use client";

import SideBar from "@/components/sidebar";
import Link from "next/link";
import dayjs from "dayjs";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Loader from "@/components/loader";
import { useLoading } from "@/hooks";
import axiosInstance from "@/utils/axiosInstance";

const CommanderDutySchedule = () => {
  const router = useRouter();
  const { query } = router;
  const [commanderDutySchedule, setCommanderDutySchedule] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const monthParam = query?.month || new Date().getMonth() + 1;
  const yearParam = query?.year || new Date().getFullYear();
  const [month, setMonth] = useState(monthParam);
  const [year, setYear] = useState(yearParam);
  const { loading, withLoading } = useLoading(true);

  useEffect(() => {
    const loadData = async () => {
      await withLoading(fetchSchedule);
    };
    loadData();
  }, [currentPage, withLoading]);

  const fetchSchedule = async () => {
    try {
      const res = await axiosInstance.get(
        `/user/commanderDutySchedule?page=${currentPage}&year=${year}&month=${parseInt(
          month
        )}`
      );

      if (res.status === 404) setCommanderDutySchedule([]);

      setCommanderDutySchedule(res.data);
      router.push(
        `/users/commander-duty-schedule?page=${currentPage}&year=${year}&month=${month}`
      );
    } catch (error) {
      console.log(error);
    }
  };

  const handleSubmit = async (e, year, month) => {
    e.preventDefault();

    try {
      const res = await axiosInstance.get(
        `/user/commanderDutySchedule?page=${currentPage}&year=${year}&month=${parseInt(
          month
        )}`
      );

      if (res.status === 404) setCommanderDutySchedule([]);
      console.log(res.data);
      setCommanderDutySchedule(res.data);

      router.push(
        `/users/commander-duty-schedule?page=${currentPage}&year=${year}&month=${month}`
      );
    } catch (error) {
      console.log(error);
    }
  };

  if (loading) {
    return <Loader text="Đang tải lịch trực ban..." />;
  }

  return (
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
                  <div className="ms-1 text-sm pointer-events-none font-medium md:ms-2 text-gray-500 dark:text-gray-400">
                    Lịch trực chỉ huy
                  </div>
                </div>
              </li>
            </ol>
          </nav>
        </div>
        <div className="w-full pt-8 pb-5 pl-5 pr-6 mb-5">
          <div className="bg-white dark:bg-gray-800 rounded-lg w-full shadow-lg">
            <div className="font-bold pt-5 pl-5 pb-5 text-gray-900 dark:text-white">
              <h1 className="text-2xl font-bold">LỊCH TRỰC CHỈ HUY</h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Quản lý và xem lịch trực chỉ huy
              </p>
            </div>
            <div className="w-full pl-5 pb-5 pr-5">
              <div className="w-full">
                <form
                  onSubmit={(e) => handleSubmit(e, year, month)}
                  className="flex items-end"
                >
                  <div className="flex">
                    <div>
                      <label
                        htmlFor="month"
                        className="block mb-1 text-sm font-medium dark:text-white"
                      >
                        Chọn tháng
                      </label>
                      <select
                        id="month"
                        value={month}
                        onChange={(e) => setMonth(e.target.value)}
                        className="bg-gray-50 border w-56 border-gray-300 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block pb-1 pt-1.5 pr-10 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                      >
                        <option value="1">Tháng 1</option>
                        <option value="2">Tháng 2</option>
                        <option value="3">Tháng 3</option>
                        <option value="4">Tháng 4</option>
                        <option value="5">Tháng 5</option>
                        <option value="6">Tháng 6</option>
                        <option value="7">Tháng 7</option>
                        <option value="8">Tháng 8</option>
                        <option value="9">Tháng 9</option>
                        <option value="10">Tháng 10</option>
                        <option value="11">Tháng 11</option>
                        <option value="12">Tháng 12</option>
                      </select>
                    </div>
                    <div className="ml-4">
                      <label
                        htmlFor="enrollment"
                        className="block mb-1 text-sm font-medium dark:text-white"
                      >
                        Chọn năm
                      </label>
                      <input
                        type="number"
                        id="enrollment"
                        value={year}
                        onChange={(e) => setYear(e.target.value)}
                        aria-describedby="helper-text-explanation"
                        className="bg-gray-50 border w-56 border-gray-300 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block pb-1 pt-1.5 px-1.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                        placeholder="2024"
                        min="2024"
                        required
                      />
                    </div>
                  </div>
                  <div className="ml-4">
                    <button
                      type="submit"
                      className="h-9 bg-blue-600 text-white border border-blue-600 hover:bg-blue-700 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm w-full sm:w-auto px-5 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
                    >
                      Tìm kiếm
                    </button>
                  </div>
                </form>
                <div className="mt-4 text-sm text-gray-700 dark:text-gray-300">
                  {(() => {
                    const paddedMonth = String(month).padStart(2, "0");
                    const start = dayjs(`${year}-${paddedMonth}-01`).startOf(
                      "month"
                    );
                    const end = start.endOf("month");
                    return (
                      <span>
                        Khoảng thời gian: {start.format("DD/MM/YYYY")} -{" "}
                        {end.format("DD/MM/YYYY")}
                      </span>
                    );
                  })()}
                </div>
                <table className="table-auto w-full mt-4 divide-y border border-gray-200 divide-gray-200 overflow-x-auto text-center dark:border-gray-700 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr className="border border-gray-200 dark:border-gray-600">
                      <th
                        scope="col"
                        className="px-6 border border-gray-200 dark:border-gray-600 py-3 text-xs font-medium uppercase text-gray-700 dark:text-gray-300"
                      >
                        Ngày trực
                      </th>
                      <th
                        scope="col"
                        className="px-6 border border-gray-200 dark:border-gray-600 py-3 text-xs font-medium uppercase text-gray-700 dark:text-gray-300"
                      >
                        Họ và tên
                      </th>
                      <th
                        scope="col"
                        className="px-6 border border-gray-200 dark:border-gray-600 py-3 text-xs font-medium uppercase text-gray-700 dark:text-gray-300"
                      >
                        Cấp bậc
                      </th>
                      <th
                        scope="col"
                        className="px-6 border border-gray-200 dark:border-gray-600 py-3 text-xs font-medium uppercase text-gray-700 dark:text-gray-300"
                      >
                        Chức vụ
                      </th>
                      <th
                        scope="col"
                        className="px-6 border border-gray-200 dark:border-gray-600 py-3 text-xs font-medium uppercase text-gray-700 dark:text-gray-300"
                      >
                        Số điện thoại
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {commanderDutySchedule?.schedules?.map((item) => (
                      <tr key={item.id}>
                        <td className="px-6 border border-gray-200 dark:border-gray-700 py-4 whitespace-nowrap">
                          {dayjs(item.workDay).format("DD/MM/YYYY")}
                        </td>
                        <td className="px-6 border border-gray-200 dark:border-gray-700 py-4 whitespace-nowrap">
                          {item.fullName}
                        </td>
                        <td className="px-6 border border-gray-200 dark:border-gray-700 py-4 whitespace-nowrap">
                          {item.rank}
                        </td>
                        <td className="px-6 border border-gray-200 dark:border-gray-700 py-4 whitespace-nowrap">
                          {item.position}
                        </td>
                        <td className="px-6 border border-gray-200 dark:border-gray-700 py-4 whitespace-nowrap">
                          {item.phoneNumber}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex justify-center mr-5 mt-5">
                <nav aria-label="Page navigation example">
                  <ul className="list-style-none flex">
                    <li>
                      <Link
                        className={`relative mr-1 block rounded bg-transparent px-3 py-1.5 text-sm font-bold transition-all duration-300 text-gray-700 dark:text-gray-300 ${
                          currentPage <= 1
                            ? "opacity-50 cursor-not-allowed"
                            : "hover:bg-blue-100 dark:hover:bg-gray-700"
                        }`}
                        href={
                          currentPage <= 1
                            ? `/users/commander-duty-schedule?page=1`
                            : `/users/commander-duty-schedule?page=${
                                currentPage - 1
                              }`
                        }
                        onClick={() => {
                          if (currentPage > 1) setCurrentPage(currentPage - 1);
                        }}
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
                            d="M15.75 19.5 8.25 12l7.5-7.5"
                          />
                        </svg>
                      </Link>
                    </li>
                    {Array.from(
                      { length: commanderDutySchedule?.totalPages },
                      (_, index) => index + 1
                    ).map((pageNumber) => (
                      <li key={pageNumber}>
                        <Link
                          className={`relative mr-1 block rounded bg-transparent font-bold px-3 py-1.5 text-sm transition-all duration-300 text-gray-700 dark:text-gray-300 ${
                            currentPage === pageNumber
                              ? "bg-blue-100 dark:bg-gray-700"
                              : "hover:bg-blue-100 dark:hover:bg-gray-700"
                          }`}
                          href={`/users/commander-duty-schedule?page=${pageNumber}`}
                          onClick={() => {
                            setCurrentPage(pageNumber);
                          }}
                        >
                          {pageNumber}
                        </Link>
                      </li>
                    ))}
                    <li>
                      <Link
                        className={`relative block rounded bg-transparent px-3 py-1.5 font-bold text-sm transition-all duration-300 text-gray-700 dark:text-gray-300 ${
                          currentPage >= commanderDutySchedule?.totalPages
                            ? "opacity-50 cursor-not-allowed"
                            : "hover:bg-blue-100 dark:hover:bg-gray-700"
                        }`}
                        href={
                          currentPage >= commanderDutySchedule?.totalPages
                            ? `/users/commander-duty-schedule?page=${commanderDutySchedule?.totalPages}`
                            : `/users/commander-duty-schedule?page=${
                                currentPage + 1
                              }`
                        }
                        onClick={() => {
                          if (currentPage < commanderDutySchedule?.totalPages)
                            setCurrentPage(currentPage + 1);
                        }}
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
                            d="m8.25 4.5 7.5 7.5-7.5 7.5"
                          />
                        </svg>
                      </Link>
                    </li>
                  </ul>
                </nav>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommanderDutySchedule;
