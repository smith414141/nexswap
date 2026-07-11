// address-book.js
let currentUid = null;

auth.onAuthStateChanged((user) => {
  if (!user) return;
  currentUid = user.uid;
  listenAddresses();
});

function getDocRef() {
  return db.collection("addressBook").doc(currentUid);
}

function addAddress() {
  const coin = document.getElementById("ab-coin").value;
  const label = document.getElementById("ab-label").value.trim();
  const address = document.getElementById("ab-address").value.trim();

  if (!label || !address) {
    showToast("Fill in a label and address", "error");
    return;
  }

  const entry = { id: Date.now().toString(), coin, label, address };

  getDocRef()
    .set(
      { entries: firebase.firestore.FieldValue.arrayUnion(entry) },
      { merge: true }
    )
    .then(() => {
      showToast("Address saved", "success");
      document.getElementById("ab-label").value = "";
      document.getElementById("ab-address").value = "";
    })
    .catch((err) => showToast(err.message, "error"));
}

function listenAddresses() {
  getDocRef().onSnapshot(
    (doc) => {
      const list = document.getElementById("ab-list");
      const empty = document.getElementById("ab-empty");
      const entries = (doc.exists && doc.data().entries) || [];
      if (entries.length === 0) {
        list.innerHTML = "";
        empty.style.display = "block";
        return;
      }
      empty.style.display = "none";
      list.innerHTML = entries
        .map(
          (e) => `
        <div class="card" style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;padding:14px">
          <div>
            <div style="font-weight:700">${e.label} <span style="color:var(--text3);font-weight:500">· ${e.coin}</span></div>
            <div style="font-size:11px;color:var(--text3);word-break:break-all">${e.address}</div>
          </div>
          <span style="cursor:pointer;color:var(--red);font-weight:700;flex-shrink:0;margin-left:10px" onclick="removeAddress('${e.id}')">Delete</span>
        </div>`
        )
        .join("");
    },
    () => {
      document.getElementById("ab-list").innerHTML =
        '<div class="empty-state">Could not load addresses.</div>';
    }
  );
}

function removeAddress(id) {
  getDocRef()
    .get()
    .then((doc) => {
      const entries = (doc.exists && doc.data().entries) || [];
      const filtered = entries.filter((e) => e.id !== id);
      return getDocRef().set({ entries: filtered }, { merge: true });
    })
    .then(() => showToast("Address removed", "success"))
    .catch((err) => showToast(err.message, "error"));
}
