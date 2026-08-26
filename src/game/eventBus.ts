type EventCallback = (...args: unknown[]) => void;

class TypedEventBus {
  private listeners: Map<string, Set<EventCallback>> = new Map();

  on(event: string, callback: EventCallback): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);

    return () => {
      this.listeners.get(event)?.delete(callback);
    };
  }

  emit(event: string, ...args: unknown[]): void {
    this.listeners.get(event)?.forEach((cb) => cb(...args));
  }

  off(event: string, callback: EventCallback): void {
    this.listeners.get(event)?.delete(callback);
  }

  removeAll(): void {
    this.listeners.clear();
  }
}

export const eventBus = new TypedEventBus();

export const GameEvents = {
  BATTLE_START: 'battle:start',
  BATTLE_END: 'battle:end',
  ENCOUNTER_TRIGGERED: 'encounter:triggered',
  DIALOGUE_SHOW: 'dialogue:show',
  DIALOGUE_HIDE: 'dialogue:hide',
  MAP_TRANSITION: 'map:transition',
  PLAYER_MOVED: 'player:moved',
} as const;

export type GameEventKey = keyof typeof GameEvents;
