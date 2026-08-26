const DISCLOSURE_TEXT = 'SATprep.io is an independent test-preparation service and is not sponsored by, endorsed by, or associated with College Board.';

function isMarketingHome(){
  const params = new URLSearchParams(location.search);
  return params.get('app') !== '1' && params.get('billing') !== 'success' && params.get('openBilling') !== '1';
}

function installDisclosure(){
  if(!isMarketingHome()) return;
  const footer = document.querySelector('footer');
  if(!footer || document.querySelector('#collegeBoardIndependenceDisclosure')) return;

  const disclosure = document.createElement('div');
  disclosure.id = 'collegeBoardIndependenceDisclosure';
  disclosure.setAttribute('role','note');
  disclosure.setAttribute('aria-label','College Board independence disclosure');
  disclosure.style.cssText = 'max-width:1100px;margin:0 auto;padding:14px 22px 22px;text-align:center;font-size:12px;line-height:1.55;color:#5b6673';
  disclosure.textContent = DISCLOSURE_TEXT;
  footer.insertAdjacentElement('beforebegin', disclosure);
}

let scheduled = false;
function scheduleDisclosure(){
  if(scheduled) return;
  scheduled = true;
  queueMicrotask(()=>{
    scheduled = false;
    installDisclosure();
  });
}

new MutationObserver(scheduleDisclosure).observe(document.documentElement,{subtree:true,childList:true});
scheduleDisclosure();
