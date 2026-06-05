const DATA_PATHS = {
  stations: "data/stations.json",
  hints: "data/hints.json",
  audio: "data/audio.json",
  facilitator: "data/facilitator.json"
};

const AUDIO_BASE = "../public/audio/";
const STORAGE_KEY = "itEscapeGameState.v1";

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
      <span class="badge ${solved ? "success" : station.path === "bonus" ? "warning" : ""}">${solved ? "Gelöst" : station.path === "bonus" ? "Bonus" : `Station ${station.order}`}</span>
      <strong>${station.title}</strong>
      <small>${station.topic} · ca. ${station.estimatedMinutes} Min.</small>
    `;
    button.addEventListener("click", () => renderStation(station.id));
    container.appendChild(button);
  });
  renderProgress();
}

function renderMaterial(material) {
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
    const headers = material.headers.map((header) => `<th>${escapeHtml(header)}</th>`).join("");
    const rows = material.rows.map((row) => `<tr>${row.map((cell) => `<td>${escapeHtml(String(cell))}</td>`).join("")}</tr>`).join("");
    return `<div class="material-card table-wrap"><table><thead><tr>${headers}</tr></thead><tbody>${rows}</tbody></table></div>`;
  }
  if (material.type === "list") {
    return `<article class="material-card"><h3>${escapeHtml(material.title || "Liste")}</h3><ul>${material.items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul></article>`;
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
  detail.innerHTML = `
    <span class="badge ${station.path === "bonus" ? "warning" : ""}">${station.path === "bonus" ? "Bonusstation" : `Station ${station.order}`}</span>
    <h2>${escapeHtml(station.title)}</h2>
    <p>${escapeHtml(station.story)}</p>
    <p><strong>Auftrag:</strong> ${escapeHtml(station.task)}</p>
    <div class="material-grid">${station.materials.map(renderMaterial).join("")}</div>
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

function renderFacilitatorPanel() {
  const panel = $("#facilitatorPanel");
  panel.innerHTML = `
    <p>${escapeHtml(data.facilitator.disclaimer || "")}</p>
    <div class="button-row">
      <button type="button" data-action="timer">Timer ${state.timerRunning ? "pausieren" : "starten"}</button>
      <button type="button" data-action="reset" class="ghost">Spiel zurücksetzen</button>
      <a href="../public/print/stationen_spielleitung.md" target="_blank"><button type="button">Druckansicht</button></a>
    </div>
    <div class="solution-grid">
      ${data.facilitator.solutions.map((solution) => {
        const station = stationById(solution.stationId);
        return `
          <article class="solution-card">
            <h3>${station?.order}. ${escapeHtml(station?.title || solution.stationId)}</h3>
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
