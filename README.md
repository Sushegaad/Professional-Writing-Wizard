# ✦ ClearVoice — AI Professional Writing Wizard

**A zero-backend AI writing coach** that rewrites your professional content across three styles, provides tone heatmaps, and explains every change with coaching insights.

**Live demo:** https://sushegaad.github.io/Professional-Writing-Wizard/

---

![ClearVoice Coaching Insights](ClearVoice%20Coaching%20Insights.png)

---

## Features

- **Style Matrix** — Configure Persona, Audience, Goal, Content Type, and a Succinct ↔ Narrative vibe slider before every analysis
- **Three Variations** — The Negotiator (empathetic), The Visionary (bold), The Minimalist (direct)
- **Tone Heatmap** — Colour-coded overlay on your original text flagging aggressive, passive, waffle, jargon, vague, and strong phrases with hover tooltips
- **Coaching Panel** — Animated score rings (Clarity, Confidence, Professionalism, Impact) plus before/after insight cards explaining every change
- **Dual Provider** — Works with both Claude (Anthropic) and GPT-4 (OpenAI)
- **Resizable Panes** — Drag the centre divider to adjust the editor/output split; double-click to reset to 50/50
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

## Architecture

See **[architecture.html](https://sushegaad.github.io/Professional-Writing-Wizard/architecture.html)** for a visual deep-dive including:

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

## License

MIT — free to use, modify, and deploy.

---

*Built with Claude Sonnet 4.5 · Powered by the Anthropic API*
