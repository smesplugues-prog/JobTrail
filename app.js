(() => {
'use strict';

/* ============ Constants ============ */
const KEY = 'jobtrail.v1';
const STAGES = ['Applied', 'Interviewing', 'Offer', 'Rejected', 'Withdrawn'];
const INACTIVE = ['Rejected', 'Withdrawn'];
const ARR = ['Remote', 'Hybrid', 'On-site'];
const LEVELS = {
  entry:  { label: 'Entry level', years: '0–1 yrs', min: 0, max: 1 },
  mid:    { label: 'Mid level',   years: '2–4 yrs', min: 2, max: 4 },
  senior: { label: 'Senior',      years: '5+ yrs',  min: 5, max: 99 }
};
const NYC_WORDS = ['new york', 'nyc', 'manhattan', 'brooklyn', 'queens', 'bronx', 'staten island', 'long island city'];

/* ============ Helpers ============ */
const $ = (s, r = document) => r.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const uid = () => 'id' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const pad = n => String(n).padStart(2, '0');
const ymd = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const today = () => ymd(new Date());
const parts = s => s.split('-').map(Number);
const addDays = (s, n) => { const [y, m, d] = parts(s); return ymd(new Date(y, m - 1, d + n)); };
const daysBetween = (a, b) => { const [y1, m1, d1] = parts(a), [y2, m2, d2] = parts(b); return Math.round((Date.UTC(y2, m2 - 1, d2) - Date.UTC(y1, m1 - 1, d1)) / 864e5); };
const fmtDate = s => { const [y, m, d] = parts(s); return new Date(y, m - 1, d).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }); };
const validDate = s => { if (!/^\d{4}-\d{2}-\d{2}$/.test(s || '')) return false; const [y, m, d] = parts(s); const dt = new Date(y, m - 1, d); return dt.getFullYear() === y && dt.getMonth() === m - 1 && dt.getDate() === d; };
const fmtMoney = n => n % 1000 === 0 ? '$' + (n / 1000) + 'k' : '$' + n.toLocaleString('en-US');
const salaryText = j => j.salaryMin && j.salaryMax ? `${fmtMoney(j.salaryMin)}–${fmtMoney(j.salaryMax)} / yr` : j.salaryMin ? `${fmtMoney(j.salaryMin)}+ / yr` : j.salaryMax ? `Up to ${fmtMoney(j.salaryMax)} / yr` : 'Not listed';
const expText = j => { const a = j.expMin, b = j.expMax; if (a == null && b == null) return 'Not listed'; if (b == null) return `${a}+ years`; if (a == null) return `Up to ${b} years`; return a === b ? `${a} years` : `${a}–${b} years`; };
const parseNum = v => { v = String(v ?? '').trim(); if (v === '') return null; const n = Number(v); return Number.isFinite(n) ? n : NaN; };
const splitList = s => String(s || '').split(',').map(x => x.trim()).filter(Boolean).filter((x, i, a) => a.findIndex(y => y.toLowerCase() === x.toLowerCase()) === i);
const isNYC = s => { s = String(s || '').toLowerCase(); return NYC_WORDS.some(k => s.includes(k)) || /\bny\b/.test(s); };
const plural = (n, w) => `${n} ${w}${n === 1 ? '' : 's'}`;

function relTime(iso) {
  const d = new Date(iso), t = today(), k = ymd(d);
  const time = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  if (k === t) return `Today, ${time}`;
  if (k === addDays(t, -1)) return `Yesterday, ${time}`;
  return fmtDate(k);
}

/* ============ State ============ */
let storageOk = true;
let state;

function seed() {
  const t = today();
  const now = Date.now();
  const iso = days => new Date(now - days * 864e5).toISOString();
  const mk = (id, o) => Object.assign({ id, url: '', notes: '', demo: true, source: 'demo', status: 'new', addedAt: iso(3), salaryMin: null, salaryMax: null, expMin: null, expMax: null, skills: [] }, o);
  const jobs = [
    mk('demo-harborlight', { title: 'Data Analyst', company: 'Harborlight Analytics', location: 'Midtown Manhattan, NY', arrangement: 'Hybrid', salaryMin: 82000, salaryMax: 95000, expMin: 2, expMax: 4, skills: ['SQL', 'Tableau', 'Excel', 'A/B testing'], description: 'Sample posting: build weekly KPI dashboards for the product team, write SQL to answer ad-hoc questions, and help design A/B test readouts. Three days a week in the office.', status: 'applied', addedAt: iso(8) }),
    mk('demo-bridgeview', { title: 'Reporting Data Analyst', company: 'Bridgeview Health', location: 'Brooklyn, NY', arrangement: 'On-site', expMin: 1, expMax: 3, skills: ['SQL', 'Excel', 'Power BI'], description: 'Sample posting: maintain monthly operational reports for clinic managers, clean source data, and document report definitions. On-site in Brooklyn.', addedAt: iso(2) }),
    mk('demo-copperleaf', { title: 'Senior Data Analyst', company: 'Copperleaf Fintech', location: 'New York, NY (remote within NY/NJ/CT)', arrangement: 'Remote', salaryMin: 120000, salaryMax: 145000, expMin: 5, skills: ['SQL', 'Python', 'dbt', 'Looker'], description: 'Sample posting: own the metrics layer for a payments product, mentor junior analysts, and partner with finance on forecasting.', addedAt: iso(3) }),
    mk('demo-maplefinch', { title: 'Business Data Analyst', company: 'Maple & Finch Retail', location: 'Manhattan, NY', arrangement: 'Hybrid', salaryMin: 78000, salaryMax: 90000, expMin: 2, expMax: 4, skills: ['Excel', 'SQL', 'Tableau', 'Stakeholder reporting'], description: 'Sample posting: analyze store and e-commerce sales, present weekly findings to merchandising leads, and automate recurring spreadsheets.', status: 'saved', addedAt: iso(4) }),
    mk('demo-brightpath', { title: 'Marketing Data Analyst', company: 'Brightpath Education', location: 'Remote (US)', arrangement: 'Remote', salaryMin: 70000, salaryMax: 85000, expMin: 2, expMax: 3, skills: ['SQL', 'Google Analytics 4', 'Looker Studio', 'Excel'], description: 'Sample posting: measure campaign performance across email and paid channels and build reporting for the growth team.', addedAt: iso(1) }),
    mk('demo-tidewater', { title: 'Operations Data Analyst', company: 'Tidewater Logistics', location: 'Long Island City, Queens, NY', arrangement: 'On-site', salaryMin: 75000, salaryMax: 88000, expMin: 3, skills: ['SQL', 'Python', 'Excel', 'Process improvement'], description: 'Sample posting: analyze delivery times and warehouse throughput, and recommend process changes to operations managers.', addedAt: iso(2) }),
    mk('demo-atlas', { title: 'Data Analyst, Public Programs', company: 'Atlas Civic Data', location: 'Lower Manhattan, NY', arrangement: 'Hybrid', expMin: 1, expMax: 3, skills: ['R', 'SQL', 'Excel', 'GIS'], description: 'Sample posting: support city program evaluations, clean survey and administrative data, and produce public-facing summaries.', addedAt: iso(1) }),
    mk('demo-greenline', { title: 'Analytics Associate', company: 'Greenline Energy', location: 'Jersey City, NJ', arrangement: 'Hybrid', salaryMin: 85000, salaryMax: 100000, expMin: 2, expMax: 4, skills: ['SQL', 'Python', 'Power BI', 'Excel'], description: 'Sample posting: model energy usage trends and build dashboards for the commercial team.', addedAt: iso(5) })
  ];
  const app = { id: 'demo-app-harborlight', jobId: 'demo-harborlight', stage: 'Applied', appliedDate: addDays(t, -7), followUpDate: addDays(t, -1), contactName: 'Sample Recruiter', contactDetails: '', notes: 'Demo application. Sent resume and a short note about dashboard work.', url: '', createdAt: iso(7) };
  const s = {
    version: 1,
    demoSeeded: true,
    profile: { role: 'Data Analyst', location: 'New York, NY', level: 'mid', skills: ['SQL', 'Excel', 'Tableau', 'Python'], arrangements: ['Hybrid', 'Remote'], salaryMin: 75000, customized: false },
    jobs,
    applications: [app],
    tasks: [{ id: 'demo-task-resume', type: 'custom', title: 'Update resume with your latest dashboard project', dueDate: addDays(t, 2), done: false }],
    activity: [
      { id: uid(), text: 'Saved Business Data Analyst at Maple & Finch Retail', at: iso(1) },
      { id: uid(), text: 'Scheduled a follow-up with Harborlight Analytics', at: iso(6) },
      { id: uid(), text: 'Marked Harborlight Analytics as applied', at: iso(7) }
    ]
  };
  syncFollowUp(app, s);
  return s;
}

