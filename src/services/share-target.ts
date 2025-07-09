// Share Target API utility
export function isShareTargetSupported() {
  return 'share' in navigator;
}

export async function shareData(data: ShareData) {
  if ('share' in navigator) {
    await navigator.share(data);
  }
}
