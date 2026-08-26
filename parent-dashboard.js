import { supabase } from "./supabase.js";

const esc = (value) => String(value ?? "").replace(/[&<>\"]/g, (match) => ({
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;"
}[match]));

let rendering = false;

async function getContext() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return null;
  try {
    const data = await authedPost("/api/parent-household-overview", {});
    if (!data?.profile || data.profile.role !== "parent") return null;
    return { session, profile: data.profile, students: data.students || [] };
  } catch (error) {
    console.warn("parent household overview unavailable", error?.message || error);
    return null;
  }
}

async function authedPost(url, body) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error("Please sign in again.");

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.access_token}`
    },
    body: JSON.stringify(body)
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "Request failed.");
  return data;
}

function unavailableSummary(message = "Progress is temporarily unavailable.") {
  return {
    available: false,
    completed: null,
    avgMastery: null,
    weakest: null,
    strongest: null,
    accuracy: null,
    attemptCount: null,
    completedPracticeSessions: null,
    latestPracticeAt: null,
    latestPracticeScore: null,
    trustedPracticeReady: false,
    error: message
  };
}

async function studentSummary(student) {
  try {
    const data = await authedPost("/api/parent-progress", { student_id: student.id });
    if (!data?.summary) return unavailableSummary();
    return { available: true, ...data.summary };
  } catch (error) {
    console.warn("parent progress unavailable", error?.message || error);
    return unavailableSummary(error?.message || undefined);
  }
}

function metric(value, suffix = "") {
  return value === null || value === undefined ? "—" : `${value}${suffix}`;
}

function studentCard(student, summary) {
  const name = student.display_name || [student.first_name, student.last_name].filter(Boolean).join(" ") || "Student";
  const accountReady = !!student.profile_id;
  const status = !accountReady
    ? "Login not activated"
    : student.diagnostic_completed_at
      ? "Learning path active"
      : student.onboarding_complete
        ? "Ready for diagnostic"
        : "Student setup needed";

  const trustedAccuracy = summary.available && summary.trustedPracticeReady && summary.attemptCount
    ? `${summary.accuracy}%`
    : "—";
  const trustedQuestions = summary.available && summary.trustedPracticeReady
    ? metric(summary.attemptCount)
    : "—";

  let insight = "Performance insights will appear after the student begins working.";
  if (!accountReady) {
    insight = "Activate the student's login so they can begin their diagnostic and learning journey.";
  } else if (!summary.available) {
    insight = "Progress is temporarily unavailable. Please refresh in a moment.";
  } else if (summary.strongest) {
    insight = `Strongest: <strong>${esc(summary.strongest.skill_key)}</strong>`;
  }
  if (summary.available && summary.weakest) {
    insight += `<br>Needs attention: <strong>${esc(summary.weakest.skill_key)}</strong>`;
  }
  if (summary.available && !summary.trustedPracticeReady) {
    insight += "<br><span class=\"small\">Trusted guided-practice reporting will appear after the secure practice backend is activated.</span>";
  }

  return `<article class="card" style="padding:22px">
    <div class="row">
      <div>
        <div class="eyebrow" style="margin-bottom:8px">STUDENT</div>
        <h2 style="margin:0 0 5px">${esc(name)}</h2>
        <div class="small">Grade ${student.grade_level || "—"} · ${esc(student.target_exam || "PSAT")} · Target ${student.target_score || "—"}</div>
      </div>
      <span class="badge ${student.diagnostic_completed_at ? "good" : "warn"}">${esc(status)}</span>
    </div>
    <div class="grid" style="margin-top:18px">
      <div class="c3"><div class="label">Lessons</div><div class="metric" style="font-size:24px">${metric(summary.completed)}</div></div>
      <div class="c3"><div class="label">Mastery</div><div class="metric" style="font-size:24px">${metric(summary.avgMastery, "%")}</div></div>
      <div class="c3"><div class="label">Recent accuracy</div><div class="metric" style="font-size:24px">${trustedAccuracy}</div></div>
      <div class="c3"><div class="label">Questions</div><div class="metric" style="font-size:24px">${trustedQuestions}</div></div>
    </div>
    <hr>
    <div class="row">
      <div class="small">${insight}</div>
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        ${!accountReady ? `<button class="btn activate-student" data-student="${student.id}">Activate student login</button>` : ""}
        <button class="btn secondary student-detail" data-student="${student.id}">View student</button>
      </div>
    </div>
  </article>`;
}

function activationModal(student) {
  const name = student.display_name || [student.first_name, student.last_name].filter(Boolean).join(" ") || "Student";
  const overlay = document.createElement("div");
  overlay.style.cssText = "position:fixed;inset:0;background:rgba(13,31,52,.58);z-index:9999;display:flex;align-items:center;justify-content:center;padding:20px";
  overlay.innerHTML = `<div class="card" style="width:min(560px,100%);padding:26px">
    <div class="eyebrow">ACTIVATE STUDENT LOGIN</div>
    <h2>${esc(name)}</h2>
    <p class="muted">Create the login this student will use for SATprep.io. This connects to the student record you already created; it will not create a second child.</p>
    <div id="activateError"></div>
    <div class="field"><label>Student email</label><input id="studentLoginEmail" type="email" placeholder="student@example.com" autocomplete="email"></div>
    <div class="field"><label>Temporary password</label><input id="studentLoginPassword" type="password" minlength="8" autocomplete="new-password"></div>
    <p class="small">Use an email the student can access, or a parent-managed address. The password must be at least 8 characters.</p>
    <div class="notice"><strong>Parent authorization:</strong> By activating this login, you authorize SATprep.io to create and maintain this student's account and learning data as part of your household subscription.</div>
    <div style="display:flex;gap:10px;margin-top:16px"><button class="btn" id="activateStudentConfirm">Activate login</button><button class="btn secondary" id="activateStudentCancel">Cancel</button></div>
  </div>`;
  document.body.appendChild(overlay);
  overlay.querySelector("#activateStudentCancel").onclick = () => overlay.remove();
  overlay.querySelector("#activateStudentConfirm").onclick = async () => {
    const button = overlay.querySelector("#activateStudentConfirm");
    const email = overlay.querySelector("#studentLoginEmail").value.trim();
    const password = overlay.querySelector("#studentLoginPassword").value;
    if (!email || password.length < 8) {
      overlay.querySelector("#activateError").innerHTML = '<div class="error">Enter a valid email and a password of at least 8 characters.</div>';
      return;
    }
    button.disabled = true;
    button.textContent = "Activating…";
    try {
      await authedPost("/api/activate-student-login", { student_id: student.id, email, password });
      overlay.innerHTML = `<div class="card" style="width:min(560px,100%);padding:26px">
        <div class="success"><strong>Student login activated.</strong><br>${esc(name)} can now sign in with <strong>${esc(email)}</strong>.</div>
        <p>The student's first steps will be to complete their learner profile and take the short diagnostic that builds their personalized learning path.</p>
        <button class="btn" id="activationDone">Done</button>
      </div>`;
      overlay.querySelector("#activationDone").onclick = () => location.reload();
    } catch (error) {
      button.disabled = false;
      button.textContent = "Activate login";
      overlay.querySelector("#activateError").innerHTML = `<div class="error">${esc(error.message)}</div>`;
    }
  };
}

function showStudent(student, summary) {
  const main = document.querySelector("main");
  if (!main || !student) return;
  const name = student.display_name || [student.first_name, student.last_name].filter(Boolean).join(" ") || "Student";
  const trustedAccuracy = summary.available && summary.trustedPracticeReady && summary.attemptCount
    ? `${summary.accuracy}%`
    : "—";

  main.innerHTML = `<section class="hero">
    <div class="row">
      <div>
        <div class="eyebrow">STUDENT OVERVIEW</div>
        <h1>${esc(name)}</h1>
        <p>Grade ${student.grade_level || "—"} · ${esc(student.target_exam || "PSAT")} · Target ${student.target_score || "—"}</p>
      </div>
      <button class="btn secondary" id="backParent">Back to parent dashboard</button>
    </div>
  </section>
  <section class="grid">
    <div class="card c3"><div class="label">Login</div><div class="metric" style="font-size:20px">${student.profile_id ? "Active" : "Not activated"}</div></div>
    <div class="card c3"><div class="label">Diagnostic</div><div class="metric" style="font-size:20px">${student.diagnostic_completed_at ? "Complete" : "Not started"}</div></div>
    <div class="card c3"><div class="label">Average mastery</div><div class="metric">${metric(summary.avgMastery, "%")}</div></div>
    <div class="card c3"><div class="label">Recent accuracy</div><div class="metric">${trustedAccuracy}</div></div>
    <div class="card c12">
      <h2>Next step</h2>
      <p class="muted">${!student.profile_id
        ? "Activate the student login so the student can sign in and begin the diagnostic."
        : !student.diagnostic_completed_at
          ? "The student is ready to sign in, finish their learner profile and take the initial diagnostic."
          : !summary.available
            ? "The learning path is active. Progress reporting is temporarily unavailable; please refresh shortly."
            : "The diagnostic is complete and the personalized learning journey is active."}</p>
      ${!student.profile_id ? '<button class="btn" id="activateFromDetail">Activate student login</button>' : ""}
    </div>
  </section>`;

  document.querySelector("#backParent")?.addEventListener("click", () => {
    main.removeAttribute("id");
    render();
  });
  document.querySelector("#activateFromDetail")?.addEventListener("click", () => activationModal(student));
}

async function render() {
  if (rendering) return;
  const params = new URLSearchParams(location.search);
  if (params.get("app") !== "1" || params.get("openBilling") === "1" || params.get("onboarding") === "child") return;

  const ctx = await getContext();
  if (!ctx) return;
  const main = document.querySelector("main");
  if (!main || document.querySelector("#parentDashboardEnhanced")) return;

  rendering = true;
  try {
    const summaries = await Promise.all(ctx.students.map(studentSummary));
    main.id = "parentDashboardEnhanced";
    main.className = "wrap";
    main.innerHTML = `<section class="hero">
      <div class="row" style="align-items:flex-start">
        <div><div class="eyebrow">PARENT DASHBOARD</div><h1>Welcome, ${esc(ctx.profile.first_name || "Parent")}.</h1><p>See each student's preparation, progress and next steps in one place.</p></div>
        <button class="btn" id="manageBilling">Plans & Billing</button>
      </div>
    </section>
    <section class="grid">
      <div class="card c3"><div class="label">Students</div><div class="metric">${ctx.students.length}</div></div>
      <div class="card c3"><div class="label">Household plan</div><div class="metric" style="font-size:21px">${ctx.students.length > 1 ? "Family" : "Individual"}</div></div>
      <div class="card c3"><div class="label">Active learners</div><div class="metric">${ctx.students.filter((student) => student.profile_id).length}</div></div>
      <div class="card c3"><div class="label">Account</div><div class="metric" style="font-size:17px">Parent</div></div>
    </section>
    <section style="display:grid;gap:16px;margin-top:18px">${ctx.students.length
      ? ctx.students.map((student, index) => studentCard(student, summaries[index])).join("")
      : '<div class="card"><h2>Add your first student</h2><p class="muted">Your family account is ready. Add a student to begin building a personalized SAT or PSAT learning path.</p><button class="btn" id="addFirstStudent">Add student</button></div>'}
    </section>
    <section class="card" style="margin-top:18px">
      <div class="row"><div><h2 style="margin-bottom:5px">Family & account</h2><div class="small">Manage students, billing, privacy and account access.</div></div><button class="btn secondary" id="addStudentFromDashboard">Add another student</button></div>
    </section>`;

    document.querySelector("#manageBilling")?.addEventListener("click", () => location.assign("/?app=1&openBilling=1"));
    document.querySelector("#addFirstStudent")?.addEventListener("click", () => location.assign("/?app=1&onboarding=child"));
    document.querySelector("#addStudentFromDashboard")?.addEventListener("click", () => location.assign("/?app=1&onboarding=child"));
    document.querySelectorAll(".activate-student").forEach((button) => button.addEventListener("click", () => activationModal(ctx.students.find((student) => student.id === button.dataset.student))));
    document.querySelectorAll(".student-detail").forEach((button) => button.addEventListener("click", () => {
      const index = ctx.students.findIndex((student) => student.id === button.dataset.student);
      showStudent(ctx.students[index], summaries[index]);
    }));
  } finally {
    rendering = false;
  }
}

const observer = new MutationObserver(() => setTimeout(render, 0));
observer.observe(document.documentElement, { childList: true, subtree: true });
setTimeout(render, 150);
supabase.auth.onAuthStateChange(() => setTimeout(render, 150));