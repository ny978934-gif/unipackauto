import "./Products.css";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { API } from "../spareApi";
import gjImage from "../assests/logo.jpeg";
import agImage from "../assests/logo.jpeg";
import alImage from "../assests/logo.jpeg";
import anImage from "../assests/logo.jpeg";
import abImage from "../assests/logo.jpeg";
import acImage from "../assests/logo.jpeg";
import adImage from "../assests/logo.jpeg";
import aeImage from "../assests/logo.jpeg";
import afImage from "../assests/logo.jpeg";
import automaticStrappingImage from "../assests/automatic strapping machine.PNG";
import semiAutomaticStrappingImage from "../assests/semi automatic strapping machine.PNG";

const categoryImages = [
  gjImage,
  agImage,
  alImage,
  anImage,
  abImage,
  acImage,
  adImage,
  aeImage,
  afImage,
  automaticStrappingImage,
  semiAutomaticStrappingImage,
];

export default function Products() {
  const [categories, setCategories] = useState([]);
  const [state, setState] = useState("loading"); // loading | ready | error
  const homepageCategories = categories.slice(0, 10);

  useEffect(() => {
    const controller = new AbortController();
    fetch(`${API}/api/spare/categories?type=sparepart`, { signal: controller.signal })
      .then(async (res) => {
        if (!res.ok) throw new Error("Unable to load spare-part machine categories.");
        const data = await res.json();
        setCategories(Array.isArray(data) ? data : []);
        setState("ready");
      })
      .catch((err) => {
        if (err.name !== "AbortError") setState("error");
      });
    return () => controller.abort();
  }, []);

  return (
    <section id="products" className="products">
      <div className="products__container">

        {/* Header */}
        <div className="products__header">
          <p className="products__kicker">Spare Parts by Machine</p>
          <h2 className="products__title">
            Find the right parts for your packaging machine
          </h2>
          <p className="products__subtitle">
            Choose a machine to browse its available spare parts.
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
            <p>Unable to load machine categories. Please try again later.</p>
          </div>
        )}

        {/* Empty */}
        {state === "ready" && categories.length === 0 && (
          <div className="products__status">
            <p>No spare-part machine categories are available yet.</p>
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
        {state === "ready" && homepageCategories.length > 0 && (
          <div className="products__grid">
            {homepageCategories.map((category, index) => (
              <article className="products__card" key={category._id || category.slug}>
                <div className="products__image-box">
                  <img
                    src={categoryImages[index] || category.image}
                    alt={category.name}
                    className="products__image products__image--category"
                    loading="lazy"
                    onError={(event) => { event.currentTarget.style.display = "none"; }}
                  />
                  <span className="products__index">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                </div>

                <div className="products__body">
                  <h3 className="products__name">{category.name}</h3>
                  {category.description && (
                    <p className="products__desc">
                      {category.description.length > 120
                        ? category.description.slice(0, 120) + "…"
                        : category.description}
                    </p>
                  )}
                  <Link to={`/spare-parts/${category.slug}`} className="products__link">
                    View spare parts
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
