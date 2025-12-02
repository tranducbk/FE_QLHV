import SideBar from "@/components/sidebar";
import Link from "next/link";

const RegulatoryRegime = () => {
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
                    Chế độ quy định
                  </div>
                </div>
              </li>
            </ol>
          </nav>
        </div>
        <div className="w-full pt-8 pb-5 pl-5 pr-6 mb-5">
          <div className="bg-white dark:bg-gray-800 rounded-lg w-full shadow-lg">
            <div className="flex justify-between font-bold p-5 border-b border-gray-200 dark:border-gray-700">
              <div className="text-gray-900 dark:text-white">
                <h1 className="text-2xl font-bold">CHẾ ĐỘ QUY ĐỊNH</h1>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Các chế độ quy định
                </p>
              </div>
              <div className="text-gray-900 dark:text-white text-lg"></div>
            </div>
            <div className="w-full pl-6 pb-6 pr-6 mt-4">
              <div className="text-sm font-bold text-blue-600 dark:text-blue-400 mb-4">
                10 lời thề danh dự
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full border border-gray-200 dark:border-gray-700 text-center text-sm font-light text-gray-900 dark:text-white rounded-lg">
                  <thead className="bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600">
                    <tr>
                      <th
                        scope="col"
                        className="border-r border-gray-200 dark:border-gray-600 py-3 px-4 text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider"
                      >
                        Lời thề
                      </th>
                      <th
                        scope="col"
                        className="border-r border-gray-200 dark:border-gray-600 py-3 px-4 text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider"
                      >
                        Nội dung
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800">
                    <tr className="border-b border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200">
                      <td className="whitespace-nowrap font-medium border-r border-gray-200 dark:border-gray-600 py-4 px-4">
                        1
                      </td>
                      <td className="border-r border-gray-200 dark:border-gray-600 py-4 px-4 text-left">
                        Hy sinh tất cả vì tổ quốc Việt Nam; dưới sự lãnh đạo của
                        Đảng Cộng sản Việt Nam, phấn đấu thực hiện một nước Việt
                        Nam hòa bình, độc lập và xã hội chủ nghĩa, góp phần tích
                        cực vào cuộc đấu tranh của nhân dân thế giới vì hòa
                        bình, độc lập dân tộc, dân chủ và chủ nghĩa xã hội.
                        <br />
                        <span className="font-semibold text-blue-600 dark:text-blue-400">
                          "Xin Thề"
                        </span>
                      </td>
                    </tr>
                    <tr className="border-b border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200">
                      <td className="whitespace-nowrap font-medium border-r border-gray-200 dark:border-gray-600 py-4 px-4">
                        2
                      </td>
                      <td className="border-r border-gray-200 dark:border-gray-600 py-4 px-4 text-left">
                        Tuyệt đối phục tùng mệnh lệnh cấp trên; khi nhận bất cứ
                        nhiệm vụ gì đều tận tâm, tận lực thi hành nhanh chóng và
                        chính xác.
                        <br />
                        <span className="font-semibold text-blue-600 dark:text-blue-400">
                          "Xin thề"
                        </span>
                      </td>
                    </tr>
                    <tr className="border-b border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200">
                      <td className="whitespace-nowrap font-medium border-r border-gray-200 dark:border-gray-600 py-4 px-4">
                        3
                      </td>
                      <td className="border-r border-gray-200 dark:border-gray-600 py-4 px-4 text-left">
                        Không ngừng nâng cao tinh thần yêu nước Xã hội chủ
                        nghĩa, tinh thần quốc tế vô sản, rèn luyện ý chí chiến
                        đấu kiên quyết và bền bỉ, thắng không kiêu, bại không
                        nản, dù gian lao khổ hạnh cũng không sờn lòng, vào sống
                        ra chết cũng không nản chí "Nhiệm vụ nào cũng hoàn
                        thành, khó khăn nào cũng vượt qua, kẻ thù nào cũng đánh
                        thắng".
                        <br />
                        <span className="font-semibold text-blue-600 dark:text-blue-400">
                          "Xin thề"
                        </span>
                      </td>
                    </tr>
                    <tr className="border-b border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200">
                      <td className="whitespace-nowrap font-medium border-r border-gray-200 dark:border-gray-600 py-4 px-4">
                        4
                      </td>
                      <td className="border-r border-gray-200 dark:border-gray-600 py-4 px-4 text-left">
                        Ra sức học tập nâng cao trình độ chính trị, quân sự, văn
                        hóa, khoa học kỹ thuật, nghiệp vụ, triệt để chấp hành
                        điều lệnh, điều lệ, rèn luyện tính tổ chức, tính kỷ luật
                        và tác phong chính quy, xây dựng quân đội ngày càng hùng
                        mạnh, luôn luôn sẵn sàng chiến đấu.
                        <br />
                        <span className="font-semibold text-blue-600 dark:text-blue-400">
                          "Xin thề"
                        </span>
                      </td>
                    </tr>
                    <tr className="border-b border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200">
                      <td className="whitespace-nowrap font-medium border-r border-gray-200 dark:border-gray-600 py-4 px-4">
                        5
                      </td>
                      <td className="border-r border-gray-200 dark:border-gray-600 py-4 px-4 text-left">
                        Nêu cao tinh thần làm chủ tập thể xã hội chủ nghĩa, làm
                        tròn nhiệm vụ chiến đấu bảo vệ tổ quốc, xây dựng chủ
                        nghĩa xã hội và làm tròn nghĩa vụ quốc tế. Gương mẫu
                        chấp hành và vận động nhân dân thực hiện mọi đường lối,
                        chủ trương của Đảng, chính sách và luật pháp của Nhà
                        nước.
                        <br />
                        <span className="font-semibold text-blue-600 dark:text-blue-400">
                          "Xin thề"
                        </span>
                      </td>
                    </tr>
                    <tr className="border-b border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200">
                      <td className="whitespace-nowrap font-medium border-r border-gray-200 dark:border-gray-600 py-4 px-4">
                        6
                      </td>
                      <td className="border-r border-gray-200 dark:border-gray-600 py-4 px-4 text-left">
                        Luôn luôn cảnh giác, tuyệt đối giữ bí mật quân sự và bí
                        mật quốc gia. Nếu bị quân địch bắt, dù phải chịu cực
                        hình tàn khốc thế nào cũng cương quyết một lòng trung
                        thành với sự nghiệp cách mạng, không bao giờ phản bội
                        xưng khai.
                        <br />
                        <span className="font-semibold text-blue-600 dark:text-blue-400">
                          "Xin thề"
                        </span>
                      </td>
                    </tr>
                    <tr className="border-b border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200">
                      <td className="whitespace-nowrap font-medium border-r border-gray-200 dark:border-gray-600 py-4 px-4">
                        7
                      </td>
                      <td className="border-r border-gray-200 dark:border-gray-600 py-4 px-4 text-left">
                        Đoàn kết chặt chẽ với nhau như ruột thịt trên tình
                        thương yêu giai cấp; hết lòng giúp đỡ nhau lúc thường
                        cũng như lúc ra trận; thực hiện toàn quân một ý chí.
                        <br />
                        <span className="font-semibold text-blue-600 dark:text-blue-400">
                          "Xin thề"
                        </span>
                      </td>
                    </tr>
                    <tr className="border-b border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200">
                      <td className="whitespace-nowrap font-medium border-r border-gray-200 dark:border-gray-600 py-4 px-4">
                        8
                      </td>
                      <td className="border-r border-gray-200 dark:border-gray-600 py-4 px-4 text-left">
                        Ra sức giữ gìn vũ khí trang bị, quyết không để hư hỏng
                        hoặc rơi vào tay quân thù. Luôn nêu cao tinh thần bảo vệ
                        của công, không tham ô, lãng phí.
                        <br />
                        <span className="font-semibold text-blue-600 dark:text-blue-400">
                          "Xin thề"
                        </span>
                      </td>
                    </tr>
                    <tr className="border-b border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200">
                      <td className="whitespace-nowrap font-medium border-r border-gray-200 dark:border-gray-600 py-4 px-4">
                        9
                      </td>
                      <td className="border-r border-gray-200 dark:border-gray-600 py-4 px-4 text-left">
                        Khi tiếp xúc với nhân dân làm đúng ba điều nên:
                        <br />
                        + Kính trọng dân
                        <br />
                        + Giúp đỡ dân
                        <br />
                        + Bảo vệ dân
                        <br />
                        và ba điều răn:
                        <br />
                        + Không lấy của dân
                        <br />
                        + Không dọa nạt dân
                        <br />
                        + Không quấy nhiễu dân
                        <br />
                        Để gây lòng tin cậy, yêu mến của nhân dân, thực hiện
                        quân với dân một ý chí.
                        <br />
                        <span className="font-semibold text-blue-600 dark:text-blue-400">
                          "Xin thề"
                        </span>
                      </td>
                    </tr>
                    <tr className="border-b border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200">
                      <td className="whitespace-nowrap font-medium border-r border-gray-200 dark:border-gray-600 py-4 px-4">
                        10
                      </td>
                      <td className="border-r border-gray-200 dark:border-gray-600 py-4 px-4 text-left">
                        Giữ vững phẩm chất tốt đẹp và truyền thống quyết chiến,
                        quyết thắng của quân đội nhân dân, luôn tự phê bình và
                        phê bình, không làm điều gì hại tới danh dự của quân đội
                        và quốc thể nước Cộng hòa Xã hội Chủ nghĩa Việt Nam.
                        <br />
                        <span className="font-semibold text-blue-600 dark:text-blue-400">
                          "Xin thề"
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegulatoryRegime;
