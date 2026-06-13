let depositCrypto = "USDT";
let depositNetwork = "";

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
  renderNetworks();
});

function selectDepositCrypto(crypto) {
  depositCrypto = crypto;
  document
    .getElementById("dep-usdt")
    .classList.toggle("active", crypto === "USDT");
  document
    .getElementById("dep-btc")
    .classList.toggle("active", crypto === "BTC");
  document.getElementById("address-display").style.display = "none";
  renderNetworks();
}

function renderNetworks() {
  const container = document.getElementById("network-options");
  const networks = NETWORK_INFO[depositCrypto];

  container.innerHTML = networks
    .map(
      (n) => `
    <div class="card" style="cursor:pointer; display:flex; justify-content:space-between; align-items:center; padding:14px 16px;" onclick="selectNetwork('${n.key}')">
      <div>
        <div style="font-weight:700; font-size:14px;">${n.name}</div>
        <div style="font-size:11px; color:var(--text2); margin-top:2px;">${n.fee} • ${n.time}</div>
      </div>
      <span style="color:var(--text2); font-size:18px;">›</span>
    </div>
  `
    )
    .join("");
}

function selectNetwork(network) {
  depositNetwork = network;
  const address = DEPOSIT_ADDRESSES[depositCrypto][network];

  document.getElementById("dep-crypto-label").textContent = depositCrypto;
  document.getElementById("dep-network-label").textContent = network;
  document.getElementById("dep-warn-crypto").textContent = depositCrypto;
  document.getElementById("dep-warn-network").textContent = network;
  document.getElementById("deposit-address").textContent = address;
  document.getElementById("address-display").style.display = "block";

  document
    .getElementById("address-display")
    .scrollIntoView({ behavior: "smooth" });
}

function copyDepositAddress() {
  const address = document.getElementById("deposit-address").textContent;
  navigator.clipboard.writeText(address);
  showToast("Address copied!", "success");
}
