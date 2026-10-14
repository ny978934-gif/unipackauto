import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { API, formatPrice, getProductUom } from "../../../spareApi";
import logo from "../../../assests/logo.jpeg";
import CloudinaryImage from "./CloudinaryImage";
import "./ProductDetails.css";

export default function ProductDetails({ type = "sparepart" }) {
  const { categorySlug, productSlug } = useParams();
  const navigate = useNavigate();
  const catalogPath  = type === "machine" ? "/products"    : "/spare-parts";
  const catalogLabel = type === "machine" ? "Products / Machines" : "Spare Parts";

  const [product,  setProduct]  = useState(null);
  const [state,    setState]    = useState("loading");
  const [quantity, setQuantity] = useState(1);

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

  const image        = product.image || product.images?.[0] || "";
  const categoryName = product.category?.name || categorySlug;
  const uom          = getProductUom(product);

  // Build the prefill objects passed to /get-quote and /#contact
  const buildQuotePrefill = (qty = quantity) =>
    type === "machine"
      ? { quoteType: "machine", machineType: categoryName, model: product.name }
      : {
          quoteType: "sparePart",
          categorySlug,
          part: {
            machine:     categoryName,
            categorySlug,
            partId:      product._id,
            partName:    product.name,
            itemCode:    product.partCode || "",
            quantity:    String(qty),
          },
        };

  const enquiryPrefill = {
    productInterest: `${categoryName} — ${product.name}`,
    message: `I would like more information about ${product.name}.`,
  };

  const handleAddToQuote = () => {
    navigate("/get-quote", { state: { quotePrefill: buildQuotePrefill(quantity) } });
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
        <div className="product-image-box">
          <CloudinaryImage src={image} fallbackSrc={logo} alt={product.name} />
        </div>

        <div className="product-info">
          <span className="product-label">
            {type === "machine" ? "PACKAGING MACHINE" : "GENUINE SPARE PART"}
          </span>
          <h1>{product.name}</h1>

          {product.partCode && (
            <div className="part-code">Item Code: <strong>{product.partCode}</strong></div>
          )}
          {type === "sparepart" && (
            <div className="product-uom">UOM: <strong>{uom || "—"}</strong></div>
          )}

          <div className="product-price">
            <span className="product-price-label">Price:</span>
            {product.price > 0 ? formatPrice(product.price) : "Price on Request"}
          </div>

          {product.description && (
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
            <button
              type="button"
              className="product-quote-button"
              onClick={handleAddToQuote}
            >
              Add to Quote
            </button>
            <Link
              to="/#contact"
              state={{ enquiryPrefill }}
              className="product-enquiry-button"
            >
              Send Enquiry
            </Link>
          </div>
        </div>
      </section>

      {/* Specifications */}
      {product.specifications?.length > 0 && (
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
