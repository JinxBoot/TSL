## Static HTML5 demo

I've added a small static HTML5 fallback demo to the repository for users who want a no-build, no-Node preview of TSL:

- `index-static.html` — an HTML5 page that includes a tiny lesson-generator UI
- `static/styles.css` — minimal styles for the demo
- `static/main.js` — a small vanilla-JS fallback lesson generator (no AI, local only)

How to use

- Open `index-static.html` directly in a browser, or serve the repo using a static server (e.g., `npx serve` or `python -m http.server`).
- The existing React + TypeScript app is still in `src/` and is the default development experience (`npm run dev`).

Next steps I can take (pick one):

A) Publish the production build (`dist/`) to GitHub Pages or commit a build output so the static site is directly viewable. This requires running the build locally or in CI and committing the output.

B) Convert the React/TypeScript app into a vanilla HTML/JS app by rewriting components. This is more involved — I can scaffold the rewrite and convert core screens (e.g., the lesson generator) step-by-step.

C) Add a lightweight serverless API or client-side persistence for saving custom languages.

Tell me which next step you want me to take and I will proceed.
