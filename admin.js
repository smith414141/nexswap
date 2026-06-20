// ---- HELPERS ----
function openModal(id) {
  document.getElementById(id).style.display = "flex";
}
function closeModal(id) {
  document.getElementById(id).style.display = "none";
}

function openImage(src) {
  const overlay = document.createElement("div");
  overlay.className = "img-overlay";
  overlay.innerHTML = `<img src="${src}" /><div class="img-close" onclick="this.parentElement.remove()">✕</div>`;
  overlay.onclick = (e) => {
    if (e.target === overlay) overlay.remove();
  };
  document.body.appendChild(overlay);
}

function logTransaction(userId, type, crypto, amount, currency, note) {
  db.collection("transactions").add({
    userId,
    type,
    crypto,
    amount,
    currency: currency || null,
    note: note || "",
    status: "completed",
    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
  });
}

function setSubTabActive(btn) {
  if (!btn) return;
  btn.parentElement
    .querySelectorAll(".tab")
    .forEach((t) => t.classList.remove("active"));
  btn.classList.add("active");
}

function getStatusBadgeClassAdmin(status) {
  if (status === "completed") return "badge-green";
  if (status === "cancelled" || status === "disputed") return "badge-red";
  return "badge-yellow";
}

// ---- AUTH ----
function adminLogin() {
  const email = document.getElementById("admin-email").value.trim();
  const password = document.getElementById("admin-password").value;
  if (!email || !password) {
    showToast("Fill in all fields", "error");
    return;
  }

  auth
    .signInWithEmailAndPassword(email, password)
    .then((cred) => db.collection("admins").doc(cred.user.email).get())
    .then((doc) => {
      if (!doc.exists) {
        auth.signOut();
        showToast("Not authorized as admin", "error");
        return;
      }
      enterAdminDashboard();
    })
    .catch((err) => showToast(err.message, "error"));
}

function adminLogout() {
  auth.signOut().then(() => {
    document.getElementById("admin-login").style.display = "flex";
    document.getElementById("admin-dashboard").style.display = "none";
  });
}

function enterAdminDashboard() {
  document.getElementById("admin-login").style.display = "none";
  document.getElementById("admin-dashboard").style.display = "block";
  loadDashboardStats();
}

auth.onAuthStateChanged((user) => {
  if (user) {
    db.collection("admins")
      .doc(user.email)
      .get()
      .then((doc) => {
        if (doc.exists) enterAdminDashboard();
      });
  }
});

// ---- TABS ----
function switchAdminTab(tab, btn) {
  document
    .querySelectorAll(".admin-tabs .filter-tab")
    .forEach((b) => b.classList.remove("active"));
  btn.classList.add("active");
  document
    .querySelectorAll(".admin-tab-content")
    .forEach((c) => (c.style.display = "none"));
  document.getElementById("tab-" + tab).style.display = "block";

  if (tab === "dashboard") loadDashboardStats();
  if (tab === "kyc") loadKycList("pending");
  if (tab === "merchants") loadMerchantList("pending");
  if (tab === "withdrawals") loadWithdrawalsList("pending");
  if (tab === "p2p") loadP2pOrders("active");
  if (tab === "users") loadUsersList();
  if (tab === "admins") loadAdminsList();
  if (tab === "listings") {
    populateFakeListingCurrencyDropdown();
    loadFakeListingsBrowser();
    loadListingsAdmin();
  }
  if (tab === "support") loadSupportChats();
  if (tab === "announcements") loadAnnouncementsAdmin();
}
// ---- DEMO/FAKE LISTING BROWSER (edit randomly-generated listings) ----
function populateFakeListingCurrencyDropdown() {
  const select = document.getElementById("fl-browse-currency");
  if (select.options.length > 0) return; // already populated
  select.innerHTML = CURRENCIES.map(
    (c) => `<option value="${c.code}">${c.flag} ${c.code}</option>`
  ).join("");
}

function loadFakeListingsBrowser() {
  const container = document.getElementById("fake-listings-browser-list");
  container.innerHTML = '<div class="empty-state">Loading...</div>';

  const currency = document.getElementById("fl-browse-currency").value;
  const crypto = document.getElementById("fl-browse-crypto").value;
  const type = document.getElementById("fl-browse-type").value;

  const fakeListings = generateListings(currency, crypto, type);

  applyListingOverrides(fakeListings).then((listings) => {
    container.innerHTML = listings
      .map(
        (l) => `
      <div class="card" style="margin-bottom:10px;">
        <div style="display:flex; justify-content:space-between; margin-bottom:8px;">
          <span style="font-weight:700; font-size:13px;">${l.name}</span>
          <span class="badge badge-${l.online ? "green" : "grey"}">${
          l.online ? "Online" : "Offline"
        }</span>
        </div>
        <div class="payment-info-row"><span>Price</span><strong>${l.price} ${
          l.currency
        }</strong></div>
        <div class="payment-info-row"><span>Limits</span><strong>${
          l.minLimit
        } - ${l.maxLimit} ${l.currency}</strong></div>
        <div class="payment-info-row"><span>Available</span><strong>${
          l.available
        } ${l.crypto}</strong></div>
        <button class="btn-primary" style="margin-top:8px;" onclick='openFakeListingEditModal(${JSON.stringify(
          l
        )})'>Edit</button>
      </div>
    `
      )
      .join("");
  });
}

function openFakeListingEditModal(listing) {
  document.getElementById("fl-id").value = listing.id;
  document.getElementById("fl-name").value = listing.name;
  document.getElementById("fl-online").value = listing.online
    ? "true"
    : "false";
  document.getElementById("fl-price").value = listing.price;
  document.getElementById("fl-min").value = listing.minLimit;
  document.getElementById("fl-max").value = listing.maxLimit;
  document.getElementById("fl-available").value = listing.available;
  openModal("fake-listing-edit-modal");
}

