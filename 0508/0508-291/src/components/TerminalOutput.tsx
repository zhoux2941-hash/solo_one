import { useEffect, useRef } from 'react';
import { Message } from '../types';

interface TerminalOutputProps {
  messages: Message[];
}

export function TerminalOutput({ messages }: TerminalOutputProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const getMessageColor = (type: string) => {
    switch (type) {
      case 'chat':
        return 'text-terminal-info';
      case 'system':
        return 'text-terminal-text';
      case 'combat':
        return 'text-terminal-error';
      default:
        return 'text-terminal-text';
    }
  };

  return (
    <div
      ref={scrollRef}
      className="flex-1 overflow-y-auto p-4 terminal-scrollbar"
    >
      {messages.map((msg, index) => (
        <div key={index} className={`mb-1 ${getMessageColor(msg.type)}`}>
          {msg.type === 'chat' ? (
            <span>
              <span className="text-terminal-prompt">[{msg.sender}]</span> {msg.content}
            </span>
          ) : (
            <span>{msg.content}</span>
          )}
        </div>
      ))}
    </div>
  );
}
