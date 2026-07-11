// fan-token.js
const FAN_TOKENS = [
  { symbol: "PSG", name: "Paris FC Fan Token", price: 2.14 },
  { symbol: "JUV", name: "Juvia FC Fan Token", price: 1.87 },
  { symbol: "BAR", name: "Barca FC Fan Token", price: 3.42 },
  { symbol: "CITY", name: "Man City Fan Token", price: 2.65 },
];

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("ft-list").innerHTML = FAN_TOKENS.map(
    (t) => `
    <div class="card" style="margin-bottom:10px;padding:14px;display:flex;justify-content:space-between;align-items:center;cursor:pointer" onclick="location.href='trade.html'">
      <div>
        <div style="font-weight:700">${t.symbol}</div>
        <div style="font-size:11px;color:var(--text3)">${t.name}</div>
      </div>
      <div style="font-weight:700">$${t.price.toFixed(2)}</div>
    </div>`
  ).join("");
});
