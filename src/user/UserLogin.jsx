import { useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./UserDashboard.css";

export default function UserLogin() {
  const { user, authLoading, login } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (authLoading) return <div className="user-auth-loading" role="status">Checking your session…</div>;
  if (user) return <Navigate to="/user" replace />;

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await login(email, userId, password);
      navigate(location.state?.from?.pathname || "/user", { replace: true });
    } catch (loginError) {
      setError(loginError.message || "Unable to sign in.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="user-login-page">
      <section className="user-login-card">
        <span className="user-dashboard-eyebrow">UNIPACKAUTO</span>
        <h1>User sign in</h1>
        <p>Use the email, User ID, and password provided for your account.</p>
        <form onSubmit={submit}>
          <label>
            Email
            <input type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
          </label>
          <label>
            User ID
            <input type="text" autoComplete="username" value={userId} onChange={(event) => setUserId(event.target.value)} required />
          </label>
          <label>
            Password
            <input type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required />
          </label>
          {error && <p className="user-dashboard-error" role="alert">{error}</p>}
          <button type="submit" disabled={submitting}>{submitting ? "Signing in…" : "Sign in"}</button>
        </form>
      </section>
    </div>
  );
}
