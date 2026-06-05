const DATA_PATHS = {
  stations: "data/stations.json",
  hints: "data/hints.json",
  audio: "data/audio.json",
  facilitator: "data/facilitator.json"
};

const AUDIO_BASE = "../public/audio/";
const STORAGE_KEY = "itEscapeGameState.v1";
const CUSTOM_CONTENT_KEY = "itEscapeGameContent.v1";

const state = {
  started: false,
  teamName: "",
  currentStationId: null,
  solved: [],
  shownHints: {},
  facilitatorUnlocked: false,
  timerSeconds: 60 * 60,
  timerRunning: false,
  timerStartedAt: null
};

const data = {
  stations: [],
  hints: {},
  audio: {},
  facilitator: { pin: "1984", solutions: [] }
};

let timerInterval = null;

const $ = (selector) => document.querySelector(selector);

function persistState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function restoreState() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return;
  try {
    const saved = JSON.parse(raw);
    Object.assign(state, saved);
  } catch {
    localStorage.removeItem(STORAGE_KEY);
  }
}

async function loadJson(path) {
  const response = await fetch(path);
  if (!response.ok) throw new Error(`Konnte ${path} nicht laden`);
  return response.json();
}

async function loadData() {
  const [stations, hints, audio, facilitator] = await Promise.all([
    loadJson(DATA_PATHS.stations),
    loadJson(DATA_PATHS.hints),
    loadJson(DATA_PATHS.audio),
    loadJson(DATA_PATHS.facilitator)
  ]);
  data.stations = stations.sort((a, b) => a.order - b.order);
  data.hints = hints;
  data.audio = audio;
  data.facilitator = facilitator;
  applyCustomContent();
}

function applyCustomContent() {
  const raw = localStorage.getItem(CUSTOM_CONTENT_KEY);
  if (!raw) return;
  try {
    const custom = JSON.parse(raw);
    if (Array.isArray(custom.stations)) data.stations = custom.stations.sort((a, b) => a.order - b.order);
    if (custom.hints && typeof custom.hints === "object") data.hints = custom.hints;
    if (custom.facilitator && typeof custom.facilitator === "object") {
      data.facilitator = {
        ...data.facilitator,
        ...custom.facilitator,
        solutions: Array.isArray(custom.facilitator.solutions) ? custom.facilitator.solutions : data.facilitator.solutions
      };
    }
  } catch {
    localStorage.removeItem(CUSTOM_CONTENT_KEY);
  }
}

function persistCustomContent() {
  const payload = {
    version: 1,
    savedAt: new Date().toISOString(),
    stations: data.stations,
    hints: data.hints,
    facilitator: data.facilitator
  };
  localStorage.setItem(CUSTOM_CONTENT_KEY, JSON.stringify(payload));
}

function stationById(id) {
  return data.stations.find((station) => station.id === id);
}

function solutionByStationId(id) {
  return data.facilitator.solutions.find((solution) => solution.stationId === id);
}

function isSolved(id) {
  return state.solved.includes(id);
}

function isUnlocked(station) {
  if (station.order === 1) return true;
  const previous = data.stations.find((candidate) => candidate.order === station.order - 1);
  if (station.path === "bonus") {
    return data.stations.filter((candidate) => candidate.path === "main").every((candidate) => isSolved(candidate.id));
  }
  return previous ? isSolved(previous.id) : false;
}

function showToast(message) {
  const toast = $("#toast");
  toast.textContent = message;
  toast.classList.remove("hidden");
  window.clearTimeout(showToast.timeout);
  showToast.timeout = window.setTimeout(() => toast.classList.add("hidden"), 4200);
}

function formatTime(seconds) {
  const safe = Math.max(0, seconds);
  const minutes = String(Math.floor(safe / 60)).padStart(2, "0");
  const rest = String(safe % 60).padStart(2, "0");
  return `${minutes}:${rest}`;
}

function renderProgress() {
  const mainStations = data.stations.filter((station) => station.path === "main");
  const solvedMain = mainStations.filter((station) => isSolved(station.id)).length;
  const solvedTotal = state.solved.length;
  $("#timerDisplay").textContent = formatTime(state.timerSeconds);
  $("#progressText").textContent = state.started
    ? `${solvedMain} von ${mainStations.length} Hauptstationen gelöst · ${solvedTotal}/${data.stations.length} gesamt`
    : "Spiel noch nicht gestartet";
  $("#finishButton").classList.toggle("hidden", solvedMain < mainStations.length);
}

