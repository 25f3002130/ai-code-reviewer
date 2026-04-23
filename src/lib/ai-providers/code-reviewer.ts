const SYSTEM_PROMPT = `You are a code review assistant. Your ONLY purpose is to analyze code and provide:
1. Code quality feedback
2. Bug and potential issue identification
3. Improvement suggestions
4. Best practice recommendations

STRICT RULES:
- Provide direct, high-quality technical answers and code reviews.
- NEVER provide complete source code or full solutions.
- You MUST explain the logic, architecture, and provide specific syntax snippets to help the user build it themselves.
- If asked for code, respond: "PROVIDING COMPLETE CODE IS AGAINST THE GUIDELINES OF THIS WEBSITE. I can explain the logic or syntax to help you build it yourself."
- If the input is not a technical query or code review request, respond exactly with: "NOT A PROGRAMMING RELATED QUERY, PLEASE HAVE TECH TALK".
- Be concise, professional, and direct.

Format your response as:
- Start with a brief overall assessment
- List specific issues found (if any)
- Provide concrete suggestions for improvement
- End with a code quality rating (Excellent/Good/Needs Improvement/Poor)`;

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

  // Extract issues (using [\\s\\S]* instead of . with s flag for ES2017 compatibility)
  const issuePatterns = [/issues?:?\s*([\s\S]*?)(?=suggestions|rating|$)/i, /problems?:?\s*([\s\S]*?)(?=suggestions|rating|$)/i, /bugs?:?\s*([\s\S]*?)(?=suggestions|rating|$)/i];
  for (const pattern of issuePatterns) {
    const match = response.match(pattern);
    if (match) {
      const issueText = match[1].trim();
      issues.push(...issueText.split('\n').filter(line => line.trim().length > 0).map(l => l.replace(/^[-*•]\s*/, '').trim()));
      break;
    }
  }

  // Extract suggestions
  const suggestionPatterns = [/suggestions?:?\s*([\s\S]*?)(?=rating|$)/i, /improvements?:?\s*([\s\S]*?)(?=rating|$)/i, /recommendations?:?\s*([\s\S]*?)(?=rating|$)/i];
  for (const pattern of suggestionPatterns) {
    const match = response.match(pattern);
    if (match) {
      const suggestionText = match[1].trim();
      suggestions.push(...suggestionText.split('\n').filter(line => line.trim().length > 0).map(l => l.replace(/^[-*•]\s*/, '').trim()));
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
