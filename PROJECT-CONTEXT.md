# PROJECT CONTEXT
# Last Scanned: 2026-01-17
# Mode: Active Development - Phase 3 Complete

## Overview
name: Pokkit
description: Private world simulation platform where users inhabit a constrained "God" role within procedurally generated societies of autonomous AI citizens. Emphasizes ethical influence over control, observation over domination, and safety over immersion.

## Tech Stack
framework: Next.js 15 (App Router)
language: TypeScript
database: Supabase PostgreSQL + Drizzle ORM
auth: Supabase Auth (planned)
styling: Tailwind CSS + shadcn/ui
testing: Vitest (196 tests)
ai_providers: Anthropic (safety), OpenAI (creative), DeepSeek (bulk)

## Project Structure
```
src/
  app/                    # Next.js App Router pages
    api/                  # API routes
      world/              # World CRUD, tick, whisper, social, movements, manifest, config
      citizen/            # Citizen details
    world/                # World pages (new, [worldId], safety)
    dashboard/            # Multi-world hub (Phase 3)
  components/             # React components
    world-feed.tsx        # Event feed display
    citizen-card.tsx      # Citizen display card
    presence-panel.tsx    # God presence controls
    whisper-composer.tsx  # Whisper composition UI (Phase 2)
    whisper-history.tsx   # Whisper history display (Phase 2)
    divine-inbox.tsx      # Divine inbox UI (Phase 2.5)
    manifest-composer.tsx # Revelation composition UI (Phase 3)
    world-list.tsx        # Multi-world list (Phase 3)
    world-config-editor.tsx # Creator tools (Phase 3)
  db/                     # Database layer
    schema.ts             # Drizzle schema (extended for Phase 3)
    index.ts              # Connection
  lib/                    # Core logic
    guardrails/           # Non-bypassable safety middleware
    ai/                   # AI providers and citizen agents
    simulation/           # World simulation engine
    whisperer/            # Whisper engine (Phase 2)
    social/               # Social dynamics (Phase 2)
    cultural/             # Cultural emergence (Phase 2)
    influencer/           # Influencer engine (Phase 2.5)
    divine-inbox/         # Divine inbox (Phase 2.5)
    manifest/             # Manifest engine (Phase 3)
  types/                  # TypeScript types
    world.ts              # World state, config
    citizen.ts            # Citizen attributes, beliefs
    guardrails.ts         # Safety types
    social.ts             # Whispers, relationships, movements (Phase 2)
    divine.ts             # Influencer mode, divine inbox (Phase 2.5)
    manifest.ts           # Revelations, reactions, instability (Phase 3)
tests/                    # Vitest tests (196 total)
```

## Key Files
- Entry point: `src/app/page.tsx`
- Config: `drizzle.config.ts`, `next.config.ts`, `tailwind.config.ts`
- Database schema: `src/db/schema.ts`
- API routes: `src/app/api/world/route.ts`, `src/app/api/world/[worldId]/tick/route.ts`
- Guardrails: `src/lib/guardrails/middleware.ts` (NON-BYPASSABLE)
- Citizen Agent: `src/lib/ai/citizen/agent.ts`
- Simulation: `src/lib/simulation/engine.ts`
- Whisperer: `src/lib/whisperer/engine.ts` (Phase 2)
- Social Dynamics: `src/lib/social/dynamics.ts` (Phase 2)
- Cultural Emergence: `src/lib/cultural/emergence.ts` (Phase 2)
- Influencer Engine: `src/lib/influencer/engine.ts` (Phase 2.5)
- Divine Inbox: `src/lib/divine-inbox/inbox.ts` (Phase 2.5)
- Manifest Engine: `src/lib/manifest/engine.ts` (Phase 3)
- Config API: `src/app/api/world/[worldId]/config/route.ts` (Phase 3)

## Existing Patterns

### API Route Pattern
```typescript
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { worlds } from "@/db/schema";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    // Validation...
    const [world] = await db.insert(worlds).values({...}).returning();
    return NextResponse.json(world);
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
```

### Component Pattern
```typescript
"use client";
import { useState, useEffect } from "react";

interface Props {
  data: SomeType;
  onAction?: (id: string) => void;
}

export function ComponentName({ data, onAction }: Props) {
  const [state, setState] = useState<StateType | null>(null);
  // Component logic...
  return <div className="...">{/* JSX */}</div>;
}
```

### Guardrail Pattern (CRITICAL)
```typescript
// ALL divine actions MUST pass through this middleware
import { checkDivineAction } from "@/lib/guardrails";

const result = await checkDivineAction(action, worldState, targetCitizen);
if (!result.allowed) {
  // Apply consequences, do NOT proceed
  return { blocked: true, reason: result.reason };
}
// Only proceed if allowed
```

## Environment Variables
- [x] DATABASE_URL - Supabase PostgreSQL connection string
- [x] NEXT_PUBLIC_SUPABASE_URL - Supabase project URL
- [x] NEXT_PUBLIC_SUPABASE_ANON_KEY - Supabase anonymous key
- [x] SUPABASE_SERVICE_ROLE_KEY - Supabase service role key
- [x] OPENAI_API_KEY - OpenAI API key (creative content)
- [x] ANTHROPIC_API_KEY - Anthropic API key (safety checks)
- [x] DEEPSEEK_API_KEY - DeepSeek API key (bulk processing)

## Architecture Principles
1. **Guardrails are NON-BYPASSABLE** - All divine actions check safety BEFORE execution
2. **Divine memories NEVER decay** - `isDivine: true` means `decayRate: 0`
3. **Consent violations cause consequences** - No silent blocking, visible impact
4. **Hybrid AI approach** - DeepSeek for volume, Claude for safety, GPT for creative
5. **Tick-based simulation** - Controlled, observable, deterministic
6. **Manifestations increase instability** - High-impact divine events destabilize society

## Notes
- Phase 1 Complete: Guardrails, Observer mode, Citizen agents
- Phase 2 Complete: Whisperer mode, Social dynamics, Cultural emergence
- Phase 2.5 Complete: Influencer mode (Bless/Dim), Divine Inbox, Safety UI
- Phase 3 Complete: Manifest mode, Multi-world support, Creator tools
- Next: Authentication & user management, Production deployment
- Dev server runs on port 3002
- 196 tests passing covering core systems
