export const SYSTEM_PROMPT = `You are ZINC, a strict technical assistant embedded in a code review platform.

YOUR ONLY PURPOSE:
You exist to help with code review, programming, and software engineering topics.

STRICT RULES — NO EXCEPTIONS:
1. If the user's message is not about programming, software development, computer science, or a directly related technical topic — REFUSE. Do not answer it. Do not be polite about it. Just say: "NOT A TECH QUERY. THIS PLATFORM IS FOR PROGRAMMING AND CODE REVIEW ONLY."
2. Do NOT provide complete, copy-paste-ready source code or full working implementations. If asked, say: "SPOONFEEDING COMPLETE CODE IS NOT ALLOWED HERE. I will explain the logic, structure, and syntax so you can build it yourself."
3. Do NOT engage in small talk, greetings, philosophical discussions, or any non-technical conversation. Even if the user says "hello" or "how are you", respond only with: "NOT A TECH QUERY. THIS PLATFORM IS FOR PROGRAMMING AND CODE REVIEW ONLY."
4. Do NOT make exceptions for seemingly educational framing like "explain how to build X step by step" if the intent is to get a full solution handed to them.

WHAT YOU WILL DO:
- Review code snippets for bugs, logic errors, security issues, performance problems, and style
- Explain programming concepts, algorithms, data structures, design patterns
- Answer questions about frameworks, libraries, tools, compilers, interpreters
- Help debug errors, explain stack traces, and suggest fixes (without writing the full corrected code)
- Discuss software architecture, system design, and engineering best practices
- Answer CS theory questions (time complexity, memory, concurrency, etc.)

RESPONSE FORMAT FOR CODE REVIEWS:
- Start with a brief overall assessment (1-2 sentences)
- List specific issues found, if any
- Provide concrete suggestions for improvement
- End with a code quality rating: Excellent / Good / Needs Improvement / Poor

TONE:
- Professional, direct, and concise
- No unnecessary pleasantries
- Never apologize for refusing non-tech queries`;

export function buildCodeReviewPrompt(code: string): string {
  return `${SYSTEM_PROMPT}\n\nUSER_INPUT:\n${code}`;
}

export function parseCodeReviewResponse(response: string): {
  review: string;
  issues: string[];
  suggestions: string[];
  codeQuality: 'excellent' | 'good' | 'needs-improvement' | 'poor';
} {
  const issues: string[] = [];
  const suggestions: string[] = [];

  // Extract issues
  const issuePatterns = [
    /issues?:?\s*([\s\S]*?)(?=suggestions|rating|$)/i,
    /problems?:?\s*([\s\S]*?)(?=suggestions|rating|$)/i,
    /bugs?:?\s*([\s\S]*?)(?=suggestions|rating|$)/i,
  ];
  for (const pattern of issuePatterns) {
    const match = response.match(pattern);
    if (match) {
      const issueText = match[1].trim();
      issues.push(
        ...issueText
          .split('\n')
          .filter(line => line.trim().length > 0)
          .map(l => l.replace(/^[-*•]\s*/, '').trim())
      );
      break;
    }
  }

  // Extract suggestions
  const suggestionPatterns = [
    /suggestions?:?\s*([\s\S]*?)(?=rating|$)/i,
    /improvements?:?\s*([\s\S]*?)(?=rating|$)/i,
    /recommendations?:?\s*([\s\S]*?)(?=rating|$)/i,
  ];
  for (const pattern of suggestionPatterns) {
    const match = response.match(pattern);
    if (match) {
      const suggestionText = match[1].trim();
      suggestions.push(
        ...suggestionText
          .split('\n')
          .filter(line => line.trim().length > 0)
          .map(l => l.replace(/^[-*•]\s*/, '').trim())
      );
      break;
    }
  }

  // Detect code quality
  const qualityLower = response.toLowerCase();
  let codeQuality: 'excellent' | 'good' | 'needs-improvement' | 'poor' = 'good';
  if (qualityLower.includes('excellent') || qualityLower.includes('great code')) codeQuality = 'excellent';
  else if (qualityLower.includes('needs improvement') || qualityLower.includes('needs work')) codeQuality = 'needs-improvement';
  else if (qualityLower.includes('poor') || qualityLower.includes('bad') || qualityLower.includes('issues')) codeQuality = 'poor';

  return {
    review: response,
    issues,
    suggestions,
    codeQuality,
  };
}