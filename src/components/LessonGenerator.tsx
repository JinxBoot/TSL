import React, { useEffect, useState } from 'react'

const KNOWN_LANGUAGES = [
  'javascript','typescript','tailwind','css','html','python','java','c','c++','c#','go','rust','php','ruby','kotlin','swift','scala'
]

type Lesson = {
  title: string
  steps: string[]
  type?: string
}

const LS_KEYS = {
  lang: 'tsl_lang_v1',
  topic: 'tsl_topic_v1',
  customLanguages: 'tsl_custom_langs_v1',
  lessons: 'tsl_lessons_v1'
}

export default function LessonGenerator(){
  const [lang, setLang] = useState<string>('typescript')
  const [topic, setTopic] = useState<string>('basics')
  const [apiKey, setApiKey] = useState<string>('')
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [status, setStatus] = useState<string>('')
  const [customLanguages, setCustomLanguages] = useState<string[]>([])
  const [useBuiltInAI, setUseBuiltInAI] = useState<boolean>(true)

  useEffect(()=>{
    // load persisted state from localStorage so the app "just works" when opened via index.html
    try{
      const savedLang = localStorage.getItem(LS_KEYS.lang)
      const savedTopic = localStorage.getItem(LS_KEYS.topic)
      const savedCustom = localStorage.getItem(LS_KEYS.customLanguages)
      const savedLessons = localStorage.getItem(LS_KEYS.lessons)
      if(savedLang) setLang(savedLang)
      if(savedTopic) setTopic(savedTopic)
      if(savedCustom) setCustomLanguages(JSON.parse(savedCustom))
      if(savedLessons) setLessons(JSON.parse(savedLessons))
    }catch(e){
      console.warn('Failed to read localStorage', e)
    }
  }, [])

  useEffect(()=>{ localStorage.setItem(LS_KEYS.lang, lang) }, [lang])
  useEffect(()=>{ localStorage.setItem(LS_KEYS.topic, topic) }, [topic])
  useEffect(()=>{ localStorage.setItem(LS_KEYS.customLanguages, JSON.stringify(customLanguages)) }, [customLanguages])
  useEffect(()=>{ localStorage.setItem(LS_KEYS.lessons, JSON.stringify(lessons)) }, [lessons])

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

    // If API key provided and user chooses remote, call OpenAI Chat Completion
    if(apiKey && !useBuiltInAI){
      try{
        const prompt = `Create a short beginner-friendly lesson plan for learning ${selection}. Provide a title and 5 ordered steps with short explanations. Respond as JSON: { \"title\": string, \"steps\": [\"...\",\"...\"] }`;

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
        const raw = data?.choices?.[0]?.message?.content || ''
        let parsed
        try{ parsed = JSON.parse(raw) }catch(e){
          const m = raw.match(/\{[\s\S]*\}/)
          parsed = m ? JSON.parse(m[0]) : null
        }
        if(parsed && parsed.title && Array.isArray(parsed.steps)){
          setLessons([{title: parsed.title, steps: parsed.steps, type: 'ai-remote'}])
          setStatus('Done')
          return
        }
        setStatus('AI returned unexpected structure; falling back to built-in generator')
      }catch(err){
        console.error(err)
        setStatus('AI call failed; falling back to built-in generator')
      }
    }

    // Built-in "no API key" AI generator (template + randomized phrasing)
    const generated = generateBuiltInAI(lang, topic)
    setLessons([generated])
    setStatus('Done (local AI)')
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
          <div className="mt-2 text-xs text-slate-600">The app uses the built-in local AI by default (no API key required). Toggle below if you want to attempt a remote call using a key.</div>
          <div className="mt-2">
            <label className="inline-flex items-center gap-2">
              <input type="checkbox" checked={useBuiltInAI} onChange={e=>setUseBuiltInAI(e.target.checked)} />
              <span className="text-sm">Use built-in AI (no API key)</span>
            </label>
          </div>
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

// A richer rule-based "local AI" generator that produces varied, human-friendly lesson plans
function generateBuiltInAI(lang:string, topic:string): Lesson{
  const titleTemplates = [
    `Learn ${lang}: ${topic} in 30 minutes`,
    `${capitalize(lang)} — quick ${topic} guide for beginners`,
    `${capitalize(lang)} ${topic}: A tiny hands-on lesson`,
    `${capitalize(lang)} basics: ${topic} explained`
  ]

  const stepIntros = [
    `Background — why this matters and where you'll use it.`,
    `Setup — quick steps to get a working environment ready.`,
    `Core ideas — the essential concepts to understand.`,
    `Walkthrough — a short hands-on example you can try now.`,
    `Next steps — further resources and practice suggestions.`
  ]

  // small variations to make steps feel less templated
  const phrasingVariants = [
    (s:string)=>s,
    (s:string)=>`Tip: ${s.toLowerCase()}`,
    (s:string)=>`${s} (try this yourself!)`,
    (s:string)=>`${s} — short example included.`
  ]

  function pick<T>(arr:T[]) { return arr[Math.floor(Math.random()*arr.length)] }

  const chosenTitle = pick(titleTemplates)
  const baseSteps = stepIntros.map((intro, idx)=>{
    switch(idx){
      case 0:
        return `${intro} ${generateIntroFor(lang)}.`
      case 1:
        return `${intro} ${generateSetupFor(lang)}.`
      case 2:
        return `${intro} ${generateCoreFor(lang)}.`
      case 3:
        return `${intro} ${generateExampleFor(lang, topic)}.`
      case 4:
        return `${intro} ${generateNextStepsFor(lang)}.`
      default:
        return intro
    }
  })

  const steps = baseSteps.map((s,i)=> pick(phrasingVariants)(s))

  return { title: chosenTitle, steps, type: 'ai-local' }
}

function generateIntroFor(lang:string){
  return `A brief description of ${lang} and common uses`;
}

function generateSetupFor(lang:string){
  // simple, safe instructions that generally apply
  const examples = [
    `Open a browser-based REPL or install the official toolchain`,
    `Use an online playground (if available) or install a minimal SDK`,
    `Create a new project folder and initialize the environment with recommended defaults`
  ]
  return examples[Math.floor(Math.random()*examples.length)]
}

function generateCoreFor(lang:string){
  const examples = {
    javascript: 'variables, functions, and DOM basics',
    typescript: 'types, interfaces, and transpilation to JavaScript',
    python: 'syntax, data structures, and scripting basics',
    default: 'core syntax, primary data types, and common patterns'
  }
  return (examples as any)[lang] || examples.default
}

function generateExampleFor(lang:string, topic:string){
  // keep examples short and safe for browser
  if(lang.includes('js') || lang === 'typescript' || lang === 'javascript'){
    return `A tiny ${lang} snippet showing ${topic}: e.g. a function and console output`
  }
  return `A concise example that demonstrates ${topic} in ${lang}`
}

function generateNextStepsFor(lang:string){
  return `Practice with small exercises, read an official tutorial, and build a mini project`
}
