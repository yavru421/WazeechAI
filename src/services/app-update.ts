// App update notification utility
export function listenForAppUpdates(onUpdate: () => void) {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      onUpdate();
    });
  }
}
