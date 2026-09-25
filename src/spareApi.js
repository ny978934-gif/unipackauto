const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

function formatPrice(price) {
  if (price === undefined || price === null || price === "") return "Price on request";

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(price);
}

export { API, formatPrice };