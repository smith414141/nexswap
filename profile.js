let currentUserData = null;
let currentWallet = null;
let currentDocType = "";

auth.onAuthStateChanged((user) => {
  if (!user || !user.emailVerified) return;

  document.getElementById("profile-email").textContent = user.email;

  db.collection("users")
    .doc(user.uid)
    .get()
    .then((doc) => {
      if (!doc.exists) return;
      currentUserData = doc.data();
      document.getElementById("profile-name").textContent =
        currentUserData.name || "User";
      document.getElementById("profile-avatar").textContent =
        (currentUserData.name || "U")[0].toUpperCase();

      // Prefill personal info
      document.getElementById("pi-name").value = currentUserData.name || "";
      document.getElementById("pi-phone").value = currentUserData.phone || "";
      document.getElementById("pi-country").value =
        currentUserData.country || "ET";
      document.getElementById("pi-dob").value = currentUserData.dob || "";
      document.getElementById("pi-address").value =
        currentUserData.address || "";

      updateKycDisplay(
        currentUserData.kycStatus,
        currentUserData.kycRejectionReason
      );
      updateMerchantDisplay(
        currentUserData.merchantStatus,
        currentUserData.kycStatus
      );
      updateTopBadge(currentUserData.kycStatus);
    });

  db.collection("wallets")
    .doc(user.uid)
    .get()
    .then((doc) => {
      if (doc.exists) currentWallet = doc.data();
    });
});

// ---- MODAL HELPERS ----
function openModal(id) {
  document.getElementById(id).style.display = "flex";
}
function closeModal(id) {
  document.getElementById(id).style.display = "none";
}

function openPersonalInfo() {
  openModal("personal-modal");
}

function openKycPage() {
  openModal("kyc-modal");
}

function openMerchantPage() {
  if (!currentUserData || currentUserData.kycStatus !== "approved") {
    document.getElementById("merchant-modal-locked").style.display = "block";
    document.getElementById("merchant-modal-none").style.display = "none";
    document.getElementById("merchant-modal-pending").style.display = "none";
    document.getElementById("merchant-modal-approved").style.display = "none";
  } else {
    checkMerchantBalance();
    checkMerchantTwoFa();
  }
  openModal("merchant-modal");
}

// ---- TOP BADGE ----
function updateTopBadge(status) {
  const badge = document.getElementById("kyc-badge");
  if (status === "approved") {
    badge.textContent = "Verified";
    badge.className = "kyc-badge approved";
  } else if (status === "pending") {
    badge.textContent = "KYC Pending";
    badge.className = "kyc-badge pending";
  } else {
    badge.textContent = "No KYC";
    badge.className = "kyc-badge none";
  }
}

// ---- KYC DISPLAY ----
function updateKycDisplay(status, rejectionReason) {
  const sub = document.getElementById("kyc-menu-sub");
  const statusIcon = document.getElementById("kyc-menu-status");

  [
    "kyc-modal-none",
    "kyc-modal-pending",
    "kyc-modal-approved",
    "kyc-modal-rejected",
  ].forEach((id) => {
    document.getElementById(id).style.display = "none";
  });

  if (status === "pending") {
    sub.textContent = "Under review";
    statusIcon.textContent = "⏳";
    document.getElementById("kyc-modal-pending").style.display = "block";
  } else if (status === "approved") {
    sub.textContent = "Verified";
    statusIcon.textContent = "✅";
    document.getElementById("kyc-modal-approved").style.display = "block";
  } else if (status === "rejected") {
    sub.textContent = "Rejected — resubmit";
    statusIcon.textContent = "❌";
    document.getElementById("kyc-modal-rejected").style.display = "block";
    if (rejectionReason)
      document.getElementById("rejection-reason").textContent = rejectionReason;
  } else {
    sub.textContent = "Not submitted";
    statusIcon.textContent = "❌";
    document.getElementById("kyc-modal-none").style.display = "block";
  }
}

// ---- DOC TYPE SWITCH ----
function onDocTypeChange() {
  currentDocType = document.getElementById("doc-type").value;
  document.getElementById("doc-passport").style.display = "none";
  document.getElementById("doc-twoside").style.display = "none";

  if (currentDocType === "passport") {
    document.getElementById("doc-passport").style.display = "block";
  } else if (
    currentDocType === "national_id" ||
    currentDocType === "drivers_license"
  ) {
    document.getElementById("doc-twoside").style.display = "block";
  }
}

