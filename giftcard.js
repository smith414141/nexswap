// giftcard.js
const GIFT_CARDS = [
  { name: "Amazon", icon: "🛒", values: [25, 50, 100] },
  { name: "Steam", icon: "🎮", values: [20, 50, 100] },
  { name: "iTunes", icon: "🎵", values: [15, 25, 50] },
  { name: "Google Play", icon: "▶️", values: [10, 25, 50] },
];

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("gc-grid").innerHTML = GIFT_CARDS.map(
    (c) => `
    <div class="card" style="text-align:center;cursor:pointer" onclick="buyGiftCard('${c.name}')">
      <div style="font-size:28px">${c.icon}</div>
      <div style="font-weight:700;margin-top:6px">${c.name}</div>
      <div style="font-size:11px;color:var(--text3)">From $${c.values[0]}</div>
    </div>`
  ).join("");
});

function buyGiftCard(name) {
  showToast(`${name} gift cards redeemable soon — pay with your Kripex balance at checkout.`, "info");
}
