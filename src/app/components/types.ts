export interface Bot {
  id: string;
  name: string;
  imageUrl: string;
  personality: string;
  background: string;
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