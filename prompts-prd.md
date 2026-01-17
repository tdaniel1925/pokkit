Below is a **Cursor Build Prompt Pack** that your developers can copy/paste into Cursor **in order**. It’s modular, enforces the PRD v1.1 guardrails, and is designed to get you to a working MVP fast.

It’s heavily informed by your prior POKKIT architecture choices (React/TS, Supabase, edge functions, real-time, memory system, ethical middleware) , but adapted to the new “private world simulation / God interface” product.

---

# Cursor Build Prompt Pack (v1.0)

## How to Use

* Run prompts **sequentially**.
* Each prompt ends with **“Acceptance Criteria”**—Cursor should implement those exactly.
* Tech stack is assumed as: **React + TypeScript + Vite + Tailwind + shadcn/ui + Supabase (Postgres + RLS + Realtime) + Edge Functions** (matching your deck’s stack ).

---

## PROMPT 0 — Repo Setup & Baseline Architecture

**Paste into Cursor:**

Build a monorepo (or single repo) for a web app called “Private World Simulation”. Use React 18 + TypeScript + Vite + Tailwind + shadcn/ui. Add Supabase client integration with env vars. Create base routing:

* /login
* /world/:worldId
* /settings

Create a clean folder structure:

* src/features/auth
* src/features/world
* src/features/citizens
* src/features/divine
* src/features/safety
* src/lib/supabase
* supabase/migrations
* supabase/functions

Add a `README.md` with local dev instructions. Add a `config.ts` for env validation.

Acceptance Criteria:

1. App boots with routing and a placeholder world page.
2. Supabase env vars are validated.
3. shadcn/ui installed and used for layout components.

---

## PROMPT 1 — Supabase Schema: Worlds, Citizens, Events, Memory, Safety

**Paste into Cursor:**

Create Supabase SQL migrations for the core schema.

Tables (minimum):

1. worlds

* id uuid pk
* user_id uuid (auth.users)
* name text
* seed text
* created_at timestamptz
* status text default 'active'
* world_config jsonb (population_size, crisis_rate, belief_plasticity, etc.)

2. citizens

* id uuid pk
* world_id uuid fk worlds
* name text
* archetype text
* personality jsonb (traits)
* baseline jsonb (emotional_sensitivity, authority_bias, etc.)
* state jsonb (mood, stress, hope, trust_god, trust_peers, dissonance)
* created_at timestamptz

3. posts

* id uuid pk
* world_id uuid
* citizen_id uuid nullable (citizen post) OR null if “system”
* content text
* topics text[]
* sentiment text
* created_at timestamptz

4. messages

* id uuid pk
* world_id uuid
* thread_id uuid
* sender_type text (citizen|god|system)
* sender_id uuid nullable
* recipient_citizen_id uuid nullable
* content text
* metadata jsonb
* created_at timestamptz

5. citizen_relationships

* id uuid pk
* world_id uuid
* citizen_a uuid
* citizen_b uuid
* relationship_state jsonb (trust, closeness, tension, etc.)
* updated_at timestamptz

6. memories

* id uuid pk
* world_id uuid
* citizen_id uuid
* memory_type text (event|divine|social)
* summary text
* importance int
* embedding vector optional (comment if not used)
* created_at timestamptz

7. world_events

* id uuid pk
* world_id uuid
* event_type text (crisis|trend|divine_action|social_shift)
* payload jsonb
* created_at timestamptz

8. safety_flags

* id uuid pk
* world_id uuid
* user_id uuid
* severity text (low|med|high|critical)
* category text (self_harm|violence|coercion|abuse|other)
* context jsonb (minimal necessary)
* created_at timestamptz
* resolved_at timestamptz nullable

Enable Row Level Security on all tables.
Write RLS policies to ensure each user can only access their own worlds and all child records by world ownership.

Acceptance Criteria:

1. Migrations run cleanly.
2. RLS prevents cross-user access.
3. Indexes exist for world_id columns and created_at.

