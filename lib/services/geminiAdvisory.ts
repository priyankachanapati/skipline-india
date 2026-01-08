/**
 * Smart Visit Advisory Service
 * 
 * This service provides AI-powered visit advisories using Gemini.
 * 
 * IMPORTANT ARCHITECTURE:
 * - Gemini does NOT generate crowd levels, wait times, or any raw data
 * - All factual data (crowdLevel, averageWaitTime, reportCount) comes from Firebase aggregation
 * - Gemini's role: Explain WHY and suggest WHEN based on existing aggregated data
 * 
 * Data Flow:
 * Firebase → Aggregation Logic → UI → Gemini (explanation only)
 * 
 * This design allows future data sources (government APIs, IoT, cameras) to be added
 * without changing the Gemini integration - Gemini will always receive aggregated data.
 */

import { OfficeType, CrowdLevel } from '../firebase/firestore';
import { AggregatedCrowdData } from './crowdAggregation';

export interface AdvisoryInput {
  officeType: OfficeType;
  city: string;
  aggregatedData: AggregatedCrowdData;
  timeOfDay: string;
  dayOfWeek?: string;
}

export interface AdvisoryResult {
  advisory: string;
  error?: string;
}

/**
 * Get Smart Visit Advisory from Gemini
 * 
 * This function:
 * - Takes aggregated data from Firebase (NOT raw data)
 * - Sends context to Gemini for explanation/advice only
 * - Returns human-readable advisory
 * - Fails gracefully if Gemini is unavailable
 */
export const getSmartVisitAdvisory = async (
  input: AdvisoryInput
): Promise<AdvisoryResult> => {
  try {
    const { officeType, city, aggregatedData, timeOfDay, dayOfWeek } = input;
    
    // Calculate last updated in minutes
    const lastUpdatedMinutes = aggregatedData.lastUpdated
      ? Math.floor((Date.now() - aggregatedData.lastUpdated) / 60000)
      : null;

    // Determine data source (user reports prioritized)
    const dataSource = aggregatedData.userReportCount > 0 ? 'user' : 'seed';

    console.log('[Gemini Advisory] Requesting advisory with aggregated data:', {
      officeType,
      city,
      crowdLevel: aggregatedData.crowdLevel,
      averageWaitTime: aggregatedData.averageWaitTime,
      reportCount: aggregatedData.reportCount,
      userReportCount: aggregatedData.userReportCount,
      dataSource,
      lastUpdatedMinutes,
    });

    const response = await fetch('/api/gemini/advisory', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        officeType,
        city,
        crowdLevel: aggregatedData.crowdLevel,
        averageWaitTime: aggregatedData.averageWaitTime,
        reportCount: aggregatedData.reportCount,
        lastUpdatedMinutes: lastUpdatedMinutes || 'unknown',
        dataSource,
        timeOfDay,
        dayOfWeek,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.error || `HTTP ${response.status}: Failed to get advisory`;
      console.error('[Gemini Advisory] API error:', {
        status: response.status,
        error: errorMessage,
      });
      throw new Error(errorMessage);
    }

    const data = await response.json();
    
    // Validate response has advisory
    if (!data.advisory || typeof data.advisory !== 'string') {
      throw new Error('Invalid response format from advisory API');
    }

    console.log('[Gemini Advisory] Advisory received successfully');
    
    return { advisory: data.advisory };
  } catch (error: any) {
    console.error('[Gemini Advisory] Error getting advisory:', {
      error: error.message,
      stack: error.stack,
    });
    
    // Re-throw error to let UI handle it gracefully
    // UI will show "Advisory temporarily unavailable" message
    throw error;
  }
};
