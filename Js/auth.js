const AUTH_STORAGE_KEY = "moto_access_token";
const USER_STORAGE_KEY = "moto_user";
const ADMIN_ROLE = "ADMIN";
const JWT_ROLE_CLAIM = "http://schemas.microsoft.com/ws/2008/06/identity/claims/role";

const API_BASE_URL = window.APP_CONFIG?.apiBaseUrl || "https://localhost:7119";

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
  const currentPath = window.location.pathname.split("/").pop() || "HomePage.html";
  return `${currentPath}${window.location.search || ""}`;
}

function redirectToLogin(returnUrl) {
  const nextUrl = new URL("Login.html", window.location.href);

  if (returnUrl) {
    nextUrl.searchParams.set("returnUrl", returnUrl);
  }

  window.location.href = nextUrl.toString();
}

function redirectToRegister() {
  window.location.href = "Register.html";
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
  if (!requireAuth()) return;
  window.location.href = "CreateListing.html";
}

function redirectToAdminPanel() {
  if (!requireAuth("AdminPage.html")) return;
  window.location.href = "AdminPage.html";
}

async function ensureAdminAccess(options = {}) {
  const returnUrl = options.returnUrl || getCurrentRelativeUrl();
  const redirect = options.redirect !== false;
  const redirectUrl = options.redirectUrl || "HomePage.html";

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
    window.location.href = "HomePage.html";
  }
}

window.Auth = {
  API_BASE_URL,
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
