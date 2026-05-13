export function confirmDialog(message, options = {}) {
  const {
    title = 'Confirmar acción',
    confirmText = 'Sí',
    cancelText = 'Cancelar',
  } = options;

  return new Promise((resolve) => {
    const overlay = document.createElement('div');
    overlay.style.position = 'fixed';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100vw';
    overlay.style.height = '100vh';
    overlay.style.background = 'rgba(0, 0, 0, 0.35)';
    overlay.style.display = 'flex';
    overlay.style.alignItems = 'center';
    overlay.style.justifyContent = 'center';
    overlay.style.zIndex = '10000';

    const dialog = document.createElement('div');
    dialog.style.background = '#ffffff';
    dialog.style.borderRadius = '0.75rem';
    dialog.style.boxShadow = '0 16px 48px rgba(0, 0, 0, 0.2)';
    dialog.style.maxWidth = '420px';
    dialog.style.width = 'calc(100% - 2rem)';
    dialog.style.padding = '1rem';
    dialog.style.color = '#202124';

    dialog.innerHTML = `
      <div style="margin-bottom: 0.75rem; font-weight: 600; font-size: 1rem;">${title}</div>
      <div style="margin-bottom: 1rem; white-space: pre-wrap;">${message}</div>
      <div style="display: flex; justify-content: flex-end; gap: 0.5rem;">
        <button type="button" class="confirm-dialog-cancel" style="padding: 0.55rem 0.85rem; background: #f8f9fa; border: 1px solid #ced4da; border-radius: 0.5rem; cursor: pointer;">${cancelText}</button>
        <button type="button" class="confirm-dialog-confirm" style="padding: 0.55rem 0.85rem; background: #0d6efd; color: #ffffff; border: none; border-radius: 0.5rem; cursor: pointer;">${confirmText}</button>
      </div>
    `;

    overlay.appendChild(dialog);
    document.body.appendChild(overlay);

    const cleanup = () => {
      overlay.remove();
    };

    dialog.querySelector('.confirm-dialog-confirm').addEventListener('click', () => {
      cleanup();
      resolve(true);
    });

    dialog.querySelector('.confirm-dialog-cancel').addEventListener('click', () => {
      cleanup();
      resolve(false);
    });

    overlay.addEventListener('click', (event) => {
      if (event.target === overlay) {
        cleanup();
        resolve(false);
      }
    });
  });
}
