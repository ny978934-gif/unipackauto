import { useEffect, useState } from "react";
import { API } from "../spareApi";
import "./AdminPages.css";

const initial = { name: "", slug: "", description: "" };

export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(initial);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const load = () => fetch(`${API}/api/spare/categories`).then((r) => r.json()).then(setCategories);
  useEffect(() => { load().catch(() => setMessage("Unable to load categories.")); }, []);

  const submit = async (event) => {
    event.preventDefault(); setLoading(true); setMessage("");
    try {
      const body = new FormData();
      Object.entries(form).forEach(([key, value]) => body.append(key, value));
      const response = await fetch(`${API}/api/spare/categories`, { method: "POST", body });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Unable to save category");
      setForm(initial); event.target.reset(); setMessage("Category saved successfully."); await load();
    } catch (error) { setMessage(error.message); } finally { setLoading(false); }
  };

  const remove = async (id) => {
    if (!window.confirm("Delete this category and its subcategories?")) return;
    const response = await fetch(`${API}/api/spare/categories/${id}`, { method: "DELETE" });
    if (!response.ok) setMessage("Unable to delete category."); else setCategories((items) => items.filter((item) => item._id !== id));
  };

  return <div className="admin-page"><div className="page-title"><div><h1>Categories</h1><p>Create the first level of the spare-parts hierarchy.</p></div></div>
    {message && <p className="admin-notice">{message}</p>}
    <div className="admin-form-card"><h2>Add category</h2><form onSubmit={submit}><div className="form-row">
      <div className="form-group"><label>Name *</label><input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
      <div className="form-group"><label>Slug</label><input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="auto-generated if empty" /></div>
    </div><div className="form-group"><label>Description</label><textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
      <button className="primary-btn" disabled={loading}>{loading ? "Saving..." : "Save category"}</button>
    </form></div>
    <div className="admin-table-card"><div className="table-header"><h2>Categories</h2><span>{categories.length}</span></div><div className="table-wrapper"><table><thead><tr><th>Name</th><th>Slug</th><th>Action</th></tr></thead><tbody>{categories.map((item) => <tr key={item._id}><td>{item.name}</td><td><code>{item.slug}</code></td><td><button className="delete-btn" onClick={() => remove(item._id)}>Delete</button></td></tr>)}</tbody></table></div></div>
  </div>;
}
