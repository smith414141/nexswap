// charity.js
const CAUSES = [
  { 
    name: "Clean Water Fund", 
    icon: "💧", 
    desc: "Bringing clean water to communities in need",
    goal: 25000,
    impactPerDollar: "Your $25 provides clean water access for 1 family for a month",
    id: "clean-water",
    color: "#3B82F6", // blue
    colorLight: "#DBEAFE",
    tag: "Water"
  },
  { 
    name: "Disaster Relief", 
    icon: "🏠", 
    desc: "Emergency aid for natural disaster survivors",
    goal: 50000,
    impactPerDollar: "Your $50 provides emergency shelter for 1 displaced family",
    id: "disaster-relief",
    color: "#F97316", // orange
    colorLight: "#FFEDD5",
    tag: "Relief"
  },
  { 
    name: "Education for All", 
    icon: "📚", 
    desc: "School supplies and scholarships for children",
    goal: 30000,
    impactPerDollar: "Your $20 provides school supplies for 2 children for a semester",
    id: "education",
    color: "#10B981", // green
    colorLight: "#D1FAE5",
    tag: "Education"
  },
  { 
    name: "Wildlife Conservation", 
    icon: "🐘", 
    desc: "Protecting endangered species and habitats",
    goal: 40000,
    impactPerDollar: "Your $30 protects 1 acre of critical wildlife habitat",
    id: "wildlife",
    color: "#06B6D4", // teal/cyan
    colorLight: "#CFFAFE",
    tag: "Wildlife"
  },
];

// Helper to darken a hex color for gradient end
function adjustBrightness(hex, percent) {
  const num = parseInt(hex.replace("#", ""), 16);
  const amt = Math.round(2.55 * percent);
  const R = Math.max(0, Math.min(255, (num >> 16) + amt));
  const G = Math.max(0, Math.min(255, ((num >> 8) & 0x00FF) + amt));
  const B = Math.max(0, Math.min(255, (num & 0x0000FF) + amt));
  return "#" + (0x1000000 + (R << 16) + (G << 8) + B).toString(16).slice(1);
}

let currentUid = null;
let userWallet = {};
let selectedCause = null;
let causesRaised = {};
let userDonations = [];
let allDonationsSnapshot = null;

document.addEventListener("DOMContentLoaded", () => {
  auth.onAuthStateChanged((user) => {
    if (!user || !user.emailVerified) return;
    currentUid = user.uid;
    initCharity();
  });
});

async function initCharity() {
  await loadUserData();
  listenDonations();
  listenUserDonations();
  renderCauses();
}

async function loadUserData() {
  const walletDoc = await db.collection("wallets").doc(currentUid).get();
  if (walletDoc.exists) {
    userWallet = walletDoc.data();
  }
}

function listenDonations() {
  db.collection("donations")
    .orderBy("createdAt", "desc")
    .onSnapshot((snap) => {
      allDonationsSnapshot = snap;
      updateCausesRaised(snap);
      renderCauses();
      updateStats(snap);
      renderLeaderboard(snap);
    });
}

function listenUserDonations() {
  db.collection("donations")
    .where("userId", "==", currentUid)
    .onSnapshot((snap) => {
      userDonations = snap.docs.map(d => d.data());
    });
}

function updateCausesRaised(snap) {
  causesRaised = {};
  snap.docs.forEach(doc => {
    const d = doc.data();
    causesRaised[d.cause] = (causesRaised[d.cause] || 0) + d.amount;
  });
}

function renderCauses() {
  const container = document.getElementById("ch-list");
  container.innerHTML = CAUSES.map(cause => {
    const raised = causesRaised[cause.name] || 0;
    const pct = Math.min(100, (raised / cause.goal) * 100);
    const color = cause.color;
    const colorLight = cause.colorLight;
    const gradient = `linear-gradient(90deg, ${color}, ${adjustBrightness(color, -20)})`;
    return `
      <div class="card cause-card" style="--cause-color: ${color}; --cause-color-light: ${colorLight}; --cause-color-start: ${color}; --cause-color-end: ${adjustBrightness(color, -20)}; margin-bottom: 16px; padding: 20px;">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 10px; flex-wrap: wrap; margin-bottom: 12px;">
          <div style="display: flex; gap: 12px; align-items: center;">
            <div class="cause-icon-badge">${cause.icon}</div>
            <div>
              <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
                <div style="font-weight: 800; font-size: 16px;">${cause.name}</div>
                <span class="cause-tag">${cause.tag}</span>
              </div>
              <div style="font-size: 12px; color: var(--text2); max-width: 280px;">${cause.desc}</div>
            </div>
          </div>
          
          <!-- Progress Bar -->
          <div style="margin-bottom: 12px;">
            <div class="cause-progress-row">
              <span class="cause-progress-label">$${raised.toLocaleString()} / $${cause.goal.toLocaleString()} raised</span>
              <span class="cause-progress-pct">${pct.toFixed(1)}%</span>
            </div>
            <div class="cause-progress-bar">
              <div class="cause-progress-fill" style="width: ${pct}%;"></div>
            </div>
          </div>
          
          <button class="btn-primary" style="width: 100%; padding: 12px;" onclick="openDonateModal('${cause.id}')">
            Donate Now
          </button>
        </div>
    `;
  }).join("");
}

