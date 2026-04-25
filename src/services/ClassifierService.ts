export type ClassificationResult = {
  diseaseId: string;
  confidence: number;
};

export class ClassifierService {
  private modelReady = false;

  async initialize(): Promise<void> {
    // TODO (Gokul): Load Zetic .mlange model and SDK here.
    // Keep the placeholder path so UI and storage can be developed in parallel.
    this.modelReady = false;
  }

  async classifyLeafImage(_imageUri?: string): Promise<ClassificationResult> {
    if (!this.modelReady) {
      return {
        diseaseId: 'leaf_rust',
        confidence: 0.91,
      };
    }

    // TODO (Gokul): Replace with real Zetic inference output mapping.
    return {
      diseaseId: 'leaf_rust',
      confidence: 0.91,
    };
  }
}

export const classifierService = new ClassifierService();