function recalcFakeAvailable() {
  const price = parseFloat(document.getElementById("fl-price").value);
  const max = parseFloat(document.getElementById("fl-max").value);
  const availableField = document.getElementById("fl-available");

  if (!price || price <= 0 || !max || max <= 0) {
    availableField.value = "";
    return;
  }
  // Available crypto = Max limit (in local currency) ÷ Price (local currency per 1 crypto)
  availableField.value = (max / price).toFixed(4);
}

function saveFakeListingOverride() {
  recalcFakeAvailable();
  const id = document.getElementById("fl-id").value;
  const name = document.getElementById("fl-name").value.trim();
  const online = document.getElementById("fl-online").value === "true";
  const price = parseFloat(document.getElementById("fl-price").value);
  const minLimit = parseFloat(document.getElementById("fl-min").value);
  const maxLimit = parseFloat(document.getElementById("fl-max").value);
  const available = parseFloat(document.getElementById("fl-available").value);

  if (!name || !price || !minLimit || !maxLimit || !available) {
    showToast("Fill in all fields", "error");
    return;
  }
  if (minLimit >= maxLimit) {
    showToast("Min limit must be less than max limit", "error");
    return;
  }

  db.collection("listingOverrides")
    .doc(id)
    .set({
      name,
      online,
      price,
      minLimit,
      maxLimit,
      available,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
    })
    .then(() => {
      showToast("Saved! Visible to all users now.", "success");
      closeModal("fake-listing-edit-modal");
      loadFakeListingsBrowser();
    })
    .catch((err) => showToast(err.message, "error"));
}

function resetFakeListingOverride() {
  const id = document.getElementById("fl-id").value;
  if (!confirm("Reset this listing back to its default generated values?"))
    return;
  db.collection("listingOverrides")
    .doc(id)
    .delete()
    .then(() => {
      showToast("Reset to default", "success");
      closeModal("fake-listing-edit-modal");
      loadFakeListingsBrowser();
    })
    .catch((err) => showToast(err.message, "error"));
}

function loadListingsAdmin() {
  const container = document.getElementById("admin-listings-list");
  container.innerHTML = '<div class="empty-state">Loading...</div>';

  db.collection("listings")
    .get()
    .then((snapshot) => {
      if (snapshot.empty) {
        container.innerHTML =
          '<div class="empty-state">No merchant listings</div>';
        return;
      }
      container.innerHTML = "";
      snapshot.forEach((doc) => {
        const l = doc.data();
        const id = doc.id;
        container.innerHTML += `
        <div class="card" style="margin-bottom:10px;">
          <div style="display:flex; justify-content:space-between; margin-bottom:8px;">
            <span class="order-type ${l.type}">${l.type.toUpperCase()} ${
          l.crypto
        }</span>
            <span class="badge badge-${
              l.status === "active" ? "green" : "grey"
            }">${l.status}</span>
          </div>
          <div style="font-size:11px; color:var(--text2); margin-bottom:6px;">${
            l.merchantName
          } (${l.merchantUid})</div>
          <div class="payment-info-row"><span>Rate</span><strong>${l.rate} ${
          l.currency
        }</strong></div>
          <div class="payment-info-row"><span>Limits</span><strong>${
            l.minLimit
          } - ${l.maxLimit} ${l.currency}</strong></div>
          <div class="payment-info-row"><span>Available</span><strong>${
            l.available
          } ${l.crypto}</strong></div>
          <div style="display:flex; gap:8px; margin-top:10px;">
            <button class="btn-primary" style="margin:0; flex:1; padding:8px;" onclick="openMerchantEditModal('${id}')">🔒 Admin Edit</button>
            <button class="btn-secondary" style="margin:0; flex:1; padding:8px; border-color:var(--red); color:var(--red);" onclick="deleteListingAdmin('${id}')">Delete</button>
          </div>
        </div>
      `;
      });
    })
    .catch(
      (err) =>
        (container.innerHTML =
          '<div class="empty-state">Error: ' + err.message + "</div>")
    );
}

// ---- FULL MERCHANT EDIT (admin impersonation: edit listing + wallet) ----
function openMerchantEditModal(listingId) {
  const content = document.getElementById("merchant-edit-modal");
  document.getElementById("me-listing-id").value = listingId;

  db.collection("listings")
    .doc(listingId)
    .get()
    .then((doc) => {
      if (!doc.exists) {
        showToast("Listing not found", "error");
        return;
      }
      const l = doc.data();
      document.getElementById("me-merchant-uid").value = l.merchantUid;
      document.getElementById("me-merchant-name").value = l.merchantName || "";
      document.getElementById("me-online-status").value =
        l.online === false ? "false" : "true";
      document.getElementById("me-rate").value = l.rate;
      document.getElementById("me-min").value = l.minLimit;
      document.getElementById("me-max").value = l.maxLimit;
      document.getElementById("me-available").value = l.available;
      document.getElementById("me-listing-status").value = l.status;

      return db.collection("wallets").doc(l.merchantUid).get();
    })
    .then((walletDoc) => {
      const w =
        walletDoc && walletDoc.exists ? walletDoc.data() : { BTC: 0, USDT: 0 };
      document.getElementById("me-wallet-btc").value = w.BTC || 0;
      document.getElementById("me-wallet-usdt").value = w.USDT || 0;
      openModal("merchant-edit-modal");
    })
    .catch((err) => showToast(err.message, "error"));
}

