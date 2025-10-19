"use client";

import axios from "axios";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import dayjs from "dayjs";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import SideBar from "@/components/sidebar";
import { handleNotify } from "../../../components/notify";
import { useTheme } from "@/hooks/useTheme";

import { BASE_URL } from "@/configs";
const ListGuard = () => {
  const router = useRouter();
  const { isDark } = useTheme();
  const [listGuard, setListGuard] = useState([]);
  const [date, setDate] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);
  const [showFormAdd, setShowFormAdd] = useState(false);
  const [showFormEdit, setShowFormEdit] = useState(false);
  const [editFormData, setEditFormData] = useState({
    location1: Array(8).fill(""),
    location2: Array(8).fill(""),
    location3: Array(8).fill(""),
  });
  const [guardId, setGuardId] = useState(null);
  const [addFormData, setAddFormData] = useState({
    dayGuard: "",
    guardPassword: {
      question: "",
      answer: "",
    },
    location1: Array(8).fill(""),
    location2: Array(8).fill(""),
    location3: Array(8).fill(""),
  });

  const handleShowFormUpdate = (guardId) => {
    setGuardId(guardId);
    setShowFormEdit(true);
    document.body.style.overflow = "hidden";
  };

  const handleUpdate = async (e, guardId) => {
    e.preventDefault();
    const token = localStorage.getItem("token");

    if (token) {
      try {
        await axios.put(`${BASE_URL}/user/guard/${guardId}`, editFormData, {
          headers: {
            token: `Bearer ${token}`,
          },
        });
        handleNotify(
          "success",
          "Thành công!",
          "Chỉnh sửa ca gác đêm thành công"
        );
        setShowFormEdit(false);
        document.body.style.overflow = "unset";
        fetchListGuard();
      } catch (error) {
        handleNotify("danger", "Lỗi!", error);
        setShowFormEdit(false);
        document.body.style.overflow = "unset";
      }
    }
  };

  const handleAddFormData = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    try {
      const response = await axios.post(`${BASE_URL}/user/guard`, addFormData, {
        headers: {
          token: `Bearer ${token}`,
        },
      });
      handleNotify("success", "Thành công!", "Thêm ca gác đêm thành công");
      setListGuard([...listGuard, response.data]);
      setShowFormAdd(false);
      document.body.style.overflow = "unset";
      fetchListGuard();
    } catch (error) {
      setShowFormAdd(false);
      document.body.style.overflow = "unset";
      handleNotify("danger", "Lỗi!", error.response.data);
    }
  };

  const handleDelete = (date) => {
    setDate(date);
    setShowConfirm(true);
  };

  const handleCancelDelete = () => {
    setShowConfirm(false);
  };

  const handleConfirmDelete = (e, date) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    const compareDate = new Date(date);

    if (token) {
      axios
        .delete(`${BASE_URL}/user/guard/${date}`, {
          headers: {
            token: `Bearer ${token}`,
          },
        })
        .then(() => {
          setListGuard(
            listGuard.filter((guard) => {
              const guardDate = new Date(guard.dayGuard);
              return guardDate.toDateString() !== compareDate.toDateString();
            })
          );
          handleNotify("success", "Thành công!", "Xóa ca gác đêm thành công");
          setShowConfirm(false);
        })
        .catch((error) => handleNotify("danger", "Lỗi!", error));
    }
  };

  useEffect(() => {
    fetchListGuard();
  }, []);

  // Cleanup function để khôi phục scroll khi component unmount
  useEffect(() => {
    return () => {
      document.body.style.overflow = "unset";
    };
  }, []);

  const fetchListGuard = async () => {
    const token = localStorage.getItem("token");

    if (token) {
      try {
        const res = await axios.get(`${BASE_URL}/user/listGuard`, {
          headers: {
            token: `Bearer ${token}`,
          },
        });

        setListGuard(res.data);
      } catch (error) {
        console.log(error);
      }
    }
  };

  const handleSubmit = async (e, date) => {
    e.preventDefault();
    router.push(`/admin/list-guard?date=${date}`);
    const token = localStorage.getItem("token");

    if (token) {
      try {
        const res = await axios.get(`${BASE_URL}/user/listGuard?date=${date}`, {
          headers: {
            token: `Bearer ${token}`,
          },
        });

        if (res.status === 404) setListGuard([]);

        setListGuard(res.data);
      } catch (error) {
        handleNotify("danger", "Lỗi!", error);
      }
    }
  };

  const handleRowClick = (guardId) => {
    router.push(`/admin/list-guard/${guardId}`);
  };

  return (
    <>
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
                      Danh sách gác đêm
                    </div>
                  </div>
                </li>
              </ol>
            </nav>
          </div>
          {showFormEdit ? (
            <div className="fixed top-0 left-0 mt-8 w-full h-full bg-gray-900 bg-opacity-50 z-20 flex justify-center items-center">
              <div
                className={`rounded-lg shadow-lg w-full max-w-3xl relative ${
                  isDark ? "bg-gray-800" : "bg-white"
                }`}
              >
                <h2
                  className={`text-xl font-bold mb-4 pt-6 pl-6 ${
                    isDark ? "text-white" : "text-gray-900"
                  }`}
                >
                  Chỉnh sửa lịch gác đêm
                </h2>
                <button
                  onClick={() => {
                    setShowFormEdit(false);
                    document.body.style.overflow = "unset";
                  }}
                  className="absolute top-0 right-0 m-4 p-1 rounded-md text-gray-400 cursor-pointer hover:bg-gray-200 hover:text-gray-700"
                >
                  <svg
                    className="h-6 w-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M6 18L18 6M6 6l12 12"
                    ></path>
                  </svg>
                </button>
                <form
                  onSubmit={(e) => handleUpdate(e, guardId)}
                  className="grid grid-cols-3 gap-4 px-6 pb-3"
                >
                  {/* Column 1: Day Guard & Location 1 */}
                  <div className="col-span-1">
                    <div className="mb-2">
                      <label
                        className={`block text-sm font-bold mb-1 ${
                          isDark ? "text-gray-300" : "text-gray-700"
                        }`}
                        htmlFor="dayGuard1"
                      >
                        Ngày gác
                      </label>
                      <DatePicker
                        id="dayGuard1"
                        dateFormat="dd/MM/yyyy"
                        selected={editFormData.dayGuard}
                        onChange={(date) =>
                          setEditFormData({
                            ...editFormData,
                            dayGuard: date,
                          })
                        }
                        className={`shadow text-sm appearance-none border rounded w-full py-2.5 px-3 leading-tight focus:outline-none focus:shadow-outline ${
                          isDark
                            ? "bg-gray-700 border-gray-600 text-white"
                            : "bg-white border-gray-300 text-gray-900"
                        }`}
                        placeholderText="Ngày/Tháng/Năm"
                        wrapperClassName="w-full"
                      />
                    </div>
                    <div>
                      <label
                        className={`block text-sm font-bold mb-1 ${
                          isDark ? "text-gray-300" : "text-gray-700"
                        }`}
                        htmlFor="location1"
                      >
                        Vọng 1 (Cầu thang tòa S1)
                      </label>
                      <ul>
                        {editFormData.location1?.map((item, index) => (
                          <li key={index}>
                            <input
                              className={`shadow text-sm mt-1 appearance-none border rounded w-full py-2.5 px-3 leading-tight focus:outline-none focus:shadow-outline ${
                                isDark
                                  ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                                  : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"
                              }`}
                              type="text"
                              placeholder="vd: Nguyễn Văn A"
                              value={item}
                              onChange={(e) => {
                                const updatedLocations = [
                                  ...editFormData.location1,
                                ];
                                updatedLocations[index] = e.target.value;
                                setEditFormData({
                                  ...editFormData,
                                  location1: updatedLocations,
                                });
                              }}
                            />
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Column 2: Question & Location 2 */}
                  <div className="col-span-1">
                    <div className="mb-2">
                      <label
                        className={`block text-sm font-bold mb-1 ${
                          isDark ? "text-gray-300" : "text-gray-700"
                        }`}
                        htmlFor="question1"
                      >
                        Hỏi
                      </label>
                      <input
                        className={`shadow text-sm appearance-none border rounded w-full py-2.5 px-3 leading-tight focus:outline-none focus:shadow-outline ${
                          isDark
                            ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                            : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"
                        }`}
                        id="question1"
                        type="text"
                        placeholder="vd: Hà Nội"
                        value={editFormData.guardPassword?.question}
                        onChange={(e) =>
                          setEditFormData({
                            ...editFormData,
                            guardPassword: {
                              ...editFormData.guardPassword,
                              question: e.target.value,
                            },
                          })
                        }
                      />
                    </div>
                    <div>
                      <label
                        className={`block text-sm font-bold mb-1 ${
                          isDark ? "text-gray-300" : "text-gray-700"
                        }`}
                        htmlFor="location2"
                      >
                        Vọng 2 (Đối diện tòa S2)
                      </label>
                      <ul>
                        {editFormData.location2?.map((item, index) => (
                          <li key={index}>
                            <input
                              className={`shadow text-sm mt-1 appearance-none border rounded w-full py-2.5 px-3 leading-tight focus:outline-none focus:shadow-outline ${
                                isDark
                                  ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                                  : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"
                              }`}
                              type="text"
                              placeholder="vd: Nguyễn Văn A"
                              value={item}
                              onChange={(e) => {
                                const updatedLocations = [
                                  ...editFormData.location2,
                                ];
                                updatedLocations[index] = e.target.value;
                                setEditFormData({
                                  ...editFormData,
                                  location2: updatedLocations,
                                });
                              }}
                            />
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Column 3: Answer & Location 3 */}
                  <div className="col-span-1">
                    <div className="mb-2">
                      <label
                        className={`block text-sm font-bold mb-1 ${
                          isDark ? "text-gray-300" : "text-gray-700"
                        }`}
                        htmlFor="answer1"
                      >
                        Đáp
                      </label>
                      <input
                        className={`shadow text-sm appearance-none border rounded w-full py-2.5 px-3 leading-tight focus:outline-none focus:shadow-outline ${
                          isDark
                            ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                            : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"
                        }`}
                        id="answer1"
                        type="text"
                        placeholder="vd: Hà Tĩnh"
                        value={editFormData.guardPassword?.answer}
                        onChange={(e) =>
                          setEditFormData({
                            ...editFormData,
                            guardPassword: {
                              ...editFormData.guardPassword,
                              answer: e.target.value,
                            },
                          })
                        }
                      />
                    </div>
                    <div>
                      <label
                        className={`block text-sm font-bold mb-1 ${
                          isDark ? "text-gray-300" : "text-gray-700"
                        }`}
                        htmlFor="location3"
                      >
                        Vọng 3 (Đằng sau tòa S3)
                      </label>
                      <ul>
                        {editFormData.location3?.map((item, index) => (
                          <li key={index}>
                            <input
                              className={`shadow text-sm mt-1 appearance-none border rounded w-full py-2.5 px-3 leading-tight focus:outline-none focus:shadow-outline ${
                                isDark
                                  ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                                  : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"
                              }`}
                              type="text"
                              placeholder="vd: Nguyễn Văn A"
                              value={item}
                              onChange={(e) => {
                                const updatedLocations = [
                                  ...editFormData.location3,
                                ];
                                updatedLocations[index] = e.target.value;
                                setEditFormData({
                                  ...editFormData,
                                  location3: updatedLocations,
                                });
                              }}
                            />
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  {/* Submit Button */}
                  <div className="col-span-3 flex justify-end">
                    <button
                      type="button"
                      className="px-4 py-2 bg-gray-200 text-gray-500 rounded-lg hover:bg-gray-300 hover:text-gray-900 mr-2"
                      onClick={() => {
                        setShowFormEdit(false);
                        document.body.style.overflow = "unset";
                      }}
                    >
                      Hủy
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm w-full sm:w-auto dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
                    >
                      Chỉnh sửa
                    </button>
                  </div>
                </form>
              </div>
            </div>
          ) : (
            ""
          )}
          <div className="w-full pt-8 pb-5 pl-5 pr-6 mb-5">
            {showConfirm && (
              <div className="fixed top-0 left-0 z-20 w-full h-full bg-slate-400 bg-opacity-50 flex justify-center items-center">
                <div
                  className={`relative p-4 text-center rounded-lg shadow sm:p-5 ${
                    isDark ? "bg-gray-800" : "bg-white"
                  }`}
                >
                  <button
                    onClick={handleCancelDelete}
                    type="button"
                    className="absolute top-2.5 right-2.5 bg-transparent hover:bg-gray-200 rounded-lg text-sm p-1.5 ml-auto inline-flex items-center dark:hover:bg-gray-600 dark:hover:text-white"
                    data-modal-toggle="deleteModal"
                  >
                    <svg
                      aria-hidden="true"
                      className="w-5 h-5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        fillRule="evenodd"
                        d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                        clipRule="evenodd"
                      ></path>
                    </svg>
                    <span className="sr-only">Close modal</span>
                  </button>
                  <svg
                    className="w-11 h-11 mb-3.5 mx-auto"
                    aria-hidden="true"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      fillRule="evenodd"
                      d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    ></path>
                  </svg>
                  <p
                    className={`mb-4 ${
                      isDark ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    Bạn có chắc chắn muốn xóa?
                  </p>
                  <div className="flex justify-center items-center space-x-4">
                    <button
                      onClick={handleCancelDelete}
                      data-modal-toggle="deleteModal"
                      type="button"
                      className="py-2 px-3 text-sm font-medium bg-white rounded-lg border border-gray-200 hover:bg-gray-100 focus:ring-4 focus:outline-none focus:ring-primary-300 hover:text-gray-900 focus:z-10 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-500 dark:hover:text-white dark:hover:bg-gray-600 dark:focus:ring-gray-600"
                    >
                      Hủy
                    </button>
                    <button
                      onClick={(e) => handleConfirmDelete(e, date)}
                      type="submit"
                      className="py-2 px-3 text-sm font-medium text-center text-white bg-red-600 rounded-lg hover:bg-red-700 focus:ring-4 focus:outline-none focus:ring-red-300 dark:bg-red-500 dark:hover:bg-red-600 dark:focus:ring-red-900"
                    >
                      Xóa
                    </button>
                  </div>
                </div>
              </div>
            )}
            <div className="bg-white dark:bg-gray-800 rounded-lg w-full shadow-lg">
              <div className="font-bold p-5 flex justify-between items-center border-b border-gray-200 dark:border-gray-700">
                <div className="text-gray-900 dark:text-white text-lg">
                  LỊCH GÁC ĐÊM
                </div>
                <button
                  onClick={() => {
                    setShowFormAdd(true);
                    document.body.style.overflow = "hidden";
                  }}
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
                      d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                    />
                  </svg>
                  Thêm
                </button>
              </div>
              <div className="w-full pl-5 pb-5 pr-5">
                <form
                  className="flex items-end mb-4"
                  onSubmit={(e) => handleSubmit(e, date)}
                >
                  <div className="flex">
                    <div className="">
                      <label
                        htmlFor="date"
                        className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300"
                      >
                        Chọn ngày
                      </label>

                      <DatePicker
                        id="date"
                        selected={date}
                        onChange={(date) => setDate(date)}
                        dateFormat="dd/MM/yyyy"
                        className="bg-gray-50 border z-20 w-56 border-gray-300 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block pb-1 pt-1.5 pr-10 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                        placeholderText="Ngày/Tháng/Năm"
                        wrapperClassName="w-56"
                      />
                    </div>
                  </div>
                  <div className="ml-4">
                    <button
                      type="submit"
                      className="h-9 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg text-sm w-full sm:w-auto px-5 transition-colors duration-200"
                    >
                      Tìm kiếm
                    </button>
                  </div>
                </form>
                <div className="overflow-x-auto">
                  <table className="table-auto w-full divide-y divide-gray-200 dark:divide-gray-700 border border-gray-200 dark:border-gray-700 rounded-lg">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr className="border border-gray-200 dark:border-gray-600">
                        <th
                          scope="col"
                          className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider border-r border-gray-200 dark:border-gray-600 whitespace-nowrap"
                        >
                          NGÀY GÁC
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider border-r border-gray-200 dark:border-gray-600 whitespace-nowrap"
                        >
                          HỎI
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider border-r border-gray-200 dark:border-gray-600 whitespace-nowrap"
                        >
                          ĐÁP
                        </th>
                        <th
                          scope="col"
                          className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider whitespace-nowrap"
                        >
                          TÙY CHỌN
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {listGuard && listGuard.length > 0 ? (
                        listGuard.map((item, index) => (
                          <tr
                            key={index}
                            className="hover:cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
                          >
                            <td
                              onClick={() => handleRowClick(item.dayGuard)}
                              className="px-4 py-4 text-center border-r border-gray-200 dark:border-gray-600"
                            >
                              <div className="text-sm text-gray-900 dark:text-white whitespace-nowrap">
                                {dayjs(item?.dayGuard).format("DD/MM/YYYY")}
                              </div>
                            </td>
                            <td
                              onClick={() => handleRowClick(item.dayGuard)}
                              className="px-6 py-4 text-center border-r border-gray-200 dark:border-gray-600"
                            >
                              <div className="text-sm text-gray-900 dark:text-white">
                                {item?.guardPassword?.question}
                              </div>
                            </td>
                            <td
                              onClick={() => handleRowClick(item.dayGuard)}
                              className="px-6 py-4 text-center border-r border-gray-200 dark:border-gray-600"
                            >
                              <div className="text-sm text-gray-900 dark:text-white">
                                {item?.guardPassword?.answer}
                              </div>
                            </td>
                            <td className="px-4 py-4 text-center">
                              <div className="flex justify-center space-x-2">
                                <button
                                  data-modal-target="authentication-modal"
                                  data-modal-toggle="authentication-modal"
                                  type="button"
                                  onClick={() => handleShowFormUpdate(item.id)}
                                  className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                                >
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    strokeWidth="1.5"
                                    stroke="currentColor"
                                    className="w-6 h-6"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10"
                                    />
                                  </svg>
                                </button>
                                <button
                                  onClick={() => handleDelete(item?.dayGuard)}
                                  className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                                >
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    strokeWidth="1.5"
                                    stroke="currentColor"
                                    className="w-6 h-6"
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
                                Không tìm thấy lịch gác đêm nào
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
          {showFormAdd ? (
            <div className="fixed top-0 left-0 mt-8 w-full h-full bg-gray-900 bg-opacity-50 flex justify-center items-center">
              <div
                className={`rounded-lg shadow-lg w-full max-w-3xl relative ${
                  isDark ? "bg-gray-800" : "bg-white"
                }`}
              >
                <h2
                  className={`text-xl font-bold mb-4 pt-6 pl-6 ${
                    isDark ? "text-white" : "text-gray-900"
                  }`}
                >
                  Thêm lịch gác đêm
                </h2>
                <button
                  onClick={() => {
                    setShowFormAdd(false);
                    document.body.style.overflow = "unset";
                  }}
                  className="absolute top-0 right-0 m-4 p-1 rounded-md text-gray-400 cursor-pointer hover:bg-gray-200 hover:text-gray-700"
                >
                  <svg
                    className="h-6 w-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M6 18L18 6M6 6l12 12"
                    ></path>
                  </svg>
                </button>
                <form
                  onSubmit={(e) => handleAddFormData(e)}
                  className="grid grid-cols-3 gap-4 px-6 pb-3"
                >
                  {/* Column 1: Day Guard & Location 1 */}
                  <div className="col-span-1">
                    <div className="mb-2">
                      <label
                        className={`block text-sm font-bold mb-1 ${
                          isDark ? "text-gray-300" : "text-gray-700"
                        }`}
                        htmlFor="dayGuard"
                      >
                        Ngày gác
                      </label>
                      <DatePicker
                        id="dayGuard"
                        dateFormat="dd/MM/yyyy"
                        selected={addFormData.dayGuard}
                        onChange={(date) =>
                          setAddFormData({
                            ...addFormData,
                            dayGuard: date,
                          })
                        }
                        required
                        className={`shadow text-sm appearance-none border rounded w-full py-2.5 px-3 leading-tight focus:outline-none focus:shadow-outline ${
                          isDark
                            ? "bg-gray-700 border-gray-600 text-white"
                            : "bg-white border-gray-300 text-gray-900"
                        }`}
                        placeholderText="Ngày/Tháng/Năm"
                        wrapperClassName="w-full"
                      />
                    </div>
                    <div>
                      <label
                        className={`block text-sm font-bold mb-1 ${
                          isDark ? "text-gray-300" : "text-gray-700"
                        }`}
                        htmlFor="location1"
                      >
                        Vọng 1 (Cầu thang tòa S1)
                      </label>
                      <ul>
                        {addFormData.location1.map((item, index) => (
                          <li key={index}>
                            <input
                              className={`shadow text-sm mt-1 appearance-none border rounded w-full py-2.5 px-3 leading-tight focus:outline-none focus:shadow-outline ${
                                isDark
                                  ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                                  : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"
                              }`}
                              type="text"
                              placeholder="vd: Nguyễn Văn A"
                              value={item}
                              onChange={(e) => {
                                const updatedLocations = [
                                  ...addFormData.location1,
                                ];
                                updatedLocations[index] = e.target.value;
                                setAddFormData({
                                  ...addFormData,
                                  location1: updatedLocations,
                                });
                              }}
                              required
                            />
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Column 2: Question & Location 2 */}
                  <div className="col-span-1">
                    <div className="mb-2">
                      <label
                        className={`block text-sm font-bold mb-1 ${
                          isDark ? "text-gray-300" : "text-gray-700"
                        }`}
                        htmlFor="question"
                      >
                        Hỏi
                      </label>
                      <input
                        className={`shadow text-sm appearance-none border rounded w-full py-2.5 px-3 leading-tight focus:outline-none focus:shadow-outline ${
                          isDark
                            ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                            : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"
                        }`}
                        id="question"
                        type="text"
                        placeholder="vd: Hà Nội"
                        value={addFormData.guardPassword.question}
                        onChange={(e) =>
                          setAddFormData({
                            ...addFormData,
                            guardPassword: {
                              ...addFormData.guardPassword,
                              question: e.target.value,
                            },
                          })
                        }
                        required
                      />
                    </div>
                    <div>
                      <label
                        className={`block text-sm font-bold mb-1 ${
                          isDark ? "text-gray-300" : "text-gray-700"
                        }`}
                        htmlFor="location2"
                      >
                        Vọng 2 (Đối diện tòa S2)
                      </label>
                      <ul>
                        {addFormData.location2.map((item, index) => (
                          <li key={index}>
                            <input
                              className={`shadow text-sm mt-1 appearance-none border rounded w-full py-2.5 px-3 leading-tight focus:outline-none focus:shadow-outline ${
                                isDark
                                  ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                                  : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"
                              }`}
                              type="text"
                              placeholder="vd: Nguyễn Văn A"
                              value={item}
                              onChange={(e) => {
                                const updatedLocations = [
                                  ...addFormData.location2,
                                ];
                                updatedLocations[index] = e.target.value;
                                setAddFormData({
                                  ...addFormData,
                                  location2: updatedLocations,
                                });
                              }}
                              required
                            />
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Column 3: Answer & Location 3 */}
                  <div className="col-span-1">
                    <div className="mb-2">
                      <label
                        className={`block text-sm font-bold mb-1 ${
                          isDark ? "text-gray-300" : "text-gray-700"
                        }`}
                        htmlFor="answer"
                      >
                        Đáp
                      </label>
                      <input
                        className={`shadow text-sm appearance-none border rounded w-full py-2.5 px-3 leading-tight focus:outline-none focus:shadow-outline ${
                          isDark
                            ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                            : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"
                        }`}
                        id="answer"
                        type="text"
                        placeholder="vd: Hà Tĩnh"
                        value={addFormData.guardPassword.answer}
                        onChange={(e) =>
                          setAddFormData({
                            ...addFormData,
                            guardPassword: {
                              ...addFormData.guardPassword,
                              answer: e.target.value,
                            },
                          })
                        }
                        required
                      />
                    </div>
                    <div>
                      <label
                        className={`block text-sm font-bold mb-1 ${
                          isDark ? "text-gray-300" : "text-gray-700"
                        }`}
                        htmlFor="location3"
                      >
                        Vọng 3 (Đằng sau tòa S3)
                      </label>
                      <ul>
                        {addFormData.location3.map((item, index) => (
                          <li key={index}>
                            <input
                              className={`shadow text-sm mt-1 appearance-none border rounded w-full py-2.5 px-3 leading-tight focus:outline-none focus:shadow-outline ${
                                isDark
                                  ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                                  : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"
                              }`}
                              type="text"
                              placeholder="vd: Nguyễn Văn A"
                              value={item}
                              onChange={(e) => {
                                const updatedLocations = [
                                  ...addFormData.location3,
                                ];
                                updatedLocations[index] = e.target.value;
                                setAddFormData({
                                  ...addFormData,
                                  location3: updatedLocations,
                                });
                              }}
                              required
                            />
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  {/* Submit Button */}
                  <div className="col-span-3 flex justify-end">
                    <button
                      type="button"
                      className="px-4 py-2 bg-gray-200 text-gray-500 rounded-lg hover:bg-gray-300 hover:text-gray-900 mr-2"
                      onClick={() => {
                        setShowFormAdd(false);
                        document.body.style.overflow = "unset";
                      }}
                    >
                      Hủy
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm w-full sm:w-auto dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
                    >
                      Thêm
                    </button>
                  </div>
                </form>
              </div>
            </div>
          ) : (
            ""
          )}
        </div>
      </div>
    </>
  );
};

export default ListGuard;
