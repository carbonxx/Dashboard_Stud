import React from 'react';
import { Calculator, Sliders, ToggleLeft, ToggleRight, ShieldAlert } from 'lucide-react';
import { ProcessedLead } from '../types/lead';
import { DEFAULT_PRIORITY_BANDS, normalizeValue } from '../utils/scoring';

interface ScoringAnalysisProps {
  leads: ProcessedLead[];
  showPriorityBands: boolean;
  onTogglePriorityBands: () => void;
  onQuickFilterScore: (scoreStr: string) => void;
}

export const ScoringAnalysis: React.FC<ScoringAnalysisProps> = ({
  leads,
  showPriorityBands,
  onTogglePriorityBands,
  onQuickFilterScore
}) => {
  // Compute cross-tab matrix of Stage vs Category
  const matrix = React.useMemo(() => {
    const stages = [
      { label: 'MAT', key: 'mat', score: 2 },
      { label: 'IS', key: 'is', score: 1 },
      { label: 'NI / Not Interested', key: 'ni', score: 0 },
      { label: 'Unsupported / Missing', key: 'unscored', score: 'Unscored' as const }
    ];

    const categories = [
      { label: 'High (3)', key: 'high', score: 3 },
      { label: 'Upper Medium (2)', key: 'upper medium', score: 2 },
      { label: 'Medium (1)', key: 'medium', score: 1 },
      { label: 'Unsupported / Missing', key: 'unscored', score: 'Unscored' as const }
    ];

    const counts: Record<string, Record<string, number>> = {};
    for (const s of stages) {
      counts[s.key] = {};
      for (const c of categories) {
        counts[s.key][c.key] = 0;
      }
    }

    for (const lead of leads) {
      const normStage = normalizeValue(lead.leadStage);
      let sKey = 'unscored';
      if (normStage === 'mat') sKey = 'mat';
      else if (normStage === 'is') sKey = 'is';
      else if (normStage === 'ni' || normStage === 'not interested') sKey = 'ni';

      const normCat = normalizeValue(lead.leadCategory);
      let cKey = 'unscored';
      if (normCat === 'high') cKey = 'high';
      else if (normCat === 'upper medium') cKey = 'upper medium';
      else if (normCat === 'medium') cKey = 'medium';

      counts[sKey][cKey] = (counts[sKey][cKey] ?? 0) + 1;
    }

    return { stages, categories, counts };
  }, [leads]);

  const priorityCounts = React.useMemo(() => {
    const map: Record<string, number> = {};
    for (const l of leads) {
      map[l.leadPriority] = (map[l.leadPriority] ?? 0) + 1;
    }
    return map;
  }, [leads]);

  return (
    <section
      aria-label="Lead Scoring Rubric and Priority Matrix"
      className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-sm space-y-5"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div className="flex items-start gap-2.5">
          <div className="p-2 rounded-lg bg-purple-50 text-purple-600 mt-0.5">
            <Calculator className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-navy-900">
              Lead Scoring Matrix & Provisional Priority Classifications
            </h2>
            <p className="text-xs text-slate-500">
              Official Formula: <strong className="text-navy-900">Total Lead Score = Stage Score + Category Score</strong>. Missing or unsupported values are marked <strong className="text-rose-600">Unscored</strong>.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onTogglePriorityBands}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-medium text-slate-700 transition-colors self-start sm:self-auto cursor-pointer"
        >
          {showPriorityBands ? (
            <>
              <ToggleRight className="w-4 h-4 text-blue-600" />
              <span>Provisional Priority Bands: <strong>Enabled</strong></span>
            </>
          ) : (
            <>
              <ToggleLeft className="w-4 h-4 text-slate-400" />
              <span>Provisional Priority Bands: <strong>Hidden</strong></span>
            </>
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
        {/* Cross-tab Stage x Category Matrix */}
        <div className="xl:col-span-7 overflow-x-auto">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2.5">
            Stage Score × Category Score Cross-Tabulation (Live Filtered Counts)
          </h3>
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-600">
                <th className="py-2.5 px-3 font-semibold rounded-tl-lg">Lead Stage (Score)</th>
                <th className="py-2.5 px-3 font-semibold text-center">High (+3)</th>
                <th className="py-2.5 px-3 font-semibold text-center">Upper Medium (+2)</th>
                <th className="py-2.5 px-3 font-semibold text-center">Medium (+1)</th>
                <th className="py-2.5 px-3 font-semibold text-center rounded-tr-lg">Missing / Other</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {matrix.stages.map((st) => (
                <tr key={st.key} className="hover:bg-slate-50/80">
                  <td className="py-2.5 px-3 font-semibold text-navy-900">
                    {st.label}{' '}
                    <span className="text-slate-400 font-normal">
                      ({typeof st.score === 'number' ? `+${st.score}` : 'Unscored'})
                    </span>
                  </td>
                  {matrix.categories.map((cat) => {
                    const count = matrix.counts[st.key][cat.key] ?? 0;
                    const totalScore =
                      typeof st.score === 'number' && typeof cat.score === 'number'
                        ? String(st.score + cat.score)
                        : 'Unscored';

                    return (
                      <td key={cat.key} className="py-2.5 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => onQuickFilterScore(totalScore)}
                          title={`Click to filter by Total Score = ${totalScore}`}
                          className={`inline-flex flex-col items-center justify-center px-2.5 py-1 rounded-lg border text-xs transition-all cursor-pointer ${
                            count > 0
                              ? totalScore === 'Unscored'
                                ? 'bg-rose-50 border-rose-200 text-rose-800 hover:bg-rose-100'
                                : 'bg-slate-50 border-slate-200 text-navy-900 hover:border-blue-300 hover:bg-blue-50/50'
                              : 'bg-slate-50/40 border-transparent text-slate-400'
                          }`}
                        >
                          <span className="font-bold">{count} leads</span>
                          <span className="text-[10px] text-slate-500">
                            {totalScore === 'Unscored' ? 'Unscored' : `Score = ${totalScore}`}
                          </span>
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Provisional Priority Bands Reference */}
        <div className="xl:col-span-5 flex flex-col justify-between bg-slate-50/70 rounded-xl p-4 border border-slate-200/80">
          <div>
            <div className="flex items-center justify-between gap-2 mb-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-purple-600" />
                Proposed Dashboard Priority Bands
              </h3>
              <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-amber-100 text-amber-800">
                Provisional Classification
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mb-3">
              These bands are proposed analytical groupings derived from the official Total Lead Score (0–5) and are not official CRM fields.
            </p>

            {showPriorityBands ? (
              <div className="space-y-2">
                {DEFAULT_PRIORITY_BANDS.map((b) => {
                  const bandCount = priorityCounts[b.band] ?? 0;
                  return (
                    <div
                      key={b.band}
                      className="flex items-center justify-between bg-white px-3 py-2 rounded-lg border border-slate-200/80 text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold border ${b.colorClass}`}
                        >
                          Score {b.score}: {b.band}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-slate-500 hidden sm:inline">
                          {b.description}
                        </span>
                        <span className="font-bold text-navy-900 min-w-[48px] text-right">
                          {bandCount}
                        </span>
                      </div>
                    </div>
                  );
                })}
                {(priorityCounts['Unscored'] ?? 0) > 0 && (
                  <div className="flex items-center justify-between bg-rose-50/70 px-3 py-2 rounded-lg border border-rose-200 text-xs">
                    <span className="inline-flex items-center gap-1 font-semibold text-rose-800">
                      <ShieldAlert className="w-3.5 h-3.5" />
                      Unscored (Unsupported / Missing Component)
                    </span>
                    <span className="font-bold text-rose-900">
                      {priorityCounts['Unscored']}
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-4 text-center bg-white rounded-lg border border-dashed border-slate-200 text-xs text-slate-500">
                Provisional Priority Bands are currently hidden. Only official numeric Stage, Category, and Total Lead Scores are displayed.
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

