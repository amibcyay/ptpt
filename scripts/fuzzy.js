/*! Shared accent-fold + fuzzy “did you mean?” helpers for vocab / verbs / translator. */
(function (global) {
  "use strict";

  function fold(s) {
    if (typeof global.foldPt === "function") return global.foldPt(s);
    return String(s || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();
  }

  function levenshtein(a, b) {
    a = fold(a);
    b = fold(b);
    if (a === b) return 0;
    const m = a.length;
    const n = b.length;
    if (!m) return n;
    if (!n) return m;
    if (Math.abs(m - n) > 4) return 99;
    let prev = new Array(n + 1);
    let cur = new Array(n + 1);
    for (let j = 0; j <= n; j++) prev[j] = j;
    for (let i = 1; i <= m; i++) {
      cur[0] = i;
      const ca = a.charCodeAt(i - 1);
      for (let j = 1; j <= n; j++) {
        const cost = ca === b.charCodeAt(j - 1) ? 0 : 1;
        cur[j] = Math.min(cur[j - 1] + 1, prev[j] + 1, prev[j - 1] + cost);
      }
      const tmp = prev;
      prev = cur;
      cur = tmp;
    }
    return prev[n];
  }

  /**
   * @param {string} query
   * @param {Array<{key:string, label?:string, hay?:string, meta?:string}>|string[]} candidates
   * @param {{limit?:number, maxDist?:number}} [opts]
   * @returns {Array<{key:string, label:string, dist:number, meta?:string}>}
   */
  function suggest(query, candidates, opts) {
    const q = fold(String(query || "").trim());
    if (!q || q.length < 2) return [];
    const limit = (opts && opts.limit) || 5;
    const maxDist =
      (opts && opts.maxDist) != null
        ? opts.maxDist
        : q.length <= 3
          ? 1
          : q.length <= 6
            ? 2
            : 3;
    const scored = [];
    for (const raw of candidates || []) {
      const item =
        typeof raw === "string"
          ? { key: raw, label: raw, hay: raw }
          : {
              key: raw.key,
              label: raw.label || raw.key,
              hay: raw.hay || raw.key,
              meta: raw.meta,
            };
      const hay = fold(item.hay);
      if (!hay) continue;
      let dist = levenshtein(q, hay);
      // Prefer prefix / containment as softer matches
      if (hay.startsWith(q) || q.startsWith(hay)) dist = Math.min(dist, 1);
      else if (hay.includes(q) || q.includes(hay)) dist = Math.min(dist, 2);
      // English/meaning hay may be multi-word — also score first token
      const first = hay.split(/\s+/)[0];
      if (first && first !== hay) dist = Math.min(dist, levenshtein(q, first));
      if (dist > maxDist) continue;
      scored.push({
        key: item.key,
        label: item.label,
        dist,
        meta: item.meta,
      });
    }
    scored.sort((a, b) => a.dist - b.dist || a.label.localeCompare(b.label));
    const seen = new Set();
    const out = [];
    for (const s of scored) {
      const k = fold(s.key);
      if (seen.has(k)) continue;
      seen.add(k);
      out.push(s);
      if (out.length >= limit) break;
    }
    return out;
  }

  function didYouMeanHtml(query, suggestions, onClickAttr) {
    if (!suggestions || !suggestions.length) return "";
    const bits = suggestions.map((s) => {
      const label = s.meta ? `${s.label} (${s.meta})` : s.label;
      if (onClickAttr) {
        return `<button type="button" class="didyou-chip" ${onClickAttr(s)}>${escapeHtml(label)}</button>`;
      }
      return `<strong>${escapeHtml(s.label)}</strong>`;
    });
    return (
      `<div class="didyou-mean">Are you trying to find ${bits.join(" · ")}?</div>`
    );
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/"/g, "&quot;");
  }

  global.PtFuzzy = { fold, levenshtein, suggest, didYouMeanHtml };
})(typeof window !== "undefined" ? window : globalThis);
