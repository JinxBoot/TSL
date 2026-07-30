import React, { useState } from 'react'

const KNOWN_LANGUAGES = [
  'javascript','typescript','tailwind','css','html','python','java','c','c++','c#','go','rust','php','ruby','kotlin','swift','scala'
]

type Lesson = {
  title: string
  steps: string[]
}

export default function LessonGenerator(){
  const [lang, setLang] = useState<string>('typescript')
  const [topic, setTopic] = useState<string>('basics')
  const [apiKey, setApiKey] = useState<string>('')
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [status, setStatus] = useState<string>('')
  const [customLanguages, setCustomLanguages] = useState<string[]>([])

  const allLanguages = Array.from(new Set([...KNOWN_LANGUAGES, ...customLanguages]))

  function isCodingLanguage(input: string){
    const normalized = input.trim().toLowerCase()
    if(!normalized) return false
    // direct match
    if(allLanguages.includes(normalized)) return true
    // fuzzy: contains or startsWith
    for(const l of allLanguages){
      if(l.includes(normalized) || normalized.includes(l)) return true
    }
    return false
  }

  async function generateLesson(){
    setStatus('Generating...')
    const selection = `${lang} — ${topic}`

    // If API key provided, call OpenAI Chat Completion
    if(apiKey){
      try{
        const prompt = `Create a short beginner-friendly lesson plan for learning ${selection}. Provide a title and 5 ordered steps with short explanations.
Respond as JSON: { "title": string, "steps": ["...","..."] }`;

        const resp = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [{role:'user', content: prompt}],
            max_tokens: 400
          })
        })

        const data = await resp.json()
        // try to parse JSON from assistant
        const raw = data?.choices?.[0]?.message?.content || ''
        let parsed
        try{ parsed = JSON.parse(raw) }catch(e){
          // fallback: attempt to extract first JSON block
          const m = raw.match(/\{[\s\S]*\}/)
          parsed = m ? JSON.parse(m[0]) : null
        }
        if(parsed && parsed.title && Array.isArray(parsed.steps)){
          setLessons([{title: parsed.title, steps: parsed.steps}])
          setStatus('Done')
          return
        }
        setStatus('AI returned unexpected structure; falling back to built-in generator')
      }catch(err){
        console.error(err)
        setStatus('AI call failed; falling back to built-in generator')
      }
    }

    // Built-in fallback generator
    const fallback: Lesson = {
      title: `${capitalize(lang)}: ${capitalize(topic)} — Quick Start`,
      steps: [
        `What is ${lang}? A short intro and where it's used.`,
        `Setup: how to install or configure tooling for ${lang}.`,
        `Core concepts: 3–5 fundamentals you must know.`,
        `Hands-on: a small guided example you can try in the browser or editor.`,
        `Next steps and resources to keep learning.`
      ]
    }
    setLessons([fallback])
    setStatus('Done (fallback)')
  }

  function addLanguage(newLang: string){
    const n = newLang.trim().toLowerCase()
    if(!n) return
    if(isCodingLanguage(n)){
      setStatus(`${newLang} already known as a coding language`)
      return
    }
    setCustomLanguages(prev => [...prev, n])
    setStatus(`Added ${newLang} to custom languages`)
  }

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium">Language</label>
          <select value={lang} onChange={e=>setLang(e.target.value)} className="mt-1 block w-full rounded border px-3 py-2">
            {allLanguages.map(l=> (
              <option key={l} value={l}>{capitalize(l)}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium">Topic</label>
          <input value={topic} onChange={e=>setTopic(e.target.value)} className="mt-1 block w-full rounded border px-3 py-2" />
        </div>

        <div>
          <label className="block text-sm font-medium">OpenAI API Key (optional)</label>
          <input value={apiKey} onChange={e=>setApiKey(e.target.value)} placeholder="sk-... or leave blank" className="mt-1 block w-full rounded border px-3 py-2" />
        </div>
      </div>

      <div className="mt-4 flex gap-2">
        <button onClick={generateLesson} className="px-4 py-2 bg-indigo-600 text-white rounded">Generate Lesson</button>
        <button onClick={()=>{ setLessons([]); setStatus('') }} className="px-4 py-2 border rounded">Clear</button>
      </div>

      <div className="mt-4">
        <h3 className="font-medium">Language checker</h3>
        <LanguageChecker onAdd={addLanguage} isCodingLanguage={isCodingLanguage} />
      </div>

      <div className="mt-6">
        <h3 className="font-semibold">Status</h3>
        <div className="text-sm text-slate-600">{status}</div>

        <div className="mt-4 space-y-4">
          {lessons.map((l,idx)=> (
            <div key={idx} className="p-4 border rounded bg-slate-50">
              <h4 className="font-bold">{l.title}</h4>
              <ol className="list-decimal list-inside mt-2 space-y-1">
                {l.steps.map((s,i)=> <li key={i} className="text-sm text-slate-700">{s}</li>)}
              </ol>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function capitalize(s:string){
  if(!s) return s
  return s[0].toUpperCase()+s.slice(1)
}

function LanguageChecker({ onAdd, isCodingLanguage }:{ onAdd:(s:string)=>void, isCodingLanguage:(s:string)=>boolean }){
  const [val, setVal] = useState('')
  const [res, setRes] = useState<string | null>(null)

  function check(){
    const ok = isCodingLanguage(val)
    setRes(ok ? 'Yes — recognized as a coding language' : 'No — not recognized')
  }

  return (
    <div className="mt-2">
      <div className="flex gap-2">
        <input value={val} onChange={e=>setVal(e.target.value)} placeholder="Type a language name e.g. 'elm'" className="flex-1 rounded border px-3 py-2" />
        <button onClick={check} className="px-3 py-2 bg-emerald-500 text-white rounded">Check</button>
        <button onClick={()=>{ onAdd(val); setVal(''); setRes(null) }} className="px-3 py-2 border rounded">Add</button>
      </div>
      {res && <div className="mt-2 text-sm text-slate-600">{res}</div>}
    </div>
  )
}
