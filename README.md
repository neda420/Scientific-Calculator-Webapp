# Scientific-Calculator-Webapp

A static scientific calculator web app that can be hosted with GitHub Pages.

## Features

- Core arithmetic with operator precedence and power (`^`)
- Scientific functions: `sin`, `cos`, `tan`, `asin`, `acos`, `atan`, `log`, `ln`, `sqrt`, `abs`, `exp`, `fact`
- Constants: `PI`, `E`, and reusable `ANS`
- Angle mode toggle (`RAD` / `DEG`) for trigonometric functions
- Keyboard support (`Enter` evaluate, `Backspace` delete, `Escape` clear, `Ctrl+M` toggle angle mode)
- Short expression history preview via `HIST`

## Run locally

Open `index.html` in a browser.

## Validate

Run the lightweight test suite:

```bash
node tests.js
```
