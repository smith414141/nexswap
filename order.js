let currentOrderId = null;
let currentOrderData = null;
let timerInterval = null;
let cryptoBalance = 0;
let phaseExpiredFlag = false;
let selectedPaymentMethod = null;
let orderCreated = false; // tracks if order has been created (for modal close logic)

// Helper to close modal when on p2p.html
function closeOrderModalIfNeeded() {
  if (typeof closeOrderModal === "function" && orderCreated) {
    closeOrderModal();
    if (typeof loadP2POrders === "function") loadP2POrders();
  } else {
    window.location.href = "p2p.html";
  }
}

// Only initialize order flow on order.html page
const isOrderPage = window.location.pathname.includes("order.html");
if (isOrderPage) {
  auth.onAuthStateChanged((user) => {
    if (!user || !user.emailVerified) return;
    init(user);
  });
}

function init(user) {
  const savedOrderId = sessionStorage.getItem("activeOrderId");
  if (savedOrderId) {
    currentOrderId = savedOrderId;
    listenToOrder();
    return;
  }

  const listingData = sessionStorage.getItem("currentOrder");
  if (!listingData) {
    window.location.href = "p2p.html";
    return;
  }
  listing = JSON.parse(listingData);
  renderListingInfo();

  let userP2PAccounts = [];

  db.collection("addressBook").doc(user.uid).get().then((doc) => {
    if (doc.exists) {
      userP2PAccounts = doc.data().p2pAccounts || [];
    }
    if (listing.type === "sell") {
      setupPayoutSection(user, userP2PAccounts);
    }

    db.collection("wallets")
      .doc(user.uid)
      .get()
      .then((doc) => {
        if (doc.exists) cryptoBalance = doc.data()[listing.crypto] || 0;
      });
  });
}

function setupPayoutSection(user, savedAccounts) {
  const sellerMethods = listing.methods;

  const compatibleAccounts = savedAccounts.filter(
    (a) => sellerMethods.includes(a.method)
  );

  const methodSelect = document.getElementById("payout-method");
  const accountInput = document.getElementById("payout-account");
  const payoutSection = document.getElementById("payout-section");

  methodSelect.innerHTML = sellerMethods
    .map((m) => `<option value="${m}">${m}</option>`)
    .join("");

  if (compatibleAccounts.length > 0) {
    const match = compatibleAccounts[0];
    methodSelect.value = match.method;
    accountInput.value = match.account;
    const helper = document.getElementById("payout-saved-helper");
    if (helper) {
      helper.textContent = `✓ Using saved ${match.method} account: ${match.account}`;
      helper.style.display = "block";
    }
  } else {
    showAddPaymentMethodPrompt(user, sellerMethods, savedAccounts);
  }

  payoutSection.style.display = "block";

  methodSelect.addEventListener("change", () => {
    const selected = methodSelect.value;
    const saved = savedAccounts.find((a) => a.method === selected);
    if (saved) {
      accountInput.value = saved.account;
      const helper = document.getElementById("payout-saved-helper");
      if (helper) {
        helper.textContent = `✓ Using saved ${selected} account: ${saved.account}`;
        helper.style.display = "block";
      }
    } else {
      accountInput.value = "";
      const helper = document.getElementById("payout-saved-helper");
      if (helper) helper.style.display = "none";
    }
  });
}

