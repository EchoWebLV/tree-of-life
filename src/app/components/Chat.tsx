'use client';

import { useState, useEffect, useRef } from 'react';
import { DAILY_MESSAGE_LIMIT, getMessageCount, incrementMessageCount } from '../utils/messageLimit';
import { useWallet } from '@solana/wallet-adapter-react';
import { checkTokenBalance } from '../utils/tokenCheck';

interface Persona {
  id?: string;
  name: string;
  personality: string;
  background: string;
}

interface ChatProps {
  persona: Persona;
}

const UNCENSORED_STORAGE_KEY = 'uncensored_bots';

export default function Chat({ persona }: ChatProps) {
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; content: string }[]>([]);
  const [input, setInput] = useState('');
  const [messageCount, setMessageCount] = useState(() => getMessageCount());
  const [isUncensored, setIsUncensored] = useState(() => {
    // Get uncensored state from localStorage
    const uncensoredBots = JSON.parse(localStorage.getItem(UNCENSORED_STORAGE_KEY) || '{}');
    return persona.id ? uncensoredBots[persona.id] || false : false;
  });
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const [hasEnoughTokens, setHasEnoughTokens] = useState(false);
  const wallet = useWallet();

  useEffect(() => {
    const scrollToBottom = () => {
      if (chatContainerRef.current) {
        const lastMessage = chatContainerRef.current.querySelector('[data-message]:last-of-type');
        if (lastMessage) {
          setTimeout(() => {
            lastMessage.scrollIntoView({ 
              behavior: 'smooth',
              block: 'end'
            });
          }, 100);
        }
      }
    };

    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const checkBalance = async () => {
      if (wallet.publicKey) {
        const hasBalance = await checkTokenBalance(wallet.publicKey);
        setHasEnoughTokens(hasBalance);
        if (!hasBalance && isUncensored) {
          setIsUncensored(false);
        }
      } else {
        setHasEnoughTokens(false);
        if (isUncensored) {
          setIsUncensored(false);
        }
      }
    };
    
    checkBalance();
  }, [wallet.publicKey, isUncensored]);

  // Add this useEffect to persist uncensored state
  useEffect(() => {
    if (!persona.id) return;
    
    const uncensoredBots = JSON.parse(localStorage.getItem(UNCENSORED_STORAGE_KEY) || '{}');
    uncensoredBots[persona.id] = isUncensored;
    localStorage.setItem(UNCENSORED_STORAGE_KEY, JSON.stringify(uncensoredBots));
  }, [isUncensored, persona.id]);

  const sendMessage = async () => {
    if (!input.trim()) return;

    // Check message limit
    if (!incrementMessageCount()) {
      alert(`You've reached your daily limit of ${DAILY_MESSAGE_LIMIT} messages. Please try again tomorrow.`);
      return;
    }

    const newMessages = [
      ...messages,
      { role: 'user' as const, content: input }
    ];

    setMessages(newMessages);
    setInput('');
    setMessageCount(getMessageCount());

    try {
      const endpoint = isUncensored ? '/api/uncensored-chat' : '/api/chat';
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: newMessages,
          persona: persona,
          systemPrompt: `You are ${persona.name}. ${persona.personality} ${persona.background}`
        }),
      });
      const data = await response.json();
      setMessages([...newMessages, { 
        role: 'assistant' as const, 
        content: data.response 
      }]);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  return (
    <div className="flex flex-col text-xs h-full rounded-xl p-6 shadow-lg border border-white chat-container" ref={chatContainerRef}>
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center space-x-2">
          <span className="text-white">Mode:</span>
          <button
            onClick={() => {
              if (!isUncensored && !hasEnoughTokens) {
                alert('You need at least 20,000 DRUID tokens to use uncensored mode');
                return;
              }
              setIsUncensored(!isUncensored);
            }}
            className={`px-3 py-1 rounded-xl transition-colors duration-200 text-xs
              ${isUncensored 
                ? 'bg-red-500 text-white hover:bg-red-600' 
                : hasEnoughTokens 
                  ? 'bg-green-500 text-white hover:bg-green-600'
                  : 'bg-gray-500 text-white cursor-not-allowed'
              }`}
          >
            {isUncensored ? 'Uncensored' : 'Natural'}
          </button>
        </div>
        <div className="text-xs text-white/50 italic">
          {messageCount.count}/{DAILY_MESSAGE_LIMIT} messages remaining
        </div>
      </div>
      <div className="flex-1 overflow-y-auto space-y-4 pr-2 scrollbar-thin scrollbar-thumb-white">
        {messages.map((message, index) => (
          <div
            key={index}
            data-message
            className={`p-4 rounded-xl ${
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
      <div className="h-[60px] flex gap-3 pt-3 border-t border-white">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
          className="w-3/4 p-1 rounded-xl bg-black border border-white
            focus:outline-none focus:ring-2 focus:ring-white
            text-white placeholder-white/60 text-base md:text-xs chat-input no-select"
          placeholder="Type your message..."
          style={{ fontSize: '16px' }}
        />
        <button
          onClick={sendMessage}
          className="w-1/4 px-4 py-1 bg-white text-black rounded-xl 
            hover:bg-white/90 transition-colors duration-200 font-medium text-xs"
        >
          Send
        </button>
      </div>
    </div>
  );
}