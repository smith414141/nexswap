// megadrop.js
const MEGADROP_END = new Date();
MEGADROP_END.setDate(MEGADROP_END.getDate() + 14); // rolling 14-day window

const TASKS = [
  { id: "trade1", label: "Complete 1 spot trade", reward: 0.05 },
  { id: "deposit1", label: "Make a deposit of any size", reward: 0.05 },
  { id: "invite1", label: "Invite 1 friend", reward: 0.1 },
  { id: "hold7", label: "Hold KRPX for 7 days", reward: 0.2 },
];

let currentUid = null;

document.addEventListener("DOMContentLoaded", () => {
  updateCountdown();
  setInterval(updateCountdown, 1000);
});

auth.onAuthStateChanged((user) => {
  if (!user) return;
  currentUid = user.uid;
  db.collection("users")
    .doc(currentUid)
    .onSnapshot((doc) => {
      const done = (doc.exists && doc.data().megadropTasks) || [];
      renderTasks(done);
    });
});

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

function renderTasks(done) {
  document.getElementById("mg-tasks").innerHTML = TASKS.map((t) => {
    const isDone = done.includes(t.id);
    return `
    <div class="card" style="margin-bottom:10px;padding:14px;display:flex;justify-content:space-between;align-items:center">
      <div>
        <div style="font-weight:700">${t.label}</div>
        <div style="font-size:11px;color:var(--yellow)">+${t.reward} KRPX</div>
      </div>
      <span class="badge ${isDone ? "badge-green" : "badge-grey"}">${
      isDone ? "Done" : "Pending"
    }</span>
    </div>`;
  }).join("");
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
