import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyBKCSSMZE3ybpyP1MSegm4nu1GUGQt9oNc",
  authDomain: "terror-6f51e.firebaseapp.com",
  projectId: "terror-6f51e",
  storageBucket: "terror-6f51e.firebasestorage.app",
  messagingSenderId: "127086938530",
  appId: "1:127086938530:web:bcd051bcf8766e9b214afb",
  measurementId: "G-K3J8MKZQ94"
};

const app = initializeApp(firebaseConfig);
export const db  = getFirestore(app);
export const auth = getAuth(app);
