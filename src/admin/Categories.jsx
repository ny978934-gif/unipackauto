import { useEffect, useState } from "react";
import { API } from "../spareApi";
import "./AdminPages.css";

const emptyForm = { name: "", slug: "", description: "" };

export default function Categories() {
  const [type, setType] = useState("sparepart");
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const load = async (signal) => {
    const response = await fetch(`${API}/api/spare/categories?type=${type}`, { signal });
    if (!response.ok) throw new Error("Unable to load categories.");
    const data = await response.json();
    setCategories(Array.isArray(data) ? data : []);
  };

  useEffect(() => {
    const controller = new AbortController();
    load(controller.signal).catch((error) => {
      if (error.name !== "AbortError") setMessage(error.message);
    });
    return () => controller.abort();
  }, [type]);

  const submit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    try {
      const body = new FormData();
      Object.entries({ ...form, type }).forEach(([key, value]) => body.append(key, value));
      const response = await fetch(
        editingId
          ? `${API}/api/spare/categories/${editingId}`
          : `${API}/api/spare/categories`,
        { method: editingId ? "PUT" : "POST", body }
      );
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Unable to save category.");
      setForm(emptyForm);
      setEditingId("");
      setMessage(editingId ? "Category updated." : "Category created.");
      await load();
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  const edit = (category) => {
    setForm({
      name: category.name || "",
      slug: category.slug || "",
      description: category.description || "",
    });
    setEditingId(category._id);
    setMessage("");
  };

  const remove = async (id) => {
    if (!window.confirm("Delete this category and its subcategories and products?")) return;
    try {
      const response = await fetch(`${API}/api/spare/categories/${id}`, { method: "DELETE" });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || "Unable to delete category.");
      setCategories((items) => items.filter((item) => item._id !== id));
      if (editingId === id) {
        setForm(emptyForm);
        setEditingId("");
      }
      setMessage("Category deleted.");
    } catch (error) {
      setMessage(error.message);
    }
  };

  const catalogLabel = type === "machine" ? "Products / Machines" : "Spare Parts";

  return (
    <div className="admin-page">
      <div className="page-title">
        <div>
          <h1>Category management</h1>
          <p>Keep machine and spare-part categories in separate catalogues.</p>
        </div>
      </div>
      <div className="admin-form-card">
        <div className="form-group">
          <label htmlFor="category-catalog-type">Catalogue</label>
          <select
            id="category-catalog-type"
            value={type}
            disabled={loading}
            onChange={(event) => {
              setType(event.target.value);
              setForm(emptyForm);
              setEditingId("");
              setMessage("");
            }}
          >
            <option value="sparepart">Spare Parts</option>
            <option value="machine">Products / Machines</option>
          </select>
        </div>
      </div>
      {message && <p className="admin-notice">{message}</p>}
      <div className="admin-form-card">
        <h2>{editingId ? `Edit ${catalogLabel} category` : `Add ${catalogLabel} category`}</h2>
        <form onSubmit={submit}>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="category-name">Name *</label>
              <input id="category-name" required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
            </div>
            <div className="form-group">
              <label htmlFor="category-slug">Slug</label>
              <input id="category-slug" value={form.slug} onChange={(event) => setForm({ ...form, slug: event.target.value })} placeholder="Auto-generated if empty" />
            </div>
          </div>
          <div className="form-group">
            <label htmlFor="category-description">Description</label>
            <textarea id="category-description" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} />
          </div>
          <button className="primary-btn" disabled={loading}>{loading ? "Saving..." : editingId ? "Update category" : "Save category"}</button>
          {editingId && <button type="button" className="edit-btn" onClick={() => { setEditingId(""); setForm(emptyForm); }}>Cancel</button>}
        </form>
      </div>
      <div className="admin-table-card">
        <div className="table-header"><h2>{catalogLabel} categories</h2><span>{categories.length}</span></div>
        <div className="table-wrapper">
          <table>
            <thead><tr><th>Name</th><th>Slug</th><th>Actions</th></tr></thead>
            <tbody>
              {categories.map((category) => (
                <tr key={category._id}>
                  <td>{category.name}</td>
                  <td><code>{category.slug}</code></td>
                  <td>
                    <button type="button" className="edit-btn" onClick={() => edit(category)}>Edit</button>{" "}
                    <button type="button" className="delete-btn" onClick={() => remove(category._id)}>Delete</button>
                  </td>
                </tr>
              ))}
              {!categories.length && <tr><td colSpan="3">No categories in this catalogue.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
