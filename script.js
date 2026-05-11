const display = document.getElementById("display");
const statusEl = document.getElementById("status");
const buttons = document.querySelector(".buttons");
const RESULT_SIGNIFICANT_FIGURES = 12;

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

function evaluateExpression(expression) {
  if (!expression.trim()) {
    return "";
  }

  const hasInvalidCharacters = /[^\d+\-*/().\sA-Za-z_^]/.test(expression);
  if (hasInvalidCharacters) {
    throw new Error("Expression contains unsupported characters.");
  }

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
  return String(formattedResult);
}

function evaluateAndRender() {
  try {
    display.value = evaluateExpression(display.value);
    setStatus("");
  } catch (error) {
    setStatus(error instanceof Error ? error.message : "Invalid expression");
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
