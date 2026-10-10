import { useEffect, useMemo, useState } from "react";
import { API, adminFetch } from "../spareApi";
import "./AdminPages.css";
import "./QuoteRequests.css";

const statusNames = {
  new: "New",
  in_progress: "In progress",
  quoted: "Quoted",
  closed: "Closed",
};

const formatDate = (value) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "—"
    : new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }).format(date);
};

export default function QuoteRequests() {
  const [requests, setRequests] = useState([]);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState("");

  const loadRequests = async (signal) => {
    setLoading(true);
    setError("");
    try {
      const response = await adminFetch(`${API}/api/quotes`, { signal });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Unable to load quote requests.");
      if (!Array.isArray(data)) throw new Error("The server returned invalid quote request data.");
      setRequests(data);
    } catch (loadError) {
      if (loadError.name !== "AbortError") setError(loadError.message);
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    loadRequests(controller.signal);
    return () => controller.abort();
  }, []);

  const visibleRequests = useMemo(() => {
    const query = search.trim().toLowerCase();
    return requests.filter((request) => {
      if (filter !== "all" && request.status !== filter) return false;
      const searchable = [
        request.company, request.contactName, request.email, request.phone,
        request.city, request.state, request.quoteType, request.machineType,
        request.model, request.message,
        ...(request.parts || []).flatMap((part) => [
          part.machine, part.machineCategory, part.machineName, part.partName, part.itemCode,
        ]),
      ];
      return !query || searchable.some((value) => String(value || "").toLowerCase().includes(query));
    });
  }, [requests, filter, search]);

  const updateStatus = async (requestId, status) => {
    setUpdatingId(requestId);
    setError("");
    try {
      const response = await adminFetch(`${API}/api/quotes/${requestId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Unable to update request status.");
      setRequests((current) => current.map((request) =>
        request._id === requestId ? result.request : request
      ));
    } catch (updateError) {
      setError(updateError.message);
    } finally {
      setUpdatingId("");
    }
  };

  const newCount = requests.filter((request) => request.status === "new").length;

  return (
    <div className="admin-page quote-requests-page">
      <div className="page-title quote-requests-title">
        <div>
          <h1>Quote requests</h1>
          <p>Review machine and spare-part quote submissions from your customers.</p>
        </div>
        <button type="button" className="primary-btn" onClick={() => loadRequests()} disabled={loading}>
          {loading ? "Refreshing…" : "Refresh"}
        </button>
      </div>

      <div className="quote-request-summary">
        <div><span>Total requests</span><strong>{loading ? "…" : requests.length}</strong></div>
        <div><span>New requests</span><strong>{loading ? "…" : newCount}</strong></div>
      </div>

      {error && <div className="quote-request-error" role="alert">{error}</div>}

      <section className="admin-table-card quote-request-list">
        <div className="table-header">
          <h2>Request inbox</h2>
          <span>{visibleRequests.length} of {requests.length}</span>
        </div>
        <div className="quote-request-filters">
          <label className="form-group">
            <span>Search requests</span>
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Company, contact, machine, part, email…"
            />
          </label>
          <label className="form-group">
            <span>Status</span>
            <select value={filter} onChange={(event) => setFilter(event.target.value)}>
              <option value="all">All statuses</option>
              {Object.entries(statusNames).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </label>
        </div>

        {loading && requests.length === 0 ? (
          <p className="quote-request-state">Loading quote requests…</p>
        ) : !visibleRequests.length ? (
          <p className="quote-request-state">{requests.length ? "No requests match these filters." : "No quote requests have been received yet."}</p>
        ) : (
          <div className="quote-request-cards">
            {visibleRequests.map((request) => (
              <article className="quote-request-card" key={request._id}>
                <header className="quote-request-card-head">
                  <div>
                    <span className={`quote-kind-badge quote-kind-${request.quoteType}`}>
                      {request.quoteType === "machine" ? "Machine quote" : "Spare part quote"}
                    </span>
                    <h3>{request.company}</h3>
                    <p>{request.contactName} · {formatDate(request.createdAt)}</p>
                  </div>
                  <label className="quote-status-control">
                    <span>Status</span>
                    <select
                      aria-label={`Status for ${request.company}`}
                      value={request.status}
                      disabled={updatingId === request._id}
                      onChange={(event) => updateStatus(request._id, event.target.value)}
                    >
                      {Object.entries(statusNames).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                    </select>
                  </label>
                </header>

                <div className="quote-request-contact">
                  <a href={`mailto:${request.email}`}>{request.email}</a>
                  <a href={`tel:${request.phone}`}>{request.phone}</a>
                  <span>{[request.city, request.state].filter(Boolean).join(", ")}</span>
                </div>

                {request.quoteType === "machine" ? (
                  <div className="quote-request-details">
                    <strong>{request.machineType} · {request.model}</strong>
                    <span>Quantity: {request.quantity}</span>
                    {request.specifications && <p>{request.specifications}</p>}
                  </div>
                ) : (
                  <div className="quote-request-parts">
                    {(request.parts || []).map((part, index) => (
                      <div className="quote-request-part" key={`${request._id}-${index}`}>
                        <strong>{part.partName} <small>× {part.quantity}</small></strong>
                        <span>{part.machine || [part.machineCategory, part.machineName].filter(Boolean).join(" · ")}</span>
                        {part.itemCode && <code>{part.itemCode}</code>}
                      </div>
                    ))}
                  </div>
                )}

                {request.message && <p className="quote-request-message">{request.message}</p>}
                <footer className="quote-request-card-foot">
                  {request.attachment?.url ? (
                    <a href={request.attachment.url} target="_blank" rel="noreferrer">
                      View attachment: {request.attachment.name || "Attached file"}
                    </a>
                  ) : <span>No attachment</span>}
                  <span className={`quote-email-status quote-email-status-${request.notificationStatus || "pending"}`}>
                    Email {request.notificationStatus || "pending"}
                  </span>
                </footer>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}