"use client";

import axios from "axios";
import Link from "next/link";
import dayjs from "dayjs";
import { useState, useEffect } from "react";
import SideBar from "@/components/sidebar";
import Loader from "@/components/loader";
import { useLoading } from "@/hooks";
import { BASE_URL } from "@/configs";

const DocumentDetail = ({ params }) => {
  const [documentDetail, setDocumentDetail] = useState(null);
  const [pdfUrl, setPdfUrl] = useState(null);
  const { loading, withLoading } = useLoading(true);

  const fetchDocumentDetail = async () => {
    const token = localStorage.getItem("token");

    if (token) {
      try {
        const res = await axios.get(
          `${BASE_URL}/commander/regulatory_documents/${params.documentId}`,
          {
            headers: {
              token: `Bearer ${token}`,
            },
          }
        );

        setDocumentDetail(res.data);
      } catch (error) {
        console.log(error);
      }
    }
  };

  useEffect(() => {
    const loadData = async () => {
      await withLoading(fetchDocumentDetail);
    };
    loadData();
  }, [withLoading]);

  useEffect(() => {
    if (documentDetail?.attachments) {
      const decodedPdfData = atob(documentDetail.attachments); // Giải mã base64
      const uint8Array = new Uint8Array(decodedPdfData.length);
      for (let i = 0; i < decodedPdfData.length; i++) {
        uint8Array[i] = decodedPdfData.charCodeAt(i);
      }
      const pdfBlob = new Blob([uint8Array], { type: "application/pdf" });

      // Tạo URL tạm thời cho tập tin PDF
      const url = URL.createObjectURL(pdfBlob);
      setPdfUrl(url);

      // Giải phóng URL khi component bị unmount
      return () => URL.revokeObjectURL(url);
    }
  }, [documentDetail]);

  if (loading) {
    return <Loader text="Đang tải thông báo..." />;
  }

  return (
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
                    Thông báo
                  </div>
                </div>
              </li>
            </ol>
          </nav>
        </div>
        <div className="w-full pt-8 pb-5 pl-5 pr-6 mb-5">
          <div className="bg-white dark:bg-gray-800 rounded-lg w-full shadow-lg">
            <div className="flex justify-between font-bold p-5 border-b border-gray-200 dark:border-gray-700">
              <div className="text-gray-900 dark:text-white text-lg">
                CHI TIẾT THÔNG BÁO
              </div>
            </div>
            <div className="p-6">
              {documentDetail ? (
                <div className="space-y-6">
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                      {documentDetail.title}
                    </h2>
                    <div className="text-gray-700 dark:text-gray-300 leading-relaxed">
                      {documentDetail.content}
                    </div>
                    {documentDetail.attachments && (
                      <div className="mt-6">
                        <a
                          href={pdfUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200"
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
                              d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                            />
                          </svg>
                          Xem file PDF
                        </a>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                          Cập nhật ngày{" "}
                          {dayjs(documentDetail.dateIssued).format(
                            "DD/MM/YYYY"
                          )}
                        </p>
                      </div>
                    )}
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
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                    <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                      Không có thông báo
                    </h3>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      Không tìm thấy thông báo này
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentDetail;
