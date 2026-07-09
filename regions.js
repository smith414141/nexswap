// ISO country code -> allowed advanced products
// "restricted": [] means no advanced products blocked, only base features
const COUNTRY_RULES = {
  ET: { name: "Ethiopia", flag: "🇪🇹", restricted: ["futures", "nft", "launchpad", "governance"] },
  NG: { name: "Nigeria", flag: "🇳🇬", restricted: ["futures"] },
  KE: { name: "Kenya", flag: "🇰🇪", restricted: [] },
  ZA: { name: "South Africa", flag: "🇿🇦", restricted: [] },
  US: { name: "United States", flag: "🇺🇸", restricted: ["futures", "launchpad"] },
  GB: { name: "United Kingdom", flag: "🇬🇧", restricted: ["nft"] },
  DE: { name: "Germany", flag: "🇩🇪", restricted: [] },
  AE: { name: "United Arab Emirates", flag: "🇦🇪", restricted: [] },
  IN: { name: "India", flag: "🇮🇳", restricted: ["futures"] },
};
const DEFAULT_COUNTRY = "ET";

function isFeatureAllowed(countryCode, featureKey) {
  const rule = COUNTRY_RULES[countryCode] || COUNTRY_RULES[DEFAULT_COUNTRY];
  return !rule.restricted.includes(featureKey);
}
