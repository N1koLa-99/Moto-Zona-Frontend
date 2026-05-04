(() => {
  const API_BASE_URL = (window.Auth?.API_BASE_URL || "https://motomarketapi.azurewebsites.net").replace(/\/+$/, "");

  const state = {
    resendInFlight: false,
    verifyInFlight: false
  };

  const elements = {
    form: document.getElementById("verifyForm"),
    email: document.getElementById("verifyEmail"),
    code: document.getElementById("verifyCode"),
    emailError: document.getElementById("verifyEmailError"),
    codeError: document.getElementById("verifyCodeError"),
    message: document.getElementById("verifyMessage"),
    submitBtn: document.getElementById("verifySubmitBtn"),
    resendBtn: document.getElementById("resendVerifyCodeBtn"),
    emailPreview: document.getElementById("verifyEmailPreview"),
    loginLink: document.getElementById("verifyLoginLink")
  };

  document.addEventListener("DOMContentLoaded", init);

  function init() {
    if (window.Auth?.isLoggedIn?.()) {
      window.location.href = "index.html";
      return;
    }

    hydrateFromQuery();
    bindEvents();
    applyQueryState();
    updateEmailPreview();
    syncLoginLink();
  }

  function bindEvents() {
    elements.form?.addEventListener("submit", onSubmit);
    elements.resendBtn?.addEventListener("click", onResendCode);

    elements.email?.addEventListener("input", () => {
      clearFieldError("email");
      updateEmailPreview();
      syncLoginLink();
    });

    elements.email?.addEventListener("blur", () => {
      validateEmail();
      updateEmailPreview();
      syncLoginLink();
    });

    elements.code?.addEventListener("input", () => {
      elements.code.value = sanitizeCode(elements.code.value);
      clearFieldError("code");
    });

    elements.code?.addEventListener("blur", validateCode);
  }

  function hydrateFromQuery() {
    const emailFromQuery = window.Auth?.normalizeEmail?.(window.Auth.getQueryParam("email"));

    if (emailFromQuery && elements.email) {
      elements.email.value = emailFromQuery;
    }
  }

  function applyQueryState() {
    const status = window.Auth?.getQueryParam?.("status");

    if (status === "verification-required") {
      showMessage("Изпратихме код за потвърждение. Въведи го тук, за да активираш профила си.", "info");
    }
  }

  async function onSubmit(event) {
    event.preventDefault();
    clearMessage();

    const isEmailValid = validateEmail();
    const isCodeValid = validateCode();

    if (!isEmailValid || !isCodeValid || state.verifyInFlight) {
      return;
    }

    state.verifyInFlight = true;
    setVerifyLoading(true);

    try {
      const response = await window.Auth.authFetch(`${API_BASE_URL}/api/auth/verify-email`, {
        method: "POST",
        body: JSON.stringify({
          email: getEmailValue(),
          code: getCodeValue()
        })
      });

      const message = await window.Auth.readApiMessage(
        response,
        "Имейлът е потвърден успешно. Вече можеш да влезеш в профила си."
      );

      if (!response.ok) {
        showMessage(message, "error");
        return;
      }

      showMessage(`${message} Пренасочваме те към входа...`, "success");

      window.setTimeout(() => {
        window.location.href = window.Auth.buildPageUrl("Login.html", {
          email: getEmailValue(),
          status: "email-verified"
        });
      }, 1200);
    } catch (error) {
      console.error(error);
      showMessage("Не успяхме да потвърдим имейла. Опитай пак след малко.", "error");
    } finally {
      state.verifyInFlight = false;
      setVerifyLoading(false);
    }
  }

  async function onResendCode() {
    clearMessage();

    if (!validateEmail() || state.resendInFlight) {
      return;
    }

    state.resendInFlight = true;
    setResendLoading(true);

    try {
      const response = await window.Auth.authFetch(`${API_BASE_URL}/api/auth/resend-email-code`, {
        method: "POST",
        body: JSON.stringify({
          email: getEmailValue()
        })
      });

      const message = await window.Auth.readApiMessage(
        response,
        "Ако имейлът съществува и не е потвърден, изпратихме нов код."
      );

      showMessage(message, response.ok ? "info" : "error");
    } catch (error) {
      console.error(error);
      showMessage("Не успяхме да изпратим нов код. Опитай пак след малко.", "error");
    } finally {
      state.resendInFlight = false;
      setResendLoading(false);
    }
  }

  function validateEmail() {
    const email = getEmailValue();

    if (!email) {
      setFieldError("email", "Имейлът е задължителен.");
      return false;
    }

    if (!window.Auth?.isValidEmail?.(email)) {
      setFieldError("email", "Въведи валиден имейл адрес.");
      return false;
    }

    clearFieldError("email");
    return true;
  }

  function validateCode() {
    const code = getCodeValue();

    if (!code) {
      setFieldError("code", "Кодът е задължителен.");
      return false;
    }

    if (!/^\d{6}$/.test(code)) {
      setFieldError("code", "Кодът трябва да е точно 6 цифри.");
      return false;
    }

    clearFieldError("code");
    return true;
  }

  function updateEmailPreview() {
    if (!elements.emailPreview) {
      return;
    }

    const email = getEmailValue();
    elements.emailPreview.textContent = email || "Добави имейл адреса, с който се регистрира";
  }

  function syncLoginLink() {
    if (!elements.loginLink) {
      return;
    }

    elements.loginLink.href = window.Auth.buildPageUrl("Login.html", {
      email: getEmailValue() || null
    });
  }

  function setFieldError(fieldName, message) {
    const input = getInput(fieldName);
    const errorElement = getErrorElement(fieldName);
    const wrapper = input?.closest(".auth-field");

    input?.setAttribute("aria-invalid", "true");
    wrapper?.classList.add("has-error");

    if (errorElement?.id) {
      input?.setAttribute("aria-describedby", errorElement.id);
      errorElement.textContent = message;
      errorElement.classList.add("is-visible");
    }
  }

  function clearFieldError(fieldName) {
    const input = getInput(fieldName);
    const errorElement = getErrorElement(fieldName);
    const wrapper = input?.closest(".auth-field");

    input?.removeAttribute("aria-invalid");
    input?.removeAttribute("aria-describedby");
    wrapper?.classList.remove("has-error");

    if (errorElement) {
      errorElement.textContent = "";
      errorElement.classList.remove("is-visible");
    }
  }

  function getInput(fieldName) {
    return fieldName === "email" ? elements.email : elements.code;
  }

  function getErrorElement(fieldName) {
    return fieldName === "email" ? elements.emailError : elements.codeError;
  }

  function getEmailValue() {
    return window.Auth?.normalizeEmail?.(elements.email?.value) || "";
  }

  function getCodeValue() {
    return sanitizeCode(elements.code?.value || "");
  }

  function sanitizeCode(value) {
    return String(value || "").replace(/\D/g, "").slice(0, 6);
  }

  function setVerifyLoading(isLoading) {
    if (!elements.submitBtn) return;

    elements.submitBtn.disabled = isLoading;
    elements.submitBtn.textContent = isLoading ? "Потвърждаваме..." : "Потвърди имейла";
  }

  function setResendLoading(isLoading) {
    if (!elements.resendBtn) return;

    elements.resendBtn.disabled = isLoading;
    elements.resendBtn.textContent = isLoading ? "Изпращане..." : "Изпрати нов код";
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
})();