function validState(s) {
  return s && typeof s === 'object' && s.profile && typeof s.profile === 'object' &&
    Array.isArray(s.jobs) && Array.isArray(s.applications) && Array.isArray(s.tasks) && Array.isArray(s.activity);
}
function normalize(s) {
  const p = s.profile;
  if (!Array.isArray(p.skills)) p.skills = [];
  if (!Array.isArray(p.arrangements)) p.arrangements = [];
  if (!LEVELS[p.level]) p.level = 'mid';
  s.jobs.forEach(j => { if (!Array.isArray(j.skills)) j.skills = []; j.title = j.title || 'Untitled'; j.company = j.company || ''; j.location = j.location || ''; j.arrangement = ARR.includes(j.arrangement) ? j.arrangement : 'Hybrid'; j.addedAt = j.addedAt || new Date().toISOString(); j.status = j.status || 'new'; });
  s.applications.forEach(a => { if (!STAGES.includes(a.stage)) a.stage = 'Applied'; a.appliedDate = validDate(a.appliedDate) ? a.appliedDate : today(); });
  return s;
}
function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) { const s = JSON.parse(raw); if (validState(s)) return normalize(s); }
  } catch (e) { storageOk = false; }
  const s = seed();
  try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) { storageOk = false; }
  return s;
}
function save() {
  try { localStorage.setItem(KEY, JSON.stringify(state)); storageOk = true; } catch (e) { storageOk = false; }
}
function log(text) {
  state.activity.unshift({ id: uid(), text, at: new Date().toISOString() });
  state.activity.length = Math.min(state.activity.length, 40);
}

/* ============ Selectors ============ */
const getJob = id => state.jobs.find(j => j.id === id);
const getApp = id => state.applications.find(a => a.id === id);
const appForJob = jobId => state.applications.find(a => a.jobId === jobId);
const getTask = id => state.tasks.find(t => t.id === id);
const appActive = a => a && !INACTIVE.includes(a.stage);

/* ============ Follow-up <-> checklist sync ============ */
function syncFollowUp(app, s = state) {
  const job = s.jobs.find(j => j.id === app.jobId);
  const title = `Follow up with ${job ? job.company : 'the employer'} about your ${job ? job.title : ''} application`.replace(/\s+/g, ' ');
  const open = s.tasks.find(t => t.type === 'followup' && t.appId === app.id && !t.done);
  const active = !INACTIVE.includes(app.stage);
  if (active && app.followUpDate) {
    if (open) { open.dueDate = app.followUpDate; open.title = title; }
    else s.tasks.push({ id: uid(), type: 'followup', appId: app.id, title, dueDate: app.followUpDate, done: false });
  } else if (open) {
    s.tasks = s.tasks.filter(t => t !== open);
  }
}

/* ============ Matching ============ */
function analyze(job, p) {
  const reasons = [], gaps = [];
  let score = 0;
  const title = job.title.toLowerCase();
  const toks = String(p.role || '').toLowerCase().split(/[^a-z0-9]+/).filter(w => w.length > 1);
  if (toks.length) {
    const full = toks.every(w => title.includes(w.slice(0, 5)));
    const some = toks.some(w => title.includes(w.slice(0, 5)));
    if (full) { reasons.push(`The title matches your target role (${p.role})`); score += 3; }
    else if (some) { reasons.push(`The title is related to your target role (${p.role})`); score += 1; }
    else gaps.push(`The title doesn't clearly match ${p.role}`);
  }
  if (job.arrangement === 'Remote') { reasons.push(`It's remote, so location isn't a constraint`); score += 2; }
  else if (p.location && !job.location) gaps.push('Location is not listed');
  else if (p.location) {
    const pl = p.location.toLowerCase(), city = pl.split(',')[0].trim();
    const near = (isNYC(pl) && isNYC(job.location)) || (city && job.location.toLowerCase().includes(city));
    if (near) { reasons.push(`It's based in ${job.location}, near your preferred location`); score += 2; }
    else gaps.push(`Based in ${job.location}, which is outside ${p.location}`);
  }
  if (p.arrangements && p.arrangements.length) {
    if (p.arrangements.includes(job.arrangement)) { reasons.push(`${job.arrangement} work fits your preferences`); score += 2; }
    else gaps.push(`${job.arrangement} work isn't in your preferred arrangements`);
  }
  const mine = new Set((p.skills || []).map(s => s.toLowerCase()));
  const matched = job.skills.filter(s => mine.has(s.toLowerCase()));
  const missing = job.skills.filter(s => !mine.has(s.toLowerCase()));
  if (!job.skills.length) gaps.push('No skills are listed');
  else if (matched.length) { reasons.push(`You list ${matched.length} of its ${job.skills.length} skills: ${matched.join(', ')}`); score += 3 * matched.length / job.skills.length; }
  else gaps.push('None of its listed skills match the skills in your profile');
  if (matched.length && missing.length) gaps.push(`Skills you haven't listed: ${missing.join(', ')}`);
  if (!job.salaryMin && !job.salaryMax) gaps.push('Salary is not listed');
  else if (p.salaryMin) {
    const top = job.salaryMax || job.salaryMin;
    if (top >= p.salaryMin) { reasons.push(`Pay (${salaryText(job).replace(' / yr', '')}) meets your ${fmtMoney(p.salaryMin)} minimum`); score += 1; }
    else gaps.push(`Pay tops out at ${fmtMoney(top)}, below your ${fmtMoney(p.salaryMin)} minimum`);
  }
  if (job.expMin == null && job.expMax == null) gaps.push('Experience requirement is not listed');
  else {
    const L = LEVELS[p.level] || LEVELS.mid;
    const jMin = job.expMin ?? 0, jMax = job.expMax ?? 99;
    if (L.min <= jMax && L.max >= jMin) { reasons.push(`It asks for ${expText(job)}, in line with ${L.label.toLowerCase()}`); score += 1; }
    else gaps.push(`It asks for ${expText(job)}; you selected ${L.label} (${L.years})`);
  }
  if (!job.url) gaps.push(job.demo ? 'Demo listing: not a real, verified posting' : 'No listing link was added');
  const intro = job.source === 'manual' ? 'You added this job yourself. ' : '';
  const why = reasons.length
    ? intro + reasons.slice(0, 3).join('. ') + '.'
    : intro + 'There is not enough detail yet to compare this job with your profile.';
  return { reasons, gaps, matched, missing, score, why };
}

/* ============ UI state ============ */
const ui = { view: 'dashboard', jobStatus: 'review', jobArr: 'all', appStage: 'all', expanded: new Set(), highlight: null, reschedId: null, focus: null };
const main = $('#main');
const dlg = { app: $('#appDialog'), profile: $('#profileDialog'), job: $('#jobDialog') };
let toastTimer = null, toastAction = null;

