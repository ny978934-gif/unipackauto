import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function UserProtectedRoute() {
  const { user, authLoading } = useAuth();
  const location = useLocation();

  if (authLoading) {
    return <div className="user-auth-loading" role="status">Checking your session…</div>;
  }
  return user
    ? <Outlet />
    : <Navigate to="/user/login" state={{ from: location }} replace />;
}
