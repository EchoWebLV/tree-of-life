import { TwitterApi } from 'twitter-api-v2';
import { PrismaClient } from '@prisma/client';
import OpenAI from 'openai';
import { config } from 'dotenv';
import path from 'path';
import express, { Request, Response } from 'express';

// Load environment variables from both .env and .env.local
config({ path: path.resolve(__dirname, '../../.env') });
config({ path: path.resolve(__dirname, '../../.env.local') });

if (!process.env.OPENAI_API_KEY) {
  throw new Error('OPENAI_API_KEY is required');
}

interface APISettings {
  crypto?: boolean;
  news?: boolean;
  weather?: boolean;
  exchange?: boolean;
}

const prisma = new PrismaClient();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Create Express app
const app = express();
app.use(express.json());

// Map to store bot timeouts
const botTimeouts = new Map();

// Endpoint to refresh bot settings
app.post('/refresh-bot', async (req: Request, res: Response): Promise<void> => {
  const { botId } = req.body;
  if (!botId) {
    res.status(400).json({ error: 'botId is required' });
    return;
  }

  try {
    console.log(`Received refresh request for bot ${botId}`);
    
    // Clear existing timeout
    const existingTimeout = botTimeouts.get(botId);
    if (existingTimeout) {
      console.log(`Found existing timeout for bot ${botId}, clearing it...`);
      clearTimeout(existingTimeout);
      botTimeouts.delete(botId);
      console.log(`Cleared existing timeout for bot ${botId}`);
    } else {
      console.log(`No existing timeout found for bot ${botId}`);
    }

    // Get latest bot status
    const bot = await prisma.bot.findUnique({
      where: { id: botId },
      include: { twitterSettings: true }
    });

    if (!bot) {
      console.log(`Bot ${botId} not found`);
      res.status(404).json({ error: 'Bot not found' });
      return;
    }

    console.log(`Bot ${botId} status:`, {
      isAutonomous: bot.isAutonomous,
      hasTwitterSettings: !!bot.twitterSettings,
      currentTimeouts: Array.from(botTimeouts.keys())
    });

    // Only start bot if it's autonomous and has Twitter settings
    if (bot.isAutonomous && bot.twitterSettings) {
      console.log(`Starting autonomous mode for bot ${botId}`);
      handleBot(botId);
      res.json({ success: true, status: 'started' });
    } else {
      console.log(`Stopping autonomous mode for bot ${botId} (isAutonomous: ${bot.isAutonomous}, hasTwitterSettings: ${!!bot.twitterSettings})`);
      // Ensure the timeout is cleared when stopping
      if (botTimeouts.has(botId)) {
        console.log(`Clearing timeout for stopped bot ${botId}`);
        clearTimeout(botTimeouts.get(botId));
        botTimeouts.delete(botId);
        console.log(`Timeout cleared for bot ${botId}`);
      }
      res.json({ success: true, status: 'stopped' });
    }
  } catch (error) {
    console.error('Error refreshing bot:', error);
    res.status(500).json({ error: 'Failed to refresh bot' });
  }
});

// Add status endpoint
app.get('/bot-status/:botId', async (req: Request, res: Response): Promise<void> => {
  const { botId } = req.params;
  
  try {
    const isRunning = botTimeouts.has(botId);
    const bot = await prisma.bot.findUnique({
      where: { id: botId },
      select: { 
        isAutonomous: true,
        lastTweetAt: true,
        tweetFrequencyMinutes: true
      }
    });

    res.json({
      isRunning,
      isAutonomous: bot?.isAutonomous || false,
      lastTweetAt: bot?.lastTweetAt,
      nextTweetIn: isRunning ? 
        Math.ceil((botTimeouts.get(botId)._idleStart + botTimeouts.get(botId)._idleTimeout - Date.now()) / 1000) : 
        null
    });
  } catch (error) {
    console.error('Error getting bot status:', error);
    res.status(500).json({ error: 'Failed to get bot status' });
  }
});

