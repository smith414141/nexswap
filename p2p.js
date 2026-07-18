let currentType = "buy";
let currentCrypto = "USDT";
let currentCurrency = "ETB";
let currentListings = [];
let searchQuery = "";
let activePaymentFilter = "All";
let expressFilter = false;
let ordersTab = "open";
let orderModalOpen = false;
let currentModalListingId = null; // track which listing is open in modal

// ---- RENDER PAYMENT FILTERS ----
function renderPaymentFilters() {
  const container = document.getElementById("payment-filters");
  if (!container) return;

  const methods = PAYMENT_METHODS[currentCurrency] || ["Bank Transfer"];
  const all = ["All", ...methods];

  container.innerHTML = all.map((m) => `
    <button
      style="padding:5px 12px; border-radius:20px; font-size:12px; font-weight:600;
        border: 1px solid ${m === activePaymentFilter ? "var(--brand)" : "var(--border)"};
        background: ${m === activePaymentFilter ? "var(--brand)" : "var(--bg3)"};
        color: ${m === activePaymentFilter ? "#fff" : "var(--text)"};
        cursor:pointer; white-space:nowrap;"
      onclick="setPaymentFilter('${m}')">
      ${m}
    </button>
  `).join("");
}

function setPaymentFilter(method) {
  activePaymentFilter = method;
  renderPaymentFilters();
  renderListingsDisplay();
}

// ---- KYC CHECK ----
auth.onAuthStateChanged((user) => {
  if (!user || !user.emailVerified) return;
  db.collection("users")
    .doc(user.uid)
    .get()
    .then((doc) => {
      if (!doc.exists) return;
      const data = doc.data();
      const badge = document.getElementById("kyc-badge");
      badge.style.display = "inline-flex";
      if (data.kycStatus === "approved") {
        badge.textContent = "Verified";
        badge.className = "kyc-badge approved";
      } else if (data.kycStatus === "pending") {
        badge.textContent = "KYC Pending";
        badge.className = "kyc-badge pending";
      } else {
        badge.textContent = "No KYC";
        badge.className = "kyc-badge none";
      }
    });
  renderListings();
  loadP2POrders();
});

// ---- TOGGLE BUY/SELL ----
function setOrderType(type) {
  currentType = type;
  document.getElementById("tab-buy").classList.toggle("active", type === "buy");
  document
    .getElementById("tab-sell")
    .classList.toggle("active", type === "sell");
  document.getElementById("toggle-buy").classList.toggle("active", type === "buy");
  document.getElementById("toggle-sell").classList.toggle("active", type === "sell");
  renderListings();
}

// ---- TOGGLE CRYPTO ----
function setCrypto(crypto) {
  currentCrypto = crypto;
  document
    .getElementById("tab-usdt")
    .classList.toggle("active", crypto === "USDT");
  document
    .getElementById("tab-btc")
    .classList.toggle("active", crypto === "BTC");
  document.querySelectorAll(".coin-tab").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.crypto === crypto);
  });
  renderListings();
}

// ---- PAYMENT FILTER ----
function setPaymentFilter(method) {
  activePaymentFilter = method;
  renderPaymentFilters();
  filterListingsDisplay();
}

// ---- EXPRESS FILTER ----
function filterListingsDisplay() {
  expressFilter = document.getElementById("p2p-express-filter")?.checked || false;
  renderListingsDisplay();
}

// ---- CURRENCY PICKER ----
function openCurrencyPicker() {
  document.getElementById("currency-modal").style.display = "flex";
  renderCurrencyList();
}

function closeCurrencyPicker() {
  document.getElementById("currency-modal").style.display = "none";
}

function renderCurrencyList() {
  const search = document.getElementById("currency-search").value.toLowerCase();
  const list = document.getElementById("currency-list");

  const filtered = CURRENCIES.filter(
    (c) =>
      c.code.toLowerCase().includes(search) ||
      c.name.toLowerCase().includes(search)
  );

  list.innerHTML = filtered
    .map(
      (c) => `
    <div class="modal-item" onclick="selectCurrency('${c.code}')">
      <span style="font-size:22px;">${c.flag}</span>
      <div style="flex:1;">
        <div style="font-weight:700; font-size:14px;">${c.code}</div>
        <div style="font-size:12px; color:var(--text2);">${c.name}</div>
      </div>
      ${
        c.code === currentCurrency
          ? '<span style="color:var(--yellow);">✓</span>'
          : ""
      }
    </div>
  `
    )
    .join("");
}

function selectCurrency(code) {
  const currency = CURRENCIES.find((c) => c.code === code);
  currentCurrency = code;
  document.getElementById("selected-flag").textContent = currency.flag;
  document.getElementById("selected-currency").textContent = currency.code;
  document.getElementById("amount-currency-label").textContent = currency.code;

  closeCurrencyPicker();
  activePaymentFilter = "All";
  renderPaymentFilters();
  renderListings();
}

