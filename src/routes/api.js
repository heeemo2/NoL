// src/routes/api.js
const express = require("express");
const { getDb, getAuth } = require("../firebase");
const { normalizeUsername, isValidUsername, isReserved } = require("../utils");

const router = express.Router();

// ---------- Middleware: التحقق من هوية المستخدم عبر Firebase ID Token ----------
async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;
    if (!token) {
      return res.status(401).json({ error: "الرجاء تسجيل الدخول" });
    }
    const decoded = await getAuth().verifyIdToken(token);
    req.uid = decoded.uid;
    req.email = decoded.email || "";
    next();
  } catch (err) {
    console.error("Auth error:", err.message);
    res.status(401).json({ error: "جلسة غير صالحة، الرجاء تسجيل الدخول مرة أخرى" });
  }
}

function linksObjToArray(linksObj) {
  return Object.entries(linksObj || {})
    .map(([id, val]) => ({ id, ...val }))
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
}

// =====================================================================
// حساب المستخدم: حجز/تغيير اسم المستخدم (username) بعد تسجيل الدخول
// =====================================================================

// التحقق من توفر اسم مستخدم (عام - لا يحتاج تسجيل دخول، يُستخدم أثناء التسجيل)
router.get("/username-available/:username", async (req, res) => {
  try {
    const username = normalizeUsername(req.params.username);
    if (!isValidUsername(username) || isReserved(username)) {
      return res.json({ available: false });
    }
    const db = getDb();
    const snap = await db.ref(`usernames/${username}`).once("value");
    res.json({ available: !snap.exists() });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "تعذر التحقق من اسم المستخدم" });
  }
});

// حجز اسم المستخدم لحساب مسجّل دخوله (يُستخدم بعد Sign up، ويمكن استخدامه لاحقاً لتغيير الاسم)
router.post("/account/claim-username", requireAuth, async (req, res) => {
  try {
    const username = normalizeUsername((req.body || {}).username);

    if (!isValidUsername(username)) {
      return res.status(400).json({
        error: "اسم المستخدم غير صالح. استخدم حروفاً إنجليزية صغيرة وأرقاماً و - أو _ فقط (3-20 حرف)",
      });
    }
    if (isReserved(username)) {
      return res.status(400).json({ error: "اسم المستخدم محجوز، الرجاء اختيار اسم آخر" });
    }

    const db = getDb();
    const uid = req.uid;

    // معاملة ذرية (transaction) لضمان عدم حجز نفس الاسم من شخصين في نفس الوقت
    const result = await db.ref(`usernames/${username}`).transaction((current) => {
      if (current === null) return uid; // متاح
      if (current === uid) return current; // نفس المستخدم يعيد حجز اسمه الحالي
      return undefined; // محجوز لمستخدم آخر -> إلغاء العملية
    });

    if (!result.committed || result.snapshot.val() !== uid) {
      return res.status(409).json({ error: "اسم المستخدم هذا مستخدم بالفعل" });
    }

    // إذا كان المستخدم يغيّر اسمه، حرّر الاسم القديم
    const profileSnap = await db.ref(`users/${uid}/profile`).once("value");
    const oldProfile = profileSnap.val() || {};
    if (oldProfile.username && oldProfile.username !== username) {
      await db.ref(`usernames/${oldProfile.username}`).remove();
    }

    await db.ref(`users/${uid}/profile`).update({
      username,
      name: oldProfile.name || (req.email ? req.email.split("@")[0] : username),
      bio: oldProfile.bio || "",
      avatarUrl: oldProfile.avatarUrl || "",
      email: req.email || oldProfile.email || "",
    });

    res.json({ ok: true, username });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "تعذر حجز اسم المستخدم" });
  }
});

// =====================================================================
// لوحة تحكم المستخدم (بيانات خاصة به فقط - محمية بالتوكن)
// =====================================================================

// جلب بيانات حسابي (البروفايل + الروابط)
router.get("/me", requireAuth, async (req, res) => {
  try {
    const db = getDb();
    const snap = await db.ref(`users/${req.uid}`).once("value");
    const data = snap.val() || {};
    res.json({
      profile: data.profile || null,
      links: linksObjToArray(data.links),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "تعذر جلب بياناتك" });
  }
});

// تحديث البروفايل الخاص بي (الاسم، النبذة، الصورة) - لا يغيّر اسم المستخدم
router.post("/me/profile", requireAuth, async (req, res) => {
  try {
    const { name, bio, avatarUrl } = req.body || {};
    const db = getDb();
    await db.ref(`users/${req.uid}/profile`).update({
      name: name || "",
      bio: bio || "",
      avatarUrl: avatarUrl || "",
    });
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "تعذر تحديث البروفايل" });
  }
});

// إضافة رابط جديد لحسابي
router.post("/me/links", requireAuth, async (req, res) => {
  try {
    const { label, url, icon, order } = req.body || {};
    if (!label || !url) {
      return res.status(400).json({ error: "الاسم والرابط مطلوبان" });
    }
    const db = getDb();
    const newRef = db.ref(`users/${req.uid}/links`).push();
    await newRef.set({
      label,
      url,
      icon: icon || "link",
      order: typeof order === "number" ? order : Date.now(),
    });
    res.json({ ok: true, id: newRef.key });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "تعذر إضافة الرابط" });
  }
});

// تعديل رابط من روابطي
router.put("/me/links/:id", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { label, url, icon, order } = req.body || {};
    const db = getDb();
    const updates = {};
    if (label !== undefined) updates.label = label;
    if (url !== undefined) updates.url = url;
    if (icon !== undefined) updates.icon = icon;
    if (order !== undefined) updates.order = order;
    await db.ref(`users/${req.uid}/links/${id}`).update(updates);
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "تعذر تعديل الرابط" });
  }
});

// حذف رابط من روابطي
router.delete("/me/links/:id", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const db = getDb();
    await db.ref(`users/${req.uid}/links/${id}`).remove();
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "تعذر حذف الرابط" });
  }
});

// =====================================================================
// الصفحة العامة: عرض صفحة أي مستخدم حسب اسمه (عام - بدون تسجيل دخول)
// =====================================================================

router.get("/public/:username", async (req, res) => {
  try {
    const username = normalizeUsername(req.params.username);
    const db = getDb();

    const uidSnap = await db.ref(`usernames/${username}`).once("value");
    if (!uidSnap.exists()) {
      return res.status(404).json({ error: "لا يوجد مستخدم بهذا الاسم" });
    }
    const uid = uidSnap.val();

    const snap = await db.ref(`users/${uid}`).once("value");
    const data = snap.val() || {};
    const profile = data.profile || { name: username, bio: "", avatarUrl: "", username };

    res.json({
      profile: {
        name: profile.name || username,
        bio: profile.bio || "",
        avatarUrl: profile.avatarUrl || "",
        username: profile.username || username,
      },
      links: linksObjToArray(data.links),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "تعذر جلب بيانات الصفحة" });
  }
});

module.exports = router;
