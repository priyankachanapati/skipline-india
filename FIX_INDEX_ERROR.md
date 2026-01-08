# Fix Firestore Index Error

## Error Message
```
Failed to submit report: The query requires an index. You can create it here: [link]
```

## Solution: Create Composite Index

Firestore requires a composite index for queries that filter by `officeId` and order by `timestamp`.

### Option 1: Use the Link (Quickest)
1. Click the link provided in the error message
2. It will open Firebase Console with the index pre-configured
3. Click "Create Index"
4. Wait 1-2 minutes for the index to build
5. Try submitting a report again

### Option 2: Deploy Index File (Recommended)
1. I've created `firestore.indexes.json` with the required index
2. Deploy it using Firebase CLI:
   ```bash
   firebase deploy --only firestore:indexes
   ```
3. Wait for the index to build (check Firebase Console)
4. Try submitting a report again

### Option 3: Manual Creation in Firebase Console
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `queueless-india-233e7`
3. Go to **Firestore Database** > **Indexes** tab
4. Click **Create Index**
5. Configure:
   - **Collection ID**: `crowd_reports`
   - **Fields to index**:
     - `officeId` (Ascending)
     - `timestamp` (Descending)
6. Click **Create**
7. Wait 1-2 minutes for index to build

## Index Configuration

The index is already configured in `firestore.indexes.json`:

```json
{
  "collectionGroup": "crowd_reports",
  "fields": [
    { "fieldPath": "officeId", "order": "ASCENDING" },
    { "fieldPath": "timestamp", "order": "DESCENDING" }
  ]
}
```

## Verify Index Status

1. Go to Firebase Console > Firestore > Indexes
2. Look for index on `crowd_reports` collection
3. Status should be "Enabled" (green checkmark)
4. If it says "Building", wait a few minutes

## After Index is Created

Once the index is built:
- ✅ Queries will work without errors
- ✅ Reports can be submitted successfully
- ✅ Aggregation will show correct report counts

## Quick Deploy Command

```bash
firebase deploy --only firestore:indexes
```

This will create the required index automatically.
