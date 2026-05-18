(() => {
  const API_BASE_URL = (window.Auth?.API_BASE_URL || "https://motomarketapi.azurewebsites.net").replace(/\/+$/, "");

  const AUTO_RATES_TO_EUR = {
    EUR: 1,
    BGN: 0.51129,
    USD: 0.92,
    GBP: 1.17,
    RON: 0.20,
    TRY: 0.028
  };

  const PRICING = {
    VIP_PRICE_EUR: 7.0,
    TOP_PRICE_EUR: 4.0,
    VIP_DAYS: 7,
    TOP_DAYS: 7,
    PRIVATE_OVER_LIMIT_PUBLISH_EUR: 1.0,
    COMPANY_OVER_LIMIT_PUBLISH_EUR: 0.5,
    PRIVATE_REFRESH_EUR: 0.5,
    COMPANY_REFRESH_EUR: 0.25
  };

  const SEARCHABLE_SELECT_ROOT_SELECTOR = "#createListingForm select";

  const SMART_CATEGORY_ALIAS_GROUPS = [
    ["каска", "каски", "helmet", "helmets"],
    ["яке", "якета", "jacket", "jackets"],
    ["ръкавица", "ръкавици", "glove", "gloves"],
    ["ботуш", "ботуши", "boot", "boots"],
    ["протектор", "протектори", "protector", "protectors", "armor", "armour"],
    ["куфар", "куфари", "top case", "topcase", "side case", "sidecase", "багажник", "багажници"],
    ["стойка", "стойки", "държач", "държачи", "holder", "holders", "mount", "mounts"],
    ["джанта", "джанти", "rim", "rims", "wheel", "wheels"],
    ["гума", "гуми", "tire", "tires", "tyre", "tyres"],
    ["фар", "фарове", "headlight", "headlights"],
    ["огледало", "огледала", "mirror", "mirrors"],
    ["ауспух", "ауспуси", "exhaust", "exhausts", "muffler", "mufflers", "slip on", "slip-on", "slipon"],
    ["верига", "вериги", "chain", "chains"],
    ["накладка", "накладки", "pad", "pads", "brake pad", "brake pads"]
  ];

  const SMART_CATEGORY_BASE_TERMS = {
    VEHICLE: ["мотор", "мотори", "motor", "motors", "motorcycle", "motorcycles", "bike", "bikes", "скутер", "скутери", "atv", "крос", "ендуро", "чопър"],
    GEAR: ["екипировка", "gear", "equipment", "каска", "каски", "яке", "якета", "ръкавици", "ботуши", "протектори"],
    PART: ["част", "части", "part", "parts", "джанта", "джанти", "гума", "гуми", "фар", "фарове", "огледало", "огледала", "ауспух", "ауспуси"],
    ACCESSORY: ["аксесоар", "аксесоари", "accessory", "accessories", "куфар", "куфари", "стойка", "стойки", "багажник", "багажници", "държач", "държачи", "зарядно", "навигация", "камера"]
  };

  const SMART_CATEGORY_ROUTE_RULES = [
    {
      terms: ["верига", "вериги", "chain", "chains", "пиньон", "пиньони", "sprocket", "sprockets", "венец", "венци", "зъбчатка", "зъбчатки"],
      mainCategoryCode: "PART",
      pathHint: "избери най-близкия тип част",
      fallbackNote: "Няма точен тип за това. Избери най-близкия тип част от полето отдолу, а написаното остава в детайлите.",
      prefillField: "partItemModelTextInput"
    },
    {
      terms: ["краштапи", "краш тапи", "crash pad", "crash pads", "slider", "sliders", "frame slider", "frame sliders", "crash bar", "crash bars", "engine guard", "engine guards"],
      mainCategoryCode: "ACCESSORY",
      pathHint: "избери най-близкия тип аксесоар",
      fallbackNote: "Няма точен тип за това. Избери най-близкия тип аксесоар от полето отдолу, а написаното остава в детайлите.",
      prefillField: "accessoryItemModelTextInput"
    }
  ];

  const CATEGORY_OVERVIEW_CONFIG = [
    {
      code: "VEHICLE",
      label: "Превозни средства",
      description: "Мотори, скутери, ATV и други превозни средства."
    },
    {
      code: "GEAR",
      label: "Екипировка",
      description: "Каски, якета, ръкавици, ботуши и защита за каране."
    },
    {
      code: "ACCESSORY",
      label: "Аксесоари",
      description: "Куфари, стойки, навигации и удобства за мотора."
    },
    {
      code: "PART",
      label: "Части",
      description: "Части за поддръжка, ремонт и подобрения."
    }
  ];

  const CATEGORY_OVERVIEW_META = {
    VEHICLE: {
      image: "ImagesVideos/motorcycle.png",
      accent: "#143d8f",
      soft: "rgba(20, 61, 143, 0.12)",
      border: "rgba(20, 61, 143, 0.34)",
      ring: "rgba(20, 61, 143, 0.14)"
    },
    GEAR: {
      image: "ImagesVideos/racing-helmet.png",
      accent: "#ff6a2a",
      soft: "rgba(255, 106, 42, 0.12)",
      border: "rgba(255, 106, 42, 0.34)",
      ring: "rgba(255, 106, 42, 0.16)"
    },
    ACCESSORY: {
      image: "ImagesVideos/trunk.png",
      accent: "#0f7b72",
      soft: "rgba(15, 123, 114, 0.12)",
      border: "rgba(15, 123, 114, 0.34)",
      ring: "rgba(15, 123, 114, 0.14)"
    },
    PART: {
      image: "ImagesVideos/disc-brake.png",
      accent: "#c84a1b",
      soft: "rgba(200, 74, 27, 0.12)",
      border: "rgba(200, 74, 27, 0.34)",
      ring: "rgba(200, 74, 27, 0.14)"
    }
  };

  const state = {
    currentUser: null,
    uploadedPhotos: [],
    photoDrag: {
      activeIndex: -1,
      overIndex: -1,
      pointerId: null
    },
    isSubmitting: false,
    smartCategory: {
      index: [],
      visibleSuggestions: [],
      activeSuggestionIndex: -1,
      lastFallbackNote: ""
    },
    billing: {
      accountType: "PRIVATE",
      freeUploadsRemainingNow: 0,
      overLimitPublishPriceEUR: PRICING.PRIVATE_OVER_LIMIT_PUBLISH_EUR,
      refreshPriceEUR: PRICING.PRIVATE_REFRESH_EUR,
      dashboardLoaded: false
    },
    lookups: {
      mainCategories: [],
      countries: [],
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
    }
  };

  const searchableSelectRegistry = new Map();
  let searchableSelectGlobalEventsBound = false;
  let suppressSearchableSelectClickUntil = 0;

  const elements = {
    backToHomeBtn: document.getElementById("backToHomeBtn"),
    logoutBtn: document.getElementById("logoutBtn"),
    userDisplayName: document.getElementById("userDisplayName"),
    statusMessage: document.getElementById("statusMessage"),
    createListingForm: document.getElementById("createListingForm"),
    submitBtn: document.getElementById("submitBtn"),
    resetFormBtn: document.getElementById("resetFormBtn"),

    categoryOverviewGrid: document.getElementById("categoryOverviewGrid"),
    smartCategoryInput: document.getElementById("smartCategoryInput"),
    smartCategorySuggestions: document.getElementById("smartCategorySuggestions"),
    smartCategoryHint: document.getElementById("smartCategoryHint"),

    mainCategorySelect: document.getElementById("mainCategorySelect"),
    promotionTypeSelect: document.getElementById("promotionTypeSelect"),
    promotionTypeHint: document.getElementById("promotionTypeHint"),
    titleInput: document.getElementById("titleInput"),
    descriptionInput: document.getElementById("descriptionInput"),

    vehicleFields: document.getElementById("vehicleFields"),
    vehicleClassSelect: document.getElementById("vehicleClassSelect"),
    vehicleTypeSelect: document.getElementById("vehicleTypeSelect"),
    vehicleBrandSelect: document.getElementById("vehicleBrandSelect"),
    vehicleModelSelect: document.getElementById("vehicleModelSelect"),
    vehicleLicenseCategorySelect: document.getElementById("vehicleLicenseCategorySelect"),
    vehicleConditionSelect: document.getElementById("vehicleConditionSelect"),
    vehicleYearInput: document.getElementById("vehicleYearInput"),
    vehicleHorsePowerInput: document.getElementById("vehicleHorsePowerInput"),
    vehicleEngineCcInput: document.getElementById("vehicleEngineCcInput"),
    vehicleMileageInput: document.getElementById("vehicleMileageInput"),
    vehicleColorInput: document.getElementById("vehicleColorInput"),

    gearFields: document.getElementById("gearFields"),
    gearTypeSelect: document.getElementById("gearTypeSelect"),
    gearHelmetTypeWrap: document.getElementById("gearHelmetTypeWrap"),
    gearHelmetTypeSelect: document.getElementById("gearHelmetTypeSelect"),
    gearBrandSelect: document.getElementById("gearBrandSelect"),
    gearConditionSelect: document.getElementById("gearConditionSelect"),
    gearYearInput: document.getElementById("gearYearInput"),
    gearColorInput: document.getElementById("gearColorInput"),
    gearItemModelTextInput: document.getElementById("gearItemModelTextInput"),

    partFields: document.getElementById("partFields"),
    partTypeSelect: document.getElementById("partTypeSelect"),
    partBrandSelect: document.getElementById("partBrandSelect"),
    partConditionSelect: document.getElementById("partConditionSelect"),
    partItemModelTextInput: document.getElementById("partItemModelTextInput"),

    accessoryFields: document.getElementById("accessoryFields"),
    accessoryTypeSelect: document.getElementById("accessoryTypeSelect"),
    accessoryBrandSelect: document.getElementById("accessoryBrandSelect"),
    accessoryConditionSelect: document.getElementById("accessoryConditionSelect"),
    accessoryItemModelTextInput: document.getElementById("accessoryItemModelTextInput"),

    priceOriginalInput: document.getElementById("priceOriginalInput"),
    currencyCodeSelect: document.getElementById("currencyCodeSelect"),

    countrySelect: document.getElementById("countrySelect"),
    regionWrap: document.getElementById("regionWrap"),
    regionSelect: document.getElementById("regionSelect"),
    cityWrap: document.getElementById("cityWrap"),
    citySelect: document.getElementById("citySelect"),

    contactNameInput: document.getElementById("contactNameInput"),
    contactPhoneInput: document.getElementById("contactPhoneInput"),

    photosInput: document.getElementById("photosInput"),
    photoPreviewGrid: document.getElementById("photoPreviewGrid"),

    listingPreviewCard: document.getElementById("listingPreviewCard"),
    listingPreviewRibbon: document.getElementById("listingPreviewRibbon"),
    listingPreviewImage: document.getElementById("listingPreviewImage"),
    listingPreviewPlaceholder: document.getElementById("listingPreviewPlaceholder"),
    listingPreviewTitle: document.getElementById("listingPreviewTitle"),
    listingPreviewPrice: document.getElementById("listingPreviewPrice"),
    listingPreviewMeta: document.getElementById("listingPreviewMeta"),
    listingPreviewLocation: document.getElementById("listingPreviewLocation"),

    pricingSummaryText: document.getElementById("pricingSummaryText"),
    billingAccountType: document.getElementById("billingAccountType"),
    billingFreeRemaining: document.getElementById("billingFreeRemaining"),
    billingOverLimitPrice: document.getElementById("billingOverLimitPrice"),
    billingRefreshPrice: document.getElementById("billingRefreshPrice"),
    selectedPlanCard: document.getElementById("selectedPlanCard"),
    selectedPlanName: document.getElementById("selectedPlanName"),
    selectedPlanPrice: document.getElementById("selectedPlanPrice"),
    selectedPlanHint: document.getElementById("selectedPlanHint"),

    normalPlanPriceText: document.getElementById("normalPlanPriceText"),
    normalPlanText: document.getElementById("normalPlanText"),
    topPlanPriceText: document.getElementById("topPlanPriceText"),
    topPlanText: document.getElementById("topPlanText"),
    vipPlanPriceText: document.getElementById("vipPlanPriceText"),
    vipPlanText: document.getElementById("vipPlanText"),

    duePublishFee: document.getElementById("duePublishFee"),
    duePromotionFee: document.getElementById("duePromotionFee"),
    dueTotalEUR: document.getElementById("dueTotalEUR"),
    dueBreakdownText: document.getElementById("dueBreakdownText")
  };

  document.addEventListener("DOMContentLoaded", init);

  async function init() {
    enhanceSearchableSelects();
    bindEvents();

    const currentUser = await ensureAuthenticatedPage();
    if (!currentUser) return;

    state.currentUser = currentUser;
    hydrateUserBox(currentUser);
    prefillUserContactData(currentUser);
    await loadBillingContext();

    try {
      setStatus("Зареждаме формата...", "info");
      await loadLookups();
      await prefillUserCountry(currentUser);
      renderPhotoPreview();
      updateListingPreview();
      updateCreateChargePreview();
      setStatus("", "");
    } catch (error) {
      console.error(error);
      setStatus(error?.message || "Възникна проблем при зареждането на формата.", "error");
    }
  }

  function bindEvents() {
    elements.backToHomeBtn?.addEventListener("click", () => {
      if (window.Auth?.redirectToProfile) {
        window.Auth.redirectToProfile();
        return;
      }

      window.location.href = "Profile.html";
    });

    elements.logoutBtn?.addEventListener("click", () => {
      window.location.href = "index.html";
    });

    elements.categoryOverviewGrid?.addEventListener("click", event => {
      const categoryButton = event.target.closest("[data-category-code]");
      if (categoryButton) {
        const categoryCode = categoryButton.getAttribute("data-category-code") || "";
        const entry = getMainCategoryEntry(categoryCode);

        if (entry) {
          applySmartCategorySelection(entry);
        }

        return;
      }

      const chipButton = event.target.closest("[data-entry-key]");
      if (!chipButton) return;

      const entryKey = chipButton.getAttribute("data-entry-key");
      const entry = getSmartCategoryEntryByKey(entryKey);

      if (entry) {
        applySmartCategorySelection(entry);
      }
    });

    elements.smartCategoryInput?.addEventListener("input", () => {
      clearSmartCategoryFallbackNote();
      updateSmartCategorySuggestions(elements.smartCategoryInput.value);
    });

    elements.smartCategoryInput?.addEventListener("focus", () => {
      updateSmartCategorySuggestions(elements.smartCategoryInput.value);
    });

    elements.smartCategoryInput?.addEventListener("keydown", onSmartCategoryInputKeyDown);

    elements.smartCategoryInput?.addEventListener("blur", () => {
      window.setTimeout(() => {
        closeSmartCategorySuggestions();
      }, 120);
    });

    elements.smartCategorySuggestions?.addEventListener("pointerdown", event => {
      const option = event.target.closest("[data-smart-key]");
      if (!option) return;

      event.preventDefault();

      const key = option.getAttribute("data-smart-key");
      const entry = state.smartCategory.index.find(item => item.key === key);
      if (!entry) return;

      applySmartCategorySelection(entry);
      elements.smartCategoryInput?.focus();
    });

    document.querySelectorAll("[data-smart-term]").forEach(button => {
      button.addEventListener("click", () => {
        const term = button.getAttribute("data-smart-term") || "";
        selectSmartCategoryByTerm(term);
      });
    });

    elements.mainCategorySelect?.addEventListener("change", async () => {
      clearSmartCategoryFallbackNote();
      toggleCategorySections();
      clearIrrelevantFields();
      await maybeLoadVehicleModels();
      syncSmartCategoryHint();
      renderCategoryOverview();
      updateListingPreview();
      updateCreateChargePreview();
    });

    elements.vehicleClassSelect?.addEventListener("change", async () => {
      clearSmartCategoryFallbackNote();
      fillVehicleTypesByClass();
      await maybeLoadVehicleModels();
      syncSmartCategoryHint();
      renderCategoryOverview();
      updateListingPreview();
      updateCreateChargePreview();
    });

    elements.vehicleBrandSelect?.addEventListener("change", async () => {
      await maybeLoadVehicleModels();
      updateListingPreview();
      updateCreateChargePreview();
    });

    elements.gearTypeSelect?.addEventListener("change", () => {
      clearSmartCategoryFallbackNote();
      toggleHelmetTypeField();
      syncSmartCategoryHint();
      renderCategoryOverview();
      updateListingPreview();
      updateCreateChargePreview();
    });

    elements.vehicleTypeSelect?.addEventListener("change", () => {
      clearSmartCategoryFallbackNote();
      syncSmartCategoryHint();
    });
    elements.gearHelmetTypeSelect?.addEventListener("change", () => {
      clearSmartCategoryFallbackNote();
      syncSmartCategoryHint();
    });
    elements.partTypeSelect?.addEventListener("change", () => {
      clearSmartCategoryFallbackNote();
      syncSmartCategoryHint();
      renderCategoryOverview();
    });
    elements.accessoryTypeSelect?.addEventListener("change", () => {
      clearSmartCategoryFallbackNote();
      syncSmartCategoryHint();
      renderCategoryOverview();
    });

    elements.countrySelect?.addEventListener("change", async () => {
      await handleCountryChange();
      updateListingPreview();
      updateCreateChargePreview();
    });

    elements.regionSelect?.addEventListener("change", async () => {
      await handleRegionChange();
      updateListingPreview();
      updateCreateChargePreview();
    });

    elements.currencyCodeSelect?.addEventListener("change", () => {
      updateListingPreview();
      updateCreateChargePreview();
    });

    elements.photosInput?.addEventListener("change", onPhotosSelected);

    elements.resetFormBtn?.addEventListener("click", async () => {
      await resetForm();
    });

    document.addEventListener("pointermove", onPhotoDragMove);
    document.addEventListener("pointerup", onPhotoDragEnd);
    document.addEventListener("pointercancel", cancelPhotoDrag);

    elements.createListingForm?.addEventListener("submit", onSubmit);

    elements.createListingForm?.addEventListener("input", event => {
      if (event.target === elements.photosInput) return;
      if (event.target?.classList?.contains("searchable-select__search")) return;
      updateListingPreview();
      updateCreateChargePreview();
    });

    elements.createListingForm?.addEventListener("change", event => {
      if (event.target === elements.photosInput) return;
      updateListingPreview();
      updateCreateChargePreview();
    });
  }

  async function ensureAuthenticatedPage() {
    if (window.Auth?.isLoggedIn && !window.Auth.isLoggedIn()) {
      redirectToLoginSilently();
      return null;
    }

    try {
      if (window.Auth?.fetchCurrentUserFromApi) {
        const user = await window.Auth.fetchCurrentUserFromApi();
        if (!user) {
          redirectToLoginSilently();
          return null;
        }

        return user;
      }

      const fallbackUser = tryReadUserFromLocalStorage();
      if (!fallbackUser) {
        redirectToLoginSilently();
        return null;
      }

      return fallbackUser;
    } catch (error) {
      console.error(error);
      redirectToLoginSilently();
      return null;
    }
  }

  function redirectToLoginSilently() {
    if (window.Auth?.redirectToLogin) {
      window.Auth.redirectToLogin();
      return;
    }

    const returnUrl = `${window.location.pathname}${window.location.search}`;
    window.location.href = `Login.html?returnUrl=${encodeURIComponent(returnUrl)}`;
  }

  function redirectToLogin() {
    redirectToLoginSilently();
    return;

    alert("За да качиш обява, трябва първо да влезеш в профила си.");

    if (window.Auth?.redirectToLogin) {
      window.Auth.redirectToLogin();
      return;
    }

    const returnUrl = `${window.location.pathname}${window.location.search}`;
    window.location.href = `Login.html?returnUrl=${encodeURIComponent(returnUrl)}`;
  }

  function tryReadUserFromLocalStorage() {
    try {
      const raw = localStorage.getItem("user");
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  function hydrateUserBox(user) {
    const displayName =
      cleanNullableText(user?.companyName) ||
      cleanNullableText(user?.displayName) ||
      cleanNullableText(user?.fullName) ||
      cleanNullableText([user?.firstName, user?.lastName].filter(Boolean).join(" ")) ||
      "Потребител";

    if (elements.userDisplayName) {
      elements.userDisplayName.textContent = displayName;
    }
  }

  function prefillUserContactData(user) {
    if (!elements.contactNameInput.value) {
      const contactName =
        cleanNullableText(user?.companyName) ||
        cleanNullableText(user?.contactPerson) ||
        cleanNullableText(user?.fullName) ||
        cleanNullableText([user?.firstName, user?.lastName].filter(Boolean).join(" "));

      if (contactName) {
        elements.contactNameInput.value = contactName;
      }
    }

    if (!elements.contactPhoneInput.value) {
      const phone =
        cleanNullableText(user?.phone) ||
        cleanNullableText(user?.contactPhone) ||
        cleanNullableText(user?.mobilePhone);

      if (phone) {
        elements.contactPhoneInput.value = phone;
      }
    }
  }

  async function prefillUserCountry(user) {
    const userCountryId =
      toNumberOrNull(user?.countryId) ||
      toNumberOrNull(user?.country?.id);

    if (!userCountryId) {
      toggleLocationFields(false);
      updateListingPreview();
      updateCreateChargePreview();
      return;
    }

    const exists = state.lookups.countries.some(x => Number(x.id) === userCountryId);
    if (!exists) {
      toggleLocationFields(false);
      updateListingPreview();
      updateCreateChargePreview();
      return;
    }

    setSelectValue(elements.countrySelect, String(userCountryId));
    await handleCountryChange();

    const userRegionId =
      toNumberOrNull(user?.regionId) ||
      toNumberOrNull(user?.region?.id);

    if (userRegionId && !elements.regionWrap.classList.contains("hidden")) {
      setSelectValue(elements.regionSelect, String(userRegionId));
      await handleRegionChange();
    }

    const userCityId =
      toNumberOrNull(user?.cityId) ||
      toNumberOrNull(user?.city?.id);

    if (userCityId && !elements.cityWrap.classList.contains("hidden")) {
      setSelectValue(elements.citySelect, String(userCityId));
    }

    updateListingPreview();
    updateCreateChargePreview();
  }

  async function loadLookups() {
    const data = await getJson(`${API_BASE_URL}/api/lookups/all`);

    state.lookups.mainCategories = (data?.mainCategories || []).filter(x =>
      ["VEHICLE", "GEAR", "PART", "ACCESSORY"].includes((x?.code || "").toUpperCase())
    );
    state.lookups.countries = data?.countries || [];
    state.lookups.vehicleClasses = data?.vehicleClasses || [];
    state.lookups.vehicleTypes = data?.vehicleTypes || [];
    state.lookups.gearTypes = data?.gearTypes || [];
    state.lookups.helmetTypes = data?.helmetTypes || [];
    state.lookups.partTypes = data?.partTypes || [];
    state.lookups.accessoryTypes = data?.accessoryTypes || [];
    state.lookups.conditions = data?.conditions || [];
    state.lookups.licenseCategories = data?.licenseCategories || [];
    state.lookups.vehicleBrands = data?.vehicleBrands || [];
    state.lookups.gearBrands = data?.gearBrands || [];
    state.lookups.partBrands = data?.partBrands || [];
    state.lookups.accessoryBrands = data?.accessoryBrands || [];

    const mainCategoryOptions = state.lookups.mainCategories.map(item => ({
      ...item,
      pickerLabel: buildMainCategoryPickerLabel(item)
    }));

    fillSelect(elements.mainCategorySelect, mainCategoryOptions, {
      placeholder: "Избери категория",
      preferredLabelKey: "pickerLabel"
    });

    fillSelect(elements.vehicleClassSelect, state.lookups.vehicleClasses, {
      placeholder: "Избери клас"
    });

    fillSelect(elements.vehicleTypeSelect, [], {
      placeholder: "Избери вид"
    });

    fillSelect(elements.vehicleBrandSelect, state.lookups.vehicleBrands, {
      placeholder: "Избери марка",
      preferredLabelKey: "name"
    });

    fillSelect(elements.vehicleModelSelect, [], {
      placeholder: "Избери модел",
      preferredLabelKey: "name"
    });

    fillSelect(elements.vehicleLicenseCategorySelect, state.lookups.licenseCategories, {
      placeholder: "Избери категория"
    });

    fillSelect(elements.vehicleConditionSelect, state.lookups.conditions, {
      placeholder: "Избери състояние"
    });

    fillSelect(elements.gearTypeSelect, state.lookups.gearTypes, {
      placeholder: "Избери тип"
    });

    fillSelect(elements.gearHelmetTypeSelect, state.lookups.helmetTypes, {
      placeholder: "Избери тип каска"
    });

    fillSelect(elements.gearBrandSelect, state.lookups.gearBrands, {
      placeholder: "Избери марка",
      preferredLabelKey: "name"
    });

    fillSelect(elements.gearConditionSelect, state.lookups.conditions, {
      placeholder: "Избери състояние"
    });

    fillSelect(elements.partTypeSelect, state.lookups.partTypes, {
      placeholder: "Избери тип част"
    });

    fillSelect(elements.partBrandSelect, state.lookups.partBrands, {
      placeholder: "Избери марка",
      preferredLabelKey: "name"
    });

    fillSelect(elements.partConditionSelect, state.lookups.conditions, {
      placeholder: "Избери състояние"
    });

    fillSelect(elements.accessoryTypeSelect, state.lookups.accessoryTypes, {
      placeholder: "Избери тип аксесоар"
    });

    fillSelect(elements.accessoryBrandSelect, state.lookups.accessoryBrands, {
      placeholder: "Избери марка",
      preferredLabelKey: "name"
    });

    fillSelect(elements.accessoryConditionSelect, state.lookups.conditions, {
      placeholder: "Избери състояние"
    });

    fillSelect(elements.countrySelect, state.lookups.countries, {
      placeholder: "Избери държава",
      preferredLabelKey: "nameBg"
    });

    fillSelect(elements.regionSelect, [], {
      placeholder: "Избери област"
    });

    fillSelect(elements.citySelect, [], {
      placeholder: "Избери град"
    });

    buildSmartCategoryIndex();
    renderCategoryOverview();
    toggleCategorySections();
    toggleHelmetTypeField();
    toggleLocationFields(false);
    syncSmartCategoryHint();
    updateListingPreview();
    updateCreateChargePreview();
  }

  function fillSelect(select, items, options = {}) {
    if (!select) return;

    const {
      placeholder = "Избери",
      preferredLabelKey = null,
      preferredValueKey = "id"
    } = options;

    const safeItems = Array.isArray(items) ? items : [];

    const html = [
      `<option value="">${escapeHtml(placeholder)}</option>`,
      ...safeItems.map(item => {
        const label = resolveLookupLabel(item, preferredLabelKey);
        const value = resolveLookupValue(item, preferredValueKey);

        return `<option value="${escapeHtml(String(value ?? ""))}">${escapeHtml(String(label ?? ""))}</option>`;
      })
    ].join("");

    select.innerHTML = html;
    syncSearchableSelect(select);
  }

  function enhanceSearchableSelects() {
    document.querySelectorAll(SEARCHABLE_SELECT_ROOT_SELECTOR).forEach(select => {
      if (searchableSelectRegistry.has(select)) {
        syncSearchableSelect(select);
        return;
      }

      createSearchableSelect(select);
    });

    if (searchableSelectGlobalEventsBound) {
      return;
    }

    document.addEventListener("click", event => {
      if (Date.now() > suppressSearchableSelectClickUntil) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
    }, true);

    document.addEventListener("pointerdown", event => {
      for (const instance of searchableSelectRegistry.values()) {
        if (!instance.wrapper.contains(event.target)) {
          closeSearchableSelect(instance);
        }
      }
    });

    window.addEventListener("resize", () => {
      closeAllSearchableSelects();
    });

    searchableSelectGlobalEventsBound = true;
  }

  function createSearchableSelect(select) {
    const wrapper = document.createElement("div");
    wrapper.className = "searchable-select";

    const trigger = document.createElement("button");
    trigger.type = "button";
    trigger.className = "searchable-select__trigger";
    trigger.setAttribute("aria-haspopup", "listbox");
    trigger.setAttribute("aria-expanded", "false");

    const triggerText = document.createElement("span");
    triggerText.className = "searchable-select__trigger-text";

    const triggerIcon = document.createElement("span");
    triggerIcon.className = "searchable-select__trigger-icon";
    triggerIcon.setAttribute("aria-hidden", "true");
    triggerIcon.textContent = "⌄";

    trigger.append(triggerText, triggerIcon);

    const dropdown = document.createElement("div");
    dropdown.className = "searchable-select__dropdown hidden";

    const searchWrap = document.createElement("div");
    searchWrap.className = "searchable-select__search-wrap";

    const searchInput = document.createElement("input");
    searchInput.type = "text";
    searchInput.className = "searchable-select__search";
    searchInput.placeholder = "Търси...";
    searchInput.autocomplete = "off";
    searchInput.spellcheck = false;

    searchWrap.append(searchInput);

    const optionsList = document.createElement("div");
    optionsList.className = "searchable-select__options";
    optionsList.setAttribute("role", "listbox");

    dropdown.append(searchWrap, optionsList);

    const parent = select.parentNode;
    parent?.insertBefore(wrapper, select);
    wrapper.append(select, trigger, dropdown);

    select.classList.add("searchable-select__native");
    select.setAttribute("tabindex", "-1");
    select.setAttribute("aria-hidden", "true");
    select.dataset.searchableEnhanced = "true";

    const instance = {
      select,
      wrapper,
      trigger,
      triggerText,
      dropdown,
      searchInput,
      optionsList,
      activeIndex: -1,
      placeholderText: "",
      visibleOptions: [],
      optionPointer: null,
      suppressOptionClickUntil: 0
    };

    searchableSelectRegistry.set(select, instance);

    if (select.id) {
      document.querySelectorAll(`label[for="${select.id}"]`).forEach(label => {
        label.addEventListener("click", event => {
          event.preventDefault();

          if (instance.select.disabled) {
            return;
          }

          openSearchableSelect(instance);
        });
      });
    }

    trigger.addEventListener("click", () => {
      if (instance.select.disabled) {
        return;
      }

      if (wrapper.classList.contains("is-open")) {
        closeSearchableSelect(instance);
        return;
      }

      openSearchableSelect(instance);
    });

    trigger.addEventListener("keydown", event => {
      if (instance.select.disabled) {
        return;
      }

      if (event.key === "ArrowDown" || event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        openSearchableSelect(instance);
        return;
      }

      if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
        event.preventDefault();
        openSearchableSelect(instance, {
          initialQuery: event.key
        });
      }
    });

    searchInput.addEventListener("input", () => {
      renderSearchableSelectOptions(instance);
    });

    searchInput.addEventListener("keydown", event => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeSearchableSelect(instance, {
          restoreFocus: true
        });
        return;
      }

      if (event.key === "ArrowDown") {
        event.preventDefault();
        moveSearchableSelectActiveIndex(instance, 1);
        return;
      }

      if (event.key === "ArrowUp") {
        event.preventDefault();
        moveSearchableSelectActiveIndex(instance, -1);
        return;
      }

      if (event.key === "Enter") {
        const activeOption = instance.visibleOptions[instance.activeIndex] || instance.visibleOptions[0];
        if (!activeOption || activeOption.disabled) {
          return;
        }

        event.preventDefault();
        applySearchableOptionSelection(instance, activeOption.value);
      }
    });

    bindSearchableOptionTouch(instance);

    select.addEventListener("change", () => {
      syncSearchableSelect(select);
    });

    const observer = new MutationObserver(() => {
      syncSearchableSelect(select);
    });

    observer.observe(select, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["disabled"]
    });

    instance.observer = observer;

    syncSearchableSelect(select);
  }

  function bindSearchableOptionTouch(instance) {
    const maxTapMove = 10;

    instance.optionsList.addEventListener("pointerdown", event => {
      const optionButton = event.target.closest("[data-searchable-value]");

      if (!optionButton || optionButton.disabled || !instance.optionsList.contains(optionButton)) {
        instance.optionPointer = null;
        return;
      }

      if (event.pointerType !== "mouse") {
        event.preventDefault();
      }

      instance.optionPointer = {
        pointerId: event.pointerId,
        button: optionButton,
        startX: event.clientX,
        startY: event.clientY,
        moved: false,
        selectedAt: 0
      };
    });

    instance.optionsList.addEventListener("pointermove", event => {
      const pointer = instance.optionPointer;

      if (!pointer || pointer.pointerId !== event.pointerId) {
        return;
      }

      const moveX = Math.abs(event.clientX - pointer.startX);
      const moveY = Math.abs(event.clientY - pointer.startY);

      if (moveX > maxTapMove || moveY > maxTapMove) {
        pointer.moved = true;
      }
    });

    instance.optionsList.addEventListener("pointerup", event => {
      const pointer = instance.optionPointer;
      const optionButton = event.target.closest("[data-searchable-value]");

      if (!pointer || pointer.pointerId !== event.pointerId) {
        return;
      }

      if (pointer.moved || optionButton !== pointer.button) {
        instance.suppressOptionClickUntil = Date.now() + 700;
        instance.optionPointer = null;
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      pointer.selectedAt = Date.now();
      suppressNextSearchableSelectClick();
      applySearchableOptionSelection(instance, pointer.button.dataset.searchableValue || "");
    });

    instance.optionsList.addEventListener("click", event => {
      const optionButton = event.target.closest("[data-searchable-value]");

      if (!optionButton || optionButton.disabled || !instance.optionsList.contains(optionButton)) {
        return;
      }

      const pointer = instance.optionPointer;
      const pointerHandledRecently = pointer?.selectedAt && Date.now() - pointer.selectedAt < 700;
      const shouldSuppressClick = Date.now() < instance.suppressOptionClickUntil;

      event.preventDefault();
      event.stopPropagation();

      if (pointer?.moved || pointerHandledRecently || shouldSuppressClick) {
        instance.optionPointer = null;
        return;
      }

      suppressNextSearchableSelectClick();
      applySearchableOptionSelection(instance, optionButton.dataset.searchableValue || "");
      instance.optionPointer = null;
    }, true);
  }

  function suppressNextSearchableSelectClick() {
    suppressSearchableSelectClickUntil = Date.now() + 750;
  }

  function openSearchableSelect(instance, options = {}) {
    if (!instance) return;

    closeAllSearchableSelects(instance.select);

    instance.wrapper.classList.add("is-open");
    instance.wrapper.closest(".form-field")?.classList.add("is-search-open");
    instance.dropdown.classList.remove("hidden");
    instance.trigger.setAttribute("aria-expanded", "true");
    instance.searchInput.value = cleanText(options.initialQuery);
    renderSearchableSelectOptions(instance);

    window.requestAnimationFrame(() => {
      if (isCoarsePointer()) {
        return;
      }

      instance.searchInput.focus();

      if (instance.searchInput.value) {
        const cursorPosition = instance.searchInput.value.length;
        instance.searchInput.setSelectionRange(cursorPosition, cursorPosition);
      } else if (!isCoarsePointer()) {
        instance.searchInput.select();
      }
    });
  }

  function isCoarsePointer() {
    return window.matchMedia?.("(hover: none) and (pointer: coarse)")?.matches || false;
  }

  function closeSearchableSelect(instance, options = {}) {
    if (!instance) return;

    instance.wrapper.classList.remove("is-open");
    instance.wrapper.closest(".form-field")?.classList.remove("is-search-open");
    instance.dropdown.classList.add("hidden");
    instance.trigger.setAttribute("aria-expanded", "false");
    instance.searchInput.value = "";
    instance.activeIndex = -1;
    instance.visibleOptions = [];
    instance.optionPointer = null;

    if (options.restoreFocus) {
      instance.trigger.focus();
    }
  }

  function closeAllSearchableSelects(exceptSelect = null) {
    for (const instance of searchableSelectRegistry.values()) {
      if (exceptSelect && instance.select === exceptSelect) {
        continue;
      }

      closeSearchableSelect(instance);
    }
  }

  function renderSearchableSelectOptions(instance) {
    if (!instance) return;

    const query = normalizeSearchText(instance.searchInput.value);
    const options = Array.from(instance.select.options || []);
    const currentValue = String(instance.select.value || "");

    const visibleOptions = options
      .filter(option => String(option?.value ?? "") !== "")
      .map(option => buildSearchableSelectOptionModel(instance, option, currentValue))
      .filter(option => {
        if (!query) {
          return true;
        }

        return option.searchText.includes(query);
      });

    instance.visibleOptions = visibleOptions.filter(option => !option.disabled);

    if (!visibleOptions.length) {
      instance.activeIndex = -1;
      instance.optionsList.innerHTML = `
        <div class="searchable-select__empty">Няма съвпадения. Опитай с друга дума.</div>
      `;
      return;
    }

    instance.activeIndex = Math.min(
      Math.max(instance.activeIndex, 0),
      Math.max(instance.visibleOptions.length - 1, 0)
    );

    instance.optionsList.innerHTML = visibleOptions
      .map(option => {
        const isActive =
          !option.disabled &&
          instance.visibleOptions[instance.activeIndex]?.key === option.key;

        const classes = [
          "searchable-select__option",
          option.selected ? "is-selected" : "",
          option.disabled ? "is-disabled" : "",
          isActive ? "is-active" : "",
          option.isPlaceholder ? "is-placeholder" : ""
        ]
          .filter(Boolean)
          .join(" ");

        return `
          <button
            type="button"
            class="${classes}"
            data-searchable-key="${escapeHtml(option.key)}"
            data-searchable-value="${escapeHtml(option.value)}"
            ${option.disabled ? "disabled" : ""}
          >
            <span class="searchable-select__option-copy">
              <span class="searchable-select__option-title">${escapeHtml(option.label)}</span>
              ${option.meta ? `<span class="searchable-select__option-meta">${escapeHtml(option.meta)}</span>` : ""}
            </span>
            ${option.selected ? '<span class="searchable-select__option-check" aria-hidden="true">✓</span>' : ""}
          </button>
        `;
      })
      .join("");

    const activeButton = instance.optionsList.querySelector(".searchable-select__option.is-active");
    activeButton?.scrollIntoView({
      block: "nearest"
    });
  }

  function buildSearchableSelectOptionModel(instance, option, currentValue) {
    const rawValue = String(option?.value ?? "");
    const optionLabel = cleanText(option?.text) || instance.placeholderText || "Избери";
    const meta = option.disabled
        ? "Временно недостъпно"
        : option.selected
          ? "Текущ избор"
          : "";

    return {
      key: `${instance.select.id || "select"}-${rawValue || "empty"}`,
      value: rawValue,
      label: optionLabel,
      meta,
      selected: rawValue === currentValue,
      disabled: Boolean(option.disabled),
      isPlaceholder: false,
      searchText: normalizeSearchText([optionLabel, meta].filter(Boolean).join(" "))
    };
  }

  function moveSearchableSelectActiveIndex(instance, direction) {
    if (!instance?.visibleOptions.length) {
      return;
    }

    const nextIndex = instance.activeIndex + direction;

    if (nextIndex < 0) {
      instance.activeIndex = instance.visibleOptions.length - 1;
    } else if (nextIndex >= instance.visibleOptions.length) {
      instance.activeIndex = 0;
    } else {
      instance.activeIndex = nextIndex;
    }

    const activeKey = instance.visibleOptions[instance.activeIndex]?.key;
    const activeButton = instance.optionsList.querySelector(
      `[data-searchable-key="${escapeHtml(activeKey || "")}"]`
    );

    instance.optionsList
      .querySelectorAll(".searchable-select__option")
      .forEach(button => button.classList.remove("is-active"));

    activeButton?.classList.add("is-active");
    activeButton?.scrollIntoView({
      block: "nearest"
    });
  }

  function applySearchableOptionSelection(instance, value) {
    if (!instance) {
      return;
    }

    setSelectValue(instance.select, value, {
      dispatchChange: true
    });

    closeSearchableSelect(instance);
  }

  function syncSearchableSelect(select) {
    const instance = searchableSelectRegistry.get(select);
    if (!instance) {
      return;
    }

    const selectedOption =
      select.options?.[select.selectedIndex] ||
      select.options?.[0] ||
      null;

    const hasValue = cleanText(select.value) !== "";
    const selectedText = cleanText(selectedOption?.text) || "Избери";

    instance.placeholderText = cleanText(select.options?.[0]?.text) || "Избери";
    instance.triggerText.textContent = selectedText;
    instance.triggerText.classList.toggle("is-placeholder", !hasValue);
    instance.trigger.disabled = Boolean(select.disabled);
    instance.wrapper.classList.toggle("is-disabled", Boolean(select.disabled));
    instance.searchInput.placeholder = hasValue
      ? `Търси друго за "${selectedText}"`
      : `Търси в "${instance.placeholderText}"`;

    if (instance.wrapper.classList.contains("is-open")) {
      renderSearchableSelectOptions(instance);
      return;
    }

    closeSearchableSelect(instance);
  }

  function syncAllSearchableSelects() {
    for (const select of searchableSelectRegistry.keys()) {
      syncSearchableSelect(select);
    }
  }

  function setSelectValue(select, value, options = {}) {
    if (!select) return;

    const normalizedValue = value === null || value === undefined ? "" : String(value);
    const previousValue = String(select.value || "");

    select.value = normalizedValue;
    syncSearchableSelect(select);

    if (options.dispatchChange && previousValue !== String(select.value || "")) {
      select.dispatchEvent(new Event("change", { bubbles: true }));
    }
  }

  function resolveLookupLabel(item, preferredLabelKey = null) {
    if (!item || typeof item !== "object") return "";

    if (preferredLabelKey && item[preferredLabelKey] !== undefined && item[preferredLabelKey] !== null) {
      return item[preferredLabelKey];
    }

    return (
      item.nameBg ??
      item.name ??
      item.label ??
      item.code ??
      item.title ??
      ""
    );
  }

  function resolveLookupValue(item, preferredValueKey = "id") {
    if (!item || typeof item !== "object") return "";

    return (
      item[preferredValueKey] ??
      item.id ??
      item.value ??
      item.code ??
      ""
    );
  }

  function buildMainCategoryPickerLabel(item) {
    const code = String(item?.code || "").trim().toUpperCase();
    const label = resolveLookupLabel(item, "nameBg");

    const summaries = {
      VEHICLE: "мотори, скутери, ATV и още",
      GEAR: "каски, якета, ръкавици и още",
      ACCESSORY: "куфари, стойки, навигации и още",
      PART: "джанти, гуми, ауспуси и още"
    };

    const summary = summaries[code];
    return summary ? `${label} - ${summary}` : label;
  }

  function normalizeSearchText(value) {
    return String(value || "")
      .toLocaleLowerCase("bg")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zа-я0-9]+/gi, " ")
      .trim();
  }

  function getMainCategoryByCode(code) {
    const normalizedCode = String(code || "").trim().toUpperCase();
    return state.lookups.mainCategories.find(item => String(item?.code || "").trim().toUpperCase() === normalizedCode) || null;
  }

  function findHelmetGearType() {
    return (
      state.lookups.gearTypes.find(item => String(item?.code || "").trim().toUpperCase() === "HELMET") ||
      state.lookups.gearTypes.find(item => normalizeSearchText(resolveLookupLabel(item)).includes("каск")) ||
      null
    );
  }

  function addNormalizedTerms(targetSet, values) {
    const items = Array.isArray(values) ? values : [values];

    for (const value of items) {
      const normalized = normalizeSearchText(value);
      if (normalized) {
        targetSet.add(normalized);
      }
    }
  }

  function enrichSmartCategoryTerms(termSet, label, mainCategoryCode, extraTerms = []) {
    const labelNormalized = normalizeSearchText(label);

    addNormalizedTerms(termSet, SMART_CATEGORY_BASE_TERMS[mainCategoryCode] || []);
    addNormalizedTerms(termSet, extraTerms);

    for (const group of SMART_CATEGORY_ALIAS_GROUPS) {
      const normalizedGroup = group.map(normalizeSearchText).filter(Boolean);
      const shouldIncludeGroup = normalizedGroup.some(term =>
        labelNormalized.includes(term) ||
        term.includes(labelNormalized)
      );

      if (shouldIncludeGroup) {
        addNormalizedTerms(termSet, normalizedGroup);
      }
    }
  }

  function createSmartCategoryEntry({
    key,
    label,
    mainCategoryCode,
    subCategoryId = null,
    subCategory2Id = null,
    depth = 0,
    pathParts = [],
    extraTerms = [],
    priority = 50
  }) {
    const mainCategory = getMainCategoryByCode(mainCategoryCode);
    const safeLabel = cleanText(label);

    if (!mainCategory || !safeLabel) {
      return null;
    }

    const mainCategoryLabel = resolveLookupLabel(mainCategory, "nameBg");
    const safePathParts = [mainCategoryLabel, ...pathParts.map(cleanText).filter(Boolean)];
    const normalizedTerms = new Set();

    addNormalizedTerms(normalizedTerms, [safeLabel, mainCategoryLabel, mainCategoryCode]);
    enrichSmartCategoryTerms(normalizedTerms, safeLabel, mainCategoryCode, extraTerms);

    const searchTerms = Array.from(normalizedTerms);
    const pathLabel = safePathParts.join(" > ");

    return {
      key,
      label: safeLabel,
      mainCategoryCode,
      mainCategoryId: Number(mainCategory.id),
      subCategoryId: toNumberOrNull(subCategoryId),
      subCategory2Id: toNumberOrNull(subCategory2Id),
      depth,
      tagLabel: mainCategoryLabel,
      pathLabel,
      labelNormalized: normalizeSearchText(safeLabel),
      pathNormalized: normalizeSearchText(pathLabel),
      searchTerms,
      searchText: searchTerms.join(" | "),
      priority
    };
  }

  function buildSmartCategoryIndex() {
    const entries = [];
    const helmetGearType = findHelmetGearType();
    const helmetGearTypeLabel = helmetGearType ? resolveLookupLabel(helmetGearType) : "";
    const vehicleClassesById = new Map(state.lookups.vehicleClasses.map(item => [Number(item.id), item]));

    for (const category of state.lookups.mainCategories) {
      const code = String(category?.code || "").trim().toUpperCase();
      const label = resolveLookupLabel(category, "nameBg");
      const entry = createSmartCategoryEntry({
        key: `main-${category.id}`,
        label,
        mainCategoryCode: code,
        depth: 0,
        priority: 90
      });

      if (entry) entries.push(entry);
    }

    for (const vehicleClass of state.lookups.vehicleClasses) {
      const label = resolveLookupLabel(vehicleClass);
      const entry = createSmartCategoryEntry({
        key: `vehicle-class-${vehicleClass.id}`,
        label,
        mainCategoryCode: "VEHICLE",
        subCategoryId: vehicleClass.id,
        depth: 1,
        pathParts: [label],
        priority: 36
      });

      if (entry) entries.push(entry);
    }

    for (const vehicleType of state.lookups.vehicleTypes) {
      const label = resolveLookupLabel(vehicleType);
      const parent = vehicleClassesById.get(Number(vehicleType.parentId || 0));
      const parentLabel = parent ? resolveLookupLabel(parent) : "";
      const entry = createSmartCategoryEntry({
        key: `vehicle-type-${vehicleType.id}`,
        label,
        mainCategoryCode: "VEHICLE",
        subCategoryId: parent?.id ?? null,
        subCategory2Id: vehicleType.id,
        depth: 2,
        pathParts: [parentLabel, label].filter(Boolean),
        priority: 18
      });

      if (entry) entries.push(entry);
    }

    for (const gearType of state.lookups.gearTypes) {
      const label = resolveLookupLabel(gearType);
      const extraTerms = String(gearType?.code || "").trim().toUpperCase() === "HELMET"
        ? ["каска", "каски", "helmet", "helmets"]
        : [];

      const entry = createSmartCategoryEntry({
        key: `gear-type-${gearType.id}`,
        label,
        mainCategoryCode: "GEAR",
        subCategoryId: gearType.id,
        depth: 1,
        pathParts: [label],
        extraTerms,
        priority: 26
      });

      if (entry) entries.push(entry);
    }

    if (helmetGearType) {
      for (const helmetType of state.lookups.helmetTypes) {
        const label = resolveLookupLabel(helmetType);
        const entry = createSmartCategoryEntry({
          key: `helmet-type-${helmetType.id}`,
          label,
          mainCategoryCode: "GEAR",
          subCategoryId: helmetGearType.id,
          subCategory2Id: helmetType.id,
          depth: 2,
          pathParts: [helmetGearTypeLabel, label].filter(Boolean),
          extraTerms: ["каска", "каски", "helmet", "helmets"],
          priority: 38
        });

        if (entry) entries.push(entry);
      }
    }

    for (const partType of state.lookups.partTypes) {
      const label = resolveLookupLabel(partType);
      const entry = createSmartCategoryEntry({
        key: `part-type-${partType.id}`,
        label,
        mainCategoryCode: "PART",
        subCategoryId: partType.id,
        depth: 1,
        pathParts: [label],
        priority: 26
      });

      if (entry) entries.push(entry);
    }

    for (const accessoryType of state.lookups.accessoryTypes) {
      const label = resolveLookupLabel(accessoryType);
      const entry = createSmartCategoryEntry({
        key: `accessory-type-${accessoryType.id}`,
        label,
        mainCategoryCode: "ACCESSORY",
        subCategoryId: accessoryType.id,
        depth: 1,
        pathParts: [label],
        priority: 26
      });

      if (entry) entries.push(entry);
    }

    state.smartCategory.index = entries;
  }

  function getSmartCategoryRouteSuggestion(query) {
    const rawQuery = cleanText(query);
    const normalizedQuery = normalizeSearchText(rawQuery);

    if (!normalizedQuery || normalizedQuery.length < 2) {
      return null;
    }

    const matchedRule = SMART_CATEGORY_ROUTE_RULES.find(rule =>
      rule.terms
        .map(normalizeSearchText)
        .filter(Boolean)
        .some(term =>
          normalizedQuery === term ||
          normalizedQuery.includes(term) ||
          term.includes(normalizedQuery)
        )
    );

    if (!matchedRule) {
      return null;
    }

    const entry = createSmartCategoryEntry({
      key: `route-${matchedRule.mainCategoryCode}-${normalizedQuery.replace(/\s+/g, "-")}`,
      label: rawQuery,
      mainCategoryCode: matchedRule.mainCategoryCode,
      depth: 1,
      pathParts: [matchedRule.pathHint],
      extraTerms: matchedRule.terms,
      priority: 34
    });

    if (!entry) {
      return null;
    }

    entry.fallbackNote = matchedRule.fallbackNote;
    entry.fallbackPrefillField = matchedRule.prefillField;
    entry.fallbackRawQuery = rawQuery;

    return entry;
  }

  function getSmartCategoryEntryByKey(key) {
    const safeKey = cleanText(key);
    if (!safeKey) return null;

    return state.smartCategory.index.find(entry => entry.key === safeKey) || null;
  }

  function getMainCategoryEntry(categoryCode) {
    const normalizedCode = cleanText(categoryCode).toUpperCase();

    return state.smartCategory.index.find(entry =>
      entry.mainCategoryCode === normalizedCode && entry.depth === 0
    ) || null;
  }

  function getCategoryOverviewEntries(categoryCode) {
    const normalizedCode = cleanText(categoryCode).toUpperCase();

    return state.smartCategory.index
      .filter(entry => entry.mainCategoryCode === normalizedCode && entry.depth === 1)
      .sort((a, b) => a.priority - b.priority || a.label.localeCompare(b.label, "bg"));
  }

  function getCurrentSelectedOverviewSubcategoryId(categoryCode) {
    const normalizedCode = cleanText(categoryCode).toUpperCase();

    if (normalizedCode === "VEHICLE") {
      return toNumberOrNull(elements.vehicleClassSelect?.value);
    }

    if (normalizedCode === "GEAR") {
      return toNumberOrNull(elements.gearTypeSelect?.value);
    }

    if (normalizedCode === "PART") {
      return toNumberOrNull(elements.partTypeSelect?.value);
    }

    if (normalizedCode === "ACCESSORY") {
      return toNumberOrNull(elements.accessoryTypeSelect?.value);
    }

    return null;
  }

  function renderCategoryOverview() {
    if (!elements.categoryOverviewGrid) return;

    const selectedMainCategoryCode = getSelectedCategoryCode();
    const selectedSubcategoryId = getCurrentSelectedOverviewSubcategoryId(selectedMainCategoryCode);

    elements.categoryOverviewGrid.innerHTML = CATEGORY_OVERVIEW_CONFIG.map(config => {
      const mainEntry = getMainCategoryEntry(config.code);
      if (!mainEntry) return "";

      const meta = CATEGORY_OVERVIEW_META[config.code] || {};
      const previewEntries = getCategoryOverviewEntries(config.code);
      const isActive = selectedMainCategoryCode === config.code;
      const visiblePreviewEntries = previewEntries.slice(0, 6);

      const previewHtml = visiblePreviewEntries.map(entry => {
        const isChipActive = isActive && selectedSubcategoryId !== null && selectedSubcategoryId === entry.subCategoryId;

        return `
          <button
            class="category-feature-link ${isChipActive ? "category-feature-link--active" : ""}"
            type="button"
            data-entry-key="${escapeHtml(entry.key)}"
          >
            ${escapeHtml(entry.label)}
          </button>
        `;
      }).join("");

      const extraCount = Math.max(0, previewEntries.length - visiblePreviewEntries.length);

      return `
        <article
          class="category-feature-card ${isActive ? "active" : ""}"
          style="--category-accent:${escapeHtml(meta.accent || "#ff6a2a")}; --category-soft:${escapeHtml(meta.soft || "rgba(255, 106, 42, 0.12)")}; --category-border:${escapeHtml(meta.border || "rgba(255, 106, 42, 0.34)")}; --category-ring:${escapeHtml(meta.ring || "rgba(255, 106, 42, 0.14)")};"
        >
          <button
            class="category-feature-card__main"
            type="button"
            data-category-code="${escapeHtml(config.code)}"
          >
            <span class="category-feature-card__header">
              <span class="category-feature-card__icon">
                <img src="${escapeHtml(meta.image || "ImagesVideos/LogoMotoZonaNew.png")}" alt="${escapeHtml(config.label || mainEntry.label)}" loading="lazy" />
              </span>
              <span class="category-feature-card__title">${escapeHtml(config.label || mainEntry.label)}</span>
            </span>
            <span class="category-feature-card__description">${escapeHtml(config.description)}</span>
          </button>

          <div class="category-feature-card__links">
            ${previewHtml}
            ${extraCount > 0 ? `<span class="category-feature-links__more">+${extraCount} още</span>` : ""}
          </div>
        </article>
      `;
    }).join("");
  }

  function getSmartCategoryScore(entry, normalizedQuery, queryTokens) {
    if (!entry || !normalizedQuery) return 0;

    const matchedTokenCount = queryTokens.filter(token => entry.searchText.includes(token)).length;
    if (matchedTokenCount !== queryTokens.length) {
      return 0;
    }

    let score = 0;

    if (entry.searchTerms.includes(normalizedQuery)) score += 140;
    if (entry.labelNormalized === normalizedQuery) score += 120;
    if (entry.pathNormalized === normalizedQuery) score += 96;
    if (entry.labelNormalized.startsWith(normalizedQuery)) score += 82;
    if (entry.searchText.includes(normalizedQuery)) score += 58;

    score += matchedTokenCount * 12;
    score += Math.max(0, 30 - entry.priority);

    return score;
  }

  function getSmartCategorySuggestions(query) {
    const normalizedQuery = normalizeSearchText(query);

    if (!normalizedQuery || normalizedQuery.length < 2) {
      return [];
    }

    const queryTokens = normalizedQuery.split(" ").filter(Boolean);
    let suggestions = state.smartCategory.index
      .map(entry => ({
        entry,
        score: getSmartCategoryScore(entry, normalizedQuery, queryTokens)
      }))
      .filter(item => item.score > 0)
      .sort((a, b) =>
        b.score - a.score ||
        a.entry.priority - b.entry.priority ||
        a.entry.label.localeCompare(b.entry.label, "bg")
      );

    const hasBroadMatch = queryTokens.length === 1 && suggestions.some(item =>
      item.entry.depth <= 1 &&
      (
        item.entry.labelNormalized === normalizedQuery ||
        item.entry.labelNormalized.startsWith(normalizedQuery) ||
        item.entry.searchTerms.includes(normalizedQuery)
      )
    );

    if (hasBroadMatch) {
      suggestions = suggestions.filter(item =>
        item.entry.depth <= 1 ||
        item.entry.labelNormalized === normalizedQuery ||
        item.entry.labelNormalized.startsWith(normalizedQuery)
      );
    }

    const visibleSuggestions = suggestions
      .slice(0, 8)
      .map(item => item.entry);

    if (visibleSuggestions.length) {
      return visibleSuggestions;
    }

    const routeSuggestion = getSmartCategoryRouteSuggestion(query);
    return routeSuggestion ? [routeSuggestion] : [];
  }

  function renderSmartCategorySuggestions() {
    if (!elements.smartCategorySuggestions) return;

    const suggestions = state.smartCategory.visibleSuggestions;
    const query = cleanText(elements.smartCategoryInput?.value);

    if (!query || normalizeSearchText(query).length < 2) {
      elements.smartCategorySuggestions.innerHTML = "";
      elements.smartCategorySuggestions.classList.add("hidden");
      return;
    }

    if (!suggestions.length) {
      elements.smartCategorySuggestions.innerHTML = `
        <div class="smart-category__empty">
          Няма точен тип. Избери най-близката категория и го допиши в детайлите отдолу.
        </div>
      `;
      elements.smartCategorySuggestions.classList.remove("hidden");
      return;
    }

    elements.smartCategorySuggestions.innerHTML = suggestions.map((entry, index) => `
      <button
        class="smart-category__option ${index === state.smartCategory.activeSuggestionIndex ? "is-active" : ""}"
        type="button"
        data-smart-key="${escapeHtml(entry.key)}"
        role="option"
        aria-selected="${index === state.smartCategory.activeSuggestionIndex ? "true" : "false"}"
      >
        <span class="smart-category__option-main">
          <span class="smart-category__option-title">${escapeHtml(entry.label)}</span>
          <span class="smart-category__option-meta">${escapeHtml(entry.pathLabel)}</span>
        </span>
        <span class="smart-category__option-tag">${escapeHtml(entry.tagLabel)}</span>
      </button>
    `).join("");

    elements.smartCategorySuggestions.classList.remove("hidden");
  }

  function closeSmartCategorySuggestions() {
    state.smartCategory.visibleSuggestions = [];
    state.smartCategory.activeSuggestionIndex = -1;

    if (elements.smartCategorySuggestions) {
      elements.smartCategorySuggestions.innerHTML = "";
      elements.smartCategorySuggestions.classList.add("hidden");
    }
  }

  function updateSmartCategorySuggestions(query) {
    state.smartCategory.visibleSuggestions = getSmartCategorySuggestions(query);
    state.smartCategory.activeSuggestionIndex = state.smartCategory.visibleSuggestions.length ? 0 : -1;
    renderSmartCategorySuggestions();
  }

  function moveSmartCategorySelection(direction) {
    if (!state.smartCategory.visibleSuggestions.length) {
      return;
    }

    const nextIndex = state.smartCategory.activeSuggestionIndex + direction;
    const lastIndex = state.smartCategory.visibleSuggestions.length - 1;

    if (nextIndex < 0) {
      state.smartCategory.activeSuggestionIndex = lastIndex;
    } else if (nextIndex > lastIndex) {
      state.smartCategory.activeSuggestionIndex = 0;
    } else {
      state.smartCategory.activeSuggestionIndex = nextIndex;
    }

    renderSmartCategorySuggestions();
  }

  function onSmartCategoryInputKeyDown(event) {
    if (event.key === "ArrowDown") {
      event.preventDefault();

      if (!state.smartCategory.visibleSuggestions.length) {
        updateSmartCategorySuggestions(elements.smartCategoryInput?.value || "");
      }

      moveSmartCategorySelection(1);
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      moveSmartCategorySelection(-1);
      return;
    }

    if (event.key === "Escape") {
      closeSmartCategorySuggestions();
      return;
    }

    if (event.key === "Enter" && state.smartCategory.visibleSuggestions.length) {
      event.preventDefault();

      const entry =
        state.smartCategory.visibleSuggestions[state.smartCategory.activeSuggestionIndex] ||
        state.smartCategory.visibleSuggestions[0];

      if (entry) {
        applySmartCategorySelection(entry);
      }
    }
  }

  function selectSmartCategoryByTerm(term) {
    if (!elements.smartCategoryInput) return;

    elements.smartCategoryInput.value = term;

    const suggestions = getSmartCategorySuggestions(term);
    if (!suggestions.length) {
      updateSmartCategorySuggestions(term);
      return;
    }

    applySmartCategorySelection(suggestions[0]);
  }

  function clearSmartCategoryFallbackNote() {
    state.smartCategory.lastFallbackNote = "";
  }

  function prefillSmartCategoryFallbackDetails(entry) {
    const fieldKey = cleanText(entry?.fallbackPrefillField);
    const rawQuery = cleanText(entry?.fallbackRawQuery || entry?.label);
    const input = fieldKey ? elements[fieldKey] : null;

    if (!input || !rawQuery) {
      return;
    }

    if (!cleanText(input.value)) {
      input.value = rawQuery;
    }
  }

  function applySmartCategorySelection(entry) {
    if (!entry || !elements.mainCategorySelect) return;

    clearSmartCategoryFallbackNote();
    setSelectValue(elements.mainCategorySelect, String(entry.mainCategoryId));
    toggleCategorySections();
    clearIrrelevantFields();

    if (entry.mainCategoryCode === "VEHICLE") {
      setSelectValue(elements.vehicleClassSelect, entry.subCategoryId ? String(entry.subCategoryId) : "");
      fillVehicleTypesByClass();

      if (entry.subCategory2Id) {
        setSelectValue(elements.vehicleTypeSelect, String(entry.subCategory2Id));
      }
    }

    if (entry.mainCategoryCode === "GEAR") {
      setSelectValue(elements.gearTypeSelect, entry.subCategoryId ? String(entry.subCategoryId) : "");
      toggleHelmetTypeField();

      if (entry.subCategory2Id) {
        setSelectValue(elements.gearHelmetTypeSelect, String(entry.subCategory2Id));
      }
    }

    if (entry.mainCategoryCode === "PART") {
      setSelectValue(elements.partTypeSelect, entry.subCategoryId ? String(entry.subCategoryId) : "");
    }

    if (entry.mainCategoryCode === "ACCESSORY") {
      setSelectValue(elements.accessoryTypeSelect, entry.subCategoryId ? String(entry.subCategoryId) : "");
    }

    if (elements.smartCategoryInput) {
      elements.smartCategoryInput.value = entry.label;
    }

    prefillSmartCategoryFallbackDetails(entry);
    state.smartCategory.lastFallbackNote = cleanText(entry.fallbackNote);

    syncSmartCategoryHint();
    closeSmartCategorySuggestions();
    renderCategoryOverview();
    updateListingPreview();
    updateCreateChargePreview();
  }

  function getCurrentCategoryPathParts() {
    const selectedCategory = getSelectedCategory();
    const mainCategoryText = selectedCategory
      ? resolveLookupLabel(selectedCategory, "nameBg")
      : "";

    if (!mainCategoryText) return [];

    const parts = [mainCategoryText];
    const categoryCode = getSelectedCategoryCode();

    if (categoryCode === "VEHICLE") {
      const vehicleClass = getSelectText(elements.vehicleClassSelect);
      const vehicleType = getSelectText(elements.vehicleTypeSelect);

      if (vehicleClass) parts.push(vehicleClass);
      if (vehicleType) parts.push(vehicleType);
    }

    if (categoryCode === "GEAR") {
      const gearType = getSelectText(elements.gearTypeSelect);
      const helmetType = getSelectText(elements.gearHelmetTypeSelect);

      if (gearType) parts.push(gearType);
      if (helmetType) parts.push(helmetType);
    }

    if (categoryCode === "PART") {
      const partType = getSelectText(elements.partTypeSelect);
      if (partType) parts.push(partType);
    }

    if (categoryCode === "ACCESSORY") {
      const accessoryType = getSelectText(elements.accessoryTypeSelect);
      if (accessoryType) parts.push(accessoryType);
    }

    return parts.filter(Boolean);
  }

  function syncSmartCategoryHint() {
    if (!elements.smartCategoryHint) return;

    const pathParts = getCurrentCategoryPathParts();
    const fallbackNote = cleanText(state.smartCategory.lastFallbackNote);

    if (!pathParts.length) {
      elements.smartCategoryHint.innerHTML = "";
      elements.smartCategoryHint.classList.add("hidden");
      return;
    }

    elements.smartCategoryHint.innerHTML = `
      <strong>Избрано:</strong> ${escapeHtml(pathParts.join(" > "))}
      ${fallbackNote ? `<span class="smart-category__hint-note">${escapeHtml(fallbackNote)}</span>` : ""}
    `;
    elements.smartCategoryHint.classList.remove("hidden");
  }

  function getSelectedCategory() {
    const categoryId = Number(elements.mainCategorySelect?.value || 0);
    if (!categoryId) return null;

    return state.lookups.mainCategories.find(x => Number(x.id) === categoryId) || null;
  }

  function getSelectedCategoryCode() {
    return (getSelectedCategory()?.code || "").toUpperCase();
  }

  function toggleCategorySections() {
    const code = getSelectedCategoryCode();

    elements.vehicleFields?.classList.toggle("hidden", code !== "VEHICLE");
    elements.gearFields?.classList.toggle("hidden", code !== "GEAR");
    elements.partFields?.classList.toggle("hidden", code !== "PART");
    elements.accessoryFields?.classList.toggle("hidden", code !== "ACCESSORY");

    if (code !== "GEAR") {
      elements.gearHelmetTypeWrap?.classList.add("hidden");
      if (elements.gearHelmetTypeSelect) {
        setSelectValue(elements.gearHelmetTypeSelect, "");
      }
    }
  }

  function clearIrrelevantFields() {
    const code = getSelectedCategoryCode();

    if (code !== "VEHICLE") {
      setSelectValue(elements.vehicleClassSelect, "");
      setSelectValue(elements.vehicleTypeSelect, "");
      setSelectValue(elements.vehicleBrandSelect, "");
      fillSelect(elements.vehicleTypeSelect, [], { placeholder: "Избери вид" });
      fillSelect(elements.vehicleModelSelect, [], { placeholder: "Избери модел", preferredLabelKey: "name" });
      setSelectValue(elements.vehicleLicenseCategorySelect, "");
      setSelectValue(elements.vehicleConditionSelect, "");
      elements.vehicleYearInput.value = "";
      elements.vehicleHorsePowerInput.value = "";
      elements.vehicleEngineCcInput.value = "";
      elements.vehicleMileageInput.value = "";
      elements.vehicleColorInput.value = "";
    }

    if (code !== "GEAR") {
      setSelectValue(elements.gearTypeSelect, "");
      setSelectValue(elements.gearHelmetTypeSelect, "");
      setSelectValue(elements.gearBrandSelect, "");
      setSelectValue(elements.gearConditionSelect, "");
      elements.gearYearInput.value = "";
      elements.gearColorInput.value = "";
      elements.gearItemModelTextInput.value = "";
    }

    if (code !== "PART") {
      setSelectValue(elements.partTypeSelect, "");
      setSelectValue(elements.partBrandSelect, "");
      setSelectValue(elements.partConditionSelect, "");
      elements.partItemModelTextInput.value = "";
    }

    if (code !== "ACCESSORY") {
      setSelectValue(elements.accessoryTypeSelect, "");
      setSelectValue(elements.accessoryBrandSelect, "");
      setSelectValue(elements.accessoryConditionSelect, "");
      elements.accessoryItemModelTextInput.value = "";
    }
  }

  function fillVehicleTypesByClass() {
    const vehicleClassId = Number(elements.vehicleClassSelect.value || 0);

    if (!vehicleClassId) {
      fillSelect(elements.vehicleTypeSelect, [], { placeholder: "Избери вид" });
      return;
    }

    const items = state.lookups.vehicleTypes.filter(x => Number(x.parentId || 0) === vehicleClassId);

    fillSelect(elements.vehicleTypeSelect, items, {
      placeholder: "Избери вид"
    });
  }

  async function maybeLoadVehicleModels() {
    const brandId = Number(elements.vehicleBrandSelect.value || 0);
    const vehicleClassId = Number(elements.vehicleClassSelect.value || 0);

    if (!brandId) {
      fillSelect(elements.vehicleModelSelect, [], {
        placeholder: "Избери модел",
        preferredLabelKey: "name"
      });
      return;
    }

    const params = new URLSearchParams();
    params.set("brandId", String(brandId));

    if (vehicleClassId) {
      params.set("vehicleClassLookupId", String(vehicleClassId));
    }

    try {
      const models = await getJson(`${API_BASE_URL}/api/lookups/models?${params.toString()}`);
      fillSelect(elements.vehicleModelSelect, models || [], {
        placeholder: "Избери модел",
        preferredLabelKey: "name"
      });
    } catch (error) {
      console.error(error);
      fillSelect(elements.vehicleModelSelect, [], {
        placeholder: "Избери модел",
        preferredLabelKey: "name"
      });
    }
  }

  function toggleHelmetTypeField() {
    const gearTypeId = Number(elements.gearTypeSelect.value || 0);
    const gearType = state.lookups.gearTypes.find(x => Number(x.id) === gearTypeId);
    const isHelmet = (gearType?.code || "").toUpperCase() === "HELMET";

    elements.gearHelmetTypeWrap?.classList.toggle("hidden", !isHelmet);

    if (!isHelmet) {
      setSelectValue(elements.gearHelmetTypeSelect, "");
      return;
    }

    const filteredHelmetTypes = state.lookups.helmetTypes.filter(x => {
      if (!x.parentId) return true;
      return Number(x.parentId) === gearTypeId;
    });

    fillSelect(elements.gearHelmetTypeSelect, filteredHelmetTypes, {
      placeholder: "Избери тип каска"
    });
  }

  async function handleCountryChange() {
    const countryId = Number(elements.countrySelect.value || 0);

    fillSelect(elements.regionSelect, [], { placeholder: "Избери област" });
    fillSelect(elements.citySelect, [], { placeholder: "Избери град" });

    const isBg = isSelectedCountryBulgaria();
    toggleLocationFields(isBg);

    if (!countryId || !isBg) {
      updateListingPreview();
      updateCreateChargePreview();
      return;
    }

    try {
      const regions = await getJson(`${API_BASE_URL}/api/lookups/regions/${countryId}`);
      fillSelect(elements.regionSelect, regions || [], {
        placeholder: "Избери област",
        preferredLabelKey: "nameBg"
      });
    } catch (error) {
      console.error(error);
      setStatus("Не успяхме да заредим областите.", "error");
    }

    updateListingPreview();
    updateCreateChargePreview();
  }

  async function handleRegionChange() {
    const regionId = Number(elements.regionSelect.value || 0);

    fillSelect(elements.citySelect, [], { placeholder: "Избери град" });

    if (!regionId || !isSelectedCountryBulgaria()) {
      updateListingPreview();
      updateCreateChargePreview();
      return;
    }

    try {
      const cities = await getJson(`${API_BASE_URL}/api/lookups/cities/${regionId}`);
      fillSelect(elements.citySelect, cities || [], {
        placeholder: "Избери град",
        preferredLabelKey: "nameBg"
      });
    } catch (error) {
      console.error(error);
      setStatus("Не успяхме да заредим градовете.", "error");
    }

    updateListingPreview();
    updateCreateChargePreview();
  }

  function isSelectedCountryBulgaria() {
    const countryId = Number(elements.countrySelect.value || 0);
    const country = state.lookups.countries.find(x => Number(x.id) === countryId);
    return (country?.countryCode || "").toUpperCase() === "BG";
  }

  function toggleLocationFields(showBgFields) {
    elements.regionWrap?.classList.toggle("hidden", !showBgFields);
    elements.cityWrap?.classList.toggle("hidden", !showBgFields);

    if (!showBgFields) {
      setSelectValue(elements.regionSelect, "");
      setSelectValue(elements.citySelect, "");
    }
  }

  function getAutoExchangeRateToEUR(currencyCode) {
    const normalizedCurrencyCode = (currencyCode || "EUR").toUpperCase();
    return AUTO_RATES_TO_EUR[normalizedCurrencyCode] ?? 1;
  }

  async function onPhotosSelected(event) {
    const files = [...(event?.target?.files || [])];
    if (!files.length) return;

    const user = await ensureAuthenticatedPage();
    if (!user) return;

    try {
      setStatus("Качваме снимките...", "info");

      const formData = new FormData();
      files.forEach(file => formData.append("files", file));

      const response = await authFetchCompat(`${API_BASE_URL}/api/listing-images/upload`, {
        method: "POST",
        body: formData
      });

      if (response.status === 401) {
        redirectToLoginSilently();
        return;
      }

      if (!response.ok) {
        throw new Error(await extractErrorMessage(response));
      }

      const responseData = await response.json();
      const uploadedItems = normalizeUploadResponse(responseData);

      if (!uploadedItems.length) {
        throw new Error("Сървърът не върна информация за качените снимки.");
      }

      for (const item of uploadedItems) {
        if (!item?.blobName) continue;

        const alreadyExists = state.uploadedPhotos.some(x => x.blobName === item.blobName);
        if (alreadyExists) continue;

        state.uploadedPhotos.push({
          fileName: item.fileName || item.originalFileName || "image",
          fileUrl: item.readUrl || item.fileUrl || item.url || "",
          blobName: item.blobName,
          sortOrder: state.uploadedPhotos.length,
          isMain: state.uploadedPhotos.length === 0
        });
      }

      if (!state.uploadedPhotos.length) {
        throw new Error("Не беше добавена нито една снимка.");
      }

      if (!state.uploadedPhotos.some(x => x.isMain)) {
        state.uploadedPhotos[0].isMain = true;
      }

      syncPhotoSortOrders();
      renderPhotoPreview();
      elements.photosInput.value = "";

      setStatus(
        uploadedItems.length === 1
          ? "Снимката е качена успешно."
          : `Качени са ${uploadedItems.length} снимки.`,
        "success"
      );
    } catch (error) {
      console.error(error);
      setStatus(error?.message || "Неуспешно качване на снимки.", "error");
      elements.photosInput.value = "";
      updateListingPreview();
    }
  }

  function normalizeUploadResponse(data) {
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.items)) return data.items;
    if (Array.isArray(data?.files)) return data.files;
    if (data && typeof data === "object" && data.blobName) return [data];
    return [];
  }

  function renderPhotoPreview() {
    if (!elements.photoPreviewGrid) return;

    if (!state.uploadedPhotos.length) {
      elements.photoPreviewGrid.innerHTML = `<div class="empty-photos">Все още няма качени снимки.</div>`;
      cancelPhotoDrag();
      updateListingPreview();
      return;
    }

    elements.photoPreviewGrid.innerHTML = state.uploadedPhotos.map((photo, index) => {
      const safeImg = photo.fileUrl
        ? `<img src="${escapeHtml(photo.fileUrl)}" alt="${escapeHtml(photo.fileName || "Снимка")}" />`
        : `<div class="photo-card__missing">Няма preview</div>`;

      return `
        <article class="photo-card ${photo.isMain ? "is-main" : ""}" data-photo-index="${index}">
          <div class="photo-card__image">
            ${safeImg}
            <div class="photo-card__overlay">
              <span class="photo-card__order-badge ${photo.isMain ? "is-main" : ""}">
                ${photo.isMain ? "Главна" : `#${index + 1}`}
              </span>

              <div class="photo-card__overlay-actions">
                <div
                  class="photo-card__drag-handle"
                  aria-hidden="true"
                >
                  ⇅
                </div>

                <button
                  type="button"
                  class="photo-card__remove-fab"
                  data-action="remove"
                  data-index="${index}"
                  aria-label="Махни снимката"
                  title="Махни снимката"
                >
                  ×
                </button>
              </div>
            </div>
          </div>
          <div class="photo-card__body">
            <div class="photo-card__body-row">
              <p class="photo-card__name">${escapeHtml(photo.fileName || "Снимка")}</p>
              <span class="photo-card__position-text">${photo.isMain ? "Корица" : `Позиция ${index + 1}`}</span>
            </div>
            <p class="photo-card__hint">Хвани картата и я плъзни, за да смениш реда. Първата е главна.</p>
          </div>
        </article>
      `;
    }).join("");

    [...elements.photoPreviewGrid.querySelectorAll(".photo-card[data-photo-index]")].forEach(card => {
      card.addEventListener("pointerdown", event => {
        if (event.target.closest("button[data-action='remove']")) {
          return;
        }

        const index = Number(card.dataset.photoIndex);
        startPhotoDrag(index, event);
      });
    });

    [...elements.photoPreviewGrid.querySelectorAll("button[data-action='remove']")].forEach(btn => {
      btn.addEventListener("click", async () => {
        const index = Number(btn.dataset.index);
        await removePhoto(index);
      });
    });

    syncPhotoDragVisualState();
    updateListingPreview();
  }

  function setMainPhoto(index) {
    moveUploadedPhoto(index, 0);
  }

  async function removePhoto(index) {
    const photo = state.uploadedPhotos[index];
    if (!photo) return;

    try {
      setStatus("Изтриваме снимката...", "info");

      if (photo.blobName) {
        const response = await authFetchCompat(
          `${API_BASE_URL}/api/listing-images?blobName=${encodeURIComponent(photo.blobName)}`,
          { method: "DELETE" }
        );

        if (response.status === 401) {
          redirectToLoginSilently();
          return;
        }

        if (!response.ok) {
          throw new Error(await extractErrorMessage(response));
        }
      }

      state.uploadedPhotos.splice(index, 1);

      syncPhotoSortOrders();
      renderPhotoPreview();
      setStatus("Снимката е махната.", "success");
    } catch (error) {
      console.error(error);
      setStatus(error?.message || "Неуспешно изтриване на снимка.", "error");
      updateListingPreview();
    }
  }

  function syncPhotoSortOrders() {
    state.uploadedPhotos = state.uploadedPhotos.map((photo, index) => ({
      ...photo,
      sortOrder: index,
      isMain: index === 0
    }));
  }

  function startPhotoDrag(index, event) {
    if (!Number.isInteger(index) || !state.uploadedPhotos[index]) {
      return;
    }

    if (event.pointerType === "mouse" && event.button !== 0) {
      return;
    }

    state.photoDrag.activeIndex = index;
    state.photoDrag.overIndex = index;
    state.photoDrag.pointerId = event.pointerId;

    event.preventDefault();
    syncPhotoDragVisualState();
  }

  function onPhotoDragMove(event) {
    if (state.photoDrag.activeIndex < 0) {
      return;
    }

    if (state.photoDrag.pointerId !== null && event.pointerId !== state.photoDrag.pointerId) {
      return;
    }

    event.preventDefault();

    const targetCard = document
      .elementFromPoint(event.clientX, event.clientY)
      ?.closest(".photo-card[data-photo-index]");

    if (!targetCard) {
      updatePhotoDragTarget(-1);
      return;
    }

    updatePhotoDragTarget(Number(targetCard.dataset.photoIndex));
  }

  function onPhotoDragEnd(event) {
    if (state.photoDrag.activeIndex < 0) {
      return;
    }

    if (state.photoDrag.pointerId !== null && event.pointerId !== state.photoDrag.pointerId) {
      return;
    }

    const fromIndex = state.photoDrag.activeIndex;
    const toIndex = state.photoDrag.overIndex;

    cancelPhotoDrag();

    if (!Number.isInteger(fromIndex) || !Number.isInteger(toIndex) || fromIndex === toIndex || toIndex < 0) {
      return;
    }

    moveUploadedPhoto(fromIndex, toIndex);
  }

  function cancelPhotoDrag() {
    if (
      state.photoDrag.activeIndex === -1 &&
      state.photoDrag.overIndex === -1 &&
      state.photoDrag.pointerId === null
    ) {
      return;
    }

    state.photoDrag.activeIndex = -1;
    state.photoDrag.overIndex = -1;
    state.photoDrag.pointerId = null;
    syncPhotoDragVisualState();
  }

  function updatePhotoDragTarget(targetIndex) {
    const normalizedIndex = Number.isInteger(targetIndex) ? targetIndex : -1;

    if (state.photoDrag.overIndex === normalizedIndex) {
      return;
    }

    state.photoDrag.overIndex = normalizedIndex;
    syncPhotoDragVisualState();
  }

  function syncPhotoDragVisualState() {
    if (!elements.photoPreviewGrid) {
      return;
    }

    const isDragging = state.photoDrag.activeIndex >= 0;
    const activeIndex = state.photoDrag.activeIndex;
    const overIndex = state.photoDrag.overIndex;
    const movingForward = isDragging && overIndex > activeIndex;
    const movingBackward = isDragging && overIndex >= 0 && overIndex < activeIndex;

    elements.photoPreviewGrid.classList.toggle("is-photo-dragging", isDragging);

    [...elements.photoPreviewGrid.querySelectorAll(".photo-card[data-photo-index]")].forEach(card => {
      const cardIndex = Number(card.dataset.photoIndex);
      const isDragSource = isDragging && cardIndex === activeIndex;
      const isDropTarget =
        isDragging &&
        cardIndex === overIndex &&
        overIndex !== activeIndex;
      const isShiftedBackward =
        movingForward &&
        cardIndex > activeIndex &&
        cardIndex <= overIndex;
      const isShiftedForward =
        movingBackward &&
        cardIndex >= overIndex &&
        cardIndex < activeIndex;

      card.classList.toggle("is-drag-source", isDragSource);
      card.classList.toggle(
        "is-drop-target",
        isDropTarget
      );
      card.classList.toggle("is-shifted-forward", isShiftedForward);
      card.classList.toggle("is-shifted-backward", isShiftedBackward);
      card.style.setProperty("--photo-shift-delay", `${Math.min(Math.abs(cardIndex - activeIndex), 5) * 26}ms`);
    });
  }

  function moveUploadedPhoto(fromIndex, toIndex) {
    if (
      !Number.isInteger(fromIndex) ||
      !Number.isInteger(toIndex) ||
      fromIndex < 0 ||
      toIndex < 0 ||
      fromIndex >= state.uploadedPhotos.length ||
      toIndex >= state.uploadedPhotos.length ||
      fromIndex === toIndex
    ) {
      return;
    }

    const reorderedPhotos = [...state.uploadedPhotos];
    const [movedPhoto] = reorderedPhotos.splice(fromIndex, 1);
    reorderedPhotos.splice(toIndex, 0, movedPhoto);

    state.uploadedPhotos = reorderedPhotos;
    syncPhotoSortOrders();
    renderPhotoPreview();
    updateListingPreview();
  }

  async function loadBillingContext() {
    try {
      const dashboard = await getJson(`${API_BASE_URL}/api/profile/dashboard`);
      const accountType = normalizeAccountType(
        dashboard?.accountType || state.currentUser?.accountType
      );
      const pricing = getPricingByAccountType(accountType);

      state.billing.accountType = accountType;
      state.billing.freeUploadsRemainingNow = Math.max(0, Number(dashboard?.freeUploadsRemainingNow || 0));
      state.billing.overLimitPublishPriceEUR = pricing.publishOverLimitEUR;
      state.billing.refreshPriceEUR = pricing.refreshEUR;
      state.billing.dashboardLoaded = true;

      renderCreatePricingInfo();
      updateCreateChargePreview();
    } catch (error) {
      console.warn("Не успяхме да заредим billing context.", error);

      const accountType = normalizeAccountType(state.currentUser?.accountType);
      const pricing = getPricingByAccountType(accountType);

      state.billing.accountType = accountType;
      state.billing.freeUploadsRemainingNow = 0;
      state.billing.overLimitPublishPriceEUR = pricing.publishOverLimitEUR;
      state.billing.refreshPriceEUR = pricing.refreshEUR;
      state.billing.dashboardLoaded = false;

      renderCreatePricingInfo();
      updateCreateChargePreview();
    }
  }

  function normalizeAccountType(value) {
    const normalized = String(value || "").trim().toUpperCase();
    if (normalized === "PRIVATE") return "PRIVATE";
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

  function formatMoney(value, currency = "EUR") {
    const numeric = Number(value || 0);
    return `${numeric.toFixed(2)} ${currency}`;
  }

  function getPromotionOptionText(promotionTypeRaw) {
    const promotionType = cleanText(promotionTypeRaw || "NORMAL").toUpperCase();

    if (promotionType === "TOP") {
      return "TOP • очаквайте скоро";
    }

    if (promotionType === "VIP") {
      return "VIP • очаквайте скоро";
    }

    return "Нормална • стандартна видимост";
  }

  function getPromotionHintText(promotionTypeRaw) {
    const breakdown = getCreateChargeBreakdown();
    const promotionType = cleanText(promotionTypeRaw || breakdown.promotionType || "NORMAL").toUpperCase();

    if (promotionType === "TOP") {
      return breakdown.publishChargeEUR > 0
        ? `TOP струва ${formatMoney(PRICING.TOP_PRICE_EUR, "EUR")} за ${PRICING.TOP_DAYS} дни, качва обявата по-напред и я отличава. Общо за това качване: ${formatMoney(breakdown.totalEUR, "EUR")} с включена такса за качване ${formatMoney(breakdown.publishChargeEUR, "EUR")}.`
        : `TOP струва ${formatMoney(PRICING.TOP_PRICE_EUR, "EUR")} за ${PRICING.TOP_DAYS} дни, качва обявата по-напред и я отличава. Общо за това качване: ${formatMoney(breakdown.totalEUR, "EUR")}.`;
    }

    if (promotionType === "VIP") {
      return breakdown.publishChargeEUR > 0
        ? `VIP струва ${formatMoney(PRICING.VIP_PRICE_EUR, "EUR")} за ${PRICING.VIP_DAYS} дни и дава най-силна видимост с приоритетно позициониране. Общо за това качване: ${formatMoney(breakdown.totalEUR, "EUR")} с включена такса за качване ${formatMoney(breakdown.publishChargeEUR, "EUR")}.`
        : `VIP струва ${formatMoney(PRICING.VIP_PRICE_EUR, "EUR")} за ${PRICING.VIP_DAYS} дни и дава най-силна видимост с приоритетно позициониране. Общо за това качване: ${formatMoney(breakdown.totalEUR, "EUR")}.`;
    }

    return breakdown.publishChargeEUR > 0
      ? `Без допълнителна промоция. Обявата е със стандартна видимост. Таксата за качване се смята отделно, защото си над free лимита.`
      : `Без допълнителна промоция. Обявата е със стандартна видимост.`;
  }

  function updatePromotionTypeCopy() {
    const promotionSelect = elements.promotionTypeSelect;
    if (!promotionSelect) return;

    const options = Array.from(promotionSelect.options || []);
    options.forEach(option => {
      option.textContent = getPromotionOptionText(option.value);
    });

    if (elements.promotionTypeHint) {
      elements.promotionTypeHint.textContent = getPromotionHintText(promotionSelect.value);
    }
  }

  function renderCreatePricingInfo() {
    const accountType = normalizeAccountType(state.billing.accountType || "PRIVATE");

    if (elements.pricingSummaryText) {
      elements.pricingSummaryText.textContent = "Сайтът е в безплатен режим — качвайте обяви без лимити и такси.";
    }

    if (elements.billingAccountType) {
      elements.billingAccountType.textContent = getAccountTypeLabel(accountType);
    }

    if (elements.billingFreeRemaining) {
      elements.billingFreeRemaining.textContent = "∞";
    }

    if (elements.billingOverLimitPrice) {
      elements.billingOverLimitPrice.textContent = "Безплатно";
    }

    if (elements.billingRefreshPrice) {
      elements.billingRefreshPrice.textContent = "Безплатно";
    }

    if (elements.normalPlanPriceText) {
      elements.normalPlanPriceText.textContent = "0.00 EUR";
    }

    if (elements.normalPlanText) {
      elements.normalPlanText.textContent = "Нормална обява. В момента качването е напълно безплатно.";
    }

    if (elements.topPlanPriceText) {
      elements.topPlanPriceText.textContent = "Очаквайте скоро";
    }

    if (elements.topPlanText) {
      elements.topPlanText.textContent = "TOP функцията е временно недостъпна.";
    }

    if (elements.vipPlanPriceText) {
      elements.vipPlanPriceText.textContent = "Очаквайте скоро";
    }

    if (elements.vipPlanText) {
      elements.vipPlanText.textContent = "VIP функцията е временно недостъпна.";
    }

    updatePromotionTypeCopy();
  }

  function updateSelectedPlanSummary() {
    if (!elements.selectedPlanCard) return;

    const breakdown = getCreateChargeBreakdown();
    const freeRemaining = Number(state.billing.freeUploadsRemainingNow || 0);

    let cardClass = "selected-plan-card--normal";
    let priceText = "0.00 EUR";
    let hintText = "";

    if (breakdown.promotionType === "TOP") {
      cardClass = "selected-plan-card--top";
      priceText = `${formatMoney(PRICING.TOP_PRICE_EUR, "EUR")} / ${PRICING.TOP_DAYS} дни`;
      hintText =
        breakdown.publishChargeEUR > 0
          ? `TOP дава по-силна видимост за ${PRICING.TOP_DAYS} дни. Към него се добавя и такса за качване ${formatMoney(breakdown.publishChargeEUR, "EUR")}.`
          : `TOP дава по-силна видимост за ${PRICING.TOP_DAYS} дни. В момента плащаш само самото ниво.`;
    } else if (breakdown.promotionType === "VIP") {
      cardClass = "selected-plan-card--vip";
      priceText = `${formatMoney(PRICING.VIP_PRICE_EUR, "EUR")} / ${PRICING.VIP_DAYS} дни`;
      hintText =
        breakdown.publishChargeEUR > 0
          ? `VIP дава най-силна видимост за ${PRICING.VIP_DAYS} дни. Към него се добавя и такса за качване ${formatMoney(breakdown.publishChargeEUR, "EUR")}.`
          : `VIP дава най-силна видимост за ${PRICING.VIP_DAYS} дни. В момента плащаш само самото ниво.`;
    } else {
      priceText = "0.00 EUR";
      hintText = "Нормална обява. В момента качването е напълно безплатно.";
    }

    elements.selectedPlanCard.classList.remove(
      "selected-plan-card--normal",
      "selected-plan-card--top",
      "selected-plan-card--vip"
    );
    elements.selectedPlanCard.classList.add(cardClass);

    if (elements.selectedPlanName) {
      elements.selectedPlanName.textContent = breakdown.promotionType;
    }

    if (elements.selectedPlanPrice) {
      elements.selectedPlanPrice.textContent = priceText;
    }

    if (elements.selectedPlanHint) {
      elements.selectedPlanHint.textContent = hintText;
    }
  }

  function getCreateChargeBreakdown() {
    const promotionType = cleanText(elements.promotionTypeSelect?.value || "NORMAL").toUpperCase();
    const publishChargeEUR = 0;

    let promotionChargeEUR = 0;
    let promotionDescription = "Нормална обява без допълнителна промоция.";

    if (promotionType === "TOP") {
      promotionChargeEUR = PRICING.TOP_PRICE_EUR;
      promotionDescription = `TOP за ${PRICING.TOP_DAYS} дни.`;
    }

    if (promotionType === "VIP") {
      promotionChargeEUR = PRICING.VIP_PRICE_EUR;
      promotionDescription = `VIP за ${PRICING.VIP_DAYS} дни.`;
    }

    const totalEUR = Number((publishChargeEUR + promotionChargeEUR).toFixed(2));

    const publishExplanation = "Сайтът е в безплатен режим — качването е безплатно.";
    const totalExplanation = "Сайтът е в безплатен режим — няма такси за качване.";

    return {
      promotionType,
      publishChargeEUR,
      promotionChargeEUR,
      totalEUR,
      promotionDescription,
      publishExplanation,
      totalExplanation
    };
  }

  function updateCreateChargePreview() {
    const breakdown = getCreateChargeBreakdown();

    if (elements.duePublishFee) {
      elements.duePublishFee.textContent = formatMoney(breakdown.publishChargeEUR, "EUR");
    }

    if (elements.duePromotionFee) {
      elements.duePromotionFee.textContent = formatMoney(breakdown.promotionChargeEUR, "EUR");
    }

    if (elements.dueTotalEUR) {
      elements.dueTotalEUR.textContent = formatMoney(breakdown.totalEUR, "EUR");
    }

    if (elements.dueBreakdownText) {
      elements.dueBreakdownText.textContent =
        `${breakdown.totalExplanation} ${breakdown.promotionDescription}`;
    }

    updatePromotionTypeCopy();
    updateSelectedPlanSummary();

    if (elements.submitBtn && !state.isSubmitting) {
      elements.submitBtn.textContent =
        breakdown.totalEUR > 0
          ? `Публикувай обявата • ${formatMoney(breakdown.totalEUR, "EUR")}`
          : "Публикувай обявата";
    }
  }

  function buildCreateChargeConfirmMessage() {
    return [
      "Потвърждение за публикуване:",
      "- Такса за качване: 0.00 EUR (безплатен режим)",
      "- Такса за ниво: 0.00 EUR",
      "- Общо дължимо: 0.00 EUR",
      "",
      "Сайтът е в безплатен режим — никакви такси.",
      "",
      "Продължаваш ли?"
    ].join("\n");
  }

  async function onSubmit(event) {
    event.preventDefault();

    const user = await ensureAuthenticatedPage();
    if (!user) return;

    try {
      setSubmitBusy(true);
      setStatus("Публикуваме обявата...", "info");

      const payload = buildPayload();
      validateClientPayload(payload);

      const breakdown = getCreateChargeBreakdown();

      if (breakdown.totalEUR > 0) {
        const confirmed = window.confirm(buildCreateChargeConfirmMessage());
        if (!confirmed) {
          setStatus("", "");
          return;
        }
      }

      const response = await authFetchCompat(`${API_BASE_URL}/api/listings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      if (response.status === 401) {
        redirectToLoginSilently();
        return;
      }

      if (!response.ok) {
        throw new Error(await extractErrorMessage(response));
      }

      const result = await response.json();

      if (result?.requiresPayment) {
        setStatus(result.message || "Създадена е чакаща операция за плащане.", "success");
        return;
      }

      setStatus(result?.message || "Обявата е публикувана успешно.", "success");

      if (result?.listingId) {
        window.location.href = window.Auth?.buildListingUrl?.(result.listingId)
          || `ListingDetails.html?id=${encodeURIComponent(result.listingId)}`;
        return;
      }

      await resetForm({ skipRemoteDelete: true });
    } catch (error) {
      console.error(error);
      setStatus(error?.message || "Не успяхме да публикуваме обявата.", "error");
    } finally {
      setSubmitBusy(false);
    }
  }

  function buildPayload() {
    const category = getSelectedCategory();
    const categoryCode = (category?.code || "").toUpperCase();

    const payload = {
      mainCategoryLookupId: toNumberOrNull(elements.mainCategorySelect.value),
      subCategoryLookupId: null,
      subCategory2LookupId: null,
      brandId: null,
      modelId: null,
      itemModelText: null,
      licenseCategoryLookupId: null,
      conditionLookupId: null,
      title: cleanText(elements.titleInput.value),
      description: cleanNullableText(elements.descriptionInput.value),
      vehicleYear: null,
      horsePower: null,
      engineCC: null,
      mileage: null,
      color: null,
      priceOriginal: toDecimalOrNull(elements.priceOriginalInput.value),
      currencyCode: cleanText(elements.currencyCodeSelect.value).toUpperCase(),
      exchangeRateToEUR: getAutoExchangeRateToEUR(elements.currencyCodeSelect.value),
      countryId: toNumberOrNull(elements.countrySelect.value),
      regionId: null,
      cityId: null,
      contactName: cleanNullableText(elements.contactNameInput.value),
      contactPhone: cleanText(elements.contactPhoneInput.value),
      requestedPromotionType: cleanText(elements.promotionTypeSelect.value || "NORMAL").toUpperCase(),
      photos: state.uploadedPhotos.map(photo => ({
        fileName: photo.fileName,
        fileUrl: photo.fileUrl || null,
        blobName: photo.blobName,
        sortOrder: photo.sortOrder,
        isMain: photo.isMain
      }))
    };

    if (isSelectedCountryBulgaria()) {
      payload.regionId = toNumberOrNull(elements.regionSelect.value);
      payload.cityId = toNumberOrNull(elements.citySelect.value);
    }

    if (categoryCode === "VEHICLE") {
      payload.subCategoryLookupId = toNumberOrNull(elements.vehicleClassSelect.value);
      payload.subCategory2LookupId = toNumberOrNull(elements.vehicleTypeSelect.value);
      payload.brandId = toNumberOrNull(elements.vehicleBrandSelect.value);
      payload.modelId = toNumberOrNull(elements.vehicleModelSelect.value);
      payload.licenseCategoryLookupId = toNumberOrNull(elements.vehicleLicenseCategorySelect.value);
      payload.conditionLookupId = toNumberOrNull(elements.vehicleConditionSelect.value);
      payload.vehicleYear = toShortOrNull(elements.vehicleYearInput.value);
      payload.horsePower = toNumberOrNull(elements.vehicleHorsePowerInput.value);
      payload.engineCC = toNumberOrNull(elements.vehicleEngineCcInput.value);
      payload.mileage = toNumberOrNull(elements.vehicleMileageInput.value);
      payload.color = cleanNullableText(elements.vehicleColorInput.value);
    }

    if (categoryCode === "GEAR") {
      payload.subCategoryLookupId = toNumberOrNull(elements.gearTypeSelect.value);
      payload.subCategory2LookupId = toNumberOrNull(elements.gearHelmetTypeSelect.value);
      payload.brandId = toNumberOrNull(elements.gearBrandSelect.value);
      payload.conditionLookupId = toNumberOrNull(elements.gearConditionSelect.value);
      payload.vehicleYear = toShortOrNull(elements.gearYearInput.value);
      payload.itemModelText = cleanNullableText(elements.gearItemModelTextInput.value);
      payload.color = cleanNullableText(elements.gearColorInput.value);
    }

    if (categoryCode === "PART") {
      payload.subCategoryLookupId = toNumberOrNull(elements.partTypeSelect.value);
      payload.brandId = toNumberOrNull(elements.partBrandSelect.value);
      payload.conditionLookupId = toNumberOrNull(elements.partConditionSelect.value);
      payload.itemModelText = cleanNullableText(elements.partItemModelTextInput.value);
    }

    if (categoryCode === "ACCESSORY") {
      payload.subCategoryLookupId = toNumberOrNull(elements.accessoryTypeSelect.value);
      payload.brandId = toNumberOrNull(elements.accessoryBrandSelect.value);
      payload.conditionLookupId = toNumberOrNull(elements.accessoryConditionSelect.value);
      payload.itemModelText = cleanNullableText(elements.accessoryItemModelTextInput.value);
    }

    return payload;
  }

  function validateClientPayload(payload) {
    if (!payload.mainCategoryLookupId) {
      throw new Error("Избери категория.");
    }

    if (!payload.title || payload.title.length < 3) {
      throw new Error("Заглавието трябва да е поне 3 символа.");
    }

    if (payload.priceOriginal === null || payload.priceOriginal < 0) {
      throw new Error("Въведи валидна цена.");
    }

    if (!payload.currencyCode || payload.currencyCode.length !== 3) {
      throw new Error("Въведи валидна валута.");
    }

    if (payload.exchangeRateToEUR === null || payload.exchangeRateToEUR <= 0) {
      throw new Error("Въведи валиден курс към EUR.");
    }

    if (!payload.countryId) {
      throw new Error("Избери държава.");
    }

    if (isSelectedCountryBulgaria()) {
      if (!payload.regionId) {
        throw new Error("За България областта е задължителна.");
      }

      if (!payload.cityId) {
        throw new Error("За България градът е задължителен.");
      }
    }

    if (!payload.contactPhone || payload.contactPhone.length < 5) {
      throw new Error("Телефонът е задължителен.");
    }

    if (!Array.isArray(payload.photos) || payload.photos.length === 0) {
      throw new Error("Качи поне една снимка.");
    }

    if (payload.photos.filter(x => x.isMain).length !== 1) {
      throw new Error("Трябва да има точно една главна снимка.");
    }

    if (payload.photos.some(x => !x.blobName)) {
      throw new Error("Има снимка без blobName. Качи я наново.");
    }

    const duplicateBlobNames = payload.photos
      .map(x => x.blobName)
      .filter(Boolean)
      .filter((value, index, arr) => arr.indexOf(value) !== index);

    if (duplicateBlobNames.length > 0) {
      throw new Error("Има дублирани снимки в заявката.");
    }

    const categoryCode = getSelectedCategoryCode();

    if (categoryCode === "VEHICLE") {
      if (!payload.subCategoryLookupId) {
        throw new Error("При мотор класът е задължителен.");
      }

      if (!payload.brandId) {
        throw new Error("При мотор марката е задължителна.");
      }
    }

    if (categoryCode === "GEAR") {
      if (!payload.subCategoryLookupId) {
        throw new Error("При екипировка типът е задължителен.");
      }

      if (!payload.brandId) {
        throw new Error("При екипировка марката е задължителна.");
      }
    }

    if (categoryCode === "PART") {
      if (!payload.subCategoryLookupId) {
        throw new Error("При част типът е задължителен.");
      }
    }

    if (categoryCode === "ACCESSORY") {
      if (!payload.subCategoryLookupId) {
        throw new Error("При аксесоар типът е задължителен.");
      }
    }
  }

  async function resetForm(options = {}) {
    const { skipRemoteDelete = false } = options;

    if (!skipRemoteDelete && state.uploadedPhotos.length > 0) {
      const confirmed = confirm("Ще изчистиш формата и ще изтриеш вече качените снимки. Продължаваш ли?");
      if (!confirmed) return;

      await deleteAllUploadedPhotos();
    }

    elements.createListingForm?.reset();
    state.uploadedPhotos = [];
    state.isSubmitting = false;
    syncAllSearchableSelects();

    if (elements.smartCategoryInput) {
      elements.smartCategoryInput.value = "";
    }

    clearSmartCategoryFallbackNote();
    toggleCategorySections();
    toggleHelmetTypeField();
    toggleLocationFields(false);
    closeSmartCategorySuggestions();

    fillSelect(elements.vehicleTypeSelect, [], { placeholder: "Избери вид" });
    fillSelect(elements.vehicleModelSelect, [], { placeholder: "Избери модел", preferredLabelKey: "name" });
    fillSelect(elements.regionSelect, [], { placeholder: "Избери област" });
    fillSelect(elements.citySelect, [], { placeholder: "Избери град" });

    prefillUserContactData(state.currentUser);
    await prefillUserCountry(state.currentUser || {});

    renderPhotoPreview();
    renderCategoryOverview();
    syncSmartCategoryHint();
    updateListingPreview();
    updateCreateChargePreview();
    setStatus("", "");
  }

  async function deleteAllUploadedPhotos() {
    const photos = [...state.uploadedPhotos];

    for (const photo of photos) {
      if (!photo?.blobName) continue;

      try {
        await authFetchCompat(
          `${API_BASE_URL}/api/listing-images?blobName=${encodeURIComponent(photo.blobName)}`,
          { method: "DELETE" }
        );
      } catch (error) {
        console.warn("Неуспешно изтриване на временно качена снимка:", photo.blobName, error);
      }
    }
  }

  function setSubmitBusy(isBusy) {
    state.isSubmitting = isBusy;

    if (elements.submitBtn) {
      elements.submitBtn.disabled = isBusy;
      if (isBusy) {
        elements.submitBtn.textContent = "Публикуваме...";
      } else {
        updateCreateChargePreview();
      }
    }

    if (elements.resetFormBtn) {
      elements.resetFormBtn.disabled = isBusy;
    }

    if (elements.photosInput) {
      elements.photosInput.disabled = isBusy;
    }
  }

  function setStatus(message, type) {
    if (!elements.statusMessage) return;

    elements.statusMessage.className = "status-message";

    if (!message) {
      elements.statusMessage.textContent = "";
      elements.statusMessage.classList.add("hidden");
      return;
    }

    elements.statusMessage.textContent = message;
    elements.statusMessage.classList.remove("hidden");

    if (type === "success") elements.statusMessage.classList.add("status-message--success");
    if (type === "error") elements.statusMessage.classList.add("status-message--error");
    if (type === "info") elements.statusMessage.classList.add("status-message--info");
  }

  async function getJson(url) {
    const response = await fetch(url, {
      method: "GET",
      headers: buildOptionalAuthHeaders()
    });

    if (!response.ok) {
      throw new Error(await extractErrorMessage(response));
    }

    return response.json();
  }

  function buildOptionalAuthHeaders() {
    const headers = {};
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

  async function authFetchCompat(url, options = {}) {
    if (window.Auth?.authFetch) {
      return window.Auth.authFetch(url, options);
    }

    const headers = new Headers(options.headers || {});
    const token = getAccessTokenCompat();

    if (token && !headers.has("Authorization")) {
      headers.set("Authorization", `Bearer ${token}`);
    }

    return fetch(url, {
      ...options,
      headers
    });
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

  function getSelectText(select) {
    if (!select) return "";
    const option = select.options?.[select.selectedIndex];
    return option?.text?.trim() || "";
  }

  function getPreviewMainPhoto() {
    const mainPhoto = state.uploadedPhotos.find(x => x.isMain);
    return mainPhoto || state.uploadedPhotos[0] || null;
  }

  function formatPreviewPrice() {
    const amount = toDecimalOrNull(elements.priceOriginalInput?.value);
    const currency = cleanText(elements.currencyCodeSelect?.value || "EUR").toUpperCase() || "EUR";

    if (amount === null) {
      return `0.00 ${currency}`;
    }

    return `${Number(amount).toFixed(2)} ${currency}`;
  }

  function getPreviewLocationText() {
    const cityText = getSelectText(elements.citySelect);
    const regionText = getSelectText(elements.regionSelect);
    const countryText = getSelectText(elements.countrySelect);

    if (cityText) return cityText;
    if (regionText) return regionText;
    if (countryText) return countryText;

    return "Локацията ще се покаже тук";
  }

  function getPreviewTitle() {
    return cleanText(elements.titleInput?.value) || "Заглавието ще се покаже тук";
  }

  function getConditionTextByCurrentCategory() {
    const categoryCode = getSelectedCategoryCode();

    if (categoryCode === "VEHICLE") return getSelectText(elements.vehicleConditionSelect);
    if (categoryCode === "GEAR") return getSelectText(elements.gearConditionSelect);
    if (categoryCode === "PART") return getSelectText(elements.partConditionSelect);
    if (categoryCode === "ACCESSORY") return getSelectText(elements.accessoryConditionSelect);

    return "";
  }

  function buildPreviewMetaItems() {
    const categoryCode = getSelectedCategoryCode();
    const items = [];

    if (categoryCode === "VEHICLE") {
      const year = cleanText(elements.vehicleYearInput?.value);
      const cc = cleanText(elements.vehicleEngineCcInput?.value);
      const hp = cleanText(elements.vehicleHorsePowerInput?.value);
      const license = getSelectText(elements.vehicleLicenseCategorySelect);
      const vehicleType = getSelectText(elements.vehicleTypeSelect);
      const vehicleClass = getSelectText(elements.vehicleClassSelect);

      if (year) items.push({ text: year, isLicense: false });
      if (cc) items.push({ text: `${cc} cc`, isLicense: false });
      if (hp) items.push({ text: `${hp} к.с.`, isLicense: false });
      if (license) items.push({ text: license, isLicense: true });

      if (!items.length && vehicleType) items.push({ text: vehicleType, isLicense: false });
      if (items.length < 4 && vehicleClass) items.push({ text: vehicleClass, isLicense: false });
    }

    if (categoryCode === "GEAR") {
      const gearType = getSelectText(elements.gearTypeSelect);
      const helmetType = getSelectText(elements.gearHelmetTypeSelect);
      const brand = getSelectText(elements.gearBrandSelect);
      const year = cleanText(elements.gearYearInput?.value);
      const condition = getSelectText(elements.gearConditionSelect);

      if (gearType) items.push({ text: gearType, isLicense: false });
      if (helmetType) items.push({ text: helmetType, isLicense: false });
      if (brand) items.push({ text: brand, isLicense: false });
      if (year) items.push({ text: year, isLicense: false });
      if (items.length < 4 && condition) items.push({ text: condition, isLicense: false });
    }

    if (categoryCode === "PART") {
      const type = getSelectText(elements.partTypeSelect);
      const brand = getSelectText(elements.partBrandSelect);
      const condition = getSelectText(elements.partConditionSelect);
      const details = cleanText(elements.partItemModelTextInput?.value);

      if (type) items.push({ text: type, isLicense: false });
      if (brand) items.push({ text: brand, isLicense: false });
      if (condition) items.push({ text: condition, isLicense: false });
      if (details) items.push({ text: truncateText(details, 24), isLicense: false });
    }

    if (categoryCode === "ACCESSORY") {
      const type = getSelectText(elements.accessoryTypeSelect);
      const brand = getSelectText(elements.accessoryBrandSelect);
      const condition = getSelectText(elements.accessoryConditionSelect);
      const details = cleanText(elements.accessoryItemModelTextInput?.value);

      if (type) items.push({ text: type, isLicense: false });
      if (brand) items.push({ text: brand, isLicense: false });
      if (condition) items.push({ text: condition, isLicense: false });
      if (details) items.push({ text: truncateText(details, 24), isLicense: false });
    }

    if (!items.length) {
      const fallbackCondition = getConditionTextByCurrentCategory();
      if (fallbackCondition) items.push({ text: fallbackCondition, isLicense: false });
    }

    return items.slice(0, 4);
  }

  function updateListingPreview() {
    if (!elements.listingPreviewCard) return;

    const title = getPreviewTitle();
    const price = formatPreviewPrice();
    const location = getPreviewLocationText();
    const mainPhoto = getPreviewMainPhoto();
    const promotion = cleanText(elements.promotionTypeSelect?.value || "NORMAL").toUpperCase();
    const metaItems = buildPreviewMetaItems();

    if (elements.listingPreviewTitle) {
      elements.listingPreviewTitle.textContent = title;
    }

    if (elements.listingPreviewPrice) {
      elements.listingPreviewPrice.textContent = price;
    }

    if (elements.listingPreviewLocation) {
      elements.listingPreviewLocation.textContent = location;
    }

    updateListingPreviewImage(mainPhoto);
    updateListingPreviewRibbon(promotion);
    updateListingPreviewCardTheme(promotion);
    updateListingPreviewMeta(metaItems);
  }

  function updateListingPreviewImage(mainPhoto) {
    if (!elements.listingPreviewImage || !elements.listingPreviewPlaceholder) return;

    if (mainPhoto?.fileUrl) {
      elements.listingPreviewImage.src = mainPhoto.fileUrl;
      elements.listingPreviewImage.classList.remove("hidden");
      elements.listingPreviewPlaceholder.classList.add("hidden");
      return;
    }

    elements.listingPreviewImage.src = "";
    elements.listingPreviewImage.classList.add("hidden");
    elements.listingPreviewPlaceholder.classList.remove("hidden");
    elements.listingPreviewPlaceholder.textContent = "Няма качена снимка";
  }

  function updateListingPreviewRibbon(promotion) {
    if (!elements.listingPreviewRibbon) return;

    elements.listingPreviewRibbon.classList.remove(
      "listing-preview-card__ribbon--hidden",
      "listing-preview-card__ribbon--vip",
      "listing-preview-card__ribbon--top"
    );

    if (promotion === "VIP") {
      elements.listingPreviewRibbon.textContent = "VIP";
      elements.listingPreviewRibbon.classList.add("listing-preview-card__ribbon--vip");
      return;
    }

    if (promotion === "TOP") {
      elements.listingPreviewRibbon.textContent = "TOP";
      elements.listingPreviewRibbon.classList.add("listing-preview-card__ribbon--top");
      return;
    }

    elements.listingPreviewRibbon.textContent = "";
    elements.listingPreviewRibbon.classList.add("listing-preview-card__ribbon--hidden");
  }

  function updateListingPreviewCardTheme(promotion) {
    if (!elements.listingPreviewCard) return;

    elements.listingPreviewCard.classList.remove(
      "listing-preview-card--vip",
      "listing-preview-card--top"
    );

    if (promotion === "VIP") {
      elements.listingPreviewCard.classList.add("listing-preview-card--vip");
      return;
    }

    if (promotion === "TOP") {
      elements.listingPreviewCard.classList.add("listing-preview-card--top");
    }
  }

  function updateListingPreviewMeta(metaItems) {
    if (!elements.listingPreviewMeta) return;

    if (!metaItems.length) {
      elements.listingPreviewMeta.innerHTML = `
        <span>Детайл 1</span>
        <span>Детайл 2</span>
      `;
      return;
    }

    elements.listingPreviewMeta.innerHTML = metaItems.map(item => {
      const className = item.isLicense ? "meta-license" : "";
      return `<span class="${className}">${escapeHtml(item.text)}</span>`;
    }).join("");
  }

  function truncateText(value, maxLength) {
    const text = cleanText(value);
    if (!text || text.length <= maxLength) return text;
    return `${text.slice(0, maxLength - 1)}…`;
  }

  function toNumberOrNull(value) {
    if (value === null || value === undefined || String(value).trim() === "") return null;

    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  function toShortOrNull(value) {
    const parsed = toNumberOrNull(value);
    return parsed === null ? null : parsed;
  }

  function toDecimalOrNull(value) {
    if (value === null || value === undefined || String(value).trim() === "") return null;

    const parsed = Number(String(value).replace(",", "."));
    return Number.isFinite(parsed) ? parsed : null;
  }

  function cleanText(value) {
    return String(value || "").trim();
  }

  function cleanNullableText(value) {
    const result = String(value || "").trim();
    return result ? result : null;
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