// API helper functions
async function getCryptoPrice(coin: string) {
  try {
    const response = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${coin}&vs_currencies=usd&include_24hr_change=true&include_market_cap=true`);
    if (!response.ok) return null;
    const data = await response.json();
    return data[coin] ? {
      price_usd: data[coin].usd,
      price_change_24h: data[coin].usd_24h_change,
      market_cap: data[coin].usd_market_cap
    } : null;
  } catch (error) {
    console.error('Error fetching crypto price:', error);
    return null;
  }
}

async function getNews(query: string) {
  try {
    const response = await fetch(`https://newsapi.org/v2/everything?q=${query}&sortBy=publishedAt&pageSize=5&apiKey=${process.env.NEWS_API_KEY}`);
    if (!response.ok) return null;
    const data = await response.json();
    return data.articles?.[0] ? {
      title: data.articles[0].title,
      url: data.articles[0].url
    } : null;
  } catch (error) {
    console.error('Error fetching news:', error);
    return null;
  }
}

async function getWeather(city: string) {
  try {
    const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${process.env.OPENWEATHER_API_KEY}&units=metric`);
    if (!response.ok) return null;
    const data = await response.json();
    return {
      temp: data.main.temp,
      description: data.weather[0].description,
      city: data.name
    };
  } catch (error) {
    console.error('Error fetching weather:', error);
    return null;
  }
}

async function getExchangeRate(base: string, target: string) {
  try {
    const response = await fetch(`https://open.er-api.com/v6/latest/${base}`);
    if (!response.ok) return null;
    const data = await response.json();
    return data.rates?.[target] ? {
      rate: data.rates[target],
      last_updated: data.time_last_update_utc
    } : null;
  } catch (error) {
    console.error('Error fetching exchange rate:', error);
    return null;
  }
}

async function generateTweet(bot: any) {
  // Fetch recent chat messages for context
  const recentMessages = await prisma.message.findMany({
    where: { botId: bot.id },
    orderBy: { createdAt: 'desc' },
    take: 25,
    select: {
      role: true,
      content: true,
    },
  });

  const chatHistory = recentMessages.reverse();

  // Fetch bot settings
  const botSettings = await prisma.botSettings.findUnique({
    where: { botId: bot.id },
    select: {
      apiSettings: true
    }
  });

  // Parse API settings
  const settings: APISettings = botSettings?.apiSettings ? 
    (typeof botSettings.apiSettings === 'string' ? 
      JSON.parse(botSettings.apiSettings) : 
      botSettings.apiSettings) : 
    { crypto: false, news: false, weather: false, exchange: false };

  // Gather API data based on settings
  const apiData: any = {};
  
  if (settings.crypto) {
    apiData.solana = await getCryptoPrice('solana');
    apiData.bitcoin = await getCryptoPrice('bitcoin');
    apiData.ethereum = await getCryptoPrice('ethereum');
  }

  if (settings.news) {
    apiData.cryptoNews = await getNews('cryptocurrency');
  }

  if (settings.weather) {
    apiData.weather = await getWeather('New York'); // Default to New York
  }

  if (settings.exchange) {
    apiData.usdEur = await getExchangeRate('USD', 'EUR');
  }

  const systemPrompt = `You are ${bot.name}. ${bot.personality} ${bot.background}

  Here is your recent chat history for context (last ~12 conversations):
  ${chatHistory.map((msg: { role: string; content: string }) => `${msg.role}: ${msg.content}`).join('\n')}

  Here is the latest market and world data:
  ${apiData.solana ? `- Solana: $${apiData.solana.price_usd.toFixed(2)} (${apiData.solana.price_change_24h.toFixed(2)}% 24h)` : ''}
  ${apiData.bitcoin ? `- Bitcoin: $${apiData.bitcoin.price_usd.toFixed(2)} (${apiData.bitcoin.price_change_24h.toFixed(2)}% 24h)` : ''}
  ${apiData.ethereum ? `- Ethereum: $${apiData.ethereum.price_usd.toFixed(2)} (${apiData.ethereum.price_change_24h.toFixed(2)}% 24h)` : ''}
  ${apiData.cryptoNews ? `- Latest Crypto News: ${apiData.cryptoNews.title}` : ''}
  ${apiData.weather ? `- Weather in NYC: ${apiData.weather.temp}°C, ${apiData.weather.description}` : ''}
  ${apiData.usdEur ? `- USD/EUR: ${apiData.usdEur.rate.toFixed(4)}` : ''}

  Based on your personality and these recent conversations, generate 1 random tweet. Use this context to make your tweet more personal and connected to your recent interactions and the current market/world data provided above.

  ideas (pick ONE randomly):
  - market commentary
  - price prediction
  - reaction to news
  - weather-based mood
  - random thought
  - hot take
  - current mood
  - shower thought
  - unpopular opinion
  - random story
  - weird dream
  - conspiracy theory
  - life update
  - random confession
  - existential crisis
  - random observation
  
  RULES:
  - max 180 chars
  - typos ok
  - lowercase > uppercase
  - no hashtags
  - dont mention AI
  - reference your recent conversations if relevant
  - incorporate the market/world data naturally if relevant
  
  just tweet text nothing else.`;

  const response = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: "Generate a tweet that expresses your thoughts or shares something about yourself, possibly referencing your recent conversations and the current market/world data if relevant." }
    ],
    max_tokens: 100,
    temperature: 0.9,
  });

  return response.choices[0]?.message?.content?.trim() || '';
}

