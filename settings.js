// settings.js
let supportChatUnsub = null;
let currentUserData = {};

auth.onAuthStateChanged((user) => {
  if (!user || !user.emailVerified) return;
  loadSettings(user);
  checkEmailVerified(user);
  loadUserData(user.uid);
  loadLoginActivity(user.uid);
});

function loadUserData(uid) {
  db.collection("users")
    .doc(uid)
    .onSnapshot((doc) => {
      if (!doc.exists) return;
      currentUserData = doc.data();
      // Update Anti-phishing sub
      const sub = document.getElementById("anti-phishing-sub");
      if (currentUserData.antiPhishing) {
        sub.textContent = "✅ " + currentUserData.antiPhishing;
      } else {
        sub.textContent = "Not set";
      }
      // Update Region display
      const regionDisplay = document.getElementById("region-display");
      const regionMap = {
        global: "🌍 Global",
        us: "🇺🇸 US",
        eu: "🇪🇺 Europe",
        africa: "🌍 Africa",
      };
      regionDisplay.textContent =
        regionMap[currentUserData.region] || "🌍 Global";
    });
}

function loadSettings(user) {
  const theme = localStorage.getItem("theme") || "dark";
  applyTheme(theme);
  const lang = localStorage.getItem("lang") || "en";
  applyLang(lang);
  const prefs = JSON.parse(
    localStorage.getItem("notif_prefs") ||
      '{"order_updates":true,"announcements":true,"price_alerts":true}'
  );
  Object.keys(prefs).forEach((key) => {
    const el = document.getElementById("notif-" + key);
    if (el) el.classList.toggle("active", prefs[key]);
  });
}

function checkEmailVerified(user) {
  const el = document.getElementById("email-verify-status");
  el.textContent = user.emailVerified
    ? "✅ Verified"
    : "❌ Not verified — tap to resend";
}

// --- ANTI-PHISHING ---
function openAntiPhishing() {
  document.getElementById("anti-phishing-input").value =
    currentUserData.antiPhishing || "";
  openModal("anti-phishing-modal");
}
function saveAntiPhishing() {
  const code = document.getElementById("anti-phishing-input").value.trim();
  if (!code) {
    showToast("Enter a code", "error");
    return;
  }
  db.collection("users")
    .doc(auth.currentUser.uid)
    .update({ antiPhishing: code })
    .then(() => {
      showToast("Anti-phishing code saved!", "success");
      closeModal("anti-phishing-modal");
    })
    .catch((err) => showToast(err.message, "error"));
}

// --- API KEYS ---
function openApiKeys() {
  let pub = localStorage.getItem("api_pub");
  let sec = localStorage.getItem("api_sec");
  if (!pub) {
    pub =
      "kpx_" +
      Array.from(crypto.getRandomValues(new Uint8Array(8)))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
    sec =
      "kpxs_" +
      Array.from(crypto.getRandomValues(new Uint8Array(12)))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
    localStorage.setItem("api_pub", pub);
    localStorage.setItem("api_sec", sec);
  }
  document.getElementById("api-public").textContent = pub;
  document.getElementById("api-secret").textContent = sec;
  openModal("api-keys-modal");
}
function regenerateApiKeys() {
  const pub =
    "kpx_" +
    Array.from(crypto.getRandomValues(new Uint8Array(8)))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  const sec =
    "kpxs_" +
    Array.from(crypto.getRandomValues(new Uint8Array(12)))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  localStorage.setItem("api_pub", pub);
  localStorage.setItem("api_sec", sec);
  document.getElementById("api-public").textContent = pub;
  document.getElementById("api-secret").textContent = sec;
  showToast("Keys regenerated!", "success");
}

// --- REGION ---
function openRegionSelector() {
  openModal("region-modal");
}
function setRegion(region) {
  db.collection("users")
    .doc(auth.currentUser.uid)
    .update({ region })
    .then(() => {
      showToast("Region updated to " + region, "success");
      closeModal("region-modal");
    })
    .catch((err) => showToast(err.message, "error"));
}

