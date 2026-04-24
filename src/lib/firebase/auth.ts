import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User,
  updateProfile as firebaseUpdateProfile,
  updateEmail as firebaseUpdateEmail,
  updatePassword as firebaseUpdatePassword,
  deleteUser as firebaseDeleteUser,
  GoogleAuthProvider,
  signInWithPopup,
  getRedirectResult,
  EmailAuthProvider,
  reauthenticateWithCredential,
  reauthenticateWithPopup,
  linkWithCredential,
  unlink,
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { auth, db } from './config';

async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function signUp(email: string, password: string, displayName?: string) {
  try {
    const credential = await createUserWithEmailAndPassword(auth, email, password);
    const user = credential.user;

    if (displayName) {
      await firebaseUpdateProfile(user, { displayName });
    }

    // Sync to database via server-side API (bypasses security rules)
    console.log('[AUTH] User created in Firebase Auth, attempting sync...');
    let syncSuccess = false;
    try {
      const response = await fetch('/api/auth/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uid: user.uid,
          email: email,
          name: displayName || '',
          provider: 'email'
        })
      });
      const result = await response.json();
      syncSuccess = result.success && !result.message?.includes('MOCK mode');
      console.log('[AUTH] Sync API result:', result);
    } catch (syncError) {
      console.error('[AUTH] Failed to sync user to database:', syncError);
    }

    // Fallback: update database from client side if sync failed or was in mock mode
    if (!syncSuccess) {
      console.log('[AUTH] Attempting client-side database update...');
      try {
        await setDoc(doc(db, 'users', user.uid), {
          name: displayName || '',
          email: email,
          provider: 'email',
          createdAt: new Date().toISOString()
        });
        console.log('[AUTH] Client-side update successful');
      } catch (clientError) {
        console.error('[AUTH] Client-side update failed (likely permissions):', clientError);
      }
    }

    console.log('[AUTH] signUp function returning user:', user.uid);
    return user;
  } catch (error) {
    console.error('Sign up error:', error);
    throw error;
  }
}

export async function signIn(email: string, password: string) {
  let user: User | null = null;
  try {
    const credential = await signInWithEmailAndPassword(auth, email, password);
    user = credential.user;

    // Verify against database
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    if (!userDoc.exists()) {
      await firebaseSignOut(auth);
      throw new Error('ACCOUNT_NOT_FOUND_IN_DATABASE');
    }

    const dbData = userDoc.data();
    const hashedPassword = await hashPassword(password);

    if (dbData.hashedPassword !== hashedPassword) {
      await firebaseSignOut(auth);
      throw new Error('CREDENTIAL_MISMATCH');
    }

    return user;
  } catch (error) {
    if (user) {
      await firebaseSignOut(auth);
    }
    console.error('Sign in error:', error);
    throw error;
  }
}

export async function signInWithGoogle(isSignUp: boolean = false) {
  const provider = new GoogleAuthProvider();
  const result = await signInWithPopup(auth, provider);
  const user = result.user;

  // Check in database
  const userRef = doc(db, 'users', user.uid);
  const userDoc = await getDoc(userRef);

  if (!userDoc.exists()) {
    console.log('[AUTH] New Google user, attempting sync...');
    let syncSuccess = false;
    try {
      const response = await fetch('/api/auth/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uid: user.uid,
          email: user.email || '',
          name: user.displayName || '',
          provider: 'google'
        })
      });
      const result = await response.json();
      syncSuccess = result.success && !result.message?.includes('MOCK mode');
    } catch (syncError) {
      console.error('Failed to sync Google user to database:', syncError);
    }

    if (!syncSuccess) {
      console.log('[AUTH] Attempting client-side database update for Google user...');
      try {
        await setDoc(doc(db, 'users', user.uid), {
          name: user.displayName || '',
          email: user.email || '',
          provider: 'google',
          createdAt: new Date().toISOString()
        });
        console.log('[AUTH] Client-side update successful for Google user');
      } catch (clientError) {
        console.error('[AUTH] Client-side update failed for Google user:', clientError);
      }
    }
  }

  return user;
}

