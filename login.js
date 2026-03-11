"use strict";

const loginForm = document.getElementById("login-form");

const STORED_USER = "admin";
// SHA-256 da senha "1234"
const STORED_PASSWORD_HASH =
  "03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4";

function alreadyLoggedIn() {
  return localStorage.getItem("orcamento_logged_in") === "true";
}

if (alreadyLoggedIn()) {
  window.location.href = "index.html";
}

async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  return hashHex;
}

if (loginForm) {
  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const formData = new FormData(loginForm);
    const user = formData.get("user")?.toString().trim() || "";
    const password = formData.get("password")?.toString().trim() || "";

    try {
      const passwordHash = await hashPassword(password);
      const isValidUser = user === STORED_USER;
      const isValidPassword = passwordHash === STORED_PASSWORD_HASH;

      if (isValidUser && isValidPassword) {
        localStorage.setItem("orcamento_logged_in", "true");
        window.location.href = "index.html";
      } else {
        alert("Usuário ou senha inválidos. Tente novamente.");
      }
    } catch (error) {
      alert("Não foi possível validar o login neste navegador.");
    }
  });
}

