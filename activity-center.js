// activity-center.js
auth.onAuthStateChanged((user) => {
  if (!user) return;
  db.collection("users")
    .doc(user.uid)
    .onSnapshot((doc) => {
      const data = doc.exists ? doc.data() : {};
      renderTasks(data);
      document.getElementById("ac-points").textContent =
        data.activityPoints || 0;
    });
});

function renderTasks(data) {
  const tasks = [
    {
      label: "Verify your email",
      done: !!(auth.currentUser && auth.currentUser.emailVerified),
      points: 10,
    },
    {
      label: "Complete KYC verification",
      done: data.kycStatus === "approved",
      points: 50,
    },
    {
      label: "Make your first trade",
      done: !!data.hasTraded,
      points: 30,
    },
    {
      label: "Add a withdrawal address",
      done: false,
      points: 15,
      href: "address-book.html",
    },
    {
      label: "Enable Two-Factor Authentication",
      done: !!data.twoFactorEnabled,
      points: 25,
      href: "settings.html",
    },
    {
      label: "Invite a friend",
      done: false,
      points: 20,
      href: "referral.html",
    },
  ];

  document.getElementById("ac-list").innerHTML = tasks
    .map(
      (t) => `
    <div class="card" style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;padding:14px;${
      t.href ? "cursor:pointer" : ""
    }" ${t.href ? `onclick="location.href='${t.href}'"` : ""}>
      <div>
        <div style="font-weight:700">${t.label}</div>
        <div style="font-size:11px;color:var(--text3)">+${t.points} points</div>
      </div>
      <span class="badge ${t.done ? "badge-green" : "badge-grey"}">${
        t.done ? "Done" : "Pending"
      }</span>
    </div>`
    )
    .join("");
}
