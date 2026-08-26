// Commercial guided-practice network-recovery guard.
// If the answer POST fails after the student has selected/entered a response, the trusted
// server may already have committed it. Keep that exact response locked and let the existing
// practice handler replay only the same answer through the idempotent server endpoint.

function lockAmbiguousPracticeRetry(){
 const root=document.querySelector('#learningV3Practice');
 if(!root)return;
 const save=root.querySelector('#serverPracticeSave');
 if(!save?.querySelector('.error'))return;
 root.querySelectorAll('[data-server-practice-choice]').forEach(button=>{button.disabled=true});
 const input=root.querySelector('#serverPracticeSpr');
 if(input)input.disabled=true;
 const retry=root.querySelector('#serverPracticeCheck');
 if(retry){
  retry.disabled=false;
  retry.textContent='Retry same answer';
  retry.setAttribute('aria-label','Retry the same saved practice answer');
 }
 if(save.dataset.retryLocked!=='1'){
  save.dataset.retryLocked='1';
  const note=document.createElement('p');
  note.className='small';
  note.textContent='Your selected answer is locked while we reconnect so a delayed save cannot be replaced by a different response.';
  save.appendChild(note);
 }
}

const observer=new MutationObserver(lockAmbiguousPracticeRetry);
observer.observe(document.documentElement,{subtree:true,childList:true});
document.addEventListener('click',event=>{
 const root=document.querySelector('#learningV3Practice');
 if(!root?.querySelector('#serverPracticeSave .error'))return;
 if(event.target.closest?.('[data-server-practice-choice]')){event.preventDefault();event.stopImmediatePropagation()}
},true);
document.addEventListener('beforeinput',event=>{
 const root=document.querySelector('#learningV3Practice');
 if(root?.querySelector('#serverPracticeSave .error')&&event.target?.id==='serverPracticeSpr'){event.preventDefault();event.stopImmediatePropagation()}
},true);
setTimeout(lockAmbiguousPracticeRetry,0);
