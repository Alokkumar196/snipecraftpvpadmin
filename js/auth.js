/* =========================================================
   SnipeCraft Admin — Login page
   ========================================================= */
(function () {
  "use strict";

  const $ = (s) => document.querySelector(s);
  const errEl = $("#loginError");
  const btn = $("#loginBtn");

  function setError(msg) { errEl.textContent = msg || ""; }
  function setLoading(on) {
    btn.disabled = on;
    btn.setAttribute("aria-busy", on ? "true" : "false");
    btn.querySelector(".btn__label").textContent = on ? "Signing in…" : "Sign In";
  }

  // If Firebase failed to load
  if (!window.firebaseReady) {
    setError("Firebase is not configured. Edit js/firebase.js.");
    btn.disabled = true;
    return;
  }

  // If already signed in → verify admin and redirect
  window.auth.onAuthStateChanged(async (user) => {
    if (!user) return;
    try {
      const snap = await window.db.ref("admins/" + user.uid).once("value");
      const v = snap.val();
      if (v && v.status === "active") {
        window.location.replace("dashboard.html");
      } else {
        await window.auth.signOut();
        setError("This account is not an active admin.");
      }
    } catch (_) {
      setError("Could not verify admin status. Try again.");
    }
  });

  $("#loginForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    setError("");

    const email = $("#loginEmail").value.trim();
    const password = $("#loginPassword").value;

    if (!email) { setError("Email is required."); $("#loginEmail").focus(); return; }
    if (!password) { setError("Password is required."); $("#loginPassword").focus(); return; }

    setLoading(true);
    try {
      await window.auth.signInWithEmailAndPassword(email, password);
      // onAuthStateChanged above handles the redirect
    } catch (err) {
      const map = {
        "auth/invalid-email":       "Invalid email address.",
        "auth/user-not-found":      "No account with that email.",
        "auth/wrong-password":      "Incorrect password.",
        "auth/invalid-credential":  "Invalid credentials.",
        "auth/too-many-requests":   "Too many attempts. Try again later.",
        "auth/network-request-failed": "Network error. Check your connection.",
        "auth/user-disabled":       "This account has been disabled."
      };
      setError(map[err.code] || "Sign in failed. Please try again.");
    } finally {
      setLoading(false);
    }
  });
})();