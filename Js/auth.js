const AUTH_STORAGE_KEY = "moto_access_token";
const USER_STORAGE_KEY = "moto_user";
const ADMIN_ROLE = "ADMIN";
const JWT_ROLE_CLAIM = "http://schemas.microsoft.com/ws/2008/06/identity/claims/role";

const API_BASE_URL = "https://motomarketapi.azurewebsites.net";
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const CATEGORY_CODE_TO_SLUG = {
  VEHICLE: "motori",
  GEAR: "ekipirovka",
  PART: "chasti",
  ACCESSORY: "aksesoari"
};
const CATEGORY_SLUG_TO_CODE = Object.fromEntries(
  Object.entries(CATEGORY_CODE_TO_SLUG).map(([code, slug]) => [slug, code])
);

function normalizeRootPath(value, fallback = "/") {
  const normalized = String(value || "").trim();

  if (!normalized) {
    return fallback;
  }

  if (/^https?:\/\//i.test(normalized)) {
    return normalized;
  }

  return normalized.startsWith("/") ? normalized : `/${normalized.replace(/^\/+/, "")}`;
}

function buildOriginRelativeUrl(pathname, params = {}) {
  const nextUrl = new URL(normalizeRootPath(pathname), window.location.origin);

  Object.entries(params).forEach(([key, value]) => {
    if (value === null || value === undefined) {
      return;
    }

    const normalizedValue = String(value).trim();
    if (!normalizedValue) {
      return;
    }

    nextUrl.searchParams.set(key, normalizedValue);
  });

  return `${nextUrl.pathname}${nextUrl.search}${nextUrl.hash}`;
}

function shouldUseLegacyListingRoutes() {
  return true;
}

function normalizeEmail(value) {
  return String(value || "").trim().toLowerCase();
}

function isValidEmail(value) {
  return EMAIL_REGEX.test(normalizeEmail(value));
}

function buildPageUrl(pageName, params = {}) {
  const normalizedPage = String(pageName || "").trim() || "index.html";
  const nextUrl = /^https?:\/\//i.test(normalizedPage)
    ? new URL(normalizedPage)
    : new URL(normalizeRootPath(normalizedPage, "/index.html"), window.location.origin);

  Object.entries(params).forEach(([key, value]) => {
    if (value === null || value === undefined) {
      return;
    }

    const normalizedValue = String(value).trim();
    if (!normalizedValue) {
      return;
    }

    nextUrl.searchParams.set(key, normalizedValue);
  });

  return nextUrl.toString();
}

function getQueryParam(name, search = window.location.search) {
  return new URLSearchParams(search).get(name);
}

function getCategorySlugFromCode(code) {
  const normalizedCode = String(code || "").trim().toUpperCase();
  return CATEGORY_CODE_TO_SLUG[normalizedCode] || null;
}

function getCategoryCodeFromSlug(slug) {
  const normalizedSlug = String(slug || "").trim().toLowerCase();
  return CATEGORY_SLUG_TO_CODE[normalizedSlug] || null;
}

function buildCategoryUrl(categoryOrCode, options = {}) {
  const slug = getCategorySlugFromCode(categoryOrCode) || String(categoryOrCode || "").trim().toLowerCase();
  const shouldUseLegacy = options.forceLegacy === true
    || (options.forceSeo !== true && shouldUseLegacyListingRoutes());
  const path = slug
    ? (
      shouldUseLegacy
        ? buildOriginRelativeUrl("/", { category: slug })
        : buildOriginRelativeUrl(`/obiavi/${encodeURIComponent(slug)}`)
    )
    : "/";

  if (options.absolute) {
    return new URL(path, window.location.origin).toString();
  }

  return path;
}

function buildListingUrl(listingId, options = {}) {
  const normalizedId = String(listingId ?? "").trim();
  const shouldUseLegacy = options.forceLegacy === true
    || (options.forceSeo !== true && shouldUseLegacyListingRoutes());
  const path = normalizedId
    ? (
      shouldUseLegacy
        ? buildOriginRelativeUrl("/ListingDetails.html", { id: normalizedId })
        : buildOriginRelativeUrl(`/obiavi/${encodeURIComponent(normalizedId)}`)
    )
    : buildOriginRelativeUrl("/ListingDetails.html");

  if (options.absolute) {
    return new URL(path, window.location.origin).toString();
  }

  return path;
}

