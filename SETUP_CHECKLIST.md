# Quick Setup Checklist ✅

Follow these steps to get Queueless India running:

## 1. Install Dependencies
```bash
npm install
```

## 2. Firebase Setup
- [ ] Create Firebase project at https://console.firebase.google.com/
- [ ] Enable Firestore Database (start in test mode)
- [ ] Enable Authentication (enable Anonymous + Google providers)
- [ ] Copy Firebase config values

## 3. API Keys
- [ ] Get Google Gemini API key from https://makersuite.google.com/app/apikey
- [ ] Get Google Maps API key from https://console.cloud.google.com/
  - Enable "Maps JavaScript API" in Google Cloud Console

## 4. Environment Variables
Create `.env.local` file with:
- [ ] `NEXT_PUBLIC_FIREBASE_API_KEY`
- [ ] `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- [ ] `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- [ ] `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- [ ] `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- [ ] `NEXT_PUBLIC_FIREBASE_APP_ID`
- [ ] `GEMINI_API_KEY`
- [ ] `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`

## 5. Firestore Security Rules
- [ ] Deploy `firestore.rules` to Firebase:
  ```bash
  firebase deploy --only firestore:rules
  ```

## 6. Seed Sample Data
- [ ] Add at least 2-3 sample offices to Firestore collection `offices`
- [ ] Use the sample data from `scripts/seed-sample-data.js` as reference
- [ ] Make sure city names are lowercase (e.g., "mumbai", "delhi")

## 7. Run Development Server
```bash
npm run dev
```

## 8. Test the App
- [ ] Visit http://localhost:3000
- [ ] Go to Search page, select a city
- [ ] Click on an office to see details
- [ ] Try signing in and reporting crowd level

## Troubleshooting

**"Firebase not initialized"**: Check all Firebase env vars are set correctly

**"Maps not loading"**: Verify Google Maps API key and that Maps JavaScript API is enabled

**"Gemini API error"**: Check API key and quota

**"No offices found"**: Add sample data to Firestore `offices` collection

---

Once all checkboxes are done, you're ready to demo! 🚀
