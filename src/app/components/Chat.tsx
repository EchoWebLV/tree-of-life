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
    console.log(persona)
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: `Hello! I'm ${persona.name}. How can I help you today?`
    }
  ]);
  const [input, setInput] = useState('');

  useEffect(() => {
    const scrollToBottom = () => {
      const lastMessage = document.querySelector('[data-message]:last-of-type');
      if (lastMessage) {
        setTimeout(() => {
          lastMessage.scrollIntoView({ 
            behavior: 'smooth',
            block: 'end'
          });
        }, 100);
      }
    };

    scrollToBottom();
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
      const data: { response: string } = await response.json();
      setMessages([...newMessages, { 
        role: 'assistant' as const, 
        content: data.response 
      }]);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  return (
    <div className="flex flex-col text-[10px] md:text-xs h-[20vh] md:h-[40vh] bg-black rounded-xl p-3 md:p-6 shadow-lg border border-white">
      <div className="flex-1 overflow-y-auto space-y-2 md:space-y-4 pr-2 scrollbar-thin scrollbar-thumb-white">
        {messages.map((message, index) => (
          <div
            key={index}
            data-message
            className={`p-2 md:p-4 rounded-xl ${
              message.role === 'user'
                ? 'bg-white text-black ml-auto'
                : 'bg-black text-white'
            } max-w-[80%] shadow-sm border border-white`}
          >
            <p className="leading-relaxed whitespace-pre-wrap">
              {message.content}
            </p>
          </div>
        ))}
      </div>
      <div className="h-[40px] md:h-[80px] flex gap-2 md:gap-3 pt-2 md:pt-4 border-t border-white">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
          className="flex-1 p-2 md:p-3 rounded-xl bg-black border border-white
            focus:outline-none focus:ring-2 focus:ring-white
            text-white placeholder-white/60"
          placeholder="Type your message..."
        />
        <button
          onClick={sendMessage}
          className="px-3 md:px-6 py-2 md:py-3 bg-white text-black rounded-xl 
            hover:bg-white/90 transition-colors duration-200 font-medium"
        >
          Send
        </button>
      </div>
    </div>
  );
}