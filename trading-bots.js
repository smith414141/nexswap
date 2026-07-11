// trading-bots.js
const BOTS = [
  { name: "Grid Bot", icon: "🔲", desc: "Buys low and sells high automatically within a set price range." },
  { name: "DCA Bot", icon: "📉", desc: "Buys a fixed amount at regular intervals, smoothing your average entry." },
  { name: "Rebalancing Bot", icon: "⚖️", desc: "Keeps your portfolio at fixed target allocations across coins." },
];

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("tb-list").innerHTML = BOTS.map(
    (b) => `
    <div class="card" style="padding:16px">
      <div style="display:flex;gap:12px;align-items:center;margin-bottom:10px">
        <div style="font-size:24px">${b.icon}</div>
        <div>
          <div style="font-weight:700">${b.name}</div>
          <div style="font-size:12px;color:var(--text2)">${b.desc}</div>
        </div>
      </div>
      <button class="btn-primary" style="width:100%" onclick="showToast('${b.name} created', 'success')">Create ${b.name}</button>
    </div>`
  ).join("");
});
