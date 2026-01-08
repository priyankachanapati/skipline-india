import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Content } from '@google/generative-ai';

// Force Node.js runtime (server-side only)
export const runtime = 'nodejs';

// Initialize Gemini API (server-side only)
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

/**
 * Smart Visit Advisory API Route
 * 
 * IMPORTANT: Gemini does NOT generate crowd levels or wait times.
 * It ONLY provides explanations and advice based on existing aggregated data from Firebase.
 * 
 * All factual data (crowdLevel, averageWaitTime, reportCount) comes from Firebase aggregation.
 * Gemini's role: Explain WHY and suggest WHEN to visit.
 */
export async function POST(request: NextRequest) {
  try {
    // Validate request body
    const body = await request.json();
    const {
      officeType,
      city,
      crowdLevel,
      averageWaitTime,
      reportCount,
      lastUpdatedMinutes,
      dataSource,
      timeOfDay,
    } = body;

    // Validate required fields
    if (!officeType || !city || !crowdLevel) {
      console.error('[API Route] Missing required fields:', { officeType, city, crowdLevel });
      return NextResponse.json(
        { error: 'Missing required fields: officeType, city, and crowdLevel are required' },
        { status: 400 }
      );
    }

    // Validate crowdLevel is valid
    if (!['low', 'medium', 'high'].includes(crowdLevel)) {
      console.error('[API Route] Invalid crowdLevel:', crowdLevel);
      return NextResponse.json(
        { error: 'Invalid crowdLevel. Must be "low", "medium", or "high"' },
        { status: 400 }
      );
    }

    // Validate numeric fields
    if (typeof averageWaitTime !== 'number' || averageWaitTime < 0) {
      console.error('[API Route] Invalid averageWaitTime:', averageWaitTime);
      return NextResponse.json(
        { error: 'Invalid averageWaitTime. Must be a non-negative number' },
        { status: 400 }
      );
    }

    if (typeof reportCount !== 'number' || reportCount < 0) {
      console.error('[API Route] Invalid reportCount:', reportCount);
      return NextResponse.json(
        { error: 'Invalid reportCount. Must be a non-negative number' },
        { status: 400 }
      );
    }

    console.log('[API Route] Gemini Advisory called with validated data:', {
      officeType,
      city,
      crowdLevel,
      averageWaitTime,
      reportCount,
      lastUpdatedMinutes,
      dataSource,
      timeOfDay,
      apiKeyPresent: !!process.env.GEMINI_API_KEY,
    });

    // Check API key
    if (!process.env.GEMINI_API_KEY) {
      console.error('[API Route] Gemini API key not configured');
      return NextResponse.json(
        { error: 'Gemini API key not configured' },
        { status: 500 }
      );
    }

    // Use gemini-1.5-flash model (faster and more cost-effective)
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const officeTypeNames: Record<string, string> = {
      passport: 'Passport Office',
      aadhaar: 'Aadhaar Enrollment Center',
      driving_license: 'RTO (Driving License Office)',
      ration_card: 'Ration Card Office',
      birth_certificate: 'Birth Certificate Office',
      police_station: 'Police Station',
      municipal_corporation: 'Municipal Corporation',
      other: 'Government Office',
    };

    const officeName = officeTypeNames[officeType] || officeType;
    
    // Build context-aware prompt
    let dataQualityNote = '';
    if (dataSource === 'seed') {
      dataQualityNote = 'NOTE: This data is from demo/seed sources, not real-time user reports.';
    } else if (reportCount < 3) {
      dataQualityNote = 'NOTE: Confidence is low as there are very few reports (less than 3).';
    }

    const prompt = `You are helping Indian citizens decide when to visit a government office. 
Provide a brief, practical advisory in simple Indian English (2-3 sentences maximum).

IMPORTANT RULES:
- Do NOT generate or invent crowd levels or wait times
- Only explain and advise based on the provided data
- Never claim certainty - use phrases like "might be", "could be", "likely"
- Keep it helpful and realistic

CONTEXT:
Office: ${officeName} in ${city}
Current Crowd Level: ${crowdLevel} (from ${reportCount} report${reportCount !== 1 ? 's' : ''})
Average Wait Time: ${averageWaitTime} minutes
Last Updated: ${lastUpdatedMinutes} minutes ago
Time of Day: ${timeOfDay}
${dataQualityNote ? `\n${dataQualityNote}` : ''}

TASK:
1. Briefly explain why the crowd might be ${crowdLevel} right now (consider time of day, day of week patterns in India)
2. Suggest a better time to visit if the crowd is high/medium, or confirm if it's a good time
3. Keep it practical and India-specific

Use simple, friendly language that's easy to understand. Don't use technical terms.`;

    // Prepare structured content for Gemini API
    const contents: Content[] = [
      {
        role: 'user',
        parts: [{ text: prompt }],
      },
    ];

    // Generate advisory from Gemini using structured contents format
    const result = await model.generateContent({ contents });
    const response = await result.response;
    const text = response.text();

    if (!text || text.trim().length === 0) {
      console.error('[API Route] Gemini returned empty response');
      return NextResponse.json(
        { error: 'Gemini returned empty response' },
        { status: 500 }
      );
    }

    const advisory = text.trim();
    console.log('[API Route] Gemini Advisory received successfully:', advisory.substring(0, 100) + '...');

    // Return success response with advisory
    return NextResponse.json({ advisory }, { status: 200 });
  } catch (error: any) {
    // Only return 500 if Gemini truly fails (not validation errors)
    console.error('[API Route] Gemini Advisory error:', {
      error: error.message,
      stack: error.stack,
      name: error.name,
    });

    // Check if it's a validation error (should have been caught earlier)
    if (error.message?.includes('Missing required') || error.message?.includes('Invalid')) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    // Gemini API error - return 500
    return NextResponse.json(
      { error: 'Failed to generate advisory from Gemini', details: error.message },
      { status: 500 }
    );
  }
}
