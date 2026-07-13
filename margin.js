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
let mgCollateralUsd = 0; // computed from the user's real wallet balance
let mgPricesUsd = { USDT: 1, USDC: 1 };

// Leverage-implied borrowing power: with maxLev "3x" you can borrow up to
// (3-1)x your collateral against that asset, capped by the pool's "available".
function leverageMultiplier(lev) {
  const n = parseFloat(lev) || 1;
  return Math.max(n - 1, 0);
}

document.addEventListener("DOMContentLoaded", () => {
  renderBorrowTable();
  renderLoans();
  initMgTicker();
  loadCollateral();
});

function loadCollateral() {
  auth.onAuthStateChanged((user) => {
    if (!user) return;
    db.collection("wallets")
      .doc(user.uid)
      .onSnapshot((doc) => {
        const wallet = doc.exists ? doc.data() : {};
        fetchCollateralPrices(wallet);
      });
  });
}

function fetchCollateralPrices(wallet) {
  const symbols = Object.keys(wallet).filter(
    (k) => k !== "updatedAt" && typeof wallet[k] === "number"
  );
  const idMap = {
    BTC: "bitcoin",
    ETH: "ethereum",
    BNB: "binancecoin",
    SOL: "solana",
    XRP: "ripple",
    ADA: "cardano",
    DOGE: "dogecoin",
    AVAX: "avalanche-2",
    DOT: "polkadot",
    LINK: "chainlink",
  };
  const ids = symbols
    .map((s) => idMap[s])
    .filter(Boolean)
    .join(",");
  const finish = () => {
    mgCollateralUsd = symbols.reduce((sum, sym) => {
      const price =
        sym === "USDT" || sym === "USDC" ? 1 : mgPricesUsd[sym] || 0;
      return sum + (wallet[sym] || 0) * price;
    }, 0);
    updateMgSummary();
    renderBorrowTable();
  };
  if (!ids) {
    finish();
    return;
  }
  fetch(
    `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd`
  )
    .then((r) => r.json())
    .then((data) => {
      const reverse = Object.fromEntries(
        Object.entries(idMap).map(([s, id]) => [id, s])
      );
      Object.entries(data).forEach(([id, val]) => {
        const sym = reverse[id];
        if (sym) mgPricesUsd[sym] = val.usd;
      });
      finish();
    })
    .catch(finish);
}

function borrowedUsd() {
  return mgLoans.reduce((sum, l) => {
    const asset = MG_ASSETS.find((a) => a.sym === l.sym);
    return sum + l.amount * (asset ? asset.price : 0);
  }, 0);
}

function maxBorrowableFor(sym) {
  const asset = MG_ASSETS.find((a) => a.sym === sym);
  if (!asset || mgCollateralUsd <= 0) return 0;
  const remainingPowerUsd = Math.max(
    mgCollateralUsd * leverageMultiplier(asset.maxLev) - borrowedUsd(),
    0
  );
  const capByPool = asset.available;
  return Math.min(remainingPowerUsd / asset.price, capByPool);
}

function formatMgPrice(p) {
  return p >= 1
    ? "$" +
        p.toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })
    : "$" + p.toFixed(4);
}

function renderBorrowTable() {
  const body = document.getElementById("mg-borrow-body");
  if (!body) return;
  body.innerHTML = MG_ASSETS.map((a) => {
    const maxAmt = maxBorrowableFor(a.sym);
    const disabled = maxAmt <= 0;
    return `
    <tr style="border-top:1px solid var(--border)">
      <td style="padding:10px;font-weight:700">${a.sym}</td>
      <td>${formatMgPrice(a.price)}</td>
      <td style="color:var(--yellow)">${a.rate.toFixed(4)}%</td>
      <td>${a.maxLev}</td>
      <td>${a.available.toFixed(2)} ${a.sym}</td>
      <td>
        <button class="btn-primary" style="padding:6px 16px;font-size:12px${
          disabled ? ";opacity:0.4;cursor:not-allowed" : ""
        }"
          ${disabled ? "disabled" : ""} onclick="openMgModal('${
      a.sym
    }')">Borrow</button>
      </td>
    </tr>`;
  }).join("");
  const banner = document.getElementById("mg-no-collateral-banner");
  if (banner) banner.style.display = mgCollateralUsd <= 0 ? "block" : "none";
}

