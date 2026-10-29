import { DrillDownSelection, FilterState, ProcessedLead } from '../types/lead';
import { normalizeValue } from './scoring';

export const INITIAL_FILTER_STATE: FilterState = {
  search: '',
  course: 'ALL',
  leadCategory: 'ALL',
  city: 'ALL',
  leadStage: 'ALL',
  funnelStatus: 'ALL',
  lastCallSubDisposition: 'ALL',
  createdAtStart: '',
  createdAtEnd: '',
  updatedAtStart: '',
  updatedAtEnd: '',
  totalLeadScore: 'ALL',
  leadPriority: 'ALL'
};

export function countActiveFilters(filters: FilterState): number {
  let count = 0;
  if (filters.search.trim()) count++;
  if (filters.course !== 'ALL') count++;
  if (filters.leadCategory !== 'ALL') count++;
  if (filters.city !== 'ALL') count++;
  if (filters.leadStage !== 'ALL') count++;
  if (filters.funnelStatus !== 'ALL') count++;
  if (filters.lastCallSubDisposition !== 'ALL') count++;
  if (filters.createdAtStart || filters.createdAtEnd) count++;
  if (filters.updatedAtStart || filters.updatedAtEnd) count++;
  if (filters.totalLeadScore !== 'ALL') count++;
  if (filters.leadPriority !== 'ALL') count++;
  return count;
}

export function filterLeads(leads: ProcessedLead[], filters: FilterState): ProcessedLead[] {
  const searchQuery = normalizeValue(filters.search);

  return leads.filter((lead) => {
    // Global search across name, email, city, category, stage, and disposition
    if (searchQuery) {
      const searchableText = [
        lead.name,
        lead.email,
        lead.city,
        lead.leadCategory,
        lead.leadStage,
        lead.lastCallSubDisposition,
        lead.funnelStatus,
        lead.course ?? ''
      ]
        .map((s) => s.toLowerCase())
        .join(' ');

      if (!searchableText.includes(searchQuery)) {
        return false;
      }
    }

    if (filters.course !== 'ALL') {
      if ((lead.course || '(Empty)') !== filters.course) return false;
    }

    if (filters.leadCategory !== 'ALL') {
      if ((lead.leadCategory || '(Empty)') !== filters.leadCategory) return false;
    }

    if (filters.city !== 'ALL') {
      if ((lead.city || '(Empty)') !== filters.city) return false;
    }

    if (filters.leadStage !== 'ALL') {
      if ((lead.leadStage || '(Empty)') !== filters.leadStage) return false;
    }

    if (filters.funnelStatus !== 'ALL') {
      if ((lead.funnelStatus || '(Empty)') !== filters.funnelStatus) return false;
    }

    if (filters.lastCallSubDisposition !== 'ALL') {
      if ((lead.lastCallSubDisposition || '(Empty)') !== filters.lastCallSubDisposition) return false;
    }

    if (filters.totalLeadScore !== 'ALL') {
      if (String(lead.totalLeadScore) !== filters.totalLeadScore) return false;
    }

    if (filters.leadPriority !== 'ALL') {
      if (lead.leadPriority !== filters.leadPriority) return false;
    }

    // Created At date range filter (YYYY-MM-DD comparison)
    if (filters.createdAtStart) {
      if (!lead.createdAtDateOnly || lead.createdAtDateOnly < filters.createdAtStart) {
        return false;
      }
    }
    if (filters.createdAtEnd) {
      if (!lead.createdAtDateOnly || lead.createdAtDateOnly > filters.createdAtEnd) {
        return false;
      }
    }

    // Updated At date range filter (YYYY-MM-DD comparison)
    if (filters.updatedAtStart) {
      if (!lead.updatedAtDateOnly || lead.updatedAtDateOnly < filters.updatedAtStart) {
        return false;
      }
    }
    if (filters.updatedAtEnd) {
      if (!lead.updatedAtDateOnly || lead.updatedAtDateOnly > filters.updatedAtEnd) {
        return false;
      }
    }

    return true;
  });
}

export function applyDrillDown(
  leads: ProcessedLead[],
  drillDown: DrillDownSelection | null
): ProcessedLead[] {
  if (!drillDown) return leads;

  return leads.filter((lead) => {
    switch (drillDown.type) {
      case 'KPI_IS_BOOKED':
        return lead.isBooked;
      case 'KPI_IS_ATTENDED':
        return lead.isAttended;
      case 'KPI_MAT_BOOKED':
        return lead.matBooked;
      case 'IS_FUNNEL':
        return (
          normalizeValue(lead.isFunnelSpecific || lead.funnelStatus) ===
          normalizeValue(drillDown.value)
        );
      case 'MAT_FUNNEL_STATUS': {
        if (lead.matFunnelSpecific !== undefined) {
          const key = lead.matFunnelSpecific.trim() || '(Empty)';
          return key === drillDown.value;
        }
        return (lead.funnelStatus || '').trim() === drillDown.value;
      }
      case 'MAT_SUB_DISP':
        return normalizeValue(lead.lastCallSubDisposition) === 'mat booked';
      case 'MAT_TS_OTHER_DISP':
        return (
          normalizeValue(lead.matFunnelSpecific || lead.funnelStatus) === 'ts' &&
          normalizeValue(lead.lastCallSubDisposition) !== 'mat booked'
        );
      case 'MAT_STAGE':
        return normalizeValue(lead.leadStage) === 'mat';
      case 'SCORE':
        return String(lead.totalLeadScore) === drillDown.value;
      case 'CATEGORY':
        return (lead.leadCategory || 'Missing / Unscored') === drillDown.value;
      case 'STAGE':
        return (lead.leadStage || 'Missing') === drillDown.value;
      default:
        return true;
    }
  });
}

