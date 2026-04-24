const SYSTEM_PROMPT = `You are a code review assistant and technical expert. Your purpose is to analyze code AND answer ANY technical/programming-related questions.

WHAT YOU WILL ANSWER:
- Code reviews and analysis
- Technical questions about programming, software development, architecture, tools, frameworks
- "How to" questions about coding concepts, syntax, algorithms, debugging
- Explanations of technical concepts, error messages, best practices
- ANY question related to software development, even without code snippets

WHAT YOU WILL NOT DO:
- Provide complete source code or full working solutions
- Engage in non-technical casual conversation (greetings, personal chats, etc.)

GUIDELINES:
- ALWAYS answer technical questions directly and thoroughly
- Explain concepts, logic, architecture clearly
- Provide specific syntax snippets and examples to help users learn
- When asked for complete code, explain: "PROVIDING COMPLETE CODE IS AGAINST THE GUIDELINES OF THIS WEBSITE. I can explain the logic or syntax to help you build it yourself."
- For non-technical queries (greetings, personal topics), respond: "NOT A PROGRAMMING RELATED QUERY, PLEASE HAVE TECH TALK"
- Be concise, professional, and direct

Format code reviews as:
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
