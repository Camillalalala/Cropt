export type DiseaseLookupEntry = {
  label: string;
  mitigationSteps: string;
};

export const diseaseLookup: Record<string, DiseaseLookupEntry> = {
  leaf_rust: {
    label: 'Leaf Rust',
    mitigationSteps:
      'Remove heavily infected leaves, improve airflow between plants, avoid overhead watering late in the day, and apply a rust-labeled fungicide if spread continues.',
  },
  blight: {
    label: 'Blight',
    mitigationSteps:
      'Prune infected tissue immediately, sanitize tools between cuts, reduce leaf wetness duration, and apply a preventative copper-based treatment as directed.',
  },
  healthy: {
    label: 'Healthy Leaf',
    mitigationSteps:
      'No treatment needed. Continue regular monitoring, balanced watering, and weekly visual checks for early disease signs.',
  },
};

export function getDiseaseInfo(diseaseId: string): DiseaseLookupEntry {
  return (
    diseaseLookup[diseaseId] ?? {
      label: 'Unknown Disease',
      mitigationSteps:
        'Capture another scan in better lighting and send this sample to the agronomy team for manual review.',
    }
  );
}
