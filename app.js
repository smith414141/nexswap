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

function friendlyAuthError(err) {
  const map = {
    "auth/user-not-found": "No account found with that email or phone.",
    "auth/wrong-password": "Incorrect password. Please try again.",
    "auth/invalid-email": "Please enter a valid email address.",
    "auth/email-already-in-use": "An account with this email already exists.",
    "auth/weak-password": "Password must be at least 6 characters.",
    "auth/too-many-requests": "Too many attempts. Please wait a few minutes and try again.",
    "auth/network-request-failed": "Network error. Check your connection and try again.",
    "auth/popup-blocked": "Popup was blocked. Please allow popups for this site.",
    "auth/cancelled-popup-request": "Sign-in was cancelled.",
    "auth/invalid-credential": "Incorrect email or password.",
    "auth/user-disabled": "This account has been disabled. Contact support.",
    "auth/account-exists-with-different-credential": "An account already exists with this email using a different sign-in method.",
    "auth/requires-recent-login": "Please log out and log in again to continue.",
    "auth/expired-action-code": "This link has expired. Please request a new one.",
    "auth/invalid-action-code": "This link is invalid or has already been used.",
  };
  if (err && err.code && map[err.code]) return map[err.code];
  if (err && err.message && err.message.toLowerCase().includes("network")) return "Network error. Check your connection and try again.";
  return "Something went wrong. Please try again.";
}

// ---- AUTH FUNCTIONS ----
function switchTab(tab) {
  document
    .querySelectorAll(".auth-tab")
    .forEach((t) => t.classList.remove("active"));
  document.getElementById("login-form").style.display = "none";
  document.getElementById("register-form").style.display = "none";
  const title = document.getElementById("auth-title");
  const subtitle = document.getElementById("auth-subtitle");
  if (tab === "login") {
    document.getElementById("login-form").style.display = "block";
    document.querySelectorAll(".auth-tab")[0].classList.add("active");
    if (title) title.textContent = "Welcome back";
    if (subtitle) subtitle.textContent = "Log in to your account";
  } else {
    document.getElementById("register-form").style.display = "block";
    document.querySelectorAll(".auth-tab")[1].classList.add("active");
    if (title) title.textContent = "Create an account";
    if (subtitle) subtitle.textContent = "Sign up to get started";
  }
  // Reset reCAPTCHA widget when switching tabs
  if (typeof grecaptcha !== "undefined") {
    grecaptcha.reset();
  }
}

function register() {
  const name = document.getElementById("reg-name").value.trim();
  const email = document.getElementById("reg-email").value.trim();
  const password = document.getElementById("reg-password").value;
  const countrySelect = document.getElementById("reg-country");
  const countryCode = countrySelect ? countrySelect.value : "ET";
  const phoneCodeVal = document.getElementById("reg-phone-code").value;
  const phoneNumber = document.getElementById("reg-phone").value.trim();
  const phone = phoneNumber
    ? `${phoneCodeVal}${phoneNumber.replace(/\s/g, "")}`
    : "";

  if (!name || !email || !password) {
    showToast("Please fill in all fields", "error");
    return;
  }
  if (password.length < 6) {
    showToast("Password must be at least 6 characters", "error");
    return;
  }

  // Phone is optional only when the user was shown and used the
  // Ethiopia "phone verification unavailable, skip" path in the wizard.
  if (phoneNumber) {
    const phoneClean = phone.replace(/\s/g, "");
    const phoneRegex = /^\+[1-9]\d{9,14}$/;
    if (!phoneRegex.test(phoneClean)) {
      showToast("Enter a valid phone number (e.g. 912345678)", "error");
      return;
    }
  } else if (countryCode !== "ET") {
    showToast("Enter your phone number", "error");
    return;
  }

  // reCAPTCHA v2 checkbox — user must tick "I'm not a robot" first
  const captchaToken = grecaptcha.getResponse();
  if (!captchaToken) {
    showToast("Please complete the captcha", "error");
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
    grecaptcha.reset();
  }, 10000);

  fetch("/api/verify-captcha", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token: captchaToken }),
  })
    .then((res) => res.json())
    .then((data) => {
      if (settled) return;
      settled = true;
      clearTimeout(failSafe);
      if (!data.success) {
        showToast("The security check has expired. Please tick the captcha again and try submitting.", "error");
        btn.disabled = false;
        btn.textContent = "Create Account";
        grecaptcha.reset();
        return;
      }
      proceedWithRegistration(name, email, password, phone, countryCode, btn);
    })
    .catch(() => {
      if (settled) return;
      settled = true;
      clearTimeout(failSafe);
      showToast("Security check failed. Please try again.", "error");
      btn.disabled = false;
      btn.textContent = "Create Account";
      grecaptcha.reset();
    });
}

