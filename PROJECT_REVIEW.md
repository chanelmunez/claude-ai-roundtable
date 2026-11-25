# Project progress and recommended next steps

Reviewed on 2026-11-25 from `README.md`, the current working tree, and the recent commit history. This is a code and repository review, not a security audit or runtime validation.

## Current progress

The README describes an AI roundtable built with Next.js, TypeScript, multiple model providers, and a live conversation UI. Recent commits have focused on credentials and cleanup (`9f0d548`, “remove keys from readme.md”; earlier history also includes “update roundtable api keys” and “keys”). The branch is one commit ahead of `origin/main`, and the working tree contains a substantial, uncommitted persistence feature.

The current changes are primarily a move from transient, in-memory sessions toward persistent discussions:

- Session creation, retrieval, status changes, deletion, message saving, and session listing are being connected to Supabase.
- The UI now has a saved-discussions board with open, archive, delete, and status controls.
- Client state is hydrated from saved sessions, and generated answers are saved with server-assigned IDs and timestamps.
- The README has already been updated with a Supabase schema and a warning to keep the service key on the server.

This is meaningful groundwork, but the persistence implementation is not yet cohesive: a new SQLite client and dependency are also present, while the repository currently uses the Supabase client. The API routes that save or list sessions will fail without valid Supabase configuration and matching schema. The documented legacy SSE endpoint currently sends keepalives only; it does not broadcast conversation messages.

## Security priorities

1. **Treat the credentials in the prompt files as compromised.** `prompt-ai-roundtable.md` and `prompt-ai-roundtable-sublime.md` contain plaintext provider API keys. Revoke and rotate them with each provider, remove them from these files, and check whether they were committed or shared. If they entered Git history or any external system, deleting the current copies alone is insufficient. Do not copy any key into this report or future prompts. Keep replacement secrets in deployment environment variables.
2. **Decide the access model before exposing saved discussions.** The session list, read, update, and delete APIs currently have no authentication or ownership checks. Anyone who can reach the deployment can read or mutate every session; the Supabase service role can bypass RLS. Add authentication and per-user ownership checks (or another explicit access boundary) before deploying with real user data. Do not assume enabling RLS protects calls made with the service role.
3. **Validate every API payload on the server.** Topic, mode, selected model IDs, message arrays, session IDs, and status values are accepted with little or no schema validation. In particular, `update_status` casts arbitrary input to `SessionStatus`; constrain it to allowed transitions and supported values. Enforce topic/message length and count limits, participant limits, UUID format, and that a requested model belongs to the session.
4. **Protect the generation endpoint from abuse and cost spikes.** It has no visible rate or concurrency limit, and the client supplies the message context used for model calls. Load authoritative session state and participants on the server, impose request/body/context limits, rate limit by user/session, and set provider timeouts and per-session generation limits. Avoid returning raw provider/configuration error details to clients.
5. **Make persistence writes consistent.** Session creation inserts the session and participants separately; a participant insert failure can leave an orphan session. Message insertion and activity update are also separate. Use a transaction/RPC where supported, or add compensating cleanup and idempotency. Validate session existence and membership before saving a response.

## Performance and reliability priorities

- **Choose one database path.** `session-repository.ts` uses Supabase; `client.ts` initializes SQLite but is not used by the repository. Remove the unused SQLite client/dependency or complete a deliberate adapter design. On Vercel, a local SQLite file is generally ephemeral and not shared across serverless instances, so it is not suitable as the production source of truth without a supported persistent volume.
- **Avoid repeatedly sending and fetching the entire transcript.** The generation endpoint accepts client-provided messages, while session reads fetch every message. Retrieve context on the server and bound it to the context policy (the existing context manager targets 10 messages and 2,000 characters). Add pagination for transcript history as it grows.
- **Reduce session-board polling.** The browser refreshes all 100 listed sessions every 15 seconds, even when the user is idle. Prefer explicit refresh plus invalidation after mutations, or a longer/background-only refresh interval. Keep the list paginated and use a database-side count strategy that remains efficient as messages accumulate.
- **Keep serverless calls bounded.** Model generation can take up to 60 seconds. Add provider-level timeouts, cancellation handling, and a clear retry policy. Avoid automatic retries that can duplicate paid model calls or persisted messages; use idempotency keys if retrying.
- **Keep route runtimes aligned with dependencies.** The AI route declares Edge runtime while persistence uses `@supabase/supabase-js`; confirm the chosen SDK/runtime combination is supported, or use Node.js consistently. SQLite requires Node.js and should not be imported into Edge routes.
- **Handle lifecycle races.** The UI schedules the next response with `setTimeout`, but ending, switching, or deleting a session may leave a pending generation running. Cancel in-flight requests/timers and reject stale responses by session ID. Check HTTP status for lifecycle mutations before updating local state.
- **Do not describe the current SSE endpoint as live message streaming.** Either implement real delivery using infrastructure that works across serverless instances, or update the README and remove unused SSE code until that capability is needed.

## Where to go from here

1. Rotate and remove the exposed provider credentials, then inspect repository history and any shared copies.
2. Settle the production architecture: Supabase appears to be the intended persistent store given the repository and README; remove the unused SQLite path unless there is a specific deployment target that supports it.
3. Define the access model and protect every session and generation endpoint before deployment.
4. Finish persistence correctness: schema validation, ownership checks, atomic writes, legal status transitions, missing-session handling, and idempotent generation behavior.
5. Make the UI lifecycle robust: loading/error states for saved sessions, confirmed deletion, cancellation when switching sessions, and correct handling of failed status requests.
6. Update the README to match what actually works: deployment environment variables, exact database setup/migrations, auth/access behavior, runtime requirements, and whether SSE is implemented.
7. Then run the project’s existing lint/build checks and a focused manual flow: create session → generate and persist a message → reload/open it → archive/resume → delete. Add tests only where they protect the persistence and authorization rules that will be maintained.

## Feature scope

No new product features are needed to make this project useful. The saved-discussions board and persistence are already the main capability expansion. Prioritize correctness, access control, safe credential handling, and reliable deployment first. Optional later additions should solve a demonstrated need: transcript export, search/filtering for saved discussions, or real-time streaming if users need live updates across clients. Avoid adding more provider integrations until the existing providers and session flow are reliable.

## Overall assessment

The project is in an active persistence and session-management phase, rather than a feature-complete or production-hardened state. The highest-risk items are plaintext API keys in prompt files and unauthenticated access to globally list/read/change sessions. The most important architectural decision is to standardize on one persistent database and make the saved-session API secure and consistent before continuing UI expansion.
