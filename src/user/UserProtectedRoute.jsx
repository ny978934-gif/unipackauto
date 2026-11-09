import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function UserProtectedRoute() {
  const { portalUser, portalAccess, portalAuthLoading } = useAuth();
  const location = useLocation();

  if (portalAuthLoading) {
    return <div className="user-auth-loading" role="status">Checking your session…</div>;
  }
  return portalUser && portalAccess
    ? <Outlet />
    : <Navigate to="/admin/login" state={{ from: location }} replace />;
}
