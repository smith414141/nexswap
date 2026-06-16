let msgSupportUnsub = null;

auth.onAuthStateChanged((user) => {
  if (!user || !user.emailVerified) return;
  loadSupportChat(user);
});

function switchMsgTab(tab, btn) {
  document
    .querySelectorAll(".tabs .tab")
    .forEach((t) => t.classList.remove("active"));
  btn.classList.add("active");
  document.getElementById("msg-support").style.display =
    tab === "support" ? "block" : "none";
  document.getElementById("msg-announcements").style.display =
    tab === "announcements" ? "block" : "none";
  if (tab === "announcements") loadAnnouncements();
}

function loadSupportChat(user) {
  const chatId = "support_" + user.uid;
  if (msgSupportUnsub) msgSupportUnsub();

  msgSupportUnsub = db
    .collection("chats")
    .doc(chatId)
    .onSnapshot((doc) => {
      const messages = doc.exists ? doc.data().messages || [] : [];
      renderSupportMessages(messages, user.uid);
    });
}

function renderSupportMessages(messages, uid) {
  const container = document.getElementById("msg-support-messages");
  if (messages.length === 0) {
    container.innerHTML = `
      <div style="text-align:center; padding:40px 16px; color:var(--text3);">
        <div style="font-size:40px; margin-bottom:10px;">💬</div>
        <div style="font-size:13px; line-height:1.6;">Need help? Send us a message and our support team will respond shortly.</div>
      </div>
    `;
    return;
  }
  container.innerHTML = messages
    .map(
      (m) => `
    <div class="chat-msg ${m.sender === uid ? "mine" : "theirs"}">
      ${
        m.sender !== uid
          ? `<div style="font-size:10px; opacity:0.6; margin-bottom:2px;">Support</div>`
          : ""
      }
      ${m.text}
    </div>
  `
    )
    .join("");
  container.scrollTop = container.scrollHeight;
}

function sendMsgSupport() {
  const user = auth.currentUser;
  const input = document.getElementById("msg-support-input");
  const text = input.value.trim();
  if (!text) return;

  const chatId = "support_" + user.uid;
  db.collection("chats")
    .doc(chatId)
    .set(
      {
        userId: user.uid,
        userEmail: user.email,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
        messages: firebase.firestore.FieldValue.arrayUnion({
          sender: user.uid,
          text,
          time: Date.now(),
        }),
      },
      { merge: true }
    )
    .then(() => {
      input.value = "";
    })
    .catch((err) => showToast(err.message, "error"));
}

function loadAnnouncements() {
  const container = document.getElementById("announcements-list");
  container.innerHTML = '<div class="empty-state">Loading...</div>';

  db.collection("announcements")
    .orderBy("createdAt", "desc")
    .limit(20)
    .get()
    .then((snapshot) => {
      if (snapshot.empty) {
        container.innerHTML =
          '<div class="empty-state">No announcements yet</div>';
        return;
      }
      container.innerHTML = "";
      snapshot.forEach((doc) => {
        const a = doc.data();
        container.innerHTML += `
        <div class="card" style="margin-bottom:10px;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
            <span style="font-weight:800; font-size:14px;">${a.title}</span>
            <span class="badge badge-${
              a.type === "warning"
                ? "yellow"
                : a.type === "success"
                ? "green"
                : "grey"
            }">${a.type || "info"}</span>
          </div>
          <p style="font-size:13px; color:var(--text2); line-height:1.6; margin-bottom:6px;">${
            a.body
          }</p>
          <p style="font-size:10px; color:var(--text3);">${formatAnnTime(
            a.createdAt
          )}</p>
        </div>
      `;
      });
    })
    .catch(
      (err) =>
        (container.innerHTML =
          '<div class="empty-state">Error: ' + err.message + "</div>")
    );
}

function formatAnnTime(ts) {
  if (!ts || !ts.toDate) return "--";
  return ts
    .toDate()
    .toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
}
