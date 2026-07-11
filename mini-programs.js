// mini-programs.js
const MINI_APPS = [
  { name: "Portfolio Tracker", icon: "📊", href: "portfolio.html" },
  { name: "Market News", icon: "📰", href: "research.html" },
  { name: "Price Alerts", icon: "🔔", href: "price-alerts.html" },
  { name: "Referral Hub", icon: "🎁", href: "referral.html" },
];

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("mp-grid").innerHTML = MINI_APPS.map(
    (m) => `
    <div class="card" style="text-align:center;cursor:pointer" onclick="location.href='${m.href}'">
      <div style="font-size:26px">${m.icon}</div>
      <div style="font-weight:700;font-size:12.5px;margin-top:6px">${m.name}</div>
    </div>`
  ).join("");
});
