// web3-wallet.js - dApp Directory
const WEB3_DAPPS = [
  { name: "Uniswap", icon: "🦄", desc: "Leading DEX on Ethereum & L2s", cat: "defi", chain: "ethereum", tvl: "$4.2B" },
  { name: "PancakeSwap", icon: "🥞", desc: "Top DEX on BNB Chain", cat: "defi", chain: "bnb", tvl: "$2.1B" },
  { name: "Aave", icon: "👻", desc: "Lending & borrowing protocol", cat: "defi", chain: "multi", tvl: "$8.7B" },
  { name: "Lido", icon: "🥞", desc: "Liquid staking for ETH & SOL", cat: "staking", chain: "multi", tvl: "$28.4B" },
  { name: "GMX", icon: "⚡", desc: "Perpetual DEX on Arbitrum", cat: "defi", chain: "arbitrum", tvl: "$0.6B" },
  { name: "Jupiter", icon: "🪐", desc: "Solana DEX aggregator", cat: "defi", chain: "solana", tvl: "$1.2B" },
  { name: "Curve", icon: "📈", desc: "Stablecoin & concentrated liquidity", cat: "defi", chain: "multi", tvl: "$3.1B" },
  { name: "Compound", icon: "🏦", desc: "Algorithmic money markets", cat: "defi", chain: "ethereum", tvl: "$2.3B" },
  { name: "dYdX", icon: "📊", desc: "Perpetuals on its own chain", cat: "defi", chain: "ethereum", tvl: "$0.4B" },
];

let currentUid = null;
let w3Address = null;
let activeChain = "all";
let activeCat = "all";
let searchQuery = "";

auth.onAuthStateChanged((user) => {
  if (!user) return;
  currentUid = user.uid;
  loadW3Connection();
  renderDapps();
});

async function loadW3Connection() {
  const doc = await db.collection("users").doc(currentUid).get();
  if (doc.exists && doc.data().web3Address) {
    w3Address = doc.data().web3Address;
    showConnected();
  }
}

function showConnected() {
  const btn = document.getElementById("w3-connect-btn");
  const chip = document.getElementById("w3-connected-chip");
  const addrEl = document.getElementById("w3-chip-addr");
  const shortAddr = w3Address.slice(0, 6) + "..." + w3Address.slice(-4);
  btn.style.display = "none";
  chip.style.display = "flex";
  addrEl.textContent = shortAddr;
}

function connectWeb3() {
  if (!currentUid) return;
  const addr = "0x" + Array.from(crypto.getRandomValues(new Uint8Array(20))).map(b => b.toString(16).padStart(2, "0")).join("");
  w3Address = addr;
  db.collection("users").doc(currentUid).set({ web3Address: addr }, { merge: true })
    .then(() => {
      showToast("Wallet connected (demo)", "success");
      showConnected();
    })
    .catch(err => showToast(err.message, "error"));
}

function renderDapps() {
  const grid = document.getElementById("dapp-grid");
  const filtered = WEB3_DAPPS.filter(d => {
    const chainMatch = activeChain === "all" || d.chain === activeChain;
    const catMatch = activeCat === "all" || d.cat === activeCat;
    const searchMatch = !searchQuery || d.name.toLowerCase().includes(searchQuery) || d.desc.toLowerCase().includes(searchQuery);
    return chainMatch && catMatch && searchMatch;
  });

  grid.innerHTML = filtered.map(d => `
    <div class="card" style="padding: 0; overflow: hidden; background: var(--bg2); border: 1px solid var(--border); cursor: pointer; transition: transform 0.15s, border-color 0.15s;" onmouseover="this.style.transform='translateY(-2px)'; this.style.borderColor='var(--blue)'" onmouseout="this.style.transform=''; this.style.borderColor='var(--border)'" onclick="openDapp('${d.name}')">
      <div style="padding: 16px 16px 8px;">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
          <div style="font-size: 28px;">${d.icon}</div>
          <div style="font-size: 10px; font-weight: 700; color: var(--text3); background: var(--bg3); padding: 2px 6px; border-radius: 4px;">${d.tvl}</div>
        </div>
        <div style="font-weight: 800; font-size: 14px; margin-bottom: 4px;">${d.name}</div>
        <div style="font-size: 11px; color: var(--text2); margin-bottom: 10px;">${d.desc}</div>
      </div>
      <div style="padding: 0 16px 16px; display: flex; justify-content: space-between; align-items: center;">
        <span style="font-size: 10px; font-weight: 700; color: var(--blue); background: rgba(59,130,246,0.1); padding: 3px 8px; border-radius: 100px; text-transform: capitalize;">${d.chain}</span>
        <span style="font-size: 14px; color: var(--text3);">→</span>
      </div>
    </div>
  `).join("");
}

function setChainFilter(chain) {
  activeChain = chain;
  document.querySelectorAll(".chain-pill").forEach(b => b.classList.remove("active"));
  document.querySelector(`[data-chain="${chain}"]`).classList.add("active");
  renderDapps();
}

function setCatFilter(cat, btn) {
  activeCat = cat;
  document.querySelectorAll(".tabs .tab").forEach(b => b.classList.remove("active"));
  btn.classList.add("active");
  renderDapps();
}

function filterDapps() {
  searchQuery = document.getElementById("dapp-search").value.toLowerCase().trim();
  renderDapps();
}

function openDapp(name) {
  if (!w3Address) {
    showToast("Connect your wallet first", "warning");
    return;
  }
  showToast(`Opening ${name}... (external dApp browsing coming soon)`, "info");
}