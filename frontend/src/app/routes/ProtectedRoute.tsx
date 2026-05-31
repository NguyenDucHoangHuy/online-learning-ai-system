import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuthStore } from "../../stores/auth.store";
import { ROUTES } from "../../constants/routes.constants";

interface ProtectedRouteProps {
  children: React.ReactElement;
  allowedRoles?: ("STUDENT" | "TEACHER")[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles,
}) => {
  const isAuthenticated = useAuthStore((state) => Boolean(state.accessToken));
  const user = useAuthStore((state) => state.user);
  const location = useLocation();

  // 1. Nếu chưa xác thực (Chưa login), đá bay về trang Login và lưu lại URL cũ để sau khi login xong tự động redirect lại
  if (!isAuthenticated) {
    return <Navigate to={ROUTES.LOGIN} state={{ from: location }} replace />;
  }

  // 2. Nếu hệ thống đang trong quá trình nạp dữ liệu user thô, có thể hiển thị loading nhẹ ở đây
  if (allowedRoles && !user) {
    return <div className="p-8 text-center">Đang đồng bộ danh tính...</div>;
  }

  // 3. Nếu đã đăng nhập nhưng sai Role (Học sinh cố tình vào link Giáo viên hoặc ngược lại)
  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <Navigate to={ROUTES.UNAUTHORIZED} replace />;
  }

  // 4. Hợp lệ hoàn toàn, cho phép Component con hiển thị ra màn hình
  return children;
};
