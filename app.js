// ---- CANVAS BACKGROUND ----
function initCanvas() {
  const canvas = document.getElementById("bg-canvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  window.addEventListener("resize", () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  });
  const symbols = ["₿", "₮", "◎", "⬡", "✦", "◈", "⟠"];
  const particles = [];
  for (let i = 0; i < 25; i++) {
    particles.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      symbol: symbols[Math.floor(Math.random() * symbols.length)],
      size: Math.random() * 12 + 6,
      speedX: (Math.random() - 0.5) * 0.3,
      speedY: (Math.random() - 0.5) * 0.3,
      opacity: Math.random() * 0.08 + 0.02,
      color: ["#3B82F6", "#8B5CF6", "#F0B90B", "#10b981"][
        Math.floor(Math.random() * 4)
      ],
    });
  }
  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach((p) => {
      ctx.globalAlpha = p.opacity;
      ctx.fillStyle = p.color;
      ctx.font = `${p.size}px Inter`;
      ctx.fillText(p.symbol, p.x, p.y);
      p.x += p.speedX;
      p.y += p.speedY;
      if (p.x > canvas.width + 20) p.x = -20;
      if (p.x < -20) p.x = canvas.width + 20;
      if (p.y > canvas.height + 20) p.y = -20;
      if (p.y < -20) p.y = canvas.height + 20;
    });
    ctx.globalAlpha = 1;
    requestAnimationFrame(animate);
  }
  animate();
}

