// Dispatch a toast via the nook:toast custom event.
// The Toast.tsx component (in admin layout) listens for this event.

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export function toast(message: string, type: ToastType = 'info', _durationMs = 3000): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(
    new CustomEvent('nook:toast', { detail: { msg: message, type } })
  );
}
