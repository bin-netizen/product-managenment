
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function ProtectedRoute() {
  const { isAuthenticated, isLoading } = useAuth();

  // Chờ kiểm tra trạng thái đăng nhập
  if (isLoading) {
    return <p>Đang kiểm tra đăng nhập...</p>;
  }

  // Chưa đăng nhập thì chuyển về Login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Đã đăng nhập thì cho phép truy cập
  return <Outlet />;
}

export default ProtectedRoute;
