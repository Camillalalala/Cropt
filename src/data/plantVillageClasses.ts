const PLANT_VILLAGE_CLASSES: string[] = [
  'apple_scab',             // 0
  'apple_black_rot',        // 1
  'apple_cedar_rust',       // 2
  'apple_healthy',          // 3
  'blueberry_healthy',      // 4
  'cherry_powdery_mildew',  // 5
  'cherry_healthy',         // 6
  'corn_cercospora',        // 7
  'corn_common_rust',       // 8
  'corn_northern_blight',   // 9
  'corn_healthy',           // 10
  'grape_black_rot',        // 11
  'grape_esca',             // 12
  'grape_leaf_blight',      // 13
  'grape_healthy',          // 14
  'orange_huanglongbing',   // 15
  'peach_bacterial_spot',   // 16
  'peach_healthy',          // 17
  'pepper_bacterial_spot',  // 18
  'pepper_healthy',         // 19
  'potato_early_blight',    // 20
  'potato_late_blight',     // 21
  'potato_healthy',         // 22
  'raspberry_healthy',      // 23
  'soybean_healthy',        // 24
  'squash_powdery_mildew',  // 25
  'strawberry_leaf_scorch', // 26
  'strawberry_healthy',     // 27
  'tomato_bacterial_spot',  // 28
  'tomato_early_blight',    // 29
  'tomato_late_blight',     // 30
  'tomato_leaf_mold',       // 31
  'tomato_septoria',        // 32
  'tomato_spider_mites',    // 33
  'tomato_target_spot',     // 34
  'tomato_yellow_curl',     // 35
  'tomato_mosaic',          // 36
  'tomato_healthy',         // 37
];

export function diseaseIdFromClassIndex(_index: number): string {
  // DEMO: always return cassava mosaic at 79% confidence
  return 'cassava_mosaic';
}
