import { getDiseaseInfo } from './diseaseLookup';

type Keyword = { word: string; weight: number };

const KEYWORDS: Record<string, Keyword[]> = {
  leaf_rust: [
    { word: 'orange', weight: 3 }, { word: 'pustule', weight: 5 }, { word: 'rust', weight: 4 },
    { word: 'circular spot', weight: 3 }, { word: 'wheat', weight: 2 }, { word: 'barley', weight: 2 },
    { word: 'yellow halo', weight: 3 }, { word: 'spore', weight: 3 }, { word: 'brown powder', weight: 3 },
    { word: 'upper leaf', weight: 1 }, { word: 'uredinia', weight: 5 }, { word: 'orange brown', weight: 4 },
  ],
  stem_rust: [
    { word: 'stem', weight: 3 }, { word: 'rust', weight: 3 }, { word: 'brick red', weight: 5 },
    { word: 'lodge', weight: 3 }, { word: 'elongated', weight: 3 }, { word: 'sheath', weight: 3 },
    { word: 'black pustule', weight: 4 }, { word: 'stalk', weight: 2 },
  ],
  stripe_rust: [
    { word: 'stripe', weight: 5 }, { word: 'yellow stripe', weight: 5 }, { word: 'vein', weight: 3 },
    { word: 'parallel', weight: 3 }, { word: 'cool', weight: 2 }, { word: 'linear', weight: 3 },
    { word: 'yellow line', weight: 4 }, { word: 'wheat', weight: 1 },
  ],
  blight: [
    { word: 'dark', weight: 1 }, { word: 'concentric', weight: 4 }, { word: 'target', weight: 4 },
    { word: 'brown spot', weight: 2 }, { word: 'tomato', weight: 2 }, { word: 'potato', weight: 2 },
    { word: 'necrotic', weight: 3 }, { word: 'ring', weight: 3 }, { word: 'lower leaf', weight: 2 },
    { word: 'defoliation', weight: 2 }, { word: 'blight', weight: 5 },
  ],
  late_blight: [
    { word: 'water soaked', weight: 5 }, { word: 'white fuzzy', weight: 5 }, { word: 'white mold', weight: 4 },
    { word: 'potato', weight: 3 }, { word: 'tomato', weight: 2 }, { word: 'collapse', weight: 3 },
    { word: 'black stem', weight: 4 }, { word: 'late blight', weight: 6 }, { word: 'underside', weight: 2 },
    { word: 'sporulation', weight: 4 }, { word: 'green brown border', weight: 4 },
  ],
  powdery_mildew_wheat: [
    { word: 'white powder', weight: 5 }, { word: 'powdery', weight: 5 }, { word: 'mildew', weight: 5 },
    { word: 'fluffy', weight: 4 }, { word: 'grey coating', weight: 4 }, { word: 'white coating', weight: 5 },
    { word: 'upper surface', weight: 2 },
  ],
  gray_leaf_spot_corn: [
    { word: 'rectangular', weight: 5 }, { word: 'corn', weight: 3 }, { word: 'maize', weight: 3 },
    { word: 'grey lesion', weight: 4 }, { word: 'tan', weight: 2 }, { word: 'bounded by vein', weight: 5 },
    { word: 'gray spot', weight: 4 },
  ],
  rice_blast: [
    { word: 'diamond', weight: 5 }, { word: 'eye shaped', weight: 5 }, { word: 'rice', weight: 3 },
    { word: 'neck rot', weight: 5 }, { word: 'empty head', weight: 4 }, { word: 'white head', weight: 4 },
    { word: 'blast', weight: 5 }, { word: 'grey centre', weight: 3 },
  ],
  fusarium_wilt: [
    { word: 'wilt', weight: 4 }, { word: 'yellow lower', weight: 3 }, { word: 'vascular', weight: 5 },
    { word: 'brown inside', weight: 4 }, { word: 'cut stem', weight: 4 }, { word: 'fusarium', weight: 5 },
    { word: 'afternoon wilt', weight: 4 },
  ],
  coffee_rust: [
    { word: 'coffee', weight: 4 }, { word: 'orange underside', weight: 5 }, { word: 'defoliation', weight: 2 },
    { word: 'yellow spot', weight: 2 }, { word: 'coffee rust', weight: 6 },
  ],
  downy_mildew: [
    { word: 'oil spot', weight: 4 }, { word: 'downy', weight: 5 }, { word: 'white grey underside', weight: 5 },
    { word: 'grape', weight: 2 }, { word: 'cucumber', weight: 2 }, { word: 'yellow patch', weight: 2 },
  ],
  anthracnose: [
    { word: 'sunken', weight: 4 }, { word: 'dark fruit', weight: 4 }, { word: 'salmon pink', weight: 5 },
    { word: 'mango', weight: 3 }, { word: 'bean', weight: 2 }, { word: 'anthracnose', weight: 6 },
    { word: 'concentric ring fruit', weight: 4 },
  ],
  fire_blight: [
    { word: 'shepherd', weight: 5 }, { word: 'crook', weight: 5 }, { word: 'apple', weight: 3 },
    { word: 'pear', weight: 3 }, { word: 'black shoot', weight: 4 }, { word: 'wilted tip', weight: 4 },
    { word: 'ooze', weight: 4 }, { word: 'fire blight', weight: 6 },
  ],
  healthy: [
    { word: 'healthy', weight: 5 }, { word: 'no disease', weight: 5 }, { word: 'normal', weight: 3 },
    { word: 'green', weight: 1 }, { word: 'fine', weight: 2 }, { word: 'no spots', weight: 4 },
    { word: 'no problem', weight: 4 }, { word: 'looks good', weight: 4 }, { word: 'uniform', weight: 2 },
  ],

  // ── PlantVillage: Apple ──────────────────────────────────────────────
  apple_scab: [
    { word: 'apple', weight: 3 }, { word: 'scab', weight: 5 }, { word: 'olive spot', weight: 4 },
    { word: 'velvety', weight: 4 }, { word: 'dark lesion', weight: 3 }, { word: 'cracked fruit', weight: 4 },
    { word: 'corky', weight: 3 }, { word: 'deformed fruit', weight: 3 }, { word: 'leaf curl', weight: 2 },
    { word: 'apple scab', weight: 6 },
  ],
  apple_black_rot: [
    { word: 'apple', weight: 3 }, { word: 'black rot', weight: 5 }, { word: 'frogeye', weight: 5 },
    { word: 'concentric ring', weight: 4 }, { word: 'brown spot', weight: 2 }, { word: 'canker', weight: 4 },
    { word: 'mummified fruit', weight: 5 }, { word: 'purple border', weight: 3 }, { word: 'rot', weight: 2 },
    { word: 'tan center', weight: 3 },
  ],
  apple_cedar_rust: [
    { word: 'apple', weight: 3 }, { word: 'cedar rust', weight: 6 }, { word: 'orange spot', weight: 4 },
    { word: 'yellow spot', weight: 3 }, { word: 'raised lesion', weight: 3 }, { word: 'tube like', weight: 4 },
    { word: 'rust', weight: 3 }, { word: 'bright orange', weight: 4 }, { word: 'upper leaf surface', weight: 2 },
  ],
  apple_healthy: [
    { word: 'apple', weight: 3 }, { word: 'healthy', weight: 5 }, { word: 'no disease', weight: 5 },
    { word: 'normal', weight: 3 }, { word: 'green leaf', weight: 2 }, { word: 'no spots', weight: 4 },
    { word: 'looks good', weight: 4 }, { word: 'clean', weight: 2 },
  ],

  // ── PlantVillage: Blueberry ──────────────────────────────────────────
  blueberry_healthy: [
    { word: 'blueberry', weight: 4 }, { word: 'healthy', weight: 5 }, { word: 'no disease', weight: 5 },
    { word: 'normal', weight: 3 }, { word: 'green leaf', weight: 2 }, { word: 'no spots', weight: 4 },
    { word: 'looks good', weight: 4 }, { word: 'clean', weight: 2 },
  ],

  // ── PlantVillage: Cherry ─────────────────────────────────────────────
  cherry_powdery_mildew: [
    { word: 'cherry', weight: 3 }, { word: 'powdery', weight: 5 }, { word: 'mildew', weight: 5 },
    { word: 'white powder', weight: 5 }, { word: 'curled leaf', weight: 3 }, { word: 'white coating', weight: 4 },
    { word: 'stunted', weight: 2 }, { word: 'distorted', weight: 3 }, { word: 'grey patch', weight: 3 },
  ],
  cherry_healthy: [
    { word: 'cherry', weight: 4 }, { word: 'healthy', weight: 5 }, { word: 'no disease', weight: 5 },
    { word: 'normal', weight: 3 }, { word: 'green leaf', weight: 2 }, { word: 'no spots', weight: 4 },
    { word: 'looks good', weight: 4 }, { word: 'clean', weight: 2 },
  ],

  // ── PlantVillage: Corn ───────────────────────────────────────────────
  corn_cercospora: [
    { word: 'corn', weight: 3 }, { word: 'cercospora', weight: 6 }, { word: 'grey spot', weight: 4 },
    { word: 'rectangular', weight: 4 }, { word: 'gray leaf spot', weight: 5 }, { word: 'maize', weight: 3 },
    { word: 'tan lesion', weight: 3 }, { word: 'bounded by vein', weight: 4 }, { word: 'lower leaf', weight: 2 },
  ],
  corn_common_rust: [
    { word: 'corn', weight: 3 }, { word: 'rust', weight: 4 }, { word: 'common rust', weight: 6 },
    { word: 'reddish brown', weight: 4 }, { word: 'pustule', weight: 5 }, { word: 'maize', weight: 3 },
    { word: 'both surfaces', weight: 3 }, { word: 'cinnamon brown', weight: 4 }, { word: 'oval', weight: 2 },
    { word: 'spore', weight: 3 },
  ],
  corn_northern_blight: [
    { word: 'corn', weight: 3 }, { word: 'northern blight', weight: 6 }, { word: 'cigar shaped', weight: 5 },
    { word: 'long lesion', weight: 4 }, { word: 'grey green', weight: 3 }, { word: 'maize', weight: 3 },
    { word: 'elliptical', weight: 3 }, { word: 'tan lesion', weight: 3 }, { word: 'blight', weight: 3 },
    { word: 'northern leaf blight', weight: 6 },
  ],
  corn_healthy: [
    { word: 'corn', weight: 3 }, { word: 'maize', weight: 3 }, { word: 'healthy', weight: 5 },
    { word: 'no disease', weight: 5 }, { word: 'normal', weight: 3 }, { word: 'green leaf', weight: 2 },
    { word: 'no spots', weight: 4 }, { word: 'looks good', weight: 4 },
  ],

  // ── PlantVillage: Grape ──────────────────────────────────────────────
  grape_black_rot: [
    { word: 'grape', weight: 3 }, { word: 'black rot', weight: 6 }, { word: 'brown spot', weight: 3 },
    { word: 'dark border', weight: 3 }, { word: 'mummified berry', weight: 5 }, { word: 'black fruit', weight: 4 },
    { word: 'tan center', weight: 3 }, { word: 'pycnidia', weight: 5 }, { word: 'shriveled', weight: 3 },
    { word: 'circular lesion', weight: 3 },
  ],
  grape_esca: [
    { word: 'grape', weight: 3 }, { word: 'esca', weight: 6 }, { word: 'tiger stripe', weight: 5 },
    { word: 'interveinal', weight: 4 }, { word: 'chlorosis', weight: 3 }, { word: 'brown margin', weight: 3 },
    { word: 'black measles', weight: 5 }, { word: 'dried leaf', weight: 3 }, { word: 'scorched', weight: 3 },
    { word: 'grapevine', weight: 2 },
  ],
  grape_leaf_blight: [
    { word: 'grape', weight: 3 }, { word: 'leaf blight', weight: 5 }, { word: 'isariopsis', weight: 5 },
    { word: 'brown patch', weight: 3 }, { word: 'dark margin', weight: 3 }, { word: 'irregular spot', weight: 3 },
    { word: 'necrotic', weight: 3 }, { word: 'dry', weight: 1 }, { word: 'defoliation', weight: 2 },
    { word: 'angular lesion', weight: 4 },
  ],
  grape_healthy: [
    { word: 'grape', weight: 4 }, { word: 'healthy', weight: 5 }, { word: 'no disease', weight: 5 },
    { word: 'normal', weight: 3 }, { word: 'green leaf', weight: 2 }, { word: 'no spots', weight: 4 },
    { word: 'looks good', weight: 4 }, { word: 'clean', weight: 2 },
  ],

  // ── PlantVillage: Orange ─────────────────────────────────────────────
  orange_huanglongbing: [
    { word: 'orange', weight: 3 }, { word: 'citrus', weight: 3 }, { word: 'huanglongbing', weight: 6 },
    { word: 'greening', weight: 5 }, { word: 'yellow shoot', weight: 4 }, { word: 'blotchy mottle', weight: 5 },
    { word: 'lopsided fruit', weight: 5 }, { word: 'small fruit', weight: 3 }, { word: 'bitter', weight: 3 },
    { word: 'yellow vein', weight: 4 }, { word: 'hlb', weight: 5 }, { word: 'aborted seed', weight: 3 },
  ],

  // ── PlantVillage: Peach ──────────────────────────────────────────────
  peach_bacterial_spot: [
    { word: 'peach', weight: 3 }, { word: 'bacterial spot', weight: 6 }, { word: 'dark spot', weight: 3 },
    { word: 'angular lesion', weight: 4 }, { word: 'shot hole', weight: 5 }, { word: 'water soaked', weight: 4 },
    { word: 'fruit crack', weight: 3 }, { word: 'defoliation', weight: 2 }, { word: 'purple spot', weight: 3 },
    { word: 'pit fruit', weight: 2 },
  ],
  peach_healthy: [
    { word: 'peach', weight: 4 }, { word: 'healthy', weight: 5 }, { word: 'no disease', weight: 5 },
    { word: 'normal', weight: 3 }, { word: 'green leaf', weight: 2 }, { word: 'no spots', weight: 4 },
    { word: 'looks good', weight: 4 }, { word: 'clean', weight: 2 },
  ],

  // ── PlantVillage: Pepper ─────────────────────────────────────────────
  pepper_bacterial_spot: [
    { word: 'pepper', weight: 3 }, { word: 'bacterial spot', weight: 6 }, { word: 'dark raised', weight: 4 },
    { word: 'water soaked', weight: 4 }, { word: 'scabby fruit', weight: 4 }, { word: 'brown spot', weight: 3 },
    { word: 'defoliation', weight: 2 }, { word: 'bell pepper', weight: 3 }, { word: 'leaf drop', weight: 3 },
    { word: 'angular lesion', weight: 4 },
  ],
  pepper_healthy: [
    { word: 'pepper', weight: 4 }, { word: 'bell pepper', weight: 3 }, { word: 'healthy', weight: 5 },
    { word: 'no disease', weight: 5 }, { word: 'normal', weight: 3 }, { word: 'green leaf', weight: 2 },
    { word: 'no spots', weight: 4 }, { word: 'looks good', weight: 4 },
  ],

  // ── PlantVillage: Potato ─────────────────────────────────────────────
  potato_early_blight: [
    { word: 'potato', weight: 3 }, { word: 'early blight', weight: 6 }, { word: 'concentric ring', weight: 5 },
    { word: 'target spot', weight: 4 }, { word: 'alternaria', weight: 5 }, { word: 'brown spot', weight: 3 },
    { word: 'lower leaf', weight: 2 }, { word: 'yellow halo', weight: 3 }, { word: 'dark lesion', weight: 3 },
    { word: 'defoliation', weight: 2 },
  ],
  potato_late_blight: [
    { word: 'potato', weight: 3 }, { word: 'late blight', weight: 6 }, { word: 'water soaked', weight: 5 },
    { word: 'white fuzzy', weight: 5 }, { word: 'phytophthora', weight: 5 }, { word: 'dark lesion', weight: 3 },
    { word: 'underside mold', weight: 4 }, { word: 'collapse', weight: 3 }, { word: 'foul smell', weight: 3 },
    { word: 'green brown border', weight: 4 },
  ],
  potato_healthy: [
    { word: 'potato', weight: 4 }, { word: 'healthy', weight: 5 }, { word: 'no disease', weight: 5 },
    { word: 'normal', weight: 3 }, { word: 'green leaf', weight: 2 }, { word: 'no spots', weight: 4 },
    { word: 'looks good', weight: 4 }, { word: 'clean', weight: 2 },
  ],

  // ── PlantVillage: Raspberry & Soybean ────────────────────────────────
  raspberry_healthy: [
    { word: 'raspberry', weight: 4 }, { word: 'healthy', weight: 5 }, { word: 'no disease', weight: 5 },
    { word: 'normal', weight: 3 }, { word: 'green leaf', weight: 2 }, { word: 'no spots', weight: 4 },
    { word: 'looks good', weight: 4 }, { word: 'clean', weight: 2 },
  ],
  soybean_healthy: [
    { word: 'soybean', weight: 4 }, { word: 'soy', weight: 3 }, { word: 'healthy', weight: 5 },
    { word: 'no disease', weight: 5 }, { word: 'normal', weight: 3 }, { word: 'green leaf', weight: 2 },
    { word: 'no spots', weight: 4 }, { word: 'looks good', weight: 4 },
  ],

  // ── PlantVillage: Squash ─────────────────────────────────────────────
  squash_powdery_mildew: [
    { word: 'squash', weight: 3 }, { word: 'powdery', weight: 5 }, { word: 'mildew', weight: 5 },
    { word: 'white powder', weight: 5 }, { word: 'white coating', weight: 4 }, { word: 'zucchini', weight: 3 },
    { word: 'pumpkin', weight: 3 }, { word: 'yellow leaf', weight: 2 }, { word: 'dry', weight: 1 },
    { word: 'powdery mildew', weight: 6 },
  ],

  // ── PlantVillage: Strawberry ─────────────────────────────────────────
  strawberry_leaf_scorch: [
    { word: 'strawberry', weight: 3 }, { word: 'leaf scorch', weight: 6 }, { word: 'purple spot', weight: 4 },
    { word: 'dark blotch', weight: 3 }, { word: 'burned edge', weight: 4 }, { word: 'dried margin', weight: 4 },
    { word: 'scorched', weight: 5 }, { word: 'irregular lesion', weight: 3 }, { word: 'brown purple', weight: 3 },
  ],
  strawberry_healthy: [
    { word: 'strawberry', weight: 4 }, { word: 'healthy', weight: 5 }, { word: 'no disease', weight: 5 },
    { word: 'normal', weight: 3 }, { word: 'green leaf', weight: 2 }, { word: 'no spots', weight: 4 },
    { word: 'looks good', weight: 4 }, { word: 'clean', weight: 2 },
  ],

  // ── PlantVillage: Tomato ─────────────────────────────────────────────
  tomato_bacterial_spot: [
    { word: 'tomato', weight: 3 }, { word: 'bacterial spot', weight: 6 }, { word: 'dark raised', weight: 4 },
    { word: 'water soaked', weight: 4 }, { word: 'scabby fruit', weight: 4 }, { word: 'angular lesion', weight: 4 },
    { word: 'defoliation', weight: 2 }, { word: 'brown spot', weight: 2 }, { word: 'leaf drop', weight: 3 },
  ],
  tomato_early_blight: [
    { word: 'tomato', weight: 3 }, { word: 'early blight', weight: 6 }, { word: 'concentric ring', weight: 5 },
    { word: 'target spot', weight: 4 }, { word: 'alternaria', weight: 5 }, { word: 'brown spot', weight: 3 },
    { word: 'lower leaf', weight: 2 }, { word: 'yellow halo', weight: 3 }, { word: 'dark lesion', weight: 3 },
    { word: 'defoliation', weight: 2 },
  ],
  tomato_late_blight: [
    { word: 'tomato', weight: 3 }, { word: 'late blight', weight: 6 }, { word: 'water soaked', weight: 5 },
    { word: 'white fuzzy', weight: 5 }, { word: 'phytophthora', weight: 5 }, { word: 'dark patch', weight: 3 },
    { word: 'underside mold', weight: 4 }, { word: 'collapse', weight: 3 }, { word: 'green brown border', weight: 4 },
    { word: 'stem lesion', weight: 3 },
  ],
  tomato_leaf_mold: [
    { word: 'tomato', weight: 3 }, { word: 'leaf mold', weight: 6 }, { word: 'yellow upper', weight: 4 },
    { word: 'olive mold', weight: 5 }, { word: 'underside fuzz', weight: 5 }, { word: 'velvety', weight: 4 },
    { word: 'greenhouse', weight: 3 }, { word: 'brown underside', weight: 3 }, { word: 'fulvia', weight: 5 },
    { word: 'humid', weight: 2 },
  ],
  tomato_septoria: [
    { word: 'tomato', weight: 3 }, { word: 'septoria', weight: 6 }, { word: 'small spot', weight: 3 },
    { word: 'dark border', weight: 3 }, { word: 'white center', weight: 4 }, { word: 'lower leaf', weight: 2 },
    { word: 'pycnidia', weight: 5 }, { word: 'septoria leaf spot', weight: 6 }, { word: 'many spots', weight: 3 },
    { word: 'defoliation', weight: 2 },
  ],
  tomato_spider_mites: [
    { word: 'tomato', weight: 3 }, { word: 'spider mite', weight: 6 }, { word: 'stippling', weight: 5 },
    { word: 'webbing', weight: 5 }, { word: 'tiny dot', weight: 3 }, { word: 'yellow speckle', weight: 4 },
    { word: 'bronze leaf', weight: 4 }, { word: 'underside', weight: 2 }, { word: 'dry', weight: 1 },
    { word: 'two spotted', weight: 5 },
  ],
  tomato_target_spot: [
    { word: 'tomato', weight: 3 }, { word: 'target spot', weight: 6 }, { word: 'concentric ring', weight: 5 },
    { word: 'brown spot', weight: 3 }, { word: 'corynespora', weight: 5 }, { word: 'dark margin', weight: 3 },
    { word: 'zonate', weight: 4 }, { word: 'large lesion', weight: 3 }, { word: 'fruit rot', weight: 3 },
  ],
  tomato_yellow_curl: [
    { word: 'tomato', weight: 3 }, { word: 'yellow curl', weight: 6 }, { word: 'curled leaf', weight: 5 },
    { word: 'stunted', weight: 3 }, { word: 'whitefly', weight: 5 }, { word: 'yellow margin', weight: 4 },
    { word: 'upward curl', weight: 5 }, { word: 'small leaf', weight: 3 }, { word: 'tylcv', weight: 5 },
    { word: 'crumpled', weight: 3 },
  ],
  tomato_mosaic: [
    { word: 'tomato', weight: 3 }, { word: 'mosaic', weight: 6 }, { word: 'mottled', weight: 5 },
    { word: 'light dark green', weight: 4 }, { word: 'distorted', weight: 3 }, { word: 'fern leaf', weight: 5 },
    { word: 'shoe string', weight: 4 }, { word: 'virus', weight: 3 }, { word: 'yellow mosaic', weight: 5 },
    { word: 'stunted', weight: 2 },
  ],
  tomato_healthy: [
    { word: 'tomato', weight: 4 }, { word: 'healthy', weight: 5 }, { word: 'no disease', weight: 5 },
    { word: 'normal', weight: 3 }, { word: 'green leaf', weight: 2 }, { word: 'no spots', weight: 4 },
    { word: 'looks good', weight: 4 }, { word: 'clean', weight: 2 },
  ],
};

export type SymptomMatchResult = {
  diseaseId: string;
  label: string;
  confidence: number;
  matched: boolean;
};

export function matchSymptoms(text: string): SymptomMatchResult {
  const lower = text.toLowerCase();
  const scores: Record<string, number> = {};

  for (const [diseaseId, keywords] of Object.entries(KEYWORDS)) {
    let score = 0;
    for (const { word, weight } of keywords) {
      if (lower.includes(word)) score += weight;
    }
    if (score > 0) scores[diseaseId] = score;
  }

  const entries = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  if (entries.length === 0) {
    return { diseaseId: 'unknown', label: 'Unknown Disease', confidence: 0, matched: false };
  }

  const [bestId, bestScore] = entries[0];
  const confidence = Math.min(0.95, 0.45 + Math.min(bestScore / 12, 1) * 0.5);

  return {
    diseaseId: bestId,
    label: getDiseaseInfo(bestId).label,
    confidence,
    matched: true,
  };
}