function showAddPaymentMethodPrompt(user, sellerMethods, savedAccounts) {
  const methodList = sellerMethods.join(", ");

  const overlay = document.createElement("div");
  overlay.className = "modal-overlay";
  overlay.style.display = "flex";
  overlay.innerHTML = `
    <div class="modal-sheet" style="max-width:380px;">
      <div class="modal-header">
        <div class="modal-title">Add Payment Method</div>
        <span class="modal-close" onclick="this.closest('.modal-overlay').remove()">×</span>
      </div>
      <div style="padding:16px 20px 8px; color:var(--text2); font-size:13.5px; line-height:1.5;">
        This seller accepts: <strong>${methodList}</strong>.<br><br>
        ${savedAccounts.length > 0
          ? `You have saved payment methods, but none match this seller. Add a compatible one to proceed.`
          : `You don't have any saved payment methods yet. Add one to start selling.`}
      </div>
      <div style="padding:8px 20px;">
        <label style="font-size:11px; font-weight:700; text-transform:uppercase;
          letter-spacing:0.04em; color:var(--text3); display:block; margin-bottom:6px;">
          Select Method to Add
        </label>
        <select id="add-pm-method" style="width:100%; padding:10px 12px; border-radius:10px;
          background:var(--bg3); border:1px solid var(--border); color:var(--text); font-size:13px; margin-bottom:12px;">
          ${sellerMethods.map((m) => `<option value="${m}">${m}</option>`).join("")}
        </select>
        <label style="font-size:11px; font-weight:700; text-transform:uppercase;
          letter-spacing:0.04em; color:var(--text3); display:block; margin-bottom:6px;">
          Account / Phone Number
        </label>
        <input id="add-pm-account" type="text" placeholder="e.g. 0912345678"
          style="width:100%; padding:10px 12px; border-radius:10px; background:var(--bg3);
          border:1px solid var(--border); color:var(--text); font-size:13px;
          box-sizing:border-box; margin-bottom:16px;" />
      </div>
      <div style="padding:0 20px 20px;">
        <button class="btn-primary" style="width:100%;"
          onclick="saveAndApplyPaymentMethod(event, '${user.uid}')">
          Save & Continue →
        </button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
}

function saveAndApplyPaymentMethod(e, uid) {
  const method = document.getElementById("add-pm-method").value;
  const account = document.getElementById("add-pm-account").value.trim();

  if (!account) {
    showToast("Enter your account / phone number", "error");
    return;
  }

  const btn = e.target;
  btn.disabled = true;
  btn.textContent = "Saving...";

  const newEntry = { method, account, label: method };

  db.collection("addressBook").doc(uid).set(
    { p2pAccounts: firebase.firestore.FieldValue.arrayUnion(newEntry) },
    { merge: true }
  )
  .then(() => {
    showToast(`${method} account saved!`, "success");
    document.querySelector(".modal-overlay")?.remove();
    const methodSelect = document.getElementById("payout-method");
    const accountInput = document.getElementById("payout-account");
    if (methodSelect) methodSelect.value = method;
    if (accountInput) accountInput.value = account;
    const helper = document.getElementById("payout-saved-helper");
    if (helper) {
      helper.textContent = `✓ Using ${method} account: ${account}`;
      helper.style.display = "block";
    }
  })
  .catch((err) => {
    showToast(err.message, "error");
    btn.disabled = false;
    btn.textContent = "Save & Continue →";
  });
}

