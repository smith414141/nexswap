// earn.js
// Staking + Flexible Savings using Firestore stakingPositions collection.
// Locked staking: balance locked until maturity, fixed APY accrued.
// Flexible: withdrawable anytime, lower APY.

const STAKING_PRODUCTS = [
  {
    coin: "USDT",
    type: "flexible",
    apy: 4.5,
    label: "Flexible Savings",
    minAmount: 10,
    lockDays: 0,
  },
  {
    coin: "USDT",
    type: "locked",
    apy: 8.0,
    label: "30-Day Lock",
    minAmount: 50,
    lockDays: 30,
  },
  {
    coin: "BTC",
    type: "flexible",
    apy: 1.5,
    label: "Flexible Savings",
    minAmount: 0.001,
    lockDays: 0,
  },
  {
    coin: "BTC",
    type: "locked",
    apy: 3.0,
    label: "60-Day Lock",
    minAmount: 0.01,
    lockDays: 60,
  },
  {
    coin: "ETH",
    type: "flexible",
    apy: 3.0,
    label: "Flexible Savings",
    minAmount: 0.01,
    lockDays: 0,
  },
  {
    coin: "ETH",
    type: "locked",
    apy: 5.5,
    label: "30-Day Lock",
    minAmount: 0.05,
    lockDays: 30,
  },
  {
    coin: "SOL",
    type: "flexible",
    apy: 5.0,
    label: "Flexible Savings",
    minAmount: 0.1,
    lockDays: 0,
  },
  {
    coin: "BNB",
    type: "flexible",
    apy: 3.5,
    label: "Flexible Savings",
    minAmount: 0.05,
    lockDays: 0,
  },
];

let earnWallet = {};
let activeTab = "products";

auth.onAuthStateChanged((user) => {
  if (!user || !user.emailVerified) return;
  db.collection("wallets")
    .doc(user.uid)
    .onSnapshot((doc) => {
      if (!doc.exists) return;
      earnWallet = doc.data();
    });
  renderProducts();
  if (activeTab === "positions") loadPositions(user.uid);
});

function switchEarnTab(tab, btn) {
  activeTab = tab;
  document
    .querySelectorAll(".tabs .tab")
    .forEach((t) => t.classList.remove("active"));
  btn.classList.add("active");
  document.getElementById("earn-products").style.display =
    tab === "products" ? "block" : "none";
  document.getElementById("earn-positions").style.display =
    tab === "positions" ? "block" : "none";
  if (tab === "positions") loadPositions(auth.currentUser?.uid);
}

function renderProducts() {
  const container = document.getElementById("earn-products-list");
  container.innerHTML = STAKING_PRODUCTS.map(
    (p, i) => `
      <div class="card" style="margin-bottom:10px;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
          <div style="display:flex;align-items:center;gap:10px;">
            <div class="dep-coin-avatar" style="width:36px;height:36px;font-size:13px;">${getCoinIcon(
              p.coin
            )}</div>
            <div>
              <div style="font-weight:700;font-size:14px;">${p.coin} — ${
      p.label
    }</div>
              <div style="font-size:11px;color:var(--text3);">Min: ${
                p.minAmount
              } ${p.coin} · ${
      p.lockDays > 0 ? p.lockDays + " days" : "No lockup"
    }</div>
            </div>
          </div>
          <div style="text-align:right;">
            <div style="font-size:18px;font-weight:900;color:var(--green);">${
              p.apy
            }%</div>
            <div style="font-size:10px;color:var(--text3);">APY</div>
          </div>
        </div>
        <button class="btn-primary" style="margin:0;padding:10px;" onclick="openStakeModal(${i})">
          ${p.type === "flexible" ? "Earn Flexibly" : "Stake & Lock"}
        </button>
      </div>
    `
  ).join("");
}

function getCoinIcon(sym) {
  if (typeof CRYPTO_LIST === "undefined") return sym[0];
  const coin = CRYPTO_LIST.find((c) => c.symbol === sym);
  return coin ? coin.icon : sym[0];
}

let selectedProduct = null;

function openStakeModal(productIndex) {
  selectedProduct = STAKING_PRODUCTS[productIndex];
  const bal = earnWallet[selectedProduct.coin] || 0;
  const decimals = selectedProduct.coin === "BTC" ? 8 : 4;

  document.getElementById(
    "stake-modal-title"
  ).textContent = `${selectedProduct.coin} — ${selectedProduct.label}`;
  document.getElementById("stake-apy").textContent =
    selectedProduct.apy + "% APY";
  document.getElementById(
    "stake-balance"
  ).textContent = `Available: ${bal.toFixed(decimals)} ${selectedProduct.coin}`;
  document.getElementById("stake-amount").value = "";
  document.getElementById("stake-modal").style.display = "flex";
}

function closeStakeModal() {
  document.getElementById("stake-modal").style.display = "none";
  selectedProduct = null;
}

