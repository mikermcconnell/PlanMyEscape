# Security Hardening Summary

## Credentials & Configuration
- Replaced tracked Supabase secrets with empty placeholders across `.env`, `.env.local`, `.env.supabase`, and related files.
- Added `SECURITY_TODO.md` outlining immediate credential rotation, history scrubbing, and longer-term follow-ups.
- Updated `src/supabaseClient.ts` to throw when Supabase environment variables are missing, enabling fail-fast deployments.

## Logging & Privacy
- Removed token and PII logging from password recovery flows, trip services, and hybrid storage; retained structured errors via `logger`.
- Realigned `securityLogger` to match the existing schema while hashing identifiers inside the `details` payload.

## Access Control & UX
- Restricted the Notes page to authenticated users and filtered by `user_id`; removed the unused Next.js notes page.
- Corrected the report dialog mail link and default template text.

## Stability Improvements
- Added guards around browser timers in data retention and hybrid data services to avoid duplicate intervals during hot reloads.
- Pruned unused dependencies and dead code (e.g., `express-rate-limit`, unused middleware/hook).

## Supabase Verification
- Populated `.env.local` with new Supabase keys.
- Ran `node scripts/testSupabaseConnection.js` to confirm:
  - Anon client can read from `trips`.
  - Service-role key can insert and remove a temporary record in `security_logs`.

## Next Steps
See `SECURITY_TODO.md` for credential rotation, git history cleanup, dependency audits, and follow-up testing.