function renderListingInfo() {
  const traderAvatar = document.getElementById("trader-avatar");
  if (traderAvatar) {
    traderAvatar.style.background = listing.color + "22";
    traderAvatar.style.color = listing.color;
    traderAvatar.textContent = listing.initials;
  }
  const traderName = document.getElementById("trader-name");
  if (traderName) traderName.textContent = listing.name;
  const traderVerified = document.getElementById("trader-verified");
  if (traderVerified) traderVerified.textContent = listing.verified ? "✓" : "";
  const onlineDot = document.getElementById("trader-online-dot");
  if (onlineDot) onlineDot.style.background = listing.online
    ? "var(--green)"
    : "var(--text3)";
  const onlineStatus = document.getElementById("trader-online-status");
  if (onlineStatus) onlineStatus.className = "online-dot " + (listing.online ? "online" : "offline");
  const statsText = document.getElementById("trader-stats-text");
  if (statsText) statsText.textContent = `${listing.online ? "Online" : "Offline"} • ${listing.trades} trades • ${listing.completion}%`;
  // Also support modal's trader-stats element
  const modalStats = document.getElementById("trader-stats");
  if (modalStats) modalStats.textContent = `${listing.online ? "Online" : "Offline"} • ${listing.trades} trades • ${listing.completion}%`;

  const badge = document.getElementById("order-type-badge");
  if (badge) {
    badge.textContent = listing.type === "buy" ? "BUY" : "SELL";
    badge.className = "order-type " + listing.type;
  }

  // --- New header info fields ---
  const headerTitle = document.getElementById("order-header-title");
  if (headerTitle) {
    headerTitle.textContent = (listing.type === "sell" ? "Sell" : "Buy")
      + " " + listing.crypto;
    headerTitle.style.color = listing.type === "sell"
      ? "var(--red)" : "var(--text2)";
  }

  const priceDisplay = document.getElementById("order-price-display");
  if (priceDisplay) {
    priceDisplay.textContent = listing.price
      ? listing.price.toLocaleString() : "—";
    priceDisplay.style.color = listing.type === "sell"
      ? "var(--red)" : "var(--green)";
  }

  const pairLabel = document.getElementById("order-pair-label");
  if (pairLabel) pairLabel.textContent = `${listing.currency} / ${listing.crypto}`;

  const availDisplay = document.getElementById("order-available-display");
  if (availDisplay) availDisplay.textContent = `${listing.available} ${listing.crypto}`;

  const limitInline = document.getElementById("order-limit-inline");
  if (limitInline) limitInline.textContent =
    `${listing.minLimit?.toLocaleString()}–${listing.maxLimit?.toLocaleString()} ${listing.currency}`;

  const fiatCurrencyLabel = document.getElementById("fiat-currency-label");
  if (fiatCurrencyLabel) fiatCurrencyLabel.textContent = listing.currency;
  const cryptoLabel = document.getElementById("crypto-label");
  if (cryptoLabel) cryptoLabel.textContent = listing.crypto;
  const limitDisplay = document.getElementById("limit-display");
  if (limitDisplay) limitDisplay.textContent = `Limit: ${formatNumber(
    listing.minLimit
  )} - ${formatNumber(listing.maxLimit)} ${listing.currency}`;

  // SELL: input box takes crypto amount, shows ETB result.
  // BUY: input box takes ETB amount, shows crypto result (unchanged).
  if (listing.type === "sell") {
    const amountTitle = document.getElementById("amount-entry-title");
    if (amountTitle) amountTitle.textContent = "Enter Amount to Sell";
    const fiatAmount = document.getElementById("fiat-amount");
    if (fiatAmount) fiatAmount.placeholder = "0";
    if (fiatCurrencyLabel) fiatCurrencyLabel.textContent = listing.crypto;
    if (cryptoLabel) cryptoLabel.textContent = listing.currency;
    if (limitDisplay) limitDisplay.textContent = `Limit: ${formatNumber(
      (listing.minLimit / listing.price).toFixed(
        listing.crypto === "BTC" ? 8 : 4
      )
    )} - ${formatNumber(
      (listing.maxLimit / listing.price).toFixed(
        listing.crypto === "BTC" ? 8 : 4
      )
    )} ${listing.crypto}`;
  } else {
    const amountTitle = document.getElementById("amount-entry-title");
    if (amountTitle) amountTitle.textContent = "Enter Amount";
  }

  // Update confirm button label and color
  const confirmBtn = document.getElementById("confirm-order-btn");
  if (confirmBtn) {
    confirmBtn.textContent = listing.type === "sell"
      ? "Confirm Sell" : "Confirm Buy";
    confirmBtn.style.background = listing.type === "sell"
      ? "var(--red)" : "var(--green)";
  }

  // Show payment method pills for BUY orders
  if (listing.type === "buy" || listing.type !== "sell") {
    const buySection = document.getElementById("buy-payment-section");
    const pillsContainer = document.getElementById("buy-payment-pills");
    if (buySection && pillsContainer && listing.methods?.length) {
      buySection.style.display = "block";
      let selectedMethod = listing.methods[0];
      function renderPills() {
        pillsContainer.innerHTML = listing.methods.map((m) => `
          <button onclick="selectPaymentMethod('${m}')"
            style="padding:7px 16px; border-radius:20px; font-size:12px;
              font-weight:600; cursor:pointer;
              border: 1.5px solid ${m === selectedMethod ? "var(--green)" : "var(--border)"};
              background: ${m === selectedMethod ? "var(--green)22" : "var(--bg3)"};
              color: ${m === selectedMethod ? "var(--green)" : "var(--text)"};">
            ${m === selectedMethod ? "● " : ""}${m}
          </button>`).join("");
      }
      window.selectPaymentMethod = function(m) {
        selectedMethod = m;
        selectedPaymentMethod = m;
        renderPills();
      };
      renderPills();
    }
  }
}

