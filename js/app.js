// =============================================================
// ClearVoice — Application Logic
// State management, event handlers, settings, and orchestration
// Dependencies: config.js → api.js → ui.js → app.js (load order)
// =============================================================

// ── Application State ───────────────────────────────────────

const AppState = {
  provider : 'claude',
  apiKey   : '',
  model    : 'claude-sonnet-4-5-20250929',
  persona  : 'ic',
  audience : 'peers',
  goal     : 'inform',
  type     : 'email',
  vibe     : 30,
  heatOn   : false,
  curVar   : 0,
  result   : null,
  busy     : false,
};

function hasPersonalKey() { try { return !!JSON.parse(localStorage.getItem('cv_cfg') || '{}').apiKey; } catch(_){ return false; } }

// ── Initialisation ───────────────────────────────────────────

(function init() {
  // 1. Apply GitHub Actions-injected config (from config.js)
  if (window.CV_CONFIG) {
    if (CV_CONFIG.apiKey)   AppState.apiKey   = CV_CONFIG.apiKey;
    if (CV_CONFIG.provider) AppState.provider = CV_CONFIG.provider;
    if (CV_CONFIG.model)    AppState.model    = CV_CONFIG.model;
  }

  // 2. Layer on localStorage preferences (user's own key always wins)
  try {
    const saved = JSON.parse(localStorage.getItem('cv_cfg') || '{}');
    if (saved.apiKey)   AppState.apiKey   = saved.apiKey;
    if (saved.provider) AppState.provider = saved.provider;
    if (saved.model)    AppState.model    = saved.model;
  } catch (_) {}

  // 3. Restore theme preference
  const savedTheme = localStorage.getItem('cv_theme') || 'light';
  if (savedTheme === 'dark') document.body.classList.add('dark');
  refreshThemeBtn();

  // 4. Sync UI — no modal on load; visitors start writing immediately
  refreshApiUI();
  syncVibe(AppState.vibe);
})();

// ── Theme Toggle ─────────────────────────────────────────────

function toggleTheme() {
  const dark = document.body.classList.toggle('dark');
  localStorage.setItem('cv_theme', dark ? 'dark' : 'light');
  refreshThemeBtn();
}

function refreshThemeBtn() {
  const btn = document.getElementById('themeBtn');
  if (!btn) return;
  const dark    = document.body.classList.contains('dark');
  btn.textContent = dark ? '☀' : '🌙';
  btn.title       = dark ? 'Switch to Light Mode' : 'Switch to Dark Mode';
}

// ── Settings Modal ───────────────────────────────────────────

function openSettings() {
  document.getElementById('settingsModalTitle').textContent = '⚙ API Configuration';
  document.getElementById('settingsModalSub').textContent   =
    'Your key is saved in your browser only and is sent directly to the AI provider — never to any third-party server.';
  document.getElementById('settingsOverlay').classList.add('on');
  document.getElementById('keyInp').value   = AppState.apiKey;
  document.getElementById('modelSel').value = AppState.model;
  pickProvider(AppState.provider);
}

function closeSettings() {
  document.getElementById('settingsOverlay').classList.remove('on');
}

function pickProvider(p) {
  AppState.provider = p;
  document.getElementById('btnClaude').classList.toggle('active', p === 'claude');
  document.getElementById('btnOpenAI').classList.toggle('active', p === 'openai');

  const sel  = document.getElementById('modelSel');
  const hint = document.getElementById('keyHint');
  const inp  = document.getElementById('keyInp');

  if (p === 'claude') {
    sel.innerHTML = `
      <option value="claude-sonnet-4-5-20250929">Claude Sonnet 4.5 — Recommended</option>
      <option value="claude-opus-4-5-20251101">Claude Opus 4.5 — Most Capable</option>
      <option value="claude-haiku-4-5-20251001">Claude Haiku 4.5 — Fastest</option>`;
    hint.innerHTML  = 'Get your key at <a href="https://console.anthropic.com" target="_blank" rel="noopener">console.anthropic.com</a>';
    inp.placeholder = 'sk-ant-api03-…';
  } else {
    sel.innerHTML = `
      <option value="gpt-4o">GPT-4o — Recommended</option>
      <option value="gpt-4-turbo">GPT-4 Turbo</option>
      <option value="gpt-3.5-turbo">GPT-3.5 Turbo — Fastest</option>`;
    hint.innerHTML  = 'Get your key at <a href="https://platform.openai.com" target="_blank" rel="noopener">platform.openai.com</a>';
    inp.placeholder = 'sk-…';
  }

  // Keep model selector in sync when switching provider
  if (sel.value !== AppState.model) sel.value = sel.options[0].value;
}

