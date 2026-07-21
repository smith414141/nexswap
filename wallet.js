// ── CRYPTO LIST ──
var CRYPTO_LIST = [
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
  { symbol: "MATIC", name: "Polygon", icon: "M", color: "#8247E5" },
  { symbol: "OP", name: "Optimism", icon: "O", color: "#FF0420" },
  { symbol: "ARB", name: "Arbitrum", icon: "A", color: "#28A0F0" },
  { symbol: "BASE", name: "Base", icon: "B", color: "#0052FF" },
  { symbol: "ZKSERA", name: "ZKSync Era", icon: "Z", color: "#00C8FF" },
  { symbol: "MANTLE", name: "Mantle", icon: "M", color: "#00A3E0" },
  { symbol: "KASPA", name: "Kaspa", icon: "K", color: "#1A1A1A" },
  { symbol: "ALGO", name: "Algorand", icon: "A", color: "#000000" },
  { symbol: "KLAY", name: "Klaytn", icon: "K", color: "#000000" },
  { symbol: "FLOW", name: "Flow", icon: "F", color: "#000000" },
  { symbol: "SUI", name: "Sui", icon: "S", color: "#000000" },
  { symbol: "SEI", name: "Sei", icon: "S", color: "#000000" },
  { symbol: "INJ", name: "Injective", icon: "I", color: "#000000" },
  { symbol: "TIA", name: "Celestia", icon: "T", color: "#000000" },
  { symbol: "PYTH", name: "Pyth", icon: "P", color: "#000000" },
  { symbol: "RENDER", name: "Render", icon: "R", color: "#000000" },
  { symbol: "FET", name: "Fetch.ai", icon: "F", color: "#000000" },
  { symbol: "ONYX", name: "Onyx", icon: "O", color: "#000000" },
  { symbol: "JTO", name: "Jito", icon: "J", color: "#000000" },
  { symbol: "WIF", name: "dogwifhat", icon: "W", color: "#000000" },
  { symbol: "PEPE", name: "Pepe", icon: "P", color: "#000000" },
  { symbol: "BONK", name: "Bonk", icon: "B", color: "#000000" },
  { symbol: "WLD", name: "Worldcoin", icon: "W", color: "#000000" },
  { symbol: "ARB", name: "Arbitrum", icon: "A", color: "#000000" },
  { symbol: "SEI", name: "Sei", icon: "S", color: "#000000" },
  { symbol: "JUP", name: "Jupiter", icon: "J", color: "#000000" },
  { symbol: "TIA", name: "Celestia", icon: "T", color: "#000000" },
  { symbol: "STRK", name: "Starknet", icon: "S", color: "#000000" },
  { symbol: "MEW", name: "MEW", icon: "M", color: "#000000" },
  { symbol: "POPCAT", name: "Popcat", icon: "P", color: "#000000" },
  { symbol: "MOODENG", name: "Moodeng", icon: "M", color: "#000000" },
  { symbol: "NEIRO", name: "Neiro", icon: "N", color: "#000000" },
  { symbol: "PENGU", name: "Pengu", icon: "P", color: "#000000" },
  { symbol: "ACT", name: "Act", icon: "A", color: "#000000" },
  { symbol: "GRASS", name: "Grass", icon: "G", color: "#000000" },
  { symbol: "GOAT", name: "Goat", icon: "G", color: "#000000" },
  { symbol: "PNUT", name: "Pnut", icon: "P", color: "#000000" },
  { symbol: "FARTCOIN", name: "Fartcoin", icon: "F", color: "#000000" },
  { symbol: "SPX", name: "SPX", icon: "S", color: "#000000" },
  { symbol: "MOTHER", name: "Mother", icon: "M", color: "#000000" },
  { symbol: "RETARDIO", name: "Retardio", icon: "R", color: "#000000" },
  { symbol: "1MBABYDOGE", name: "1MBABYDOGE", icon: "1", color: "#000000" },
  { symbol: "MICHI", name: "Michi", icon: "M", color: "#000000" },
  { symbol: "HIPPO", name: "Hippo", icon: "H", color: "#000000" },
  { symbol: "BULLY", name: "Bully", icon: "B", color: "#000000" },
  { symbol: "SKAI", name: "Skai", icon: "S", color: "#000000" },
];

