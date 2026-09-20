// public/js/app.js
// يجلب بيانات صفحة المستخدم (حسب اسم المستخدم في مسار الرابط) من السيرفر ويعرضها ديناميكياً

const ICONS = {
  discord: "fa-brands fa-discord",
  snapchat: "fa-brands fa-snapchat",
  tiktok: "fa-brands fa-tiktok",
  instagram: "fa-brands fa-instagram",
  twitter: "fa-brands fa-x-twitter",
  x: "fa-brands fa-x-twitter",
  whatsapp: "fa-brands fa-whatsapp",
  youtube: "fa-brands fa-youtube",
  telegram: "fa-brands fa-telegram",
  facebook: "fa-brands fa-facebook",
  spotify: "fa-brands fa-spotify",
  twitch: "fa-brands fa-twitch",
  github: "fa-brands fa-github",
  link: "fa-solid fa-link",
};

function iconClassFor(icon) {
  return ICONS[(icon || "link").toLowerCase()] || ICONS.link;
}

function getUsernameFromPath() {
  return decodeURIComponent(location.pathname.replace(/^\/+/, "")).toLowerCase();
}

async function loadData() {
  const username = getUsernameFromPath();
  const emptyState = document.getElementById("empty-state");

  if (!username) {
    location.href = "/";
    return;
  }

  try {
    const res = await fetch(`/api/public/${encodeURIComponent(username)}`);
    if (res.status === 404) {
      document.getElementById("name").textContent = "الصفحة غير موجودة";
      document.getElementById("bio").textContent = `لا يوجد مستخدم باسم "${username}"`;
      document.getElementById("avatar").src = "https://api.dicebear.com/7.x/initials/svg?seed=NoL";
      return;
    }
    const data = await res.json();
    renderProfile(data.profile);
    renderLinks(data.links || []);
  } catch (err) {
    console.error("فشل تحميل البيانات:", err);
    emptyState.style.display = "block";
    emptyState.textContent = "تعذر تحميل البيانات";
  }
}

function renderProfile(profile) {
  if (!profile) return;
  document.getElementById("name").textContent = profile.name || profile.username || "NoL";
  document.getElementById("bio").textContent = profile.bio || "";
  
  const avatar = document.getElementById("avatar");
  avatar.src = profile.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(profile.name || profile.username || "NoL")}`;
  
  // عرض البنر بشكل صحيح عند توفره في بيانات البروفايل
  const bannerContainer = document.getElementById("profile-banner");
  const bannerImg = document.getElementById("banner-img");
  
  if (profile.bannerUrl && profile.bannerUrl.trim() !== "") {
    bannerImg.src = profile.bannerUrl;
    bannerContainer.style.display = "block";
  } else {
    bannerContainer.style.display = "none";
  }

  document.title = profile.name ? `${profile.name} | NoL` : "NoL";
}

function renderLinks(links) {
  const container = document.getElementById("links");
  const emptyState = document.getElementById("empty-state");
  container.innerHTML = "";

  if (!links.length) {
    emptyState.textContent = "لا توجد روابط بعد";
    emptyState.style.display = "block";
    return;
  }
  emptyState.style.display = "none";

  links.forEach((link) => {
    const a = document.createElement("a");
    a.href = link.url;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    a.className = "link-btn";
    a.innerHTML = `
      <i class="${iconClassFor(link.icon)}"></i>
      <span class="link-label">${escapeHtml(link.label)}</span>
    `;
    container.appendChild(a);
  });
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

loadData();
