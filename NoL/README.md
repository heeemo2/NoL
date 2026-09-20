# NoL

صفحة شخصية لتجميع روابط التواصل الاجتماعي (على غرار Linktree)، مبنية بـ **Node.js + Express**، تخزّن بياناتها في **Firebase Realtime Database**، وتُنشر على **Render**.

## هيكل المشروع

```
NoL/
├── server.js                 # نقطة تشغيل السيرفر
├── package.json
├── render.yaml                # إعدادات Render (اختياري - للنشر التلقائي)
├── firebase-database-rules.json
├── .env.example
├── src/
│   ├── firebase.js            # الاتصال بـ Firebase Admin SDK
│   └── routes/api.js          # نقاط الـ API (عامة + محمية للأدمن)
└── public/
    ├── index.html              # الصفحة العامة (NoL)
    ├── admin.html               # لوحة تحكم الأدمن
    ├── css/
    │   ├── style.css
    │   └── admin.css
    └── js/
        ├── app.js
        └── admin.js
```

## فكرة العمل

- السيرفر (Node/Express) هو الوحيد الذي يتحدث مع Firebase عبر **firebase-admin SDK**، وليس المتصفح مباشرة — لذلك بيانات اعتماد Firebase تبقى سرية ولا تظهر أبداً في كود الواجهة الأمامية.
- الصفحة الرئيسية `/` تعرض البروفايل والروابط بجلبها من `/api/data`.
- لوحة التحكم `/admin.html` محمية بكلمة مرور بسيطة (`ADMIN_PASSWORD`) تُرسل مع كل طلب تعديل عبر الهيدر `x-admin-password`.

---

## الخطوة 1: إعداد Firebase

1. اذهب إلى [Firebase Console](https://console.firebase.google.com) وأنشئ مشروعاً جديداً.
2. من القائمة الجانبية: **Build → Realtime Database → Create Database**. اختر أي موقع قريب، وابدأ في **Locked mode** (سنضبط القواعد يدوياً بالخطوة التالية).
3. بعد الإنشاء، انسخ **رابط قاعدة البيانات** (يظهر أعلى الصفحة، شكله مثل: `https://your-project-id-default-rtdb.firebaseio.com`) — هذا هو `FIREBASE_DATABASE_URL`.
4. في تبويب **Rules** داخل Realtime Database، الصق محتوى الملف `firebase-database-rules.json` المرفق (يمنع أي قراءة/كتابة مباشرة من المتصفح، لأن كل الاتصال يمر عبر السيرفر فقط):
   ```json
   {
     "rules": {
       ".read": false,
       ".write": false
     }
   }
   ```
5. اذهب إلى **Project Settings (⚙️) → Service Accounts → Generate New Private Key**. سيتم تنزيل ملف JSON — **لا تشاركه ولا ترفعه على GitHub أبداً**. منه ستأخذ:
   - `project_id` → `FIREBASE_PROJECT_ID`
   - `client_email` → `FIREBASE_CLIENT_EMAIL`
   - `private_key` → `FIREBASE_PRIVATE_KEY` (انسخه كاملاً بما فيه `-----BEGIN PRIVATE KEY-----`)

---

## الخطوة 2: التجربة محلياً (اختياري لكن مُستحسن)

```bash
cd NoL
npm install
cp .env.example .env
# افتح .env وعبّئ القيم الأربعة الخاصة بـ Firebase + ADMIN_PASSWORD
npm start
```

افتح `http://localhost:3000` للصفحة العامة، و`http://localhost:3000/admin.html` للوحة التحكم.

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

> تأكد أن ملف `.env` **غير مرفوع** (موجود ضمن `.gitignore` بالفعل)، وكذلك أي ملف Service Account JSON.

---

## الخطوة 4: النشر على Render

1. من [Render Dashboard](https://dashboard.render.com)، اضغط **New → Web Service**.
2. اربط حساب GitHub واختر مستودع `NoL`.
3. الإعدادات:
   - **Name**: `NoL` (سيصبح الرابط شيئاً مثل `nol.onrender.com` أو `nol-xxxx.onrender.com` حسب توفر الاسم)
   - **Runtime**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Free (أو أي خطة تناسبك)
4. في تبويب **Environment**، أضف المتغيرات التالية (من الخطوة 1):
   - `ADMIN_PASSWORD`
   - `FIREBASE_PROJECT_ID`
   - `FIREBASE_CLIENT_EMAIL`
   - `FIREBASE_PRIVATE_KEY` (الصق القيمة كاملة، بما فيها الأسطر — Render يتعامل معها بشكل صحيح)
   - `FIREBASE_DATABASE_URL`
5. اضغط **Create Web Service**. سينشر Render المشروع تلقائياً، وسيعطيك رابطاً نهائياً مثل:
   ```
   https://nol.onrender.com
   ```
6. لوحة التحكم تكون على:
   ```
   https://nol.onrender.com/admin.html
   ```

> ملاحظة: كل مرة تعمل فيها `git push` على الفرع الرئيسي، سيقوم Render بإعادة النشر تلقائياً (Auto-Deploy مفعّل افتراضياً).

---

## استخدام لوحة التحكم

1. افتح `/admin.html` وسجّل الدخول بكلمة `ADMIN_PASSWORD` التي ضبطتها.
2. عدّل الاسم، النبذة، ورابط الصورة الشخصية، ثم اضغط **حفظ البروفايل**.
3. أضف روابطك (ديسكورد، سناب شات، تيك توك...) من قسم **إضافة رابط جديد** — اختر الأيقونة المناسبة من القائمة.
4. يمكنك تعديل أو حذف أو إعادة ترتيب الروابط (بالأسهم ↑ ↓) في أي وقت، والتغييرات تنعكس فوراً على الصفحة العامة لأنها تُقرأ مباشرة من Firebase عبر السيرفر.

---

## ملاحظات أمنية

- لا تُخزَّن أي بيانات اعتماد لـ Firebase في كود الواجهة الأمامية — كل شيء يمر عبر السيرفر.
- كلمة مرور الأدمن تُرسل كهيدر HTTP مع كل طلب تعديل؛ لأن Render يوفر HTTPS تلقائياً، تبقى محمية أثناء النقل.
- لمشروع بحجم أكبر لاحقاً، يُفضّل استبدال نظام كلمة المرور البسيط بـ Firebase Authentication الكامل.
