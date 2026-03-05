// =============================================================
// ClearVoice — API Layer
// Handles prompt engineering and communication with AI providers
// =============================================================

/**
 * Builds the structured system prompt based on current app state.
 * @param {object} state - Snapshot of AppState including persona, audience, etc.
 * @returns {string} System prompt string
 */
function buildSystemPrompt(state) {
  const personas = {
    executive  : 'C-Suite Executive (CEO / CFO / CTO)',
    senior     : 'Senior Manager or Team Lead',
    ic         : 'Individual Contributor / Professional',
    freelancer : 'Creative Freelancer or Consultant',
    student    : 'Student or Entry-Level Professional',
  };
  const audiences = {
    board   : 'Board of Directors / C-Suite',
    manager : 'Direct Manager or Senior Leadership',
    peers   : 'Colleagues and Teammates',
    reports : 'Direct Reports / Team Members',
    client  : 'External Client / Business Partner',
    cold    : 'Cold Lead / Unknown Stakeholder',
    public  : 'General Public / Social Media Audience',
  };
  const goals = {
    inform     : 'Inform and update — clear, factual, credible',
    request    : 'Make a request — polite but assertive, direct ask',
    deescalate : 'De-escalate tension — calm, empathetic, solution-focused',
    inspire    : 'Inspire and motivate — energizing, vision-forward',
  };
  const types = {
    email     : 'Professional Email — use BLUF (Bottom Line Up Front). Action-oriented subject line. Remove all hedge language. Close with a clear, bolded ask or deadline.',
    social    : 'Social Media Post — structure: Hook (counter-intuitive or data-driven) → Value (1-sentence paragraphs) → "I to You" shift → CTA that invites comments, not just a link.',
    exec      : 'Executive Summary — use the 3×3 Rule: 3 Key Takeaways, 3 Risks, 3 Next Steps. Open with a 2-sentence TL;DR. Extract and assign action items.',
    narrative : 'Business Narrative / Case Study — follow the Hero\'s Journey: Context (before) → Friction/Conflict (what went wrong, push for specifics) → Resolution → Quantitative + qualitative impact.',
    general   : 'General Professional Writing — prioritise clarity, confidence, and executive presence.',
  };
  const vibeDesc =
    state.vibe <= 15 ? 'extremely succinct — military-style brevity, cut every filler word' :
    state.vibe <= 35 ? 'concise and direct — every word must earn its place' :
    state.vibe <= 55 ? 'balanced — professional, readable, neither terse nor verbose' :
    state.vibe <= 75 ? 'detailed and explanatory — show reasoning and context' :
                       'rich and narrative — story-driven, emotionally resonant, persuasive';

  return `You are ClearVoice, an expert AI Communication Coach and professional writing consultant.

CONTEXT:
- Writer's Persona  : ${personas[state.persona]  || 'Professional'}
- Target Audience   : ${audiences[state.audience] || 'Colleagues'}
- Communication Goal: ${goals[state.goal]          || goals.inform}
- Content Type      : ${types[state.type]           || types.general}
- Tone / Vibe       : ${state.vibe}/100 — ${vibeDesc}

YOUR TASK:
Deeply analyse the submitted text, then return a single valid JSON object (no markdown fences, no explanatory text — pure JSON only).

EXACT REQUIRED JSON SCHEMA:
{
  "variations": [
    {
      "name": "The Negotiator",
      "tagline": "Persuasive, empathetic, and strategically warm",
      "text": "A complete, ready-to-send rewrite. Prioritise relationship-building language, empathy, and finding mutual ground. Warm but professional."
    },
    {
      "name": "The Visionary",
      "tagline": "Bold, inspiring, and forward-thinking",
      "text": "A complete, ready-to-send rewrite. Use inspiring language, paint a compelling future, make bold claims backed by logic."
    },
    {
      "name": "The Minimalist",
      "tagline": "Direct, efficient, respects the reader's time",
      "text": "A complete, ready-to-send rewrite. Strip everything to essentials. Active voice. Short sentences. No filler."
    }
  ],
  "coaching": [
    {
      "original": "exact phrase or sentence from the original (verbatim)",
      "improved": "how you changed it in one of the variations",
      "reason": "Specific, educational explanation of why this change improves communication impact. Name the principle (e.g., 'BLUF method', 'active voice', 'removing hedge language').",
      "category": "clarity | confidence | tone | structure | jargon | hedge"
    }
  ],
  "toneAnalysis": [
    {
      "phrase": "exact verbatim substring of the original text",
      "issue": "Concise issue description (max 12 words)",
      "type": "aggressive | passive | waffle | jargon | vague | strong",
      "severity": 1
    }
  ],
  "overallScore": {
    "clarity": 70,
    "confidence": 65,
    "professionalism": 75,
    "impact": 60
  }
}

STRICT RULES:
1. Return ONLY valid JSON — absolutely nothing else before or after
2. toneAnalysis "phrase" values MUST be exact verbatim substrings of the original text
3. Provide 3–7 coaching items; prioritise the highest-impact changes
4. Provide 3–8 toneAnalysis items; include "strong" type for genuinely effective phrases
5. All three variations must be complete, polished, ready-to-use rewrites (not partial edits)
6. Hedge words to always flag: "just wanted to", "I think", "I feel like", "sort of", "kind of", "maybe", "if that's okay", "I'm sorry to bother", "hopefully"
7. Scores are integers 0–100; be honest — rarely give above 85 unless the original is already very strong`;
}

/**
 * Calls the Anthropic Claude API directly from the browser.
 * Requires the `anthropic-dangerous-direct-browser-access: true` header.
 * @param {string} userText - The draft text to analyse
 * @param {object} state    - App state snapshot
 * @param {string} apiKey   - Anthropic API key
 * @returns {Promise<string>} Raw JSON string from the model
 */
async function callClaude(userText, state, apiKey) {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method : 'POST',
    headers: {
      'Content-Type'     : 'application/json',
      'x-api-key'        : apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model     : state.model,
      max_tokens: 4096,
      system    : buildSystemPrompt(state),
      messages  : [{ role: 'user', content: `Please analyse and enhance this text:\n\n${userText}` }],
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error?.message || `Claude API error ${response.status}`);
  }

  const data = await response.json();
  return data.content?.[0]?.text || '';
}

/**
 * Calls the OpenAI API.
 * Uses json_object response format to enforce valid JSON output.
 * @param {string} userText - The draft text to analyse
 * @param {object} state    - App state snapshot
 * @param {string} apiKey   - OpenAI API key
 * @returns {Promise<string>} Raw JSON string from the model
 */
async function callOpenAI(userText, state, apiKey) {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method : 'POST',
    headers: {
      'Content-Type' : 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model          : state.model,
      max_tokens     : 4096,
      response_format: { type: 'json_object' },
      messages       : [
        { role: 'system', content: buildSystemPrompt(state) },
        { role: 'user',   content: `Please analyse and enhance this text:\n\n${userText}` },
      ],
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error?.message || `OpenAI API error ${response.status}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || '';
}

/**
 * Parses the AI response string into a JavaScript object.
 * Strips markdown code fences if the model accidentally adds them.
 * @param {string} raw - Raw response string
 * @returns {object} Parsed result object
 */
function parseAIResponse(raw) {
  let s = raw.trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/, '');

  try {
    return JSON.parse(s);
  } catch (_) {
    const match = s.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]);
    throw new Error('Could not parse AI response — please try again.');
  }
}
