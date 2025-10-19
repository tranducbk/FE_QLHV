"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import dayjs from "dayjs";
import Link from "next/link";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import SideBar from "../../../components/sidebar";
import { handleNotify } from "../../../components/notify";
import Loader from "@/components/loader";
import { useLoading } from "@/hooks";
import { BASE_URL } from "@/configs";

const UserProfile = ({ params }) => {
  const [profile, setProfile] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const { loading, withLoading } = useLoading(true);
  // State cho cascading dropdowns
  const [universities, setUniversities] = useState([]);
  const [selectedUniversity, setSelectedUniversity] = useState(null);
  const [organizations, setOrganizations] = useState([]);
  const [selectedOrganization, setSelectedOrganization] = useState("");
  const [educationLevels, setEducationLevels] = useState([]);
  const [selectedLevel, setSelectedLevel] = useState("");
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState("");

  // State cho thông tin gia đình
  const [familyMembers, setFamilyMembers] = useState([]);
  const [familyFormData, setFamilyFormData] = useState({
    relationship: "",
    fullName: "",
    birthday: null,
    occupation: "",
  });
  // State để điều khiển hiển thị form
  const [showFamilyForm, setShowFamilyForm] = useState(false);
  const [showForeignForm, setShowForeignForm] = useState(false);

  // State cho yếu tố nước ngoài
  const [foreignRelations, setForeignRelations] = useState([]);
  const [foreignFormData, setForeignFormData] = useState({
    relationship: "",
    fullName: "",
    birthday: null,
    country: "",
    reason: "",
    nationality: "",
  });

  const [formData, setFormData] = useState({
    educationLevel: "Đại học đại trà",
    organization: "Viện ngoại ngữ",
    university: "Đại học Bách Khoa Hà Nội",
    positionGovernment: "Học viên",
    positionParty: "Không",
    ethnicity: "",
    religion: "",
    currentAddress: "",
    avatar:
      "https://i.pinimg.com/736x/81/09/3a/81093a0429e25b0ff579fa41aa96c421.jpg",
  });

  // Fetch functions cho cascading dropdowns
  const fetchUniversities = async () => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const res = await axios.get(`${BASE_URL}/university`, {
          headers: { token: `Bearer ${token}` },
        });
        setUniversities(res.data);
      } catch (error) {
        console.log(error);
      }
    }
  };

  const fetchOrganizations = async (universityId) => {
    const token = localStorage.getItem("token");
    if (token && universityId) {
      try {
        const res = await axios.get(
          `${BASE_URL}/university/${universityId}/organizations`,
          {
            headers: { token: `Bearer ${token}` },
          }
        );
        return res.data;
      } catch (error) {
        console.log(error);
        return [];
      }
    }
    return [];
  };

  const fetchEducationLevels = async (organizationId) => {
    const token = localStorage.getItem("token");
    if (token && organizationId) {
      try {
        const res = await axios.get(
          `${BASE_URL}/university/organizations/${organizationId}/education-levels`,
          {
            headers: { token: `Bearer ${token}` },
          }
        );
        return res.data;
      } catch (error) {
        console.log(error);
        return [];
      }
    }
    return [];
  };

  const fetchClasses = async (educationLevelId) => {
    const token = localStorage.getItem("token");
    if (token && educationLevelId) {
      try {
        const res = await axios.get(
          `${BASE_URL}/university/education-levels/${educationLevelId}/classes`,
          {
            headers: { token: `Bearer ${token}` },
          }
        );
        return res.data;
      } catch (error) {
        console.log(error);
        return [];
      }
    }
    return [];
  };

  const openForm = async () => {
    // Đảm bảo universities đã được load
    if (universities.length === 0) {
      await fetchUniversities();
    }

    if (profile) {
      setFormData({
        studentId: profile.studentId || "",
        fullName: profile.fullName || "",
        phoneNumber: profile.phoneNumber || "",
        gender: profile.gender || "Nam",
        unit: profile.unit || "L1 - H5",
        birthday: profile.birthday ? new Date(profile.birthday) : null,
        rank: profile.rank || "Binh nhì",
        enrollment: profile.enrollment || "",
        graduationDate: profile.graduationDate
          ? new Date(profile.graduationDate)
          : null,
        positionGovernment: profile.positionGovernment || "Học viên",
        dateOfEnlistment: profile.dateOfEnlistment
          ? new Date(profile.dateOfEnlistment)
          : null,
        classUniversity: profile.classUniversity || "",
        probationaryPartyMember: profile.probationaryPartyMember
          ? new Date(profile.probationaryPartyMember)
          : null,
        organization: profile.organization?.id || profile.organization || "",
        fullPartyMember: profile.fullPartyMember
          ? new Date(profile.fullPartyMember)
          : null,
        university: profile.university?.id || profile.university || "",
        positionParty: profile.positionParty || "Không",
        email: profile.email || "",
        cccdNumber: profile.cccdNumber || "",
        placeOfBirth: profile.placeOfBirth || "",
        partyMemberCardNumber: profile.partyMemberCardNumber || "",
        hometown: profile.hometown || "",
        ethnicity: profile.ethnicity || "",
        religion: profile.religion || "",
        currentAddress: profile.currentAddress || "",
        educationLevel:
          profile.educationLevel?.id || profile.educationLevel || "",
        avatar:
          profile.avatar ||
          "https://i.pinimg.com/736x/81/09/3a/81093a0429e25b0ff579fa41aa96c421.jpg",
      });

      // Khởi tạo các select động từ dữ liệu đã populate
      let foundUniversity = null;

      // Sử dụng dữ liệu đã populate từ API - giống logic admin
      if (profile.university && typeof profile.university === "object") {
        // Nếu university là object (populated), sử dụng university object trực tiếp
        foundUniversity = profile.university;
      } else if (profile.university && typeof profile.university === "string") {
        if (profile.university.length === 24) {
          // Nếu là ObjectId string, tìm university object
          foundUniversity = universities.find(
            (u) => u.id === profile.university
          );
        } else {
          // Nếu là university name, tìm university object
          foundUniversity = universities.find(
            (u) => u.universityName === profile.university
          );
        }
      }

      if (foundUniversity) {
        setSelectedUniversity(foundUniversity);

        // Gọi API để load organizations, education levels, và classes
        try {
          // Load organizations
          const organizations = await fetchOrganizations(foundUniversity.id);
          setOrganizations(organizations);

          // Tìm organization đã chọn - giống logic admin
          let selectedOrgId = null;

          if (
            profile.organization &&
            typeof profile.organization === "object"
          ) {
            selectedOrgId = profile.organization.id;
          } else if (
            profile.organization &&
            typeof profile.organization === "string"
          ) {
            if (profile.organization.length === 24) {
              selectedOrgId = profile.organization;
            } else {
              // Nếu là organization name, tìm organization object
              const selectedOrg = organizations.find(
                (org) => org.organizationName === profile.organization
              );
              selectedOrgId = selectedOrg?.id;
            }
          }

          if (selectedOrgId) {
            setSelectedOrganization(selectedOrgId);

            // Load education levels
            const educationLevels = await fetchEducationLevels(selectedOrgId);
            setEducationLevels(educationLevels);

            // Tìm education level đã chọn - giống logic admin
            let selectedLevelId = null;

            if (
              profile.educationLevel &&
              typeof profile.educationLevel === "object"
            ) {
              selectedLevelId = profile.educationLevel.id;
            } else if (
              profile.educationLevel &&
              typeof profile.educationLevel === "string"
            ) {
              if (profile.educationLevel.length === 24) {
                selectedLevelId = profile.educationLevel;
              } else {
                // Nếu là level name, tìm level object
                const selectedLevelObj = educationLevels.find(
                  (level) => level.levelName === profile.educationLevel
                );
                selectedLevelId = selectedLevelObj?.id;
              }
            } else if (profile.educationLevelId) {
              // Fallback to educationLevelId field
              selectedLevelId = profile.educationLevelId;
            }

            if (selectedLevelId) {
              setSelectedLevel(selectedLevelId);

              // Load classes
              const classes = await fetchClasses(selectedLevelId);
              setClasses(classes);

              // Tìm class đã chọn - giống logic admin
              let selectedClassId = null;

              if (profile.class && typeof profile.class === "object") {
                selectedClassId = profile.class.id;
              } else if (profile.class && typeof profile.class === "string") {
                if (profile.class.length === 24) {
                  selectedClassId = profile.class;
                } else {
                  // Nếu là class name, tìm class object
                  const selectedClassObj = classes.find(
                    (cls) => cls.className === profile.class
                  );
                  selectedClassId = selectedClassObj?.id;
                }
              } else if (profile.classId) {
                // Fallback to classId field
                selectedClassId = profile.classId;
              } else if (
                profile.classUniversity &&
                typeof profile.classUniversity === "string"
              ) {
                // Fallback to classUniversity field
                if (profile.classUniversity.length === 24) {
                  selectedClassId = profile.classUniversity;
                } else {
                  const selectedClassObj = classes.find(
                    (cls) => cls.className === profile.classUniversity
                  );
                  selectedClassId = selectedClassObj?.id;
                }
              }

              if (selectedClassId) {
                setSelectedClass(selectedClassId);
              }
            }
          }
        } catch (error) {
          console.error("Error loading cascading data:", error);
        }
      }
    }

    // Load existing family members and foreign relations
    if (profile.familyMembers && Array.isArray(profile.familyMembers)) {
      const formattedFamilyMembers = profile.familyMembers.map(
        (member, index) => ({
          id: member.id || `temp-${Date.now()}-${index}`,
          relationship: member.relationship || "",
          fullName: member.fullName || "",
          birthday: member.birthday ? new Date(member.birthday) : null,
          occupation: member.occupation || "",
        })
      );
      setFamilyMembers(formattedFamilyMembers);
    } else {
      setFamilyMembers([]);
    }

    if (profile.foreignRelations && Array.isArray(profile.foreignRelations)) {
      const formattedForeignRelations = profile.foreignRelations.map(
        (relation, index) => ({
          id: relation.id || `temp-${Date.now()}-${index}`,
          relationship: relation.relationship || "",
          fullName: relation.fullName || "",
          birthday: relation.birthday ? new Date(relation.birthday) : null,
          country: relation.country || "",
          reason: relation.reason || "",
          nationality: relation.nationality || "",
        })
      );
      setForeignRelations(formattedForeignRelations);
    } else {
      setForeignRelations([]);
    }

    setShowForm(true);
    document.body.style.overflow = "hidden";
  };

  const closeForm = () => {
    setShowForm(false);
    document.body.style.overflow = "unset";
    // Reset các state khi đóng form
    setSelectedUniversity(null);
    setSelectedOrganization("");
    setSelectedLevel("");
    setSelectedClass("");
    setOrganizations([]);
    setEducationLevels([]);
    setClasses([]);
    // Reset form data về giá trị ban đầu
    setFormData({
      educationLevel: "Đại học đại trà",
      organization: "Viện ngoại ngữ",
      university: "Đại học Bách Khoa Hà Nội",
      positionGovernment: "Học viên",
      positionParty: "Không",
      currentAddress: "",
      avatar:
        "https://i.pinimg.com/736x/81/09/3a/81093a0429e25b0ff579fa41aa96c421.jpg",
    });
    // Reset thông tin gia đình và yếu tố nước ngoài
    setFamilyMembers([]);
    setForeignRelations([]);
    setFamilyFormData({
      relationship: "",
      fullName: "",
      birthday: null,
      occupation: "",
    });
    setForeignFormData({
      relationship: "",
      fullName: "",
      birthday: null,
      country: "",
      reason: "",
      nationality: "",
    });
    // Reset state hiển thị form
    setShowFamilyForm(false);
    setShowForeignForm(false);
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
  }, [withLoading]);

  const fetchProfile = async () => {
    const token = localStorage.getItem("token");

    if (token) {
      try {
        const res = await axios.get(`${BASE_URL}/student/${params.userId}`, {
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
    setFormData({
      ...formData,
      [event.target.id]: event.target.value,
    });

    if (event.target.files) {
      const avatar = URL.createObjectURL(event.target.files[0]);
      setFormData({
        ...formData,
        avatar: avatar,
      });
    }
  };

  const handleSubmit = async (e, studentId) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    try {
      const submitData = {
        ...formData,
        avatar:
          formData.avatar?.trim() ||
          "https://i.pinimg.com/736x/81/09/3a/81093a0429e25b0ff579fa41aa96c421.jpg", // Sử dụng ảnh mặc định nếu để trống
        university: selectedUniversity?.id, // Sử dụng ObjectId của university đã chọn
        organization: selectedOrganization, // Tên khoa/viện đã chọn
        educationLevel: selectedLevel, // Trình độ đã chọn
        class: selectedClass?.id || selectedClass, // Lớp đã chọn - gửi ObjectId
        familyMembers: familyMembers.map((member) => ({
          relationship: member.relationship,
          fullName: member.fullName,
          birthday: member.birthday,
          occupation: member.occupation,
        })),
        foreignRelations: foreignRelations.map((relation) => ({
          relationship: relation.relationship,
          fullName: relation.fullName,
          birthday: relation.birthday,
          country: relation.country,
          reason: relation.reason,
          nationality: relation.nationality,
        })),
      };

      const response = await axios.put(
        `${BASE_URL}/student/${studentId}`,
        submitData,
        {
          headers: {
            token: `Bearer ${token}`,
          },
        }
      );
      handleNotify(
        "success",
        "Thành công!",
        "Chỉnh sửa thông tin cá nhân thành công"
      );
      setProfile(response.data);
      setShowForm(false);
      document.body.style.overflow = "unset";
    } catch (error) {
      handleNotify("danger", "Lỗi!", error.response.data);
      document.body.style.overflow = "unset";
    }
  };

  const handleChangeDate = (id, date) => {
    setFormData({
      ...formData,
      [id]: date,
    });
  };

  // Hàm xử lý thông tin gia đình
  const handleFamilyChange = (event) => {
    setFamilyFormData({
      ...familyFormData,
      [event.target.name]: event.target.value,
    });
  };

  const handleFamilyDateChange = (id, date) => {
    setFamilyFormData({
      ...familyFormData,
      [id]: date,
    });
  };

  const addFamilyMember = () => {
    // Kiểm tra các trường bắt buộc (trừ birthday có thể null)
    if (
      familyFormData.relationship &&
      familyFormData.fullName &&
      familyFormData.occupation
    ) {
      const newMember = { ...familyFormData, id: Date.now() };

      setFamilyMembers([...familyMembers, newMember]);

      // Reset form data
      setFamilyFormData({
        relationship: "",
        fullName: "",
        birthday: null,
        occupation: "",
      });
    }
  };

  const removeFamilyMember = (id) => {
    setFamilyMembers(familyMembers.filter((member) => member.id !== id));
  };

  // Hàm xử lý yếu tố nước ngoài
  const handleForeignChange = (event) => {
    setForeignFormData({
      ...foreignFormData,
      [event.target.name]: event.target.value,
    });
  };

  const handleForeignDateChange = (id, date) => {
    setForeignFormData({
      ...foreignFormData,
      [id]: date,
    });
  };

  const addForeignRelation = () => {
    // Kiểm tra các trường bắt buộc (trừ birthday có thể null)
    if (
      foreignFormData.relationship &&
      foreignFormData.fullName &&
      foreignFormData.country &&
      foreignFormData.reason &&
      foreignFormData.nationality
    ) {
      const newRelation = { ...foreignFormData, id: Date.now() };

      setForeignRelations([...foreignRelations, newRelation]);

      // Reset form data
      setForeignFormData({
        relationship: "",
        fullName: "",
        birthday: null,
        country: "",
        reason: "",
        nationality: "",
      });
    }
  };

  const removeForeignRelation = (id) => {
    setForeignRelations(
      foreignRelations.filter((relation) => relation.id !== id)
    );
  };

  if (loading) {
    return (
      <Loader
        text="Đang tải thông tin học viên..."
        overlay={true}
        className="z-[9999]"
      />
    );
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
                      Thông tin học viên
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
                  <h1 className="text-2xl font-bold">THÔNG TIN HỌC VIÊN</h1>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Quản lý và xem thông tin học viên
                  </p>
                </div>
                <button
                  onClick={openForm}
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
                          className="rounded-full w-72 h-72 object-cover border-4 border-gray-200 dark:border-gray-600"
                          src={profile?.avatar}
                          alt="avatar"
                        />
                        <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
                          <div className="bg-blue-600 max-w-56 text-center text-white px-3 py-1 rounded-full text-sm font-medium">
                            Mã HV: {profile?.studentId}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-8">
                      <div className="space-y-4">
                        <h3 className="text-lg font-bold text-blue-600 dark:text-blue-400 border-b-2 border-blue-200 dark:border-blue-600 pb-2 mb-4 flex items-center">
                          <svg
                            className="w-5 h-5 mr-2"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                              clipRule="evenodd"
                            />
                          </svg>
                          THÔNG TIN CÁ NHÂN
                        </h3>
                        <div className="space-y-3">
                          <div className="flex justify-between">
                            <span className="font-semibold text-gray-700 dark:text-gray-300">
                              Họ và tên:
                            </span>
                            <span className="text-gray-900 dark:text-white">
                              {profile?.fullName || "Chưa có dữ liệu"}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="font-semibold text-gray-700 dark:text-gray-300">
                              Giới tính:
                            </span>
                            <span className="text-gray-900 dark:text-white">
                              {profile?.gender || "Chưa có dữ liệu"}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="font-semibold text-gray-700 dark:text-gray-300">
                              Sinh ngày:
                            </span>
                            <span className="text-gray-900 dark:text-white">
                              {profile?.birthday
                                ? dayjs(profile?.birthday).format("DD/MM/YYYY")
                                : "Chưa có dữ liệu"}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="font-semibold text-gray-700 dark:text-gray-300">
                              CCCD:
                            </span>
                            <span className="text-gray-900 dark:text-white">
                              {profile?.cccdNumber || "Chưa có dữ liệu"}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="font-semibold text-gray-700 dark:text-gray-300">
                              Số điện thoại:
                            </span>
                            <span className="text-gray-900 dark:text-white">
                              {profile?.phoneNumber || "Chưa có dữ liệu"}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="font-semibold text-gray-700 dark:text-gray-300">
                              Email:
                            </span>
                            <span className="text-gray-900 dark:text-white">
                              {profile?.email || "Chưa có dữ liệu"}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="font-semibold text-gray-700 dark:text-gray-300">
                              Nơi sinh:
                            </span>
                            <span className="text-gray-900 dark:text-white">
                              {profile?.placeOfBirth || "Chưa có dữ liệu"}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="font-semibold text-gray-700 dark:text-gray-300">
                              Ngày ra trường:
                            </span>
                            <span className="text-gray-900 dark:text-white">
                              {profile?.graduationDate
                                ? dayjs(profile?.graduationDate).format(
                                    "DD/MM/YYYY"
                                  )
                                : "Chưa có dữ liệu"}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="font-semibold text-gray-700 dark:text-gray-300">
                              Trường:
                            </span>
                            <span className="text-gray-900 dark:text-white">
                              {profile?.university?.universityName ||
                                profile?.university ||
                                "Chưa có dữ liệu"}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="font-semibold text-gray-700 dark:text-gray-300">
                              Khoa/Viện quản lý:
                            </span>
                            <span className="text-gray-900 dark:text-white">
                              {profile?.organization?.organizationName ||
                                profile?.organization ||
                                "Chưa có dữ liệu"}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="font-semibold text-gray-700 dark:text-gray-300">
                              Trình độ đào tạo:
                            </span>
                            <span className="text-gray-900 dark:text-white">
                              {profile?.educationLevel?.levelName ||
                                profile?.educationLevel ||
                                "Chưa có dữ liệu"}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="font-semibold text-gray-700 dark:text-gray-300">
                              Lớp:
                            </span>
                            <span className="text-gray-900 dark:text-white">
                              {profile?.class?.className ||
                                profile?.classUniversity ||
                                "Chưa có dữ liệu"}
                            </span>
                          </div>
                          {/* Ẩn Email theo yêu cầu */}
                        </div>
                      </div>
                      <div className="space-y-4">
                        <h3 className="text-lg font-bold text-blue-600 dark:text-blue-400 border-b-2 border-blue-200 dark:border-blue-600 pb-2 mb-4 flex items-center">
                          <svg
                            className="w-5 h-5 mr-2"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M5 4a3 3 0 00-3 3v6a3 3 0 003 3h10a3 3 0 003-3V7a3 3 0 00-3-3H5zm-1 9v-1h5v2H5a1 1 0 01-1-1zm7 1h4a1 1 0 001-1v-1h-5v2zm0-4h5V8h-5v2zM9 8H4v2h5V8z"
                              clipRule="evenodd"
                            />
                          </svg>
                          THÔNG TIN QUÂN NHÂN
                        </h3>
                        <div className="space-y-3">
                          <div className="flex justify-between">
                            <span className="font-semibold text-gray-700 dark:text-gray-300">
                              Đơn vị:
                            </span>
                            <span className="text-gray-900 dark:text-white">
                              {profile?.unit || "Chưa có dữ liệu"}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="font-semibold text-gray-700 dark:text-gray-300">
                              Cấp bậc:
                            </span>
                            <span className="text-gray-900 dark:text-white">
                              {profile?.rank || "Chưa có dữ liệu"}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="font-semibold text-gray-700 dark:text-gray-300">
                              Chức vụ:
                            </span>
                            <span className="text-gray-900 dark:text-white">
                              {profile?.positionGovernment || "Chưa có dữ liệu"}
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
                                : "Chưa có dữ liệu"}
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
                                : "Không"}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="font-semibold text-gray-700 dark:text-gray-300">
                              Đảng viên chính thức:
                            </span>
                            <span className="text-gray-900 dark:text-white">
                              {profile?.fullPartyMember
                                ? dayjs(profile?.fullPartyMember).format(
                                    "DD/MM/YYYY"
                                  )
                                : "Không"}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="font-semibold text-gray-700 dark:text-gray-300">
                              Số thẻ Đảng viên:
                            </span>
                            <span className="text-gray-900 dark:text-white">
                              {profile?.partyMemberCardNumber ||
                                "Chưa có dữ liệu"}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="font-semibold text-gray-700 dark:text-gray-300">
                              Chức vụ đảng:
                            </span>
                            <span className="text-gray-900 dark:text-white">
                              {profile?.positionParty || "Không"}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="font-semibold text-gray-700 dark:text-gray-300">
                              Quê quán:
                            </span>
                            <span className="text-gray-900 dark:text-white">
                              {profile?.hometown || "Chưa có dữ liệu"}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="font-semibold text-gray-700 dark:text-gray-300">
                              Dân tộc:
                            </span>
                            <span className="text-gray-900 dark:text-white">
                              {profile?.ethnicity || "Chưa có dữ liệu"}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="font-semibold text-gray-700 dark:text-gray-300">
                              Tôn giáo:
                            </span>
                            <span className="text-gray-900 dark:text-white">
                              {profile?.religion || "Chưa có dữ liệu"}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="font-semibold text-gray-700 dark:text-gray-300">
                              Nơi ở hiện nay:
                            </span>
                            <span className="text-gray-900 dark:text-white">
                              {profile?.currentAddress || "Chưa có dữ liệu"}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Hiển thị thông tin gia đình */}
                      <div className="mt-8 col-span-2">
                        <h3 className="text-lg font-bold text-green-600 dark:text-green-400 border-b-2 border-green-200 dark:border-green-600 pb-2 mb-6 flex items-center">
                          <svg
                            className="w-5 h-5 mr-2"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          THÔNG TIN GIA ĐÌNH
                        </h3>
                        {profile?.familyMembers &&
                        profile.familyMembers.length > 0 ? (
                          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                            {profile.familyMembers.map((member, index) => (
                              <div
                                key={member.id || index}
                                className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 p-6 rounded-xl border-2 border-green-200 dark:border-green-700 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
                              >
                                <div className="flex items-center justify-between mb-4">
                                  <div className="flex items-center">
                                    <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                                    <span className="font-bold text-green-700 dark:text-green-300 text-lg">
                                      {member.relationship}
                                    </span>
                                  </div>
                                </div>
                                <div className="space-y-3">
                                  <div className="flex items-center">
                                    <svg
                                      className="w-4 h-4 text-green-600 dark:text-green-400 mr-2"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                                      />
                                    </svg>
                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                      Họ tên:
                                    </span>
                                    <span className="text-sm text-gray-900 dark:text-white ml-2 font-semibold">
                                      {member.fullName}
                                    </span>
                                  </div>
                                  <div className="flex items-center">
                                    <svg
                                      className="w-4 h-4 text-green-600 dark:text-green-400 mr-2"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                                      />
                                    </svg>
                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                      Sinh ngày:
                                    </span>
                                    <span className="text-sm text-gray-900 dark:text-white ml-2 font-semibold">
                                      {member.birthday
                                        ? dayjs(member.birthday).format(
                                            "DD/MM/YYYY"
                                          )
                                        : "Chưa có dữ liệu"}
                                    </span>
                                  </div>
                                  <div className="flex items-center">
                                    <svg
                                      className="w-4 h-4 text-green-600 dark:text-green-400 mr-2"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H8a2 2 0 01-2-2V8a2 2 0 012-2V6"
                                      />
                                    </svg>
                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                      Nghề nghiệp:
                                    </span>
                                    <span className="text-sm text-gray-900 dark:text-white ml-2 font-semibold">
                                      {member.occupation}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                            Chưa có thông tin gia đình
                          </div>
                        )}
                      </div>

                      {/* Hiển thị yếu tố nước ngoài */}
                      <div className="mt-8 col-span-2">
                        <h3 className="text-lg font-bold text-orange-600 dark:text-orange-400 border-b-2 border-orange-200 dark:border-orange-600 pb-2 mb-6 flex items-center">
                          <svg
                            className="w-5 h-5 mr-2"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M3 6a3 3 0 013-3h10a1 1 0 01.8 1.6L14.25 8l2.55 3.4A1 1 0 0116 13H6a1 1 0 00-1 1v3a1 1 0 11-2 0V6z"
                              clipRule="evenodd"
                            />
                          </svg>
                          YẾU TỐ NƯỚC NGOÀI
                        </h3>
                        {profile?.foreignRelations &&
                        profile.foreignRelations.length > 0 ? (
                          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                            {profile.foreignRelations.map((relation, index) => (
                              <div
                                key={relation.id || index}
                                className="bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 p-6 rounded-xl border-2 border-orange-200 dark:border-orange-700 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
                              >
                                <div className="flex items-center justify-between mb-4">
                                  <div className="flex items-center">
                                    <div className="w-3 h-3 bg-orange-500 rounded-full mr-3"></div>
                                    <span className="font-bold text-orange-700 dark:text-orange-300 text-lg">
                                      {relation.relationship}
                                    </span>
                                  </div>
                                </div>
                                <div className="space-y-3">
                                  <div className="flex items-center">
                                    <svg
                                      className="w-4 h-4 text-orange-600 dark:text-orange-400 mr-2"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                                      />
                                    </svg>
                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                      Họ tên:
                                    </span>
                                    <span className="text-sm text-gray-900 dark:text-white ml-2 font-semibold">
                                      {relation.fullName}
                                    </span>
                                  </div>
                                  <div className="flex items-center">
                                    <svg
                                      className="w-4 h-4 text-orange-600 dark:text-orange-400 mr-2"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                                      />
                                    </svg>
                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                      Sinh ngày:
                                    </span>
                                    <span className="text-sm text-gray-900 dark:text-white ml-2 font-semibold">
                                      {relation.birthday
                                        ? dayjs(relation.birthday).format(
                                            "DD/MM/YYYY"
                                          )
                                        : "Chưa có dữ liệu"}
                                    </span>
                                  </div>
                                  <div className="flex items-center">
                                    <svg
                                      className="w-4 h-4 text-orange-600 dark:text-orange-400 mr-2"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                      />
                                    </svg>
                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                      Quốc gia:
                                    </span>
                                    <span className="text-sm text-gray-900 dark:text-white ml-2 font-semibold">
                                      {relation.country}
                                    </span>
                                  </div>
                                  <div className="flex items-center">
                                    <svg
                                      className="w-4 h-4 text-orange-600 dark:text-orange-400 mr-2"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                                      />
                                    </svg>
                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                      Lý do:
                                    </span>
                                    <span className="text-sm text-gray-900 dark:text-white ml-2 font-semibold">
                                      {relation.reason}
                                    </span>
                                  </div>
                                  <div className="flex items-center">
                                    <svg
                                      className="w-4 h-4 text-orange-600 dark:text-orange-400 mr-2"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                                      />
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                                      />
                                    </svg>
                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                      Quốc tịch:
                                    </span>
                                    <span className="text-sm text-gray-900 dark:text-white ml-2 font-semibold">
                                      {relation.nationality}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                            Chưa có yếu tố nước ngoài
                          </div>
                        )}
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
                        Không tìm thấy thông tin cá nhân
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        {showForm && (
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <div className="bg-black bg-opacity-50 inset-0 fixed"></div>
            <div className="relative mt-12 bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-5xl max-h-[90vh] overflow-hidden">
              <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  CHỈNH SỬA THÔNG TIN HỌC VIÊN
                </h3>
                <button
                  type="button"
                  onClick={closeForm}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-2xl font-bold"
                >
                  ×
                </button>
              </div>
              <div className="overflow-y-auto max-h-[calc(85vh-80px)]">
                <div className="w-full max-w-5xl p-6">
                  <div className="w-full flex">
                    <div className="font-bold text-blue-600 dark:text-blue-400 w-1/2">
                      THÔNG TIN QUÂN NHÂN
                    </div>
                    <div className="font-bold text-blue-600 dark:text-blue-400 w-1/2 pl-3">
                      THÔNG TIN CÁ NHÂN
                    </div>
                  </div>
                  <div className="w-full mt-5">
                    <form onSubmit={(e) => handleSubmit(e, profile?.id)}>
                      <div className="grid gap-6 mb-6 md:grid-cols-2">
                        <div>
                          <label
                            htmlFor="studentId"
                            className="block mb-2 text-sm font-medium dark:text-white"
                          >
                            Mã học viên
                          </label>
                          <input
                            type="text"
                            id="studentId"
                            value={formData.studentId}
                            onChange={handleChange}
                            className="bg-gray-50 border border-gray-300 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                            placeholder="vd: 20200001"
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
                          <select
                            id="unit"
                            value={formData.unit}
                            onChange={handleChange}
                            className="bg-gray-50 border border-gray-300 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 pr-10 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                          >
                            <option value="L1 - H5">L1 - H5</option>
                            <option value="L2 - H5">L2 - H5</option>
                            <option value="L3 - H5">L3 - H5</option>
                            <option value="L4 - H5">L4 - H5</option>
                            <option value="L5 - H5">L5 - H5</option>
                            <option value="L6 - H5">L6 - H5</option>
                          </select>
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
                            <option value="Binh nhì">Binh nhì</option>
                            <option value="Binh nhất">Binh nhất</option>
                            <option value="Hạ Sỹ">Hạ Sỹ</option>
                            <option value="Trung sỹ">Trung sỹ</option>
                            <option value="Thượng sỹ">Thượng sỹ</option>
                          </select>
                        </div>

                        <div>
                          <label
                            htmlFor="graduationDate"
                            className="block mb-2 text-sm font-medium dark:text-white"
                          >
                            Ngày ra trường
                          </label>
                          <DatePicker
                            id="graduationDate"
                            selected={formData.graduationDate}
                            onChange={(date) =>
                              handleChangeDate("graduationDate", date)
                            }
                            dateFormat="dd/MM/yyyy"
                            className="bg-gray-50 border w-full border-gray-300 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                            placeholderText="Ngày/Tháng/Năm"
                            wrapperClassName="w-full"
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
                            <option value="Học viên">Học viên</option>
                            <option value="Lớp phó">Lớp phó</option>
                            <option value="Lớp trưởng">Lớp trưởng</option>
                          </select>
                        </div>

                        <div>
                          <label
                            htmlFor="university"
                            className="block mb-2 text-sm font-medium dark:text-white"
                          >
                            Trường
                          </label>
                          <select
                            id="university"
                            value={selectedUniversity?.id || ""}
                            onChange={async (e) => {
                              const uni = universities.find(
                                (u) => u.id === e.target.value
                              );
                              setSelectedUniversity(uni);
                              setSelectedOrganization("");
                              setSelectedLevel("");
                              setSelectedClass("");
                              setOrganizations([]);
                              setEducationLevels([]);
                              setClasses([]);

                              if (uni) {
                                const organizations = await fetchOrganizations(
                                  uni.id
                                );
                                setOrganizations(organizations);
                              }
                            }}
                            className="bg-gray-50 border border-gray-300 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 pr-10 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                            required
                          >
                            <option value="">Chọn trường</option>
                            {universities.map((u) => (
                              <option key={u.id} value={u.id}>
                                {u.universityName}
                              </option>
                            ))}
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
                            htmlFor="organization"
                            className="block mb-2 text-sm font-medium dark:text-white"
                          >
                            Khoa/Viện quản lý
                          </label>
                          <select
                            id="organization"
                            value={selectedOrganization || ""}
                            onChange={async (e) => {
                              const selectedOrg = organizations.find(
                                (org) => org.id === e.target.value
                              );
                              setSelectedOrganization(selectedOrg?.id || "");
                              setSelectedLevel("");
                              setSelectedClass("");
                              setEducationLevels([]);
                              setClasses([]);

                              if (selectedOrg) {
                                const educationLevels =
                                  await fetchEducationLevels(selectedOrg.id);
                                setEducationLevels(educationLevels);
                              }
                            }}
                            disabled={!selectedUniversity}
                            className="bg-gray-50 border border-gray-300 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 pr-10 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                            required
                          >
                            <option value="">Chọn khoa/viện</option>
                            {organizations.map((org) => (
                              <option key={org.id} value={org.id}>
                                {org.organizationName}
                              </option>
                            ))}
                          </select>
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
                            htmlFor="educationLevel"
                            className="block mb-2 text-sm font-medium dark:text-white"
                          >
                            Trình độ đào tạo
                          </label>
                          <select
                            key={`educationLevel-${selectedLevel}-${educationLevels.length}`}
                            id="educationLevel"
                            value={selectedLevel || ""}
                            onChange={async (e) => {
                              const selectedLevelObj = educationLevels.find(
                                (level) => level.id === e.target.value
                              );
                              setSelectedLevel(selectedLevelObj?.id || "");
                              setSelectedClass("");
                              setClasses([]);

                              if (selectedLevelObj) {
                                const classList = await fetchClasses(
                                  selectedLevelObj.id
                                );
                                setClasses(classList);
                              }
                            }}
                            disabled={!selectedOrganization}
                            className="bg-gray-50 border border-gray-300 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 pr-10 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                            required
                          >
                            <option value="">Chọn trình độ đào tạo</option>
                            {educationLevels.map((level) => (
                              <option key={level.id} value={level.id}>
                                {level.levelName}
                              </option>
                            ))}
                          </select>
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
                            htmlFor="classUniversity"
                            className="block mb-2 text-sm font-medium dark:text-white"
                          >
                            Lớp
                          </label>
                          <select
                            key={`class-${selectedClass}-${classes.length}`}
                            id="classUniversity"
                            value={selectedClass || ""}
                            onChange={(e) => {
                              const selectedClassObj = classes.find(
                                (cls) => cls.id === e.target.value
                              );
                              setSelectedClass(selectedClassObj?.id || "");
                            }}
                            disabled={!selectedLevel}
                            className="bg-gray-50 border border-gray-300 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 pr-10 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                            required
                          >
                            <option value="">Chọn lớp</option>
                            {classes.map((cls) => (
                              <option key={cls.id} value={cls.id}>
                                {cls.className}
                              </option>
                            ))}
                          </select>
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
                            <option value="Không">Không</option>
                            <option value="Đảng viên">Đảng viên</option>
                            <option value="Phó bí thư chi bộ">
                              Phó bí thư chi bộ
                            </option>
                            <option value="Bí thư chi bộ">Bí thư chi bộ</option>
                          </select>
                        </div>

                        <div>
                          <label
                            htmlFor="email"
                            className="block mb-2 text-sm font-medium dark:text-white"
                          >
                            Email
                          </label>
                          <input
                            type="email"
                            id="email"
                            value={formData.email}
                            onChange={handleChange}
                            className="bg-gray-50 border border-gray-300 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                            placeholder="vd: example@email.com"
                          />
                        </div>
                        <div>
                          <label
                            htmlFor="cccdNumber"
                            className="block mb-2 text-sm font-medium dark:text-white"
                          >
                            Số CCCD
                          </label>
                          <input
                            type="text"
                            id="cccdNumber"
                            value={formData.cccdNumber}
                            onChange={handleChange}
                            className="bg-gray-50 border border-gray-300 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                            placeholder="vd: 012345678901"
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
                            htmlFor="partyMemberCardNumber"
                            className="block mb-2 text-sm font-medium dark:text-white"
                          >
                            Số thẻ Đảng viên
                          </label>
                          <input
                            type="text"
                            id="partyMemberCardNumber"
                            value={formData.partyMemberCardNumber}
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
                          <label
                            htmlFor="avatar"
                            className="block mb-2 text-sm font-medium dark:text-white"
                          >
                            Ảnh đại diện
                          </label>
                          <input
                            type="url"
                            id="avatar"
                            value={formData.avatar}
                            onChange={handleChange}
                            className="bg-gray-50 border border-gray-300 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                            placeholder="vd: https://example.com/avatar.jpg"
                          />
                        </div>
                      </div>

                      {/* Form thông tin gia đình */}
                      <div className="mt-8">
                        <div className="flex justify-between items-center mb-4">
                          <h3 className="text-lg font-bold text-blue-600 dark:text-blue-400">
                            THÔNG TIN GIA ĐÌNH
                          </h3>
                          <button
                            type="button"
                            onClick={() => setShowFamilyForm(!showFamilyForm)}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg text-sm"
                          >
                            {showFamilyForm ? "Ẩn form" : "Hiện form"}
                          </button>
                        </div>

                        {showFamilyForm && (
                          <div className="grid gap-4 mb-4 md:grid-cols-2">
                            <div>
                              <label className="block mb-2 text-sm font-medium dark:text-white">
                                Quan hệ
                              </label>
                              <input
                                type="text"
                                name="relationship"
                                value={familyFormData.relationship}
                                onChange={handleFamilyChange}
                                className="bg-gray-50 border border-gray-300 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                                placeholder="vd: Bố, Mẹ, Anh, Chị..."
                              />
                            </div>
                            <div>
                              <label className="block mb-2 text-sm font-medium dark:text-white">
                                Họ và tên
                              </label>
                              <input
                                type="text"
                                name="fullName"
                                value={familyFormData.fullName}
                                onChange={handleFamilyChange}
                                className="bg-gray-50 border border-gray-300 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                                placeholder="vd: Nguyễn Văn A"
                              />
                            </div>
                            <div>
                              <label className="block mb-2 text-sm font-medium dark:text-white">
                                Sinh ngày
                              </label>
                              <DatePicker
                                selected={familyFormData.birthday}
                                onChange={(date) =>
                                  handleFamilyDateChange("birthday", date)
                                }
                                dateFormat="dd/MM/yyyy"
                                className="bg-gray-50 border w-full border-gray-300 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                                placeholderText="Ngày/Tháng/Năm"
                                wrapperClassName="w-full"
                              />
                            </div>
                            <div>
                              <label className="block mb-2 text-sm font-medium dark:text-white">
                                Nghề nghiệp
                              </label>
                              <input
                                type="text"
                                name="occupation"
                                value={familyFormData.occupation}
                                onChange={handleFamilyChange}
                                className="bg-gray-50 border border-gray-300 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                                placeholder="vd: Kỹ sư, Bác sĩ..."
                              />
                            </div>
                          </div>
                        )}
                        {showFamilyForm && (
                          <button
                            type="button"
                            onClick={addFamilyMember}
                            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg text-sm"
                          >
                            Thêm thành viên gia đình
                          </button>
                        )}

                        {familyMembers.length > 0 && (
                          <div className="mt-4">
                            <h4 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">
                              Danh sách thành viên gia đình:
                            </h4>
                            <div className="grid gap-4 md:grid-cols-2">
                              {familyMembers.map((member) => (
                                <div
                                  key={member.id}
                                  className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg border"
                                >
                                  <div className="flex justify-between items-start mb-2">
                                    <span className="font-semibold text-gray-700 dark:text-gray-300">
                                      {member.relationship}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        removeFamilyMember(member.id)
                                      }
                                      className="text-red-600 hover:text-red-800 text-sm"
                                    >
                                      Xóa
                                    </button>
                                  </div>
                                  <div className="text-sm text-gray-600 dark:text-gray-400">
                                    <p>Họ tên: {member.fullName}</p>
                                    <p>
                                      Sinh ngày:{" "}
                                      {member.birthday
                                        ? dayjs(member.birthday).format(
                                            "DD/MM/YYYY"
                                          )
                                        : "Chưa có dữ liệu"}
                                    </p>
                                    <p>Nghề nghiệp: {member.occupation}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Form yếu tố nước ngoài */}
                      <div className="mt-8">
                        <div className="flex justify-between items-center mb-4">
                          <h3 className="text-lg font-bold text-blue-600 dark:text-blue-400">
                            YẾU TỐ NƯỚC NGOÀI
                          </h3>
                          <button
                            type="button"
                            onClick={() => setShowForeignForm(!showForeignForm)}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg text-sm"
                          >
                            {showForeignForm ? "Ẩn form" : "Hiện form"}
                          </button>
                        </div>

                        {showForeignForm && (
                          <div className="grid gap-4 mb-4 md:grid-cols-2">
                            <div>
                              <label className="block mb-2 text-sm font-medium dark:text-white">
                                Quan hệ
                              </label>
                              <input
                                type="text"
                                name="relationship"
                                value={foreignFormData.relationship}
                                onChange={handleForeignChange}
                                className="bg-gray-50 border border-gray-300 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                                placeholder="vd: Bố, Mẹ, Anh, Chị..."
                              />
                            </div>
                            <div>
                              <label className="block mb-2 text-sm font-medium dark:text-white">
                                Họ và tên
                              </label>
                              <input
                                type="text"
                                name="fullName"
                                value={foreignFormData.fullName}
                                onChange={handleForeignChange}
                                className="bg-gray-50 border border-gray-300 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                                placeholder="vd: Nguyễn Văn A"
                              />
                            </div>
                            <div>
                              <label className="block mb-2 text-sm font-medium dark:text-white">
                                Sinh ngày
                              </label>
                              <DatePicker
                                selected={foreignFormData.birthday}
                                onChange={(date) =>
                                  handleForeignDateChange("birthday", date)
                                }
                                dateFormat="dd/MM/yyyy"
                                className="bg-gray-50 border w-full border-gray-300 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                                placeholderText="Ngày/Tháng/Năm"
                                wrapperClassName="w-full"
                              />
                            </div>
                            <div>
                              <label className="block mb-2 text-sm font-medium dark:text-white">
                                Quốc gia
                              </label>
                              <input
                                type="text"
                                name="country"
                                value={foreignFormData.country}
                                onChange={handleForeignChange}
                                className="bg-gray-50 border border-gray-300 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                                placeholder="vd: Mỹ, Pháp, Đức..."
                              />
                            </div>
                            <div>
                              <label className="block mb-2 text-sm font-medium dark:text-white">
                                Lý do
                              </label>
                              <input
                                type="text"
                                name="reason"
                                value={foreignFormData.reason}
                                onChange={handleForeignChange}
                                className="bg-gray-50 border border-gray-300 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                                placeholder="vd: Du học, Công tác..."
                              />
                            </div>
                            <div>
                              <label className="block mb-2 text-sm font-medium dark:text-white">
                                Quốc tịch
                              </label>
                              <input
                                type="text"
                                name="nationality"
                                value={foreignFormData.nationality}
                                onChange={handleForeignChange}
                                className="bg-gray-50 border border-gray-300 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                                placeholder="vd: Việt Nam, Mỹ..."
                              />
                            </div>
                          </div>
                        )}
                        {showForeignForm && (
                          <button
                            type="button"
                            onClick={addForeignRelation}
                            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg text-sm"
                          >
                            Thêm yếu tố nước ngoài
                          </button>
                        )}

                        {foreignRelations.length > 0 && (
                          <div className="mt-4">
                            <h4 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">
                              Danh sách yếu tố nước ngoài:
                            </h4>
                            <div className="grid gap-4 md:grid-cols-2">
                              {foreignRelations.map((relation) => (
                                <div
                                  key={relation.id}
                                  className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg border"
                                >
                                  <div className="flex justify-between items-start mb-2">
                                    <span className="font-semibold text-gray-700 dark:text-gray-300">
                                      {relation.relationship}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        removeForeignRelation(relation.id)
                                      }
                                      className="text-red-600 hover:text-red-800 text-sm"
                                    >
                                      Xóa
                                    </button>
                                  </div>
                                  <div className="text-sm text-gray-600 dark:text-gray-400">
                                    <p>Họ tên: {relation.fullName}</p>
                                    <p>
                                      Sinh ngày:{" "}
                                      {relation.birthday
                                        ? dayjs(relation.birthday).format(
                                            "DD/MM/YYYY"
                                          )
                                        : "Chưa có dữ liệu"}
                                    </p>
                                    <p>Quốc gia: {relation.country}</p>
                                    <p>Lý do: {relation.reason}</p>
                                    <p>Quốc tịch: {relation.nationality}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="flex mt-4 justify-end space-x-3">
                        <button
                          type="button"
                          onClick={closeForm}
                          className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 mr-2"
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
