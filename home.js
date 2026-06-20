// ---- LOAD USER DATA ----
auth.onAuthStateChanged((user) => {
  if (!user || !user.emailVerified) return;
  loadKycStatus(user.uid);
  loadWallet(user.uid);
});

function loadKycStatus(uid) {
  db.collection("users")
    .doc(uid)
    .onSnapshot((doc) => {
      if (!doc.exists) return;
      const data = doc.data();
      ["kyc-badge", "kyc-badge-pc"].forEach((id) => {
        const badge = document.getElementById(id);
        if (!badge) return;
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
    });
}

let currentPrices = {
  BTC: 67500,
  ETH: 3500,
  USDT: 1,
  BNB: 600,
  SOL: 150,
  XRP: 0.5,
};

function loadWallet(uid) {
  db.collection("wallets")
    .doc(uid)
    .onSnapshot((doc) => {
      if (!doc.exists) return;
      const data = doc.data();
      const btc = data.BTC || 0;
      const usdt = data.USDT || 0;

      document.getElementById("btc-balance").textContent = btc.toFixed(8);
      document.getElementById("usdt-balance").textContent = usdt.toFixed(2);

      // Show USD from cache immediately
      const cached = localStorage.getItem("cachedPrices");
      if (cached) {
        try {
          const prices = JSON.parse(cached);
          if (prices.bitcoin) currentPrices.BTC = prices.bitcoin.usd;
          if (prices.tether) currentPrices.USDT = prices.tether.usd;
        } catch (e) {}
      }
      updateBalanceUSD(btc, usdt);
    });
}

function updateBalanceUSD(btc, usdt) {
  const btcUsd = btc * currentPrices.BTC;
  const usdtUsd = usdt * currentPrices.USDT;
  const total = btcUsd + usdtUsd;

  document.getElementById("btc-balance-usd").textContent = `$${btcUsd.toFixed(
    2
  )}`;
  document.getElementById("usdt-balance-usd").textContent = `$${usdtUsd.toFixed(
    2
  )}`;
  document.getElementById("total-balance").textContent = `$${total.toFixed(2)}`;
}

// ---- LIVE PRICES FROM COINGECKO ----
function fetchPrices() {
  // Show cached prices instantly
  const cached = localStorage.getItem("cachedPrices");
  if (cached) {
    try {
      const prices = JSON.parse(cached);
      applyPrices(prices);
    } catch (e) {}
  }

  // Fetch fresh prices in background
  fetch(
    "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,tether,binancecoin,solana,ripple&vs_currencies=usd&include_24hr_change=true"
  )
    .then((res) => res.json())
    .then((data) => {
      localStorage.setItem("cachedPrices", JSON.stringify(data));
      applyPrices(data);

      // Update currentPrices and recalculate balance
      if (data.bitcoin) currentPrices.BTC = data.bitcoin.usd;
      if (data.ethereum) currentPrices.ETH = data.ethereum.usd;
      if (data.tether) currentPrices.USDT = data.tether.usd;
      if (data.binancecoin) currentPrices.BNB = data.binancecoin.usd;
      if (data.solana) currentPrices.SOL = data.solana.usd;
      if (data.ripple) currentPrices.XRP = data.ripple.usd;

      const btcBal =
        parseFloat(document.getElementById("btc-balance").textContent) || 0;
      const usdtBal =
        parseFloat(document.getElementById("usdt-balance").textContent) || 0;
      updateBalanceUSD(btcBal, usdtBal);
    })
    .catch(() => {
      // Silently fail — cached prices already showing
    });
}

function applyPrices(data) {
  const coins = {
    bitcoin: { priceId: "price-btc", changeId: "change-btc" },
    ethereum: { priceId: "price-eth", changeId: "change-eth" },
    tether: { priceId: "price-usdt", changeId: "change-usdt" },
    binancecoin: { priceId: "price-bnb", changeId: "change-bnb" },
    solana: { priceId: "price-sol", changeId: "change-sol" },
    ripple: { priceId: "price-xrp", changeId: "change-xrp" },
  };

  Object.entries(coins).forEach(([id, els]) => {
    if (!data[id]) return;
    const price = data[id].usd;
    const change = data[id].usd_24h_change;
    const priceEl = document.getElementById(els.priceId);
    const changeEl = document.getElementById(els.changeId);
    if (priceEl)
      priceEl.textContent =
        price >= 1
          ? "$" + price.toLocaleString("en-US", { maximumFractionDigits: 2 })
          : "$" + price.toFixed(4);
    if (changeEl) {
      changeEl.textContent = (change >= 0 ? "+" : "") + change.toFixed(2) + "%";
      changeEl.className =
        "ticker-change " + (change >= 0 ? "positive" : "negative");
    }
  });
}

function updatePriceDisplay(coin, data) {
  if (!data) return;
  const priceEl = document.getElementById(`price-${coin}`);
  const changeEl = document.getElementById(`change-${coin}`);
  if (!priceEl || !changeEl) return;

  const price = data.usd;
  const change = data.usd_24h_change;

  priceEl.textContent =
    price >= 1
      ? `$${price.toLocaleString("en-US", { maximumFractionDigits: 2 })}`
      : `$${price.toFixed(4)}`;

  const changeFormatted =
    change >= 0 ? `+${change.toFixed(2)}%` : `${change.toFixed(2)}%`;
  changeEl.textContent = changeFormatted;
  changeEl.className = `ticker-change ${change >= 0 ? "up" : "down"}`;
}

fetchPrices();
setInterval(fetchPrices, 60000);

// ---- RECENT ACTIVITY ----
function loadRecentActivity() {
  const user = auth.currentUser;
  if (!user) return;

  db.collection("p2pOrders")
    .where("buyerUid", "==", user.uid)
    .orderBy("createdAt", "desc")
    .limit(5)
    .get()
    .then((snapshot) => {
      const container = document.getElementById("recent-activity");
      if (snapshot.empty) return;
      container.innerHTML = "";
      snapshot.forEach((doc) => {
        const o = doc.data();
        const div = document.createElement("div");
        div.className = "ticker-item";
        div.innerHTML = `
          <div class="ticker-coin">
            <span class="order-type ${o.type}">${o.type.toUpperCase()}</span>
            <div>
              <div class="coin-name">${o.crypto}</div>
              <div class="coin-fullname">${o.currency || ""}</div>
            </div>
          </div>
          <div style="text-align:right">
            <div class="ticker-price">${
              o.cryptoAmount || o.amount || "--"
            }</div>
            <span class="badge badge-${getStatusColor(o.status)}">${
          o.status
        }</span>
          </div>`;
        container.appendChild(div);
      });
    })
    .catch((err) => console.error(err));
}

function getStatusColor(status) {
  if (status === "completed") return "green";
  if (status === "cancelled" || status === "disputed") return "red";
  return "yellow";
}

setTimeout(loadRecentActivity, 1000);

function refreshHomeData() {
  const icon = document.getElementById("refresh-icon");
  if (icon) {
    icon.style.transition = "transform 0.5s";
    icon.style.transform = "rotate(360deg)";
    setTimeout(() => (icon.style.transform = "rotate(0deg)"), 500);
  }
  fetchPrices();
  loadRecentActivity();
  showToast("Refreshed!", "success");
}
