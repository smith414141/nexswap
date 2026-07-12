// margin.js
const MG_ASSETS = [
  { sym: "BTC", price: 67432.5, rate: 0.0772, maxLev: "3x", available: 553.67 },
  { sym: "ETH", price: 3521.8, rate: 0.0138, maxLev: "10x", available: 209.26 },
  { sym: "BNB", price: 598.4, rate: 0.0357, maxLev: "3x", available: 138.3 },
  { sym: "SOL", price: 172.35, rate: 0.074, maxLev: "10x", available: 480.3 },
  { sym: "XRP", price: 0.5234, rate: 0.0848, maxLev: "5x", available: 758.23 },
  { sym: "ADA", price: 0.4521, rate: 0.0175, maxLev: "10x", available: 884.24 },
  { sym: "DOGE", price: 0.1234, rate: 0.0769, maxLev: "3x", available: 417.15 },
  { sym: "AVAX", price: 35.67, rate: 0.0735, maxLev: "5x", available: 139.5 },
  { sym: "DOT", price: 7.23, rate: 0.0291, maxLev: "3x", available: 714.49 },
  { sym: "LINK", price: 14.56, rate: 0.0138, maxLev: "3x", available: 837.39 },
];

let mgLoans = [];
let mgModalAsset = null;

document.addEventListener("DOMContentLoaded", () => {
  renderBorrowTable();
  renderLoans();
  initMgTicker();
});

function formatMgPrice(p) {
  return p >= 1 ? "$" + p.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "$" + p.toFixed(4);
}

function renderBorrowTable() {
  const body = document.getElementById("mg-borrow-body");
  if (!body) return;
  body.innerHTML = MG_ASSETS.map(
    (a) => `
    <tr style="border-top:1px solid var(--border)">
      <td style="padding:10px;font-weight:700">${a.sym}</td>
      <td>${formatMgPrice(a.price)}</td>
      <td style="color:var(--yellow)">${a.rate.toFixed(4)}%</td>
      <td>${a.maxLev}</td>
      <td>${a.available.toFixed(2)} ${a.sym}</td>
      <td><button class="btn-primary" style="padding:6px 16px;font-size:12px" onclick="openMgModal('${a.sym}')">Borrow</button></td>
    </tr>`
  ).join("");
}

function openMgModal(sym) {
  mgModalAsset = sym;
  document.getElementById("mg-modal-asset").textContent = sym;
  document.getElementById("mg-borrow-amount").value = "";
  document.getElementById("mg-borrow-modal").style.display = "flex";
}

function closeMgModal() {
  document.getElementById("mg-borrow-modal").style.display = "none";
}

function confirmBorrow() {
  const amount = parseFloat(document.getElementById("mg-borrow-amount").value) || 0;
  if (amount <= 0) {
    showToast("Enter a valid amount", "error");
    return;
  }
  const asset = MG_ASSETS.find((a) => a.sym === mgModalAsset);
  mgLoans.unshift({
    id: Date.now(),
    sym: mgModalAsset,
    amount,
    leverage: asset.maxLev,
    dailyRate: asset.rate,
    days: 0,
  });
  closeMgModal();
  renderLoans();
  updateMgSummary();
  showToast(`Borrowed ${amount} ${mgModalAsset}`, "success");
}

function repayLoan(id) {
  mgLoans = mgLoans.filter((l) => l.id !== id);
  renderLoans();
  updateMgSummary();
}

function renderLoans() {
  const list = document.getElementById("mg-loans-list");
  if (!mgLoans.length) {
    list.innerHTML = `<p style="text-align:center;color:var(--text3);font-size:13px;padding:20px 0" id="mg-loans-empty">No active loans</p>`;
    return;
  }
  list.innerHTML = mgLoans
    .map((l) => {
      const interest = l.amount * (l.dailyRate / 100) * Math.max(l.days, 1);
      return `
      <div style="display:flex;justify-content:space-between;align-items:center;padding:12px 0;border-bottom:1px solid var(--border)">
        <div>
          <div style="font-weight:700;font-size:13px">${l.amount} ${l.sym}</div>
          <div style="font-size:11px;color:var(--text2)">${l.leverage} · ${Math.max(l.days, 1)} days · ${l.dailyRate.toFixed(4)}%/day</div>
        </div>
        <div style="text-align:right">
          <div style="font-size:11px;color:var(--text2)">Interest</div>
          <div style="font-size:12px;font-weight:700;color:var(--yellow)">${interest.toFixed(6)} ${l.sym}</div>
        </div>
        <button class="btn-secondary" style="padding:6px 14px;font-size:12px" onclick="repayLoan(${l.id})">Repay</button>
      </div>`;
    })
    .join("");
}

function updateMgSummary() {
  const totalUsd = mgLoans.reduce((sum, l) => {
    const asset = MG_ASSETS.find((a) => a.sym === l.sym);
    return sum + l.amount * (asset ? asset.price : 0);
  }, 0);
  document.getElementById("mg-total-borrowed").textContent = "$" + totalUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  document.getElementById("mg-ratio").textContent = totalUsd > 0 ? "2.3x" : "--";
}

// ---- TICKER BAR ----
function initMgTicker() {
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
        <span class="pc-ticker-item">
          <span class="sym">${r.sym}/USDT</span>
          <span class="text-mono">${r.price >= 1 ? "$" + r.price.toLocaleString("en-US", { maximumFractionDigits: 2 }) : "$" + r.price.toFixed(4)}</span>
          <span class="chg ${r.change >= 0 ? "positive" : "negative"}">${r.change >= 0 ? "↗" : "↘"} ${(r.change >= 0 ? "+" : "") + r.change.toFixed(2)}%</span>
        </span>`;
      const rowHtml = rows.map(itemHtml).join("");
      track.innerHTML = rowHtml + rowHtml;
    })
    .catch(() => {});
}
