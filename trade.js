const SYMBOL_MAP = {
  BTC: {
    tv: "BINANCE:BTCUSDT",
    icon: "₿",
    iconClass: "btc",
    about:
      "Bitcoin (BTC) is the first and largest cryptocurrency by market cap, created in 2009 as a decentralized digital currency.",
  },
  ETH: {
    tv: "BINANCE:ETHUSDT",
    icon: "Ξ",
    iconClass: "eth",
    about:
      "Ethereum (ETH) is a decentralized blockchain platform that enables smart contracts and decentralized applications.",
  },
  USDT: {
    tv: "BINANCE:USDTUSD",
    icon: "₮",
    iconClass: "usdt",
    about:
      "Tether (USDT) is a stablecoin pegged to the US Dollar, widely used for trading and transfers.",
  },
  BNB: {
    tv: "BINANCE:BNBUSDT",
    icon: "B",
    iconClass: "bnb",
    about:
      "BNB is the native token of the BNB Chain ecosystem, used for transaction fees and more.",
  },
  SOL: {
    tv: "BINANCE:SOLUSDT",
    icon: "S",
    iconClass: "sol",
    about:
      "Solana (SOL) is a high-performance blockchain known for fast transactions and low fees.",
  },
  XRP: {
    tv: "BINANCE:XRPUSDT",
    icon: "X",
    iconClass: "xrp",
    about:
      "XRP is a digital asset built for fast, low-cost cross-border payments.",
  },
};

const params = new URLSearchParams(window.location.search);
const symbol = (params.get("symbol") || "BTC").toUpperCase();
const coin = SYMBOL_MAP[symbol] || SYMBOL_MAP.BTC;

document.getElementById("trade-title").textContent = `${symbol}/USDT`;
document.getElementById("trade-about").textContent = coin.about;

const iconEl = document.getElementById("trade-coin-icon");
iconEl.textContent = coin.icon;
iconEl.classList.add(coin.iconClass);

const script = document.createElement("script");
script.src = "https://s3.tradingview.com/tv.js";
script.onload = () => {
  new TradingView.widget({
    width: "100%",
    height: 360,
    symbol: coin.tv,
    interval: "60",
    timezone: "Etc/UTC",
    theme: "dark",
    style: "1",
    locale: "en",
    toolbar_bg: "#0B0E11",
    enable_publishing: false,
    hide_legend: false,
    save_image: false,
    container_id: "tv-chart",
  });
};
document.body.appendChild(script);

function fetchPrice() {
  const ids = {
    BTC: "bitcoin",
    ETH: "ethereum",
    USDT: "tether",
    BNB: "binancecoin",
    SOL: "solana",
    XRP: "ripple",
  };
  fetch(
    `https://api.coingecko.com/api/v3/simple/price?ids=${ids[symbol]}&vs_currencies=usd&include_24hr_change=true`
  )
    .then((res) => res.json())
    .then((data) => {
      const d = data[ids[symbol]];
      if (!d) return;
      document.getElementById("trade-price").textContent =
        d.usd >= 1
          ? `$${d.usd.toLocaleString("en-US", { maximumFractionDigits: 2 })}`
          : `$${d.usd.toFixed(4)}`;
      const change = d.usd_24h_change;
      const changeEl = document.getElementById("trade-change");
      changeEl.textContent = (change >= 0 ? "+" : "") + change.toFixed(2) + "%";
      changeEl.className =
        change >= 0 ? "badge badge-green" : "badge badge-red";
    });
}
fetchPrice();
setInterval(fetchPrice, 60000);

function tryTrade(type) {
  showToast(
    `Direct ${type} trading is not available in your region. Use P2P instead.`,
    "warning"
  );
}
