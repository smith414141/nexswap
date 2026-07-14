// staking.js
const STAKING_POOLS = [
  { coin: "ETH", apr: 3.8, liquidSymbol: "stETH", liquidName: "Lido Staked ETH", minAmount: 0.01 },
  { coin: "BNB", apr: 4.2, liquidSymbol: "stBNB", liquidName: "Staked BNB", minAmount: 0.1 },
  { coin: "SOL", apr: 6.1, liquidSymbol: "stSOL", liquidName: "Staked SOL", minAmount: 0.5 },
  { coin: "DOT", apr: 9.4, liquidSymbol: "stDOT", liquidName: "Staked DOT", minAmount: 1 },
];

let currentUid = null;
let stWallet = {};

document.addEventListener("DOMContentLoaded", () => {
  auth.onAuthStateChanged((user) => {
    if (!user || !user.emailVerified) return;
    currentUid = user.uid;
    initStaking();
  });
});

function initStaking() {
  renderPools();
  listenWallet();
  listenPositions();
}

function renderPools() {
  const grid = document.getElementById("st-pools");
  grid.innerHTML = STAKING_POOLS.map((pool, i) => `
    <div class="card" style="padding: 20px;">
      <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 12px;">
        <div style="font-size: 24px;">${getCoinIcon(pool.coin)}</div>
        <div>
          <div style="font-weight: 800; font-size: 16px;">${pool.coin}</div>
          <div style="font-size: 12px; color: var(--green); font-weight: 700;">${pool.apr}% APR</div>
        </div>
      </div>
      <div style="font-size: 12px; color: var(--text2); margin-bottom: 16px;">
        Receive: <strong>${pool.liquidSymbol}</strong> 1:1 (${pool.liquidName})
      </div>
      <div class="form-group" style="margin-bottom: 12px;">
        <label>Amount to stake</label>
        <input type="number" id="st-amount-${i}" placeholder="e.g. 1" min="${pool.minAmount}" step="any" style="width: 100%; padding: 12px 14px; background: var(--bg2); border: 1px solid var(--border); border-radius: 10px; color: var(--text); font-size: 14px; margin-top: 6px; box-sizing: border-box;" />
      </div>
      <button class="btn-primary" style="width: 100%; padding: 12px;" onclick="stakeNow('${pool.coin}', '${pool.liquidSymbol}', ${pool.apr}, ${i})">
        Stake & Receive ${pool.liquidSymbol}
      </button>
    </div>
  `).join("");
}

function getCoinIcon(sym) {
  if (typeof CRYPTO_LIST === "undefined") return sym[0];
  const coin = CRYPTO_LIST.find((c) => c.symbol === sym);
  return coin ? coin.icon : sym[0];
}

function listenWallet() {
  db.collection("wallets")
    .doc(currentUid)
    .onSnapshot((doc) => {
      if (!doc.exists) return;
      stWallet = doc.data();
    });
}

function listenPositions() {
  db.collection("stakingPositions")
    .where("userId", "==", currentUid)
    .onSnapshot(
      (snap) => {
        const list = document.getElementById("stk-list");
        const empty = document.getElementById("stk-empty");
        const docs = snap.docs.filter((d) => d.data().status !== "unstaked");
        if (docs.length === 0) {
          list.innerHTML = "";
          empty.style.display = "block";
          return;
        }
        empty.style.display = "none";
        list.innerHTML = docs.map((doc) => renderPosition(doc)).join("");
      },
      () => {
        document.getElementById("stk-list").innerHTML = '<div class="empty-state">Could not load positions.</div>';
      }
    );
}

