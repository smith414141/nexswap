// ── CRYPTO LIST ──
const CRYPTO_LIST = [
  { symbol: "BTC", name: "Bitcoin", icon: "₿", color: "#F0B90B" },
  { symbol: "ETH", name: "Ethereum", icon: "Ξ", color: "#627EEA" },
  { symbol: "USDT", name: "Tether", icon: "₮", color: "#26A17B" },
  { symbol: "USDC", name: "USD Coin", icon: "$", color: "#2775CA" },
  { symbol: "BNB", name: "BNB", icon: "B", color: "#F0B90B" },
  { symbol: "SOL", name: "Solana", icon: "◎", color: "#9945FF" },
  { symbol: "XRP", name: "Ripple", icon: "✕", color: "#23292F" },
  { symbol: "ADA", name: "Cardano", icon: "₳", color: "#0033AD" },
  { symbol: "DOGE", name: "Dogecoin", icon: "Ð", color: "#C2A633" },
  { symbol: "TRX", name: "Tron", icon: "T", color: "#FF060A" },
  { symbol: "TON", name: "Toncoin", icon: "T", color: "#0088CC" },
  { symbol: "AVAX", name: "Avalanche", icon: "A", color: "#E84142" },
  { symbol: "DOT", name: "Polkadot", icon: "●", color: "#E6007A" },
  { symbol: "MATIC", name: "Polygon", icon: "M", color: "#8247E5" },
  { symbol: "LINK", name: "Chainlink", icon: "⬡", color: "#2A5ADA" },
  { symbol: "LTC", name: "Litecoin", icon: "Ł", color: "#BFBBBB" },
  { symbol: "SHIB", name: "Shiba Inu", icon: "S", color: "#FFA409" },
  { symbol: "BCH", name: "Bitcoin Cash", icon: "B", color: "#8DC351" },
  { symbol: "UNI", name: "Uniswap", icon: "U", color: "#FF007A" },
  { symbol: "XLM", name: "Stellar", icon: "*", color: "#000000" },
  { symbol: "ATOM", name: "Cosmos", icon: "⚛", color: "#2E3148" },
  { symbol: "ETC", name: "Ethereum Classic", icon: "Ξ", color: "#328332" },
  { symbol: "FIL", name: "Filecoin", icon: "F", color: "#0090FF" },
  { symbol: "APT", name: "Aptos", icon: "A", color: "#000000" },
  { symbol: "NEAR", name: "NEAR Protocol", icon: "N", color: "#000000" },
  { symbol: "ICP", name: "Internet Computer", icon: "∞", color: "#3B00B9" },
  { symbol: "HBAR", name: "Hedera", icon: "H", color: "#000000" },
  { symbol: "AAVE", name: "Aave", icon: "A", color: "#B6509E" },
  { symbol: "XTZ", name: "Tezos", icon: "T", color: "#2C7DF7" },
  { symbol: "THETA", name: "Theta Network", icon: "θ", color: "#2AB8E6" },
];

