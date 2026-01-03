"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import SideBar from "@/components/sidebar";
import Loader from "@/components/loader";
import { useLoading } from "@/hooks";
import { handleNotify } from "../../../components/notify";
import { GRADE_MESSAGES } from "@/constants/validationMessages";
import { FILE_UPLOAD_CONFIG } from "@/constants/fileUpload";
import axiosInstance from "@/utils/axiosInstance";
import { UploadButton, getAuthToken } from "@/utils/uploadthing";

const SemesterResults = () => {
  const [semesters, setSemesters] = useState([]);
  const [learningResult, setLearningResult] = useState([]);
  const [semesterResults, setSemesterResults] = useState([]);
  const [viewingSemester, setViewingSemester] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showGradeModal, setShowGradeModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteReason, setDeleteReason] = useState("");
  const [gradeSubjects, setGradeSubjects] = useState([
    {
      subjectCode: "",
      subjectName: "",
      credits: "",
      grade10: "",
    },
  ]);
  const [updateSubjects, setUpdateSubjects] = useState([]);
  const { loading, withLoading } = useLoading(true);
  const [gradeSemesterCode, setGradeSemesterCode] = useState("");
  const [studentId, setStudentId] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadedFileUrl, setUploadedFileUrl] = useState(null);
  const [uploadedFileName, setUploadedFileName] = useState(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [updateSelectedFile, setUpdateSelectedFile] = useState(null);
  const [updateUploadedFileUrl, setUpdateUploadedFileUrl] = useState(null);
  const [updateUploadedFileName, setUpdateUploadedFileName] = useState(null);
  const [updateUploadingFile, setUpdateUploadingFile] = useState(false);
  const [deleteSelectedFile, setDeleteSelectedFile] = useState(null);
  const [deleteUploadedFileUrl, setDeleteUploadedFileUrl] = useState(null);
  const [deleteUploadedFileName, setDeleteUploadedFileName] = useState(null);
  const [deleteUploadingFile, setDeleteUploadingFile] = useState(false);
  const router = useRouter();

  // ==================== UPLOAD HANDLERS ====================
  /**
   * Tạo upload handlers để tái sử dụng
   */
  const createUploadHandlers = ({
    onSuccess,
    onError,
    setUploading,
    setFileUrl,
    setFileName,
    setSelectedFile,
  }) => ({
    onClientUploadComplete: (res) => {
      if (res?.[0]) {
        const file = res[0];
        setFileUrl(file.url || file.fileUrl);
        setFileName(file.name || file.fileName);
        setUploading(false);
        handleNotify(
          "success",
          "Upload thành công",
          `File ${file.name || file.fileName} đã được upload thành công`
        );
        onSuccess?.(file);
      }
    },
    onUploadError: (error) => {
      setUploading(false);
      handleNotify(
        "danger",
        "Lỗi upload file",
        error.message || "Không thể upload file"
      );
      onError?.(error);
    },
    onUploadBegin: (name) => {
      setUploading(true);
      setSelectedFile({ name });
    },
  });

  // ==================== HELPERS ====================
  /**
   * Parse semester code từ ID
   */
  const parseTermFromId = (id) => {
    if (!id) return null;
    const semester = semesters.find((s) => s.id === id);
    if (!semester) return null;

    if (semester.code.startsWith("HK")) {
      return semester.code;
    }
    if (semester.code.includes(".")) {
      return "HK" + semester.code.split(".")[1];
    }
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
    setGradeSemesterCode("");
    setSelectedFile(null);
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
    const term = parseTermFromId(gradeSemesterCode);
    const schoolYear = findSchoolYearById(gradeSemesterCode);

    if (!term || !schoolYear) {
      handleNotify(
        "warning",
        "Thiếu thông tin",
        GRADE_MESSAGES.SELECT_SEMESTER
      );
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
      handleNotify("warning", "Thiếu dữ liệu", GRADE_MESSAGES.MISSING_DATA);
      return;
    }

    if (validSubjects.length !== gradeSubjects.length) {
      handleNotify(
        "warning",
        "Dữ liệu không hợp lệ",
        GRADE_MESSAGES.INVALID_SUBJECT_DATA
      );
      return;
    }

    if (!selectedFile) {
      handleNotify(
        "warning",
        "Thiếu file đính kèm",
        "Vui lòng tải lên file đính kèm để gửi đề xuất"
      );
      return;
    }

    try {
      // Kiểm tra file đã được upload chưa
      if (selectedFile && !uploadedFileUrl) {
        handleNotify(
          "warning",
          "Chưa upload file",
          "Vui lòng upload file trước khi gửi đề xuất"
        );
        return;
      }

      const payload = {
        semester: term,
        schoolYear,
        subjects: gradeSubjects.map((s) => ({
          subjectCode: s.subjectCode.trim(),
          subjectName: s.subjectName.trim(),
          credits: Number(s.credits || 0),
          gradePoint10: Number(s.grade10 || 0),
        })),
        ...(uploadedFileUrl && {
          attachmentFile: JSON.stringify({
            url: uploadedFileUrl,
            name: uploadedFileName || "File đính kèm",
          }),
        }),
      };

      // Thêm mới đề xuất kết quả học tập
      await axiosInstance.post(`/student/${studentId}/grades`, payload);
      handleNotify(
        "success",
        "Thành công",
        `Đã gửi đề xuất KQ học tập ${term} năm học ${schoolYear}${
          uploadedFileUrl ? " kèm file đính kèm" : ""
        }. Vui lòng chờ Chỉ huy phê duyệt.`
      );

      // Đóng modal và reset state
      setShowGradeModal(false);
      setSelectedFile(null);
      setUploadedFileUrl(null);
      setUploadedFileName(null);
      setGradeSubjects([
        {
          subjectCode: "",
          subjectName: "",
          credits: "",
          grade10: "",
        },
      ]);

      // Chuyển hướng đến trang quản lý đề xuất
      router.push("/users/proposals/grade-results");
    } catch (err) {
      handleNotify(
        "danger",
        "Lỗi",
        err?.response?.data?.message || "Không thể lưu KQ học tập"
      );
    }
  };

  const handleViewSemesterDetail = (semester) => {
    setViewingSemester(semester);
    setShowDetailModal(true);
  };

  // Mở modal yêu cầu cập nhật
  const openUpdateModal = () => {
    if (!viewingSemester) return;
    // Copy subjects từ kết quả hiện tại để chỉnh sửa
    const subjects =
      viewingSemester.subjects?.map((s) => ({
        subjectCode: s.subjectCode || "",
        subjectName: s.subjectName || "",
        credits: s.credits?.toString() || "",
        grade10: s.gradePoint10?.toString() || "",
      })) || [];
    setUpdateSubjects(
      subjects.length > 0
        ? subjects
        : [{ subjectCode: "", subjectName: "", credits: "", grade10: "" }]
    );
    setShowDetailModal(false);
    setShowUpdateModal(true);
  };

  // Mở modal yêu cầu xóa
  const openDeleteModal = () => {
    setDeleteReason("");
    setShowDetailModal(false);
    setShowDeleteModal(true);
  };

  // Thêm dòng môn học trong update modal
  const addUpdateSubjectRow = () => {
    setUpdateSubjects((prev) => [
      ...prev,
      { subjectCode: "", subjectName: "", credits: "", grade10: "" },
    ]);
  };

  // Xóa dòng môn học trong update modal
  const removeUpdateSubjectRow = (idx) => {
    setUpdateSubjects((prev) => {
      const next = prev.filter((_, i) => i !== idx);
      if (next.length === 0) {
        return [{ subjectCode: "", subjectName: "", credits: "", grade10: "" }];
      }
      return next;
    });
  };

  // Cập nhật field trong update modal
  const updateUpdateSubjectField = (idx, field, value) => {
    setUpdateSubjects((prev) => {
      const next = prev.slice();
      next[idx] = { ...next[idx], [field]: value };
      return next;
    });
  };

  // Tính toán GPA cho update modal
  const calculateUpdateSummary = () => {
    if (!updateSubjects || updateSubjects.length === 0) {
      return { totalCredits: 0, gpa4: 0, gpa10: 0 };
    }

    let totalGradePoints4 = 0;
    let totalGradePoints10 = 0;
    let totalCredits = 0;

    updateSubjects.forEach((subject) => {
      const credits = parseFloat(subject.credits) || 0;
      const grade10 = parseFloat(subject.grade10) || 0;

      if (credits > 0 && !isNaN(grade10)) {
        let letterGrade = "F";
        if (grade10 >= 9.5) letterGrade = "A+";
        else if (grade10 >= 8.5) letterGrade = "A";
        else if (grade10 >= 8.0) letterGrade = "B+";
        else if (grade10 >= 7.0) letterGrade = "B";
        else if (grade10 >= 6.5) letterGrade = "C+";
        else if (grade10 >= 5.5) letterGrade = "C";
        else if (grade10 >= 5.0) letterGrade = "D+";
        else if (grade10 >= 4.0) letterGrade = "D";

        let grade4 = 0.0;
        switch (letterGrade) {
          case "A+":
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

  // Gửi yêu cầu cập nhật
  const submitUpdateRequest = async (e) => {
    e.preventDefault();
    if (!viewingSemester || !studentId) return;

    // Validate dữ liệu
    const validSubjects = updateSubjects.filter(
      (subject) =>
        subject.subjectCode.trim() &&
        subject.subjectName.trim() &&
        subject.credits &&
        subject.grade10 &&
        parseFloat(subject.grade10) >= 0 &&
        parseFloat(subject.grade10) <= 10
    );

    if (validSubjects.length === 0) {
      handleNotify("warning", "Thiếu dữ liệu", GRADE_MESSAGES.MISSING_DATA);
      return;
    }

    if (validSubjects.length !== updateSubjects.length) {
      handleNotify(
        "warning",
        "Dữ liệu không hợp lệ",
        GRADE_MESSAGES.INVALID_SUBJECT_DATA
      );
      return;
    }

    try {
      let uploadedFileUrl = null;

      // Kiểm tra file đã được upload chưa (nếu có file mới)
      if (updateSelectedFile && !updateUploadedFileUrl) {
        handleNotify(
          "warning",
          "Chưa upload file",
          "Vui lòng upload file trước khi gửi yêu cầu cập nhật"
        );
        return;
      }

      const payload = {
        subjects: updateSubjects.map((s) => ({
          subjectCode: s.subjectCode.trim(),
          subjectName: s.subjectName.trim(),
          credits: Number(s.credits || 0),
          gradePoint10: Number(s.grade10 || 0),
        })),
        ...(updateUploadedFileUrl && { attachmentFile: updateUploadedFileUrl }),
      };

      await axiosInstance.post(
        `/student/${studentId}/grades/${viewingSemester.semester}/${viewingSemester.schoolYear}/request-update`,
        payload
      );

      handleNotify(
        "success",
        "Thành công",
        `Đã gửi yêu cầu cập nhật kết quả học tập ${viewingSemester.semester} năm học ${viewingSemester.schoolYear}${updateUploadedFileUrl ? " kèm file đính kèm" : ""}. Vui lòng chờ Chỉ huy phê duyệt.`
      );

      setShowUpdateModal(false);
      setViewingSemester(null);
      setUpdateSelectedFile(null);
      setUpdateUploadedFileUrl(null);
      setUpdateUploadedFileName(null);
      setUpdateSelectedFile(null);
      router.push("/users/proposals/grade-results");
    } catch (err) {
      handleNotify(
        "danger",
        "Lỗi",
        err?.response?.data?.message || "Không thể gửi yêu cầu cập nhật"
      );
    }
  };

  // Gửi yêu cầu xóa
  const submitDeleteRequest = async () => {
    if (!viewingSemester || !studentId) return;

    if (!deleteReason.trim()) {
      handleNotify("warning", "Thiếu thông tin", "Vui lòng nhập lý do xóa");
      return;
    }

    try {
      let uploadedFileName = null;

      // Upload file nếu có
      if (deleteSelectedFile) {
        setDeleteUploadingFile(true);
        try {
          const formData = new FormData();
          formData.append("file", deleteSelectedFile);
          formData.append("studentId", studentId);
          formData.append("semester", viewingSemester.semester);
          formData.append("schoolYear", viewingSemester.schoolYear);

          const uploadResponse = await axiosInstance.post(
            "/grade/upload-file",
            formData,
            {
              headers: {
                "Content-Type": "multipart/form-data",
              },
            }
          );

          uploadedFileName = uploadResponse.data.fileName;
        } catch (uploadError) {
          handleNotify(
            "danger",
            "Lỗi upload file",
            uploadError?.response?.data?.error ||
              uploadError.message ||
              "Không thể upload file"
          );
          setDeleteUploadingFile(false);
          return;
        } finally {
          setDeleteUploadingFile(false);
        }
      }

      const payload = {
        reason: deleteReason.trim(),
        ...(deleteUploadedFileUrl && {
          attachmentFile: JSON.stringify({
            url: deleteUploadedFileUrl,
            name: deleteUploadedFileName || "File đính kèm",
          }),
        }),
      };

      await axiosInstance.post(
        `/student/${studentId}/grades/${viewingSemester.semester}/${viewingSemester.schoolYear}/request-delete`,
        payload
      );

      handleNotify(
        "success",
        "Thành công",
        `Đã gửi yêu cầu xóa kết quả học tập ${viewingSemester.semester} năm học ${viewingSemester.schoolYear}${deleteUploadedFileUrl ? " kèm file đính kèm" : ""}. Vui lòng chờ Chỉ huy phê duyệt.`
      );

      setShowDeleteModal(false);
      setViewingSemester(null);
      setDeleteReason("");
      setDeleteSelectedFile(null);
      setDeleteUploadedFileUrl(null);
      setDeleteUploadedFileName(null);
      router.push("/users/proposals/grade-results");
    } catch (err) {
      handleNotify(
        "danger",
        "Lỗi",
        err?.response?.data?.message || "Không thể gửi yêu cầu xóa"
      );
    }
  };

  const fetchLearningResult = async () => {
    if (studentId) {
      try {
        const res = await axiosInstance.get(`/student/${studentId}/grades`);
        // semesterResults từ API giờ chỉ chứa kết quả đã duyệt
        const approvedResults = res.data.semesterResults || [];

        setLearningResult(approvedResults);
        setSemesterResults(approvedResults);
      } catch (error) {
        // Silent error handling - data sẽ được load lại khi cần
      }
    }
  };

  const fetchSemesterResults = async () => {
    // Sử dụng fetchLearningResult thay vì API cũ
    await fetchLearningResult();
  };

  // Lấy studentId từ userId
  const fetchStudentId = async () => {
    try {
      // Lấy thông tin user từ API
      const userRes = await axiosInstance.get("/user/me");
      const userId = userRes.data.id;

      // Use helper route to convert userId to studentId
      const res = await axiosInstance.get(`/student/by-user/${userId}`);
      setStudentId(res.data.id);
      return res.data.id;
      } catch (error) {
        // Error handling đã được xử lý bởi axios interceptor
        return null;
      }
  };

  useEffect(() => {
    const loadData = async () => {
      await withLoading(async () => {
        await fetchStudentId();
      });
    };
    loadData();
  }, [withLoading]);

  // Fetch learning result when studentId is available
  useEffect(() => {
    if (studentId) {
      fetchLearningResult();
    }
  }, [studentId]);

  // fetch danh sách học kỳ cho user
  useEffect(() => {
    const fetchSemesters = async () => {
      try {
        const res = await axiosInstance.get(`/semester`);
        const list = (res.data || []).sort((a, b) =>
          (b.createdAt || "").localeCompare(a.createdAt || "")
        );
        setSemesters(list);
        // Mặc định hiển thị "Tất cả học kỳ" khi mới vào
        // Không set selectedSemester để giữ giá trị rỗng
      } catch (e) {
        // Silent error - không cần xử lý
      }
    };
    fetchSemesters();
  }, []);

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
                          Thời gian cập nhật
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
                      {semesterResults
                        ?.slice()
                        .sort((a, b) => {
                          // Sắp xếp theo năm học (mới nhất trước)
                          const yearComparison = b.schoolYear.localeCompare(
                            a.schoolYear
                          );
                          if (yearComparison !== 0) return yearComparison;

                          // Nếu cùng năm, sắp xếp theo học kỳ (HK3 > HK2 > HK1)
                          const getSemesterNumber = (semester) => {
                            const match = semester.match(/HK(\d+)/);
                            return match ? parseInt(match[1]) : 0;
                          };
                          return (
                            getSemesterNumber(b.semester) -
                            getSemesterNumber(a.semester)
                          );
                        })
                        .map((item, index) => (
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
                                ? new Date(item.updatedAt).toLocaleString(
                                    "vi-VN",
                                    {
                                      day: "2-digit",
                                      month: "2-digit",
                                      year: "numeric",
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    }
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
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal nhập KQ học tập theo môn */}
      {showGradeModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 pt-10 p-4">
          <div className="bg-black bg-opacity-50 inset-0 fixed"></div>
          <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-5xl max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Nhập kết quả học tập theo môn
              </h2>
              <button
                onClick={() => {
                  setShowGradeModal(false);
                  setSelectedFile(null);
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
                      onChange={(e) => setGradeSemesterCode(e.target.value)}
                      className="bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
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
                              ? `HK${s.code.split(".")[1]} - ${s.schoolYear}`
                              : s.code}
                          </option>
                        ))}
                    </select>
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
                        <th className="px-3 py-2 border-r w-1/5">Mã môn</th>
                        <th className="px-3 py-2 border-r w-2/5">Tên môn</th>
                        <th className="px-3 py-2 border-r w-1/5">Tín chỉ</th>
                        <th className="px-3 py-2 border-r w-1/5">Điểm hệ 10</th>
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

                {/* Upload file - Sử dụng UploadThing */}
                <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Tải lên file đính kèm{" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <div className="flex items-center justify-center gap-3">
                    <UploadButton
                      endpoint="gradeFiles"
                      headers={{
                        Authorization: `Bearer ${getAuthToken()}`,
                      }}
                      accept={FILE_UPLOAD_CONFIG.ACCEPTED_TYPES}
                      {...createUploadHandlers({
                        setFileUrl: setUploadedFileUrl,
                        setFileName: setUploadedFileName,
                        setUploading: setUploadingFile,
                        setSelectedFile,
                      })}
                    />
                    {uploadedFileUrl && (
                      <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
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
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                        <span>Đã upload:</span>
                        <span className="font-medium">{uploadedFileName || "File"}</span>
                        <button
                          type="button"
                          onClick={() => {
                            setUploadedFileUrl(null);
                            setUploadedFileName(null);
                            setSelectedFile(null);
                          }}
                          className="ml-2 text-red-600 hover:text-red-800 dark:text-red-400"
                          title="Xóa file"
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
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                        </button>
                      </div>
                    )}
                    {uploadingFile && (
                      <span className="text-sm text-blue-600 dark:text-blue-400">
                        Đang upload...
                      </span>
                    )}
                  </div>
                  <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                    Hỗ trợ: {FILE_UPLOAD_CONFIG.SUPPORTED_EXTENSIONS} (tối đa {FILE_UPLOAD_CONFIG.MAX_SIZE})
                  </p>
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
                    * Điểm hệ 10 sẽ được tự động chuyển đổi sang điểm chữ và
                    điểm hệ 4
                  </div>
                </div>

                <div className="flex justify-end mt-3">
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setShowGradeModal(false)}
                      className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-md"
                    >
                      Hủy
                    </button>
                    <button
                      type="submit"
                      disabled={uploadingFile}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {uploadingFile ? (
                        <>
                          <svg
                            className="animate-spin h-4 w-4"
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
                          Đang tải file...
                        </>
                      ) : (
                        "Gửi đề xuất"
                      )}
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
                Chi tiết kết quả học tập - {viewingSemester.semester} năm học{" "}
                {viewingSemester.schoolYear}
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
                    {viewingSemester.cumulativeGrade4?.toFixed(2) || "0.00"}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    CPA (Hệ 4)
                  </div>
                </div>
                <div className="bg-teal-50 dark:bg-teal-900/20 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-teal-600 dark:text-teal-400">
                    {viewingSemester.cumulativeGrade10?.toFixed(2) || "0.00"}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    CPA (Hệ 10)
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
                          ? new Date(viewingSemester.updatedAt).toLocaleString(
                              "vi-VN",
                              {
                                day: "2-digit",
                                month: "2-digit",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              }
                            )
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
                        {viewingSemester.averageGrade4?.toFixed(2) || "0.00"}
                      </div>
                      <div>
                        Trung bình hệ 10:{" "}
                        {viewingSemester.averageGrade10?.toFixed(2) || "0.00"}
                      </div>
                      <div>
                        CPA hệ 4:{" "}
                        {viewingSemester.cumulativeGrade4?.toFixed(2) || "0.00"}
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

              {/* Nút yêu cầu cập nhật / xóa */}
              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={openUpdateModal}
                  className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white font-medium rounded-lg flex items-center gap-2 transition-colors duration-200"
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
                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                    />
                  </svg>
                  Yêu cầu cập nhật
                </button>
                <button
                  onClick={openDeleteModal}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg flex items-center gap-2 transition-colors duration-200"
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
                  Yêu cầu xóa
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal yêu cầu cập nhật */}
      {showUpdateModal && viewingSemester && (
        <div className="fixed inset-0 flex items-center justify-center z-50 pt-10 p-4">
          <div
            className="bg-black bg-opacity-50 inset-0 fixed"
            onClick={() => setShowUpdateModal(false)}
          ></div>
          <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-5xl max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Yêu cầu cập nhật kết quả - {viewingSemester.semester} -{" "}
                {viewingSemester.schoolYear}
              </h2>
              <button
                onClick={() => setShowUpdateModal(false)}
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
              <form onSubmit={submitUpdateRequest} className="p-4">
                <div className="mb-4 p-3 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
                  <p className="text-sm text-orange-700 dark:text-orange-300">
                    Bạn đang yêu cầu cập nhật kết quả học tập đã được duyệt. Vui
                    lòng chỉnh sửa thông tin bên dưới và gửi đề xuất. Chỉ huy sẽ
                    xem xét và phê duyệt yêu cầu của bạn.
                  </p>
                </div>

                <div className="flex justify-end mb-4">
                  <button
                    type="button"
                    onClick={addUpdateSubjectRow}
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
                        <th className="px-3 py-2 border-r w-1/5">Mã môn</th>
                        <th className="px-3 py-2 border-r w-2/5">Tên môn</th>
                        <th className="px-3 py-2 border-r w-1/5">Tín chỉ</th>
                        <th className="px-3 py-2 border-r w-1/5">Điểm hệ 10</th>
                        <th className="px-3 py-2 w-16">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      {updateSubjects.map((row, idx) => (
                        <tr key={idx} className="border-t">
                          <td className="px-2 py-2 border-r w-1/5">
                            <input
                              type="text"
                              value={row.subjectCode}
                              onChange={(e) =>
                                updateUpdateSubjectField(
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
                                updateUpdateSubjectField(
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
                                updateUpdateSubjectField(
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
                                updateUpdateSubjectField(
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
                              onClick={() => removeUpdateSubjectRow(idx)}
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

                {/* Tổng kết */}
                <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                    Tổng kết (sau cập nhật)
                  </h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                        {calculateUpdateSummary().totalCredits}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        Tổng tín chỉ
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                        {calculateUpdateSummary().gpa4}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        GPA (Hệ 4)
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                        {calculateUpdateSummary().gpa10}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        GPA (Hệ 10)
                      </div>
                    </div>
                  </div>
                </div>

                {/* Upload file - Sử dụng UploadThing */}
                <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Tải lên file minh chứng
                  </label>
                  <div className="flex items-center gap-3">
                    <UploadButton
                      endpoint="gradeFiles"
                      headers={{
                        Authorization: `Bearer ${getAuthToken()}`,
                      }}
                      accept={FILE_UPLOAD_CONFIG.ACCEPTED_TYPES}
                      {...createUploadHandlers({
                        setFileUrl: setUpdateUploadedFileUrl,
                        setFileName: setUpdateUploadedFileName,
                        setUploading: setUpdateUploadingFile,
                        setSelectedFile: setUpdateSelectedFile,
                      })}
                    />
                    {updateUploadedFileUrl && (
                      <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
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
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                        <span>Đã upload:</span>
                        <span className="font-medium">{updateUploadedFileName || "File"}</span>
                        <button
                          type="button"
                          onClick={() => {
                            setUpdateUploadedFileUrl(null);
                            setUpdateUploadedFileName(null);
                            setUpdateSelectedFile(null);
                          }}
                          className="ml-2 text-red-600 hover:text-red-800 dark:text-red-400"
                          title="Xóa file"
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
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                        </button>
                      </div>
                    )}
                    {updateUploadingFile && (
                      <span className="text-sm text-blue-600 dark:text-blue-400">
                        Đang upload...
                      </span>
                    )}
                  </div>
                  <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                    Hỗ trợ: {FILE_UPLOAD_CONFIG.SUPPORTED_EXTENSIONS} (tối đa {FILE_UPLOAD_CONFIG.MAX_SIZE})
                  </p>
                </div>

                <div className="flex justify-end mt-4 gap-2">
                  <button
                    type="button"
                    onClick={() => setShowUpdateModal(false)}
                    className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-md"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={updateUploadingFile}
                    className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white font-medium rounded-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {updateUploadingFile ? (
                      <>
                        <svg
                          className="animate-spin h-4 w-4"
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
                        Đang tải file...
                      </>
                    ) : (
                      "Gửi yêu cầu cập nhật"
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal yêu cầu xóa */}
      {showDeleteModal && viewingSemester && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
          <div
            className="bg-black bg-opacity-50 inset-0 fixed"
            onClick={() => setShowDeleteModal(false)}
          ></div>
          <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-lg w-full">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Yêu cầu xóa kết quả học tập
              </h2>
            </div>
            <div className="p-6">
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-sm text-red-700 dark:text-red-300">
                  Bạn đang yêu cầu xóa kết quả học tập{" "}
                  <strong>
                    {viewingSemester.semester} - {viewingSemester.schoolYear}
                  </strong>
                  . Hành động này cần được Chỉ huy phê duyệt.
                </p>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Lý do xóa <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={deleteReason}
                  onChange={(e) => setDeleteReason(e.target.value)}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                  rows="3"
                  placeholder="Nhập lý do xóa kết quả học tập..."
                  required
                />
              </div>

              {/* Upload file - Sử dụng UploadThing */}
              <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Tải lên file minh chứng
                </label>
                <div className="flex items-center justify-center gap-3">
                  <UploadButton
                    endpoint="gradeFiles"
                    headers={{
                      Authorization: `Bearer ${getAuthToken()}`,
                    }}
                    accept={FILE_UPLOAD_CONFIG.ACCEPTED_TYPES}
                    {...createUploadHandlers({
                      setFileUrl: setDeleteUploadedFileUrl,
                      setFileName: setDeleteUploadedFileName,
                      setUploading: setDeleteUploadingFile,
                      setSelectedFile: setDeleteSelectedFile,
                    })}
                  />
                  {deleteUploadedFileUrl && (
                    <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
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
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      <span>Đã upload:</span>
                      <span className="font-medium">{deleteUploadedFileName || "File"}</span>
                      <button
                        type="button"
                        onClick={() => {
                          setDeleteUploadedFileUrl(null);
                          setDeleteUploadedFileName(null);
                          setDeleteSelectedFile(null);
                        }}
                        className="ml-2 text-red-600 hover:text-red-800 dark:text-red-400"
                        title="Xóa file"
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
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                    </div>
                  )}
                  {deleteUploadingFile && (
                    <span className="text-sm text-blue-600 dark:text-blue-400">
                      Đang upload...
                    </span>
                  )}
                </div>
                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                  Hỗ trợ: PDF, DOC, DOCX, JPG, PNG (tối đa 10MB)
                </p>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg"
                >
                  Hủy
                </button>
                <button
                  onClick={submitDeleteRequest}
                  disabled={deleteUploadingFile}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {deleteUploadingFile ? (
                    <>
                      <svg
                        className="animate-spin h-4 w-4"
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
                      Đang tải file...
                    </>
                  ) : (
                    "Gửi yêu cầu xóa"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default SemesterResults;
