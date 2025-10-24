import { useState, useEffect } from "react";
import axios from "axios";
import { jwtDecode } from "jwt-decode";
import { BASE_URL } from "@/configs";

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
      const token = localStorage.getItem("token");

      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const decodedToken = jwtDecode(token);

        // Use helper route to get studentId from userId
        const res = await axios.get(
          `${BASE_URL}/student/by-user/${decodedToken.id}`,
          {
            headers: { token: `Bearer ${token}` },
          }
        );

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
  const token = localStorage.getItem("token");

  if (!token) {
    throw new Error("No token found");
  }

  try {
    const res = await axios.get(
      `${BASE_URL}/student/by-user/${userId}`,
      {
        headers: { token: `Bearer ${token}` },
      }
    );

    return res.data.id;
  } catch (error) {
    console.error("Error getting studentId from userId:", error);
    throw error;
  }
};