function saveMerchantEdit() {
  const listingId = document.getElementById("me-listing-id").value;
  const merchantUid = document.getElementById("me-merchant-uid").value;

  const merchantName = document.getElementById("me-merchant-name").value.trim();
  const online = document.getElementById("me-online-status").value === "true";
  const rate = parseFloat(document.getElementById("me-rate").value);
  const minLimit = parseFloat(document.getElementById("me-min").value);
  const maxLimit = parseFloat(document.getElementById("me-max").value);
  const available = parseFloat(document.getElementById("me-available").value);
  const status = document.getElementById("me-listing-status").value;

  const btc = parseFloat(document.getElementById("me-wallet-btc").value) || 0;
  const usdt = parseFloat(document.getElementById("me-wallet-usdt").value) || 0;

  if (!merchantName || !rate || !minLimit || !maxLimit || !available) {
    showToast("Please fill in all listing fields", "error");
    return;
  }
  if (minLimit >= maxLimit) {
    showToast("Min limit must be less than max limit", "error");
    return;
  }

  Promise.all([
    db.collection("listings").doc(listingId).update({
      merchantName,
      online,
      rate,
      minLimit,
      maxLimit,
      available,
      status,
    }),
    db.collection("users").doc(merchantUid).update({
      merchantDisplayName: merchantName,
    }),
    db
      .collection("wallets")
      .doc(merchantUid)
      .set({ BTC: btc, USDT: usdt }, { merge: true }),
  ])
    .then(() => {
      showToast("Merchant data updated!", "success");
      closeModal("merchant-edit-modal");
      loadListingsAdmin();
    })
    .catch((err) => showToast(err.message, "error"));
}

function deleteListingAdmin(id) {
  if (!confirm("Delete this listing?")) return;
  db.collection("listings")
    .doc(id)
    .delete()
    .then(() => {
      showToast("Deleted", "success");
      loadListingsAdmin();
    })
    .catch((err) => showToast(err.message, "error"));
}

// ---- DASHBOARD ----
function loadDashboardStats() {
  db.collection("kyc")
    .where("status", "==", "pending")
    .get()
    .then((s) => (document.getElementById("stat-kyc").textContent = s.size));
  db.collection("merchantApplications")
    .where("status", "==", "pending")
    .get()
    .then(
      (s) => (document.getElementById("stat-merchants").textContent = s.size)
    );
  db.collection("withdrawals")
    .where("status", "==", "pending")
    .get()
    .then(
      (s) => (document.getElementById("stat-withdrawals").textContent = s.size)
    );
  db.collection("p2pOrders")
    .where("status", "in", ["awaiting_payment", "awaiting_release"])
    .get()
    .then((s) => (document.getElementById("stat-p2p").textContent = s.size));
  db.collection("p2pOrders")
    .where("status", "==", "disputed")
    .get()
    .then(
      (s) => (document.getElementById("stat-disputed").textContent = s.size)
    );
  db.collection("users")
    .get()
    .then((s) => (document.getElementById("stat-users").textContent = s.size));
}

