let withdrawCrypto = "USDT";
let withdrawNetwork = "";
let userBalance = { BTC: 0, USDT: 0 };

const WITHDRAW_FEES = {
  USDT: { TRC20: 1, ERC20: 5, BEP20: 0.5 },
  BTC: { "BTC Network": 0.0001, Lightning: 0.00001 },
};

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

      if (data.kycStatus !== "approved") {
        showToast("Complete KYC to withdraw", "warning");
      }
    });

  db.collection("wallets")
    .doc(user.uid)
    .onSnapshot((doc) => {
      if (!doc.exists) return;
      userBalance = doc.data();
      updateBalanceDisplay();
    });

  renderWdNetworks();
});

function updateBalanceDisplay() {
  const bal = userBalance[withdrawCrypto] || 0;
  const decimals = withdrawCrypto === "BTC" ? 8 : 2;
  document.getElementById("wd-balance").textContent = `${bal.toFixed(
    decimals
  )} ${withdrawCrypto}`;
  document.getElementById("wd-max-display").textContent = bal.toFixed(decimals);
}

function selectWithdrawCrypto(crypto) {
  withdrawCrypto = crypto;
  document
    .getElementById("wd-usdt")
    .classList.toggle("active", crypto === "USDT");
  document
    .getElementById("wd-btc")
    .classList.toggle("active", crypto === "BTC");
  document.getElementById("wd-amount-suffix").textContent = crypto;
  withdrawNetwork = "";
  document.getElementById("wd-address").value = "";
  document.getElementById("wd-amount").value = "";
  updateBalanceDisplay();
  renderWdNetworks();
  updateWdSummary();
}

function renderWdNetworks() {
  const container = document.getElementById("wd-network-options");
  const networks = NETWORK_INFO[withdrawCrypto];

  container.innerHTML = networks
    .map(
      (n, i) => `
    <button class="crypto-pill ${
      i === 0 ? "active" : ""
    }" onclick="selectWdNetwork('${n.key}', this)">
      ${n.key}
    </button>
  `
    )
    .join("");

  withdrawNetwork = networks[0].key;
  updateWdSummary();
}

function selectWdNetwork(network, btn) {
  withdrawNetwork = network;
  document
    .querySelectorAll("#wd-network-options .crypto-pill")
    .forEach((b) => b.classList.remove("active"));
  btn.classList.add("active");
  updateWdSummary();
}

function setMaxWithdraw() {
  const bal = userBalance[withdrawCrypto] || 0;
  document.getElementById("wd-amount").value = bal;
  updateWdSummary();
}

function updateWdSummary() {
  const amount = parseFloat(document.getElementById("wd-amount").value) || 0;
  const fee = WITHDRAW_FEES[withdrawCrypto]?.[withdrawNetwork] || 0;
  const receive = Math.max(0, amount - fee);
  const decimals = withdrawCrypto === "BTC" ? 8 : 2;

  document.getElementById("wd-fee").textContent = `${fee} ${withdrawCrypto}`;
  document.getElementById("wd-receive").textContent = `${receive.toFixed(
    decimals
  )} ${withdrawCrypto}`;
}

function submitWithdrawal() {
  const user = auth.currentUser;
  const address = document.getElementById("wd-address").value.trim();
  const amount = parseFloat(document.getElementById("wd-amount").value);
  const balance = userBalance[withdrawCrypto] || 0;
  const fee = WITHDRAW_FEES[withdrawCrypto]?.[withdrawNetwork] || 0;

  if (!address) {
    showToast("Please enter withdrawal address", "error");
    return;
  }
  if (!amount || amount <= 0) {
    showToast("Please enter a valid amount", "error");
    return;
  }
  if (amount > balance) {
    showToast("Insufficient balance", "error");
    return;
  }
  if (amount <= fee) {
    showToast("Amount must be greater than network fee", "error");
    return;
  }

  const btn = document.querySelector(".btn-primary");
  btn.disabled = true;
  btn.textContent = "Submitting...";

  const receiveAmount = amount - fee;

  db.collection("withdrawals")
    .add({
      userId: user.uid,
      userEmail: user.email,
      crypto: withdrawCrypto,
      network: withdrawNetwork,
      address,
      amount,
      fee,
      receiveAmount,
      status: "pending",
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    })
    .then(() => {
      // Deduct from balance immediately (will be refunded if rejected)
      return db
        .collection("wallets")
        .doc(user.uid)
        .update({
          [withdrawCrypto]: firebase.firestore.FieldValue.increment(-amount),
        });
    })
    .then(() => {
      showToast("Withdrawal request submitted!", "success");
      document.getElementById("wd-address").value = "";
      document.getElementById("wd-amount").value = "";
      updateWdSummary();
    })
    .catch((err) => {
      showToast(err.message, "error");
    })
    .finally(() => {
      btn.disabled = false;
      btn.textContent = "Submit Withdrawal Request";
    });
}
