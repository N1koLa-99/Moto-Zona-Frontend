(() => {
  const API_BASE_URL = (window.Auth?.API_BASE_URL || "https://motomarketapi.azurewebsites.net").replace(/\/+$/, "");

  const state = {
    currentStep: 1,
    requestInFlight: false,
    resendInFlight: false,
    resetInFlight: false
  };

  const elements = {
    message: document.getElementById("recoveryMessage"),
    progressFill: document.getElementById("recoveryProgressFill"),
    stepDots: [...document.querySelectorAll("[data-recovery-step-dot]")],
    panels: [...document.querySelectorAll("[data-recovery-panel]")],

    requestForm: document.getElementById("requestResetForm"),
    requestEmail: document.getElementById("requestEmail"),
    requestEmailError: document.getElementById("requestEmailError"),
    requestBtn: document.getElementById("requestResetBtn"),

    resetForm: document.getElementById("resetPasswordForm"),
    resetEmail: document.getElementById("resetEmail"),
    resetEmailError: document.getElementById("resetEmailError"),
    resetCode: document.getElementById("resetCode"),
    resetCodeError: document.getElementById("resetCodeError"),
    newPassword: document.getElementById("newPassword"),
    newPasswordError: document.getElementById("newPasswordError"),
    confirmNewPassword: document.getElementById("confirmNewPassword"),
    confirmNewPasswordError: document.getElementById("confirmNewPasswordError"),
    resetBtn: document.getElementById("resetPasswordSubmitBtn"),
    resendBtn: document.getElementById("resendResetCodeBtn"),
    backBtn: document.getElementById("backToRequestStepBtn"),
    emailPreview: document.getElementById("resetEmailPreview"),
    loginLink: document.getElementById("recoveryLoginLink")
  };

  document.addEventListener("DOMContentLoaded", init);

  function init() {
    if (window.Auth?.isLoggedIn?.()) {
      window.location.href = "index.html";
      return;
    }

    hydrateFromQuery();
    bindEvents();
    render();
    syncLoginLink();
  }

  function hydrateFromQuery() {
    const emailFromQuery = window.Auth?.normalizeEmail?.(window.Auth.getQueryParam("email"));
    const stepFromQuery = Number(window.Auth?.getQueryParam?.("step"));

    if (emailFromQuery) {
      if (elements.requestEmail) {
        elements.requestEmail.value = emailFromQuery;
      }

      if (elements.resetEmail) {
        elements.resetEmail.value = emailFromQuery;
      }
    }

    if (stepFromQuery === 2) {
      state.currentStep = 2;
    }
  }

  function bindEvents() {
    elements.requestForm?.addEventListener("submit", onRequestCode);
    elements.resetForm?.addEventListener("submit", onResetPassword);
    elements.resendBtn?.addEventListener("click", onResendCode);
    elements.backBtn?.addEventListener("click", () => {
      syncEmails("reset");
      clearMessage();
      goToStep(1);
    });

    elements.requestEmail?.addEventListener("input", () => {
      clearFieldError("requestEmail");
      syncEmails("request");
      syncLoginLink();
    });
    elements.requestEmail?.addEventListener("blur", validateRequestEmail);

    elements.resetEmail?.addEventListener("input", () => {
      clearFieldError("resetEmail");
      syncEmails("reset");
      updateEmailPreview();
      syncLoginLink();
    });
    elements.resetEmail?.addEventListener("blur", () => {
      validateResetEmail();
      updateEmailPreview();
      syncLoginLink();
    });

    elements.resetCode?.addEventListener("input", () => {
      elements.resetCode.value = sanitizeCode(elements.resetCode.value);
      clearFieldError("resetCode");
    });
    elements.resetCode?.addEventListener("blur", validateResetCode);

    elements.newPassword?.addEventListener("input", () => {
      clearFieldError("newPassword");

      if ((elements.confirmNewPassword?.value || "").length > 0) {
        validateConfirmNewPassword();
      }
    });
    elements.newPassword?.addEventListener("blur", validateNewPassword);

    elements.confirmNewPassword?.addEventListener("input", () => {
      clearFieldError("confirmNewPassword");
    });
    elements.confirmNewPassword?.addEventListener("blur", validateConfirmNewPassword);

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

  async function onRequestCode(event) {
    event.preventDefault();
    clearMessage();

    if (!validateRequestEmail() || state.requestInFlight) {
      return;
    }

    state.requestInFlight = true;
    setRequestLoading(true);

    try {
      const response = await window.Auth.authFetch(`${API_BASE_URL}/api/auth/forgot-password`, {
        method: "POST",
        body: JSON.stringify({
          email: getRequestEmailValue()
        })
      });

      const message = await window.Auth.readApiMessage(
        response,
        "Ако има профил с този имейл, изпратихме код за смяна на парола."
      );

      showMessage(message, response.ok ? "info" : "error");

      if (!response.ok) {
        return;
      }

      syncEmails("request");
      goToStep(2);

      window.requestAnimationFrame(() => {
        elements.resetCode?.focus();
      });
    } catch (error) {
      console.error(error);
      showMessage("Не успяхме да изпратим код. Опитай пак след малко.", "error");
    } finally {
      state.requestInFlight = false;
      setRequestLoading(false);
    }
  }

  async function onResendCode() {
    clearMessage();

    if (!validateResetEmail() || state.resendInFlight) {
      return;
    }

    state.resendInFlight = true;
    setResendLoading(true);

    try {
      const response = await window.Auth.authFetch(`${API_BASE_URL}/api/auth/forgot-password`, {
        method: "POST",
        body: JSON.stringify({
          email: getResetEmailValue()
        })
      });

      const message = await window.Auth.readApiMessage(
        response,
        "Ако има профил с този имейл, изпратихме код за смяна на парола."
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

  async function onResetPassword(event) {
    event.preventDefault();
    clearMessage();

    const isValid =
      validateResetEmail() &&
      validateResetCode() &&
      validateNewPassword() &&
      validateConfirmNewPassword();

    if (!isValid || state.resetInFlight) {
      return;
    }

    state.resetInFlight = true;
    setResetLoading(true);

    try {
      const response = await window.Auth.authFetch(`${API_BASE_URL}/api/auth/reset-password`, {
        method: "POST",
        body: JSON.stringify({
          email: getResetEmailValue(),
          code: getResetCodeValue(),
          newPassword: getNewPasswordValue(),
          confirmNewPassword: getConfirmNewPasswordValue()
        })
      });

      const message = await window.Auth.readApiMessage(
        response,
        "Паролата е сменена успешно. Влез с новата парола."
      );

      if (!response.ok) {
        showMessage(message, "error");
        return;
      }

      showMessage(`${message} Пренасочваме те към входа...`, "success");

      window.setTimeout(() => {
        window.location.href = window.Auth.buildPageUrl("Login.html", {
          email: getResetEmailValue(),
          status: "password-reset"
        });
      }, 1200);
    } catch (error) {
      console.error(error);
      showMessage("Не успяхме да сменим паролата. Опитай пак след малко.", "error");
    } finally {
      state.resetInFlight = false;
      setResetLoading(false);
    }
  }

  function goToStep(stepNumber) {
    state.currentStep = stepNumber;
    render();
  }

  function render() {
    const progressPercent = state.currentStep <= 1 ? 0 : 100;

    if (elements.progressFill) {
      elements.progressFill.style.width = `${progressPercent}%`;
    }

    elements.stepDots.forEach((dot) => {
      const stepNumber = Number(dot.dataset.recoveryStepDot);
      dot.classList.toggle("active", stepNumber === state.currentStep);
      dot.classList.toggle("done", stepNumber < state.currentStep);
    });

    elements.panels.forEach((panel) => {
      const stepNumber = Number(panel.dataset.recoveryPanel);
      panel.classList.toggle("active", stepNumber === state.currentStep);
    });

    updateEmailPreview();
  }

  function syncEmails(source) {
    if (source === "request") {
      const email = getRequestEmailValue();

      if (elements.resetEmail) {
        elements.resetEmail.value = email;
      }
    } else {
      const email = getResetEmailValue();

      if (elements.requestEmail) {
        elements.requestEmail.value = email;
      }
    }
  }

  function updateEmailPreview() {
    if (!elements.emailPreview) {
      return;
    }

    const email = getResetEmailValue() || getRequestEmailValue();
    elements.emailPreview.textContent = email || "Добави имейл, за да продължиш";
  }

  function syncLoginLink() {
    if (!elements.loginLink) {
      return;
    }

    const email = getResetEmailValue() || getRequestEmailValue();
    elements.loginLink.href = window.Auth.buildPageUrl("Login.html", {
      email: email || null
    });
  }

  function validateRequestEmail() {
    const email = getRequestEmailValue();

    if (!email) {
      setFieldError("requestEmail", "Имейлът е задължителен.");
      return false;
    }

    if (!window.Auth?.isValidEmail?.(email)) {
      setFieldError("requestEmail", "Въведи валиден имейл адрес.");
      return false;
    }

    clearFieldError("requestEmail");
    return true;
  }

  function validateResetEmail() {
    const email = getResetEmailValue();

    if (!email) {
      setFieldError("resetEmail", "Имейлът е задължителен.");
      return false;
    }

    if (!window.Auth?.isValidEmail?.(email)) {
      setFieldError("resetEmail", "Въведи валиден имейл адрес.");
      return false;
    }

    clearFieldError("resetEmail");
    return true;
  }

  function validateResetCode() {
    const code = getResetCodeValue();

    if (!code) {
      setFieldError("resetCode", "Кодът е задължителен.");
      return false;
    }

    if (!/^\d{6}$/.test(code)) {
      setFieldError("resetCode", "Кодът трябва да е точно 6 цифри.");
      return false;
    }

    clearFieldError("resetCode");
    return true;
  }

  function validateNewPassword() {
    const password = getNewPasswordValue();

    if (!password) {
      setFieldError("newPassword", "Новата парола е задължителна.");
      return false;
    }

    if (password.length < 6) {
      setFieldError("newPassword", "Паролата трябва да е поне 6 символа.");
      return false;
    }

    clearFieldError("newPassword");
    return true;
  }

  function validateConfirmNewPassword() {
    const confirmPassword = getConfirmNewPasswordValue();

    if (!confirmPassword) {
      setFieldError("confirmNewPassword", "Потвърждението е задължително.");
      return false;
    }

    if (confirmPassword !== getNewPasswordValue()) {
      setFieldError("confirmNewPassword", "Паролите не съвпадат.");
      return false;
    }

    clearFieldError("confirmNewPassword");
    return true;
  }

  function setFieldError(fieldName, message) {
    const input = elements[fieldName];
    const errorElement = elements[`${fieldName}Error`];
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
    const input = elements[fieldName];
    const errorElement = elements[`${fieldName}Error`];
    const wrapper = input?.closest(".auth-field");

    input?.removeAttribute("aria-invalid");
    input?.removeAttribute("aria-describedby");
    wrapper?.classList.remove("has-error");

    if (errorElement) {
      errorElement.textContent = "";
      errorElement.classList.remove("is-visible");
    }
  }

  function getRequestEmailValue() {
    return window.Auth?.normalizeEmail?.(elements.requestEmail?.value) || "";
  }

  function getResetEmailValue() {
    return window.Auth?.normalizeEmail?.(elements.resetEmail?.value) || "";
  }

  function getResetCodeValue() {
    return sanitizeCode(elements.resetCode?.value || "");
  }

  function getNewPasswordValue() {
    return elements.newPassword?.value || "";
  }

  function getConfirmNewPasswordValue() {
    return elements.confirmNewPassword?.value || "";
  }

  function sanitizeCode(value) {
    return String(value || "").replace(/\D/g, "").slice(0, 6);
  }

  function setRequestLoading(isLoading) {
    if (!elements.requestBtn) return;

    elements.requestBtn.disabled = isLoading;
    elements.requestBtn.textContent = isLoading ? "Изпращане..." : "Изпрати код";
  }

  function setResendLoading(isLoading) {
    if (!elements.resendBtn) return;

    elements.resendBtn.disabled = isLoading;
    elements.resendBtn.textContent = isLoading ? "Изпращане..." : "Изпрати нов код";
  }

  function setResetLoading(isLoading) {
    if (!elements.resetBtn) return;

    elements.resetBtn.disabled = isLoading;
    elements.resetBtn.textContent = isLoading ? "Запазване..." : "Смени паролата";
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
