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
    // Try real inference if model is ready and we have an image
    if (this.modelReady && ZeticBridge && imageUri) {
      try {
        const result = await ZeticBridge.classifyImage(imageUri);
        console.log('🔬 Raw model output:', JSON.stringify(result));
        const diseaseId = diseaseIdFromClassIndex(result.classIndex);
        console.log('🔬 Mapped diseaseId:', diseaseId, 'from classIndex:', result.classIndex);
        return {
          diseaseId,
          confidence: result.confidence,
          sampleId,
          sourceUri: imageUri,
        };
      } catch (error) {
        console.error('ClassifierService inference error, falling back to demo:', error);
      }
    }

    // Demo fallback
    const sample = getDemoScanSample(sampleId ?? imageUri ?? '');

    if (sample) {
      return {
        diseaseId: sample.diseaseId,
        confidence: sample.confidence,
        sampleId: sample.id,
        sourceUri: imageUri,
      };
    }

    return {
      diseaseId: 'leaf_rust',
      confidence: 0.91,
    };
  }
}

export const classifierService = new ClassifierService();
