import { ThemeProvider } from "../../components/ThemeProvider";
import "./globals.css";

export const metadata = {
  title: "Liên hệ với admin",
  description: "Liên hệ với admin",
};

export default function ContactLayout({ children }) {
  return (
    <ThemeProvider>
      <div className="min-h-screen bg-white dark:bg-dark-bg text-gray-900 dark:text-dark-text">
        {children}
      </div>
    </ThemeProvider>
  );
}
