// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyCc3K5CNtzwVlYDf-YO-lsEFiX1py3tIw8",
  authDomain: "nexswap-90bc3.firebaseapp.com",
  projectId: "nexswap-90bc3",
  storageBucket: "nexswap-90bc3.firebasestorage.app",
  messagingSenderId: "454225870434",
  appId: "1:454225870434:web:1ee8c8ef51ed4ae1c95b3b",
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// Auth state — runs on every page
auth.onAuthStateChanged((user) => {
  const page = window.location.pathname;
  const publicPages = ["/index.html", "/", "/admin.html", "/landing.html"];
  const isPublicPage = publicPages.some((p) => page.endsWith(p));

  if (!user && !isPublicPage) {
    window.location.href = "/index.html";
  }

  if (user && !user.emailVerified && !isPublicPage) {
    window.location.href = "/verify.html";
  }
});
