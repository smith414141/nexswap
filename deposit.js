// ── DEPOSIT.JS ── Professional Modal/Dropdown UI
let selectedCoin = null;
let selectedNetwork = null;
let userBalance = {};

// ── WAIT FOR WALLET DATA ──
function waitForWalletData(cb) {
  if (typeof CRYPTO_LIST !== "undefined" && CRYPTO_LIST.length &&
      typeof DEPOSIT_NETWORKS !== "undefined" &&
      typeof DEPOSIT_ADDRESSES !== "undefined" &&
      typeof DEPOSIT_MEMOS !== "undefined") {
    cb();
  } else {
    setTimeout(() => waitForWalletData(cb), 50);
  }
}
waitForWalletData(initDeposit);

// ── INIT ──
function initDeposit() {
  // Only init if modal content already exists (for deposit.html page)
  if (document.getElementById("coin-dropdown-list")) {
    renderCoinDropdown();
    initTotalBalance();
    initTicker();
    setupDropdownClose();
  }
  // Otherwise wallet.js will call initDepositModal() when modal opens
}

// ── TOTAL BALANCE ──
function initTotalBalance() {
  auth.onAuthStateChanged((user) => {
    if (!user || !user.emailVerified) return;
    db.collection("wallets")
      .doc(user.uid)
      .onSnapshot((doc) => {
        if (!doc.exists) return;
        const balances = doc.data();
        let total = 0;
        CRYPTO_LIST.forEach((c) => {
          const amt = balances[c.symbol] || 0;
          const price = CRYPTO_PRICES[c.symbol] || 0;
          total += amt * price;
        });
        const el = document.getElementById("header-total-balance");
        if (el) el.textContent = `$${total.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
      });
  });
}

// ── COIN DROPDOWN ──
function renderCoinDropdown() {
  const list = document.getElementById("coin-dropdown-list");
  if (!list) return;
  list.innerHTML = CRYPTO_LIST
    .filter(c => DEPOSIT_NETWORKS[c.symbol] && DEPOSIT_NETWORKS[c.symbol].length > 0)
    .map((c) => {
      const nets = (DEPOSIT_NETWORKS[c.symbol] || []).length;
      return `
      <button class="dropdown-item" onclick="depositSelectCoin('${c.symbol}')">
        <span class="item-icon" style="background:${c.color}22;color:${c.color};border:1px solid ${c.color}44;">${c.icon}</span>
        <div class="item-info">
          <div class="item-symbol">${c.symbol}</div>
          <div class="item-name">${c.name}</div>
        </div>
        <span class="item-networks">${nets} networks</span>
      </button>`;
    }).join("");
}

function toggleCoinDropdown() {
  const dropdown = document.getElementById("coin-dropdown");
  const arrow = document.querySelector("#coin-select .dropdown-arrow");
  const isOpen = dropdown.classList.toggle("open");
  arrow.style.transform = isOpen ? "rotate(180deg)" : "rotate(0deg)";

  // Move dropdown to body to avoid clipping by modal-sheet transform
  // Fixed positioning inside transformed ancestors is relative to that ancestor
  if (isOpen && dropdown.parentElement !== document.body) {
    dropdown.dataset.originalParent = dropdown.parentElement.id || "deposit-modal-content";
    document.body.appendChild(dropdown);
    positionDropdown();
    document.getElementById("coin-search").focus();
  } else if (!isOpen) {
    const originalParent = document.getElementById(dropdown.dataset.originalParent);
    if (originalParent) {
      originalParent.appendChild(dropdown);
    }
  }
}

function positionDropdown() {
  const dropdown = document.getElementById("coin-dropdown");
  const select = document.getElementById("coin-select");
  if (!dropdown || !select) return;

  const selectRect = select.getBoundingClientRect();

  dropdown.style.position = "fixed";
  dropdown.style.top = (selectRect.bottom + 8) + "px";
  dropdown.style.left = selectRect.left + "px";
  dropdown.style.right = "auto";
  dropdown.style.width = selectRect.width + "px";
  dropdown.style.zIndex = "2147483647"; // Match CSS
}

function filterCoins() {
  const q = document.getElementById("coin-search").value.toLowerCase();
  const items = document.querySelectorAll("#coin-dropdown-list .dropdown-item");
  items.forEach(item => {
    const sym = item.querySelector(".item-symbol").textContent.toLowerCase();
    const name = item.querySelector(".item-name").textContent.toLowerCase();
    item.style.display = sym.includes(q) || name.includes(q) ? "flex" : "none";
  });
}

function selectCoin(symbol) {
  selectedCoin = CRYPTO_LIST.find(c => c.symbol === symbol);
  if (!selectedCoin) return;

  // Update UI
  document.getElementById("selected-coin-icon").textContent = selectedCoin.icon;
  document.getElementById("selected-coin-icon").style.cssText = `background:${selectedCoin.color}22;color:${selectedCoin.color};border:1px solid ${selectedCoin.color}44;`;
  document.getElementById("selected-coin-symbol").textContent = selectedCoin.symbol;
  document.getElementById("selected-coin-name").textContent = selectedCoin.name;

  // Close dropdown and restore to original parent
  const dropdown = document.getElementById("coin-dropdown");
  dropdown.classList.remove("open");
  document.querySelector("#coin-select .dropdown-arrow").style.transform = "rotate(0deg)";
  
  // Restore dropdown to original position
  const originalParent = document.getElementById(dropdown.dataset.originalParent);
  if (originalParent) {
    originalParent.appendChild(dropdown);
  }

  // Show network section
  document.getElementById("network-section").style.display = "block";
  renderNetworks();
}

function renderNetworks() {
  const container = document.getElementById("network-pills");
  const badge = document.getElementById("network-coin-badge");
  if (!selectedCoin) return;

  const networks = DEPOSIT_NETWORKS[selectedCoin.symbol] || [];
  badge.textContent = `${selectedCoin.symbol} Networks`;

  container.innerHTML = networks.map((n, i) => `
    <button class="network-pill ${i === 0 ? "active" : ""}" onclick="depositSelectNetwork('${n.key}')">
      <span class="net-key">${n.key}</span>
      <span class="net-name">${n.name}</span>
      <span class="net-fee">${n.fee}</span>
    </button>
  `).join("");

  // Auto-select first
  if (networks.length) selectNetwork(networks[0].key);
}

function selectNetwork(networkKey) {
  if (!selectedCoin) return;
  selectedNetwork = (DEPOSIT_NETWORKS[selectedCoin.symbol] || []).find(n => n.key === networkKey);
  if (!selectedNetwork) return;

  // Update pills
  document.querySelectorAll(".network-pill").forEach(btn => {
    btn.classList.toggle("active", btn.onclick.toString().includes(networkKey));
  });

  showAddress();
}

function showAddress() {
  if (!selectedCoin || !selectedNetwork) return;

  const address = (DEPOSIT_ADDRESSES[selectedCoin.symbol] || {})[selectedNetwork.key] || "Address not configured yet";

  // Show address section
  document.getElementById("address-section").style.display = "block";

  // Update header badges
  document.getElementById("warn-network").textContent = selectedNetwork.key;
  document.getElementById("warn-coin").textContent = selectedCoin.symbol;
  document.getElementById("addr-network-badge").textContent = selectedNetwork.key;

  // Network badge in network section
  document.getElementById("network-coin-badge").textContent = `${selectedCoin.symbol} / ${selectedNetwork.key}`;

  // Address
  document.getElementById("deposit-address").textContent = address;
  document.getElementById("addr-network-badge").textContent = selectedNetwork.key;

  // QR Code
  generateQR(address);

  // Network info
  document.getElementById("info-network").textContent = selectedNetwork.name;
  document.getElementById("info-confirms").textContent = selectedNetwork.confirms;
  document.getElementById("info-time").textContent = selectedNetwork.time;
  document.getElementById("info-fee").textContent = selectedNetwork.fee;
  document.getElementById("deposit-info-grid").style.display = "grid";

  // Memo/Tag
  const memo = DEPOSIT_MEMOS[selectedCoin.symbol];
  const memoSection = document.getElementById("deposit-memo-section");
  if (memo) {
    document.getElementById("deposit-memo").textContent = memo;
    memoSection.style.display = "block";
  } else {
    document.getElementById("deposit-memo-section").style.display = "none";
  }
}

function generateQR(address) {
  const container = document.getElementById("qr-wrap");
  container.innerHTML = "";

  if (address === "Address not configured yet") {
    container.innerHTML = '<div style="color:#888;font-size:12px;text-align:center;padding:20px;">No address configured</div>';
    return;
  }

  // Wait for QRCode library to be available
  if (typeof QRCode === "undefined") {
    setTimeout(() => generateQR(address), 100);
    return;
  }

  try {
    new QRCode(container, {
      text: address,
      width: 220,
      height: 220,
      colorDark: "#000000",
      colorLight: "#ffffff",
      correctLevel: QRCode.CorrectLevel.M,
    });
  } catch (e) {
    console.error("QR generation failed:", e);
    container.innerHTML = '<div style="color:#888;font-size:12px;text-align:center;padding:20px;">QR unavailable</div>';
  }
}

function copyDepositAddress() {
  const address = document.getElementById("deposit-address").textContent;
  if (address === "Address not configured yet") {
    showToast("Address not configured yet", "warning");
    return;
  }
  navigator.clipboard.writeText(address)
    .then(() => showToast("Address copied!", "success"))
    .catch(() => {
      const el = document.createElement("textarea");
      el.value = address;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      showToast("Address copied!", "success");
    });
}

function copyMemo() {
  const memo = document.getElementById("deposit-memo").textContent;
  if (!memo || memo === "—") {
    showToast("No memo to copy", "warning");
    return;
  }
  navigator.clipboard.writeText(memo)
    .then(() => showToast("Memo copied!", "success"))
    .catch(() => {
      const el = document.createElement("textarea");
      el.value = memo;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      showToast("Memo copied!", "success");
    });
}

// ── TICKER ──
function initTicker() {
  if (typeof CRYPTO_PRICES !== "undefined" && CRYPTO_PRICES.BTC) {
    renderTicker();
  } else {
    setTimeout(initTicker, 300);
  }
}

function renderTicker() {
  const track = document.getElementById("pc-ticker-track");
  if (!track) return;

  const pairs = [
    { sym: "BTC/USDT", price: CRYPTO_PRICES.BTC },
    { sym: "ETH/USDT", price: CRYPTO_PRICES.ETH },
    { sym: "BNB/USDT", price: CRYPTO_PRICES.BNB },
    { sym: "SOL/USDT", price: CRYPTO_PRICES.SOL },
    { sym: "XRP/USDT", price: CRYPTO_PRICES.XRP },
    { sym: "ADA/USDT", price: CRYPTO_PRICES.ADA },
    { sym: "DOGE/USDT", price: CRYPTO_PRICES.DOGE },
    { sym: "AVAX/USDT", price: CRYPTO_PRICES.AVAX },
    { sym: "DOT/USDT", price: CRYPTO_PRICES.DOT },
    { sym: "LINK/USDT", price: CRYPTO_PRICES.LINK },
    { sym: "MATIC/USDT", price: CRYPTO_PRICES.MATIC },
  ].filter(p => p.price);

  const items = [...pairs, ...pairs].map(p => {
    const change = (Math.random() * 6 - 3).toFixed(2);
    const pos = parseFloat(change) >= 0;
    return `<span class="pc-ticker-item"><span class="sym">${p.sym}</span><span class="price">$${p.price.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span><span class="chg ${pos ? "positive" : "negative"}">${pos ? "▲" : "▼"}${Math.abs(change)}%</span></span>`;
  }).join("");

  track.innerHTML = items;
}

// Close dropdowns on outside click
function setupDropdownClose() {
  document.addEventListener("click", (e) => {
    const select = document.querySelector(".deposit-select");
    const dropdown = document.getElementById("coin-dropdown");
    if (!select || !dropdown) return;
    
    const isClickInSelect = select.contains(e.target);
    const isClickInDropdown = dropdown.contains(e.target);
    
    if (!isClickInSelect && !isClickInDropdown) {
      dropdown.classList.remove("open");
      const arrow = document.querySelector("#coin-select .dropdown-arrow");
      if (arrow) arrow.style.transform = "rotate(0deg)";
      // Restore dropdown to original parent
      const originalParent = document.getElementById(dropdown.dataset.originalParent);
      if (originalParent) {
        originalParent.appendChild(dropdown);
      }
    }
  });
}

// Expose functions to global scope for onclick handlers
window.renderCoinDropdown = renderCoinDropdown;
window.depositToggleCoinDropdown = toggleCoinDropdown;
window.depositSelectCoin = selectCoin;
window.depositFilterCoins = filterCoins;
window.depositRenderNetworks = renderNetworks;
window.depositSelectNetwork = selectNetwork;
window.depositShowAddress = showAddress;
window.depositGenerateQR = generateQR;
window.depositCopyDepositAddress = copyDepositAddress;
window.depositCopyMemo = copyMemo;
window.depositInitTicker = initTicker;
window.depositRenderTicker = renderTicker;
window.depositSetupDropdownClose = setupDropdownClose;