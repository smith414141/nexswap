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
  ADA: 0.45,
  DOGE: 0.12,
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
      updateAssetsCount(btc, usdt);

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

// ---- DASHBOARD STAT CARD: Assets count ----
// Counts real, non-zero holdings from the wallet doc. (Total Balance stat
// card is filled by the existing updateBalanceUSD() below — unchanged.)
function updateAssetsCount(btc, usdt) {
  const el = document.getElementById("assets-count");
  if (!el) return;
  const count = (btc > 0 ? 1 : 0) + (usdt > 0 ? 1 : 0);
  el.textContent = count;
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
    "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,tether,binancecoin,solana,ripple,cardano,dogecoin,avalanche-2,pepe,injective-protocol,fetch-ai,near,sui&vs_currencies=usd&include_24hr_change=true&include_24hr_vol=true"
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
      if (data.cardano) currentPrices.ADA = data.cardano.usd;
      if (data.dogecoin) currentPrices.DOGE = data.dogecoin.usd;

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

const COIN_META = {
  bitcoin: { symbol: "BTC", name: "Bitcoin", icon: "₿", cls: "btc" },
  ethereum: { symbol: "ETH", name: "Ethereum", icon: "Ξ", cls: "eth" },
  tether: { symbol: "USDT", name: "Tether", icon: "₮", cls: "usdt" },
  binancecoin: { symbol: "BNB", name: "BNB", icon: "B", cls: "bnb" },
  solana: { symbol: "SOL", name: "Solana", icon: "S", cls: "sol" },
  ripple: { symbol: "XRP", name: "Ripple", icon: "X", cls: "xrp" },
  cardano: { symbol: "ADA", name: "Cardano", icon: "A", cls: "ada" },
  dogecoin: { symbol: "DOGE", name: "Dogecoin", icon: "D", cls: "doge" },
  "avalanche-2": { symbol: "AVAX", name: "Avalanche", icon: "A", cls: "avax" },
  pepe: { symbol: "PEPE", name: "Pepe", icon: "🐸", cls: "pepe" },
  "injective-protocol": { symbol: "INJ", name: "Injective", icon: "I", cls: "inj" },
  "fetch-ai": { symbol: "FET", name: "Fetch.ai", icon: "F", cls: "fet" },
  near: { symbol: "NEAR", name: "NEAR Protocol", icon: "N", cls: "near" },
  sui: { symbol: "SUI", name: "Sui", icon: "S", cls: "sui" },
};

// Fixed coin list for the Market Overview table + Heatmap (matches the UI reference)
const MARKET_TABLE_COINS = [
  "bitcoin",
  "ethereum",
  "binancecoin",
  "solana",
  "ripple",
  "dogecoin",
  "cardano",
  "avalanche-2",
];

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

  renderTopMovers(data);
  renderTickerBar(data);
  renderMarketOverviewTable(data);
  renderMarketHeatmap(data);
}

// ---- MARKET OVERVIEW TABLE (real price/change/volume; chart is a CSS
// proportional bar, not a live sparkline — see note to project owner) ----
function renderMarketOverviewTable(data) {
  const body = document.getElementById("market-overview-body");
  if (!body) return;

  const rows = MARKET_TABLE_COINS.filter((id) => data[id]).map((id, i) => {
    const meta = COIN_META[id];
    const d = data[id];
    const change = d.usd_24h_change || 0;
    const price = d.usd;
    const vol = d.usd_24h_vol;
    const dir = change >= 0 ? "positive" : "negative";
    const priceStr =
      price >= 1
        ? "$" + price.toLocaleString("en-US", { maximumFractionDigits: 2 })
        : "$" + price.toFixed(4);
    const volStr =
      vol == null
        ? "--"
        : vol >= 1e9
        ? "$" + (vol / 1e9).toFixed(2) + "B"
        : "$" + (vol / 1e6).toFixed(1) + "M";
    // Bar length reflects magnitude of 24h move, capped so it stays readable
    const barPct = Math.max(6, Math.min(100, Math.abs(change) * 8));

    return `
      <tr onclick="window.location.href='trade.html?symbol=${meta.symbol}'">
        <td class="mkt-col-rank">${i + 1}</td>
        <td>
          <div class="mkt-row-asset">
            <div class="coin-icon ${meta.cls}">${meta.icon}</div>
            <div class="flex-col">
              <div class="coin-name">${meta.symbol}</div>
              <div class="coin-fullname">${meta.name}</div>
            </div>
          </div>
        </td>
        <td class="mkt-col-num text-mono">${priceStr}</td>
        <td class="mkt-col-num">
          <span class="mkt-change-pill ${dir}">${
      change >= 0 ? "↗ +" : "↘ "
    }${change.toFixed(2)}%</span>
        </td>
        <td class="mkt-col-num mkt-col-vol text-mono">${volStr}</td>
        <td class="mkt-col-chart">
          <div class="mkt-chart-bar"><div class="mkt-chart-bar-fill ${dir}" style="width:${barPct}%"></div></div>
        </td>
        <td class="mkt-col-trade">
          <button class="mkt-trade-btn" onclick="event.stopPropagation(); window.location.href='trade.html?symbol=${
            meta.symbol
          }'">Trade</button>
        </td>
      </tr>`;
  });

  if (rows.length === 0) return;
  body.innerHTML = rows.join("");
}

