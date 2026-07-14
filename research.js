// research.js
const ARTICLES = [
  {
    title: "Bitcoin ETF Inflows Signal Institutional Accumulation Phase",
    category: "bitcoin",
    categoryLabel: "₿",
    categoryColor: "#F7931A",
    summary: "BlackRock and Fidelity ETFs saw $3.2B net inflows last week, the highest since March. On-chain data suggests long-term holders are absorbing supply.",
    author: "Marcus Chen",
    timeAgo: "2h ago",
    readTime: "5 min read",
    featured: true,
    trending: false,
    body: "Bitcoin exchange-traded funds in the United States recorded their largest weekly net inflows since March, with BlackRock's IBIT and Fidelity's FBTC leading the charge. The $3.2 billion in combined inflows over five trading sessions signals a renewed institutional appetite for BTC exposure.\n\nOn-chain analytics from Glassnode show that long-term holders — addresses that have held BTC for more than 155 days — increased their aggregate balance by 42,000 BTC over the same period. This absorption of supply by conviction holders typically precedes sustained uptrends.\n\nThe ETF flow data also reveals a shift in sentiment. Previous inflows were often driven by speculative positioning ahead of macro events. This time, the steady daily pace suggests strategic allocation rather than tactical trading.\n\nKey levels to watch: $68K as immediate resistance (previous cycle high, and $62K as support. A weekly close above $68K would confirm the accumulation thesis and likely trigger the next leg higher toward $75K–$80K."
  },
  {
    title: "Ethereum's Dencun Upgrade Slashes L2 Fees by 90%",
    category: "ethereum",
    categoryLabel: "Ξ",
    categoryColor: "#627EEA",
    summary: "Proto-danksharding (EIP-4844) goes live, introducing blobspace for rollups. Optimism, Arbitrum, and Base transaction costs drop from ~$1 to ~$0.10.",
    author: "Sarah Kim",
    timeAgo: "5h ago",
    readTime: "6 min read",
    featured: false,
    trending: true,
    body: "Ethereum's Dencun upgrade, which activated at epoch 269,568, has successfully deployed EIP-4844 — commonly known as proto-danksharding. The upgrade introduces 'blob' transactions, a new data availability layer specifically designed for layer-2 rollups.\n\nEarly data from L2Beat shows dramatic fee reductions across major rollups. Optimism mainnet fees dropped from a median of $0.85 to $0.07 per transaction. Arbitrum One saw a similar decline from $1.20 to $0.09. Base, Coinbase's L2, now averages $0.05 per swap.\n\nThe blobspace market has been competitive but not congested. In the first 48 hours, blob gas prices hovered around 1-3 wei per blob gas, well below the 2^17 wei target. This suggests the initial supply of 3 blobs per block (expandable to 6) is sufficient for current demand.\n\nHowever, the upgrade also reduced L1 priority fee revenue by approximately 15%, as some MEV activity shifts to blob-based transactions. Validator earnings remain healthy at ~3.8% APR post-upgrade.\n\nThe real test comes when blob demand exceeds supply. EIP-7706 (planned for the next fork) will introduce a multi-dimensional gas market for blobs, similar to EIP-1559 for calldata."
  },
  {
    title: "Aave V4 Proposes Unified Liquidity Across Chains",
    category: "defi",
    categoryLabel: "🏦",
    categoryColor: "#B6509E",
    summary: "New AIP introduces cross-chain liquidity pools with unified interest rates. Could solve fragmentation but raises bridge risk questions.",
    author: "David Park",
    timeAgo: "8h ago",
    readTime: "7 min read",
    featured: false,
    trending: false,
    body: "Aave's latest governance proposal (AIP-187) outlines a vision for V4 that would unify liquidity across Ethereum, Arbitrum, Optimism, Base, and Polygon. The core innovation is a single shared liquidity pool with unified interest rate curves, replacing the current siloed per-chain deployments.\n\nUnder the proposal, users could deposit USDC on Ethereum and borrow against it on Arbitrum without bridging. Interest rates would be calculated globally based on total utilization across all connected chains, eliminating the rate discrepancies that currently exist between deployments.\n\nThe architecture relies on CCIP (Chainlink Cross-Chain Interoperability Protocol) for messaging and a new 'UnifiedPool' contract that coordinates reserve accounting. Risk parameters (LTV, liquidation thresholds) would remain configurable per chain, but the underlying liquidity would be fungible.\n\nCritics point to bridge risk: a CCIP exploit or consensus failure on one chain could cascade. The proposal mitigates this with per-chain debt ceilings and a circuit breaker that pauses cross-chain operations if anomalies are detected.\n\nIf approved, V4 would launch in Q1 2025 with a phased rollout: Ethereum + Arbitrum first, then Optimism, Base, and Polygon."
  },
  {
    title: "AI Agents Launch Tokens on Pump.fun — $50M Volume in Week 1",
    category: "ai",
    categoryLabel: "🤖",
    categoryColor: "#8B5CF6",
    summary: "Autonomous AI agents are creating and trading memecoins on Solana. Truth Terminal's GOAT hits $500M market cap. Regulators watching closely.",
    author: "Lisa Wang",
    timeAgo: "12h ago",
    readTime: "5 min read",
    featured: true,
    trending: true,
    body: "An autonomous AI agent named 'Truth Terminal' created a memecoin called GOAT (Goatseus Maximus) on Pump.fun, Solana's fair-launch platform. Within 72 hours, GOAT reached a $500 million fully diluted valuation and $50 million in 24-hour volume — all driven by the agent's own tweets and community engagement.\n\nThis marks the first time an AI agent has independently launched a token that achieved significant market cap without human intervention in the creation process. The agent was given a wallet with $50,000 in SOL by its creator, Andy Ayrey, and instructed to 'maximize engagement.'\n\nSince GOAT's success, over 200 AI-launched tokens have appeared on Pump.fun. Most are low-liquidity experiments, but a handful — including FARTCOIN and ACT — have exceeded $50M market cap.\n\nRegulators are taking note. The SEC's Division of Enforcement has reportedly opened inquiries into whether AI-generated tokens constitute unregistered securities offerings where the 'promoter' is non-human. The CFTC is also monitoring for potential market manipulation.\n\nFor users, the risks are extreme: these tokens have no fundamentals, liquidity can vanish instantly, and the AI agents themselves can be compromised or manipulated. Volume is concentrated in the first 24 hours post-launch."
  },
  {
    title: "SEC vs. Uniswap: Wells Notice Signals Regulatory Escalation",
    category: "regulation",
    categoryLabel: "⚖️",
    categoryColor: "#EF4444",
    summary: "Uniswap Labs receives Wells notice alleging unregistered securities exchange operation. UNI drops 18%. Industry braces for broader DEX crackdown.",
    author: "James Rodriguez",
    timeAgo: "1d ago",
    readTime: "6 min read",
    featured: false,
    trending: true,
    body: "Uniswap Labs confirmed it received a Wells notice from the SEC, signaling the agency's intent to bring enforcement action. The notice alleges that Uniswap operates as an unregistered securities exchange and broker, and that the UNI token itself may be an investment contract under the Howey test.\n\nUNI token dropped 18% on the news, wiping out $600M in market cap. The broader DeFi sector sold off, with AAVE, COMP, and CRV each down 12-15%.\n\nThe SEC's argument centers on three pillars: (1) Uniswap's frontend (app.uniswap.org) constitutes an exchange platform, (2) the UNI governance token provides profit expectations through protocol fee switches, and (3) the Labs entity exerts sufficient control to meet the 'common enterprise' prong of Howey.\n\nUniswap Labs plans to contest. Their defense: the protocol is immutable smart contract code — not an exchange — and UNI is a governance token with no promised returns. The fee switch has never been activated.\n\nThis case could set precedent for all AMM-based DEXs. If the SEC prevails, frontends may need to register as exchanges or geo-block US users. Protocol-level code would be harder to regulate directly."
  },
  {
    title: "PEPE Whale Accumulates 2 Trillion Tokens Amid Exchange Outflows",
    category: "meme",
    categoryLabel: "🐸",
    categoryColor: "#F97316",
    summary: "Single entity withdraws $12M PEPE from Binance and OKX. On-chain analysis suggests coordinated accumulation ahead of potential Binance listing expansion.",
    author: "CryptoWhaleTracker",
    timeAgo: "3h ago",
    readTime: "4 min read",
    featured: false,
    trending: false,
    body: "A single wallet address — likely an institutional player or sophisticated whale — has accumulated 2.1 trillion PEPE tokens ($12.4M at current prices) over the past 72 hours. The accumulation pattern shows withdrawals from Binance (1.3T) and OKX (0.8T) into a single cold storage address.\n\nThe wallet's activity correlates with PEPE's recent 25% price recovery from $0.0000085 to $0.0000106. Exchange reserves for PEPE have declined 18% this month, the steepest drop among top-20 memecoins.\n\nSpeculation centers on a potential Binance futures listing expansion. PEPE currently trades only on Binance spot. A perpetual futures listing would unlock leveraged speculation and typically precedes 50-100% rallies in memecoins.\n\nHowever, memecoin whale accumulation often precedes distribution. The same wallet pattern was observed before PEPE's 60% correction in May 2023. Position sizing and stop-losses are essential for any exposure."
  },
  {
    title: "Solana's Firedancer Client Nears Mainnet — 1M TPS Target",
    category: "ethereum",
    categoryLabel: "◎",
    categoryColor: "#9945FF",
    summary: "Jump Crypto's validator client achieves 1M TPS in testnet stress test. Could solve Solana's congestion issues but raises centralization concerns.",
    author: "Alex Turner",
    timeAgo: "1d ago",
    readTime: "6 min read",
    featured: false,
    trending: false,
    body: "Jump Crypto's Firedancer, a second independent validator client for Solana written in C++, achieved 1 million transactions per second in a recent testnet stress test — a 10x improvement over the current Agave client's ~100k TPS ceiling.\n\nFiredancer's architecture is fundamentally different: it uses a tile-based pipeline where each stage (transaction ingestion, signature verification, runtime execution, banking) runs on dedicated CPU cores with lock-free data structures. This eliminates the contention bottlenecks that cause Agave to stall under load.\n\nThe performance gains are real, but they come with trade-offs. Firedancer requires significantly more powerful hardware (64-core servers with 256GB RAM vs 12-core/128GB for Agave). This raises the barrier for running validators and could concentrate stake among well-funded operators like Jump, Coinbase, and Figment.\n\nSolana Labs has committed to supporting both clients, and the community is debating hardware requirements for the official validator spec. A mainnet launch is targeted for Q2 2025, pending a successful beta period with at least 15% of stake running Firedancer."
  },
  {
    title: "Lido's stETH Supply Hits 9.8M — 29% of All ETH Staked",
    category: "defi",
    categoryLabel: "🥞",
    categoryColor: "#B6509E",
    summary: "Liquid staking dominance continues despite centralization concerns. stETH now exceeds all CEX staking combined. Governance vote on dual governance model pending.",
    author: "Maria Santos",
    timeAgo: "6h ago",
    readTime: "5 min read",
    featured: false,
    trending: false,
    body: "Lido's stETH supply has reached 9.8 million ETH, representing 29% of all staked ETH and exceeding the combined staked balances of Coinbase (2.1M), Binance (1.8M), Kraken (1.2M), and other centralized providers.\n\nThis milestone reinforces Lido's position as the de facto liquid staking layer for Ethereum. However, it also intensifies the centralization debate: a single protocol controlling nearly one-third of validator stake creates systemic risk if Lido's smart contracts or governance are compromised.\n\nLido's dual governance proposal (LIP-20) aims to address this by giving stETH holders veto power over protocol upgrades. The vote is scheduled for next week. If passed, it would be the first major DeFi protocol to implement token-holder override of DAO decisions.\n\nMeanwhile, competitors Rocket Pool (rETH, 900k ETH) and Frax (sfrxETH, 300k ETH) are growing but remain far behind. The liquid staking landscape appears to be consolidating around a winner-take-most dynamic."
  },
  {
    title: "Bitcoin Layer-2 Race: Stacks, Rootstock, and Bitlayer Compete for Capital",
    category: "bitcoin",
    categoryLabel: "₿",
    categoryColor: "#F7931A",
    summary: "Three distinct BTC L2 approaches vie for developer mindshare. Stacks leads in TVL ($400M), Rootstock in DeFi integrations, Bitlayer in institutional backing.",
    author: "Kevin Liu",
    timeAgo: "18h ago",
    readTime: "7 min read",
    featured: false,
    trending: false,
    body: "Bitcoin's layer-2 ecosystem is heating up as three distinct approaches compete for the estimated $1T in idle BTC capital. Each takes a fundamentally different architectural approach:\n\nStacks (STX): Uses a 'proof-of-transfer' consensus where miners transfer BTC to STX holders. TVL: $400M. Strength: native BTC clarity (sBTC), mature DeFi ecosystem (ALEX, Arkadiko). Weakness: separate token economy, not a pure BTC settlement layer.\n\nRootstock (RSK): EVM-compatible sidechain merge-mined with Bitcoin. TVL: $180M. Strength: Ethereum dev tooling compatibility, established DeFi (Sovryn, Money on Chain). Weakness: federation-based bridge, not trust-minimized.\n\nBitlayer: New entrant using BitVM-based bridge for trust-minimized BTC settlement. TVL: $60M (launched March). Strength: true BTC finality, institutional backing (Framework, Polychain, ABCDE). Weakness: unproven at scale, complex trust assumptions.\n\nCapital is flowing to all three, but developer mindshare currently favors Stacks for apps and Bitlayer for infrastructure. The winner may not be a single chain — BTC L2s could specialize (DeFi on Stacks, institutional custody on Bitlayer, EVM compatibility on Rootstock)."
  },
  {
    title: "EigenLayer Restaking Hits $15B TVL — EigenDA Launch Imminent",
    category: "defi",
    categoryLabel: "🏦",
    categoryColor: "#B6509E",
    summary: "Restaking protocol surpasses Aave in TVL. EigenDA data availability layer targets Ethereum rollups. EIGEN token distribution details leaked.",
    author: "Rachel Chen",
    timeAgo: "4h ago",
    readTime: "6 min read",
    featured: true,
    trending: true,
    body: "EigenLayer's total value locked has surged to $15.2 billion, overtaking Aave ($12.8B) to become the second-largest DeFi protocol by TVL after Lido. The growth is driven by the upcoming EigenDA (Data Availability) launch and anticipation of the EIGEN token airdrop.\n\nEigenDA will provide a high-throughput, low-cost data availability layer for Ethereum rollups, competing directly with Celestia and Avail. Early benchmarks show 10 MB/s throughput at 1/10th the cost of calldata. Rollups including Mantle, Celo, and Fluence have committed to integrating.\n\nThe restaking mechanism allows ETH stakers (native or via LSTs like stETH) to secure additional services (AVSs) for additional yield. Current average APR: 8.5% base staking + 3.2% restaking = 11.7% combined.\n\nLeaked tokenomics suggest EIGEN allocation: 45% community (airdrop, staking rewards), 25% core contributors, 20% investors, 10% foundation. The airdrop snapshot reportedly took place at block 19,850,000 (late April). Claim process expected within 60 days of mainnet EigenDA launch."
  }
];

