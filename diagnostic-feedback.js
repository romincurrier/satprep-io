const EXPLANATIONS={
'Solve: 4x + 6 = 30':{a:2,e:'Subtract 6 from both sides: 4x = 24. Then divide both sides by 4, so x = 6.'},
'A $120 jacket is discounted 30%. What is the sale price?':{a:2,e:'A 30% discount means you pay 70% of the original price. 120 × 0.70 = 84, so the sale price is $84.'},
'A runner covers 7.5 miles in 60 minutes at a constant rate. How far in 36 minutes?':{a:1,e:'Find the rate first: 7.5 ÷ 60 = 0.125 mile per minute. Then multiply by 36: 0.125 × 36 = 4.5 miles.'},
'The ratio of red to blue marbles is 5:3. If there are 48 marbles total, how many are blue?':{a:1,e:'The ratio has 8 total parts. 48 ÷ 8 = 6 marbles per part. Blue is 3 parts, so 3 × 6 = 18.'},
'If y = 2x + 1 and y = x + 5, what is x?':{a:2,e:'Both expressions equal y, so set them equal: 2x + 1 = x + 5. Subtract x and then 1: x = 4.'},
'If f(x)=3x²−2, what is f(−2)?':{a:1,e:'Substitute −2 for x. First square it: (−2)² = 4. Then 3 × 4 − 2 = 12 − 2 = 10.'},
'Which values solve x² − 7x + 12 = 0?':{a:1,e:'Factor the quadratic: x² − 7x + 12 = (x − 3)(x − 4). Set each factor equal to zero, giving x = 3 and x = 4.'},
'A circle has area 49π. What is its circumference?':{a:1,e:'Area is πr², so r² = 49 and r = 7. Circumference is 2πr, so 2π(7) = 14π.'},
'Which inference is best supported?':{a:1,e:'Choose the answer supported by specific details rather than one that adds new information. The actions in the passage show preparation, attention, or an intention to follow what was described.'},
'The experiment produced an unexpected result. ___, the researchers repeated it with a larger sample.':{a:2,e:'The second action happens because of the unexpected result. “Therefore” signals that cause-and-effect relationship.'},
'Which sentence is grammatically correct?':{a:1,e:'The true subject is “collection,” which is singular. The phrase “of maps” does not change the subject, so the verb must be “is.”'},
'Which claim is best supported?':{a:1,e:'Use only what the evidence establishes. The data show an association between the change and improved first-period attendance; they do not prove broader effects such as grades or preferences.'},
'In the sentence “The committee adopted a measured response rather than acting immediately,” measured most nearly means:':{a:1,e:'Use the surrounding words as clues. “Rather than acting immediately” suggests a careful, restrained response, not a measurement in units.'},
'A student wants to emphasize a contrast between two studies. Which transition best serves that goal?':{a:2,e:'“However” signals contrast. The other choices signal similarity, example, or result.'},
'Choose the best punctuation: “The telescope revealed three objects ___ a comet, a distant galaxy, and a nebula.”':{a:1,e:'The words before the blank form a complete clause, and what follows is a list explaining “three objects.” A colon is the correct punctuation.'},
'Which statement most accurately evaluates the evidence?':{a:1,e:'The study observed two things occurring together but did not manipulate the variables. That supports an association, not proof that one caused the other.'},
'What does the evidence support?':{a:1,e:'Because the study was observational rather than experimental, it can show a relationship between the variables but cannot establish that one caused the other.'},
'In “The coach gave a concise explanation,” concise most nearly means:':{a:1,e:'“Concise” means brief while still being clear. Replace the word with each option and choose the one that preserves the sentence’s meaning.'},
'Which sentence is correct?':{a:1,e:'“Neither” is singular in this construction, so it takes the singular verb “is”: “Neither of the answers is correct.”'},
'A writer wants to introduce a paragraph that explains why a proposed solution is preferable to two alternatives. Which opening best fits that purpose?':{a:1,e:'The purpose is to compare the proposed approach with alternatives and emphasize its advantages. “However, the proposed approach offers two advantages...” directly sets up that contrast.'},
'Choose the best punctuation: “The project requires three materials ___ wood, glue, and paint.”':{a:1,e:'A complete clause comes before a list that explains “three materials,” so use a colon: “materials: wood, glue, and paint.”'},
'Which value is greatest?':{a:2,e:'Convert everything to the same form. 47% = 0.47 and 1/2 = 0.50. Comparing 0.48, 0.47, 0.50, and 0.49 shows that 1/2 is greatest.'},
'What is 3/4 + 0.5?':{a:2,e:'Convert to the same form: 3/4 = 0.75. Then 0.75 + 0.50 = 1.25.'},
'The mean of 6, 8, 10, and x is 9. What is x?':{a:2,e:'A mean of 9 for four numbers means their total must be 36. The known numbers total 24, so x = 36 − 24 = 12.'},
'Solve: 3(x + 2) = 21.':{a:0,e:'Divide both sides by 3 to get x + 2 = 7. Then subtract 2, giving x = 5.'},
'A car travels 180 miles in 3 hours at a constant rate. At that rate, how far will it travel in 4.5 hours?':{a:2,e:'Find the unit rate: 180 ÷ 3 = 60 miles per hour. Then 60 × 4.5 = 270 miles.'},
'A rectangle has length 12 and width 7. What is its area?':{a:2,e:'Area of a rectangle is length × width. 12 × 7 = 84 square units.'}
};

let showing=false;
const esc=s=>String(s??'').replace(/[&<>\"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[m]));
function closeFeedback(){document.querySelector('#diagnosticFeedbackOverlay')?.remove();showing=false}
function showFeedback({question,selected,options}){
 if(showing)return;const info=EXPLANATIONS[question];if(!info)return;showing=true;const correct=selected===info.a,correctText=options[info.a]||'';const o=document.createElement('div');o.id='diagnosticFeedbackOverlay';o.style.cssText='position:fixed;inset:0;z-index:200000;background:rgba(13,31,52,.76);display:flex;align-items:center;justify-content:center;padding:22px;overflow:auto';o.innerHTML=`<div class="card" style="width:min(680px,100%);padding:28px"><div class="eyebrow">ANSWER REVIEW</div><h2 style="margin-top:8px">${correct?'✓ Correct':'Not quite — learn from this one'}</h2><div class="${correct?'success':'notice'}" style="margin:14px 0"><strong>Correct answer:</strong> ${String.fromCharCode(65+info.a)}. ${esc(correctText)}</div><h3>How to get there</h3><p style="font-size:16px;line-height:1.65">${esc(info.e)}</p><p class="muted">Take a moment to follow the process. SATprep.io uses your answer as evidence for what to reinforce next.</p><button class="btn" id="diagnosticFeedbackContinue" style="width:100%;margin-top:10px">Continue</button></div>`;document.body.appendChild(o);o.querySelector('#diagnosticFeedbackContinue').onclick=closeFeedback}

document.addEventListener('click',e=>{const btn=e.target.closest?.('[data-a]');if(!btn||showing)return;const card=btn.closest('.card');const q=card?.querySelector('.question')?.textContent?.trim();if(!q||!EXPLANATIONS[q])return;const options=[...card.querySelectorAll('[data-a]')].map(x=>x.textContent.replace(/^\s*[A-D]\.\s*/,'').trim());const selected=Number(btn.dataset.a);setTimeout(()=>showFeedback({question:q,selected,options}),40)},true);
