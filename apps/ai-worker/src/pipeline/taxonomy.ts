import type { ProblemCategory } from '@sih/shared-types';

/**
 * Keyword taxonomy for the rule-based classifier. Keep in sync with
 * ProblemCategory in packages/shared-types/src/enums.ts — every category
 * there needs an entry here (enforced by a test, see __tests__/classifier.test.ts).
 * Weighted so a strong signal word (e.g. "contaminated") counts more than a
 * weak one (e.g. "problem").
 */
export const CATEGORY_KEYWORDS: Record<ProblemCategory, { word: string; weight: number }[]> = {
  WATER_SANITATION: [
    { word: 'water', weight: 2 },
    { word: 'contaminat', weight: 3 },
    { word: 'sewage', weight: 3 },
    { word: 'drain', weight: 2 },
    { word: 'pond', weight: 2 },
    { word: 'well', weight: 1 },
    { word: 'sanitation', weight: 3 },
    { word: 'toilet', weight: 2 },
    { word: 'pipeline', weight: 1 },
    { word: 'polluted', weight: 2 },
  ],
  ROADS_TRANSPORT: [
    { word: 'road', weight: 2 },
    { word: 'pothole', weight: 3 },
    { word: 'bridge', weight: 2 },
    { word: 'traffic', weight: 2 },
    { word: 'highway', weight: 2 },
    { word: 'accident', weight: 2 },
    { word: 'street light', weight: 1 },
    { word: 'flyover', weight: 2 },
    { word: 'bus stop', weight: 1 },
  ],
  EDUCATION: [
    { word: 'school', weight: 3 },
    { word: 'teacher', weight: 3 },
    { word: 'classroom', weight: 2 },
    { word: 'student', weight: 1 },
    { word: 'college', weight: 2 },
    { word: 'education', weight: 2 },
    { word: 'anganwadi', weight: 2 },
  ],
  HEALTHCARE: [
    { word: 'hospital', weight: 3 },
    { word: 'health centre', weight: 3 },
    { word: 'phc', weight: 3 },
    { word: 'doctor', weight: 2 },
    { word: 'medicine', weight: 2 },
    { word: 'clinic', weight: 2 },
    { word: 'ambulance', weight: 2 },
    { word: 'disease', weight: 1 },
  ],
  ELECTRICITY: [
    { word: 'electricity', weight: 3 },
    { word: 'power cut', weight: 3 },
    { word: 'transformer', weight: 2 },
    { word: 'voltage', weight: 2 },
    { word: 'power line', weight: 2 },
    { word: 'blackout', weight: 2 },
  ],
  WASTE_MANAGEMENT: [
    { word: 'garbage', weight: 3 },
    { word: 'waste', weight: 2 },
    { word: 'trash', weight: 2 },
    { word: 'dump', weight: 2 },
    { word: 'landfill', weight: 2 },
    { word: 'litter', weight: 1 },
  ],
  AGRICULTURE: [
    { word: 'crop', weight: 3 },
    { word: 'farm', weight: 2 },
    { word: 'irrigation', weight: 3 },
    { word: 'fertilizer', weight: 2 },
    { word: 'harvest', weight: 1 },
    { word: 'pesticide', weight: 2 },
  ],
  PUBLIC_SAFETY: [
    { word: 'crime', weight: 3 },
    { word: 'theft', weight: 2 },
    { word: 'unsafe', weight: 2 },
    { word: 'harassment', weight: 3 },
    { word: 'police', weight: 1 },
    { word: 'violence', weight: 3 },
  ],
  OTHER: [],
};

/** Signals used by both the classifier's confidence check and the priority scorer. */
export const URGENCY_KEYWORDS = [
  'emergency',
  'urgent',
  'critical',
  'life-threatening',
  'dying',
  'immediately',
  'severe',
  'outbreak',
];
