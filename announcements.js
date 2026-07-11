// announcements.js
let currentUid = null;
let readIds = [];

auth.onAuthStateChanged((user) => {
  if (!user) return;
  currentUid = user.uid;
  db.collection("announcementReads")
    .doc(currentUid)
    .get()
    .then((doc) => {
      readIds = (doc.exists && doc.data().read) || [];
      listenAnnouncements();
    });
});

function listenAnnouncements() {
  db.collection("announcements")
    .orderBy("createdAt", "desc")
    .onSnapshot(
      (snap) => {
        const list = document.getElementById("ann-list");
        const empty = document.getElementById("ann-empty");
        if (snap.empty) {
          list.innerHTML = "";
          empty.style.display = "block";
          return;
        }
        empty.style.display = "none";
        list.innerHTML = snap.docs
          .map((doc) => {
            const a = doc.data();
            const isRead = readIds.includes(doc.id);
            const date = a.createdAt
              ? a.createdAt.toDate().toLocaleDateString()
              : "";
            return `
          <div class="card" style="margin-bottom:10px;${
            isRead ? "opacity:0.65;" : ""
          }cursor:pointer" onclick="markRead('${doc.id}')">
            <div style="display:flex;justify-content:space-between;align-items:center">
              <strong>${a.title || "Announcement"}</strong>
              ${isRead ? "" : '<span class="badge badge-yellow">New</span>'}
            </div>
            <p style="font-size:12px;color:var(--text2);margin-top:6px">${
              a.body || ""
            }</p>
            <div style="font-size:11px;color:var(--text3);margin-top:6px">${date}</div>
          </div>`;
          })
          .join("");
      },
      () => {
        document.getElementById("ann-list").innerHTML =
          '<div class="empty-state">Could not load announcements.</div>';
      }
    );
}

function markRead(id) {
  if (readIds.includes(id)) return;
  readIds.push(id);
  db.collection("announcementReads")
    .doc(currentUid)
    .set({ read: readIds }, { merge: true });
}
