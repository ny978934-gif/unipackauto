/**
 * QuoteCartContext
 *
 * Lightweight, localStorage-backed quote cart.
 * No login required — works for all visitors.
 * Each item stores:
 *   { partId, partName, itemCode, categorySlug, machine, image, price, quantity }
 *
 * "price" is the catalogue price for display/calculation only.
 * All final prices are validated server-side before a quote is saved.
 */
import { createContext, useCallback, useContext, useEffect, useReducer } from "react";

const STORAGE_KEY = "unipack-quote-cart";
const MAX_ITEMS   = 30;

// ── Helpers ────────────────────────────────────────────────────────────────────

const load = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const save = (items) => {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(items)); } catch { /* quota full */ }
};

// ── Reducer ────────────────────────────────────────────────────────────────────

const reducer = (state, action) => {
  let next;
  switch (action.type) {

    case "ADD": {
      const existing = state.findIndex((i) => i.partId === action.item.partId);
      if (existing >= 0) {
        // Increase quantity of existing item
        next = state.map((item, idx) =>
          idx === existing
            ? { ...item, quantity: Math.min(item.quantity + action.item.quantity, 10_000) }
            : item
        );
      } else if (state.length >= MAX_ITEMS) {
        return state; // silently cap at 30
      } else {
        next = [...state, { ...action.item }];
      }
      break;
    }

    case "UPDATE_QTY": {
      const qty = Number(action.quantity);
      if (qty <= 0) {
        next = state.filter((i) => i.partId !== action.partId);
      } else {
        next = state.map((i) =>
          i.partId === action.partId ? { ...i, quantity: Math.min(qty, 10_000) } : i
        );
      }
      break;
    }

    case "REMOVE":
      next = state.filter((i) => i.partId !== action.partId);
      break;

    case "CLEAR":
      next = [];
      break;

    case "LOAD":
      return action.items; // direct replace — no save needed (already in storage)

    default:
      return state;
  }

  save(next);
  return next;
};

// ── Context ────────────────────────────────────────────────────────────────────

const QuoteCartContext = createContext(null);

export function QuoteCartProvider({ children }) {
  const [items, dispatch] = useReducer(reducer, [], load);

  // Sync from storage when another tab changes it
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === STORAGE_KEY) {
        dispatch({ type: "LOAD", items: load() });
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  // ── Derived values ─────────────────────────────────────────────────────────

  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);

  const subtotal = items.reduce((sum, i) => {
    const price = typeof i.price === "number" ? i.price : 0;
    return sum + price * i.quantity;
  }, 0);

  const gst        = Math.round(subtotal * 18) / 100;
  const grandTotal = subtotal + gst;

  // ── Actions ────────────────────────────────────────────────────────────────

  /**
   * addItem({ partId, partName, itemCode, categorySlug, machine, image, price, quantity })
   */
  const addItem = useCallback((item) => {
    if (!item.partId) return;
    dispatch({
      type: "ADD",
      item: {
        partId:       String(item.partId),
        partName:     item.partName     || "",
        itemCode:     item.itemCode     || "",
        categorySlug: item.categorySlug || "",
        machine:      item.machine      || "",
        image:        item.image        || "",
        price:        typeof item.price === "number" ? item.price : 0,
        quantity:     Math.max(1, Math.floor(Number(item.quantity) || 1)),
      },
    });
  }, []);

  const updateQty = useCallback((partId, quantity) => {
    dispatch({ type: "UPDATE_QTY", partId, quantity });
  }, []);

  const removeItem = useCallback((partId) => {
    dispatch({ type: "REMOVE", partId });
  }, []);

  const clearCart = useCallback(() => {
    dispatch({ type: "CLEAR" });
  }, []);

  return (
    <QuoteCartContext.Provider value={{
      items, itemCount, subtotal, gst, grandTotal,
      addItem, updateQty, removeItem, clearCart,
    }}>
      {children}
    </QuoteCartContext.Provider>
  );
}

export const useQuoteCart = () => {
  const ctx = useContext(QuoteCartContext);
  if (!ctx) throw new Error("useQuoteCart must be used inside <QuoteCartProvider>");
  return ctx;
};
