import { ThemeProvider } from "../components/ThemeProvider";
import "./globals.css";

export const metadata = {
  title: "Student Manager",
  description: "Hệ thống quản lý sinh viên",
  icons: {
    icon: "/logo-msa.png",
    shortcut: "/logo-msa.png",
    apple: "/logo-msa.png",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <body className="bg-white dark:bg-dark-bg text-gray-900 dark:text-dark-text transition-colors duration-200">
        <div className="background-pattern"></div>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
