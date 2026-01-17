# ARCHITECTURAL DECISIONS
# Project: Pokkit
# AI: Add entries here when making significant technical choices

## How to Use This File
When you make a decision that affects architecture, add an entry:
- Date
- Decision
- Reason
- Alternatives considered

---

## 2026-01-17: Non-Bypassable Guardrail Architecture
**Decision:** All divine actions and citizen content MUST pass through guardrail middleware before execution
**Reason:** PRD mandates safety-first architecture. Guardrails override all narrative logic.
**Alternatives considered:**
- Optional safety checks (rejected - violates PRD)
- Client-side filtering (rejected - bypassable)
- Post-hoc moderation (rejected - harm already done)

---

## 2026-01-17: Hybrid AI Provider Strategy
**Decision:** Use DeepSeek for bulk citizen processing, Claude for safety, GPT for creative content
**Reason:** Cost optimization while maintaining quality where it matters
**Alternatives considered:**
- Single provider (rejected - expensive at scale)
- Local models only (rejected - quality concerns for safety)
- OpenAI only (rejected - Claude better for safety alignment)

---

## 2026-01-17: Divine Memories Never Decay
**Decision:** Memories marked as `isDivine: true` have `decayRate: 0` and are never pruned
**Reason:** PRD Section 5.3 states "Divine Interaction Memory (persistent, non-erasable)"
**Alternatives considered:**
- Slow decay (rejected - violates PRD)
- Configurable (rejected - safety concern)

---

## 2026-01-17: Consent Violations Cause Consequences
**Decision:** When divine actions violate citizen consent thresholds, apply consequences (trust collapse, fear response) rather than silently blocking
**Reason:** PRD Section 8.3 states "No silent overrides" - violations must have visible impact
**Alternatives considered:**
- Silent blocking (rejected - violates PRD)
- Warning only (rejected - no meaningful consequence)

---

## 2026-01-17: Tick-Based Simulation
**Decision:** World evolves through discrete "ticks" rather than real-time
**Reason:** Allows controlled observation, easier testing, deterministic behavior
**Alternatives considered:**
- Real-time simulation (rejected - hard to observe, expensive)
- Event-driven only (rejected - need periodic autonomous behavior)

---

## 2026-01-17: Drizzle ORM with Supabase
**Decision:** Use Drizzle ORM for type-safe database access with Supabase PostgreSQL
**Reason:** Full TypeScript integration, schema-as-code, good migration support
**Alternatives considered:**
- Prisma (rejected - heavier, slower cold starts)
- Raw SQL (rejected - no type safety)
- Supabase JS client only (rejected - limited query capabilities)

---

## 2026-01-17: Phase-Based Feature Rollout
**Decision:** Implement features in 3 phases: (1) Guardrails + Observer, (2) Whisperer + Social, (3) Manifest + Multi-world
**Reason:** PRD defines phases; ensures safety layer is solid before adding more interaction modes
**Alternatives considered:**
- All at once (rejected - too risky, hard to test safety)
- Feature flags (considered for future - may use for Phase 2/3)

---

## 2026-01-17: CodeBakers Initialized
**Decision:** Using CodeBakers server-enforced pattern system
**Reason:** Ensure consistent, production-quality code
**Pattern:** Server-enforced via discover_patterns MCP tool

---

## 2026-01-17: Whisper Tone-Based Reception System
**Decision:** Whisper reception determined by tone match + citizen psychological state, not just content
**Reason:** Creates meaningful interaction dynamics; citizens respond differently based on their trust level and emotional state
**Alternatives considered:**
- Content-only evaluation (rejected - ignores citizen personality)
- Random reception (rejected - no meaningful player feedback)
- Guaranteed delivery (rejected - removes citizen agency)

---

## 2026-01-17: Relationship Compatibility Formula
**Decision:** Relationship formation uses weighted compatibility score (personality 30%, state 40%, existing trust 30%)
**Reason:** Balance between stable personality traits and dynamic emotional states
**Alternatives considered:**
- Personality only (rejected - too static)
- Random connections (rejected - no emergent social structure)

---

## 2026-01-17: Cultural Movement Stage Progression
**Decision:** Movements progress through 7 stages: nascent → growing → mainstream → dominant → declining → underground → extinct
**Reason:** Models realistic social movement lifecycles; provides observable cultural evolution
**Alternatives considered:**
- Binary active/inactive (rejected - too simplistic)
- Continuous influence only (rejected - no lifecycle narrative)

---

## 2026-01-17: Whispers Pass Through Guardrails
**Decision:** All divine whispers pass through guardrail middleware before reaching citizens
**Reason:** Maintains safety-first architecture even for private communications
**Alternatives considered:**
- Exempt whispers from guardrails (rejected - creates safety bypass)
- Post-delivery moderation (rejected - harm already delivered)

---

## 2026-01-17: Bless/Dim as Soft Influence (Not Miracles)
**Decision:** Divine influence (bless/dim) affects visibility/prominence of feed items, not physics or reality
**Reason:** PRD discussion clarified miracles should be influence + timing + information asymmetry, not supernatural physics-breaking
**Alternatives considered:**
- Physics-breaking miracles (rejected - too game-breaking, ethically complex)
- No influence mechanism (rejected - limits divine interaction)
- Direct citizen mind control (rejected - violates consent architecture)

---

## 2026-01-17: Divine Inbox Relevance-Based Filtering
**Decision:** Not all citizen mentions of God surface to inbox; use relevance scoring based on divine keywords, curiosity, stress, and crisis context
**Reason:** Creates meaningful curation; prevents inbox spam while surfacing important messages
**Alternatives considered:**
- Show all divine mentions (rejected - overwhelming noise)
- Random sampling (rejected - may miss important messages)
- Only direct prayers (rejected - misses questions, accusations, doubt)

---

## 2026-01-17: Crisis Calls Always Surfaced
**Decision:** Inbox items categorized as `crisis_call` always surface regardless of relevance threshold
**Reason:** Safety-first design; critical messages must never be filtered out
**Alternatives considered:**
- Standard relevance threshold (rejected - safety risk)
- Separate crisis channel (considered - may add in future)

---

## 2026-01-17: Cooldown System for Divine Actions
**Decision:** Implement tick-based cooldown (default 3 ticks) between influence actions
**Reason:** Prevents spam/abuse; encourages thoughtful divine intervention
**Alternatives considered:**
- No cooldown (rejected - enables abuse)
- Energy/resource system (considered for future - more complex)
- Per-citizen cooldown (rejected - too complex for initial implementation)

---

<!-- AI: Add new decisions above this line -->
