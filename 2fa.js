let pending2faSecret = null;

function open2faSetup() {
  const user = auth.currentUser;
  if (!user) return;

  db.collection("users")
    .doc(user.uid)
    .get()
    .then((doc) => {
      const data = doc.data() || {};
      openModal("twofa-modal");

      if (data.twoFaEnabled) {
        document.getElementById("twofa-state-none").style.display = "none";
        document.getElementById("twofa-state-enabled").style.display = "block";
        return;
      }

      document.getElementById("twofa-state-none").style.display = "block";
      document.getElementById("twofa-state-enabled").style.display = "none";
      generateAndShowQr(user.email);
    });
}

function generateAndShowQr(email) {
  const container = document.getElementById("twofa-qr-container");
  container.innerHTML = '<div class="empty-state">Generating...</div>';

  fetch("/api/generate-2fa-secret", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  })
    .then((res) => res.json())
    .then((data) => {
      if (!data.success) {
        container.innerHTML =
          '<div class="empty-state">Could not generate code</div>';
        return;
      }
      pending2faSecret = data.secret;
      document.getElementById("twofa-secret-display").value = data.secret;

      container.innerHTML = "";
      new QRCode(container, {
        text: data.otpauthUrl,
        width: 190,
        height: 190,
        colorDark: "#000000",
        colorLight: "#ffffff",
        correctLevel: QRCode.CorrectLevel.M,
      });
    })
    .catch(() => {
      container.innerHTML =
        '<div class="empty-state">Could not generate code</div>';
    });
}

function confirm2faSetup() {
  const user = auth.currentUser;
  const code = document.getElementById("twofa-confirm-code").value.trim();

  if (!pending2faSecret) {
    showToast("Please wait for the QR code to load first", "error");
    return;
  }
  if (!code || code.length !== 6) {
    showToast("Enter the 6-digit code from your app", "error");
    return;
  }

  const btn = document.querySelector("#twofa-state-none .btn-primary");
  btn.disabled = true;
  btn.textContent = "Verifying...";

  fetch("/api/verify-2fa-code", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ secret: pending2faSecret, code }),
  })
    .then((res) => res.json())
    .then((data) => {
      btn.disabled = false;
      btn.textContent = "Confirm & Enable 2FA";

      if (!data.success) {
        showToast("Incorrect code. Please try again.", "error");
        return;
      }

      return db.collection("users").doc(user.uid).update({
        twoFaEnabled: true,
        twoFaSecret: pending2faSecret,
        twoFaEnabledAt: firebase.firestore.FieldValue.serverTimestamp(),
      });
    })
    .then(() => {
      if (!pending2faSecret) return;
      showToast("2FA enabled!", "success");
      document.getElementById("twofa-state-none").style.display = "none";
      document.getElementById("twofa-state-enabled").style.display = "block";
      updateTwoFaMenuStatus(true);
      pending2faSecret = null;
    })
    .catch((err) => {
      btn.disabled = false;
      btn.textContent = "Confirm & Enable 2FA";
      showToast(err.message, "error");
    });
}

function updateTwoFaMenuStatus(enabled) {
  const sub = document.getElementById("twofa-menu-sub");
  const status = document.getElementById("twofa-menu-status");
  if (sub) sub.textContent = enabled ? "Enabled" : "Not enabled";
  if (status) status.textContent = enabled ? "✅" : "❌";

  // Sync the merchant checklist item too, if that screen is currently open
  const merchantReq4 = document.getElementById("merchant-req-4");
  if (merchantReq4) merchantReq4.textContent = enabled ? "✅" : "❌";
}

// Reflect 2FA status on page load, same pattern as the KYC badge
auth.onAuthStateChanged((user) => {
  if (!user || !user.emailVerified) return;
  db.collection("users")
    .doc(user.uid)
    .get()
    .then((doc) => {
      const data = doc.data() || {};
      updateTwoFaMenuStatus(!!data.twoFaEnabled);
    });
});
