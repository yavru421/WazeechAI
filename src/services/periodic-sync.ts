// Periodic Background Sync utility
export async function registerPeriodicSync(tag = 'pwllama-periodic', minInterval = 24 * 60 * 60 * 1000) {
  if ('serviceWorker' in navigator && 'periodicSync' in (navigator.serviceWorker as any)) {
    const reg = await navigator.serviceWorker.ready;
    try {
      await (reg as any).periodicSync.register(tag, { minInterval });
      return true;
    } catch (e) {
      return false;
    }
  }
  return false;
}

export async function isPeriodicSyncSupported() {
  return 'serviceWorker' in navigator && 'periodicSync' in (navigator.serviceWorker as any);
}
