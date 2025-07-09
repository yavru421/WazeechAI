// Badging API utility
export function setBadge(count: number) {
  if ('setAppBadge' in navigator) {
    (navigator as any).setAppBadge(count);
  } else if ('setClientBadge' in navigator) {
    (navigator as any).setClientBadge(count);
  }
}

export function clearBadge() {
  if ('clearAppBadge' in navigator) {
    (navigator as any).clearAppBadge();
  } else if ('clearClientBadge' in navigator) {
    (navigator as any).clearClientBadge();
  }
}
