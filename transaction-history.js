// transaction-history.js
let allTx = [];
let currentFilter = "all";

auth.onAuthStateChanged((user) => {
  if (!user) return;
  db.collection("transactions")
    .where("userId", "==", user.uid)
    .orderBy("createdAt", "desc")
    .onSnapshot(
      (snap) => {
        allTx = snap.docs.map((d) => d.data());
        renderTx(currentFilter);
      },
      () => {
        document.getElementById("tx-table-container").innerHTML =
          '<div class="empty-state">Could not load transaction history.</div>';
      }
    );
});

function renderTx(filter) {
  currentFilter = filter;
  const container = document.getElementById("tx-table-container");
  const empty = document.getElementById("th-empty");
  const rows =
    filter === "all"
      ? allTx
      : allTx.filter((t) => (t.type || "").includes(filter));

  if (rows.length === 0) {
    container.innerHTML = "";
    empty.style.display = "block";
    return;
  }
  empty.style.display = "none";

  container.innerHTML = `
    <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
      <thead>
        <tr style="background: var(--bg3); border-bottom: 1px solid var(--border);">
          <th style="text-align: left; padding: 10px 12px; font-size: 10px; font-weight: 700; color: var(--text3); text-transform: uppercase; letter-spacing: 0.04em;">Type</th>
          <th style="text-align: left; padding: 10px 12px; font-size: 10px; font-weight: 700; color: var(--text3); text-transform: uppercase; letter-spacing: 0.04em;">Asset</th>
          <th style="text-align: right; padding: 10px 12px; font-size: 10px; font-weight: 700; color: var(--text3); text-transform: uppercase; letter-spacing: 0.04em;">Amount</th>
          <th style="text-align: right; padding: 10px 12px; font-size: 10px; font-weight: 700; color: var(--text3); text-transform: uppercase; letter-spacing: 0.04em;">Price</th>
          <th style="text-align: right; padding: 10px 12px; font-size: 10px; font-weight: 700; color: var(--text3); text-transform: uppercase; letter-spacing: 0.04em;">Total</th>
          <th style="text-align: center; padding: 10px 12px; font-size: 10px; font-weight: 700; color: var(--text3); text-transform: uppercase; letter-spacing: 0.04em;">Status</th>
          <th style="text-align: left; padding: 10px 12px; font-size: 10px; font-weight: 700; color: var(--text3); text-transform: uppercase; letter-spacing: 0.04em;">Date</th>
        </tr>
      </thead>
      <tbody>
        ${rows.map((t) => {
          const date = t.createdAt?.toDate?.()?.toLocaleString() || "--";
          const statusClass =
            t.status === "completed"
              ? "badge-green"
              : t.status === "pending"
              ? "badge-yellow"
              : "badge-grey";
          
          let typeIcon = "";
          let typeDisplay = (t.type || "Transaction").charAt(0).toUpperCase() + (t.type || "Transaction").slice(1);
          if (typeDisplay.toLowerCase().includes("deposit")) typeIcon = "⬇";
          else if (typeDisplay.toLowerCase().includes("withdraw")) typeIcon = "⬆";
          else if (typeDisplay.toLowerCase().includes("trade")) typeIcon = "⇄";
          
          const asset = t.crypto || t.coin || t.fromCoin || t.toCoin || t.asset || "";
          const amount = t.amount || t.quantity || t.fromAmount || "";
          const price = t.price || "";
          const total = t.usdValue || t.total || "";
          const status = t.status || "completed";

          return `
          <tr style="border-bottom: 1px solid var(--border);">
            <td style="padding: 10px 12px; display: flex; align-items: center; gap: 6px;">
              <span style="color: ${typeDisplay.toLowerCase().includes('deposit') ? 'var(--green)' : typeDisplay.toLowerCase().includes('withdraw') ? 'var(--red)' : 'var(--blue)'};">${typeIcon}</span>
              <span>${typeDisplay}</span>
            </td>
            <td style="padding: 10px 12px; font-weight: 600; font-family: var(--font-mono);">${asset}</td>
            <td style="padding: 10px 12px; text-align: right; font-family: var(--font-mono);">${amount}</td>
            <td style="padding: 10px 12px; text-align: right; font-family: var(--font-mono); color: var(--text2);">${price}</td>
            <td style="padding: 10px 12px; text-align: right; font-family: var(--font-mono); font-weight: 600;">${total}</td>
            <td style="padding: 10px 12px; text-align: center;">
              <span class="badge ${statusClass}">${status}</span>
            </td>
            <td style="padding: 10px 12px; font-size: 12px; color: var(--text2);">${date}</td>
          </tr>`;
        }).join("")}
      </tbody>
    </table>
  `;
}

function filterTx(type, btn) {
  document
    .querySelectorAll("#th-tabs .fh-tab")
    .forEach((t) => t.classList.remove("active"));
  btn.classList.add("active");
  renderTx(type);
}

function exportCsv() {
  const rows =
    currentFilter === "all"
      ? allTx
      : allTx.filter((t) => (t.type || "").includes(currentFilter));

  if (rows.length === 0) {
    showToast("No data to export", "error");
    return;
  }

  const headers = ["Type", "Asset", "Amount", "Price", "Total", "Status", "Date"];
  const csvRows = [headers.join(",")];

  rows.forEach((t) => {
    const date = t.createdAt?.toDate?.()?.toLocaleString() || "--";
    const type = t.type || "";
    const asset = t.crypto || t.coin || t.fromCoin || t.toCoin || t.asset || "";
    const amount = t.amount || t.quantity || t.fromAmount || "";
    const price = t.price || "";
    const total = t.usdValue || t.total || "";
    const status = t.status || "completed";

    csvRows.push(
      [type, asset, amount, price, total, status, date]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(",")
    );
  });

  const csv = csvRows.join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `kripex-transactions-${new Date().toISOString().split("T")[0]}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  showToast("CSV exported", "success");
}