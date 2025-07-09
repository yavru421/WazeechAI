/**
 * PWLlama Demo Script
 * Demonstrates the Llama API integration in the PWA
 * 
 * This script can be run in the browser console to test the API integration
 * after setting up an API key in the chat interface.
 */

// Example usage in browser console:
// 1. Go to the Chat page and configure your API key
// 2. Open browser console (F12)
// 3. Copy and paste this script to test the API

async function demoLlamaAPI() {
  console.log('🦙 PWLlama Demo Starting...');
  
  // Import the service (assumes it's already loaded in the page)
  const { llamaService } = await import('./src/services/llama-api.js');
  
  if (!llamaService.isConfigured()) {
    console.error('❌ API key not configured. Please set up your API key in the Chat interface first.');
    return;
  }
  
  console.log('✅ API key is configured');
  
  // Test basic chat
  console.log('\n📝 Testing basic chat...');
  try {
    const response = await llamaService.chat(
      [{ role: 'user', content: 'Hello! Can you introduce yourself in one sentence?' }],
      'Llama-3.3-8B-Instruct',
      { maxTokens: 100 }
    );
    
    console.log('Response:', response.content);
    console.log('Model:', response.model);
    console.log('Response time:', response.responseTime, 'ms');
  } catch (error) {
    console.error('Chat error:', error);
  }
  
  // Test all models
  console.log('\n🚀 Testing all models...');
  try {
    const results = await llamaService.testAllModels('What is artificial intelligence?');
    
    Object.entries(results).forEach(([modelId, result]) => {
      const model = llamaService.models.find(m => m.id === modelId);
      console.log(`\n--- ${model?.name || modelId} ---`);
      
      if ('error' in result) {
        console.error('Error:', result.error);
      } else {
        console.log('Response:', result.content.substring(0, 100) + '...');
        console.log('Response time:', result.responseTime, 'ms');
        console.log('Content length:', result.content.length, 'characters');
      }
    });
  } catch (error) {
    console.error('Model testing error:', error);
  }
  
  console.log('\n🏁 Demo completed!');
}

// Auto-run if in browser environment
if (typeof window !== 'undefined') {
  console.log('PWLlama Demo Script Loaded. Run demoLlamaAPI() to test the integration.');
}

// Export for manual execution
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { demoLlamaAPI };
}
