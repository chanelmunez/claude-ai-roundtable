# Implementation priorities

Use this as the working order for bringing the current session-persistence work to a safe, dependable state. Complete each item before moving on where it is a prerequisite.

## P0 — Before deployment with real users or data

- [ ] Revoke and rotate every provider credential exposed in the prompt files; remove the keys from prompt files and any shared copies. Check Git history and external sharing for exposure.
- [ ] Choose the access model (for example, authenticated per-user sessions) and enforce it on session list/read/create/update/delete and AI generation routes. Add ownership to the data model and verify it on every request.
- [ ] Keep the Supabase service role key server-only. Do not treat RLS as a substitute for application authorization when using that key.
- [ ] Validate API payloads and legal session status transitions. Enforce limits on request size, topic length, transcript context, selected participants, and allowed model IDs.
- [ ] Make generation use server-loaded session data and verify that the requested AI is a participant. Add per-user/session rate and concurrency limits to contain abuse and provider costs.

## P1 — Persistence correctness and deployment consistency

- [ ] Standardize on one database. The current repository uses Supabase; remove the unused SQLite implementation/dependency, or finish and document an intentional alternative.
- [ ] Make session creation and message/activity updates atomic or safely recoverable. Handle partial failures, missing sessions, and duplicate/retried requests.
- [ ] Confirm all database-backed routes use a compatible runtime, and document required environment variables and schema setup accurately.
- [ ] Ensure list/read/update/delete endpoints return consistent not-found and failure responses without leaking provider or database internals.

## P2 — UI lifecycle and operational reliability

- [ ] Cancel pending timers and requests when ending, switching, or deleting a session; ignore responses for stale session IDs.
- [ ] Check lifecycle mutation responses before updating local state, and present visible loading/error states. Confirm destructive deletion in the UI.
- [ ] Add provider timeouts and a bounded retry policy. Use idempotency keys wherever retries could trigger duplicate paid generations or messages.
- [ ] Decide whether SSE is needed. If not, remove or document the keepalive-only endpoint accurately; if yes, use a delivery mechanism that works across serverless instances.

## P3 — Performance and maintainability

- [ ] Load transcript context from the server and enforce a compact rolling window; paginate old transcript history.
- [ ] Replace 15-second full session-list polling with mutation-driven refresh and/or slower background refresh. Paginate the saved-session list as it grows.
- [ ] Review database indexes and message-count query cost against expected session volume.
- [ ] Update the README to describe only implemented behavior, supported runtimes, auth boundaries, persistence setup, and operational limits.
- [ ] After implementation, run lint/build and verify the full create → generate → reload/open → archive/resume → delete flow. Add focused automated coverage for authorization, status transitions, and persistence failures.

## Later, only if users need them

- Transcript export, saved-topic search/filtering, and true cross-client live streaming are reasonable additions. More provider integrations are lower priority than securing and stabilizing the providers already present.
