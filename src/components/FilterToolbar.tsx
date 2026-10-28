import React from 'react';
import {
  Filter,
  RotateCcw,
  Search,
  Calendar,
  MapPin,
  Tag,
  Layers,
  PhoneCall,
  Award,
  SlidersHorizontal
} from 'lucide-react';
import { FilterState, ProcessedLead } from '../types/lead';
import { countActiveFilters } from '../utils/filters';

interface FilterToolbarProps {
  leads: ProcessedLead[];
  filters: FilterState;
  hasCourseColumn: boolean;
  filteredCount: number;
  onChangeFilter: <K extends keyof FilterState>(key: K, value: FilterState[K]) => void;
  onResetFilters: () => void;
}

function getUniqueOptions(leads: ProcessedLead[], getter: (l: ProcessedLead) => string | undefined): string[] {
  const set = new Set<string>();
  for (const l of leads) {
    const val = getter(l);
    set.add(val && val.trim() ? val.trim() : '(Empty)');
  }
  return Array.from(set).sort((a, b) => a.localeCompare(b));
}

export const FilterToolbar: React.FC<FilterToolbarProps> = ({
  leads,
  filters,
  hasCourseColumn,
  filteredCount,
  onChangeFilter,
  onResetFilters
}) => {
  const activeCount = countActiveFilters(filters);

  const courseOptions = React.useMemo(
    () => (hasCourseColumn ? getUniqueOptions(leads, (l) => l.course) : []),
    [leads, hasCourseColumn]
  );
  const categoryOptions = React.useMemo(() => getUniqueOptions(leads, (l) => l.leadCategory), [leads]);
  const cityOptions = React.useMemo(() => getUniqueOptions(leads, (l) => l.city), [leads]);
  const stageOptions = React.useMemo(() => getUniqueOptions(leads, (l) => l.leadStage), [leads]);
  const funnelOptions = React.useMemo(() => getUniqueOptions(leads, (l) => l.funnelStatus), [leads]);
  const subDispositionOptions = React.useMemo(
    () => getUniqueOptions(leads, (l) => l.lastCallSubDisposition),
    [leads]
  );

  const scoreOptions = ['5', '4', '3', '2', '1', '0', 'Unscored'];
  const priorityOptions = [
    'Very High Priority',
    'High Priority',
    'Medium Priority',
    'Low Priority',
    'Very Low Priority',
    'Unscored'
  ];

  return (
    <section
      aria-label="Filter Controls"
      className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-4 sm:p-5 space-y-4"
    >
      {/* Top Bar: Title, Search, Active Filter Status, Reset */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
            <Filter className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-navy-900">Funnel & Lead Quality Filters</h2>
              {activeCount > 0 && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-600 text-white">
                  {activeCount} active
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500">
              Showing <strong className="text-navy-900">{filteredCount}</strong> of{' '}
              <strong>{leads.length}</strong> CRM records across all KPIs, charts, and insights
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          <div className="relative flex-1 sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={filters.search}
              onChange={(e) => onChangeFilter('search', e.target.value)}
              placeholder="Search name, email, city, stage, disposition..."
              className="w-full pl-9 pr-8 py-1.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all"
            />
            {filters.search && (
              <button
                type="button"
                onClick={() => onChangeFilter('search', '')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
                title="Clear search"
              >
                ✕
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={onResetFilters}
            disabled={activeCount === 0}
            className={`inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
              activeCount > 0
                ? 'border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 cursor-pointer'
                : 'border-slate-200 bg-slate-50 text-slate-400 cursor-not-allowed'
            }`}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset Filters
          </button>
        </div>
      </div>

      {/* Primary Dropdown Filters Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3">
        {hasCourseColumn && courseOptions.length > 0 && (
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
              Course
            </label>
            <select
              value={filters.course}
              onChange={(e) => onChangeFilter('course', e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-slate-50/70 px-2.5 py-1.5 text-xs font-medium text-navy-900 focus:border-blue-500 focus:bg-white focus:outline-none"
            >
              <option value="ALL">All Courses ({courseOptions.length})</option>
              {courseOptions.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
            <Tag className="w-3 h-3 text-blue-600" />
            Lead Category
          </label>
          <select
            value={filters.leadCategory}
            onChange={(e) => onChangeFilter('leadCategory', e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-slate-50/70 px-2.5 py-1.5 text-xs font-medium text-navy-900 focus:border-blue-500 focus:bg-white focus:outline-none"
          >
            <option value="ALL">All Categories ({categoryOptions.length})</option>
            {categoryOptions.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
            <Layers className="w-3 h-3 text-indigo-600" />
            Lead Stage
          </label>
          <select
            value={filters.leadStage}
            onChange={(e) => onChangeFilter('leadStage', e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-slate-50/70 px-2.5 py-1.5 text-xs font-medium text-navy-900 focus:border-blue-500 focus:bg-white focus:outline-none"
          >
            <option value="ALL">All Lead Stages ({stageOptions.length})</option>
            {stageOptions.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
            <SlidersHorizontal className="w-3 h-3 text-emerald-600" />
            IS / MAT Funnel
          </label>
          <select
            value={filters.funnelStatus}
            onChange={(e) => onChangeFilter('funnelStatus', e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-slate-50/70 px-2.5 py-1.5 text-xs font-medium text-navy-900 focus:border-blue-500 focus:bg-white focus:outline-none"
          >
            <option value="ALL">All Funnel Statuses ({funnelOptions.length})</option>
            {funnelOptions.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
            <PhoneCall className="w-3 h-3 text-orange-600" />
            Call Sub Disposition
          </label>
          <select
            value={filters.lastCallSubDisposition}
            onChange={(e) => onChangeFilter('lastCallSubDisposition', e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-slate-50/70 px-2.5 py-1.5 text-xs font-medium text-navy-900 focus:border-blue-500 focus:bg-white focus:outline-none"
          >
            <option value="ALL">All Dispositions ({subDispositionOptions.length})</option>
            {subDispositionOptions.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
            <MapPin className="w-3 h-3 text-rose-500" />
            City
          </label>
          <select
            value={filters.city}
            onChange={(e) => onChangeFilter('city', e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-slate-50/70 px-2.5 py-1.5 text-xs font-medium text-navy-900 focus:border-blue-500 focus:bg-white focus:outline-none"
          >
            <option value="ALL">All Cities ({cityOptions.length})</option>
            {cityOptions.map((city) => (
              <option key={city} value={city}>
                {city}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
            <Award className="w-3 h-3 text-purple-600" />
            Total Lead Score
          </label>
          <select
            value={filters.totalLeadScore}
            onChange={(e) => onChangeFilter('totalLeadScore', e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-slate-50/70 px-2.5 py-1.5 text-xs font-medium text-navy-900 focus:border-blue-500 focus:bg-white focus:outline-none"
          >
            <option value="ALL">All Scores</option>
            {scoreOptions.map((sc) => (
              <option key={sc} value={sc}>
                {sc === 'Unscored' ? 'Unscored' : `Score ${sc}`}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
            <Award className="w-3 h-3 text-amber-600" />
            Lead Priority Band
          </label>
          <select
            value={filters.leadPriority}
            onChange={(e) => onChangeFilter('leadPriority', e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-slate-50/70 px-2.5 py-1.5 text-xs font-medium text-navy-900 focus:border-blue-500 focus:bg-white focus:outline-none"
          >
            <option value="ALL">All Priority Bands</option>
            {priorityOptions.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Date Range Filters Row */}
      <div className="pt-2 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 bg-slate-50/60 p-2.5 rounded-xl border border-slate-200/70">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 min-w-[130px]">
            <Calendar className="w-3.5 h-3.5 text-blue-600" />
            Created At Range:
          </div>
          <div className="flex items-center gap-2 flex-1">
            <input
              type="date"
              value={filters.createdAtStart}
              onChange={(e) => onChangeFilter('createdAtStart', e.target.value)}
              aria-label="Created At Start Date"
              className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs text-navy-900 focus:border-blue-500 focus:outline-none"
            />
            <span className="text-xs text-slate-400">to</span>
            <input
              type="date"
              value={filters.createdAtEnd}
              onChange={(e) => onChangeFilter('createdAtEnd', e.target.value)}
              aria-label="Created At End Date"
              className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs text-navy-900 focus:border-blue-500 focus:outline-none"
            />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-2 bg-slate-50/60 p-2.5 rounded-xl border border-slate-200/70">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 min-w-[130px]">
            <Calendar className="w-3.5 h-3.5 text-purple-600" />
            Updated At Range:
          </div>
          <div className="flex items-center gap-2 flex-1">
            <input
              type="date"
              value={filters.updatedAtStart}
              onChange={(e) => onChangeFilter('updatedAtStart', e.target.value)}
              aria-label="Updated At Start Date"
              className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs text-navy-900 focus:border-blue-500 focus:outline-none"
            />
            <span className="text-xs text-slate-400">to</span>
            <input
              type="date"
              value={filters.updatedAtEnd}
              onChange={(e) => onChangeFilter('updatedAtEnd', e.target.value)}
              aria-label="Updated At End Date"
              className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs text-navy-900 focus:border-blue-500 focus:outline-none"
            />
          </div>
        </div>
      </div>
    </section>
  );
};

