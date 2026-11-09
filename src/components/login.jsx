import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { API, setAdminToken } from "../spareApi";
import { useAuth } from "../context/AuthContext";
import logo from "../assests/logo.jpeg";
import "./login.css";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [userId, setUserId] = useState("");
  const [loginType, setLoginType] = useState("admin");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { portalLogin } = useAuth();
  const isSetup = location.pathname === "/admin/setup";

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (!isSetup && loginType === "user") {
        await portalLogin(email, userId, password);
        setPassword("");
        navigate("/user", { replace: true });
        return;
      }
      const response = await fetch(`${API}/api/auth/${isSetup ? "setup" : "login"}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          ...(isSetup ? { passwordConfirmation } : {}),
        }),
      });
      const responseText = await response.text();
      let data;
      try {
        data = responseText ? JSON.parse(responseText) : {};
      } catch {
        if (response.status === 404 || response.headers.get("content-type")?.includes("text/html")) {
          throw new Error("The backend does not have the admin authentication API yet. Deploy the latest server code and try again.");
        }
        throw new Error("The backend returned an unreadable response. Please try again.");
      }
      if (!response.ok) throw new Error(data.message || (isSetup
        ? "Unable to create the initial admin account."
        : "Unable to sign in."));
      if (!data.token) throw new Error("The server returned an invalid authentication response.");
      setAdminToken(data.token);
      setPassword("");
      const destination = location.state?.from?.pathname;
      navigate(destination?.startsWith("/admin") && destination !== "/admin/login" ? destination : "/admin", {
        replace: true,
      });
    } catch (loginError) {
      setError(loginError.message || "Unable to sign in. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-login-page">
      <section className="admin-login-card">
        <div className="admin-login-brand">
          <img src={logo} alt="Unipack Auto logo" />
        </div>
        {!isSetup && (
          <div className="admin-login-options" role="tablist" aria-label="Login type">
            <button
              type="button"
              role="tab"
              aria-selected={loginType === "admin"}
              className={loginType === "admin" ? "active" : ""}
              onClick={() => {
                setLoginType("admin");
                setError("");
                setPassword("");
              }}
            >
              Admin Login
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={loginType === "user"}
              className={loginType === "user" ? "active" : ""}
              onClick={() => {
                setLoginType("user");
                setError("");
                setPassword("");
              }}
            >
              User Login
            </button>
          </div>
        )}
        <h1>{isSetup ? "Create first admin" : loginType === "admin" ? "Admin sign in" : "User sign in"}</h1>
        <p className="admin-login-intro">
          {isSetup
            ? "Create the first admin account using the email authorized by the site administrator."
            : loginType === "admin"
              ? "Sign in with your authorized administrator account."
              : "Sign in with the email, User ID, and password provided by your administrator."}
        </p>
        <form onSubmit={submit}>
            <div className="admin-login-field">
              <label htmlFor="admin-email">Email</label>
              <input
                id="admin-email"
                type="email"
                autoComplete="username"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </div>
            {!isSetup && loginType === "user" && (
              <div className="admin-login-field">
                <label htmlFor="admin-route-user-id">User ID</label>
                <input
                  id="admin-route-user-id"
                  type="text"
                  autoComplete="username"
                  value={userId}
                  onChange={(event) => setUserId(event.target.value)}
                  required
                />
              </div>
            )}
            <div className="admin-login-field">
              <label htmlFor="admin-password">Password</label>
              <input
                id="admin-password"
                type="password"
                autoComplete={isSetup ? "new-password" : "current-password"}
                minLength={isSetup ? 12 : undefined}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
            </div>
            {isSetup && (
              <div className="admin-login-field">
                <label htmlFor="admin-password-confirmation">Confirm password</label>
                <input
                  id="admin-password-confirmation"
                  type="password"
                  autoComplete="new-password"
                  minLength={12}
                  value={passwordConfirmation}
                  onChange={(event) => setPasswordConfirmation(event.target.value)}
                  required
                />
              </div>
            )}
            {error && <p className="admin-login-error" role="alert">{error}</p>}
            <button className="admin-login-submit" type="submit" disabled={loading}>
              {loading
                ? (isSetup ? "Creating admin…" : "Signing in…")
                : (isSetup ? "Create admin account" : loginType === "admin" ? "Admin Login" : "User Login")}
            </button>
        </form>
        {!isSetup && (
          <p className="admin-login-setup-link">
            First-time setup? <Link to="/admin/setup">Create the initial admin account</Link>
          </p>
        )}
      </section>
    </div>
  );
}