// futures.js
const FUT_ASSETS = {
  BTC: { name: "BTCUSDT Perpetual", price: 67432.5, change: 2.34, icon: "B", color: "#f7931a" },
  ETH: { name: "ETHUSDT Perpetual", price: 3521.8, change: -1.12, icon: "Ξ", color: "#627eea" },
  BNB: { name: "BNBUSDT Perpetual", price: 598.4, change: 0.87, icon: "◆", color: "#f0b90b" },
  SOL: { name: "SOLUSDT Perpetual", price: 172.35, change: 5.67, icon: "◎", color: "#14f195" },
  XRP: { name: "XRPUSDT Perpetual", price: 0.5234, change: -0.45, icon: "X", color: "#25a768" },
  ADA: { name: "ADAUSDT Perpetual", price: 0.4521, change: 3.21, icon: "A", color: "#0033ad" },
};
const LEVERAGES = [1, 2, 5, 10, 25, 50, 75, 100, 125];

let futSide = "long";
let futPair = "BTC";
let futLeverage = 10;
let futPositions = [];

document.addEventListener("DOMContentLoaded", () => {
  gateFeatureByRegion({
    allowed: ["global", "eu"],
    featureName: "Futures Trading",
    contentId: "feature-content",
    gateId: "region-gate",
  });
  renderPairPills();
  renderLeverageButtons();
  updateFutPairUI();
  loadFutMarginBalance();
  drawFutChart();
  initFutTicker();
});

function currentAsset() {
  return FUT_ASSETS[futPair];
}

// ---- PAIR SELECTION ----
function renderPairPills() {
  const wrap = document.getElementById("fut-pair-pills");
  if (!wrap) return;
  wrap.innerHTML = Object.keys(FUT_ASSETS)
    .map(
      (sym) =>
        `<button class="crypto-pill${sym === futPair ? " active" : ""}" id="fut-pill-${sym}" onclick="setFutPair('${sym}')">${sym}</button>`
    )
    .join("");
}

function setFutPair(sym) {
  futPair = sym;
  document.querySelectorAll("[id^='fut-pill-']").forEach((b) => b.classList.remove("active"));
  const el = document.getElementById("fut-pill-" + sym);
  if (el) el.classList.add("active");
  updateFutPairUI();
  drawFutChart();
  updateFutEstimate();
}

function updateFutPairUI() {
  const a = currentAsset();
  document.getElementById("fut-pair-name").textContent = a.name;
  document.getElementById("fut-price-val").textContent = formatFutPrice(a.price);
  document.getElementById("fut-mark-price").textContent = formatFutPrice(a.price);
  document.getElementById("fut-index-price").textContent = formatFutPrice(a.price * 0.9998);
  const changeEl = document.getElementById("fut-change");
  changeEl.textContent = (a.change >= 0 ? "+" : "") + a.change.toFixed(2) + "%";
  changeEl.style.color = a.change >= 0 ? "var(--green)" : "var(--red)";
  const icon = document.getElementById("fut-coin-icon");
  icon.textContent = a.icon;
  icon.style.cssText = `width:34px;height:34px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:800;background:${a.color}22;color:${a.color};border:1px solid ${a.color}44`;
  document.getElementById("fut-size-coin").textContent = futPair;
}

function formatFutPrice(p) {
  return p >= 1 ? "$" + p.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "$" + p.toFixed(4);
}

// ---- LEVERAGE ----
function renderLeverageButtons() {
  const wrap = document.getElementById("fut-leverage-buttons");
  if (!wrap) return;
  wrap.innerHTML = LEVERAGES.map(
    (lv) => `<button class="btn-secondary" id="fut-lev-${lv}" style="flex:1;min-width:44px;font-size:11px;padding:6px${lv === futLeverage ? ";background:var(--accent,#3b82f6);color:#fff" : ""}" onclick="setFutLeverage(${lv})">${lv}x</button>`
  ).join("");
}

function setFutLeverage(lv) {
  futLeverage = lv;
  document.getElementById("fut-leverage-val").textContent = lv + "x";
  renderLeverageButtons();
  updateFutEstimate();
}

