(() => {
  const API_BASE_URL = window.Auth?.API_BASE_URL || "https://motomarketapi.azurewebsites.net";
  const COMPANY_CONTACT_EMAIL = "motozone.support@gmail.com";

  const STEP_FIELDS = {
    1: ["firstName", "lastName", "phone"],
    2: ["email", "password", "confirmPassword"],
    3: ["countryId", "regionId", "cityId", "privacyConsent"]
  };

  const VALIDATED_FIELDS = Object.values(STEP_FIELDS).flat();

  const state = {
    accountType: "PRIVATE",
    currentStep: 1,
    totalSteps: 3
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

    countryId: document.getElementById("countryId"),
    regionId: document.getElementById("regionId"),
    cityId: document.getElementById("cityId"),

    privacyConsent: document.getElementById("privacyConsent"),

    firstNameError: document.getElementById("firstNameError"),
    lastNameError: document.getElementById("lastNameError"),
    phoneError: document.getElementById("phoneError"),
    emailError: document.getElementById("emailError"),
    passwordError: document.getElementById("passwordError"),
    confirmPasswordError: document.getElementById("confirmPasswordError"),
    countryIdError: document.getElementById("countryIdError"),
    regionIdError: document.getElementById("regionIdError"),
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

    elements.countryId?.addEventListener("change", async () => {
      clearMessage();
      validateField("countryId");

      clearSelect(elements.regionId, "Избери област");
      clearSelect(elements.cityId, "Избери град");
      clearFieldError("regionId");
      clearFieldError("cityId");

      if (elements.regionId) {
        elements.regionId.disabled = true;
      }

      if (elements.cityId) {
        elements.cityId.disabled = true;
      }

      if (!elements.countryId.value) {
        return;
      }

      await loadRegions(elements.countryId.value);
    });

    elements.regionId?.addEventListener("change", async () => {
      clearMessage();
      validateField("regionId");

      clearSelect(elements.cityId, "Избери град");
      clearFieldError("cityId");

      if (elements.cityId) {
        elements.cityId.disabled = true;
      }

      if (!elements.regionId.value) {
        return;
      }

      await loadCities(elements.regionId.value);
    });

    elements.cityId?.addEventListener("change", () => {
      clearMessage();
      validateField("cityId");
    });

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
      fillSelect(elements.countryId, countries || [], "Избери държава", "nameBg", "id");
    } catch (error) {
      console.error(error);
      showMessage("Не успяхме да заредим държавите.", "error");
    }
  }

  async function loadRegions(countryId) {
    try {
      const regions = await getJson(`${API_BASE_URL}/api/lookups/regions/${countryId}`);
      fillSelect(elements.regionId, regions || [], "Избери област", "nameBg", "id");

      if (elements.regionId) {
        elements.regionId.disabled = false;
      }
    } catch (error) {
      console.error(error);
      showMessage("Не успяхме да заредим областите.", "error");
    }
  }

  async function loadCities(regionId) {
    try {
      const cities = await getJson(`${API_BASE_URL}/api/lookups/cities/${regionId}`);
      fillSelect(elements.cityId, cities || [], "Избери град", "nameBg", "id");

      if (elements.cityId) {
        elements.cityId.disabled = false;
      }
    } catch (error) {
      console.error(error);
      showMessage("Не успяхме да заредим градовете.", "error");
    }
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
        const errorMessage = await readErrorMessage(response, "Неуспешна регистрация.");
        showMessage(errorMessage, "error");
        return;
      }

      const data = await response.json();

      if (!data?.accessToken || !data?.user) {
        showMessage("Профилът беше създаден, но отговорът от сървъра е невалиден.", "error");
        return;
      }

      window.Auth.setAccessToken(data.accessToken);
      window.Auth.setCurrentUser(data.user);

      showMessage("Регистрацията е успешна. Пренасочваме...", "success");

      window.location.href = "index.html";
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
        return "";

      case "lastName":
        if (!data.lastName) return "Фамилията е задължителна.";
        if (data.lastName.length < 2) return "Фамилията трябва да е поне 2 символа.";
        return "";

      case "phone":
        if (!data.phone) return "Телефонът е задължителен.";
        if (!isValidPhone(data.phone)) return "Въведи валиден телефонен номер.";
        return "";

      case "email":
        if (!data.email) return "Имейлът е задължителен.";
        if (!isValidEmail(data.email)) return "Въведи валиден имейл адрес.";
        return "";

      case "password":
        if (!data.password) return "Паролата е задължителна.";
        if (data.password.length < 6) return "Паролата трябва да е поне 6 символа.";
        return "";

      case "confirmPassword":
        if (!data.confirmPassword) return "Потвърждението на паролата е задължително.";
        if (data.password !== data.confirmPassword) return "Паролите не съвпадат.";
        return "";

      case "countryId":
        if (!data.countryId) return "Държавата е задължителна.";
        return "";

      case "regionId":
        if (!data.regionId) return "Областта е задължителна.";
        return "";

      case "cityId":
        if (!data.cityId) return "Градът е задължителен.";
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

  function getFieldWrapper(fieldName) {
    if (fieldName === "privacyConsent") {
      return elements.privacyConsent?.closest(".consent-box") || null;
    }

    return elements[fieldName]?.closest(".auth-field") || null;
  }

  function setFieldError(fieldName, message) {
    const field = elements[fieldName];
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
    const field = elements[fieldName];
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
    const field = elements[fieldName];

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

  async function readErrorMessage(response, fallbackMessage) {
    try {
      const data = await response.json();

      if (typeof data === "string" && data.trim()) {
        return data;
      }

      if (data?.message) {
        return data.message;
      }

      if (data?.title) {
        return data.title;
      }

      if (data?.errors && typeof data.errors === "object") {
        const firstError = Object.values(data.errors).flat()?.[0];

        if (firstError) {
          return firstError;
        }
      }

      return fallbackMessage;
    } catch {
      return fallbackMessage;
    }
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
