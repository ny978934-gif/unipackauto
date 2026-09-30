import { useEffect, useMemo, useState } from "react";
import { API, formatPrice } from "../spareApi";
import "./AdminPages.css";

const emptyProduct = {
  categoryId: "",
  subCategoryId: "",
  subSubCategoryId: "",
  name: "",
  slug: "",
  partCode: "",
  price: "",
  imageUrl: "",
  description: "",
  inStock: true,
};

export default function Products({ type = "sparepart" }) {
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [subSubcategories, setSubSubcategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState(emptyProduct);
  const [editingId, setEditingId] = useState("");
  const [specifications, setSpecifications] = useState([{ label: "", value: "" }]);
  const [images, setImages] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const isMachine = type === "machine";
  const collectionLabel = isMachine ? "Products / Machines" : "Spare Parts";

  const load = async (signal = undefined) => {
    const [categoryResponse, subcategoryResponse, subSubcategoryResponse, productResponse] =
      await Promise.all([
        fetch(`${API}/api/spare/categories?type=${type}`, signal ? { signal } : {}),
        fetch(`${API}/api/subcategories?type=${type}`, signal ? { signal } : {}),
        fetch(`${API}/api/sub-subcategories?type=${type}`, signal ? { signal } : {}),
        fetch(`${API}/api/products?type=${type}`, signal ? { signal } : {}),
      ]);
    if (
      !categoryResponse.ok ||
      !subcategoryResponse.ok ||
      !subSubcategoryResponse.ok ||
      !productResponse.ok
    ) {
      throw new Error(`Unable to load ${collectionLabel.toLowerCase()} data.`);
    }
    const [categoryData, subcategoryData, subSubcategoryData, productData] =
      await Promise.all([
        categoryResponse.json(),
        subcategoryResponse.json(),
        subSubcategoryResponse.json(),
        productResponse.json(),
      ]);
    setCategories(Array.isArray(categoryData) ? categoryData : []);
    setSubcategories(Array.isArray(subcategoryData) ? subcategoryData : []);
    setSubSubcategories(Array.isArray(subSubcategoryData) ? subSubcategoryData : []);
    setProducts(Array.isArray(productData) ? productData : []);
  };

  useEffect(() => {
    const controller = new AbortController();
    load(controller.signal).catch((error) => {
      if (error.name !== "AbortError") setMessage(error.message);
    });
    return () => controller.abort();
  }, [type]);

  const visibleSubcategories = useMemo(
    () =>
      subcategories.filter(
        (item) => (item.category?._id || item.category) === form.categoryId
      ),
    [subcategories, form.categoryId]
  );
  const visibleSubSubcategories = useMemo(
    () =>
      subSubcategories.filter(
        (item) => (item.subCategory?._id || item.subCategory) === form.subCategoryId
      ),
    [subSubcategories, form.subCategoryId]
  );
  const filteredProducts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return products;
    return products.filter((product) =>
      [product.name, product.partCode, product.sku]
        .some((value) => String(value || "").toLowerCase().includes(query))
    );
  }, [products, searchQuery]);

  const resetForm = () => {
    setForm({ ...emptyProduct });
    setEditingId("");
    setSpecifications([{ label: "", value: "" }]);
    setImages([]);
    setExistingImages([]);
  };

  const submit = async (event) => {
    event.preventDefault();
    const formElement = event.currentTarget;
    setLoading(true);
    setMessage("");
    try {
      const body = new FormData();
      const { imageUrl, ...productFields } = form;
      Object.entries({ ...productFields, type }).forEach(([key, value]) => body.append(key, value));
      body.append("image", imageUrl);
      body.append(
        "images",
        JSON.stringify([
          ...(imageUrl ? [imageUrl] : []),
          ...existingImages.filter((url) => url && url !== imageUrl),
        ])
      );
      body.append(
        "specifications",
        JSON.stringify(
          specifications.filter((item) => item.label.trim() && item.value.trim())
        )
      );
      images.forEach((file) => body.append("images", file));
      const response = await fetch(
        editingId
          ? `${API}/api/products/${editingId}`
          : `${API}/api/products`,
        { method: editingId ? "PUT" : "POST", body }
      );
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Unable to save product.");
      resetForm();
      formElement.reset();
      setMessage(editingId ? "Product updated successfully." : "Product saved successfully.");
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
      subCategoryId: product.subCategory?._id || product.subCategory || "",
      subSubCategoryId: product.subSubCategory?._id || product.subSubCategory || "",
      name: product.name || "",
      slug: product.slug || "",
      partCode: product.partCode || "",
      price: product.price ?? "",
      imageUrl: product.image || product.images?.[0] || "",
      description: product.description || "",
      inStock: Boolean(product.inStock),
    });
    setExistingImages(product.images || []);
    setSpecifications(
      product.specifications?.length
        ? product.specifications
        : [{ label: "", value: "" }]
    );
    setImages([]);
    setMessage("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const remove = async (id) => {
    if (!window.confirm(`Delete this ${isMachine ? "machine" : "spare part"}?`)) return;
    try {
      const response = await fetch(`${API}/api/products/${id}`, { method: "DELETE" });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || "Unable to delete product.");
      setProducts((items) => items.filter((item) => item._id !== id));
      setMessage("Product deleted.");
    } catch (error) {
      setMessage(error.message);
    }
  };

  return (
    <div className="admin-page">
      <div className="page-title">
        <div>
          <h1>{collectionLabel} management</h1>
          <p>View, add, edit, and remove items in the {collectionLabel.toLowerCase()} catalogue.</p>
        </div>
      </div>
      {message && <p className="admin-notice">{message}</p>}


      <div className="admin-form-card">
        <h2>{editingId ? "Edit item" : `Add ${isMachine ? "machine" : "spare part"}`}</h2>
        <form onSubmit={submit}>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor={`product-category-${type}`}>Main category *</label>
              <select
                id={`product-category-${type}`}
                required
                value={form.categoryId}
                onChange={(event) =>
                  setForm({
                    ...form,
                    categoryId: event.target.value,
                    subCategoryId: "",
                    subSubCategoryId: "",
                  })
                }
              >
                <option value="">Select category</option>
                {categories.map((item) => <option key={item._id} value={item._id}>{item.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label htmlFor={`product-subcategory-${type}`}>Subcategory *</label>
              <select
                id={`product-subcategory-${type}`}
                required
                value={form.subCategoryId}
                disabled={!form.categoryId}
                onChange={(event) =>
                  setForm({ ...form, subCategoryId: event.target.value, subSubCategoryId: "" })
                }
              >
                <option value="">Select subcategory</option>
                {visibleSubcategories.map((item) => <option key={item._id} value={item._id}>{item.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label htmlFor={`product-subsubcategory-${type}`}>Sub-subcategory</label>
              <select
                id={`product-subsubcategory-${type}`}
                value={form.subSubCategoryId}
                disabled={!form.subCategoryId}
                onChange={(event) => setForm({ ...form, subSubCategoryId: event.target.value })}
              >
                <option value="">None</option>
                {visibleSubSubcategories.map((item) => <option key={item._id} value={item._id}>{item.name}</option>)}
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor={`product-name-${type}`}>Name *</label>
              <input id={`product-name-${type}`} required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
            </div>
            <div className="form-group">
              <label htmlFor={`product-slug-${type}`}>Slug</label>
              <input id={`product-slug-${type}`} value={form.slug} onChange={(event) => setForm({ ...form, slug: event.target.value })} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor={`product-code-${type}`}>Item code</label>
              <input id={`product-code-${type}`} value={form.partCode} onChange={(event) => setForm({ ...form, partCode: event.target.value })} />
            </div>
            <div className="form-group">
              <label htmlFor={`product-price-${type}`}>Price (INR)</label>
              <input id={`product-price-${type}`} type="number" min="0" value={form.price} onChange={(event) => setForm({ ...form, price: event.target.value })} />
            </div>
          </div>
          <div className="form-group">
            <label htmlFor={`product-image-url-${type}`}>Image URL</label>
            <input
              id={`product-image-url-${type}`}
              type="url"
              value={form.imageUrl}
              placeholder="https://example.com/product-image.jpg"
              onChange={(event) => setForm({ ...form, imageUrl: event.target.value })}
            />
            {form.imageUrl && (
              <img
                className="admin-product-image-preview"
                src={form.imageUrl}
                alt={`${form.name || "Product"} current image`}
              />
            )}
          </div>
          <div className="form-group">
            <label htmlFor={`product-description-${type}`}>Description</label>
            <textarea id={`product-description-${type}`} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} />
          </div>
          <div className="form-group">
            <label htmlFor={`product-images-${type}`}>Images (up to 10)</label>
            <input id={`product-images-${type}`} type="file" accept="image/*" multiple onChange={(event) => setImages(Array.from(event.target.files || []))} />
            <small>
              {images.length
                ? `${images.length} new image${images.length === 1 ? "" : "s"} selected; these replace the current images.`
                : editingId
                  ? "Choose files only if you want to replace the current images."
                  : "Choose files to upload product images."}
            </small>
          </div>
          <div className="form-group">
            <label>Specifications</label>
            {specifications.map((item, index) => (
              <div className="form-row" key={index}>
                <input aria-label={`Specification ${index + 1} name`} placeholder="Name" value={item.label} onChange={(event) => setSpecifications((all) => all.map((entry, i) => i === index ? { ...entry, label: event.target.value } : entry))} />
                <input aria-label={`Specification ${index + 1} value`} placeholder="Value" value={item.value} onChange={(event) => setSpecifications((all) => all.map((entry, i) => i === index ? { ...entry, value: event.target.value } : entry))} />
              </div>
            ))}
            <button type="button" className="edit-btn" onClick={() => setSpecifications((all) => [...all, { label: "", value: "" }])}>+ Add specification</button>
          </div>
          <label className="checkbox-field">
            <input type="checkbox" checked={form.inStock} onChange={(event) => setForm({ ...form, inStock: event.target.checked })} />
            In stock
          </label>
          <button className="primary-btn" disabled={loading || !categories.length}>
            {loading ? "Saving..." : editingId ? "Update item" : "Save item"}
          </button>
          {editingId && <button type="button" className="edit-btn" onClick={resetForm}>Cancel edit</button>}
        </form>
      </div>

      <div className="admin-table-card">
        <div className="table-header"><h2>{collectionLabel}</h2><span>{filteredProducts.length} of {products.length}</span></div>
        <div className="admin-table-search">
          <label htmlFor={`product-search-${type}`}>Search by item name or item code / SKU</label>
          <input
            id={`product-search-${type}`}
            type="search"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search name or item code..."
          />
        </div>
        <div className="table-wrapper">
          <table>
            <thead><tr><th>Name</th><th>Item code</th><th>Category</th><th>Price</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {filteredProducts.map((item) => (
                <tr key={item._id}>
                  <td>{item.name}</td>
                  <td><code>{item.partCode || "—"}</code></td>
                  <td>{item.category?.name || "—"} / {item.subCategory?.name || "—"}</td>
                  <td>{formatPrice(item.price)}</td>
                  <td>{item.inStock ? "In stock" : "Out of stock"}</td>
                  <td>
                    <button type="button" className="edit-btn" onClick={() => edit(item)}>Edit</button>{" "}
                    <button type="button" className="delete-btn" onClick={() => remove(item._id)}>Delete</button>
                  </td>
                </tr>
              ))}
              {!filteredProducts.length && (
                <tr>
                  <td colSpan="6">
                    {products.length
                      ? "No items match your search."
                      : "No items in this catalogue yet."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