function proceedWithRegistration(name, email, password, phone, countryCode, btn) {
  btn.textContent = "Creating account...";

  auth
    .createUserWithEmailAndPassword(email, password)
    .then((cred) => {
      const user = cred.user;
      // Generate a 6-digit code and store it in Firestore
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const otpExpiry = Date.now() + 15 * 60 * 1000; // 15 minutes
      return db.collection("emailOTPs").doc(user.uid).set({
        code: otp,
        expiry: otpExpiry,
        email: user.email,
      }).then(() => {
        // Also send the Firebase verification email as backup delivery
        return user.sendEmailVerification({
          url: window.location.origin + "/verify.html?uid=" + user.uid + "&code=" + otp,
          handleCodeInApp: false,
        });
      }).then(() => {
        return Promise.all([
          db.collection("users").doc(user.uid).set({
            name,
            email,
            phone,
            kycStatus: "none",
            merchantStatus: "none",
            country: countryCode || "ET",
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
          }),
          db.collection("wallets").doc(user.uid).set({
            BTC: 0,
            USDT: 0,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
          }),
          // Minimal phone -> email mapping only, used so users can log in
          // with their phone number instead of typing their email.
          db.collection("phoneIndex").doc(phone).set({
            email,
          }),
        ]);
      });
    })
    .then(() => {
      showToast("Account created! A 6-digit code has been sent to your email.", "success");
      setTimeout(() => (window.location.href = "verify.html"), 2000);
    })
    .catch((err) => {
      if (err.code === "auth/email-already-in-use") {
        // User already exists — try signing in with the same password
        auth.signInWithEmailAndPassword(email, password)
          .then((cred) => {
            const user = cred.user;
            if (!user.emailVerified) {
              // Check for existing valid OTP
              return db.collection("emailOTPs").doc(user.uid).get()
                .then((doc) => {
                  if (doc.exists && doc.data().expiry && doc.data().expiry > Date.now()) {
                    showToast("Account exists. Please verify your email.", "warning");
                    setTimeout(() => (window.location.href = "verify.html"), 1500);
                    return;
                  }
                  // No valid OTP — generate new one and resend
                  const otp = Math.floor(100000 + Math.random() * 900000).toString();
                  const otpExpiry = Date.now() + 15 * 60 * 1000;
                  return db.collection("emailOTPs").doc(user.uid).set({
                    code: otp,
                    expiry: otpExpiry,
                    email: user.email,
                  }).then(() => {
                    return user.sendEmailVerification({
                      url: window.location.origin + "/verify.html?uid=" + user.uid + "&code=" + otp,
                      handleCodeInApp: false,
                    });
                  }).then(() => {
                    showToast("Account exists. We sent a new code to your email.", "success");
                    setTimeout(() => (window.location.href = "verify.html"), 1500);
                  });
                });
            }
            // Already verified — log them in
            window.location.href = "home.html";
          })
          .catch((signInErr) => {
            // Wrong password or other error
            if (signInErr.code === "auth/wrong-password" || signInErr.code === "auth/invalid-credential") {
              showToast("An account with this email already exists. Please log in instead.", "error");
            } else {
              showToast(friendlyAuthError(signInErr), "error");
            }
          });
        return;
      }
      showToast(friendlyAuthError(err), "error");
      btn.disabled = false;
      btn.textContent = "Create Account";
    });
}