function startTimer() {
  if (timerInterval) window.clearInterval(timerInterval);
  timerInterval = window.setInterval(() => {
    if (!state.timerRunning) return;
    state.timerSeconds = Math.max(0, state.timerSeconds - 1);
    renderProgress();
    if (state.timerSeconds === 0) state.timerRunning = false;
    persistState();
  }, 1000);
}

function renderStationList() {
  const container = $("#stationList");
  container.innerHTML = "";
  data.stations.forEach((station) => {
    const unlocked = isUnlocked(station);
    const solved = isSolved(station.id);
    const button = document.createElement("button");
    button.type = "button";
    button.className = `station-card ${unlocked ? "unlocked" : "locked"} ${solved ? "solved" : ""} ${state.currentStationId === station.id ? "active" : ""}`;
    button.disabled = !unlocked && !solved;
    const statusLabel = solved ? "gelöst" : unlocked ? "verfügbar" : "gesperrt";
    const stationLabel = station.path === "bonus" ? "Bonusstation" : `Station ${station.order}`;
    button.setAttribute("aria-label", `${stationLabel}: ${station.title}. Thema: ${station.topic}. ca. ${station.estimatedMinutes} Minuten. Status: ${statusLabel}.`);
    button.innerHTML = `
      <span class="badge ${solved ? "success" : station.path === "bonus" ? "warning" : ""}">${solved ? "Gelöst" : station.path === "bonus" ? "Bonus" : `Station ${escapeHtml(station.order)}`}</span>
      <strong>${escapeHtml(station.title)}</strong>
      <small>${escapeHtml(station.topic)} · ca. ${escapeHtml(station.estimatedMinutes)} Min.</small>
    `;
    button.addEventListener("click", () => renderStation(station.id));
    container.appendChild(button);
  });
  renderProgress();
}

function renderMaterial(material) {
  if (!material || typeof material !== "object") {
    return `<article class="material-card"><p>${escapeHtml(String(material || ""))}</p></article>`;
  }
  if (material.type === "mail") {
    return `
      <article class="material-card">
        <h3>${escapeHtml(material.title)}</h3>
        <div class="mail-meta">
          <span><strong>Von:</strong> <code>${escapeHtml(material.from)}</code></span>
          <span><strong>Betreff:</strong> ${escapeHtml(material.subject)}</span>
          <span><strong>Anhang:</strong> ${escapeHtml(material.attachment)}</span>
          ${material.extra ? `<span><strong>Zusatz:</strong> ${escapeHtml(material.extra)}</span>` : ""}
        </div>
        <p>${escapeHtml(material.body)}</p>
      </article>
    `;
  }
  if (material.type === "table") {
    const headersSource = Array.isArray(material.headers) ? material.headers : [];
    const rowsSource = Array.isArray(material.rows) ? material.rows : [];
    const headers = headersSource.map((header) => `<th>${escapeHtml(header)}</th>`).join("");
    const rows = rowsSource.map((row) => {
      const cells = Array.isArray(row) ? row : [row];
      return `<tr>${cells.map((cell) => `<td>${escapeHtml(String(cell))}</td>`).join("")}</tr>`;
    }).join("");
    if (!headers && !rows) return `<article class="material-card"><p>${escapeHtml(material.title || "Tabelle ohne Einträge")}</p></article>`;
    return `<div class="material-card table-wrap"><table><thead><tr>${headers}</tr></thead><tbody>${rows}</tbody></table></div>`;
  }
  if (material.type === "list") {
    const items = Array.isArray(material.items) ? material.items : [];
    return `<article class="material-card"><h3>${escapeHtml(material.title || "Liste")}</h3><ul>${items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul></article>`;
  }
  if (material.type === "code") {
    return `<article class="material-card"><h3>${escapeHtml(material.title || "Code")}</h3><pre>${escapeHtml(material.code)}</pre></article>`;
  }
  return `<article class="material-card"><p>${escapeHtml(material.text || "")}</p></article>`;
}

