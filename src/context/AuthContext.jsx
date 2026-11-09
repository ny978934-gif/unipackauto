import { createContext, useCallback, useContext, useEffect, useState } from "react";
import {
  API,
  clearPortalToken,
  clearUserToken,
  getPortalToken,
  getUserToken,
  portalFetch,
  setPortalToken,
  setUserToken,
  userFetch,
} from "../spareApi";

// Public customer credentials remain separate from the admin-route portal session.
export { getUserToken, setUserToken, clearUserToken, userFetch };

// ── Context ───────────────────────────────────────────────────────────────────
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user,        setUser]        = useState(null);
  const [portalUser, setPortalUser] = useState(null);
  const [portalAccess, setPortalAccess] = useState(false);
  const [authLoading, setAuthLoading] = useState(true); // true until /me resolves
  const [portalAuthLoading, setPortalAuthLoading] = useState(true);

  // Restore public customer and portal sessions independently.
  useEffect(() => {
    const userToken = getUserToken();
    const portalToken = getPortalToken();
    if (!userToken) setAuthLoading(false);
    if (!portalToken) setPortalAuthLoading(false);

    if (userToken) {
      userFetch(`${API}/api/users/me`)
        .then(async (res) => {
          if (res.ok) setUser((await res.json()).user);
          else clearUserToken();
        })
        .catch(() => clearUserToken())
        .finally(() => setAuthLoading(false));
    }

    if (portalToken) {
      portalFetch(`${API}/api/users/me`)
        .then(async (res) => {
          if (res.ok) {
            const data = await res.json();
            setPortalUser(data.user);
            setPortalAccess(Boolean(data.portalAccess));
          } else {
            clearPortalToken();
          }
        })
        .catch(() => clearPortalToken())
        .finally(() => setPortalAuthLoading(false));
    }
  }, []);

  // Listen for 401 expiry events (fired by userFetch)
  useEffect(() => {
    const onExpired = () => {
      setUser(null);
    };
    window.addEventListener("user-auth-expired", onExpired);
    return () => window.removeEventListener("user-auth-expired", onExpired);
  }, []);

  useEffect(() => {
    const onExpired = () => {
      setPortalUser(null);
      setPortalAccess(false);
    };
    window.addEventListener("portal-auth-expired", onExpired);
    return () => window.removeEventListener("portal-auth-expired", onExpired);
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

  const login = useCallback(async (email, password) => {
    const res  = await fetch(`${API}/api/users/login`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw data;
    setUserToken(data.token);
    setUser(data.user);
    return data.user;
  }, []);

  const portalLogin = useCallback(async (email, userId, password) => {
    const res = await fetch(`${API}/api/users/portal-login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, userId, password }),
    });
    const data = await res.json();
    if (!res.ok) throw data;
    setPortalToken(data.token);
    setPortalUser(data.user);
    setPortalAccess(true);
    return data.user;
  }, []);

  const logout = useCallback(() => {
    clearUserToken();
    setUser(null);
    // CartContext listens to this event to wipe local cart state
    window.dispatchEvent(new Event("user-logged-out"));
  }, []);

  const portalLogout = useCallback(() => {
    clearPortalToken();
    setPortalUser(null);
    setPortalAccess(false);
  }, []);

  return (
    <AuthContext.Provider value={{
      user,
      portalUser,
      portalAccess,
      authLoading,
      portalAuthLoading,
      signup,
      login,
      portalLogin,
      logout,
      portalLogout,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
};
