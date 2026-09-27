const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

function formatPrice(price) {
  if (price === undefined || price === null || price === "") return "Price on request";

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(price);
}

function getProductUom(product) {
  return String(product?.uom ?? product?.UOM ?? product?.unitOfMeasure ?? product?.unit ?? "").trim();
}

async function readApiResponse(response, fallbackMessage) {
  const responseText = await response.text();
  let data;

  try {
    data = responseText ? JSON.parse(responseText) : {};
  } catch {
    const contentType = response.headers.get("content-type") || "";
    if (
      response.status === 404 ||
      contentType.includes("text/html") ||
      /^\s*<!doctype html/i.test(responseText)
    ) {
      throw new Error(
        "The backend returned a website page instead of API data. The spare-parts import API may not be deployed; deploy the latest server code and try again."
      );
    }
    throw new Error(fallbackMessage);
  }

  if (!response.ok) {
    throw new Error(data.message || fallbackMessage);
  }

  return data;
}

export { API, formatPrice, getProductUom, readApiResponse };