# Druid AI

Druid AI is a sophisticated Next.js-based platform that creates AI-powered digital companions from images and NFTs, featuring a unique desktop-style interface and blockchain integration.

## 🌟 Features

- **AI Personality Generation**: Create unique AI personas from uploaded images or NFTs
- **Multi-Model Chat System**: 
  - OpenAI GPT-4
  - Deepseek Chat
  - X.AI's Grok
  - Uncensored chat capabilities via ModelsLab
- **NFT Integration**: 
  - Support for Ethereum and Solana NFTs
  - NFT-based personality generation
  - Token deployment capabilities
- **Real-Time Data Integration**:
  - Cryptocurrency price tracking
  - News updates
  - Weather information
  - Exchange rate conversion
- **Social Features**:
  - Autonomous tweet generation
  - Public bot sharing
  - Personality customization
- **Desktop-Style Interface**: Modern UI with window management and desktop icons
- **Security Features**:
  - Token-based authentication
  - Rate limiting
  - Environment variable protection

## 🚀 Getting Started

### Prerequisites

- Node.js 16.x or higher
- npm or yarn package manager
- A modern web browser
- Required API Keys:
  - OpenAI API key
  - OpenRouter API key (for Deepseek)
  - X.AI API key
  - ModelsLab API key (for uncensored chat)
- (Optional) Solana wallet for token features

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/druid-ai.git
cd druid-ai
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Set up environment variables:
Create a `.env.local` file with the following:
```env
OPENAI_API_KEY=your_openai_key
OPENROUTER_API_KEY=your_openrouter_key
XAI_API_KEY=your_xai_key
MODELSLAB_API_KEY=your_modelslab_key
```

4. Start the development server:
```bash
npm run dev
# or
yarn dev
```

5. Open [http://localhost:3000](http://localhost:3000) to view the application

## 🛠️ Technology Stack

- **Frontend**: Next.js 13+, React, TypeScript
- **AI Integration**: 
  - OpenAI GPT-4
  - Deepseek Chat
  - X.AI Grok
  - ModelsLab
- **Blockchain**: 
  - Solana Web3.js
  - Ethereum integration
- **Database**: Prisma ORM
- **API**: Next.js API routes with rate limiting
- **Styling**: Modern UI with responsive design

## 🔐 Security

- Rate limiting implementation
- Secure API key management
- Environment variable protection
- Blockchain wallet integration

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! Feel free to check the issues page.

## 📧 Contact

[Add your contact information here]

---

Built with 🌿 by [Your Team Name]