function formatNumber(n) {
  return Number(n).toLocaleString("en-US");
}

function calcCrypto() {
  const inputVal =
    parseFloat(document.getElementById("fiat-amount")?.value) || 0;
  const decimals = listing?.crypto === "BTC" ? 8 : 4;

  if (listing?.type === "sell") {
    // Input box holds CRYPTO amount here; show ETB (fiat) result instead.
    const fiatResult = inputVal * (listing?.price || 0);
    const cryptoDisplay = document.getElementById("crypto-amount-display");
    if (cryptoDisplay) cryptoDisplay.textContent = fiatResult.toFixed(2);
  } else {
    // Input box holds FIAT amount (unchanged); show crypto result.
    const cryptoResult = inputVal / (listing?.price || 1);
    const cryptoDisplay = document.getElementById("crypto-amount-display");
    if (cryptoDisplay) cryptoDisplay.textContent = cryptoResult.toFixed(decimals);
  }
}

function setMaxAmount() {
  if (!listing) return;
  const input = document.getElementById("fiat-amount");
  if (!input) return;
  if (listing.type === "sell") {
    // For sell, max is based on user's crypto balance converted to fiat
    const maxFiat = (cryptoBalance || 0) * (listing.price || 0);
    const capped = Math.min(maxFiat, listing.maxLimit || 0);
    input.value = capped.toFixed(2);
    calcCrypto();
  } else {
    input.value = listing.maxLimit || 0;
    calcCrypto();
  }
}

function confirmOrder() {
  const user = auth.currentUser;
  const inputVal = parseFloat(document.getElementById("fiat-amount").value);

  if (!inputVal || inputVal <= 0) {
    showToast("Enter a valid amount", "error");
    return;
  }

  let fiatAmount, cryptoAmount;

  if (listing.type === "sell") {
    // User typed a CRYPTO amount. Derive fiat from it.
    cryptoAmount = inputVal;
    fiatAmount = inputVal * listing.price;

    if (fiatAmount < listing.minLimit || fiatAmount > listing.maxLimit) {
      const minCrypto = (listing.minLimit / listing.price).toFixed(
        listing.crypto === "BTC" ? 8 : 4
      );
      const maxCrypto = (listing.maxLimit / listing.price).toFixed(
        listing.crypto === "BTC" ? 8 : 4
      );
      showToast(
        `Amount must be between ${minCrypto} and ${maxCrypto} ${listing.crypto}`,
        "error"
      );
      return;
    }
  } else {
    // User typed a FIAT amount (unchanged behavior).
    fiatAmount = inputVal;
    cryptoAmount = inputVal / listing.price;

    if (fiatAmount < listing.minLimit || fiatAmount > listing.maxLimit) {
      showToast(
        `Amount must be between ${formatNumber(
          listing.minLimit
        )} and ${formatNumber(listing.maxLimit)} ${listing.currency}`,
        "error"
      );
      return;
    }
  }

  if (listing.type === "sell") {
    const payoutMethod = document.getElementById("payout-method").value;
    const payoutAccount = document
      .getElementById("payout-account")
      .value.trim();
    if (!payoutAccount) {
      showToast("Enter your payout account details", "error");
      return;
    }
    if (cryptoAmount > cryptoBalance) {
      showToast(
        `Insufficient balance. You have ${cryptoBalance.toFixed(
          listing.crypto === "BTC" ? 8 : 2
        )} ${listing.crypto}`,
        "error"
      );
      return;
    }
    createSellOrder(
      user,
      fiatAmount,
      cryptoAmount,
      payoutMethod,
      payoutAccount
    );
  } else {
    createBuyOrder(user, fiatAmount, cryptoAmount);
  }
}

