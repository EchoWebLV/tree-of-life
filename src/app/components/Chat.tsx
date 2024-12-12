'use client';

import { useState, useEffect } from 'react';

interface Persona {
  name: string;
  personality: string;
  background: string;
}

interface ChatProps {
  persona: Persona;
}

export default function Chat({ persona }: ChatProps) {
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant', content: string }>>([
    {
      role: 'assistant',
      content: `Hello! I'm ${persona.name}. How can I help you today?`
    }
  ]);
  const [input, setInput] = useState('');

  useEffect(() => {
    const lastMessage = document.querySelector('[data-message]:last-of-type');
    if (lastMessage) {
      lastMessage.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const newMessages = [
      ...messages,
      { role: 'user', content: input }
    ];

    setMessages(newMessages as { role: 'user' | 'assistant'; content: string }[]);
    setInput('');

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: newMessages,
          persona: persona,
        }),
      });

      const data = await response.json();
      setMessages([...newMessages, { role: 'assistant', content: data.response }]);
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  return (
    <div className="flex flex-col h-[600px] bg-white dark:bg-black rounded-xl p-6 shadow-lg border border-black dark:border-white">
      <div className="flex-1 overflow-y-auto space-y-4 pr-2 scrollbar-thin scrollbar-thumb-black dark:scrollbar-thumb-white">
        {messages.map((message, index) => (
          <div
            key={index}
            data-message
            className={`p-4 rounded-xl ${
              message.role === 'user'
                ? 'bg-black text-white ml-auto'
                : 'bg-white text-black dark:bg-white dark:text-black'
            } max-w-[80%] shadow-sm border border-black dark:border-white`}
          >
            <p className="leading-relaxed whitespace-pre-wrap">
              {message.content}
            </p>
          </div>
        ))}
      </div>
      <div className="h-[80px] flex gap-3 pt-4 border-t border-black dark:border-white">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
          className="flex-1 p-3 rounded-xl bg-white dark:bg-black border border-black dark:border-white
            focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white
            text-black dark:text-white placeholder-black/60 dark:placeholder-white/60"
          placeholder="Type your message..."
        />
        <button
          onClick={sendMessage}
          className="px-6 py-3 bg-black dark:bg-white text-white dark:text-black rounded-xl 
            hover:bg-black/90 dark:hover:bg-white/90 transition-colors duration-200 font-medium"
        >
          Send
        </button>
      </div>
    </div>
  );
}