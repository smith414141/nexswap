// nft.js
const NFT_ITEMS = [
  { name: "CryptoPunk Style #114", price: 320, emoji: "🐵" },
  { name: "Kripex Genesis #02", price: 180, emoji: "💎" },
  { name: "Neon Ape #77", price: 245, emoji: "🦍" },
  { name: "Pixel Whale #09", price: 410, emoji: "🐋" },
];

document.addEventListener("DOMContentLoaded", () => {
  gateFeatureByRegion({
    allowed: ["global"],
    featureName: "NFT Marketplace",
    contentId: "feature-content",
    gateId: "region-gate",
  });
  renderNftGrid();
});

function renderNftGrid() {
  const grid = document.getElementById("nft-grid");
  grid.innerHTML = NFT_ITEMS.map(
    (item, i) => `
    <div class="card" style="text-align:center; padding:14px">
      <div style="font-size:40px; margin-bottom:8px">${item.emoji}</div>
      <div style="font-weight:700; font-size:12px">${item.name}</div>
      <div style="font-size:13px; color:var(--yellow); font-weight:800; margin:6px 0">${item.price} USDT</div>
      <button class="btn-primary" style="width:100%; padding:8px; font-size:12px" onclick="buyNft(${i})">Buy Now</button>
    </div>`
  ).join("");
}

function buyNft(index) {
  const user = auth.currentUser;
  if (!user) return;
  const item = NFT_ITEMS[index];
  db.collection("wallets")
    .doc(user.uid)
    .get()
    .then((doc) => {
      const usdt = doc.data()?.USDT || 0;
      if (item.price > usdt) {
        showToast("Insufficient USDT balance", "error");
        return Promise.reject("insufficient");
      }
      return db.collection("wallets").doc(user.uid).update({
        USDT: firebase.firestore.FieldValue.increment(-item.price),
      });
    })
    .then(() => {
      logTransaction(user.uid, "nft_purchase", "NFT", item.price, "USDT", item.name);
      showToast(`You bought "${item.name}"!`, "success");
    })
    .catch((err) => {
      if (err !== "insufficient") console.error(err);
    });
}
