# TODO: Fix "Fun and games" Category Display Issue

## Problem
The "Fun and games" category heading is not showing up in the packing list UI for group items, even though the category has been successfully changed in the data templates.

## What Was Completed
✅ **Battery pack moved from group to per person items** - All trip types now have battery pack as personal items (groupSize quantity, isPersonal: true)

✅ **Comfort category changed to Fun and games for group items** - All group items (isPersonal: false) that were in "Comfort" category are now in "Fun and games" category

✅ **Personal comfort items preserved** - All personal items (isPersonal: true) remain in "Comfort" category

## Remaining Task
🔲 **Investigate and fix "Fun and games" category heading display**

The issue is likely in one of these areas:
1. **Category definitions** - There may be a predefined list of category names in the UI components that doesn't include "Fun and games"
2. **Category sorting/filtering** - The UI might filter out unknown categories
3. **Category rendering logic** - The component that displays category headings might not handle new category names

## Files Changed
- `src/data/packingTemplates.ts` - Updated battery pack and category assignments

## Files to Investigate
- Components that display packing lists (likely in `src/components/` or `src/pages/PackingList.tsx`)
- Type definitions for categories (likely in `src/types/`)
- Any category constant definitions or mappings

## Search Keywords
- "category"
- "Comfort" 
- category headings/display logic
- packing list rendering

## Priority
High - User experience issue affecting new "Fun and games" category visibility