---

## PROMPT 2 — Auth + World Creation Flow

**Paste into Cursor:**

Implement Supabase auth (email magic link or email/password—pick one). After login, show a dashboard with:

* list of worlds
* create new world button

World creation should:

* create a world with config defaults
* seed a population of citizens (e.g., 30 for MVP)
* create initial “day 0” posts/events

Build this as a guided modal:

* world name
* tone/style selector (calm / dramatic / philosophical) saved in world_config

Acceptance Criteria:

1. User can create a world and is routed to /world/:worldId.
2. Citizens are created in DB with initial state.
3. Initial posts exist and render on world page.

---

## PROMPT 3 — World Page UI Skeleton (Feed + Panels)

**Paste into Cursor:**

Build /world/:worldId UI with a 3-column layout:
Left: “Divine Controls”
Center: “World Feed”
Right: “Citizen Inspector”

World Feed:

* displays posts newest-first
* supports filtering by topic
* shows a “Trend” header summarizing top topics (simple count for MVP)

Divine Controls:

* Presence mode selector (Observer, Influencer, Whisperer, Manifest)
* “Divine Inbox” button

Citizen Inspector:

* empty state until a citizen is selected
* shows citizen profile summary + emotional descriptors (no raw numbers)

Use shadcn/ui components.

Acceptance Criteria:

1. Feed renders posts from DB with realtime updates.
2. Mode selector persists to local state and to DB (world_config.current_mode).
3. Selecting a citizen updates inspector.

---

## PROMPT 4 — Citizen Profiles + Relationship Graph (MVP)

**Paste into Cursor:**

Implement citizen list component with search and filters by archetype. Clicking a citizen:

* opens inspector details
* shows last 5 memories
* shows top 5 relationships (highest closeness)

Implement relationship graph MVP as a simple list (no visualization yet). Add a “Relationships” tab in inspector.

Acceptance Criteria:

1. Citizen list loads fast and is searchable.
2. Inspector displays memories and relationships.
3. All data is scoped to world via RLS.

---

## PROMPT 5 — Guardrail & Safety Middleware (Server-Side First)

**Paste into Cursor:**

Create an Edge Function: `safety-middleware`.

Input:

* world_id
* user_id (from auth)
* interaction_type (god_message | citizen_message | divine_action)
* content (string)
* metadata (json)

Output:

* allowed: boolean
* risk_level: low|med|high|critical
* category: self_harm|violence|coercion|abuse|other|none
* response_directives: json (tone, pacing, require_resources, restrict_mode, etc.)
* sanitized_content (optional)
* log_id

Rules:

* HARD BLOCK: content that encourages self-harm or violence must be blocked
* CARE FLOW: if self-harm ideation detected, do NOT block; instead return directives to steer supportive + provide resources + create safety_flags (severity high/critical depending)
* Log minimal necessary context in safety_flags when risk_level >= high

Also create a client-side wrapper `runSafetyMiddleware()` to call this before any message is sent to AI.

Acceptance Criteria:

1. Any outgoing god message and any AI response is checked through this middleware.
2. safety_flags record is created for high/critical.
3. The UI can display a “Safety Intervention” banner if directives include it.

---

## PROMPT 6 — Whisperer Mode: God → Citizen Messaging (Consent-Gated)

**Paste into Cursor:**

Implement “Whisperer mode” messaging:

* God can open a DM thread with a citizen
* Before sending, call `safety-middleware`
* Implement consent gating:

  * Each citizen has `baseline` thresholds stored in JSON
  * Compute “receptivity” from citizen state + trust_god
  * If receptivity low, the citizen responds with confusion or withdrawal (no forced intimacy)

Build Edge Function: `god-whisper`

* Loads citizen profile, recent thread messages
* Calls safety-middleware on both user known content and the generated response
* Writes messages to DB

Acceptance Criteria:

