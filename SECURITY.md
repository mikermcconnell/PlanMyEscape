# Security Documentation

## Security Architecture Overview

PlanMyEscape uses **Firebase** for authentication and **Firestore** for data storage, with comprehensive client-side security measures.

## Authentication

### Firebase Authentication
- Handled by Firebase Auth SDK
- Supports multiple providers: Email/Password, Google
- Session tokens are securely managed by Firebase client SDK
- Session management with 8-hour timeout and 30-minute inactivity timeout (see `authGuard.ts`)

### Session Security
- Activity tracking across user interactions
- Automatic session health checks every 5 minutes
- CSRF protection with cryptographic tokens (see `csrfProtection.ts`)

## Data Protection

### Firestore Security Rules
All Firestore collections have security rules that ensure users can only access their own data. Rules are defined in `firestore.rules`:

```javascript
match /packing_items/{itemId} {
  allow create: if request.auth != null && request.resource.data.user_id == request.auth.uid;
  allow read, update, delete: if request.auth != null && resource.data.user_id == request.auth.uid;
}
```

**Key principles:**
1. All operations require authentication (`request.auth != null`)
2. Write operations validate `user_id` matches authenticated user
3. Read/update/delete operations verify document ownership
4. No user can see or modify another user's data

### Protected Collections
- `trips` - User trip metadata
- `packing_items` - Packing list items
- `meals` - Meal planning data
- `shopping_items` - Shopping list items
- `gear_items` - Gear inventory
- `todo_items` - To-do lists
- `packing_templates` - User templates
- `meal_templates` - Meal templates
- `notes` - User notes
- `security_logs` - Security event logs

## Input Validation & Sanitization

### XSS Protection
- All user input is sanitized using **DOMPurify** (see `validation.ts`)
- No HTML tags or attributes are allowed in user content
- Suspicious activity patterns are detected and logged

### Schema Validation
- **Zod** schemas validate all data structures (see `enhancedValidation.ts`)
- Type-safe validation for trips, packing items, meals, expenses
- Business rule validation (e.g., packed items must be owned)

### Attack Detection
The system detects and logs suspicious patterns including:
- XSS attempts (`<script>`, `javascript:`, `data:`)
- SQL injection patterns
- Path traversal attempts
- Code injection attempts
- URL-encoded attacks

## Security Logging

Security events are logged to Firestore `security_logs` collection:
- Login attempts (successful and failed)
- Rate limit exceeded events
- Suspicious activity detection
- Authentication state changes

## Environment Configuration

### API Keys
Firebase configuration is loaded from environment variables:
- Development: `.env.development` (gitignored)
- Production: Set via deployment platform (Vercel, etc.)

**Required variables:**
- `REACT_APP_FIREBASE_API_KEY`
- `REACT_APP_FIREBASE_AUTH_DOMAIN`
- `REACT_APP_FIREBASE_PROJECT_ID`
- `REACT_APP_FIREBASE_STORAGE_BUCKET`
- `REACT_APP_FIREBASE_MESSAGING_SENDER_ID`
- `REACT_APP_FIREBASE_APP_ID`
- `REACT_APP_FIREBASE_MEASUREMENT_ID`

## Security Best Practices

1. **Environment Variables**: Never hardcode API keys in source code
2. **User Isolation**: Always filter data by authenticated user ID
3. **Input Validation**: Validate and sanitize all user input
4. **Security Logging**: Log security-relevant events for audit
5. **Rate Limiting**: Client-side rate limiting for sensitive operations
6. **Session Management**: Automatic timeout for inactive sessions

## Regular Security Tasks

1. Review security logs monthly
2. Audit Firestore rules when schema changes
3. Monitor for unusual access patterns
4. Keep Firebase SDK and dependencies updated
5. Review and rotate API keys periodically

## Emergency Procedures

If a security issue is discovered:
1. Immediately restrict access if necessary (disable Firebase rules)
2. Document the issue and resolution
3. Apply fixes to production ASAP
4. Review logs for any exploitation attempts
5. Notify affected users if data was compromised

## Reporting Security Issues

Please report security vulnerabilities responsibly by contacting the development team directly. Do not open public issues for security vulnerabilities.