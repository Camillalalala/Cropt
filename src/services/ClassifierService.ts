export type ClassificationResult = {
  diseaseId: string;
  confidence: number;
  sampleId?: string;
  sourceUri?: string;
};

import { getDemoScanSample } from '../data/demoScanLibrary';
import { diseaseIdFromClassIndex } from '../data/plantVillageClasses';
import { ZeticBridge } from './ZeticBridge';

type EventSubscription = { remove: () => void };

export class ClassifierService {
  private modelReady = false;
  private initializing = false;

  async initialize(onProgress?: (progress: number) => void): Promise<void> {
    if (this.modelReady || this.initializing) return;

    if (!ZeticBridge) {
      console.warn('ClassifierService: Native module unavailable, using demo mode');
      return;
    }

    this.initializing = true;
    try {
      let progressSub: EventSubscription | undefined;
      if (onProgress) {
        progressSub = ZeticBridge.onDownloadProgress(({ progress }) => onProgress(progress));
      }

      await ZeticBridge.initClassifier();
      this.modelReady = true;

      progressSub?.remove();
    } catch (error) {
      console.error('ClassifierService init error:', error);
    } finally {
      this.initializing = false;
    }
  }

  isReady(): boolean {
    return this.modelReady;
  }

  async classifyLeafImage(imageUri?: string, sampleId?: string): Promise<ClassificationResult> {
    // DEMO: always return cassava mosaic at 79%
    return {
      diseaseId: 'cassava_mosaic',
      confidence: 0.79,
      sampleId,
      sourceUri: imageUri,
    };
  }
}

export const classifierService = new ClassifierService();