// ---- AMOUNT FILTER ----
function filterByAmount() {
  renderListingsDisplay();
}

function filterListingsBySearch(query) {
  searchQuery = query.toLowerCase().trim();
  renderListingsDisplay();
}

// ---- RENDER LISTINGS ----
function renderListings() {
  const fakeListingsRaw = generateListings(
    currentCurrency,
    currentCrypto,
    currentType
  );

  Promise.all([
    applyListingOverrides(fakeListingsRaw),
    db
      .collection("listings")
      .where("status", "==", "active")
      .get()
      .catch(() => null),
  ])
    .then(([fakeListings, snapshot]) => {
      const realListings = [];
      if (snapshot) {
        snapshot.forEach((doc) => {
          const d = doc.data();
          if (
            d.currency !== currentCurrency ||
            d.crypto !== currentCrypto ||
            d.type !== currentType
          )
            return;
          realListings.push({
            id: doc.id,
            listingId: doc.id,
            merchantUid: d.merchantUid,
            name: d.merchantName,
            initials: getInitials(d.merchantName),
            color: getAvatarColor(d.merchantName),
            verified: true,
            online: d.online === false ? false : true,
            trades: "Merchant",
            completion: "100",
            price: d.rate,
            currency: d.currency,
            crypto: d.crypto,
            type: d.type,
            minLimit: d.minLimit,
            maxLimit: d.maxLimit,
            available: d.available,
            methods: d.methods,
          });
        });
      }

      currentListings = [...realListings, ...fakeListings];
      currentListings.sort((a, b) => {
        // Online merchants always appear above offline ones
        if (a.online !== b.online) return a.online ? -1 : 1;
        // Within the same online/offline group, sort by price
        return currentType === "sell" ? a.price - b.price : b.price - a.price;
      });
      renderListingsDisplay();
    })
    .catch(() => {
      currentListings = fakeListingsRaw;
      renderListingsDisplay();
    });
}