export interface DynamicInsights {
  isBookingRateText: string;
  isAttendanceRateText: string;
  matBookingRateText: string;
  highPriorityCount: number;
  veryHighPriorityCount: number;
  highPriorityCombinedCount: number;
  scoreDistributionSummary: string;
  largestCategoryName: string;
  largestCategoryCount: number;
  largestCategoryPct: number;
  nrisCount: number;
  rnaCount: number;
  attendedNotProgressedCount: number;
  attendedNotProgressedInIsCount: number;
  attendedNotProgressedNiCount: number;
  highScoringStillInIsCount: number;
  anomalousLeadsCount: number;
  unscoredLeadsCount: number;
  contradictoryMatNotInterestedCount: number;
  duplicateNameRecordsCount: number;
}

export function generateLeadershipInsights(
  leads: ProcessedLead[],
  isBookedCount: number,
  isAttendedCount: number,
  matBookedCount: number,
  isBookingRate: number,
  isAttendanceRate: number,
  matBookingRate: number
): DynamicInsights {
  const total = leads.length;

  let veryHighPriorityCount = 0;
  let highPriorityCount = 0;
  let nrisCount = 0;
  let rnaCount = 0;
  let attendedNotProgressedCount = 0;
  let attendedNotProgressedInIsCount = 0;
  let attendedNotProgressedNiCount = 0;
  let highScoringStillInIsCount = 0;
  let anomalousLeadsCount = 0;
  let unscoredLeadsCount = 0;
  let contradictoryMatNotInterestedCount = 0;

  const categoryCounts = new Map<string, number>();
  const scoreCounts = new Map<string, number>();
  const nameCounts = new Map<string, number>();

  for (const lead of leads) {
    if (lead.leadPriority === 'Very High Priority') veryHighPriorityCount++;
    if (lead.leadPriority === 'High Priority') highPriorityCount++;

    const catKey = lead.leadCategory || 'Missing';
    categoryCounts.set(catKey, (categoryCounts.get(catKey) ?? 0) + 1);

    const scoreKey = String(lead.totalLeadScore);
    scoreCounts.set(scoreKey, (scoreCounts.get(scoreKey) ?? 0) + 1);

    const normFunnel = normalizeValue(lead.funnelStatus);
    if (normFunnel === 'nris') nrisCount++;
    if (normFunnel === 'rna') rnaCount++;

    const normStage = normalizeValue(lead.leadStage);

    // Leads who attended IS (ANS or Scanned) but have not progressed to MAT
    if (lead.isAttended && !lead.matBooked && normStage !== 'mat') {
      attendedNotProgressedCount++;
      if (normStage === 'is') attendedNotProgressedInIsCount++;
      if (normStage === 'not interested' || normStage === 'ni') attendedNotProgressedNiCount++;
    }

    // High-scoring leads (Total Score >= 4, or IS + High = 4) still in the IS stage
    if (typeof lead.totalLeadScore === 'number' && lead.totalLeadScore >= 4 && normStage === 'is') {
      highScoringStillInIsCount++;
    }

    if (lead.anomalies.length > 0) {
      anomalousLeadsCount++;
    }
    if (lead.totalLeadScore === 'Unscored') {
      unscoredLeadsCount++;
    }
    if (lead.matBooked && (normStage === 'not interested' || normStage === 'ni')) {
      contradictoryMatNotInterestedCount++;
    }

    if (lead.name) {
      const normName = normalizeValue(lead.name);
      nameCounts.set(normName, (nameCounts.get(normName) ?? 0) + 1);
    }
  }

  let largestCategoryName = 'None';
  let largestCategoryCount = 0;
  for (const [cat, count] of categoryCounts.entries()) {
    if (count > largestCategoryCount) {
      largestCategoryCount = count;
      largestCategoryName = cat;
    }
  }
  const largestCategoryPct = total > 0 ? (largestCategoryCount / total) * 100 : 0;

  // Build score distribution summary string
  const orderedScores = ['5', '4', '3', '2', '1', '0', 'Unscored'];
  const scoreParts: string[] = [];
  for (const s of orderedScores) {
    const c = scoreCounts.get(s) ?? 0;
    if (c > 0) {
      scoreParts.push(`Score ${s}: ${c}`);
    }
  }

  let duplicateNameRecordsCount = 0;
  for (const count of nameCounts.values()) {
    if (count > 1) {
      duplicateNameRecordsCount += count;
    }
  }

  return {
    isBookingRateText: `${isBookingRate.toFixed(1)}% (${isBookedCount} of ${total} leads)`,
    isAttendanceRateText: `${isAttendanceRate.toFixed(1)}% (${isAttendedCount} of ${isBookedCount} booked leads)`,
    matBookingRateText: `${matBookingRate.toFixed(1)}% (${matBookedCount} of ${total} leads)`,
    highPriorityCount,
    veryHighPriorityCount,
    highPriorityCombinedCount: veryHighPriorityCount + highPriorityCount,
    scoreDistributionSummary: scoreParts.length > 0 ? scoreParts.join(' · ') : 'No records',
    largestCategoryName,
    largestCategoryCount,
    largestCategoryPct,
    nrisCount,
    rnaCount,
    attendedNotProgressedCount,
    attendedNotProgressedInIsCount,
    attendedNotProgressedNiCount,
    highScoringStillInIsCount,
    anomalousLeadsCount,
    unscoredLeadsCount,
    contradictoryMatNotInterestedCount,
    duplicateNameRecordsCount
  };
}

