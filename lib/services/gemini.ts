import { GoogleGenerativeAI } from '@google/generative-ai';
import { OfficeType, CrowdLevel } from '../firebase/firestore';

// Initialize Gemini API
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

/**
 * Generate AI explanation for crowd level at an office
 * Uses Gemini API to provide human-readable explanations
 */
export const generateCrowdExplanation = async (
  officeType: OfficeType,
  crowdLevel: CrowdLevel,
  city: string,
  timeOfDay?: string,
  dayOfWeek?: string
): Promise<string> => {
  try {
    console.log('[Gemini] Generating crowd explanation with real data', {
      officeType,
      crowdLevel,
      city,
      timeOfDay,
      dayOfWeek,
    });
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    const officeTypeNames: Record<OfficeType, string> = {
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

Office Type: ${officeTypeNames[officeType]}
Current Crowd Level: ${crowdLevel}
City: ${city}
${timeOfDay ? `Time: ${timeOfDay}` : ''}
${dayOfWeek ? `Day: ${dayOfWeek}` : ''}

Explain why this office might be ${crowdLevel === 'high' ? 'crowded' : crowdLevel === 'medium' ? 'moderately busy' : 'less crowded'} right now. 
Keep it simple, practical, and helpful. Don't make up specific facts - just general patterns.
Use simple Indian English that's easy to understand.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    console.log('[Gemini] Explanation received');
    return response.text();
  } catch (error) {
    console.error('Gemini API error:', error);
    // Fallback explanation
    return `This ${officeType} office in ${city} is currently ${crowdLevel === 'high' ? 'very busy' : crowdLevel === 'medium' ? 'moderately busy' : 'less crowded'}. Government offices in India are typically busier during morning hours and weekdays.`;
  }
};

/**
 * Generate best time to visit suggestion
 */
export const generateBestTimeSuggestion = async (
  officeType: OfficeType,
  city: string
): Promise<string> => {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    const officeTypeNames: Record<OfficeType, string> = {
      passport: 'Passport Office',
      aadhaar: 'Aadhaar Enrollment Center',
      driving_license: 'RTO (Driving License Office)',
      ration_card: 'Ration Card Office',
      birth_certificate: 'Birth Certificate Office',
      police_station: 'Police Station',
      municipal_corporation: 'Municipal Corporation',
      other: 'Government Office',
    };

    const prompt = `Suggest the best time to visit a ${officeTypeNames[officeType]} in ${city}, India.
Provide a brief, practical suggestion in simple Indian English (2-3 sentences).
Consider typical Indian government office patterns: avoid peak hours, weekends, and month-ends.
Keep it helpful and realistic.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('Gemini API error:', error);
    return `For ${officeType} offices in ${city}, it's generally best to visit during mid-week (Tuesday-Thursday) in the afternoon hours (2-4 PM) to avoid peak crowds.`;
  }
};
