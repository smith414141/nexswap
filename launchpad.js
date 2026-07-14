// launchpad.js
const LAUNCHPAD_TOKENS = [
  {
    symbol: "NNAI",
    name: "NeuralNet AI",
    category: "AI",
    description: "Decentralized AI compute network for training large language models",
    status: "active",
    tokenPrice: 0.025,
    totalRaise: 500000,
    totalSupply: "100M",
    endsIn: "2 days",
    progress: 68,
    icon: "🧠",
  },
  {
    symbol: "GAME",
    name: "GameFi Protocol",
    category: "Gaming",
    description: "Cross-chain gaming infrastructure with unified asset ownership",
    status: "active",
    tokenPrice: 0.012,
    totalRaise: 300000,
    totalSupply: "500M",
    endsIn: "5 days",
    progress: 42,
    icon: "🎮",
  },
  {
    symbol: "DEFI",
    name: "DeFi Nexus",
    category: "DeFi",
    description: "Aggregated yield optimizer across major DeFi protocols",
    status: "active",
    tokenPrice: 0.05,
    totalRaise: 800000,
    totalSupply: "200M",
    endsIn: "1 day",
    progress: 91,
    icon: "🏦",
  },
  {
    symbol: "INFRA",
    name: "Infrastructure Labs",
    category: "Infrastructure",
    description: "Modular blockchain infrastructure for scalable dApps",
    status: "upcoming",
    tokenPrice: 0.03,
    totalRaise: 400000,
    totalSupply: "150M",
    endsIn: "Starts in 3 days",
    progress: 0,
    icon: "🔧",
  },
  {
    symbol: "DATA",
    name: "DataLayer",
    category: "AI",
    description: "Decentralized data marketplace for AI training datasets",
    status: "upcoming",
    tokenPrice: 0.018,
    totalRaise: 250000,
    totalSupply: "300M",
    endsIn: "Starts in 1 week",
    progress: 0,
    icon: "📊",
  },
  {
    symbol: "META",
    name: "MetaVerse Chain",
    category: "Gaming",
    description: "Interoperable metaverse infrastructure with cross-world assets",
    status: "upcoming",
    tokenPrice: 0.022,
    totalRaise: 600000,
    totalSupply: "400M",
    endsIn: "Starts in 5 days",
    progress: 0,
    icon: "🌐",
  },
  {
    symbol: "ORAI",
    name: "Oracle AI",
    category: "AI",
    description: "Decentralized oracle network for AI model verification",
    status: "completed",
    tokenPrice: 0.04,
    totalRaise: 1000000,
    totalSupply: "100M",
    endsIn: "Completed",
    progress: 100,
    icon: "🔮",
  },
  {
    symbol: "CHAIN",
    name: "ChainLink Labs",
    category: "Infrastructure",
    description: "Cross-chain interoperability protocol for DeFi",
    status: "completed",
    tokenPrice: 0.015,
    totalRaise: 750000,
    totalSupply: "500M",
    endsIn: "Completed",
    progress: 100,
    icon: "🔗",
  },
];

let currentTab = "active";
let launchpadAllocations = {};
let userWallet = {};

document.addEventListener("DOMContentLoaded", () => {
  gateFeatureByRegion({
    allowed: ["global"],
    featureName: "Launchpad",
    contentId: "feature-content",
    gateId: "region-gate",
  });
  initLaunchpad();
});

function initLaunchpad() {
  auth.onAuthStateChanged((user) => {
    if (!user || !user.emailVerified) return;
    loadUserData(user.uid);
  });
}

async function loadUserData(uid) {
  try {
    const [walletDoc, allocDoc] = await Promise.all([
      db.collection("wallets").doc(uid).get(),
      db.collection("wallets").doc(uid).collection("launchpadAllocations").get(),
    ]);

    userWallet = walletDoc.data() || {};
    launchpadAllocations = {};
    allocDoc.forEach((doc) => {
      launchpadAllocations[doc.id] = doc.data().amount || 0;
    });

    renderAllTabs();
    updateHeaderStats();
  } catch (err) {
    console.error("Failed to load user data:", err);
    renderAllTabs();
    updateHeaderStats();
  }
}

function updateHeaderStats() {
  let totalRaised = 0;
  LAUNCHPAD_TOKENS.forEach((t) => {
    if (t.status === "active" || t.status === "completed") {
      totalRaised += t.totalRaise * (t.progress / 100);
    }
  });

  let userTotalAlloc = 0;
  Object.values(launchpadAllocations).forEach((amt) => {
    userTotalAlloc += amt;
  });

  document.getElementById("total-raised").textContent = formatCompactUSD(totalRaised);
  document.getElementById("user-allocation-total").textContent = formatCompactUSD(userTotalAlloc);
}

