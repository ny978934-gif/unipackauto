import { useEffect, useState } from "react";
import { useLocation, useParams } from "react-router-dom";
import { API } from "../../spareApi";
import "./QuotationView.css";

export default function QuotationView() {
  const { quoteId } = useParams();
  const location = useLocation();
  const token = new URLSearchParams(location.hash.slice(1)).get("customer-token") || "";
  const [pdfUrl, setPdfUrl] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    let objectUrl = "";

    const loadPdf = async () => {
      setLoading(true);
      setError("");
      setPdfUrl("");
      if (!token) {
        setError("This quotation link is incomplete. Please use the link from your email.");
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(
          `${API}/api/quotes/public/${encodeURIComponent(quoteId)}/pdf`,
          {
            signal: controller.signal,
            referrerPolicy: "no-referrer",
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        if (!response.ok) {
          const result = await response.json().catch(() => ({}));
          throw new Error(result.message || "This quotation link is invalid or has expired.");
        }
        const pdf = await response.blob();
        if (pdf.type !== "application/pdf") throw new Error("The quotation PDF could not be loaded.");
        objectUrl = URL.createObjectURL(pdf);
        setPdfUrl(objectUrl);
      } catch (loadError) {
        if (loadError.name !== "AbortError") setError(loadError.message);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };

    loadPdf();
    return () => {
      controller.abort();
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [quoteId, token]);

  return (
    <section className="customer-quotation">
      <div className="customer-quotation-header">
        <div>
          <h1>Your quotation</h1>
          <p>View or download the latest quotation sent by Unipackauto.</p>
        </div>
        {pdfUrl && (
          <a className="customer-quotation-download" href={pdfUrl} download="unipackauto-quotation.pdf">
            Download PDF
          </a>
        )}
      </div>
      {loading && <p className="customer-quotation-state">Loading your quotation…</p>}
      {error && <p className="customer-quotation-error" role="alert">{error}</p>}
      {pdfUrl && (
        <iframe
          className="customer-quotation-frame"
          src={pdfUrl}
          title="Your Unipackauto quotation PDF"
        />
      )}
    </section>
  );
}
