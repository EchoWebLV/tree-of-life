import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { prisma } from '@/lib/prisma';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(request: Request) {
  try {
    const { botId } = await request.json();

    // Fetch the bot to get its personality and settings
    const bot = await prisma.bot.findUnique({
      where: { id: botId },
      include: {
        settings: true,
      },
    });

    if (!bot) {
      return NextResponse.json({ error: 'Bot not found' }, { status: 404 });
    }

    // Fetch recent chat messages for context
    const recentMessages = await prisma.message.findMany({
      where: { botId: bot.id },
      orderBy: { createdAt: 'desc' },
      take: 25, // Get last 25 messages (about 12-13 conversation turns) for richer context
      select: {
        role: true,
        content: true,
      },
    });

    // Reverse messages to get chronological order
    const chatHistory = recentMessages.reverse();

    // Use custom tweet prompt if available, otherwise use default
    const tweetPrompt = bot.tweetPrompt || `You are ${bot.name}. ${bot.personality} ${bot.background}

    Here is your recent chat history for context (last ~12 conversations):
    ${chatHistory.map(msg => `${msg.role}: ${msg.content}`).join('\n')}

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

    // Initialize the chat model
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      generationConfig: {
        maxOutputTokens: 180,
        temperature: 0.9,
      }
    });

    const chat = model.startChat({
      history: [
        {
          role: "user",
          parts: [{ text: tweetPrompt }]
        },
        {
          role: "model",
          parts: [{ text: "I understand and will generate a tweet in character." }]
        }
      ],
    });

    // Generate the tweet
    const result = await chat.sendMessage([{
      text: "Generate a tweet that expresses your thoughts or shares something about yourself, possibly referencing your recent conversations if relevant."
    }]);
    const response = await result.response;

    const tweet = response.text().trim();

    // Validate tweet length (Twitter's limit is 280 characters)
    if (tweet.length > 280) {
      // Try to generate again with a stronger emphasis on length
      const retryResult = await chat.sendMessage([{
        text: "That tweet was too long. Please generate a shorter tweet, under 180 characters."
      }]);
      const retryResponse = await retryResult.response;
      const retryTweet = retryResponse.text().trim();

      if (retryTweet.length <= 280) {
        return NextResponse.json({ tweet: retryTweet });
      } else {
        // If still too long, truncate with ellipsis
        return NextResponse.json({ tweet: tweet.slice(0, 277) + '...' });
      }
    }

    return NextResponse.json({ tweet });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Failed to generate tweet' }, { status: 500 });
  }
} 