function submitStake() {
  const user = auth.currentUser;
  const amount = parseFloat(document.getElementById("stake-amount").value);
  const bal = earnWallet[selectedProduct.coin] || 0;

  if (!amount || amount <= 0) {
    showToast("Enter an amount", "error");
    return;
  }
  if (amount < selectedProduct.minAmount) {
    showToast(
      `Minimum is ${selectedProduct.minAmount} ${selectedProduct.coin}`,
      "error"
    );
    return;
  }
  if (amount > bal) {
    showToast("Insufficient balance", "error");
    return;
  }

  const btn = document.getElementById("stake-btn");
  btn.disabled = true;
  btn.textContent = "Staking...";

  const maturityDate =
    selectedProduct.lockDays > 0
      ? new Date(Date.now() + selectedProduct.lockDays * 86400000)
      : null;

  db.collection("wallets")
    .doc(user.uid)
    .update({
      [selectedProduct.coin]: firebase.firestore.FieldValue.increment(-amount),
    })
    .then(() =>
      db.collection("stakingPositions").add({
        userId: user.uid,
        coin: selectedProduct.coin,
        type: selectedProduct.type,
        label: selectedProduct.label,
        amount,
        apy: selectedProduct.apy,
        lockDays: selectedProduct.lockDays,
        maturityDate: maturityDate
          ? firebase.firestore.Timestamp.fromDate(maturityDate)
          : null,
        status: "active",
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      })
    )
    .then(() => {
      showToast(
        `Staked ${amount} ${selectedProduct.coin} at ${selectedProduct.apy}% APY`,
        "success"
      );
      closeStakeModal();
    })
    .catch((err) => showToast(err.message, "error"))
    .finally(() => {
      btn.disabled = false;
      btn.textContent = "Confirm Stake";
    });
}

function loadPositions(uid) {
  if (!uid) return;
  const container = document.getElementById("earn-positions-list");
  container.innerHTML = '<div class="empty-state">Loading...</div>';

  db.collection("stakingPositions")
    .where("userId", "==", uid)
    .where("status", "==", "active")
    .get()
    .then((snap) => {
      if (snap.empty) {
        container.innerHTML =
          '<div class="empty-state">No active positions. Start earning above.</div>';
        return;
      }
      const positions = [];
      snap.forEach((doc) => positions.push({ id: doc.id, ...doc.data() }));

      container.innerHTML = positions
        .map((p) => {
          const now = Date.now();
          const created = p.createdAt?.toMillis?.() || now;
          const daysActive = Math.floor((now - created) / 86400000);
          const earned = (
            p.amount *
            (p.apy / 100) *
            (daysActive / 365)
          ).toFixed(6);
          const isMatured = p.maturityDate && p.maturityDate.toMillis() <= now;
          const maturityStr = p.maturityDate
            ? p.maturityDate.toDate().toLocaleDateString()
            : "Anytime";

          return `
          <div class="card" style="margin-bottom:10px;">
            <div style="display:flex;justify-content:space-between;margin-bottom:8px;">
              <div style="font-weight:700;">${p.coin} — ${p.label}</div>
              <span class="badge badge-green">${p.apy}% APY</span>
            </div>
            <div class="payment-info-row"><span>Staked</span><strong>${
              p.amount
            } ${p.coin}</strong></div>
            <div class="payment-info-row"><span>Earned (est.)</span><strong style="color:var(--green)">~${earned} ${
            p.coin
          }</strong></div>
            <div class="payment-info-row"><span>Withdraw</span><strong>${maturityStr}</strong></div>
            ${
              p.type === "flexible" || isMatured
                ? `
            <button class="btn-secondary" style="margin-top:10px;padding:8px;" onclick="unstake('${
              p.id
            }', ${p.amount}, '${p.coin}', ${parseFloat(earned)})">
              Withdraw
            </button>`
                : `<p style="font-size:11px;color:var(--text3);margin-top:8px;">Locked until ${maturityStr}</p>`
            }
          </div>`;
        })
        .join("");
    })
    .catch(
      (err) =>
        (container.innerHTML = `<div class="empty-state">Error: ${err.message}</div>`)
    );
}

function unstake(positionId, stakedAmount, coin, earnedAmount) {
  const user = auth.currentUser;
  if (
    !confirm(
      `Withdraw ${stakedAmount} ${coin} + ~${earnedAmount.toFixed(6)} earned?`
    )
  )
    return;

  const totalReturn = stakedAmount + earnedAmount;

  db.collection("wallets")
    .doc(user.uid)
    .update({
      [coin]: firebase.firestore.FieldValue.increment(totalReturn),
    })
    .then(() =>
      db
        .collection("stakingPositions")
        .doc(positionId)
        .update({ status: "withdrawn" })
    )
    .then(() => {
      showToast(`Withdrawn ${totalReturn.toFixed(6)} ${coin}`, "success");
      loadPositions(user.uid);
    })
    .catch((err) => showToast(err.message, "error"));
}
