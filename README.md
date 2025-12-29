# Simple Tracker (PWA)

Minimal mobile-first tracker for **weight**, **workouts**, and **calories**.

## Setup

- **Install**

```bash
npm install
```

- **Run dev**

```bash
npm run dev
```

- **Build**

```bash
npm run build
```

- **Preview production build**

```bash
npm run preview
```

## Local-only storage (offline)

All data is stored **locally in IndexedDB** via **Dexie** (no backend).

- Database: `src/db.ts`
- Local date format (YYYY-MM-DD): `src/lib/date.ts`
- Screens subscribe with `dexie-react-hooks` (`useLiveQuery`) so lists update instantly.

## Swipe gestures (mobile-first)

All rows use `framer-motion` drag gestures:

- **Swipe right** → edit (opens a bottom `Sheet`)
- **Swipe left** → delete (shows an **Undo** toast for ~5s)
- Desktop fallback is the `•••` menu on each row.

Implementation:

- `src/components/SwipeRow.tsx`

## PWA / Offline (airplane mode)

PWA is configured with `vite-plugin-pwa`:

- Manifest + SW config: `vite.config.ts`
- Service worker registration: `src/main.tsx`

To verify offline:

1. Run `npm run build`
2. Run `npm run preview`
3. In Chrome DevTools → Application:
   - Ensure Service Worker is active
   - Toggle **Offline** and refresh

The app should still load and all saved data remains available (IndexedDB).

# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
