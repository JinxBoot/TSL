import React, { useEffect, useState } from 'react'

const KNOWN_LANGUAGES = [
  'javascript','typescript','tailwind','css','html','python','java','c','c++','c#','go','rust','php','ruby','kotlin','swift','scala'
]

const ICON_MAP: Record<string,string> = {
  javascript: 'js',
  typescript: 'ts',
  tailwind: 'tailwind',
  css: 'css',
  html: 'html',
  python: 'python',
  java: 'java',
  c: 'c',
  'c++': 'cpp',
  'c#': 'csharp',
  go: 'go',
  rust: 'rust',
  php: 'php',
  ruby: 'ruby',
  kotlin: 'kotlin',
  swift: 'swift',
  scala: 'scala'
}

type Lesson = {
  title: string
  steps?: string[]
  format?: string
  payload?: any
}

const LS_KEYS = {
  lang: 'tsl_lang_v1',
  topic: 'tsl_topic_v1',
  customLanguages: 'tsl_custom_langs_v1',
  lessons: 'tsl_lessons_v1',
  lessonType: 'tsl_lesson_type_v1'
}

const LESSON_TYPES = [
  { id: 'quick-lesson', label: 'Quick Lesson' },
  { id: 'flashcards', label: 'Flashcards' },
  { id: 'multiple-choice', label: 'Multiple Choice' },
  { id: 'fill-blank', label: 'Fill-in-the-Blank' },
  { id: 'coding-exercise', label: 'Coding Exercise' },
  { id: 'translation', label: 'Translation' }
]

export default function LessonGenerator(){
  const [lang, setLang] = useState<string>('typescript')
  const [topic, setTopic] = useState<string>('basics')
  const [apiKey, setApiKey] = useState<string>('')
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [status, setStatus] = useState<string>('')
  const [customLanguages, setCustomLanguages] = useState<string[]>([])
  const [useBuiltInAI, setUseBuiltInAI] = useState<boolean>(true)
  const [lessonType, setLessonType] = useState<string>('quick-lesson')

  useEffect(()=>{
    try{
      const savedLang = localStorage.getItem(LS_KEYS.lang)
      const savedTopic = localStorage.getItem(LS_KEYS.topic)
      const savedCustom = localStorage.getItem(LS_KEYS.customLanguages)
      const savedLessons = localStorage.getItem(LS_KEYS.lessons)
      const savedType = localStorage.getItem(LS_KEYS.lessonType)
      if(savedLang) setLang(savedLang)
      if(savedTopic) setTopic(savedTopic)
      if(savedCustom) setCustomLanguages(JSON.parse(savedCustom))
      if(savedLessons) setLessons(JSON.parse(savedLessons))
      if(savedType) setLessonType(savedType)
    }catch(e){
      console.warn('Failed to read localStorage', e)
    }
  }, [])

  useEffect(()=>{ localStorage.setItem(LS_KEYS.lang, lang) }, [lang])
  useEffect(()=>{ localStorage.setItem(LS_KEYS.topic, topic) }, [topic])
  useEffect(()=>{ localStorage.setItem(LS_KEYS.customLanguages, JSON.stringify(customLanguages)) }, [customLanguages])
  useEffect(()=>{ localStorage.setItem(LS_KEYS.lessons, JSON.stringify(lessons)) }, [lessons])
  useEffect(()=>{ localStorage.setItem(LS_KEYS.lessonType, lessonType) }, [lessonType])

  const allLanguages = Array.from(new Set([...KNOWN_LANGUAGES, ...customLanguages]))

  function isCodingLanguage(input: string){
    const normalized = input.trim().toLowerCase()
    if(!normalized) return false
    if(allLanguages.includes(normalized)) return true
    for(const l of allLanguages){
      if(l.includes(normalized) || normalized.includes(l)) return true
    }
    return false
  }

  async function generateLesson(){
    setStatus('Generating...')
    const selection = `${lang} — ${topic}`

    // remote AI path (optional)
    if(apiKey && !useBuiltInAI){
      try{
        const prompt = `Create a ${lessonType} for ${selection}. Produce a JSON object appropriate to the format. Keep it concise.`
        const resp = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          },
          body: JSON.stringify({ model: 'gpt-4o-mini', messages:[{role:'user', content: prompt}], max_tokens: 400 })
        })
        const data = await resp.json()
        const raw = data?.choices?.[0]?.message?.content || ''
        let parsed
        try{ parsed = JSON.parse(raw) }catch(e){
          const m = raw.match(/\{[\s\S]*\}/)
          parsed = m ? JSON.parse(m[0]) : null
        }
        if(parsed && parsed.title){
          setLessons([{ title: parsed.title, payload: parsed, format: lessonType }])
          setStatus('Done (remote AI)')
          return
        }
      }catch(err){
        console.error(err)
        setStatus('Remote AI failed; falling back to built-in')
      }
    }

    // built-in generator with support for multiple lesson types
    const generated = generateBuiltInAI(lang, topic, lessonType)
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

  const selectedIcon = ICON_MAP[lang]
  const iconUrl = selectedIcon ? `https://skillicons.dev/icons?i=${selectedIcon}` : undefined

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
        <div>
          <label className="block text-sm font-medium">Language</label>
          <div className="mt-1 flex items-center gap-2">
            {iconUrl && <img src={iconUrl} alt="icon" width={28} height={28} />}
            <select value={lang} onChange={e=>setLang(e.target.value)} className="block w-full rounded border px-3 py-2">
              {allLanguages.map(l=> <option key={l} value={l}>{capitalize(l)}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium">Topic</label>
          <input value={topic} onChange={e=>setTopic(e.target.value)} className="mt-1 block w-full rounded border px-3 py-2" />
        </div>

        <div>
          <label className="block text-sm font-medium">Lesson Type</label>
          <select value={lessonType} onChange={e=>setLessonType(e.target.value)} className="mt-1 block w-full rounded border px-3 py-2">
            {LESSON_TYPES.map(t=> <option key={t.id} value={t.id}>{t.label}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium">OpenAI API Key (optional)</label>
          <input value={apiKey} onChange={e=>setApiKey(e.target.value)} placeholder="sk-... or leave blank" className="mt-1 block w-full rounded border px-3 py-2" />
          <div className="mt-2 text-xs text-slate-600">Using built-in AI by default (no key). Uncheck to attempt remote AI with a key.</div>
          <div className="mt-2">
            <label className="inline-flex items-center gap-2">
              <input type="checkbox" checked={useBuiltInAI} onChange={e=>setUseBuiltInAI(e.target.checked)} />
              <span className="text-sm">Use built-in AI (no API key)</span>
            </label>
          </div>
        </div>
      </div>

      <div className="mt-4 flex gap-2">
        <button onClick={generateLesson} className="px-4 py-2 bg-indigo-600 text-white rounded">Generate</button>
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
            <LessonRenderer key={idx} lesson={l} />
          ))}
        </div>
      </div>
    </div>
  )
}

