import Papa from 'papaparse';
import { ColumnMappingInfo, ProcessedLead, RawLeadRow } from '../types/lead';
import { evaluateIsAttended, evaluateIsBooked, evaluateMatBooked } from './kpi';
import {
  assignPriorityBand,
  calculateCategoryScore,
  calculateStageScore,
  calculateTotalLeadScore,
  normalizeValue
} from './scoring';

const COLUMN_ALIASES: Record<string, string[]> = {
  id: ['id', 'lead id', 'lead_id', 'record id'],
  name: ['name', 'lead name', 'full name', 'student name'],
  email: ['email', 'email address', 'e-mail'],
  course: ['course', 'program', 'course name', 'track'],
  createdAt: ['created at', 'created_at', 'createdat', 'created date', 'registration date'],
  updatedAt: ['updated at', 'updated_at', 'updatedat', 'modified at', 'last updated'],
  leadCategory: ['lead category', 'lead_category', 'category'],
  city: ['city', 'location', 'town'],
  funnelStatus: ['is / mat funnel', 'is/mat funnel', 'funnel', 'funnel status', 'is_mat_funnel'],
  isFunnelSpecific: ['is funnel', 'is_funnel', 'info session funnel'],
  matFunnelSpecific: ['mat funnel', 'mat_funnel'],
  lastCallSubDisposition: [
    'last call sub disposition',
    'last_call_sub_disposition',
    'sub disposition',
    'call sub disposition',
    'disposition'
  ],
  leadStage: ['lead stage', 'lead_stage', 'stage']
};

export function parseFlexibleDate(dateStr: string | undefined): {
  timestamp: number | null;
  dateOnly: string | null;
} {
  if (!dateStr || !dateStr.trim()) {
    return { timestamp: null, dateOnly: null };
  }

  const trimmed = dateStr.trim();
  // Try standard ISO / browser Date parsing (replacing space with T if YYYY-MM-DD HH:mm)
  const isoCandidate = trimmed.replace(/^(\d{4}-\d{2}-\d{2})\s+(\d{1,2}:\d{2}(?::\d{2})?)$/, (_, d, t) => {
    const paddedTime = t.length === 4 || t.indexOf(':') === 1 ? `0${t}` : t;
    return `${d}T${paddedTime}`;
  });

  const parsed = Date.parse(isoCandidate);
  if (!Number.isNaN(parsed)) {
    const d = new Date(parsed);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return {
      timestamp: parsed,
      dateOnly: `${yyyy}-${mm}-${dd}`
    };
  }

  const fallbackParsed = Date.parse(trimmed);
  if (!Number.isNaN(fallbackParsed)) {
    const d = new Date(fallbackParsed);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return {
      timestamp: fallbackParsed,
      dateOnly: `${yyyy}-${mm}-${dd}`
    };
  }

  return { timestamp: null, dateOnly: null };
}

export function detectColumnMapping(headers: string[]): ColumnMappingInfo {
  const mappedColumns: Record<string, string> = {};
  const usedHeaders = new Set<string>();

  const normHeaderMap = new Map<string, string>();
  headers.forEach((h) => {
    normHeaderMap.set(normalizeValue(h), h);
  });

  for (const [canonicalKey, aliases] of Object.entries(COLUMN_ALIASES)) {
    for (const alias of aliases) {
      const actualHeader = normHeaderMap.get(alias);
      if (actualHeader && !usedHeaders.has(actualHeader)) {
        mappedColumns[canonicalKey] = actualHeader;
        usedHeaders.add(actualHeader);
        break;
      }
    }
  }

  const unmappedColumns = headers.filter((h) => !usedHeaders.has(h));

  // Validate required columns
  const missingRequiredColumns: string[] = [];
  if (!mappedColumns.name && !mappedColumns.email) {
    missingRequiredColumns.push('Name or Email');
  }
  if (!mappedColumns.leadCategory) {
    missingRequiredColumns.push('Lead Category');
  }
  if (!mappedColumns.leadStage) {
    missingRequiredColumns.push('Lead Stage');
  }
  if (!mappedColumns.funnelStatus && !mappedColumns.isFunnelSpecific && !mappedColumns.matFunnelSpecific) {
    missingRequiredColumns.push('IS / MAT Funnel (or IS Funnel)');
  }

  return {
    hasCourseColumn: Boolean(mappedColumns.course),
    hasSeparateIsMatColumns: Boolean(mappedColumns.isFunnelSpecific || mappedColumns.matFunnelSpecific),
    mappedColumns,
    unmappedColumns,
    missingRequiredColumns,
    isValid: missingRequiredColumns.length === 0
  };
}

