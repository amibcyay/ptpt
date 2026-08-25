/*! Floating mini translator — local vocab/verb lookup + external fallback. */
(function () {
  "use strict";

  function resolveScriptUrl() {
    const el =
      document.currentScript ||
      document.querySelector('script[src*="translator.js"]');
    if (el && el.src) return el.src;
    return "";
  }

  const scriptUrl = resolveScriptUrl();
  // scripts/translator.js → site root is one level up
  const siteRoot = scriptUrl
    ? new URL("../", scriptUrl).href
    : new URL("./", location.href).href;
  const dataCandidates = scriptUrl
    ? [
        new URL("../data/translator-index.json", scriptUrl).href,
        new URL("data/translator-index.json", siteRoot).href,
      ]
    : [new URL("data/translator-index.json", siteRoot).href];

  let indexMap = null;
  let loadError = null;
  let loading = null;

  function injectStyles() {
    if (document.getElementById("pt-tr-styles")) return;
    const s = document.createElement("style");
    s.id = "pt-tr-styles";
    s.textContent = `
#pt-tr-btn {
  position: fixed; left: 1rem; bottom: 1rem; z-index: 90;
  width: 2.85rem; height: 2.85rem; border-radius: 999px; border: 0;
  background: #0f766e; color: #fafaf9; font-size: 1.05rem; font-weight: 700;
  cursor: pointer; box-shadow: 0 6px 18px rgba(0,0,0,.22);
  display: flex; align-items: center; justify-content: center;
  font-family: "Segoe UI", system-ui, sans-serif;
}
#pt-tr-btn:hover { background: #0d5f58; }
#pt-tr-panel {
  position: fixed; left: 1rem; bottom: 4.1rem; z-index: 91;
  width: min(22rem, calc(100vw - 2rem));
  background: #fff; color: #1c1917;
  border: 1px solid #e7e5e4; border-radius: 14px;
  box-shadow: 0 12px 32px rgba(0,0,0,.18);
  display: none; flex-direction: column;
  font-family: "Segoe UI", system-ui, sans-serif;
  overflow: hidden;
}
#pt-tr-panel.open { display: flex; }
#pt-tr-head {
  display: flex; align-items: center; justify-content: space-between;
  gap: .5rem; padding: .7rem .85rem; border-bottom: 1px solid #e7e5e4;
  background: #fafaf9;
}
#pt-tr-head strong { font-size: .92rem; letter-spacing: -0.01em; }
#pt-tr-close {
  border: 0; background: #e7e5e4; color: #292524; width: 1.85rem; height: 1.85rem;
  border-radius: 999px; cursor: pointer; font-size: 1rem; line-height: 1;
}
#pt-tr-body { padding: .75rem .85rem .9rem; }
#pt-tr-form { display: flex; gap: .4rem; margin: 0 0 .65rem; }
#pt-tr-input {
  flex: 1; min-width: 0; padding: .45rem .55rem; border: 1px solid #d6d3d1;
  border-radius: 8px; font-size: .95rem; background: #fff; color: #1c1917;
}
#pt-tr-go {
  border: 0; background: #292524; color: #fafaf9; border-radius: 8px;
  padding: .45rem .7rem; font-size: .82rem; font-weight: 600; cursor: pointer;
}
#pt-tr-go:hover { background: #44403c; }
#pt-tr-out { font-size: .9rem; line-height: 1.4; min-height: 2.5rem; color: #44403c; }
#pt-tr-out .hit-lemma { font-size: 1.15rem; font-weight: 760; color: #1c1917; margin: 0 0 .15rem; }
#pt-tr-out .hit-meta { color: #78716c; font-size: .82rem; margin: 0 0 .35rem; }
#pt-tr-out .hit-en { font-weight: 600; color: #1c1917; margin: 0 0 .55rem; }
#pt-tr-out .hit-form { color: #0f766e; font-size: .82rem; margin: 0 0 .45rem; }
#pt-tr-out a { color: #0f766e; }
#pt-tr-out .ext { margin-top: .55rem; font-size: .82rem; display: grid; gap: .25rem; }
#pt-tr-out .miss { color: #78716c; }
@media (max-width: 720px) {
  #pt-tr-btn { bottom: 4.5rem; }
  #pt-tr-panel { bottom: 7.6rem; }
}
`;
    document.head.appendChild(s);
  }

  function esc(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/"/g, "&quot;");
  }

  function externalLinks(q) {
    const enc = encodeURIComponent(q);
    return (
      `<div class="ext">` +
      `<a href="https://www.deepl.com/translator#pt/en/${enc}" target="_blank" rel="noopener">DeepL</a>` +
      `<a href="https://www.infopedia.pt/dicionarios/lingua-portuguesa/${enc}" target="_blank" rel="noopener">Infopédia</a>` +
      `<a href="https://translate.google.com/?sl=pt&tl=en&text=${enc}&op=translate" target="_blank" rel="noopener">Google Translate</a>` +
      `</div>`
    );
  }

  function pageHref(path, lemma) {
    const u = new URL(path, siteRoot);
    if (lemma) u.searchParams.set("q", lemma);
    return u.href;
  }

  /** Fallback: search DATA already on the verbs/vocab page. */
  function lookupFromPageData(q) {
    try {
      if (typeof DATA !== "undefined" && Array.isArray(DATA) && DATA.length) {
        const sample = DATA[0] || {};
        // Vocabulary rows
        if ("lemma" in sample) {
          const hit = DATA.find(
            (r) =>
              String(r.lemma).toLowerCase() === q ||
              (r.forms || []).some((f) => String(f).toLowerCase() === q)
          );
          if (hit) {
            return {
              key: q,
              hit: {
                lemma: hit.lemma,
                en: hit.short || hit.en || "",
                pos: hit.pos || "",
                src: "vocab",
                path: "vocabulary/",
                form: q !== String(hit.lemma).toLowerCase() ? q : null,
              },
            };
          }
        }
        // Verb rows
        if ("inf" in sample) {
          const hit = DATA.find((r) => {
            const inf = String(r.inf || "").toLowerCase();
            if (inf === q) return true;
            return ["eu", "tu", "ele", "nos", "eles"].some(
              (k) => String(r[k] || "").toLowerCase() === q
            );
          });
          if (hit) {
            return {
              key: q,
              hit: {
                lemma: hit.inf,
                en: hit.en || "",
                pos: "v.",
                src: "verb",
                path: "verbs/",
                form: q !== String(hit.inf).toLowerCase() ? q : null,
              },
            };
          }
        }
      }
    } catch (_) {}
    return null;
  }

  function fetchJson(url) {
    return fetch(url, { cache: "no-cache" }).then((r) => {
      if (!r.ok) throw new Error("HTTP " + r.status + " for " + url);
      return r.json();
    });
  }

  function loadIndex() {
    if (indexMap && Object.keys(indexMap).length) return Promise.resolve(indexMap);
    if (loading) return loading;
    loading = dataCandidates
      .reduce(
        (p, url) => p.catch(() => fetchJson(url)),
        Promise.reject(new Error("start"))
      )
      .then((data) => {
        indexMap = data.map || {};
        loadError = null;
        return indexMap;
      })
      .catch((err) => {
        loadError = err && err.message ? err.message : String(err);
        indexMap = indexMap || {};
        return indexMap;
      })
      .finally(() => {
        loading = null;
      });
    return loading;
  }

  function lookup(raw) {
    const q = raw.trim().toLowerCase();
    if (!q) return null;
    if (indexMap && indexMap[q]) return { key: q, hit: indexMap[q] };
    const bare = q.replace(/[.,!?;:«»""''()]/g, "");
    if (bare && indexMap && indexMap[bare]) return { key: bare, hit: indexMap[bare] };
    return lookupFromPageData(q) || (bare !== q ? lookupFromPageData(bare) : null);
  }

  function renderResult(query, found) {
    const out = document.getElementById("pt-tr-out");
    if (!out) return;
    if (!query.trim()) {
      out.innerHTML = `<span class="miss">Type a Portuguese word (lemma or conjugated form).</span>`;
      return;
    }
    if (!found) {
      const hint = loadError
        ? `<div class="miss">Lookup list failed to load (${esc(loadError)}). Upload <code>data/translator-index.json</code> with the site, or open via a local server (not file://).</div>`
        : `<div class="miss">Not in our vocab / verb lists.</div>`;
      out.innerHTML = hint + externalLinks(query.trim());
      return;
    }
    const h = found.hit;
    const formNote =
      h.form && String(h.form).toLowerCase() !== String(h.lemma).toLowerCase()
        ? `<div class="hit-form">form of <strong>${esc(h.lemma)}</strong></div>`
        : "";
    const where =
      h.src === "verb"
        ? `<a href="${esc(pageHref(h.path || "verbs/", h.lemma))}">Open in Verbs</a>`
        : `<a href="${esc(pageHref(h.path || "vocabulary/", h.lemma))}">Open in Vocabulary</a>`;
    out.innerHTML =
      `<div class="hit-lemma">${esc(h.lemma)}</div>` +
      `<div class="hit-meta">${esc(h.pos || "")}${h.src === "verb" ? " · verb list" : " · dictionary"}</div>` +
      formNote +
      `<div class="hit-en">${esc(h.en || "")}</div>` +
      `<div>${where}</div>` +
      externalLinks(query.trim());
  }

  function openPanel(prefill) {
    const panel = document.getElementById("pt-tr-panel");
    const input = document.getElementById("pt-tr-input");
    if (!panel) return;
    panel.classList.add("open");
    loadIndex().then(() => {
      if (prefill != null && input) {
        input.value = prefill;
        renderResult(prefill, lookup(prefill));
      }
      if (input) input.focus();
    });
  }

  function closePanel() {
    const panel = document.getElementById("pt-tr-panel");
    if (panel) panel.classList.remove("open");
  }

  function togglePanel() {
    const panel = document.getElementById("pt-tr-panel");
    if (!panel) return;
    if (panel.classList.contains("open")) closePanel();
    else openPanel();
  }

  function mount() {
    injectStyles();
    if (document.getElementById("pt-tr-btn")) return;

    const btn = document.createElement("button");
    btn.id = "pt-tr-btn";
    btn.type = "button";
    btn.title = "Quick translate";
    btn.setAttribute("aria-label", "Quick translate");
    btn.textContent = "Aa";

    const panel = document.createElement("div");
    panel.id = "pt-tr-panel";
    panel.setAttribute("role", "dialog");
    panel.setAttribute("aria-label", "Quick translate");
    panel.innerHTML = `
      <div id="pt-tr-head">
        <strong>Quick translate</strong>
        <button type="button" id="pt-tr-close" aria-label="Close">×</button>
      </div>
      <div id="pt-tr-body">
        <form id="pt-tr-form" autocomplete="off">
          <input id="pt-tr-input" type="search" placeholder="e.g. morro, seco…" enterkeyhint="search"/>
          <button type="submit" id="pt-tr-go">Go</button>
        </form>
        <div id="pt-tr-out"><span class="miss">Looks up our dictionary &amp; verb list first.</span></div>
      </div>`;

    document.body.appendChild(btn);
    document.body.appendChild(panel);

    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      togglePanel();
    });
    document.getElementById("pt-tr-close").addEventListener("click", closePanel);
    document.getElementById("pt-tr-form").addEventListener("submit", (e) => {
      e.preventDefault();
      const q = document.getElementById("pt-tr-input").value;
      loadIndex().then(() => renderResult(q, lookup(q)));
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closePanel();
    });
    document.addEventListener("click", (e) => {
      const panelEl = document.getElementById("pt-tr-panel");
      if (!panelEl || !panelEl.classList.contains("open")) return;
      if (e.target.closest("#pt-tr-panel") || e.target.closest("#pt-tr-btn")) return;
      closePanel();
    });

    if (/#(translate|translator)$/i.test(location.hash)) openPanel();
    window.addEventListener("hashchange", () => {
      if (/#(translate|translator)$/i.test(location.hash)) openPanel();
    });

    loadIndex();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mount);
  } else {
    mount();
  }
})();