function createBuyOrder(user, fiatAmount, cryptoAmount) {
  orderCreated = true;
  const btn = document.getElementById("confirm-order-btn");
  btn.disabled = true;
  btn.textContent = "Creating order...";

  const expiresAt = firebase.firestore.Timestamp.fromDate(
    new Date(Date.now() + 10 * 60 * 1000)
  );

  db.collection("p2pOrders")
    .add({
      type: "buy",
      userId: user.uid,
      buyerUid: user.uid,
      sellerUid: user.uid,
      userEmail: user.email,
      crypto: listing.crypto,
      currency: listing.currency,
      fiatAmount,
      cryptoAmount,
      price: listing.price,
      traderName: listing.name,
      paymentMethod: selectedPaymentMethod || listing.methods[0],
      status: "awaiting_payment",
      messages: [],
      phaseExpiresAt: expiresAt,
      merchantUid: listing.merchantUid || null,
      listingId: listing.listingId || null,
      creditApplied: false,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    })
    .then((docRef) => {
      currentOrderId = docRef.id;
      sessionStorage.setItem("activeOrderId", currentOrderId);
      listenToOrder();
      // Switch to order view in modal
      const stepAmount = document.getElementById("step-amount");
      const stepOrder = document.getElementById("step-order");
      if (stepAmount) stepAmount.style.display = "none";
      if (stepOrder) stepOrder.style.display = "block";
      // Clear draft since order is created
      if (typeof clearOrderDraftOnCreate === "function") clearOrderDraftOnCreate();
    })
    .catch((err) => {
      showToast(err.message, "error");
      btn.disabled = false;
      btn.textContent = "Buy " + listing.crypto;
    });
}

function createSellOrder(
  user,
  fiatAmount,
  cryptoAmount,
  payoutMethod,
  payoutAccount
) {
  orderCreated = true;
  const btn = document.getElementById("confirm-order-btn");
  btn.disabled = true;
  btn.textContent = "Creating order...";

  const expiresAt = firebase.firestore.Timestamp.fromDate(
    new Date(Date.now() + 15 * 60 * 1000)
  );

  db.collection("wallets")
    .doc(user.uid)
    .update({
      [listing.crypto]: firebase.firestore.FieldValue.increment(-cryptoAmount),
    })
    .then(() => {
      return db.collection("p2pOrders").add({
        type: "sell",
        userId: user.uid,
        buyerUid: user.uid,
        sellerUid: user.uid,
        userEmail: user.email,
        crypto: listing.crypto,
        currency: listing.currency,
        fiatAmount,
        cryptoAmount,
        price: listing.price,
        traderName: listing.name,
        paymentMethod: payoutMethod,
        payoutAccount,
        status: "awaiting_release",
        messages: [],
        phaseExpiresAt: expiresAt,
        merchantUid: listing.merchantUid || null,
        listingId: listing.listingId || null,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      });
    })
    .then((docRef) => {
      currentOrderId = docRef.id;
      sessionStorage.setItem("activeOrderId", currentOrderId);
      listenToOrder();
      // Switch to order view in modal
      const stepAmount = document.getElementById("step-amount");
      const stepOrder = document.getElementById("step-order");
      if (stepAmount) stepAmount.style.display = "none";
      if (stepOrder) stepOrder.style.display = "block";
      // Clear draft since order is created
      if (typeof clearOrderDraftOnCreate === "function") clearOrderDraftOnCreate();
    })
    .catch((err) => {
      showToast(err.message, "error");
      btn.disabled = false;
      btn.textContent = "Sell " + listing.crypto;
    });
}

