import { ZeticBridge } from './ZeticBridge';

type EventSubscription = { remove: () => void };

class LLMService {
  private modelReady = false;
  private initializing = false;

  async initialize(onProgress?: (progress: number) => void): Promise<void> {
    if (this.modelReady || this.initializing) return;
    if (!ZeticBridge) {
      console.warn('LLMService: Native module unavailable, LLM disabled');
      return;
    }

    this.initializing = true;
    try {
      let progressSub: EventSubscription | undefined;
      if (onProgress) {
        progressSub = ZeticBridge.onDownloadProgress(({ progress }) => onProgress(progress));
      }

      await ZeticBridge.initLLM();
      this.modelReady = true;

      progressSub?.remove();
    } catch (error) {
      console.error('LLMService init error:', error);
      throw error;
    } finally {
      this.initializing = false;
    }
  }

  isReady(): boolean {
    return this.modelReady;
  }

  generate(
    prompt: string,
    context?: { disease: string; confidence: number },
    onToken?: (token: string) => void,
    onComplete?: (fullResponse: string) => void,
    onError?: (error: string) => void
  ): (() => void) | null {
    if (!ZeticBridge || !this.modelReady) {
      onError?.('LLM not available');
      return null;
    }

    const fullPrompt = context
      ? `You are an agricultural expert. The farmer's crop was diagnosed with ${context.disease} (${(context.confidence * 100).toFixed(0)}% confidence). Answer concisely and practically.\nQuestion: ${prompt}`
      : `You are an agricultural expert. Answer concisely and practically.\nQuestion: ${prompt}`;

    const subs: EventSubscription[] = [];

    if (onToken) {
      subs.push(ZeticBridge.onLLMToken(({ token }) => onToken(token)));
    }
    if (onComplete) {
      subs.push(ZeticBridge.onLLMComplete(({ fullResponse }) => {
        onComplete(fullResponse);
        subs.forEach((s) => s.remove());
      }));
    }
    if (onError) {
      subs.push(ZeticBridge.onLLMError(({ error }) => {
        onError(error);
        subs.forEach((s) => s.remove());
      }));
    }

    ZeticBridge.generateResponse(fullPrompt);

    return () => {
      this.stop();
      subs.forEach((s) => s.remove());
    };
  }

  stop(): void {
    ZeticBridge?.stopGeneration();
  }

  async cleanup(): Promise<void> {
    try {
      await ZeticBridge?.cleanup();
    } catch {
      // ignore
    }
    this.modelReady = false;
  }
}

export const llmService = new LLMService();
