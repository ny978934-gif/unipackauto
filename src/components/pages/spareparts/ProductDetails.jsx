import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { API, formatPrice, getProductUom } from "../../../spareApi";
import logo from "../../../assests/logo.jpeg";
import CloudinaryImage from "./CloudinaryImage";
import "./ProductDetails.css";

export default function ProductDetails({ type = "sparepart" }) {
  const { categorySlug, productSlug } = useParams();
  const catalogPath = type === "machine" ? "/products" : "/spare-parts";
  const catalogLabel = type === "machine" ? "Products / Machines" : "Spare Parts";
  const [product, setProduct] = useState(null);
  const [state, setState] = useState("loading");

  useEffect(() => {
    const controller = new AbortController();
    fetch(`${API}/api/products/${encodeURIComponent(productSlug)}?type=${type}`, { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error("Product not found.");
        return response.json();
      })
      .then((result) => {
        setProduct(result);
        setState("ready");
      })
      .catch((error) => {
        if (error.name !== "AbortError") setState("error");
      });
    return () => controller.abort();
  }, [productSlug, type]);

  if (state === "loading") return <div className="product-not-found"><h2>Loading item...</h2></div>;
  if (state === "error" || !product) {
    return <div className="product-not-found"><h2>Item not found</h2><Link to={catalogPath}>← Back to {catalogLabel.toLowerCase()}</Link></div>;
  }

  const image = product.image || product.images?.[0] || "";
  const categoryName = product.category?.name || categorySlug;
  const uom = getProductUom(product);
  const quotePrefill = type === "machine"
    ? {
      quoteType: "machine",
      machineType: categoryName,
      model: product.name,
    }
    : {
      quoteType: "sparePart",
      part: {
        machine: "",
        partName: product.name,
        itemCode: product.partCode || "",
        quantity: "1",
      },
    };
  const enquiryPrefill = {
    productInterest: `${categoryName} — ${product.name}`,
    message: `I would like more information about ${product.name}.`,
  };

  return (
    <div className="product-details-page">
      <div className="product-breadcrumb">
        <Link to="/">Home</Link><span>/</span><Link to={catalogPath}>{catalogLabel}</Link><span>/</span>
        <Link to={`${catalogPath}/${categorySlug}`}>{categoryName}</Link><span>/</span><span>{product.name}</span>
      </div>
      <section className="product-main">
        <div className="product-image-box">
          <CloudinaryImage src={image} fallbackSrc={logo} alt={product.name} />
        </div>
        <div className="product-info">
          <span className="product-label">{type === "machine" ? "PACKAGING MACHINE" : "GENUINE SPARE PART"}</span>
          <h1>{product.name}</h1>
          {product.partCode && <div className="part-code">Item Code: <strong>{product.partCode}</strong></div>}
          {type === "sparepart" && <div className="product-uom">UOM: <strong>{uom || "—"}</strong></div>}
          <div className="product-price">
            <span className="product-price-label">Price:</span>
            {product.price > 0 ? formatPrice(product.price) : "Price on Request"}
          </div>
          {product.description && <p className="product-description">{product.description}</p>}
          <div className="product-detail-actions">
            <Link to="/get-quote" state={{ quotePrefill }} className="product-quote-button">
              Get a Quote
            </Link>
            <Link to="/#contact" state={{ enquiryPrefill }} className="product-enquiry-button">
              Send Enquiry
            </Link>
          </div>
        </div>
      </section>
      {product.specifications?.length > 0 && (
        <section className="product-extra">
          <div className="details-box">
            <h2>Specifications</h2>
            <div className="spec-list">
              {product.specifications.map((spec) => (
                <div className="spec-row" key={`${spec.label}-${spec.value}`}><span>{spec.label}</span><strong>{spec.value}</strong></div>
              ))}
            </div>
          </div>
        </section>
      )}
      <div className="back-products"><Link to={`${catalogPath}/${categorySlug}`}>← Back to {categoryName}</Link></div>
    </div>
  );
}
