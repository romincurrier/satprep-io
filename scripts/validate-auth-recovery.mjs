import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import { authReturnKind, authEmailStatus, confirmationCopy, createRecoveryController, escapeAuthHtml, requestAuthEmail, verifiedAccountDestination } from '../auth-flow.js';

// All auth methods are in-memory mocks. No account, message or session is real.
const mockAuth = () => {
  const calls = [];
  return {calls, getUser:async()=>({data:{user:{id:'fixture-parent'}}}), updateUser:async value=>{calls.push(['update',value]);return {data:{user:{id:'fixture-parent'}},error:null}}, signOut:async value=>{calls.push(['signOut',value]);return {error:null}}};
};
const session = {user:{id:'fixture-parent'}};
const fixturePassword = 'Mock-only-passphrase';

test('recovery callbacks take precedence over signup markers and never select onboarding', () => {
  for (const input of [{search:'?auth=recovery&verified=1'}, {hash:'#type=recovery&access_token=fixture'}, {search:'?type=recovery&code=fixture'}]) assert.equal(authReturnKind(input),'recovery');
  assert.equal(authReturnKind({search:'?verified=1'}),'verification');
  assert.equal(authReturnKind({search:'?auth=login'}),null);
});

test('ordinary sign-in, initial sessions and empty recovery events cannot change passwords', async () => {
  const auth=mockAuth(), recovery=createRecoveryController(auth);
  for(const event of ['INITIAL_SESSION','SIGNED_IN','TOKEN_REFRESHED']) recovery.handleAuthEvent(event,session);
  recovery.handleAuthEvent('PASSWORD_RECOVERY',null);
  assert.equal(recovery.ready,false);
  await assert.rejects(recovery.updatePassword(fixturePassword,fixturePassword),/reset link/);
  assert.deepEqual(auth.calls,[]);
});

test('valid recovery is remembered for UI subscribers that attach after the event', () => {
  const recovery=createRecoveryController(mockAuth()), states=[];
  recovery.handleAuthEvent('PASSWORD_RECOVERY',session);
  recovery.subscribe(ready=>states.push(ready));
  assert.deepEqual(states,[true]);
});

test('short and mismatched passwords are rejected before contacting auth', async () => {
  const auth=mockAuth(), recovery=createRecoveryController(auth);
  recovery.handleAuthEvent('PASSWORD_RECOVERY',session);
  await assert.rejects(recovery.updatePassword('short','short'),/8 characters/);
  await assert.rejects(recovery.updatePassword(fixturePassword,'different-fixture'),/do not match/);
  assert.deepEqual(auth.calls,[]);
});

test('verified matching recovery updates once and ends the local recovery session', async () => {
  const auth=mockAuth(), recovery=createRecoveryController(auth);
  recovery.handleAuthEvent('PASSWORD_RECOVERY',session);
  assert.deepEqual(await recovery.updatePassword(fixturePassword,fixturePassword),{signOutFailed:false});
  assert.deepEqual(auth.calls,[['update',{password:fixturePassword}],['signOut',{scope:'local'}]]);
  assert.equal(recovery.ready,false);
  await assert.rejects(recovery.updatePassword(fixturePassword,fixturePassword),/reset link/);
});

test('expired or changed auth identity prevents mutation', async () => {
  for(const response of [{data:{user:null},error:{message:'expired'}},{data:{user:{id:'different-fixture'}}}]) {
    const auth=mockAuth();auth.getUser=async()=>response;
    const recovery=createRecoveryController(auth);recovery.handleAuthEvent('PASSWORD_RECOVERY',session);
    await assert.rejects(recovery.updatePassword(fixturePassword,fixturePassword),/no longer valid/);
    assert.deepEqual(auth.calls,[]);
  }
});

test('sign-out and account-switch events clear recovery readiness', () => {
  for(const event of ['SIGNED_OUT','SIGNED_IN','TOKEN_REFRESHED','USER_UPDATED']) {
    const recovery=createRecoveryController(mockAuth());recovery.handleAuthEvent('PASSWORD_RECOVERY',session);
    recovery.handleAuthEvent(event,{user:{id:'different-fixture'}});
    assert.equal(recovery.ready,false);
  }
});

test('sign-out during identity verification and concurrent submits cannot race an update', async () => {
  const auth=mockAuth();let finishLookup;auth.getUser=()=>new Promise(resolve=>finishLookup=resolve);
  const recovery=createRecoveryController(auth);recovery.handleAuthEvent('PASSWORD_RECOVERY',session);
  const first=recovery.updatePassword(fixturePassword,fixturePassword);
  await assert.rejects(recovery.updatePassword(fixturePassword,fixturePassword),/already in progress/);
  recovery.handleAuthEvent('SIGNED_OUT',null);
  recovery.handleAuthEvent('PASSWORD_RECOVERY',session);
  finishLookup({data:{user:session.user}});
  await assert.rejects(first,/no longer valid/);
  assert.deepEqual(auth.calls,[]);
});

test('failed updates do not claim success or sign out; successful update with logout failure stays accurate', async () => {
  const auth=mockAuth();auth.updateUser=async()=>({error:{message:'server policy'}});
  const recovery=createRecoveryController(auth);recovery.handleAuthEvent('PASSWORD_RECOVERY',session);
  await assert.rejects(recovery.updatePassword(fixturePassword,fixturePassword),/could not be updated/);
  assert.equal(recovery.ready,true);assert.deepEqual(auth.calls,[]);
  auth.updateUser=async()=>({error:null});auth.signOut=async()=>({error:{message:'unavailable'}});
  assert.deepEqual(await recovery.updatePassword(fixturePassword,fixturePassword),{signOutFailed:true});
  assert.equal(recovery.ready,false);
});