function renderPosition(doc) {
  const p = doc.data();
  const created = p.createdAt?.toDate ? p.createdAt.toDate() : new Date(p.createdAt);
  const liquidBal = stWallet[p.liquidSymbol] || 0;
  return `
    <div class="card" style="padding: 16px;">
      <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 10px; flex-wrap: wrap; margin-bottom: 12px;">
        <div style="display: flex; gap: 10px; align-items: center;">
          <div style="font-weight: 800; font-size: 14px;">${p.amount} ${p.coin}</div>
          <span style="font-size: 11px; font-weight: 700; color: var(--green); background: rgba(14,203,129,0.1); padding: 2px 8px; border-radius: 4px;">${p.apr}% APR</span>
        </div>
        <div style="font-size: 11px; color: var(--text3);">Created ${created.toLocaleDateString()}</div>
      </div>
      <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; margin-bottom: 12px; font-size: 12px;">
        <div>
          <div style="color: var(--text3); font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em; margin-bottom: 4px;">Liquid Token</div>
          <div style="font-weight: 800; font-family: var(--font-mono);">${p.liquidAmount} ${p.liquidSymbol}</div>
        </div>
        <div>
          <div style="color: var(--text3); font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em; margin-bottom: 4px;">Liquid Token Balance</div>
          <div style="font-weight: 800; font-family: var(--font-mono); color: var(--green);">${liquidBal} ${p.liquidSymbol}</div>
        </div>
      </div>
      <button class="btn-secondary" style="width: 100%; padding: 10px;" onclick="unstake('${doc.id}', '${p.coin}', '${p.liquidSymbol}', ${p.amount})">
        Unstake ${p.amount} ${p.coin}
      </button>
    </div>
  `;
}

async function stakeNow(coin, liquidSymbol, apr, index) {
  const amount = parseFloat(document.getElementById(`st-amount-${index}`).value);
  const pool = STAKING_POOLS.find(p => p.coin === coin);
  
  if (!amount || amount <= 0) {
    showToast("Enter a valid amount", "error");
    return;
  }
  if (amount < pool.minAmount) {
    showToast(`Minimum ${pool.minAmount} ${coin}`, "error");
    return;
  }

  const balance = stWallet[coin] || 0;
  if (amount > balance) {
    showToast(`Insufficient ${coin} balance`, "error");
    return;
  }

  const btn = document.querySelector(`#st-amount-${index} + .btn-primary`);
  if (btn) { btn.disabled = true; btn.textContent = "Staking..."; }

  try {
    await db.collection("wallets").doc(currentUid).update({
      [coin]: firebase.firestore.FieldValue.increment(-amount),
      [liquidSymbol]: firebase.firestore.FieldValue.increment(amount),
    });

    await db.collection("stakingPositions").add({
      userId: currentUid,
      coin,
      liquidSymbol,
      liquidName: pool.liquidName,
      amount,
      liquidAmount: amount,
      apr,
      status: "active",
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    });

    logTransaction(currentUid, "stake", coin, amount, coin, "Liquid staking deposit");
    showToast(`Staked ${amount} ${coin} → received ${amount} ${liquidSymbol}`, "success");
    document.getElementById(`st-amount-${index}`).value = "";
  } catch (err) {
    showToast(err.message, "error");
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = `Stake & Receive ${liquidSymbol}`; }
  }
}

async function unstake(id, coin, liquidSymbol, amount) {
  const liquidBalance = stWallet[liquidSymbol] || 0;
  if (amount > liquidBalance) {
    showToast(`Insufficient ${liquidSymbol} balance`, "error");
    return;
  }

  if (!confirm(`Unstake ${amount} ${coin}? You will receive ${amount} ${coin} back.`)) return;

  const btn = document.querySelector(`[onclick*="unstake('${id}'"]`);
  if (btn) { btn.disabled = true; btn.textContent = "Unstaking..."; }

  try {
    await db.collection("wallets").doc(currentUid).update({
      [liquidSymbol]: firebase.firestore.FieldValue.increment(-amount),
      [coin]: firebase.firestore.FieldValue.increment(amount),
    });

    await db.collection("stakingPositions").doc(id).update({
      status: "unstaked",
      unstakedAt: firebase.firestore.FieldValue.serverTimestamp(),
    });

    logTransaction(currentUid, "unstake", coin, amount, coin, "Liquid staking withdrawal");
    showToast(`Unstaked ${amount} ${coin} successfully`, "success");
  } catch (err) {
    showToast(err.message, "error");
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = `Unstake ${amount} ${coin}`; }
  }
}