import React from "react";

const Spinner = ({ size = "md", color = "brand" }) => {
  const sizeClasses = {
    sm: "h-4 w-4 border-2",
    md: "h-8 w-8 border-2",
    lg: "h-12 w-12 border-3",
    xl: "h-16 w-16 border-4"
  };

  const colorClasses = {
    brand: "border-brand-500 border-t-transparent",
    white: "border-white border-t-transparent",
    gray: "border-gray-600 border-t-transparent"
  };

  return (
    <div
      className={`animate-spin rounded-full ${sizeClasses[size] || sizeClasses.md} ${colorClasses[color] || colorClasses.brand}`}
      role="status"
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
};

export default Spinner;
