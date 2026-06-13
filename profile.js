let currentUserData = null;
let currentWallet = null;

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

  loadOrderHistory(user.uid);
});

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

function updateKycDisplay(status, rejectionReason) {
  ["kyc-none", "kyc-pending", "kyc-approved", "kyc-rejected"].forEach((id) => {
    document.getElementById(id).style.display = "none";
  });

  if (status === "pending") {
    document.getElementById("kyc-pending").style.display = "block";
  } else if (status === "approved") {
    document.getElementById("kyc-approved").style.display = "block";
  } else if (status === "rejected") {
    document.getElementById("kyc-rejected").style.display = "block";
    if (rejectionReason) {
      document.getElementById("rejection-reason").textContent = rejectionReason;
    }
  } else {
    document.getElementById("kyc-none").style.display = "block";
  }
}

function updateMerchantDisplay(merchantStatus, kycStatus) {
  const section = document.getElementById("merchant-section");

  if (kycStatus !== "approved") {
    section.style.display = "none";
    return;
  }
  section.style.display = "block";

  ["merchant-none", "merchant-pending", "merchant-approved"].forEach((id) => {
    document.getElementById(id).style.display = "none";
  });

  if (merchantStatus === "pending") {
    document.getElementById("merchant-pending").style.display = "block";
  } else if (merchantStatus === "approved") {
    document.getElementById("merchant-approved").style.display = "block";
  } else {
    document.getElementById("merchant-none").style.display = "block";
    // Check $300 balance requirement
    checkMerchantBalance();
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
  if (total >= 300) {
    req2.textContent = "✅";
  } else {
    req2.textContent = "❌";
  }
}

// ---- FILE PREVIEW ----
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
  const input = document.getElementById("id-upload");
  if (!input.files[0]) {
    showToast("Please upload your ID or Passport", "error");
    return;
  }

  const user = auth.currentUser;
  const btn = document.querySelector("#kyc-none .btn-primary");
  btn.disabled = true;
  btn.textContent = "Submitting...";

  fileToBase64(input)
    .then((base64) => {
      return db
        .collection("kyc")
        .doc(user.uid)
        .set({
          userId: user.uid,
          userEmail: user.email,
          userName: currentUserData ? currentUserData.name : "",
          idImage: base64,
          status: "pending",
          submittedAt: firebase.firestore.FieldValue.serverTimestamp(),
        });
    })
    .then(() => {
      return db
        .collection("users")
        .doc(user.uid)
        .update({ kycStatus: "pending" });
    })
    .then(() => {
      showToast("KYC submitted for review!", "success");
      updateKycDisplay("pending");
      updateTopBadge("pending");
    })
    .catch((err) => {
      showToast(err.message, "error");
      btn.disabled = false;
      btn.textContent = "Submit for Review";
    });
}

function resubmitKyc() {
  const input = document.getElementById("id-upload-2");
  if (!input.files[0]) {
    showToast("Please upload your ID or Passport", "error");
    return;
  }

  const user = auth.currentUser;
  const btn = document.querySelector("#kyc-rejected .btn-primary");
  btn.disabled = true;
  btn.textContent = "Submitting...";

  fileToBase64(input)
    .then((base64) => {
      return db
        .collection("kyc")
        .doc(user.uid)
        .set({
          userId: user.uid,
          userEmail: user.email,
          userName: currentUserData ? currentUserData.name : "",
          idImage: base64,
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
      showToast("KYC resubmitted for review!", "success");
      updateKycDisplay("pending");
      updateTopBadge("pending");
    })
    .catch((err) => {
      showToast(err.message, "error");
      btn.disabled = false;
      btn.textContent = "Resubmit";
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
  const btn = document.querySelector("#merchant-none .btn-primary");
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
    })
    .catch((err) => {
      showToast(err.message, "error");
      btn.disabled = false;
      btn.textContent = "Apply to Become Merchant";
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
