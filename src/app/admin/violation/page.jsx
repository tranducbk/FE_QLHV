"use client";

import axios from "axios";
import Link from "next/link";
import dayjs from "dayjs";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { format } from "date-fns";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { handleNotify } from "../../../components/notify";
import Loader from "@/components/loader";
import { useLoading } from "@/hooks";
import { useTheme } from "@/hooks/useTheme";

import { BASE_URL } from "@/configs";
const Violation = () => {
  const router = useRouter();
  const { isDark } = useTheme();
  const [violation, setViolation] = useState([]);
  const [fullName, setFullName] = useState("");
  const [unit, setUnit] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);
  const [studentId, setStudentId] = useState(null);
  const [violationId, setViolationId] = useState(null);
  const [showFormAdd, setShowFormAdd] = useState(false);
  const [showFormEdit, setShowFormEdit] = useState(false);
  const [editFormData, setEditFormData] = useState({});
  const [addFormData, setAddFormData] = useState({
    dateOfViolation: format(new Date(), "yyyy-MM-dd"),
  });
  const { loading, withLoading } = useLoading(true);

  const handleShowFormUpdate = async (violationId) => {
    const token = localStorage.getItem("token");

    if (token) {
      try {
        const res = await axios.get(
          `${BASE_URL}/commander/violation/${violationId}`,
          {
            headers: {
              token: `Bearer ${token}`,
            },
          }
        );

        setEditFormData({
          fullName: res.data.fullName || "",
          content: res.data.content || "",
          penalty: res.data.penalty || "",
          dateOfViolation: res.data.dateOfViolation
            ? new Date(res.data.dateOfViolation)
            : null,
        });

        setViolationId(violationId);
        setShowFormEdit(true);
      } catch (error) {
        console.log(error);
        handleNotify("danger", "Lỗi!", "Không thể tải thông tin vi phạm");
      }
    }
  };

  const handleUpdate = async (e, violationId) => {
    e.preventDefault();
    const token = localStorage.getItem("token");

    if (token) {
      try {
        await axios.put(
          `${BASE_URL}/commander/violation/${violationId}`,
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
          "Chỉnh sửa lỗi vi phạm thành công"
        );
        setShowFormEdit(false);
        fetchViolation();
      } catch (error) {
        handleNotify("danger", "Lỗi!", error);
        setShowFormEdit(false);
      }
    }
  };

  const handleAddFormData = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    try {
      const response = await axios.post(
        `${BASE_URL}/commander/violation`,
        addFormData,
        {
          headers: {
            token: `Bearer ${token}`,
          },
        }
      );
      handleNotify("success", "Thành công!", "Thêm lỗi vi phạm thành công");
      setViolation([...violation, response.data]);
      setShowFormAdd(false);
      fetchViolation();
    } catch (error) {
      setShowFormAdd(false);
      handleNotify("danger", "Lỗi!", error.response.data);
    }
  };

  const handleDelete = (studentId, id) => {
    setStudentId(studentId);
    setViolationId(id);
    setShowConfirm(true);
  };

  const handleConfirmDelete = (studentId, violationId) => {
    const token = localStorage.getItem("token");

    if (token) {
      axios
        .delete(`${BASE_URL}/commander/${studentId}/violation/${violationId}`, {
          headers: {
            token: `Bearer ${token}`,
          },
        })
        .then(() => {
          setViolation(
            violation.filter((violation) => violation.id !== violationId)
          );
          handleNotify("success", "Thành công!", "Xóa lỗi vi phạm thành công");
          fetchViolation();
        })
        .catch((error) => handleNotify("danger", "Lỗi!", error));
    }
    setShowConfirm(false);
  };

  const handleCancelDelete = () => {
    setShowConfirm(false);
  };

  const fetchViolation = async () => {
    const token = localStorage.getItem("token");

    if (token) {
      try {
        const res = await axios.get(`${BASE_URL}/commander/violations`, {
          headers: {
            token: `Bearer ${token}`,
          },
        });

        setViolation(res.data);
      } catch (error) {
        console.log(error);
      }
    }
  };

  useEffect(() => {
    const loadData = async () => {
      await withLoading(fetchViolation);
    };
    loadData();
  }, [withLoading]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    router.push(`/admin/violation?fullName=${fullName}&unit=${unit}`);
    const token = localStorage.getItem("token");

    if (token) {
      try {
        const res = await axios.get(
          `${BASE_URL}/commander/violations?fullName=${fullName}&unit=${unit}`,
          {
            headers: {
              token: `Bearer ${token}`,
            },
          }
        );

        if (res.status === 404) setViolation([]);

        setViolation(res.data);
      } catch (error) {
        handleNotify("danger", "Lỗi!", error);
      }
    }
  };

  if (loading) {
    return <Loader text="Đang tải dữ liệu vi phạm..." />;
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
                      Lỗi vi phạm
                    </div>
                  </div>
                </li>
              </ol>
            </nav>
          </div>
          {showFormEdit ? (
            <div className="fixed text-start inset-0 mt-16 flex items-center justify-center z-30">
              <div className="bg-slate-400 opacity-50 inset-0 fixed"></div>
              <div
                className={`relative rounded-lg shadow-lg w-6/12 ${
                  isDark ? "bg-gray-800" : "bg-white"
                }`}
              >
                <button
                  onClick={() => setShowFormEdit(false)}
                  className="absolute top-1 right-1 m-4 p-1 rounded-md text-gray-400 cursor-pointer hover:bg-gray-200 hover:text-gray-700"
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
                  onSubmit={(e) => handleUpdate(e, violationId)}
                  className="px-6 pt-6 pb-3 z-10"
                  id="infoForm"
                >
                  <h2
                    className={`text-xl font-semibold mb-4 ${
                      isDark ? "text-white" : "text-gray-900"
                    }`}
                  >
                    Chỉnh sửa vi phạm của học viên
                  </h2>

                  <div className="mb-4">
                    <label
                      htmlFor="content4"
                      className={`block text-sm font-medium ${
                        isDark ? "text-gray-300" : "text-gray-700"
                      }`}
                    >
                      Nội dung vi phạm
                    </label>
                    <input
                      type="text"
                      id="content4"
                      name="content4"
                      value={editFormData.content}
                      onChange={(e) =>
                        setEditFormData({
                          ...editFormData,
                          content: e.target.value,
                        })
                      }
                      placeholder="vd: Tác phong chậm"
                      className="bg-gray-50 border border-gray-300 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500 mt-1"
                    />
                  </div>

                  <div className="mb-4">
                    <label
                      htmlFor="penalty2"
                      className={`block text-sm font-medium ${
                        isDark ? "text-gray-300" : "text-gray-700"
                      }`}
                    >
                      Hình thức xử lý
                    </label>
                    <input
                      type="text"
                      id="penalty2"
                      name="penalty2"
                      value={editFormData.penalty}
                      onChange={(e) =>
                        setEditFormData({
                          ...editFormData,
                          penalty: e.target.value,
                        })
                      }
                      placeholder="vd: Phạt gác 3 ngày"
                      className="bg-gray-50 border border-gray-300 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500 mt-1"
                    />
                  </div>

                  <div className="mb-6">
                    <label
                      htmlFor="dateOfViolation2"
                      className={`block text-sm font-medium ${
                        isDark ? "text-gray-300" : "text-gray-700"
                      }`}
                    >
                      Ngày vi phạm
                    </label>
                    <DatePicker
                      id="dateOfViolation2"
                      dateFormat="dd/MM/yyyy"
                      selected={editFormData.dateOfViolation}
                      onChange={(date) =>
                        setEditFormData({
                          ...editFormData,
                          dateOfViolation: date,
                        })
                      }
                      className="bg-gray-50 border mt-1 w-full border-gray-300 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                      placeholderText="Năm-Tháng-Ngày"
                      wrapperClassName="w-full"
                    />
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="button"
                      className="px-4 py-2 bg-gray-200 text-gray-500 rounded-lg hover:bg-gray-300 hover:text-gray-900 mr-2"
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
          <div className="w-full pt-8 pb-5 pl-5 pr-6 mb-5">
            <div className="bg-white dark:bg-gray-800 rounded-lg w-full shadow-lg">
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
                        className="py-2 px-3 text-sm font-medium bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600 focus:ring-4 focus:outline-none focus:ring-primary-300 hover:text-gray-900 dark:hover:text-white focus:z-10"
                      >
                        Hủy
                      </button>
                      <button
                        onClick={() =>
                          handleConfirmDelete(studentId, violationId)
                        }
                        type="submit"
                        className="py-2 px-3 text-sm font-medium text-center text-white bg-red-600 rounded-lg hover:bg-red-700 focus:ring-4 focus:outline-none focus:ring-red-300 dark:bg-red-500 dark:hover:bg-red-600 dark:focus:ring-red-900"
                      >
                        Xóa
                      </button>
                    </div>
                  </div>
                </div>
              )}
              <div className="font-bold p-5 flex justify-between items-center border-b border-gray-200 dark:border-gray-700">
                <div className="text-gray-900 dark:text-white text-lg">
                  LỖI VI PHẠM
                </div>
                <button
                  onClick={() => setShowFormAdd(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 border border-blue-600 hover:border-blue-700 rounded-lg transition-colors duration-200 flex items-center"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth="1.5"
                    stroke="currentColor"
                    className="w-4 h-4 mr-2"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 4.5v15m7.5-7.5h-15"
                    />
                  </svg>
                  Thêm
                </button>
              </div>
              <div className="w-full p-5">
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
                        className="bg-gray-50 dark:bg-gray-700 border w-56 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block pb-1 pt-1.5 pr-10"
                        placeholder="vd: Nguyễn Văn X"
                      />
                    </div>
                    <div className="ml-4">
                      <label
                        htmlFor="unit"
                        className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300"
                      >
                        Chọn đơn vị
                      </label>
                      <select
                        id="unit"
                        value={unit}
                        onChange={(e) => setUnit(e.target.value)}
                        className="bg-gray-50 dark:bg-gray-700 border w-56 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block pb-1 pt-1.5 pr-10"
                      >
                        <option value="">Tất cả</option>
                        <option value="L1 - H5">L1 - H5</option>
                        <option value="L2 - H5">L2 - H5</option>
                        <option value="L3 - H5">L3 - H5</option>
                        <option value="L4 - H5">L4 - H5</option>
                        <option value="L5 - H5">L5 - H5</option>
                        <option value="L6 - H5">L6 - H5</option>
                      </select>
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
              </div>
              <div className="w-full p-5">
                <div className="overflow-x-auto">
                  <table className="table-auto w-full divide-y divide-gray-200 dark:divide-gray-700 border border-gray-200 dark:border-gray-700 rounded-lg">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th
                          scope="col"
                          className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider border-r border-gray-200 dark:border-gray-600 whitespace-nowrap"
                        >
                          STT
                        </th>
                        <th
                          scope="col"
                          className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider border-r border-gray-200 dark:border-gray-600 whitespace-nowrap"
                        >
                          HỌ VÀ TÊN
                        </th>
                        <th
                          scope="col"
                          className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider border-r border-gray-200 dark:border-gray-600 whitespace-nowrap"
                        >
                          ĐƠN VỊ
                        </th>
                        <th
                          scope="col"
                          className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider border-r border-gray-200 dark:border-gray-600 whitespace-nowrap"
                        >
                          NỘI DUNG VI PHẠM
                        </th>
                        <th
                          scope="col"
                          className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider border-r border-gray-200 dark:border-gray-600 whitespace-nowrap"
                        >
                          HÌNH THỨC XỬ LÝ
                        </th>
                        <th
                          scope="col"
                          className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider border-r border-gray-200 dark:border-gray-600 whitespace-nowrap"
                        >
                          NGÀY VI PHẠM
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
                      {violation && violation.length > 0 ? (
                        violation.map((item, index) => (
                          <tr
                            key={item.id}
                            className="hover:bg-gray-50 dark:hover:bg-gray-700"
                          >
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white border-r border-gray-200 dark:border-gray-600 text-center">
                              {index + 1}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white border-r border-gray-200 dark:border-gray-600 text-center">
                              {item.fullName}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white border-r border-gray-200 dark:border-gray-600 text-center">
                              {item.unit}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white border-r border-gray-200 dark:border-gray-600 text-center">
                              {item.content}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white border-r border-gray-200 dark:border-gray-600 text-center">
                              {item.penalty}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white border-r border-gray-200 dark:border-gray-600 text-center">
                              {dayjs(item.dateOfViolation).format("DD/MM/YYYY")}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-center">
                              <div className="flex justify-center space-x-2">
                                <button
                                  onClick={() => handleShowFormUpdate(item.id)}
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
                                  onClick={() =>
                                    handleDelete(item.studentId, item.id)
                                  }
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
                            colSpan="7"
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
                                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                                />
                              </svg>
                              <p className="text-lg font-medium">
                                Không có dữ liệu
                              </p>
                              <p className="text-sm">
                                Không tìm thấy lỗi vi phạm nào
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
            <div className="fixed text-start inset-0 mt-16 flex items-center justify-center z-30">
              <div className="bg-slate-400 opacity-50 inset-0 fixed"></div>
              <div
                className={`relative rounded-lg shadow-lg w-6/12 ${
                  isDark ? "bg-gray-800" : "bg-white"
                }`}
              >
                <button
                  onClick={() => setShowFormAdd(false)}
                  className="absolute top-1 right-1 m-4 p-1 rounded-md text-gray-400 cursor-pointer hover:bg-gray-200 hover:text-gray-700"
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
                  <h2
                    className={`text-xl font-semibold mb-4 ${
                      isDark ? "text-white" : "text-gray-900"
                    }`}
                  >
                    Thêm lỗi vi phạm của học viên
                  </h2>

                  <div className="mb-4">
                    <label
                      htmlFor="name"
                      className={`block text-sm font-medium ${
                        isDark ? "text-gray-300" : "text-gray-700"
                      }`}
                    >
                      Học viên
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={addFormData.fullName}
                      onChange={(e) =>
                        setAddFormData({
                          ...addFormData,
                          fullName: e.target.value,
                        })
                      }
                      required
                      placeholder="vd: Nguyễn Văn A"
                      className="bg-gray-50 border border-gray-300 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500 mt-1"
                    />
                  </div>

                  <div className="mb-4">
                    <label
                      htmlFor="content"
                      className={`block text-sm font-medium ${
                        isDark ? "text-gray-300" : "text-gray-700"
                      }`}
                    >
                      Nội dung vi phạm
                    </label>
                    <input
                      type="text"
                      id="content"
                      name="content"
                      value={addFormData.content}
                      onChange={(e) =>
                        setAddFormData({
                          ...addFormData,
                          content: e.target.value,
                        })
                      }
                      required
                      placeholder="vd: Tác phong chậm"
                      className="bg-gray-50 border border-gray-300 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500 mt-1"
                    />
                  </div>

                  <div className="mb-4">
                    <label
                      htmlFor="penalty"
                      className={`block text-sm font-medium ${
                        isDark ? "text-gray-300" : "text-gray-700"
                      }`}
                    >
                      Hình thức xử lý
                    </label>
                    <input
                      type="text"
                      id="penalty"
                      name="penalty"
                      value={addFormData.penalty}
                      onChange={(e) =>
                        setAddFormData({
                          ...addFormData,
                          penalty: e.target.value,
                        })
                      }
                      required
                      placeholder="vd: Phạt gác 3 ngày"
                      className="bg-gray-50 border border-gray-300 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500 mt-1"
                    />
                  </div>

                  <div className="mb-6">
                    <label
                      htmlFor="dateOfViolation"
                      className={`block text-sm font-medium ${
                        isDark ? "text-gray-300" : "text-gray-700"
                      }`}
                    >
                      Ngày vi phạm
                    </label>
                    <DatePicker
                      id="dateOfViolation"
                      dateFormat="dd/MM/yyyy"
                      selected={addFormData.dateOfViolation}
                      onChange={(date) =>
                        setAddFormData({
                          ...addFormData,
                          dateOfViolation: date,
                        })
                      }
                      required
                      className="bg-gray-50 border mt-1 w-full border-gray-300 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                      placeholderText="Năm-Tháng-Ngày"
                      wrapperClassName="w-full"
                    />
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="button"
                      className="px-4 py-2 bg-gray-200 text-gray-500 rounded-lg hover:bg-gray-300 hover:text-gray-900 mr-2"
                      onClick={() => setShowFormAdd(false)}
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

export default Violation;
