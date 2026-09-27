import { useEffect, useMemo, useState } from "react";
import { API } from "../spareApi";
import "./AdminPages.css";
import "./Inquiry.css";

const statusLabels = {
  new: "New",
  contacted: "Contacted",
  closed: "Closed",
};

export default function Inquiry() {
  const [inquiries, setInquiries] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadInquiries = async (signal) => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`${API}/api/inquiries`, { signal });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || data.message || "Unable to load inquiries.");
      }
      if (!Array.isArray(data)) throw new Error("The server returned invalid inquiry data.");
      setInquiries(data);
    } catch (loadError) {
      if (loadError.name !== "AbortError") setError(loadError.message);
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    loadInquiries(controller.signal);
    return () => controller.abort();
  }, []);

  const filteredInquiries = useMemo(() => {
    const query = search.trim().toLowerCase();
    return inquiries.filter((inquiry) => {
      const matchesStatus = statusFilter === "all" || inquiry.status === statusFilter;
      const matchesSearch = !query || [
        inquiry.name,
        inquiry.company,
        inquiry.email,
        inquiry.phone,
        inquiry.machineInterest,
        inquiry.message,
      ].some((value) => value?.toLowerCase().includes(query));
      return matchesStatus && matchesSearch;
    });
  }, [inquiries, search, statusFilter]);

  const formatDate = (value) => {
    if (!value) return "—";
    const date = new Date(value);
    return Number.isNaN(date.getTime())
      ? "—"
      : new Intl.DateTimeFormat("en-IN", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(date);
  };

  return (
    <div className="admin-page inquiry-page">
      <div className="page-title inquiry-page-title">
        <div>
          <h1>Customer inquiries</h1>
          <p>View messages submitted through the website contact form.</p>
        </div>
        <button
          type="button"
          className="primary-btn"
          onClick={() => loadInquiries()}
          disabled={loading}
        >
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      <div className="inquiry-summary">
        <div className="inquiry-summary-card">
          <span>Total inquiries</span>
          <strong>{loading ? "..." : inquiries.length}</strong>
        </div>
        <div className="inquiry-summary-card inquiry-summary-new">
          <span>New inquiries</span>
          <strong>{loading ? "..." : inquiries.filter((item) => item.status === "new").length}</strong>
        </div>
      </div>

      {error && (
        <div className="inquiry-error" role="alert">
          <span>{error}</span>
          <button type="button" className="edit-btn" onClick={() => loadInquiries()}>
            Try again
          </button>
        </div>
      )}

      <section className="admin-table-card inquiry-list">
        <div className="table-header">
          <h2>Inbox</h2>
          <span>{filteredInquiries.length} of {inquiries.length}</span>
        </div>
        <div className="inquiry-filters">
          <div className="form-group">
            <label htmlFor="inquiry-search">Search inquiries</label>
            <input
              id="inquiry-search"
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Name, company, email, phone, product, or message"
            />
          </div>
          <div className="form-group">
            <label htmlFor="inquiry-status">Status</label>
            <select id="inquiry-status" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
              <option value="all">All statuses</option>
              <option value="new">New</option>
              <option value="contacted">Contacted</option>
              <option value="closed">Closed</option>
            </select>
          </div>
        </div>

        {loading && !inquiries.length ? (
          <p className="inquiry-state">Loading inquiries from the database...</p>
        ) : !error && filteredInquiries.length === 0 ? (
          <p className="inquiry-state">
            {inquiries.length ? "No inquiries match your search or status filter." : "No inquiries have been received yet."}
          </p>
        ) : (
          <div className="table-wrapper">
            <table className="inquiry-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Customer</th>
                  <th>Contact</th>
                  <th>Interested in</th>
                  <th>Message</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredInquiries.map((inquiry) => (
                  <tr key={inquiry._id}>
                    <td className="inquiry-date">{formatDate(inquiry.createdAt)}</td>
                    <td>
                      <strong>{inquiry.name || "—"}</strong>
                      {inquiry.company && <small className="inquiry-company">{inquiry.company}</small>}
                    </td>
                    <td className="inquiry-contact">
                      {inquiry.email && <a href={`mailto:${inquiry.email}`}>{inquiry.email}</a>}
                      {inquiry.phone && <a href={`tel:${inquiry.phone}`}>{inquiry.phone}</a>}
                      {!inquiry.email && !inquiry.phone && "—"}
                    </td>
                    <td>{inquiry.machineInterest || "—"}</td>
                    <td className="inquiry-message">{inquiry.message || "—"}</td>
                    <td>
                      <span className={`inquiry-status inquiry-status-${inquiry.status || "new"}`}>
                        {statusLabels[inquiry.status] || statusLabels.new}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}