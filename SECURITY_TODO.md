# Security & Compliance TODO

## Immediate
- Rotate all Supabase credentials (anon key, service-role key, database password, CLI token) that were committed; update secrets in your deployment environment before the next build.
- Purge exposed secrets from git history (e.g., `git filter-repo`) and force-push a clean history after regenerating keys.
- Reconfigure local development to load secrets from a manager such as 1Password, Doppler, or direnv instead of `.env*` files.

## Follow-up
- Add an authenticated backend job (Edge Function / cron) to enforce security-log retention and GDPR deletions instead of running deletes from the browser.
- Run `npm audit` and address the 14 reported vulnerabilities (consider `npm audit fix` followed by targeted updates).
- Sweep remaining console statements throughout the codebase and replace with the structured `logger` as needed.
- Remove stale binaries (`supabase.exe`, `supabase.tar.gz`) and add them to `.gitignore`/`.npmignore` to keep the repo lean.
- Add automated tests around password recovery flows now that token logging is removed.

## Verification
- `npm run type-check`
- `npm run lint`
- `npm test`
- `npm run build`