function toast(msg, action) {
  const el = $('#toast');
  toastAction = action ? action.fn : null;
  el.innerHTML = `<span>${esc(msg)}</span>${action ? `<button type="button" data-action="toast-action">${esc(action.label)}</button>` : ''}`;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(hideToast, action ? 9000 : 5000);
}
function hideToast() { $('#toast').classList.remove('show'); toastAction = null; }

function commit() { save(); render(); }

/* ============ Rendering: shared bits ============ */
function stageBadge(s) { return `<span class="badge stage-${s.toLowerCase()}">${esc(s)}</span>`; }
function dueBadge(d) {
  const n = daysBetween(today(), d);
  if (n < 0) return `<span class="badge overdue">Overdue · ${esc(fmtDate(d))}</span>`;
  if (n === 0) return `<span class="badge today">Due today</span>`;
  return `<span class="badge upcoming">Upcoming · ${esc(fmtDate(d))}</span>`;
}
function profileLine() {
  const p = state.profile;
  const bits = [p.role, p.location, p.arrangements.length ? p.arrangements.join(' / ') : 'Any arrangement', (LEVELS[p.level] || LEVELS.mid).label];
  if (p.salaryMin) bits.push(`${fmtMoney(p.salaryMin)}+ preferred`);
  return bits.map(esc).join(' · ');
}

/* ============ Next step ============ */
function nextStep() {
  const t = today();
  const byDue = (a, b) => a.dueDate.localeCompare(b.dueDate);
  const open = state.tasks.filter(x => !x.done).sort(byDue);
  const fu = open.filter(x => x.type === 'followup' && appActive(getApp(x.appId)));
  const fuStep = (task, label) => {
    const app = getApp(task.appId);
    const n = daysBetween(t, task.dueDate);
    return {
      kind: 'followup', title: task.title,
      sub: `${n < 0 ? plural(-n, 'day') + ' overdue' : 'Due today'} · Applied ${fmtDate(app.appliedDate)}`,
      primary: { label: 'Open application', action: 'app-open', id: app.id, focus: 'followUpDate' },
      secondary: { label: 'Mark follow-up done', action: 'task-complete', id: task.id }
    };
  };
  const over = fu.filter(x => x.dueDate < t);
  if (over.length) return fuStep(over[0]);
  const due = fu.filter(x => x.dueDate === t);
  if (due.length) return fuStep(due[0]);
  const saved = state.jobs.filter(j => j.status === 'saved').sort((a, b) => b.addedAt.localeCompare(a.addedAt));
  if (saved.length) {
    const j = saved[0];
    return { kind: 'apply', title: `Apply to ${j.title} at ${j.company}`, sub: `You saved this job${saved.length > 1 ? ` (and ${saved.length - 1} more)` : ''}. Ready to send an application?`, primary: { label: 'Open saved job', action: 'go-job', id: j.id } };
  }
  const custom = open.filter(x => x.type === 'custom' && x.dueDate <= t);
  if (custom.length) return { kind: 'task', title: custom[0].title, sub: custom[0].dueDate < t ? `${plural(daysBetween(t, custom[0].dueDate), 'day')} overdue` : 'Due today', primary: { label: 'Go to checklist', action: 'go-task', id: custom[0].id } };
  if (fu.length) { const f = fu[0]; const app = getApp(f.appId); return { kind: 'followup', title: f.title, sub: `Coming up ${fmtDate(f.dueDate)}. Nothing urgent right now.`, primary: { label: 'Open application', action: 'app-open', id: app.id } }; }
  const fresh = state.jobs.filter(j => j.status === 'new').length;
  if (fresh) return { kind: 'review', title: `Review ${plural(fresh, 'new job')}`, sub: 'Save the ones you like and pass on the rest.', primary: { label: 'Review jobs', action: 'go', view: 'jobs', status: 'review' } };
  return { kind: 'empty', title: "You're all caught up", sub: 'Nothing is due. Add a job you found, or check back tomorrow.', primary: { label: 'Add a job', action: 'job-add-open' } };
}

