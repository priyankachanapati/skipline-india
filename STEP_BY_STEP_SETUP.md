# Step-by-Step Setup Guide for Queueless India

Follow these instructions carefully to get your app running.

---

## Step 1: Install Dependencies

### What to do:
Open your terminal/command prompt in the project directory and run:

```bash
npm install
```

### What this does:
- Downloads and installs all required packages (Next.js, React, Firebase, etc.)
- Creates a `node_modules` folder with all dependencies
- Takes 1-2 minutes depending on your internet speed

### Expected output:
You should see a list of packages being installed. Wait until you see:
```
added XXX packages, and audited XXX packages in XXs
```

### Troubleshooting:
- If you get errors, make sure you have Node.js 18+ installed
- Check Node.js version: `node --version`
- If npm is slow, try: `npm install --legacy-peer-deps`

---

## Step 2: Set Up Firebase Project and Get API Keys

### 2.1 Create Firebase Project

1. **Go to Firebase Console**
   - Visit: https://console.firebase.google.com/
   - Sign in with your Google account

2. **Create a New Project**
   - Click "Add project" or "Create a project"
   - Enter project name: `queueless-india` (or any name you prefer)
   - Click "Continue"
   - **Disable Google Analytics** (optional, for simplicity)
   - Click "Create project"
   - Wait 30 seconds for project creation
   - Click "Continue"

### 2.2 Enable Firestore Database

