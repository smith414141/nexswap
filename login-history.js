// login-history.js — reuses the same simulated-session pattern as settings.js
auth.onAuthStateChanged((user) => {
  if (!user) return;
  const sessions = JSON.parse(
    localStorage.getItem("sessions_" + user.uid) || "[]"
  );
  const list = document.getElementById("lh-list");
  if (sessions.length === 0) {
    list.innerHTML =
      '<div class="empty-state">No login history recorded yet.</div>';
    return;
  }
  list.innerHTML = sessions
    .slice()
    .reverse()
    .map(
      (s) => `
    <div class="card" style="margin-bottom:10px;padding:14px">
      <div style="display:flex;justify-content:space-between">
        <strong>${s.device || "Unknown device"}</strong>
        <span style="font-size:11px;color:var(--text3)">${new Date(
          s.time
        ).toLocaleString()}</span>
      </div>
      <div style="font-size:12px;color:var(--text2);margin-top:4px">IP: ${
        s.ip || "N/A"
      }</div>
    </div>`
    )
    .join("");
});
