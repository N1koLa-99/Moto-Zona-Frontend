(() => {
  const API_BASE_URL = (window.Auth?.API_BASE_URL || "https://motomarketapi.azurewebsites.net").replace(/\/+$/, "");

  const state = {
    listing: null,
    photos: [],
    currentPhotoIndex: 0
  };

  const elements = {
    backToHomeBtn: document.getElementById("backToHomeBtn"),

    guestActions: document.getElementById("guestActions"),
    loginBtn: document.getElementById("loginBtn"),
    registerBtn: document.getElementById("registerBtn"),

    profileMenu: document.getElementById("profileMenu"),
    profileMenuBtn: document.getElementById("profileMenuBtn"),
    profileDropdown: document.getElementById("profileDropdown"),
    userDisplayName: document.getElementById("userDisplayName"),
    createListingBtn: document.getElementById("createListingBtn"),
    logoutBtn: document.getElementById("logoutBtn"),

    loadingState: document.getElementById("loadingState"),
    errorState: document.getElementById("errorState"),
    errorText: document.getElementById("errorText"),
    retryBtn: document.getElementById("retryBtn"),
    detailsContent: document.getElementById("detailsContent"),

    heroEyebrowRow: document.getElementById("heroEyebrowRow"),
    heroImage: document.getElementById("heroImage"),
    promotionBadge: document.getElementById("promotionBadge"),
    heroTitle: document.getElementById("heroTitle"),
    heroSubtitle: document.getElementById("heroSubtitle"),
    heroChips: document.getElementById("heroChips"),
    heroPrice: document.getElementById("heroPrice"),
    heroPriceSecondary: document.getElementById("heroPriceSecondary"),

    mainPhoto: document.getElementById("mainPhoto"),
    prevPhotoBtn: document.getElementById("prevPhotoBtn"),
    nextPhotoBtn: document.getElementById("nextPhotoBtn"),
    zoomPhotoBtn: document.getElementById("zoomPhotoBtn"),
    galleryCounter: document.getElementById("galleryCounter"),
    galleryThumbs: document.getElementById("galleryThumbs"),
    copyLinkBtn: document.getElementById("copyLinkBtn"),

    specsGrid: document.getElementById("specsGrid"),
    descriptionContent: document.getElementById("descriptionContent"),

    sellerLogo: document.getElementById("sellerLogo"),
    sellerInitials: document.getElementById("sellerInitials"),
    sellerName: document.getElementById("sellerName"),
    sellerType: document.getElementById("sellerType"),
    contactName: document.getElementById("contactName"),
    contactPhone: document.getElementById("contactPhone"),
    sidebarPublished: document.getElementById("sidebarPublished"),
    sidebarViews: document.getElementById("sidebarViews"),
    callBtn: document.getElementById("callBtn"),
    copyPhoneBtn: document.getElementById("copyPhoneBtn"),

    lightbox: document.getElementById("lightbox"),
    lightboxImage: document.getElementById("lightboxImage"),
    lightboxCounter: document.getElementById("lightboxCounter"),
    closeLightboxBtn: document.getElementById("closeLightboxBtn"),
    prevLightboxBtn: document.getElementById("prevLightboxBtn"),
    nextLightboxBtn: document.getElementById("nextLightboxBtn")
  };

  document.addEventListener("DOMContentLoaded", init);

  async function init() {
    bindEvents();
    await initTopbarAuth();
    await loadListing();
  }

  function bindEvents() {
    elements.backToHomeBtn?.addEventListener("click", () => {
      window.location.href = "HomePage.html";
    });

    elements.loginBtn?.addEventListener("click", () => {
      if (window.Auth?.redirectToLogin) {
        window.Auth.redirectToLogin();
        return;
      }

      window.location.href = "Login.html";
    });

    elements.registerBtn?.addEventListener("click", () => {
      window.location.href = "Register.html";
    });

    elements.profileMenuBtn?.addEventListener("click", (event) => {
      event.stopPropagation();
      elements.profileDropdown?.classList.toggle("hidden");
    });

    elements.createListingBtn?.addEventListener("click", () => {
      window.location.href = "CreateListing.html";
    });

    elements.logoutBtn?.addEventListener("click", () => {
      if (window.Auth?.logoutUser) {
        window.Auth.logoutUser();
        return;
      }

      localStorage.removeItem("token");
      localStorage.removeItem("accessToken");
      localStorage.removeItem("jwtToken");
      localStorage.removeItem("user");
      window.location.href = "HomePage.html";
    });

    document.addEventListener("click", (event) => {
      if (!elements.profileMenu?.contains(event.target)) {
        elements.profileDropdown?.classList.add("hidden");
      }
    });

    elements.retryBtn?.addEventListener("click", loadListing);

    elements.prevPhotoBtn?.addEventListener("click", () => {
      changePhoto(-1);
    });

    elements.nextPhotoBtn?.addEventListener("click", () => {
      changePhoto(1);
    });

    elements.zoomPhotoBtn?.addEventListener("click", openLightbox);
    elements.mainPhoto?.addEventListener("click", openLightbox);

    elements.copyLinkBtn?.addEventListener("click", async () => {
      await copyText(window.location.href, "Линкът е копиран.");
    });

    elements.copyPhoneBtn?.addEventListener("click", async () => {
      const phone = state.listing?.contactPhone || state.listing?.seller?.phone || "";
      if (!phone) return;
      await copyText(phone, "Телефонът е копиран.");
    });

    elements.closeLightboxBtn?.addEventListener("click", closeLightbox);

    elements.lightbox?.addEventListener("click", (event) => {
      if (event.target === elements.lightbox) {
        closeLightbox();
      }
    });

    elements.prevLightboxBtn?.addEventListener("click", () => {
      changePhoto(-1);
      updateLightbox();
    });

    elements.nextLightboxBtn?.addEventListener("click", () => {
      changePhoto(1);
      updateLightbox();
    });

    document.addEventListener("keydown", (event) => {
      if (!state.listing || elements.lightbox?.classList.contains("hidden")) return;

      if (event.key === "Escape") {
        closeLightbox();
      }

      if (event.key === "ArrowLeft") {
        changePhoto(-1);
        updateLightbox();
      }

      if (event.key === "ArrowRight") {
        changePhoto(1);
        updateLightbox();
      }
    });
  }

  async function initTopbarAuth() {
    const token = getAccessTokenCompat();
    const isLoggedIn = Boolean(token) || Boolean(window.Auth?.isLoggedIn?.());

    if (!isLoggedIn) {
      elements.guestActions?.classList.remove("hidden");
      elements.profileMenu?.classList.add("hidden");
      return;
    }

    elements.guestActions?.classList.add("hidden");
    elements.profileMenu?.classList.remove("hidden");

    try {
      let user = null;

      if (window.Auth?.fetchCurrentUserFromApi) {
        user = await window.Auth.fetchCurrentUserFromApi();
      } else {
        user = tryReadUserFromLocalStorage();
      }

      const displayName =
        cleanNullableText(user?.companyName) ||
        cleanNullableText(user?.displayName) ||
        cleanNullableText(user?.fullName) ||
        cleanNullableText([user?.firstName, user?.lastName].filter(Boolean).join(" ")) ||
        "Профил";

      elements.userDisplayName.textContent = displayName;
    } catch {
      elements.userDisplayName.textContent = "Профил";
    }
  }

  async function loadListing() {
    const listingId = getListingIdFromUrl();

    if (!listingId) {
      showError("Невалиден или липсващ id на обявата.");
      return;
    }

    setPageState("loading");

    try {
      const response = await fetch(`${API_BASE_URL}/api/listings/public/${listingId}?incrementView=true`, {
        method: "GET",
        headers: buildOptionalAuthHeaders()
      });

      if (!response.ok) {
        throw new Error(await extractErrorMessage(response));
      }

      const listing = await response.json();

      state.listing = listing;
      state.photos = sortPhotos(listing.photos || []);
      state.currentPhotoIndex = 0;

      renderListing(listing);
      setPageState("ready");
    } catch (error) {
      console.error(error);
      showError(error?.message || "Не успяхме да заредим обявата.");
    }
  }

  function renderListing(listing) {
    document.title = `MotoMarket | ${listing.title || "Обява"}`;

    elements.heroTitle.textContent = listing.title || "Без заглавие";
    elements.heroSubtitle.textContent = buildHeroSubtitle(listing);

    const hasPromotion = renderPromotionBadge(elements.promotionBadge, listing.currentPromotionType);
    elements.heroEyebrowRow.classList.toggle("hidden", !hasPromotion);

    const displayPrice = formatCurrency(
      listing.displayPrice ?? listing.priceEUR ?? listing.priceOriginal ?? 0,
      listing.displayCurrencyCode || listing.currencyCode || "EUR"
    );

    const originalPrice = formatCurrency(
      listing.priceOriginal ?? 0,
      listing.currencyCode || "EUR"
    );

    elements.heroPrice.textContent = displayPrice;

    const shouldShowSecondaryPrice =
      Boolean(listing.currencyCode) &&
      Boolean(listing.displayCurrencyCode) &&
      listing.currencyCode.toUpperCase() !== listing.displayCurrencyCode.toUpperCase();

    if (shouldShowSecondaryPrice) {
      elements.heroPriceSecondary.textContent = `Оригинална цена: ${originalPrice}`;
      elements.heroPriceSecondary.classList.remove("hidden");
    } else {
      elements.heroPriceSecondary.classList.add("hidden");
    }

    renderGallery();
    renderHeroChips(listing);
    renderSpecs(listing);
    renderDescription(listing);
    renderContactCard(listing);
  }

  function renderGallery() {
    const currentPhoto = getCurrentPhoto();
    const fallbackImage = createPlaceholderImage(state.listing?.title || "MotoMarket");
    const mainPhotoUrl = currentPhoto?.fileUrl || fallbackImage;
    const mainPhotoAlt = currentPhoto?.fileName || state.listing?.title || "Снимка на обявата";

    elements.mainPhoto.src = mainPhotoUrl;
    elements.mainPhoto.alt = mainPhotoAlt;

    elements.heroImage.src = mainPhotoUrl;
    elements.heroImage.alt = mainPhotoAlt;

    const total = state.photos.length || 1;
    const currentDisplayIndex = state.photos.length ? state.currentPhotoIndex + 1 : 1;

    elements.galleryCounter.textContent = `${currentDisplayIndex} / ${total}`;

    const canNavigate = state.photos.length > 1;
    elements.prevPhotoBtn.style.display = canNavigate ? "inline-flex" : "none";
    elements.nextPhotoBtn.style.display = canNavigate ? "inline-flex" : "none";

    if (!state.photos.length) {
      elements.galleryThumbs.innerHTML = `
        <div class="thumb-btn thumb-btn--static active">
          <img src="${escapeHtml(mainPhotoUrl)}" alt="Няма снимки" />
        </div>
      `;
      return;
    }

    elements.galleryThumbs.innerHTML = state.photos.map((photo, index) => `
      <button
        class="thumb-btn ${index === state.currentPhotoIndex ? "active" : ""}"
        type="button"
        data-index="${index}"
        aria-label="Снимка ${index + 1}"
      >
        <img
          src="${escapeHtml(photo.fileUrl || fallbackImage)}"
          alt="${escapeHtml(photo.fileName || `Снимка ${index + 1}`)}"
        />
      </button>
    `).join("");

    [...elements.galleryThumbs.querySelectorAll(".thumb-btn")].forEach(btn => {
      btn.addEventListener("click", () => {
        const index = Number(btn.dataset.index);
        setCurrentPhoto(index);
      });
    });
  }

  function renderHeroChips(listing) {
    const chips = [];

    if (listing.vehicleYear) {
      chips.push(`${listing.vehicleYear} г.`);
    }

    if (listing.conditionName) {
      chips.push(listing.conditionName);
    }

    elements.heroChips.innerHTML = chips.map(text => `
      <span class="hero-chip">${escapeHtml(text)}</span>
    `).join("");
  }

  function renderSpecs(listing) {
    const typeValue = [listing.subCategoryName, listing.subCategory2Name]
      .filter(Boolean)
      .join(" / ");

    const specs = [
      { label: "Тип", value: typeValue },
      { label: "Категория книжка", value: listing.licenseCategoryName },
      { label: "Кубатура", value: listing.engineCC ? `${formatNumber(listing.engineCC)} cc` : null },
      { label: "Мощност", value: listing.horsePower ? `${formatNumber(listing.horsePower)} к.с.` : null },
      {
        label: "Пробег",
        value: listing.mileage !== null && listing.mileage !== undefined
          ? `${formatNumber(listing.mileage)} км`
          : null
      },
      { label: "Цвят", value: listing.color }
    ].filter(item => cleanNullableText(item.value));

    elements.specsGrid.innerHTML = specs.length
      ? specs.map(item => `
          <div class="spec-item">
            <p class="spec-item__label">${escapeHtml(item.label)}</p>
            <p class="spec-item__value">${escapeHtml(item.value)}</p>
          </div>
        `).join("")
      : `
          <div class="spec-item">
            <p class="spec-item__label">Информация</p>
            <p class="spec-item__value">Няма налични допълнителни технически данни.</p>
          </div>
        `;
  }

  function renderDescription(listing) {
    const description = cleanNullableText(listing.description);

    if (!description) {
      elements.descriptionContent.innerHTML = `<p>Няма добавено описание за тази обява.</p>`;
      return;
    }

    const paragraphs = description
      .split(/\n+/)
      .map(x => x.trim())
      .filter(Boolean);

    elements.descriptionContent.innerHTML = paragraphs
      .map(p => `<p>${escapeHtml(p)}</p>`)
      .join("");
  }

  function renderContactCard(listing) {
    const seller = listing.seller || {};

    const sellerDisplayName =
      cleanNullableText(seller.companyName) ||
      cleanNullableText(seller.displayName) ||
      cleanNullableText(listing.contactName) ||
      "Продавач";

    elements.sellerName.textContent = sellerDisplayName;
    elements.sellerType.textContent = seller.sellerTypeLabel || "Потребител";
    elements.contactName.textContent = listing.contactName || sellerDisplayName || "—";
    elements.contactPhone.textContent = listing.contactPhone || seller.phone || "—";
    elements.sidebarPublished.textContent = formatDate(listing.publishedAt || listing.createdAt);
    elements.sidebarViews.textContent = formatNumber(listing.viewCount ?? 0);

    const phone = listing.contactPhone || seller.phone || "";
    elements.callBtn.href = phone ? `tel:${sanitizePhoneForTel(phone)}` : "#";
    elements.callBtn.textContent = phone ? "Обади се" : "Няма телефон";
    elements.callBtn.style.pointerEvents = phone ? "auto" : "none";
    elements.callBtn.style.opacity = phone ? "1" : "0.6";

    const logoUrl = cleanNullableText(seller.logoUrl);
    if (logoUrl) {
      elements.sellerLogo.src = logoUrl;
      elements.sellerLogo.classList.remove("hidden");
      elements.sellerInitials.classList.add("hidden");
    } else {
      elements.sellerLogo.classList.add("hidden");
      elements.sellerInitials.classList.remove("hidden");
      elements.sellerInitials.textContent = getInitials(sellerDisplayName);
    }
  }

  function renderPromotionBadge(targetElement, promotionType) {
    if (!targetElement) return false;

    const value = (promotionType || "NORMAL").toUpperCase();
    targetElement.classList.remove("hidden", "promotion-badge--vip", "promotion-badge--top");

    if (value === "VIP") {
      targetElement.textContent = "VIP";
      targetElement.classList.add("promotion-badge--vip");
      return true;
    }

    if (value === "TOP") {
      targetElement.textContent = "TOP";
      targetElement.classList.add("promotion-badge--top");
      return true;
    }

    targetElement.classList.add("hidden");
    return false;
  }

  function getListingIdFromUrl() {
    const params = new URLSearchParams(window.location.search);
    const id = Number(params.get("id") || 0);
    return Number.isFinite(id) && id > 0 ? id : null;
  }

  function getCurrentPhoto() {
    return state.photos[state.currentPhotoIndex] || null;
  }

  function setCurrentPhoto(index) {
    if (!state.photos.length) {
      state.currentPhotoIndex = 0;
      renderGallery();
      return;
    }

    const total = state.photos.length;
    const normalized = ((index % total) + total) % total;
    state.currentPhotoIndex = normalized;

    renderGallery();
    updateLightbox();
  }

  function changePhoto(step) {
    if (!state.photos.length) return;
    setCurrentPhoto(state.currentPhotoIndex + step);
  }

  function openLightbox() {
    const photo = getCurrentPhoto();
    if (!photo && !elements.mainPhoto?.src) return;

    elements.lightbox.classList.remove("hidden");
    document.body.classList.add("modal-open");
    updateLightbox();
  }

  function closeLightbox() {
    elements.lightbox.classList.add("hidden");
    document.body.classList.remove("modal-open");
  }

  function updateLightbox() {
    if (elements.lightbox.classList.contains("hidden")) return;

    const currentPhoto = getCurrentPhoto();
    const imageUrl = currentPhoto?.fileUrl || elements.mainPhoto?.src || createPlaceholderImage("MotoMarket");

    elements.lightboxImage.src = imageUrl;
    elements.lightboxImage.alt = currentPhoto?.fileName || state.listing?.title || "Снимка на обявата";

    const total = state.photos.length || 1;
    const currentDisplayIndex = state.photos.length ? state.currentPhotoIndex + 1 : 1;
    elements.lightboxCounter.textContent = `${currentDisplayIndex} / ${total}`;
  }

  function buildHeroSubtitle(listing) {
    const parts = [];

    const typeLine = [listing.subCategoryName, listing.subCategory2Name]
      .filter(Boolean)
      .join(" • ");

    if (typeLine) {
      parts.push(typeLine);
    }

    const location = buildLocationText(listing);
    if (location !== "—") {
      parts.push(location);
    }

    return parts.join(" · ");
  }

  function buildLocationText(listing) {
    const parts = [listing.cityName, listing.regionName, listing.countryName]
      .filter(x => cleanNullableText(x));

    return parts.length ? parts.join(", ") : "—";
  }

  function sortPhotos(photos) {
    return [...photos].sort((a, b) => {
      const mainDiff = Number(Boolean(b?.isMain)) - Number(Boolean(a?.isMain));
      if (mainDiff !== 0) return mainDiff;

      const sortDiff = (a?.sortOrder ?? 9999) - (b?.sortOrder ?? 9999);
      if (sortDiff !== 0) return sortDiff;

      return (a?.id ?? 0) - (b?.id ?? 0);
    });
  }

  function setPageState(stateName) {
    elements.loadingState.classList.add("hidden");
    elements.errorState.classList.add("hidden");
    elements.detailsContent.classList.add("hidden");

    if (stateName === "loading") {
      elements.loadingState.classList.remove("hidden");
    }

    if (stateName === "error") {
      elements.errorState.classList.remove("hidden");
    }

    if (stateName === "ready") {
      elements.detailsContent.classList.remove("hidden");
    }
  }

  function showError(message) {
    elements.errorText.textContent = message || "Възникна неизвестна грешка.";
    setPageState("error");
  }

  function buildOptionalAuthHeaders() {
    const headers = {
      Accept: "application/json"
    };

    const token = getAccessTokenCompat();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    return headers;
  }

  function getAccessTokenCompat() {
    if (window.Auth?.getAccessToken) {
      return window.Auth.getAccessToken();
    }

    return (
      localStorage.getItem("token") ||
      localStorage.getItem("accessToken") ||
      localStorage.getItem("jwtToken") ||
      ""
    );
  }

  function tryReadUserFromLocalStorage() {
    try {
      const raw = localStorage.getItem("user");
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  async function extractErrorMessage(response) {
    const text = await response.text();

    if (!text) {
      return `Грешка ${response.status}`;
    }

    try {
      const data = JSON.parse(text);
      const flattenedModelErrors = flattenErrorObject(data?.errors);

      return (
        data?.message ||
        data?.title ||
        data?.error ||
        data?.detail ||
        flattenedModelErrors ||
        `Грешка ${response.status}`
      );
    } catch {
      return text;
    }
  }

  function flattenErrorObject(errors) {
    if (!errors) return "";

    if (Array.isArray(errors)) {
      return errors.join(", ");
    }

    if (typeof errors === "object") {
      const values = Object.values(errors).flatMap(v => Array.isArray(v) ? v : [v]);
      return values.filter(Boolean).join(", ");
    }

    return "";
  }

  async function copyText(text, successMessage) {
    if (!text) return;

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const temp = document.createElement("textarea");
        temp.value = text;
        temp.setAttribute("readonly", "");
        temp.style.position = "absolute";
        temp.style.left = "-9999px";
        document.body.appendChild(temp);
        temp.select();
        document.execCommand("copy");
        document.body.removeChild(temp);
      }

      alert(successMessage);
    } catch {
      alert("Не успяхме да копираме.");
    }
  }

  function formatCurrency(amount, currencyCode) {
    const amountNumber = Number(amount || 0);
    const code = (currencyCode || "EUR").toUpperCase();

    try {
      return new Intl.NumberFormat("bg-BG", {
        style: "currency",
        currency: code,
        maximumFractionDigits: 2
      }).format(amountNumber);
    } catch {
      return `${formatNumber(amountNumber)} ${code}`;
    }
  }

  function formatDate(value) {
    if (!value) return "—";

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "—";

    return new Intl.DateTimeFormat("bg-BG", {
      day: "2-digit",
      month: "long",
      year: "numeric"
    }).format(date);
  }

  function formatNumber(value) {
    const number = Number(value);
    if (!Number.isFinite(number)) return "—";

    return new Intl.NumberFormat("bg-BG").format(number);
  }

  function sanitizePhoneForTel(phone) {
    return String(phone || "").replace(/[^\d+]/g, "");
  }

  function cleanNullableText(value) {
    const result = String(value || "").trim();
    return result ? result : null;
  }

  function getInitials(value) {
    const text = cleanNullableText(value) || "MM";
    const parts = text.split(/\s+/).filter(Boolean).slice(0, 2);
    return parts.map(x => x[0]?.toUpperCase() || "").join("") || "MM";
  }

  function createPlaceholderImage(label) {
    const safeLabel = escapeXml(label || "MotoMarket");

    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800" viewBox="0 0 1200 800">
        <defs>
          <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#fff1ea"/>
            <stop offset="50%" stop-color="#f4f8fd"/>
            <stop offset="100%" stop-color="#e7eef7"/>
          </linearGradient>
        </defs>
        <rect width="1200" height="800" fill="url(#g)"/>
        <circle cx="950" cy="160" r="160" fill="#ffffff" fill-opacity="0.32"/>
        <circle cx="240" cy="660" r="220" fill="#ff6a2a" fill-opacity="0.09"/>
        <text x="50%" y="48%" dominant-baseline="middle" text-anchor="middle" font-family="Arial, sans-serif" font-size="68" font-weight="700" fill="#596a7d">${safeLabel}</text>
        <text x="50%" y="58%" dominant-baseline="middle" text-anchor="middle" font-family="Arial, sans-serif" font-size="28" font-weight="600" fill="#707f91">MotoMarket</text>
      </svg>
    `.trim();

    return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
  }

  function escapeXml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&apos;");
  }

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }
})();
