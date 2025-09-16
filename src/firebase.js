// Firebase v9 modular SDK
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyC_MvMeGoP7EtwJ0ABfGozoAK1P2FhJZSE",
  authDomain: "voting-sck.firebaseapp.com",
  projectId: "voting-sck",
  storageBucket: "voting-sck.firebasestorage.app",
  messagingSenderId: "391531841163",
  appId: "1:391531841163:web:0e3c51d1157d46383ff68e",
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
