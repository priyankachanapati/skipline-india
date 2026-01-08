import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini API (server-side only)
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { officeType, city } = body;

    console.log('[API Route] Gemini API called for suggestion:', {
      officeType,
      city,
      apiKeyPresent: !!process.env.GEMINI_API_KEY,
    });

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: 'Gemini API key not configured' },
        { status: 500 }
      );
    }

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

    const prompt = `Suggest the best time to visit a ${officeTypeNames[officeType] || officeType} in ${city}, India.
Provide a brief, practical suggestion in simple Indian English (2-3 sentences).
Consider typical Indian government office patterns: avoid peak hours, weekends, and month-ends.
Keep it helpful and realistic.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    console.log('[API Route] Gemini suggestion received:', text.substring(0, 100) + '...');

    return NextResponse.json({ suggestion: text });
  } catch (error: any) {
    console.error('[API Route] Gemini API error:', error);
    return NextResponse.json(
      { error: 'Failed to generate suggestion', details: error.message },
      { status: 500 }
    );
  }
}
