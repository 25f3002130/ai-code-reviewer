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
 */
export function isTechnicalQuery(text: string): boolean {
  const technicalKeywords = [
    'code', 'function', 'bug', 'error', 'debug', 'api', 'react', 'nextjs', 
    'javascript', 'typescript', 'python', 'html', 'css', 'git', 'database',
    'sql', 'optimization', 'performance', 'array', 'object', 'loop', 'variable',
    'component', 'hook', 'state', 'props', 'effect', 'auth', 'firebase', 'groq',
    'gemini', 'llama', 'model', 'ai', 'develop', 'program', 'script', 'compile',
    'build', 'deploy', 'refactor', 'syntax', 'logic', 'algorithm', 'data',
    'server', 'client', 'frontend', 'backend', 'fullstack', 'review', 'analysis',
    'how to', 'why does', 'fix', 'improve', 'test', 'unit', 'integration',
    'security', 'vulnerability', 'patch', 'update', 'version', 'npm', 'node',
    'package', 'json', 'yaml', 'config', 'setup', 'install', 'run'
  ];

  const codePatterns = [
    /[{}[\]()]/,      // Brackets
    /[;=><!|&]/,      // Operators
    /\w+\(/,          // Function calls
    /\.\w+/,          // Property access
    /import\s+/,      // ES6 imports
    /const\s+|let\s+|var\s+/, // Variable declarations
    /def\s+|class\s+/, // Python/Class keywords
    /<\/?[a-z][\s\S]*>/i // HTML tags
  ];

  const lowerText = text.toLowerCase();
  
  // Check keywords
  const hasKeyword = technicalKeywords.some(kw => lowerText.includes(kw));
  if (hasKeyword) return true;

  // Check code-like patterns
  const hasCodePattern = codePatterns.some(pattern => pattern.test(text));
  if (hasCodePattern) return true;

  // If the text is long and has high density of symbols/indentation, assume technical
  if (text.length > 100 && (text.includes('\n') || text.includes('  '))) return true;

  return false;
}

