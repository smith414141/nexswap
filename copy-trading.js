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
// ctCopySettings: { [traderId]: { allocation: number, maxLossLimit: number } }
let ctCopySettings = JSON.parse(localStorage.getItem("ct-copy-settings") || "{}");
let ctModalTraderId = null;

document.addEventListener("DOMContentLoaded", () => {
  renderTraders();
  updateCopySummary();
});

function ctSaveSettings() {
  localStorage.setItem("ct-copy-settings", JSON.stringify(ctCopySettings));
}

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
      const settings = ctCopySettings[t.id];
      const isCopying = !!settings;
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
      ${
        isCopying
          ? `<div style="display:flex;justify-content:space-between;font-size:11px;color:var(--text2);background:var(--bg3);border-radius:8px;padding:8px 10px;margin-bottom:10px">
              <span>Allocated: <strong style="color:var(--text)">$${settings.allocation.toLocaleString()}</strong></span>
              <span>Loss limit: <strong style="color:var(--yellow)">${settings.maxLossLimit}%</strong></span>
            </div>`
          : ""
      }
      <button class="ct-copy-btn${isCopying ? " is-copying" : ""}" id="ct-btn-${
        t.id
      }" onclick="${isCopying ? `cancelCopy(event, '${t.id}')` : `openCopyModal(event, '${t.id}')`}">
        ${isCopying ? "Cancel Copy" : "Copy Trader →"}
      </button>
    </div>`;
    })
    .join("");
}

function openCopyModal(event, id) {
  event.stopPropagation();
  const trader = TRADERS.find((t) => t.id === id);
  ctModalTraderId = id;
  document.getElementById("ct-modal-trader-name").textContent = `${trader.avatar} ${trader.name}`;
  document.getElementById("ct-modal-allocation").value = "";
  document.getElementById("ct-modal-limit").value = 20;
  document.getElementById("ct-modal-overlay").style.display = "flex";
}

function closeCopyModal() {
  document.getElementById("ct-modal-overlay").style.display = "none";
  ctModalTraderId = null;
}

function confirmCopy() {
  const id = ctModalTraderId;
  if (!id) return;
  const trader = TRADERS.find((t) => t.id === id);
  const allocation = parseFloat(document.getElementById("ct-modal-allocation").value);
  const maxLossLimit = parseFloat(document.getElementById("ct-modal-limit").value);

  if (!allocation || allocation < 10) {
    showToast("Enter at least $10 to allocate", "error");
    return;
  }
  if (!maxLossLimit || maxLossLimit < 5 || maxLossLimit > 100) {
    showToast("Loss limit must be between 5% and 100%", "error");
    return;
  }

  ctCopySettings[id] = { allocation, maxLossLimit };
  ctSaveSettings();
  closeCopyModal();
  renderTraders();
  updateCopySummary();
  showToast(`Now copying ${trader.name} — $${allocation.toLocaleString()} allocated, ${maxLossLimit}% loss limit`, "success");
}

function cancelCopy(event, id) {
  event.stopPropagation();
  const trader = TRADERS.find((t) => t.id === id);
  delete ctCopySettings[id];
  ctSaveSettings();
  renderTraders();
  updateCopySummary();
  showToast(`Stopped copying ${trader.name}`, "info");
}

function updateCopySummary() {
  const countEl = document.getElementById("ct-copying-count");
  const pnlEl = document.getElementById("ct-copy-pnl");
  if (!countEl || !pnlEl) return;
  const ids = Object.keys(ctCopySettings);
  countEl.textContent = ids.length;
  const pnl = ids.reduce((sum, id) => {
    const t = TRADERS.find((tr) => tr.id === id);
    const settings = ctCopySettings[id];
    if (!t || !settings) return sum;
    const rawPnl = settings.allocation * (t.roi / 100);
    const rawPnlPct = (rawPnl / settings.allocation) * 100;
    // Enforce the max loss limit — copying stops feeding further losses past this point
    const cappedPnl =
      rawPnlPct < -settings.maxLossLimit
        ? -settings.allocation * (settings.maxLossLimit / 100)
        : rawPnl;
    return sum + cappedPnl;
  }, 0);
  pnlEl.textContent =
    (pnl >= 0 ? "+" : "") + "$" + Math.round(pnl).toLocaleString();
  pnlEl.style.color = pnl >= 0 ? "var(--green)" : "var(--red)";
}

function goToTraderProfile(event, id) {
  if (event.target.closest("button")) return;
  window.location.href = `trader-profile.html?id=${id}`;
}
