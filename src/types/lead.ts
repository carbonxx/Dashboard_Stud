export interface RawLeadRow {
  [key: string]: string | undefined;
}

export type ScoreValue = number | 'Unscored';

export type PriorityBand =
  | 'Very High Priority'
  | 'High Priority'
  | 'Medium Priority'
  | 'Low Priority'
  | 'Very Low Priority'
  | 'Unscored';

export interface ProcessedLead {
  id: string;
  rowNumber: number;
  // Original CRM fields preserved verbatim
  name: string;
  email: string;
  course?: string;
  createdAt: string;
  updatedAt: string;
  leadCategory: string;
  city: string;
  funnelStatus: string;
  isFunnelSpecific?: string;
  matFunnelSpecific?: string;
  lastCallSubDisposition: string;
  leadStage: string;

  // Parsed dates for filtering/sorting (null if invalid or missing)
  createdAtTimestamp: number | null;
  updatedAtTimestamp: number | null;
  createdAtDateOnly: string | null; // YYYY-MM-DD
  updatedAtDateOnly: string | null; // YYYY-MM-DD

  // Calculated scoring fields
  stageScore: ScoreValue;
  categoryScore: ScoreValue;
  totalLeadScore: ScoreValue;
  leadPriority: PriorityBand;

  // Qualification flags & audit reasons
  isBooked: boolean;
  isBookedSource: 'Funnel Status' | 'Sub Disposition Fallback' | null;
  isAttended: boolean;
  matBooked: boolean;
  matBookedSource: 'MAT Funnel (TS)' | 'Sub Disposition (MAT Booked)' | 'Lead Stage Fallback (MAT)' | null;

  // Data hygiene / anomaly detection
  anomalies: string[];
  hasMissingOrInvalidFields: boolean;
}

export interface KpiMetrics {
  totalLeads: number;
  isBookedCount: number;
  isBookedPrimaryCount: number;
  isBookedFallbackCount: number;
  isAttendedCount: number;
  matBookedCount: number;
  matBookedPrimaryTsCount: number;
  matBookedSubDispCount: number;
  matBookedStageFallbackCount: number;
  isBookingRate: number;
  isAttendanceRate: number;
  matBookingRate: number;
}

export interface FilterState {
  search: string;
  course: string;
  leadCategory: string;
  city: string;
  leadStage: string;
  funnelStatus: string;
  lastCallSubDisposition: string;
  createdAtStart: string;
  createdAtEnd: string;
  updatedAtStart: string;
  updatedAtEnd: string;
  totalLeadScore: string;
  leadPriority: string;
}

export interface ColumnMappingInfo {
  hasCourseColumn: boolean;
  hasSeparateIsMatColumns: boolean;
  mappedColumns: Record<string, string>;
  unmappedColumns: string[];
  missingRequiredColumns: string[];
  isValid: boolean;
}

export interface PriorityBandConfig {
  score: number | string;
  band: PriorityBand;
  description: string;
  colorClass: string;
}

export type DrillDownType =
  | 'KPI_IS_BOOKED'
  | 'KPI_IS_ATTENDED'
  | 'KPI_MAT_BOOKED'
  | 'IS_FUNNEL'
  | 'MAT_FUNNEL_STATUS'
  | 'MAT_SUB_DISP'
  | 'MAT_TS_OTHER_DISP'
  | 'MAT_STAGE'
  | 'SCORE'
  | 'CATEGORY'
  | 'STAGE';

export interface DrillDownSelection {
  type: DrillDownType;
  value: string;
  label: string;
}


