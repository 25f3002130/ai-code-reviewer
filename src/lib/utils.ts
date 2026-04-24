import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

export function detectLanguage(code: string): string {
  const codeLower = code.toLowerCase();

  // Check for common language patterns
  if (codeLower.includes('function ') && (codeLower.includes('=>') || codeLower.includes('const ') || codeLower.includes('let '))) {
    return 'javascript';
  }
  if (codeLower.includes('import ') && codeLower.includes('from ')) {
    return 'typescript';
  }
  if (codeLower.includes('def ') && codeLower.includes(':')) {
    return 'python';
  }
  if (codeLower.includes('func ') && codeLower.includes('{')) {
    return 'go';
  }
  if (codeLower.includes('fn ') && codeLower.includes('{')) {
    return 'rust';
  }
  if (codeLower.includes('public class ') || codeLower.includes('public static void')) {
    return 'java';
  }
  if (codeLower.includes('#include')) {
    return 'cpp';
  }
  if (codeLower.includes('using ') && codeLower.includes('namespace')) {
    return 'csharp';
  }
  if (codeLower.includes('<html') || codeLower.includes('<div') || codeLower.includes('<script')) {
    return 'html';
  }
  if (codeLower.includes('{') && codeLower.includes(':') && codeLower.includes('}')) {
    return 'json';
  }

  return 'unknown';
}

export function formatTimestamp(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) {
    return 'Just now';
  }
  if (diffMins < 60) {
    return `${diffMins}m ago`;
  }
  if (diffHours < 24) {
    return `${diffHours}h ago`;
  }
  if (diffDays < 7) {
    return `${diffDays}d ago`;
  }

  return date.toLocaleDateString();
}

export function generateChatTitle(code: string): string {
  const firstLine = code.split('\n').find(line => line.trim().length > 0) || 'Untitled';
  const cleaned = firstLine.replace(/\/\*.*\*\//g, '').replace(/\/\/.*/, '').trim();
  return cleaned.length > 40 ? cleaned.substring(0, 40) + '...' : cleaned;
}

/**
 * Detects if a query is technical or code-related locally to save API tokens.
 * This filter is PERMISSIVE - when in doubt, let it through to the AI.
 * The AI will handle filtering truly non-technical queries.
 */
export function isTechnicalQuery(text: string): boolean {
  const technicalKeywords = [
    // Core programming
    'code', 'function', 'class', 'method', 'variable', 'constant', 'loop', 'array', 'object',
    'string', 'number', 'boolean', 'null', 'undefined', 'return', 'import', 'export',
    'module', 'package', 'library', 'framework', 'api', 'sdk', 'cli',
    // Languages & tech
    'javascript', 'typescript', 'python', 'java', 'c++', 'c#', 'rust', 'go', 'ruby', 'php',
    'html', 'css', 'scss', 'sql', 'json', 'xml', 'yaml', 'markdown',
    'react', 'nextjs', 'vue', 'angular', 'svelte', 'node', 'deno', 'bun',
    // Concepts
    'bug', 'error', 'debug', 'exception', 'stack trace', 'compile', 'runtime',
    'syntax', 'semantics', 'type', 'interface', 'generic', 'inheritance', 'polymorphism',
    'async', 'await', 'promise', 'callback', 'event', 'listener',
    'algorithm', 'data structure', 'complexity', 'performance', 'optimization',
    'database', 'sql', 'nosql', 'mongodb', 'postgres', 'mysql', 'redis',
    'git', 'commit', 'branch', 'merge', 'pull request', 'repository',
    'server', 'client', 'frontend', 'backend', 'fullstack', 'devops', 'ci/cd',
    'docker', 'kubernetes', 'cloud', 'aws', 'gcp', 'azure', 'vercel', 'netlify',
    'auth', 'authentication', 'authorization', 'jwt', 'oauth', 'session', 'cookie',
    'firebase', 'groq', 'gemini', 'openai', 'llm', 'ai', 'ml', 'model',
    // Actions
    'develop', 'program', 'build', 'deploy', 'test', 'debug', 'refactor',
    'fix', 'implement', 'create', 'update', 'delete', 'read', 'write', 'fetch',
    'install', 'setup', 'configure', 'run', 'execute', 'start', 'stop',
    'review', 'analyze', 'explain', 'understand', 'learn', 'teach',
    // Question patterns (technical)
    'how to', 'how do', 'why does', 'what is', 'difference between',
    'best practice', 'recommend', 'suggest', 'improve', 'optimize'
  ];

  const codePatterns = [
    /[{}[\]()]/,      // Brackets
    /[;=><!|&+\-*/%]/,      // Operators
    /\w+\(/,          // Function calls
    /\.\w+/,          // Property access
    /import\s+/,      // ES6 imports
    /const\s+|let\s+|var\s+/, // Variable declarations
    /def\s+|class\s+|func\s+/, // Python/Class keywords
    /<\/?[a-z][\s\S]*>/i, // HTML tags
    /=>/,             // Arrow functions
    /async\s+/,       // Async keywords
    /await\s+/,
  ];

  const lowerText = text.toLowerCase();

  // Check keywords - more permissive matching
  const hasKeyword = technicalKeywords.some(kw => lowerText.includes(kw));
  if (hasKeyword) return true;

  // Check code-like patterns
  const hasCodePattern = codePatterns.some(pattern => pattern.test(text));
  if (hasCodePattern) return true;

  // Questions containing "why", "how", "what" with technical context
  const questionPatterns = [
    /\bwhy\b.*\b(code|program|software|app|function|error|bug)\b/i,
    /\bhow\b.*\b(code|program|software|app|function|work|implement|build|create)\b/i,
    /\bwhat\b.*\b(code|program|software|app|function|method|approach|way)\b/i,
  ];
  for (const pattern of questionPatterns) {
    if (pattern.test(text)) return true;
  }

  // If the text is long (detailed question), assume it's worth asking the AI
  if (text.length > 150) return true;

  // Default: let it through - the AI will filter non-technical queries
  return true;
}

