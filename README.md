# EmoSense

EmoSense is an autism-friendly emotion support app for reading, tracking, and explaining emotions in a calm interface. It is designed for autistic users, caregivers, and therapists who need simple language, accessible visuals, and trend-based reflection instead of one-off judgments.

## Current Features

- Landing page with feature cards, emotion preview, and caregiver-focused messaging.
- Demo, device-only, and Supabase email/password sign-in, with "keep me signed in", password reset by email, sign-out, and redirect back to the page you were on.
- Dashboard with greeting, emotion-wheel check-in (with optional note), today's mood, streak, last scan, weekly count, a 7-day mood strip, quick actions, and an editable recent log (edit notes, delete entries).
- Face emotion scan through camera or image upload.
- Model confidence scores and emotion distribution chart after scans.
- Consent-based voice tone analysis using a short local microphone check.
- Facial, voice, and text emotion fusion with explainable weighting.
- Helpbot support chat that answers the question asked: what a feeling means, how it feels in the body, calming steps for body symptoms, meltdowns and sensory overload, and social cues such as sarcasm, teasing and body language.
- AI-generated plain-language emotion explanations.
- Safety note that scan results are prompts, not diagnoses.
- Mood and behaviour tracker with emotion, time of day, activity, energy, and notes.
- Emotion dictionary with definitions, body signals, scenarios, and coping strategies.
- Settings for profile, password change, sign-out, theme (dark/light/high-contrast light), font size, contrast, motion, daily reminders, full data export, and delete.
- Social stories with step-by-step scenes, category filter, and read-aloud.

## Tech Stack

- Next.js 14 App Router, React 18, TypeScript
- Tailwind CSS 4, CSS variables, Framer Motion
- Zustand with localStorage persistence
- Supabase Auth and Postgres
- Anthropic Claude through `@anthropic-ai/sdk`
- Next.js API routes for emotion explanations, insights, and Helpbot replies
- `face-api.js` and TensorFlow.js for facial emotion detection
- Browser Web Audio API for local voice signal analysis
- Lightweight rule-based text sentiment and signal fusion scoring
- Recharts for the face-scan expression chart
- jsPDF for downloading weekly insights
- Phosphor Icons, React Dropzone, clsx

## Data And Integrations

- All logs go through `src/lib/logRepository.ts`: Supabase for cloud accounts, localStorage (scoped per user) for demo and device-only accounts. If a cloud write fails, the entry is kept on the device so nothing is lost.
- Device-only account passwords are stored as salted PBKDF2-SHA256 hashes (older plaintext entries are upgraded on next sign-in).
- The active session is kept in localStorage ("keep me signed in") or sessionStorage (this tab only).
- Local face model files in `public/models`, with CDN fallback. The Supabase SDK is only downloaded for cloud accounts.
- Voice tone analysis runs locally in the browser; raw audio is not saved, uploaded, or transcribed.
- Emotion fusion prefills from your latest face scan and voice check; you can save the fused result to your log.
- Helpbot, scan explanations, and weekly insights use Claude (`claude-opus-5-5`, see `src/lib/claude.ts`) when `ANTHROPIC_API_KEY` is set, and deterministic local text when it is not or a request fails.
- No payment integration is currently included.

## Implemented Upgrade Details

### Voice Tone Analysis

- Route: `/voice-tone`
- Files: `src/app/(dashboard)/voice-tone/page.tsx`, `app/(dashboard)/voice-tone/page.tsx`
- Navigation: added to shared dashboard navigation through `src/components/layout/navItems.ts`
- Browser APIs: `navigator.mediaDevices.getUserMedia`, `AudioContext`, `AnalyserNode`, `requestAnimationFrame`
- Analysis window: 8 seconds by default
- Signals measured: average volume, volume variation, speaking signal ratio, and pitch movement proxy
- Output labels: low or quiet voice, steady voice, expressive voice, or activated voice
- Safety model: requires explicit checkbox consent, does not store raw audio, does not create transcripts, and presents results as supportive clues rather than diagnoses
- Limitations: microphone quality, distance, background noise, masking, speech differences, and browser support can affect the result