// ── DEPOSIT NETWORKS per coin ──
var DEPOSIT_NETWORKS = {
  BTC: [
    {
      key: "BTC",
      name: "BTC Network (Native)",
      time: "~30 min",
      fee: "~0.0002 BTC",
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
      key: "ERC20",
      name: "Ethereum (ERC20)",
      time: "~5 min",
      fee: "~5 USDT",
      confirms: "12 confirmations",
    },
    {
      key: "TRC20",
      name: "Tron (TRC20)",
      time: "~1 min",
      fee: "~1 USDT",
      confirms: "20 confirmations",
    },
    {
      key: "BEP20",
      name: "BNB Smart Chain (BEP20)",
      time: "~2 min",
      fee: "~0.5 USDT",
      confirms: "15 confirmations",
    },
    {
      key: "POLYGON",
      name: "Polygon",
      time: "~2 min",
      fee: "~0.1 USDT",
      confirms: "50 confirmations",
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
      key: "TRC20",
      name: "Tron (TRC20)",
      time: "~1 min",
      fee: "~1 USDC",
      confirms: "20 confirmations",
    },
    {
      key: "BEP20",
      name: "BNB Smart Chain (BEP20)",
      time: "~2 min",
      fee: "~0.5 USDC",
      confirms: "15 confirmations",
    },
    {
      key: "POLYGON",
      name: "Polygon",
      time: "~2 min",
      fee: "~0.1 USDC",
      confirms: "50 confirmations",
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
    {
      key: "BEP2",
      name: "BNB Beacon Chain (BEP2)",
      time: "~5 min",
      fee: "~0.0005 BNB",
      confirms: "1 confirmation",
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
      memo: "494478573",
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
    {
      key: "BEP20",
      name: "BNB Smart Chain (BEP20)",
      time: "~2 min",
      fee: "~0.5 DOGE",
      confirms: "15 confirmations",
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
  LINK: [
    {
      key: "ERC20",
      name: "Ethereum (ERC20)",
      time: "~5 min",
      fee: "~0.5 LINK",
      confirms: "12 confirmations",
    },
    {
      key: "BEP20",
      name: "BNB Smart Chain (BEP20)",
      time: "~2 min",
      fee: "~0.1 LINK",
      confirms: "15 confirmations",
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
    {
      key: "BEP20",
      name: "BNB Smart Chain (BEP20)",
      time: "~2 min",
      fee: "~10000 SHIB",
      confirms: "15 confirmations",
    },
  ],
  XLM: [
    {
      key: "XLM",
      name: "Stellar",
      time: "~5 sec",
      fee: "~0.00001 XLM",
      confirms: "1 confirmation",
      memo: "396141952",
    },
  ],
  ATOM: [
    {
      key: "ATOM",
      name: "Cosmos",
      time: "~10 sec",
      fee: "~0.01 ATOM",
      confirms: "1 confirmation",
      memo: "103850192",
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
      memo: "106280749",
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
  MATIC: [
    {
      key: "POLYGON",
      name: "Polygon",
      time: "~2 min",
      fee: "~0.01 MATIC",
      confirms: "50 confirmations",
    },
    {
      key: "ERC20",
      name: "Ethereum (ERC20)",
      time: "~5 min",
      fee: "~5 MATIC",
      confirms: "12 confirmations",
    },
  ],
  OP: [
    {
      key: "OP",
      name: "Optimism",
      time: "~2 min",
      fee: "~0.001 OP",
      confirms: "1 confirmation",
    },
  ],
  ARB: [
    {
      key: "ARB",
      name: "Arbitrum",
      time: "~2 min",
      fee: "~0.001 ARB",
      confirms: "1 confirmation",
    },
  ],
  BASE: [
    {
      key: "BASE",
      name: "Base",
      time: "~2 min",
      fee: "~0.001 BASE",
      confirms: "1 confirmation",
    },
  ],
  ZKSERA: [
    {
      key: "ZKSERA",
      name: "ZKSync Era",
      time: "~2 min",
      fee: "~0.001 ZKSERA",
      confirms: "1 confirmation",
    },
  ],
  MANTLE: [
    {
      key: "MANTLE",
      name: "Mantle",
      time: "~2 min",
      fee: "~0.001 MNT",
      confirms: "1 confirmation",
    },
  ],
  KASPA: [
    {
      key: "KASPA",
      name: "Kaspa",
      time: "~10 sec",
      fee: "~0.0001 KAS",
      confirms: "1 confirmation",
    },
  ],
  ALGO: [
    {
      key: "ALGO",
      name: "Algorand",
      time: "~5 sec",
      fee: "~0.001 ALGO",
      confirms: "1 confirmation",
    },
  ],
  KLAY: [
    {
      key: "KLAY",
      name: "Klaytn",
      time: "~1 min",
      fee: "~0.01 KLAY",
      confirms: "1 confirmation",
    },
  ],
  FLOW: [
    {
      key: "FLOW",
      name: "Flow",
      time: "~10 sec",
      fee: "~0.001 FLOW",
      confirms: "1 confirmation",
    },
  ],
  SUI: [
    {
      key: "SUI",
      name: "Sui",
      time: "~2 sec",
      fee: "~0.001 SUI",
      confirms: "1 confirmation",
    },
  ],
  SEI: [
    {
      key: "SEI",
      name: "Sei",
      time: "~2 sec",
      fee: "~0.001 SEI",
      confirms: "1 confirmation",
    },
  ],
  INJ: [
    {
      key: "INJ",
      name: "Injective",
      time: "~2 sec",
      fee: "~0.001 INJ",
      confirms: "1 confirmation",
    },
  ],
  TIA: [
    {
      key: "TIA",
      name: "Celestia",
      time: "~6 sec",
      fee: "~0.01 TIA",
      confirms: "1 confirmation",
    },
  ],
  PYTH: [
    {
      key: "PYTH",
      name: "Pyth",
      time: "~2 sec",
      fee: "~0.001 PYTH",
      confirms: "1 confirmation",
    },
  ],
  RENDER: [
    {
      key: "ERC20",
      name: "Ethereum (ERC20)",
      time: "~5 min",
      fee: "~0.5 RENDER",
      confirms: "12 confirmations",
    },
    {
      key: "SOL",
      name: "Solana",
      time: "~30 sec",
      fee: "~0.1 RENDER",
      confirms: "32 confirmations",
    },
  ],
  FET: [
    {
      key: "ERC20",
      name: "Ethereum (ERC20)",
      time: "~5 min",
      fee: "~0.5 FET",
      confirms: "12 confirmations",
    },
    {
      key: "FET",
      name: "Fetch.ai",
      time: "~2 sec",
      fee: "~0.001 FET",
      confirms: "1 confirmation",
    },
  ],
  ONYX: [
    {
      key: "ONYX",
      name: "Onyx",
      time: "~2 min",
      fee: "~0.001 ONYX",
      confirms: "1 confirmation",
    },
  ],
  JTO: [
    {
      key: "SOL",
      name: "Solana",
      time: "~30 sec",
      fee: "~0.001 JTO",
      confirms: "32 confirmations",
    },
  ],
  WIF: [
    {
      key: "SOL",
      name: "Solana",
      time: "~30 sec",
      fee: "~0.001 WIF",
      confirms: "32 confirmations",
    },
  ],
  PEPE: [
    {
      key: "ERC20",
      name: "Ethereum (ERC20)",
      time: "~5 min",
      fee: "~100000 PEPE",
      confirms: "12 confirmations",
    },
    {
      key: "BEP20",
      name: "BNB Smart Chain (BEP20)",
      time: "~2 min",
      fee: "~10000 PEPE",
      confirms: "15 confirmations",
    },
  ],
  BONK: [
    {
      key: "SOL",
      name: "Solana",
      time: "~30 sec",
      fee: "~0.001 BONK",
      confirms: "32 confirmations",
    },
  ],
  WLD: [
    {
      key: "ERC20",
      name: "Ethereum (ERC20)",
      time: "~5 min",
      fee: "~0.5 WLD",
      confirms: "12 confirmations",
    },
    {
      key: "OP",
      name: "Optimism",
      time: "~2 min",
      fee: "~0.001 WLD",
      confirms: "1 confirmation",
    },
  ],
  SEI: [
    {
      key: "SEI",
      name: "Sei",
      time: "~2 sec",
      fee: "~0.001 SEI",
      confirms: "1 confirmation",
    },
  ],
  JUP: [
    {
      key: "SOL",
      name: "Solana",
      time: "~30 sec",
      fee: "~0.001 JUP",
      confirms: "32 confirmations",
    },
  ],
  TIA: [
    {
      key: "TIA",
      name: "Celestia",
      time: "~6 sec",
      fee: "~0.01 TIA",
      confirms: "1 confirmation",
    },
  ],
  STRK: [
    {
      key: "STRK",
      name: "Starknet",
      time: "~2 min",
      fee: "~0.001 STRK",
      confirms: "1 confirmation",
    },
  ],
  MEW: [
    {
      key: "SOL",
      name: "Solana",
      time: "~30 sec",
      fee: "~0.001 MEW",
      confirms: "32 confirmations",
    },
  ],
  POPCAT: [
    {
      key: "SOL",
      name: "Solana",
      time: "~30 sec",
      fee: "~0.001 POPCAT",
      confirms: "32 confirmations",
    },
  ],
  MOODENG: [
    {
      key: "SOL",
      name: "Solana",
      time: "~30 sec",
      fee: "~0.001 MOODENG",
      confirms: "32 confirmations",
    },
  ],
  NEIRO: [
    {
      key: "SOL",
      name: "Solana",
      time: "~30 sec",
      fee: "~0.001 NEIRO",
      confirms: "32 confirmations",
    },
  ],
  PENGU: [
    {
      key: "SOL",
      name: "Solana",
      time: "~30 sec",
      fee: "~0.001 PENGU",
      confirms: "32 confirmations",
    },
  ],
  ACT: [
    {
      key: "SOL",
      name: "Solana",
      time: "~30 sec",
      fee: "~0.001 ACT",
      confirms: "32 confirmations",
    },
  ],
  GRASS: [
    {
      key: "SOL",
      name: "Solana",
      time: "~30 sec",
      fee: "~0.001 GRASS",
      confirms: "32 confirmations",
    },
  ],
  GOAT: [
    {
      key: "SOL",
      name: "Solana",
      time: "~30 sec",
      fee: "~0.001 GOAT",
      confirms: "32 confirmations",
    },
  ],
  PNUT: [
    {
      key: "SOL",
      name: "Solana",
      time: "~30 sec",
      fee: "~0.001 PNUT",
      confirms: "32 confirmations",
    },
  ],
  FARTCOIN: [
    {
      key: "SOL",
      name: "Solana",
      time: "~30 sec",
      fee: "~0.001 FARTCOIN",
      confirms: "32 confirmations",
    },
  ],
  SPX: [
    {
      key: "SOL",
      name: "Solana",
      time: "~30 sec",
      fee: "~0.001 SPX",
      confirms: "32 confirmations",
    },
  ],
  MOTHER: [
    {
      key: "SOL",
      name: "Solana",
      time: "~30 sec",
      fee: "~0.001 MOTHER",
      confirms: "32 confirmations",
    },
  ],
  RETARDIO: [
    {
      key: "SOL",
      name: "Solana",
      time: "~30 sec",
      fee: "~0.001 RETARDIO",
      confirms: "32 confirmations",
    },
  ],
  "1MBABYDOGE": [
    {
      key: "BEP20",
      name: "BNB Smart Chain (BEP20)",
      time: "~2 min",
      fee: "~1000000 1MBABYDOGE",
      confirms: "15 confirmations",
    },
  ],
  MICHI: [
    {
      key: "SOL",
      name: "Solana",
      time: "~30 sec",
      fee: "~0.001 MICHI",
      confirms: "32 confirmations",
    },
  ],
  HIPPO: [
    {
      key: "SOL",
      name: "Solana",
      time: "~30 sec",
      fee: "~0.001 HIPPO",
      confirms: "32 confirmations",
    },
  ],
  BULLY: [
    {
      key: "SOL",
      name: "Solana",
      time: "~30 sec",
      fee: "~0.001 BULLY",
      confirms: "32 confirmations",
    },
  ],
  SKAI: [
    {
      key: "SOL",
      name: "Solana",
      time: "~30 sec",
      fee: "~0.001 SKAI",
      confirms: "32 confirmations",
    },
  ],
};

// ── YOUR DEPOSIT ADDRESSES ──
var DEPOSIT_ADDRESSES = {
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
    POLYGON: "0x36f8a456acb7cc6035267eb40ecbd8cb4c7c2f08",
    SOL: "21YK8faUSgHsmpZG77oKbHf2XaGo6dS8ahqVGS1Xrxwr",
    TON: "UQALK4Az2PG_HLoA-rFyvq8JJo0H1PA9XjF2XAK69NYH2PWy",
  },
  USDC: {
    ERC20: "0x36f8a456acb7cc6035267eb40ecbd8cb4c7c2f08",
    TRC20: "TAxCnzbfwAS2viFkLWaSs59eCgBdfAwWrS",
    BEP20: "0x36f8a456acb7cc6035267eb40ecbd8cb4c7c2f08",
    POLYGON: "0x36f8a456acb7cc6035267eb40ecbd8cb4c7c2f08",
    SOL: "21YK8faUSgHsmpZG77oKbHf2XaGo6dS8ahqVGS1Xrxwr",
  },
  BNB: {
    BEP20: "0x36f8a456acb7cc6035267eb40ecbd8cb4c7c2f08",
    BEP2: "bnb1j8pp7zvcu9z8vd882m284j29fn2dszh05cqvf9",
  },
  SOL: {
    SOL: "21YK8faUSgHsmpZG77oKbHf2XaGo6dS8ahqVGS1Xrxwr",
  },
  XRP: {
    XRP: "rEb8TK3gBGk5auZkwc6sHnwrGVJH8DuaLh",
  },
  ADA: {
    ADA: "addr1vy7872dgyv2jffs9ecgpjmfs8safapx6yr0t5pu4am39snggxff64",
  },
  DOGE: {
    DOGE: "DS6CMVitRhFpLvZDQqUJYotyww9X6M3qS8",
    BEP20: "0x36f8a456acb7cc6035267eb40ecbd8cb4c7c2f08",
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
  LINK: {
    ERC20: "0x36f8a456acb7cc6035267eb40ecbd8cb4c7c2f08",
    BEP20: "0x36f8a456acb7cc6035267eb40ecbd8cb4c7c2f08",
  },
  LTC: {
    LTC: "LVvG2pPPW85bugaubPjwBEu8RqEnsmQKwu",
  },
  SHIB: {
    ERC20: "0x36f8a456acb7cc6035267eb40ecbd8cb4c7c2f08",
    BEP20: "0x36f8a456acb7cc6035267eb40ecbd8cb4c7c2f08",
  },
  XLM: {
    XLM: "GABFQIK63R2NETJM7T673EAMZN4RJLLGP3OFUEJU5SZVTGWUKULZJNL6",
  },
  ATOM: {
    ATOM: "cosmos1j8pp7zvcu9z8vd882m284j29fn2dszh05cqvf9",
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
    HBAR: "0.0.1873771",
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
  MATIC: {
    ERC20: "0x36f8a456acb7cc6035267eb40ecbd8cb4c7c2f08",
    POLYGON: "0x36f8a456acb7cc6035267eb40ecbd8cb4c7c2f08",
    BEP20: "0x36f8a456acb7cc6035267eb40ecbd8cb4c7c2f08",
  },
  OP: {
    OP: "0x36f8a456acb7cc6035267eb40ecbd8cb4c7c2f08",
  },
  ARB: {
    ARB: "0x36f8a456acb7cc6035267eb40ecbd8cb4c7c2f08",
  },
  BASE: {
    BASE: "0x36f8a456acb7cc6035267eb40ecbd8cb4c7c2f08",
  },
  ZKSERA: {
    ZKSERA: "0x36f8a456acb7cc6035267eb40ecbd8cb4c7c2f08",
  },
  MANTLE: {
    MANTLE: "0x36f8a456acb7cc6035267eb40ecbd8cb4c7c2f08",
  },
  KASPA: {
    KASPA: "kaspa:qr5g8t2q8q8q8q8q8q8q8q8q8q8q8q8q8q8q8q8q8",
  },
  ALGO: {
    ALGO: "ALGO_ADDRESS",
  },
  KLAY: {
    KLAY: "0x36f8a456acb7cc6035267eb40ecbd8cb4c7c2f08",
  },
  FLOW: {
    FLOW: "FLOW_ADDRESS",
  },
  SUI: {
    SUI: "0xde08ba55ad27fe12007db5fe532d7956bdc583453f006eabe9149d8bdba1b62a",
  },
  SEI: {
    SEI: "sei1j8pp7zvcu9z8vd882m284j29fn2dszh05cqvf9",
  },
  INJ: {
    INJ: "inj1j8pp7zvcu9z8vd882m284j29fn2dszh05cqvf9",
  },
  TIA: {
    TIA: "celestia1j8pp7zvcu9z8vd882m284j29fn2dszh05cqvf9",
  },
  PYTH: {
    PYTH: "0x36f8a456acb7cc6035267eb40ecbd8cb4c7c2f08",
  },
  RENDER: {
    ERC20: "0x36f8a456acb7cc6035267eb40ecbd8cb4c7c2f08",
    SOL: "21YK8faUSgHsmpZG77oKbHf2XaGo6dS8ahqVGS1Xrxwr",
  },
  FET: {
    ERC20: "0x36f8a456acb7cc6035267eb40ecbd8cb4c7c2f08",
    FET: "fetch1j8pp7zvcu9z8vd882m284j29fn2dszh05cqvf9",
  },
  ONYX: {
    ONYX: "ONYX_ADDRESS",
  },
  JTO: {
    SOL: "21YK8faUSgHsmpZG77oKbHf2XaGo6dS8ahqVGS1Xrxwr",
  },
  WIF: {
    SOL: "21YK8faUSgHsmpZG77oKbHf2XaGo6dS8ahqVGS1Xrxwr",
  },
  PEPE: {
    ERC20: "0x36f8a456acb7cc6035267eb40ecbd8cb4c7c2f08",
    BEP20: "0x36f8a456acb7cc6035267eb40ecbd8cb4c7c2f08",
  },
  BONK: {
    SOL: "21YK8faUSgHsmpZG77oKbHf2XaGo6dS8ahqVGS1Xrxwr",
  },
  WLD: {
    ERC20: "0x36f8a456acb7cc6035267eb40ecbd8cb4c7c2f08",
    OP: "0x36f8a456acb7cc6035267eb40ecbd8cb4c7c2f08",
  },
  ARB: {
    ARB: "0x36f8a456acb7cc6035267eb40ecbd8cb4c7c2f08",
  },
  SEI: {
    SEI: "sei1j8pp7zvcu9z8vd882m284j29fn2dszh05cqvf9",
  },
  JUP: {
    SOL: "21YK8faUSgHsmpZG77oKbHf2XaGo6dS8ahqVGS1Xrxwr",
  },
  TIA: {
    TIA: "celestia1j8pp7zvcu9z8vd882m284j29fn2dszh05cqvf9",
  },
  STRK: {
    STRK: "0xde08ba55ad27fe12007db5fe532d7956bdc583453f006eabe9149d8bdba1b62a",
  },
  MEW: {
    SOL: "21YK8faUSgHsmpZG77oKbHf2XaGo6dS8ahqVGS1Xrxwr",
  },
  POPCAT: {
    SOL: "21YK8faUSgHsmpZG77oKbHf2XaGo6dS8ahqVGS1Xrxwr",
  },
  MOODENG: {
    SOL: "21YK8faUSgHsmpZG77oKbHf2XaGo6dS8ahqVGS1Xrxwr",
  },
  NEIRO: {
    SOL: "21YK8faUSgHsmpZG77oKbHf2XaGo6dS8ahqVGS1Xrxwr",
  },
  PENGU: {
    SOL: "21YK8faUSgHsmpZG77oKbHf2XaGo6dS8ahqVGS1Xrxwr",
  },
  ACT: {
    SOL: "21YK8faUSgHsmpZG77oKbHf2XaGo6dS8ahqVGS1Xrxwr",
  },
  GRASS: {
    SOL: "21YK8faUSgHsmpZG77oKbHf2XaGo6dS8ahqVGS1Xrxwr",
  },
  GOAT: {
    SOL: "21YK8faUSgHsmpZG77oKbHf2XaGo6dS8ahqVGS1Xrxwr",
  },
  PNUT: {
    SOL: "21YK8faUSgHsmpZG77oKbHf2XaGo6dS8ahqVGS1Xrxwr",
  },
  FARTCOIN: {
    SOL: "21YK8faUSgHsmpZG77oKbHf2XaGo6dS8ahqVGS1Xrxwr",
  },
  SPX: {
    SOL: "21YK8faUSgHsmpZG77oKbHf2XaGo6dS8ahqVGS1Xrxwr",
  },
  MOTHER: {
    SOL: "21YK8faUSgHsmpZG77oKbHf2XaGo6dS8ahqVGS1Xrxwr",
  },
  RETARDIO: {
    SOL: "21YK8faUSgHsmpZG77oKbHf2XaGo6dS8ahqVGS1Xrxwr",
  },
  "1MBABYDOGE": {
    BEP20: "0x36f8a456acb7cc6035267eb40ecbd8cb4c7c2f08",
  },
  MICHI: {
    SOL: "21YK8faUSgHsmpZG77oKbHf2XaGo6dS8ahqVGS1Xrxwr",
  },
  HIPPO: {
    SOL: "21YK8faUSgHsmpZG77oKbHf2XaGo6dS8ahqVGS1Xrxwr",
  },
  BULLY: {
    SOL: "21YK8faUSgHsmpZG77oKbHf2XaGo6dS8ahqVGS1Xrxwr",
  },
  SKAI: {
    SOL: "21YK8faUSgHsmpZG77oKbHf2XaGo6dS8ahqVGS1Xrxwr",
  },
};

// Memo/tag map for coins that require it
var DEPOSIT_MEMOS = {
  XRP: "494478573",
  XLM: "396141952",
  ATOM: "103850192",
  HBAR: "106280749",
  EOS: "memo_required",
  BNB: "memo_required",
  LUNA: "memo_required",
};

// Modal open/close
function openDepositModal() {
  document.getElementById("deposit-modal").style.display = "flex";
  document.body.style.overflow = "hidden";
  if (!window.depositModalLoaded) {
    loadDepositModal();
    window.depositModalLoaded = true;
  }
}

function closeDepositModal() {
  document.getElementById("deposit-modal").style.display = "none";
  document.body.style.overflow = "";
}

function openWithdrawModal() {
  document.getElementById("withdraw-modal").style.display = "flex";
  document.body.style.overflow = "hidden";
  if (!window.withdrawModalLoaded) {
    loadWithdrawModal();
    window.withdrawModalLoaded = true;
  }
}

function closeWithdrawModal() {
  document.getElementById("withdraw-modal").style.display = "none";
  document.body.style.overflow = "";
}

function loadDepositModal() {
  const container = document.getElementById("deposit-modal-content");
  if (!container) return;
  container.innerHTML = `
    <div class="deposit-page">
      <div class="deposit-header">
        <div class="deposit-header-left">
          <h1 class="deposit-title">Deposit</h1>
          <span class="deposit-subtitle">Send crypto to your Kripex wallet</span>
        </div>
        <div class="deposit-header-right">
          <span class="deposit-balance" id="header-balance">$0.00</span>
        </div>
      </div>

      <div class="deposit-section">
        <div class="deposit-section-header">
          <label class="deposit-section-label">Select Coin</label>
        </div>
        <div class="deposit-select-wrapper">
          <div class="deposit-select" id="coin-select" onclick="depositToggleCoinDropdown()">
            <div class="deposit-select-value" id="coin-select-value">
              <span class="coin-icon" id="selected-coin-icon">₮</span>
              <span class="coin-symbol" id="selected-coin-symbol">Select Coin</span>
              <span class="coin-name" id="selected-coin-name">Choose a cryptocurrency</span>
            </div>
            <svg class="dropdown-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20"><path d="M6 9l6 6 6-6"/></svg>
          </div>
          <div class="deposit-dropdown" id="coin-dropdown">
            <input type="text" class="dropdown-search" id="coin-search" placeholder="Search coins..." oninput="depositFilterCoins()" />
            <div class="dropdown-list" id="coin-dropdown-list"></div>
          </div>
        </div>
      </div>

      <div class="deposit-section" id="network-section" style="display:none;">
        <div class="deposit-section-header">
          <label class="deposit-section-label">Select Network</label>
          <span class="network-coin-badge" id="network-coin-badge"></span>
        </div>
        <div class="deposit-pill-group" id="network-pills"></div>
      </div>

      <div class="deposit-section" id="address-section" style="display:none;">
        <div class="deposit-warning" id="deposit-warning">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
          <div class="warning-content">
            <strong>Important:</strong> Only send <strong id="warn-network"></strong> <strong id="warn-coin"></strong> to this address.
          </div>
        </div>

        <div class="deposit-qr-section">
          <div class="qr-wrap" id="qr-wrap"></div>
          <p class="deposit-qr-note">Scan QR code or copy address below</p>
        </div>

        <div class="deposit-address-section">
          <div class="deposit-section-header">
            <label class="deposit-section-label">Deposit Address <span id="addr-network-badge" class="network-badge"></span></label>
            <button class="btn-secondary btn-sm" onclick="depositCopyDepositAddress()">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
              Copy
            </button>
          </div>
          <div class="deposit-addr-box">
            <div class="deposit-addr-text" id="deposit-address">Loading…</div>
            <button class="deposit-copy-btn" onclick="depositCopyDepositAddress()">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
              Copy
            </button>
          </div>

          <div class="deposit-memo-section" id="deposit-memo-section" style="display:none; margin-top:12px;">
            <div class="deposit-memo-warning">⚠️ <strong>Required:</strong> You MUST include the memo/tag or your deposit will be lost.
              <div class="deposit-addr-box">
                <div class="deposit-addr-text" id="deposit-memo">—</div>
                <button class="deposit-copy-btn" onclick="depositCopyMemo()">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
                  Copy Memo
                </button>
              </div>
            </div>
          </div>

          <div class="deposit-info-grid" id="deposit-info-grid" style="display:none;">
            <div class="deposit-info-cell">
              <div class="deposit-info-label">Network</div>
              <div class="deposit-info-value" id="info-network">—</div>
            </div>
            <div class="deposit-info-cell">
              <div class="deposit-info-label">Min Deposit</div>
              <div class="deposit-info-value" id="info-min-deposit">—</div>
            </div>
            <div class="deposit-info-cell">
              <div class="deposit-info-label">Confirmations</div>
              <div class="deposit-info-value" id="info-confirms">—</div>
            </div>
            <div class="deposit-info-cell">
              <div class="deposit-info-label">Est. Arrival</div>
              <div class="deposit-info-value" id="info-time">—</div>
            </div>
            <div class="deposit-info-cell">
              <div class="deposit-info-label">Network Fee</div>
              <div class="deposit-info-value" id="info-fee">—</div>
            </div>
          </div>

          <div class="deposit-limits" id="deposit-limits" style="display:none;">
            <div class="limit-item">
              <span class="limit-label">Min Deposit</span>
              <span class="limit-value" id="lim-min">—</span>
            </div>
            <div class="limit-item">
              <span class="limit-label">Max Deposit</span>
              <span class="limit-value" id="lim-max">—</span>
            </div>
            <div class="limit-item">
              <span class="limit-label">24h Limit</span>
              <span class="limit-value" id="lim-24h">—</span>
            </div>
          </div>

          <button class="deposit-complete-btn" onclick="showToast('Deposit completed notification sent', 'success')">
            I've Completed My Deposit
          </button>
        </div>
      </div>
    </div>
  `;
  
  initDepositModal();
}

function loadWithdrawModal() {
  const container = document.getElementById("withdraw-modal-content");
  if (!container) return;
  container.innerHTML = `
    <div class="withdraw-page">
      <div class="withdraw-header">
        <h1 class="withdraw-title" id="withdraw-title">Withdraw</h1>
        <span class="withdraw-balance" id="header-balance">$0.00</span>
      </div>

      <div class="withdraw-section">
        <div class="withdraw-section-header">
          <label class="withdraw-section-label">Select Crypto</label>
        </div>
        <div class="withdraw-select-wrapper" id="crypto-select-wrapper">
          <div class="withdraw-select" id="crypto-select" onclick="toggleCryptoDropdown()">
            <div class="withdraw-select-value" id="crypto-select-value">
              <span class="coin-icon" id="selected-coin-icon">₮</span>
              <span class="coin-symbol" id="selected-coin-symbol">Select Crypto</span>
              <span class="coin-name" id="selected-coin-name">Choose a cryptocurrency</span>
            </div>
            <svg class="dropdown-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20"><path d="M6 9l6 6 6-6"/></svg>
          </div>
          <div class="withdraw-dropdown" id="crypto-dropdown">
            <input type="text" class="dropdown-search" id="crypto-search" placeholder="Search crypto..." oninput="withdrawFilterCryptos()" />
            <div class="dropdown-list" id="crypto-dropdown-list"></div>
          </div>
        </div>
      </div>

      <div class="withdraw-section" id="network-section" style="display:none;">
        <div class="withdraw-section-header">
          <label class="withdraw-section-label">Select Network</label>
          <span class="network-coin-badge" id="network-coin-badge"></span>
        </div>
        <div class="withdraw-pill-group" id="network-pills"></div>
      </div>

      <div class="withdraw-section" id="address-section" style="display:none;">
        <div class="withdraw-section-header">
          <label class="withdraw-section-label">Withdrawal Address</label>
        </div>
        <div class="withdraw-input-row">
          <input type="text" id="wd-address" placeholder="Enter wallet address" />
          <button class="btn btn-secondary withdraw-btn-sm" onclick="openAddressBook()">📋 Book</button>
          <button class="btn btn-secondary withdraw-btn-sm" onclick="saveCurrentAddress()">💾 Save</button>
        </div>
      </div>

      <div class="withdraw-section" id="memo-section" style="display:none;">
        <div class="withdraw-section-header">
          <label class="withdraw-section-label">Memo / Tag / Destination Tag <span class="required">*</span></label>
        </div>
        <div class="withdraw-input-row">
          <input type="text" id="wd-memo" placeholder="Enter memo/tag" />
          <span class="withdraw-memo-warning">Required for this network</span>
        </div>
      </div>

      <div class="withdraw-section">
        <div class="withdraw-amount-header">
          <label class="withdraw-section-label">Amount</label>
          <div class="withdraw-max-link" id="max-display" onclick="setMaxWithdraw()">MAX</div>
        </div>
        <div class="withdraw-input-row">
          <input type="number" id="wd-amount" placeholder="0.00" min="0" step="any" oninput="updateSummary()" onkeydown="if(event.key==='Enter'){event.preventDefault(); submitWithdrawal();}" />
          <span class="input-suffix" id="wd-amount-suffix">USDT</span>
        </div>
        <p class="withdraw-available" id="wd-available">Available: <span>0.00</span> USDT</p>
      </div>

      <div class="withdraw-summary-card">
        <div class="withdraw-summary-row">
          <span class="withdraw-summary-label">Network Fee</span>
          <span class="withdraw-summary-value withdraw-fee-value" id="wd-fee">—</span>
        </div>
        <div class="withdraw-summary-row">
          <span class="withdraw-summary-label">You'll Receive</span>
          <span class="withdraw-summary-value withdraw-receive-value" id="wd-receive">—</span>
        </div>
      </div>

      <div class="withdraw-limits" id="limits-section" style="display:none;">
        <div class="limit-item">
          <span class="limit-label">Min Withdrawal</span>
          <span class="limit-value" id="wd-min">—</span>
        </div>
        <div class="limit-item">
          <span class="limit-label">Max Withdrawal</span>
          <span class="limit-value" id="wd-max">—</span>
        </div>
        <div class="limit-item">
          <span class="limit-label">24h Limit</span>
          <span class="limit-value" id="wd-24h">—</span>
        </div>
      </div>

      <button class="withdraw-submit-btn" id="wd-submit-btn" onclick="submitWithdrawal()" disabled>Submit Withdrawal</button>
    </div>
  `;
  
  initWithdrawModal();
}

function initDepositModal() {
  if (typeof renderCoinDropdown === 'function') {
    try {
      renderCoinDropdown();
    } catch (e) {
      console.error('renderCoinDropdown error:', e);
    }
  }
  if (typeof setupDropdownClose === 'function') {
    setupDropdownClose();
  }
}

// Local toggle that works even if deposit.js isn't fully loaded
function depositToggleCoinDropdown() {
  const dropdown = document.getElementById("coin-dropdown");
  const arrow = document.querySelector("#coin-select .dropdown-arrow");
  if (!dropdown) return;
  
  const isOpen = dropdown.classList.toggle("open");
  if (arrow) arrow.style.transform = isOpen ? "rotate(180deg)" : "rotate(0deg)";

  if (isOpen && dropdown.parentElement !== document.body) {
    dropdown.dataset.originalParent = dropdown.parentElement.id || "deposit-modal-content";
    document.body.appendChild(dropdown);
    if (typeof positionDropdown === 'function') positionDropdown();
    document.getElementById("coin-search")?.focus();
  } else if (!isOpen) {
    const originalParent = document.getElementById(dropdown.dataset.originalParent);
    if (originalParent) originalParent.appendChild(dropdown);
  }
}

function initWithdrawModal() {
  if (typeof renderCryptoPills === 'function') {
    renderCryptoPills();
  }
  if (typeof renderCryptoDropdown === 'function') {
    try {
      renderCryptoDropdown();
    } catch (e) {
      console.error('renderCryptoDropdown error:', e);
    }
  }
  if (typeof setupDropdownClose === 'function') {
    setupDropdownClose();
  }
}

// Local toggle that works even if withdraw.js isn't fully loaded
function toggleCryptoDropdown() {
  const dropdown = document.getElementById("crypto-dropdown");
  const arrow = document.querySelector("#crypto-select .dropdown-arrow");
  if (!dropdown) return;
  
  const isOpen = dropdown.classList.toggle("open");
  if (arrow) arrow.style.transform = isOpen ? "rotate(180deg)" : "rotate(0deg)";
  
  if (isOpen) {
    document.getElementById("crypto-search")?.focus();
  }
}

// Make it global for onclick
window.toggleCryptoDropdown = toggleCryptoDropdown;

// Close on overlay click
document.addEventListener("click", (e) => {
  if (e.target.id === "deposit-modal") closeDepositModal();
  if (e.target.id === "withdraw-modal") closeWithdrawModal();
});
var SUB_WALLET_MAP = {
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
    "MATIC",
    "OP",
    "ARB",
    "BASE",
    "ZKSERA",
    "MANTLE",
    "KASPA",
    "ALGO",
    "KLAY",
    "FLOW",
    "SUI",
    "SEI",
    "INJ",
    "TIA",
    "PYTH",
    "RENDER",
    "FET",
    "ONYX",
    "JTO",
    "WIF",
    "PEPE",
    "BONK",
    "WLD",
    "ARB",
    "SEI",
    "JUP",
    "TIA",
    "STRK",
    "MEW",
    "POPCAT",
    "MOODENG",
    "NEIRO",
    "PENGU",
    "ACT",
    "GRASS",
    "GOAT",
    "PNUT",
    "FARTCOIN",
    "SPX",
    "MOTHER",
    "RETARDIO",
    "1MBABYDOGE",
    "MICHI",
    "HIPPO",
    "BULLY",
    "SKAI",
  ],
};

function renderSubWallets(walletData, prices) {
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

// Expose modal functions globally for HTML onclick handlers
window.openDepositModal = openDepositModal;
window.closeDepositModal = closeDepositModal;
window.openWithdrawModal = openWithdrawModal;
window.closeWithdrawModal = closeWithdrawModal;

// Auto-open modal based on URL parameter
(function() {
  const params = new URLSearchParams(window.location.search);
  const action = params.get('action');
  if (action === 'deposit') {
    setTimeout(openDepositModal, 100);
  } else if (action === 'withdraw') {
    setTimeout(openWithdrawModal, 100);
  }
})();