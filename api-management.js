// api-management.js
let currentUid = null;

auth.onAuthStateChanged((user) => {
  if (!user) return;
  currentUid = user.uid;
  db.collection("users")
    .doc(currentUid)
    .onSnapshot((doc) => {
      const key = doc.exists && doc.data().apiKey;
      const box = document.getElementById("api-key-box");
      box.textContent = key ? key : "No API key generated";
    });
});

function generateApiKey() {
  const key =
    "kpx_live_" +
    Array.from({ length: 32 }, () =>
      "abcdefghijklmnopqrstuvwxyz0123456789".charAt(
        Math.floor(Math.random() * 36)
      )
    ).join("");

  db.collection("users")
    .doc(currentUid)
    .set({ apiKey: key }, { merge: true })
    .then(() => showToast("New API key generated", "success"))
    .catch((err) => showToast(err.message, "error"));
}

function revokeApiKey() {
  db.collection("users")
    .doc(currentUid)
    .set({ apiKey: firebase.firestore.FieldValue.delete() }, { merge: true })
    .then(() => showToast("API key revoked", "success"))
    .catch((err) => showToast(err.message, "error"));
}
