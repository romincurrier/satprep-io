// Shared server-side response scoring for commercial diagnostic/practice content.
// SAT Math includes both four-option multiple choice and student-produced responses (SPR).
// This module keeps answer keys server-side and validates SPR entries against the current
// digital SAT entry shape (5 chars positive / 6 incl. minus for negative; decimal/fraction).

export function answerIndexFrom(raw){
  const n=typeof raw==='number'?raw:Number(raw?.answerIndex??raw?.index);
  return Number.isInteger(n)&&n>=0&&n<=3?n:null;
}

function gcd(a,b){a=a<0n?-a:a;b=b<0n?-b:b;while(b){const t=a%b;a=b;b=t}return a||1n}
function rational(n,d){if(d===0n)return null;if(d<0n){n=-n;d=-d}const g=gcd(n,d);return{n:n/g,d:d/g}}
function rationalKey(r){return r?`${r.n}/${r.d}`:null}

function parseExactNumber(text){
  const s=String(text||'');
  if(/^[-+]?\d+\/\d+$/.test(s)){
    const [a,b]=s.split('/');
    try{return rational(BigInt(a),BigInt(b))}catch{return null}
  }
  if(/^[-+]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(s)){
    const neg=s.startsWith('-'),unsigned=s.replace(/^[-+]/,'');
    const [whole='',frac='']=unsigned.split('.');
    const digits=`${whole||'0'}${frac}`;
    try{const n=BigInt(digits||'0')*(neg?-1n:1n),d=10n**BigInt(frac.length);return rational(n,d)}catch{return null}
  }
  return null;
}

export function validateSprResponse(raw){
  if(raw==null)return{valid:false,error:'Enter a response.'};
  const s=String(raw).trim();
  if(!s)return{valid:false,error:'Enter a response.'};
  const max=s.startsWith('-')?6:5;
  if(s.length>max)return{valid:false,error:`Student-produced responses may use at most ${max} characters${s.startsWith('-')?' including the minus sign':''}.`};
  if(/[,$%\s]/.test(s))return{valid:false,error:'Enter only a number, decimal, or fraction. Do not include spaces, commas, percent signs, or currency symbols.'};
  if(!/^-?(?:\d+(?:\.\d*)?|\.\d+|\d+\/\d+)$/.test(s))return{valid:false,error:'Enter a valid number, decimal, or fraction.'};
  if((s.match(/\//g)||[]).length>1)return{valid:false,error:'Enter a valid fraction.'};
  const parsed=parseExactNumber(s);
  if(!parsed)return{valid:false,error:'Enter a valid nonzero-denominator number or fraction.'};
  return{valid:true,text:s,exact:rationalKey(parsed)};
}

export function sprSpecFrom(raw){
  const accepted=Array.isArray(raw?.accepted)?raw.accepted:Array.isArray(raw)?raw:[];
  const cleaned=[...new Set(accepted.map(x=>String(x??'').trim()).filter(Boolean))];
  if(!cleaned.length)return null;
  const parsed=[];
  for(const value of cleaned){
    const check=validateSprResponse(value);
    if(!check.valid)return null;
    parsed.push({text:value,exact:check.exact});
  }
  const display=String(raw?.display||cleaned[0]).trim()||cleaned[0];
  return{accepted:cleaned,parsed,display};
}

export function answerSpec(format,raw){
  if(format==='mcq'){
    const index=answerIndexFrom(raw);
    return index===null?null:{format:'mcq',answerIndex:index};
  }
  if(format==='spr'){
    const spec=sprSpecFrom(raw);
    return spec?{format:'spr',...spec}:null;
  }
  return null;
}

export function scoreResponse(format,keyAnswer,response){
  const spec=answerSpec(format,keyAnswer);
  if(!spec)return{valid:false,keyInvalid:true,error:'The approved scoring key is not ready.'};
  if(format==='mcq'){
    const selected=Number(response);
    if(!Number.isInteger(selected)||selected<0||selected>3)return{valid:false,error:'Selected answer is invalid.'};
    return{valid:true,correct:selected===spec.answerIndex,selectedAnswer:selected,responseText:null,correctIndex:spec.answerIndex,correctDisplay:null};
  }
  const entered=validateSprResponse(response);
  if(!entered.valid)return{valid:false,error:entered.error};
  const correct=spec.parsed.some(x=>x.exact===entered.exact);
  return{valid:true,correct,selectedAnswer:null,responseText:entered.text,correctIndex:null,correctDisplay:spec.display};
}

export function canonicalAnswerForHash(format,raw){
  const spec=answerSpec(format,raw);
  if(!spec)return null;
  if(format==='mcq')return{answerIndex:spec.answerIndex};
  return{accepted:[...spec.accepted],display:spec.display};
}
