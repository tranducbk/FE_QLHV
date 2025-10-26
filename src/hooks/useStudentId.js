import { useState, useEffect } from "react";
import axiosInstance from "@/utils/axiosInstance";

/**
 * Custom hook to get studentId from userId
 * Converts userId (from JWT token) to studentId (student UUID)
 */
export const useStudentId = () => {
  const [studentId, setStudentId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStudentId = async () => {
      try {
        // Lấy thông tin user từ API
        const userRes = await axiosInstance.get("/user/me");
        const userId = userRes.data.id;

        // Use helper route to get studentId from userId
        const res = await axiosInstance.get(`/student/by-user/${userId}`);

        setStudentId(res.data.id);
        setError(null);
      } catch (err) {
        console.error("Error fetching studentId:", err);
        setError(err);
        setStudentId(null);
      } finally {
        setLoading(false);
      }
    };

    fetchStudentId();
  }, []);

  return { studentId, loading, error };
};

/**
 * Utility function to get studentId from userId
 * Use this for one-time conversions
 */
export const getStudentIdFromUserId = async (userId) => {
  try {
    const res = await axiosInstance.get(`/student/by-user/${userId}`);
    return res.data.id;
  } catch (error) {
    console.error("Error getting studentId from userId:", error);
    throw error;
  }
};
