type Listener = () => void;

const listeners = new Set<Listener>();

/**
 * Subscribes to EQ update events.
 * Returns an unsubscribe cleanup function.
 */
export const onEQUpdate = (fn: Listener): (() => void) => {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
};

/**
 * Emits an EQ update event to all registered listeners.
 */
export const emitEQUpdate = (): void => {
  listeners.forEach((fn) => {
    try {
      fn();
    } catch (e) {
      console.error('Error in EQ update listener:', e);
    }
  });
};
