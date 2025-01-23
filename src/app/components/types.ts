import { Bot as PrismaBot } from '@prisma/client';

export type Bot = {
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
  lastTweetAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  wallet?: {
    publicKey: string;
    privateKey: string;
  };
  tweetingEnabled?: boolean;
  tweetInterval?: number;
  twitterUsername?: string | null;
  twitterUserId?: string | null;
}

export interface DesktopInterfaceProps {
  bots: Bot[];
  onBotDelete: (id: string) => void;
  isLoading: boolean;
  onUploadClick: () => void;
  setBots: (bots: Bot[] | ((prev: Bot[]) => Bot[])) => void;
  isCreating?: boolean;
} 