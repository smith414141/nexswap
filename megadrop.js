// megadrop.js
const MEGADROP_END = new Date();
MEGADROP_END.setDate(MEGADROP_END.getDate() + 14);

const TASKS = [
  { id: "trade1", label: "Complete 1 spot trade", reward: 0.05, check: "trade" },
  { id: "deposit1", label: "Make a deposit of any size", reward: 0.05, check: "deposit" },
  { id: "invite1", label: "Invite 1 friend", reward: 0.1, check: "referral" },
  { id: "hold7", label: "Hold KRPX for 7 days", reward: 0.2, check: "hold" },
];

const TIERS = [
  { name: "Bronze", threshold: 0.5, bonus: 5, color: "#cd7f32", icon: "🥉" },
  { name: "Silver", threshold: 1, bonus: 10, color: "#c0c0c0", icon: "🥈" },
  { name: "Gold", threshold: 2, bonus: 20, color: "#ffd700", icon: "🥇" },
];

let currentUid = null;
let userWallet = {};
let userKrpBalance = 0;
let userKrpFirstHeldAt = null;
let megadropTasksDone = [];
let megadropEarned = 0;
let mgUnsub = null;

document.addEventListener("DOMContentLoaded", () => {
  updateCountdown();
  setInterval(updateCountdown, 1000);
});

auth.onAuthStateChanged((user) => {
  if (!user) return;
  currentUid = user.uid;
  initMegadrop();
});

async function initMegadrop() {
  await loadUserData();
  renderTiers();
  renderTasks();
  loadLeaderboard();
  startListeners();
}

async function loadUserData() {
  const [userDoc, walletDoc] = await Promise.all([
    db.collection("users").doc(currentUid).get(),
    db.collection("wallets").doc(currentUid).get(),
  ]);

  if (userDoc.exists) {
    const data = userDoc.data();
    megadropTasksDone = data.megadropTasks || [];
    megadropEarned = data.megadropEarned || 0;
    userKrpFirstHeldAt = data.krpxFirstHeldAt || null;
  }

  if (walletDoc.exists) {
    userWallet = walletDoc.data();
    userKrpBalance = userWallet.KRPX || 0;
    if (userKrpBalance > 0 && !userKrpFirstHeldAt) {
      await db.collection("users").doc(currentUid).set({
        krpxFirstHeldAt: firebase.firestore.FieldValue.serverTimestamp(),
      }, { merge: true });
      userKrpFirstHeldAt = Date.now();
    }
  }

  updateProgress();
  renderTiers();
}

