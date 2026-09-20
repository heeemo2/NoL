// src/utils.js
const RESERVED_USERNAMES = new Set([
  "admin", "login", "signup", "signin", "logout", "api", "static",
  "css", "js", "img", "images", "assets", "public", "www", "app",
  "help", "support", "about", "contact", "settings", "account",
  "dashboard", "profile", "health", "favicon.ico", "robots.txt",
  "sitemap.xml", "null", "undefined", "nol",
]);

function normalizeUsername(raw) {
  return String(raw || "").trim().toLowerCase();
}

function isValidUsername(username) {
  return /^[a-z0-9_-]{3,20}$/.test(username);
}

function isReserved(username) {
  return RESERVED_USERNAMES.has(username);
}

module.exports = { normalizeUsername, isValidUsername, isReserved, RESERVED_USERNAMES };