let currentFilter = "all";

document.addEventListener("DOMContentLoaded", () => {
  renderFilterPills();
  renderArticles();
});

function renderFilterPills() {
  const categories = [
    { id: "all", label: "All" },
    { id: "bitcoin", label: "Bitcoin", icon: "₿" },
    { id: "ethereum", label: "Ethereum", icon: "Ξ" },
    { id: "defi", label: "DeFi", icon: "🏦" },
    { id: "ai", label: "AI", icon: "🤖" },
    { id: "regulation", label: "Regulation", icon: "⚖️" },
    { id: "meme", label: "Meme", icon: "🐸" },
  ];

  const container = document.getElementById("rs-filter-pills");
  container.innerHTML = categories.map(c => `
    <button class="rs-filter-pill ${c.id === "all" ? "active" : ""}" onclick="filterArticles('${c.id}', this)">
      ${c.icon ? `<span>${c.icon}</span>` : ""} ${c.label}
    </button>
  `).join("");
}

function renderArticles() {
  const container = document.getElementById("rs-articles");
  const filtered = ARTICLES.filter(a => currentFilter === "all" || a.category === currentFilter);
  
  container.innerHTML = filtered.map((a, i) => `
    <div class="card rs-article-card" style="margin-bottom: 16px; overflow: hidden;" onclick="toggleArticleBody(${ARTICLES.indexOf(a)})">
      <div style="padding: 16px 16px 0;">
        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px; flex-wrap: wrap;">
          <span class="rs-cat-badge" style="width: 28px; height: 28px; border-radius: 50%; background: ${a.categoryColor}; display: flex; align-items: center; justify-content: center; color: #fff; font-weight: 800; font-size: 12px; flex-shrink: 0;">${a.categoryLabel}</span>
          <span class="badge badge-grey" style="font-size: 10px; text-transform: uppercase;">${a.category.charAt(0).toUpperCase() + a.category.slice(1)}</span>
          ${a.featured ? '<span class="badge" style="background: rgba(240,185,11,0.15); color: var(--blue); font-size: 9px; font-weight: 700; padding: 2px 6px; border-radius: 4px;">FEATURED</span>' : ''}
          ${a.trending ? '<span class="badge" style="background: rgba(239,68,68,0.15); color: var(--red); font-size: 9px; font-weight: 700; padding: 2px 6px; border-radius: 4px;">TRENDING</span>' : ''}
          <span style="margin-left: auto; font-size: 12px; color: var(--text3); cursor: pointer;" onclick="event.stopPropagation(); showToast('Bookmarked', 'success')">🔖</span>
        </div>
        <h3 style="font-weight: 800; font-size: 15px; line-height: 1.3; margin-bottom: 6px; color: var(--text);">${a.title}</h3>
        <p style="font-size: 12.5px; color: var(--text2); line-height: 1.5; margin-bottom: 10px;">${a.summary}</p>
        <div style="display: flex; align-items: center; gap: 12px; font-size: 11px; color: var(--text3); border-top: 1px solid var(--border); padding-top: 10px;">
          <span>${a.author}</span>
          <span>·</span>
          <span>${a.timeAgo}</span>
          <span>·</span>
          <span>${a.readTime}</span>
        </div>
      </div>
      <div id="rs-body-${ARTICLES.indexOf(a)}" style="padding: 0 16px 16px; display: none; border-top: 1px solid var(--border); background: var(--bg2);">
        <p style="font-size: 13px; color: var(--text); line-height: 1.7; white-space: pre-wrap;">${a.body}</p>
      </div>
    </div>
  `).join("");
}

function filterArticles(cat, btn) {
  currentFilter = cat;
  document.querySelectorAll(".rs-filter-pill").forEach(b => b.classList.remove("active"));
  btn.classList.add("active");
  renderArticles();
}

function toggleArticleBody(index) {
  const el = document.getElementById("rs-body-" + index);
  if (el) {
    el.style.display = el.style.display === "none" ? "block" : "none";
  }
}