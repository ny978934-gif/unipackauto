import { createContext, useCallback, useContext, useEffect, useState } from "react";
import {
  API,
  clearUserToken,
  getUserToken,
  setUserToken,
  userFetch,
} from "../spareApi";

// ── Token helpers (localStorage — persists across tabs and refresh) ────────────
export { getUserToken, setUserToken, clearUserToken, userFetch };

// ── Context ───────────────────────────────────────────────────────────────────
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user,        setUser]        = useState(null);
  const [authLoading, setAuthLoading] = useState(true); // true until /me resolves

  // Restore session on mount
  useEffect(() => {
    const token = getUserToken();
    if (!token) { setAuthLoading(false); return; }

    userFetch(`${API}/api/users/me`)
      .then(async (res) => {
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
        } else {
          clearUserToken();
        }
      })
      .catch(() => clearUserToken())
      .finally(() => setAuthLoading(false));
  }, []);

  // Listen for 401 expiry events (fired by userFetch)
  useEffect(() => {
    const onExpired = () => setUser(null);
    window.addEventListener("user-auth-expired", onExpired);
    return () => window.removeEventListener("user-auth-expired", onExpired);
  }, []);

  const signup = useCallback(async (name, email, password, phone = "", company = "") => {
    const res  = await fetch(`${API}/api/users/signup`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ name, email, password, phone, company }),
    });
    const data = await res.json();
    if (!res.ok) throw data;           // throw so modal can show field errors
    setUserToken(data.token);
    setUser(data.user);
    return data.user;
  }, []);

  const login = useCallback(async (email, userId, password) => {
    const res  = await fetch(`${API}/api/users/login`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ email, userId, password }),
    });
    const data = await res.json();
    if (!res.ok) throw data;
    setUserToken(data.token);
    setUser(data.user);
    return data.user;
  }, []);

  const logout = useCallback(() => {
    clearUserToken();
    setUser(null);
    // CartContext listens to this event to wipe local cart state
    window.dispatchEvent(new Event("user-logged-out"));
  }, []);

  return (
    <AuthContext.Provider value={{ user, authLoading, signup, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
};
