# PlanMyEscape Development Context & Philosophy

## 🎨 App Vision & Vibe
**PlanMyEscape** is designed to be the camping companion that feels like a helpful friend, not a chore list. We prioritize:
- **Simplicity over features** - Every feature should feel natural and necessary
- **Mobile-first experience** - Most users will be on phones while packing/shopping
- **Offline resilience** - Camping means spotty internet; the app should work everywhere
- **Group coordination** - Make it easy for groups to plan together without friction

## 🏗️ Architecture Decisions

### Why Hybrid Storage?
- **Problem**: Users start planning trips before creating accounts
- **Solution**: Local-first with seamless Supabase sync on sign-in
- **Benefit**: Zero friction to start, full features when ready

### Why Templates?
- **Problem**: Re-entering packing lists for every trip is tedious
- **Solution**: Smart defaults + user-saved templates
- **Benefit**: 80% of the work done automatically

### Why Group Assignments?
- **Problem**: "Who's bringing the tent?" conversations
- **Solution**: Visual group assignments with color coding
- **Benefit**: Clear responsibility without micromanagement

## 🚀 Performance Priorities
1. **Instant interactions** - Optimistic updates everywhere
2. **Debounced saves** - Don't spam the network
3. **Smart caching** - Templates and gear lists rarely change
4. **Progressive enhancement** - Core features work offline

## 🎯 User Journey Map
```
Anonymous User → Local Storage → Sign Up → Data Migration → Full Features
      ↓                              ↑
   Quick Trip                    Return User
   Planning                     (Supabase)
```

## 💡 Feature Development Guidelines

### Before Adding a Feature, Ask:
1. **Does this make camping easier or harder?**
2. **Will this work on a phone in the woods?**
3. **Can my non-technical friend understand this?**
4. **Does this feature deserve the complexity it adds?**

### UI/UX Principles
- **Progressive disclosure** - Show advanced features only when needed
- **Smart defaults** - Guess what the user wants (but let them change it)
- **Visual feedback** - Every action should feel responsive
- **Forgiveness** - Make it easy to undo/change things

## 🐛 Known Pain Points & Solutions

### Current Challenges:
1. **TypeScript strictness** - Vercel builds are stricter than local
   - Solution: Always run `npm run type-check` before pushing

2. **Group coordination complexity** - Balance features vs simplicity
   - Solution: Hide group features unless explicitly enabled

3. **Template management** - Users confused about defaults vs saved
   - Solution: Clear visual distinction (implemented)

## 🔮 Future Considerations

### Near-term Improvements:
- **Offline PWA** - Full offline capability with service workers
- **Share lists** - Non-users can view shared lists (read-only)
- **Smart suggestions** - ML-based packing suggestions based on trip type
- **Weather integration** - Adjust packing based on forecast

### Long-term Vision:
- **Community templates** - Share templates with other campers
- **Gear library** - Track your camping gear across trips
- **Trip memories** - Photo journals and trip reports
- **Campsite integration** - Reserve sites, get directions

## 🛠️ Developer Experience Goals
- **Fast feedback loops** - Hot reload, instant saves
- **Clear error messages** - Know what went wrong and how to fix it
- **Consistent patterns** - Similar features work similarly
- **Self-documenting code** - Code should tell the story

## 📝 Testing Philosophy
- **User journey tests** > Unit tests
- **Critical path coverage** - Test what users actually do
- **Visual regression** - Catch UI breaks early
- **Performance budgets** - Keep the app fast

## 🤝 Contribution Guidelines
When contributing, maintain the vibe:
- **Keep it simple** - Complexity should earn its place
- **Think mobile** - If it doesn't work on phone, it doesn't work
- **Be helpful** - Error messages should guide, not scold
- **Stay camping-focused** - Every feature should make trips better
## 🚨 Incident Log: Firestore Connection Blocking (Dec 2025)

### Issue
Authentication and data loading failed in production with `net::ERR_BLOCKED_BY_CLIENT` errors on Firestore network requests. The app would hang indefinitely on the loading screen.

### Root Cause
Vercel environment variables (`REACT_APP_FIREBASE_PROJECT_ID`, etc.) contained invisible trailing newline characters (`\n`). This likely happened during copy-paste into the Vercel dashboard. These newlines were injected into the Firestore connection URLs (e.g., `.../databases/(default)%0A`), causing the browser or firewall to block the malformed requests.

### Fix
1.  **Code Hardening:** Updated `firebaseConfig.ts` to explicitly `.trim()` all environment variables before using them in the Firebase configuration.
    `	ypescript
    const firebaseConfig = {
      apiKey: process.env.REACT_APP_FIREBASE_API_KEY?.trim(),
      // ...
    };
    `
2.  **Infrastructure Cleanup:** Removed and re-added clean environment variables in Vercel using the CLI (avoiding PowerShell `echo` which adds CRLF).

### Lesson Learned
Always sanitize environment inputs in the code layer. Do not trust that the hosting platform or deployment pipeline will strip whitespace.
