// src/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {

  apiKey: "",

  authDomain: "rhythmgameanalytics.firebaseapp.com",

  projectId: "rhythmgameanalytics",

  storageBucket: "rhythmgameanalytics.firebasestorage.app",

  messagingSenderId: "",

  appId: "",

  measurementId: ""

};



const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();
export const db = getFirestore(app);
