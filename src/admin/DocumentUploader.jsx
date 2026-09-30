import { useCallback, useEffect, useMemo, useState } from "react";
import { useDropzone } from "react-dropzone";
import { API } from "../spareApi";
import "./DocumentUploader.css";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

// ── Toast ─────────────────────────────────────────────────────────────────────
function Toast({ toasts }) {
  return (
    <div className="du-toast-stack" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className={`du-toast du-toast--${t.type}`}>
          <span className="du-toast-icon">
            {t.type === "success" ? "✓" : t.type === "error" ? "✕" : "⟳"}
          </span>
          {t.message}
        </div>
      ))}
    </div>
  );
}

// ── Extracted product preview card ────────────────────────────────────────────
function ProductPreview({ product }) {
  if (!product) return null;
  return (
    <div className="du-preview-card">
      <div className="du-preview-header">
        <span className="du-preview-badge">✓ Saved to database</span>
        <h3 className="du-preview-name">{product.name}</h3>
      </div>
      <div className="du-preview-fields">
        {product.partCode && (
          <div className="du-preview-field">
            <span>Item Code</span>
            <code>{product.partCode}</code>
          </div>
        )}
        {product.price > 0 && (
          <div className="du-preview-field">
            <span>Price</span>
            <strong>₹{Number(product.price).toLocaleString("en-IN")}</strong>
          </div>
        )}
        {product.category?.name && (
          <div className="du-preview-field">
            <span>Category</span>
            <em>{product.category.name}</em>
          </div>
        )}
        {product.subCategory?.name && (
          <div className="du-preview-field">
            <span>Subcategory</span>
            <em>{product.subCategory.name}</em>
          </div>
        )}
        {product.description && (
          <div className="du-preview-field du-preview-field--full">
            <span>Description (first 200 chars)</span>
            <p>{product.description.slice(0, 200)}{product.description.length > 200 ? "…" : ""}</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function DocumentUploader({ type = "machine", onUploadSuccess }) {
  const [categories, setCategories]       = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [subSubcategories, setSubSubcategories] = useState([]);
  const [categoryId, setCategoryId]       = useState("");
  const [subCategoryId, setSubCategoryId] = useState("");
  const [subSubCategoryId, setSubSubCategoryId] = useState("");

  const [file, setFile]           = useState(null);
  const [uploading, setUploading] = useState(false);
  const [loadingOptions, setLoadingOptions] = useState(true);

  // Parsed product shown below the dropzone after a successful import
  const [parsedProduct, setParsedProduct] = useState(null);

  // Products added this session — shown in the "Recently imported" table
  const [importedProducts, setImportedProducts] = useState([]);

  // Toast queue
  const [toasts, setToasts] = useState([]);

  // ── helpers ────────────────────────────────────────────────────────────────
  const pushToast = useCallback((message, type = "success", duration = 4500) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), duration);
  }, []);

  // ── load dropdowns ─────────────────────────────────────────────────────────
  useEffect(() => {
    const controller = new AbortController();
    (async () => {
      try {
        const [catRes, subRes, subSubRes] = await Promise.all([
          fetch(`${API}/api/spare/categories?type=${type}`,    { signal: controller.signal }),
          fetch(`${API}/api/subcategories?type=${type}`,       { signal: controller.signal }),
          fetch(`${API}/api/sub-subcategories?type=${type}`,   { signal: controller.signal }),
        ]);
        if (!catRes.ok || !subRes.ok || !subSubRes.ok) throw new Error("Unable to load category options.");
        const [catData, subData, subSubData] = await Promise.all([catRes.json(), subRes.json(), subSubRes.json()]);
        setCategories(Array.isArray(catData) ? catData : []);
        setSubcategories(Array.isArray(subData) ? subData : []);
        setSubSubcategories(Array.isArray(subSubData) ? subSubData : []);
      } catch (err) {
        if (err.name !== "AbortError") pushToast(err.message, "error");
      } finally {
        if (!controller.signal.aborted) setLoadingOptions(false);
      }
    })();
    return () => controller.abort();
  }, [type, pushToast]);

  const visibleSubcategories = useMemo(
    () => subcategories.filter((s) => (s.category?._id || s.category) === categoryId),
    [subcategories, categoryId],
  );
  const visibleSubSubcategories = useMemo(
    () => subSubcategories.filter((s) => (s.subCategory?._id || s.subCategory) === subCategoryId),
    [subSubcategories, subCategoryId],
  );

  // ── file validation ────────────────────────────────────────────────────────
  const validateFile = useCallback((f) => {
    if (!f) return "No file selected.";
    const ext = f.name.split(".").pop()?.toLowerCase();
    if (!["pdf", "docx"].includes(ext)) return "Only PDF or DOCX files are supported.";
    if (f.size > MAX_FILE_SIZE) return "File is too large — maximum 10 MB.";
    return null;
  }, []);

  // ── react-dropzone ─────────────────────────────────────────────────────────
  const onDrop = useCallback((acceptedFiles, rejectedFiles) => {
    if (rejectedFiles.length) {
      const reason = rejectedFiles[0]?.errors?.[0]?.message || "Unsupported file.";
      pushToast(reason, "error");
      return;
    }
    const picked = acceptedFiles[0];
    if (!picked) return;
    const err = validateFile(picked);
    if (err) { pushToast(err, "error"); return; }
    setFile(picked);
    setParsedProduct(null);
  }, [validateFile, pushToast]);

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
    },
    maxSize: MAX_FILE_SIZE,
    multiple: false,
    disabled: uploading,
  });

  // ── submit ─────────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file || !categoryId || !subCategoryId) return;

    setUploading(true);
    // loading toast — cleared explicitly on success/error below
    const loadingToastId = Date.now();
    setToasts((prev) => [...prev, { id: loadingToastId, message: "Parsing document and saving product…", type: "loading" }]);

    try {
      const formData = new FormData();
      formData.append("document",        file);
      formData.append("categoryId",      categoryId);
      formData.append("subCategoryId",   subCategoryId);
      formData.append("subSubCategoryId", subSubCategoryId);
      formData.append("type",            type);

      const res = await fetch(`${API}/api/documents/upload-parse`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Upload failed.");

      // ── instant UI update ──────────────────────────────────────────────
      const savedProduct = data.product;
      setParsedProduct(savedProduct);
      // prepend to local "recently imported" list
      setImportedProducts((prev) => [savedProduct, ...prev]);
      // notify parent (e.g. Products2.jsx can refresh its table)
      onUploadSuccess?.(savedProduct);

      // dismiss loading toast by ID, show success
      setToasts((prev) => prev.filter((t) => t.id !== loadingToastId));
      pushToast("File parsed & saved to database successfully!", "success");

      // reset form
      setFile(null);
      setCategoryId("");
      setSubCategoryId("");
      setSubSubCategoryId("");
    } catch (err) {
      setToasts((prev) => prev.filter((t) => t.id !== loadingToastId));
      pushToast(err.message || "Failed to parse document. Please check file format.", "error");
    } finally {
      setUploading(false);
    }
  };

  // ── dropzone appearance ────────────────────────────────────────────────────
  const dropzoneClass = [
    "document-dropzone",
    isDragActive && !isDragReject ? "dragging" : "",
    isDragReject ? "drag-reject" : "",
    file ? "has-file" : "",
    uploading ? "is-disabled" : "",
  ].filter(Boolean).join(" ");

  return (
    <div className="admin-page document-uploader-page">
      <Toast toasts={toasts} />

      <div className="page-title">
        <div>
          <h1>Document uploader</h1>
          <p>Drop a PDF or DOCX — product fields are extracted and saved to the database instantly.</p>
        </div>
      </div>

      <form className="admin-form-card document-uploader-form" onSubmit={handleSubmit}>
        <h2>Import product from document</h2>

        {/* ── category selects ── */}
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="du-category">Main category *</label>
            <select
              id="du-category"
              required
              value={categoryId}
              disabled={loadingOptions || uploading}
              onChange={(e) => { setCategoryId(e.target.value); setSubCategoryId(""); setSubSubCategoryId(""); }}
            >
              <option value="">Select category</option>
              {categories.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="du-subcategory">Subcategory *</label>
            <select
              id="du-subcategory"
              required
              value={subCategoryId}
              disabled={!categoryId || loadingOptions || uploading}
              onChange={(e) => { setSubCategoryId(e.target.value); setSubSubCategoryId(""); }}
            >
              <option value="">Select subcategory</option>
              {visibleSubcategories.map((s) => <option key={s._id} value={s._id}>{s.name}</option>)}
            </select>
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="du-subsubcategory">Sub-subcategory</label>
          <select
            id="du-subsubcategory"
            value={subSubCategoryId}
            disabled={!subCategoryId || loadingOptions || uploading}
            onChange={(e) => setSubSubCategoryId(e.target.value)}
          >
            <option value="">None</option>
            {visibleSubSubcategories.map((s) => <option key={s._id} value={s._id}>{s.name}</option>)}
          </select>
        </div>

        {/* ── dropzone ── */}
        <div {...getRootProps({ className: dropzoneClass })}>
          <input {...getInputProps()} />

          {uploading ? (
            <>
              <span className="du-spinner du-spinner--lg" aria-hidden="true" />
              <strong>Parsing document and extracting data…</strong>
              <span>Please wait, this may take a few seconds</span>
            </>
          ) : (
            <>
              <span className="document-dropzone-icon" aria-hidden="true">
                {isDragReject ? "✕" : isDragActive ? "↓" : "↑"}
              </span>

              <strong>
                {file
                  ? file.name
                  : isDragReject
                  ? "Only PDF or DOCX files are accepted"
                  : isDragActive
                  ? "Release to upload"
                  : "Drag & drop a PDF or DOCX here, or click to browse"}
              </strong>

              {file ? (
                <span className="du-file-meta">
                  {(file.size / 1024).toFixed(1)} KB
                  {" · "}
                  <button
                    type="button"
                    className="du-clear-btn"
                    onClick={(e) => { e.stopPropagation(); setFile(null); setParsedProduct(null); }}
                  >
                    Remove
                  </button>
                </span>
              ) : (
                <span>PDF or DOCX · up to 10 MB</span>
              )}
            </>
          )}
        </div>

        {/* ── what gets extracted info ── */}
        <div className="du-fields-hint">
          <span>Fields extracted from the document:</span>
          <code>Name</code><code>Item Code</code><code>Price</code><code>Description</code>
        </div>

        <button
          className="primary-btn du-submit-btn"
          type="submit"
          disabled={uploading || loadingOptions || !file || !categoryId || !subCategoryId}
        >
          {uploading ? (
            <><span className="du-spinner" aria-hidden="true" /> Importing…</>
          ) : (
            "Upload & import product"
          )}
        </button>
      </form>

      {/* ── parsed product preview ── */}
      {parsedProduct && <ProductPreview product={parsedProduct} />}

      {/* ── recently imported table ── */}
      {importedProducts.length > 0 && (
        <div className="admin-table-card du-imported-table">
          <div className="table-header">
            <h2>Imported this session</h2>
            <span>{importedProducts.length}</span>
          </div>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Item code</th>
                  <th>Price</th>
                  <th>Category</th>
                  <th>Subcategory</th>
                </tr>
              </thead>
              <tbody>
                {importedProducts.map((p) => (
                  <tr key={p._id}>
                    <td><strong>{p.name}</strong></td>
                    <td><code>{p.partCode || "—"}</code></td>
                    <td>{p.price > 0 ? `₹${Number(p.price).toLocaleString("en-IN")}` : "—"}</td>
                    <td>{p.category?.name || "—"}</td>
                    <td>{p.subCategory?.name || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