export function processLeadRows(
  rows: RawLeadRow[],
  mapping: ColumnMappingInfo,
  customThresholds?: { veryHigh: number; high: number; medium: number; low: number }
): ProcessedLead[] {
  const { mappedColumns } = mapping;

  return rows.map((row, idx) => {
    const rowNumber = idx + 1;
    const rawId = mappedColumns.id ? (row[mappedColumns.id] ?? '').trim() : '';
    const name = mappedColumns.name ? (row[mappedColumns.name] ?? '').trim() : '';
    const email = mappedColumns.email ? (row[mappedColumns.email] ?? '').trim() : '';
    const course = mappedColumns.course ? (row[mappedColumns.course] ?? '').trim() : undefined;
    const createdAt = mappedColumns.createdAt ? (row[mappedColumns.createdAt] ?? '').trim() : '';
    const updatedAt = mappedColumns.updatedAt ? (row[mappedColumns.updatedAt] ?? '').trim() : '';
    const leadCategory = mappedColumns.leadCategory ? (row[mappedColumns.leadCategory] ?? '').trim() : '';
    const city = mappedColumns.city ? (row[mappedColumns.city] ?? '').trim() : '';

    const isFunnelSpecific = mappedColumns.isFunnelSpecific
      ? (row[mappedColumns.isFunnelSpecific] ?? '').trim()
      : undefined;
    const matFunnelSpecific = mappedColumns.matFunnelSpecific
      ? (row[mappedColumns.matFunnelSpecific] ?? '').trim()
      : undefined;
    const funnelStatusRaw = mappedColumns.funnelStatus
      ? (row[mappedColumns.funnelStatus] ?? '').trim()
      : '';

    const funnelStatus =
      funnelStatusRaw ||
      [isFunnelSpecific, matFunnelSpecific].filter(Boolean).join(' / ') ||
      '';

    const lastCallSubDisposition = mappedColumns.lastCallSubDisposition
      ? (row[mappedColumns.lastCallSubDisposition] ?? '').trim()
      : '';
    const leadStage = mappedColumns.leadStage ? (row[mappedColumns.leadStage] ?? '').trim() : '';

    const parsedCreated = parseFlexibleDate(createdAt);
    const parsedUpdated = parseFlexibleDate(updatedAt);

    const stageScore = calculateStageScore(leadStage);
    const categoryScore = calculateCategoryScore(leadCategory);
    const totalLeadScore = calculateTotalLeadScore(stageScore, categoryScore);
    const leadPriority = assignPriorityBand(totalLeadScore, customThresholds);

    const isBookedEval = evaluateIsBooked(funnelStatus, isFunnelSpecific, lastCallSubDisposition);
    const isAttended = evaluateIsAttended(funnelStatus, isFunnelSpecific);
    const matBookedEval = evaluateMatBooked(
      funnelStatus,
      matFunnelSpecific,
      lastCallSubDisposition,
      leadStage
    );

    const anomalies: string[] = [];
    if (!name) anomalies.push('Missing Name');
    if (!email) anomalies.push('Missing Email');
    if (stageScore === 'Unscored') {
      anomalies.push(
        leadStage ? `Unsupported Lead Stage ("${leadStage}")` : 'Missing Lead Stage'
      );
    }
    if (categoryScore === 'Unscored') {
      anomalies.push(
        leadCategory ? `Unsupported Lead Category ("${leadCategory}")` : 'Missing Lead Category'
      );
    }
    if (!funnelStatus) {
      anomalies.push('Missing Funnel Status');
    }
    if (createdAt && parsedCreated.timestamp === null) {
      anomalies.push(`Invalid Created At date ("${createdAt}")`);
    }
    if (updatedAt && parsedUpdated.timestamp === null) {
      anomalies.push(`Invalid Updated At date ("${updatedAt}")`);
    }

    // Check CRM state contradictions (e.g., MAT Booked or TS funnel, but Lead Stage is Not Interested)
    const normStage = normalizeValue(leadStage);
    if (matBookedEval.qualified && (normStage === 'not interested' || normStage === 'ni')) {
      anomalies.push('Contradictory CRM state: MAT Booked / TS funnel with "Not Interested" stage');
    }

    return {
      id: rawId || `row-${rowNumber}`,
      rowNumber,
      name,
      email,
      course,
      createdAt,
      updatedAt,
      leadCategory,
      city,
      funnelStatus,
      isFunnelSpecific,
      matFunnelSpecific,
      lastCallSubDisposition,
      leadStage,
      createdAtTimestamp: parsedCreated.timestamp,
      updatedAtTimestamp: parsedUpdated.timestamp,
      createdAtDateOnly: parsedCreated.dateOnly,
      updatedAtDateOnly: parsedUpdated.dateOnly,
      stageScore,
      categoryScore,
      totalLeadScore,
      leadPriority,
      isBooked: isBookedEval.qualified,
      isBookedSource: isBookedEval.source,
      isAttended,
      matBooked: matBookedEval.qualified,
      matBookedSource: matBookedEval.source,
      anomalies,
      hasMissingOrInvalidFields: stageScore === 'Unscored' || categoryScore === 'Unscored' || !funnelStatus || !name || !email
    };
  });
}

export function parseDelimitedText(text: string): {
  rows: RawLeadRow[];
  headers: string[];
  mapping: ColumnMappingInfo;
  errors: string[];
} {
  const result = Papa.parse<RawLeadRow>(text.trim(), {
    header: true,
    skipEmptyLines: true
  });

  const headers = result.meta.fields ?? [];
  const mapping = detectColumnMapping(headers);
  const errors = result.errors.map((e) => `Row ${e.row !== undefined ? e.row + 2 : '?'}: ${e.message}`);

  return {
    rows: result.data,
    headers,
    mapping,
    errors
  };
}

