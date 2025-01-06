export interface NFTResponse {
  nft_id: string;
  chain: 'ethereum' | 'solana';
  contract_address: string;
  token_id: string;
  name: string;
  description: string;
  previews: {
    image_small_url?: string;
    image_medium_url?: string;
    image_large_url?: string;
    image_opengraph_url?: string;
    blurhash?: string;
    predominant_color?: string;
  };
  image_url: string;
  image_properties?: {
    width: number;
    height: number;
    size: number;
    mime_type: string;
    exif_orientation: string | null;
  };
  collection: {
    collection_id: string;
    name: string;
    description: string;
    image_url: string;
    external_url?: string;
    twitter_username?: string;
    discord_url?: string;
    instagram_username?: string;
  };
  extra_metadata: {
    attributes: Array<{
      trait_type: string;
      value: string;
      display_type: null | string;
    }>;
    image_original_url?: string;
    animation_original_url?: string;
    metadata_original_url?: string;
  };
  created_date: string;
  status: string;
  contract?: {
    type: string;
    name: string;
    symbol: string;
  };
} 