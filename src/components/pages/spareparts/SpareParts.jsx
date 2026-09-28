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

export default function SpareParts() {
  const [categories, setCategories] = useState([]);
  const [state, setState] = useState("loading");

  useEffect(() => {
    const controller = new AbortController();
    fetch(`${API}/api/spare/categories`, { signal: controller.signal })
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
  }, []);

  return (
    <div className="spare-page">
      <section className="spare-hero">
        <div className="spare-hero-content">
          <span className="spare-tag">UNIPACK AUTO INDIA</span>
          <h1>
            Genuine Spare Parts
            <br />
            <span>For Packaging Machines</span>
          </h1>
          <p>Explore genuine, precision-manufactured replacement parts for your packaging machines.</p>
        </div>
      </section>

      <section className="category-section">
        <div className="section-heading">
          <span>SPARE PARTS CATALOGUE</span>
          <h2>Choose a machine category</h2>
        </div>

        {state === "loading" && <p>Loading categories...</p>}
        {state === "error" && <p>Unable to load categories. Please try again later.</p>}
        {state === "ready" && categories.length === 0 && <p>No categories available yet.</p>}

        <div className="category-grid">
          {categories.map((category) => (
            <Link key={category._id} to={`/spare-parts/${category.slug}`} className="category-card">
              <h3>{category.name}</h3>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}