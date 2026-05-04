(() => {
  const API_BASE_URL = (window.Auth?.API_BASE_URL || "https://motomarketapi.azurewebsites.net").replace(/\/+$/, "");
  const REMEMBER_EMAIL_KEY = "motozona_remember_email";
  const UNVERIFIED_EMAIL_TEXT = "не е потвърден";

  const state = {
    resendInFlight: false
  };

  const elements = {
    form: document.getElementById("loginForm"),
    email: document.getElementById("email"),
    password: document.getElementById("password"),
    rememberMe: document.getElementById("rememberMe"),
    message: document.getElementById("loginMessage"),
    submitBtn: document.getElementById("loginSubmitBtn"),
    forgotPasswordLink: document.getElementById("forgotPasswordLink"),
    assistBox: document.getElementById("loginAssistBox"),
    assistTitle: document.getElementById("loginAssistTitle"),
    assistText: document.getElementById("loginAssistText"),
    verifyLink: document.getElementById("loginVerifyLink"),
    resendBtn: document.getElementById("loginResendBtn")
  };

  document.addEventListener("DOMContentLoaded", init);

  function init() {
    if (window.Auth?.isLoggedIn?.()) {
      window.location.href = getRedirectUrl();
      return;
    }

    hydrateEmail();
    applyQueryState();
    bindEvents();
    syncRecoveryLinks();
  }

  function bindEvents() {
    elements.form?.addEventListener("submit", onSubmit);
    elements.resendBtn?.addEventListener("click", onResendVerificationCode);

    elements.email?.addEventListener("input", () => {
      syncRecoveryLinks();
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

  function hydrateEmail() {
    const rememberedEmail = localStorage.getItem(REMEMBER_EMAIL_KEY);
    const emailFromQuery = window.Auth?.normalizeEmail?.(window.Auth.getQueryParam("email"));

    if (rememberedEmail && elements.email && elements.rememberMe) {
      elements.email.value = rememberedEmail;
      elements.rememberMe.checked = true;
    }

    if (emailFromQuery && elements.email) {
      elements.email.value = emailFromQuery;
    }
  }

  function applyQueryState() {
    const status = window.Auth?.getQueryParam?.("status");
    const email = getEmailValue();

    switch (status) {
      case "verification-required":
        showMessage("Профилът е създаден. Въведи кода от имейла си, за да активираш акаунта.", "info");
        showVerificationHelp(email);
        break;

      case "email-verified":
        showMessage("Имейлът е потвърден успешно. Вече можеш да влезеш в профила си.", "success");
        hideVerificationHelp();
        break;

      case "password-reset":
        showMessage("Паролата е сменена успешно. Влез с новата си парола.", "success");
        hideVerificationHelp();
        break;

      default:
        hideVerificationHelp();
        break;
    }
  }

  async function onSubmit(event) {
    event.preventDefault();
    clearMessage();

    const email = getEmailValue();
    const password = elements.password?.value || "";

    if (!email || !password) {
      showMessage("Попълни имейл и парола.", "error");
      return;
    }

    if (!window.Auth?.isValidEmail?.(email)) {
      showMessage("Въведи валиден имейл адрес.", "error");
      elements.email?.focus();
      return;
    }

    setLoading(true);

    try {
      const response = await window.Auth.authFetch(`${API_BASE_URL}/api/auth/login`, {
        method: "POST",
        body: JSON.stringify({
          email,
          password
        })
      });

      if (!response.ok) {
        const errorMessage = await window.Auth.readApiMessage(response, "Невалиден имейл или парола.");
        showMessage(errorMessage, "error");

        if (isUnverifiedEmailMessage(errorMessage)) {
          showVerificationHelp(email);
        } else {
          hideVerificationHelp();
        }

        return;
      }

      const data = await response.json();

      if (!data?.accessToken || !data?.user) {
        showMessage("Получихме невалиден отговор от сървъра.", "error");
        return;
      }

      window.Auth.setAccessToken(data.accessToken);
      window.Auth.setCurrentUser(data.user);
      persistRememberMe(email);
      hideVerificationHelp();
      showMessage("Успешен вход. Пренасочваме...", "success");

      window.location.href = getRedirectUrl();
    } catch (error) {
      console.error(error);
      showMessage("Възникна проблем при входа. Опитай пак.", "error");
    } finally {
      setLoading(false);
    }
  }

  async function onResendVerificationCode() {
    const email = getEmailValue();

    if (!window.Auth?.isValidEmail?.(email)) {
      showMessage("Въведи валиден имейл, за да изпратим нов код.", "error");
      elements.email?.focus();
      return;
    }

    if (state.resendInFlight) {
      return;
    }

    state.resendInFlight = true;
    setResendLoading(true);
    clearMessage();

    try {
      const response = await window.Auth.authFetch(`${API_BASE_URL}/api/auth/resend-email-code`, {
        method: "POST",
        body: JSON.stringify({
          email
        })
      });

      const message = await window.Auth.readApiMessage(
        response,
        "Ако имейлът съществува и не е потвърден, изпратихме нов код."
      );

      showMessage(message, response.ok ? "info" : "error");

      if (response.ok) {
        showVerificationHelp(email);
      }
    } catch (error) {
      console.error(error);
      showMessage("Не успяхме да изпратим нов код. Опитай пак след малко.", "error");
    } finally {
      state.resendInFlight = false;
      setResendLoading(false);
    }
  }

  function showVerificationHelp(email) {
    if (!elements.assistBox) {
      return;
    }

    const normalizedEmail = window.Auth?.normalizeEmail?.(email) || "";

    if (elements.assistTitle) {
      elements.assistTitle.textContent = "Имейлът чака потвърждение";
    }

    if (elements.assistText) {
      elements.assistText.textContent = normalizedEmail
        ? `Изпратихме код до ${normalizedEmail}. Можеш да потвърдиш имейла си веднага или да поискаш нов код.`
        : "Можеш веднага да потвърдиш имейла си с кода от пощата или да поискаш нов код.";
    }

    elements.assistBox.classList.remove("hidden");
    syncRecoveryLinks();
  }

  function hideVerificationHelp() {
    elements.assistBox?.classList.add("hidden");
  }

  function syncRecoveryLinks() {
    const email = getEmailValue();
    const verifyUrl = window.Auth?.buildPageUrl?.("VerifyEmail.html", {
      email: email || null
    });
    const forgotUrl = window.Auth?.buildPageUrl?.("ForgotPassword.html", {
      email: email || null
    });

    if (elements.verifyLink && verifyUrl) {
      elements.verifyLink.href = verifyUrl;
    }

    if (elements.forgotPasswordLink && forgotUrl) {
      elements.forgotPasswordLink.href = forgotUrl;
    }
  }

  function persistRememberMe(email) {
    if (!elements.rememberMe) return;

    if (elements.rememberMe.checked) {
      localStorage.setItem(REMEMBER_EMAIL_KEY, email);
    } else {
      localStorage.removeItem(REMEMBER_EMAIL_KEY);
    }
  }

  function getRedirectUrl() {
    return window.Auth?.getQueryParam?.("returnUrl") || "index.html";
  }

  function getEmailValue() {
    return window.Auth?.normalizeEmail?.(elements.email?.value) || "";
  }

  function isUnverifiedEmailMessage(message) {
    return String(message || "").toLowerCase().includes(UNVERIFIED_EMAIL_TEXT);
  }

  function setLoading(isLoading) {
    if (!elements.submitBtn) return;

    elements.submitBtn.disabled = isLoading;
    elements.submitBtn.textContent = isLoading ? "Изчакване..." : "Вход";
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
