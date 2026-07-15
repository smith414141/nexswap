// portfolio.js
// Reads wallets Firestore doc, fetches live CoinGecko prices,
// calculates PNL using cost basis from Firestore, tracks best performer,
// generates fake historical data for performance line chart.

let portfolioWallet = {};
let portfolioPrices = {};
let portfolioCostBasis = {};
let portfolioLineChart = null;
let portfolioDonutChart = null;
let currentChartRange = "1D";

// Time range in hours for each filter
const CHART_RANGES = {
  "1H": 1,
  "4H": 4,
  "1D": 24,
  "1W": 168,
  "1M": 720,
};

auth.onAuthStateChanged((user) => {
  if (!user || !user.emailVerified) return;
  loadPortfolio(user.uid);
});

function loadPortfolio(uid) {
  db.collection("wallets")
    .doc(uid)
    .onSnapshot((doc) => {
      if (!doc.exists) return;
      portfolioWallet = doc.data();

      // Load cost basis from Firestore (stored in wallets doc under costBasis field)
      db.collection("wallets")
        .doc(uid)
        .get()
        .then((d) => {
          if (d.exists && d.data().costBasis) {
            portfolioCostBasis = d.data().costBasis;
          }
          fetchPortfolioPrices();
        });
    });
}

function fetchPortfolioPrices() {
  const idMap = {
    BTC: "bitcoin", ETH: "ethereum", USDT: "tether", USDC: "usd-coin",
    BNB: "binancecoin", SOL: "solana", XRP: "ripple", ADA: "cardano",
    DOGE: "dogecoin", TRX: "tron", TON: "the-open-network", AVAX: "avalanche-2",
    DOT: "polkadot", MATIC: "matic-network", LINK: "chainlink", LTC: "litecoin",
    SHIB: "shiba-inu", BCH: "bitcoin-cash", UNI: "uniswap", XLM: "stellar",
    ATOM: "cosmos", ETC: "ethereum-classic", FIL: "filecoin", APT: "aptos",
    NEAR: "near", ICP: "internet-computer", HBAR: "hedera-hashgraph",
    AAVE: "aave", XTZ: "tezos", THETA: "theta-token",
  };

  const heldSymbols = Object.keys(portfolioWallet).filter(
    (s) => portfolioWallet[s] > 0 && idMap[s]
  );

  if (!heldSymbols.length) {
    renderEmptyPortfolio();
    return;
  }

  const ids = heldSymbols.map((s) => idMap[s]).join(",");
  fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd`)
    .then((r) => r.json())
    .then((data) => {
      const reverseMap = Object.fromEntries(Object.entries(idMap).map(([sym, id]) => [id, sym]));
      portfolioPrices = {};
      Object.entries(data).forEach(([id, val]) => {
        const sym = reverseMap[id];
        if (sym) portfolioPrices[sym] = val.usd;
      });
      portfolioPrices.USDT = portfolioPrices.USDT || 1;
      portfolioPrices.USDC = portfolioPrices.USDC || 1;
      renderPortfolio();
    })
    .catch(() => {
      portfolioPrices = { USDT: 1, USDC: 1 };
      renderPortfolio();
    });
}

function renderEmptyPortfolio() {
  document.getElementById("stat-portfolio-value").textContent = "$0.00";
  document.getElementById("stat-cost-basis").textContent = "Cost Basis: $0.00";
  document.getElementById("stat-total-pnl").textContent = "$0.00";
  document.getElementById("stat-total-pnl-pct").textContent = "0.00%";
  document.getElementById("stat-best-performer").textContent = "—";
  document.getElementById("stat-best-performer-pct").textContent = "—";
  document.getElementById("stat-assets-count").textContent = "0";
  document.getElementById("portfolio-holdings-body").innerHTML = "";
  document.getElementById("portfolio-empty").style.display = "block";
  document.getElementById("portfolio-legend").innerHTML = "";
  destroyCharts();
}

function destroyCharts() {
  if (portfolioLineChart) { portfolioLineChart.destroy(); portfolioLineChart = null; }
  if (portfolioDonutChart) { portfolioDonutChart.destroy(); portfolioDonutChart = null; }
}

function renderPortfolio() {
  const holdings = [];
  let totalValue = 0;
  let totalCost = 0;

  Object.entries(portfolioWallet).forEach(([sym, amount]) => {
    if (sym === "updatedAt" || !amount || amount <= 0) return;
    const price = portfolioPrices[sym] || 0;
    const usdValue = amount * price;
    if (usdValue < 0.001) return;
    totalValue += usdValue;

    const costPerUnit = portfolioCostBasis[sym] || price;
    const costTotal = amount * costPerUnit;
    totalCost += costTotal;

    const coinMeta = (typeof CRYPTO_LIST !== "undefined"
      ? CRYPTO_LIST.find((c) => c.symbol === sym)
      : null) || { symbol: sym, name: sym, icon: sym[0], color: "#F0B90B" };

    holdings.push({ sym, amount, price, usdValue, costPerUnit, costTotal, meta: coinMeta });
  });

  holdings.sort((a, b) => b.usdValue - a.usdValue);

  // Calculate PNL
  const totalPnl = totalValue - totalCost;
  const totalPnlPct = totalCost > 0 ? (totalPnl / totalCost) * 100 : 0;

  // Find best performer
  let best = null;
  let bestPct = -Infinity;
  holdings.forEach((h) => {
    if (h.costTotal > 0) {
      const pct = ((h.usdValue - h.costTotal) / h.costTotal) * 100;
      if (pct > bestPct) { bestPct = pct; best = h; }
    }
  });

  // Update stat cards
  document.getElementById("stat-portfolio-value").textContent = "$" + totalValue.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2});
  document.getElementById("stat-cost-basis").textContent = "Cost Basis: $" + totalCost.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2});
  document.getElementById("stat-total-pnl").textContent = (totalPnl >= 0 ? "+" : "") + "$" + Math.abs(totalPnl).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2});
  document.getElementById("stat-total-pnl").className = "portfolio-stat-value " + (totalPnl >= 0 ? "positive" : "negative");
  document.getElementById("stat-total-pnl-pct").textContent = (totalPnlPct >= 0 ? "+" : "") + totalPnlPct.toFixed(2) + "%";
  document.getElementById("stat-total-pnl-pct").className = "portfolio-stat-sub " + (totalPnlPct >= 0 ? "positive" : "negative");
  document.getElementById("stat-best-performer").textContent = best ? best.sym : "—";
  document.getElementById("stat-best-performer-pct").textContent = best ? (bestPct >= 0 ? "+" : "") + bestPct.toFixed(2) + "%" : "—";
  document.getElementById("stat-best-performer-pct").className = "portfolio-stat-sub " + (best && bestPct >= 0 ? "positive" : "negative");
  document.getElementById("stat-assets-count").textContent = holdings.length;

  // Render components
  renderDonutChart(holdings, totalValue);
  renderLineChart(holdings, totalValue);
  renderHoldingsTable(holdings, totalValue, totalCost);
  renderLegend(holdings, totalValue);
  document.getElementById("portfolio-empty").style.display = holdings.length ? "none" : "block";

  // Setup chart tab listeners
  document.querySelectorAll(".portfolio-chart-tab").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".portfolio-chart-tab").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      currentChartRange = btn.dataset.range;
      renderLineChart(holdings, totalValue);
    });
  });
}

function renderDonutChart(holdings, total) {
  const wrap = document.getElementById("portfolio-donut-chart");
  if (!holdings.length) {
    wrap.parentElement.innerHTML = '<div class="empty-state">No holdings to chart.</div>';
    return;
  }
  wrap.parentElement.innerHTML = '<canvas id="portfolio-donut-chart"></canvas>';
  const ctx = document.getElementById("portfolio-donut-chart").getContext("2d");
  if (portfolioDonutChart) portfolioDonutChart.destroy();

  portfolioDonutChart = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: holdings.map((h) => h.sym),
      datasets: [{
        data: holdings.map((h) => h.usdValue.toFixed(2)),
        backgroundColor: holdings.map((h) => h.meta.color + "CC"),
        borderColor: "#0B0E11",
        borderWidth: 2,
      }],
    },
    options: {
      cutout: "70%",
      plugins: { legend: { display: false }, tooltip: { callbacks: { label: (ctx) => ` $${parseFloat(ctx.parsed).toFixed(2)}` } } },
    },
  });
}

function generateFakeHistory(holdings, totalValue, hours) {
  // Generate realistic-looking historical data
  const points = [];
  const labels = [];
  const intervalMs = hours <= 24 ? 3600000 : hours <= 168 ? 3600000 * 6 : 3600000 * 24;
  const steps = Math.min(Math.max(Math.floor(hours / (intervalMs / 3600000)), 12), 48);

  let value = totalValue;
  const now = Date.now();

  for (let i = steps; i >= 0; i--) {
    const t = now - i * intervalMs;
    labels.push(formatTimeLabel(t, hours));
    const drift = (Math.random() - 0.5) * 0.04;
    value = value * (1 + drift);
    value = Math.max(totalValue * 0.85, Math.min(totalValue * 1.15, value));
    points.push(value);
  }

  return { labels, points };
}

function formatTimeLabel(ts, hours) {
  const d = new Date(ts);
  if (hours <= 4) return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  if (hours <= 24) return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  if (hours <= 168) return d.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" });
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

function renderLineChart(holdings, totalValue) {
  const wrap = document.getElementById("portfolio-line-chart");
  if (!holdings.length) {
    wrap.parentElement.innerHTML = '<div class="empty-state">No holdings to chart.</div>';
    return;
  }
  wrap.parentElement.innerHTML = '<canvas id="portfolio-line-chart"></canvas>';
  const ctx = document.getElementById("portfolio-line-chart").getContext("2d");
  if (portfolioLineChart) portfolioLineChart.destroy();

  const hours = CHART_RANGES[currentChartRange] || 24;
  const { labels, points } = generateFakeHistory(holdings, totalValue, hours);

  portfolioLineChart = new Chart(ctx, {
    type: "line",
    data: {
      labels,
      datasets: [{
        label: "Portfolio Value",
        data: points,
        borderColor: "#3B82F6",
        backgroundColor: "rgba(59, 130, 246, 0.1)",
        fill: true,
        tension: 0.3,
        pointRadius: 0,
        pointHoverRadius: 4,
        borderWidth: 2,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false }, tooltip: { mode: "index", intersect: false, callbacks: { label: (ctx) => `$${ctx.parsed.y.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}` } } },
      scales: {
        x: { grid: { display: false }, ticks: { color: "var(--text3)", font: { size: 11 } } },
        y: { grid: { color: "var(--border)" }, ticks: { color: "var(--text3)", font: { size: 11 }, callback: (v) => "$" + v.toLocaleString() } },
      },
      interaction: { intersect: false, mode: "index" },
    },
  });
}

function renderHoldingsTable(holdings, totalValue, totalCost) {
  const tbody = document.getElementById("portfolio-holdings-body");
  if (!holdings.length) {
    tbody.innerHTML = "";
    return;
  }
  tbody.innerHTML = holdings.map((h) => {
    const pnl = h.usdValue - h.costTotal;
    const pnlPct = h.costTotal > 0 ? (pnl / h.costTotal) * 100 : 0;
    const isPositive = pnl >= 0;
    const decimals = h.sym === "BTC" ? 8 : h.usdValue < 1 ? 6 : 4;
    return `
      <tr>
        <td>
          <div class="portfolio-table-asset">
            <div class="portfolio-table-avatar" style="background:${h.meta.color}22;color:${h.meta.color};border:1px solid ${h.meta.color}44;">${h.meta.icon}</div>
            <div>
              <div class="portfolio-table-sym">${h.sym}</div>
              <div class="portfolio-table-name">${h.meta.name}</div>
            </div>
          </div>
        </td>
        <td class="text-mono">${h.amount.toFixed(decimals)}</td>
        <td class="text-mono">${h.costPerUnit > 0 ? "$" + h.costPerUnit.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 4}) : "—"}</td>
        <td class="text-mono">$${h.usdValue.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
        <td class="text-mono ${isPositive ? "positive" : "negative"}">$${pnl.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
        <td class="text-mono ${isPositive ? "positive" : "negative"}">${pnlPct >= 0 ? "+" : ""}${pnlPct.toFixed(2)}%</td>
      </tr>`;
  }).join("");
}

function renderLegend(holdings, total) {
  const legend = document.getElementById("portfolio-legend");
  if (!holdings.length) { legend.innerHTML = ""; return; }
  legend.innerHTML = holdings.map((h) => {
    const pct = ((h.usdValue / total) * 100).toFixed(1);
    return `
      <div class="portfolio-legend-item">
        <span class="portfolio-legend-color" style="background:${h.meta.color}"></span>
        <span class="portfolio-legend-sym">${h.sym}</span>
        <span class="portfolio-legend-name">${h.meta.name}</span>
        <span class="portfolio-legend-pct">${pct}%</span>
      </div>`;
  }).join("");
}

function exportPortfolioCSV() {
  const user = auth.currentUser;
  if (!user) return;

  db.collection("transactions")
    .where("userId", "==", user.uid)
    .orderBy("createdAt", "desc")
    .get()
    .then((snap) => {
      if (snap.empty) {
        showToast("No transactions to export", "warning");
        return;
      }

      const rows = [["Date", "Type", "Crypto", "Amount", "Status"]];
      snap.forEach((doc) => {
        const d = doc.data();
        const date = d.createdAt?.toDate?.()?.toLocaleDateString() || "--";
        rows.push([date, d.type || "--", d.crypto || "--", d.amount || "--", d.status || "--"]);
      });

      const csv = rows.map((r) => r.join(",")).join("\n");
      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `kripex-transactions-${Date.now()}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      showToast("CSV downloaded!", "success");
    })
    .catch((err) => showToast(err.message, "error"));
}