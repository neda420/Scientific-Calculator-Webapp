const display = document.getElementById("display");
const statusEl = document.getElementById("status");
const buttons = document.querySelector(".buttons");
const FLOATING_POINT_TOLERANCE = 1e-12;
const DISPLAY_PRECISION = 12;

const allowedIdentifiers = new Set([
  "sin",
  "cos",
  "tan",
  "log",
  "ln",
  "sqrt",
  "abs",
  "exp",
  "PI",
  "E"
]);

const scope = {
  sin: Math.sin,
  cos: Math.cos,
  tan: Math.tan,
  log: Math.log10,
  ln: Math.log,
  sqrt: Math.sqrt,
  abs: Math.abs,
  exp: Math.exp,
  PI: Math.PI,
  E: Math.E
};

function setStatus(message = "") {
  statusEl.textContent = message;
}

function appendValue(value) {
  display.value += value;
  setStatus("");
}

function canAppendIdentifierCharacter(character) {
  const currentIdentifierMatch = display.value.match(/[A-Za-z_]+$/);
  const currentIdentifier = currentIdentifierMatch ? currentIdentifierMatch[0] : "";
  const nextIdentifier = `${currentIdentifier}${character}`;

  return [...allowedIdentifiers].some((identifier) =>
    identifier.startsWith(nextIdentifier)
  );
}

function evaluateExpression(expression) {
  if (!expression.trim()) {
    return "";
  }

  const invalidCharacters = /[^\d+\-*/().,\sA-Za-z_^]/.test(expression);
  if (invalidCharacters) {
    throw new Error("Expression contains unsupported characters.");
  }

  const identifiers = expression.match(/[A-Za-z_]+/g) || [];
  if (identifiers.some((name) => !allowedIdentifiers.has(name))) {
    throw new Error("Expression contains unsupported functions.");
  }

  const preparedExpression = expression.replace(/\^/g, "**");
  const evaluator = new Function(
    ...Object.keys(scope),
    `"use strict"; return (${preparedExpression});`
  );
  const result = evaluator(...Object.values(scope));

  if (!Number.isFinite(result)) {
    throw new Error("Result is not a finite number.");
  }

  const normalizedResult = Math.abs(result) < FLOATING_POINT_TOLERANCE ? 0 : result;
  const formattedResult = Number.parseFloat(normalizedResult.toPrecision(DISPLAY_PRECISION));
  return String(formattedResult);
}

function evaluateAndRender() {
  try {
    display.value = evaluateExpression(display.value);
    setStatus("");
  } catch {
    setStatus("Invalid expression");
  }
}

buttons.addEventListener("click", (event) => {
  const button = event.target.closest("button");
  if (!button) {
    return;
  }

  const action = button.dataset.action;
  const value = button.dataset.value;

  if (action === "clear") {
    display.value = "";
    setStatus("");
    return;
  }

  if (action === "delete") {
    display.value = display.value.slice(0, -1);
    setStatus("");
    return;
  }

  if (action === "evaluate") {
    evaluateAndRender();
    return;
  }

  if (value) {
    appendValue(value);
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    evaluateAndRender();
    return;
  }

  if (event.key === "Backspace") {
    display.value = display.value.slice(0, -1);
    return;
  }

  if (event.key === "Escape") {
    display.value = "";
    setStatus("");
    return;
  }

  if (/^[A-Za-z]$/.test(event.key)) {
    if (canAppendIdentifierCharacter(event.key)) {
      appendValue(event.key);
    }
    return;
  }

  if (/^[0-9+\-*/().^]$/.test(event.key)) {
    appendValue(event.key);
  }
});
