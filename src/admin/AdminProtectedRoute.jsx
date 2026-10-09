import { useCallback, useEffect, useState } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { API, adminFetch, getAdminToken } from "../spareApi";

export default function AdminProtectedRoute() {
  const location = useLocation();
  const [status, setStatus] = useState(getAdminToken() ? "checking" : "unauthenticated");
  const [error, setError] = useState("");

  const verifySession = useCallback(async (signal) => {
    if (!getAdminToken()) {
      setStatus("unauthenticated");
      return;
    }
    setStatus("checking");
    setError("");
    try {
      const response = await adminFetch(`${API}/api/auth/me`, { signal });
      if (response.status === 401) {
        setStatus("unauthenticated");
        return;
      }
      if (!response.ok) throw new Error("Unable to verify the admin session.");
      setStatus("authenticated");
    } catch (requestError) {
      if (requestError.name !== "AbortError") {
        setError(requestError.message || "Unable to verify the admin session.");
        setStatus("error");
      }
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const onSessionExpired = () => setStatus("unauthenticated");
    window.addEventListener("admin-auth-expired", onSessionExpired);
    verifySession(controller.signal);
    return () => {
      controller.abort();
      window.removeEventListener("admin-auth-expired", onSessionExpired);
    };
  }, [verifySession]);

  if (status === "unauthenticated") {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }
  if (status === "error") {
    return (
      <div className="admin-auth-check" role="alert">
        <p>{error}</p>
        <button type="button" onClick={() => verifySession()}>Retry</button>
      </div>
    );
  }
  if (status !== "authenticated") {
    return <div className="admin-auth-check" role="status">Verifying admin session…</div>;
  }
  return <Outlet />;
}
