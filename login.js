"use strict";

const loginForm = document.getElementById("login-form");

function alreadyLoggedIn() {
  return localStorage.getItem("orcamento_logged_in") === "true";
}

if (alreadyLoggedIn()) {
  window.location.href = "index.html";
}

if (loginForm) {
  loginForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const formData = new FormData(loginForm);
    const user = formData.get("user")?.toString().trim();
    const password = formData.get("password")?.toString().trim();

    if (user === "admin" && password === "1234") {
      localStorage.setItem("orcamento_logged_in", "true");
      window.location.href = "index.html";
    } else {
      alert("Usuário ou senha inválidos. Tente novamente.");
    }
  });
}

