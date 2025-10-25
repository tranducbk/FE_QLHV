"use client";

import axios from "axios";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { jwtDecode } from "jwt-decode";
import { useState, useEffect } from "react";
import SideBar from "@/components/sidebar";
import Loader from "@/components/loader";
import { useLoading } from "@/hooks";
import { handleNotify } from "../../../components/notify";
import { BASE_URL } from "@/configs";

const TuitionFee = () => {
  const [tuitionFee, setTuitionFee] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [selectedSemester, setSelectedSemester] = useState("");
  const [showConfirmFee, setShowConfirmFee] = useState(false);
  const [feeId, setFeeId] = useState(null);
  const [showFormAddTuitionFee, setShowFormAddTuitionFee] = useState(false);
  const [isOpenTuitionFee, setIsOpenTuitionFee] = useState(false);
  const [editedTuitionFee, setEditedTuitionFee] = useState({});
  const [addFormDataTuitionFee, setAddFormDataTuitionFee] = useState({});
  const { loading, withLoading } = useLoading(true);
  const [studentId, setStudentId] = useState(null);

  // Format hiển thị số tiền: 1.000.000 (chỉ hiển thị, state lưu chuỗi số thô)
  const formatNumberWithDots = (value) => {
    if (value == null || value === "") return "";
    const raw = String(value).replace(/\D/g, "");
    return raw.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  };

  // Màu trạng thái học phí (đồng bộ với trang admin)
  const getStatusClasses = (status) => {
    const s = String(status || "").toLowerCase();
    const isPaid = s.includes("đã thanh toán") || s.includes("đã đóng");
    const isUnpaid = s.includes("chưa thanh toán") || s.includes("chưa đóng");
    const isPending =
      s.includes("chờ") || s.includes("pending") || s.includes("đang xử lý");
    if (isPaid)
      return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
    if (isUnpaid)
      return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
    if (isPending)
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
    return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200";
  };

  const handleEditTuitionFee = async (id) => {
    setFeeId(id);
    const token = localStorage.getItem("token");
    try {
      const res = await axios.get(
        `${BASE_URL}/student/${studentId}/tuition-fee`,
        {
          headers: { token: `Bearer ${token}` },
        }
      );
      const item = (res.data || []).find((t) => t.id === id);
      if (item) {
        setEditedTuitionFee({
          semester: item.semester || selectedSemester,
          content: item.content || "",
          totalAmount: item.totalAmount || "",
          status: item.status || "Chưa thanh toán",
        });
      }
    } catch (e) {
      handleNotify("danger", "Lỗi!", e.message);
    }
    setIsOpenTuitionFee(true);
  };

  const handleUpdateTuitionFee = async (e, tuitionFeeId) => {
    e.preventDefault();
    const token = localStorage.getItem("token");

    if (token) {
      // Kiểm tra và đảm bảo có semester
      const semester = editedTuitionFee.semester || selectedSemester;
      if (!semester) {
        handleNotify("warning", "Cảnh báo", "Vui lòng chọn học kỳ");
        return;
      }

      // Tìm semester để lấy schoolYear
      const selectedSemesterData = semesters.find((s) => s.id === semester);
      const schoolYear =
        selectedSemesterData?.schoolYear || editedTuitionFee.schoolYear;

      try {
        const decodedToken = jwtDecode(token);
        const payload = {
          ...editedTuitionFee,
          semester: selectedSemesterData?.code || semester,
          schoolYear: schoolYear,
        };
        await axios.put(
          `${BASE_URL}/student/${studentId}/tuitionFee/${tuitionFeeId}`,
          payload,
          {
            headers: {
              token: `Bearer ${token}`,
            },
          }
        );
        handleNotify("success", "Thành công!", "Chỉnh sửa học phí thành công");
        setIsOpenTuitionFee(false);
        fetchTuitionFee();
      } catch (error) {
        const errorMessage =
          error.response?.data?.message ||
          error.response?.data ||
          "Có lỗi xảy ra khi cập nhật học phí";
        handleNotify("danger", "Lỗi!", errorMessage);
        setIsOpenTuitionFee(false);
      }
    }
  };

  const handleAddFormTuitionFee = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");

    // Kiểm tra và đảm bảo có semester
    const semester = addFormDataTuitionFee.semester || selectedSemester;
    if (!semester) {
      handleNotify("warning", "Cảnh báo", "Vui lòng chọn học kỳ");
      return;
    }

    // Tìm semester để lấy schoolYear
    const selectedSemesterData = semesters.find((s) => s.id === semester);
    const schoolYear =
      selectedSemesterData?.schoolYear || addFormDataTuitionFee.schoolYear;

    try {
      const payload = {
        ...addFormDataTuitionFee,
        semester: selectedSemesterData?.code || semester,
        schoolYear: schoolYear,
        status: "Chưa thanh toán",
      };
      const response = await axios.post(
        `${BASE_URL}/student/${studentId}/tuition-fee`,
        payload,
        {
          headers: {
            token: `Bearer ${token}`,
          },
        }
      );
      handleNotify("success", "Thành công!", "Thêm học phí thành công");
      setTuitionFee([...tuitionFee, response.data]);
      setShowFormAddTuitionFee(false);
      // Reset form
      setAddFormDataTuitionFee({});
    } catch (error) {
      setShowFormAddTuitionFee(false);
      const errorMessage =
        error.response?.data?.message ||
        error.response?.data ||
        "Có lỗi xảy ra khi thêm học phí";
      handleNotify("danger", "Lỗi!", errorMessage);
    }
  };

  const handleDeleteFee = (id) => {
    setFeeId(id);
    setShowConfirmFee(true);
  };

  const handleConfirmDeleteFee = (feeId) => {
    const token = localStorage.getItem("token");

    if (token) {
      axios
        .delete(`${BASE_URL}/student/${studentId}/tuitionFee/${feeId}`, {
          headers: {
            token: `Bearer ${token}`,
          },
        })
        .then(() => {
          setTuitionFee(tuitionFee.filter((fee) => fee.id !== feeId));
          handleNotify("success", "Thành công!", "Xóa học phí thành công");
          fetchTuitionFee();
        })
        .catch((error) => {
          const errorMessage =
            error.response?.data?.message ||
            error.response?.data ||
            "Có lỗi xảy ra khi xóa học phí";
          handleNotify("danger", "Lỗi!", errorMessage);
        });
    }

    setShowConfirmFee(false);
  };

  const fetchTuitionFee = async () => {
    const token = localStorage.getItem("token");

    if (token && studentId) {
      try {
        const res = await axios.get(
          `${BASE_URL}/student/${studentId}/tuition-fee`,
          {
            headers: {
              token: `Bearer ${token}`,
            },
          }
        );

        // Lọc dữ liệu theo học kỳ đã chọn
        let filteredData = res.data;

        if (selectedSemester) {
          const semester = semesters.find((s) => s.id === selectedSemester);
          if (semester) {
            // Lọc theo cả học kỳ và năm học
            filteredData = res.data.filter(
              (fee) =>
                fee.semester === semester.code &&
                fee.schoolYear === semester.schoolYear
            );
          }
        }

        setTuitionFee(filteredData);
      } catch (error) {
      }
    }
  };

  // Lấy studentId từ userId
  const fetchStudentId = async () => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const decodedToken = jwtDecode(token);
        // Use helper route to convert userId to studentId
        const res = await axios.get(
          `${BASE_URL}/student/by-user/${decodedToken.id}`,
          {
            headers: { token: `Bearer ${token}` },
          }
        );
        setStudentId(res.data.id);
        return res.data.id;
      } catch (error) {
        console.error("Error fetching student ID:", error);
        return null;
      }
    }
    return null;
  };

  useEffect(() => {
    const loadData = async () => {
      await withLoading(async () => {
        await fetchStudentId();
      });
    };
    loadData();
  }, [withLoading]);

  // Fetch tuition fee when studentId is available
  useEffect(() => {
    if (studentId) {
      fetchTuitionFee();
    }
  }, [studentId]);

  // fetch danh sách học kỳ cho user
  useEffect(() => {
    const fetchSemesters = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;
      try {
        const res = await axios.get(`${BASE_URL}/semester`, {
          headers: { token: `Bearer ${token}` },
        });
        const list = (res.data || []).sort((a, b) =>
          (b.createdAt || "").localeCompare(a.createdAt || "")
        );
        setSemesters(list);
        // Mặc định hiển thị "Tất cả học kỳ" khi mới vào
        // Không set selectedSemester để giữ giá trị rỗng
      } catch (e) {
      }
    };
    fetchSemesters();
  }, []);

  // refetch tuition-fee when semester changes (kể cả chọn "Tất cả")
  useEffect(() => {
    fetchTuitionFee();
  }, [selectedSemester]);

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
              <div className="flex justify-between items-center font-bold p-5 border-b border-gray-200 dark:border-gray-700">
                <div className="text-gray-900 dark:text-white">
                  <h1 className="text-2xl font-bold">HỌC PHÍ</h1>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Quản lý và xem học phí
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={selectedSemester}
                    onChange={(e) => setSelectedSemester(e.target.value)}
                    className="bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 p-2 transition-colors duration-200"
                  >
                    <option value="">Tất cả học kỳ</option>
                    {semesters
                      .sort((a, b) => {
                        const yearComparison = b.schoolYear.localeCompare(
                          a.schoolYear
                        );
                        if (yearComparison !== 0) return yearComparison;
                        const semesterA = a.code.includes(".")
                          ? parseInt(a.code.split(".")[1])
                          : 0;
                        const semesterB = b.code.includes(".")
                          ? parseInt(b.code.split(".")[1])
                          : 0;
                        return semesterB - semesterA;
                      })
                      .map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.code} - {s.schoolYear}
                        </option>
                      ))}
                  </select>
                  <button
                    onClick={() => setShowFormAddTuitionFee(true)}
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
                    Thêm học phí
                  </button>
                </div>
              </div>
              <div className="w-full pl-6 pb-6 pr-6 mt-4">
                <div className="overflow-x-auto">
                  <table className="min-w-full border border-gray-200 dark:border-gray-700 text-center text-sm font-light text-gray-900 dark:text-white rounded-lg">
                    <thead className="bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600">
                      <tr>
                        <th className="border-r border-gray-200 dark:border-gray-600 py-3 px-4 text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                          Học kỳ
                        </th>
                        <th className="border-r border-gray-200 dark:border-gray-600 py-3 px-4 text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                          Năm học
                        </th>
                        <th className="border-r border-gray-200 dark:border-gray-600 py-3 px-4 text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                          Loại tiền
                        </th>
                        <th className="border-r border-gray-200 dark:border-gray-600 py-3 px-4 text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                          Số tiền
                        </th>
                        <th className="border-r border-gray-200 dark:border-gray-600 py-3 px-4 text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                          Trạng thái
                        </th>
                        <th className="border-r border-gray-200 dark:border-gray-600 py-3 px-4 text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                          Tùy chọn
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800">
                      {tuitionFee.length === 0 ? (
                        <tr>
                          <td
                            colSpan="6"
                            className="py-8 text-gray-500 dark:text-gray-400"
                          >
                            Chưa có dữ liệu học phí
                          </td>
                        </tr>
                      ) : (
                        tuitionFee.map((item, index) => (
                          <tr
                            key={index}
                            className="border-b border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
                          >
                            <td className="whitespace-nowrap font-medium border-r border-gray-200 dark:border-gray-600 py-4 px-4">
                              {item.semester}
                            </td>
                            <td className="whitespace-nowrap font-medium border-r border-gray-200 dark:border-gray-600 py-4 px-4">
                              {item.schoolYear}
                            </td>
                            <td className="whitespace-nowrap font-medium border-r border-gray-200 dark:border-gray-600 py-4 px-4">
                              {item.content || "N/A"}
                            </td>
                            <td className="whitespace-nowrap font-medium border-r border-gray-200 dark:border-gray-600 py-4 px-4">
                              {formatNumberWithDots(item.totalAmount)} đ
                            </td>
                            <td className="whitespace-nowrap font-medium border-r border-gray-200 dark:border-gray-600 py-4 px-4">
                              <span
                                className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusClasses(
                                  item.status
                                )}`}
                              >
                                {item.status}
                              </span>
                            </td>
                            <td className="flex justify-center items-center space-x-2 py-4 px-4">
                              <button
                                type="button"
                                onClick={() => handleEditTuitionFee(item.id)}
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
                                onClick={() => handleDeleteFee(item.id)}
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
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Xác nhận xóa học phí */}
      {showConfirmFee && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
          <div className="bg-black bg-opacity-50 inset-0 fixed"></div>
          <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Xác nhận xóa
              </h2>
              <button
                onClick={() => setShowConfirmFee(false)}
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
                Bạn có chắc chắn muốn xóa học phí này?
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowConfirmFee(false)}
                  className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors duration-200"
                >
                  Hủy
                </button>
                <button
                  onClick={() => handleConfirmDeleteFee(feeId)}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors duration-200"
                >
                  Xóa
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Thêm Học Phí */}
      {showFormAddTuitionFee && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
          <div className="bg-black bg-opacity-50 inset-0 fixed"></div>
          <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white pr-12">
                Thêm học phí
              </h2>
              <button
                onClick={() => setShowFormAddTuitionFee(false)}
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
                onSubmit={handleAddFormTuitionFee}
                className="p-4"
                id="infoFormTuitionFee"
              >
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Học kỳ
                  </label>
                  <select
                    value={addFormDataTuitionFee.semester || selectedSemester}
                    onChange={(e) => {
                      const selectedSemesterId = e.target.value;
                      const selectedSemesterData = semesters.find(
                        (s) => s.id === selectedSemesterId
                      );

                      // Tự động điền gợi ý cho content
                      let suggestedContent = "";
                      if (selectedSemesterData) {
                        suggestedContent = `Tổng học phí ${selectedSemesterData.code} năm học ${selectedSemesterData.schoolYear}`;
                      }

                      setAddFormDataTuitionFee({
                        ...addFormDataTuitionFee,
                        semester: selectedSemesterId,
                        content: suggestedContent,
                      });
                    }}
                    required
                    className="bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 transition-colors duration-200"
                  >
                    <option value="" disabled>
                      Chọn học kỳ
                    </option>
                    {semesters
                      .sort((a, b) => {
                        // Sắp xếp theo năm học (mới nhất trước)
                        const yearComparison = b.schoolYear.localeCompare(
                          a.schoolYear
                        );
                        if (yearComparison !== 0) return yearComparison;

                        // Nếu cùng năm, sắp xếp theo học kỳ (lớn nhất trước - HK3, HK2, HK1)
                        const semesterA = a.code.includes(".")
                          ? parseInt(a.code.split(".")[1])
                          : 0;
                        const semesterB = b.code.includes(".")
                          ? parseInt(b.code.split(".")[1])
                          : 0;
                        return semesterB - semesterA;
                      })
                      .map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.code} - {s.schoolYear}
                        </option>
                      ))}
                  </select>
                </div>
                <div className="mb-4">
                  <label
                    htmlFor="content"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                  >
                    Loại tiền phải đóng
                  </label>
                  <input
                    type="text"
                    id="content"
                    name="content"
                    value={addFormDataTuitionFee.content}
                    onChange={(e) =>
                      setAddFormDataTuitionFee({
                        ...addFormDataTuitionFee,
                        content: e.target.value,
                      })
                    }
                    required
                    placeholder="vd: Tổng học phí học kỳ 2023.2"
                    className="bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 transition-colors duration-200"
                  />
                </div>
                <div className="mb-4">
                  <label
                    htmlFor="totalAmount"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                  >
                    Số tiền phải đóng
                  </label>
                  <input
                    type="text"
                    id="totalAmount"
                    name="totalAmount"
                    value={formatNumberWithDots(
                      addFormDataTuitionFee.totalAmount || ""
                    )}
                    onChange={(e) => {
                      const raw = e.target.value.replace(/\D/g, "");
                      setAddFormDataTuitionFee({
                        ...addFormDataTuitionFee,
                        totalAmount: raw,
                      });
                    }}
                    required
                    placeholder="vd: 15.000.000"
                    className="bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 transition-colors duration-200"
                  />
                </div>
                {/* Trạng thái mặc định 'Chưa thanh toán' khi thêm. Không cần chọn ở form user. */}
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors duration-200"
                    onClick={() => setShowFormAddTuitionFee(false)}
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

      {/* Modal Sửa Học Phí */}
      {isOpenTuitionFee && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
          <div className="bg-black bg-opacity-50 inset-0 fixed"></div>
          <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white pr-12">
                Chỉnh sửa học phí
              </h2>
              <button
                onClick={() => setIsOpenTuitionFee(false)}
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
                onSubmit={(e) => handleUpdateTuitionFee(e, feeId)}
                className="p-4"
                id="infoFormEditTuitionFee"
              >
                <div className="mb-4">
                  <label
                    htmlFor="semester2"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                  >
                    Học kỳ
                  </label>
                  <select
                    id="semester2"
                    name="semester2"
                    value={editedTuitionFee.semester || selectedSemester}
                    onChange={(e) =>
                      setEditedTuitionFee({
                        ...editedTuitionFee,
                        semester: e.target.value,
                      })
                    }
                    className="bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 transition-colors duration-200"
                  >
                    {semesters
                      .sort((a, b) => {
                        // Sắp xếp theo năm học (mới nhất trước)
                        const yearComparison = b.schoolYear.localeCompare(
                          a.schoolYear
                        );
                        if (yearComparison !== 0) return yearComparison;

                        // Nếu cùng năm, sắp xếp theo học kỳ (lớn nhất trước - HK3, HK2, HK1)
                        const semesterA = a.code.includes(".")
                          ? parseInt(a.code.split(".")[1])
                          : 0;
                        const semesterB = b.code.includes(".")
                          ? parseInt(b.code.split(".")[1])
                          : 0;
                        return semesterB - semesterA;
                      })
                      .map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.code} - {s.schoolYear}
                        </option>
                      ))}
                  </select>
                </div>
                <div className="mb-4">
                  <label
                    htmlFor="content2"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                  >
                    Loại tiền phải đóng
                  </label>
                  <input
                    type="text"
                    id="content2"
                    name="content2"
                    value={editedTuitionFee.content}
                    onChange={(e) =>
                      setEditedTuitionFee({
                        ...editedTuitionFee,
                        content: e.target.value,
                      })
                    }
                    placeholder="vd: Tổng học phí học kỳ 2023.2"
                    className="bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 transition-colors duration-200"
                  />
                </div>
                <div className="mb-4">
                  <label
                    htmlFor="totalAmount2"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                  >
                    Số tiền phải đóng
                  </label>
                  <input
                    type="text"
                    id="totalAmount2"
                    name="totalAmount2"
                    value={formatNumberWithDots(
                      editedTuitionFee.totalAmount || ""
                    )}
                    onChange={(e) => {
                      const raw = e.target.value.replace(/\D/g, "");
                      setEditedTuitionFee({
                        ...editedTuitionFee,
                        totalAmount: raw,
                      });
                    }}
                    placeholder="vd: 15.000.000"
                    className="bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 transition-colors duration-200"
                  />
                </div>
                {/* Ẩn trường Trạng thái trong modal user */}
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors duration-200"
                    onClick={() => setIsOpenTuitionFee(false)}
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
    </>
  );
};

export default TuitionFee;
