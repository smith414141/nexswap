// notifications.js — real notifications, working price alert polling, no demo text

let userAlerts = [];
let pricePollingInterval = null;

auth.onAuthStateChanged((user) => {
  if (!user || !user.emailVerified) return;
  loadAlerts(user.uid);
  loadSystemNotifs();
  startPricePolling(user.uid);
});

// ── TABS ──
function switchNotifTab(tab, btn) {
  document.querySelectorAll(".tabs .tab").forEach(t => t.classList.remove("active"));
  btn.classList.add("active");
  if (tab === "all") loadSystemNotifs();
  else if (tab === "alerts") renderAlerts();
  else if (tab === "system") loadSystemNotifs();
}

// ── SYSTEM NOTIFICATIONS ──
function loadSystemNotifs() {
  const container = document.getElementById("notif-list");
  container.innerHTML = '<div class="empty-state">Loading...</div>';

  Promise.all([
    db.collection("announcements").orderBy("createdAt", "desc").limit(10).get(),
    db.collection("directMessages").where("userId", "==", auth.currentUser?.uid).orderBy("createdAt", "desc").get()
  ]).then(([annSnap, dmSnap]) => {
    const items = [];
    annSnap.forEach(doc => items.push({ ...doc.data(), id: doc.id, isDirect: false }));
    dmSnap.forEach(doc => items.push({ ...doc.data(), id: doc.id, isDirect: true }));
    items.sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));

    if (!items.length) { container.innerHTML = '<div class="empty-state">No notifications yet.</div>'; return; }

    container.innerHTML = items.map(a => `
      <div class="card" style="margin-bottom:8px;${!a.read && a.isDirect ? "border-left:3px solid var(--yellow);" : ""}">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
          <span style="font-weight:700;font-size:14px;">${a.title || "Notification"}</span>
          <span class="badge badge-${a.isDirect ? "yellow" : a.type === "warning" ? "yellow" : a.type === "success" ? "green" : "grey"}">${a.isDirect ? "Personal" : a.type || "info"}</span>
        </div>
        <p style="font-size:13px;color:var(--text2);line-height:1.5;margin-bottom:4px;">${a.body || ""}</p>
        <p style="font-size:10px;color:var(--text3);">${a.createdAt?.toDate?.()?.toLocaleString() || "--"}</p>
      </div>`).join("");
  }).catch(() => {
    container.innerHTML = '<div class="empty-state">Unable to load notifications.</div>';
  });
}

// ── PRICE ALERTS ──
function loadAlerts(uid) {
  db.collection("priceAlerts").where("userId", "==", uid).get().then(snap => {
    userAlerts = [];
    snap.forEach(doc => userAlerts.push({ id: doc.id, ...doc.data() }));
    renderAlerts();
  });
}

function renderAlerts() {
  const container = document.getElementById("active-alerts");
  if (!userAlerts.length) {
    container.innerHTML = '<div class="empty-state">No active alerts. Set one below.</div>';
    return;
  }
  container.innerHTML = userAlerts.map(a => `
    <div class="card" style="margin-bottom:8px;display:flex;justify-content:space-between;align-items:center;">
      <div>
        <span style="font-weight:700;">${a.coin}</span>
        <span style="color:var(--text2);font-size:13px;margin-left:6px;">${a.condition === "above" ? "▲ Above" : "▼ Below"} $${a.price.toLocaleString()}</span>
      </div>
      <button onclick="deleteAlert('${a.id}')" style="background:none;border:none;color:var(--red);cursor:pointer;font-size:16px;">✕</button>
    </div>`).join("");
}

function createPriceAlert() {
  const user = auth.currentUser;
  if (!user) { showToast("Login required", "error"); return; }
  const coin = document.getElementById("alert-coin").value;
  const condition = document.getElementById("alert-condition").value;
  const price = parseFloat(document.getElementById("alert-price").value);
  if (!price || price <= 0) { showToast("Enter a valid price", "error"); return; }

  db.collection("priceAlerts").add({
    userId: user.uid, coin, condition, price, triggered: false,
    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
  }).then(() => {
    showToast("Alert set!", "success");
    document.getElementById("alert-price").value = "";
    loadAlerts(user.uid);
  }).catch(err => showToast(err.message, "error"));
}

function deleteAlert(id) {
  db.collection("priceAlerts").doc(id).delete().then(() => {
    showToast("Alert removed", "info");
    userAlerts = userAlerts.filter(a => a.id !== id);
    renderAlerts();
  });
}

// ── PRICE POLLING — checks alerts every 60s against live CoinGecko prices ──
const ALERT_GECKO_MAP = { BTC: "bitcoin", ETH: "ethereum", SOL: "solana", BNB: "binancecoin", XRP: "ripple", DOGE: "dogecoin", ADA: "cardano", MATIC: "matic-network", LINK: "chainlink" };

function startPricePolling(uid) {
  if (pricePollingInterval) clearInterval(pricePollingInterval);
  checkAlerts(uid);
  pricePollingInterval = setInterval(() => checkAlerts(uid), 60000);
}

function checkAlerts(uid) {
  const activeAlerts = userAlerts.filter(a => !a.triggered);
  if (!activeAlerts.length) return;

  const coinIds = [...new Set(activeAlerts.map(a => ALERT_GECKO_MAP[a.coin]).filter(Boolean))].join(",");
  if (!coinIds) return;

  fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${coinIds}&vs_currencies=usd`)
    .then(r => r.json())
    .then(prices => {
      const reverseMap = Object.fromEntries(Object.entries(ALERT_GECKO_MAP).map(([sym, id]) => [id, sym]));
      activeAlerts.forEach(alert => {
        const geckoId = ALERT_GECKO_MAP[alert.coin];
        if (!geckoId || !prices[geckoId]) return;
        const livePrice = prices[geckoId].usd;
        const triggered = alert.condition === "above" ? livePrice >= alert.price : livePrice <= alert.price;
        if (!triggered) return;

        // Mark as triggered in Firestore
        db.collection("priceAlerts").doc(alert.id).update({ triggered: true });
        alert.triggered = true;

        // In-app notification
        showToast(`🔔 ${alert.coin} is ${alert.condition} $${alert.price.toLocaleString()}! Now at $${livePrice.toLocaleString()}`, "info");

        // Store in notifications collection for history
        db.collection("announcements").add({
          title: `Price Alert: ${alert.coin}`,
          body: `${alert.coin} has gone ${alert.condition} your target of $${alert.price.toLocaleString()}. Current price: $${livePrice.toLocaleString()}`,
          type: "info",
          createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        }).catch(() => {});
      });
      renderAlerts();
    }).catch(() => {});
}
