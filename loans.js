// loans.js
const LOAN_ASSETS = [
  { coin: "BTC", maxLTV: 0.65, dailyRate: 0.00019, liquidationThreshold: 0.75 },
  { coin: "ETH", maxLTV: 0.50, dailyRate: 0.00028, liquidationThreshold: 0.60 },
  { coin: "BNB", maxLTV: 0.65, dailyRate: 0.00022, liquidationThreshold: 0.75 },
  { coin: "SOL", maxLTV: 0.50, dailyRate: 0.00035, liquidationThreshold: 0.60 },
  { coin: "XRP", maxLTV: 0.70, dailyRate: 0.00045, liquidationThreshold: 0.80 },
  { coin: "ADA", maxLTV: 0.70, dailyRate: 0.00050, liquidationThreshold: 0.80 },
];

let currentUid = null;
let userWallet = {};
let userKycStatus = "none";
let loanPrices = {};
let activeLoans = [];
let borrowModalData = { coin: null, price: 0, maxLTV: 0, dailyRate: 0, liquidationThreshold: 0 };
let repayModalData = { loan: null };

document.addEventListener("DOMContentLoaded", () => {
  auth.onAuthStateChanged((user) => {
    if (!user) return;
    currentUid = user.uid;
    initLoans();
  });
});

async function initLoans() {
  await loadUserData();
  await fetchPrices();
  renderAssetsTable();
  renderLoans();
  startListeners();
}

async function loadUserData() {
  const [userDoc, walletDoc] = await Promise.all([
    db.collection("users").doc(currentUid).get(),
    db.collection("wallets").doc(currentUid).get(),
  ]);

  if (userDoc.exists) {
    userKycStatus = userDoc.data().kycStatus || "none";
  }

  if (walletDoc.exists) {
    userWallet = walletDoc.data();
  }

  updateKYCState();
}

function updateKYCState() {
  const isVerified = userKycStatus === "approved";
  const borrowBtns = document.querySelectorAll('[onclick^="openBorrowModal"]');
  borrowBtns.forEach(btn => {
    if (!isVerified) {
      btn.disabled = true;
      btn.title = "KYC required — complete verification to borrow";
      btn.style.opacity = "0.5";
    } else {
      btn.disabled = false;
      btn.title = "";
      btn.style.opacity = "1";
    }
  });
}

