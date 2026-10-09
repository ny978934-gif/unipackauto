import { useEffect, useMemo, useState } from "react";
import { API, adminFetch } from "../spareApi";
import "./AdminPages.css";

const emptyForm = { name: "", slug: "", description: "" };
const emptySubcategoryForm = { categoryId: "", name: "", slug: "", description: "" };

export default function Categories() {
  const [type, setType] = useState("sparepart");
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [subcategoryApiAvailable, setSubcategoryApiAvailable] = useState(true);
  const [form, setForm] = useState(emptyForm);
  const [subcategoryForm, setSubcategoryForm] = useState(emptySubcategoryForm);
  const [editingId, setEditingId] = useState("");
  const [editingSubcategoryId, setEditingSubcategoryId] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [subcategorySearch, setSubcategorySearch] = useState("");

  const load = async (signal) => {
    const response = await adminFetch(`${API}/api/spare/categories?type=${type}`, { signal });
    if (!response.ok) throw new Error("Unable to load categories.");
    const data = await response.json();
    setCategories(Array.isArray(data) ? data : []);
    if (type === "sparepart") {
      try {
        const subcategoryResponse = await adminFetch(`${API}/api/spare/subcategories`, { signal });
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

  const filteredCategories = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return categories;
    return categories.filter((category) =>
      [category.name, category.slug, category.description]
        .some((value) => String(value || "").toLowerCase().includes(query))
    );
  }, [categories, search]);

  const filteredSubcategories = useMemo(() => {
    const query = subcategorySearch.trim().toLowerCase();
    if (!query) return subcategories;
    return subcategories.filter((subcategory) =>
      [subcategory.name, subcategory.slug, subcategory.category?.name, subcategory.description]
        .some((value) => String(value || "").toLowerCase().includes(query))
    );
  }, [subcategories, subcategorySearch]);

  const submit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    try {
      const body = new FormData();
      Object.entries({ ...form, type }).forEach(([key, value]) => body.append(key, value));
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
      setSubcategories((items) => items.filter((item) => item.category?._id !== id));
      if (editingId === id) {
        setForm(emptyForm);
        setEditingId("");
      }
      setMessage("Category deleted.");
    } catch (error) {
      setMessage(error.message);
    }
  };

  const submitSubcategory = async (event) => {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    try {
      const response = await adminFetch(
        editingSubcategoryId
          ? `${API}/api/spare/subcategories/${editingSubcategoryId}`
          : `${API}/api/spare/subcategories`,
        {
          method: editingSubcategoryId ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(subcategoryForm),
        }
      );
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Unable to save subcategory.");
      setSubcategoryForm(emptySubcategoryForm);
      setEditingSubcategoryId("");
      setMessage(editingSubcategoryId ? "Subcategory updated." : "Subcategory created.");
      await load();
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  const editSubcategory = (subcategory) => {
    setSubcategoryForm({
      categoryId: subcategory.category?._id || "",
      name: subcategory.name || "",
      slug: subcategory.slug || "",
      description: subcategory.description || "",
    });
    setEditingSubcategoryId(subcategory._id);
    setMessage("");
  };

  const removeSubcategory = async (id) => {
    if (!window.confirm("Delete this subcategory? Spare parts assigned to it will remain in their main category.")) return;
    try {
      const response = await adminFetch(`${API}/api/spare/subcategories/${id}`, { method: "DELETE" });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || "Unable to delete subcategory.");
      setSubcategories((items) => items.filter((item) => item._id !== id));
      if (editingSubcategoryId === id) {
        setSubcategoryForm(emptySubcategoryForm);
        setEditingSubcategoryId("");
      }
      setMessage("Subcategory deleted.");
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
          <p>Manage the machine-name categories used by each catalogue.</p>
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
      {type === "sparepart" && !subcategoryApiAvailable && (
        <p className="admin-notice" role="status">
          Categories loaded, but the configured backend does not have the subcategory API yet. Deploy the latest server code to enable subcategory management.
        </p>
      )}
      <div className="admin-form-card">
        <h2>{editingId ? `Edit ${catalogLabel} category` : `Add ${catalogLabel} category`}</h2>
        <form onSubmit={submit}>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="category-name">{type === "sparepart" ? "Machine name" : "Category name"} *</label>
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
        <div className="table-header"><h2>{catalogLabel} categories</h2><span>{filteredCategories.length} of {categories.length}</span></div>
        <div className="admin-table-search">
          <label htmlFor="category-search">Search categories by machine name, slug, or description</label>
          <input id="category-search" type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search categories..." />
        </div>
        {type === "sparepart" && subcategoryApiAvailable && (
          <>
            <div className="admin-form-card subcategory-admin-card">
              <h2>{editingSubcategoryId ? "Edit subcategory" : "Add subcategory"}</h2>
              <form onSubmit={submitSubcategory}>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="subcategory-parent">Main spare-part category *</label>
                    <select
                      id="subcategory-parent"
                      required
                      value={subcategoryForm.categoryId}
                      onChange={(event) => setSubcategoryForm({ ...subcategoryForm, categoryId: event.target.value })}
                    >
                      <option value="">Select machine category</option>
                      {categories.map((category) => <option key={category._id} value={category._id}>{category.name}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label htmlFor="subcategory-name">Subcategory name *</label>
                    <input id="subcategory-name" required value={subcategoryForm.name} onChange={(event) => setSubcategoryForm({ ...subcategoryForm, name: event.target.value })} />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="subcategory-slug">Slug</label>
                    <input id="subcategory-slug" value={subcategoryForm.slug} placeholder="Auto-generated if empty" onChange={(event) => setSubcategoryForm({ ...subcategoryForm, slug: event.target.value })} />
                  </div>
                  <div className="form-group">
                    <label htmlFor="subcategory-description">Description</label>
                    <input id="subcategory-description" value={subcategoryForm.description} onChange={(event) => setSubcategoryForm({ ...subcategoryForm, description: event.target.value })} />
                  </div>
                </div>
                <button className="primary-btn" disabled={loading || !categories.length}>{loading ? "Saving..." : editingSubcategoryId ? "Update subcategory" : "Save subcategory"}</button>
                {editingSubcategoryId && <button type="button" className="edit-btn" onClick={() => { setEditingSubcategoryId(""); setSubcategoryForm(emptySubcategoryForm); }}>Cancel</button>}
              </form>
            </div>
            <div className="admin-table-card">
              <div className="table-header"><h2>Spare-parts subcategories</h2><span>{filteredSubcategories.length} of {subcategories.length}</span></div>
              <div className="admin-table-search">
                <label htmlFor="subcategory-search">Search subcategories by name, category, or slug</label>
                <input id="subcategory-search" type="search" value={subcategorySearch} onChange={(event) => setSubcategorySearch(event.target.value)} placeholder="Search subcategories..." />
              </div>
              <div className="table-wrapper">
                <table>
                  <thead><tr><th>Subcategory</th><th>Main category</th><th>Slug</th><th>Actions</th></tr></thead>
                  <tbody>
                    {filteredSubcategories.map((subcategory) => (
                      <tr key={subcategory._id}>
                        <td>{subcategory.name}</td>
                        <td>{subcategory.category?.name || "—"}</td>
                        <td><code>{subcategory.slug}</code></td>
                        <td>
                          <button type="button" className="edit-btn" onClick={() => editSubcategory(subcategory)}>Edit</button>
                          <button type="button" className="delete-btn" onClick={() => removeSubcategory(subcategory._id)}>Delete</button>
                        </td>
                      </tr>
                    ))}
                    {!filteredSubcategories.length && <tr><td colSpan="4">{subcategories.length ? "No subcategories match your search." : "No subcategories added yet."}</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
        <div className="table-wrapper">
          <table>
            <thead><tr><th>{type === "sparepart" ? "Machine name" : "Category name"}</th><th>Slug</th><th>Actions</th></tr></thead>
            <tbody>
              {filteredCategories.map((category) => (
                <tr key={category._id}>
                  <td>{category.name}</td>
                  <td><code>{category.slug}</code></td>
                  <td>
                    <button type="button" className="edit-btn" onClick={() => edit(category)}>Edit</button>{" "}
                    <button type="button" className="delete-btn" onClick={() => remove(category._id)}>Delete</button>
                  </td>
                </tr>
              ))}
              {!filteredCategories.length && <tr><td colSpan="3">{categories.length ? "No categories match your search." : "No categories in this catalogue."}</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
