import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { API, formatPrice } from "../../../spareApi";
import "./ProductDetails.css";

const fallbackImage = "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=1000&q=80";

export default function ProductDetails() {
  const { categorySlug, subCategorySlug, subSubCategorySlug, productSlug } = useParams();
  const [product, setProduct] = useState(null);
  const [state, setState] = useState("loading");

  useEffect(() => {
    const controller = new AbortController();
    fetch(`${API}/api/products/${encodeURIComponent(productSlug)}`, { signal: controller.signal })
      .then((response) => { if (!response.ok) throw new Error("Product not found"); return response.json(); })
      .then((data) => { setProduct(data); setState("ready"); })
      .catch((error) => { if (error.name !== "AbortError") setState("error"); });
    return () => controller.abort();
  }, [productSlug]);

  if (state === "loading") return <div className="product-not-found"><h2>Loading product...</h2></div>;
  if (state === "error" || !product) return <div className="product-not-found"><h2>Product not found</h2><Link to="/spare-parts">← Back to spare parts</Link></div>;

  const category = product.category?.name || categorySlug;
  const backUrl = subSubCategorySlug
    ? `/spare-parts/${categorySlug}/${subCategorySlug}/${subSubCategorySlug}`
    : subCategorySlug ? `/spare-parts/${categorySlug}/${subCategorySlug}` : `/spare-parts/${categorySlug}`;
  return <div className="product-details-page"><div className="product-breadcrumb"><Link to="/">Home</Link><span>/</span><Link to="/spare-parts">Spare Parts</Link><span>/</span><Link to={`/spare-parts/${categorySlug}`}>{category}</Link><span>/</span><span>{product.name}</span></div>
    <section className="product-main"><div className="product-image-box"><img src={product.image || product.images?.[0] || fallbackImage} alt={product.name} /></div><div className="product-info"><span className="product-label">GENUINE REPLACEMENT PART</span><h1>{product.name}</h1>{product.partCode && <div className="part-code">Part Code: <strong>{product.partCode}</strong></div>}<div className="product-price">{product.price ? formatPrice(product.price) : "Price on Request"}</div><div className={product.inStock ? "stock available" : "stock unavailable"}>{product.inStock ? "✓ In Stock" : "✕ Out of Stock"}</div><p className="product-description">{product.description}</p><a className="order-btn" href={`mailto:info@unipackauto.in?subject=${encodeURIComponent(`Order inquiry: ${product.name}`)}`}>Order / Inquire via Email →</a></div></section>
    {product.specifications?.length > 0 && <section className="product-extra"><div className="details-box"><h2>Technical Specifications</h2><div className="spec-list">{product.specifications.map((spec) => <div className="spec-row" key={`${spec.label}-${spec.value}`}><span>{spec.label}</span><strong>{spec.value}</strong></div>)}</div></div></section>}
    <div className="back-products"><Link to={backUrl}>← Back to {category}</Link></div>
  </div>;
}
