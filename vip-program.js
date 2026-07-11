// vip-program.js
const TIERS = [
  { name: "Regular", min: 0, perks: "Standard fees" },
  { name: "VIP 1", min: 100, perks: "5% trading fee discount" },
  { name: "VIP 2", min: 500, perks: "10% fee discount + priority support" },
  { name: "VIP 3", min: 2000, perks: "20% fee discount + dedicated manager" },
];

auth.onAuthStateChanged((user) => {
  if (!user) return;
  db.collection("users")
    .doc(user.uid)
    .onSnapshot((doc) => {
      const points = (doc.exists && doc.data().activityPoints) || 0;
      let current = TIERS[0];
      let next = TIERS[1];
      for (let i = 0; i < TIERS.length; i++) {
        if (points >= TIERS[i].min) {
          current = TIERS[i];
          next = TIERS[i + 1];
        }
      }
      document.getElementById("vip-tier").textContent = current.name;
      document.getElementById("vip-progress").textContent = next
        ? `${points}/${next.min} points to ${next.name}`
        : "You've reached the highest tier";
      renderTiers(current.name);
    });
});

function renderTiers(currentName) {
  document.getElementById("vip-list").innerHTML = TIERS.map(
    (t) => `
    <div class="card" style="margin-bottom:10px;padding:14px;${
      t.name === currentName ? "border-color:var(--yellow)" : ""
    }">
      <div style="display:flex;justify-content:space-between">
        <strong>${t.name}</strong>
        ${t.name === currentName ? '<span class="badge badge-yellow">Current</span>' : ""}
      </div>
      <div style="font-size:12px;color:var(--text2);margin-top:6px">${t.perks}</div>
      <div style="font-size:11px;color:var(--text3);margin-top:4px">Requires ${t.min}+ activity points</div>
    </div>`
  ).join("");
}
