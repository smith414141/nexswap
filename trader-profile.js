// trader-profile.js
// Relies on TRADERS, ctCopying, formatUsd, and riskClass from copy-trading.js
// (loaded before this file on trader-profile.html).

document.addEventListener("DOMContentLoaded", () => {
  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");
  const trader = TRADERS.find((t) => t.id === id);
  const container = document.getElementById("tp-content");
  if (!trader) {
    container.innerHTML = `<p style="text-align:center;color:var(--text3);padding:40px 0">Trader not found.</p>`;
    return;
  }
  renderTraderProfile(trader);
});

function renderTraderProfile(t) {
  const container = document.getElementById("tp-content");
  const isCopying = ctCopying.has(t.id);

  // Deterministic fake recent-trade log so the page feels alive without a backend.
  const recentTrades = t.pairs
    .flatMap((pair, i) => [
      {
        pair,
        side: i % 2 === 0 ? "Long" : "Short",
        pnl: (t.roi / 10 - i * 3.4).toFixed(2),
      },
      {
        pair,
        side: i % 2 === 0 ? "Short" : "Long",
        pnl: (t.roi / 14 - i * 2.1).toFixed(2),
      },
    ])
    .slice(0, 6);

  container.innerHTML = `
      <div class="tp-header">
        <div class="tp-avatar">${t.avatar}</div>
        <div>
          <div class="tp-name">${
            t.name
          } <span title="Verified trader">✅</span></div>
          <div class="tp-followers">${t.followers.toLocaleString()} followers · ${
    t.trades
  } total trades</div>
        </div>
      </div>
  
      <div class="tp-stats-grid">
        <div class="tp-stat-card">
          <div class="tp-stat-label">ROI</div>
          <div class="tp-stat-value" style="color:var(--green)">+${t.roi.toFixed(
            1
          )}%</div>
        </div>
        <div class="tp-stat-card">
          <div class="tp-stat-label">Win Rate</div>
          <div class="tp-stat-value">${t.winRate}%</div>
        </div>
        <div class="tp-stat-card">
          <div class="tp-stat-label">AUM</div>
          <div class="tp-stat-value">${formatUsd(t.aum)}</div>
        </div>
        <div class="tp-stat-card">
          <div class="tp-stat-label">Max Drawdown</div>
          <div class="tp-stat-value" style="color:var(--red)">${t.maxDrawdown.toFixed(
            1
          )}%</div>
        </div>
        <div class="tp-stat-card">
          <div class="tp-stat-label">Risk Level</div>
          <div class="tp-stat-value ${riskClass(t.risk)}">${t.risk}</div>
        </div>
        <div class="tp-stat-card">
          <div class="tp-stat-label">Total Trades</div>
          <div class="tp-stat-value">${t.trades}</div>
        </div>
      </div>
  
      <p class="section-title">Traded Pairs</p>
      <div class="tp-pairs">
        ${t.pairs.map((p) => `<span class="tp-pair-chip">${p}</span>`).join("")}
      </div>
  
      <button class="tp-copy-btn${
        isCopying ? " is-copying" : ""
      }" id="tp-copy-btn" onclick="tpToggleCopy('${t.id}')">
        ${isCopying ? "Cancel Copy" : "Copy Trader"}
      </button>
  
      <p class="section-title">Recent Trades</p>
      <div class="card">
        ${recentTrades
          .map(
            (r) => `
          <div class="tp-trade-row">
            <span style="font-weight:700">${r.pair}/USDT</span>
            <span style="color:var(--text2)">${r.side}</span>
            <span style="font-weight:700;color:${
              r.pnl >= 0 ? "var(--green)" : "var(--red)"
            }">${r.pnl >= 0 ? "+" : ""}${r.pnl}%</span>
          </div>`
          )
          .join("")}
      </div>
    `;
}

function tpToggleCopy(id) {
  const trader = TRADERS.find((t) => t.id === id);
  const btn = document.getElementById("tp-copy-btn");
  if (ctCopying.has(id)) {
    ctCopying.delete(id);
    btn.classList.remove("is-copying");
    btn.textContent = "Copy Trader";
    showToast(`Stopped copying ${trader.name}`, "info");
  } else {
    ctCopying.add(id);
    btn.classList.add("is-copying");
    btn.textContent = "Cancel Copy";
    showToast(`Now copying ${trader.name}`, "success");
  }
  localStorage.setItem("ct-copying", JSON.stringify([...ctCopying]));
}
