// Carga dinámica de preguntas desde archivos JSON separados.
// V4: Para agregar preguntas, edita los archivos dentro de /data/.

const BANCO_DATA_VERSION = '4.15.0';

async function fetchJSON(path){
  const separator = path.includes('?') ? '&' : '?';
  const response = await fetch(`${path}${separator}v=${encodeURIComponent(BANCO_DATA_VERSION)}`, { cache: 'no-store' });
  if(!response.ok){
    throw new Error(`No se pudo cargar ${path} (${response.status})`);
  }
  return response.json();
}

function normalizeSection(section){
  const questions = Array.isArray(section.questions) ? section.questions : [];
  const normalizedQuestions = questions.map((q, index) => ({
    id: q.id || `${section.key}_${String(index + 1).padStart(3, '0')}`,
    q: q.q || q.pregunta || '',
    exp: q.exp || q.explicacion || '',
    topic: q.topic || q.tema || 'Sin tema',
    options: Array.isArray(q.options) ? q.options : [q.A, q.B, q.C, q.D, q.E].filter(Boolean),
    answer: Number.isInteger(q.answer) ? q.answer : Number(q.correcta ?? q.respuesta ?? 0)
  }));

  return {
    ...section,
    questions: normalizedQuestions,
    level: `${normalizedQuestions.length} ${normalizedQuestions.length === 1 ? 'pregunta' : 'preguntas'}`
  };
}

async function loadBancoQuestionData(){
  const manifest = await fetchJSON('data/manifest.json');
  const subjects = {};
  const entries = Object.entries(manifest.subjects || {});

  for(const [subjectKey, subject] of entries){
    const sectionRefs = Array.isArray(subject.sections) ? subject.sections : [];
    const sections = [];

    for(const sectionRef of sectionRefs){
      const section = await fetchJSON(sectionRef.file);
      sections.push(normalizeSection(section));
    }

    subjects[subjectKey] = {
      ...subject,
      key: subject.key || subjectKey,
      sections
    };
  }

  return subjects;
}
