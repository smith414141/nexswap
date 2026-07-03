// Anonymized trader name generator
const NAME_PREFIXES = [
  "User",
  "Trader",
  "Crypto",
  "Swift",
  "Pro",
  "Elite",
  "Gold",
  "Star",
  "Top",
];
const NAME_SUFFIXES = ["King", "Master", "Hub", "Pro", "X", "VIP", "Plus"];

function generateTraderName(seed) {
  const useNumbers = seededRandom(seed) > 0.4;
  if (useNumbers) {
    const prefix =
      NAME_PREFIXES[Math.floor(seededRandom(seed + 1) * NAME_PREFIXES.length)];
    const num = Math.floor(seededRandom(seed + 2) * 9000) + 1000;
    return `${prefix}${num}`;
  } else {
    const prefix =
      NAME_PREFIXES[Math.floor(seededRandom(seed + 1) * NAME_PREFIXES.length)];
    const suffix =
      NAME_SUFFIXES[Math.floor(seededRandom(seed + 3) * NAME_SUFFIXES.length)];
    return `${prefix}${suffix}`;
  }
}
// Generate consistent avatar color from name
function getAvatarColor(name) {
  const colors = [
    "#F0B90B",
    "#0ECB81",
    "#3B82F6",
    "#8B5CF6",
    "#F6465D",
    "#06B6D4",
    "#F97316",
    "#EC4899",
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash += name.charCodeAt(i);
  return colors[hash % colors.length];
}

function getInitials(name) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

// Seeded random for consistent generation
function seededRandom(seed) {
  let x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

// Generate listings for a currency
function generateListings(currencyCode, crypto, type) {
  const currency = CURRENCIES.find((c) => c.code === currencyCode);
  if (!currency) return [];

  const methods = PAYMENT_METHODS[currencyCode] || ["Bank Transfer"];
  const basePrice = CRYPTO_PRICES[crypto] * currency.rate;

  const count = 22; // listings per currency/crypto/type
  const listings = [];

  for (let i = 0; i < count; i++) {
    const seed =
      currencyCode.charCodeAt(0) * 1000 +
      crypto.charCodeAt(0) * 100 +
      (type === "buy" ? 1 : 2) * 50 +
      i;
    const name = generateTraderName(seed);

    // Price variation: sellers price slightly higher, buyers slightly lower
    const variance =
      type === "sell"
        ? 1 + seededRandom(seed) * 0.03 // sellers: 0% to +3%
        : 1 - seededRandom(seed) * 0.025; // buyers: 0% to -2.5%

    const price = basePrice * variance;

    // Trade count: some high, some low
    const tradeCountSeed = seededRandom(seed + 1);
    const trades =
      tradeCountSeed > 0.7
        ? Math.floor(800 + tradeCountSeed * 1600) // 800-2400
        : Math.floor(12 + tradeCountSeed * 200); // 12-200

    // Completion rate
    const completion = (88 + seededRandom(seed + 2) * 11).toFixed(1);

    // Verified badge
    const verified = seededRandom(seed + 3) > 0.4;

    // Online status
      // Offline merchants
    const id = `${currencyCode}-${crypto}-${type}-${i}`;
    const FORCED_OFFLINE_IDS = ["ETB-USDT-sell-0", "ETB-USDT-sell-1"];
    const online = FORCED_OFFLINE_IDS.includes(id)
      ? false
      : seededRandom(seed + 4) > 0.35;

    // Limits
    const minLimit = Math.round((50 * currency.rate) / 10) * 10;
    const maxLimit =
      Math.round((minLimit * (5 + seededRandom(seed + 5) * 15)) / 10) * 10;

    // Available amount (for sellers)
    const available = (1000 + seededRandom(seed + 6) * 9000).toFixed(2);

    // Payment methods (1-2 random)
    const numMethods = seededRandom(seed + 7) > 0.5 ? 2 : 1;
    const selectedMethods = [];
    for (let m = 0; m < numMethods && m < methods.length; m++) {
      const idx = Math.floor(seededRandom(seed + 8 + m) * methods.length);
      if (!selectedMethods.includes(methods[idx]))
        selectedMethods.push(methods[idx]);
    }
    if (selectedMethods.length === 0) selectedMethods.push(methods[0]);

    listings.push({
      id,
      name,
      initials: getInitials(name),
      color: getAvatarColor(name),
      verified,
      online,
      trades,
      completion,
      price: price.toFixed(2),
      currency: currencyCode,
      crypto,
      type,
      minLimit,
      maxLimit,
      available,
      methods: selectedMethods,
    });
  }

  // Sort: best price first
  listings.sort((a, b) =>
    type === "sell" ? a.price - b.price : b.price - a.price
  );

  return listings;
}

// ---- ADMIN OVERRIDES  -----
function applyListingOverrides(listings) {
  return db
    .collection("listingOverrides")
    .get()
    .then((snapshot) => {
      const overrides = {};
      snapshot.forEach((doc) => {
        overrides[doc.id] = doc.data();
      });
      return listings.map((l) => {
        const o = overrides[l.id];
        if (!o) return l;
        return {
          ...l,
          name: o.name !== undefined ? o.name : l.name,
          initials: o.name !== undefined ? getInitials(o.name) : l.initials,
          color: o.name !== undefined ? getAvatarColor(o.name) : l.color,
          price: o.price !== undefined ? o.price : l.price,
          online: o.online !== undefined ? o.online : l.online,
          minLimit: o.minLimit !== undefined ? o.minLimit : l.minLimit,
          maxLimit: o.maxLimit !== undefined ? o.maxLimit : l.maxLimit,
          available: o.available !== undefined ? o.available : l.available,
        };
      });
    })
    .catch(() => listings); // if Firestore fails, just show originals
}
