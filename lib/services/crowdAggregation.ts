import { CrowdLevel, CrowdReport } from '../firebase/firestore';

/**
 * Calculate current crowd level from recent reports
 * Uses simple majority voting from last N reports
 */
export const calculateCrowdLevel = (reports: CrowdReport[]): CrowdLevel => {
  if (reports.length === 0) {
    return 'medium'; // Default to medium if no reports
  }

  // Count occurrences of each level
  const counts = {
    low: 0,
    medium: 0,
    high: 0,
  };

  reports.forEach((report) => {
    counts[report.crowdLevel]++;
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
 * Estimate waiting time based on crowd level
 * Simple mapping: low=10min, medium=30min, high=60min
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
