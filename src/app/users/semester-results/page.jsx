"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import SideBar from "@/components/sidebar";
import Loader from "@/components/loader";
import { useLoading } from "@/hooks";
import { handleNotify } from "../../../components/notify";
import { GRADE_MESSAGES } from "@/constants/validationMessages";
import axiosInstance from "@/utils/axiosInstance";

const SemesterResults = () => {
  const [semesters, setSemesters] = useState([]);
  const [learningResult, setLearningResult] = useState([]);
  const [semesterResults, setSemesterResults] = useState([]);
  const [showConfirmLearn, setShowConfirmLearn] = useState(false);
  const [learnId, setLearnId] = useState(null);
  const [editingSemester, setEditingSemester] = useState(null);
  const [viewingSemester, setViewingSemester] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
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
  const [studentId, setStudentId] = useState(null);

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
        // Cập nhật học kỳ hiện có - sử dụng API grade với studentId
        const response = await axiosInstance.put(
          `/student/${studentId}/grades/${term}/${schoolYear}`,
          payload
        );
        handleNotify(
          "success",
          "Thành công",
          `Đã cập nhật KQ học tập ${term} - ${schoolYear}`
        );

        // Cập nhật semester trong state thay vì refresh
        if (response.data.semesterResult) {
          setLearningResult((prev) =>
            prev.map((item) =>
              item.id === editingSemester.id
                ? response.data.semesterResult
                : item
            )
          );
          setSemesterResults((prev) =>
            prev.map((item) =>
              item.id === editingSemester.id
                ? response.data.semesterResult
                : item
            )
          );
        }

        // Đóng modal và reset state
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
      } else {
        // Thêm mới học kỳ - sử dụng API grade với studentId
        const response = await axiosInstance.post(
          `/student/${studentId}/grades`,
          payload
        );
        handleNotify(
          "success",
          "Thành công",
          `Đã nhập KQ học tập ${term} - ${schoolYear}`
        );

        // Thêm semester mới vào state thay vì refresh
        if (response.data.semesterResult) {
          setLearningResult((prev) => [...prev, response.data.semesterResult]);
          setSemesterResults((prev) => [...prev, response.data.semesterResult]);
        }

        // Đóng modal và reset state
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
      }
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

  const handleEditLearningResult = (id) => {
    console.log("handleEditLearningResult called with id:", id);
    console.log("learningResult:", learningResult);
    setLearnId(id);

    const semester = learningResult.find((item) => item.id === id);
    console.log("Found semester:", semester);
    if (semester) {
      // Set editing semester để form biết đang chỉnh sửa
      setEditingSemester(semester);

      // Tìm semester ID từ semester code và schoolYear
      const semesterData = semesters.find(
        (s) =>
          s.code === semester.semester && s.schoolYear === semester.schoolYear
      );

      if (semesterData) {
        setGradeSemesterCode(semesterData.id);
      }

      // Populate subjects data
      if (semester.subjects && semester.subjects.length > 0) {
        setGradeSubjects(
          semester.subjects.map((subject) => ({
            subjectCode: subject.subjectCode || "",
            subjectName: subject.subjectName || "",
            credits: subject.credits?.toString() || "",
            grade10: subject.gradePoint10?.toString() || "",
          }))
        );
      } else {
        // Nếu không có subjects, tạo một dòng trống
        setGradeSubjects([
          {
            subjectCode: "",
            subjectName: "",
            credits: "",
            grade10: "",
          },
        ]);
      }

      setShowGradeModal(true);
    } else {
      console.log("Semester not found for id:", id);
    }
  };

  const handleDeleteLearn = (id) => {
    setLearnId(id);
    setShowConfirmLearn(true);
  };

  const handleConfirmDeleteLearn = (learnId) => {
    if (studentId) {
      // Tìm semester data từ learnId
      const semester = learningResult.find((item) => item.id === learnId);
      if (!semester) {
        handleNotify("error", "Lỗi", "Không tìm thấy thông tin học kỳ");
        return;
      }

      axiosInstance
        .delete(
          `/student/${studentId}/grades/${semester.semester}/${semester.schoolYear}`
        )
        .then(() => {
          handleNotify(
            "success",
            "Thành công!",
            "Xóa kết quả học tập thành công"
          );
          fetchLearningResult();
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

  const fetchLearningResult = async () => {
    if (studentId) {
      try {
        const res = await axiosInstance.get(`/student/${studentId}/grades`);
        console.log("DEBUG - fetchLearningResult response:", res.data);
        console.log(
          "DEBUG - fetchLearningResult subjects:",
          res.data.semesterResults?.map((item) => ({
            id: item.id,
            semester: item.semester,
            schoolYear: item.schoolYear,
            subjectsCount: item.subjects?.length || 0,
            subjects: item.subjects,
          }))
        );

        setLearningResult(res.data.semesterResults || []);
        // Cũng set vào semesterResults để hiển thị
        setSemesterResults(res.data.semesterResults || []);
      } catch (error) {
        console.log(error);
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
      console.error("Error fetching studentId:", error);
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
        console.log(e);
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
          </div>
        </div>
      </div>

      {/* Modal Xác nhận xóa kết quả học tập */}
      {showConfirmLearn && (
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

      {/* Modal nhập/sửa KQ học tập theo môn */}
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
                      onChange={(e) => setGradeSemesterCode(e.target.value)}
                      disabled={editingSemester}
                      className={`bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 ${
                        editingSemester
                          ? "opacity-50 cursor-not-allowed bg-gray-100 dark:bg-gray-600"
                          : ""
                      }`}
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
                Chi tiết kết quả học tập - {viewingSemester.semester} - Năm học{" "}
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
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default SemesterResults;
