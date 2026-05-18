(() => {
  const API_BASE_URL = (window.Auth?.API_BASE_URL || "https://motomarketapi.azurewebsites.net").replace(/\/+$/, "");

  const state = {
    listing: null,
    photos: [],
    currentPhotoIndex: 0
  };

  let priceChangePopoverEl = null;
  let activePriceChangeIndicator = null;

  const elements = {
    backToHomeBtn: document.getElementById("backToHomeBtn"),

    guestActions: document.getElementById("guestActions"),
    loginBtn: document.getElementById("loginBtn"),

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
    shareBtn: document.getElementById("shareBtn"),
    shareModal: document.getElementById("shareModal"),
    shareModalBackdrop: document.getElementById("shareModalBackdrop"),
    shareModalClose: document.getElementById("shareModalClose"),
    shareFacebookBtn: document.getElementById("shareFacebookBtn"),
    shareInstagramBtn: document.getElementById("shareInstagramBtn"),
    shareMessengerBtn: document.getElementById("shareMessengerBtn"),
    shareWhatsappBtn: document.getElementById("shareWhatsappBtn"),
    shareViberBtn: document.getElementById("shareViberBtn"),
    shareTelegramBtn: document.getElementById("shareTelegramBtn"),
    shareNativeBtn: document.getElementById("shareNativeBtn"),
    shareDropdownCopyBtn: document.getElementById("shareDropdownCopyBtn"),
    shareUrlInput: document.getElementById("shareUrlInput"),

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

  function setProfileDropdownExpanded(isExpanded) {
    elements.profileMenuBtn?.setAttribute("aria-expanded", isExpanded ? "true" : "false");
  }

  function closeProfileDropdown() {
    elements.profileDropdown?.classList.add("hidden");
    setProfileDropdownExpanded(false);
  }

  function getShareUrl() {
    const listingId = state.listing?.id || getListingIdFromUrl();
    return listingId
      ? `${window.location.origin}/share/${listingId}`
      : window.location.href;
  }

  function getShareTitle() {
    return cleanNullableText(state.listing?.title) || "Обява в Мото Зона";
  }

  function getSharePriceText() {
    if (!state.listing) {
      return "";
    }

    return formatCurrency(
      state.listing.displayPrice ?? state.listing.priceEUR ?? state.listing.priceOriginal ?? 0,
      state.listing.displayCurrencyCode || state.listing.currencyCode || "EUR"
    );
  }

  function getShareText() {
    return [getShareTitle(), getSharePriceText()].filter(Boolean).join(" | ");
  }

  function getNativeSharePayload() {
    return {
      title: getShareTitle(),
      text: getShareText(),
      url: getShareUrl()
    };
  }

  async function shareViaNative(fallbackMessage = "Линкът е копиран.") {
    const sharePayload = getNativeSharePayload();

    if (typeof navigator.share !== "function") {
      await copyText(sharePayload.url, fallbackMessage);
      return false;
    }

    try {
      if (typeof navigator.canShare === "function" && !navigator.canShare(sharePayload)) {
        await copyText(sharePayload.url, fallbackMessage);
        return false;
      }

      await navigator.share(sharePayload);
      return true;
    } catch (error) {
      if (error?.name === "AbortError") {
        return false;
      }

      await copyText(sharePayload.url, fallbackMessage);
      return false;
    }
  }

  function openShareTarget(url, options = {}) {
    if (!url) return;

    const target = options.target || "_blank";
    const features = options.features || "noopener,noreferrer";
    const nextWindow = window.open(url, target, features);

    if (!nextWindow && target === "_blank") {
      window.location.assign(url);
    }
  }

  function openShareModal() {
    const shareUrl = getShareUrl();
    if (elements.shareUrlInput) {
      elements.shareUrlInput.value = shareUrl;
    }
    elements.shareModal?.classList.remove("hidden");
    document.body.classList.add("modal-open");
  }

  function closeShareModal() {
    elements.shareModal?.classList.add("hidden");
    document.body.classList.remove("modal-open");
  }

  function toggleProfileDropdown() {
    if (!elements.profileDropdown) return;

    const shouldOpen = elements.profileDropdown.classList.contains("hidden");
    elements.profileDropdown.classList.toggle("hidden", !shouldOpen);
    setProfileDropdownExpanded(shouldOpen);
  }

  function bindEvents() {
    bindPriceChangeIndicatorEvents();

    elements.backToHomeBtn?.addEventListener("click", () => {
      window.location.href = "index.html";
    });

    elements.loginBtn?.addEventListener("click", () => {
      if (window.Auth?.redirectToLogin) {
        window.Auth.redirectToLogin();
        return;
      }

      window.location.href = "Login.html";
    });

    elements.profileMenuBtn?.addEventListener("click", (event) => {
      event.stopPropagation();
      toggleProfileDropdown();
    });

    elements.createListingBtn?.addEventListener("click", () => {
      if (window.Auth?.redirectToCreateListing) {
        window.Auth.redirectToCreateListing();
        return;
      }

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
      window.location.href = "index.html";
    });

    document.addEventListener("click", (event) => {
      if (!elements.profileMenu?.contains(event.target)) {
        closeProfileDropdown();
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
      await copyText(getShareUrl(), "Линкът е копиран.");
    });

    elements.shareBtn?.addEventListener("click", openShareModal);
    elements.shareModalClose?.addEventListener("click", closeShareModal);
    elements.shareModalBackdrop?.addEventListener("click", closeShareModal);

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && !elements.shareModal?.classList.contains("hidden")) {
        closeShareModal();
      }
    });

    elements.shareFacebookBtn?.addEventListener("click", () => {
      const shareUrl = getShareUrl();
      const fbUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
      openShareTarget(fbUrl, { features: "width=600,height=460,noopener,noreferrer" });
      closeShareModal();
    });

    elements.shareInstagramBtn?.addEventListener("click", async () => {
      await shareViaNative("Instagram се отваря през системното меню за споделяне. Линкът е копиран.");
      closeShareModal();
    });

    elements.shareMessengerBtn?.addEventListener("click", () => {
      const shareUrl = getShareUrl();
      openShareTarget(`fb-messenger://share/?link=${encodeURIComponent(shareUrl)}`);
      closeShareModal();
    });

    elements.shareWhatsappBtn?.addEventListener("click", () => {
      const shareUrl = getShareUrl();
      openShareTarget(`https://wa.me/?text=${encodeURIComponent(`${getShareText()} - ${shareUrl}`)}`);
      closeShareModal();
    });

    elements.shareViberBtn?.addEventListener("click", () => {
      const shareUrl = getShareUrl();
      openShareTarget(`viber://forward?text=${encodeURIComponent(`${getShareText()} - ${shareUrl}`)}`);
      closeShareModal();
    });

    elements.shareTelegramBtn?.addEventListener("click", () => {
      const shareUrl = getShareUrl();
      openShareTarget(`https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(getShareText())}`);
      closeShareModal();
    });

    elements.shareNativeBtn?.addEventListener("click", async () => {
      await shareViaNative();
      closeShareModal();
    });

    elements.shareDropdownCopyBtn?.addEventListener("click", async () => {
      const shareUrl = getShareUrl();
      const btn = elements.shareDropdownCopyBtn;
      await copyText(shareUrl, null);
      const original = btn.textContent;
      btn.textContent = "Копирано!";
      setTimeout(() => { btn.textContent = original; }, 1800);
    });

    elements.shareUrlInput?.addEventListener("click", (event) => {
      event.currentTarget?.select?.();
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

      elements.userDisplayName.textContent = "Профил";
      elements.profileMenuBtn?.setAttribute("title", displayName);
      elements.profileMenuBtn?.setAttribute("aria-label", "Профил");
      setProfileDropdownExpanded(false);
    } catch {
      elements.userDisplayName.textContent = "Профил";
      setProfileDropdownExpanded(false);
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
    document.title = `Мото Зона | ${listing.title || "Обява"}`;

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

    elements.heroPrice.innerHTML = `
      <span class="hero-detail__price-value">${escapeHtml(displayPrice)}</span>
      ${renderPriceChangeIndicatorHtml(listing)}
    `.trim();

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
    updateSeoMetadata(listing);
  }

  function renderGallery() {
    const currentPhoto = getCurrentPhoto();
    const fallbackImage = createPlaceholderImage(state.listing?.title || "Мото Зона");
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

  function updateSeoMetadata(listing) {
    const pageTitle = `Мото Зона | ${cleanNullableText(listing.title) || "Обява"}`;
    const priceText = formatCurrency(
      listing.displayPrice ?? listing.priceEUR ?? listing.priceOriginal ?? 0,
      listing.displayCurrencyCode || listing.currencyCode || "EUR"
    );
    const locationText = buildLocationText(listing);
    const typeText = cleanNullableText([listing.subCategoryName, listing.subCategory2Name].filter(Boolean).join(" / "));
    const summary = [
      cleanNullableText(listing.title),
      typeText,
      locationText !== "вЂ”" ? locationText : null,
      priceText !== "вЂ”" ? priceText : null
    ].filter(Boolean).join(" | ");
    const pageDescription = summary || "Разгледай детайли за обява в Мото Зона.";
    const imageUrl = resolveSeoImageUrl(state.photos[0]?.fileUrl || "ImagesVideos/LogoMotoZonaNew.png");
    const listingId = listing?.id || getListingIdFromUrl();
    const canonicalUrl = listingId
      ? (window.Auth?.buildListingUrl?.(listingId, { absolute: true }) || window.location.href)
      : window.location.href;

    document.title = pageTitle;
    setMetaContent('meta[name="description"]', pageDescription);
    setMetaContent('meta[property="og:type"]', "product");
    setMetaContent('meta[property="og:title"]', pageTitle);
    setMetaContent('meta[property="og:description"]', pageDescription);
    setMetaContent('meta[property="og:image"]', imageUrl);
    setMetaContent('meta[property="og:image:alt"]', cleanNullableText(listing.title) || "Обява в Мото Зона");
    setMetaContent('meta[property="og:url"]', canonicalUrl, { attribute: "property", value: "og:url" });
    setMetaContent('meta[name="twitter:title"]', pageTitle);
    setMetaContent('meta[name="twitter:description"]', pageDescription);
    setMetaContent('meta[name="twitter:image"]', imageUrl);
    setMetaContent('meta[name="twitter:image:alt"]', cleanNullableText(listing.title) || "Обява в Мото Зона");
    setLinkHref('link[rel="canonical"]', canonicalUrl, { rel: "canonical" });
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
    if (window.Auth?.getListingIdFromLocation) {
      return window.Auth.getListingIdFromLocation(window.location);
    }

    const params = new URLSearchParams(window.location.search);
    const queryId = Number(params.get("id") || 0);
    if (Number.isFinite(queryId) && queryId > 0) {
      return queryId;
    }

    const match = window.location.pathname.match(/\/obiavi\/(\d+)(?:\/)?$/i);
    if (!match) {
      return null;
    }

    const pathId = Number(match[1] || 0);
    return Number.isFinite(pathId) && pathId > 0 ? pathId : null;
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
    const imageUrl = currentPhoto?.fileUrl || elements.mainPhoto?.src || createPlaceholderImage("Мото Зона");

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

      if (successMessage) alert(successMessage);
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

  function normalizePriceChangeType(value) {
    const normalized = String(value || "").trim().toUpperCase();

    if (normalized === "DOWN" || normalized === "UP") {
      return normalized;
    }

    return null;
  }

  function toFiniteNumber(value) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  function normalizeCurrencyCode(value) {
    const normalized = String(value || "").trim().toUpperCase();
    return normalized || null;
  }

  function areSamePrices(left, right) {
    return Math.round(Number(left) * 100) === Math.round(Number(right) * 100);
  }

  function buildPriceChangeSummary(listing) {
    const changeType = normalizePriceChangeType(listing?.lastPriceChangeType || listing?.LastPriceChangeType);

    if (!changeType) {
      return null;
    }

    const originalCurrency = normalizeCurrencyCode(listing?.currencyCode || listing?.CurrencyCode);
    const displayCurrency = normalizeCurrencyCode(listing?.displayCurrencyCode || listing?.DisplayCurrencyCode);
    const currentOriginal = toFiniteNumber(listing?.priceOriginal || listing?.PriceOriginal);
    const previousOriginal = toFiniteNumber(listing?.previousPriceOriginal || listing?.PreviousPriceOriginal);
    const currentEur = toFiniteNumber(listing?.priceEUR || listing?.PriceEUR);
    const previousEur = toFiniteNumber(listing?.previousPriceEUR || listing?.PreviousPriceEUR);

    if (
      originalCurrency &&
      displayCurrency === originalCurrency &&
      currentOriginal !== null &&
      previousOriginal !== null &&
      !areSamePrices(currentOriginal, previousOriginal)
    ) {
      return {
        changeType,
        oldText: formatCurrency(previousOriginal, originalCurrency),
        newText: formatCurrency(currentOriginal, originalCurrency)
      };
    }

    if (
      currentEur !== null &&
      previousEur !== null &&
      !areSamePrices(currentEur, previousEur)
    ) {
      return {
        changeType,
        oldText: formatCurrency(previousEur, "EUR"),
        newText: formatCurrency(currentEur, "EUR")
      };
    }

    if (
      originalCurrency &&
      currentOriginal !== null &&
      previousOriginal !== null &&
      !areSamePrices(currentOriginal, previousOriginal)
    ) {
      return {
        changeType,
        oldText: formatCurrency(previousOriginal, originalCurrency),
        newText: formatCurrency(currentOriginal, originalCurrency)
      };
    }

    return null;
  }

  function renderPriceChangeIndicatorHtml(listing) {
    const summary = buildPriceChangeSummary(listing);

    if (!summary) {
      return "";
    }

    const isDown = summary.changeType === "DOWN";
    const label = isDown
      ? `\u0426\u0435\u043d\u0430\u0442\u0430 \u0435 \u0441\u0432\u0430\u043b\u0435\u043d\u0430. \u0411\u0438\u043b\u0430 \u0435 ${summary.oldText}, \u0441\u0442\u0430\u043d\u0430\u043b\u0430 \u0435 ${summary.newText}.`
      : `\u0426\u0435\u043d\u0430\u0442\u0430 \u0435 \u043f\u043e\u0432\u0438\u0448\u0435\u043d\u0430. \u0411\u0438\u043b\u0430 \u0435 ${summary.oldText}, \u0441\u0442\u0430\u043d\u0430\u043b\u0430 \u0435 ${summary.newText}.`;

    return `
      <span
        class="price-change-indicator price-change-indicator--${isDown ? "down" : "up"}"
        role="button"
        tabindex="0"
        aria-label="${escapeHtml(label)}"
        aria-expanded="false"
        data-price-old="${escapeHtml(summary.oldText)}"
        data-price-new="${escapeHtml(summary.newText)}"
      >${isDown ? "&darr;" : "&uarr;"}</span>
    `.trim();
  }

  function bindPriceChangeIndicatorEvents() {
    document.addEventListener("click", onPriceChangeIndicatorClick);
    document.addEventListener("keydown", onPriceChangeIndicatorKeydown);
    document.addEventListener("mouseover", onPriceChangeIndicatorMouseOver);
    document.addEventListener("mouseout", onPriceChangeIndicatorMouseOut);
    document.addEventListener("focusin", onPriceChangeIndicatorFocusIn);
    document.addEventListener("focusout", onPriceChangeIndicatorFocusOut);
    window.addEventListener("resize", closePriceChangePopover);
    document.addEventListener("scroll", closePriceChangePopover, true);
  }

  function findPriceChangeIndicator(target) {
    return target instanceof Element
      ? target.closest(".price-change-indicator[data-price-old][data-price-new]")
      : null;
  }

  function supportsHoverPopover() {
    return window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  }

  function onPriceChangeIndicatorClick(event) {
    const indicator = findPriceChangeIndicator(event.target);

    if (indicator) {
      event.preventDefault();
      togglePriceChangePopover(indicator);
      return;
    }

    if (activePriceChangeIndicator) {
      closePriceChangePopover();
    }
  }

  function onPriceChangeIndicatorKeydown(event) {
    const indicator = findPriceChangeIndicator(event.target);

    if (event.key === "Escape" && activePriceChangeIndicator) {
      closePriceChangePopover();
      return;
    }

    if (!indicator) {
      return;
    }

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      togglePriceChangePopover(indicator);
    }
  }

  function onPriceChangeIndicatorMouseOver(event) {
    if (!supportsHoverPopover()) {
      return;
    }

    const indicator = findPriceChangeIndicator(event.target);
    if (indicator) {
      openPriceChangePopover(indicator);
    }
  }

  function onPriceChangeIndicatorMouseOut(event) {
    if (!supportsHoverPopover()) {
      return;
    }

    const indicator = findPriceChangeIndicator(event.target);
    if (!indicator) {
      return;
    }

    if (indicator.contains(event.relatedTarget)) {
      return;
    }

    closePriceChangePopover();
  }

  function onPriceChangeIndicatorFocusIn(event) {
    const indicator = findPriceChangeIndicator(event.target);
    if (indicator) {
      openPriceChangePopover(indicator);
    }
  }

  function onPriceChangeIndicatorFocusOut(event) {
    const indicator = findPriceChangeIndicator(event.target);
    if (!indicator) {
      return;
    }

    if (indicator.contains(event.relatedTarget)) {
      return;
    }

    closePriceChangePopover();
  }

  function togglePriceChangePopover(indicator) {
    if (activePriceChangeIndicator === indicator) {
      closePriceChangePopover();
      return;
    }

    openPriceChangePopover(indicator);
  }

  function ensurePriceChangePopover() {
    if (priceChangePopoverEl) {
      return priceChangePopoverEl;
    }

    priceChangePopoverEl = document.createElement("div");
    priceChangePopoverEl.className = "price-change-popover";
    priceChangePopoverEl.setAttribute("aria-hidden", "true");
    document.body.appendChild(priceChangePopoverEl);

    return priceChangePopoverEl;
  }

  function openPriceChangePopover(indicator) {
    const oldText = indicator.dataset.priceOld;
    const newText = indicator.dataset.priceNew;
    const isDown = indicator.classList.contains("price-change-indicator--down");
    const newPriceStateClass = isDown ? "price-change-popover__row--down" : "price-change-popover__row--up";

    if (!oldText || !newText) {
      return;
    }

    const popover = ensurePriceChangePopover();

    if (activePriceChangeIndicator && activePriceChangeIndicator !== indicator) {
      activePriceChangeIndicator.classList.remove("is-active");
      activePriceChangeIndicator.setAttribute("aria-expanded", "false");
    }

    popover.innerHTML = `
      <div class="price-change-popover__title">Промяна в цената</div>
      <div class="price-change-popover__row">
        <span>Стара:</span>
        <strong>${escapeHtml(oldText)}</strong>
      </div>
      <div class="price-change-popover__row price-change-popover__row--new ${newPriceStateClass}">
        <span>Нова:</span>
        <strong>${escapeHtml(newText)}</strong>
      </div>
    `.trim();

    popover.classList.add("is-visible");
    popover.setAttribute("aria-hidden", "false");
    activePriceChangeIndicator = indicator;
    indicator.classList.add("is-active");
    indicator.setAttribute("aria-expanded", "true");

    positionPriceChangePopover(indicator, popover);
  }

  function positionPriceChangePopover(indicator, popover) {
    const rect = indicator.getBoundingClientRect();
    const popoverRect = popover.getBoundingClientRect();
    const gap = 12;
    const canPlaceAbove = rect.top >= popoverRect.height + gap + 12;
    const top = canPlaceAbove
      ? rect.top - popoverRect.height - gap
      : Math.min(window.innerHeight - popoverRect.height - 12, rect.bottom + gap);
    const left = Math.min(
      Math.max(12, rect.left + rect.width / 2 - popoverRect.width / 2),
      window.innerWidth - popoverRect.width - 12
    );

    popover.style.top = `${Math.max(12, top)}px`;
    popover.style.left = `${left}px`;
  }

  function closePriceChangePopover() {
    if (activePriceChangeIndicator) {
      activePriceChangeIndicator.classList.remove("is-active");
      activePriceChangeIndicator.setAttribute("aria-expanded", "false");
      activePriceChangeIndicator = null;
    }

    if (!priceChangePopoverEl) {
      return;
    }

    priceChangePopoverEl.classList.remove("is-visible");
    priceChangePopoverEl.setAttribute("aria-hidden", "true");
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
    const safeLabel = escapeXml(label || "Мото Зона");

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
        <text x="50%" y="58%" dominant-baseline="middle" text-anchor="middle" font-family="Arial, sans-serif" font-size="28" font-weight="600" fill="#707f91">Мото Зона</text>
      </svg>
    `.trim();

    return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
  }

  function resolveSeoImageUrl(value) {
    try {
      return new URL(value, window.location.href).toString();
    } catch {
      return value;
    }
  }

  function setMetaContent(selector, content, definition = null) {
    if (!content) return;

    let element = document.querySelector(selector);
    if (!element && definition) {
      element = document.createElement("meta");
      element.setAttribute(definition.attribute, definition.value);
      document.head.appendChild(element);
    }

    if (element) {
      element.setAttribute("content", content);
    }
  }

  function setLinkHref(selector, href, definition = null) {
    if (!href) return;

    let element = document.querySelector(selector);
    if (!element && definition) {
      element = document.createElement("link");
      Object.entries(definition).forEach(([key, value]) => {
        element.setAttribute(key, value);
      });
      document.head.appendChild(element);
    }

    if (element) {
      element.setAttribute("href", href);
    }
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