// ---- TOAST ----
// Apply saved theme on every page load
(function () {
  const theme = localStorage.getItem("theme") || "dark";
  document.documentElement.setAttribute("data-theme", theme);
})();
function goBack() {
  if (document.referrer && document.referrer !== window.location.href) {
    window.history.back();
  } else {
    window.location.href = "home.html";
  }
}
function showToast(message, type = "success") {
  let container = document.getElementById("toast-container");
  if (!container) {
    container = document.createElement("div");
    container.id = "toast-container";
    document.body.appendChild(container);
  }
  const icons = { success: "✅", error: "❌", info: "ℹ️", warning: "⚠️" };
  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
      <div class="toast-icon">${icons[type] || "💬"}</div>
      <div class="toast-message">${message}</div>
      <div class="toast-close" onclick="this.parentElement.remove()">✕</div>
      <div class="toast-progress"></div>
    `;
  container.appendChild(toast);
  setTimeout(() => toast.classList.add("toast-show"), 10);
  setTimeout(() => {
    toast.classList.remove("toast-show");
    toast.classList.add("toast-hide");
    setTimeout(() => toast.remove(), 400);
  }, 4000);
}

// ---- AUTH FUNCTIONS ----
function switchTab(tab) {
  document
    .querySelectorAll(".auth-tab")
    .forEach((t) => t.classList.remove("active"));
  document.getElementById("login-form").style.display = "none";
  document.getElementById("register-form").style.display = "none";
  if (tab === "login") {
    document.getElementById("login-form").style.display = "block";
    document.querySelectorAll(".auth-tab")[0].classList.add("active");
  } else {
    document.getElementById("register-form").style.display = "block";
    document.querySelectorAll(".auth-tab")[1].classList.add("active");
  }
}

function register() {
  const name = document.getElementById("reg-name").value.trim();
  const email = document.getElementById("reg-email").value.trim();
  const password = document.getElementById("reg-password").value;
  const phone = document.getElementById("reg-phone").value.trim();

  if (!name || !email || !password || !phone) {
    showToast("Please fill in all fields", "error");
    return;
  }
  if (password.length < 6) {
    showToast("Password must be at least 6 characters", "error");
    return;
  }

  const phoneClean = phone.replace(/\s/g, "");
  const phoneRegex = /^\+[1-9]\d{9,14}$/;
  if (!phoneRegex.test(phoneClean)) {
    showToast(
      "Enter a valid phone number with country code (e.g. +251912345678)",
      "error"
    );
    return;
  }

  const btn = document.querySelector("#register-form .btn-primary");
  btn.disabled = true;
  btn.textContent = "Verifying...";

  let settled = false;
  const failSafe = setTimeout(() => {
    if (settled) return;
    settled = true;
    showToast("Security check timed out. Please try again.", "error");
    btn.disabled = false;
    btn.textContent = "Create Account";
  }, 10000);

  try {
    grecaptcha.ready(() => {
      grecaptcha
        .execute("6Ldt_x8tAAAAAC5nOTlZno2TujGj2Frsq4wb4saJ", {
          action: "register",
        })
        .then((token) => {
          return fetch("/api/verify-captcha", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ token }),
          });
        })
        .then((res) => res.json())
        .then((data) => {
          if (settled) return;
          settled = true;
          clearTimeout(failSafe);
          if (!data.success) {
            showToast("Security check failed. Please try again.", "error");
            btn.disabled = false;
            btn.textContent = "Create Account";
            return;
          }
          proceedWithRegistration(name, email, password, phone, btn);
        })
        .catch(() => {
          if (settled) return;
          settled = true;
          clearTimeout(failSafe);
          showToast("Security check failed. Please try again.", "error");
          btn.disabled = false;
          btn.textContent = "Create Account";
        });
    });
  } catch (e) {
    if (!settled) {
      settled = true;
      clearTimeout(failSafe);
      showToast("Security check failed. Please try again.", "error");
      btn.disabled = false;
      btn.textContent = "Create Account";
    }
  }
}

function proceedWithRegistration(name, email, password, phone, btn) {
  btn.textContent = "Creating account...";

  auth
    .createUserWithEmailAndPassword(email, password)
    .then((cred) => {
      const user = cred.user;
      return Promise.all([
        db.collection("users").doc(user.uid).set({
          name,
          email,
          phone,
          kycStatus: "none",
          merchantStatus: "none",
          country: "ET",
          createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        }),
        db.collection("wallets").doc(user.uid).set({
          BTC: 0,
          USDT: 0,
          updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
        }),
        user.sendEmailVerification(),
      ]);
    })
    .then(() => {
      showToast(
        "Account created! Check your email (and SPAM folder) to verify.",
        "success"
      );
      setTimeout(() => (window.location.href = "/verify.html"), 2000);
    })
    .catch((err) => {
      showToast(err.message, "error");
      btn.disabled = false;
      btn.textContent = "Create Account";
    });
}

function login() {
  const email = document.getElementById("login-email").value.trim();
  const password = document.getElementById("login-password").value;

  if (!email || !password) {
    showToast("Please fill in all fields", "error");
    return;
  }

  const btn = document.querySelector("#login-form .btn-primary");
  btn.disabled = true;
  btn.textContent = "Logging in...";

  const timeout = setTimeout(() => {
    btn.disabled = false;
    btn.textContent = "Login";
    showToast(
      "Connection timeout. Check your internet and try again.",
      "error"
    );
  }, 10000);

  auth
    .signInWithEmailAndPassword(email, password)
    .then((cred) => {
      clearTimeout(timeout);
      if (!cred.user.emailVerified) {
        showToast("Please verify your email first", "warning");
        setTimeout(() => (window.location.href = "/verify.html"), 1500);
        return;
      }
      btn.textContent = "Success!";
      window.location.href = "/home.html";
    })
    .catch((err) => {
      clearTimeout(timeout);
      showToast(err.message, "error");
      btn.disabled = false;
      btn.textContent = "Login";
    });
}
// ---- GOOGLE SIGN-IN ----
function loginWithGoogle() {
  const provider = new firebase.auth.GoogleAuthProvider();

  auth
    .signInWithPopup(provider)
    .then((result) => {
      const user = result.user;
      const isNewUser = result.additionalUserInfo?.isNewUser;

      if (!isNewUser) {
        // Returning user — just log them in, don't touch their data
        window.location.href = "/home.html";
        return;
      }

      // New user — create their user + wallet docs, same as email signup
      return Promise.all([
        db
          .collection("users")
          .doc(user.uid)
          .set({
            name: user.displayName || "User",
            email: user.email,
            phone: "",
            kycStatus: "none",
            merchantStatus: "none",
            country: "ET",
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
          }),
        db.collection("wallets").doc(user.uid).set({
          BTC: 0,
          USDT: 0,
          updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
        }),
      ]).then(() => {
        window.location.href = "/home.html";
      });
    })
    .catch((err) => {
      if (err.code === "auth/popup-closed-by-user") return;
      showToast(err.message, "error");
    });
}

function forgotPassword() {
  const email = document.getElementById("login-email").value.trim();
  if (!email) {
    showToast("Enter your email above first, then tap Reset", "warning");
    return;
  }
  auth
    .sendPasswordResetEmail(email)
    .then(() => showToast("Password reset link sent to your email!", "success"))
    .catch((err) => showToast(err.message, "error"));
}

// ---- INIT ----
document.addEventListener("DOMContentLoaded", () => {
  initCanvas();
  initFloatingChat();
});

// ---- LOGOUT ----
function logoutUser() {
  auth.signOut().then(() => {
    window.location.href = "/index.html";
  });
}
// ============ FLOATING CHAT ============
function initFloatingChat() {
  // Don't show on messages or settings page
  const page = window.location.pathname;
  if (
    page.includes("messages") ||
    page.includes("settings") ||
    page.includes("admin") ||
    page.includes("index") ||
    page.includes("verify")
  )
    return;

  const btn = document.createElement("button");
  btn.className = "float-chat-btn";
  btn.innerHTML = "💬";
  btn.onclick = toggleFloatChat;
  document.body.appendChild(btn);

  const modal = document.createElement("div");
  modal.className = "float-chat-modal";
  modal.id = "float-chat-modal";
  modal.innerHTML = `
    <div class="float-chat-header">
      <span>💬 Support Chat</span>
      <span style="cursor:pointer; font-size:16px;" onclick="toggleFloatChat()">✕</span>
    </div>
    <div class="float-chat-messages" id="float-chat-messages">
      <div style="text-align:center; color:var(--text3); font-size:12px; padding:20px 0;">
        Send us a message — we typically reply within a few hours.
      </div>
    </div>
    <div class="float-chat-input-area">
      <div class="chat-input-row" style="margin-bottom:6px;">
        <input type="text" id="float-chat-input" placeholder="Type a message..." onkeypress="if(event.key==='Enter') sendFloatMessage()" style="font-size:12px;" />
        <button class="chat-send-btn" onclick="sendFloatMessage()">➤</button>
      </div>
      <label style="display:flex; align-items:center; gap:6px; font-size:11px; color:var(--text2); cursor:pointer;">
        📎 <span>Attach image</span>
        <input type="file" id="float-image-input" accept="image/*" style="display:none;" onchange="sendFloatImage()" />
      </label>
    </div>
  `;
  document.body.appendChild(modal);
}

function toggleFloatChat() {
  const modal = document.getElementById("float-chat-modal");
  if (!modal) return;
  modal.classList.toggle("open");
  if (modal.classList.contains("open")) loadFloatChat();
}

let floatChatUnsub = null;

function loadFloatChat() {
  const user = auth.currentUser;
  if (!user) return;
  const chatId = "support_" + user.uid;
  if (floatChatUnsub) floatChatUnsub();

  floatChatUnsub = db
    .collection("chats")
    .doc(chatId)
    .onSnapshot((doc) => {
      const messages = doc.exists ? doc.data().messages || [] : [];
      const container = document.getElementById("float-chat-messages");
      if (!container) return;
      if (messages.length === 0) {
        container.innerHTML = `<div style="text-align:center; color:var(--text3); font-size:12px; padding:20px 0;">Send us a message — we typically reply within a few hours.</div>`;
        return;
      }
      container.innerHTML = messages
        .map(
          (m) => `
      <div class="chat-msg ${
        m.sender === user.uid ? "mine" : "theirs"
      }" style="font-size:12px;">
        ${
          m.type === "image"
            ? `<img src="${m.image}" style="max-width:160px; border-radius:8px;" />`
            : m.text
        }
      </div>
    `
        )
        .join("");
      container.scrollTop = container.scrollHeight;
    });
}

function sendFloatMessage() {
  const user = auth.currentUser;
  const input = document.getElementById("float-chat-input");
  const text = input.value.trim();
  if (!text || !user) return;
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
    });
}

function sendFloatImage() {
  const user = auth.currentUser;
  const input = document.getElementById("float-image-input");
  const file = input.files[0];
  if (!file || !user) return;
  if (file.size > 3 * 1024 * 1024) {
    showToast("Max 3MB", "error");
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
      });
  };
  reader.readAsDataURL(file);
}
