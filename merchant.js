let merchantUid = null;
let merchantDisplayName = null;
let myListings = [];

auth.onAuthStateChanged((user) => {
  if (!user || !user.emailVerified) return;
  merchantUid = user.uid;

  db.collection("users")
    .doc(user.uid)
    .get()
    .then((doc) => {
      const d = doc.data();
      if (d.merchantStatus !== "approved") {
        showToast("Merchant access required", "error");
        window.location.href = "profile.html";
        return;
      }
      merchantDisplayName = d.merchantDisplayName || null;
      init();
    });
});

function init() {
  populateCurrencyDropdown();
  updateListingMethods();
  loadMyListings();
}

function populateCurrencyDropdown() {
  const select = document.getElementById("listing-currency");
  select.innerHTML = CURRENCIES.map(
    (c) => `<option value="${c.code}">${c.flag} ${c.code} - ${c.name}</option>`
  ).join("");
}

function updateListingMethods() {
  const currency = document.getElementById("listing-currency").value;
  const methods = PAYMENT_METHODS[currency] || ["Bank Transfer"];
  const container = document.getElementById("listing-methods");
  container.innerHTML = methods
    .map(
      (m) => `
    <label style="display:flex; align-items:center; gap:8px; padding:8px 0; font-size:13px;">
      <input type="checkbox" value="${m}" class="listing-method-cb" /> ${m}
    </label>
  `
    )
    .join("");
}

function switchMerchantTab(tab, btn) {
  document
    .querySelectorAll(".tabs .tab")
    .forEach((t) => t.classList.remove("active"));
  btn.classList.add("active");
  document.getElementById("mt-listings").style.display =
    tab === "listings" ? "block" : "none";
  document.getElementById("mt-orders").style.display =
    tab === "orders" ? "block" : "none";
  if (tab === "orders") loadMyMerchantOrders();
}

// ---- LISTINGS CRUD ----
function openListingForm(listingId) {
  document.getElementById("listing-modal-title").textContent = listingId
    ? "Edit Listing"
    : "Create Listing";
  document.getElementById("listing-id").value = listingId || "";

  if (listingId) {
    const l = myListings.find((x) => x.id === listingId);
    document.getElementById("listing-type").value = l.type;
    document.getElementById("listing-crypto").value = l.crypto;
    document.getElementById("listing-currency").value = l.currency;
    updateListingMethods();
    document.getElementById("listing-rate").value = l.rate;
    document.getElementById("listing-min").value = l.minLimit;
    document.getElementById("listing-max").value = l.maxLimit;
    document.getElementById("listing-available").value = l.available;
    document.getElementById("listing-payment-details").value =
      l.paymentDetails || "";
    setTimeout(() => {
      document.querySelectorAll(".listing-method-cb").forEach((cb) => {
        cb.checked = (l.methods || []).includes(cb.value);
      });
    }, 50);
  } else {
    document.getElementById("listing-type").value = "sell";
    document.getElementById("listing-crypto").value = "USDT";
    document.getElementById("listing-currency").value = "ETB";
    updateListingMethods();
    document.getElementById("listing-rate").value = "";
    document.getElementById("listing-min").value = "";
    document.getElementById("listing-max").value = "";
    document.getElementById("listing-available").value = "";
    document.getElementById("listing-payment-details").value = "";
  }

  openModal("listing-modal");
}