function renderStation(stationId) {
  const station = stationById(stationId);
  if (!station || (!isUnlocked(station) && !isSolved(station.id))) return;
  state.currentStationId = station.id;
  persistState();
  renderStationList();

  const shownHints = state.shownHints[station.id] || 0;
  const solved = isSolved(station.id);
  const detail = $("#stationDetail");
  const materials = Array.isArray(station.materials) ? station.materials : [];
  detail.innerHTML = `
    <span class="badge ${station.path === "bonus" ? "warning" : ""}">${station.path === "bonus" ? "Bonusstation" : `Station ${escapeHtml(station.order)}`}</span>
    <h2>${escapeHtml(station.title)}</h2>
    <p>${escapeHtml(station.story)}</p>
    <p><strong>Auftrag:</strong> ${escapeHtml(station.task)}</p>
    <div class="material-grid">${materials.map(renderMaterial).join("")}</div>
    <div class="button-row">
      <button type="button" data-action="audio">Audio abspielen</button>
      <button type="button" data-action="hint">Hinweis anzeigen</button>
    </div>
    <div class="hints" id="hintList">${renderHintList(station.id, shownHints)}</div>
    <hr>
    <h3>Schloss-Code</h3>
    <div class="code-check">
      <label>
        <span class="sr-only">Dreistelliger Code</span>
        <input id="codeInput" type="text" inputmode="numeric" pattern="[0-9]{3}" maxlength="3" placeholder="___" aria-describedby="codeFeedback" ${solved ? "disabled" : ""}>
      </label>
      <button type="button" data-action="check" class="primary" ${solved ? "disabled" : ""}>Code prüfen</button>
    </div>
    <p id="codeFeedback" class="feedback ${solved ? "ok" : ""}" role="status">${solved ? "Code akzeptiert. Schloss geöffnet." : ""}</p>
    ${solved ? `<blockquote><strong>Lernpunkt:</strong> ${escapeHtml(station.learningPoint)}<br><strong>Berufsbezug:</strong> ${escapeHtml(station.careerLink)}</blockquote>` : ""}
  `;
  detail.querySelector('[data-action="audio"]').addEventListener("click", () => playAudio(station.audio));
  detail.querySelector('[data-action="hint"]').addEventListener("click", () => showNextHint(station.id));
  const checkButton = detail.querySelector('[data-action="check"]');
  if (checkButton) checkButton.addEventListener("click", () => checkCode(station.id));
  const input = detail.querySelector("#codeInput");
  if (input) input.addEventListener("keydown", (event) => { if (event.key === "Enter") checkCode(station.id); });
  detail.focus();
}

function renderHintList(stationId, count) {
  const hints = data.hints[stationId] || [];
  return hints.slice(0, count).map((hint, index) => `<div class="hint-item"><strong>Hinweis ${index + 1}:</strong> ${escapeHtml(hint)}</div>`).join("");
}

function showNextHint(stationId) {
  const hints = data.hints[stationId] || [];
  const current = state.shownHints[stationId] || 0;
  if (current >= hints.length) {
    showToast("Für diese Station gibt es keine weiteren Hinweise.");
    return;
  }
  state.shownHints[stationId] = current + 1;
  persistState();
  const hintList = $("#hintList");
  if (hintList) hintList.innerHTML = renderHintList(stationId, state.shownHints[stationId]);
}

function checkCode(stationId) {
  const station = stationById(stationId);
  const input = $("#codeInput");
  const feedback = $("#codeFeedback");
  const value = (input.value || "").trim();
  if (value === station.code) {
    input.setAttribute("aria-invalid", "false");
    if (!state.solved.includes(stationId)) state.solved.push(stationId);
    feedback.textContent = "Code akzeptiert. Schloss geöffnet. Weiter zur nächsten Station.";
    feedback.className = "feedback ok";
    persistState();
    renderStationList();
    window.setTimeout(() => renderStation(stationId), 350);
  } else {
    input.setAttribute("aria-invalid", "true");
    feedback.textContent = "Der Code passt noch nicht. Prüft eure Zwischenergebnisse und nutzt bei Bedarf einen Hinweis.";
    feedback.className = "feedback error";
  }
}

