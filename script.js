const RESULT_SIGNIFICANT_FIGURES = 12;
const MAX_FACTORIAL_INPUT = 170; // Largest n where n! does not overflow to Infinity in IEEE-754 double precision.
const MAX_HISTORY_LENGTH = 15;
const HISTORY_PREVIEW_COUNT = 5;

const domAvailable = typeof document !== "undefined";
const display = domAvailable ? document.getElementById("display") : null;
const statusEl = domAvailable ? document.getElementById("status") : null;
const buttons = domAvailable ? document.querySelector(".buttons") : null;
const modeEl = domAvailable ? document.getElementById("mode") : null;
const modeToggleButton = domAvailable ? document.getElementById("mode-toggle") : null;

let angleMode = "RAD";
let lastAnswer = 0;
const history = [];

const allowedIdentifiers = new Set([
  "sin",
  "cos",
  "tan",
  "asin",
  "acos",
  "atan",
  "log",
  "ln",
  "sqrt",
  "abs",
  "exp",
  "fact",
  "PI",
  "E",
  "ANS"
]);

function setStatus(message = "") {
  if (!statusEl) return;
  statusEl.textContent = message;
}

function renderMode() {
  if (modeEl) {
    modeEl.textContent = `Mode: ${angleMode}`;
  }
  if (modeToggleButton) {
    modeToggleButton.textContent = angleMode;
  }
}

function setAngleMode(mode) {
  if (!["RAD", "DEG"].includes(mode)) {
    throw new Error("Invalid angle mode.");
  }
  angleMode = mode;
  renderMode();
}

function toggleAngleMode() {
  setAngleMode(angleMode === "RAD" ? "DEG" : "RAD");
  setStatus(`Angle mode set to ${angleMode}`);
}

function appendValue(value) {
  if (!display) {
    return;
  }
  display.value += value;
  setStatus("");
}

function canAppendIdentifierCharacter(character) {
  if (!display) {
    return false;
  }

  const currentIdentifierMatch = display.value.match(/[A-Za-z_]+$/);
  const currentIdentifier = currentIdentifierMatch ? currentIdentifierMatch[0] : "";
  const nextIdentifier = `${currentIdentifier}${character}`;

  return [...allowedIdentifiers].some((identifier) =>
    identifier.startsWith(nextIdentifier)
  );
}

function degreesToRadians(value) {
  return (value * Math.PI) / 180;
}

function radiansToDegrees(value) {
  return (value * 180) / Math.PI;
}

function factorial(value) {
  if (!Number.isInteger(value) || value < 0) {
    throw new Error("Factorial input must be a non-negative integer.");
  }

  if (value > MAX_FACTORIAL_INPUT) {
    throw new Error("Factorial input is too large.");
  }

  let result = 1;
  for (let i = 2; i <= value; i += 1) {
    result *= i;
  }
  return result;
}

function buildScope() {
  const useDegrees = angleMode === "DEG";
  return {
    sin: (value) => Math.sin(useDegrees ? degreesToRadians(value) : value),
    cos: (value) => Math.cos(useDegrees ? degreesToRadians(value) : value),
    tan: (value) => Math.tan(useDegrees ? degreesToRadians(value) : value),
    asin: (value) => {
      const result = Math.asin(value);
      return useDegrees ? radiansToDegrees(result) : result;
    },
    acos: (value) => {
      const result = Math.acos(value);
      return useDegrees ? radiansToDegrees(result) : result;
    },
    atan: (value) => {
      const result = Math.atan(value);
      return useDegrees ? radiansToDegrees(result) : result;
    },
    log: Math.log10,
    ln: Math.log,
    sqrt: Math.sqrt,
    abs: Math.abs,
    exp: Math.exp,
    fact: factorial,
    PI: Math.PI,
    E: Math.E,
    ANS: lastAnswer
  };
}

function tokenize(expression) {
  const tokens = [];
  let index = 0;

  while (index < expression.length) {
    const character = expression[index];

    if (/\s/.test(character)) {
      index += 1;
      continue;
    }

    if (/[0-9.]/.test(character)) {
      let numberValue = character;
      index += 1;

      while (index < expression.length && /[0-9.]/.test(expression[index])) {
        numberValue += expression[index];
        index += 1;
      }

      if ((numberValue.match(/\./g) || []).length > 1) {
        throw new Error("Invalid number format.");
      }

      tokens.push({ type: "number", value: Number(numberValue) });
      continue;
    }

    if (/[A-Za-z_]/.test(character)) {
      let identifier = character;
      index += 1;

      while (index < expression.length && /[A-Za-z_]/.test(expression[index])) {
        identifier += expression[index];
        index += 1;
      }

      tokens.push({ type: "identifier", value: identifier });
      continue;
    }

    if (/[+\-*/^]/.test(character)) {
      tokens.push({ type: "operator", value: character });
      index += 1;
      continue;
    }

    if (/[()]/.test(character)) {
      tokens.push({ type: "paren", value: character });
      index += 1;
      continue;
    }

    throw new Error("Expression contains unsupported characters.");
  }

  return tokens;
}

/**
 * Evaluate a calculator expression.
 * @param {string} expression
 * @param {{persistState?: boolean}} [options] When true, stores result in ANS and history.
 * @returns {string}
 */
