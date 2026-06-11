// Firebase config
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID",
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// Auth state — runs on every page
auth.onAuthStateChanged((user) => {
  const page = window.location.pathname;
  const publicPages = ["/index.html", "/"];
  const isPublicPage = publicPages.some((p) => page.endsWith(p));

  if (!user && !isPublicPage) {
    window.location.href = "/index.html";
  }

  if (user && !user.emailVerified && !isPublicPage) {
    window.location.href = "/verify.html";
  }
});
