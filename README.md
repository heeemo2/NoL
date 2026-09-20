# NoL

منصة لإنشاء صفحات شخصية لتجميع روابط التواصل الاجتماعي (على غرار Linktree) — **يدعم عدداً غير محدود من المستخدمين**، كل مستخدم يسجّل حسابه الخاص ويحصل على صفحة مستقلة بالشكل:

```
https://your-app.onrender.com/username
```

مبني بـ **Node.js + Express**، مع **Firebase Authentication** لتسجيل الدخول/الحسابات، و**Firebase Realtime Database** لتخزين البيانات، ويُنشر على **Render**.

## هيكل المشروع

```
NoL/
├── server.js                   # نقطة تشغيل السيرفر + توجيه روابط المستخدمين /:username
├── package.json
├── render.yaml
├── firebase-database-rules.json
├── .env.example
├── src/
│   ├── firebase.js              # Admin SDK: Database + Auth
│   ├── utils.js                  # التحقق من صحة أسماء المستخدمين
│   └── routes/api.js            # نقاط الـ API (عامة + محمية بالتوكن)
└── public/
    ├── index.html                # صفحة هبوط (روابط لتسجيل الدخول/إنشاء حساب)
    ├── signup.html + login.html  # صفحات التسجيل والدخول (Firebase Auth)
    ├── admin.html                 # لوحة تحكم كل مستخدم (بياناته فقط)
    ├── profile.html               # قالب الصفحة العامة لأي مستخدم (domain.com/username)
    ├── css/ (style.css, auth.css, admin.css)
    └── js/
        ├── firebase-config.js     # إعدادات Firebase العامة (Client - غير سرية)
        ├── firebase-client.js     # تهيئة Firebase Auth في المتصفح
        ├── signup.js / login.js   # منطق التسجيل والدخول
        ├── admin.js                # منطق لوحة التحكم
        └── app.js                  # عرض الصفحة العامة لأي مستخدم
```

## كيف يعمل نظام تعدد المستخدمين

- كل مستخدم يسجّل حساباً عبر **Firebase Authentication** (بريد إلكتروني + كلمة مرور).
- بعد التسجيل، يحجز **اسم مستخدم فريد** (username) يصبح رابط صفحته: `domain.com/username`.
- بيانات كل مستخدم (البروفايل + الروابط) مخزّنة في Realtime Database تحت مساره الخاص:
  ```
  users/{uid}/profile   -> { name, bio, avatarUrl, username, email }
  users/{uid}/links/{id} -> { label, url, icon, order }
  usernames/{username}  -> uid   (فهرس لربط اسم المستخدم بحسابه)
  ```
- **لوحة التحكم** (`/admin.html`) محمية: كل طلب تعديل يُرسل مع `Firebase ID Token` في الهيدر، والسيرفر يتحقق منه عبر `firebase-admin` ويحدد `uid` صاحب الطلب — فلا يمكن لأي مستخدم رؤية أو تعديل بيانات غيره.
- **الصفحة العامة** لأي مستخدم لا تحتاج تسجيل دخول: `GET /api/public/:username` تعيد بروفايله وروابطه فقط.
- المتصفح **لا يتصل بقاعدة البيانات مباشرة أبداً** — فقط بخدمة Auth (لتسجيل الدخول)، وكل قراءة/كتابة للبيانات تمر عبر السيرفر. لذلك قواعد Realtime Database تبقى مقفلة بالكامل.

---

## الخطوة 1: إعداد Firebase

