"use strict";

const servicesList = document.getElementById("services-list");
const addServiceButton = document.getElementById("add-service");
const totalAmountEl = document.getElementById("total-amount");
const budgetForm = document.getElementById("budget-form");

const resultClientName = document.getElementById("result-client-name");
const resultDate = document.getElementById("result-date");
const resultServicesBody = document.getElementById("result-services-body");
const resultTotal = document.getElementById("result-total");

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
  const services = getServicesFromForm();
  const total = services.reduce((sum, service) => sum + service.subtotal, 0);
  totalAmountEl.textContent = formatCurrency(total);
}

function updateResultPanel(formData, services) {
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

addServiceButton?.addEventListener("click", () => {
  createServiceRow();
});

budgetForm?.addEventListener("submit", (event) => {
  event.preventDefault();
  const services = getServicesFromForm();

  if (services.length === 0) {
    alert("Adicione pelo menos um serviço para gerar o orçamento.");
    return;
  }

  const hasInvalid = services.some((service) => !service.name || service.quantity <= 0 || service.price <= 0);
  if (hasInvalid) {
    alert("Preencha todos os campos de serviços com valores válidos.");
    return;
  }

  const formData = new FormData(budgetForm);
  updateResultPanel(formData, services);
});

createServiceRow();