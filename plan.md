http://plan.md
# Landing Page Redesign Plan

**Overall Progress:** `100%`

## Tasks:

- [x] 🟩 **Step 1: Prepare landing assets**
  - [x] 🟩 Capture a current Trip Overview screenshot plus optimize the five provided screens into consistent `.webp` hero assets
  - [x] 🟩 Document descriptive alt text and store assets under `public/media/landing/`

- [x] 🟩 **Step 2: Re-architect landing page scaffolding**
  - [x] 🟩 Break `LandingPage.tsx` into focused subcomponents (navigation, hero, sections, footer) while preserving Supabase auth wiring
  - [x] 🟩 Replace header navigation with PlanMyEscape-relevant labels (`Overview`, `Features`, `Plans`, `Learn`, `Get Started`)

- [x] 🟩 **Step 3: Implement hero collage experience**
  - [x] 🟩 Build centered phone mockup using Trip Overview screenshot with primary CTA opening the Supabase auth modal
  - [x] 🟩 Arrange surrounding screenshot cards with brand-colored frames, recommended hover/float animations, and responsive fallbacks

- [x] 🟩 **Step 4: Refresh supporting sections**
  - [x] 🟩 Redesign feature highlights, trip-type grid, and final CTA to match new aesthetic while keeping copy aligned to current product value
  - [x] 🟩 Introduce subtle scroll-triggered animations using the existing `useReveal` hook or a lightweight alternative

- [x] 🟩 **Step 5: Accessibility and consistency checks**
  - [x] 🟩 Apply descriptive alt text, confirm gradient/contrast meet WCAG using existing green palette, and ensure animations respect `prefers-reduced-motion`
  - [x] 🟩 Verify CTA, sign-in modal, and auth redirects continue to function as before

- [x] 🟩 **Step 6: Validation and handoff**
  - [x] 🟩 Run local smoke tests (`npm start`, `npm run build`) and adjust layout issues across key breakpoints
  - [x] 🟩 Update internal notes with asset locations and maintenance guidance
