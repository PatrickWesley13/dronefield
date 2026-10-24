export type Listener<T> = (event: T) => void;
export type Unsubscribe = () => void;

/** Minimal typed observer. Producers depend on this, never on their consumers. */
export class Emitter<T> {
  private readonly listeners = new Set<Listener<T>>();

  subscribe(listener: Listener<T>): Unsubscribe {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  emit(event: T): void {
    for (const listener of this.listeners) listener(event);
  }
}
