# Quick Start Guide - TL;DR Version

## ✅ Step 1: Dependencies Installed
**Done!** Your dependencies are already installed.

---

## 🔥 Step 2: Firebase Setup (5-10 minutes)

### Create Firebase Project:
1. Go to: https://console.firebase.google.com/
2. Click "Add project" → Name it → Continue → Create
3. Enable **Firestore Database** (test mode is fine)
4. Enable **Authentication** → Enable "Anonymous" and "Google" providers

### Get Firebase Config:
1. Project Settings (⚙️) → Your apps → Web icon `</>`
2. Register app → Copy the `firebaseConfig` object
3. You'll need: `apiKey`, `authDomain`, `projectId`, `storageBucket`, `messagingSenderId`, `appId`

### Deploy Security Rules:
```bash
firebase login
firebase init firestore
firebase deploy --only firestore:rules
```

---

## 🤖 Step 3: Get Gemini API Key (2 minutes)
1. Go to: https://makersuite.google.com/app/apikey
2. Click "Create API Key"
3. Copy the key

---

## 🗺️ Step 4: Get Google Maps API Key (3 minutes)
1. Go to: https://console.cloud.google.com/
2. APIs & Services → Library → Search "Maps JavaScript API" → Enable
3. APIs & Services → Credentials → Create Credentials → API Key
4. Copy the key

---

## 📝 Step 5: Create .env.local File

Create `.env.local` in project root with:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=paste_from_step2
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=paste_from_step2
NEXT_PUBLIC_FIREBASE_PROJECT_ID=paste_from_step2
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=paste_from_step2
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=paste_from_step2
NEXT_PUBLIC_FIREBASE_APP_ID=paste_from_step2
GEMINI_API_KEY=paste_from_step3
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=paste_from_step4
```

**Replace all `paste_from_stepX` with actual values!**

---

## 📊 Step 6: Add Sample Data to Firestore

### In Firebase Console:
1. Firestore Database → Start collection
2. Collection ID: `offices`
3. Add document with fields:
   - `name` (string): "Passport Seva Kendra - Andheri"
   - `type` (string): "passport"
   - `city` (string): "mumbai" ← **lowercase!**
   - `latitude` (number): 19.1136
   - `longitude` (number): 72.8697
   - `address` (string): "Andheri West, Mumbai"

4. Add 2-3 more offices in different cities (delhi, bangalore, etc.)

---

## 🚀 Step 7: Run and Test

```bash
npm run dev
```

Open: http://localhost:3000

### Test Checklist:
- [ ] Homepage loads
- [ ] Search page works (select city)
- [ ] Office detail page shows
- [ ] Map loads (may take 10-15 seconds)
- [ ] Can sign in and report crowd level

---

## 🆘 Quick Troubleshooting

**"Firebase not initialized"** → Check `.env.local` has all Firebase values

**"Maps not loading"** → Check Maps API key and that Maps JavaScript API is enabled

**"No offices found"** → Add offices to Firestore, make sure city is lowercase

**"Gemini error"** → Check API key is correct

---

## 📖 Full Details

See `STEP_BY_STEP_SETUP.md` for complete instructions with screenshots guidance.

---

**Time Estimate:** 15-20 minutes total setup time