function updateStats(snap) {
  // Total donated across all users
  let totalDonated = 0;
  snap.docs.forEach(doc => {
    totalDonated += doc.data().amount || 0;
  });

  // Your total given
  let yourTotal = 0;
  let causesSet = new Set();
  userDonations.forEach(d => {
    yourTotal += d.amount || 0;
    causesSet.add(d.cause);
  });

  document.getElementById("stat-total-donated").textContent = `$${totalDonated.toLocaleString()}`;
  document.getElementById("stat-your-given").textContent = `$${yourTotal.toLocaleString()}`;
  document.getElementById("stat-causes-supported").textContent = causesSet.size;
}

function renderLeaderboard(snap) {
  // Filter to this month
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
  
  const donationsByUser = {};
  snap.docs.forEach(doc => {
    const d = doc.data();
    const created = d.createdAt?.toMillis ? d.createdAt.toMillis() : new Date(d.createdAt).getTime();
    if (created >= monthStart) {
      const name = d.name || `User ${d.userId?.slice(0, 6) || "unknown"}`;
      donationsByUser[d.userId] = (donationsByUser[d.userId] || 0) + (d.amount || 0);
      if (!donationsByUser[`${d.userId}_name`]) {
        donationsByUser[`${d.userId}_name`] = name;
      }
    }
  });

  const sorted = Object.entries(donationsByUser)
    .filter(([k]) => !k.endsWith("_name"))
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const list = document.getElementById("ch-leaderboard-list");
  if (sorted.length === 0) {
    list.innerHTML = '<div style="text-align:center;color:var(--text3);font-size:12px;">No donations this month yet.</div>';
    return;
  }

  list.innerHTML = sorted.map(([uid, amount], i) => {
    const name = donationsByUser[`${uid}_name`] || `User ${uid.slice(0, 6)}`;
    return `
      <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid var(--border);">
        <div style="display:flex;align-items:center;gap:8px;">
          <span style="font-weight:800;color:var(--text3);min-width:24px;">#${i + 1}</span>
          <span style="font-weight:600;">${name}</span>
        </div>
        <div style="font-weight:800;color:var(--yellow);font-family:var(--font-mono);">$${amount.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}</div>
      </div>`;
  }).join("");
}

function openDonateModal(causeId) {
  const cause = CAUSES.find(c => c.id === causeId);
  if (!cause) return;

  selectedCause = cause;
  document.getElementById("donate-modal-title").textContent = `Donate to ${cause.name}`;
  document.getElementById("donate-amount").value = "";
  document.getElementById("donate-error").style.display = "none";
  document.getElementById("donate-confirm-btn").disabled = false;
  document.getElementById("donate-confirm-btn").textContent = "Confirm Donation";
  document.getElementById("donate-modal").style.display = "flex";
}

function closeDonateModal() {
  document.getElementById("donate-modal").style.display = "none";
  selectedCause = null;
}

function setDonateAmount(amount) {
  document.getElementById("donate-amount").value = amount;
}

async function confirmDonation() {
  if (!selectedCause) return;

  const amount = parseFloat(document.getElementById("donate-amount").value);
  if (!amount || amount <= 0) {
    showToast("Enter a valid amount", "error");
    return;
  }

  const usdtBalance = userWallet.USDT || 0;
  if (amount > usdtBalance) {
    const errorDiv = document.getElementById("donate-error");
    errorDiv.textContent = `Insufficient USDT balance (have $${usdtBalance.toLocaleString()})`;
    errorDiv.style.display = "block";
    return;
  }

  const btn = document.getElementById("donate-confirm-btn");
  btn.disabled = true;
  btn.textContent = "Processing...";

  try {
    // Deduct USDT
    await db.collection("wallets").doc(currentUid).update({
      USDT: firebase.firestore.FieldValue.increment(-amount),
    });

    // Create donation record
    const donationRef = await db.collection("donations").add({
      userId: currentUid,
      cause: selectedCause.name,
      causeId: selectedCause.id,
      amount,
      name: (await auth.currentUser.getIdTokenResult()).claims?.name || auth.currentUser.displayName || "Anonymous",
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    });

    logTransaction(currentUid, "donation", "USDT", amount, "USDT", `Donated to ${selectedCause.name}`);

    closeDonateModal();

    // Show impact receipt toast
    showToast(`${selectedCause.impactPerDollar}`, "success");
    
  } catch (err) {
    showToast(err.message, "error");
  } finally {
    btn.disabled = false;
    btn.textContent = "Confirm Donation";
  }
}