// ---- KYC ----
function loadKycList(status, btn) {
  setSubTabActive(btn);
  const container = document.getElementById("kyc-list");
  container.innerHTML = '<div class="empty-state">Loading...</div>';

  db.collection("kyc")
    .where("status", "==", status)
    .get()
    .then((snapshot) => {
      if (snapshot.empty) {
        container.innerHTML =
          '<div class="empty-state">No ' + status + " KYC submissions</div>";
        return;
      }
      container.innerHTML = "";
      snapshot.forEach((doc) => {
        const d = doc.data();
        const uid = doc.id;
        const images = d.images || {};
        container.innerHTML += `
        <div class="card" style="margin-bottom:10px;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
            <div>
              <div style="font-weight:700; font-size:14px;">${
                d.userName || "Unknown"
              }</div>
              <div style="font-size:11px; color:var(--text2);">${
                d.userEmail
              }</div>
            </div>
            <span class="badge badge-grey">${d.docType}</span>
          </div>
          <div style="display:flex; gap:8px; margin-bottom:10px;">
            ${
              images.front
                ? `<img src="${images.front}" style="width:${
                    images.back ? "50%" : "100%"
                  }; border-radius:8px; cursor:pointer; object-fit:cover; height:100px;" onclick="openImage('${
                    images.front
                  }')" />`
                : ""
            }
            ${
              images.back
                ? `<img src="${images.back}" style="width:50%; border-radius:8px; cursor:pointer; object-fit:cover; height:100px;" onclick="openImage('${images.back}')" />`
                : ""
            }
          </div>
          ${
            status === "pending"
              ? `
          <div style="display:flex; gap:8px;">
            <button class="btn-primary" style="margin:0; flex:1; padding:10px;" onclick="approveKyc('${uid}')">✓ Approve</button>
            <button class="btn-secondary" style="margin:0; flex:1; padding:10px; border-color:var(--red); color:var(--red);" onclick="rejectKyc('${uid}')">✕ Reject</button>
          </div>`
              : ""
          }
          ${
            status === "approved"
              ? `<button class="btn-secondary" onclick="requestReKyc('${uid}')">⚠️ Request Re-verification</button>`
              : ""
          }
          ${
            status === "rejected"
              ? `<div style="font-size:12px; color:var(--text2); margin-top:8px;">Reason: ${
                  d.rejectionReason || "Not specified"
                }</div>`
              : ""
          }
        </div>
      `;
      });
    })
    .catch(
      (err) =>
        (container.innerHTML =
          '<div class="empty-state">Error: ' + err.message + "</div>")
    );
}

function approveKyc(uid) {
  Promise.all([
    db.collection("kyc").doc(uid).update({ status: "approved" }),
    db
      .collection("users")
      .doc(uid)
      .update({ kycStatus: "approved", suspended: false }),
  ])
    .then(() => {
      showToast("KYC approved!", "success");
      loadKycList("pending");
    })
    .catch((err) => showToast(err.message, "error"));
}

function rejectKyc(uid) {
  const reason = prompt("Enter rejection reason:");
  if (reason === null) return;
  Promise.all([
    db
      .collection("kyc")
      .doc(uid)
      .update({ status: "rejected", rejectionReason: reason }),
    db
      .collection("users")
      .doc(uid)
      .update({ kycStatus: "rejected", kycRejectionReason: reason }),
  ])
    .then(() => {
      showToast("KYC rejected", "success");
      loadKycList("pending");
    })
    .catch((err) => showToast(err.message, "error"));
}

function requestReKyc(uid) {
  if (
    !confirm(
      "This will suspend the account and require resubmission. Continue?"
    )
  )
    return;
  db.collection("users")
    .doc(uid)
    .update({
      kycStatus: "none",
      suspended: true,
    })
    .then(() => {
      showToast("Re-verification requested. Account suspended.", "success");
      loadKycList("approved");
    })
    .catch((err) => showToast(err.message, "error"));
}

// ---- MERCHANTS ----
function loadMerchantList(status, btn) {
  setSubTabActive(btn);
  const container = document.getElementById("merchant-list");
  container.innerHTML = '<div class="empty-state">Loading...</div>';

  db.collection("merchantApplications")
    .where("status", "==", status)
    .get()
    .then((snapshot) => {
      if (snapshot.empty) {
        container.innerHTML =
          '<div class="empty-state">No ' + status + " applications</div>";
        return;
      }
      container.innerHTML = "";
      snapshot.forEach((doc) => {
        const d = doc.data();
        const uid = doc.id;
        container.innerHTML += `
        <div class="card" style="margin-bottom:10px;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
            <div>
              <div style="font-weight:700; font-size:14px;">${
                d.userName || "Unknown"
              }</div>
              <div style="font-size:11px; color:var(--text2);">${
                d.userEmail
              }</div>
            </div>
            <span class="badge badge-grey">$${(
              d.balanceAtApplication || 0
            ).toFixed(2)}</span>
          </div>
          ${
            d.residenceImage
              ? `<img src="${d.residenceImage}" style="width:100%; border-radius:8px; cursor:pointer; object-fit:cover; height:120px; margin-bottom:10px;" onclick="openImage('${d.residenceImage}')" />`
              : ""
          }
          ${
            status === "pending"
              ? `
          <div style="display:flex; gap:8px;">
            <button class="btn-primary" style="margin:0; flex:1; padding:10px;" onclick="approveMerchant('${uid}')">✓ Approve</button>
            <button class="btn-secondary" style="margin:0; flex:1; padding:10px; border-color:var(--red); color:var(--red);" onclick="rejectMerchant('${uid}')">✕ Reject</button>
          </div>`
              : ""
          }
        </div>
      `;
      });
    })
    .catch(
      (err) =>
        (container.innerHTML =
          '<div class="empty-state">Error: ' + err.message + "</div>")
    );
}

function approveMerchant(uid) {
  Promise.all([
    db
      .collection("merchantApplications")
      .doc(uid)
      .update({ status: "approved" }),
    db.collection("users").doc(uid).update({ merchantStatus: "approved" }),
  ])
    .then(() => {
      showToast("Merchant approved!", "success");
      loadMerchantList("pending");
    })
    .catch((err) => showToast(err.message, "error"));
}

function rejectMerchant(uid) {
  Promise.all([
    db
      .collection("merchantApplications")
      .doc(uid)
      .update({ status: "rejected" }),
    db.collection("users").doc(uid).update({ merchantStatus: "none" }),
  ])
    .then(() => {
      showToast("Merchant rejected", "success");
      loadMerchantList("pending");
    })
    .catch((err) => showToast(err.message, "error"));
}

// ---- WITHDRAWALS ----
function loadWithdrawalsList(status, btn) {
  setSubTabActive(btn);
  const container = document.getElementById("withdrawals-list");
  container.innerHTML = '<div class="empty-state">Loading...</div>';

  db.collection("withdrawals")
    .where("status", "==", status)
    .get()
    .then((snapshot) => {
      if (snapshot.empty) {
        container.innerHTML =
          '<div class="empty-state">No ' + status + " withdrawals</div>";
        return;
      }
      container.innerHTML = "";
      snapshot.forEach((doc) => {
        const d = doc.data();
        const id = doc.id;
        container.innerHTML += `
        <div class="card" style="margin-bottom:10px;">
          <div style="display:flex; justify-content:space-between; margin-bottom:8px;">
            <div style="font-weight:700; font-size:13px;">${d.userEmail}</div>
            <span class="badge badge-grey">${d.crypto} / ${d.network}</span>
          </div>
          <div class="payment-info-row"><span>Amount</span><strong>${
            d.amount
          } ${d.crypto}</strong></div>
          <div class="payment-info-row"><span>Fee</span><strong>${d.fee} ${
          d.crypto
        }</strong></div>
          <div class="payment-info-row"><span>Receives</span><strong>${
            d.receiveAmount
          } ${d.crypto}</strong></div>
          <div class="payment-info-row"><span>Address</span><strong style="word-break:break-all; font-size:11px;">${
            d.address
          }</strong></div>
          ${
            status === "pending"
              ? `
          <div style="display:flex; gap:8px; margin-top:10px;">
            <button class="btn-primary" style="margin:0; flex:1; padding:10px;" onclick="approveWithdrawal('${id}','${d.userId}','${d.crypto}',${d.amount})">✓ Mark Sent</button>
            <button class="btn-secondary" style="margin:0; flex:1; padding:10px; border-color:var(--red); color:var(--red);" onclick="rejectWithdrawal('${id}','${d.userId}','${d.crypto}',${d.amount})">✕ Reject & Refund</button>
          </div>`
              : ""
          }
        </div>
      `;
      });
    })
    .catch(
      (err) =>
        (container.innerHTML =
          '<div class="empty-state">Error: ' + err.message + "</div>")
    );
}

function approveWithdrawal(id, userId, crypto, amount) {
  db.collection("withdrawals")
    .doc(id)
    .update({ status: "completed" })
    .then(() => {
      logTransaction(
        userId,
        "withdrawal",
        crypto,
        amount,
        null,
        "Withdrawal completed"
      );
      showToast("Withdrawal marked as sent!", "success");
      loadWithdrawalsList("pending");
    })
    .catch((err) => showToast(err.message, "error"));
}

function rejectWithdrawal(id, userId, crypto, amount) {
  if (!confirm("Refund this amount back to user balance?")) return;
  Promise.all([
    db.collection("withdrawals").doc(id).update({ status: "rejected" }),
    db
      .collection("wallets")
      .doc(userId)
      .update({ [crypto]: firebase.firestore.FieldValue.increment(amount) }),
  ])
    .then(() => {
      logTransaction(
        userId,
        "withdrawal_refund",
        crypto,
        amount,
        null,
        "Withdrawal rejected, refunded"
      );
      showToast("Withdrawal rejected and refunded", "success");
      loadWithdrawalsList("pending");
    })
    .catch((err) => showToast(err.message, "error"));
}

// ---- WALLETS / DEPOSITS ----
function searchUserWallet() {
  const email = document.getElementById("wallet-search-email").value.trim();
  if (!email) {
    showToast("Enter an email", "error");
    return;
  }

  const container = document.getElementById("wallet-result");
  container.innerHTML = '<div class="empty-state">Searching...</div>';

  db.collection("users")
    .where("email", "==", email)
    .get()
    .then((snapshot) => {
      if (snapshot.empty) {
        container.innerHTML = '<div class="empty-state">User not found</div>';
        return;
      }
      const userDoc = snapshot.docs[0];
      const uid = userDoc.id;
      const u = userDoc.data();

      db.collection("wallets")
        .doc(uid)
        .get()
        .then((walletDoc) => {
          const w = walletDoc.exists ? walletDoc.data() : { BTC: 0, USDT: 0 };
          container.innerHTML = `
        <div class="card">
          <div style="font-weight:700; font-size:14px; margin-bottom:4px;">${
            u.name
          }</div>
          <div style="font-size:11px; color:var(--text2); margin-bottom:12px;">${
            u.email
          }</div>
          <div class="payment-info-row"><span>BTC Balance</span><strong>${(
            w.BTC || 0
          ).toFixed(8)}</strong></div>
          <div class="payment-info-row"><span>USDT Balance</span><strong>${(
            w.USDT || 0
          ).toFixed(2)}</strong></div>

          <div class="form-group" style="margin-top:12px;">
            <label>Crypto</label>
            <select id="wallet-crypto-select">
              <option value="USDT">USDT</option>
              <option value="BTC">BTC</option>
            </select>
          </div>
          <div class="form-group">
            <label>Amount (positive to credit, negative to debit)</label>
            <input type="number" id="wallet-amount" placeholder="e.g. 100 or -50" />
          </div>
          <button class="btn-primary" onclick="adjustWallet('${uid}')">Apply</button>
        </div>
      `;
        });
    })
    .catch(
      (err) =>
        (container.innerHTML =
          '<div class="empty-state">Error: ' + err.message + "</div>")
    );
}

function adjustWallet(uid) {
  const crypto = document.getElementById("wallet-crypto-select").value;
  const amount = parseFloat(document.getElementById("wallet-amount").value);
  if (!amount) {
    showToast("Enter a valid amount", "error");
    return;
  }

  db.collection("wallets")
    .doc(uid)
    .update({
      [crypto]: firebase.firestore.FieldValue.increment(amount),
    })
    .then(() => {
      logTransaction(
        uid,
        amount > 0 ? "deposit" : "adjustment",
        crypto,
        Math.abs(amount),
        null,
        amount > 0 ? "Manual deposit credit" : "Manual balance adjustment"
      );
      showToast("Wallet updated!", "success");
      document.getElementById("wallet-amount").value = "";
      searchUserWallet();
    })
    .catch((err) => showToast(err.message, "error"));
}

// ---- P2P ORDERS ----
function loadP2pOrders(filter, btn) {
  setSubTabActive(btn);
  const container = document.getElementById("p2p-list");
  container.innerHTML = '<div class="empty-state">Loading...</div>';

  let query;
  if (filter === "active") {
    query = db
      .collection("p2pOrders")
      .where("status", "in", ["awaiting_payment", "awaiting_release"]);
  } else {
    query = db.collection("p2pOrders").where("status", "==", filter);
  }

  query
    .get()
    .then((snapshot) => {
      if (snapshot.empty) {
        container.innerHTML =
          '<div class="empty-state">No ' + filter + " orders</div>";
        return;
      }
      container.innerHTML = "";
      snapshot.forEach((doc) => {
        const o = doc.data();
        const id = doc.id;
        const messages = o.messages || [];

        let actions = "";
        if (o.status === "awaiting_release" || o.status === "disputed") {
          if (o.type === "buy") {
            actions = `
            <div style="display:flex; gap:8px; margin-top:10px;">
              <button class="btn-primary" style="margin:0; flex:1; padding:10px;" onclick="releaseBuyOrder('${id}','${o.userId}','${o.crypto}',${o.cryptoAmount})">✓ Release Crypto</button>
              <button class="btn-secondary" style="margin:0; flex:1; padding:10px; border-color:var(--red); color:var(--red);" onclick="cancelP2pOrder('${id}')">✕ Cancel</button>
            </div>`;
          } else {
            actions = `
            <div style="display:flex; gap:8px; margin-top:10px;">
              <button class="btn-primary" style="margin:0; flex:1; padding:10px;" onclick="completeSellOrder('${id}','${o.userId}','${o.crypto}',${o.cryptoAmount},${o.fiatAmount},'${o.currency}')">✓ Mark Paid</button>
              <button class="btn-secondary" style="margin:0; flex:1; padding:10px; border-color:var(--red); color:var(--red);" onclick="refundSellOrder('${id}','${o.userId}','${o.crypto}',${o.cryptoAmount})">✕ Cancel & Refund</button>
            </div>`;
          }
        }

        container.innerHTML += `
        <div class="card" style="margin-bottom:10px;">
          <div style="display:flex; justify-content:space-between; margin-bottom:8px;">
            <span class="order-type ${o.type}">${o.type.toUpperCase()}</span>
            <span class="badge ${getStatusBadgeClassAdmin(
              o.status
            )}">${o.status.replace("_", " ")}</span>
          </div>
          <div style="font-size:12px; color:var(--text2); margin-bottom:8px;">${
            o.userEmail
          }</div>
          <div class="payment-info-row"><span>Crypto</span><strong>${o.cryptoAmount.toFixed(
            o.crypto === "BTC" ? 8 : 4
          )} ${o.crypto}</strong></div>
          <div class="payment-info-row"><span>Fiat</span><strong>${
            o.fiatAmount
          } ${o.currency}</strong></div>
          ${
            o.payoutAccount
              ? `<div class="payment-info-row"><span>Payout to</span><strong>${o.payoutAccount} (${o.paymentMethod})</strong></div>`
              : ""
          }
          ${
            o.paymentProof
              ? `<img src="${o.paymentProof}" style="width:100%; border-radius:8px; cursor:pointer; margin-top:8px; max-height:150px; object-fit:cover;" onclick="openImage('${o.paymentProof}')" />`
              : ""
          }

          ${
            messages.length > 0
              ? `
          <div style="margin-top:10px; background:var(--bg); border-radius:8px; padding:8px; max-height:120px; overflow-y:auto;">
            ${messages
              .map(
                (m) =>
                  `<div style="font-size:11px; margin-bottom:4px;"><strong>${
                    m.sender === o.userId ? "User" : "Admin"
                  }:</strong> ${m.text}</div>`
              )
              .join("")}
          </div>`
              : ""
          }

          <div class="input-row" style="margin-top:8px; margin-bottom:0;">
            <input type="text" id="reply-${id}" placeholder="Reply..." style="font-size:12px;" />
            <button class="chat-send-btn" style="width:32px;height:32px;" onclick="sendAdminReply('${id}')">➤</button>
          </div>

          ${actions}
        </div>
      `;
      });
    })
    .catch(
      (err) =>
        (container.innerHTML =
          '<div class="empty-state">Error: ' + err.message + "</div>")
    );
}

function sendAdminReply(orderId) {
  const input = document.getElementById("reply-" + orderId);
  const text = input.value.trim();
  if (!text) return;

  db.collection("p2pOrders")
    .doc(orderId)
    .update({
      messages: firebase.firestore.FieldValue.arrayUnion({
        sender: "admin",
        senderName: "Support",
        text,
        time: Date.now(),
      }),
    })
    .then(() => {
      showToast("Reply sent!", "success");
      input.value = "";
    })
    .catch((err) => showToast(err.message, "error"));
}

function releaseBuyOrder(orderId, userId, crypto, cryptoAmount) {
  db.collection("p2pOrders")
    .doc(orderId)
    .update({ status: "completed" })
    .then(() => {
      logTransaction(
        userId,
        "p2p_buy",
        crypto,
        cryptoAmount,
        null,
        "P2P buy order completed"
      );
      showToast("Order released! Buyer will receive funds.", "success");
      loadP2pOrders("active");
    })
    .catch((err) => showToast(err.message, "error"));
}

function completeSellOrder(
  orderId,
  userId,
  crypto,
  cryptoAmount,
  fiatAmount,
  currency
) {
  db.collection("p2pOrders")
    .doc(orderId)
    .update({ status: "completed" })
    .then(() => {
      logTransaction(
        userId,
        "p2p_sell",
        crypto,
        cryptoAmount,
        currency,
        `P2P sell completed, ${fiatAmount} ${currency} paid out`
      );
      showToast("Order marked complete!", "success");
      loadP2pOrders("active");
    })
    .catch((err) => showToast(err.message, "error"));
}

function refundSellOrder(orderId, userId, crypto, cryptoAmount) {
  Promise.all([
    db
      .collection("wallets")
      .doc(userId)
      .update({
        [crypto]: firebase.firestore.FieldValue.increment(cryptoAmount),
      }),
    db.collection("p2pOrders").doc(orderId).update({ status: "cancelled" }),
  ])
    .then(() => {
      logTransaction(
        userId,
        "p2p_refund",
        crypto,
        cryptoAmount,
        null,
        "Sell order cancelled, balance refunded"
      );
      showToast("Refunded and cancelled", "success");
      loadP2pOrders("active");
    })
    .catch((err) => showToast(err.message, "error"));
}

function cancelP2pOrder(orderId) {
  db.collection("p2pOrders")
    .doc(orderId)
    .update({ status: "cancelled" })
    .then(() => {
      showToast("Order cancelled", "success");
      loadP2pOrders("active");
    })
    .catch((err) => showToast(err.message, "error"));
}

// ---- USERS ----
let allUsersCache = [];

function loadUsersList() {
  const container = document.getElementById("users-list");
  container.innerHTML = '<div class="empty-state">Loading...</div>';

  db.collection("users")
    .limit(100)
    .get()
    .then((snapshot) => {
      allUsersCache = [];
      snapshot.forEach((doc) =>
        allUsersCache.push({ id: doc.id, ...doc.data() })
      );
      renderUsersList(allUsersCache);
    })
    .catch(
      (err) =>
        (container.innerHTML =
          '<div class="empty-state">Error: ' + err.message + "</div>")
    );
}

function renderUsersList(users) {
  const container = document.getElementById("users-list");
  if (users.length === 0) {
    container.innerHTML = '<div class="empty-state">No users found</div>';
    return;
  }
  container.innerHTML = users
    .map(
      (u) => `
    <div class="card" style="margin-bottom:8px; cursor:pointer; display:flex; align-items:center; gap:12px;" onclick="openUserDetail('${
      u.id
    }')">
      <div style="width:36px;height:36px;border-radius:50%;background:rgba(240,185,11,0.1);display:flex;align-items:center;justify-content:center;font-weight:800;font-size:13px;color:var(--yellow);flex-shrink:0;">${(u.name ||
        "U")[0].toUpperCase()}</div>
      <div style="flex:1; overflow:hidden;">
        <div style="font-weight:700; font-size:13px;">${
          u.name || "Unknown"
        }</div>
        <div style="font-size:11px; color:var(--text2); overflow:hidden; text-overflow:ellipsis;">${
          u.email
        }</div>
      </div>
      <div style="display:flex; flex-direction:column; gap:2px; align-items:flex-end;">
        <span class="badge badge-${
          u.kycStatus === "approved"
            ? "green"
            : u.kycStatus === "pending"
            ? "yellow"
            : "grey"
        }">${u.kycStatus || "none"}</span>
        ${u.suspended ? '<span class="badge badge-red">suspended</span>' : ""}
      </div>
    </div>
  `
    )
    .join("");
}

function filterUsersList() {
  const search = document.getElementById("user-search").value.toLowerCase();
  const filtered = allUsersCache.filter(
    (u) =>
      (u.email || "").toLowerCase().includes(search) ||
      (u.name || "").toLowerCase().includes(search)
  );
  renderUsersList(filtered);
}

function openUserDetail(uid) {
  const u = allUsersCache.find((x) => x.id === uid);
  if (!u) return;

  openModal("user-detail-modal");
  const content = document.getElementById("user-detail-content");
  content.innerHTML = '<div class="empty-state">Loading...</div>';

  db.collection("wallets")
    .doc(uid)
    .get()
    .then((walletDoc) => {
      const w = walletDoc.exists ? walletDoc.data() : { BTC: 0, USDT: 0 };
      content.innerHTML = `
      <div class="card" style="margin-bottom:12px;">
        <div style="font-weight:800; font-size:16px; margin-bottom:4px;">${
          u.name || "Unknown"
        }</div>
        <div style="font-size:12px; color:var(--text2);">${u.email}</div>
      </div>
      <div class="payment-info-row"><span>Phone</span><strong>${
        u.phone || "--"
      }</strong></div>
      <div class="payment-info-row"><span>Country</span><strong>${
        u.country || "--"
      }</strong></div>
      <div class="payment-info-row"><span>Address</span><strong>${
        u.address || "--"
      }</strong></div>
      <div class="payment-info-row"><span>KYC Status</span><strong>${
        u.kycStatus || "none"
      }</strong></div>
      <div class="payment-info-row"><span>Merchant Status</span><strong>${
        u.merchantStatus || "none"
      }</strong></div>
      <div class="payment-info-row"><span>BTC Balance</span><strong>${(
        w.BTC || 0
      ).toFixed(8)}</strong></div>
      <div class="payment-info-row"><span>USDT Balance</span><strong>${(
        w.USDT || 0
      ).toFixed(2)}</strong></div>
      <div class="payment-info-row"><span>Suspended</span><strong>${
        u.suspended ? "Yes" : "No"
      }</strong></div>

      <div style="margin-top:16px;">
        ${
          u.suspended
            ? `<button class="btn-primary" onclick="unsuspendUser('${uid}')">✓ Unsuspend Account</button>`
            : `<button class="btn-secondary" style="border-color:var(--red); color:var(--red);" onclick="suspendUser('${uid}')">⚠️ Suspend & Require Re-KYC</button>`
        }
      </div>
    `;
    });
}

function suspendUser(uid) {
  if (!confirm("Suspend this account and require KYC resubmission?")) return;
  db.collection("users")
    .doc(uid)
    .update({ suspended: true, kycStatus: "none" })
    .then(() => {
      showToast("Account suspended", "success");
      closeModal("user-detail-modal");
      loadUsersList();
    })
    .catch((err) => showToast(err.message, "error"));
}

function unsuspendUser(uid) {
  db.collection("users")
    .doc(uid)
    .update({ suspended: false })
    .then(() => {
      showToast("Account unsuspended", "success");
      closeModal("user-detail-modal");
      loadUsersList();
    })
    .catch((err) => showToast(err.message, "error"));
}

// ---- ADMINS ----
function loadAdminsList() {
  const container = document.getElementById("admins-list");
  container.innerHTML = '<div class="empty-state">Loading...</div>';

  db.collection("admins")
    .get()
    .then((snapshot) => {
      if (snapshot.empty) {
        container.innerHTML = '<div class="empty-state">No admins found</div>';
        return;
      }
      container.innerHTML = "";
      snapshot.forEach((doc) => {
        const email = doc.id;
        const isSelf = email === auth.currentUser.email;
        container.innerHTML += `
        <div class="card" style="margin-bottom:8px; display:flex; justify-content:space-between; align-items:center;">
          <div style="font-size:13px; font-weight:700;">${email} ${
          isSelf ? "(you)" : ""
        }</div>
          ${
            !isSelf
              ? `<button class="btn-secondary" style="margin:0; padding:6px 12px; width:auto; border-color:var(--red); color:var(--red); font-size:11px;" onclick="removeAdmin('${email}')">Remove</button>`
              : ""
          }
        </div>
      `;
      });
    })
    .catch(
      (err) =>
        (container.innerHTML =
          '<div class="empty-state">Error: ' + err.message + "</div>")
    );
}

function addAdmin() {
  const email = document.getElementById("new-admin-email").value.trim();
  if (!email) {
    showToast("Enter an email", "error");
    return;
  }

  db.collection("admins")
    .doc(email)
    .set({
      role: "admin",
      addedBy: auth.currentUser.email,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    })
    .then(() => {
      showToast("Admin added!", "success");
      document.getElementById("new-admin-email").value = "";
      loadAdminsList();
    })
    .catch((err) => showToast(err.message, "error"));
}

function removeAdmin(email) {
  if (!confirm("Remove admin access for " + email + "?")) return;
  db.collection("admins")
    .doc(email)
    .delete()
    .then(() => {
      showToast("Admin removed", "success");
      loadAdminsList();
    })
    .catch((err) => showToast(err.message, "error"));
}
// ---- SUPPORT CHATS ----
function loadSupportChats() {
  const container = document.getElementById("support-chats-list");
  container.innerHTML = '<div class="empty-state">Loading...</div>';

  db.collection("chats")
    .orderBy("updatedAt", "desc")
    .limit(50)
    .get()
    .then((snapshot) => {
      if (snapshot.empty) {
        container.innerHTML =
          '<div class="empty-state">No support chats yet</div>';
        return;
      }
      container.innerHTML = "";
      snapshot.forEach((doc) => {
        const d = doc.data();
        const chatId = doc.id;
        const messages = d.messages || [];
        const last = messages[messages.length - 1];
        container.innerHTML += `
        <div class="card" style="margin-bottom:10px;">
          <div style="font-weight:700; font-size:13px; margin-bottom:4px;">${
            d.userEmail
          }</div>
          ${
            last
              ? `<div style="font-size:12px; color:var(--text2); margin-bottom:10px;">${last.text}</div>`
              : ""
          }
          <div style="max-height:140px; overflow-y:auto; background:var(--bg); border-radius:8px; padding:8px; margin-bottom:8px;">
            ${messages
              .map(
                (m) =>
                  `<div style="font-size:11px; margin-bottom:4px;">
  <strong>${m.sender === d.userId ? d.userEmail : "Admin"}:</strong>
  ${
    m.type === "image"
      ? `<img src="${m.image}" style="max-width:150px; border-radius:6px; display:block; margin-top:4px; cursor:pointer;" onclick="openImage('${m.image}')" />`
      : m.text
  }
</div>`
              )
              .join("")}
          </div>
          <div class="input-row" style="margin-bottom:6px;">
          <input type="text" id="admin-support-reply-${chatId}" placeholder="Reply..." style="font-size:12px;" />
          <button class="chat-send-btn" style="width:32px;height:32px;" onclick="sendAdminSupportReply('${chatId}')">➤</button>
        </div>
        <div style="display:flex; gap:6px; margin-top:6px;">
          <button class="btn-secondary" style="margin:0; padding:6px 10px; font-size:11px; flex:1;" onclick="sendDirectAnnouncement('${
            d.userId
          }','${d.userEmail}')">📢 Direct Message</button>
          <button class="btn-secondary" style="margin:0; padding:6px 10px; font-size:11px; border-color:var(--red); color:var(--red); flex:1;" onclick="deleteChat('${chatId}')">🗑️ Delete Chat</button>
        </div>
        </div>
      `;
      });
    })
    .catch(
      (err) =>
        (container.innerHTML =
          '<div class="empty-state">Error: ' + err.message + "</div>")
    );
}
function sendDirectAnnouncement(userId, userEmail) {
  const title = prompt("Announcement title:");
  if (!title) return;
  const body = prompt("Message to send to " + userEmail + ":");
  if (!body) return;
  const type = "info";

  db.collection("directMessages")
    .add({
      userId,
      userEmail,
      title,
      body,
      type,
      read: false,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    })
    .then(() => {
      showToast("Message sent to " + userEmail, "success");
    })
    .catch((err) => showToast(err.message, "error"));
}
function sendAdminSupportReply(chatId) {
  const input = document.getElementById("admin-support-reply-" + chatId);
  const btn = input.nextElementSibling;
  const text = input.value.trim();
  if (!text) return;

  input.value = "";
  if (btn) btn.disabled = true;

  db.collection("chats")
    .doc(chatId)
    .update({
      updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
      messages: firebase.firestore.FieldValue.arrayUnion({
        sender: "admin",
        text,
        time: Date.now(),
      }),
    })
    .then(() => {
      showToast("Reply sent!", "success");
      loadSupportChats();
    })
    .catch((err) => {
      showToast(err.message, "error");
      input.value = text;
    })
    .finally(() => {
      if (btn) btn.disabled = false;
    });
}
// ---- ANNOUNCEMENTS ----
function loadAnnouncementsAdmin() {
  const container = document.getElementById("announcements-admin-list");
  container.innerHTML = '<div class="empty-state">Loading...</div>';

  db.collection("announcements")
    .orderBy("createdAt", "desc")
    .limit(20)
    .get()
    .then((snapshot) => {
      if (snapshot.empty) {
        container.innerHTML =
          '<div class="empty-state">No announcements yet</div>';
        return;
      }
      container.innerHTML = "";
      snapshot.forEach((doc) => {
        const a = doc.data();
        container.innerHTML += `
        <div class="card" style="margin-bottom:8px;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
            <span style="font-weight:700;">${a.title}</span>
            <button style="background:none; border:none; color:var(--red); cursor:pointer; font-size:16px;" onclick="deleteAnnouncement('${doc.id}')">🗑️</button>
          </div>
          <p style="font-size:12px; color:var(--text2);">${a.body}</p>
        </div>
      `;
      });
    })
    .catch(
      (err) =>
        (container.innerHTML =
          '<div class="empty-state">Error: ' + err.message + "</div>")
    );
}

function sendAnnouncement() {
  const title = document.getElementById("ann-title").value.trim();
  const body = document.getElementById("ann-body").value.trim();
  const type = document.getElementById("ann-type").value;
  if (!title || !body) {
    showToast("Fill in all fields", "error");
    return;
  }

  db.collection("announcements")
    .add({
      title,
      body,
      type,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    })
    .then(() => {
      showToast("Announcement sent!", "success");
      document.getElementById("ann-title").value = "";
      document.getElementById("ann-body").value = "";
      loadAnnouncementsAdmin();
    })
    .catch((err) => showToast(err.message, "error"));
}

function deleteAnnouncement(id) {
  if (!confirm("Delete this announcement?")) return;
  db.collection("announcements")
    .doc(id)
    .delete()
    .then(() => {
      showToast("Deleted", "success");
      loadAnnouncementsAdmin();
    })
    .catch((err) => showToast(err.message, "error"));
} // ---- CHAT MANAGEMENT ----
function deleteChat(chatId) {
  if (!confirm("Delete this entire chat history?")) return;
  db.collection("chats")
    .doc(chatId)
    .delete()
    .then(() => {
      showToast("Chat deleted", "success");
      loadSupportChats();
    })
    .catch((err) => showToast(err.message, "error"));
}

function deleteAllChats() {
  if (!confirm("Delete ALL chat histories? This cannot be undone.")) return;
  db.collection("chats")
    .get()
    .then((snapshot) => {
      const batch = db.batch();
      snapshot.forEach((doc) => batch.delete(doc.ref));
      return batch.commit();
    })
    .then(() => {
      showToast("All chats deleted", "success");
      loadSupportChats();
    })
    .catch((err) => showToast(err.message, "error"));
}