function saveSettings() {
  const key = document.getElementById('keyInp').value.trim();
  if (!key) { toast('Please enter an API key', 'err'); return; }

  AppState.apiKey = key;
  AppState.model  = document.getElementById('modelSel').value;

  localStorage.setItem('cv_cfg', JSON.stringify({
    apiKey  : AppState.apiKey,
    provider: AppState.provider,
    model   : AppState.model,
  }));

  refreshApiUI();
  closeSettings();
  toast('Settings saved — using your own API key!', 'ok');
}

function refreshApiUI() {
  const dot    = document.getElementById('apiDot');
  const label  = document.getElementById('apiLabel');
  const mbDot  = document.getElementById('mbDot');
  const mbText = document.getElementById('mbText');

  const SHORT = {
    'claude-sonnet-4-5-20250929': 'Sonnet 4.5',
    'claude-opus-4-5-20251101'  : 'Opus 4.5',
    'claude-haiku-4-5-20251001' : 'Haiku 4.5',
    'gpt-4o'                    : 'GPT-4o',
    'gpt-4-turbo'               : 'GPT-4 Turbo',
    'gpt-3.5-turbo'             : 'GPT-3.5',
  };

  const modelName = SHORT[AppState.model] || AppState.model;
  const provName  = AppState.provider === 'claude' ? 'Claude' : 'OpenAI';

  if (AppState.apiKey) {
    dot.classList.add('live');
    label.textContent       = `${provName} · ${modelName}`;
    mbDot.style.background  = 'var(--green)';
    mbText.textContent      = modelName;
  } else {
    dot.classList.remove('live');
    label.textContent       = 'Not configured — click to set up';
    mbDot.style.background  = 'var(--text-3)';
    mbText.textContent      = '';
  }
}

// ── Style Matrix Controls ────────────────────────────────────

function pickPill(btn, groupId) {
  document.querySelectorAll(`#${groupId} .pill-btn`).forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  if (groupId === 'goalGroup') AppState.goal = btn.dataset.v;
  else                         AppState.type = btn.dataset.v;
}

function onVibe(inp) {
  AppState.vibe = +inp.value;
  syncVibe(AppState.vibe);
}

function syncVibe(v) {
  const slider = document.getElementById('vibeSlider');
  if (slider) slider.style.setProperty('--v', v + '%');
  document.getElementById('vibeL').classList.toggle('vibe-end-active', v <= 50);
  document.getElementById('vibeR').classList.toggle('vibe-end-active', v > 50);
}

function onDraftInput() {
  const txt   = document.getElementById('draftArea').value.trim();
  const words = txt ? txt.split(/\s+/).length : 0;
  document.getElementById('wcBadge').textContent = `${words} word${words !== 1 ? 's' : ''}`;
  document.getElementById('dotIn').classList.toggle('on', words > 0);
}

// ── Heatmap ──────────────────────────────────────────────────

function toggleHeat() {
  if (!AppState.result?.toneAnalysis?.length) return;
  AppState.heatOn = !AppState.heatOn;

  const ta     = document.getElementById('draftArea');
  const layer  = document.getElementById('heatLayer');
  const btn    = document.getElementById('heatBtn');
  const legend = document.getElementById('heatLegend');

  if (AppState.heatOn) {
    layer.innerHTML = buildHeatmap(
      document.getElementById('draftArea').value,
      AppState.result.toneAnalysis
    );
    ta.style.display   = 'none';
    layer.style.display = 'block';
    layer.classList.add('on');
    btn.classList.add('active');
    legend.classList.add('on');
  } else {
    ta.style.display    = '';
    layer.style.display = 'none';
    layer.classList.remove('on');
    btn.classList.remove('active');
    legend.classList.remove('on');
  }
}

