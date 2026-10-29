import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { API, formatPrice, getProductUom } from "../../../spareApi";
import { useAuth } from "../../../context/AuthContext";
import { useCart } from "../../../context/CartContext";
import { useQuoteCart } from "../../../context/QuoteCartContext";
import logo from "../../../assests/logo.jpeg";
import CloudinaryImage from "./CloudinaryImage";
import "./ProductDetails.css";

export default function ProductDetails({ type = "sparepart" }) {
  const { categorySlug, productSlug } = useParams();
  const navigate = useNavigate();
  const { user }       = useAuth();
  const { addToCart }  = useCart();
  const catalogPath  = type === "machine" ? "/products"    : "/spare-parts";
  const catalogLabel = type === "machine" ? "Products / Machines" : "Spare Parts";

  const [product,       setProduct]       = useState(null);
  const [activeImage,   setActiveImage]   = useState("");
  const [state,         setState]         = useState("loading");
  const [quantity,      setQuantity]      = useState(1);
  const [cartStatus,    setCartStatus]    = useState("idle"); // idle | loading | added | error
  const [cartMessage,   setCartMessage]   = useState("");
  const [showAuthHint,  setShowAuthHint]  = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    fetch(
      `${API}/api/products/${encodeURIComponent(productSlug)}?type=${type}`,
      { signal: controller.signal }
    )
      .then((res) => {
        if (!res.ok) throw new Error("Product not found.");
        return res.json();
      })
      .then((result) => { setProduct(result); setState("ready"); })
      .catch((err)   => { if (err.name !== "AbortError") setState("error"); });
    return () => controller.abort();
  }, [productSlug, type]);

  // Reset quantity whenever the product changes
  useEffect(() => { setQuantity(1); }, [productSlug]);
  useEffect(() => { setActiveImage(""); }, [product?._id]);

  if (state === "loading") {
    return <div className="product-not-found"><h2>Loading item…</h2></div>;
  }
  if (state === "error" || !product) {
    return (
      <div className="product-not-found">
        <h2>Item not found</h2>
        <Link to={catalogPath}>← Back to {catalogLabel.toLowerCase()}</Link>
      </div>
    );
  }

  const galleryImages = [...new Set([
    ...(type === "sparepart"
      ? [product.image, ...(Array.isArray(product.images) ? product.images : [])]
      : [...(Array.isArray(product.images) ? product.images : []), product.image]),
  ].filter((imageUrl) => typeof imageUrl === "string" && imageUrl.trim()))]
    .slice(0, type === "sparepart" ? 5 : 10);
  const image        = galleryImages.includes(activeImage) ? activeImage : galleryImages[0] || "";
  const categoryName = product.category?.name || categorySlug;
  const uom          = getProductUom(product);

  // Build the spare-part prefill passed to /get-quote.
  const buildQuotePrefill = (qty = quantity) =>
    ({
      quoteType: "sparePart",
      categorySlug,
      part: {
        machine: categoryName,
        categorySlug,
        partId: product._id,
        partName: product.name,
        quantity: String(qty),
      },
    });

  const enquiryPrefill = {
    productInterest: `${categoryName} — ${product.name}`,
    message: `I would like more information about ${product.name}.`,
  };

  const handleAddToQuote = () => {
    navigate("/get-quote", { state: { quotePrefill: buildQuotePrefill(quantity) } });
  };

  const handleAddToCart = async () => {
    if (!user) {
      // Prompt login — dispatch an event the Navbar AuthModal can listen to
      setShowAuthHint(true);
      setTimeout(() => setShowAuthHint(false), 4000);
      return;
    }
    setCartStatus("loading");
    setCartMessage("");
    try {
      await addToCart(product._id, quantity);
      setCartStatus("added");
      setCartMessage(`${quantity} × ${product.name} added to cart.`);
      setTimeout(() => { setCartStatus("idle"); setCartMessage(""); }, 3000);
    } catch (err) {
      setCartStatus("error");
      setCartMessage(err.message || "Could not add to cart.");
      setTimeout(() => { setCartStatus("idle"); setCartMessage(""); }, 4000);
    }
  };

  const dec = () => setQuantity((q) => Math.max(1, q - 1));
  const inc = () => setQuantity((q) => Math.min(10000, q + 1));
  const handleQtyChange = (e) => {
    const v = parseInt(e.target.value, 10);
    if (!Number.isNaN(v) && v >= 1 && v <= 10000) setQuantity(v);
  };

  return (
    <div className="product-details-page">
      {/* Breadcrumb */}
      <div className="product-breadcrumb">
        <Link to="/">Home</Link><span>/</span>
        <Link to={catalogPath}>{catalogLabel}</Link><span>/</span>
        <Link to={`${catalogPath}/${categorySlug}`}>{categoryName}</Link><span>/</span>
        <span>{product.name}</span>
      </div>

      {/* Main */}
      <section className="product-main">
        <div className="product-gallery">
          <div className="product-image-box">
            <CloudinaryImage src={image} fallbackSrc={logo} alt={product.name} />
          </div>
          {galleryImages.length > 1 && (
            <div
              className={`product-image-gallery ${type === "sparepart" ? "product-image-gallery-sparepart" : ""}`}
              role="group"
              aria-label={`${galleryImages.length} images of ${product.name}`}
            >
              {type === "sparepart" && (
                <p className="product-image-gallery-label">
                  Product images <span>{galleryImages.length} photos</span>
                </p>
              )}
              <div className="product-image-thumbnails">
              {galleryImages.map((imageUrl, index) => (
                <button
                  className={`product-image-thumbnail ${image === imageUrl ? "active" : ""}`}
                  key={`${imageUrl}-${index}`}
                  type="button"
                  onClick={() => setActiveImage(imageUrl)}
                  aria-label={`Show image ${index + 1} of ${galleryImages.length}`}
                  aria-pressed={image === imageUrl}
                >
                  <CloudinaryImage src={imageUrl} fallbackSrc={logo} alt="" loading="lazy" />
                  <span>{index + 1}</span>
                </button>
              ))}
              </div>
            </div>
          )}
        </div>

        <div className="product-info">
          <span className="product-label">
            {type === "machine" ? "PACKAGING MACHINE" : "GENUINE SPARE PART"}
          </span>
          <h1>{product.name}</h1>

          {type === "machine" && product.partCode && (
            <div className="part-code">Item Code: <strong>{product.partCode}</strong></div>
          )}
          {type === "sparepart" && (
            <div className="product-uom">UOM: <strong>{uom || "—"}</strong></div>
          )}

          <div className="product-price">
            <span className="product-price-label">Price:</span>
            {product.price > 0 ? formatPrice(product.price) : "Price on Request"}
          </div>

          {type === "machine" && product.description && (
            <p className="product-description">{product.description}</p>
          )}

          {/* ── Quantity selector ── */}
          <div className="product-qty-row">
            <span className="product-qty-label">Quantity</span>
            <div className="product-qty-control" role="group" aria-label="Select quantity">
              <button
                type="button"
                className="qty-btn"
                aria-label="Decrease quantity"
                onClick={dec}
                disabled={quantity <= 1}
              >−</button>
              <input
                type="number"
                className="qty-input"
                min="1"
                max="10000"
                value={quantity}
                onChange={handleQtyChange}
                aria-label="Quantity"
              />
              <button
                type="button"
                className="qty-btn"
                aria-label="Increase quantity"
                onClick={inc}
                disabled={quantity >= 10000}
              >+</button>
            </div>
          </div>

          {/* ── Action buttons ── */}
          <div className="product-detail-actions">
            {/* Add to Cart — only for spare parts */}
            {type === "sparepart" && (
              <button
                type="button"
                className={`product-cart-button ${cartStatus === "loading" ? "product-cart-button--loading" : ""} ${cartStatus === "added" ? "product-cart-button--added" : ""}`}
                onClick={handleAddToCart}
                disabled={cartStatus === "loading"}
                aria-live="polite"
              >
                {cartStatus === "loading" && <span className="pd-spinner" aria-hidden="true" />}
                {cartStatus === "added"   && "✓ Added!"}
                {cartStatus === "error"   && "Try again"}
                {cartStatus === "idle"    && "🛒 Add to Cart"}
              </button>
            )}

            {type === "sparepart" && (
              <button
                type="button"
                className="product-quote-button"
                onClick={handleAddToQuote}
              >
                Add to Quote
              </button>
            )}
            <Link
              to="/#contact"
              state={{ enquiryPrefill }}
              className="product-enquiry-button"
            >
              Send Enquiry
            </Link>
          </div>

          {/* ── Cart feedback messages ── */}
          {cartMessage && (
            <p className={`product-cart-feedback ${cartStatus === "error" ? "product-cart-feedback--error" : "product-cart-feedback--success"}`} role="status">
              {cartMessage}{" "}
              {cartStatus === "added" && (
                <Link to="/cart" className="product-cart-feedback-link">View cart →</Link>
              )}
            </p>
          )}
          {showAuthHint && (
            <p className="product-cart-feedback product-cart-feedback--info" role="alert">
              Please log in to add items to your cart.
            </p>
          )}
        </div>
      </section>

      {/* Specifications */}
      {type === "machine" && product.specifications?.length > 0 && (
        <section className="product-extra">
          <div className="details-box">
            <h2>Specifications</h2>
            <div className="spec-list">
              {product.specifications.map((spec) => (
                <div className="spec-row" key={`${spec.label}-${spec.value}`}>
                  <span>{spec.label}</span>
                  <strong>{spec.value}</strong>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <div className="back-products">
        <Link to={`${catalogPath}/${categorySlug}`}>← Back to {categoryName}</Link>
      </div>
    </div>
  );
}
