export interface CodeReviewResult {
  review: string;
  issues: string[];
  suggestions: string[];
  codeQuality: 'excellent' | 'good' | 'needs-improvement' | 'poor';
}

export interface AIProvider {
  name: string;
  reviewCode: (code: string) => Promise<CodeReviewResult>;
  reviewCodeStream: (code: string) => Promise<AsyncGenerator<string>>;
}

export type RateLimitInfo = {
  remaining?: number;
  resetAt?: number;
  limit?: number;
};
