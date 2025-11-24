# Google Play Pre-Launch Checklist – PlanMyEscape

Follow these steps before promoting a build from closed testing to production.

## 1. Code & Build Integrity
- [ ] Merge all release branches into main and tag the version (e.g., 2.2.0).
- [ ] Run 
pm install, 
pm run build, 
pm run mobile:build on a clean machine.
- [ ] Execute static checks: 
pm run lint, 
pm run type-check.
- [ ] Run automated tests; add new tests for any uncovered critical flows.
- [ ] Capture 
pm audit --production results and resolve high/critical advisories.
- [ ] Verify the Android project produces a signed AAB with the secure signing workflow (MOBILE_DEPLOYMENT_GUIDE.md).
- [ ] Confirm the delete_user Edge Function is deployed and returns { success: true } in staging (SUPABASE_DELETE_USER_FUNCTION.md).

## 2. Functional QA (Mobile)
- [ ] Smoke test on at least two devices / emulators (minSdk 23 and targetSdk 35).
- [ ] Validate offline usage: create a trip offline, modify packing items, reconnect and confirm sync.
- [ ] Exercise Supabase auth flows (Email, Google, Facebook) end-to-end.
- [ ] Walk through packing, meals, shopping, and activity planners with group collaboration enabled.
- [ ] Toggle analytics, marketing, notifications, and data-sharing switches; ensure defaults match the Data Safety declaration and persistence works after relaunch.
- [ ] Trigger account deletion and verify records disappear from Supabase tables and security_logs.

## 3. Security & Compliance
- [ ] Complete the "Security QA Action Plan" tasks in SECURITY_AUDIT.md.
- [ ] Review GOOGLE_PLAY_DATA_SAFETY.md and confirm responses still match app behavior.
- [ ] Check that the in-app privacy policy, terms, cookie policy, and new report-content modal load correctly.
- [ ] Validate the reporting mailbox routes to the on-call team (UGC_REPORTING.md).

## 4. Play Console Submission Prep
- [ ] Prepare store-listing assets using GOOGLE_PLAY_STORE_LISTING.md.
- [ ] Draft release notes summarizing user-facing changes and compliance fixes.
- [ ] Complete the Content Rating questionnaire and download the result PDF.
- [ ] Fill out the Data Safety form; capture screenshots of each section for internal records.
- [ ] Upload the signed AAB, confirm the signature report, and start the Pre-launch Report run.

## 5. Pre-Launch Report & Beta Validation
- [ ] Address issues flagged by the automated Pre-launch Report (crashes, accessibility, security).
- [ ] Run a final closed testing round; gather tester sign-off for critical journeys.
- [ ] Freeze code once validation is complete.

## 6. Release & Post-Launch Monitoring
- [ ] Roll out to production using a staged percentage (e.g., 20%) and watch Android Vitals.
- [ ] Monitor Supabase logs/security events for anomalies during the first 72 hours.
- [ ] Keep a hotfix branch ready and document rollback steps if regressions appear.
- [ ] Announce the release only after metrics stay healthy.

Keep this checklist with each release to avoid surprises during Google Play reviews.
