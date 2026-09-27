import { useCallback, useEffect, useState } from "react";
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

// ── Main component ─────────────────────────────────────────────────────────────
export default function DocumentUploader({ type = "machine", onUploadSuccess }) {
  const [categories, setCategories] = useState([]);
  const [categoryId, setCategoryId] = useState("");
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [file, setFile]           = useState(null);
  const [uploading, setUploading] = useState(false);

  // Toast queue
  const [toasts, setToasts] = useState([]);

  // ── helpers ────────────────────────────────────────────────────────────────
  const pushToast = useCallback((message, type = "success", duration = 4500) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), duration);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    fetch(`${API}/api/spare/categories?type=${type}`, { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error("Unable to load categories.");
        return response.json();
      })
      .then((data) => setCategories(Array.isArray(data) ? data : []))
      .catch((error) => {
        if (error.name !== "AbortError") pushToast(error.message, "error");
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoadingOptions(false);
      });
    return () => controller.abort();
  }, [type, pushToast]);

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
    if (!file || !categoryId) {
      pushToast("Choose a category and a PDF or DOCX file to upload.", "error");
      return;
    }

    setUploading(true);
    // loading toast — cleared explicitly on success/error below
    const loadingToastId = Date.now();
    setToasts((prev) => [...prev, { id: loadingToastId, message: "Parsing document and saving product…", type: "loading" }]);

    try {
      const formData = new FormData();
      formData.append("document",        file);
      formData.append("categoryId",      categoryId);
      formData.append("type",            type);

      const res = await fetch(`${API}/api/documents/upload-parse`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Upload failed.");

      // ── instant UI update ──────────────────────────────────────────────
      const savedProduct = data.product;
      // notify parent (e.g. Products2.jsx can refresh its table)
      onUploadSuccess?.(savedProduct);

      // dismiss loading toast by ID, show success
      setToasts((prev) => prev.filter((t) => t.id !== loadingToastId));
      pushToast("File parsed & saved to database successfully!", "success");

      // reset form
      setFile(null);
      setCategoryId("");
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
          <p>Upload a PDF or DOCX to extract product details and save them under a machine/category.</p>
        </div>
      </div>

      <form className="admin-form-card document-uploader-form" onSubmit={handleSubmit}>
        <h2>Upload document</h2>

        <div className="form-group">
          <label htmlFor="document-category">Main category (machine name) *</label>
          <select
            id="document-category"
            required
            value={categoryId}
            disabled={loadingOptions || uploading}
            onChange={(event) => setCategoryId(event.target.value)}
          >
            <option value="">Select category</option>
            {categories.map((category) => <option key={category._id} value={category._id}>{category.name}</option>)}
          </select>
        </div>

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
                    onClick={(e) => { e.stopPropagation(); setFile(null); }}
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
          <code>UOM</code>
        </div>

        <button
          className="primary-btn du-submit-btn"
          type="submit"
          disabled={uploading || loadingOptions || !file || !categoryId}
        >
          {uploading ? (
            <><span className="du-spinner" aria-hidden="true" /> Importing…</>
          ) : (
            "Upload & import product"
          )}
        </button>
      </form>
    </div>
  );
}