function LessonRenderer({ lesson }:{ lesson:Lesson }){
  const format = lesson.format || 'quick-lesson'
  if(format === 'flashcards' && lesson.payload && Array.isArray(lesson.payload.cards)){
    return (
      <div className="p-4 border rounded bg-slate-50">
        <h4 className="font-bold">{lesson.title}</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
          {lesson.payload.cards.map((c:any, i:number)=>(
            <Flashcard key={i} front={c.front} back={c.back} />
          ))}
        </div>
      </div>
    )
  }

  if(format === 'multiple-choice' && lesson.payload && Array.isArray(lesson.payload.questions)){
    return (
      <div className="p-4 border rounded bg-slate-50">
        <h4 className="font-bold">{lesson.title}</h4>
        <div className="space-y-4 mt-3">
          {lesson.payload.questions.map((q:any, i:number)=> (
            <div key={i} className="p-3 border rounded">
              <div className="font-medium">{i+1}. {q.question}</div>
              <div className="mt-2 space-y-2">
                {q.options.map((opt:string, oi:number)=>(
                  <div key={oi} className="flex items-center gap-2">
                    <input type="radio" name={`mc-${i}`} />
                    <div>{opt}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if(format === 'fill-blank' && lesson.payload && Array.isArray(lesson.payload.items)){
    return (
      <div className="p-4 border rounded bg-slate-50">
        <h4 className="font-bold">{lesson.title}</h4>
        <div className="space-y-3 mt-3">
          {lesson.payload.items.map((it:any, i:number)=> (
            <div key={i}>
              <div className="text-sm">{it.sentence.replace('_', '_____')}</div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if(format === 'coding-exercise' && lesson.payload){
    return (
      <div className="p-4 border rounded bg-slate-50">
        <h4 className="font-bold">{lesson.title}</h4>
        <div className="mt-3">
          <div className="font-medium">Problem</div>
          <div className="mt-2 text-sm whitespace-pre-wrap">{lesson.payload.prompt}</div>
          {lesson.payload.starter && (
            <pre className="mt-3 p-3 bg-white rounded border overflow-auto"><code>{lesson.payload.starter}</code></pre>
          )}
          {lesson.payload.solution && (
            <details className="mt-3"><summary className="cursor-pointer">Show solution</summary><pre className="mt-2 p-3 bg-white rounded border overflow-auto"><code>{lesson.payload.solution}</code></pre></details>
          )}
        </div>
      </div>
    )
  }

  // default: simple steps list
  return (
    <div className="p-4 border rounded bg-slate-50">
      <h4 className="font-bold">{lesson.title}</h4>
      {lesson.steps && (
        <ol className="list-decimal list-inside mt-2 space-y-1">
          {lesson.steps.map((s,i)=>(<li key={i} className="text-sm text-slate-700">{s}</li>))}
        </ol>
      )}
    </div>
  )
}

function Flashcard({ front, back }:{ front:string, back:string }){
  const [flipped, setFlipped] = useState(false)
  return (
    <div className="p-4 border rounded bg-white">
      <div className="font-medium">{flipped ? back : front}</div>
      <button className="mt-2 px-3 py-1 border rounded" onClick={()=>setFlipped(f=>!f)}>{flipped ? 'Show front' : 'Show back'}</button>
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

// Built-in generators for the different lesson types
function generateBuiltInAI(lang:string, topic:string, lessonType:string): Lesson{
  const title = `${capitalize(lang)} — ${capitalize(topic)} (${LESSON_TYPES.find(t=>t.id===lessonType)?.label})`

  switch(lessonType){
    case 'flashcards': {
      const cards = [
        { front: `What is ${lang}?`, back: `${lang} is ... a short description suitable for beginners.` },
        { front: `How do you set up ${lang}?`, back: `Install or open a playground; follow minimal setup steps.` },
        { front: `Key concept in ${lang}`, back: `An important concept explained briefly.` }
      ]
      return { title, format: 'flashcards', payload: { cards } }
    }

    case 'multiple-choice': {
      const questions = [
        { question: `Which statement about ${lang} is true?`, options: [`It's mainly used for web`, `It's a database`, `It's a CSS framework`], answer: 0 },
        { question: `What is a core feature of ${lang}?`, options: [`Static typing`, `Photos`, `Networking`], answer: 0 }
      ]
      return { title, format: 'multiple-choice', payload: { questions } }
    }

    case 'fill-blank': {
      const items = [
        { sentence: `${capitalize(lang)} files often end with ____` },
        { sentence: `A common data type in ${lang} is ____` }
      ]
      return { title, format: 'fill-blank', payload: { items } }
    }

    case 'coding-exercise': {
      const prompt = `Create a small ${lang} program that demonstrates ${topic}. Keep it short and runnable in a minimal environment.`
      const starter = generateStarterFor(lang)
      const solution = generateSolutionFor(lang, topic)
      return { title, format: 'coding-exercise', payload: { prompt, starter, solution } }
    }

    case 'translation': {
      const items = [
        { source: 'Hello, how are you?', target: '...' },
        { source: 'I would like a cup of tea.', target: '...' }
      ]
      return { title, format: 'translation', payload: { items } }
    }

    default: {
      const steps = [
        `What is ${lang}? A short intro and where it's used.`,
        `Setup: how to install or configure tooling for ${lang}.`,
        `Core concepts: 3–5 fundamentals you must know.`,
        `Hands-on: a small guided example you can try in the browser or editor.`,
        `Next steps and resources to keep learning.`
      ]
      return { title, format: 'quick-lesson', steps }
    }
  }
}

function generateStarterFor(lang:string){
  if(lang.includes('js') || lang === 'typescript' || lang === 'javascript'){
    return `console.log('Hello from ${lang}')`
  }
  if(lang === 'python') return `print('Hello from python')`
  return `// starter code for ${lang}`
}

function generateSolutionFor(lang:string, topic:string){
  if(lang.includes('js') || lang === 'typescript' || lang === 'javascript'){
    return `function greet(){\n  console.log('Hello from ${lang} — ${topic} example')\n}\ngreet()`
  }
  if(lang === 'python') return `def greet():\n    print('Hello from python — ${topic} example')\n\ngreet()`
  return `// solution for ${lang}`
}