function listenToOrder() {
  const stepAmount = document.getElementById("step-amount");
  const stepOrder = document.getElementById("step-order");
  if (stepAmount) stepAmount.style.display = "none";
  if (stepOrder) stepOrder.style.display = "block";

  db.collection("p2pOrders")
    .doc(currentOrderId)
    .onSnapshot((doc) => {
      if (!doc.exists) return;
      currentOrderData = doc.data();
      renderOrder();
    });
}

function renderOrder() {
  const o = currentOrderData;

  if (!listing) {
    document.getElementById("trader-name").textContent = o.traderName;
    const badge = document.getElementById("order-type-badge");
    badge.textContent = o.type.toUpperCase();
    badge.className = "order-type " + o.type;
    document.getElementById("trader-avatar").textContent = o.traderName
      .slice(0, 2)
      .toUpperCase();
    document.getElementById("trader-avatar").style.background = "#3B82F622";
    document.getElementById("trader-avatar").style.color = "#3B82F6";
  }

  document.getElementById("order-id-display").textContent = currentOrderId
    .slice(0, 8)
    .toUpperCase();
  document.getElementById("order-fiat-display").textContent = `${formatNumber(
    o.fiatAmount
  )} ${o.currency}`;
  document.getElementById(
    "order-crypto-display"
  ).textContent = `${o.cryptoAmount.toFixed(o.crypto === "BTC" ? 8 : 4)} ${
    o.crypto
  }`;
  document.getElementById("order-rate-display").textContent = `${formatNumber(
    o.price
  )} ${o.currency}`;

  const statusBadge = document.getElementById("order-status-badge");
  statusBadge.textContent = o.status.replace("_", " ");
  statusBadge.className = "badge " + getStatusBadgeClass(o.status);

  renderStatusContent();
  if (o.status === "completed" && o.type === "buy" && !o.creditApplied) {
    applyBuyCredit();
  }
  renderChat();
  startTimer();
}
let creditingInProgress = false;
function applyBuyCredit() {
  if (creditingInProgress) return;
  creditingInProgress = true;
  const user = auth.currentUser;
  const o = currentOrderData;
  db.collection("wallets")
    .doc(user.uid)
    .update({
      [o.crypto]: firebase.firestore.FieldValue.increment(o.cryptoAmount),
    })
    .then(() => {
      return db
        .collection("p2pOrders")
        .doc(currentOrderId)
        .update({ creditApplied: true });
    })
    .then(() => {
      showToast(
        `${o.cryptoAmount.toFixed(o.crypto === "BTC" ? 8 : 4)} ${
          o.crypto
        } credited to your balance!`,
        "success"
      );
    })
    .catch((err) => console.error(err))
    .finally(() => {
      creditingInProgress = false;
    });
}

function getStatusBadgeClass(status) {
  if (status === "completed") return "badge-green";
  if (status === "cancelled" || status === "disputed") return "badge-red";
  return "badge-yellow";
}

