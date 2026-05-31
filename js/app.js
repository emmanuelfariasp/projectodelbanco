let SUBJECTS = {};
let appReady = false;
let currentSubject=null, currentSection=null, questions=[], idx=0, answers=[], locked=false, selectedChoice=null, currentMode='study';
const letters=['A','B','C','D','E'];
const NAME_KEY='banco4_student_name';
const VISITOR_ID_KEY='banco4_visitor_id';
const LOCAL_VISIT_COUNT_KEY='banco4_local_visit_count';
const SESSION_VISIT_KEY='banco4_visit_registered_this_session';
const SUBJECT_KEY='banco4_last_subject';

function $(id){return document.getElementById(id)}
function shuffle(arr){const a=[...arr]; for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]]} return a}
function shuffleQuestionOptions(q){const order=shuffle(q.options.map((_,i)=>i)); return {...q, options: order.map(i=>q.options[i]), answer: order.indexOf(q.answer)}}
function prepareQuestions(qs){ return shuffle(qs).map(shuffleQuestionOptions); }
function pct(n,d){return d?Math.round((n/d)*100):0}
function escHtml(str){return String(str).replace(/[&<>"']/g, m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));}
function cleanName(name){return String(name||'').trim().replace(/\s+/g,' ').slice(0,40)}
function getVisitorName(){return cleanName(localStorage.getItem(NAME_KEY)||'')}
function getSections(subject=currentSubject){return subject && SUBJECTS[subject] ? SUBJECTS[subject].sections : []}
function subjectLabel(subject=currentSubject){return SUBJECTS[subject]?.label || 'Banco'}
function ensureVisitorId(){let id=localStorage.getItem(VISITOR_ID_KEY); if(!id){id='v_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2,10); localStorage.setItem(VISITOR_ID_KEY,id)} return id}
function trackAnalyticsEvent(name,params={}){const payload={app:'Banco de cuestiones 4 semestre',subject:currentSubject||'none',...params}; window.dataLayer=window.dataLayer||[]; window.dataLayer.push({event:name,...payload});}
function registerVisit(){ensureVisitorId(); if(sessionStorage.getItem(SESSION_VISIT_KEY)) return; const localCount=Number(localStorage.getItem(LOCAL_VISIT_COUNT_KEY)||0)+1; localStorage.setItem(LOCAL_VISIT_COUNT_KEY,String(localCount)); sessionStorage.setItem(SESSION_VISIT_KEY,'1'); trackAnalyticsEvent('banco4_visit',{local_visit_number:localCount});}
function modeLabel(){return currentMode==='exam'?'Modo Simulado':'Modo Estudio'}
function modeClass(){return currentMode==='exam'?'exam':'study'}
function attemptKeyFor(subject,key,mode){return 'banco4_progress_'+subject+'_'+key+'_'+mode}
function scoreKeyFor(subject,key){return 'banco4_score_'+subject+'_'+key}
function attemptKey(key, mode){return attemptKeyFor(currentSubject,key,mode)}
function scoreKey(key){return scoreKeyFor(currentSubject,key)}
function safeParse(value){try{return JSON.parse(value)}catch(e){return null}}
function uniqueAnsweredCount(list=answers){return new Set((list||[]).map(a=>a.id)).size}
function answerFor(qid){return (answers||[]).find(a=>a.id===qid)}
function answerForCurrent(){return questions[idx] ? answerFor(questions[idx].id) : null}

function getLatestIncompleteProgress(){
  const items=[];
  getSections().forEach(sec=>{
    ['study','exam'].forEach(mode=>{
      const state=readProgress(currentSubject,sec.key,mode,false);
      if(state) items.push({sec,mode,state});
    });
  });
  items.sort((a,b)=>new Date(b.state.updatedAt||0)-new Date(a.state.updatedAt||0));
  return items[0] || null;
}

function continueLatestProgress(){
  const item=getLatestIncompleteProgress();
  if(!item){ alert('No hay un bloque pendiente para continuar.'); return; }
  applyStateToQuiz(item.sec,item.state,item.mode);
  showQuizShell(false);
}

function getDashboardStats(){
  const sections=getSections();
  const totals={questions:0,answered:0,ok:0,bad:0,completed:0,best:null,worst:null};
  sections.forEach(sec=>{
    totals.questions += (sec.questions||[]).length;
    const prog=latestProgress(currentSubject,sec.key,true);
    if(prog){
      totals.answered += uniqueAnsweredCount(prog.answers);
      totals.ok += (prog.answers||[]).filter(a=>a.correct).length;
      totals.bad += (prog.answers||[]).filter(a=>a.correct===false).length;
    }
    const hist=safeParse(localStorage.getItem(scoreKeyFor(currentSubject,sec.key))||'null');
    if(hist){
      totals.completed++;
      const item={title:sec.title,p:hist.p};
      if(!totals.best || item.p>totals.best.p) totals.best=item;
      if(!totals.worst || item.p<totals.worst.p) totals.worst=item;
    }
  });
  totals.percent=pct(totals.ok, Math.max(totals.ok+totals.bad, 0));
  totals.progress=pct(totals.answered, totals.questions);
  return totals;
}

function renderDashboard(){
  const el=$('dashboardPanel');
  if(!el || !currentSubject) return;
  const stats=getDashboardStats();
  const latest=getLatestIncompleteProgress();
  const wrongCount=typeof countWrongForSubject==='function' ? countWrongForSubject(currentSubject) : 0;
  const best=stats.best ? `${escHtml(stats.best.title)} · ${stats.best.p}%` : 'Sin bloque finalizado';
  const worst=stats.completed >= 2 && stats.worst ? `${escHtml(stats.worst.title)} · ${stats.worst.p}%` : 'Completa otro bloque para comparar';
  const continueBtn=latest ? `<button class="btn" onclick="continueLatestProgress()">Continuar donde paré</button>` : `<button class="btn" disabled>Continuar donde paré</button>`;
  el.innerHTML=`
    <div class="dashboardHero">
      <h3>Panel de progreso general</h3>
      <p>Vista rápida de tu rendimiento en ${escHtml(subjectLabel())}. Usa este panel para continuar, simular prueba o revisar tus errores.</p>
      <div class="dashboardStats">
        <div class="dashStat"><b>${stats.answered}/${stats.questions}</b><span>Respondidas</span></div>
        <div class="dashStat"><b>${stats.percent}%</b><span>Acierto general</span></div>
        <div class="dashStat"><b>${stats.completed}</b><span>Bloques finalizados</span></div>
        <div class="dashStat"><b>${wrongCount}</b><span>Errores guardados</span></div>
      </div>
      <div class="dashboardActions">
        ${continueBtn}
        <button class="btn secondary" onclick="startWrongReview()">Revisar errores</button>
        <button class="btn secondary" onclick="clearWrongBank()">Limpiar errores</button>
      </div>
    </div>
    <div class="smartGrid">
      <div class="smartCard">
        <h4>Simulados aleatorios</h4>
        <p>Entrena como prueba con preguntas mezcladas de todos los bloques de esta área.</p>
        <div class="randomButtons">
          <button class="btn warn" onclick="startRandomSimulation(20)">20 preguntas</button>
          <button class="btn warn" onclick="startRandomSimulation(50)">50 preguntas</button>
          <button class="btn warn" onclick="startRandomSimulation(100)">100 preguntas</button>
        </div>
      </div>
      <div class="smartCard">
        <h4>Diagnóstico rápido</h4>
        <div class="metricLine"><strong>Mejor bloque</strong><span>${best}</span></div>
        <div class="metricLine"><strong>Bloque más débil</strong><span>${worst}</span></div>
        <div class="metricLine"><strong>Avance total</strong><span>${stats.progress}%</span></div>
      </div>
      <div class="smartCard">
        <h4>Cuaderno de errores <span class="errorBadge">${wrongCount}</span></h4>
        <p>Las preguntas erradas quedan guardadas automáticamente. Cuando las respondes bien en revisión, salen de la lista.</p>
        <button class="btn secondary" onclick="startWrongReview()">Abrir revisión</button>
      </div>
    </div>`;
}


function showLogin(){
  ['subjectSelect','menu','quiz','result'].forEach(id=>$(id).classList.add('hidden'));
  $('login').classList.remove('hidden');
  $('heroLead').textContent='Antes de comenzar, escribe tu nombre para personalizar tu experiencia.';
  setTimeout(()=>{ if($('nameInput')) $('nameInput').focus(); },60);
}
function showSubjectSelection(){
  ['login','menu','quiz','result'].forEach(id=>$(id).classList.add('hidden'));
  $('subjectSelect').classList.remove('hidden');
  $('heroLead').textContent='Banco de cuestiones para organizar tus estudios del 4º semestre.';
  const name=getVisitorName();
  $('subjectGreeting').innerHTML=`<span class="helloName">Hola, ${escHtml(name)}.</span> ¡Qué bueno verte! Elige qué área quieres estudiar hoy.`;
}
function showMenuForUser(){
  if(!currentSubject || !SUBJECTS[currentSubject]){ showSubjectSelection(); return; }
  ['login','subjectSelect','quiz','result'].forEach(id=>$(id).classList.add('hidden'));
  $('menu').classList.remove('hidden');
  $('heroLead').textContent=`${subjectLabel()}: elige un bloque y comienza a practicar.`;
  $('menuHeading').textContent=`Banco de ${subjectLabel()}`;
  $('menuSubtitle').textContent=SUBJECTS[currentSubject].subtitle;
  $('subjectMenuBadge').textContent=`Área actual: ${subjectLabel()}`;
  const pdf=$('pdfDownloadBtn');
  if(SUBJECTS[currentSubject].pdf){ pdf.href=SUBJECTS[currentSubject].pdf; pdf.textContent=SUBJECTS[currentSubject].pdfLabel || 'Descargar PDF'; pdf.classList.remove('hidden'); }
  else pdf.classList.add('hidden');
  const name=getVisitorName();
  $('greetingBox').innerHTML=`<span class="helloName">Hola, ${escHtml(name)}.</span> ¡Qué bueno verte! Soy Emmanuel, espero que este banco de cuestiones pueda ayudarte en tus estudios del 4º semestre.`;
  renderDashboard();
  renderCards();
}
function submitName(event){event.preventDefault(); if(!appReady){alert('El banco de preguntas todavía está cargando. Intenta nuevamente en unos segundos.'); return;} const input=$('nameInput'); const name=cleanName(input?input.value:''); if(!name){alert('Escribe tu nombre para entrar.'); return;} localStorage.setItem(NAME_KEY,name); registerVisit(); trackAnalyticsEvent('student_name_saved'); showSubjectSelection();}
function changeVisitorName(){const current=getVisitorName(); localStorage.removeItem(NAME_KEY); currentSubject=null; showLogin(); if($('nameInput')) $('nameInput').value=current;}
function chooseSubject(subject){if(!appReady){alert('El banco de preguntas todavía está cargando. Intenta nuevamente en unos segundos.'); return;} if(!SUBJECTS[subject]) return; currentSubject=subject; localStorage.setItem(SUBJECT_KEY,subject); registerVisit(); trackAnalyticsEvent('subject_selected',{selected_subject:subject}); showMenuForUser();}
function changeSubject(){currentSubject=null; showSubjectSelection();}
async function initApp(){
  ensureVisitorId();
  $('heroLead').textContent = 'Cargando banco de preguntas...';
  try{
    if(typeof loadBancoQuestionData !== 'function'){
      throw new Error('No se encontró js/data-loader.js');
    }
    SUBJECTS = await loadBancoQuestionData();
    appReady = true;
  }catch(error){
    console.error(error);
    $('heroLead').textContent = 'No se pudo cargar el banco de preguntas.';
    $('login').classList.remove('hidden');
    $('login').innerHTML = `<h2>Error al cargar preguntas</h2><p>No se pudieron cargar los archivos JSON de la carpeta <b>data</b>. En GitHub Pages esto debe funcionar normalmente. Si abriste el archivo directamente en tu computadora, usa un servidor local o sube el proyecto al GitHub.</p><p class="small">Detalle técnico: ${escHtml(error.message || error)}</p>`;
    return;
  }
  if(getVisitorName()) showSubjectSelection(); else showLogin();
}


function readProgress(subject,key,mode,includeCompleted=false){
  const state=safeParse(localStorage.getItem(attemptKeyFor(subject,key,mode))||'null');
  if(!state || !Array.isArray(state.questions) || !Array.isArray(state.answers)) return null;
  if(!includeCompleted && state.completed) return null;
  const sec=getSections(subject).find(s=>s.key===key);
  if(!sec || state.questions.length!==sec.questions.length) return null;
  const currentIds=new Set(sec.questions.map(q=>q.id));
  const savedIds=new Set(state.questions.map(q=>q.id));
  if(currentIds.size!==savedIds.size) return null;
  for(const id of currentIds){ if(!savedIds.has(id)) return null; }
  return state;
}
function latestProgress(subject,key, includeCompleted=true){
  const states=['study','exam'].map(m=>readProgress(subject,key,m,includeCompleted)).filter(Boolean);
  if(!states.length) return null;
  states.sort((a,b)=>new Date(b.updatedAt||0)-new Date(a.updatedAt||0));
  return states[0];
}
function saveProgress(extra={}){
  if(!currentSubject || !currentSection || !questions.length || (typeof isSyntheticSection==='function' && isSyntheticSection(currentSection))) return;
  const state={version:4,subject:currentSubject,sectionKey:currentSection.key,mode:currentMode,idx:Math.min(idx,Math.max(questions.length-1,0)),questions,answers,selectedChoice,completed:!!extra.completed,updatedAt:new Date().toISOString()};
  localStorage.setItem(attemptKey(currentSection.key,currentMode), JSON.stringify(state));
}
function shortMenuName(sec){
  if(currentSubject==='fisio') return sec.subtitle;
  const names={clase1:'Sistema Nervioso',clase2:'Médula espinal I',clase3:'Médula espinal II',clase4:'Tronco cerebral',clase5:'Cerebelo y ventrículos',clase6:'Configuración del cerebro',clase7:'Pares craneales I–VII',clase8:'Pares craneales VIII–XII',clase9:'Neuroglia y sinapsis',clase10:'HTEC, edema y ACV',clase11:'Hidrocefalia',clase12:'Absceso y empiema',general_medio:'Todo el contenido · nivel medio',general_dificil:'Todo el contenido · nivel difícil'};
  return names[sec.key] || sec.subtitle;
}
function progressMarkup(sec){
  const prog=latestProgress(currentSubject,sec.key,true);
  if(!prog) return `<div class="miniProgress"><span>Avance: 0/${sec.questions.length} (0%)</span><div class="track"><div class="fill" style="width:0%"></div></div></div>`;
  const total=prog.questions.length || sec.questions.length, done=uniqueAnsweredCount(prog.answers), ok=(prog.answers||[]).filter(a=>a.correct).length, bad=(prog.answers||[]).filter(a=>a.correct===false).length, pending=Math.max(total-done,0), pp=pct(done,total), modeName=prog.mode==='exam'?'simulado':'estudio';
  return `<div class="miniProgress"><span>Avance ${modeName}: ${done}/${total} (${pp}%)</span><div class="track"><div class="fill" style="width:${pp}%"></div></div><div class="miniStats"><span class="ok">✓ ${ok}</span><span class="bad">✕ ${bad}</span><span>Pendientes: ${pending}</span></div></div>`;
}
function makeCard(sec,i,isGeneral=false){
  const hist=safeParse(localStorage.getItem(scoreKey(sec.key))||'null');
  const studyProgress=readProgress(currentSubject,sec.key,'study',false);
  const examProgress=readProgress(currentSubject,sec.key,'exam',false);
  let statusClass=''; if(hist){ statusClass = hist.p > 60 ? ' score-ok' : ' score-bad'; }
  const div=document.createElement('div'); div.className='square'+(isGeneral?' general':'')+statusClass;
  const last=hist?` · último: ${hist.p}%`:'';
  const label=currentSubject==='fisio' ? sec.title.replace('Capítulo ','Cap. ') : (isGeneral ? (sec.key.includes('dificil')?'Difícil':'Medio') : (i+1));
  const studyLabel=studyProgress?'Continuar estudio':'Estudiar', examLabel=examProgress?'Continuar simulado':'Simulado';
  div.innerHTML=`<div><div class="num">${escHtml(label)}</div><h3>${escHtml(sec.title)}</h3><span class="cardSub">${escHtml(shortMenuName(sec))}</span>${progressMarkup(sec)}</div><p><b>${escHtml(sec.level)}</b>${last}</p><div class="cardActions"><button class="btn" data-action="study">${studyLabel}</button><button class="btn warn" data-action="exam">${examLabel}</button><button class="btn view" data-action="list">Ver preguntas</button></div>`;
  div.querySelector('[data-action="study"]').onclick=()=>startSection(sec.key,'study',false);
  div.querySelector('[data-action="exam"]').onclick=()=>startSection(sec.key,'exam',false);
  div.querySelector('[data-action="list"]').onclick=()=>openSectionList(sec.key);
  return div;
}
function renderCards(){
  const classCards=$('classCards'), generalCards=$('generalCards'); classCards.innerHTML=''; generalCards.innerHTML='';
  const sections=getSections();
  if(currentSubject==='neuro'){
    $('groupTitleClasses').textContent='Clases individuales'; $('groupHintClasses').textContent='Repasa un tema específico con 25 preguntas.';
    $('generalBlock').classList.remove('hidden');
    sections.filter(s=>s.key.startsWith('clase')).forEach((sec,i)=>classCards.appendChild(makeCard(sec,i,false)));
    sections.filter(s=>s.key.includes('general')).forEach((sec,i)=>generalCards.appendChild(makeCard(sec,i,true)));
  } else {
    $('groupTitleClasses').textContent='Bloques de Fisiología'; $('groupHintClasses').textContent='Incluye capítulos 75 al 82 y tres cuestionarios mixtos de 100 preguntas.';
    $('generalBlock').classList.add('hidden');
    sections.forEach((sec,i)=>classCards.appendChild(makeCard(sec,i,false)));
  }
}
function applyStateToQuiz(sec,state,preferredMode){currentSection=sec; currentMode=(state&&state.mode)||(preferredMode==='exam'?'exam':'study'); questions=(state&&Array.isArray(state.questions))?state.questions:prepareQuestions(sec.questions); answers=(state&&Array.isArray(state.answers))?state.answers:[]; idx=(state&&typeof state.idx==='number')?Math.min(Math.max(state.idx,0),questions.length-1):0; selectedChoice=null; locked=false;}
function showQuizShell(openList=false){$('questionList').classList.add('hidden'); $('listBtn').textContent='Ver todas las preguntas'; ['subjectSelect','menu','result','login'].forEach(id=>$(id).classList.add('hidden')); $('quiz').classList.remove('hidden'); $('quizPill').textContent=subjectLabel()+' · '+currentSection.title+' · '+currentSection.level; const mp=$('modePill'); mp.textContent=modeLabel(); mp.className='modeTag '+modeClass(); $('quizSub').textContent=currentMode==='exam'?currentSection.subtitle+' · Las respuestas se muestran al final.':currentSection.subtitle+' · Recibirás explicación inmediata.'; renderQuestion(); renderQuestionList(); if(openList) toggleQuestionList();}
function startSection(key,mode='study',openList=false){const sec=getSections().find(s=>s.key===key); if(!sec){alert('Bloque no encontrado.'); return;} const wantedMode=mode==='exam'?'exam':'study'; const saved=readProgress(currentSubject,sec.key,wantedMode,false); trackAnalyticsEvent('start_block',{block_key:sec.key,mode:wantedMode}); applyStateToQuiz(sec,saved,wantedMode); if(!saved) saveProgress(); showQuizShell(openList);}
function openSectionList(key){const sec=getSections().find(s=>s.key===key); if(!sec){alert('Bloque no encontrado.'); return;} const saved=latestProgress(currentSubject,sec.key,true); applyStateToQuiz(sec,saved,saved?saved.mode:'study'); if(!saved) saveProgress(); showQuizShell(true);}
function updateProgressUI(){const done=uniqueAnsweredCount(answers), ok=(answers||[]).filter(a=>a.correct).length, bad=(answers||[]).filter(a=>a.correct===false).length, pending=Math.max(questions.length-done,0), pp=pct(done,questions.length); $('bar').style.width=pp+'%'; $('progressText').innerHTML=`<div class="progressLabel"><strong>Progreso del bloque</strong><span>${done}/${questions.length} respondidas · ${pp}%</span></div><div class="statsGrid"><div class="statBox"><b>${done}</b><span>Respondidas</span></div><div class="statBox ok"><b>${ok}</b><span>Ciertos</span></div><div class="statBox bad"><b>${bad}</b><span>Errores</span></div><div class="statBox pending"><b>${pending}</b><span>Pendientes</span></div></div>`;}
function renderQuestion(){locked=false; selectedChoice=null; $('nextBtn').disabled=true; $('nextBtn').textContent=(idx===questions.length-1?'Ver resultado':'Siguiente'); const q=questions[idx]; updateProgressUI(); $('question').textContent=q.q; const opts=$('options'); opts.innerHTML=''; $('feedback').className='feedback'; $('feedback').innerHTML=''; q.options.forEach((op,i)=>{const b=document.createElement('button'); b.className='option'; b.innerHTML=`<b>${letters[i]})</b>&nbsp;${escHtml(op)}`; b.onclick=()=>selectOption(i); opts.appendChild(b);}); restoreCurrentAnswerView(); equalizeOptionHeights();}
function restoreCurrentAnswerView(){const q=questions[idx], rec=answerFor(q.id); if(!rec) return; selectedChoice=rec.choice; $('nextBtn').disabled=false; const buttons=[...$('options').children]; buttons.forEach((b,i)=>{b.classList.toggle('selected',i===rec.choice);}); if(currentMode==='exam'){$('feedback').className='feedback info'; $('feedback').innerHTML='<strong>Respuesta marcada</strong>En modo simulado la corrección aparecerá al final.'; return;} locked=true; buttons.forEach((b,i)=>{b.disabled=true; if(i===q.answer) b.classList.add('correct'); if(i===rec.choice&&i!==q.answer) b.classList.add('wrong'); if(i!==rec.choice&&i!==q.answer) b.classList.add('dim');}); const fb=$('feedback'); fb.className='feedback '+(rec.correct?'good':'bad'); fb.innerHTML=rec.correct?`<strong>✅ Correcto</strong>${escHtml(q.exp)}`:`<strong>❌ Incorrecto</strong>Respuesta correcta: <b>${letters[q.answer]}) ${escHtml(q.options[q.answer])}</b><br>${escHtml(q.exp)}`;}
function equalizeOptionHeights(){const buttons=[...document.querySelectorAll('.option')]; if(!buttons.length) return; buttons.forEach(b=>b.style.height='auto'); const max=Math.max(...buttons.map(b=>b.offsetHeight)); buttons.forEach(b=>b.style.height=Math.max(max,76)+'px');}
function renderQuestionList(){const box=$('questionList'); if(!currentSection||!questions.length){box.innerHTML=''; return;} const done=uniqueAnsweredCount(answers), pp=pct(done,questions.length); let html=`<div class="listTop"><h3>Todas las preguntas del bloque</h3><span class="small">Respondidas: ${done}/${questions.length} (${pp}%)</span></div>`; questions.forEach((q,i)=>{const rec=answerFor(q.id), cls=rec?(rec.correct?' doneOk':' doneBad'):'', badge=rec?(rec.correct?'<span class="statusBadge ok">✓ Cierto</span>':'<span class="statusBadge bad">✕ X</span>'):'<span class="statusBadge pending">Sin responder</span>'; html+=`<div class="listItem${cls}"><div class="listHead"><div class="listQ">${i+1}. ${escHtml(q.q)}</div>${badge}</div><ol type="A">`; q.options.forEach((op,j)=>{let liClass=''; if(rec&&j===q.answer) liClass=' class="listCorrect"'; if(rec&&!rec.correct&&j===rec.choice) liClass=' class="listWrong"'; html+=`<li${liClass}>${escHtml(op)}</li>`;}); html+='</ol>'; if(rec){html+=`<div class="listAnswerNote"><b>Tu respuesta:</b> ${letters[rec.choice]}) ${escHtml(q.options[rec.choice])}<br><b>Correcta:</b> ${letters[q.answer]}) ${escHtml(q.options[q.answer])}</div>`;} html+='</div>';}); box.innerHTML=html;}
function toggleQuestionList(){const box=$('questionList'); box.classList.toggle('hidden'); $('listBtn').textContent=box.classList.contains('hidden')?'Ver todas las preguntas':'Ocultar lista'; if(!box.classList.contains('hidden')) renderQuestionList();}
function storeAnswer(choice){const q=questions[idx], correct=choice===q.answer, existing=answers.findIndex(a=>a.id===q.id); const record={id:q.id,q:q.q,options:q.options,answer:q.answer,choice,correct,exp:q.exp,topic:q.topic}; if(existing>=0) answers[existing]=record; else answers.push(record); if(typeof removeWrongAnswer==='function' && typeof saveWrongAnswer==='function'){ if(correct) removeWrongAnswer(q.id); else saveWrongAnswer(record); } return record;}
function selectOption(choice){const q=questions[idx]; selectedChoice=choice; const buttons=[...$('options').children]; buttons.forEach((b,i)=>{b.classList.toggle('selected',i===choice);}); $('nextBtn').disabled=false; if(currentMode==='exam'){storeAnswer(choice); saveProgress(); updateProgressUI(); renderQuestionList(); $('feedback').className='feedback info'; $('feedback').innerHTML='<strong>Respuesta marcada</strong>En modo simulado la corrección aparecerá al final.'; return;} if(locked) return; locked=true; const rec=storeAnswer(choice); buttons.forEach((b,i)=>{b.disabled=true; if(i===q.answer) b.classList.add('correct'); if(i===choice&&i!==q.answer) b.classList.add('wrong'); if(i!==choice&&i!==q.answer) b.classList.add('dim');}); const fb=$('feedback'); fb.className='feedback '+(rec.correct?'good':'bad'); fb.innerHTML=rec.correct?`<strong>✅ Correcto</strong>${escHtml(q.exp)}`:`<strong>❌ Incorrecto</strong>Respuesta correcta: <b>${letters[q.answer]}) ${escHtml(q.options[q.answer])}</b><br>${escHtml(q.exp)}`; saveProgress(); updateProgressUI(); renderQuestionList();}
function nextQuestion(){if(currentMode==='exam'){if(selectedChoice===null&&!answerForCurrent()) return; if(selectedChoice!==null) storeAnswer(selectedChoice);} saveProgress(); if(idx<questions.length-1){idx++; saveProgress(); renderQuestion(); if(!$('questionList').classList.contains('hidden')) renderQuestionList();} else showResult();}
function showResult(){saveProgress({completed:true}); ['quiz','menu','subjectSelect','login'].forEach(id=>$(id).classList.add('hidden')); $('result').classList.remove('hidden'); const total=questions.length, score=answers.filter(a=>a.correct).length, p=pct(score,total); if(!(typeof isSyntheticSection==='function' && isSyntheticSection(currentSection))){ localStorage.setItem(scoreKey(currentSection.key),JSON.stringify({score,total,p,date:new Date().toISOString()})); } trackAnalyticsEvent('finish_block',{block_key:currentSection.key,mode:currentMode,score,total,percent:p,synthetic:!!(typeof isSyntheticSection==='function' && isSyntheticSection(currentSection))}); $('resultPill').textContent=subjectLabel()+' · '+currentSection.title; const rm=$('resultMode'); rm.textContent=modeLabel(); rm.className='modeTag '+modeClass(); $('resultSub').textContent=currentSection.subtitle; $('resultTitle').textContent=p>=80?'Muy bien, estás fuerte en este bloque.':p>=60?'Buen avance, pero hay puntos para revisar.':'Necesitas reforzar este contenido antes de la prueba.'; $('scorePct').textContent=p+'%'; $('scoreNum').textContent=score+'/'+total; $('scoreMsg').textContent=p>=80?'Dominio alto':p>=60?'Regular/medio':'Reforzar'; const topicMap={}; answers.forEach(a=>{if(!topicMap[a.topic]) topicMap[a.topic]={ok:0,total:0}; topicMap[a.topic].total++; if(a.correct) topicMap[a.topic].ok++;}); let topicHtml='<h3>Resultado por tema</h3>'; Object.entries(topicMap).sort((a,b)=>pct(a[1].ok,a[1].total)-pct(b[1].ok,b[1].total)).forEach(([t,v])=>{const pp=pct(v.ok,v.total); topicHtml+=`<span class="topicTag">${escHtml(t)}: ${v.ok}/${v.total} (${pp}%)</span>`;}); $('topicResults').innerHTML=topicHtml; const wrong=answers.filter(a=>!a.correct); let rev='<h3>Revisión de errores</h3>'; if(!wrong.length) rev+='<p class="small">No hubo errores en este intento.</p>'; wrong.forEach((a,i)=>{rev+=`<details><summary>${i+1}. ${escHtml(a.q)}</summary><p><b>Tu respuesta:</b> ${letters[a.choice]}) ${escHtml(a.options[a.choice])}</p><p><b>Correcta:</b> ${letters[a.answer]}) ${escHtml(a.options[a.answer])}</p><p>${escHtml(a.exp)}</p></details>`;}); $('review').innerHTML=rev; renderDashboard(); renderCards();}
function backToMenu(){saveProgress(); showMenuForUser();}
function restartCurrent(){if(!currentSection) return; if(typeof restartSyntheticQuiz==='function' && restartSyntheticQuiz()) return; localStorage.removeItem(attemptKey(currentSection.key,currentMode)); startSection(currentSection.key,currentMode,false);}
function clearHistory(){if(!currentSubject) return; if(confirm('¿Quieres borrar los resultados, avances y errores guardados de '+subjectLabel()+'?')){getSections().forEach(s=>{localStorage.removeItem(scoreKeyFor(currentSubject,s.key)); localStorage.removeItem(attemptKeyFor(currentSubject,s.key,'study')); localStorage.removeItem(attemptKeyFor(currentSubject,s.key,'exam'));}); if(typeof wrongKeyFor==='function') localStorage.removeItem(wrongKeyFor(currentSubject)); renderDashboard(); renderCards();}}
initApp();