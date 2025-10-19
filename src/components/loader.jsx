const Loader = ({
  size = "default",
  text = "Loading...",
  overlay = true,
  className = "",
  spinnerClassName = "",
}) => {
  const sizeClasses = {
    small: "h-4 w-4",
    default: "h-8 w-8",
    large: "h-12 w-12",
  };

  const textSizes = {
    small: "text-xs",
    default: "text-sm",
    large: "text-base",
  };

  return (
    <div
      className={`${
        overlay
          ? "fixed inset-0 flex items-center justify-center z-[9999] bg-white bg-opacity-75 dark:bg-gray-900 dark:bg-opacity-75"
          : "flex items-center justify-center"
      } ${className}`}
    >
      <div className="flex flex-col items-center space-y-2">
        <div
          className={`inline-block ${sizeClasses[size]} animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite] ${spinnerClassName}`}
          role="status"
        >
          <span className="!absolute !-m-px !h-px !w-px !overflow-hidden !whitespace-nowrap !border-0 !p-0 ![clip:rect(0,0,0,0)]">
            {text}
          </span>
        </div>
        {text && (
          <p className={`text-gray-600 dark:text-gray-400 ${textSizes[size]}`}>
            {text}
          </p>
        )}
      </div>
    </div>
  );
};

export default Loader;
