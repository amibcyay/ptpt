/* Unified study plan hub — Sep 2026 → Aug 2032. */
(function () {
  const DATA_URL = "../data/plan-weeks.json";
  const STORAGE_KEY = "ptpt-plan-checks-v2";
  const SYNC_CFG_KEY = "ptpt-plan-sync-cfg";
  const SYNC_META_KEY = "ptpt-plan-sync-meta";
  const GIST_FILE = "ptpt-plan-checks.json";
  const SYNC_PREFIX = "ptpt1.";

  const SKILLS = [
    ["output", "Output"],
    ["vocab", "Vocab"],
    ["grammar", "Grammar"],
    ["listening", "Listening"],
    ["speaking", "Speaking"],
    ["reading", "Reading"],
    ["writing", "Writing"],
    ["review", "Review"],
  ];

  const GRAMMAR_LINKS = [
    { re: /\bser\s+vs\s+estar\b|\bser\/estar\b/i, href: "../grammar/ser-vs-estar/", label: "Ser vs estar" },
    { re: /\barticles?\b|\bgender\b|\bo\/a\b/i, href: "../grammar/articles-gender/", label: "Articles & gender" },
    { re: /\bpossess/i, href: "../grammar/possessives/", label: "Possessives" },
    { re: /\bpreposition/i, href: "../grammar/prepositions/", label: "Prepositions" },
    { re: /\bpresente|\b-ar\b|\binfinitiv|\bconjugation|present indicative/i, href: "../grammar/presente-regular/", label: "Presente" },
    { re: /\bgostava\b|\bfaz favor\b|\bask nicely\b|\bqueria\b/i, href: "../grammar/ask-nicely/", label: "Ask nicely" },
    { re: /\bcognate/i, href: "../grammar/cognate-patterns/", label: "Cognates" },
  ];

  const MONTHS = {
    jan: 0, january: 0, feb: 1, february: 1, mar: 2, march: 2,
    apr: 3, april: 3, may: 4, jun: 5, june: 5, jul: 6, july: 6,
    aug: 7, august: 7, sep: 8, sept: 8, september: 8,
    oct: 9, october: 9, nov: 10, november: 10, dec: 11, december: 11,
  };

  let data = null;
  let selectedId = null;
  let browseYear = 2026;
  let browseMonth = 9;
  let browseDateValue = "";
  let calViewYear = null;
  let calViewMonth = null;
  let pushTimer = null;
  let syncBusy = false;

  function loadChecks() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}") || {};
    } catch {
      return {};
    }
  }

  function saveChecks(obj) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(obj));
  }

  function loadSyncCfg() {
    try {
      const c = JSON.parse(localStorage.getItem(SYNC_CFG_KEY) || "null");
      if (c && c.gistId && c.token) return c;
    } catch {
      /* ignore */
    }
    return null;
  }

  function saveSyncCfg(cfg) {
    if (!cfg) localStorage.removeItem(SYNC_CFG_KEY);
    else localStorage.setItem(SYNC_CFG_KEY, JSON.stringify(cfg));
  }

  function loadSyncMeta() {
    try {
      return JSON.parse(localStorage.getItem(SYNC_META_KEY) || "{}") || {};
    } catch {
      return {};
    }
  }

  function saveSyncMeta(meta) {
    localStorage.setItem(SYNC_META_KEY, JSON.stringify(meta || {}));
  }

  function localUpdatedAt() {
    return Number(loadSyncMeta().updatedAt) || 0;
  }

  function touchLocal() {
    const meta = loadSyncMeta();
    meta.updatedAt = Date.now();
    saveSyncMeta(meta);
  }

  function progressWhere() {
    return loadSyncCfg() ? "synced across devices" : "saved in this browser only";
  }

  function progressText(done, total) {
    return `${done}/${total} checked · ${progressWhere()}`;
  }

  function weekChecks(id) {
    return loadChecks()[id] || {};
  }

  function setCheck(id, skill, on) {
    const all = loadChecks();
    if (!all[id]) all[id] = {};
    if (on) all[id][skill] = true;
    else delete all[id][skill];
    if (!Object.keys(all[id]).length) delete all[id];
    saveChecks(all);
    touchLocal();
    schedulePush();
  }

  function b64urlEncode(str) {
    const bytes = new TextEncoder().encode(str);
    let bin = "";
    bytes.forEach((b) => {
      bin += String.fromCharCode(b);
    });
    return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
  }

  function b64urlDecode(str) {
    const pad = str.length % 4 === 0 ? "" : "=".repeat(4 - (str.length % 4));
    const b64 = str.replace(/-/g, "+").replace(/_/g, "/") + pad;
    const bin = atob(b64);
    const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
    return new TextDecoder().decode(bytes);
  }

  function encodeSyncCode(cfg) {
    return SYNC_PREFIX + b64urlEncode(JSON.stringify({ g: cfg.gistId, t: cfg.token }));
  }

  function decodeSyncCode(raw) {
    let s = String(raw || "").trim();
    const urlMatch = s.match(/[?&]sync=([^&#]+)/i);
    if (urlMatch) s = decodeURIComponent(urlMatch[1]);
    if (s.startsWith(SYNC_PREFIX)) s = s.slice(SYNC_PREFIX.length);
    try {
      const obj = JSON.parse(b64urlDecode(s));
      if (obj && obj.g && obj.t) return { gistId: obj.g, token: obj.t };
    } catch {
      /* ignore */
    }
    return null;
  }

  function syncLinkFor(cfg) {
    const code = encodeSyncCode(cfg);
    const base = `${location.origin}${location.pathname}`;
    return `${base}?sync=${encodeURIComponent(code)}`;
  }

  function envelope(checks, updatedAt) {
    return {
      v: 1,
      updatedAt: updatedAt || Date.now(),
      checks: checks || {},
    };
  }

  async function gistRequest(method, path, token, body) {
    const res = await fetch(`https://api.github.com${path}`, {
      method,
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    const text = await res.text();
    let json = null;
    try {
      json = text ? JSON.parse(text) : null;
    } catch {
      json = null;
    }
    if (!res.ok) {
      const msg =
        (json && (json.message || json.error)) ||
        `GitHub API ${res.status}`;
      throw new Error(msg);
    }
    return json;
  }

  function parseGistPayload(gist) {
    const file =
      (gist.files && gist.files[GIST_FILE]) ||
      (gist.files && Object.values(gist.files)[0]);
    if (!file || !file.content) throw new Error("Sync file missing in gist.");
    const payload = JSON.parse(file.content);
    return {
      updatedAt: Number(payload.updatedAt) || 0,
      checks: payload.checks && typeof payload.checks === "object" ? payload.checks : {},
    };
  }

  async function pullRemote() {
    const cfg = loadSyncCfg();
    if (!cfg) return { changed: false };
    const gist = await gistRequest("GET", `/gists/${cfg.gistId}`, cfg.token);
    const remote = parseGistPayload(gist);
    const localAt = localUpdatedAt();
    if (remote.updatedAt > localAt) {
      saveChecks(remote.checks);
      saveSyncMeta({ updatedAt: remote.updatedAt, lastPull: Date.now() });
      return { changed: true, remote };
    }
    saveSyncMeta({ ...loadSyncMeta(), lastPull: Date.now() });
    return { changed: false, remote };
  }

  async function pushRemote() {
    const cfg = loadSyncCfg();
    if (!cfg) return;
    const updatedAt = localUpdatedAt() || Date.now();
    const content = JSON.stringify(envelope(loadChecks(), updatedAt), null, 2);
    await gistRequest("PATCH", `/gists/${cfg.gistId}`, cfg.token, {
      files: { [GIST_FILE]: { content } },
    });
    saveSyncMeta({ ...loadSyncMeta(), updatedAt, lastPush: Date.now() });
  }

  function schedulePush() {
    if (!loadSyncCfg()) return;
    clearTimeout(pushTimer);
    pushTimer = setTimeout(() => {
      pushRemote().catch((err) => {
        setSyncStatus(`Sync push failed: ${err.message}`, true);
      });
    }, 800);
  }

  async function createSync(token) {
    const updatedAt = Date.now();
    const content = JSON.stringify(envelope(loadChecks(), updatedAt), null, 2);
    const gist = await gistRequest("POST", "/gists", token, {
      description: "ptpt study plan checklist sync",
      public: false,
      files: { [GIST_FILE]: { content } },
    });
    const cfg = { gistId: gist.id, token };
    saveSyncCfg(cfg);
    saveSyncMeta({ updatedAt, lastPush: Date.now() });
    return cfg;
  }

  async function connectSync(cfg) {
    saveSyncCfg(cfg);
    const remote = await pullRemote();
    if (!remote.changed && Object.keys(loadChecks()).length) {
      touchLocal();
      await pushRemote();
    }
    return remote;
  }

  function setSyncStatus(text, isError) {
    const el = document.getElementById("sync-status");
    if (!el) return;
    el.textContent = text;
    el.style.color = isError ? "#991b1b" : "";
  }

  function showPanel(which) {
    const setup = document.getElementById("sync-panel-setup");
    const enter = document.getElementById("sync-panel-enter");
    if (setup) setup.hidden = which !== "setup";
    if (enter) enter.hidden = which !== "enter";
  }

  function setMsg(id, text, ok) {
    const el = document.getElementById(id);
    if (!el) return;
    if (!text) {
      el.hidden = true;
      el.textContent = "";
      return;
    }
    el.hidden = false;
    el.textContent = text;
    el.className = `sync-msg ${ok ? "ok" : "err"}`;
  }

  function refreshOpenWeekPanels() {
    const thisWeek = document.getElementById("panel-this-week");
    if (thisWeek && thisWeek.classList.contains("active")) renderThisWeek();
    const browse = document.getElementById("panel-browse");
    if (browse && browse.classList.contains("active")) renderBrowse();
  }

  function renderSyncBar() {
    const actions = document.getElementById("sync-actions");
    if (!actions) return;
    const cfg = loadSyncCfg();
    const meta = loadSyncMeta();
    if (cfg) {
      const when = meta.lastPull || meta.lastPush;
      const ago = when
        ? ` · last sync ${new Date(when).toLocaleString()}`
        : "";
      setSyncStatus(`Sync on${ago}. Treat your sync code like a password.`);
      actions.innerHTML = `
        <button type="button" id="sync-now">Sync now</button>
        <button type="button" id="sync-copy">Copy code</button>
        <button type="button" id="sync-disconnect">Disconnect</button>`;
      actions.querySelector("#sync-now")?.addEventListener("click", async () => {
        if (syncBusy) return;
        syncBusy = true;
        setSyncStatus("Syncing…");
        try {
          const result = await pullRemote();
          if (localUpdatedAt() >= (result.remote?.updatedAt || 0)) await pushRemote();
          setSyncStatus(`Synced · ${new Date().toLocaleString()}`);
          if (result.changed) refreshOpenWeekPanels();
          else renderSyncBar();
        } catch (err) {
          setSyncStatus(`Sync failed: ${err.message}`, true);
        } finally {
          syncBusy = false;
        }
      });
      actions.querySelector("#sync-copy")?.addEventListener("click", async () => {
        const code = encodeSyncCode(cfg);
        try {
          await navigator.clipboard.writeText(code);
          setSyncStatus("Sync code copied.");
        } catch {
          window.prompt("Copy this sync code:", code);
        }
      });
      actions.querySelector("#sync-disconnect")?.addEventListener("click", () => {
        if (!confirm("Disconnect sync on this device? Checkmarks stay here locally.")) return;
        saveSyncCfg(null);
        showPanel(null);
        renderSyncBar();
        refreshOpenWeekPanels();
      });
    } else {
      setSyncStatus("Checklist stays on this device until you set up sync.");
      actions.innerHTML = `
        <button type="button" class="primary" id="sync-open-setup">Set up sync</button>
        <button type="button" id="sync-open-enter">Enter code</button>`;
      actions.querySelector("#sync-open-setup")?.addEventListener("click", () => {
        showPanel("setup");
        document.getElementById("sync-created")?.setAttribute("hidden", "");
        setMsg("sync-setup-msg", "");
      });
      actions.querySelector("#sync-open-enter")?.addEventListener("click", () => {
        showPanel("enter");
        setMsg("sync-enter-msg", "");
      });
    }
  }

  function setupSyncUi() {
    renderSyncBar();
    document.getElementById("sync-cancel-setup")?.addEventListener("click", () => showPanel(null));
    document.getElementById("sync-cancel-enter")?.addEventListener("click", () => showPanel(null));
    document.getElementById("sync-create")?.addEventListener("click", async () => {
      const token = document.getElementById("sync-token")?.value.trim();
      if (!token) {
        setMsg("sync-setup-msg", "Paste a GitHub token with gist scope.", false);
        return;
      }
      const btn = document.getElementById("sync-create");
      if (btn) btn.disabled = true;
      setMsg("sync-setup-msg", "Creating private gist…", true);
      try {
        const cfg = await createSync(token);
        const code = encodeSyncCode(cfg);
        const box = document.getElementById("sync-code-display");
        const created = document.getElementById("sync-created");
        const tokenInput = document.getElementById("sync-token");
        if (tokenInput) tokenInput.value = "";
        if (box) box.textContent = code;
        if (created) created.hidden = false;
        setMsg("sync-setup-msg", "Sync created. Copy the code to your phone.", true);
        renderSyncBar();
        refreshOpenWeekPanels();
      } catch (err) {
        setMsg("sync-setup-msg", err.message || "Could not create sync.", false);
      } finally {
        if (btn) btn.disabled = false;
      }
    });
    document.getElementById("sync-copy-new")?.addEventListener("click", async () => {
      const cfg = loadSyncCfg();
      if (!cfg) return;
      const code = encodeSyncCode(cfg);
      try {
        await navigator.clipboard.writeText(code);
        setMsg("sync-setup-msg", "Code copied.", true);
      } catch {
        window.prompt("Copy this sync code:", code);
      }
    });
    document.getElementById("sync-copy-link")?.addEventListener("click", async () => {
      const cfg = loadSyncCfg();
      if (!cfg) return;
      const link = syncLinkFor(cfg);
      try {
        await navigator.clipboard.writeText(link);
        setMsg("sync-setup-msg", "Link copied.", true);
      } catch {
        window.prompt("Copy this sync link:", link);
      }
    });
    document.getElementById("sync-connect")?.addEventListener("click", async () => {
      const raw = document.getElementById("sync-code-input")?.value || "";
      const cfg = decodeSyncCode(raw);
      if (!cfg) {
        setMsg("sync-enter-msg", "That does not look like a valid sync code.", false);
        return;
      }
      const btn = document.getElementById("sync-connect");
      if (btn) btn.disabled = true;
      setMsg("sync-enter-msg", "Connecting…", true);
      try {
        await connectSync(cfg);
        showPanel(null);
        setMsg("sync-enter-msg", "");
        renderSyncBar();
        refreshOpenWeekPanels();
        setSyncStatus(`Connected · ${new Date().toLocaleString()}`);
      } catch (err) {
        saveSyncCfg(null);
        setMsg("sync-enter-msg", err.message || "Could not connect.", false);
        renderSyncBar();
      } finally {
        if (btn) btn.disabled = false;
      }
    });

    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState !== "visible" || !loadSyncCfg()) return;
      pullRemote()
        .then((r) => {
          if (r.changed) refreshOpenWeekPanels();
          renderSyncBar();
        })
        .catch(() => {});
    });
  }

  async function absorbSyncQuery() {
    const params = new URLSearchParams(location.search);
    const raw = params.get("sync");
    if (!raw) return;
    const cfg = decodeSyncCode(raw);
    history.replaceState({}, "", location.pathname + location.hash);
    if (!cfg) {
      setSyncStatus("Invalid sync link.", true);
      return;
    }
    try {
      await connectSync(cfg);
      renderSyncBar();
      setSyncStatus(`Connected via link · ${new Date().toLocaleString()}`);
    } catch (err) {
      saveSyncCfg(null);
      setSyncStatus(`Sync link failed: ${err.message}`, true);
      renderSyncBar();
    }
  }

  function progressFor(week) {
    const c = weekChecks(week.id);
    const total = SKILLS.filter(([k]) => week[k]).length;
    const done = SKILLS.filter(([k]) => week[k] && c[k]).length;
    return { done, total };
  }

  function parseDateRange(dates) {
    if (!dates) return null;
    const s = dates.replace(/[–—]/g, "-").replace(/\s+/g, " ").trim();

    let m = s.match(/^(\d{1,2})-(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})$/);
    if (m) {
      const mo = MONTHS[m[3].toLowerCase()];
      if (mo == null) return null;
      const y = +m[4];
      return {
        start: new Date(y, mo, +m[1]),
        end: new Date(y, mo, +m[2], 23, 59, 59),
      };
    }

    m = s.match(/^(\d{1,2})\s+([A-Za-z]+)\s*-+\s*(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})$/);
    if (m) {
      const mo1 = MONTHS[m[2].toLowerCase()];
      const mo2 = MONTHS[m[4].toLowerCase()];
      if (mo1 == null || mo2 == null) return null;
      const y = +m[5];
      return {
        start: new Date(y, mo1, +m[1]),
        end: new Date(y, mo2, +m[3], 23, 59, 59),
      };
    }

    m = s.match(/^(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})\s*-+\s*(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})$/);
    if (m) {
      const mo1 = MONTHS[m[2].toLowerCase()];
      const mo2 = MONTHS[m[5].toLowerCase()];
      if (mo1 == null || mo2 == null) return null;
      return {
        start: new Date(+m[3], mo1, +m[1]),
        end: new Date(+m[6], mo2, +m[4], 23, 59, 59),
      };
    }
    return null;
  }

  function findThisWeek(weeks, now) {
    const t = now.getTime();
    for (const w of weeks) {
      const r = parseDateRange(w.dates);
      if (r && t >= r.start.getTime() && t <= r.end.getTime()) {
        return { week: w, status: "current" };
      }
    }
    let upcoming = null;
    let past = null;
    for (const w of weeks) {
      const r = parseDateRange(w.dates);
      if (!r) continue;
      if (r.start.getTime() > t) {
        if (!upcoming || r.start < parseDateRange(upcoming.dates).start) upcoming = w;
      } else if (r.end.getTime() < t) {
        if (!past || r.end > parseDateRange(past.dates).end) past = w;
      }
    }
    if (upcoming) return { week: upcoming, status: "upcoming" };
    if (past) return { week: past, status: "past" };
    return { week: weeks[0], status: "fallback" };
  }

  function weekContainingDate(date) {
    const t = date.getTime();
    for (const w of data.weeks) {
      const r = parseDateRange(w.dates);
      if (r && t >= r.start.getTime() && t <= r.end.getTime()) return w;
    }
    return null;
  }

  function findWeekForDate(date) {
    const hit = weekContainingDate(date);
    if (hit) return hit;
    let best = null;
    let bestDist = Infinity;
    const t = date.getTime();
    for (const w of data.weeks) {
      const r = parseDateRange(w.dates);
      if (!r) continue;
      const dist = Math.min(Math.abs(t - r.start.getTime()), Math.abs(t - r.end.getTime()));
      if (dist < bestDist) {
        bestDist = dist;
        best = w;
      }
    }
    return best;
  }

  function toISODate(d) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }

  function parseISODateLocal(iso) {
    const m = String(iso || "").match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!m) return null;
    return new Date(+m[1], +m[2] - 1, +m[3], 12, 0, 0);
  }

  function planDateBounds() {
    let min = null;
    let max = null;
    for (const w of data.weeks) {
      const r = parseDateRange(w.dates);
      if (!r) continue;
      if (!min || r.start < min) min = r.start;
      if (!max || r.end > max) max = r.end;
    }
    return { min, max };
  }

  function syncBrowseToWeek(week, keepPickedIso) {
    if (!week) return;
    selectedId = week.id;
    browseYear = week.year;
    browseMonth = week.month;
    const range = parseDateRange(week.dates);
    if (keepPickedIso) {
      const d = parseISODateLocal(keepPickedIso);
      const inThisWeek = d && weekContainingDate(d)?.id === week.id;
      browseDateValue = inThisWeek
        ? keepPickedIso
        : range
          ? toISODate(range.start)
          : keepPickedIso;
    } else if (range) {
      browseDateValue = toISODate(range.start);
    }
    const shown = parseISODateLocal(browseDateValue);
    if (shown && weekContainingDate(shown)) {
      calViewYear = shown.getFullYear();
      calViewMonth = shown.getMonth();
    } else {
      calViewYear = week.year;
      calViewMonth = week.month - 1;
    }
  }

  function ensureCalView() {
    if (calViewYear != null && calViewMonth != null) return;
    const d = parseISODateLocal(browseDateValue);
    if (d && weekContainingDate(d)) {
      calViewYear = d.getFullYear();
      calViewMonth = d.getMonth();
      return;
    }
    calViewYear = browseYear;
    calViewMonth = browseMonth - 1;
  }

  function monthLabel(y, m) {
    return new Date(y, m, 1).toLocaleString("en-GB", { month: "long", year: "numeric" });
  }

  function vocabQueryTokens(text) {
    if (!text) return [];
    const EN_SKIP = /^(learn|add|active|no|new|numbers|daily|retention|review|strongest|cycle|hold|repair)$/i;
    const out = [];
    const seen = new Set();
    for (let part of text.split(/[,;]/)) {
      part = part.replace(/\([^)]*\)/g, "").replace(/\s+/g, " ").trim();
      if (!part || /^(learn|add|active|no new|numbers|daily)/i.test(part)) continue;
      const words = part.split(" ").map((w) =>
        w.replace(/^[^a-záàâãéêíóôõúç\-]+|[^a-záàâãéêíóôõúç\-]+$/gi, "").replace(/\/.*/, "")
      ).filter(Boolean);
      let chip = "";
      if (words.length >= 1 && words.length <= 2 && words.every((w) => w.length >= 2 && !EN_SKIP.test(w))) {
        chip = words.join(" ");
      } else if (words.length) {
        const first = words.find((w) => w.length >= 3 && !EN_SKIP.test(w));
        if (first) chip = first;
      }
      if (!chip) continue;
      const low = chip.toLowerCase();
      if (seen.has(low)) continue;
      seen.add(low);
      out.push(chip);
      if (out.length >= 4) break;
    }
    return out;
  }

  function skillLinks(key, text, week) {
    const links = [];
    if (key === "vocab") {
      for (const t of vocabQueryTokens(text).slice(0, 4)) {
        links.push(
          `<button type="button" class="vocab-open" data-vocab-open="${esc(t)}">${esc(t)}</button>`
        );
      }
    }
    if (key === "grammar" || key === "output") {
      for (const g of GRAMMAR_LINKS) {
        if (g.re.test(text || "")) links.push(`<a href="${g.href}">${esc(g.label)}</a>`);
      }
      const v = (text.match(/\b(ser|estar|ter|ir|haver|falar|pagar)\b/i) || [])[1];
      if (v) links.push(`<a href="../verbs/?q=${encodeURIComponent(v)}">Verb: ${esc(v)}</a>`);
    }
    if (key === "review") links.push(`<a href="../verbs/">Verbs</a>`);
    return links.length ? `<div class="skill-links">${links.join("")}</div>` : "";
  }

  function esc(s) {
    return String(s || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function weekTitle(w) {
    return `Week ${w.week} · ${w.theme}`;
  }

  function statusMessage(status, week) {
    if (status === "current") return "This is your calendar week.";
    if (status === "upcoming") return `No week covers today — next up: ${week.dates}.`;
    if (status === "past") return `Showing the nearest plan week (${week.dates}).`;
    return "";
  }

  function renderWeekDetail(week, opts = {}) {
    if (!week) return `<p class="muted">No week selected.</p>`;
    const checks = weekChecks(week.id);
    const { done, total } = progressFor(week);
    const statusNote = opts.statusNote ? `<p class="muted">${esc(opts.statusNote)}</p>` : "";
    const showToday = !!opts.showToday;

    const skillsHtml = SKILLS.map(([key, label]) => {
      const body = week[key];
      if (!body) return "";
      const id = `chk-${week.id}-${key}`;
      return `<div class="skill">
        <label for="${id}">
          <input type="checkbox" id="${id}" data-week="${esc(week.id)}" data-skill="${key}" ${checks[key] ? "checked" : ""}/>
          <span>
            <div class="label">${label}</div>
            <div class="body">${esc(body)}</div>
          </span>
        </label>
        ${skillLinks(key, body, week)}
      </div>`;
    }).join("");

    const idx = data.weeks.findIndex((w) => w.id === week.id);
    const prev = idx > 0 ? data.weeks[idx - 1] : null;
    const next = idx >= 0 && idx < data.weeks.length - 1 ? data.weeks[idx + 1] : null;

    return `
      <div class="nav-week">
        <button type="button" data-goto="${prev ? esc(prev.id) : ""}" ${prev ? "" : "disabled"}>← Prev</button>
        ${showToday ? `<button type="button" class="today-btn" data-today="1">TODAY</button>` : ""}
        <button type="button" data-goto="${next ? esc(next.id) : ""}" ${next ? "" : "disabled"}>Next →</button>
      </div>
      <div class="week-hero">
        <p class="meta">${esc(week.dates)}</p>
        <h2>${esc(weekTitle(week))}</h2>
        <span class="pill phase-${esc(week.phase)}">${esc(week.phase)}</span>
        <span class="pill">${esc(week.level || "")}</span>
        ${statusNote}
        <p class="progress">${progressText(done, total)}</p>
      </div>
      ${skillsHtml}
    `;
  }

  function goToTodayWeek() {
    const now = new Date();
    const { week, status } = findThisWeek(data.weeks, now);
    syncBrowseToWeek(week, toISODate(now));
    return { week, status };
  }

  function bindWeekPanel(root, opts = {}) {
    if (!root) return;
    root.querySelectorAll('input[type="checkbox"][data-week]').forEach((el) => {
      el.addEventListener("change", () => {
        setCheck(el.dataset.week, el.dataset.skill, el.checked);
        const week = data.weeks.find((w) => w.id === el.dataset.week);
        const prog = root.querySelector(".progress");
        if (week && prog) {
          const { done, total } = progressFor(week);
          prog.textContent = progressText(done, total);
        }
      });
    });
    root.querySelectorAll("button[data-goto]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-goto");
        if (!id) return;
        const week = data.weeks.find((w) => w.id === id);
        selectedId = id;
        if (opts.thisWeekMode) {
          root.innerHTML = renderWeekDetail(week, { showToday: true });
          bindWeekPanel(root, opts);
        } else {
          syncBrowseToWeek(week);
          renderBrowse();
        }
      });
    });
    root.querySelectorAll("button[data-today]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const { week, status } = goToTodayWeek();
        root.innerHTML = renderWeekDetail(week, {
          statusNote: statusMessage(status, week),
          showToday: true,
        });
        bindWeekPanel(root, { thisWeekMode: true });
      });
    });
  }

  function renderThisWeek() {
    const panel = document.getElementById("panel-this-week");
    const { week, status } = findThisWeek(data.weeks, new Date());
    selectedId = week.id;
    panel.innerHTML = renderWeekDetail(week, {
      statusNote: statusMessage(status, week),
      showToday: true,
    });
    bindWeekPanel(panel, { thisWeekMode: true });
  }

  function renderCalendarHtml() {
    ensureCalView();
    const bounds = planDateBounds();
    const y = calViewYear;
    const m = calViewMonth;
    const first = new Date(y, m, 1);
    const startPad = first.getDay();
    const daysInMonth = new Date(y, m + 1, 0).getDate();
    const prevDays = new Date(y, m, 0).getDate();
    const todayIso = toISODate(new Date());
    const cells = [];
    for (const d of ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"]) {
      cells.push(`<div class="cal-dow">${d}</div>`);
    }
    for (let i = 0; i < 42; i++) {
      let dayNum;
      let cellY = y;
      let cellM = m;
      let muted = false;
      if (i < startPad) {
        dayNum = prevDays - startPad + i + 1;
        cellM = m - 1;
        if (cellM < 0) {
          cellM = 11;
          cellY = y - 1;
        }
        muted = true;
      } else if (i >= startPad + daysInMonth) {
        dayNum = i - startPad - daysInMonth + 1;
        cellM = m + 1;
        if (cellM > 11) {
          cellM = 0;
          cellY = y + 1;
        }
        muted = true;
      } else dayNum = i - startPad + 1;

      const iso = toISODate(new Date(cellY, cellM, dayNum));
      const d = new Date(cellY, cellM, dayNum, 12, 0, 0);
      const selectable = !!weekContainingDate(d);
      const cls = [
        "cal-day",
        muted ? "muted" : "",
        selectable ? "in-plan" : "",
        iso === browseDateValue ? "selected" : "",
        iso === todayIso ? "today" : "",
      ]
        .filter(Boolean)
        .join(" ");
      cells.push(
        `<button type="button" class="${cls}" data-cal-iso="${iso}" ${
          selectable ? "" : "disabled"
        } aria-label="${iso}">${dayNum}</button>`
      );
    }

    const canPrev =
      !bounds.min ||
      new Date(y, m, 1).getTime() >
        new Date(bounds.min.getFullYear(), bounds.min.getMonth(), 1).getTime();
    const canNext =
      !bounds.max ||
      new Date(y, m, 1).getTime() <
        new Date(bounds.max.getFullYear(), bounds.max.getMonth(), 1).getTime();

    return `
      <div class="cal-head">
        <p class="cal-title">${esc(monthLabel(y, m))}</p>
        <div class="cal-nav">
          <button type="button" class="cal-today" id="cal-today">TODAY</button>
          <button type="button" id="cal-prev" aria-label="Previous month" ${canPrev ? "" : "disabled"}>▲</button>
          <button type="button" id="cal-next" aria-label="Next month" ${canNext ? "" : "disabled"}>▼</button>
        </div>
      </div>
      <div class="cal-grid">${cells.join("")}</div>`;
  }

  function jumpToPickedDate(iso) {
    const d = parseISODateLocal(iso);
    if (!d) return;
    const week = findWeekForDate(d);
    if (!week) return;
    syncBrowseToWeek(week, iso);
    renderBrowse();
    document.querySelector("#browse-detail")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function monthsForBrowseYear(year) {
    const set = new Set(
      data.weeks.filter((w) => w.year === year).map((w) => w.month)
    );
    return [...set].sort((a, b) => a - b);
  }

  function weeksForBrowse() {
    return data.weeks.filter((w) => w.year === browseYear && w.month === browseMonth);
  }

  function renderBrowse() {
    const panel = document.getElementById("panel-browse");
    const years = data.meta.years || [...new Set(data.weeks.map((w) => w.year))].sort();
    if (!years.includes(browseYear)) browseYear = years[0];
    const months = monthsForBrowseYear(browseYear);
    if (!months.includes(browseMonth)) browseMonth = months[0] || 1;

    if (!browseDateValue) {
      const sel = data.weeks.find((w) => w.id === selectedId);
      const r = sel && parseDateRange(sel.dates);
      const bounds = planDateBounds();
      browseDateValue = r
        ? toISODate(r.start)
        : bounds.min
          ? toISODate(bounds.min)
          : "";
    }
    ensureCalView();

    const yearOpts = years
      .map((y) => `<option value="${y}" ${y === browseYear ? "selected" : ""}>${y}</option>`)
      .join("");
    const monthOpts = months
      .map(
        (m) =>
          `<option value="${m}" ${m === browseMonth ? "selected" : ""}>${monthLabel(browseYear, m - 1).split(" ")[0]}</option>`
      )
      .join("");

    const list = weeksForBrowse();
    const listHtml = list
      .map((w) => {
        const { done, total } = progressFor(w);
        return `<li><button type="button" class="${w.id === selectedId ? "current" : ""}" data-pick="${esc(w.id)}">
          <strong>${esc(weekTitle(w))}</strong>
          <div class="wmeta">${esc(w.dates)} · ${esc(w.phase)} · ${done}/${total}</div>
        </button></li>`;
      })
      .join("");

    const detail = data.weeks.find((w) => w.id === selectedId);

    panel.innerHTML = `
      <div class="browse-date">${renderCalendarHtml()}</div>
      <div class="browse-row">
        <select id="browse-year">${yearOpts}</select>
        <select id="browse-month">${monthOpts}</select>
      </div>
      <ul class="week-list">${listHtml || '<li class="muted">No weeks in this month.</li>'}</ul>
      <div id="browse-detail">${renderWeekDetail(detail)}</div>
    `;

    panel.querySelector("#cal-today")?.addEventListener("click", () => {
      jumpToPickedDate(toISODate(new Date()));
    });
    panel.querySelector("#cal-prev")?.addEventListener("click", () => {
      calViewMonth -= 1;
      if (calViewMonth < 0) {
        calViewMonth = 11;
        calViewYear -= 1;
      }
      renderBrowse();
    });
    panel.querySelector("#cal-next")?.addEventListener("click", () => {
      calViewMonth += 1;
      if (calViewMonth > 11) {
        calViewMonth = 0;
        calViewYear += 1;
      }
      renderBrowse();
    });
    panel.querySelectorAll("button[data-cal-iso]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const iso = btn.getAttribute("data-cal-iso");
        if (iso) jumpToPickedDate(iso);
      });
    });
    panel.querySelector("#browse-year").addEventListener("change", (e) => {
      browseYear = +e.target.value;
      const ms = monthsForBrowseYear(browseYear);
      browseMonth = ms[0] || 1;
      const first = weeksForBrowse()[0];
      if (first) syncBrowseToWeek(first);
      renderBrowse();
    });
    panel.querySelector("#browse-month").addEventListener("change", (e) => {
      browseMonth = +e.target.value;
      const first = weeksForBrowse()[0];
      if (first) syncBrowseToWeek(first);
      renderBrowse();
    });
    panel.querySelectorAll("button[data-pick]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const week = data.weeks.find((w) => w.id === btn.getAttribute("data-pick"));
        if (week) syncBrowseToWeek(week);
        renderBrowse();
      });
    });
    bindWeekPanel(panel.querySelector("#browse-detail"));
  }

  function setupTabs() {
    document.querySelectorAll(".tabs button").forEach((btn) => {
      btn.addEventListener("click", () => {
        document.querySelectorAll(".tabs button").forEach((b) => b.classList.remove("active"));
        document.querySelectorAll(".panel").forEach((p) => p.classList.remove("active"));
        btn.classList.add("active");
        const id = btn.getAttribute("data-tab");
        document.getElementById(`panel-${id}`).classList.add("active");
        if (id === "this-week") renderThisWeek();
        if (id === "browse") renderBrowse();
      });
    });
  }

  async function init() {
    const lead = document.getElementById("lead");
    try {
      const res = await fetch(DATA_URL);
      if (!res.ok) throw new Error(res.statusText);
      data = await res.json();
    } catch (e) {
      if (lead) {
        lead.hidden = false;
        lead.textContent =
          "Could not load plan-weeks.json. Serve the site over HTTP (not file://).";
      }
      return;
    }
    setupSyncUi();
    await absorbSyncQuery();
    if (loadSyncCfg()) {
      try {
        const result = await pullRemote();
        if (result.changed) {
          /* panels render after */
        }
      } catch (err) {
        setSyncStatus(`Sync pull failed: ${err.message}`, true);
      }
    }
    setupTabs();
    const { week } = findThisWeek(data.weeks, new Date());
    syncBrowseToWeek(week, toISODate(new Date()));
    renderThisWeek();
    renderSyncBar();
  }

  init();
})();
