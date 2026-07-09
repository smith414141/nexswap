// trade.js — full spot trading with live CoinGecko prices, real wallet updates, trade history

const PAIRS = {
  BTCUSDT:  { base: "BTC",  quote: "USDT", geckoId: "bitcoin",       decimals: 8 },
  ETHUSDT:  { base: "ETH",  quote: "USDT", geckoId: "ethereum",      decimals: 6 },
  SOLUSDT:  { base: "SOL",  quote: "USDT", geckoId: "solana",        decimals: 4 },
  BNBUSDT:  { base: "BNB",  quote: "USDT", geckoId: "binancecoin",   decimals: 4 },
  XRPUSDT:  { base: "XRP",  quote: "USDT", geckoId: "ripple",        decimals: 2 },
  ADAUSDT:  { base: "ADA",  quote: "USDT", geckoId: "cardano",       decimals: 2 },
  DOGEUSDT: { base: "DOGE", quote: "USDT", geckoId: "dogecoin",      decimals: 2 },
};

let currentPair = "BTCUSDT";
let currentPrice = 0;
let currentOrderType = "limit";
let walletData = {};
let tradeHistory = [];

// Read pair from URL — coin.html links here as trade.html?pair=BTCUSDT
const urlPair = new URLSearchParams(window.location.search).get("pair");
if (urlPair && PAIRS[urlPair]) currentPair = urlPair;

auth.onAuthStateChanged((user) => {
  if (!user || !user.emailVerified) return;

  db.collection("wallets").doc(user.uid).onSnapshot((doc) => {
    walletData = doc.exists ? doc.data() : {};
    updateBalanceDisplay();
  });

  loadTradeHistory(user.uid);
  checkRegionLock(user.uid);
});

function checkRegionLock(uid) {
  db.collection("users").doc(uid).get().then((doc) => {
    const country = doc.data()?.country || "ET";
    const allowed = isFeatureAllowed(country, "futures");
    const msg = document.getElementById("region-lock-message");
    if (msg) {
        msg.style.display = allowed ? "none" : "block";
        document.getElementById("buy-btn").disabled = !allowed;
        document.getElementById("sell-btn").disabled = !allowed;
    }
  });
}

// ── PAIR SWITCHER ──
function setPair(pair) {
  if (!PAIRS[pair]) return;
  currentPair = pair;
  document.querySelectorAll(".pair-pill").forEach(b => b.classList.remove("active"));
  const btn = document.getElementById("pill-" + pair);
  if (btn) btn.classList.add("active");
  document.getElementById("trade-pair").textContent = pair.replace("USDT", "/USDT");
  fetchLivePrice();
  renderTradingViewChart();
  updateBalanceDisplay();
}

