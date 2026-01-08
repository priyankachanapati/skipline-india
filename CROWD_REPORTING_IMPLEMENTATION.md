# User-Generated Crowd Reporting & Aggregation Implementation

## ✅ Implementation Complete

All requirements have been implemented for user-generated crowd reporting with time-based aggregation.

---

## 📋 Requirements Met

### 1. ✅ Crowd Check-In System
- **Location**: `app/office/[id]/page.tsx`
- **Implementation**: Low/Medium/High buttons for crowd reporting
- **Authentication**: Users must sign in (anonymous or Google) to submit reports
- **UI**: Three color-coded buttons (Green=Low, Yellow=Medium, Red=High)

### 2. ✅ Store Submissions with source="user"
- **Location**: `lib/firebase/firestore.ts` - `submitCrowdReport()`
- **Implementation**: All user submissions are stored with `source: 'user'` field
- **Data Structure**:
  ```typescript
  {
    officeId: string,
    crowdLevel: 'low' | 'medium' | 'high',
    timestamp: number,
    userId: string | null,
    source: 'user' // Always 'user' for user submissions
  }
  ```

### 3. ✅ Aggregate Reports from Last 30-60 Minutes
- **Location**: `lib/firebase/firestore.ts` - `getRecentCrowdReports()`
- **Implementation**: 
  - Filters reports within configurable time window (default: 60 minutes)
  - Queries Firestore with timestamp filtering
  - Returns only reports from the specified time window
- **Time Window**: Configurable (30-60 minutes), default is 60 minutes

### 4. ✅ Compute Aggregated Metrics
- **Location**: `lib/services/crowdAggregation.ts` - `aggregateCrowdData()`
- **Computed Values**:
  - **Crowd Level**: Weighted majority voting (user reports count 2x)
  - **Average Wait Time**: Weighted average from actual reports (user reports weighted 2x)
  - **Report Count**: Total number of reports in time window
  - **Last Updated Time**: Most recent report timestamp
  - **User Report Count**: Number of user-generated reports

### 5. ✅ User Data Overrides Seed Data
- **Location**: `lib/services/crowdAggregation.ts` - `aggregateCrowdData()`
- **Implementation**:
  - User reports are prioritized and weighted 2x in calculations
  - If user reports exist, only user reports are used for aggregation
  - If no user reports, falls back to seed/system reports
  - User reports are sorted first in the results array

---

## 🔧 Technical Details

### Data Model

**CrowdReport Interface:**
```typescript
interface CrowdReport {
  id: string;
  officeId: string;
  crowdLevel: 'low' | 'medium' | 'high';
  timestamp: number; // Unix timestamp in milliseconds
  userId?: string;
  source: 'user' | 'seed' | 'system'; // NEW: Source tracking
}
```

### Aggregation Logic

**Weighted Voting:**
- User reports: Weight = 2
- Seed/System reports: Weight = 1
- Crowd level determined by weighted majority

**Average Wait Time Calculation:**
- Uses weighted average: `(sum of waitTime × weight) / sum of weights`
- Wait time mapping: low=10min, medium=30min, high=60min

**Time Window Filtering:**
- Default: 60 minutes
- Configurable: 30-60 minutes
- Only reports within time window are considered

### Firestore Queries

**Query Structure:**
```typescript
query(
  collection(db, 'crowd_reports'),
  where('officeId', '==', officeId),
  orderBy('timestamp', 'desc'),
  limit(limitCount)
)
```

**Time Filtering:**
- Applied in memory after query (for reliability)
- Filters reports where `timestamp >= (now - timeWindowMs)`

---

## 📊 UI Updates

### Office Detail Page

**Enhanced Display:**
- Shows "Average Waiting Time" (instead of estimated)
- Displays report count: "Based on X reports (last 60 min)"
- Shows user report count: "X user reports in last hour"
- Data source label: "User-reported" or "Aggregated"
- Indicates when user data is prioritized

**Example Display:**
```
Average Waiting Time: 35 min
Based on 8 reports (last 60 min)

Last Updated: 15 minutes ago
3 user reports in last hour

📊 Data Source: User-reported (Firebase Firestore, last 60 minutes) • User data prioritized
```

---

## 🔍 Console Logging

All operations are logged for debugging:

**Firebase Operations:**
```
[Firebase] Writing user crowd report to Firestore: { officeId, crowdLevel, userId, source: 'user' }
[Firebase] User crowd report written successfully: { reportId, officeId, source: 'user' }
[Firebase] Querying Firestore for crowd reports: { officeId, timeWindowMinutes: 60, ... }
[Firebase] Crowd reports retrieved: { totalReports, userReports, otherReports, ... }
```

**Aggregation Operations:**
```
[Aggregation] Aggregating crowd data: { totalReports, userReports, otherReports, reportsUsed, timeWindow }
[Office Detail] Aggregated crowd data: { crowdLevel, averageWaitTime, reportCount, userReportCount, ... }
```

---

## 🧪 Testing

### Test Scenarios

1. **Submit User Report:**
   - Click Low/Medium/High button
   - Sign in if needed
   - Report is stored with `source: 'user'`
   - UI updates immediately with new aggregated data

2. **View Aggregated Data:**
   - Open office detail page
   - See aggregated metrics from last 60 minutes
   - User reports are prioritized

3. **Time Window Filtering:**
   - Reports older than 60 minutes are excluded
   - Only recent reports affect crowd level

4. **User Data Priority:**
   - If user reports exist, only user reports are used
   - Seed/system reports are fallback only

---

## 📝 Files Modified

1. **`lib/firebase/firestore.ts`**
   - Added `ReportSource` type and `source` field to `CrowdReport`
   - Updated `submitCrowdReport()` to store `source: 'user'`
   - Updated `getRecentCrowdReports()` to filter by time window and prioritize user reports

2. **`lib/services/crowdAggregation.ts`**
   - Added `AggregatedCrowdData` interface
   - Added `calculateAverageWaitTime()` function
   - Added `aggregateCrowdData()` function
   - Updated `calculateCrowdLevel()` to use weighted voting

3. **`app/office/[id]/page.tsx`**
   - Updated to use `aggregateCrowdData()` instead of simple calculations
   - Added display of report count and user report count
   - Enhanced UI with aggregation details

4. **`app/search/page.tsx`**
   - Updated to use new aggregation logic
   - Uses 60-minute time window for all office queries

---

## ✅ Validation Checklist

- [x] User reports stored with `source="user"`
- [x] Reports filtered by 30-60 minute time window
- [x] Crowd level computed from aggregated reports
- [x] Average wait time calculated from actual reports
- [x] Report count displayed
- [x] Last updated time shown
- [x] User reports prioritized over seed data
- [x] UI shows aggregation details
- [x] Console logs prove all operations

---

## 🚀 Usage

### Submit a Crowd Report:
1. Navigate to office detail page
2. Click Low/Medium/High button
3. Sign in if prompted
4. Report is submitted with `source: 'user'`
5. Aggregated data updates immediately

### View Aggregated Data:
- Office detail page shows:
  - Aggregated crowd level (weighted by user reports)
  - Average wait time (from actual reports)
  - Report count (last 60 minutes)
  - User report count
  - Last updated timestamp

---

**Implementation Complete! 🎉**

All requirements have been met and the system is ready for use.
