"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { handleNotify } from "../../../../../components/notify";
import axiosInstance from "@/utils/axiosInstance";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  BookOutlined,
  TrophyOutlined,
  SearchOutlined,
  ArrowLeftOutlined,
  GraduationCapOutlined,
  TeamOutlined,
} from "@ant-design/icons";

export default function UniversityOrganizations() {
  const params = useParams();
  const universityId = params.universityId;

  const [organizations, setOrganizations] = useState([]);
  const [hierarchyData, setHierarchyData] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedOrganization, setSelectedOrganization] = useState(null);
  const [organizationToDelete, setOrganizationToDelete] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  const [addFormData, setAddFormData] = useState({
    organizationName: "",
    travelTime: 45,
  });

  const [editFormData, setEditFormData] = useState({
    organizationName: "",
    travelTime: 45,
  });

  useEffect(() => {
    if (universityId) {
      fetchData();
    }
  }, [universityId]);

  const fetchData = async () => {
    try {
      const response = await axiosInstance.get(
        `/university/${universityId}/organizations`
      );

      setOrganizations(response.data);

      // Fetch hierarchy data for each organization
      const hierarchyPromises = response.data.map(async (org) => {
        try {
          const hierarchyResponse = await axiosInstance.get(
            `/university/organizations/${org.id}/hierarchy`
          );
          return hierarchyResponse.data;
        } catch (error) {
          console.error(
            `Error fetching hierarchy for organization ${org.id}:`,
            error
          );
          return { organization: org, educationLevels: [] };
        }
      });

      const hierarchyResults = await Promise.all(hierarchyPromises);
      setHierarchyData(hierarchyResults);
    } catch (error) {
      console.error("Error fetching organizations:", error);
      handleNotify("danger", "Lỗi!", "Không thể tải danh sách khoa/viện");
    }
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();

    if (!addFormData.organizationName) {
      handleNotify("warning", "Cảnh báo!", "Vui lòng điền tên khoa/viện");
      return;
    }

    try {
      await axiosInstance.post(`/university/${universityId}/organizations`, {
        organizationName: addFormData.organizationName,
        travelTime: addFormData.travelTime,
      });

      fetchData();
      resetAddForm();
      handleNotify("success", "Thành công!", "Thêm khoa/viện thành công!");
    } catch (error) {
      console.error("Error adding organization:", error);
      const errorMessage =
        error.response?.data?.message || "Có lỗi xảy ra khi thêm khoa/viện";
      handleNotify("danger", "Lỗi!", errorMessage);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();

    if (!editFormData.organizationName) {
      handleNotify("warning", "Cảnh báo!", "Vui lòng điền tên khoa/viện");
      return;
    }

    try {
      await axiosInstance.put(
        `/university/organizations/${selectedOrganization.id}`,
        {
          organizationName: editFormData.organizationName,
          travelTime: editFormData.travelTime,
        }
      );

      fetchData();
      resetEditForm();
      handleNotify("success", "Thành công!", "Cập nhật khoa/viện thành công!");
    } catch (error) {
      console.error("Error updating organization:", error);
      const errorMessage =
        error.response?.data?.message || "Có lỗi xảy ra khi cập nhật khoa/viện";
      handleNotify("danger", "Lỗi!", errorMessage);
    }
  };

  const handleEditOrganization = (organization) => {
    setSelectedOrganization(organization);
    setEditFormData({
      organizationName: organization.organizationName,
      travelTime: organization.travelTime || 45,
    });
    setShowEditForm(true);
  };

  const handleDeleteOrganization = (organization) => {
    setOrganizationToDelete(organization);
    setShowDeleteModal(true);
  };

  const confirmDeleteOrganization = async () => {
    try {
      await axiosInstance.delete(
        `/university/organizations/${organizationToDelete.id}`
      );

      fetchData();
      handleNotify("success", "Thành công!", "Xóa khoa/viện thành công!");
      setShowDeleteModal(false);
      setOrganizationToDelete(null);
    } catch (error) {
      console.error("Error deleting organization:", error);
      const errorMessage =
        error.response?.data?.message || "Có lỗi xảy ra khi xóa khoa/viện";
      handleNotify("danger", "Lỗi!", errorMessage);
    }
  };

  const resetAddForm = () => {
    setAddFormData({
      organizationName: "",
      travelTime: 45,
    });
    setShowAddForm(false);
  };

  const resetEditForm = () => {
    setEditFormData({
      organizationName: "",
      travelTime: 45,
    });
    setSelectedOrganization(null);
    setShowEditForm(false);
  };

  const filteredOrganizations = organizations.filter((org) =>
    org.organizationName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredHierarchyData = hierarchyData.filter((org) =>
    org.organization.organizationName
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  // Transform data for table display with rowSpan
  const transformDataForTable = () => {
    const tableData = [];

    filteredHierarchyData.forEach((orgData) => {
      const { organization, educationLevels } = orgData;

      // Chuẩn hóa thành các block theo chương trình, mỗi block có số hàng = max(1, số lớp)
      const levelBlocks = [];
      if (!educationLevels || educationLevels.length === 0) {
        levelBlocks.push({ educationLevel: null, rows: [{ class: null }] });
      } else {
        educationLevels.forEach((level) => {
          if (level.classes && level.classes.length > 0) {
            levelBlocks.push({
              educationLevel: level,
              rows: level.classes.map((c) => ({ class: c })),
            });
          } else {
            levelBlocks.push({
              educationLevel: level,
              rows: [{ class: null }],
            });
          }
        });
      }

      // Tổng số hàng của toàn bộ khoa/viện
      const totalOrgRows = levelBlocks.reduce(
        (sum, blk) => sum + blk.rows.length,
        0
      );

      let orgCellPlaced = false;
      levelBlocks.forEach((blk) => {
        let levelCellPlaced = false;
        blk.rows.forEach((row) => {
          tableData.push({
            organization,
            educationLevel: blk.educationLevel,
            class: row.class,
            rowSpan: {
              organization: orgCellPlaced ? 0 : totalOrgRows,
              educationLevel: levelCellPlaced ? 0 : blk.rows.length,
              class: 1,
            },
          });
          orgCellPlaced = true;
          levelCellPlaced = true;
        });
      });
    });

    return tableData;
  };

  const tableData = transformDataForTable();

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
                    <Link
                      href="/admin/universities"
                      className="ms-1 text-sm font-medium text-gray-500 hover:text-blue-600 md:ms-2 dark:text-gray-400 dark:hover:text-white"
                    >
                      Quản lý Trường Đại Học
                    </Link>
                  </div>
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
                      Quản lý Khoa/Viện
                    </div>
                  </div>
                </li>
              </ol>
            </nav>
          </div>

          <div className="w-full pt-8 pb-5 pl-5 pr-6 mb-5">
            <div className="bg-white dark:bg-gray-800 rounded-lg w-full shadow-lg">
              <div className="flex justify-between font-bold p-5 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-4">
                  <Link
                    href="/admin/universities"
                    className="text-blue-600 hover:text-blue-800"
                    title="Quay lại"
                  >
                    <ArrowLeftOutlined className="text-xl" />
                  </Link>
                  <div className="text-gray-900 dark:text-white text-lg">
                    QUẢN LÝ KHOA/VIỆN
                  </div>
                </div>
                <button
                  onClick={() => setShowAddForm(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm flex items-center gap-2"
                >
                  <PlusOutlined />
                  Thêm Khoa/Viện
                </button>
              </div>

              <div className="p-5">
                {/* Search Bar */}
                <div className="mb-6">
                  <div className="relative">
                    <SearchOutlined className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Tìm kiếm khoa/viện..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                </div>

                {/* Main Table */}
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 border border-gray-200 dark:border-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider border-r border-gray-200 dark:border-gray-600 whitespace-nowrap">
                          Tên khoa/viện
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider border-r border-gray-200 dark:border-gray-600 whitespace-nowrap">
                          Thời gian di chuyển
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider border-r border-gray-200 dark:border-gray-600 whitespace-nowrap">
                          Chương trình đào tạo
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider border-r border-gray-200 dark:border-gray-600 whitespace-nowrap">
                          Lớp
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider border-r border-gray-200 dark:border-gray-600 whitespace-nowrap">
                          Thao tác
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {tableData.length > 0 ? (
                        tableData.map((row, index) => {
                          const cells = [];

                          // Organization cell
                          if (row.rowSpan.organization > 0) {
                            cells.push(
                              <td
                                key="organization"
                                rowSpan={row.rowSpan.organization}
                                className="px-4 py-4 text-center border-r border-gray-200 dark:border-gray-600"
                              >
                                <div className="font-medium text-gray-900 dark:text-white">
                                  <BookOutlined className="mr-2" />
                                  {row.organization.organizationName}
                                </div>
                              </td>
                            );
                          }

                          // Travel Time cell
                          if (row.rowSpan.organization > 0) {
                            cells.push(
                              <td
                                key="travelTime"
                                rowSpan={row.rowSpan.organization}
                                className="px-4 py-4 text-center border-r border-gray-200 dark:border-gray-600"
                              >
                                <div className="text-sm text-gray-500 dark:text-gray-400">
                                  {row.organization.travelTime || 45} phút
                                </div>
                              </td>
                            );
                          }

                          // Education Level cell
                          if (
                            row.educationLevel &&
                            row.rowSpan.educationLevel > 0
                          ) {
                            cells.push(
                              <td
                                key="educationLevel"
                                rowSpan={row.rowSpan.educationLevel}
                                className="px-4 py-4 text-center border-r border-gray-200 dark:border-gray-600"
                              >
                                <div className="font-medium text-gray-900 dark:text-white">
                                  <TrophyOutlined className="mr-2" />
                                  {row.educationLevel.levelName}
                                </div>
                                <div className="text-sm text-gray-500 dark:text-gray-400">
                                  {row.educationLevel.classes.length} lớp
                                </div>
                              </td>
                            );
                          } else if (!row.educationLevel) {
                            cells.push(
                              <td
                                key="educationLevel"
                                className="px-4 py-4 text-center border-r border-gray-200 dark:border-gray-600"
                              >
                                <div className="text-sm text-gray-500 dark:text-gray-400">
                                  Chưa có dữ liệu
                                </div>
                              </td>
                            );
                          }

                          // Class cell
                          if (row.class) {
                            cells.push(
                              <td
                                key="class"
                                className="px-4 py-4 text-center border-r border-gray-200 dark:border-gray-600"
                              >
                                <div className="font-medium text-gray-900 dark:text-white">
                                  <TeamOutlined className="mr-2" />
                                  {row.class.className}
                                </div>
                              </td>
                            );
                          } else if (
                            row.educationLevel &&
                            row.educationLevel.classes.length === 0
                          ) {
                            cells.push(
                              <td
                                key="class"
                                className="px-4 py-4 text-center border-r border-gray-200 dark:border-gray-600"
                              >
                                <div className="text-sm text-gray-500 dark:text-gray-400">
                                  Chưa có lớp
                                </div>
                              </td>
                            );
                          } else if (!row.educationLevel) {
                            cells.push(
                              <td
                                key="class"
                                className="px-4 py-4 text-center border-r border-gray-200 dark:border-gray-600"
                              >
                                <div className="text-sm text-gray-500 dark:text-gray-400">
                                  Chưa có lớp
                                </div>
                              </td>
                            );
                          }

                          // Actions cell
                          if (row.rowSpan.organization > 0) {
                            cells.push(
                              <td
                                key="actions"
                                rowSpan={row.rowSpan.organization}
                                className="px-4 py-4 whitespace-nowrap text-sm font-medium border-r border-gray-200 dark:border-gray-600"
                              >
                                <div className="flex justify-center items-center space-x-4">
                                  <Link
                                    href={`/admin/universities/${universityId}/organizations/${row.organization.id}/education-levels`}
                                    className="text-orange-600 hover:text-orange-900 p-2 rounded-lg hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-colors"
                                    title="Quản lý Chương trình đào tạo"
                                  >
                                    <TrophyOutlined className="text-lg" />
                                  </Link>
                                  <button
                                    onClick={() =>
                                      handleEditOrganization(row.organization)
                                    }
                                    className="text-blue-600 hover:text-blue-900 p-2 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                                    title="Chỉnh sửa"
                                  >
                                    <EditOutlined className="text-lg" />
                                  </button>
                                  <button
                                    onClick={() =>
                                      handleDeleteOrganization(row.organization)
                                    }
                                    className="text-red-600 hover:text-red-900 p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                    title="Xóa"
                                  >
                                    <DeleteOutlined className="text-lg" />
                                  </button>
                                </div>
                              </td>
                            );
                          }

                          return (
                            <tr
                              key={`${row.organization.id}-${index}`}
                              className="border-b border-gray-200 dark:border-gray-600"
                            >
                              {cells}
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td
                            colSpan="6"
                            className="px-4 py-4 text-center text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-600"
                          >
                            <div className="flex flex-col items-center">
                              <BookOutlined className="text-4xl mb-2" />
                              <div>Chưa có dữ liệu khoa/viện</div>
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

      {/* Add Form */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Thêm Khoa/Viện
              </h2>
              <button
                onClick={resetAddForm}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Tên khoa/viện *
                </label>
                <input
                  type="text"
                  value={addFormData.organizationName}
                  onChange={(e) =>
                    setAddFormData((prev) => ({
                      ...prev,
                      organizationName: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Nhập tên khoa/viện"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Thời gian di chuyển (phút)
                </label>
                <input
                  type="number"
                  value={addFormData.travelTime}
                  onChange={(e) =>
                    setAddFormData((prev) => ({
                      ...prev,
                      travelTime: parseInt(e.target.value),
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="45"
                  min="0"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={resetAddForm}
                  className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                >
                  Thêm
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Form */}
      {showEditForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Chỉnh sửa Khoa/Viện
              </h2>
              <button
                onClick={resetEditForm}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Tên khoa/viện *
                </label>
                <input
                  type="text"
                  value={editFormData.organizationName}
                  onChange={(e) =>
                    setEditFormData((prev) => ({
                      ...prev,
                      organizationName: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Nhập tên khoa/viện"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Thời gian di chuyển (phút)
                </label>
                <input
                  type="number"
                  value={editFormData.travelTime}
                  onChange={(e) =>
                    setEditFormData((prev) => ({
                      ...prev,
                      travelTime: parseInt(e.target.value),
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="45"
                  min="0"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={resetEditForm}
                  className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                >
                  Cập nhật
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center mb-6">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
                  <DeleteOutlined className="text-red-600 dark:text-red-400 text-xl" />
                </div>
              </div>
              <div className="ml-4">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Xác nhận xóa
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Bạn có chắc chắn muốn xóa khoa/viện này?
                </p>
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-6">
              <div className="text-sm text-gray-600 dark:text-gray-300">
                <strong>Tên khoa/viện:</strong>{" "}
                {organizationToDelete?.organizationName}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-300">
                <strong>Thời gian di chuyển:</strong>{" "}
                {organizationToDelete?.travelTime || 45} phút
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setOrganizationToDelete(null);
                }}
                className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={confirmDeleteOrganization}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
              >
                Xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
