// public/js/firebase-client.js
// تهيئة Firebase في المتصفح - نستخدمه فقط لخدمة Authentication
// (لا يتم الاتصال بقاعدة البيانات مباشرة من المتصفح؛ كل شيء يمر عبر السيرفر لأمان أعلى)

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { firebaseConfig } from "./firebase-config.js";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

export {
  auth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
};
