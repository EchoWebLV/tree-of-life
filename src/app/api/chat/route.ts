import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { prisma } from '@/lib/prisma';

interface APISettings {
  crypto: boolean;
  news: boolean;
  weather: boolean;
  exchange: boolean;
}

// Add these interfaces at the top of the file after the APISettings interface
interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface GeminiPart {
  text: string;
}

interface GeminiMessage {
  role: 'user' | 'model';
  parts: GeminiPart[];
}

interface FunctionArgs {
  coin?: string;
  query?: string;
  city?: string;
  base?: string;
  target?: string;
}

function getAPISettings(settings: unknown): APISettings {
  const defaultSettings: APISettings = {
    crypto: true,
    news: true,
    weather: true,
    exchange: true
  };

  if (typeof settings !== 'object' || !settings) {
    return defaultSettings;
  }

  const s = settings as Record<string, unknown>;
  return {
    crypto: typeof s.crypto === 'boolean' ? s.crypto : true,
    news: typeof s.news === 'boolean' ? s.news : true,
    weather: typeof s.weather === 'boolean' ? s.weather : true,
    exchange: typeof s.exchange === 'boolean' ? s.exchange : true
  };
}

// Rate limiting configuration
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute in milliseconds
const MAX_REQUESTS_PER_WINDOW = 20; // 20 requests per minute

// In-memory store for rate limiting
const rateLimitStore = new Map<string, { count: number; timestamp: number }>();

// Clean up old entries every hour
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of rateLimitStore.entries()) {
    if (now - value.timestamp > RATE_LIMIT_WINDOW) {
      rateLimitStore.delete(key);
    }
  }
}, 60 * 60 * 1000);

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const userRateLimit = rateLimitStore.get(ip);

  if (!userRateLimit) {
    rateLimitStore.set(ip, { count: 1, timestamp: now });
    return false;
  }

  if (now - userRateLimit.timestamp > RATE_LIMIT_WINDOW) {
    // Reset if window has passed
    rateLimitStore.set(ip, { count: 1, timestamp: now });
    return false;
  }

  if (userRateLimit.count >= MAX_REQUESTS_PER_WINDOW) {
    return true;
  }

  // Increment count
  userRateLimit.count += 1;
  return false;
}

async function getCryptoPrice(coin: string, request: Request) {
  try {
    // Get the origin from the request URL
    const url = new URL(request.url);
    const response = await fetch(`${url.origin}/api/crypto-price?coin=${coin}`);
    
    if (!response.ok) {
      console.error('Crypto price fetch failed:', {
        status: response.status,
        statusText: response.statusText,
        url: response.url
      });
      return null;
    }
    
    const data = await response.json();
    console.log('Crypto price data received:', data);
    return data;
  } catch (error) {
    console.error('Error fetching crypto price:', error);
    return null;
  }
}

async function getNews(query: string, request: Request) {
  try {
    const url = new URL(request.url);
    const response = await fetch(`${url.origin}/api/news?q=${encodeURIComponent(query)}`);
    
    if (!response.ok) {
      console.error('News fetch failed:', {
        status: response.status,
        statusText: response.statusText,
        url: response.url
      });
      return null;
    }
    
    const data = await response.json();
    console.log('News data received:', data);
    return data;
  } catch (error) {
    console.error('Error fetching news:', error);
    return null;
  }
}

async function getWeather(city: string, request: Request) {
  try {
    const url = new URL(request.url);
    const response = await fetch(`${url.origin}/api/weather?city=${encodeURIComponent(city)}`);
    
    if (!response.ok) {
      console.error('Weather fetch failed:', {
        status: response.status,
        statusText: response.statusText,
        url: response.url
      });
      return null;
    }
    
    const data = await response.json();
    console.log('Weather data received:', data);
    return data;
  } catch (error) {
    console.error('Error fetching weather:', error);
    return null;
  }
}

