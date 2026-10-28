import { PriorityBand, PriorityBandConfig, ScoreValue } from '../types/lead';

/**
 * Normalizes case and whitespace for matching CRM values without mutating the original strings.
 */
export function normalizeValue(val: string | undefined | null): string {
  if (!val) return '';
  return val.trim().replace(/\s+/g, ' ').toLowerCase();
}

/**
 * Official Lead Stage Scoring Rubric:
 * - MAT = 2
 * - IS = 1
 * - NI / Not Interested = 0
 * Missing or unsupported values are marked 'Unscored'.
 */
export function calculateStageScore(leadStage: string | undefined | null): ScoreValue {
  const norm = normalizeValue(leadStage);
  if (!norm) return 'Unscored';

  if (norm === 'mat') return 2;
  if (norm === 'is') return 1;
  if (norm === 'ni' || norm === 'not interested' || norm === 'ni / not interested') return 0;

  return 'Unscored';
}

/**
 * Official Lead Category Scoring Rubric:
 * - High = 3
 * - Upper Medium = 2
 * - Medium = 1
 * Missing or unsupported values are marked 'Unscored'.
 */
export function calculateCategoryScore(leadCategory: string | undefined | null): ScoreValue {
  const norm = normalizeValue(leadCategory);
  if (!norm) return 'Unscored';

  if (norm === 'high') return 3;
  if (norm === 'upper medium') return 2;
  if (norm === 'medium') return 1;

  return 'Unscored';
}

/**
 * Total Lead Score = Stage Score + Category Score.
 * If either required score component is missing/unsupported ('Unscored'),
 * mark the total as 'Unscored'.
 */
export function calculateTotalLeadScore(
  stageScore: ScoreValue,
  categoryScore: ScoreValue
): ScoreValue {
  if (typeof stageScore !== 'number' || typeof categoryScore !== 'number') {
    return 'Unscored';
  }
  return stageScore + categoryScore;
}

/**
 * Provisional Dashboard Priority Bands:
 * - 5: Very High Priority
 * - 4: High Priority
 * - 3: Medium Priority
 * - 2: Low Priority
 * - 0–1: Very Low Priority
 * Note: Clearly labeled as proposed dashboard classifications, not official CRM categories.
 */
export const DEFAULT_PRIORITY_BANDS: PriorityBandConfig[] = [
  {
    score: 5,
    band: 'Very High Priority',
    description: 'MAT + High (Score 5)',
    colorClass: 'bg-purple-100 text-purple-800 border-purple-200'
  },
  {
    score: 4,
    band: 'High Priority',
    description: 'MAT + Upper Medium or IS + High (Score 4)',
    colorClass: 'bg-blue-100 text-blue-800 border-blue-200'
  },
  {
    score: 3,
    band: 'Medium Priority',
    description: 'MAT + Medium, IS + Upper Medium, or NI + High (Score 3)',
    colorClass: 'bg-emerald-100 text-emerald-800 border-emerald-200'
  },
  {
    score: 2,
    band: 'Low Priority',
    description: 'IS + Medium or NI + Upper Medium (Score 2)',
    colorClass: 'bg-amber-100 text-amber-800 border-amber-200'
  },
  {
    score: '0–1',
    band: 'Very Low Priority',
    description: 'NI + Medium (Score 1) or Score 0',
    colorClass: 'bg-slate-100 text-slate-700 border-slate-200'
  }
];

export function assignPriorityBand(
  totalScore: ScoreValue,
  customThresholds?: {
    veryHigh: number;
    high: number;
    medium: number;
    low: number;
  }
): PriorityBand {
  if (typeof totalScore !== 'number') {
    return 'Unscored';
  }

  const thresholds = customThresholds ?? {
    veryHigh: 5,
    high: 4,
    medium: 3,
    low: 2
  };

  if (totalScore >= thresholds.veryHigh) return 'Very High Priority';
  if (totalScore >= thresholds.high) return 'High Priority';
  if (totalScore >= thresholds.medium) return 'Medium Priority';
  if (totalScore >= thresholds.low) return 'Low Priority';
  return 'Very Low Priority';
}

