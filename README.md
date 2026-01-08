# Queueless India 🇮🇳

A modern, mobile-first web platform that helps Indian citizens avoid long queues at government offices by showing real-time crowd levels and estimated waiting times.

## 🎯 Features

- **Real-Time Crowd Data**: See current crowd levels (Low/Medium/High) at government offices
- **Estimated Waiting Times**: Know how long you'll wait before visiting
- **AI-Powered Insights**: Get explanations on why offices are crowded and best times to visit
- **Location-Based Search**: Find nearby offices with distance calculations
- **Mobile-First Design**: Optimized for low-end mobile devices
- **Citizen Reporting**: Help others by reporting crowd levels when you visit

## 🛠️ Tech Stack

- **Frontend**: Next.js 14 (App Router), React, TypeScript
- **Backend**: Firebase (Firestore + Firebase Auth)
- **AI**: Google Gemini API (for explanations only)
- **Maps**: Google Maps API
- **Styling**: Tailwind CSS

## 📋 Prerequisites

- Node.js 18+ and npm/yarn
- Firebase project with Firestore and Authentication enabled
- Google Gemini API key
- Google Maps API key

## 🚀 Setup Instructions

### 1. Clone and Install

```bash
# Install dependencies
npm install
# or
yarn install
```

### 2. Configure Environment Variables

Create a `.env.local` file in the root directory:

```env
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Google Gemini API
GEMINI_API_KEY=your_gemini_api_key

# Google Maps API
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
```

### 3. Firebase Setup

1. Create a Firebase project at [Firebase Console](https://console.firebase.google.com/)
2. Enable **Firestore Database** (start in test mode, then update rules)
3. Enable **Authentication** (enable Anonymous and Google providers)
4. Copy your Firebase config values to `.env.local`
5. Deploy Firestore security rules from `firestore.rules`:
   ```bash
   firebase deploy --only firestore:rules
   ```

### 4. Seed Sample Data

You can add sample offices to Firestore manually or use the Firebase Console:

**Collection: `offices`**

Example document:
```json
{
  "name": "Passport Seva Kendra - Andheri",
  "type": "passport",
  "city": "mumbai",
  "latitude": 19.1136,
  "longitude": 72.8697,
  "address": "Andheri West, Mumbai, Maharashtra"
}
```

**Office Types:**
- `passport`
- `aadhaar`
- `driving_license`
- `ration_card`
- `birth_certificate`
- `police_station`
- `municipal_corporation`
- `other`

**Cities:** Use lowercase (e.g., "mumbai", "delhi", "bangalore")

### 5. Run Development Server

```bash
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📁 Project Structure

```
queueless-india/
├── app/                    # Next.js App Router pages
│   ├── page.tsx           # Homepage
│   ├── search/            # Search page
│   ├── office/[id]/      # Office detail page
│   ├── layout.tsx        # Root layout
│   └── globals.css       # Global styles
├── components/            # React components
│   ├── CrowdIndicator.tsx
│   ├── OfficeCard.tsx
│   ├── OfficeMap.tsx
│   └── LoadingSpinner.tsx
├── lib/
│   ├── firebase/         # Firebase services
│   │   ├── config.ts
│   │   ├── auth.ts
│   │   └── firestore.ts
│   └── services/         # Business logic
│       ├── crowdAggregation.ts
│       ├── gemini.ts
│       └── maps.ts
├── firestore.rules       # Firestore security rules
└── types/               # TypeScript definitions
```

## 🔐 Security Rules

The Firestore security rules allow:
- **Read**: Public (anyone can read offices and reports)
- **Write**: Authenticated users only (must sign in to submit reports)

## 🧪 Testing the App

1. **Homepage**: Visit `/` to see the problem statement and features
2. **Search**: Go to `/search`, select a city and office type
3. **Office Detail**: Click on any office to see crowd levels, map, and AI insights
4. **Report Crowd**: Sign in (anonymous or Google) to report crowd levels

## 📱 Mobile Optimization

- Responsive design with Tailwind CSS
- Touch-friendly buttons and interactions
- Optimized images and lazy loading
- Fast load times for low-end devices

## 🚢 Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import project in [Vercel](https://vercel.com)
3. Add environment variables in Vercel dashboard
4. Deploy!

### Other Platforms

The app can be deployed to any platform that supports Next.js:
- Netlify
- AWS Amplify
- Firebase Hosting

## 🤝 Contributing

This is a hackathon project. To extend it:

1. Add more office types
2. Implement user profiles and history
3. Add push notifications for crowd alerts
4. Implement ML-based predictions (beyond simple aggregation)
5. Add office hours and holiday information

## 📝 Notes

- Crowd levels are calculated from the last 10 reports using majority voting
- Waiting times are simple estimates (low=10min, medium=30min, high=60min)
- Gemini AI is used only for generating explanations, not predictions
- All data is stored in Firestore and updated in real-time

## 🐛 Troubleshooting

**Firebase errors**: Check that all environment variables are set correctly and Firebase is initialized

**Maps not loading**: Verify Google Maps API key is correct and Maps JavaScript API is enabled

**Gemini API errors**: Check API key and ensure you have quota available

**Auth not working**: Ensure Anonymous and Google providers are enabled in Firebase Console

## 📄 License

This project is built for hackathon purposes. Feel free to use and modify as needed.

---

Made with ❤️ for India | Help others by reporting crowd levels!
