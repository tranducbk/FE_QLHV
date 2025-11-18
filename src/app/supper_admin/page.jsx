"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { handleNotify } from "@/components/notify";
import { useModalScroll } from "@/hooks/useModalScroll";
import axiosInstance from "@/utils/axiosInstance";

const AdminManagement = () => {
  const router = useRouter();
  const [users, setUsers] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL"); // ALL, ADMIN, USER
  const [unitFilter, setUnitFilter] = useState("ALL"); // ALL hoặc tên đơn vị
  const [units, setUnits] = useState([]); // Danh sách các đơn vị
  const [pageSize, setPageSize] = useState(10);
  const [showForm, setShowForm] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [userToDelete, setUserToDelete] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const [formData, setFormData] = useState({
    username: "",
    password: "",
    confirmPassword: "",
    role: "USER",
  });

  // Disable scroll khi có modal mở
  useModalScroll(showForm || showConfirm);

  useEffect(() => {
    fetchUsers();
  }, [currentPage, searchTerm, roleFilter, unitFilter, pageSize]);

  // Fetch danh sách đơn vị khi component mount
  useEffect(() => {
    fetchUnits();
  }, []);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      // Fetching users

      const response = await axiosInstance.get(`/user/admin-users/list`, {
        params: {
          page: currentPage,
          search: searchTerm,
          role: roleFilter !== "ALL" ? roleFilter : undefined,
          unit: unitFilter !== "ALL" ? unitFilter : undefined,
          pageSize: pageSize,
        },
      });

      // Sắp xếp: SUPER_ADMIN > ADMIN > USER
      const sortedUsers = (response.data.users || []).sort((a, b) => {
        const roleOrder = { SUPER_ADMIN: 1, ADMIN: 2, USER: 3 };
        const orderA = roleOrder[a.role] || 4;
        const orderB = roleOrder[b.role] || 4;
        return orderA - orderB;
      });

      setUsers(sortedUsers);
      setTotalPages(response.data.totalPages || 1);
    } catch (error) {
      console.error("Error fetching users:", error);
      if (error.response?.status === 403) {
        handleNotify(
          "warning",
          "Cảnh báo!",
          "Bạn không có quyền truy cập chức năng này"
        );
        router.push("/admin");
      } else if (error.response?.status === 401) {
        handleNotify("warning", "Cảnh báo!", "Phiên đăng nhập hết hạn");
        router.push("/login");
      } else {
        handleNotify("danger", "Lỗi!", "Không thể tải danh sách admin users");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingUser(null);
    setFormData({
      username: "",
      password: "",
      confirmPassword: "",
      role: "USER",
    });
    setShowPassword(false);
    setShowConfirmPassword(false);
    setErrorMessage("");
    setShowForm(true);
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setFormData({
      username: user.username,
      password: "",
      confirmPassword: "",
      role: user.role,
    });
    setShowPassword(false);
    setShowConfirmPassword(false);
    setErrorMessage("");
    setShowForm(true);
  };

  const handleDelete = (user) => {
    setUserToDelete(user);
    setShowConfirm(true);
  };

  const confirmDelete = async () => {
    try {
      setIsLoading(true);
      await axiosInstance.delete(`/user/admin-users/${userToDelete.id}`);
      handleNotify("success", "Thành công!", "Xóa tài khoản thành công");
      setShowConfirm(false);
      setUserToDelete(null);
      fetchUsers();
    } catch (error) {
      console.error("Error deleting user:", error);
      handleNotify(
        "danger",
        "Lỗi!",
        error.response?.data?.message || "Không thể xóa tài khoản"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Reset error message
    setErrorMessage("");

    // Validation - chỉ bắt buộc username và password
    if (!formData.username || formData.username.trim().length < 4) {
      const errorMsg = "Username phải có ít nhất 4 ký tự";
      setErrorMessage(errorMsg);
      return;
    }

    // Validation cho mật khẩu khi tạo mới
    if (!editingUser && (!formData.password || formData.password.length < 6)) {
      const errorMsg = "Mật khẩu phải có ít nhất 6 ký tự";
      setErrorMessage(errorMsg);
      return;
    }

    if (!editingUser && formData.password !== formData.confirmPassword) {
      const errorMsg = "Mật khẩu và xác nhận mật khẩu không khớp";
      setErrorMessage(errorMsg);
      return;
    }

    // Validation cho mật khẩu khi chỉnh sửa (nếu có nhập mật khẩu mới)
    if (editingUser && formData.password) {
      if (formData.password.length < 6) {
        const errorMsg = "Mật khẩu mới phải có ít nhất 6 ký tự";
        setErrorMessage(errorMsg);
        return;
      }
      if (formData.password !== formData.confirmPassword) {
        const errorMsg = "Mật khẩu mới và xác nhận mật khẩu không khớp";
        setErrorMessage(errorMsg);
        return;
      }
    }

    try {
      setIsLoading(true);
      const requestData = {
        username: formData.username,
        password: formData.password || undefined,
        role: formData.role,
      };

      if (editingUser) {
        await axiosInstance.put(
          `/user/admin-users/${editingUser.id}`,
          requestData
        );
        handleNotify("success", "Thành công!", "Cập nhật tài khoản thành công");
      } else {
        await axiosInstance.post(`/user/admin-users`, requestData);
        handleNotify("success", "Thành công!", "Tạo tài khoản thành công");
      }

      setShowForm(false);
      setErrorMessage("");
      fetchUsers();
    } catch (error) {
      console.error("Lỗi lưu tài khoản:", error);
      const errorMsg =
        error.response?.data?.message ||
        "Không thể lưu tài khoản. Vui lòng thử lại!";
      setErrorMessage(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const fetchUnits = async () => {
    try {
      // Fetch tất cả users để lấy danh sách đơn vị
      const response = await axiosInstance.get(`/user/admin-users/list`, {
        params: {
          page: 1,
          pageSize: 1000, // Lấy nhiều để có đủ danh sách đơn vị
        },
      });

      // Lấy danh sách đơn vị từ users
      const unitSet = new Set();
      (response.data.users || []).forEach((user) => {
        if (user.unit && user.unit.trim()) {
          unitSet.add(user.unit.trim());
        }
      });

      // Sắp xếp và set units
      const sortedUnits = Array.from(unitSet).sort();
      setUnits(sortedUnits);
    } catch (error) {
      console.error("Error fetching units:", error);
    }
  };

  const handleRoleFilter = (e) => {
    setRoleFilter(e.target.value);
    setCurrentPage(1);
  };

  const handleUnitFilter = (e) => {
    setUnitFilter(e.target.value);
    setCurrentPage(1);
  };

  const handlePageSizeChange = (e) => {
    setPageSize(parseInt(e.target.value));
    setCurrentPage(1);
  };

  const getRoleBadge = (role) => {
    if (role === "SUPER_ADMIN") {
      return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
    }
    if (role === "ADMIN") {
      return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
    }
    return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
  };

  const getRoleText = (role) => {
    if (role === "SUPER_ADMIN") return "SUPER ADMIN";
    if (role === "ADMIN") return "ADMIN";
    return "USER";
  };

  return (
    <>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4">
          <div className="p-6">
            {/* Header */}
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                QUẢN LÝ TÀI KHOẢN HỆ THỐNG
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Quản lý tài khoản quản trị viên và học viên hệ thống
              </p>
            </div>

            {/* Search and Add */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex-1 flex gap-4">
                  {/* Search Box */}
                  <div className="relative flex-1">
                    <input
                      type="text"
                      placeholder="Tìm kiếm theo username, họ tên..."
                      value={searchTerm}
                      onChange={handleSearch}
                      className="w-full px-4 py-3 pl-10 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                    <svg
                      className="absolute left-3 top-4 h-5 w-5 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      />
                    </svg>
                  </div>

                  {/* Role Filter */}
                  <select
                    value={roleFilter}
                    onChange={handleRoleFilter}
                    className="px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white min-w-[150px]"
                  >
                    <option value="ALL">Tất cả quyền</option>
                    <option value="USER">USER</option>
                    <option value="ADMIN">ADMIN</option>
                  </select>

                  {/* Unit Filter */}
                  <select
                    value={unitFilter}
                    onChange={handleUnitFilter}
                    className="px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white min-w-[180px]"
                  >
                    <option value="ALL">Tất cả đơn vị</option>
                    {units.map((unit) => (
                      <option key={unit} value={unit}>
                        {unit}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  onClick={handleAdd}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2 whitespace-nowrap"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                  Thêm Tài khoản
                </button>
              </div>
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
              {isLoading ? (
                <div className="flex flex-col justify-center items-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">
                    Đang tải thông tin...
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                      <tr>
                        <th className="px-6 py-3 text-center">STT</th>
                        <th className="px-6 py-3">Avatar</th>
                        <th className="px-6 py-3">Username</th>
                        <th className="px-6 py-3">Họ tên</th>
                        <th className="px-6 py-3">Đơn vị</th>
                        <th className="px-6 py-3">Loại TK</th>
                        <th className="px-6 py-3 text-center">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.length === 0 ? (
                        <tr>
                          <td
                            colSpan="7"
                            className="px-6 py-8 text-center text-gray-500"
                          >
                            Không có tài khoản nào
                          </td>
                        </tr>
                      ) : (
                        users.map((user, index) => (
                          <tr
                            key={user.id}
                            className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
                          >
                            <td className="px-6 py-4 text-center font-medium text-gray-900 dark:text-white">
                              {(currentPage - 1) * pageSize + index + 1}
                            </td>
                            <td className="px-6 py-4">
                              <img
                                src={
                                  user.avatar ||
                                  "https://i.pinimg.com/736x/d4/a1/ff/d4a1ff9d0f243e50062e2b21f2f2496d.jpg"
                                }
                                alt="Avatar"
                                className="w-10 h-10 rounded-full object-cover"
                              />
                            </td>
                            <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                              {user.username}
                            </td>
                            <td className="px-6 py-4">
                              {user.fullName || "-"}
                            </td>
                            <td className="px-6 py-4">{user.unit || "-"}</td>
                            <td className="px-6 py-4">
                              <span
                                className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleBadge(
                                  user.role
                                )}`}
                              >
                                {getRoleText(user.role)}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex justify-center gap-2">
                                <button
                                  onClick={() => handleEdit(user)}
                                  className="px-3 py-1.5 bg-yellow-500 hover:bg-yellow-600 text-white rounded-md text-xs font-medium transition-colors"
                                >
                                  Sửa
                                </button>
                                <button
                                  onClick={() => handleDelete(user)}
                                  className="px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white rounded-md text-xs font-medium transition-colors"
                                >
                                  Xóa
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Pagination */}
              <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700 border-t dark:border-gray-600">
                <div className="flex items-center justify-between gap-4">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Trang trước
                  </button>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300 px-4 py-2 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-lg shadow-sm">
                      Trang {currentPage} / {totalPages}
                    </span>
                    <div className="relative">
                      <select
                        value={pageSize}
                        onChange={handlePageSizeChange}
                        className="appearance-none pl-4 pr-10 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none hover:bg-gray-50 dark:hover:bg-gray-500 transition-all shadow-sm cursor-pointer"
                      >
                        <option value={5}>5 / trang</option>
                        <option value={10}>10 / trang</option>
                        <option value={20}>20 / trang</option>
                        <option value={50}>50 / trang</option>
                        <option value={100}>100 / trang</option>
                      </select>
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                        <svg
                          className="w-4 h-4 text-gray-400 dark:text-gray-500"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 9l-7 7-7-7"
                          />
                        </svg>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() =>
                      setCurrentPage((p) => Math.min(totalPages, p + 1))
                    }
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Trang sau
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Form Modal */}
        {showForm && (
          <>
            <div
              className="bg-black opacity-50 fixed inset-0 z-[9999]"
              onClick={() => setShowForm(false)}
            ></div>
            <div className="fixed inset-0 z-[10000] flex justify-center items-center p-4">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg relative p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <button
                  onClick={() => setShowForm(false)}
                  className="absolute top-4 right-4 text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg text-sm w-8 h-8 flex justify-center items-center"
                >
                  <svg
                    className="w-3 h-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 14 14"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M1 1l12 12m0-12L1 13"
                    />
                  </svg>
                </button>

                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                  {editingUser ? "Chỉnh sửa tài khoản" : "Thêm tài khoản mới"}
                </h3>

                {errorMessage && (
                  <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                    <p className="text-sm text-red-600 dark:text-red-400">
                      {errorMessage}
                    </p>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                  {/* Username */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Username <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.username}
                      onChange={(e) =>
                        setFormData({ ...formData, username: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                      placeholder="Nhập username"
                    />
                  </div>

                  {/* Password */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {editingUser
                          ? "Mật khẩu mới (để trống nếu không đổi)"
                          : "Mật khẩu"}
                        {!editingUser && (
                          <span className="text-red-500">*</span>
                        )}
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword ? "text" : "password"}
                          value={formData.password}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              password: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                          placeholder="Nhập mật khẩu"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                        >
                          {showPassword ? (
                            <svg
                              className="w-5 h-5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                              />
                            </svg>
                          ) : (
                            <svg
                              className="w-5 h-5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                              />
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                              />
                            </svg>
                          )}
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {editingUser
                          ? "Xác nhận mật khẩu mới"
                          : "Xác nhận mật khẩu"}
                        {!editingUser && (
                          <span className="text-red-500">*</span>
                        )}
                        {editingUser && formData.password && (
                          <span className="text-red-500">*</span>
                        )}
                      </label>
                      <div className="relative">
                        <input
                          type={showConfirmPassword ? "text" : "password"}
                          value={formData.confirmPassword}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              confirmPassword: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                          placeholder={
                            editingUser
                              ? "Nhập lại mật khẩu mới"
                              : "Nhập lại mật khẩu"
                          }
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setShowConfirmPassword(!showConfirmPassword)
                          }
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                        >
                          {showConfirmPassword ? (
                            <svg
                              className="w-5 h-5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                              />
                            </svg>
                          ) : (
                            <svg
                              className="w-5 h-5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                              />
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                              />
                            </svg>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Role */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Loại tài khoản <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.role}
                      onChange={(e) =>
                        setFormData({ ...formData, role: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                      disabled={!!editingUser}
                    >
                      {editingUser && editingUser.role === "SUPER_ADMIN" && (
                        <option value="SUPER_ADMIN">SUPER ADMIN</option>
                      )}
                      <option value="USER">USER</option>
                      <option value="ADMIN">ADMIN</option>
                    </select>
                  </div>

                  {/* Actions */}
                  <div className="flex justify-end gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowForm(false)}
                      className="px-5 py-2.5 bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-800 dark:text-white rounded-lg font-medium transition-colors"
                    >
                      Hủy
                    </button>
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors flex items-center gap-2"
                    >
                      {isLoading && (
                        <svg
                          className="animate-spin h-4 w-4"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                      )}
                      {isLoading
                        ? "Đang xử lý..."
                        : editingUser
                        ? "Cập nhật"
                        : "Tạo mới"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </>
        )}

        {/* Delete Confirmation Modal */}
        {showConfirm && userToDelete && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-[9999]">
            <div className="relative p-6 text-center bg-white dark:bg-gray-800 rounded-lg shadow-lg max-w-md w-full mx-4">
              <button
                onClick={() => setShowConfirm(false)}
                className="absolute top-2.5 right-2.5 bg-transparent hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg text-sm p-1.5"
              >
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>

              <div className="flex flex-col items-center mb-6">
                <img
                  src={
                    userToDelete.avatar ||
                    "https://i.pinimg.com/736x/d4/a1/ff/d4a1ff9d0f243e50062e2b21f2f2496d.jpg"
                  }
                  alt="Avatar"
                  className="w-16 h-16 rounded-full object-cover mb-4"
                />
                <svg
                  className="w-12 h-12 text-red-600 mb-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>

              <h3 className="mb-2 text-xl font-bold text-gray-900 dark:text-white">
                Bạn có chắc chắn muốn xóa?
              </h3>
              <p className="mb-2 text-gray-700 dark:text-gray-300">
                <strong>{userToDelete.fullName}</strong>
              </p>
              <p className="mb-6 text-gray-600 dark:text-gray-400 text-sm">
                Username: {userToDelete.username}
              </p>

              <div className="flex justify-center gap-3">
                <button
                  onClick={() => setShowConfirm(false)}
                  className="px-5 py-2.5 bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-800 dark:text-white rounded-lg font-medium transition-colors"
                >
                  Hủy
                </button>
                <button
                  onClick={confirmDelete}
                  disabled={isLoading}
                  className="px-5 py-2.5 bg-red-600 hover:bg-red-700 disabled:bg-red-400 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors flex items-center gap-2"
                >
                  {isLoading && (
                    <svg
                      className="animate-spin h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                  )}
                  {isLoading ? "Đang xóa..." : "Xác nhận xóa"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default AdminManagement;
