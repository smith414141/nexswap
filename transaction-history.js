// transaction-history.js
let allTx = [];

auth.onAuthStateChanged((user) => {
  if (!user) return;
  db.collection("transactions")
    .where("userId", "==", user.uid)
    .orderBy("createdAt", "desc")
    .onSnapshot(
      (snap) => {
        allTx = snap.docs.map((d) => d.data());
        renderTx("all");
      },
      () => {
        document.getElementById("th-list").innerHTML =
          '<div class="empty-state">Could not load transaction history.</div>';
      }
    );
});

function renderTx(filter) {
  const list = document.getElementById("th-list");
  const empty = document.getElementById("th-empty");
  const rows =
    filter === "all"
      ? allTx
      : allTx.filter((t) => (t.type || "").includes(filter));

  if (rows.length === 0) {
    list.innerHTML = "";
    empty.style.display = "block";
    return;
  }
  empty.style.display = "none";
  list.innerHTML = rows
    .map((t) => {
      const date = t.createdAt?.toDate?.()?.toLocaleString() || "--";
      const statusClass =
        t.status === "completed"
          ? "badge-green"
          : t.status === "pending"
          ? "badge-yellow"
          : "badge-grey";
      return `
      <div class="card" style="margin-bottom:10px;padding:14px">
        <div style="display:flex;justify-content:space-between;align-items:center">
          <strong style="text-transform:capitalize">${t.type || "Transaction"}</strong>
          <span class="badge ${statusClass}">${t.status || "--"}</span>
        </div>
        <div style="font-size:13px;margin-top:6px">${t.amount || ""} ${
        t.crypto || t.toCoin || ""
      }</div>
        <div style="font-size:11px;color:var(--text3);margin-top:4px">${date}</div>
      </div>`;
    })
    .join("");
}

function filterTx(type, btn) {
  document
    .querySelectorAll("#th-tabs .fh-tab")
    .forEach((t) => t.classList.remove("active"));
  btn.classList.add("active");
  renderTx(type);
}
