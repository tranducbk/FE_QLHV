import { ThemeProvider } from "../../components/ThemeProvider";
import "./globals.css";

export const metadata = {
  title: "Đăng nhập",
  description: "Đăng nhập vào hệ thống",
};

export default function LoginLayout({ children }) {
  return (
    <ThemeProvider>
      <div className="min-h-screen bg-white dark:bg-dark-bg text-gray-900 dark:text-dark-text">
        {children}
      </div>
    </ThemeProvider>
  );
}
