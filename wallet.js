// Your deposit addresses — EDIT WITH YOUR REAL ADDRESSES
const DEPOSIT_ADDRESSES = {
  USDT: {
    TRC20: "TYourUSDTTRC20AddressHere",
    ERC20: "0xYourUSDTERC20AddressHere",
    BEP20: "0xYourUSDTBEP20AddressHere",
  },
  BTC: {
    "BTC Network": "YourBTCAddressHere",
    Lightning: "YourLightningAddressHere",
  },
};

const NETWORK_INFO = {
  USDT: [
    { key: "TRC20", name: "TRC20 (Tron)", fee: "Low fee", time: "~1 min" },
    { key: "ERC20", name: "ERC20 (Ethereum)", fee: "High fee", time: "~5 min" },
    { key: "BEP20", name: "BEP20 (BSC)", fee: "Low fee", time: "~1 min" },
  ],
  BTC: [
    {
      key: "BTC Network",
      name: "Bitcoin Network",
      fee: "Network fee",
      time: "~30 min",
    },
    {
      key: "Lightning",
      name: "Lightning Network",
      fee: "Very low fee",
      time: "Instant",
    },
  ],
};
