# AI Roundtable - Intelligent Multi-Model Conversations

A sophisticated AI roundtable discussion platform built with Next.js 14+, featuring dynamic conversations between multiple AI models with distinct personas in real-time.

## 🚀 Features

- **Multi-AI Integration**: Supports OpenAI, Anthropic, Google Gemini, Groq, and more
- **Dynamic Personas**: Each AI model has a unique personality and conversation style
- **Real-time Interface**: Server-Sent Events for live conversation updates
- **Auburn University Branding**: Beautiful orange and navy color scheme
- **Conversation Modes**: Witty, Comedic, Serious, and Academic discussion styles
- **Smart Turn Management**: Intelligent AI selection and conversation flow
- **Responsive Design**: Works seamlessly on desktop and mobile
- **Glass-morphism UI**: Modern design with smooth animations

## 🛠️ Tech Stack

- **Framework**: Next.js 14+ with TypeScript and App Router
- **Styling**: Tailwind CSS with custom Auburn University theme
- **UI Components**: shadcn/ui with Radix UI primitives
- **State Management**: Zustand for client state
- **Data Fetching**: TanStack React Query for server state
- **Animations**: Framer Motion for smooth micro-interactions
- **AI Providers**: Multiple AI SDKs (OpenAI, Anthropic, Google, etc.)
- **Deployment**: Optimized for Vercel serverless platform

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- npm or yarn
- AI API keys (see Environment Setup)

### Installation

1. **Clone and Install**
```bash
cd ai-roundtable
npm install
```

2. **Environment Setup**
```bash
cp .env.example .env.local
```

Edit `.env.local` with your AI API keys:
```env
# AI API Keys
OPENAI_API_KEY_1=your-openai-key-1
OPENAI_API_KEY_2=your-openai-key-2
ANTHROPIC_API_KEY_1=your-anthropic-key-1
ANTHROPIC_API_KEY_2=your-anthropic-key-2
GEMINI_API_KEY_1=your-gemini-key-1
GEMINI_API_KEY_2=your-gemini-key-2
GROQ_API_KEY=your-groq-key
# ... other keys
```

3. **Start Development Server**
```bash
npm run dev
```

4. **Build for Production**
```bash
npm run build
npm start
```

## 🤖 AI Models & Personas

The platform supports multiple AI providers with unique personas:

### OpenAI
- **GPT-4 (Creative Thinker)**: Innovative and imaginative responses
- **GPT-3.5-Turbo (Analytical Mind)**: Logical and systematic analysis

### Anthropic
- **Claude-3-Opus (Philosophical Guide)**: Deep, thoughtful perspectives
- **Claude-3-Sonnet (Pragmatic Advisor)**: Practical, actionable insights

### Google Gemini
- **Gemini-Pro (Curious Explorer)**: Inquisitive and discovery-focused
- **Gemini-Pro (Detail Seeker)**: Thorough and comprehensive analysis

### Groq
- **Mixtral-8x7b (Swift Responder)**: Quick, efficient responses
- **Llama2-70b (Logic Engine)**: Structured, logical reasoning

## 💬 Conversation Modes

- **Witty**: Clever observations and engaging humor
- **Comedic**: Light-hearted jokes and amusing takes
- **Serious**: Professional and thoughtful discussion
- **Academic**: Scholarly analysis with analytical depth

## 📡 API Endpoints

### AI Generation
- `POST /api/ai/generate` - Generate AI responses
- `GET /api/ai/generate` - Get available AI models

### Roundtable Management
- `POST /api/roundtable/start` - Start new roundtable session
- `GET /api/roundtable/[sessionId]` - Get session info
- `PUT /api/roundtable/[sessionId]` - Update session state
- `DELETE /api/roundtable/[sessionId]` - End session

### Real-time Updates
- `GET /api/sse/[sessionId]` - Server-Sent Events stream

## 🚀 Deployment

### Vercel Deployment (Recommended)

1. **Connect Repository**
   - Push code to GitHub/GitLab
   - Connect to Vercel dashboard

2. **Environment Variables**
   - Add all API keys to Vercel environment variables
   - Set `NODE_ENV=production`

3. **Deploy**
   ```bash
   vercel --prod
   ```

## 🔐 Security Features

- **API Key Rotation**: Multiple keys per provider for redundancy
- **Rate Limiting**: Prevents API quota exhaustion
- **Input Sanitization**: Secure topic and message handling
- **Error Boundaries**: Graceful error handling

## 📱 Mobile Experience

The application is fully responsive with:
- **Swipeable AI Cards**: Horizontal scroll on mobile
- **Touch Gestures**: Tap to expand messages
- **Optimized Typography**: Readable text on all screen sizes

## 🐛 Troubleshooting

### Common Issues

1. **Build Errors**
   - Ensure all dependencies are installed
   - Check TypeScript version compatibility
   - Verify environment variables

2. **API Failures**
   - Verify API keys are correct and active
   - Check API rate limits
   - Review network connectivity

## 📄 License

This project is licensed under the MIT License.

---

Built with ❤️ using Next.js 14+ and TypeScript
