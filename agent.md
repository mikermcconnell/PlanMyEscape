# Work Plan

- [x] Rotate signing assets: remove committed keystore binaries, strip secrets from keystore.properties, and document regenerated-key steps.
- [x] Fix Supabase cleanup filters: quote UUIDs (or use helper) so list deletions succeed and cover every .not('id','in', ...) call.
- [x] Harden release config: disable mixed content for Android WebView and switch verbose Supabase logging to the shared logger so production logs stay minimal.

Notes:
- After each step, update this file with status changes.
- Re-run targeted tests (manual or automated) once data sync code is fixed.
- Generate new release keystore and update local environment before building.
- Run manual packing/meals/shopping deletion flows to confirm Supabase cleanup after fix.
