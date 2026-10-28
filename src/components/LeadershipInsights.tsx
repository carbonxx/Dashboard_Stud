import React from 'react';
import {
  Lightbulb,
  Target,
  UserCheck,
  GraduationCap,
  Award,
  BarChart,
  Layers,
  AlertOctagon,
  ArrowUpRight,
  Flame,
  ShieldAlert
} from 'lucide-react';
import { DynamicInsights } from '../utils/filters';

interface LeadershipInsightsProps {
  insights: DynamicInsights;
  totalLeads: number;
}

export const LeadershipInsights: React.FC<LeadershipInsightsProps> = ({
  insights,
  totalLeads
}) => {
  return (
    <section
      aria-label="Dynamic Leadership Insights"
      className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-sm space-y-4"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-amber-50 text-amber-600">
            <Lightbulb className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-navy-900">
              Executive Leadership Insights (Live Filtered Dataset)
            </h2>
            <p className="text-xs text-slate-500">
              Concise, dynamically calculated observations from the {totalLeads} currently matching CRM records
            </p>
          </div>
        </div>
        <span className="text-[11px] font-medium text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md self-start sm:self-auto">
          Strictly Data-Backed · Zero Fabricated Trends
        </span>
      </div>

      {totalLeads === 0 ? (
        <p className="text-xs text-slate-500 py-4 text-center">
          No active records match the selected filters to compute insights.
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* 1. IS Booking Rate */}
          <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-200/80 flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-600 mb-1.5">
              <span>1. IS Booking Rate</span>
              <Target className="w-3.5 h-3.5 text-emerald-600" />
            </div>
            <p className="text-sm font-bold text-navy-900">{insights.isBookingRateText}</p>
            <p className="text-[11px] text-slate-500 mt-1">
              Qualifies Registered, RNA, ANS, Scanned, or IS Booked disposition.
            </p>
          </div>

          {/* 2. IS Attendance Rate */}
          <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-200/80 flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-600 mb-1.5">
              <span>2. IS Attendance Rate</span>
              <UserCheck className="w-3.5 h-3.5 text-amber-600" />
            </div>
            <p className="text-sm font-bold text-navy-900">{insights.isAttendanceRateText}</p>
            <p className="text-[11px] text-slate-500 mt-1">
              Share of booked leads who attended Info Session (ANS or Scanned).
            </p>
          </div>

          {/* 3. MAT Booking Rate */}
          <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-200/80 flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-600 mb-1.5">
              <span>3. MAT Booking Rate</span>
              <GraduationCap className="w-3.5 h-3.5 text-purple-600" />
            </div>
            <p className="text-sm font-bold text-navy-900">{insights.matBookingRateText}</p>
            <p className="text-[11px] text-slate-500 mt-1">
              Leads with MAT Funnel = TS or Call Disposition = MAT Booked.
            </p>
          </div>

          {/* 4. Number of High-Priority Leads */}
          <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-200/80 flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-600 mb-1.5">
              <span>4. High-Priority Leads</span>
              <Award className="w-3.5 h-3.5 text-blue-600" />
            </div>
            <p className="text-sm font-bold text-navy-900">
              {insights.highPriorityCombinedCount} leads (Score 4–5)
            </p>
            <p className="text-[11px] text-slate-500 mt-1">
              Very High Priority (Score 5): <strong>{insights.veryHighPriorityCount}</strong> · High Priority (Score 4): <strong>{insights.highPriorityCount}</strong>.
            </p>
          </div>

          {/* 5. Distribution of Lead Scores */}
          <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-200/80 flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-600 mb-1.5">
              <span>5. Score Distribution</span>
              <BarChart className="w-3.5 h-3.5 text-indigo-600" />
            </div>
            <p className="text-xs font-bold text-navy-900 leading-snug">
              {insights.scoreDistributionSummary}
            </p>
            <p className="text-[11px] text-slate-500 mt-1">
              Calculated from official Stage + Category rubric.
            </p>
          </div>

          {/* 6. Largest Lead Category by Volume */}
          <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-200/80 flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-600 mb-1.5">
              <span>6. Largest Lead Category</span>
              <Layers className="w-3.5 h-3.5 text-teal-600" />
            </div>
            <p className="text-sm font-bold text-navy-900">
              {insights.largestCategoryName} ({insights.largestCategoryCount} leads)
            </p>
            <p className="text-[11px] text-slate-500 mt-1">
              Accounts for <strong>{insights.largestCategoryPct.toFixed(1)}%</strong> of the active filtered lead volume.
            </p>
          </div>

          {/* 7. Number of Leads in NRIS and RNA */}
          <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-200/80 flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-600 mb-1.5">
              <span>7. NRIS & RNA Drop-Off Pool</span>
              <AlertOctagon className="w-3.5 h-3.5 text-orange-600" />
            </div>
            <p className="text-sm font-bold text-navy-900">
              NRIS: {insights.nrisCount} · RNA: {insights.rnaCount}
            </p>
            <p className="text-[11px] text-slate-500 mt-1">
              Combined <strong>{insights.nrisCount + insights.rnaCount}</strong> leads either never registered (NRIS) or missed session (RNA).
            </p>
          </div>

          {/* 8. Leads Who Attended But Have Not Progressed */}
          <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-200/80 flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-600 mb-1.5">
              <span>8. Attended, Not Progressed</span>
              <ArrowUpRight className="w-3.5 h-3.5 text-blue-600" />
            </div>
            <p className="text-sm font-bold text-navy-900">
              {insights.attendedNotProgressedCount} leads (ANS / Scanned)
            </p>
            <p className="text-[11px] text-slate-500 mt-1">
              Still in IS stage: <strong>{insights.attendedNotProgressedInIsCount}</strong> · Marked Not Interested: <strong>{insights.attendedNotProgressedNiCount}</strong>.
            </p>
          </div>

          {/* 9. High-Scoring Leads Still in the IS Stage */}
          <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-200/80 flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-600 mb-1.5">
              <span>9. High-Scoring in IS Stage</span>
              <Flame className="w-3.5 h-3.5 text-rose-600" />
            </div>
            <p className="text-sm font-bold text-navy-900">
              {insights.highScoringStillInIsCount} leads (Score 4: IS + High)
            </p>
            <p className="text-[11px] text-slate-500 mt-1">
              Immediate conversion opportunity: High category leads remaining in IS stage.
            </p>
          </div>

          {/* 10. Leads with Missing or Inconsistent CRM Fields */}
          <div className="p-3.5 rounded-xl bg-amber-50/60 border border-amber-200/80 flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs font-semibold text-amber-900 mb-1.5">
              <span>10. CRM Hygiene & Anomalies</span>
              <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
            </div>
            <p className="text-sm font-bold text-amber-950">
              {insights.anomalousLeadsCount} flagged ({insights.unscoredLeadsCount} Unscored)
            </p>
            <p className="text-[11px] text-amber-800 mt-1">
              Includes {insights.unscoredLeadsCount} unsupported stage/category record and {insights.contradictoryMatNotInterestedCount} TS/MAT vs Not Interested conflicts.
            </p>
          </div>
        </div>
      )}
    </section>
  );
};