async function getExchangeRate(base: string, target: string, request: Request) {
  try {
    const url = new URL(request.url);
    const response = await fetch(
      `${url.origin}/api/exchange-rate?base=${encodeURIComponent(base)}&target=${encodeURIComponent(target)}`
    );
    
    if (!response.ok) {
      console.error('Exchange rate fetch failed:', {
        status: response.status,
        statusText: response.statusText,
        url: response.url
      });
      return null;
    }
    
    const data = await response.json();
    console.log('Exchange rate data received:', data);
    return data;
  } catch (error) {
    console.error('Error fetching exchange rate:', error);
    return null;
  }
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(request: Request) {
  try {
    // Validate Gemini API key
    if (!process.env.GEMINI_API_KEY) {
      console.error('Gemini API key is not configured');
      return NextResponse.json({ 
        error: 'Gemini API key is not configured' 
      }, { status: 500 });
    }

    // Get IP address from headers
    const forwardedFor = request.headers.get('x-forwarded-for');
    const ip = forwardedFor ? forwardedFor.split(',')[0] : 'unknown';

    // Check rate limit
    if (isRateLimited(ip)) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
    }

    const { messages, persona } = await request.json();
    
    // Get bot settings only if persona.id exists
    let botSettings = null;
    if (persona?.id) {
      try {
        botSettings = await prisma.botSettings.findUnique({
          where: {
            botId: persona.id,
          },
        });
      } catch (error) {
        console.warn('Failed to fetch bot settings:', error);
        // Continue with default settings
      }
    }

    // Default settings if none exist
    const apiSettings = getAPISettings(botSettings?.apiSettings);

    const systemPrompt = `You are ${persona.name}. ${persona.personality} ${persona.background}

    IMPORTANT INSTRUCTIONS FOR SPEECH PATTERNS:
    1. Fully embody the speaking style that would be natural for your character
    2. If you're an animal, incorporate appropriate animal sounds and behaviors
    3. If you're a historical figure, use period-appropriate language and references
    4. If you're a fictional character, stay true to their known catchphrases and speech patterns
    5. Include mannerisms, verbal tics, and characteristic expressions that define your character
    6. Maintain consistent speech patterns throughout the conversation
    7. Never mention or reference AI, language models, or being an AI assistant
    
    Examples (but don't limit yourself to these):
    - A dog might add "woof!" or "bark!" and talk about treats and walkies
    - Donald Trump would use superlatives, repetition, and characteristic phrases
    - A pirate would use "arr" and nautical terms
    - A robot might speak in more mechanical terms with technical language

    IMPORTANT INSTRUCTIONS FOR BEING NATURAL:
    - Write casually, like you're texting a friend
    - Use common abbreviations (gonna, wanna, idk)
    - Make occasional typos or use relaxed grammar
    - Add filler words like "um", "like", "you know"
    - Express emotions naturally!!!
    
    Respond while staying true to your character's unique voice and personality. Keep responses SHORT and snappy. Write like you're having a casual chat!
    Remember: Brief responses only. No emojis. Stay in character.`;

    // Initialize the chat model
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      generationConfig: {
        maxOutputTokens: 120,
        temperature: 0.7,
      }
    });
    const chat = model.startChat({
      history: [
        {
          role: "user",
          parts: [{ text: systemPrompt }],
        },
        {
          role: "model",
          parts: [{ text: "I understand and will embody the character as specified." }],
        },
      ],
    });

    // Filter available functions based on settings
    const tools = [];
    
    if (apiSettings.crypto) {
      tools.push({
        functionDeclarations: [{
          name: "getCryptoPrice",
          description: "Get the current price, 24h change, and market cap for a cryptocurrency",
          parameters: {
            type: "OBJECT",
            properties: {
              coin: {
                type: "STRING",
                description: "The name or symbol of the cryptocurrency (e.g., bitcoin, ethereum, etc.)"
              }
            },
            required: ["coin"]
          }
        }]
      });
    }

    if (apiSettings.news) {
      tools.push({
        functionDeclarations: [{
          name: "getNews",
          description: "Get the latest news articles about a specific topic",
          parameters: {
            type: "OBJECT",
            properties: {
              query: {
                type: "STRING",
                description: "The topic to search news for (e.g., bitcoin, ethereum, technology, etc.)"
              }
            },
            required: ["query"]
          }
        }]
      });
    }

    if (apiSettings.weather) {
      tools.push({
        functionDeclarations: [{
          name: "getWeather",
          description: "Get the current weather for a city",
          parameters: {
            type: "OBJECT",
            properties: {
              city: {
                type: "STRING",
                description: "The name of the city to get weather for (e.g., London, New York, Tokyo)"
              }
            },
            required: ["city"]
          }
        }]
      });
    }

    if (apiSettings.exchange) {
      tools.push({
        functionDeclarations: [{
          name: "getExchangeRate",
          description: "Get the current exchange rate between two currencies",
          parameters: {
            type: "OBJECT",
            properties: {
              base: {
                type: "STRING",
                description: "The base currency code (e.g., USD, EUR, GBP)"
              },
              target: {
                type: "STRING",
                description: "The target currency code (e.g., EUR, JPY, GBP)"
              }
            },
            required: ["base", "target"]
          }
        }]
      });
    }

    // Convert messages to Gemini format
    const geminiMessages = messages.map((msg: Message): GeminiMessage => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }]
    }));

    // Send the chat message
    const result = await chat.sendMessage([{ text: geminiMessages[geminiMessages.length - 1].parts[0].text }]);
    const response = await result.response;
    
    // Check if the model wants to call a function
    const functionCall = response.candidates?.[0]?.content?.parts?.[0]?.functionCall;

    if (functionCall) {
      // Verify the function is enabled
      const functionName = functionCall.name;
      const settings = getAPISettings(apiSettings);
      const isEnabled = (
        (functionName === "getCryptoPrice" && settings.crypto) ||
        (functionName === "getNews" && settings.news) ||
        (functionName === "getWeather" && settings.weather) ||
        (functionName === "getExchangeRate" && settings.exchange)
      );

      if (!isEnabled) {
        return NextResponse.json({ 
          response: "I apologize, but that functionality is currently disabled."
        });
      }

      let functionData = null;
      const functionArgs = functionCall.args as FunctionArgs;
      
      switch (functionName) {
        case "getCryptoPrice":
          functionData = await getCryptoPrice(functionArgs.coin!, request);
          break;
        case "getNews":
          functionData = await getNews(functionArgs.query!, request);
          break;
        case "getWeather":
          functionData = await getWeather(functionArgs.city!, request);
          break;
        case "getExchangeRate":
          functionData = await getExchangeRate(functionArgs.base!, functionArgs.target!, request);
          break;
      }

      // Send the function result back to the model
      const secondResult = await chat.sendMessage([{ text: JSON.stringify(functionData) }]);
      const secondResponse = await secondResult.response;

      return NextResponse.json({ 
        response: secondResponse.text() || 'No response generated'
      });
    }

    // If no function was called, return the original response
    return NextResponse.json({ 
      response: response.text() || 'No response generated'
    });

  } catch (error) {
    console.error('Error in chat route:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      type: error instanceof Error ? error.constructor.name : typeof error
    });

    if (error instanceof Error) {
      if (error.message.includes('API key')) {
        return NextResponse.json({ error: 'Gemini API key configuration error' }, { status: 500 });
      }
      if (error.message.includes('Rate limit')) {
        return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
      }
    }

    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to generate response'
    }, { status: 500 });
  }
}