// ── Analysis Orchestration ───────────────────────────────────

// ── PII Toggle ───────────────────────────────────────────────
function onPiiToggle() {
  const badge = document.getElementById('piiBadge');
  if (!badge) return;
  if (document.getElementById('piiToggle').checked) {
    badge.style.display = 'inline';
    badge.textContent   = 'PII will be redacted';
  } else {
    badge.style.display = 'none';
  }
}

async function runAnalysis() {
  if (AppState.busy) return;

  const rawText = document.getElementById('draftArea').value.trim();
  if (!rawText) { toast('Please paste some text first', 'err'); return; }

  // No key at all — guide user to Settings (prompt every time)
  if (!AppState.apiKey) {
    toast('Add your API key in ⚙ Settings to get started', 'err');
    openSettings();
    return;
  }

  // ── PII Redaction ──────────────────────────────────────────
  let text = rawText;
  if (document.getElementById('piiToggle')?.checked) {
    const { redacted, found } = PrivacyGuard.redact(rawText);
    text = redacted;
    if (PrivacyGuard.hasPII(found)) {
      const summary = PrivacyGuard.summarise(found);
      const badge   = document.getElementById('piiBadge');
      if (badge) { badge.style.display = 'inline'; badge.textContent = `Redacted: ${summary}`; }
      toast(`PII redacted — ${summary}`, 'ok');
    }
  }

  AppState.busy = true;
  setLoading(true);

  try {
    // Snapshot current style matrix state for the API call
    const stateSnap = {
      ...AppState,
      persona : document.getElementById('selPersona').value,
      audience: document.getElementById('selAudience').value,
    };

    const raw = AppState.provider === 'claude'
      ? await callClaude(text, stateSnap, AppState.apiKey)
      : await callOpenAI(text, stateSnap, AppState.apiKey);

    AppState.result = parseAIResponse(raw);
    renderResults(AppState.result);
    switchVar(document.querySelector('.var-tab[data-i="0"]'), 0);

    // Auto-enable Tone Map after each analysis
    if (AppState.result?.toneAnalysis?.length) {
      AppState.heatOn = false;   // reset so toggleHeat() switches it ON cleanly
      toggleHeat();
    }

    toast('Analysis complete!', 'ok');

  } catch (e) {
    console.error('[ClearVoice] Analysis error:', e);
    toast(`Error: ${e.message}`, 'err');
  } finally {
    AppState.busy = false;
    setLoading(false);
  }
}

// ── Coaching Insight Accept / Decline ───────────────────────

/**
 * Replaces the original phrase with the improved version in the draft.
 * Called by the "Apply" button rendered in each insight card.
 */
function acceptInsight(btn) {
  const original = btn.dataset.original;
  const improved = btn.dataset.improved;
  if (!original || !improved) return;

  const ta = document.getElementById('draftArea');
  if (!ta.value.includes(original)) {
    toast('Phrase not found in current draft (may have already been changed)', 'err');
    return;
  }

  ta.value = ta.value.replace(original, improved);
  onDraftInput();
  if (AppState.heatOn) toggleHeat();   // Rebuild heatmap with new text

  // Mark the card as accepted
  const card = btn.closest('.insight');
  if (card) card.classList.add('insight-accepted');
  btn.disabled    = true;
  btn.textContent = '✓ Applied';

  const snippet = improved.length > 45 ? improved.slice(0, 45) + '…' : improved;
  toast(`Applied: "${snippet}"`, 'ok');
}

/**
 * Animates and removes a dismissed insight card.
 */