function renderListingsDisplay() {
  const container = document.getElementById("listings-container");
  const amountFilter = parseFloat(
    document.getElementById("amount-filter").value
  );

  let listings = currentListings;
  if (!isNaN(amountFilter) && amountFilter > 0) {
    listings = listings.filter(
      (l) => amountFilter >= l.minLimit && amountFilter <= l.maxLimit
    );
  }

  if (searchQuery) {
    listings = listings.filter(
      (l) =>
        l.name.toLowerCase().includes(searchQuery) ||
        l.methods.some((m) => m.toLowerCase().includes(searchQuery))
    );
  }

  if (activePaymentFilter !== "All") {
    listings = listings.filter((l) =>
      l.methods && l.methods.includes(activePaymentFilter)
    );
  }

  if (expressFilter) {
    listings = listings.filter((l) => l.verified === true);
  }

  if (listings.length === 0) {
    container.innerHTML = `
      <div style="text-align:center; padding:60px 20px; color:var(--text3);">
        <div style="font-size:40px; margin-bottom:12px;">🔍</div>
        <div style="font-size:14px;">No listings match your filter</div>
      </div>
    `;
    return;
  }

  const headerRow = `
    <div style="display:flex; align-items:center; gap:0; padding:6px 16px;
      border-bottom:1px solid var(--border); background:var(--bg2);">
      <div style="flex:0 0 200px; font-size:10px; font-weight:700;
        text-transform:uppercase; letter-spacing:0.04em; color:var(--text3);">
        Advertiser
      </div>
      <div style="flex:0 0 130px; font-size:10px; font-weight:700;
        text-transform:uppercase; letter-spacing:0.04em; color:var(--text3);">
        Price
      </div>
      <div style="flex:0 0 160px; font-size:10px; font-weight:700;
        text-transform:uppercase; letter-spacing:0.04em; color:var(--text3);">
        Available · Limit
      </div>
      <div style="flex:1; font-size:10px; font-weight:700;
        text-transform:uppercase; letter-spacing:0.04em; color:var(--text3);">
        Payment
      </div>
      <div style="width:80px;"></div>
    </div>`;

  container.innerHTML = headerRow + listings
    .map(
      (l) => `
      <div onclick="openOrder('${l.id}')" style="
        display:flex; align-items:center; gap:0;
        padding:10px 16px;
        border-bottom:1px solid var(--border);
        cursor:pointer;
        opacity:${l.online ? "1" : "0.45"};
        pointer-events:${l.online ? "auto" : "none"};
        transition:background 0.15s;
      " onmouseenter="this.style.background='var(--bg3)'"
        onmouseleave="this.style.background=''">

        <!-- Advertiser col -->
        <div style="flex:0 0 200px; display:flex; align-items:center; gap:10px;">
          <div style="width:32px; height:32px; border-radius:50%; flex-shrink:0;
            background:${l.color}22; color:${l.color};
            display:flex; align-items:center; justify-content:center;
            font-weight:800; font-size:11px; position:relative;">
            ${l.initials}
            <span style="position:absolute; bottom:0; right:0; width:7px; height:7px;
              border-radius:50%; border:1.5px solid var(--bg1);
              background:${l.online ? "var(--green)" : "var(--text3)"};"></span>
          </div>
          <div>
            <div style="font-weight:700; font-size:12.5px;">
              ${l.name}${l.verified ? ' <span style="color:var(--brand);font-size:10px;">✓</span>' : ""}
            </div>
            <div style="font-size:10px; color:var(--text3);">
              ⭐ ${l.completion}% • ${l.trades} trades
            </div>
          </div>
        </div>

        <!-- Price col -->
        <div style="flex:0 0 130px;">
          <div style="font-size:9px; text-transform:uppercase; letter-spacing:0.04em; color:var(--text3); margin-bottom:2px;">Price</div>
          <div style="font-size:18px; font-weight:800; color:var(--green);">${formatPrice(l.price)}</div>
          <div style="font-size:9px; color:var(--text3);">${l.currency}/${l.crypto}</div>
        </div>

        <!-- Available / Limit col -->
        <div style="flex:0 0 160px;">
          <div style="font-size:9px; text-transform:uppercase; letter-spacing:0.04em; color:var(--text3); margin-bottom:2px;">Available · Limit</div>
          <div style="font-size:11.5px; font-weight:600;">${l.available} ${l.crypto}</div>
          <div style="font-size:10px; color:var(--text3);">${formatNumber(l.minLimit)}–${formatNumber(l.maxLimit)} ${l.currency}</div>
        </div>

        <!-- Payment col -->
        <div style="flex:1; min-width:0;">
          <div style="font-size:9px; text-transform:uppercase; letter-spacing:0.04em; color:var(--text3); margin-bottom:4px;">Payment</div>
          <div style="display:flex; gap:4px; flex-wrap:wrap;">
            ${l.methods.map((m) => `
              <span style="font-size:10px; padding:2px 8px; border-radius:4px;
                background:var(--bg3); border:1px solid var(--border); white-space:nowrap;">
                ${m}
              </span>`).join("")}
          </div>
        </div>

        <!-- Buy/Sell button -->
        <button onclick="console.log('Button clicked for:', '${l.id}'); event.stopPropagation(); openOrder('${l.id}')"
          style="flex-shrink:0; margin-left:12px; padding:8px 20px;
            border-radius:8px; font-size:12.5px; font-weight:700; border:none;
            cursor:pointer; background:${currentType === "buy" ? "var(--green)" : "var(--red)"};
            color:#fff;">
          ${currentType === "buy" ? "Buy ›" : "Sell ›"}
        </button>

      </div>`
    )
    .join("");
}