/* ============ Views ============ */
function viewDashboard() {
  const step = nextStep();
  const t = today();
  const open = state.tasks.filter(x => !x.done).sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  const done = state.tasks.filter(x => x.done).sort((a, b) => (b.doneAt || '').localeCompare(a.doneAt || '')).slice(0, 8);
  const groups = [
    ['Overdue', 'overdue', open.filter(x => x.dueDate < t)],
    ['Due today', 'today', open.filter(x => x.dueDate === t)],
    ['Upcoming', 'upcoming', open.filter(x => x.dueDate > t)]
  ];
  const taskItem = x => {
    const app = x.type === 'followup' ? getApp(x.appId) : null;
    return `<li class="task" id="task-${x.id}">
      <div class="task-row"><label class="check"><input type="checkbox" data-action="task-complete" data-id="${x.id}"><span class="t">${esc(x.title)}</span></label></div>
      <div class="task-meta">${dueBadge(x.dueDate)}
        <button class="btn sm" type="button" data-action="resched-open" data-id="${x.id}">Reschedule</button>
        ${app ? `<button class="btn sm ghost" type="button" data-action="app-open" data-id="${app.id}">Open application</button>` : `<button class="btn sm ghost danger" type="button" data-action="task-delete" data-id="${x.id}">Delete</button>`}
      </div>
      ${ui.reschedId === x.id ? `<form class="resched" data-form="resched" data-id="${x.id}" novalidate>
        <div class="field"><label for="rs-${x.id}">New date</label><input type="date" id="rs-${x.id}" name="date" value="${esc(x.dueDate)}" required><p class="error" data-err="date" hidden></p></div>
        <div class="field"><button class="btn primary sm" type="submit">Save date</button></div>
        <div class="field"><button class="btn sm" type="button" data-action="resched-cancel">Cancel</button></div>
      </form>` : ''}
    </li>`;
  };
  const list = groups.filter(g => g[2].length).map(g => `
    <h3 class="group-title">${g[0]} <span class="badge ${g[1]}">${g[2].length}</span></h3>
    <ul>${g[2].map(taskItem).join('')}</ul>`).join('');
  const doneHtml = done.length ? `<details class="done"><summary>Completed (${done.length})</summary><ul>${done.map(x => `
    <li class="task is-done"><div class="task-row"><label class="check"><input type="checkbox" checked data-action="task-reopen" data-id="${x.id}"><span class="t">${esc(x.title)}</span></label></div></li>`).join('')}</ul></details>` : '';
  const counts = {
    saved: state.jobs.filter(j => j.status === 'saved').length,
    sent: state.applications.length,
    int: state.applications.filter(a => a.stage === 'Interviewing').length,
    rej: state.applications.filter(a => a.stage === 'Rejected').length
  };
  return `<div class="page">
    <div class="dash-head"><div><h1>Your job search</h1><p>${profileLine()}</p></div>
      <button class="btn" type="button" data-action="open-profile">Edit preferences</button></div>
    ${state.profile.customized ? '' : `<div class="banner"><span>You're looking at an <strong>example profile</strong> with demo jobs. Edit your preferences to make it yours.</span><button class="btn sm" type="button" data-action="open-profile">Edit preferences</button></div>`}
    <section class="next" aria-labelledby="next-h">
      <p class="eyebrow" id="next-h">Your next step</p>
      <h2>${esc(step.title)}</h2>
      <p class="sub">${esc(step.sub)}</p>
      <div class="actions">
        <button class="btn primary lg" type="button" data-action="${step.primary.action}" ${dataAttrs(step.primary)}>${esc(step.primary.label)}</button>
        ${step.secondary ? `<button class="btn lg" type="button" data-action="${step.secondary.action}" ${dataAttrs(step.secondary)}>${esc(step.secondary.label)}</button>` : ''}
      </div>
    </section>
    <div class="dash-grid">
      <section class="card g-list" aria-labelledby="list-h"><h2 id="list-h">Upcoming actions</h2>
        <form class="inline-form" data-form="task-add" novalidate>
          <div class="field" style="margin:0"><label for="ta-title">Add your own task</label><input type="text" id="ta-title" name="title" maxlength="120" placeholder="e.g. Tailor resume for Bridgeview"><p class="error" data-err="title" hidden></p></div>
          <div class="field" style="margin:0"><label for="ta-date">Due</label><input type="date" id="ta-date" name="date" value="${t}"><p class="error" data-err="date" hidden></p></div>
          <div class="field" style="margin:0"><button class="btn primary" type="submit">Add task</button></div>
        </form>
        ${list || `<div class="empty small"><strong>Nothing due right now</strong><p>Add a task above, or set a follow-up date on an application and it will appear here.</p></div>`}
        ${doneHtml}
      </section>
      <section class="summary g-summary" aria-label="Summary">
        <button class="stat" type="button" data-action="go" data-view="jobs" data-status="saved"><strong>${counts.saved}</strong><span>Jobs saved</span></button>
        <button class="stat" type="button" data-action="go" data-view="applications" data-stage="all"><strong>${counts.sent}</strong><span>Applications sent</span></button>
        <button class="stat" type="button" data-action="go" data-view="applications" data-stage="Interviewing"><strong>${counts.int}</strong><span>Interviews</span></button>
        <button class="stat" type="button" data-action="go" data-view="applications" data-stage="Rejected"><strong>${counts.rej}</strong><span>Rejections</span></button>
      </section>
      <section class="card g-activity activity" aria-labelledby="act-h"><h2 id="act-h">Recent activity</h2>
        ${state.activity.length ? `<ul>${state.activity.slice(0, 6).map(a => `<li><span>${esc(a.text)}</span><time datetime="${esc(a.at)}">${esc(relTime(a.at))}</time></li>`).join('')}</ul>` : `<div class="empty small"><p>Nothing yet. Save or pass on a job to get started.</p></div>`}
      </section>
    </div>
    <p class="hint">Your data is saved in this browser on this device only. It doesn't sync across devices. Use Profile → Download backup to keep a copy.${storageOk ? '' : ' <strong>Storage is unavailable here, so changes will be lost when you close this tab.</strong>'}</p>
  </div>`;
}
function dataAttrs(o) {
  return ['id', 'view', 'status', 'stage', 'focus'].filter(k => o[k]).map(k => `data-${k}="${esc(o[k])}"`).join(' ');
}

function jobCard(j) {
  const a = analyze(j, state.profile);
  const open = ui.expanded.has(j.id);
  const app = appForJob(j.id);
  const badge = { saved: '<span class="badge saved">Saved</span>', passed: '<span class="badge passed">Passed</span>', applied: '<span class="badge stage-applied">Applied</span>' }[j.status] || '';
  const view = j.url
    ? `<a class="btn ghost" href="${esc(j.url)}" target="_blank" rel="noopener noreferrer">View original listing<span class="sr"> (opens in a new tab)</span></a>`
    : `<span><button class="btn ghost" type="button" disabled aria-describedby="nourl-${j.id}">View original listing</button></span>`;
  let btns = '';
  if (j.status === 'new') btns = `<button class="btn primary" type="button" data-action="job-save" data-id="${j.id}">Save</button><button class="btn" type="button" data-action="job-pass" data-id="${j.id}">Pass</button>`;
  else if (j.status === 'saved') btns = `<button class="btn primary" type="button" data-action="job-apply" data-id="${j.id}">Mark as applied</button><button class="btn" type="button" aria-pressed="true" data-action="job-save" data-id="${j.id}">Saved ✓ (tap to unsave)</button><button class="btn" type="button" data-action="job-pass" data-id="${j.id}">Pass</button>`;
  else if (j.status === 'passed') btns = `<button class="btn primary" type="button" data-action="job-restore" data-id="${j.id}">Move back to review</button>`;
  else if (j.status === 'applied' && app) btns = `<button class="btn primary" type="button" data-action="app-open" data-id="${app.id}">View application</button>`;
  return `<article class="job" id="job-${j.id}" aria-labelledby="jt-${j.id}">
    <div class="job-top"><div><h3 id="jt-${j.id}">${esc(j.title)}</h3><p class="co">${esc(j.company)}</p></div>
      <div class="chips">${j.demo ? '<span class="badge demo">Demo listing</span>' : ''}${badge}</div></div>
    <div class="facts"><span><b>${esc(j.arrangement)}</b> · ${esc(j.location || 'Location not listed')}</span><span>Salary: <b>${esc(salaryText(j))}</b></span><span>Experience: <b>${esc(expText(j))}</b></span></div>
    ${j.skills.length ? `<ul class="chips" aria-label="Skills">${j.skills.map(s => `<li class="chip ${a.matched.includes(s) ? 'match' : ''}">${esc(s)}${a.matched.includes(s) ? '<span class="sr"> (in your profile)</span>' : ''}</li>`).join('')}</ul>` : ''}
    <div class="why"><span class="lbl">Why this was included</span>${esc(a.why)}</div>
    ${a.gaps.length ? `<div class="gaps"><span class="lbl">Gaps and unknowns</span><ul>${a.gaps.slice(0, open ? 99 : 2).map(g => `<li>${esc(g)}</li>`).join('')}</ul>${!open && a.gaps.length > 2 ? `<p class="hint">+ ${a.gaps.length - 2} more in details</p>` : ''}</div>` : ''}
    <div class="actions-row">${btns}${view}</div>
    ${j.url ? '' : `<p class="hint" id="nourl-${j.id}">${j.demo ? 'This is a demo job, so there is no real posting to open.' : 'No listing link was added for this job.'}</p>`}
    <div><button class="link-btn" type="button" aria-expanded="${open}" aria-controls="details-${j.id}" data-action="job-toggle" data-id="${j.id}">${open ? 'Hide details' : 'Show details'}</button></div>
    ${open ? `<div class="details" id="details-${j.id}">
      ${j.description ? `<div><h4>About this job</h4><p>${esc(j.description)}</p></div>` : ''}
      ${a.reasons.length ? `<div><h4>How it fits your profile</h4><ul class="reasons">${a.reasons.map(r => `<li>${esc(r)}</li>`).join('')}</ul></div>` : ''}
      ${j.notes ? `<div><h4>Your notes</h4><p>${esc(j.notes)}</p></div>` : ''}
      <p class="hint">${j.demo ? 'Demo data: this posting is made up for illustration and has not been verified.' : 'Added by you. Details were typed in manually.'}</p>
    </div>` : ''}
  </article>`;
}

function viewJobs() {
  const sc = { review: 0, saved: 0, passed: 0, applied: 0 };
  state.jobs.forEach(j => { if (j.status === 'new' || j.status === 'saved') sc.review++; if (j.status !== 'new') sc[j.status]++; });
  const statusOpts = [['review', 'To review', sc.review], ['saved', 'Saved', sc.saved], ['passed', 'Passed', sc.passed], ['applied', 'Applied', sc.applied], ['all', 'All', state.jobs.length]];
  const list = state.jobs.filter(j => {
    const okS = ui.jobStatus === 'all' ? true : ui.jobStatus === 'review' ? (j.status === 'new' || j.status === 'saved') : j.status === ui.jobStatus;
    return okS && (ui.jobArr === 'all' || j.arrangement === ui.jobArr);
  }).map(j => ({ j, s: analyze(j, state.profile).score })).sort((x, y) => y.s - x.s || y.j.addedAt.localeCompare(x.j.addedAt)).map(x => x.j);
  const hasDemo = state.jobs.some(j => j.demo);
  const emptyMsg = state.jobs.length === 0
    ? ['No jobs yet', 'Add a job you found and we will show how it fits your profile.']
    : ui.jobStatus === 'review' ? ['All reviewed', 'You have gone through every job here. Try the Saved filter, or add another job.']
    : ['Nothing matches these filters', 'Try a different status or work arrangement.'];
  return `<div class="page">
    <div class="page-head"><div><h1>Jobs to Review</h1><p class="muted">Matched against: ${profileLine()}</p></div>
      <button class="btn primary" type="button" data-action="job-add-open">Add a job</button></div>
    ${hasDemo ? `<div class="banner"><span><strong>Demo jobs:</strong> the listings marked “Demo listing” are made up for illustration. They are not real vacancies and have not been verified.</span></div>` : ''}
    <div class="filters">
      <div class="filter-group" role="group" aria-label="Filter by status"><span class="lbl">Status</span>
        ${statusOpts.map(o => `<button class="pill" type="button" aria-pressed="${ui.jobStatus === o[0]}" data-action="filter-status" data-value="${o[0]}">${o[1]} (${o[2]})</button>`).join('')}</div>
      <div class="filter-group" role="group" aria-label="Filter by work arrangement"><span class="lbl">Work style</span>
        ${['all', ...ARR].map(v => `<button class="pill" type="button" aria-pressed="${ui.jobArr === v}" data-action="filter-arr" data-value="${v}">${v === 'all' ? 'Any' : v}</button>`).join('')}</div>
    </div>
    <p class="hint" aria-live="polite">${plural(list.length, 'job')} shown</p>
    ${list.length ? `<div class="jobs">${list.map(jobCard).join('')}</div>` : `<div class="empty"><strong>${emptyMsg[0]}</strong><p>${emptyMsg[1]}</p><button class="btn primary" type="button" data-action="job-add-open">Add a job</button></div>`}
  </div>`;
}

function viewApps() {
  const sc = { all: state.applications.length };
  STAGES.forEach(s => sc[s] = state.applications.filter(a => a.stage === s).length);
  const list = state.applications.filter(a => ui.appStage === 'all' || a.stage === ui.appStage).sort((a, b) => b.appliedDate.localeCompare(a.appliedDate));
  const row = a => {
    const j = getJob(a.jobId) || { title: 'Job', company: 'Unknown' };
    const fu = appActive(a) && a.followUpDate ? `<span class="sub">Follow-up ${esc(fmtDate(a.followUpDate))}</span>` : '';
    return `<button class="app-row" type="button" data-action="app-open" data-id="${a.id}">
      <span class="main"><span class="title">${esc(j.title)} · ${esc(j.company)}</span><span class="sub">Applied ${esc(fmtDate(a.appliedDate))}${a.contactName ? ' · Contact: ' + esc(a.contactName) : ''}</span></span>
      <span class="side">${stageBadge(a.stage)}${appActive(a) && a.followUpDate ? dueBadge(a.followUpDate) : ''}</span></button>`;
  };
  const empty = state.applications.length === 0
    ? ['No applications yet', 'Save a job, then choose “Mark as applied” and it will show up here.', true]
    : ['No applications in this stage', 'Choose another stage to see the rest.', false];
  return `<div class="page">
    <div class="page-head"><div><h1>Applications</h1><p class="muted">Tap an application to update its stage, follow-up date, contact and notes.</p></div></div>
    <div class="filters"><div class="filter-group" role="group" aria-label="Filter by stage"><span class="lbl">Stage</span>
      ${[['all', 'All']].concat(STAGES.map(s => [s, s])).map(o => `<button class="pill" type="button" aria-pressed="${ui.appStage === o[0]}" data-action="filter-stage" data-value="${o[0]}">${o[1]} (${sc[o[0]]})</button>`).join('')}</div></div>
    ${list.length ? `<div class="rows">${list.map(row).join('')}</div>` : `<div class="empty"><strong>${empty[0]}</strong><p>${empty[1]}</p>${empty[2] ? '<button class="btn primary" type="button" data-action="go" data-view="jobs" data-status="saved">Go to saved jobs</button>' : ''}</div>`}
    <p class="hint">Saved on this device only; it doesn't sync across devices.</p>
  </div>`;
}

function render() {
  document.querySelectorAll('[data-nav]').forEach(a => { if (a.dataset.nav === ui.view) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); });
  main.innerHTML = ui.view === 'jobs' ? viewJobs() : ui.view === 'applications' ? viewApps() : viewDashboard();
  document.title = `${{ dashboard: 'Dashboard', jobs: 'Jobs to Review', applications: 'Applications' }[ui.view]} – JobTrail`;
  if (ui.highlight) {
    const el = document.getElementById('job-' + ui.highlight);
    if (el) { el.classList.add('flash'); el.scrollIntoView({ block: 'center' }); setTimeout(() => el.classList.remove('flash'), 2500); }
    ui.highlight = null;
  }
  if (ui.focus) { const el = $(ui.focus); if (el) el.focus(); ui.focus = null; }
}

/* ============ Forms: helpers ============ */
function field(o) {
  const id = `${o.p}-${o.name}`;
  const common = `id="${id}" name="${o.name}" ${o.required ? 'required' : ''} aria-describedby="${id}-hint ${id}-err"`;
  let input;
  if (o.type === 'select') input = `<select ${common}>${o.options.map(v => `<option value="${esc(v[0])}" ${v[0] === o.value ? 'selected' : ''}>${esc(v[1])}</option>`).join('')}</select>`;
  else if (o.type === 'textarea') input = `<textarea ${common} maxlength="${o.max || 2000}" placeholder="${esc(o.ph || '')}">${esc(o.value)}</textarea>`;
  else input = `<input type="${o.type || 'text'}" ${common} value="${esc(o.value)}" ${o.max ? `maxlength="${o.max}"` : ''} ${o.ph ? `placeholder="${esc(o.ph)}"` : ''} ${o.type === 'number' ? 'inputmode="numeric" min="0"' : ''}>`;
  return `<div class="field"><label for="${id}">${o.label}${o.required ? '' : ' <span class="opt">(optional)</span>'}</label>${input}
    <p class="hint" id="${id}-hint" ${o.hint ? '' : 'hidden'}>${o.hint || ''}</p><p class="error" id="${id}-err" data-err="${o.name}" hidden></p></div>`;
}
function showErrors(form, errs) {
  form.querySelectorAll('[data-err]').forEach(p => { p.hidden = true; p.textContent = ''; });
  form.querySelectorAll('[aria-invalid]').forEach(i => i.removeAttribute('aria-invalid'));
  let first = null;
  Object.keys(errs).forEach(name => {
    const p = form.querySelector(`[data-err="${name}"]`), input = form.elements[name];
    if (p) { p.textContent = errs[name]; p.hidden = false; }
    if (input && input.setAttribute) { input.setAttribute('aria-invalid', 'true'); if (!first) first = input; }
  });
  if (first) first.focus();
  return !first;
}
function shell(title, sub, bodyHtml, footHtml, formAttrs) {
  return `<div class="dlg-head"><div><h2>${esc(title)}</h2>${sub ? `<p>${esc(sub)}</p>` : ''}</div><button class="icon-btn" type="button" data-action="close-dialog" aria-label="Close">×</button></div>
    <form ${formAttrs} novalidate><div class="dlg-body">${bodyHtml}</div><div class="dlg-foot">${footHtml}</div></form>`;
}
function openDlg(d, html, labelText) {
  d.innerHTML = html;
  d.setAttribute('aria-label', labelText);
  if (!d.open) d.showModal();
}

/* ============ Profile dialog ============ */
function openProfile() {
  const p = state.profile;
  const body = `
    ${field({ p: 'pf', name: 'role', label: 'Target role', value: p.role, required: true, max: 80 })}
    ${field({ p: 'pf', name: 'location', label: 'Preferred location', value: p.location, required: true, max: 80, ph: 'City, State' })}
    ${field({ p: 'pf', name: 'level', label: 'Experience level', type: 'select', value: p.level, required: true, options: Object.keys(LEVELS).map(k => [k, `${LEVELS[k].label} (${LEVELS[k].years})`]) })}
    ${field({ p: 'pf', name: 'skills', label: 'Key skills', value: p.skills.join(', '), max: 300, hint: 'Separate with commas, like SQL, Excel, Tableau.' })}
    <div class="field"><span class="lab" id="arr-l">Work arrangement</span>
      <div class="checks" role="group" aria-labelledby="arr-l">${ARR.map(a => `<label><input type="checkbox" name="arrangements" value="${a}" ${p.arrangements.includes(a) ? 'checked' : ''}> ${a}</label>`).join('')}</div>
      <p class="hint">Leave all unchecked if you're open to anything.</p></div>
    ${field({ p: 'pf', name: 'salaryMin', label: 'Minimum salary (USD per year)', type: 'number', value: p.salaryMin ?? '', ph: '75000' })}
    <div class="section-sep"><h3>Your data</h3>
      <p class="notice" style="margin:10px 0 14px">Everything is saved in this browser on this device only. It does not sync across devices, and clearing site data erases it. Download a backup to be safe.</p>
      <div class="actions-row" style="margin-bottom:12px"><button class="btn" type="button" data-action="export">Download backup</button><button class="btn" type="button" data-action="import-pick">Restore from backup</button></div>
      <div class="confirm-zone" data-zone="reset">${zoneHtml('reset', false)}</div>
      <div class="confirm-zone" data-zone="clear" style="margin-top:8px">${zoneHtml('clear', false)}</div></div>`;
  openDlg(dlg.profile, shell('Your profile', 'Used to explain why each job was included.', body,
    `<button class="btn" type="button" data-action="close-dialog">Cancel</button><button class="btn primary" type="submit">Save preferences</button>`, 'data-form="profile"'), 'Your profile');
}
function zoneHtml(kind, ask) {
  const L = { reset: ['Reset to demo data', 'Replace everything with the example profile and demo jobs?', 'Yes, reset'], clear: ['Start fresh with no jobs', 'Delete all jobs, applications and tasks, and start empty?', 'Yes, delete everything'] }[kind];
  return ask
    ? `<span class="hint">${L[1]}</span><button class="btn danger solid sm" type="button" data-action="${kind}-confirm">${L[2]}</button><button class="btn sm" type="button" data-action="${kind}-cancel">Cancel</button>`
    : `<button class="btn danger" type="button" data-action="${kind}-ask">${L[0]}</button>`;
}
function saveProfile(form) {
  const f = new FormData(form), errs = {};
  const role = (f.get('role') || '').trim(), loc = (f.get('location') || '').trim();
  if (!role) errs.role = 'Enter the role you are looking for.';
  if (!loc) errs.location = 'Enter a city or area.';
  const sal = parseNum(f.get('salaryMin'));
  if (Number.isNaN(sal) || (sal != null && sal < 0)) errs.salaryMin = 'Enter a whole number, like 75000, or leave it blank.';
  if (!showErrors(form, errs)) return;
  Object.assign(state.profile, { role, location: loc, level: f.get('level'), skills: splitList(f.get('skills')), arrangements: f.getAll('arrangements'), salaryMin: sal, customized: true });
  log('Updated your job preferences');
  dlg.profile.close(); commit(); toast('Preferences saved. Job explanations now use them.');
}

/* ============ Add job dialog ============ */
function openJobForm() {
  const body = `
    <p class="notice" style="margin-bottom:16px">Paste a link if you have one, then type in the details yourself. Links are <strong>not</strong> imported automatically; we only store the link so you can open it later.</p>
    ${field({ p: 'jf', name: 'url', label: 'Listing URL', type: 'url', value: '', ph: 'https://…' })}
    ${field({ p: 'jf', name: 'title', label: 'Job title', value: '', required: true, max: 120 })}
    ${field({ p: 'jf', name: 'company', label: 'Company', value: '', required: true, max: 120 })}
    ${field({ p: 'jf', name: 'location', label: 'Location', value: '', max: 120, ph: 'Brooklyn, NY' })}
    ${field({ p: 'jf', name: 'arrangement', label: 'Work arrangement', type: 'select', value: 'Hybrid', required: true, options: ARR.map(a => [a, a]) })}
    <div class="two">${field({ p: 'jf', name: 'salaryMin', label: 'Salary min (USD/yr)', type: 'number', value: '' })}${field({ p: 'jf', name: 'salaryMax', label: 'Salary max (USD/yr)', type: 'number', value: '' })}</div>
    <div class="two">${field({ p: 'jf', name: 'expMin', label: 'Years of experience, min', type: 'number', value: '' })}${field({ p: 'jf', name: 'expMax', label: 'Years of experience, max', type: 'number', value: '' })}</div>
    ${field({ p: 'jf', name: 'skills', label: 'Skills mentioned', value: '', max: 300, hint: 'Separate with commas.' })}
    ${field({ p: 'jf', name: 'description', label: 'Notes or description', type: 'textarea', value: '' })}`;
  openDlg(dlg.job, shell('Add a job', 'Enter what you know. You can leave out anything you are unsure about.', body,
    `<button class="btn" type="button" data-action="close-dialog">Cancel</button><button class="btn primary" type="submit">Add job</button>`, 'data-form="job"'), 'Add a job');
}
function validUrl(u) { try { const x = new URL(u); return x.protocol === 'http:' || x.protocol === 'https:'; } catch (e) { return false; } }
function saveJobForm(form) {
  const f = new FormData(form), errs = {}, g = k => (f.get(k) || '').trim();
  const v = { title: g('title'), company: g('company'), url: g('url'), location: g('location'), arrangement: g('arrangement'), skills: splitList(g('skills')), description: g('description') };
  if (!v.title) errs.title = 'Enter the job title.';
  if (!v.company) errs.company = 'Enter the company name.';
  if (v.url && !validUrl(v.url)) errs.url = 'Enter a full link that starts with http:// or https://.';
  if (!ARR.includes(v.arrangement)) errs.arrangement = 'Choose remote, hybrid or on-site.';
  const nums = {};
  [['salaryMin', 'Enter a whole number, like 85000.', 0, 10000000], ['salaryMax', 'Enter a whole number, like 95000.', 0, 10000000], ['expMin', 'Enter years as a number from 0 to 40.', 0, 40], ['expMax', 'Enter years as a number from 0 to 40.', 0, 40]].forEach(([k, msg, lo, hi]) => {
    const n = parseNum(f.get(k)); if (Number.isNaN(n) || (n != null && (n < lo || n > hi))) errs[k] = msg; else nums[k] = n;
  });
  if (!errs.salaryMax && nums.salaryMin != null && nums.salaryMax != null && nums.salaryMax < nums.salaryMin) errs.salaryMax = "Maximum can't be lower than the minimum.";
  if (!errs.expMax && nums.expMin != null && nums.expMax != null && nums.expMax < nums.expMin) errs.expMax = "Maximum can't be lower than the minimum.";
  if (!errs.url && v.url) { const d = state.jobs.find(j => j.url && j.url.toLowerCase() === v.url.toLowerCase()); if (d) errs.url = `You already added this link (${d.title} at ${d.company}).`; }
  if (!errs.title && !errs.company) { const d = state.jobs.find(j => j.title.toLowerCase() === v.title.toLowerCase() && j.company.toLowerCase() === v.company.toLowerCase() && (j.location || '').toLowerCase() === v.location.toLowerCase()); if (d) errs.title = 'This job is already in your list.'; }
  if (!showErrors(form, errs)) return;
  const job = Object.assign({ id: uid(), demo: false, source: 'manual', status: 'new', notes: '', addedAt: new Date().toISOString() }, v, nums);
  state.jobs.unshift(job);
  log(`Added ${job.title} at ${job.company} to review`);
  ui.jobStatus = 'review'; ui.jobArr = 'all'; ui.highlight = job.id; ui.expanded.add(job.id); ui.view = 'jobs';
  dlg.job.close();
  if (location.hash !== '#jobs') history.replaceState(null, '', '#jobs');
  commit(); toast('Job added. See why it was included below.');
}

/* ============ Application drawer ============ */
function openApp(id, focusName) {
  const a = getApp(id); if (!a) return;
  const j = getJob(a.jobId) || { title: 'Job', company: 'Unknown', location: '', arrangement: '', demo: false };
  const t = today();
  const body = `
    ${field({ p: 'af', name: 'stage', label: 'Current stage', type: 'select', value: a.stage, required: true, options: STAGES.map(s => [s, s]) })}
    ${field({ p: 'af', name: 'appliedDate', label: 'Application date', type: 'date', value: a.appliedDate, required: true })}
    ${field({ p: 'af', name: 'followUpDate', label: 'Follow-up date', type: 'date', value: a.followUpDate || '', hint: appActive(a) ? 'Setting a date adds a reminder to your Dashboard checklist.' : 'Reminders are paused while this application is rejected or withdrawn.' })}
    <div class="quick field" role="group" aria-label="Quick follow-up dates">
      <button class="btn sm" type="button" data-action="quick-follow" data-days="3">In 3 days</button>
      <button class="btn sm" type="button" data-action="quick-follow" data-days="7">In 1 week</button>
      <button class="btn sm" type="button" data-action="quick-follow" data-days="14">In 2 weeks</button>
      <button class="btn sm ghost" type="button" data-action="quick-follow" data-days="">Clear date</button></div>
    ${field({ p: 'af', name: 'contactName', label: 'Contact name', value: a.contactName || '', max: 80 })}
    ${field({ p: 'af', name: 'contactDetails', label: 'Contact details', value: a.contactDetails || '', max: 200, ph: 'Email, phone or LinkedIn' })}
    ${field({ p: 'af', name: 'url', label: 'Original listing URL', type: 'url', value: a.url || '', ph: 'https://…', hint: j.demo && !a.url ? 'This is a demo job with no real listing. Add a link if you have one.' : '' })}
    ${field({ p: 'af', name: 'notes', label: 'Notes', type: 'textarea', value: a.notes || '', max: 2000, ph: 'What you sent, who you spoke with, next ideas…' })}`;
  const foot = `<div class="confirm-zone" data-zone="remove"><button class="btn danger" type="button" data-action="remove-ask">Remove from tracker</button></div>
    <div class="grp"><button class="btn" type="button" data-action="close-dialog">Cancel</button><button class="btn primary" type="submit">Save changes</button></div>`;
  openDlg(dlg.app, shell(`${j.title} · ${j.company}`, [j.location, j.arrangement].filter(Boolean).join(' · '), body, foot, `data-form="app" data-id="${a.id}"`), `Application: ${j.title} at ${j.company}`);
  if (focusName) { const el = dlg.app.querySelector(`[name="${focusName}"]`); if (el) el.focus(); }
}
function saveApp(form) {
  const a = getApp(form.dataset.id); if (!a) return;
  const f = new FormData(form), g = k => (f.get(k) || '').trim(), errs = {};
  const v = { stage: g('stage'), appliedDate: g('appliedDate'), followUpDate: g('followUpDate'), contactName: g('contactName'), contactDetails: g('contactDetails'), url: g('url'), notes: g('notes') };
  if (!STAGES.includes(v.stage)) errs.stage = 'Choose a stage.';
  if (!v.appliedDate) errs.appliedDate = 'Enter the date you applied.';
  else if (!validDate(v.appliedDate)) errs.appliedDate = 'Enter a valid date.';
  if (v.followUpDate && !validDate(v.followUpDate)) errs.followUpDate = 'Enter a valid date.';
  else if (v.followUpDate && !errs.appliedDate && v.followUpDate < v.appliedDate) errs.followUpDate = "The follow-up can't be before the application date.";
  if (v.url && !validUrl(v.url)) errs.url = 'Enter a full link that starts with http:// or https://.';
  if (!showErrors(form, errs)) return;
  const j = getJob(a.jobId), name = j ? j.company : 'this employer';
  const prevStage = a.stage, prevFU = a.followUpDate;
  Object.assign(a, v);
  if (j && v.url) j.url = v.url;
  syncFollowUp(a);
  if (prevStage !== v.stage) log(`Moved ${name} to ${v.stage}`);
  if (prevFU !== v.followUpDate) log(v.followUpDate ? `Set a follow-up with ${name} for ${fmtDate(v.followUpDate)}` : `Cleared the follow-up with ${name}`);
  dlg.app.close(); commit();
  if (INACTIVE.includes(v.stage)) toast(`Saved. Follow-up reminders are paused for ${v.stage.toLowerCase()} applications.`);
  else if (v.followUpDate && prevFU !== v.followUpDate) toast('Saved. Follow-up added to your checklist.', { label: 'View checklist', fn: () => navigate('dashboard') });
  else toast('Saved.');
}

/* ============ Actions ============ */
function navigate(view) {
  ui.view = view;
  if (location.hash === '#' + view) render(); else location.hash = '#' + view;
}
function route() {
  const h = location.hash.slice(1);
  ui.view = ['dashboard', 'jobs', 'applications'].includes(h) ? h : 'dashboard';
  render();
}
function setStatus(j, to, msg, label) {
  const prev = j.status;
  j.status = to; log(label); commit();
  toast(msg, { label: 'Undo', fn: () => { j.status = prev; log(`Undid: ${label}`); commit(); } });
}
function completeTask(id) {
  const t = getTask(id); if (!t || t.done) return;
  t.done = true; t.doneAt = new Date().toISOString();
  let name = '';
  if (t.type === 'followup') {
    const a = getApp(t.appId), j = a && getJob(a.jobId); name = j ? j.company : '';
    if (a && a.followUpDate === t.dueDate) a.followUpDate = '';
    log(`Completed follow-up with ${name || 'employer'}`);
  } else log(`Completed task: ${t.title}`);
  ui.reschedId = null; commit();
  toast(t.type === 'followup' ? 'Follow-up marked done. Your application stage is unchanged.' : 'Task marked done.', { label: 'Undo', fn: () => reopenTask(id, true) });
}
function reopenTask(id, quiet) {
  const t = getTask(id); if (!t || !t.done) return;
  if (t.type === 'followup') {
    const a = getApp(t.appId);
    if (!appActive(a)) { toast('Reminders are paused for this application, so it stays completed.'); return; }
    if (state.tasks.some(x => x.type === 'followup' && x.appId === t.appId && !x.done)) { toast('A newer follow-up already exists for this application.'); return; }
    if (!a.followUpDate) a.followUpDate = t.dueDate;
  }
  t.done = false; delete t.doneAt; commit();
  if (!quiet) toast('Moved back to your checklist.');
}

const actions = {
  'open-profile': () => openProfile(),
  'close-dialog': (d, el) => el.closest('dialog').close(),
  'toast-action': () => { const fn = toastAction; hideToast(); if (fn) fn(); },
  'go': d => { if (d.status) ui.jobStatus = d.status; if (d.stage) ui.appStage = d.stage; navigate(d.view); },
  'go-job': d => { ui.jobStatus = 'saved'; ui.jobArr = 'all'; ui.highlight = d.id; ui.expanded.add(d.id); navigate('jobs'); },
  'go-task': d => { ui.focus = `#task-${d.id} input`; render(); const el = document.getElementById('task-' + d.id); if (el) el.scrollIntoView({ block: 'center' }); },
  'filter-status': d => { ui.jobStatus = d.value; render(); },
  'filter-arr': d => { ui.jobArr = d.value; render(); },
  'filter-stage': d => { ui.appStage = d.value; render(); },
  'job-toggle': d => { ui.expanded.has(d.id) ? ui.expanded.delete(d.id) : ui.expanded.add(d.id); ui.focus = `[data-action="job-toggle"][data-id="${d.id}"]`; render(); },
  'job-save': d => {
    const j = getJob(d.id); if (!j) return;
    if (j.status === 'saved') setStatus(j, 'new', `Removed “${j.title}” from saved.`, `Unsaved ${j.title} at ${j.company}`);
    else setStatus(j, 'saved', `Saved “${j.title}”.`, `Saved ${j.title} at ${j.company}`);
  },
  'job-pass': d => { const j = getJob(d.id); if (j) setStatus(j, 'passed', `Passed on “${j.title}”.`, `Passed on ${j.title} at ${j.company}`); },
  'job-restore': d => { const j = getJob(d.id); if (j) setStatus(j, 'new', `Moved “${j.title}” back to review.`, `Moved ${j.title} at ${j.company} back to review`); },
  'job-apply': d => {
    const j = getJob(d.id); if (!j) return;
    let a = appForJob(j.id);
    if (!a) {
      a = { id: uid(), jobId: j.id, stage: 'Applied', appliedDate: today(), followUpDate: '', contactName: '', contactDetails: '', notes: '', url: j.url || '', createdAt: new Date().toISOString() };
      state.applications.push(a);
      log(`Marked ${j.company} as applied`);
    }
    j.status = 'applied'; commit();
    toast('Moved to Applications. Add a follow-up date below.');
    openApp(a.id, 'followUpDate');
  },
  'job-add-open': () => openJobForm(),
  'app-open': d => openApp(d.id, d.focus),
  'quick-follow': (d, el) => { const i = el.closest('form').elements.followUpDate; i.value = d.days ? addDays(today(), Number(d.days)) : ''; i.focus(); },
  'remove-ask': (d, el) => { el.closest('.confirm-zone').innerHTML = `<span class="hint">Remove this application and its reminders? The job goes back to Saved.</span><button class="btn danger solid sm" type="button" data-action="remove-confirm">Yes, remove</button><button class="btn sm" type="button" data-action="remove-cancel">Cancel</button>`; },
  'remove-cancel': (d, el) => { el.closest('.confirm-zone').innerHTML = '<button class="btn danger" type="button" data-action="remove-ask">Remove from tracker</button>'; },
  'remove-confirm': (d, el) => {
    const a = getApp(el.closest('form').dataset.id); if (!a) return;
    const j = getJob(a.jobId);
    state.tasks = state.tasks.filter(t => t.appId !== a.id);
    state.applications = state.applications.filter(x => x !== a);
    if (j) { j.status = 'saved'; log(`Removed ${j.company} from your applications`); }
    dlg.app.close(); commit(); toast('Removed. The job is back in Saved.');
  },
  'task-complete': d => completeTask(d.id),
  'task-reopen': d => reopenTask(d.id),
  'task-delete': d => {
    const t = getTask(d.id); if (!t) return;
    state.tasks = state.tasks.filter(x => x !== t); commit();
    toast('Task deleted.', { label: 'Undo', fn: () => { state.tasks.push(t); commit(); } });
  },
  'resched-open': d => { ui.reschedId = d.id; ui.focus = `#rs-${d.id}`; render(); },
  'resched-cancel': () => { ui.reschedId = null; render(); },
  'export': () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `jobtrail-backup-${today()}.json`;
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    toast('Backup downloaded.');
  },
  'import-pick': () => $('#importFile').click(),
  'reset-ask': (d, el) => { el.closest('.confirm-zone').innerHTML = zoneHtml('reset', true); },
  'reset-cancel': (d, el) => { el.closest('.confirm-zone').innerHTML = zoneHtml('reset', false); },
  'reset-confirm': () => { state = seed(); dlg.profile.close(); ui.expanded.clear(); commit(); toast('Demo data restored.'); },
  'clear-ask': (d, el) => { el.closest('.confirm-zone').innerHTML = zoneHtml('clear', true); },
  'clear-cancel': (d, el) => { el.closest('.confirm-zone').innerHTML = zoneHtml('clear', false); },
  'clear-confirm': () => {
    state = { version: 1, demoSeeded: false, profile: Object.assign({}, state.profile, { customized: true }), jobs: [], applications: [], tasks: [], activity: [] };
    dlg.profile.close(); ui.expanded.clear(); commit(); toast('Everything cleared. Add your first job to begin.');
  }
};

