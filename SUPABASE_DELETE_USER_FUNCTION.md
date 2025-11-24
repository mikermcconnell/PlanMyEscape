# Supabase delete_user Edge Function Requirements

Google Play's data deletion policy requires that PlanMyEscape let users remove their account and all associated content without manual intervention. The mobile client now expects a Supabase Edge Function named delete_user to perform this work securely with the service-role key.

## Expected Request/Response
- **HTTP method:** POST
- **Body:** { "user_id": "<uuid>" }
- **Success response:** { "success": true }
- **Failure response:** { "success": false, "message": "..." } (and non-2xx status code)

## Responsibilities
1. Authenticate the request using the service role key (Edge Functions run with elevated privileges).
2. Validate that the caller is the owner of the account.
3. Delete data from all user-owned tables (	rips, packing_items, meals, shopping_items, gear_items, 	odo_items, security_logs, etc.).
4. Delete any Supabase storage buckets or files tied to the user (if added in the future).
5. Call supabase.auth.admin.deleteUser(user_id) to remove the auth profile.
6. Return { success: true } once all steps complete.
7. Log failures and return an error payload; the client will instruct the user to contact support if the function fails.


## Directory Structure
- Function entry point: `supabase/functions/delete_user/index.ts`
- Local env template: `supabase/functions/delete_user/.env.example` (copy to `.env` when serving locally)

## Deployment Checklist
- [ ] Edge Function deployed in production project.
- [ ] Function secured so only authenticated users can request deletion of their own account (e.g., validate JWT passed by client).
- [ ] Automated test confirms cascading delete behavior in staging.
- [ ] Monitoring/alerting for failed deletions routed to support@planmyescape.app.
- [ ] Documentation updated in GOOGLE_PLAY_PRELAUNCH_CHECKLIST.md to confirm verification before every release.

Clients throw an error if the function is missing or returns success !== true. Ensure the backend is configured before promoting builds to production.
