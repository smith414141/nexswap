// staking.js
let currentUid = null;
const APR = { ETH: 3.8, BNB: 4.2, SOL: 6.1, DOT: 9.4 };

auth.onAuthStateChanged((user) => {
  if (!user) return;
  currentUid = user.uid;
  listenPositions();
});

function stakeNow() {
  const coin = document.getElementById("st-coin").value;
  const amount = parseFloat(document.getElementById("st-amount").value);

  if (!amount || amount <= 0) {
    showToast("Enter a valid amount", "error");
    return;
  }

  db.collection("stakingPositions")
    .add({
      userId: currentUid,
      coin,
      amount,
      apr: APR[coin],
      status: "active",
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    })
    .then(() => {
      showToast(`Staked ${amount} ${coin}`, "success");
      document.getElementById("st-amount").value = "";
    })
    .catch((err) => showToast(err.message, "error"));
}

function listenPositions() {
  db.collection("stakingPositions")
    .where("userId", "==", currentUid)
    .onSnapshot(
      (snap) => {
        const list = document.getElementById("stk-list");
        const empty = document.getElementById("stk-empty");
        const docs = snap.docs.filter((d) => d.data().status !== "unstaked");
        if (docs.length === 0) {
          list.innerHTML = "";
          empty.style.display = "block";
          return;
        }
        empty.style.display = "none";
        list.innerHTML = docs
          .map((doc) => {
            const p = doc.data();
            return `
          <div class="card" style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;padding:14px">
            <div>
              <div style="font-weight:700">${p.amount} ${p.coin}</div>
              <div style="font-size:11px;color:var(--green)">${p.apr}% APR</div>
            </div>
            <button class="btn-secondary" onclick="unstake('${doc.id}')">Unstake</button>
          </div>`;
          })
          .join("");
      },
      () => {
        document.getElementById("stk-list").innerHTML =
          '<div class="empty-state">Could not load positions.</div>';
      }
    );
}

function unstake(id) {
  db.collection("stakingPositions")
    .doc(id)
    .update({ status: "unstaked", unstakedAt: firebase.firestore.FieldValue.serverTimestamp() })
    .then(() => showToast("Unstaked successfully", "success"))
    .catch((err) => showToast(err.message, "error"));
}
