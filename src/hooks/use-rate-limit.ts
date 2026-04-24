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
  dailyResetAt?: Date;
  hourlyResetAt?: Date;
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
            // Show the next relevant reset time (whichever is more urgent)
            resetAt: (requestsThisHour >= hourlyLimit) 
              ? data.hourlyResetAt?.toDate() 
              : data.dailyResetAt?.toDate(),
            dailyResetAt: data.dailyResetAt?.toDate(),
            hourlyResetAt: data.hourlyResetAt?.toDate(),
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

  // Add a "tick" effect to force a re-render when a reset time passes
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 10000); // Check every 10 seconds
    return () => clearInterval(interval);
  }, []);

  const now = Date.now();
  const isHourlyExpired = status.hourlyResetAt && now > status.hourlyResetAt.getTime();
  const isDailyExpired = status.dailyResetAt && now > status.dailyResetAt.getTime();

  return {
    ...status,
    remaining: {
      daily: isDailyExpired ? status.dailyLimit : status.remaining.daily,
      hourly: isHourlyExpired ? status.hourlyLimit : status.remaining.hourly,
    },
    refresh: () => {}, 
  };
}
