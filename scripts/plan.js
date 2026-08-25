/* Unified study plan hub — Sep 2026 → Aug 2032. */
(function () {
  const DATA_URL = "../data/plan-weeks.json";
  const STORAGE_KEY = "ptpt-plan-checks-v2";

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
        <p class="progress">${done}/${total} checked · saved in this browser only</p>
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
          prog.textContent = `${done}/${total} checked · saved in this browser only`;
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
    setupTabs();
    const { week } = findThisWeek(data.weeks, new Date());
    syncBrowseToWeek(week, toISODate(new Date()));
    renderThisWeek();
  }

  init();
})();
