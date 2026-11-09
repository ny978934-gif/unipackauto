import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { API, portalFetch } from "../spareApi";
import { useAuth } from "../context/AuthContext";
import "./UserDashboard.css";

const formatDate = (value) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "—"
    : new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }).format(date);
};

const quoteStatus = {
  new: "Received",
  in_progress: "In progress",
  quoted: "Quoted",
  closed: "Closed",
};

export default function UserDashboard() {
  const { portalUser, portalLogout } = useAuth();
  const navigate = useNavigate();
  const [section, setSection] = useState("quotes");
  const [quotes, setQuotes] = useState([]);
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [loaded, setLoaded] = useState({ quotes: false, inquiries: false });

  const loadSection = useCallback(async (target) => {
    if (loaded[target]) return;
    setLoading(true);
    setError("");
    try {
      const endpoint = target === "quotes" ? "me/quotes" : "me/inquiries";
      const response = await portalFetch(`${API}/api/users/${endpoint}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || `Unable to load ${target}.`);
      if (target === "quotes") setQuotes(data.quotes);
      else setInquiries(data.inquiries);
      setLoaded((current) => ({ ...current, [target]: true }));
    } catch (loadError) {
      setError(loadError.message || `Unable to load ${target}.`);
    } finally {
      setLoading(false);
    }
  }, [loaded]);

  useEffect(() => {
    if (section === "quotes" || section === "inquiries") loadSection(section);
  }, [section, loadSection]);

  const signOut = () => {
    portalLogout();
    navigate("/admin/login", { replace: true });
  };

  return (
    <div className="user-dashboard">
      <aside className="user-dashboard-sidebar">
        <div className="user-dashboard-brand">UNIPACKAUTO</div>
        <nav aria-label="User dashboard">
          <button className={section === "quotes" ? "active" : ""} type="button" onClick={() => setSection("quotes")}>Quotes</button>
          <button className={section === "inquiries" ? "active" : ""} type="button" onClick={() => setSection("inquiries")}>Contact Queries</button>
          <button type="button" onClick={signOut}>Logout</button>
        </nav>
      </aside>

      <section className="user-dashboard-main">
        <header className="user-dashboard-header">
          <div>
            <span className="user-dashboard-eyebrow">CUSTOMER PORTAL</span>
            <h1>{section === "quotes" ? "Quotes" : "Contact Queries"}</h1>
          </div>
          <div className="user-dashboard-identity">
            <strong>{portalUser?.name}</strong>
            <span>{portalUser?.userId}</span>
          </div>
        </header>

        {error && <div className="user-dashboard-error" role="alert">{error}</div>}
        {section === "quotes" && (
          <section className="user-dashboard-content" aria-labelledby="user-quotes-heading">
            <h2 id="user-quotes-heading">Your quotes</h2>
            {loading ? <p className="user-dashboard-state">Loading your quotes…</p> : !quotes.length ? (
              <p className="user-dashboard-state">No quotes have been assigned to your account yet.</p>
            ) : (
              <div className="user-record-list">
                {quotes.map((quote) => (
                  <article className="user-record-card" key={quote._id}>
                    <header>
                      <div>
                        <span className="user-record-date">{formatDate(quote.createdAt)}</span>
                        <h3>{quote.company}</h3>
                      </div>
                      <span className={`user-record-status user-record-status-${quote.status}`}>
                        {quoteStatus[quote.status] || quote.status}
                      </span>
                    </header>
                    <p>{quote.quoteType === "sparePart"
                      ? `${quote.parts?.length || 0} spare-part item(s)`
                      : `${quote.machineType || "Machine quote"}${quote.model ? ` · ${quote.model}` : ""}`}</p>
                    {quote.parts?.length > 0 && (
                      <ul>{quote.parts.map((part, index) => (
                        <li key={`${quote._id}-${index}`}>{part.partName} × {part.quantity}</li>
                      ))}</ul>
                    )}
                    {quote.quotation?.number && <p>Quotation: {quote.quotation.number}</p>}
                    {quote.message && <p>{quote.message}</p>}
                  </article>
                ))}
              </div>
            )}
          </section>
        )}

        {section === "inquiries" && (
          <section className="user-dashboard-content" aria-labelledby="user-inquiries-heading">
            <h2 id="user-inquiries-heading">Your contact queries</h2>
            {loading ? <p className="user-dashboard-state">Loading your queries…</p> : !inquiries.length ? (
              <p className="user-dashboard-state">No contact queries have been assigned to your account yet.</p>
            ) : (
              <div className="user-record-list">
                {inquiries.map((inquiry) => (
                  <article className="user-record-card" key={inquiry._id}>
                    <header>
                      <div>
                        <span className="user-record-date">{formatDate(inquiry.createdAt)}</span>
                        <h3>{inquiry.machineInterest || "Contact query"}</h3>
                      </div>
                      <span className={`user-record-status user-record-status-${inquiry.status}`}>
                        {inquiry.status}
                      </span>
                    </header>
                    {inquiry.message && <p>{inquiry.message}</p>}
                    {inquiry.company && <p>{inquiry.company}</p>}
                  </article>
                ))}
              </div>
            )}
          </section>
        )}

      </section>
    </div>
  );
}
