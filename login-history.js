// login-history.js
let currentUid = null;
let currentSessionId = null;

function parseDeviceInfo(userAgent) {
  // Parse device type from user agent
  const isMobile = /Mobile|Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
  const isTablet = /iPad|Tablet/i.test(userAgent) || (isMobile && /iPad|Android(?=.*Mobile)/i.test(userAgent));
  
  let device = "Desktop";
  let icon = "💻";
  
  if (isTablet) {
    device = "Tablet";
    icon = "📱";
  } else if (isMobile) {
    device = "Mobile";
    icon = "📱";
  }

  // Parse browser
  let browser = "Unknown";
  if (userAgent.includes("Chrome") && !userAgent.includes("Edg")) browser = "Chrome";
  else if (userAgent.includes("Firefox")) browser = "Firefox";
  else if (userAgent.includes("Safari") && !userAgent.includes("Chrome")) browser = "Safari";
  else if (userAgent.includes("Edg")) browser = "Edge";

  return { device, icon, browser };
}

function formatRelativeTime(timestamp) {
  if (!timestamp) return "";
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
}

function generateSessionId() {
  return "sess_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9);
}

function getSimulatedIp() {
  // Generate a plausible simulated IP
  return `${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}`;
}

function getSimulatedLocation() {
  const locations = [
    "New York, US", "Los Angeles, US", "Chicago, US", "Houston, US", "Phoenix, US",
    "London, UK", "Paris, FR", "Berlin, DE", "Tokyo, JP", "Singapore, SG",
    "Sydney, AU", "Toronto, CA", "Mumbai, IN", "São Paulo, BR", "Dubai, AE"
  ];
  return locations[Math.floor(Math.random() * locations.length)];
}

document.addEventListener("DOMContentLoaded", () => {
  auth.onAuthStateChanged(async (user) => {
    if (!user) return;
    currentUid = user.uid;
    await initLoginHistory();
  });
});

async function initLoginHistory() {
  // Create a session for this login
  await createCurrentSession();
  
  // Listen to sessions
  listenSessions();
  
  // Seed initial data if needed
  await seedInitialSessions();
}

async function createCurrentSession() {
  const deviceInfo = parseDeviceInfo(navigator.userAgent);
  const sessionId = generateSessionId();
  currentSessionId = sessionId;
  
  const sessionRef = db.collection("users").doc(currentUid).collection("sessions").doc(sessionId);
  
  // Mark all previous sessions as not current
  const prevSessions = await db.collection("users").doc(currentUid).collection("sessions")
    .where("isCurrent", "==", true)
    .get();
  
  const batch = db.batch();
  prevSessions.docs.forEach(doc => {
    batch.update(doc.ref, { isCurrent: false });
  });
  
  // Create new session
  batch.set(sessionRef, {
    device: deviceInfo.device,
    icon: deviceInfo.icon,
    browser: deviceInfo.browser,
    ip: getSimulatedIp(),
    location: getSimulatedLocation(),
    isCurrent: true,
    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
  });
  
  await batch.commit();
}

async function seedInitialSessions() {
  const sessionsRef = db.collection("users").doc(currentUid).collection("sessions");
  const snap = await sessionsRef.get();
  
  if (snap.empty) {
    // Seed some historical sessions
    const sessions = [
      { device: "Mobile", icon: "📱", browser: "Chrome", ip: "192.168.1.45", location: "New York, US", isCurrent: false, daysAgo: 1 },
      { device: "Desktop", icon: "💻", browser: "Firefox", ip: "10.0.0.12", location: "London, UK", isCurrent: false, daysAgo: 3 },
      { device: "Tablet", icon: "📱", browser: "Safari", ip: "172.16.0.8", location: "Tokyo, JP", isCurrent: false, daysAgo: 7 },
    ];
    
    const batch = db.batch();
    sessions.forEach(s => {
      const ref = sessionsRef.doc();
      batch.set(ref, {
        ...s,
        createdAt: firebase.firestore.Timestamp.fromDate(new Date(Date.now() - s.daysAgo * 86400000)),
      });
    });
    await batch.commit();
  }
}

function listenSessions() {
  db.collection("users").doc(currentUid).collection("sessions")
    .orderBy("createdAt", "desc")
    .onSnapshot((snap) => {
      const list = document.getElementById("sessions-list");
      const empty = document.getElementById("sessions-empty");
      
      if (snap.empty) {
        list.innerHTML = "";
        empty.style.display = "block";
        return;
      }
      
      empty.style.display = "none";
      list.innerHTML = snap.docs.map(doc => renderSession(doc)).join("");
    });
}

function renderSession(doc) {
  const s = doc.data();
  const isCurrent = s.isCurrent === true;
  const timeAgo = formatRelativeTime(s.createdAt);
  const locationLine = `${s.location || "Unknown"} • ${s.ip || "0.0.0.0"} • ${timeAgo}`;
  
  return `
    <div class="card" style="padding: 16px; display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; flex-wrap: wrap;" data-session-id="${doc.id}">
      <div style="display: flex; gap: 12px; align-items: flex-start; flex: 1; min-width: 0;">
        <span style="font-size: 24px; flex-shrink: 0;">${s.icon || "💻"}</span>
        <div style="min-width: 0;">
          <div style="font-weight: 700; font-size: 14px; color: var(--text);">${s.device || "Unknown"} / ${s.browser || "Unknown"}</div>
          <div style="font-size: 11px; color: var(--text3); margin-top: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${locationLine}</div>
        </div>
      </div>
      <div style="display: flex; align-items: center; gap: 8px; flex-shrink: 0;">
        ${isCurrent ? `
          <span class="badge badge-green" style="font-size: 11px; display: flex; align-items: center; gap: 4px;">
            <span style="width: 6px; height: 6px; border-radius: 50%; background: var(--green);"></span> Current
          </span>
        ` : `
          <button class="btn-secondary" style="padding: 6px 12px; font-size: 11px; color: var(--red); border-color: var(--red);" onclick="revokeSession('${doc.id}')">
            Revoke
          </button>
        `}
      </div>
    </div>
  `;
}

async function revokeSession(sessionId) {
  if (!confirm("Revoke this session? You'll need to log in again from that device.")) return;
  
  try {
    await db.collection("users").doc(currentUid).collection("sessions").doc(sessionId).delete();
    showToast("Session revoked", "success");
  } catch (err) {
    showToast(err.message, "error");
  }
}

async function revokeAllSessions() {
  if (!confirm("Revoke ALL other sessions? You'll need to log in again on those devices.")) return;
  
  try {
    const snap = await db.collection("users").doc(currentUid).collection("sessions")
      .where("isCurrent", "==", false)
      .get();
    
    const batch = db.batch();
    snap.docs.forEach(doc => batch.delete(doc.ref));
    await batch.commit();
    
    showToast(`${snap.size} session(s) revoked`, "success");
  } catch (err) {
    showToast(err.message, "error");
  }
}