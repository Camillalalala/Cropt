import { NativeModules, NativeEventEmitter, Platform } from 'react-native';

const { ZeticBridgeModule } = NativeModules;

type ClassifyResult = {
  classIndex: number;
  confidence: number;
};

type ZeticBridgeType = {
  initClassifier: () => Promise<boolean>;
  classifyImage: (imageUri: string) => Promise<ClassifyResult>;
  initLLM: () => Promise<boolean>;
  generateResponse: (prompt: string) => void;
  stopGeneration: () => void;
  cleanup: () => Promise<boolean>;
};

type EventSubscription = { remove: () => void };

function isNativeAvailable(): boolean {
  return ZeticBridgeModule != null;
}

function getEmitter(): NativeEventEmitter | null {
  if (!isNativeAvailable()) return null;
  return new NativeEventEmitter(ZeticBridgeModule);
}

export const ZeticBridge = isNativeAvailable()
  ? {
      initClassifier: (): Promise<boolean> =>
        (ZeticBridgeModule as ZeticBridgeType).initClassifier(),

      classifyImage: (imageUri: string): Promise<ClassifyResult> =>
        (ZeticBridgeModule as ZeticBridgeType).classifyImage(imageUri),

      initLLM: (): Promise<boolean> =>
        (ZeticBridgeModule as ZeticBridgeType).initLLM(),

      generateResponse: (prompt: string): void =>
        (ZeticBridgeModule as ZeticBridgeType).generateResponse(prompt),

      stopGeneration: (): void =>
        (ZeticBridgeModule as ZeticBridgeType).stopGeneration(),

      cleanup: (): Promise<boolean> =>
        (ZeticBridgeModule as ZeticBridgeType).cleanup(),

      onDownloadProgress: (callback: (data: { progress: number }) => void): EventSubscription => {
        const emitter = getEmitter()!;
        return emitter.addListener('onModelDownloadProgress', callback);
      },

      onLLMToken: (callback: (data: { token: string }) => void): EventSubscription => {
        const emitter = getEmitter()!;
        return emitter.addListener('onLLMToken', callback);
      },

      onLLMComplete: (callback: (data: { fullResponse: string }) => void): EventSubscription => {
        const emitter = getEmitter()!;
        return emitter.addListener('onLLMComplete', callback);
      },

      onLLMError: (callback: (data: { error: string }) => void): EventSubscription => {
        const emitter = getEmitter()!;
        return emitter.addListener('onLLMError', callback);
      },
    }
  : null;