// --- DEMO BALANCE RESET ---
function resetDemoBalance() {
  if (!confirm("Add $10,000 USDT to your wallet for testing?")) return;
  const user = auth.currentUser;
  db.collection("wallets")
    .doc(user.uid)
    .update({
      USDT: firebase.firestore.FieldValue.increment(10000),
    })
    .then(() => {
      showToast("💰 $10,000 USDT added to your balance!", "success");
    })
    .catch((err) => showToast(err.message, "error"));
}

// --- LANGUAGE TOGGLE ---
function toggleLanguage() {
  const current = localStorage.getItem("lang") || "en";
  const next = current === "en" ? "am" : "en";
  localStorage.setItem("lang", next);
  applyLang(next);
}
function applyLang(lang) {
  const toggle = document.getElementById("lang-toggle");
  const label = document.getElementById("lang-label");
  if (toggle) toggle.classList.toggle("active", lang === "am");
  if (label) label.textContent = lang === "am" ? "አማርኛ" : "English";
  // Placeholder for future translation logic
}

// --- THEME ---
function toggleTheme() {
  const current = localStorage.getItem("theme") || "dark";
  const next = current === "dark" ? "light" : "dark";
  localStorage.setItem("theme", next);
  applyTheme(next);
}
function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  const toggle = document.getElementById("theme-toggle");
  const label = document.getElementById("theme-label");
  const icon = document.getElementById("theme-icon");
  if (toggle) toggle.classList.toggle("active", theme === "light");
  if (label) label.textContent = theme === "light" ? "Light Mode" : "Dark Mode";
  if (icon) icon.textContent = theme === "light" ? "☀️" : "🌙";
}

// --- NOTIFICATIONS ---
function toggleNotif(key) {
  const prefs = JSON.parse(
    localStorage.getItem("notif_prefs") ||
      '{"order_updates":true,"announcements":true,"price_alerts":true}'
  );
  prefs[key] = !prefs[key];
  localStorage.setItem("notif_prefs", JSON.stringify(prefs));
  const el = document.getElementById("notif-" + key);
  if (el) el.classList.toggle("active", prefs[key]);
  showToast(
    prefs[key] ? "Notifications enabled" : "Notifications disabled",
    "success"
  );
}

// --- LOGIN ACTIVITY ---
function loadLoginActivity(uid) {
  const container = document.getElementById("login-activity-list");
  // Simulate sessions (in production, write to Firestore on login)
  const sessions = JSON.parse(localStorage.getItem("sessions_" + uid) || "[]");
  if (sessions.length === 0) {
    // Add a dummy session if empty
    const dummy = {
      time: Date.now() - 3600000,
      ip: "192.168.1.1",
      device: "Chrome / Windows",
    };
    sessions.push(dummy);
    localStorage.setItem("sessions_" + uid, JSON.stringify(sessions));
  }
  container.innerHTML = sessions
    .map(
      (s) => `
    <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border);font-size:12px;">
      <span>${s.device || "Unknown Device"}</span>
      <span style="color:var(--text3);">${new Date(
        s.time
      ).toLocaleString()}</span>
      <span style="color:var(--text3);">${s.ip || "N/A"}</span>
    </div>
  `
    )
    .join("");
}

