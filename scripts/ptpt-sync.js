/* Shared checklist + GitHub Gist sync for study plan and grammar syllabus. */
(function () {
  const SYLLABUS_STORAGE_KEY = "ptpt-syllabus-checks-v1";
  const LEGACY_SYLLABUS_KEY = "ptpt-grammar-syllabus-v1";
  const PLAN_CHECKS_KEY = "ptpt-plan-checks-v2";
  const OVERRIDE_KEY = "ptpt-plan-overrides-v1";
  const SYNC_CFG_KEY = "ptpt-plan-sync-cfg";
  const SYNC_META_KEY = "ptpt-plan-sync-meta";
  const GIST_FILE = "ptpt-plan-checks.json";
  const SYNC_PREFIX = "ptpt1.";

  let pushTimer = null;
  let onRemoteApplied = null;

  function migrateLegacySyllabus() {
    try {
      const legacy = localStorage.getItem(LEGACY_SYLLABUS_KEY);
      if (!legacy) return;
      const current = localStorage.getItem(SYLLABUS_STORAGE_KEY);
      if (current && current !== "{}") {
        localStorage.removeItem(LEGACY_SYLLABUS_KEY);
        return;
      }
      localStorage.setItem(SYLLABUS_STORAGE_KEY, legacy);
      localStorage.removeItem(LEGACY_SYLLABUS_KEY);
    } catch {
      /* ignore */
    }
  }
  migrateLegacySyllabus();

  function loadSyllabusChecks() {
    try {
      return JSON.parse(localStorage.getItem(SYLLABUS_STORAGE_KEY) || "{}") || {};
    } catch {
      return {};
    }
  }

  function saveSyllabusChecks(obj) {
    localStorage.setItem(SYLLABUS_STORAGE_KEY, JSON.stringify(obj || {}));
    window.dispatchEvent(new CustomEvent("ptpt-syllabus-changed", { detail: { id, on } }));
  }

  function setSyllabusCheck(id, on) {
    const all = loadSyllabusChecks();
    if (on) all[id] = true;
    else delete all[id];
    saveSyllabusChecks(all);
  }

  function loadPlanChecks() {
    try {
      return JSON.parse(localStorage.getItem(PLAN_CHECKS_KEY) || "{}") || {};
    } catch {
      return {};
    }
  }

  function savePlanChecks(obj) {
    localStorage.setItem(PLAN_CHECKS_KEY, JSON.stringify(obj || {}));
  }

  function loadOverrides() {
    try {
      const o = JSON.parse(localStorage.getItem(OVERRIDE_KEY) || "{}") || {};
      return o && typeof o === "object" ? o : {};
    } catch {
      return {};
    }
  }

  function saveOverrides(obj) {
    localStorage.setItem(OVERRIDE_KEY, JSON.stringify(obj || {}));
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

  function syncLinkFor(cfg, pathname) {
    const code = encodeSyncCode(cfg);
    const base = `${location.origin}${pathname || location.pathname}`;
    return `${base}?sync=${encodeURIComponent(code)}`;
  }

  function envelope(checks, overrides, syllabusChecks, updatedAt) {
    return {
      v: 3,
      updatedAt: updatedAt || Date.now(),
      checks: checks || {},
      weekOverrides: overrides || {},
      syllabusChecks: syllabusChecks || {},
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
      const msg = (json && (json.message || json.error)) || `GitHub API ${res.status}`;
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
      weekOverrides:
        payload.weekOverrides && typeof payload.weekOverrides === "object"
          ? payload.weekOverrides
          : {},
      syllabusChecks:
        payload.syllabusChecks && typeof payload.syllabusChecks === "object"
          ? payload.syllabusChecks
          : {},
    };
  }

  async function pullRemote() {
    const cfg = loadSyncCfg();
    if (!cfg) return { changed: false };
    const gist = await gistRequest("GET", `/gists/${cfg.gistId}`, cfg.token);
    const remote = parseGistPayload(gist);
    const localAt = localUpdatedAt();
    if (remote.updatedAt > localAt) {
      savePlanChecks(remote.checks);
      saveOverrides(remote.weekOverrides);
      saveSyllabusChecks(remote.syllabusChecks);
      saveSyncMeta({ updatedAt: remote.updatedAt, lastPull: Date.now() });
      if (typeof onRemoteApplied === "function") onRemoteApplied(remote);
      return { changed: true, remote };
    }
    saveSyncMeta({ ...loadSyncMeta(), lastPull: Date.now() });
    return { changed: false, remote };
  }

  async function pushRemote() {
    const cfg = loadSyncCfg();
    if (!cfg) return;
    const updatedAt = localUpdatedAt() || Date.now();
    const content = JSON.stringify(
      envelope(loadPlanChecks(), loadOverrides(), loadSyllabusChecks(), updatedAt),
      null,
      2
    );
    await gistRequest("PATCH", `/gists/${cfg.gistId}`, cfg.token, {
      files: { [GIST_FILE]: { content } },
    });
    saveSyncMeta({ ...loadSyncMeta(), updatedAt, lastPush: Date.now() });
  }

  function schedulePush(onError) {
    if (!loadSyncCfg()) return;
    clearTimeout(pushTimer);
    pushTimer = setTimeout(() => {
      pushRemote().catch((err) => {
        if (typeof onError === "function") onError(err);
      });
    }, 800);
  }

  async function createSync(token) {
    const updatedAt = Date.now();
    const content = JSON.stringify(
      envelope(loadPlanChecks(), loadOverrides(), loadSyllabusChecks(), updatedAt),
      null,
      2
    );
    const gist = await gistRequest("POST", "/gists", token, {
      description: "ptpt study plan checklist + edits + syllabus sync",
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
    const hasLocal =
      Object.keys(loadPlanChecks()).length > 0 ||
      Object.keys(loadOverrides()).length > 0 ||
      Object.keys(loadSyllabusChecks()).length > 0;
    if (!remote.changed && hasLocal) {
      touchLocal();
      await pushRemote();
    }
    return remote;
  }

  window.PtptSync = {
    SYLLABUS_STORAGE_KEY,
    PLAN_CHECKS_KEY,
    OVERRIDE_KEY,
    SYNC_CFG_KEY,
    SYNC_META_KEY,
    GIST_FILE,
    SYNC_PREFIX,
    loadSyllabusChecks,
    saveSyllabusChecks,
    setSyllabusCheck,
    loadPlanChecks,
    savePlanChecks,
    loadOverrides,
    saveOverrides,
    loadSyncCfg,
    saveSyncCfg,
    loadSyncMeta,
    saveSyncMeta,
    localUpdatedAt,
    touchLocal,
    encodeSyncCode,
    decodeSyncCode,
    syncLinkFor,
    envelope,
    gistRequest,
    parseGistPayload,
    pullRemote,
    pushRemote,
    schedulePush,
    createSync,
    connectSync,
    set onRemoteApplied(fn) {
      onRemoteApplied = fn;
    },
    get onRemoteApplied() {
      return onRemoteApplied;
    },
  };
})();
