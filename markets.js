// markets.js
// Live coin list pulled from CoinGecko free API (no key required).
// Supports: search, sort by gainers/losers/volume, favorites (stored per-user in Firestore).

const COIN_IDS = [
  "bitcoin",
  "ethereum",
  "tether",
  "binancecoin",
  "solana",
  "ripple",
  "usd-coin",
  "cardano",
  "dogecoin",
  "tron",
  "avalanche-2",
  "polkadot",
  "chainlink",
  "polygon",
  "litecoin",
];

let allCoins = [];
let currentSort = "market_cap";
let currentFavorites = [];

document.addEventListener("DOMContentLoaded", () => {
  loadMarkets();
  setInterval(loadMarkets, 60000); // refresh every 60s, stays within CoinGecko free tier

  auth.onAuthStateChanged((user) => {
    if (!user) return;
    db.collection("favorites")
      .doc(user.uid)
      .get()
      .then((doc) => {
        currentFavorites = doc.exists ? doc.data().coins || [] : [];
        renderMarkets();
      });
  });

  document
    .getElementById("market-search")
    .addEventListener("input", renderMarkets);
});

function loadMarkets() {
  const ids = COIN_IDS.join(",");
  fetch(
    `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${ids}&order=market_cap_desc&sparkline=false&price_change_percentage=24h`
  )
    .then((res) => res.json())
    .then((data) => {
      allCoins = data;
      renderMarkets();
    })
    .catch(() => {
      document.getElementById("market-list").innerHTML =
        '<div class="empty-state">Unable to load market data. Check your connection.</div>';
    });
}

function setSort(sortKey, btn) {
  currentSort = sortKey;
  document
    .querySelectorAll(".sort-pill")
    .forEach((b) => b.classList.remove("active"));
  btn.classList.add("active");
  renderMarkets();
}

function sortCoins(coins) {
  const sorted = [...coins];
  if (currentSort === "gainers") {
    sorted.sort(
      (a, b) =>
        (b.price_change_percentage_24h || 0) -
        (a.price_change_percentage_24h || 0)
    );
  } else if (currentSort === "losers") {
    sorted.sort(
      (a, b) =>
        (a.price_change_percentage_24h || 0) -
        (b.price_change_percentage_24h || 0)
    );
  } else if (currentSort === "volume") {
    sorted.sort((a, b) => (b.total_volume || 0) - (a.total_volume || 0));
  } else {
    sorted.sort((a, b) => (b.market_cap || 0) - (a.market_cap || 0));
  }
  return sorted;
}

function renderMarkets() {
  const query = (
    document.getElementById("market-search").value || ""
  ).toLowerCase();
  let coins = allCoins.filter(
    (c) =>
      c.name.toLowerCase().includes(query) ||
      c.symbol.toLowerCase().includes(query)
  );
  coins = sortCoins(coins);

  const list = document.getElementById("market-list");

  if (!coins.length) {
    list.innerHTML =
      '<div class="empty-state">No coins match your search</div>';
    return;
  }

  list.innerHTML = coins
    .map((c) => {
      const change = c.price_change_percentage_24h || 0;
      const changeClass = change >= 0 ? "positive" : "negative";
      const changeSign = change >= 0 ? "+" : "";
      const isFav = currentFavorites.includes(c.id);

      return `
          <div class="market-row" onclick="goToCoin('${c.id}')">
            <button class="fav-star ${
              isFav ? "active" : ""
            }" onclick="event.stopPropagation(); toggleFavorite('${c.id}')">
              ${isFav ? "★" : "☆"}
            </button>
            <img src="${c.image}" class="coin-icon" alt="${c.symbol}" />
            <div class="coin-info">
              <div class="coin-name">${c.name}</div>
              <div class="coin-symbol">${c.symbol.toUpperCase()}</div>
            </div>
            <div class="coin-price-block">
              <div class="coin-price">$${formatPrice(c.current_price)}</div>
              <div class="coin-change ${changeClass}">${changeSign}${change.toFixed(
        2
      )}%</div>
            </div>
          </div>
        `;
    })
    .join("");
}

function formatPrice(price) {
  if (price >= 1)
    return price.toLocaleString(undefined, { maximumFractionDigits: 2 });
  return price.toFixed(6);
}

function toggleFavorite(coinId) {
  const user = auth.currentUser;
  if (!user) {
    showToast("Please log in to save favorites", "warning");
    return;
  }

  const index = currentFavorites.indexOf(coinId);
  if (index === -1) {
    currentFavorites.push(coinId);
  } else {
    currentFavorites.splice(index, 1);
  }

  db.collection("favorites")
    .doc(user.uid)
    .set({ coins: currentFavorites }, { merge: true })
    .then(() => renderMarkets())
    .catch((err) => showToast(err.message, "error"));
}

function goToCoin(coinId) {
  window.location.href = `coin.html?id=${coinId}`;
}
