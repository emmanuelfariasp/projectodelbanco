// Simulados aleatorios y banco persistente de errores.

function isSyntheticSection(sec){
  return !!(sec && sec.synthetic);
}

function wrongKeyFor(subject = currentSubject){
  return 'banco4_wrong_' + subject;
}

function getWrongBank(subject = currentSubject){
  return BancoStore.getJSON(wrongKeyFor(subject), []);
}

function setWrongBank(bank, subject = currentSubject){
  BancoStore.setJSON(wrongKeyFor(subject), bank);
}

function countWrongForSubject(subject = currentSubject){
  return getWrongBank(subject).length;
}

function saveWrongAnswer(record){
  if(!currentSubject || !record || !record.id) return;
  const bank = getWrongBank(currentSubject).filter(item => item.id !== record.id);
  bank.unshift({
    id: record.id,
    q: record.q,
    options: record.options,
    answer: record.answer,
    choice: record.choice,
    exp: record.exp,
    topic: record.topic || 'Sin tema',
    keepOptionOrder: !!record.keepOptionOrder,
    sectionTitle: currentSection ? currentSection.title : subjectLabel(),
    updatedAt: BancoStore.now()
  });
  setWrongBank(bank.slice(0, 300), currentSubject);
}

function removeWrongAnswer(id){
  if(!currentSubject || !id) return;
  const bank = getWrongBank(currentSubject).filter(item => item.id !== id);
  setWrongBank(bank, currentSubject);
}

function clearWrongBank(){
  if(!currentSubject) return;
  if(confirm('¿Quieres borrar el cuaderno de errores de ' + subjectLabel() + '?')){
    setWrongBank([], currentSubject);
    renderDashboard();
  }
}

function getAllQuestionsForSubject(subject = currentSubject){
  const unique = new Map();
  getSections(subject).forEach(sec => {
    (sec.questions || []).forEach(q => {
      if(!unique.has(q.id)){
        unique.set(q.id, {...q, sourceSection: sec.title});
      }
    });
  });
  return [...unique.values()];
}

function launchSyntheticQuiz(section, mode = 'exam'){
  currentSection = section;
  currentMode = mode === 'study' ? 'study' : 'exam';
  questions = prepareQuestions(section.questions || []);
  answers = [];
  idx = 0;
  selectedChoice = null;
  locked = false;
  showQuizShell(false);
}

function startRandomSimulation(size = 20){
  const pool = getAllQuestionsForSubject(currentSubject);
  if(!pool.length){
    alert('No hay preguntas disponibles para este simulado.');
    return;
  }
  const total = Math.min(Number(size) || 20, pool.length);
  const selected = shuffle(pool).slice(0, total);
  const section = {
    key: 'random_' + total + '_' + Date.now(),
    title: 'Simulado aleatorio de ' + total + ' preguntas',
    subtitle: 'Preguntas mezcladas de todo el banco de ' + subjectLabel() + '.',
    level: total + ' preguntas',
    synthetic: true,
    questions: selected
  };
  trackAnalyticsEvent('start_random_simulado', {question_count: total});
  launchSyntheticQuiz(section, 'exam');
}

function startWrongReview(){
  const bank = getWrongBank(currentSubject);
  if(!bank.length){
    alert('Todavía no hay preguntas erradas guardadas en esta área.');
    return;
  }
  const questionsForReview = bank.map(item => ({
    id: item.id,
    q: item.q,
    options: item.options,
    answer: item.answer,
    exp: item.exp,
    topic: item.topic || 'Errores',
    keepOptionOrder: !!item.keepOptionOrder,
    sourceSection: item.sectionTitle || ''
  }));
  const section = {
    key: 'wrong_review_' + Date.now(),
    title: 'Revisión de preguntas erradas',
    subtitle: 'Cuaderno de errores: al acertar una pregunta, ella sale de esta lista.',
    level: questionsForReview.length + ' preguntas erradas',
    synthetic: true,
    questions: questionsForReview
  };
  trackAnalyticsEvent('start_wrong_review', {wrong_count: questionsForReview.length});
  launchSyntheticQuiz(section, 'study');
}

function restartSyntheticQuiz(){
  if(!isSyntheticSection(currentSection)) return false;
  const copy = {...currentSection, key: currentSection.key + '_restart_' + Date.now()};
  launchSyntheticQuiz(copy, currentMode);
  return true;
}
