import { useEffect, useMemo, useState } from "react";
import { API } from "../spareApi";
import "./AdminPages.css";

const emptySubcategory = { categoryId: "", name: "", slug: "", description: "", imageName: "" };
const emptySubSubcategory = { categoryId: "", subCategoryId: "", name: "", slug: "", imageName: "" };

export default function SubCategories() {
  const [type, setType] = useState("sparepart");
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [subSubcategories, setSubSubcategories] = useState([]);
  const [subForm, setSubForm] = useState(emptySubcategory);
  const [subSubForm, setSubSubForm] = useState(emptySubSubcategory);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [subImages, setSubImages] = useState([]);
  const [subSubImages, setSubSubImages] = useState([]);
  const [replacementImages, setReplacementImages] = useState({});
  const [editingImagesFor, setEditingImagesFor] = useState(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const load = async (catalogType = type) => {
    const [categoryResponse, subcategoryResponse, subSubcategoryResponse] = await Promise.all([
      fetch(`${API}/api/spare/categories?type=${catalogType}`),
      fetch(`${API}/api/subcategories?type=${catalogType}`),
      fetch(`${API}/api/sub-subcategories?type=${catalogType}`),
    ]);
    if (!categoryResponse.ok || !subcategoryResponse.ok || !subSubcategoryResponse.ok) {
      throw new Error("Unable to load category data.");
    }
    setCategories(await categoryResponse.json());
    setSubcategories(await subcategoryResponse.json());
    setSubSubcategories(await subSubcategoryResponse.json());
  };

  useEffect(() => {
    load(type).catch((error) => setMessage(error.message));
  }, [type]);

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
      body.append("type", type);
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
      body.append("type", type);
      subImages.forEach((file) => body.append("images", file));
      const response = await fetch(`${API}/api/subcategories`, { method: "POST", body });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Unable to save subcategory.");
      setSubForm(emptySubcategory);
      setSubImages([]);
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
      body.append("type", type);
      subSubImages.forEach((file) => body.append("images", file));
      const response = await fetch(`${API}/api/sub-subcategories`, { method: "POST", body });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Unable to save sub-subcategory.");
      setSubSubForm(emptySubSubcategory);
      setSubSubImages([]);
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

  const replaceSubcategoryImages = async (id) => {
    const files = replacementImages[id] || [];
    if (!files.length) {
      setMessage("Choose at least one image to replace this subcategory's images.");
      return;
    }

    setLoading(true);
    try {
      const body = new FormData();
      files.forEach((file) => body.append("images", file));
      body.append("imageName", files.map((file) => file.name).join(", "));
      const response = await fetch(`${API}/api/subcategories/${id}`, {
        method: "PUT",
        body,
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Unable to replace subcategory images.");

      setReplacementImages((images) => {
        const remainingImages = { ...images };
        delete remainingImages[id];
        return remainingImages;
      });
      setEditingImagesFor(null);
      await load();
      setMessage("Subcategory images replaced successfully.");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-page">
      <div className="page-title"><div><h1>Category hierarchy</h1><p>Manage main categories, subcategories, and sub-subcategories.</p></div></div>
      {message && <p className="admin-notice">{message}</p>}

      <div className="admin-form-card">
        <div className="form-group">
          <label htmlFor="hierarchy-type">Catalogue</label>
          <select
            id="hierarchy-type"
            value={type}
            disabled={loading}
            onChange={(event) => {
              const selectedType = event.target.value;
              setType(selectedType);
              setNewCategoryName("");
              setSubForm(emptySubcategory);
              setSubSubForm(emptySubSubcategory);
              setMessage("");
            }}
          >
            <option value="sparepart">Spare Parts</option>
            <option value="machine">Products / Machines</option>
          </select>
        </div>
      </div>

      <div className="admin-form-card">
        <h2>Create {type === "machine" ? "product / machine" : "spare parts"} category</h2>
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
            <div className="form-group"><label>Subcategory images (up to 10)</label><input type="file" accept="image/*" multiple onChange={(event) => { const files = Array.from(event.target.files || []); setSubImages(files); if (files.length) setSubForm({ ...subForm, imageName: files.map((file) => file.name).join(", ") }); }} />{subImages.length > 0 && <small>{subImages.length} image{subImages.length === 1 ? "" : "s"} selected</small>}</div>
            <div className="form-group"><label>Image names</label><input value={subForm.imageName} onChange={(event) => setSubForm({ ...subForm, imageName: event.target.value })} /></div>
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
            <div className="form-group"><label>Sub-subcategory images (up to 10)</label><input type="file" accept="image/*" multiple onChange={(event) => { const files = Array.from(event.target.files || []); setSubSubImages(files); if (files.length) setSubSubForm({ ...subSubForm, imageName: files.map((file) => file.name).join(", ") }); }} />{subSubImages.length > 0 && <small>{subSubImages.length} image{subSubImages.length === 1 ? "" : "s"} selected</small>}</div>
            <div className="form-group"><label>Image names</label><input value={subSubForm.imageName} onChange={(event) => setSubSubForm({ ...subSubForm, imageName: event.target.value })} /></div>
          </div>
          <button className="primary-btn" disabled={loading || !subcategories.length}>Save sub-subcategory</button>
        </form>
      </div>

      <div className="admin-table-card">
        <div className="table-header"><h2>Subcategories</h2><span>{subcategories.length}</span></div>
        <div className="table-wrapper">
          <table>
            <thead><tr><th>Name</th><th>Main category</th><th>Image name</th><th>Images</th><th>Action</th></tr></thead>
            <tbody>
              {subcategories.map((item) => (
                <tr key={item._id}>
                  <td>{item.name}</td>
                  <td>{item.category?.name || "—"}</td>
                  <td>{item.imageName || "—"}</td>
                  <td>
                    {editingImagesFor === item._id ? (
                      <>
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          aria-label={`Choose replacement images for ${item.name}`}
                          onChange={(event) => setReplacementImages((images) => ({
                            ...images,
                            [item._id]: Array.from(event.target.files || []),
                          }))}
                        />
                        <button
                          className="primary-btn"
                          type="button"
                          disabled={loading || !replacementImages[item._id]?.length}
                          onClick={() => replaceSubcategoryImages(item._id)}
                        >
                          {loading ? "Saving..." : "Save images"}
                        </button>
                        <button
                          className="edit-btn"
                          type="button"
                          disabled={loading}
                          onClick={() => {
                            setEditingImagesFor(null);
                            setReplacementImages((images) => {
                              const remainingImages = { ...images };
                              delete remainingImages[item._id];
                              return remainingImages;
                            });
                          }}
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <button
                        className="edit-btn"
                        type="button"
                        disabled={loading}
                        onClick={() => {
                          setEditingImagesFor(item._id);
                          setReplacementImages((images) => ({
                            ...images,
                            [item._id]: [],
                          }));
                        }}
                      >
                        Edit image
                      </button>
                    )}
                  </td>
                  <td><button className="delete-btn" onClick={() => removeSubcategory(item._id)}>Delete</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div className="admin-table-card"><div className="table-header"><h2>Sub-subcategories</h2><span>{subSubcategories.length}</span></div><div className="table-wrapper"><table><thead><tr><th>Name</th><th>Main category</th><th>Subcategory</th><th>Image name</th><th>Action</th></tr></thead><tbody>{subSubcategories.map((item) => <tr key={item._id}><td>{item.name}</td><td>{item.category?.name || "—"}</td><td>{item.subCategory?.name || "—"}</td><td>{item.imageName || "—"}</td><td><button className="delete-btn" onClick={() => removeSubSubcategory(item._id)}>Delete</button></td></tr>)}</tbody></table></div></div>
    </div>
  );
}
