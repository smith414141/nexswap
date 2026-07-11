// sub-account.js
let currentUid = null;

auth.onAuthStateChanged((user) => {
  if (!user) return;
  currentUid = user.uid;
  db.collection("users")
    .doc(currentUid)
    .onSnapshot((doc) => {
      const subs = (doc.exists && doc.data().subAccounts) || [];
      renderSubs(subs);
    });
});

function createSubAccount() {
  const name = document.getElementById("sa-name").value.trim();
  if (!name) {
    showToast("Enter a sub-account name", "error");
    return;
  }
  const entry = { id: Date.now().toString(), name, createdAt: Date.now() };
  db.collection("users")
    .doc(currentUid)
    .set(
      { subAccounts: firebase.firestore.FieldValue.arrayUnion(entry) },
      { merge: true }
    )
    .then(() => {
      showToast("Sub-account created", "success");
      document.getElementById("sa-name").value = "";
    })
    .catch((err) => showToast(err.message, "error"));
}

function renderSubs(subs) {
  const list = document.getElementById("sa-list");
  const empty = document.getElementById("sa-empty");
  if (subs.length === 0) {
    list.innerHTML = "";
    empty.style.display = "block";
    return;
  }
  empty.style.display = "none";
  list.innerHTML = subs
    .map(
      (s) => `
    <div class="card" style="margin-bottom:10px;padding:14px;display:flex;justify-content:space-between;align-items:center">
      <div>
        <div style="font-weight:700">${s.name}</div>
        <div style="font-size:11px;color:var(--text3)">Created ${new Date(
          s.createdAt
        ).toLocaleDateString()}</div>
      </div>
      <span class="badge badge-grey">0.00 USDT</span>
    </div>`
    )
    .join("");
}
