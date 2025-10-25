"use client";

import axios from "axios";
import Link from "next/link";
import { jwtDecode } from "jwt-decode";
import { useState, useEffect } from "react";
import SideBar from "@/components/sidebar";
import Loader from "@/components/loader";
import { useLoading } from "@/hooks";
import { handleNotify } from "../../../components/notify";
import { BASE_URL } from "@/configs";

const CutRice = () => {
  const [cutRice, setCutRice] = useState(null);
  const [studentId, setStudentId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formUpdateData, setFormUpdateData] = useState({
    monday: { breakfast: false, lunch: false, dinner: false },
    tuesday: { breakfast: false, lunch: false, dinner: false },
    wednesday: { breakfast: false, lunch: false, dinner: false },
    thursday: { breakfast: false, lunch: false, dinner: false },
    friday: { breakfast: false, lunch: false, dinner: false },
    saturday: { breakfast: false, lunch: false, dinner: false },
    sunday: { breakfast: false, lunch: false, dinner: false },
  });

  // Mapping để hiển thị tiếng Việt
  const dayDisplayMapping = {
    monday: "Thứ 2",
    tuesday: "Thứ 3",
    wednesday: "Thứ 4",
    thursday: "Thứ 5",
    friday: "Thứ 6",
    saturday: "Thứ 7",
    sunday: "Chủ nhật",
  };
  const { loading, withLoading } = useLoading(true);

  const handleAuthenticationModalClick = (event) => {
    if (event.target.id === "authentication-modal") {
      setShowModal(false);
    }
    if (event.target.id === "authentication-modal1") {
      setShowForm(false);
    }
  };

  const initializeFormData = () => {
    if (cutRice) {
      setFormUpdateData({
        monday: cutRice.monday || {
          breakfast: false,
          lunch: false,
          dinner: false,
        },
        tuesday: cutRice.tuesday || {
          breakfast: false,
          lunch: false,
          dinner: false,
        },
        wednesday: cutRice.wednesday || {
          breakfast: false,
          lunch: false,
          dinner: false,
        },
        thursday: cutRice.thursday || {
          breakfast: false,
          lunch: false,
          dinner: false,
        },
        friday: cutRice.friday || {
          breakfast: false,
          lunch: false,
          dinner: false,
        },
        saturday: cutRice.saturday || {
          breakfast: false,
          lunch: false,
          dinner: false,
        },
        sunday: cutRice.sunday || {
          breakfast: false,
          lunch: false,
          dinner: false,
        },
      });
    }
  };

  const handleEditClick = () => {
    initializeFormData();
    setShowModal(true);
  };

  const handleAddClick = () => {
    // Reset form về trạng thái ban đầu
    setFormUpdateData({
      monday: { breakfast: false, lunch: false, dinner: false },
      tuesday: { breakfast: false, lunch: false, dinner: false },
      wednesday: { breakfast: false, lunch: false, dinner: false },
      thursday: { breakfast: false, lunch: false, dinner: false },
      friday: { breakfast: false, lunch: false, dinner: false },
      saturday: { breakfast: false, lunch: false, dinner: false },
      sunday: { breakfast: false, lunch: false, dinner: false },
    });
    setShowForm(true);
  };

  // Fetch studentId from userId
  const fetchStudentId = async () => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const decodedToken = jwtDecode(token);
        const res = await axios.get(
          `${BASE_URL}/student/by-user/${decodedToken.id}`,
          {
            headers: { token: `Bearer ${token}` },
          }
        );
        setStudentId(res.data.id);
        return res.data.id;
      } catch (error) {
        console.error("Error fetching studentId:", error);
        return null;
      }
    }
    return null;
  };

  const fetchCutRice = async (sid) => {
    const token = localStorage.getItem("token");

    if (token && sid) {
      try {
        const res = await axios.get(`${BASE_URL}/student/${sid}/cut-rice`, {
          headers: {
            token: `Bearer ${token}`,
          },
        });

        // Đảm bảo response có đúng format
        if (res.data && typeof res.data === "object") {
          setCutRice(res.data);
        } else {
          // Nếu không có dữ liệu, set về null
          setCutRice(null);
        }
      } catch (error) {
        setCutRice(null);
      }
    }
  };

  const handleUpdate = async (e, cutRiceId) => {
    e.preventDefault();
    const token = localStorage.getItem("token");

    if (token && studentId) {
      try {
        const response = await axios.put(
          `${BASE_URL}/student/${studentId}/cut-rice/${cutRiceId}`,
          formUpdateData,
          {
            headers: {
              token: `Bearer ${token}`,
            },
          }
        );

        if (response.status === 200) {
          setCutRice(response.data);
          setShowModal(false);
        } else {
          handleNotify(
            "warning",
            "Cảnh báo!",
            "Đã xảy ra lỗi, vui lòng thử lại sau."
          );
        }
        handleNotify(
          "success",
          "Thành công!",
          "Chỉnh sửa lịch cắt cơm thành công"
        );
      } catch (error) {
        handleNotify("danger", "Lỗi!", error.response.data);
      }
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    if (token && studentId) {
      try {
        const response = await axios.post(
          `${BASE_URL}/student/${studentId}/cut-rice`,
          formUpdateData,
          {
            headers: {
              token: `Bearer ${token}`,
            },
          }
        );

        if (response.status === 201) {
          setCutRice(response.data);
          setShowForm(false);
        } else {
          handleNotify(
            "warning",
            "Cảnh báo!",
            "Đã xảy ra lỗi, vui lòng thử lại sau."
          );
        }
        handleNotify("success", "Thành công!", "Tạo lịch cắt cơm thành công");
      } catch (error) {
        handleNotify("danger", "Lỗi!", error.response.data);
      }
    }
  };

  useEffect(() => {
    const loadData = async () => {
      await withLoading(async () => {
        const sid = await fetchStudentId();
        if (sid) {
          await fetchCutRice(sid);
        }
      });
    };
    loadData();
  }, [withLoading]);

  if (loading) {
    return <Loader text="Đang tải lịch cắt cơm..." />;
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
                      Cắt cơm
                    </div>
                  </div>
                </li>
              </ol>
            </nav>
          </div>
          <div className="w-full pt-8 pb-5 pl-5 pr-6 mb-5">
            <div className="bg-white dark:bg-gray-800 rounded-lg w-full shadow-lg">
              {/* Ẩn modal chỉnh sửa cho user thường */}
              {/* {showModal && (
                <div className="fixed inset-0 flex items-center justify-center z-50 p-4 mt-20">
                  <div className="bg-black bg-opacity-50 inset-0 fixed"></div>
                  <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
                    <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                      <h2 className="text-xl font-semibold text-gray-900 dark:text-white pr-12">
                        Chỉnh sửa lịch cắt cơm
                      </h2>
                      <button
                        onClick={() => setShowModal(false)}
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
                    <div className="overflow-y-auto max-h-[calc(90vh-120px)]">
                      <form
                        onSubmit={(e) => handleUpdate(e, cutRice?.id)}
                        className="p-6"
                      >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {Object.entries(formUpdateData).map(
                            ([day, meals]) => (
                              <div
                                key={day}
                                className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4"
                              >
                                <h3 className="font-semibold text-gray-900 dark:text-white mb-3 capitalize">
                                  {dayDisplayMapping[day]}
                                </h3>
                                <div className="space-y-3">
                                  {Object.entries(meals).map(
                                    ([meal, checked]) => (
                                      <label
                                        key={meal}
                                        className="flex items-center space-x-3"
                                      >
                                        <input
                                          type="checkbox"
                                          checked={checked}
                                          onChange={(e) => {
                                            setFormUpdateData((prev) => ({
                                              ...prev,
                                              [day]: {
                                                ...prev[day],
                                                [meal]: e.target.checked,
                                              },
                                            }));
                                          }}
                                          className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                                        />
                                        <span className="text-gray-900 dark:text-white">
                                          {meal === "breakfast"
                                            ? "Bữa sáng"
                                            : meal === "lunch"
                                            ? "Bữa trưa"
                                            : "Bữa tối"}
                                        </span>
                                      </label>
                                    )
                                  )}
                                </div>
                              </div>
                            )
                          )}
                        </div>
                        <div className="flex justify-end mt-6">
                          <button
                            type="button"
                            className="px-4 py-2 bg-gray-200 text-gray-500 rounded-lg hover:bg-gray-300 hover:text-gray-900 mr-2"
                            onClick={() => setShowModal(false)}
                          >
                            Hủy
                          </button>
                          <button
                            type="submit"
                            className="px-4 py-2 text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm w-full sm:w-auto dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
                          >
                            Cập nhật
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                </div>
              )} */}
              {/* Ẩn modal thêm mới cho user thường */}
              {/* {showForm && (
                <div className="fixed inset-0 flex items-center justify-center z-50 p-4 mt-20">
                  <div className="bg-black bg-opacity-50 inset-0 fixed"></div>
                  <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
                    <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                      <h2 className="text-xl font-semibold text-gray-900 dark:text-white pr-12">
                        Tạo lịch cắt cơm
                      </h2>
                      <button
                        onClick={() => setShowForm(false)}
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
                    <div className="overflow-y-auto max-h-[calc(90vh-120px)]">
                      <form onSubmit={handleCreate} className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {Object.entries(formUpdateData).map(
                            ([day, meals]) => (
                              <div
                                key={day}
                                className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4"
                              >
                                <h3 className="font-semibold text-gray-900 dark:text-white mb-3 capitalize">
                                  {dayDisplayMapping[day]}
                                </h3>
                                <div className="space-y-3">
                                  {Object.entries(meals).map(
                                    ([meal, checked]) => (
                                      <label
                                        key={meal}
                                        className="flex items-center space-x-3"
                                      >
                                        <input
                                          type="checkbox"
                                          checked={checked}
                                          onChange={(e) => {
                                            setFormUpdateData((prev) => ({
                                              ...prev,
                                              [day]: {
                                                ...prev[day],
                                                [meal]: e.target.checked,
                                              },
                                            }));
                                          }}
                                          className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                                        />
                                        <span className="text-gray-900 dark:text-white">
                                          {meal === "breakfast"
                                            ? "Bữa sáng"
                                            : meal === "lunch"
                                            ? "Bữa trưa"
                                            : "Bữa tối"}
                                        </span>
                                      </label>
                                    )
                                  )}
                                </div>
                              </div>
                            )
                          )}
                        </div>
                        <div className="flex justify-end mt-6">
                          <button
                            type="button"
                            className="px-4 py-2 bg-gray-200 text-gray-500 rounded-lg hover:bg-gray-300 hover:text-gray-900 mr-2"
                            onClick={() => setShowForm(false)}
                          >
                            Hủy
                          </button>
                          <button
                            type="submit"
                            className="px-4 py-2 text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm w-full sm:w-auto dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
                          >
                            Tạo
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                </div>
              )} */}
              <div className="flex justify-between font-bold p-5 border-b border-gray-200 dark:border-gray-700">
                <div className="text-gray-900 dark:text-white">
                  <h1 className="text-2xl font-bold">LỊCH CẮT CƠM</h1>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Quản lý và xem lịch cắt cơm
                  </p>
                </div>
                <div className="text-gray-900 dark:text-white text-lg"></div>
                {/* Ẩn các nút chỉnh sửa và thêm mới cho user thường */}
                {/* <div className="flex space-x-3">
                  <button
                    onClick={handleEditClick}
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
                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                      />
                    </svg>
                    Chỉnh sửa
                  </button>
                  <button
                    onClick={handleAddClick}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 border border-blue-600 hover:border-blue-700 rounded-lg transition-colors duration-200 flex items-center"
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
                    Thêm
                  </button>
                </div> */}
              </div>
              {/* Thông báo cho user biết chỉ admin mới có thể chỉnh sửa */}
              <div className="px-5 py-3 bg-blue-50 dark:bg-blue-900/20 border-b border-blue-200 dark:border-blue-800">
                <div className="flex items-center text-blue-700 dark:text-blue-300 text-sm">
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
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span>
                    Chỉ quản trị viên mới có thể chỉnh sửa lịch cắt cơm
                  </span>
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
                          Bữa sáng
                        </th>
                        <th
                          scope="col"
                          className="border-r border-gray-200 dark:border-gray-600 py-3 px-4 text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider"
                        >
                          Bữa trưa
                        </th>
                        <th
                          scope="col"
                          className="border-r border-gray-200 dark:border-gray-600 py-3 px-4 text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider"
                        >
                          Bữa tối
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800">
                      {cutRice ? (
                        <>
                          <tr className="border-b border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200">
                            <td className="whitespace-nowrap font-medium border-r border-gray-200 dark:border-gray-600 py-4 px-4">
                              Thứ 2
                            </td>
                            <td className="whitespace-nowrap font-medium border-r border-gray-200 dark:border-gray-600 py-4 px-4">
                              {cutRice.monday?.breakfast ? "x" : ""}
                            </td>
                            <td className="whitespace-nowrap font-medium border-r border-gray-200 dark:border-gray-600 py-4 px-4">
                              {cutRice.monday?.lunch ? "x" : ""}
                            </td>
                            <td className="whitespace-nowrap font-medium border-r border-gray-200 dark:border-gray-600 py-4 px-4">
                              {cutRice.monday?.dinner ? "x" : ""}
                            </td>
                          </tr>
                          <tr className="border-b border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200">
                            <td className="whitespace-nowrap font-medium border-r border-gray-200 dark:border-gray-600 py-4 px-4">
                              Thứ 3
                            </td>
                            <td className="whitespace-nowrap font-medium border-r border-gray-200 dark:border-gray-600 py-4 px-4">
                              {cutRice.tuesday?.breakfast ? "x" : ""}
                            </td>
                            <td className="whitespace-nowrap font-medium border-r border-gray-200 dark:border-gray-600 py-4 px-4">
                              {cutRice.tuesday?.lunch ? "x" : ""}
                            </td>
                            <td className="whitespace-nowrap font-medium border-r border-gray-200 dark:border-gray-600 py-4 px-4">
                              {cutRice.tuesday?.dinner ? "x" : ""}
                            </td>
                          </tr>
                          <tr className="border-b border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200">
                            <td className="whitespace-nowrap font-medium border-r border-gray-200 dark:border-gray-600 py-4 px-4">
                              Thứ 4
                            </td>
                            <td className="whitespace-nowrap font-medium border-r border-gray-200 dark:border-gray-600 py-4 px-4">
                              {cutRice.wednesday?.breakfast ? "x" : ""}
                            </td>
                            <td className="whitespace-nowrap font-medium border-r border-gray-200 dark:border-gray-600 py-4 px-4">
                              {cutRice.wednesday?.lunch ? "x" : ""}
                            </td>
                            <td className="whitespace-nowrap font-medium border-r border-gray-200 dark:border-gray-600 py-4 px-4">
                              {cutRice.wednesday?.dinner ? "x" : ""}
                            </td>
                          </tr>
                          <tr className="border-b border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200">
                            <td className="whitespace-nowrap font-medium border-r border-gray-200 dark:border-gray-600 py-4 px-4">
                              Thứ 5
                            </td>
                            <td className="whitespace-nowrap font-medium border-r border-gray-200 dark:border-gray-600 py-4 px-4">
                              {cutRice.thursday?.breakfast ? "x" : ""}
                            </td>
                            <td className="whitespace-nowrap font-medium border-r border-gray-200 dark:border-gray-600 py-4 px-4">
                              {cutRice.thursday?.lunch ? "x" : ""}
                            </td>
                            <td className="whitespace-nowrap font-medium border-r border-gray-200 dark:border-gray-600 py-4 px-4">
                              {cutRice.thursday?.dinner ? "x" : ""}
                            </td>
                          </tr>
                          <tr className="border-b border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200">
                            <td className="whitespace-nowrap font-medium border-r border-gray-200 dark:border-gray-600 py-4 px-4">
                              Thứ 6
                            </td>
                            <td className="whitespace-nowrap font-medium border-r border-gray-200 dark:border-gray-600 py-4 px-4">
                              {cutRice.friday?.breakfast ? "x" : ""}
                            </td>
                            <td className="whitespace-nowrap font-medium border-r border-gray-200 dark:border-gray-600 py-4 px-4">
                              {cutRice.friday?.lunch ? "x" : ""}
                            </td>
                            <td className="whitespace-nowrap font-medium border-r border-gray-200 dark:border-gray-600 py-4 px-4">
                              {cutRice.friday?.dinner ? "x" : ""}
                            </td>
                          </tr>
                          <tr className="border-b border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200">
                            <td className="whitespace-nowrap font-medium border-r border-gray-200 dark:border-gray-600 py-4 px-4">
                              Thứ 7
                            </td>
                            <td className="whitespace-nowrap font-medium border-r border-gray-200 dark:border-gray-600 py-4 px-4">
                              {cutRice.saturday?.breakfast ? "x" : ""}
                            </td>
                            <td className="whitespace-nowrap font-medium border-r border-gray-200 dark:border-gray-600 py-4 px-4">
                              {cutRice.saturday?.lunch ? "x" : ""}
                            </td>
                            <td className="whitespace-nowrap font-medium border-r border-gray-200 dark:border-gray-600 py-4 px-4">
                              {cutRice.saturday?.dinner ? "x" : ""}
                            </td>
                          </tr>
                          <tr className="border-b border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200">
                            <td className="whitespace-nowrap font-medium border-r border-gray-200 dark:border-gray-600 py-4 px-4">
                              Chủ nhật
                            </td>
                            <td className="whitespace-nowrap font-medium border-r border-gray-200 dark:border-gray-600 py-4 px-4">
                              {cutRice.sunday?.breakfast ? "x" : ""}
                            </td>
                            <td className="whitespace-nowrap font-medium border-r border-gray-200 dark:border-gray-600 py-4 px-4">
                              {cutRice.sunday?.lunch ? "x" : ""}
                            </td>
                            <td className="whitespace-nowrap font-medium border-r border-gray-200 dark:border-gray-600 py-4 px-4">
                              {cutRice.sunday?.dinner ? "x" : ""}
                            </td>
                          </tr>
                        </>
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
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth="2"
                                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                />
                              </svg>
                              <p className="text-lg font-medium">
                                Chưa có lịch cắt cơm
                              </p>
                              <p className="text-sm">
                                Vui lòng tạo lịch cắt cơm mới
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
    </>
  );
};

export default CutRice;
