import OpenAI from 'openai';
import { prisma } from './prisma';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function generateTweet(botId: string): Promise<string> {
  // Get bot's persona
  const bot = await prisma.bot.findUnique({
    where: { id: botId },
  });

  if (!bot) {
    throw new Error('Bot not found');
  }

  const prompt = `You are ${bot.name}, with the following persona: ${bot.personality}. 
Generate a single tweet (max 280 characters) that matches this persona. 
The tweet should be engaging and natural-sounding.
Do not include hashtags unless they're genuinely relevant.
Only return the tweet text, nothing else.`;

  const completion = await openai.chat.completions.create({
    messages: [{ role: "user", content: prompt }],
    model: "gpt-4-turbo-preview",
    temperature: 0.9,
    max_tokens: 100,
  });

  const tweet = completion.choices[0]?.message?.content?.trim();
  
  if (!tweet) {
    throw new Error('Failed to generate tweet');
  }

  // Ensure tweet is within Twitter's character limit
  if (tweet.length > 280) {
    return tweet.slice(0, 277) + '...';
  }

  return tweet;
} 