// ── WITHDRAW.JS ── Professional Modal/Dropdown UI
let selectedCoin = null;
let selectedNetwork = null;
let userBalance = {};

// ── WAIT FOR WALLET DATA ──
function waitForWalletData(cb) {
  console.log('[withdraw] waitForWalletData check:', {
    CRYPTO_LIST: typeof CRYPTO_LIST,
    DEPOSIT_NETWORKS: typeof DEPOSIT_NETWORKS,
    DEPOSIT_ADDRESSES: typeof DEPOSIT_ADDRESSES,
    DEPOSIT_MEMOS: typeof DEPOSIT_MEMOS
  });
  if (typeof CRYPTO_LIST !== "undefined" && CRYPTO_LIST.length &&
      typeof DEPOSIT_NETWORKS !== "undefined" &&
      typeof DEPOSIT_ADDRESSES !== "undefined" &&
      typeof DEPOSIT_MEMOS !== "undefined") {
    console.log('[withdraw] waitForWalletData resolved, calling cb');
    cb();
  } else {
    console.log('[withdraw] waitForWalletData waiting...');
    setTimeout(() => waitForWalletData(cb), 50);
  }
}
waitForWalletData(initWithdraw);

// ── INIT ──
function initWithdraw() {
  // Only init if modal content already exists (for withdraw.html page)
  if (document.getElementById("crypto-dropdown-list")) {
    renderCryptoDropdown();
    setupDropdownClose();
    initTicker();
  }
  // Otherwise wallet.js will call initWithdrawModal() when modal opens

  // Auth & balance
  auth.onAuthStateChanged((user) => {
    if (!user || !user.emailVerified) return;

    // KYC badge
    db.collection("users").doc(user.uid).get().then((doc) => {
      if (!doc.exists) return;
      const d = doc.data();
      ["kyc-badge", "kyc-badge-pc"].forEach((id) => {
        const el = document.getElementById(id);
        if (!el) return;
        if (d.kycStatus === "approved") {
          el.textContent = "Verified";
          el.className = "kyc-badge approved";
        } else if (d.kycStatus === "pending") {
          el.textContent = "KYC Pending";
          el.className = "kyc-badge pending";
        } else {
          el.textContent = "No KYC";
          el.className = "kyc-badge none";
        }
      });
      if (d.kycStatus !== "approved") {
        showToast("Complete KYC to withdraw", "warning");
      }
    });

    // Live balance
    db.collection("wallets").doc(user.uid).onSnapshot((doc) => {
      if (!doc.exists) return;
      userBalance = doc.data();
      updateBalanceDisplay();
    });

renderCryptoPills();
  });
}

function initWithdraw() {
  renderCryptoPills();
}

function renderCryptoPills() {
  const container = document.getElementById("crypto-pills");
  if (!container || typeof CRYPTO_LIST === "undefined") return;
  container.innerHTML = CRYPTO_LIST
    .map((c, i) => `
      <button class="crypto-pill ${i === 0 ? "active" : ""}" data-sym="${c.symbol}" onclick="withdrawSelectCoin('${c.symbol}')">${c.symbol}</button>
    `).join("");
}

function updateBalanceDisplay() {
  const bal = userBalance[selectedCoin] || 0;
  const decimals = selectedCoin === "BTC" ? 8 : 2;
  document.getElementById("wd-available").innerHTML = `Available: <span>${bal.toFixed(decimals)}</span> ${selectedCoin}`;
  document.getElementById("wd-amount-suffix").textContent = selectedCoin;
  document.getElementById("max-display").textContent = bal.toFixed(decimals);
}

function withdrawSelectCoin(symbol) {
  selectedCoin = CRYPTO_LIST.find(c => c.symbol === symbol);
  if (!selectedCoin) return;

  document.querySelectorAll("#crypto-pills .crypto-pill").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.sym === symbol);
  });

  document.getElementById("wd-amount-suffix").textContent = selectedCoin;
  document.getElementById("coin-badge").textContent = selectedCoin;

  selectedNetwork = null;
  document.getElementById("wd-address").value = "";
  document.getElementById("wd-amount").value = "";
  document.getElementById("wd-memo").value = "";
  document.getElementById("memo-section").style.display = "none";

  updateBalanceDisplay();
  renderNetworks();
  updateSummary();
}

