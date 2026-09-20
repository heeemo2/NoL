// src/firebase.js
// تهيئة الاتصال بـ Firebase Realtime Database باستخدام firebase-admin
// يعتمد على متغيرات البيئة (Environment Variables) التي سيتم إعدادها في Render
// لا يتم تخزين أي بيانات سرية داخل الكود مباشرة، حفاظاً على الأمان

const admin = require("firebase-admin");

function initFirebase() {
  if (admin.apps.length > 0) {
    return admin.app();
  }

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  // في متغيرات البيئة على Render، الأسطر الجديدة تُكتب كـ \n نصية
  // لذلك نستبدلها بأسطر جديدة حقيقية هنا
  const privateKey = (process.env.FIREBASE_PRIVATE_KEY || "").replace(/\\n/g, "\n");
  const databaseURL = process.env.FIREBASE_DATABASE_URL;

  if (!projectId || !clientEmail || !privateKey || !databaseURL) {
    throw new Error(
      "متغيرات Firebase غير مكتملة. تأكد من ضبط FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY, FIREBASE_DATABASE_URL"
    );
  }

  admin.initializeApp({
    credential: admin.credential.cert({
      projectId,
      clientEmail,
      privateKey,
    }),
    databaseURL,
  });

  return admin.app();
}

function getDb() {
  initFirebase();
  return admin.database();
}

module.exports = { initFirebase, getDb };
