// convert.js
// Coin-to-coin swap using live CoinGecko prices.
// Reads/writes wallets Firestore doc.
// Also logs each swap to transactions collection.

let convertWallet = {};
let convertPrices = {};
let fromCoin = "USDT";
let toCoin = "BTC";

const CONVERT_ID_MAP = {
  BTC: "bitcoin",
  ETH: "ethereum",
  USDT: "tether",
  USDC: "usd-coin",
  BNB: "binancecoin",
  SOL: "solana",
  XRP: "ripple",
  ADA: "cardano",
  DOGE: "dogecoin",
  TRX: "tron",
  AVAX: "avalanche-2",
  DOT: "polkadot",
  MATIC: "matic-network",
  LINK: "chainlink",
  LTC: "litecoin",
};

auth.onAuthStateChanged((user) => {
  if (!user || !user.emailVerified) return;

  db.collection("wallets")
    .doc(user.uid)
    .onSnapshot((doc) => {
      if (!doc.exists) return;
      convertWallet = doc.data();
      updateFromBalance();
    });

  fetchConvertPrices();
});

function fetchConvertPrices() {
  const ids = Object.values(CONVERT_ID_MAP).join(",");
  fetch(
    `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd`
  )
    .then((r) => r.json())
    .then((data) => {
      const reverseMap = Object.fromEntries(
        Object.entries(CONVERT_ID_MAP).map(([sym, id]) => [id, sym])
      );
      convertPrices = { USDT: 1, USDC: 1 };
      Object.entries(data).forEach(([id, val]) => {
        const sym = reverseMap[id];
        if (sym) convertPrices[sym] = val.usd;
      });
      updateConvertPreview();
    })
    .catch(() => {
      convertPrices = { USDT: 1, USDC: 1 };
    });
}

function setFromCoin(sym) {
  fromCoin = sym;
  document.getElementById("from-coin-label").textContent = sym;
  updateFromBalance();
  updateConvertPreview();
  populateToCoinOptions();
}

function setToCoin(sym) {
  toCoin = sym;
  document.getElementById("to-coin-label").textContent = sym;
  updateConvertPreview();
}

function updateFromBalance() {
  const bal = convertWallet[fromCoin] || 0;
  const decimals = fromCoin === "BTC" ? 8 : 2;
  document.getElementById(
    "from-balance"
  ).textContent = `Available: ${bal.toFixed(decimals)} ${fromCoin}`;
}

function setMaxConvert() {
  const bal = convertWallet[fromCoin] || 0;
  document.getElementById("convert-amount").value = bal;
  updateConvertPreview();
}

function updateConvertPreview() {
  const amount =
    parseFloat(document.getElementById("convert-amount").value) || 0;
  const fromPrice = convertPrices[fromCoin] || 0;
  const toPrice = convertPrices[toCoin] || 1;

  if (!fromPrice || !toPrice || !amount) {
    document.getElementById("convert-preview").textContent = "-- " + toCoin;
    document.getElementById("convert-rate").textContent = "--";
    return;
  }

  const usdValue = amount * fromPrice;
  const toAmount = usdValue / toPrice;
  const decimals = toCoin === "BTC" ? 8 : toAmount < 1 ? 6 : 4;

  document.getElementById(
    "convert-preview"
  ).textContent = `≈ ${toAmount.toFixed(decimals)} ${toCoin}`;
  document.getElementById("convert-rate").textContent = `1 ${fromCoin} = ${(
    fromPrice / toPrice
  ).toFixed(toCoin === "BTC" ? 8 : 4)} ${toCoin}`;
}

function swapDirection() {
  const temp = fromCoin;
  setFromCoin(toCoin);
  setToCoin(temp);
  document.getElementById("convert-amount").value = "";
  updateConvertPreview();
}

function submitConvert() {
  const user = auth.currentUser;
  const amount = parseFloat(document.getElementById("convert-amount").value);
  const fromBal = convertWallet[fromCoin] || 0;
  const fromPrice = convertPrices[fromCoin] || 0;
  const toPrice = convertPrices[toCoin] || 1;

  if (!amount || amount <= 0) {
    showToast("Enter an amount", "error");
    return;
  }
  if (amount > fromBal) {
    showToast("Insufficient balance", "error");
    return;
  }
  if (!fromPrice || !toPrice) {
    showToast("Price unavailable, try again", "error");
    return;
  }
  if (fromCoin === toCoin) {
    showToast("Select different coins", "error");
    return;
  }

  const usdValue = amount * fromPrice;
  const toAmount = usdValue / toPrice;

  const btn = document.getElementById("convert-btn");
  btn.disabled = true;
  btn.textContent = "Converting...";

  const walletRef = db.collection("wallets").doc(user.uid);

  walletRef
    .update({
      [fromCoin]: firebase.firestore.FieldValue.increment(-amount),
      [toCoin]: firebase.firestore.FieldValue.increment(toAmount),
    })
    .then(() => {
      return db.collection("transactions").add({
        userId: user.uid,
        type: "convert",
        fromCoin,
        toCoin,
        fromAmount: amount,
        toAmount,
        usdValue,
        status: "completed",
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      });
    })
    .then(() => {
      showToast(
        `Converted ${amount} ${fromCoin} → ${toAmount.toFixed(6)} ${toCoin}`,
        "success"
      );
      document.getElementById("convert-amount").value = "";
      updateConvertPreview();
    })
    .catch((err) => showToast(err.message, "error"))
    .finally(() => {
      btn.disabled = false;
      btn.textContent = "Convert";
    });
}

function populateFromCoinOptions() {
  const select = document.getElementById("from-coin-select");
  const coins =
    typeof CRYPTO_LIST !== "undefined"
      ? CRYPTO_LIST.filter((c) => CONVERT_ID_MAP[c.symbol])
      : Object.keys(CONVERT_ID_MAP).map((s) => ({ symbol: s, name: s }));

  select.innerHTML = coins
    .map(
      (c) =>
        `<option value="${c.symbol}" ${
          c.symbol === fromCoin ? "selected" : ""
        }>${c.symbol}</option>`
    )
    .join("");

  select.onchange = () => setFromCoin(select.value);
}

function populateToCoinOptions() {
  const select = document.getElementById("to-coin-select");
  const coins =
    typeof CRYPTO_LIST !== "undefined"
      ? CRYPTO_LIST.filter(
          (c) => CONVERT_ID_MAP[c.symbol] && c.symbol !== fromCoin
        )
      : Object.keys(CONVERT_ID_MAP)
          .filter((s) => s !== fromCoin)
          .map((s) => ({ symbol: s, name: s }));

  select.innerHTML = coins
    .map(
      (c) =>
        `<option value="${c.symbol}" ${c.symbol === toCoin ? "selected" : ""}>${
          c.symbol
        }</option>`
    )
    .join("");

  select.onchange = () => setToCoin(select.value);
}

document.addEventListener("DOMContentLoaded", () => {
  populateFromCoinOptions();
  populateToCoinOptions();
});
