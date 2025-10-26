"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { handleNotify } from "../../../components/notify";
import { BASE_URL } from "@/configs";
import axiosInstance from "@/utils/axiosInstance";

const SemesterManagement = () => {
  const [semesters, setSemesters] = useState([]);
  const [showCreateSemester, setShowCreateSemester] = useState(false);
  const [showEditSemester, setShowEditSemester] = useState(false);
  const [showConfirmDeleteSemester, setShowConfirmDeleteSemester] =
    useState(false);
  const [selectedEditSemesterId, setSelectedEditSemesterId] = useState(null);
  const [editSemester, setEditSemester] = useState({
    code: "",
    schoolYear: "",
  });
  const [editTerm, setEditTerm] = useState("1");
  const [editYearStart, setEditYearStart] = useState("");
  const [editYearEnd, setEditYearEnd] = useState("");
  const [newTerm, setNewTerm] = useState("1");
  const [yearStart, setYearStart] = useState("");
  const [yearEnd, setYearEnd] = useState("");

  useEffect(() => {
    fetchSemesters();
  }, []);

  const fetchSemesters = async () => {
    try {
      const res = await axiosInstance.get(`/semester`);

      // Sắp xếp từ năm mới nhất đến cũ, trong cùng năm thì từ kỳ mới nhất đến cũ
      const sortedSemesters = (res.data || []).sort((a, b) => {
        // So sánh năm học trước
        const yearA = a.schoolYear || "";
        const yearB = b.schoolYear || "";
        if (yearA !== yearB) {
          return yearB.localeCompare(yearA); // Năm mới trước
        }

        // Trong cùng năm, so sánh học kỳ
        const semesterOrder = {
          HK3: 3,
          HK2: 2,
          HK1: 1,
        };
        const semesterA = semesterOrder[a.code] || 0;
        const semesterB = semesterOrder[b.code] || 0;
        return semesterB - semesterA; // Kỳ mới trước
      });

      setSemesters(sortedSemesters);
    } catch (error) {
      console.log("Error fetching semesters:", error);
      handleNotify("error", "Lỗi", "Không thể tải danh sách học kỳ");
    }
  };

  const handleCreateSemester = async (e) => {
    e.preventDefault();
    if (!newTerm || !yearStart || !yearEnd) {
      handleNotify("warning", "Cảnh báo", "Vui lòng điền đầy đủ thông tin");
      return;
    }

    // Kiểm tra năm bắt đầu phải nhỏ hơn năm kết thúc 1
    const startYear = parseInt(yearStart);
    const endYear = parseInt(yearEnd);
    if (startYear >= endYear) {
      handleNotify(
        "warning",
        "Cảnh báo",
        "Năm bắt đầu phải nhỏ hơn năm kết thúc"
      );
      return;
    }

    // Kiểm tra học kỳ và năm học đã tồn tại chưa
    const schoolYear = `${yearStart}-${yearEnd}`;
    const code = `HK${newTerm}`;
    const existingSemester = semesters.find(
      (sem) => sem.schoolYear === schoolYear && sem.code === code
    );
    if (existingSemester) {
      handleNotify(
        "warning",
        "Cảnh báo",
        `${code} năm học ${schoolYear} đã tồn tại`
      );
      return;
    }

    try {
      await axiosInstance.post(`/semester`, {
        code: `HK${newTerm}`,
        schoolYear: schoolYear,
      });

      handleNotify("success", "Thành công", "Đã tạo học kỳ mới");
      setShowCreateSemester(false);
      setNewTerm("1");
      setYearStart("");
      setYearEnd("");
      fetchSemesters();
    } catch (error) {
      console.log("Error creating semester:", error);
      handleNotify(
        "error",
        "Lỗi",
        error?.response?.data?.message || "Không thể tạo học kỳ"
      );
    }
  };

  const handleUpdateSemester = async (e) => {
    e.preventDefault();
    if (
      !selectedEditSemesterId ||
      !editTerm ||
      !editYearStart ||
      !editYearEnd
    ) {
      handleNotify("warning", "Cảnh báo", "Vui lòng điền đầy đủ thông tin");
      return;
    }

    // Kiểm tra năm bắt đầu phải nhỏ hơn năm kết thúc 1
    const startYear = parseInt(editYearStart);
    const endYear = parseInt(editYearEnd);
    if (startYear >= endYear) {
      handleNotify(
        "warning",
        "Cảnh báo",
        "Năm bắt đầu phải nhỏ hơn năm kết thúc"
      );
      return;
    }

    // Kiểm tra học kỳ và năm học đã tồn tại chưa (trừ semester hiện tại)
    const schoolYear = `${editYearStart}-${editYearEnd}`;
    const code = `HK${editTerm}`;
    const existingSemester = semesters.find(
      (sem) =>
        sem.schoolYear === schoolYear &&
        sem.code === code &&
        sem.id !== selectedEditSemesterId
    );
    if (existingSemester) {
      handleNotify(
        "warning",
        "Cảnh báo",
        `${code} năm học ${schoolYear} đã tồn tại`
      );
      return;
    }

    try {
      await axiosInstance.put(`/semester/${selectedEditSemesterId}`, {
        code: `HK${editTerm}`,
        schoolYear: schoolYear,
      });

      handleNotify("success", "Thành công", "Đã cập nhật học kỳ");
      setShowEditSemester(false);
      setSelectedEditSemesterId(null);
      setEditSemester({ code: "", schoolYear: "" });
      setEditTerm("1");
      setEditYearStart("");
      setEditYearEnd("");
      fetchSemesters();
    } catch (error) {
      console.log("Error updating semester:", error);
      handleNotify(
        "error",
        "Lỗi",
        error?.response?.data?.message || "Không thể cập nhật học kỳ"
      );
    }
  };

  const handleDeleteSemester = async () => {
    if (!selectedEditSemesterId) return;

    try {
      await axiosInstance.delete(`/semester/${selectedEditSemesterId}`);

      handleNotify("success", "Thành công", "Đã xóa học kỳ");
      setShowConfirmDeleteSemester(false);
      setSelectedEditSemesterId(null);
      fetchSemesters();
    } catch (error) {
      console.log("Error deleting semester:", error);
      handleNotify(
        "error",
        "Lỗi",
        error?.response?.data?.message || "Không thể xóa học kỳ"
      );
    }
  };

  return (
    <>
      <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="flex-1">
          <div className="w-full pt-20 pl-5">
            <nav className="flex" aria-label="Breadcrumb">
              <ol className="inline-flex items-center space-x-1 md:space-x-2 rtl:space-x-reverse">
                <li className="inline-flex items-center">
                  <a
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
                  </a>
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
                    <div className="ms-1 text-sm font-medium text-gray-500 dark:text-gray-400">
                      Quản lý học kỳ
                    </div>
                  </div>
                </li>
              </ol>
            </nav>
          </div>
          <div className="w-full pt-8 pb-5 pl-5 pr-6 mb-5 flex justify-center">
            <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-8xl shadow-lg">
              <div className="font-bold p-5 flex justify-between items-center border-b border-gray-200 dark:border-gray-700">
                <div className="text-gray-900 dark:text-white">
                  <h1 className="text-2xl font-bold">QUẢN LÝ HỌC KỲ</h1>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Quản lý và xem học kỳ
                  </p>
                </div>
                <button
                  onClick={() => setShowCreateSemester(true)}
                  className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 border border-green-600 hover:border-green-700 rounded-lg transition-colors duration-200 flex items-center"
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
                      d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                    />
                  </svg>
                  Thêm học kỳ
                </button>
              </div>

              <div className="p-6">
                {/* Bảng danh sách học kỳ */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 border border-gray-200 dark:border-gray-700 rounded-lg">
                      <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                          <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider border-r border-gray-200 dark:border-gray-600">
                            Mã học kỳ
                          </th>
                          <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider border-r border-gray-200 dark:border-gray-600">
                            Năm học
                          </th>
                          <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            Thao tác
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {semesters.map((sem) => (
                          <tr
                            key={sem.id}
                            className="hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                            onClick={() => {
                              setSelectedEditSemesterId(sem.id);
                              setEditSemester({
                                code: sem.code || "",
                                schoolYear: sem.schoolYear || "",
                              });
                              // Điền sẵn thông tin cho form edit
                              setEditTerm(sem.code?.replace("HK", "") || "1");
                              const yearParts = (sem.schoolYear || "").split(
                                "-"
                              );
                              setEditYearStart(yearParts[0] || "");
                              setEditYearEnd(yearParts[1] || "");
                              setShowEditSemester(true);
                            }}
                          >
                            <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white text-center border-r border-gray-200 dark:border-gray-600">
                              {sem.code}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-white text-center border-r border-gray-200 dark:border-gray-600">
                              {sem.schoolYear}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-center">
                              <div className="flex justify-center items-center space-x-2">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedEditSemesterId(sem.id);
                                    setEditSemester({
                                      code: sem.code || "",
                                      schoolYear: sem.schoolYear || "",
                                    });
                                    // Điền sẵn thông tin cho form edit
                                    setEditTerm(
                                      sem.code?.replace("HK", "") || "1"
                                    );
                                    const yearParts = (
                                      sem.schoolYear || ""
                                    ).split("-");
                                    setEditYearStart(yearParts[0] || "");
                                    setEditYearEnd(yearParts[1] || "");
                                    setShowEditSemester(true);
                                  }}
                                  className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 p-1 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors duration-200"
                                  title="Chỉnh sửa"
                                >
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    strokeWidth="1.5"
                                    stroke="currentColor"
                                    className="w-4 h-4"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10"
                                    />
                                  </svg>
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedEditSemesterId(sem.id);
                                    setShowConfirmDeleteSemester(true);
                                  }}
                                  className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 p-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors duration-200"
                                  title="Xóa"
                                >
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    strokeWidth="1.5"
                                    stroke="currentColor"
                                    className="w-4 h-4"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      d="m9.75 9.75 4.5 4.5m0-4.5-4.5 4.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                                    />
                                  </svg>
                                </button>
                              </div>
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

          {/* Modal thêm học kỳ */}
          {showCreateSemester && (
            <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
              <div className="bg-black bg-opacity-50 inset-0 fixed" />
              <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md overflow-hidden">
                <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Thêm học kỳ
                  </h2>
                  <button
                    onClick={() => setShowCreateSemester(false)}
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
                      />
                    </svg>
                  </button>
                </div>
                <form onSubmit={handleCreateSemester} className="p-4">
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    <div>
                      <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                        Chọn kỳ
                      </label>
                      <select
                        value={newTerm}
                        onChange={(e) => setNewTerm(e.target.value)}
                        className="bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                      >
                        <option value="1">HK1</option>
                        <option value="2">HK2</option>
                        <option value="3">HK3</option>
                      </select>
                    </div>
                    <div>
                      <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                        Năm bắt đầu
                      </label>
                      <input
                        type="number"
                        value={yearStart}
                        onChange={(e) => {
                          setYearStart(e.target.value);
                          // Tự động điền năm kết thúc = năm bắt đầu + 1
                          if (e.target.value) {
                            setYearEnd(
                              (parseInt(e.target.value) + 1).toString()
                            );
                          } else {
                            // Nếu xóa hết năm bắt đầu thì xóa luôn năm kết thúc
                            setYearEnd("");
                          }
                        }}
                        placeholder="vd: 2024"
                        className="bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                      />
                    </div>
                    <div>
                      <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                        Năm kết thúc
                      </label>
                      <input
                        type="number"
                        value={yearEnd}
                        onChange={(e) => {
                          setYearEnd(e.target.value);
                          // Tự động điền năm bắt đầu = năm kết thúc - 1
                          if (e.target.value) {
                            setYearStart(
                              (parseInt(e.target.value) - 1).toString()
                            );
                          } else {
                            // Nếu xóa hết năm kết thúc thì xóa luôn năm bắt đầu
                            setYearStart("");
                          }
                        }}
                        placeholder="vd: 2025"
                        className="bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-3">
                    <button
                      type="button"
                      className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 focus:ring-4 focus:outline-none focus:ring-gray-300 dark:focus:ring-gray-700"
                      onClick={() => setShowCreateSemester(false)}
                    >
                      Hủy
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg focus:ring-4 focus:outline-none focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
                    >
                      Thêm
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Modal chỉnh sửa học kỳ */}
          {showEditSemester && (
            <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
              <div className="bg-black bg-opacity-50 inset-0 fixed" />
              <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md overflow-hidden">
                <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Chỉnh sửa học kỳ
                  </h2>
                  <button
                    onClick={() => setShowEditSemester(false)}
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
                      />
                    </svg>
                  </button>
                </div>
                <form onSubmit={handleUpdateSemester} className="p-4">
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    <div>
                      <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                        Chọn kỳ
                      </label>
                      <select
                        value={editTerm}
                        onChange={(e) => setEditTerm(e.target.value)}
                        className="bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                      >
                        <option value="1">HK1</option>
                        <option value="2">HK2</option>
                        <option value="3">HK3</option>
                      </select>
                    </div>
                    <div>
                      <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                        Năm bắt đầu
                      </label>
                      <input
                        type="number"
                        value={editYearStart}
                        onChange={(e) => {
                          setEditYearStart(e.target.value);
                          // Tự động điền năm kết thúc = năm bắt đầu + 1
                          if (e.target.value) {
                            setEditYearEnd(
                              (parseInt(e.target.value) + 1).toString()
                            );
                          } else {
                            // Nếu xóa hết năm bắt đầu thì xóa luôn năm kết thúc
                            setEditYearEnd("");
                          }
                        }}
                        placeholder="vd: 2024"
                        className="bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                      />
                    </div>
                    <div>
                      <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                        Năm kết thúc
                      </label>
                      <input
                        type="number"
                        value={editYearEnd}
                        onChange={(e) => {
                          setEditYearEnd(e.target.value);
                          // Tự động điền năm bắt đầu = năm kết thúc - 1
                          if (e.target.value) {
                            setEditYearStart(
                              (parseInt(e.target.value) - 1).toString()
                            );
                          } else {
                            // Nếu xóa hết năm kết thúc thì xóa luôn năm bắt đầu
                            setEditYearStart("");
                          }
                        }}
                        placeholder="vd: 2025"
                        className="bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-3">
                    <button
                      type="button"
                      className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 focus:ring-4 focus:outline-none focus:ring-gray-300 dark:focus:ring-gray-700"
                      onClick={() => setShowEditSemester(false)}
                    >
                      Hủy
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg focus:ring-4 focus:outline-none focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
                    >
                      Cập nhật
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Modal xác nhận xóa học kỳ */}
          {showConfirmDeleteSemester && (
            <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
              <div className="bg-black bg-opacity-50 inset-0 fixed" />
              <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md overflow-hidden">
                <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Xác nhận xóa học kỳ
                  </h2>
                  <button
                    onClick={() => setShowConfirmDeleteSemester(false)}
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
                      />
                    </svg>
                  </button>
                </div>
                <div className="p-4">
                  <p className="text-gray-700 dark:text-gray-300 mb-4">
                    Bạn có chắc chắn muốn xóa học kỳ này? Hành động này không
                    thể hoàn tác.
                  </p>
                  <div className="flex justify-end gap-3">
                    <button
                      type="button"
                      className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 focus:ring-4 focus:outline-none focus:ring-gray-300 dark:focus:ring-gray-700"
                      onClick={() => setShowConfirmDeleteSemester(false)}
                    >
                      Hủy
                    </button>
                    <button
                      type="button"
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg focus:ring-4 focus:outline-none focus:ring-red-300 dark:bg-red-600 dark:hover:bg-red-700 dark:focus:ring-red-800"
                      onClick={handleDeleteSemester}
                    >
                      Xóa
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default SemesterManagement;