function evaluateExpression(expression, options = {}) {
  const { persistState = false } = options;
  if (!expression.trim()) {
    return "";
  }

  const hasInvalidCharacters = /[^\d+\-*/().\sA-Za-z_^]/.test(expression);
  if (hasInvalidCharacters) {
    throw new Error("Expression contains unsupported characters.");
  }

  const scope = buildScope();
  const tokens = tokenize(expression);
  let currentIndex = 0;

  function peekToken() {
    return tokens[currentIndex];
  }

  function consumeToken() {
    const token = tokens[currentIndex];
    currentIndex += 1;
    return token;
  }

  function expectToken(type, value) {
    const token = consumeToken();
    if (!token || token.type !== type || token.value !== value) {
      throw new Error("Invalid expression.");
    }
  }

  function parsePrimary() {
    const token = peekToken();
    if (!token) {
      throw new Error("Invalid expression.");
    }

    if (token.type === "number") {
      consumeToken();
      return token.value;
    }

    if (token.type === "identifier") {
      const name = consumeToken().value;
      if (!allowedIdentifiers.has(name)) {
        throw new Error("Expression contains unsupported functions.");
      }

      const value = scope[name];
      if (typeof value === "function") {
        expectToken("paren", "(");
        const argument = parseExpressionTree();
        expectToken("paren", ")");
        return value(argument);
      }

      if (peekToken()?.type === "paren" && peekToken().value === "(") {
        throw new Error("Invalid expression.");
      }

      return value;
    }

    if (token.type === "paren" && token.value === "(") {
      consumeToken();
      const value = parseExpressionTree();
      expectToken("paren", ")");
      return value;
    }

    throw new Error("Invalid expression.");
  }

  function parseUnary() {
    const token = peekToken();
    if (token?.type === "operator" && token.value === "+") {
      consumeToken();
      return parseUnary();
    }

    if (token?.type === "operator" && token.value === "-") {
      consumeToken();
      return -parseUnary();
    }

    return parsePrimary();
  }

  function parsePower() {
    let value = parseUnary();
    const token = peekToken();
    if (token?.type === "operator" && token.value === "^") {
      consumeToken();
      value = Math.pow(value, parsePower());
    }
    return value;
  }

  function parseTerm() {
    let value = parsePower();

    while (true) {
      const token = peekToken();
      if (!token || token.type !== "operator" || !["*", "/"].includes(token.value)) {
        return value;
      }

      consumeToken();
      const nextValue = parsePower();
      value = token.value === "*" ? value * nextValue : value / nextValue;
    }
  }

  function parseExpressionTree() {
    let value = parseTerm();

    while (true) {
      const token = peekToken();
      if (!token || token.type !== "operator" || !["+", "-"].includes(token.value)) {
        return value;
      }

      consumeToken();
      const nextValue = parseTerm();
      value = token.value === "+" ? value + nextValue : value - nextValue;
    }
  }

  const result = parseExpressionTree();
  if (currentIndex !== tokens.length) {
    throw new Error("Invalid expression.");
  }

  if (!Number.isFinite(result)) {
    throw new Error("Result is not a finite number.");
  }

  const formattedResult = Number.parseFloat(
    result.toPrecision(RESULT_SIGNIFICANT_FIGURES)
  );
  const finalResult = String(formattedResult);

  if (persistState && finalResult !== "") {
    lastAnswer = Number(finalResult);
    addHistoryEntry(expression, finalResult);
  }

  return finalResult;
}

function addHistoryEntry(expression, result) {
  history.unshift({ expression, result });
  if (history.length > MAX_HISTORY_LENGTH) {
    history.pop();
  }
}

function getHistory() {
  return [...history];
}

function showHistory() {
  if (history.length === 0) {
    setStatus("No history yet");
    return;
  }

  const latest = history
    .slice(0, HISTORY_PREVIEW_COUNT)
    .map((entry) => `${entry.expression} = ${entry.result}`)
    .join(" | ");

  setStatus(latest);
}

function evaluateAndRender() {
  if (!display) {
    return;
  }

  try {
    const expression = display.value;
    const result = evaluateExpression(expression, { persistState: true });
    display.value = result;

    setStatus("");
  } catch (error) {
    setStatus(error instanceof Error ? error.message : "Invalid expression");
  }
}

if (buttons) {
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

    if (action === "toggle-mode") {
      toggleAngleMode();
      return;
    }

    if (action === "history") {
      showHistory();
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
}

if (domAvailable) {
  document.addEventListener("keydown", (event) => {
    if (!display) {
      return;
    }

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

    if (event.ctrlKey && event.key.toLowerCase() === "m") {
      toggleAngleMode();
      event.preventDefault();
      return;
    }

    if (/^[A-Za-z]$/.test(event.key)) {
      if (canAppendIdentifierCharacter(event.key)) {
        appendValue(event.key);
      } else {
        setStatus("Unsupported function or constant");
      }
      event.preventDefault();
      return;
    }

    if (/^[0-9+\-*/().^]$/.test(event.key)) {
      appendValue(event.key);
    }
  });

  renderMode();
}

if (typeof module !== "undefined") {
  module.exports = {
    evaluateExpression,
    tokenize,
    setAngleMode,
    getAngleMode: () => angleMode,
    getHistory,
    resetCalculatorState: () => {
      angleMode = "RAD";
      lastAnswer = 0;
      history.length = 0;
    }
  };
}
