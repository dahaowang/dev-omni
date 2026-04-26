# DevOmni Agent Notes

## Project Overview

DevOmni is an Electron desktop developer toolbox built with React 18, TypeScript, Vite, and Tailwind CSS.

Primary entry points:

- `main.js`: Electron main process. It currently only uses Electron and Node built-ins.
- `index.tsx`: React mount point, wraps the app in `ThemeProvider`.
- `App.tsx`: Tool routing, sidebar state, favorites, settings modal, and Smart Paste integration.
- `components/Sidebar.tsx`: Navigation metadata for all tools.
- `components/tools/*`: Individual tool implementations. Most tools are self-contained React components.
- `context/ThemeContext.tsx`: Theme, font, and editor settings persisted in `localStorage`.
- `utils/clipboardDetection.ts`: Smart Paste detection for JWT, JSON, SQL, hex colors, URLs, timestamps, and cron expressions.

## Local Workflow

- Prefix shell commands with `rtk`, for example `rtk npm run build`.
- Use `rg`/`rg --files` for searching.
- Prefer surgical edits. Do not refactor adjacent tool code unless the request requires it.
- There is no test framework configured. Current verification is typecheck plus build.

Useful commands:

```bash
rtk npm exec tsc -- --noEmit
rtk npm exec vite -- build
rtk npm run build
rtk npm run electron:dev
```

`npm run build` runs `clean:release`, TypeScript, Vite, then `electron-builder`.

## Packaging And Size Notes

The app intentionally keeps `dependencies` empty in `package.json`. Frontend libraries such as React, Lucide, QR, YAML, cron, and JSON repair live in `devDependencies` because Vite bundles them into `dist/`.

Do not move frontend-only libraries back into `dependencies` unless the Electron main process needs to `require` them at runtime. If production dependencies are present, electron-builder packages `node_modules` into `app.asar`, which previously inflated `app.asar` from about `0.6M` to about `31M`.

Expected optimized `app.asar` contents:

- `/dist`
- `/dist/assets/*`
- `/dist/index.html`
- `/main.js`
- `/package.json`

There should be no `/node_modules` entries in `release/mac-arm64/DevOmni.app/Contents/Resources/app.asar`.

Electron itself remains the dominant package size. The macOS `.app` includes Electron Framework, so the final zip is still around 100MB even after removing bundled `node_modules`.

`release/` is ignored and should not be committed.

## Styling Notes

Tailwind uses semantic CSS variable colors defined in `index.css` and mapped in `tailwind.config.js`.

Keep Tailwind `content` paths scoped to project source files. Avoid broad globs like `./**/*.{js,ts,jsx,tsx}` because they scan `node_modules` and slow builds.

Themes currently include `dark`, `light`, `graphite`, `cream`, and `glass`.

## Known Warnings

Vite currently warns that the generated JS chunk is larger than 500KB. This is expected for the current single-bundle app and was not addressed by the packaging-size optimization. A future optimization could use dynamic imports per tool.

electron-builder may warn that `description` and `author` are missing in `package.json`; this is metadata only.