function resetKycForm() {
  document.getElementById("kyc-modal-rejected").style.display = "none";
  document.getElementById("kyc-modal-none").style.display = "block";
}

// ---- MERCHANT DISPLAY ----
function updateMerchantDisplay(merchantStatus, kycStatus) {
  const sub = document.getElementById("merchant-menu-sub");
  const cta = document.getElementById("merchant-cta");

  if (kycStatus !== "approved") {
    sub.textContent = "Locked — complete KYC first";
    cta.style.display = "none";
    return;
  }

  if (merchantStatus === "pending") {
    sub.textContent = "Application under review";
    cta.style.display = "none";
  } else if (merchantStatus === "approved") {
    sub.textContent = "Active merchant";
    cta.style.display = "none";
  } else {
    sub.textContent = "Tap to apply";
    cta.style.display = "block";
    checkMerchantBalance();
    checkMerchantTwoFa();
  }

  // Set modal state
  document.getElementById("merchant-modal-locked").style.display = "none";
  [
    "merchant-modal-none",
    "merchant-modal-pending",
    "merchant-modal-approved",
  ].forEach((id) => {
    document.getElementById(id).style.display = "none";
  });

  if (merchantStatus === "pending") {
    document.getElementById("merchant-modal-pending").style.display = "block";
  } else if (merchantStatus === "approved") {
    document.getElementById("merchant-modal-approved").style.display = "block";
  } else {
    document.getElementById("merchant-modal-none").style.display = "block";
  }
}

function checkMerchantBalance() {
  if (!currentWallet) return;
  const usdtValue = (currentWallet.USDT || 0) * 1;
  const btcValue =
    (currentWallet.BTC || 0) *
    (typeof CRYPTO_PRICES !== "undefined" ? CRYPTO_PRICES.BTC : 67500);
  const total = usdtValue + btcValue;

  const req2 = document.getElementById("merchant-req-2");
  if (req2) req2.textContent = total >= 300 ? "✅" : "❌";
}

// Checks 2FA status (live from Firestore) and reflects it on the merchant
// checklist row. Runs whenever the merchant modal opens, so it's always
// current even if the user just enabled 2FA moments before.
function checkMerchantTwoFa() {
  const user = auth.currentUser;
  if (!user) return;
  db.collection("users")
    .doc(user.uid)
    .get()
    .then((doc) => {
      const data = doc.data() || {};
      const req4 = document.getElementById("merchant-req-4");
      if (req4) req4.textContent = data.twoFaEnabled ? "✅" : "❌";
      currentUserData = { ...currentUserData, twoFaEnabled: data.twoFaEnabled };
    });
}

// ---- PERSONAL INFO ----
function savePersonalInfo() {
  const user = auth.currentUser;
  const name = document.getElementById("pi-name").value.trim();
  const phone = document.getElementById("pi-phone").value.trim();
  const country = document.getElementById("pi-country").value;
  const dob = document.getElementById("pi-dob").value;
  const address = document.getElementById("pi-address").value.trim();

  if (!name || !phone) {
    showToast("Name and phone are required", "error");
    return;
  }

  db.collection("users")
    .doc(user.uid)
    .update({
      name,
      phone,
      country,
      dob,
      address,
    })
    .then(() => {
      showToast("Profile updated!", "success");
      document.getElementById("profile-name").textContent = name;
      document.getElementById("profile-avatar").textContent =
        name[0].toUpperCase();
      closeModal("personal-modal");
    })
    .catch((err) => showToast(err.message, "error"));
}

// ---- FILE HELPERS ----
function previewFile(input, previewId) {
  const file = input.files[0];
  if (!file) return;

  if (file.size > 2 * 1024 * 1024) {
    showToast("File too large. Max 2MB.", "error");
    input.value = "";
    return;
  }

  const reader = new FileReader();
  reader.onload = (e) => {
    const preview = document.getElementById(previewId);
    preview.src = e.target.result;
    preview.style.display = "block";
  };
  reader.readAsDataURL(file);
}

