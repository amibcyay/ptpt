/* Grammar syllabus checklist — shared store via ptpt-sync.js */
(function () {
  const S = window.PtptSync;
  if (!S) {
    console.error("ptpt-sync.js must load before syllabus.js");
    return;
  }

  const LEVELS = ["A1", "A2", "B1", "B2"];
  const DATA_URL = "../../data/grammar-syllabus.json";
  const MAP_URL = "../../data/plan-grammar-syllabus-map.json";

  let items = [];
  let checks = S.loadSyllabusChecks();
  let syllabusToWeeks = {};
  let activeLevel = "all";

  function reloadChecks() {
    checks = S.loadSyllabusChecks();
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
    const wids = syllabusToWeeks[itemId] || [];
    if (!wids.length) return "";
    const links = wids
      .slice(0, 3)
      .map((wid) => `<a href="../../plan/?week=${encodeURIComponent(wid)}">Week ${esc(wid.replace(/^w/, ""))}</a>`)
      .join(" · ");
    const more = wids.length > 3 ? ` +${wids.length - 3}` : "";
    return `<span class="syllabus-plan-link">Plan: ${links}${more}</span>`;
  }

  function statsForLevel(level) {
    const subset = items.filter((i) => i.level === level);
    const done = subset.filter((i) => checks[i.id]).length;
    const onSite = subset.filter((i) => i.lesson_slug).length;
    return { total: subset.length, done, onSite };
  }

  function renderSummary() {
    const el = document.getElementById("syllabusSummary");
    if (!el) return;
    const parts = LEVELS.map((lvl) => {
      const s = statsForLevel(lvl);
      return `<span class="syllabus-stat"><strong>${lvl}</strong> ${s.done}/${s.total} done · ${s.onSite} on site</span>`;
    });
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
    LEVELS.forEach((l) => mk(l, l));
  }

  function renderBody() {
    reloadChecks();
    const el = document.getElementById("syllabusBody");
    if (!el) return;
    el.innerHTML = "";

    const filtered = activeLevel === "all" ? items : items.filter((i) => i.level === activeLevel);
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
      h.innerHTML = `${lvl} <span class="syllabus-level-meta">${st.done}/${st.total} done</span>`;
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
            li.className = "syllabus-row" + (checks[item.id] ? " done" : "");
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
            label.appendChild(text);
            li.appendChild(label);

            const badges = document.createElement("span");
            badges.className = "syllabus-badges";
            if (item.lesson_slug) {
              badges.innerHTML += `<span class="syllabus-badge on-site">On site</span>`;
            }
            if (item.pp_url) {
              badges.innerHTML += `<a class="syllabus-badge pp" href="${esc(item.pp_url)}" target="_blank" rel="noopener" title="Practice Portuguese">PP</a>`;
            }
            const planHint = planWeekLinks(item.id);
            if (planHint) badges.innerHTML += planHint;
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

  function bindJump() {
    const menu = document.getElementById("levelJump");
    if (!menu) return;
    menu.innerHTML = "";
    LEVELS.forEach((lvl) => {
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
    window.addEventListener("storage", (e) => {
      if (e.key === S.SYLLABUS_STORAGE_KEY) {
        reloadChecks();
        renderBody();
      }
    });
  }

  async function boot() {
    try {
      const [dataRes, mapRes] = await Promise.all([
        fetch(DATA_URL),
        fetch(MAP_URL),
      ]);
      if (!dataRes.ok) throw new Error("syllabus data");
      const data = await dataRes.json();
      items = data.items || [];
      if (mapRes.ok) {
        const map = await mapRes.json();
        syllabusToWeeks = map.syllabusToWeeks || {};
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
