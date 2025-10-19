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

const LearningInformation = () => {
  const [tuitionFee, setTuitionFee] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [selectedSemester, setSelectedSemester] = useState("");
  const [learningResult, setLearningResult] = useState([]);
  const [semesterResults, setSemesterResults] = useState([]);
  const [timeTable, setTimeTable] = useState([]);
  const [showConfirmTimeTable, setShowConfirmTimeTable] = useState(false);
  const [showConfirmLearn, setShowConfirmLearn] = useState(false);
  const [showConfirmFee, setShowConfirmFee] = useState(false);
  const [timeTableId, setTimeTableId] = useState(null);
  const [learnId, setLearnId] = useState(null);
  const [feeId, setFeeId] = useState(null);
  const [showFormAddTuitionFee, setShowFormAddTuitionFee] = useState(false);
  const [showFormAddTimeTable, setShowFormAddTimeTable] = useState(false);
  const [showFormAddLearn, setShowFormAddLearn] = useState(false);
  const [isOpenTuitionFee, setIsOpenTuitionFee] = useState(false);
  const [isOpenTimeTable, setIsOpenTimeTable] = useState(false);
  const [isOpenLearningResult, setIsOpenLearningResult] = useState(false);
  const [editedTuitionFee, setEditedTuitionFee] = useState({});
  const [editedTimeTable, setEditedTimeTable] = useState({});
  const [editedLearningResult, setEditedLearningResult] = useState({});
  const [editingSemester, setEditingSemester] = useState(null);
  const [viewingSemester, setViewingSemester] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [addFormDataTuitionFee, setAddFormDataTuitionFee] = useState({});
  const [addFormDataTimeTable, setAddFormDataTimeTable] = useState({});
  const [addFormDataLearn, setAddFormDataLearn] = useState({});
  const [showGradeModal, setShowGradeModal] = useState(false);
  const [gradeSubjects, setGradeSubjects] = useState([
    {
      subjectCode: "",
      subjectName: "",
      credits: "",
      grade10: "",
    },
  ]);
  const { loading, withLoading } = useLoading(true);
  const [gradeSemesterCode, setGradeSemesterCode] = useState("");
  const searchParams = useSearchParams();
  const currentTab = searchParams?.get("tab") || "time-table";

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

  // Helpers cho nhập KQHT
  const parseTermFromId = (id) => {
    console.log("parseTermFromId input:", id);
    if (!id) return null;
    const semester = semesters.find((s) => s.id === id);
    if (!semester) return null;

    if (semester.code.startsWith("HK")) {
      console.log("parseTermFromId return original:", semester.code);
      return semester.code; // Trả về nguyên string "HK1", "HK2", "HK3"
    }
    if (semester.code.includes(".")) {
      const result = "HK" + semester.code.split(".")[1]; // Chuyển đổi thành "HK1", "HK2", "HK3"
      console.log("parseTermFromId return converted:", result);
      return result;
    }
    console.log("parseTermFromId return null");
    return null;
  };
  const findSchoolYearById = (id) => {
    // Tìm semester theo id
    const s = semesters.find((x) => x.id === id);
    return s?.schoolYear || "";
  };

  // Tính toán GPA và tổng kết
  const calculateSemesterSummary = () => {
    if (!gradeSubjects || gradeSubjects.length === 0) {
      return { totalCredits: 0, gpa4: 0, gpa10: 0 };
    }

    let totalGradePoints4 = 0;
    let totalGradePoints10 = 0;
    let totalCredits = 0;

    gradeSubjects.forEach((subject) => {
      const credits = parseFloat(subject.credits) || 0;
      const grade10 = parseFloat(subject.grade10) || 0;

      if (credits > 0 && !isNaN(grade10)) {
        // Tính điểm chữ từ điểm hệ 10
        let letterGrade = "F";
        if (grade10 >= 9.5) letterGrade = "A+";
        else if (grade10 >= 8.5) letterGrade = "A";
        else if (grade10 >= 8.0) letterGrade = "B+";
        else if (grade10 >= 7.0) letterGrade = "B";
        else if (grade10 >= 6.5) letterGrade = "C+";
        else if (grade10 >= 5.5) letterGrade = "C";
        else if (grade10 >= 5.0) letterGrade = "D+";
        else if (grade10 >= 4.0) letterGrade = "D";

        // Tính điểm hệ 4 từ điểm chữ
        let grade4 = 0.0;
        switch (letterGrade) {
          case "A+":
            grade4 = 4.0;
            break;
          case "A":
            grade4 = 4.0;
            break;
          case "B+":
            grade4 = 3.5;
            break;
          case "B":
            grade4 = 3.0;
            break;
          case "C+":
            grade4 = 2.5;
            break;
          case "C":
            grade4 = 2.0;
            break;
          case "D+":
            grade4 = 1.5;
            break;
          case "D":
            grade4 = 1.0;
            break;
          case "F":
            grade4 = 0.0;
            break;
        }

        totalGradePoints4 += grade4 * credits;
        totalGradePoints10 += grade10 * credits;
        totalCredits += credits;
      }
    });

    const gpa4 = totalCredits > 0 ? totalGradePoints4 / totalCredits : 0;
    const gpa10 = totalCredits > 0 ? totalGradePoints10 / totalCredits : 0;

    return {
      totalCredits,
      gpa4: gpa4.toFixed(2),
      gpa10: gpa10.toFixed(2),
    };
  };
  const addSubjectRow = () => {
    setGradeSubjects((prev) => [
      ...prev,
      {
        subjectCode: "",
        subjectName: "",
        credits: "",
        grade10: "",
      },
    ]);
  };
  const removeSubjectRow = (idx) => {
    setGradeSubjects((prev) => {
      // Cho phép xóa dòng cuối cùng, nhưng sẽ tạo dòng mới trống
      const next = prev.filter((_, i) => i !== idx);

      // Nếu xóa hết dòng, tạo lại 1 dòng trống
      if (next.length === 0) {
        return [
          {
            subjectCode: "",
            subjectName: "",
            credits: "",
            grade10: "",
          },
        ];
      }

      return next;
    });
  };
  const updateSubjectField = (idx, field, value) => {
    setGradeSubjects((prev) => {
      const next = prev.slice();
      next[idx] = { ...next[idx], [field]: value };
      return next;
    });
  };
  const openGradeModal = () => {
    // Reset state khi thêm mới
    setEditingSemester(null);
    setGradeSemesterCode("");
    setGradeSubjects([
      {
        subjectCode: "",
        subjectName: "",
        credits: "",
        grade10: "",
      },
    ]);
    // chọn mặc định kỳ đầu danh sách (đã sắp xếp) nếu chưa có
    if (!gradeSemesterCode) {
      if (semesters && semesters.length > 0) {
        const sortedSemesters = semesters.sort((a, b) => {
          // Sắp xếp theo năm học (mới nhất trước)
          const yearComparison = b.schoolYear.localeCompare(a.schoolYear);
          if (yearComparison !== 0) return yearComparison;

          // Nếu cùng năm, sắp xếp theo học kỳ (lớn nhất trước)
          const semesterA = a.code.includes(".")
            ? parseInt(a.code.split(".")[1])
            : 0;
          const semesterB = b.code.includes(".")
            ? parseInt(b.code.split(".")[1])
            : 0;
          return semesterB - semesterA;
        });
        setGradeSemesterCode(sortedSemesters[0].id);
      }
    }
    setShowGradeModal(true);
  };
  const submitSemesterGrades = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    if (!token) return;
    const userId = jwtDecode(token).id;
    const term = parseTermFromId(gradeSemesterCode);
    const schoolYear = findSchoolYearById(gradeSemesterCode);

    if (!term || !schoolYear) {
      handleNotify("warning", "Thiếu thông tin", "Vui lòng chọn học kỳ hợp lệ");
      return;
    }

    // Validate dữ liệu
    const validSubjects = gradeSubjects.filter(
      (subject) =>
        subject.subjectCode.trim() &&
        subject.subjectName.trim() &&
        subject.credits &&
        subject.grade10 &&
        parseFloat(subject.grade10) >= 0 &&
        parseFloat(subject.grade10) <= 10
    );

    if (validSubjects.length === 0) {
      handleNotify(
        "warning",
        "Thiếu dữ liệu",
        "Vui lòng nhập đầy đủ thông tin môn học và điểm"
      );
      return;
    }

    if (validSubjects.length !== gradeSubjects.length) {
      handleNotify(
        "warning",
        "Dữ liệu không hợp lệ",
        "Vui lòng kiểm tra lại thông tin môn học"
      );
      return;
    }
    try {
      const payload = {
        semester: term,
        schoolYear,
        subjects: gradeSubjects.map((s) => ({
          subjectCode: s.subjectCode.trim(),
          subjectName: s.subjectName.trim(),
          credits: Number(s.credits || 0),
          gradePoint10: Number(s.grade10 || 0),
        })),
      };

      // Kiểm tra xem có đang chỉnh sửa hay thêm mới
      if (editingSemester) {
        // Cập nhật học kỳ hiện có
        await axios.put(
          `${BASE_URL}/grade/${userId}/${term}/${schoolYear}`,
          payload,
          {
            headers: { token: `Bearer ${token}` },
          }
        );
        handleNotify(
          "success",
          "Thành công",
          `Đã cập nhật KQ học tập ${term} - ${schoolYear}`
        );
      } else {
        // Thêm mới học kỳ
        await axios.post(`${BASE_URL}/grade/${userId}`, payload, {
          headers: { token: `Bearer ${token}` },
        });
        handleNotify(
          "success",
          "Thành công",
          `Đã nhập KQ học tập HK${term} - ${schoolYear}`
        );
      }

      setShowGradeModal(false);
      setEditingSemester(null);
      setGradeSubjects([
        {
          subjectCode: "",
          subjectName: "",
          credits: "",
          grade10: "",
        },
      ]);
      // Refresh dữ liệu kết quả học tập
      fetchSemesterResults();
    } catch (err) {
      handleNotify(
        "danger",
        "Lỗi",
        err?.response?.data?.message || "Không thể lưu KQ học tập"
      );
    }
  };

  const handleEditTuitionFee = async (id) => {
    setFeeId(id);
    const token = localStorage.getItem("token");
    try {
      const decoded = jwtDecode(token);
      const res = await axios.get(
        `${BASE_URL}/student/${decoded.id}/tuition-fee`,
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

  const handleEditTimeTable = (id) => {
    const timeTableItem = timeTable.find((item) => item.id === id);
    if (timeTableItem) {
      // Parse time string to startTime and endTime
      let startTime = "";
      let endTime = "";
      if (timeTableItem.time && timeTableItem.time.includes(" - ")) {
        const timeParts = timeTableItem.time.split(" - ");
        startTime = timeParts[0];
        endTime = timeParts[1];
      }

      setEditedTimeTable({
        day: timeTableItem.day || "",
        subject: timeTableItem.subject || "",
        startTime: startTime,
        endTime: endTime,
        classroom: timeTableItem.classroom || "",
        schoolWeek: timeTableItem.schoolWeek || "",
        notes: timeTableItem.notes || "",
        time: timeTableItem.time || "",
      });
    }
    setTimeTableId(id);
    setIsOpenTimeTable(true);
  };

  const handleViewSemesterDetail = (semester) => {
    setViewingSemester(semester);
    setShowDetailModal(true);
  };

  const handleEditLearningResult = (id) => {
    // Tìm học kỳ cần chỉnh sửa
    const semester = semesterResults.find((item) => item.id === id);
    if (semester) {
      setEditingSemester(semester);

      // Tìm semester id tương ứng từ danh sách semesters
      const semesterObj = semesters.find(
        (s) =>
          s.schoolYear === semester.schoolYear &&
          (s.code === semester.semester ||
            (s.code.includes(".") &&
              `HK${s.code.split(".")[1]}` === semester.semester))
      );

      // Điền dữ liệu vào form
      setGradeSemesterCode(semesterObj?.id || semester.semester);
      setGradeSubjects(
        semester.subjects.map((subject) => ({
          subjectCode: subject.subjectCode || "",
          subjectName: subject.subjectName || "",
          credits: subject.credits?.toString() || "",
          grade10: subject.gradePoint10?.toString() || "",
        }))
      );
      setShowGradeModal(true);
    }
  };

  const handleUpdateLearningResult = async (e, learnId) => {
    e.preventDefault();
    const token = localStorage.getItem("token");

    if (token) {
      try {
        const decodedToken = jwtDecode(token);
        await axios.put(
          `${BASE_URL}/student/${decodedToken.id}/learningResult/${learnId}`,
          editedLearningResult,
          {
            headers: {
              token: `Bearer ${token}`,
            },
          }
        );
        handleNotify(
          "success",
          "Thành công!",
          "Chỉnh sửa kết quả học tập thành công"
        );
        setIsOpenLearningResult(false);
        fetchLearningResult();
      } catch (error) {
        const errorMessage =
          error.response?.data?.message ||
          error.response?.data ||
          "Có lỗi xảy ra khi cập nhật kết quả học tập";
        handleNotify("danger", "Lỗi!", errorMessage);
        setIsOpenLearningResult(false);
      }
    }
  };

  const handleUpdateTimeTable = async (e, timeTableId) => {
    e.preventDefault();
    const token = localStorage.getItem("token");

    if (token) {
      // Validate thời gian
      if (editedTimeTable.startTime && editedTimeTable.endTime) {
        const startTime = new Date(
          `2000-01-01T${editedTimeTable.startTime}:00`
        );
        const endTime = new Date(`2000-01-01T${editedTimeTable.endTime}:00`);

        if (startTime >= endTime) {
          handleNotify(
            "danger",
            "Lỗi!",
            "Thời gian bắt đầu phải nhỏ hơn thời gian kết thúc"
          );
          return;
        }
      }

      // Tạo time string từ startTime và endTime
      const timeString =
        editedTimeTable.startTime && editedTimeTable.endTime
          ? `${editedTimeTable.startTime} - ${editedTimeTable.endTime}`
          : editedTimeTable.time || "";

      const formData = {
        ...editedTimeTable,
        time: timeString,
      };

      try {
        const decodedToken = jwtDecode(token);
        const response = await axios.put(
          `${BASE_URL}/student/${decodedToken.id}/time-table/${timeTableId}`,
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
          response.data.message ||
            "Chỉnh sửa lịch học thành công và đã cập nhật lịch cắt cơm tự động"
        );
        setIsOpenTimeTable(false);
        fetchTimeTable();
      } catch (error) {
        console.error("Error updating time table:", error);
        const errorMessage =
          error.response?.data?.message ||
          error.response?.data ||
          "Có lỗi xảy ra khi cập nhật lịch học";
        handleNotify("danger", "Lỗi!", errorMessage);
        setIsOpenTimeTable(false);
      }
    }
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
          `${BASE_URL}/student/${decodedToken.id}/tuitionFee/${tuitionFeeId}`,
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

  const handleAddFormLearn = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    try {
      const response = await axios.post(
        `${BASE_URL}/student/${jwtDecode(token).id}/learning-information`,
        addFormDataLearn,
        {
          headers: {
            token: `Bearer ${token}`,
          },
        }
      );
      handleNotify("success", "Thành công!", "Thêm kết quả học tập thành công");
      setLearningResult([...learningResult, response.data]);
      setShowFormAddLearn(false);
      fetchLearningResult();
    } catch (error) {
      setShowFormAddLearn(false);
      const errorMessage =
        error.response?.data?.message ||
        error.response?.data ||
        "Có lỗi xảy ra khi thêm kết quả học tập";
      handleNotify("danger", "Lỗi!", errorMessage);
    }
  };

  const handleAddFormTimeTable = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");

    // Validate thời gian
    if (addFormDataTimeTable.startTime && addFormDataTimeTable.endTime) {
      const startTime = new Date(
        `2000-01-01T${addFormDataTimeTable.startTime}:00`
      );
      const endTime = new Date(`2000-01-01T${addFormDataTimeTable.endTime}:00`);

      if (startTime >= endTime) {
        handleNotify(
          "danger",
          "Lỗi!",
          "Thời gian bắt đầu phải nhỏ hơn thời gian kết thúc"
        );
        return;
      }
    }

    // Tạo time string từ startTime và endTime
    const timeString =
      addFormDataTimeTable.startTime && addFormDataTimeTable.endTime
        ? `${addFormDataTimeTable.startTime} - ${addFormDataTimeTable.endTime}`
        : addFormDataTimeTable.time || "";

    const formData = {
      ...addFormDataTimeTable,
      time: timeString,
    };

    try {
      const response = await axios.post(
        `${BASE_URL}/student/${jwtDecode(token).id}/time-table`,
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
        response.data.message ||
          "Thêm lịch học thành công và đã cập nhật lịch cắt cơm tự động"
      );
      // Refresh lại toàn bộ danh sách để có scheduleId mới
      fetchTimeTable();
      setShowFormAddTimeTable(false);
      // Reset form
      setAddFormDataTimeTable({});
    } catch (error) {
      setShowFormAddTimeTable(false);
      const errorMessage =
        error.response?.data?.message ||
        error.response?.data ||
        "Có lỗi xảy ra khi thêm lịch học";
      handleNotify("danger", "Lỗi!", errorMessage);
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
        `${BASE_URL}/student/${jwtDecode(token).id}/tuition-fee`,
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

  const handleDeleteTimeTable = (id) => {
    setTimeTableId(id);
    setShowConfirmTimeTable(true);
  };

  const handleDeleteLearn = (id) => {
    setLearnId(id);
    setShowConfirmLearn(true);
  };

  const handleDeleteFee = (id) => {
    setFeeId(id);
    setShowConfirmFee(true);
  };

  const handleConfirmDeleteTimeTable = (timeTableId) => {
    const token = localStorage.getItem("token");

    if (token) {
      axios
        .delete(
          `${BASE_URL}/student/${
            jwtDecode(token).id
          }/time-table/${timeTableId}`,
          {
            headers: {
              token: `Bearer ${token}`,
            },
          }
        )
        .then((response) => {
          setTimeTable(
            timeTable.filter((timeTable) => timeTable.id !== timeTableId)
          );
          handleNotify(
            "success",
            "Thành công!",
            response.data.message ||
              "Xóa lịch học thành công và đã cập nhật lịch cắt cơm tự động"
          );
          fetchTimeTable();
        })
        .catch((error) => {
          const errorMessage =
            error.response?.data?.message ||
            error.response?.data ||
            "Có lỗi xảy ra khi xóa lịch học";
          handleNotify("danger", "Lỗi!", errorMessage);
        });
    }

    setShowConfirmTimeTable(false);
  };

  const handleConfirmDeleteLearn = (learnId) => {
    const token = localStorage.getItem("token");

    if (token) {
      axios
        .delete(
          `${BASE_URL}/student/${
            jwtDecode(token).id
          }/learning-information/${learnId}`,
          {
            headers: {
              token: `Bearer ${token}`,
            },
          }
        )
        .then(() => {
          handleNotify(
            "success",
            "Thành công!",
            "Xóa kết quả học tập thành công"
          );
          fetchSemesterResults();
        })
        .catch((error) => {
          const errorMessage =
            error.response?.data?.message ||
            error.response?.data ||
            "Có lỗi xảy ra khi xóa kết quả học tập";
          handleNotify("danger", "Lỗi!", errorMessage);
        });
    }

    setShowConfirmLearn(false);
  };

  const handleConfirmDeleteFee = (feeId) => {
    const token = localStorage.getItem("token");

    if (token) {
      axios
        .delete(
          `${BASE_URL}/student/${jwtDecode(token).id}/tuitionFee/${feeId}`,
          {
            headers: {
              token: `Bearer ${token}`,
            },
          }
        )
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

  // Function để cập nhật lịch cắt cơm tự động
  const handleUpdateAutoCutRice = async () => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const decodedToken = jwtDecode(token);
        handleNotify(
          "info",
          "Đang xử lý...",
          "Đang cập nhật lịch cắt cơm tự động"
        );

        await axios.post(
          `${BASE_URL}/student/${decodedToken.id}/auto-cut-rice`,
          {},
          {
            headers: {
              token: `Bearer ${token}`,
            },
          }
        );

        handleNotify(
          "success",
          "Thành công!",
          "Cập nhật lịch cắt cơm tự động thành công"
        );
      } catch (error) {
        handleNotify(
          "danger",
          "Lỗi!",
          error.response?.data?.message ||
            "Có lỗi xảy ra khi cập nhật lịch cắt cơm"
        );
      }
    }
  };

  const fetchTimeTable = async () => {
    const token = localStorage.getItem("token");

    if (token) {
      const decodedToken = jwtDecode(token);
      try {
        const res = await axios.get(
          `${BASE_URL}/student/${decodedToken.id}/time-table`,
          {
            headers: {
              token: `Bearer ${token}`,
            },
          }
        );

        // Sắp xếp theo thứ và thời gian bắt đầu
        const sortedTimeTable = res.data.sort((a, b) => {
          const dayOrder = {
            "Thứ 2": 1,
            "Thứ 3": 2,
            "Thứ 4": 3,
            "Thứ 5": 4,
            "Thứ 6": 5,
            "Thứ 7": 6,
            "Chủ nhật": 7,
          };

          // So sánh thứ trước
          if (dayOrder[a.day] !== dayOrder[b.day]) {
            return dayOrder[a.day] - dayOrder[b.day];
          }

          // Nếu cùng thứ thì so sánh thời gian bắt đầu
          return a.startTime.localeCompare(b.startTime);
        });

        setTimeTable(sortedTimeTable);
      } catch (error) {
        console.log(error);
      }
    }
  };

  // Hàm sắp xếp và gộp dữ liệu theo thứ và giờ
  const processTimeTableData = (data) => {
    if (!data || data.length === 0) return [];

    // Nhóm theo thứ
    const groupedByDay = {};
    data.forEach((item) => {
      if (!groupedByDay[item.day]) {
        groupedByDay[item.day] = [];
      }
      groupedByDay[item.day].push(item);
    });

    // Sắp xếp theo thứ tự thứ và giờ
    const dayOrder = {
      "Thứ 2": 1,
      "Thứ 3": 2,
      "Thứ 4": 3,
      "Thứ 5": 4,
      "Thứ 6": 5,
      "Thứ 7": 6,
      "Chủ nhật": 7,
    };

    // Sắp xếp các thứ theo thứ tự
    const sortedDays = Object.keys(groupedByDay).sort(
      (a, b) => (dayOrder[a] || 999) - (dayOrder[b] || 999)
    );

    const processedData = [];
    sortedDays.forEach((day) => {
      const dayItems = groupedByDay[day];

      // Sắp xếp theo giờ bắt đầu
      dayItems.sort((a, b) => {
        const timeA = a.startTime || "";
        const timeB = b.startTime || "";
        return timeA.localeCompare(timeB);
      });

      // Thêm dữ liệu đã xử lý
      dayItems.forEach((item, index) => {
        processedData.push({
          ...item,
          rowSpan: index === 0 ? dayItems.length : 0, // Gộp ô cho thứ
        });
      });
    });

    return processedData;
  };

  const fetchLearningResult = async () => {
    const token = localStorage.getItem("token");

    if (token) {
      const decodedToken = jwtDecode(token);
      try {
        const res = await axios.get(
          `${BASE_URL}/student/${decodedToken.id}/learning-information`,
          {
            headers: {
              token: `Bearer ${token}`,
            },
          }
        );

        setLearningResult(res.data);
      } catch (error) {
        console.log(error);
      }
    }
  };

  const fetchSemesterResults = async () => {
    const token = localStorage.getItem("token");

    if (token) {
      const decodedToken = jwtDecode(token);
      try {
        const res = await axios.get(`${BASE_URL}/grade/${decodedToken.id}`, {
          headers: {
            token: `Bearer ${token}`,
          },
        });

        setSemesterResults(res.data.semesterResults || []);
      } catch (error) {
        console.log(error);
      }
    }
  };

  const fetchTuitionFee = async () => {
    const token = localStorage.getItem("token");

    if (token) {
      const decodedToken = jwtDecode(token);
      try {
        const res = await axios.get(
          `${BASE_URL}/student/${decodedToken.id}/tuition-fee`,
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
        console.log(error);
      }
    }
  };

  useEffect(() => {
    const loadData = async () => {
      await withLoading(async () => {
        await Promise.all([
          fetchLearningResult(),
          fetchSemesterResults(),
          fetchTuitionFee(),
          fetchTimeTable(),
        ]);
      });
    };
    loadData();
  }, [withLoading]);

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
        console.log(e);
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
            {currentTab === "time-table" && (
              <div className="bg-white dark:bg-gray-800 rounded-lg w-full shadow-lg">
                <div className="flex justify-between font-bold p-5 border-b border-gray-200 dark:border-gray-700">
                  <div className="text-gray-900 dark:text-white">
                    <h1 className="text-2xl font-bold">THỜI KHÓA BIỂU</h1>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      Quản lý và xem thời khóa biểu
                    </p>
                  </div>
                  <div className="flex items-center">
                    <button
                      onClick={() => setShowFormAddTimeTable(true)}
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
                      Thêm lịch học
                    </button>
                  </div>
                </div>
                <div className="w-full pl-6 pb-6 pr-6 mt-4">
                  <div className="overflow-x-auto">
                    <table className="min-w-full border border-gray-200 dark:border-gray-700 text-center text-sm font-light text-gray-900 dark:text-white rounded-lg">
                      <thead className="bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600">
                        <tr>
                          <th
                            scope="col"
                            className="border-r border-gray-200 dark:border-gray-600 py-3 px-4 text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider"
                          >
                            Thứ
                          </th>
                          <th
                            scope="col"
                            className="border-r border-gray-200 dark:border-gray-600 py-3 px-4 text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider"
                          >
                            Thời gian
                          </th>
                          <th
                            scope="col"
                            className="border-r border-gray-200 dark:border-gray-600 py-3 px-4 text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider"
                          >
                            Môn học
                          </th>
                          <th
                            scope="col"
                            className="border-r border-gray-200 dark:border-gray-600 py-3 px-4 text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider"
                          >
                            Phòng học
                          </th>
                          <th
                            scope="col"
                            className="border-r border-gray-200 dark:border-gray-600 py-3 px-4 text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider"
                          >
                            Tuần học
                          </th>
                          <th
                            scope="col"
                            className="border-r border-gray-200 dark:border-gray-600 py-3 px-4 text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider"
                          >
                            Tùy chọn
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-gray-800">
                        {processTimeTableData(timeTable)?.map((item) => (
                          <tr
                            key={item.id}
                            className="border-b border-gray-200 dark:border-gray-600"
                          >
                            {item.rowSpan > 0 ? (
                              <td
                                className="whitespace-nowrap font-medium border-r border-gray-200 dark:border-gray-600 py-4 px-4"
                                rowSpan={item.rowSpan}
                              >
                                {item.day}
                              </td>
                            ) : null}
                            <td className="whitespace-nowrap font-medium border-r border-gray-200 dark:border-gray-600 py-4 px-4">
                              {item.startTime} - {item.endTime}
                            </td>
                            <td className="whitespace-nowrap font-medium border-r border-gray-200 dark:border-gray-600 py-4 px-4">
                              {item.subject || "N/A"}
                            </td>
                            <td className="whitespace-nowrap font-medium border-r border-gray-200 dark:border-gray-600 py-4 px-4">
                              {item.classroom || "N/A"}
                            </td>
                            <td className="whitespace-nowrap font-medium border-r border-gray-200 dark:border-gray-600 py-4 px-4">
                              {item.schoolWeek || "N/A"}
                            </td>
                            <td className="flex justify-center items-center space-x-2 py-4 px-4">
                              <button
                                data-modal-target="authentication-modal"
                                data-modal-toggle="authentication-modal"
                                type="button"
                                onClick={() => handleEditTimeTable(item.id)}
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
                                onClick={() => handleDeleteTimeTable(item.id)}
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
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {currentTab === "results" && (
              <div className="bg-white dark:bg-gray-800 rounded-lg w-full shadow-lg">
                <div className="flex justify-between items-center font-bold p-5 border-b border-gray-200 dark:border-gray-700">
                  <div className="text-gray-900 dark:text-white">
                    <h1 className="text-2xl font-bold">KẾT QUẢ HỌC TẬP</h1>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      Quản lý và xem kết quả học tập
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={openGradeModal}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-1 px-3 border border-blue-600 hover:border-blue-700 rounded-lg transition-colors duration-200 flex items-center text-xs"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth="1.5"
                        stroke="currentColor"
                        className="w-4 h-4 mr-1.5"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M12 4.5v15m7.5-7.5h-15"
                        />
                      </svg>
                      Thêm kết quả học tập
                    </button>
                    <Link
                      href="/users/yearly-statistics"
                      className="bg-green-600 hover:bg-green-700 text-white font-medium py-1 px-3 border border-green-600 hover:border-green-700 rounded-lg transition-colors duration-200 flex items-center text-xs"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth="1.5"
                        stroke="currentColor"
                        className="w-4 h-4 mr-1.5"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                        />
                      </svg>
                      Thống kê theo năm
                    </Link>
                  </div>
                </div>
                <div className="w-full pl-6 pb-6 pr-6 mt-4">
                  <div className="overflow-x-auto">
                    <table className="min-w-full border border-gray-200 dark:border-gray-700 text-center text-sm font-light text-gray-900 dark:text-white rounded-lg">
                      <thead className="bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600">
                        <tr>
                          <th
                            scope="col"
                            className="border-r border-gray-200 dark:border-gray-600 py-3 px-4 text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider"
                          >
                            Học kỳ
                          </th>
                          <th
                            scope="col"
                            className="border-r border-gray-200 dark:border-gray-600 py-3 px-4 text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider"
                          >
                            Năm học
                          </th>
                          <th
                            scope="col"
                            className="border-r border-gray-200 dark:border-gray-600 py-3 px-4 text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider"
                          >
                            GPA
                          </th>
                          <th
                            scope="col"
                            className="border-r border-gray-200 dark:border-gray-600 py-3 px-4 text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider"
                          >
                            CPA
                          </th>
                          <th
                            scope="col"
                            className="border-r border-gray-200 dark:border-gray-600 py-3 px-4 text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider"
                          >
                            Tổng tín chỉ
                          </th>
                          <th
                            scope="col"
                            className="border-r border-gray-200 dark:border-gray-600 py-3 px-4 text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider"
                          >
                            Số môn học
                          </th>
                          <th
                            scope="col"
                            className="border-r border-gray-200 dark:border-gray-600 py-3 px-4 text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider"
                          >
                            Ngày cập nhật
                          </th>
                          <th
                            scope="col"
                            className="border-r border-gray-200 dark:border-gray-600 py-3 px-4 text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider"
                          >
                            Tùy chọn
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-gray-800">
                        {semesterResults?.map((item, index) => (
                          <tr
                            key={index}
                            className="border-b border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200 cursor-pointer"
                            onClick={() => handleViewSemesterDetail(item)}
                          >
                            <td className="whitespace-nowrap font-medium border-r border-gray-200 dark:border-gray-600 py-4 px-4">
                              {item.semester}
                            </td>
                            <td className="whitespace-nowrap font-medium border-r border-gray-200 dark:border-gray-600 py-4 px-4">
                              {item.schoolYear}
                            </td>
                            <td className="whitespace-nowrap font-medium border-r border-gray-200 dark:border-gray-600 py-4 px-4">
                              <div className="flex flex-col">
                                <div className="font-medium text-blue-600 dark:text-blue-400">
                                  {item.averageGrade4 || "0.00"}
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                  {item.averageGrade10 || "0.00"}
                                </div>
                              </div>
                            </td>
                            <td className="whitespace-nowrap font-medium border-r border-gray-200 dark:border-gray-600 py-4 px-4">
                              <div className="flex flex-col">
                                <div className="font-medium text-green-600 dark:text-green-400">
                                  {item.semesterCPA ||
                                    item.cumulativeGrade4?.toFixed(2) ||
                                    "0.00"}
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                  {item.semesterCPA10 ||
                                    item.cumulativeGrade10?.toFixed(2) ||
                                    "0.00"}
                                </div>
                              </div>
                            </td>
                            <td className="whitespace-nowrap font-medium border-r border-gray-200 dark:border-gray-600 py-4 px-4">
                              {item.totalCredits || 0} tín chỉ
                            </td>
                            <td className="whitespace-nowrap font-medium border-r border-gray-200 dark:border-gray-600 py-4 px-4">
                              {item.subjects?.length || 0} môn
                            </td>
                            <td className="whitespace-nowrap font-medium border-r border-gray-200 dark:border-gray-600 py-4 px-4">
                              {item.updatedAt
                                ? new Date(item.updatedAt).toLocaleDateString(
                                    "vi-VN"
                                  )
                                : "-"}
                            </td>
                            <td className="flex justify-center items-center space-x-2 py-4 px-4">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleViewSemesterDetail(item);
                                }}
                                className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300 p-2 rounded-lg hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors duration-200"
                                title="Xem chi tiết"
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
                                    d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.639 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.639 0-8.573-3.007-9.963-7.178z"
                                  />
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                  />
                                </svg>
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEditLearningResult(item.id);
                                }}
                                className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 p-2 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors duration-200"
                                title="Chỉnh sửa"
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
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteLearn(item.id);
                                }}
                                className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors duration-200"
                                title="Xóa học kỳ"
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
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Modal nhập KQ học tập theo môn */}
            {showGradeModal && (
              <div className="fixed inset-0 flex items-center justify-center z-50 pt-10 p-4">
                <div className="bg-black bg-opacity-50 inset-0 fixed"></div>
                <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-5xl max-h-[90vh] overflow-hidden">
                  <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                      {editingSemester
                        ? "Chỉnh sửa kết quả học tập"
                        : "Nhập kết quả học tập theo môn"}
                    </h2>
                    <button
                      onClick={() => {
                        setShowGradeModal(false);
                        setEditingSemester(null);
                      }}
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
                        />
                      </svg>
                    </button>
                  </div>
                  <div className="overflow-y-auto max-h-[calc(95vh-120px)]">
                    <form onSubmit={submitSemesterGrades} className="p-4">
                      <div className="flex justify-between items-end mb-4">
                        <div className="flex-1 max-w-xs">
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Học kỳ
                          </label>
                          <select
                            value={gradeSemesterCode}
                            onChange={(e) =>
                              setGradeSemesterCode(e.target.value)
                            }
                            disabled={editingSemester}
                            className={`bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 ${
                              editingSemester
                                ? "opacity-50 cursor-not-allowed bg-gray-100 dark:bg-gray-600"
                                : ""
                            }`}
                          >
                            {semesters
                              .sort((a, b) => {
                                // Sắp xếp theo năm học (mới nhất trước)
                                const yearComparison =
                                  b.schoolYear.localeCompare(a.schoolYear);
                                if (yearComparison !== 0) return yearComparison;

                                // Nếu cùng năm, sắp xếp theo học kỳ (lớn nhất trước)
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
                                  {s.code.startsWith("HK") && s.schoolYear
                                    ? `${s.code} - ${s.schoolYear}`
                                    : s.schoolYear && s.code.includes(".")
                                    ? `HK${s.code.split(".")[1]} - ${
                                        s.schoolYear
                                      }`
                                    : s.code}
                                </option>
                              ))}
                          </select>
                          {editingSemester && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              Không thể thay đổi học kỳ khi đang chỉnh sửa
                            </p>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={addSubjectRow}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md flex items-center gap-2 transition-colors duration-200"
                        >
                          <svg
                            className="w-4 h-4"
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
                          Thêm môn học
                        </button>
                      </div>

                      <div className="overflow-x-auto">
                        <table className="min-w-full border border-gray-200 dark:border-gray-700 text-sm rounded-lg">
                          <thead className="bg-gray-50 dark:bg-gray-700">
                            <tr>
                              <th className="px-3 py-2 border-r w-1/5">
                                Mã môn
                              </th>
                              <th className="px-3 py-2 border-r w-2/5">
                                Tên môn
                              </th>
                              <th className="px-3 py-2 border-r w-1/5">
                                Tín chỉ
                              </th>
                              <th className="px-3 py-2 border-r w-1/5">
                                Điểm hệ 10
                              </th>
                              <th className="px-3 py-2 w-16">Thao tác</th>
                            </tr>
                          </thead>
                          <tbody>
                            {gradeSubjects.map((row, idx) => (
                              <tr key={idx} className="border-t">
                                <td className="px-2 py-2 border-r w-1/5">
                                  <input
                                    type="text"
                                    value={row.subjectCode}
                                    onChange={(e) =>
                                      updateSubjectField(
                                        idx,
                                        "subjectCode",
                                        e.target.value
                                      )
                                    }
                                    className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-md px-2 py-1"
                                    placeholder="Mã môn"
                                  />
                                </td>
                                <td className="px-2 py-2 border-r w-2/5">
                                  <input
                                    type="text"
                                    value={row.subjectName}
                                    onChange={(e) =>
                                      updateSubjectField(
                                        idx,
                                        "subjectName",
                                        e.target.value
                                      )
                                    }
                                    className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-md px-2 py-1"
                                    placeholder="Tên môn học"
                                  />
                                </td>
                                <td className="px-2 py-2 border-r w-1/5">
                                  <input
                                    type="number"
                                    min="0"
                                    value={row.credits}
                                    onChange={(e) =>
                                      updateSubjectField(
                                        idx,
                                        "credits",
                                        e.target.value
                                      )
                                    }
                                    className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-md px-2 py-1"
                                    placeholder="Tín chỉ"
                                  />
                                </td>
                                <td className="px-2 py-2 border-r w-1/5">
                                  <input
                                    type="number"
                                    min="0"
                                    max="10"
                                    step="0.01"
                                    value={row.grade10 || ""}
                                    onChange={(e) =>
                                      updateSubjectField(
                                        idx,
                                        "grade10",
                                        e.target.value
                                      )
                                    }
                                    className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-md px-2 py-1"
                                    placeholder="0.0"
                                  />
                                </td>
                                <td className="px-2 py-2 text-center w-16">
                                  <button
                                    type="button"
                                    onClick={() => removeSubjectRow(idx)}
                                    className="text-red-600 hover:text-red-800 p-1 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20"
                                    title="Xóa môn học"
                                  >
                                    <svg
                                      className="w-4 h-4"
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
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* Tổng kết học kỳ */}
                      <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                          Tổng kết học kỳ
                        </h3>
                        <div className="grid grid-cols-3 gap-4">
                          <div className="text-center">
                            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                              {calculateSemesterSummary().totalCredits}
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                              Tổng tín chỉ
                            </div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                              {calculateSemesterSummary().gpa4}
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                              GPA (Hệ 4)
                            </div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                              {calculateSemesterSummary().gpa10}
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                              GPA (Hệ 10)
                            </div>
                          </div>
                        </div>
                        <div className="mt-3 text-sm text-gray-600 dark:text-gray-400 text-center">
                          * Điểm hệ 10 sẽ được tự động chuyển đổi sang điểm chữ
                          và điểm hệ 4
                        </div>
                      </div>

                      <div className="flex justify-end mt-3">
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setShowGradeModal(false);
                              setEditingSemester(null);
                            }}
                            className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-md"
                          >
                            Hủy
                          </button>
                          <button
                            type="submit"
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md"
                          >
                            {editingSemester ? "Cập nhật" : "Lưu kết quả"}
                          </button>
                        </div>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            )}

            {/* Modal xem chi tiết kết quả học tập */}
            {showDetailModal && viewingSemester && (
              <div className="fixed inset-0 flex items-center justify-center z-50 pt-10 p-4">
                <div className="bg-black bg-opacity-50 inset-0 fixed"></div>
                <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
                  <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                      Chi tiết kết quả học tập - {viewingSemester.semester} -{" "}
                      Năm học {viewingSemester.schoolYear}
                    </h2>
                    <button
                      onClick={() => {
                        setShowDetailModal(false);
                        setViewingSemester(null);
                      }}
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
                        />
                      </svg>
                    </button>
                  </div>
                  <div className="overflow-y-auto max-h-[calc(95vh-120px)] p-6">
                    {/* Thông tin tổng quan */}
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
                      <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                          {viewingSemester.totalCredits || 0}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          Tổng tín chỉ
                        </div>
                      </div>
                      <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                        <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                          {viewingSemester.averageGrade4?.toFixed(2) || "0.00"}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          GPA (Hệ 4)
                        </div>
                      </div>
                      <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
                        <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                          {viewingSemester.averageGrade10?.toFixed(2) || "0.00"}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          GPA (Hệ 10)
                        </div>
                      </div>
                      <div className="bg-emerald-50 dark:bg-emerald-900/20 p-4 rounded-lg">
                        <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                          {viewingSemester.cumulativeGrade4?.toFixed(2) ||
                            "0.00"}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          CPA (Hệ 4)
                        </div>
                      </div>
                      <div className="bg-teal-50 dark:bg-teal-900/20 p-4 rounded-lg">
                        <div className="text-2xl font-bold text-teal-600 dark:text-teal-400">
                          {viewingSemester.cumulativeGrade10?.toFixed(2) ||
                            "0.00"}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          CPA (Hệ 10)
                        </div>
                      </div>
                      <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg">
                        <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                          {viewingSemester.subjects?.length || 0}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          Số môn học
                        </div>
                      </div>
                    </div>

                    {/* Bảng chi tiết môn học */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
                      <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          Chi tiết các môn học
                        </h3>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="min-w-full">
                          <thead className="bg-gray-50 dark:bg-gray-700">
                            <tr>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                Mã môn
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                Tên môn học
                              </th>
                              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                Tín chỉ
                              </th>
                              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                Điểm chữ
                              </th>
                              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                Điểm hệ 4
                              </th>
                              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                Điểm hệ 10
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                            {viewingSemester.subjects?.map((subject, index) => (
                              <tr
                                key={index}
                                className="hover:bg-gray-50 dark:hover:bg-gray-700"
                              >
                                <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                                  {subject.subjectCode}
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                                  {subject.subjectName}
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-center text-gray-900 dark:text-white">
                                  {subject.credits}
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-center">
                                  <span
                                    className={`px-2 py-1 text-xs font-medium rounded-full ${
                                      subject.letterGrade === "A+" ||
                                      subject.letterGrade === "A"
                                        ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                                        : subject.letterGrade === "B+" ||
                                          subject.letterGrade === "B"
                                        ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                                        : subject.letterGrade === "C+" ||
                                          subject.letterGrade === "C"
                                        ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                                        : subject.letterGrade === "D+" ||
                                          subject.letterGrade === "D"
                                        ? "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200"
                                        : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                                    }`}
                                  >
                                    {subject.letterGrade}
                                  </span>
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-center text-gray-900 dark:text-white">
                                  {subject.gradePoint4?.toFixed(2) || "0.00"}
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-center text-gray-900 dark:text-white">
                                  {subject.gradePoint10?.toFixed(2) || "0.00"}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Thông tin bổ sung */}
                    <div className="mt-6 bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Thông tin học kỳ
                          </h4>
                          <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                            <div>Học kỳ: {viewingSemester.semester}</div>
                            <div>Năm học: {viewingSemester.schoolYear}</div>
                            <div>
                              Cập nhật lần cuối:{" "}
                              {viewingSemester.updatedAt
                                ? new Date(
                                    viewingSemester.updatedAt
                                  ).toLocaleDateString("vi-VN")
                                : "-"}
                            </div>
                          </div>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Đánh giá học tập
                          </h4>
                          <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                            <div>
                              Trung bình hệ 4:{" "}
                              {viewingSemester.averageGrade4?.toFixed(2) ||
                                "0.00"}
                            </div>
                            <div>
                              Trung bình hệ 10:{" "}
                              {viewingSemester.averageGrade10?.toFixed(2) ||
                                "0.00"}
                            </div>
                            <div>
                              CPA hệ 4:{" "}
                              {viewingSemester.cumulativeGrade4?.toFixed(2) ||
                                "0.00"}
                            </div>
                            <div>
                              CPA hệ 10:{" "}
                              {viewingSemester.cumulativeGrade10?.toFixed(2) ||
                                "0.00"}
                            </div>
                            <div>
                              Tổng tín chỉ: {viewingSemester.totalCredits || 0}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {currentTab === "tuition-fee" && (
              <div className="bg-white dark:bg-gray-800 rounded-lg w-full shadow-lg">
                <div className="flex justify-between items-center font-bold p-5 border-b border-gray-200 dark:border-gray-700">
                  <div className="text-gray-900 dark:text-white">
                    <h1 className="text-2xl font-bold">HỌC PHÍ</h1>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      Quản lý và xem học phí
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Chọn học kỳ:
                      </label>
                      <select
                        value={selectedSemester}
                        onChange={(e) => setSelectedSemester(e.target.value)}
                        className="bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 px-3 py-2 min-w-[200px]"
                      >
                        <option value="">Tất cả học kỳ</option>
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
                    <button
                      onClick={() => setShowFormAddTuitionFee(true)}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 border border-blue-600 hover:border-blue-700 rounded-lg transition-colors duration-200 flex items-center"
                    >
                      <svg
                        className="w-4 h-4 mr-2"
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
                          <th
                            scope="col"
                            className="border-r border-gray-200 dark:border-gray-600 py-3 px-4 text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider"
                          >
                            Học kỳ
                          </th>
                          <th
                            scope="col"
                            className="border-r border-gray-200 dark:border-gray-600 py-3 px-4 text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider"
                          >
                            Năm học
                          </th>
                          <th
                            scope="col"
                            className="border-r border-gray-200 dark:border-gray-600 py-3 px-4 text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider"
                          >
                            Loại tiền phải đóng
                          </th>
                          <th
                            scope="col"
                            className="border-r border-gray-200 dark:border-gray-600 py-3 px-4 text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider"
                          >
                            Số tiền phải đóng
                          </th>
                          <th
                            scope="col"
                            className="border-r border-gray-200 dark:border-gray-600 py-3 px-4 text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider"
                          >
                            Trạng thái
                          </th>
                          <th
                            scope="col"
                            className="border-r border-gray-200 dark:border-gray-600 py-3 px-4 text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider"
                          >
                            Tùy chọn
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-gray-800">
                        {tuitionFee?.map((child) => (
                          <tr
                            key={child.id}
                            className="border-b border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
                          >
                            <td className="whitespace-nowrap font-medium border-r border-gray-200 dark:border-gray-600 py-4 px-4">
                              {child.semester}
                            </td>
                            <td className="whitespace-nowrap font-medium border-r border-gray-200 dark:border-gray-600 py-4 px-4">
                              {child.schoolYear || "N/A"}
                            </td>
                            <td className="whitespace-nowrap font-medium border-r border-gray-200 dark:border-gray-600 py-4 px-4">
                              {child.content}
                            </td>
                            <td className="whitespace-nowrap font-medium border-r border-gray-200 dark:border-gray-600 py-4 px-4">
                              {formatNumberWithDots(child.totalAmount)}đ
                            </td>
                            <td className="whitespace-nowrap font-medium border-r border-gray-200 dark:border-gray-600 py-4 px-4 text-center">
                              <span
                                className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusClasses(
                                  child.status
                                )}`}
                              >
                                {child.status}
                              </span>
                            </td>
                            <td className="flex justify-center items-center space-x-2 py-4 px-4">
                              <button
                                data-modal-target="authentication-modal"
                                data-modal-toggle="authentication-modal"
                                type="button"
                                onClick={() => handleEditTuitionFee(child.id)}
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
                                onClick={() => handleDeleteFee(child.id)}
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
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal Thêm Thời Khóa Biểu */}
      {currentTab === "time-table" && showFormAddTimeTable && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
          <div className="bg-black bg-opacity-50 inset-0 fixed"></div>
          <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white pr-12">
                Thêm thời khóa biểu
              </h2>
              <button
                onClick={() => setShowFormAddTimeTable(false)}
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
                onSubmit={handleAddFormTimeTable}
                className="p-4"
                id="infoFormTimeTable"
              >
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label
                      htmlFor="day"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                    >
                      Thứ
                    </label>
                    <select
                      id="day"
                      name="day"
                      value={addFormDataTimeTable.day}
                      onChange={(e) =>
                        setAddFormDataTimeTable({
                          ...addFormDataTimeTable,
                          day: e.target.value,
                        })
                      }
                      required
                      className="bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 transition-colors duration-200"
                    >
                      <option value="">Chọn thứ</option>
                      <option value="Thứ 2">Thứ 2</option>
                      <option value="Thứ 3">Thứ 3</option>
                      <option value="Thứ 4">Thứ 4</option>
                      <option value="Thứ 5">Thứ 5</option>
                      <option value="Thứ 6">Thứ 6</option>
                      <option value="Thứ 7">Thứ 7</option>
                      <option value="Chủ nhật">Chủ nhật</option>
                    </select>
                  </div>
                  <div>
                    <label
                      htmlFor="subject"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                    >
                      Môn học
                    </label>
                    <input
                      type="text"
                      id="subject"
                      name="subject"
                      value={addFormDataTimeTable.subject}
                      onChange={(e) =>
                        setAddFormDataTimeTable({
                          ...addFormDataTimeTable,
                          subject: e.target.value,
                        })
                      }
                      required
                      placeholder="VD: Toán học"
                      className="bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 transition-colors duration-200"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label
                      htmlFor="startTime"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                    >
                      Thời gian bắt đầu
                    </label>
                    <input
                      type="time"
                      id="startTime"
                      name="startTime"
                      value={addFormDataTimeTable.startTime}
                      onChange={(e) =>
                        setAddFormDataTimeTable({
                          ...addFormDataTimeTable,
                          startTime: e.target.value,
                        })
                      }
                      required
                      className="bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 transition-colors duration-200"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="endTime"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                    >
                      Thời gian kết thúc
                    </label>
                    <input
                      type="time"
                      id="endTime"
                      name="endTime"
                      value={addFormDataTimeTable.endTime}
                      onChange={(e) =>
                        setAddFormDataTimeTable({
                          ...addFormDataTimeTable,
                          endTime: e.target.value,
                        })
                      }
                      required
                      className="bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 transition-colors duration-200"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label
                      htmlFor="classroom"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                    >
                      Phòng học
                    </label>
                    <input
                      type="text"
                      id="classroom"
                      name="classroom"
                      value={addFormDataTimeTable.classroom}
                      onChange={(e) =>
                        setAddFormDataTimeTable({
                          ...addFormDataTimeTable,
                          classroom: e.target.value,
                        })
                      }
                      required
                      placeholder="VD: D3-101"
                      className="bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 transition-colors duration-200"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="schoolWeek"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                    >
                      Tuần học
                    </label>
                    <input
                      type="text"
                      id="schoolWeek"
                      name="schoolWeek"
                      value={addFormDataTimeTable.schoolWeek}
                      onChange={(e) =>
                        setAddFormDataTimeTable({
                          ...addFormDataTimeTable,
                          schoolWeek: e.target.value,
                        })
                      }
                      required
                      placeholder="VD: 1-15"
                      className="bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 transition-colors duration-200"
                    />
                  </div>
                </div>

                <div className="mb-4">
                  <label
                    htmlFor="notes"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                  >
                    Ghi chú
                  </label>
                  <textarea
                    id="notes"
                    name="notes"
                    value={addFormDataTimeTable.notes}
                    onChange={(e) =>
                      setAddFormDataTimeTable({
                        ...addFormDataTimeTable,
                        notes: e.target.value,
                      })
                    }
                    rows="3"
                    placeholder="Ghi chú về lịch học..."
                    className="bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 transition-colors duration-200"
                  />
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors duration-200"
                    onClick={() => setShowFormAddTimeTable(false)}
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

      {/* Modal Sửa Thời Khóa Biểu */}
      {currentTab === "time-table" && isOpenTimeTable && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
          <div className="bg-black bg-opacity-50 inset-0 fixed"></div>
          <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white pr-12">
                Chỉnh sửa thời khóa biểu
              </h2>
              <button
                onClick={() => setIsOpenTimeTable(false)}
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
                onSubmit={(e) => handleUpdateTimeTable(e, timeTableId)}
                className="p-4"
                id="infoFormEditTimeTable"
              >
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label
                      htmlFor="day2"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                    >
                      Thứ
                    </label>
                    <select
                      id="day2"
                      name="day2"
                      value={editedTimeTable.day}
                      onChange={(e) =>
                        setEditedTimeTable({
                          ...editedTimeTable,
                          day: e.target.value,
                        })
                      }
                      className="bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 transition-colors duration-200"
                    >
                      <option value="">Chọn thứ</option>
                      <option value="Thứ 2">Thứ 2</option>
                      <option value="Thứ 3">Thứ 3</option>
                      <option value="Thứ 4">Thứ 4</option>
                      <option value="Thứ 5">Thứ 5</option>
                      <option value="Thứ 6">Thứ 6</option>
                      <option value="Thứ 7">Thứ 7</option>
                      <option value="Chủ nhật">Chủ nhật</option>
                    </select>
                  </div>
                  <div>
                    <label
                      htmlFor="subject2"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                    >
                      Môn học
                    </label>
                    <input
                      type="text"
                      id="subject2"
                      name="subject2"
                      value={editedTimeTable.subject}
                      onChange={(e) =>
                        setEditedTimeTable({
                          ...editedTimeTable,
                          subject: e.target.value,
                        })
                      }
                      placeholder="VD: Toán học"
                      className="bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 transition-colors duration-200"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label
                      htmlFor="startTime2"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                    >
                      Thời gian bắt đầu
                    </label>
                    <input
                      type="time"
                      id="startTime2"
                      name="startTime2"
                      value={editedTimeTable.startTime}
                      onChange={(e) =>
                        setEditedTimeTable({
                          ...editedTimeTable,
                          startTime: e.target.value,
                        })
                      }
                      className="bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 transition-colors duration-200"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="endTime2"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                    >
                      Thời gian kết thúc
                    </label>
                    <input
                      type="time"
                      id="endTime2"
                      name="endTime2"
                      value={editedTimeTable.endTime}
                      onChange={(e) =>
                        setEditedTimeTable({
                          ...editedTimeTable,
                          endTime: e.target.value,
                        })
                      }
                      className="bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 transition-colors duration-200"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label
                      htmlFor="classroom2"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                    >
                      Phòng học
                    </label>
                    <input
                      type="text"
                      id="classroom2"
                      name="classroom2"
                      value={editedTimeTable.classroom}
                      onChange={(e) =>
                        setEditedTimeTable({
                          ...editedTimeTable,
                          classroom: e.target.value,
                        })
                      }
                      placeholder="VD: D3-101"
                      className="bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 transition-colors duration-200"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="schoolWeek2"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                    >
                      Tuần học
                    </label>
                    <input
                      type="text"
                      id="schoolWeek2"
                      name="schoolWeek2"
                      value={editedTimeTable.schoolWeek}
                      onChange={(e) =>
                        setEditedTimeTable({
                          ...editedTimeTable,
                          schoolWeek: e.target.value,
                        })
                      }
                      placeholder="VD: 1-15"
                      className="bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 transition-colors duration-200"
                    />
                  </div>
                </div>

                <div className="mb-4">
                  <label
                    htmlFor="notes2"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                  >
                    Ghi chú
                  </label>
                  <textarea
                    id="notes2"
                    name="notes2"
                    value={editedTimeTable.notes}
                    onChange={(e) =>
                      setEditedTimeTable({
                        ...editedTimeTable,
                        notes: e.target.value,
                      })
                    }
                    rows="3"
                    placeholder="Ghi chú về lịch học..."
                    className="bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 transition-colors duration-200"
                  />
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors duration-200"
                    onClick={() => setIsOpenTimeTable(false)}
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

      {/* Modal Xác nhận xóa thời khóa biểu */}
      {currentTab === "time-table" && showConfirmTimeTable && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
          <div className="bg-black bg-opacity-50 inset-0 fixed"></div>
          <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Xác nhận xóa
              </h2>
              <button
                onClick={() => setShowConfirmTimeTable(false)}
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
                Bạn có chắc chắn muốn xóa thời khóa biểu này?
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowConfirmTimeTable(false)}
                  className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors duration-200"
                >
                  Hủy
                </button>
                <button
                  onClick={() => handleConfirmDeleteTimeTable(timeTableId)}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors duration-200"
                >
                  Xóa
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Xác nhận xóa kết quả học tập */}
      {currentTab === "results" && showConfirmLearn && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
          <div className="bg-black bg-opacity-50 inset-0 fixed"></div>
          <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Xác nhận xóa
              </h2>
              <button
                onClick={() => setShowConfirmLearn(false)}
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
                Bạn có chắc chắn muốn xóa kết quả học tập này?
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowConfirmLearn(false)}
                  className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors duration-200"
                >
                  Hủy
                </button>
                <button
                  onClick={() => handleConfirmDeleteLearn(learnId)}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors duration-200"
                >
                  Xóa
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Xác nhận xóa học phí */}
      {currentTab === "tuition-fee" && showConfirmFee && (
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

      {/* Modal Sửa Kết Quả Học Tập */}
      {currentTab === "results" && isOpenLearningResult && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
          <div className="bg-black bg-opacity-50 inset-0 fixed"></div>
          <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white pr-12">
                Chỉnh sửa kết quả học tập
              </h2>
              <button
                onClick={() => setIsOpenLearningResult(false)}
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
                onSubmit={(e) => handleUpdateLearningResult(e, learnId)}
                className="p-4"
                id="infoFormEditLearn"
              >
                <div className="grid grid-cols-2 gap-4">
                  <div className="mb-4">
                    <label
                      htmlFor="semester3"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                    >
                      Học kỳ
                    </label>
                    <input
                      type="text"
                      id="semester3"
                      name="semester3"
                      value={editedLearningResult.semester}
                      onChange={(e) =>
                        setEditedLearningResult({
                          ...editedLearningResult,
                          semester: e.target.value,
                        })
                      }
                      placeholder="vd: 2023.2"
                      className="bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 transition-colors duration-200"
                    />
                  </div>
                  <div className="mb-4">
                    <label
                      htmlFor="studentLevel3"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                    >
                      Trình độ
                    </label>
                    <input
                      type="text"
                      id="studentLevel3"
                      name="studentLevel3"
                      value={editedLearningResult.studentLevel}
                      onChange={(e) =>
                        setEditedLearningResult({
                          ...editedLearningResult,
                          studentLevel: e.target.value,
                        })
                      }
                      placeholder="vd: 4"
                      className="bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 transition-colors duration-200"
                    />
                  </div>
                  <div className="mb-4">
                    <label
                      htmlFor="GPA3"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                    >
                      GPA
                    </label>
                    <input
                      type="text"
                      id="GPA3"
                      name="GPA3"
                      value={editedLearningResult.GPA}
                      onChange={(e) =>
                        setEditedLearningResult({
                          ...editedLearningResult,
                          GPA: e.target.value,
                        })
                      }
                      placeholder="vd: 3.2"
                      className="bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 transition-colors duration-200"
                    />
                  </div>
                  <div className="mb-4">
                    <label
                      htmlFor="CPA3"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                    >
                      CPA
                    </label>
                    <input
                      type="text"
                      id="CPA3"
                      name="CPA3"
                      value={editedLearningResult.CPA}
                      onChange={(e) =>
                        setEditedLearningResult({
                          ...editedLearningResult,
                          CPA: e.target.value,
                        })
                      }
                      placeholder="vd: 3.6"
                      className="bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 transition-colors duration-200"
                    />
                  </div>
                  <div className="mb-4">
                    <label
                      htmlFor="cumulativeCredit3"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                    >
                      TC tích lũy
                    </label>
                    <input
                      type="text"
                      id="cumulativeCredit3"
                      name="cumulativeCredit3"
                      value={editedLearningResult.cumulativeCredit}
                      onChange={(e) =>
                        setEditedLearningResult({
                          ...editedLearningResult,
                          cumulativeCredit: e.target.value,
                        })
                      }
                      placeholder="vd: 120"
                      className="bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 transition-colors duration-200"
                    />
                  </div>
                  <div className="mb-4">
                    <label
                      htmlFor="totalDebt3"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                    >
                      TC nợ đăng ký
                    </label>
                    <input
                      type="text"
                      id="totalDebt3"
                      name="totalDebt3"
                      value={editedLearningResult.totalDebt}
                      onChange={(e) =>
                        setEditedLearningResult({
                          ...editedLearningResult,
                          totalDebt: e.target.value,
                        })
                      }
                      placeholder="vd: 0"
                      className="bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 transition-colors duration-200"
                    />
                  </div>
                  <div className="mb-4">
                    <label
                      htmlFor="warningLevel3"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                    >
                      Cảnh báo
                    </label>
                    <input
                      type="text"
                      id="warningLevel3"
                      name="warningLevel3"
                      value={editedLearningResult.warningLevel}
                      onChange={(e) =>
                        setEditedLearningResult({
                          ...editedLearningResult,
                          warningLevel: e.target.value,
                        })
                      }
                      placeholder="vd: 0"
                      className="bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 transition-colors duration-200"
                    />
                  </div>
                  <div className="mb-4">
                    <label
                      htmlFor="learningStatus3"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                    >
                      Trạng thái
                    </label>
                    <select
                      id="learningStatus3"
                      name="learningStatus3"
                      value={editedLearningResult.learningStatus || "Học"}
                      onChange={(e) =>
                        setEditedLearningResult({
                          ...editedLearningResult,
                          learningStatus: e.target.value,
                        })
                      }
                      className="bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 transition-colors duration-200"
                    >
                      <option value="Học">Học</option>
                      <option value="Cảnh báo học tập (Mức M1)">
                        Cảnh báo học tập (Mức M1)
                      </option>
                      <option value="Cảnh báo học tập (Mức M2)">
                        Cảnh báo học tập (Mức M2)
                      </option>
                      <option value="Cảnh báo học tập (Mức M3)">
                        Cảnh báo học tập (Mức M3)
                      </option>
                      <option value="Buộc thôi học">Buộc thôi học</option>
                    </select>
                  </div>
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors duration-200"
                    onClick={() => setIsOpenLearningResult(false)}
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

      {/* Modal Thêm Học Phí */}
      {currentTab === "tuition-fee" && showFormAddTuitionFee && (
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
      {currentTab === "tuition-fee" && isOpenTuitionFee && (
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

export default LearningInformation;
