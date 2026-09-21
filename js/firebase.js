/* =========================================================
   SnipeCraft Admin — Firebase bootstrap
   ========================================================= */

const firebaseConfig = {
  apiKey: "AIzaSyB4L76VzySbHjYROv0-4hYuG9XwjK2jRt4",
  authDomain: "snipecraft-pvp.firebaseapp.com",
  databaseURL: "https://snipecraft-pvp-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "snipecraft-pvp",
  storageBucket: "snipecraft-pvp.firebasestorage.app",
  messagingSenderId: "1000774779791",
  appId: "1:1000774779791:web:b912ccf72147026fe1c1fa"
};

(function () {
  "use strict";

  if (typeof firebase === "undefined") {
    console.error("[Admin] Firebase SDK not loaded.");
    window.firebaseReady = false;
    return;
  }

  try {
    firebase.initializeApp(firebaseConfig);
    window.db = firebase.database();
    if (typeof firebase.auth === "function") window.auth = firebase.auth();
    window.firebaseReady = true;
    console.log("[Admin] Firebase ready →", firebaseConfig.projectId);
  } catch (err) {
    console.error("[Admin] Firebase init failed:", err);
    window.firebaseReady = false;
  }
})();