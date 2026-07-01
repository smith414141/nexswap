// portfolio.js
// Reads wallets Firestore doc, fetches live CoinGecko prices,
// renders pie chart + holdings table + PNL.
// Depends on: wallet.js (CRYPTO_LIST), firebase.js, app.js

let portfolioWallet = {};
let portfolioPrices = {};
let portfolioChart = null;

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
      fetchPortfolioPrices();
    });
}

function fetchPortfolioPrices() {
  // Map CRYPTO_LIST symbols to CoinGecko IDs
  const idMap = {
    BTC: "bitcoin",
    ETH: "ethereum",
    USDT: "tether",
    USDC: "usd-coin",
    BNB: "binancecoin",
    SOL: "solana",
    XRP: "ripple",
    ADA: "cardano",
    DOGE: "dogecoin",
    TRX: "tron",
    TON: "the-open-network",
    AVAX: "avalanche-2",
    DOT: "polkadot",
    MATIC: "matic-network",
    LINK: "chainlink",
    LTC: "litecoin",
    SHIB: "shiba-inu",
    BCH: "bitcoin-cash",
    UNI: "uniswap",
    XLM: "stellar",
    ATOM: "cosmos",
    ETC: "ethereum-classic",
    FIL: "filecoin",
    APT: "aptos",
    NEAR: "near",
    ICP: "internet-computer",
    HBAR: "hedera-hashgraph",
    AAVE: "aave",
    XTZ: "tezos",
    THETA: "theta-token",
  };

  // Only fetch coins the user actually holds
  const heldSymbols = Object.keys(portfolioWallet).filter(
    (s) => portfolioWallet[s] > 0 && idMap[s]
  );

  if (!heldSymbols.length) {
    renderEmptyPortfolio();
    return;
  }

  const ids = heldSymbols.map((s) => idMap[s]).join(",");
  fetch(
    `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd`
  )
    .then((r) => r.json())
    .then((data) => {
      // Reverse map: coinGecko id -> symbol
      const reverseMap = Object.fromEntries(
        Object.entries(idMap).map(([sym, id]) => [id, sym])
      );
      portfolioPrices = {};
      Object.entries(data).forEach(([id, val]) => {
        const sym = reverseMap[id];
        if (sym) portfolioPrices[sym] = val.usd;
      });
      // USDT/USDC always = 1
      portfolioPrices.USDT = portfolioPrices.USDT || 1;
      portfolioPrices.USDC = portfolioPrices.USDC || 1;
      renderPortfolio();
    })
    .catch(() => {
      // Fallback: stablecoins = 1, rest = 0
      portfolioPrices = { USDT: 1, USDC: 1 };
      renderPortfolio();
    });
}

function renderEmptyPortfolio() {
  document.getElementById("portfolio-total").textContent = "$0.00";
  document.getElementById("portfolio-chart-wrap").innerHTML =
    '<div class="empty-state">No holdings yet. Deposit crypto to get started.</div>';
  document.getElementById("portfolio-holdings").innerHTML = "";
}

function renderPortfolio() {
  // Build holdings array
  const holdings = [];
  let total = 0;

  Object.entries(portfolioWallet).forEach(([sym, amount]) => {
    if (sym === "updatedAt" || !amount || amount <= 0) return;
    const price = portfolioPrices[sym] || 0;
    const usdValue = amount * price;
    if (usdValue < 0.001) return;
    total += usdValue;
    const coinMeta = (typeof CRYPTO_LIST !== "undefined"
      ? CRYPTO_LIST.find((c) => c.symbol === sym)
      : null) || { symbol: sym, name: sym, icon: sym[0], color: "#F0B90B" };
    holdings.push({ sym, amount, price, usdValue, meta: coinMeta });
  });

  holdings.sort((a, b) => b.usdValue - a.usdValue);

  // Total
  document.getElementById("portfolio-total").textContent =
    "$" + total.toFixed(2);

  // Pie chart (Chart.js loaded in HTML)
  renderPieChart(holdings, total);

  // Holdings list
  const list = document.getElementById("portfolio-holdings");
  if (!holdings.length) {
    list.innerHTML = '<div class="empty-state">No holdings yet.</div>';
    return;
  }

  list.innerHTML = holdings
    .map((h) => {
      const pct = total > 0 ? ((h.usdValue / total) * 100).toFixed(1) : 0;
      const decimals = h.sym === "BTC" ? 8 : h.usdValue < 1 ? 6 : 4;
      return `
        <div class="holding-row">
          <div class="holding-avatar" style="background:${
            h.meta.color
          }22;color:${h.meta.color};border:1px solid ${h.meta.color}44;">
            ${h.meta.icon}
          </div>
          <div class="holding-info">
            <div class="holding-sym">${h.sym}</div>
            <div class="holding-name">${h.meta.name}</div>
          </div>
          <div class="holding-amount">
            <div class="holding-usd">$${h.usdValue.toFixed(2)}</div>
            <div class="holding-pct">${h.amount.toFixed(
              decimals
            )} · ${pct}%</div>
          </div>
        </div>`;
    })
    .join("");
}

function renderPieChart(holdings, total) {
  const wrap = document.getElementById("portfolio-chart-wrap");

  if (!holdings.length) {
    wrap.innerHTML = '<div class="empty-state">No holdings to chart.</div>';
    return;
  }

  wrap.innerHTML = '<canvas id="pie-canvas"></canvas>';
  const ctx = document.getElementById("pie-canvas").getContext("2d");

  if (portfolioChart) portfolioChart.destroy();

  portfolioChart = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: holdings.map((h) => h.sym),
      datasets: [
        {
          data: holdings.map((h) => h.usdValue.toFixed(2)),
          backgroundColor: holdings.map((h) => h.meta.color + "CC"),
          borderColor: "#0B0E11",
          borderWidth: 2,
        },
      ],
    },
    options: {
      cutout: "70%",
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (ctx) => ` $${parseFloat(ctx.parsed).toFixed(2)}`,
          },
        },
      },
    },
  });
}

function exportCSV() {
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
        rows.push([
          date,
          d.type || "--",
          d.crypto || "--",
          d.amount || "--",
          d.status || "--",
        ]);
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