function openMgModal(sym) {
  const maxAmt = maxBorrowableFor(sym);
  if (maxAmt <= 0) {
    showToast(
      mgCollateralUsd <= 0
        ? "Deposit funds to your wallet first — borrowing requires collateral"
        : "You've reached your borrowing limit for this asset",
      "error"
    );
    return;
  }
  mgModalAsset = sym;
  document.getElementById("mg-modal-asset").textContent = sym;
  document.getElementById("mg-modal-max").textContent =
    maxAmt.toFixed(6) + " " + sym;
  document.getElementById("mg-borrow-amount").value = "";
  document.getElementById("mg-borrow-modal").style.display = "flex";
}

function closeMgModal() {
  document.getElementById("mg-borrow-modal").style.display = "none";
}

function confirmBorrow() {
  const amount =
    parseFloat(document.getElementById("mg-borrow-amount").value) || 0;
  if (amount <= 0) {
    showToast("Enter a valid amount", "error");
    return;
  }
  if (mgCollateralUsd <= 0) {
    showToast(
      "Deposit funds to your wallet first — borrowing requires collateral",
      "error"
    );
    return;
  }
  const maxAmt = maxBorrowableFor(mgModalAsset);
  if (amount > maxAmt) {
    showToast(
      `Exceeds your borrowing power (max ${maxAmt.toFixed(
        6
      )} ${mgModalAsset} based on your collateral)`,
      "error"
    );
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
  renderBorrowTable();
  showToast(`Borrowed ${amount} ${mgModalAsset}`, "success");
}

function repayLoan(id) {
  mgLoans = mgLoans.filter((l) => l.id !== id);
  renderLoans();
  updateMgSummary();
  renderBorrowTable();
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
          <div style="font-size:11px;color:var(--text2)">${
            l.leverage
          } · ${Math.max(l.days, 1)} days · ${l.dailyRate.toFixed(4)}%/day</div>
        </div>
        <div style="text-align:right">
          <div style="font-size:11px;color:var(--text2)">Interest</div>
          <div style="font-size:12px;font-weight:700;color:var(--yellow)">${interest.toFixed(
            6
          )} ${l.sym}</div>
        </div>
        <button class="btn-secondary" style="padding:6px 14px;font-size:12px" onclick="repayLoan(${
          l.id
        })">Repay</button>
      </div>`;
    })
    .join("");
}

function updateMgSummary() {
  const totalUsd = borrowedUsd();
  const collateralEl = document.getElementById("mg-collateral");
  if (collateralEl) {
    collateralEl.textContent =
      "$" +
      mgCollateralUsd.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
  }
  document.getElementById("mg-total-borrowed").textContent =
    "$" +
    totalUsd.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  const ratioEl = document.getElementById("mg-ratio");
  if (totalUsd <= 0) {
    ratioEl.textContent = "--";
    ratioEl.style.color = "var(--green)";
    return;
  }
  const ratio = (mgCollateralUsd + totalUsd) / totalUsd;
  ratioEl.textContent = ratio.toFixed(2) + "x";
  ratioEl.style.color =
    ratio < 1.3 ? "var(--red)" : ratio < 1.8 ? "var(--yellow)" : "var(--green)";
}

// ---- TICKER BAR ----
function initMgTicker() {
  fetch(
    "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,binancecoin,solana,ripple,cardano&vs_currencies=usd&include_24hr_change=true"
  )
    .then((r) => r.json())
    .then((data) => {
      const map = {
        bitcoin: "BTC",
        ethereum: "ETH",
        binancecoin: "BNB",
        solana: "SOL",
        ripple: "XRP",
        cardano: "ADA",
      };
      const track = document.getElementById("pc-ticker-track");
      if (!track) return;
      const rows = Object.entries(map)
        .filter(([id]) => data[id])
        .map(([id, sym]) => ({
          sym,
          price: data[id].usd,
          change: data[id].usd_24h_change || 0,
        }));
      if (!rows.length) return;
      const itemHtml = (r) => `
        <span class="pc-ticker-item">
          <span class="sym">${r.sym}/USDT</span>
          <span class="text-mono">${
            r.price >= 1
              ? "$" +
                r.price.toLocaleString("en-US", { maximumFractionDigits: 2 })
              : "$" + r.price.toFixed(4)
          }</span>
          <span class="chg ${r.change >= 0 ? "positive" : "negative"}">${
        r.change >= 0 ? "↗" : "↘"
      } ${(r.change >= 0 ? "+" : "") + r.change.toFixed(2)}%</span>
        </span>`;
      const rowHtml = rows.map(itemHtml).join("");
      track.innerHTML = rowHtml + rowHtml;
    })
    .catch(() => {});
}
