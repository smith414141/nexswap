// research.js
const ARTICLES = [
  {
    title: "Understanding Funding Rates in Perpetual Futures",
    tag: "Education",
    body: "Funding rates keep a perpetual contract's price anchored to the underlying spot market by periodically transferring payments between long and short holders. A positive rate means longs pay shorts, signalling bullish crowding; a negative rate flips that relationship.",
  },
  {
    title: "Dollar-Cost Averaging vs. Lump-Sum Investing",
    tag: "Strategy",
    body: "Spreading purchases over time smooths out entry price volatility and reduces the emotional weight of any single decision, at the cost of potentially missing early upside during strong uptrends.",
  },
  {
    title: "What Moves the Fear & Greed Index",
    tag: "Market",
    body: "The index blends volatility, momentum, social sentiment, and dominance metrics into a single score. Extreme fear often coincides with local price bottoms, while extreme greed has historically preceded pullbacks — though neither is a reliable timing signal on its own.",
  },
  {
    title: "A Beginner's Guide to Self-Custody",
    tag: "Security",
    body: "Moving assets off an exchange into a wallet you control removes counterparty risk but shifts responsibility for key management entirely onto you. Seed phrases should never be stored digitally or shared with anyone.",
  },
];

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("rs-list").innerHTML = ARTICLES.map(
    (a, i) => `
    <div class="card" style="margin-bottom:10px;padding:14px;cursor:pointer" onclick="toggleArticle(${i})">
      <div style="display:flex;justify-content:space-between;align-items:center">
        <strong>${a.title}</strong>
        <span class="badge badge-grey">${a.tag}</span>
      </div>
      <p id="rs-body-${i}" style="font-size:12.5px;color:var(--text2);margin-top:8px;display:none">${a.body}</p>
    </div>`
  ).join("");
});

function toggleArticle(i) {
  const el = document.getElementById("rs-body-" + i);
  el.style.display = el.style.display === "none" ? "block" : "none";
}
