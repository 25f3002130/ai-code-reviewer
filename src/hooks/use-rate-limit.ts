import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/firebase/auth-context';
import { db } from '@/lib/firebase/config';
import { doc, onSnapshot } from 'firebase/firestore';

export interface RateLimitStatus {
  requestsToday: number;
  requestsThisHour: number;
  dailyLimit: number;
  hourlyLimit: number;
  remaining: {
    daily: number;
    hourly: number;
  };
  resetAt?: Date;
  isLoading: boolean;
  error: string | null;
}

export function useRateLimit() {
  const { user } = useAuth();
  const [status, setStatus] = useState<RateLimitStatus>({
    requestsToday: 0,
    requestsThisHour: 0,
    dailyLimit: 30,
    hourlyLimit: 10,
    remaining: { daily: 30, hourly: 10 },
    resetAt: undefined,
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    if (!user) {
      setStatus((prev) => ({ ...prev, isLoading: false }));
      return;
    }

    setStatus((prev) => ({ ...prev, isLoading: true }));

    const unsubscribe = onSnapshot(doc(db, 'rate_limits', user.uid), 
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          const dailyLimit = data.dailyLimit || 30;
          const hourlyLimit = data.hourlyLimit || 10;
          const requestsToday = data.requestsToday || 0;
          const requestsThisHour = data.requestsThisHour || 0;

          setStatus({
            requestsToday,
            requestsThisHour,
            dailyLimit,
            hourlyLimit,
            remaining: {
              daily: Math.max(0, dailyLimit - requestsToday),
              hourly: Math.max(0, hourlyLimit - requestsThisHour),
            },
            resetAt: data.resetAt?.toDate(),
            isLoading: false,
            error: null,
          });
        } else {
          // Initialize default if doesn't exist
          setStatus({
            requestsToday: 0,
            requestsThisHour: 0,
            dailyLimit: 30,
            hourlyLimit: 10,
            remaining: { daily: 30, hourly: 10 },
            isLoading: false,
            error: null,
          });
        }
      },
      (err) => {
        console.error('Rate limit subscription error:', err);
        setStatus((prev) => ({ ...prev, isLoading: false, error: err.message }));
      }
    );

    return () => unsubscribe();
  }, [user]);

  return {
    ...status,
    refresh: () => {}, // No longer needed with onSnapshot
  };
}
