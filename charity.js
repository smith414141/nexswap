// charity.js
const CAUSES = [
  { name: "Clean Water Fund", icon: "💧", desc: "Bringing clean water to communities in need" },
  { name: "Disaster Relief", icon: "🏠", desc: "Emergency aid for natural disaster survivors" },
  { name: "Education for All", icon: "📚", desc: "School supplies and scholarships for children" },
  { name: "Wildlife Conservation", icon: "🐘", desc: "Protecting endangered species and habitats" },
];

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("ch-list").innerHTML = CAUSES.map(
    (c) => `
    <div class="card" style="margin-bottom:10px;padding:14px;display:flex;justify-content:space-between;align-items:center">
      <div style="display:flex;gap:12px;align-items:center">
        <div style="font-size:24px">${c.icon}</div>
        <div>
          <div style="font-weight:700">${c.name}</div>
          <div style="font-size:11px;color:var(--text3);max-width:180px">${c.desc}</div>
        </div>
      </div>
      <button class="btn-secondary" onclick="donate('${c.name}')">Donate</button>
    </div>`
  ).join("");
});

function donate(cause) {
  const amount = prompt(`Enter USDT amount to donate to ${cause}:`);
  const val = parseFloat(amount);
  if (!val || val <= 0) return;
  showToast(`Thank you! $${val} donated to ${cause}.`, "success");
}
