# Slack Clone

A full-stack chat prototype with channel conversations, direct messages, and persisted message history. Built with Next.js, Express, WebSockets, Prisma, and PostgreSQL in an npm/Turborepo monorepo.

**Status:** learning/portfolio prototype. Core chat paths exist in source, but runtime behavior and production readiness are not established by this README. See the [review and testing guide](docs/review-guide.md) for current gaps and a concrete verification plan.

## Start with these files

- [Chat UI](apps/frontend/app/components/Chat.tsx): load history over HTTP, join a channel or DM over a WebSocket, send messages, and render incoming events.
- [WebSocket server](apps/backend/src/webSocket/index.ts): room subscriptions, broadcast routing, persistence calls, presence, and typing events.
- [HTTP routes](apps/backend/src/routes): channel creation/listing, user listing, and message history.
- [Authentication](apps/frontend/app/api/auth/%5B...nextauth%5D.ts): credential validation, bcrypt password checks, and access-token issuance.
- [Data model](packages/db/prisma/schema.prisma): users, channels, channel messages, and direct messages.

The dashboard imports `Chat.tsx` through `chatPage.tsx`. `Chat2.tsx` is an alternate implementation, not the active dashboard path.

## What is implemented

- Email/password sign-in and account creation through a NextAuth credentials provider.
- Channel creation and selection.
- Channel and direct-message history queried through Prisma.
- WebSocket delivery to subscribed channel clients or DM participants.
- Presence and typing-event handlers, with unfinished behavior called out in the review guide.

These are source-level capabilities, not claims of a passing end-to-end test suite.

## Architecture

```text
Browser (Next.js / React)
  |-- NextAuth credentials --> Prisma --> PostgreSQL
  |-- Bearer-token HTTP ----> Express routes --> Prisma
  |-- WebSocket -----------> ws server --> broadcast + Prisma write
```

The frontend obtains an access token from NextAuth for HTTP requests. Express checks bearer tokens under `/api`. WebSocket handling is a separate path and still needs authenticated identity and authorization checks.

Message history is loaded over HTTP; new messages arrive through WebSockets. The current server broadcasts before its asynchronous database write finishes. This keeps the paths simple but does not provide a durable-delivery guarantee.

## Repository layout

- `apps/frontend`: Next.js chat application.
- `apps/backend`: Express HTTP API and WebSocket server.
- `apps/docs`: retained Next.js starter app, not project documentation.
- `packages/db`: Prisma schema, migrations, seed, and shared client.
- `packages/ui`: shared React components.
- `packages/eslint-config`, `packages/typescript-config`: shared tooling.

## Local development

The repository declares Node.js `>=18` and npm `10.8.2`. Use a toolchain compatible with the checked-in dependencies and a **disposable local PostgreSQL database**. Do not use production data or reuse a personal password.

1. Install from the repository root:

   ```sh
   npm ci
   ```

2. Supply `DATABASE_URL` to Prisma and both applications. The frontend also needs `NEXTAUTH_URL=http://localhost:3000`, `NEXTAUTH_SECRET`, and `JWT_SECRET`. The backend needs the **same** `JWT_SECRET` and a separate port such as `PORT=3001`. Export values in each process's shell or use the relevant framework's local environment mechanism. The backend does not load dotenv itself. Generate your own secrets and never commit them.

3. Generate the client and apply the checked-in migrations to the disposable database:

   ```sh
   npx prisma generate --schema=packages/db/prisma/schema.prisma
   npx prisma migrate deploy --schema=packages/db/prisma/schema.prisma
   ```

4. **Local endpoint setup is still manual.** The active frontend files `Chat.tsx`, `createChannel.tsx`, and `userSelector.tsx` contain a hardcoded hosted API origin. For an isolated local run, replace those HTTP URLs with `http://localhost:3001` and the WebSocket URL in `Chat.tsx` with `ws://localhost:3001`. Do not point test traffic at the hosted service. A shared environment-based endpoint configuration is a follow-up task.

5. Run the backend and frontend in separate terminals with their environment values available:

   ```sh
   npm run build --workspace=backend
   PORT=3001 npm run start --workspace=backend
   ```

   ```sh
   npm run dev --workspace=frontend
   ```

These commands are derived from the package scripts. A clean install, build, and browser walkthrough still need to be verified; this is not yet a confirmed one-command setup. The backend has no `dev` script, so root `npm run dev` does not start it.

## Verification and next steps

`npm run build` and `npm run lint` are available at the root. There is no implemented automated behavioral test suite; the database package's `test` script is only a failing placeholder. The existing GitHub workflow deploys on pushes to `main`; it is not PR test coverage.

The next useful evidence is a reproducible local setup, authentication/authorization tests, two-client message tests, and measured delivery behavior. See [docs/review-guide.md](docs/review-guide.md) for acceptance cases and known limitations.

No user counts, latency numbers, availability guarantees, or production-usage claims are implied.
