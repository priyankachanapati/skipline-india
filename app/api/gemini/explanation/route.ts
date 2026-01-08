import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini API (server-side only)
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { officeType, crowdLevel, city, timeOfDay, dayOfWeek } = body;

    console.log('[API Route] Gemini API called with:', {
      officeType,
      crowdLevel,
      city,
      timeOfDay,
      dayOfWeek,
      apiKeyPresent: !!process.env.GEMINI_API_KEY,
    });

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: 'Gemini API key not configured' },
        { status: 500 }
      );
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

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

    const prompt = `You are helping Indian citizens understand why a government office might be crowded. 
Provide a brief, simple explanation in Indian English (2-3 sentences max).

Office Type: ${officeTypeNames[officeType] || officeType}
Current Crowd Level: ${crowdLevel}
City: ${city}
${timeOfDay ? `Time: ${timeOfDay}` : ''}
${dayOfWeek ? `Day: ${dayOfWeek}` : ''}

Explain why this office might be ${crowdLevel === 'high' ? 'crowded' : crowdLevel === 'medium' ? 'moderately busy' : 'less crowded'} right now. 
Keep it simple, practical, and helpful. Don't make up specific facts - just general patterns.
Use simple Indian English that's easy to understand.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    console.log('[API Route] Gemini response received:', text.substring(0, 100) + '...');

    return NextResponse.json({ explanation: text });
  } catch (error: any) {
    console.error('[API Route] Gemini API error:', error);
    return NextResponse.json(
      { error: 'Failed to generate explanation', details: error.message },
      { status: 500 }
    );
  }
}
