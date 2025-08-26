# Troubleshooting Guide

## 🔴 Common Issues & Solutions

### Build & Deployment Issues

#### TypeScript Errors on Vercel but not Local
**Problem**: Build works locally but fails on Vercel with TypeScript errors

**Solutions**:
```bash
# Always check TypeScript before pushing
npm run type-check

# Ensure TypeScript version matches
npm ls typescript  # Should be ~4.9.5
```

**Root Cause**: Vercel uses stricter TypeScript settings. Local React scripts may be more permissive.

#### "Object is possibly undefined" Errors
**Problem**: TypeScript strict null checks failing

**Solution**: Use proper null checking or non-null assertions
```typescript
// Bad
groupedItems[groupKey].push(item);

// Good - with check
if (groupedItems[groupKey]) {
  groupedItems[groupKey]!.push(item);
}

// Better - with optional chaining
groupedItems[groupKey]?.push(item);
```

#### Method Context Binding Issues
**Problem**: `this.method` loses context in array methods

**Solution**: Use arrow functions in map/filter
```typescript
// Bad
return data.map(this.mapItemFromDB);

// Good
return data.map(item => this.mapItemFromDB(item));
```

### Data & Storage Issues

#### Local Data Not Migrating to Supabase
**Problem**: User signs in but local data doesn't appear

**Check**:
1. Browser console for migration errors
2. Network tab for failed Supabase requests
3. Supabase dashboard for RLS policy issues

**Solution**:
```javascript
// Manual migration trigger (in browser console)
const tripIds = Object.keys(localStorage).filter(k => k.startsWith('trip_'));
await hybridDataService.migrateLocalDataToSupabase(tripIds);
```

#### Shopping List Not Auto-Populating
**Problem**: Items marked "needsToBuy" don't appear in shopping list

**Check**:
- Deleted ingredients list might be blocking items
- Group assignments might be filtering items

**Solution**:
```javascript
// Clear deleted ingredients (in browser console)
await hybridDataService.saveDeletedIngredients(tripId, []);
```

### UI/UX Issues

#### Group Assignment Dropdown Not Showing
**Problem**: Can't assign items to groups

**Check**: Trip must be coordinated
```javascript
// Trip must have isCoordinated: true
// AND have groups defined
```

#### Template Not Loading
**Problem**: Saved templates don't appear or load incorrectly

**Check**:
1. User must be signed in (templates are user-specific)
2. Template trip type must match current trip type
3. Check browser console for Supabase errors

### Performance Issues

#### Slow Saving/Loading
**Problem**: App feels sluggish when saving

**Solutions**:
1. Check if debouncing is working (150ms delay)
2. Verify optimistic updates are enabled
3. Check Network tab for duplicate requests

#### Memory Leaks
**Problem**: App slows down over time

**Check**:
- Cleanup in useEffect returns
- Event listener removal
- Timeout/interval clearing

## 🔧 Debug Commands

### Browser Console Commands
```javascript
// Check current user
const { data: { user } } = await supabase.auth.getUser();
console.log('Current user:', user);

// Check trip data
const trips = await hybridDataService.getTrips();
console.log('Trips:', trips);

// Force refresh shopping list
const items = await hybridDataService.getShoppingItemsWithMeals(tripId, meals);
console.log('Shopping items:', items);

// Check local storage
Object.keys(localStorage).forEach(key => {
  if (key.includes('trip') || key.includes('packing') || key.includes('meal')) {
    console.log(key, JSON.parse(localStorage.getItem(key)));
  }
});
```

### Database Queries (Supabase SQL Editor)
```sql
-- Check user's trips
SELECT * FROM trips WHERE user_id = auth.uid();

-- Check RLS policies
SELECT * FROM packing_items WHERE trip_id = 'TRIP_ID_HERE';

-- Verify template tables
SELECT * FROM packing_templates WHERE user_id = auth.uid();
SELECT * FROM meal_templates WHERE user_id = auth.uid();

-- Check for orphaned data
SELECT * FROM shopping_items 
WHERE trip_id NOT IN (SELECT id FROM trips);
```

## 🚨 Emergency Procedures

### Data Recovery
If user loses data:
1. Check localStorage backup
2. Check Supabase audit logs
3. Restore from browser cache

### Rollback Deployment
```bash
# Revert to last known good commit
git revert HEAD
git push

# Or reset to specific commit
git reset --hard <commit-hash>
git push --force
```

### Clear All Local Data (Nuclear Option)
```javascript
// Warning: User will lose all local data
localStorage.clear();
sessionStorage.clear();
window.location.reload();
```

## 📞 Support Escalation Path
1. Check this troubleshooting guide
2. Search closed GitHub issues
3. Check Supabase service status
4. Post in GitHub discussions
5. Create detailed bug report issue

## 🔍 Logging & Monitoring

### Enable Debug Logging
```javascript
// Add to browser console
localStorage.setItem('DEBUG_MODE', 'true');
window.location.reload();
```

### Check Security Logs
```sql
-- In Supabase SQL Editor
SELECT * FROM security_logs 
WHERE user_id = auth.uid() 
ORDER BY created_at DESC 
LIMIT 50;
```