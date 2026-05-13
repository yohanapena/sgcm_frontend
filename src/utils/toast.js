const TOAST_CONTAINER_ID = 'app-toast-container';
const TOAST_DURATION_MS = 3000;
const TOAST_TYPES = {
  success: { background: '#198754', text: '#ffffff' },
  error: { background: '#dc3545', text: '#ffffff' },
  info: { background: '#0d6efd', text: '#ffffff' },
};

function getToastContainer() {
  let container = document.getElementById(TOAST_CONTAINER_ID);
  if (!container) {
    container = document.createElement('div');
    container.id = TOAST_CONTAINER_ID;
    container.style.position = 'fixed';
    container.style.top = '1rem';
    container.style.right = '1rem';
    container.style.zIndex = '9999';
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = '0.5rem';
    container.style.maxWidth = '320px';
    document.body.appendChild(container);
  }
  return container;
}

export function showToast(message, type = 'info') {
  const container = getToastContainer();
  const toast = document.createElement('div');
  const { background, text } = TOAST_TYPES[type] || TOAST_TYPES.info;
  toast.style.background = background;
  toast.style.color = text;
  toast.style.padding = '0.85rem 1rem';
  toast.style.borderRadius = '0.75rem';
  toast.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.15)';
  toast.style.fontSize = '0.95rem';
  toast.style.lineHeight = '1.3';
  toast.style.whiteSpace = 'pre-wrap';
  toast.style.opacity = '0';
  toast.style.transition = 'opacity 0.25s ease, transform 0.25s ease';
  toast.style.transform = 'translateY(-6px)';
  toast.textContent = message;

  container.appendChild(toast);

  requestAnimationFrame(() => {
    toast.style.opacity = '1';
    toast.style.transform = 'translateY(0)';
  });

  window.setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(-6px)';
    toast.addEventListener('transitionend', () => toast.remove(), { once: true });
  }, TOAST_DURATION_MS);

  return toast;
}
