import { useEffect, useMemo, useState } from "react";
import { API, adminFetch } from "../spareApi";
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
  const [users, setUsers] = useState([]);
  const [updatingId, setUpdatingId] = useState("");

  const loadInquiries = async (signal) => {
    setLoading(true);
    setError("");
    try {
      const response = await adminFetch(`${API}/api/inquiries`, { signal });
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

  const loadUsers = async (signal) => {
    try {
      const response = await adminFetch(`${API}/api/admin/users`, { signal });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Unable to load users for assignment.");
      if (!Array.isArray(data)) throw new Error("The server returned invalid user data.");
      setUsers(data.filter((user) => user.status === "active" && !user.deletedAt));
    } catch (loadError) {
      if (loadError.name !== "AbortError") setError(loadError.message);
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    loadInquiries(controller.signal);
    loadUsers(controller.signal);
    return () => controller.abort();
  }, []);

  const assignInquiry = async (inquiryId, assignedUserId) => {
    setUpdatingId(inquiryId);
    setError("");
    try {
      const response = await adminFetch(`${API}/api/inquiries/${inquiryId}/assign`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assignedUserId: assignedUserId || null }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Unable to assign this inquiry.");
      setInquiries((current) => current.map((inquiry) =>
        inquiry._id === inquiryId ? result.inquiry : inquiry
      ));
    } catch (assignError) {
      setError(assignError.message);
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
                  <th>Assigned user</th>
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
                    <td>
                      <select
                        aria-label={`Assign inquiry from ${inquiry.name || inquiry.email}`}
                        value={inquiry.assignedUser?._id || ""}
                        disabled={updatingId === inquiry._id}
                        onChange={(event) => assignInquiry(inquiry._id, event.target.value)}
                      >
                        <option value="">Unassigned</option>
                        {inquiry.assignedUser?._id &&
                          !users.some((user) => user._id === inquiry.assignedUser._id) && (
                            <option value={inquiry.assignedUser._id} disabled>
                              {inquiry.assignedUser.name || "Unavailable user"}
                            </option>
                          )}
                        {users.map((user) => (
                          <option key={user._id} value={user._id}>{user.name} · {user.userId}</option>
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