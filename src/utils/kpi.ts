import { KpiMetrics, ProcessedLead } from '../types/lead';
import { normalizeValue } from './scoring';

const IS_BOOKED_FUNNEL_STATUSES = new Set(['registered', 'rna', 'ans', 'scanned']);
const IS_ATTENDED_FUNNEL_STATUSES = new Set(['ans', 'scanned']);

/**
 * Evaluates a single lead for IS Booked status.
 * Primary: IS Funnel status is Registered, RNA, ANS, or Scanned.
 * Fallback: Last Call Sub Disposition is 'IS Booked' when funnel status does not establish a booking.
 * Every qualifying record is counted strictly once.
 */
export function evaluateIsBooked(
  funnelStatus: string,
  isFunnelSpecific: string | undefined,
  lastCallSubDisposition: string
): { qualified: boolean; source: 'Funnel Status' | 'Sub Disposition Fallback' | null } {
  const effectiveIsFunnel = normalizeValue(isFunnelSpecific || funnelStatus);
  if (IS_BOOKED_FUNNEL_STATUSES.has(effectiveIsFunnel)) {
    return { qualified: true, source: 'Funnel Status' };
  }

  const normSubDisp = normalizeValue(lastCallSubDisposition);
  if (normSubDisp === 'is booked') {
    return { qualified: true, source: 'Sub Disposition Fallback' };
  }

  return { qualified: false, source: null };
}

/**
 * Evaluates a single lead for IS Attended status.
 * Counts leads whose IS Funnel status is ANS or Scanned.
 */
export function evaluateIsAttended(
  funnelStatus: string,
  isFunnelSpecific: string | undefined
): boolean {
  const effectiveIsFunnel = normalizeValue(isFunnelSpecific || funnelStatus);
  return IS_ATTENDED_FUNNEL_STATUSES.has(effectiveIsFunnel);
}

/**
 * Evaluates a single lead for MAT Booked status.
 * Precedence 1: MAT Funnel status is 'TS'
 * Precedence 2: Last Call Sub Disposition is 'MAT Booked'
 * Precedence 3 (Fallback): Lead Stage is 'MAT' ONLY when booking status (funnel & sub disposition) is missing/empty.
 * Overlapping signals are never double-counted.
 */
export function evaluateMatBooked(
  funnelStatus: string,
  matFunnelSpecific: string | undefined,
  lastCallSubDisposition: string,
  leadStage: string
): {
  qualified: boolean;
  source: 'MAT Funnel (TS)' | 'Sub Disposition (MAT Booked)' | 'Lead Stage Fallback (MAT)' | null;
} {
  const effectiveMatFunnel = normalizeValue(matFunnelSpecific || funnelStatus);
  const normSubDisp = normalizeValue(lastCallSubDisposition);
  const normStage = normalizeValue(leadStage);

  if (effectiveMatFunnel === 'ts') {
    return { qualified: true, source: 'MAT Funnel (TS)' };
  }

  if (normSubDisp === 'mat booked') {
    return { qualified: true, source: 'Sub Disposition (MAT Booked)' };
  }

  // Fallback only when booking status is missing
  const bookingStatusMissing = !effectiveMatFunnel && !normSubDisp;
  if (bookingStatusMissing && normStage === 'mat') {
    return { qualified: true, source: 'Lead Stage Fallback (MAT)' };
  }

  return { qualified: false, source: null };
}

/**
 * Calculates aggregate KPIs across a filtered list of leads.
 * Handles zero denominators safely.
 */
export function calculateKpiMetrics(leads: ProcessedLead[]): KpiMetrics {
  const totalLeads = leads.length;
  let isBookedCount = 0;
  let isBookedPrimaryCount = 0;
  let isBookedFallbackCount = 0;
  let isAttendedCount = 0;
  let matBookedCount = 0;
  let matBookedPrimaryTsCount = 0;
  let matBookedSubDispCount = 0;
  let matBookedStageFallbackCount = 0;

  for (const lead of leads) {
    if (lead.isBooked) {
      isBookedCount++;
      if (lead.isBookedSource === 'Funnel Status') {
        isBookedPrimaryCount++;
      } else if (lead.isBookedSource === 'Sub Disposition Fallback') {
        isBookedFallbackCount++;
      }
    }

    if (lead.isAttended) {
      isAttendedCount++;
    }

    if (lead.matBooked) {
      matBookedCount++;
      if (lead.matBookedSource === 'MAT Funnel (TS)') {
        matBookedPrimaryTsCount++;
      } else if (lead.matBookedSource === 'Sub Disposition (MAT Booked)') {
        matBookedSubDispCount++;
      } else if (lead.matBookedSource === 'Lead Stage Fallback (MAT)') {
        matBookedStageFallbackCount++;
      }
    }
  }

  const isBookingRate = totalLeads > 0 ? (isBookedCount / totalLeads) * 100 : 0;
  const isAttendanceRate = isBookedCount > 0 ? (isAttendedCount / isBookedCount) * 100 : 0;
  const matBookingRate = totalLeads > 0 ? (matBookedCount / totalLeads) * 100 : 0;

  return {
    totalLeads,
    isBookedCount,
    isBookedPrimaryCount,
    isBookedFallbackCount,
    isAttendedCount,
    matBookedCount,
    matBookedPrimaryTsCount,
    matBookedSubDispCount,
    matBookedStageFallbackCount,
    isBookingRate,
    isAttendanceRate,
    matBookingRate
  };
}

