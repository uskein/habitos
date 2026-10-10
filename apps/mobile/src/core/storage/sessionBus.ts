type Listener = () => void;

const listeners = new Set<Listener>();

/** Bus mínimo para forzar el lock inmediato desde Perfil (R4). */
export const sessionBus = {
  subscribe(fn: Listener): () => void {
    listeners.add(fn);
    return () => listeners.delete(fn);
  },
  requestLock(): void {
    listeners.forEach((fn) => fn());
  },
};
