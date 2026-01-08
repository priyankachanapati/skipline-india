# Testing Checklist for Queueless India 🧪

## ✅ Pre-Test Setup
- [x] Dependencies installed (`npm install`)
- [x] `.env.local` file created with all API keys
- [x] Firebase project set up (Firestore + Auth enabled)
- [x] Sample data seeded (13 offices added)
- [x] Development server running (`npm run dev`)

---

## 🌐 Step 1: Open the App

1. **Open your browser** and go to: **http://localhost:3000**

2. **Expected Result:**
   - ✅ Homepage loads without errors
   - ✅ See "Skip the Queue, Save Your Time" heading
   - ✅ See problem statement and features section
   - ✅ Navigation bar shows "Queueless India"

---

## 🏠 Step 2: Test Homepage

### Test Navigation:
- [ ] Click "Find Offices Near You" button → Should go to `/search` page
- [ ] Click "Get Started Now" button → Should go to `/search` page
- [ ] Check footer appears at bottom

### Test Content:
- [ ] Problem statement section is visible
- [ ] "How It Works" section shows 4 steps
- [ ] Features section shows 3 cards (Real-Time Data, AI Insights, Easy Navigation)

---

## 🔍 Step 3: Test Search Page (`/search`)

### Test City Selection:
- [ ] Select "Mumbai" from city dropdown
- [ ] Select "Passport Office" from office type dropdown
- [ ] Should see office cards appear (at least 2-3 offices)

### Test Office Cards:
- [ ] Each office card shows:
  - Office name
  - Office type
  - City name
  - Crowd level badge (Low/Medium/High)
  - Estimated waiting time

### Test Filters:
- [ ] Change city to "Delhi" → Should show Delhi offices
- [ ] Change city to "Bangalore" → Should show Bangalore offices
- [ ] Change office type to "All Types" → Should show all offices in that city
- [ ] Change office type to "Aadhaar Center" → Should filter accordingly

### Test Location Search:
- [ ] Click "📍 Find Offices Near Me" button
- [ ] Allow location access when browser prompts
- [ ] Should see offices sorted by distance
- [ ] Each office should show distance in kilometers

---

## 📄 Step 4: Test Office Detail Page (`/office/[id]`)

### Navigate to Office:
- [ ] Click on any office card from search page
- [ ] Should navigate to `/office/[office-id]` page

### Test Office Information:
- [ ] Office name is displayed prominently
- [ ] Office type is shown
- [ ] City and address are visible
- [ ] "Back to Search" button works

### Test Crowd Status:
- [ ] Crowd level indicator shows (Low/Medium/High badge)
- [ ] Estimated waiting time is displayed (e.g., "30 min")
- [ ] Last updated timestamp is shown

### Test Crowd Reporting:
- [ ] Click "Low" button → Should show login modal
- [ ] Click "Medium" button → Should show login modal
- [ ] Click "High" button → Should show login modal

### Test Authentication:
- [ ] In login modal, click "Continue Anonymously"
- [ ] Should sign in successfully
- [ ] Modal should close
- [ ] Try reporting crowd level again → Should work without modal
- [ ] Should see success message or confirmation

### Test Map:
- [ ] Google Map is displayed (may take 10-15 seconds to load)
- [ ] Map shows office location with a marker
- [ ] Map is interactive (can zoom, pan)

### Test AI Features:
- [ ] "🤖 AI Insight" section appears
- [ ] AI explanation text is displayed (may take a few seconds)
- [ ] "⏰ Best Time to Visit" section appears
- [ ] Suggestion text is displayed

---

## 🔐 Step 5: Test Authentication Flow

### Anonymous Login:
- [ ] Click any crowd level button when not signed in
- [ ] Login modal appears
- [ ] Click "Continue Anonymously"
- [ ] Should sign in successfully
- [ ] Can now report crowd levels

### Google Login (Optional):
- [ ] Sign out (if possible) or use incognito mode
- [ ] Try to report crowd level
- [ ] Click "Sign in with Google"
- [ ] Should open Google sign-in popup
- [ ] Complete sign-in
- [ ] Should be able to report crowd levels

---

## 🐛 Step 6: Check for Errors

### Browser Console:
- [ ] Open browser DevTools (F12)
- [ ] Go to "Console" tab
- [ ] Check for any red error messages
- [ ] Common issues to look for:
  - Firebase initialization errors
  - Google Maps API errors
  - Gemini API errors
  - Network errors

### Network Tab:
- [ ] Go to "Network" tab in DevTools
- [ ] Refresh the page
- [ ] Check for failed requests (red entries)
- [ ] Verify Firebase and Maps API calls are successful

---

## 📱 Step 7: Test Mobile Responsiveness

### Resize Browser:
- [ ] Resize browser window to mobile size (375px width)
- [ ] Check that layout adapts properly
- [ ] Text is readable
- [ ] Buttons are touch-friendly
- [ ] Cards stack vertically on mobile

### Test Touch Interactions:
- [ ] Click/tap on office cards
- [ ] Click/tap on buttons
- [ ] Scroll through pages
- [ ] Everything should be responsive

---

## ✅ Expected Results Summary

### Homepage:
- ✅ Loads without errors
- ✅ All sections visible
- ✅ Navigation works

### Search Page:
- ✅ Can select cities and office types
- ✅ Offices appear when city is selected
- ✅ Location search works
- ✅ Office cards display correctly

### Office Detail Page:
- ✅ All office info displayed
- ✅ Crowd level and waiting time shown
- ✅ Map loads and displays location
- ✅ AI insights appear
- ✅ Can report crowd levels after signing in

### Authentication:
- ✅ Anonymous login works
- ✅ Can report crowd levels after login
- ✅ No console errors

---

## 🚨 Common Issues & Fixes

### Issue: "Firebase not initialized"
**Fix:** Check `.env.local` has all Firebase variables set correctly

### Issue: "Maps not loading"
**Fix:** 
- Check Google Maps API key is correct
- Verify Maps JavaScript API is enabled in Google Cloud Console
- Check browser console for specific error

### Issue: "No offices found"
**Fix:**
- Verify offices exist in Firestore
- Check city names are lowercase in Firestore
- Verify collection name is exactly `offices`

### Issue: "Gemini API error"
**Fix:**
- Check `GEMINI_API_KEY` is set correctly
- Verify API key has quota available
- Check console for specific error message

### Issue: "Cannot sign in"
**Fix:**
- Verify Anonymous auth is enabled in Firebase Console
- Check Firebase Auth domain is correct in `.env.local`
- Check browser console for auth errors

---

## 🎉 Success Criteria

Your app is working correctly if:
- ✅ All pages load without errors
- ✅ Can search and find offices
- ✅ Can view office details
- ✅ Map displays correctly
- ✅ AI insights appear
- ✅ Can sign in and report crowd levels
- ✅ No console errors

---

**Happy Testing! 🚀**

If you encounter any issues, check the browser console for error messages and refer to the troubleshooting section above.
