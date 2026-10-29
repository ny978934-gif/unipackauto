import { useEffect, useMemo, useRef, useState } from "react";
import { API, adminFetch, formatPrice, getProductUom } from "../spareApi";
import "./AdminPages.css";
import "./Products2.css";

const emptyProduct = { categoryId: "", name: "", price: "", uom: "" };

export default function Products() {
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState(emptyProduct);
  const [editingId, setEditingId] = useState("");
  const [imageUrls, setImageUrls] = useState([]);
  const [images, setImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const formCardRef = useRef(null);
  const nameInputRef = useRef(null);

  useEffect(() => {
    const previews = images.map((file) => URL.createObjectURL(file));
    setImagePreviews(previews);
    return () => previews.forEach((url) => URL.revokeObjectURL(url));
  }, [images]);

  const load = async (signal) => {
    const options = signal ? { signal } : {};
    const [categoryResponse, productResponse] = await Promise.all([
      adminFetch(`${API}/api/spare/categories?type=sparepart`, options),
      adminFetch(`${API}/api/products?type=sparepart`, options),
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
  }, []);

  const filteredProducts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return products.filter((product) => {
      if (selectedCategoryId && (product.category?._id || product.category) !== selectedCategoryId) return false;
      return !query || [product.name, product.category?.name, getProductUom(product)]
        .some((value) => String(value || "").toLowerCase().includes(query));
    });
  }, [products, searchQuery, selectedCategoryId]);

  const resetForm = () => {
    setForm({ ...emptyProduct });
    setEditingId("");
    setImageUrls([]);
    setImages([]);
  };

  const submit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    try {
      const urlList = imageUrls.map((url) => url.trim()).filter(Boolean);
      if (urlList.length + images.length > 5) {
        throw new Error("A spare part may have at most 5 images in total.");
      }
      const body = new FormData();
      Object.entries({ ...form, type: "sparepart" }).forEach(([key, value]) => body.append(key, String(value)));
      body.append("imageUrls", JSON.stringify(urlList));
      images.forEach((file) => body.append("images", file));

      const response = await adminFetch(
        editingId ? `${API}/api/products/${editingId}` : `${API}/api/products`,
        { method: editingId ? "PUT" : "POST", body }
      );
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Unable to save spare part.");
      if (form.uom.trim() && getProductUom(data) !== form.uom.trim()) {
        throw new Error("The server response is missing the UOM value. This product may have been saved without it. Update and redeploy the backend, then edit the existing product to add its UOM.");
      }
      setMessage(editingId ? "Spare part updated successfully." : "Spare part saved successfully.");
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
      name: product.name || "",
      price: product.price ?? "",
      uom: getProductUom(product),
    });
    setImageUrls([...new Set([product.image, ...(product.images || [])].filter(Boolean))]);
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
    if (!window.confirm("Delete this spare part?")) return;
    try {
      const response = await adminFetch(`${API}/api/products/${id}`, { method: "DELETE" });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || "Unable to delete spare part.");
      setProducts((items) => items.filter((item) => item._id !== id));
      if (editingId === id) resetForm();
      setMessage(data.message || "Spare part deleted.");
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
        const data = await response.json();
        throw new Error(data.message || "Unable to export spare parts.");
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
  const updateImageUrl = (index, value) =>
    setImageUrls((current) => current.map((url, imageIndex) => imageIndex === index ? value : url));
  const removeImageUrl = (index) =>
    setImageUrls((current) => current.filter((_, imageIndex) => imageIndex !== index));
  const moveImageUrl = (index, direction) => {
    const targetIndex = index + direction;
    setImageUrls((current) => {
      if (targetIndex < 0 || targetIndex >= current.length) return current;
      const next = [...current];
      [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
      return next;
    });
  };
  const imageCount = imageUrls.filter((url) => url.trim()).length + images.length;
  const imageSlots = imageUrls.length + images.length;

  return (
    <div className="admin-page">
      <div className="page-title"><div><h1>Spare Parts management</h1><p>Add, search, edit, and remove spare parts.</p></div></div>
      {message && <p className="admin-notice" role="status">{message}</p>}

      <div className="admin-form-card" ref={formCardRef}>
        <h2>{editingId ? "Edit spare part" : "Add spare part"}</h2>
        <form onSubmit={submit}>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="product-category">Machine name *</label>
              <select id="product-category" required value={form.categoryId} onChange={(event) => updateField("categoryId", event.target.value)}>
                <option value="">Select machine</option>
                {categories.map((category) => <option key={category._id} value={category._id}>{category.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="product-name">Spare part name *</label>
              <input ref={nameInputRef} id="product-name" required value={form.name} onChange={(event) => updateField("name", event.target.value)} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="product-price">Price (INR)</label>
              <input id="product-price" type="number" min="0" step="0.01" value={form.price} onChange={(event) => updateField("price", event.target.value)} />
            </div>
            <div className="form-group">
              <label htmlFor="product-uom">UOM (Unit of Measurement)</label>
              <input id="product-uom" value={form.uom} placeholder="e.g. piece, set, meter" onChange={(event) => updateField("uom", event.target.value)} />
            </div>
          </div>
          <div className="form-group spare-image-manager">
            <div className="spare-image-manager-heading">
              <span>Spare part images</span>
              <small>{imageCount} of 5 images</small>
            </div>
            {imageUrls.map((url, index) => (
              <div className="spare-image-editor" key={`url-${index}`}>
                <div className="spare-image-preview">
                  {url.trim()
                    ? <img src={url} alt={`${form.name || "Spare part"} image ${index + 1}`} />
                    : <span>Image URL</span>}
                </div>
                <label className="spare-image-url">
                  <span className="sr-only">Image {index + 1} URL</span>
                  <input
                    type="url"
                    value={url}
                    onChange={(event) => updateImageUrl(index, event.target.value)}
                    placeholder="https://example.com/part-image.jpg"
                  />
                </label>
                <div className="spare-image-actions">
                  <button type="button" className="edit-btn" disabled={index === 0} onClick={() => moveImageUrl(index, -1)} aria-label={`Move image ${index + 1} earlier`}>↑</button>
                  <button type="button" className="edit-btn" disabled={index === imageUrls.length - 1} onClick={() => moveImageUrl(index, 1)} aria-label={`Move image ${index + 1} later`}>↓</button>
                  <button type="button" className="delete-btn" onClick={() => removeImageUrl(index)} aria-label={`Delete image ${index + 1}`}>Delete</button>
                </div>
              </div>
            ))}
            {images.map((file, index) => (
              <div className="spare-image-editor" key={`${file.name}-${file.lastModified}-${index}`}>
                <div className="spare-image-preview">
                  {imagePreviews[index] && <img src={imagePreviews[index]} alt={`${form.name || "Spare part"} upload preview ${index + 1}`} />}
                </div>
                <div className="spare-image-file-details">
                  <strong>{file.name}</strong>
                  <small>{Math.max(1, Math.round(file.size / 1024))} KB · Upload preview</small>
                </div>
                <div className="spare-image-actions">
                  <button
                    type="button"
                    className="delete-btn"
                    onClick={() => setImages((current) => current.filter((_, fileIndex) => fileIndex !== index))}
                    aria-label={`Remove uploaded image ${index + 1}`}
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
            {imageSlots < 5 && (
              <button
                type="button"
                className="edit-btn spare-add-image-url"
                onClick={() => setImageUrls((current) => [...current, ""])}
              >
                Add image URL
              </button>
            )}
          </div>
          <div className="form-group">
            <label htmlFor="product-images">Upload spare part images</label>
            <input
              id="product-images"
              type="file"
              accept="image/*"
              multiple
              disabled={imageSlots >= 5}
              onChange={(event) => {
                const selectedImages = Array.from(event.target.files || []);
                const remaining = Math.max(0, 5 - imageSlots);
                setImages((current) => [...current, ...selectedImages].slice(0, Math.max(0, 5 - imageUrls.length)));
                if (selectedImages.length > remaining) {
                  setMessage("A spare part may have at most 5 images in total.");
                } else {
                  setMessage("");
                }
                event.target.value = "";
              }}
            />
            <small>
              Choose up to {Math.max(0, 5 - imageSlots)} more image file(s). JPEG, PNG, WebP, and other image formats are accepted (5 MB max per file).
            </small>
          </div>
          <button className="primary-btn" disabled={loading || !categories.length}>{loading ? "Saving..." : editingId ? "Update spare part" : "Save spare part"}</button>
          {editingId && <button type="button" className="edit-btn" onClick={resetForm}>Cancel edit</button>}
        </form>
      </div>

      <div className="admin-table-card">
        <div className="table-header admin-products-table-header">
          <h2>Spare Parts</h2>
          <div className="admin-products-actions">
            <span>{filteredProducts.length} of {products.length}</span>
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
          </div>
        </div>
        <div className="admin-table-search">
          <label htmlFor="product-category-filter">Show category</label>
          <select
            id="product-category-filter"
            value={selectedCategoryId}
            onChange={(event) => setSelectedCategoryId(event.target.value)}
          >
            <option value="">All categories</option>
            {categories.map((category) => <option key={category._id} value={category._id}>{category.name}</option>)}
          </select>
        </div>
        <div className="admin-table-search">
          <label htmlFor="product-search">Search by spare part, machine, or UOM</label>
          <input id="product-search" type="search" value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Search catalogue..." />
        </div>
        <div className="table-wrapper">
          <table>
            <thead><tr><th>Machine Name</th><th>Spare Part Name</th><th>Spare Image</th><th>Price</th><th>UOM</th><th>Actions</th></tr></thead>
            <tbody>
              {filteredProducts.map((item) => (
                <tr key={item._id}>
                  <td>{item.category?.name || "—"}</td>
                  <td>{item.name}</td>
                  <td>
                    {(item.images?.length ? item.images : item.image ? [item.image] : []).length
                      ? (
                        <div className="admin-spare-image-list" aria-label={`${item.name} images`}>
                          {(item.images?.length ? item.images : [item.image]).map((imageUrl, index) => (
                            <img key={`${imageUrl}-${index}`} src={imageUrl} alt={`${item.name} image ${index + 1}`} />
                          ))}
                        </div>
                      )
                      : "—"}
                  </td>
                  <td>{formatPrice(item.price)}</td>
                  <td>{getProductUom(item) || "—"}</td>
                  <td><button type="button" className="edit-btn" onClick={() => edit(item)}>Edit</button><button type="button" className="delete-btn" onClick={() => remove(item._id)}>Delete</button></td>
                </tr>
              ))}
              {!filteredProducts.length && <tr><td colSpan="6">{products.length ? "No items match this category or search." : "No spare parts in this catalogue."}</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
