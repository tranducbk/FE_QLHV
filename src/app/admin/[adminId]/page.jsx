"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import dayjs from "dayjs";
import Link from "next/link";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { handleNotify } from "../../../components/notify";
import Loader from "@/components/loader";
import { useLoading } from "@/hooks";

import { BASE_URL } from "@/configs";
const UserProfile = ({ params }) => {
  const [profile, setProfile] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    avatar:
      "https://i.pinimg.com/736x/d4/a1/ff/d4a1ff9d0f243e50062e2b21f2f2496d.jpg",
  });
  const { loading, withLoading } = useLoading(true);

  const openForm = () => {
    if (profile) {
      setFormData({
        commanderId: profile.commanderId || "",
        fullName: profile.fullName || "",
        phoneNumber: profile.phoneNumber || "",
        gender: profile.gender || "Nam",
        unit: profile.unit || "Hệ học viên 5",
        birthday: profile.birthday ? new Date(profile.birthday) : null,
        rank: profile.rank || "Đại úy",
        startWork: profile.startWork || null,
        positionGovernment: profile.positionGovernment || "Hệ trưởng",
        dateOfEnlistment: profile.dateOfEnlistment
          ? new Date(profile.dateOfEnlistment)
          : null,
        probationaryPartyMember: profile.probationaryPartyMember
          ? new Date(profile.probationaryPartyMember)
          : null,
        organization: profile.organization || "HVKHQS",
        fullPartyMember: profile.officialPartyMember
          ? new Date(profile.officialPartyMember)
          : null,
        positionParty: profile.positionParty || "Ủy viên",
        email: profile.email || "",
        hometown: profile.hometown || "",
        ethnicity: profile.ethnicity || "Kinh",
        religion: profile.religion || "Không",
        currentAddress: profile.currentAddress || "",
        placeOfBirth: profile.placeOfBirth || "",
        cccd: profile.cccd || "",
        partyCardNumber: profile.partyCardNumber || "",
        avatar:
          profile.avatar ||
          "https://i.pinimg.com/736x/d4/a1/ff/d4a1ff9d0f243e50062e2b21f2f2496d.jpg",
      });
    }
    setShowForm(true);
    document.body.style.overflow = "hidden";
  };

  const closeForm = () => {
    setShowForm(false);
    document.body.style.overflow = "unset";
  };

  const handleAuthenticationModalClick = (event) => {
    if (event.target.id === "authentication-modal") {
      setShowForm(false);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      await withLoading(fetchProfile);
    };
    loadData();
  }, [params.adminId, withLoading]);

  const fetchProfile = async () => {
    const token = localStorage.getItem("token");

    if (token) {
      try {
        const res = await axios.get(`${BASE_URL}/commander/${params.adminId}`, {
          headers: {
            token: `Bearer ${token}`,
          },
        });

        setProfile(res.data);
      } catch (error) {
        console.log(error);
      }
    }
  };

  const handleChange = (event) => {
    const { id, value } = event.target;

    // Xử lý startWork thành number
    if (id === "startWork") {
      setFormData({
        ...formData,
        [id]: value ? parseInt(value) : null,
      });
    } else {
      setFormData({
        ...formData,
        [id]: value,
      });
    }

    if (event.target.files) {
      const avatar = URL.createObjectURL(event.target.files[0]);
      console.log(avatar);
      setFormData({
        ...formData,
        avatar: avatar,
      });
    }
  };

  const handleSubmit = async (e, commanderId) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    try {
      const response = await axios.put(
        `${BASE_URL}/commander/${commanderId}`,
        formData,
        {
          headers: {
            token: `Bearer ${token}`,
          },
        }
      );
      handleNotify(
        "success",
        "Thành công!",
        "Cập nhật thông tin quân nhân thành công"
      );
      setProfile(response.data);
      setShowForm(false);
    } catch (error) {
      handleNotify("danger", "Lỗi!", error);
    }
  };

  const handleChangeDate = (id, date) => {
    setFormData({
      ...formData,
      [id]: date,
    });
  };

  if (loading) {
    return <Loader text="Đang tải thông tin quân nhân..." />;
  }

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
                      Thông tin quân nhân
                    </div>
                  </div>
                </li>
              </ol>
            </nav>
          </div>
          <div className="w-full pt-8 pb-5 pl-5 pr-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg">
              <div className="flex justify-between items-center font-bold p-5 border-b border-gray-200 dark:border-gray-700">
                <div className="text-gray-900 dark:text-white">
                  <h1 className="text-2xl font-bold">THÔNG TIN QUÂN NHÂN</h1>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Quản lý và xem thông tin quân nhân
                  </p>
                </div>
                <button
                  onClick={openForm}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-0.5 px-3 border border-blue-600 hover:border-blue-700 rounded-lg transition-colors duration-200 flex items-center gap-1.5 text-xs"
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
                      d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10"
                    />
                  </svg>
                  Cập nhật
                </button>
              </div>
              <div className="p-6">
                {profile ? (
                  <div className="flex space-x-8">
                    <div className="flex-shrink-0">
                      <div className="relative">
                        <img
                          className="rounded-full w-64 h-64 object-cover border-4 border-gray-200 dark:border-gray-600"
                          src={profile?.avatar}
                          alt="avatar"
                        />
                        <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
                          <div className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                            Mã QN: {profile?.commanderId}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-8">
                      <div className="space-y-4">
                        <h3 className="text-lg font-bold text-blue-600 dark:text-blue-400 border-b border-gray-200 dark:border-gray-600 pb-2">
                          THÔNG TIN CÁ NHÂN
                        </h3>
                        <div className="space-y-3">
                          <div className="flex justify-between">
                            <span className="font-semibold text-gray-700 dark:text-gray-300">
                              Họ và tên:
                            </span>
                            <span className="text-gray-900 dark:text-white">
                              {profile?.fullName}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="font-semibold text-gray-700 dark:text-gray-300">
                              Giới tính:
                            </span>
                            <span className="text-gray-900 dark:text-white">
                              {profile?.gender}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="font-semibold text-gray-700 dark:text-gray-300">
                              Sinh ngày:
                            </span>
                            <span className="text-gray-900 dark:text-white">
                              {profile?.birthday
                                ? dayjs(profile?.birthday).format("DD/MM/YYYY")
                                : ""}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="font-semibold text-gray-700 dark:text-gray-300">
                              Nơi sinh:
                            </span>
                            <span className="text-gray-900 dark:text-white">
                              {profile?.placeOfBirth}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="font-semibold text-gray-700 dark:text-gray-300">
                              Quê quán:
                            </span>
                            <span className="text-gray-900 dark:text-white">
                              {profile?.hometown}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="font-semibold text-gray-700 dark:text-gray-300">
                              Số CCCD:
                            </span>
                            <span className="text-gray-900 dark:text-white">
                              {profile?.cccd}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="font-semibold text-gray-700 dark:text-gray-300">
                              Dân tộc:
                            </span>
                            <span className="text-gray-900 dark:text-white">
                              {profile?.ethnicity}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="font-semibold text-gray-700 dark:text-gray-300">
                              Tôn giáo:
                            </span>
                            <span className="text-gray-900 dark:text-white">
                              {profile?.religion}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="font-semibold text-gray-700 dark:text-gray-300">
                              Nơi ở hiện nay:
                            </span>
                            <span className="text-gray-900 dark:text-white">
                              {profile?.currentAddress}
                            </span>
                          </div>

                          <div className="flex justify-between">
                            <span className="font-semibold text-gray-700 dark:text-gray-300">
                              Số điện thoại:
                            </span>
                            <span className="text-gray-900 dark:text-white">
                              {profile?.phoneNumber}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <h3 className="text-lg font-bold text-blue-600 dark:text-blue-400 border-b border-gray-200 dark:border-gray-600 pb-2">
                          THÔNG TIN QUÂN NHÂN
                        </h3>
                        <div className="space-y-3">
                          <div className="flex justify-between">
                            <span className="font-semibold text-gray-700 dark:text-gray-300">
                              Đơn vị:
                            </span>
                            <span className="text-gray-900 dark:text-white">
                              {profile?.unit}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="font-semibold text-gray-700 dark:text-gray-300">
                              Năm vào Hệ:
                            </span>
                            <span className="text-gray-900 dark:text-white">
                              {profile?.startWork}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="font-semibold text-gray-700 dark:text-gray-300">
                              Cấp bậc:
                            </span>
                            <span className="text-gray-900 dark:text-white">
                              {profile?.rank}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="font-semibold text-gray-700 dark:text-gray-300">
                              Chức vụ:
                            </span>
                            <span className="text-gray-900 dark:text-white">
                              {profile?.positionGovernment}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="font-semibold text-gray-700 dark:text-gray-300">
                              Nhập ngũ:
                            </span>
                            <span className="text-gray-900 dark:text-white">
                              {profile?.dateOfEnlistment
                                ? dayjs(profile?.dateOfEnlistment).format(
                                    "DD/MM/YYYY"
                                  )
                                : ""}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="font-semibold text-gray-700 dark:text-gray-300">
                              Đảng viên dự bị:
                            </span>
                            <span className="text-gray-900 dark:text-white">
                              {profile?.probationaryPartyMember
                                ? dayjs(
                                    profile?.probationaryPartyMember
                                  ).format("DD/MM/YYYY")
                                : ""}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="font-semibold text-gray-700 dark:text-gray-300">
                              Đảng viên chính thức:
                            </span>
                            <span className="text-gray-900 dark:text-white">
                              {profile?.officialPartyMember
                                ? dayjs(profile?.officialPartyMember).format(
                                    "DD/MM/YYYY"
                                  )
                                : ""}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="font-semibold text-gray-700 dark:text-gray-300">
                              Chức vụ đảng:
                            </span>
                            <span className="text-gray-900 dark:text-white">
                              {profile?.positionParty}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="font-semibold text-gray-700 dark:text-gray-300">
                              Số thẻ Đảng viên:
                            </span>
                            <span className="text-gray-900 dark:text-white">
                              {profile?.partyCardNumber}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="font-semibold text-gray-700 dark:text-gray-300">
                              Phòng/Ban quản lý:
                            </span>
                            <span className="text-gray-900 dark:text-white">
                              {profile?.organization}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center py-12">
                    <div className="text-center">
                      <svg
                        className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                        />
                      </svg>
                      <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                        Không có thông tin
                      </h3>
                      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        Không tìm thấy thông tin quân nhân
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        {showForm && (
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4 mt-14">
            <div className="bg-black bg-opacity-50 inset-0 fixed"></div>
            <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
              <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  CẬP NHẬT THÔNG TIN QUÂN NHÂN
                </h3>
                <button
                  type="button"
                  onClick={closeForm}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <svg
                    className="w-6 h-6"
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
              <div className="overflow-y-auto max-h-[calc(85vh-80px)]">
                <div className="w-full max-w-4xl p-6">
                  <div className="w-full">
                    <form onSubmit={(e) => handleSubmit(e, profile?.id)}>
                      <div className="grid gap-6 mb-6 md:grid-cols-2">
                        <div>
                          <label
                            htmlFor="commanderId"
                            className="block mb-2 text-sm font-medium dark:text-white"
                          >
                            Mã quân nhân
                          </label>
                          <input
                            type="text"
                            id="commanderId"
                            value={formData.commanderId}
                            onChange={handleChange}
                            className="bg-gray-50 border border-gray-300 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                            placeholder="vd: 00000000"
                          />
                        </div>

                        <div>
                          <label
                            htmlFor="fullName"
                            className="block mb-2 text-sm font-medium dark:text-white"
                          >
                            Họ và tên
                          </label>
                          <input
                            type="text"
                            id="fullName"
                            value={formData.fullName}
                            onChange={handleChange}
                            className="bg-gray-50 border border-gray-300 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                            placeholder="vd: Nguyễn Văn X"
                          />
                        </div>

                        <div>
                          <label
                            htmlFor="phoneNumber"
                            className="block mb-2 text-sm font-medium dark:text-white"
                          >
                            Số điện thoại
                          </label>
                          <input
                            type="tel"
                            id="phoneNumber"
                            value={formData.phoneNumber}
                            onChange={handleChange}
                            className="bg-gray-50 border border-gray-300 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                            placeholder="vd: 0123456789"
                          />
                        </div>

                        <div>
                          <label
                            htmlFor="cccd"
                            className="block mb-2 text-sm font-medium dark:text-white"
                          >
                            Số CCCD
                          </label>
                          <input
                            type="text"
                            id="cccd"
                            value={formData.cccd}
                            onChange={handleChange}
                            className="bg-gray-50 border border-gray-300 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                            placeholder="vd: 123456789012"
                          />
                        </div>

                        <div>
                          <label
                            htmlFor="gender"
                            className="block mb-2 text-sm font-medium dark:text-white"
                          >
                            Giới tính
                          </label>
                          <select
                            id="gender"
                            value={formData.gender}
                            onChange={handleChange}
                            className="bg-gray-50 border border-gray-300 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 pr-10 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                          >
                            <option value="Nam">Nam</option>
                            <option value="Nữ">Nữ</option>
                          </select>
                        </div>

                        <div>
                          <label
                            htmlFor="unit"
                            className="block mb-2 text-sm font-medium dark:text-white"
                          >
                            Đơn vị
                          </label>
                          <input
                            type="text"
                            id="unit"
                            value={formData.unit}
                            onChange={handleChange}
                            className="bg-gray-50 border border-gray-300 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                            placeholder="vd: Hệ học viên 5"
                          />
                        </div>

                        <div>
                          <label
                            htmlFor="birthday"
                            className="block mb-2 text-sm font-medium dark:text-white"
                          >
                            Sinh ngày
                          </label>
                          <DatePicker
                            id="birthday"
                            selected={formData.birthday}
                            onChange={(date) =>
                              handleChangeDate("birthday", date)
                            }
                            dateFormat="dd/MM/yyyy"
                            className="bg-gray-50 border w-full border-gray-300 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                            placeholderText="Ngày/Tháng/Năm"
                            wrapperClassName="w-full"
                          />
                        </div>

                        <div>
                          <label
                            htmlFor="placeOfBirth"
                            className="block mb-2 text-sm font-medium dark:text-white"
                          >
                            Nơi sinh
                          </label>
                          <input
                            type="text"
                            id="placeOfBirth"
                            value={formData.placeOfBirth}
                            onChange={handleChange}
                            className="bg-gray-50 border border-gray-300 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                            placeholder="vd: Hà Nội"
                          />
                        </div>

                        <div>
                          <label
                            htmlFor="rank"
                            className="block mb-2 text-sm font-medium dark:text-white"
                          >
                            Cấp bậc
                          </label>
                          <select
                            id="rank"
                            value={formData.rank}
                            onChange={handleChange}
                            className="bg-gray-50 border border-gray-300 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                          >
                            <option value="Thượng úy">Thượng úy</option>
                            <option value="Đại úy">Đại úy</option>
                            <option value="Thiếu tá">Thiếu tá</option>
                            <option value="Trung tá">Trung tá</option>
                            <option value="Thượng tá">Thượng tá</option>
                            <option value="Đại tá">Đại tá</option>
                          </select>
                        </div>

                        <div>
                          <label
                            htmlFor="startWork"
                            className="block mb-2 text-sm font-medium dark:text-white"
                          >
                            Năm vào hệ
                          </label>
                          <input
                            type="number"
                            id="startWork"
                            value={formData.startWork}
                            onChange={handleChange}
                            aria-describedby="helper-text-explanation"
                            className="bg-gray-50 border border-gray-300 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                            placeholder="2010"
                            min="2010"
                          />
                        </div>

                        <div>
                          <label
                            htmlFor="positionGovernment"
                            className="block mb-2 text-sm font-medium dark:text-white"
                          >
                            Chức vụ
                          </label>
                          <select
                            id="positionGovernment"
                            value={formData.positionGovernment}
                            onChange={handleChange}
                            className="bg-gray-50 border border-gray-300 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 pr-10 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                          >
                            <option value="Hệ trưởng">Hệ trưởng</option>
                            <option value="Hệ phó">Hệ phó</option>
                            <option value="Chính trị viên">
                              Chính trị viên
                            </option>
                          </select>
                        </div>

                        <div>
                          <label
                            htmlFor="dateOfEnlistment"
                            className="block mb-2 text-sm font-medium dark:text-white"
                          >
                            Nhập ngũ
                          </label>
                          <DatePicker
                            id="dateOfEnlistment"
                            selected={formData.dateOfEnlistment}
                            onChange={(date) =>
                              handleChangeDate("dateOfEnlistment", date)
                            }
                            dateFormat="dd/MM/yyyy"
                            className="bg-gray-50 border w-full border-gray-300 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                            placeholderText="Ngày/Tháng/Năm"
                            wrapperClassName="w-full"
                          />
                        </div>

                        <div>
                          <label
                            htmlFor="probationaryPartyMember"
                            className="block mb-2 text-sm font-medium dark:text-white"
                          >
                            Đảng viên dự bị
                          </label>
                          <DatePicker
                            id="probationaryPartyMember"
                            selected={formData.probationaryPartyMember}
                            onChange={(date) =>
                              handleChangeDate("probationaryPartyMember", date)
                            }
                            dateFormat="dd/MM/yyyy"
                            className="bg-gray-50 border w-full border-gray-300 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                            placeholderText="Ngày/Tháng/Năm"
                            wrapperClassName="w-full"
                          />
                        </div>

                        <div>
                          <label
                            htmlFor="organization"
                            className="block mb-2 text-sm font-medium dark:text-white"
                          >
                            Phòng/ban quản lý
                          </label>
                          <input
                            type="text"
                            id="organization"
                            value={formData.organization}
                            onChange={handleChange}
                            className="bg-gray-50 border border-gray-300 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                            placeholder="vd: HVKHQS"
                          />
                        </div>

                        <div>
                          <label
                            htmlFor="fullPartyMember"
                            className="block mb-2 text-sm font-medium dark:text-white"
                          >
                            Đảng viên chính thức
                          </label>
                          <DatePicker
                            id="fullPartyMember"
                            selected={formData.fullPartyMember}
                            onChange={(date) =>
                              handleChangeDate("fullPartyMember", date)
                            }
                            dateFormat="dd/MM/yyyy"
                            className="bg-gray-50 border w-full border-gray-300 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                            placeholderText="Ngày/Tháng/Năm"
                            wrapperClassName="w-full"
                          />
                        </div>

                        <div>
                          <label
                            htmlFor="positionParty"
                            className="block mb-2 text-sm font-medium dark:text-white"
                          >
                            Chức vụ đảng
                          </label>
                          <select
                            id="positionParty"
                            value={formData.positionParty}
                            onChange={handleChange}
                            className="bg-gray-50 border border-gray-300 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 pr-10 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                          >
                            <option value="Ủy viên">Ủy viên</option>
                            <option value="Phó bí thư chi bộ">
                              Phó bí thư chi bộ
                            </option>
                            <option value="Bí thư chi bộ">Bí thư chi bộ</option>
                          </select>
                        </div>

                        <div>
                          <label
                            htmlFor="partyCardNumber"
                            className="block mb-2 text-sm font-medium dark:text-white"
                          >
                            Số thẻ Đảng viên
                          </label>
                          <input
                            type="text"
                            id="partyCardNumber"
                            value={formData.partyCardNumber}
                            onChange={handleChange}
                            className="bg-gray-50 border border-gray-300 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                            placeholder="vd: 123456789"
                          />
                        </div>

                        <div>
                          <label
                            htmlFor="hometown"
                            className="block mb-2 text-sm font-medium dark:text-white"
                          >
                            Quê quán
                          </label>
                          <input
                            type="text"
                            id="hometown"
                            value={formData.hometown}
                            onChange={handleChange}
                            className="bg-gray-50 border border-gray-300 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                            placeholder="vd: Hà Nội"
                          />
                        </div>

                        <div>
                          <label
                            htmlFor="ethnicity"
                            className="block mb-2 text-sm font-medium dark:text-white"
                          >
                            Dân tộc
                          </label>
                          <input
                            type="text"
                            id="ethnicity"
                            value={formData.ethnicity}
                            onChange={handleChange}
                            className="bg-gray-50 border border-gray-300 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                            placeholder="vd: Kinh"
                          />
                        </div>

                        <div>
                          <label
                            htmlFor="religion"
                            className="block mb-2 text-sm font-medium dark:text-white"
                          >
                            Tôn giáo
                          </label>
                          <input
                            type="text"
                            id="religion"
                            value={formData.religion}
                            onChange={handleChange}
                            className="bg-gray-50 border border-gray-300 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                            placeholder="vd: Không"
                          />
                        </div>

                        <div>
                          <label
                            htmlFor="currentAddress"
                            className="block mb-2 text-sm font-medium dark:text-white"
                          >
                            Nơi ở hiện nay
                          </label>
                          <input
                            type="text"
                            id="currentAddress"
                            value={formData.currentAddress}
                            onChange={handleChange}
                            className="bg-gray-50 border border-gray-300 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                            placeholder="vd: Hà Nội"
                          />
                        </div>

                        <div>
                          <label className="block mb-2 text-sm font-medium dark:text-white">
                            Thêm ảnh đại diện
                          </label>
                          <input
                            className="bg-gray-50 border border-gray-300 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                            type="url"
                            id="avatar"
                            value={formData.avatar}
                            onChange={handleChange}
                            placeholder="Nhập URL ảnh đại diện"
                          />
                        </div>
                      </div>

                      <div className="flex justify-end space-x-3">
                        <button
                          type="button"
                          onClick={closeForm}
                          className="px-4 py-2 bg-gray-200 text-gray-500 rounded-lg hover:bg-gray-300 hover:text-gray-900 mr-2"
                        >
                          Hủy
                        </button>
                        <button
                          type="submit"
                          className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm w-full sm:w-auto px-5 py-2.5 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
                        >
                          Cập nhật
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default UserProfile;
