import React from 'react';
import {
  Users,
  CalendarCheck,
  UserCheck,
  GraduationCap,
  Info
} from 'lucide-react';
import { KpiMetrics } from '../types/lead';

interface KpiCardsProps {
  metrics: KpiMetrics;
  totalDatasetCount: number;
}

export const KpiCards: React.FC<KpiCardsProps> = ({ metrics, totalDatasetCount }) => {
  return (
    <section aria-label="Primary Key Performance Indicators" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Card 1: No. of Leads */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
        <div className="absolute top-0 inset-x-0 h-1 bg-blue-600" />
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              No. of Leads
            </p>
            <p className="text-3xl font-bold text-navy-900 mt-2 tracking-tight">
              {metrics.totalLeads.toLocaleString()}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Users className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
          <span className="text-slate-500">Share of loaded dataset</span>
          <span className="font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md">
            {totalDatasetCount > 0
              ? `${((metrics.totalLeads / totalDatasetCount) * 100).toFixed(1)}%`
              : '0.0%'}
          </span>
        </div>
        <p className="text-[11px] text-slate-400 mt-2 flex items-center gap-1">
          <Info className="w-3 h-3 shrink-0" />
          Counts matching CRM records (no name deduplication)
        </p>
      </div>

      {/* Card 2: IS Booked */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
        <div className="absolute top-0 inset-x-0 h-1 bg-emerald-500" />
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              IS Booked
            </p>
            <p className="text-3xl font-bold text-navy-900 mt-2 tracking-tight">
              {metrics.isBookedCount.toLocaleString()}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <CalendarCheck className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
          <span className="text-slate-600 font-medium">IS Booking Rate</span>
          <span className="font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-2 py-0.5 rounded-md">
            {metrics.isBookingRate.toFixed(1)}%
          </span>
        </div>
        <p className="text-[11px] text-slate-400 mt-2 truncate" title={`Funnel (Reg/RNA/ANS/Scanned): ${metrics.isBookedPrimaryCount} | Fallback (IS Booked disp.): ${metrics.isBookedFallbackCount}`}>
          Primary Funnel: <strong className="text-slate-600">{metrics.isBookedPrimaryCount}</strong> · Sub Disp. Fallback: <strong className="text-slate-600">{metrics.isBookedFallbackCount}</strong>
        </p>
      </div>

      {/* Card 3: IS Attended */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
        <div className="absolute top-0 inset-x-0 h-1 bg-amber-500" />
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              IS Attended
            </p>
            <p className="text-3xl font-bold text-navy-900 mt-2 tracking-tight">
              {metrics.isAttendedCount.toLocaleString()}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <UserCheck className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
          <span className="text-slate-600 font-medium">IS Attendance Rate</span>
          <span className="font-bold text-amber-800 bg-amber-50 border border-amber-200/60 px-2 py-0.5 rounded-md">
            {metrics.isAttendanceRate.toFixed(1)}%
          </span>
        </div>
        <p className="text-[11px] text-slate-400 mt-2">
          IS Attended / IS Booked · Funnel = <strong className="text-slate-600">ANS</strong> or <strong className="text-slate-600">Scanned</strong>
        </p>
      </div>

      {/* Card 4: MAT Booked */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
        <div className="absolute top-0 inset-x-0 h-1 bg-purple-600" />
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              MAT Booked
            </p>
            <p className="text-3xl font-bold text-navy-900 mt-2 tracking-tight">
              {metrics.matBookedCount.toLocaleString()}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
            <GraduationCap className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
          <span className="text-slate-600 font-medium">MAT Booking Rate</span>
          <span className="font-bold text-purple-700 bg-purple-50 border border-purple-200/60 px-2 py-0.5 rounded-md">
            {metrics.matBookingRate.toFixed(1)}%
          </span>
        </div>
        <p className="text-[11px] text-slate-400 mt-2 truncate" title={`TS Funnel: ${metrics.matBookedPrimaryTsCount} | Sub Disp Only: ${metrics.matBookedSubDispCount} | Stage Fallback: ${metrics.matBookedStageFallbackCount}`}>
          TS Funnel: <strong className="text-slate-600">{metrics.matBookedPrimaryTsCount}</strong> · Sub-Disp: <strong className="text-slate-600">{metrics.matBookedSubDispCount}</strong> · Fallback: <strong className="text-slate-600">{metrics.matBookedStageFallbackCount}</strong>
        </p>
      </div>
    </section>
  );
};

