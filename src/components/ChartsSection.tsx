import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  PieChart,
  Pie,
  Legend
} from 'recharts';
import {
  BarChart2,
  PieChart as PieChartIcon,
  Layers,
  Award,
  TrendingUp,
  MousePointerClick,
  X
} from 'lucide-react';
import { DrillDownSelection, ProcessedLead } from '../types/lead';
import { normalizeValue } from '../utils/scoring';

interface ChartsSectionProps {
  leads: ProcessedLead[];
  showPriorityBands: boolean;
  drillDown: DrillDownSelection | null;
  onToggleDrillDown: (selection: DrillDownSelection | null) => void;
}

const IS_FUNNEL_KEYS = [
  { key: 'nris', label: 'NRIS', fullDesc: 'Not Registered for Info Session', color: '#94a3b8' },
  { key: 'registered', label: 'Registered', fullDesc: 'Registered (Pending Attendance)', color: '#3b82f6' },
  { key: 'rna', label: 'RNA', fullDesc: 'Registered, No Attendance', color: '#f59e0b' },
  { key: 'ans', label: 'ANS', fullDesc: 'Attended, Not Scanned', color: '#10b981' },
  { key: 'scanned', label: 'Scanned', fullDesc: 'Attended & QR Scanned', color: '#059669' }
];

const CATEGORY_COLORS: Record<string, string> = {
  High: '#7c3aed',
  'Upper Medium': '#2563eb',
  Medium: '#0d9488',
  Unscored: '#94a3b8'
};

const STAGE_COLORS: Record<string, string> = {
  MAT: '#7c3aed',
  IS: '#2563eb',
  'Not Interested': '#64748b',
  NI: '#64748b'
};