function buildLegacyListingUrl(listingId, options = {}) {
  const normalizedId = String(listingId ?? "").trim();
  const path = buildOriginRelativeUrl("/ListingDetails.html", normalizedId ? { id: normalizedId } : {});

  if (options.absolute) {
    return new URL(path, window.location.origin).toString();
  }

  return path;
}

function buildShareUrl(listingId, options = {}) {
  const normalizedId = String(listingId ?? "").trim();
  const path = normalizedId
    ? `${API_BASE_URL.replace(/\/+$/, "")}/api/listings/${encodeURIComponent(normalizedId)}/og`
    : buildOriginRelativeUrl("/");

  if (options.absolute && !/^https?:\/\//i.test(path)) {
    return new URL(path, window.location.origin).toString();
  }

  return path;
}

function getListingIdFromLocation(target = window.location) {
  const url = typeof target === "string"
    ? new URL(target, window.location.origin)
    : new URL(`${target.pathname || "/"}${target.search || ""}`, window.location.origin);

  const queryId = Number(url.searchParams.get("id") || 0);
  if (Number.isFinite(queryId) && queryId > 0) {
    return queryId;
  }

  const match = url.pathname.match(/\/(?:obiavi|share)\/(\d+)(?:\/)?$/i);
  if (!match) {
    return null;
  }

  const pathId = Number(match[1] || 0);
  return Number.isFinite(pathId) && pathId > 0 ? pathId : null;
}

async function readApiMessage(response, fallbackMessage) {
  try {
    const data = await response.json();

    if (typeof data === "string" && data.trim()) {
      return data;
    }

    if (typeof data?.message === "string" && data.message.trim()) {
      return data.message;
    }

    if (typeof data?.title === "string" && data.title.trim()) {
      return data.title;
    }

    if (data?.errors && typeof data.errors === "object") {
      const firstError = Object.values(data.errors).flat()?.[0];
      if (typeof firstError === "string" && firstError.trim()) {
        return firstError;
      }
    }

    return fallbackMessage;
  } catch {
    return fallbackMessage;
  }
}

function setAccessToken(token) {
  if (!token) {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    return;
  }

  localStorage.setItem(AUTH_STORAGE_KEY, token);
}

function getAccessToken() {
  return localStorage.getItem(AUTH_STORAGE_KEY);
}

function clearAuthData() {
  localStorage.removeItem(AUTH_STORAGE_KEY);
  localStorage.removeItem(USER_STORAGE_KEY);
}

function setCurrentUser(user) {
  if (!user) {
    localStorage.removeItem(USER_STORAGE_KEY);
    return;
  }

  localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
}

