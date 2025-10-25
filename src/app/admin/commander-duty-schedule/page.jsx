"use client";

import Link from "next/link";
import axios from "axios";
import { useRouter } from "next/navigation";
import dayjs from "dayjs";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { format } from "date-fns";
import { useEffect, useState } from "react";
import { handleNotify } from "../../../components/notify";
import Loader from "@/components/loader";
import { useLoading } from "@/hooks";
import { useModalScroll } from "@/hooks/useModalScroll";

import { BASE_URL } from "@/configs";
const CommanderDutySchedule = () => {
  const router = useRouter();
  const [commanderDutySchedule, setCommanderDutySchedule] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [fullName, setFullName] = useState("");
  const [date, setDate] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);
  const [id, setId] = useState(null);
  const [deleteItem, setDeleteItem] = useState(null);
  const [showFormAdd, setShowFormAdd] = useState(false);
  const [showFormEdit, setShowFormEdit] = useState(false);
  const [editFormData, setEditFormData] = useState({});
  const [addFormData, setAddFormData] = useState({
    workDay: format(new Date(), "yyyy-MM-dd"),
  });
  const [commanders, setCommanders] = useState([]);
  const { loading, withLoading } = useLoading(true);

  useModalScroll(showFormAdd || showFormEdit || showConfirm);

  const handleShowFormEdit = async (id) => {
    setId(id);
    const token = localStorage.getItem("token");

    if (token) {
      try {
        const res = await axios.get(
          `${BASE_URL}/user/commanderDutySchedule/${id}`,
          {
            headers: {
              token: `Bearer ${token}`,
            },
          }
        );

        setEditFormData({
          fullName: res.data.fullName || "",
          phoneNumber: res.data.phoneNumber || "",
          rank: res.data.rank || "",
          position: res.data.position || "",
          workDay: res.data.workDay ? new Date(res.data.workDay) : new Date(),
        });

        setShowFormEdit(true);
      } catch (error) {
        handleNotify("danger", "Lỗi!", "Không thể tải thông tin lịch trực");
      }
    }
  };

  const handleUpdate = async (e, id) => {
    e.preventDefault();

    if (
      !editFormData.fullName ||
      !editFormData.phoneNumber ||
      !editFormData.rank ||
      !editFormData.position ||
      !editFormData.workDay
    ) {
      handleNotify("warning", "Cảnh báo!", "Vui lòng điền đầy đủ thông tin");
      return;
    }

    const token = localStorage.getItem("token");

    if (token) {
      try {
        await axios.put(
          `${BASE_URL}/user/commanderDutySchedule/${id}`,
          editFormData,
          {
            headers: {
              token: `Bearer ${token}`,
            },
          }
        );
        handleNotify(
          "success",
          "Thành công!",
          "Chỉnh sửa lịch trực thành công"
        );
        setShowFormEdit(false);
        fetchSchedule();
      } catch (error) {
        const errorMessage =
          error.response?.data?.message || error.message || "Có lỗi xảy ra";
        handleNotify("danger", "Lỗi!", errorMessage);
        // Không tắt modal khi có lỗi để người dùng có thể sửa lại
      }
    }
  };

  const handleAddFormData = async (e) => {
    e.preventDefault();

    if (
      !addFormData.fullName ||
      !addFormData.phoneNumber ||
      !addFormData.rank ||
      !addFormData.position ||
      !addFormData.workDay
    ) {
      handleNotify("warning", "Cảnh báo!", "Vui lòng điền đầy đủ thông tin");
      return;
    }

    const token = localStorage.getItem("token");
    try {
      await axios.post(`${BASE_URL}/user/commanderDutySchedule`, addFormData, {
        headers: {
          token: `Bearer ${token}`,
        },
      });
      handleNotify("success", "Thành công!", "Thêm lịch trực thành công");
      setShowFormAdd(false);
      setAddFormData({
        workDay: format(new Date(), "yyyy-MM-dd"),
      });
      fetchSchedule();
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || error.message || "Có lỗi xảy ra";
      handleNotify("danger", "Lỗi!", errorMessage);
    }
  };

  const handleDelete = (id) => {
    const item = commanderDutySchedule.schedules.find(
      (schedule) => schedule.id === id
    );
    setId(id);
    setDeleteItem(item);
    setShowConfirm(true);
  };

  const handleConfirmDelete = (e, id) => {
    e.preventDefault();
    const token = localStorage.getItem("token");

    if (token) {
      axios
        .delete(`${BASE_URL}/user/commanderDutySchedule/${id}`, {
          headers: {
            token: `Bearer ${token}`,
          },
        })
        .then(() => {
          setCommanderDutySchedule(
            commanderDutySchedule.schedules.filter(
              (commanderDutySchedule) => commanderDutySchedule.id !== id
            )
          );
          handleNotify("success", "Thành công!", "Xóa lịch trực thành công");
          fetchSchedule();
        })
        .catch((error) => handleNotify("danger", "Lỗi!", error));
    }
    setShowConfirm(false);
    setDeleteItem(null);
  };

  const handleCancelDelete = () => {
    setShowConfirm(false);
    setDeleteItem(null);
  };

  useEffect(() => {
    const loadData = async () => {
      await withLoading(async () => {
        await fetchSchedule();
        await fetchCommanders();
      });
    };
    loadData();
  }, [currentPage, withLoading]);

  const fetchSchedule = async () => {
    const token = localStorage.getItem("token");

    if (token) {
      try {
        const res = await axios.get(
          `${BASE_URL}/user/commanderDutySchedules?page=${currentPage}&fullName=${
            fullName ? fullName : ""
          }&date=${date ? date : ""}`,
          {
            headers: {
              token: `Bearer ${token}`,
            },
          }
        );

        if (res.status === 404) setCommanderDutySchedule([]);
        setCommanderDutySchedule(res.data);
      } catch (error) {
      }
    }
  };

  const fetchCommanders = async () => {
    const token = localStorage.getItem("token");

    if (token) {
      try {
        const res = await axios.get(`${BASE_URL}/commander`, {
          headers: {
            token: `Bearer ${token}`,
          },
        });
        setCommanders(res.data);
      } catch (error) {
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    router.push(
      `/admin/commander-duty-schedule?page=${currentPage}&fullName=${
        fullName ? fullName : ""
      }&date=${date ? date : ""}`
    );
    const token = localStorage.getItem("token");

    if (token) {
      try {
        const res = await axios.get(
          `${BASE_URL}/user/commanderDutySchedules?page=${currentPage}&fullName=${
            fullName ? fullName : ""
          }&date=${date ? date : ""}`,
          {
            headers: {
              token: `Bearer ${token}`,
            },
          }
        );

        if (res.status === 404) setCommanderDutySchedule([]);

        setCommanderDutySchedule(res.data);
      } catch (error) {
      }
    }
  };

  const handleCommanderSelect = (commanderId, formType) => {
    const commander = commanders.find((cmd) => cmd.id === commanderId);
    if (commander) {
      if (formType === "add") {
        setAddFormData({
          ...addFormData,
          fullName: commander.fullName,
          phoneNumber: commander.phoneNumber || "",
          rank: commander.rank || "",
          position: commander.positionGovernment || "",
        });
      } else {
        setEditFormData({
          ...editFormData,
          fullName: commander.fullName,
          phoneNumber: commander.phoneNumber || "",
          rank: commander.rank || "",
          position: commander.positionGovernment || "",
        });
      }
    }
  };

  if (loading) {
    return <Loader text="Đang tải lịch trực chỉ huy..." />;
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
                      Lịch trực
                    </div>
                  </div>
                </li>
              </ol>
            </nav>
          </div>
          <div className="w-full pt-8 pb-5 pl-5 pr-6 mb-5">
            <div className="bg-white dark:bg-gray-800 rounded-lg w-full shadow-lg">
              {showConfirm && (
                <div className="fixed top-0 left-0 z-20 w-full h-full bg-black bg-opacity-50 flex justify-center items-center">
                  <div className="relative p-4 text-center bg-white dark:bg-gray-800 rounded-lg shadow sm:p-5">
                    <button
                      onClick={handleCancelDelete}
                      type="button"
                      className="absolute top-2.5 right-2.5 bg-transparent hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg text-sm p-1.5 ml-auto inline-flex items-center dark:hover:text-white"
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
                      className="w-11 h-11 mb-3.5 mx-auto text-red-600 dark:text-red-400"
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
                    <p className="mb-4 text-gray-700 dark:text-gray-300">
                      Bạn có chắc chắn muốn xóa lịch trực của{" "}
                      <span className="font-semibold text-blue-600 dark:text-blue-400">
                        {deleteItem?.fullName}
                      </span>{" "}
                      ngày{" "}
                      <span className="font-semibold text-red-600 dark:text-red-400">
                        {deleteItem?.workDay
                          ? dayjs(deleteItem.workDay).format("DD/MM/YYYY")
                          : ""}
                      </span>
                      ?
                    </p>
                    <div className="flex justify-center items-center space-x-4">
                      <button
                        onClick={handleCancelDelete}
                        data-modal-toggle="deleteModal"
                        type="button"
                        className="py-2 px-3 text-sm font-medium bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600 focus:ring-4 focus:outline-none focus:ring-primary-300 hover:text-gray-900 dark:hover:text-white focus:z-10"
                      >
                        Hủy
                      </button>
                      <button
                        onClick={(e) => handleConfirmDelete(e, id)}
                        type="submit"
                        className="py-2 px-3 text-sm font-medium text-center text-white bg-red-600 rounded-lg hover:bg-red-700 focus:ring-4 focus:outline-none focus:ring-red-300 dark:bg-red-500 dark:hover:bg-red-600 dark:focus:ring-red-900"
                      >
                        Xóa
                      </button>
                    </div>
                  </div>
                </div>
              )}
              <div className="font-bold p-4 flex justify-between items-center border-b border-gray-200 dark:border-gray-700">
                <div className="text-gray-900 dark:text-white">
                  <h1 className="text-2xl font-bold">LỊCH TRỰC CHỈ HUY</h1>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Quản lý và xem lịch trực chỉ huy
                  </p>
                </div>
                <button
                  onClick={() => setShowFormAdd(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-1 px-3 border border-blue-600 hover:border-blue-700 rounded-lg transition-colors duration-200 flex items-center gap-1.5 text-xs"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth="1.5"
                    stroke="currentColor"
                    className="w-3.5 h-3.5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 4.5v15m7.5-7.5h-15"
                    />
                  </svg>
                  Thêm lịch trực
                </button>
              </div>
              <div className="w-full pt-2 pl-5 pb-5 pr-5">
                <div className="w-full">
                  <form
                    className="flex items-end"
                    onSubmit={(e) => handleSubmit(e)}
                  >
                    <div className="flex">
                      <div>
                        <label
                          htmlFor="fullName"
                          className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300"
                        >
                          Nhập tên
                        </label>
                        <input
                          type="text"
                          id="fullName"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          className="bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block pb-1 pt-1.5 pr-10 w-56"
                          placeholder="vd: Nguyễn Văn X"
                        />
                      </div>
                      <div className="ml-4">
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
                          className="bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block pb-1 pt-1.5 pr-10 w-56"
                          placeholderText="Ngày/Tháng/Năm"
                          wrapperClassName="w-56"
                        />
                      </div>
                    </div>
                    <div className="ml-4">
                      <button
                        type="submit"
                        className="h-9 bg-blue-600 hover:bg-blue-700 text-white focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 transition-colors duration-200"
                      >
                        Tìm kiếm
                      </button>
                    </div>
                  </form>
                  <div className="overflow-x-auto mt-4">
                    <table className="table-auto w-full divide-y divide-gray-200 dark:divide-gray-700 border border-gray-200 dark:border-gray-700 rounded-lg">
                      <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                          <th
                            scope="col"
                            className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider border-r border-gray-200 dark:border-gray-600"
                          >
                            Ngày trực
                          </th>
                          <th
                            scope="col"
                            className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider border-r border-gray-200 dark:border-gray-600"
                          >
                            Họ và tên
                          </th>
                          <th
                            scope="col"
                            className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider border-r border-gray-200 dark:border-gray-600"
                          >
                            Cấp bậc
                          </th>
                          <th
                            scope="col"
                            className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider border-r border-gray-200 dark:border-gray-600"
                          >
                            Chức vụ
                          </th>
                          <th
                            scope="col"
                            className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider border-r border-gray-200 dark:border-gray-600"
                          >
                            Số điện thoại
                          </th>
                          <th
                            scope="col"
                            className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                          >
                            Tùy chọn
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {commanderDutySchedule?.schedules &&
                        commanderDutySchedule.schedules.length > 0 ? (
                          commanderDutySchedule.schedules.map((item) => (
                            <tr
                              key={item.id}
                              className="hover:bg-gray-50 dark:hover:bg-gray-700"
                            >
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white border-r border-gray-200 dark:border-gray-600 text-center">
                                {dayjs(item.workDay).format("DD/MM/YYYY")}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white border-r border-gray-200 dark:border-gray-600 text-center">
                                {item.fullName}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white border-r border-gray-200 dark:border-gray-600 text-center">
                                {item.rank}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white border-r border-gray-200 dark:border-gray-600 text-center">
                                {item.position}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white border-r border-gray-200 dark:border-gray-600 text-center">
                                {item.phoneNumber}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-center">
                                <div className="flex justify-center space-x-2">
                                  <button
                                    onClick={() => handleShowFormEdit(item.id)}
                                    className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
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
                                    onClick={() => handleDelete(item.id)}
                                    className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
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
                                </div>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td
                              colSpan="6"
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
                                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                                  />
                                </svg>
                                <p className="text-lg font-medium">
                                  Không có dữ liệu
                                </p>
                                <p className="text-sm">
                                  Không tìm thấy lịch trực nào
                                </p>
                              </div>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
                <div className="flex justify-center mr-5 mt-5">
                  <nav aria-label="Page navigation example">
                    <ul className="list-style-none flex">
                      <li>
                        <Link
                          className={`relative mr-1 block rounded bg-transparent px-3 py-1.5 text-sm font-bold transition-all duration-300 ${
                            currentPage <= 1
                              ? "opacity-50 cursor-not-allowed text-gray-400 dark:text-gray-600"
                              : "hover:bg-blue-100 dark:hover:bg-blue-900 text-gray-700 dark:text-gray-300"
                          }`}
                          href={
                            currentPage <= 1
                              ? `/admin/commander-duty-schedule?page=1&fullName=${
                                  fullName ? fullName : ""
                                }&date=${date ? date : ""}`
                              : `/admin/commander-duty-schedule?page=${
                                  currentPage - 1
                                }&fullName=${fullName ? fullName : ""}&date=${
                                  date ? date : ""
                                }`
                          }
                          onClick={() => {
                            if (currentPage > 1)
                              setCurrentPage(currentPage - 1);
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
                        {
                          length: commanderDutySchedule?.totalPages,
                        },
                        (_, index) => index + 1
                      ).map((pageNumber) => (
                        <li key={pageNumber}>
                          <Link
                            className={`relative mr-1 block rounded font-bold px-3 py-1.5 text-sm transition-all duration-300 ${
                              currentPage === pageNumber
                                ? "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300"
                                : "hover:bg-blue-100 dark:hover:bg-blue-900 text-gray-700 dark:text-gray-300"
                            }`}
                            href={`/admin/commander-duty-schedule?page=${pageNumber}&fullName=${
                              fullName ? fullName : ""
                            }&date=${date ? date : ""}`}
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
                          className={`relative block rounded bg-transparent px-3 py-1.5 font-bold text-sm transition-all duration-300 ${
                            currentPage >= commanderDutySchedule?.totalPages
                              ? "opacity-50 cursor-not-allowed text-gray-400 dark:text-gray-600"
                              : "hover:bg-blue-100 dark:hover:bg-blue-900 text-gray-700 dark:text-gray-300"
                          }`}
                          href={
                            currentPage >= commanderDutySchedule?.totalPages
                              ? `/admin/commander-duty-schedule?page=${
                                  commanderDutySchedule?.totalPages
                                }&fullName=${fullName ? fullName : ""}&date=${
                                  date ? date : ""
                                }`
                              : `/admin/commander-duty-schedule?page=${
                                  currentPage + 1
                                }&fullName=${fullName ? fullName : ""}&date=${
                                  date ? date : ""
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
              {showFormEdit ? (
                <div className="fixed inset-0 mt-16 flex items-center justify-center z-30">
                  <div className="bg-black bg-opacity-50 inset-0 fixed"></div>
                  <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-lg w-6/12 max-h-[80vh] overflow-y-auto">
                    <button
                      onClick={() => setShowFormEdit(false)}
                      className="absolute top-1 right-1 m-4 p-1 rounded-md text-gray-400 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600 hover:text-gray-700 dark:hover:text-gray-300"
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
                      onSubmit={(e) => handleUpdate(e, id)}
                      className="px-6 pt-6 pb-3 z-10"
                      id="infoForm"
                    >
                      <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
                        Chỉnh sửa lịch trực
                      </h2>

                      <div className="mb-4">
                        <label
                          htmlFor="commanderSelect1"
                          className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                        >
                          Chọn chỉ huy
                        </label>
                        <select
                          id="commanderSelect1"
                          name="commanderSelect1"
                          value={
                            commanders.find(
                              (cmd) => cmd.fullName === editFormData.fullName
                            )?.id || ""
                          }
                          onChange={(e) =>
                            handleCommanderSelect(e.target.value, "edit")
                          }
                          className="bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 mt-1"
                        >
                          <option value="">Chọn chỉ huy</option>
                          {commanders.map((commander) => (
                            <option
                              key={commander.id}
                              value={commander.id}
                              className="bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            >
                              {commander.fullName}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="mb-4">
                        <label
                          htmlFor="phoneNumber1"
                          className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                        >
                          Số điện thoại
                        </label>
                        <input
                          type="tel"
                          id="phoneNumber1"
                          name="phoneNumber1"
                          value={editFormData.phoneNumber || ""}
                          onChange={(e) =>
                            setEditFormData({
                              ...editFormData,
                              phoneNumber: e.target.value,
                            })
                          }
                          placeholder="Nhập số điện thoại..."
                          readOnly={!!editFormData.phoneNumber}
                          className={`border text-gray-900 dark:text-white text-sm rounded-lg block w-full p-2.5 mt-1 ${
                            editFormData.phoneNumber
                              ? "bg-gray-100 dark:bg-gray-600 border-gray-300 dark:border-gray-500 cursor-not-allowed"
                              : "bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 focus:ring-blue-500 focus:border-blue-500"
                          }`}
                        />
                      </div>

                      <div className="mb-4">
                        <label
                          htmlFor="rank1"
                          className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                        >
                          Cấp bậc
                        </label>
                        <select
                          id="rank1"
                          name="rank1"
                          value={editFormData.rank || ""}
                          onChange={(e) =>
                            setEditFormData({
                              ...editFormData,
                              rank: e.target.value,
                            })
                          }
                          disabled={!!editFormData.rank}
                          className={`border text-gray-900 dark:text-white text-sm rounded-lg block w-full p-2.5 mt-1 ${
                            editFormData.rank
                              ? "bg-gray-100 dark:bg-gray-600 border-gray-300 dark:border-gray-500 cursor-not-allowed"
                              : "bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 focus:ring-blue-500 focus:border-blue-500"
                          }`}
                        >
                          <option value="">Chọn cấp bậc</option>
                          <option value="Thượng úy">Thượng úy</option>
                          <option value="Đại úy">Đại úy</option>
                          <option value="Thiếu tá">Thiếu tá</option>
                          <option value="Trung tá">Trung tá</option>
                          <option value="Thượng tá">Thượng tá</option>
                          <option value="Đại tá">Đại tá</option>
                        </select>
                      </div>

                      <div className="mb-4">
                        <label
                          htmlFor="position1"
                          className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                        >
                          Chức vụ
                        </label>
                        <select
                          id="position1"
                          name="position1"
                          value={editFormData.position || ""}
                          onChange={(e) =>
                            setEditFormData({
                              ...editFormData,
                              position: e.target.value,
                            })
                          }
                          disabled={!!editFormData.position}
                          className={`border text-gray-900 dark:text-white text-sm rounded-lg block w-full p-2.5 mt-1 ${
                            editFormData.position
                              ? "bg-gray-100 dark:bg-gray-600 border-gray-300 dark:border-gray-500 cursor-not-allowed"
                              : "bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 focus:ring-blue-500 focus:border-blue-500"
                          }`}
                        >
                          <option value="">Chọn chức vụ</option>
                          <option value="Hệ trưởng">Hệ trưởng</option>
                          <option value="Hệ phó">Hệ phó</option>
                          <option value="Chính trị viên">Chính trị viên</option>
                        </select>
                      </div>

                      <div className="mb-6">
                        <label
                          htmlFor="workDay1"
                          className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                        >
                          Ngày trực chỉ huy
                        </label>
                        <DatePicker
                          id="workDay1"
                          dateFormat="dd/MM/yyyy"
                          selected={editFormData.workDay}
                          onChange={(date) =>
                            setEditFormData({
                              ...editFormData,
                              workDay: date,
                            })
                          }
                          className="bg-gray-50 dark:bg-gray-700 border mt-1 w-full border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5"
                          placeholderText="Ngày/Tháng/Năm"
                          wrapperClassName="w-full"
                        />
                      </div>

                      <div className="flex justify-end">
                        <button
                          type="button"
                          className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-500 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 hover:text-gray-900 dark:hover:text-gray-100 mr-2"
                          onClick={() => setShowFormEdit(false)}
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
              ) : (
                ""
              )}
            </div>
          </div>
          {showFormAdd ? (
            <div className="fixed inset-0 mt-16 flex items-center justify-center z-30">
              <div className="bg-black bg-opacity-50 inset-0 fixed"></div>
              <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-lg w-6/12 max-h-[80vh] overflow-y-auto">
                <button
                  onClick={() => setShowFormAdd(false)}
                  className="absolute top-1 right-1 m-4 p-1 rounded-md text-gray-400 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600 hover:text-gray-700 dark:hover:text-gray-300"
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
                  onSubmit={handleAddFormData}
                  className="px-6 pt-6 pb-3 z-10"
                  id="infoForm"
                >
                  <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
                    Nhập lịch trực
                  </h2>

                  <div className="mb-4">
                    <label
                      htmlFor="commanderSelect"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                    >
                      Chọn chỉ huy
                    </label>
                    <select
                      id="commanderSelect"
                      name="commanderSelect"
                      value={
                        commanders.find(
                          (cmd) => cmd.fullName === addFormData.fullName
                        )?.id || ""
                      }
                      onChange={(e) =>
                        handleCommanderSelect(e.target.value, "add")
                      }
                      required
                      className="bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 mt-1"
                    >
                      <option value="">Chọn chỉ huy</option>
                      {commanders.map((commander) => (
                        <option
                          key={commander.id}
                          value={commander.id}
                          className="bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        >
                          {commander.fullName}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="mb-4">
                    <label
                      htmlFor="phoneNumber"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                    >
                      Số điện thoại
                    </label>
                    <input
                      type="tel"
                      id="phoneNumber"
                      name="phoneNumber"
                      value={addFormData.phoneNumber || ""}
                      onChange={(e) =>
                        setAddFormData({
                          ...addFormData,
                          phoneNumber: e.target.value,
                        })
                      }
                      required
                      placeholder="Nhập số điện thoại..."
                      readOnly={!!addFormData.phoneNumber}
                      className={`border text-gray-900 dark:text-white text-sm rounded-lg block w-full p-2.5 mt-1 ${
                        addFormData.phoneNumber
                          ? "bg-gray-100 dark:bg-gray-600 border-gray-300 dark:border-gray-500 cursor-not-allowed"
                          : "bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 focus:ring-blue-500 focus:border-blue-500"
                      }`}
                    />
                  </div>

                  <div className="mb-4">
                    <label
                      htmlFor="rank"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                    >
                      Cấp bậc
                    </label>
                    <select
                      id="rank"
                      name="rank"
                      value={addFormData.rank || ""}
                      onChange={(e) =>
                        setAddFormData({
                          ...addFormData,
                          rank: e.target.value,
                        })
                      }
                      required
                      disabled={!!addFormData.rank}
                      className={`border text-gray-900 dark:text-white text-sm rounded-lg block w-full p-2.5 mt-1 ${
                        addFormData.rank
                          ? "bg-gray-100 dark:bg-gray-600 border-gray-300 dark:border-gray-500 cursor-not-allowed"
                          : "bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 focus:ring-blue-500 focus:border-blue-500"
                      }`}
                    >
                      <option value="">Chọn cấp bậc</option>
                      <option value="Thượng úy">Thượng úy</option>
                      <option value="Đại úy">Đại úy</option>
                      <option value="Thiếu tá">Thiếu tá</option>
                      <option value="Trung tá">Trung tá</option>
                      <option value="Thượng tá">Thượng tá</option>
                      <option value="Đại tá">Đại tá</option>
                    </select>
                  </div>

                  <div className="mb-4">
                    <label
                      htmlFor="position"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                    >
                      Chức vụ
                    </label>
                    <select
                      id="position"
                      name="position"
                      value={addFormData.position || ""}
                      onChange={(e) =>
                        setAddFormData({
                          ...addFormData,
                          position: e.target.value,
                        })
                      }
                      required
                      disabled={!!addFormData.position}
                      className={`border text-gray-900 dark:text-white text-sm rounded-lg block w-full p-2.5 mt-1 ${
                        addFormData.position
                          ? "bg-gray-100 dark:bg-gray-600 border-gray-300 dark:border-gray-500 cursor-not-allowed"
                          : "bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 focus:ring-blue-500 focus:border-blue-500"
                      }`}
                    >
                      <option value="">Chọn chức vụ</option>
                      <option value="Hệ trưởng">Hệ trưởng</option>
                      <option value="Hệ phó">Hệ phó</option>
                      <option value="Chính trị viên">Chính trị viên</option>
                    </select>
                  </div>

                  <div className="mb-6">
                    <label
                      htmlFor="workDay"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                    >
                      Ngày trực chỉ huy
                    </label>
                    <DatePicker
                      id="workDay"
                      dateFormat="dd/MM/yyyy"
                      selected={addFormData.workDay}
                      onChange={(date) =>
                        setAddFormData({
                          ...addFormData,
                          workDay: date,
                        })
                      }
                      required
                      className="bg-gray-50 dark:bg-gray-700 border mt-1 w-full border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5"
                      placeholderText="Ngày/Tháng/Năm"
                      wrapperClassName="w-full"
                    />
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="button"
                      className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-500 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 hover:text-gray-900 dark:hover:text-gray-100 mr-2"
                      onClick={() => setShowFormAdd(false)}
                    >
                      Hủy
                    </button>
                    <button
                      type="submit"
                      onClick={handleAddFormData}
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

export default CommanderDutySchedule;
