// Canonical content shape used by review/export/runtime hash checks.
// IMPORTANT: the MCQ shape intentionally matches the original v1 hash exactly so
// previously reviewed MCQ approvals remain valid. SPR adds an explicit format and
// accepted-response specification because there is no answerIndex.

function cleanAccepted(raw){
  const values=Array.isArray(raw?.accepted)?raw.accepted:Array.isArray(raw)?raw:[];
  return [...new Set(values.map(x=>String(x??'').trim()).filter(Boolean))];
}

export function canonicalReviewContent(type,q){
  const format=q.format||'mcq';
  const base={
    type,
    id:q.id,
    section:q.section,
    domain:q.domain,
    skill:q.skill,
    difficulty:Number(q.difficulty),
    exams:q.exams||['SAT','PSAT/NMSQT','PSAT 10'],
    stimulus:q.stimulus??null,
    stem:q.stem,
    choices:q.choices||null
  };
  if(format==='spr'){
    const accepted=cleanAccepted(q.answer??q.acceptedAnswers??q.accepted_answers),display=String((q.answer&&q.answer.display)||q.correctAnswerDisplay||accepted[0]||'').trim();
    return{...base,format:'spr',answer:{accepted,display},explanation:q.explanation};
  }
  return{...base,answerIndex:Number(q.answerIndex),explanation:q.explanation};
}

export function databaseReviewContent(type,row,key){
  const format=row.format||'mcq';
  const q={id:row.id,section:row.section,domain:row.domain_key,skill:row.skill_key,difficulty:Number(row.difficulty),format,exams:Array.isArray(row.exams)?row.exams:['SAT','PSAT/NMSQT','PSAT 10'],stimulus:row.stimulus??null,stem:row.stem,choices:Array.isArray(row.choices)?row.choices:null,explanation:key?.explanation};
  if(format==='spr')q.answer=key?.answer;
  else q.answerIndex=typeof key?.answer==='number'?key.answer:Number(key?.answer?.answerIndex??key?.answer?.index);
  return canonicalReviewContent(type,q);
}
