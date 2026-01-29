// src/navigation/authEvents.ts
type Listener = () => void;

const listeners = new Set<Listener>();

export const emitAuthChanged = () => {
  listeners.forEach(l => l());
};

export const subscribeAuthChanged = (listener: Listener) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};
