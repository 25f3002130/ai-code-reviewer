import * as admin from 'firebase-admin';

// Initialize Firebase Admin
if (!admin.apps.length) {
  try {
    if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
      // Use service account key from env if available
      let envKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY.trim();

      // Remove surrounding quotes if present (common in .env files)
      if ((envKey.startsWith("'") && envKey.endsWith("'")) ||
        (envKey.startsWith('"') && envKey.endsWith('"'))) {
        envKey = envKey.slice(1, -1);
      }

      const serviceAccount = JSON.parse(envKey);

      // Fix potential newline issues in private key if it was stringified poorly
      if (serviceAccount.private_key && typeof serviceAccount.private_key === 'string') {
        serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
      }

      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
    } else if (process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL) {
      // Use individual fields from env
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        }),
      });
    } else {
      // Fallback to application default (works in Google environments)
      try {
        admin.initializeApp({
          credential: admin.credential.applicationDefault(),
          projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        });
      } catch (e) {
        console.warn('[FIREBASE_ADMIN] No credentials found. Running in MOCK mode.');
        // Initialize with just the project ID - will fail on actual DB calls but won't crash here
        admin.initializeApp({
          projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'mock-project',
        });
      }
    }
  } catch (error) {
    console.error('[FIREBASE_ADMIN] Initialization error:', error);
  }
}

export const adminDb = admin.apps.length ? admin.firestore() : null;
export const adminAuth = admin.apps.length ? admin.auth() : null;
export const isMockAdmin = !process.env.FIREBASE_SERVICE_ACCOUNT_KEY &&
  !process.env.FIREBASE_PRIVATE_KEY &&
  !process.env.GOOGLE_APPLICATION_CREDENTIALS;
