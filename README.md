# WazeechAI

A cutting-edge Progressive Web App for chatting with WazeechAI models, featuring voice interaction, smart suggestions, analytics dashboard, and AI-generated themes.

## 🚀 Cutting-Edge Features

- 🎤 **Voice Chat**: Real-time speech recognition and synthesis
- 🧠 **Smart Suggestions**: AI-powered context-aware prompt suggestions
- 📊 **Analytics Dashboard**: Deep conversation insights and performance metrics
- 🎨 **Dynamic Themes**: AI-generated themes based on conversation mood
- �️ **Multi-modal Support**: Image uploads and rich content display
- 🤖 **Multiple Llama Models**: Support for Llama-4-Maverick, Llama-4-Scout, Llama-3.3-70B, and Llama-3.3-8B
- 💬 **Interactive Chat Interface**: Real-time conversations with AI models
- 🔄 **Streaming Responses**: Live streaming of AI responses as they're generated
- 📊 **Model Comparison**: Test all available models with the same prompts
- 🏆 **Performance Benchmarking**: Detailed performance analysis and rankings
- 💾 **Offline-Ready**: PWA capabilities with service worker
- 🔐 **Secure Storage**: Local API key storage in browser
- 📱 **Responsive Design**: Works on desktop, tablet, and mobile

## 🛠️ Getting Started

### Prerequisites
- Node.js (v16 or higher)
- A Llama API key from your provider

### Installation

1. **Clone and Install**
   ```bash
   git clone <repository-url>
   cd pwllama
   npm install
   ```

2. **Start Development Server**
   ```bash
   npm run dev
   ```

3. **Open the App**
   - Navigate to `http://localhost:5173`
   - Go to the "Chat" page
   - Enter your Llama API key
   - Start chatting!

### Building for Production

```bash
npm run build
```

## 🦙 Llama API Integration

This app showcases a complete integration of the Llama API using the examples from your `example_usage.py` file, adapted for a browser PWA environment.

### Key Integration Components

#### 1. **LlamaAPIService** (`src/services/llama-api.ts`)
A comprehensive service that wraps the `llama-api-client` with PWA-friendly features:

```typescript
// Basic chat
const response = await llamaService.chat(
  [{ role: 'user', content: 'Hello!' }],
  'Llama-3.3-70B-Instruct'
);

// Streaming chat
const stream = llamaService.chatStream(messages, model);
for await (const chunk of stream) {
  console.log(chunk.text);
}

// Test all models
const results = await llamaService.testAllModels("Your prompt");

// Benchmark performance
const benchmark = await llamaService.benchmarkModels();
```

#### 2. **Chat Interface** (`src/pages/app-chat.ts`)
A complete chat UI built with Lit and Shoelace components featuring:
- Model selection dropdown
- Message history
- Streaming response display
- Example prompts
- Performance testing tools

#### 3. **Environment Setup** (`src/utils/environment.ts`)
Browser polyfills for Node.js environment variables, enabling the `llama-api-client` to work in browsers.

### Supported Models

| Model | Description | Best For |
|-------|-------------|----------|
| **Llama-4-Maverick-17B** | Fast and efficient | Quick responses |
| **Llama-4-Scout-17B** | Creative and detailed | Descriptive tasks |
| **Llama-3.3-70B-Instruct** | Most comprehensive | Complex reasoning |
| **Llama-3.3-8B-Instruct** | Practical and helpful | Everyday tasks |

Based on your performance analysis, **Llama-3.3-70B-Instruct** provides the most comprehensive responses, while **Llama-4-Scout** excels at creative tasks.

## 🏗️ Project Structure

```
src/
├── services/
│   └── llama-api.ts          # Main Llama API service
├── pages/
│   ├── app-home.ts           # Home page with navigation
│   ├── app-chat.ts           # Chat interface
│   └── app-about/            # About page
├── components/
│   └── header.ts             # Navigation header
├── utils/
│   └── environment.ts        # Browser environment polyfill
└── types/
    └── llama-api-client.d.ts # TypeScript definitions
```

## 🔧 Technical Details

### PWA Features
- **Service Worker**: Offline capability and caching
- **Manifest**: App installation and branding
- **Responsive**: Mobile-first design with Shoelace components

### API Integration
- **Dynamic Imports**: Lazy loading of API client
- **Error Handling**: Comprehensive error management
- **Performance Tracking**: Response time and token usage monitoring
- **Local Storage**: Secure API key persistence

### Browser Compatibility
- **Environment Polyfill**: Makes Node.js modules work in browsers
- **Type Safety**: Full TypeScript support
- **Modern Frameworks**: Lit web components with reactive state

## 🚀 Usage Examples

### Basic Chat
```javascript
// In browser console after API key setup
const response = await llamaService.chat(
  [{ role: 'user', content: 'Explain quantum computing' }],
  'Llama-3.3-70B-Instruct'
);
console.log(response.content);
```

### Model Comparison
```javascript
// Test all models with the same prompt
const results = await llamaService.testAllModels(
  'Write a haiku about artificial intelligence'
);
```

### Performance Benchmarking
```javascript
// Get detailed performance metrics
const benchmark = await llamaService.benchmarkModels();
console.log(benchmark.rankings);
```

## 🔐 Security & Privacy

- **Local Storage**: API keys stored only in your browser
- **No Server Communication**: Direct API calls to Llama service
- **Privacy First**: No conversation data transmitted to third parties
- **HTTPS Required**: Secure context for PWA features

## 📱 PWA Deployment

This app can be deployed to any static hosting service:

- **Azure Static Web Apps** (recommended)
- **Netlify**
- **Vercel**
- **GitHub Pages**

```bash
npm run build
# Deploy the dist/ folder to your hosting service
```

## 🏗️ GitHub Pages Deployment

This PWA is fully configured for GitHub Pages deployment:

### Automatic Deployment

1. **Push to main branch** triggers automatic deployment via GitHub Actions
2. **GitHub Actions workflow** builds and deploys the PWA
3. **Custom domain support** available in repository settings
4. **HTTPS enabled** automatically for PWA requirements

### Setup Instructions

1. **Enable GitHub Pages**:
   - Go to repository Settings → Pages
   - Set source to "GitHub Actions"
   - Optionally configure custom domain

2. **Update Base Path** (if needed):
   ```typescript
   // In vite.config.ts, update the base path to match your repo name
   base: process.env.NODE_ENV === 'production' ? '/your-repo-name/' : "/",
   ```

3. **Deploy**:
   ```bash
   # Build for GitHub Pages
   npm run build:github

   # Preview locally before deploying
   npm run preview
   ```

### Live Demo
Once deployed, your PWA will be available at:
`https://[username].github.io/[repository-name]/`

## 🤝 Contributing

Based on the PWABuilder starter template with Llama AI integration.

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test with different Llama models
5. Submit a pull request

## 📄 License

MIT License - see LICENSE.txt

---

**Built with** 🦙 **Llama AI** • 🔥 **Lit** • ⚡ **Vite** • 🎨 **Shoelace** • 💪 **TypeScript**

This project demonstrates how to integrate the Llama API examples from your Python scripts into a modern Progressive Web App environment, providing a complete browser-based AI chat experience.