// ── DEPOSIT NETWORKS per coin ──
const DEPOSIT_NETWORKS = {
  BTC: [
    {
      key: "BTC",
      name: "Bitcoin Network",
      time: "~30 min",
      fee: "Network fee",
      confirms: "2 confirmations",
    },
  ],
  ETH: [
    {
      key: "ERC20",
      name: "Ethereum (ERC20)",
      time: "~5 min",
      fee: "~5 USD",
      confirms: "12 confirmations",
    },
  ],
  USDT: [
    {
      key: "TRC20",
      name: "Tron (TRC20)",
      time: "~1 min",
      fee: "~1 USDT",
      confirms: "20 confirmations",
    },
    {
      key: "ERC20",
      name: "Ethereum (ERC20)",
      time: "~5 min",
      fee: "~5 USDT",
      confirms: "12 confirmations",
    },
    {
      key: "BEP20",
      name: "BNB Smart Chain (BEP20)",
      time: "~2 min",
      fee: "~0.5 USDT",
      confirms: "15 confirmations",
    },
    {
      key: "SOL",
      name: "Solana",
      time: "~30 sec",
      fee: "~0.1 USDT",
      confirms: "32 confirmations",
    },
    {
      key: "TON",
      name: "TON",
      time: "~30 sec",
      fee: "~0.1 USDT",
      confirms: "1 confirmation",
    },
  ],
  USDC: [
    {
      key: "ERC20",
      name: "Ethereum (ERC20)",
      time: "~5 min",
      fee: "~5 USDC",
      confirms: "12 confirmations",
    },
    {
      key: "BEP20",
      name: "BNB Smart Chain (BEP20)",
      time: "~2 min",
      fee: "~0.5 USDC",
      confirms: "15 confirmations",
    },
    {
      key: "SOL",
      name: "Solana",
      time: "~30 sec",
      fee: "~0.1 USDC",
      confirms: "32 confirmations",
    },
  ],
  BNB: [
    {
      key: "BEP20",
      name: "BNB Smart Chain (BEP20)",
      time: "~2 min",
      fee: "~0.001 BNB",
      confirms: "15 confirmations",
    },
  ],
  SOL: [
    {
      key: "SOL",
      name: "Solana",
      time: "~30 sec",
      fee: "~0.001 SOL",
      confirms: "32 confirmations",
    },
  ],
  XRP: [
    {
      key: "XRP",
      name: "XRP Ledger",
      time: "~5 sec",
      fee: "~0.0001 XRP",
      confirms: "1 confirmation",
    },
  ],
  ADA: [
    {
      key: "ADA",
      name: "Cardano",
      time: "~5 min",
      fee: "~0.2 ADA",
      confirms: "15 confirmations",
    },
  ],
  DOGE: [
    {
      key: "DOGE",
      name: "Dogecoin",
      time: "~10 min",
      fee: "~1 DOGE",
      confirms: "6 confirmations",
    },
  ],
  TRX: [
    {
      key: "TRC20",
      name: "Tron (TRC20)",
      time: "~1 min",
      fee: "~1 TRX",
      confirms: "20 confirmations",
    },
  ],
  TON: [
    {
      key: "TON",
      name: "TON",
      time: "~30 sec",
      fee: "~0.05 TON",
      confirms: "1 confirmation",
    },
  ],
  AVAX: [
    {
      key: "AVAXC",
      name: "Avalanche C-Chain",
      time: "~2 min",
      fee: "~0.01 AVAX",
      confirms: "12 confirmations",
    },
  ],
  DOT: [
    {
      key: "DOT",
      name: "Polkadot",
      time: "~1 min",
      fee: "~0.1 DOT",
      confirms: "10 confirmations",
    },
  ],
  MATIC: [
    {
      key: "ERC20",
      name: "Ethereum (ERC20)",
      time: "~5 min",
      fee: "~5 MATIC",
      confirms: "12 confirmations",
    },
  ],
  LINK: [
    {
      key: "ERC20",
      name: "Ethereum (ERC20)",
      time: "~5 min",
      fee: "~0.5 LINK",
      confirms: "12 confirmations",
    },
  ],
  LTC: [
    {
      key: "LTC",
      name: "Litecoin",
      time: "~5 min",
      fee: "~0.001 LTC",
      confirms: "6 confirmations",
    },
  ],
  SHIB: [
    {
      key: "ERC20",
      name: "Ethereum (ERC20)",
      time: "~5 min",
      fee: "~100000 SHIB",
      confirms: "12 confirmations",
    },
  ],
  BCH: [
    {
      key: "BCH",
      name: "Bitcoin Cash",
      time: "~10 min",
      fee: "~0.0001 BCH",
      confirms: "6 confirmations",
    },
  ],
  UNI: [
    {
      key: "ERC20",
      name: "Ethereum (ERC20)",
      time: "~5 min",
      fee: "~0.5 UNI",
      confirms: "12 confirmations",
    },
  ],
  XLM: [
    {
      key: "XLM",
      name: "Stellar",
      time: "~5 sec",
      fee: "~0.00001 XLM",
      confirms: "1 confirmation",
    },
  ],
  ATOM: [
    {
      key: "ATOM",
      name: "Cosmos",
      time: "~10 sec",
      fee: "~0.01 ATOM",
      confirms: "1 confirmation",
    },
  ],
  ETC: [
    {
      key: "ETC",
      name: "Ethereum Classic",
      time: "~3 min",
      fee: "~0.001 ETC",
      confirms: "15 confirmations",
    },
  ],
  FIL: [
    {
      key: "FIL",
      name: "Filecoin",
      time: "~5 min",
      fee: "~0.01 FIL",
      confirms: "20 confirmations",
    },
  ],
  APT: [
    {
      key: "APT",
      name: "Aptos",
      time: "~10 sec",
      fee: "~0.01 APT",
      confirms: "1 confirmation",
    },
  ],
  NEAR: [
    {
      key: "NEAR",
      name: "NEAR",
      time: "~5 sec",
      fee: "~0.01 NEAR",
      confirms: "1 confirmation",
    },
  ],
  ICP: [
    {
      key: "ICP",
      name: "Internet Computer",
      time: "~1 min",
      fee: "~0.001 ICP",
      confirms: "1 confirmation",
    },
  ],
  HBAR: [
    {
      key: "HBAR",
      name: "Hedera",
      time: "~5 sec",
      fee: "~0.01 HBAR",
      confirms: "1 confirmation",
    },
  ],
  AAVE: [
    {
      key: "ERC20",
      name: "Ethereum (ERC20)",
      time: "~5 min",
      fee: "~0.05 AAVE",
      confirms: "12 confirmations",
    },
  ],
  XTZ: [
    {
      key: "XTZ",
      name: "Tezos",
      time: "~1 min",
      fee: "~0.1 XTZ",
      confirms: "1 confirmation",
    },
  ],
  THETA: [
    {
      key: "THETA",
      name: "Theta",
      time: "~10 sec",
      fee: "~0.1 THETA",
      confirms: "1 confirmation",
    },
  ],
};