function playAudio(filename) {
  const audioMeta = data.audio[filename];
  const audio = new Audio(`${AUDIO_BASE}${filename}`);
  audio.play().then(() => {
    showToast(`Audio gestartet: ${filename}`);
  }).catch(() => {
    const fallback = audioMeta ? `Audio-Datei ${filename} ist noch nicht hinterlegt. Sprecher*in: ${audioMeta.speaker}.` : `Audio-Datei ${filename} ist noch nicht hinterlegt.`;
    showToast(fallback);
  });
}

function renderFinish() {
  $("#startScreen").classList.add("hidden");
  $("#gameScreen").classList.add("hidden");
  $("#finishScreen").classList.remove("hidden");
  const summary = $("#learningSummary");
  const solvedStations = data.stations.filter((station) => isSolved(station.id));
  summary.innerHTML = solvedStations.map((station) => `
    <article class="learning-card">
      <h3>${escapeHtml(station.title)}</h3>
      <p>${escapeHtml(station.learningPoint)}</p>
      <small>Berufsbezug: ${escapeHtml(station.careerLink)}</small>
    </article>
  `).join("") || "<p>Noch keine Stationen gelöst.</p>";
}

function showGame() {
  $("#startScreen").classList.add("hidden");
  $("#finishScreen").classList.add("hidden");
  $("#gameScreen").classList.remove("hidden");
  if (!state.currentStationId) state.currentStationId = data.stations[0]?.id || null;
  renderStationList();
  if (state.currentStationId) renderStation(state.currentStationId);
}

function startGame() {
  state.started = true;
  state.teamName = $("#teamName").value.trim();
  state.timerRunning = true;
  state.currentStationId = state.currentStationId || data.stations[0].id;
  persistState();
  showGame();
}

function resetGame() {
  const confirmed = window.confirm("Neue Session starten? Teamname, gelöste Stationen, Hinweise und Timer werden zurückgesetzt.");
  if (!confirmed) return;

  Object.assign(state, {
    started: false,
    teamName: "",
    currentStationId: null,
    solved: [],
    shownHints: {},
    facilitatorUnlocked: false,
    timerSeconds: 60 * 60,
    timerRunning: false,
    timerStartedAt: null
  });
  localStorage.removeItem(STORAGE_KEY);
  window.location.reload();
}

function openFacilitatorDialog() {
  $("#facilitatorDialog").showModal();
  renderFacilitatorGate();
}

function renderFacilitatorGate() {
  $("#pinGate").classList.toggle("hidden", state.facilitatorUnlocked);
  $("#facilitatorPanel").classList.toggle("hidden", !state.facilitatorUnlocked);
  if (state.facilitatorUnlocked) renderFacilitatorPanel();
}

function unlockFacilitator() {
  const pin = $("#facilitatorPin").value.trim();
  const feedback = $("#pinFeedback");
  if (pin === data.facilitator.pin) {
    state.facilitatorUnlocked = true;
    persistState();
    feedback.textContent = "";
    renderFacilitatorGate();
  } else {
    feedback.textContent = "PIN nicht korrekt.";
    feedback.className = "feedback error";
  }
}

function renderAdminEditor() {
  const editor = $("#adminEditor");
  if (!editor) return;
  editor.innerHTML = `
    <section class="admin-editor" aria-labelledby="adminEditorHeading">
      <div class="section-title-row">
        <div>
          <h3 id="adminEditorHeading">Admin-Editor</h3>
          <p>Änderungen werden lokal in diesem Browser gespeichert. Über „Exportieren“ kannst du die bearbeiteten JSON-Daten sichern oder später in die Projektdateien übernehmen lassen.</p>
        </div>
      </div>
      <div class="button-row">
        <button type="button" data-admin-export>Bearbeitete Inhalte exportieren</button>
        <button type="button" data-admin-reset class="ghost">Bearbeitete Inhalte zurücksetzen</button>
      </div>
      <div class="admin-station-list">
        ${data.stations.map(renderAdminStationForm).join("")}
      </div>
    </section>
  `;
  editor.querySelector("[data-admin-export]").addEventListener("click", exportAdminContent);
  editor.querySelector("[data-admin-reset]").addEventListener("click", resetAdminContent);
  editor.querySelectorAll("[data-admin-save]").forEach((button) => {
    button.addEventListener("click", () => saveAdminStationEdits(button.getAttribute("data-admin-save")));
  });
}

