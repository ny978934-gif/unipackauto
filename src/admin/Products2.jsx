import { useEffect, useMemo, useRef, useState } from "react";
import { API, adminFetch, formatPrice, getProductUom } from "../spareApi";
import "./AdminPages.css";

const emptyProduct = {
  categoryId: "",
  subcategoryId: "",
  name: "",
  slug: "",
  partCode: "",
  price: "",
  stock: "",
  uom: "",
  imageUrl: "",
  description: "",
  inStock: true,
};

export default function Products({ type = "sparepart" }) {
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState(emptyProduct);
  const [editingId, setEditingId] = useState("");
  const [imageUrls, setImageUrls] = useState("");
  const [images, setImages] = useState([]);
  const [specifications, setSpecifications] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const formCardRef = useRef(null);
  const nameInputRef = useRef(null);
  const itemLabel = type === "machine" ? "machine" : "spare part";
  const collectionLabel = type === "machine" ? "Products / Machines" : "Spare Parts";

  const load = async (signal) => {
    const options = signal ? { signal } : {};
    const [categoryResponse, productResponse] = await Promise.all([
      adminFetch(`${API}/api/spare/categories?type=${type}`, options),
      adminFetch(`${API}/api/products?type=${type}`, options),
    ]);
    if (!categoryResponse.ok) throw new Error("Unable to load spare-part categories.");
    if (!productResponse.ok) throw new Error("Unable to load spare parts.");
    const [categoryData, productData] = await Promise.all([categoryResponse.json(), productResponse.json()]);
    setCategories(Array.isArray(categoryData) ? categoryData : []);
    setProducts(Array.isArray(productData) ? productData : []);
  };

  useEffect(() => {
    const controller = new AbortController();
    load(controller.signal).catch((error) => {
      if (error.name !== "AbortError") setMessage(error.message);
    });
    return () => controller.abort();
  }, [type]);

  const filteredProducts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return products.filter((product) => {
      if (selectedCategoryId && (product.category?._id || product.category) !== selectedCategoryId) return false;
      const searchableFields = type === "sparepart"
        ? [product.name, product.category?.name, getProductUom(product)]
        : [product.name, product.partCode, product.category?.name];
      return !query || searchableFields
        .some((value) => String(value || "").toLowerCase().includes(query));
    });
  }, [products, searchQuery, selectedCategoryId, type]);

  const resetForm = () => {
    setForm({ ...emptyProduct });
    setEditingId("");
    setImageUrls("");
    setImages([]);
    setSpecifications([]);
  };

  const submit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    try {
      const body = new FormData();
      if (type === "sparepart") {
        const urlList = imageUrls.split(/\r?\n/).map((url) => url.trim()).filter(Boolean);
        if (urlList.length + images.length > 5) {
          throw new Error("A spare part may have at most 5 images in total.");
        }
        Object.entries({
          categoryId: form.categoryId,
          name: form.name,
          price: form.price,
          uom: form.uom,
          type,
        }).forEach(([key, value]) => body.append(key, String(value)));
        body.append("imageUrls", JSON.stringify(urlList));
        images.forEach((file) => body.append("images", file));
      } else {
        Object.entries({ ...form, type }).forEach(([key, value]) => body.append(key, String(value)));
        body.append("image", form.imageUrl);
        body.append("images", JSON.stringify(form.imageUrl ? [form.imageUrl] : []));
        body.append("specifications", JSON.stringify(specifications.filter((item) => item.label.trim() && item.value.trim())));
        images.forEach((file) => body.append("images", file));
      }
      const response = await adminFetch(
        editingId ? `${API}/api/products/${editingId}` : `${API}/api/products`,
        { method: editingId ? "PUT" : "POST", body }
      );
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || `Unable to save ${itemLabel}.`);
      if (type === "sparepart" && form.uom.trim() && getProductUom(data) !== form.uom.trim()) {
        throw new Error("The server response is missing the UOM value. This product may have been saved without it. Update and redeploy the backend, then edit the existing product to add its UOM.");
      }
      setMessage(editingId ? `${itemLabel} updated successfully.` : `${itemLabel} saved successfully.`);
      setSelectedCategoryId(form.categoryId);
      resetForm();
      await load();
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  const edit = (product) => {
    setEditingId(product._id);
    setForm({
      categoryId: product.category?._id || product.category || "",
      subcategoryId: product.subcategory?._id || product.subcategory || "",
      name: product.name || "",
      slug: product.slug || "",
      partCode: product.partCode || "",
      price: product.price ?? "",
      stock: product.stock ?? "",
      uom: getProductUom(product),
      imageUrl: product.image || product.images?.[0] || "",
      description: product.description || "",
      inStock: Boolean(product.inStock),
    });
    setImageUrls(
      (product.images?.length ? product.images : product.image ? [product.image] : []).join("\n")
    );
    setSpecifications(product.specifications || []);
    setImages([]);
    setMessage("");
    setSelectedCategoryId(product.category?._id || product.category || "");
  };

  useEffect(() => {
    if (!editingId) return;
    formCardRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    const focusTimer = window.setTimeout(() => nameInputRef.current?.focus(), 350);
    return () => window.clearTimeout(focusTimer);
  }, [editingId]);

  const remove = async (id) => {
    if (!window.confirm(`Delete this ${itemLabel}?`)) return;
    try {
      const response = await adminFetch(`${API}/api/products/${id}`, { method: "DELETE" });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || `Unable to delete ${itemLabel}.`);
      setProducts((items) => items.filter((item) => item._id !== id));
      if (editingId === id) resetForm();
      setMessage(data.message || `${itemLabel} deleted.`);
    } catch (error) {
      setMessage(error.message);
    }
  };

  const removeCategoryParts = async () => {
    const category = categories.find((item) => item._id === selectedCategoryId);
    if (!category) {
      setMessage("Select a valid spare-part category before deleting its parts.");
      return;
    }
    const categoryProducts = products.filter(
      (product) => (product.category?._id || product.category) === selectedCategoryId
    );
    if (!categoryProducts.length) {
      setMessage(`There are no spare parts to delete in ${category.name}.`);
      return;
    }
    if (!window.confirm(`Permanently delete all ${categoryProducts.length} spare part(s) in "${category.name}"? Parts in other categories will not be affected.`)) return;

    setLoading(true);
    setMessage("");
    try {
      const response = await adminFetch(`${API}/api/products/category/${selectedCategoryId}`, {
        method: "DELETE",
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || "Unable to delete parts in this category.");
      if (editingId && categoryProducts.some((product) => product._id === editingId)) resetForm();
      setMessage(data.message || `${data.deletedCount} spare part(s) deleted from ${category.name}.`);
      await load();
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  const downloadExcel = async (categoryId = "") => {
    setDownloading(true);
    setMessage("");
    try {
      const query = categoryId ? `?category=${encodeURIComponent(categoryId)}` : "";
      const response = await adminFetch(`${API}/api/products/export.xlsx${query}`);
      if (!response.ok) {
        await response.json().then((data) => {
          throw new Error(data.message || "Unable to export spare parts.");
        });
      }
      const file = await response.blob();
      const objectUrl = URL.createObjectURL(file);
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = categoryId
        ? `spare-parts-${categories.find((category) => category._id === categoryId)?.slug || "category"}.xlsx`
        : "spare-parts-all.xlsx";
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(objectUrl);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setDownloading(false);
    }
  };

  const updateField = (field, value) => setForm((current) => ({ ...current, [field]: value }));

  return (
    <div className="admin-page">
      <div className="page-title"><div><h1>{collectionLabel} management</h1><p>Add, search, edit, and remove catalogue items.</p></div></div>
      {message && <p className="admin-notice" role="status">{message}</p>}

      <div className="admin-form-card" ref={formCardRef}>
        <h2>{editingId ? `Edit ${itemLabel}` : `Add ${itemLabel}`}</h2>
        <form onSubmit={submit}>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor={`product-category-${type}`}>{type === "sparepart" ? "Machine Name" : "Machine category"} *</label>
              <select id={`product-category-${type}`} required value={form.categoryId} onChange={(event) => setForm((current) => ({ ...current, categoryId: event.target.value, subcategoryId: "" }))}>
                <option value="">Select machine</option>
                {categories.map((category) => <option key={category._id} value={category._id}>{category.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label htmlFor={`product-name-${type}`}>{type === "machine" ? "Product name" : "Spare part name"} *</label>
              <input ref={nameInputRef} id={`product-name-${type}`} required value={form.name} onChange={(event) => updateField("name", event.target.value)} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor={`product-price-${type}`}>Price (INR)</label>
              <input id={`product-price-${type}`} type="number" min="0" step="0.01" value={form.price} onChange={(event) => updateField("price", event.target.value)} />
            </div>
            {type === "sparepart" && (
              <div className="form-group">
                <label htmlFor="product-uom">UOM (Unit of Measurement)</label>
                <input id="product-uom" value={form.uom} placeholder="e.g. piece, set, meter" onChange={(event) => updateField("uom", event.target.value)} />
              </div>
            )}
          </div>
          {type === "sparepart" ? (
            <div className="form-group">
              <label htmlFor="product-image-urls">Spare Image URLs (one per line, up to 5)</label>
              <textarea
                id="product-image-urls"
                value={imageUrls}
                rows={Math.min(Math.max(imageUrls.split(/\r?\n/).length, 2), 5)}
                onChange={(event) => {
                  const nextUrls = event.target.value;
                  const urlCount = nextUrls.split(/\r?\n/).map((url) => url.trim()).filter(Boolean).length;
                  if (urlCount + images.length > 5) {
                    setMessage("A spare part may have at most 5 images in total.");
                    return;
                  }
                  setImageUrls(nextUrls);
                  setMessage("");
                }}
                placeholder={"https://example.com/part-front.jpg\nhttps://example.com/part-side.jpg"}
              />
              {imageUrls.split(/\r?\n/).map((url) => url.trim()).filter(Boolean).map((url) => (
                <img key={url} className="admin-product-image-preview" src={url} alt={`${form.name || "Spare part"} preview`} />
              ))}
            </div>
          ) : (
            <div className="form-group">
              <label htmlFor={`product-image-url-${type}`}>Image URL</label>
              <input id={`product-image-url-${type}`} type="url" value={form.imageUrl} placeholder="https://example.com/product-image.jpg" onChange={(event) => updateField("imageUrl", event.target.value)} />
              {form.imageUrl && <img className="admin-product-image-preview" src={form.imageUrl} alt={`${form.name || "Product"} preview`} />}
            </div>
          )}
          <div className="form-group">
            <label htmlFor={`product-images-${type}`}>{type === "sparepart" ? "Upload spare part images (up to 5)" : "Upload images (up to 10)"}</label>
            <input
              id={`product-images-${type}`}
              type="file"
              accept="image/*"
              multiple
              onChange={(event) => {
                const selectedImages = Array.from(event.target.files || []);
                if (type === "sparepart") {
                  const urlCount = imageUrls.split(/\r?\n/).map((url) => url.trim()).filter(Boolean).length;
                  const remaining = Math.max(0, 5 - urlCount);
                  setImages(selectedImages.slice(0, remaining));
                  if (selectedImages.length > remaining) {
                    setMessage("A spare part may have at most 5 images in total.");
                  }
                } else {
                  setImages(selectedImages.slice(0, 10));
                }
              }}
            />
            <small>
              {images.length
                ? `${images.length} image file(s) selected. ${type === "sparepart" ? "They will be added to the image URLs above." : "They replace existing images."}`
                : type === "sparepart"
                  ? "Choose up to 5 image files; uploaded images can be combined with image URLs."
                  : "Choose image files to upload or enter an image URL above."}
            </small>
          </div>
          {type === "machine" && (
            <>
              <div className="form-group">
                <label htmlFor={`product-slug-${type}`}>Slug</label>
                <input id={`product-slug-${type}`} value={form.slug} placeholder="Generated from name if empty" onChange={(event) => updateField("slug", event.target.value)} />
              </div>
              <div className="form-group">
                <label htmlFor={`product-description-${type}`}>Description</label>
                <textarea id={`product-description-${type}`} value={form.description} onChange={(event) => updateField("description", event.target.value)} />
              </div>
              <div className="form-group">
                <label>Specifications</label>
                {specifications.map((item, index) => (
                  <div className="form-row" key={`${index}-${item.label}`}>
                    <input aria-label={`Specification ${index + 1} name`} placeholder="Name" value={item.label} onChange={(event) => setSpecifications((all) => all.map((entry, i) => i === index ? { ...entry, label: event.target.value } : entry))} />
                    <input aria-label={`Specification ${index + 1} value`} placeholder="Value" value={item.value} onChange={(event) => setSpecifications((all) => all.map((entry, i) => i === index ? { ...entry, value: event.target.value } : entry))} />
                    <button type="button" className="delete-btn" onClick={() => setSpecifications((all) => all.filter((_, i) => i !== index))}>Remove</button>
                  </div>
                ))}
                <button type="button" className="edit-btn" onClick={() => setSpecifications((all) => [...all, { label: "", value: "" }])}>+ Add specification</button>
              </div>
              <label className="checkbox-field"><input type="checkbox" checked={form.inStock} onChange={(event) => updateField("inStock", event.target.checked)} /> In stock</label>
            </>
          )}
          <button className="primary-btn" disabled={loading || !categories.length}>{loading ? "Saving..." : editingId ? `Update ${itemLabel}` : `Save ${itemLabel}`}</button>
          {editingId && <button type="button" className="edit-btn" onClick={resetForm}>Cancel edit</button>}
        </form>
      </div>

      <div className="admin-table-card">
        <div className="table-header admin-products-table-header">
          <h2>{collectionLabel}</h2>
          <div className="admin-products-actions">
            <span>{filteredProducts.length} of {products.length}</span>
            {type === "sparepart" && (
              <>
                <button type="button" className="edit-btn" onClick={() => downloadExcel()} disabled={downloading}>
                  {downloading ? "Preparing Excel..." : "Download All Excel"}
                </button>
                <button
                  type="button"
                  className="edit-btn"
                  onClick={() => downloadExcel(selectedCategoryId)}
                  disabled={!selectedCategoryId || downloading}
                >
                  Download Category Excel
                </button>
                {selectedCategoryId && (
                  <button type="button" className="delete-btn" onClick={removeCategoryParts} disabled={loading}>
                    Delete All Parts in Category
                  </button>
                )}
              </>
            )}
          </div>
        </div>
        <div className="admin-table-search">
          <label htmlFor={`product-category-filter-${type}`}>Show category</label>
          <select
            id={`product-category-filter-${type}`}
            value={selectedCategoryId}
            onChange={(event) => setSelectedCategoryId(event.target.value)}
          >
            <option value="">All categories</option>
            {categories.map((category) => <option key={category._id} value={category._id}>{category.name}</option>)}
          </select>
        </div>
        <div className="admin-table-search">
          <label htmlFor={`product-search-${type}`}>
            {type === "sparepart" ? "Search by spare part, machine, or UOM" : "Search by product or machine"}
          </label>
          <input id={`product-search-${type}`} type="search" value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Search catalogue..." />
        </div>
        <div className="table-wrapper">
          <table>
            <thead>
              {type === "sparepart"
                ? <tr><th>Machine Name</th><th>Spare Part Name</th><th>Spare Image</th><th>Price</th><th>UOM</th><th>Actions</th></tr>
                : <tr><th>Name</th><th>Machine name</th><th>Price</th><th>Actions</th></tr>}
            </thead>
            <tbody>
              {filteredProducts.map((item) => (
                <tr key={item._id}>
                  {type === "sparepart" ? (
                    <>
                      <td>{item.category?.name || "—"}</td>
                      <td>{item.name}</td>
                      <td>{item.image || item.images?.[0]
                        ? <img className="admin-product-image-preview" src={item.image || item.images[0]} alt={`${item.name} spare part`} />
                        : "—"}
                      </td>
                      <td>{formatPrice(item.price)}</td>
                      <td>{getProductUom(item) || "—"}</td>
                    </>
                  ) : (
                    <>
                      <td>{item.name}</td>
                      <td>{item.category?.name || "—"}</td>
                      <td>{formatPrice(item.price)}</td>
                    </>
                  )}
                  <td><button type="button" className="edit-btn" onClick={() => edit(item)}>Edit</button><button type="button" className="delete-btn" onClick={() => remove(item._id)}>Delete</button></td>
                </tr>
              ))}
              {!filteredProducts.length && <tr><td colSpan={type === "sparepart" ? 6 : 4}>{products.length ? "No items match this category or search." : "No items in this catalogue."}</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
