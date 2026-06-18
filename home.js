// ---- LOAD USER DATA ----
auth.onAuthStateChanged((user) => {
  if (!user || !user.emailVerified) return;
  loadKycStatus(user.uid);
  loadWallet(user.uid);
});

function loadKycStatus(uid) {
  // onSnapshot = real-time, so badge updates immediately if KYC approved
  db.collection("users")
    .doc(uid)
    .onSnapshot((doc) => {
      if (!doc.exists) return;
      const data = doc.data();
      // Update both mobile and PC badges
      ["kyc-badge", "kyc-badge-pc"].forEach((id) => {
        const badge = document.getElementById(id);
        if (!badge) return;
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

      updateBalanceUSD(btc, usdt);
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
  fetch(
    "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,tether,binancecoin,solana,ripple&vs_currencies=usd&include_24hr_change=true"
  )
    .then((res) => res.json())
    .then((data) => {
      updatePriceDisplay("btc", data.bitcoin);
      updatePriceDisplay("eth", data.ethereum);
      updatePriceDisplay("usdt", data.tether);
      updatePriceDisplay("bnb", data.binancecoin);
      updatePriceDisplay("sol", data.solana);
      updatePriceDisplay("xrp", data.ripple);

      currentPrices.BTC = data.bitcoin.usd;
      currentPrices.ETH = data.ethereum.usd;
      currentPrices.USDT = data.tether.usd;
      currentPrices.BNB = data.binancecoin.usd;
      currentPrices.SOL = data.solana.usd;
      currentPrices.XRP = data.ripple.usd;

      if (typeof CRYPTO_PRICES !== "undefined") {
        CRYPTO_PRICES.BTC = data.bitcoin.usd;
        CRYPTO_PRICES.USDT = data.tether.usd;
      }

      const btc = parseFloat(
        document.getElementById("btc-balance").textContent
      );
      const usdt = parseFloat(
        document.getElementById("usdt-balance").textContent
      );
      if (!isNaN(btc) && !isNaN(usdt)) updateBalanceUSD(btc, usdt);
    })
    .catch((err) => console.error("Price fetch error:", err));
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
