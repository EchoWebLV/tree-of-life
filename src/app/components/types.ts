import { Bot as PrismaBot } from '@prisma/client';

export interface Bot {
  id: string;
  name: string;
  imageUrl: string;
  personality: string;
  background: string;
  authToken: string;
  clientToken: string;
  isPublic: boolean;
  isAutonomous: boolean;
  tweetFrequencyMinutes: number;
  createdAt: Date;
  updatedAt: Date;
  lastTweetAt: Date | null;
  tweetingEnabled: boolean;
  tweetInterval: number;
  twitterUsername: string | null;
  twitterUserId: string | null;
  wallet?: {
    publicKey: string;
    privateKey: string;
  };
  tweetPrompt?: string;
}

export interface DesktopInterfaceProps {
  bots: Bot[];
  onBotDelete: (id: string) => void;
  isLoading: boolean;
  onUploadClick: () => void;
  setBots: (bots: Bot[] | ((prev: Bot[]) => Bot[])) => void;
  isCreating?: boolean;
} 