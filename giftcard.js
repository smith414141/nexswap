// giftcard.js
const GC_DESIGNS = [
  { icon: "🎁", name: "Gift" },
  { icon: "🎉", name: "Celebration" },
  { icon: "💎", name: "Diamond" },
  { icon: "🚀", name: "Rocket" },
  { icon: "☀️", name: "Sunshine" },
  { icon: "🎂", name: "Birthday" },
  { icon: "❤️", name: "Love" },
  { icon: "🏆", name: "Champion" },
];

let currentUid = null;
let userWallet = {};
let selectedDesign = GC_DESIGNS[0].icon;

document.addEventListener("DOMContentLoaded", () => {
  auth.onAuthStateChanged((user) => {
    if (!user || !user.emailVerified) return;
    currentUid = user.uid;
    initGiftCards();
  });
});

function initGiftCards() {
  renderDesigns();
  listenWallet();
  updatePreview();
}

function listenWallet() {
  db.collection("wallets")
    .doc(currentUid)
    .onSnapshot((doc) => {
      if (!doc.exists) return;
      userWallet = doc.data();
    });
}

function renderDesigns() {
  const container = document.getElementById("gc-designs");
  container.innerHTML = GC_DESIGNS.map((d) => `
    <button type="button" class="design-btn" data-icon="${d.icon}" style="
      width: 56px; height: 56px; border-radius: 12px;
      background: var(--bg2); border: 2px solid var(--border);
      display: flex; align-items: center; justify-content: center;
      font-size: 24px; cursor: pointer; transition: all 0.15s;
      ${d.icon === selectedDesign ? 'border-color: var(--blue); background: rgba(59,130,246,0.1);' : ''}
    " onclick="selectDesign('${d.icon}')" aria-label="${d.name}">
      ${d.icon}
    </button>
  `).join("");
}

function selectDesign(icon) {
  selectedDesign = icon;
  document.querySelectorAll(".design-btn").forEach(btn => {
    const isSelected = btn.dataset.icon === icon;
    btn.style.borderColor = isSelected ? "var(--blue)" : "var(--border)";
    btn.style.background = isSelected ? "rgba(59,130,246,0.1)" : "var(--bg2)";
  });
  updatePreview();
}

function setAmount(amount) {
  document.getElementById("gc-amount").value = amount;
  updatePreview();
}

function updatePreview() {
  const amount = parseFloat(document.getElementById("gc-amount").value) || 0;
  const email = document.getElementById("gc-email").value.trim();
  const message = document.getElementById("gc-message").value.trim();

  document.getElementById("preview-icon").textContent = selectedDesign;
  document.getElementById("preview-amount").textContent = `$${amount.toLocaleString()}`;
  document.getElementById("preview-to").textContent = email || "—";

  const msgEl = document.getElementById("preview-message");
  const msgText = document.getElementById("preview-message-text");
  if (message) {
    msgText.textContent = message;
    msgEl.style.display = "block";
  } else {
    msgEl.style.display = "none";
  }
}

async function sendGiftCard() {
  const amount = parseFloat(document.getElementById("gc-amount").value);
  const email = document.getElementById("gc-email").value.trim();
  const message = document.getElementById("gc-message").value.trim();

  if (!amount || amount <= 0) {
    showToast("Enter a valid amount", "error");
    return;
  }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    showToast("Enter a valid recipient email", "error");
    return;
  }

  const usdtBalance = userWallet.USDT || 0;
  if (amount > usdtBalance) {
    showToast(`Insufficient USDT balance (have $${usdtBalance.toLocaleString()})`, "error");
    return;
  }

  const btn = document.querySelector(".btn-primary[onclick='sendGiftCard()']");
  btn.disabled = true;
  btn.textContent = "Sending...";

  try {
    // Deduct USDT
    await db.collection("wallets").doc(currentUid).update({
      USDT: firebase.firestore.FieldValue.increment(-amount),
    });

    // Generate redeem code
    const code = Math.random().toString(36).substring(2, 14).toUpperCase();

    // Create gift card record
    await db.collection("giftCards").add({
      senderId: currentUid,
      recipientEmail: email,
      amount,
      message,
      icon: selectedDesign,
      code,
      status: "sent",
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    });

    logTransaction(currentUid, "giftcard_send", "USDT", amount, "USDT", `Gift card sent to ${email}`);

    showToast(`Gift card sent to ${email}! Redeem code: ${code}`, "success");

    // Reset form
    document.getElementById("gc-amount").value = "";
    document.getElementById("gc-email").value = "";
    document.getElementById("gc-message").value = "";
    selectedDesign = GC_DESIGNS[0].icon;
    renderDesigns();
    updatePreview();
  } catch (err) {
    showToast(err.message, "error");
  } finally {
    btn.disabled = false;
    btn.textContent = "Send Gift Card →";
  }
}