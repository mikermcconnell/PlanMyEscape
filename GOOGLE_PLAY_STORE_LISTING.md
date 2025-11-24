# Google Play Store Listing Checklist – PlanMyEscape

Use this checklist to prepare every asset required for a successful production submission.

## Core Metadata
- **App name (30 chars max):** PlanMyEscape
- **Short description (80 chars max):** Plan stress-free group camping trips with smart packing, meals, and tasks.
- **Full description draft:**
  - Opening statement on collaborative trip planning.
  - Bullet the pillars: trip dashboard, smart packing lists, shared meal planner, unified shopping list, activity schedule, offline-first sync.
  - Close with privacy/security reassurance (Supabase, data control) and call to action.
- **Category:** Travel & Local → Trip planners.
- **Content rating questionnaire:** Complete after internal QA; expect “Everyone” or “Teen” depending on user-generated content answers.
- **Supported devices:** Phones and tablets; ensure screenshots reflect both.

## Visual Assets
- **App icon (512 × 512 PNG):** Verify Capacitior asset pipeline generates Play-compliant icon; export from design source.
- **Feature graphic (1024 × 500 PNG/JPG):** Create hero banner highlighting camping planning + group coordination.
- **Screenshots:**
  1. Trip dashboard overview (show tabs for packing, meals, activities).
  2. Smart packing list with status toggles.
  3. Meal planner with aggregated ingredients.
  4. Shared shopping list (needs-to-buy focus).
  5. Privacy settings screen demonstrating analytics opt-out & data deletion.
  - Capture on 16:9 (phone) and 7-inch tablet aspect ratios; annotate with short captions.
- **Optional promo video:** Upload to YouTube (16:9) if available.

## Policy & Contact Information
- **Privacy policy URL:** https://planmyescape.ca/privacy (ensure page live and matches in-app content).
- **Support email:** support@planmyescape.app (confirm mailbox monitored).
- **Developer website:** https://planmyescape.ca (landing page should describe mobile features).
- **Physical address:** Required for Play listing—verify company profile is up to date.

## Localization Strategy
- Start with en-US assets; plan translation once analytics show demand.
- Keep marketing copy simple for future localization.
- Confirm app UI supports chosen locales (right-to-left not required initially).

## Assets To Verify Before Submission
- [ ] QA pass for every screenshot device used.
- [ ] Verify text strings contain no unsupported emoji or all-caps words.
- [ ] Confirm storefront copy aligns with actual v2.2 functionality.
- [ ] Ensure privacy + security statements match GOOGLE_PLAY_DATA_SAFETY.md.
- [ ] Double-check icon background is transparent per Play requirements.
- [ ] Prepare changelog / "What’s new" summarizing major updates since closed testing.

## Helpful References
- Feature overview: AI_PROJECT_NOTES.md:12-45
- Security talking points: SECURITY_AUDIT.md:5-124
- Privacy controls: src/pages/PrivacySettings.tsx
- Offline-first positioning: DEVELOPMENT_CONTEXT.md:3-33

Maintain this checklist with each release to avoid missing Play Console requirements.
