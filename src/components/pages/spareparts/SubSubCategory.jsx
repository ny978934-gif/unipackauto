import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { API } from "../../../spareApi";
import CategoryImageGallery from "./CategoryImageGallery";
import "./SubSubCategory.css";

const fallbackImage = "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80";

// Localhost URL ko Cloudinary URL (dfrujlit2) me convert karne ke liye helper
const getImageUrl = (imageSrc) => {
  if (!imageSrc) return fallbackImage;
  
  if (imageSrc.includes("localhost:5000")) {
    const filename = imageSrc.split("/").pop(); // File ka naam (e.g. image.png)
    return `https://res.cloudinary.com/dfrujlit2/image/upload/${filename}`;
  }
  
  return imageSrc;
};

const newestFirst = (items = []) =>
  [...items].sort((first, second) => {
    const firstDate = first.createdAt ? new Date(first.createdAt).getTime() : 0;
    const secondDate = second.createdAt ? new Date(second.createdAt).getTime() : 0;
    return secondDate - firstDate || String(second._id).localeCompare(String(first._id));
  });

export default function SubSubCategory() {
  const { categorySlug, subCategorySlug } = useParams();
  const [data, setData] = useState(null);
  const [state, setState] = useState("loading");

  useEffect(() => {
    const controller = new AbortController();
    fetch(`${API}/api/sub-subcategories/category/${encodeURIComponent(categorySlug)}/${encodeURIComponent(subCategorySlug)}`, { signal: controller.signal })
      .then(async (response) => {
        const result = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(result.message || "Subcategory not found");
        return result;
      })
      .then((result) => {
        setData({ ...result, subSubCategories: newestFirst(result.subSubCategories) });
        setState("ready");
      })
      .catch((error) => { if (error.name !== "AbortError") setState("error"); });
    return () => controller.abort();
  }, [categorySlug, subCategorySlug]);

  return (
    <div className="subsubcategory-page">
      <section className="subsubcategory-hero">
        <div>
          <span>SPARE PARTS CATALOGUE</span>
          <h1>{data?.subCategory?.name || "Sub-subcategories"}</h1>
          <nav className="subsubcategory-breadcrumb">
            <Link to="/">Home</Link><b>/</b>
            <Link to="/spare-parts">Spare Parts</Link><b>/</b>
            <Link to={`/spare-parts/${categorySlug}`}>{data?.category?.name || categorySlug}</Link><b>/</b>
            <strong>{data?.subCategory?.name || subCategorySlug}</strong>
          </nav>
        </div>
      </section>
      <section className="subsubcategory-content">
        {state === "loading" && <p className="subsubcategory-message">Loading sub-subcategories...</p>}
        {state === "error" && <p className="subsubcategory-message">Unable to load this subcategory.</p>}
        {state === "ready" && data?.subSubCategories?.length === 0 && <p className="subsubcategory-message">No sub-subcategories available.</p>}
        
        <div className="subsubcategory-grid">
          {data?.subSubCategories?.map((item) => (
            <Link className="subsubcategory-card" key={item._id} to={`/spare-parts/${categorySlug}/${subCategorySlug}/${item.slug}`} aria-label={`Open products in ${item.name}`}>
              <div className="subsubcategory-image">
                <img 
                  src={getImageUrl(item.image)} 
                  alt={item.name} 
                  loading="lazy" 
                  onError={(e) => { e.target.src = fallbackImage; }}
                />
              </div>
              <h2>{item.name}</h2>
              <span className="subsubcategory-card-link">View products →</span>
            </Link>
          ))}
        </div>
        <Link className="subsubcategory-back" to={`/spare-parts/${categorySlug}`}>← Back to subcategories</Link>
      </section>
    </div>
  );
}
