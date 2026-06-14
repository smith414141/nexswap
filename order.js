let listing = null;
let currentOrderId = null;
let currentOrderData = null;
let timerInterval = null;
let cryptoBalance = 0;
let phaseExpiredFlag = false;

auth.onAuthStateChanged((user) => {
  if (!user || !user.emailVerified) return;
  init(user);
});

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

  if (listing.type === "sell") {
    document.getElementById("payout-section").style.display = "block";
    const methodSelect = document.getElementById("payout-method");
    methodSelect.innerHTML = listing.methods
      .map((m) => `<option value="${m}">${m}</option>`)
      .join("");

    db.collection("wallets")
      .doc(user.uid)
      .get()
      .then((doc) => {
        if (doc.exists) cryptoBalance = doc.data()[listing.crypto] || 0;
      });
  }
}

function renderListingInfo() {
  document.getElementById("trader-avatar").style.background =
    listing.color + "22";
  document.getElementById("trader-avatar").style.color = listing.color;
  document.getElementById("trader-avatar").textContent = listing.initials;
  document.getElementById("trader-name").textContent = listing.name;
  document.getElementById("trader-verified").textContent = listing.verified
    ? "✓"
    : "";
  document.getElementById(
    "trader-stats"
  ).innerHTML = `<span class="online-dot ${
    listing.online ? "online" : "offline"
  }"></span>${listing.online ? "Online" : "Offline"} • ${
    listing.trades
  } trades • ${listing.completion}%`;

  const badge = document.getElementById("order-type-badge");
  badge.textContent = listing.type === "buy" ? "BUY" : "SELL";
  badge.className = "order-type " + listing.type;

  document.getElementById("fiat-currency-label").textContent = listing.currency;
  document.getElementById("crypto-label").textContent = listing.crypto;
  document.getElementById("limit-display").textContent = `Limit: ${formatNumber(
    listing.minLimit
  )} - ${formatNumber(listing.maxLimit)} ${listing.currency}`;

  document.getElementById("confirm-order-btn").textContent =
    listing.type === "buy" ? "Buy " + listing.crypto : "Sell " + listing.crypto;
}

function formatNumber(n) {
  return Number(n).toLocaleString("en-US");
}

function calcCrypto() {
  const fiat = parseFloat(document.getElementById("fiat-amount").value) || 0;
  const crypto = fiat / listing.price;
  const decimals = listing.crypto === "BTC" ? 8 : 4;
  document.getElementById("crypto-amount-display").textContent =
    crypto.toFixed(decimals);
}

function confirmOrder() {
  const user = auth.currentUser;
  const fiatAmount = parseFloat(document.getElementById("fiat-amount").value);

  if (!fiatAmount || fiatAmount <= 0) {
    showToast("Enter a valid amount", "error");
    return;
  }
  if (fiatAmount < listing.minLimit || fiatAmount > listing.maxLimit) {
    showToast(
      `Amount must be between ${formatNumber(
        listing.minLimit
      )} and ${formatNumber(listing.maxLimit)} ${listing.currency}`,
      "error"
    );
    return;
  }

  const cryptoAmount = fiatAmount / listing.price;

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
      paymentMethod: listing.methods[0],
      status: "awaiting_payment",
      messages: [],
      phaseExpiresAt: expiresAt,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    })
    .then((docRef) => {
      currentOrderId = docRef.id;
      sessionStorage.setItem("activeOrderId", currentOrderId);
      listenToOrder();
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
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      });
    })
    .then((docRef) => {
      currentOrderId = docRef.id;
      sessionStorage.setItem("activeOrderId", currentOrderId);
      listenToOrder();
    })
    .catch((err) => {
      showToast(err.message, "error");
      btn.disabled = false;
      btn.textContent = "Sell " + listing.crypto;
    });
}

function listenToOrder() {
  document.getElementById("step-amount").style.display = "none";
  document.getElementById("step-order").style.display = "block";

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
  renderChat();
  startTimer();
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
    .then(() => showToast("Order cancelled", "info"));
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
    })
    .catch((err) => showToast(err.message, "error"));
}

function finishOrder() {
  sessionStorage.removeItem("activeOrderId");
  sessionStorage.removeItem("currentOrder");
  window.location.href =
    currentOrderData.status === "completed" ? "home.html" : "p2p.html";
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