function fileToBase64(input) {
  return new Promise((resolve, reject) => {
    const file = input.files[0];
    if (!file) {
      reject("No file");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// ---- SUBMIT KYC ----
function submitKyc() {
  const docType = document.getElementById("doc-type").value;
  if (!docType) {
    showToast("Please select a document type", "error");
    return;
  }

  const user = auth.currentUser;
  let images = {};

  if (docType === "passport") {
    const input = document.getElementById("id-front");
    if (!input.files[0]) {
      showToast("Please upload your passport photo page", "error");
      return;
    }
  } else {
    const front = document.getElementById("id-front-2");
    const back = document.getElementById("id-back");
    if (!front.files[0] || !back.files[0]) {
      showToast("Please upload both front and back", "error");
      return;
    }
  }

  const btn = document.querySelector("#kyc-modal-none .btn-primary");
  btn.disabled = true;
  btn.textContent = "Submitting...";

  let promises = [];
  if (docType === "passport") {
    promises.push(
      fileToBase64(document.getElementById("id-front")).then(
        (b64) => (images.front = b64)
      )
    );
  } else {
    promises.push(
      fileToBase64(document.getElementById("id-front-2")).then(
        (b64) => (images.front = b64)
      )
    );
    promises.push(
      fileToBase64(document.getElementById("id-back")).then(
        (b64) => (images.back = b64)
      )
    );
  }

  Promise.all(promises)
    .then(() => {
      return db
        .collection("kyc")
        .doc(user.uid)
        .set({
          userId: user.uid,
          userEmail: user.email,
          userName: currentUserData ? currentUserData.name : "",
          docType,
          images,
          status: "pending",
          submittedAt: firebase.firestore.FieldValue.serverTimestamp(),
        });
    })
    .then(() => {
      return db.collection("users").doc(user.uid).update({
        kycStatus: "pending",
        kycRejectionReason: firebase.firestore.FieldValue.delete(),
      });
    })
    .then(() => {
      showToast("KYC submitted for review!", "success");
      updateKycDisplay("pending");
      updateTopBadge("pending");
      setTimeout(() => closeModal("kyc-modal"), 1000);
    })
    .catch((err) => {
      showToast(err.message, "error");
      btn.disabled = false;
      btn.textContent = "Submit for Review";
    });
}

// ---- APPLY MERCHANT ----
function applyMerchant() {
  const input = document.getElementById("residence-upload");
  if (!input.files[0]) {
    showToast("Please upload proof of residence", "error");
    return;
  }

  if (!currentWallet) {
    showToast("Wallet data not loaded yet, try again", "error");
    return;
  }

  const usdtValue = (currentWallet.USDT || 0) * 1;
  const btcValue =
    (currentWallet.BTC || 0) *
    (typeof CRYPTO_PRICES !== "undefined" ? CRYPTO_PRICES.BTC : 67500);
  const total = usdtValue + btcValue;

  if (total < 300) {
    showToast("You need at least $300 in your balance to apply", "error");
    return;
  }

  const user = auth.currentUser;

  // 2FA is required before a merchant application can be submitted.
  // Re-checked live here (not just from cached currentUserData) so a stale
  // page state can't bypass the requirement.
  db.collection("users")
    .doc(user.uid)
    .get()
    .then((doc) => {
      const data = doc.data() || {};
      if (!data.twoFaEnabled) {
        showToast("Enable 2FA before applying as a merchant", "error");
        const req4 = document.getElementById("merchant-req-4");
        if (req4) req4.textContent = "❌";
        return;
      }

      const btn = document.querySelector("#merchant-modal-none .btn-primary");
      btn.disabled = true;
      btn.textContent = "Submitting...";

      fileToBase64(input)
        .then((base64) => {
          return db
            .collection("merchantApplications")
            .doc(user.uid)
            .set({
              userId: user.uid,
              userEmail: user.email,
              userName: currentUserData ? currentUserData.name : "",
              residenceImage: base64,
              balanceAtApplication: total,
              twoFaEnabled: true,
              status: "pending",
              submittedAt: firebase.firestore.FieldValue.serverTimestamp(),
            });
        })
        .then(() => {
          return db
            .collection("users")
            .doc(user.uid)
            .update({ merchantStatus: "pending" });
        })
        .then(() => {
          showToast("Merchant application submitted!", "success");
          updateMerchantDisplay("pending", "approved");
          setTimeout(() => closeModal("merchant-modal"), 1000);
        })
        .catch((err) => {
          showToast(err.message, "error");
          btn.disabled = false;
          btn.textContent = "Apply to Become Merchant";
        });
    });
}

// ---- ORDER HISTORY ----
function loadOrderHistory(uid) {
  db.collection("p2pOrders")
    .where("buyerUid", "==", uid)
    .get()
    .then((buyerSnap) => {
      db.collection("p2pOrders")
        .where("sellerUid", "==", uid)
        .get()
        .then((sellerSnap) => {
          const orders = [];
          buyerSnap.forEach((doc) =>
            orders.push({ id: doc.id, ...doc.data(), role: "buyer" })
          );
          sellerSnap.forEach((doc) =>
            orders.push({ id: doc.id, ...doc.data(), role: "seller" })
          );

          orders.sort(
            (a, b) =>
              (b.createdAt?.toMillis?.() || 0) -
              (a.createdAt?.toMillis?.() || 0)
          );

          const container = document.getElementById("order-history");
          if (orders.length === 0) return;

          container.innerHTML = orders
            .slice(0, 10)
            .map(
              (o) => `
            <div class="card" style="margin-bottom:8px; display:flex; justify-content:space-between; align-items:center;">
              <div>
                <span class="order-type ${
                  o.role === "buyer" ? "buy" : "sell"
                }">${o.role === "buyer" ? "BUY" : "SELL"}</span>
                <span style="font-size:13px; font-weight:700; margin-left:6px;">${
                  o.crypto
                }</span>
              </div>
              <div style="text-align:right;">
                <div style="font-size:13px; font-weight:700;">${o.fiatAmount} ${
                o.currency
              }</div>
                <span class="badge badge-${getOrderStatusColor(o.status)}">${
                o.status
              }</span>
              </div>
            </div>
          `
            )
            .join("");
        });
    })
    .catch((err) => console.error(err));
}

function getOrderStatusColor(status) {
  if (status === "completed") return "green";
  if (status === "cancelled" || status === "disputed") return "red";
  return "yellow";
}

// ---- LOGOUT ----
function logoutUser() {
  auth.signOut().then(() => {
    window.location.href = "/";
  });
}

// ---- TRANSACTIONS ----
function loadTransactions() {
  const user = auth.currentUser;
  const container = document.getElementById("transactions-list");
  container.innerHTML = '<div class="empty-state">Loading...</div>';

  db.collection("transactions")
    .where("userId", "==", user.uid)
    .get()
    .then((snapshot) => {
      if (snapshot.empty) {
        container.innerHTML =
          '<div class="empty-state">No transactions yet</div>';
        return;
      }
      const txns = [];
      snapshot.forEach((doc) => txns.push(doc.data()));
      txns.sort(
        (a, b) =>
          (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0)
      );

      container.innerHTML = txns
        .map(
          (t) => `
      <div class="card" style="margin-bottom:8px;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
          <span style="font-weight:700; font-size:13px;">${getTransactionLabel(
            t.type
          )}</span>
          <span class="badge badge-${getTxnColor(t.type)}">${t.amount} ${
            t.crypto
          }</span>
        </div>
        ${
          t.note
            ? `<div style="font-size:11px; color:var(--text2);">${t.note}</div>`
            : ""
        }
        <div style="font-size:10px; color:var(--text3); margin-top:4px;">${formatTxnTime(
          t.createdAt
        )}</div>
      </div>
    `
        )
        .join("");
    })
    .catch(
      (err) =>
        (container.innerHTML =
          '<div class="empty-state">Error: ' + err.message + "</div>")
    );
}

function getTransactionLabel(type) {
  const labels = {
    deposit: "⬇️ Deposit",
    withdrawal: "⬆️ Withdrawal",
    withdrawal_refund: "↩️ Withdrawal Refund",
    adjustment: "⚙️ Balance Adjustment",
    p2p_buy: "🔄 P2P Buy",
    p2p_sell: "🔄 P2P Sell",
    p2p_refund: "↩️ P2P Refund",
  };
  return labels[type] || type;
}

function getTxnColor(type) {
  if (["deposit", "p2p_buy", "withdrawal_refund", "p2p_refund"].includes(type))
    return "green";
  if (["withdrawal", "p2p_sell"].includes(type)) return "yellow";
  return "grey";
}

function formatTxnTime(timestamp) {
  if (!timestamp || !timestamp.toDate) return "--";
  return timestamp.toDate().toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
