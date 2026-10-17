import { createContext, useCallback, useContext, useEffect, useReducer } from "react";
import { API } from "../spareApi";
import { getUserToken, userFetch } from "./AuthContext";

// ── State ─────────────────────────────────────────────────────────────────────
const initialState = { items: [], subtotal: 0, gst: 0, grandTotal: 0, itemCount: 0, loading: false, error: null };

const reducer = (state, action) => {
  switch (action.type) {
    case "LOADING":    return { ...state, loading: true,  error: null };
    case "SET_CART":   return { ...state, loading: false, error: null, ...action.payload };
    case "SET_COUNT":  return { ...state, itemCount: action.count };
    case "ERROR":      return { ...state, loading: false, error: action.message };
    case "CLEAR":      return { ...initialState };
    default:           return state;
  }
};

// ── Context ───────────────────────────────────────────────────────────────────
const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  // ── Fetch full cart from server ──────────────────────────────────────────────
  const fetchCart = useCallback(async () => {
    if (!getUserToken()) return;                      // not logged in
    dispatch({ type: "LOADING" });
    try {
      const res  = await userFetch(`${API}/api/cart`);
      if (!res.ok) { dispatch({ type: "ERROR", message: "Could not load cart." }); return; }
      const data = await res.json();
      dispatch({ type: "SET_CART", payload: data });
    } catch {
      dispatch({ type: "ERROR", message: "Could not load cart." });
    }
  }, []);

  // Load cart when a token already exists on mount
  useEffect(() => {
    if (getUserToken()) fetchCart();
  }, [fetchCart]);

  // Re-load cart after login
  useEffect(() => {
    const onExpired = () => dispatch({ type: "CLEAR" });
    const onLogout  = () => dispatch({ type: "CLEAR" });
    window.addEventListener("user-auth-expired", onExpired);
    window.addEventListener("user-logged-out",   onLogout);
    return () => {
      window.removeEventListener("user-auth-expired", onExpired);
      window.removeEventListener("user-logged-out",   onLogout);
    };
  }, []);

  // ── Actions ──────────────────────────────────────────────────────────────────

  const addToCart = useCallback(async (productId, quantity = 1) => {
    const res  = await userFetch(`${API}/api/cart/items`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ productId, quantity }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Could not add to cart.");
    dispatch({ type: "SET_COUNT", count: data.itemCount });
    // Refresh full cart state
    await fetchCart();
    return data;
  }, [fetchCart]);

  const updateQuantity = useCallback(async (productId, quantity) => {
    const res  = await userFetch(`${API}/api/cart/items/${productId}`, {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ quantity }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Could not update cart.");
    await fetchCart();
  }, [fetchCart]);

  const removeItem = useCallback(async (productId) => {
    const res  = await userFetch(`${API}/api/cart/items/${productId}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Could not remove item.");
    await fetchCart();
  }, [fetchCart]);

  const clearCart = useCallback(async () => {
    await userFetch(`${API}/api/cart`, { method: "DELETE" });
    dispatch({ type: "CLEAR" });
  }, []);

  return (
    <CartContext.Provider value={{ ...state, fetchCart, addToCart, updateQuantity, removeItem, clearCart }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside <CartProvider>");
  return ctx;
};
