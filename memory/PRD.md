# VIRANA — Product Requirements Document

## Original Problem Statement
Build "VIRANA" — an AI-powered, multilingual, community-driven cultural heritage platform to discover, document, understand, experience and preserve India's cultural heritage. Interactive cultural map + cultural encyclopedia + AI cultural assistant.
Tagline: Explore. Experience. Preserve.

## Tech Stack
- Frontend: React (CRA), Tailwind, shadcn/ui, react-leaflet, sonner
- Backend: FastAPI + Motor (MongoDB), JWT auth (bcrypt + PyJWT)
- AI: Gemini 3.1 Pro (Ask Virana AI + HeritageLens vision) via Emergent Universal Key (emergentintegrations)
- Design: "Ancient India + Modern Technology" — Basalt Night / Vedic Gold (see /app/design_guidelines.json)

## Implemented (June 2026)

### Phase 1 — MVP (previous session)
- Homepage (hero, categories, featured, at-risk, CTA)
- Explore Map (react-leaflet, category/state filters, search, fly-to)
- Heritage Detail pages (33 seeded records in db.heritage)
- Ask Virana AI (/api/ai/ask, Gemini, keyword RAG over seed)
- HeritageLens (/api/heritage-lens/analyze, image → JSON identification)

### Phase 2 — Auth, Accounts & Calendar (this session)
- **Auth**: register (validation: email, strength, match, duplicates), login (+brute force lockout), logout, JWT access/refresh, email verification (in-app link mode — token returned in response, UI shows verify button), forgot/reset password (in-app link mode), account states UNVERIFIED/VERIFIED/SUSPENDED.
- **Backend modules**: /app/backend/auth.py, users.py, festivals.py, festival_seed.py
- **User system**: profiles, preferences, saved_items (polymorphic HERITAGE/FESTIVAL/...), collections CRUD, activity log + track-view, sessions list/clear, notifications (computed festival reminders ≤21 days), data export, account deletion (password-verified, contributions anonymized).
- **Frontend**: /login /signup /forgot-password /reset-password /verify-email /my-virana /settings /festival/:id; auth-aware Navbar (bell + avatar dropdown); SaveButton (♡→♥, prompts sign-in); Protected routes.
- **My Virana dashboard**: Recently Explored, Saved, Contributions (empty state), Collections, Calendar (reminders + saved festivals), Activity.
- **Settings**: sidebar with Profile / Account / Security (change pw, sessions, 2FA-soon) / Language (en+hi+te live, 10 more scaffolded) / Appearance (light/dark/system persisted) / Notifications (7 toggles) / Privacy / Connected Accounts / Data & Account (export + delete flow).
- **Cultural Calendar**: 51 festivals seeded (db.festivals) with verified 2026 Panchang dates, regions, districts, lat/lng, descriptions, significance, history, celebration, traditions, foods, music, dance, rituals, regional variations (Dussehra→Mysuru/Kullu/Bastar etc.), related heritage links, per-festival AI-generated contextually-accurate imagery (48 unique images), source URLs, verification status.
- Calendar views: Month grid / List / Timeline; filters: month, state, type, upcoming, saved.
- Festival detail page with Explore-on-Map (flies map to festival location w/ marker), Save, Remind Me.
- Homepage "Coming Up" section (live from /api/festivals/upcoming).
- i18n: LangProvider (en/hi/te strings for nav & key UI), architecture ready for more languages.

## Key API Endpoints
- Heritage: GET /api/heritage, /api/heritage/search, /api/heritage/{id}, /api/states, /api/categories, /api/stats
- AI: POST /api/ai/ask, POST /api/heritage-lens/analyze
- Auth: see /app/memory/test_credentials.md
- Users: GET/PUT/DELETE /api/users/me, /password, /settings, /notifications, /privacy, /saved (GET/POST toggle), /saved/check, /track-view, /activity, /recently-explored, /collections (+items), /contributions, /reminders, /notifications, /export, /sessions
- Festivals: GET /api/festivals (month/state/type/q/upcoming), /api/festivals/upcoming, /api/festivals/{id}, POST /api/festivals/{id}/remind, GET /{id}/reminder-status

## DB Collections
heritage, states, categories, chat_messages, festivals, users, user_profiles, user_preferences, user_sessions, saved_items, user_collections, user_activity, festival_reminders, contributions, login_attempts, password_reset_tokens, email_verification_tokens

## Decisions
- Email verification/reset: IN-APP LINK MODE (no email provider). Tokens returned in API response, links shown in UI. Swap to Resend later.
- Google OAuth: deferred (button visible, disabled "coming soon").
- Festival images: AI-generated cultural illustrations (attributed as such per festival). nuakhai image regenerated once (bad hash).

## Backlog
- P1: Community contributions (media upload via Emergent object storage, location pinning, comments, moderation)
- P1: Voices of Heritage (audio preservation), Heritage at Risk expansion
- P1: Real email delivery (Resend) for verification/reset; Google OAuth (Emergent-managed)
- P2: Expert verification, knowledge graph, recommendations, heritage journeys, festival map view (calendar Map View is partial — festivals connect via Explore-on-Map)
- P2: Full content translation (hi/te beyond UI strings), 10 more languages
- P3: Camera mode / AR
