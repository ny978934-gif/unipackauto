import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { API } from "../../../spareApi";
import CloudinaryImage from "./CloudinaryImage";
import "./Products3.css";

const fallbackImage = "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80";

export default function Products() {
  const { categorySlug, subCategorySlug, subSubCategorySlug } = useParams();
  const [data, setData] = useState(null);
  const [state, setState] = useState("loading");

  useEffect(() => {
    const controller = new AbortController();
    fetch(`${API}/api/sub-subcategories/category/${encodeURIComponent(categorySlug)}/${encodeURIComponent(subCategorySlug)}/${encodeURIComponent(subSubCategorySlug)}/products`, { signal: controller.signal })
      .then((response) => { if (!response.ok) throw new Error("Subcategory not found"); return response.json(); })
      .then((result) => { setData(result); setState("ready"); })
      .catch((error) => { if (error.name !== "AbortError") setState("error"); });
    return () => controller.abort();
  }, [categorySlug, subCategorySlug, subSubCategorySlug]);

  return (
    <div className="products-page">
      <section className="products-hero"><div><h1>{data?.subCategory?.name || "Products"}</h1><div className="products-breadcrumb"><Link to="/">Home</Link><span>/</span><Link to="/spare-parts">Spare Parts</Link><span>/</span><Link to={`/spare-parts/${categorySlug}`}>{data?.category?.name || categorySlug}</Link><span>/</span><b>{data?.subCategory?.name || subCategorySlug}</b></div></div></section>
      <section className="products-content">
        {state === "loading" && <p>Loading products...</p>}
        {state === "error" && <p>Sub-subcategory not found.</p>}
        {state === "ready" && data.products.length === 0 && <p>No products available.</p>}
        <div className="products-grid">
          {data?.products.map((product) => <Link key={product._id} to={`/spare-parts/${categorySlug}/${subCategorySlug}/${subSubCategorySlug}/${product.slug}`} className="product-card"><div className="product-image"><CloudinaryImage src={product.image || product.images?.[0]} fallbackSrc={fallbackImage} alt={product.name} loading="lazy" /></div><div className="product-name">{product.name}</div></Link>)}
        </div>
      </section>
    </div>
  );
}