function renderAdminStationForm(station) {
  const solution = solutionByStationId(station.id) || { shortSolution: "", explanation: "", code: station.code };
  const hints = data.hints[station.id] || [];
  return `
    <article class="admin-station-form" data-admin-station="${escapeHtml(station.id)}">
      <h4>${station.path === "bonus" ? "Bonus" : `Station ${escapeHtml(station.order)}`}: ${escapeHtml(station.title)}</h4>
      <div class="admin-grid">
        <label>Titel
          <input name="title" value="${escapeHtml(station.title)}">
        </label>
        <label>Thema
          <input name="topic" value="${escapeHtml(station.topic)}">
        </label>
        <label>Code
          <input name="code" value="${escapeHtml(station.code)}" inputmode="numeric" pattern="[0-9]{3}" maxlength="3">
        </label>
        <label>Minuten
          <input name="estimatedMinutes" value="${escapeHtml(station.estimatedMinutes)}" inputmode="numeric">
        </label>
      </div>
      <label>Story / Frage
        <textarea name="story" rows="3">${escapeHtml(station.story)}</textarea>
      </label>
      <label>Auftrag / Frage an das Team
        <textarea name="task" rows="4">${escapeHtml(station.task)}</textarea>
      </label>
      <label>Materialien als JSON
        <textarea name="materials" rows="8" spellcheck="false">${escapeHtml(JSON.stringify(station.materials, null, 2))}</textarea>
      </label>
      <label>Hinweise, ein Hinweis pro Zeile
        <textarea name="hints" rows="4">${escapeHtml(hints.join("\n"))}</textarea>
      </label>
      <label>Lernpunkt
        <textarea name="learningPoint" rows="3">${escapeHtml(station.learningPoint)}</textarea>
      </label>
      <label>Berufsbezug
        <textarea name="careerLink" rows="3">${escapeHtml(station.careerLink)}</textarea>
      </label>
      <label>Kurzlösung für Spielleitung
        <textarea name="shortSolution" rows="2">${escapeHtml(solution.shortSolution)}</textarea>
      </label>
      <label>Erklärung für Spielleitung
        <textarea name="explanation" rows="3">${escapeHtml(solution.explanation)}</textarea>
      </label>
      <button type="button" class="primary" data-admin-save="${escapeHtml(station.id)}">Station speichern</button>
    </article>
  `;
}

function saveAdminStationEdits(stationId) {
  const form = Array.from(document.querySelectorAll("[data-admin-station]")).find((candidate) => candidate.getAttribute("data-admin-station") === stationId);
  const station = stationById(stationId);
  if (!form || !station) return;

  const field = (name) => form.querySelector(`[name="${name}"]`);
  const value = (name) => field(name)?.value.trim() || "";
  const code = value("code");
  if (!/^\d{3}$/.test(code)) {
    showToast("Der Code muss exakt dreistellig sein, z. B. 123.");
    return;
  }

  let materials;
  try {
    materials = JSON.parse(field("materials").value);
  } catch (error) {
    showToast(`Materialien-JSON ist ungültig: ${error.message}`);
    return;
  }
  if (!Array.isArray(materials) || materials.length === 0) {
    showToast("Materialien müssen ein nicht-leeres JSON-Array sein.");
    return;
  }

  Object.assign(station, {
    title: value("title"),
    topic: value("topic"),
    code,
    estimatedMinutes: Number(value("estimatedMinutes")) || station.estimatedMinutes,
    story: value("story"),
    task: value("task"),
    materials,
    learningPoint: value("learningPoint"),
    careerLink: value("careerLink")
  });
  data.hints[stationId] = field("hints").value.split("\n").map((hint) => hint.trim()).filter(Boolean);

  let solution = solutionByStationId(stationId);
  if (!solution) {
    solution = { stationId, code, shortSolution: "", explanation: "" };
    data.facilitator.solutions.push(solution);
  }
  Object.assign(solution, {
    code,
    shortSolution: value("shortSolution"),
    explanation: value("explanation")
  });

  persistCustomContent();
  persistState();
  renderStationList();
  if (state.currentStationId) renderStation(state.currentStationId);
  renderAdminEditor();
  showToast("Station gespeichert. Die Änderung ist lokal in diesem Browser aktiv.");
}

