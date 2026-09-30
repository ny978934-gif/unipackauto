import "./Products.css";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { API } from "../spareApi";

export default function Products() {
  const [products, setProducts] = useState([]);
  const [state, setState] = useState("loading"); // loading | ready | error

  useEffect(() => {
    const controller = new AbortController();
    fetch(`${API}/api/products?type=machine`, { signal: controller.signal })
      .then(async (res) => {
        if (!res.ok) throw new Error("Unable to load products.");
        const data = await res.json();
        setProducts(Array.isArray(data) ? data : []);
        setState("ready");
      })
      .catch((err) => {
        if (err.name !== "AbortError") setState("error");
      });
    return () => controller.abort();
  }, []);

  // Build the href for each product based on how deep its hierarchy goes
  const buildHref = (product) => {
    const cat    = product.category;
    const sub    = product.subCategory;
    const subSub = product.subSubCategory;
    if (cat?.slug && sub?.slug && subSub?.slug)
      return `/products/${cat.slug}/${sub.slug}/${subSub.slug}/${product.slug}`;
    if (cat?.slug && sub?.slug)
      return `/products/${cat.slug}/${sub.slug}`;
    if (cat?.slug)
      return `/products/${cat.slug}`;
    return "/products";
  };

  return (
    <section id="products" className="products">
      <div className="products__container">

        {/* Header */}
        <div className="products__header">
          <p className="products__kicker">What We Build</p>
          <h2 className="products__title">
            Machinery for every stage of the packing line
          </h2>
          <p className="products__subtitle">
            Browse our full range of packaging machines — each available in
            manual, semi-automatic and fully automatic configurations.
          </p>
        </div>

        {/* Loading */}
        {state === "loading" && (
          <div className="products__status">
            <div className="products__spinner" aria-label="Loading products" />
            <p>Loading products…</p>
          </div>
        )}

        {/* Error */}
        {state === "error" && (
          <div className="products__status products__status--error">
            <p>Unable to load products. Please try again later.</p>
          </div>
        )}

        {/* Empty */}
        {state === "ready" && products.length === 0 && (
          <div className="products__status">
            <p>No products have been added yet.</p>
            <Link to="/#contact" className="products__link" style={{ marginTop: "12px" }}>
              Contact us for the full catalogue
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2.5"
                strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </Link>
          </div>
        )}

        {/* Grid */}
        {state === "ready" && products.length > 0 && (
          <div className="products__grid">
            {products.map((p, index) => (
              <article className="products__card" key={p._id}>
                <div className="products__image-box">
                  {(p.image || p.images?.[0]) ? (
                    <img
                      src={p.image || p.images[0]}
                      alt={p.name}
                      className="products__image"
                      loading="lazy"
                      onError={(e) => { e.target.style.display = "none"; }}
                    />
                  ) : (
                    <div className="products__image-placeholder" aria-hidden="true" />
                  )}
                  <div className="products__image-overlay" />
                  <span className="products__index">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                </div>

                <div className="products__body">
                  <h3 className="products__name">{p.name}</h3>
                  {p.description && (
                    <p className="products__desc">
                      {p.description.length > 120
                        ? p.description.slice(0, 120) + "…"
                        : p.description}
                    </p>
                  )}
                  <Link to={buildHref(p)} className="products__link">
                    View product
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                      stroke="currentColor" strokeWidth="2.5"
                      strokeLinecap="round" strokeLinejoin="round">
                      <line x1="5" y1="12" x2="19" y2="12" />
                      <polyline points="12 5 19 12 12 19" />
                    </svg>
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}

      </div>
    </section>
  );
}
