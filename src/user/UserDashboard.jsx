import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Inquiry from "../admin/Inquiry.jsx";
import QuoteRequests from "../admin/QuoteRequests.jsx";
import "./UserDashboard.css";

export default function UserDashboard() {
  const { portalUser, portalLogout } = useAuth();
  const navigate = useNavigate();
  const [section, setSection] = useState("quotes");

  const signOut = () => {
    portalLogout();
    navigate("/admin/login", { replace: true });
  };

  return (
    <div className="user-dashboard">
      <aside className="user-dashboard-sidebar">
        <div className="user-dashboard-brand">UNIPACKAUTO</div>
        <nav aria-label="User dashboard">
          <button
            className={section === "quotes" ? "active" : ""}
            type="button"
            onClick={() => setSection("quotes")}
          >
            Quotes
          </button>
          <button
            className={section === "inquiries" ? "active" : ""}
            type="button"
            onClick={() => setSection("inquiries")}
          >
            Contact Inquiries
          </button>
          <button type="button" onClick={signOut}>Logout</button>
        </nav>
      </aside>

      <section className="user-dashboard-main">
        <header className="user-dashboard-header">
          <div>
            <span className="user-dashboard-eyebrow">CUSTOMER PORTAL</span>
          </div>
          <div className="user-dashboard-identity">
            <strong>{portalUser?.name}</strong>
            <span>{portalUser?.userId}</span>
          </div>
        </header>

        {section === "quotes" && <QuoteRequests portal />}
        {section === "inquiries" && <Inquiry portal />}
      </section>
    </div>
  );
}
