# TSL — Teach Select Learn

This repository is a starter site built with TypeScript + React + Tailwind CSS that generates coding lessons for selected languages and topics. It includes:

- A lesson generator UI that can optionally call OpenAI (paste your API key in the UI).
- A language checker to verify or add custom languages.

How to run locally:

1. Install dependencies:

   npm install

2. Start dev server:

   npm run dev

Open http://localhost:5173

Notes and next steps:

- The repo uses a simple fallback generator when no OpenAI API key is provided. To enable advanced AI-generated lessons, paste an OpenAI-compatible API key in the form.
- You can extend the language list in src/components/LessonGenerator.tsx or persist custom languages to localStorage or a backend.
- Consider adding interactive coding playgrounds (e.g., iframe-based sandboxes) and progress tracking.
