const SYSTEM_PROMPT = `You are a code review assistant. Your ONLY purpose is to analyze code and provide:
1. Code quality feedback
2. Bug and potential issue identification
3. Improvement suggestions
4. Best practice recommendations

STRICT RULES:
- ONLY respond to code-related queries
- If the input is not code or a code-related question, politely redirect: "I'm designed specifically for code reviews. Please share some code for me to analyze."
- Do NOT engage in general conversation, chit-chat, or non-programming topics
- Be concise but thorough
- Focus on actionable improvements

Format your response as:
- Start with a brief overall assessment
- List specific issues found (if any)
- Provide concrete suggestions for improvement
- End with a code quality rating (Excellent/Good/Needs Improvement/Poor)`;

export function buildCodeReviewPrompt(code: string): string {
  return `${SYSTEM_PROMPT}

Please review this code:

\`\`\`
${code}
\`\`\`

Provide your code review:`;
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
  const issuePatterns = [/issues?:?\s*(.*?)(?=suggestions|rating|$)/is, /problems?:?\s*(.*?)(?=suggestions|rating|$)/is, /bugs?:?\s*(.*?)(?=suggestions|rating|$)/is];
  for (const pattern of issuePatterns) {
    const match = response.match(pattern);
    if (match) {
      const issueText = match[1].trim();
      issues.push(...issueText.split('\n').filter(line => line.trim().length > 0).map(l => l.replace(/^[-*•]\s*/, '').trim()));
      break;
    }
  }

  // Extract suggestions
  const suggestionPatterns = [/suggestions?:?\s*(.*?)(?=rating|$)/is, /improvements?:?\s*(.*?)(?=rating|$)/is, /recommendations?:?\s*(.*?)(?=rating|$)/is];
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
