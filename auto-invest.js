// auto-invest.js
const AUTO_INVEST_COINS = ["BTC", "ETH", "BNB", "SOL", "XRP", "ADA", "DOGE", "AVAX", "DOT", "MATIC", "LINK", "LTC"];

let aiWallet = {};
let aiPrices = {};
let currentUid = null;
let aiUnsub = null;

document.addEventListener("DOMContentLoaded", () => {
  auth.onAuthStateChanged((user) => {
    if (!user || !user.emailVerified) return;
    currentUid = user.uid;
    initAutoInvest();
  });
});

function initAutoInvest() {
  populateCoinSelect();
  listenWallet();
  listenPlans();
  fetchPrices();
  setInterval(fetchPrices, 60000);
}

function populateCoinSelect() {
  const select = document.getElementById("ai-coin");
  select.innerHTML = AUTO_INVEST_COINS.map(
    (c) => `<option value="${c}">${c}</option>`
  ).join("");
}

function listenWallet() {
  db.collection("wallets")
    .doc(currentUid)
    .onSnapshot((doc) => {
      if (!doc.exists) return;
      aiWallet = doc.data();
    });
}

function fetchPrices() {
  const ids = {
    BTC: "bitcoin",
    ETH: "ethereum",
    BNB: "binancecoin",
    SOL: "solana",
    XRP: "ripple",
    ADA: "cardano",
    DOGE: "dogecoin",
    AVAX: "avalanche-2",
    DOT: "polkadot",
    MATIC: "matic-network",
    LINK: "chainlink",
    LTC: "litecoin",
  };
  const idsStr = Object.values(ids).join(",");
  fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${idsStr}&vs_currencies=usd`)
    .then((r) => r.json())
    .then((data) => {
      const reverseMap = Object.fromEntries(Object.entries(ids).map(([sym, id]) => [id, sym]));
      aiPrices = { USDT: 1, USDC: 1 };
      Object.entries(data).forEach(([id, val]) => {
        const sym = reverseMap[id];
        if (sym) aiPrices[sym] = val.usd;
      });
    })
    .catch(() => {
      aiPrices = { USDT: 1, USDC: 1 };
    });
}

function listenPlans() {
  if (aiUnsub) aiUnsub();
  aiUnsub = db.collection("autoInvestPlans")
    .where("userId", "==", currentUid)
    .onSnapshot(
      (snap) => {
        const list = document.getElementById("ai-plans-list");
        const empty = document.getElementById("ai-plans-empty");
        const docs = snap.docs.filter((d) => d.data().status !== "cancelled");
        if (docs.length === 0) {
          list.innerHTML = "";
          empty.style.display = "block";
          return;
        }
        empty.style.display = "none";
        list.innerHTML = docs.map((doc) => renderPlan(doc)).join("");
        docs.forEach((doc) => checkAndExecute(doc));
      },
      () => {
        document.getElementById("ai-plans-list").innerHTML = '<div class="empty-state">Could not load plans.</div>';
      }
    );
}

function renderPlan(doc) {
  const p = doc.data();
  const nextBuy = p.nextBuyAt?.toDate ? p.nextBuyAt.toDate() : new Date(p.nextBuyAt);
  const freqLabel = p.frequency === "daily" ? "Daily" : p.frequency === "weekly" ? "Weekly" : "Monthly";
  const statusLabel = p.status === "active" ? "Active" : "Paused";
  const statusColor = p.status === "active" ? "var(--green)" : "var(--blue)";
  const statusBg = p.status === "active" ? "rgba(14,203,129,0.1)" : "rgba(59,130,246,0.1)";

  return `
    <div class="card" style="padding: 16px;" data-id="${doc.id}">
      <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 10px; flex-wrap: wrap; margin-bottom: 12px;">
        <div style="display: flex; gap: 10px; align-items: center;">
          <div style="font-weight: 800; font-size: 14px;">Buy $${p.amount} of ${p.coin} — ${freqLabel}</div>
          <span style="font-size: 10px; font-weight: 700; color: ${statusColor}; background: ${statusBg}; padding: 2px 8px; border-radius: 4px;">${statusLabel}</span>
        </div>
      </div>
      <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 12px; font-size: 12px;">
        <div>
          <div style="color: var(--text3); font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em; margin-bottom: 4px;">Total Invested</div>
          <div style="font-weight: 800; font-family: var(--font-mono);">$${p.totalInvested.toFixed(2)}</div>
        </div>
        <div>
          <div style="color: var(--text3); font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em; margin-bottom: 4px;">Next Buy</div>
          <div style="font-weight: 700; font-family: var(--font-mono);">${nextBuy.toLocaleDateString()} ${nextBuy.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}</div>
        </div>
        <div>
          <div style="color: var(--text3); font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em; margin-bottom: 4px;">Executions</div>
          <div style="font-weight: 700; font-family: var(--font-mono);">${p.executions || 0}</div>
        </div>
      </div>
      <div style="display: flex; gap: 8px; flex-wrap: wrap;">
        <button class="btn-secondary" style="flex: 1; padding: 10px;" onclick="togglePlanStatus('${doc.id}', '${p.status}')">
          ${p.status === "active" ? "Pause" : "Resume"}
        </button>
        <button class="btn-secondary" style="flex: 1; padding: 10px; background: var(--bg3); border-color: var(--red); color: var(--red);" onclick="cancelPlan('${doc.id}')">
          Cancel Plan
        </button>
      </div>
    </div>
  `;
}

async function createPlan() {
  const coin = document.getElementById("ai-coin").value;
  const amount = parseFloat(document.getElementById("ai-amount").value);
  const frequency = document.getElementById("ai-frequency").value;

  if (!amount || amount < 1) {
    showToast("Minimum 1 USDT per buy", "error");
    return;
  }

  const usdtBalance = aiWallet.USDT || 0;
  if (amount > usdtBalance) {
    showToast("Insufficient USDT balance", "error");
    return;
  }

  const now = new Date();
  let nextBuyAt = new Date(now);
  if (frequency === "daily") nextBuyAt.setDate(nextBuyAt.getDate() + 1);
  else if (frequency === "weekly") nextBuyAt.setDate(nextBuyAt.getDate() + 7);
  else if (frequency === "monthly") nextBuyAt.setMonth(nextBuyAt.getMonth() + 1);

  const btn = document.querySelector(".btn-primary");
  if (btn) { btn.disabled = true; btn.textContent = "Creating..."; }

  try {
    await db.collection("autoInvestPlans").add({
      userId: currentUid,
      coin,
      amount,
      frequency,
      status: "active",
      totalInvested: 0,
      executions: 0,
      nextBuyAt: firebase.firestore.Timestamp.fromDate(nextBuyAt),
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    });
    showToast("Auto-Invest plan created", "success");
    document.getElementById("ai-amount").value = "";
  } catch (err) {
    showToast(err.message, "error");
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = "Start Plan"; }
  }
}

async function checkAndExecute(doc) {
  const p = doc.data();
  if (p.status !== "active") return;

  const nextBuyAt = p.nextBuyAt?.toDate ? p.nextBuyAt.toDate() : new Date(p.nextBuyAt);
  if (nextBuyAt > new Date()) return;

  const usdtBalance = aiWallet.USDT || 0;
  if (p.amount > usdtBalance) {
    showToast(`Insufficient USDT for ${p.coin} plan. Plan paused.`, "error");
    await db.collection("autoInvestPlans").doc(doc.id).update({ status: "paused" });
    return;
  }

  const price = aiPrices[p.coin];
  if (!price || price <= 0) {
    console.warn("Price not available for", p.coin);
    return;
  }

  const coinAmount = p.amount / price;

  const planCard = document.querySelector(`[data-id="${doc.id}"]`);
  if (planCard) planCard.style.opacity = "0.6";

  try {
    await db.collection("wallets").doc(currentUid).update({
      USDT: firebase.firestore.FieldValue.increment(-p.amount),
      [p.coin]: firebase.firestore.FieldValue.increment(coinAmount),
    });

    await db.collection("autoInvestPlans").doc(doc.id).update({
      totalInvested: firebase.firestore.FieldValue.increment(p.amount),
      executions: firebase.firestore.FieldValue.increment(1),
      nextBuyAt: getNextBuyAt(p.frequency),
    });

    logTransaction(currentUid, "auto_invest_buy", p.coin, p.amount, "USDT", `Auto-Invest recurring buy: $${p.amount} ${p.coin}`);

    showToast(`Auto-Invest: Bought ${coinAmount.toFixed(6)} ${p.coin} for $${p.amount}`, "success");
  } catch (err) {
    showToast(err.message, "error");
  } finally {
    if (planCard) planCard.style.opacity = "1";
  }
}

function getNextBuyAt(frequency) {
  const now = new Date();
  if (frequency === "daily") now.setDate(now.getDate() + 1);
  else if (frequency === "weekly") now.setDate(now.getDate() + 7);
  else if (frequency === "monthly") now.setMonth(now.getMonth() + 1);
  return firebase.firestore.Timestamp.fromDate(now);
}

async function togglePlanStatus(id, currentStatus) {
  const newStatus = currentStatus === "active" ? "paused" : "active";
  try {
    await db.collection("autoInvestPlans").doc(id).update({ status: newStatus });
    showToast(newStatus === "active" ? "Plan resumed" : "Plan paused", "info");
  } catch (err) {
    showToast(err.message, "error");
  }
}

async function cancelPlan(id) {
  if (!confirm("Cancel this Auto-Invest plan? This cannot be undone.")) return;
  try {
    await db.collection("autoInvestPlans").doc(id).update({ status: "cancelled" });
    showToast("Plan cancelled", "info");
  } catch (err) {
    showToast(err.message, "error");
  }
}

function btn(selector) {
  return document.querySelector(selector);
}