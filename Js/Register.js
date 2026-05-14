(() => {
  const API_BASE_URL = (window.Auth?.API_BASE_URL || "https://motomarketapi.azurewebsites.net").replace(/\/+$/, "");
  const COMPANY_CONTACT_EMAIL = "motozone.support@gmail.com";

  const STEP_FIELDS = {
    1: ["firstName", "lastName", "phone"],
    2: ["email", "password", "confirmPassword"],
    3: ["countryId", "cityId", "privacyConsent"]
  };

  const VALIDATED_FIELDS = Object.values(STEP_FIELDS).flat();

  const state = {
    accountType: "PRIVATE",
    currentStep: 1,
    totalSteps: 3,
    allCountries: [],
    cityIndex: [],
    citiesLoaded: false,
    selectedCountryId: ""
  };

  const elements = {
    typeCards: [...document.querySelectorAll(".account-choice-card")],
    privateSection: document.getElementById("privateRegisterSection"),
    companySection: document.getElementById("companyInfoSection"),
    companyEmailLink: document.getElementById("companyEmailLink"),

    message: document.getElementById("registerMessage"),
    form: document.getElementById("privateRegisterForm"),
    submitBtn: document.getElementById("registerSubmitBtn"),

    progressFill: document.getElementById("registerProgressFill"),
    stepDots: [...document.querySelectorAll("[data-step-dot]")],
    stepPanels: [...document.querySelectorAll("[data-step-panel]")],

    nextToStep2: document.getElementById("nextToStep2"),
    nextToStep3: document.getElementById("nextToStep3"),
    backToStep1: document.getElementById("backToStep1"),
    backToStep2: document.getElementById("backToStep2"),

    firstName: document.getElementById("firstName"),
    lastName: document.getElementById("lastName"),
    phone: document.getElementById("phone"),
    email: document.getElementById("email"),
    password: document.getElementById("password"),
    confirmPassword: document.getElementById("confirmPassword"),

    countrySearch: document.getElementById("countrySearch"),
    countryCombobox: document.getElementById("countryCombobox"),
    countryId: document.getElementById("countryId"),
    countryDropdown: document.getElementById("countryDropdown"),
    regionSearch: document.getElementById("regionSearch"),
    regionCombobox: document.getElementById("regionCombobox"),
    regionId: document.getElementById("regionId"),
    regionDropdown: document.getElementById("regionDropdown"),
    citySearch: document.getElementById("citySearch"),
    cityCombobox: document.getElementById("cityCombobox"),
    cityId: document.getElementById("cityId"),
    cityDropdown: document.getElementById("cityDropdown"),

    privacyConsent: document.getElementById("privacyConsent"),

    firstNameError: document.getElementById("firstNameError"),
    lastNameError: document.getElementById("lastNameError"),
    phoneError: document.getElementById("phoneError"),
    emailError: document.getElementById("emailError"),
    passwordError: document.getElementById("passwordError"),
    confirmPasswordError: document.getElementById("confirmPasswordError"),
    countryIdError: document.getElementById("countryIdError"),
    cityIdError: document.getElementById("cityIdError"),
    privacyConsentError: document.getElementById("privacyConsentError")
  };

  document.addEventListener("DOMContentLoaded", init);

  async function init() {
    if (window.Auth?.isLoggedIn?.()) {
      window.location.href = "index.html";
      return;
    }

    setupCompanyEmail();
    bindEvents();
    await loadCountries();
    initCountryCombobox();
    initRegionCombobox();
    initCityCombobox();
    render();
  }

  function bindEvents() {
    elements.typeCards.forEach((card) => {
      card.addEventListener("click", () => {
        state.accountType = card.dataset.type || "PRIVATE";

        if (state.accountType === "PRIVATE") {
          state.currentStep = 1;
        }

        clearAllFieldErrors();
        clearMessage();
        render();
      });
    });

    elements.nextToStep2?.addEventListener("click", () => goToStep(2));
    elements.nextToStep3?.addEventListener("click", () => goToStep(3));
    elements.backToStep1?.addEventListener("click", () => goBackToStep(1));
    elements.backToStep2?.addEventListener("click", () => goBackToStep(2));

    elements.form?.addEventListener("submit", onPrivateRegisterSubmit);

    bindInputValidation("firstName");
    bindInputValidation("lastName");
    bindInputValidation("phone");
    bindInputValidation("email");
    bindInputValidation("password", {
      onAfterValidate: () => {
        if (elements.confirmPassword?.value || hasFieldError("confirmPassword")) {
          validateField("confirmPassword");
        }
      }
    });
    bindInputValidation("confirmPassword");


    elements.privacyConsent?.addEventListener("change", () => {
      clearMessage();
      validateField("privacyConsent");
    });

    document.querySelectorAll(".toggle-password").forEach((button) => {
      button.addEventListener("click", () => {
        const targetId = button.dataset.target;
        const input = document.getElementById(targetId);

        if (!input) return;

        const isPassword = input.type === "password";
        input.type = isPassword ? "text" : "password";
        button.textContent = isPassword ? "Скрий" : "Покажи";
      });
    });
  }

  function bindInputValidation(fieldName, options = {}) {
    const input = elements[fieldName];

    if (!input) {
      return;
    }

    input.addEventListener("blur", () => {
      clearMessage();
      validateField(fieldName);
      options.onAfterValidate?.();
    });

    input.addEventListener("input", () => {
      clearMessage();

      if (hasFieldError(fieldName)) {
        validateField(fieldName);
      }

      options.onAfterValidate?.();
    });
  }

  function setupCompanyEmail() {
    if (!elements.companyEmailLink) return;

    elements.companyEmailLink.href = `mailto:${COMPANY_CONTACT_EMAIL}`;
    elements.companyEmailLink.textContent = COMPANY_CONTACT_EMAIL;
  }

  function render() {
    const isPrivate = state.accountType === "PRIVATE";

    elements.typeCards.forEach((card) => {
      card.classList.toggle("active", card.dataset.type === state.accountType);
    });

    elements.privateSection?.classList.toggle("hidden", !isPrivate);
    elements.companySection?.classList.toggle("hidden", isPrivate);

    renderSteps();
  }

  function renderSteps() {
    const progressPercent =
      state.totalSteps <= 1
        ? 100
        : ((state.currentStep - 1) / (state.totalSteps - 1)) * 100;

    if (elements.progressFill) {
      elements.progressFill.style.width = `${progressPercent}%`;
    }

    elements.stepDots.forEach((dot) => {
      const stepNumber = Number(dot.dataset.stepDot);
      dot.classList.toggle("active", stepNumber === state.currentStep);
      dot.classList.toggle("done", stepNumber < state.currentStep);
    });

    elements.stepPanels.forEach((panel) => {
      const stepNumber = Number(panel.dataset.stepPanel);
      panel.classList.toggle("active", stepNumber === state.currentStep);
    });
  }

  function goToStep(targetStep) {
    clearMessage();

    const validationResult = validateStep(state.currentStep);

    if (validationResult.message) {
      showMessage(validationResult.message, "error");
      focusField(validationResult.fieldName);
      return;
    }

    state.currentStep = targetStep;
    render();
  }

  function goBackToStep(targetStep) {
    clearMessage();
    state.currentStep = targetStep;
    render();
  }

  async function loadCountries() {
    try {
      const countries = await getJson(`${API_BASE_URL}/api/lookups/countries`);
      state.allCountries = countries || [];
    } catch (error) {
      console.error(error);
      showMessage("Не успяхме да заредим държавите.", "error");
    }
  }

  async function loadCityIndex(countryId) {
    try {
      const regions = await getJson(`${API_BASE_URL}/api/lookups/regions/${countryId}`);
      if (!regions?.length) {
        state.cityIndex = [];
        state.citiesLoaded = true;
        return;
      }

      const cityArrays = await Promise.all(
        regions.map(async (region) => {
          try {
            const cities = await getJson(`${API_BASE_URL}/api/lookups/cities/${region.id}`);
            return (cities || []).map((city) => ({
              id: city.id,
              nameBg: city.nameBg || city.name || "",
              regionId: region.id,
              regionNameBg: region.nameBg || region.name || ""
            }));
          } catch {
            return [];
          }
        })
      );

      state.cityIndex = cityArrays.flat();
      state.citiesLoaded = true;
    } catch (error) {
      console.error(error);
      showMessage("Не успяхме да заредим градовете.", "error");
    }
  }

  function initCountryCombobox() {
    const { countrySearch, countryDropdown, countryCombobox } = elements;
    if (!countrySearch || !countryDropdown) return;

    countrySearch.addEventListener("focus", () => {
      renderCountryOptions(countrySearch.value.trim());
      openCombobox(countryDropdown, countryCombobox);
    });

    countrySearch.addEventListener("input", () => {
      clearMessage();
      renderCountryOptions(countrySearch.value.trim());
      openCombobox(countryDropdown, countryCombobox);
    });

    countrySearch.addEventListener("blur", () => {
      setTimeout(() => {
        if (!countryCombobox?.contains(document.activeElement)) {
          closeCombobox(countryDropdown, countryCombobox);
          if (!elements.countryId.value) countrySearch.value = "";
        }
      }, 150);
    });

    document.addEventListener("click", (e) => {
      if (!countryCombobox?.contains(e.target)) {
        closeCombobox(countryDropdown, countryCombobox);
      }
    }, true);
  }

  function renderCountryOptions(query) {
    const { countryDropdown } = elements;
    if (!countryDropdown) return;

    const q = query.toLowerCase();
    const filtered = q
      ? state.allCountries.filter((c) => (c.nameBg || "").toLowerCase().includes(q))
      : state.allCountries;

    if (!filtered.length) {
      countryDropdown.innerHTML = `<div class="searchable-select__empty">Няма намерени държави</div>`;
      return;
    }

    const selectedId = elements.countryId?.value || "";
    countryDropdown.innerHTML = filtered.slice(0, 60).map((country) => `
      <button
        type="button"
        class="searchable-select__option${selectedId === String(country.id) ? " is-selected" : ""}"
        data-value="${escapeHtml(String(country.id))}"
        data-label="${escapeHtml(country.nameBg || "")}"
      >${escapeHtml(country.nameBg || "")}</button>
    `).join("");

    countryDropdown.querySelectorAll(".searchable-select__option").forEach((btn) => {
      btn.addEventListener("mousedown", (e) => {
        e.preventDefault();
        selectCountry(btn.dataset.value, btn.dataset.label);
      });
    });
  }

  async function selectCountry(countryId, countryLabel) {
    elements.countryId.value = countryId;
    elements.countrySearch.value = countryLabel;
    closeCombobox(elements.countryDropdown, elements.countryCombobox);
    clearFieldError("countryId");

    elements.regionSearch.value = "";
    elements.regionId.value = "";
    elements.regionSearch.disabled = true;
    elements.citySearch.value = "";
    elements.cityId.value = "";
    elements.citySearch.disabled = true;
    state.cityIndex = [];
    state.citiesLoaded = false;
    state.selectedCountryId = countryId;

    if (!countryId) return;

    elements.citySearch.placeholder = "Зареждаме градовете…";
    await loadCityIndex(countryId);

    if (state.selectedCountryId === countryId) {
      elements.regionSearch.disabled = false;
      elements.regionSearch.placeholder = "Избери или напиши област…";
      elements.citySearch.disabled = false;
      elements.citySearch.placeholder = "Напиши своя град…";
    }
  }

  function initRegionCombobox() {
    const { regionSearch, regionDropdown, regionCombobox } = elements;
    if (!regionSearch || !regionDropdown) return;

    regionSearch.addEventListener("focus", () => {
      renderRegionOptions(regionSearch.value.trim());
      openCombobox(regionDropdown, regionCombobox);
    });

    regionSearch.addEventListener("input", () => {
      clearMessage();
      elements.regionId.value = "";
      renderRegionOptions(regionSearch.value.trim());
      openCombobox(regionDropdown, regionCombobox);
    });

    regionSearch.addEventListener("blur", () => {
      setTimeout(() => {
        if (!regionCombobox?.contains(document.activeElement)) {
          closeCombobox(regionDropdown, regionCombobox);
          if (!elements.regionId.value) regionSearch.value = "";
        }
      }, 150);
    });

    document.addEventListener("click", (e) => {
      if (!regionCombobox?.contains(e.target)) {
        closeCombobox(regionDropdown, regionCombobox);
      }
    }, true);
  }

  function getUniqueRegions() {
    const seen = new Set();
    return state.cityIndex.filter((c) => {
      if (seen.has(c.regionId)) return false;
      seen.add(c.regionId);
      return true;
    }).map((c) => ({ id: c.regionId, nameBg: c.regionNameBg }));
  }

  function renderRegionOptions(query) {
    const { regionDropdown } = elements;
    if (!regionDropdown) return;

    const regions = getUniqueRegions();
    const q = query.toLowerCase();
    const filtered = q
      ? regions.filter((r) => r.nameBg.toLowerCase().includes(q))
      : regions;

    if (!filtered.length) {
      regionDropdown.innerHTML = `<div class="searchable-select__empty">Няма намерени области</div>`;
      return;
    }

    const selectedId = elements.regionId?.value || "";
    regionDropdown.innerHTML = filtered.map((region) => `
      <button
        type="button"
        class="searchable-select__option${selectedId === String(region.id) ? " is-selected" : ""}"
        data-value="${escapeHtml(String(region.id))}"
        data-label="${escapeHtml(region.nameBg)}"
      >${escapeHtml(region.nameBg)}</button>
    `).join("");

    regionDropdown.querySelectorAll(".searchable-select__option").forEach((btn) => {
      btn.addEventListener("mousedown", (e) => {
        e.preventDefault();
        selectRegion(btn.dataset.value, btn.dataset.label);
      });
    });
  }

  function selectRegion(regionId, regionLabel) {
    elements.regionId.value = regionId;
    elements.regionSearch.value = regionLabel;
    closeCombobox(elements.regionDropdown, elements.regionCombobox);

    const currentCityId = elements.cityId.value;
    if (currentCityId) {
      const cityStillValid = state.cityIndex.find(
        (c) => String(c.id) === currentCityId && String(c.regionId) === regionId
      );
      if (!cityStillValid) {
        elements.cityId.value = "";
        elements.citySearch.value = "";
      }
    }
  }

  function initCityCombobox() {
    const { citySearch, cityDropdown, cityCombobox } = elements;
    if (!citySearch || !cityDropdown) return;

    citySearch.addEventListener("input", () => {
      clearMessage();
      elements.cityId.value = "";
      renderCityOptions(citySearch.value.trim());
      openCombobox(cityDropdown, cityCombobox);
    });

    citySearch.addEventListener("focus", () => {
      renderCityOptions(citySearch.value.trim());
      openCombobox(cityDropdown, cityCombobox);
    });

    citySearch.addEventListener("blur", () => {
      setTimeout(() => {
        if (!cityCombobox?.contains(document.activeElement)) {
          closeCombobox(cityDropdown, cityCombobox);
          if (!elements.cityId.value) citySearch.value = "";
        }
      }, 150);
    });

    document.addEventListener("click", (e) => {
      if (!cityCombobox?.contains(e.target)) {
        closeCombobox(cityDropdown, cityCombobox);
      }
    }, true);
  }

  function renderCityOptions(query) {
    const { cityDropdown, cityCombobox } = elements;
    if (!cityDropdown) return;

    if (!state.cityIndex.length) {
      cityDropdown.innerHTML = "";
      return;
    }

    const selectedRegionId = elements.regionId?.value || "";
    const pool = selectedRegionId
      ? state.cityIndex.filter((c) => String(c.regionId) === selectedRegionId)
      : state.cityIndex;

    let results;
    if (!query) {
      results = pool.slice(0, 50);
    } else {
      const q = query.toLowerCase();
      const starts = pool.filter((c) => c.nameBg.toLowerCase().startsWith(q));
      const contains = pool.filter(
        (c) => !c.nameBg.toLowerCase().startsWith(q) && c.nameBg.toLowerCase().includes(q)
      );
      results = [...starts, ...contains].slice(0, 30);
    }

    if (!results.length) {
      cityDropdown.innerHTML = `<div class="searchable-select__empty">Няма намерени градове</div>`;
      return;
    }

    cityDropdown.innerHTML = results.map((city) => `
      <button
        type="button"
        class="searchable-select__option reg-city-option"
        data-city-id="${escapeHtml(String(city.id))}"
        data-city-name="${escapeHtml(city.nameBg)}"
        data-region-id="${escapeHtml(String(city.regionId))}"
        data-region-name="${escapeHtml(city.regionNameBg)}"
      >
        <span class="reg-city-option__name">${escapeHtml(city.nameBg)}</span>
        <span class="reg-city-option__region">${escapeHtml(city.regionNameBg)}</span>
      </button>
    `).join("");

    cityDropdown.querySelectorAll(".searchable-select__option").forEach((btn) => {
      btn.addEventListener("mousedown", (e) => {
        e.preventDefault();
        selectCity(btn.dataset.cityId, btn.dataset.cityName, btn.dataset.regionId, btn.dataset.regionName);
      });
    });
  }

  function selectCity(cityId, cityName, regionId, regionName) {
    elements.cityId.value = cityId;
    elements.citySearch.value = cityName;
    closeCombobox(elements.cityDropdown, elements.cityCombobox);
    clearFieldError("cityId");

    if (!elements.regionId.value) {
      elements.regionId.value = regionId;
      if (elements.regionSearch) elements.regionSearch.value = regionName;
    }
  }

  function openCombobox(dropdown, root) {
    if (!dropdown) return;
    dropdown.classList.remove("hidden");
    root?.classList.add("is-open");
  }

  function closeCombobox(dropdown, root) {
    if (!dropdown) return;
    dropdown.classList.add("hidden");
    root?.classList.remove("is-open");
  }

  async function onPrivateRegisterSubmit(event) {
    event.preventDefault();
    clearMessage();

    if (state.accountType !== "PRIVATE") {
      return;
    }

    const validationResult = validateAllSteps();

    if (validationResult.message) {
      if (validationResult.step && validationResult.step !== state.currentStep) {
        state.currentStep = validationResult.step;
        render();
      }

      showMessage(validationResult.message, "error");
      focusField(validationResult.fieldName);
      return;
    }

    const formData = getPrivateFormData();

    setLoading(true);

    try {
      const response = await window.Auth.authFetch(`${API_BASE_URL}/api/auth/register/private`, {
        method: "POST",
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          phone: formData.phone,
          email: formData.email,
          password: formData.password,
          countryId: Number(formData.countryId),
          regionId: Number(formData.regionId),
          cityId: Number(formData.cityId),
          acceptedPrivacyPolicy: formData.privacyConsent
        })
      });

      if (!response.ok) {
        const raw = await response.text();
        console.error("Register 400 body:", raw);
        const errorMessage = await window.Auth.readApiMessage(response, "Неуспешна регистрация.");
        showMessage(errorMessage, "error");
        return;
      }

      const data = await response.json();
      const registeredEmail = window.Auth?.normalizeEmail?.(data?.email || formData.email) || formData.email;
      const successMessage =
        data?.message ||
        "Профилът е създаден. Изпратихме код за потвърждение на имейла.";

      window.Auth.clearAuthData();
      showMessage(`${successMessage} Пренасочваме те към потвърждението...`, "success");

      window.setTimeout(() => {
        window.location.href = window.Auth.buildPageUrl("VerifyEmail.html", {
          email: registeredEmail,
          status: "verification-required"
        });
      }, 1200);
    } catch (error) {
      console.error(error);
      showMessage("Възникна проблем при регистрацията. Опитай пак.", "error");
    } finally {
      setLoading(false);
    }
  }

  function validateAllSteps() {
    for (let stepNumber = 1; stepNumber <= state.totalSteps; stepNumber += 1) {
      const validationResult = validateStep(stepNumber);

      if (validationResult.message) {
        return {
          step: stepNumber,
          fieldName: validationResult.fieldName,
          message: validationResult.message
        };
      }
    }

    return {
      step: 0,
      fieldName: "",
      message: ""
    };
  }

  function validateStep(stepNumber) {
    const fieldsForStep = STEP_FIELDS[stepNumber] || [];
    let firstInvalidField = "";
    let firstMessage = "";

    fieldsForStep.forEach((fieldName) => {
      const message = validateField(fieldName);

      if (message && !firstInvalidField) {
        firstInvalidField = fieldName;
        firstMessage = message;
      }
    });

    return {
      fieldName: firstInvalidField,
      message: firstMessage
    };
  }

  function validateField(fieldName) {
    const data = getPrivateFormData();
    const message = getValidationMessage(fieldName, data);

    if (message) {
      setFieldError(fieldName, message);
      return message;
    }

    clearFieldError(fieldName);
    return "";
  }

  function getValidationMessage(fieldName, data) {
    switch (fieldName) {
      case "firstName":
        if (!data.firstName) return "Името е задължително.";
        if (data.firstName.length < 2) return "Името трябва да е поне 2 символа.";
        if (data.firstName.length > 100) return "Името не може да е повече от 100 символа.";
        if (!/^[\p{L}\s'-]+$/u.test(data.firstName)) return "Името съдържа невалидни символи.";
        return "";

      case "lastName":
        if (!data.lastName) return "Фамилията е задължителна.";
        if (data.lastName.length < 2) return "Фамилията трябва да е поне 2 символа.";
        if (data.lastName.length > 100) return "Фамилията не може да е повече от 100 символа.";
        if (!/^[\p{L}\s'-]+$/u.test(data.lastName)) return "Фамилията съдържа невалидни символи.";
        return "";

      case "phone":
        if (!data.phone) return "Телефонът е задължителен.";
        if (!isValidPhone(data.phone)) return "Въведи валиден телефонен номер.";
        return "";

      case "email":
        if (!data.email) return "Имейлът е задължителен.";
        if (!isValidEmail(data.email)) return "Въведи валиден имейл адрес.";
        if (data.email.length > 200) return "Имейлът не може да е повече от 200 символа.";
        return "";

      case "password": {
        if (!data.password) return "Паролата е задължителна.";
        if (data.password.length < 8) return "Паролата трябва да е поне 8 символа.";
        if (data.password.length > 100) return "Паролата не може да е повече от 100 символа.";
        if (!/[A-Za-z\u0400-\u04FF]/.test(data.password)) return "Паролата трябва да съдържа поне една буква.";
        if (!/\d/.test(data.password)) return "Паролата трябва да съдържа поне една цифра.";
        return "";
      }

      case "confirmPassword":
        if (!data.confirmPassword) return "Потвърждението на паролата е задължително.";
        if (data.password !== data.confirmPassword) return "Паролите не съвпадат.";
        return "";

      case "countryId":
        if (!data.countryId) return "Държавата е задължителна.";
        return "";

      case "cityId":
        if (!data.cityId) return "Изберете град от списъка.";
        return "";

      case "privacyConsent":
        if (!data.privacyConsent) {
          return "Трябва да приемеш Политиката за поверителност, за да завършиш регистрацията.";
        }
        return "";

      default:
        return "";
    }
  }

  function getFieldErrorElement(fieldName) {
    return elements[`${fieldName}Error`] || null;
  }

  function getVisibleInput(fieldName) {
    if (fieldName === "countryId") return elements.countrySearch;
    if (fieldName === "regionId") return elements.regionSearch;
    if (fieldName === "cityId") return elements.citySearch;
    return elements[fieldName];
  }

  function getFieldWrapper(fieldName) {
    if (fieldName === "privacyConsent") {
      return elements.privacyConsent?.closest(".consent-box") || null;
    }

    return getVisibleInput(fieldName)?.closest(".auth-field") || null;
  }

  function setFieldError(fieldName, message) {
    const field = getVisibleInput(fieldName);
    const wrapper = getFieldWrapper(fieldName);
    const errorElement = getFieldErrorElement(fieldName);

    field?.setAttribute("aria-invalid", "true");

    if (errorElement?.id) {
      field?.setAttribute("aria-describedby", errorElement.id);
      errorElement.textContent = message;
      errorElement.classList.add("is-visible");
    }

    wrapper?.classList.add("has-error");
  }

  function clearFieldError(fieldName) {
    const field = getVisibleInput(fieldName);
    const wrapper = getFieldWrapper(fieldName);
    const errorElement = getFieldErrorElement(fieldName);

    field?.removeAttribute("aria-invalid");
    field?.removeAttribute("aria-describedby");
    wrapper?.classList.remove("has-error");

    if (errorElement) {
      errorElement.textContent = "";
      errorElement.classList.remove("is-visible");
    }
  }

  function clearAllFieldErrors() {
    VALIDATED_FIELDS.forEach((fieldName) => clearFieldError(fieldName));
  }

  function hasFieldError(fieldName) {
    const errorElement = getFieldErrorElement(fieldName);
    return Boolean(errorElement?.classList.contains("is-visible"));
  }

  function focusField(fieldName) {
    const field = getVisibleInput(fieldName);

    if (!field || typeof field.focus !== "function") {
      return;
    }

    window.requestAnimationFrame(() => {
      field.focus();
      field.scrollIntoView({
        behavior: "smooth",
        block: "center"
      });
    });
  }

  function getPrivateFormData() {
    return {
      firstName: elements.firstName?.value.trim() || "",
      lastName: elements.lastName?.value.trim() || "",
      phone: elements.phone?.value.trim() || "",
      email: elements.email?.value.trim() || "",
      password: elements.password?.value || "",
      confirmPassword: elements.confirmPassword?.value || "",
      countryId: elements.countryId?.value || "",
      regionId: elements.regionId?.value || "",
      cityId: elements.cityId?.value || "",
      privacyConsent: Boolean(elements.privacyConsent?.checked)
    };
  }

  function fillSelect(select, items, firstOptionLabel, labelKey = "nameBg", valueKey = "id") {
    if (!select) return;

    const currentValue = select.value;
    const safeItems = Array.isArray(items) ? items : [];

    select.innerHTML =
      `<option value="">${escapeHtml(firstOptionLabel)}</option>` +
      safeItems
        .map((item) => {
          const label = item?.[labelKey] ?? item?.nameBg ?? item?.name ?? item?.code ?? "";
          const value = item?.[valueKey] ?? item?.id ?? item?.code ?? "";
          return `<option value="${escapeHtml(String(value))}">${escapeHtml(String(label))}</option>`;
        })
        .join("");

    if ([...select.options].some((option) => option.value === currentValue)) {
      select.value = currentValue;
    }
  }

  function clearSelect(select, label) {
    if (!select) return;
    select.innerHTML = `<option value="">${escapeHtml(label)}</option>`;
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

  function setLoading(isLoading) {
    if (!elements.submitBtn) return;

    elements.submitBtn.disabled = isLoading;
    elements.submitBtn.textContent = isLoading ? "Изчакване..." : "Създай профил";
  }

  function showMessage(text, type) {
    if (!elements.message) return;

    elements.message.textContent = text;
    elements.message.className = `auth-message is-${type}`;
  }

  function clearMessage() {
    if (!elements.message) return;

    elements.message.textContent = "";
    elements.message.className = "auth-message hidden";
  }

  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  function isValidPhone(phone) {
    if (!/^[+\d\s()-]+$/.test(phone)) {
      return false;
    }

    const digitsOnly = phone.replace(/\D/g, "");
    return digitsOnly.length >= 9 && digitsOnly.length <= 15;
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