// // lib/firebase/admin-config.ts
// import * as admin from 'firebase-admin';

// export function initFirebaseAdmin() {
//   if (!admin.apps.length) {
//     // Check if running in a Node.js environment
//     if (typeof window === 'undefined') {
//       const serviceAccount = JSON.parse(
//         process.env.FIREBASE_SERVICE_ACCOUNT_KEY || '{}'
//       );
      
//       // Ensure we have valid credentials
//       if (!serviceAccount.project_id) {
//         throw new Error('FIREBASE_SERVICE_ACCOUNT_KEY environment variable is not properly configured');
//       }
      
//       admin.initializeApp({
//         credential: admin.credential.cert(serviceAccount),
//         databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL
//       });
//     }
//   }
// }

// lib/firebase/admin-config.ts
import * as admin from 'firebase-admin';

// Simple approach to check if the app is already initialized
function initializeAdminApp() {
  try {
    if (admin.apps.length === 0) {
      // Firebase Admin service account configuration
      const adminConfig = {
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
          privateKey: (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL
        }),
        databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL
      };
      
      // Initialize Firebase Admin
      admin.initializeApp(adminConfig);
      console.log('Firebase Admin SDK initialized successfully');
    }
    
    return admin.app(); // Get the default app instance
  } catch (error) {
    console.error('Firebase Admin SDK initialization failed:', error);
    throw error;
  }
}

// Initialize the admin app
const adminApp = initializeAdminApp();

// Use the admin services
const adminAuth = admin.auth();
const adminDatabase = admin.database();

// Function to initialize Firebase Admin (for lazy initialization in API routes)
export function initFirebaseAdmin() {
  // Only run in server environment
  if (typeof window !== 'undefined') {
    console.warn('Attempted to initialize Firebase Admin SDK in browser environment');
    return null;
  }
  
  try {
    // Validate required fields
    if (!process.env.FIREBASE_PROJECT_ID && !process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) {
      throw new Error('Missing FIREBASE_PROJECT_ID environment variable');
    }
    
    if (!process.env.FIREBASE_PRIVATE_KEY) {
      throw new Error('Missing FIREBASE_PRIVATE_KEY environment variable');
    }
    
    if (!process.env.FIREBASE_CLIENT_EMAIL) {
      throw new Error('Missing FIREBASE_CLIENT_EMAIL environment variable');
    }
    
    // Initialize if not already initialized
    initializeAdminApp();
    
    return admin;
  } catch (error) {
    console.error('Firebase Admin SDK initialization failed:', error);
    throw error;
  }
}

export { adminApp, adminAuth, adminDatabase, admin };