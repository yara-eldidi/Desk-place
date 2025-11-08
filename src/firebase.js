import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyA0CnQhp8sn-uj0sfdm4DScav3v3AgvWBc",
  authDomain: "book-office-e106a.firebaseapp.com",
  projectId: "book-office-e106a",
  storageBucket: "book-office-e106a.appspot.com",
  messagingSenderId: "447170248919",
  appId: "1:447170248919:web:38191489a32239c5653092",
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
export const auth = getAuth(app);