// --- SUPPORT CHAT ---
function openSupportChat() {
  openModal("support-chat-modal");
  const user = auth.currentUser;
  const chatId = "support_" + user.uid;
  if (supportChatUnsub) supportChatUnsub();
  supportChatUnsub = db
    .collection("chats")
    .doc(chatId)
    .onSnapshot((doc) => {
      const messages = doc.exists ? doc.data().messages || [] : [];
      renderSupportChat(messages, user.uid);
    });
}
function renderSupportChat(messages, uid) {
  const container = document.getElementById("support-chat-messages");
  if (messages.length === 0) {
    container.innerHTML =
      '<div style="text-align:center;padding:30px;color:var(--text3);">💬 Send us a message.</div>';
    return;
  }
  container.innerHTML = messages
    .map(
      (m) => `
    <div class="chat-msg ${m.sender === uid ? "mine" : "theirs"}">
      ${
        m.sender !== uid
          ? '<div style="font-size:10px;opacity:0.6;">Support</div>'
          : ""
      }
      ${
        m.type === "image"
          ? `<img src="${m.image}" style="max-width:200px;border-radius:8px;" />`
          : m.text
      }
    </div>
  `
    )
    .join("");
  container.scrollTop = container.scrollHeight;
}
function sendSupportMessage() {
  const user = auth.currentUser;
  const input = document.getElementById("support-chat-input");
  const text = input.value.trim();
  if (!text) return;
  const chatId = "support_" + user.uid;
  db.collection("chats")
    .doc(chatId)
    .set(
      {
        userId: user.uid,
        userEmail: user.email,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
        messages: firebase.firestore.FieldValue.arrayUnion({
          sender: user.uid,
          text,
          time: Date.now(),
        }),
      },
      { merge: true }
    )
    .then(() => (input.value = ""))
    .catch((err) => showToast(err.message, "error"));
}
function sendSupportImage() {
  const user = auth.currentUser;
  const input = document.getElementById("support-image-input");
  const file = input.files[0];
  if (!file) return;
  if (file.size > 3 * 1024 * 1024) {
    showToast("Image too large. Max 3MB.", "error");
    return;
  }
  const reader = new FileReader();
  reader.onload = (e) => {
    const chatId = "support_" + user.uid;
    db.collection("chats")
      .doc(chatId)
      .set(
        {
          userId: user.uid,
          userEmail: user.email,
          updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
          messages: firebase.firestore.FieldValue.arrayUnion({
            sender: user.uid,
            type: "image",
            image: e.target.result,
            time: Date.now(),
          }),
        },
        { merge: true }
      )
      .then(() => {
        input.value = "";
        showToast("Image sent!", "success");
      })
      .catch((err) => showToast(err.message, "error"));
  };
  reader.readAsDataURL(file);
}

// --- PASSWORD & DELETE (Keep existing functions) ---
function openChangePassword() {
  openModal("change-password-modal");
}
function changePassword() {
  const newPass = document.getElementById("new-password").value;
  const confirm = document.getElementById("confirm-password").value;
  if (!newPass || newPass.length < 6) {
    showToast("Min 6 chars", "error");
    return;
  }
  if (newPass !== confirm) {
    showToast("Passwords do not match", "error");
    return;
  }
  auth.currentUser
    .updatePassword(newPass)
    .then(() => {
      showToast("Password updated!", "success");
      closeModal("change-password-modal");
    })
    .catch((err) => showToast(err.message, "error"));
}
function send2FAEmail() {
  const user = auth.currentUser;
  if (user.emailVerified) {
    showToast("Already verified", "success");
    return;
  }
  user
    .sendEmailVerification()
    .then(() => showToast("Verification email sent!", "success"))
    .catch((err) => showToast(err.message, "error"));
}
function confirmDeleteAccount() {
  if (!confirm("Permanently delete your account and all data?")) return;
  const user = auth.currentUser;
  db.collection("users")
    .doc(user.uid)
    .delete()
    .then(() => db.collection("wallets").doc(user.uid).delete())
    .then(() => user.delete())
    .then(() => (window.location.href = "login.html"))
    .catch((err) => showToast(err.message, "error"));
}
function openModal(id) {
  document.getElementById(id).style.display = "flex";
}
function closeModal(id) {
  document.getElementById(id).style.display = "none";
}

// Attach support chat send to button (if modal exists)
document.addEventListener("DOMContentLoaded", () => {
  const btn = document.querySelector("#support-chat-modal .chat-send-btn");
  if (btn) btn.onclick = sendSupportMessage;
});