function saveListing() {
  const id = document.getElementById("listing-id").value;
  const type = document.getElementById("listing-type").value;
  const crypto = document.getElementById("listing-crypto").value;
  const currency = document.getElementById("listing-currency").value;
  const rate = parseFloat(document.getElementById("listing-rate").value);
  const minLimit = parseFloat(document.getElementById("listing-min").value);
  const maxLimit = parseFloat(document.getElementById("listing-max").value);
  const available = parseFloat(
    document.getElementById("listing-available").value
  );
  const paymentDetails = document
    .getElementById("listing-payment-details")
    .value.trim();
  const methods = Array.from(
    document.querySelectorAll(".listing-method-cb:checked")
  ).map((cb) => cb.value);

  if (!rate || !minLimit || !maxLimit || !available || methods.length === 0) {
    showToast(
      "Please fill in all fields and select at least one payment method",
      "error"
    );
    return;
  }
  if (minLimit >= maxLimit) {
    showToast("Min limit must be less than max limit", "error");
    return;
  }

  const data = {
    merchantUid,
    type,
    crypto,
    currency,
    rate,
    minLimit,
    maxLimit,
    available,
    methods,
    paymentDetails,
    status: "active",
    updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
  };

  const finish = () => {
    showToast("Listing saved!", "success");
    closeModal("listing-modal");
    loadMyListings();
  };

  if (id) {
    db.collection("listings")
      .doc(id)
      .update(data)
      .then(finish)
      .catch((err) => showToast(err.message, "error"));
  } else {
    const doSave = () => {
      data.merchantName = merchantDisplayName;
      data.createdAt = firebase.firestore.FieldValue.serverTimestamp();
      db.collection("listings")
        .add(data)
        .then(finish)
        .catch((err) => showToast(err.message, "error"));
    };

    if (!merchantDisplayName) {
      merchantDisplayName = generateTraderName(Date.now() % 100000);
      db.collection("users")
        .doc(merchantUid)
        .update({ merchantDisplayName })
        .then(doSave);
    } else {
      doSave();
    }
  }
}

