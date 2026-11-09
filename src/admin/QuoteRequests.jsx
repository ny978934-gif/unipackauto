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

const quotationPreview = (request, discountValues) => {
  const savedItems = request.quotation?.items;
  if (!Array.isArray(savedItems) || savedItems.length !== discountValues.length) return null;
  let subtotal = 0;
  const items = savedItems.map((item, index) => {
    const discountPercentage = Number(discountValues[index]);
    const lineTotal = item.unitPricePaise * item.quantity;
    if (!Number.isSafeInteger(lineTotal) || !Number.isFinite(discountPercentage) ||
        discountPercentage < 0 || discountPercentage > 100) return null;
    const basisPoints = BigInt(Math.round(discountPercentage * 100));
    const discount = Number((BigInt(lineTotal) * basisPoints + 5000n) / 10000n);
    const netTotal = lineTotal - discount;
    subtotal += netTotal;
    return {
      discountPercentage: Math.round(discountPercentage * 100) / 100,
      lineTotal,
      discount,
      netTotal,
    };
  });
  if (items.some((item) => !item) || !Number.isSafeInteger(subtotal)) return null;
  const gst = Number((BigInt(subtotal) * 18n + 50n) / 100n);
  const final = subtotal + gst;
  if (!Number.isSafeInteger(final)) return null;
  return {
    items,
    subtotal,
    gst,
    final,
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
  const [quotationNotices, setQuotationNotices] = useState({});
  const [users, setUsers] = useState([]);

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
    loadRequests(controller.signal);
    loadUsers(controller.signal);
    return () => controller.abort();
  }, []);

  const assignRequest = async (requestId, assignedUserId) => {
    setUpdatingId(requestId);
    setError("");
    try {
      const response = await adminFetch(`${API}/api/quotes/${requestId}/assign`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assignedUserId: assignedUserId || null }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Unable to assign this quote.");
      setRequests((current) => current.map((request) =>
        request._id === requestId ? result.request : request
      ));
    } catch (assignError) {
      setError(assignError.message);
    } finally {
      setUpdatingId("");
    }
  };

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
        request._id === requestId
          ? { ...result.request, assignedUser: request.assignedUser }
          : request
      ));
    } catch (updateError) {
      setError(updateError.message);
    } finally {
      setUpdatingId("");
    }
  };

  const getDiscountDraft = (request) => request.parts.map((_part, index) =>
    String(
      discountDrafts[request._id]?.[index] ??
      request.quotation?.items?.[index]?.discountPercentage ??
      0
    )
  );

  const updateDiscountDraft = (requestId, index, value) => {
    setDiscountDrafts((current) => ({
      ...current,
      [requestId]: {
        ...current[requestId],
        [index]: value,
      },
    }));
    setQuotationNotices((current) => ({ ...current, [requestId]: "" }));
  };

  const saveQuotation = async (request) => {
    const discountDraft = getDiscountDraft(request);
    const discountPercentages = discountDraft.map((value) => Number(value));
    if (discountDraft.some((value) => !value.trim()) ||
        discountPercentages.some((value) => !Number.isFinite(value) || value < 0 || value > 100)) {
      setError("Enter a discount percentage from 0 to 100 for every spare part.");
      return;
    }
    setUpdatingId(request._id);
    setError("");
    setQuotationNotices((current) => ({ ...current, [request._id]: "" }));
    try {
      const response = await adminFetch(`${API}/api/quotes/${request._id}/quotation`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ discountPercentages }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Unable to save the quotation.");
      setRequests((current) => current.map((item) =>
        item._id === request._id
          ? { ...result.request, assignedUser: item.assignedUser }
          : item
      ));
      setDiscountDrafts((current) => ({
        ...current,
        [request._id]: Object.fromEntries(
          result.request.quotation.items.map((item, index) => [
            index,
            String(item.discountPercentage),
          ])
        ),
      }));
      setQuotationNotices((current) => ({
        ...current,
        [request._id]: result.alreadySent
          ? "This quotation was already emailed with these item discounts; no duplicate email was sent."
          : result.notificationSent
          ? request.quotation?.sentAt
            ? "Item discounts saved and revised quotation emailed to the owner and customer."
            : "Quotation finalized and emailed to the owner and customer."
          : `${request.quotation?.sentAt ? "Revised quotation" : "Quotation"} saved, but email delivery failed. ${result.notificationError || ""}`,
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

                <label className="quote-status-control quote-assignment-control">
                  <span>Assigned user</span>
                  <select
                    aria-label={`Assign quote for ${request.company}`}
                    value={typeof request.assignedUser === "string"
                      ? request.assignedUser
                      : request.assignedUser?._id || ""}
                    disabled={updatingId === request._id}
                    onChange={(event) => assignRequest(request._id, event.target.value)}
                  >
                    <option value="">Unassigned</option>
                    {request.assignedUser?._id &&
                      !users.some((user) => user._id === request.assignedUser._id) && (
                        <option value={request.assignedUser._id} disabled>
                          {request.assignedUser.name || "Unavailable user"}
                        </option>
                      )}
                    {users.map((user) => (
                      <option key={user._id} value={user._id}>{user.name} · {user.userId}</option>
                    ))}
                  </select>
                </label>

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
                  <section className="quote-discount-panel" aria-label={`Quotation items for ${request.company}`}>
                    <h4>Quotation items &amp; discounts</h4>
                    {(() => {
                      const discounts = getDiscountDraft(request);
                      const preview = quotationPreview(request, discounts);
                      return (
                        <>
                          <div className="quote-discount-items">
                            {request.parts.map((part, index) => {
                              const item = preview?.items[index];
                              const savedItem = request.quotation?.items?.[index];
                              return (
                                <div className="quote-discount-item" key={`${request._id}-discount-${index}`}>
                                  <div className="quote-discount-item-details">
                                    <strong>{part.partName} <small>× {part.quantity}</small></strong>
                                    {savedItem && item && (
                                      <span>
                                        Unit price {moneyPaise(savedItem.unitPricePaise)} · Line total {moneyPaise(item?.lineTotal)} ·
                                        Discount {moneyPaise(item?.discount)} · Net {moneyPaise(item?.netTotal)}
                                      </span>
                                    )}
                                  </div>
                                  <label>
                                    <span>Discount (%)</span>
                                    <input
                                      type="number"
                                      min="0"
                                      max="100"
                                      step="0.01"
                                      value={discounts[index]}
                                      disabled={updatingId === request._id}
                                      aria-label={`Discount percentage for ${part.partName}`}
                                      onChange={(event) => updateDiscountDraft(request._id, index, event.target.value)}
                                    />
                                  </label>
                                </div>
                              );
                            })}
                          </div>
                          {preview ? (
                            <dl className="quote-discount-totals">
                              <div><dt>Subtotal after item discounts</dt><dd>{moneyPaise(preview.subtotal)}</dd></div>
                              <div><dt>GST (18%)</dt><dd>{moneyPaise(preview.gst)}</dd></div>
                              <div className="quote-discount-final"><dt>Final amount including GST</dt><dd>{moneyPaise(preview.final)}</dd></div>
                            </dl>
                          ) : <p className="quote-request-message">Quotation pricing will be calculated when you save.</p>}
                        </>
                      );
                    })()}
                    <div className="quote-discount-actions">
                      <button
                        type="button"
                        className="primary-btn"
                        disabled={updatingId === request._id}
                        onClick={() => saveQuotation(request)}
                      >
                        {updatingId === request._id
                          ? "Finalizing…"
                          : request.quotation?.sentAt
                            ? "Save & email revised quotation"
                            : "Finalize & email customer"}
                      </button>
                      <button
                        type="button"
                        className="secondary-btn"
                        disabled={updatingId === request._id || !request.quotation?.sentAt}
                        onClick={() => downloadQuotation(request)}
                      >
                        Download admin PDF
                      </button>
                    </div>
                    {quotationNotices[request._id] && (
                      <p className="quote-request-success" role="status">{quotationNotices[request._id]}</p>
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