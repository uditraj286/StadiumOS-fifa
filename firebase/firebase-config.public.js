/* ═══════════════════════════════════════════════════════════════════════════
   PUBLIC Firebase web config  ‹‹ EDIT THIS FILE TO GO LIVE ››

   These values are NOT secret — Firebase web config is a public client
   identifier, safe to ship to the browser. Access is controlled by
   firestore.rules, not by hiding these keys. (The real secret is the Admin
   service-account key, which lives only in the server env — see SETUP-FIREBASE.md.)

   HOW TO FILL IN:
   Firebase Console → Project settings → General → "Your apps" → Web app →
   "SDK setup and configuration" → Config. Copy each value below.

   Until real values are pasted, the app runs in DEMO MODE: the local simulated
   `S` state still drives every view, and Firestore simply stays dormant — no
   errors, no crashes. Paste your config + reload to switch to the live DB.
   ═══════════════════════════════════════════════════════════════════════════ */

window.FIREBASE_CONFIG = {
  apiKey: 'AIzaSyC8BKGPbp26NGUyPd8RS-SOi6hZ31u7ssA',
  authDomain: 'stadiumos-ai.firebaseapp.com',
  projectId: 'stadiumos-ai',
  storageBucket: 'stadiumos-ai.firebasestorage.app',
  messagingSenderId: '850743572942',
  appId: '1:850743572942:web:e14bf105610b97c320539f',
};
