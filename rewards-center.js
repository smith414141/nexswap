// rewards-center.js
const DAILY_TASKS = [
  { id: "login", label: "Daily Login", points: 5, check: "login" },
  { id: "trade", label: "Trade any pair", points: 50, check: "trade" },
  { id: "markets", label: "Check markets 3 times", points: 20, check: "markets" },
  { id: "invite", label: "Invite a friend", points: 500, check: "invite" },
];

let currentUid = null;
let rewardPoints = 0;
let tasksState = {};
let referralLink = "";
let referralCode = "";
let referralStats = { total: 0, active: 0, earned: 0 };
let marketsCheckedToday = 0;

auth.onAuthStateChanged((user) => {
  if (!user || !user.emailVerified) return;
  currentUid = user.uid;
  loadRewardsData();
  initRewardsCenter();
});

async function loadRewardsData() {
  const [userDoc, walletDoc] = await Promise.all([
    db.collection("users").doc(currentUid).get(),
    db.collection("wallets").doc(currentUid).get(),
  ]);

  if (userDoc.exists) {
    const data = userDoc.data();
    rewardPoints = data.rewardPoints || 0;
    tasksState = data.dailyTasks || {};
    referralCode = data.referralCode || "";
    referralLink = "https://kripex.it.com/login.html?ref=" + referralCode;

    // Check if tasks are from today
    const today = new Date().toDateString();
    if (tasksState.date !== today) {
      tasksState = { date: today };
    }
  }

  if (walletDoc.exists) {
    marketsCheckedToday = walletDoc.data().marketsCheckedToday || 0;
  }

  // Load referral stats
  await loadReferralStats();

  renderPoints();
  renderTasks();
  renderReferral();
}

async function loadReferralStats() {
  const snap = await db.collection("referrals").where("referrerId", "==", currentUid).get();
  referralStats.total = snap.size;
  referralStats.active = snap.docs.filter(d => d.data().hasTraded).length;
  referralStats.earned = snap.docs.reduce((sum, d) => sum + (d.data().rewardUSD || 0), 0);
}

function renderPoints() {
  document.getElementById("reward-points").textContent = rewardPoints.toLocaleString();
  const completed = DAILY_TASKS.filter(t => tasksState[t.id] === true).length;
  document.getElementById("tasks-progress").textContent = `${completed}/${DAILY_TASKS.length} tasks completed`;
}

function renderTasks() {
  const container = document.getElementById("daily-tasks-list");
  const today = new Date().toDateString();

  container.innerHTML = DAILY_TASKS.map(task => {
    const isClaimed = tasksState[task.id] === true;
    const canClaim = checkTaskEligible(task);

    return `
      <div class="card" style="margin-bottom: 12px; padding: 16px;">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 12px;">
          <div style="flex: 1; min-width: 0;">
            <div style="font-weight: 700; font-size: 14px;">${task.label}</div>
            <div style="font-size: 10px; color: var(--text3); text-transform: uppercase; letter-spacing: 0.04em; margin-top: 2px;">Daily Task</div>
          </div>
          <div style="display: flex; align-items: center; gap: 10px; flex-shrink: 0;">
            <div style="font-weight: 800; font-size: 16px; color: var(--yellow); font-family: var(--font-mono);">+${task.points}</div>
            <button class="${canClaim && !isClaimed ? "btn-primary" : "btn-secondary"}"
              style="padding: 8px 14px; font-size: 11px;"
              onclick="claimTask('${task.id}')"
              ${isClaimed || !canClaim ? "disabled" : ""}>
              ${isClaimed ? "✓ Claimed" : "Claim"}
            </button>
          </div>
        </div>
        ${canClaim && !isClaimed ? "" : `<div style="margin-top: 8px; font-size: 11px; color: var(--text3);">
          ${isClaimed ? "Completed today" : getTaskRequirementText(task)}
        </div>`}
      </div>
    `;
  }).join("");
}

function checkTaskEligible(task) {
  switch (task.check) {
    case "login":
      return true; // Always eligible if they're on the page
    case "trade":
      // Check if user made a trade today via transactions
      return true; // Simplified - would check transactions collection
    case "markets":
      return marketsCheckedToday >= 3;
    case "invite":
      return referralStats.total >= 1;
    default:
      return false;
  }
}

function getTaskRequirementText(task) {
  switch (task.check) {
    case "trade": return "Make at least one trade today";
    case "markets": return `Visit markets page ${3 - marketsCheckedToday} more time(s)`;
    case "invite": return "Invite at least 1 friend";
    default: return "";
  }
}

