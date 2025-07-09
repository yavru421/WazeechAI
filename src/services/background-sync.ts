// Background sync utility for PWA
export async function registerSync(tag = 'pwllama-sync') {
  if ('serviceWorker' in navigator && 'SyncManager' in window) {
    const reg = await navigator.serviceWorker.ready;
    try {
      await reg.sync.register(tag);
      return true;
    } catch (e) {
      return false;
    }
  }
  return false;
}

export async function isSyncSupported() {
  return 'serviceWorker' in navigator && 'SyncManager' in window;
}

// background-sync.ts
declare global {
  interface ServiceWorkerRegistration {
    sync: {
      register: (tag: string) => Promise<void>;
    };
  }
}
