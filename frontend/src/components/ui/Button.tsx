import React, { ButtonHTMLAttributes } from "react";

// Mở rộng interface để hỗ trợ tất cả các variant và size bạn đang dùng trong RealtimeMonitorPage
interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:
    | "primary"
    | "secondary"
    | "outline"
    | "ghost"
    | "danger"
    | "success";
  size?: "default" | "sm" | "lg" | "icon";
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = "primary",
  size = "default",
  className = "",
  ...props
}) => {
  // Cấu hình các phong cách màu sắc (Variants)
  const variants = {
    primary: "bg-[#34A853] text-white hover:bg-[#2e944a]",
    secondary: "bg-[#EEEEEE] text-[#555555] hover:bg-[#e0e0e0]",
    outline:
      "border border-slate-300 bg-transparent text-slate-700 hover:bg-slate-100",
    ghost:
      "bg-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100",
    danger: "border border-red-500 text-red-600 hover:bg-red-50",
    success: "border border-green-500 text-green-600 hover:bg-green-50",
  };

  // Cấu hình các kích thước (Sizes)
  const sizes = {
    default: "px-6 py-2",
    sm: "px-3 py-1.5 text-xs",
    lg: "px-8 py-3 text-base",
    icon: "p-2 aspect-square", // Dành cho các nút chứa icon như LayoutGrid, List [cite: 34]
  };

  const baseClass =
    "inline-flex items-center justify-center rounded font-medium text-sm transition-colors duration-200 focus:outline-none disabled:opacity-50";

  return (
    <button
      className={`${baseClass} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};
