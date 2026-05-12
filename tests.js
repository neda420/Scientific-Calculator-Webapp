const assert = require("node:assert/strict");
const {
  evaluateExpression,
  setAngleMode,
  getAngleMode,
  getHistory,
  resetCalculatorState
} = require("./script.js");
const EXPECTED_ASIN_1_RAD = String(
  Number.parseFloat((Math.PI / 2).toPrecision(12))
);

function runTest(name, fn) {
  try {
    resetCalculatorState();
    fn();
    console.log(`✓ ${name}`);
  } catch (error) {
    console.error(`✗ ${name}`);
    console.error(error);
    process.exitCode = 1;
  }
}

runTest("evaluates arithmetic precedence", () => {
  assert.equal(evaluateExpression("2+3*4"), "14");
});

runTest("evaluates right-associative power", () => {
  assert.equal(evaluateExpression("2^3^2"), "512");
});

runTest("evaluates scientific constants", () => {
  assert.ok(evaluateExpression("PI+E").startsWith("5.859"));
});

runTest("supports inverse trig in radian mode", () => {
  assert.equal(getAngleMode(), "RAD");
  assert.equal(evaluateExpression("asin(1)"), EXPECTED_ASIN_1_RAD);
});

runTest("supports trig in degree mode", () => {
  setAngleMode("DEG");
  assert.equal(evaluateExpression("sin(90)"), "1");
  assert.equal(evaluateExpression("asin(1)"), "90");
});

runTest("supports factorial", () => {
  assert.equal(evaluateExpression("fact(5)"), "120");
});

runTest("rejects invalid factorial", () => {
  assert.throws(() => evaluateExpression("fact(-1)"), /Factorial input must be a non-negative integer/);
});

runTest("enforces factorial upper boundary", () => {
  assert.equal(evaluateExpression("fact(170)"), "7.25741561531e+306");
  assert.throws(() => evaluateExpression("fact(171)"), /Factorial input is too large/);
});

runTest("tracks answer constant across evaluations", () => {
  assert.equal(evaluateExpression("2+3", { persistState: true }), "5");
  assert.equal(evaluateExpression("ANS*4", { persistState: true }), "20");
});

runTest("tracks history entries", () => {
  evaluateExpression("1+1", { persistState: true });
  evaluateExpression("2+2", { persistState: true });
  const items = getHistory();
  assert.equal(Array.isArray(items), true);
  assert.equal(items.length, 2);
});
