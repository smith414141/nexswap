let currentType = "buy";
let currentCrypto = "USDT";
let currentCurrency = "ETB";
let currentListings = [];
let searchQuery = "";
let paymentFilter = "all";
let expressFilter = false;

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
  paymentFilter = method;
  document.querySelectorAll(".pay-filter-pill").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.method === method);
  });
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
      currentListings.sort((a, b) =>
        currentType === "sell" ? a.price - b.price : b.price - a.price
      );
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

  if (paymentFilter !== "all") {
    listings = listings.filter((l) =>
      l.methods.some((m) => m.toLowerCase() === paymentFilter.toLowerCase())
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

  container.innerHTML = listings
    .map(
      (l) => `
      <div class="p2p-listing-row" style="${
        l.online ? "" : "opacity:0.5;"
      } border-bottom:1px solid var(--border);" onclick="openOrder('${l.id}')">
        <div style="display: grid; grid-template-columns: 1fr auto; gap: 16px; align-items: start; padding: 12px 16px;">
          <div style="min-width: 0; display: flex; align-items: center; gap: 12px;">
            <div style="position: relative; width:36px; height:36px; border-radius:50%; background:${
              l.color
            }22; color:${
        l.color
      }; display:flex; align-items:center; justify-content:center; font-weight:800; font-size:13px; flex-shrink:0;">
              ${l.initials}
              <span style="position:absolute; bottom:0; right:0; width:10px; height:10px; border-radius:50%; background:${
                l.online ? "var(--green)" : "var(--text3)"
              }; border:2px solid var(--bg);"></span>
            </div>
            <div style="min-width: 0;">
              <div style="font-weight:700; font-size:14px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                ${l.name} ${l.verified ? '<span class="verified-icon" style="margin-left: 6px;">✓</span>' : ""}
              </div>
              <div class="text-muted" style="font-size:11px; margin-top:2px;">
                ★ ${l.completion}% &middot; ${l.trades} trades
              </div>
            </div>
          </div>

          <div class="p2p-price-col" style="text-align: right; min-width: 160px;">
            <div class="text-mono" style="font-size:16px; font-weight:800; color:${
              currentType === "buy" ? "var(--green)" : "var(--text)"
            };">
              ${formatPrice(l.price)}
            </div>
            <div class="text-muted" style="font-size:10px; margin-top:2px;">per ${l.crypto}</div>
            <button class="btn" style="margin-top: 8px; padding: 8px 16px; font-size: 12px; font-weight: 700; ${
              currentType === "buy"
                ? "background: var(--green); color: #fff;"
                : "background: var(--red); color: #fff;"
            }" onclick="event.stopPropagation(); openOrder('${l.id}')">
              ${currentType === "buy" ? "Buy" : "Sell"} &rarr;
            </button>
          </div>

          <div style="text-align: right; min-width: 120px; display: flex; flex-direction: column; align-items: flex-end; justify-content: center; gap: 4px;">
            <div class="text-muted" style="font-size:12px; white-space: nowrap;">
              ${formatNumber(l.minLimit)} - ${formatNumber(l.maxLimit)} ${l.currency}
            </div>
            <div style="display: flex; flex-wrap: wrap; gap: 4px; justify-content: flex-end;">
              ${l.methods
                .slice(0, 2)
                .map((m) => `<span class="p2p-method-tag" style="font-size:9px; padding: 2px 6px;">${m}</span>`)
                .join("")}
              ${
                l.methods.length > 2
                  ? `<span class="p2p-method-tag" style="font-size:9px; padding: 2px 6px; background:var(--blue); color:#fff;">+${l.methods.length - 2}</span>`
                  : ""
              }
            </div>
            <div class="text-muted" style="font-size:11px; font-weight:600; color:${parseFloat(l.completion) >= 95 ? "var(--green)" : parseFloat(l.completion) >= 80 ? "var(--yellow)" : "var(--red)"};">
              ${l.completion}% completion
            </div>
          </div>
        </div>
      </div>
    `
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
  const listing = currentListings.find((l) => l.id === listingId);
  if (listing && !listing.online) {
    showToast(
      "This merchant is currently offline. Please try another merchant.",
      "error"
    );
    return;
  }

  const user = auth.currentUser;
  if (!user) return;

  db.collection("users")
    .doc(user.uid)
    .get()
    .then((doc) => {
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
      window.location.href = `order.html?id=${listingId}`;
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
waitForPrices(renderListings);
// Modal helper
function closeModal(id) {
  const el = document.getElementById(id);
  if (el) el.style.display = "none";
}
