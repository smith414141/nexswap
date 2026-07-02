// trade.js
let currentPair = "BTCUSDT";
let currentPrice = 67500;
let currentOrderType = "limit";

auth.onAuthStateChanged((user) => {
  if (user) checkRegionLock(user.uid);
});

function checkRegionLock(uid) {
  db.collection("users")
    .doc(uid)
    .get()
    .then((doc) => {
      const region = doc.data()?.region || "global";
      const lockMsg = document.getElementById("region-lock-message");
      if (region === "us") {
        lockMsg.style.display = "block";
      } else {
        lockMsg.style.display = "none";
      }
    });
}

function switchOrderType(type, btn) {
  currentOrderType = type;
  document
    .querySelectorAll(".trade-form .tabs .tab")
    .forEach((t) => t.classList.remove("active"));
  btn.classList.add("active");
  const priceInput = document.getElementById("trade-price-input");
  if (type === "market") {
    priceInput.disabled = true;
    priceInput.placeholder = "Market Price";
    priceInput.value = currentPrice;
  } else {
    priceInput.disabled = false;
    priceInput.placeholder = "Enter price";
  }
}

function quickTrade(side) {
  const amount =
    parseFloat(document.getElementById("trade-amount-input").value) || 0.001;
  if (amount <= 0) {
    showToast("Enter amount", "error");
    return;
  }
  const total = amount * currentPrice;
  showToast(
    `${side.toUpperCase()} ${amount} BTC @ $${currentPrice} (Total: $${total.toFixed(
      2
    )})`,
    "info"
  );
  // Simulate balance update
  const user = auth.currentUser;
  if (!user) {
    showToast("Login required", "error");
    return;
  }
  const walletRef = db.collection("wallets").doc(user.uid);
  if (side === "buy") {
    walletRef
      .update({ USDT: firebase.firestore.FieldValue.increment(-total) })
      .then(() => {
        walletRef.update({
          BTC: firebase.firestore.FieldValue.increment(amount),
        });
      })
      .catch((err) => showToast(err.message, "error"));
  } else {
    walletRef
      .update({ BTC: firebase.firestore.FieldValue.increment(-amount) })
      .then(() => {
        walletRef.update({
          USDT: firebase.firestore.FieldValue.increment(total),
        });
      })
      .catch((err) => showToast(err.message, "error"));
  }
}

function placeOrder(side) {
  const price =
    parseFloat(document.getElementById("trade-price-input").value) ||
    currentPrice;
  const amount =
    parseFloat(document.getElementById("trade-amount-input").value) || 0;
  if (!amount || amount <= 0) {
    showToast("Enter valid amount", "error");
    return;
  }
  showToast(
    `✅ ${side.toUpperCase()} LIMIT ${amount} BTC @ $${price}`,
    "success"
  );
}

function setPercent(pct) {
  // Calculate based on BTC balance (simulate)
  const user = auth.currentUser;
  if (!user) return;
  db.collection("wallets")
    .doc(user.uid)
    .get()
    .then((doc) => {
      const bal = doc.data()?.BTC || 0.1;
      const amount = (bal * pct) / 100;
      document.getElementById("trade-amount-input").value = amount.toFixed(6);
    });
}

// ----- TRADINGVIEW WIDGET -----
function initTradingView() {
  if (typeof TradingView === "undefined") {
    setTimeout(initTradingView, 500);
    return;
  }
  new TradingView.widget({
    autosize: true,
    symbol: "BINANCE:BTCUSDT",
    interval: "1",
    timezone: "Etc/UTC",
    theme: "dark",
    style: "1",
    locale: "en",
    toolbar_bg: "#f1f3f6",
    enable_publishing: false,
    hide_top_toolbar: false,
    hide_legend: false,
    save_image: false,
    container_id: "tradingview-widget",
  });
}

// ----- ORDER BOOK SIMULATION -----
function generateOrderBook() {
  const bids = [];
  const asks = [];
  const base = currentPrice;
  for (let i = 0; i < 10; i++) {
    bids.push({
      price: base - (i + 1) * 10,
      amount: (Math.random() * 0.5 + 0.1).toFixed(4),
    });
    asks.push({
      price: base + (i + 1) * 10,
      amount: (Math.random() * 0.5 + 0.1).toFixed(4),
    });
  }
  const bidContainer = document.getElementById("order-book-bids");
  const askContainer = document.getElementById("order-book-asks");
  bidContainer.innerHTML = bids
    .map(
      (b) =>
        `<div><span>${b.price}</span><span>${b.amount}</span><span>${(
          b.price * b.amount
        ).toFixed(2)}</span></div>`
    )
    .join("");
  askContainer.innerHTML = asks
    .map(
      (b) =>
        `<div><span>${b.price}</span><span>${b.amount}</span><span>${(
          b.price * b.amount
        ).toFixed(2)}</span></div>`
    )
    .join("");
}

// ----- PRICE SIMULATION (random walk) -----
function updatePrice() {
  const change = (Math.random() - 0.5) * 60;
  currentPrice = Math.max(1000, currentPrice + change);
  document.getElementById("trade-price").textContent = `$${currentPrice.toFixed(
    2
  )}`;
  generateOrderBook();
}

document.addEventListener("DOMContentLoaded", () => {
  initTradingView();
  generateOrderBook();
  updatePrice();
  setInterval(updatePrice, 3000);
});
