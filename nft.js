// nft.js
const NFT_ITEMS = [
  { name: "CryptoPunk Style #114", price: 320, emoji: "🐵", rarity: "Legendary" },
  { name: "Kripex Genesis #02", price: 180, emoji: "💎", rarity: "Epic" },
  { name: "Neon Ape #77", price: 245, emoji: "🦍", rarity: "Rare" },
  { name: "Pixel Whale #09", price: 410, emoji: "🐋", rarity: "Common" },
];

// Curated gradient palette for deterministic visual variety
const GRADIENT_PALETTE = [
  { start: "#667eea", end: "#764ba2" }, // purple-blue
  { start: "#f093fb", end: "#f5576c" }, // pink-red
  { start: "#4facfe", end: "#00f2fe" }, // blue-cyan
  { start: "#43e97b", end: "#38f9d7" }, // green-teal
  { start: "#fa709a", end: "#fee140" }, // pink-gold
  { start: "#a8edea", end: "#fed6e3" }, // light cyan-pink
  { start: "#ff9a9e", end: "#fecfef" }, // coral-pink
  { start: "#a18cd1", end: "#fbc2eb" }, // purple-pink
  { start: "#d299c2", end: "#fef9d7" }, // mauve-cream
  { start: "#89f7fe", end: "#66a6ff" }, // light blue
];

// Rarity colors
const RARITY_STYLES = {
  Legendary: { border: "#F0B90B", glow: "#F0B90B", shimmer: true },
  Epic: { border: "#8B5CF6", glow: "#8B5CF6", shimmer: false },
  Rare: { border: "#3B82F6", glow: "#3B82F6", shimmer: false },
  Common: { border: "#6B7280", glow: "#6B7280", shimmer: false },
};

// Deterministic hash for consistent gradient assignment
function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function getGradientForItem(name) {
  const idx = hashString(name) % GRADIENT_PALETTE.length;
  return GRADIENT_PALETTE[idx];
}

function getRarityStyle(rarity) {
  return RARITY_STYLES[rarity] || RARITY_STYLES.Common;
}

// SVG pattern for subtle geometric texture
function getPatternSvg() {
  return `data:image/svg+xml;base64,${btoa(`
    <svg width="40" height="40" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
          <path d="M 20 0 L 0 0 0 20" fill="none" stroke="white" stroke-width="0.3" opacity="0.08"/>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#grid)"/>
    </svg>
  `)}`;
}

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
    (item, i) => {
      const gradient = getGradientForItem(item.name);
      const rarityStyle = getRarityStyle(item.rarity);
      const patternUrl = getPatternSvg();
      
      // Build the art tile style
      const artTileStyle = `
        position: relative;
        border-radius: 16px;
        padding: 24px 16px;
        background: linear-gradient(135deg, ${gradient.start}, ${gradient.end});
        overflow: hidden;
        margin-bottom: 12px;
        border: 2px solid ${rarityStyle.border};
        box-shadow: 
          0 0 0 1px ${rarityStyle.border}40,
          0 8px 32px ${rarityStyle.glow}30,
          inset 0 -20px 40px rgba(0,0,0,0.15);
        ${rarityStyle.shimmer ? `
          animation: nft-shimmer 3s ease-in-out infinite;
          background-size: 200% 200%;
        ` : ''}
      `;
      
      // Inner pattern overlay
      const patternStyle = `
        position: absolute;
        inset: 0;
        background-image: url("${patternUrl}");
        opacity: 0.12;
        pointer-events: none;
        border-radius: 14px;
      `;
      
      // Emoji treatment
      const emojiStyle = `
        font-size: 64px;
        filter: drop-shadow(0 0 16px ${rarityStyle.glow});
        transition: transform 0.2s ease;
        position: relative;
        z-index: 1;
      `;
      
      return `
      <div class="card" style="padding: 0; overflow: hidden; background: var(--bg2); border: 1px solid var(--border);">
        <div style="${artTileStyle}">
          <div style="${patternStyle}"></div>
          <div style="text-align: center; position: relative; z-index: 1;">
            <div style="${emojiStyle}" onmouseover="this.style.transform='scale(1.1)'" onmouseout="this.style.transform='scale(1)'">${item.emoji}</div>
          </div>
        </div>
        <div style="padding: 16px;">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
            <div style="font-weight: 800; font-size: 13px; line-height: 1.3;">${item.name}</div>
            <span style="font-size: 10px; font-weight: 700; padding: 3px 8px; border-radius: 100px; background: ${rarityStyle.border}20; color: ${rarityStyle.border}; border: 1px solid ${rarityStyle.border}40;">${item.rarity}</span>
          </div>
          <div style="font-size: 15px; color: var(--yellow); font-weight: 900; font-family: var(--font-mono); margin-bottom: 12px;">${item.price} USDT</div>
          <button class="btn-primary" style="width: 100%; padding: 10px; font-size: 12px;" onclick="buyNft(${i})">Buy Now</button>
        </div>
      </div>`
    }
  ).join("");
  
  // Inject shimmer keyframes if not already present
  if (!document.getElementById("nft-shimmer-style")) {
    const style = document.createElement("style");
    style.id = "nft-shimmer-style";
    style.textContent = `
      @keyframes nft-shimmer {
        0% { background-position: 0% 50%; }
        50% { background-position: 100% 50%; }
        100% { background-position: 0% 50%; }
      }
    `;
    document.head.appendChild(style);
  }
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