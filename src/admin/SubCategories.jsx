import { useEffect, useMemo, useState } from "react";
import { API } from "../spareApi";
import "./AdminPages.css";

const emptySubcategory = { categoryId: "", name: "", slug: "", description: "", imageName: "" };
const emptySubSubcategory = { categoryId: "", subCategoryId: "", name: "", slug: "", imageName: "" };

export default function SubCategories() {
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [subSubcategories, setSubSubcategories] = useState([]);
  const [subForm, setSubForm] = useState(emptySubcategory);
  const [subSubForm, setSubSubForm] = useState(emptySubSubcategory);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [subImage, setSubImage] = useState(null);
  const [subSubImage, setSubSubImage] = useState(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const load = async () => {
    const [categoryResponse, subcategoryResponse, subSubcategoryResponse] = await Promise.all([
      fetch(`${API}/api/spare/categories`),
      fetch(`${API}/api/subcategories`),
      fetch(`${API}/api/sub-subcategories`),
    ]);
    if (!categoryResponse.ok || !subcategoryResponse.ok || !subSubcategoryResponse.ok) {
      throw new Error("Unable to load category data.");
    }
    setCategories(await categoryResponse.json());
    setSubcategories(await subcategoryResponse.json());
    setSubSubcategories(await subSubcategoryResponse.json());
  };

  useEffect(() => {
    load().catch((error) => setMessage(error.message));
  }, []);

  const visibleSubcategories = useMemo(
    () => subcategories.filter((item) => (item.category?._id || item.category) === subSubForm.categoryId),
    [subcategories, subSubForm.categoryId]
  );

  const createCategory = async (event) => {
    event.preventDefault();
    if (!newCategoryName.trim()) return;
    const existing = categories.find((item) => item.name.trim().toLowerCase() === newCategoryName.trim().toLowerCase());
    if (existing) {
      setSubForm((form) => ({ ...form, categoryId: existing._id }));
      setSubSubForm((form) => ({ ...form, categoryId: existing._id, subCategoryId: "" }));
      setNewCategoryName("");
      setMessage("That main category already exists and has been selected.");
      return;
    }
    setLoading(true);
    try {
      const body = new FormData();
      body.append("name", newCategoryName.trim());
      const response = await fetch(`${API}/api/spare/categories`, { method: "POST", body });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Unable to create main category.");
      setNewCategoryName("");
      setSubForm((form) => ({ ...form, categoryId: data._id }));
      setSubSubForm((form) => ({ ...form, categoryId: data._id, subCategoryId: "" }));
      setMessage("Main category created successfully.");
      await load();
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  const submitSubcategory = async (event) => {
    event.preventDefault();
    setLoading(true);
    try {
      const body = new FormData();
      Object.entries(subForm).forEach(([key, value]) => body.append(key, value));
      if (subImage) body.append("image", subImage);
      const response = await fetch(`${API}/api/subcategories`, { method: "POST", body });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Unable to save subcategory.");
      setSubForm(emptySubcategory);
      setSubImage(null);
      event.target.reset();
      setMessage("Subcategory saved successfully.");
      await load();
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  const submitSubSubcategory = async (event) => {
    event.preventDefault();
    setLoading(true);
    try {
      const body = new FormData();
      Object.entries(subSubForm).forEach(([key, value]) => body.append(key, value));
      if (subSubImage) body.append("image", subSubImage);
      const response = await fetch(`${API}/api/sub-subcategories`, { method: "POST", body });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Unable to save sub-subcategory.");
      setSubSubForm(emptySubSubcategory);
      setSubSubImage(null);
      event.target.reset();
      setMessage("Sub-subcategory saved successfully.");
      await load();
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  const removeSubcategory = async (id) => {
    if (!window.confirm("Delete this subcategory, sub-subcategories, and products?")) return;
    const response = await fetch(`${API}/api/subcategories/${id}`, { method: "DELETE" });
    if (response.ok) setSubcategories((items) => items.filter((item) => item._id !== id));
    else setMessage("Unable to delete subcategory.");
  };

  const removeSubSubcategory = async (id) => {
    if (!window.confirm("Delete this sub-subcategory?")) return;
    const response = await fetch(`${API}/api/sub-subcategories/${id}`, { method: "DELETE" });
    if (response.ok) setSubSubcategories((items) => items.filter((item) => item._id !== id));
    else setMessage("Unable to delete sub-subcategory.");
  };

  return (
    <div className="admin-page">
      <div className="page-title"><div><h1>Category hierarchy</h1><p>Manage main categories, subcategories, and sub-subcategories.</p></div></div>
      {message && <p className="admin-notice">{message}</p>}

      <div className="admin-form-card">
        <h2>Create main category</h2>
        <form onSubmit={createCategory}>
          <div className="form-row">
            <div className="form-group"><label>Main category name *</label><input required value={newCategoryName} onChange={(event) => setNewCategoryName(event.target.value)} placeholder="e.g. Strapping Machine Parts" /></div>
            <div className="form-group"><label>&nbsp;</label><button className="primary-btn" disabled={loading}>Create main category</button></div>
          </div>
        </form>
      </div>

      <div className="admin-form-card">
        <h2>Add subcategory</h2>
        <form onSubmit={submitSubcategory}>
          <div className="form-row">
            <div className="form-group"><label>Main category *</label><select required value={subForm.categoryId} onChange={(event) => setSubForm({ ...subForm, categoryId: event.target.value })}><option value="">Select main category</option>{categories.map((item) => <option key={item._id} value={item._id}>{item.name}</option>)}</select></div>
            <div className="form-group"><label>Subcategory name *</label><input required value={subForm.name} onChange={(event) => setSubForm({ ...subForm, name: event.target.value })} /></div>
          </div>
          <div className="form-row">
            <div className="form-group"><label>Slug</label><input value={subForm.slug} onChange={(event) => setSubForm({ ...subForm, slug: event.target.value })} /></div>
            <div className="form-group"><label>Subcategory image</label><input type="file" accept="image/*" onChange={(event) => { const file = event.target.files[0] || null; setSubImage(file); if (file) setSubForm({ ...subForm, imageName: file.name }); }} /></div>
            <div className="form-group"><label>Image name</label><input value={subForm.imageName} onChange={(event) => setSubForm({ ...subForm, imageName: event.target.value })} /></div>
          </div>
          <div className="form-group"><label>Description</label><textarea value={subForm.description} onChange={(event) => setSubForm({ ...subForm, description: event.target.value })} /></div>
          <button className="primary-btn" disabled={loading || !categories.length}>Save subcategory</button>
        </form>
      </div>

      <div className="admin-form-card">
        <h2>Add sub-subcategory</h2>
        <form onSubmit={submitSubSubcategory}>
          <div className="form-row">
            <div className="form-group"><label>Main category *</label><select required value={subSubForm.categoryId} onChange={(event) => setSubSubForm({ ...subSubForm, categoryId: event.target.value, subCategoryId: "" })}><option value="">Select main category</option>{categories.map((item) => <option key={item._id} value={item._id}>{item.name}</option>)}</select></div>
            <div className="form-group"><label>Subcategory *</label><select required value={subSubForm.subCategoryId} onChange={(event) => setSubSubForm({ ...subSubForm, subCategoryId: event.target.value })}><option value="">Select subcategory</option>{visibleSubcategories.map((item) => <option key={item._id} value={item._id}>{item.name}</option>)}</select></div>
          </div>
          <div className="form-row">
            <div className="form-group"><label>Sub-subcategory name *</label><input required value={subSubForm.name} onChange={(event) => setSubSubForm({ ...subSubForm, name: event.target.value })} /></div>
            <div className="form-group"><label>Slug</label><input value={subSubForm.slug} onChange={(event) => setSubSubForm({ ...subSubForm, slug: event.target.value })} /></div>
          </div>
          <div className="form-row">
            <div className="form-group"><label>Sub-subcategory image</label><input type="file" accept="image/*" onChange={(event) => { const file = event.target.files[0] || null; setSubSubImage(file); if (file) setSubSubForm({ ...subSubForm, imageName: file.name }); }} /></div>
            <div className="form-group"><label>Image name</label><input value={subSubForm.imageName} onChange={(event) => setSubSubForm({ ...subSubForm, imageName: event.target.value })} /></div>
          </div>
          <button className="primary-btn" disabled={loading || !subcategories.length}>Save sub-subcategory</button>
        </form>
      </div>

      <div className="admin-table-card"><div className="table-header"><h2>Subcategories</h2><span>{subcategories.length}</span></div><div className="table-wrapper"><table><thead><tr><th>Name</th><th>Main category</th><th>Image name</th><th>Action</th></tr></thead><tbody>{subcategories.map((item) => <tr key={item._id}><td>{item.name}</td><td>{item.category?.name || "—"}</td><td>{item.imageName || "—"}</td><td><button className="delete-btn" onClick={() => removeSubcategory(item._id)}>Delete</button></td></tr>)}</tbody></table></div></div>
      <div className="admin-table-card"><div className="table-header"><h2>Sub-subcategories</h2><span>{subSubcategories.length}</span></div><div className="table-wrapper"><table><thead><tr><th>Name</th><th>Main category</th><th>Subcategory</th><th>Image name</th><th>Action</th></tr></thead><tbody>{subSubcategories.map((item) => <tr key={item._id}><td>{item.name}</td><td>{item.category?.name || "—"}</td><td>{item.subCategory?.name || "—"}</td><td>{item.imageName || "—"}</td><td><button className="delete-btn" onClick={() => removeSubSubcategory(item._id)}>Delete</button></td></tr>)}</tbody></table></div></div>
    </div>
  );
}