test('reset and confirmation requests use exact same-origin callbacks and signup resend type', async () => {
  const calls=[], auth={resetPasswordForEmail:async(...args)=>calls.push(['reset',...args]),resend:async args=>calls.push(['resend',args])};
  await requestAuthEmail(auth,'reset',' fixture@example.test ','https://www.satprep.io/ignored?next=https://untrusted.example');
  await requestAuthEmail(auth,'confirmation','fixture@example.test','https://www.satprep.io');
  assert.deepEqual(calls,[['reset','fixture@example.test',{redirectTo:'https://www.satprep.io/?auth=recovery'}],['resend',{type:'signup',email:'fixture@example.test',options:{emailRedirectTo:'https://www.satprep.io/?verified=1'}}]]);
});

test('known, unknown, already confirmed, throttled and failed email requests show identical conditional status', async () => {
  for(const kind of ['reset','confirmation']) for(const response of [null,{message:'not found'},{message:'already confirmed'},{message:'rate limited'},'throw']) {
    const request=async()=>{if(response==='throw')throw new Error('network');return {error:response}};
    assert.equal(await requestAuthEmail({resetPasswordForEmail:request,resend:request},kind,'fixture@example.test','https://www.satprep.io'),authEmailStatus(kind));
  }
  await assert.rejects(requestAuthEmail(null,'reset','fixture@example.test','https://www.satprep.io'),/unavailable/);
});

test('confirmation role copy and destinations do not trust arbitrary role markup or URLs', () => {
  assert.match(confirmationCopy('student').account,/learner/);
  assert.match(confirmationCopy('parent').account,/parent/);
  assert.equal(confirmationCopy('<script>').account,'account');
  assert.equal(verifiedAccountDestination('parent'),'/?app=1&onboarding=child');
  assert.equal(verifiedAccountDestination('student'),'/?app=1');
  assert.equal(verifiedAccountDestination('https://untrusted.example'),null);
  assert.equal(escapeAuthHtml('<img src=x onerror="bad">&'), '&lt;img src=x onerror=&quot;bad&quot;&gt;&amp;');
});

test('rendered confirmation escapes email, uses learner copy, and its login action goes directly to login', async () => {
  const nodes=new Map(), navigations=[];
  const document={querySelector:selector=>{if(!nodes.has(selector))nodes.set(selector,{innerHTML:'',focus(){},isConnected:true});return nodes.get(selector)}};
  const source=(await readFile(new URL('../account-confirmation.js',import.meta.url),'utf8')).replace(/^import .*;\n/gm,'').replace('export function','function');
  const context=vm.createContext({document,location:{assign:url=>navigations.push(url)},confirmationCopy,escapeAuthHtml,requestAuthEmail,supabase:null,setTimeout});
  vm.runInContext(source,context);
  context.showEmailConfirmation('<img src=x>@example.test','student');
  assert.match(nodes.get('#app').innerHTML,/learner account/);
  assert.doesNotMatch(nodes.get('#app').innerHTML,/<img src=x>/);
  nodes.get('#confirmLogin').onclick();
  assert.deepEqual(navigations,['/?auth=login']);
});

async function marketingFixture(auth) {
  const nodes=new Map(), confirmations=[];
  const document={querySelector:selector=>{
    if(!nodes.has(selector))nodes.set(selector,{innerHTML:'',value:selector.endsWith('Email')?'fixture@example.test':selector.endsWith('Dob')?'2010-01-01':'offline-fixture',focus(){},disabled:false,querySelector(){return this.button??=( {disabled:false})}});
    return nodes.get(selector);
  },querySelectorAll:()=>[]};
  const source=(await readFile(new URL('../marketing.js',import.meta.url),'utf8')).replace(/^import .*;\n/gm,'').replace(/\ninit\(\);\s*$/,'');
  const context=vm.createContext({document,location:{assign(){},origin:'https://www.satprep.io',search:''},supabase:{auth},initialAuthReturn:null,passwordRecovery:createRecoveryController(auth),showEmailConfirmation:(...args)=>confirmations.push(args),requestAuthEmail,URLSearchParams,setTimeout});
  vm.runInContext(source,context);
  return {context,nodes,confirmations};
}

test('parent and teen signup suppress duplicate submissions and recover from transport failure', async () => {
  for(const kind of ['parent','teen']) {
    let rejectRequest,calls=0;
    const {context,nodes}=await marketingFixture({signUp:()=>{calls++;return new Promise((resolve,reject)=>rejectRequest=reject)}});
    kind==='parent'?context.parentSignup():context.teenSignup(16);
    const form=nodes.get(kind==='parent'?'#parentForm':'#teenForm'),event={preventDefault(){},currentTarget:form};
    const first=form.onsubmit(event);
    await form.onsubmit(event);
    assert.equal(calls,1);assert.equal(form.button.disabled,true);
    rejectRequest(new Error('Offline fixture: connection unavailable'));
    await first;
    assert.equal(form.button.disabled,false);
    assert.match(nodes.get('#msg').innerHTML,/connection unavailable/);
  }
});

test('parent and teen signup forward their explicit role to confirmation without an observer', async () => {
  for(const kind of ['parent','teen']) {
    const {context,nodes,confirmations}=await marketingFixture({signUp:async()=>({data:{session:null},error:null})});
    kind==='parent'?context.parentSignup():context.teenSignup(16);
    const form=nodes.get(kind==='parent'?'#parentForm':'#teenForm');
    await form.onsubmit({preventDefault(){},currentTarget:form});
    assert.equal(confirmations[0][1],kind==='parent'?'parent':'student');
  }
});
