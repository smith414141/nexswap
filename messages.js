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
  if (tab === "announcements") {
    loadAnnouncements();
    markAnnouncementsRead(auth.currentUser.uid);
  }
}

function loadSupportChat(user) {
  // Mark chat as read
  localStorage.setItem("chatLastRead_" + user.uid, Date.now());
  markDirectMessagesRead(user.uid);
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
      ${
        m.type === "image"
          ? `<img src="${m.image}" style="max-width:200px; border-radius:8px; cursor:pointer;" onclick="openImage('${m.image}')" />`
          : m.text
      }
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

function sendMsgImage() {
  const user = auth.currentUser;
  const input = document.getElementById("msg-image-input");
  const file = input.files[0];
  if (!file) return;
  if (file.size > 3 * 1024 * 1024) {
    showToast("Image too large. Max 3MB.", "error");
    return;
  }
  const reader = new FileReader();
  reader.onload = (e) => {
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
            type: "image",
            image: e.target.result,
            time: Date.now(),
          }),
        },
        { merge: true }
      )
      .then(() => {
        input.value = "";
        showToast("Image sent!", "success");
      })
      .catch((err) => showToast(err.message, "error"));
  };
  reader.readAsDataURL(file);
}
function loadAnnouncements() {
  const user = auth.currentUser;
  const container = document.getElementById("announcements-list");
  container.innerHTML = '<div class="empty-state">Loading...</div>';

  Promise.all([
    db.collection("announcements").orderBy("createdAt", "desc").limit(20).get(),
    db
      .collection("directMessages")
      .where("userId", "==", user.uid)
      .orderBy("createdAt", "desc")
      .get(),
  ])
    .then(([annSnap, dmSnap]) => {
      const items = [];

      annSnap.forEach((doc) => {
        const a = doc.data();
        items.push({ ...a, id: doc.id, isDirect: false });
      });

      dmSnap.forEach((doc) => {
        const d = doc.data();
        items.push({ ...d, id: doc.id, isDirect: true });
      });

      items.sort(
        (a, b) =>
          (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0)
      );

      if (items.length === 0) {
        container.innerHTML =
          '<div class="empty-state">No announcements yet</div>';
        return;
      }

      container.innerHTML = items
        .map(
          (a) => `
      <div class="card" style="margin-bottom:10px; ${
        !a.read && a.isDirect ? "border-left:3px solid var(--yellow);" : ""
      }">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
          <span style="font-weight:800; font-size:14px;">${a.title}</span>
          <span class="badge badge-${
            a.isDirect
              ? "yellow"
              : a.type === "warning"
              ? "yellow"
              : a.type === "success"
              ? "green"
              : "grey"
          }">${a.isDirect ? "Personal" : a.type || "info"}</span>
        </div>
        <p style="font-size:13px; color:var(--text2); line-height:1.6; margin-bottom:6px;">${
          a.body
        }</p>
        <p style="font-size:10px; color:var(--text3);">${formatAnnTime(
          a.createdAt
        )}</p>
      </div>
    `
        )
        .join("");
    })
    .catch((err) => {
      container.innerHTML =
        '<div class="empty-state">Error: ' + err.message + "</div>";
    });
}

function formatAnnTime(ts) {
  if (!ts || !ts.toDate) return "--";
  return ts.toDate().toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
function markDirectMessagesRead(userId) {
  db.collection("directMessages")
    .where("userId", "==", userId)
    .where("read", "==", false)
    .get()
    .then((snapshot) => {
      const batch = db.batch();
      snapshot.forEach((doc) => batch.update(doc.ref, { read: true }));
      return batch.commit();
    });
}

function markAnnouncementsRead(userId) {
  db.collection("announcements")
    .get()
    .then((snapshot) => {
      const allIds = snapshot.docs.map((d) => d.id);
      db.collection("announcementReads").doc(userId).set(
        {
          readIds: allIds,
        },
        { merge: true }
      );
    });
}
