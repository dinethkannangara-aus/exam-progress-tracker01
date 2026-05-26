import "./styles.css";

const STORAGE_KEY = "exam-progress-tracker01:v1";

const olSubjects = [
  "Sinhala",
  "English",
  "Maths",
  "Science",
  "Buddhism",
  "History",
  "Commerce",
  "ICT",
  "Drama",
];

const streamConfig = {
  maths: {
    label: "Maths Stream",
    subjects: [
      { name: "Combined Mathematics", fixed: true },
      { name: "Physics", fixed: true },
      { name: "Chemistry", fixed: false },
    ],
  },
  bio: {
    label: "Bio Stream",
    subjects: [
      { name: "Biology", fixed: true },
      { name: "Physics", fixed: true },
      { name: "Chemistry", fixed: true },
    ],
  },
  commerce: {
    label: "Commerce Stream",
    subjects: [
      { name: "Accounting", fixed: true },
      { name: "Business Studies", fixed: true },
      { name: "Economics", fixed: true },
    ],
  },
  arts: {
    label: "Arts Stream",
    subjects: [],
  },
  technology: {
    label: "Technology Stream",
    subjects: [
      { name: "Science for Technology", fixed: true },
      { name: "Engineering Technology", fixed: false, slot: "tech-special" },
      { name: "ICT", fixed: false },
    ],
  },
};

const app = document.querySelector("#app");

let state = loadState();
let activeView = state.profile ? "tracker" : "home";

function loadState() {
  const fallback = {
    profile: null,
    ol: {
      papers: {},
    },
    al: {
      stream: "",
      subjects: [],
      papers: {},
    },
  };

  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return normalizeState(saved || fallback);
  } catch {
    return fallback;
  }
}