// ---- MARKET HEATMAP ----
function renderMarketHeatmap(data) {
  const container = document.getElementById("market-heatmap");
  if (!container) return;

  const tiles = MARKET_TABLE_COINS.filter((id) => data[id]).map((id) => {
    const meta = COIN_META[id];
    const change = data[id].usd_24h_change || 0;
    const dir = change >= 0 ? "positive" : "negative";
    return `
      <div class="heatmap-tile ${dir}" onclick="window.location.href='trade.html?symbol=${
      meta.symbol
    }'">
        <span class="sym">${meta.symbol}</span>
        <span class="chg">${change >= 0 ? "+" : ""}${change.toFixed(1)}%</span>
      </div>`;
  });

  if (tiles.length === 0) return;
  container.innerHTML = tiles.join("");
}

// ---- LIVE PRICE TICKER (top of page, scrolls continuously) ----
function renderTickerBar(data) {
  const track = document.getElementById("pc-ticker-track");
  if (!track) return;

  const rows = Object.entries(COIN_META)
    .filter(([id]) => data[id])
    .map(([id, meta]) => ({
      ...meta,
      price: data[id].usd,
      change: data[id].usd_24h_change || 0,
    }));

  if (rows.length === 0) return;

  const itemHtml = (r) => `
    <span class="pc-ticker-item" onclick="window.location.href='trade.html?symbol=${
      r.symbol
    }'">
      <span class="sym">${r.symbol}/USDT</span>
      <span class="text-mono">${
        r.price >= 1
          ? "$" + r.price.toLocaleString("en-US", { maximumFractionDigits: 2 })
          : "$" + r.price.toFixed(4)
      }</span>
      <span class="chg ${r.change >= 0 ? "positive" : "negative"}">${
    r.change >= 0 ? "↗" : "↘"
  } ${(r.change >= 0 ? "+" : "") + r.change.toFixed(2)}%</span>
    </span>`;

  // Render the row twice back-to-back so the -50% translateX loop is seamless.
  const rowHtml = rows.map(itemHtml).join("");
  track.innerHTML = rowHtml + rowHtml;
}

