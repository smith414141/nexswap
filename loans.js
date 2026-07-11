// loans.js
let currentUid = null;

auth.onAuthStateChanged((user) => {
  if (!user) return;
  currentUid = user.uid;
  db.collection("users")
    .doc(currentUid)
    .onSnapshot((doc) => {
      const loans = (doc.exists && doc.data().loans) || [];
      renderLoans(loans);
    });
});

function applyLoan() {
  const collateralCoin = document.getElementById("ln-collateral").value;
  const collateralAmount = parseFloat(
    document.getElementById("ln-amount").value
  );
  const ltv = parseInt(document.getElementById("ln-ltv").value, 10);

  if (!collateralAmount || collateralAmount <= 0) {
    showToast("Enter a valid collateral amount", "error");
    return;
  }

  const entry = {
    id: Date.now().toString(),
    collateralCoin,
    collateralAmount,
    ltv,
    status: "pending",
    createdAt: Date.now(),
  };

  db.collection("users")
    .doc(currentUid)
    .set(
      { loans: firebase.firestore.FieldValue.arrayUnion(entry) },
      { merge: true }
    )
    .then(() => {
      showToast("Loan application submitted", "success");
      document.getElementById("ln-amount").value = "";
    })
    .catch((err) => showToast(err.message, "error"));
}

function renderLoans(loans) {
  const list = document.getElementById("ln-list");
  const empty = document.getElementById("ln-empty");
  if (loans.length === 0) {
    list.innerHTML = "";
    empty.style.display = "block";
    return;
  }
  empty.style.display = "none";
  list.innerHTML = loans
    .map(
      (l) => `
    <div class="card" style="margin-bottom:10px;padding:14px">
      <div style="display:flex;justify-content:space-between">
        <strong>${l.collateralAmount} ${l.collateralCoin} @ ${l.ltv}% LTV</strong>
        <span class="badge badge-yellow">${l.status}</span>
      </div>
      <div style="font-size:11px;color:var(--text3);margin-top:6px">Applied ${new Date(
        l.createdAt
      ).toLocaleDateString()}</div>
    </div>`
    )
    .join("");
}
