// web3-wallet.js
let currentUid = null;

auth.onAuthStateChanged((user) => {
  if (!user) return;
  currentUid = user.uid;
  db.collection("users")
    .doc(currentUid)
    .get()
    .then((doc) => {
      const addr = doc.exists && doc.data().web3Address;
      if (addr) showConnected(addr);
    });
});

function connectWeb3() {
  const addr =
    "0x" +
    Array.from({ length: 40 }, () =>
      "0123456789abcdef".charAt(Math.floor(Math.random() * 16))
    ).join("");

  db.collection("users")
    .doc(currentUid)
    .set({ web3Address: addr }, { merge: true })
    .then(() => {
      showConnected(addr);
      showToast("Web3 wallet created", "success");
    })
    .catch((err) => showToast(err.message, "error"));
}

function showConnected(addr) {
  document.getElementById("w3-btn").textContent = "Wallet Connected";
  document.getElementById("w3-connected").style.display = "block";
  document.getElementById("w3-address").textContent = addr;
}
