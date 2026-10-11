"use client";

import { createContext, useCallback, useContext, useRef, useState } from "react";

// Petit message de confirmation en bas de l'écran (« Added to queue »). Il s'efface tout
// seul, s'annonce aux lecteurs d'écran (aria-live) et n'en garde jamais plus de trois.
const DURATION_MS = 3200;
const MAX_VISIBLE = 3;

const ToastContext = createContext<(message: string) => void>(() => {});

export function useToast(): (message: string) => void {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<{ id: number; message: string }[]>([]);
  const nextId = useRef(0);

  const toast = useCallback((message: string) => {
    const id = ++nextId.current;
    setToasts((current) => [...current.slice(-(MAX_VISIBLE - 1)), { id, message }]);
    window.setTimeout(() => setToasts((current) => current.filter((item) => item.id !== id)), DURATION_MS);
  }, []);

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="toasts" role="status" aria-live="polite">
        {toasts.map((item) => (
          <p key={item.id} className="toast">
            {item.message}
          </p>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
