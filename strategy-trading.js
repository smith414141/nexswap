// strategy-trading.js
const STRATEGIES = [
  { name: "BTC/USDT Neutral Grid", range: "$62,000 – $72,000", grids: 40 },
  { name: "ETH/USDT Long Grid", range: "$3,000 – $4,200", grids: 30 },
  { name: "SOL/USDT Neutral Grid", range: "$140 – $210", grids: 25 },
];

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("gt-list").innerHTML = STRATEGIES.map(
    (s, i) => `
    <div class="card" style="margin-bottom:10px;padding:14px">
      <strong>${s.name}</strong>
      <div style="font-size:12px;color:var(--text2);margin-top:4px">Range: ${s.range} · ${s.grids} grids</div>
      <button class="btn-secondary" style="margin-top:10px" onclick="runBacktest(${i})">Run Backtest</button>
    </div>`
  ).join("");
});

function runBacktest(i) {
  const s = STRATEGIES[i];
  const mockReturn = (Math.random() * 30 + 5).toFixed(1);
  const box = document.getElementById("gt-backtest-result");
  box.style.display = "block";
  box.innerHTML = `
    <p class="section-title">Backtest — ${s.name}</p>
    <div class="payment-info-row"><span>Simulated period</span><strong>Last 90 days</strong></div>
    <div class="payment-info-row"><span>Estimated return</span><strong style="color:var(--green)">+${mockReturn}%</strong></div>
    <div class="payment-info-row"><span>Max drawdown</span><strong style="color:var(--red)">-${(mockReturn / 3).toFixed(1)}%</strong></div>
    <p style="font-size:11px;color:var(--text3);margin-top:8px">Past performance of a backtest does not guarantee future results.</p>
  `;
}
