// tax-reports.js
function generateTaxReport() {
  const user = auth.currentUser;
  if (!user) return;
  const year = parseInt(document.getElementById("tax-year").value, 10);
  const start = new Date(year, 0, 1);
  const end = new Date(year + 1, 0, 1);

  Promise.all([
    db
      .collection("transactions")
      .where("userId", "==", user.uid)
      .get(),
    db
      .collection("tradeHistory")
      .where("userId", "==", user.uid)
      .get(),
  ])
    .then(([txSnap, tradeSnap]) => {
      const rows = [["Date", "Type", "Asset", "Amount", "Status"]];

      txSnap.forEach((doc) => {
        const d = doc.data();
        const date = d.createdAt?.toDate?.();
        if (!date || date < start || date >= end) return;
        rows.push([
          date.toLocaleDateString(),
          d.type || "transaction",
          d.crypto || d.toCoin || "--",
          d.amount || "--",
          d.status || "--",
        ]);
      });

      tradeSnap.forEach((doc) => {
        const d = doc.data();
        const date = d.createdAt?.toDate?.();
        if (!date || date < start || date >= end) return;
        rows.push([
          date.toLocaleDateString(),
          "trade",
          d.pair || d.symbol || "--",
          d.amount || "--",
          d.side || "--",
        ]);
      });

      if (rows.length === 1) {
        showToast(`No activity found for ${year}`, "warning");
        return;
      }

      const csv = rows.map((r) => r.join(",")).join("\n");
      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `kripex-tax-report-${year}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      showToast("Report downloaded", "success");
    })
    .catch((err) => showToast(err.message, "error"));
}
