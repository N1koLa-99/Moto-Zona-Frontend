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

  const state = {
    currentUser: null,
    uploadedPhotos: [],
    isSubmitting: false,
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

  const elements = {
    backToHomeBtn: document.getElementById("backToHomeBtn"),
    logoutBtn: document.getElementById("logoutBtn"),
    userDisplayName: document.getElementById("userDisplayName"),
    statusMessage: document.getElementById("statusMessage"),
    createListingForm: document.getElementById("createListingForm"),
    submitBtn: document.getElementById("submitBtn"),
    resetFormBtn: document.getElementById("resetFormBtn"),

    mainCategorySelect: document.getElementById("mainCategorySelect"),
    promotionTypeSelect: document.getElementById("promotionTypeSelect"),
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
    exchangeRateToEURInput: document.getElementById("exchangeRateToEURInput"),
    exchangeRateHint: document.getElementById("exchangeRateHint"),

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
      applyAutoExchangeRate();
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
      window.location.href = "index.html";
    });

    elements.logoutBtn?.addEventListener("click", () => {
      if (window.Auth?.logoutUser) {
        window.Auth.logoutUser();
        return;
      }

      window.location.href = "index.html";
    });

    elements.mainCategorySelect?.addEventListener("change", async () => {
      toggleCategorySections();
      clearIrrelevantFields();
      await maybeLoadVehicleModels();
      updateListingPreview();
      updateCreateChargePreview();
    });

    elements.vehicleClassSelect?.addEventListener("change", async () => {
      fillVehicleTypesByClass();
      await maybeLoadVehicleModels();
      updateListingPreview();
      updateCreateChargePreview();
    });

    elements.vehicleBrandSelect?.addEventListener("change", async () => {
      await maybeLoadVehicleModels();
      updateListingPreview();
      updateCreateChargePreview();
    });

    elements.gearTypeSelect?.addEventListener("change", () => {
      toggleHelmetTypeField();
      updateListingPreview();
      updateCreateChargePreview();
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
      applyAutoExchangeRate();
      updateListingPreview();
      updateCreateChargePreview();
    });

    elements.photosInput?.addEventListener("change", onPhotosSelected);

    elements.resetFormBtn?.addEventListener("click", async () => {
      await resetForm();
    });

    elements.createListingForm?.addEventListener("submit", onSubmit);

    elements.createListingForm?.addEventListener("input", event => {
      if (event.target === elements.photosInput) return;
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

    elements.countrySelect.value = String(userCountryId);
    await handleCountryChange();

    const userRegionId =
      toNumberOrNull(user?.regionId) ||
      toNumberOrNull(user?.region?.id);

    if (userRegionId && !elements.regionWrap.classList.contains("hidden")) {
      elements.regionSelect.value = String(userRegionId);
      await handleRegionChange();
    }

    const userCityId =
      toNumberOrNull(user?.cityId) ||
      toNumberOrNull(user?.city?.id);

    if (userCityId && !elements.cityWrap.classList.contains("hidden")) {
      elements.citySelect.value = String(userCityId);
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

    fillSelect(elements.mainCategorySelect, state.lookups.mainCategories, {
      placeholder: "Избери категория",
      preferredLabelKey: "nameBg"
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

    toggleCategorySections();
    toggleHelmetTypeField();
    toggleLocationFields(false);
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
        elements.gearHelmetTypeSelect.value = "";
      }
    }
  }

  function clearIrrelevantFields() {
    const code = getSelectedCategoryCode();

    if (code !== "VEHICLE") {
      elements.vehicleClassSelect.value = "";
      elements.vehicleTypeSelect.value = "";
      elements.vehicleBrandSelect.value = "";
      fillSelect(elements.vehicleTypeSelect, [], { placeholder: "Избери вид" });
      fillSelect(elements.vehicleModelSelect, [], { placeholder: "Избери модел", preferredLabelKey: "name" });
      elements.vehicleLicenseCategorySelect.value = "";
      elements.vehicleConditionSelect.value = "";
      elements.vehicleYearInput.value = "";
      elements.vehicleHorsePowerInput.value = "";
      elements.vehicleEngineCcInput.value = "";
      elements.vehicleMileageInput.value = "";
      elements.vehicleColorInput.value = "";
    }

    if (code !== "GEAR") {
      elements.gearTypeSelect.value = "";
      elements.gearHelmetTypeSelect.value = "";
      elements.gearBrandSelect.value = "";
      elements.gearConditionSelect.value = "";
      elements.gearYearInput.value = "";
      elements.gearColorInput.value = "";
      elements.gearItemModelTextInput.value = "";
    }

    if (code !== "PART") {
      elements.partTypeSelect.value = "";
      elements.partBrandSelect.value = "";
      elements.partConditionSelect.value = "";
      elements.partItemModelTextInput.value = "";
    }

    if (code !== "ACCESSORY") {
      elements.accessoryTypeSelect.value = "";
      elements.accessoryBrandSelect.value = "";
      elements.accessoryConditionSelect.value = "";
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
      elements.gearHelmetTypeSelect.value = "";
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
      elements.regionSelect.value = "";
      elements.citySelect.value = "";
    }
  }

  function applyAutoExchangeRate() {
    const currencyCode = (elements.currencyCodeSelect?.value || "EUR").toUpperCase();
    const rate = AUTO_RATES_TO_EUR[currencyCode] ?? 1;

    elements.exchangeRateToEURInput.value = String(rate);

    if (elements.exchangeRateHint) {
      elements.exchangeRateHint.textContent = `Автоматично зададен курс за ${currencyCode}. Може да го редактираш ръчно.`;
    }
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
      updateListingPreview();
      return;
    }

    elements.photoPreviewGrid.innerHTML = state.uploadedPhotos.map((photo, index) => {
      const safeImg = photo.fileUrl
        ? `<img src="${escapeHtml(photo.fileUrl)}" alt="${escapeHtml(photo.fileName || "Снимка")}" />`
        : `<div class="photo-card__missing">Няма preview</div>`;

      return `
        <article class="photo-card">
          <div class="photo-card__image">
            ${safeImg}
          </div>
          <div class="photo-card__body">
            <p class="photo-card__name">${escapeHtml(photo.fileName || "Снимка")}</p>
            <div class="photo-card__actions">
              <button
                type="button"
                class="photo-card__main-btn ${photo.isMain ? "is-main" : ""}"
                data-action="main"
                data-index="${index}"
              >
                ${photo.isMain ? "Главна" : "Направи главна"}
              </button>

              <button
                type="button"
                class="photo-card__remove-btn"
                data-action="remove"
                data-index="${index}"
              >
                Махни
              </button>
            </div>
          </div>
        </article>
      `;
    }).join("");

    [...elements.photoPreviewGrid.querySelectorAll("button[data-action='main']")].forEach(btn => {
      btn.addEventListener("click", () => {
        const index = Number(btn.dataset.index);
        setMainPhoto(index);
      });
    });

    [...elements.photoPreviewGrid.querySelectorAll("button[data-action='remove']")].forEach(btn => {
      btn.addEventListener("click", async () => {
        const index = Number(btn.dataset.index);
        await removePhoto(index);
      });
    });

    updateListingPreview();
  }

  function setMainPhoto(index) {
    state.uploadedPhotos = state.uploadedPhotos.map((photo, i) => ({
      ...photo,
      isMain: i === index
    }));

    renderPhotoPreview();
    updateListingPreview();
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

      if (state.uploadedPhotos.length && !state.uploadedPhotos.some(x => x.isMain)) {
        state.uploadedPhotos[0].isMain = true;
      }

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
      sortOrder: index
    }));
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

  function renderCreatePricingInfo() {
    const accountType = normalizeAccountType(state.billing.accountType || "PRIVATE");
    const freeRemaining = Number(state.billing.freeUploadsRemainingNow || 0);

    if (elements.pricingSummaryText) {
      elements.pricingSummaryText.textContent =
        freeRemaining > 0
          ? `Имаш ${freeRemaining} безплатни качвания в момента. Ако качиш NORMAL обява, няма да ти се начисли такса за публикуване.`
          : `В момента си над free лимита. При ново качване ще се начисли такса според типа профил, плюс избраното ниво TOP или VIP.`;
    }

    if (elements.pricingSummaryText) {
      elements.pricingSummaryText.textContent =
        freeRemaining > 0
          ? `Имаш още ${freeRemaining} free качвания. При NORMAL в момента няма такса за публикуване.`
          : `Free лимитът е изчерпан. Ще се начисли такса за качване, а TOP или VIP се добавят отделно.`;
    }

    if (elements.billingAccountType) {
      elements.billingAccountType.textContent = getAccountTypeLabel(accountType);
    }

    if (elements.billingFreeRemaining) {
      elements.billingFreeRemaining.textContent = String(freeRemaining);
    }

    if (elements.billingOverLimitPrice) {
      elements.billingOverLimitPrice.textContent = formatMoney(state.billing.overLimitPublishPriceEUR, "EUR");
    }

    if (elements.billingRefreshPrice) {
      elements.billingRefreshPrice.textContent = formatMoney(state.billing.refreshPriceEUR, "EUR");
    }

    if (elements.normalPlanPriceText) {
      elements.normalPlanPriceText.textContent =
        freeRemaining > 0
          ? "0.00 EUR*"
          : formatMoney(state.billing.overLimitPublishPriceEUR, "EUR");
    }

    if (elements.normalPlanText) {
      elements.normalPlanText.textContent =
        freeRemaining > 0
          ? `Нормална обява. Това качване може да мине без такса, защото още имаш ${freeRemaining} free качвания.`
          : `Нормална обява. Понеже free лимитът е изчерпан, само качването ще струва ${formatMoney(state.billing.overLimitPublishPriceEUR, "EUR")}.`;
    }

    if (elements.topPlanPriceText) {
      elements.topPlanPriceText.textContent = `${formatMoney(PRICING.TOP_PRICE_EUR, "EUR")} / ${PRICING.TOP_DAYS} дни`;
    }

    if (elements.topPlanText) {
      elements.topPlanText.textContent =
        `TOP отличава обявата и я показва по-напред за ${PRICING.TOP_DAYS} дни. Тази такса се добавя върху таксата за качване, ако си над лимита.`;
    }

    if (elements.vipPlanPriceText) {
      elements.vipPlanPriceText.textContent = `${formatMoney(PRICING.VIP_PRICE_EUR, "EUR")} / ${PRICING.VIP_DAYS} дни`;
    }

    if (elements.vipPlanText) {
      elements.vipPlanText.textContent =
        `VIP дава най-силна видимост и приоритетно позициониране за ${PRICING.VIP_DAYS} дни. Тази такса се добавя върху таксата за качване, ако си над лимита.`;
    }
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
      priceText =
        breakdown.publishChargeEUR > 0
          ? formatMoney(breakdown.publishChargeEUR, "EUR")
          : "0.00 EUR";
      hintText =
        breakdown.publishChargeEUR > 0
          ? `Нормална обява без промоция. Ще се начисли само такса за качване ${formatMoney(breakdown.publishChargeEUR, "EUR")}.`
          : freeRemaining > 0
            ? `Нормалната обява влиза в free лимита и за това качване няма да се начисли такса.`
            : `Нормална обява без допълнителна промоция.`;
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
    const freeRemaining = Number(state.billing.freeUploadsRemainingNow || 0);
    const publishChargeEUR = freeRemaining > 0 ? 0 : Number(state.billing.overLimitPublishPriceEUR || 0);

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

    const publishExplanation =
      publishChargeEUR === 0
        ? "Качването влиза в безплатния лимит."
        : `Качването е над free лимита и се начисляват ${formatMoney(publishChargeEUR, "EUR")}.`;

    const totalExplanation =
      promotionType === "NORMAL"
        ? `${publishExplanation} Няма допълнителна промоционална такса.`
        : `${publishExplanation} Избрано е ниво ${promotionType}, което добавя ${formatMoney(promotionChargeEUR, "EUR")}.`;

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

    updateSelectedPlanSummary();

    if (elements.submitBtn && !state.isSubmitting) {
      elements.submitBtn.textContent =
        breakdown.totalEUR > 0
          ? `Публикувай обявата • ${formatMoney(breakdown.totalEUR, "EUR")}`
          : "Публикувай обявата";
    }
  }

  function buildCreateChargeConfirmMessage() {
    const breakdown = getCreateChargeBreakdown();

    return [
      "Потвърждение за публикуване:",
      `- Такса за качване: ${formatMoney(breakdown.publishChargeEUR, "EUR")}`,
      `- Такса за ниво (${breakdown.promotionType}): ${formatMoney(breakdown.promotionChargeEUR, "EUR")}`,
      `- Общо дължимо: ${formatMoney(breakdown.totalEUR, "EUR")}`,
      "",
      breakdown.totalExplanation,
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
        window.location.href = `ListingDetails.html?id=${encodeURIComponent(result.listingId)}`;
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
      exchangeRateToEUR: toDecimalOrNull(elements.exchangeRateToEURInput.value),
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

    toggleCategorySections();
    toggleHelmetTypeField();
    applyAutoExchangeRate();
    toggleLocationFields(false);

    fillSelect(elements.vehicleTypeSelect, [], { placeholder: "Избери вид" });
    fillSelect(elements.vehicleModelSelect, [], { placeholder: "Избери модел", preferredLabelKey: "name" });
    fillSelect(elements.regionSelect, [], { placeholder: "Избери област" });
    fillSelect(elements.citySelect, [], { placeholder: "Избери град" });

    prefillUserContactData(state.currentUser);
    await prefillUserCountry(state.currentUser || {});

    renderPhotoPreview();
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
