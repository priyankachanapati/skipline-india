# Debug Guide: Crowd Report Submission

## Fixed Issues

### 1. ✅ Firestore Security Rules
- **Problem**: Rules didn't allow `source` field
- **Fix**: Updated rules to allow `source` field with values ['user', 'seed', 'system']
- **File**: `firestore.rules`

### 2. ✅ Error Handling
- **Problem**: Generic error messages, no detailed logging
- **Fix**: Added comprehensive error logging at every step
- **Files**: `lib/firebase/firestore.ts`, `app/office/[id]/page.tsx`

### 3. ✅ Payload Validation
- **Problem**: No validation before sending to Firestore
- **Fix**: Added payload validation in `submitCrowdReport()`
- **File**: `lib/firebase/firestore.ts`

### 4. ✅ Database Initialization
- **Problem**: No check if db is initialized
- **Fix**: Added initialization checks and logging
- **File**: `lib/firebase/config.ts`

### 5. ✅ Timestamp Handling
- **Problem**: Potential issues with timestamp format
- **Fix**: Added timestamp normalization and validation
- **File**: `lib/firebase/firestore.ts`

## Testing Steps

1. **Open Browser Console** (F12)
2. **Navigate to Office Detail Page**
3. **Click Low/Medium/High Button**
4. **Check Console Logs**:
   ```
   [UI] Submitting crowd report: { officeId, crowdLevel, isAuthenticated }
   [UI] User authenticated: { uid, isAnonymous }
   [Firebase] Writing user crowd report to Firestore: { ... }
   [Firebase] User crowd report written successfully: { reportId, ... }
   [UI] Report submitted successfully: { reportId }
   [UI] Reloading crowd data after submission...
   [UI] Reports retrieved after submission: { totalReports, userReports }
   [UI] Aggregated data after submission: { ... }
   ```

## Expected Behavior After Fix

1. ✅ Clicking Low/Medium/High creates Firestore document
2. ✅ UI shows: "Based on 1 report (last 60 min)"
3. ✅ UI shows: "Last updated: just now"
4. ✅ Success message appears
5. ✅ Crowd level updates immediately

## Common Errors & Solutions

### Error: "Permission denied"
- **Cause**: User not authenticated or Firestore rules too strict
- **Solution**: Ensure user is signed in (anonymous or Google)

### Error: "Firestore database not initialized"
- **Cause**: Firebase config missing or incorrect
- **Solution**: Check `.env.local` has all Firebase variables

### Error: "Invalid payload"
- **Cause**: Missing required fields
- **Solution**: Check console logs for payload details

### Error: "User must be authenticated"
- **Cause**: Auth state not properly checked
- **Solution**: Sign in before submitting report

## Firestore Rules (Updated)

```javascript
allow create: if request.auth != null 
              && request.resource.data.keys().hasAll(['officeId', 'crowdLevel', 'timestamp'])
              && request.resource.data.crowdLevel in ['low', 'medium', 'high']
              && request.resource.data.timestamp is int
              && (!('source' in request.resource.data) || request.resource.data.source in ['user', 'seed', 'system'])
              && (!('userId' in request.resource.data) || request.resource.data.userId is string || request.resource.data.userId == null);
```

## Payload Structure

```typescript
{
  officeId: string,        // Required
  crowdLevel: 'low' | 'medium' | 'high',  // Required
  timestamp: number,       // Required (Unix timestamp in ms)
  userId: string | null,   // Optional
  source: 'user'          // Required (always 'user' for submissions)
}
```

## Next Steps

1. Deploy updated Firestore rules:
   ```bash
   firebase deploy --only firestore:rules
   ```

2. Test the submission flow
3. Check Firestore console to verify documents are created
4. Verify aggregation shows correct report count