function declineInsight(btn) {
  const card = btn.closest('.insight');
  if (!card) return;
  card.style.transition = 'opacity .25s ease, transform .25s ease, max-height .3s ease';
  card.style.maxHeight  = card.offsetHeight + 'px';
  card.style.overflow   = 'hidden';
  requestAnimationFrame(() => {
    card.style.opacity   = '0';
    card.style.transform = 'translateX(-8px)';
    card.style.maxHeight = '0';
    card.style.margin    = '0';
    card.style.padding   = '0';
  });
  setTimeout(() => card.remove(), 320);
}

// ── Variation Controls ───────────────────────────────────────

function switchVar(btn, i) {
  if (!btn) return;
  document.querySelectorAll('.var-tab').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  document.querySelectorAll('.var-card').forEach(c => c.classList.remove('show'));
  const card = document.getElementById(`vc${i}`);
  if (card) card.classList.add('show');
  AppState.curVar = i;
}

function copyVar() {
  const el = document.getElementById(`vt${AppState.curVar}`);
  if (!el?.textContent.trim()) { toast('Nothing to copy yet', 'err'); return; }
  navigator.clipboard.writeText(el.textContent)
    .then(() => toast('Copied to clipboard!', 'ok'))
    .catch(() => toast('Copy failed — try Ctrl+A, Ctrl+C manually', 'err'));
}

function acceptVar() {
  const el = document.getElementById(`vt${AppState.curVar}`);
  if (!el?.textContent.trim()) return;
  document.getElementById('draftArea').value = el.textContent;
  onDraftInput();
  if (AppState.heatOn) toggleHeat();   // Reset heatmap for the new text
  toast('Version accepted — refine further or run another analysis!', 'ok');
}

function exportInsights() {
  if (!AppState.result) { toast('Nothing to export yet', 'err'); return; }

  const r  = AppState.result;
  const sc = r.overallScore || {};

  let out = `CLEARVOICE ANALYSIS REPORT\n${'═'.repeat(52)}\nGenerated: ${new Date().toLocaleString()}\n\n`;

  out += `WRITING SCORES\n${'─'.repeat(30)}\n`;
  ['clarity', 'confidence', 'professionalism', 'impact'].forEach(k =>
    out += `  ${k.charAt(0).toUpperCase() + k.slice(1)}: ${sc[k] || 0}/100\n`);

  out += `\nCOACHING INSIGHTS\n${'─'.repeat(30)}\n`;
  (r.coaching || []).forEach((c, i) => {
    out += `\n${i + 1}. [${(c.category || 'GENERAL').toUpperCase()}]\n`;
    if (c.original) out += `   Before: "${c.original}"\n`;
    if (c.improved) out += `   After : "${c.improved}"\n`;
    out += `   Why   : ${c.reason}\n`;
  });

  out += `\n\nVARIATIONS\n${'─'.repeat(30)}\n`;
  (r.variations || []).forEach(v =>
    out += `\n【${v.name}】— ${v.tagline}\n${'─'.repeat(44)}\n${v.text}\n`);

  const blob = new Blob([out], { type: 'text/plain;charset=utf-8' });
  const url  = URL.createObjectURL(blob);
  Object.assign(document.createElement('a'), {
    href    : url,
    download: `clearvoice-insights-${Date.now()}.txt`,
  }).click();
  URL.revokeObjectURL(url);
  toast('Insights exported!', 'ok');
}

// ── Why Panel ────────────────────────────────────────────────

function toggleWhy() {
  document.getElementById('whyPanel').classList.toggle('open');
}

// ── Reset ────────────────────────────────────────────────────

function resetAll() {
  document.getElementById('draftArea').value = '';
  AppState.result = null;
  AppState.heatOn = false;
  AppState.curVar = 0;
  resetOutputUI();
  switchVar(document.querySelector('.var-tab[data-i="0"]'), 0);
}

// ── Keyboard Shortcuts ───────────────────────────────────────

document.addEventListener('keydown', e => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
    e.preventDefault();
    runAnalysis();
  }
  if (e.key === 'Escape') {
    closeSettings();
  }
});
