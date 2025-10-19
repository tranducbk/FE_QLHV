import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";

export const metadata = {
  title: "Đặt lại mật khẩu",
  description: "Đặt lại mật khẩu",
};

export default function ResetPasswordLayout({ children }) {
  return (
    <ThemeProvider>
      <div className="min-h-screen transition-all duration-300">{children}</div>
    </ThemeProvider>
  );
}
