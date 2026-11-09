const API = import.meta.env.VITE_API_URL || "http://localhost:5000";
const ADMIN_TOKEN_KEY = "unipack-admin-token";
const USER_TOKEN_KEY = "unipack-user-token";

function getAdminToken() {
  return window.sessionStorage.getItem(ADMIN_TOKEN_KEY);
}

function setAdminToken(token) {
  window.sessionStorage.setItem(ADMIN_TOKEN_KEY, token);
}

function clearAdminToken() {
  window.sessionStorage.removeItem(ADMIN_TOKEN_KEY);
}

function getUserToken() {
  return window.localStorage.getItem(USER_TOKEN_KEY);
}

function setUserToken(token) {
  window.localStorage.setItem(USER_TOKEN_KEY, token);
}

function clearUserToken() {
  window.localStorage.removeItem(USER_TOKEN_KEY);
}

const authenticatedFetch = async (url, options, getToken, clearToken, eventName) => {
  const headers = new Headers(options.headers || {});
  const token = getToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);
  const response = await fetch(url, { ...options, headers });
  if (response.status === 401 && token) {
    clearToken();
    window.dispatchEvent(new Event(eventName));
  }
  return response;
};

function adminFetch(url, options = {}) {
  return authenticatedFetch(url, options, getAdminToken, clearAdminToken, "admin-auth-expired");
}

function userFetch(url, options = {}) {
  return authenticatedFetch(url, options, getUserToken, clearUserToken, "user-auth-expired");
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
  clearUserToken,
  formatPrice,
  getAdminToken,
  getProductUom,
  getUserToken,
  readApiResponse,
  setAdminToken,
  setUserToken,
  userFetch,
};
