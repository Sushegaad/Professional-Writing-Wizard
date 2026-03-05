// =============================================================
// ClearVoice — Runtime Configuration
//
// This file is intentionally kept blank (no API key in source).
// GitHub Actions will generate a new version of this file at
// build time, injecting secrets from your repository settings.
//
// To configure via GitHub Secrets, see README.md → "Deployment".
// To configure manually, use the ⚙ Settings button in the app.
// =============================================================

window.CV_CONFIG = {
  apiKey  : '',          // Injected by GitHub Actions (CLEARVOICE_API_KEY secret)
  provider: 'claude',   // 'claude' | 'openai'
  model   : 'claude-sonnet-4-5-20250929',
};