function formatCompactUSD(num) {
  if (num >= 1000000) return "$" + (num / 1000000).toFixed(1) + "M";
  if (num >= 1000) return "$" + (num / 1000).toFixed(1) + "K";
  return "$" + num.toLocaleString();
}

function switchLaunchpadTab(tab, btn) {
  currentTab = tab;
  document.querySelectorAll(".tabs .tab").forEach((t) => t.classList.remove("active"));
  btn.classList.add("active");
  document.querySelectorAll(".tab-content").forEach((c) => c.classList.remove("active"));
  document.getElementById("launchpad-" + tab).classList.add("active");
}

function renderAllTabs() {
  renderGrid("active");
  renderGrid("upcoming");
  renderGrid("completed");
}

function renderGrid(status) {
  const tokens = LAUNCHPAD_TOKENS.filter((t) => t.status === status);
  const grid = document.getElementById("grid-" + status);
  grid.innerHTML = tokens.map((t) => renderCard(t)).join("");
}

function renderCard(t) {
  const userAlloc = launchpadAllocations[t.symbol] || 0;
  const progressColor = t.status === "completed" ? "var(--green)" : "var(--yellow)";
  const badgeClass = t.status === "active" ? "badge-green" : "badge-grey";
  const badgeText = t.status === "active" ? "Live" : t.status === "upcoming" ? "Soon" : "Done";

  let buttonHtml = "";
  if (t.status === "active") {
    buttonHtml = `<button class="btn-primary" style="width:100%; padding:12px; font-size:13px;" onclick="openCommitModal('${t.symbol}')">Commit USDT →</button>`;
  } else if (t.status === "upcoming") {
    buttonHtml = `<button class="btn-secondary" style="width:100%; padding:12px; font-size:13px; background: var(--blue); border-color: var(--blue); color: #fff;" onclick="setReminder('${t.symbol}')">Set Reminder →</button>`;
  } else {
    buttonHtml = `<button class="btn-secondary" style="width:100%; padding:12px; font-size:13px; opacity:0.5; cursor:not-allowed;" disabled>Sale Ended</button>`;
  }

  return `
    <div class="card" style="margin-bottom: 16px;">
      <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom: 8px;">
        <div style="flex:1; min-width:0;">
<div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap; margin-bottom:4px;">
              <span style="font-size:20px;">${t.icon}</span>
              <div style="font-weight:800; font-size:16px; color:var(--text);">${t.name}</div>
              <span class="badge badge-grey" style="font-size:10px; padding:2px 8px;">${t.category}</span>
            </div>
          <div style="font-size:12px; color:var(--text2); font-family:var(--font-mono);">$${t.symbol}</div>
        </div>
        <div class="badge ${badgeClass}" style="font-size:11px; white-space:nowrap; display:flex; align-items:center; gap:4px;">
          ${t.status === "active" ? '<span class="online-dot online" style="width:6px; height:6px; border-radius:50%; background:var(--green); display:inline-block;"></span>' : ""}${badgeText}
        </div>
      </div>
      <p style="font-size:12px; color:var(--text2); margin-bottom:12px; line-height:1.5;">${t.description}</p>
      <div style="display:grid; grid-template-columns:repeat(2,1fr); gap:12px; margin-bottom:12px;">
        <div>
          <div style="font-size:10px; font-weight:700; color:var(--text3); text-transform:uppercase; letter-spacing:0.04em; margin-bottom:4px;">Token Price</div>
          <div style="font-weight:700; font-size:14px; font-family:var(--font-mono);">$${t.tokenPrice.toFixed(4)}</div>
        </div>
        <div>
          <div style="font-size:10px; font-weight:700; color:var(--text3); text-transform:uppercase; letter-spacing:0.04em; margin-bottom:4px;">Total Raise</div>
          <div style="font-weight:700; font-size:14px; font-family:var(--font-mono);">$${(t.totalRaise / 1000).toFixed(0)}K</div>
        </div>
        <div>
          <div style="font-size:10px; font-weight:700; color:var(--text3); text-transform:uppercase; letter-spacing:0.04em; margin-bottom:4px;">Total Supply</div>
          <div style="font-weight:700; font-size:14px; font-family:var(--font-mono);">${t.totalSupply}</div>
        </div>
        <div>
          <div style="font-size:10px; font-weight:700; color:var(--text3); text-transform:uppercase; letter-spacing:0.04em; margin-bottom:4px;">${t.status === "completed" ? "Completed" : "Ends In"}</div>
          <div style="font-weight:700; font-size:14px; font-family:var(--font-mono); color:${t.status === "completed" ? "var(--text2)" : "var(--text)"};">${t.endsIn}</div>
        </div>
      </div>
      <div style="position:relative; height:6px; background:var(--bg3); border-radius:4px; overflow:hidden; margin-bottom:12px;">
        <div style="height:100%; width:${t.progress}%; background:${progressColor}; border-radius:4px; transition:width 0.3s ease;"></div>
        <div style="position:absolute; top:-18px; right:0; font-size:10px; font-weight:700; color:var(--text2); font-family:var(--font-mono);">${t.progress}%</div>
      </div>
      <div style="font-size:13px; font-weight:700; color:var(--yellow); margin-bottom:12px; display:flex; align-items:center; gap:6px;">
        <span>👤</span> Your allocation: <strong style="color:var(--yellow);">$${userAlloc.toLocaleString()}</strong>
      </div>
      ${buttonHtml}
    </div>
  `;
}

