(() => {
  const API_BASE_URL = (window.Auth?.API_BASE_URL || "https://motomarketapi.azurewebsites.net").replace(/\/+$/, "");
  const FETCH_PAGE_SIZE = 100;
  const MAX_FETCH_PAGES = 50;
  const ACCESSORY_OTHER_FILTER_VALUE = "__other__";
  const FOR_PARTS_CONDITION_LABEL = "\u0437\u0430 \u0447\u0430\u0441\u0442\u0438";
  const OTHER_ACCESSORY_LABEL = "\u0414\u0440\u0443\u0433\u0438";
  const AUTO_SEARCHABLE_SELECT_SELECTOR =
    "#filtersSection select:not(.searchable-select__native), .content__actions select:not(.searchable-select__native)";

  const state = {
    currentUser: null,
    isLogoutConfirmOpen: false,
    lookups: {
      countries: [],
      mainCategories: [],
      vehicleClasses: [],
      vehicleTypes: [],
      gearTypes: [],
      helmetTypes: [],
      partTypes: [],
      accessoryTypes: [],
      conditions: [],
      licenseCategories: [],
      vehicleBrands: [],
      gearBrands: [],
      partBrands: [],
      accessoryBrands: []
    },
    selectedMainCategoryCode: null,
    page: 1,
    pageSize: 12,
    allListings: [],
    filteredResults: [],
    currentDisplayCurrencyCode: "EUR",
    favoriteIds: new Set(),
    searchableSelects: new Map(),
    isMobileFiltersCollapsed: false
  };

  let priceChangePopoverEl = null;
  let activePriceChangeIndicator = null;
  let toastHideTimer = null;

  const MAIN_CATEGORY_META = {
    VEHICLE: {
      label: "Мотори",
      tag: "Машини",
      description: "Спортни, туристически, кросови и градски мотори на едно място.",
      footer: "Марка, модел, клас и мощност",
      image: "ImagesVideos/motorcycle.png",
      accent: "#143d8f",
      soft: "rgba(20, 61, 143, 0.12)",
      border: "rgba(20, 61, 143, 0.34)",
      ring: "rgba(20, 61, 143, 0.14)"
    },
    GEAR: {
      label: "Екипировка",
      tag: "Защита",
      description: "Каски, якета, ботуши, ръкавици и защита за каране.",
      footer: "Тип, марка и състояние",
      image: "ImagesVideos/racing-helmet.png",
      accent: "#ff6a2a",
      soft: "rgba(255, 106, 42, 0.12)",
      border: "rgba(255, 106, 42, 0.34)",
      ring: "rgba(255, 106, 42, 0.16)"
    },
    ACCESSORY: {
      label: "Аксесоари",
      tag: "Комфорт",
      description: "Куфари, стойки, електроника и удобства за мотора.",
      footer: "Тип, марка и цена",
      image: "ImagesVideos/trunk.png",
      accent: "#0f7b72",
      soft: "rgba(15, 123, 114, 0.12)",
      border: "rgba(15, 123, 114, 0.34)",
      ring: "rgba(15, 123, 114, 0.14)"
    },
    PART: {
      label: "Части",
      tag: "Сервиз",
      description: "Части за ремонт, поддръжка и подобрения.",
      footer: "Тип част, марка и цена",
      image: "ImagesVideos/disc-brake.png",
      accent: "#c84a1b",
      soft: "rgba(200, 74, 27, 0.12)",
      border: "rgba(200, 74, 27, 0.34)",
      ring: "rgba(200, 74, 27, 0.14)"
    }
  };

  const elements = {
    guestActions: document.getElementById("guestActions"),
    favoritesBtn: document.getElementById("favoritesBtn"),
    favoritesCount: document.getElementById("favoritesCount"),
    topbarUploadBtn: document.getElementById("topbarUploadBtn"),
    loginBtn: document.getElementById("loginBtn"),
    profileMenuWrap: document.getElementById("profileMenuWrap"),
    profileBtn: document.getElementById("profileBtn"),
    profileBtnText: document.getElementById("profileBtnText"),
    profileDropdown: document.getElementById("profileDropdown"),
    profileDashboardBtn: document.getElementById("profileDashboardBtn"),
    profileFavoritesBtn: document.getElementById("profileFavoritesBtn"),
    uploadListingBtn: document.getElementById("uploadListingBtn"),
    adminPanelBtn: document.getElementById("adminPanelBtn"),
    logoutBtn: document.getElementById("logoutBtn"),
    logoutConfirmModal: document.getElementById("logoutConfirmModal"),
    cancelLogoutBtn: document.getElementById("cancelLogoutBtn"),
    confirmLogoutBtn: document.getElementById("confirmLogoutBtn"),
    toastStack: document.getElementById("toastStack"),

    mainCategoryList: document.getElementById("mainCategoryList"),
    listingsGrid: document.getElementById("listingsGrid"),
    resultsCount: document.getElementById("resultsCount"),
    pagination: document.getElementById("pagination"),
    globalSearch: document.getElementById("globalSearch"),
    searchBtn: document.getElementById("searchBtn"),
    sortSelect: document.getElementById("sortSelect"),
    clearFiltersBtn: document.getElementById("clearFiltersBtn"),
    filtersEmptyState: document.getElementById("filtersEmptyState"),
    mainCategoryHeroList: document.getElementById("mainCategoryHeroList"),
    showAllCategoriesBtn: document.getElementById("showAllCategoriesBtn"),
    pageGrid: document.getElementById("pageGrid"),
    listingsSection: document.getElementById("listingsSection"),
    mobileFiltersMount: document.getElementById("mobileFiltersMount"),

    filtersSection: document.getElementById("filtersSection"),
    overlay: document.getElementById("overlay"),
    mobileFilterBtn: document.getElementById("mobileFilterBtn"),
    closeFiltersBtn: document.getElementById("closeFiltersBtn"),

    categoryChooser: document.getElementById("categoryChooser"),
    vehicleFilters: document.getElementById("vehicleFilters"),
    gearFilters: document.getElementById("gearFilters"),
    partFilters: document.getElementById("partFilters"),
    accessoryFilters: document.getElementById("accessoryFilters"),

    backToCategoriesVehicleBtn: document.getElementById("backToCategoriesVehicleBtn"),
    backToCategoriesGearBtn: document.getElementById("backToCategoriesGearBtn"),
    backToCategoriesPartBtn: document.getElementById("backToCategoriesPartBtn"),
    backToCategoriesAccessoryBtn: document.getElementById("backToCategoriesAccessoryBtn"),

    vehicleClassFilter: document.getElementById("vehicleClassFilter"),
    vehicleTypeFilter: document.getElementById("vehicleTypeFilter"),
    vehicleBrandFilter: document.getElementById("vehicleBrandFilter"),
    vehicleBrandSearch: document.getElementById("vehicleBrandSearch"),
    vehicleBrandOptions: document.getElementById("vehicleBrandOptions"),
    vehicleModelFilter: document.getElementById("vehicleModelFilter"),
    vehicleModelSearch: document.getElementById("vehicleModelSearch"),
    vehicleModelOptions: document.getElementById("vehicleModelOptions"),
    vehicleConditionFilter: document.getElementById("vehicleConditionFilter"),
    vehicleLocationModeFilter: document.getElementById("vehicleLocationModeFilter"),
    vehicleCountryWrap: document.getElementById("vehicleCountryWrap"),
    vehicleCountryFilter: document.getElementById("vehicleCountryFilter"),
    vehicleRegionWrap: document.getElementById("vehicleRegionWrap"),
    vehicleRegionFilter: document.getElementById("vehicleRegionFilter"),
    vehicleCityWrap: document.getElementById("vehicleCityWrap"),
    vehicleCityFilter: document.getElementById("vehicleCityFilter"),
    vehiclePriceMin: document.getElementById("vehiclePriceMin"),
    vehiclePriceMax: document.getElementById("vehiclePriceMax"),
    vehicleYearFrom: document.getElementById("vehicleYearFrom"),
    vehicleYearTo: document.getElementById("vehicleYearTo"),
    vehicleEngineCcFrom: document.getElementById("vehicleEngineCcFrom"),
    vehicleEngineCcTo: document.getElementById("vehicleEngineCcTo"),
    vehicleHorsePowerFrom: document.getElementById("vehicleHorsePowerFrom"),
    vehicleHorsePowerTo: document.getElementById("vehicleHorsePowerTo"),
    vehicleLicenseCategoryFilter: document.getElementById("vehicleLicenseCategoryFilter"),
    vehicleMileageTo: document.getElementById("vehicleMileageTo"),
    vehicleVipOnlyFilter: document.getElementById("vehicleVipOnlyFilter"),
    vehicleTopOnlyFilter: document.getElementById("vehicleTopOnlyFilter"),

    gearTypeFilter: document.getElementById("gearTypeFilter"),
    gearHelmetTypeWrap: document.getElementById("gearHelmetTypeWrap"),
    gearHelmetTypeFilter: document.getElementById("gearHelmetTypeFilter"),
    gearBrandFilter: document.getElementById("gearBrandFilter"),
    gearConditionFilter: document.getElementById("gearConditionFilter"),
    gearLocationModeFilter: document.getElementById("gearLocationModeFilter"),
    gearCountryWrap: document.getElementById("gearCountryWrap"),
    gearCountryFilter: document.getElementById("gearCountryFilter"),
    gearRegionWrap: document.getElementById("gearRegionWrap"),
    gearRegionFilter: document.getElementById("gearRegionFilter"),
    gearCityWrap: document.getElementById("gearCityWrap"),
    gearCityFilter: document.getElementById("gearCityFilter"),
    gearPriceMin: document.getElementById("gearPriceMin"),
    gearPriceMax: document.getElementById("gearPriceMax"),
    gearVipOnlyFilter: document.getElementById("gearVipOnlyFilter"),
    gearTopOnlyFilter: document.getElementById("gearTopOnlyFilter"),

    partTypeFilter: document.getElementById("partTypeFilter"),
    partBrandFilter: document.getElementById("partBrandFilter"),
    partConditionFilter: document.getElementById("partConditionFilter"),
    partLocationModeFilter: document.getElementById("partLocationModeFilter"),
    partCountryWrap: document.getElementById("partCountryWrap"),
    partCountryFilter: document.getElementById("partCountryFilter"),
    partRegionWrap: document.getElementById("partRegionWrap"),
    partRegionFilter: document.getElementById("partRegionFilter"),
    partCityWrap: document.getElementById("partCityWrap"),
    partCityFilter: document.getElementById("partCityFilter"),
    partPriceMin: document.getElementById("partPriceMin"),
    partPriceMax: document.getElementById("partPriceMax"),
    partVipOnlyFilter: document.getElementById("partVipOnlyFilter"),
    partTopOnlyFilter: document.getElementById("partTopOnlyFilter"),

    accessoryTypeFilter: document.getElementById("accessoryTypeFilter"),
    accessoryBrandFilter: document.getElementById("accessoryBrandFilter"),
    accessoryConditionFilter: document.getElementById("accessoryConditionFilter"),
    accessoryLocationModeFilter: document.getElementById("accessoryLocationModeFilter"),
    accessoryCountryWrap: document.getElementById("accessoryCountryWrap"),
    accessoryCountryFilter: document.getElementById("accessoryCountryFilter"),
    accessoryRegionWrap: document.getElementById("accessoryRegionWrap"),
    accessoryRegionFilter: document.getElementById("accessoryRegionFilter"),
    accessoryCityWrap: document.getElementById("accessoryCityWrap"),
    accessoryCityFilter: document.getElementById("accessoryCityFilter"),
    accessoryPriceMin: document.getElementById("accessoryPriceMin"),
    accessoryPriceMax: document.getElementById("accessoryPriceMax"),
    accessoryVipOnlyFilter: document.getElementById("accessoryVipOnlyFilter"),
    accessoryTopOnlyFilter: document.getElementById("accessoryTopOnlyFilter")
  };

  document.addEventListener("DOMContentLoaded", init);

  async function init() {
    bindStaticEvents();
    bindPriceChangeIndicatorEvents();
    initSearchableSelects();
    await hydrateAuthUI();
    await loadLookups();
    renderMainCategories();
    bindFilterEvents();
    handleHelmetTypeVisibility();
    handleLocationModeVisibility("vehicle");
    handleLocationModeVisibility("gear");
    handleLocationModeVisibility("part");
    handleLocationModeVisibility("accessory");
    handleAppHeight();
    handleResponsiveFiltersPlacement();
    window.addEventListener("resize", handleViewportChange);
    window.addEventListener("pageshow", onPageShow);
    await loadInitialListings();
  }

  async function onPageShow(event) {
    if (!event.persisted) return;

    await hydrateAuthUI();
    syncFavoriteButtons();
  }

  function setProfileDropdownExpanded(isExpanded) {
    elements.profileBtn?.setAttribute("aria-expanded", isExpanded ? "true" : "false");
  }

  function closeProfileDropdown() {
    elements.profileDropdown?.classList.add("hidden");
    setProfileDropdownExpanded(false);
  }

  function toggleProfileDropdown() {
    if (!elements.profileDropdown) return;

    const shouldOpen = elements.profileDropdown.classList.contains("hidden");
    elements.profileDropdown.classList.toggle("hidden", !shouldOpen);
    setProfileDropdownExpanded(shouldOpen);
  }

  function handleViewportChange() {
    handleAppHeight();
    handleResponsiveFiltersPlacement();
  }

  async function loadInitialListings() {
    showAllCategoriesView();
    await loadListings();
  }

  function bindStaticEvents() {
    elements.topbarUploadBtn?.addEventListener("click", () => window.Auth.redirectToCreateListing());
    elements.loginBtn?.addEventListener("click", () => window.Auth.redirectToLogin());
    elements.profileDashboardBtn?.addEventListener("click", () => window.Auth.redirectToProfile());
    elements.profileFavoritesBtn?.addEventListener("click", () => window.Auth.redirectToFavorites());
    elements.uploadListingBtn?.addEventListener("click", () => window.Auth.redirectToCreateListing());
    elements.adminPanelBtn?.addEventListener("click", () => window.Auth.redirectToAdminPanel());
    elements.logoutBtn?.addEventListener("click", openLogoutConfirm);
    elements.cancelLogoutBtn?.addEventListener("click", closeLogoutConfirm);
    elements.confirmLogoutBtn?.addEventListener("click", onConfirmLogout);
    elements.logoutConfirmModal?.addEventListener("click", (e) => {
      if (e.target === elements.logoutConfirmModal) {
        closeLogoutConfirm();
      }
    });

    elements.favoritesBtn?.addEventListener("click", () => {
      if (!window.Auth.isLoggedIn()) {
        window.Auth.redirectToLogin();
        return;
      }
      window.Auth.redirectToFavorites();
    });

    elements.profileBtn?.addEventListener("click", (e) => {
      e.stopPropagation();

      if (!window.Auth.isLoggedIn()) {
        window.Auth.redirectToLogin();
        return;
      }

      toggleProfileDropdown();
    });

    document.addEventListener("click", (e) => {
      if (!elements.profileMenuWrap?.contains(e.target)) {
        closeProfileDropdown();
      }
    });

    document.addEventListener("click", (e) => {
      if (![...state.searchableSelects.values()].some((instance) => instance.root.contains(e.target))) {
        closeAllSearchableSelects();
      }
    });

    document.addEventListener("keydown", (e) => {
      if (e.key !== "Escape") {
        return;
      }

      if (state.isLogoutConfirmOpen) {
        e.preventDefault();
        closeLogoutConfirm();
        return;
      }

      closeProfileDropdown();
    });

    elements.mobileFilterBtn?.addEventListener("click", () => {
      if (!isMobileFiltersMode()) {
        openMobileFilters();
        return;
      }

      if (state.isMobileFiltersCollapsed) {
        openMobileFilters();
        return;
      }

      closeMobileFilters();
    });
    elements.closeFiltersBtn?.addEventListener("click", closeMobileFilters);
    elements.overlay?.addEventListener("click", closeMobileFilters);

    elements.clearFiltersBtn?.addEventListener("click", clearAllFilters);
    elements.showAllCategoriesBtn?.addEventListener("click", backToCategories);

    elements.searchBtn?.addEventListener("click", async () => {
      await executeSearch();
    });

    elements.globalSearch?.addEventListener("keydown", async (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        await executeSearch();
      }
    });

    elements.globalSearch?.addEventListener("input", () => {
      if (!state.allListings.length) return;
      state.page = 1;
      applyClientFiltersAndRender();
    });

    elements.sortSelect?.addEventListener("change", async () => {
      state.page = 1;

      if (state.allListings.length) {
        applyClientFiltersAndRender();
        return;
      }

      await loadListings();
    });

    elements.backToCategoriesVehicleBtn?.addEventListener("click", backToCategories);
    elements.backToCategoriesGearBtn?.addEventListener("click", backToCategories);
    elements.backToCategoriesPartBtn?.addEventListener("click", backToCategories);
    elements.backToCategoriesAccessoryBtn?.addEventListener("click", backToCategories);
  }

  async function executeSearch() {
    state.page = 1;

    if (state.allListings.length) {
      applyClientFiltersAndRender();
      return;
    }

    await loadListings();
  }

  function bindFilterEvents() {
    const reloadOnChange = [
      elements.vehicleClassFilter,
      elements.vehicleTypeFilter,
      elements.vehicleBrandFilter,
      elements.vehicleModelFilter,
      elements.vehicleConditionFilter,
      elements.vehicleLocationModeFilter,
      elements.vehicleCountryFilter,
      elements.vehicleRegionFilter,
      elements.vehicleCityFilter,
      elements.vehiclePriceMin,
      elements.vehiclePriceMax,
      elements.vehicleYearFrom,
      elements.vehicleYearTo,
      elements.vehicleEngineCcFrom,
      elements.vehicleEngineCcTo,
      elements.vehicleHorsePowerFrom,
      elements.vehicleHorsePowerTo,
      elements.vehicleLicenseCategoryFilter,
      elements.vehicleMileageTo,
      elements.vehicleVipOnlyFilter,
      elements.vehicleTopOnlyFilter,

      elements.gearTypeFilter,
      elements.gearHelmetTypeFilter,
      elements.gearBrandFilter,
      elements.gearConditionFilter,
      elements.gearLocationModeFilter,
      elements.gearCountryFilter,
      elements.gearRegionFilter,
      elements.gearCityFilter,
      elements.gearPriceMin,
      elements.gearPriceMax,
      elements.gearVipOnlyFilter,
      elements.gearTopOnlyFilter,

      elements.partTypeFilter,
      elements.partBrandFilter,
      elements.partConditionFilter,
      elements.partLocationModeFilter,
      elements.partCountryFilter,
      elements.partRegionFilter,
      elements.partCityFilter,
      elements.partPriceMin,
      elements.partPriceMax,
      elements.partVipOnlyFilter,
      elements.partTopOnlyFilter,

      elements.accessoryTypeFilter,
      elements.accessoryBrandFilter,
      elements.accessoryConditionFilter,
      elements.accessoryLocationModeFilter,
      elements.accessoryCountryFilter,
      elements.accessoryRegionFilter,
      elements.accessoryCityFilter,
      elements.accessoryPriceMin,
      elements.accessoryPriceMax,
      elements.accessoryVipOnlyFilter,
      elements.accessoryTopOnlyFilter
    ];

    reloadOnChange.forEach((element) => {
      if (!element) return;

      element.addEventListener("change", async () => {
        if (element === elements.vehicleBrandFilter) {
          await loadVehicleModels(
            elements.vehicleBrandFilter.value || null,
            elements.vehicleClassFilter.value || null
          );
        }

        if (element === elements.vehicleClassFilter) {
          await loadVehicleTypesByClass(elements.vehicleClassFilter.value || null);
          await loadVehicleModels(
            elements.vehicleBrandFilter.value || null,
            elements.vehicleClassFilter.value || null
          );
        }

        if (element === elements.gearTypeFilter) {
          handleHelmetTypeVisibility();
        }

        if (element === elements.vehicleLocationModeFilter) {
          sanitizeLocationFilters("vehicle");
        }

        if (element === elements.gearLocationModeFilter) {
          sanitizeLocationFilters("gear");
        }

        if (element === elements.partLocationModeFilter) {
          sanitizeLocationFilters("part");
        }

        if (element === elements.accessoryLocationModeFilter) {
          sanitizeLocationFilters("accessory");
        }

        if (element === elements.vehicleCountryFilter) {
          await loadRegionsFor("vehicle", elements.vehicleCountryFilter.value);
        }

        if (element === elements.vehicleRegionFilter) {
          await loadCitiesFor("vehicle", elements.vehicleRegionFilter.value);
        }

        if (element === elements.gearCountryFilter) {
          await loadRegionsFor("gear", elements.gearCountryFilter.value);
        }

        if (element === elements.gearRegionFilter) {
          await loadCitiesFor("gear", elements.gearRegionFilter.value);
        }

        if (element === elements.partCountryFilter) {
          await loadRegionsFor("part", elements.partCountryFilter.value);
        }

        if (element === elements.partRegionFilter) {
          await loadCitiesFor("part", elements.partRegionFilter.value);
        }

        if (element === elements.accessoryCountryFilter) {
          await loadRegionsFor("accessory", elements.accessoryCountryFilter.value);
        }

        if (element === elements.accessoryRegionFilter) {
          await loadCitiesFor("accessory", elements.accessoryRegionFilter.value);
        }

        handleLocationModeVisibility("vehicle");
        handleLocationModeVisibility("gear");
        handleLocationModeVisibility("part");
        handleLocationModeVisibility("accessory");

        state.page = 1;
        await loadListings();
      });
    });
  }

  async function hydrateAuthUI() {
    const user = await window.Auth.fetchCurrentUserFromApi();
    state.currentUser = user;

    if (!user) {
      elements.guestActions?.classList.remove("hidden");
      elements.profileMenuWrap?.classList.add("hidden");
      elements.adminPanelBtn?.classList.add("hidden");
      elements.favoritesBtn?.classList.add("hidden");
      state.favoriteIds = new Set();
      updateFavoritesCount(0);
      syncFavoriteButtons();
      return;
    }

    elements.guestActions?.classList.add("hidden");
    elements.profileMenuWrap?.classList.remove("hidden");
    elements.favoritesBtn?.classList.remove("hidden");

    const displayName =
      user.companyName ||
      user.fullName ||
      [user.firstName, user.lastName].filter(Boolean).join(" ").trim() ||
      "Профил";

    if (elements.profileBtnText) {
      elements.profileBtnText.textContent = "Профил";
    }

    elements.profileBtn?.setAttribute("title", displayName);
    elements.profileBtn?.setAttribute("aria-label", "Профил");
    setProfileDropdownExpanded(false);

    elements.adminPanelBtn?.classList.toggle("hidden", !window.Auth.isAdminUser(user));

    await loadFavoriteIds();
  }

  async function loadFavoriteIds() {
    if (!window.Auth.isLoggedIn()) {
      state.favoriteIds = new Set();
      updateFavoritesCount(0);
      syncFavoriteButtons();
      return;
    }

    try {
      const response = await window.Auth.authFetch(
        `${API_BASE_URL}/api/profile/favorites?page=1&pageSize=200`
      );

      if (!response.ok) {
        state.favoriteIds = new Set();
        updateFavoritesCount(0);
        syncFavoriteButtons();
        return;
      }

      const data = await response.json();
      const items = Array.isArray(data.items) ? data.items : [];
      state.favoriteIds = new Set(items.map((x) => String(x.id)));
      updateFavoritesCount(items.length);
      syncFavoriteButtons();
    } catch {
      state.favoriteIds = new Set();
      updateFavoritesCount(0);
      syncFavoriteButtons();
    }
  }

  function updateFavoritesCount(count) {
    if (elements.favoritesCount) {
      elements.favoritesCount.textContent = String(count || 0);
    }
  }

  async function loadLookups() {
    try {
      const [
        countries,
        mainCategories,
        vehicleClasses,
        vehicleTypes,
        gearTypes,
        helmetTypes,
        partTypes,
        accessoryTypes,
        conditions,
        licenseCategories,
        vehicleBrands,
        gearBrands,
        partBrands,
        accessoryBrands
      ] = await Promise.all([
        getJson(`${API_BASE_URL}/api/lookups/countries`),
        getJson(`${API_BASE_URL}/api/lookups/main-categories`),
        getJson(`${API_BASE_URL}/api/lookups/vehicle-classes`),
        getJson(`${API_BASE_URL}/api/lookups/vehicle-types`),
        getJson(`${API_BASE_URL}/api/lookups/gear-types`),
        getJson(`${API_BASE_URL}/api/lookups/helmet-types`),
        getJson(`${API_BASE_URL}/api/lookups/part-types`),
        getJson(`${API_BASE_URL}/api/lookups/accessory-types`),
        getJson(`${API_BASE_URL}/api/lookups/conditions`),
        getJson(`${API_BASE_URL}/api/lookups/license-categories`),
        getJson(`${API_BASE_URL}/api/lookups/brands?brandType=VEHICLE`),
        getJson(`${API_BASE_URL}/api/lookups/brands?brandType=GEAR`),
        getJson(`${API_BASE_URL}/api/lookups/brands?brandType=PART`),
        getJson(`${API_BASE_URL}/api/lookups/brands?brandType=ACCESSORY`)
      ]);

      state.lookups.countries = sortLookupItems(countries || [], "nameBg");
      state.lookups.mainCategories = Array.isArray(mainCategories) ? mainCategories : [];
      state.lookups.vehicleClasses = sortLookupItems(vehicleClasses || []);
      state.lookups.vehicleTypes = sortLookupItems(vehicleTypes || []);
      state.lookups.gearTypes = sortLookupItems(gearTypes || []);
      state.lookups.helmetTypes = sortLookupItems(helmetTypes || []);
      state.lookups.partTypes = sortLookupItems(partTypes || []);
      state.lookups.accessoryTypes = sortLookupItems(accessoryTypes || []);
      state.lookups.conditions = sortLookupItems(conditions || []);
      state.lookups.licenseCategories = sortLookupItems(licenseCategories || []);
      state.lookups.vehicleBrands = sortLookupItems(vehicleBrands || [], "name");
      state.lookups.gearBrands = sortLookupItems(gearBrands || [], "name");
      state.lookups.partBrands = sortLookupItems(partBrands || [], "name");
      state.lookups.accessoryBrands = sortLookupItems(accessoryBrands || [], "name");

      fillSelect(elements.vehicleClassFilter, state.lookups.vehicleClasses);
      fillSelect(elements.vehicleTypeFilter, state.lookups.vehicleTypes);
      fillSelect(elements.vehicleBrandFilter, state.lookups.vehicleBrands, "name");
      fillSelect(elements.vehicleModelFilter, [], "name", "id");
      fillSelect(elements.vehicleConditionFilter, state.lookups.conditions);
      fillSelect(elements.vehicleLicenseCategoryFilter, state.lookups.licenseCategories);

      fillSelect(elements.gearTypeFilter, state.lookups.gearTypes);
      fillSelect(elements.gearHelmetTypeFilter, state.lookups.helmetTypes);
      fillSelect(elements.gearBrandFilter, state.lookups.gearBrands, "name");
      fillSelect(elements.gearConditionFilter, getConditionOptionsForCategory("GEAR"));

      fillSelect(elements.partTypeFilter, state.lookups.partTypes);
      fillSelect(elements.partBrandFilter, state.lookups.partBrands, "name");
      fillSelect(elements.partConditionFilter, state.lookups.conditions);

      fillSelect(elements.accessoryTypeFilter, getAccessoryTypeOptions());
      fillSelect(elements.accessoryBrandFilter, state.lookups.accessoryBrands, "name");
      fillSelect(elements.accessoryConditionFilter, getConditionOptionsForCategory("ACCESSORY"));

      fillCountries();

      refreshSearchableSelect("vehicleBrandFilter");
      refreshSearchableSelect("vehicleModelFilter");
    } catch (error) {
      console.error("Грешка при lookup-ите:", error);
      showErrorState("Възникна проблем при зареждане на филтрите.");
    }
  }

  function renderMainCategories() {
    const fallback = [
      { code: "VEHICLE", nameBg: "Мотори" },
      { code: "GEAR", nameBg: "Екипировка" },
      { code: "ACCESSORY", nameBg: "Аксесоари" },
      { code: "PART", nameBg: "Части" }
    ];

    const rawCategories = state.lookups.mainCategories?.length
      ? state.lookups.mainCategories
      : fallback;

    const displayOrder = {
      VEHICLE: 1,
      GEAR: 2,
      ACCESSORY: 3,
      PART: 4
    };

    const categories = rawCategories
      .filter((x) => ["VEHICLE", "GEAR", "ACCESSORY", "PART"].includes(normalizeMainCategoryCode(x.code)))
      .sort((a, b) => {
        const orderA = displayOrder[normalizeMainCategoryCode(a.code)] || 999;
        const orderB = displayOrder[normalizeMainCategoryCode(b.code)] || 999;
        return orderA - orderB;
      });

    elements.mainCategoryList.innerHTML = categories
      .map((category) => {
        const code = normalizeMainCategoryCode(category.code);
        const meta = getMainCategoryMeta(code);
        return `<button class="category-pill" type="button" data-category-code="${escapeHtml(code)}">${escapeHtml(meta.label)}</button>`;
      })
      .join("");

    elements.mainCategoryHeroList.innerHTML = categories
      .map((category) => {
        const code = normalizeMainCategoryCode(category.code);
        const meta = getMainCategoryMeta(code);

        return `
          <button
            class="category-feature-card"
            type="button"
            data-category-code="${escapeHtml(code)}"
            style="--category-accent:${escapeHtml(meta.accent)}; --category-soft:${escapeHtml(meta.soft)}; --category-border:${escapeHtml(meta.border)}; --category-ring:${escapeHtml(meta.ring)};"
          >
            <span class="category-feature-card__header">
              <span class="category-feature-card__icon">
                <img src="${escapeHtml(meta.image)}" alt="${escapeHtml(meta.label)}" loading="lazy" />
              </span>
              <span class="category-feature-card__title">${escapeHtml(meta.label)}</span>
            </span>
            <span class="category-feature-card__description">${escapeHtml(meta.description)}</span>
          </button>
        `;
      })
      .join("");

    bindMainCategoryButtons(elements.mainCategoryList?.querySelectorAll("[data-category-code]"));
    bindMainCategoryButtons(elements.mainCategoryHeroList?.querySelectorAll("[data-category-code]"));
    syncMainCategoryButtons();
    updateCategoryPromptState();
  }

  function getMainCategoryMeta(code, fallbackLabel = "") {
    const normalizedCode = normalizeMainCategoryCode(code);
    const meta = MAIN_CATEGORY_META[normalizedCode] || {};

    return {
      label: fallbackLabel || meta.label || normalizedCode,
      tag: meta.tag || "Категория",
      description: meta.description || "Ще покажем подходящите филтри.",
      footer: meta.footer || "Зареди филтрите",
      image: meta.image || "ImagesVideos/MzLogoSquare.png",
      accent: meta.accent || "#ff6a2a",
      soft: meta.soft || "rgba(255, 106, 42, 0.12)",
      border: meta.border || "rgba(255, 106, 42, 0.34)",
      ring: meta.ring || "rgba(255, 106, 42, 0.14)"
    };
  }

  function bindMainCategoryButtons(buttons) {
    if (!buttons) return;

    [...buttons].forEach((button) => {
      button.addEventListener("click", async () => {
        const code = normalizeMainCategoryCode(button.dataset.categoryCode);

        if (!code) {
          return;
        }

        if (state.selectedMainCategoryCode === code) {
          backToCategories();
          return;
        }

        await chooseStartupCategory(code);
      });
    });
  }

  function syncMainCategoryButtons() {
    document.querySelectorAll("[data-category-code]").forEach((button) => {
      const code = normalizeMainCategoryCode(button.dataset.categoryCode);
      button.classList.toggle("active", code === state.selectedMainCategoryCode);
    });
  }

  function updateCategoryPromptState() {
    const meta = state.selectedMainCategoryCode
      ? getMainCategoryMeta(state.selectedMainCategoryCode)
      : null;

    elements.showAllCategoriesBtn?.classList.toggle("hidden", !meta);
  }

  function isMobileFiltersMode() {
    return window.matchMedia("(max-width: 980px)").matches;
  }

  function handleResponsiveFiltersPlacement() {
    const shouldUseInlineMobileFilters = isMobileFiltersMode();

    if (shouldUseInlineMobileFilters) {
      if (
        elements.filtersSection &&
        elements.mobileFiltersMount &&
        elements.filtersSection.parentElement !== elements.mobileFiltersMount
      ) {
        elements.mobileFiltersMount.appendChild(elements.filtersSection);
      }

      elements.filtersSection?.classList.add("filters--mobile-inline");
      elements.filtersSection?.classList.remove("open");
      elements.overlay?.classList.remove("open");
    } else {
      if (
        elements.filtersSection &&
        elements.pageGrid &&
        elements.filtersSection.parentElement !== elements.pageGrid
      ) {
        elements.pageGrid.insertBefore(elements.filtersSection, elements.listingsSection);
      }

      elements.filtersSection?.classList.remove("filters--mobile-inline");
      elements.filtersSection?.classList.remove("open");
      elements.overlay?.classList.remove("open");
      state.isMobileFiltersCollapsed = false;
    }

    updateFiltersLayoutState();
  }

  function updateFiltersLayoutState() {
    const hasSelectedCategory = Boolean(state.selectedMainCategoryCode);
    const useInlineMobileFilters = isMobileFiltersMode();

    elements.filtersEmptyState?.classList.add("hidden");
    elements.categoryChooser?.classList.add("hidden");

    if (elements.closeFiltersBtn) {
      elements.closeFiltersBtn.textContent = useInlineMobileFilters ? "Скрий филтрите" : "✕";
      elements.closeFiltersBtn.setAttribute(
        "aria-label",
        useInlineMobileFilters ? "Скрий филтрите" : "Затвори филтрите"
      );
    }

    if (useInlineMobileFilters) {
      elements.mobileFiltersMount?.classList.toggle(
        "hidden",
        !hasSelectedCategory || state.isMobileFiltersCollapsed
      );
      elements.filtersSection?.classList.toggle(
        "hidden",
        !hasSelectedCategory || state.isMobileFiltersCollapsed
      );
      elements.mobileFilterBtn?.classList.toggle("hidden", !hasSelectedCategory);

      if (elements.mobileFilterBtn) {
        elements.mobileFilterBtn.textContent = "Филтри";
        elements.mobileFilterBtn.setAttribute(
          "aria-expanded",
          state.isMobileFiltersCollapsed ? "false" : "true"
        );
        elements.mobileFilterBtn.setAttribute(
          "aria-label",
          state.isMobileFiltersCollapsed ? "Покажи филтрите" : "Скрий филтрите"
        );
        elements.mobileFilterBtn.classList.toggle(
          "mobile-filter-btn--active",
          !state.isMobileFiltersCollapsed
        );
      }

      elements.pageGrid?.classList.remove("page-grid--filters-hidden");
      syncModalOpenState();
      return;
    }

    state.isMobileFiltersCollapsed = false;
    elements.mobileFiltersMount?.classList.add("hidden");
    elements.mobileFilterBtn?.classList.add("hidden");
    elements.mobileFilterBtn?.classList.remove("mobile-filter-btn--active");
    elements.mobileFilterBtn?.setAttribute("aria-expanded", "false");
    elements.filtersSection?.classList.toggle("hidden", !hasSelectedCategory);
    elements.pageGrid?.classList.toggle("page-grid--filters-hidden", !hasSelectedCategory);
    syncModalOpenState();
  }

  async function chooseStartupCategory(code, options = {}) {
    if (!code) return;
    const { scrollToListings = true } = options;

    activateMainCategory(code);
    state.isMobileFiltersCollapsed = false;

    if (!isMobileFiltersMode()) {
      closeMobileFilters();
    } else {
      updateFiltersLayoutState();
    }

    state.page = 1;
    await loadListings();

    if (!scrollToListings) {
      return;
    }

    const listingsSectionTop = document.getElementById("listingsSection")?.offsetTop || 0;

    window.scrollTo({
      top: Math.max(0, listingsSectionTop - 90),
      behavior: "smooth"
    });
  }

  function activateMainCategory(code) {
    state.selectedMainCategoryCode = normalizeMainCategoryCode(code);
    state.page = 1;
    state.allListings = [];
    state.filteredResults = [];

    syncMainCategoryButtons();
    elements.categoryChooser.classList.add("hidden");
    elements.filtersEmptyState?.classList.add("hidden");
    elements.vehicleFilters.classList.add("hidden");
    elements.gearFilters.classList.add("hidden");
    elements.partFilters.classList.add("hidden");
    elements.accessoryFilters.classList.add("hidden");

    if (state.selectedMainCategoryCode === "VEHICLE") elements.vehicleFilters.classList.remove("hidden");
    if (state.selectedMainCategoryCode === "GEAR") elements.gearFilters.classList.remove("hidden");
    if (state.selectedMainCategoryCode === "PART") elements.partFilters.classList.remove("hidden");
    if (state.selectedMainCategoryCode === "ACCESSORY") elements.accessoryFilters.classList.remove("hidden");

    handleHelmetTypeVisibility();
    handleLocationModeVisibility("vehicle");
    handleLocationModeVisibility("gear");
    handleLocationModeVisibility("part");
    handleLocationModeVisibility("accessory");
    updateCategoryPromptState();
    updateFiltersLayoutState();
  }

  function showAllCategoriesView() {
    state.selectedMainCategoryCode = null;
    state.page = 1;
    state.filteredResults = [];
    state.isMobileFiltersCollapsed = false;

    elements.categoryChooser.classList.add("hidden");
    elements.filtersEmptyState?.classList.add("hidden");
    elements.vehicleFilters.classList.add("hidden");
    elements.gearFilters.classList.add("hidden");
    elements.partFilters.classList.add("hidden");
    elements.accessoryFilters.classList.add("hidden");

    syncMainCategoryButtons();
    updateCategoryPromptState();
    updateFiltersLayoutState();
  }

  function backToCategories() {
    showAllCategoriesView();
    void loadListings();
  }

  function handleHelmetTypeVisibility() {
    const selectedText =
      elements.gearTypeFilter?.selectedOptions?.[0]?.textContent?.toLowerCase() || "";
    const selectedValue = elements.gearTypeFilter?.value || "";
    const shouldShow = selectedText.includes("каска") || selectedValue === "HELMET";

    elements.gearHelmetTypeWrap?.classList.toggle("hidden", !shouldShow);

    if (!shouldShow && elements.gearHelmetTypeFilter) {
      elements.gearHelmetTypeFilter.value = "";
      refreshSearchableSelect(elements.gearHelmetTypeFilter.id);
    }
  }

  function fillCountries() {
    fillSelect(elements.vehicleCountryFilter, state.lookups.countries, "nameBg", "id");
    fillSelect(elements.gearCountryFilter, state.lookups.countries, "nameBg", "id");
    fillSelect(elements.partCountryFilter, state.lookups.countries, "nameBg", "id");
    fillSelect(elements.accessoryCountryFilter, state.lookups.countries, "nameBg", "id");
  }

  async function loadVehicleTypesByClass(vehicleClassId) {
    if (!elements.vehicleTypeFilter) return;

    if (!vehicleClassId) {
      fillSelect(elements.vehicleTypeFilter, state.lookups.vehicleTypes);
      return;
    }

    const filtered = sortLookupItems(
      state.lookups.vehicleTypes.filter(
        (x) => String(x.parentId || "") === String(vehicleClassId)
      )
    );

    fillSelect(elements.vehicleTypeFilter, filtered);
  }

  async function loadVehicleModels(brandId, vehicleClassId) {
    if (!elements.vehicleModelFilter) return;

    if (!brandId) {
      fillSelect(elements.vehicleModelFilter, [], "name", "id");
      refreshSearchableSelect("vehicleModelFilter");
      return;
    }

    try {
      const params = new URLSearchParams();
      params.set("brandId", brandId);

      if (vehicleClassId) {
        params.set("vehicleClassLookupId", vehicleClassId);
      }

      const models = await getJson(`${API_BASE_URL}/api/lookups/models?${params.toString()}`);
      const sortedModels = sortLookupItems(models || [], "name");

      fillSelect(elements.vehicleModelFilter, sortedModels, "name", "id");
      refreshSearchableSelect("vehicleModelFilter");
    } catch {
      fillSelect(elements.vehicleModelFilter, [], "name", "id");
      refreshSearchableSelect("vehicleModelFilter");
    }
  }

  async function loadRegionsFor(prefix, countryId) {
    const regionFilter = elements[`${prefix}RegionFilter`];
    const cityFilter = elements[`${prefix}CityFilter`];

    if (!regionFilter || !cityFilter) return;

    fillSelect(regionFilter, [], "nameBg", "id");
    fillSelect(cityFilter, [], "nameBg", "id");
    regionFilter.disabled = true;
    cityFilter.disabled = true;

    if (!countryId) return;

    try {
      const regions = await getJson(`${API_BASE_URL}/api/lookups/regions/${countryId}`);
      fillSelect(regionFilter, sortLookupItems(regions || [], "nameBg"), "nameBg", "id");
      regionFilter.disabled = false;
    } catch {
      fillSelect(regionFilter, [], "nameBg", "id");
    }
  }

  async function loadCitiesFor(prefix, regionId) {
    const cityFilter = elements[`${prefix}CityFilter`];
    if (!cityFilter) return;

    fillSelect(cityFilter, [], "nameBg", "id");
    cityFilter.disabled = true;

    if (!regionId) return;

    try {
      const cities = await getJson(`${API_BASE_URL}/api/lookups/cities/${regionId}`);
      fillSelect(cityFilter, sortLookupItems(cities || [], "nameBg"), "nameBg", "id");
      cityFilter.disabled = false;
    } catch {
      fillSelect(cityFilter, [], "nameBg", "id");
    }
  }

  function handleLocationModeVisibility(prefix) {
    const modeFilter = elements[`${prefix}LocationModeFilter`];
    const countryWrap = elements[`${prefix}CountryWrap`];
    const regionWrap = elements[`${prefix}RegionWrap`];
    const cityWrap = elements[`${prefix}CityWrap`];

    if (!modeFilter || !countryWrap || !regionWrap || !cityWrap) return;

    const mode = modeFilter.value;

    countryWrap.classList.toggle("hidden", !["country", "region", "city"].includes(mode));
    regionWrap.classList.toggle("hidden", !["region", "city"].includes(mode));
    cityWrap.classList.toggle("hidden", mode !== "city");
  }

  function sanitizeLocationFilters(prefix) {
    const mode = elements[`${prefix}LocationModeFilter`]?.value || "";
    const countryFilter = elements[`${prefix}CountryFilter`];
    const regionFilter = elements[`${prefix}RegionFilter`];
    const cityFilter = elements[`${prefix}CityFilter`];

    if (!countryFilter || !regionFilter || !cityFilter) return;

    if (mode === "") {
      countryFilter.value = "";
      regionFilter.value = "";
      cityFilter.value = "";
      fillSelect(regionFilter, [], "nameBg", "id");
      fillSelect(cityFilter, [], "nameBg", "id");
      regionFilter.disabled = true;
      cityFilter.disabled = true;
      refreshSearchableSelect(countryFilter.id);
      refreshSearchableSelect(regionFilter.id);
      refreshSearchableSelect(cityFilter.id);
      return;
    }

    if (mode === "country") {
      regionFilter.value = "";
      cityFilter.value = "";
      fillSelect(cityFilter, [], "nameBg", "id");
      cityFilter.disabled = true;
      refreshSearchableSelect(regionFilter.id);
      refreshSearchableSelect(cityFilter.id);
      return;
    }

    if (mode === "region") {
      cityFilter.value = "";
      fillSelect(cityFilter, [], "nameBg", "id");
      cityFilter.disabled = true;
      refreshSearchableSelect(cityFilter.id);
    }
  }

  async function loadListings() {
    showLoadingState();

    try {
      const baseQuery = buildBaseSearchQuery();
      const apiData = await fetchAllListings(baseQuery);

      state.allListings = filterBySelectedMainCategory(apiData.items || []);
      state.currentDisplayCurrencyCode = apiData.displayCurrencyCode || "EUR";

      applyClientFiltersAndRender();
    } catch (error) {
      console.error(error);
      showErrorState("Не успяхме да заредим обявите. Опитай пак.");
    }
  }

  async function fetchAllListings(baseQuery) {
    let page = 1;
    let totalPages = 1;
    let displayCurrencyCode = "EUR";
    const allItems = [];
    const seenIds = new Set();

    do {
      const params = new URLSearchParams(baseQuery);
      params.set("page", String(page));
      params.set("pageSize", String(FETCH_PAGE_SIZE));
      params.set("sortBy", "newest");

      const response = await fetch(`${API_BASE_URL}/api/listings/public?${params.toString()}`, {
        method: "GET",
        headers: buildOptionalAuthHeaders()
      });

      if (!response.ok) {
        throw new Error("Неуспешно зареждане на обявите.");
      }

      const data = await response.json();
      const items = Array.isArray(data.items) ? data.items : [];

      if (data.displayCurrencyCode) {
        displayCurrencyCode = data.displayCurrencyCode;
      }

      items.forEach((item) => {
        const normalizedId = String(item?.id ?? "");
        if (!normalizedId || seenIds.has(normalizedId)) return;
        seenIds.add(normalizedId);
        allItems.push(item);
      });

      totalPages = Math.min(Number(data.totalPages) || 1, MAX_FETCH_PAGES);
      page += 1;
    } while (page <= totalPages);

    return {
      items: allItems,
      displayCurrencyCode
    };
  }

  function buildBaseSearchQuery() {
    const params = new URLSearchParams();

    if (state.selectedMainCategoryCode === "VEHICLE") {
      appendIfValue(params, "mainCategoryCode", "VEHICLE");
      appendIfValue(params, "subCategoryLookupId", elements.vehicleClassFilter.value);
      appendIfValue(params, "subCategory2LookupId", elements.vehicleTypeFilter.value);
      appendIfValue(params, "brandId", elements.vehicleBrandFilter.value);
      appendIfValue(params, "modelId", elements.vehicleModelFilter.value);
      appendIfValue(params, "conditionLookupId", elements.vehicleConditionFilter.value);
      appendLocationParams(params, "vehicle");
      appendIfValue(params, "priceFrom", elements.vehiclePriceMin.value);
      appendIfValue(params, "priceTo", elements.vehiclePriceMax.value);
      appendIfValue(params, "yearFrom", elements.vehicleYearFrom.value);
      appendIfValue(params, "yearTo", elements.vehicleYearTo.value);
      appendIfValue(params, "engineCcFrom", elements.vehicleEngineCcFrom.value);
      appendIfValue(params, "engineCcTo", elements.vehicleEngineCcTo.value);
      appendIfValue(params, "horsePowerFrom", elements.vehicleHorsePowerFrom.value);
      appendIfValue(params, "horsePowerTo", elements.vehicleHorsePowerTo.value);
      appendIfValue(params, "licenseCategoryLookupId", elements.vehicleLicenseCategoryFilter.value);
      appendIfValue(params, "mileageTo", elements.vehicleMileageTo.value);
    }

    if (state.selectedMainCategoryCode === "GEAR") {
      appendIfValue(params, "mainCategoryCode", "GEAR");
      appendIfValue(params, "subCategoryLookupId", elements.gearTypeFilter.value);

      if (!elements.gearHelmetTypeWrap?.classList.contains("hidden")) {
        appendIfValue(params, "subCategory2LookupId", elements.gearHelmetTypeFilter.value);
      }

      appendIfValue(params, "brandId", elements.gearBrandFilter.value);
      appendIfValue(params, "conditionLookupId", elements.gearConditionFilter.value);
      appendLocationParams(params, "gear");
      appendIfValue(params, "priceFrom", elements.gearPriceMin.value);
      appendIfValue(params, "priceTo", elements.gearPriceMax.value);
    }

    if (state.selectedMainCategoryCode === "PART") {
      appendIfValue(params, "mainCategoryCode", "PART");
      appendIfValue(params, "subCategoryLookupId", elements.partTypeFilter.value);
      appendIfValue(params, "brandId", elements.partBrandFilter.value);
      appendIfValue(params, "conditionLookupId", elements.partConditionFilter.value);
      appendLocationParams(params, "part");
      appendIfValue(params, "priceFrom", elements.partPriceMin.value);
      appendIfValue(params, "priceTo", elements.partPriceMax.value);
    }

    if (state.selectedMainCategoryCode === "ACCESSORY") {
      appendIfValue(params, "mainCategoryCode", "ACCESSORY");
      if (elements.accessoryTypeFilter.value !== ACCESSORY_OTHER_FILTER_VALUE) {
        appendIfValue(params, "subCategoryLookupId", elements.accessoryTypeFilter.value);
      }
      appendIfValue(params, "brandId", elements.accessoryBrandFilter.value);
      appendIfValue(params, "conditionLookupId", elements.accessoryConditionFilter.value);
      appendLocationParams(params, "accessory");
      appendIfValue(params, "priceFrom", elements.accessoryPriceMin.value);
      appendIfValue(params, "priceTo", elements.accessoryPriceMax.value);
    }

    return params;
  }

  function appendLocationParams(params, prefix) {
    const mode = elements[`${prefix}LocationModeFilter`]?.value || "";
    const countryId = elements[`${prefix}CountryFilter`]?.value || "";
    const regionId = elements[`${prefix}RegionFilter`]?.value || "";
    const cityId = elements[`${prefix}CityFilter`]?.value || "";

    if (mode === "country") {
      appendIfValue(params, "countryId", countryId);
      return;
    }

    if (mode === "region") {
      appendIfValue(params, "countryId", countryId);
      appendIfValue(params, "regionId", regionId);
      return;
    }

    if (mode === "city") {
      appendIfValue(params, "countryId", countryId);
      appendIfValue(params, "regionId", regionId);
      appendIfValue(params, "cityId", cityId);
    }
  }

  function applyClientFiltersAndRender() {
    let items = [...state.allListings];

    items = filterBySelectedMainCategory(items);
    items = filterBySyntheticAccessoryType(items);
    items = filterBySearchTerm(items);
    items = filterByPromotion(items);
    items = sortListings(items, elements.sortSelect?.value || "newest");

    state.filteredResults = items;

    const totalPages = Math.max(1, Math.ceil(items.length / state.pageSize));
    state.page = Math.min(Math.max(1, state.page), totalPages);

    renderCurrentPage();
  }

  function filterBySelectedMainCategory(items) {
    if (!state.selectedMainCategoryCode) {
      return items;
    }

    const selectedCode = normalizeMainCategoryCode(state.selectedMainCategoryCode);

    return (Array.isArray(items) ? items : []).filter((item) => {
      const itemCategoryCode = getItemMainCategoryCode(item);
      return itemCategoryCode === selectedCode;
    });
  }

  function filterBySyntheticAccessoryType(items) {
    if (
      state.selectedMainCategoryCode !== "ACCESSORY" ||
      elements.accessoryTypeFilter?.value !== ACCESSORY_OTHER_FILTER_VALUE
    ) {
      return items;
    }

    const knownTypeIds = new Set(
      state.lookups.accessoryTypes
        .map((item) => normalizeLookupValue(item?.id ?? item?.code ?? ""))
        .filter(Boolean)
    );
    const knownTypeLabels = new Set(
      state.lookups.accessoryTypes
        .map((item) => normalizeLookupLabel(item))
        .filter(Boolean)
    );

    return items.filter((item) => {
      const itemTypeIds = [
        item?.accessoryTypeId,
        item?.subCategoryLookupId,
        item?.subCategoryId
      ]
        .map((value) => normalizeLookupValue(value))
        .filter(Boolean);

      if (itemTypeIds.some((value) => knownTypeIds.has(value))) {
        return false;
      }

      const itemTypeLabels = [
        item?.accessoryTypeName,
        item?.subCategoryName
      ]
        .map((value) => normalizeLookupLabel(value))
        .filter(Boolean);

      if (itemTypeLabels.some((value) => knownTypeLabels.has(value))) {
        return false;
      }

      return true;
    });
  }

  function filterBySearchTerm(items) {
    const searchTerm = elements.globalSearch?.value?.trim() || "";

    if (!searchTerm) {
      return items;
    }

    return items.filter((item) => matchesNormalizedSearch(getListingSearchText(item), searchTerm));
  }

  function normalizeMainCategoryCode(value) {
    const raw = String(value || "").trim().toUpperCase();
    const compact = raw.replace(/[\s_-]+/g, "");

    if (!compact) return "";

    const map = {
      VEHICLE: "VEHICLE",
      VEHICLES: "VEHICLE",
      MOTOR: "VEHICLE",
      MOTORS: "VEHICLE",
      MOTORCYCLE: "VEHICLE",
      MOTORCYCLES: "VEHICLE",
      BIKE: "VEHICLE",
      BIKES: "VEHICLE",
      МОТОР: "VEHICLE",
      МОТОРИ: "VEHICLE",

      GEAR: "GEAR",
      GEARS: "GEAR",
      EQUIPMENT: "GEAR",
      HELMET: "GEAR",
      HELMETS: "GEAR",
      ЕКИПИРОВКА: "GEAR",
      КАСКА: "GEAR",
      КАСКИ: "GEAR",

      PART: "PART",
      PARTS: "PART",
      ЧАСТ: "PART",
      ЧАСТИ: "PART",

      ACCESSORY: "ACCESSORY",
      ACCESSORIES: "ACCESSORY",
      АКСЕСОАР: "ACCESSORY",
      АКСЕСОАРИ: "ACCESSORY"
    };

    return map[compact] || raw;
  }

  function getItemMainCategoryCode(item) {
    const directCandidates = [
      item?.mainCategoryCode,
      item?.mainCategory?.code,
      item?.categoryCode,
      item?.category?.code,
      item?.listingCategoryCode,
      item?.mainCategoryName,
      item?.mainCategory?.name,
      item?.categoryName,
      item?.category?.name,
      item?.listingCategoryName
    ];

    for (const candidate of directCandidates) {
      const normalized = normalizeMainCategoryCode(candidate);
      if (["VEHICLE", "GEAR", "PART", "ACCESSORY"].includes(normalized)) {
        return normalized;
      }
    }

    if (
      item?.vehicleClassName ||
      item?.vehicleTypeName ||
      item?.licenseCategoryName ||
      item?.engineCC ||
      item?.engineCc ||
      item?.horsePower ||
      item?.hp ||
      item?.mileage ||
      item?.vehicleYear
    ) {
      return "VEHICLE";
    }

    if (
      item?.gearTypeName ||
      item?.helmetTypeName ||
      item?.gearBrandName
    ) {
      return "GEAR";
    }

    if (
      item?.partTypeName ||
      item?.partBrandName
    ) {
      return "PART";
    }

    if (
      item?.accessoryTypeName ||
      item?.accessoryBrandName
    ) {
      return "ACCESSORY";
    }

    return "";
  }

  function filterByPromotion(items) {
    const currentCategory = state.selectedMainCategoryCode;

    const vipOnly =
      currentCategory === "VEHICLE" ? !!elements.vehicleVipOnlyFilter?.checked :
      currentCategory === "GEAR" ? !!elements.gearVipOnlyFilter?.checked :
      currentCategory === "PART" ? !!elements.partVipOnlyFilter?.checked :
      currentCategory === "ACCESSORY" ? !!elements.accessoryVipOnlyFilter?.checked :
      false;

    const topOnly =
      currentCategory === "VEHICLE" ? !!elements.vehicleTopOnlyFilter?.checked :
      currentCategory === "GEAR" ? !!elements.gearTopOnlyFilter?.checked :
      currentCategory === "PART" ? !!elements.partTopOnlyFilter?.checked :
      currentCategory === "ACCESSORY" ? !!elements.accessoryTopOnlyFilter?.checked :
      false;

    if (!vipOnly && !topOnly) {
      return items;
    }

    return items.filter((item) => {
      const promotion = getPromotionType(item);

      if (vipOnly && topOnly) {
        return promotion === "VIP" || promotion === "TOP";
      }

      if (vipOnly) {
        return promotion === "VIP";
      }

      if (topOnly) {
        return promotion === "TOP";
      }

      return true;
    });
  }

  function sortListings(items, sortBy) {
    const sorted = [...items];

    sorted.sort((a, b) => {
      const promotionDiff = getPromotionPriority(a) - getPromotionPriority(b);
      if (promotionDiff !== 0) {
        return promotionDiff;
      }

      let sortDiff = 0;

      switch (sortBy) {
        case "priceasc":
          sortDiff = getItemPrice(a) - getItemPrice(b);
          break;

        case "pricedesc":
          sortDiff = getItemPrice(b) - getItemPrice(a);
          break;

        case "yeardesc":
          sortDiff = getItemYear(b) - getItemYear(a);
          break;

        case "yearasc":
          sortDiff = getItemYear(a) - getItemYear(b);
          break;

        case "oldest":
          sortDiff = getItemDate(a) - getItemDate(b);
          break;

        case "newest":
        default:
          sortDiff = getItemDate(b) - getItemDate(a);
          break;
      }

      if (sortDiff !== 0) {
        return sortDiff;
      }

      const dateFallback = getItemDate(b) - getItemDate(a);
      if (dateFallback !== 0) {
        return dateFallback;
      }

      const priceFallback = getItemPrice(a) - getItemPrice(b);
      if (priceFallback !== 0) {
        return priceFallback;
      }

      return String(a?.id ?? "").localeCompare(String(b?.id ?? ""), "bg", { sensitivity: "base" });
    });

    return sorted;
  }

  function renderCurrentPage() {
    const totalCount = state.filteredResults.length;
    const totalPages = Math.ceil(totalCount / state.pageSize) || 0;
    const startIndex = (state.page - 1) * state.pageSize;
    const items = state.filteredResults.slice(startIndex, startIndex + state.pageSize);

    renderListings({
      items,
      totalCount,
      totalPages,
      page: state.page,
      displayCurrencyCode: state.currentDisplayCurrencyCode
    });

    renderPagination(state.page, totalPages);
  }

  function renderListings(data) {
    const items = data.items || [];
    const displayCurrency = data.displayCurrencyCode || "EUR";

    const label = displayCurrency ? ` | Цените се показват в ${displayCurrency}` : "";
    elements.resultsCount.textContent = `${data.totalCount || 0} резултата${label}`;

    if (!items.length) {
      elements.listingsGrid.innerHTML =
        `<div class="empty-state">Няма намерени обяви по зададените критерии.</div>`;
      return;
    }

    elements.listingsGrid.innerHTML = items.map(renderCard).join("");

    [...elements.listingsGrid.querySelectorAll(".favorite-btn")].forEach((button) => {
      setFavoriteButtonState(button, button.classList.contains("active"));
      button.addEventListener("click", onFavoriteClick);
    });

    [...elements.listingsGrid.querySelectorAll(".listing-link")].forEach((link) => {
      link.addEventListener("click", (e) => {
        if (e.target.closest(".favorite-btn")) {
          e.preventDefault();
          return;
        }
      });
    });
  }

  function renderCard(item) {
    const promotion = getPromotionType(item);
    const itemCategoryCode = getItemMainCategoryCode(item);

    const cardClass =
      promotion === "VIP"
        ? "card card--vip"
        : promotion === "TOP"
          ? "card card--top"
          : "card";

    const ribbon =
      promotion === "VIP"
        ? `<div class="card__ribbon card__ribbon--vip">VIP</div>`
        : promotion === "TOP"
          ? `<div class="card__ribbon card__ribbon--top">TOP</div>`
          : "";

    const imageHtml = item.mainPhotoUrl
      ? `<img src="${escapeHtml(item.mainPhotoUrl)}" alt="${escapeHtml(item.title || "Обява")}" loading="lazy" />`
      : `<div class="card__image-placeholder">Няма снимка</div>`;

    const meta = buildCardMeta(item, itemCategoryCode);
    const location = getShortLocation(item);
    const displayPrice = formatPrice(item.displayPrice ?? item.price ?? 0);
    const currency = item.displayCurrencyCode || item.currencyCode || "EUR";
    const favoriteActive = state.favoriteIds.has(String(item.id));
    const priceChangeIndicator = renderPriceChangeIndicatorHtml(item);

    return `
      <a class="listing-link" href="ListingDetails.html?id=${encodeURIComponent(item.id)}">
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
                ${priceChangeIndicator}
              </div>
            </div>

            <div class="card__meta">
              ${meta || `<span>${escapeHtml(item.mainCategoryName || itemCategoryCode || "")}</span>`}
            </div>

            <div class="card__bottom">
              <div class="card__location">${escapeHtml(location || "Локацията не е посочена")}</div>
            </div>
          </div>
        </article>
      </a>
    `;
  }

  function buildCardMeta(item, itemCategoryCode) {
    if (itemCategoryCode === "VEHICLE") {
      return [
        item.vehicleYear ? `<span>${escapeHtml(String(item.vehicleYear))}</span>` : "",
        (item.engineCC || item.engineCc)
          ? `<span>${escapeHtml(String(item.engineCC || item.engineCc))} cc</span>`
          : "",
        (item.horsePower || item.hp)
          ? `<span>${escapeHtml(String(item.horsePower || item.hp))} к.с.</span>`
          : "",
        item.licenseCategoryName
          ? `<span class="meta-license">${escapeHtml(item.licenseCategoryName)}</span>`
          : ""
      ]
        .filter(Boolean)
        .join("");
    }

    if (itemCategoryCode === "GEAR") {
      return [
        item.vehicleYear ? `<span>${escapeHtml(String(item.vehicleYear))}</span>` : "",
        item.gearTypeName ? `<span>${escapeHtml(item.gearTypeName)}</span>` : "",
        item.helmetTypeName ? `<span>${escapeHtml(item.helmetTypeName)}</span>` : "",
        item.conditionName ? `<span>${escapeHtml(item.conditionName)}</span>` : ""
      ]
        .filter(Boolean)
        .join("");
    }

    if (itemCategoryCode === "PART") {
      return [
        item.partTypeName ? `<span>${escapeHtml(item.partTypeName)}</span>` : "",
        item.conditionName ? `<span>${escapeHtml(item.conditionName)}</span>` : ""
      ]
        .filter(Boolean)
        .join("");
    }

    if (itemCategoryCode === "ACCESSORY") {
      return [
        item.accessoryTypeName ? `<span>${escapeHtml(item.accessoryTypeName)}</span>` : "",
        item.conditionName ? `<span>${escapeHtml(item.conditionName)}</span>` : ""
      ]
        .filter(Boolean)
        .join("");
    }

    return "";
  }

  async function onFavoriteClick(event) {
    event.preventDefault();
    event.stopPropagation();

    const button = event.currentTarget;
    const listingId = String(button.dataset.id || "");

    if (!window.Auth.isLoggedIn()) {
      window.Auth.redirectToLogin();
      return;
    }

    const isActive = button.classList.contains("active");

    try {
      button.disabled = true;

      const response = await window.Auth.authFetch(
        `${API_BASE_URL}/api/profile/favorites/${listingId}`,
        {
          method: isActive ? "DELETE" : "POST"
        }
      );

      if (!response.ok) {
        throw new Error("Неуспешно обновяване на любими.");
      }

      if (isActive) {
        state.favoriteIds.delete(listingId);
        setFavoriteButtonState(button, false);
        showToast("Обявата е премахната от „Любими обяви“ в профила.", "info");
      } else {
        state.favoriteIds.add(listingId);
        setFavoriteButtonState(button, true);
        showToast("Обявата е добавена в „Любими обяви“ в профила.", "success");
      }

      updateFavoritesCount(state.favoriteIds.size);
    } catch (error) {
      console.error(error);
      showToast("Не успяхме да обновим любимите обяви.", "error");
    } finally {
      button.disabled = false;
    }
  }

  function setFavoriteButtonState(button, isActive) {
    if (!(button instanceof HTMLButtonElement)) return;

    button.classList.toggle("active", Boolean(isActive));
    button.setAttribute("aria-pressed", isActive ? "true" : "false");
    button.setAttribute(
      "aria-label",
      isActive ? "Обявата е в любими" : "Добави в любими"
    );
    button.title = isActive ? "Обявата е в любими" : "Добави в любими";
  }

  function syncFavoriteButtons() {
    if (!elements.listingsGrid) return;

    [...elements.listingsGrid.querySelectorAll(".favorite-btn")].forEach((button) => {
      const listingId = String(button.dataset.id || "");
      setFavoriteButtonState(button, state.favoriteIds.has(listingId));
    });
  }

  function showToast(message, type = "info") {
    if (!elements.toastStack || !message) return;

    if (toastHideTimer) {
      window.clearTimeout(toastHideTimer);
      toastHideTimer = null;
    }

    elements.toastStack.innerHTML = `<div class="toast toast--${escapeHtml(type)}" role="status">${escapeHtml(message)}</div>`;

    const toast = elements.toastStack.querySelector(".toast");
    if (!toast) return;

    window.requestAnimationFrame(() => {
      toast.classList.add("is-visible");
    });

    toastHideTimer = window.setTimeout(() => {
      toast.classList.remove("is-visible");

      window.setTimeout(() => {
        if (elements.toastStack?.contains(toast)) {
          elements.toastStack.innerHTML = "";
        }
      }, 220);
    }, 2800);
  }

  function renderPagination(page, totalPages) {
    elements.pagination.innerHTML = "";

    if (!totalPages || totalPages <= 1) return;

    const pages = buildPaginationModel(page, totalPages);

    const html = [
      `<button class="page-btn" ${page <= 1 ? "disabled" : ""} data-page="${page - 1}">‹</button>`,
      ...pages.map((value) =>
        value === "..."
          ? `<span class="page-dots">...</span>`
          : `<button class="page-btn ${value === page ? "active" : ""}" data-page="${value}">${value}</button>`
      ),
      `<button class="page-btn" ${page >= totalPages ? "disabled" : ""} data-page="${page + 1}">›</button>`
    ].join("");

    elements.pagination.innerHTML = html;

    [...elements.pagination.querySelectorAll(".page-btn[data-page]")].forEach((button) => {
      button.addEventListener("click", () => {
        const nextPage = Number(button.dataset.page);

        if (!nextPage || nextPage === page || nextPage < 1 || nextPage > totalPages) return;

        state.page = nextPage;
        renderCurrentPage();

        window.scrollTo({
          top: document.querySelector(".main")?.offsetTop || 0,
          behavior: "smooth"
        });
      });
    });
  }

  function buildPaginationModel(currentPage, totalPages) {
    const pages = [];

    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i += 1) {
        pages.push(i);
      }
      return pages;
    }

    pages.push(1);

    if (currentPage > 3) {
      pages.push("...");
    }

    const start = Math.max(2, currentPage - 1);
    const end = Math.min(totalPages - 1, currentPage + 1);

    for (let i = start; i <= end; i += 1) {
      pages.push(i);
    }

    if (currentPage < totalPages - 2) {
      pages.push("...");
    }

    pages.push(totalPages);

    return pages;
  }

  function clearAllFilters() {
    const ids = [
      "globalSearch",
      "sortSelect",

      "vehicleClassFilter",
      "vehicleTypeFilter",
      "vehicleBrandFilter",
      "vehicleModelFilter",
      "vehicleConditionFilter",
      "vehicleLocationModeFilter",
      "vehicleCountryFilter",
      "vehicleRegionFilter",
      "vehicleCityFilter",
      "vehiclePriceMin",
      "vehiclePriceMax",
      "vehicleYearFrom",
      "vehicleYearTo",
      "vehicleEngineCcFrom",
      "vehicleEngineCcTo",
      "vehicleHorsePowerFrom",
      "vehicleHorsePowerTo",
      "vehicleLicenseCategoryFilter",
      "vehicleMileageTo",
      "vehicleVipOnlyFilter",
      "vehicleTopOnlyFilter",

      "gearTypeFilter",
      "gearHelmetTypeFilter",
      "gearBrandFilter",
      "gearConditionFilter",
      "gearLocationModeFilter",
      "gearCountryFilter",
      "gearRegionFilter",
      "gearCityFilter",
      "gearPriceMin",
      "gearPriceMax",
      "gearVipOnlyFilter",
      "gearTopOnlyFilter",

      "partTypeFilter",
      "partBrandFilter",
      "partConditionFilter",
      "partLocationModeFilter",
      "partCountryFilter",
      "partRegionFilter",
      "partCityFilter",
      "partPriceMin",
      "partPriceMax",
      "partVipOnlyFilter",
      "partTopOnlyFilter",

      "accessoryTypeFilter",
      "accessoryBrandFilter",
      "accessoryConditionFilter",
      "accessoryLocationModeFilter",
      "accessoryCountryFilter",
      "accessoryRegionFilter",
      "accessoryCityFilter",
      "accessoryPriceMin",
      "accessoryPriceMax",
      "accessoryVipOnlyFilter",
      "accessoryTopOnlyFilter"
    ];

    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (!el) return;

      if (el.type === "checkbox") {
        el.checked = false;
        return;
      }

      if (id === "sortSelect") {
        el.value = "newest";
        return;
      }

      el.value = "";
    });

    fillSelect(elements.vehicleModelFilter, [], "name", "id");
    sanitizeLocationFilters("vehicle");
    sanitizeLocationFilters("gear");
    sanitizeLocationFilters("part");
    sanitizeLocationFilters("accessory");

    handleHelmetTypeVisibility();
    handleLocationModeVisibility("vehicle");
    handleLocationModeVisibility("gear");
    handleLocationModeVisibility("part");
    handleLocationModeVisibility("accessory");
    refreshAllSearchableSelects();

    state.page = 1;

    void loadListings();
  }

  function showLoadingState() {
    elements.listingsGrid.innerHTML = `<div class="loading-state">Зареждаме обявите...</div>`;
  }

  function showErrorState(message) {
    elements.listingsGrid.innerHTML = `<div class="error-state">${escapeHtml(message)}</div>`;
  }

  function openLogoutConfirm() {
    if (!window.Auth.isLoggedIn()) {
      return;
    }

    setLogoutConfirmLoading(false);
    closeProfileDropdown();
    state.isLogoutConfirmOpen = true;
    elements.logoutConfirmModal?.classList.remove("hidden");
    syncModalOpenState();

    window.requestAnimationFrame(() => {
      elements.cancelLogoutBtn?.focus();
    });
  }

  function closeLogoutConfirm() {
    if (!state.isLogoutConfirmOpen || elements.confirmLogoutBtn?.disabled) {
      return;
    }

    state.isLogoutConfirmOpen = false;
    elements.logoutConfirmModal?.classList.add("hidden");
    syncModalOpenState();

    window.requestAnimationFrame(() => {
      elements.logoutBtn?.focus();
    });
  }

  async function onConfirmLogout() {
    if (elements.confirmLogoutBtn?.disabled) {
      return;
    }

    setLogoutConfirmLoading(true);

    try {
      await window.Auth.logoutUser();
    } finally {
      setLogoutConfirmLoading(false);
    }
  }

  function setLogoutConfirmLoading(isLoading) {
    if (elements.confirmLogoutBtn) {
      elements.confirmLogoutBtn.disabled = isLoading;
      elements.confirmLogoutBtn.textContent = isLoading ? "Излизане..." : "Да";
    }

    if (elements.cancelLogoutBtn) {
      elements.cancelLogoutBtn.disabled = isLoading;
    }
  }

  function syncModalOpenState() {
    const shouldLockScroll =
      Boolean(elements.overlay?.classList.contains("open")) || state.isLogoutConfirmOpen;

    document.body.classList.toggle("modal-open", shouldLockScroll);
  }

  function openMobileFilters() {
    if (isMobileFiltersMode()) {
      if (!state.selectedMainCategoryCode) {
        return;
      }

      state.isMobileFiltersCollapsed = false;
      updateFiltersLayoutState();
      return;
    }

    elements.filtersSection?.classList.add("open");
    elements.overlay?.classList.add("open");
    syncModalOpenState();
  }

  function closeMobileFilters() {
    if (isMobileFiltersMode()) {
      state.isMobileFiltersCollapsed = true;
      updateFiltersLayoutState();
      return;
    }

    elements.filtersSection?.classList.remove("open");
    elements.overlay?.classList.remove("open");
    syncModalOpenState();
  }

  function handleAppHeight() {
    const vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty("--app-vh", `${vh}px`);
  }

  function fillSelect(select, items, labelKey = "nameBg", valueKey = "id") {
    if (!select) return;

    const currentValue = select.value;
    const safeItems = Array.isArray(items) ? items : [];
    const sortedItems = sortLookupItems(safeItems, labelKey);

    select.innerHTML =
      `<option value="">Всички</option>` +
      sortedItems
        .map((item) => {
          const label =
            item?.[labelKey] ??
            item?.nameBg ??
            item?.name ??
            item?.code ??
            "";
          const value =
            item?.[valueKey] ??
            item?.id ??
            item?.code ??
            "";

          return `<option value="${escapeHtml(String(value))}">${escapeHtml(String(label))}</option>`;
        })
        .join("");

    if ([...select.options].some((option) => option.value === currentValue)) {
      select.value = currentValue;
    } else {
      select.value = "";
    }

    refreshSearchableSelect(select.id);
  }

  function getConditionOptionsForCategory(categoryCode) {
    if (categoryCode !== "GEAR" && categoryCode !== "ACCESSORY") {
      return state.lookups.conditions;
    }

    return state.lookups.conditions.filter((item) => !isForPartsCondition(item));
  }

  function getAccessoryTypeOptions() {
    const items = [...state.lookups.accessoryTypes];
    const normalizedOtherLabel = OTHER_ACCESSORY_LABEL.toLocaleLowerCase("bg").trim();
    const hasOtherOption = items.some((item) => normalizeLookupLabel(item) === normalizedOtherLabel);

    if (hasOtherOption) {
      return items;
    }

    items.push({
      id: ACCESSORY_OTHER_FILTER_VALUE,
      nameBg: OTHER_ACCESSORY_LABEL
    });

    return items;
  }

  function isForPartsCondition(item) {
    return normalizeLookupLabel(item).includes(FOR_PARTS_CONDITION_LABEL);
  }

  async function getJson(url) {
    const response = await fetch(url, {
      method: "GET",
      headers: buildOptionalAuthHeaders()
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return response.json();
  }

  function buildOptionalAuthHeaders() {
    const headers = {};
    const token = window.Auth?.getAccessToken?.();

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    return headers;
  }

  function appendIfValue(params, key, value) {
    if (value !== null && value !== undefined && String(value).trim() !== "") {
      params.set(key, String(value).trim());
    }
  }

  function sortLookupItems(items, labelKey = "nameBg") {
    return [...(Array.isArray(items) ? items : [])].sort((a, b) => {
      const labelA = getLookupLabel(a, labelKey);
      const labelB = getLookupLabel(b, labelKey);
      return labelA.localeCompare(labelB, "bg", { sensitivity: "base" });
    });
  }

  function getLookupLabel(item, labelKey = "nameBg") {
    if (typeof item === "string" || typeof item === "number") {
      return String(item).trim();
    }

    return String(
      item?.[labelKey] ??
      item?.nameBg ??
      item?.name ??
      item?.code ??
      ""
    ).trim();
  }

  function normalizeLookupLabel(item, labelKey = "nameBg") {
    return getLookupLabel(item, labelKey).toLocaleLowerCase("bg").trim();
  }

  function normalizeLookupValue(value) {
    return String(value ?? "").trim();
  }

  function getPromotionType(item) {
    return String(
      item?.currentPromotionType ??
      item?.promotionType ??
      item?.promotionLevel ??
      "NORMAL"
    )
      .trim()
      .toUpperCase();
  }

  function getPromotionPriority(item) {
    const promotionType = getPromotionType(item);

    if (promotionType === "VIP") return 0;
    if (promotionType === "TOP") return 1;
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
    const candidates = [
      item?.createdAt,
      item?.createdOn,
      item?.createdUtc,
      item?.publishedAt,
      item?.publishedOn,
      item?.postedAt,
      item?.postedOn,
      item?.dateCreated,
      item?.insertedOn
    ];

    for (const candidate of candidates) {
      if (!candidate) continue;
      const timestamp = new Date(candidate).getTime();
      if (Number.isFinite(timestamp)) {
        return timestamp;
      }
    }

    return 0;
  }

  function formatPrice(value) {
    const numeric = Number(value);

    if (!Number.isFinite(numeric)) {
      return "0.00";
    }

    return numeric.toFixed(2);
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

  function formatPriceChangeTooltipValue(amount, currencyCode) {
    return `${formatPrice(amount)} ${currencyCode || "EUR"}`;
  }

  function buildPriceChangeSummary(item) {
    const changeType = normalizePriceChangeType(item?.lastPriceChangeType || item?.LastPriceChangeType);

    if (!changeType) {
      return null;
    }

    const originalCurrency = normalizeCurrencyCode(item?.currencyCode || item?.CurrencyCode);
    const displayCurrency = normalizeCurrencyCode(item?.displayCurrencyCode || item?.DisplayCurrencyCode);
    const currentOriginal = toFiniteNumber(item?.priceOriginal || item?.PriceOriginal);
    const previousOriginal = toFiniteNumber(item?.previousPriceOriginal || item?.PreviousPriceOriginal);
    const currentEur = toFiniteNumber(item?.priceEUR || item?.PriceEUR);
    const previousEur = toFiniteNumber(item?.previousPriceEUR || item?.PreviousPriceEUR);

    if (
      originalCurrency &&
      displayCurrency === originalCurrency &&
      currentOriginal !== null &&
      previousOriginal !== null &&
      !areSamePrices(currentOriginal, previousOriginal)
    ) {
      return {
        changeType,
        oldText: formatPriceChangeTooltipValue(previousOriginal, originalCurrency),
        newText: formatPriceChangeTooltipValue(currentOriginal, originalCurrency)
      };
    }

    if (
      currentEur !== null &&
      previousEur !== null &&
      !areSamePrices(currentEur, previousEur)
    ) {
      return {
        changeType,
        oldText: formatPriceChangeTooltipValue(previousEur, "EUR"),
        newText: formatPriceChangeTooltipValue(currentEur, "EUR")
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
        oldText: formatPriceChangeTooltipValue(previousOriginal, originalCurrency),
        newText: formatPriceChangeTooltipValue(currentOriginal, originalCurrency)
      };
    }

    return null;
  }

  function renderPriceChangeIndicatorHtml(item) {
    const summary = buildPriceChangeSummary(item);

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

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function initSearchableSelects() {
    enhanceNativeSearchableSelects();

    document.querySelectorAll(".searchable-select").forEach((root) => {
      const select = resolveSearchableSelect(root);
      const input = resolveSearchableInput(root);
      const dropdown = resolveSearchableDropdown(root);

      if (!select || !input || !dropdown || state.searchableSelects.has(select.id)) return;

      const instance = {
        root,
        select,
        input,
        dropdown,
        highlightedIndex: -1
      };

      state.searchableSelects.set(select.id, instance);

      input.addEventListener("focus", () => {
        if (select.disabled) return;
        openSearchableSelect(instance);
        renderSearchableOptions(instance, input.value);
      });

      input.addEventListener("click", () => {
        if (select.disabled) return;
        openSearchableSelect(instance);
        renderSearchableOptions(instance, input.value);
      });

      input.addEventListener("input", () => {
        if (select.disabled) return;
        openSearchableSelect(instance);
        instance.highlightedIndex = -1;
        renderSearchableOptions(instance, input.value);
      });

      input.addEventListener("keydown", (e) => {
        const options = getFilteredSearchableOptions(instance, input.value);

        if (e.key === "ArrowDown") {
          e.preventDefault();
          if (!options.length) return;
          instance.highlightedIndex =
            instance.highlightedIndex < options.length - 1 ? instance.highlightedIndex + 1 : 0;
          renderSearchableOptions(instance, input.value);
          return;
        }

        if (e.key === "ArrowUp") {
          e.preventDefault();
          if (!options.length) return;
          instance.highlightedIndex =
            instance.highlightedIndex > 0 ? instance.highlightedIndex - 1 : options.length - 1;
          renderSearchableOptions(instance, input.value);
          return;
        }

        if (e.key === "Enter") {
          e.preventDefault();
          if (!options.length) return;
          const option =
            options[instance.highlightedIndex >= 0 ? instance.highlightedIndex : 0];
          selectSearchableOption(instance, option.value);
          return;
        }

        if (e.key === "Escape") {
          e.preventDefault();
          closeSearchableSelect(instance);
        }
      });

      select.addEventListener("change", () => {
        syncSearchableInput(instance);
      });

      const observer = new MutationObserver(() => {
        syncSearchableControlState(instance);
      });

      observer.observe(select, {
        attributes: true,
        attributeFilter: ["disabled"]
      });

      syncSearchableInput(instance);
      syncSearchableControlState(instance);
    });
  }

  function refreshSearchableSelect(selectId) {
    const instance = state.searchableSelects.get(selectId);
    if (!instance) return;

    instance.highlightedIndex = -1;
    syncSearchableInput(instance);
    syncSearchableControlState(instance);

    if (!instance.dropdown.classList.contains("hidden")) {
      renderSearchableOptions(instance, instance.input.value);
    }
  }

  function refreshAllSearchableSelects() {
    state.searchableSelects.forEach((instance, selectId) => {
      refreshSearchableSelect(selectId);
    });
  }

  function syncSearchableInput(instance) {
    const selectedOption = instance.select.options[instance.select.selectedIndex];

    if (!selectedOption || selectedOption.value === "") {
      instance.input.value = "";
      return;
    }

    instance.input.value = selectedOption.textContent.trim();
  }

  function syncSearchableControlState(instance) {
    const isDisabled = !!instance.select.disabled;

    instance.input.disabled = isDisabled;
    instance.root.classList.toggle("is-disabled", isDisabled);

    if (isDisabled) {
      closeSearchableSelect(instance);
    }
  }

  function openSearchableSelect(instance) {
    if (instance.select.disabled) {
      return;
    }

    closeAllSearchableSelects(instance.select.id);
    instance.dropdown.classList.remove("hidden");
  }

  function closeSearchableSelect(instance) {
    instance.dropdown.classList.add("hidden");
    instance.highlightedIndex = -1;
    syncSearchableInput(instance);
  }

  function closeAllSearchableSelects(exceptSelectId = null) {
    state.searchableSelects.forEach((instance, selectId) => {
      if (exceptSelectId && exceptSelectId === selectId) return;
      closeSearchableSelect(instance);
    });
  }

  function getSearchableOptions(instance) {
    return [...instance.select.options].map((option) => ({
      value: option.value,
      label: option.textContent.trim()
    }));
  }

  function getFilteredSearchableOptions(instance, searchTerm) {
    const normalizedTerm = normalizeSearchText(searchTerm);
    const options = getSearchableOptions(instance);

    if (!normalizedTerm) {
      return options;
    }

    return options.filter((option) => {
      if (option.value === "") {
        return true;
      }

      return matchesNormalizedSearch(option.label, searchTerm);
    });
  }

  function renderSearchableOptions(instance, searchTerm = "") {
    const options = getFilteredSearchableOptions(instance, searchTerm);

    if (!options.length) {
      instance.dropdown.innerHTML = `<div class="searchable-select__empty">Няма резултати</div>`;
      return;
    }

    if (instance.highlightedIndex >= options.length) {
      instance.highlightedIndex = options.length - 1;
    }

    instance.dropdown.innerHTML = options
      .map((option, index) => {
        const isSelected = instance.select.value === option.value;
        const isActive = instance.highlightedIndex === index;

        return `
          <button
            class="searchable-select__option ${isSelected ? "is-selected" : ""} ${isActive ? "is-active" : ""}"
            type="button"
            data-value="${escapeHtml(option.value)}"
          >
            ${escapeHtml(option.label)}
          </button>
        `;
      })
      .join("");

    [...instance.dropdown.querySelectorAll(".searchable-select__option")].forEach((button) => {
      button.addEventListener("click", () => {
        selectSearchableOption(instance, button.dataset.value);
      });
    });

    const activeOption = instance.dropdown.querySelector(".searchable-select__option.is-active");
    activeOption?.scrollIntoView({ block: "nearest" });
  }

  function selectSearchableOption(instance, value) {
    const currentValue = instance.select.value;
    instance.select.value = value;

    syncSearchableInput(instance);
    closeSearchableSelect(instance);

    if (currentValue !== value) {
      instance.select.dispatchEvent(new Event("change", { bubbles: true }));
    }
  }

  function enhanceNativeSearchableSelects() {
    document.querySelectorAll(AUTO_SEARCHABLE_SELECT_SELECTOR).forEach((select) => {
      if (!(select instanceof HTMLSelectElement) || !select.id) return;
      if (select.closest(".searchable-select")) return;

      const wrapper = document.createElement("div");
      wrapper.className = "searchable-select searchable-select--generated";

      if (select.closest(".content__actions")) {
        wrapper.classList.add("searchable-select--toolbar");
      }

      const input = document.createElement("input");
      input.type = "text";
      input.className = "searchable-select__input";
      input.autocomplete = "off";
      input.spellcheck = false;

      const placeholder = buildSearchablePlaceholder(select);
      if (placeholder) {
        input.placeholder = placeholder;
        input.setAttribute("aria-label", placeholder);
      }

      const dropdown = document.createElement("div");
      dropdown.className = "searchable-select__dropdown hidden";

      const parent = select.parentElement;
      if (!parent) return;

      parent.insertBefore(wrapper, select);
      wrapper.appendChild(input);
      wrapper.appendChild(dropdown);
      wrapper.appendChild(select);

      select.classList.add("searchable-select__native", "hidden");
    });
  }

  function buildSearchablePlaceholder(select) {
    if (select.id === "sortSelect") {
      return "Търси подредба...";
    }

    const label = document.querySelector(`label[for="${select.id}"]`)?.textContent?.trim();
    if (!label) {
      return "Търси...";
    }

    return `Търси ${label.toLocaleLowerCase("bg")}...`;
  }

  function resolveSearchableSelect(root) {
    const targetSelectId = root.dataset.targetSelect;

    if (targetSelectId) {
      return document.getElementById(targetSelectId);
    }

    return root.querySelector("select");
  }

  function resolveSearchableInput(root) {
    const searchInputId = root.dataset.searchInput;

    if (searchInputId) {
      return document.getElementById(searchInputId);
    }

    return root.querySelector(".searchable-select__input");
  }

  function resolveSearchableDropdown(root) {
    const optionsListId = root.dataset.optionsList;

    if (optionsListId) {
      return document.getElementById(optionsListId);
    }

    return root.querySelector(".searchable-select__dropdown");
  }

  function getListingSearchText(item) {
    const itemCategoryCode = getItemMainCategoryCode(item);

    const categoryLabels = {
      VEHICLE: "мотор мотори motorcycle motorcycles bike bikes vehicle vehicles",
      GEAR: "екипировка каска каски gear gears equipment helmet helmets",
      PART: "част части part parts",
      ACCESSORY: "аксесоар аксесоари accessory accessories"
    };

    return [
      item?.title,
      item?.description,
      item?.mainCategoryName,
      item?.mainCategoryCode,
      item?.categoryName,
      item?.categoryCode,
      categoryLabels[itemCategoryCode] || "",
      item?.brandName,
      item?.modelName,
      item?.vehicleBrandName,
      item?.vehicleModelName,
      item?.gearBrandName,
      item?.partBrandName,
      item?.accessoryBrandName,
      item?.vehicleClassName,
      item?.vehicleTypeName,
      item?.gearTypeName,
      item?.helmetTypeName,
      item?.partTypeName,
      item?.accessoryTypeName,
      item?.conditionName,
      item?.licenseCategoryName,
      item?.cityName,
      item?.regionName,
      item?.countryName,
      item?.sellerName,
      item?.companyName
    ]
      .filter(Boolean)
      .join(" ");
  }

  function matchesNormalizedSearch(haystack, searchTerm) {
    const hay = normalizeSearchText(haystack);
    const needle = normalizeSearchText(searchTerm);

    if (!needle) return true;
    if (!hay) return false;

    const hayCompact = hay.replace(/\s+/g, "");
    const needleCompact = needle.replace(/\s+/g, "");
    const needleTokens = needle.split(" ").filter(Boolean);

    if (hay.includes(needle)) {
      return true;
    }

    if (hayCompact.includes(needleCompact)) {
      return true;
    }

    return needleTokens.every((token) => {
      const compactToken = token.replace(/\s+/g, "");
      return hay.includes(token) || hayCompact.includes(compactToken);
    });
  }

  function normalizeSearchText(value) {
    let text = String(value || "")
      .toLowerCase()
      .trim();

    if (!text) {
      return "";
    }

    const bgToLatinMap = {
      а: "a",
      б: "b",
      в: "v",
      г: "g",
      д: "d",
      е: "e",
      ж: "zh",
      з: "z",
      и: "i",
      й: "y",
      к: "k",
      л: "l",
      м: "m",
      н: "n",
      о: "o",
      п: "p",
      р: "r",
      с: "s",
      т: "t",
      у: "u",
      ф: "f",
      х: "h",
      ц: "ts",
      ч: "ch",
      ш: "sh",
      щ: "sht",
      ъ: "a",
      ь: "",
      ю: "yu",
      я: "ya"
    };

    text = [...text].map((char) => bgToLatinMap[char] ?? char).join("");

    text = text
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/æ/g, "ae")
      .replace(/œ/g, "oe")
      .replace(/ß/g, "ss")
      .replace(/[\u2019’`']/g, "")
      .replace(/&/g, " and ")
      .replace(/ph/g, "f")
      .replace(/ck/g, "k")
      .replace(/qu/g, "kv")
      .replace(/w/g, "v")
      .replace(/q/g, "k")
      .replace(/x/g, "ks")
      .replace(/c/g, "k")
      .replace(/z/g, "s")
      .replace(/[^a-z0-9]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    return text;
  }
})();
