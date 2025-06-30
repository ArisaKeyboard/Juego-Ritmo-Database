// src/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {

  apiKey: "AIzaSyBUQfvg9O5DoOH5ILTXQn7JlN74fgPW1hE",

  authDomain: "rhythmgameanalytics.firebaseapp.com",

  projectId: "rhythmgameanalytics",

  storageBucket: "rhythmgameanalytics.firebasestorage.app",

  messagingSenderId: "328811286465",

  appId: "1:328811286465:web:15bbf75533652a2d21e940",

  measurementId: "G-HR6XPFT1DS"

};



const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();
export const db = getFirestore(app);
