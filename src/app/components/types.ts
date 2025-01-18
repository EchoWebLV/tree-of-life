export interface Bot {
  id: string;
  name: string;
  personality: string;
  background: string;
  imageUrl: string;
  clientToken: string;
  createdAt: string;
  updatedAt: string;
  isPublic: boolean;
  wallet?: {
    publicKey: string;
    privateKey: string;
  };
}

export interface DesktopInterfaceProps {
  bots: Bot[];
  onBotDelete: (id: string) => void;
  isLoading: boolean;
  onUploadClick: () => void;
  setBots: (bots: Bot[] | ((prev: Bot[]) => Bot[])) => void;
  isCreating?: boolean;
} 