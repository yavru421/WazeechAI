// service-status.ts
import { llamaService } from './llama-api';
import { voiceService } from './voice-service';
import { analyticsService } from './analytics';
import { dynamicThemeEngine } from './dynamic-themes';
import { fileHandlingService } from './file-handling';

export interface ServiceStatus {
  id: string;
  label: string;
  ready: boolean;
  description: string;
  error?: string;
}

interface ServiceCheck {
  id: string;
  label: string;
  description: string;
  check: () => Promise<{ ready: boolean; error?: string }>;
}

const serviceChecks: ServiceCheck[] = [
  {
    id: 'llama',
    label: 'Llama API',
    description: 'Core AI chat service',
    check: async () => {
      try {
        const ready = llamaService.isConfigured();
        return { ready, error: !ready ? 'API key not configured' : undefined };
      } catch (error) {
        return { ready: false, error: String(error) };
      }
    },
  },
  {
    id: 'voice',
    label: 'Voice',
    description: 'Speech recognition & synthesis',
    check: async () => {
      try {
        const ready = voiceService.isSupported;
        return { ready, error: !ready ? 'Not supported in this browser' : undefined };
      } catch (error) {
        return { ready: false, error: String(error) };
      }
    },
  },
  {
    id: 'analytics',
    label: 'Analytics',
    description: 'Conversation analytics',
    check: async () => {
      try {
        await analyticsService.generateAnalytics();
        return { ready: true };
      } catch (error) {
        return { ready: false, error: String(error) };
      }
    },
  },
  {
    id: 'themes',
    label: 'Themes',
    description: 'AI-generated dynamic themes',
    check: async () => {
      try {
        const ready = !!dynamicThemeEngine.getCurrentTheme();
        if (!ready) dynamicThemeEngine.resetToDefault();
        return { ready: true };
      } catch (error) {
        return { ready: false, error: String(error) };
      }
    },
  },
  {
    id: 'file',
    label: 'File Handling',
    description: 'Drag & drop, file analysis, OS file handler',
    check: async () => {
      try {
        const ready = 'launchQueue' in window || !!window.FileReader;
        return { ready, error: !ready ? 'File APIs not supported' : undefined };
      } catch (error) {
        return { ready: false, error: String(error) };
      }
    },
  },
  {
    id: 'sw',
    label: 'Offline/PWA',
    description: 'Offline support, installability',
    check: async () => {
      try {
        const swReady = 'serviceWorker' in navigator;
        if (!swReady) return { ready: false, error: 'Service worker not supported' };
        const reg = await navigator.serviceWorker.getRegistration();
        return { ready: !!reg, error: !reg ? 'Service worker not registered' : undefined };
      } catch (error) {
        return { ready: false, error: String(error) };
      }
    },
  },
  {
    id: 'push',
    label: 'Push Notifications',
    description: 'Real-time notifications',
    check: async () => {
      try {
        const ready = 'Notification' in window && 'serviceWorker' in navigator;
        if (!ready) return { ready: false, error: 'Push API not supported' };
        const permission = Notification.permission;
        return {
          ready: permission === 'granted' || permission === 'default',
          error: permission !== 'granted' && permission !== 'default' ? 'Notifications not granted' : undefined,
        };
      } catch (error) {
        return { ready: false, error: String(error) };
      }
    },
  },
  {
    id: 'sync',
    label: 'Background Sync',
    description: 'Sync messages/files when online',
    check: async () => {
      try {
        const ready = 'serviceWorker' in navigator && 'SyncManager' in window;
        return { ready, error: !ready ? 'Background sync not supported' : undefined };
      } catch (error) {
        return { ready: false, error: String(error) };
      }
    },
  },
  {
    id: 'share',
    label: 'Share Target',
    description: 'Share to app from other apps',
    check: async () => {
      try {
        const ready = 'share' in navigator;
        return { ready, error: !ready ? 'Web Share API not supported' : undefined };
      } catch (error) {
        return { ready: false, error: String(error) };
      }
    },
  },
  {
    id: 'periodic',
    label: 'Periodic Sync',
    description: 'Periodic background tasks',
    check: async () => {
      try {
        const ready = 'serviceWorker' in navigator && 'periodicSync' in (navigator.serviceWorker as any);
        return { ready, error: !ready ? 'Periodic background sync not supported' : undefined };
      } catch (error) {
        return { ready: false, error: String(error) };
      }
    },
  },
  {
    id: 'badge',
    label: 'Badging',
    description: 'Show unread count on app icon',
    check: async () => {
      try {
        const ready = 'setAppBadge' in navigator || 'setClientBadge' in navigator;
        return { ready, error: !ready ? 'Badging API not supported' : undefined };
      } catch (error) {
        return { ready: false, error: String(error) };
      }
    },
  },
];


/**
 * Checks the status of all core and extension services for the app.
 * Returns a list of ServiceStatus objects, each with id, label, ready, description, and error.
 * Optimized for parallel execution and robust error handling.
 */
export async function checkAllServices(): Promise<ServiceStatus[]> {
  return Promise.all(
    serviceChecks.map(async ({ id, label, description, check }) => {
      try {
        const { ready, error } = await check();
        return { id, label, ready, description, error };
      } catch (err) {
        return { id, label, ready: false, description, error: String(err) };
      }
    })
  );
}

