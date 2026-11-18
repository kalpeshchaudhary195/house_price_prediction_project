# House Price Prediction — React conversion

## Run it
```
npm install
npm run dev
```
Vite will start a dev server (usually http://localhost:5173).

## What's done
- Full Vite + React 18 + React Router 6 project scaffold
- `src/index.css` — your original stylesheet, with the two checkbox-hack tricks
  (dark mode, mobile nav) replaced by real React state:
  - `ThemeContext` toggles `data-theme="dark"` on `.site-wrapper` (was `#theme-toggle:checked ~ .site-wrapper`)
  - `Navbar`'s `menuOpen` state toggles an `.open` class (was `.nav-toggle-checkbox:checked ~ ...`)
- `ThemeContext` — persists theme to `localStorage`, respects system preference on first visit (same behavior as your old `initThemeToggle()`)
- `ToastContext` — replaces the old `window.showToast()` global; call `useToast().showToast(message, type, title)` from any component
- `src/utils/validators.js` — `isValidEmail`, `isValidPhone`, `passwordStrength` pulled out of `validation.js` so any page's form can reuse them
- `Navbar`, `Footer`, `Layout`, `ThemeToggle` — shared chrome, converted from `about.html`
- `About` page — full 1:1 conversion of `about.html`

## Still stubbed (need the original page content)
`Home`, `Prediction`, `Features`, `Feedback`, `Contact`, `Profile`, `Login`,
`Signup`, `Privacy`, `Terms` are placeholder components in `src/pages/` so
routing works end-to-end. Send over each page's HTML (and I'll keep the
"one by one" order) and I'll convert it the same way — markup to JSX,
`<form>` submit handlers to React state + the shared validators, checkbox
hacks to real state, `window.showToast` calls to `useToast()`.

## Not yet wired up
- The prediction form's actual estimate calculation (was `sessionStorage`-based
  in `validation.js`) — will move into local state / a small hook once I have
  `prediction.html`
- The home-page image slider (autoplay, swipe, dots) — will become a
  `useImageSlider` hook once I have `home.html`'s slide data