function normalizeState(value) {
  const next = {
    profile: value.profile || null,
    ol: value.ol || { papers: {} },
    al: value.al || { stream: "", subjects: [], papers: {} },
  };

  if (!next.ol.papers) next.ol.papers = {};
  if (!next.al.papers) next.al.papers = {};
  if (!Array.isArray(next.al.subjects)) next.al.subjects = [];
  return next;
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function setView(view) {
  activeView = view;
  render();
}

function resetProfile() {
  const shouldReset = window.confirm("Reset your profile and all saved tracker data?");
  if (!shouldReset) return;

  state = {
    profile: null,
    ol: { papers: {} },
    al: { stream: "", subjects: [], papers: {} },
  };
  activeView = "home";
  saveState();
  render();
}

function paperId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function percentage(mark, total = 100) {
  const safeTotal = Number(total) || 100;
  return Math.min(100, Math.max(0, Math.round((Number(mark) / safeTotal) * 100)));
}

function papersFor(scope, subjectName) {
  return state[scope].papers[subjectName] || [];
}

function getStats(scope, subjectName) {
  const papers = papersFor(scope, subjectName);
  const scores = papers.map((paper) => percentage(paper.marks, paper.total || 100));
  const average = scores.length
    ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length)
    : null;
  const first = scores[0] ?? null;
  const last = scores.length ? scores[scores.length - 1] : null;
  const change = first !== null && last !== null && scores.length > 1 ? last - first : null;

  return { papers, scores, average, first, last, change };
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function render() {
  app.innerHTML = `
    <div class="shell">
      ${renderNav()}
      <main>
        ${renderActiveView()}
      </main>
    </div>
  `;

  bindGlobalEvents();
  bindViewEvents();
}

function renderNav() {
  const hasProfile = Boolean(state.profile);

  return `
    <header class="topbar">
      <button class="brand" data-view="home" type="button" aria-label="Past Paper Tracker home">
        <span class="brand-mark">PT</span>
        <span>
          <strong>Past Paper Tracker</strong>
          <small>${hasProfile ? escapeHtml(state.profile.examType) : "Study dashboard"}</small>
        </span>
      </button>
      <nav class="nav-links" aria-label="Primary navigation">
        <button class="${activeView === "home" ? "active" : ""}" data-view="home" type="button">Home</button>
        <button class="${activeView === "tracker" ? "active" : ""}" data-view="tracker" type="button" ${hasProfile ? "" : "disabled"}>Tracker</button>
        <button class="${activeView === "progress" ? "active" : ""}" data-view="progress" type="button" ${hasProfile ? "" : "disabled"}>Progress</button>
      </nav>
      ${
        hasProfile
          ? `<button class="ghost-button" id="resetProfile" type="button">Reset profile</button>`
          : ""
      }
    </header>
  `;
}

function renderActiveView() {
  if (!state.profile || activeView === "home") return renderHome();
  if (activeView === "progress") return renderProgress();
  return state.profile.examType === "O/L" ? renderOlTracker() : renderAlTracker();
}

function renderHome() {
  const name = state.profile?.name || "";
  const examType = state.profile?.examType || "O/L";

  return `
    <section class="hero-grid">
      <div class="hero-copy">
        <p class="eyebrow">Sri Lankan exam preparation</p>
        <h1>Track past papers with clarity, confidence, and momentum.</h1>
        <p class="hero-text">
          Build a focused paper history, record weak lessons, and see each subject improve over time.
        </p>
        <div class="hero-metrics" aria-label="Tracker features">
          <span><strong>100</strong> mark default</span>
          <span><strong>O/L</strong> fixed subjects</span>
          <span><strong>A/L</strong> stream setup</span>
        </div>
      </div>
      <form class="setup-card" id="profileForm">
        <div class="card-heading">
          <span class="section-icon">01</span>
          <div>
            <h2>Student Setup</h2>
            <p>Your details stay in this browser.</p>
          </div>
        </div>
        <label>
          Student name
          <input name="studentName" type="text" value="${escapeHtml(name)}" placeholder="Enter your name" required />
        </label>
        <fieldset>
          <legend>Exam type</legend>
          <div class="segmented">
            <label>
              <input type="radio" name="examType" value="O/L" ${examType === "O/L" ? "checked" : ""} />
              <span>O/L</span>
            </label>
            <label>
              <input type="radio" name="examType" value="A/L" ${examType === "A/L" ? "checked" : ""} />
              <span>A/L</span>
            </label>
          </div>
        </fieldset>
        <button class="primary-button" type="submit">Continue</button>
      </form>
    </section>
  `;
}

function renderOlTracker() {
  return `
    <section class="page-heading">
      <p class="eyebrow">O/L tracker</p>
      <h1>Subject-wise past paper tracking</h1>
      <p>Marks are always out of 100. Each subject is measured against its own previous papers.</p>
    </section>
    <section class="subject-grid">
      ${olSubjects.map((subject) => renderSubjectCard("ol", subject, { fixedTotal: true })).join("")}
    </section>
  `;
}

function renderAlTracker() {
  if (!state.al.stream) return renderStreamSelection();

  return `
    <section class="page-heading split-heading">
      <div>
        <p class="eyebrow">A/L tracker</p>
        <h1>${escapeHtml(streamConfig[state.al.stream].label)}</h1>
        <p>Track papers per subject, adjust total marks when needed, and compare each subject with its own history.</p>
      </div>
      <button class="ghost-button" id="changeStream" type="button">Change stream</button>
    </section>
    ${renderAlSubjectManager()}
    <section class="subject-grid">
      ${state.al.subjects.map((subject) => renderSubjectCard("al", subject.name, { fixedTotal: false, subject })).join("")}
    </section>
  `;
}

function renderStreamSelection() {
  return `
    <section class="page-heading">
      <p class="eyebrow">A/L setup</p>
      <h1>Choose your stream</h1>
      <p>Your default subjects will be prepared from the stream rules. You can still edit flexible subjects later.</p>
    </section>
    <section class="stream-grid">
      ${Object.entries(streamConfig)
        .map(
          ([key, stream]) => `
            <button class="stream-card" data-stream="${key}" type="button">
              <span>${escapeHtml(stream.label)}</span>
              <small>${stream.subjects.length ? stream.subjects.map((item) => escapeHtml(item.name)).join(" / ") : "Choose and add your own subjects"}</small>
            </button>
          `,
        )
        .join("")}
    </section>
  `;
}

function renderAlSubjectManager() {
  const isArts = state.al.stream === "arts";
  const canAdd = isArts || state.al.subjects.some((subject) => !subject.fixed);

  return `
    <section class="panel">
      <div class="panel-title">
        <div>
          <h2>Subjects</h2>
          <p>Fixed subjects stay locked. Flexible subjects can be renamed or removed.</p>
        </div>
      </div>
      <div class="subject-manager">
        ${state.al.subjects
          .map(
            (subject) => `
              <div class="subject-pill">
                ${
                  subject.fixed
                    ? `<span>${escapeHtml(subject.name)}</span><small>Fixed</small>`
                    : `<input class="subject-name-input" data-subject-id="${subject.id}" value="${escapeHtml(subject.name)}" aria-label="Edit subject name" />
                       <button class="icon-button remove-subject" data-subject-id="${subject.id}" type="button" aria-label="Remove ${escapeHtml(subject.name)}">x</button>`
                }
              </div>
            `,
          )
          .join("")}
      </div>
      ${
        canAdd
          ? `<form class="inline-form" id="addAlSubjectForm">
              <input name="subjectName" type="text" placeholder="Add another subject" required />
              <button class="secondary-button" type="submit">Add subject</button>
            </form>`
          : ""
      }
      ${
        state.al.stream === "technology"
          ? `<div class="tech-choice">
              <span>Technology subject</span>
              <button class="chip ${hasSubject("Engineering Technology") ? "active" : ""}" data-tech-subject="Engineering Technology" type="button">Engineering Technology</button>
              <button class="chip ${hasSubject("Bio Systems Technology") ? "active" : ""}" data-tech-subject="Bio Systems Technology" type="button">Bio Systems Technology</button>
            </div>`
          : ""
      }
    </section>
  `;
}

function renderSubjectCard(scope, subjectName, options) {
  const stats = getStats(scope, subjectName);
  const subject = options.subject;

  return `
    <article class="subject-card">
      <div class="subject-card-header">
        <div>
          <h2>${escapeHtml(subjectName)}</h2>
          <p>${stats.papers.length} paper${stats.papers.length === 1 ? "" : "s"} tracked</p>
        </div>
        ${subject?.fixed ? `<span class="lock-badge">Fixed</span>` : ""}
      </div>
      <div class="score-row">
        <div>
          <span>Average</span>
          <strong>${stats.average === null ? "--" : `${stats.average}%`}</strong>
        </div>
        <div>
          <span>Improvement</span>
          <strong>${formatChange(stats.change)}</strong>
        </div>
      </div>
      <form class="paper-form" data-scope="${scope}" data-subject="${escapeHtml(subjectName)}">
        <div class="form-row">
          <label>
            Marks
            <input name="marks" type="number" min="0" ${options.fixedTotal ? 'max="100"' : ""} placeholder="0" required />
          </label>
          ${
            options.fixedTotal
              ? `<input name="total" type="hidden" value="100" />`
              : `<label>
                  Total
                  <input name="total" type="number" min="1" value="100" required />
                </label>`
          }
        </div>
        <label>
          Weak lessons
          <input name="weakLessons" type="text" placeholder="e.g. Algebra, essay structure" />
        </label>
        <label>
          Mistake notes
          <textarea name="mistakes" rows="3" placeholder="Write the main mistakes to avoid next time"></textarea>
        </label>
        <button class="primary-button small" type="submit">Add paper</button>
      </form>
      ${renderPaperHistory(scope, subjectName, stats)}
    </article>
  `;
}

function renderPaperHistory(scope, subjectName, stats) {
  if (!stats.papers.length) {
    return `<p class="empty-note">No papers yet. Add your first result to begin the subject timeline.</p>`;
  }

  return `
    <div class="paper-history">
      ${stats.papers
        .map(
          (paper, index) => `
            <div class="paper-item">
              <div>
                <strong>Paper ${index + 1}: ${percentage(paper.marks, paper.total)}%</strong>
                <span>${paper.marks}/${paper.total || 100} marks</span>
                ${paper.weakLessons ? `<small>Weak: ${escapeHtml(paper.weakLessons)}</small>` : ""}
                ${paper.mistakes ? `<small>Note: ${escapeHtml(paper.mistakes)}</small>` : ""}
              </div>
              <button class="icon-button remove-paper" data-scope="${scope}" data-subject="${escapeHtml(subjectName)}" data-paper-id="${paper.id}" type="button" aria-label="Remove paper">x</button>
            </div>
          `,
        )
        .join("")}
    </div>
  `;
}

function renderProgress() {
  if (state.profile.examType === "O/L") {
    return renderOlProgress();
  }

  return renderAlProgress();
}

function renderOlProgress() {
  return `
    <section class="page-heading">
      <p class="eyebrow">Progress</p>
      <h1>O/L subject improvement</h1>
      <p>Subjects are shown independently, so Sinhala is only compared with Sinhala, Maths with Maths, and so on.</p>
    </section>
    <section class="progress-list">
      ${olSubjects.map((subject) => renderProgressItem("ol", subject)).join("")}
    </section>
  `;
}

function renderAlProgress() {
  const summaries = state.al.subjects
    .map((subject) => ({ subject: subject.name, ...getStats("al", subject.name) }))
    .filter((item) => item.average !== null);
  const strongest = [...summaries].sort((a, b) => b.average - a.average)[0];
  const weakest = [...summaries].sort((a, b) => a.average - b.average)[0];

  return `
    <section class="page-heading">
      <p class="eyebrow">Progress</p>
      <h1>A/L performance overview</h1>
      <p>Average, strongest, weakest, and subject-wise improvement are calculated from your saved papers.</p>
    </section>
    <section class="summary-grid">
      <div class="summary-card">
        <span>Strongest subject</span>
        <strong>${strongest ? escapeHtml(strongest.subject) : "--"}</strong>
        <small>${strongest ? `${strongest.average}% average` : "Add papers to calculate"}</small>
      </div>
      <div class="summary-card">
        <span>Weakest subject</span>
        <strong>${weakest ? escapeHtml(weakest.subject) : "--"}</strong>
        <small>${weakest ? `${weakest.average}% average` : "Add papers to calculate"}</small>
      </div>
    </section>
    <section class="progress-list">
      ${state.al.subjects.map((subject) => renderProgressItem("al", subject.name)).join("")}
    </section>
  `;
}

function renderProgressItem(scope, subjectName) {
  const stats = getStats(scope, subjectName);
  const hasProgress = stats.first !== null && stats.last !== null && stats.scores.length > 1;

  return `
    <article class="progress-item">
      <div>
        <h2>${escapeHtml(subjectName)}</h2>
        <p>
          ${
            hasProgress
              ? `${stats.first}% to ${stats.last}% = ${formatChange(stats.change)}`
              : "Add at least two papers to show improvement"
          }
        </p>
      </div>
      <div class="mini-chart" aria-label="${escapeHtml(subjectName)} score history">
        ${
          stats.scores.length
            ? stats.scores.map((score) => `<span style="height:${Math.max(8, score)}%"></span>`).join("")
            : `<em>No data</em>`
        }
      </div>
    </article>
  `;
}

function formatChange(change) {
  if (change === null) return "--";
  return `${change >= 0 ? "+" : ""}${change}%`;
}

function bindGlobalEvents() {
  document.querySelectorAll("[data-view]").forEach((button) => {
    button.addEventListener("click", () => setView(button.dataset.view));
  });

  document.querySelector("#resetProfile")?.addEventListener("click", resetProfile);
}

function bindViewEvents() {
  document.querySelector("#profileForm")?.addEventListener("submit", (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    state.profile = {
      name: form.get("studentName").trim(),
      examType: form.get("examType"),
    };
    activeView = "tracker";
    saveState();
    render();
  });

  document.querySelectorAll("[data-stream]").forEach((button) => {
    button.addEventListener("click", () => {
      setupStream(button.dataset.stream);
      activeView = "tracker";
      saveState();
      render();
    });
  });

  document.querySelector("#changeStream")?.addEventListener("click", () => {
    state.al.stream = "";
    state.al.subjects = [];
    state.al.papers = {};
    saveState();
    render();
  });

  document.querySelectorAll(".paper-form").forEach((form) => {
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const formData = new FormData(form);
      const scope = form.dataset.scope;
      const subject = form.dataset.subject;
      const total = scope === "ol" ? 100 : Math.max(1, Number(formData.get("total")) || 100);
      const marksLimit = scope === "ol" ? 100 : total;
      const marks = Math.min(marksLimit, Math.max(0, Number(formData.get("marks"))));

      if (!state[scope].papers[subject]) state[scope].papers[subject] = [];
      state[scope].papers[subject].push({
        id: paperId(),
        marks,
        total,
        weakLessons: formData.get("weakLessons").trim(),
        mistakes: formData.get("mistakes").trim(),
        createdAt: new Date().toISOString(),
      });

      saveState();
      render();
    });
  });

  document.querySelectorAll(".remove-paper").forEach((button) => {
    button.addEventListener("click", () => {
      const { scope, subject, paperId: id } = button.dataset;
      state[scope].papers[subject] = papersFor(scope, subject).filter((paper) => paper.id !== id);
      saveState();
      render();
    });
  });

  document.querySelector("#addAlSubjectForm")?.addEventListener("submit", (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    addAlSubject(formData.get("subjectName").trim(), false);
    saveState();
    render();
  });

  document.querySelectorAll(".subject-name-input").forEach((input) => {
    input.addEventListener("change", () => renameAlSubject(input.dataset.subjectId, input.value.trim()));
  });

  document.querySelectorAll(".remove-subject").forEach((button) => {
    button.addEventListener("click", () => removeAlSubject(button.dataset.subjectId));
  });

  document.querySelectorAll("[data-tech-subject]").forEach((button) => {
    button.addEventListener("click", () => setTechSubject(button.dataset.techSubject));
  });
}

