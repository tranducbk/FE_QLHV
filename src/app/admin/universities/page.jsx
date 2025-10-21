"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import Link from "next/link";
import { handleNotify } from "../../../components/notify";
import Loader from "@/components/loader";
import { useLoading } from "@/hooks";
import { BASE_URL } from "@/configs";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  BankOutlined,
  BookOutlined,
  TrophyOutlined,
  TeamOutlined,
  SearchOutlined,
} from "@ant-design/icons";

export default function Universities() {
  const [universities, setUniversities] = useState([]);

  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedUniversity, setSelectedUniversity] = useState(null);
  const [universityToDelete, setUniversityToDelete] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const { loading, withLoading } = useLoading(true);

  // Add form data (for simple add/edit)
  const [addFormData, setAddFormData] = useState({
    universityCode: "",
    universityName: "",
  });

  // Edit form data
  const [editFormData, setEditFormData] = useState({
    universityCode: "",
    universityName: "",
  });

  useEffect(() => {
    const loadData = async () => {
      await withLoading(fetchData);
    };
    loadData();
  }, [withLoading]);

  const handleAddInputChange = (field, value) => {
    setAddFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleEditInputChange = (field, value) => {
    setEditFormData((prev) => ({ ...prev, [field]: value }));
  };

  const fetchData = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        handleNotify("danger", "Lỗi!", "Vui lòng đăng nhập lại");
        return;
      }

      // Lấy danh sách universities
      const universitiesRes = await axios.get(`${BASE_URL}/university`, {
        headers: { token: `Bearer ${token}` },
      });

      // Lấy organizations, education levels, và classes cho mỗi university
      const universitiesWithData = await Promise.all(
        universitiesRes.data.map(async (university) => {
          try {
            // Lấy organizations cho university này
            const organizationsRes = await axios.get(
              `${BASE_URL}/university/${university.id}/organizations`,
              {
                headers: { token: `Bearer ${token}` },
              }
            );

            // Lấy education levels và classes cho mỗi organization
            const organizationsWithData = await Promise.all(
              organizationsRes.data.map(async (organization) => {
                try {
                  // Lấy education levels cho organization này
                  const educationLevelsRes = await axios.get(
                    `${BASE_URL}/university/organizations/${organization.id}/education-levels`,
                    {
                      headers: { token: `Bearer ${token}` },
                    }
                  );

                  // Lấy classes cho mỗi education level
                  const educationLevelsWithData = await Promise.all(
                    educationLevelsRes.data.map(async (educationLevel) => {
                      try {
                        const classesRes = await axios.get(
                          `${BASE_URL}/university/education-levels/${educationLevel.id}/classes`,
                          {
                            headers: { token: `Bearer ${token}` },
                          }
                        );
                        return {
                          ...educationLevel,
                          classes: classesRes.data,
                        };
                      } catch (error) {
                        return {
                          ...educationLevel,
                          classes: [],
                        };
                      }
                    })
                  );

                  return {
                    ...organization,
                    educationLevels: educationLevelsWithData,
                  };
                } catch (error) {
                  return {
                    ...organization,
                    educationLevels: [],
                  };
                }
              })
            );

            return {
              ...university,
              organizations: organizationsWithData,
            };
          } catch (error) {
            return {
              ...university,
              organizations: [],
            };
          }
        })
      );

      setUniversities(universitiesWithData);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();

    if (!addFormData.universityCode || !addFormData.universityName) {
      handleNotify("warning", "Cảnh báo!", "Vui lòng điền đầy đủ thông tin");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        handleNotify("danger", "Lỗi!", "Vui lòng đăng nhập lại");
        return;
      }

      // Create university
      await axios.post(
        `${BASE_URL}/university/create`,
        {
          universityCode: addFormData.universityCode,
          universityName: addFormData.universityName,
        },
        {
          headers: { token: `Bearer ${token}` },
        }
      );

      // Refresh data
      fetchData();

      resetAddForm();
      handleNotify("success", "Thành công!", "Thêm trường thành công!");
    } catch (error) {
      console.error("Error creating data:", error);
      const errorMessage =
        error.response?.data?.message || "Lỗi khi thêm dữ liệu";
      handleNotify("danger", "Lỗi!", errorMessage);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();

    if (!editFormData.universityCode || !editFormData.universityName) {
      handleNotify("warning", "Cảnh báo!", "Vui lòng điền đầy đủ thông tin");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        handleNotify("danger", "Lỗi!", "Vui lòng đăng nhập lại");
        return;
      }

      await axios.put(
        `${BASE_URL}/university/${selectedUniversity.id}`,
        {
          universityCode: editFormData.universityCode,
          universityName: editFormData.universityName,
        },
        {
          headers: { token: `Bearer ${token}` },
        }
      );

      // Refresh data
      fetchData();

      resetEditForm();
      handleNotify("success", "Thành công!", "Cập nhật trường thành công!");
    } catch (error) {
      console.error("Error updating data:", error);
      const errorMessage =
        error.response?.data?.message || "Lỗi khi cập nhật dữ liệu";
      handleNotify("danger", "Lỗi!", errorMessage);
    }
  };

  const handleEditUniversity = (university) => {
    setSelectedUniversity(university);
    setEditFormData({
      universityCode: university.universityCode,
      universityName: university.universityName,
    });
    setShowEditForm(true);
  };

  const handleDeleteUniversity = (university) => {
    setUniversityToDelete(university);
    setShowDeleteModal(true);
  };

  const confirmDeleteUniversity = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        handleNotify("danger", "Lỗi!", "Vui lòng đăng nhập lại");
        return;
      }

      await axios.delete(`${BASE_URL}/university/${universityToDelete.id}`, {
        headers: { token: `Bearer ${token}` },
      });

      // Refresh data
      fetchData();

      handleNotify("success", "Thành công!", "Xóa trường thành công!");
      setShowDeleteModal(false);
      setUniversityToDelete(null);
    } catch (error) {
      console.error("Error deleting university:", error);
      const errorMessage =
        error.response?.data?.message || "Lỗi khi xóa trường";
      handleNotify("danger", "Lỗi!", errorMessage);
    }
  };

  const resetAddForm = () => {
    setAddFormData({
      universityCode: "",
      universityName: "",
    });
    setShowAddForm(false);
  };

  const resetEditForm = () => {
    setEditFormData({
      universityCode: "",
      universityName: "",
    });
    setSelectedUniversity(null);
    setShowEditForm(false);
  };

  const getHierarchyData = () => {
    return universities;
  };

  const filteredUniversities = getHierarchyData().filter(
    (university) =>
      university.universityName
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      university.universityCode.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <Loader text="Đang tải dữ liệu trường đại học..." />;
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
                      Quản lý Trường Đại Học
                    </div>
                  </div>
                </li>
              </ol>
            </nav>
          </div>

          <div className="w-full pt-8 pb-5 pl-5 pr-6 mb-5">
            <div className="bg-white dark:bg-gray-800 rounded-lg w-full shadow-lg">
              <div className="flex justify-between font-bold p-5 border-b border-gray-200 dark:border-gray-700">
                <div className="text-gray-900 pt-2 dark:text-white text-lg">
                  QUẢN LÝ TRƯỜNG ĐẠI HỌC
                </div>
                <div className="flex items-center gap-3">
                  <Link
                    href="/admin/list-user"
                    className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm flex items-center gap-2 transition-colors"
                  >
                    <svg
                      className="w-4 h-4"
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
                    Quay lại trang quản lý học viên
                  </Link>
                  <button
                    onClick={() => setShowAddForm(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm flex items-center gap-2"
                  >
                    <PlusOutlined />
                    Thêm Trường
                  </button>
                </div>
              </div>

              <div className="p-5">
                {/* Search Bar */}
                <div className="mb-6">
                  <div className="relative">
                    <SearchOutlined className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Tìm kiếm trường..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                  <table className="table-auto w-full divide-y divide-gray-200 dark:divide-gray-700 border border-gray-200 dark:border-gray-700 rounded-lg">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th
                          scope="col"
                          className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider border-r border-gray-200 dark:border-gray-600 whitespace-nowrap"
                        >
                          TÊN TRƯỜNG
                        </th>
                        <th
                          scope="col"
                          className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider border-r border-gray-200 dark:border-gray-600 whitespace-nowrap"
                        >
                          KHOA/VIỆN
                        </th>
                        <th
                          scope="col"
                          className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider border-r border-gray-200 dark:border-gray-600 whitespace-nowrap"
                        >
                          THỜI GIAN DI CHUYỂN
                        </th>
                        <th
                          scope="col"
                          className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider border-r border-gray-200 dark:border-gray-600 whitespace-nowrap"
                        >
                          CHƯƠNG TRÌNH ĐÀO TẠO
                        </th>
                        <th
                          scope="col"
                          className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider border-r border-gray-200 dark:border-gray-600 whitespace-nowrap"
                        >
                          LỚP
                        </th>
                        <th
                          scope="col"
                          className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider border-r border-gray-200 dark:border-gray-600 whitespace-nowrap"
                        >
                          THAO TÁC
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {filteredUniversities.length > 0 ? (
                        filteredUniversities.map((university) => {
                          // Tạo mảng các hàng cho university này
                          const rows = [];

                          if (university.organizations.length === 0) {
                            // University không có organizations
                            rows.push({
                              university: university,
                              organization: null,
                              educationLevel: null,
                              class: null,
                              universityRowSpan: 1,
                              organizationRowSpan: 1,
                              educationLevelRowSpan: 1,
                              isUniversityStart: true,
                              isOrganizationStart: true,
                              isEducationLevelStart: true,
                            });
                          } else {
                            // University có organizations
                            university.organizations.forEach((org) => {
                              if (org.educationLevels.length === 0) {
                                // Organization không có education levels
                                rows.push({
                                  university: university,
                                  organization: org,
                                  educationLevel: null,
                                  class: null,
                                  universityRowSpan: 0, // Sẽ tính sau
                                  organizationRowSpan: 1,
                                  educationLevelRowSpan: 1,
                                  isUniversityStart: rows.length === 0,
                                  isOrganizationStart: true,
                                  isEducationLevelStart: true,
                                });
                              } else {
                                // Organization có education levels
                                org.educationLevels.forEach((level) => {
                                  if (level.classes.length === 0) {
                                    // Education level không có classes - vẫn hiển thị education level
                                    rows.push({
                                      university: university,
                                      organization: org,
                                      educationLevel: level,
                                      class: null,
                                      universityRowSpan: 0, // Sẽ tính sau
                                      organizationRowSpan: 0, // Sẽ tính sau
                                      educationLevelRowSpan: 1,
                                      isUniversityStart: rows.length === 0,
                                      isOrganizationStart:
                                        rows.filter(
                                          (r) => r.organization?.id === org.id
                                        ).length === 0,
                                      isEducationLevelStart: true,
                                    });
                                  } else {
                                    // Education level có classes
                                    level.classes.forEach((cls) => {
                                      rows.push({
                                        university: university,
                                        organization: org,
                                        educationLevel: level,
                                        class: cls,
                                        universityRowSpan: 0, // Sẽ tính sau
                                        organizationRowSpan: 0, // Sẽ tính sau
                                        educationLevelRowSpan: 0, // Sẽ tính sau
                                        isUniversityStart: rows.length === 0,
                                        isOrganizationStart:
                                          rows.filter(
                                            (r) => r.organization?.id === org.id
                                          ).length === 0,
                                        isEducationLevelStart:
                                          rows.filter(
                                            (r) =>
                                              r.educationLevel?.id === level.id
                                          ).length === 0,
                                      });
                                    });
                                  }
                                });
                              }
                            });
                          }

                          // Tính rowSpan cho từng cấp độ
                          let currentUniversityRowSpan = rows.length;
                          let currentOrganizationRowSpan = 0;
                          let currentEducationLevelRowSpan = 0;

                          rows.forEach((row, index) => {
                            // Tính universityRowSpan
                            if (row.isUniversityStart) {
                              row.universityRowSpan = currentUniversityRowSpan;
                            }

                            // Tính organizationRowSpan
                            if (row.isOrganizationStart) {
                              if (row.organization) {
                                // Đếm số hàng cho organization này
                                currentOrganizationRowSpan = rows
                                  .slice(index)
                                  .filter(
                                    (r) =>
                                      r.organization?.id === row.organization.id
                                  ).length;
                              } else {
                                // Không có organization
                                currentOrganizationRowSpan = 1;
                              }
                              row.organizationRowSpan =
                                currentOrganizationRowSpan;
                            }

                            // Tính educationLevelRowSpan
                            if (row.isEducationLevelStart) {
                              if (row.educationLevel) {
                                // Đếm số hàng cho education level này
                                currentEducationLevelRowSpan = rows
                                  .slice(index)
                                  .filter(
                                    (r) =>
                                      r.educationLevel?.id ===
                                      row.educationLevel.id
                                  ).length;
                              } else {
                                // Không có education level
                                currentEducationLevelRowSpan = 1;
                              }
                              row.educationLevelRowSpan =
                                currentEducationLevelRowSpan;
                            }
                          });

                          return rows.map((row, index) => {
                            const cells = [];

                            // University Column
                            if (row.isUniversityStart) {
                              cells.push(
                                <td
                                  key="university"
                                  rowSpan={row.universityRowSpan}
                                  className="px-4 py-4 text-center border-r border-gray-200 dark:border-gray-600"
                                >
                                  <div className="font-medium text-gray-900 dark:text-white">
                                    {row.university.universityName}
                                  </div>
                                  <div className="text-sm text-gray-500 dark:text-gray-400">
                                    Mã: {row.university.universityCode}
                                  </div>
                                </td>
                              );
                            }

                            // Organization Column
                            if (row.isOrganizationStart) {
                              cells.push(
                                <td
                                  key="organization"
                                  rowSpan={row.organizationRowSpan}
                                  className="px-4 py-4 text-center border-r border-gray-200 dark:border-gray-600"
                                >
                                  {row.organization ? (
                                    <div>
                                      <div className="font-medium text-gray-900 dark:text-white">
                                        {row.organization.organizationName}
                                      </div>
                                      <div className="text-sm text-gray-500 dark:text-gray-400">
                                        {
                                          row.organization.educationLevels
                                            .length
                                        }{" "}
                                        chương trình đào tạo
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="text-gray-400 dark:text-gray-500 text-sm italic">
                                      Chưa có khoa/viện
                                    </div>
                                  )}
                                </td>
                              );
                            }

                            // Travel Time Column
                            if (row.isOrganizationStart) {
                              cells.push(
                                <td
                                  key="travelTime"
                                  rowSpan={row.organizationRowSpan}
                                  className="px-4 py-4 text-center border-r border-gray-200 dark:border-gray-600"
                                >
                                  {row.organization ? (
                                    <div className="text-sm text-gray-500 dark:text-gray-400">
                                      {row.organization.travelTime || 45} phút
                                    </div>
                                  ) : (
                                    <div className="text-gray-400 dark:text-gray-500 text-sm italic">
                                      Chưa có thời gian di chuyển
                                    </div>
                                  )}
                                </td>
                              );
                            }

                            // Education Level Column
                            if (row.isEducationLevelStart) {
                              cells.push(
                                <td
                                  key="educationLevel"
                                  rowSpan={row.educationLevelRowSpan}
                                  className="px-4 py-4 text-center border-r border-gray-200 dark:border-gray-600"
                                >
                                  {row.educationLevel ? (
                                    <div>
                                      <div className="font-medium text-gray-900 dark:text-white">
                                        {row.educationLevel.levelName}
                                      </div>
                                      <div className="text-sm text-gray-500 dark:text-gray-400">
                                        {row.educationLevel.classes.length} lớp
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="text-gray-400 dark:text-gray-500 text-sm italic">
                                      Chưa có chương trình đào tạo
                                    </div>
                                  )}
                                </td>
                              );
                            }

                            // Class Column - luôn hiển thị
                            cells.push(
                              <td
                                key="class"
                                className="px-4 py-4 text-center border-r border-gray-200 dark:border-gray-600"
                              >
                                {row.class ? (
                                  <div className="font-medium text-gray-900 dark:text-white">
                                    {row.class.className}
                                  </div>
                                ) : (
                                  <div className="text-gray-400 dark:text-gray-500 text-sm italic">
                                    Chưa có lớp
                                  </div>
                                )}
                              </td>
                            );

                            // Actions Column - chỉ hiển thị ở hàng đầu tiên của university
                            if (row.isUniversityStart) {
                              cells.push(
                                <td
                                  key="actions"
                                  rowSpan={row.universityRowSpan}
                                  className="px-4 py-4 text-center"
                                >
                                  <div className="flex justify-center items-center space-x-2">
                                    <Link
                                      href={`/admin/universities/${row.university.id}/organizations`}
                                      className="text-green-600 hover:text-green-900 p-2 rounded-lg hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors"
                                      title="Quản lý Khoa/Viện"
                                    >
                                      <BookOutlined className="text-lg" />
                                    </Link>
                                    <button
                                      onClick={() =>
                                        handleEditUniversity(row.university)
                                      }
                                      className="text-blue-600 hover:text-blue-900 p-2 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                                      title="Chỉnh sửa"
                                    >
                                      <EditOutlined className="text-lg" />
                                    </button>
                                    <button
                                      onClick={() =>
                                        handleDeleteUniversity(row.university)
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
                                key={`${row.university.id}-${index}`}
                                className="border-b border-gray-200 dark:border-gray-600"
                              >
                                {cells}
                              </tr>
                            );
                          });
                        })
                      ) : (
                        <tr>
                          <td
                            colSpan="6"
                            className="px-6 py-4 text-center text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-600"
                          >
                            <div className="flex flex-col items-center">
                              <BankOutlined className="text-4xl mb-2" />
                              <div>Chưa có dữ liệu trường đại học</div>
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
                Thêm Trường Đại Học
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
                  Mã trường *
                </label>
                <input
                  type="text"
                  value={addFormData.universityCode}
                  onChange={(e) =>
                    handleAddInputChange("universityCode", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Nhập mã trường"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Tên trường *
                </label>
                <input
                  type="text"
                  value={addFormData.universityName}
                  onChange={(e) =>
                    handleAddInputChange("universityName", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Nhập tên trường"
                  required
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
                Chỉnh sửa Trường Đại Học
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
                  Mã trường *
                </label>
                <input
                  type="text"
                  value={editFormData.universityCode}
                  onChange={(e) =>
                    handleEditInputChange("universityCode", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Nhập mã trường"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Tên trường *
                </label>
                <input
                  type="text"
                  value={editFormData.universityName}
                  onChange={(e) =>
                    handleEditInputChange("universityName", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Nhập tên trường"
                  required
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
                  Bạn có chắc chắn muốn xóa trường này?
                </p>
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-6">
              <div className="text-sm text-gray-600 dark:text-gray-300">
                <strong>Tên trường:</strong>{" "}
                {universityToDelete?.universityName}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-300">
                <strong>Mã trường:</strong> {universityToDelete?.universityCode}
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setUniversityToDelete(null);
                }}
                className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={confirmDeleteUniversity}
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
