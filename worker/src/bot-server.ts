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
    // Clear existing timeout
    const existingTimeout = botTimeouts.get(botId);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
      botTimeouts.delete(botId);
    }

    // Start bot if it should be running
    const bot = await prisma.bot.findUnique({
      where: { id: botId },
      include: { twitterSettings: true }
    });

    if (bot?.isAutonomous) {
      handleBot(botId);
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error refreshing bot:', error);
    res.status(500).json({ error: 'Failed to refresh bot' });
  }
});

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

  const systemPrompt = `You are ${bot.name}. ${bot.personality} ${bot.background}

  Here is your recent chat history for context (last ~12 conversations):
  ${chatHistory.map((msg: { role: string; content: string }) => `${msg.role}: ${msg.content}`).join('\n')}

  Based on your personality and these recent conversations, generate 1 random tweet. Use this context to make your tweet more personal and connected to your recent interactions, but don't be too obvious about referencing specific conversations. be chaotic and natural.

  ideas (pick ONE randomly):
  - random thought
  - hot take
  - current mood
  - food craving
  - shower thought
  - unpopular opinion
  - random story
  - weird dream
  - conspiracy theory
  - life update
  - random confession
  - pet peeve
  - existential crisis
  - random observation
  
  RULES:
  - max 180 chars
  - typos ok
  - lowercase > uppercase
  - no hashtags
  - dont mention AI
  - reference your recent conversations if relevant
  
  just tweet text nothing else.`;

  const response = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: "Generate a tweet that expresses your thoughts or shares something about yourself, possibly referencing your recent conversations if relevant." }
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

    // Use bot's custom frequency with some randomness (±5 minutes)
    const baseDelay = bot.tweetFrequencyMinutes * 60 * 1000; // Convert minutes to milliseconds
    const randomOffset = (Math.random() - 0.5) * 10 * 60 * 1000; // ±5 minutes
    const delay = baseDelay + randomOffset;
    
    console.log(`Next tweet for ${bot.name} in ${(delay / (60 * 60 * 1000)).toFixed(2)} hours`);
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