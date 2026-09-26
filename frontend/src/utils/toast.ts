export type ToastType = 'success' | 'error' | 'info';

export const showToast = (message: string, type: ToastType = 'info') => {
  if (typeof window === 'undefined') return;
  const event = new CustomEvent('sipinjam:toast', {
    detail: { message, type }
  });
  window.dispatchEvent(event);
};
