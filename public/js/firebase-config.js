// public/js/firebase-config.js
// إعدادات Firebase الخاصة بالواجهة الأمامية (Client SDK) — تُستخدم فقط لتسجيل الدخول/التسجيل
// هذه القيم ليست سرية (على عكس مفتاح Service Account في السيرفر)، ويمكن أن تكون ظاهرة في المتصفح بأمان
// احصل عليها من: Firebase Console → Project Settings → General → Your apps → Web app (</>) 

export const firebaseConfig = {
  apiKey: "ضع_API_KEY_هنا",
  authDomain: "your-project-id.firebaseapp.com",
  projectId: "your-project-id",
  appId: "ضع_APP_ID_هنا",
};
