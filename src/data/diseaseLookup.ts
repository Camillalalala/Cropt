export type Symptom = {
  label: string;
  assetIndex: 1 | 2 | 3 | 4;
};

export type DiseaseLookupEntry = {
  label: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  symptoms: Symptom[];
  steps: [string, string, string];
  mitigationSteps: string;
};

export const diseaseLookup: Record<string, DiseaseLookupEntry> = {
  leaf_rust: {
    label: 'Leaf Rust',
    severity: 'high',
    symptoms: [
      { label: 'Orange dusty spots on leaves', assetIndex: 1 },
      { label: 'Yellow discoloration around spots', assetIndex: 2 },
      { label: 'Powdery rust-coloured pustules', assetIndex: 3 },
      { label: 'Early leaf drop', assetIndex: 4 },
    ],
    steps: [
      'Remove and dispose of leaves showing orange or brown spots away from the field',
      'Improve airflow by spacing plants further apart and water only at the base',
      'Ask for a rust fungicide at your local agro shop and apply as directed',
    ],
    mitigationSteps:
      'Signs to look for: Orange or brown dusty spots on leaves. Leaves may turn yellow and fall off early.\n\nWhat to do:\n- Pick off leaves with many spots and throw them away\n- Give plants more space so air can move between them\n- Water at the base, not from above\n- If it keeps spreading, ask for a rust fungicide spray at your local agro shop',
  },
  blight: {
    label: 'Blight',
    severity: 'critical',
    symptoms: [
      { label: 'Dark brown or black patches spreading fast', assetIndex: 1 },
      { label: 'Water-soaked, burnt-looking leaves', assetIndex: 2 },
      { label: 'Lesions on stems and branches', assetIndex: 3 },
      { label: 'Rapid wilting of foliage', assetIndex: 4 },
    ],
    steps: [
      'Cut off all infected parts immediately using clean tools, disinfecting between each cut',
      'Keep leaves dry by watering only at the roots and never from above',
      'Apply copper spray from your agro shop following packet instructions carefully',
    ],
    mitigationSteps:
      'Signs to look for: Dark brown or black patches on leaves that spread fast. Leaves look burnt or water-soaked.\n\nWhat to do:\n- Cut off the sick parts right away with clean tools\n- Clean your cutting tools between each cut\n- Keep leaves dry - water at the roots only\n- Ask for copper spray at your agro shop and follow the instructions on the packet',
  },
  healthy: {
    label: 'Healthy Leaf',
    severity: 'low',
    symptoms: [
      { label: 'Vibrant green leaf colour', assetIndex: 1 },
      { label: 'No spots or discolouration', assetIndex: 2 },
      { label: 'Strong, upright growth', assetIndex: 3 },
      { label: 'Clean leaf edges and surface', assetIndex: 4 },
    ],
    steps: [
      'Continue watering regularly and keep the area around the plant clean',
      'Inspect your plants every week for any new spots or colour changes',
      'Remove fallen leaves and weeds from around the base to prevent disease',
    ],
    mitigationSteps:
      'Good news! Your plant looks healthy.\n\nWhat to do:\n- Keep watering regularly\n- Check your plants every week for any new spots or color changes\n- Keep your field clean of old leaves and weeds',
  },

  // ── Demo: Cassava ───────────────────────────────────────────────────
  cassava_mosaic: {
    label: 'Cassava Mosaic Disease',
    severity: 'high',
    symptoms: [
      { label: 'Yellow-green mosaic pattern on leaves', assetIndex: 1 },
      { label: 'Distorted and twisted leaf shape', assetIndex: 2 },
      { label: 'Stunted plant growth', assetIndex: 3 },
      { label: 'Reduced tuber size and yield', assetIndex: 4 },
    ],
    steps: [
      'Remove and burn all infected plants immediately to prevent the whitefly from spreading the virus further',
      'Plant only certified virus-free cassava cuttings from a trusted source for your next crop',
      'Control whitefly populations by applying insecticide from your agro shop and introduce natural predators like ladybugs',
    ],
    mitigationSteps:
      'Signs to look for: Yellow and green mosaic pattern on leaves. Leaves may be twisted, small, or deformed. Plants are stunted and produce fewer tubers.\n\nWhat to do:\n- Pull out and burn all sick plants right away\n- Do not use cuttings from sick plants\n- Control whiteflies - they spread this virus\n- Plant certified clean cuttings next season\n- Ask for insecticide for whiteflies at your agro shop',
  },

  // ── PlantVillage 38-class entries ──────────────────────────────────

  // Apple
  apple_scab: {
    label: 'Apple Scab',
    severity: 'medium',
    symptoms: [
      { label: 'Dark olive-green velvety spots on leaves', assetIndex: 1 },
      { label: 'Rough, cracked dark patches on fruit', assetIndex: 2 },
      { label: 'Yellowing leaves around lesions', assetIndex: 3 },
      { label: 'Early defoliation of infected leaves', assetIndex: 4 },
    ],
    steps: [
      'Rake up and burn all fallen leaves — the fungus overwinters in them',
      'Prune branches to open the canopy and improve airflow through the tree',
      'Apply captan fungicide from your agro shop, starting at bud break',
    ],
    mitigationSteps:
      'Signs to look for: Dark olive-green or brown velvety spots on leaves. Fruit gets rough, cracked, dark patches.\n\nWhat to do:\n- Rake up and burn fallen leaves - the disease lives in them\n- Remove and throw away fruit with dark patches\n- Prune branches so air flows through the tree\n- Ask for captan fungicide spray at your agro shop',
  },
  apple_black_rot: {
    label: 'Apple Black Rot',
    severity: 'high',
    symptoms: [
      { label: 'Brown spots with purple edges on leaves', assetIndex: 1 },
      { label: 'Fruit turning black and rotting', assetIndex: 2 },
      { label: 'Mummified dried fruit on branches', assetIndex: 3 },
      { label: 'Cankers on dead branches', assetIndex: 4 },
    ],
    steps: [
      'Cut off dead branches and remove all rotten or mummified fruit from the tree and ground',
      'Clean up all fallen fruit and leaves from under the tree immediately',
      'Spray with captan from your agro shop and dispose of all infected material far from your trees',
    ],
    mitigationSteps:
      'Signs to look for: Brown spots with purple edges on leaves. Fruit turns black and rots, sometimes dries up on the tree.\n\nWhat to do:\n- Cut off dead branches and remove rotten fruit\n- Clean fallen fruit and leaves from under the tree\n- Ask for captan spray at your agro shop\n- Throw away all rotten material far from your trees',
  },
  apple_cedar_rust: {
    label: 'Apple Cedar Rust',
    severity: 'medium',
    symptoms: [
      { label: 'Bright orange or yellow spots on leaf tops', assetIndex: 1 },
      { label: 'Small tubes or bumps on leaf undersides', assetIndex: 2 },
      { label: 'Yellowing around orange lesions', assetIndex: 3 },
      { label: 'Deformed or spotted young fruit', assetIndex: 4 },
    ],
    steps: [
      'Remove nearby juniper or cedar trees if possible — they host the other stage of this fungus',
      'Apply fungicide spray when flower buds first show colour in spring',
      'Choose rust-resistant apple varieties for any new plantings',
    ],
    mitigationSteps:
      'Signs to look for: Bright orange or yellow spots on top of leaves. Small tubes or bumps on the underside of leaves.\n\nWhat to do:\n- If you have juniper or cedar trees nearby, remove them if you can\n- Spray with fungicide when flower buds start to show color\n- Choose apple types that resist this disease for new plantings\n- Ask for mancozeb spray at your agro shop',
  },
  apple_healthy: {
    label: 'Apple (Healthy)',
    severity: 'low',
    symptoms: [
      { label: 'Deep green, glossy leaves', assetIndex: 1 },
      { label: 'No spots or lesions visible', assetIndex: 2 },
      { label: 'Firm, well-coloured fruit developing', assetIndex: 3 },
      { label: 'Strong branch structure with good growth', assetIndex: 4 },
    ],
    steps: [
      'Continue checking leaves and fruit every week for any early signs of disease',
      'Water regularly and keep the ground under the tree clean of fallen debris',
      'Prune any dead branches to maintain good airflow through the canopy',
    ],
    mitigationSteps:
      'Good news! Your apple tree looks healthy.\n\nWhat to do:\n- Keep checking leaves and fruit every week\n- Water regularly and keep the ground under the tree clean\n- Prune dead branches to keep air flowing',
  },

  // Blueberry
  blueberry_healthy: {
    label: 'Blueberry (Healthy)',
    severity: 'low',
    symptoms: [
      { label: 'Bright green healthy leaves', assetIndex: 1 },
      { label: 'No spots or discolouration', assetIndex: 2 },
      { label: 'Well-formed berries developing normally', assetIndex: 3 },
      { label: 'Vigorous new shoot growth', assetIndex: 4 },
    ],
    steps: [
      'Keep watering regularly and maintain soil acidity with mulch',
      'Inspect plants weekly for any new spots or colour changes',
      'Prune dead or crossing canes each year to maintain plant vigour',
    ],
    mitigationSteps:
      'Good news! Your blueberry plant looks healthy.\n\nWhat to do:\n- Keep watering regularly\n- Check plants every week for any new spots\n- Keep soil acidic with mulch',
  },

  // Cherry
  cherry_powdery_mildew: {
    label: 'Cherry Powdery Mildew',
    severity: 'medium',
    symptoms: [
      { label: 'White powdery coating on leaf surfaces', assetIndex: 1 },
      { label: 'Curled or twisted new leaves', assetIndex: 2 },
      { label: 'Stunted shoot growth', assetIndex: 3 },
      { label: 'Pale, bleached patches on older leaves', assetIndex: 4 },
    ],
    steps: [
      'Remove and discard leaves with heavy white powder coating',
      'Give trees more space and prune to improve airflow and allow leaves to dry',
      'Apply sulfur spray from your agro shop and always water at the base, never from above',
    ],
    mitigationSteps:
      'Signs to look for: White powdery coating on leaves, like flour was dusted on them. New leaves may curl or twist.\n\nWhat to do:\n- Remove leaves with heavy white coating\n- Give trees more space so air can dry the leaves\n- Ask for sulfur spray at your agro shop\n- Do not water from above - water at the base',
  },
  cherry_healthy: {
    label: 'Cherry (Healthy)',
    severity: 'low',
    symptoms: [
      { label: 'Shiny, dark green leaves', assetIndex: 1 },
      { label: 'No white coating or spots', assetIndex: 2 },
      { label: 'Normal fruit size and colour', assetIndex: 3 },
      { label: 'Healthy new shoot growth', assetIndex: 4 },
    ],
    steps: [
      'Keep watering regularly at the base of the tree',
      'Check leaves every week for any white powder or spots',
      'Prune annually to maintain good airflow through the canopy',
    ],
    mitigationSteps:
      'Good news! Your cherry tree looks healthy.\n\nWhat to do:\n- Keep watering regularly\n- Check leaves every week for white powder or spots\n- Prune to keep good airflow',
  },

  // Corn
  corn_cercospora: {
    label: 'Corn Gray Leaf Spot',
    severity: 'high',
    symptoms: [
      { label: 'Long narrow gray-tan rectangles on leaves', assetIndex: 1 },
      { label: 'Spots following leaf veins in rows', assetIndex: 2 },
      { label: 'Leaf tissue dying between the veins', assetIndex: 3 },
      { label: 'Premature drying of lower leaves', assetIndex: 4 },
    ],
    steps: [
      'Rotate crops next season — do not plant corn in the same field two years in a row',
      'Plough old corn stalks into the soil after harvest to bury the fungus source',
      'Choose corn seed resistant to this disease and apply fungicide if spots spread fast before tasselling',
    ],
    mitigationSteps:
      'Signs to look for: Long, narrow gray or tan rectangles on leaves. Spots follow the leaf veins and look like tiny bricks.\n\nWhat to do:\n- Do not plant corn in the same field next season - rotate with beans or another crop\n- Plow old corn stalks into the soil after harvest\n- Choose corn seed that resists this disease\n- If spots are spreading fast before tasseling, ask for fungicide at your agro shop',
  },
  corn_common_rust: {
    label: 'Corn Common Rust',
    severity: 'medium',
    symptoms: [
      { label: 'Small raised red-brown bumps on leaf surfaces', assetIndex: 1 },
      { label: 'Rusty powder that rubs off on fingers', assetIndex: 2 },
      { label: 'Bumps appearing on both sides of leaves', assetIndex: 3 },
      { label: 'Yellow streaks around pustule clusters', assetIndex: 4 },
    ],
    steps: [
      'Plant rust-resistant corn varieties in the next season to prevent recurrence',
      'Monitor fields closely during cool, damp weather when rust spreads fastest',
      'If bumps appear before tasselling, apply fungicide spray from your agro shop',
    ],
    mitigationSteps:
      'Signs to look for: Small raised red-brown bumps on both sides of leaves. Rub a leaf - if rusty powder comes off on your finger, it is rust.\n\nWhat to do:\n- Plant rust-resistant corn varieties next season\n- Check fields often during cool, damp weather\n- If bumps appear before the tassel comes out, ask for fungicide spray\n- Most corn recovers if rust comes late in the season',
  },
  corn_northern_blight: {
    label: 'Corn Northern Leaf Blight',
    severity: 'high',
    symptoms: [
      { label: 'Long cigar-shaped gray-green spots, 3–15 cm', assetIndex: 1 },
      { label: 'Lesions starting on lower leaves first', assetIndex: 2 },
      { label: 'Spots expanding and merging on the blade', assetIndex: 3 },
      { label: 'Dark sporulation in the centre of lesions', assetIndex: 4 },
    ],
    steps: [
      'Rotate crops — never plant corn immediately after corn in the same field',
      'Plough old stalks under after harvest to reduce the fungus in the soil',
      'Use resistant corn varieties and apply fungicide if disease moves up the plant before tasselling',
    ],
    mitigationSteps:
      'Signs to look for: Long cigar-shaped gray-green spots on leaves, 3-15 cm long. Starts on lower leaves and moves up.\n\nWhat to do:\n- Rotate crops - do not plant corn after corn\n- Plow old stalks under after harvest\n- Choose resistant corn varieties\n- If disease is moving up the plant before tasseling, ask for fungicide',
  },
  corn_healthy: {
    label: 'Corn (Healthy)',
    severity: 'low',
    symptoms: [
      { label: 'Tall, upright stalks with broad green leaves', assetIndex: 1 },
      { label: 'No spots or lesions on leaf blades', assetIndex: 2 },
      { label: 'Well-formed tassels and ears', assetIndex: 3 },
      { label: 'Even green colour across all leaves', assetIndex: 4 },
    ],
    steps: [
      'Keep watering regularly and watch lower leaves for any spots as the season progresses',
      'Rotate corn with other crops each year to reduce disease build-up',
      'Continue weekly field checks, especially during warm humid weather',
    ],
    mitigationSteps:
      'Good news! Your corn looks healthy.\n\nWhat to do:\n- Keep watering regularly\n- Watch lower leaves for any spots as the season goes on\n- Rotate corn with other crops each year',
  },

  // Grape
  grape_black_rot: {
    label: 'Grape Black Rot',
    severity: 'high',
    symptoms: [
      { label: 'Small brown spots with dark edges on leaves', assetIndex: 1 },
      { label: 'Grapes turning brown then shrivelling black', assetIndex: 2 },
      { label: 'Hard mummified black berries on vine', assetIndex: 3 },
      { label: 'Brown lesions on young shoots and stems', assetIndex: 4 },
    ],
    steps: [
      'Remove all shrivelled black mummified grapes from the vine and the ground immediately',
      'Prune vines to allow air and sunlight into the canopy and clean up all fallen material',
      'Apply fungicide spray from your agro shop starting early when new shoots are growing',
    ],
    mitigationSteps:
      'Signs to look for: Small brown spots on leaves with dark edges. Grapes turn brown, then shrivel up into hard black mummies.\n\nWhat to do:\n- Remove all shriveled black grapes from the vine and ground\n- Prune vines to let air and sunlight in\n- Ask for fungicide spray at your agro shop - start early when shoots are growing\n- Clean up all fallen fruit and leaves',
  },
  grape_esca: {
    label: 'Grape Esca (Black Measles)',
    severity: 'critical',
    symptoms: [
      { label: 'Tiger-stripe yellow and brown pattern on leaves', assetIndex: 1 },
      { label: 'Dark spots and streaks on fruit', assetIndex: 2 },
      { label: 'Sudden wilting and death of branches', assetIndex: 3 },
      { label: 'Wood discolouration when branches are cut', assetIndex: 4 },
    ],
    steps: [
      'Cut off all dead branches well below the infected zone and clean tools between each vine',
      'Paint all pruning cuts with wound paste to protect the exposed wood from re-infection',
      'Keep vines well-watered — water-stressed vines are far more susceptible to this disease',
    ],
    mitigationSteps:
      'Signs to look for: Tiger-stripe pattern on leaves - yellow and brown stripes between the veins. Dark spots on fruit. Sometimes whole branches die suddenly.\n\nWhat to do:\n- Cut off dead branches well below the sick part\n- Clean your cutting tools between each vine\n- Paint pruning cuts with wound paste to protect them\n- Keep vines well-watered - stressed vines get sicker',
  },
  grape_leaf_blight: {
    label: 'Grape Leaf Blight',
    severity: 'medium',
    symptoms: [
      { label: 'Brown spots near leaf edges', assetIndex: 1 },
      { label: 'Drying and early leaf drop', assetIndex: 2 },
      { label: 'Angular lesions bordered by leaf veins', assetIndex: 3 },
      { label: 'Yellowing between brown spots', assetIndex: 4 },
    ],
    steps: [
      'Remove and destroy all leaves showing brown spots immediately',
      'Train vines on wires so air moves freely and leaves stay dry',
      'Apply copper or mancozeb spray from your agro shop and always water at the base',
    ],
    mitigationSteps:
      'Signs to look for: Brown spots on leaves, often near the edges. Leaves may dry out and fall off early.\n\nWhat to do:\n- Remove and destroy leaves with brown spots\n- Train vines on wires so air can move freely\n- Ask for copper or mancozeb spray at your agro shop\n- Water at the base, not on the leaves',
  },
  grape_healthy: {
    label: 'Grape (Healthy)',
    severity: 'low',
    symptoms: [
      { label: 'Lush green leaves with clean margins', assetIndex: 1 },
      { label: 'No spots or discolouration visible', assetIndex: 2 },
      { label: 'Well-formed grape clusters developing', assetIndex: 3 },
      { label: 'Strong shoot growth along the trellis', assetIndex: 4 },
    ],
    steps: [
      'Continue checking leaves and fruit every week for early signs of disease',
      'Prune vines each season to maintain good airflow through the canopy',
      'Clean up fallen leaves and old fruit from around the vines after each season',
    ],
    mitigationSteps:
      'Good news! Your grape vine looks healthy.\n\nWhat to do:\n- Keep checking leaves and fruit every week\n- Prune vines to keep good airflow\n- Clean up fallen leaves and old fruit',
  },

  // Orange
  orange_huanglongbing: {
    label: 'Citrus Greening Disease',
    severity: 'critical',
    symptoms: [
      { label: 'Blotchy yellow mottling on leaves', assetIndex: 1 },
      { label: 'Small, lopsided green fruit that stays bitter', assetIndex: 2 },
      { label: 'Twig and branch dieback', assetIndex: 3 },
      { label: 'Tiny psyllid insects on new leaf growth', assetIndex: 4 },
    ],
    steps: [
      'Inspect new leaf growth for tiny psyllid insects and apply insecticide immediately if found',
      'Remove and burn all severely infected trees — there is no cure and the disease will spread',
      'Only replant with disease-free certified trees from a trusted nursery',
    ],
    mitigationSteps:
      'Signs to look for: Leaves turn yellow in a blotchy pattern (not all at once). Fruit stays small, lopsided, and green on one side. Fruit tastes bitter. This is a very serious disease.\n\nWhat to do:\n- Look for tiny insects called psyllids on new leaf growth - they spread this disease\n- Ask for insecticide to kill psyllids at your agro shop\n- Sadly, sick trees cannot be cured - remove and burn badly infected trees\n- Only plant new trees from trusted nurseries with disease-free certificates',
  },

  // Peach
  peach_bacterial_spot: {
    label: 'Peach Bacterial Spot',
    severity: 'high',
    symptoms: [
      { label: 'Small dark spots that fall out leaving holes', assetIndex: 1 },
      { label: 'Dark sunken spots on fruit surface', assetIndex: 2 },
      { label: 'Shot-hole pattern across leaf blades', assetIndex: 3 },
      { label: 'Yellowing and early defoliation', assetIndex: 4 },
    ],
    steps: [
      'Apply copper spray during the dormant season before any buds open',
      'Water at the base only — keep foliage dry at all times',
      'Remove and dispose of heavily spotted branches when pruning each year',
    ],
    mitigationSteps:
      'Signs to look for: Small dark spots on leaves that may fall out, leaving holes (like shotgun damage). Fruit gets dark sunken spots.\n\nWhat to do:\n- Spray copper during the dormant season (before buds open)\n- Do not water from above - keep leaves dry\n- Remove badly spotted branches when pruning\n- Choose resistant peach varieties for new plantings',
  },
  peach_healthy: {
    label: 'Peach (Healthy)',
    severity: 'low',
    symptoms: [
      { label: 'Slender bright green leaves, no spots', assetIndex: 1 },
      { label: 'Well-formed fruit with good skin colour', assetIndex: 2 },
      { label: 'No holes or shot-hole damage visible', assetIndex: 3 },
      { label: 'Vigorous shoot and leaf growth', assetIndex: 4 },
    ],
    steps: [
      'Keep watering regularly and check leaves for spots every week',
      'Prune dead branches each dormant season to maintain tree health',
      'Monitor for insects under leaves and treat early if psyllids or aphids appear',
    ],
    mitigationSteps:
      'Good news! Your peach tree looks healthy.\n\nWhat to do:\n- Keep watering regularly\n- Check leaves for spots every week\n- Prune dead branches each year',
  },

  // Pepper
  pepper_bacterial_spot: {
    label: 'Pepper Bacterial Spot',
    severity: 'high',
    symptoms: [
      { label: 'Small dark water-soaked spots on leaves', assetIndex: 1 },
      { label: 'Yellow halos around dark leaf spots', assetIndex: 2 },
      { label: 'Raised bumpy spots on fruit surface', assetIndex: 3 },
      { label: 'Defoliation of badly infected plants', assetIndex: 4 },
    ],
    steps: [
      'Remove and throw away any badly infected plants to prevent spread to neighbours',
      'Apply copper spray every 7–10 days during wet weather as a protective measure',
      'Avoid planting peppers or tomatoes in the same spot for at least 2 years',
    ],
    mitigationSteps:
      'Signs to look for: Small, dark, water-soaked spots on leaves. Spots may have yellow edges. Fruit gets raised bumpy spots.\n\nWhat to do:\n- Pull out and throw away badly sick plants\n- Ask for copper spray at your agro shop - spray every 7-10 days in wet weather\n- Use clean seed from a trusted source\n- Do not plant peppers or tomatoes in the same spot for 2 years',
  },
  pepper_healthy: {
    label: 'Pepper (Healthy)',
    severity: 'low',
    symptoms: [
      { label: 'Dark green leaves with no spots', assetIndex: 1 },
      { label: 'Firm, well-coloured fruit', assetIndex: 2 },
      { label: 'Strong upright stems and shoots', assetIndex: 3 },
      { label: 'Clean leaf surfaces throughout the canopy', assetIndex: 4 },
    ],
    steps: [
      'Continue watering regularly at the base, keeping foliage dry',
      'Inspect leaves every week for any early spots or discolouration',
      'Keep weeds away from pepper plants to reduce insect and disease pressure',
    ],
    mitigationSteps:
      'Good news! Your pepper plant looks healthy.\n\nWhat to do:\n- Keep watering regularly at the base\n- Check leaves every week for spots\n- Keep weeds away from your pepper plants',
  },

  // Potato
  potato_early_blight: {
    label: 'Potato Early Blight',
    severity: 'medium',
    symptoms: [
      { label: 'Bullseye target-shaped dark spots on lower leaves', assetIndex: 1 },
      { label: 'Yellowing leaf tissue around dark lesions', assetIndex: 2 },
      { label: 'Spots enlarging and merging on older leaves', assetIndex: 3 },
      { label: 'Progressive defoliation from base upward', assetIndex: 4 },
    ],
    steps: [
      'Remove lower leaves showing target-shaped spots and add mulch around the base to stop soil splash',
      'Water at the base only and stake plants to improve airflow',
      'Apply chlorothalonil or mancozeb spray from your agro shop and avoid planting potatoes in the same field next year',
    ],
    mitigationSteps:
      'Signs to look for: Dark brown spots with rings inside them (like a target or bullseye) on older lower leaves first.\n\nWhat to do:\n- Pick off lower leaves with target-shaped spots\n- Put mulch around the base to stop soil from splashing onto leaves\n- Water at the base, not from above\n- Ask for chlorothalonil or mancozeb spray at your agro shop\n- Do not plant potatoes in the same field next year',
  },
  potato_late_blight: {
    label: 'Potato Late Blight',
    severity: 'critical',
    symptoms: [
      { label: 'Large dark water-soaked patches spreading fast', assetIndex: 1 },
      { label: 'White fuzzy mold on leaf undersides', assetIndex: 2 },
      { label: 'Dark lesions spreading to stems and tubers', assetIndex: 3 },
      { label: 'Rapid collapse of entire plant in wet weather', assetIndex: 4 },
    ],
    steps: [
      'Act immediately — remove and burn all infected plants before the disease spreads further',
      'Apply fungicide from your agro shop right away and check the field every day in cool wet weather',
      'Use only certified clean seed potatoes next season and avoid watering from above',
    ],
    mitigationSteps:
      'Signs to look for: Large dark water-soaked patches on leaves that spread very fast. White fuzzy mold on the underside in wet weather. This is very serious and can destroy a whole field quickly.\n\nWhat to do:\n- ACT FAST - remove and burn all sick plants right away\n- Ask for fungicide at your agro shop immediately\n- Do not water from above\n- Check your field every day during cool, wet weather\n- Use certified clean seed potatoes next season',
  },
  potato_healthy: {
    label: 'Potato (Healthy)',
    severity: 'low',
    symptoms: [
      { label: 'Lush green compound leaves, no lesions', assetIndex: 1 },
      { label: 'Strong upright stems with good colour', assetIndex: 2 },
      { label: 'No water-soaked or dark patches visible', assetIndex: 3 },
      { label: 'Even canopy growth across the row', assetIndex: 4 },
    ],
    steps: [
      'Keep watering regularly and hill up soil around the base of the plant',
      'Watch lower leaves closely for dark spots, especially in cool wet weather',
      'Rotate potatoes with non-related crops each season to reduce disease pressure',
    ],
    mitigationSteps:
      'Good news! Your potato plant looks healthy.\n\nWhat to do:\n- Keep watering regularly\n- Hill up soil around the base of the plant\n- Watch lower leaves for dark spots, especially in wet weather',
  },

  // Raspberry
  raspberry_healthy: {
    label: 'Raspberry (Healthy)',
    severity: 'low',
    symptoms: [
      { label: 'Bright green leaves with serrated edges', assetIndex: 1 },
      { label: 'No spots or powdery coating', assetIndex: 2 },
      { label: 'Well-formed berries developing on canes', assetIndex: 3 },
      { label: 'Vigorous new cane growth from base', assetIndex: 4 },
    ],
    steps: [
      'Keep watering regularly and check plants weekly for any spots or abnormal growth',
      'Prune old fruited canes after harvest to allow new canes to grow strongly',
      'Thin canes so air circulates freely and leaves dry quickly after rain',
    ],
    mitigationSteps:
      'Good news! Your raspberry plant looks healthy.\n\nWhat to do:\n- Keep watering regularly\n- Check plants every week for any new spots\n- Prune old canes after fruiting',
  },

  // Soybean
  soybean_healthy: {
    label: 'Soybean (Healthy)',
    severity: 'low',
    symptoms: [
      { label: 'Dark green trifoliate leaves, no discolouration', assetIndex: 1 },
      { label: 'No yellow spots or brown lesions', assetIndex: 2 },
      { label: 'Well-filled pods developing on stems', assetIndex: 3 },
      { label: 'Even canopy height across the field', assetIndex: 4 },
    ],
    steps: [
      'Continue monitoring your field regularly, especially during humid periods',
      'Watch for yellow or brown spots on leaves and act early if any appear',
      'Rotate soybeans with corn or other crops each year to maintain soil health',
    ],
    mitigationSteps:
      'Good news! Your soybean crop looks healthy.\n\nWhat to do:\n- Keep monitoring your field regularly\n- Watch for yellow or brown spots on leaves\n- Rotate with corn or other crops each year',
  },

  // Squash
  squash_powdery_mildew: {
    label: 'Squash Powdery Mildew',
    severity: 'medium',
    symptoms: [
      { label: 'White powdery patches on upper leaf surface', assetIndex: 1 },
      { label: 'Spots spreading to cover entire leaf', assetIndex: 2 },
      { label: 'Yellowing and browning under the powder', assetIndex: 3 },
      { label: 'Stunted fruit development in severe cases', assetIndex: 4 },
    ],
    steps: [
      'Remove and discard all leaves fully covered in white powder',
      'Space plants further apart to allow air to dry the foliage after rain or watering',
      'Apply sulfur spray or neem oil from your agro shop and avoid applying heavy fertiliser',
    ],
    mitigationSteps:
      'Signs to look for: White powdery patches on top of leaves, like someone dusted them with flour. Starts as small spots and spreads to cover the whole leaf.\n\nWhat to do:\n- Remove leaves that are fully covered in white powder\n- Give plants more space so air can dry the leaves\n- Ask for sulfur spray or neem oil at your agro shop\n- Do not put too much fertilizer - it makes the problem worse',
  },

  // Strawberry
  strawberry_leaf_scorch: {
    label: 'Strawberry Leaf Scorch',
    severity: 'medium',
    symptoms: [
      { label: 'Many small dark purple spots on leaves', assetIndex: 1 },
      { label: 'Spots merging to create scorched brown edges', assetIndex: 2 },
      { label: 'Dry, papery leaf tissue between spots', assetIndex: 3 },
      { label: 'Early defoliation of older infected leaves', assetIndex: 4 },
    ],
    steps: [
      'Remove and throw away all badly scorched leaves to reduce the fungus source',
      'After harvest, mow the bed short and thin out plants to improve airflow',
      'Apply captan spray from your agro shop during flowering and ensure water drains freely',
    ],
    mitigationSteps:
      'Signs to look for: Many small dark purple spots on leaves. Spots grow together and leaf edges turn brown and dry, looking burnt.\n\nWhat to do:\n- Remove and throw away badly scorched leaves\n- After harvest, mow the bed short and thin out plants\n- Make sure water drains well - plants should not sit in water\n- Ask for captan spray at your agro shop during blooming',
  },
  strawberry_healthy: {
    label: 'Strawberry (Healthy)',
    severity: 'low',
    symptoms: [
      { label: 'Bright trifoliate leaves with no spots', assetIndex: 1 },
      { label: 'No purple or brown lesions visible', assetIndex: 2 },
      { label: 'Well-formed red fruit with good size', assetIndex: 3 },
      { label: 'Strong runners and crown growth', assetIndex: 4 },
    ],
    steps: [
      'Keep watering regularly and check leaves every week for purple spots',
      'Remove old dead leaves and plant debris from around the plants',
      'Thin out runners to prevent overcrowding and maintain good airflow',
    ],
    mitigationSteps:
      'Good news! Your strawberry plant looks healthy.\n\nWhat to do:\n- Keep watering regularly\n- Check leaves every week for purple spots\n- Remove old dead leaves from around the plants',
  },

  // Tomato
  tomato_bacterial_spot: {
    label: 'Tomato Bacterial Spot',
    severity: 'high',
    symptoms: [
      { label: 'Small dark greasy-looking spots on leaves', assetIndex: 1 },
      { label: 'Yellow rings around dark leaf lesions', assetIndex: 2 },
      { label: 'Small raised bumps on fruit surface', assetIndex: 3 },
      { label: 'Defoliation of infected lower leaves', assetIndex: 4 },
    ],
    steps: [
      'Remove and dispose of all leaves and fruit with spots immediately',
      'Apply copper spray every 5–7 days in wet weather from your agro shop',
      'Avoid planting tomatoes or peppers in the same location for at least 2 years',
    ],
    mitigationSteps:
      'Signs to look for: Small dark spots on leaves that look greasy or water-soaked. Spots may have yellow rings around them. Fruit gets small raised bumps.\n\nWhat to do:\n- Remove and throw away leaves and fruit with spots\n- Ask for copper spray at your agro shop - spray every 5-7 days in wet weather\n- Use clean seeds and seedlings from trusted sources\n- Do not plant tomatoes or peppers in the same spot for 2 years',
  },
  tomato_early_blight: {
    label: 'Tomato Early Blight',
    severity: 'medium',
    symptoms: [
      { label: 'Target-shaped brown rings on lower leaves', assetIndex: 1 },
      { label: 'Yellowing around the dark lesions', assetIndex: 2 },
      { label: 'Lesions expanding on leaf surface', assetIndex: 3 },
      { label: 'Progressive leaf drop from base up', assetIndex: 4 },
    ],
    steps: [
      'Remove lower leaves showing bullseye-pattern spots and add straw mulch around the base',
      'Stake plants up off the ground and water only at the roots',
      'Apply copper spray from your agro shop and rotate tomatoes to a different spot next year',
    ],
    mitigationSteps:
      'Signs to look for: Dark brown spots with rings inside (like a target) on lower leaves first. Leaves turn yellow around the spots and fall off.\n\nWhat to do:\n- Pick off lower leaves with target-shaped spots\n- Put straw or mulch around the base to stop soil splashing\n- Stake your tomatoes up off the ground\n- Ask for copper spray at your agro shop\n- Do not plant tomatoes in the same spot next year',
  },
  tomato_late_blight: {
    label: 'Tomato Late Blight',
    severity: 'critical',
    symptoms: [
      { label: 'Large dark greasy patches spreading fast', assetIndex: 1 },
      { label: 'White fuzzy mold on leaf undersides', assetIndex: 2 },
      { label: 'Brown greasy spots on fruit', assetIndex: 3 },
      { label: 'Rapid collapse of entire plant', assetIndex: 4 },
    ],
    steps: [
      'Act immediately — pull out and burn all infected plants before the disease spreads to neighbours',
      'Apply fungicide from your agro shop right away and keep leaves completely dry',
      'Use disease-free seedlings next season and inspect the garden every day in cool wet weather',
    ],
    mitigationSteps:
      'Signs to look for: Large dark patches on leaves that spread very fast. White fuzzy mold on undersides of leaves. Fruit gets large brown greasy spots. This is very serious.\n\nWhat to do:\n- ACT FAST - pull out and burn all sick plants right away before it spreads\n- Ask for fungicide at your agro shop immediately\n- Do not water from above - keep leaves dry\n- Check your garden every day in cool wet weather\n- Use disease-free seedlings next season',
  },
  tomato_leaf_mold: {
    label: 'Tomato Leaf Mold',
    severity: 'medium',
    symptoms: [
      { label: 'Yellow spots on the upper surface of leaves', assetIndex: 1 },
      { label: 'Olive-green or brown fuzzy mold on undersides', assetIndex: 2 },
      { label: 'Leaves curling and drying out', assetIndex: 3 },
      { label: 'Spread starting on lower, older leaves', assetIndex: 4 },
    ],
    steps: [
      'Increase ventilation by opening vents or spacing plants further apart',
      'Remove and discard leaves with mold and water only at the base, never on the leaves',
      'Apply copper spray from your agro shop if the mold continues spreading',
    ],
    mitigationSteps:
      'Signs to look for: Yellow spots on top of leaves. Olive-green or brown fuzzy mold on the underside of leaves. Common in greenhouses.\n\nWhat to do:\n- Open doors and vents to let more air in\n- Remove leaves with mold and throw them away\n- Water at the base, never on the leaves\n- Space plants further apart for better airflow\n- Ask for copper spray at your agro shop if needed',
  },
  tomato_septoria: {
    label: 'Tomato Septoria Leaf Spot',
    severity: 'high',
    symptoms: [
      { label: 'Many small round spots with gray centres', assetIndex: 1 },
      { label: 'Dark edges around each small lesion', assetIndex: 2 },
      { label: 'Yellowing of leaves as spots multiply', assetIndex: 3 },
      { label: 'Defoliation progressing from base upward', assetIndex: 4 },
    ],
    steps: [
      'Remove lower leaves with many small spots and add mulch around the base to prevent soil splash',
      'Water only at the base and use stakes or cages to keep foliage off the ground',
      'Apply copper or chlorothalonil spray from your agro shop and rotate planting location next season',
    ],
    mitigationSteps:
      'Signs to look for: Many small round spots with gray centers and dark edges on lower leaves. Leaves turn yellow and fall off from the bottom up.\n\nWhat to do:\n- Pick off lower leaves with many spots\n- Put mulch around the base to stop soil from splashing up\n- Water at the base, not from above\n- Ask for copper or chlorothalonil spray at your agro shop\n- Do not plant tomatoes in the same spot next year',
  },
  tomato_spider_mites: {
    label: 'Tomato Spider Mites',
    severity: 'medium',
    symptoms: [
      { label: 'Tiny yellow or white stippling dots on leaves', assetIndex: 1 },
      { label: 'Fine webs visible on leaf undersides', assetIndex: 2 },
      { label: 'Bronzed or dusty appearance on leaf surfaces', assetIndex: 3 },
      { label: 'Leaf curl and drop in heavy infestations', assetIndex: 4 },
    ],
    steps: [
      'Spray the underside of leaves with a strong stream of water to dislodge the mites',
      'Apply neem oil or insecticidal soap from your agro shop every 5–7 days',
      'Avoid broad-spectrum insecticides that kill beneficial insects that eat mites naturally',
    ],
    mitigationSteps:
      'Signs to look for: Tiny yellow or white dots on leaves. Leaves look dusty or bronzed. You may see very thin webs on the underside of leaves. These are very tiny bugs.\n\nWhat to do:\n- Spray the underside of leaves with a strong stream of water to knock them off\n- Ask for neem oil or insecticidal soap at your agro shop - spray every 5-7 days\n- Do not use strong bug killer sprays - they kill the good bugs that eat mites\n- Ladybugs eat mites - encourage them in your garden',
  },
  tomato_target_spot: {
    label: 'Tomato Target Spot',
    severity: 'medium',
    symptoms: [
      { label: 'Brown concentric ring spots on any leaves', assetIndex: 1 },
      { label: 'Spots appearing on upper and lower canopy', assetIndex: 2 },
      { label: 'Dark centres inside the ring pattern', assetIndex: 3 },
      { label: 'Yellowing and defoliation around lesions', assetIndex: 4 },
    ],
    steps: [
      'Remove leaves with target-shaped brown spots and dispose of them away from the garden',
      'Stake or cage plants for better airflow and water only at the base',
      'Apply fungicide spray from your agro shop and keep garden free of old plant material',
    ],
    mitigationSteps:
      'Signs to look for: Brown spots with lighter rings inside (like a target) on leaves. Similar to early blight but can appear on any leaves, not just lower ones.\n\nWhat to do:\n- Remove leaves with target-shaped brown spots\n- Stake or cage your tomato plants for better airflow\n- Water at the base, not from above\n- Ask for fungicide spray at your agro shop\n- Keep your garden clean of old plant material',
  },
  tomato_yellow_curl: {
    label: 'Tomato Yellow Leaf Curl Virus',
    severity: 'critical',
    symptoms: [
      { label: 'Leaves curling upward with yellow edges', assetIndex: 1 },
      { label: 'Stunted new growth and deformed leaves', assetIndex: 2 },
      { label: 'White-fly insects on leaf undersides', assetIndex: 3 },
      { label: 'No fruit production on infected plants', assetIndex: 4 },
    ],
    steps: [
      'Place yellow sticky traps to catch whiteflies and apply insecticide from your agro shop',
      'Remove and burn all infected plants immediately — there is no cure for this virus',
      'Cover new transplants with fine mesh netting to keep whiteflies away and choose resistant varieties',
    ],
    mitigationSteps:
      'Signs to look for: Leaves curl upward and turn yellow at the edges. New growth is stunted and plants stop producing fruit. Spread by tiny white flies.\n\nWhat to do:\n- Look for small white flies on the underside of leaves - they spread this virus\n- Use yellow sticky traps to catch whiteflies\n- Pull out and burn sick plants - there is no cure for this virus\n- Cover new plants with fine mesh netting to keep whiteflies away\n- Ask for insecticide to control whiteflies at your agro shop\n- Choose resistant tomato varieties for next season',
  },
  tomato_mosaic: {
    label: 'Tomato Mosaic Virus',
    severity: 'critical',
    symptoms: [
      { label: 'Mosaic pattern of light and dark green on leaves', assetIndex: 1 },
      { label: 'Twisted, distorted or curled leaf shape', assetIndex: 2 },
      { label: 'Stunted plant growth throughout', assetIndex: 3 },
      { label: 'Brown streaks inside fruit when cut', assetIndex: 4 },
    ],
    steps: [
      'Remove and burn all infected plants immediately — there is no cure for mosaic virus',
      'Wash hands thoroughly with soap and disinfect all tools with bleach water between plants',
      'Use virus-free seed from trusted sources next season and do not smoke near tomato plants',
    ],
    mitigationSteps:
      'Signs to look for: Leaves have a mix of light green and dark green patches (mosaic pattern). Leaves may be twisted or curled. Fruit may have brown streaks inside.\n\nWhat to do:\n- Pull out and burn sick plants - there is no cure for this virus\n- Wash your hands well with soap before touching other plants\n- Clean all tools with bleach water (1 part bleach, 9 parts water) between plants\n- Do not smoke near tomatoes - tobacco can carry this virus\n- Use virus-free seed from trusted sources next season',
  },
  tomato_healthy: {
    label: 'Tomato (Healthy)',
    severity: 'low',
    symptoms: [
      { label: 'Deep green leaves with no spots or lesions', assetIndex: 1 },
      { label: 'Strong upright stems with good colour', assetIndex: 2 },
      { label: 'Well-formed fruit developing on the plant', assetIndex: 3 },
      { label: 'Healthy flower clusters visible on stems', assetIndex: 4 },
    ],
    steps: [
      'Keep watering regularly at the base and check leaves every week for spots or colour changes',
      'Stake plants for good airflow and remove lower leaves that touch the ground',
      'Rotate tomatoes to a different garden spot each year to prevent disease build-up',
    ],
    mitigationSteps:
      'Good news! Your tomato plant looks healthy.\n\nWhat to do:\n- Keep watering regularly at the base\n- Check leaves every week for spots or color changes\n- Stake up your plants for good airflow\n- Remove lower leaves that touch the ground',
  },
};

export function getDiseaseInfo(diseaseId: string): DiseaseLookupEntry {
  return (
    diseaseLookup[diseaseId] ?? {
      label: 'Unknown Disease',
      severity: 'medium',
      symptoms: [
        { label: 'Unusual spots or discolouration', assetIndex: 1 },
        { label: 'Abnormal leaf texture or shape', assetIndex: 2 },
        { label: 'Possible wilting or dieback', assetIndex: 3 },
        { label: 'Signs not matching known diseases', assetIndex: 4 },
      ],
      steps: [
        'Take another photo in better light with the leaf filling most of the frame',
        'Show the photo to your local agricultural officer for expert identification',
        'Monitor the plant daily and isolate it from healthy plants as a precaution',
      ] as [string, string, string],
      mitigationSteps:
        'We could not identify this disease clearly.\n\nWhat to do:\n- Try taking another photo in better light\n- Make sure the leaf fills most of the photo\n- Show the photo to your local agricultural officer for help',
    }
  );
}
