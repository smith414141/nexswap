let supportChatUnsub = null;

auth.onAuthStateChanged((user) => {
  if (!user || !user.emailVerified) return;
  loadSettings(user);
  checkEmailVerified(user);
});

function loadSettings(user) {
  const theme = localStorage.getItem("theme") || "dark";
  applyTheme(theme);

  const prefs = JSON.parse(
    localStorage.getItem("notif_prefs") ||
      '{"order_updates":true,"announcements":true}'
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

function send2FAEmail() {
  const user = auth.currentUser;
  if (user.emailVerified) {
    showToast("Your email is already verified", "success");
    return;
  }
  user
    .sendEmailVerification()
    .then(() => {
      showToast("Verification email sent!", "success");
    })
    .catch((err) => showToast(err.message, "error"));
}

// ---- THEME ----
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

// ---- NOTIFICATIONS ----
function toggleNotif(key) {
  const prefs = JSON.parse(
    localStorage.getItem("notif_prefs") ||
      '{"order_updates":true,"announcements":true}'
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

// ---- CHANGE PASSWORD ----
function openChangePassword() {
  openModal("change-password-modal");
}

function changePassword() {
  const newPass = document.getElementById("new-password").value;
  const confirm = document.getElementById("confirm-password").value;
  if (!newPass || newPass.length < 6) {
    showToast("Password must be at least 6 characters", "error");
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

// ---- DELETE ACCOUNT ----
function confirmDeleteAccount() {
  if (
    !confirm(
      "Are you sure? This will permanently delete your account and all data. This cannot be undone."
    )
  )
    return;
  const user = auth.currentUser;
  db.collection("users")
    .doc(user.uid)
    .delete()
    .then(() => {
      return db.collection("wallets").doc(user.uid).delete();
    })
    .then(() => {
      return user.delete();
    })
    .then(() => {
      window.location.href = "index.html";
    })
    .catch((err) => {
      if (err.code === "auth/requires-recent-login") {
        showToast(
          "Please log out and log back in before deleting your account",
          "error"
        );
      } else {
        showToast(err.message, "error");
      }
    });
}

// ---- SUPPORT CHAT (#18) ----
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
    container.innerHTML = `
      <div style="text-align:center; padding:30px 16px; color:var(--text3);">
        <div style="font-size:32px; margin-bottom:8px;">💬</div>
        <div style="font-size:13px;">Send us a message and we'll get back to you shortly.</div>
      </div>
    `;
    return;
  }
  container.innerHTML = messages
    .map(
      (m) => `
    <div class="chat-msg ${m.sender === uid ? "mine" : "theirs"}">
      ${
        m.sender !== uid
          ? `<div style="font-size:10px; opacity:0.6; margin-bottom:2px;">Support</div>`
          : ""
      }
      ${m.text}
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
    .then(() => {
      input.value = "";
    })
    .catch((err) => showToast(err.message, "error"));
}

function openModal(id) {
  document.getElementById(id).style.display = "flex";
}
function closeModal(id) {
  document.getElementById(id).style.display = "none";
}