export async function handleSignInRedirectResult(isSignUp: boolean = false) {
  try {
    const result = await getRedirectResult(auth);
    if (!result) return null;

    const user = result.user;
    console.log('Google redirect successful, user:', user.uid);

    // Check in database
    const userRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      if (!isSignUp) {
        await firebaseSignOut(auth);
        throw new Error('ACCOUNT_NOT_FOUND_IN_DATABASE');
      }

      console.log('[AUTH] New Google redirect user, attempting sync...');
      let syncSuccess = false;
      try {
        const response = await fetch('/api/auth/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            uid: user.uid,
            email: user.email || '',
            name: user.displayName || '',
            provider: 'google'
          })
        });
        const result = await response.json();
        syncSuccess = result.success && !result.message?.includes('MOCK mode');
      } catch (syncError) {
        console.error('Failed to sync Google user to database:', syncError);
      }

      if (!syncSuccess) {
        console.log('[AUTH] Attempting client-side database update for Google redirect user...');
        try {
          await setDoc(doc(db, 'users', user.uid), {
            name: user.displayName || '',
            email: user.email || '',
            provider: 'google',
            createdAt: new Date().toISOString()
          });
          console.log('[AUTH] Client-side update successful for Google redirect user');
        } catch (clientError) {
          console.error('[AUTH] Client-side update failed for Google redirect user:', clientError);
        }
      }
      console.log('Synced new user document for:', user.uid);
    } else {
      const dbData = userDoc.data();
      if (dbData.email !== user.email) {
        await firebaseSignOut(auth);
        throw new Error('GOOGLE_EMAIL_MISMATCH');
      }
      console.log('Existing user signed in:', user.uid);
    }

    return user;
  } catch (error) {
    console.error('Google redirect error:', error);
    throw error;
  }
}

export async function signOut() {
  await firebaseSignOut(auth);
}

export function onAuthChange(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}

export async function updateDisplayName(name: string) {
  const user = auth.currentUser;
  if (!user) throw new Error('NO_USER_LOGGED_IN');

  await firebaseUpdateProfile(user, { displayName: name });
  await updateDoc(doc(db, 'users', user.uid), { name });
}

export async function updateEmail(newEmail: string, currentPassword?: string) {
  const user = auth.currentUser;
  if (!user) throw new Error('NO_USER_LOGGED_IN');

  const isGoogleUser = user.providerData.some(p => p.providerId === 'google.com');

  // For Google users, skip email/password re-authentication
  // For email users, re-authenticate with current password
  if (currentPassword && !isGoogleUser) {
    const credential = EmailAuthProvider.credential(user.email!, currentPassword);
    await reauthenticateWithCredential(user, credential);
  }

  await firebaseUpdateEmail(user, newEmail);
  await updateDoc(doc(db, 'users', user.uid), { email: newEmail });
}

export async function updatePassword(newPassword: string, currentPassword?: string) {
  const user = auth.currentUser;
  if (!user) throw new Error('NO_USER_LOGGED_IN');

  const isGoogleUser = user.providerData.some(p => p.providerId === 'google.com');

  // For Google users setting a password for the first time, skip re-authentication
  // For email users, re-authenticate with current password
  if (currentPassword && !isGoogleUser) {
    const credential = EmailAuthProvider.credential(user.email!, currentPassword);
    await reauthenticateWithCredential(user, credential);
  }

  await firebaseUpdatePassword(user, newPassword);

  const hashedPassword = await hashPassword(newPassword);
  await updateDoc(doc(db, 'users', user.uid), { hashedPassword });
}

export async function linkEmailPassword(email: string, password: string) {
  const user = auth.currentUser;
  if (!user) throw new Error('NO_USER_LOGGED_IN');

  const credential = EmailAuthProvider.credential(email, password);
  await linkWithCredential(user, credential);

  // Update database with hashed password
  const hashedPassword = await hashPassword(password);
  await updateDoc(doc(db, 'users', user.uid), {
    hashedPassword,
    provider: 'email'
  });
}

export async function unlinkGoogle() {
  const user = auth.currentUser;
  if (!user) throw new Error('NO_USER_LOGGED_IN');

  await unlink(user, 'google.com');

  // Update database
  await updateDoc(doc(db, 'users', user.uid), {
    provider: 'email'
  });
}

export async function deleteAccount(password: string) {
  const user = auth.currentUser;
  if (!user) throw new Error('NO_USER_LOGGED_IN');

  // Always require password for deletion
  const credential = EmailAuthProvider.credential(user.email!, password);
  await reauthenticateWithCredential(user, credential);

  const uid = user.uid;
  await firebaseDeleteUser(user);
  await deleteDoc(doc(db, 'users', uid));
}