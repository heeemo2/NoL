// public/js/admin.js
// منطق لوحة التحكم: تسجيل الدخول، تعديل البروفايل، وإدارة الروابط (CRUD)

const SESSION_KEY = "nol_admin_password";

const loginScreen = document.getElementById("login-screen");
const dashboard = document.getElementById("dashboard");
const passwordInput = document.getElementById("password-input");
const loginBtn = document.getElementById("login-btn");
const loginError = document.getElementById("login-error");

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

function getPassword() {
  return sessionStorage.getItem(SESSION_KEY) || "";
}

function authHeaders() {
  return {
    "Content-Type": "application/json",
    "x-admin-password": getPassword(),
  };
}

async function tryLogin(password) {
  try {
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    const data = await res.json();
    if (res.ok && data.ok) {
      sessionStorage.setItem(SESSION_KEY, password);
      showDashboard();
    } else {
      loginError.textContent = data.error || "كلمة المرور غير صحيحة";
    }
  } catch (err) {
    loginError.textContent = "تعذر الاتصال بالسيرفر";
  }
}

loginBtn.addEventListener("click", () => {
  loginError.textContent = "";
  const pw = passwordInput.value.trim();
  if (!pw) return;
  tryLogin(pw);
});

passwordInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") loginBtn.click();
});

function showDashboard() {
  loginScreen.style.display = "none";
  dashboard.style.display = "block";
  loadAll();
}

async function loadAll() {
  try {
    const res = await fetch("/api/data");
    const data = await res.json();
    profileName.value = data.profile?.name || "";
    profileBio.value = data.profile?.bio || "";
    profileAvatar.value = data.profile?.avatarUrl || "";
    renderLinksAdmin(data.links || []);
  } catch (err) {
    console.error(err);
  }
}

saveProfileBtn.addEventListener("click", async () => {
  profileMsg.textContent = "";
  try {
    const res = await fetch("/api/admin/profile", {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({
        name: profileName.value.trim(),
        bio: profileBio.value.trim(),
        avatarUrl: profileAvatar.value.trim(),
      }),
    });
    const data = await res.json();
    if (res.ok) {
      profileMsg.textContent = "تم الحفظ بنجاح ✅";
    } else {
      profileMsg.textContent = data.error || "حدث خطأ";
    }
  } catch (err) {
    profileMsg.textContent = "تعذر الاتصال بالسيرفر";
  }
});

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
  await Promise.all([
    updateLink(a.id, { order: bOrder }),
    updateLink(b.id, { order: aOrder }),
  ]);
  loadAll();
}

async function editLink(link) {
  const newLabel = prompt("اسم الرابط:", link.label);
  if (newLabel === null) return;
  const newUrl = prompt("عنوان الرابط (URL):", link.url);
  if (newUrl === null) return;
  await updateLink(link.id, { label: newLabel.trim(), url: newUrl.trim() });
  loadAll();
}

async function updateLink(id, updates) {
  try {
    await fetch(`/api/admin/links/${id}`, {
      method: "PUT",
      headers: authHeaders(),
      body: JSON.stringify(updates),
    });
  } catch (err) {
    console.error(err);
  }
}

async function deleteLink(id) {
  if (!confirm("هل تريد حذف هذا الرابط؟")) return;
  try {
    await fetch(`/api/admin/links/${id}`, {
      method: "DELETE",
      headers: authHeaders(),
    });
    loadAll();
  } catch (err) {
    console.error(err);
  }
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
    const res = await fetch("/api/admin/links", {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ label, url, icon }),
    });
    const data = await res.json();
    if (res.ok) {
      newLinkLabel.value = "";
      newLinkUrl.value = "";
      loadAll();
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

// عند تحميل الصفحة: إذا كانت كلمة المرور محفوظة بالفعل في الجلسة، تحقق منها تلقائياً
(async function init() {
  const savedPassword = getPassword();
  if (savedPassword) {
    await tryLogin(savedPassword);
  }
})();
