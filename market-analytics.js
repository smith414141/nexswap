// market-analytics.js
document.addEventListener("DOMContentLoaded", () => {
  loadFearGreed();
  loadTrending();
});

function loadFearGreed() {
  fetch("https://api.alternative.me/fng/?limit=1")
    .then((res) => res.json())
    .then((data) => {
      const v = data.data[0];
      document.getElementById("ma-fng").textContent = v.value;
      document.getElementById("ma-fng-label").textContent =
        v.value_classification;
    })
    .catch(() => {
      document.getElementById("ma-fng-label").textContent =
        "Unable to load index";
    });
}

function loadTrending() {
  fetch("https://api.coingecko.com/api/v3/search/trending")
    .then((res) => res.json())
    .then((data) => {
      const coins = (data.coins || []).slice(0, 7);
      document.getElementById("ma-trending").innerHTML = coins
        .map(
          (c) => `
        <div class="card" style="margin-bottom:8px;padding:12px;display:flex;justify-content:space-between;align-items:center;cursor:pointer" onclick="location.href='markets.html'">
          <div style="display:flex;align-items:center;gap:10px">
            <img src="${c.item.thumb}" style="width:24px;height:24px;border-radius:50%" />
            <div>
              <div style="font-weight:700">${c.item.symbol.toUpperCase()}</div>
              <div style="font-size:11px;color:var(--text3)">${c.item.name}</div>
            </div>
          </div>
          <span style="font-size:11px;color:var(--text3)">Rank #${
            c.item.market_cap_rank || "--"
          }</span>
        </div>`
        )
        .join("");
    })
    .catch(() => {
      document.getElementById("ma-trending").innerHTML =
        '<div class="empty-state">Unable to load trending coins.</div>';
    });
}
