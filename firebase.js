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
    window.location.href = "/index.html?tab=login";
    return;
  }

  // If user is authenticated and on a public/landing page, send them home.
  // This catches Google OAuth completions even if the popup .then() chain
  // fails or the Firestore write is slow.
  if (user && isPublicPage) {
    // Only redirect if email is verified OR it's a Google/OAuth sign-in
    // (Google accounts always have emailVerified: true, so this is safe).
    if (user.emailVerified) {
      window.location.href = "/home.html";
      return;
    }
    // If email not verified (manual registration that hasn't verified yet),
    // don't redirect here — let the registration flow handle it.
    return;
  }

  if (user && !user.emailVerified && !isPublicPage) {
    window.location.href = "/verify.html";
  }
});
