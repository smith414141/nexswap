// region-gate.js
// Shared helper for gating features by user region.
// Usage: gateFeatureByRegion({ allowed: ["global","eu"], featureName: "Futures Trading", contentId: "feature-content", gateId: "region-gate" })

function getCurrentUserRegion(callback) {
  const user = auth.currentUser;
  if (!user) return callback("global");
  db.collection("users")
    .doc(user.uid)
    .get()
    .then((doc) => callback((doc.data() && doc.data().region) || "global"))
    .catch(() => callback("global"));
}

function gateFeatureByRegion({ allowed, featureName, contentId, gateId }) {
  auth.onAuthStateChanged((user) => {
    if (!user) return;
    getCurrentUserRegion((region) => {
      const content = document.getElementById(contentId);
      const gate = document.getElementById(gateId);
      const isAllowed = allowed.includes(region);
      if (isAllowed) {
        if (content) content.style.display = "block";
        if (gate) gate.style.display = "none";
      } else {
        if (content) content.style.display = "none";
        if (gate) {
          gate.style.display = "flex";
          const nameEl = gate.querySelector(".region-gate-feature-name");
          if (nameEl) nameEl.textContent = featureName;
          const regionEl = gate.querySelector(".region-gate-current-region");
          if (regionEl) regionEl.textContent = regionLabel(region);
        }
      }
    });
  });
}

function regionLabel(region) {
  const map = {
    global: "🌍 Global",
    us: "🇺🇸 United States",
    eu: "🇪🇺 Europe",
    africa: "🌍 Africa",
  };
  return map[region] || region;
}

// Renders the standard "not available in your region" gate markup into a container.
function renderRegionGateMarkup(gateId) {
  return `
    <div id="${gateId}" class="region-gate-card" style="display:none">
      <div class="region-gate-icon">🔒</div>
      <div class="region-gate-title">Not available in your region</div>
      <p class="region-gate-text">
        <span class="region-gate-feature-name">This feature</span> isn't currently offered for accounts registered in
        <span class="region-gate-current-region">your region</span>, in line with local regulatory availability.
      </p>
      <button class="btn-primary" onclick="window.location.href='settings.html'">Change Region</button>
    </div>
  `;
}
