import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { API } from "../../../spareApi";
import "./SpareParts.css";

const newestFirst = (items = []) =>
  [...items].sort((first, second) => {
    const firstDate = first.createdAt ? new Date(first.createdAt).getTime() : 0;
    const secondDate = second.createdAt ? new Date(second.createdAt).getTime() : 0;
    return secondDate - firstDate || String(second._id).localeCompare(String(first._id));
  });

export default function SpareParts({ type = "sparepart" }) {
  const [categories, setCategories] = useState([]);
  const [state, setState] = useState("loading");
  const catalogPath = type === "machine" ? "/products" : "/spare-parts";
  const isMachineCatalog = type === "machine";

  useEffect(() => {
    const controller = new AbortController();
    fetch(`${API}/api/spare/categories?type=${type}`, { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error("Unable to load categories");
        return response.json();
      })
      .then((data) => {
        setCategories(newestFirst(Array.isArray(data) ? data : []));
        setState("ready");
      })
      .catch((error) => {
        if (error.name !== "AbortError") setState("error");
      });
    return () => controller.abort();
  }, [type]);

  return (
    <div className="spare-page">
      <section className="spare-hero">
        <div className="spare-hero-content">
          <span className="spare-tag">UNIPACK AUTO INDIA</span>
          <h1>
            {isMachineCatalog ? "Packaging Machines" : "Genuine Spare Parts"}
            <br />
            <span>{isMachineCatalog ? "Built for Your Production Line" : "For Packaging Machines"}</span>
          </h1>
          <p>
            {isMachineCatalog
              ? "Explore reliable packaging machines designed for your production needs."
              : "Explore genuine, precision-manufactured replacement parts for your packaging machines."}
          </p>
        </div>
      </section>

      <section className="category-section">
        <div className="section-heading">
          <span>{isMachineCatalog ? "MACHINES CATALOGUE" : "SPARE PARTS CATALOGUE"}</span>
          <h2>{isMachineCatalog ? "Choose a product category" : "Choose a machine category"}</h2>
        </div>

        {state === "loading" && <p>Loading categories...</p>}
        {state === "error" && <p>Unable to load categories. Please try again later.</p>}
        {state === "ready" && categories.length === 0 && <p>No categories available yet.</p>}

        <div className="category-grid">
          {categories.map((category) => (
            <Link key={category._id} to={`${catalogPath}/${category.slug}`} className="category-card">
              <h3>{category.name}</h3>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}