function renderStatusContent() {
  const o = currentOrderData;
  const container = document.getElementById("status-content");

  if (o.status === "awaiting_payment") {
    const details = getPaymentDetails(o.currency, o.paymentMethod);
    container.innerHTML = `
      <div class="payment-info-box">
        <p class="payment-info-title">💳 Send payment via ${o.paymentMethod}</p>
        ${
          details
            ? Object.entries(details)
                .map(
                  ([k, v]) =>
                    `<div class="payment-info-row"><span>${k}</span><strong>${v}</strong></div>`
                )
                .join("")
            : '<p style="font-size:12px; color:var(--text2);">Payment details will be sent in chat by the trader.</p>'
        }
        <div class="payment-info-row"><span>Amount</span><strong>${formatNumber(
          o.fiatAmount
        )} ${o.currency}</strong></div>
      </div>
      <div class="file-upload" onclick="document.getElementById('proof-upload').click()">
        <div class="file-upload-icon">📄</div>
        <div class="file-upload-text"><span>Tap to upload</span> payment screenshot</div>
        <input type="file" id="proof-upload" accept="image/*" style="display:none" onchange="previewProof(this)" />
      </div>
      <img id="proof-preview" style="display:none; width:100%; border-radius:10px; margin-bottom:12px;" />
      <button class="btn-primary" onclick="markAsPaid()">I've Sent the Payment</button>
      <button class="btn-secondary" onclick="cancelOrder()">Cancel Order</button>
    `;
  } else if (o.status === "awaiting_release" && o.type === "buy") {
    container.innerHTML = `
      <div class="kyc-step">
        <div class="kyc-step-icon">⏳</div>
        <div>
          <div class="kyc-step-title">Waiting for Release</div>
          <div class="kyc-step-desc">The trader is verifying your payment. Your ${o.crypto} will be released shortly.</div>
        </div>
      </div>
    `;
  } else if (o.status === "awaiting_release" && o.type === "sell") {
    container.innerHTML = `
      <div class="kyc-step">
        <div class="kyc-step-icon">⏳</div>
        <div>
          <div class="kyc-step-title">Sending Your Payment</div>
          <div class="kyc-step-desc">Your ${
            o.crypto
          } has been reserved. ${formatNumber(o.fiatAmount)} ${
      o.currency
    } will be sent to ${o.payoutAccount} (${o.paymentMethod}) shortly.</div>
        </div>
      </div>
      <button class="btn-secondary" onclick="cancelSellOrder()">Cancel & Refund</button>
    `;
  } else if (o.status === "completed") {
    container.innerHTML = `
      <div class="kyc-step">
        <div class="kyc-step-icon">✅</div>
        <div>
          <div class="kyc-step-title">Order Completed</div>
          <div class="kyc-step-desc">This trade has been completed successfully.</div>
        </div>
      </div>
      <button class="btn-primary" onclick="finishOrder()">Done</button>
    `;
  } else if (o.status === "cancelled") {
    container.innerHTML = `
      <div class="kyc-step">
        <div class="kyc-step-icon">❌</div>
        <div>
          <div class="kyc-step-title">Order Cancelled</div>
          <div class="kyc-step-desc">This order was cancelled.</div>
        </div>
      </div>
      <button class="btn-primary" onclick="finishOrder()">Back to P2P</button>
    `;
  } else if (o.status === "disputed") {
    container.innerHTML = `
      <div class="kyc-step">
        <div class="kyc-step-icon">⚠️</div>
        <div>
          <div class="kyc-step-title">Under Review</div>
          <div class="kyc-step-desc">This order needs manual review by support. Please use the chat below to provide details.</div>
        </div>
      </div>
    `;
  }
}

function previewProof(input) {
  const file = input.files[0];
  if (!file) return;
  if (file.size > 2 * 1024 * 1024) {
    showToast("File too large. Max 2MB.", "error");
    input.value = "";
    return;
  }
  const reader = new FileReader();
  reader.onload = (e) => {
    const preview = document.getElementById("proof-preview");
    preview.src = e.target.result;
    preview.style.display = "block";
  };
  reader.readAsDataURL(file);
}

function markAsPaid() {
  const input = document.getElementById("proof-upload");
  if (!input.files[0]) {
    showToast("Please upload your payment screenshot", "error");
    return;
  }

  const reader = new FileReader();
  reader.onload = (e) => {
    const expiresAt = firebase.firestore.Timestamp.fromDate(
      new Date(Date.now() + 15 * 60 * 1000)
    );
    db.collection("p2pOrders")
      .doc(currentOrderId)
      .update({
        status: "awaiting_release",
        paymentProof: e.target.result,
        phaseExpiresAt: expiresAt,
      })
      .then(() => {
        showToast("Payment marked as sent!", "success");
      })
      .catch((err) => showToast(err.message, "error"));
  };
  reader.readAsDataURL(input.files[0]);
}