async function fetchPrices() {
  const ids = LOAN_ASSETS.map(a => ({
    BTC: "bitcoin", ETH: "ethereum", BNB: "binancecoin",
    SOL: "solana", XRP: "ripple", ADA: "cardano"
  }[a.coin])).join(",");

  try {
    const res = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd`);
    const data = await res.json();
    loanPrices = {
      BTC: data.bitcoin?.usd || 0,
      ETH: data.ethereum?.usd || 0,
      BNB: data.binancecoin?.usd || 0,
      SOL: data.solana?.usd || 0,
      XRP: data.ripple?.usd || 0,
      ADA: data.cardano?.usd || 0,
    };
    renderAssetsTable();
    renderLoans();
  } catch (e) {
    console.warn("Price fetch failed", e);
    loanPrices = { BTC: 65000, ETH: 3500, BNB: 580, SOL: 140, XRP: 0.52, ADA: 0.45 };
    renderAssetsTable();
    renderLoans();
  }
}

function startListeners() {
  db.collection("wallets").doc(currentUid).onSnapshot((doc) => {
    if (!doc.exists) return;
    userWallet = doc.data();
    renderAssetsTable();
    renderLoans();
  });

  db.collection("users").doc(currentUid).onSnapshot((doc) => {
    if (!doc.exists) return;
    activeLoans = doc.data().loans || [];
    renderLoans();
    if (repayModalData.loan) {
      const updated = activeLoans.find(l => l.id === repayModalData.loan.id);
      if (updated) updateRepayModal(updated);
    }
  });
}

function renderAssetsTable() {
  const tbody = document.getElementById("loans-assets-table");
  tbody.innerHTML = LOAN_ASSETS.map(asset => {
    const price = loanPrices[asset.coin] || 0;
    const balance = userWallet[asset.coin] || 0;
    const collateralValue = balance * price;
    const maxBorrow = collateralValue * asset.maxLTV;

    return `
      <tr style="border-bottom:1px solid var(--border)">
        <td style="padding:12px 14px">
          <div style="display:flex;align-items:center;gap:10px">
            <div style="width:32px;height:32px;border-radius:50%;background:${getCoinColor(asset.coin)}22;color:${getCoinColor(asset.coin)};display:flex;align-items:center;justify-content:center;font-weight:800;font-size:12px">${getCoinIcon(asset.coin)}</div>
            <div style="font-weight:700">${asset.coin}</div>
          </div>
        </td>
        <td style="padding:12px 14px;text-align:right;font-family:var(--font-mono);font-weight:700">$${price.toLocaleString(undefined,{minimumFractionDigits:price<1?4:2,maximumFractionDigits:price<1?4:2})}</td>
        <td style="padding:12px 14px;text-align:right;font-weight:700;font-family:var(--font-mono)">${(asset.maxLTV*100).toFixed(0)}%</td>
        <td style="padding:12px 14px;text-align:right;font-weight:700;font-family:var(--font-mono);color:var(--text2)">${(asset.dailyRate*100).toFixed(3)}%</td>
        <td style="padding:12px 14px;text-align:center">
          <button class="btn-primary" style="width:auto;padding:8px 16px;font-size:12px" onclick="openBorrowModal('${asset.coin}')" ${userKycStatus !== "approved" ? "disabled title='KYC required'" : ""}>
            Borrow
          </button>
        </td>
      </tr>
    `;
  }).join("");
}

function getCoinIcon(sym) {
  const coin = (typeof CRYPTO_LIST !== "undefined" ? CRYPTO_LIST.find(c => c.symbol === sym) : null) || { icon: sym[0], color: "#F0B90B" };
  return coin.icon;
}

function getCoinColor(sym) {
  const coin = (typeof CRYPTO_LIST !== "undefined" ? CRYPTO_LIST.find(c => c.symbol === sym) : null) || { color: "#F0B90B" };
  return coin.color;
}

function renderLoans() {
  const list = document.getElementById("loans-list");
  const empty = document.getElementById("loans-empty");
  const active = activeLoans.filter(l => l.status === "active");

  if (active.length === 0) {
    list.innerHTML = "";
    empty.style.display = "block";
    return;
  }
  empty.style.display = "none";

  list.innerHTML = active.map(loan => {
    const asset = LOAN_ASSETS.find(a => a.coin === loan.collateralCoin);
    const price = loanPrices[loan.collateralCoin] || 0;
    const collateralValue = loan.collateralAmount * price;
    const healthFactor = (collateralValue * asset.liquidationThreshold) / loan.borrowedUsdt;

    let hfClass = "var(--green)";
    if (healthFactor < 1.0) hfClass = "var(--red)";
    else if (healthFactor < 1.5) hfClass = "var(--yellow)";

    const accruedInterest = calculateAccruedInterest(loan);
    const totalOwed = loan.borrowedUsdt + accruedInterest;

    return `
      <div class="card" style="padding:16px">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:10px;flex-wrap:wrap;margin-bottom:12px">
          <div style="display:flex;gap:10px;align-items:center">
            <div style="width:36px;height:36px;border-radius:50%;background:${getCoinColor(loan.collateralCoin)}22;color:${getCoinColor(loan.collateralCoin)};display:flex;align-items:center;justify-content:center;font-weight:800;font-size:13px">${getCoinIcon(loan.collateralCoin)}</div>
            <div>
              <div style="font-weight:800;font-size:14px">${loan.collateralAmount} ${loan.collateralCoin} collateral</div>
              <div style="font-size:11px;color:var(--text3)">Borrowed: $${loan.borrowedUsdt.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})} USDT</div>
            </div>
          </div>
          <span class="badge badge-green" style="font-size:11px">Active</span>
        </div>
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;font-size:12px;margin-bottom:12px">
          <div>
            <div style="color:var(--text3);font-weight:700;text-transform:uppercase;letter-spacing:0.04em;margin-bottom:4px">Collateral Value</div>
            <div style="font-weight:800;font-family:var(--font-mono)">$${collateralValue.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}</div>
          </div>
          <div>
            <div style="color:var(--text3);font-weight:700;text-transform:uppercase;letter-spacing:0.04em;margin-bottom:4px">Total Owed</div>
            <div style="font-weight:800;font-family:var(--font-mono);color:var(--red)">$${totalOwed.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}</div>
          </div>
          <div>
            <div style="color:var(--text3);font-weight:700;text-transform:uppercase;letter-spacing:0.04em;margin-bottom:4px">Health Factor</div>
            <div style="font-weight:800;font-family:var(--font-mono);color:${hfClass}">${healthFactor.toFixed(2)}</div>
          </div>
        </div>
        <div style="font-size:11px;color:var(--text3);margin-bottom:10px">Accrued interest: $${accruedInterest.toFixed(2)} · Daily rate: ${(asset.dailyRate*100).toFixed(3)}%</div>
        <button class="btn-secondary" style="width:100%;padding:10px" onclick="openRepayModal('${loan.id}')">Repay & Release Collateral</button>
      </div>
    `;
  }).join("");
}

function calculateAccruedInterest(loan) {
  const daysSinceCreated = (Date.now() - (loan.createdAt?.toMillis ? loan.createdAt.toMillis() : loan.createdAt)) / 86400000;
  return loan.borrowedUsdt * loan.dailyRate * Math.max(0, daysSinceCreated);
}

// ==== Borrow Modal ====
function openBorrowModal(coin) {
  if (userKycStatus !== "approved") {
    showToast("KYC verification required to borrow. Complete verification first.", "error");
    setTimeout(() => window.location.href = "verify.html", 1500);
    return;
  }

  const asset = LOAN_ASSETS.find(a => a.coin === coin);
  const price = loanPrices[coin] || 0;
  const balance = userWallet[coin] || 0;

  borrowModalData = {
    coin,
    price,
    maxLTV: asset.maxLTV,
    dailyRate: asset.dailyRate,
    liquidationThreshold: asset.liquidationThreshold,
  };

  document.getElementById("borrow-modal-title").textContent = `Borrow against ${coin}`;
  document.getElementById("borrow-collateral-amount").value = "";
  document.getElementById("borrow-collateral-amount").placeholder = `e.g. ${coin === "BTC" ? "0.1" : coin === "ETH" ? "1" : "100"}`;
  document.getElementById("borrow-collateral-balance").textContent = `Available: ${balance.toFixed(coin === "BTC" ? 8 : 4)} ${coin}`;
  document.getElementById("borrow-amount").value = "";
  document.getElementById("borrow-error").style.display = "none";
  document.getElementById("borrow-confirm-btn").disabled = true;

  updateBorrowPreview();
  document.getElementById("borrow-modal").style.display = "flex";
}

function closeBorrowModal() {
  document.getElementById("borrow-modal").style.display = "none";
  borrowModalData = {};
}

function updateBorrowPreview() {
  const { coin, price, maxLTV, dailyRate, liquidationThreshold } = borrowModalData;
  if (!price) return;

  const collateralAmount = parseFloat(document.getElementById("borrow-collateral-amount").value) || 0;
  const borrowAmount = parseFloat(document.getElementById("borrow-amount").value) || 0;
  const balance = userWallet[coin] || 0;

  const collateralValue = collateralAmount * price;
  const maxBorrowable = collateralValue * maxLTV;

  // Health factor preview
  let healthFactor = "--";
  if (collateralAmount > 0 && borrowAmount > 0) {
    healthFactor = (collateralValue * liquidationThreshold / borrowAmount).toFixed(2);
  } else if (collateralAmount > 0) {
    healthFactor = (liquidationThreshold / maxLTV).toFixed(2);
  }

  // Liquidation price
  const liquidationPrice = borrowAmount > 0 ? (borrowAmount / (collateralAmount * liquidationThreshold)).toFixed(2) : "--";

  document.getElementById("borrow-max-borrowable").textContent = `$${maxBorrowable.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}`;
  document.getElementById("borrow-collateral-value").textContent = `$${collateralValue.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}`;
  document.getElementById("borrow-health-factor").textContent = healthFactor;
  document.getElementById("borrow-health-factor").style.color = healthFactor !== "--" && parseFloat(healthFactor) < 1.0 ? "var(--red)" : healthFactor !== "--" && parseFloat(healthFactor) < 1.5 ? "var(--yellow)" : "var(--green)";
  document.getElementById("borrow-liquidation-price").textContent = liquidationPrice !== "--" ? `$${liquidationPrice}` : "--";

  // Validation
  const btn = document.getElementById("borrow-confirm-btn");
  const errorDiv = document.getElementById("borrow-error");
  let error = "";

  if (collateralAmount > balance) {
    error = `Insufficient ${coin} balance (have ${balance.toFixed(4)})`;
  } else if (borrowAmount > maxBorrowable) {
    error = `Exceeds max borrowable ($${maxBorrowable.toFixed(2)})`;
  } else if (borrowAmount <= 0) {
    error = "Enter borrow amount";
  } else if (collateralAmount <= 0) {
    error = "Enter collateral amount";
  }

  if (error) {
    errorDiv.textContent = error;
    errorDiv.style.display = "block";
    btn.disabled = true;
  } else {
    errorDiv.style.display = "none";
    btn.disabled = false;
  }
}

async function confirmBorrow() {
  const { coin, price, maxLTV, dailyRate, liquidationThreshold } = borrowModalData;
  const collateralAmount = parseFloat(document.getElementById("borrow-collateral-amount").value);
  const borrowAmount = parseFloat(document.getElementById("borrow-amount").value);
  const balance = userWallet[coin] || 0;

  if (collateralAmount > balance) {
    showToast(`Insufficient ${coin} balance`, "error");
    return;
  }

  const collateralValue = collateralAmount * price;
  if (borrowAmount > collateralValue * maxLTV) {
    showToast("Borrow amount exceeds max LTV", "error");
    return;
  }

  const btn = document.getElementById("borrow-confirm-btn");
  btn.disabled = true;
  btn.textContent = "Processing...";

  try {
    // Deduct collateral, add USDT
    await db.collection("wallets").doc(currentUid).update({
      [coin]: firebase.firestore.FieldValue.increment(-collateralAmount),
      USDT: firebase.firestore.FieldValue.increment(borrowAmount),
    });

    const loan = {
      id: "loan_" + Date.now(),
      collateralCoin: coin,
      collateralAmount,
      borrowedUsdt: borrowAmount,
      dailyRate,
      liquidationThreshold,
      status: "active",
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    };

    await db.collection("users").doc(currentUid).update({
      loans: firebase.firestore.FieldValue.arrayUnion(loan),
    });

    logTransaction(currentUid, "loan_borrow", coin, collateralAmount, coin, `Loan collateral locked: borrowed $${borrowAmount} USDT`);
    showToast(`Borrowed $${borrowAmount.toLocaleString()} USDT against ${collateralAmount} ${coin}`, "success");
    closeBorrowModal();
  } catch (err) {
    showToast(err.message, "error");
  } finally {
    btn.disabled = false;
    btn.textContent = "Confirm Borrow";
  }
}

// ==== Repay Modal ====
function openRepayModal(loanId) {
  const loan = activeLoans.find(l => l.id === loanId);
  if (!loan) return;

  repayModalData.loan = loan;
  const asset = LOAN_ASSETS.find(a => a.coin === loan.collateralCoin);
  const accruedInterest = calculateAccruedInterest(loan);
  const totalOwed = loan.borrowedUsdt + accruedInterest;
  const usdtBalance = userWallet.USDT || 0;

  document.getElementById("repay-details").innerHTML = `
    <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:12px;font-size:12px;margin-bottom:12px">
      <div><div style="color:var(--text3);font-weight:700;text-transform:uppercase;letter-spacing:0.04em;margin-bottom:4px">Borrowed</div><div style="font-weight:800;font-family:var(--font-mono)">$${loan.borrowedUsdt.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}</div></div>
      <div><div style="color:var(--text3);font-weight:700;text-transform:uppercase;letter-spacing:0.04em;margin-bottom:4px">Accrued Interest</div><div style="font-weight:800;font-family:var(--font-mono);color:var(--yellow)">$${accruedInterest.toFixed(2)}</div></div>
      <div><div style="color:var(--text3);font-weight:700;text-transform:uppercase;letter-spacing:0.04em;margin-bottom:4px">Total to Repay</div><div style="font-weight:800;font-family:var(--font-mono);color:var(--red)">$${totalOwed.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}</div></div>
      <div><div style="color:var(--text3);font-weight:700;text-transform:uppercase;letter-spacing:0.04em;margin-bottom:4px">USDT Balance</div><div style="font-weight:800;font-family:var(--font-mono);color:${usdtBalance >= totalOwed ? "var(--green)" : "var(--red)"}">$${usdtBalance.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}</div></div>
    </div>
    <div style="font-size:11px;color:var(--text3);padding:10px;background:var(--bg2);border:1px solid var(--border);border-radius:8px">
      You will receive back <strong>${loan.collateralAmount} ${loan.collateralCoin}</strong> collateral upon repayment.
    </div>
  `;

  const btn = document.getElementById("repay-confirm-btn");
  btn.disabled = usdtBalance < totalOwed;
  if (usdtBalance < totalOwed) {
    btn.textContent = "Insufficient USDT";
  } else {
    btn.textContent = "Repay & Release Collateral";
  }

  document.getElementById("repay-modal").style.display = "flex";
}

function closeRepayModal() {
  document.getElementById("repay-modal").style.display = "none";
  repayModalData = { loan: null };
}

function updateRepayModal(loan) {
  repayModalData.loan = loan;
  openRepayModal(loan.id);
}

async function confirmRepay() {
  const { loan } = repayModalData;
  if (!loan) return;

  const accruedInterest = calculateAccruedInterest(loan);
  const totalOwed = loan.borrowedUsdt + accruedInterest;
  const usdtBalance = userWallet.USDT || 0;

  if (usdtBalance < totalOwed) {
    showToast("Insufficient USDT balance", "error");
    return;
  }

  const btn = document.getElementById("repay-confirm-btn");
  btn.disabled = true;
  btn.textContent = "Repaying...";

  try {
    // Deduct USDT, return collateral
    await db.collection("wallets").doc(currentUid).update({
      USDT: firebase.firestore.FieldValue.increment(-totalOwed),
      [loan.collateralCoin]: firebase.firestore.FieldValue.increment(loan.collateralAmount),
    });

    // Update loan status
    const updatedLoans = activeLoans.map(l => l.id === loan.id ? { ...l, status: "repaid" } : l);
    await db.collection("users").doc(currentUid).update({ loans: updatedLoans });

    logTransaction(currentUid, "loan_repay", "USDT", totalOwed, "USDT", `Loan repaid: returned ${loan.collateralAmount} ${loan.collateralCoin}`);
    showToast(`Repaid $${totalOwed.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})} — collateral released`, "success");
    closeRepayModal();
  } catch (err) {
    showToast(err.message, "error");
  } finally {
    btn.disabled = false;
    btn.textContent = "Repay & Release Collateral";
  }
}