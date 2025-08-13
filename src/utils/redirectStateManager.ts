export enum RedirectState {
  IDLE = 'idle',
  VALIDATING_URL = 'validating_url',
  FETCHING_IP = 'fetching_ip',
  PROCESSING_URL = 'processing_url',
  REDIRECTING = 'redirecting',
  ERROR = 'error',
  BOT_DETECTED = 'bot_detected'
}

export interface RedirectContext {
  url?: string;
  ip?: string;
  error?: string;
  retryCount: number;
}

export class RedirectStateMachine {
  private state: RedirectState = RedirectState.IDLE;
  private context: RedirectContext = { retryCount: 0 };
  private listeners: Array<(state: RedirectState, context: RedirectContext) => void> = [];

  getState(): RedirectState {
    return this.state;
  }

  getContext(): RedirectContext {
    return { ...this.context };
  }

  transition(newState: RedirectState, updates?: Partial<RedirectContext>) {
    if (updates) {
      this.context = { ...this.context, ...updates };
    }

    this.state = newState;
    this.notifyListeners();
  }

  onStateChange(listener: (state: RedirectState, context: RedirectContext) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notifyListeners() {
    this.listeners.forEach(listener => {
      try {
        listener(this.state, this.context);
      } catch (error) {
        // Silent fail for listeners
      }
    });
  }

  reset() {
    this.state = RedirectState.IDLE;
    this.context = { retryCount: 0 };
    this.notifyListeners();
  }
}