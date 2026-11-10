# Review and testing guide

## Review route

Read these paths in order to follow one message through the system:

1. [Dashboard](../apps/frontend/app/%28dashboard%29/dashboard/page.tsx) checks the server-side session and renders `chatPage.tsx`.
2. [Chat page](../apps/frontend/app/components/chatPage.tsx) switches between a selected channel and a selected user.
3. [Active chat component](../apps/frontend/app/components/Chat.tsx) loads history, opens a socket, sends messages, and updates the UI.
4. [WebSocket server](../apps/backend/src/webSocket/index.ts) routes live events and starts Prisma writes.
5. [Message routes](../apps/backend/src/routes/messages.ts) query saved channel/DM history.
6. [Prisma schema](../packages/db/prisma/schema.prisma) defines the persisted relationships.

## Current tradeoffs and limitations

These observations come from source inspection. They are not a completed security audit or proof that every path works at runtime.

- **Identity and access:** HTTP bearer-token checking exists, but socket identity comes from payload fields. Authenticate socket connections, derive sender identity server-side, and authorize channel/DM reads and writes before exposing a public demo.
- **Response boundaries:** user-list and message-history queries return full user records or relations. Restrict responses to fields the UI needs rather than exposing password hashes.
- **Delivery semantics:** broadcasts occur before persistence completes, and the broadcast object is not the saved row with its database ID. Define acknowledgement, retry, and deduplication semantics before claiming reliable delivery.
- **Presence and typing:** the `userOnline` branch is gated on an already assigned socket user ID; channel joins do not assign it. The active UI checks the typing ref object rather than `typingTimeoutRef.current`. Treat presence/typing as unfinished until tested.
- **Reconnects:** the active UI's reconnect code is commented out. Reloading history is not equivalent to reliable reconnect recovery.
- **Empty states:** the channel/user listing routes return an object when empty while the UI expects a list. Verify a brand-new database, not just seeded data.
- **Configuration:** active frontend API/socket origins are hardcoded. The auth configuration's custom sign-in path also differs from the checked-in page path.
- **Scale:** subscriptions, presence, and typing state live in one process. No shared fan-out or multi-instance consistency mechanism is implemented.
- **Secrets:** use explicit local secrets. Remove fallback signing secrets as part of hardening.

## Proposed automated tests

**Status: planned, not implemented or run.** Each case should become a reproducible test with isolated data, explicit assertions, and cleanup. Do not mark it passing based only on a manual happy-path demo.

### Authentication and authorization

- An unauthenticated HTTP request is rejected; an expired or malformed token is rejected.
- A socket without a valid session/token cannot join or send.
- A client cannot choose another user's sender ID.
- A user outside a DM cannot retrieve its history or receive its live events.
- API and socket responses never include password fields.

### Messaging and persistence

- Two clients in one channel receive a sent message; a client in a different channel does not.
- Two DM participants receive a message; an unrelated third client does not.
- Reloaded history includes the saved message exactly once and in deterministic order.
- A database write failure produces an explicit failure, not an apparently durable successful message.
- Empty, oversized, malformed, and unexpected event payloads are rejected without terminating the server.
- A new database produces valid empty-list responses and usable UI empty states.

### Lifecycle and UI

- Rapid channel/DM switches cannot display stale history from the previous selection.
- Closing a tab clears presence/typing state; multiple tabs for one user behave consistently.
- Reconnect and repeated send attempts follow documented deduplication rules.
- Enter and the Send button have the same behavior; empty input is not sent.
- Session expiry, sign-out, network loss, and Back/Forward navigation leave the UI in a recoverable state.

## Manual demo after local setup is repaired

Use only a disposable database and locally routed endpoints. Create two throwaway accounts in separate browser profiles. Create a channel, send a message in each direction, reload history, switch to a DM, and repeat. Record failures instead of omitting them. Use a third profile for isolation checks.

The seed contains sample users and messages, but it is not a full test fixture: rerunning it can add more messages. Do not treat seed success as application verification.

## Evidence to record

For each future verified run, capture the commit SHA, Node/npm versions, exact commands, database setup, test counts, failures, and any skipped checks. For performance work, record client count, message rate, payload size, machine details, duration, and persistence-success rate alongside latency. Do not publish a benchmark until the harness and results can be reproduced.

This documentation pass adds no runtime fixes, test runner, deployment, or benchmark result.
