# Scientific-Calculator-Webapp

A static scientific calculator web app that can be hosted with GitHub Pages.

## Features

- Core arithmetic with operator precedence and power (`^`)
- Scientific functions: `sin`, `cos`, `tan`, `asin`, `acos`, `atan`, `log`, `ln`, `sqrt`, `abs`, `exp`, `fact`
- Constants: `PI`, `E`, and reusable `ANS`
- Angle mode toggle (`RAD` / `DEG`) for trigonometric functions
- Keyboard support (`Enter` evaluate, `Backspace` delete, `Escape` clear, `Ctrl+M` toggle angle mode)
- Short expression history preview via `HIST`
- Industrial-style dark UI with grouped control/function/operator buttons

## Run locally

Open `index.html` in a browser.

## Validate

Run the lightweight test suite:

```bash
node tests.js
```

## Deploy on GitHub Pages

This repository includes a workflow at:

`.github/workflows/deploy-pages.yml`

To publish:

1. Go to **Settings → Pages**.
2. Under **Build and deployment**, set **Source** to **GitHub Actions**.
3. Push to the `main` branch (or run the workflow manually from **Actions**).
4. Open the deployed URL shown in the workflow run summary.