1. **In Firebase Console**, click on "Firestore Database" in the left sidebar
2. Click "Create database"
3. Select **"Start in test mode"** (we'll update rules later)
4. Choose a location (select closest to India, e.g., `asia-south1`)
5. Click "Enable"
6. Wait for database to be created

### 2.3 Enable Authentication

1. **In Firebase Console**, click on "Authentication" in the left sidebar
2. Click "Get started"
3. Go to "Sign-in method" tab
4. **Enable Anonymous authentication:**
   - Click on "Anonymous"
   - Toggle "Enable" to ON
   - Click "Save"
5. **Enable Google authentication:**
   - Click on "Google"
   - Toggle "Enable" to ON
   - Enter a project support email (your email)
   - Click "Save"

### 2.4 Get Firebase Configuration

1. **In Firebase Console**, click the gear icon ⚙️ next to "Project Overview"
2. Click "Project settings"
3. Scroll down to "Your apps" section
4. Click the web icon `</>` to add a web app
5. Register app:
   - App nickname: `Queueless India Web`
   - Check "Also set up Firebase Hosting" (optional)
   - Click "Register app"
6. **Copy the configuration object** - it looks like this:
   ```javascript
   const firebaseConfig = {
     apiKey: "AIzaSy...",
     authDomain: "your-project.firebaseapp.com",
     projectId: "your-project-id",
     storageBucket: "your-project.appspot.com",
     messagingSenderId: "123456789",
     appId: "1:123456789:web:abc123"
   };
   ```
7. **Keep this tab open** - you'll need these values in Step 3

### 2.5 Deploy Firestore Security Rules

1. **Install Firebase CLI** (if not already installed):
   ```bash
   npm install -g firebase-tools
   ```
   - Open your terminal/command prompt
   - Run the command above
   - Wait for installation to complete

2. **Login to Firebase:**
   ```bash
   firebase login
   ```
   - This opens a browser window for authentication
   - Click "Allow" to authorize

3. **Initialize Firebase in your project:**
   ```bash
   firebase init firestore
   ```
   - Select your Firebase project
   - Use existing `firestore.rules` file (type "N" when asked to overwrite)
   - Use default file path: `firestore.rules`

4. **Deploy the rules:**
   ```bash
   firebase deploy --only firestore:rules
   ```

   **OR** manually update rules in Firebase Console:
   - Go to Firestore Database > Rules tab
   - Copy contents from `firestore.rules` file
   - Paste and click "Publish"

---

## Step 3: Get Google Gemini API Key

1. **Go to Google AI Studio**
   - Visit: https://makersuite.google.com/app/apikey
   - Sign in with your Google account

2. **Create API Key**
   - Click "Create API Key"
   - Select your Firebase project (or create a new Google Cloud project)
   - Click "Create API Key in new project" or select existing project
   - **Copy the API key** - it looks like: `AIzaSy...`

3. **Keep this key safe** - you'll use it in Step 4

---

## Step 4: Get Google Maps API Key

1. **Go to Google Cloud Console**
   - Visit: https://console.cloud.google.com/
   - Make sure you're in the same project as Firebase (or create a new one)

2. **Enable Maps JavaScript API**
   - Click "APIs & Services" > "Library"
   - Search for "Maps JavaScript API"
   - Click on it and click "Enable"

3. **Create API Key**
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "API Key"
   - **Copy the API key**

4. **Restrict API Key (Recommended for production)**
   - Click on the API key you just created
   - Under "API restrictions", select "Restrict key"
   - Check "Maps JavaScript API"
   - Click "Save"

---

## Step 5: Create .env.local File

### 5.1 Create the File

1. **In your project root directory**, create a new file named `.env.local`
   - On Windows: Right-click > New > Text Document, rename to `.env.local`
   - On Mac/Linux: `touch .env.local`

### 5.2 Add Environment Variables

Open `.env.local` in a text editor and paste the following template:

```env
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id_here
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id_here
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id_here

# Google Gemini API
GEMINI_API_KEY=your_gemini_api_key_here

# Google Maps API
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
```

### 5.3 Fill in the Values

Replace each placeholder with the actual values:

**From Firebase (Step 2.4):**
- `NEXT_PUBLIC_FIREBASE_API_KEY` = `apiKey` from firebaseConfig
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` = `authDomain` from firebaseConfig
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID` = `projectId` from firebaseConfig
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` = `storageBucket` from firebaseConfig
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` = `messagingSenderId` from firebaseConfig
- `NEXT_PUBLIC_FIREBASE_APP_ID` = `appId` from firebaseConfig

**From Google AI Studio (Step 3):**
- `GEMINI_API_KEY` = Your Gemini API key

**From Google Cloud Console (Step 4):**
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` = Your Google Maps API key

### 5.4 Example (Don't use these - they're fake):

```env
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyAbc123Def456Ghi789Jkl012Mno345Pqr
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=queueless-india.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=queueless-india
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=queueless-india.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789012
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789012:web:abc123def456
GEMINI_API_KEY=AIzaSyXyz789Abc123Def456Ghi789Jkl012
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSyMaps123Key456Here789Now012
```

### 5.5 Save the File

- Make sure the file is saved as `.env.local` (not `.env.local.txt`)
- The file should be in the root directory (same level as `package.json`)

---

## Step 6: Seed Sample Data to Firestore

### Option A: Using Firebase Console (Easiest)

1. **Go to Firebase Console** > Firestore Database

2. **Add First Office:**
   - Click "Start collection"
   - Collection ID: `offices`
   - Click "Next"
   - Add these fields one by one:
     - Field: `name`, Type: `string`, Value: `Passport Seva Kendra - Andheri`
     - Field: `type`, Type: `string`, Value: `passport`
     - Field: `city`, Type: `string`, Value: `mumbai` (lowercase!)
     - Field: `latitude`, Type: `number`, Value: `19.1136`
     - Field: `longitude`, Type: `number`, Value: `72.8697`
     - Field: `address`, Type: `string`, Value: `Andheri West, Mumbai, Maharashtra 400053`
   - Click "Save"

3. **Add More Offices:**
   - Click "Add document" in the `offices` collection
   - Repeat step 2 with different values
   - **Recommended minimum: 3-5 offices in different cities**

### Option B: Using Firebase Admin SDK (Faster for multiple offices)

This method uses a script to automatically add multiple offices at once. It's faster if you want to add many offices.

**Step 1: Install Firebase Admin SDK**
   ```bash
   npm install firebase-admin
   ```
   - Run this in your project directory terminal
   - This installs the Firebase Admin SDK which allows server-side access to Firestore

**Step 2: Get Service Account Key**

   The Service Account Key is a special file that gives your script permission to write to Firestore.

   1. **Go to Firebase Console**
      - Visit: https://console.firebase.google.com/
      - Select your project

   2. **Navigate to Service Accounts**
      - Click the gear icon ⚙️ next to "Project Overview"
      - Click "Project settings"
      - Go to the "Service accounts" tab

   3. **Generate Private Key**
      - Click "Generate new private key" button
      - A popup will appear warning about keeping the key secure
      - Click "Generate key"
      - A JSON file will automatically download to your computer

   4. **Save the Key File**
      - The downloaded file will have a name like: `your-project-name-firebase-adminsdk-xxxxx.json`
      - Rename it to: `service-account-key.json`
      - Move it to your project root directory (same folder as `package.json`)
      - **⚠️ IMPORTANT:** This file contains sensitive credentials - never share it or commit it to Git!

   5. **Add to .gitignore**
      - Open `.gitignore` file in your project root
      - Add this line if it's not already there:
        ```
        service-account-key.json
        ```
      - This prevents accidentally committing your credentials to Git

**Step 3: Update the Seed Script**

   1. **Open the seed script:**
      - Open `scripts/seed-sample-data.js` in a text editor

   2. **Uncomment the Firebase Admin code:**
      - Find the section that starts with `// If using Firebase Admin SDK, uncomment and configure:`
      - Remove the `/*` at the beginning and `*/` at the end to uncomment the code block
      - It should look like this (without the comment markers):
        ```javascript
        const admin = require('firebase-admin');
        const serviceAccount = require('./service-account-key.json');
        
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
        });
        
        const db = admin.firestore();
        
        async function seedData() {
          const batch = db.batch();
          sampleOffices.forEach((office) => {
            const ref = db.collection('offices').doc();
            batch.set(ref, office);
          });
          await batch.commit();
          console.log('Sample data seeded successfully!');
        }
        
        seedData().catch(console.error);
        ```

   3. **Update the file path (if needed):**
      - Make sure the line says: `require('./service-account-key.json')`
      - The `./` means it's looking for the file in the project root directory
      - If you saved the file in a different location, update the path accordingly

**Step 4: Run the Seed Script**

   ```bash
   node scripts/seed-sample-data.js
   ```

   - Run this command in your terminal from the project root directory
   - You should see: `Sample data seeded successfully!`
   - Check Firebase Console > Firestore Database to verify offices were added

**Troubleshooting:**
   - If you get "Cannot find module" error → Make sure `service-account-key.json` is in the project root
   - If you get "Permission denied" error → Check that the service account key is correct
   - If you get "Collection not found" error → Firestore will create the collection automatically, this is normal

### Sample Offices to Add:

**Mumbai:**
- Name: `Passport Seva Kendra - Andheri`
- Type: `passport`
- City: `mumbai`
- Latitude: `19.1136`
- Longitude: `72.8697`

**Delhi:**
- Name: `Passport Office - CP`
- Type: `passport`
- City: `delhi`
- Latitude: `28.6304`
- Longitude: `77.2177`

**Bangalore:**
- Name: `Passport Seva Kendra - Koramangala`
- Type: `passport`
- City: `bangalore`
- Latitude: `12.9352`
- Longitude: `77.6245`

**Important:** City names must be **lowercase** in Firestore!

---

## Step 7: Run npm run dev and Test

### 7.1 Start Development Server

1. **Open terminal** in your project directory

2. **Run the dev server:**
   ```bash
   npm run dev
   ```

3. **Wait for compilation:**
   - You should see: `✓ Ready in X.Xs`
   - Look for: `- Local: http://localhost:3000`

4. **Open browser** and go to: http://localhost:3000

### 7.2 Test the Application

#### Test 1: Homepage
- ✅ Should see "Skip the Queue, Save Your Time" heading
- ✅ Should see problem statement and features
- ✅ Click "Find Offices Near You" button - should go to search page

#### Test 2: Search Page
- ✅ Select a city from dropdown (e.g., "Mumbai")
- ✅ Select an office type (e.g., "Passport Office")
- ✅ Should see list of offices (if you added sample data)
- ✅ Each office should show name, type, and city

#### Test 3: Office Detail Page
- ✅ Click on any office card
- ✅ Should see office name and details
- ✅ Should see crowd level indicator (Low/Medium/High)
- ✅ Should see estimated waiting time
- ✅ Should see "Report current crowd level" buttons
- ✅ Should see map (may take a few seconds to load)
- ✅ Should see AI Insight section (may take a few seconds)

#### Test 4: Authentication
- ✅ Click "Low", "Medium", or "High" button
- ✅ Should see login modal
- ✅ Try "Continue Anonymously" - should sign in
- ✅ Try reporting crowd level again - should work now

#### Test 5: Location Search
- ✅ Go back to search page
- ✅ Select a city
- ✅ Click "Find Offices Near Me" button
- ✅ Allow location access in browser
- ✅ Should see offices sorted by distance

### 7.3 Common Issues and Fixes

**Issue: "Firebase not initialized"**
- ✅ Check all Firebase env vars in `.env.local`
- ✅ Make sure file is named `.env.local` (not `.env`)
- ✅ Restart dev server after changing `.env.local`

**Issue: "Maps not loading"**
- ✅ Check Google Maps API key is correct
- ✅ Verify Maps JavaScript API is enabled in Google Cloud
- ✅ Check browser console for errors

**Issue: "Gemini API error"**
- ✅ Check GEMINI_API_KEY is set correctly
- ✅ Verify API key has quota available
- ✅ Check browser console for specific error

**Issue: "No offices found"**
- ✅ Make sure you added offices to Firestore
- ✅ Check city name is lowercase in Firestore
- ✅ Verify collection name is exactly `offices`

**Issue: "Cannot connect to Firestore"**
- ✅ Check Firestore is enabled in Firebase Console
- ✅ Verify security rules are deployed
- ✅ Check network/firewall isn't blocking Firebase

### 7.4 Stop the Server

- Press `Ctrl + C` in the terminal to stop the dev server

---

## ✅ You're Done!

Your Queueless India app should now be running! 

### Next Steps:
- Add more offices to Firestore
- Test crowd reporting functionality
- Customize the UI if needed
- Deploy to Vercel/Netlify for production

### Need Help?
- Check the main `README.md` for more details
- Review `SETUP_CHECKLIST.md` for quick reference
- Check browser console for error messages

---

**Happy Hacking! 🚀🇮🇳**
