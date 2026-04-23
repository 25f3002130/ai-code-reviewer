export interface HuggingFaceInferenceRequest {
  inputs: string;
  parameters?: {
    max_new_tokens?: number;
    temperature?: number;
    top_p?: number;
    return_full_text?: boolean;
  };
}

export interface HuggingFaceInferenceResponse {
  generated_text: string;
}

export interface CodeReviewResult {
  review: string;
  issues: string[];
  suggestions: string[];
  codeQuality: 'excellent' | 'good' | 'needs-improvement' | 'poor';
}
