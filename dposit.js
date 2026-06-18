let selectedCoin = null;
let selectedNetwork = null;
let qrInstance = null;

// Poll until wallets.js is ready, then render coin list immediately
function waitForCryptoList(cb) {
  if (typeof CRYPTO_LIST !== "undefined" && CRYPTO_LIST.length) {
    cb();
  } else {
    setTimeout(() => waitForCryptoList(cb), 50);
  }
}
waitForCryptoList(() => renderCoinGrid(CRYPTO_LIST));

// Auth only for KYC badge
auth.onAuthStateChanged((user) => {
  if (!user || !user.emailVerified) return;
  db.collection("users")
    .doc(user.uid)
    .get()
    .then((doc) => {
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
    });
});

// ── STEP 1: COIN LIST ──
function renderCoinGrid(coins) {
  const grid = document.getElementById("coin-grid-inner");
  if (!coins || !coins.length) {
    grid.innerHTML =
      '<div class="empty-state">Could not load coins. Please refresh.</div>';
    return;
  }
  grid.innerHTML = coins
    .map((c) => {
      const nets = (DEPOSIT_NETWORKS[c.symbol] || []).length;
      return `
    <div class="dep-coin-row" onclick="selectCoin('${c.symbol}')">
      <div class="dep-coin-avatar" style="background:${c.color}22; color:${
        c.color
      }; border:1px solid ${c.color}44;">${c.icon}</div>
      <div>
        <div class="dep-coin-symbol">${c.symbol}</div>
        <div class="dep-coin-name">${c.name}</div>
      </div>
      <div class="dep-coin-nets">${nets} network${nets !== 1 ? "s" : ""} ›</div>
    </div>`;
    })
    .join("");
}

function filterCoins() {
  const q = document.getElementById("coin-search").value.toLowerCase();
  const filtered = CRYPTO_LIST.filter(
    (c) =>
      c.symbol.toLowerCase().includes(q) || c.name.toLowerCase().includes(q)
  );
  renderCoinGrid(filtered);
}

// ── STEP 2: NETWORK ──
function selectCoin(symbol) {
  selectedCoin = CRYPTO_LIST.find((c) => c.symbol === symbol);
  if (!selectedCoin) return;

  document.getElementById("step-coin").style.display = "none";
  document.getElementById("step-network").style.display = "block";

  const iconEl = document.getElementById("selected-coin-icon");
  iconEl.textContent = selectedCoin.icon;
  iconEl.style.background = selectedCoin.color + "22";
  iconEl.style.color = selectedCoin.color;
  iconEl.style.border = "1px solid " + selectedCoin.color + "44";
  document.getElementById("selected-coin-symbol").textContent =
    selectedCoin.symbol;
  document.getElementById("selected-coin-fullname").textContent =
    selectedCoin.name;

  const networks = DEPOSIT_NETWORKS[symbol] || [];
  const list = document.getElementById("network-list");
  if (!networks.length) {
    list.innerHTML = '<div class="empty-state">No networks available yet</div>';
    return;
  }
  list.innerHTML = networks
    .map(
      (n) => `
    <div class="net-card" onclick="selectNetwork('${n.key}')">
      <div class="net-key">${n.key}</div>
      <div class="net-name">${n.name}</div>
      <div class="net-meta">
        <span>⏱ ${n.time}</span>
        <span>💸 ${n.fee}</span>
        <span>✅ ${n.confirms}</span>
      </div>
    </div>
  `
    )
    .join("");
}

function backToCoin() {
  document.getElementById("step-network").style.display = "none";
  document.getElementById("step-coin").style.display = "block";
  selectedCoin = null;
}

// ── STEP 3: ADDRESS + QR ──
function selectNetwork(networkKey) {
  if (!selectedCoin) return;
  const networks = DEPOSIT_NETWORKS[selectedCoin.symbol] || [];
  selectedNetwork = networks.find((n) => n.key === networkKey);
  if (!selectedNetwork) return;

  const address =
    (DEPOSIT_ADDRESSES[selectedCoin.symbol] || {})[networkKey] ||
    "Address not configured yet";

  document.getElementById("step-network").style.display = "none";
  document.getElementById("step-address").style.display = "block";

  // Coin icon
  const addrIcon = document.getElementById("addr-coin-icon");
  addrIcon.textContent = selectedCoin.icon;
  addrIcon.style.background = selectedCoin.color + "22";
  addrIcon.style.color = selectedCoin.color;
  addrIcon.style.border = "1px solid " + selectedCoin.color + "44";

  document.getElementById("addr-coin-name").textContent =
    selectedCoin.symbol + " — " + selectedCoin.name;
  document.getElementById("addr-network-name").textContent =
    selectedNetwork.name;
  document.getElementById("addr-crypto-warn").textContent =
    selectedCoin.symbol + " (" + networkKey + ")";
  document.getElementById("addr-network-warn").textContent =
    selectedNetwork.name;
  document.getElementById("addr-crypto-warn2").textContent =
    selectedCoin.symbol;
  document.getElementById("deposit-address-display").textContent = address;
  document.getElementById("info-network").textContent = selectedNetwork.name;
  document.getElementById("info-confirms").textContent =
    selectedNetwork.confirms;
  document.getElementById("info-time").textContent = selectedNetwork.time;
  document.getElementById("info-fee").textContent = selectedNetwork.fee;

  generateQR(address);
}

function generateQR(address) {
  const canvas = document.getElementById("qr-canvas");
  // Clear previous QR
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (typeof QRCode === "undefined") {
    // Fallback if qrcode.js didn't load
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, 190, 190);
    ctx.fillStyle = "#000";
    ctx.font = "10px monospace";
    ctx.textAlign = "center";
    ctx.fillText("QR unavailable", 95, 95);
    return;
  }

  // Use QRCode library to draw directly onto canvas
  const qr = qrcode(0, "M");
  qr.addData(address);
  qr.make();

  const moduleCount = qr.getModuleCount();
  const cellSize = Math.floor(190 / moduleCount);
  const margin = Math.floor((190 - cellSize * moduleCount) / 2);

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, 190, 190);
  ctx.fillStyle = "#000000";

  for (let row = 0; row < moduleCount; row++) {
    for (let col = 0; col < moduleCount; col++) {
      if (qr.isDark(row, col)) {
        ctx.fillRect(
          margin + col * cellSize,
          margin + row * cellSize,
          cellSize,
          cellSize
        );
      }
    }
  }
}

function backToNetwork() {
  document.getElementById("step-address").style.display = "none";
  document.getElementById("step-network").style.display = "block";
}

function copyDepositAddress() {
  const address = document.getElementById(
    "deposit-address-display"
  ).textContent;
  if (address === "Address not configured yet") {
    showToast("Address not configured yet", "warning");
    return;
  }
  navigator.clipboard
    .writeText(address)
    .then(() => {
      showToast("Address copied!", "success");
    })
    .catch(() => {
      // Fallback for older browsers
      const el = document.createElement("textarea");
      el.value = address;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      showToast("Address copied!", "success");
    });
}

function shareAddress() {
  const address = document.getElementById(
    "deposit-address-display"
  ).textContent;
  if (navigator.share) {
    navigator
      .share({
        title: `${selectedCoin?.symbol} Deposit Address`,
        text: address,
      })
      .catch(() => {});
  } else {
    copyDepositAddress();
  }
}
