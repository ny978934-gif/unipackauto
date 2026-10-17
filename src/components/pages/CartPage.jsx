import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";
import { formatPrice } from "../../spareApi";
import "./CartPage.css";

export default function CartPage() {
  const { user }                                      = useAuth();
  const { items, subtotal, gst, grandTotal, itemCount,
          loading, updateQuantity, removeItem, clearCart } = useCart();
  const navigate = useNavigate();
  const [removing, setRemoving] = useState(null); // productId being removed

  // Not logged in
  if (!user) {
    return (
      <div className="cart-empty-page">
        <div className="cart-empty-icon">🛒</div>
        <h1>Your cart</h1>
        <p>Please log in to view and manage your cart.</p>
        <Link to="/" className="cart-btn cart-btn--primary">Go to Home</Link>
      </div>
    );
  }

  // Loading
  if (loading && items.length === 0) {
    return (
      <div className="cart-empty-page">
        <div className="cart-spinner" aria-label="Loading cart" />
        <p>Loading your cart…</p>
      </div>
    );
  }

  // Empty
  if (!loading && items.length === 0) {
    return (
      <div className="cart-empty-page">
        <div className="cart-empty-icon">🛒</div>
        <h1>Your cart is empty</h1>
        <p>Browse our spare parts catalogue and add items you need.</p>
        <Link to="/spare-parts" className="cart-btn cart-btn--primary">
          Browse Spare Parts
        </Link>
      </div>
    );
  }

  const handleQtyChange = async (productId, newQty) => {
    const qty = Number(newQty);
    if (!Number.isInteger(qty) || qty < 0) return;
    try {
      await updateQuantity(productId, qty);  // qty=0 removes the item via backend
    } catch (err) {
      console.error(err);
    }
  };

  const handleRemove = async (productId) => {
    setRemoving(productId);
    try {
      await removeItem(productId);
    } catch (err) {
      console.error(err);
    } finally {
      setRemoving(null);
    }
  };

  const handleCheckout = () => {
    // Redirect to Get a Quote with cart items pre-filled
    const prefillParts = items.map((item) => ({
      partId:   item.product,
      partName: item.name,
      itemCode: item.partCode || "",
      machine: item.machine || "",
      categorySlug: item.categorySlug || "",
      quantity: String(item.quantity),
    }));
    navigate("/get-quote", {
      state: {
        quotePrefill: {
          quoteType: "sparePart",
          parts: prefillParts,
        },
      },
    });
  };

  return (
    <div className="cart-page">
      <div className="cart-container">
        {/* Header */}
        <div className="cart-heading">
          <div>
            <h1>Your Cart</h1>
            <p className="cart-count">{itemCount} item{itemCount !== 1 ? "s" : ""}</p>
          </div>
          <button
            className="cart-clear-btn"
            onClick={() => { if (window.confirm("Clear all items from cart?")) clearCart(); }}
          >
            Clear cart
          </button>
        </div>

        <div className="cart-layout">
          {/* ── Item list ── */}
          <div className="cart-items">
            {items.map((item) => (
              <div className="cart-item" key={item.product}>
                {/* Image */}
                <div className="cart-item-image">
                  {item.image
                    ? <img src={item.image} alt={item.name} loading="lazy" onError={(e) => { e.target.style.display = "none"; }} />
                    : <div className="cart-item-image-placeholder" aria-hidden="true">📦</div>
                  }
                </div>

                {/* Details */}
                <div className="cart-item-details">
                  <p className="cart-item-name">{item.name}</p>
                  {item.partCode && (
                    <p className="cart-item-code">Code: <code>{item.partCode}</code></p>
                  )}
                  <p className="cart-item-price">
                    {item.price > 0 ? formatPrice(item.price) : "Price on request"}{" "}
                    <span className="cart-item-unit">/ unit</span>
                  </p>
                </div>

                {/* Quantity */}
                <div className="cart-item-qty-wrap">
                  <label htmlFor={`qty-${item.product}`} className="sr-only">
                    Quantity for {item.name}
                  </label>
                  <div className="cart-qty-control" role="group">
                    <button
                      type="button"
                      className="cart-qty-btn"
                      aria-label="Decrease"
                      disabled={item.quantity <= 1 || removing === item.product}
                      onClick={() => handleQtyChange(item.product, item.quantity - 1)}
                    >−</button>
                    <input
                      id={`qty-${item.product}`}
                      type="number"
                      className="cart-qty-input"
                      min="1"
                      max="10000"
                      value={item.quantity}
                      onChange={(e) => handleQtyChange(item.product, Number(e.target.value))}
                      disabled={removing === item.product}
                    />
                    <button
                      type="button"
                      className="cart-qty-btn"
                      aria-label="Increase"
                      disabled={item.quantity >= 10000 || removing === item.product}
                      onClick={() => handleQtyChange(item.product, item.quantity + 1)}
                    >+</button>
                  </div>
                </div>

                {/* Line total */}
                <div className="cart-item-total">
                  {item.price > 0
                    ? formatPrice(item.lineTotal ?? item.price * item.quantity)
                    : "—"}
                </div>

                {/* Remove */}
                <button
                  className="cart-item-remove"
                  aria-label={`Remove ${item.name}`}
                  disabled={removing === item.product}
                  onClick={() => handleRemove(item.product)}
                >
                  {removing === item.product ? <span className="cart-mini-spinner" /> : "✕"}
                </button>
              </div>
            ))}
          </div>

          {/* ── Summary ── */}
          <aside className="cart-summary">
            <h2>Order Summary</h2>

            <div className="cart-summary-row">
              <span>Subtotal</span>
              <span>{subtotal > 0 ? formatPrice(subtotal) : "—"}</span>
            </div>
            <div className="cart-summary-row">
              <span>GST (18%)</span>
              <span>{gst > 0 ? formatPrice(gst) : "—"}</span>
            </div>
            <div className="cart-summary-total">
              <span>Grand Total</span>
              <strong>{grandTotal > 0 ? formatPrice(grandTotal) : "Price on request"}</strong>
            </div>

            {subtotal === 0 && (
              <p className="cart-summary-note">
                Final prices will be confirmed in your quotation.
              </p>
            )}

            <button className="cart-btn cart-btn--primary cart-btn--full" onClick={handleCheckout}>
              Proceed to Quote →
            </button>
            <Link to="/spare-parts" className="cart-btn cart-btn--outline cart-btn--full">
              ← Continue Shopping
            </Link>
          </aside>
        </div>
      </div>
    </div>
  );
}
