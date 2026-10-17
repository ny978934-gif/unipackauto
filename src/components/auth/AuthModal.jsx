import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";
import "./AuthModal.css";

/**
 * AuthModal — slide-up modal for login and signup.
 *
 * Props:
 *   isOpen      boolean
 *   onClose     () => void
 *   defaultTab  "login" | "signup"
 */
export default function AuthModal({ isOpen, onClose, defaultTab = "login" }) {
  const { login, signup } = useAuth();
  const { fetchCart }     = useCart();
  const [tab,     setTab]     = useState(defaultTab);
  const [loading, setLoading] = useState(false);
  const [errors,  setErrors]  = useState({});
  const [general, setGeneral] = useState("");

  // Login form
  const [loginEmail,    setLoginEmail]    = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Signup form
  const [signupName,     setSignupName]     = useState("");
  const [signupEmail,    setSignupEmail]    = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupPhone,    setSignupPhone]    = useState("");
  const [signupCompany,  setSignupCompany]  = useState("");
  const [showLoginPwd,   setShowLoginPwd]   = useState(false);
  const [showSignupPwd,  setShowSignupPwd]  = useState(false);

  const firstFieldRef = useRef(null);

  // Sync tab when parent changes defaultTab
  useEffect(() => { setTab(defaultTab); }, [defaultTab]);

  // Focus first field when modal opens
  useEffect(() => {
    if (isOpen) {
      setErrors({});
      setGeneral("");
      setTimeout(() => firstFieldRef.current?.focus(), 80);
    }
  }, [isOpen, tab]);

  // Close on Escape
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    if (isOpen) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  // Prevent body scroll while open
  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  const switchTab = (t) => {
    setTab(t);
    setErrors({});
    setGeneral("");
  };

  const handleLogin = useCallback(async (e) => {
    e.preventDefault();
    setErrors({});
    setGeneral("");
    if (!loginEmail || !loginPassword) {
      setGeneral("Please enter your email and password.");
      return;
    }
    setLoading(true);
    try {
      await login(loginEmail, loginPassword);
      await fetchCart();
      onClose();
    } catch (err) {
      setGeneral(err.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [login, loginEmail, loginPassword, fetchCart, onClose]);

  const handleSignup = useCallback(async (e) => {
    e.preventDefault();
    setErrors({});
    setGeneral("");
    setLoading(true);
    try {
      await signup(signupName, signupEmail, signupPassword, signupPhone, signupCompany);
      await fetchCart();
      onClose();
    } catch (err) {
      // Server may return field-level errors
      if (err.errors) {
        setErrors(err.errors);
      }
      setGeneral(err.message || "Signup failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [signup, signupName, signupEmail, signupPassword, signupPhone, signupCompany, fetchCart, onClose]);

  if (!isOpen) return null;

  return (
    <div className="auth-overlay" role="dialog" aria-modal="true" aria-label={tab === "login" ? "Log in" : "Create account"}>
      {/* Backdrop */}
      <div className="auth-backdrop" onClick={onClose} aria-hidden="true" />

      <div className="auth-modal">
        {/* Close button */}
        <button className="auth-close" onClick={onClose} aria-label="Close">✕</button>

        {/* Brand header */}
        <div className="auth-header">
          <span className="auth-brand">UNIPACKAUTO</span>
          <h2 className="auth-title">{tab === "login" ? "Welcome back" : "Create account"}</h2>
          <p className="auth-subtitle">
            {tab === "login"
              ? "Log in to access your cart and order history."
              : "Join us to save your cart and request quotes faster."}
          </p>
        </div>

        {/* Tab switcher */}
        <div className="auth-tabs" role="tablist">
          <button
            role="tab"
            aria-selected={tab === "login"}
            className={`auth-tab ${tab === "login" ? "auth-tab--active" : ""}`}
            onClick={() => switchTab("login")}
          >
            Log In
          </button>
          <button
            role="tab"
            aria-selected={tab === "signup"}
            className={`auth-tab ${tab === "signup" ? "auth-tab--active" : ""}`}
            onClick={() => switchTab("signup")}
          >
            Sign Up
          </button>
        </div>

        {/* General error */}
        {general && <p className="auth-general-error" role="alert">{general}</p>}

        {/* ── LOGIN FORM ── */}
        {tab === "login" && (
          <form className="auth-form" onSubmit={handleLogin} noValidate>
            <div className="auth-field">
              <label htmlFor="auth-login-email">Email address</label>
              <input
                id="auth-login-email"
                ref={firstFieldRef}
                type="email"
                autoComplete="email"
                placeholder="you@company.com"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                disabled={loading}
                required
              />
            </div>

            <div className="auth-field">
              <label htmlFor="auth-login-password">Password</label>
              <div className="auth-pwd-wrap">
                <input
                  id="auth-login-password"
                  type={showLoginPwd ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="Your password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  disabled={loading}
                  required
                />
                <button
                  type="button"
                  className="auth-pwd-toggle"
                  onClick={() => setShowLoginPwd((v) => !v)}
                  aria-label={showLoginPwd ? "Hide password" : "Show password"}
                >
                  {showLoginPwd ? "👁" : "👁"}
                </button>
              </div>
            </div>

            <button type="submit" className="auth-submit" disabled={loading}>
              {loading ? <span className="auth-spinner" /> : "Log In"}
            </button>

            <p className="auth-switch">
              Don't have an account?{" "}
              <button type="button" onClick={() => switchTab("signup")}>Sign up</button>
            </p>
          </form>
        )}

        {/* ── SIGNUP FORM ── */}
        {tab === "signup" && (
          <form className="auth-form" onSubmit={handleSignup} noValidate>
            <div className={`auth-field ${errors.name ? "auth-field--error" : ""}`}>
              <label htmlFor="auth-signup-name">Full name *</label>
              <input
                id="auth-signup-name"
                ref={firstFieldRef}
                type="text"
                autoComplete="name"
                placeholder="Your full name"
                value={signupName}
                onChange={(e) => setSignupName(e.target.value)}
                disabled={loading}
                required
              />
              {errors.name && <span className="auth-field-error">{errors.name}</span>}
            </div>

            <div className={`auth-field ${errors.email ? "auth-field--error" : ""}`}>
              <label htmlFor="auth-signup-email">Email address *</label>
              <input
                id="auth-signup-email"
                type="email"
                autoComplete="email"
                placeholder="you@company.com"
                value={signupEmail}
                onChange={(e) => setSignupEmail(e.target.value)}
                disabled={loading}
                required
              />
              {errors.email && <span className="auth-field-error">{errors.email}</span>}
            </div>

            <div className={`auth-field ${errors.password ? "auth-field--error" : ""}`}>
              <label htmlFor="auth-signup-password">Password * <small>(min. 8 characters)</small></label>
              <div className="auth-pwd-wrap">
                <input
                  id="auth-signup-password"
                  type={showSignupPwd ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="Choose a strong password"
                  value={signupPassword}
                  onChange={(e) => setSignupPassword(e.target.value)}
                  disabled={loading}
                  required
                />
                <button
                  type="button"
                  className="auth-pwd-toggle"
                  onClick={() => setShowSignupPwd((v) => !v)}
                  aria-label={showSignupPwd ? "Hide password" : "Show password"}
                >
                  {showSignupPwd ? "🙈" : "👁"}
                </button>
              </div>
              {errors.password && <span className="auth-field-error">{errors.password}</span>}
            </div>

            {/* Optional fields */}
            <div className="auth-field-row">
              <div className={`auth-field ${errors.phone ? "auth-field--error" : ""}`}>
                <label htmlFor="auth-signup-phone">Phone <small>(optional)</small></label>
                <input
                  id="auth-signup-phone"
                  type="tel"
                  autoComplete="tel"
                  placeholder="+91 98765 43210"
                  value={signupPhone}
                  onChange={(e) => setSignupPhone(e.target.value)}
                  disabled={loading}
                />
                {errors.phone && <span className="auth-field-error">{errors.phone}</span>}
              </div>

              <div className="auth-field">
                <label htmlFor="auth-signup-company">Company <small>(optional)</small></label>
                <input
                  id="auth-signup-company"
                  type="text"
                  autoComplete="organization"
                  placeholder="Your company"
                  value={signupCompany}
                  onChange={(e) => setSignupCompany(e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>

            <button type="submit" className="auth-submit" disabled={loading}>
              {loading ? <span className="auth-spinner" /> : "Create Account"}
            </button>

            <p className="auth-switch">
              Already have an account?{" "}
              <button type="button" onClick={() => switchTab("login")}>Log in</button>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
