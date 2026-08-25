/*! Reusable vocabulary bottom-sheet card (opens by lemma without leaving the page). */
(function () {
  "use strict";

  function resolveScriptUrl() {
    const el =
      document.currentScript ||
      document.querySelector('script[src*="vocab-sheet.js"]');
    return el && el.src ? el.src : "";
  }

  const scriptUrl = resolveScriptUrl();
  const siteRoot = scriptUrl
    ? new URL("../", scriptUrl).href
    : new URL("./", location.href).href;
  const dataUrl = new URL("../vocabulary/vocab-data.json", scriptUrl || siteRoot).href;
  const verbsBase = new URL("../verbs/", scriptUrl || siteRoot).href;

  let DATA = null;
  let loading = null;
  let ready = false;

  function esc(s) {
    return String(s || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function injectStyles() {
    if (document.getElementById("pt-vs-styles")) return;
    const s = document.createElement("style");
    s.id = "pt-vs-styles";
    s.textContent = `
#pt-vs-backdrop {
  display: none; position: fixed; inset: 0; background: rgba(28,25,23,.35); z-index: 80;
}
#pt-vs-backdrop.show { display: block; }
#pt-vs-sheet {
  display: none; position: fixed; left: 0; right: 0; bottom: 0; z-index: 81;
  max-height: 82vh; background: #fff; border-radius: 16px 16px 0 0;
  box-shadow: 0 -8px 32px rgba(0,0,0,.18); flex-direction: column;
  font-family: "Segoe UI", system-ui, sans-serif; color: #1c1917;
}
#pt-vs-sheet.show { display: flex; }
#pt-vs-sheet .ex-handle { flex: 0 0 auto; display: flex; justify-content: center; padding: .55rem 0 .15rem; }
#pt-vs-sheet .ex-handle span { width: 2.5rem; height: .28rem; border-radius: 999px; background: #d6d3d1; }
#pt-vs-sheet .ex-sheet-head {
  flex: 0 0 auto; display: flex; align-items: flex-start; justify-content: space-between;
  gap: .75rem; padding: .55rem 1rem .85rem; border-bottom: 1px solid #e7e5e4;
}
#pt-vs-sheet .ex-title { font-weight: 760; font-size: 1.45rem; letter-spacing: -0.02em; line-height: 1.15; }
#pt-vs-sheet .ex-title-row { display: flex; flex-wrap: wrap; align-items: center; gap: .45rem .55rem; }
#pt-vs-sheet .ex-level {
  display: inline-block; font-size: .72rem; font-weight: 700; color: #0f766e;
  border: 1.5px solid #0f766e; border-radius: 5px; padding: .12rem .4rem;
}
#pt-vs-sheet .ex-pos { margin-top: .25rem; font-size: .9rem; color: #a8a29e; font-style: italic; }
#pt-vs-sheet .ex-pron {
  font-size: .88rem; color: #0f766e; font-weight: 500; margin-top: .45rem;
  font-family: ui-monospace, Consolas, monospace;
}
#pt-vs-sheet .ex-close {
  border: 0; background: #e7e5e4; color: #292524; width: 2.15rem; height: 2.15rem;
  border-radius: 999px; font-size: 1.15rem; line-height: 1; cursor: pointer; flex: 0 0 auto;
}
#pt-vs-sheet .ex-sheet-body {
  flex: 1 1 auto; overflow: auto; -webkit-overflow-scrolling: touch;
  padding: .95rem 1rem 1.4rem; overscroll-behavior: contain;
}
#pt-vs-sheet .def-short {
  font-size: 1.12rem; font-weight: 700; line-height: 1.35; margin: 0 0 .4rem;
  font-family: Georgia, "Times New Roman", serif;
}
#pt-vs-sheet .def-long { margin: 0 0 1rem; color: #78716c; font-size: .9rem; line-height: 1.45; }
#pt-vs-sheet .def-morph { margin: 0 0 1rem; font-size: .84rem; color: #57534e; }
#pt-vs-sheet .ex-card { display: grid; gap: .75rem; margin: 0 0 1.15rem; }
#pt-vs-sheet .ex-row { display: grid; gap: .15rem; }
#pt-vs-sheet .ex-label { font-size: .78rem; color: #a8a29e; font-weight: 600; }
#pt-vs-sheet .ex-pt {
  font-size: 1.02rem; line-height: 1.4; font-family: Georgia, "Times New Roman", serif;
}
#pt-vs-sheet .ex-en { font-size: .88rem; color: #78716c; line-height: 1.35; }
#pt-vs-sheet .sec-label {
  margin: 1.1rem 0 .45rem; font-size: .7rem; font-weight: 700;
  letter-spacing: .06em; text-transform: uppercase; color: #a8a29e;
}
#pt-vs-sheet .conj-box {
  margin: 0 0 1.1rem; padding: .75rem .8rem; background: #fafaf9;
  border: 1px solid #e7e5e4; border-radius: 10px;
}
#pt-vs-sheet .conj-grid {
  display: grid; grid-template-columns: auto 1fr; gap: .28rem .75rem;
  font-size: .9rem; margin: 0 0 .65rem;
}
#pt-vs-sheet .conj-grid .pn { color: #78716c; }
#pt-vs-sheet .conj-grid .fm { font-weight: 700; }
#pt-vs-sheet .conj-link { font-size: .84rem; color: #0f766e; text-decoration: none; font-weight: 600; }
#pt-vs-sheet .use-list, #pt-vs-sheet .sim-list {
  margin: 0; padding: 0; list-style: none; display: grid; gap: .55rem;
}
#pt-vs-sheet .sim-lemma.linkish {
  cursor: pointer; color: #0f766e; font-weight: 700; border-bottom: 1px dashed #0f766e;
}
#pt-vs-sheet .use-pt { font-weight: 700; }
#pt-vs-sheet .use-en, #pt-vs-sheet .sim-note { color: #78716c; font-weight: 400; }
#pt-vs-sheet .sim-note { display: block; margin-top: .15rem; font-size: .84rem; }
#pt-vs-sheet .miss { color: #78716c; font-size: .95rem; }
body.pt-vs-open { overflow: hidden; }
body.pt-vs-open .to-top, body.pt-vs-open button.to-top { display: none !important; }
button.vocab-open, .vocab-open {
  border: 0; background: none; padding: 0; margin: 0 .65rem 0 0;
  color: #0f766e; font: inherit; font-size: .82rem; font-weight: 600;
  cursor: pointer; text-decoration: underline; text-underline-offset: 2px;
}
button.vocab-open:hover { color: #0d5f58; }
`;
    document.head.appendChild(s);
  }

  function ensureDom() {
    if (document.getElementById("pt-vs-sheet")) return;
    injectStyles();
    const backdrop = document.createElement("div");
    backdrop.id = "pt-vs-backdrop";
    backdrop.hidden = true;
    const sheet = document.createElement("div");
    sheet.id = "pt-vs-sheet";
    sheet.hidden = true;
    sheet.setAttribute("role", "dialog");
    sheet.setAttribute("aria-modal", "true");
    sheet.setAttribute("aria-labelledby", "pt-vs-title");
    sheet.innerHTML = `
      <div class="ex-handle" aria-hidden="true"><span></span></div>
      <div class="ex-sheet-head">
        <div class="ex-head-main">
          <div class="ex-title-row">
            <div class="ex-title" id="pt-vs-title"></div>
            <span class="ex-level" id="pt-vs-level" hidden></span>
          </div>
          <div class="ex-pos" id="pt-vs-pos"></div>
          <div class="ex-pron" id="pt-vs-pron" hidden></div>
        </div>
        <button type="button" class="ex-close" id="pt-vs-close" aria-label="Close">×</button>
      </div>
      <div class="ex-sheet-body" id="pt-vs-body"></div>`;
    document.body.appendChild(backdrop);
    document.body.appendChild(sheet);
    document.getElementById("pt-vs-close").addEventListener("click", close);
    backdrop.addEventListener("click", close);
    sheet.addEventListener("click", (e) => {
      const sim = e.target.closest("[data-vs-lemma]");
      if (sim) {
        e.preventDefault();
        open(sim.getAttribute("data-vs-lemma"));
      }
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && document.body.classList.contains("pt-vs-open")) close();
    });
  }

  function loadData() {
    if (DATA) return Promise.resolve(DATA);
    if (loading) return loading;
    loading = fetch(dataUrl, { cache: "force-cache" })
      .then((r) => {
        if (!r.ok) throw new Error("vocab load failed");
        return r.json();
      })
      .then((rows) => {
        DATA = rows;
        ready = true;
        return DATA;
      })
      .catch((err) => {
        loading = null;
        throw err;
      });
    return loading;
  }

  function findRow(lemma) {
    const q = String(lemma || "").toLowerCase().trim();
    if (!q || !DATA) return null;
    let hit = DATA.find((r) => String(r.lemma).toLowerCase() === q);
    if (hit) return hit;
    hit = DATA.find((r) => (r.forms || []).some((f) => String(f).toLowerCase() === q));
    if (hit) return hit;
    hit = DATA.find((r) => String(r.lemma).toLowerCase().replace(/\/.*/, "") === q);
    if (hit) return hit;
    // Phrase chip like "bom dia" → try first word
    if (q.includes(" ")) {
      const first = q.split(/\s+/)[0];
      return findRow(first);
    }
    return null;
  }

  function renderRow(r) {
    const title = document.getElementById("pt-vs-title");
    const level = document.getElementById("pt-vs-level");
    const pos = document.getElementById("pt-vs-pos");
    const pron = document.getElementById("pt-vs-pron");
    const body = document.getElementById("pt-vs-body");

    title.textContent = r.lemma;
    if (r.level) {
      level.textContent = r.level;
      level.hidden = false;
    } else level.hidden = true;
    pos.textContent = r.pos || "";
    if (r.ipa && r.say) {
      pron.textContent = `/${r.ipa}/ · ${r.say}`;
      pron.hidden = false;
    } else if (r.ipa) {
      pron.textContent = `/${r.ipa}/`;
      pron.hidden = false;
    } else pron.hidden = true;

    const exRows = (r.ex || [])
      .map((item) => {
        const pt = typeof item === "string" ? item : item.pt || "";
        const en = typeof item === "string" ? "" : item.en || "";
        return `<div class="ex-row">
          <div class="ex-label">ex.</div>
          <div class="ex-pt">${esc(pt)}</div>
          ${en ? `<div class="ex-en">${esc(en)}</div>` : ""}
        </div>`;
      })
      .join("");

    const uses = r.uses || [];
    const usesHtml = uses.length
      ? `<div class="sec-label">Common uses</div>
         <ul class="use-list">${uses
           .map(
             (u) =>
               `<li><span class="use-pt">${esc(u.pt || "")}</span>
                <span class="use-en"> (${esc(u.en || "")})</span></li>`
           )
           .join("")}</ul>`
      : "";

    const c = r.conj;
    const conjOf = r.conjOf || r.lemma;
    const conjNote =
      r.pos === "v." &&
      conjOf &&
      String(conjOf).toLowerCase() !== String(r.lemma).toLowerCase()
        ? `<div style="font-size:.82rem;color:#78716c;margin:0 0 .45rem">Forms of <strong>${esc(conjOf)}</strong></div>`
        : "";
    const conjHtml = c
      ? `<div class="conj-box">
          <div class="sec-label">Present indicative</div>
          ${conjNote}
          <div class="conj-grid">
            <span class="pn">eu</span><span class="fm">${esc(c.eu)}</span>
            <span class="pn">tu</span><span class="fm">${esc(c.tu)}</span>
            <span class="pn">ele / ela</span><span class="fm">${esc(c.ele)}</span>
            <span class="pn">nós</span><span class="fm">${esc(c.nos)}</span>
            <span class="pn">eles / elas / vocês</span><span class="fm">${esc(c.eles)}</span>
          </div>
          <a class="conj-link" href="${verbsBase}?q=${encodeURIComponent(conjOf)}">Open full conjugations →</a>
        </div>`
      : r.pos === "v."
        ? `<div class="conj-box"><div class="sec-label">Present indicative</div>
           <div style="font-size:.88rem;color:#78716c;margin:0 0 .55rem">Not in the verb table yet.</div>
           <a class="conj-link" href="${verbsBase}?q=${encodeURIComponent(r.lemma)}">Search on Verbs →</a></div>`
        : "";

    const similar = r.similar || [];
    const similarHtml = similar.length
      ? `<div class="sec-label">Similar words</div>
         <ul class="sim-list">${similar
           .map((s) => {
             const inDict = DATA.some(
               (x) => x.lemma.toLowerCase() === String(s.lemma || "").toLowerCase()
             );
             const cls = inDict ? "sim-lemma linkish" : "sim-lemma";
             const attr = inDict ? ` data-vs-lemma="${esc(s.lemma)}"` : "";
             return `<li><span class="${cls}"${attr}>${esc(s.lemma || "")}</span>
               ${s.note ? `<span class="sim-note">${esc(s.note)}</span>` : ""}</li>`;
           })
           .join("")}</ul>`
      : "";

    body.innerHTML = `
      <div class="def-short">${esc(r.short || r.en || "")}</div>
      ${r.definition ? `<p class="def-long">${esc(r.definition)}</p>` : ""}
      ${r.morph ? `<div class="def-morph">${esc(r.morph)}</div>` : ""}
      ${conjHtml}
      ${exRows ? `<div class="ex-card">${exRows}</div>` : ""}
      ${usesHtml}
      ${similarHtml}
      <div class="sec-label" style="margin-top:1.25rem;opacity:.75">${esc(r.topic || "")}</div>`;
  }

  function renderMiss(lemma) {
    document.getElementById("pt-vs-title").textContent = lemma || "Not found";
    document.getElementById("pt-vs-level").hidden = true;
    document.getElementById("pt-vs-pos").textContent = "";
    document.getElementById("pt-vs-pron").hidden = true;
    document.getElementById("pt-vs-body").innerHTML =
      `<p class="miss">No dictionary card for <strong>${esc(lemma)}</strong> yet.</p>`;
  }

  function show() {
    ensureDom();
    const sheet = document.getElementById("pt-vs-sheet");
    const backdrop = document.getElementById("pt-vs-backdrop");
    sheet.hidden = false;
    backdrop.hidden = false;
    document.body.classList.add("pt-vs-open");
    requestAnimationFrame(() => {
      sheet.classList.add("show");
      backdrop.classList.add("show");
    });
  }

  function close() {
    const sheet = document.getElementById("pt-vs-sheet");
    const backdrop = document.getElementById("pt-vs-backdrop");
    if (!sheet) return;
    sheet.classList.remove("show");
    backdrop.classList.remove("show");
    sheet.hidden = true;
    backdrop.hidden = true;
    document.body.classList.remove("pt-vs-open");
  }

  function open(lemma) {
    ensureDom();
    show();
    document.getElementById("pt-vs-title").textContent = lemma || "…";
    document.getElementById("pt-vs-body").innerHTML = `<p class="miss">Loading…</p>`;
    return loadData()
      .then(() => {
        const r = findRow(lemma);
        if (r) renderRow(r);
        else renderMiss(lemma);
      })
      .catch(() => {
        renderMiss(lemma);
        document.getElementById("pt-vs-body").innerHTML =
          `<p class="miss">Could not load the dictionary.</p>`;
      });
  }

  // Event delegation for any [data-vocab-open] / .vocab-open
  document.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-vocab-open], button.vocab-open");
    if (!btn) return;
    e.preventDefault();
    const lemma = btn.getAttribute("data-vocab-open") || btn.getAttribute("data-lemma") || btn.textContent;
    if (lemma) open(lemma.trim());
  });

  window.PtVocabSheet = { open, close, ready: () => ready };

  // Preload when included so first tap is snappy
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      ensureDom();
      loadData().catch(() => {});
    });
  } else {
    ensureDom();
    loadData().catch(() => {});
  }
})();