function cancelOrder() {
  db.collection("p2pOrders")
    .doc(currentOrderId)
    .update({
      status: "cancelled",
    })
    .then(() => {
      showToast("Order cancelled", "info");
      closeOrderModalIfNeeded();
    });
}

function cancelSellOrder() {
  const user = auth.currentUser;
  const o = currentOrderData;
  db.collection("wallets")
    .doc(user.uid)
    .update({
      [o.crypto]: firebase.firestore.FieldValue.increment(o.cryptoAmount),
    })
    .then(() => {
      return db
        .collection("p2pOrders")
        .doc(currentOrderId)
        .update({ status: "cancelled" });
    })
    .then(() => {
      showToast("Order cancelled and balance refunded", "success");
      closeOrderModalIfNeeded();
    })
    .catch((err) => showToast(err.message, "error"));
}

function finishOrder() {
  sessionStorage.removeItem("activeOrderId");
  sessionStorage.removeItem("currentOrder");
  currentOrderId = null;
  currentOrderData = null;
  if (typeof closeOrderModal === "function") {
    closeOrderModal();
    if (typeof loadP2POrders === "function") loadP2POrders();
  } else {
    window.location.href = "p2p.html";
  }
}

function startTimer() {
  if (timerInterval) clearInterval(timerInterval);
  phaseExpiredFlag = false;

  const o = currentOrderData;
  if (!["awaiting_payment", "awaiting_release"].includes(o.status)) {
    document.getElementById("timer-box").style.display = "none";
    return;
  }
  document.getElementById("timer-box").style.display = "flex";
  document.getElementById("timer-text").textContent =
    o.status === "awaiting_payment"
      ? "Time left to send payment"
      : o.type === "buy"
      ? "Time left for release"
      : "Time left for payout";

  function tick() {
    const remaining = o.phaseExpiresAt.toDate().getTime() - Date.now();
    if (remaining <= 0) {
      document.getElementById("timer-count").textContent = "00:00";
      clearInterval(timerInterval);
      if (!phaseExpiredFlag) {
        phaseExpiredFlag = true;
        handleExpiry();
      }
      return;
    }
    const mins = Math.floor(remaining / 60000);
    const secs = Math.floor((remaining % 60000) / 1000);
    document.getElementById("timer-count").textContent = `${String(
      mins
    ).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  }
  tick();
  timerInterval = setInterval(tick, 1000);
}

function handleExpiry() {
  const o = currentOrderData;
  if (o.status === "awaiting_payment") {
    db.collection("p2pOrders")
      .doc(currentOrderId)
      .update({ status: "cancelled" });
  } else if (o.status === "awaiting_release") {
    db.collection("p2pOrders")
      .doc(currentOrderId)
      .update({ status: "disputed" });
  }
}

function renderChat() {
  const messages = currentOrderData.messages || [];
  const container = document.getElementById("chat-messages");
  const user = auth.currentUser;

  container.innerHTML = messages
    .map(
      (m) => `
    <div class="chat-msg ${m.sender === user.uid ? "mine" : "theirs"}">
      ${
        m.sender !== user.uid
          ? `<div style="font-size:10px; opacity:0.6; margin-bottom:2px;">${
              m.senderName || "Support"
            }</div>`
          : ""
      }
      ${m.text}
    </div>
  `
    )
    .join("");
  container.scrollTop = container.scrollHeight;
}

function sendMessage() {
  const input = document.getElementById("chat-input");
  const text = input.value.trim();
  if (!text) return;

  const user = auth.currentUser;
  db.collection("p2pOrders")
    .doc(currentOrderId)
    .update({
      messages: firebase.firestore.FieldValue.arrayUnion({
        sender: user.uid,
        senderName: "You",
        text,
        time: Date.now(),
      }),
    })
    .then(() => {
      input.value = "";
    })
    .catch((err) => showToast(err.message, "error"));
}
