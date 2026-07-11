// governance.js
const PROPOSALS = [
  { id: "KIP-01", title: "Reduce P2P merchant fee from 0.5% to 0.3%", yes: 68, no: 32 },
  { id: "KIP-02", title: "Add support for Solana-based tokens", yes: 81, no: 19 },
  { id: "KIP-03", title: "Increase staking rewards pool by 10%", yes: 54, no: 46 },
];
const voted = {};

document.addEventListener("DOMContentLoaded", () => {
  gateFeatureByRegion({
    allowed: ["global"],
    featureName: "Governance",
    contentId: "feature-content",
    gateId: "region-gate",
  });
  renderProposals();
});

function renderProposals() {
  const list = document.getElementById("gov-list");
  list.innerHTML = PROPOSALS.map(
    (p, i) => `
    <div class="card">
      <div style="font-size:11px; color:var(--text2); margin-bottom:4px">${p.id}</div>
      <div style="font-weight:700; font-size:13px; margin-bottom:10px">${p.title}</div>
      <div style="display:flex; height:8px; border-radius:4px; overflow:hidden; margin-bottom:6px">
        <div style="width:${p.yes}%; background:var(--green)"></div>
        <div style="width:${p.no}%; background:var(--red)"></div>
      </div>
      <div style="display:flex; justify-content:space-between; font-size:11px; color:var(--text2); margin-bottom:10px">
        <span>👍 ${p.yes}%</span>
        <span>👎 ${p.no}%</span>
      </div>
      <div style="display:flex; gap:8px" id="gov-buttons-${i}">
        <button class="btn-secondary" style="flex:1; padding:8px; font-size:12px" onclick="vote(${i}, true)">Vote Yes</button>
        <button class="btn-secondary" style="flex:1; padding:8px; font-size:12px" onclick="vote(${i}, false)">Vote No</button>
      </div>
    </div>`
  ).join("");
}

function vote(index, isYes) {
  if (voted[index]) {
    showToast("You already voted on this proposal", "error");
    return;
  }
  voted[index] = true;
  const p = PROPOSALS[index];
  const totalVotes = 100;
  if (isYes) {
    p.yes = Math.min(100, p.yes + 1);
    p.no = 100 - p.yes;
  } else {
    p.no = Math.min(100, p.no + 1);
    p.yes = 100 - p.no;
  }
  renderProposals();
  showToast(`Vote recorded: ${isYes ? "Yes" : "No"}`, "success");
}
