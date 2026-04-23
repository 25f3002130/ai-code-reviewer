'use client';

import { useEffect, useRef } from 'react';
import hljs from 'highlight.js';
import 'highlight.js/styles/atom-one-dark.css';

interface ChatCodeBlockProps {
  code: string;
  language?: string;
}

export function ChatCodeBlock({ code, language = 'plaintext' }: ChatCodeBlockProps) {
  const codeRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (codeRef.current) {
      hljs.highlightElement(codeRef.current);
    }
  }, [code, language]);

  return (
    <div className="relative rounded-lg overflow-hidden my-4">
      {/* Language badge */}
      <div className="absolute top-2 right-2 px-2 py-1 text-xs font-medium text-gray-400 bg-white/10 rounded">
        {language}
      </div>

      <pre className="bg-[#1e1e1e] p-4 overflow-x-auto">
        <code ref={codeRef} className={`language-${language} text-sm text-gray-100`}>
          {code}
        </code>
      </pre>
    </div>
  );
}

export function FormattedMessage({ content }: { content: string }) {
  // Parse message content and render code blocks
  const parts = content.split(/(```[\s\S]*?```)/g);

  return (
    <div className="space-y-4">
      {parts.map((part, index) => {
        if (part.startsWith('```') && part.endsWith('```')) {
          // Extract language and code
          const match = part.match(/^```(\w*)\n?([\s\S]*?)```$/);
          if (match) {
            const [, language, code] = match;
            return (
              <ChatCodeBlock
                key={index}
                code={code.trim()}
                language={language || 'plaintext'}
              />
            );
          }
        }

        // Regular text - parse into paragraphs and lists
        return (
          <div key={index} className="text-gray-100 leading-relaxed">
            {part.split('\n\n').map((paragraph, i) => {
              if (paragraph.trim().startsWith('- ') || paragraph.trim().startsWith('* ')) {
                // Render as list
                const items = paragraph.split(/\n[-*]\s*/).filter(Boolean);
                return (
                  <ul key={i} className="list-disc list-inside space-y-1 my-2 text-gray-300">
                    {items.map((item, j) => (
                      <li key={j}>{item.trim()}</li>
                    ))}
                  </ul>
                );
              }
              if (paragraph.trim()) {
                return <p key={i} className="my-2">{paragraph}</p>;
              }
              return null;
            })}
          </div>
        );
      })}
    </div>
  );
}
