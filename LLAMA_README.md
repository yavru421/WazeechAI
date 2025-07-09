# PWLlama - Llama AI Chat PWA

A Progressive Web App that integrates with Llama AI models, allowing you to chat with various Llama models, test their performance, and explore AI capabilities directly from your browser.

## Features

- 🤖 **Multiple Llama Models**: Support for Llama-4-Maverick, Llama-4-Scout, Llama-3.3-70B, and Llama-3.3-8B models
- 💬 **Interactive Chat**: Real-time conversations with AI models
- 🔄 **Streaming Responses**: Live streaming of AI responses as they're generated
- 📊 **Model Testing**: Compare all available models with the same prompts
- 🏆 **Performance Benchmarking**: Detailed performance analysis and rankings
- 💾 **Offline-Ready**: PWA capabilities for offline functionality
- 🔐 **Secure API Key Storage**: Local storage of API credentials
- 📱 **Responsive Design**: Works on desktop, tablet, and mobile devices

## Getting Started

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Start Development Server**
   ```bash
   npm run dev
   ```

3. **Configure API Key**
   - Navigate to the Chat page
   - Enter your Llama API key
   - The key is stored securely in your browser's local storage

4. **Start Chatting**
   - Select a model from the dropdown
   - Type your message and click Send
   - Try the streaming mode for real-time responses

## API Integration

The app uses the `llama-api-client` library to interact with Llama models. The integration includes:

### Service Layer (`src/services/llama-api.ts`)

- **LlamaAPIService**: Main service class for API interactions
- **Model Management**: Support for multiple Llama model variants
- **Chat Functionality**: Both regular and streaming chat capabilities
- **Testing Utilities**: Built-in model comparison and benchmarking
- **Error Handling**: Comprehensive error management and user feedback

### Key Features

- **Dynamic Model Selection**: Switch between different Llama models
- **Conversation Memory**: Maintains chat history within sessions
- **Performance Metrics**: Response time and token usage tracking
- **Streaming Support**: Real-time response generation
- **Bulk Testing**: Test all models simultaneously with custom prompts

## Architecture

### Frontend Stack
- **Lit**: Web components framework
- **TypeScript**: Type-safe development
- **Shoelace**: UI component library
- **Vite**: Build tool and dev server
- **PWA**: Progressive Web App capabilities

### API Integration
- **llama-api-client**: Official Llama API client
- **Environment Polyfill**: Browser compatibility for Node.js modules
- **Local Storage**: Secure credential management
- **Error Boundary**: Graceful error handling

## Usage Examples

### Basic Chat
```typescript
const response = await llamaService.chat(
  [{ role: 'user', content: 'Hello!' }],
  'Llama-3.3-70B-Instruct'
);
```

### Streaming Chat
```typescript
const stream = llamaService.chatStream(
  [{ role: 'user', content: 'Tell me a story' }],
  'Llama-3.3-70B-Instruct'
);

for await (const chunk of stream) {
  if (!chunk.isComplete) {
    console.log(chunk.text);
  }
}
```

### Model Testing
```typescript
const results = await llamaService.testAllModels(
  "Explain quantum computing"
);
```

### Performance Benchmarking
```typescript
const benchmark = await llamaService.benchmarkModels();
console.log(benchmark.rankings);
```

## Available Models

1. **Llama-4-Maverick-17B-128E-Instruct-FP8**
   - Fast and efficient for general tasks
   - Good for quick responses

2. **Llama-4-Scout-17B-16E-Instruct-FP8**
   - Creative and detailed responses
   - Excellent for descriptive tasks

3. **Llama-3.3-70B-Instruct**
   - Most comprehensive and detailed
   - Best for complex reasoning tasks

4. **Llama-3.3-8B-Instruct**
   - Practical and helpful
   - Great for everyday tasks

## Security & Privacy

- **Local API Key Storage**: Keys are stored only in your browser
- **No Server Communication**: Direct API calls to Llama service
- **Privacy First**: No conversation data is stored or transmitted to our servers
- **Secure Context**: HTTPS required for PWA features

## Development

### Project Structure
```
src/
├── services/
│   └── llama-api.ts          # Main API service
├── pages/
│   ├── app-home.ts           # Home page
│   └── app-chat.ts           # Chat interface
├── utils/
│   └── environment.ts        # Environment polyfill
├── types/
│   └── llama-api-client.d.ts # Type definitions
└── components/
    └── header.ts             # Navigation header
```

### Key Components

- **LlamaAPIService**: Core API integration
- **AppChat**: Main chat interface component
- **Environment Utils**: Browser compatibility helpers
- **Type Definitions**: TypeScript support for API client

## Building for Production

```bash
npm run build
```

The built files will be in the `dist/` directory, ready for deployment to any static hosting service.

## Deployment

This PWA can be deployed to:
- **Azure Static Web Apps**
- **Netlify**
- **Vercel**
- **GitHub Pages**
- Any static hosting service

## License

MIT License - see LICENSE.txt for details

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

---

Built with ❤️ using PWABuilder starter and Llama AI
