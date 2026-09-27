import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { API } from "../../../spareApi";
import logo from "../../../assests/logo.jpeg";
import CloudinaryImage from "./CloudinaryImage";
import "./Products3.css";

export default function Products({ type = "sparepart" }) {
  const { categorySlug } = useParams();
  const catalogPath = type === "machine" ? "/products" : "/spare-parts";
  const catalogLabel = type === "machine" ? "Products / Machines" : "Spare Parts";
  const [category, setCategory] = useState(null);
  const [products, setProducts] = useState([]);
  const [state, setState] = useState("loading");
  const [search, setSearch] = useState("");

  const visibleProducts = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query || type !== "sparepart") return products;
    return products.filter((product) => product.name.toLowerCase().includes(query));
  }, [products, search, type]);

  useEffect(() => {
    const controller = new AbortController();
    Promise.all([
      fetch(`${API}/api/spare/categories/${encodeURIComponent(categorySlug)}?type=${type}`, { signal: controller.signal }),
      fetch(`${API}/api/products?category=${encodeURIComponent(categorySlug)}&type=${type}`, { signal: controller.signal }),
    ])
      .then(async ([categoryResponse, productsResponse]) => {
        if (!categoryResponse.ok || !productsResponse.ok) throw new Error("Unable to load this category.");
        const [categoryData, productData] = await Promise.all([categoryResponse.json(), productsResponse.json()]);
        setCategory(categoryData.category);
        setProducts(Array.isArray(productData) ? productData : []);
        setState("ready");
      })
      .catch((error) => {
        if (error.name !== "AbortError") setState("error");
      });
    return () => controller.abort();
  }, [categorySlug, type]);

  return (
    <div className="products-page">
      <section className="products-hero">
        <div>
          <h1>{category?.name || catalogLabel}</h1>
          <div className="products-breadcrumb">
            <Link to="/">Home</Link><span>/</span><Link to={catalogPath}>{catalogLabel}</Link><span>/</span><b>{category?.name || categorySlug}</b>
          </div>
        </div>
      </section>
      <section className="products-content">
        {state === "loading" && <p>Loading {type === "machine" ? "products" : "spare parts"}...</p>}
        {state === "error" && <p>Unable to load this category. Please try again later.</p>}
        {type === "sparepart" && state === "ready" && products.length > 0 && (
          <div className="spare-part-search">
            <label htmlFor="spare-part-search">Find a spare part</label>
            <div className="spare-part-search-field">
              <span aria-hidden="true">⌕</span>
              <input
                id="spare-part-search"
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search spare parts by name..."
              />
              {search && <button type="button" onClick={() => setSearch("")}>Clear</button>}
            </div>
          </div>
        )}
        {state === "ready" && products.length === 0 && <p>No items are available in this category yet.</p>}
        {state === "ready" && products.length > 0 && visibleProducts.length === 0 && <p>No spare parts match “{search}”.</p>}
        <div className="products-grid">
          {visibleProducts.map((product) => (
            <article className="product-card" key={product._id}>
              <Link className="product-card-link" to={`${catalogPath}/${categorySlug}/${product.slug}`} aria-label={`View details for ${product.name}`}>
                <div className="product-image">
                  <CloudinaryImage src={product.image || product.images?.[0]} fallbackSrc={logo} alt={product.name} loading="lazy" />
                </div>
              </Link>
              <div className="product-name">{product.name}</div>
              <Link className="product-card-details" to={`${catalogPath}/${categorySlug}/${product.slug}`}>View Details</Link>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
