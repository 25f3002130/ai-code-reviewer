'use client';

import { useEffect, useRef } from 'react';
import hljs from 'highlight.js';
import 'highlight.js/styles/github-dark.css';

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
    <div className="relative border-2 border-zinc-800 my-6 bg-black">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b-2 border-zinc-800 bg-zinc-950">
        <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
          SOURCE_CODE // {language.toUpperCase()}
        </span>
      </div>

      <pre className="p-6 overflow-x-auto bg-black">
        <code ref={codeRef} className={`language-${language} text-sm`}>
          {code}
        </code>
      </pre>
    </div>
  );
}

export function FormattedMessage({ content }: { content: string }) {
  const parts = content.split(/(```[\s\S]*?```)/g);

  return (
    <div className="space-y-6">
      {parts.map((part, index) => {
        if (part.startsWith('```') && part.endsWith('```')) {
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

        // Process markdown headers and lists
        const lines = part.split('\n');
        const processedLines: React.ReactNode[] = [];
        let currentList: React.ReactNode[] = [];

        lines.forEach((line, lineIndex) => {
          const trimmedLine = line.trim();

          // Headers
          if (trimmedLine.startsWith('#')) {
            // Flush current list if any
            if (currentList.length > 0) {
              processedLines.push(
                <ul key={`list-${lineIndex}`} className="space-y-3 my-6 border-l-4 border-white pl-6">
                  {currentList}
                </ul>
              );
              currentList = [];
            }

            const level = trimmedLine.match(/^#+/)?.[0].length || 1;
            const text = trimmedLine.replace(/^#+\s*/, '').toUpperCase();
            
            if (level === 1) {
              processedLines.push(<h1 key={lineIndex} className="text-3xl font-black mb-6 mt-8 tracking-tighter border-b-4 border-white pb-2 inline-block">{text}</h1>);
            } else if (level === 2) {
              processedLines.push(<h2 key={lineIndex} className="text-xl font-black mb-4 mt-8 tracking-tight bg-white text-black px-4 py-1 inline-block">{text}</h2>);
            } else {
              processedLines.push(<h3 key={lineIndex} className="text-sm font-black mb-3 mt-6 tracking-[0.2em] text-zinc-400 border-l-4 border-zinc-800 pl-4">{text}</h3>);
            }
          } 
          // Lists
          else if (trimmedLine.startsWith('- ') || trimmedLine.startsWith('* ') || trimmedLine.match(/^\d+\.\s/)) {
            const text = trimmedLine.replace(/^([-*]|\d+\.)\s*/, '');
            currentList.push(
              <li key={`li-${lineIndex}`} className="text-sm font-bold uppercase tracking-tight flex gap-3">
                <span className="text-white font-black">{">"}</span>
                <span>{text}</span>
              </li>
            );
          }
          // Normal text
          else if (trimmedLine) {
            // Flush list
            if (currentList.length > 0) {
              processedLines.push(
                <ul key={`list-${lineIndex}`} className="space-y-3 my-6 border-l-4 border-white pl-6">
                  {currentList}
                </ul>
              );
              currentList = [];
            }
            processedLines.push(<p key={lineIndex} className="my-4 text-sm font-medium leading-relaxed">{line}</p>);
          }
        });

        // Final list flush
        if (currentList.length > 0) {
          processedLines.push(
            <ul key={`list-final`} className="space-y-3 my-6 border-l-4 border-white pl-6">
              {currentList}
            </ul>
          );
        }

        return (
          <div key={index} className="text-zinc-200">
            {processedLines}
          </div>
        );
      })}
    </div>
  );
}