// ── YOUR DEPOSIT ADDRESSES ──
// IMPORTANT: Some coins use a memo/tag (XRP, XLM, ATOM, HBAR) — these are noted
// in comments next to the address. Your deposit page UI does not currently
// display memo/tag fields — flag this to your developer if you need it added,
// since users depositing XRP/XLM/ATOM/HBAR without the memo may have delayed
// or lost funds depending on the receiving exchange's policy.
const DEPOSIT_ADDRESSES = {
  BTC: {
    BTC: "16a8iDqW6zykcCCXxgCiSRLiSVe2zPrxqB",
  },
  ETH: {
    ERC20: "0x36f8a456acb7cc6035267eb40ecbd8cb4c7c2f08",
  },
  USDT: {
    TRC20: "TAxCnzbfwAS2viFkLWaSs59eCgBdfAwWrS",
    ERC20: "0x36f8a456acb7cc6035267eb40ecbd8cb4c7c2f08",
    BEP20: "0x36f8a456acb7cc6035267eb40ecbd8cb4c7c2f08",
    SOL: "21YK8faUSgHsmpZG77oKbHf2XaGo6dS8ahqVGS1Xrxwr",
    TON: "UQALK4Az2PG_HLoA-rFyvq8JJo0H1PA9XjF2XAK69NYH2PWy",
  },
  USDC: {
    ERC20: "0x36f8a456acb7cc6035267eb40ecbd8cb4c7c2f08",
    BEP20: "0x36f8a456acb7cc6035267eb40ecbd8cb4c7c2f08",
    SOL: "21YK8faUSgHsmpZG77oKbHf2XaGo6dS8ahqVGS1Xrxwr",
  },
  BNB: {
    BEP20: "0x36f8a456acb7cc6035267eb40ecbd8cb4c7c2f08",
  },
  SOL: {
    SOL: "21YK8faUSgHsmpZG77oKbHf2XaGo6dS8ahqVGS1Xrxwr",
  },
  XRP: {
    XRP: "21YK8faUSgHsmpZG77oKbHf2XaGo6dS8ahqVGS1Xrxwr", // memo/tag: 494478573
  },
  ADA: {
    ADA: "addr1vy7872dgyv2jffs9ecgpjmfs8safapx6yr0t5pu4am39snggxff64",
  },
  DOGE: {
    DOGE: "DS6CMVitRhFpLvZDQqUJYotyww9X6M3qS8",
  },
  TRX: {
    TRC20: "TAxCnzbfwAS2viFkLWaSs59eCgBdfAwWrS",
  },
  TON: {
    TON: "UQALK4Az2PG_HLoA-rFyvq8JJo0H1PA9XjF2XAK69NYH2PWy",
  },
  AVAX: {
    AVAXC: "0x36f8a456acb7cc6035267eb40ecbd8cb4c7c2f08",
  },
  DOT: {
    DOT: "14xFQcYCgEC5GKzAd1ZiLoJK91snija1v1JrhhjM3G6NZYEo",
  },
  MATIC: {
    ERC20: "0x36f8a456acb7cc6035267eb40ecbd8cb4c7c2f08",
  },
  LINK: {
    ERC20: "0x36f8a456acb7cc6035267eb40ecbd8cb4c7c2f08",
  },
  LTC: {
    LTC: "LVvG2pPPW85bugaubPjwBEu8RqEnsmQKwu",
  },
  SHIB: {
    ERC20: "0x36f8a456acb7cc6035267eb40ecbd8cb4c7c2f08",
  },
  BCH: {
    BCH: "16a8iDqW6zykcCCXxgCiSRLiSVe2zPrxqB",
  },
  UNI: {
    ERC20: "0x36f8a456acb7cc6035267eb40ecbd8cb4c7c2f08",
  },
  XLM: {
    XLM: "GABFQIK63R2NETJM7T673EAMZN4RJLLGP3OFUEJU5SZVTGWUKULZJNL6", // memo/tag: 396141952
  },
  ATOM: {
    ATOM: "cosmos1j8pp7zvcu9z8vd882m284j29fn2dszh05cqvf9", // memo/tag: 103850192
  },
  ETC: {
    ETC: "0x36f8a456acb7cc6035267eb40ecbd8cb4c7c2f08",
  },
  FIL: {
    FIL: "f1qjtmyfahew4ctciehtqmh7rxgdpmlzanhsj6vfa",
  },
  APT: {
    APT: "0xde08ba55ad27fe12007db5fe532d7956bdc583453f006eabe9149d8bdba1b62a",
  },
  NEAR: {
    NEAR: "90b9fb7a9780e9cb84d87b9f066dd3ed1bd50f5d8a0b85c315dacb32e40e7975",
  },
  ICP: {
    ICP: "4a23c09a9098f63ccc7920bbea89d9d64014928187d053bd14f8ff2994658bee",
  },
  HBAR: {
    HBAR: "0.0.1873771", // memo/tag: 106280749
  },
  AAVE: {
    ERC20: "0x36f8a456acb7cc6035267eb40ecbd8cb4c7c2f08",
  },
  XTZ: {
    XTZ: "tz2GPz44MCRJqHWsR4K62aPBqhdhJZnuiszw",
  },
  THETA: {
    THETA: "0x36f8a456acb7cc6035267eb40ecbd8cb4c7c2f08",
  },
};
// ── ADD THIS BLOCK at the bottom of your existing wallet.js ──
// Multi-wallet sub-balance display helper
// Your wallets Firestore doc already stores all coin balances as flat fields.
// This function reads them and groups by sub-wallet for display.
// Sub-wallets are logical groupings only — there is no actual separation in Firestore.