document.addEventListener('click', e => {
  const el = e.target.closest('[data-action]');
  if (el && actions[el.dataset.action]) { if (el.tagName === 'A') e.preventDefault(); actions[el.dataset.action](el.dataset, el, e); return; }
  if (e.target instanceof HTMLDialogElement) e.target.close(); // click on backdrop
});

document.addEventListener('submit', e => {
  const form = e.target.closest('form[data-form]'); if (!form) return;
  e.preventDefault();
  const kind = form.dataset.form;
  if (kind === 'profile') saveProfile(form);
  else if (kind === 'job') saveJobForm(form);
  else if (kind === 'app') saveApp(form);
  else if (kind === 'task-add') {
    const f = new FormData(form), title = (f.get('title') || '').trim(), date = f.get('date'), errs = {};
    if (!title) errs.title = 'Enter a task, like “Tailor resume”.';
    if (!validDate(date)) errs.date = 'Choose a due date.';
    if (!showErrors(form, errs)) return;
    state.tasks.push({ id: uid(), type: 'custom', title, dueDate: date, done: false });
    log(`Added task: ${title}`); ui.focus = '#ta-title'; commit(); toast('Task added.');
  } else if (kind === 'resched') {
    const t = getTask(form.dataset.id); const date = new FormData(form).get('date');
    if (!showErrors(form, validDate(date) ? {} : { date: 'Choose a valid date.' })) return;
    t.dueDate = date;
    if (t.type === 'followup') { const a = getApp(t.appId); if (a) a.followUpDate = date; const j = a && getJob(a.jobId); log(`Rescheduled follow-up with ${j ? j.company : 'employer'} to ${fmtDate(date)}`); }
    else log(`Rescheduled task to ${fmtDate(date)}: ${t.title}`);
    ui.reschedId = null; commit(); toast(`Rescheduled to ${fmtDate(date)}.`);
  }
});

$('#importFile').addEventListener('change', e => {
  const file = e.target.files[0]; e.target.value = '';
  if (!file) return;
  const r = new FileReader();
  r.onload = () => {
    try {
      const s = JSON.parse(r.result);
      if (!validState(s)) throw new Error('shape');
      state = normalize(s); state.applications.forEach(a => syncFollowUp(a));
      dlg.profile.close(); commit(); toast('Backup restored.');
    } catch (err) { toast("That file doesn't look like a JobTrail backup. Nothing was changed."); }
  };
  r.onerror = () => toast('Could not read that file.');
  r.readAsText(file);
});

window.addEventListener('hashchange', () => { route(); main.focus({ preventScroll: true }); window.scrollTo(0, 0); });

/* ============ Boot ============ */
state = load();
state.applications.forEach(a => syncFollowUp(a));
save();
route();
})();
