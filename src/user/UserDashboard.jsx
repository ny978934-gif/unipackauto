import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { API, setUserToken, userFetch } from "../spareApi";
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
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [section, setSection] = useState("quotes");
  const [quotes, setQuotes] = useState([]);
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [loaded, setLoaded] = useState({ quotes: false, inquiries: false });
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [passwordNotice, setPasswordNotice] = useState("");

  const loadSection = useCallback(async (target) => {
    if (loaded[target]) return;
    setLoading(true);
    setError("");
    try {
      const endpoint = target === "quotes" ? "me/quotes" : "me/inquiries";
      const response = await userFetch(`${API}/api/users/${endpoint}`);
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
    logout();
    navigate("/user/login", { replace: true });
  };

  const changePassword = async (event) => {
    event.preventDefault();
    setError("");
    setPasswordNotice("");
    if (newPassword !== confirmation) {
      setError("New password and confirmation do not match.");
      return;
    }
    try {
      const response = await userFetch(`${API}/api/users/me/password`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Could not change your password.");
      setUserToken(data.token);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmation("");
      setPasswordNotice(data.message);
    } catch (passwordError) {
      setError(passwordError.message || "Could not change your password.");
    }
  };

  return (
    <div className="user-dashboard">
      <aside className="user-dashboard-sidebar">
        <div className="user-dashboard-brand">UNIPACKAUTO</div>
        <nav aria-label="User dashboard">
          <button className={section === "quotes" ? "active" : ""} type="button" onClick={() => setSection("quotes")}>Quotes</button>
          <button className={section === "inquiries" ? "active" : ""} type="button" onClick={() => setSection("inquiries")}>Contact Queries</button>
          <button className={section === "password" ? "active" : ""} type="button" onClick={() => setSection("password")}>Change Password</button>
          <button type="button" onClick={signOut}>Logout</button>
        </nav>
      </aside>

      <section className="user-dashboard-main">
        <header className="user-dashboard-header">
          <div>
            <span className="user-dashboard-eyebrow">CUSTOMER PORTAL</span>
            <h1>{section === "quotes" ? "Quotes" : section === "inquiries" ? "Contact Queries" : "Change Password"}</h1>
          </div>
          <div className="user-dashboard-identity">
            <strong>{user?.name}</strong>
            <span>{user?.userId}</span>
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

        {section === "password" && (
          <section className="user-dashboard-content user-password-content">
            <h2>Change your password</h2>
            <p>Use a password of at least 12 characters. Passwords are securely hashed.</p>
            {passwordNotice && <div className="user-dashboard-success" role="status">{passwordNotice}</div>}
            <form onSubmit={changePassword}>
              <label>
                Current password
                <input type="password" autoComplete="current-password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} maxLength="1024" required />
              </label>
              <label>
                New password
                <input type="password" autoComplete="new-password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} minLength="12" maxLength="72" required />
              </label>
              <label>
                Confirm new password
                <input type="password" autoComplete="new-password" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} minLength="12" maxLength="72" required />
              </label>
              <button type="submit">Update password</button>
            </form>
          </section>
        )}
      </section>
    </div>
  );
}
