
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { API } from "../../../spareApi";
import CategoryImageGallery from "./CategoryImageGallery";
import "./SubCategory.css";

const fallbackImage =
  "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80";

const newestFirst = (items = []) =>
  [...items].sort((first, second) => {
    const firstDate = first.createdAt
      ? new Date(first.createdAt).getTime()
      : 0;

    const secondDate = second.createdAt
      ? new Date(second.createdAt).getTime()
      : 0;

    return (
      secondDate - firstDate ||
      String(second._id).localeCompare(String(first._id))
    );
  });

export default function SubCategory({ type = "sparepart" }) {
  const { categorySlug } = useParams();
  const catalogPath = type === "machine" ? "/products" : "/spare-parts";
  const catalogLabel = type === "machine" ? "Products" : "Spare Parts";

  const [data, setData] = useState(null);
  const [state, setState] = useState("loading");

  useEffect(() => {
    const controller = new AbortController();

    fetch(
      `${API}/api/spare/categories/${encodeURIComponent(categorySlug)}?type=${type}`,
      {
        signal: controller.signal,
      }
    )
      .then((response) => {
        if (!response.ok) {
          throw new Error("Category not found");
        }

        return response.json();
      })
      .then((result) => {
        setData({
          ...result,
          subCategories: newestFirst(result.subCategories),
        });

        setState("ready");
      })
      .catch((error) => {
        if (error.name !== "AbortError") {
          console.error(error);
          setState("error");
        }
      });

    return () => controller.abort();
  }, [categorySlug, type]);

  const category = data?.category;

  return (
    <div className="subcategory-page">
      <section className="subcategory-hero">
        <div>
          <h1>{category?.name || catalogLabel}</h1>

          <div className="subcategory-breadcrumb">
            <Link to="/">Home</Link>
            <span>/</span>

            <Link to={catalogPath}>{catalogLabel}</Link>
            <span>/</span>

            <b>{category?.name || categorySlug}</b>
          </div>
        </div>
      </section>

      <section className="subcategory-content">
        {state === "loading" && (
          <p>Loading subcategories...</p>
        )}

        {state === "error" && (
          <p>Category not found.</p>
        )}

        {state === "ready" &&
          data?.subCategories?.length === 0 && (
            <p>No subcategories available.</p>
          )}

        <div className="subcategory-grid">
          {data?.subCategories?.map((subCategory) => (
            <article
              key={subCategory._id}
              className="subcategory-card"
            >
              <div className="subcategory-image">
                <CategoryImageGallery
                  images={
                    subCategory.images?.length
                      ? subCategory.images
                      : [subCategory.image]
                  }
                  fallbackImage={fallbackImage}
                  alt={subCategory.name}
                />
              </div>

              <Link
                to={`${catalogPath}/${categorySlug}/${subCategory.slug}`}
                className="subcategory-title"
                aria-label={`Open ${subCategory.name}`}
              >
                <span>{subCategory.name}</span>
                <b>View subcategories →</b>
              </Link>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