function setReminder(symbol) {
  const token = LAUNCHPAD_TOKENS.find((t) => t.symbol === symbol);
  if (token) {
    showToast("Reminder set for " + token.name, "success");
  }
}

function openCommitModal(symbol) {
  const token = LAUNCHPAD_TOKENS.find((t) => t.symbol === symbol);
  if (!token) return;

  const userAlloc = launchpadAllocations[symbol] || 0;

  document.getElementById("commit-modal-title").textContent = "Commit to " + token.name;
  document.getElementById("commit-summary").innerHTML = `
    <div style="display:grid; grid-template-columns:repeat(2,1fr); gap:12px; margin-bottom:8px;">
      <div><div style="font-size:11px; color:var(--text3);">Token Price</div><div style="font-weight:700; font-family:var(--font-mono);">$${token.tokenPrice.toFixed(4)}</div></div>
      <div><div style="font-size:11px; color:var(--text3);">Your Allocation</div><div style="font-weight:700; font-family:var(--font-mono); color:var(--yellow);">$${userAlloc.toLocaleString()}</div></div>
      <div><div style="font-size:11px; color:var(--text3);">Ends In</div><div style="font-weight:700; font-family:var(--font-mono);">${token.endsIn}</div></div>
      <div><div style="font-size:11px; color:var(--text3);">Progress</div><div style="font-weight:700; font-family:var(--font-mono);">${token.progress}%</div></div>
    </div>
  `;
  document.getElementById("commit-amount").value = "";
  document.getElementById("commit-amount").dataset.symbol = symbol;
  document.getElementById("commit-modal").style.display = "flex";
}

function closeCommitModal() {
  document.getElementById("commit-modal").style.display = "none";
}

function confirmCommit() {
  const input = document.getElementById("commit-amount");
  const amount = parseFloat(input.value);
  const symbol = input.dataset.symbol;
  const user = auth.currentUser;

  if (!user) return;
  if (!amount || amount <= 0) {
    showToast("Enter an amount", "error");
    return;
  }

  const token = LAUNCHPAD_TOKENS.find((t) => t.symbol === symbol);
  if (!token) return;

  const usdtBalance = userWallet.USDT || 0;
  if (amount > usdtBalance) {
    showToast("Insufficient USDT balance", "error");
    return;
  }

  const btn = document.getElementById("commit-btn");
  btn.disabled = true;
  btn.textContent = "Committing...";

  db.collection("wallets")
    .doc(user.uid)
    .update({
      USDT: firebase.firestore.FieldValue.increment(-amount),
    })
    .then(() => {
      const allocRef = db.collection("wallets").doc(user.uid).collection("launchpadAllocations").doc(symbol);
      return allocRef.set(
        {
          amount: firebase.firestore.FieldValue.increment(amount),
          tokenPrice: token.tokenPrice,
          tokenSymbol: symbol,
          tokenName: token.name,
          committedAt: firebase.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
    })
    .then(() => {
      logTransaction(user.uid, "launchpad_commit", symbol, amount, "USDT", "Launchpad commitment to " + token.name);
      showToast(`Committed $${amount.toLocaleString()} to ${token.name}`, "success");
      closeCommitModal();
      loadUserData(user.uid);
    })
    .catch((err) => {
      if (err.message !== "insufficient") console.error(err);
    })
    .finally(() => {
      btn.disabled = false;
      btn.textContent = "Confirm Commitment →";
    });
}