### Facial + Voice + Text Emotion Fusion

- Route: `/emotion-fusion`
- Files: `src/app/(dashboard)/emotion-fusion/page.tsx`, `app/(dashboard)/emotion-fusion/page.tsx`
- Navigation: added to shared dashboard navigation through `src/components/layout/navItems.ts`
- Inputs: face emotion/confidence, voice tone/confidence, and a short text note
- Fusion weights: face 45%, voice 30%, text 25%
- Text sentiment: lightweight keyword scoring for joy, calm, sadness, anger, fear, and surprise
- Output: ranked emotion scores, top fused emotion, agreement band, and a "why this result?" explanation
- Safety model: does not persist fused results, does not claim clinical accuracy, and clearly labels fusion as a support tool rather than a diagnosis
- Future work: connect directly to saved face scans and voice tone results, add consented persistence, improve text sentiment with evaluated NLP, and validate weights with labeled data

### Helpbot

- Route: `/helpbot`
- API route: `POST /api/helpbot`
- Files: `src/app/(dashboard)/helpbot/page.tsx`, `app/(dashboard)/helpbot/page.tsx`, `src/app/api/helpbot/route.ts`, `app/api/helpbot/route.ts`
- Navigation: added to shared dashboard navigation through `src/components/layout/navItems.ts`
- Purpose: answer questions about feelings, body signs, calming steps and social situations, or help explain a situation to a caregiver
- UX: chat interface, quick-start prompts, loading state, inline error handling, and safety panel
- AI behavior: `src/lib/helpbotKnowledge.ts` classifies the question (social cue, body symptom, a specific emotion, a comparison, coping, app help) and answers it from the emotion dictionary. With `ANTHROPIC_API_KEY` set, Claude writes the reply using that answer as reference notes; without it, the local answer is returned.
- Safety model: crisis-language detection returns immediate safety guidance, Helpbot is labeled as supportive rather than therapeutic, and it avoids diagnosis, prescribing, or risk decisions
- Privacy model: only the short message history needed for a reply is sent to the API; messages are not persisted by this MVP

## Upgrade Opportunities

Already added as lightweight improvements:

- Model confidence scores for face scans.
- Explainability text showing that scan results come from ranked expression scores.
- AI safety wording that results are not diagnostic.
- Voice tone analysis MVP with local-only microphone processing.
- Facial, voice, and text emotion fusion MVP with explainable weighted scoring.
- Helpbot support chat with Anthropic-backed replies, local fallback, and crisis-language safety handling.

Held for a larger implementation pass:

- Multimodal emotion analysis combining facial emotion, voice tone, and text sentiment.
- Expanded voice tone validation with bias testing and user/caregiver agreement metrics.
- Production-grade text sentiment analysis for notes/messages.
- Persisted, validated fusion connected directly to real scan and tone sessions.
- Full therapist portal with assigned clients, notes, permissions, and shared care plans.
- HIPAA-style data handling plan with encryption, audit logs, retention, access reviews, and incident response.
- Production deployment architecture with secrets, backups, observability, and RLS verification.
- Formal evaluation using labeled data, agreement rates, calibration, correction rate, and user outcome metrics.

## Database

Run the SQL files in `supabase/migrations/` in order (001, 002, 003) in the Supabase SQL editor. Migration 003 adds the delete policies needed for deleting entries, plus indexes.

In Supabase Auth settings, add `<your-site>/auth/callback` and `<your-site>/auth/reset` to the allowed redirect URLs so confirmation and password-reset emails work.

## Environment Variables

```env
ANTHROPIC_API_KEY=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

## Development

```bash
npm run dev
npm run build
npm run start
npm run lint
```

Open `http://localhost:3000` after starting the dev server.
