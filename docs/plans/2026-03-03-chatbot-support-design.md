# Phase 12: Chatbot & Support — Design Document

> Date: 2026-03-03
> Status: Approved

## Overview

Floating chatbot widget powered by Puter.js client-side AI. Zero server cost for AI inference. Available on all pages (landing, docs, legal, dashboard). South African personality with local expressions.

## Architecture

Standalone `'use client'` component rendered in the root locale layout. Self-contained state management (no context provider needed). Chat history persisted in `localStorage`. Support escalation via API route saving to the `notification` table.

## Components

All in `src/components/chatbot/`:

| Component | Purpose |
|-----------|---------|
| `ChatbotWidget.tsx` | Main widget: floating bubble + expandable panel. Manages state, Puter.js calls, auto-open logic. |
| `ChatMessage.tsx` | Individual message bubble with user/bot styling variants. |
| `ChatInput.tsx` | Text input bar with send button, disabled state while AI generates. |
| `SupportForm.tsx` | Inline form (name, email, message) for human escalation. |
| `index.ts` | Barrel export. |

## API Route

`POST /api/support/ticket` — Validates input, saves support request as a `system` notification in the `notification` table with request data in the JSONB `data` column. No email service required.

## Integration Point

Widget rendered in `src/app/[locale]/layout.tsx` inside `NextIntlClientProvider`.

## Onboarding Flow

1. First visit detected via `localStorage` key `pgs-chatbot-seen`.
2. Widget auto-opens after 2 seconds.
3. Welcome message: "Howzit! 👋 I'm your Purple Glow assistant. How can I help?"
4. Three suggested quick-action buttons: "How do I get started?", "What can I post?", "How does billing work?"
5. After dismissal, `pgs-chatbot-seen` set to `true`.

## Visual Spec

**Bubble:** 56px circle, `right-6 bottom-6`, `z-[500]`. Purple gradient, white chat icon. Pulse on first appear. Red unread dot.

**Panel:** 380×520px desktop, full-width mobile. Purple gradient header. Scrollable message area. Bot messages: left, slate bg. User messages: right, purple bg. Animated typing dots. Fixed input bar at bottom.

## AI System Prompt

Puter.js text generation with system prompt:
- Friendly South African assistant for Purple Glow Social
- Knows about: account linking, AI content generation, scheduling, billing tiers (Seedling/Hustler/Grower/Mogul), credits, analytics
- Uses occasional SA expressions: "Howzit!", "Lekker!", "No worries, we've got you sorted"
- Keeps responses concise (under 150 words)
- Suggests "Talk to a human" when unable to help

## Testing

- Unit tests: ChatMessage, ChatInput, SupportForm, ChatbotWidget
- API route test: POST /api/support/ticket validation and storage
- Playwright E2E: widget visibility, open/close, message flow
