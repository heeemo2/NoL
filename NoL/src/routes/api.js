// src/routes/api.js
const express = require("express");
const { getDb } = require("../firebase");

const router = express.Router();

// ---------- Middleware للتحقق من صلاحية الأدمن ----------
function requireAdmin(req, res, next) {
  const password = req.headers["x-admin-password"];
  if (!process.env.ADMIN_PASSWORD) {
    return res.status(500).json({ error: "لم يتم ضبط كلمة مرور الأدمن على السيرفر (ADMIN_PASSWORD)" });
  }
  if (!password || password !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ error: "غير مصرح - كلمة المرور غير صحيحة" });
  }
  next();
}

// ---------- تسجيل دخول الأدمن (للتحقق فقط من صحة كلمة المرور) ----------
router.post("/admin/login", (req, res) => {
  const { password } = req.body || {};
  if (!process.env.ADMIN_PASSWORD) {
    return res.status(500).json({ error: "لم يتم ضبط كلمة مرور الأدمن على السيرفر" });
  }
  if (password === process.env.ADMIN_PASSWORD) {
    return res.json({ ok: true });
  }
  return res.status(401).json({ error: "كلمة المرور غير صحيحة" });
});

// ---------- جلب بيانات الصفحة العامة (البروفايل + الروابط) ----------
router.get("/data", async (req, res) => {
  try {
    const db = getDb();
    const snapshot = await db.ref("/").once("value");
    const raw = snapshot.val() || {};

    const profile = raw.profile || {
      name: "NoL",
      bio: "",
      avatarUrl: "",
    };

    const linksObj = raw.links || {};
    const links = Object.entries(linksObj)
      .map(([id, val]) => ({ id, ...val }))
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

    res.json({ profile, links });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "تعذر جلب البيانات من قاعدة البيانات" });
  }
});

// ---------- تحديث بيانات البروفايل (محمي) ----------
router.post("/admin/profile", requireAdmin, async (req, res) => {
  try {
    const { name, bio, avatarUrl } = req.body || {};
    const db = getDb();
    await db.ref("/profile").set({
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

// ---------- إضافة رابط جديد (محمي) ----------
router.post("/admin/links", requireAdmin, async (req, res) => {
  try {
    const { label, url, icon, order } = req.body || {};
    if (!label || !url) {
      return res.status(400).json({ error: "الاسم والرابط مطلوبان" });
    }
    const db = getDb();
    const newRef = db.ref("/links").push();
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

// ---------- تعديل رابط (محمي) ----------
router.put("/admin/links/:id", requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { label, url, icon, order } = req.body || {};
    const db = getDb();
    const updates = {};
    if (label !== undefined) updates.label = label;
    if (url !== undefined) updates.url = url;
    if (icon !== undefined) updates.icon = icon;
    if (order !== undefined) updates.order = order;
    await db.ref(`/links/${id}`).update(updates);
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "تعذر تعديل الرابط" });
  }
});

// ---------- حذف رابط (محمي) ----------
router.delete("/admin/links/:id", requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const db = getDb();
    await db.ref(`/links/${id}`).remove();
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "تعذر حذف الرابط" });
  }
});

module.exports = router;
