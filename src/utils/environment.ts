/**
 * Environment configuration utility for PWLlama
 * Provides utilities for managing environment variables in a browser context
 */

export interface EnvironmentConfig {
  LLAMA_API_KEY?: string;
}

/**
 * Polyfill for process.env in browser environments
 * This allows the llama-api-client to work in browsers
 */
export function setupEnvironmentPolyfill(): void {
  if (typeof window !== 'undefined' && !(window as any).process) {
    (window as any).process = {
      env: {}
    };
  }
}

/**
 * Set an environment variable in the browser context
 */
export function setEnvironmentVariable(key: string, value: string): void {
  setupEnvironmentPolyfill();

  if (typeof window !== 'undefined') {
    (window as any).process.env[key] = value;
  }
}

/**
 * Get an environment variable from the browser context
 */
export function getEnvironmentVariable(key: string): string | undefined {
  setupEnvironmentPolyfill();

  if (typeof window !== 'undefined') {
    return (window as any).process.env[key];
  }

  return undefined;
}

/**
 * Load environment configuration from localStorage
 */
export function loadEnvironmentFromStorage(): EnvironmentConfig {
  const config: EnvironmentConfig = {};

  try {
    const apiKey = localStorage.getItem('llama_api_key');
    if (apiKey) {
      config.LLAMA_API_KEY = apiKey;
      setEnvironmentVariable('LLAMA_API_KEY', apiKey);
    }
  } catch (error) {
    console.warn('Failed to load environment from storage:', error);
  }

  return config;
}

/**
 * Save environment configuration to localStorage
 */
export function saveEnvironmentToStorage(config: EnvironmentConfig): void {
  try {
    if (config.LLAMA_API_KEY) {
      localStorage.setItem('llama_api_key', config.LLAMA_API_KEY);
      setEnvironmentVariable('LLAMA_API_KEY', config.LLAMA_API_KEY);
    }
  } catch (error) {
    console.warn('Failed to save environment to storage:', error);
  }
}

/**
 * Initialize environment on app startup
 */
export function initializeEnvironment(): void {
  setupEnvironmentPolyfill();
  loadEnvironmentFromStorage();
}

// Auto-initialize when module is imported
initializeEnvironment();

// --- Global fetch override to force Vite proxy and inject Authorization header for Llama API ---
if (typeof window !== 'undefined') {
  const originalFetch = window.fetch;
  window.fetch = async function(input: any, init?: RequestInit) {
    let url: string | undefined = undefined;
    if (typeof input === 'string') {
      url = input;
    } else if (input instanceof Request) {
      url = input.url;
    } else if (input instanceof URL) {
      url = input.toString();
    }

    // Proxy in dev
    if (window.location.hostname === 'localhost' && url && url.startsWith('https://api.llama.com/v1/')) {
      url = url.replace('https://api.llama.com/v1/', '/v1/');
      if (typeof input === 'string' || input instanceof URL) {
        input = url;
      } else if (input instanceof Request) {
        input = new Request(url, input);
      }
    }

    // Inject Authorization header if calling Llama API (proxy or direct)
    const isLlamaApi = url && (url.startsWith('/v1/') || url.startsWith('https://api.llama.com/v1/'));
    if (isLlamaApi) {
      let apiKey = localStorage.getItem('llama_api_key') || (window as any).process?.env?.LLAMA_API_KEY;
      if (apiKey) {
        let headers: Record<string, string> = {};
        const origHeaders = (init && init.headers) || (input instanceof Request ? input.headers : undefined);
        if (origHeaders instanceof Headers) {
          origHeaders.forEach((v, k) => { headers[k] = v; });
        } else if (Array.isArray(origHeaders)) {
          for (const [k, v] of origHeaders) headers[k] = v;
        } else if (origHeaders && typeof origHeaders === 'object') {
          headers = { ...origHeaders };
        }
        headers['Authorization'] = `Bearer ${apiKey}`;
        headers['Content-Type'] = headers['Content-Type'] || 'application/json';
        if (input instanceof Request) {
          input = new Request(input, { headers });
        } else {
          init = { ...(init || {}), headers };
        }
      }
    }
    return originalFetch(input, init);
  };
}