// ---- SIDE ----
function setFutSide(side, btn) {
  futSide = side;
  document.querySelectorAll("#fut-tab-long, #fut-tab-short, #fut-side-long-btn, #fut-side-short-btn").forEach((b) => {
    b.classList.remove("active");
    b.style.background = "";
    b.style.borderColor = "";
    b.style.color = "";
  });
  const longBtns = [document.getElementById("fut-tab-long"), document.getElementById("fut-side-long-btn")];
  const shortBtns = [document.getElementById("fut-tab-short"), document.getElementById("fut-side-short-btn")];
  if (side === "long") {
    longBtns.forEach((b) => {
      b.classList.add("active");
      b.style.background = "var(--green)";
      b.style.borderColor = "var(--green)";
      b.style.color = "#fff";
    });
  } else {
    shortBtns.forEach((b) => {
      b.classList.add("active");
      b.style.background = "var(--red)";
      b.style.borderColor = "var(--red)";
      b.style.color = "#fff";
    });
  }
  const submitBtn = document.getElementById("fut-submit-btn");
  submitBtn.textContent = (side === "long" ? "Buy/Long " : "Sell/Short ") + futPair;
  submitBtn.style.background = side === "long" ? "var(--green)" : "var(--red)";
  updateFutEstimate();
}

// ---- MARGIN INPUT ----
function setFutMarginPct(pct) {
  const user = auth.currentUser;
  if (!user) return;
  db.collection("wallets")
    .doc(user.uid)
    .get()
    .then((doc) => {
      const usdt = (doc.data() && doc.data().USDT) || 0;
      document.getElementById("fut-margin").value = (usdt * pct).toFixed(2);
      updateFutEstimate();
    });
}

function updateFutEstimate() {
  const margin = parseFloat(document.getElementById("fut-margin").value) || 0;
  const size = margin * futLeverage;
  const a = currentAsset();
  document.getElementById("fut-position-size").textContent = "$" + size.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  document.getElementById("fut-size-coin-val").textContent = a.price > 0 ? (size / a.price).toFixed(6) : "0.000000";

  const liqPrice =
    futSide === "long" ? a.price * (1 - 1 / futLeverage + 0.005) : a.price * (1 + 1 / futLeverage - 0.005);
  document.getElementById("fut-liq-price").textContent = futLeverage > 1 ? formatFutPrice(Math.max(liqPrice, 0)) : "--";
}

function loadFutMarginBalance() {
  const user = auth.currentUser;
  if (!user) {
    auth.onAuthStateChanged((u) => u && loadFutMarginBalance());
    return;
  }
  db.collection("wallets")
    .doc(user.uid)
    .get()
    .then((doc) => {
      const usdt = (doc.data() && doc.data().USDT) || 0;
      document.getElementById("fut-margin-balance").textContent = "$" + usdt.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    });
}

// ---- CHART (lightweight mock area chart) ----
function drawFutChart() {
  const svg = document.getElementById("fut-chart-svg");
  if (!svg) return;
  const a = currentAsset();
  const w = 600,
    h = 220,
    points = 40;
  let seed = futPair.charCodeAt(0) + futPair.charCodeAt(futPair.length - 1);
  const rand = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };
  let y = h / 2;
  const coords = [];
  for (let i = 0; i < points; i++) {
    y += (rand() - 0.5) * 14;
    y = Math.max(20, Math.min(h - 20, y));
    coords.push([(i / (points - 1)) * w, y]);
  }
  const lineColor = a.change >= 0 ? "#0a9e63" : "#d9354a";
  const linePath = coords.map((p, i) => (i === 0 ? `M${p[0]},${p[1]}` : `L${p[0]},${p[1]}`)).join(" ");
  const areaPath = `${linePath} L${w},${h} L0,${h} Z`;
  svg.innerHTML = `
    <defs>
      <linearGradient id="fut-grad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="${lineColor}" stop-opacity="0.35" />
        <stop offset="100%" stop-color="${lineColor}" stop-opacity="0" />
      </linearGradient>
    </defs>
    <path d="${areaPath}" fill="url(#fut-grad)" />
    <path d="${linePath}" fill="none" stroke="${lineColor}" stroke-width="2" />
  `;
}