function getCurrentUser() {
  const raw = localStorage.getItem(USER_STORAGE_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch {
    localStorage.removeItem(USER_STORAGE_KEY);
    return null;
  }
}

function decodeBase64Url(value) {
  if (!value) return null;

  try {
    const normalized = String(value)
      .replace(/-/g, "+")
      .replace(/_/g, "/")
      .padEnd(Math.ceil(String(value).length / 4) * 4, "=");

    const binary = atob(normalized);
    const bytes = Array.from(binary, (char) => `%${char.charCodeAt(0).toString(16).padStart(2, "0")}`).join("");
    return decodeURIComponent(bytes);
  } catch {
    return null;
  }
}

function parseJwtPayload(token = getAccessToken()) {
  if (!token) return null;

  try {
    const [, payload] = String(token).split(".");
    if (!payload) return null;

    const decoded = decodeBase64Url(payload);
    return decoded ? JSON.parse(decoded) : null;
  } catch {
    return null;
  }
}

function normalizeRoleName(value) {
  const normalized = String(value || "").trim().toUpperCase();
  return normalized || null;
}

function collectRoles(target, value) {
  if (value === null || value === undefined) {
    return;
  }

  if (Array.isArray(value)) {
    value.forEach((item) => collectRoles(target, item));
    return;
  }

  if (typeof value === "object") {
    collectRoles(target, value.role);
    collectRoles(target, value.name);
    collectRoles(target, value.value);
    collectRoles(target, value.code);
    return;
  }

  String(value)
    .split(/[,;|]/)
    .map((item) => normalizeRoleName(item))
    .filter(Boolean)
    .forEach((item) => target.add(item));
}

function getRolesFromSource(source) {
  if (!source || typeof source !== "object") {
    return [];
  }

  const roles = new Set();
  const fields = [
    source.role,
    source.roles,
    source.roleName,
    source.roleNames,
    source.userRole,
    source.userRoles,
    source[JWT_ROLE_CLAIM]
  ];

  fields.forEach((field) => collectRoles(roles, field));
  return [...roles];
}

function getUserRoles(user = getCurrentUser()) {
  const roles = new Set();
  const jwtPayload = parseJwtPayload();

  getRolesFromSource(jwtPayload).forEach((role) => roles.add(role));
  getRolesFromSource(user).forEach((role) => roles.add(role));

  return [...roles];
}

function isAdminUser(user = getCurrentUser()) {
  return getUserRoles(user).includes(ADMIN_ROLE);
}

function isLoggedIn() {
  return !!getAccessToken();
}

async function authFetch(url, options = {}) {
  const token = getAccessToken();

  const headers = new Headers(options.headers || {});
  if (!headers.has("Content-Type") && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: "include"
  });

  if (response.status === 401) {
    clearAuthData();
  }

  return response;
}

async function fetchCurrentUserFromApi() {
  const token = getAccessToken();
  if (!token) return null;

  try {
    const response = await authFetch(`${API_BASE_URL}/api/auth/me`, {
      method: "GET"
    });

    if (!response.ok) {
      clearAuthData();
      return null;
    }

    const user = await response.json();
    setCurrentUser(user);
    return user;
  } catch {
    return getCurrentUser();
  }
}

function getCurrentRelativeUrl() {
  const currentPath = window.location.pathname.split("/").pop() || "index.html";
  return `${currentPath}${window.location.search || ""}`;
}

function redirectToLogin(returnUrl) {
  window.location.href = buildPageUrl("Login.html", {
    returnUrl
  });
}

function redirectToRegister() {
  window.location.href = buildPageUrl("Register.html");
}

function requireAuth(returnUrl) {
  if (isLoggedIn()) {
    return true;
  }

  redirectToLogin(returnUrl);
  return false;
}

function redirectToProfile() {
  if (!requireAuth()) return;
  window.location.href = "Profile.html";
}

function redirectToFavorites() {
  if (!requireAuth()) return;
  window.location.href = "Profile.html#favorites";
}

function redirectToCreateListing() {
  if (!requireAuth("CreateListing.html")) return;
  window.location.href = "CreateListing.html";
}

function redirectToAdminPanel() {
  if (!requireAuth("AdminPage.html")) return;
  window.location.href = "AdminPage.html";
}

async function ensureAdminAccess(options = {}) {
  const returnUrl = options.returnUrl || getCurrentRelativeUrl();
  const redirect = options.redirect !== false;
  const redirectUrl = options.redirectUrl || "index.html";

  if (!isLoggedIn()) {
    redirectToLogin(returnUrl);
    return null;
  }

  let user = getCurrentUser();

  try {
    const freshUser = await fetchCurrentUserFromApi();
    if (freshUser) {
      user = freshUser;
    }
  } catch {
    // Няма нужда от отделна обработка тук.
  }

  if (isAdminUser(user)) {
    return user || getCurrentUser();
  }

  if (options.probe !== false) {
    try {
      const probeResponse = await authFetch(`${API_BASE_URL}/api/admin/users?page=1&pageSize=1`, {
        method: "GET"
      });

      if (probeResponse.ok) {
        return user || getCurrentUser();
      }

      if (probeResponse.status === 401) {
        clearAuthData();
        redirectToLogin(returnUrl);
        return null;
      }
    } catch {
      // Оставяме защитата да се реши от redirect-а по-долу.
    }
  }

  if (redirect) {
    window.location.href = redirectUrl;
  }

  return null;
}

