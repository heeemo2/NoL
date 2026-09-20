// public/js/admin.js
// لوحة تحكم كل مستخدم: تتطلب تسجيل دخول عبر Firebase Auth، وتعرض فقط بيانات صاحب الحساب

import { auth, onAuthStateChanged, signOut } from "./firebase-client.js";

const loadingScreen = document.getElementById("loading-screen");
const claimScreen = document.getElementById("claim-screen");
const dashboard = document.getElementById("dashboard");

const claimUsernameInput = document.getElementById("claim-username");
const claimPreview = document.getElementById("claim-preview");
const claimBtn = document.getElementById("claim-btn");
const claimError = document.getElementById("claim-error");

const logoutBtn = document.getElementById("logout-btn");
const myLinkEl = document.getElementById("my-link");
const copyLinkBtn = document.getElementById("copy-link-btn");

const profileName = document.getElementById("profile-name");
const profileBio = document.getElementById("profile-bio");
const profileAvatar = document.getElementById("profile-avatar");
const saveProfileBtn = document.getElementById("save-profile-btn");
const profileMsg = document.getElementById("profile-msg");

const linksList = document.getElementById("links-list");
const newLinkLabel = document.getElementById("new-link-label");
const newLinkUrl = document.getElementById("new-link-url");
const newLinkIcon = document.getElementById("new-link-icon");
const addLinkBtn = document.getElementById("add-link-btn");

let currentUser = null;

function showOnly(el) {
  [loadingScreen, claimScreen, dashboard].forEach((s) => (s.style.display = "none"));
  el.style.display = "block";
}

async function authHeaders() {
  const token = await currentUser.getIdToken();
  return { "Content-Type": "application/json", Authorization: `Bearer ${token}` };
}

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    location.href = "/login.html";
    return;
  }
  currentUser = user;
  await loadMe();
});

logoutBtn.addEventListener("click", async () => {
  await signOut(auth);
  location.href = "/login.html";
});

// ---------- تحميل بيانات حساب المستخدم الحالي ----------
async function loadMe() {
  try {
    const headers = await authHeaders();
    const res = await fetch("/api/me", { headers });
    const data = await res.json();

    if (!data.profile || !data.profile.username) {
      showOnly(claimScreen);
      return;
    }

    myLinkEl.href = `${location.origin}/${data.profile.username}`;
    myLinkEl.textContent = `${location.origin}/${data.profile.username}`;

    profileName.value = data.profile.name || "";
    profileBio.value = data.profile.bio || "";
    profileAvatar.value = data.profile.avatarUrl || "";
    renderLinksAdmin(data.links || []);

    showOnly(dashboard);
  } catch (err) {
    console.error(err);
    showOnly(claimScreen);
  }
}

// ---------- حجز اسم المستخدم ----------
let checkTimer = null;
claimUsernameInput.addEventListener("input", () => {
  const raw = claimUsernameInput.value.trim().toLowerCase();
  claimUsernameInput.value = raw;
  clearTimeout(checkTimer);
  if (!raw) {
    claimPreview.textContent = "";
    return;
  }
  checkTimer = setTimeout(async () => {
    if (!/^[a-z0-9_-]{3,20}$/.test(raw)) {
      claimPreview.textContent = "3-20 حرفاً: إنجليزي صغير، أرقام، - أو _ فقط";
      claimPreview.style.color = "#ff8080";
      return;
    }
    const res = await fetch(`/api/username-available/${encodeURIComponent(raw)}`);
    const data = await res.json();
    if (data.available) {
      claimPreview.textContent = `متاح ✅  ${location.origin}/${raw}`;
      claimPreview.style.color = "#8affb0";
    } else {
      claimPreview.textContent = "غير متاح";
      claimPreview.style.color = "#ff8080";
    }
  }, 400);
});

claimBtn.addEventListener("click", async () => {
  claimError.textContent = "";
  const username = claimUsernameInput.value.trim().toLowerCase();
  if (!username) return;
  try {
    const headers = await authHeaders();
    const res = await fetch("/api/account/claim-username", {
      method: "POST",
      headers,
      body: JSON.stringify({ username }),
    });
    const data = await res.json();
    if (!res.ok) {
      claimError.textContent = data.error || "حدث خطأ";
      return;
    }
    await loadMe();
  } catch (err) {
    claimError.textContent = "تعذر الاتصال بالسيرفر";
  }
});

// ---------- نسخ الرابط ----------
const COPY_BTN_DEFAULT_HTML = copyLinkBtn.innerHTML;

copyLinkBtn.addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(myLinkEl.href);
    copyLinkBtn.innerHTML = '<i class="fa-solid fa-check"></i> تم النسخ ✅';
    setTimeout(() => (copyLinkBtn.innerHTML = COPY_BTN_DEFAULT_HTML), 1500);
  } catch (err) {
    // تجاهل - بعض المتصفحات تمنع النسخ التلقائي بدون تفاعل مباشر
  }
});

