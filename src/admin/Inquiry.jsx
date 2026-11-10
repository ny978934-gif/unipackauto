import { useCallback, useEffect, useMemo, useState } from "react";
import { API, adminFetch, portalFetch } from "../spareApi";
import "./AdminPages.css";
import "./Inquiry.css";

const statusLabels = {
  new: "New",
  contacted: "Contacted",
  closed: "Closed",
};

export default function Inquiry({ portal = false }) {
  const [inquiries, setInquiries] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState("");
  const inquiryFetch = portal ? portalFetch : adminFetch;
  const inquiryUrl = portal ? `${API}/api/users/me/inquiries` : `${API}/api/inquiries`;

  const loadInquiries = useCallback(async (signal) => {
    setLoading(true);
    setError("");
    try {
      const response = await inquiryFetch(inquiryUrl, { signal });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || data.message || "Unable to load inquiries.");
      }
      const loadedInquiries = portal ? data.inquiries : data;
      if (!Array.isArray(loadedInquiries)) throw new Error("The server returned invalid inquiry data.");
      setInquiries(loadedInquiries);
    } catch (loadError) {
      if (loadError.name !== "AbortError") setError(loadError.message);
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, [inquiryFetch, inquiryUrl, portal]);

  useEffect(() => {
    const controller = new AbortController();
    loadInquiries(controller.signal);
    return () => controller.abort();
  }, [loadInquiries]);

  useEffect(() => {
    const refreshVisibleInquiries = () => {
      if (document.visibilityState === "visible") loadInquiries();
    };
    const timer = window.setInterval(refreshVisibleInquiries, 15000);
    document.addEventListener("visibilitychange", refreshVisibleInquiries);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", refreshVisibleInquiries);
    };
  }, [loadInquiries]);

  const updateStatus = async (inquiryId, status) => {
    setUpdatingId(inquiryId);
    setError("");
    try {
      const response = await inquiryFetch(
        `${inquiryUrl}/${inquiryId}/status`,
        {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
        }
      );
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Unable to update inquiry status.");
      setInquiries((current) => current.map((inquiry) =>
        inquiry._id === inquiryId ? result.inquiry : inquiry
      ));
    } catch (updateError) {
      setError(updateError.message);
    } finally {
      setUpdatingId("");
    }
  };

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
          <h1>{portal ? "Contact inquiries" : "Customer inquiries"}</h1>
          <p>{portal
            ? "View and manage the shared contact inquiry inbox."
            : "View messages submitted through the website contact form."}</p>
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
                      <select
                        className={`inquiry-status inquiry-status-${inquiry.status || "new"}`}
                        aria-label={`Status for inquiry from ${inquiry.name || inquiry.email}`}
                        value={inquiry.status || "new"}
                        disabled={updatingId === inquiry._id}
                        onChange={(event) => updateStatus(inquiry._id, event.target.value)}
                      >
                        {Object.entries(statusLabels).map(([value, label]) => (
                          <option key={value} value={value}>{label}</option>
                        ))}
                      </select>
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