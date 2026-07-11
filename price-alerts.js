// price-alerts.js
let currentUid = null;

auth.onAuthStateChanged((user) => {
  if (!user) return;
  currentUid = user.uid;
  listenAlerts();
});

function createAlert() {
  const symbol = document.getElementById("pa-symbol").value;
  const condition = document.getElementById("pa-condition").value;
  const target = parseFloat(document.getElementById("pa-target").value);

  if (!target || target <= 0) {
    showToast("Enter a valid target price", "error");
    return;
  }

  db.collection("priceAlerts")
    .add({
      userId: currentUid,
      symbol,
      condition,
      targetPrice: target,
      triggered: false,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    })
    .then(() => {
      showToast("Alert created", "success");
      document.getElementById("pa-target").value = "";
    })
    .catch((err) => showToast(err.message, "error"));
}

function listenAlerts() {
  db.collection("priceAlerts")
    .where("userId", "==", currentUid)
    .onSnapshot(
      (snap) => {
        const list = document.getElementById("pa-list");
        const empty = document.getElementById("pa-empty");
        if (snap.empty) {
          list.innerHTML = "";
          empty.style.display = "block";
          return;
        }
        empty.style.display = "none";
        list.innerHTML = snap.docs
          .map((doc) => {
            const a = doc.data();
            const arrow = a.condition === "above" ? "≥" : "≤";
            return `
          <div class="card" style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;padding:14px">
            <div>
              <div style="font-weight:700">${a.symbol} ${arrow} $${a.targetPrice}</div>
              <div style="font-size:11px;color:var(--text3)">${
                a.triggered ? "✅ Triggered" : "⏳ Watching"
              }</div>
            </div>
            <span style="cursor:pointer;color:var(--red);font-weight:700" onclick="deleteAlert('${
              doc.id
            }')">Delete</span>
          </div>`;
          })
          .join("");
      },
      () => {
        document.getElementById("pa-list").innerHTML =
          '<div class="empty-state">Could not load alerts.</div>';
      }
    );
}

function deleteAlert(id) {
  db.collection("priceAlerts")
    .doc(id)
    .delete()
    .then(() => showToast("Alert removed", "success"))
    .catch((err) => showToast(err.message, "error"));
}
