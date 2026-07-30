import React from 'react'
import LessonGenerator from './components/LessonGenerator'

export default function App() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-4xl bg-white rounded-xl shadow-lg p-6">
        <header className="mb-6">
          <h1 className="text-2xl font-bold">TSL — Teach Select Learn</h1>
          <p className="text-sm text-slate-600">Choose a language or topic and let the AI create interactive lessons.</p>
        </header>

        <LessonGenerator />

        <footer className="text-xs text-slate-400 mt-6">
          Built with TypeScript + React + Tailwind. Paste an OpenAI API key to enable advanced AI lessons, or use the built-in generator.
        </footer>
      </div>
    </div>
  )
}
