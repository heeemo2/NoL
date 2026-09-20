// public/js/app.js
// يجلب بيانات الصفحة (البروفايل والروابط) من السيرفر ويعرضها ديناميكياً

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

async function loadData() {
  try {
    const res = await fetch("/api/data");
    const data = await res.json();
    renderProfile(data.profile);
    renderLinks(data.links || []);
  } catch (err) {
    console.error("فشل تحميل البيانات:", err);
    document.getElementById("empty-state").style.display = "block";
    document.getElementById("empty-state").textContent = "تعذر تحميل البيانات";
  }
}

function renderProfile(profile) {
  if (!profile) return;
  document.getElementById("name").textContent = profile.name || "NoL";
  document.getElementById("bio").textContent = profile.bio || "";
  const avatar = document.getElementById("avatar");
  avatar.src = profile.avatarUrl || "https://api.dicebear.com/7.x/initials/svg?seed=NoL";
  document.title = profile.name ? `${profile.name} | NoL` : "NoL";
}

function renderLinks(links) {
  const container = document.getElementById("links");
  const emptyState = document.getElementById("empty-state");
  container.innerHTML = "";

  if (!links.length) {
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
