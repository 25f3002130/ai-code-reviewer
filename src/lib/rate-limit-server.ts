import { adminDb, isMockAdmin } from '@/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';

export interface UserRateLimit {
  requestsToday: number;
  requestsThisHour: number;
  lastRequestAt?: any;
  dailyResetAt?: any;
  hourlyResetAt?: any;
  dailyLimit: number;
  hourlyLimit: number;
}

const DEFAULT_DAILY_LIMIT = 30;
const DEFAULT_HOURLY_LIMIT = 10;

async function getOrCreateRateLimit(userId: string): Promise<UserRateLimit> {
  if (!adminDb) throw new Error('Database not initialized');
  const docRef = adminDb.collection('rate_limits').doc(userId);
  const docSnap = await docRef.get();

  if (docSnap.exists) {
    const data = docSnap.data() as any;
    return {
      requestsToday: data.requestsToday || 0,
      requestsThisHour: data.requestsThisHour || 0,
      lastRequestAt: data.lastRequestAt,
      dailyResetAt: data.dailyResetAt || data.resetAt, // Migration path
      hourlyResetAt: data.hourlyResetAt,
      dailyLimit: data.dailyLimit || DEFAULT_DAILY_LIMIT,
      hourlyLimit: data.hourlyLimit || DEFAULT_HOURLY_LIMIT,
    };
  }

  const newLimit: UserRateLimit = {
    requestsToday: 0,
    requestsThisHour: 0,
    dailyLimit: DEFAULT_DAILY_LIMIT,
    hourlyLimit: DEFAULT_HOURLY_LIMIT,
  };

  await docRef.set({
    requestsToday: 0,
    requestsThisHour: 0,
    dailyLimit: DEFAULT_DAILY_LIMIT,
    hourlyLimit: DEFAULT_HOURLY_LIMIT,
    createdAt: FieldValue.serverTimestamp(),
  });

  return newLimit;
}

export async function checkAndIncrementRateLimit(userId: string): Promise<{
  allowed: boolean;
  remaining: { daily: number; hourly: number };
  resetAt?: Date;
  error?: string;
}> {
  if (!adminDb || isMockAdmin) {
    console.warn('[RATE_LIMIT] Skipping server-side check (MOCK mode)');
    return {
      allowed: true,
      remaining: { daily: 99, hourly: 99 }
    };
  }

  const rateLimit = await getOrCreateRateLimit(userId);
  const docRef = adminDb.collection('rate_limits').doc(userId);

  const now = Date.now();
  
  // Reset hourly counter if the hour window has expired
  let requestsThisHour = rateLimit.requestsThisHour;
  let hourlyResetAt = rateLimit.hourlyResetAt?.toDate().getTime() || 0;
  if (now > hourlyResetAt) {
    requestsThisHour = 0;
    hourlyResetAt = now + 3600 * 1000;
  }

  // Reset daily counter if the daily window has expired
  let requestsToday = rateLimit.requestsToday;
  let dailyResetAt = rateLimit.dailyResetAt?.toDate().getTime() || 0;
  if (now > dailyResetAt) {
    requestsToday = 0;
    dailyResetAt = now + 86400 * 1000;
  }

  // Check hourly limit
  if (requestsThisHour >= rateLimit.hourlyLimit) {
    return {
      allowed: false,
      remaining: { daily: rateLimit.dailyLimit - requestsToday, hourly: 0 },
      resetAt: new Date(hourlyResetAt),
      error: `Hourly rate limit exceeded. Resets in ${Math.ceil((hourlyResetAt - now) / 60000)} minutes.`,
    };
  }

  // Check daily limit
  if (requestsToday >= rateLimit.dailyLimit) {
    return {
      allowed: false,
      remaining: { daily: 0, hourly: rateLimit.hourlyLimit - requestsThisHour },
      resetAt: new Date(dailyResetAt),
      error: `Daily rate limit exceeded. Resets in ${Math.ceil((dailyResetAt - now) / 3600000)} hours.`,
    };
  }

  // Increment counters with reset check
  const updates: any = {
    lastRequestAt: FieldValue.serverTimestamp(),
  };

  if (requestsToday === 0) {
    updates.requestsToday = 1;
    updates.dailyResetAt = new Date(now + 86400 * 1000);
  } else {
    updates.requestsToday = FieldValue.increment(1);
  }

  if (requestsThisHour === 0) {
    updates.requestsThisHour = 1;
    updates.hourlyResetAt = new Date(now + 3600 * 1000);
  } else {
    updates.requestsThisHour = FieldValue.increment(1);
  }

  await docRef.update(updates);

  return {
    allowed: true,
    remaining: {
      daily: rateLimit.dailyLimit - requestsToday - 1,
      hourly: rateLimit.hourlyLimit - requestsThisHour - 1,
    },
  };
}
