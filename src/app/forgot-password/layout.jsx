import "./globals.css";

export const metadata = {
  title: "Quên mật khẩu",
  description: "Quên mật khẩu hệ thống",
};

export default function ForgotPasswordLayout({ children }) {
  return (
    <div className="min-h-screen bg-white dark:bg-dark-bg text-gray-900 dark:text-dark-text">
      {children}
    </div>
  );
}
