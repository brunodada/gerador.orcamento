"use strict";

const servicesList = document.getElementById("services-list");
const addServiceButton = document.getElementById("add-service");
const totalAmountEl = document.getElementById("total-amount");
const budgetForm = document.getElementById("budget-form");
const printButton = document.getElementById("print-budget");
const downloadTxtButton = document.getElementById("download-txt");
const logoutButton = document.getElementById("logout-button");
const historyList = document.getElementById("history-list");
const importButton = document.getElementById("import-budget");
const importFileInput = document.getElementById("import-file");

const resultClientName = document.getElementById("result-client-name");
const resultDate = document.getElementById("result-date");
const resultServicesBody = document.getElementById("result-services-body");
const resultTotal = document.getElementById("result-total");

function ensureAuthenticated() {
  const isLoggedIn = localStorage.getItem("orcamento_logged_in") === "true";
  if (!isLoggedIn) {
    window.location.href = "login.html";
  }
}

if (budgetForm) {
  ensureAuthenticated();
}

function formatCurrency(value) {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 2,
  });
}

function parseCurrencyInput(value) {
  if (!value) return 0;
  const cleaned = value.replace(/\./g, "").replace(",", ".");
  const number = Number(cleaned);
  return Number.isFinite(number) ? number : 0;
}

function createServiceRow() {
  if (!servicesList) return;

  const row = document.createElement("div");
  row.className = "service-row";

  row.innerHTML = `
    <div class="service-row__field">
      <label>Serviço</label>
      <input
        type="text"
        name="serviceName"
        placeholder="Ex: Desenvolvimento de site"
        required
      />
    </div>

    <div class="service-row__field service-row__field--small">
      <label>Qtd.</label>
      <input
        type="number"
        name="serviceQuantity"
        min="1"
        step="1"
        value="1"
        required
      />
    </div>

    <div class="service-row__field service-row__field--small">
      <label>Valor unitário (R$)</label>
      <input
        type="text"
        inputmode="decimal"
        name="servicePrice"
        placeholder="0,00"
        required
      />
    </div>

    <div class="service-row__actions">
      <button type="button" class="btn btn--icon" aria-label="Remover serviço">
        ×
      </button>
    </div>
  `;

  const removeBtn = row.querySelector("button");
  removeBtn.addEventListener("click", () => {
    row.remove();
    updateTotal();
  });

  const inputs = row.querySelectorAll('input[name="serviceQuantity"], input[name="servicePrice"]');
  inputs.forEach((input) => {
    input.addEventListener("input", () => {
      updateTotal();
    });
  });

  servicesList.appendChild(row);
  updateTotal();
}

function getServicesFromForm() {
  if (!servicesList) return [];

  const rows = servicesList.querySelectorAll(".service-row");
  const services = [];

  rows.forEach((row) => {
    const name = row.querySelector('input[name="serviceName"]')?.value.trim() ?? "";
    const quantityValue = row.querySelector('input[name="serviceQuantity"]')?.value ?? "0";
    const priceValue = row.querySelector('input[name="servicePrice"]')?.value ?? "0";

    if (!name && !quantityValue && !priceValue) {
      return;
    }

    const quantity = Number(quantityValue) || 0;
    const price = parseCurrencyInput(priceValue);
    const subtotal = quantity * price;

    services.push({ name, quantity, price, subtotal });
  });

  return services;
}

function updateTotal() {
  if (!totalAmountEl) return;
  const services = getServicesFromForm();
  const total = services.reduce((sum, service) => sum + service.subtotal, 0);
  totalAmountEl.textContent = formatCurrency(total);
}

