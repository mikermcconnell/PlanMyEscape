# Google Play Data Safety Mapping for PlanMyEscape

This document aligns the Google Play Console Data safety form with the app's implemented data flows. Reference the cited source files when completing or updating the questionnaire.

## Data Collection Overview

| Data Category | Data Type | Collected | Purpose | Optional / User Control | Shared With Third Parties | Source Reference |
|---------------|-----------|-----------|---------|-------------------------|----------------------------|------------------|
| Personal info | Email address, display name | Yes | Account creation, authentication, trip collaboration | Users can delete account (Privacy Settings → Delete Account) | No | src/pages/PrivacyPolicy.tsx:8-21, src/pages/PrivacySettings.tsx:248-266 |
| Personal info | Trip details (destinations, dates, group info) | Yes | Core trip planning functionality, syncing across devices | Users can edit/delete trips; account deletion purges associated data | No | src/pages/PrivacyPolicy.tsx:10-21, AI_PROJECT_NOTES.md:12-45 |
| Personal info | Location (user-provided trip destination text) | Yes | Tailor packing templates and itinerary context | Users choose whether to enter location; no device GPS access | No | src/pages/PrivacyPolicy.tsx:11-13 |
| App activity | Packing/meal/activity actions | Yes | Persist user-created content across sessions | Controlled through in-app CRUD actions and data deletion flow | No | AI_PROJECT_NOTES.md:23-45, src/utils/accountDeletion.ts:9-29 |
| App activity | Security events (anonymized hashes) | Yes | Fraud prevention, security auditing | Not user-controllable (required for safety) | No | src/utils/securityLogger.ts:13-105, SECURITY_AUDIT.md:42-48 |
| App info | Diagnostics & log IDs (hashed) | Yes | Detect authentication abuse, suspicious activity | Not user-controllable | No | src/utils/securityLogger.ts:13-105 |
| Analytics | Aggregate usage analytics (privacy-focused) | Yes (default on with opt-out) | Improve UX, understand feature usage | Toggle in Privacy Settings → Usage Analytics; opt-out wipes stored analytics keys | No (privacy-friendly provider, no user-level tracking) | src/pages/PrivacySettings.tsx:30-41 |

## Data Sharing Declaration

- **No personal or app activity data is sold or shared with third parties.** Supabase is the first-party backend service provider. (src/pages/PrivacyPolicy.tsx:24-33)
- Analytics uses a privacy-focused provider that does not track individual users; data remains aggregate. (src/pages/PrivacyPolicy.tsx:24-33, src/pages/CookiePolicy.tsx)

## Data Handling Details

- **Encryption in transit & at rest:** Managed by Supabase (TLS 1.3 / AES-256). (SECURITY_AUDIT.md:34-40)
- **Data retention:**
  - User content retained while the account is active; deletion completion promised within 30 days. (src/pages/PrivacyPolicy.tsx:31-33)
  - Security logs retained for 90 days, general user data for 365 days with scheduled cleanup. (src/utils/dataRetentionPolicy.ts:9-178)
- **Ephemeral processing:** Sensitive identifiers are hashed before storage and wiped from memory immediately. (src/utils/securityLogger.ts:22-83, src/utils/dataRetentionPolicy.ts:129-151)
- **Deletion controls:** Users trigger deletion from Privacy Settings; the delete_user Edge Function handles cascading deletes and removes the auth profile. (src/pages/PrivacySettings.tsx:248-266, src/utils/accountDeletion.ts:9-29, SUPABASE_DELETE_USER_FUNCTION.md)

## Optional Data Disclosure Notes

- **Location access:** Only text input from the user; no GPS permission requested in ndroid/app/src/main/AndroidManifest.xml:5-24.
- **Contacts, Photos/Media, Files:** Not collected. Leave unchecked.
- **Financial, Health, Messages:** Not collected. Leave unchecked.
- **Crash logs & Diagnostics:** Only anonymized security logs; update this file if a crash-reporting SDK is added.

## User Choice & Consent Mechanisms

- Analytics consent stored in localStorage key llow_analytics; opting out deletes nalytics_* and 	racking_* entries. (src/pages/PrivacySettings.tsx:30-41)
- Marketing emails and push notifications default to off until toggled by the user. (src/pages/PrivacySettings.tsx:44-57, src/pages/PrivacySettings.tsx:178-220)
- Data-sharing toggle controls optional contribution of anonymized trip data for recommendations. (src/pages/PrivacySettings.tsx:158-171)

## Action Items for Console Submission

1. Use this table to populate every section of the Google Play Data Safety questionnaire.
2. Upload/link the hosted privacy policy at https://planmyescape.ca/privacy (matches src/pages/PrivacyPolicy.tsx).
3. Confirm opt-in/opt-out defaults still align with the declaration before each release.
4. Revisit this document when new data types or third-party SDKs are introduced.