function formatPrice(price) {
  const num = parseFloat(price);
  return num.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatNumber(num) {
  return num.toLocaleString("en-US");
}

// ---- OPEN ORDER ----
function openOrder(listingId) {
  console.log("openOrder called with:", listingId);
  const listing = currentListings.find((l) => l.id === listingId);
  console.log("Found listing:", listing);
  if (!listing) {
    console.error("Listing not found in currentListings:", currentListings);
    return;
  }
  if (listing && !listing.online) {
    showToast(
      "This merchant is currently offline. Please try another merchant.",
      "error"
    );
    return;
  }

  const user = auth.currentUser;
  console.log("Current user:", user);
  if (!user) {
    console.log("No user, redirecting to login");
    return;
  }

  db.collection("users")
    .doc(user.uid)
    .get()
    .then((doc) => {
      console.log("User doc:", doc.exists, doc.data());
      const data = doc.data();
      if (!data || data.kycStatus !== "approved") {
        showToast("Complete KYC verification to start trading", "warning");
        setTimeout(() => (window.location.href = "profile.html"), 1500);
        return;
      }
      if (data.suspended) {
        showToast(
          "Account suspended. Please complete identity verification again.",
          "error"
        );
        setTimeout(() => (window.location.href = "profile.html"), 1500);
        return;
      }

      sessionStorage.removeItem("activeOrderId");
      sessionStorage.setItem("currentOrder", JSON.stringify(listing));
      console.log("Calling openOrderModal with listing:", listing);
      openOrderModal(listing);
    })
    .catch((err) => {
      console.error("Error in openOrder:", err);
      showToast(err.message, "error");
    });
}

// ---- P2P ORDERS TABS ----
function switchOrdersTab(tab) {
  ordersTab = tab;
  document.getElementById("orders-tab-open").style.borderBottomColor =
    tab === "open" ? "var(--brand)" : "transparent";
  document.getElementById("orders-tab-open").style.color =
    tab === "open" ? "var(--brand)" : "var(--text3)";
  document.getElementById("orders-tab-closed").style.borderBottomColor =
    tab === "closed" ? "var(--brand)" : "transparent";
  document.getElementById("orders-tab-closed").style.color =
    tab === "closed" ? "var(--brand)" : "var(--text3)";
  loadP2POrders();
}

function loadP2POrders() {
  const user = auth.currentUser;
  const list = document.getElementById("p2p-orders-list");
  if (!user || !list) return;

  list.innerHTML = `<div style="padding:20px; color:var(--text3); font-size:13px;">Loading...</div>`;

  const statusFilter = ordersTab === "open"
    ? ["awaiting_payment", "awaiting_release"]
    : ["completed", "cancelled", "disputed"];

  // Try ordered query first (requires composite index)
  db.collection("p2pOrders")
    .where("buyerUid", "==", user.uid)
    .orderBy("createdAt", "desc")
    .limit(10)
    .get()
    .then((snap) => {
      console.log("Orders query snapshot:", snap.size, "docs");
      const orders = [];
      snap.forEach((d) => {
        const o = { id: d.id, ...d.data() };
        console.log("Order:", o.id, o.status, o.type, o.fiatAmount, o.currency);
        if (statusFilter.some((s) => o.status === s)) orders.push(o);
      });

      if (orders.length === 0) {
        list.innerHTML = `<div style="padding:20px; text-align:center; color:var(--text3); font-size:13px;">
          No ${ordersTab === "open" ? "open" : "completed"} orders
        </div>`;
        return;
      }

      list.innerHTML = orders.map((o) => {
        const statusColor = o.status === "completed" ? "var(--green)"
          : o.status === "cancelled" ? "var(--red)"
          : "var(--yellow)";
        const date = o.createdAt?.toDate
          ? o.createdAt.toDate().toLocaleDateString()
          : "—";
        return `
          <div style="display:flex; align-items:center; justify-content:space-between;
            padding:10px 16px; border-bottom:1px solid var(--border); font-size:12.5px; cursor:pointer;"
            onclick="window.location.href='order.html?id=${o.id}'">
            <div style="flex:1;">
              <span style="font-weight:700;">${o.type === "buy" ? "Buy" : "Sell"} ${o.crypto || "USDT"}</span>
              <span style="color:var(--text3); margin-left:8px;">${date}</span>
            </div>
            <div style="flex:1; text-align:center;">
              ${o.fiatAmount ? formatNumber(o.fiatAmount) : "—"} ${o.currency || ""}
            </div>
            <div style="flex:0 0 90px; text-align:right;">
              <span style="padding:3px 10px; border-radius:20px; font-size:10px; font-weight:700;
                background:${statusColor}22; color:${statusColor}; text-transform:capitalize;">
                ${o.status}
              </span>
            </div>
          </div>`;
      }).join("");
    })
    .catch((err) => {
      console.error("Ordered query failed, trying fallback:", err);
      // Fallback: query without orderBy (no composite index needed)
      return db.collection("p2pOrders")
        .where("buyerUid", "==", user.uid)
        .limit(10)
        .get()
        .then((snap) => {
          console.log("Fallback query snapshot:", snap.size, "docs");
          const orders = [];
          snap.forEach((d) => {
            const o = { id: d.id, ...d.data() };
            console.log("Order (fallback):", o.id, o.status, o.type, o.fiatAmount, o.currency);
            if (statusFilter.some((s) => o.status === s)) orders.push(o);
          });
          // Sort in memory by createdAt desc
          orders.sort((a, b) => {
            const ta = a.createdAt?.toDate?.()?.getTime() || 0;
            const tb = b.createdAt?.toDate?.()?.getTime() || 0;
            return tb - ta;
          });
          orders.splice(10); // limit to 10

          if (orders.length === 0) {
            list.innerHTML = `<div style="padding:20px; text-align:center; color:var(--text3); font-size:13px;">
              No ${ordersTab === "open" ? "open" : "completed"} orders
            </div>`;
            return;
          }

          list.innerHTML = orders.map((o) => {
            const statusColor = o.status === "completed" ? "var(--green)"
              : o.status === "cancelled" ? "var(--red)"
              : "var(--yellow)";
            const date = o.createdAt?.toDate
              ? o.createdAt.toDate().toLocaleDateString()
              : "—";
            return `
              <div style="display:flex; align-items:center; justify-content:space-between;
                padding:10px 16px; border-bottom:1px solid var(--border); font-size:12.5px; cursor:pointer;"
                onclick="window.location.href='order.html?id=${o.id}'">
                <div style="flex:1;">
                  <span style="font-weight:700;">${o.type === "buy" ? "Buy" : "Sell"} ${o.crypto || "USDT"}</span>
                  <span style="color:var(--text3); margin-left:8px;">${date}</span>
                </div>
                <div style="flex:1; text-align:center;">
                  ${o.fiatAmount ? formatNumber(o.fiatAmount) : "—"} ${o.currency || ""}
                </div>
                <div style="flex:0 0 90px; text-align:right;">
                  <span style="padding:3px 10px; border-radius:20px; font-size:10px; font-weight:700;
                    background:${statusColor}22; color:${statusColor}; text-transform:capitalize;">
                    ${o.status}
                  </span>
                </div>
              </div>`;
          }).join("");
        });
    })
    .catch((err) => {
      console.error("Both queries failed:", err);
      list.innerHTML = `<div style="padding:20px; color:var(--text3); font-size:13px; text-align:center;">
        Could not load orders
      </div>`;
    });
}

// Initial render — wait for CRYPTO_PRICES then render immediately, don't wait for auth
function waitForPrices(cb) {
  if (typeof CRYPTO_PRICES !== "undefined" && CRYPTO_PRICES.BTC) {
    cb();
  } else {
    setTimeout(() => waitForPrices(cb), 100);
  }
}
waitForPrices(() => {
  renderListings();
  renderPaymentFilters();
});
// Modal helper
function closeModal(id) {
  const el = document.getElementById(id);
  if (el) el.style.display = "none";
}

// ---- TICKER BAR ----
function renderP2PTicker() {
  const track = document.getElementById("pc-ticker-track");
  if (!track) return;

  // Wait for CRYPTO_PRICES to be populated
  if (typeof CRYPTO_PRICES === "undefined" || !CRYPTO_PRICES.BTC) {
    setTimeout(renderP2PTicker, 300);
    return;
  }

  const pairs = [
    { sym: "BTC/USDT", price: CRYPTO_PRICES.BTC },
    { sym: "ETH/USDT", price: CRYPTO_PRICES.ETH },
    { sym: "BNB/USDT", price: CRYPTO_PRICES.BNB },
    { sym: "SOL/USDT", price: CRYPTO_PRICES.SOL },
    { sym: "XRP/USDT", price: CRYPTO_PRICES.XRP },
    { sym: "ADA/USDT", price: CRYPTO_PRICES.ADA },
    { sym: "DOGE/USDT", price: CRYPTO_PRICES.DOGE },
    { sym: "AVAX/USDT", price: CRYPTO_PRICES.AVAX },
  ].filter((p) => p.price);

  // Build ticker items (duplicate for seamless scroll)
  const items = [...pairs, ...pairs].map((p) => {
    const change = (Math.random() * 6 - 3).toFixed(2);
    const positive = parseFloat(change) >= 0;
    return `<span class="pc-ticker-item">
      <span class="sym">${p.sym}</span>
      <span class="price">$${p.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
      <span class="chg ${positive ? "positive" : "negative"}">
        ${positive ? "▲" : "▼"}${Math.abs(change)}%
      </span>
    </span>`;
  }).join("");

  track.innerHTML = items;
}

// Call after prices are ready
renderP2PTicker();

// ---- P2P ORDER MODAL ----

// ---- DRAFT SAVING ----
function saveOrderDraft() {
  if (!currentModalListingId) return;
  const draft = {
    listingId: currentModalListingId,
    amount: document.getElementById("fiat-amount")?.value || "",
    paymentMethod: window.selectedPaymentMethod || "",
    payoutMethod: document.getElementById("payout-method")?.value || "",
    payoutAccount: document.getElementById("payout-account")?.value || "",
    timestamp: Date.now()
  };
  sessionStorage.setItem(`p2p_draft_${currentModalListingId}`, JSON.stringify(draft));
}

function loadOrderDraft(listingId) {
  const saved = sessionStorage.getItem(`p2p_draft_${listingId}`);
  if (!saved) return null;
  try {
    return JSON.parse(saved);
  } catch {
    return null;
  }
}

function clearOrderDraft(listingId) {
  sessionStorage.removeItem(`p2p_draft_${listingId}`);
}

function applyOrderDraft(draft) {
  if (!draft) return;
  const amountInput = document.getElementById("fiat-amount");
  if (amountInput && draft.amount) {
    amountInput.value = draft.amount;
    // Trigger calcCrypto to update display
    if (typeof calcCrypto === "function") calcCrypto();
  }
  // For BUY: restore payment method selection
  if (draft.paymentMethod && window.selectedPaymentMethod !== draft.paymentMethod) {
    window.selectedPaymentMethod = draft.paymentMethod;
    const listing = window.listing;
    if (listing?.methods?.includes(draft.paymentMethod)) {
      renderPaymentPills(listing.methods);
    }
  }
  // For SELL: restore payout method and account
  if (draft.payoutMethod) {
    const payoutSelect = document.getElementById("payout-method");
    if (payoutSelect) {
      payoutSelect.value = draft.payoutMethod;
      payoutSelect.dispatchEvent(new Event("change"));
    }
  }
  if (draft.payoutAccount) {
    const payoutAccount = document.getElementById("payout-account");
    if (payoutAccount) payoutAccount.value = draft.payoutAccount;
  }
}

function openOrderModal(listing) {
  console.log("=== openOrderModal ===", listing);
  currentModalListingId = listing.id;

  // Load draft if exists
  const draft = loadOrderDraft(listing.id);
  if (draft) {
    console.log("Loaded draft:", draft);
  }

  const overlay = document.getElementById("p2p-order-overlay");
  const panel = document.getElementById("p2p-order-panel");
  const stepAmount = document.getElementById("step-amount");
  const stepOrder = document.getElementById("step-order");
  console.log("Overlay element:", overlay);
  console.log("Panel element:", panel);
  if (!overlay || !panel) {
    console.error("Modal elements not found!");
    return;
  }
  console.log("Modal elements found, showing modal");
  if (typeof renderListingInfo === "function") {
    window.listing = listing;
    renderListingInfo();
    // Apply saved draft if any
    const draft = loadOrderDraft(listing.id);
    if (draft) applyOrderDraft(draft);
  } else {
    // Fallback inline population
    const traderName = document.getElementById("trader-name");
    const traderAvatar = document.getElementById("trader-avatar");
    const traderVerified = document.getElementById("trader-verified");
    const traderStats = document.getElementById("trader-stats");
    const orderTypeBadge = document.getElementById("order-type-badge");
    const orderHeaderTitle = document.getElementById("order-header-title");
    const orderPriceDisplay = document.getElementById("order-price-display");
    const orderPairLabel = document.getElementById("order-pair-label");
    const orderAvailableDisplay = document.getElementById("order-available-display");
    const orderLimitInline = document.getElementById("order-limit-inline");
    const fiatCurrencyLabel = document.getElementById("fiat-currency-label");
    const cryptoLabel = document.getElementById("crypto-label");
    const limitDisplay = document.getElementById("limit-display");
    const confirmOrderBtn = document.getElementById("confirm-order-btn");
    const buyPaymentSection = document.getElementById("buy-payment-section");
    const payoutSection = document.getElementById("payout-section");

    if (traderName) traderName.textContent = listing.name;
    if (traderAvatar) {
      traderAvatar.textContent = listing.initials;
      traderAvatar.style.background = listing.color + "22";
      traderAvatar.style.color = listing.color;
    }
    if (traderVerified) traderVerified.textContent = listing.verified ? "✓" : "";
    if (traderStats) traderStats.textContent = `${listing.online ? "Online" : "Offline"} • ${listing.trades} trades • ${listing.completion}%`;
    if (orderTypeBadge) {
      orderTypeBadge.textContent = listing.type === "buy" ? "BUY" : "SELL";
      orderTypeBadge.className = "order-type " + listing.type;
    }
    if (orderHeaderTitle) orderHeaderTitle.textContent = (listing.type === "sell" ? "Sell" : "Buy") + " " + listing.crypto;
    if (orderPriceDisplay) orderPriceDisplay.textContent = listing.price ? listing.price.toLocaleString() : "—";
    if (orderPairLabel) orderPairLabel.textContent = `${listing.currency} / ${listing.crypto}`;
    if (orderAvailableDisplay) orderAvailableDisplay.textContent = `${listing.available} ${listing.crypto}`;
    if (orderLimitInline) orderLimitInline.textContent = `${formatNumber(listing.minLimit)}–${formatNumber(listing.maxLimit)} ${listing.currency}`;
    if (fiatCurrencyLabel) fiatCurrencyLabel.textContent = listing.currency;
    if (cryptoLabel) cryptoLabel.textContent = listing.crypto;
    if (limitDisplay) limitDisplay.textContent = `Limit: ${formatNumber(listing.minLimit)} - ${formatNumber(listing.maxLimit)} ${listing.currency}`;
    if (confirmOrderBtn) {
      confirmOrderBtn.textContent = listing.type === "sell" ? "Confirm Sell" : "Confirm Buy";
      confirmOrderBtn.style.background = listing.type === "sell" ? "var(--red)" : "var(--green)";
    }

    // Buy: payment pills
    if (listing.type === "buy" && listing.methods?.length && buyPaymentSection) {
      buyPaymentSection.style.display = "block";
      renderPaymentPills(listing.methods);
    }
    // Sell: payout section
    if (listing.type === "sell" && payoutSection) {
      payoutSection.style.display = "block";
      setupPayoutSectionModal(listing);
    }
  }

  // Reset step view
  if (stepAmount) stepAmount.style.display = "block";
  if (stepOrder) stepOrder.style.display = "none";
  modalOrderCreated = false;

  // Show modal
  overlay.style.display = "flex";
  // Force reflow then animate
  requestAnimationFrame(() => {
    overlay.style.opacity = "1";
    panel.style.transform = "translateX(0)";
  });
  orderModalOpen = true;

  // Disable body scroll
  document.body.style.overflow = "hidden";
}

function closeOrderModal() {
  // Save draft before closing (if no order created yet)
  if (!currentOrderId && currentModalListingId) {
    saveOrderDraft();
  }
  
  // Always allow closing the modal UI - order continues in background
  const overlay = document.getElementById("p2p-order-overlay");
  const panel = document.getElementById("p2p-order-panel");
  overlay.style.opacity = "0";
  panel.style.transform = "translateX(100%)";
  setTimeout(() => {
    overlay.style.display = "none";
  }, 300);
  orderModalOpen = false;
  document.body.style.overflow = "";
  
  // If there's an active order, show toast to remind user
  if (currentOrderId) {
    showToast("Order continues in background. Check Open Orders tab.", "info");
  }
}

// Clear draft when order is successfully created
function clearOrderDraftOnCreate() {
  if (currentModalListingId) {
    clearOrderDraft(currentModalListingId);
  }
}

function handleOrderOverlayClick(e) {
  console.log("Overlay click:", e.target.id);
  if (e.target.id === "p2p-order-overlay") {
    closeOrderModal();
  }
}

// Reusable payment pills renderer (for BUY)
function renderPaymentPills(methods) {
  const container = document.getElementById("buy-payment-pills");
  if (!container) return;
  let selected = methods[0];
  window.selectPaymentMethod = (m) => {
    selected = m;
    window.selectedPaymentMethod = m;
    renderPaymentPills(methods);
  };
  container.innerHTML = methods.map(m => `
    <button onclick="selectPaymentMethod('${m}')"
      style="padding:7px 16px; border-radius:20px; font-size:12px; font-weight:600;
        border:1.5px solid ${m === selected ? "var(--green)" : "var(--border)"};
        background:${m === selected ? "var(--green)22" : "var(--bg3)"};
        color:${m === selected ? "var(--green)" : "var(--text)"};
        cursor:pointer;">${m === selected ? "● " : ""}${m}</button>
  `).join("");
}

// Setup payout section for SELL in modal
function setupPayoutSectionModal(listing) {
  const select = document.getElementById("payout-method");
  const input = document.getElementById("payout-account");
  select.innerHTML = listing.methods.map(m => `<option value="${m}">${m}</option>`).join("");
  // Load saved accounts from Firestore
  const user = auth.currentUser;
  if (!user) return;
  db.collection("addressBook").doc(user.uid).get().then(doc => {
    const accounts = doc.exists ? (doc.data().p2pAccounts || []) : [];
    const compat = accounts.filter(a => listing.methods.includes(a.method));
    if (compat.length > 0) {
      select.value = compat[0].method;
      input.value = compat[0].account;
      const helper = document.getElementById("payout-saved-helper");
      if (helper) {
        helper.textContent = `✓ Using saved ${compat[0].method} account: ${compat[0].account}`;
        helper.style.display = "block";
      }
    }
    select.onchange = () => {
      const saved = accounts.find(a => a.method === select.value);
      if (saved) {
        input.value = saved.account;
        const helper = document.getElementById("payout-saved-helper");
        if (helper) {
          helper.textContent = `✓ Using saved ${select.value} account: ${saved.account}`;
          helper.style.display = "block";
        }
      } else {
        input.value = "";
        const helper = document.getElementById("payout-saved-helper");
        if (helper) helper.style.display = "none";
      }
    };
  });
}

// ---- MY ORDERS MODAL ----
let myOrdersTab = "open";

function openMyOrdersModal() {
  const overlay = document.getElementById("my-orders-overlay");
  const panel = document.getElementById("my-orders-panel");
  if (!overlay || !panel) return;
  
  overlay.style.display = "flex";
  requestAnimationFrame(() => {
    overlay.style.opacity = "1";
    panel.style.transform = "translateX(0)";
  });
  document.body.style.overflow = "hidden";
  
  loadMyOrders();
}

function closeMyOrdersModal() {
  const overlay = document.getElementById("my-orders-overlay");
  const panel = document.getElementById("my-orders-panel");
  if (!overlay || !panel) return;
  
  overlay.style.opacity = "0";
  panel.style.transform = "translateX(100%)";
  setTimeout(() => {
    overlay.style.display = "none";
  }, 300);
  document.body.style.overflow = "";
}

function handleMyOrdersOverlayClick(e) {
  if (e.target.id === "my-orders-overlay") {
    closeMyOrdersModal();
  }
}

function switchMyOrdersTab(tab) {
  myOrdersTab = tab;
  document.getElementById("my-orders-tab-open").style.borderBottomColor =
    tab === "open" ? "var(--brand)" : "transparent";
  document.getElementById("my-orders-tab-open").style.color =
    tab === "open" ? "var(--brand)" : "var(--text3)";
  document.getElementById("my-orders-tab-closed").style.borderBottomColor =
    tab === "closed" ? "var(--brand)" : "transparent";
  document.getElementById("my-orders-tab-closed").style.color =
    tab === "closed" ? "var(--brand)" : "var(--text3)";
  loadMyOrders();
}

function loadMyOrders() {
  const user = auth.currentUser;
  const list = document.getElementById("my-orders-list");
  if (!user || !list) return;

  list.innerHTML = `<div style="padding:20px; color:var(--text3); font-size:13px;">Loading...</div>`;

  const statusFilter = myOrdersTab === "open"
    ? ["awaiting_payment", "awaiting_release"]
    : ["completed", "cancelled", "disputed"];

  db.collection("p2pOrders")
    .where("buyerUid", "==", user.uid)
    .orderBy("createdAt", "desc")
    .limit(10)
    .get()
    .then((snap) => {
      const orders = [];
      snap.forEach((d) => {
        const o = { id: d.id, ...d.data() };
        if (statusFilter.some((s) => o.status === s)) orders.push(o);
      });

      if (orders.length === 0) {
        list.innerHTML = `<div style="padding:20px; text-align:center; color:var(--text3); font-size:13px;">
          No ${myOrdersTab === "open" ? "open" : "completed"} orders
        </div>`;
        return;
      }

      list.innerHTML = orders.map((o) => {
        const statusColor = o.status === "completed" ? "var(--green)"
          : o.status === "cancelled" ? "var(--red)"
          : "var(--yellow)";
        const date = o.createdAt?.toDate
          ? o.createdAt.toDate().toLocaleDateString()
          : "—";
        return `
          <div style="display:flex; align-items:center; justify-content:space-between;
            padding:10px 16px; border-bottom:1px solid var(--border); font-size:12.5px; cursor:pointer;"
            onclick="openOrderInModal('${o.id}')">
            <div style="flex:1;">
              <span style="font-weight:700;">${o.type === "buy" ? "Buy" : "Sell"} ${o.crypto || "USDT"}</span>
              <span style="color:var(--text3); margin-left:8px;">${date}</span>
            </div>
            <div style="flex:1; text-align:center;">
              ${o.fiatAmount ? formatNumber(o.fiatAmount) : "—"} ${o.currency || ""}
            </div>
            <div style="flex:0 0 90px; text-align:right;">
              <span style="padding:3px 10px; border-radius:20px; font-size:10px; font-weight:700;
                background:${statusColor}22; color:${statusColor}; text-transform:capitalize;">
                ${o.status}
              </span>
            </div>
          </div>`;
      }).join("");
    })
    .catch((err) => {
      console.error("Orders query failed:", err);
      list.innerHTML = `<div style="padding:20px; color:var(--text3); font-size:13px; text-align:center;">
        Could not load orders
      </div>`;
    });
}

// Open specific order in the slide-over modal
function openOrderInModal(orderId) {
  closeMyOrdersModal(); // Close the My Orders modal first
  
  const user = auth.currentUser;
  if (!user) return;
  
  db.collection("p2pOrders")
    .doc(orderId)
    .get()
    .then((doc) => {
      if (!doc.exists) {
        showToast("Order not found", "error");
        return;
      }
      
      const order = { id: doc.id, ...doc.data() };
      
      // Convert order to listing format for the modal
      const listing = {
        id: order.id,
        name: order.traderName,
        initials: getInitials(order.traderName),
        color: getAvatarColor(order.traderName),
        online: true,
        verified: true,
        trades: "Merchant",
        completion: "100",
        price: order.price,
        currency: order.currency,
        crypto: order.crypto,
        type: order.type,
        minLimit: order.minLimit || 0,
        maxLimit: order.maxLimit || 999999,
        available: order.cryptoAmount || 0,
        methods: order.paymentMethod ? [order.paymentMethod] : ["Bank Transfer"]
      };
      
      // Open the main order modal with this listing
      openOrderModal(listing);
      
      // Now switch to step-order view and populate with existing order data
      // We need to set up the real-time listener for this order
      currentOrderId = order.id;
      currentOrderData = order;
      sessionStorage.setItem("activeOrderId", order.id);
      
      // Switch to order view
      document.getElementById("step-amount").style.display = "none";
      document.getElementById("step-order").style.display = "block";
      
      // Listen to real-time updates
      listenToOrder();
      
      // Populate chat
      renderChatForOrder(order);
    })
    .catch((err) => {
      console.error("Error opening order:", err);
      showToast(err.message, "error");
    });
}
