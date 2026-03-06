// =============================================================
// ClearVoice — UI Rendering Layer
// Pure DOM manipulation: results, scores, coaching, heatmap, toasts
// =============================================================

/** HTML-escapes a string for safe DOM insertion. */
function xEsc(text) {
  return (text || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ── Toast Notifications ─────────────────────────────────────

/**
 * Shows a self-dismissing toast notification.
 * @param {string} msg  - Message text
 * @param {'ok'|'err'} type - Visual type
 */
function toast(msg, type = 'ok') {
  const zone = document.getElementById('toastZone');
  const el   = document.createElement('div');
  el.className   = `toast toast-${type}`;
  el.textContent = msg;
  zone.appendChild(el);
  setTimeout(() => {
    el.style.transition = 'opacity .3s, transform .3s';
    el.style.opacity    = '0';
    el.style.transform  = 'translateX(20px)';
    setTimeout(() => el.remove(), 320);
  }, 3200);
}

// ── Loading State ───────────────────────────────────────────

const LOADING_MESSAGES = [
  'Analyzing your writing…',
  'Detecting tone patterns…',
  'Crafting 3 variations…',
  'Generating coaching insights…',
  'Almost there…',
];

/**
 * Toggles the loading overlay and analyze button state.
 * @param {boolean} on
 */
function setLoading(on) {
  document.getElementById('loadMask').classList.toggle('on', on);
  const btn      = document.getElementById('analyzeBtn');
  btn.disabled   = on;
  btn.innerHTML  = on ? '⏳ Analyzing…' : '✦ Analyze &amp; Enhance';

  if (on) {
    let i = 0;
    window._cvLoadTimer = setInterval(() => {
      i = (i + 1) % LOADING_MESSAGES.length;
      const el = document.getElementById('loadMsg');
      if (el) el.textContent = LOADING_MESSAGES[i];
    }, 2400);
  } else {
    clearInterval(window._cvLoadTimer);
  }
}

// ── Main Results Renderer ───────────────────────────────────

/**
 * Renders the full analysis result into the output pane.
 * @param {object} result - Parsed AI response object
 */
function renderResults(result) {
  // Populate variation texts
  (result.variations || []).forEach((v, i) => {
    const el = document.getElementById(`vt${i}`);
    if (el) el.textContent = v.text || '';
  });

  // Show output UI
  document.getElementById('emptyState').style.display = 'none';
  document.getElementById('outScroll').style.display  = 'block';
  document.getElementById('outFoot').style.display    = 'flex';
  document.getElementById('dotOut').classList.add('on');

  // Show heatmap toggle if tone data exists
  if ((result.toneAnalysis || []).length > 0) {
    document.getElementById('heatBtn').classList.add('show');
  }

  renderScores(result.overallScore || {});
  renderInsights(result.coaching   || []);

  // Auto-open coaching panel
  document.getElementById('whyPanel').classList.add('open');
}

// ── Score Rings ─────────────────────────────────────────────

const SCORE_DEFS = [
  { key: 'clarity',         label: 'Clarity',       varCol: 'var(--accent)' },
  { key: 'confidence',      label: 'Confidence',    varCol: 'var(--green)'  },
  { key: 'professionalism', label: 'Professional',  varCol: 'var(--yellow)' },
  { key: 'impact',          label: 'Impact',        varCol: 'var(--red)'    },
];
const CIRCUMFERENCE = 2 * Math.PI * 20; // r = 20

/**
 * Renders animated circular score rings and score preview strip.
 * @param {object} scores - { clarity, confidence, professionalism, impact }
 */
function renderScores(scores) {
  document.getElementById('scoresRow').innerHTML = SCORE_DEFS.map(d => {
    const val    = scores[d.key] || 0;
    const offset = CIRCUMFERENCE * (1 - val / 100);
    return `
      <div class="score-card">
        <div class="score-ring">
          <svg width="48" height="48" viewBox="0 0 48 48">
            <circle class="score-ring-track" cx="24" cy="24" r="20"/>
            <circle class="score-ring-fill" cx="24" cy="24" r="20"
              stroke="${d.varCol}"
              style="stroke-dashoffset:${CIRCUMFERENCE};"
              data-final="${offset}"/>
          </svg>
          <div class="score-num" style="color:${d.varCol};">${val}</div>
        </div>
        <div class="score-lbl">${d.label}</div>
      </div>`;
  }).join('');

  // Trigger CSS transition after paint
  requestAnimationFrame(() => requestAnimationFrame(() => {
    document.querySelectorAll('.score-ring-fill').forEach(el => {
      el.style.strokeDashoffset = el.dataset.final;
    });
  }));

  // Score preview in why-panel header
  document.getElementById('scorePreview').innerHTML = SCORE_DEFS
    .map(d => `<span style="color:${d.varCol};font-weight:700">${d.label[0]}:${scores[d.key]||0}</span>`)
    .join(' ');
}

// ── Coaching Insights ───────────────────────────────────────

/**
 * Renders coaching insight cards with before/after diffs.
 * @param {Array} coaching - Array of coaching objects from AI response
 */
function renderInsights(coaching) {
  const badge = document.getElementById('whyBadge');
  badge.textContent = `${coaching.length} insight${coaching.length !== 1 ? 's' : ''}`;

  const list = document.getElementById('insightsList');
  if (!coaching.length) {
    list.innerHTML = `<div class="empty-insights">No specific insights for this text.</div>`;
    return;
  }

  list.innerHTML = coaching.map((c, idx) => {
    const cat       = c.category || 'clarity';
    const hasApply  = !!(c.original && c.improved);
    const origAttr  = hasApply ? ` data-original="${xEsc(c.original)}"` : '';
    const imprvAttr = hasApply ? ` data-improved="${xEsc(c.improved)}"` : '';
    return `
      <div class="insight" id="insight-${idx}">
        <span class="cat-badge cat-${cat}">${cat}</span>
        <div class="insight-body">
          <div class="insight-diff">
            ${c.original ? `<span class="diff-before">${xEsc(c.original)}</span>` : ''}
            ${c.original && c.improved ? `<span class="diff-arr">→</span>` : ''}
            ${c.improved ? `<span class="diff-after">${xEsc(c.improved)}</span>` : ''}
          </div>
          <div class="insight-reason">${xEsc(c.reason || '')}</div>
          <div class="insight-actions">
            ${hasApply ? `<button class="ins-btn ins-accept" onclick="acceptInsight(this)"${origAttr}${imprvAttr}>✓ Apply</button>` : ''}
            <button class="ins-btn ins-decline" onclick="declineInsight(this)">✗ Dismiss</button>
          </div>
        </div>
      </div>`;
  }).join('');
}

// ── Tone Heatmap ────────────────────────────────────────────

/**
 * Builds the heatmap HTML from original text and tone analysis data.
 * Matches phrases case-sensitively and wraps them in coloured spans.
 * @param {string} text        - Original draft text
 * @param {Array}  toneAnalysis - Array of tone analysis items
 * @returns {string} HTML string with annotated phrases
 */
function buildHeatmap(text, toneAnalysis) {
  // Sort longest phrases first to prevent nested replacements
  const items = (toneAnalysis || [])
    .filter(x => x.phrase && text.includes(x.phrase))
    .sort((a, b) => b.phrase.length - a.phrase.length);

  let html = xEsc(text);

  for (const item of items) {
    const ep  = xEsc(item.phrase);
    const tip = xEsc(item.issue || '');
    const cls = `ht ht-${item.type || 'vague'}`;
    // Replace only the first occurrence to avoid double-wrapping
    html = html.replace(ep,
      `<span class="${cls}">${ep}<span class="ht-tip">${tip}</span></span>`);
  }

  // Preserve line breaks
  return html.replace(/\n/g, '<br>');
}

// ── Reset UI ────────────────────────────────────────────────

/** Resets the entire output pane and coaching panel to initial state. */
function resetOutputUI() {
  document.getElementById('emptyState').style.display = 'flex';
  document.getElementById('outScroll').style.display  = 'none';
  document.getElementById('outFoot').style.display    = 'none';
  document.getElementById('heatBtn').classList.remove('show', 'active');
  document.getElementById('heatLegend').classList.remove('on');
  document.getElementById('heatLayer').classList.remove('on');
  document.getElementById('draftArea').style.display  = 'block';
  document.getElementById('dotIn').classList.remove('on');
  document.getElementById('dotOut').classList.remove('on');
  document.getElementById('whyPanel').classList.remove('open');
  document.getElementById('whyBadge').textContent     = '0 insights';
  document.getElementById('scorePreview').innerHTML   = '';
  document.getElementById('scoresRow').innerHTML      = '';
  document.getElementById('insightsList').innerHTML   =
    `<div class="empty-insights">Run an analysis to see coaching insights.</div>`;
  document.getElementById('wcBadge').textContent = '0 words';
}
