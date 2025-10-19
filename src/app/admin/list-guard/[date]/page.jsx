"use client";

import axios from "axios";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import dayjs from "dayjs";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import SideBar from "@/components/sidebar";

import { BASE_URL } from "@/configs";
const ListGuardDetail = ({ params }) => {
  const [listGuardDetail, setListGuardDetail] = useState([]);

  const time = [
    "19h00 - 21h00",
    "21h00 - 22h30",
    "22h30 - 24h00",
    "24h00 - 1h00",
    "1h00 - 2h00",
    "2h00 - 3h00",
    "3h00 - 4h00",
    "4h00 - 5h30",
  ];

  useEffect(() => {
    fetchListGuardDetail();
  }, []);

  const fetchListGuardDetail = async () => {
    const token = localStorage.getItem("token");

    if (token) {
      try {
        const res = await axios.get(`${BASE_URL}/user/guard/${params.date}`, {
          headers: {
            token: `Bearer ${token}`,
          },
        });
        console.log(res.data);
        setListGuardDetail(res.data);
      } catch (error) {
        console.log(error);
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
              <li className="inline-flex items-center">
                <Link
                  href="/admin/list-guard"
                  className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-white"
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
                  Danh sách gác đêm
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
                    Chi tiết
                  </div>
                </div>
              </li>
            </ol>
          </nav>
        </div>
        <div className="w-full pt-8 pb-5 pl-5 pr-6 mb-5">
          <div className="bg-white dark:bg-gray-800 rounded-lg w-full shadow-lg">
            <div className="font-bold p-5 flex justify-between items-center border-b border-gray-200 dark:border-gray-700">
              <div className="text-gray-900 dark:text-white text-lg">
                CHI TIẾT DANH SÁCH GÁC ĐÊM
              </div>
              <Link
                href="/admin/list-guard"
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 border border-blue-600 hover:border-blue-700 rounded-lg transition-colors duration-200 flex items-center"
              >
                <svg
                  className="w-4 h-4 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M10 19l-7-7m0 0l7-7m-7 7h18"
                  />
                </svg>
                Quay lại
              </Link>
            </div>
            <div className="w-full pt-5 pl-5 pb-5 pr-5">
              <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <div className="text-sm flex items-center mb-2">
                  <span className="font-medium text-gray-700 dark:text-gray-300">
                    Ngày:
                  </span>
                  <span className="pl-2 font-bold text-blue-800 dark:text-blue-200">
                    {dayjs(
                      listGuardDetail ? listGuardDetail[0]?.dayGuard : ""
                    ).format("DD/MM/YYYY")}
                  </span>
                </div>

                <div className="flex flex-wrap gap-4 text-sm">
                  <div className="flex items-center">
                    <span className="font-medium text-gray-700 dark:text-gray-300">
                      Mật khẩu:
                    </span>
                  </div>
                  <div className="flex items-center">
                    <span className="font-medium text-gray-700 dark:text-gray-300">
                      Hỏi:
                    </span>
                    <span className="pl-1 font-bold text-blue-800 dark:text-blue-200">
                      {listGuardDetail
                        ? listGuardDetail[0]?.guardPassword?.question
                        : ""}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <span className="font-medium text-gray-700 dark:text-gray-300">
                      Đáp:
                    </span>
                    <span className="pl-1 font-bold text-blue-800 dark:text-blue-200">
                      {listGuardDetail
                        ? listGuardDetail[0]?.guardPassword?.answer
                        : ""}
                    </span>
                  </div>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="table-auto w-full divide-y divide-gray-200 dark:divide-gray-700 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr className="border border-gray-200 dark:border-gray-600">
                      <th
                        scope="col"
                        className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider border-r border-gray-200 dark:border-gray-600 whitespace-nowrap"
                      >
                        THỜI GIAN
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider border-r border-gray-200 dark:border-gray-600 whitespace-nowrap"
                      >
                        VỌNG 1 (CẦU THANG TÒA S1)
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider border-r border-gray-200 dark:border-gray-600 whitespace-nowrap"
                      >
                        VỌNG 2 (ĐỐI DIỆN TÒA S2)
                      </th>
                      <th
                        scope="col"
                        className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider whitespace-nowrap"
                      >
                        VỌNG 3 (ĐẰNG SAU TÒA S3)
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {listGuardDetail && listGuardDetail[0]?.location1 ? (
                      listGuardDetail[0].location1.map((item, index) => (
                        <tr
                          key={listGuardDetail[0].id + index}
                          className="hover:bg-gray-50 dark:hover:bg-gray-700"
                        >
                          <td className="px-4 py-4 text-center border-r border-gray-200 dark:border-gray-600">
                            <div className="text-sm text-gray-900 dark:text-white font-medium whitespace-nowrap">
                              {time[index]}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-center border-r border-gray-200 dark:border-gray-600">
                            <div className="text-sm text-gray-900 dark:text-white">
                              {item}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-center border-r border-gray-200 dark:border-gray-600">
                            <div className="text-sm text-gray-900 dark:text-white">
                              {listGuardDetail[0].location2[index]}
                            </div>
                          </td>
                          <td className="px-4 py-4 text-center">
                            <div className="text-sm text-gray-900 dark:text-white">
                              {listGuardDetail[0].location3[index]}
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan="4"
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
                                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                              />
                            </svg>
                            <p className="text-lg font-medium">
                              Không có dữ liệu
                            </p>
                            <p className="text-sm">
                              Không tìm thấy thông tin gác đêm
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
    </div>
  );
};

export default ListGuardDetail;
