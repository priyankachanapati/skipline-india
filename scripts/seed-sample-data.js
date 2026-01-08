/**
 * Sample data seeding script for Firestore
 * 
 * Run this using Node.js after setting up Firebase:
 * node scripts/seed-sample-data.js
 * 
 * Make sure to set up Firebase Admin SDK or use Firebase CLI
 */

// Sample offices data for major Indian cities
const sampleOffices = [
  // Mumbai
  {
    name: 'Passport Seva Kendra - Andheri',
    type: 'passport',
    city: 'mumbai',
    latitude: 19.1136,
    longitude: 72.8697,
    address: 'Andheri West, Mumbai, Maharashtra 400053',
  },
  {
    name: 'Aadhaar Enrollment Center - Bandra',
    type: 'aadhaar',
    city: 'mumbai',
    latitude: 19.0596,
    longitude: 72.8295,
    address: 'Bandra East, Mumbai, Maharashtra 400051',
  },
  {
    name: 'RTO Office - Andheri',
    type: 'driving_license',
    city: 'mumbai',
    latitude: 19.1136,
    longitude: 72.8697,
    address: 'Andheri West, Mumbai, Maharashtra',
  },
  // Delhi
  {
    name: 'Passport Office - CP',
    type: 'passport',
    city: 'delhi',
    latitude: 28.6304,
    longitude: 77.2177,
    address: 'Connaught Place, New Delhi 110001',
  },
  {
    name: 'Aadhaar Center - Dwarka',
    type: 'aadhaar',
    city: 'delhi',
    latitude: 28.5925,
    longitude: 77.0486,
    address: 'Dwarka Sector 10, New Delhi',
  },
  {
    name: 'RTO - Janakpuri',
    type: 'driving_license',
    city: 'delhi',
    latitude: 28.6280,
    longitude: 77.0815,
    address: 'Janakpuri, New Delhi',
  },
  // Bangalore
  {
    name: 'Passport Seva Kendra - Koramangala',
    type: 'passport',
    city: 'bangalore',
    latitude: 12.9352,
    longitude: 77.6245,
    address: 'Koramangala, Bangalore, Karnataka 560095',
  },
  {
    name: 'Aadhaar Center - Indiranagar',
    type: 'aadhaar',
    city: 'bangalore',
    latitude: 12.9784,
    longitude: 77.6408,
    address: 'Indiranagar, Bangalore, Karnataka',
  },
  {
    name: 'RTO Office - Jayanagar',
    type: 'driving_license',
    city: 'bangalore',
    latitude: 12.9279,
    longitude: 77.5971,
    address: 'Jayanagar, Bangalore, Karnataka',
  },
  // Hyderabad
  {
    name: 'Passport Office - Banjara Hills',
    type: 'passport',
    city: 'hyderabad',
    latitude: 17.4239,
    longitude: 78.4481,
    address: 'Banjara Hills, Hyderabad, Telangana',
  },
  {
    name: 'Aadhaar Center - Secunderabad',
    type: 'aadhaar',
    city: 'hyderabad',
    latitude: 17.4399,
    longitude: 78.4983,
    address: 'Secunderabad, Hyderabad, Telangana',
  },
  // Chennai
  {
    name: 'Passport Seva Kendra - T Nagar',
    type: 'passport',
    city: 'chennai',
    latitude: 13.0418,
    longitude: 80.2341,
    address: 'T Nagar, Chennai, Tamil Nadu',
  },
  {
    name: 'RTO Office - Anna Nagar',
    type: 'driving_license',
    city: 'chennai',
    latitude: 13.0850,
    longitude: 80.2101,
    address: 'Anna Nagar, Chennai, Tamil Nadu',
  },
];

console.log('Sample offices data:');
console.log(JSON.stringify(sampleOffices, null, 2));
console.log('\nTo add these to Firestore:');
console.log('1. Go to Firebase Console > Firestore Database');
console.log('2. Create collection "offices"');
console.log('3. Add documents with the above data');
console.log('4. Or use Firebase Admin SDK to programmatically add them');

// ============================================
//FIREBASE ADMIN SDK SETUP (Uncomment to use)
// ============================================
// 
// To use this script:
// 1. Install: npm install firebase-admin
// 2. Get service account key from Firebase Console > Project Settings > Service Accounts
// 3. Save it as 'service-account-key.json' in project root
// 4. Uncomment the code below (remove /* and */)
// 5. Run: node scripts/seed-sample-data.js
//

const admin = require('firebase-admin');
const path = require('path');
const serviceAccount = require(path.join(__dirname, '..', 'service-account-key.json'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function seedData() {
  console.log('Starting to seed data...');
  const batch = db.batch();
  
  sampleOffices.forEach((office) => {
    const ref = db.collection('offices').doc();
    batch.set(ref, office);
    console.log(`Preparing to add: ${office.name} (${office.city})`);
  });
  
  await batch.commit();
  console.log(`\n✅ Successfully added ${sampleOffices.length} offices to Firestore!`);
  console.log('Check Firebase Console > Firestore Database to verify.');
}

seedData().catch((error) => {
  console.error('❌ Error seeding data:', error);
  process.exit(1);
});

