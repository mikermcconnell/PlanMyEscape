# Security Documentation

## Recent Security Fixes

### SECURITY DEFINER View Issue (Fixed: 2025-08-26)

**Issue**: The `trip_performance_stats` view was flagged for using SECURITY DEFINER property, which could potentially bypass Row Level Security (RLS) policies.

**Resolution**: 
- Migration `20250826000001_force_remove_security_definer.sql` created to fix the issue
- View recreated without SECURITY DEFINER property
- Function `get_user_trip_performance_stats()` recreated to use SECURITY INVOKER (default)
- Access properly restricted with RLS enforcement

**Implementation Details**:
1. **View** (`trip_performance_stats`): 
   - Now restricted to postgres role only (admin use)
   - Does not use SECURITY DEFINER
   - Should not be directly accessed by application

2. **Function** (`get_user_trip_performance_stats()`):
   - Uses SECURITY INVOKER (default) - runs with calling user's permissions
   - Properly filters data using `auth.uid()`
   - RLS policies on underlying tables are enforced
   - This is what the application uses (via `tripService.getTripPerformanceStats()`)

## Security Architecture

### Row Level Security (RLS)
All database tables have RLS enabled with policies that ensure users can only access their own data:
- Each table has a `user_id` column that references the authenticated user
- Policies use `auth.uid()` to filter data to the current user
- No user can see or modify another user's data

### Authentication
- Handled by Supabase Auth
- Supports multiple providers: Email/Password, Google, Facebook
- Session tokens are securely managed by Supabase client

### Data Access Patterns
1. **Direct Table Access**: Protected by RLS policies
2. **Views**: Admin-only, restricted to postgres role
3. **Functions**: Use SECURITY INVOKER to respect RLS policies
4. **Application Layer**: Uses hybrid data service that respects auth state

### Security Best Practices
1. Never use SECURITY DEFINER unless absolutely necessary
2. Always filter data by `auth.uid()` in queries
3. Use RLS policies as the primary security mechanism
4. Functions should use SECURITY INVOKER (default) to respect RLS
5. Views intended for users should be wrapped in secure functions
6. Admin views should be restricted to postgres role

## Security Logging
All security-relevant events are logged to the `security_logs` table:
- Login attempts (successful and failed)
- Data access patterns
- System maintenance events
- Security configuration changes

## Regular Security Tasks
1. Review security logs monthly
2. Check for any SECURITY DEFINER views/functions quarterly
3. Audit RLS policies when schema changes
4. Monitor for unusual access patterns
5. Keep Supabase and dependencies updated

## Emergency Procedures
If a security issue is discovered:
1. Immediately restrict access if necessary
2. Create a migration to fix the issue
3. Document the issue and resolution in this file
4. Apply the fix to production ASAP
5. Review logs for any exploitation attempts