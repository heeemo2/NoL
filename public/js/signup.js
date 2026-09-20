// public/js/signup.js
import { auth, createUserWithEmailAndPassword } from "./firebase-client.js";

const form = document.getElementById("signup-form");
const usernameInput = document.getElementById("username");
const usernamePreview = document.getElementById("username-preview");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const submitBtn = document.getElementById("submit-btn");
const errorMsg = document.getElementById("error-msg");

let checkTimer = null;

usernameInput.addEventListener("input", () => {
  const raw = usernameInput.value.trim().toLowerCase();
  usernameInput.value = raw;
  usernamePreview.textContent = raw ? `${location.origin}/${raw}` : "";
  usernamePreview.style.color = "";

  clearTimeout(checkTimer);
  if (!raw) return;
  checkTimer = setTimeout(async () => {
    if (!/^[a-z0-9_-]{3,20}$/.test(raw)) {
      usernamePreview.textContent = "3-20 حرفاً: إنجليزي صغير، أرقام، - أو _ فقط";
      usernamePreview.style.color = "#ff8080";
      return;
    }
    try {
      const res = await fetch(`/api/username-available/${encodeURIComponent(raw)}`);
      const data = await res.json();
      if (data.available) {
        usernamePreview.textContent = `متاح ✅  ${location.origin}/${raw}`;
        usernamePreview.style.color = "#8affb0";
      } else {
        usernamePreview.textContent = "هذا الاسم غير متاح";
        usernamePreview.style.color = "#ff8080";
      }
    } catch (err) {
      // تجاهل أخطاء الشبكة أثناء الكتابة
    }
  }, 400);
});

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  errorMsg.textContent = "";
  submitBtn.disabled = true;
  submitBtn.textContent = "جارٍ الإنشاء...";

  const username = usernameInput.value.trim().toLowerCase();
  const email = emailInput.value.trim();
  const password = passwordInput.value;

  if (!/^[a-z0-9_-]{3,20}$/.test(username)) {
    errorMsg.textContent = "اسم المستخدم غير صالح";
    submitBtn.disabled = false;
    submitBtn.textContent = "إنشاء الحساب";
    return;
  }

  try {
    // تحقق أخير من توفر الاسم قبل إنشاء الحساب
    const availRes = await fetch(`/api/username-available/${encodeURIComponent(username)}`);
    const availData = await availRes.json();
    if (!availData.available) {
      errorMsg.textContent = "اسم المستخدم غير متاح، الرجاء اختيار اسم آخر";
      submitBtn.disabled = false;
      submitBtn.textContent = "إنشاء الحساب";
      return;
    }

    const cred = await createUserWithEmailAndPassword(auth, email, password);
    const idToken = await cred.user.getIdToken();

    const claimRes = await fetch("/api/account/claim-username", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${idToken}`,
      },
      body: JSON.stringify({ username }),
    });
    const claimData = await claimRes.json();

    if (!claimRes.ok) {
      // الحساب أُنشئ لكن حجز الاسم فشل (سباق نادر) - وجّهه للوحة التحكم ليحاول باسم آخر هناك
      errorMsg.textContent = claimData.error || "تم إنشاء الحساب، لكن تعذر حجز اسم المستخدم. أكمل من لوحة التحكم";
      setTimeout(() => (location.href = "/admin.html"), 1200);
      return;
    }

    location.href = "/admin.html";
  } catch (err) {
    errorMsg.textContent = mapAuthError(err.code);
    submitBtn.disabled = false;
    submitBtn.textContent = "إنشاء الحساب";
  }
});

function mapAuthError(code) {
  switch (code) {
    case "auth/email-already-in-use":
      return "هذا البريد الإلكتروني مستخدم بالفعل";
    case "auth/invalid-email":
      return "البريد الإلكتروني غير صالح";
    case "auth/weak-password":
      return "كلمة المرور ضعيفة جداً (6 أحرف على الأقل)";
    default:
      return "حدث خطأ، حاول مرة أخرى";
  }
}
