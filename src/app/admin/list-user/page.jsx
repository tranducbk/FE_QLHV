"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import Link from "next/link";
import dayjs from "dayjs";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { useRouter } from "next/navigation";
import { handleNotify } from "../../../components/notify";
import Loader from "@/components/loader";
import { BASE_URL } from "@/configs";
import { useLoading } from "@/hooks";
import { useModalScroll } from "@/hooks/useModalScroll";
import { CarryOutOutlined, TeamOutlined } from "@ant-design/icons";
import { Select } from "antd";
const ListUser = () => {
  const router = useRouter();
  const [profile, setProfile] = useState([]);
  const [profileDetail, setProfileDetail] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [showForm, setShowForm] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showFormAdd, setShowFormAdd] = useState(false);
  const [showProfileDetail, setShowProfileDetail] = useState(false);
  const [id, setId] = useState(null);
  const [fullName, setFullName] = useState("");
  const [unit, setUnit] = useState("");
  const [enrollmentYear, setEnrollmentYear] = useState("");
  const [schoolYear, setSchoolYear] = useState("");
  const [universities, setUniversities] = useState([]);
  const [selectedUniversity, setSelectedUniversity] = useState(null);
  const [organizations, setOrganizations] = useState([]);
  const [selectedOrganization, setSelectedOrganization] = useState("");
  const [educationLevels, setEducationLevels] = useState([]);
  const [selectedLevel, setSelectedLevel] = useState("");
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { loading, withLoading } = useLoading(true);

  // State cho modal cập nhật đồng loạt ngày ra trường
  const [showGraduationModal, setShowGraduationModal] = useState(false);
  const [allStudents, setAllStudents] = useState([]);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [graduationDate, setGraduationDate] = useState(null);
  const [graduationFilterUnit, setGraduationFilterUnit] = useState("all");
  const [graduationFilterSchoolYear, setGraduationFilterSchoolYear] =
    useState("all");
  const [graduationSearchTerm, setGraduationSearchTerm] = useState("");
  const [enrollmentYears, setEnrollmentYears] = useState([]);
  const [schoolYears, setSchoolYears] = useState([]);
  const [graduationDateError, setGraduationDateError] = useState("");

  const getValidationMessage = () => {
    return graduationDateError;
  };

  // State cho form thông tin học viên
  const [profileUniversity, setProfileUniversity] = useState(null);
  const [profileOrganization, setProfileOrganization] = useState(null);
  const [profileEducationLevel, setProfileEducationLevel] = useState(null);
  const [profileClass, setProfileClass] = useState(null);

  // State cho thông tin gia đình
  const [showFamilyForm, setShowFamilyForm] = useState(false);
  const [familyMembers, setFamilyMembers] = useState([]);
  const [familyFormData, setFamilyFormData] = useState({
    relationship: "",
    fullName: "",
    birthday: null,
    occupation: "",
  });

  // State cho yếu tố nước ngoài
  const [showForeignForm, setShowForeignForm] = useState(false);
  const [foreignRelations, setForeignRelations] = useState([]);
  const [foreignFormData, setForeignFormData] = useState({
    relationship: "",
    fullName: "",
    birthday: null,
    country: "",
    reason: "",
    nationality: "",
  });
  const [addFormData, setAddFormData] = useState({
    username: "",
    password: "",
    studentId: "",
    avatar: "",
    fullName: "",
    gender: "",
    birthday: "",
    hometown: "",
    ethnicity: "",
    religion: "",
    currentAddress: "",
    placeOfBirth: "",
    phoneNumber: "",
    cccdNumber: "",
    partyMemberCardNumber: "",
    enrollment: "",
    classUniversity: "",
    educationLevel: "",
    organization: "",
    university: "",
    unit: "",
    rank: "",
    positionGovernment: "Học viên",
    positionParty: "Không",
    fullPartyMember: "",
    probationaryPartyMember: "",
    dateOfEnlistment: "",
    enrollment: "",
    graduationDate: "",
  });
  const [formData, setFormData] = useState({
    educationLevel: "Đại học đại trà",
    organization: "Viện ngoại ngữ",
    university: "Đại học Bách Khoa Hà Nội",
    rank: "Binh nhì",
    positionGovernment: "Học viên",
    positionParty: "Không",
    ethnicity: "",
    religion: "",
    currentAddress: "",
    avatar:
      "https://i.pinimg.com/736x/81/09/3a/81093a0429e25b0ff579fa41aa96c421.jpg",
    enrollment: "",
  });

  // Disable scroll khi có modal mở
  useModalScroll(
    showProfileDetail ||
      showFormAdd ||
      showForm ||
      showConfirm ||
      showGraduationModal
  );

  const handleAddFormData = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");

    // Validation các trường bắt buộc - chỉ 4 trường cần thiết
    if (
      !addFormData.username ||
      !addFormData.password ||
      !addFormData.studentId ||
      !addFormData.fullName
    ) {
      image.png;
      handleNotify(
        "warning",
        "Cảnh báo!",
        "Vui lòng điền đầy đủ thông tin bắt buộc: Tên đăng nhập, Mật khẩu, Họ tên, Mã học viên"
      );
      return;
    }

    // Chỉ gửi các trường bắt buộc và tùy chọn
    const submitData = {
      username: addFormData.username,
      password: addFormData.password,
      studentId: addFormData.studentId,
      fullName: addFormData.fullName,
      // Các trường tùy chọn (chỉ gửi nếu có giá trị)
      ...(selectedUniversity?.id && { university: selectedUniversity.id }),
      ...(selectedOrganization && { organization: selectedOrganization }),
      ...(selectedLevel && { educationLevel: selectedLevel }),
      ...(selectedClass && { class: selectedClass }),
      ...(addFormData.phoneNumber && { phoneNumber: addFormData.phoneNumber }),
      ...(addFormData.email && { email: addFormData.email }),
      ...(addFormData.unit && { unit: addFormData.unit }),
      ...(addFormData.enrollment && {
        enrollment: parseInt(addFormData.enrollment) || null,
      }),
      ...(addFormData.dateOfEnlistment && {
        dateOfEnlistment: addFormData.dateOfEnlistment,
      }),
      avatar:
        (addFormData.avatar && addFormData.avatar.trim()) ||
        "https://i.pinimg.com/736x/81/09/3a/81093a0429e25b0ff579fa41aa96c421.jpg",
    };

    setIsLoading(true);
    try {
      await axios.post(`${BASE_URL}/commander/student`, submitData, {
        headers: {
          token: `Bearer ${token}`,
        },
      });
      handleNotify("success", "Thành công!", "Thêm học viên thành công");
      setShowFormAdd(false);
      setAddFormData({});
      // Reset các select động
      setSelectedUniversity(null);
      setSelectedOrganization("");
      setSelectedLevel("");
      setSelectedClass("");
      fetchProfile();
    } catch (error) {
      setShowFormAdd(false);
      handleNotify("danger", "Lỗi!", error);
    } finally {
      setIsLoading(false);
    }
  };

  const closeForm = () => {
    setShowForm(false);
    setShowFormAdd(false);
    // Reset các select động khi đóng form
    setSelectedUniversity(null);
    setSelectedOrganization("");
    setSelectedLevel("");
    setSelectedClass("");
    // Reset form data
    setAddFormData({
      username: "",
      password: "",
      studentId: "",
      fullName: "",
      gender: "",
      birthday: "",
      hometown: "",
      ethnicity: "",
      religion: "",
      currentAddress: "",
      placeOfBirth: "",
      phoneNumber: "",
      cccdNumber: "",
      partyMemberCardNumber: "",
      enrollment: "",
      classUniversity: "",
      educationLevel: "",
      organization: "",
      university: "",
      unit: "",
      rank: "",
      positionGovernment: "Học viên",
      positionParty: "Không",
      fullPartyMember: "",
      probationaryPartyMember: "",
      dateOfEnlistment: "",
    });
    // Reset edit form data
    setFormData({
      educationLevel: "",
      organization: "",
      university: "",
      rank: "",
      positionGovernment: "Học viên",
      positionParty: "Không",
      currentAddress: "",
      avatar:
        "https://i.pinimg.com/736x/81/09/3a/81093a0429e25b0ff579fa41aa96c421.jpg",
    });
    // Reset thông tin gia đình và yếu tố nước ngoài
    setFamilyMembers([]);
    setForeignRelations([]);
    setShowFamilyForm(false);
    setShowForeignForm(false);
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
  };

  // Đọc URL parameters khi component mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const page = urlParams.get("page");
    const pageSizeParam = urlParams.get("pageSize");

    if (page) {
      setCurrentPage(parseInt(page));
    }
    if (pageSizeParam) {
      setPageSize(parseInt(pageSizeParam));
    }
  }, []);

  useEffect(() => {
    const initializeData = async () => {
      await withLoading(async () => {
        await fetchUniversities();
        await fetchSchoolYears(); // fetchSchoolYears sẽ tự động load students
      });
    };

    initializeData();
  }, [withLoading]);

  // useEffect riêng để xử lý phân trang
  useEffect(() => {
    if (schoolYear) {
      loadStudentsWithSchoolYear(schoolYear);
    } else {
      fetchProfile();
    }
  }, [currentPage, pageSize, schoolYear, fullName, unit, enrollmentYear]);

  const fetchProfile = async () => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const res = await axios.get(
          `${BASE_URL}/commander/student?page=${currentPage}&pageSize=${pageSize}&fullName=${fullName}&unit=${unit}&enrollment=${enrollmentYear}&graduated=false`,
          {
            headers: {
              token: `Bearer ${token}`,
            },
          }
        );
        setProfile(res.data);
      } catch (error) {
      }
    }
  };

  const fetchUniversities = async () => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const res = await axios.get(`${BASE_URL}/university`, {
          headers: { token: `Bearer ${token}` },
        });

        setUniversities(res.data);
      } catch (error) {
      }
    }
  };

  // Đã bỏ sử dụng bộ lọc Năm vào trường

  const fetchSchoolYears = async () => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const res = await axios.get(`${BASE_URL}/commander/schoolYears`, {
          headers: { token: `Bearer ${token}` },
        });
        setSchoolYears(res.data);
        // Set năm học mới nhất làm giá trị mặc định
        if (res.data.length > 0 && !schoolYear) {
          const latestSchoolYear = res.data[0];
          setSchoolYear(latestSchoolYear);
          // Tự động load dữ liệu với năm học mới nhất chỉ khi khởi tạo lần đầu
          await loadStudentsWithSchoolYear(latestSchoolYear);
        }
      } catch (error) {
      }
    }
  };

  const reloadStudents = async () => {
    if (schoolYear) {
      await loadStudentsWithSchoolYear(schoolYear);
    } else {
      await fetchProfile();
    }
  };

  const loadStudentsWithSchoolYear = async (schoolYearValue) => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const res = await axios.get(
          `${BASE_URL}/commander/student?page=${currentPage}&pageSize=${pageSize}&schoolYear=${schoolYearValue}&graduated=false`,
          {
            headers: {
              token: `Bearer ${token}`,
            },
          }
        );
        setProfile(res.data);
      } catch (error) {
        setProfile([]);
      }
    }
  };

  const handleSchoolYearChange = (newSchoolYear) => {
    setSchoolYear(newSchoolYear);
    // Chỉ cập nhật state, không gọi API tự động
    // Người dùng phải bấm nút "Tìm kiếm" để áp dụng bộ lọc
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
        return [];
      }
    }
    return [];
  };

  const handleConfirmDelete = (id) => {
    const token = localStorage.getItem("token");

    if (token) {
      axios
        .delete(`${BASE_URL}/commander/student/${id}`, {
          headers: {
            token: `Bearer ${token}`,
          },
        })
        .then(() => {
          setProfile((prevProfile) => ({
            ...prevProfile,
            students: prevProfile?.students?.filter(
              (student) => student.id !== id
            ),
          }));
          handleNotify("success", "Thành công!", "Xóa học viên thành công");
          setShowConfirm(false);
          reloadStudents();
        })
        .catch((error) => {
          handleNotify("danger", "Lỗi!", error);
          setShowConfirm(false);
        });
    } else {
      setShowConfirm(false);
    }
  };

  const editStudent = async (studentId) => {
    const token = localStorage.getItem("token");

    if (token) {
      try {
        // Đảm bảo universities đã được load
        if (universities.length === 0) {
          await fetchUniversities();
        }

        const res = await axios.get(
          `${BASE_URL}/commander/student/${studentId}`,
          {
            headers: {
              token: `Bearer ${token}`,
            },
          }
        );


        setFormData({
          studentId: res.data.studentId || "",
          fullName: res.data.fullName || "",
          phoneNumber: res.data.phoneNumber || "",
          placeOfBirth: res.data.placeOfBirth || "",
          cccdNumber: res.data.cccdNumber || "",
          partyMemberCardNumber: res.data.partyMemberCardNumber || "",
          gender: res.data.gender || "Nam",
          unit: res.data.unit || "",
          birthday: res.data.birthday ? new Date(res.data.birthday) : null,
          rank: res.data.rank || "Binh nhì",
          enrollment: res.data.enrollment || 2017,
          positionGovernment: res.data.positionGovernment || "Học viên",
          educationLevel: res.data.educationLevel || "Đại học đại trà",
          dateOfEnlistment: res.data.dateOfEnlistment
            ? new Date(res.data.dateOfEnlistment)
            : null,
          classUniversity: res.data.classUniversity || "",
          probationaryPartyMember: res.data.probationaryPartyMember
            ? new Date(res.data.probationaryPartyMember)
            : null,
          organization: res.data.organization || "Viện ngoại ngữ",
          fullPartyMember: res.data.fullPartyMember
            ? new Date(res.data.fullPartyMember)
            : null,
          university: res.data.university || "Đại học Bách Khoa Hà Nội",
          positionParty: res.data.positionParty || "Không",

          hometown: res.data.hometown || "",
          ethnicity: res.data.ethnicity || "",
          religion: res.data.religion || "",
          currentAddress: res.data.currentAddress || "",
          avatar:
            res.data.avatar ||
            "https://i.pinimg.com/736x/81/09/3a/81093a0429e25b0ff579fa41aa96c421.jpg",
        });

        // Khởi tạo các select động từ dữ liệu có sẵn
        let foundUniversity = null;

        if (
          res.data.university &&
          typeof res.data.university === "object" &&
          res.data.university.id
        ) {
          // Ưu tiên sử dụng university object từ API
          foundUniversity = res.data.university;
        } else if (res.data.universityId) {
          // Fallback: tìm theo universityId
          foundUniversity = universities.find(
            (u) => u.id === res.data.universityId
          );
        } else if (
          res.data.university &&
          typeof res.data.university === "string"
        ) {
          // Fallback: tìm theo tên
          foundUniversity = universities.find(
            (u) => u.universityName === res.data.university
          );
        }

        if (foundUniversity) {
          setSelectedUniversity(foundUniversity);

          // Gọi API để load organizations, education levels, và classes
          try {
            // Load organizations
            const organizations = await fetchOrganizations(foundUniversity.id);
            setOrganizations(organizations);

            // Tìm organization đã chọn
            let selectedOrgId = null;
            if (
              res.data.organization &&
              typeof res.data.organization === "object" &&
              res.data.organization.id
            ) {
              // Ưu tiên sử dụng organization object từ API
              selectedOrgId = res.data.organization.id;
            } else if (res.data.organizationId) {
              // Fallback: sử dụng organizationId
              selectedOrgId = res.data.organizationId;
            } else if (
              res.data.organization &&
              typeof res.data.organization === "string"
            ) {
              // Fallback: tìm theo tên
              const selectedOrg = organizations.find(
                (org) => org.organizationName === res.data.organization
              );
              selectedOrgId = selectedOrg?.id;
            }

            if (selectedOrgId) {
              setSelectedOrganization(selectedOrgId);

              // Load education levels
              const educationLevels = await fetchEducationLevels(selectedOrgId);
              setEducationLevels(educationLevels);

              // Tìm education level đã chọn
              let selectedLevelId = null;
              if (
                res.data.education_level &&
                typeof res.data.education_level === "object" &&
                res.data.education_level.id
              ) {
                // Ưu tiên sử dụng education_level object từ API
                selectedLevelId = res.data.education_level.id;
                  "✅ Education level from API:",
                  res.data.education_level
                );
              } else if (res.data.educationLevelId) {
                // Fallback: sử dụng educationLevelId
                selectedLevelId = res.data.educationLevelId;
                  "✅ Education level from educationLevelId:",
                  selectedLevelId
                );
              } else if (
                res.data.educationLevel &&
                typeof res.data.educationLevel === "object"
              ) {
                selectedLevelId = res.data.educationLevel.id;
              } else if (
                res.data.educationLevel &&
                typeof res.data.educationLevel === "string"
              ) {
                const selectedLevelObj = educationLevels.find(
                  (level) => level.levelName === res.data.educationLevel
                );
                selectedLevelId = selectedLevelObj?.id;
              }

              if (selectedLevelId) {
                setSelectedLevel(selectedLevelId);

                // Load classes
                const classes = await fetchClasses(selectedLevelId);
                setClasses(classes);

                // Tìm class đã chọn
                let selectedClassId = null;
                if (
                  res.data.class &&
                  typeof res.data.class === "object" &&
                  res.data.class.id
                ) {
                  // Ưu tiên sử dụng class object từ API
                  selectedClassId = res.data.class.id;
                } else if (res.data.classId) {
                  // Fallback: sử dụng classId
                  selectedClassId = res.data.classId;
                } else if (
                  res.data.class &&
                  typeof res.data.class === "string"
                ) {
                  // Fallback: tìm theo tên
                  const selectedClassObj = classes.find(
                    (cls) => cls.className === res.data.class
                  );
                  selectedClassId = selectedClassObj?.id;
                }

                if (selectedClassId) {
                  setSelectedClass(selectedClassId);
                }
              }
            }
          } catch (error) {
            console.error("Error loading cascading data:", error);
          }

        } else {
        }

        // Load thông tin gia đình và yếu tố nước ngoài vào state
        if (res.data.familyMembers && Array.isArray(res.data.familyMembers)) {
          const formattedFamilyMembers = res.data.familyMembers.map(
            (member, index) => ({
              id: member.id || `temp-${Date.now()}-${index}`,
              relationship: member.relationship || "",
              fullName: member.fullName || "",
              birthday: member.birthday ? new Date(member.birthday) : null,
              occupation: member.occupation || "",
            })
          );
          setFamilyMembers(formattedFamilyMembers);
            "Loaded family members for edit:",
            formattedFamilyMembers
          );
        } else {
          setFamilyMembers([]);
        }

        if (
          res.data.foreignRelations &&
          Array.isArray(res.data.foreignRelations)
        ) {
          const formattedForeignRelations = res.data.foreignRelations.map(
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
            "Loaded foreign relations for edit:",
            formattedForeignRelations
          );
        } else {
          setForeignRelations([]);
        }

        setSelectedStudentId(studentId);
        setShowForm(true);
      } catch (error) {
        handleNotify("danger", "Lỗi!", "Không thể tải thông tin học viên");
      }
    }
  };

  const handleSubmit = async (e, selectedStudentId, profile) => {
    e.preventDefault();
    const token = localStorage.getItem("token");

    // Validation các trường bắt buộc
    if (!formData.studentId || !formData.fullName) {
      handleNotify(
        "warning",
        "Cảnh báo!",
        "Vui lòng điền đầy đủ thông tin bắt buộc"
      );
      return;
    }

    if (!selectedUniversity?.id) {
      handleNotify("warning", "Cảnh báo!", "Vui lòng chọn trường");
      return;
    }

    if (!selectedOrganization) {
      handleNotify("warning", "Cảnh báo!", "Vui lòng chọn khoa/viện");
      return;
    }

    if (!selectedLevel) {
      handleNotify("warning", "Cảnh báo!", "Vui lòng chọn trình độ đào tạo");
      return;
    }

    if (!selectedClass) {
      handleNotify("warning", "Cảnh báo!", "Vui lòng chọn lớp");
      return;
    }

    // Map giá trị từ select động vào form data
    const submitData = {
      ...formData,
      university: selectedUniversity.id, // Sử dụng ObjectId của university đã chọn
      organization: selectedOrganization, // Tên khoa/viện đã chọn
      educationLevel: selectedLevel, // Trình độ đã chọn
      class: selectedClass?.id || selectedClass, // Lớp đã chọn - gửi ObjectId
      // Xử lý enrollment thành number
      enrollment: formData.enrollment
        ? parseInt(formData.enrollment) || null
        : null,
      // Xử lý avatar mặc định nếu trống
      avatar:
        formData.avatar ||
        "https://i.pinimg.com/736x/81/09/3a/81093a0429e25b0ff579fa41aa96c421.jpg",
      // Thêm thông tin gia đình và yếu tố nước ngoài
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

    setIsLoading(true);
    try {
      const response = await axios.put(
        `${BASE_URL}/commander/student/${selectedStudentId}`,
        submitData,
        {
          headers: {
            token: `Bearer ${token}`,
          },
        }
      );
      handleNotify("success", "Thành công!", "Chỉnh sửa học viên thành công");
      setShowForm(false);
      // Reset các select động
      setSelectedUniversity(null);
      setSelectedOrganization("");
      setSelectedLevel("");
      setSelectedClass("");
      await reloadStudents();
    } catch (error) {
      // Không đóng modal khi có lỗi, chỉ hiển thị thông báo lỗi
      handleNotify("danger", "Lỗi!", error.response.data);
    } finally {
      setIsLoading(false);
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

  const handleChangeDate = (id, date) => {
    setFormData({
      ...formData,
      [id]: date,
    });
  };

  // Hàm xử lý form gia đình
  const handleFamilyChange = (event) => {
    setFamilyFormData({
      ...familyFormData,
      [event.target.id]: event.target.value,
    });
  };

  const handleFamilyDateChange = (id, date) => {
    setFamilyFormData({
      ...familyFormData,
      [id]: date,
    });
  };

  const addFamilyMember = () => {
    if (
      !familyFormData.relationship ||
      !familyFormData.fullName ||
      !familyFormData.birthday ||
      !familyFormData.occupation
    ) {
      handleNotify(
        "warning",
        "Cảnh báo!",
        "Vui lòng điền đầy đủ thông tin người thân"
      );
      return;
    }
    setFamilyMembers([...familyMembers, { ...familyFormData, id: Date.now() }]);
    setFamilyFormData({
      relationship: "",
      fullName: "",
      birthday: null,
      occupation: "",
    });
    setShowFamilyForm(false);
  };

  const removeFamilyMember = (id) => {
    setFamilyMembers(familyMembers.filter((member) => member.id !== id));
  };

  // Hàm xử lý form yếu tố nước ngoài
  const handleForeignChange = (event) => {
    setForeignFormData({
      ...foreignFormData,
      [event.target.id]: event.target.value,
    });
  };

  const handleForeignDateChange = (id, date) => {
    setForeignFormData({
      ...foreignFormData,
      [id]: date,
    });
  };

  const addForeignRelation = () => {
    if (
      !foreignFormData.relationship ||
      !foreignFormData.fullName ||
      !foreignFormData.birthday ||
      !foreignFormData.country ||
      !foreignFormData.reason ||
      !foreignFormData.nationality
    ) {
      handleNotify(
        "warning",
        "Cảnh báo!",
        "Vui lòng điền đầy đủ thông tin mối quan hệ nước ngoài"
      );
      return;
    }
    setForeignRelations([
      ...foreignRelations,
      { ...foreignFormData, id: Date.now() },
    ]);
    setForeignFormData({
      relationship: "",
      fullName: "",
      birthday: null,
      country: "",
      reason: "",
      nationality: "",
    });
    setShowForeignForm(false);
  };

  const removeForeignRelation = (id) => {
    setForeignRelations(
      foreignRelations.filter((relation) => relation.id !== id)
    );
  };

  const handleDelete = (id) => {
    setId(id);
    setShowConfirm(true);
  };

  const handleCancelDelete = () => {
    setShowConfirm(false);
  };

  // Hàm mở modal cập nhật đồng loạt ngày ra trường
  const handleBulkGraduationUpdate = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      // Lấy danh sách sinh viên
      const studentsResponse = await axios.get(
        `${BASE_URL}/commander/allStudents`,
        {
          headers: { token: `Bearer ${token}` },
        }
      );
      setAllStudents(studentsResponse.data);

      // Lấy danh sách năm học
      const schoolYearsResponse = await axios.get(
        `${BASE_URL}/commander/schoolYears`,
        {
          headers: { token: `Bearer ${token}` },
        }
      );
      setSchoolYears(schoolYearsResponse.data);

      setShowGraduationModal(true);
    } catch (error) {
      console.error("Error fetching data:", error);
      handleNotify("danger", "Lỗi!", "Không thể tải dữ liệu");
    }
  };

  // Hàm lọc và sắp xếp sinh viên
  const filteredAndSortedStudents = allStudents
    .filter((student) => {
      const matchesUnit =
        graduationFilterUnit === "all" || student.unit === graduationFilterUnit;

      // Lọc theo năm học
      let matchesSchoolYear = true;
      if (graduationFilterSchoolYear !== "all") {
        const startYear = parseInt(graduationFilterSchoolYear.split("-")[0]);
        // Sinh viên vào trường từ năm startYear trở về trước và chưa ra trường
        // hoặc đã ra trường nhưng sau năm startYear
        matchesSchoolYear =
          student.enrollment <= startYear &&
          (!student.graduationDate ||
            new Date(student.graduationDate) > new Date(startYear, 11, 31));
      }

      const matchesSearch =
        !graduationSearchTerm ||
        student.fullName
          .toLowerCase()
          .includes(graduationSearchTerm.toLowerCase()) ||
        student.studentId
          .toLowerCase()
          .includes(graduationSearchTerm.toLowerCase());
      return matchesUnit && matchesSchoolYear && matchesSearch;
    })
    .sort((a, b) => {
      // Đầu tiên sắp xếp theo trạng thái ra trường (chưa ra trường lên trên)
      const aGraduated = !!a.graduationDate;
      const bGraduated = !!b.graduationDate;
      if (aGraduated !== bGraduated) {
        return aGraduated ? 1 : -1; // Chưa ra trường lên trên
      }

      // Nếu cùng trạng thái ra trường, sắp xếp theo đơn vị
      if (a.unit !== b.unit) {
        return a.unit.localeCompare(b.unit);
      }

      // Nếu cùng đơn vị, sắp xếp theo ngày nhập ngũ
      const dateA = a.dateOfEnlistment
        ? new Date(a.dateOfEnlistment)
        : new Date(0);
      const dateB = b.dateOfEnlistment
        ? new Date(b.dateOfEnlistment)
        : new Date(0);

      if (aGraduated) {
        // Nếu đã ra trường, sắp xếp từ mới nhất đến cũ nhất
        return dateA - dateB;
      } else {
        // Nếu chưa ra trường, sắp xếp từ cũ nhất đến mới nhất
        return dateB - dateA;
      }
    });

  // Hàm chọn tất cả sinh viên đã lọc
  const handleSelectAllStudents = () => {
    const currentFilteredIds = filteredAndSortedStudents.map(
      (student) => student.id
    );
    const newSelectedStudents = [...selectedStudents];

    // Thêm tất cả sinh viên đã lọc vào danh sách đã chọn (nếu chưa có)
    currentFilteredIds.forEach((id) => {
      if (!newSelectedStudents.includes(id)) {
        newSelectedStudents.push(id);
      }
    });

    setSelectedStudents(newSelectedStudents);
  };

  // Hàm bỏ chọn tất cả sinh viên đã lọc
  const handleDeselectAllStudents = () => {
    const currentFilteredIds = filteredAndSortedStudents.map(
      (student) => student.id
    );
    setSelectedStudents(
      selectedStudents.filter((id) => !currentFilteredIds.includes(id))
    );
  };

  // Hàm chọn/bỏ chọn một sinh viên
  const handleSelectStudent = (studentId) => {
    if (selectedStudents.includes(studentId)) {
      setSelectedStudents(selectedStudents.filter((id) => id !== studentId));
    } else {
      setSelectedStudents([...selectedStudents, studentId]);
    }
  };

  // Hàm cập nhật đồng loạt ngày ra trường
  const handleBulkGraduationSubmit = async () => {
    // Reset error
    setGraduationDateError("");

    if (selectedStudents.length === 0) {
      handleNotify(
        "warning",
        "Cảnh báo!",
        "Vui lòng chọn ít nhất một sinh viên"
      );
      return;
    }

    // Kiểm tra trên toàn bộ danh sách, không phụ thuộc bộ lọc đang chọn
    const selectedStudentData = allStudents.filter((student) =>
      selectedStudents.includes(student.id)
    );

    const hasGraduatedStudents = selectedStudentData.some(
      (student) => student.graduationDate
    );
    const hasNonGraduatedStudents = selectedStudentData.some(
      (student) => !student.graduationDate
    );

    // Kiểm tra validation: Nếu chọn sinh viên chưa ra trường mà không nhập ngày ra trường
    if (hasNonGraduatedStudents && !graduationDate) {
      setGraduationDateError("Sinh viên chưa ra trường cần có ngày ra trường");
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) return;

    setIsLoading(true);
    try {
      const response = await axios.put(
        `${BASE_URL}/commander/bulkUpdateGraduationDate`,
        {
          studentIds: selectedStudents,
          graduationDate: graduationDate,
        },
        {
          headers: { token: `Bearer ${token}` },
        }
      );

      if (response.status === 200) {
        const message = graduationDate
          ? "Cập nhật ngày ra trường thành công"
          : "Đánh dấu sinh viên chưa ra trường thành công";

        handleNotify("success", "Thành công!", message);
        setShowGraduationModal(false);
        setSelectedStudents([]);
        setGraduationDate(null);
        setGraduationDateError("");
        fetchProfile(); // Refresh danh sách
      }
    } catch (error) {
      handleNotify(
        "danger",
        "Lỗi!",
        error.response?.data?.message || "Có lỗi xảy ra khi cập nhật"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleRowClick = async (studentId) => {
    const token = localStorage.getItem("token");

    if (token) {
      try {
        const res = await axios.get(
          `${BASE_URL}/commander/student/${studentId}`,
          {
            headers: {
              token: `Bearer ${token}`,
            },
          }
        );
        setProfileDetail(res.data);

        // Fetch university
        if (
          res.data.university &&
          typeof res.data.university === "string" &&
          res.data.university.length === 24
        ) {
          try {
            const universityRes = await axios.get(
              `${BASE_URL}/university/${res.data.university}`,
              {
                headers: { token: `Bearer ${token}` },
              }
            );
            setProfileUniversity(universityRes.data);
          } catch (error) {
            console.error("Error fetching university:", error);
          }

          // Fetch organization
          if (
            res.data.organization &&
            typeof res.data.organization === "string" &&
            res.data.organization.length === 24
          ) {
            try {
              const organizationRes = await axios.get(
                `${BASE_URL}/university/organizations/${res.data.organization}`,
                {
                  headers: { token: `Bearer ${token}` },
                }
              );
              setProfileOrganization(organizationRes.data);
            } catch (error) {
              console.error("Error fetching organization:", error);
            }

            // Fetch education level
            if (
              res.data.educationLevel &&
              typeof res.data.educationLevel === "string" &&
              res.data.educationLevel.length === 24
            ) {
              try {
                  "Fetching education level:",
                  res.data.educationLevel
                );
                const educationLevelRes = await axios.get(
                  `${BASE_URL}/university/education-levels/${res.data.educationLevel}`,
                  {
                    headers: { token: `Bearer ${token}` },
                  }
                );
                setProfileEducationLevel(educationLevelRes.data);
              } catch (error) {
                console.error("Error fetching education level:", error);
              }

              // Fetch class
              if (
                res.data.class &&
                typeof res.data.class === "string" &&
                res.data.class.length === 24
              ) {
                try {
                  const classRes = await axios.get(
                    `${BASE_URL}/university/classes/${res.data.class}`,
                    {
                      headers: { token: `Bearer ${token}` },
                    }
                  );
                  setProfileClass(classRes.data);
                } catch (error) {
                  console.error("Error fetching class:", error);
                }
              }
            }
          }
        }

        setShowProfileDetail(true);
      } catch (error) {
      }
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    router.push(
      `/admin/list-user?fullName=${fullName}&unit=${unit}&enrollment=${enrollmentYear}&schoolYear=${schoolYear}`
    );
    const token = localStorage.getItem("token");

    if (token) {
      try {
        const res = await axios.get(
          `${BASE_URL}/commander/student?page=${currentPage}&pageSize=${pageSize}&fullName=${fullName}&unit=${unit}&enrollment=${enrollmentYear}&schoolYear=${schoolYear}&graduated=false`,
          {
            headers: {
              token: `Bearer ${token}`,
            },
          }
        );

        if (res.status === 404) setProfile([]);

        setProfile(res.data);
      } catch (error) {
        handleNotify("danger", "Lỗi!", error);
      }
    }
  };

  const handleClearFilter = async () => {
    setFullName("");
    setUnit("");
    setEnrollmentYear("");
    setSchoolYear(schoolYears[0] || ""); // Reset về năm học mới nhất

    // Reset URL
    router.push("/admin/list-user");

    // Fetch all data với năm học mới nhất
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const latestYear = schoolYears[0] || "";
        const res = await axios.get(
          `${BASE_URL}/commander/student?page=1&pageSize=${pageSize}&schoolYear=${latestYear}&graduated=false`,
          {
            headers: {
              token: `Bearer ${token}`,
            },
          }
        );

        if (res.status === 404) setProfile([]);
        setProfile(res.data);
      } catch (error) {
        handleNotify("danger", "Lỗi!", error);
      }
    }
  };

  const handlePageSizeChange = (newPageSize) => {
    const size = Number(newPageSize);
    setPageSize(size);
    setCurrentPage(1); // Reset về trang đầu khi thay đổi pageSize
    // Cập nhật URL để đồng bộ với state
    const url = new URL(window.location);
    url.searchParams.set("page", "1");
    url.searchParams.set("pageSize", size.toString());
    window.history.replaceState({}, "", url);
  };

  if (loading) {
    return <Loader text="Đang tải danh sách học viên..." />;
  }

  return (
    <>
      <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
        {showProfileDetail && (
          <>
            <div className="bg-black opacity-50 fixed inset-0 z-30"></div>
            <div
              tabIndex="-1"
              aria-hidden="true"
              className="fixed inset-0 z-40 flex justify-center items-start"
            >
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg relative p-6 max-w-6xl w-full mt-24 mx-auto max-h-[80vh] overflow-y-auto">
                <button
                  type="button"
                  onClick={() => {
                    setShowProfileDetail(false);
                  }}
                  className="absolute top-4 right-4 text-gray-400 bg-transparent hover:bg-gray-200 hover:text-custom rounded-lg text-sm w-8 h-8 inline-flex justify-center items-center dark:hover:bg-gray-600 dark:hover:text-white z-50"
                  data-modal-hide="authentication-modal"
                >
                  <svg
                    className="w-3 h-3"
                    aria-hidden="true"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 14 14"
                  >
                    <path
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6"
                    />
                  </svg>
                  <span className="sr-only">Close modal</span>
                </button>
                <div className="relative z-20 bg-white dark:bg-gray-800 rounded-lg">
                  <div className="bg-white dark:bg-gray-800 rounded-lg w-full">
                    <div className="text-2xl font-bold text-center mb-6 text-gray-900 dark:text-white">
                      THÔNG TIN HỌC VIÊN
                    </div>
                    <div className="flex flex-wrap justify-start">
                      <div className="w-full md:w-1/3 flex flex-col items-center">
                        <img
                          className="rounded-full w-64 h-64 object-cover border-4 border-gray-200 dark:border-gray-600"
                          src={profileDetail?.avatar}
                          alt="avatar"
                        />
                        <div className="translate-y-[-50%]">
                          <div className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                            Mã HV: {profileDetail?.studentId}
                          </div>
                        </div>
                      </div>
                      <div className="w-full md:w-2/3 flex flex-wrap">
                        <div className="w-full md:w-1/2">
                          {/* <div className="text-lg font-semibold text-indigo-600 dark:text-indigo-400 mb-2">
                            THÔNG TIN SINH VIÊN
                          </div> */}
                          <div className="mb-2 text-gray-900 dark:text-white">
                            <span className="font-bold">Họ và tên:</span>{" "}
                            {profileDetail?.fullName || "Chưa có dữ liệu"}
                          </div>
                          <div className="mb-2 text-gray-900 dark:text-white">
                            <span className="font-bold">Giới tính:</span>{" "}
                            {profileDetail?.gender || "Chưa có dữ liệu"}
                          </div>
                          <div className="mb-2 text-gray-900 dark:text-white">
                            <span className="font-bold">Sinh ngày:</span>{" "}
                            {profileDetail?.birthday
                              ? dayjs(profileDetail?.birthday).format(
                                  "DD/MM/YYYY"
                                )
                              : "Chưa có dữ liệu"}
                          </div>
                          <div className="mb-2 text-gray-900 dark:text-white">
                            <span className="font-bold">Nhập ngũ:</span>{" "}
                            {profileDetail?.dateOfEnlistment
                              ? dayjs(profileDetail?.dateOfEnlistment).format(
                                  "DD/MM/YYYY"
                                )
                              : "Chưa có dữ liệu"}
                          </div>
                          <div className="mb-2 text-gray-900 dark:text-white">
                            <span className="font-bold">Ngày ra trường:</span>{" "}
                            {profileDetail?.graduationDate
                              ? dayjs(profileDetail?.graduationDate).format(
                                  "DD/MM/YYYY"
                                )
                              : "Chưa có dữ liệu"}
                          </div>
                          <div className="mb-2 text-gray-900 dark:text-white">
                            <span className="font-bold">Trường:</span>{" "}
                            {profileUniversity?.universityName ||
                              profileDetail?.university?.universityName ||
                              profileDetail?.university ||
                              "Chưa có dữ liệu"}
                          </div>
                          <div className="mb-2 text-gray-900 dark:text-white">
                            <span className="font-bold">
                              Khoa/Viện quản lý:
                            </span>{" "}
                            {profileOrganization?.organizationName ||
                              profileDetail?.organization?.organizationName ||
                              profileDetail?.organization ||
                              "Chưa có dữ liệu"}
                          </div>
                          <div className="mb-2 text-gray-900 dark:text-white">
                            <span className="font-bold">Trình độ đào tạo:</span>{" "}
                            {profileDetail?.education_level?.levelName ||
                              "Chưa có dữ liệu"}
                          </div>
                          <div className="mb-2 text-gray-900 dark:text-white">
                            <span className="font-bold">Lớp:</span>{" "}
                            {profileClass?.className ||
                              profileDetail?.class?.className ||
                              profileDetail?.class ||
                              "Chưa có dữ liệu"}
                          </div>
                          <div className="mb-2 text-gray-900 dark:text-white">
                            <span className="font-bold">Số điện thoại:</span>{" "}
                            {profileDetail?.phoneNumber || "Chưa có dữ liệu"}
                          </div>

                          <div className="mb-2 text-gray-900 dark:text-white">
                            <span className="font-bold">Số CCCD:</span>{" "}
                            {profileDetail?.cccdNumber || "Chưa có dữ liệu"}
                          </div>
                          <div className="mb-2 text-gray-900 dark:text-white">
                            <span className="font-bold">Số thẻ Đảng viên:</span>{" "}
                            {profileDetail?.partyMemberCardNumber ||
                              "Chưa có dữ liệu"}
                          </div>
                        </div>
                        <div className="w-full md:w-1/2 pl-4">
                          {/* <div className="text-lg font-semibold text-indigo-600 dark:text-indigo-400 mb-2">
                            THÔNG TIN CÁ NHÂN
                          </div> */}

                          <div className="mb-2 text-gray-900 dark:text-white">
                            <span className="font-bold">Đơn vị:</span>{" "}
                            {profileDetail?.unit || "Chưa có dữ liệu"}
                          </div>
                          <div className="mb-2 text-gray-900 dark:text-white">
                            <span className="font-bold">Cấp bậc:</span>{" "}
                            {profileDetail?.rank || "Chưa có dữ liệu"}
                          </div>
                          <div className="mb-2 text-gray-900 dark:text-white">
                            <span className="font-bold">Chức vụ:</span>{" "}
                            {profileDetail?.positionGovernment ||
                              "Chưa có dữ liệu"}
                          </div>
                          <div className="mb-2 text-gray-900 dark:text-white">
                            <span className="font-bold">Đảng viên dự bị:</span>{" "}
                            {profileDetail?.probationaryPartyMember
                              ? dayjs(
                                  profileDetail?.probationaryPartyMember
                                ).format("DD/MM/YYYY")
                              : "Không"}
                          </div>
                          <div className="mb-2 text-gray-900 dark:text-white">
                            <span className="font-bold">
                              Đảng viên chính thức:
                            </span>{" "}
                            {profileDetail?.fullPartyMember
                              ? dayjs(profileDetail?.fullPartyMember).format(
                                  "DD/MM/YYYY"
                                )
                              : "Không"}
                          </div>
                          <div className="mb-2 text-gray-900 dark:text-white">
                            <span className="font-bold">Chức vụ đảng:</span>{" "}
                            {profileDetail?.positionParty || "Không"}
                          </div>

                          <div className="mb-2 text-gray-900 dark:text-white">
                            <span className="font-bold">Dân tộc:</span>{" "}
                            {profileDetail?.ethnicity || "Chưa có dữ liệu"}
                          </div>
                          <div className="mb-2 text-gray-900 dark:text-white">
                            <span className="font-bold">Tôn giáo:</span>{" "}
                            {profileDetail?.religion || "Chưa có dữ liệu"}
                          </div>
                          <div className="mb-2 text-gray-900 dark:text-white">
                            <span className="font-bold">Quê quán:</span>{" "}
                            {profileDetail?.hometown || "Chưa có dữ liệu"}
                          </div>
                          <div className="mb-2 text-gray-900 dark:text-white">
                            <span className="font-bold">Nơi ở hiện nay:</span>{" "}
                            {profileDetail?.currentAddress || "Chưa có dữ liệu"}
                          </div>
                          <div className="mb-2 text-gray-900 dark:text-white">
                            <span className="font-bold">Nơi sinh:</span>{" "}
                            {profileDetail?.placeOfBirth || "Chưa có dữ liệu"}
                          </div>
                        </div>
                      </div>

                      {/* Thông tin gia đình */}
                      <div className="mt-8 w-full border-t border-gray-200 dark:border-gray-600 pt-8 px-6">
                        <div className="text-lg font-semibold text-indigo-600 dark:text-indigo-400 mb-6">
                          THÔNG TIN NGƯỜI THÂN
                        </div>
                        {profileDetail?.familyMembers &&
                        profileDetail.familyMembers.length > 0 ? (
                          <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                            {profileDetail.familyMembers.map(
                              (member, index) => (
                                <div
                                  key={index}
                                  className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-600 hover:shadow-md transition-shadow duration-200"
                                >
                                  <div className="mb-2 text-gray-900 dark:text-white">
                                    <span className="font-bold">Quan hệ:</span>{" "}
                                    {member.relationship || "Chưa có dữ liệu"}
                                  </div>
                                  <div className="mb-2 text-gray-900 dark:text-white">
                                    <span className="font-bold">
                                      Họ và tên:
                                    </span>{" "}
                                    {member.fullName || "Chưa có dữ liệu"}
                                  </div>
                                  <div className="mb-2 text-gray-900 dark:text-white">
                                    <span className="font-bold">
                                      Ngày sinh:
                                    </span>{" "}
                                    {member.birthday
                                      ? dayjs(member.birthday).format(
                                          "DD/MM/YYYY"
                                        )
                                      : "Chưa có dữ liệu"}
                                  </div>
                                  <div className="mb-2 text-gray-900 dark:text-white">
                                    <span className="font-bold">
                                      Nghề nghiệp:
                                    </span>{" "}
                                    {member.occupation || "Chưa có dữ liệu"}
                                  </div>
                                </div>
                              )
                            )}
                          </div>
                        ) : (
                          <div className="text-center py-8">
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
                                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                                />
                              </svg>
                              <p className="text-lg font-medium text-gray-500 dark:text-gray-400">
                                Chưa có dữ liệu
                              </p>
                              <p className="text-sm text-gray-400 dark:text-gray-500">
                                Học viên chưa có thông tin người thân
                              </p>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Yếu tố nước ngoài */}
                      <div className="mt-8 w-full border-t border-gray-200 dark:border-gray-600 pt-8 px-6">
                        <div className="text-lg font-semibold text-indigo-600 dark:text-indigo-400 mb-6">
                          MỐI QUAN HỆ CÓ YẾU TỐ NƯỚC NGOÀI
                        </div>
                        {profileDetail?.foreignRelations &&
                        profileDetail.foreignRelations.length > 0 ? (
                          <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                            {profileDetail.foreignRelations.map(
                              (relation, index) => (
                                <div
                                  key={index}
                                  className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-600 hover:shadow-md transition-shadow duration-200"
                                >
                                  <div className="mb-2 text-gray-900 dark:text-white">
                                    <span className="font-bold">Quan hệ:</span>{" "}
                                    {relation.relationship || "Chưa có dữ liệu"}
                                  </div>
                                  <div className="mb-2 text-gray-900 dark:text-white">
                                    <span className="font-bold">
                                      Họ và tên:
                                    </span>{" "}
                                    {relation.fullName || "Chưa có dữ liệu"}
                                  </div>
                                  <div className="mb-2 text-gray-900 dark:text-white">
                                    <span className="font-bold">
                                      Ngày sinh:
                                    </span>{" "}
                                    {relation.birthday
                                      ? dayjs(relation.birthday).format(
                                          "DD/MM/YYYY"
                                        )
                                      : "Chưa có dữ liệu"}
                                  </div>
                                  <div className="mb-2 text-gray-900 dark:text-white">
                                    <span className="font-bold">Quốc gia:</span>{" "}
                                    {relation.country || "Chưa có dữ liệu"}
                                  </div>
                                  <div className="mb-2 text-gray-900 dark:text-white">
                                    <span className="font-bold">Lý do:</span>{" "}
                                    {relation.reason || "Chưa có dữ liệu"}
                                  </div>
                                  <div className="mb-2 text-gray-900 dark:text-white">
                                    <span className="font-bold">
                                      Quốc tịch:
                                    </span>{" "}
                                    {relation.nationality || "Chưa có dữ liệu"}
                                  </div>
                                </div>
                              )
                            )}
                          </div>
                        ) : (
                          <div className="text-center py-8">
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
                                  d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                              </svg>
                              <p className="text-lg font-medium text-gray-500 dark:text-gray-400">
                                Chưa có dữ liệu
                              </p>
                              <p className="text-sm text-gray-400 dark:text-gray-500">
                                Học viên chưa có mối quan hệ nước ngoài
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
        <div className="flex-1">
          <div className="w-full pt-20 pl-5">
            <nav className="flex" aria-label="Breadcrumb">
              <ol className="inline-flex items-center space-x-1 md:space-x-2 rtl:space-x-reverse">
                <li className="inline-flex items-center">
                  <Link
                    href="/admin"
                    className="inline-flex items-center text-sm font-medium hover:text-blue-600 dark:text-gray-400 dark:hover:text-white"
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
                      Danh sách học viên
                    </div>
                  </div>
                </li>
              </ol>
            </nav>
          </div>
          {showFormAdd && (
            <>
              <div className="bg-slate-400 dark:bg-gray-900 z-10 opacity-50 fixed top-0 left-0 right-0 bottom-0"></div>
              <div
                tabIndex="-1"
                aria-hidden="true"
                className="fixed top-0 right-0 left-0 z-10 justify-center items-center"
              >
                <div className="bg-white dark:bg-gray-800 rounded-lg relative mt-20 mx-auto max-w-3xl max-h-[86vh] overflow-y-auto">
                  <div className="relative z-20 bg-white dark:bg-gray-800 rounded-lg shadow">
                    <div className="w-full">
                      <div className="flex items-center justify-between p-3 border-b rounded-t dark:border-gray-600">
                        <h3 className="text-xl font-semibold dark:text-white mx-auto">
                          THÊM HỌC VIÊN
                        </h3>
                        <button
                          type="button"
                          onClick={closeForm}
                          className="end-2.5 text-gray-400 bg-transparent hover:bg-gray-200 hover:text-custom rounded-lg text-sm w-8 h-8 inline-flex justify-center items-center dark:hover:bg-gray-600 dark:hover:text-white"
                          data-modal-hide="authentication-modal"
                        >
                          <svg
                            className="w-3 h-3"
                            aria-hidden="true"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 14 14"
                          >
                            <path
                              stroke="currentColor"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6"
                            />
                          </svg>
                          <span className="sr-only">Close modal</span>
                        </button>
                      </div>

                      <div className="w-full max-w-3xl p-5">
                        <form onSubmit={handleAddFormData}>
                          <div className="grid gap-6 mb-6 md:grid-cols-2">
                            <div>
                              <label
                                htmlFor="username"
                                className="block mb-2 text-sm font-medium dark:text-white"
                              >
                                Tên đăng nhập
                              </label>
                              <input
                                type="text"
                                id="username"
                                value={addFormData.username}
                                onChange={(e) =>
                                  setAddFormData({
                                    ...addFormData,
                                    username: e.target.value,
                                  })
                                }
                                className="bg-gray-50 border border-gray-300 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                                placeholder="vd: DucTA"
                                required
                              />
                            </div>

                            <div>
                              <label
                                htmlFor="password"
                                className="block mb-2 text-sm font-medium dark:text-white"
                              >
                                Mật khẩu
                              </label>
                              <input
                                type="text"
                                id="password"
                                value={addFormData.password}
                                onChange={(e) =>
                                  setAddFormData({
                                    ...addFormData,
                                    password: e.target.value,
                                  })
                                }
                                className="bg-gray-50 border border-gray-300 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                                placeholder="vd: 02022002"
                                required
                              />
                            </div>

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
                                value={addFormData.studentId}
                                onChange={(e) =>
                                  setAddFormData({
                                    ...addFormData,
                                    studentId: e.target.value,
                                  })
                                }
                                className="bg-gray-50 border border-gray-300 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                                placeholder="vd: 20200001"
                                required
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
                                value={addFormData.avatar}
                                onChange={(e) =>
                                  setAddFormData({
                                    ...addFormData,
                                    avatar: e.target.value,
                                  })
                                }
                                className="bg-gray-50 border border-gray-300 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                                placeholder="vd: https://example.com/avatar.jpg"
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
                                value={addFormData.fullName}
                                onChange={(e) =>
                                  setAddFormData({
                                    ...addFormData,
                                    fullName: e.target.value,
                                  })
                                }
                                className="bg-gray-50 border border-gray-300 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                                placeholder="vd: Nguyễn Văn X"
                                required
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
                                value={addFormData.phoneNumber}
                                onChange={(e) =>
                                  setAddFormData({
                                    ...addFormData,
                                    phoneNumber: e.target.value,
                                  })
                                }
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
                                value={addFormData.gender}
                                onChange={(e) =>
                                  setAddFormData({
                                    ...addFormData,
                                    gender: e.target.value,
                                  })
                                }
                                className="bg-gray-50 border border-gray-300 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 pr-10 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                              >
                                <option value="">Chọn giới tính</option>
                                <option value="Nam">Nam</option>
                                <option value="Nữ">Nữ</option>
                              </select>
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
                                value={addFormData.cccdNumber}
                                onChange={(e) =>
                                  setAddFormData({
                                    ...addFormData,
                                    cccdNumber: e.target.value,
                                  })
                                }
                                className="bg-gray-50 border border-gray-300 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                                placeholder="vd: 012345678901"
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
                                value={addFormData.partyMemberCardNumber}
                                onChange={(e) =>
                                  setAddFormData({
                                    ...addFormData,
                                    partyMemberCardNumber: e.target.value,
                                  })
                                }
                                className="bg-gray-50 border border-gray-300 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                                placeholder="vd: 123456789"
                              />
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
                                value={addFormData.unit}
                                onChange={(e) =>
                                  setAddFormData({
                                    ...addFormData,
                                    unit: e.target.value,
                                  })
                                }
                                className="bg-gray-50 border border-gray-300 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 pr-10 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                                required
                              >
                                <option value="">Chọn đơn vị</option>
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
                                selected={addFormData.birthday}
                                onChange={(date) =>
                                  setAddFormData({
                                    ...addFormData,
                                    birthday: date,
                                  })
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
                                value={addFormData.rank}
                                onChange={(e) =>
                                  setAddFormData({
                                    ...addFormData,
                                    rank: e.target.value,
                                  })
                                }
                                className="bg-gray-50 border border-gray-300 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                              >
                                <option value="">Chọn cấp bậc</option>
                                <option value="Binh nhì">Binh nhì</option>
                                <option value="Binh nhất">Binh nhất</option>
                                <option value="Hạ Sỹ">Hạ Sỹ</option>
                                <option value="Trung sỹ">Trung sỹ</option>
                                <option value="Thượng sỹ">Thượng sỹ</option>
                              </select>
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
                                value={
                                  addFormData.positionGovernment || "Học viên"
                                }
                                onChange={(e) =>
                                  setAddFormData({
                                    ...addFormData,
                                    positionGovernment: e.target.value,
                                  })
                                }
                                className="bg-gray-50 border border-gray-300 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 pr-10 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                              >
                                <option value="Học viên">Học viên</option>
                                <option value="Lớp phó">Lớp phó</option>
                                <option value="Lớp trưởng">Lớp trưởng</option>
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
                                selected={addFormData.dateOfEnlistment}
                                onChange={(date) =>
                                  setAddFormData({
                                    ...addFormData,
                                    dateOfEnlistment: date,
                                  })
                                }
                                dateFormat="dd/MM/yyyy"
                                className="bg-gray-50 border w-full border-gray-300 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                                placeholderText="Ngày/Tháng/Năm"
                                wrapperClassName="w-full"
                                required
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
                                selected={addFormData.probationaryPartyMember}
                                onChange={(date) =>
                                  setAddFormData({
                                    ...addFormData,
                                    probationaryPartyMember: date,
                                  })
                                }
                                dateFormat="dd/MM/yyyy"
                                className="bg-gray-50 border w-full border-gray-300 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                                placeholderText="Ngày/Tháng/Năm"
                                wrapperClassName="w-full"
                              />
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
                                  setSelectedOrganization(null);
                                  setSelectedLevel(null);
                                  setSelectedClass(null);
                                  setOrganizations([]);
                                  setEducationLevels([]);
                                  setClasses([]);

                                  if (uni) {
                                    const organizations =
                                      await fetchOrganizations(uni.id);
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
                                htmlFor="fullPartyMember"
                                className="block mb-2 text-sm font-medium dark:text-white"
                              >
                                Đảng viên chính thức
                              </label>
                              <DatePicker
                                id="fullPartyMember"
                                selected={addFormData.fullPartyMember}
                                onChange={(date) =>
                                  setAddFormData({
                                    ...addFormData,
                                    fullPartyMember: date,
                                  })
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
                                  setSelectedOrganization(selectedOrg.id);
                                  setSelectedLevel(null);
                                  setSelectedClass(null);
                                  setEducationLevels([]);
                                  setClasses([]);

                                  if (selectedOrg) {
                                    const educationLevels =
                                      await fetchEducationLevels(
                                        selectedOrg.id
                                      );
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
                                htmlFor="positionParty"
                                className="block mb-2 text-sm font-medium dark:text-white"
                              >
                                Chức vụ đảng
                              </label>
                              <select
                                id="positionParty"
                                value={addFormData.positionParty}
                                onChange={(e) =>
                                  setAddFormData({
                                    ...addFormData,
                                    positionParty: e.target.value,
                                  })
                                }
                                className="bg-gray-50 border border-gray-300 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 pr-10 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                              >
                                <option value="Không">Không</option>
                                <option value="Đảng viên">Đảng viên</option>
                                <option value="Phó bí thư chi bộ">
                                  Phó bí thư chi bộ
                                </option>
                                <option value="Bí thư chi bộ">
                                  Bí thư chi bộ
                                </option>
                              </select>
                            </div>

                            <div>
                              <label
                                htmlFor="level"
                                className="block mb-2 text-sm font-medium dark:text-white"
                              >
                                Trình độ đào tạo
                              </label>
                              <select
                                id="level"
                                value={selectedLevel || ""}
                                onChange={async (e) => {
                                  const selectedLevelObj = educationLevels.find(
                                    (level) => level.id === e.target.value
                                  );
                                  setSelectedLevel(selectedLevelObj.id);
                                  setSelectedClass(null);
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
                                htmlFor="graduationDate"
                                className="block mb-2 text-sm font-medium dark:text-white"
                              >
                                Ngày ra trường
                              </label>
                              <DatePicker
                                id="graduationDate"
                                selected={addFormData.graduationDate}
                                onChange={(date) =>
                                  setAddFormData({
                                    ...addFormData,
                                    graduationDate: date,
                                  })
                                }
                                dateFormat="dd/MM/yyyy"
                                className="bg-gray-50 border w-full border-gray-300 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                                placeholderText="Ngày/Tháng/Năm"
                                wrapperClassName="w-full"
                              />
                            </div>

                            <div>
                              <label
                                htmlFor="class"
                                className="block mb-2 text-sm font-medium dark:text-white"
                              >
                                Lớp
                              </label>
                              <select
                                id="class"
                                value={selectedClass || ""}
                                onChange={(e) => {
                                  setSelectedClass(e.target.value);
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
                                htmlFor="enrollment"
                                className="block mb-2 text-sm font-medium dark:text-white"
                              >
                                Năm nhập học
                              </label>
                              <input
                                type="number"
                                id="enrollment"
                                value={addFormData.enrollment}
                                onChange={(e) =>
                                  setAddFormData({
                                    ...addFormData,
                                    enrollment: e.target.value
                                      ? parseInt(e.target.value) || ""
                                      : "",
                                  })
                                }
                                className="bg-gray-50 border border-gray-300 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                                placeholder="vd: 2020"
                                min="2000"
                                max="2030"
                                required
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
                                value={addFormData.hometown}
                                onChange={(e) =>
                                  setAddFormData({
                                    ...addFormData,
                                    hometown: e.target.value,
                                  })
                                }
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
                                value={addFormData.ethnicity}
                                onChange={(e) =>
                                  setAddFormData({
                                    ...addFormData,
                                    ethnicity: e.target.value,
                                  })
                                }
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
                                value={addFormData.religion}
                                onChange={(e) =>
                                  setAddFormData({
                                    ...addFormData,
                                    religion: e.target.value,
                                  })
                                }
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
                                value={addFormData.currentAddress}
                                onChange={(e) =>
                                  setAddFormData({
                                    ...addFormData,
                                    currentAddress: e.target.value,
                                  })
                                }
                                className="bg-gray-50 border border-gray-300 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                                placeholder="vd: Hà Nội"
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
                                value={addFormData.placeOfBirth}
                                onChange={(e) =>
                                  setAddFormData({
                                    ...addFormData,
                                    placeOfBirth: e.target.value,
                                  })
                                }
                                className="bg-gray-50 border border-gray-300 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                                placeholder="vd: Hà Nội"
                              />
                            </div>
                          </div>

                          {/* Thông tin gia đình */}
                          <div className="mt-6 border-t pt-6">
                            <div className="flex justify-between items-center mb-4">
                              <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                                Thông tin người thân
                              </h4>
                              <button
                                type="button"
                                onClick={() =>
                                  setShowFamilyForm(!showFamilyForm)
                                }
                                className="px-3 py-1 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 transition-colors duration-200"
                              >
                                {showFamilyForm ? "Ẩn form" : "Thêm người thân"}
                              </button>
                            </div>

                            {showFamilyForm && (
                              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 p-4 rounded-lg mb-4 shadow-sm">
                                <div className="grid gap-4 md:grid-cols-2 w-full">
                                  <div className="w-full">
                                    <label className="block mb-2 text-sm font-medium dark:text-white">
                                      Quan hệ
                                    </label>
                                    <input
                                      type="text"
                                      id="relationship"
                                      value={familyFormData.relationship}
                                      onChange={handleFamilyChange}
                                      className="bg-gray-50 border border-gray-300 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                                      placeholder="vd: Bố, Mẹ, Anh, Chị..."
                                    />
                                  </div>
                                  <div className="w-full">
                                    <label className="block mb-2 text-sm font-medium dark:text-white">
                                      Họ và tên
                                    </label>
                                    <input
                                      type="text"
                                      id="fullName"
                                      value={familyFormData.fullName}
                                      onChange={handleFamilyChange}
                                      className="bg-gray-50 border border-gray-300 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                                      placeholder="vd: Nguyễn Văn A"
                                    />
                                  </div>
                                  <div className="w-full">
                                    <label className="block mb-2 text-sm font-medium dark:text-white">
                                      Ngày sinh
                                    </label>
                                    <DatePicker
                                      selected={familyFormData.birthday}
                                      onChange={(date) =>
                                        handleFamilyDateChange("birthday", date)
                                      }
                                      dateFormat="dd/MM/yyyy"
                                      className="bg-gray-50 border border-gray-300 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                                      placeholderText="Ngày/Tháng/Năm"
                                      wrapperClassName="w-full"
                                    />
                                  </div>
                                  <div className="w-full">
                                    <label className="block mb-2 text-sm font-medium dark:text-white">
                                      Nghề nghiệp
                                    </label>
                                    <input
                                      type="text"
                                      id="occupation"
                                      value={familyFormData.occupation}
                                      onChange={handleFamilyChange}
                                      className="bg-gray-50 border border-gray-300 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                                      placeholder="vd: Làm ruộng, Công nhân..."
                                    />
                                  </div>
                                </div>
                                <div className="mt-4 flex justify-end">
                                  <button
                                    type="button"
                                    onClick={addFamilyMember}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors duration-200"
                                  >
                                    Thêm vào danh sách
                                  </button>
                                </div>
                              </div>
                            )}

                            {familyMembers.length > 0 && (
                              <div className="space-y-2">
                                {familyMembers.map((member) => (
                                  <div
                                    key={member.id}
                                    className="flex justify-between items-center bg-gray-100 dark:bg-gray-600 p-3 rounded-lg"
                                  >
                                    <div>
                                      <span className="font-medium">
                                        {member.relationship}:{" "}
                                      </span>
                                      <span>{member.fullName}</span>
                                      <span className="text-gray-500 ml-2">
                                        (
                                        {member.birthday
                                          ? dayjs(member.birthday).format(
                                              "DD/MM/YYYY"
                                            )
                                          : "Chưa có ngày sinh"}
                                        )
                                      </span>
                                      <span className="text-gray-500 ml-2">
                                        - {member.occupation}
                                      </span>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        removeFamilyMember(member.id)
                                      }
                                      className="text-red-600 hover:text-red-800"
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
                                          strokeWidth="2"
                                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                        />
                                      </svg>
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Yếu tố nước ngoài */}
                          <div className="mt-6 border-t pt-6">
                            <div className="flex justify-between items-center mb-4">
                              <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                                Mối quan hệ có yếu tố nước ngoài
                              </h4>
                              <button
                                type="button"
                                onClick={() =>
                                  setShowForeignForm(!showForeignForm)
                                }
                                className="px-3 py-1 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 transition-colors duration-200"
                              >
                                {showForeignForm
                                  ? "Ẩn form"
                                  : "Thêm mối quan hệ"}
                              </button>
                            </div>

                            {showForeignForm && (
                              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 p-4 rounded-lg mb-4 shadow-sm">
                                <div className="grid gap-4 md:grid-cols-2 w-full">
                                  <div>
                                    <label className="block mb-2 text-sm font-medium dark:text-white">
                                      Quan hệ
                                    </label>
                                    <input
                                      type="text"
                                      id="relationship"
                                      value={foreignFormData.relationship}
                                      onChange={handleForeignChange}
                                      className="bg-gray-50 border border-gray-300 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                                      placeholder="vd: Chú ruột, Cô ruột..."
                                    />
                                  </div>
                                  <div>
                                    <label className="block mb-2 text-sm font-medium dark:text-white">
                                      Họ và tên
                                    </label>
                                    <input
                                      type="text"
                                      id="fullName"
                                      value={foreignFormData.fullName}
                                      onChange={handleForeignChange}
                                      className="bg-gray-50 border border-gray-300 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                                      placeholder="vd: Nguyễn Văn B"
                                    />
                                  </div>
                                  <div>
                                    <label className="block mb-2 text-sm font-medium dark:text-white">
                                      Ngày sinh
                                    </label>
                                    <DatePicker
                                      selected={foreignFormData.birthday}
                                      onChange={(date) =>
                                        handleForeignDateChange(
                                          "birthday",
                                          date
                                        )
                                      }
                                      dateFormat="dd/MM/yyyy"
                                      className="bg-gray-50 border border-gray-300 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
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
                                      id="country"
                                      value={foreignFormData.country}
                                      onChange={handleForeignChange}
                                      className="bg-gray-50 border border-gray-300 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                                      placeholder="vd: Liên bang Nga, Ý..."
                                    />
                                  </div>
                                  <div>
                                    <label className="block mb-2 text-sm font-medium dark:text-white">
                                      Lý do
                                    </label>
                                    <input
                                      type="text"
                                      id="reason"
                                      value={foreignFormData.reason}
                                      onChange={handleForeignChange}
                                      className="bg-gray-50 border border-gray-300 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                                      placeholder="vd: Định cư, Du học..."
                                    />
                                  </div>
                                  <div>
                                    <label className="block mb-2 text-sm font-medium dark:text-white">
                                      Quốc tịch
                                    </label>
                                    <input
                                      type="text"
                                      id="nationality"
                                      value={foreignFormData.nationality}
                                      onChange={handleForeignChange}
                                      className="bg-gray-50 border border-gray-300 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                                      placeholder="vd: Nga, Ý..."
                                    />
                                  </div>
                                </div>
                                <div className="mt-4 flex justify-end">
                                  <button
                                    type="button"
                                    onClick={addForeignRelation}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors duration-200"
                                  >
                                    Thêm vào danh sách
                                  </button>
                                </div>
                              </div>
                            )}

                            {foreignRelations.length > 0 && (
                              <div className="space-y-2">
                                {foreignRelations.map((relation) => (
                                  <div
                                    key={relation.id}
                                    className="flex justify-between items-center bg-gray-100 dark:bg-gray-600 p-3 rounded-lg"
                                  >
                                    <div>
                                      <span className="font-medium">
                                        {relation.relationship}:{" "}
                                      </span>
                                      <span>{relation.fullName}</span>
                                      <span className="text-gray-500 ml-2">
                                        (
                                        {relation.birthday
                                          ? dayjs(relation.birthday).format(
                                              "DD/MM/YYYY"
                                            )
                                          : "Chưa có ngày sinh"}
                                        )
                                      </span>
                                      <span className="text-gray-500 ml-2">
                                        - {relation.country}
                                      </span>
                                      <span className="text-gray-500 ml-2">
                                        ({relation.reason})
                                      </span>
                                      <span className="text-gray-500 ml-2">
                                        - {relation.nationality}
                                      </span>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        removeForeignRelation(relation.id)
                                      }
                                      className="text-red-600 hover:text-red-800"
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
                                          strokeWidth="2"
                                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                        />
                                      </svg>
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>

                          <div className="grid justify-items-end">
                            <button
                              type="submit"
                              disabled={isLoading}
                              className={`text-white font-medium rounded-lg text-sm w-full sm:w-auto px-5 py-2.5 transition-colors duration-200 ${
                                isLoading
                                  ? "bg-gray-400 cursor-not-allowed"
                                  : "bg-green-600 hover:bg-green-700 focus:ring-4 focus:outline-none focus:ring-green-300 dark:bg-green-600 dark:hover:bg-green-700 dark:focus:ring-green-800"
                              }`}
                            >
                              {isLoading ? (
                                <div className="flex items-center">
                                  <svg
                                    className="animate-spin -ml-1 mr-3 h-4 w-4 text-white"
                                    xmlns="http://www.w3.org/2000/svg"
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
                                  Đang xử lý...
                                </div>
                              ) : (
                                "Thêm"
                              )}
                            </button>
                          </div>
                        </form>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
          <div className="w-full pt-8 pb-5 pl-5 pr-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg w-full pr-5 shadow-lg">
              {showConfirm &&
                (() => {
                  const studentToDelete = profile?.students?.find(
                    (student) => student.id === id
                  );
                  return (
                    <div className="fixed top-0 left-0 w-full h-full bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
                      <div className="relative p-6 text-center bg-gray-800 rounded-lg shadow-lg sm:p-8 max-w-md w-full max-h-[90vh] overflow-y-auto">
                        <button
                          onClick={handleCancelDelete}
                          type="button"
                          className="absolute top-2.5 right-2.5 bg-transparent hover:bg-gray-600 rounded-lg text-sm p-1.5 ml-auto inline-flex items-center text-white hover:text-white"
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

                        <div className="flex flex-col items-center mb-6">
                          <div className="w-16 h-16 mb-4 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                            <img
                              src={
                                studentToDelete?.avatar ||
                                "https://i.pinimg.com/736x/81/09/3a/81093a0429e25b0ff579fa41aa96c421.jpg"
                              }
                              alt="Avatar"
                              className="w-full h-full object-cover"
                            />
                          </div>

                          <svg
                            className="w-12 h-12 mb-4 text-red-500"
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

                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                            Xác nhận xóa học viên
                          </h3>

                          {studentToDelete && (
                            <div className="bg-gray-700 rounded-lg p-4 w-full text-left">
                              <div className="space-y-2">
                                <div>
                                  <span className="font-medium text-gray-300">
                                    Họ tên:
                                  </span>
                                  <span className="ml-2 text-white">
                                    {studentToDelete.fullName}
                                  </span>
                                </div>
                                <div>
                                  <span className="font-medium text-gray-300">
                                    Mã HV:
                                  </span>
                                  <span className="ml-2 text-white">
                                    {studentToDelete.studentId}
                                  </span>
                                </div>
                                <div>
                                  <span className="font-medium text-gray-300">
                                    Đơn vị:
                                  </span>
                                  <span className="ml-2 text-white">
                                    {studentToDelete.unit}
                                  </span>
                                </div>
                                <div>
                                  <span className="font-medium text-gray-300">
                                    Năm nhập học:
                                  </span>
                                  <span className="ml-2 text-white">
                                    {studentToDelete.enrollment}
                                  </span>
                                </div>
                                {studentToDelete.dateOfEnlistment && (
                                  <div>
                                    <span className="font-medium text-gray-300">
                                      Ngày nhập ngũ:
                                    </span>
                                    <span className="ml-2 text-white">
                                      {dayjs(
                                        studentToDelete.dateOfEnlistment
                                      ).format("DD/MM/YYYY")}
                                    </span>
                                  </div>
                                )}
                                {studentToDelete.graduationDate && (
                                  <div>
                                    <span className="font-medium text-gray-300">
                                      Ngày ra trường:
                                    </span>
                                    <span className="ml-2 text-white">
                                      {dayjs(
                                        studentToDelete.graduationDate
                                      ).format("DD/MM/YYYY")}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          <p className="text-sm text-gray-400 mt-4">
                            Bạn có chắc chắn muốn xóa học viên này? Hành động
                            này không thể hoàn tác.
                          </p>
                        </div>

                        <div className="flex justify-center items-center space-x-4">
                          <button
                            onClick={handleCancelDelete}
                            type="button"
                            className="py-2 px-4 text-sm font-medium bg-gray-700 rounded-lg border border-gray-500 hover:bg-gray-600 focus:ring-4 focus:outline-none focus:ring-gray-600 text-gray-300 hover:text-white focus:z-10"
                          >
                            Hủy
                          </button>
                          <button
                            onClick={() => handleConfirmDelete(id)}
                            type="submit"
                            className="py-2 px-4 text-sm font-medium text-center text-white bg-red-600 rounded-lg hover:bg-red-700 focus:ring-4 focus:outline-none focus:ring-red-300 dark:bg-red-500 dark:hover:bg-red-600 dark:focus:ring-red-900"
                          >
                            Xóa học viên
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              <div className="font-bold pt-5 pl-5 pb-5 flex justify-between border-b border-gray-200 dark:border-gray-700">
                <div className="text-gray-900 dark:text-white">
                  DANH SÁCH HỌC VIÊN {`- NĂM HỌC ${schoolYear}`}
                </div>
                <div className="mr-6 flex space-x-4">
                  <div
                    onClick={handleBulkGraduationUpdate}
                    className="flex space-x-1 hover:text-blue-700 cursor-pointer items-center"
                  >
                    <CarryOutOutlined />
                    <span className="text-sm">Cập nhật học viên ra trường</span>
                  </div>
                  <div
                    onClick={() => router.push("/admin/universities")}
                    className="flex hover:text-blue-700 cursor-pointer items-center"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth="1.5"
                      stroke="currentColor"
                      className="w-5 h-5 mr-1"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5"
                      />
                    </svg>
                    <span className="text-sm">Quản lý Trường</span>
                  </div>
                  <div
                    onClick={async () => {
                      setShowFormAdd(true);
                      // Reset các select động khi mở form add
                      setSelectedUniversity(null);
                      setSelectedOrganization(null);
                      setSelectedLevel(null);
                      setSelectedClass(null);
                      setOrganizations([]);
                      setEducationLevels([]);
                      setClasses([]);

                      // Gọi API lấy danh sách universities khi mở form
                      await fetchUniversities();
                    }}
                    className="flex hover:text-blue-700 cursor-pointer items-center"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth="1.5"
                      stroke="currentColor"
                      className="w-5 h-5 mr-1"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M18 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0ZM3 19.235v-.11a6.375 6.375 0 0 1 12.75 0v.109A12.318 12.318 0 0 1 9.374 21c-2.331 0-4.512-.645-6.374-1.766Z"
                      />
                    </svg>
                    <span className="text-sm">Thêm Học viên</span>
                  </div>
                  <div
                    onClick={async () => {
                      if (!schoolYear) {
                        try {
                          const token = localStorage.getItem("token");
                          const response = await axios.get(
                            `${BASE_URL}/commander/political-management/school-years`,
                            {
                              headers: {
                                token: `Bearer ${token}`,
                              },
                            }
                          );

                          if (
                            response.data.success &&
                            response.data.schoolYears.length > 0
                          ) {
                            const availableYears =
                              response.data.schoolYears.join(", ");
                            handleNotify(
                              "error",
                              "Lỗi!",
                              `Vui lòng chọn năm học trước khi xuất file. Các năm học có sẵn: ${availableYears}`
                            );
                          } else {
                            handleNotify(
                              "error",
                              "Lỗi!",
                              "Vui lòng chọn năm học trước khi xuất file"
                            );
                          }
                        } catch (error) {
                          handleNotify(
                            "error",
                            "Lỗi!",
                            "Vui lòng chọn năm học trước khi xuất file"
                          );
                        }
                        return;
                      }
                      try {
                        const token = localStorage.getItem("token");
                        const response = await axios.get(
                          `${BASE_URL}/commander/political-management/excel?schoolYear=${schoolYear}`,
                          {
                            headers: {
                              token: `Bearer ${token}`,
                            },
                            responseType: "blob",
                          }
                        );

                        const url = window.URL.createObjectURL(
                          new Blob([response.data])
                        );
                        const link = document.createElement("a");
                        link.href = url;
                        link.setAttribute(
                          "download",
                          `quan-ly-chinh-tri-noi-bo-${schoolYear}.xlsx`
                        );
                        document.body.appendChild(link);
                        link.click();
                        link.remove();
                        window.URL.revokeObjectURL(url);

                        handleNotify(
                          "success",
                          "Thành công!",
                          "Xuất file Excel thành công"
                        );
                      } catch (error) {
                        console.error("Lỗi khi xuất file:", error);
                        const errorMessage =
                          error.response?.data?.message ||
                          "Không thể xuất file Excel";
                        handleNotify("error", "Lỗi!", errorMessage);
                      }
                    }}
                    className="flex hover:text-blue-700 cursor-pointer items-center"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth="1.5"
                      stroke="currentColor"
                      className="w-5 h-5 mr-1"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"
                      />
                    </svg>
                    <span className="text-sm">Xuất Excel QLCTNB</span>
                  </div>
                </div>
              </div>
              <div className="w-full pt-2 ml-5 pr-5 pb-5">
                <form
                  className="flex items-end pb-4"
                  onSubmit={(e) => handleSearch(e)}
                >
                  <div className="flex items-center gap-3 flex-wrap">
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
                    <div>
                      <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                        Đơn vị
                      </label>
                      <Select
                        value={unit || ""}
                        onChange={(val) => setUnit(val || "")}
                        placeholder="Chọn đơn vị"
                        style={{ width: 200, height: 36 }}
                        allowClear
                        options={[
                          { value: "", label: "Tất cả" },
                          { value: "L1 - H5", label: "L1 - H5" },
                          { value: "L2 - H5", label: "L2 - H5" },
                          { value: "L3 - H5", label: "L3 - H5" },
                          { value: "L4 - H5", label: "L4 - H5" },
                          { value: "L5 - H5", label: "L5 - H5" },
                          { value: "L6 - H5", label: "L6 - H5" },
                        ]}
                      />
                    </div>
                    <div>
                      <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                        Năm học
                      </label>
                      <Select
                        value={schoolYear || schoolYears[0] || ""}
                        onChange={(val) =>
                          handleSchoolYearChange(val || schoolYears[0] || "")
                        }
                        placeholder="Chọn năm học"
                        style={{ width: 200, height: 36 }}
                        allowClear
                        options={schoolYears.map((year) => ({
                          value: year,
                          label: year,
                        }))}
                      />
                    </div>
                    <div>
                      <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300 opacity-0">
                        &nbsp;
                      </label>
                      <button
                        type="submit"
                        className="h-9 bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 text-white font-medium rounded-lg text-sm w-full sm:w-auto px-5 transition-colors duration-200"
                      >
                        Tìm kiếm
                      </button>
                    </div>
                    <div>
                      <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300 opacity-0">
                        &nbsp;
                      </label>
                      <button
                        type="button"
                        onClick={handleClearFilter}
                        className="h-9 bg-gray-500 hover:bg-gray-600 text-white font-medium rounded-lg text-sm px-5 transition-colors duration-200"
                      >
                        Xóa bộ lọc
                      </button>
                    </div>
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
                          STT
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
                          Đơn vị
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
                      {profile?.students && profile.students.length > 0 ? (
                        profile.students.map((item, index) => (
                          <tr
                            className="hover:cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
                            key={item.id}
                          >
                            <td
                              onClick={() => handleRowClick(item.id)}
                              className="px-6 py-4 whitespace-nowrap text-gray-900 dark:text-white border-r border-gray-200 dark:border-gray-600 text-center"
                            >
                              <div className="text-sm font-medium">
                                {(currentPage - 1) * pageSize + index + 1}
                              </div>
                            </td>
                            <td
                              onClick={() => handleRowClick(item.id)}
                              className="px-6 py-4 whitespace-nowrap text-gray-900 dark:text-white border-r border-gray-200 dark:border-gray-600"
                            >
                              <div className="flex items-center">
                                <div className="flex-shrink-0 h-10 w-10">
                                  <img
                                    className="h-10 w-10 rounded-full"
                                    src={item.avatar}
                                    alt="avatar"
                                  />
                                </div>
                                <div className="ml-4">
                                  <div className="text-sm font-bold text-gray-900 dark:text-white">
                                    {item.fullName}
                                  </div>
                                  <div className="text-sm text-gray-600 dark:text-gray-400">
                                    Mã HV: {item.studentId}
                                  </div>
                                  <div className="text-sm text-gray-600 dark:text-gray-400">
                                    CCCD: {item.cccdNumber || "Chưa có dữ liệu"}
                                  </div>
                                  <div className="text-sm text-gray-600 dark:text-gray-400">
                                    Lớp:{" "}
                                    {item.class?.className || "Chưa có dữ liệu"}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td
                              onClick={() => handleRowClick(item.id)}
                              className="px-6 py-4 whitespace-nowrap text-gray-900 dark:text-white border-r border-gray-200 dark:border-gray-600 text-center"
                            >
                              <div className="text-sm">{item.rank}</div>
                            </td>
                            <td
                              onClick={() => handleRowClick(item.id)}
                              className="px-6 py-4 whitespace-nowrap text-gray-900 dark:text-white border-r border-gray-200 dark:border-gray-600 text-center"
                            >
                              <div className="text-sm">{item.unit}</div>
                            </td>
                            <td
                              onClick={() => handleRowClick(item.id)}
                              className="px-6 py-4 whitespace-nowrap text-gray-900 dark:text-white border-r border-gray-200 dark:border-gray-600 text-center"
                            >
                              <div className="text-sm">
                                {item.positionGovernment}
                              </div>
                            </td>
                            <td
                              onClick={() => handleRowClick(item.id)}
                              className="px-6 py-4 whitespace-nowrap text-gray-900 dark:text-white border-r border-gray-200 dark:border-gray-600 text-center"
                            >
                              <div className="text-sm">{item.phoneNumber}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-center">
                              <div className="flex justify-center space-x-2">
                                <button
                                  data-modal-target="authentication-modal"
                                  data-modal-toggle="authentication-modal"
                                  type="button"
                                  onClick={() => editStudent(item.id)}
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
                            colSpan="7"
                            className="text-center py-8 text-gray-500 dark:text-gray-400"
                          >
                            <div className="flex flex-col items-center">
                              <TeamOutlined
                                style={{ fontSize: "32px", color: "#9CA3AF" }}
                              />
                              <p className="text-lg font-medium mt-4">
                                Không có dữ liệu
                              </p>
                              <p className="text-sm">
                                Không tìm thấy học viên nào
                              </p>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="flex justify-between items-center mr-5 pb-5 mt-2">
                <div className="flex items-center space-x-2">
                  <span className="text-sm ml-6 text-gray-700 dark:text-gray-300">
                    Hiển thị:
                  </span>
                  <Select
                    value={pageSize}
                    onChange={handlePageSizeChange}
                    style={{ width: 80 }}
                    options={[
                      { value: 5, label: "5" },
                      { value: 10, label: "10" },
                      { value: 20, label: "20" },
                      { value: 50, label: "50" },
                      { value: 100, label: "100" },
                    ]}
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    học viên/trang
                  </span>
                </div>
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Trang {currentPage} / {profile?.totalPages || 1}(
                    {profile?.totalStudents || 0} học viên)
                  </span>
                  <nav aria-label="Page navigation example">
                    <ul className="list-style-none flex">
                      <li>
                        <Link
                          className={`relative mr-1 block rounded bg-transparent px-3 py-1.5 font-bold text-sm transition-all duration-300 ${
                            currentPage <= 1
                              ? "opacity-50 cursor-not-allowed"
                              : "hover:bg-blue-200"
                          }`}
                          href={
                            currentPage <= 1
                              ? `/admin/list-user?page=1`
                              : `/admin/list-user?page=${currentPage - 1}`
                          }
                          onClick={(e) => {
                            e.preventDefault();
                            if (currentPage > 1) {
                              setCurrentPage(currentPage - 1);
                              // Cập nhật URL
                              const url = new URL(window.location);
                              url.searchParams.set(
                                "page",
                                (currentPage - 1).toString()
                              );
                              window.history.pushState({}, "", url);
                            }
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
                        { length: profile?.totalPages },
                        (_, index) => index + 1
                      ).map((pageNumber) => (
                        <li key={pageNumber}>
                          <Link
                            className={`relative mr-1 block rounded bg-transparent px-3 py-1.5 font-bold text-sm transition-all duration-300 ${
                              currentPage === pageNumber
                                ? "bg-blue-200"
                                : "hover:bg-blue-200"
                            }`}
                            href={`/admin/list-user?page=${pageNumber}`}
                            onClick={(e) => {
                              e.preventDefault();
                              setCurrentPage(pageNumber);
                              // Cập nhật URL
                              const url = new URL(window.location);
                              url.searchParams.set(
                                "page",
                                pageNumber.toString()
                              );
                              window.history.pushState({}, "", url);
                            }}
                          >
                            {pageNumber}
                          </Link>
                        </li>
                      ))}
                      <li>
                        <Link
                          className={`relative block rounded bg-transparent px-3 py-1.5 font-bold text-sm transition-all duration-300 ${
                            currentPage >= profile?.totalPages
                              ? "opacity-50 cursor-not-allowed"
                              : "hover:bg-blue-200"
                          }`}
                          href={
                            currentPage >= profile?.totalPages
                              ? `/admin/list-user?page=${profile?.totalPages}`
                              : `/admin/list-user?page=${currentPage + 1}`
                          }
                          onClick={(e) => {
                            e.preventDefault();
                            if (currentPage < profile?.totalPages) {
                              setCurrentPage(currentPage + 1);
                              // Cập nhật URL
                              const url = new URL(window.location);
                              url.searchParams.set(
                                "page",
                                (currentPage + 1).toString()
                              );
                              window.history.pushState({}, "", url);
                            }
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
            </div>
          </div>
        </div>
        {showForm && (
          <>
            <div className="bg-slate-400 dark:bg-gray-900 z-10 opacity-50 fixed top-0 left-0 right-0 bottom-0"></div>
            <div
              id="authentication-modal"
              tabIndex="-1"
              aria-hidden="true"
              className="fixed top-0 right-0 left-0 z-10 justify-center items-center"
            >
              <div className="bg-white dark:bg-gray-800 rounded-lg relative mt-24 mx-auto max-w-3xl max-h-[80vh] overflow-y-auto">
                <div className="relative z-20 bg-white dark:bg-gray-800 rounded-lg shadow">
                  <div className="w-full">
                    <div className="flex items-center justify-between p-3 border-b rounded-t dark:border-gray-600">
                      <h3 className="text-xl font-semibold dark:text-white mx-auto">
                        CHỈNH SỬA THÔNG TIN HỌC VIÊN
                      </h3>
                      <button
                        type="button"
                        onClick={closeForm}
                        className="end-2.5 text-gray-400 bg-transparent hover:bg-gray-200 hover:text-custom rounded-lg text-sm w-8 h-8 inline-flex justify-center items-center dark:hover:bg-gray-600 dark:hover:text-white"
                        data-modal-hide="authentication-modal"
                      >
                        <svg
                          className="w-3 h-3"
                          aria-hidden="true"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 14 14"
                        >
                          <path
                            stroke="currentColor"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6"
                          />
                        </svg>
                        <span className="sr-only">Close modal</span>
                      </button>
                    </div>

                    <div className="w-full max-w-3xl p-5">
                      <form
                        onSubmit={(e) =>
                          handleSubmit(e, selectedStudentId, profile?.students)
                        }
                      >
                        <div className="grid gap-6 mb-6 md:grid-cols-2">
                          {/* Thông tin cơ bản */}
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
                              htmlFor="enrollment"
                              className="block mb-2 text-sm font-medium dark:text-white"
                            >
                              Năm nhập học
                            </label>
                            <input
                              type="number"
                              id="enrollment"
                              value={formData.enrollment}
                              onChange={handleChange}
                              className="bg-gray-50 border border-gray-300 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                              placeholder="vd: 2020"
                              min="2000"
                              max="2030"
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
                              htmlFor="probationaryPartyMember"
                              className="block mb-2 text-sm font-medium dark:text-white"
                            >
                              Đảng viên dự bị
                            </label>
                            <DatePicker
                              id="probationaryPartyMember"
                              selected={formData.probationaryPartyMember}
                              onChange={(date) =>
                                handleChangeDate(
                                  "probationaryPartyMember",
                                  date
                                )
                              }
                              dateFormat="dd/MM/yyyy"
                              className="bg-gray-50 border w-full border-gray-300 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                              placeholderText="Ngày/Tháng/Năm"
                              wrapperClassName="w-full"
                            />
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
                                setSelectedOrganization(null);
                                setSelectedLevel(null);
                                setSelectedClass(null);
                                setOrganizations([]);
                                setEducationLevels([]);
                                setClasses([]);

                                if (uni) {
                                  const organizations =
                                    await fetchOrganizations(uni.id);
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
                                setSelectedOrganization(selectedOrg.id);
                                setSelectedLevel(null);
                                setSelectedClass(null);
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
                              <option value="Bí thư chi bộ">
                                Bí thư chi bộ
                              </option>
                            </select>
                          </div>
                          <div>
                            <label
                              htmlFor="level"
                              className="block mb-2 text-sm font-medium dark:text-white"
                            >
                              Trình độ đào tạo
                            </label>
                            <select
                              id="level"
                              value={selectedLevel || ""}
                              onChange={async (e) => {
                                const selectedLevelObj = educationLevels.find(
                                  (level) => level.id === e.target.value
                                );
                                setSelectedLevel(selectedLevelObj.id);
                                setSelectedClass(null);
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
                              htmlFor="class"
                              className="block mb-2 text-sm font-medium dark:text-white"
                            >
                              Lớp
                            </label>
                            <select
                              id="class"
                              value={selectedClass || ""}
                              onChange={(e) => {
                                const selectedClassObj = classes.find(
                                  (cls) => cls.id === e.target.value
                                );
                                setSelectedClass(selectedClassObj.id);
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
                        </div>

                        {/* Thông tin gia đình */}
                        <div className="mt-6 border-t pt-6">
                          <div className="flex justify-between items-center mb-4">
                            <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                              Thông tin người thân
                            </h4>
                            <button
                              type="button"
                              onClick={() => setShowFamilyForm(!showFamilyForm)}
                              className="px-3 py-1 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 transition-colors duration-200"
                            >
                              {showFamilyForm ? "Ẩn form" : "Thêm người thân"}
                            </button>
                          </div>

                          {showFamilyForm && (
                            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 p-4 rounded-lg mb-4 shadow-sm">
                              <div className="grid gap-4 md:grid-cols-2 w-full">
                                <div className="w-full">
                                  <label className="block mb-2 text-sm font-medium dark:text-white">
                                    Quan hệ
                                  </label>
                                  <input
                                    type="text"
                                    id="relationship"
                                    value={familyFormData.relationship}
                                    onChange={handleFamilyChange}
                                    className="bg-gray-50 border border-gray-300 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                                    placeholder="vd: Bố, Mẹ, Anh, Chị..."
                                  />
                                </div>
                                <div className="w-full">
                                  <label className="block mb-2 text-sm font-medium dark:text-white">
                                    Họ và tên
                                  </label>
                                  <input
                                    type="text"
                                    id="fullName"
                                    value={familyFormData.fullName}
                                    onChange={handleFamilyChange}
                                    className="bg-gray-50 border border-gray-300 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                                    placeholder="vd: Nguyễn Văn A"
                                  />
                                </div>
                                <div className="w-full">
                                  <label className="block mb-2 text-sm font-medium dark:text-white">
                                    Ngày sinh
                                  </label>
                                  <DatePicker
                                    selected={familyFormData.birthday}
                                    onChange={(date) =>
                                      handleFamilyDateChange("birthday", date)
                                    }
                                    dateFormat="dd/MM/yyyy"
                                    className="bg-gray-50 border border-gray-300 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                                    placeholderText="Ngày/Tháng/Năm"
                                    wrapperClassName="w-full"
                                  />
                                </div>
                                <div className="w-full">
                                  <label className="block mb-2 text-sm font-medium dark:text-white">
                                    Nghề nghiệp
                                  </label>
                                  <input
                                    type="text"
                                    id="occupation"
                                    value={familyFormData.occupation}
                                    onChange={handleFamilyChange}
                                    className="bg-gray-50 border border-gray-300 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                                    placeholder="vd: Làm ruộng, Công nhân..."
                                  />
                                </div>
                              </div>
                              <div className="mt-4 flex justify-end">
                                <button
                                  type="button"
                                  onClick={addFamilyMember}
                                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors duration-200"
                                >
                                  Thêm vào danh sách
                                </button>
                              </div>
                            </div>
                          )}

                          {familyMembers.length > 0 && (
                            <div className="space-y-2">
                              {familyMembers.map((member) => (
                                <div
                                  key={member.id}
                                  className="flex justify-between items-center bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 p-4 rounded-lg shadow-sm"
                                >
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                      <span className="font-semibold text-blue-700 dark:text-blue-300">
                                        {member.relationship}:
                                      </span>
                                      <span className="font-medium text-gray-900 dark:text-white">
                                        {member.fullName}
                                      </span>
                                    </div>
                                    <div className="text-sm text-gray-600 dark:text-gray-300">
                                      <span className="font-medium">
                                        Ngày sinh:
                                      </span>{" "}
                                      {member.birthday
                                        ? dayjs(member.birthday).format(
                                            "DD/MM/YYYY"
                                          )
                                        : "Chưa có ngày sinh"}
                                      {" • "}
                                      <span className="font-medium">
                                        Nghề nghiệp:
                                      </span>{" "}
                                      {member.occupation}
                                    </div>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      removeFamilyMember(member.id)
                                    }
                                    className="text-red-600 hover:text-red-800"
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
                                        strokeWidth="2"
                                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                      />
                                    </svg>
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Yếu tố nước ngoài */}
                        <div className="mt-6 border-t pt-6">
                          <div className="flex justify-between items-center mb-4">
                            <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                              Mối quan hệ có yếu tố nước ngoài
                            </h4>
                            <button
                              type="button"
                              onClick={() =>
                                setShowForeignForm(!showForeignForm)
                              }
                              className="px-3 py-1 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 transition-colors duration-200"
                            >
                              {showForeignForm ? "Ẩn form" : "Thêm mối quan hệ"}
                            </button>
                          </div>

                          {showForeignForm && (
                            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 p-4 rounded-lg mb-4 shadow-sm">
                              <div className="grid gap-4 md:grid-cols-2 w-full">
                                <div className="w-full">
                                  <label className="block mb-2 text-sm font-medium dark:text-white">
                                    Quan hệ
                                  </label>
                                  <input
                                    type="text"
                                    id="relationship"
                                    value={foreignFormData.relationship}
                                    onChange={handleForeignChange}
                                    className="bg-gray-50 border border-gray-300 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                                    placeholder="vd: Chú ruột, Cô ruột..."
                                  />
                                </div>
                                <div className="w-full">
                                  <label className="block mb-2 text-sm font-medium dark:text-white">
                                    Họ và tên
                                  </label>
                                  <input
                                    type="text"
                                    id="fullName"
                                    value={foreignFormData.fullName}
                                    onChange={handleForeignChange}
                                    className="bg-gray-50 border border-gray-300 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                                    placeholder="vd: Nguyễn Văn B"
                                  />
                                </div>
                                <div className="w-full">
                                  <label className="block mb-2 text-sm font-medium dark:text-white">
                                    Ngày sinh
                                  </label>
                                  <DatePicker
                                    selected={foreignFormData.birthday}
                                    onChange={(date) =>
                                      handleForeignDateChange("birthday", date)
                                    }
                                    dateFormat="dd/MM/yyyy"
                                    className="bg-gray-50 border border-gray-300 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                                    placeholderText="Ngày/Tháng/Năm"
                                    wrapperClassName="w-full"
                                  />
                                </div>
                                <div className="w-full">
                                  <label className="block mb-2 text-sm font-medium dark:text-white">
                                    Quốc gia
                                  </label>
                                  <input
                                    type="text"
                                    id="country"
                                    value={foreignFormData.country}
                                    onChange={handleForeignChange}
                                    className="bg-gray-50 border border-gray-300 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                                    placeholder="vd: Liên bang Nga, Ý..."
                                  />
                                </div>
                                <div className="w-full">
                                  <label className="block mb-2 text-sm font-medium dark:text-white">
                                    Lý do
                                  </label>
                                  <input
                                    type="text"
                                    id="reason"
                                    value={foreignFormData.reason}
                                    onChange={handleForeignChange}
                                    className="bg-gray-50 border border-gray-300 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                                    placeholder="vd: Định cư, Du học..."
                                  />
                                </div>
                                <div className="w-full">
                                  <label className="block mb-2 text-sm font-medium dark:text-white">
                                    Quốc tịch
                                  </label>
                                  <input
                                    type="text"
                                    id="nationality"
                                    value={foreignFormData.nationality}
                                    onChange={handleForeignChange}
                                    className="bg-gray-50 border border-gray-300 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                                    placeholder="vd: Nga, Ý..."
                                  />
                                </div>
                              </div>
                              <div className="mt-4 flex justify-end">
                                <button
                                  type="button"
                                  onClick={addForeignRelation}
                                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors duration-200"
                                >
                                  Thêm vào danh sách
                                </button>
                              </div>
                            </div>
                          )}

                          {foreignRelations.length > 0 && (
                            <div className="space-y-2">
                              {foreignRelations.map((relation) => (
                                <div
                                  key={relation.id}
                                  className="flex justify-between items-center bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-700 p-4 rounded-lg shadow-sm"
                                >
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                      <span className="font-semibold text-purple-700 dark:text-purple-300">
                                        {relation.relationship}:
                                      </span>
                                      <span className="font-medium text-gray-900 dark:text-white">
                                        {relation.fullName}
                                      </span>
                                    </div>
                                    <div className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                                      <div>
                                        <span className="font-medium">
                                          Ngày sinh:
                                        </span>{" "}
                                        {relation.birthday
                                          ? dayjs(relation.birthday).format(
                                              "DD/MM/YYYY"
                                            )
                                          : "Chưa có ngày sinh"}
                                      </div>
                                      <div>
                                        <span className="font-medium">
                                          Quốc gia:
                                        </span>{" "}
                                        {relation.country}
                                        {" • "}
                                        <span className="font-medium">
                                          Lý do:
                                        </span>{" "}
                                        {relation.reason}
                                        {" • "}
                                        <span className="font-medium">
                                          Quốc tịch:
                                        </span>{" "}
                                        {relation.nationality}
                                      </div>
                                    </div>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      removeForeignRelation(relation.id)
                                    }
                                    className="text-red-600 hover:text-red-800"
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
                                        strokeWidth="2"
                                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                      />
                                    </svg>
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="grid justify-items-end">
                          <button
                            type="submit"
                            disabled={isLoading}
                            className={`text-white mt-2 font-medium rounded-lg text-sm w-full sm:w-auto px-5 py-2.5 transition-colors duration-200 ${
                              isLoading
                                ? "bg-gray-400 cursor-not-allowed"
                                : "bg-green-600 hover:bg-green-700 focus:ring-4 focus:outline-none focus:ring-green-300 dark:bg-green-600 dark:hover:bg-green-700 dark:focus:ring-green-800"
                            }`}
                          >
                            {isLoading ? (
                              <div className="flex items-center">
                                <svg
                                  className="animate-spin -ml-1 mr-3 h-4 w-4 text-white"
                                  xmlns="http://www.w3.org/2000/svg"
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
                                Đang cập nhật...
                              </div>
                            ) : (
                              "Cập nhật"
                            )}
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Modal cập nhật đồng loạt ngày ra trường */}
        {showGraduationModal && (
          <div className="fixed inset-0 flex items-center justify-center z-50 p-2 sm:p-4 mt-14">
            <div className="bg-black bg-opacity-50 inset-0 fixed"></div>
            <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl lg:max-w-6xl xl:max-w-7xl max-h-[85vh] sm:max-h-[88vh] overflow-y-auto">
              <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Cập nhật đồng loạt ngày ra trường
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Chọn ngày ra trường hoặc để trống để đánh dấu sinh viên chưa
                    ra trường
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowGraduationModal(false);
                    setSelectedStudents([]);
                    setGraduationDate(null);
                  }}
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

              <div className="p-4 sm:p-6 flex flex-col">
                {/* Bộ lọc và tìm kiếm */}
                <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Lọc theo đơn vị
                    </label>
                    <select
                      value={graduationFilterUnit}
                      onChange={(e) => setGraduationFilterUnit(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="all">Tất cả các đơn vị</option>
                      <option value="L1 - H5">L1 - H5</option>
                      <option value="L2 - H5">L2 - H5</option>
                      <option value="L3 - H5">L3 - H5</option>
                      <option value="L4 - H5">L4 - H5</option>
                      <option value="L5 - H5">L5 - H5</option>
                      <option value="L6 - H5">L6 - H5</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Lọc theo năm học
                    </label>
                    <select
                      value={graduationFilterSchoolYear}
                      onChange={(e) =>
                        setGraduationFilterSchoolYear(e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      {schoolYears.map((year) => (
                        <option key={year} value={year}>
                          {year}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Tìm kiếm theo tên/mã sinh viên
                    </label>
                    <input
                      type="text"
                      value={graduationSearchTerm}
                      onChange={(e) => setGraduationSearchTerm(e.target.value)}
                      placeholder="Nhập tên hoặc mã sinh viên..."
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Ngày ra trường
                    </label>
                    <DatePicker
                      selected={graduationDate}
                      onChange={(date) => {
                        setGraduationDate(date);
                        setGraduationDateError(""); // Clear error when user selects a date
                      }}
                      dateFormat="dd/MM/yyyy"
                      placeholderText="Chọn ngày ra trường"
                      isClearable={true}
                      className={`w-full px-2 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        graduationDateError
                          ? "border-red-500 focus:ring-red-500 focus:border-red-500"
                          : "border-gray-300 dark:border-gray-600"
                      }`}
                    />
                    {graduationDateError ? (
                      <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                        {graduationDateError}
                      </p>
                    ) : (
                      <p className="text-xm text-gray-500 dark:text-gray-400 mt-1">
                        Để trống nếu chưa ra trường
                      </p>
                    )}
                  </div>
                </div>

                {/* Nút chọn tất cả và bỏ chọn tất cả */}
                <div className="mb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0">
                  <div className="flex gap-2">
                    <button
                      onClick={handleSelectAllStudents}
                      disabled={
                        filteredAndSortedStudents.length === 0 ||
                        filteredAndSortedStudents.every((s) =>
                          selectedStudents.includes(s.id)
                        )
                      }
                      className={
                        `px-4 py-2 rounded-lg transition-colors duration-200 text-sm text-white ` +
                        (filteredAndSortedStudents.length === 0 ||
                        filteredAndSortedStudents.every((s) =>
                          selectedStudents.includes(s.id)
                        )
                          ? "bg-blue-400 cursor-not-allowed opacity-60"
                          : "bg-blue-600 hover:bg-blue-700")
                      }
                    >
                      Chọn tất cả
                    </button>
                    <button
                      onClick={handleDeselectAllStudents}
                      disabled={
                        filteredAndSortedStudents.length === 0 ||
                        filteredAndSortedStudents.every(
                          (s) => !selectedStudents.includes(s.id)
                        )
                      }
                      className={
                        `px-4 py-2 rounded-lg transition-colors duration-200 text-sm text-white ` +
                        (filteredAndSortedStudents.length === 0 ||
                        filteredAndSortedStudents.every(
                          (s) => !selectedStudents.includes(s.id)
                        )
                          ? "bg-gray-400 cursor-not-allowed opacity-60"
                          : "bg-gray-600 hover:bg-gray-700")
                      }
                    >
                      Bỏ chọn tất cả
                    </button>
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Đã chọn: {selectedStudents.length} /{" "}
                    {filteredAndSortedStudents.length} sinh viên
                  </div>
                </div>

                {/* Danh sách tất cả sinh viên */}
                <div className="max-h-72 sm:max-h-80 lg:max-h-[28rem] overflow-y-auto border border-gray-200 dark:border-gray-600 rounded-lg">
                  {filteredAndSortedStudents.length > 0 ? (
                    <div className="grid gap-2 p-4">
                      {filteredAndSortedStudents.map((student) => (
                        <div
                          key={student.id}
                          className={`flex items-center p-2 sm:p-3 rounded-lg border cursor-pointer transition-colors duration-200 ${
                            selectedStudents.includes(student.id)
                              ? "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700"
                              : student.graduationDate
                              ? "bg-gray-200 dark:bg-gray-700 border-gray-400 dark:border-gray-500 opacity-75"
                              : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
                          }`}
                          onClick={() => handleSelectStudent(student.id)}
                        >
                          <input
                            type="checkbox"
                            checked={selectedStudents.includes(student.id)}
                            onChange={() => handleSelectStudent(student.id)}
                            className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center">
                              <img
                                src={
                                  student.avatar ||
                                  "https://i.pinimg.com/736x/81/09/3a/81093a0429e25b0ff579fa41aa96c421.jpg"
                                }
                                alt="avatar"
                                className="w-8 h-8 sm:w-10 sm:h-10 rounded-full mr-2 sm:mr-3 flex-shrink-0"
                              />
                              <div className="min-w-0 flex-1">
                                <div className="font-medium text-gray-900 dark:text-white flex items-center flex-wrap gap-1">
                                  <span className="truncate">
                                    {student.fullName}
                                  </span>
                                  {student.graduationDate && (
                                    <span className="px-2 py-1 text-xs bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-full flex-shrink-0">
                                      Đã ra trường
                                    </span>
                                  )}
                                </div>
                                <div className="text-sm text-gray-600 dark:text-gray-400 truncate">
                                  Mã HV: {student.studentId} • Đơn vị:{" "}
                                  {student.unit} • Năm: {student.enrollment}
                                </div>
                                <div className="text-sm text-gray-600 dark:text-gray-400 truncate">
                                  Nhập ngũ:{" "}
                                  {student.dateOfEnlistment
                                    ? dayjs(student.dateOfEnlistment).format(
                                        "DD/MM/YYYY"
                                      )
                                    : "Chưa có"}
                                  {student.graduationDate && (
                                    <span className="ml-2 text-gray-500">
                                      • Ra trường:{" "}
                                      {dayjs(student.graduationDate).format(
                                        "DD/MM/YYYY"
                                      )}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
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
                            d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
                          />
                        </svg>
                        <p className="text-lg font-medium text-gray-500 dark:text-gray-400">
                          Không có sinh viên nào
                        </p>
                        <p className="text-sm text-gray-400 dark:text-gray-500">
                          Không tìm thấy sinh viên nào phù hợp với bộ lọc
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Nút cập nhật */}
                <div className="mt-6 pt-6 flex flex-col sm:flex-row justify-end gap-3 sm:space-x-3">
                  <button
                    onClick={() => {
                      setShowGraduationModal(false);
                      setSelectedStudents([]);
                      setGraduationDate(null);
                    }}
                    className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors duration-200"
                  >
                    Hủy
                  </button>
                  <button
                    onClick={handleBulkGraduationSubmit}
                    disabled={
                      isLoading ||
                      selectedStudents.length === 0 ||
                      getValidationMessage()
                    }
                    className={`px-4 py-2 rounded-lg transition-colors duration-200 text-sm sm:text-base ${
                      isLoading ||
                      selectedStudents.length === 0 ||
                      getValidationMessage()
                        ? "bg-gray-400 cursor-not-allowed text-gray-600"
                        : "bg-blue-600 hover:bg-blue-700 text-white"
                    }`}
                  >
                    {isLoading ? (
                      <div className="flex items-center">
                        <svg
                          className="animate-spin -ml-1 mr-3 h-4 w-4 text-white"
                          xmlns="http://www.w3.org/2000/svg"
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
                        Đang cập nhật...
                      </div>
                    ) : (
                      <div className="flex flex-col items-center">
                        <span>
                          {graduationDate
                            ? "Cập nhật ngày ra trường"
                            : "Cập nhật chưa ra trường"}
                        </span>
                        <span className="text-xs opacity-90">
                          ({selectedStudents.length} sinh viên)
                        </span>
                      </div>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        <style jsx global>{`
          .ant-select .ant-select-selector {
            background-color: rgb(255 255 255) !important;
            border-color: rgb(209 213 219) !important; /* gray-300 */
            color: rgb(17 24 39) !important; /* gray-900 */
          }
          .ant-select .ant-select-selection-placeholder {
            color: rgb(107 114 128) !important; /* gray-500 */
          }
          /* Tokens chỉ áp dụng cho chế độ multiple */
          .ant-select-multiple .ant-select-selection-item {
            background-color: rgb(239 246 255) !important; /* blue-50 */
            border-color: rgb(191 219 254) !important; /* blue-200 */
            color: rgb(30 58 138) !important; /* blue-900 */
          }
          /* Single select: chữ rõ, không nền */
          .ant-select-single .ant-select-selector .ant-select-selection-item {
            background-color: transparent !important;
            color: rgb(17 24 39) !important; /* gray-900 */
            font-weight: 600;
          }
          .ant-select-arrow,
          .ant-select-clear {
            color: rgb(107 114 128);
          }
          .ant-select-dropdown {
            background-color: rgb(255 255 255) !important;
            border: 1px solid rgb(229 231 235) !important; /* gray-200 */
          }
          .ant-select-item {
            color: rgb(17 24 39) !important;
          }
          .ant-select-item-option-active:not(.ant-select-item-option-disabled) {
            background-color: rgba(
              59,
              130,
              246,
              0.12
            ) !important; /* blue-500/12 */
            color: rgb(30 58 138) !important;
          }
          .ant-select-item-option-selected:not(
              .ant-select-item-option-disabled
            ) {
            background-color: rgba(
              59,
              130,
              246,
              0.18
            ) !important; /* blue-500/18 */
            color: rgb(30 58 138) !important;
            font-weight: 600 !important;
          }

          .dark .ant-select .ant-select-selector {
            background-color: rgb(55 65 81) !important; /* gray-700 */
            border-color: rgb(75 85 99) !important; /* gray-600 */
            color: rgb(255 255 255) !important;
          }
          .dark .ant-select .ant-select-selection-placeholder {
            color: rgb(156 163 175) !important; /* gray-400 */
          }
          /* Tokens ở chế độ multiple trong dark */
          .dark .ant-select-multiple .ant-select-selection-item {
            background-color: rgb(75 85 99) !important; /* gray-600 */
            border-color: rgb(75 85 99) !important;
            color: rgb(255 255 255) !important;
          }
          /* Single select dark: chữ rõ, không nền */
          .dark
            .ant-select-single
            .ant-select-selector
            .ant-select-selection-item {
            background-color: transparent !important;
            color: rgb(255 255 255) !important;
            font-weight: 600;
          }
          .dark .ant-select-arrow,
          .dark .ant-select-clear {
            color: rgb(209 213 219) !important; /* gray-300 */
          }
          .dark .ant-select-dropdown {
            background-color: rgb(31 41 55) !important; /* gray-800 */
            border-color: rgb(55 65 81) !important; /* gray-700 */
          }
          .dark .ant-select-item {
            color: rgb(255 255 255) !important;
          }
          .dark
            .ant-select-item-option-active:not(
              .ant-select-item-option-disabled
            ) {
            background-color: rgba(
              59,
              130,
              246,
              0.25
            ) !important; /* blue-500/25 */
            color: rgb(255 255 255) !important;
          }
          .dark
            .ant-select-item-option-selected:not(
              .ant-select-item-option-disabled
            ) {
            background-color: rgba(
              59,
              130,
              246,
              0.35
            ) !important; /* blue-500/35 */
            color: rgb(255 255 255) !important;
            font-weight: 600 !important;
          }
        `}</style>
      </div>
    </>
  );
};

export default ListUser;
