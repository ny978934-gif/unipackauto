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

const moneyPaise = (value) => new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
}).format((Number(value) || 0) / 100);

const quotationPreview = (request, draft) => {
  const grossPaise = request.quotation?.grossTotalCents;
  if (!Number.isSafeInteger(grossPaise)) return null;
  const value = Number(draft.discountValue);
  if (!Number.isFinite(value) || value < 0) return null;
  let discountPaise = 0;
  if (draft.discountType === "percentage") {
    const basisPoints = BigInt(Math.round(value * 100));
    discountPaise = Number((BigInt(grossPaise) * basisPoints + 5000n) / 10000n);
  } else if (draft.discountType === "fixed") {
    discountPaise = Math.round(value * 100);
  }
  if (!Number.isSafeInteger(discountPaise) || discountPaise > grossPaise) return null;
  return {
    subtotal: request.quotation.subtotalCents,
    gst: request.quotation.gstCents,
    gross: grossPaise,
    discount: discountPaise,
    final: grossPaise - discountPaise,
  };
};

export default function QuoteRequests() {
  const [requests, setRequests] = useState([]);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState("");
  const [discountDrafts, setDiscountDrafts] = useState({});
  const [discountNotices, setDiscountNotices] = useState({});

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

  const getDiscountDraft = (request) => ({
    discountType: request.quotation?.discountType || "none",
    discountValue: String(request.quotation?.discountValue || 0),
    ...discountDrafts[request._id],
  });

  const updateDiscountDraft = (requestId, field, value) => {
    setDiscountDrafts((current) => ({
      ...current,
      [requestId]: { ...current[requestId], [field]: value },
    }));
    setDiscountNotices((current) => ({ ...current, [requestId]: "" }));
  };

  const saveDiscount = async (request) => {
    const draft = getDiscountDraft(request);
    setUpdatingId(request._id);
    setError("");
    setDiscountNotices((current) => ({ ...current, [request._id]: "" }));
    try {
      const response = await adminFetch(`${API}/api/quotes/${request._id}/discount`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          discountType: draft.discountType,
          discountValue: Number(draft.discountValue),
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Unable to update the quotation discount.");
      setRequests((current) => current.map((item) =>
        item._id === request._id ? result.request : item
      ));
      setDiscountDrafts((current) => ({
        ...current,
        [request._id]: {
          discountType: result.request.quotation.discountType,
          discountValue: String(result.request.quotation.discountValue),
        },
      }));
      setDiscountNotices((current) => ({
        ...current,
        [request._id]: result.notificationSent
          ? "Discount saved and updated quotation emailed to the customer."
          : `Discount saved, but email delivery failed. ${result.notificationError || ""}`,
      }));
    } catch (updateError) {
      setError(updateError.message);
    } finally {
      setUpdatingId("");
    }
  };

  const downloadQuotation = async (request) => {
    setUpdatingId(request._id);
    setError("");
    try {
      const response = await adminFetch(`${API}/api/quotes/${request._id}/pdf`);
      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.message || "Unable to download the quotation PDF.");
      }
      const objectUrl = URL.createObjectURL(await response.blob());
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = `${request.quotation?.number || "quotation"}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
    } catch (downloadError) {
      setError(downloadError.message);
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
          <p>Review spare-part requests and previously received machine quote requests.</p>
        </div>
        <div className="quote-request-header-actions">
          <button type="button" className="primary-btn" onClick={() => loadRequests()} disabled={loading}>
            {loading ? "Refreshing…" : "Refresh"}
          </button>
        </div>
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
                    {request.notificationStatus === "sent" ? "SMTP accepted email" : `Email ${request.notificationStatus || "pending"}`}
                  </span>
                </footer>
                {request.quoteType === "sparePart" && (
                  <section className="quote-discount-panel" aria-label={`Quotation discount for ${request.company}`}>
                    <h4>Quotation discount</h4>
                    <div className="quote-discount-controls">
                      <label>
                        <span>Discount type</span>
                        <select
                          value={getDiscountDraft(request).discountType}
                          disabled={updatingId === request._id}
                          onChange={(event) => {
                            const nextType = event.target.value;
                            updateDiscountDraft(request._id, "discountType", nextType);
                            if (nextType === "none") updateDiscountDraft(request._id, "discountValue", "0");
                          }}
                        >
                          <option value="none">No discount</option>
                          <option value="percentage">Percentage</option>
                          <option value="fixed">Fixed amount (₹)</option>
                        </select>
                      </label>
                      <label>
                        <span>{getDiscountDraft(request).discountType === "percentage" ? "Discount (%)" : "Discount amount (₹)"}</span>
                        <input
                          type="number"
                          min="0"
                          max={getDiscountDraft(request).discountType === "percentage" ? "100" : undefined}
                          step="0.01"
                          value={getDiscountDraft(request).discountValue}
                          disabled={updatingId === request._id || getDiscountDraft(request).discountType === "none"}
                          onChange={(event) => updateDiscountDraft(request._id, "discountValue", event.target.value)}
                        />
                      </label>
                    </div>
                    {(() => {
                      const preview = quotationPreview(request, getDiscountDraft(request));
                      return preview ? (
                        <dl className="quote-discount-totals">
                          <div><dt>Subtotal</dt><dd>{moneyPaise(preview.subtotal)}</dd></div>
                          <div><dt>GST (18%)</dt><dd>{moneyPaise(preview.gst)}</dd></div>
                          <div><dt>Total including GST</dt><dd>{moneyPaise(preview.gross)}</dd></div>
                          <div><dt>Discount</dt><dd>−{moneyPaise(preview.discount)}</dd></div>
                          <div className="quote-discount-final"><dt>Final amount due</dt><dd>{moneyPaise(preview.final)}</dd></div>
                        </dl>
                      ) : <p className="quote-request-message">Quotation pricing will be calculated when you save.</p>;
                    })()}
                    <div className="quote-discount-actions">
                      <button
                        type="button"
                        className="primary-btn"
                        disabled={updatingId === request._id}
                        onClick={() => saveDiscount(request)}
                      >
                        {updatingId === request._id ? "Saving…" : "Save discount & email"}
                      </button>
                      <button
                        type="button"
                        className="secondary-btn"
                        disabled={updatingId === request._id}
                        onClick={() => downloadQuotation(request)}
                      >
                        Download PDF
                      </button>
                    </div>
                    {discountNotices[request._id] && (
                      <p className="quote-request-success" role="status">{discountNotices[request._id]}</p>
                    )}
                  </section>
                )}
                {request.notificationStatus === "failed" && request.notificationError && (
                  <p className="quote-request-email-error" role="note">{request.notificationError}</p>
                )}
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}