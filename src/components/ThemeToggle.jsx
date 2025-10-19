"use client";

import { useThemeContext } from "./ThemeProvider";

export const ThemeToggle = ({ className = "" }) => {
  const { theme, toggleTheme, isLoading } = useThemeContext();

  if (isLoading) {
    return (
      <div
        className={`w-12 h-7 bg-gray-200 rounded-full animate-pulse ${className}`}
      />
    );
  }

  return (
    <button
      onClick={toggleTheme}
      className={`relative inline-flex items-center justify-center w-12 h-7 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${className}`}
      aria-label={`Chuyển sang chế độ ${theme === "light" ? "tối" : "sáng"}`}
    >
      <div
        className={`w-full h-full rounded-full transition-colors duration-200 ${
          theme === "dark" ? "bg-blue-600" : "bg-gray-200"
        }`}
      />

      <div
        className={`absolute left-0.5 w-6 h-6 bg-white rounded-full shadow-md transform transition-transform duration-200 ${
          theme === "dark" ? "translate-x-5" : "translate-x-0"
        }`}
      />

      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div
          className={`absolute left-1.5 transition-opacity duration-200 ${
            theme === "light" ? "opacity-100" : "opacity-0"
          }`}
        >
          <svg
            className="w-3.5 h-3.5 text-yellow-500"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"
              clipRule="evenodd"
            />
          </svg>
        </div>

        <div
          className={`absolute right-1.5 transition-opacity duration-200 ${
            theme === "dark" ? "opacity-100" : "opacity-0"
          }`}
        >
          <svg
            className="w-3.5 h-3.5 text-blue-300"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
          </svg>
        </div>
      </div>
    </button>
  );
};
