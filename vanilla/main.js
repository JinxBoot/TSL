// vanilla/main.js — vanilla JS port of the TSL lesson generator (client-only)
(function(){
  const KNOWN_LANGUAGES = ['javascript','typescript','tailwind','css','html','python','java','c','c++','c#','go','rust','php','ruby','kotlin','swift','scala']
  const LS_KEYS = { lang: 'tsl_lang_v1', topic: 'tsl_topic_v1', customLanguages: 'tsl_custom_langs_v1', lessons: 'tsl_lessons_v1', lessonType: 'tsl_lesson_type_v1' }

  // DOM refs
  const $ = sel => document.querySelector(sel)
  const languageSel = $('#language')
  const topicInput = $('#topic')
  const lessonTypeSel = $('#lessonType')
  const apiKeyInput = $('#apiKey')
  const useBuiltInChk = $('#useBuiltInAI')
  const generateBtn = $('#generate')
  const clearBtn = $('#clear')
  const lessonsDiv = $('#lessons')
  const statusDiv = $('#status')
  const langCheck = $('#langCheck')
  const checkBtn = $('#check')
  const addLangBtn = $('#addLang')
  const checkResult = $('#checkResult')

  let customLanguages = []
  let lessons = []

  function loadState(){
    try{
      const savedLang = localStorage.getItem(LS_KEYS.lang)
      const savedTopic = localStorage.getItem(LS_KEYS.topic)
      const savedCustom = localStorage.getItem(LS_KEYS.customLanguages)
      const savedLessons = localStorage.getItem(LS_KEYS.lessons)
      const savedType = localStorage.getItem(LS_KEYS.lessonType)
      if(savedCustom) customLanguages = JSON.parse(savedCustom)
      if(savedLessons) lessons = JSON.parse(savedLessons)
      if(savedLang) languageSel.value = savedLang
      if(savedTopic) topicInput.value = savedTopic
      if(savedType) lessonTypeSel.value = savedType
    }catch(e){ console.warn('Failed to read localStorage', e) }
  }

  function saveState(){
    localStorage.setItem(LS_KEYS.customLanguages, JSON.stringify(customLanguages))
    localStorage.setItem(LS_KEYS.lessons, JSON.stringify(lessons))
    localStorage.setItem(LS_KEYS.lang, languageSel.value)
    localStorage.setItem(LS_KEYS.topic, topicInput.value)
    localStorage.setItem(LS_KEYS.lessonType, lessonTypeSel.value)
  }

  function allLanguages(){ return Array.from(new Set([...KNOWN_LANGUAGES, ...customLanguages])) }

  function populateLanguageSelect(){
    const list = allLanguages()
    languageSel.innerHTML = ''
    for(const l of list){
      const opt = document.createElement('option')
      opt.value = l
      opt.textContent = capitalize(l)
      languageSel.appendChild(opt)
    }
  }

  function isCodingLanguage(input){
    const normalized = (input||'').trim().toLowerCase()
    if(!normalized) return false
    const all = allLanguages()
    if(all.includes(normalized)) return true
    for(const l of all) if(l.includes(normalized) || normalized.includes(l)) return true
    return false
  }

  function setStatus(msg){ statusDiv.textContent = msg }

  async function generateLesson(){
    setStatus('Generating...')
    const lang = languageSel.value
    const topic = topicInput.value || 'basics'
    const lessonType = lessonTypeSel.value

    // remote AI path (optional)
    const apiKey = apiKeyInput.value.trim()
    if(apiKey && !useBuiltInChk.checked){
      try{
        const prompt = `Create a ${lessonType} for ${lang} — ${topic}. Produce JSON appropriate to the format.`
        const resp = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST', headers: { 'Content-Type':'application/json', 'Authorization': `Bearer ${apiKey}` },
          body: JSON.stringify({ model:'gpt-4o-mini', messages:[{role:'user', content: prompt}], max_tokens:400 })
        })
        const data = await resp.json()
        const raw = data?.choices?.[0]?.message?.content || ''
        let parsed = null
        try{ parsed = JSON.parse(raw) }catch(e){ const m = raw.match(/\{[\s\S]*\}/); parsed = m ? JSON.parse(m[0]) : null }
        if(parsed && parsed.title){ lessons = [{ title: parsed.title, payload: parsed, format: lessonType }]; saveState(); renderLessons(); setStatus('Done (remote AI)'); return }
      }catch(err){ console.error(err); setStatus('Remote AI failed; falling back to built-in') }
    }

    const generated = generateBuiltInAI(lang, topic, lessonType)
    lessons = [generated]
    saveState()
    renderLessons()
    setStatus('Done (local AI)')
  }

  function addLanguage(val){
    const n = (val||'').trim().toLowerCase()
    if(!n) return
    if(isCodingLanguage(n)){ setStatus(`${val} already known`); return }
    customLanguages.push(n)
    populateLanguageSelect()
    setStatus(`Added ${val} to custom languages`)
    saveState()
  }

  function renderLessons(){
    lessonsDiv.innerHTML = ''
    for(const l of lessons){
      const el = document.createElement('div'); el.className = 'lesson'
      const h = document.createElement('h3'); h.textContent = l.title; el.appendChild(h)
      const format = l.format || 'quick-lesson'
      if(format === 'flashcards' && l.payload && Array.isArray(l.payload.cards)){
        const grid = document.createElement('div'); grid.className='card-grid'
        l.payload.cards.forEach((c)=>{
          const card = document.createElement('div'); card.className='card'
          const front = document.createElement('div'); front.textContent = c.front
          const back = document.createElement('div'); back.textContent = c.back; back.style.display='none'
          const btn = document.createElement('button'); btn.textContent='Flip'; btn.onclick = ()=>{ if(back.style.display==='none'){ back.style.display='block'; front.style.display='none'; btn.textContent='Show front' } else { back.style.display='none'; front.style.display='block'; btn.textContent='Flip' } }
          card.appendChild(front); card.appendChild(back); card.appendChild(btn); grid.appendChild(card)
        })
        el.appendChild(grid)
      } else if(format === 'multiple-choice' && l.payload && Array.isArray(l.payload.questions)){
        l.payload.questions.forEach((q,i)=>{
          const box = document.createElement('div'); box.style.marginTop='8px'
          const qEl = document.createElement('div'); qEl.textContent = (i+1)+'. '+q.question; box.appendChild(qEl)
          q.options.forEach((opt,oi)=>{
            const row = document.createElement('div');
            const inp = document.createElement('input'); inp.type='radio'; inp.name='mc-'+i
            const lbl = document.createElement('span'); lbl.textContent = ' '+opt
            row.appendChild(inp); row.appendChild(lbl); box.appendChild(row)
          })
          el.appendChild(box)
        })
      } else if(format === 'fill-blank' && l.payload && Array.isArray(l.payload.items)){
        l.payload.items.forEach(it=>{ const d = document.createElement('div'); d.textContent = it.sentence.replace('_','_____'); el.appendChild(d) })
      } else if(format === 'coding-exercise' && l.payload){
        const p = document.createElement('div'); p.textContent='Problem'; p.style.fontWeight='600'; el.appendChild(p)
        const desc = document.createElement('div'); desc.textContent = l.payload.prompt; desc.style.whiteSpace='pre-wrap'; el.appendChild(desc)
        if(l.payload.starter){ const pre = document.createElement('pre'); pre.textContent = l.payload.starter; el.appendChild(pre) }
        if(l.payload.solution){ const details = document.createElement('details'); const summary = document.createElement('summary'); summary.textContent='Show solution'; details.appendChild(summary); const pre = document.createElement('pre'); pre.textContent = l.payload.solution; details.appendChild(pre); el.appendChild(details) }
      } else if(format === 'translation' && l.payload && Array.isArray(l.payload.items)){
        l.payload.items.forEach(it=>{ const d = document.createElement('div'); d.textContent = `${it.source} → ${it.target || '...'}`; el.appendChild(d) })
      } else {
        if(l.steps && Array.isArray(l.steps)){
          const ol = document.createElement('ol');
          l.steps.forEach(s=>{ const li = document.createElement('li'); li.textContent = s; ol.appendChild(li) })
          el.appendChild(ol)
        } else if(l.payload && typeof l.payload === 'object'){
          const pre = document.createElement('pre'); pre.textContent = JSON.stringify(l.payload, null, 2); el.appendChild(pre)
        }
      }
      lessonsDiv.appendChild(el)
    }
  }

  // Built-in generators (port of the React version)
  function generateBuiltInAI(lang, topic, lessonType){
    const title = `${capitalize(lang)} — ${capitalize(topic)} (${lessonTypeToLabel(lessonType)})`
    switch(lessonType){
      case 'flashcards': return { title, format:'flashcards', payload: { cards:[{front:`What is ${lang}?`,back:`${lang} is ... a short description.`},{front:`How do you set up ${lang}?`,back:`Install or use a playground.`}] } }
      case 'multiple-choice': return { title, format:'multiple-choice', payload: { questions:[{ question:`Which statement about ${lang} is true?`, options:[`It's mainly used for web`,`It's a database`,`It's a CSS framework`], answer:0 }] } }
      case 'fill-blank': return { title, format:'fill-blank', payload: { items:[{ sentence:`${capitalize(lang)} files often end with ____` },{ sentence:`A common data type in ${lang} is ____` }] } }
      case 'coding-exercise': { const prompt = `Create a small ${lang} program that demonstrates ${topic}. Keep it short and runnable.`; const starter = generateStarterFor(lang); const solution = generateSolutionFor(lang, topic); return { title, format:'coding-exercise', payload:{ prompt, starter, solution } } }
      case 'translation': return { title, format:'translation', payload:{ items:[{ source:'Hello, how are you?', target:'...' },{ source:'I would like a cup of tea.', target:'...' }] } }
      default: return { title, steps:[`What is ${lang}? A short intro.`,`Setup: how to get started with ${lang}.`,`Core concepts to learn for ${lang}.`,`Hands-on: a short example.`] }
    }
  }

  function generateStarterFor(lang){
    if(lang.includes('js') || lang === 'typescript' || lang === 'javascript') return `console.log('Hello from ${lang}')`
    if(lang === 'python') return `print('Hello from python')`
    return `// starter code for ${lang}`
  }

  function generateSolutionFor(lang, topic){
    if(lang.includes('js') || lang === 'typescript' || lang === 'javascript') return `function greet(){\n  console.log('Hello from ${lang} — ${topic} example')\n}\ngreet()`
    if(lang === 'python') return `def greet():\n    print('Hello from python — ${topic} example')\n\ngreet()`
    return `// solution for ${lang}`
  }

  function lessonTypeToLabel(id){
    const map = { 'quick-lesson':'Quick Lesson','flashcards':'Flashcards','multiple-choice':'Multiple Choice','fill-blank':'Fill-in-the-Blank','coding-exercise':'Coding Exercise','translation':'Translation' }
    return map[id]||id
  }

  function capitalize(s){ if(!s) return s; return s[0].toUpperCase()+s.slice(1) }

  // Event wiring
  document.addEventListener('DOMContentLoaded', ()=>{
    populateLanguageSelect()
    // restore selected language/topic/lessonType if present
    const savedLang = localStorage.getItem(LS_KEYS.lang)
    const savedTopic = localStorage.getItem(LS_KEYS.topic)
    const savedType = localStorage.getItem(LS_KEYS.lessonType)
    if(savedLang) languageSel.value = savedLang
    if(savedTopic) topicInput.value = savedTopic
    if(savedType) lessonTypeSel.value = savedType

    // load persisted lessons & custom langs
    try{ const sc = localStorage.getItem(LS_KEYS.customLanguages); if(sc) customLanguages = JSON.parse(sc); const sl = localStorage.getItem(LS_KEYS.lessons); if(sl) lessons = JSON.parse(sl) }catch(e){console.warn(e)}
    populateLanguageSelect() // re-populate after loading customs
    renderLessons()

    generateBtn.addEventListener('click', ()=>{ generateLesson() })
    clearBtn.addEventListener('click', ()=>{ lessons = []; saveState(); renderLessons(); setStatus('Cleared') })

    checkBtn.addEventListener('click', ()=>{
      const ok = isCodingLanguage(langCheck.value)
      checkResult.textContent = ok ? 'Yes — recognized as a coding language' : 'No — not recognized'
    })

    addLangBtn.addEventListener('click', ()=>{ addLanguage(langCheck.value); langCheck.value=''; checkResult.textContent=''; })

    // save inputs on change
    languageSel.addEventListener('change', saveState)
    topicInput.addEventListener('input', saveState)
    lessonTypeSel.addEventListener('change', saveState)
  })

})();
