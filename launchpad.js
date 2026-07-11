// launchpad.js
const LAUNCHPAD_TOKENS = [
  { symbol: "NEXA", name: "Nexa Protocol", raise: 500000, allocPrice: 0.08, progress: 62 },
  { symbol: "GRID", name: "GridChain", raise: 250000, allocPrice: 0.02, progress: 34 },
  { symbol: "VLT", name: "Vault Finance", raise: 800000, allocPrice: 0.15, progress: 91 },
];

document.addEventListener("DOMContentLoaded", () => {
  gateFeatureByRegion({
    allowed: ["global"],
    featureName: "Launchpad",
    contentId: "feature-content",
    gateId: "region-gate",
  });
  renderLaunchpad();
});

function renderLaunchpad() {
  const list = document.getElementById("launchpad-list");
  list.innerHTML = LAUNCHPAD_TOKENS.map(
    (t, i) => `
    <div class="card">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px">
        <div>
          <div style="font-weight:800; font-size:14px">${t.symbol}</div>
          <div style="font-size:11px; color:var(--text2)">${t.name}</div>
        </div>
        <div style="text-align:right">
          <div style="font-size:13px; font-weight:700">$${t.allocPrice}</div>
          <div style="font-size:11px; color:var(--text2)">per token</div>
        </div>
      </div>
      <div style="height:6px; background:var(--bg3); border-radius:4px; overflow:hidden; margin-bottom:6px">
        <div style="height:100%; width:${t.progress}%; background:var(--yellow)"></div>
      </div>
      <div style="display:flex; justify-content:space-between; font-size:11px; color:var(--text2); margin-bottom:10px">
        <span>${t.progress}% filled</span>
        <span>Target: $${t.raise.toLocaleString()}</span>
      </div>
      <button class="btn-primary" style="width:100%; padding:8px; font-size:12px" onclick="subscribeLaunch(${i})">Subscribe</button>
    </div>`
  ).join("");
}

function subscribeLaunch(index) {
  const user = auth.currentUser;
  if (!user) return;
  const amount = parseFloat(prompt(`How much USDT to allocate to ${LAUNCHPAD_TOKENS[index].symbol}?`, "50"));
  if (!amount || amount <= 0) return;

  db.collection("wallets")
    .doc(user.uid)
    .get()
    .then((doc) => {
      const usdt = doc.data()?.USDT || 0;
      if (amount > usdt) {
        showToast("Insufficient USDT balance", "error");
        return Promise.reject("insufficient");
      }
      return db.collection("wallets").doc(user.uid).update({
        USDT: firebase.firestore.FieldValue.increment(-amount),
      });
    })
    .then(() => {
      logTransaction(user.uid, "launchpad_subscribe", LAUNCHPAD_TOKENS[index].symbol, amount, "USDT", "Launchpad subscription");
      showToast(`Subscribed $${amount} to ${LAUNCHPAD_TOKENS[index].symbol}`, "success");
    })
    .catch((err) => {
      if (err !== "insufficient") console.error(err);
    });
}
