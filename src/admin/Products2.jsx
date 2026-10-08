import { useEffect, useMemo, useState } from "react";
import { API, formatPrice, getProductUom } from "../spareApi";
import "./AdminPages.css";

const emptyProduct = {
  categoryId: "",
  subcategoryId: "",
  name: "",
  slug: "",
  price: "",
  uom: "",
  imageUrl: "",
  description: "",
  inStock: true,
};

export default function Products({ type = "sparepart" }) {
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [subcategoryApiAvailable, setSubcategoryApiAvailable] = useState(true);
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState(emptyProduct);
  const [editingId, setEditingId] = useState("");
  const [images, setImages] = useState([]);
  const [specifications, setSpecifications] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const itemLabel = type === "machine" ? "machine" : "spare part";
  const collectionLabel = type === "machine" ? "Products / Machines" : "Spare Parts";

  const load = async (signal) => {
    const options = signal ? { signal } : {};
    const [categoryResponse, productResponse] = await Promise.all([
      fetch(`${API}/api/spare/categories?type=${type}`, options),
      fetch(`${API}/api/products?type=${type}`, options),
    ]);
    if (!categoryResponse.ok) throw new Error("Unable to load spare-part categories.");
    if (!productResponse.ok) throw new Error("Unable to load spare parts.");
    const [categoryData, productData] = await Promise.all([categoryResponse.json(), productResponse.json()]);
    setCategories(Array.isArray(categoryData) ? categoryData : []);
    setProducts(Array.isArray(productData) ? productData : []);

    if (type === "sparepart") {
      try {
        const subcategoryResponse = await fetch(`${API}/api/spare/subcategories`, options);
        if (!subcategoryResponse.ok) {
          setSubcategories([]);
          setSubcategoryApiAvailable(false);
          return;
        }
        const subcategoryData = await subcategoryResponse.json();
        setSubcategories(Array.isArray(subcategoryData) ? subcategoryData : []);
        setSubcategoryApiAvailable(true);
      } catch (error) {
        if (error.name === "AbortError") throw error;
        setSubcategories([]);
        setSubcategoryApiAvailable(false);
      }
    } else {
      setSubcategories([]);
      setSubcategoryApiAvailable(true);
    }
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
    if (!query) return products;
    return products.filter((product) =>
      [product.name, product.category?.name, product.subcategory?.name, getProductUom(product)]
        .some((value) => String(value || "").toLowerCase().includes(query))
    );
  }, [products, searchQuery]);

  const resetForm = () => {
    setForm({ ...emptyProduct });
    setEditingId("");
    setImages([]);
    setSpecifications([]);
  };

  const submit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    try {
      const body = new FormData();
      Object.entries({ ...form, type }).forEach(([key, value]) => body.append(key, String(value)));
      body.append("image", form.imageUrl);
      body.append("images", JSON.stringify(form.imageUrl ? [form.imageUrl] : []));
      body.append("specifications", JSON.stringify(specifications.filter((item) => item.label.trim() && item.value.trim())));
      images.forEach((file) => body.append("images", file));
      const response = await fetch(
        editingId ? `${API}/api/products/${editingId}` : `${API}/api/products`,
        { method: editingId ? "PUT" : "POST", body }
      );
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || `Unable to save ${itemLabel}.`);
      if (type === "sparepart" && form.uom.trim() && getProductUom(data) !== form.uom.trim()) {
        throw new Error("The server response is missing the UOM value. This product may have been saved without it. Update and redeploy the backend, then edit the existing product to add its UOM.");
      }
      setMessage(editingId ? `${itemLabel} updated successfully.` : `${itemLabel} saved successfully.`);
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
      price: product.price ?? "",
      uom: getProductUom(product),
      imageUrl: product.image || product.images?.[0] || "",
      description: product.description || "",
      inStock: Boolean(product.inStock),
    });
    setSpecifications(product.specifications || []);
    setImages([]);
    setMessage("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const remove = async (id) => {
    if (!window.confirm(`Delete this ${itemLabel}?`)) return;
    try {
      const response = await fetch(`${API}/api/products/${id}`, { method: "DELETE" });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || `Unable to delete ${itemLabel}.`);
      setProducts((items) => items.filter((item) => item._id !== id));
      if (editingId === id) resetForm();
      setMessage(`${itemLabel} deleted.`);
    } catch (error) {
      setMessage(error.message);
    }
  };

  const updateField = (field, value) => setForm((current) => ({ ...current, [field]: value }));

  return (
    <div className="admin-page">
      <div className="page-title"><div><h1>{collectionLabel} management</h1><p>Add, search, edit, and remove catalogue items.</p></div></div>
      {message && <p className="admin-notice" role="status">{message}</p>}
      {type === "sparepart" && !subcategoryApiAvailable && (
        <p className="admin-notice" role="status">
          Spare parts loaded, but the configured backend does not have the subcategory API yet. Deploy the latest server code to enable subcategory management.
        </p>
      )}

      <div className="admin-form-card">
        <h2>{editingId ? `Edit ${itemLabel}` : `Add ${itemLabel}`}</h2>
        <form onSubmit={submit}>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor={`product-category-${type}`}>Main category (machine name) *</label>
              <select id={`product-category-${type}`} required value={form.categoryId} onChange={(event) => setForm((current) => ({ ...current, categoryId: event.target.value, subcategoryId: "" }))}>
                <option value="">Select category</option>
                {categories.map((category) => <option key={category._id} value={category._id}>{category.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label htmlFor={`product-name-${type}`}>{type === "machine" ? "Product name" : "Spare part name"} *</label>
              <input id={`product-name-${type}`} required value={form.name} onChange={(event) => updateField("name", event.target.value)} />
            </div>
          </div>
          {type === "sparepart" && subcategoryApiAvailable && (
            <div className="form-group">
              <label htmlFor="product-subcategory">Subcategory</label>
              <select id="product-subcategory" value={form.subcategoryId} disabled={!form.categoryId} onChange={(event) => updateField("subcategoryId", event.target.value)}>
                <option value="">No subcategory</option>
                {subcategories
                  .filter((subcategory) => (subcategory.category?._id || subcategory.category) === form.categoryId)
                  .map((subcategory) => <option key={subcategory._id} value={subcategory._id}>{subcategory.name}</option>)}
              </select>
            </div>
          )}
          <div className="form-row">
            <div className="form-group">
              <label htmlFor={`product-price-${type}`}>Price (INR)</label>
              <input id={`product-price-${type}`} type="number" min="0" step="0.01" value={form.price} onChange={(event) => updateField("price", event.target.value)} />
            </div>
            {type === "sparepart" && (
              <div className="form-group">
                <label htmlFor="product-uom">UOM (Unit of Measure)</label>
                <input id="product-uom" value={form.uom} placeholder="e.g. piece, set, meter" onChange={(event) => updateField("uom", event.target.value)} />
              </div>
            )}
          </div>
          <div className="form-group">
            <label htmlFor={`product-slug-${type}`}>Slug</label>
            <input id={`product-slug-${type}`} value={form.slug} placeholder="Generated from name if empty" onChange={(event) => updateField("slug", event.target.value)} />
          </div>
          <div className="form-group">
            <label htmlFor={`product-image-url-${type}`}>Image URL</label>
            <input id={`product-image-url-${type}`} type="url" value={form.imageUrl} placeholder="https://example.com/product-image.jpg" onChange={(event) => updateField("imageUrl", event.target.value)} />
            {form.imageUrl && <img className="admin-product-image-preview" src={form.imageUrl} alt={`${form.name || "Product"} preview`} />}
          </div>
          <div className="form-group">
            <label htmlFor={`product-images-${type}`}>Upload images (up to 10)</label>
            <input id={`product-images-${type}`} type="file" accept="image/*" multiple onChange={(event) => setImages(Array.from(event.target.files || []))} />
            <small>{images.length ? `${images.length} new image(s) selected; they replace existing images.` : "Choose files to upload or enter an image URL above."}</small>
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
          <button className="primary-btn" disabled={loading || !categories.length}>{loading ? "Saving..." : editingId ? `Update ${itemLabel}` : `Save ${itemLabel}`}</button>
          {editingId && <button type="button" className="edit-btn" onClick={resetForm}>Cancel edit</button>}
        </form>
      </div>

      <div className="admin-table-card">
        <div className="table-header"><h2>{collectionLabel}</h2><span>{filteredProducts.length} of {products.length}</span></div>
        <div className="admin-table-search">
          <label htmlFor={`product-search-${type}`}>Search by name, category, subcategory, or UOM</label>
          <input id={`product-search-${type}`} type="search" value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Search catalogue..." />
        </div>
        <div className="table-wrapper">
          <table>
            <thead><tr><th>Name</th><th>Machine name</th>{type === "sparepart" && <><th>Subcategory</th><th>UOM</th></>}<th>Price</th><th>Actions</th></tr></thead>
            <tbody>
              {filteredProducts.map((item) => (
                <tr key={item._id}>
                  <td>{item.name}</td><td>{item.category?.name || "—"}</td>
                  {type === "sparepart" && <td>{item.subcategory?.name || "—"}</td>}
                  {type === "sparepart" && <td>{getProductUom(item) || "—"}</td>}
                  <td>{formatPrice(item.price)}</td>
                  <td><button type="button" className="edit-btn" onClick={() => edit(item)}>Edit</button><button type="button" className="delete-btn" onClick={() => remove(item._id)}>Delete</button></td>
                </tr>
              ))}
              {!filteredProducts.length && <tr><td colSpan={type === "sparepart" ? 6 : 4}>{products.length ? "No items match your search." : "No items in this catalogue."}</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