async function handleBot(botId: string) {
  try {
    console.log(`Handling bot ${botId}`);
    
    // Get bot and its settings
    const bot = await prisma.bot.findUnique({
      where: { id: botId },
      include: { twitterSettings: true }
    });

    if (!bot?.twitterSettings) {
      console.log(`No Twitter settings found for bot ${botId}`);
      return;
    }

    // Initialize Twitter client
    const twitter = new TwitterApi({
      appKey: bot.twitterSettings.appKey,
      appSecret: bot.twitterSettings.appSecret,
      accessToken: bot.twitterSettings.accessToken,
      accessSecret: bot.twitterSettings.accessSecret,
    });

    // Generate and post tweet
    const tweet = await generateTweet(bot);
    console.log(`Generated tweet for ${bot.name}: ${tweet}`);
    
    const result = await twitter.v2.tweet({ text: tweet });
    console.log(`Tweet posted successfully: ${result.data.id}`);

    // Update last tweet timestamp
    await prisma.bot.update({
      where: { id: botId },
      data: { lastTweetAt: new Date() }
    });

    // Calculate delay based on frequency
    let delay: number;
    if (bot.tweetFrequencyMinutes === 0) {
      // If frequency is 0, add a small random delay (10-30 seconds) to avoid rate limits
      delay = Math.floor(Math.random() * 20000) + 10000;
      console.log(`Zero frequency mode - next tweet for ${bot.name} in ${(delay / 1000).toFixed(1)} seconds`);
    } else {
      // Use bot's custom frequency with some randomness (±5 minutes)
      const baseDelay = bot.tweetFrequencyMinutes * 60 * 1000; // Convert minutes to milliseconds
      const randomOffset = (Math.random() - 0.5) * 10 * 60 * 1000; // ±5 minutes
      delay = baseDelay + randomOffset;
      console.log(`Next tweet for ${bot.name} in ${(delay / (60 * 60 * 1000)).toFixed(2)} hours`);
    }
    
    const timeout = setTimeout(() => handleBot(botId), delay);
    botTimeouts.set(botId, timeout);
  } catch (error) {
    console.error(`Error handling bot ${botId}:`, error);
    // Retry after 15 minutes on error
    const timeout = setTimeout(() => handleBot(botId), 15 * 60 * 1000);
    botTimeouts.set(botId, timeout);
  }
}

async function startBotServer() {
  try {
    // Get all autonomous bots
    const bots = await prisma.bot.findMany({
      where: { isAutonomous: true },
      select: { id: true, name: true }
    });

    console.log(`Starting bot server with ${bots.length} autonomous bots`);

    // Start handling each bot
    for (const bot of bots) {
      console.log(`Initializing bot: ${bot.name}`);
      // Random initial delay (0-30 minutes) to stagger bot tweets
      const initialDelay = Math.random() * 30 * 60 * 1000;
      const timeout = setTimeout(() => handleBot(bot.id), initialDelay);
      botTimeouts.set(bot.id, timeout);
    }

    // Start Express server
    const PORT = process.env.PORT || 3001;
    app.listen(PORT, () => {
      console.log(`Bot server listening on port ${PORT}`);
    });
  } catch (error) {
    console.error('Error starting bot server:', error);
    process.exit(1);
  }
}

// Start the server
startBotServer(); 