// ---- TICKER BAR (reuses same markup/classes as home.html) ----
function initFutTicker() {
  fetch(
    "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,binancecoin,solana,ripple,cardano&vs_currencies=usd&include_24hr_change=true"
  )
    .then((r) => r.json())
    .then((data) => {
      const map = { bitcoin: "BTC", ethereum: "ETH", binancecoin: "BNB", solana: "SOL", ripple: "XRP", cardano: "ADA" };
      const track = document.getElementById("pc-ticker-track");
      if (!track) return;
      const rows = Object.entries(map)
        .filter(([id]) => data[id])
        .map(([id, sym]) => ({ sym, price: data[id].usd, change: data[id].usd_24h_change || 0 }));
      if (!rows.length) return;
      const itemHtml = (r) => `
        <span class="pc-ticker-item" onclick="setFutPair('${r.sym}')">
          <span class="sym">${r.sym}/USDT</span>
          <span class="text-mono">${r.price >= 1 ? "$" + r.price.toLocaleString("en-US", { maximumFractionDigits: 2 }) : "$" + r.price.toFixed(4)}</span>
          <span class="chg ${r.change >= 0 ? "positive" : "negative"}">${r.change >= 0 ? "↗" : "↘"} ${(r.change >= 0 ? "+" : "") + r.change.toFixed(2)}%</span>
        </span>`;
      const rowHtml = rows.map(itemHtml).join("");
      track.innerHTML = rowHtml + rowHtml;
    })
    .catch(() => {});
}

// ---- OPEN POSITION ----
function openFutPosition() {
  const user = auth.currentUser;
  if (!user) return;
  const margin = parseFloat(document.getElementById("fut-margin").value) || 0;

  if (margin <= 0) {
    showToast("Enter a margin amount", "error");
    return;
  }

  db.collection("wallets")
    .doc(user.uid)
    .get()
    .then((doc) => {
      const usdt = (doc.data() && doc.data().USDT) || 0;
      if (margin > usdt) {
        showToast("Insufficient USDT balance", "error");
        return;
      }
      return db.collection("wallets").doc(user.uid).update({
        USDT: firebase.firestore.FieldValue.increment(-margin),
      });
    })
    .then(() => {
      if (typeof logTransaction === "function") {
        logTransaction(user.uid, `futures_${futSide}`, futPair, margin, "USDT", `${futLeverage}x leverage`);
      }
      addFutPosition(margin);
      showToast(`${futSide === "long" ? "Long" : "Short"} position opened`, "success");
      document.getElementById("fut-margin").value = "";
      updateFutEstimate();
      loadFutMarginBalance();
    })
    .catch((err) => showToast(err.message, "error"));
}

function addFutPosition(margin) {
  const a = currentAsset();
  const size = margin * futLeverage;
  const sizeCoin = a.price > 0 ? size / a.price : 0;
  const liqPrice = futSide === "long" ? a.price * (1 - 1 / futLeverage + 0.005) : a.price * (1 + 1 / futLeverage - 0.005);

  futPositions.unshift({
    id: Date.now(),
    pair: futPair,
    side: futSide,
    sizeCoin,
    entry: a.price,
    margin,
    leverage: futLeverage,
    liqPrice,
  });
  renderFutPositions();
}

function closeFutPosition(id) {
  futPositions = futPositions.filter((p) => p.id !== id);
  renderFutPositions();
}

function renderFutPositions() {
  const body = document.getElementById("fut-positions-body");
  if (!body) return;
  if (!futPositions.length) {
    body.innerHTML = `<tr id="fut-positions-empty"><td colspan="9" style="text-align:center;color:var(--text3);padding:20px">No open positions</td></tr>`;
    return;
  }
  body.innerHTML = futPositions
    .map((p) => {
      const a = FUT_ASSETS[p.pair];
      const mark = a.price;
      const pnl = p.side === "long" ? (mark - p.entry) * p.sizeCoin : (p.entry - mark) * p.sizeCoin;
      const roe = p.margin > 0 ? (pnl / p.margin) * 100 : 0;
      const pnlColor = pnl >= 0 ? "var(--green)" : "var(--red)";
      return `
      <tr style="border-top:1px solid var(--border)">
        <td style="padding:10px;font-weight:700">${p.pair}/USDT</td>
        <td style="color:${p.side === "long" ? "var(--green)" : "var(--red)"};font-weight:700">${p.side.toUpperCase()} ${p.leverage}x</td>
        <td>${p.sizeCoin.toFixed(4)}</td>
        <td>${formatFutPrice(p.entry)}</td>
        <td>${formatFutPrice(mark)}</td>
        <td style="color:var(--red)">${formatFutPrice(p.liqPrice)}</td>
        <td>$${p.margin.toFixed(2)}</td>
        <td style="color:${pnlColor}">${pnl >= 0 ? "+" : ""}$${pnl.toFixed(2)} (${roe >= 0 ? "+" : ""}${roe.toFixed(1)}%)</td>
        <td><button class="btn-secondary" style="padding:6px 12px;font-size:11px" onclick="closeFutPosition(${p.id})">Close</button></td>
      </tr>`;
    })
    .join("");
}
