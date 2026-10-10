import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import "./Contact.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const INITIAL_FORM = {
  fullName: "",
  phone: "",
  email: "",
  productInterest: "",
  message: "",
};

export default function Contact() {
  const location = useLocation();
  const [form, setForm] = useState(INITIAL_FORM);
  const [status, setStatus] = useState({ state: "idle", message: "" });

  useEffect(() => {
    const prefill = location.state?.enquiryPrefill;
    if (!prefill) return;
    setForm((current) => ({
      ...current,
      productInterest: prefill.productInterest || current.productInterest,
      message: prefill.message || current.message,
    }));
  }, [location.state]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ state: "loading", message: "" });

    try {
      const res = await fetch(`${API_URL}/api/inquiries`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Something went wrong.");
      }

      setStatus({
        state: "success",
        message: "Thanks — your inquiry has been received. We'll be in touch soon.",
      });
      setForm(INITIAL_FORM);
    } catch (err) {
      setStatus({ state: "error", message: err.message });
    }
  };

  return (
    <section id="contact" className="contact-section">
      <div className="contact__container">
        {/* Header Intro */}
        <div className="contact__header">
          <span className="contact__badge">Quick Enquiry</span>
          <h2 className="contact__title">Let's Talk About Your Needs</h2>
          <p className="contact__subtitle">
            Send us your enquiry and our experts will reply to you very soon with the right
            packaging solution for your business.
          </p>
        </div>

        {/* Content Layout Grid */}
        <div className="contact__grid">
          {/* Left Column: Info Cards & Hours */}
          <div className="contact__info-list">
            {/* Address Card */}
            <div className="contact__card">
              <div className="contact__card-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                  <circle cx="12" cy="10" r="3"></circle>
                </svg>
              </div>
              <div className="contact__card-content">
                <span className="contact__card-label">ADDRESS</span>
                <p className="contact__card-text">
                  Office No. 2, Behind Shiv Shakti Oil Meal, Thada - Trehan Road, Alwar Road, Bhiwadi, Rajasthan - 301018, India
                </p>
              </div>
            </div>

            {/* Phone Card */}
            <div className="contact__card">
              <div className="contact__card-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                </svg>
              </div>
              <div className="contact__card-content">
                <span className="contact__card-label">PHONE</span>
                <p className="contact__card-text">09215521314, 07232001235, 9991226074</p>
              </div>
            </div>

            {/* Email Card */}
            <div className="contact__card">
              <div className="contact__card-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                  <polyline points="22,6 12,13 2,6"></polyline>
                </svg>
              </div>
              <div className="contact__card-content">
                <span className="contact__card-label">EMAIL</span>
                <p className="contact__card-text">info@unipackauto.in<br />uniquepackagingandautomation@gmail.com<br />services.upa@gmail.com</p>
              </div>
            </div>

            {/* Business Hours Card */}
            <div className="contact__card contact__card--accent">
              <h3 className="contact__hours-title">Business Hours</h3>
              <div className="contact__hours-row">
                <span>Mon - Sat</span>
                <span>9:00 AM - 7:00 PM</span>
              </div>
              <div className="contact__hours-row">
                <span>Sunday</span>
                <span>Closed</span>
              </div>
            </div>
          </div>

          {/* Right Column: Form Card */}
          <div className="contact__form-card">
            <form onSubmit={handleSubmit} className="contact__form">
              <div className="contact__form-row">
                <div className="contact__field">
                  <label>Full Name <span className="contact__required">*</span></label>
                  <input
                    type="text"
                    name="fullName"
                    required
                    placeholder=""
                    value={form.fullName}
                    onChange={handleChange}
                  />
                </div>

                <div className="contact__field">
                  <label>Phone Number <span className="contact__required">*</span></label>
                  <input
                    type="tel"
                    name="phone"
                    required
                    placeholder="+91 99999 99999"
                    value={form.phone}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="contact__field">
                <label>Email Address <span className="contact__required">*</span></label>
                <input
                  type="email"
                  name="email"
                  required
                  placeholder=""
                  value={form.email}
                  onChange={handleChange}
                />
              </div>

              <div className="contact__field">
                <label>Product of Interest</label>
                <input
                  type="text"
                  name="productInterest"
                  placeholder="e.g. Strapping Machine, Vacuum Packaging..."
                  value={form.productInterest}
                  onChange={handleChange}
                />
              </div>

              <div className="contact__field">
                <label>Your Message</label>
                <textarea
                  name="message"
                  rows="4"
                  placeholder="Tell us about your requirements..."
                  value={form.message}
                  onChange={handleChange}
                />
              </div>

              <button
                type="submit"
                className="contact__submit-btn"
                disabled={status.state === "loading"}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13"></line>
                  <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                </svg>
                {status.state === "loading" ? "Sending..." : "Send Enquiry"}
              </button>

              {status.state === "success" && (
                <p className="contact__status contact__status--success">{status.message}</p>
              )}
              {status.state === "error" && (
                <p className="contact__status contact__status--error">{status.message}</p>
              )}
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}