import { useEffect, useRef } from 'react';

export function useEscapeKey<TElement extends HTMLElement>(onClose: () => void) {
  const modalRef = useRef<TElement | null>(null);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== 'Escape') return;

      const modalElements = Array.from(
        document.querySelectorAll<HTMLElement>('[data-escape-modal="true"]'),
      );
      const topMostModal = modalElements.at(-1);

      if (modalRef.current && topMostModal === modalRef.current) {
        onClose();
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return modalRef;
}