// ---- TOP MOVERS ----
function renderTopMovers(data) {
  const container = document.getElementById("top-movers");
  if (!container) return;

  const rows = Object.entries(COIN_META)
    .filter(([id]) => data[id] && typeof data[id].usd_24h_change === "number")
    .map(([id, meta]) => ({
      ...meta,
      change: data[id].usd_24h_change,
      price: data[id].usd,
    }))
    .sort((a, b) => Math.abs(b.change) - Math.abs(a.change))
    .slice(0, 5);

  if (rows.length === 0) return;

  container.innerHTML = rows
    .map(
      (r, i) => `
    <div class="mover-item" onclick="window.location.href='trade.html?symbol=${
      r.symbol
    }'">
      <div class="flex-between" style="gap: 10px">
        <span class="mover-rank">${i + 1}</span>
        <div class="coin-icon ${
          r.cls
        }" style="width:28px;height:28px;font-size:13px;">${r.icon}</div>
        <div class="flex-col">
          <div class="coin-name">${r.symbol}</div>
          <div class="coin-fullname">${r.name}</div>
        </div>
      </div>
      <div class="flex-col" style="align-items: flex-end">
        <div class="ticker-price text-mono">${
          r.price >= 1
            ? "$" +
              r.price.toLocaleString("en-US", { maximumFractionDigits: 2 })
            : "$" + r.price.toFixed(4)
        }</div>
        <div class="ticker-change text-mono ${
          r.change >= 0 ? "positive" : "negative"
        }">${(r.change >= 0 ? "+" : "") + r.change.toFixed(2)}%</div>
      </div>
    </div>`
    )
    .join("");
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

// ---- PROFILE MENU (top-right, PC nav) ----
function toggleProfileMenu() {
  const el = document.getElementById("profile-menu-wrap");
  el.classList.toggle("open");
}

document.addEventListener("click", (e) => {
  if (!e.target.closest("#profile-menu-wrap")) {
    const wrap = document.getElementById("profile-menu-wrap");
    if (wrap) wrap.classList.remove("open");
  }
});

// ---- DASHBOARD BANNER CAROUSEL ----
let bannerIndex = 0;
let bannerTimer = null;

function initDashBanner() {
  const banner = document.getElementById("dash-banner");
  if (!banner) return;
  const slides = banner.querySelectorAll(".dash-banner-slide");
  const dotsWrap = document.getElementById("dash-banner-dots");

  slides.forEach((_, i) => {
    const dot = document.createElement("div");
    dot.className = "dash-banner-dot" + (i === 0 ? " active" : "");
    dot.onclick = (e) => {
      e.stopPropagation();
      goToBannerSlide(i);
    };
    dotsWrap.appendChild(dot);
  });

  bannerTimer = setInterval(() => {
    goToBannerSlide((bannerIndex + 1) % slides.length);
  }, 5000);
}

function goToBannerSlide(i) {
  const banner = document.getElementById("dash-banner");
  const slides = banner.querySelectorAll(".dash-banner-slide");
  const dots = document.querySelectorAll(".dash-banner-dot");
  slides.forEach((s, idx) => s.classList.toggle("active", idx === i));
  dots.forEach((d, idx) => d.classList.toggle("active", idx === i));
  bannerIndex = i;
}

function dashBannerClick() {
  const banner = document.getElementById("dash-banner");
  const active = banner.querySelector(".dash-banner-slide.active");
  if (active && active.dataset.target) {
    window.location.href = active.dataset.target;
  }
}

initDashBanner();

// ---- NEWS (opens original article in a new tab, never redirects away) ----
function loadNews() {
  const container = document.getElementById("news-list");
  if (!container) return;

  fetch("https://min-api.cryptocompare.com/data/v2/news/?lang=EN")
    .then((res) => res.json())
    .then((data) => {
      const items = (data.Data || []).slice(0, 6);
      if (items.length === 0) {
        container.innerHTML =
          '<p class="text-muted" style="text-align:center; font-size:13px; padding:20px 0;">No news available</p>';
        return;
      }
      container.innerHTML = items
        .map(
          (n) => `
        <a class="news-item" href="${
          n.url
        }" target="_blank" rel="noopener noreferrer">
          <div class="news-title">${n.title}</div>
          <div class="news-meta">${
            n.source_info?.name || n.source || "News"
          } · ${new Date(n.published_on * 1000).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          })}</div>
        </a>`
        )
        .join("");
    })
    .catch(() => {
      container.innerHTML =
        '<p class="text-muted" style="text-align:center; font-size:13px; padding:20px 0;">Unable to load news right now</p>';
    });
}

loadNews();

function refreshHomeData() {
  const icon = document.getElementById("refresh-icon");
  if (icon) {
    icon.style.transition = "transform 0.5s";
    icon.style.transform = "rotate(360deg)";
    setTimeout(() => (icon.style.transform = "rotate(0deg)"), 500);
  }
  fetchPrices();
  loadRecentActivity();
  loadNews();
  showToast("Refreshed!", "success");
}