function updateCountdown() {
  const diff = MEGADROP_END - new Date();
  if (diff <= 0) {
    document.getElementById("mg-countdown").textContent = "Ended";
    return;
  }
  const d = Math.floor(diff / 86400000);
  const h = Math.floor((diff % 86400000) / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  document.getElementById("mg-countdown").textContent = `${d}d ${h}h ${m}m ${s}s`;
}

function startListeners() {
  // Wallet listener for KRPX balance and task checks
  db.collection("wallets").doc(currentUid)
    .onSnapshot((doc) => {
      if (!doc.exists) return;
      userWallet = doc.data();
      userKrpBalance = userWallet.KRPX || 0;
      checkAndCompleteTasks();
      updateProgress();
      renderTiers();
    });

  // Transactions listener for trade/deposit checks
  db.collection("transactions").where("userId", "==", currentUid)
    .onSnapshot(() => {
      checkAndCompleteTasks();
    });

  // Users collection for participant count
  db.collection("users").where("megadropCommitted", "==", true)
    .onSnapshot((snap) => {
      document.getElementById("mg-participants").textContent = `🔥 ${snap.size} traders competing`;
    });
}

function checkAndCompleteTasks() {
  let changed = false;

  TASKS.forEach(async (task) => {
    if (megadropTasksDone.includes(task.id)) return;

    let complete = false;

    switch (task.check) {
      case "trade":
        complete = await hasTransactionType("trade");
        break;
      case "deposit":
        complete = await hasTransactionType("deposit");
        break;
      case "referral":
        complete = await hasReferral();
        break;
      case "hold":
        if (userKrpBalance > 0 && userKrpFirstHeldAt) {
          const heldDays = (Date.now() - new Date(userKrpFirstHeldAt).getTime()) / 86400000;
          complete = heldDays >= 7;
        }
        break;
    }

    if (complete) {
      await completeTask(task);
      changed = true;
    }
  });

  if (changed) {
    loadUserData();
  }
}

async function hasTransactionType(type) {
  const snap = await db.collection("transactions")
    .where("userId", "==", currentUid)
    .where("type", "==", type)
    .limit(1)
    .get();
  return !snap.empty;
}

async function hasReferral() {
  const userDoc = await db.collection("users").doc(currentUid).get();
  if (!userDoc.exists) return false;
  const data = userDoc.data();
  return (data.referralCount || 0) >= 1;
}

async function completeTask(task) {
  megadropTasksDone.push(task.id);
  megadropEarned += task.reward;

  // Credit KRPX to wallet
  await db.collection("wallets").doc(currentUid).update({
    KRPX: firebase.firestore.FieldValue.increment(task.reward),
  });

  // Update user doc with completed tasks and earned amount
  await db.collection("users").doc(currentUid).set({
    megadropTasks: megadropTasksDone,
    megadropEarned: megadropEarned,
  }, { merge: true });

  logTransaction(currentUid, "megadrop_reward", "KRPX", task.reward, "KRPX", `Megadrop: ${task.label}`);

  showToast(`Task complete! +${task.reward} KRPX`, "success");
  renderTasks();
  updateProgress();
  renderTiers();
}

function updateProgress() {
  const completed = megadropTasksDone.length;
  const total = TASKS.length;
  const pct = (completed / total) * 100;

  document.getElementById("mg-progress-text").textContent = `${completed}/${total} tasks complete`;
  document.getElementById("mg-progress-bar").style.width = `${pct}%`;
}

function renderTasks() {
  document.getElementById("mg-tasks").innerHTML = TASKS.map((t) => {
    const isDone = megadropTasksDone.includes(t.id);
    return `
    <div class="card" style="margin-bottom:10px;padding:14px;display:flex;justify-content:space-between;align-items:center">
      <div>
        <div style="font-weight:700">${t.label}</div>
        <div style="font-size:11px;color:var(--yellow)">+${t.reward} KRPX</div>
      </div>
      <span class="badge ${isDone ? "badge-green" : "badge-grey"}">${isDone ? "Done" : "Pending"}</span>
    </div>`;
  }).join("");
}

function renderTiers() {
  const currentTier = TIERS.reduce((acc, tier) => {
    if (megadropEarned >= tier.threshold) return tier;
    return acc;
  }, { name: "None", threshold: 0, bonus: 0, color: "var(--text3)", icon: "" });

  document.getElementById("mg-tiers").innerHTML = TIERS.map((tier) => {
    const isCurrent = currentTier.name === tier.name;
    const isReached = megadropEarned >= tier.threshold;
    return `
    <div class="card" style="padding: 16px; text-align: center; border: ${isCurrent ? "2px solid " + tier.color : "1px solid var(--border)"}; background: ${isCurrent ? tier.color + "20" : "transparent"};">
      <div style="font-size: 24px; margin-bottom: 8px;">${tier.icon}</div>
      <div style="font-weight: 800; font-size: 14px; color: ${isCurrent ? tier.color : "var(--text)"};">${tier.name}</div>
      <div style="font-size: 11px; color: var(--text2); margin: 4px 0;">${tier.threshold} KRPX</div>
      <div style="font-size: 12px; font-weight: 700; color: ${isCurrent ? tier.color : "var(--text3)"};">+${tier.bonus}% bonus</div>
      ${isCurrent ? '<div style="font-size: 10px; color: var(--green); margin-top: 4px;">✓ Active</div>' : isReached ? '<div style="font-size: 10px; color: var(--green); margin-top: 4px;">✓ Reached</div>' : ''}
    </div>`;
  }).join("");
}

async function loadLeaderboard() {
  try {
    const snap = await db.collection("users")
      .where("megadropEarned", ">", 0)
      .orderBy("megadropEarned", "desc")
      .limit(5)
      .get();

    const list = document.getElementById("mg-leaderboard-list");
    if (snap.empty) {
      list.innerHTML = '<div style="text-align:center;color:var(--text3);font-size:12px;">No earnings yet — be the first!</div>';
      return;
    }

    let rank = 0;
    list.innerHTML = snap.docs.map((doc) => {
      rank++;
      const d = doc.data();
      const name = d.name || `User ${doc.id.slice(0, 6)}`;
      const earned = d.megadropEarned || 0;
      return `
      <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid var(--border);">
        <div style="display:flex;align-items:center;gap:8px;">
          <span style="font-weight:800;color:var(--text3);min-width:24px;">#${rank}</span>
          <span style="font-weight:600;">${name}</span>
        </div>
        <div style="font-weight:800;color:var(--yellow);font-family:var(--font-mono);">${earned.toFixed(2)} KRPX</div>
      </div>`;
    }).join("");
  } catch (e) {
    console.error("Leaderboard load failed:", e);
  }
}

function commitMegadrop() {
  if (!currentUid) return;
  db.collection("users")
    .doc(currentUid)
    .set({ megadropCommitted: true }, { merge: true })
    .then(() =>
      showToast("You're committed to the Megadrop! Complete tasks to earn KRPX.", "success")
    )
    .catch((err) => showToast(err.message, "error"));
}