let selectedCoin = null;
let selectedNetwork = null;

auth.onAuthStateChanged((user) => {
  if (!user || !user.emailVerified) return;
  db.collection("users")
    .doc(user.uid)
    .get()
    .then((doc) => {
      if (!doc.exists) return;
      const data = doc.data();
      const badge = document.getElementById("kyc-badge");
      if (data.kycStatus === "approved") {
        badge.textContent = "Verified";
        badge.className = "kyc-badge approved";
      } else if (data.kycStatus === "pending") {
        badge.textContent = "KYC Pending";
        badge.className = "kyc-badge pending";
      } else {
        badge.textContent = "No KYC";
        badge.className = "kyc-badge none";
      }
    });
  if (typeof CRYPTO_LIST !== "undefined" && CRYPTO_LIST.length > 0) {
    renderCoinGrid(CRYPTO_LIST);
  } else {
    window.addEventListener("load", () => renderCoinGrid(CRYPTO_LIST));
  }
});

function renderCoinGrid(coins) {
  const grid = document.getElementById("coin-grid");
  grid.innerHTML = coins
    .map(
      (c) => `
    <div class="card" style="display:flex; align-items:center; gap:12px; cursor:pointer; padding:14px 16px;" onclick="selectCoin('${
      c.symbol
    }')">
      <div style="width:40px; height:40px; border-radius:50%; background:${
        c.color
      }22; border:1px solid ${
        c.color
      }44; display:flex; align-items:center; justify-content:center; font-weight:900; font-size:16px; color:${
        c.color
      }; flex-shrink:0;">${c.icon}</div>
      <div style="flex:1;">
        <div style="font-weight:700; font-size:14px;">${c.symbol}</div>
        <div style="font-size:11px; color:var(--text2);">${c.name}</div>
      </div>
      <div style="font-size:11px; color:var(--text3);">${
        (DEPOSIT_NETWORKS[c.symbol] || []).length
      } network${
        (DEPOSIT_NETWORKS[c.symbol] || []).length !== 1 ? "s" : ""
      }</div>
      <span style="color:var(--text3);">›</span>
    </div>
  `
    )
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

function selectCoin(symbol) {
  selectedCoin = CRYPTO_LIST.find((c) => c.symbol === symbol);
  if (!selectedCoin) return;

  document.getElementById("step-coin").style.display = "none";
  document.getElementById("step-network").style.display = "block";

  document.getElementById("selected-coin-icon").textContent = selectedCoin.icon;
  document.getElementById("selected-coin-icon").style.background =
    selectedCoin.color + "22";
  document.getElementById("selected-coin-icon").style.color =
    selectedCoin.color;
  document.getElementById("selected-coin-name").textContent =
    selectedCoin.symbol + " — " + selectedCoin.name;

  const networks = DEPOSIT_NETWORKS[symbol] || [];
  const list = document.getElementById("network-list");

  if (networks.length === 0) {
    list.innerHTML =
      '<div class="empty-state">No networks available for this coin yet</div>';
    return;
  }

  list.innerHTML = networks
    .map(
      (n) => `
    <div class="card" style="cursor:pointer; padding:16px;" onclick="selectNetwork('${n.key}')">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
        <span style="font-weight:800; font-size:14px;">${n.key}</span>
        <span style="font-size:11px; color:var(--text2);">${n.time}</span>
      </div>
      <div style="font-size:12px; color:var(--text2); margin-bottom:4px;">${n.name}</div>
      <div style="display:flex; justify-content:space-between; font-size:11px; color:var(--text3);">
        <span>${n.fee}</span>
        <span>${n.confirms}</span>
      </div>
    </div>
  `
    )
    .join("");
}

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

  document.getElementById("addr-coin-icon").textContent = selectedCoin.icon;
  document.getElementById("addr-coin-icon").style.background =
    selectedCoin.color + "22";
  document.getElementById("addr-coin-icon").style.color = selectedCoin.color;
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

  generateQR(address);
}

function generateQR(text) {
  const canvas = document.getElementById("qr-canvas");
  const ctx = canvas.getContext("2d");
  const size = 150;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, size, size);
  ctx.fillStyle = "#000000";
  ctx.font = "9px monospace";
  ctx.textAlign = "center";
  ctx.fillText("Scan in wallet app", size / 2, size / 2 - 8);
  ctx.fillText("to get address", size / 2, size / 2 + 8);
}

function backToCoin() {
  document.getElementById("step-network").style.display = "none";
  document.getElementById("step-coin").style.display = "block";
}

function backToNetwork() {
  document.getElementById("step-address").style.display = "none";
  document.getElementById("step-network").style.display = "block";
}

function copyDepositAddress() {
  const address = document.getElementById(
    "deposit-address-display"
  ).textContent;
  navigator.clipboard.writeText(address).then(() => {
    showToast("Address copied!", "success");
  });
}
