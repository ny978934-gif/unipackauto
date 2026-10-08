import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { API, formatPrice, readApiResponse } from "../spareApi";
import "./AdminPages.css";
import "./SparePartsUploader.css";

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const acceptedExtensions = new Set(["doc", "docx", "xls", "xlsx"]);
const acceptedMimeTypes = new Set([
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/octet-stream",
]);

const isExcelFile = (file) => ["xls", "xlsx"].includes(file?.name.split(".").pop()?.toLowerCase());

export default function SparePartsUploader() {
  const [categories, setCategories] = useState([]);
  const [categoryId, setCategoryId] = useState("");
  const [file, setFile] = useState(null);
  const [imported, setImported] = useState(null);
  const [message, setMessage] = useState("");
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [uploading, setUploading] = useState(false);
  const fileInput = useRef(null);
  const autoImportKey = useRef("");

  useEffect(() => {
    const controller = new AbortController();
    fetch(`${API}/api/spare/categories?type=sparepart`, { signal: controller.signal })
      .then((response) => readApiResponse(response, "Unable to load spare part categories."))
      .then((data) => {
        setCategories(Array.isArray(data) ? data : []);
      })
      .catch((error) => {
        if (error.name !== "AbortError") setMessage(error.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoadingCategories(false);
      });
    return () => controller.abort();
  }, []);

  const importFile = useCallback(async (selectedFile, selectedCategoryId) => {
    if (!selectedCategoryId || !selectedFile) {
      setMessage("Select a main spare part category and an import file first.");
      return;
    }
    setUploading(true);
    setMessage("");
    setImported(null);
    try {
      const formData = new FormData();
      formData.append("categoryId", selectedCategoryId);
      formData.append("file", selectedFile);
      const response = await fetch(`${API}/api/spare-parts/upload-parse`, {
        method: "POST",
        body: formData,
      });
      const data = await readApiResponse(response, "Unable to import spare parts.");
      setImported(data);
      setMessage(data.message || "Spare parts imported successfully.");
      setFile(null);
      if (fileInput.current) fileInput.current.value = "";
    } catch (error) {
      setMessage(error.message);
    } finally {
      setUploading(false);
    }
  }, []);

  useEffect(() => {
    if (!categoryId || !file || !isExcelFile(file)) return;
    const importKey = `${categoryId}:${file.name}:${file.size}:${file.lastModified}`;
    if (autoImportKey.current === importKey) return;
    autoImportKey.current = importKey;
    importFile(file, categoryId);
  }, [categoryId, file, importFile]);

  const chooseFile = (event) => {
    const selected = event.target.files?.[0] || null;
    setImported(null);
    setMessage("");
    if (!selected) {
      setFile(null);
      return;
    }
    const extension = selected.name.split(".").pop()?.toLowerCase();
    if (!acceptedExtensions.has(extension) || !acceptedMimeTypes.has(selected.type || "application/octet-stream")) {
      setFile(null);
      event.target.value = "";
      setMessage("Choose a Microsoft Word (.doc, .docx) or Excel (.xls, .xlsx) file only.");
      return;
    }
    if (selected.size > MAX_FILE_SIZE) {
      setFile(null);
      event.target.value = "";
      setMessage("File is too large. Maximum allowed size is 10 MB.");
      return;
    }
    autoImportKey.current = "";
    setFile(selected);
  };

  const submit = async (event) => {
    event.preventDefault();
    await importFile(file, categoryId);
  };

  return (
    <div className="admin-page spare-parts-uploader-page">
      <div className="page-title">
        <div>
          <h1>Spare parts document uploader</h1>
          <p>Import parts from Microsoft Word or Excel into a selected machine category.</p>
        </div>
      </div>

      {message && <p className="admin-notice" role="status">{message}</p>}

      <form className="admin-form-card spare-parts-uploader-form" onSubmit={submit}>
        <h2>Import spare parts</h2>
        <div className="form-group">
          <label htmlFor="spare-import-category">Main Spare Part Category *</label>
          <select
            id="spare-import-category"
            required
            value={categoryId}
            disabled={loadingCategories || uploading}
            onChange={(event) => {
              setCategoryId(event.target.value);
              setImported(null);
              setMessage("");
              autoImportKey.current = "";
            }}
          >
            <option value="">Select machine/category</option>
            {categories.map((category) => (
              <option key={category._id} value={category._id}>{category.name}</option>
            ))}
          </select>
        </div>

        <div className={`form-group ${!categoryId ? "sp-import-file-disabled" : ""}`}>
          <label htmlFor="spare-import-file">Word or Excel file *</label>
          <input
            id="spare-import-file"
            ref={fileInput}
            type="file"
            accept=".doc,.docx,.xls,.xlsx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            disabled={uploading}
            onChange={chooseFile}
            required
          />
          <small>
            {categoryId
              ? "Accepted: .doc, .docx, .xls, .xlsx · Maximum 10 MB. Excel files import automatically from the sheet matching the selected category."
              : "Select a main category and an Excel file will import automatically from its matching sheet."}
          </small>
          {file && <p className="sp-import-selected-file">Selected: {file.name} ({(file.size / 1024).toFixed(1)} KB)</p>}
        </div>

        <div className="sp-import-fields-hint">
          <span>Required column:</span><code>Part Name</code>
          <span>Recognized columns:</span>
          <code>Price</code><code>Stock</code><code>UOM</code>
        </div>
        <p className="sp-import-help">
          Excel sheets must be named after the selected category and use a header row with Part Name, Price, UOM, and Stock columns. Word files can contain a table with a header row or labeled fields such as “Part Name: …”.
        </p>
        <button className="primary-btn sp-import-submit-btn" type="submit" disabled={!categoryId || !file || uploading}>
          {uploading
            ? <><span className="sp-import-spinner" aria-hidden="true" /> Parsing and importing…</>
            : file && isExcelFile(file)
              ? "Import matching Excel sheet"
              : "Upload & import spare parts"}
        </button>
      </form>

      {imported?.products?.length > 0 && (
        <section className="admin-table-card sp-import-results">
          <div className="table-header">
            <h2>Imported spare parts</h2>
            <span>{imported.products.length}</span>
          </div>
          <div className="sp-import-category-link">
            Category: <Link to={`/spare-parts/${imported.category.slug}`}>{imported.category.name} — View all spare parts</Link>
          </div>
          <div className="table-wrapper">
            <table>
              <thead><tr><th>Part name</th><th>Price</th><th>Stock</th><th>UOM</th><th>Details</th></tr></thead>
              <tbody>
                {imported.products.map((product) => (
                  <tr key={product._id}>
                    <td><strong>{product.name}</strong></td>
                    <td>{product.price > 0 ? formatPrice(product.price) : "—"}</td>
                    <td>{product.stock ?? (product.inStock ? "Available" : "0")}</td>
                    <td>{product.uom || "—"}</td>
                    <td><Link to={`/spare-parts/${imported.category.slug}/${product.slug}`}>View details</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
