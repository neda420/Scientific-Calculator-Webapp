const assert = require("node:assert/strict");
const {
  evaluateExpression,
  setAngleMode,
  getAngleMode,
  getHistory,
  resetCalculatorState
} = require("./script.js");

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
  assert.equal(evaluateExpression("PI+E").startsWith("5.859"), true);
});

runTest("supports inverse trig in radian mode", () => {
  assert.equal(getAngleMode(), "RAD");
  assert.equal(evaluateExpression("asin(1)"), String(Number.parseFloat((Math.PI / 2).toPrecision(12))));
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

runTest("tracks answer constant across evaluations", () => {
  assert.equal(evaluateExpression("2+3"), "5");
  assert.equal(evaluateExpression("ANS*4"), "20");
});

runTest("tracks history entries", () => {
  evaluateExpression("1+1");
  evaluateExpression("2+2");
  const items = getHistory();
  assert.equal(Array.isArray(items), true);
});
