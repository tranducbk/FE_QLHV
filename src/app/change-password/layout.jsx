import "./globals.css";

export const metadata = {
  title: "Đổi mật khẩu",
  description: "Đổi mật khẩu",
};

export default function ChangePasswordLayout({ children }) {
  return (
    <div className="min-h-screen bg-white dark:bg-dark-bg text-gray-900 dark:text-dark-text">
      {children}
    </div>
  );
}
