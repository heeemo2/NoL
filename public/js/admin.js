// لوحة تحكم كل مستخدم: تتطلب تسجيل دخول عبر Firebase Auth، وتعرض فقط بيانات صاحب الحساب

import { auth, onAuthStateChanged, signOut } from "./firebase-client.js";

// إعدادات Cloudinary
const CLOUDINARY_CLOUD_NAME = "urqib8nz";
const CLOUDINARY_UPLOAD_PRESET = "my_preset";

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
const avatarPreviewImg = document.getElementById("avatar-preview-img"); 
const saveProfileBtn = document.getElementById("save-profile-btn");
const profileMsg = document.getElementById("profile-msg");

const profileImageInput = document.getElementById("profile-image-input");
const bannerImageInput = document.getElementById("banner-image-input");
const bannerPreviewContainer = document.getElementById("banner-preview-container");

const linksList = document.getElementById("links-list");
const newLinkLabel = document.getElementById("new-link-label");
const newLinkUrl = document.getElementById("new-link-url");
const newLinkIcon = document.getElementById("new-link-icon");
const addLinkBtn = document.getElementById("add-link-btn");

let currentUser = null;
let bannerUrlValue = "";

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

// دالة تحديد الأيقونة واللون لكل منصة
function getPlatformIconClass(iconName) {
  switch ((iconName || "").toLowerCase()) {
    case "discord": return { class: "fa-brands fa-discord", color: "#5865F2" };
    case "snapchat": return { class: "fa-brands fa-snapchat", color: "#FFFC00" };
    case "tiktok": return { class: "fa-brands fa-tiktok", color: "#000000" };
    case "instagram": return { class: "fa-brands fa-instagram", color: "#E1306C" };
    case "x":
    case "twitter": return { class: "fa-brands fa-x-twitter", color: "#ffffff" };
    case "whatsapp": return { class: "fa-brands fa-whatsapp", color: "#25D366" };
    case "youtube": return { class: "fa-brands fa-youtube", color: "#FF0000" };
    case "telegram": return { class: "fa-brands fa-telegram", color: "#229ED9" };
    case "facebook": return { class: "fa-brands fa-facebook", color: "#1877F2" };
    case "spotify": return { class: "fa-brands fa-spotify", color: "#1DB954" };
    case "twitch": return { class: "fa-brands fa-twitch", color: "#9146FF" };
    case "github": return { class: "fa-brands fa-github", color: "#ffffff" };
    default: return { class: "fa-solid fa-link", color: "#a855f7" };
  }
}

// تحميل بيانات حساب المستخدم الحالي
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
    
    if (data.profile.avatarUrl && avatarPreviewImg) {
      avatarPreviewImg.src = data.profile.avatarUrl;
    } else if (avatarPreviewImg) {
      avatarPreviewImg.src = "https://via.placeholder.com/150";
    }

    if (data.profile.bannerUrl && bannerPreviewContainer) {
      bannerUrlValue = data.profile.bannerUrl;
      bannerPreviewContainer.style.backgroundImage = `url('${data.profile.bannerUrl}')`;
      bannerPreviewContainer.style.backgroundSize = "cover";
      bannerPreviewContainer.style.backgroundPosition = "center";
    }

    renderLinksAdmin(data.links || []);
    showOnly(dashboard);
  } catch (err) {
    console.error(err);
    showOnly(claimScreen);
  }
}

if (profileAvatar && avatarPreviewImg) {
  profileAvatar.addEventListener("input", () => {
    const url = profileAvatar.value.trim();
    avatarPreviewImg.src = url || "https://via.placeholder.com/150";
  });
}

// رفع الصور لـ Cloudinary
async function uploadImageToCloudinary(file) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, {
    method: "POST",
    body: formData
  });
  
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error?.message || "فشل رفع الصورة");
  }
  return data.secure_url;
}

// ضغط الدائرة لرفع الصورة الشخصية
if (avatarPreviewImg && profileImageInput) {
  const avatarWrapper = document.getElementById("avatar-container");
  if (avatarWrapper) {
    avatarWrapper.addEventListener("click", () => profileImageInput.click());
  }

  profileImageInput.addEventListener("change", async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      profileMsg.textContent = "جاري رفع الصورة الشخصية...";
      const url = await uploadImageToCloudinary(file);
      profileAvatar.value = url;
      avatarPreviewImg.src = url;
      profileMsg.textContent = "تم رفع الصورة بنجاح ✅ (اضغط حفظ البروفايل للتثبيت)";
      setTimeout(() => { profileMsg.textContent = ""; }, 4000);
    } catch (err) {
      console.error(err);
      profileMsg.textContent = "خطأ في رفع الصورة الشخصية ❌";
    }
  });
}

// ضغط البنر لرفع صورة البنر
if (bannerPreviewContainer && bannerImageInput) {
  bannerPreviewContainer.addEventListener("click", () => bannerImageInput.click());

  bannerImageInput.addEventListener("change", async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      profileMsg.textContent = "جاري رفع البنر...";
      const url = await uploadImageToCloudinary(file);
      bannerUrlValue = url;
      bannerPreviewContainer.style.backgroundImage = `url('${url}')`;
      bannerPreviewContainer.style.backgroundSize = "cover";
      bannerPreviewContainer.style.backgroundPosition = "center";
      profileMsg.textContent = "تم رفع البنر بنجاح ✅ (اضغط حفظ البروفايل للتثبيت)";
      setTimeout(() => { profileMsg.textContent = ""; }, 4000);
    } catch (err) {
      console.error(err);
      profileMsg.textContent = "خطأ في رفع البنر ❌";
    }
  });
}

// حجز اسم المستخدم
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

// نسخ الرابط
const COPY_BTN_DEFAULT_HTML = copyLinkBtn.innerHTML;

copyLinkBtn.addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(myLinkEl.href);
    copyLinkBtn.innerHTML = '<i class="fa-solid fa-check"></i> تم النسخ ✅';
    setTimeout(() => (copyLinkBtn.innerHTML = COPY_BTN_DEFAULT_HTML), 1500);
  } catch (err) {}
});

function flashMyLinkBox() {
  const box = document.getElementById("my-link-box");
  if (!box) return;
  box.scrollIntoView({ behavior: "smooth", block: "center" });
  box.classList.remove("highlight");
  void box.offsetWidth;
  box.classList.add("highlight");
  setTimeout(() => box.classList.remove("highlight"), 1500);
}

// حفظ البروفايل
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
        bannerUrl: bannerUrlValue,
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

// عرض الروابط مع أيقونات المنصات المخصصة
function renderLinksAdmin(links) {
  linksList.innerHTML = "";
  links.forEach((link, index) => {
    const iconMeta = getPlatformIconClass(link.icon);
    const row = document.createElement("div");
    row.className = "link-item";
    row.innerHTML = `
      <i class="${iconMeta.class} platform-icon" style="color: ${iconMeta.color};"></i>
      <div class="link-item-info">
        <div class="link-item-label">${escapeHtml(link.label)}</div>
        <div class="link-item-url">${escapeHtml(link.url)}</div>
      </div>
      <div class="link-item-actions">
        <button title="تحريك للأعلى" data-action="up"><i class="fa-solid fa-chevron-up"></i></button>
        <button title="تحريك للأسفل" data-action="down"><i class="fa-solid fa-chevron-down"></i></button>
        <button title="تعديل" data-action="edit"><i class="fa-solid fa-pen"></i></button>
        <button title="حذف" data-action="delete"><i class="fa-solid fa-xmark"></i></button>
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