async function logoutUser() {
  try {
    await authFetch(`${API_BASE_URL}/api/auth/logout`, {
      method: "POST"
    });
  } catch {
    // умишлено празно
  } finally {
    clearAuthData();
    window.location.href = "index.html";
  }
}

function getUserAvatarUrl(user = getCurrentUser()) {
  const url = String(user?.avatarUrl ?? user?.logoUrl ?? "").trim();
  return url && url.toLowerCase() !== "null" ? url : "";
}

function fillAvatarImage(container, url, { circle = true } = {}) {
  if (container.dataset.avatarApplied === url) return;
  container.dataset.avatarApplied = url;

  container.style.overflow = "hidden";
  container.style.padding = "0";
  if (circle) container.style.borderRadius = "50%";
  container.innerHTML = `<img src="${url.replaceAll('"', "&quot;")}" alt="Профил" />`;

  const img = container.querySelector("img");
  if (img) {
    img.style.width = "100%";
    img.style.height = "100%";
    img.style.objectFit = "cover";
    img.style.display = "block";
    if (circle) img.style.borderRadius = "50%";
    img.onerror = () => {
      container.removeAttribute("data-avatar-applied");
      container.removeAttribute("style");
      container.innerHTML = "";
    };
  }
}

function ensureStandaloneTopbarAvatar() {
  const actions = document.querySelector(".topbar__actions");
  if (!actions) return null;

  let avatar = actions.querySelector(".topbar-avatar");
  if (!avatar) {
    avatar = document.createElement("a");
    avatar.className = "topbar-avatar";
    avatar.href = "Profile.html";
    avatar.setAttribute("aria-label", "Профил");
    avatar.title = "Профил";
    avatar.style.width = "40px";
    avatar.style.height = "40px";
    avatar.style.flexShrink = "0";
    avatar.style.display = "inline-block";
    avatar.style.borderRadius = "50%";
    avatar.style.border = "2px solid rgba(255,255,255,0.85)";
    avatar.style.boxShadow = "0 4px 12px rgba(23,32,45,0.16)";
    actions.insertBefore(avatar, actions.firstChild);
  }
  return avatar;
}

function applyTopbarAvatar(avatarUrl) {
  const url = String(avatarUrl || "").trim();
  if (!url) return;

  const icons = document.querySelectorAll(".profile-btn__icon");

  if (icons.length) {
    // Страници с профил-бутон (index, ListingDetails, SellerProfile)
    icons.forEach((icon) => fillAvatarImage(icon, url, { circle: true }));
    return;
  }

  // Всяка друга страница с топбар → самостоятелен кръгъл аватар
  const standalone = ensureStandaloneTopbarAvatar();
  if (standalone) fillAvatarImage(standalone, url, { circle: true });
}

async function hydrateTopbarAvatar() {
  if (!isLoggedIn()) return;

  const cached = getUserAvatarUrl();
  if (cached) {
    applyTopbarAvatar(cached);
    return;
  }

  try {
    const user = await fetchCurrentUserFromApi();
    applyTopbarAvatar(getUserAvatarUrl(user));
  } catch {
    // умишлено празно
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", hydrateTopbarAvatar);
} else {
  hydrateTopbarAvatar();
}

window.Auth = {
  API_BASE_URL,
  normalizeEmail,
  isValidEmail,
  buildPageUrl,
  buildOriginRelativeUrl,
  buildCategoryUrl,
  buildListingUrl,
  buildLegacyListingUrl,
  buildShareUrl,
  getCategorySlugFromCode,
  getCategoryCodeFromSlug,
  getListingIdFromLocation,
  getQueryParam,
  readApiMessage,
  setAccessToken,
  getAccessToken,
  clearAuthData,
  setCurrentUser,
  getCurrentUser,
  getUserRoles,
  isAdminUser,
  isLoggedIn,
  authFetch,
  fetchCurrentUserFromApi,
  getUserAvatarUrl,
  applyTopbarAvatar,
  hydrateTopbarAvatar,
  requireAuth,
  redirectToLogin,
  redirectToRegister,
  redirectToProfile,
  redirectToFavorites,
  redirectToCreateListing,
  redirectToAdminPanel,
  ensureAdminAccess,
  logoutUser
};