async function claimTask(taskId) {
  const task = DAILY_TASKS.find(t => t.id === taskId);
  if (!task) return;

  const canClaim = checkTaskEligible(task);
  const isClaimed = tasksState[taskId] === true;
  if (!canClaim || isClaimed) return;

  tasksState[taskId] = true;

  // Update points
  rewardPoints += task.points;

  const btn = document.querySelector(`[onclick="claimTask('${taskId}')"]`);
  if (btn) {
    btn.disabled = true;
    btn.textContent = "✓ Claimed";
    btn.className = "btn-secondary";
  }

  // Save to Firestore
  await db.collection("users").doc(currentUid).update({
    rewardPoints: firebase.firestore.FieldValue.increment(task.points),
    dailyTasks: tasksState,
  });

  logTransaction(currentUid, "reward_claim", "POINTS", task.points, "POINTS", `Rewards: ${task.label}`);
  showToast(`Claimed ${task.points} points!`, "success");
  renderPoints();
  renderTasks();
}

function openRedeemModal() {
  const modal = document.getElementById("redeem-modal");
  renderRedeemOptions();
  modal.style.display = "flex";
}

function closeRedeemModal() {
  document.getElementById("redeem-modal").style.display = "none";
}

function renderRedeemOptions() {
  const container = document.getElementById("redeem-options");
  const options = [
    { points: 500, usdt: 5, label: "$5 USDT" },
    { points: 2000, usdt: 25, label: "$25 USDT" },
    { points: 5000, usdt: 75, label: "$75 USDT" },
  ];

  container.innerHTML = options.map(opt => `
    <div class="card" style="padding: 16px; margin-bottom: 12px;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
        <div>
          <div style="font-weight: 800; font-size: 16px;">${opt.label}</div>
          <div style="font-size: 12px; color: var(--text3);">${opt.points} points</div>
        </div>
      </div>
      <button class="btn-primary" style="width: 100%; padding: 12px;"
        onclick="redeemPoints(${opt.points}, ${opt.usdt})"
        ${rewardPoints < opt.points ? "disabled" : ""}>
        ${rewardPoints < opt.points ? "Insufficient points" : "Redeem"}
      </button>
    </div>
  `).join("");
}

async function redeemPoints(pointsCost, usdtAmount) {
  if (rewardPoints < pointsCost) {
    showToast("Insufficient points", "error");
    return;
  }

  const btn = event.target;
  btn.disabled = true;
  btn.textContent = "Redeeming...";

  try {
    // Deduct points
    await db.collection("users").doc(currentUid).update({
      rewardPoints: firebase.firestore.FieldValue.increment(-pointsCost),
    });

    // Credit USDT
    await db.collection("wallets").doc(currentUid).update({
      USDT: firebase.firestore.FieldValue.increment(usdtAmount),
    });

    logTransaction(currentUid, "reward_redeem", "USDT", usdtAmount, "USDT", `Redeemed ${pointsCost} points for $${usdtAmount} USDT`);
    showToast(`Redeemed ${pointsCost} points for $${usdtAmount} USDT!`, "success");
    rewardPoints -= pointsCost;
    renderPoints();
    closeRedeemModal();
  } catch (err) {
    showToast(err.message, "error");
  } finally {
    btn.disabled = false;
    btn.textContent = "Redeem";
  }
}

function renderReferral() {
  document.getElementById("referral-link").value = referralLink;
  // Referral stats
  // These would be populated from loadReferralStats
  // For now, placeholder elements don't exist in the HTML
}

function copyReferralLink() {
  navigator.clipboard.writeText(referralLink)
    .then(() => showToast("Referral link copied!", "success"))
    .catch(() => {
      const el = document.createElement("textarea");
      el.value = referralLink;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      showToast("Referral link copied!", "success");
    });
}

function shareVia(platform) {
  const text = "Join me on Kripex — buy and sell crypto P2P instantly! Use my referral link:";
  const url = encodeURIComponent(referralLink);
  const msg = encodeURIComponent(text + " " + referralLink);

  if (platform === "whatsapp") window.open("https://wa.me/?text=" + msg, "_blank");
  else if (platform === "telegram") window.open("https://t.me/share/url?url=" + url + "&text=" + encodeURIComponent(text), "_blank");
  else if (platform === "twitter") window.open("https://twitter.com/intent/tweet?text=" + msg, "_blank");
  else if (platform === "native") {
    if (navigator.share) navigator.share({ title: "Join Kripex", text, url: referralLink }).catch(() => {});
    else copyReferralLink();
  }
}

function initRewardsCenter() {
  // Track markets page visit
  if (window.location.pathname.includes("markets.html")) {
    trackMarketVisit();
  }

  // Auto-complete login task
  if (!tasksState.login) {
    tasksState.login = true;
  }
}

function trackMarketVisit() {
  // Called from markets.js to increment counter
  db.collection("wallets").doc(currentUid).update({
    marketsCheckedToday: firebase.firestore.FieldValue.increment(1),
  }).catch(() => {});
}