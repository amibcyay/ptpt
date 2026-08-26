/* Grammar syllabus checklist — shared store via ptpt-sync.js */
(function () {
  const S = window.PtptSync;
  if (!S) {
    console.error("ptpt-sync.js must load before syllabus.js");
    return;
  }

  const LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"];
  const EXAM_LABEL = {
    A1: "ACESSO",
    A2: "CIPLE",
    B1: "DEPLE",
    B2: "DIPLE",
    C1: "DAPLE",
    C2: "DUPLE",
  };
  const DATA_URL = "../../data/grammar-syllabus.json";
  const MAP_URL = "../../data/plan-grammar-syllabus-map.json";
  const PLAN_URL = "../../data/plan-weeks.json";
  const RECENT_KEY = "ptpt-syllabus-recent-weeks";

  let items = [];
  let lessonText = {};
  let checks = S.loadSyllabusChecks();
  let autoToWeeks = {};
  let aliases = {};
  let planWeeks = [];
  let weekById = {};
  let activeLevel = "all";
  let searchQuery = "";
  let openPopover = null;

  function fold(s) {
    if (window.PtFuzzy && typeof PtFuzzy.fold === "function") return PtFuzzy.fold(s);
    return typeof window.foldPt === "function"
      ? window.foldPt(s)
      : String(s || "").toLowerCase();
  }

  function itemHaystack(item) {
    const body = (item.lesson_slug && lessonText[item.lesson_slug]) || "";
    return fold(
      [
        item.id,
        item.level,
        item.category,
        item.label,
        item.note || "",
        body,
      ].join(" ")
    );
  }

  function itemMatchesQuery(item, q) {
    if (!q) return true;
    return itemHaystack(item).includes(q);
  }

  function filteredItems() {
    const q = fold(searchQuery).trim();
    return items.filter((i) => {
      if (activeLevel !== "all" && i.level !== activeLevel) return false;
      return itemMatchesQuery(i, q);
    });
  }

  function fuzzyCandidates() {
    return items.map((i) => ({
      key: i.id,
      label: i.label,
      hay: `${i.label} ${i.category || ""}`,
      meta: i.level,
    }));
  }

  function renderDidYou(q, matchCount) {
    const el = document.getElementById("syllabusDidYou");
    if (!el) return;
    const raw = String(searchQuery || "").trim();
    if (!raw || matchCount > 0 || !window.PtFuzzy) {
      el.hidden = true;
      el.innerHTML = "";
      return;
    }
    const suggestions = PtFuzzy.suggest(raw, fuzzyCandidates(), { limit: 5 });
    if (!suggestions.length) {
      el.hidden = true;
      el.innerHTML = "";
      return;
    }
    el.hidden = false;
    el.innerHTML = PtFuzzy.didYouMeanHtml(raw, suggestions, (s) => `data-suggest-id="${esc(s.key)}"`);
    el.querySelectorAll("[data-suggest-id]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-suggest-id");
        const item = items.find((x) => x.id === id);
        if (!item) return;
        const input = document.getElementById("syllabusSearch");
        searchQuery = item.label;
        if (input) input.value = item.label;
        syncSearchParam(item.label);
        renderLevelPills();
        renderBody();
        requestAnimationFrame(() => {
          document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "center" });
        });
      });
    });
  }

  function syncSearchParam(q) {
    const url = new URL(location.href);
    const trimmed = String(q || "").trim();
    if (trimmed) url.searchParams.set("q", trimmed);
    else url.searchParams.delete("q");
    history.replaceState(null, "", url.pathname + url.search + url.hash);
  }

  function resolveId(id) {
    let cur = id;
    const seen = new Set();
    while (aliases[cur] && !seen.has(cur)) {
      seen.add(cur);
      cur = aliases[cur];
    }
    return cur;
  }

  function migrateChecks() {
    const raw = S.loadSyllabusChecks();
    const next = {};
    let changed = false;
    for (const [id, on] of Object.entries(raw)) {
      if (!on) continue;
      const canon = resolveId(id);
      if (canon !== id) changed = true;
      next[canon] = true;
    }
    if (changed || Object.keys(next).length !== Object.keys(raw).length) {
      S.saveSyllabusChecks(next);
    }
    checks = next;
  }

  function reloadChecks() {
    checks = S.loadSyllabusChecks();
  }

  function weeksForItem(itemId) {
    const auto = (autoToWeeks[itemId] || []).filter(
      (weekId) => !S.isWeekSyllabusHidden?.(weekId, itemId)
    );
    const manual = S.invertWeekSyllabus()[itemId] || [];
    return Array.from(new Set([...auto, ...manual]));
  }

  function findThisWeekId() {
    if (!planWeeks.length) return null;
    const today = new Date();
    today.setHours(12, 0, 0, 0);
    for (const w of planWeeks) {
      const m = String(w.dates || "").match(
        /(\d{1,2})\s+(\w+)\s+(\d{4})\s*[–\-]\s*(\d{1,2})\s+(\w+)\s+(\d{4})/i
      );
      if (!m) continue;
      const months = {
        jan: 0, january: 0, feb: 1, february: 1, mar: 2, march: 2,
        apr: 3, april: 3, may: 4, jun: 5, june: 5, jul: 6, july: 6,
        aug: 7, august: 7, sep: 8, sept: 8, september: 8,
        oct: 9, october: 9, nov: 10, november: 10, dec: 11, december: 11,
      };
      const sm = months[m[2].toLowerCase()];
      const em = months[m[5].toLowerCase()];
      if (sm == null || em == null) continue;
      const start = new Date(Number(m[3]), sm, Number(m[1]), 0, 0, 0);
      const end = new Date(Number(m[6]), em, Number(m[4]), 23, 59, 59);
      if (today >= start && today <= end) return w.id;
    }
    return null;
  }

  function loadRecentWeeks() {
    try {
      const a = JSON.parse(localStorage.getItem(RECENT_KEY) || "[]");
      return Array.isArray(a) ? a.filter((id) => weekById[id]).slice(0, 5) : [];
    } catch {
      return [];
    }
  }

  function pushRecentWeek(weekId) {
    const next = [weekId, ...loadRecentWeeks().filter((id) => id !== weekId)].slice(0, 5);
    localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  }

  function weekTitle(w) {
    if (!w) return "";
    return `Week ${w.week} · ${w.theme || w.id}`;
  }

  function showToast(msg) {
    let el = document.getElementById("syllabus-toast");
    if (!el) {
      el = document.createElement("div");
      el.id = "syllabus-toast";
      el.className = "syllabus-toast";
      document.body.appendChild(el);
    }
    el.textContent = msg;
    el.hidden = false;
    clearTimeout(el._t);
    el._t = setTimeout(() => {
      el.hidden = true;
    }, 2800);
  }

  function closePopover() {
    openPopover?.remove();
    openPopover = null;
  }

  function attachToWeek(syllabusId, weekId) {
    S.addWeekSyllabusId(weekId, syllabusId);
    pushRecentWeek(weekId);
    S.touchLocal();
    S.schedulePush();
    const w = weekById[weekId];
    showToast(`Added to ${weekTitle(w) || weekId}`);
    closePopover();
    renderBody();
  }

  function openAddPopover(anchorBtn, syllabusId) {
    closePopover();
    const pop = document.createElement("div");
    pop.className = "syllabus-week-popover";
    const thisId = findThisWeekId();
    const recent = loadRecentWeeks();

    pop.innerHTML = `
      <div class="syllabus-week-popover-head">Add to plan week</div>
      ${thisId ? `<button type="button" class="syllabus-week-opt primary" data-week="${esc(thisId)}">This week — ${esc(weekTitle(weekById[thisId]))}</button>` : '<p class="muted">No calendar week matches today.</p>'}
      ${recent.length ? `<div class="syllabus-week-section">Recent</div>${recent.map((id) => `<button type="button" class="syllabus-week-opt" data-week="${esc(id)}">${esc(weekTitle(weekById[id]))}</button>`).join("")}` : ""}
      <div class="syllabus-week-section">Search weeks</div>
      <input type="search" class="syllabus-week-search" placeholder="Theme or week id…" autocomplete="off"/>
      <div class="syllabus-week-results"></div>
      <button type="button" class="syllabus-week-cancel">Cancel</button>
    `;

    const results = pop.querySelector(".syllabus-week-results");
    const search = pop.querySelector(".syllabus-week-search");

    function renderResults(q) {
      const fq = fold(q).trim();
      let list = planWeeks;
      if (fq) {
        list = planWeeks.filter((w) =>
          fold(`${w.id} ${w.week} ${w.theme} ${w.dates} ${w.level}`).includes(fq)
        );
      } else {
        list = planWeeks.slice(0, 8);
      }
      results.innerHTML = list
        .slice(0, 12)
        .map(
          (w) =>
            `<button type="button" class="syllabus-week-opt" data-week="${esc(w.id)}">${esc(weekTitle(w))} <span class="muted">${esc(w.dates || "")}</span></button>`
        )
        .join("") || '<p class="muted">No weeks found.</p>';
      results.querySelectorAll("[data-week]").forEach((btn) => {
        btn.addEventListener("click", () => attachToWeek(syllabusId, btn.getAttribute("data-week")));
      });
    }

    pop.querySelectorAll(":scope > [data-week]").forEach((btn) => {
      btn.addEventListener("click", () => attachToWeek(syllabusId, btn.getAttribute("data-week")));
    });
    search?.addEventListener("input", () => renderResults(search.value));
    pop.querySelector(".syllabus-week-cancel")?.addEventListener("click", closePopover);
    renderResults("");

    document.body.appendChild(pop);
    openPopover = pop;
    const rect = anchorBtn.getBoundingClientRect();
    const top = Math.min(rect.bottom + 6 + (window.scrollY || 0), (window.scrollY || 0) + window.innerHeight - 320);
    const left = Math.min(Math.max(8, rect.left + scrollX), scrollX + window.innerWidth - 320);
    pop.style.top = `${top}px`;
    pop.style.left = `${left}px`;
    search?.focus();
  }

  function esc(s) {
    const d = document.createElement("div");
    d.textContent = s;
    return d.innerHTML;
  }

  function lessonHref(slug) {
    return slug ? `../${slug}/` : null;
  }

  function planWeekLinks(itemId) {
    const wids = weeksForItem(itemId);
    if (!wids.length) return "";
    const links = wids
      .slice(0, 3)
      .map((wid) => {
        const w = weekById[wid];
        const label = w ? `W${w.week}` : wid.replace(/^w/, "");
        return `<a href="../../plan/?week=${encodeURIComponent(wid)}">${esc(label)}</a>`;
      })
      .join(" · ");
    const more = wids.length > 3 ? ` +${wids.length - 3}` : "";
    return `<span class="syllabus-plan-link">Plan: ${links}${more}</span>`;
  }

  function statsForLevel(level) {
    const subset = items.filter((i) => i.level === level);
    const done = subset.filter((i) => checks[i.id]).length;
    const onSite = subset.filter((i) => i.lesson_slug && !i.gap).length;
    const gaps = subset.filter((i) => i.gap).length;
    return { total: subset.length, done, onSite, gaps };
  }

  function renderSummary() {
    const el = document.getElementById("syllabusSummary");
    if (!el) return;
    const parts = LEVELS.map((lvl) => {
      const s = statsForLevel(lvl);
      if (!s.total) return "";
      const exam = EXAM_LABEL[lvl] || "";
      return `<span class="syllabus-stat"><strong>${lvl}</strong>${exam ? ` <span class="syllabus-exam">${exam}</span>` : ""} ${s.done}/${s.total} done · ${s.onSite} on site${s.gaps ? ` · ${s.gaps} gap` : ""}</span>`;
    }).filter(Boolean);
    const allDone = items.filter((i) => checks[i.id]).length;
    el.innerHTML = `<span class="syllabus-stat syllabus-stat-total"><strong>All</strong> ${allDone}/${items.length} done</span>${parts.join("")}`;
  }

  function renderLevelPills() {
    const el = document.getElementById("levelPills");
    if (!el) return;
    el.innerHTML = "";
    const mk = (label, val) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "syllabus-pill" + (activeLevel === val ? " active" : "");
      b.textContent = label;
      b.addEventListener("click", () => {
        activeLevel = val;
        renderLevelPills();
        renderBody();
      });
      el.appendChild(b);
    };
    mk("All levels", "all");
    LEVELS.forEach((l) => {
      const s = statsForLevel(l);
      if (s.total) mk(l, l);
    });
  }

  function renderBody() {
    reloadChecks();
    const el = document.getElementById("syllabusBody");
    if (!el) return;
    el.innerHTML = "";

    const filtered = filteredItems();
    const q = fold(searchQuery).trim();
    renderDidYou(q, filtered.length);

    if (!filtered.length) {
      const empty = document.createElement("p");
      empty.className = "syllabus-empty";
      empty.textContent = q
        ? "No syllabus items match that search."
        : "No items in this level.";
      el.appendChild(empty);
      renderSummary();
      return;
    }

    const byLevel = {};
    filtered.forEach((i) => {
      byLevel[i.level] = byLevel[i.level] || {};
      byLevel[i.level][i.category] = byLevel[i.level][i.category] || [];
      byLevel[i.level][i.category].push(i);
    });

    LEVELS.forEach((lvl) => {
      if (!byLevel[lvl]) return;
      const section = document.createElement("section");
      section.className = "syllabus-level";
      section.id = "level-" + lvl;

      const h = document.createElement("h2");
      h.className = "syllabus-level-heading";
      const st = statsForLevel(lvl);
      const exam = EXAM_LABEL[lvl] || "";
      h.innerHTML = `${lvl}${exam ? ` <span class="syllabus-exam-pill">${esc(exam)}</span>` : ""} <span class="syllabus-level-meta">${st.done}/${st.total} done</span>`;
      section.appendChild(h);

      Object.keys(byLevel[lvl])
        .sort()
        .forEach((cat) => {
          const catBlock = document.createElement("div");
          catBlock.className = "syllabus-category";

          const toggle = document.createElement("button");
          toggle.type = "button";
          toggle.className = "syllabus-cat-toggle";
          toggle.setAttribute("aria-expanded", "true");
          const catItems = byLevel[lvl][cat];
          const catDone = catItems.filter((i) => checks[i.id]).length;
          toggle.innerHTML = `<span class="syllabus-cat-name">${esc(cat)}</span><span class="syllabus-cat-meta">${catDone}/${catItems.length}</span>`;
          catBlock.appendChild(toggle);

          const list = document.createElement("ul");
          list.className = "syllabus-list";

          catItems.forEach((item) => {
            const li = document.createElement("li");
            li.className =
              "syllabus-row" +
              (checks[item.id] ? " done" : "") +
              (item.gap ? " is-gap" : "");
            li.id = item.id;

            const label = document.createElement("label");
            label.className = "syllabus-check";

            const cb = document.createElement("input");
            cb.type = "checkbox";
            cb.checked = !!checks[item.id];
            cb.addEventListener("change", () => {
              S.setSyllabusCheck(item.id, cb.checked);
              reloadChecks();
              li.classList.toggle("done", cb.checked);
              renderSummary();
              document.querySelectorAll(".syllabus-level-meta").forEach((node, idx) => {
                const level = LEVELS[idx];
                if (!level) return;
                const s = statsForLevel(level);
                node.textContent = `${s.done}/${s.total} done`;
              });
              toggle.querySelector(".syllabus-cat-meta").textContent =
                `${catItems.filter((i) => checks[i.id]).length}/${catItems.length}`;
              S.touchLocal();
              S.schedulePush();
            });
            label.appendChild(cb);

            const text = document.createElement("span");
            text.className = "syllabus-label";
            const href = lessonHref(item.lesson_slug);
            if (href) {
              text.innerHTML = `<a href="${href}">${esc(item.label)}</a>`;
            } else {
              text.textContent = item.label;
            }
            if (item.note) {
              text.title = item.note;
            }
            label.appendChild(text);
            li.appendChild(label);

            const badges = document.createElement("span");
            badges.className = "syllabus-badges";
            if (item.gap) {
              badges.innerHTML += `<span class="syllabus-badge gap" title="${esc(item.note || "No dedicated site lesson yet")}">Gap</span>`;
            } else if (item.lesson_slug) {
              badges.innerHTML += `<span class="syllabus-badge on-site">On site</span>`;
            }
            if (item.pp_url) {
              badges.innerHTML += `<a class="syllabus-badge pp" href="${esc(item.pp_url)}" target="_blank" rel="noopener" title="Practice Portuguese">PP</a>`;
            }
            const planHint = planWeekLinks(item.id);
            if (planHint) badges.innerHTML += planHint;
            const addBtn = document.createElement("button");
            addBtn.type = "button";
            addBtn.className = "syllabus-badge add-week";
            addBtn.textContent = "Add to week";
            addBtn.addEventListener("click", (e) => {
              e.preventDefault();
              e.stopPropagation();
              openAddPopover(addBtn, item.id);
            });
            badges.appendChild(addBtn);
            li.appendChild(badges);
            list.appendChild(li);
          });

          toggle.addEventListener("click", () => {
            const open = list.style.display !== "none";
            list.style.display = open ? "none" : "";
            toggle.setAttribute("aria-expanded", String(!open));
          });

          catBlock.appendChild(list);
          section.appendChild(catBlock);
        });

      el.appendChild(section);
    });

    renderSummary();
  }

  function bindSearch() {
    const input = document.getElementById("syllabusSearch");
    if (!input) return;
    input.value = searchQuery;
    let timer = null;
    const apply = () => {
      searchQuery = input.value || "";
      syncSearchParam(searchQuery);
      renderBody();
    };
    input.addEventListener("input", () => {
      clearTimeout(timer);
      timer = setTimeout(apply, 120);
    });
    input.addEventListener("search", apply);
  }

  function bindJump() {
    const menu = document.getElementById("levelJump");
    if (!menu) return;
    menu.innerHTML = "";
    LEVELS.forEach((lvl) => {
      if (!statsForLevel(lvl).total) return;
      const a = document.createElement("a");
      a.href = "#level-" + lvl;
      a.textContent = lvl;
      a.addEventListener("click", (e) => {
        e.preventDefault();
        document.getElementById("level-" + lvl)?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
      menu.appendChild(a);
    });
  }

  function bindReset() {
    document.getElementById("resetChecks")?.addEventListener("click", () => {
      if (!confirm("Clear all syllabus checkmarks?")) return;
      S.saveSyllabusChecks({});
      reloadChecks();
      renderBody();
      S.touchLocal();
      S.schedulePush();
    });
  }

  function bindLiveUpdates() {
    window.addEventListener("ptpt-syllabus-changed", () => {
      reloadChecks();
      renderBody();
    });
    window.addEventListener("ptpt-week-syllabus-changed", () => {
      renderBody();
    });
    window.addEventListener("storage", (e) => {
      if (e.key === S.SYLLABUS_STORAGE_KEY || e.key === S.WEEK_SYLLABUS_KEY) {
        reloadChecks();
        renderBody();
      }
    });
    document.addEventListener("click", (e) => {
      if (!openPopover) return;
      if (openPopover.contains(e.target)) return;
      if (e.target.closest?.(".syllabus-badge.add-week")) return;
      closePopover();
    });
  }

  async function boot() {
    try {
      const [dataRes, mapRes, planRes] = await Promise.all([
        fetch(DATA_URL),
        fetch(MAP_URL),
        fetch(PLAN_URL),
      ]);
      if (!dataRes.ok) throw new Error("syllabus data");
      const data = await dataRes.json();
      items = data.items || [];
      aliases = data.aliases || {};
      lessonText = data.lessonText || {};
      migrateChecks();
      if (mapRes.ok) {
        const map = await mapRes.json();
        autoToWeeks = map.syllabusToWeeks || {};
      }
      if (planRes.ok) {
        const plan = await planRes.json();
        planWeeks = plan.weeks || [];
        weekById = {};
        for (const w of planWeeks) weekById[w.id] = w;
      }
    } catch (err) {
      const el = document.getElementById("syllabusBody");
      if (el) el.textContent = "Could not load syllabus data.";
      console.error(err);
      return;
    }

    if (S.loadSyncCfg()) {
      try {
        await S.pullRemote();
        reloadChecks();
      } catch (err) {
        console.warn("Syllabus sync pull:", err);
      }
    }

    bindLiveUpdates();
    const params = new URLSearchParams(location.search);
    const qParam = params.get("q");
    if (qParam) searchQuery = qParam;
    bindSearch();
    renderLevelPills();
    bindJump();
    bindReset();
    renderBody();

    if (location.hash) {
      const id = location.hash.slice(1);
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  boot();
})();
