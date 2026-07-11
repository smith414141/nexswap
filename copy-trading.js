// copy-trading.js
const TRADERS = [
  { name: "AlphaWolf", roi: "+142.3%", followers: 3204 },
  { name: "SatoshiJr", roi: "+88.6%", followers: 1890 },
  { name: "MoonMerchant", roi: "+64.1%", followers: 990 },
  { name: "QuietQuant", roi: "+51.7%", followers: 512 },
];

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("ct-list").innerHTML = TRADERS.map(
    (t, i) => `
    <div class="card" style="margin-bottom:10px;padding:14px;display:flex;justify-content:space-between;align-items:center">
      <div>
        <div style="font-weight:700">${t.name}</div>
        <div style="font-size:11px;color:var(--text3)">${t.followers} followers</div>
      </div>
      <div style="text-align:right">
        <div style="font-weight:700;color:var(--green)">${t.roi}</div>
        <button class="btn-secondary" id="ct-btn-${i}" style="margin-top:6px" onclick="toggleCopy(${i})">Copy</button>
      </div>
    </div>`
  ).join("");
});

function toggleCopy(i) {
  const btn = document.getElementById("ct-btn-" + i);
  const copying = btn.textContent === "Cancel";
  if (copying) {
    btn.textContent = "Copy";
    btn.style.color = "";
    showToast(`Stopped copying ${TRADERS[i].name}`, "info");
  } else {
    btn.textContent = "Cancel";
    btn.style.color = "var(--red)";
    showToast(`Now copying ${TRADERS[i].name}`, "success");
  }
}
