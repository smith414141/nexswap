// notifications.js
let userAlerts = [];

auth.onAuthStateChanged((user) => {
  if (!user) return;
  loadAlerts(user.uid);
  loadSystemNotifs();
});

function loadAlerts(uid) {
  db.collection("priceAlerts")
    .where("userId", "==", uid)
    .get()
    .then((snap) => {
      userAlerts = [];
      snap.forEach((doc) => userAlerts.push({ id: doc.id, ...doc.data() }));
      renderAlerts();
    });
}

function renderAlerts() {
  const container = document.getElementById("active-alerts");
  if (!userAlerts.length) {
    container.innerHTML = '<div class="empty-state">No active alerts</div>';
    return;
  }
  container.innerHTML = userAlerts
    .map(
      (a) => `
        <div class="card" style="margin-bottom:8px;display:flex;justify-content:space-between;align-items:center;">
            <span>${a.coin} ${a.condition} $${a.price}</span>
            <button onclick="deleteAlert('${a.id}')" style="background:none;border:none;color:var(--red);cursor:pointer;">✕</button>
        </div>
    `
    )
    .join("");
}

function createPriceAlert() {
  const user = auth.currentUser;
  if (!user) {
    showToast("Login required", "error");
    return;
  }
  const coin = document.getElementById("alert-coin").value;
  const condition = document.getElementById("alert-condition").value;
  const price = parseFloat(document.getElementById("alert-price").value);
  if (!price || price <= 0) {
    showToast("Enter a valid price", "error");
    return;
  }
  db.collection("priceAlerts")
    .add({
      userId: user.uid,
      coin,
      condition,
      price,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    })
    .then(() => {
      showToast("Alert set!", "success");
      loadAlerts(user.uid);
    })
    .catch((err) => showToast(err.message, "error"));
}

function deleteAlert(id) {
  db.collection("priceAlerts")
    .doc(id)
    .delete()
    .then(() => {
      showToast("Alert removed", "info");
      loadAlerts(auth.currentUser.uid);
    });
}

function loadSystemNotifs() {
  const container = document.getElementById("notif-list");
  // Simulate system notifications from Firestore 'announcements'
  db.collection("announcements")
    .orderBy("createdAt", "desc")
    .limit(5)
    .get()
    .then((snap) => {
      if (snap.empty) {
        container.innerHTML =
          '<div class="empty-state">No notifications.</div>';
        return;
      }
      container.innerHTML = snap.docs
        .map((doc) => {
          const a = doc.data();
          return `<div class="card" style="margin-bottom:8px;">
                <div style="font-weight:700;">${a.title}</div>
                <div style="font-size:13px;color:var(--text2);">${a.body}</div>
                <div style="font-size:10px;color:var(--text3);margin-top:4px;">${
                  a.createdAt?.toDate?.()?.toLocaleString() || "Just now"
                }</div>
            </div>`;
        })
        .join("");
    });
}

function switchNotifTab(tab, btn) {
  document
    .querySelectorAll(".tabs .tab")
    .forEach((t) => t.classList.remove("active"));
  btn.classList.add("active");
  // Simple filter logic (we just show all in 'all')
  document.getElementById("notif-list").innerHTML =
    '<div class="empty-state">No notifications match this filter.</div>';
  loadSystemNotifs(); // Reload all for now
}
