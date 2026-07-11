// security-center.js
function forgotPasswordRedirect() {
  const user = auth.currentUser;
  if (!user || !user.email) {
    showToast("Could not find your account email", "error");
    return;
  }
  auth
    .sendPasswordResetEmail(user.email)
    .then(() =>
      showToast("Password reset link sent to " + user.email, "success")
    )
    .catch((err) => showToast(err.message, "error"));
}