const SUB_WALLET_MAP = {
  Spot: [
    "BTC",
    "ETH",
    "USDT",
    "USDC",
    "BNB",
    "SOL",
    "XRP",
    "ADA",
    "DOGE",
    "TRX",
    "TON",
    "AVAX",
    "DOT",
    "MATIC",
    "LINK",
    "LTC",
    "SHIB",
    "BCH",
    "UNI",
    "XLM",
    "ATOM",
    "ETC",
    "FIL",
    "APT",
    "NEAR",
    "ICP",
    "HBAR",
    "AAVE",
    "XTZ",
    "THETA",
  ],
};

function renderSubWallets(walletData, prices) {
  // prices = { BTC: 67500, ETH: 3500, USDT: 1, ... }
  const container = document.getElementById("sub-wallets");
  if (!container) return;

  const spotCoins = SUB_WALLET_MAP.Spot.map((sym) => {
    const amount = walletData[sym] || 0;
    const price = prices[sym] || 0;
    const usd = amount * price;
    return { sym, amount, usd };
  }).filter((c) => c.amount > 0);

  const spotTotal = spotCoins.reduce((sum, c) => sum + c.usd, 0);

  if (!spotCoins.length) {
    container.innerHTML =
      '<div class="empty-state">No balances yet. Deposit to get started.</div>';
    return;
  }

  container.innerHTML = `
      <div class="card" style="margin-bottom:10px;">
        <div style="display:flex;justify-content:space-between;margin-bottom:12px;">
          <span style="font-weight:700;">Spot Wallet</span>
          <span style="font-weight:800;color:var(--yellow);">$${spotTotal.toFixed(
            2
          )}</span>
        </div>
        ${spotCoins
          .map((c) => {
            const coin = (typeof CRYPTO_LIST !== "undefined"
              ? CRYPTO_LIST.find((x) => x.symbol === c.sym)
              : null) || { icon: c.sym[0], color: "#F0B90B" };
            const decimals = c.sym === "BTC" ? 8 : c.usd < 1 ? 6 : 4;
            return `
            <div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid var(--border);">
              <div style="width:32px;height:32px;border-radius:50%;background:${
                coin.color
              }22;color:${
              coin.color
            };display:flex;align-items:center;justify-content:center;font-weight:800;font-size:12px;flex-shrink:0;">${
              coin.icon
            }</div>
              <div style="flex:1;"><div style="font-size:13px;font-weight:600;">${
                c.sym
              }</div></div>
              <div style="text-align:right;">
                <div style="font-size:13px;font-weight:700;">${c.amount.toFixed(
                  decimals
                )}</div>
                <div style="font-size:11px;color:var(--text3);">$${c.usd.toFixed(
                  2
                )}</div>
              </div>
            </div>
          `;
          })
          .join("")}
      </div>
    `;
}
