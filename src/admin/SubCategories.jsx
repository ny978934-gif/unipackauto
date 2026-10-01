import { useEffect, useMemo, useRef, useState } from "react";
import { API } from "../spareApi";
import "./AdminPages.css";

const emptySubcategory = { categoryId: "", name: "", slug: "", description: "", imageName: "" };
const emptySubSubcategory = { categoryId: "", subCategoryId: "", name: "", slug: "", imageName: "" };
const emptySubcategoryEdit = { ...emptySubcategory, imageUrl: "" };
const emptySubSubcategoryEdit = { ...emptySubSubcategory, imageUrl: "" };

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
  const [editingSubcategoryId, setEditingSubcategoryId] = useState("");
  const [editSubForm, setEditSubForm] = useState(emptySubcategoryEdit);
  const [editSubImages, setEditSubImages] = useState([]);
  const [editingSubSubcategoryId, setEditingSubSubcategoryId] = useState("");
  const [editSubSubForm, setEditSubSubForm] = useState(emptySubSubcategoryEdit);
  const [editSubSubImages, setEditSubSubImages] = useState([]);
  const [subcategorySearch, setSubcategorySearch] = useState("");
  const [subSubcategorySearch, setSubSubcategorySearch] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const subcategoryEditorRef = useRef(null);
  const subSubcategoryEditorRef = useRef(null);

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

  useEffect(() => {
    if (editingSubcategoryId) {
      subcategoryEditorRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [editingSubcategoryId]);

  useEffect(() => {
    if (editingSubSubcategoryId) {
      subSubcategoryEditorRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [editingSubSubcategoryId]);

  const visibleSubcategories = useMemo(
    () => subcategories.filter((item) => (item.category?._id || item.category) === subSubForm.categoryId),
    [subcategories, subSubForm.categoryId]
  );
  const editVisibleSubcategories = useMemo(
    () => subcategories.filter((item) => (item.category?._id || item.category) === editSubSubForm.categoryId),
    [subcategories, editSubSubForm.categoryId]
  );
  const filteredSubcategories = useMemo(() => {
    const query = subcategorySearch.trim().toLowerCase();
    if (!query) return subcategories;
    return subcategories.filter((item) =>
      [item.name, item.slug, item.imageName, item.category?.name]
        .some((value) => value?.toLowerCase().includes(query))
    );
  }, [subcategories, subcategorySearch]);
  const filteredSubSubcategories = useMemo(() => {
    const query = subSubcategorySearch.trim().toLowerCase();
    if (!query) return subSubcategories;
    return subSubcategories.filter((item) =>
      [item.name, item.slug, item.imageName, item.category?.name, item.subCategory?.name]
        .some((value) => value?.toLowerCase().includes(query))
    );
  }, [subSubcategories, subSubcategorySearch]);
  const editingSubcategory = subcategories.find((item) => item._id === editingSubcategoryId);
  const editingSubSubcategory = subSubcategories.find((item) => item._id === editingSubSubcategoryId);

  const getImageUrls = (item) => {
    const images = Array.isArray(item?.images) ? item.images.filter(Boolean) : [];
    return images.length ? images : item?.image ? [item.image] : [];
  };

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

  const editSubcategory = (item) => {
    setEditingSubcategoryId(item._id);
    setEditSubForm({
      ...emptySubcategoryEdit,
      categoryId: item.category?._id || item.category || "",
      name: item.name || "",
      slug: item.slug || "",
      description: item.description || "",
      imageName: item.imageName || "",
      imageUrl: item.image || "",
    });
    setEditSubImages([]);
    setMessage("");
  };

  const saveSubcategoryEdit = async (event) => {
    event.preventDefault();
    setLoading(true);
    try {
      const body = new FormData();
      Object.entries(editSubForm).forEach(([key, value]) => {
        if (key !== "imageUrl") body.append(key, value);
      });
      if (editSubForm.imageUrl !== (editingSubcategory?.image || "")) {
        body.append("image", editSubForm.imageUrl);
      }
      editSubImages.forEach((file) => body.append("images", file));
      const response = await fetch(`${API}/api/subcategories/${editingSubcategoryId}`, {
        method: "PUT",
        body,
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Unable to update subcategory.");
      setEditingSubcategoryId("");
      setEditSubForm(emptySubcategoryEdit);
      setEditSubImages([]);
      setMessage("Subcategory updated successfully.");
      await load();
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  const editSubSubcategory = (item) => {
    setEditingSubSubcategoryId(item._id);
    setEditSubSubForm({
      ...emptySubSubcategoryEdit,
      categoryId: item.category?._id || item.category || "",
      subCategoryId: item.subCategory?._id || item.subCategory || "",
      name: item.name || "",
      slug: item.slug || "",
      imageName: item.imageName || "",
      imageUrl: item.image || "",
    });
    setEditSubSubImages([]);
    setMessage("");
  };

  const saveSubSubcategoryEdit = async (event) => {
    event.preventDefault();
    setLoading(true);
    try {
      const body = new FormData();
      Object.entries(editSubSubForm).forEach(([key, value]) => {
        if (key !== "imageUrl") body.append(key, value);
      });
      if (editSubSubForm.imageUrl !== (editingSubSubcategory?.image || "")) {
        body.append("image", editSubSubForm.imageUrl);
      }
      editSubSubImages.forEach((file) => body.append("images", file));
      const response = await fetch(`${API}/api/sub-subcategories/${editingSubSubcategoryId}`, {
        method: "PUT",
        body,
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Unable to update sub-subcategory.");
      setEditingSubSubcategoryId("");
      setEditSubSubForm(emptySubSubcategoryEdit);
      setEditSubSubImages([]);
      setMessage("Sub-subcategory updated successfully.");
      await load();
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  const removeSubcategory = async (id) => {
    if (!window.confirm("Delete this subcategory, sub-subcategories, and products?")) return;
    try {
      const response = await fetch(`${API}/api/subcategories/${id}`, { method: "DELETE" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Unable to delete subcategory.");
      setSubcategories((items) => items.filter((item) => item._id !== id));
      setSubSubcategories((items) => items.filter((item) => (item.subCategory?._id || item.subCategory) !== id));
      if (editingSubcategoryId === id) setEditingSubcategoryId("");
      setMessage("Subcategory deleted.");
    } catch (error) {
      setMessage(error.message);
    }
  };

  const removeSubSubcategory = async (id) => {
    if (!window.confirm("Delete this sub-subcategory?")) return;
    try {
      const response = await fetch(`${API}/api/sub-subcategories/${id}`, { method: "DELETE" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Unable to delete sub-subcategory.");
      setSubSubcategories((items) => items.filter((item) => item._id !== id));
      if (editingSubSubcategoryId === id) setEditingSubSubcategoryId("");
      setMessage("Sub-subcategory deleted.");
    } catch (error) {
      setMessage(error.message);
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
              setEditingSubcategoryId("");
              setEditSubForm(emptySubcategoryEdit);
              setEditSubImages([]);
              setEditingSubSubcategoryId("");
              setEditSubSubForm(emptySubSubcategoryEdit);
              setEditSubSubImages([]);
              setSubcategorySearch("");
              setSubSubcategorySearch("");
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
        <div className="table-header">
          <h2>Subcategories</h2>
          <span>{filteredSubcategories.length} / {subcategories.length}</span>
        </div>
        <div className="admin-table-search">
          <label htmlFor="subcategory-search">Search subcategories</label>
          <input
            id="subcategory-search"
            type="search"
            value={subcategorySearch}
            onChange={(event) => setSubcategorySearch(event.target.value)}
            placeholder="Search by name, slug, main category, or image name"
          />
        </div>
        {editingSubcategoryId && (
          <div className="admin-form-card" ref={subcategoryEditorRef}>
            <h2>Edit subcategory</h2>
            {getImageUrls(editingSubcategory).length > 0 && (
              <div className="admin-image-previews">
                {getImageUrls(editingSubcategory).map((imageUrl) => (
                  <img key={imageUrl} className="admin-product-image-preview" src={imageUrl} alt={`${editingSubcategory.name} current image`} />
                ))}
              </div>
            )}
            <form onSubmit={saveSubcategoryEdit}>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="edit-subcategory-category">Main category *</label>
                  <select id="edit-subcategory-category" required value={editSubForm.categoryId} onChange={(event) => setEditSubForm({ ...editSubForm, categoryId: event.target.value })}>
                    <option value="">Select main category</option>
                    {categories.map((item) => <option key={item._id} value={item._id}>{item.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="edit-subcategory-name">Subcategory name *</label>
                  <input id="edit-subcategory-name" required value={editSubForm.name} onChange={(event) => setEditSubForm({ ...editSubForm, name: event.target.value })} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="edit-subcategory-slug">Slug</label>
                  <input id="edit-subcategory-slug" value={editSubForm.slug} onChange={(event) => setEditSubForm({ ...editSubForm, slug: event.target.value })} />
                </div>
                <div className="form-group">
                  <label htmlFor="edit-subcategory-image-url">Image URL</label>
                  <input id="edit-subcategory-image-url" value={editSubForm.imageUrl} onChange={(event) => setEditSubForm({ ...editSubForm, imageUrl: event.target.value })} placeholder="Paste an image URL or leave unchanged" />
                </div>
                <div className="form-group">
                  <label htmlFor="edit-subcategory-images">Replace images (up to 10)</label>
                  <input id="edit-subcategory-images" type="file" accept="image/*" multiple onChange={(event) => {
                    const files = Array.from(event.target.files || []);
                    setEditSubImages(files);
                    if (files.length) setEditSubForm((form) => ({ ...form, imageName: files.map((file) => file.name).join(", ") }));
                  }} />
                  <small>Existing images are kept unless replacement files are selected.</small>
                  {editSubImages.length > 0 && <small>{editSubImages.length} image{editSubImages.length === 1 ? "" : "s"} selected</small>}
                </div>
              </div>
              <div className="form-group">
                <label htmlFor="edit-subcategory-image-name">Image names</label>
                <input id="edit-subcategory-image-name" value={editSubForm.imageName} onChange={(event) => setEditSubForm({ ...editSubForm, imageName: event.target.value })} />
              </div>
              <div className="form-group">
                <label htmlFor="edit-subcategory-description">Description</label>
                <textarea id="edit-subcategory-description" value={editSubForm.description} onChange={(event) => setEditSubForm({ ...editSubForm, description: event.target.value })} />
              </div>
              <button className="primary-btn" disabled={loading}>{loading ? "Saving..." : "Save subcategory"}</button>{" "}
              <button type="button" className="edit-btn" disabled={loading} onClick={() => {
                setEditingSubcategoryId("");
                setEditSubForm(emptySubcategoryEdit);
                setEditSubImages([]);
              }}>Cancel</button>
            </form>
          </div>
        )}
        <div className="table-wrapper">
          <table>
            <thead><tr><th>Name</th><th>Main category</th><th>Slug</th><th>Image name</th><th>Actions</th></tr></thead>
            <tbody>
              {filteredSubcategories.map((item) => (
                <tr key={item._id}>
                  <td>{item.name}</td>
                  <td>{item.category?.name || "—"}</td>
                  <td>{item.slug || "—"}</td>
                  <td>{item.imageName || "—"}</td>
                  <td>
                    <button type="button" className="edit-btn" disabled={loading} onClick={() => editSubcategory(item)}>Edit</button>{" "}
                    <button type="button" className="delete-btn" disabled={loading} onClick={() => removeSubcategory(item._id)}>Delete</button>
                  </td>
                </tr>
              ))}
              {!filteredSubcategories.length && <tr><td colSpan="5">{subcategorySearch ? "No subcategories match this search." : "No subcategories yet."}</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      <div className="admin-table-card">
        <div className="table-header">
          <h2>Sub-subcategories</h2>
          <span>{filteredSubSubcategories.length} / {subSubcategories.length}</span>
        </div>
        <div className="admin-table-search">
          <label htmlFor="sub-subcategory-search">Search sub-subcategories</label>
          <input
            id="sub-subcategory-search"
            type="search"
            value={subSubcategorySearch}
            onChange={(event) => setSubSubcategorySearch(event.target.value)}
            placeholder="Search by name, slug, category, subcategory, or image name"
          />
        </div>
        {editingSubSubcategoryId && (
          <div className="admin-form-card" ref={subSubcategoryEditorRef}>
            <h2>Edit sub-subcategory</h2>
            {getImageUrls(editingSubSubcategory).length > 0 && (
              <div className="admin-image-previews">
                {getImageUrls(editingSubSubcategory).map((imageUrl) => (
                  <img key={imageUrl} className="admin-product-image-preview" src={imageUrl} alt={`${editingSubSubcategory.name} current image`} />
                ))}
              </div>
            )}
            <form onSubmit={saveSubSubcategoryEdit}>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="edit-sub-subcategory-category">Main category *</label>
                  <select id="edit-sub-subcategory-category" required value={editSubSubForm.categoryId} onChange={(event) => setEditSubSubForm({ ...editSubSubForm, categoryId: event.target.value, subCategoryId: "" })}>
                    <option value="">Select main category</option>
                    {categories.map((item) => <option key={item._id} value={item._id}>{item.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="edit-sub-subcategory-parent">Subcategory *</label>
                  <select id="edit-sub-subcategory-parent" required value={editSubSubForm.subCategoryId} onChange={(event) => setEditSubSubForm({ ...editSubSubForm, subCategoryId: event.target.value })}>
                    <option value="">Select subcategory</option>
                    {editVisibleSubcategories.map((item) => <option key={item._id} value={item._id}>{item.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="edit-sub-subcategory-name">Sub-subcategory name *</label>
                  <input id="edit-sub-subcategory-name" required value={editSubSubForm.name} onChange={(event) => setEditSubSubForm({ ...editSubSubForm, name: event.target.value })} />
                </div>
                <div className="form-group">
                  <label htmlFor="edit-sub-subcategory-slug">Slug</label>
                  <input id="edit-sub-subcategory-slug" value={editSubSubForm.slug} onChange={(event) => setEditSubSubForm({ ...editSubSubForm, slug: event.target.value })} />
                </div>
                <div className="form-group">
                  <label htmlFor="edit-sub-subcategory-image-url">Image URL</label>
                  <input id="edit-sub-subcategory-image-url" value={editSubSubForm.imageUrl} onChange={(event) => setEditSubSubForm({ ...editSubSubForm, imageUrl: event.target.value })} placeholder="Paste an image URL or leave unchanged" />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="edit-sub-subcategory-images">Replace images (up to 10)</label>
                  <input id="edit-sub-subcategory-images" type="file" accept="image/*" multiple onChange={(event) => {
                    const files = Array.from(event.target.files || []);
                    setEditSubSubImages(files);
                    if (files.length) setEditSubSubForm((form) => ({ ...form, imageName: files.map((file) => file.name).join(", ") }));
                  }} />
                  <small>Existing images are kept unless replacement files are selected.</small>
                  {editSubSubImages.length > 0 && <small>{editSubSubImages.length} image{editSubSubImages.length === 1 ? "" : "s"} selected</small>}
                </div>
                <div className="form-group">
                  <label htmlFor="edit-sub-subcategory-image-name">Image names</label>
                  <input id="edit-sub-subcategory-image-name" value={editSubSubForm.imageName} onChange={(event) => setEditSubSubForm({ ...editSubSubForm, imageName: event.target.value })} />
                </div>
              </div>
              <button className="primary-btn" disabled={loading}>{loading ? "Saving..." : "Save sub-subcategory"}</button>{" "}
              <button type="button" className="edit-btn" disabled={loading} onClick={() => {
                setEditingSubSubcategoryId("");
                setEditSubSubForm(emptySubSubcategoryEdit);
                setEditSubSubImages([]);
              }}>Cancel</button>
            </form>
          </div>
        )}
        <div className="table-wrapper">
          <table>
            <thead><tr><th>Name</th><th>Main category</th><th>Subcategory</th><th>Slug</th><th>Image name</th><th>Actions</th></tr></thead>
            <tbody>
              {filteredSubSubcategories.map((item) => (
                <tr key={item._id}>
                  <td>{item.name}</td>
                  <td>{item.category?.name || "—"}</td>
                  <td>{item.subCategory?.name || "—"}</td>
                  <td>{item.slug || "—"}</td>
                  <td>{item.imageName || "—"}</td>
                  <td>
                    <button type="button" className="edit-btn" disabled={loading} onClick={() => editSubSubcategory(item)}>Edit</button>{" "}
                    <button type="button" className="delete-btn" disabled={loading} onClick={() => removeSubSubcategory(item._id)}>Delete</button>
                  </td>
                </tr>
              ))}
              {!filteredSubSubcategories.length && <tr><td colSpan="6">{subSubcategorySearch ? "No sub-subcategories match this search." : "No sub-subcategories yet."}</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