function login() {
  const rawInput = document.getElementById("login-email").value.trim();
  const password = document.getElementById("login-password").value;

  if (!rawInput || !password) {
    showToast("Please fill in all fields", "error");
    return;
  }

  const btn = document.querySelector("#login-form .btn-primary");
  btn.disabled = true;
  btn.textContent = "Logging in...";

  const timeout = setTimeout(() => {
    btn.disabled = false;
    btn.textContent = "Log in";
    showToast(
      "Connection timeout. Check your internet and try again.",
      "error"
    );
  }, 10000);

  // If the input doesn't look like an email, treat it as a phone number
  // and look up the matching email first.
  const looksLikeEmail = rawInput.includes("@");
  const resolveEmail = looksLikeEmail
    ? Promise.resolve(rawInput)
    : db
        .collection("phoneIndex")
        .doc(rawInput.replace(/\s/g, ""))
        .get()
        .then((doc) => {
          if (!doc.exists) {
            throw { message: "No account found with that phone number" };
          }
          return doc.data().email;
        });

  resolveEmail
    .then((email) => auth.signInWithEmailAndPassword(email, password))
    .then((cred) => {
      clearTimeout(timeout);
      if (!cred.user.emailVerified) {
        const user = cred.user;
        // Check for existing valid OTP in Firestore
        return db.collection("emailOTPs").doc(user.uid).get()
          .then((doc) => {
            if (doc.exists && doc.data().expiry && doc.data().expiry > Date.now()) {
              // Valid OTP exists, redirect normally
              showToast("Please verify your email first", "warning");
              setTimeout(() => (window.location.href = "verify.html"), 1500);
              return;
            }
            // No valid OTP — generate new one and resend
            const otp = Math.floor(100000 + Math.random() * 900000).toString();
            const otpExpiry = Date.now() + 15 * 60 * 1000;
            return db.collection("emailOTPs").doc(user.uid).set({
              code: otp,
              expiry: otpExpiry,
              email: user.email,
            }).then(() => {
              return user.sendEmailVerification({
                url: window.location.origin + "/verify.html?uid=" + user.uid + "&code=" + otp,
                handleCodeInApp: false,
              });
            }).then(() => {
              showToast("We sent a new code to your email.", "success");
              setTimeout(() => (window.location.href = "verify.html"), 1500);
            });
          });
      }
      btn.textContent = "Success!";
      window.location.href = "home.html";
    })
    .catch((err) => {
      clearTimeout(timeout);
      showToast(friendlyAuthError(err), "error");
      btn.disabled = false;
      btn.textContent = "Log in";
    });
}
// ---- GOOGLE SIGN-IN ----
function _handleOAuthSignIn(provider) {
  // Use redirect to avoid Firebase-branded popup screen
  auth.signInWithRedirect(provider).catch((err) => {
    if (err.code === "auth/cancelled-popup-request") return;
    showToast(friendlyAuthError(err), "error");
  });
}

// Handle redirect result on page load
auth.getRedirectResult().then((result) => {
  if (!result || !result.user) return;
  const user = result.user;
  const isNewUser = result.additionalUserInfo?.isNewUser;
  if (!isNewUser) {
    window.location.href = "home.html";
    return;
  }
  return Promise.all([
    db.collection("users").doc(user.uid).set({
      name: user.displayName || "User",
      email: user.email || "",
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
    window.location.href = "home.html";
  });
}).catch((err) => {
  if (!err || err.code === "auth/cancelled-popup-request") return;
  showToast(friendlyAuthError(err), "error");
});

function loginWithGoogle() {
  _handleOAuthSignIn(new firebase.auth.GoogleAuthProvider());
}

function loginWithGithub() {
  _handleOAuthSignIn(new firebase.auth.GithubAuthProvider());
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
    .catch((err) => showToast(friendlyAuthError(err), "error"));
}

// ---- INIT ----
document.addEventListener("DOMContentLoaded", () => {
  initCanvas();
  // Read ?tab= from URL and switch to register if needed
  const urlParams = new URLSearchParams(window.location.search);
  const tab = urlParams.get("tab");
  if (tab === "register" && typeof switchTab === "function") {
    switchTab("register");
  }
});

// ---- LOGOUT ----
function logoutUser() {
  auth.signOut().then(() => {
    window.location.href = "index.html?tab=login";
  });
}
