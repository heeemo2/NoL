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

// ملفات الموقع الثابتة (الواجهة الأمامية)
app.use(express.static(path.join(__dirname, "public")));

// نقاط API
app.use("/api", apiRoutes);

// أي مسار غير معروف يرجع لصفحة البداية (اختياري، مفيد لو أضفت لاحقاً صفحات أخرى)
app.get("/health", (req, res) => res.json({ status: "ok" }));

app.listen(PORT, () => {
  console.log(`✅ NoL يعمل الآن على المنفذ ${PORT}`);
});
