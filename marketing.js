import { supabase } from "./supabase.js";

const esc=s=>String(s??"").replace(/[&<>\"]/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'\"':"&quot;"}[m]));

function renderHome(){
 const app=document.querySelector("#app");
 app.innerHTML=`
 <header class="marketing-nav">
   <div class="logo">SAT<span>prep.io</span></div>
   <nav class="marketing-links"><a href="#how">How it works</a><a href="#parents">For parents</a><a href="#pricing">Pricing</a></nav>
   <div class="marketing-actions"><button class="btn ghost" data-auth="login">Log in</button><button class="btn" data-auth="signup">Get started free</button></div>
 </header>
 <main class="marketing-page">
  <section class="marketing-hero">
   <div class="hero-copy">
    <div class="eyebrow">Adaptive SAT & PSAT preparation</div>
    <h1>Stop guessing what to study next.</h1>
    <p class="lead">SATprep.io learns what a student knows, finds the skills holding them back, and builds a personalized path toward their target score.</p>
    <div class="hero-actions"><button class="btn btn-large" data-auth="signup">Get started for free</button><button class="btn ghost btn-large" data-auth="login">Already have an account? Log in</button></div>
    <div class="trust-row"><span>✓ 14-day free trial</span><span>✓ Personalized learning path</span><span>✓ Parent progress dashboard</span><span>✓ Cancel anytime</span></div>
   </div>
   <div class="score-card">
    <div class="score-top"><span>Personalized Readiness</span><span class="badge good">On track</span></div>
    <div class="score-target">Target Score <strong>1300</strong></div>
    <div class="mini-skill"><span>Reading & Writing</span><strong>81%</strong></div><div class="progress"><div style="width:81%"></div></div>
    <div class="mini-skill"><span>Math</span><strong>72%</strong></div><div class="progress"><div style="width:72%"></div></div>
    <div class="next-box"><small>NEXT RECOMMENDED SKILL</small><strong>Linear equations</strong><span>Chosen from performance, not a generic calendar.</span></div>
   </div>
  </section>
  <section class="proof-strip"><div><strong>Adaptive</strong><span>Lessons change as performance changes.</span></div><div><strong>Measurable</strong><span>Mastery, attempts and progress are tracked.</span></div><div><strong>Connected</strong><span>Students learn. Parents see the big picture.</span></div><div><strong>Flexible</strong><span>Continue on a computer, tablet or iPad.</span></div></section>
  <section class="marketing-section" id="how"><div class="section-heading"><span>HOW IT WORKS</span><h2>A smarter path from today's skills to test-day confidence.</h2></div><div class="feature-grid">
   <article><b>01</b><h3>Find the starting point</h3><p>Goals, prior testing and diagnostic performance establish what the student already knows and where instruction should begin.</p></article>
   <article><b>02</b><h3>Teach before testing</h3><p>Students learn the underlying math, reading and writing skills—not just test tricks or endless question drilling.</p></article>
   <article><b>03</b><h3>Prove mastery</h3><p>Performance is measured by skill. Weak areas trigger reinforcement while mastered material unlocks more advanced work.</p></article>
   <article><b>04</b><h3>Keep adapting</h3><p>The learning path evolves with every session so limited study time is spent where it can make the greatest difference.</p></article>
  </div></section>
  <section class="marketing-section parent-section" id="parents"><div><span class="eyebrow">Built for students. Visible to parents.</span><h2>Know whether the preparation is actually working.</h2><p>Parents can follow completed sessions, skill mastery, strengths, weaknesses, target-score progress and what SATprep.io recommends next—without hovering over every practice problem.</p><button class="btn" data-auth="signup">Create your family account</button></div><div class="parent-panel"><div><span>This week</span><strong>2 / 2 sessions</strong></div><div><span>Current strength</span><strong>Reading comprehension</strong></div><div><span>Needs attention</span><strong>Linear equations</strong></div><div><span>Learning path</span><strong>On track</strong></div></div></section>
  <section class="marketing-section pricing-section" id="pricing"><div class="section-heading"><span>SIMPLE PRICING</span><h2>Start free. Choose the plan that fits your family.</h2><p>Every paid plan begins with a 14-day free trial.</p></div><div class="price-grid">
   <article><h3>Individual</h3><div class="price">$19.95<small>/month</small></div><p>One student plus parent/guardian access.</p><strong>Or $199/year</strong><button class="btn" data-auth="signup">Start free</button></article>
   <article class="featured-price"><div class="popular">FAMILY VALUE</div><h3>Family</h3><div class="price">$29.95<small>/month</small></div><p>Up to three students plus parent/guardian access.</p><strong>Or $299/year</strong><button class="btn" data-auth="signup">Start free</button></article>
  </div></section>
  <section class="final-cta"><h2>Give every study session a purpose.</h2><p>Build a personalized SAT or PSAT learning path and see exactly what should come next.</p><button class="btn btn-large" data-auth="signup">Get started for free</button><div class="small">14-day free trial · Cancel anytime</div></section>
 </main><footer>SATprep.io · Adaptive SAT & PSAT preparation</footer>`;
 document.querySelectorAll("[data-auth]").forEach(b=>b.onclick=()=>openAuth(b.dataset.auth));
}

function openAuth(mode){
 window.dispatchEvent(new CustomEvent("satprep:auth",{detail:{mode}}));
}

async function init(){
 const {data:{session}}=await supabase.auth.getSession();
 if(session) return;
 renderHome();
 const observer=new MutationObserver(async()=>{
   const {data:{session:s}}=await supabase.auth.getSession();
   if(!s && !document.querySelector(".marketing-page") && !document.querySelector(".auth")) renderHome();
 });
 observer.observe(document.documentElement,{childList:true,subtree:true});
}

init();