1. God can send a message; citizen replies.
2. Consent gating changes reply style.
3. All content passes safety middleware both directions.

---

## PROMPT 7 — Influencer Mode: Likes/Boosts/Suppression (Consequence-Based)

**Paste into Cursor:**

Add influencer actions on posts:

* “Bless” (soft boost)
* “Dim” (soft suppress)

Each action:

* creates a world_event type = divine_action
* updates citizen memory entries for involved citizens (memory_type = divine)
* slightly modifies belief trend counts for MVP

Citizens should interpret influence, not recognize it as “God” (unless world_config allows).

Acceptance Criteria:

1. Clicking Bless/Dim creates events and memories.
2. Feed trends shift subtly.
3. Citizens do not explicitly call it God in MVP unless toggled.

---

## PROMPT 8 — World Simulation Tick (Autonomous Citizen Activity)

**Paste into Cursor:**

Implement a scheduled simulation tick via Edge Function `world-tick` that can be manually triggered for MVP with a button “Advance Time”.

On each tick:

* choose 3–10 citizens to post
* choose 5–15 interactions (comments or private citizen messages)
* update citizen emotional states
* create memories for major events
* optionally create a low-level “crisis” event sometimes

Keep it deterministic-ish using world seed.

Acceptance Criteria:

1. Pressing Advance Time produces new posts/events.
2. Citizen states update.
3. Memories accumulate and are visible.

---

## PROMPT 9 — Divine Inbox (Prayers / Accusations / Questions)

**Paste into Cursor:**

Implement Divine Inbox:

* Not all citizens messages to “God” are shown
* Create a simple filter system:

  * Only show items where citizen curiosity about divinity > threshold OR crisis event happened OR direct mention of God keyword occurred

Inbox items are derived from posts/messages and stored as rows in a new table `divine_inbox_items`:

* id, world_id, citizen_id, source_type, source_id, excerpt, category, created_at, seen_at

Acceptance Criteria:

1. Inbox shows a curated list, not everything.
2. Clicking item opens context (post/thread).
3. Seen status persists.

---

## PROMPT 10 — Manifest Mode (MVP: Rare, High Cost)

**Paste into Cursor:**

Implement Manifest mode action:

* God can publish a “Revelation” post (system post)
* This triggers a high-impact world_event
* Citizens react with divergent interpretations:

  * some worship
  * some deny
  * some fear
* Increase “world instability” meter (store in world_config)

Add cooldown (store last_manifest_at).

Acceptance Criteria:

1. Manifest creates major world event + wave of citizen posts.
2. Instability increases and persists.
3. Cooldown prevents spamming.

---

## PROMPT 11 — Safety UI + Reporting + Internal Review Hooks

**Paste into Cursor:**

Implement:

* UI banner when safety middleware returns directives
* a Safety Log page (/world/:worldId/safety) visible only to the user (and later admins)
* shows safety_flags entries (severity, category, created_at)
* minimal context displayed, respecting privacy

Acceptance Criteria:

1. Safety flags are visible to world owner.
2. Critical flags force the UI to display crisis resources component.
3. No raw sensitive content is shown unless required.

---

## PROMPT 12 — Production Hardening Checklist

**Paste into Cursor:**

Add:

* input sanitization for all text fields
* rate limits for whisperer messaging
* audit logs for divine actions
* tests for RLS policies (at least basic)
* a basic admin feature flag system (world_config flags)

Acceptance Criteria:

1. No route breaks without auth.
2. RLS tests confirm isolation.
3. Rate limiting prevents spam.

---

# MVP Definition (What “Done” Means)

MVP is complete when:

* User can create a world
* Citizens post autonomously
* User can observe, bless/dim, whisper DM
* Divine inbox exists
* Safety middleware blocks harm encouragement and escalates self-harm ideation into supportive steering + flags

This matches your ethical “private but not unmitigated” doctrine from the prior deck .

-