function renderCryptoDropdown() {
  const list = document.getElementById("crypto-dropdown-list");
  console.log('[withdraw] renderCryptoDropdown called, list:', list, 'CRYPTO_LIST:', CRYPTO_LIST);
  if (!list) return;
  list.innerHTML = CRYPTO_LIST
    .filter(c => DEPOSIT_NETWORKS[c.symbol] && DEPOSIT_NETWORKS[c.symbol].length > 0)
    .map((c) => {
      const nets = (DEPOSIT_NETWORKS[c.symbol] || []).length;
      return `
      <button class="dropdown-item" onclick="selectCoinFromDropdown('${c.symbol}')">
        <span class="item-icon" style="background:${c.color}22;color:${c.color};border:1px solid ${c.color}44;">${c.icon}</span>
        <div class="item-info">
          <div class="item-symbol">${c.symbol}</div>
          <div class="item-name">${c.name}</div>
        </div>
        <span class="item-networks">${nets} networks</span>
      </button>`;
    }).join("");
  console.log('[withdraw] rendered items:', list.children.length);
}

function toggleCryptoDropdown() {
  const dropdown = document.getElementById("crypto-dropdown");
  const arrow = document.querySelector("#crypto-select .dropdown-arrow");
  if (!dropdown) return;
  
  const isOpen = dropdown.classList.toggle("open");
  if (arrow) arrow.style.transform = isOpen ? "rotate(180deg)" : "rotate(0deg)";
  
  if (isOpen) {
    document.getElementById("crypto-search").focus();
  }
}

function positionCryptoDropdown() {
  const dropdown = document.getElementById("crypto-dropdown");
  const select = document.getElementById("crypto-select");
  if (!dropdown || !select) return;

  const selectRect = select.getBoundingClientRect();

  dropdown.style.position = "fixed";
  dropdown.style.top = (selectRect.bottom + 8) + "px";
  dropdown.style.left = selectRect.left + "px";
  dropdown.style.right = "auto";
  dropdown.style.width = selectRect.width + "px";
  dropdown.style.zIndex = "2147483647"; // Match CSS
}

function filterCryptos() {
  const q = document.getElementById("crypto-search").value.toLowerCase();
  document.querySelectorAll("#crypto-dropdown-list .dropdown-item").forEach(item => {
    const sym = item.querySelector(".item-symbol").textContent.toLowerCase();
    const name = item.querySelector(".item-name").textContent.toLowerCase();
    item.style.display = sym.includes(q) || name.includes(q) ? "flex" : "none";
  });
}

function selectCoinFromDropdown(symbol) {
  withdrawSelectCoin(symbol);
  const dropdown = document.getElementById("crypto-dropdown");
  dropdown.classList.remove("open");
  document.querySelector("#crypto-select .dropdown-arrow").style.transform = "rotate(0deg)";

  // Restore dropdown to original position
  const originalParent = document.getElementById(dropdown.dataset.originalParent);
  if (originalParent) {
    originalParent.appendChild(dropdown);
  }
}

function renderNetworks() {
  const container = document.getElementById("network-pills");
  const networks = (typeof DEPOSIT_NETWORKS !== "undefined" && DEPOSIT_NETWORKS[selectedCoin]) || [];

  if (!networks.length) {
    container.innerHTML = '<div class="empty-state">No networks available</div>';
    selectedNetwork = null;
    updateSummary();
    return;
  }

  container.innerHTML = networks
    .map((n, i) => `
      <button class="network-pill ${i === 0 ? "active" : ""}" data-net="${n.key}" onclick="selectNetwork('${n.key}')">${n.key}</button>
    `).join("");

  selectNetwork(networks[0].key);
}