function setupStream(streamKey) {
  state.al.stream = streamKey;
  state.al.papers = {};
  state.al.subjects = streamConfig[streamKey].subjects.map((subject) => ({
    id: paperId(),
    name: subject.name,
    fixed: subject.fixed,
    slot: subject.slot || "",
  }));
}

function addAlSubject(name, fixed = false, slot = "") {
  if (!name || hasSubject(name)) return;
  state.al.subjects.push({ id: paperId(), name, fixed, slot });
}

function hasSubject(name) {
  return state.al.subjects.some((subject) => subject.name === name);
}

function renameAlSubject(subjectId, nextName) {
  const subject = state.al.subjects.find((item) => item.id === subjectId);
  if (!subject || subject.fixed || !nextName) {
    render();
    return;
  }

  const previousName = subject.name;
  subject.name = nextName;
  if (state.al.papers[previousName]) {
    state.al.papers[nextName] = state.al.papers[previousName];
    delete state.al.papers[previousName];
  }
  saveState();
  render();
}

function removeAlSubject(subjectId) {
  const subject = state.al.subjects.find((item) => item.id === subjectId);
  if (!subject || subject.fixed) return;

  state.al.subjects = state.al.subjects.filter((item) => item.id !== subjectId);
  delete state.al.papers[subject.name];
  saveState();
  render();
}

function setTechSubject(name) {
  const current = state.al.subjects.find((subject) => subject.slot === "tech-special");
  if (current) {
    delete state.al.papers[current.name];
    current.name = name;
  } else {
    addAlSubject(name, false, "tech-special");
  }
  saveState();
  render();
}

render();
