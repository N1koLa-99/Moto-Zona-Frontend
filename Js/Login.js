(() => {
  const API_BASE_URL = window.Auth?.API_BASE_URL || "https://motomarketapi.azurewebsites.net";
  const REMEMBER_EMAIL_KEY = "motozona_remember_email";

  const elements = {
    form: document.getElementById("loginForm"),
    email: document.getElementById("email"),
    password: document.getElementById("password"),
    rememberMe: document.getElementById("rememberMe"),
    message: document.getElementById("loginMessage"),
    submitBtn: document.getElementById("loginSubmitBtn")
  };

  document.addEventListener("DOMContentLoaded", init);

  function init() {
    if (window.Auth?.isLoggedIn?.()) {
      window.location.href = getRedirectUrl();
      return;
    }

    hydrateRememberedEmail();
    bindEvents();
  }

  function bindEvents() {
    elements.form?.addEventListener("submit", onSubmit);

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

  function hydrateRememberedEmail() {
    const savedEmail = localStorage.getItem(REMEMBER_EMAIL_KEY);

    if (!savedEmail || !elements.email || !elements.rememberMe) {
      return;
    }

    elements.email.value = savedEmail;
    elements.rememberMe.checked = true;
  }

  async function onSubmit(event) {
    event.preventDefault();
    clearMessage();

    const email = elements.email.value.trim();
    const password = elements.password.value;

    if (!email || !password) {
      showMessage("Попълни имейл и парола.", "error");
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
        const errorMessage = await readErrorMessage(response, "Невалиден имейл или парола.");
        showMessage(errorMessage, "error");
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

      showMessage("Успешен вход. Пренасочваме...", "success");

      window.location.href = getRedirectUrl();
    } catch (error) {
      console.error(error);
      showMessage("Възникна проблем при входа. Опитай пак.", "error");
    } finally {
      setLoading(false);
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
    const params = new URLSearchParams(window.location.search);
    return params.get("returnUrl") || "index.html";
  }

  function setLoading(isLoading) {
    if (!elements.submitBtn) return;

    elements.submitBtn.disabled = isLoading;
    elements.submitBtn.textContent = isLoading ? "Изчакване..." : "Вход";
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
})();
