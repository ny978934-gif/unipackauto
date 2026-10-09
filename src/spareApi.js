const API = import.meta.env.VITE_API_URL || "http://localhost:5000";
const ADMIN_TOKEN_KEY = "unipack-admin-token";

function getAdminToken() {
  return window.sessionStorage.getItem(ADMIN_TOKEN_KEY);
}

function setAdminToken(token) {
  window.sessionStorage.setItem(ADMIN_TOKEN_KEY, token);
}

function clearAdminToken() {
  window.sessionStorage.removeItem(ADMIN_TOKEN_KEY);
}

async function adminFetch(url, options = {}) {
  const headers = new Headers(options.headers || {});
  const token = getAdminToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);
  const response = await fetch(url, { ...options, headers });
  if (response.status === 401 && token) {
    clearAdminToken();
    window.dispatchEvent(new Event("admin-auth-expired"));
  }
  return response;
}

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

export {
  API,
  adminFetch,
  clearAdminToken,
  formatPrice,
  getAdminToken,
  getProductUom,
  readApiResponse,
  setAdminToken,
};