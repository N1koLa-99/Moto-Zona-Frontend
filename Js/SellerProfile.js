(() => {
  "use strict";

  const API_BASE_URL = (window.Auth?.API_BASE_URL || "https://motomarketapi.azurewebsites.net").replace(/\/+$/, "");

  const FETCH_PAGE_SIZE = 60;
  const MAX_FETCH_PAGES = 50;
  const PAGE_SIZE = 12;

  const state = {
    sellerId: null,
    profile: null,
    allListings: [],
    filteredResults: [],
    page: 1,
    favoriteIds: new Set()
  };

  const elements = {
    loadingState: document.getElementById("loadingState"),
    errorState: document.getElementById("errorState"),
    errorText: document.getElementById("errorText"),
    sellerContent: document.getElementById("sellerContent"),

    sellerAvatar: document.getElementById("sellerAvatar"),
    sellerAvatarInitials: document.getElementById("sellerAvatarInitials"),
    sellerTypeBadge: document.getElementById("sellerTypeBadge"),
    sellerLocationBadge: document.getElementById("sellerLocationBadge"),
    sellerHeroName: document.getElementById("sellerHeroName"),
    sellerContactPerson: document.getElementById("sellerContactPerson"),
    sellerDescription: document.getElementById("sellerDescription"),
    sellerCallBtn: document.getElementById("sellerCallBtn"),
    sellerWebsiteBtn: document.getElementById("sellerWebsiteBtn"),
    statListings: document.getElementById("statListings"),
    statSince: document.getElementById("statSince"),

    listingsHeading: document.getElementById("listingsHeading"),
    searchInput: document.getElementById("searchInput"),
    sortSelect: document.getElementById("sortSelect"),
    categoryFilter: document.getElementById("categoryFilter"),
    licenseCategoryFilter: document.getElementById("licenseCategoryFilter"),
    priceMin: document.getElementById("priceMin"),
    priceMax: document.getElementById("priceMax"),
    yearFrom: document.getElementById("yearFrom"),
    yearTo: document.getElementById("yearTo"),
    vipOnlyFilter: document.getElementById("vipOnlyFilter"),
    topOnlyFilter: document.getElementById("topOnlyFilter"),
    clearFiltersBtn: document.getElementById("clearFiltersBtn"),

    resultsCount: document.getElementById("resultsCount"),
    listingsGrid: document.getElementById("listingsGrid"),
    pagination: document.getElementById("pagination"),

    favoritesBtn: document.getElementById("favoritesBtn"),
    favoritesCount: document.getElementById("favoritesCount"),
    backToHomeBtn: document.getElementById("backToHomeBtn"),
    guestActions: document.getElementById("guestActions"),
    loginBtn: document.getElementById("loginBtn"),
    profileMenu: document.getElementById("profileMenu"),
    profileMenuBtn: document.getElementById("profileMenuBtn"),
    profileDropdown: document.getElementById("profileDropdown"),
    userDisplayName: document.getElementById("userDisplayName"),
    createListingBtn: document.getElementById("createListingBtn"),
    logoutBtn: document.getElementById("logoutBtn"),
    toastStack: document.getElementById("toastStack")
  };

  /* ───────────────────── helpers ───────────────────── */

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function cleanNullableText(value) {
    const text = String(value ?? "").trim();
    return text && text.toLowerCase() !== "null" ? text : "";
  }

  function getInitials(value) {
    const text = cleanNullableText(value) || "MM";
    const parts = text.split(/\s+/).filter(Boolean).slice(0, 2);
    return parts.map((x) => x[0]?.toUpperCase() || "").join("") || "MM";
  }

  function formatPrice(value) {
    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric.toFixed(2) : "0.00";
  }

  function formatNumber(value) {
    const numeric = Number(value);
    return Number.isFinite(numeric) ? new Intl.NumberFormat("bg-BG").format(numeric) : "0";
  }

  function formatMonthYear(value) {
    if (!value) return "—";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "—";
    return new Intl.DateTimeFormat("bg-BG", { month: "short", year: "numeric" }).format(date);
  }

  function sanitizePhoneForTel(value) {
    return String(value || "").replace(/[^\d+]/g, "");
  }

  function getPromotionType(item) {
    return String(item?.currentPromotionType ?? item?.promotionType ?? item?.promotionLevel ?? "NORMAL")
      .trim()
      .toUpperCase();
  }

  function getPromotionPriority(item) {
    const t = getPromotionType(item);
    if (t === "VIP") return 0;
    if (t === "TOP") return 1;
    return 2;
  }

  function getShortLocation(item) {
    return item?.cityName || item?.regionName || item?.countryName || "";
  }

  function getItemPrice(item) {
    const value = Number(item?.displayPrice ?? item?.price ?? 0);
    return Number.isFinite(value) ? value : 0;
  }

  function getItemYear(item) {
    const value = Number(item?.vehicleYear ?? item?.year ?? 0);
    return Number.isFinite(value) ? value : 0;
  }

  function getItemDate(item) {
    const candidates = [item?.createdAt, item?.publishedAt, item?.lastRefreshAt, item?.postedAt];
    for (const candidate of candidates) {
      if (!candidate) continue;
      const ts = new Date(candidate).getTime();
      if (Number.isFinite(ts)) return ts;
    }
    return 0;
  }

  function normalizeMainCategoryCode(value) {
    const raw = String(value || "").trim().toUpperCase();
    const compact = raw.replace(/[\s_-]+/g, "");
    if (!compact) return "";

    const map = {
      VEHICLE: "VEHICLE", VEHICLES: "VEHICLE", MOTOR: "VEHICLE", MOTORS: "VEHICLE",
      MOTORCYCLE: "VEHICLE", MOTORCYCLES: "VEHICLE", BIKE: "VEHICLE", BIKES: "VEHICLE",
      МОТОР: "VEHICLE", МОТОРИ: "VEHICLE",
      GEAR: "GEAR", GEARS: "GEAR", EQUIPMENT: "GEAR", HELMET: "GEAR", HELMETS: "GEAR",
      ЕКИПИРОВКА: "GEAR", КАСКА: "GEAR", КАСКИ: "GEAR",
      PART: "PART", PARTS: "PART", ЧАСТ: "PART", ЧАСТИ: "PART",
      ACCESSORY: "ACCESSORY", ACCESSORIES: "ACCESSORY", АКСЕСОАР: "ACCESSORY", АКСЕСОАРИ: "ACCESSORY"
    };

    return map[compact] || raw;
  }

  function getItemMainCategoryCode(item) {
    const directCandidates = [
      item?.mainCategoryCode, item?.categoryCode, item?.listingCategoryCode,
      item?.mainCategoryName, item?.categoryName, item?.listingCategoryName
    ];

    for (const candidate of directCandidates) {
      const normalized = normalizeMainCategoryCode(candidate);
      if (["VEHICLE", "GEAR", "PART", "ACCESSORY"].includes(normalized)) {
        return normalized;
      }
    }

    if (
      item?.vehicleClassName || item?.vehicleTypeName || item?.licenseCategoryName ||
      item?.engineCC || item?.engineCc || item?.horsePower || item?.hp ||
      item?.mileage || item?.vehicleYear
    ) {
      return "VEHICLE";
    }

    return "";
  }

  function buildCardMeta(item, code) {
    if (code === "VEHICLE") {
      return [
        item.vehicleYear ? `<span>${escapeHtml(String(item.vehicleYear))}</span>` : "",
        (item.engineCC || item.engineCc) ? `<span>${escapeHtml(String(item.engineCC || item.engineCc))} cc</span>` : "",
        (item.horsePower || item.hp) ? `<span>${escapeHtml(String(item.horsePower || item.hp))} к.с.</span>` : "",
        item.licenseCategoryName ? `<span class="meta-license">${escapeHtml(item.licenseCategoryName)}</span>` : ""
      ].filter(Boolean).join("");
    }
    if (code === "GEAR") {
      return [
        item.vehicleYear ? `<span>${escapeHtml(String(item.vehicleYear))}</span>` : "",
        item.gearTypeName ? `<span>${escapeHtml(item.gearTypeName)}</span>` : "",
        item.helmetTypeName ? `<span>${escapeHtml(item.helmetTypeName)}</span>` : "",
        item.conditionName ? `<span>${escapeHtml(item.conditionName)}</span>` : ""
      ].filter(Boolean).join("");
    }
    if (code === "PART") {
      return [
        item.partTypeName ? `<span>${escapeHtml(item.partTypeName)}</span>` : "",
        item.conditionName ? `<span>${escapeHtml(item.conditionName)}</span>` : ""
      ].filter(Boolean).join("");
    }
    if (code === "ACCESSORY") {
      return [
        item.accessoryTypeName ? `<span>${escapeHtml(item.accessoryTypeName)}</span>` : "",
        item.conditionName ? `<span>${escapeHtml(item.conditionName)}</span>` : ""
      ].filter(Boolean).join("");
    }
    return "";
  }

  function renderCard(item) {
    const promotion = getPromotionType(item);
    const code = getItemMainCategoryCode(item);

    const cardClass = promotion === "VIP" ? "card card--vip" : promotion === "TOP" ? "card card--top" : "card";
    const ribbon = promotion === "VIP"
      ? `<div class="card__ribbon card__ribbon--vip">VIP</div>`
      : promotion === "TOP"
        ? `<div class="card__ribbon card__ribbon--top">TOP</div>`
        : "";

    const imageHtml = item.mainPhotoUrl
      ? `<img src="${escapeHtml(item.mainPhotoUrl)}" alt="${escapeHtml(item.title || "Обява")}" loading="lazy" />`
      : `<div class="card__image-placeholder">Няма снимка</div>`;

    const meta = buildCardMeta(item, code);
    const location = getShortLocation(item);
    const displayPrice = formatPrice(item.displayPrice ?? item.price ?? 0);
    const currency = item.displayCurrencyCode || item.currencyCode || "EUR";
    const favoriteActive = state.favoriteIds.has(String(item.id));
    const listingUrl = window.Auth?.buildListingUrl?.(item.id) || `ListingDetails.html?id=${encodeURIComponent(item.id)}`;

    return `
      <a class="listing-link" href="${escapeHtml(listingUrl)}">
        <article class="${cardClass}">
          <div class="card__image">
            ${ribbon}
            <button class="favorite-btn ${favoriteActive ? "active" : ""}" type="button" data-id="${escapeHtml(String(item.id))}" aria-label="Любима обява">
              ❤
            </button>
            ${imageHtml}
          </div>

          <div class="card__body">
            <div class="card__top">
              <div class="card__title-wrap">
                <h3>${escapeHtml(item.title || "Без заглавие")}</h3>
              </div>

              <div class="card__price">
                <span>${escapeHtml(displayPrice)} ${escapeHtml(currency)}</span>
              </div>
            </div>

            <div class="card__meta">
              ${meta || `<span>${escapeHtml(item.mainCategoryName || code || "")}</span>`}
            </div>

            <div class="card__bottom">
              <div class="card__location">${escapeHtml(location || "Локацията не е посочена")}</div>
            </div>
          </div>
        </article>
      </a>
    `;
  }

  /* ───────────────────── data ───────────────────── */

  function buildOptionalAuthHeaders() {
    const headers = {};
    const token = window.Auth?.getAccessToken?.();
    if (token) headers.Authorization = `Bearer ${token}`;
    return headers;
  }

  async function getJson(url) {
    const response = await fetch(url, { method: "GET", headers: buildOptionalAuthHeaders() });
    if (!response.ok) {
      const error = new Error("Грешка при заявката.");
      error.status = response.status;
      throw error;
    }
    return response.json();
  }

  async function fetchSellerProfile(sellerId) {
    return getJson(`${API_BASE_URL}/api/users/${sellerId}`);
  }

  async function fetchSellerListings(sellerId) {
    let page = 1;
    let totalPages = 1;
    const allItems = [];
    const seenIds = new Set();

    do {
      const params = new URLSearchParams();
      params.set("sellerUserId", String(sellerId));
      params.set("page", String(page));
      params.set("pageSize", String(FETCH_PAGE_SIZE));
      params.set("sortBy", "newest");

      const data = await getJson(`${API_BASE_URL}/api/listings/public?${params.toString()}`);
      const items = Array.isArray(data.items) ? data.items : [];

      items.forEach((item) => {
        const id = String(item?.id ?? "");
        if (!id || seenIds.has(id)) return;
        seenIds.add(id);
        allItems.push(item);
      });

      totalPages = Math.min(Number(data.totalPages) || 1, MAX_FETCH_PAGES);
      page += 1;
    } while (page <= totalPages);

    return allItems;
  }

  /* ───────────────────── filtering / rendering ───────────────────── */

  function normalizePositive(value) {
    const raw = String(value ?? "").trim();
    if (!raw) return null;
    const num = Number(raw);
    return Number.isFinite(num) && num >= 0 ? num : null;
  }

  function applyFiltersAndRender() {
    const searchText = (elements.searchInput?.value || "").trim().toLowerCase();
    const sortBy = elements.sortSelect?.value || "newest";
    const category = elements.categoryFilter?.value || "";
    const licenseCategory = (elements.licenseCategoryFilter?.value || "").trim();
    const priceMin = normalizePositive(elements.priceMin?.value);
    const priceMax = normalizePositive(elements.priceMax?.value);
    const yearFrom = normalizePositive(elements.yearFrom?.value);
    const yearTo = normalizePositive(elements.yearTo?.value);
    const vipOnly = !!elements.vipOnlyFilter?.checked;
    const topOnly = !!elements.topOnlyFilter?.checked;

    let items = [...state.allListings];

    if (searchText) {
      items = items.filter((item) => {
        const haystack = [
          item.title, item.brandName, item.modelName, item.mainCategoryName,
          item.cityName, item.regionName, item.countryName, item.licenseCategoryName
        ].filter(Boolean).join(" ").toLowerCase();
        return haystack.includes(searchText);
      });
    }

    if (category) {
      items = items.filter((item) => getItemMainCategoryCode(item) === category);
    }

    if (licenseCategory) {
      items = items.filter((item) => String(item?.licenseCategoryName ?? "").trim() === licenseCategory);
    }

    if (priceMin !== null) items = items.filter((i) => getItemPrice(i) >= priceMin);
    if (priceMax !== null) items = items.filter((i) => getItemPrice(i) <= priceMax);
    if (yearFrom !== null) items = items.filter((i) => getItemYear(i) >= yearFrom);
    if (yearTo !== null) items = items.filter((i) => getItemYear(i) <= yearTo);

    if (vipOnly && topOnly) {
      items = items.filter((i) => ["VIP", "TOP"].includes(getPromotionType(i)));
    } else if (vipOnly) {
      items = items.filter((i) => getPromotionType(i) === "VIP");
    } else if (topOnly) {
      items = items.filter((i) => getPromotionType(i) === "TOP");
    }

    items.sort((a, b) => {
      const promoDiff = getPromotionPriority(a) - getPromotionPriority(b);
      if (promoDiff !== 0) return promoDiff;

      switch (sortBy) {
        case "priceasc": return getItemPrice(a) - getItemPrice(b);
        case "pricedesc": return getItemPrice(b) - getItemPrice(a);
        case "yeardesc": return getItemYear(b) - getItemYear(a);
        case "yearasc": return getItemYear(a) - getItemYear(b);
        default: return getItemDate(b) - getItemDate(a);
      }
    });

    state.filteredResults = items;
    state.page = 1;
    renderCurrentPage();
  }

  function renderCurrentPage() {
    const total = state.filteredResults.length;
    const totalPages = Math.ceil(total / PAGE_SIZE) || 0;
    const start = (state.page - 1) * PAGE_SIZE;
    const items = state.filteredResults.slice(start, start + PAGE_SIZE);

    if (elements.resultsCount) {
      elements.resultsCount.textContent = total === 1 ? "1 резултат" : `${total} резултата`;
    }

    if (!items.length) {
      elements.listingsGrid.innerHTML = `<div class="empty-state">Няма обяви по зададените критерии.</div>`;
      elements.pagination.innerHTML = "";
      return;
    }

    elements.listingsGrid.innerHTML = items.map(renderCard).join("");

    [...elements.listingsGrid.querySelectorAll(".favorite-btn")].forEach((button) => {
      button.addEventListener("click", onFavoriteClick);
    });
    [...elements.listingsGrid.querySelectorAll(".listing-link")].forEach((link) => {
      link.addEventListener("click", (e) => {
        if (e.target.closest(".favorite-btn")) {
          e.preventDefault();
        }
      });
    });

    renderPagination(totalPages);
  }

  function renderPagination(totalPages) {
    if (!elements.pagination) return;

    if (totalPages <= 1) {
      elements.pagination.innerHTML = "";
      return;
    }

    let html = "";
    for (let page = 1; page <= totalPages; page++) {
      html += `<button type="button" class="page-btn ${page === state.page ? "active" : ""}" data-page="${page}">${page}</button>`;
    }
    elements.pagination.innerHTML = html;

    [...elements.pagination.querySelectorAll(".page-btn")].forEach((btn) => {
      btn.addEventListener("click", () => {
        const page = Number(btn.dataset.page);
        if (!Number.isFinite(page)) return;
        state.page = page;
        renderCurrentPage();
        const top = elements.listingsHeading?.getBoundingClientRect().top ?? 0;
        window.scrollTo({ top: window.scrollY + top - 90, behavior: "smooth" });
      });
    });
  }

  /* ───────────────────── favorites ───────────────────── */

  async function loadFavoriteIds() {
    if (!window.Auth?.isLoggedIn?.()) {
      state.favoriteIds = new Set();
      updateFavoritesCount(0);
      return;
    }

    try {
      const response = await window.Auth.authFetch(`${API_BASE_URL}/api/profile/favorites?page=1&pageSize=200`);
      if (!response.ok) {
        state.favoriteIds = new Set();
        updateFavoritesCount(0);
        return;
      }
      const data = await response.json();
      const items = Array.isArray(data.items) ? data.items : [];
      state.favoriteIds = new Set(items.map((x) => String(x.id)));
      updateFavoritesCount(items.length);
    } catch {
      state.favoriteIds = new Set();
      updateFavoritesCount(0);
    }
  }

  function updateFavoritesCount(count) {
    if (elements.favoritesCount) {
      elements.favoritesCount.textContent = String(count ?? state.favoriteIds.size);
    }
  }

  async function onFavoriteClick(event) {
    event.preventDefault();
    event.stopPropagation();

    const button = event.currentTarget;
    const listingId = String(button.dataset.id || "");

    if (!window.Auth?.isLoggedIn?.()) {
      window.Auth.redirectToLogin();
      return;
    }

    const isActive = button.classList.contains("active");

    try {
      button.disabled = true;
      const response = await window.Auth.authFetch(
        `${API_BASE_URL}/api/profile/favorites/${listingId}`,
        { method: isActive ? "DELETE" : "POST" }
      );

      if (!response.ok) throw new Error("fail");

      if (isActive) {
        state.favoriteIds.delete(listingId);
        button.classList.remove("active");
        showToast("Премахната от любими.", "info");
      } else {
        state.favoriteIds.add(listingId);
        button.classList.add("active");
        showToast("Добавена в любими.", "success");
      }
      updateFavoritesCount();
    } catch {
      showToast("Не успяхме да обновим любимите.", "error");
    } finally {
      button.disabled = false;
    }
  }

  function showToast(message, type = "info") {
    if (!elements.toastStack || !message) return;
    const toast = document.createElement("div");
    toast.className = `toast toast--${type}`;
    toast.textContent = message;
    elements.toastStack.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add("is-visible"));
    setTimeout(() => {
      toast.classList.remove("is-visible");
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  /* ───────────────────── profile header ───────────────────── */

  function renderProfile(profile) {
    const isCompany = String(profile?.accountType || "").toUpperCase() === "COMPANY";
    const displayName = cleanNullableText(profile?.displayName) || cleanNullableText(profile?.companyName) || "Продавач";

    document.title = `Мото Зона | ${displayName}`;
    if (elements.sellerHeroName) elements.sellerHeroName.textContent = displayName;
    if (elements.listingsHeading) elements.listingsHeading.textContent = `Обяви на ${displayName}`;

    if (elements.sellerTypeBadge) {
      elements.sellerTypeBadge.textContent = isCompany ? "Фирма / Мото къща" : "Частно лице";
      elements.sellerTypeBadge.classList.toggle("seller-hero__badge--company", isCompany);
    }

    const avatarUrl = cleanNullableText(profile?.avatarUrl);
    if (avatarUrl) {
      elements.sellerAvatar.src = avatarUrl;
      elements.sellerAvatar.classList.remove("hidden");
      elements.sellerAvatarInitials.classList.add("hidden");
      elements.sellerAvatar.onerror = () => {
        elements.sellerAvatar.classList.add("hidden");
        elements.sellerAvatarInitials.classList.remove("hidden");
      };
    } else {
      elements.sellerAvatar.classList.add("hidden");
      elements.sellerAvatarInitials.classList.remove("hidden");
      elements.sellerAvatarInitials.textContent = getInitials(displayName);
    }

    const location = [profile?.cityName, profile?.regionName, profile?.countryName].filter(Boolean).join(", ");
    if (location && elements.sellerLocationBadge) {
      elements.sellerLocationBadge.textContent = `📍 ${location}`;
      elements.sellerLocationBadge.classList.remove("hidden");
    }

    const contactPerson = cleanNullableText(profile?.contactPerson);
    if (isCompany && contactPerson && elements.sellerContactPerson) {
      elements.sellerContactPerson.textContent = `Лице за контакт: ${contactPerson}`;
      elements.sellerContactPerson.classList.remove("hidden");
    }

    const description = cleanNullableText(profile?.companyDescription);
    if (description && elements.sellerDescription) {
      elements.sellerDescription.textContent = description;
      elements.sellerDescription.classList.remove("hidden");
    }

    const phone = cleanNullableText(profile?.phone);
    if (phone && elements.sellerCallBtn) {
      elements.sellerCallBtn.href = `tel:${sanitizePhoneForTel(phone)}`;
      elements.sellerCallBtn.textContent = `Обади се · ${phone}`;
      elements.sellerCallBtn.classList.remove("hidden");
    }

    const website = cleanNullableText(profile?.websiteUrl);
    if (website && elements.sellerWebsiteBtn) {
      elements.sellerWebsiteBtn.href = /^https?:\/\//i.test(website) ? website : `https://${website}`;
      elements.sellerWebsiteBtn.classList.remove("hidden");
    }

    if (elements.statListings) elements.statListings.textContent = formatNumber(profile?.activeListingsCount ?? 0);
    if (elements.statSince) elements.statSince.textContent = formatMonthYear(profile?.memberSince);
  }

  /* ───────────────────── header / auth UI ───────────────────── */

  function setupHeader() {
    elements.backToHomeBtn?.addEventListener("click", () => { window.location.href = "index.html"; });
    elements.favoritesBtn?.addEventListener("click", () => {
      if (!window.Auth?.isLoggedIn?.()) { window.Auth.redirectToLogin(); return; }
      window.Auth.redirectToFavorites();
    });
    elements.loginBtn?.addEventListener("click", () => window.Auth.redirectToLogin());
    elements.createListingBtn?.addEventListener("click", () => window.Auth.redirectToCreateListing());
    elements.logoutBtn?.addEventListener("click", () => window.Auth.logoutUser());

    elements.profileMenuBtn?.addEventListener("click", () => {
      const expanded = elements.profileMenuBtn.getAttribute("aria-expanded") === "true";
      elements.profileMenuBtn.setAttribute("aria-expanded", String(!expanded));
      elements.profileDropdown?.classList.toggle("hidden", expanded);
    });

    document.addEventListener("click", (e) => {
      if (!elements.profileMenu?.contains(e.target)) {
        elements.profileDropdown?.classList.add("hidden");
        elements.profileMenuBtn?.setAttribute("aria-expanded", "false");
      }
    });

    const loggedIn = !!window.Auth?.isLoggedIn?.();
    elements.guestActions?.classList.toggle("hidden", loggedIn);
    elements.profileMenu?.classList.toggle("hidden", !loggedIn);

    if (loggedIn) {
      window.Auth.fetchCurrentUserFromApi?.().then((user) => {
        const name = cleanNullableText(user?.displayName) || cleanNullableText(user?.firstName) || "Профил";
        if (elements.userDisplayName) elements.userDisplayName.textContent = name;
      }).catch(() => {});
    }
  }

  function setupFilterToggle() {
    const toggleBtn = document.getElementById("filtersToggleBtn");
    const filterbar = document.getElementById("sellerFilterbar");
    if (!toggleBtn || !filterbar) return;

    toggleBtn.addEventListener("click", () => {
      const isOpen = filterbar.classList.toggle("is-open");
      toggleBtn.setAttribute("aria-expanded", String(isOpen));
    });
  }

  function setupFilters() {
    setupFilterToggle();
    let debounce = null;
    const debounced = () => { clearTimeout(debounce); debounce = setTimeout(applyFiltersAndRender, 250); };

    elements.searchInput?.addEventListener("input", debounced);
    elements.priceMin?.addEventListener("input", debounced);
    elements.priceMax?.addEventListener("input", debounced);
    elements.yearFrom?.addEventListener("input", debounced);
    elements.yearTo?.addEventListener("input", debounced);
    elements.sortSelect?.addEventListener("change", applyFiltersAndRender);
    elements.categoryFilter?.addEventListener("change", applyFiltersAndRender);
    elements.licenseCategoryFilter?.addEventListener("change", applyFiltersAndRender);
    elements.vipOnlyFilter?.addEventListener("change", applyFiltersAndRender);
    elements.topOnlyFilter?.addEventListener("change", applyFiltersAndRender);

    elements.clearFiltersBtn?.addEventListener("click", () => {
      if (elements.searchInput) elements.searchInput.value = "";
      if (elements.categoryFilter) elements.categoryFilter.value = "";
      if (elements.licenseCategoryFilter) elements.licenseCategoryFilter.value = "";
      if (elements.priceMin) elements.priceMin.value = "";
      if (elements.priceMax) elements.priceMax.value = "";
      if (elements.yearFrom) elements.yearFrom.value = "";
      if (elements.yearTo) elements.yearTo.value = "";
      if (elements.vipOnlyFilter) elements.vipOnlyFilter.checked = false;
      if (elements.topOnlyFilter) elements.topOnlyFilter.checked = false;
      if (elements.sortSelect) elements.sortSelect.value = "newest";
      applyFiltersAndRender();
    });
  }

  /* ───────────────────── states ───────────────────── */

  function showLoading() {
    elements.loadingState?.classList.remove("hidden");
    elements.errorState?.classList.add("hidden");
    elements.sellerContent?.classList.add("hidden");
  }

  function showError(message) {
    elements.loadingState?.classList.add("hidden");
    elements.sellerContent?.classList.add("hidden");
    elements.errorState?.classList.remove("hidden");
    if (elements.errorText) elements.errorText.textContent = message || "Възникна проблем.";
  }

  function showContent() {
    elements.loadingState?.classList.add("hidden");
    elements.errorState?.classList.add("hidden");
    elements.sellerContent?.classList.remove("hidden");
  }

  function getSellerIdFromUrl() {
    const params = new URLSearchParams(window.location.search);
    const id = Number(params.get("id"));
    return Number.isFinite(id) && id > 0 ? id : null;
  }

  async function init() {
    setupHeader();
    setupFilters();

    state.sellerId = getSellerIdFromUrl();
    if (!state.sellerId) {
      showError("Липсва валиден идентификатор на продавача.");
      return;
    }

    showLoading();

    try {
      await loadFavoriteIds();

      const [profile, listings] = await Promise.all([
        fetchSellerProfile(state.sellerId),
        fetchSellerListings(state.sellerId)
      ]);

      state.profile = profile;
      state.allListings = listings;

      renderProfile(profile);
      applyFiltersAndRender();
      showContent();
    } catch (error) {
      console.error("Seller profile error:", error);
      if (error?.status === 404) {
        showError("Този продавач не беше намерен.");
      } else {
        showError("Не успяхме да заредим профила на продавача.");
      }
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
