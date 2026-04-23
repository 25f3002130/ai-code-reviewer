import { HuggingFaceInferenceRequest, HuggingFaceInferenceResponse, CodeReviewResult } from './types';
import { buildCodeReviewPrompt, parseCodeReviewResponse } from './code-reviewer';

const HF_API_KEY = process.env.NEXT_PUBLIC_HF_API_KEY;
const HF_MODEL = process.env.NEXT_PUBLIC_HF_MODEL || 'codellama/CodeLlama-34b-Instruct-hf';
const HF_API_URL = `https://api-inference.huggingface.co/models/${HF_MODEL}`;

export async function reviewCode(code: string): Promise<CodeReviewResult> {
  if (!HF_API_KEY) {
    throw new Error('Hugging Face API key not configured. Set NEXT_PUBLIC_HF_API_KEY environment variable.');
  }

  const prompt = buildCodeReviewPrompt(code);

  const requestBody: HuggingFaceInferenceRequest = {
    inputs: prompt,
    parameters: {
      max_new_tokens: 1024,
      temperature: 0.3,
      top_p: 0.95,
      return_full_text: false,
    },
  };

  try {
    const response = await fetch(HF_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${HF_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));

      if (response.status === 401) {
        throw new Error('Invalid Hugging Face API key');
      }
      if (response.status === 429) {
        throw new Error('Rate limit exceeded. Please try again later.');
      }
      if (response.status === 503) {
        throw new Error('Model is loading. Please try again in a moment.');
      }

      throw new Error(errorData.error || `API request failed with status ${response.status}`);
    }

    const data: HuggingFaceInferenceResponse[] = await response.json();

    if (!data || data.length === 0 || !data[0].generated_text) {
      throw new Error('Empty response from AI model');
    }

    return parseCodeReviewResponse(data[0].generated_text);
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to connect to Hugging Face API');
  }
}

export async function reviewCodeStream(code: string): Promise<AsyncGenerator<string>> {
  // Streaming implementation - note: HF Inference API doesn't support streaming
  // This falls back to non-streaming but yields the result chunk by chunk for UI effect
  const result = await reviewCode(code);

  // Simulate streaming by yielding chunks of the response
  const chunks = result.review.split(/(?=[ \n])/);
  for (const chunk of chunks) {
    yield chunk;
    await new Promise(resolve => setTimeout(resolve, 10));
  }
}
