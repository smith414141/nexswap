// copy-trading.js
const TRADERS = [
  {
    id: "crypto-whale",
    name: "CryptoWhale",
    avatar: "🐋",
    followers: 12450,
    roi: 342.5,
    winRate: 78,
    trades: 890,
    aum: 540000,
    maxDrawdown: 12.3,
    risk: "Medium",
    pairs: ["BTC", "ETH", "SOL"],
  },
  {
    id: "diamond-hands",
    name: "DiamondHands",
    avatar: "💎",
    followers: 8300,
    roi: 287.3,
    winRate: 71,
    trades: 560,
    aum: 320000,
    maxDrawdown: 18.7,
    risk: "High",
    pairs: ["BTC", "DOGE", "PEPE"],
  },
  {
    id: "solana-king",
    name: "SolanaKing",
    avatar: "👑",
    followers: 6700,
    roi: 215.8,
    winRate: 82,
    trades: 410,
    aum: 210000,
    maxDrawdown: 9.2,
    risk: "Low",
    pairs: ["SOL", "ETH"],
  },
  {
    id: "alpha-hunter",
    name: "AlphaHunter",
    avatar: "🎯",
    followers: 5200,
    roi: 189.4,
    winRate: 65,
    trades: 320,
    aum: 180000,
    maxDrawdown: 22.1,
    risk: "High",
    pairs: ["BTC", "ARB", "OP", "FET"],
  },
  {
    id: "grid-master",
    name: "GridMaster",
    avatar: "🔲",
    followers: 4300,
    roi: 156.2,
    winRate: 74,
    trades: 1240,
    aum: 145000,
    maxDrawdown: 8.4,
    risk: "Low",
    pairs: ["BTC", "ETH", "BNB"],
  },
  {
    id: "moonshot",
    name: "MoonShot",
    avatar: "🚀",
    followers: 3800,
    roi: 132.9,
    winRate: 60,
    trades: 275,
    aum: 98000,
    maxDrawdown: 27.6,
    risk: "High",
    pairs: ["DOGE", "SHIB"],
  },
  {
    id: "steady-gains",
    name: "SteadyGains",
    avatar: "📈",
    followers: 3500,
    roi: 98.4,
    winRate: 79,
    trades: 630,
    aum: 87000,
    maxDrawdown: 6.1,
    risk: "Low",
    pairs: ["USDT", "BTC", "ETH"],
  },
  {
    id: "alpha-wolf",
    name: "AlphaWolf",
    avatar: "🐺",
    followers: 3204,
    roi: 142.3,
    winRate: 68,
    trades: 505,
    aum: 76000,
    maxDrawdown: 15.9,
    risk: "Medium",
    pairs: ["BTC", "XRP"],
  },
];

let ctSort = "roi";
let ctCopying = new Set(JSON.parse(localStorage.getItem("ct-copying") || "[]"));

document.addEventListener("DOMContentLoaded", () => {
  renderTraders();
  updateCopySummary();
});

function ctSetSort(field, btn) {
  ctSort = field;
  document
    .querySelectorAll(".ct-tab")
    .forEach((t) => t.classList.remove("active"));
  btn.classList.add("active");
  renderTraders();
}

function riskClass(risk) {
  return "ct-risk-" + risk.toLowerCase();
}

function formatUsd(n) {
  if (n >= 1000000) return "$" + (n / 1000000).toFixed(2) + "M";
  if (n >= 1000) return "$" + (n / 1000).toFixed(0) + "K";
  return "$" + n.toFixed(0);
}

function renderTraders() {
  const list = document.getElementById("ct-list");
  if (!list) return;
  const sorted = [...TRADERS].sort(
    (a, b) => (b[ctSort] || 0) - (a[ctSort] || 0)
  );
  list.innerHTML = sorted
    .map((t, i) => {
      const isCopying = ctCopying.has(t.id);
      return `
    <div class="ct-card" onclick="goToTraderProfile(event, '${t.id}')">
      <div class="ct-card-top">
        <div class="ct-avatar">${t.avatar}${
        i === 0 ? '<span class="ct-crown">👑</span>' : ""
      }</div>
        <div>
          <div class="ct-name">${t.name}</div>
          <div class="ct-followers">${t.followers.toLocaleString()} followers</div>
        </div>
      </div>
      <div class="ct-stats">
        <div>
          <div class="ct-stat-label">ROI</div>
          <div class="ct-stat-value" style="color:var(--green)">+${t.roi.toFixed(
            1
          )}%</div>
        </div>
        <div>
          <div class="ct-stat-label">Win Rate</div>
          <div class="ct-stat-value">${t.winRate}%</div>
        </div>
        <div>
          <div class="ct-stat-label">Trades</div>
          <div class="ct-stat-value">${t.trades}</div>
        </div>
        <div>
          <div class="ct-stat-label">AUM</div>
          <div class="ct-stat-value">${formatUsd(t.aum)}</div>
        </div>
        <div>
          <div class="ct-stat-label">Max Drawdown</div>
          <div class="ct-stat-value" style="color:var(--red)">${t.maxDrawdown.toFixed(
            1
          )}%</div>
        </div>
        <div>
          <div class="ct-stat-label">Risk Level</div>
          <div class="ct-stat-value ${riskClass(t.risk)}">${t.risk}</div>
        </div>
      </div>
      <div class="ct-pairs">
        ${t.pairs.map((p) => `<span class="ct-pair-chip">${p}</span>`).join("")}
      </div>
      <button class="ct-copy-btn${isCopying ? " is-copying" : ""}" id="ct-btn-${
        t.id
      }" onclick="toggleCopy(event, '${t.id}')">
        ${isCopying ? "Cancel Copy" : "Copy Trader →"}
      </button>
    </div>`;
    })
    .join("");
}

function toggleCopy(event, id) {
  event.stopPropagation();
  const trader = TRADERS.find((t) => t.id === id);
  const btn = document.getElementById("ct-btn-" + id);
  if (ctCopying.has(id)) {
    ctCopying.delete(id);
    btn.classList.remove("is-copying");
    btn.textContent = "Copy Trader →";
    showToast(`Stopped copying ${trader.name}`, "info");
  } else {
    ctCopying.add(id);
    btn.classList.add("is-copying");
    btn.textContent = "Cancel Copy";
    showToast(`Now copying ${trader.name}`, "success");
  }
  localStorage.setItem("ct-copying", JSON.stringify([...ctCopying]));
  updateCopySummary();
}

function updateCopySummary() {
  const countEl = document.getElementById("ct-copying-count");
  const pnlEl = document.getElementById("ct-copy-pnl");
  if (!countEl || !pnlEl) return;
  countEl.textContent = ctCopying.size;
  const pnl = [...ctCopying].reduce((sum, id) => {
    const t = TRADERS.find((tr) => tr.id === id);
    return sum + (t ? t.aum * 0.001 * (t.roi / 100) : 0);
  }, 0);
  pnlEl.textContent =
    (pnl >= 0 ? "+" : "") + "$" + Math.round(pnl).toLocaleString();
  pnlEl.style.color = pnl >= 0 ? "var(--green)" : "var(--red)";
}

function goToTraderProfile(event, id) {
  if (event.target.closest("button")) return;
  window.location.href = `trader-profile.html?id=${id}`;
}
