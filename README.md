# ✦ ClearVoice — AI Communication Coach

**A zero-backend AI writing coach** that rewrites your professional content across three styles, provides tone heatmaps, and explains every change with coaching insights.

**Live demo:** `https://sushegaad.github.io/Professional-Writing-Wizard/`
**Architecture:** [View system design →](architecture.html)

---

## Features

- **Style Matrix** — Configure Persona, Audience, Goal, Content Type, and a Succinct ↔ Narrative vibe slider before every analysis
- **Three Variations** — The Negotiator (empathetic), The Visionary (bold), The Minimalist (direct)
- **Tone Heatmap** — Colour-coded overlay on your original text flagging aggressive, passive, waffle, jargon, vague, and strong phrases with hover tooltips
- **Coaching Panel** — Animated score rings (Clarity, Confidence, Professionalism, Impact) plus before/after insight cards explaining every change
- **Dual Provider** — Works with both Claude (Anthropic) and GPT-4 (OpenAI)
- **Light / Dark Mode** — Light theme by default with a toggle; preference saved locally
- **Accept / Copy / Export** — Accept a variation back into the editor, copy to clipboard, or export a full text report

---

## Quick Start (No Build Required)

```bash
git clone https://github.com/Sushegaad/Professional-Writing-Wizard.git
cd Professional-Writing-Wizard
```

Open `index.html` in your browser — or push to GitHub and enable Pages (see below).
When the app loads, click **⚙ Settings** to enter your API key.

---

## Deploying to GitHub Pages

### Option A — Manual API Key (Recommended for most users)

1. Go to your repo → **Settings → Pages**
2. Source: **Deploy from a branch** → `main` → `/ (root)` → **Save**
3. Visit `https://sushegaad.github.io/Professional-Writing-Wizard/`
4. Click **⚙ Settings** in the app and enter your API key. It is stored only in your browser's `localStorage`.

---

### Option B — Inject API Key via GitHub Actions *(Personal/Private use)*

This method bakes your key into the deployed JavaScript at build time. The key will **not** appear in your Git history, but **it is visible in the deployed page source**. Use only for personal projects.

**Step 1 — Enable GitHub Actions Pages deployment**

Go to repo → **Settings → Pages** → Source: **GitHub Actions**

**Step 2 — Add your API key as a Secret**

1. Go to **Settings → Secrets and variables → Actions**
2. Click **New repository secret**
3. Name: `CLEARVOICE_API_KEY` · Value: your Anthropic API key (`sk-ant-api03-…`)

**Step 3 — Optional: customise provider / model**

Go to **Settings → Secrets and variables → Actions → Variables tab**:

| Variable name         | Default                         | Options                                                        |
|-----------------------|---------------------------------|----------------------------------------------------------------|
| `CLEARVOICE_PROVIDER` | `claude`                        | `claude` · `openai`                                            |
| `CLEARVOICE_MODEL`    | `claude-sonnet-4-5-20250929`    | `claude-opus-4-5-20251101` · `claude-haiku-4-5-20251001` · `gpt-4o` · `gpt-4-turbo` |

**Step 4 — Trigger deployment**

```bash
git add .
git commit -m "Deploy ClearVoice"
git push origin main
```

Check progress under your repo's **Actions** tab.

---

## Getting an API Key

| Provider  | Where to get it              | Pricing       |
|-----------|------------------------------|---------------|
| Anthropic | https://console.anthropic.com | Pay-per-token |
| OpenAI    | https://platform.openai.com   | Pay-per-token |

Both offer free trial credits. **Claude Sonnet 4.5** is recommended for the best quality/cost balance.

---

## File Structure

```
Professional-Writing-Wizard/
├── index.html              ← App shell (all HTML markup)
├── architecture.html       ← Visual system design documentation
├── README.md               ← This file
│
├── css/
│   └── styles.css          ← All styles; light default, body.dark for dark mode
│
├── js/
│   ├── config.js           ← window.CV_CONFIG placeholder (replaced by CI)
│   ├── api.js              ← Prompt builder, callClaude(), callOpenAI()
│   ├── ui.js               ← renderResults(), scores, heatmap, toasts
│   └── app.js              ← AppState, init, theme, settings, runAnalysis()
│
└── .github/workflows/
    └── deploy.yml          ← Injects secret → deploys to GitHub Pages
```

Script load order (defined in `index.html`): `config.js → api.js → ui.js → app.js`

---

## Theming

The site defaults to **Light Mode**. Click 🌙 in the header to switch to Dark Mode. Preference is saved in `localStorage`.

All colours reference CSS custom properties. `:root { ... }` defines the light palette; `body.dark { ... }` overrides every token — zero hard-coded colours in component styles.

---

## Keyboard Shortcuts

| Shortcut         | Action         |
|------------------|----------------|
| `Ctrl / ⌘ + Enter` | Run analysis  |
| `Escape`           | Close Settings |

---

## Architecture

See **[architecture.html](architecture.html)** for a visual deep-dive including:

- System layer diagram (UI → Logic → AI Provider)
- File responsibility breakdown
- End-to-end data flow (6 annotated steps)
- JS module API reference
- GitHub Actions CI/CD pipeline visualization
- Security model and API key handling

---

## Security Notes

- **Manual mode**: Your API key lives only in `localStorage`. It is sent only to your chosen AI provider — never to any third party.
- **GitHub Actions mode**: The key is injected into the deployed JS artifact. It is not in Git history but is readable in page source. Suitable for personal use only.
- **No telemetry**: No backend, no tracking, no analytics.
- **Production recommendation**: For shared/team deployments, front the API with a server-side proxy (Cloudflare Workers, Netlify Functions, Vercel Edge, etc.).

---

## Customisation

**Change the default model** — update the `selected` attribute in `<select id="modelSel">` in `index.html`.

**Change the default vibe** — set `vibe: 30` in `AppState` in `js/app.js` and `value="30"` on `<input id="vibeSlider">` in `index.html`.

**Add a new content type** — add a button to `#typeGroup` in `index.html` and a template string to the `types` object in `buildSystemPrompt()` in `js/api.js`.

---

## License

MIT — free to use, modify, and deploy.

---

*Built with Claude Sonnet 4.5 · Powered by the Anthropic API*
