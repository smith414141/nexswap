// coin.js
// Reads ?id= from URL (e.g. coin.html?id=bitcoin), loads live data + chart.

let coinId = null;

document.addEventListener("DOMContentLoaded", () => {
  const params = new URLSearchParams(window.location.search);
  coinId = params.get("id") || "bitcoin";
  loadCoinData();
  loadChart();
  checkFavorite();
});

function loadCoinData() {
  fetch(
    `https://api.coingecko.com/api/v3/coins/${coinId}?localization=false&tickers=false&community_data=false&developer_data=false`
  )
    .then((res) => res.json())
    .then((data) => {
      document.getElementById("coin-icon").src = data.image.large;
      document.getElementById("coin-name").textContent = data.name;
      document.getElementById("coin-symbol").textContent =
        data.symbol.toUpperCase();

      const price = data.market_data.current_price.usd;
      const change = data.market_data.price_change_percentage_24h || 0;
      const changeClass = change >= 0 ? "positive" : "negative";
      const changeSign = change >= 0 ? "+" : "";

      document.getElementById(
        "coin-price"
      ).textContent = `$${price.toLocaleString(undefined, {
        maximumFractionDigits: price < 1 ? 6 : 2,
      })}`;
      const changeEl = document.getElementById("coin-change");
      changeEl.textContent = `${changeSign}${change.toFixed(2)}% (24h)`;
      changeEl.className = `coin-detail-change ${changeClass}`;

      document.getElementById("stat-market-cap").textContent = `$${formatBig(
        data.market_data.market_cap.usd
      )}`;
      document.getElementById("stat-volume").textContent = `$${formatBig(
        data.market_data.total_volume.usd
      )}`;
      document.getElementById(
        "stat-high"
      ).textContent = `$${data.market_data.high_24h.usd.toLocaleString()}`;
      document.getElementById(
        "stat-low"
      ).textContent = `$${data.market_data.low_24h.usd.toLocaleString()}`;
      document.getElementById("stat-supply").textContent = data.market_data
        .circulating_supply
        ? formatBig(data.market_data.circulating_supply)
        : "N/A";

      document.getElementById(
        "buy-btn"
      ).href = `trade.html?pair=${data.symbol.toUpperCase()}USDT`;
    })
    .catch(() => {
      document.getElementById("coin-name").textContent = "Unable to load coin";
    });
}

function loadChart() {
  fetch(
    `https://api.coingecko.com/api/v3/coins/${coinId}/market_chart?vs_currency=usd&days=7`
  )
    .then((res) => res.json())
    .then((data) => {
      const prices = data.prices.map((p) => p[1]);
      drawSparkline(prices);
    })
    .catch(() => {});
}

// Lightweight inline SVG sparkline — no chart library needed for this view.
// (Full TradingView candlestick chart is used on trade.html, not here.)
function drawSparkline(prices) {
  const svg = document.getElementById("coin-sparkline");
  const w = 340;
  const h = 120;
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const range = max - min || 1;

  const points = prices
    .map((p, i) => {
      const x = (i / (prices.length - 1)) * w;
      const y = h - ((p - min) / range) * h;
      return `${x},${y}`;
    })
    .join(" ");

  const isUp = prices[prices.length - 1] >= prices[0];
  const color = isUp ? "#0ecb81" : "#f6465d";

  svg.innerHTML = `<polyline points="${points}" fill="none" stroke="${color}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round" />`;
}

function formatBig(num) {
  if (num >= 1e9) return (num / 1e9).toFixed(2) + "B";
  if (num >= 1e6) return (num / 1e6).toFixed(2) + "M";
  if (num >= 1e3) return (num / 1e3).toFixed(2) + "K";
  return num.toLocaleString();
}

function checkFavorite() {
  auth.onAuthStateChanged((user) => {
    if (!user) return;
    db.collection("favorites")
      .doc(user.uid)
      .get()
      .then((doc) => {
        const favs = doc.exists ? doc.data().coins || [] : [];
        const btn = document.getElementById("fav-toggle");
        if (favs.includes(coinId)) {
          btn.textContent = "★ Saved";
          btn.classList.add("active");
        }
      });
  });
}

function toggleCoinFavorite() {
  const user = auth.currentUser;
  if (!user) {
    showToast("Please log in to save favorites", "warning");
    return;
  }

  const ref = db.collection("favorites").doc(user.uid);
  ref.get().then((doc) => {
    let favs = doc.exists ? doc.data().coins || [] : [];
    const btn = document.getElementById("fav-toggle");

    if (favs.includes(coinId)) {
      favs = favs.filter((id) => id !== coinId);
      btn.textContent = "☆ Save";
      btn.classList.remove("active");
    } else {
      favs.push(coinId);
      btn.textContent = "★ Saved";
      btn.classList.add("active");
    }

    ref.set({ coins: favs }, { merge: true });
  });
}