// ---------- إبراز رابط الصفحة (يُستدعى بعد أي عملية حفظ ناجحة) ----------
function flashMyLinkBox() {
  const box = document.getElementById("my-link-box");
  if (!box) return;
  box.scrollIntoView({ behavior: "smooth", block: "center" });
  box.classList.remove("highlight");
  // إعادة تشغيل الـ animation حتى لو استُدعيت الدالة أكثر من مرة متتالية
  void box.offsetWidth;
  box.classList.add("highlight");
  setTimeout(() => box.classList.remove("highlight"), 1500);
}

// ---------- حفظ البروفايل ----------
saveProfileBtn.addEventListener("click", async () => {
  profileMsg.textContent = "";
  try {
    const headers = await authHeaders();
    const res = await fetch("/api/me/profile", {
      method: "POST",
      headers,
      body: JSON.stringify({
        name: profileName.value.trim(),
        bio: profileBio.value.trim(),
        avatarUrl: profileAvatar.value.trim(),
      }),
    });
    const data = await res.json();
    if (res.ok) {
      profileMsg.textContent = "تم الحفظ بنجاح ✅";
      flashMyLinkBox();
    } else {
      profileMsg.textContent = data.error || "حدث خطأ";
    }
  } catch (err) {
    profileMsg.textContent = "تعذر الاتصال بالسيرفر";
  }
});

// ---------- إدارة الروابط ----------
function renderLinksAdmin(links) {
  linksList.innerHTML = "";
  links.forEach((link, index) => {
    const row = document.createElement("div");
    row.className = "link-item";
    row.innerHTML = `
      <i class="fa-solid fa-grip-lines"></i>
      <div class="link-item-info">
        <div class="link-item-label">${escapeHtml(link.label)}</div>
        <div class="link-item-url">${escapeHtml(link.url)}</div>
      </div>
      <div class="link-item-actions">
        <button title="تحريك للأعلى" data-action="up">↑</button>
        <button title="تحريك للأسفل" data-action="down">↓</button>
        <button title="تعديل" data-action="edit">✎</button>
        <button title="حذف" data-action="delete">✕</button>
      </div>
    `;
    row.querySelector('[data-action="up"]').addEventListener("click", () => moveLink(links, index, -1));
    row.querySelector('[data-action="down"]').addEventListener("click", () => moveLink(links, index, 1));
    row.querySelector('[data-action="edit"]').addEventListener("click", () => editLink(link));
    row.querySelector('[data-action="delete"]').addEventListener("click", () => deleteLink(link.id));
    linksList.appendChild(row);
  });
}

async function moveLink(links, index, direction) {
  const target = index + direction;
  if (target < 0 || target >= links.length) return;
  const a = links[index];
  const b = links[target];
  const aOrder = a.order ?? index;
  const bOrder = b.order ?? target;
  await Promise.all([updateLink(a.id, { order: bOrder }), updateLink(b.id, { order: aOrder })]);
  loadMe();
}

async function editLink(link) {
  const newLabel = prompt("اسم الرابط:", link.label);
  if (newLabel === null) return;
  const newUrl = prompt("عنوان الرابط (URL):", link.url);
  if (newUrl === null) return;
  await updateLink(link.id, { label: newLabel.trim(), url: newUrl.trim() });
  loadMe();
}

async function updateLink(id, updates) {
  const headers = await authHeaders();
  await fetch(`/api/me/links/${id}`, { method: "PUT", headers, body: JSON.stringify(updates) });
}

async function deleteLink(id) {
  if (!confirm("هل تريد حذف هذا الرابط؟")) return;
  const headers = await authHeaders();
  await fetch(`/api/me/links/${id}`, { method: "DELETE", headers });
  loadMe();
}

addLinkBtn.addEventListener("click", async () => {
  const label = newLinkLabel.value.trim();
  const url = newLinkUrl.value.trim();
  const icon = newLinkIcon.value;
  if (!label || !url) {
    alert("الرجاء إدخال الاسم والرابط");
    return;
  }
  try {
    const headers = await authHeaders();
    const res = await fetch("/api/me/links", {
      method: "POST",
      headers,
      body: JSON.stringify({ label, url, icon }),
    });
    const data = await res.json();
    if (res.ok) {
      newLinkLabel.value = "";
      newLinkUrl.value = "";
      await loadMe();
      flashMyLinkBox();
    } else {
      alert(data.error || "حدث خطأ");
    }
  } catch (err) {
    alert("تعذر الاتصال بالسيرفر");
  }
});

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str || "";
  return div.innerHTML;
}
