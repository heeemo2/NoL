// server.js
require("dotenv").config();
const path = require("path");
const express = require("express");
const cors = require("cors");
const apiRoutes = require("./src/routes/api");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// ملفات الموقع الثابتة (الواجهة الأمامية: landing, login, signup, admin, css, js)
app.use(express.static(path.join(__dirname, "public")));

// نقاط الـ API
app.use("/api", apiRoutes);

app.get("/health", (req, res) => res.json({ status: "ok" }));

// طلبات شائعة يجب تجاهلها بدل معاملتها كاسم مستخدم
const IGNORED_PATHS = new Set([
  "favicon.ico",
  "robots.txt",
  "sitemap.xml",
  "apple-touch-icon.png",
  "manifest.json",
]);

// رابط ديناميكي مخصص لكل مستخدم: domain.com/username
// يُمرَّر أي مسار لم يُطابق ملفاً ثابتاً أو مساراً في /api إلى صفحة العرض العامة (profile.html)
// وتقوم صفحة العرض بجلب بيانات المستخدم عبر GET /api/public/:username باستخدام JavaScript
app.get("/:username", (req, res, next) => {
  const { username } = req.params;
  if (IGNORED_PATHS.has(username) || username.includes(".")) {
    return next();
  }
  res.sendFile(path.join(__dirname, "public", "profile.html"));
});

app.use((req, res) => {
  res.status(404).send("الصفحة غير موجودة");
});

app.listen(PORT, () => {
  console.log(`✅ NoL يعمل الآن على المنفذ ${PORT}`);
});
