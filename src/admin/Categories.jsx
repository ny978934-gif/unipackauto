import { useEffect, useMemo, useState } from "react";
import { API, adminFetch } from "../spareApi";
import "./AdminPages.css";

const emptyForm = { name: "", slug: "", description: "" };

export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  const load = async (signal) => {
    const response = await adminFetch(`${API}/api/spare/categories?type=sparepart`, { signal });
    if (!response.ok) throw new Error("Unable to load spare-part categories.");
    const data = await response.json();
    setCategories(Array.isArray(data) ? data : []);
  };

  useEffect(() => {
    const controller = new AbortController();
    load(controller.signal).catch((error) => {
      if (error.name !== "AbortError") setMessage(error.message);
    });
    return () => controller.abort();
  }, []);

  const filteredCategories = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return categories;
    return categories.filter((category) =>
      [category.name, category.slug, category.description]
        .some((value) => String(value || "").toLowerCase().includes(query))
    );
  }, [categories, search]);

  const submit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    try {
      const body = new FormData();
      Object.entries({ ...form, type: "sparepart" }).forEach(([key, value]) => body.append(key, value));
      const response = await adminFetch(
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
    if (!window.confirm("Delete this category and all products assigned to it?")) return;
    try {
      const response = await adminFetch(`${API}/api/spare/categories/${id}`, { method: "DELETE" });
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

  return (
    <div className="admin-page">
      <div className="page-title">
        <div>
          <h1>Spare Parts Categories</h1>
          <p>Manage the machine-name categories used by the spare-parts catalogue.</p>
        </div>
      </div>
      {message && <p className="admin-notice">{message}</p>}
      <div className="admin-form-card">
        <h2>{editingId ? "Edit category" : "Add spare-parts category"}</h2>
        <form onSubmit={submit}>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="category-name">Machine name *</label>
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
        <div className="table-header"><h2>Spare Parts Categories</h2><span>{filteredCategories.length} of {categories.length}</span></div>
        <div className="admin-table-search">
          <label htmlFor="category-search">Search categories by machine name, slug, or description</label>
          <input id="category-search" type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search categories..." />
        </div>
        <div className="table-wrapper">
          <table>
            <thead><tr><th>Machine name</th><th>Slug</th><th>Actions</th></tr></thead>
            <tbody>
              {filteredCategories.map((category) => (
                <tr key={category._id}>
                  <td>{category.name}</td>
                  <td><code>{category.slug}</code></td>
                  <td>
                    <button type="button" className="edit-btn" onClick={() => edit(category)}>Edit</button>
                    <button type="button" className="delete-btn" onClick={() => remove(category._id)}>Delete</button>
                  </td>
                </tr>
              ))}
              {!filteredCategories.length && <tr><td colSpan="3">{categories.length ? "No categories match your search." : "No categories added yet."}</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