function selectNetwork(key) {
  const networks = (typeof DEPOSIT_NETWORKS !== "undefined" && DEPOSIT_NETWORKS[selectedCoin]) || [];
  selectedNetwork = networks.find(n => n.key === key);
  if (!selectedNetwork) return;

  document.querySelectorAll("#network-pills .network-pill").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.net === key);
  });

  const memoSection = document.getElementById("memo-section");
  const memoWarning = document.getElementById("memo-warning");
  const memo = DEPOSIT_MEMOS[selectedCoin];
  const netMemo = selectedNetwork.memo;
  if (memo || netMemo) {
    const memoValue = netMemo || DEPOSIT_MEMOS[selectedCoin];
    document.getElementById("wd-memo").placeholder = `Memo: ${memoValue}`;
    if (memoWarning) memoSection.style.display = "block";
  } else {
    const memoSection = document.getElementById("memo-section");
    if (memoSection) memoSection.style.display = "none";
  }

  updateSummary();
}

function updateBalanceDisplay() {
  const bal = userBalance[selectedCoin] || 0;
  const decimals = selectedCoin === "BTC" ? 8 : 2;
  document.getElementById("wd-available").innerHTML = `Available: <span>${bal.toFixed(decimals)}</span> ${selectedCoin}`;
  document.getElementById("wd-amount-suffix").textContent = selectedCoin;
  document.getElementById("max-display").textContent = bal.toFixed(decimals);
}

function updateSummary() {
  const amount = parseFloat(document.getElementById("wd-amount").value) || 0;
  const fee = getNumericFee(selectedCoin, selectedNetwork);
  const receive = Math.max(0, amount - fee);
  const decimals = selectedCoin === "BTC" ? 8 : 2;

  document.getElementById("wd-fee").textContent = `${fee} ${selectedCoin}`;
  document.getElementById("wd-receive").textContent = `${receive.toFixed(decimals)} ${selectedCoin}`;
}

function getNumericFee(crypto, networkKey) {
  const networks = (typeof DEPOSIT_NETWORKS !== "undefined" && DEPOSIT_NETWORKS[crypto]) || [];
  const net = networks.find(n => n.key === networkKey);
  if (!net || !net.fee) return 0;
  const match = net.fee.match(/[\d.]+/);
  return match ? parseFloat(match[0]) : 0;
}

function setMaxWithdraw() {
  const bal = userBalance[selectedCoin] || 0;
  document.getElementById("wd-amount").value = bal.toFixed(selectedCoin === "BTC" ? 8 : 2);
  updateSummary();
}

function submitWithdrawal() {
  const user = auth.currentUser;
  const address = document.getElementById("wd-address").value.trim();
  const amount = parseFloat(document.getElementById("wd-amount").value);
  const memo = document.getElementById("wd-memo").value.trim();
  const balance = userBalance[selectedCoin] || 0;
  const fee = getNumericFee(selectedCoin, selectedNetwork);

  if (!address) { showToast("Please enter withdrawal address", "error"); return; }
  if (!amount || amount <= 0) { showToast("Please enter a valid amount", "error"); return; }
  if (amount > balance) { showToast("Insufficient balance", "error"); return; }
  if (amount <= fee) { showToast("Amount must be greater than network fee", "error"); return; }

  const btn = document.getElementById("wd-submit-btn");
  btn.disabled = true;
  btn.textContent = "Submitting...";

  const receiveAmount = amount - fee;

  db.collection("withdrawals")
    .add({
      userId: user.uid,
      userEmail: user.email,
      crypto: selectedCoin,
      network: selectedNetwork,
      address,
      memo,
      amount,
      fee,
      receiveAmount,
      status: "pending",
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    })
    .then(() => {
      return db.collection("wallets").doc(user.uid).update({
        [selectedCoin]: firebase.firestore.FieldValue.increment(-amount),
      });
    })
    .then(() => {
      showToast("Withdrawal request submitted!", "success");
      document.getElementById("wd-address").value = "";
      document.getElementById("wd-amount").value = "";
      document.getElementById("wd-memo").value = "";
      updateSummary();
    })
    .catch((err) => showToast(err.message, "error"))
    .finally(() => {
      btn.disabled = false;
      btn.textContent = "Submit Withdrawal";
    });
}

// ── ADDRESS BOOK ──
let savedAddresses = [];

function loadAddressBook() {
  const user = auth.currentUser;
  if (!user) return;
  db.collection("addressBook").doc(user.uid).get().then((doc) => {
    savedAddresses = doc.exists ? doc.data().addresses || [] : [];
    renderAddressBook();
  });
}

