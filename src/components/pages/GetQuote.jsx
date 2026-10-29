import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { API } from "../../spareApi";
import "./GetQuote.css";

const blankPart = () => ({
  machine: "",
  categorySlug: "",
  partId: "",
  partName: "",
  itemCode: "",
  quantity: "1",
});

const initialContact = {
  company: "",
  contactName: "",
  email: "",
  phone: "",
  city: "",
  state: "",
  message: "",
};

const acceptedFiles = ".pdf,.png,.jpg,.jpeg,.webp,.doc,.docx,.xls,.xlsx,.csv";

function Field({ label, name, value, onChange, required = false, ...props }) {
  return (
    <label className="quote-field">
      <span>{label}{required && <b aria-hidden="true"> *</b>}</span>
      <input name={name} value={value} onChange={onChange} required={required} {...props} />
    </label>
  );
}

export default function GetQuote() {
  const location = useLocation();
  const [contact, setContact] = useState(initialContact);
  const [parts, setParts] = useState([blankPart()]);
  const [attachment, setAttachment] = useState(null);
  const [status, setStatus] = useState({ state: "idle", message: "" });
  const [spareCategories, setSpareCategories] = useState([]);
  const [sparePartsByCategory, setSparePartsByCategory] = useState({});
  const formRef = useRef(null);

  useEffect(() => {
    const controller = new AbortController();
    fetch(`${API}/api/spare/categories?type=sparepart`, { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error("Quote categories could not be loaded.");
        const data = await response.json();
        if (Array.isArray(data)) setSpareCategories(data);
      })
      .catch((error) => {
        if (error.name !== "AbortError") console.error("Unable to load quote categories:", error);
      });
    return () => controller.abort();
  }, []);

  const selectedCategorySlugs = [...new Set(parts.map((part) => part.categorySlug).filter(Boolean))].join(",");

  useEffect(() => {
    if (!selectedCategorySlugs) return undefined;
    const controller = new AbortController();
    const slugs = selectedCategorySlugs.split(",").filter(
      (slug) => !Object.prototype.hasOwnProperty.call(sparePartsByCategory, slug)
    );
    if (!slugs.length) return undefined;

    Promise.all(slugs.map(async (slug) => {
      try {
        const response = await fetch(
          `${API}/api/products?category=${encodeURIComponent(slug)}&type=sparepart`,
          { signal: controller.signal }
        );
        if (!response.ok) throw new Error(`Spare parts could not be loaded for ${slug}.`);
        const products = await response.json();
        return [slug, Array.isArray(products) ? products : []];
      } catch (error) {
        if (controller.signal.aborted) throw error;
        console.error(`Unable to load spare parts for ${slug}:`, error);
        return [slug, null];
      }
    }))
      .then((entries) => {
        setSparePartsByCategory((current) => ({ ...current, ...Object.fromEntries(entries) }));
      })
      .catch((error) => {
        if (error.name !== "AbortError") console.error("Unable to load category spare parts:", error);
      });
    return () => controller.abort();
  }, [selectedCategorySlugs, sparePartsByCategory]);

  useEffect(() => {
    const prefill = location.state?.quotePrefill;
    if (!prefill) return;

    const prefilledParts = Array.isArray(prefill.parts)
      ? prefill.parts
      : prefill.part
        ? [prefill.part]
        : [];

    if (prefilledParts.length > 0) {
      setParts((current) => {
        const incoming = prefilledParts.slice(0, 30).map((prefilledPart) => ({
          ...blankPart(),
          ...prefilledPart,
          quantity: String(
            Number(prefilledPart.quantity) > 0 ? prefilledPart.quantity : 1
          ),
          categorySlug: prefill.categorySlug || prefilledPart.categorySlug || "",
        }));
        const hasOnlyBlankPart = current.length === 1 && !current[0].partName;
        if (hasOnlyBlankPart) return incoming;

        const merged = [...current];
        incoming.forEach((part) => {
          const alreadyAdded = merged.some(
            (existing) => part.partId
              ? existing.partId === part.partId
              : existing.partName === part.partName && existing.itemCode === part.itemCode
          );
          if (!alreadyAdded && merged.length < 30) merged.push(part);
        });
        return merged;
      });
    }
  }, [location.state]);

  const updateContact = (event) => {
    setContact((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  const updatePart = (index, event) => {
    const { name, value } = event.target;
    setParts((current) => current.map((part, partIndex) => {
      if (partIndex !== index) return part;
      if (name === "categorySlug") {
        const category = spareCategories.find((item) => item.slug === value);
        return {
          ...part,
          categorySlug: value,
          machine: category?.name || "",
          partId: "",
          partName: "",
          itemCode: "",
        };
      }
      if (name === "partId") {
        const selectedPart = (sparePartsByCategory[part.categorySlug] || [])
          .find((item) => item._id === value);
        return {
          ...part,
          partId: value,
          partName: selectedPart?.name || "",
          itemCode: selectedPart?.partCode || "",
        };
      }
      return { ...part, [name]: value };
    }));
  };

  const retrySpareParts = (categorySlug) => {
    setSparePartsByCategory((current) => {
      const next = { ...current };
      delete next[categorySlug];
      return next;
    });
  };

  const submitQuote = async (event) => {
    event.preventDefault();
    setStatus({ state: "loading", message: "" });
    const formData = new FormData();
    formData.append("quoteType", "sparePart");
    Object.entries(contact).forEach(([key, value]) => formData.append(key, value));
    formData.append("parts", JSON.stringify(parts));
    if (attachment) formData.append("attachment", attachment);

    try {
      const response = await fetch(`${API}/api/quotes`, { method: "POST", body: formData });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Your quote request could not be sent.");
      setStatus({
        state: "success",
        message: result.notificationSent === false
          ? "Your quote request was saved. Email notification could not be delivered, but your request is safely recorded."
          : "Thank you. Your quote request has been received and our team will be in touch.",
      });
      setContact(initialContact);
      setParts([blankPart()]);
      setAttachment(null);
      formRef.current?.reset();
    } catch (error) {
      setStatus({ state: "error", message: error.message || "Your quote request could not be sent." });
    }
  };

  return (
    <section className="get-quote-page">
      <div className="get-quote-intro">
        <span className="get-quote-eyebrow">UNIPACKAUTO · QUOTE DESK</span>
        <h1>Get a quotation for spare parts.</h1>
        <p>Tell us which spare parts you need and our team will prepare a quotation for you.</p>
      </div>

      <div className="get-quote-shell">
        <aside className="get-quote-aside">
          <span className="quote-aside-mark" aria-hidden="true">U</span>
          <h2>Built around your requirement.</h2>
          <p>List the spare parts you need. You can attach a drawing, specification sheet, or reference image.</p>
          <div className="quote-aside-note">
            <strong>Need help?</strong>
            <a href="tel:+919215521314">+91 92155 21314</a>
            <a href="mailto:info@unipackauto.in">info@unipackauto.in</a>
          </div>
        </aside>

        <div className="get-quote-form-wrap">
          <form ref={formRef} className="get-quote-form" onSubmit={submitQuote}>
            <div className="quote-form-heading">
              <div>
                <span className="quote-form-kicker">START YOUR REQUEST</span>
                <h2>Request a spare parts quotation</h2>
              </div>
            </div>

            <section className="quote-details-section">
                <div className="quote-section-title">
                  <div><span>01</span><h3>Spare parts required</h3></div>
                  <p>Add one or more items to your request.</p>
                </div>
                <div className="quote-part-list">
                  {parts.map((part, index) => (
                    <fieldset className="quote-part-card" key={index}>
                      <legend>Part {String(index + 1).padStart(2, "0")}</legend>
                      {parts.length > 1 && (
                        <button
                          type="button"
                          className="quote-remove-part"
                          aria-label={`Remove part ${index + 1}`}
                          onClick={() => setParts((current) => current.filter((_, partIndex) => partIndex !== index))}
                        >
                          Remove
                        </button>
                      )}
                      <div className="quote-fields-grid">
                        <label className="quote-field quote-field-wide">
                          <span>Machine category / name <b>*</b></span>
                          <select
                            name="categorySlug"
                            value={part.categorySlug}
                            onChange={(event) => updatePart(index, event)}
                            required
                          >
                            <option value="">Select a machine category</option>
                            {spareCategories.map((category) => (
                              <option key={category._id || category.slug} value={category.slug}>
                                {category.name}
                              </option>
                            ))}
                          </select>
                        </label>
                        <label className="quote-field quote-field-wide">
                          <span>Spare part name <b>*</b></span>
                          <select
                            name="partId"
                            value={part.partId}
                            onChange={(event) => updatePart(index, event)}
                            disabled={!part.categorySlug || !Array.isArray(sparePartsByCategory[part.categorySlug])}
                            required
                          >
                            <option value="">
                              {!part.categorySlug
                                ? "Select a machine category first"
                                : sparePartsByCategory[part.categorySlug] === null
                                ? "Could not load spare parts"
                                : !sparePartsByCategory[part.categorySlug]
                                  ? "Loading spare parts…"
                                  : "Select a spare part"}
                            </option>
                            {(sparePartsByCategory[part.categorySlug] || []).map((sparePart) => (
                              <option key={sparePart._id} value={sparePart._id}>
                                {sparePart.name}{sparePart.partCode ? ` · ${sparePart.partCode}` : ""}
                              </option>
                            ))}
                          </select>
                          {part.categorySlug && sparePartsByCategory[part.categorySlug] === null && (
                            <button
                              className="quote-retry-parts"
                              type="button"
                              onClick={() => retrySpareParts(part.categorySlug)}
                            >
                              Retry loading spare parts
                            </button>
                          )}
                          {part.categorySlug && sparePartsByCategory[part.categorySlug]?.length === 0 && (
                            <small>No spare parts are listed in this category.</small>
                          )}
                        </label>
                        <Field label="Item code" name="itemCode" value={part.itemCode} onChange={(event) => updatePart(index, event)} placeholder="If known" />
                        <Field label="Quantity" name="quantity" type="number" min="1" max="100000" value={part.quantity} onChange={(event) => updatePart(index, event)} required />
                      </div>
                    </fieldset>
                  ))}
                </div>
                <button
                  type="button"
                  className="quote-add-part"
                  disabled={parts.length >= 30}
                  onClick={() => setParts((current) => current.length < 30 ? [...current, blankPart()] : current)}
                >
                  <span aria-hidden="true">+</span>
                  {parts.length >= 30 ? "Maximum 30 parts" : "Add Another Spare Part"}
                </button>
              </section>

            <section className="quote-details-section quote-contact-section">
              <div className="quote-section-title">
                <div><span>02</span><h3>Your contact details</h3></div>
                <p>We’ll use these details to follow up with your quote.</p>
              </div>
              <div className="quote-fields-grid">
                <Field label="Company name" name="company" value={contact.company} onChange={updateContact} placeholder="Your company" required />
                <Field label="Contact person name" name="contactName" value={contact.contactName} onChange={updateContact} placeholder="Full name" required />
                <Field label="Email address" name="email" type="email" value={contact.email} onChange={updateContact} placeholder="name@company.com" required />
                <Field label="Phone number" name="phone" type="tel" value={contact.phone} onChange={updateContact} placeholder="+91" required />
                <Field label="City" name="city" value={contact.city} onChange={updateContact} placeholder="City" required />
                <Field label="State" name="state" value={contact.state} onChange={updateContact} placeholder="State" required />
                <label className="quote-field quote-field-wide">
                  <span>Message</span>
                  <textarea name="message" rows="4" value={contact.message} onChange={updateContact} placeholder="Anything else we should know about your requirement?" />
                </label>
                <label className="quote-field quote-field-wide quote-file-field">
                  <span>Attach a file <small>(optional, up to 10 MB)</small></span>
                  <input
                    type="file"
                    name="attachment"
                    accept={acceptedFiles}
                    onChange={(event) => setAttachment(event.target.files?.[0] || null)}
                  />
                  <small>PDF, image, Word, Excel, or CSV</small>
                </label>
              </div>
            </section>

            {status.message && (
              <p className={`quote-form-status quote-form-status-${status.state}`} role={status.state === "error" ? "alert" : "status"}>
                {status.message}
              </p>
            )}
            <div className="quote-submit-row">
              <span>Fields marked * are required.</span>
              <button className="quote-submit-button" type="submit" disabled={status.state === "loading"}>
                {status.state === "loading" ? "Sending request…" : "Send quote request"}
                <span aria-hidden="true">→</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}