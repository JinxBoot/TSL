## Vanilla HTML5 port

A new lightweight, dependency-free version of the lesson generator has been added at `vanilla/`.

Files added:

- `vanilla/index.html` — the HTML5 page for the app
- `vanilla/styles.css` — minimal styles
- `vanilla/main.js` — a vanilla JavaScript port of the LessonGenerator component (client-only)

How to use

- Open `vanilla/index.html` directly in a browser, or serve the `vanilla/` directory with a static server (e.g., `npx serve vanilla` or `python -m http.server` from the vanilla/ folder).
- The page uses the built-in lesson generator by default. You can optionally provide an OpenAI-compatible API key and uncheck "Use built-in AI" to attempt remote AI generation (requests go to api.openai.com). Be careful with API keys in the browser.

Notes

- This is a client-only port intended as a drop-in HTML5 demo. It reproduces the main features of `src/components/LessonGenerator.tsx`, including multiple lesson types, a language checker, and localStorage persistence for custom languages and generated lessons.
- The original React + TypeScript application remains in `src/` and is still the primary development experience (`npm run dev`).

Next steps you might want:

- Replace the default `index.html` with the vanilla entry if you want the repository to serve the HTML5 page by default (I can update the root `index.html` to point to `vanilla/index.html`).
- Add a build step or CI job that publishes the vanilla folder to GitHub Pages.
- Improve styling and accessibility or add interactive live-editing for coding exercises.