### أ) تفعيل Authentication
1. في [Firebase Console](https://console.firebase.google.com)، افتح مشروعك (أو أنشئ مشروعاً جديداً).
2. **Build → Authentication → Get Started**.
3. من تبويب **Sign-in method**، فعّل **Email/Password**.

### ب) إعداد Realtime Database
1. **Build → Realtime Database → Create Database**، اختر موقعاً قريباً، وابدأ بوضع **Locked mode**.
2. انسخ رابط قاعدة البيانات (شكله: `https://your-project-id-default-rtdb.firebaseio.com`) — هذا `FIREBASE_DATABASE_URL`.
3. في تبويب **Rules**، الصق محتوى `firebase-database-rules.json` المرفق (يمنع أي وصول مباشر من المتصفح، لأن كل شيء يمر عبر السيرفر):
   ```json
   { "rules": { ".read": false, ".write": false } }
   ```

### ج) بيانات اعتماد السيرفر (Service Account)
1. **⚙️ Project Settings → Service Accounts → Generate New Private Key** — سيُنزَّل ملف JSON. **لا تشاركه ولا ترفعه على GitHub**. منه:
   - `project_id` → `FIREBASE_PROJECT_ID`
   - `client_email` → `FIREBASE_CLIENT_EMAIL`
   - `private_key` → `FIREBASE_PRIVATE_KEY`

### د) إعدادات تطبيق الويب (للواجهة الأمامية - تسجيل الدخول)
1. **⚙️ Project Settings → General → Your apps → أضف تطبيق ويب (</>)** (إن لم يكن موجوداً).
2. انسخ القيم `apiKey` و `authDomain` و `projectId` و `appId` من كائن `firebaseConfig` الظاهر.
3. افتح `public/js/firebase-config.js` وضع القيم بدلاً من النصوص التوضيحية:
   ```js
   export const firebaseConfig = {
     apiKey: "AIzaSy...",
     authDomain: "your-project-id.firebaseapp.com",
     projectId: "your-project-id",
     appId: "1:xxxx:web:xxxx",
   };
   ```
   > هذه القيم **ليست سرية** (على عكس Service Account key) ومن الطبيعي أن تكون ظاهرة في كود المتصفح — هذا هو المعتاد في جميع تطبيقات Firebase.
4. مهم: في Firebase Console → Authentication → Settings → **Authorized domains**، أضف نطاق موقعك على Render بعد نشره (مثل `nol.onrender.com`) حتى يعمل تسجيل الدخول من هناك.

---

## الخطوة 2: التجربة محلياً

```bash
cd NoL
npm install
cp .env.example .env
# افتح .env وعبّئ القيم الأربعة الخاصة بـ Firebase (من الخطوتين أ/ج أعلاه)
# وتأكد أنك عدّلت public/js/firebase-config.js (من الخطوة د)
npm start
```

- الصفحة الرئيسية: `http://localhost:3000`
- إنشاء حساب: `http://localhost:3000/signup.html`
- تسجيل الدخول: `http://localhost:3000/login.html`
- لوحة التحكم: `http://localhost:3000/admin.html`
- صفحتك العامة بعد حجز اسم المستخدم: `http://localhost:3000/اسمك`

---

## الخطوة 3: رفع المشروع على GitHub

```bash
cd NoL
git init
git add .
git commit -m "Initial commit - NoL"
git branch -M main
git remote add origin https://github.com/USERNAME/NoL.git
git push -u origin main
```

> ملف `.env` وأي ملف Service Account JSON غير مرفوعين تلقائياً (موجودان ضمن `.gitignore`).

---

## الخطوة 4: النشر على Render

1. [Render Dashboard](https://dashboard.render.com) → **New → Web Service** → اربط مستودع `NoL`.
2. الإعدادات:
   - **Name**: `NoL`
   - **Runtime**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
3. في تبويب **Environment**، أضف:
   - `FIREBASE_PROJECT_ID`
   - `FIREBASE_CLIENT_EMAIL`
   - `FIREBASE_PRIVATE_KEY`
   - `FIREBASE_DATABASE_URL`
4. اضغط **Create Web Service**. سيعطيك Render رابطاً نهائياً مثل:
   ```
   https://nol.onrender.com
   ```
5. **مهم**: أضف هذا الرابط إلى Firebase Console → Authentication → Settings → Authorized domains (وإلا سيفشل تسجيل الدخول/التسجيل من الموقع المنشور).

بعد ذلك، أي مستخدم يزور الموقع يمكنه:
- إنشاء حساب من `/signup.html`
- حجز اسم مستخدم فريد
- الحصول على صفحته الخاصة: `https://nol.onrender.com/اسمه`
- إدارتها من `/admin.html` دون أن يرى أو يؤثر على بيانات أي مستخدم آخر

---

## ملاحظات أمنية

- بيانات اعتماد السيرفر (`FIREBASE_PRIVATE_KEY` وغيرها) لا تظهر أبداً في المتصفح.
- كل طلب تعديل في لوحة التحكم يحمل Firebase ID Token يتحقق منه السيرفر، ويُقيَّد بـ `uid` صاحب الحساب فقط.
- قواعد Realtime Database مقفلة بالكامل (`.read/.write: false`) لأن كل الوصول يمر عبر السيرفر حصراً.
- أسماء المستخدمين محدودة بـ 3-20 حرفاً إنجليزياً صغيراً/رقماً/`-`/`_`، مع قائمة أسماء محجوزة (مثل `admin`, `api`, `login`) لمنع تعارضها مع مسارات الموقع.
