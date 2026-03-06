# ✦ ClearVoice — AI Professional Writing Coach

**A zero-backend AI writing coach** that rewrites your professional content across three styles, surfaces tone issues with a live heatmap, and coaches you with actionable before/after insights — all running directly in the browser.

**Live demo:** https://sushegaad.github.io/Professional-Writing-Wizard/

---

![ClearVoice Coaching Insights](ClearVoice%20Coaching%20Insights.png)

---

## Features

### Writing Intelligence
- **Style Matrix** — Configure Persona, Audience, Goal, Content Type, and a Succinct ↔ Narrative vibe slider before every analysis
- **Three Variations** — The Negotiator (persuasive & empathetic), The Visionary (bold & inspiring), The Minimalist (direct & efficient)
- **Tone Heatmap** — Colour-coded overlay on your original draft flagging aggressive, too-passive, waffle/hedge, jargon, vague, and strong phrases with hover tooltips. Enabled automatically after every analysis
- **Coaching Insights** — Animated score rings (Clarity, Confidence, Professionalism, Impact) plus before/after insight cards. Accept a suggestion to apply it directly into your draft, or dismiss it with one click

### Privacy & Safety
- **PII Redaction** — Optional "Redact PII before sending" checkbox powered by a custom Semantic Privacy Guard engine. Strips emails, phone numbers, SSNs, credit cards, IBANs, IP addresses, passport numbers, medical record IDs, and more before the text leaves the browser

### Layout & UX
- **Split Workspace** — Input (Your Draft) pane stacked above the output area. Drag the horizontal divider to adjust the top/bottom split; double-click to reset to 50/50
- **Side-by-Side Output** — Enhanced Writing and Coaching Insights panes sit horizontally within the output area. Drag the vertical divider to adjust their relative widths; double-click to reset
- **Collapsible Coaching Panel** — Click ◀ in the Coaching Insights header to collapse it and give more room to the Enhanced Writing pane; click ▶ to expand again
- **Mobile Responsive** — On tablets the output area stacks vertically; on phones the layout fully reorganises with horizontally-scrollable controls, compact touch targets, and collapsible panels
- **Scrollbars** — Styled 8px scrollbars with rounded thumbs throughout; Firefox `scrollbar-width: thin` support
- **Light / Dark Mode** — Light theme by default with a one-click toggle; preference persists in `localStorage`

### Provider & Key Management
- **Dual Provider** — Works with Claude (Anthropic) and GPT-4 (OpenAI); select inside ⚙ Settings
- **Shared Key Gating** — When deployed with a GitHub Actions-injected key, a non-invasive usage counter (✦ N/50 uses) appears in the header. After 50 runs on the shared key, users are prompted to bring their own key. Counter turns amber as the limit approaches
- **Accept / Copy / Export** — Accept a variation back into the editor, copy to clipboard, or export a full coaching report as a text file

### Tests
A browser-based unit test suite lives in `tests/`. Open `tests/index.html` in any browser to run all tests — no build step required.

---

## Quick Start (No Build Required)

```bash
git clone https://github.com/Sushegaad/Professional-Writing-Wizard.git
cd Professional-Writing-Wizard
```

Open `index.html` in your browser — or push to GitHub and enable Pages (see below).
When the app loads, click **⚙ Settings** to enter your API key. It is stored only in `localStorage`.

---

## Deploying to GitHub Pages

### Option A — Manual API Key (Recommended for most users)

1. Go to your repo → **Settings → Pages**
2. Source: **Deploy from a branch** → `main` → `/ (root)` → **Save**
3. Visit `https://sushegaad.github.io/Professional-Writing-Wizard/`
4. Click **⚙** in the app header and enter your API key

---

### Option B — Inject API Key via GitHub Actions *(Personal/Private use)*

This method bakes your key into the deployed JavaScript at build time. The key will **not** appear in your Git history, but **it is visible in the deployed page source**. Use only for personal projects.

**Step 1 — Enable GitHub Actions Pages deployment**

Go to repo → **Settings → Pages** → Source: **GitHub Actions**

**Step 2 — Add your API key as a Repository Secret**

1. Go to **Settings → Secrets and variables → Repository secrets**
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

## File Structure

```
Professional-Writing-Wizard/
├── index.html                    # Main application shell
├── css/
│   └── styles.css                # Full stylesheet (light + dark, responsive)
├── js/
│   ├── config.js                 # Injected API config (overwritten at CI build time)
│   ├── privacy.js                # PII redaction engine (Semantic Privacy Guard port)
│   ├── api.js                    # AI provider calls (Claude + OpenAI), prompt builder
│   ├── ui.js                     # Render functions (variations, heatmap, score rings, insights)
│   └── app.js                    # State, event handlers, settings, usage gating
├── tests/
│   ├── index.html                # Browser test runner (auto-runs on load)
│   ├── test-privacy.js           # 19 PII redaction unit tests
│   └── test-core.js              # Core function tests (parseAIResponse, buildHeatmap, xEsc)
├── architecture.html             # Interactive system design diagram
├── .github/
│   ├── workflows/deploy.yml      # GitHub Actions Pages deployment
│   └── scripts/inject_config.py  # Safely injects API key into config.js at build time
└── README.md
```

---

## Architecture

See **[architecture.html](https://sushegaad.github.io/Professional-Writing-Wizard/architecture.html)** for a visual deep-dive including:

- System layer diagram (UI → Logic → AI Provider)
- File responsibility breakdown
- End-to-end data flow (6 annotated steps)
- JS module API reference
- GitHub Actions CI/CD pipeline visualisation
- Security model and API key handling

---

## Security Notes

- **Manual mode**: Your API key lives only in `localStorage`. It is sent only to your chosen AI provider — never to any third party.
- **GitHub Actions mode**: The key is injected into the deployed JS artifact. It is not in Git history but is readable in page source. Suitable for personal use only.
- **PII redaction**: When the redaction checkbox is enabled, sensitive entities are replaced with `[REDACTED_TYPE]` tokens client-side before the API call. The original text is restored locally after the response.
- **No telemetry**: No backend, no tracking, no analytics.
- **Production recommendation**: For shared/team deployments, front the API with a server-side proxy (Cloudflare Workers, Netlify Functions, Vercel Edge, etc.).

---

## License

MIT — free to use, modify, and deploy.

---
**Built by Hemant Naik · Powered by Claude Sonnet 4.5**
