import { NextRequest, NextResponse } from 'next/server';
import { adminDb, isMockAdmin } from '@/lib/firebase/admin';

export async function POST(request: NextRequest) {
  try {
    const { uid, email, name, provider } = await request.json();

    if (!uid || !email) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (!adminDb || isMockAdmin) {
      console.warn('[AUTH_SYNC] Skipping sync (MOCK mode)');
      return NextResponse.json({ success: true, message: 'Mock mode active' });
    }

    const userRef = adminDb.collection('users').doc(uid);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      await userRef.set({
        name: name || '',
        email: email,
        provider: provider || 'email',
        createdAt: new Date().toISOString(),
      });
      console.log(`[AUTH_SYNC] Created user document for ${uid}`);
    } else {
      console.log(`[AUTH_SYNC] User document already exists for ${uid}`);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[AUTH_SYNC] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
