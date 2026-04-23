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
  EmailAuthProvider,
  reauthenticateWithCredential,
  reauthenticateWithPopup,
  linkWithCredential,
  unlink,
} from 'firebase/auth';
import { auth, db } from './config';
import { doc, setDoc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';

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

    // Store in database
    const hashedPassword = await hashPassword(password);
    await setDoc(doc(db, 'users', user.uid), {
      name: displayName || '',
      email: email,
      hashedPassword: hashedPassword,
      provider: 'email',
      createdAt: new Date().toISOString()
    });

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
  try {
    const provider = new GoogleAuthProvider();
    const credential = await signInWithPopup(auth, provider);
    const user = credential.user;

    // Check in database
    const userRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      if (!isSignUp) {
        await firebaseSignOut(auth);
        throw new Error('ACCOUNT_NOT_FOUND_IN_DATABASE');
      }

      await setDoc(userRef, {
        name: user.displayName || '',
        email: user.email || '',
        provider: 'google',
        createdAt: new Date().toISOString()
      });
    } else {
      const dbData = userDoc.data();
      if (dbData.email !== user.email) {
        await firebaseSignOut(auth);
        throw new Error('GOOGLE_EMAIL_MISMATCH');
      }
    }

    return user;
  } catch (error) {
    console.error('Google auth error:', error);
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