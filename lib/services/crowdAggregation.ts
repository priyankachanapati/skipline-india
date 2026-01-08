import { CrowdLevel, CrowdReport } from '../firebase/firestore';

/**
 * Aggregated crowd data result
 */
export interface AggregatedCrowdData {
  crowdLevel: CrowdLevel;
  averageWaitTime: number;
  reportCount: number;
  lastUpdated: number | null;
  userReportCount: number;
  timeWindowMinutes: number;
}

/**
 * Calculate current crowd level from recent reports
 * Prioritizes user reports over seed/system reports
 * Uses weighted voting: user reports count 2x, others count 1x
 */
export const calculateCrowdLevel = (reports: CrowdReport[]): CrowdLevel => {
  if (reports.length === 0) {
    return 'medium'; // Default to medium if no reports
  }

  // Weighted counts: user reports count 2x, others count 1x
  const counts = {
    low: 0,
    medium: 0,
    high: 0,
  };

  reports.forEach((report) => {
    const weight = report.source === 'user' ? 2 : 1; // User reports have 2x weight
    counts[report.crowdLevel] += weight;
  });

  // Return the most common level
  if (counts.high >= counts.medium && counts.high >= counts.low) {
    return 'high';
  } else if (counts.medium >= counts.low) {
    return 'medium';
  } else {
    return 'low';
  }
};

/**
 * Calculate average wait time from actual reports
 * Uses weighted average: user reports weighted 2x
 */
export const calculateAverageWaitTime = (reports: CrowdReport[]): number => {
  if (reports.length === 0) {
    return 30; // Default to 30 minutes if no reports
  }

  const timeMap: Record<CrowdLevel, number> = {
    low: 10,
    medium: 30,
    high: 60,
  };

  let totalWeightedTime = 0;
  let totalWeight = 0;

  reports.forEach((report) => {
    const weight = report.source === 'user' ? 2 : 1; // User reports weighted 2x
    const waitTime = timeMap[report.crowdLevel];
    totalWeightedTime += waitTime * weight;
    totalWeight += weight;
  });

  return Math.round(totalWeightedTime / totalWeight);
};

/**
 * Estimate waiting time based on crowd level
 * Simple mapping: low=10min, medium=30min, high=60min
 * @deprecated Use calculateAverageWaitTime for more accurate results from actual reports
 */
export const estimateWaitingTime = (crowdLevel: CrowdLevel): number => {
  const timeMap: Record<CrowdLevel, number> = {
    low: 10,
    medium: 30,
    high: 60,
  };
  return timeMap[crowdLevel];
};

/**
 * Aggregate crowd data from reports within time window
 * Computes: crowd level, average wait time, report count, last updated time
 * User reports always override seed/system reports when available
 */
export const aggregateCrowdData = (
  reports: CrowdReport[],
  timeWindowMinutes: number = 60
): AggregatedCrowdData => {
  // Filter reports within time window (already done in getRecentCrowdReports, but double-check)
  const now = Date.now();
  const timeWindowMs = timeWindowMinutes * 60 * 1000;
  const recentReports = reports.filter(r => r.timestamp >= (now - timeWindowMs));

  // Separate user reports from others
  const userReports = recentReports.filter(r => r.source === 'user');
  const otherReports = recentReports.filter(r => r.source !== 'user');

  // If we have user reports, use only those. Otherwise, use all reports.
  const reportsToUse = userReports.length > 0 ? userReports : otherReports;

  console.log('[Aggregation] Aggregating crowd data:', {
    totalReports: recentReports.length,
    userReports: userReports.length,
    otherReports: otherReports.length,
    reportsUsed: reportsToUse.length,
    timeWindow: `${timeWindowMinutes} minutes`,
  });

  const crowdLevel = calculateCrowdLevel(reportsToUse);
  const averageWaitTime = calculateAverageWaitTime(reportsToUse);
  const reportCount = recentReports.length;
  const lastUpdated = getLastUpdatedTime(recentReports);

  return {
    crowdLevel,
    averageWaitTime,
    reportCount,
    lastUpdated,
    userReportCount: userReports.length,
    timeWindowMinutes,
  };
};

/**
 * Get the most recent report timestamp
 */
export const getLastUpdatedTime = (reports: CrowdReport[]): number | null => {
  if (reports.length === 0) {
    return null;
  }
  return Math.max(...reports.map((r) => r.timestamp));
};

/**
 * Format timestamp to human-readable string
 */
export const formatTimestamp = (timestamp: number): string => {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) {
    return 'Just now';
  } else if (diffMins < 60) {
    return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
  } else if (diffHours < 24) {
    return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  } else if (diffDays < 7) {
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  } else {
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  }
};
