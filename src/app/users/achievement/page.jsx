"use client";

import Link from "next/link";
import axios from "axios";
import { jwtDecode } from "jwt-decode";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import SideBar from "@/components/sidebar";
import Loader from "@/components/loader";
import { useLoading } from "@/hooks";
import { BASE_URL } from "@/configs";

const AchievementContent = () => {
  const [achievement, setAchievement] = useState(null);
  const [recommendations, setRecommendations] = useState(null);
  const searchParams = useSearchParams();
  const { loading, withLoading } = useLoading(true);

  const fetchAchievement = async () => {
    const token = localStorage.getItem("token");

    if (token) {
      try {
        const decodedToken = jwtDecode(token);
        const studentIdParam = searchParams?.get("studentId");

        // Nếu có studentId trong params thì dùng, không thì lấy từ user data
        let targetStudentId = studentIdParam;
        if (!targetStudentId) {
          // Lấy studentId từ helper route
          const studentRes = await axios.get(
            `${BASE_URL}/student/by-user/${decodedToken.id}`,
            {
              headers: { token: `Bearer ${token}` },
            }
          );
          targetStudentId = studentRes.data.id;
        }

        const res = await axios.get(
          `${BASE_URL}/achievement/${targetStudentId}`,
          {
            headers: {
              token: `Bearer ${token}`,
            },
          }
        );

        setAchievement(res.data);

        // Fetch recommendations (đề xuất) - sử dụng endpoint cho user
        try {
          const recRes = await axios.get(
            `${BASE_URL}/achievement/${targetStudentId}/recommendations`,
            {
              headers: { token: `Bearer ${token}` },
            }
          );
          setRecommendations(recRes.data);
        } catch (e) {
          setRecommendations({ suggestions: [] });
        }
      } catch (error) {
      }
    }
  };

  useEffect(() => {
    const loadData = async () => {
      await withLoading(fetchAchievement);
    };
    loadData();
    // Re-fetch when the query changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, withLoading]);

  if (loading) {
    return <Loader text="Đang tải dữ liệu thành tích..." />;
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
                  <div className="ms-1 text-sm font-medium text-gray-500 md:ms-2 dark:text-gray-400">
                    Khen thưởng
                  </div>
                </div>
              </li>
            </ol>
          </nav>
        </div>
        <div className="w-full pt-8 pb-5 pl-5 pr-6 mb-5">
          <div className="bg-white dark:bg-gray-800 rounded-lg w-full shadow-lg">
            <div className="flex justify-between font-bold p-5 border-b border-gray-200 dark:border-gray-700">
              <div className="text-gray-900 dark:text-white">
                <h1 className="text-2xl font-bold">KHEN THƯỞNG</h1>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Quản lý và xem khen thưởng
                </p>
              </div>
              <div className="text-gray-900 dark:text-white text-lg"></div>
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
                        STT
                      </th>
                      <th
                        scope="col"
                        className="border-r border-gray-200 dark:border-gray-600 py-3 px-4 text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider"
                      >
                        Năm
                      </th>
                      <th
                        scope="col"
                        className="border-r border-gray-200 dark:border-gray-600 py-3 px-4 text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider"
                      >
                        Số quyết định
                      </th>
                      <th
                        scope="col"
                        className="border-r border-gray-200 dark:border-gray-600 py-3 px-4 text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider"
                      >
                        Ngày quyết định
                      </th>
                      <th
                        scope="col"
                        className="border-r border-gray-200 dark:border-gray-600 py-3 px-4 text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider"
                      >
                        Danh hiệu
                      </th>
                      <th
                        scope="col"
                        className="border-r border-gray-200 dark:border-gray-600 py-3 px-4 text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider"
                      >
                        Nghiên cứu khoa học
                      </th>
                      <th
                        scope="col"
                        className="border-r border-gray-200 dark:border-gray-600 py-3 px-4 text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider"
                      >
                        BK BQP
                      </th>
                      <th
                        scope="col"
                        className="border-r border-gray-200 dark:border-gray-600 py-3 px-4 text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider"
                      >
                        CSTĐ TQ
                      </th>
                      <th
                        scope="col"
                        className="border-r border-gray-200 dark:border-gray-600 py-3 px-4 text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider"
                      >
                        Ghi chú
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800">
                    {achievement?.yearlyAchievements &&
                    achievement.yearlyAchievements.length > 0 ? (
                      achievement.yearlyAchievements.map((item, index) => (
                        <tr
                          key={item.id}
                          className="border-b border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
                        >
                          <td className="whitespace-nowrap font-medium border-r border-gray-200 dark:border-gray-600 py-4 px-4">
                            {index + 1}
                          </td>
                          <td className="whitespace-nowrap font-medium border-r border-gray-200 dark:border-gray-600 py-4 px-4">
                            {item.year}
                          </td>
                          <td className="whitespace-nowrap font-medium border-r border-gray-200 dark:border-gray-600 py-4 px-4">
                            {item.decisionNumber || "-"}
                          </td>
                          <td className="whitespace-nowrap font-medium border-r border-gray-200 dark:border-gray-600 py-4 px-4">
                            {item.decisionDate
                              ? new Date(item.decisionDate).toLocaleDateString(
                                  "vi-VN"
                                )
                              : "-"}
                          </td>
                          <td className="whitespace-nowrap font-medium border-r border-gray-200 dark:border-gray-600 py-4 px-4">
                            {item.title || "-"}
                          </td>
                          <td className="whitespace-nowrap font-medium border-r border-gray-200 dark:border-gray-600 py-4 px-4">
                            {item.scientific?.topics?.length > 0
                              ? `Đề tài: ${item.scientific.topics[0].title} (${
                                  item.scientific.topics[0].status ===
                                  "approved"
                                    ? "Đã duyệt"
                                    : item.scientific.topics[0].status ===
                                      "rejected"
                                    ? "Từ chối"
                                    : "Chờ duyệt"
                                })`
                              : item.scientific?.initiatives?.length > 0
                              ? `Sáng kiến: ${
                                  item.scientific.initiatives[0].title
                                } (${
                                  item.scientific.initiatives[0].status ===
                                  "approved"
                                    ? "Đã duyệt"
                                    : item.scientific.initiatives[0].status ===
                                      "rejected"
                                    ? "Từ chối"
                                    : "Chờ duyệt"
                                })`
                              : "-"}
                          </td>
                          <td className="whitespace-nowrap font-medium border-r border-gray-200 dark:border-gray-600 py-4 px-4">
                            {item.hasMinistryReward ? "✓" : "-"}
                          </td>
                          <td className="whitespace-nowrap font-medium border-r border-gray-200 dark:border-gray-600 py-4 px-4">
                            {item.hasNationalReward ? "✓" : "-"}
                          </td>
                          <td className="whitespace-nowrap font-medium border-r border-gray-200 dark:border-gray-600 py-4 px-4">
                            {item.notes || "-"}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan="9"
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
                                d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
                              />
                            </svg>
                            <p className="text-lg font-medium">
                              Không có dữ liệu
                            </p>
                            <p className="text-sm">
                              Không tìm thấy thành tích nào
                            </p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Đề xuất khen thưởng - giống hệt bên admin */}
              {recommendations?.suggestions &&
                recommendations.suggestions.length > 0 && (
                  <div className="w-full pl-6 pb-6 pr-6 mt-6">
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                      <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-3">
                        💡 Đề xuất khen thưởng
                      </h3>
                      <ul className="list-disc pl-5 space-y-1">
                        {recommendations.suggestions.map((s, idx) => (
                          <li
                            key={idx}
                            className="text-sm text-blue-700 dark:text-blue-300"
                          >
                            {s}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const Achievement = () => {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AchievementContent />
    </Suspense>
  );
};

export default Achievement;