function renderAddressBook() {
  const container = document.getElementById("address-book-list");
  if (!container) return;
  if (!savedAddresses.length) {
    container.innerHTML = '<div style="font-size:12px;color:var(--text3);padding:8px 0;">No saved addresses yet.</div>';
    return;
  }
  container.innerHTML = savedAddresses
    .map((a, i) => `
      <div style="display:flex;align-items:center;gap:8px;padding:8px 0;border-bottom:1px solid var(--border);" onclick="useAddress('${a.address}')">
        <div style="flex:1;">
          <div style="font-size:13px;font-weight:600;">${a.label}</div>
          <div style="font-size:10px;color:var(--text3);">${a.network} · ${a.address.slice(0, 12)}...${a.address.slice(-6)}</div>
        </div>
        <button onclick="event.stopPropagation();deleteAddress(${i})" style="background:none;border:none;color:var(--red);font-size:16px;cursor:pointer;">✕</button>
      </div>
    `).join("");
}

function useAddress(address) {
  document.getElementById("wd-address").value = address;
  document.getElementById("address-book-modal").style.display = "none";
}

function saveCurrentAddress() {
  const user = auth.currentUser;
  const address = document.getElementById("wd-address").value.trim();
  const label = prompt("Label for this address (e.g. My Binance):");
  if (!label || !address) return;

  savedAddresses.push({
    label,
    address,
    network: selectedNetwork,
    crypto: selectedCoin,
  });
  db.collection("addressBook").doc(user.uid).set({ addresses: savedAddresses }, { merge: true })
    .then(() => showToast("Address saved!", "success"))
    .catch((err) => showToast(err.message, "error"));
}

function deleteAddress(index) {
  savedAddresses.splice(index, 1);
  const user = auth.currentUser;
  db.collection("addressBook").doc(user.uid).set({ addresses: savedAddresses }, { merge: true })
    .then(() => renderAddressBook());
}

function openAddressBook() {
  loadAddressBook();
  document.getElementById("address-book-modal").style.display = "flex";
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
  ].filter(p => p.price);

  const items = [...pairs, ...pairs].map(p => {
    const change = (Math.random() * 6 - 3).toFixed(2);
    const pos = parseFloat(change) >= 0;
    return `<span class="pc-ticker-item"><span class="sym">${p.sym}</span><span class="price">$${p.price.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span><span class="chg ${pos ? "positive" : "negative"}">${pos ? "▲" : "▼"}${Math.abs(change)}%</span></span>`;
  }).join("");

  track.innerHTML = items;
}

// Close dropdown on outside click
function setupDropdownClose() {
  document.addEventListener("click", (e) => {
    const select = document.querySelector(".withdraw-select");
    const dropdown = document.getElementById("crypto-dropdown");
    if (!select || !dropdown) return;
    
    const isClickInSelect = select.contains(e.target);
    const isClickInDropdown = dropdown.contains(e.target);
    
    if (!isClickInSelect && !isClickInDropdown) {
      dropdown.classList.remove("open");
      const arrow = document.querySelector("#crypto-select .dropdown-arrow");
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
window.renderCryptoPills = renderCryptoPills;
window.withdrawSelectCoin = withdrawSelectCoin;
window.renderCryptoDropdown = renderCryptoDropdown;
window.toggleCryptoDropdown = toggleCryptoDropdown;
window.selectCoinFromDropdown = selectCoinFromDropdown;
window.filterCryptos = filterCryptos;
window.withdrawFilterCryptos = filterCryptos;
window.renderNetworks = renderNetworks;
window.selectNetwork = selectNetwork;
window.updateBalanceDisplay = updateBalanceDisplay;
window.updateSummary = updateSummary;
window.setMaxWithdraw = setMaxWithdraw;
window.submitWithdrawal = submitWithdrawal;
window.loadAddressBook = loadAddressBook;
window.renderAddressBook = renderAddressBook;
window.useAddress = useAddress;
window.saveCurrentAddress = saveCurrentAddress;
window.deleteAddress = deleteAddress;
window.openAddressBook = openAddressBook;
window.initTicker = initTicker;
window.renderTicker = renderTicker;
window.setupDropdownClose = setupDropdownClose;