// ── LIVE PRICE ──
function fetchLivePrice() {
  const pair = PAIRS[currentPair];
  fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${pair.geckoId}&vs_currencies=usd&include_24hr_change=true`)
    .then(r => r.json())
    .then(data => {
      const d = data[pair.geckoId];
      if (!d) return;
      currentPrice = d.usd;
      const change = d.usd_24h_change || 0;
      const priceEl = document.getElementById("trade-price");
      const changeEl = document.getElementById("trade-change");
      if (priceEl) {
        priceEl.textContent = "$" + currentPrice.toLocaleString(undefined, { maximumFractionDigits: currentPrice < 1 ? 6 : 2 });
        priceEl.style.color = change >= 0 ? "var(--green)" : "var(--red)";
      }
      if (changeEl) {
        changeEl.textContent = (change >= 0 ? "+" : "") + change.toFixed(2) + "%";
        changeEl.style.color = change >= 0 ? "var(--green)" : "var(--red)";
      }
      if (currentOrderType === "market") {
        const inp = document.getElementById("trade-price-input");
        if (inp) inp.value = currentPrice;
      }
      generateOrderBook();
      updateTotalPreview();
    }).catch(() => {});
}

// ── ORDER TYPE ──
function switchOrderType(type, btn) {
  currentOrderType = type;
  document.querySelectorAll(".trade-form .tabs .tab").forEach(t => t.classList.remove("active"));
  btn.classList.add("active");
  const priceInput = document.getElementById("trade-price-input");
  if (type === "market") {
    priceInput.disabled = true;
    priceInput.value = currentPrice || "";
    priceInput.placeholder = "Market Price";
  } else {
    priceInput.disabled = false;
    priceInput.placeholder = "Enter price";
  }
}

// ── BALANCE DISPLAY ──
function updateBalanceDisplay() {
  const pair = PAIRS[currentPair];
  const baseEl = document.getElementById("balance-base");
  const quoteEl = document.getElementById("balance-quote");
  if (baseEl) baseEl.textContent = (walletData[pair.base] || 0).toFixed(pair.decimals) + " " + pair.base;
  if (quoteEl) quoteEl.textContent = (walletData[pair.quote] || 0).toFixed(2) + " " + pair.quote;
}

// ── PERCENT BUTTONS ──
function setPercent(pct, side) {
  const pair = PAIRS[currentPair];
  const price = parseFloat(document.getElementById("trade-price-input").value) || currentPrice;
  if (!price) return;

  const amountInput = document.getElementById("trade-amount-input");
  if (side === "buy") {
    const quoteBalance = walletData[pair.quote] || 0;
    amountInput.value = ((quoteBalance * pct / 100) / price).toFixed(pair.decimals);
  } else {
    const baseBalance = walletData[pair.base] || 0;
    amountInput.value = (baseBalance * pct / 100).toFixed(pair.decimals);
  }
  updateTotalPreview();
}

function updateTotalPreview() {
  const price = parseFloat(document.getElementById("trade-price-input")?.value) || currentPrice;
  const amount = parseFloat(document.getElementById("trade-amount-input")?.value) || 0;
  const totalEl = document.getElementById("trade-total-preview");
  if (totalEl) totalEl.textContent = "Total: " + (price * amount).toFixed(2) + " USDT";
}

// ── PLACE ORDER ──
function placeOrder(side) {
  const user = auth.currentUser;
  if (!user) { showToast("Login required", "error"); return; }

  const pair = PAIRS[currentPair];
  const price = parseFloat(document.getElementById("trade-price-input").value) || currentPrice;
  const amount = parseFloat(document.getElementById("trade-amount-input").value);

  if (!price || price <= 0) { showToast("Enter a valid price", "error"); return; }
  if (!amount || amount <= 0) { showToast("Enter a valid amount", "error"); return; }

  const total = price * amount;
  const baseBalance = walletData[pair.base] || 0;
  const quoteBalance = walletData[pair.quote] || 0;

  if (side === "buy" && total > quoteBalance) { showToast("Insufficient " + pair.quote, "error"); return; }
  if (side === "sell" && amount > baseBalance) { showToast("Insufficient " + pair.base, "error"); return; }

  const btn = document.getElementById(side === "buy" ? "buy-btn" : "sell-btn");
  if (btn) { btn.disabled = true; btn.textContent = "Placing..."; }

  const walletRef = db.collection("wallets").doc(user.uid);
  const update = side === "buy"
    ? { [pair.quote]: firebase.firestore.FieldValue.increment(-total), [pair.base]: firebase.firestore.FieldValue.increment(amount) }
    : { [pair.base]: firebase.firestore.FieldValue.increment(-amount), [pair.quote]: firebase.firestore.FieldValue.increment(total) };

  walletRef.update(update)
    .then(() => db.collection("tradeHistory").add({
      userId: user.uid,
      pair: currentPair,
      side,
      type: currentOrderType,
      price,
      amount,
      total,
      status: "filled",
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    }))
    .then(() => {
      showToast(`✅ ${side.toUpperCase()} ${amount} ${pair.base} @ $${price.toLocaleString()}`, "success");
      document.getElementById("trade-amount-input").value = "";
      updateTotalPreview();
      loadTradeHistory(user.uid);
    })
    .catch(err => showToast(err.message, "error"))
    .finally(() => { if (btn) { btn.disabled = false; btn.textContent = side === "buy" ? "Buy " + pair.base : "Sell " + pair.base; } });
}

// ── TRADE HISTORY ──
function loadTradeHistory(uid) {
  db.collection("tradeHistory").where("userId", "==", uid)
    .orderBy("createdAt", "desc").limit(20).get().then(snap => {
    const container = document.getElementById("trade-history-list");
    if (!container) return;
    if (snap.empty) { container.innerHTML = '<div class="empty-state" style="font-size:12px;">No trades yet.</div>'; return; }
    container.innerHTML = snap.docs.map(doc => {
      const d = doc.data();
      const date = d.createdAt?.toDate?.()?.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) || "--";
      return `<div style="display:flex;justify-content:space-between;align-items:center;padding:5px 0;border-bottom:1px solid var(--border);font-size:11px;">
        <span style="color:${d.side === "buy" ? "var(--green)" : "var(--red)"};">${d.side.toUpperCase()}</span>
        <span>${d.pair}</span>
        <span>${d.amount?.toFixed(4)}</span>
        <span>$${d.price?.toLocaleString()}</span>
        <span style="color:var(--text3);">${date}</span>
      </div>`;
    }).join("");
  }).catch(() => {});
}

// ── ORDER BOOK (simulated around live price) ──
function generateOrderBook() {
  if (!currentPrice) return;
  const base = currentPrice;
  const asks = [], bids = [];
  for (let i = 1; i <= 8; i++) {
    asks.push({ price: (base + i * base * 0.0002).toFixed(2), amount: (Math.random() * 0.8 + 0.05).toFixed(4) });
    bids.push({ price: (base - i * base * 0.0002).toFixed(2), amount: (Math.random() * 0.8 + 0.05).toFixed(4) });
  }
  const askEl = document.getElementById("order-book-asks");
  const bidEl = document.getElementById("order-book-bids");
  if (askEl) askEl.innerHTML = asks.reverse().map(a => `<div><span>${a.price}</span><span>${a.amount}</span><span>${(a.price * a.amount).toFixed(2)}</span></div>`).join("");
  if (bidEl) bidEl.innerHTML = bids.map(b => `<div><span>${b.price}</span><span>${b.amount}</span><span>${(b.price * b.amount).toFixed(2)}</span></div>`).join("");
}

// ── TRADINGVIEW CHART ──
function renderTradingViewChart() {
  const container = document.getElementById("tradingview-widget");
  if (!container || typeof TradingView === "undefined") { setTimeout(renderTradingViewChart, 500); return; }
  container.innerHTML = "";
  new TradingView.widget({
    autosize: true,
    symbol: "BINANCE:" + currentPair,
    interval: "15",
    timezone: "Etc/UTC",
    theme: "dark",
    style: "1",
    locale: "en",
    enable_publishing: false,
    hide_top_toolbar: false,
    save_image: false,
    container_id: "tradingview-widget",
    backgroundColor: "rgba(11,14,17,1)",
    gridColor: "rgba(43,49,57,0.5)",
  });
}

document.addEventListener("DOMContentLoaded", () => {
  setPair(currentPair);
  fetchLivePrice();
  setInterval(fetchLivePrice, 15000);
  renderTradingViewChart();
  document.getElementById("trade-amount-input")?.addEventListener("input", updateTotalPreview);
  document.getElementById("trade-price-input")?.addEventListener("input", updateTotalPreview);
});