function updateResultPanel(formData, services) {
  if (!resultClientName || !resultDate || !resultServicesBody || !resultTotal) return;

  const clientName = formData.get("clientName")?.toString().trim() || "—";
  const dateRaw = formData.get("budgetDate")?.toString();

  resultClientName.textContent = clientName || "—";

  if (dateRaw) {
    const date = new Date(dateRaw);
    if (!Number.isNaN(date.getTime())) {
      resultDate.textContent = date.toLocaleDateString("pt-BR");
    } else {
      resultDate.textContent = "—";
    }
  } else {
    resultDate.textContent = "—";
  }

  resultServicesBody.innerHTML = "";

  services.forEach((service) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${service.name || "-"}</td>
      <td class="align-right">${service.quantity}</td>
      <td class="align-right">${formatCurrency(service.price)}</td>
      <td class="align-right">${formatCurrency(service.subtotal)}</td>
    `;
    resultServicesBody.appendChild(tr);
  });

  const total = services.reduce((sum, service) => sum + service.subtotal, 0);
  resultTotal.textContent = formatCurrency(total);
}

function loadBudgets() {
  try {
    const raw = localStorage.getItem("orcamentos_salvos");
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed;
    return [];
  } catch {
    return [];
  }
}

function saveBudgets(list) {
  localStorage.setItem("orcamentos_salvos", JSON.stringify(list));
}

function buildBudgetObject(formData, services) {
  const clientName = formData.get("clientName")?.toString().trim() || "Sem nome";
  const email = formData.get("clientEmail")?.toString().trim() || "";
  const phone = formData.get("clientPhone")?.toString().trim() || "";
  const dateRaw = formData.get("budgetDate")?.toString();
  const total = services.reduce((sum, service) => sum + service.subtotal, 0);

  const date = dateRaw || new Date().toISOString().slice(0, 10);

  return {
    id: Date.now(),
    clientName,
    email,
    phone,
    date,
    services,
    total,
    createdAt: new Date().toISOString(),
  };
}

function renderHistory(list) {
  if (!historyList) return;
  historyList.innerHTML = "";

  if (!list.length) {
    const empty = document.createElement("li");
    empty.textContent = "Nenhum orçamento salvo ainda.";
    empty.className = "history__hint";
    historyList.appendChild(empty);
    return;
  }

  list
    .slice()
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
    .forEach((budget) => {
      const li = document.createElement("li");
      li.className = "history__item";

      const main = document.createElement("div");
      main.className = "history__item-main";
      const clientEl = document.createElement("span");
      clientEl.className = "history__client";
      clientEl.textContent = budget.clientName;
      const metaEl = document.createElement("span");
      metaEl.className = "history__meta";
      const created = new Date(budget.createdAt);
      metaEl.textContent = `${budget.date} · ${formatCurrency(budget.total)} · salvo em ${created.toLocaleString("pt-BR")}`;
      main.appendChild(clientEl);
      main.appendChild(metaEl);

      const buttons = document.createElement("div");
      buttons.className = "history__buttons";

      const viewBtn = document.createElement("button");
      viewBtn.type = "button";
      viewBtn.className = "history__btn";
      viewBtn.textContent = "Ver";
      viewBtn.addEventListener("click", () => {
        fillResultFromBudget(budget);
      });

      const txtBtn = document.createElement("button");
      txtBtn.type = "button";
      txtBtn.className = "history__btn";
      txtBtn.textContent = "TXT";
      txtBtn.addEventListener("click", () => {
        downloadBudgetTxt(budget);
      });

      buttons.appendChild(viewBtn);
      buttons.appendChild(txtBtn);

      li.appendChild(main);
      li.appendChild(buttons);
      historyList.appendChild(li);
    });
}

function fillResultFromBudget(budget) {
  if (!budget) return;

  const formData = new FormData();
  formData.set("clientName", budget.clientName);
  formData.set("budgetDate", budget.date);

  updateResultPanel(formData, budget.services);
}

function buildTxtContent(budget) {
  const lines = [];
  lines.push("ORÇAMENTO");
  lines.push("=".repeat(40));
  lines.push(`Cliente: ${budget.clientName}`);
  if (budget.email) lines.push(`E-mail: ${budget.email}`);
  if (budget.phone) lines.push(`Telefone: ${budget.phone}`);
  lines.push(`Data do orçamento: ${budget.date}`);
  lines.push("");
  lines.push("Serviços:");
  lines.push("Descrição | Qtd. | Valor unitário | Subtotal");

  budget.services.forEach((s) => {
    lines.push(
      `${s.name} | ${s.quantity} | ${formatCurrency(s.price)} | ${formatCurrency(s.subtotal)}`
    );
  });

  lines.push("");
  lines.push(`Total: ${formatCurrency(budget.total)}`);
  lines.push("");
  lines.push("Gerado pelo Gerador de Orçamento (web).");

  return lines.join("\n");
}

function sanitizeFileNamePart(text) {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\-]+/gi, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "")
    .toLowerCase()
    .slice(0, 40);
}

function downloadBudgetTxt(budget) {
  if (!budget) return;
  const content = buildTxtContent(budget);
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");

  const clientPart = sanitizeFileNamePart(budget.clientName || "cliente");
  const datePart = sanitizeFileNamePart(budget.date || "");
  a.download = `orcamento_${clientPart}_${datePart || "data"}.txt`;

  a.href = url;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function parseBudgetFromTxt(text) {
  const lines = text.split(/\r?\n/).map((l) => l.trim());
  if (!lines[0]?.startsWith("ORÇAMENTO")) {
    throw new Error("Formato de arquivo não reconhecido.");
  }

  let clientName = "Sem nome";
  let email = "";
  let phone = "";
  let date = "";
  const services = [];
  let total = 0;

  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    if (line.startsWith("Cliente:")) {
      clientName = line.replace("Cliente:", "").trim() || clientName;
    } else if (line.startsWith("E-mail:")) {
      email = line.replace("E-mail:", "").trim();
    } else if (line.startsWith("Telefone:")) {
      phone = line.replace("Telefone:", "").trim();
    } else if (line.startsWith("Data do orçamento:")) {
      date = line.replace("Data do orçamento:", "").trim();
    } else if (line.startsWith("Serviços:")) {
      i += 2;
      while (i < lines.length) {
        const svcLine = lines[i];
        if (!svcLine || svcLine.startsWith("Total:")) {
          break;
        }
        const parts = svcLine.split("|").map((p) => p.trim());
        if (parts.length >= 4) {
          const name = parts[0];
          const qty = Number(parts[1]) || 0;
          const unit = parseCurrencyInput(parts[2].replace(/[R$\s]/g, ""));
          const subtotal = parseCurrencyInput(parts[3].replace(/[R$\s]/g, ""));
          services.push({
            name,
            quantity: qty,
            price: unit,
            subtotal: subtotal || qty * unit,
          });
        }
        i++;
      }
    } else if (line.startsWith("Total:")) {
      const valuePart = line.replace("Total:", "").trim().replace(/[R$\s]/g, "");
      total = parseCurrencyInput(valuePart);
    }
    i++;
  }

  if (!services.length) {
    throw new Error("Nenhum serviço encontrado no arquivo.");
  }

  if (!date) {
    date = new Date().toISOString().slice(0, 10);
  }

  if (!total) {
    total = services.reduce((sum, s) => sum + s.subtotal, 0);
  }

  return {
    id: Date.now(),
    clientName,
    email,
    phone,
    date,
    services,
    total,
    createdAt: new Date().toISOString(),
  };
}

function handleImportFile(event) {
  const file = event.target.files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    try {
      const text = String(reader.result || "");
      const importedBudget = parseBudgetFromTxt(text);
      const list = loadBudgets();
      list.push(importedBudget);
      saveBudgets(list);
      renderHistory(list);
      fillResultFromBudget(importedBudget);
      alert("Orçamento importado com sucesso!");
    } catch (error) {
      alert(error.message || "Não foi possível importar o arquivo.");
    } finally {
      event.target.value = "";
    }
  };
  reader.onerror = () => {
    alert("Erro ao ler o arquivo. Tente novamente.");
    event.target.value = "";
  };
  reader.readAsText(file, "utf-8");
}

function setupEvents() {
  if (addServiceButton) {
    addServiceButton.addEventListener("click", () => {
      createServiceRow();
    });
  }

  if (budgetForm) {
    budgetForm.addEventListener("submit", (event) => {
      event.preventDefault();
      const services = getServicesFromForm();

      if (services.length === 0) {
        alert("Adicione pelo menos um serviço para gerar o orçamento.");
        return;
      }

      const hasInvalid = services.some(
        (service) => !service.name || service.quantity <= 0 || service.price <= 0
      );
      if (hasInvalid) {
        alert("Preencha todos os campos de serviços com valores válidos.");
        return;
      }

      const formData = new FormData(budgetForm);
      const budget = buildBudgetObject(formData, services);

      updateResultPanel(formData, services);

      const list = loadBudgets();
      list.push(budget);
      saveBudgets(list);
      renderHistory(list);
    });
  }

  if (printButton) {
    printButton.addEventListener("click", () => {
      window.print();
    });
  }

  if (downloadTxtButton) {
    downloadTxtButton.addEventListener("click", () => {
      const list = loadBudgets();
      if (!list.length) {
        alert("Nenhum orçamento salvo ainda para baixar.");
        return;
      }
      const last = list[list.length - 1];
      downloadBudgetTxt(last);
    });
  }

  if (logoutButton) {
    logoutButton.addEventListener("click", () => {
      localStorage.removeItem("orcamento_logged_in");
      window.location.href = "login.html";
    });
  }

  if (importButton && importFileInput) {
    importButton.addEventListener("click", () => {
      importFileInput.click();
    });

    importFileInput.addEventListener("change", handleImportFile);
  }
}

if (budgetForm) {
  createServiceRow();
  const list = loadBudgets();
  renderHistory(list);
  setupEvents();
}