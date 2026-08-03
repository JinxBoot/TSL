// static/main.js — tiny fallback lesson generator (no backend, no AI)
(function(){
  function generateLesson(language, topic){
    if(!language) language = 'a language';
    if(!topic) topic = 'a topic';
    return (
`Lesson: ${language} — ${topic}\n\n`+
`1) Goal\nLearn the basics of ${topic} in ${language}.\n\n`+
`2) Explanation\nProvide a short, clear explanation of ${topic}. Explain why it matters and show one or two short examples.\n\n`+
`3) Example\nExample code:\n\n`+
`// Example (${language})\n`+
`// (This is a placeholder snippet — adapt for the chosen language.)\n`+
`console.log('Hello, ${language}!')\n\n`+
`4) Short exercise\nA small exercise to try out on your own.\n\n`+
`5) Next steps\nLinks and suggestions for what to learn next.\n`);
  }

  function $(sel){return document.querySelector(sel)}
  var out = $('#output');
  $('#generate').addEventListener('click', function(){
    var lang = $('#language').value.trim();
    var topic = $('#topic').value.trim();
    out.textContent = generateLesson(lang, topic);
  });
})();
