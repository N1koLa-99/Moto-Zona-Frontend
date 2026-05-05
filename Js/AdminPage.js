(() => {
  const API_BASE_URL = (window.Auth?.API_BASE_URL || "https://motomarketapi.azurewebsites.net").replace(/\/+$/, "");

  const FIELD_LABELS = {
    id: "ID",
    userId: "ID на потребител",
    listingId: "ID на обява",
    paymentId: "ID на плащане",
    fullName: "Име",
    firstName: "Име",
    lastName: "Фамилия",
    companyName: "Фирма",
    email: "Имейл",
    phone: "Телефон",
    mobilePhone: "Телефон",
    contactPhone: "Телефон",
    accountType: "Тип акаунт",
    roles: "Роли",
    role: "Роля",
    status: "Статус",
    actionType: "Тип действие",
    type: "Тип",
    title: "Заглавие",
    description: "Описание",
    createdAt: "Създадено",
    updatedAt: "Обновено",
    paidAt: "Платено",
    amount: "Сума",
    amountEur: "Сума",
    amountEUR: "Сума",
    currencyCode: "Валута",
    city: "Град",
    region: "Област",
    country: "Държава",
    price: "Цена",
    priceEur: "Цена",
    priceEUR: "Цена"
  };

  const state = {
    accessLocked: false,
    currentUser: null,
    selectedUserId: null,
    users: {
      search: "",
      page: 1,
      pageSize: 20,
      data: null
    },
    userDetails: {
      data: null
    },
    userListings: {
      page: 1,
      pageSize: 20,
      data: null
    },
    payments: {
      search: "",
      page: 1,
      pageSize: 20,
      data: null
    },
    pending: {
      status: "",
      page: 1,
      pageSize: 20,
      data: null
    }
  };

  const elements = {
    accessGuard: document.getElementById("accessGuard"),
    accessGuardTitle: document.getElementById("accessGuardTitle"),
    accessGuardText: document.getElementById("accessGuardText"),
    adminShell: document.getElementById("adminShell"),
    accessNotice: document.getElementById("accessNotice"),
    logoutBtn: document.getElementById("logoutBtn"),
    refreshAllBtn: document.getElementById("refreshAllBtn"),

    usersCountValue: document.getElementById("usersCountValue"),
    usersCountMeta: document.getElementById("usersCountMeta"),
    paymentsCountValue: document.getElementById("paymentsCountValue"),
    paymentsCountMeta: document.getElementById("paymentsCountMeta"),
    pendingCountValue: document.getElementById("pendingCountValue"),
    pendingCountMeta: document.getElementById("pendingCountMeta"),
    selectedListingsCountValue: document.getElementById("selectedListingsCountValue"),
    selectedListingsMeta: document.getElementById("selectedListingsMeta"),

    usersMeta: document.getElementById("usersMeta"),
    usersSearchForm: document.getElementById("usersSearchForm"),
    usersSearchInput: document.getElementById("usersSearchInput"),
    usersPageSize: document.getElementById("usersPageSize"),
    usersRefreshBtn: document.getElementById("usersRefreshBtn"),
    usersList: document.getElementById("usersList"),
    usersPagination: document.getElementById("usersPagination"),

    selectedUserTitle: document.getElementById("selectedUserTitle"),
    selectedUserMeta: document.getElementById("selectedUserMeta"),
    userDetailsRefreshBtn: document.getElementById("userDetailsRefreshBtn"),
    userDetailsGrid: document.getElementById("userDetailsGrid"),

    userListingsMeta: document.getElementById("userListingsMeta"),
    userListingsPageSize: document.getElementById("userListingsPageSize"),
    userListingsRefreshBtn: document.getElementById("userListingsRefreshBtn"),
    userListingsList: document.getElementById("userListingsList"),
    userListingsPagination: document.getElementById("userListingsPagination"),

    paymentsMeta: document.getElementById("paymentsMeta"),
    paymentsSearchForm: document.getElementById("paymentsSearchForm"),
    paymentsSearchInput: document.getElementById("paymentsSearchInput"),
    paymentsPageSize: document.getElementById("paymentsPageSize"),
    paymentsRefreshBtn: document.getElementById("paymentsRefreshBtn"),
    paymentsList: document.getElementById("paymentsList"),
    paymentsPagination: document.getElementById("paymentsPagination"),

    pendingMeta: document.getElementById("pendingMeta"),
    pendingStatusFilter: document.getElementById("pendingStatusFilter"),
    pendingPageSize: document.getElementById("pendingPageSize"),
    pendingRefreshBtn: document.getElementById("pendingRefreshBtn"),
    pendingList: document.getElementById("pendingList"),
    pendingPagination: document.getElementById("pendingPagination")
  };

  document.addEventListener("DOMContentLoaded", init);

  async function init() {
    bindEvents();
    syncInitialInputs();

    const user = await ensureAdminSession();
    if (!user) return;

    state.currentUser = user;
    showAdminShell();
    syncAccessNotice(user);
    renderSelectedUserPlaceholder();
    await refreshAll();
  }

  function bindEvents() {
    elements.logoutBtn?.addEventListener("click", () => window.Auth?.logoutUser?.());
    elements.refreshAllBtn?.addEventListener("click", () => void refreshAll());
    elements.usersRefreshBtn?.addEventListener("click", () => void reloadUsersFlow());
    elements.userDetailsRefreshBtn?.addEventListener("click", () => void refreshSelectedUserPanels());
    elements.userListingsRefreshBtn?.addEventListener("click", () => void loadSelectedUserListings());
    elements.paymentsRefreshBtn?.addEventListener("click", () => void loadPayments());
    elements.pendingRefreshBtn?.addEventListener("click", () => void loadPendingActions());

    elements.usersSearchForm?.addEventListener("submit", (event) => {
      event.preventDefault();
      state.users.search = (elements.usersSearchInput?.value || "").trim();
      state.users.page = 1;
      void reloadUsersFlow();
    });

    elements.paymentsSearchForm?.addEventListener("submit", (event) => {
      event.preventDefault();
      state.payments.search = (elements.paymentsSearchInput?.value || "").trim();
      state.payments.page = 1;
      void loadPayments();
    });

    elements.usersPageSize?.addEventListener("change", () => {
      state.users.pageSize = toPositiveInt(elements.usersPageSize?.value, 20);
      state.users.page = 1;
      void reloadUsersFlow();
    });

    elements.userListingsPageSize?.addEventListener("change", () => {
      state.userListings.pageSize = toPositiveInt(elements.userListingsPageSize?.value, 20);
      state.userListings.page = 1;
      void loadSelectedUserListings();
    });

    elements.paymentsPageSize?.addEventListener("change", () => {
      state.payments.pageSize = toPositiveInt(elements.paymentsPageSize?.value, 20);
      state.payments.page = 1;
      void loadPayments();
    });

    elements.pendingPageSize?.addEventListener("change", () => {
      state.pending.pageSize = toPositiveInt(elements.pendingPageSize?.value, 20);
      state.pending.page = 1;
      void loadPendingActions();
    });

    elements.pendingStatusFilter?.addEventListener("change", () => {
      state.pending.status = (elements.pendingStatusFilter?.value || "").trim();
      state.pending.page = 1;
      void loadPendingActions();
    });

    document.addEventListener("click", onDocumentClick);
  }

  function syncInitialInputs() {
    if (elements.usersPageSize) elements.usersPageSize.value = String(state.users.pageSize);
    if (elements.userListingsPageSize) elements.userListingsPageSize.value = String(state.userListings.pageSize);
    if (elements.paymentsPageSize) elements.paymentsPageSize.value = String(state.payments.pageSize);
    if (elements.pendingPageSize) elements.pendingPageSize.value = String(state.pending.pageSize);
  }

  async function ensureAdminSession() {
    const returnUrl = getCurrentRelativeUrl();

    try {
      const user = await window.Auth?.ensureAdminAccess?.({
        redirect: false,
        returnUrl,
        probe: true
      });

      if (user) {
        return user;
      }
    } catch (error) {
      console.error(error);
    }

    lockAdminPanel(
      "Достъпът е ограничен",
      "Тази страница е достъпна само за потребители с роля ADMIN. Ако смяташ, че това е грешка, провери ролята на акаунта си."
    );
    return null;
  }

  function showAdminShell() {
    elements.accessGuard?.classList.add("hidden");
    elements.adminShell?.classList.remove("hidden");
  }

  function lockAdminPanel(title, text) {
    state.accessLocked = true;
    elements.adminShell?.classList.add("hidden");
    elements.accessGuard?.classList.remove("hidden");

    if (elements.accessGuardTitle) {
      elements.accessGuardTitle.textContent = title;
    }

    if (elements.accessGuardText) {
      elements.accessGuardText.textContent = text;
    }
  }

  function syncAccessNotice(user) {
    const displayName = getUserDisplayName(user) || "Админ";
    if (elements.accessNotice) {
      elements.accessNotice.textContent = `${displayName}, тук можеш да следиш потребители, плащания, чакащи действия и обявите на всеки потребител.`;
    }
  }

  async function refreshAll() {
    if (state.accessLocked) return;

    setButtonLoading(elements.refreshAllBtn, true, "Обновяване...");

    try {
      await Promise.all([
        loadUsers(),
        loadPayments(),
        loadPendingActions()
      ]);

      await refreshSelectedUserPanels();
    } finally {
      setButtonLoading(elements.refreshAllBtn, false, "Обнови всичко");
    }
  }

  async function reloadUsersFlow() {
    await loadUsers();
    await refreshSelectedUserPanels();
  }

  async function refreshSelectedUserPanels() {
    if (!state.selectedUserId) {
      clearSelectedUserPanels();
      return;
    }

    await Promise.all([
      loadSelectedUserDetails(),
      loadSelectedUserListings()
    ]);
  }

  async function loadUsers() {
    renderPanelState(elements.usersList, "Зареждаме потребителите...");
    if (elements.usersPagination) {
      elements.usersPagination.innerHTML = "";
    }

    try {
      const params = {
        page: state.users.page,
        pageSize: state.users.pageSize
      };

      if (state.users.search) {
        params.searchTerm = state.users.search;
      }

      const payload = await authFetchJson(buildUrl("/api/admin/users", params));
      state.users.data = normalizePagedResult(payload, state.users.page, state.users.pageSize);
      syncSelectedUserFromUsersData();
      renderUsers();
      return state.users.data;
    } catch (error) {
      state.users.data = null;
      handlePanelError(error, {
        target: elements.usersList,
        meta: elements.usersMeta,
        emptyTarget: elements.usersPagination,
        fallbackMessage: "Не успяхме да заредим потребителите."
      });
      setOverviewCard(elements.usersCountValue, elements.usersCountMeta, "-", "Грешка при зареждане");
      clearSelectedUserPanels();
      return null;
    }
  }

  async function loadSelectedUserDetails() {
    if (!state.selectedUserId) {
      renderSelectedUserPlaceholder();
      return null;
    }

    renderPanelState(elements.userDetailsGrid, "Зареждаме детайлите за потребителя...");

    try {
      const payload = await authFetchJson(`${API_BASE_URL}/api/admin/users/${encodeURIComponent(state.selectedUserId)}`);
      state.userDetails.data = payload;
      renderSelectedUserDetails();
      return payload;
    } catch (error) {
      state.userDetails.data = null;
      handlePanelError(error, {
        target: elements.userDetailsGrid,
        meta: elements.selectedUserMeta,
        fallbackMessage: "Не успяхме да заредим детайлите за потребителя."
      });
      return null;
    }
  }

  async function loadSelectedUserListings() {
    if (!state.selectedUserId) {
      state.userListings.data = null;
      updateSelectedListingsCard("-", "Избери потребител");
      if (elements.userListingsMeta) {
        elements.userListingsMeta.textContent = "Избери потребител, за да заредим обявите му.";
      }
      renderPanelState(elements.userListingsList, "Няма избран потребител.");
      if (elements.userListingsPagination) {
        elements.userListingsPagination.innerHTML = "";
      }
      return null;
    }

    renderPanelState(elements.userListingsList, "Зареждаме обявите на потребителя...");
    if (elements.userListingsPagination) {
      elements.userListingsPagination.innerHTML = "";
    }

    try {
      const payload = await authFetchJson(
        buildUrl(`/api/admin/users/${encodeURIComponent(state.selectedUserId)}/listings`, {
          page: state.userListings.page,
          pageSize: state.userListings.pageSize
        })
      );

      state.userListings.data = normalizePagedResult(payload, state.userListings.page, state.userListings.pageSize);
      renderSelectedUserListings();
      return state.userListings.data;
    } catch (error) {
      state.userListings.data = null;
      handlePanelError(error, {
        target: elements.userListingsList,
        meta: elements.userListingsMeta,
        emptyTarget: elements.userListingsPagination,
        fallbackMessage: "Не успяхме да заредим обявите на потребителя."
      });
      updateSelectedListingsCard("-", "Грешка при зареждане");
      return null;
    }
  }

  async function loadPayments() {
    renderPanelState(elements.paymentsList, "Зареждаме плащанията...");
    if (elements.paymentsPagination) {
      elements.paymentsPagination.innerHTML = "";
    }

    try {
      const params = {
        page: state.payments.page,
        pageSize: state.payments.pageSize
      };

      if (state.payments.search) {
        params.searchTerm = state.payments.search;
      }

      const payload = await authFetchJson(buildUrl("/api/admin/payments", params));
      state.payments.data = normalizePagedResult(payload, state.payments.page, state.payments.pageSize);
      renderPayments();
      return state.payments.data;
    } catch (error) {
      state.payments.data = null;
      handlePanelError(error, {
        target: elements.paymentsList,
        meta: elements.paymentsMeta,
        emptyTarget: elements.paymentsPagination,
        fallbackMessage: "Не успяхме да заредим плащанията."
      });
      setOverviewCard(elements.paymentsCountValue, elements.paymentsCountMeta, "-", "Грешка при зареждане");
      return null;
    }
  }

  async function loadPendingActions() {
    renderPanelState(elements.pendingList, "Зареждаме чакащите действия...");
    if (elements.pendingPagination) {
      elements.pendingPagination.innerHTML = "";
    }

    try {
      const params = {
        page: state.pending.page,
        pageSize: state.pending.pageSize
      };

      if (state.pending.status) {
        params.status = state.pending.status;
      }

      const payload = await authFetchJson(buildUrl("/api/admin/pending-actions", params));
      state.pending.data = normalizePagedResult(payload, state.pending.page, state.pending.pageSize);
      renderPendingActions();
      return state.pending.data;
    } catch (error) {
      state.pending.data = null;
      handlePanelError(error, {
        target: elements.pendingList,
        meta: elements.pendingMeta,
        emptyTarget: elements.pendingPagination,
        fallbackMessage: "Не успяхме да заредим чакащите действия."
      });
      setOverviewCard(elements.pendingCountValue, elements.pendingCountMeta, "-", "Грешка при зареждане");
      return null;
    }
  }

  function syncSelectedUserFromUsersData() {
    const items = Array.isArray(state.users.data?.items) ? state.users.data.items : [];

    if (!items.length) {
      state.selectedUserId = null;
      return;
    }

    const selectedId = String(state.selectedUserId || "");
    const selectedExists = items.some((item) => String(getUserId(item) || "") === selectedId);

    if (selectedExists) {
      return;
    }

    state.selectedUserId = getUserId(items[0]);
    state.userListings.page = 1;
  }

  function clearSelectedUserPanels() {
    state.userDetails.data = null;
    state.userListings.data = null;
    renderSelectedUserPlaceholder();
    updateSelectedListingsCard("-", "Избери потребител");
    if (elements.userListingsPagination) {
      elements.userListingsPagination.innerHTML = "";
    }
  }

  function renderUsers() {
    const collection = state.users.data;
    const items = Array.isArray(collection?.items) ? collection.items : [];

    setOverviewCard(
      elements.usersCountValue,
      elements.usersCountMeta,
      formatCompactNumber(collection?.totalCount),
      buildOverviewMeta(collection, "потребители")
    );

    if (elements.usersMeta) {
      elements.usersMeta.textContent = buildCollectionMeta(collection, "потребители");
    }

    if (!items.length) {
      renderPanelState(
        elements.usersList,
        state.users.search ? "Няма потребители по това търсене." : "Няма налични потребители."
      );
      if (elements.usersPagination) {
        elements.usersPagination.innerHTML = "";
      }
      return;
    }

    elements.usersList.innerHTML = items.map(renderUserCard).join("");
    elements.usersPagination.innerHTML = renderPagination("users", collection.page, collection.totalPages);
  }

  function renderSelectedUserPlaceholder() {
    if (elements.selectedUserTitle) {
      elements.selectedUserTitle.textContent = "Детайли за потребител";
    }

    if (elements.selectedUserMeta) {
      elements.selectedUserMeta.textContent = "Избери потребител от списъка вляво.";
    }

    renderPanelState(elements.userDetailsGrid, "Няма избран потребител.");
    renderPanelState(elements.userListingsList, "Няма избран потребител.");
  }

  function renderSelectedUserDetails() {
    const data = state.userDetails.data;
    if (!data) {
      renderSelectedUserPlaceholder();
      return;
    }

    if (elements.selectedUserTitle) {
      elements.selectedUserTitle.textContent = getUserDisplayName(data) || `Потребител #${state.selectedUserId}`;
    }

    if (elements.selectedUserMeta) {
      const metaParts = [
        pick(data, "email"),
        pick(data, "phone", "mobilePhone", "contactPhone"),
        normalizeText(pick(data, "accountType"))
      ].filter(Boolean);

      elements.selectedUserMeta.textContent = metaParts.join(" • ") || `ID: ${state.selectedUserId}`;
    }

    const entries = buildDetailEntries(data);
    if (!entries.length) {
      renderPanelState(elements.userDetailsGrid, "Няма налични детайли за този потребител.");
      return;
    }

    elements.userDetailsGrid.innerHTML = entries.join("");
  }

  function renderSelectedUserListings() {
    const collection = state.userListings.data;
    const items = Array.isArray(collection?.items) ? collection.items : [];
    const userName = getUserDisplayName(state.userDetails.data) || `Потребител #${state.selectedUserId}`;

    updateSelectedListingsCard(
      formatCompactNumber(collection?.totalCount),
      userName
    );

    if (elements.userListingsMeta) {
      elements.userListingsMeta.textContent = buildCollectionMeta(collection, "обяви");
    }

    if (!items.length) {
      renderPanelState(elements.userListingsList, "Този потребител няма обяви в момента.");
      if (elements.userListingsPagination) {
        elements.userListingsPagination.innerHTML = "";
      }
      return;
    }

    elements.userListingsList.innerHTML = items.map(renderListingCard).join("");
    elements.userListingsPagination.innerHTML = renderPagination(
      "userListings",
      collection.page,
      collection.totalPages
    );
  }

  function renderPayments() {
    const collection = state.payments.data;
    const items = Array.isArray(collection?.items) ? collection.items : [];

    setOverviewCard(
      elements.paymentsCountValue,
      elements.paymentsCountMeta,
      formatCompactNumber(collection?.totalCount),
      buildOverviewMeta(collection, "плащания")
    );

    if (elements.paymentsMeta) {
      elements.paymentsMeta.textContent = buildCollectionMeta(collection, "плащания");
    }

    if (!items.length) {
      renderPanelState(
        elements.paymentsList,
        state.payments.search ? "Няма плащания по това търсене." : "Няма налични плащания."
      );
      if (elements.paymentsPagination) {
        elements.paymentsPagination.innerHTML = "";
      }
      return;
    }

    elements.paymentsList.innerHTML = items.map(renderPaymentCard).join("");
    elements.paymentsPagination.innerHTML = renderPagination("payments", collection.page, collection.totalPages);
  }

  function renderPendingActions() {
    const collection = state.pending.data;
    const items = Array.isArray(collection?.items) ? collection.items : [];

    setOverviewCard(
      elements.pendingCountValue,
      elements.pendingCountMeta,
      formatCompactNumber(collection?.totalCount),
      buildOverviewMeta(collection, "действия")
    );

    if (elements.pendingMeta) {
      elements.pendingMeta.textContent = buildCollectionMeta(collection, "чакащи действия");
    }

    if (!items.length) {
      renderPanelState(
        elements.pendingList,
        state.pending.status
          ? "Няма чакащи действия за избрания статус."
          : "Няма налични чакащи действия."
      );
      if (elements.pendingPagination) {
        elements.pendingPagination.innerHTML = "";
      }
      return;
    }

    elements.pendingList.innerHTML = items.map(renderPendingCard).join("");
    elements.pendingPagination.innerHTML = renderPagination("pending", collection.page, collection.totalPages);
  }

  function onDocumentClick(event) {
    if (state.accessLocked) {
      return;
    }

    const userButton = event.target.closest("[data-user-id]");
    if (userButton) {
      const nextUserId = String(userButton.getAttribute("data-user-id") || "").trim();
      if (!nextUserId || nextUserId === String(state.selectedUserId || "")) {
        return;
      }

      state.selectedUserId = nextUserId;
      state.userListings.page = 1;
      renderUsers();
      void refreshSelectedUserPanels();
      return;
    }

    const pageButton = event.target.closest("[data-scope][data-page]");
    if (!pageButton) {
      return;
    }

    const scope = String(pageButton.getAttribute("data-scope") || "").trim();
    const nextPage = toPositiveInt(pageButton.getAttribute("data-page"), 1);
    void changePage(scope, nextPage);
  }

  async function changePage(scope, page) {
    switch (scope) {
      case "users":
        state.users.page = page;
        await reloadUsersFlow();
        break;
      case "userListings":
        state.userListings.page = page;
        await loadSelectedUserListings();
        break;
      case "payments":
        state.payments.page = page;
        await loadPayments();
        break;
      case "pending":
        state.pending.page = page;
        await loadPendingActions();
        break;
      default:
        break;
    }
  }

  function handlePanelError(error, config) {
    if (error?.code === 403) {
      lockAdminPanel(
        "Достъпът е отказан",
        "Сървърът върна 403 Forbidden. Провери дали текущият акаунт е с роля ADMIN."
      );
      return;
    }

    if (config.meta) {
      config.meta.textContent = error?.message || config.fallbackMessage;
    }

    renderPanelState(
      config.target,
      error?.message || config.fallbackMessage,
      "error"
    );

    if (config.emptyTarget) {
      config.emptyTarget.innerHTML = "";
    }
  }

  function renderPanelState(target, message, type = "default") {
    if (!target) return;
    target.innerHTML = `<div class="panel-state ${type === "error" ? "is-error" : ""}">${escapeHtml(message)}</div>`;
  }

  function renderUserCard(item) {
    const userId = getUserId(item);
    const isSelected = String(userId || "") === String(state.selectedUserId || "");
    const displayName = escapeHtml(getUserDisplayName(item) || `Потребител #${userId || "-"}`);
    const subtitle = escapeHtml(pickText(item, "email", "phone", "mobilePhone", "contactPhone") || "Без контакт");
    const accountType = normalizeText(pick(item, "accountType"));
    const createdAt = formatDateTime(pick(item, "createdAt", "registeredAt"));
    const roles = extractRolesFromRecord(item);
    const chips = [
      accountType ? renderChip(accountType, "neutral") : "",
      ...roles.slice(0, 3).map((role) => renderChip(role, role === "ADMIN" ? "accent" : "neutral"))
    ].join("");

    return `
      <button
        class="list-card is-clickable ${isSelected ? "is-selected" : ""}"
        type="button"
        data-user-id="${escapeHtml(String(userId || ""))}"
      >
        <div class="list-card__top">
          <div>
            <h3 class="list-card__title">${displayName}</h3>
            <p class="list-card__subtitle">${subtitle}</p>
          </div>

          <div class="list-card__chips">${chips || renderChip("Потребител", "neutral")}</div>
        </div>

        <div class="list-card__grid">
          ${renderMetaItem("ID", userId || "-")}
          ${renderMetaItem("Създадено", createdAt)}
          ${renderMetaItem("Телефон", pickText(item, "phone", "mobilePhone", "contactPhone") || "-")}
          ${renderMetaItem("Имейл", pickText(item, "email") || "-")}
        </div>
      </button>
    `;
  }

  function renderListingCard(item) {
    const listingId = pick(item, "id", "listingId");
    const title = escapeHtml(normalizeText(pick(item, "title", "listingTitle")) || `Обява #${listingId || "-"}`);
    const price = formatCurrencyValue(
      pick(item, "displayPrice", "price", "priceEUR", "priceEur", "amount"),
      pick(item, "displayCurrencyCode", "currencyCode")
    );
    const status = normalizeText(pick(item, "status", "listingStatus", "currentPromotionType"));
    const createdAt = formatDateTime(pick(item, "createdAt", "publishedAt"));
    const location = buildLocationLabel(item);

    return `
      <article class="list-card">
        <div class="list-card__top">
          <div>
            <h3 class="list-card__title">${title}</h3>
            <p class="list-card__subtitle">${escapeHtml(location || "Без посочена локация")}</p>
          </div>

          <div class="list-card__chips">
            ${status ? renderStatusChip(status) : ""}
            ${price ? renderChip(price, "accent") : ""}
          </div>
        </div>

        <div class="list-card__grid">
          ${renderMetaItem("ID", listingId || "-")}
          ${renderMetaItem("Създадено", createdAt)}
          ${renderMetaItem("Категория", pickText(item, "mainCategoryName", "categoryName", "type") || "-")}
          ${renderMetaItem("Марка / модел", buildBrandModelLabel(item) || "-")}
        </div>

        ${
          listingId
            ? `<a class="listing-link" href="${escapeHtml(window.Auth?.buildListingUrl?.(listingId) || `ListingDetails.html?id=${encodeURIComponent(listingId)}`)}">Отвори обявата</a>`
            : ""
        }
      </article>
    `;
  }

  function renderPaymentCard(item) {
    const paymentId = pick(item, "id", "paymentId");
    const title = escapeHtml(
      normalizeText(pick(item, "description", "reason", "paymentType", "listingTitle")) || `Плащане #${paymentId || "-"}`
    );
    const amount = formatCurrencyValue(
      pick(item, "amount", "amountEUR", "amountEur", "price", "priceEUR"),
      pick(item, "currencyCode", "currency")
    );
    const status = normalizeText(pick(item, "status", "paymentStatus"));
    const userLabel = pickText(item, "userFullName", "fullName", "companyName", "email");
    const paidAt = formatDateTime(pick(item, "paidAt", "createdAt", "paymentDate"));
    const listingId = pick(item, "listingId");

    return `
      <article class="list-card">
        <div class="list-card__top">
          <div>
            <h3 class="list-card__title">${title}</h3>
            <p class="list-card__subtitle">${escapeHtml(userLabel || "Без свързан потребител")}</p>
          </div>

          <div class="list-card__chips">
            ${status ? renderStatusChip(status) : ""}
            ${amount ? renderChip(amount, "accent") : ""}
          </div>
        </div>

        <div class="list-card__grid">
          ${renderMetaItem("ID", paymentId || "-")}
          ${renderMetaItem("Дата", paidAt)}
          ${renderMetaItem("ID на обява", listingId || "-")}
          ${renderMetaItem("Тип", pickText(item, "paymentType", "description", "reason") || "-")}
        </div>
      </article>
    `;
  }

  function renderPendingCard(item) {
    const actionId = pick(item, "id", "pendingActionId");
    const title = escapeHtml(
      normalizeText(pick(item, "title", "description", "actionType", "type", "listingTitle")) || `Действие #${actionId || "-"}`
    );
    const status = normalizeText(pick(item, "status"));
    const type = normalizeText(pick(item, "actionType", "type"));
    const userLabel = pickText(item, "userFullName", "fullName", "companyName", "email");
    const createdAt = formatDateTime(pick(item, "createdAt", "requestedAt", "submittedAt"));
    const listingId = pick(item, "listingId");

    return `
      <article class="list-card">
        <div class="list-card__top">
          <div>
            <h3 class="list-card__title">${title}</h3>
            <p class="list-card__subtitle">${escapeHtml(userLabel || "Без свързан потребител")}</p>
          </div>

          <div class="list-card__chips">
            ${type ? renderChip(type, "neutral") : ""}
            ${status ? renderStatusChip(status) : ""}
          </div>
        </div>

        <div class="list-card__grid">
          ${renderMetaItem("ID", actionId || "-")}
          ${renderMetaItem("Дата", createdAt)}
          ${renderMetaItem("ID на обява", listingId || "-")}
          ${renderMetaItem("Описание", pickText(item, "description", "reason", "note") || "-")}
        </div>
      </article>
    `;
  }

  function buildDetailEntries(data) {
    if (!data || typeof data !== "object") {
      return [];
    }

    const entries = [];

    Object.entries(data).forEach(([key, value]) => {
      if (!hasValue(value)) {
        return;
      }

      if (Array.isArray(value) && value.every((item) => !isPlainObject(item))) {
        entries.push(renderDetailCard(key, value.join(", ")));
        return;
      }

      if (isPlainObject(value) || (Array.isArray(value) && value.some((item) => isPlainObject(item)))) {
        entries.push(renderDetailCard(key, formatStructuredValue(value), true));
        return;
      }

      entries.push(renderDetailCard(key, formatPrimitiveValue(value)));
    });

    return entries;
  }

  function renderDetailCard(key, value, isWide = false) {
    return `
      <article class="detail-card ${isWide ? "detail-card--wide" : ""}">
        <span class="detail-card__label">${escapeHtml(getFieldLabel(key))}</span>
        <div class="detail-card__value">${isWide ? `<pre>${escapeHtml(value)}</pre>` : escapeHtml(value)}</div>
      </article>
    `;
  }

  function renderPagination(scope, currentPage, totalPages) {
    const page = toPositiveInt(currentPage, 1);
    const pages = toPositiveInt(totalPages, 1);

    if (pages <= 1) {
      return "";
    }

    const pageModel = buildPaginationModel(page, pages);

    return `
      <div class="pagination">
        <button class="page-btn" type="button" data-scope="${escapeHtml(scope)}" data-page="${page - 1}" ${page <= 1 ? "disabled" : ""}>‹</button>
        ${pageModel
          .map((item) =>
            item === "..."
              ? '<span class="page-dots">…</span>'
              : `<button class="page-btn ${item === page ? "is-active" : ""}" type="button" data-scope="${escapeHtml(scope)}" data-page="${item}">${item}</button>`
          )
          .join("")}
        <button class="page-btn" type="button" data-scope="${escapeHtml(scope)}" data-page="${page + 1}" ${page >= pages ? "disabled" : ""}>›</button>
      </div>
    `;
  }

  function buildPaginationModel(currentPage, totalPages) {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, index) => index + 1);
    }

    const pages = [1];
    const start = Math.max(2, currentPage - 1);
    const end = Math.min(totalPages - 1, currentPage + 1);

    if (start > 2) {
      pages.push("...");
    }

    for (let page = start; page <= end; page += 1) {
      pages.push(page);
    }

    if (end < totalPages - 1) {
      pages.push("...");
    }

    pages.push(totalPages);
    return pages;
  }

  async function authFetchJson(url, options = {}) {
    const response = await window.Auth.authFetch(url, options);

    if (response.status === 401) {
      window.Auth.clearAuthData();
      window.Auth.redirectToLogin(getCurrentRelativeUrl());
      const unauthorizedError = new Error("Сесията изтече. Влез отново.");
      unauthorizedError.code = 401;
      throw unauthorizedError;
    }

    if (response.status === 403) {
      const forbiddenError = new Error("Нямаш администраторски права за тази заявка.");
      forbiddenError.code = 403;
      throw forbiddenError;
    }

    const payload = await readResponsePayload(response);

    if (!response.ok) {
      const requestError = new Error(readErrorMessage(payload) || "Неуспешна заявка към сървъра.");
      requestError.code = response.status;
      throw requestError;
    }

    return payload;
  }

  async function readResponsePayload(response) {
    if (!response || response.status === 204) {
      return null;
    }

    const contentType = response.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
      try {
        return await response.json();
      } catch {
        return null;
      }
    }

    const text = await response.text();
    if (!text) return null;

    try {
      return JSON.parse(text);
    } catch {
      return text;
    }
  }

  function readErrorMessage(payload) {
    if (!payload) return "";
    if (typeof payload === "string") return payload;
    if (typeof payload?.message === "string") return payload.message;
    if (typeof payload?.title === "string") return payload.title;

    if (payload?.errors && typeof payload.errors === "object") {
      const firstError = Object.values(payload.errors).flat().find(Boolean);
      return typeof firstError === "string" ? firstError : "";
    }

    return "";
  }

  function normalizePagedResult(payload, fallbackPage = 1, fallbackPageSize = 20) {
    if (Array.isArray(payload)) {
      const items = payload;
      const pageSize = Math.max(items.length, fallbackPageSize, 1);
      return {
        items,
        page: 1,
        pageSize,
        totalCount: items.length,
        totalPages: items.length ? 1 : 0
      };
    }

    const items = firstArray(
      payload?.items,
      payload?.users,
      payload?.payments,
      payload?.actions,
      payload?.listings,
      payload?.results,
      payload?.data,
      payload?.value
    );

    const page = toPositiveInt(
      firstValue(payload?.page, payload?.currentPage, payload?.pageNumber, fallbackPage),
      fallbackPage
    );

    const pageSize = toPositiveInt(
      firstValue(payload?.pageSize, payload?.size, payload?.perPage, fallbackPageSize),
      fallbackPageSize
    );

    const totalCountRaw = Number(firstValue(payload?.totalCount, payload?.count, payload?.total, items.length) || 0);
    const totalCount = Number.isFinite(totalCountRaw) ? Math.max(totalCountRaw, items.length) : items.length;
    const totalPages = toPositiveInt(
      firstValue(
        payload?.totalPages,
        payload?.pages,
        payload?.pageCount,
        pageSize > 0 ? Math.ceil(totalCount / pageSize) : 0
      ),
      totalCount ? 1 : 0
    );

    return {
      items,
      page,
      pageSize,
      totalCount,
      totalPages
    };
  }

  function setOverviewCard(valueElement, metaElement, value, metaText) {
    if (valueElement) {
      valueElement.textContent = String(value ?? "-");
    }

    if (metaElement) {
      metaElement.textContent = metaText || "Очакваме данни";
    }
  }

  function updateSelectedListingsCard(value, meta) {
    setOverviewCard(elements.selectedListingsCountValue, elements.selectedListingsMeta, value, meta);
  }

  function buildCollectionMeta(collection, label) {
    const totalCount = Number(collection?.totalCount || 0);
    const totalPages = Number(collection?.totalPages || 0);
    const currentPage = Number(collection?.page || 0);

    if (!totalCount) {
      return `Няма намерени ${label}.`;
    }

    if (!totalPages) {
      return `Общо ${totalCount} ${label}.`;
    }

    return `Общо ${totalCount} ${label} • страница ${currentPage}/${totalPages}`;
  }

  function buildOverviewMeta(collection, label) {
    const totalPages = Number(collection?.totalPages || 0);
    if (!collection || !Number(collection?.totalCount || 0)) {
      return "Няма данни";
    }

    return totalPages > 1 ? `${totalPages} стр. ${label}` : `1 стр. ${label}`;
  }

  function setButtonLoading(button, isLoading, label) {
    if (!button) return;
    button.disabled = isLoading;
    button.textContent = label;
  }

  function renderMetaItem(label, value) {
    return `<div class="list-card__meta-item"><strong>${escapeHtml(label)}:</strong> ${escapeHtml(String(value ?? "-"))}</div>`;
  }

  function renderChip(label, type = "neutral") {
    return `<span class="chip chip--${escapeHtml(type)}">${escapeHtml(label)}</span>`;
  }

  function renderStatusChip(statusRaw) {
    const status = normalizeText(statusRaw);
    const normalized = status.toUpperCase();

    if (["PAID", "APPROVED", "DONE", "ACTIVE", "SUCCESS", "COMPLETED"].includes(normalized)) {
      return renderChip(status, "success");
    }

    if (["PENDING", "WAITING", "PROCESSING"].includes(normalized)) {
      return renderChip(status, "warning");
    }

    if (["FAILED", "REJECTED", "CANCELED", "CANCELLED", "BLOCKED", "DENIED"].includes(normalized)) {
      return renderChip(status, "danger");
    }

    return renderChip(status, "neutral");
  }

  function getUserId(item) {
    return pick(item, "id", "userId");
  }

  function getUserDisplayName(user) {
    if (!user || typeof user !== "object") {
      return "";
    }

    return (
      normalizeText(pick(user, "companyName")) ||
      normalizeText(pick(user, "fullName")) ||
      [pick(user, "firstName"), pick(user, "lastName")].filter(hasValue).map(normalizeText).join(" ").trim() ||
      normalizeText(pick(user, "email")) ||
      ""
    );
  }

  function buildBrandModelLabel(item) {
    const brand = normalizeText(pick(item, "brandName", "brand"));
    const model = normalizeText(pick(item, "modelName", "model"));
    return [brand, model].filter(Boolean).join(" / ");
  }

  function buildLocationLabel(item) {
    return [
      normalizeText(pick(item, "cityName", "city")),
      normalizeText(pick(item, "regionName", "region")),
      normalizeText(pick(item, "countryName", "country"))
    ]
      .filter(Boolean)
      .join(", ");
  }

  function extractRolesFromRecord(record) {
    const roles = new Set();
    const fields = [
      pick(record, "role"),
      pick(record, "roles"),
      pick(record, "roleName"),
      pick(record, "roleNames"),
      pick(record, "userRole"),
      pick(record, "userRoles")
    ];

    fields.forEach((field) => collectRoles(roles, field));
    return [...roles];
  }

  function collectRoles(target, value) {
    if (!hasValue(value)) return;

    if (Array.isArray(value)) {
      value.forEach((item) => collectRoles(target, item));
      return;
    }

    if (isPlainObject(value)) {
      collectRoles(target, value.role);
      collectRoles(target, value.name);
      collectRoles(target, value.value);
      collectRoles(target, value.code);
      return;
    }

    String(value)
      .split(/[,;|]/)
      .map((item) => normalizeText(item).toUpperCase())
      .filter(Boolean)
      .forEach((item) => target.add(item));
  }

  function pick(source, ...candidates) {
    if (!source || typeof source !== "object") {
      return null;
    }

    const keys = Object.keys(source);

    for (const candidate of candidates) {
      if (!candidate) continue;

      if (Object.prototype.hasOwnProperty.call(source, candidate) && hasValue(source[candidate])) {
        return source[candidate];
      }

      const match = keys.find((key) => key.toLowerCase() === String(candidate).toLowerCase());
      if (match && hasValue(source[match])) {
        return source[match];
      }
    }

    return null;
  }

  function pickText(source, ...candidates) {
    return normalizeText(pick(source, ...candidates));
  }

  function getFieldLabel(key) {
    const direct = FIELD_LABELS[key];
    if (direct) return direct;

    const lowerMatch = Object.entries(FIELD_LABELS).find(([labelKey]) => labelKey.toLowerCase() === String(key).toLowerCase());
    if (lowerMatch) {
      return lowerMatch[1];
    }

    return String(key)
      .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
      .replace(/[_-]+/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .replace(/^\w/, (char) => char.toUpperCase());
  }

  function formatPrimitiveValue(value) {
    if (value === true) return "Да";
    if (value === false) return "Не";
    if (typeof value === "number") return formatCompactNumber(value, false);
    if (looksLikeDate(value)) return formatDateTime(value);
    return normalizeText(value) || "-";
  }

  function formatStructuredValue(value) {
    try {
      const serialized = JSON.stringify(value, null, 2) || "";
      return serialized.length > 2400 ? `${serialized.slice(0, 2400)}\n...` : serialized;
    } catch {
      return normalizeText(value) || "-";
    }
  }

  function formatDateTime(value) {
    if (!hasValue(value)) return "-";

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return normalizeText(value) || "-";
    }

    return new Intl.DateTimeFormat("bg-BG", {
      dateStyle: "medium",
      timeStyle: "short"
    }).format(date);
  }

  function formatCurrencyValue(amountValue, currencyValue) {
    const amount = Number(amountValue);
    if (!Number.isFinite(amount)) {
      return "";
    }

    const currency = normalizeText(currencyValue).toUpperCase();

    if (/^[A-Z]{3}$/.test(currency)) {
      try {
        return new Intl.NumberFormat("bg-BG", {
          style: "currency",
          currency,
          maximumFractionDigits: 2
        }).format(amount);
      } catch {
        return `${amount.toFixed(2)} ${currency}`;
      }
    }

    return new Intl.NumberFormat("bg-BG", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  }

  function formatCompactNumber(value, useLocale = true) {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) {
      return "-";
    }

    if (!useLocale) {
      return String(numeric);
    }

    return new Intl.NumberFormat("bg-BG").format(numeric);
  }

  function looksLikeDate(value) {
    return typeof value === "string" && /\d{4}-\d{2}-\d{2}T?\d{0,2}/.test(value);
  }

  function normalizeText(value) {
    return String(value ?? "").trim();
  }

  function hasValue(value) {
    if (value === null || value === undefined) {
      return false;
    }

    if (typeof value === "string") {
      return value.trim() !== "";
    }

    return true;
  }

  function isPlainObject(value) {
    return Boolean(value) && typeof value === "object" && !Array.isArray(value);
  }

  function firstArray(...values) {
    return values.find((value) => Array.isArray(value)) || [];
  }

  function firstValue(...values) {
    return values.find((value) => {
      if (value === undefined || value === null) return false;
      if (typeof value === "string") return value.trim() !== "";
      return true;
    });
  }

  function toPositiveInt(value, fallback) {
    const numeric = Number(value);
    if (!Number.isFinite(numeric) || numeric <= 0) {
      return fallback;
    }
    return Math.trunc(numeric);
  }

  function buildUrl(path, params) {
    const url = new URL(path, API_BASE_URL);

    Object.entries(params || {}).forEach(([key, value]) => {
      if (value === null || value === undefined || String(value).trim() === "") {
        return;
      }

      url.searchParams.set(key, String(value));
    });

    return url.toString();
  }

  function getCurrentRelativeUrl() {
    const currentPath = window.location.pathname.split("/").pop() || "AdminPage.html";
    return `${currentPath}${window.location.search || ""}`;
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }
})();
