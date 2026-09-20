// public/js/login.js
import { auth, signInWithEmailAndPassword } from "./firebase-client.js";

const form = document.getElementById("login-form");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const submitBtn = document.getElementById("submit-btn");
const errorMsg = document.getElementById("error-msg");

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  errorMsg.textContent = "";
  submitBtn.disabled = true;
  submitBtn.textContent = "جارٍ الدخول...";

  try {
    await signInWithEmailAndPassword(auth, emailInput.value.trim(), passwordInput.value);
    location.href = "/admin.html";
  } catch (err) {
    errorMsg.textContent = mapAuthError(err.code);
    submitBtn.disabled = false;
    submitBtn.textContent = "دخول";
  }
});

function mapAuthError(code) {
  switch (code) {
    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found":
      return "البريد الإلكتروني أو كلمة المرور غير صحيحة";
    case "auth/invalid-email":
      return "البريد الإلكتروني غير صالح";
    case "auth/too-many-requests":
      return "محاولات كثيرة، حاول لاحقاً";
    default:
      return "تعذر تسجيل الدخول، حاول مرة أخرى";
  }
}