export const ChartsSection: React.FC<ChartsSectionProps> = ({
  leads,
  showPriorityBands,
  drillDown,
  onToggleDrillDown
}) => {
  const totalLeads = leads.length;

  // 1. IS Funnel Breakdown (NRIS, Registered, RNA, ANS, Scanned)
  const isFunnelData = React.useMemo(() => {
    const counts: Record<string, number> = {
      nris: 0,
      registered: 0,
      rna: 0,
      ans: 0,
      scanned: 0
    };

    for (const l of leads) {
      const norm = normalizeValue(l.isFunnelSpecific || l.funnelStatus);
      if (norm in counts) {
        counts[norm]++;
      }
    }

    return IS_FUNNEL_KEYS.map((item) => ({
      name: item.label,
      fullDesc: item.fullDesc,
      count: counts[item.key],
      pct: totalLeads > 0 ? Number(((counts[item.key] / totalLeads) * 100).toFixed(1)) : 0,
      color: item.color,
      drillDown: {
        type: 'IS_FUNNEL' as const,
        value: item.label,
        label: `IS Funnel: ${item.label}`
      }
    }));
  }, [leads, totalLeads]);

  // 2. MAT Funnel Breakdown (actual MAT Funnel statuses including TS, plus MAT booking breakdown)
  const matFunnelData = React.useMemo(() => {
    const statusMap = new Map<string, { count: number; isMatStatus: boolean }>();
    const isKnownStatuses = new Set(['nris', 'registered', 'rna', 'ans', 'scanned']);

    for (const l of leads) {
      const rawStatus = (l.matFunnelSpecific || l.funnelStatus || '').trim();
      const norm = normalizeValue(rawStatus);

      if (l.matFunnelSpecific) {
        const key = rawStatus || '(Empty)';
        const prev = statusMap.get(key) ?? { count: 0, isMatStatus: true };
        statusMap.set(key, { count: prev.count + 1, isMatStatus: true });
      } else {
        if (rawStatus && !isKnownStatuses.has(norm)) {
          const prev = statusMap.get(rawStatus) ?? { count: 0, isMatStatus: true };
          statusMap.set(rawStatus, { count: prev.count + 1, isMatStatus: true });
        }
      }
    }

    const results: Array<{
      name: string;
      description: string;
      count: number;
      pct: number;
      color: string;
      drillDown: DrillDownSelection;
    }> = [];

    for (const [status, info] of statusMap.entries()) {
      results.push({
        name: status,
        description:
          normalizeValue(status) === 'ts'
            ? 'Test Scheduled (MAT Funnel Status)'
            : `MAT Funnel Status: ${status}`,
        count: info.count,
        pct: totalLeads > 0 ? Number(((info.count / totalLeads) * 100).toFixed(1)) : 0,
        color: '#7c3aed',
        drillDown: {
          type: 'MAT_FUNNEL_STATUS',
          value: status,
          label: `MAT Funnel Status: ${status}`
        }
      });
    }

    const matSubDispCount = leads.filter(
      (l) => normalizeValue(l.lastCallSubDisposition) === 'mat booked'
    ).length;
    const matStageCount = leads.filter((l) => normalizeValue(l.leadStage) === 'mat').length;
    const tsWithDnpCount = leads.filter(
      (l) =>
        normalizeValue(l.matFunnelSpecific || l.funnelStatus) === 'ts' &&
        normalizeValue(l.lastCallSubDisposition) !== 'mat booked'
    ).length;

    if (results.length > 0) {
      results.push({
        name: 'MAT Booked (Call Disp.)',
        description: 'Last Call Sub Disposition = MAT Booked',
        count: matSubDispCount,
        pct: totalLeads > 0 ? Number(((matSubDispCount / totalLeads) * 100).toFixed(1)) : 0,
        color: '#6366f1',
        drillDown: {
          type: 'MAT_SUB_DISP',
          value: 'MAT Booked (Call Disp.)',
          label: 'MAT Funnel: Call Disposition = MAT Booked'
        }
      });
      if (tsWithDnpCount > 0) {
        results.push({
          name: 'TS + Other Disp.',
          description: 'MAT Funnel = TS with non-MAT Booked Call Disposition (e.g. DNP)',
          count: tsWithDnpCount,
          pct: totalLeads > 0 ? Number(((tsWithDnpCount / totalLeads) * 100).toFixed(1)) : 0,
          color: '#a855f7',
          drillDown: {
            type: 'MAT_TS_OTHER_DISP',
            value: 'TS + Other Disp.',
            label: 'MAT Funnel: TS + Non-MAT Booked Call Disposition'
          }
        });
      }
      results.push({
        name: 'Active MAT Stage',
        description: 'Lead Stage = MAT',
        count: matStageCount,
        pct: totalLeads > 0 ? Number(((matStageCount / totalLeads) * 100).toFixed(1)) : 0,
        color: '#0d9488',
        drillDown: {
          type: 'MAT_STAGE',
          value: 'Active MAT Stage',
          label: 'MAT Funnel: Active MAT Lead Stage'
        }
      });
    }

    return results;
  }, [leads, totalLeads]);

  // 3. Lead Category Distribution
  const categoryData = React.useMemo(() => {
    const counts = new Map<string, number>();
    for (const l of leads) {
      const cat = l.leadCategory || 'Missing / Unscored';
      counts.set(cat, (counts.get(cat) ?? 0) + 1);
    }

    const order = ['High', 'Upper Medium', 'Medium'];
    return Array.from(counts.entries())
      .sort((a, b) => {
        const idxA = order.indexOf(a[0]);
        const idxB = order.indexOf(b[0]);
        if (idxA !== -1 && idxB !== -1) return idxA - idxB;
        if (idxA !== -1) return -1;
        if (idxB !== -1) return 1;
        return b[1] - a[1];
      })
      .map(([name, count]) => ({
        name,
        count,
        pct: totalLeads > 0 ? Number(((count / totalLeads) * 100).toFixed(1)) : 0,
        color: CATEGORY_COLORS[name] || '#64748b',
        drillDown: {
          type: 'CATEGORY' as const,
          value: name,
          label: `Lead Category: ${name}`
        }
      }));
  }, [leads, totalLeads]);

  // 4. Lead Score Distribution (by Total Score and Priority Band)
  const scoreData = React.useMemo(() => {
    const scoreDefs = [
      { scoreKey: '5', label: 'Score 5', band: 'Very High Priority', color: '#7c3aed' },
      { scoreKey: '4', label: 'Score 4', band: 'High Priority', color: '#2563eb' },
      { scoreKey: '3', label: 'Score 3', band: 'Medium Priority', color: '#10b981' },
      { scoreKey: '2', label: 'Score 2', band: 'Low Priority', color: '#f59e0b' },
      { scoreKey: '1', label: 'Score 1', band: 'Very Low Priority', color: '#64748b' },
      { scoreKey: '0', label: 'Score 0', band: 'Very Low Priority', color: '#94a3b8' },
      { scoreKey: 'Unscored', label: 'Unscored', band: 'Unscored (Invalid/Missing)', color: '#ef4444' }
    ];

    const counts: Record<string, number> = {};
    for (const l of leads) {
      const k = String(l.totalLeadScore);
      counts[k] = (counts[k] ?? 0) + 1;
    }

    return scoreDefs
      .map((d) => ({
        scoreKey: d.scoreKey,
        name: d.label,
        band: showPriorityBands ? d.band : d.label,
        displayLabel:
          showPriorityBands && d.scoreKey !== 'Unscored'
            ? `${d.label} (${d.band.replace(' Priority', '')})`
            : d.label,
        count: counts[d.scoreKey] ?? 0,
        pct: totalLeads > 0 ? Number((((counts[d.scoreKey] ?? 0) / totalLeads) * 100).toFixed(1)) : 0,
        color: d.color,
        drillDown: {
          type: 'SCORE' as const,
          value: d.scoreKey,
          label: `Total Lead Score: ${d.label}`
        }
      }))
      .filter(
        (item) =>
          item.count > 0 ||
          ['Score 5', 'Score 4', 'Score 3', 'Score 2', 'Score 1'].includes(item.name)
      );
  }, [leads, totalLeads, showPriorityBands]);

  // 5. Lead Stage Distribution
  const stageData = React.useMemo(() => {
    const counts = new Map<string, number>();
    for (const l of leads) {
      const st = l.leadStage || 'Missing';
      counts.set(st, (counts.get(st) ?? 0) + 1);
    }

    const order = ['MAT', 'IS', 'Not Interested', 'NI'];
    return Array.from(counts.entries())
      .sort((a, b) => {
        const idxA = order.indexOf(a[0]);
        const idxB = order.indexOf(b[0]);
        if (idxA !== -1 && idxB !== -1) return idxA - idxB;
        if (idxA !== -1) return -1;
        if (idxB !== -1) return 1;
        return b[1] - a[1];
      })
      .map(([name, count]) => {
        const displayName = name === 'v' ? `"v" (Unscored Anomaly)` : name;
        return {
          name: displayName,
          rawName: name,
          count,
          pct: totalLeads > 0 ? Number(((count / totalLeads) * 100).toFixed(1)) : 0,
          color: STAGE_COLORS[name] || '#ef4444',
          drillDown: {
            type: 'STAGE' as const,
            value: name,
            label: `Lead Stage: ${displayName}`
          }
        };
      });
  }, [leads, totalLeads]);

  const isMatchedDrillDown = (candidate: DrillDownSelection) =>
    drillDown?.type === candidate.type && drillDown?.value === candidate.value;

  if (totalLeads === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
        <p className="text-sm font-medium text-slate-600">
          No lead records match the current filters. Reset or broaden your filters to view funnel visualizations.
        </p>
      </div>
    );
  }

  return (
    <section aria-label="Funnel and Lead Quality Visualizations" className="space-y-4">
      {/* Interactive Drill-Down Hint / Active Banner */}
      <div className="bg-white rounded-xl border border-slate-200 px-4 py-2.5 shadow-sm flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-xs text-slate-600">
          <MousePointerClick className="w-4 h-4 text-blue-600 shrink-0" />
          <span>
            <strong className="text-navy-900">Interactive Drill-Down:</strong> Click any bar, pie slice, KPI card, or summary box below to filter the Lead Explorer table at the bottom.
          </span>
        </div>
        {drillDown && (
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-blue-50 text-blue-800 border border-blue-200">
              Drilled Down: <strong>{drillDown.label}</strong>
            </span>
            <button
              type="button"
              onClick={() => onToggleDrillDown(null)}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
              Clear Drill-Down
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Chart 1: IS Funnel Breakdown */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-sm flex flex-col">
          <div className="flex items-start justify-between gap-2 mb-4">
            <div>
              <div className="flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-bold text-navy-900">IS Funnel Breakdown</h3>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Click any status bar or box below to drill down the lead table
              </p>
            </div>
            <span className="text-[11px] font-semibold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md">
              {isFunnelData.reduce((acc, d) => acc + d.count, 0)} IS Funnel records
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={isFunnelData} margin={{ top: 10, right: 16, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis
                  dataKey="name"
                  tick={{ fill: '#334155', fontSize: 12, fontWeight: 500 }}
                  axisLine={{ stroke: '#cbd5e1' }}
                />
                <YAxis
                  tick={{ fill: '#64748b', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                />
                <Tooltip
                  cursor={{ fill: '#f8fafc' }}
                  content={({ active, payload }) => {
                    if (!active || !payload || !payload.length) return null;
                    const item = payload[0].payload;
                    return (
                      <div className="bg-navy-900 text-white text-xs rounded-lg p-3 shadow-lg border border-slate-700">
                        <p className="font-bold text-sm">{item.name}</p>
                        <p className="text-slate-300 text-[11px] mb-1.5">{item.fullDesc}</p>
                        <p className="font-semibold text-blue-300">
                          Count: {item.count} ({item.pct}% of filtered leads)
                        </p>
                        <p className="text-[10px] text-slate-400 mt-1">Click to drill down table</p>
                      </div>
                    );
                  }}
                />
                <Bar
                  dataKey="count"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={52}
                  cursor="pointer"
                  onClick={(data) => {
                    if (data && data.drillDown) {
                      onToggleDrillDown(data.drillDown);
                    }
                  }}
                >
                  {isFunnelData.map((entry, index) => {
                    const selected = isMatchedDrillDown(entry.drillDown);
                    const hasOtherSelection = drillDown?.type === 'IS_FUNNEL' && !selected;
                    return (
                      <Cell
                        key={`cell-is-${index}`}
                        fill={entry.color}
                        fillOpacity={hasOtherSelection ? 0.35 : 1}
                        stroke={selected ? '#0f172a' : 'none'}
                        strokeWidth={selected ? 2 : 0}
                      />
                    );
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-3 pt-3 border-t border-slate-100 grid grid-cols-5 gap-1.5 text-center">
            {isFunnelData.map((d) => {
              const selected = isMatchedDrillDown(d.drillDown);
              return (
                <button
                  key={d.name}
                  type="button"
                  onClick={() => onToggleDrillDown(d.drillDown)}
                  className={`rounded-lg p-1.5 border transition-all cursor-pointer text-center ${
                    selected
                      ? 'bg-blue-50 border-blue-500 ring-2 ring-blue-500/20'
                      : 'bg-slate-50 border-slate-100 hover:bg-slate-100 hover:border-slate-300'
                  }`}
                >
                  <p className="text-[11px] font-semibold text-slate-600">{d.name}</p>
                  <p className="text-xs font-bold text-navy-900">{d.count}</p>
                  <p className="text-[10px] text-slate-400">{d.pct}%</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Chart 2: MAT Funnel Breakdown */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-sm flex flex-col">
          <div className="flex items-start justify-between gap-2 mb-4">
            <div>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-purple-600" />
                <h3 className="text-sm font-bold text-navy-900">MAT Funnel Breakdown</h3>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Click any MAT signal bar or box below to drill down the lead table
              </p>
            </div>
            <span className="text-[11px] font-semibold bg-purple-50 text-purple-700 px-2 py-0.5 rounded-md border border-purple-200">
              TS Status Present
            </span>
          </div>

          {matFunnelData.length > 0 ? (
            <>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={matFunnelData}
                    layout="vertical"
                    margin={{ top: 5, right: 24, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                    <XAxis
                      type="number"
                      tick={{ fill: '#64748b', fontSize: 11 }}
                      allowDecimals={false}
                    />
                    <YAxis
                      type="category"
                      dataKey="name"
                      width={130}
                      tick={{ fill: '#334155', fontSize: 11, fontWeight: 500 }}
                    />
                    <Tooltip
                      cursor={{ fill: '#f8fafc' }}
                      content={({ active, payload }) => {
                        if (!active || !payload || !payload.length) return null;
                        const item = payload[0].payload;
                        return (
                          <div className="bg-navy-900 text-white text-xs rounded-lg p-3 shadow-lg border border-slate-700">
                            <p className="font-bold text-sm">{item.name}</p>
                            <p className="text-slate-300 text-[11px] mb-1.5">{item.description}</p>
                            <p className="font-semibold text-purple-300">
                              Count: {item.count} ({item.pct}% of filtered leads)
                            </p>
                            <p className="text-[10px] text-slate-400 mt-1">Click to drill down table</p>
                          </div>
                        );
                      }}
                    />
                    <Bar
                      dataKey="count"
                      radius={[0, 6, 6, 0]}
                      maxBarSize={36}
                      cursor="pointer"
                      onClick={(data) => {
                        if (data && data.drillDown) {
                          onToggleDrillDown(data.drillDown);
                        }
                      }}
                    >
                      {matFunnelData.map((entry, idx) => {
                        const selected = isMatchedDrillDown(entry.drillDown);
                        const isMatChartSelected =
                          drillDown &&
                          [
                            'MAT_FUNNEL_STATUS',
                            'MAT_SUB_DISP',
                            'MAT_TS_OTHER_DISP',
                            'MAT_STAGE'
                          ].includes(drillDown.type);
                        return (
                          <Cell
                            key={`mat-cell-${idx}`}
                            fill={entry.color}
                            fillOpacity={isMatChartSelected && !selected ? 0.35 : 1}
                            stroke={selected ? '#0f172a' : 'none'}
                            strokeWidth={selected ? 2 : 0}
                          />
                        );
                      })}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-3 pt-3 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                {matFunnelData.map((d) => {
                  const selected = isMatchedDrillDown(d.drillDown);
                  return (
                    <button
                      key={d.name}
                      type="button"
                      onClick={() => onToggleDrillDown(d.drillDown)}
                      className={`rounded-lg p-1.5 border transition-all cursor-pointer text-center ${
                        selected
                          ? 'bg-purple-50 border-purple-500 ring-2 ring-purple-500/20'
                          : 'bg-slate-50 border-slate-100 hover:bg-slate-100 hover:border-slate-300'
                      }`}
                    >
                      <p className="text-[11px] font-semibold text-slate-600 truncate" title={d.name}>
                        {d.name}
                      </p>
                      <p className="text-xs font-bold text-navy-900">{d.count}</p>
                      <p className="text-[10px] text-slate-400">{d.pct}% of total</p>
                    </button>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="h-64 flex items-center justify-center text-xs text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-200">
              No MAT Funnel status records (e.g., TS) present in the current filter selection.
            </div>
          )}
        </div>
      </div>

      {/* Bottom Row: 3 Charts (Lead Score Distribution, Lead Category Distribution, Lead Stage Distribution) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Chart 3: Lead Score Distribution */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-sm flex flex-col">
          <div className="mb-3">
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-purple-600" />
              <h3 className="text-sm font-bold text-navy-900">Lead Score &amp; Priority Distribution</h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Click any score bar or badge to filter the lead table
            </p>
          </div>

          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={scoreData} margin={{ top: 10, right: 10, left: -16, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis
                  dataKey="name"
                  tick={{ fill: '#334155', fontSize: 11, fontWeight: 500 }}
                />
                <YAxis
                  tick={{ fill: '#64748b', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                />
                <Tooltip
                  cursor={{ fill: '#f8fafc' }}
                  content={({ active, payload }) => {
                    if (!active || !payload || !payload.length) return null;
                    const item = payload[0].payload;
                    return (
                      <div className="bg-navy-900 text-white text-xs rounded-lg p-3 shadow-lg border border-slate-700">
                        <p className="font-bold text-sm">{item.name}</p>
                        {showPriorityBands && (
                          <p className="text-slate-300 text-[11px] mb-1">Band: {item.band}</p>
                        )}
                        <p className="font-semibold text-emerald-300">
                          {item.count} leads ({item.pct}%)
                        </p>
                        <p className="text-[10px] text-slate-400 mt-1">Click to drill down table</p>
                      </div>
                    );
                  }}
                />
                <Bar
                  dataKey="count"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={42}
                  cursor="pointer"
                  onClick={(data) => {
                    if (data && data.drillDown) {
                      onToggleDrillDown(data.drillDown);
                    }
                  }}
                >
                  {scoreData.map((entry, idx) => {
                    const selected = isMatchedDrillDown(entry.drillDown);
                    const hasOtherSelection = drillDown?.type === 'SCORE' && !selected;
                    return (
                      <Cell
                        key={`score-cell-${idx}`}
                        fill={entry.color}
                        fillOpacity={hasOtherSelection ? 0.35 : 1}
                        stroke={selected ? '#0f172a' : 'none'}
                        strokeWidth={selected ? 2 : 0}
                      />
                    );
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap gap-1.5">
            {scoreData.map((s) => {
              const selected = isMatchedDrillDown(s.drillDown);
              return (
                <button
                  key={s.name}
                  type="button"
                  onClick={() => onToggleDrillDown(s.drillDown)}
                  className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md border transition-all cursor-pointer ${
                    selected
                      ? 'bg-purple-50 border-purple-500 ring-2 ring-purple-500/20'
                      : 'bg-slate-50 border-slate-200 hover:bg-slate-100 hover:border-slate-300'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
                  <span className="font-medium text-slate-700">{s.name}:</span>
                  <strong className="text-navy-900">{s.count}</strong>
                </button>
              );
            })}
          </div>
        </div>

        {/* Chart 4: Lead Category Distribution */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-sm flex flex-col">
          <div className="mb-3">
            <div className="flex items-center gap-2">
              <PieChartIcon className="w-4 h-4 text-blue-600" />
              <h3 className="text-sm font-bold text-navy-900">Lead Category Distribution</h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Click any slice or category box to drill down the lead table
            </p>
          </div>

          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  dataKey="count"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={48}
                  outerRadius={78}
                  paddingAngle={3}
                  cursor="pointer"
                  onClick={(data) => {
                    if (data && data.drillDown) {
                      onToggleDrillDown(data.drillDown);
                    }
                  }}
                >
                  {categoryData.map((entry, idx) => {
                    const selected = isMatchedDrillDown(entry.drillDown);
                    const hasOtherSelection = drillDown?.type === 'CATEGORY' && !selected;
                    return (
                      <Cell
                        key={`cat-cell-${idx}`}
                        fill={entry.color}
                        fillOpacity={hasOtherSelection ? 0.35 : 1}
                        stroke={selected ? '#0f172a' : '#ffffff'}
                        strokeWidth={selected ? 2.5 : 1}
                      />
                    );
                  })}
                </Pie>
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload || !payload.length) return null;
                    const item = payload[0].payload;
                    return (
                      <div className="bg-navy-900 text-white text-xs rounded-lg p-2.5 shadow-lg">
                        <p className="font-bold">{item.name}</p>
                        <p className="text-blue-300">
                          {item.count} leads ({item.pct}%)
                        </p>
                        <p className="text-[10px] text-slate-400 mt-1">Click to drill down table</p>
                      </div>
                    );
                  }}
                />
                <Legend
                  verticalAlign="bottom"
                  height={28}
                  formatter={(value) => <span className="text-xs text-slate-700 font-medium">{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-3 pt-3 border-t border-slate-100 grid grid-cols-3 gap-2 text-center">
            {categoryData.map((c) => {
              const selected = isMatchedDrillDown(c.drillDown);
              return (
                <button
                  key={c.name}
                  type="button"
                  onClick={() => onToggleDrillDown(c.drillDown)}
                  className={`rounded-lg p-1.5 border transition-all cursor-pointer text-center ${
                    selected
                      ? 'bg-blue-50 border-blue-500 ring-2 ring-blue-500/20'
                      : 'bg-slate-50 border-slate-100 hover:bg-slate-100 hover:border-slate-300'
                  }`}
                >
                  <p className="text-[11px] font-semibold text-slate-600 truncate">{c.name}</p>
                  <p className="text-xs font-bold text-navy-900">
                    {c.count} <span className="text-[10px] font-normal text-slate-500">({c.pct}%)</span>
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Chart 5: Lead Stage Distribution */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-sm flex flex-col">
          <div className="mb-3">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-600" />
              <h3 className="text-sm font-bold text-navy-900">Lead Stage Distribution</h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Click any stage bar or box below to drill down the lead table
            </p>
          </div>

          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stageData} margin={{ top: 10, right: 12, left: -16, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis
                  dataKey="rawName"
                  tick={{ fill: '#334155', fontSize: 11, fontWeight: 500 }}
                />
                <YAxis
                  tick={{ fill: '#64748b', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                />
                <Tooltip
                  cursor={{ fill: '#f8fafc' }}
                  content={({ active, payload }) => {
                    if (!active || !payload || !payload.length) return null;
                    const item = payload[0].payload;
                    return (
                      <div className="bg-navy-900 text-white text-xs rounded-lg p-2.5 shadow-lg">
                        <p className="font-bold">{item.name}</p>
                        <p className="text-emerald-300">
                          {item.count} leads ({item.pct}%)
                        </p>
                        <p className="text-[10px] text-slate-400 mt-1">Click to drill down table</p>
                      </div>
                    );
                  }}
                />
                <Bar
                  dataKey="count"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={48}
                  cursor="pointer"
                  onClick={(data) => {
                    if (data && data.drillDown) {
                      onToggleDrillDown(data.drillDown);
                    }
                  }}
                >
                  {stageData.map((entry, idx) => {
                    const selected = isMatchedDrillDown(entry.drillDown);
                    const hasOtherSelection = drillDown?.type === 'STAGE' && !selected;
                    return (
                      <Cell
                        key={`stage-cell-${idx}`}
                        fill={entry.color}
                        fillOpacity={hasOtherSelection ? 0.35 : 1}
                        stroke={selected ? '#0f172a' : 'none'}
                        strokeWidth={selected ? 2 : 0}
                      />
                    );
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap gap-2">
            {stageData.map((st) => {
              const selected = isMatchedDrillDown(st.drillDown);
              return (
                <button
                  key={st.rawName}
                  type="button"
                  onClick={() => onToggleDrillDown(st.drillDown)}
                  className={`flex-1 min-w-[70px] rounded-lg p-1.5 border transition-all cursor-pointer text-center ${
                    selected
                      ? 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-500/20'
                      : 'bg-slate-50 border-slate-100 hover:bg-slate-100 hover:border-slate-300'
                  }`}
                >
                  <p className="text-[11px] font-semibold text-slate-600 truncate" title={st.name}>
                    {st.rawName}
                  </p>
                  <p className="text-xs font-bold text-navy-900">
                    {st.count} <span className="text-[10px] font-normal text-slate-500">({st.pct}%)</span>
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};