function exportAdminContent() {
  const payload = {
    version: 1,
    exportedAt: new Date().toISOString(),
    stations: data.stations,
    hints: data.hints,
    facilitator: data.facilitator
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "it-escape-game-admin-content.json";
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  showToast("Export erstellt.");
}

function resetAdminContent() {
  const confirmed = window.confirm("Alle lokal bearbeiteten Fragen, Antworten und Hinweise zurücksetzen?");
  if (!confirmed) return;
  localStorage.removeItem(CUSTOM_CONTENT_KEY);
  window.location.reload();
}

function renderFacilitatorPanel() {
  const panel = $("#facilitatorPanel");
  panel.innerHTML = `
    <p>${escapeHtml(data.facilitator.disclaimer || "")}</p>
    <div class="button-row">
      <button type="button" data-action="timer">Timer ${state.timerRunning ? "pausieren" : "starten"}</button>
      <button type="button" data-action="admin">Admin-Editor öffnen</button>
      <button type="button" data-action="reset" class="ghost">Spiel zurücksetzen</button>
      <a href="../public/print/stationen_spielleitung.md" target="_blank"><button type="button">Druckansicht</button></a>
    </div>
    <div id="adminEditor" class="hidden"></div>
    <div class="solution-grid">
      ${data.facilitator.solutions.map((solution) => {
        const station = stationById(solution.stationId);
        return `
          <article class="solution-card">
            <h3>${escapeHtml(station?.order || "?")}. ${escapeHtml(station?.title || solution.stationId)}</h3>
            <div class="solution-code">${escapeHtml(solution.code)}</div>
            <p><strong>Kurzlösung:</strong> ${escapeHtml(solution.shortSolution)}</p>
            <p>${escapeHtml(solution.explanation)}</p>
            <button type="button" data-solve="${escapeHtml(solution.stationId)}">Station als gelöst markieren</button>
          </article>
        `;
      }).join("")}
    </div>
  `;
  panel.querySelector('[data-action="timer"]').addEventListener("click", () => {
    state.timerRunning = !state.timerRunning;
    persistState();
    renderProgress();
    renderFacilitatorPanel();
  });
  panel.querySelector('[data-action="reset"]').addEventListener("click", resetGame);
  panel.querySelector('[data-action="admin"]').addEventListener("click", () => {
    const editor = $("#adminEditor");
    editor.classList.toggle("hidden");
    if (!editor.classList.contains("hidden")) renderAdminEditor();
  });
  panel.querySelectorAll("[data-solve]").forEach((button) => {
    button.addEventListener("click", () => {
      const id = button.getAttribute("data-solve");
      if (!state.solved.includes(id)) state.solved.push(id);
      persistState();
      renderStationList();
      renderFacilitatorPanel();
    });
  });
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function bindEvents() {
  $("#startButton").addEventListener("click", startGame);
  $("#facilitatorButton").addEventListener("click", openFacilitatorDialog);
  $("#facilitatorButtonInGame").addEventListener("click", openFacilitatorDialog);
  $("#unlockFacilitatorButton").addEventListener("click", unlockFacilitator);
  $("#introAudioButton").addEventListener("click", () => playAudio("00_intro.mp3"));
  $("#outroAudioButton").addEventListener("click", () => playAudio("99_outro.mp3"));
  $("#finishButton").addEventListener("click", renderFinish);
  $("#backToGameButton").addEventListener("click", showGame);
  $("#newSessionButton").addEventListener("click", resetGame);
  $("#newSessionFromFinishButton").addEventListener("click", resetGame);
  $("#resetViewButton").addEventListener("click", () => {
    state.currentStationId = data.stations.find((station) => isUnlocked(station))?.id || data.stations[0].id;
    renderStation(state.currentStationId);
  });
}

async function init() {
  try {
    await loadData();
    restoreState();
    bindEvents();
    startTimer();
    renderProgress();
    if (state.started) showGame();
  } catch (error) {
    console.error(error);
    $("#startScreen").innerHTML = `<h2>Fehler beim Laden</h2><p>${escapeHtml(error.message)}</p>`;
  }
}

init();
