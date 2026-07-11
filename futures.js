// futures.js
let futSide = "long";
const FUT_PRICE = 67500;

document.addEventListener("DOMContentLoaded", () => {
  gateFeatureByRegion({
    allowed: ["global", "eu"],
    featureName: "Futures Trading",
    contentId: "feature-content",
    gateId: "region-gate",
  });
});

function setFutSide(side, btn) {
  futSide = side;
  document.querySelectorAll("#fut-tab-long, #fut-tab-short").forEach((b) => b.classList.remove("active"));
  btn.classList.add("active");
  const submitBtn = document.getElementById("fut-submit-btn");
  if (side === "long") {
    submitBtn.textContent = "Open Long Position";
    submitBtn.style.background = "var(--green)";
  } else {
    submitBtn.textContent = "Open Short Position";
    submitBtn.style.background = "var(--red)";
  }
}

function updateFutEstimate() {
  const margin = parseFloat(document.getElementById("fut-margin").value) || 0;
  const leverage = parseFloat(document.getElementById("fut-leverage").value) || 1;
  document.getElementById("fut-position-size").textContent =
    "$" + (margin * leverage).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function openFutPosition() {
  const user = auth.currentUser;
  if (!user) return;
  const margin = parseFloat(document.getElementById("fut-margin").value) || 0;
  const leverage = parseFloat(document.getElementById("fut-leverage").value) || 1;

  if (margin <= 0) {
    showToast("Enter a margin amount", "error");
    return;
  }

  db.collection("wallets")
    .doc(user.uid)
    .get()
    .then((doc) => {
      const usdt = doc.data()?.USDT || 0;
      if (margin > usdt) {
        showToast("Insufficient USDT balance", "error");
        return;
      }
      return db.collection("wallets").doc(user.uid).update({
        USDT: firebase.firestore.FieldValue.increment(-margin),
      });
    })
    .then(() => {
      if (typeof logTransaction === "function") {
        logTransaction(user.uid, `futures_${futSide}`, "USDT", margin, "USDT", `${leverage}x leverage`);
      }
      renderNewFutPosition(margin, leverage);
      showToast(`${futSide === "long" ? "Long" : "Short"} position opened`, "success");
      document.getElementById("fut-margin").value = "";
      updateFutEstimate();
    })
    .catch((err) => showToast(err.message, "error"));
}

function renderNewFutPosition(margin, leverage) {
  const list = document.getElementById("fut-positions-list");
  const empty = list.querySelector("p");
  if (empty) empty.remove();

  const row = document.createElement("div");
  row.style = "display:flex; justify-content:space-between; align-items:center; padding:10px 0; border-bottom:1px solid var(--border)";
  row.innerHTML = `
    <div>
      <div style="font-weight:700; font-size:13px; color:${futSide === "long" ? "var(--green)" : "var(--red)"}">
        BTC/USDT ${futSide.toUpperCase()} ${leverage}x
      </div>
      <div style="font-size:11px; color:var(--text2)">Margin: $${margin.toFixed(2)} · Entry: $${FUT_PRICE.toLocaleString()}</div>
    </div>
    <button class="btn-secondary" style="padding:6px 12px; font-size:12px" onclick="this.closest('div[style]').remove()">Close</button>
  `;
  list.prepend(row);
}
