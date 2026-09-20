// src/firebase.js
// تهيئة الاتصال بـ Firebase (Admin SDK) - يوفر وصولاً إلى:
//   - Realtime Database (لتخزين بيانات المستخدمين والروابط)
//   - Authentication (للتحقق من هوية المستخدمين عبر الـ ID Token المُرسل من المتصفح)
// يعتمد على متغيرات البيئة التي سيتم إعدادها في Render، ولا يتم تخزين أي سر داخل الكود

const admin = require("firebase-admin");

function initFirebase() {
  if (admin.apps.length > 0) {
    return admin.app();
  }

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  // في متغيرات البيئة على Render، الأسطر الجديدة تُكتب كـ \n نصية، نحولها لأسطر حقيقية
  const privateKey = (process.env.FIREBASE_PRIVATE_KEY || "").replace(/\\n/g, "\n");
  const databaseURL = process.env.FIREBASE_DATABASE_URL;

  if (!projectId || !clientEmail || !privateKey || !databaseURL) {
    throw new Error(
      "متغيرات Firebase غير مكتملة. تأكد من ضبط FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY, FIREBASE_DATABASE_URL"
    );
  }

  admin.initializeApp({
    credential: admin.credential.cert({ projectId, clientEmail, privateKey }),
    databaseURL,
  });

  return admin.app();
}

function getDb() {
  initFirebase();
  return admin.database();
}

function getAuth() {
  initFirebase();
  return admin.auth();
}

module.exports = { initFirebase, getDb, getAuth };