function loadMyListings() {
  const container = document.getElementById("my-listings-list");
  container.innerHTML = '<div class="empty-state">Loading...</div>';

  db.collection("listings")
    .where("merchantUid", "==", merchantUid)
    .get()
    .then((snapshot) => {
      myListings = [];
      snapshot.forEach((doc) => myListings.push({ id: doc.id, ...doc.data() }));

      if (myListings.length === 0) {
        container.innerHTML =
          '<div class="empty-state">No listings yet. Create your first one!</div>';
        return;
      }

      container.innerHTML = myListings
        .map(
          (l) => `
      <div class="card" style="margin-bottom:10px;">
        <div style="display:flex; justify-content:space-between; margin-bottom:8px;">
          <span class="order-type ${
            l.type === "sell" ? "sell" : "buy"
          }">${l.type.toUpperCase()} ${l.crypto}</span>
          <span class="badge badge-${
            l.status === "active" ? "green" : "grey"
          }">${l.status}</span>
        </div>
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
          <button class="btn-secondary" style="margin:0; flex:1; padding:8px;" onclick="openListingForm('${
            l.id
          }')">Edit</button>
          <button class="btn-secondary" style="margin:0; flex:1; padding:8px;" onclick="toggleListingStatus('${
            l.id
          }','${l.status}')">${
            l.status === "active" ? "Pause" : "Activate"
          }</button>
          <button class="btn-secondary" style="margin:0; flex:1; padding:8px; border-color:var(--red); color:var(--red);" onclick="deleteListing('${
            l.id
          }')">Delete</button>
        </div>
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

function toggleListingStatus(id, currentStatus) {
  const newStatus = currentStatus === "active" ? "paused" : "active";
  db.collection("listings")
    .doc(id)
    .update({ status: newStatus })
    .then(() => {
      showToast("Listing " + newStatus, "success");
      loadMyListings();
    })
    .catch((err) => showToast(err.message, "error"));
}

function deleteListing(id) {
  if (!confirm("Delete this listing permanently?")) return;
  db.collection("listings")
    .doc(id)
    .delete()
    .then(() => {
      showToast("Listing deleted", "success");
      loadMyListings();
    })
    .catch((err) => showToast(err.message, "error"));
}

// ---- INCOMING ORDERS ----
function loadMyMerchantOrders() {
  const container = document.getElementById("my-merchant-orders");
  container.innerHTML = '<div class="empty-state">Loading...</div>';

  db.collection("p2pOrders")
    .where("merchantUid", "==", merchantUid)
    .get()
    .then((snapshot) => {
      if (snapshot.empty) {
        container.innerHTML = '<div class="empty-state">No orders yet</div>';
        return;
      }
      const orders = [];
      snapshot.forEach((doc) => orders.push({ id: doc.id, ...doc.data() }));
      orders.sort(
        (a, b) =>
          (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0)
      );

      container.innerHTML = orders
        .map((o) => {
          const messages = o.messages || [];
          let actions = "";
          if (o.status === "awaiting_release") {
            if (o.type === "buy") {
              actions = `<button class="btn-primary" onclick="merchantRelease('${o.id}',${o.cryptoAmount},'${o.crypto}')">✓ Release ${o.crypto}</button>`;
            } else {
              actions = `<button class="btn-primary" onclick="merchantMarkPaid('${o.id}',${o.cryptoAmount},'${o.crypto}')">✓ Mark Paid</button>`;
            }
          }
          return `
        <div class="card" style="margin-bottom:10px;">
          <div style="display:flex; justify-content:space-between; margin-bottom:8px;">
            <span class="order-type ${o.type}">${o.type.toUpperCase()}</span>
            <span class="badge ${
              o.status === "completed"
                ? "badge-green"
                : o.status === "cancelled" || o.status === "disputed"
                ? "badge-red"
                : "badge-yellow"
            }">${o.status.replace("_", " ")}</span>
          </div>
          <div class="payment-info-row"><span>Amount</span><strong>${o.cryptoAmount.toFixed(
            o.crypto === "BTC" ? 8 : 4
          )} ${o.crypto}</strong></div>
          <div class="payment-info-row"><span>Fiat</span><strong>${
            o.fiatAmount
          } ${o.currency}</strong></div>
          ${
            o.payoutAccount
              ? `<div class="payment-info-row"><span>Send to</span><strong>${o.payoutAccount} (${o.paymentMethod})</strong></div>`
              : ""
          }
          ${
            o.paymentProof
              ? `<img src="${o.paymentProof}" style="width:100%; border-radius:8px; cursor:pointer; margin-top:8px; max-height:150px; object-fit:cover;" onclick="openImage('${o.paymentProof}')" />`
              : ""
          }
          ${
            messages.length > 0
              ? `<div style="margin-top:10px; background:var(--bg); border-radius:8px; padding:8px; max-height:120px; overflow-y:auto;">${messages
                  .map(
                    (m) =>
                      `<div style="font-size:11px; margin-bottom:4px;"><strong>${
                        m.sender === merchantUid ? "You" : "Trader"
                      }:</strong> ${m.text}</div>`
                  )
                  .join("")}</div>`
              : ""
          }
          <div class="input-row" style="margin-top:8px; margin-bottom:0;">
            <input type="text" id="merch-reply-${
              o.id
            }" placeholder="Reply..." style="font-size:12px;" />
            <button class="chat-send-btn" style="width:32px;height:32px;" onclick="merchantReply('${
              o.id
            }')">➤</button>
          </div>
          ${actions ? `<div style="margin-top:10px;">${actions}</div>` : ""}
        </div>
      `;
        })
        .join("");
    })
    .catch(
      (err) =>
        (container.innerHTML =
          '<div class="empty-state">Error: ' + err.message + "</div>")
    );
}

function merchantReply(orderId) {
  const input = document.getElementById("merch-reply-" + orderId);
  const text = input.value.trim();
  if (!text) return;
  db.collection("p2pOrders")
    .doc(orderId)
    .update({
      messages: firebase.firestore.FieldValue.arrayUnion({
        sender: merchantUid,
        senderName: merchantDisplayName || "Merchant",
        text,
        time: Date.now(),
      }),
    })
    .then(() => {
      input.value = "";
      showToast("Sent", "success");
    });
}

function merchantRelease(orderId, cryptoAmount, crypto) {
  if (
    !confirm(
      `Release ${cryptoAmount.toFixed(
        crypto === "BTC" ? 8 : 4
      )} ${crypto} to the buyer?`
    )
  )
    return;
  db.collection("wallets")
    .doc(merchantUid)
    .update({
      [crypto]: firebase.firestore.FieldValue.increment(-cryptoAmount),
    })
    .then(() => {
      return db
        .collection("p2pOrders")
        .doc(orderId)
        .update({ status: "completed" });
    })
    .then(() => {
      showToast("Released! Buyer will receive it shortly.", "success");
      loadMyMerchantOrders();
    })
    .catch((err) => showToast(err.message, "error"));
}

function merchantMarkPaid(orderId, cryptoAmount, crypto) {
  db.collection("wallets")
    .doc(merchantUid)
    .update({
      [crypto]: firebase.firestore.FieldValue.increment(cryptoAmount),
    })
    .then(() => {
      return db
        .collection("p2pOrders")
        .doc(orderId)
        .update({ status: "completed" });
    })
    .then(() => {
      showToast("Marked as paid!", "success");
      loadMyMerchantOrders();
    })
    .catch((err) => showToast(err.message, "error"));
}

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
