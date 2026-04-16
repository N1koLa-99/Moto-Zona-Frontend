(() => {
  const API_BASE_URL = window.Auth?.API_BASE_URL || "https://motomarketapi.azurewebsites.net";

  const PRICING = {
    VIP_PRICE_EUR: 7.0,
    TOP_PRICE_EUR: 4.0,
    VIP_DAYS: 7,
    TOP_DAYS: 7,
    PRIVATE_REFRESH_EUR: 0.5,
    COMPANY_REFRESH_EUR: 0.25,
    PRIVATE_OVER_LIMIT_PUBLISH_EUR: 1.0,
    COMPANY_OVER_LIMIT_PUBLISH_EUR: 0.5
  };

  const state = {
    currentSection: null,
    loaded: {
      dashboard: false,
      listings: false,
      favorites: false,
      payments: false,
      editProfile: false
    },
    data: {
      dashboard: null,
      listings: null,
      favorites: null,
      payments: null,
      editProfile: null
    },
    pages: {
      listings: 1,
      favorites: 1,
      payments: 1
    },
    pageSizes: {
      listings: 6,
      favorites: 6,
      payments: 10
    },
    listingFilters: {
      search: "",
      promotion: "ALL"
    },
    listingCatalog: {
      allItems: null
    },
    accountType: null,
    lookups: {
      loaded: false,
      all: null,
      countries: [],
      regionsByCountry: {},
      citiesByRegion: {},
      mainCategories: [],
      vehicleClasses: [],
      vehicleTypes: [],
      gearTypes: [],
      helmetTypes: [],
      partTypes: [],
      accessoryTypes: [],
      licenseCategories: [],
      conditions: [],
      brandsByType: {
        VEHICLE: [],
        GEAR: [],
        PART: [],
        ACCESSORY: []
      }
    },
    paymentListingPreviewCache: {},
    modal: {
      isOpen: false,
      listingId: null,
      listingDetails: null,
      photos: [],
      initialBlobNames: [],
      categoryCode: null
    }
  };

  const elements = {
    profileName: document.getElementById("profileName"),
    profileMeta: document.getElementById("profileMeta"),
    profileAvatar: document.getElementById("profileAvatar"),
    sectionContent: document.getElementById("sectionContent"),
    adminPanelLink: document.getElementById("adminPanelLink"),
    logoutBtn: document.getElementById("logoutBtn"),
    toastStack: document.getElementById("toastStack"),
    navButtons: Array.from(document.querySelectorAll(".profile-nav__btn")),
    editProfileNavBtn: document.getElementById("editProfileNavBtn"),

    editListingModalOverlay: document.getElementById("editListingModalOverlay"),
    editListingModal: document.getElementById("editListingModal"),
    closeEditListingModalBtn: document.getElementById("closeEditListingModalBtn"),
    cancelEditListingBtn: document.getElementById("cancelEditListingBtn"),
    saveEditListingBtn: document.getElementById("saveEditListingBtn"),
    editListingForm: document.getElementById("editListingForm"),

    editListingId: document.getElementById("editListingId"),
    editMainCategoryLookupId: document.getElementById("editMainCategoryLookupId"),
    editExistingPromotionType: document.getElementById("editExistingPromotionType"),
    editListingModalSubtitle: document.getElementById("editListingModalSubtitle"),

    editMainPreview: document.getElementById("editMainPreview"),
    editCurrentPromotionType: document.getElementById("editCurrentPromotionType"),
    editCurrentPromotionBadge: document.getElementById("editCurrentPromotionBadge"),
    editPromotionRemaining: document.getElementById("editPromotionRemaining"),
    editLastRefreshInfo: document.getElementById("editLastRefreshInfo"),
    editPromotionStatusNote: document.getElementById("editPromotionStatusNote"),

    editAccountTypeValue: document.getElementById("editAccountTypeValue"),
    editRefreshPriceValue: document.getElementById("editRefreshPriceValue"),
    editPublishOverLimitPriceValue: document.getElementById("editPublishOverLimitPriceValue"),
    editVipPriceText: document.getElementById("editVipPriceText"),
    editTopPriceText: document.getElementById("editTopPriceText"),
    editRefreshPriceText: document.getElementById("editRefreshPriceText"),
    editSubscriptionRulesText: document.getElementById("editSubscriptionRulesText"),

    modalRefreshBtn: document.getElementById("modalRefreshBtn"),
    modalTopBtn: document.getElementById("modalTopBtn"),
    modalVipBtn: document.getElementById("modalVipBtn"),
    modalDeleteListingBtn: document.getElementById("modalDeleteListingBtn"),

    editVehicleSection: document.getElementById("editVehicleSection"),
    editGearSection: document.getElementById("editGearSection"),
    editPartAccessorySection: document.getElementById("editPartAccessorySection"),

    editTitle: document.getElementById("editTitle"),
    editDescription: document.getElementById("editDescription"),
    editBrandId: document.getElementById("editBrandId"),
    editModelId: document.getElementById("editModelId"),
    editItemModelText: document.getElementById("editItemModelText"),
    editConditionLookupId: document.getElementById("editConditionLookupId"),

    editSubCategoryLookupId: document.getElementById("editSubCategoryLookupId"),
    editSubCategory2LookupId: document.getElementById("editSubCategory2LookupId"),
    editVehicleYear: document.getElementById("editVehicleYear"),
    editEngineCC: document.getElementById("editEngineCC"),
    editHorsePower: document.getElementById("editHorsePower"),
    editMileage: document.getElementById("editMileage"),
    editLicenseCategoryLookupId: document.getElementById("editLicenseCategoryLookupId"),
    editColor: document.getElementById("editColor"),

    editGearTypeId: document.getElementById("editGearTypeId"),
    editHelmetTypeId: document.getElementById("editHelmetTypeId"),
    editGearYear: document.getElementById("editGearYear"),

    editPartAccessoryTypeId: document.getElementById("editPartAccessoryTypeId"),

    editPriceOriginal: document.getElementById("editPriceOriginal"),
    editCurrencyCode: document.getElementById("editCurrencyCode"),
    editExchangeRateToEUR: document.getElementById("editExchangeRateToEUR"),
    editContactName: document.getElementById("editContactName"),
    editContactPhone: document.getElementById("editContactPhone"),

    editCountryId: document.getElementById("editCountryId"),
    editRegionId: document.getElementById("editRegionId"),
    editCityId: document.getElementById("editCityId"),

    editPhotosInput: document.getElementById("editPhotosInput"),
    editPhotoManager: document.getElementById("editPhotoManager"),

    confirmModalOverlay: document.getElementById("confirmModalOverlay"),
    confirmModalTitle: document.getElementById("confirmModalTitle"),
    confirmModalText: document.getElementById("confirmModalText"),
    closeConfirmModalBtn: document.getElementById("closeConfirmModalBtn"),
    confirmCancelBtn: document.getElementById("confirmCancelBtn"),
    confirmOkBtn: document.getElementById("confirmOkBtn")
  };

  document.addEventListener("DOMContentLoaded", init);

  function init() {
    if (!window.Auth?.isLoggedIn?.()) {
      window.Auth?.redirectToLogin?.();
      return;
    }

    if (elements.logoutBtn) {
      elements.logoutBtn.textContent = "Изход от профила";
      elements.logoutBtn.title = "Изход от профила";
      elements.logoutBtn.setAttribute("aria-label", "Изход от профила");
    }

    hydrateStaticUserInfo();
    bindStaticEvents();
    renderIntroState();
  }

  function bindStaticEvents() {
    elements.logoutBtn?.addEventListener("click", onLogoutClick);

    elements.navButtons.forEach((button) => {
      button.addEventListener("click", () => {
        const section = button.dataset.section;
        openSection(section);
      });
    });

    document.addEventListener("click", onDocumentClick);
    document.addEventListener("change", onDocumentChange);
    document.addEventListener("input", onDocumentInput);
    document.addEventListener("submit", onDocumentSubmit);

    elements.closeEditListingModalBtn?.addEventListener("click", () => closeEditModal(true));
    elements.cancelEditListingBtn?.addEventListener("click", () => closeEditModal(true));
    elements.editListingModalOverlay?.addEventListener("click", (event) => {
      if (event.target === elements.editListingModalOverlay) {
        closeEditModal(true);
      }
    });

    elements.editListingForm?.addEventListener("submit", onEditFormSubmit);
    elements.modalRefreshBtn?.addEventListener("click", onModalRefreshClick);
    elements.modalTopBtn?.addEventListener("click", () => onModalPromoteClick("TOP"));
    elements.modalVipBtn?.addEventListener("click", () => onModalPromoteClick("VIP"));
    elements.modalDeleteListingBtn?.addEventListener("click", onModalDeleteClick);

    elements.editBrandId?.addEventListener("change", onEditBrandChange);
    elements.editSubCategoryLookupId?.addEventListener("change", onVehicleClassChange);
    elements.editCountryId?.addEventListener("change", onEditCountryChange);
    elements.editRegionId?.addEventListener("change", onEditRegionChange);
    elements.editGearTypeId?.addEventListener("change", onGearTypeChange);
    elements.editCurrencyCode?.addEventListener("change", onCurrencyChange);

    elements.editPhotosInput?.addEventListener("change", onNewPhotosSelected);
    elements.editPhotoManager?.addEventListener("click", onPhotoManagerClick);

    document.addEventListener("keydown", (event) => {
      if (event.key !== "Escape") return;

      if (!elements.confirmModalOverlay?.classList.contains("hidden")) {
        closeConfirmModal();
        return;
      }

      if (!elements.editListingModalOverlay?.classList.contains("hidden")) {
        closeEditModal(true);
      }
    });
  }

  async function onLogoutClick() {
    const confirmed = await showConfirmModal({
      title: "Изход от профила",
      text: "Сигурни ли сте, че искате да напуснете профила си?"
    });

    if (!confirmed) return;

    window.Auth?.logoutUser?.();
  }

  function onDocumentSubmit(event) {
    const form = event.target;
    if (!(form instanceof HTMLFormElement)) return;

    if (form.id === "privateProfileForm") {
      event.preventDefault();
      void handlePrivateProfileSubmit(form);
      return;
    }

    if (form.id === "deleteProfileForm") {
      event.preventDefault();
      void handleDeleteProfileSubmit(form);
      return;
    }

    if (form.id === "changeEmailForm") {
      event.preventDefault();
      void handleChangeEmailSubmit(form);
      return;
    }

    if (form.id === "changePasswordForm") {
      event.preventDefault();
      void handleChangePasswordSubmit(form);
    }
  }

  function onDocumentChange(event) {
    const target = event.target;
    if (!(target instanceof HTMLSelectElement)) return;

    if (target.id === "profileCountryId") {
      void onPrivateProfileCountryChange(target.value);
      return;
    }

    if (target.id === "profileRegionId") {
      void onPrivateProfileRegionChange(target.value);
    }
  }

  function onDocumentInput(event) {
    const target = event.target;
    if (!(target instanceof HTMLInputElement)) return;

    if (target.matches("[data-listings-search]")) {
      state.listingFilters.search = target.value || "";
      state.pages.listings = 1;
      syncListingsViewData();
      renderCurrentSection();
    }
  }

  function onDocumentClick(event) {
    const openSectionBtn = event.target.closest("[data-open-section]");
    if (openSectionBtn) {
      openSection(openSectionBtn.dataset.openSection);
      return;
    }

    const actionBtn = event.target.closest("[data-action]");
    if (!actionBtn) return;

    const action = actionBtn.dataset.action;
    const id = actionBtn.dataset.id;
    const section = actionBtn.dataset.section;
    const page = Number(actionBtn.dataset.page || 0);

    if (action === "section-refresh") {
      openSection(section || state.currentSection, { force: true });
      return;
    }

    if (action === "toggle-profile-security") {
      toggleProfileSecurityTools();
      return;
    }

    if (action === "open-profile-settings-panel") {
      const panel = String(actionBtn.dataset.panel || "").trim().toLowerCase();
      const isActive = actionBtn.getAttribute("aria-pressed") === "true";

      if (isActive) {
        closeProfileSecurityPanels();
        return;
      }

      openProfileSecurityPanel(panel);
      return;
    }

    if (action === "close-profile-settings-panel") {
      closeProfileSecurityPanels();
      return;
    }

    if (action === "set-listings-promotion-filter") {
      state.listingFilters.promotion = normalizeListingsPromotionFilter(actionBtn.dataset.filter);
      state.pages.listings = 1;
      syncListingsViewData();
      renderCurrentSection();
      return;
    }

    if (action === "go-page") {
      if (!section || !page) return;

      if (section === "listings") {
        state.pages.listings = page;
        syncListingsViewData();
        renderCurrentSection();
        window.scrollTo({
          top: document.querySelector(".profile-page")?.offsetTop || 0,
          behavior: "smooth"
        });
        return;
      }

      openSection(section, { force: section !== "listings", page });
      window.scrollTo({
        top: document.querySelector(".profile-page")?.offsetTop || 0,
        behavior: "smooth"
      });
      return;
    }

    if (action === "go-create-listing") {
      window.Auth?.redirectToCreateListing?.();
      return;
    }

    if (action === "view-listing") {
      if (!id) return;
      window.location.href = `ListingDetails.html?id=${encodeURIComponent(id)}`;
      return;
    }

    if (action === "open-edit-modal") {
      if (!id) return;
      openEditModal(id);
      return;
    }

    if (action === "remove-favorite") {
      if (!id) return;
      handleRemoveFavorite(id);
    }
  }

  function hydrateStaticUserInfo() {
    const storedUser = readStoredUser();
    const accountType = normalizeAccountType(storedUser?.accountType);
    state.accountType = accountType;
    const displayName = buildProfileDisplayName(storedUser) || "MotoZone User";

    elements.profileName.textContent = displayName;
    elements.profileMeta.textContent = getAccountTypeLabel(accountType);
    elements.profileAvatar.textContent = (displayName || "M").trim().charAt(0).toUpperCase() || "M";
    syncEditProfileAvailability(accountType);
    syncAdminPanelAvailability(storedUser);
  }

  async function ensureAccountTypeLoaded() {
    if (state.accountType) return state.accountType;

    const storedUser = readStoredUser();
    const fromStorage = normalizeAccountType(storedUser?.accountType);
    if (fromStorage) {
      state.accountType = fromStorage;
      return state.accountType;
    }

    try {
      const dashboard = await authFetchJson(`${API_BASE_URL}/api/profile/dashboard`);
      state.data.dashboard = dashboard;
      state.loaded.dashboard = true;
      state.accountType = normalizeAccountType(dashboard?.accountType);
      syncProfileMetaFromDashboard(dashboard);
    } catch {
      state.accountType = "PRIVATE";
    }

    return state.accountType;
  }

  function syncProfileMetaFromDashboard(data) {
    const accountType = normalizeAccountType(data?.accountType);
    if (accountType) {
      state.accountType = accountType;
      elements.profileMeta.textContent = getAccountTypeLabel(accountType);
      syncEditProfileAvailability(accountType);
    }

    const fullName =
      buildProfileDisplayName(data) ||
      readStaticUserField("fullName") ||
      readStaticUserField("email") ||
      elements.profileName.textContent ||
      "MotoZone User";

    elements.profileName.textContent = fullName;
    elements.profileAvatar.textContent = (fullName || "M").trim().charAt(0).toUpperCase() || "M";
    syncAdminPanelAvailability(data);
  }

  function syncEditProfileAvailability(accountTypeRaw) {
    const isPrivate = normalizeAccountType(accountTypeRaw || state.accountType || "PRIVATE") === "PRIVATE";
    elements.editProfileNavBtn?.classList.toggle("hidden", !isPrivate);
  }

  function syncAdminPanelAvailability(user = readStoredUser()) {
    elements.adminPanelLink?.classList.toggle("hidden", !window.Auth?.isAdminUser?.(user));
  }

  function buildProfileDisplayName(profile) {
    if (!profile) return "";

    return (
      profile.companyName ||
      profile.fullName ||
      [profile.firstName, profile.lastName].filter(Boolean).join(" ").trim() ||
      profile.email ||
      ""
    );
  }

  function syncStoredUserProfile(profile) {
    if (!profile) return;

    const currentUser = readStoredUser() || {};
    const nextUser = {
      ...currentUser,
      ...profile,
      accountType: normalizeAccountType(profile.accountType || currentUser.accountType || "PRIVATE"),
      fullName: buildProfileDisplayName(profile) || currentUser.fullName || ""
    };

    window.Auth?.setCurrentUser?.(nextUser);
    syncAdminPanelAvailability(nextUser);
  }

  async function openSection(section, options = {}) {
    if (!section) return;

    const force = Boolean(options.force);
    const targetPage = Number(options.page || 0);

    if (targetPage > 0 && state.pages[section]) {
      state.pages[section] = targetPage;
    }

    state.currentSection = section;
    setActiveSectionButton(section);

    if (!force && state.loaded[section] && state.data[section]) {
      renderCurrentSection();
      return;
    }

    renderLoadingState(section);

    try {
      await loadSectionData(section);

      if (section !== "dashboard") {
        const currentData = state.data[section];
        const requestedPage = state.pages[section];
        const totalPages = Number(currentData?.totalPages || 0);

        if (totalPages > 0 && requestedPage > totalPages) {
          state.pages[section] = totalPages;

          if (section === "listings") {
            syncListingsViewData();
          } else {
            await loadSectionData(section);
          }
        }
      }

      if (section === "payments") {
        await preloadPaymentListingPreviews(state.data.payments?.items || []);
      }

      renderCurrentSection();
    } catch (error) {
      console.error(error);
      renderErrorState(error.message || "Възникна проблем при зареждането.");
    }
  }

  function setActiveSectionButton(section) {
    elements.navButtons.forEach((button) => {
      button.classList.toggle("active", button.dataset.section === section);
    });
  }

  async function loadSectionData(section) {
    switch (section) {
      case "dashboard": {
        state.data.dashboard = await authFetchJson(`${API_BASE_URL}/api/profile/dashboard`);
        state.loaded.dashboard = true;
        state.accountType = normalizeAccountType(state.data.dashboard?.accountType);
        syncProfileMetaFromDashboard(state.data.dashboard);
        break;
      }

      case "listings": {
        state.listingCatalog.allItems = await fetchAllMyListings();
        syncListingsViewData();
        state.loaded.listings = true;
        break;
      }

      case "favorites": {
        const page = state.pages.favorites;
        const pageSize = state.pageSizes.favorites;
        state.data.favorites = await authFetchJson(
          `${API_BASE_URL}/api/profile/favorites?page=${page}&pageSize=${pageSize}`
        );
        state.loaded.favorites = true;
        break;
      }

      case "payments": {
        const page = state.pages.payments;
        const pageSize = state.pageSizes.payments;
        state.data.payments = await authFetchJson(
          `${API_BASE_URL}/api/profile/payments?page=${page}&pageSize=${pageSize}`
        );
        state.loaded.payments = true;
        break;
      }

      case "editProfile": {
        state.data.editProfile = await authFetchJson(`${API_BASE_URL}/api/auth/me`);
        state.loaded.editProfile = true;
        state.accountType = normalizeAccountType(state.data.editProfile?.accountType);
        syncStoredUserProfile(state.data.editProfile);
        syncProfileMetaFromDashboard(state.data.editProfile);

        if (state.accountType === "PRIVATE") {
          await ensureLookupsLoaded();
        }

        break;
      }

      default:
        throw new Error("Невалидна секция.");
    }
  }

  function renderCurrentSection() {
    switch (state.currentSection) {
      case "dashboard":
        renderDashboardSection(state.data.dashboard);
        break;
      case "listings":
        renderListingsSection(state.data.listings);
        break;
      case "favorites":
        renderFavoritesSection(state.data.favorites);
        break;
      case "payments":
        renderPaymentsSection(state.data.payments);
        break;
      case "editProfile":
        renderEditProfileSection(state.data.editProfile);
        break;
      default:
        renderIntroState();
        break;
    }
  }

  function renderIntroState() {
    elements.sectionContent.innerHTML = `
      <div class="intro-state">
        <div>
          <div class="intro-state__badge">Профил</div>
          <h2>Избери секция</h2>
          <p>
            Дашборд, Моите обяви, Любими, Плащания и при частен акаунт - Редактиране на профила.
            Данните ще се заредят чак когато отвориш конкретната секция.
          </p>
        </div>
      </div>
    `;
  }

  function renderLoadingState(section) {
    const title = getSectionTitle(section);

    elements.sectionContent.innerHTML = `
      <div class="loading-state">
        <div>
          <h2>Зареждаме: ${escapeHtml(title)}</h2>
          <p>Заявката се пуска чак сега, защото отвори тази секция.</p>
        </div>
      </div>
    `;
  }

  function renderErrorState(message) {
    elements.sectionContent.innerHTML = `
      <div class="error-state">
        <div>
          <h2>Грешка</h2>
          <p>${escapeHtml(message || "Възникна проблем.")}</p>
          <div style="margin-top:18px;">
            <button class="header-btn" type="button" data-open-section="${escapeHtml(state.currentSection || "dashboard")}">
              Опитай пак
            </button>
          </div>
        </div>
      </div>
    `;
  }

  function renderDashboardSection(data) {
    syncProfileMetaFromDashboard(data);

    const accountType = normalizeAccountType(data?.accountType || state.accountType || "PRIVATE");
    const pricing = getPricingByAccountType(accountType);

    const fullName = pick(data, "fullName") || readStaticUserField("fullName") || "-";
    const companyName = pick(data, "companyName") || "";
    const email = pick(data, "email") || readStaticUserField("email") || "-";
    const phone = pick(data, "phone") || readStaticUserField("phone") || "-";

    const publishedListingsTotalCount = Number(pick(data, "publishedListingsTotalCount") || 0);
    const activeListingsCount = Number(pick(data, "activeListingsCount") || 0);
    const favoritesCount = Number(pick(data, "favoritesCount") || 0);
    const paidListingActionsCount = Number(pick(data, "paidListingActionsCount") || 0);
    const totalPaymentsCount = Number(pick(data, "totalPaymentsCount") || 0);
    const totalPaidAmountEUR = Number(pick(data, "totalPaidAmountEUR") || 0);
    const freeUploadsRemainingNow = Number(pick(data, "freeUploadsRemainingNow") || 0);
    const overFreeLimitCount = Number(pick(data, "overFreeLimitCount") || 0);

    const isPrivate = accountType === "PRIVATE";

    const privateUsed = Number(pick(data, "privateFreeUsedLifetime") || 0);
    const privateLimit = Number(pick(data, "privateFreeLimitLifetime") || 3);

    const companyStarterUsed = Number(pick(data, "companyStarterFreeUsedLifetime") || 0);
    const companyStarterLimit = Number(pick(data, "companyStarterFreeLimitLifetime") || 30);
    const companyMonthlyUsed = Number(pick(data, "companyMonthlyFreeUsedCurrentMonth") || 0);
    const companyMonthlyRemaining = Number(pick(data, "companyMonthlyFreeRemainingCurrentMonth") || 0);
    const isInMonthlyCompanyQuotaMode = Boolean(pick(data, "isInMonthlyCompanyQuotaMode"));

    const progressUsed = isPrivate ? privateUsed : (isInMonthlyCompanyQuotaMode ? companyMonthlyUsed : companyStarterUsed);
    const progressLimit = isPrivate ? privateLimit : (isInMonthlyCompanyQuotaMode ? 10 : companyStarterLimit);
    const progressPercent = Math.max(0, Math.min(100, Math.round((progressUsed / Math.max(progressLimit, 1)) * 100)));

    const quotaModeText = isPrivate
      ? `Частен акаунт: имаш до ${privateLimit} безплатни качвания общо. След това всяко качване е ${formatMoney(pricing.publishOverLimitEUR, "EUR")}.`
      : isInMonthlyCompanyQuotaMode
        ? `Фирмен акаунт: starter лимитът е изчерпан. В момента си в месечен режим: 10 безплатни качвания на месец. След това всяко качване е ${formatMoney(pricing.publishOverLimitEUR, "EUR")}.`
        : `Фирмен акаунт: имаш до ${companyStarterLimit} стартови безплатни качвания. След това минаваш на 10 безплатни качвания месечно.`;

    elements.sectionContent.innerHTML = `
      <div class="section-head">
        <div class="section-head__copy">
          <h2>Дашборд</h2>
          <p>Общ преглед на акаунта, лимитите, плащанията и цените за този профил.</p>
        </div>

        <div class="section-head__actions">
          <button class="ghost-btn" type="button" data-action="section-refresh" data-section="dashboard">Обнови</button>
          <button class="action-btn action-btn--primary" type="button" data-action="go-create-listing">Качи нова обява</button>
        </div>
      </div>

      <div class="section-body">
        <div class="stats-grid">
          <article class="stat-card">
            <div class="stat-card__label">Публикувани обяви общо</div>
            <div class="stat-card__value">${publishedListingsTotalCount}</div>
          </article>

          <article class="stat-card">
            <div class="stat-card__label">Активни обяви</div>
            <div class="stat-card__value">${activeListingsCount}</div>
          </article>

          <article class="stat-card">
            <div class="stat-card__label">Любими обяви</div>
            <div class="stat-card__value">${favoritesCount}</div>
          </article>

          <article class="stat-card">
            <div class="stat-card__label">Платени действия</div>
            <div class="stat-card__value">${paidListingActionsCount}</div>
          </article>

          <article class="stat-card">
            <div class="stat-card__label">Общо плащания</div>
            <div class="stat-card__value">${totalPaymentsCount}</div>
          </article>

          <article class="stat-card">
            <div class="stat-card__label">Платено общо</div>
            <div class="stat-card__value">${escapeHtml(formatMoney(totalPaidAmountEUR, "EUR"))}</div>
          </article>

          <article class="stat-card">
            <div class="stat-card__label">Безплатни качвания в момента</div>
            <div class="stat-card__value">${freeUploadsRemainingNow}</div>
          </article>

          <article class="stat-card">
            <div class="stat-card__label">Качвания над free лимита</div>
            <div class="stat-card__value">${overFreeLimitCount}</div>
          </article>
        </div>

        <div class="info-grid">
          <article class="info-card">
            <h3>Информация за акаунта</h3>

            <div class="info-list">
              ${
                companyName
                  ? `
                    <div class="info-row">
                      <div class="info-row__label">Фирма</div>
                      <div class="info-row__value">${escapeHtml(companyName)}</div>
                    </div>
                  `
                  : `
                    <div class="info-row">
                      <div class="info-row__label">Име</div>
                      <div class="info-row__value">${escapeHtml(fullName)}</div>
                    </div>
                  `
              }

              <div class="info-row">
                <div class="info-row__label">Тип акаунт</div>
                <div class="info-row__value">${escapeHtml(getAccountTypeLabel(accountType))}</div>
              </div>

              <div class="info-row">
                <div class="info-row__label">Email</div>
                <div class="info-row__value">${escapeHtml(email)}</div>
              </div>

              <div class="info-row">
                <div class="info-row__label">Телефон</div>
                <div class="info-row__value">${escapeHtml(phone)}</div>
              </div>

            </div>
          </article>

          <article class="quota-card">
            <div class="quota-card__top">
              <h3>Лимит за качване</h3>
              <span class="badge ${isPrivate ? "badge--primary" : "badge--dark"}">${escapeHtml(accountType)}</span>
            </div>

            <div class="progress" aria-hidden="true">
              <div class="progress__bar" style="width:${progressPercent}%"></div>
            </div>

            <p class="quota-card__hint">
              Използвани: <strong>${progressUsed}</strong> / <strong>${progressLimit}</strong>
            </p>

            <div style="margin-top:16px;" class="info-list">
              ${
                isPrivate
                  ? `
                    <div class="info-row">
                      <div class="info-row__label">Безплатни качвания общо</div>
                      <div class="info-row__value">${privateUsed} / ${privateLimit}</div>
                    </div>
                  `
                  : `
                    <div class="info-row">
                      <div class="info-row__label">Starter безплатни качвания</div>
                      <div class="info-row__value">${companyStarterUsed} / ${companyStarterLimit}</div>
                    </div>

                    <div class="info-row">
                      <div class="info-row__label">Месечни безплатни качвания</div>
                      <div class="info-row__value">${companyMonthlyUsed} / 10</div>
                    </div>

                    <div class="info-row">
                      <div class="info-row__label">Остават този месец</div>
                      <div class="info-row__value">${companyMonthlyRemaining}</div>
                    </div>
                  `
              }

              <div class="info-row">
                <div class="info-row__label">Остават в момента</div>
                <div class="info-row__value">${freeUploadsRemainingNow}</div>
              </div>

            </div>

            <div style="margin-top:16px;" class="quota-card__hint">
              ${escapeHtml(quotaModeText)}
            </div>
          </article>
        </div>
      </div>
    `;
  }

  function renderEditProfileSection(data) {
    syncProfileMetaFromDashboard(data);

    const accountType = normalizeAccountType(data?.accountType || state.accountType || "PRIVATE");
    const currentEmail = pick(data, "email") || readStaticUserField("email") || "-";

    if (accountType !== "PRIVATE") {
      elements.sectionContent.innerHTML = `
        <div class="section-head">
          <div class="section-head__copy">
            <h2>Редактиране на профила</h2>
            <p>Само частен акаунт може да променя тези данни през профилната страница.</p>
          </div>

          <div class="section-head__actions">
            <button class="ghost-btn" type="button" data-open-section="dashboard">Към дашборда</button>
          </div>
        </div>

        <div class="section-body">
          <div class="settings-shell">
            <article class="settings-card settings-card--notice">
              <div class="settings-card__head">
                <div>
                  <div class="settings-card__eyebrow">Профил</div>
                  <h3>Тази секция не е активна за фирмен акаунт</h3>
                </div>
                <span class="badge badge--dark">COMPANY</span>
              </div>

              <p class="settings-note">
                Само частен акаунт може да редактира профилните си данни самостоятелно, затова тази секция е скрита за фирми.
              </p>

              <div class="info-list">
                <div class="info-row">
                  <div class="info-row__label">Текущ имейл</div>
                  <div class="info-row__value">${escapeHtml(currentEmail)}</div>
                </div>

                <div class="info-row">
                  <div class="info-row__label">Тип акаунт</div>
                  <div class="info-row__value">${escapeHtml(getAccountTypeLabel(accountType))}</div>
                </div>
              </div>
            </article>
          </div>
        </div>
      `;
      return;
    }

    const firstName = pick(data, "firstName") || "";
    const lastName = pick(data, "lastName") || "";
    const phone = pick(data, "phone") || "";

    elements.sectionContent.innerHTML = `
      <div class="section-head">
        <div class="section-head__copy">
          <h2>Редактиране на профила</h2>
          <p>Промени личните си данни, а имейлът и паролата се управляват отделно по-долу.</p>
        </div>

        <div class="section-head__actions">
          <button class="ghost-btn" type="button" data-action="section-refresh" data-section="editProfile">Обнови</button>
        </div>
      </div>

      <div class="section-body">
        <div class="settings-shell">
          <div class="settings-grid">
            <article class="settings-card settings-card--editor">
              <div class="settings-card__head">
                <div>
                  <div class="settings-card__eyebrow">Основни данни</div>
                  <h3>Редакция на private профил</h3>
                </div>
                <span class="badge badge--primary">PRIVATE</span>
              </div>

              <p class="settings-note">
                Тук можеш да обновиш име, фамилия, телефон и локация на своя private профил.
              </p>

              <form class="settings-form" id="privateProfileForm" novalidate>
                <div class="form-grid">
                  <div class="form-group">
                    <label for="profileFirstNameInput">Име</label>
                    <input
                      type="text"
                      id="profileFirstNameInput"
                      name="firstName"
                      autocomplete="given-name"
                      placeholder="Например: Иван"
                      value="${escapeHtml(firstName)}"
                    />
                  </div>

                  <div class="form-group">
                    <label for="profileLastNameInput">Фамилия</label>
                    <input
                      type="text"
                      id="profileLastNameInput"
                      name="lastName"
                      autocomplete="family-name"
                      placeholder="Например: Петров"
                      value="${escapeHtml(lastName)}"
                    />
                  </div>

                  <div class="form-group form-group--full">
                    <label for="profilePhoneInput">Телефон</label>
                    <input
                      type="text"
                      id="profilePhoneInput"
                      name="phone"
                      autocomplete="tel"
                      placeholder="Например: +359888123456"
                      value="${escapeHtml(phone)}"
                    />
                  </div>

                  <div class="form-group">
                    <label for="profileCountryId">Държава</label>
                    <select id="profileCountryId" name="countryId">
                      <option value="">Избери</option>
                    </select>
                  </div>

                  <div class="form-group">
                    <label for="profileRegionId">Област</label>
                    <select id="profileRegionId" name="regionId">
                      <option value="">Избери</option>
                    </select>
                  </div>

                  <div class="form-group form-group--full">
                    <label for="profileCityId">Град</label>
                    <select id="profileCityId" name="cityId">
                      <option value="">Избери</option>
                    </select>
                  </div>
                </div>

                <div class="settings-actions">
                  <button class="header-btn" type="submit" data-loading-text="Запазваме промените...">
                    Запази промените
                  </button>
                  <button class="header-btn header-btn--ghost" type="button" data-action="section-refresh" data-section="editProfile">
                    Презареди данните
                  </button>
                </div>
              </form>
            </article>

            <article class="settings-card settings-card--notice">
              <div class="settings-card__head">
                <div>
                  <div class="settings-card__eyebrow">Достъп</div>
                  <h3>Текуща информация</h3>
                </div>
                <span class="badge badge--primary">PRIVATE</span>
              </div>

              <p class="settings-note">
                Имейлът не се променя от тази форма. За имейл и парола използвай инструментите за сигурност под редактора.
              </p>

              <div class="info-list">
                <div class="info-row">
                  <div class="info-row__label">Текущ имейл</div>
                  <div class="info-row__value">${escapeHtml(currentEmail)}</div>
                </div>

                <div class="info-row">
                  <div class="info-row__label">Тип акаунт</div>
                  <div class="info-row__value">${escapeHtml(getAccountTypeLabel(accountType))}</div>
                </div>
              </div>
            </article>
          </div>
        </div>

        ${renderPrivateAccountSecuritySection(currentEmail)}
        ${renderDeletePrivateAccountSection()}
      </div>
    `;

    void hydratePrivateProfileEditorForm(data);
  }

  function renderDeletePrivateAccountSection() {
    return `
      <div class="settings-shell">
        <div class="section-summary">Изтриване на профила</div>

        <article class="settings-card settings-card--danger">
          <div class="settings-card__head">
            <div>
              <div class="settings-card__eyebrow">Опасна зона</div>
              <h3>Изтрий private профила</h3>
            </div>
            <span class="badge badge--warning">PRIVATE</span>
          </div>

          <p class="settings-note">
            След потвърждение и правилна парола профилът ти ще бъде изтрит. Това действие не трябва да се натиска случайно.
          </p>

          <div class="settings-danger-box">
            <strong>Внимание:</strong> след изтриване ще бъдеш изведен от профила, а свързаните с акаунта данни няма да са достъпни от тази сесия.
          </div>

          <form class="settings-form" id="deleteProfileForm" novalidate>
            <div class="form-group form-group--full">
              <label for="deleteProfilePasswordInput">Текуща парола</label>
              <input
                type="password"
                id="deleteProfilePasswordInput"
                name="currentPassword"
                autocomplete="current-password"
                placeholder="Въведи паролата си, за да потвърдиш"
              />
            </div>

            <div class="settings-actions">
              <button class="header-btn header-btn--danger" type="submit" data-loading-text="Изтриваме профила...">
                Изтрий профила
              </button>
            </div>
          </form>
        </article>
      </div>
    `;
  }

  function renderAccountSecuritySection(accountTypeRaw, currentEmail) {
    const accountType = normalizeAccountType(accountTypeRaw || state.accountType || "PRIVATE");
    const isPrivate = accountType === "PRIVATE";

    if (isPrivate) {
      return renderPrivateAccountSecuritySection(currentEmail);
    }

    if (!isPrivate) {
      return `
        <div class="settings-shell">
          <div class="section-summary">Настройки на профила</div>

          <article class="settings-card settings-card--notice">
            <div class="settings-card__head">
              <div>
                <div class="settings-card__eyebrow">Сигурност</div>
                <h3>Промени по фирмения акаунт</h3>
              </div>
              <span class="badge badge--dark">COMPANY</span>
            </div>

            <p class="settings-note">
              За фирмени акаунти смяната на имейл и парола не е самообслужваща.
              Свържи се с администратора, за да ти бъдат сменени данните по профила.
            </p>

            <div class="info-list">
              <div class="info-row">
                <div class="info-row__label">Текущ имейл</div>
                <div class="info-row__value">${escapeHtml(currentEmail || "-")}</div>
              </div>
            </div>
          </article>
        </div>
      `;
    }

    return `
      <div class="settings-shell">
        <div class="section-summary">Сигурност</div>

        <div class="settings-grid">
          <article class="settings-card">
            <div class="settings-card__head">
              <div>
                <div class="settings-card__eyebrow">Имейл</div>
                <h3>Смени имейла си</h3>
              </div>
              <span class="badge badge--primary">PRIVATE</span>
            </div>

            <p class="settings-note">
              След успешна смяна ще трябва да влезеш отново с новия имейл.
            </p>

            <div class="settings-current">
              <span>Текущ имейл</span>
              <strong>${escapeHtml(currentEmail || "-")}</strong>
            </div>

            <form class="settings-form" id="changeEmailForm" novalidate>
              <div class="form-group">
                <label for="changeEmailNewInput">Нов имейл</label>
                <input
                  type="email"
                  id="changeEmailNewInput"
                  name="newEmail"
                  autocomplete="email"
                  placeholder="Например: nov@email.com"
                />
              </div>

              <div class="form-group">
                <label for="changeEmailPasswordInput">Текуща парола</label>
                <input
                  type="password"
                  id="changeEmailPasswordInput"
                  name="currentPassword"
                  autocomplete="current-password"
                  placeholder="Въведи текущата си парола"
                />
              </div>

              <div class="settings-actions">
                <button class="header-btn" type="submit" data-loading-text="Сменяме имейла...">
                  Смени имейла
                </button>
              </div>
            </form>
          </article>

          <article class="settings-card">
            <div class="settings-card__head">
              <div>
                <div class="settings-card__eyebrow">Парола</div>
                <h3>Смени паролата си</h3>
              </div>
              <span class="badge badge--primary">PRIVATE</span>
            </div>

            <p class="settings-note">
              Използвай силна нова парола. След промяната ще те извадим от текущата сесия.
            </p>

            <form class="settings-form" id="changePasswordForm" novalidate>
              <div class="form-group">
                <label for="changePasswordCurrentInput">Текуща парола</label>
                <input
                  type="password"
                  id="changePasswordCurrentInput"
                  name="currentPassword"
                  autocomplete="current-password"
                  placeholder="Въведи текущата си парола"
                />
              </div>

              <div class="form-group">
                <label for="changePasswordNewInput">Нова парола</label>
                <input
                  type="password"
                  id="changePasswordNewInput"
                  name="newPassword"
                  autocomplete="new-password"
                  placeholder="Въведи новата парола"
                />
              </div>

              <div class="form-group">
                <label for="changePasswordConfirmInput">Потвърди новата парола</label>
                <input
                  type="password"
                  id="changePasswordConfirmInput"
                  name="confirmPassword"
                  autocomplete="new-password"
                  placeholder="Повтори новата парола"
                />
              </div>

              <div class="settings-actions">
                <button class="header-btn" type="submit" data-loading-text="Сменяме паролата...">
                  Смени паролата
                </button>
              </div>
            </form>
          </article>
        </div>
      </div>
    `;
  }

  function renderPrivateAccountSecuritySection(currentEmail) {
    return `
      <div class="settings-shell">
        <div class="section-summary">Настройки на профила</div>

        <div class="settings-stack">
          <article class="settings-card settings-card--editor">
            <div class="settings-card__head">
              <div>
                <div class="settings-card__eyebrow">Достъп</div>
                <h3>Имейл и парола</h3>
              </div>
              <span class="badge badge--primary">PRIVATE</span>
            </div>

            <p class="settings-note">
              Формите за смяна на имейл и парола са скрити, докато не избереш какво искаш да промениш.
            </p>

            <div class="settings-current">
              <span>Текущ имейл</span>
              <strong>${escapeHtml(currentEmail || "-")}</strong>
            </div>

            <div class="settings-toolbar">
              <button
                class="action-btn action-btn--primary"
                type="button"
                data-action="toggle-profile-security"
                data-open-text="Покажи опциите"
                data-close-text="Скрий опциите"
                aria-expanded="false"
                aria-controls="profileSecurityForms"
              >
                Покажи опциите
              </button>
            </div>

            <div class="settings-switcher hidden" id="profileSecurityActions">
              <button
                class="ghost-btn settings-switcher__btn"
                type="button"
                data-action="open-profile-settings-panel"
                data-panel="email"
                aria-pressed="false"
              >
                Смени имейл
              </button>

              <button
                class="ghost-btn settings-switcher__btn"
                type="button"
                data-action="open-profile-settings-panel"
                data-panel="password"
                aria-pressed="false"
              >
                Смени парола
              </button>
            </div>
          </article>

          <div class="settings-stack hidden" id="profileSecurityForms">
            <article class="settings-card settings-form-card hidden" id="changeEmailCard">
              <div class="settings-card__head">
                <div>
                  <div class="settings-card__eyebrow">Имейл</div>
                  <h3>Смени имейла си</h3>
                </div>
                <span class="badge badge--primary">PRIVATE</span>
              </div>

              <p class="settings-note">
                След успешна смяна ще трябва да влезеш отново с новия имейл.
              </p>

              <form class="settings-form" id="changeEmailForm" novalidate>
                <div class="form-group">
                  <label for="changeEmailNewInput">Нов имейл</label>
                  <input
                    type="email"
                    id="changeEmailNewInput"
                    name="newEmail"
                    autocomplete="email"
                    placeholder="Например: nov@email.com"
                  />
                </div>

                <div class="form-group">
                  <label for="changeEmailPasswordInput">Текуща парола</label>
                  <input
                    type="password"
                    id="changeEmailPasswordInput"
                    name="currentPassword"
                    autocomplete="current-password"
                    placeholder="Въведи текущата си парола"
                  />
                </div>

                <div class="settings-actions">
                  <button class="header-btn" type="submit" data-loading-text="Сменяме имейла...">
                    Смени имейла
                  </button>
                  <button class="header-btn header-btn--ghost" type="button" data-action="close-profile-settings-panel">
                    Отказ
                  </button>
                </div>
              </form>
            </article>

            <article class="settings-card settings-form-card hidden" id="changePasswordCard">
              <div class="settings-card__head">
                <div>
                  <div class="settings-card__eyebrow">Парола</div>
                  <h3>Смени паролата си</h3>
                </div>
                <span class="badge badge--primary">PRIVATE</span>
              </div>

              <p class="settings-note">
                Използвай силна нова парола. След промяната ще те извадим от текущата сесия.
              </p>

              <form class="settings-form" id="changePasswordForm" novalidate>
                <div class="form-group">
                  <label for="changePasswordCurrentInput">Текуща парола</label>
                  <input
                    type="password"
                    id="changePasswordCurrentInput"
                    name="currentPassword"
                    autocomplete="current-password"
                    placeholder="Въведи текущата си парола"
                  />
                </div>

                <div class="form-group">
                  <label for="changePasswordNewInput">Нова парола</label>
                  <input
                    type="password"
                    id="changePasswordNewInput"
                    name="newPassword"
                    autocomplete="new-password"
                    placeholder="Въведи новата парола"
                  />
                </div>

                <div class="form-group">
                  <label for="changePasswordConfirmInput">Потвърди новата парола</label>
                  <input
                    type="password"
                    id="changePasswordConfirmInput"
                    name="confirmPassword"
                    autocomplete="new-password"
                    placeholder="Повтори новата парола"
                  />
                </div>

                <div class="settings-actions">
                  <button class="header-btn" type="submit" data-loading-text="Сменяме паролата...">
                    Смени паролата
                  </button>
                  <button class="header-btn header-btn--ghost" type="button" data-action="close-profile-settings-panel">
                    Отказ
                  </button>
                </div>
              </form>
            </article>
          </div>
        </div>
      </div>
    `;
  }

  async function hydratePrivateProfileEditorForm(profile) {
    const firstNameInput = document.getElementById("profileFirstNameInput");
    const lastNameInput = document.getElementById("profileLastNameInput");
    const phoneInput = document.getElementById("profilePhoneInput");
    const countrySelect = document.getElementById("profileCountryId");
    const regionSelect = document.getElementById("profileRegionId");
    const citySelect = document.getElementById("profileCityId");

    if (!countrySelect || !regionSelect || !citySelect) return;

    setInputValue(firstNameInput, profile?.firstName);
    setInputValue(lastNameInput, profile?.lastName);
    setInputValue(phoneInput, profile?.phone);

    fillSelect(countrySelect, state.lookups.countries, "nameBg", "id");
    setSelectValue(countrySelect, profile?.countryId);

    await loadRegionsByCountry(profile?.countryId, profile?.regionId, {
      regionSelect,
      citySelect
    });

    if (profile?.regionId) {
      await loadCitiesByRegion(profile?.regionId, profile?.cityId, citySelect);
    }
  }

  async function onPrivateProfileCountryChange(countryIdRaw) {
    const regionSelect = document.getElementById("profileRegionId");
    const citySelect = document.getElementById("profileCityId");

    if (!regionSelect || !citySelect) return;

    await loadRegionsByCountry(normalizeSelectValue(countryIdRaw), null, {
      regionSelect,
      citySelect
    });
  }

  async function onPrivateProfileRegionChange(regionIdRaw) {
    const citySelect = document.getElementById("profileCityId");
    if (!citySelect) return;

    await loadCitiesByRegion(normalizeSelectValue(regionIdRaw), null, citySelect);
  }

  async function handlePrivateProfileSubmit(form) {
    if (normalizeAccountType(state.accountType) !== "PRIVATE") {
      showToast("Само частен акаунт може да редактира профила от тази секция.", "warning");
      return;
    }

    const firstName = String(form.elements.namedItem("firstName")?.value || "").trim();
    const lastName = String(form.elements.namedItem("lastName")?.value || "").trim();
    const phone = String(form.elements.namedItem("phone")?.value || "").trim();
    const countryId = String(form.elements.namedItem("countryId")?.value || "").trim();
    const regionId = String(form.elements.namedItem("regionId")?.value || "").trim();
    const cityId = String(form.elements.namedItem("cityId")?.value || "").trim();

    if (firstName.length < 2) {
      showToast("Името трябва да е поне 2 символа.", "error");
      return;
    }

    if (lastName.length < 2) {
      showToast("Фамилията трябва да е поне 2 символа.", "error");
      return;
    }

    if (!isValidPhone(phone)) {
      showToast("Въведи валиден телефонен номер.", "error");
      return;
    }

    if (!countryId || !regionId || !cityId) {
      showToast("Избери държава, област и град.", "error");
      return;
    }

    const submitBtn = form.querySelector('button[type="submit"]');
    setFormSubmitState(submitBtn, true);

    try {
      const profile = await authFetchJson(`${API_BASE_URL}/api/auth/profile/private`, {
        method: "PUT",
        body: JSON.stringify({
          firstName,
          lastName,
          phone,
          countryId: Number(countryId),
          regionId: Number(regionId),
          cityId: Number(cityId)
        })
      });

      state.data.editProfile = profile;
      state.loaded.editProfile = true;
      syncStoredUserProfile(profile);
      syncProfileMetaFromDashboard(profile);
      invalidateSections("dashboard");
      await hydratePrivateProfileEditorForm(profile);
      showToast("Профилът е обновен успешно.", "success");
    } catch (error) {
      console.error(error);
      showToast(error.message || "Неуспешно обновяване на профила.", "error");
    } finally {
      setFormSubmitState(submitBtn, false);
    }
  }

  async function handleDeleteProfileSubmit(form) {
    if (normalizeAccountType(state.accountType) !== "PRIVATE") {
      showToast("Само частен акаунт може да изтрива профила си от тази секция.", "warning");
      return;
    }

    const currentPassword = String(form.elements.namedItem("currentPassword")?.value || "");

    if (!currentPassword) {
      showToast("Въведи текущата си парола.", "error");
      return;
    }

    const confirmed = await showConfirmModal({
      title: "Изтриване на профила",
      text:
        "Сигурен ли си, че искаш да изтриеш профила си?\n" +
        "След потвърждение ще бъдеш изведен от системата."
    });

    if (!confirmed) return;

    const submitBtn = form.querySelector('button[type="submit"]');
    setFormSubmitState(submitBtn, true);

    try {
      const result = await authFetchJsonForSensitiveAction(`${API_BASE_URL}/api/auth/delete-profile`, {
        method: "DELETE",
        body: JSON.stringify({
          currentPassword
        })
      });

      await completeDeletedProfile(result?.message || "Профилът е изтрит успешно.");
    } catch (error) {
      console.error(error);
      showToast(error.message || "Неуспешно изтриване на профила.", "error");
    } finally {
      setFormSubmitState(submitBtn, false);
    }
  }

  function toggleProfileSecurityTools() {
    const switcher = document.getElementById("profileSecurityActions");
    const toggleBtn = document.querySelector('[data-action="toggle-profile-security"]');

    if (!switcher || !(toggleBtn instanceof HTMLButtonElement)) return;

    const shouldOpen = switcher.classList.contains("hidden");
    const openText = toggleBtn.dataset.openText || "Редактирай профила";
    const closeText = toggleBtn.dataset.closeText || "Скрий редакцията";

    switcher.classList.toggle("hidden", !shouldOpen);
    toggleBtn.setAttribute("aria-expanded", shouldOpen ? "true" : "false");
    toggleBtn.textContent = shouldOpen ? closeText : openText;

    if (!shouldOpen) {
      closeProfileSecurityPanels();
    }
  }

  function openProfileSecurityPanel(panelName) {
    const switcher = document.getElementById("profileSecurityActions");
    const formsWrap = document.getElementById("profileSecurityForms");
    const emailCard = document.getElementById("changeEmailCard");
    const passwordCard = document.getElementById("changePasswordCard");
    const toggleBtn = document.querySelector('[data-action="toggle-profile-security"]');
    const normalizedPanel = panelName === "password" ? "password" : "email";

    switcher?.classList.remove("hidden");
    formsWrap?.classList.remove("hidden");
    emailCard?.classList.toggle("hidden", normalizedPanel !== "email");
    passwordCard?.classList.toggle("hidden", normalizedPanel !== "password");
    syncProfileSecurityButtons(normalizedPanel);

    if (toggleBtn instanceof HTMLButtonElement) {
      toggleBtn.setAttribute("aria-expanded", "true");
      toggleBtn.textContent = toggleBtn.dataset.closeText || "Скрий редакцията";
    }

    const focusTarget = normalizedPanel === "email"
      ? document.getElementById("changeEmailNewInput")
      : document.getElementById("changePasswordCurrentInput");

    focusTarget?.focus();
  }

  function closeProfileSecurityPanels() {
    document.getElementById("profileSecurityForms")?.classList.add("hidden");
    document.getElementById("changeEmailCard")?.classList.add("hidden");
    document.getElementById("changePasswordCard")?.classList.add("hidden");
    syncProfileSecurityButtons();
  }

  function syncProfileSecurityButtons(activePanel = "") {
    const normalizedActive = String(activePanel || "").trim().toLowerCase();

    document.querySelectorAll('[data-action="open-profile-settings-panel"]').forEach((button) => {
      if (!(button instanceof HTMLButtonElement)) return;

      const isActive = String(button.dataset.panel || "").trim().toLowerCase() === normalizedActive;
      button.classList.toggle("active", isActive);
      button.setAttribute("aria-pressed", isActive ? "true" : "false");
    });
  }

  async function fetchAllMyListings() {
    const pageSize = 100;
    const firstPage = await authFetchJson(
      `${API_BASE_URL}/api/profile/my-listings?page=1&pageSize=${pageSize}`
    );

    const allItems = Array.isArray(firstPage?.items) ? [...firstPage.items] : [];
    const totalPages = Number(firstPage?.totalPages || 1);

    if (totalPages > 1) {
      const restPages = await Promise.all(
        Array.from({ length: totalPages - 1 }, (_, index) =>
          authFetchJson(`${API_BASE_URL}/api/profile/my-listings?page=${index + 2}&pageSize=${pageSize}`)
        )
      );

      restPages.forEach((pageData) => {
        if (Array.isArray(pageData?.items)) {
          allItems.push(...pageData.items);
        }
      });
    }

    return allItems;
  }

  function syncListingsViewData() {
    const allItems = Array.isArray(state.listingCatalog.allItems) ? state.listingCatalog.allItems : [];
    const filteredItems = filterListingsItems(allItems);
    const totalCount = filteredItems.length;
    const totalPages = totalCount ? Math.ceil(totalCount / state.pageSizes.listings) : 0;
    const safePage = totalPages
      ? Math.min(Math.max(1, Number(state.pages.listings || 1)), totalPages)
      : 1;

    state.pages.listings = safePage;

    const startIndex = (safePage - 1) * state.pageSizes.listings;
    const items = filteredItems.slice(startIndex, startIndex + state.pageSizes.listings);

    state.data.listings = {
      items,
      totalCount,
      totalPages,
      page: safePage,
      allCount: allItems.length,
      hasActiveFilters: hasActiveListingsFilters(),
      activePromotionFilter: normalizeListingsPromotionFilter(state.listingFilters.promotion),
      searchTerm: state.listingFilters.search || ""
    };
  }

  function filterListingsItems(items) {
    const searchTerm = String(state.listingFilters.search || "").trim().toLowerCase();
    const promotionFilter = normalizeListingsPromotionFilter(state.listingFilters.promotion);

    return (items || []).filter((item) => {
      const promotionType = normalizePromotionType(pick(item, "currentPromotionType", "promotionType"));
      if (promotionFilter !== "ALL" && promotionType !== promotionFilter) {
        return false;
      }

      if (!searchTerm) {
        return true;
      }

      return buildListingSearchText(item).includes(searchTerm);
    });
  }

  function buildListingSearchText(item) {
    return [
      pick(item, "title"),
      pick(item, "brandName"),
      pick(item, "modelName"),
      pick(item, "itemModelText"),
      pick(item, "subCategoryName"),
      pick(item, "subCategory2Name"),
      pick(item, "mainCategoryName"),
      pick(item, "cityName"),
      pick(item, "regionName"),
      pick(item, "countryName")
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
  }

  function hasActiveListingsFilters() {
    return Boolean(String(state.listingFilters.search || "").trim()) ||
      normalizeListingsPromotionFilter(state.listingFilters.promotion) !== "ALL";
  }

  function normalizeListingsPromotionFilter(value) {
    const normalized = String(value || "ALL").trim().toUpperCase();
    return ["ALL", "VIP", "TOP", "NORMAL"].includes(normalized) ? normalized : "ALL";
  }

  function renderListingsPromotionFilterChip(value, label, activeValue) {
    const normalized = normalizeListingsPromotionFilter(value);
    const isActive = normalized === normalizeListingsPromotionFilter(activeValue);

    return `
      <button
        class="listing-filter-chip ${isActive ? "active" : ""}"
        type="button"
        data-action="set-listings-promotion-filter"
        data-filter="${normalized}"
        aria-pressed="${isActive ? "true" : "false"}"
      >
        ${escapeHtml(label)}
      </button>
    `;
  }

  function renderListingsSection(data) {
    const items = Array.isArray(data?.items) ? data.items : [];
    const totalCount = Number(data?.totalCount || 0);
    const allCount = Number(data?.allCount || totalCount || 0);
    const page = Number(data?.page || state.pages.listings || 1);
    const totalPages = Number(data?.totalPages || 0);
    const hasActiveFilters = Boolean(data?.hasActiveFilters);
    const activePromotionFilter = normalizeListingsPromotionFilter(data?.activePromotionFilter);
    const searchTerm = String(data?.searchTerm || "");

    elements.sectionContent.innerHTML = `
      <div class="section-head">
        <div class="section-head__copy">
          <h2>Моите обяви</h2>
          <p>
            Оттук управляваш редакцията, статуса на обявата, оставащото време,
            refresh, TOP, VIP и триенето.
          </p>
        </div>

        <div class="section-head__actions">
          <button class="ghost-btn" type="button" data-action="section-refresh" data-section="listings">Обнови</button>
          <button class="action-btn action-btn--primary" type="button" data-action="go-create-listing">Качи нова обява</button>
        </div>
      </div>

      <div class="section-summary">Общо: ${totalCount} обяви</div>

      <div class="section-body">
        <div class="listing-tools">
          <div class="listing-search-wrap">
            <label class="listing-tools__label" for="listingsSearchInput">Търсене в моите обяви</label>
            <input
              class="listing-search-input"
              id="listingsSearchInput"
              type="search"
              value="${escapeHtml(searchTerm)}"
              data-listings-search
              placeholder="Търси по заглавие, марка, модел или локация"
            />
          </div>

          <div class="listing-filter-group">
            <div class="listing-tools__label">Филтър по статус</div>
            <div class="listing-filter-chips">
              ${renderListingsPromotionFilterChip("ALL", "Всички", activePromotionFilter)}
              ${renderListingsPromotionFilterChip("VIP", "Само VIP", activePromotionFilter)}
              ${renderListingsPromotionFilterChip("TOP", "Само TOP", activePromotionFilter)}
              ${renderListingsPromotionFilterChip("NORMAL", "Само нормални", activePromotionFilter)}
            </div>
          </div>
        </div>

        ${
          items.length
            ? `<div class="cards-grid">${items.map((item) => renderListingCard(item, "my-listings")).join("")}</div>`
            : `
              <div class="empty-state">
                <div>
                  <h2>Нямаш качени обяви</h2>
                  <p>Когато качиш обява, ще се появи тук.</p>
                </div>
              </div>
            `
        }

        ${renderPagination("listings", page, totalPages)}
      </div>
    `;

    const summaryElement = elements.sectionContent.querySelector(".section-summary");
    if (summaryElement) {
      summaryElement.textContent = hasActiveFilters
        ? `Показваме ${totalCount} от ${allCount} обяви`
        : `Общо: ${allCount} обяви`;
    }

    if (!items.length && hasActiveFilters) {
      const emptyTitle = elements.sectionContent.querySelector(".empty-state h2");
      const emptyText = elements.sectionContent.querySelector(".empty-state p");

      if (emptyTitle) {
        emptyTitle.textContent = "Няма резултати";
      }

      if (emptyText) {
        emptyText.textContent = "Пробвай с друг текст за търсене или смени филтрите VIP / TOP / нормални.";
      }
    }
  }

  function renderFavoritesSection(data) {
    const items = Array.isArray(data?.items) ? data.items : [];
    const totalCount = Number(data?.totalCount || 0);
    const page = Number(data?.page || state.pages.favorites || 1);
    const totalPages = Number(data?.totalPages || 0);

    elements.sectionContent.innerHTML = `
      <div class="section-head">
        <div class="section-head__copy">
          <h2>Любими обяви</h2>
          <p>Тук са запазените от теб обяви.</p>
        </div>

        <div class="section-head__actions">
          <button class="ghost-btn" type="button" data-action="section-refresh" data-section="favorites">Обнови</button>
        </div>
      </div>

      <div class="section-summary">Общо: ${totalCount} любими</div>

      <div class="section-body">
        ${
          items.length
            ? `<div class="cards-grid">${items.map((item) => renderListingCard(item, "favorites")).join("")}</div>`
            : `
              <div class="empty-state">
                <div>
                  <h2>Нямаш любими обяви</h2>
                  <p>Когато добавиш обява в любими, ще я виждаш тук.</p>
                </div>
              </div>
            `
        }

        ${renderPagination("favorites", page, totalPages)}
      </div>
    `;
  }

  function renderPaymentsSection(data) {
    const items = Array.isArray(data?.items) ? data.items : [];
    const totalCount = Number(data?.totalCount || 0);
    const page = Number(data?.page || state.pages.payments || 1);
    const totalPages = Number(data?.totalPages || 0);

    elements.sectionContent.innerHTML = `
      <div class="section-head">
        <div class="section-head__copy">
          <h2>Плащания</h2>
          <p>История на плащанията и платените действия по обявите.</p>
        </div>

        <div class="section-head__actions">
          <button class="ghost-btn" type="button" data-action="section-refresh" data-section="payments">Обнови</button>
        </div>
      </div>

      <div class="section-summary">Общо: ${totalCount} плащания</div>

      <div class="section-body">
        ${
          items.length
            ? `
              <div class="table-wrap">
                <table class="data-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Тип</th>
                      <th>Сума</th>
                      <th>Статус</th>
                      <th>Обява</th>
                      <th>Дата</th>
                      <th>Бележка</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${items.map((item, index) => renderPaymentRow(item, index)).join("")}
                  </tbody>
                </table>
              </div>
            `
            : `
              <div class="empty-state">
                <div>
                  <h2>Няма плащания</h2>
                  <p>Когато има платено действие, ще се появи тук.</p>
                </div>
              </div>
            `
        }

        ${renderPagination("payments", page, totalPages)}
      </div>
    `;
  }

  function renderListingCard(item, mode) {
    const id = pick(item, "id", "listingId");
    const title = pick(item, "title") || "Без заглавие";
    const brandName = pick(item, "brandName") || "";
    const modelName = pick(item, "modelName") || "";
    const categoryName = pick(item, "subCategory2Name", "subCategoryName", "mainCategoryName") || "";
    const subtitle = [brandName, modelName, categoryName].filter(Boolean).join(" • ");

    const mainPhotoUrl = pick(item, "mainPhotoUrl", "photoUrl", "imageUrl") || "";
    const promotionType = normalizePromotionType(pick(item, "currentPromotionType", "promotionType"));
    const vehicleYear = pick(item, "vehicleYear", "year");
    const engineCc = pick(item, "engineCC", "engineCc");
    const horsePower = pick(item, "horsePower");
    const licenseCategoryName = pick(item, "licenseCategoryName");
    const price = pick(item, "displayPrice", "priceOriginal", "priceEUR", "amountEUR") ?? 0;
    const currency = pick(item, "displayCurrencyCode", "currencyCode") || "EUR";

    const city = pick(item, "cityName") || "";
    const region = pick(item, "regionName") || "";
    const country = pick(item, "countryName") || "";
    const location = [city, region, country].filter(Boolean).join(", ") || "Локацията не е посочена";

    const viewCount = Number(pick(item, "viewCount", "viewsCount") || 0);
    const publishedAt = pick(item, "publishedAt", "createdAt", "updatedAt");
    const promotionEndAt = pick(item, "promotionEndAt");

    const remainingText = getPromotionRemainingLabel(promotionType, promotionEndAt);
    const statusPillClass = getListingStatusPillClass(promotionType);
    const isFavoritesMode = mode === "favorites";

    const metaItems = [
      vehicleYear ? `<span class="listing-meta__item">${escapeHtml(String(vehicleYear))}</span>` : "",
      engineCc ? `<span class="listing-meta__item">${escapeHtml(String(engineCc))} cc</span>` : "",
      horsePower ? `<span class="listing-meta__item">${escapeHtml(String(horsePower))} к.с.</span>` : "",
      licenseCategoryName ? `<span class="listing-meta__item">${escapeHtml(String(licenseCategoryName))}</span>` : "",
      `<span class="listing-meta__item">${escapeHtml(String(viewCount))} гледания</span>`
    ].filter(Boolean).join("");

    const imageHtml = mainPhotoUrl
      ? `<img src="${escapeHtml(mainPhotoUrl)}" alt="${escapeHtml(title)}" loading="lazy" />`
      : `<div class="listing-card__placeholder">Няма снимка</div>`;

    const favoriteButton = isFavoritesMode
      ? `
        <button
          class="listing-card__favorite active"
          type="button"
          data-action="remove-favorite"
          data-id="${escapeHtml(String(id))}"
          aria-label="Премахни от любими"
          aria-pressed="true"
        ></button>
      `
      : "";

    const actions =
      mode === "my-listings"
        ? `
          <button class="action-btn" type="button" data-action="view-listing" data-id="${escapeHtml(String(id))}">Виж</button>
          <button class="action-btn action-btn--primary" type="button" data-action="open-edit-modal" data-id="${escapeHtml(String(id))}">Редактирай</button>
        `
        : `
          <button class="action-btn" type="button" data-action="view-listing" data-id="${escapeHtml(String(id))}">Виж</button>
          <button class="action-btn action-btn--danger" type="button" data-action="remove-favorite" data-id="${escapeHtml(String(id))}">Премахни</button>
        `;

    const remainingHtml =
      promotionType === "NORMAL"
        ? `<div class="listing-card__date">${escapeHtml(remainingText)}</div>`
        : `<div class="listing-card__remaining-time">${escapeHtml(remainingText)}</div>`;

    return `
      <article class="listing-card">
        <div class="listing-card__media">
          <div class="listing-card__promotion">
            ${renderPromotionBadge(promotionType)}
          </div>
          ${favoriteButton}
          ${imageHtml}
        </div>

        <div class="listing-card__body">
          <div class="listing-card__top">
            <div class="listing-card__title-wrap">
              <h3 class="listing-card__title">${escapeHtml(title)}</h3>
              <p class="listing-card__subtitle">${escapeHtml(subtitle || "MotoZone")}</p>
            </div>

            <div class="listing-card__price">${escapeHtml(formatMoney(price, currency))}</div>
          </div>

          <div class="listing-meta">
            ${metaItems}
          </div>

          <div class="listing-card__footer">
            <div class="listing-card__info-row">
              <div class="listing-card__location">${escapeHtml(location)}</div>
              <div class="listing-card__date">
                ${publishedAt ? `Дата: ${escapeHtml(formatDate(publishedAt))}` : ""}
              </div>
            </div>

            <div class="listing-card__info-row">
              <div class="listing-card__status-inline">
                <span>Текущ статус:</span>
                <span class="listing-card__status-pill ${statusPillClass}">
                  ${escapeHtml(promotionType)}
                </span>
              </div>
              ${remainingHtml}
            </div>

            <div class="listing-card__actions ${isFavoritesMode ? "listing-card__actions--single" : ""}">
              ${actions}
            </div>
          </div>
        </div>
      </article>
    `;
  }

  function renderPromotionBadge(type) {
    const normalized = normalizePromotionType(type);

    if (normalized === "VIP") {
      return `<span class="badge badge--dark">VIP</span>`;
    }

    if (normalized === "TOP") {
      return `<span class="badge badge--success">TOP</span>`;
    }

    return `<span class="badge badge--primary">NORMAL</span>`;
  }

  function renderPaymentRow(item, index) {
    const id = pick(item, "id", "paymentId") || index + 1;
    const type = pick(item, "actionType", "paymentType", "type", "serviceType") || "-";
    const amount = Number(pick(item, "amountEUR", "amount", "priceEUR") || 0);
    const status = String(pick(item, "status", "paymentStatus") || "-");
    const listingId = pick(item, "listingId");
    const createdAt = pick(item, "createdAt", "paidAt", "paymentDate", "date");
    const note = pick(item, "note", "description", "message", "details") || "-";

    return `
      <tr>
        <td>${escapeHtml(String(id))}</td>
        <td>${escapeHtml(formatPaymentType(type))}</td>
        <td>${escapeHtml(formatMoney(amount, "EUR"))}</td>
        <td>${renderStatusPill(status)}</td>
        <td>${listingId ? renderPaymentListingPreview(listingId) : "-"}</td>
        <td>${createdAt ? escapeHtml(formatDateTime(createdAt)) : "-"}</td>
        <td>${escapeHtml(String(note))}</td>
      </tr>
    `;
  }

  function renderPaymentListingPreview(listingId) {
    const key = String(listingId);
    const preview = state.paymentListingPreviewCache[key];

    if (!preview) {
      return `
        <div class="payment-listing-mini">
          <div class="payment-listing-mini__placeholder">...</div>
          <div class="payment-listing-mini__copy">
            <div class="payment-listing-mini__title">Зарежда се...</div>
            <div class="payment-listing-mini__meta">Обява</div>
          </div>
        </div>
      `;
    }

    const title = preview.title || `Обява #${key}`;
    const photoUrl = preview.mainPhotoUrl || "";
    const meta = [preview.brandName, preview.modelName].filter(Boolean).join(" • ") || "Обява";

    const media = photoUrl
      ? `
        <div class="payment-listing-mini__thumb">
          <img src="${escapeHtml(photoUrl)}" alt="${escapeHtml(title)}" loading="lazy" />
        </div>
      `
      : `<div class="payment-listing-mini__placeholder">Няма снимка</div>`;

    return `
      <a class="payment-listing-mini" href="ListingDetails.html?id=${encodeURIComponent(key)}">
        ${media}
        <div class="payment-listing-mini__copy">
          <div class="payment-listing-mini__title">${escapeHtml(title)}</div>
          <div class="payment-listing-mini__meta">${escapeHtml(meta)}</div>
        </div>
      </a>
    `;
  }

  async function preloadPaymentListingPreviews(items) {
    const listingIds = [...new Set(
      (items || [])
        .map((item) => pick(item, "listingId"))
        .filter(Boolean)
        .map((x) => String(x))
    )];

    const missing = listingIds.filter((id) => !state.paymentListingPreviewCache[id]);

    if (!missing.length) return;

    await Promise.all(
      missing.map(async (id) => {
        try {
          const data = await fetchJson(`${API_BASE_URL}/api/listings/${id}`);
          state.paymentListingPreviewCache[id] = {
            title: pick(data, "title") || `Обява #${id}`,
            mainPhotoUrl:
              data?.photos?.find((x) => x?.isMain)?.fileUrl ||
              data?.photos?.[0]?.fileUrl ||
              "",
            brandName: pick(data, "brandName"),
            modelName: pick(data, "modelName")
          };
        } catch {
          state.paymentListingPreviewCache[id] = {
            title: `Обява #${id}`,
            mainPhotoUrl: "",
            brandName: "",
            modelName: ""
          };
        }
      })
    );
  }

  function renderStatusPill(status) {
    const normalized = String(status || "").trim().toLowerCase();

    let cls = "status-pill--default";
    if (["paid", "success", "completed", "ok"].includes(normalized)) cls = "status-pill--paid";
    else if (["pending", "processing"].includes(normalized)) cls = "status-pill--pending";
    else if (["failed", "cancelled", "rejected", "error"].includes(normalized)) cls = "status-pill--failed";

    return `<span class="status-pill ${cls}">${escapeHtml(String(status || "-"))}</span>`;
  }

  function renderPagination(section, currentPage, totalPages) {
    if (!totalPages || totalPages <= 1) return "";

    const pages = [];
    const safeCurrent = Number(currentPage || 1);

    pages.push(`
      <button class="page-btn" type="button" data-action="go-page" data-section="${escapeHtml(section)}" data-page="${safeCurrent - 1}" ${safeCurrent <= 1 ? "disabled" : ""}>
        ‹
      </button>
    `);

    let leftDotsAdded = false;
    let rightDotsAdded = false;

    for (let i = 1; i <= totalPages; i++) {
      const shouldShow =
        i === 1 ||
        i === totalPages ||
        Math.abs(i - safeCurrent) <= 1;

      if (shouldShow) {
        pages.push(`
          <button class="page-btn ${i === safeCurrent ? "active" : ""}" type="button" data-action="go-page" data-section="${escapeHtml(section)}" data-page="${i}">
            ${i}
          </button>
        `);
      } else if (i < safeCurrent && !leftDotsAdded && i > 1) {
        pages.push(`<span class="page-dots">...</span>`);
        leftDotsAdded = true;
      } else if (i > safeCurrent && !rightDotsAdded && i < totalPages) {
        pages.push(`<span class="page-dots">...</span>`);
        rightDotsAdded = true;
      }
    }

    pages.push(`
      <button class="page-btn" type="button" data-action="go-page" data-section="${escapeHtml(section)}" data-page="${safeCurrent + 1}" ${safeCurrent >= totalPages ? "disabled" : ""}>
        ›
      </button>
    `);

    return `<div class="pagination">${pages.join("")}</div>`;
  }

  async function handleChangeEmailSubmit(form) {
    if (normalizeAccountType(state.accountType) !== "PRIVATE") {
      showToast("Само частни акаунти могат да сменят имейла си.", "warning");
      return;
    }

    const newEmail = String(form.elements.namedItem("newEmail")?.value || "").trim();
    const currentPassword = String(form.elements.namedItem("currentPassword")?.value || "");

    if (!newEmail) {
      showToast("Новият имейл е задължителен.", "error");
      return;
    }

    if (!isValidEmail(newEmail)) {
      showToast("Въведи валиден нов имейл.", "error");
      return;
    }

    if (!currentPassword) {
      showToast("Въведи текущата си парола.", "error");
      return;
    }

    const submitBtn = form.querySelector('button[type="submit"]');
    setFormSubmitState(submitBtn, true);

    try {
      const result = await authFetchJsonForSensitiveAction(`${API_BASE_URL}/api/auth/change-email`, {
        method: "POST",
        body: JSON.stringify({
          newEmail,
          currentPassword
        })
      });

      await completeSensitiveProfileChange(result?.message || "Имейлът е сменен успешно. Влез отново.");
    } catch (error) {
      console.error(error);
      showToast(error.message || "Неуспешна смяна на имейла.", "error");
    } finally {
      setFormSubmitState(submitBtn, false);
    }
  }

  async function handleChangePasswordSubmit(form) {
    if (normalizeAccountType(state.accountType) !== "PRIVATE") {
      showToast("Само частни акаунти могат да сменят паролата си.", "warning");
      return;
    }

    const currentPassword = String(form.elements.namedItem("currentPassword")?.value || "");
    const newPassword = String(form.elements.namedItem("newPassword")?.value || "");
    const confirmPassword = String(form.elements.namedItem("confirmPassword")?.value || "");

    if (!currentPassword) {
      showToast("Въведи текущата си парола.", "error");
      return;
    }

    if (!newPassword) {
      showToast("Новата парола е задължителна.", "error");
      return;
    }

    if (newPassword.length < 6) {
      showToast("Новата парола трябва да е поне 6 символа.", "error");
      return;
    }

    if (newPassword !== confirmPassword) {
      showToast("Новата парола и потвърждението не съвпадат.", "error");
      return;
    }

    if (newPassword === currentPassword) {
      showToast("Новата парола трябва да е различна от текущата.", "error");
      return;
    }

    const submitBtn = form.querySelector('button[type="submit"]');
    setFormSubmitState(submitBtn, true);

    try {
      const result = await authFetchJsonForSensitiveAction(`${API_BASE_URL}/api/auth/change-password`, {
        method: "POST",
        body: JSON.stringify({
          currentPassword,
          newPassword
        })
      });

      await completeSensitiveProfileChange(result?.message || "Паролата е сменена успешно. Влез отново.");
    } catch (error) {
      console.error(error);
      showToast(error.message || "Неуспешна смяна на паролата.", "error");
    } finally {
      setFormSubmitState(submitBtn, false);
    }
  }

  async function completeSessionEndingAction(message, redirectUrl) {
    showToast(message, "success");
    window.Auth?.clearAuthData?.();

    await new Promise((resolve) => {
      setTimeout(resolve, 900);
    });

    window.location.href = redirectUrl;
  }

  async function completeSensitiveProfileChange(message) {
    await completeSessionEndingAction(message, "Login.html");
  }

  async function completeDeletedProfile(message) {
    await completeSessionEndingAction(message, "index.html");
  }

  function setFormSubmitState(button, isLoading) {
    if (!(button instanceof HTMLButtonElement)) return;

    if (!button.dataset.defaultText) {
      button.dataset.defaultText = button.textContent || "";
    }

    const loadingText = button.dataset.loadingText || "Изчакване...";
    button.disabled = Boolean(isLoading);
    button.textContent = isLoading ? loadingText : (button.dataset.defaultText || "");
  }

  async function handleRemoveFavorite(listingId) {
    const confirmed = await showConfirmModal({
      title: "Премахване от любими",
      text: "Сигурен ли си, че искаш да премахнеш обявата от любими?"
    });

    if (!confirmed) return;

    const result = await authFetchJson(`${API_BASE_URL}/api/profile/favorites/${listingId}`, {
      method: "DELETE"
    });

    showToast(result?.message || "Обявата е премахната от любими.", "success");
    invalidateSections("dashboard", "favorites");
    await openSection("favorites", { force: true });
  }

  async function ensureLookupsLoaded() {
    if (state.lookups.loaded) return;

    const all = await fetchJson(`${API_BASE_URL}/api/lookups/all`);

    state.lookups.all = all;
    state.lookups.mainCategories = Array.isArray(all?.mainCategories) ? all.mainCategories : [];
    state.lookups.vehicleClasses = Array.isArray(all?.vehicleClasses) ? all.vehicleClasses : [];
    state.lookups.vehicleTypes = Array.isArray(all?.vehicleTypes) ? all.vehicleTypes : [];
    state.lookups.gearTypes = Array.isArray(all?.gearTypes) ? all.gearTypes : [];
    state.lookups.helmetTypes = Array.isArray(all?.helmetTypes) ? all.helmetTypes : [];
    state.lookups.partTypes = Array.isArray(all?.partTypes) ? all.partTypes : [];
    state.lookups.accessoryTypes = Array.isArray(all?.accessoryTypes) ? all.accessoryTypes : [];
    state.lookups.licenseCategories = Array.isArray(all?.licenseCategories) ? all.licenseCategories : [];
    state.lookups.conditions = Array.isArray(all?.conditions) ? all.conditions : [];
    state.lookups.countries = Array.isArray(all?.countries) ? all.countries : [];
    state.lookups.brandsByType.VEHICLE = Array.isArray(all?.vehicleBrands) ? all.vehicleBrands : [];
    state.lookups.brandsByType.GEAR = Array.isArray(all?.gearBrands) ? all.gearBrands : [];
    state.lookups.brandsByType.PART = Array.isArray(all?.partBrands) ? all.partBrands : [];
    state.lookups.brandsByType.ACCESSORY = Array.isArray(all?.accessoryBrands) ? all.accessoryBrands : [];

    state.lookups.loaded = true;
  }

  async function openEditModal(listingId) {
    try {
      await ensureLookupsLoaded();
      await ensureAccountTypeLoaded();

      const details = await fetchJson(`${API_BASE_URL}/api/listings/${listingId}`);

      state.modal.isOpen = true;
      state.modal.listingId = Number(listingId);
      state.modal.listingDetails = details;
      state.modal.categoryCode = resolveMainCategoryCode(details?.mainCategoryLookupId);
      state.modal.photos = normalizePhotos(details?.photos || []);
      state.modal.initialBlobNames = state.modal.photos.map((x) => x.blobName).filter(Boolean);

      fillStaticLookupSelects();
      await fillEditForm(details);
      populateSubscriptionInfo(normalizeAccountType(state.accountType));
      renderPhotoManager();
      renderModalPreview();
      applyCategoryVisibility();
      handleGearHelmetVisibility();

      elements.editListingModalOverlay.classList.remove("hidden");
      document.body.classList.add("modal-open");
    } catch (error) {
      console.error(error);
      showToast(error.message || "Не успях да отворя редакцията.", "error");
    }
  }

  async function closeEditModal(deleteUnsavedUploads) {
    if (deleteUnsavedUploads) {
      await cleanupUnsavedUploadedPhotos();
    }

    resetModalState();
    elements.editListingModalOverlay.classList.add("hidden");
    document.body.classList.remove("modal-open");
  }

  function resetModalState() {
    state.modal.isOpen = false;
    state.modal.listingId = null;
    state.modal.listingDetails = null;
    state.modal.photos = [];
    state.modal.initialBlobNames = [];
    state.modal.categoryCode = null;

    elements.editListingForm?.reset();
    elements.editPhotoManager.innerHTML = `<div class="photo-manager__empty">Няма снимки</div>`;
    elements.editMainPreview.innerHTML = `<div class="edit-main-preview__placeholder">Няма снимка</div>`;
    elements.editCurrentPromotionType.textContent = "NORMAL";
    elements.editCurrentPromotionBadge.textContent = "NORMAL";
    elements.editCurrentPromotionBadge.className = "edit-promo-pill edit-promo-pill--normal";
    elements.editPromotionRemaining.textContent = "Няма активна промоция";
    elements.editLastRefreshInfo.textContent = "-";
    if (elements.editPromotionStatusNote) {
      elements.editPromotionStatusNote.textContent = "Ако няма активен VIP или TOP, обявата е в нормален статус.";
    }

    if (elements.editAccountTypeValue) elements.editAccountTypeValue.textContent = normalizeAccountType(state.accountType || "PRIVATE");
    if (elements.editRefreshPriceValue) elements.editRefreshPriceValue.textContent = "0.50 EUR";
    if (elements.editPublishOverLimitPriceValue) elements.editPublishOverLimitPriceValue.textContent = "1.00 EUR";
    if (elements.editVipPriceText) elements.editVipPriceText.textContent = "7.00 EUR";
    if (elements.editTopPriceText) elements.editTopPriceText.textContent = "4.00 EUR";
    if (elements.editRefreshPriceText) elements.editRefreshPriceText.textContent = "0.50 EUR";
    if (elements.editSubscriptionRulesText) {
      elements.editSubscriptionRulesText.textContent =
        "Частен акаунт: VIP 7.00 EUR / 7 дни, TOP 4.00 EUR / 7 дни, Refresh 0.50 EUR, качване над лимита 1.00 EUR.";
    }

    resetPromotionButtons();

    clearSelect(elements.editModelId);
    clearSelect(elements.editRegionId);
    clearSelect(elements.editCityId);
  }

  function fillStaticLookupSelects() {
    fillSelect(elements.editCountryId, state.lookups.countries, "nameBg", "id");
    fillSelect(elements.editConditionLookupId, state.lookups.conditions, "nameBg", "id");
    fillSelect(elements.editLicenseCategoryLookupId, state.lookups.licenseCategories, "nameBg", "id");

    fillSelect(elements.editSubCategoryLookupId, state.lookups.vehicleClasses, "nameBg", "id");
    fillSelect(elements.editGearTypeId, state.lookups.gearTypes, "nameBg", "id");
    fillSelect(elements.editHelmetTypeId, state.lookups.helmetTypes, "nameBg", "id");
  }

  async function fillEditForm(details) {
    const categoryCode = state.modal.categoryCode;
    const brandItems = state.lookups.brandsByType[categoryCode] || [];

    fillSelect(elements.editBrandId, brandItems, "name", "id");

    if (categoryCode === "PART") {
      fillSelect(elements.editPartAccessoryTypeId, state.lookups.partTypes, "nameBg", "id");
    } else if (categoryCode === "ACCESSORY") {
      fillSelect(elements.editPartAccessoryTypeId, state.lookups.accessoryTypes, "nameBg", "id");
    } else {
      clearSelect(elements.editPartAccessoryTypeId);
    }

    if (categoryCode === "VEHICLE") {
      const classId = normalizeSelectValue(details?.subCategoryLookupId);
      const brandId = normalizeSelectValue(details?.brandId);
      const vehicleTypes = getVehicleTypesByClassId(classId);

      fillSelect(elements.editSubCategory2LookupId, vehicleTypes, "nameBg", "id");

      if (brandId) {
        await loadModelsByBrandAndClass(brandId, classId, normalizeSelectValue(details?.modelId));
      } else {
        clearSelect(elements.editModelId);
      }
    } else {
      clearSelect(elements.editSubCategory2LookupId);
      clearSelect(elements.editModelId);
    }

    setInputValue(elements.editMainCategoryLookupId, details?.mainCategoryLookupId);
    setSelectValue(elements.editBrandId, details?.brandId);
    setSelectValue(elements.editConditionLookupId, details?.conditionLookupId);
    setSelectValue(elements.editLicenseCategoryLookupId, details?.licenseCategoryLookupId);

    setInputValue(elements.editListingId, details?.id);
    setInputValue(elements.editExistingPromotionType, normalizePromotionType(details?.promotionType));
    setInputValue(elements.editTitle, details?.title);
    setInputValue(elements.editDescription, details?.description);
    setInputValue(elements.editItemModelText, details?.itemModelText);
    setInputValue(elements.editVehicleYear, details?.vehicleYear);
    setInputValue(elements.editEngineCC, details?.engineCC);
    setInputValue(elements.editHorsePower, details?.horsePower);
    setInputValue(elements.editMileage, details?.mileage);
    setInputValue(elements.editColor, details?.color);

    setSelectValue(elements.editSubCategoryLookupId, details?.subCategoryLookupId);
    setSelectValue(elements.editSubCategory2LookupId, details?.subCategory2LookupId);
    setSelectValue(elements.editGearTypeId, details?.subCategoryLookupId);
    setSelectValue(elements.editHelmetTypeId, details?.subCategory2LookupId);
    setSelectValue(elements.editPartAccessoryTypeId, details?.subCategoryLookupId);

    setInputValue(elements.editGearYear, details?.vehicleYear);

    setInputValue(elements.editPriceOriginal, details?.priceOriginal);
    setSelectValue(elements.editCurrencyCode, details?.currencyCode || "EUR");
    setInputValue(elements.editExchangeRateToEUR, details?.exchangeRateToEUR);
    setInputValue(elements.editContactName, details?.contactName);
    setInputValue(elements.editContactPhone, details?.contactPhone);

    fillSelect(elements.editCountryId, state.lookups.countries, "nameBg", "id");
    setSelectValue(elements.editCountryId, details?.countryId);

    await loadRegionsByCountry(details?.countryId, details?.regionId);

    if (details?.regionId) {
      await loadCitiesByRegion(details?.regionId, details?.cityId);
    }

    elements.editListingModalSubtitle.textContent = `Редакция на: ${details?.title || "Обява"}`;
    updatePromotionUI(details);
  }

  function populateSubscriptionInfo(accountTypeRaw) {
    const accountType = normalizeAccountType(accountTypeRaw || state.accountType || "PRIVATE");
    const pricing = getPricingByAccountType(accountType);

    if (elements.editAccountTypeValue) {
      elements.editAccountTypeValue.textContent = accountType;
    }

    if (elements.editRefreshPriceValue) {
      elements.editRefreshPriceValue.textContent = formatMoney(pricing.refreshEUR, "EUR");
    }

    if (elements.editPublishOverLimitPriceValue) {
      elements.editPublishOverLimitPriceValue.textContent = formatMoney(pricing.publishOverLimitEUR, "EUR");
    }

    if (elements.editVipPriceText) {
      elements.editVipPriceText.textContent = formatMoney(PRICING.VIP_PRICE_EUR, "EUR");
    }

    if (elements.editTopPriceText) {
      elements.editTopPriceText.textContent = formatMoney(PRICING.TOP_PRICE_EUR, "EUR");
    }

    if (elements.editRefreshPriceText) {
      elements.editRefreshPriceText.textContent = formatMoney(pricing.refreshEUR, "EUR");
    }

    if (elements.editSubscriptionRulesText) {
      elements.editSubscriptionRulesText.textContent = buildPricingSummaryText(accountType, true);
    }
  }

  function applyCategoryVisibility() {
    const code = state.modal.categoryCode;

    elements.editVehicleSection.classList.toggle("hidden", code !== "VEHICLE");
    elements.editGearSection.classList.toggle("hidden", code !== "GEAR");
    elements.editPartAccessorySection.classList.toggle(
      "hidden",
      !(code === "PART" || code === "ACCESSORY")
    );
  }

  function handleGearHelmetVisibility() {
    if (state.modal.categoryCode !== "GEAR") return;

    const selectedText =
      elements.editGearTypeId?.selectedOptions?.[0]?.textContent?.toLowerCase() || "";
    const selectedValue = String(elements.editGearTypeId?.value || "").trim().toUpperCase();
    const shouldShow = selectedText.includes("каска") || selectedValue === "HELMET";

    const helmetGroup = elements.editHelmetTypeId?.closest(".form-group");
    if (helmetGroup) {
      helmetGroup.classList.toggle("hidden", !shouldShow);
    }

    if (!shouldShow) {
      elements.editHelmetTypeId.value = "";
    }
  }

  function updatePromotionUI(details) {
    const type = normalizePromotionType(details?.promotionType);
    const remaining = getPromotionRemainingLabel(type, details?.promotionEndAt);
    const lastRefresh = details?.lastRefreshAt ? formatDateTime(details.lastRefreshAt) : "Няма";
    const note = buildPromotionStatusNote(type, details?.promotionEndAt);

    elements.editCurrentPromotionType.textContent = type;
    elements.editCurrentPromotionBadge.textContent = type;
    elements.editCurrentPromotionBadge.className = `edit-promo-pill ${getPromotionBadgeClass(type)}`;
    elements.editPromotionRemaining.textContent = remaining;
    elements.editLastRefreshInfo.textContent = lastRefresh;

    if (elements.editPromotionStatusNote) {
      elements.editPromotionStatusNote.textContent = note;
    }

    updatePromotionButtonsState(type);
  }

  function updatePromotionButtonsState(type) {
    const normalized = normalizePromotionType(type);

    resetPromotionButtons();

    if (normalized === "VIP") {
      setButtonDisabled(elements.modalVipBtn, true, "VIP е активен");
      setButtonDisabled(elements.modalTopBtn, true, "VIP е активен");
      return;
    }

    if (normalized === "TOP") {
      setButtonDisabled(elements.modalTopBtn, true, "TOP е активен");
      setButtonDisabled(elements.modalVipBtn, false, "Направи я VIP");
      return;
    }

    setButtonDisabled(elements.modalVipBtn, false, "Направи я VIP");
    setButtonDisabled(elements.modalTopBtn, false, "Направи я TOP");
  }

  function resetPromotionButtons() {
    setButtonDisabled(elements.modalVipBtn, false, "Направи я VIP");
    setButtonDisabled(elements.modalTopBtn, false, "Направи я TOP");
    setButtonDisabled(elements.modalRefreshBtn, false, "Направи refresh");
  }

  function setButtonDisabled(button, isDisabled, text) {
    if (!button) return;
    button.disabled = Boolean(isDisabled);
    if (text) button.textContent = text;
  }

  function renderModalPreview() {
    const mainPhoto = state.modal.photos.find((x) => x.isMain) || state.modal.photos[0];

    if (!mainPhoto?.fileUrl) {
      elements.editMainPreview.innerHTML = `<div class="edit-main-preview__placeholder">Няма снимка</div>`;
      return;
    }

    elements.editMainPreview.innerHTML = `
      <img src="${escapeHtml(mainPhoto.fileUrl)}" alt="Основна снимка" />
    `;
  }

  function renderPhotoManager() {
    if (!state.modal.photos.length) {
      elements.editPhotoManager.innerHTML = `<div class="photo-manager__empty">Няма снимки</div>`;
      renderModalPreview();
      return;
    }

    elements.editPhotoManager.innerHTML = state.modal.photos
      .sort((a, b) => Number(a.sortOrder || 0) - Number(b.sortOrder || 0))
      .map((photo, index) => {
        const mainBadge = photo.isMain
          ? `<span class="photo-item__badge">Главна</span>`
          : `<span class="photo-item__badge">Снимка ${index + 1}</span>`;

        return `
          <div class="photo-item" data-photo-key="${escapeHtml(photo.clientKey)}">
            <div class="photo-item__media">
              <img src="${escapeHtml(photo.fileUrl)}" alt="${escapeHtml(photo.fileName || "Снимка")}" loading="lazy" />
            </div>

            <div class="photo-item__body">
              <div class="photo-item__meta">
                ${mainBadge}
                <span class="photo-item__badge">${photo.isNewUpload ? "Нова" : "Запазена"}</span>
              </div>

              <div class="photo-item__actions">
                <button class="photo-item__btn" type="button" data-photo-action="set-main" data-photo-key="${escapeHtml(photo.clientKey)}">
                  Направи главна
                </button>
                <button class="photo-item__btn photo-item__btn--danger" type="button" data-photo-action="remove" data-photo-key="${escapeHtml(photo.clientKey)}">
                  Махни
                </button>
              </div>
            </div>
          </div>
        `;
      })
      .join("");

    renderModalPreview();
  }

  async function onNewPhotosSelected(event) {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;

    try {
      const uploaded = await uploadListingImages(files);

      const mapped = uploaded.map((item, index) => ({
        clientKey: cryptoRandomKey(),
        id: null,
        fileName: item.fileName || item.FileName || "image",
        fileUrl: item.readUrl || item.ReadUrl || item.fileUrl || item.FileUrl || "",
        blobName: item.blobName || item.BlobName || "",
        sortOrder: state.modal.photos.length + index,
        isMain: state.modal.photos.length === 0 && index === 0,
        isNewUpload: true
      }));

      state.modal.photos.push(...mapped);
      normalizePhotoState();
      renderPhotoManager();
      showToast("Снимките са качени успешно.", "success");
    } catch (error) {
      console.error(error);
      showToast(error.message || "Неуспешно качване на снимките.", "error");
    } finally {
      event.target.value = "";
    }
  }

  async function uploadListingImages(files) {
    const formData = new FormData();
    files.forEach((file) => formData.append("files", file));

    const response = await window.Auth.authFetch(`${API_BASE_URL}/api/listing-images/upload`, {
      method: "POST",
      body: formData
    });

    const contentType = response.headers.get("content-type") || "";
    const isJson = contentType.includes("application/json");
    const data = isJson ? await response.json() : null;

    if (!response.ok) {
      throw new Error(data?.message || "Неуспешно качване на снимките.");
    }

    return Array.isArray(data) ? data : [];
  }

  async function onPhotoManagerClick(event) {
    const btn = event.target.closest("[data-photo-action]");
    if (!btn) return;

    const action = btn.dataset.photoAction;
    const key = btn.dataset.photoKey;
    const photo = state.modal.photos.find((x) => x.clientKey === key);
    if (!photo) return;

    if (action === "set-main") {
      state.modal.photos.forEach((x) => {
        x.isMain = x.clientKey === key;
      });
      normalizePhotoState();
      renderPhotoManager();
      return;
    }

    if (action === "remove") {
      if (state.modal.photos.length === 1) {
        showToast("Трябва да има поне една снимка.", "warning");
        return;
      }

      if (photo.isNewUpload && photo.blobName) {
        try {
          await deleteOwnedBlob(photo.blobName);
        } catch {
          // умишлено мълчим
        }
      }

      state.modal.photos = state.modal.photos.filter((x) => x.clientKey !== key);
      normalizePhotoState();
      renderPhotoManager();
    }
  }

  function normalizePhotoState() {
    state.modal.photos = state.modal.photos.map((photo, index) => ({
      ...photo,
      sortOrder: index
    }));

    if (!state.modal.photos.some((x) => x.isMain) && state.modal.photos.length) {
      state.modal.photos[0].isMain = true;
    }

    const mainCount = state.modal.photos.filter((x) => x.isMain).length;
    if (mainCount > 1) {
      let found = false;
      state.modal.photos.forEach((photo) => {
        if (photo.isMain && !found) {
          found = true;
          return;
        }
        if (photo.isMain && found) {
          photo.isMain = false;
        }
      });
    }
  }

  async function onEditFormSubmit(event) {
    event.preventDefault();

    if (!state.modal.listingId) return;

    try {
      validateBeforeSave();

      const payload = buildUpdatePayload();
      const result = await authFetchJson(
        `${API_BASE_URL}/api/listings/${state.modal.listingId}`,
        {
          method: "PUT",
          body: JSON.stringify(payload)
        }
      );

      showToast(result?.message || "Обявата е редактирана успешно.", "success");

      invalidateSections("dashboard", "listings", "favorites", "payments");
      await closeEditModal(false);
      await openSection("listings", { force: true });
    } catch (error) {
      console.error(error);
      showToast(error.message || "Неуспешна редакция.", "error");
    }
  }

  function validateBeforeSave() {
    if (!elements.editTitle.value.trim()) {
      throw new Error("Заглавието е задължително.");
    }

    if (!elements.editPriceOriginal.value) {
      throw new Error("Цената е задължителна.");
    }

    if (!elements.editCountryId.value) {
      throw new Error("Държавата е задължителна.");
    }

    if (!elements.editContactPhone.value.trim()) {
      throw new Error("Телефонът е задължителен.");
    }

    if (!state.modal.photos.length) {
      throw new Error("Трябва да има поне една снимка.");
    }

    if (!state.modal.photos.some((x) => x.isMain)) {
      throw new Error("Трябва да има главна снимка.");
    }

    const category = state.modal.categoryCode;
    if (category === "VEHICLE" && !elements.editSubCategoryLookupId.value) {
      throw new Error("Класът е задължителен.");
    }

    if (category === "GEAR" && !elements.editGearTypeId.value) {
      throw new Error("Типът екипировка е задължителен.");
    }

    if ((category === "PART" || category === "ACCESSORY") && !elements.editPartAccessoryTypeId.value) {
      throw new Error("Подкатегорията е задължителна.");
    }
  }

  function buildUpdatePayload() {
    const category = state.modal.categoryCode;
    const currencyCode = (elements.editCurrencyCode.value || "EUR").trim().toUpperCase();
    const exchangeRate = getExchangeRateValue(currencyCode);

    const common = {
      mainCategoryLookupId: toNullableNumber(elements.editMainCategoryLookupId.value),
      brandId: toNullableNumber(elements.editBrandId.value),
      modelId: category === "VEHICLE" ? toNullableNumber(elements.editModelId.value) : null,
      itemModelText: toNullableString(elements.editItemModelText.value),
      licenseCategoryLookupId: category === "VEHICLE" ? toNullableNumber(elements.editLicenseCategoryLookupId.value) : null,
      conditionLookupId: toNullableNumber(elements.editConditionLookupId.value),
      title: elements.editTitle.value.trim(),
      description: toNullableString(elements.editDescription.value),
      vehicleYear: category === "GEAR"
        ? toNullableNumber(elements.editGearYear.value)
        : toNullableNumber(elements.editVehicleYear.value),
      horsePower: category === "VEHICLE" ? toNullableNumber(elements.editHorsePower.value) : null,
      engineCC: category === "VEHICLE" ? toNullableNumber(elements.editEngineCC.value) : null,
      mileage: category === "VEHICLE" ? toNullableNumber(elements.editMileage.value) : null,
      color: category === "VEHICLE" ? toNullableString(elements.editColor.value) : null,
      priceOriginal: toRequiredDecimal(elements.editPriceOriginal.value),
      currencyCode,
      exchangeRateToEUR: exchangeRate,
      countryId: toNullableNumber(elements.editCountryId.value),
      regionId: toNullableNumber(elements.editRegionId.value),
      cityId: toNullableNumber(elements.editCityId.value),
      contactName: toNullableString(elements.editContactName.value),
      contactPhone: elements.editContactPhone.value.trim(),
      photos: state.modal.photos.map((photo, index) => ({
        fileName: photo.fileName || `image-${index + 1}`,
        fileUrl: photo.fileUrl || "",
        blobName: photo.blobName || "",
        sortOrder: index,
        isMain: Boolean(photo.isMain)
      }))
    };

    if (category === "VEHICLE") {
      common.subCategoryLookupId = toNullableNumber(elements.editSubCategoryLookupId.value);
      common.subCategory2LookupId = toNullableNumber(elements.editSubCategory2LookupId.value);
    } else if (category === "GEAR") {
      common.subCategoryLookupId = toNullableNumber(elements.editGearTypeId.value);
      common.subCategory2LookupId = toNullableNumber(elements.editHelmetTypeId.value);
    } else if (category === "PART" || category === "ACCESSORY") {
      common.subCategoryLookupId = toNullableNumber(elements.editPartAccessoryTypeId.value);
      common.subCategory2LookupId = null;
    } else {
      common.subCategoryLookupId = null;
      common.subCategory2LookupId = null;
    }

    return common;
  }

  async function onModalRefreshClick() {
    if (!state.modal.listingId) return;

    const accountType = normalizeAccountType(state.accountType || "PRIVATE");
    const pricing = getPricingByAccountType(accountType);

    const confirmed = await showConfirmModal({
      title: "Refresh на обява",
      text:
        `Refresh ще качи обявата по-напред по дата, без да я прави VIP или TOP.\n` +
        `Цена за твоя акаунт: ${formatMoney(pricing.refreshEUR, "EUR")}.\n\n` +
        `Сигурен ли си, че искаш да направиш refresh?`
    });

    if (!confirmed) return;

    try {
      const result = await authFetchJson(
        `${API_BASE_URL}/api/listings/${state.modal.listingId}/refresh`,
        { method: "POST" }
      );

      const actionHandled = await handlePaidActionResult(result, "Refresh действието е изпълнено успешно.");

      if (actionHandled !== "redirected") {
        await reloadModalListingDetails();
        invalidateSections("dashboard", "listings", "payments");
        if (state.currentSection === "listings") {
          state.loaded.listings = false;
        }
      }
    } catch (error) {
      console.error(error);
      showToast(error.message || "Неуспешен refresh.", "error");
    }
  }

  async function onModalPromoteClick(targetPromotionType) {
    if (!state.modal.listingId) return;

    const normalizedTarget = normalizePromotionType(targetPromotionType);
    const price = normalizedTarget === "VIP" ? PRICING.VIP_PRICE_EUR : PRICING.TOP_PRICE_EUR;
    const days = normalizedTarget === "VIP" ? PRICING.VIP_DAYS : PRICING.TOP_DAYS;

    const description =
      normalizedTarget === "VIP"
        ? `VIP ще направи обявата ти най-видима за ${days} дни.`
        : `TOP ще качи обявата по-напред и ще я отличи за ${days} дни.`;

    const confirmed = await showConfirmModal({
      title: `${normalizedTarget} на обява`,
      text:
        `${description}\n` +
        `Цена: ${formatMoney(price, "EUR")}.\n\n` +
        `Сигурен ли си, че искаш да активираш ${normalizedTarget}?`
    });

    if (!confirmed) return;

    try {
      const result = await authFetchJson(
        `${API_BASE_URL}/api/listings/${state.modal.listingId}/promote`,
        {
          method: "POST",
          body: JSON.stringify({ targetPromotionType: normalizedTarget })
        }
      );

      const actionHandled = await handlePaidActionResult(
        result,
        `Обявата е направена ${normalizedTarget} успешно.`
      );

      if (actionHandled !== "redirected") {
        await reloadModalListingDetails();
        invalidateSections("dashboard", "listings", "payments");
        if (state.currentSection === "listings") {
          state.loaded.listings = false;
        }
      }
    } catch (error) {
      console.error(error);
      showToast(error.message || "Неуспешно промотиране.", "error");
    }
  }

  async function handlePaidActionResult(result, successFallbackMessage) {
    if (result?.requiresPayment && result?.pendingActionId) {
      showToast("Стартиране на плащане...", "warning");

      const checkoutResult = await startPendingPayment(result.pendingActionId);

      if (checkoutResult === "redirected") {
        return "redirected";
      }

      showToast(result?.message || "Действието е изпратено за плащане.", "success");
      return "completed";
    }

    showToast(result?.message || successFallbackMessage, "success");
    return "completed";
  }

  async function startPendingPayment(pendingActionId) {
    const checkout = await authFetchJson(
      `${API_BASE_URL}/api/payments/mypos/start/${pendingActionId}`,
      { method: "POST" }
    );

    if (checkout?.isSimulated || checkout?.isCompleted) {
      showToast(checkout?.message || "Плащането е обработено успешно.", "success");
      return "completed";
    }

    const gatewayUrl = checkout?.gatewayUrl;
    const method = String(checkout?.method || "POST").toUpperCase();
    const fields = checkout?.fields || {};

    if (!gatewayUrl) {
      throw new Error("Липсва URL за плащане.");
    }

    submitPaymentForm(gatewayUrl, fields, method);
    return "redirected";
  }

  function submitPaymentForm(action, fields, method = "POST") {
    const form = document.createElement("form");
    form.method = method;
    form.action = action;
    form.style.display = "none";

    Object.entries(fields || {}).forEach(([key, value]) => {
      const input = document.createElement("input");
      input.type = "hidden";
      input.name = key;
      input.value = value == null ? "" : String(value);
      form.appendChild(input);
    });

    document.body.appendChild(form);
    form.submit();
  }

  async function onModalDeleteClick() {
    if (!state.modal.listingId) return;

    const confirmed = await showConfirmModal({
      title: "Изтриване на обява",
      text: "Сигурен ли си, че искаш да изтриеш тази обява? Това действие не може да се върне."
    });

    if (!confirmed) return;

    try {
      const result = await authFetchJson(
        `${API_BASE_URL}/api/listings/${state.modal.listingId}`,
        { method: "DELETE" }
      );

      showToast(result?.message || "Обявата е изтрита успешно.", "success");
      invalidateSections("dashboard", "listings", "favorites", "payments");
      await closeEditModal(false);
      await openSection("listings", { force: true });
    } catch (error) {
      console.error(error);
      showToast(error.message || "Неуспешно изтриване.", "error");
    }
  }

  async function reloadModalListingDetails() {
    if (!state.modal.listingId) return;

    const details = await fetchJson(`${API_BASE_URL}/api/listings/${state.modal.listingId}`);
    state.modal.listingDetails = details;
    updatePromotionUI(details);
  }

  async function onEditBrandChange() {
    if (state.modal.categoryCode !== "VEHICLE") return;

    const brandId = normalizeSelectValue(elements.editBrandId.value);
    const classId = normalizeSelectValue(elements.editSubCategoryLookupId.value);
    await loadModelsByBrandAndClass(brandId, classId);
  }

  async function onVehicleClassChange() {
    if (state.modal.categoryCode !== "VEHICLE") return;

    const classId = normalizeSelectValue(elements.editSubCategoryLookupId.value);
    const vehicleTypes = getVehicleTypesByClassId(classId);
    fillSelect(elements.editSubCategory2LookupId, vehicleTypes, "nameBg", "id");

    const brandId = normalizeSelectValue(elements.editBrandId.value);
    await loadModelsByBrandAndClass(brandId, classId);
  }

  async function loadModelsByBrandAndClass(brandId, classId, selectedModelId = null) {
    clearSelect(elements.editModelId);

    if (!brandId) return;

    try {
      const params = new URLSearchParams();
      params.set("brandId", brandId);
      if (classId) {
        params.set("vehicleClassLookupId", classId);
      }

      const models = await fetchJson(`${API_BASE_URL}/api/lookups/models?${params.toString()}`);
      fillSelect(elements.editModelId, Array.isArray(models) ? models : [], "name", "id");

      if (selectedModelId) {
        setSelectValue(elements.editModelId, selectedModelId);
      }
    } catch {
      clearSelect(elements.editModelId);
    }
  }

  async function onEditCountryChange() {
    const countryId = normalizeSelectValue(elements.editCountryId.value);
    await loadRegionsByCountry(countryId);
    clearSelect(elements.editCityId);
  }

  async function onEditRegionChange() {
    const regionId = normalizeSelectValue(elements.editRegionId.value);
    await loadCitiesByRegion(regionId);
  }

  async function loadRegionsByCountry(countryId, selectedRegionId = null, options = {}) {
    const regionSelect = options.regionSelect || elements.editRegionId;
    const citySelect = options.citySelect || elements.editCityId;

    clearSelect(regionSelect);
    clearSelect(citySelect);

    if (!countryId) return;

    if (!state.lookups.regionsByCountry[countryId]) {
      try {
        const regions = await fetchJson(`${API_BASE_URL}/api/lookups/regions/${countryId}`);
        state.lookups.regionsByCountry[countryId] = Array.isArray(regions) ? regions : [];
      } catch {
        state.lookups.regionsByCountry[countryId] = [];
      }
    }

    fillSelect(regionSelect, state.lookups.regionsByCountry[countryId], "nameBg", "id");

    if (selectedRegionId) {
      setSelectValue(regionSelect, selectedRegionId);
    }
  }

  async function loadCitiesByRegion(regionId, selectedCityId = null, citySelect = elements.editCityId) {
    clearSelect(citySelect);

    if (!regionId) return;

    if (!state.lookups.citiesByRegion[regionId]) {
      try {
        const cities = await fetchJson(`${API_BASE_URL}/api/lookups/cities/${regionId}`);
        state.lookups.citiesByRegion[regionId] = Array.isArray(cities) ? cities : [];
      } catch {
        state.lookups.citiesByRegion[regionId] = [];
      }
    }

    fillSelect(citySelect, state.lookups.citiesByRegion[regionId], "nameBg", "id");

    if (selectedCityId) {
      setSelectValue(citySelect, selectedCityId);
    }
  }

  function onGearTypeChange() {
    handleGearHelmetVisibility();
  }

  function onCurrencyChange() {
    const currency = (elements.editCurrencyCode.value || "EUR").toUpperCase();

    if (!elements.editExchangeRateToEUR.value) {
      if (currency === "EUR") {
        elements.editExchangeRateToEUR.value = "1";
      } else if (currency === "BGN") {
        elements.editExchangeRateToEUR.value = "0.51129";
      }
    }
  }

  async function cleanupUnsavedUploadedPhotos() {
    const unsavedNewPhotos = state.modal.photos.filter((photo) => photo.isNewUpload && photo.blobName);

    if (!unsavedNewPhotos.length) return;

    await Promise.all(
      unsavedNewPhotos.map(async (photo) => {
        try {
          await deleteOwnedBlob(photo.blobName);
        } catch {
          // нарочно мълчим
        }
      })
    );
  }

  async function deleteOwnedBlob(blobName) {
    if (!blobName) return;

    const response = await window.Auth.authFetch(
      `${API_BASE_URL}/api/listing-images?blobName=${encodeURIComponent(blobName)}`,
      { method: "DELETE" }
    );

    if (!response.ok) {
      const contentType = response.headers.get("content-type") || "";
      const data = contentType.includes("application/json") ? await response.json() : null;
      throw new Error(data?.message || "Неуспешно изтриване на снимката.");
    }
  }

  function normalizePhotos(photos) {
    return (photos || [])
      .map((photo, index) => ({
        clientKey: cryptoRandomKey(),
        id: photo?.id || null,
        fileName: photo?.fileName || `image-${index + 1}`,
        fileUrl: photo?.fileUrl || "",
        blobName: photo?.blobName || "",
        sortOrder: Number(photo?.sortOrder ?? index),
        isMain: Boolean(photo?.isMain),
        isNewUpload: false
      }))
      .sort((a, b) => a.sortOrder - b.sortOrder);
  }

  function clearSelect(select) {
    if (!select) return;
    if (!(select instanceof HTMLSelectElement)) return;
    select.innerHTML = `<option value="">Избери</option>`;
  }

  function fillSelect(select, items, labelKey = "nameBg", valueKey = "id") {
    if (!select) return;
    if (!(select instanceof HTMLSelectElement)) return;

    const currentValue = select.value;
    const safeItems = Array.isArray(items) ? items : [];

    select.innerHTML =
      `<option value="">Избери</option>` +
      safeItems
        .map((item) => {
          const label = item?.[labelKey] ?? item?.nameBg ?? item?.name ?? item?.code ?? "";
          const value = item?.[valueKey] ?? item?.id ?? item?.code ?? "";
          return `<option value="${escapeHtml(String(value))}">${escapeHtml(String(label))}</option>`;
        })
        .join("");

    const options = Array.from(select.options || []);
    if (options.some((option) => option.value === String(currentValue))) {
      select.value = String(currentValue);
    }
  }

  function setSelectValue(select, value) {
    if (!select) return;
    if (!(select instanceof HTMLSelectElement)) return;

    const normalized = value == null ? "" : String(value);
    const options = Array.from(select.options || []);

    if (options.some((option) => option.value === normalized)) {
      select.value = normalized;
    } else {
      select.value = "";
    }
  }

  function setInputValue(input, value) {
    if (!input) return;
    input.value = value == null ? "" : String(value);
  }

  function getVehicleTypesByClassId(classId) {
    if (!classId) return state.lookups.vehicleTypes;

    return state.lookups.vehicleTypes.filter((item) => String(item?.parentId || "") === String(classId));
  }

  function resolveMainCategoryCode(mainCategoryLookupId) {
    const match = state.lookups.mainCategories.find((item) => String(item?.id) === String(mainCategoryLookupId));
    return String(match?.code || "").trim().toUpperCase();
  }

  function normalizePromotionType(value) {
    const normalized = String(value || "NORMAL").trim().toUpperCase();
    return ["VIP", "TOP", "NORMAL"].includes(normalized) ? normalized : "NORMAL";
  }

  function normalizeAccountType(value) {
    const normalized = String(value || "").trim().toUpperCase();

    if (normalized === "PRIVATE") return "PRIVATE";
    if (!normalized) return null;

    return "COMPANY";
  }

  function getAccountTypeLabel(accountTypeRaw) {
    const accountType = normalizeAccountType(accountTypeRaw || "PRIVATE");
    return accountType === "PRIVATE" ? "Частен акаунт" : "Фирмен акаунт";
  }

  function getPricingByAccountType(accountTypeRaw) {
    const accountType = normalizeAccountType(accountTypeRaw || "PRIVATE");

    if (accountType === "PRIVATE") {
      return {
        refreshEUR: PRICING.PRIVATE_REFRESH_EUR,
        publishOverLimitEUR: PRICING.PRIVATE_OVER_LIMIT_PUBLISH_EUR
      };
    }

    return {
      refreshEUR: PRICING.COMPANY_REFRESH_EUR,
      publishOverLimitEUR: PRICING.COMPANY_OVER_LIMIT_PUBLISH_EUR
    };
  }

  function buildPricingSummaryText(accountTypeRaw, detailed = false) {
    const accountType = normalizeAccountType(accountTypeRaw || "PRIVATE");
    const pricing = getPricingByAccountType(accountType);

    if (detailed) {
      return accountType === "PRIVATE"
        ? `Частен акаунт: VIP ${formatMoney(PRICING.VIP_PRICE_EUR, "EUR")} / ${PRICING.VIP_DAYS} дни, TOP ${formatMoney(PRICING.TOP_PRICE_EUR, "EUR")} / ${PRICING.TOP_DAYS} дни, Refresh ${formatMoney(pricing.refreshEUR, "EUR")}, качване над лимита ${formatMoney(pricing.publishOverLimitEUR, "EUR")}.`
        : `Фирмен акаунт: VIP ${formatMoney(PRICING.VIP_PRICE_EUR, "EUR")} / ${PRICING.VIP_DAYS} дни, TOP ${formatMoney(PRICING.TOP_PRICE_EUR, "EUR")} / ${PRICING.TOP_DAYS} дни, Refresh ${formatMoney(pricing.refreshEUR, "EUR")}, качване над лимита ${formatMoney(pricing.publishOverLimitEUR, "EUR")}.`;
    }

    return `VIP ${formatMoney(PRICING.VIP_PRICE_EUR, "EUR")} • TOP ${formatMoney(PRICING.TOP_PRICE_EUR, "EUR")} • Refresh ${formatMoney(pricing.refreshEUR, "EUR")} • Над лимита ${formatMoney(pricing.publishOverLimitEUR, "EUR")}`;
  }

  function getPromotionBadgeClass(type) {
    const normalized = normalizePromotionType(type);
    if (normalized === "VIP") return "edit-promo-pill--vip";
    if (normalized === "TOP") return "edit-promo-pill--top";
    return "edit-promo-pill--normal";
  }

  function getListingStatusPillClass(type) {
    const normalized = normalizePromotionType(type);
    if (normalized === "VIP") return "listing-card__status-pill--vip";
    if (normalized === "TOP") return "listing-card__status-pill--top";
    return "listing-card__status-pill--normal";
  }

  function getPromotionRemainingLabel(type, promotionEndAt) {
    const normalized = normalizePromotionType(type);

    if (normalized === "NORMAL" || !promotionEndAt) {
      return "Няма активна промоция";
    }

    const end = new Date(promotionEndAt);
    if (Number.isNaN(end.getTime())) {
      return "Има активна промоция";
    }

    const diffMs = end.getTime() - Date.now();

    if (diffMs <= 0) {
      return "Промоцията е изтекла";
    }

    const totalMinutes = Math.floor(diffMs / (1000 * 60));
    const days = Math.floor(totalMinutes / (60 * 24));
    const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
    const minutes = totalMinutes % 60;

    if (days > 0) {
      return `Остават ${days}д ${hours}ч`;
    }

    if (hours > 0) {
      return `Остават ${hours}ч ${minutes}м`;
    }

    return `Остават ${minutes}м`;
  }

  function buildPromotionStatusNote(type, promotionEndAt) {
    const normalized = normalizePromotionType(type);

    if (normalized === "NORMAL" || !promotionEndAt) {
      return "Обявата е в нормален статус. Можеш да активираш VIP, TOP или refresh от секцията по-долу.";
    }

    const remaining = getPromotionRemainingLabel(normalized, promotionEndAt);
    const endText = formatDateTime(promotionEndAt);

    if (normalized === "VIP") {
      return `VIP е активен. ${remaining}. Край на промоцията: ${endText}. Докато VIP е активен, TOP не може да се пусне.`;
    }

    return `TOP е активен. ${remaining}. Край на промоцията: ${endText}. Можеш да вдигнеш обявата до VIP, ако искаш още по-силно позициониране.`;
  }

  let confirmModalCleanup = null;

  function showConfirmModal({ title, text }) {
    return new Promise((resolve) => {
      closeConfirmModal();

      elements.confirmModalTitle.textContent = title || "Потвърждение";
      elements.confirmModalText.textContent = text || "Сигурен ли си?";

      elements.confirmModalOverlay.classList.remove("hidden");

      const cancelHandler = () => {
        cleanup();
        resolve(false);
      };

      const okHandler = () => {
        cleanup();
        resolve(true);
      };

      const overlayHandler = (event) => {
        if (event.target === elements.confirmModalOverlay) {
          cancelHandler();
        }
      };

      function cleanup() {
        elements.closeConfirmModalBtn?.removeEventListener("click", cancelHandler);
        elements.confirmCancelBtn?.removeEventListener("click", cancelHandler);
        elements.confirmOkBtn?.removeEventListener("click", okHandler);
        elements.confirmModalOverlay?.removeEventListener("click", overlayHandler);

        elements.confirmModalOverlay.classList.add("hidden");
        confirmModalCleanup = null;
      }

      confirmModalCleanup = cleanup;

      elements.closeConfirmModalBtn?.addEventListener("click", cancelHandler);
      elements.confirmCancelBtn?.addEventListener("click", cancelHandler);
      elements.confirmOkBtn?.addEventListener("click", okHandler);
      elements.confirmModalOverlay?.addEventListener("click", overlayHandler);
    });
  }

  function closeConfirmModal() {
    if (typeof confirmModalCleanup === "function") {
      confirmModalCleanup();
      return;
    }

    elements.confirmModalOverlay?.classList.add("hidden");
    confirmModalCleanup = null;
  }

  function invalidateSections(...sections) {
    sections.forEach((section) => {
      if (!section || !Object.prototype.hasOwnProperty.call(state.loaded, section)) return;
      state.loaded[section] = false;
      state.data[section] = null;

      if (section === "listings") {
        state.listingCatalog.allItems = null;
      }
    });
  }

  async function authFetchJson(url, options = {}) {
    const response = await window.Auth.authFetch(url, {
      method: options.method || "GET",
      headers: {
        ...(options.body ? { "Content-Type": "application/json" } : {}),
        ...(options.headers || {})
      },
      body: options.body
    });

    return await parseResponseOrThrow(response);
  }

  async function authFetchJsonForSensitiveAction(url, options = {}) {
    const token = window.Auth?.getAccessToken?.();

    const response = await fetch(url, {
      method: options.method || "GET",
      headers: {
        ...(options.body ? { "Content-Type": "application/json" } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers || {})
      },
      body: options.body,
      credentials: "include"
    });

    return await parseSensitiveResponseOrThrow(response);
  }

  async function fetchJson(url, options = {}) {
    const response = await fetch(url, {
      method: options.method || "GET",
      headers: {
        ...(options.headers || {})
      },
      body: options.body
    });

    return await parseResponseOrThrow(response);
  }

  async function parseResponseOrThrow(response) {
    const contentType = response.headers.get("content-type") || "";
    const isJson = contentType.includes("application/json");
    const data = isJson ? await response.json() : null;

    if (response.status === 401) {
      showToast("Сесията е изтекла. Влез отново.", "error");
      window.Auth?.redirectToLogin?.();
      throw new Error("Неоторизиран достъп.");
    }

    if (!response.ok) {
      throw new Error(data?.message || data?.title || "Възникна грешка при заявката.");
    }

    return data;
  }

  async function parseSensitiveResponseOrThrow(response) {
    const contentType = response.headers.get("content-type") || "";
    const isJson = contentType.includes("application/json");
    const data = isJson ? await response.json() : null;
    const message = data?.message || data?.title || "";

    if (response.status === 401) {
      if (isPasswordValidationMessage(message)) {
        throw new Error(message || "Текущата парола е грешна.");
      }

      window.Auth?.clearAuthData?.();
      showToast("Сесията е изтекла. Влез отново.", "error");
      window.Auth?.redirectToLogin?.();
      throw new Error("Неоторизиран достъп.");
    }

    if (!response.ok) {
      throw new Error(message || "Възникна грешка при заявката.");
    }

    return data;
  }

  function showToast(message, type = "info") {
    if (!elements.toastStack) return;

    const toast = document.createElement("div");
    toast.className = `toast toast--${type}`;
    toast.textContent = message;

    elements.toastStack.appendChild(toast);

    setTimeout(() => {
      toast.remove();
    }, 3600);
  }

  function isPasswordValidationMessage(message) {
    const normalized = String(message || "").trim().toLowerCase();
    return normalized.includes("парола") || normalized.includes("password");
  }

  function getSectionTitle(section) {
    switch (section) {
      case "dashboard": return "Дашборд";
      case "listings": return "Моите обяви";
      case "favorites": return "Любими";
      case "payments": return "Плащания";
      case "editProfile": return "Редактиране на профила";
      default: return "Секция";
    }
  }

  function formatPaymentType(value) {
    const normalized = String(value || "").trim().toUpperCase();

    switch (normalized) {
      case "LISTING": return "Публикуване";
      case "REFRESH": return "Refresh";
      case "VIP": return "VIP";
      case "TOP": return "TOP";
      case "PROMOTE_VIP": return "Промотиране VIP";
      case "PROMOTE_TOP": return "Промотиране TOP";
      case "CREATE": return "Създаване";
      default: return value || "-";
    }
  }

  function formatMoney(value, currency = "EUR") {
    const numeric = Number(value || 0);
    return `${numeric.toFixed(2)} ${currency}`;
  }

  function formatDate(value) {
    try {
      const date = new Date(value);
      if (Number.isNaN(date.getTime())) return String(value);
      return new Intl.DateTimeFormat("bg-BG", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit"
      }).format(date);
    } catch {
      return String(value);
    }
  }

  function formatDateTime(value) {
    try {
      const date = new Date(value);
      if (Number.isNaN(date.getTime())) return String(value);
      return new Intl.DateTimeFormat("bg-BG", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit"
      }).format(date);
    } catch {
      return String(value);
    }
  }

  function isValidEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || "").trim());
  }

  function isValidPhone(value) {
    if (!/^[+\d\s()-]+$/.test(String(value || "").trim())) {
      return false;
    }

    const digitsOnly = String(value || "").replace(/\D/g, "");
    return digitsOnly.length >= 9 && digitsOnly.length <= 15;
  }

  function pick(obj, ...keys) {
    for (const key of keys) {
      const value = obj?.[key];
      if (value !== undefined && value !== null && value !== "") {
        return value;
      }
    }
    return null;
  }

  function readStoredUser() {
    const authUser = window.Auth?.getCurrentUser?.();
    if (authUser) return authUser;

    try {
      const raw = localStorage.getItem("moto_user") || localStorage.getItem("user");
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  function readStaticUserField(key) {
    const user = readStoredUser();
    if (!user) return "";
    if (key === "fullName") {
      return user.fullName || [user.firstName, user.lastName].filter(Boolean).join(" ").trim();
    }
    return user[key] || "";
  }

  function toNullableNumber(value) {
    if (value === null || value === undefined || String(value).trim() === "") return null;
    const parsed = Number(value);
    return Number.isNaN(parsed) ? null : parsed;
  }

  function toRequiredDecimal(value) {
    const parsed = Number(value);
    if (Number.isNaN(parsed)) {
      throw new Error("Невалидна цена.");
    }
    return parsed;
  }

  function toNullableString(value) {
    const trimmed = String(value || "").trim();
    return trimmed ? trimmed : null;
  }

  function normalizeSelectValue(value) {
    return value == null || String(value).trim() === "" ? null : String(value).trim();
  }

  function getExchangeRateValue(currencyCode) {
    const raw = String(elements.editExchangeRateToEUR.value || "").trim();
    if (raw) {
      const parsed = Number(raw);
      if (!Number.isNaN(parsed)) return parsed;
    }

    if (currencyCode === "EUR") return 1;
    if (currencyCode === "BGN") return 0.51129;

    return 1;
  }

  function cryptoRandomKey() {
    if (window.crypto?.randomUUID) {
      return window.crypto.randomUUID();
    }
    return `k-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }
})();
