// trading-bots.js
const BOT_TEMPLATES = [
  {
    id: "grid",
    name: "Grid Bot",
    icon: "🔲",
    desc: "Buys low and sells high automatically within a set price range.",
    apy: "15-45%",
  },
  {
    id: "dca",
    name: "DCA Bot",
    icon: "📉",
    desc: "Buys a fixed amount at regular intervals, smoothing your average entry.",
    apy: "10-30%",
  },
  {
    id: "rebalancing",
    name: "Rebalancing Bot",
    icon: "⚖️",
    desc: "Keeps your portfolio at fixed target allocations across coins.",
    apy: "8-25%",
  },
  {
    id: "arbitrage",
    name: "Arbitrage Bot",
    icon: "⚡",
    desc: "Exploits price differences across pairs and exchanges.",
    apy: "5-15%",
  },
];

const TB_STORAGE_KEY = "kripex-trading-bots";
let tbSelectedTemplateId = null;

function tbLoadBots() {
  try {
    return JSON.parse(localStorage.getItem(TB_STORAGE_KEY)) || [];
  } catch (e) {
    return [];
  }
}

function tbSaveBots(bots) {
  localStorage.setItem(TB_STORAGE_KEY, JSON.stringify(bots));
}

function tbFormatUsd(n) {
  const sign = n < 0 ? "-" : "";
  return sign + "$" + Math.abs(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function renderTemplates() {
  const grid = document.getElementById("tb-templates");
  if (!grid) return;
  grid.innerHTML = BOT_TEMPLATES.map(
    (t) => `
    <div class="card" style="padding: 14px">
      <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px">
        <div style="font-size: 22px">${t.icon}</div>
        <div>
          <div style="font-weight: 800; font-size: 13px">${t.name}</div>
          <div style="font-size: 11px; color: var(--green)">APY ${t.apy}</div>
        </div>
      </div>
      <div style="font-size: 11px; color: var(--text2); margin-bottom: 10px; line-height: 1.4">${t.desc}</div>
      <button class="btn-secondary" style="width: 100%; margin-bottom: 0" onclick="openBotModal('${t.id}')">Create →</button>
    </div>`
  ).join("");
}

function tbDaysRunning(startedAt) {
  const days = Math.floor((Date.now() - startedAt) / (1000 * 60 * 60 * 24));
  return Math.max(days, 0);
}

function renderBots() {
  const bots = tbLoadBots();
  const list = document.getElementById("tb-list");
  const empty = document.getElementById("tb-empty");
  if (!list) return;

  if (bots.length === 0) {
    list.innerHTML = "";
    if (empty) empty.style.display = "block";
  } else {
    if (empty) empty.style.display = "none";
    list.innerHTML = bots
      .map((b) => {
        const template = BOT_TEMPLATES.find((t) => t.id === b.templateId) || BOT_TEMPLATES[0];
        const days = tbDaysRunning(b.startedAt);
        const pnlColor = b.pnl >= 0 ? "var(--green)" : "var(--red)";
        const pnlPct = b.invested > 0 ? (b.pnl / b.invested) * 100 : 0;
        return `
        <div class="card" style="padding: 14px">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 10px; flex-wrap: wrap">
            <div style="display: flex; gap: 10px; align-items: center">
              <div style="font-size: 22px">${template.icon}</div>
              <div>
                <div style="font-weight: 800; font-size: 13px; display: flex; align-items: center; gap: 6px">
                  ${b.pair.split("/")[0]} ${template.name}
                  <span style="font-size: 10px; font-weight: 700; color: var(--green); background: rgba(14,203,129,0.1); border-radius: 5px; padding: 2px 6px">● ${b.status === "running" ? "Running" : "Paused"}</span>
                </div>
                <div style="font-size: 11px; color: var(--text3); margin-top: 2px">${b.pair} · ${b.trades} trades · ${days} day${days === 1 ? "" : "s"} running</div>
              </div>
            </div>
            <div style="display: flex; align-items: center; gap: 14px">
              <div style="text-align: right">
                <div style="font-size: 11px; color: var(--text2)">Invested</div>
                <div style="font-size: 13px; font-weight: 800">${tbFormatUsd(b.invested)}</div>
              </div>
              <div style="text-align: right">
                <div style="font-size: 11px; color: var(--text2)">PnL</div>
                <div style="font-size: 13px; font-weight: 800; color: ${pnlColor}">${b.pnl >= 0 ? "+" : ""}${tbFormatUsd(b.pnl)} (${pnlPct >= 0 ? "+" : ""}${pnlPct.toFixed(2)}%)</div>
              </div>
              <div style="display: flex; gap: 6px">
                <button title="${b.status === "running" ? "Pause" : "Resume"}" onclick="toggleBotStatus('${b.id}')" style="background: var(--bg3); border: 1px solid var(--border); border-radius: 6px; width: 30px; height: 30px; cursor: pointer; color: var(--text)">${b.status === "running" ? "⏸" : "▶"}</button>
                <button title="Delete" onclick="deleteBot('${b.id}')" style="background: var(--bg3); border: 1px solid var(--border); border-radius: 6px; width: 30px; height: 30px; cursor: pointer; color: var(--red)">🗑</button>
              </div>
            </div>
          </div>
        </div>`;
      })
      .join("");
  }

  const totalInvested = bots.reduce((s, b) => s + b.invested, 0);
  const totalPnl = bots.reduce((s, b) => s + b.pnl, 0);
  const activeCount = bots.filter((b) => b.status === "running").length;

  const invEl = document.getElementById("tb-total-invested");
  const pnlEl = document.getElementById("tb-total-pnl");
  const activeEl = document.getElementById("tb-active-count");
  if (invEl) invEl.textContent = tbFormatUsd(totalInvested);
  if (pnlEl) {
    pnlEl.textContent = (totalPnl >= 0 ? "+" : "") + tbFormatUsd(totalPnl);
    pnlEl.style.color = totalPnl >= 0 ? "var(--green)" : "var(--red)";
  }
  if (activeEl) activeEl.textContent = activeCount;
}

function openBotModal(templateId) {
  tbSelectedTemplateId = templateId || BOT_TEMPLATES[0].id;
  const template = BOT_TEMPLATES.find((t) => t.id === tbSelectedTemplateId);
  document.getElementById("tb-modal-title").textContent = `Create ${template.name}`;
  document.getElementById("tb-modal-desc").textContent = `${template.icon} ${template.desc} Est. APY ${template.apy}.`;
  document.getElementById("tb-amount").value = "";
  document.getElementById("tb-modal-overlay").style.display = "flex";
}

function closeBotModal() {
  document.getElementById("tb-modal-overlay").style.display = "none";
}

function confirmCreateBot() {
  const template = BOT_TEMPLATES.find((t) => t.id === tbSelectedTemplateId) || BOT_TEMPLATES[0];
  const pair = document.getElementById("tb-pair").value;
  const amount = parseFloat(document.getElementById("tb-amount").value);

  if (!amount || amount < 10) {
    showToast("Enter at least 10 USDT", "error");
    return;
  }

  const bots = tbLoadBots();
  bots.unshift({
    id: "bot_" + Date.now(),
    templateId: template.id,
    pair,
    invested: amount,
    pnl: 0,
    trades: 0,
    status: "running",
    startedAt: Date.now(),
  });
  tbSaveBots(bots);
  closeBotModal();
  renderBots();
  showToast(`${template.name} created on ${pair}`, "success");
}

function toggleBotStatus(id) {
  const bots = tbLoadBots();
  const bot = bots.find((b) => b.id === id);
  if (!bot) return;
  bot.status = bot.status === "running" ? "paused" : "running";
  tbSaveBots(bots);
  renderBots();
  showToast(bot.status === "running" ? "Bot resumed" : "Bot paused", "info");
}

function deleteBot(id) {
  let bots = tbLoadBots();
  bots = bots.filter((b) => b.id !== id);
  tbSaveBots(bots);
  renderBots();
  showToast("Bot deleted", "info");
}

document.addEventListener("DOMContentLoaded", () => {
  renderTemplates();
  renderBots();
});
