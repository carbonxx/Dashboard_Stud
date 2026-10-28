import React, { useState, useMemo } from 'react';
import Papa from 'papaparse';
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Download,
  Columns,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  SearchX,
  Info
} from 'lucide-react';
import { ProcessedLead } from '../types/lead';

interface LeadTableProps {
  leads: ProcessedLead[];
  hasCourseColumn: boolean;
  showPriorityBands: boolean;
  onResetFilters: () => void;
}

type SortField =
  | 'rowNumber'
  | 'name'
  | 'email'
  | 'course'
  | 'createdAt'
  | 'updatedAt'
  | 'leadCategory'
  | 'city'
  | 'funnelStatus'
  | 'lastCallSubDisposition'
  | 'leadStage'
  | 'stageScore'
  | 'categoryScore'
  | 'totalLeadScore'
  | 'leadPriority';

type SortDirection = 'asc' | 'desc';

function getCategoryBadgeClass(cat: string): string {
  const norm = cat.trim().toLowerCase();
  if (norm === 'high') return 'bg-purple-100 text-purple-800 border-purple-200';
  if (norm === 'upper medium') return 'bg-blue-100 text-blue-800 border-blue-200';
  if (norm === 'medium') return 'bg-teal-100 text-teal-800 border-teal-200';
  return 'bg-rose-100 text-rose-800 border-rose-200';
}

function getStageBadgeClass(stage: string): string {
  const norm = stage.trim().toLowerCase();
  if (norm === 'mat') return 'bg-purple-100 text-purple-800 border-purple-200';
  if (norm === 'is') return 'bg-blue-100 text-blue-800 border-blue-200';
  if (norm === 'not interested' || norm === 'ni') return 'bg-slate-100 text-slate-700 border-slate-200';
  return 'bg-rose-100 text-rose-800 border-rose-200';
}

function getPriorityBadgeClass(priority: string): string {
  switch (priority) {
    case 'Very High Priority':
      return 'bg-purple-100 text-purple-800 border-purple-200';
    case 'High Priority':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'Medium Priority':
      return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    case 'Low Priority':
      return 'bg-amber-100 text-amber-800 border-amber-200';
    case 'Very Low Priority':
      return 'bg-slate-100 text-slate-700 border-slate-200';
    default:
      return 'bg-rose-100 text-rose-800 border-rose-200';
  }
}

export const LeadTable: React.FC<LeadTableProps> = ({
  leads,
  hasCourseColumn,
  showPriorityBands,
  onResetFilters
}) => {
  const [sortField, setSortField] = useState<SortField>('totalLeadScore');
  const [sortDir, setSortDir] = useState<SortDirection>('desc');
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(20);
  const [showColumnMenu, setShowColumnMenu] = useState<boolean>(false);

  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>({
    name: true,
    email: true,
    course: true,
    createdAt: true,
    updatedAt: true,
    leadCategory: true,
    city: true,
    funnelStatus: true,
    lastCallSubDisposition: true,
    leadStage: true,
    stageScore: true,
    categoryScore: true,
    totalLeadScore: true,
    leadPriority: true
  });

  // Reset to page 1 when filtered leads change
  React.useEffect(() => {
    setPage(1);
  }, [leads.length]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('desc');
    }
  };

  const sortedLeads = useMemo(() => {
    const copy = [...leads];
    copy.sort((a, b) => {
      let cmp = 0;

      switch (sortField) {
        case 'rowNumber':
          cmp = a.rowNumber - b.rowNumber;
          break;
        case 'name':
          cmp = a.name.localeCompare(b.name);
          break;
        case 'email':
          cmp = a.email.localeCompare(b.email);
          break;
        case 'course':
          cmp = (a.course ?? '').localeCompare(b.course ?? '');
          break;
        case 'createdAt':
          cmp = (a.createdAtTimestamp ?? -1) - (b.createdAtTimestamp ?? -1);
          break;
        case 'updatedAt':
          cmp = (a.updatedAtTimestamp ?? -1) - (b.updatedAtTimestamp ?? -1);
          break;
        case 'leadCategory':
          cmp = a.leadCategory.localeCompare(b.leadCategory);
          break;
        case 'city':
          cmp = a.city.localeCompare(b.city);
          break;
        case 'funnelStatus':
          cmp = a.funnelStatus.localeCompare(b.funnelStatus);
          break;
        case 'lastCallSubDisposition':
          cmp = a.lastCallSubDisposition.localeCompare(b.lastCallSubDisposition);
          break;
        case 'leadStage':
          cmp = a.leadStage.localeCompare(b.leadStage);
          break;
        case 'stageScore': {
          const valA = typeof a.stageScore === 'number' ? a.stageScore : -1;
          const valB = typeof b.stageScore === 'number' ? b.stageScore : -1;
          cmp = valA - valB;
          break;
        }
        case 'categoryScore': {
          const valA = typeof a.categoryScore === 'number' ? a.categoryScore : -1;
          const valB = typeof b.categoryScore === 'number' ? b.categoryScore : -1;
          cmp = valA - valB;
          break;
        }
        case 'totalLeadScore':
        case 'leadPriority': {
          const valA = typeof a.totalLeadScore === 'number' ? a.totalLeadScore : -1;
          const valB = typeof b.totalLeadScore === 'number' ? b.totalLeadScore : -1;
          cmp = valA - valB;
          break;
        }
        default:
          cmp = 0;
      }

      return sortDir === 'asc' ? cmp : -cmp;
    });
    return copy;
  }, [leads, sortField, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sortedLeads.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const paginatedLeads = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return sortedLeads.slice(start, start + pageSize);
  }, [sortedLeads, safePage, pageSize]);

  const handleExportCsv = () => {
    const exportData = sortedLeads.map((l) => {
      const row: Record<string, string | number> = {
        Name: l.name,
        Email: l.email
      };
      if (hasCourseColumn) {
        row['Course'] = l.course ?? '';
      }
      row['Created At'] = l.createdAt;
      row['Updated At'] = l.updatedAt;
      row['Lead Category'] = l.leadCategory;
      row['City'] = l.city;
      row['IS / MAT Funnel'] = l.funnelStatus;
      row['Last Call Sub Disposition'] = l.lastCallSubDisposition;
      row['Lead Stage'] = l.leadStage;
      row['Stage Score'] = l.stageScore;
      row['Category Score'] = l.categoryScore;
      row['Total Lead Score'] = l.totalLeadScore;
      row['Lead Priority'] = l.leadPriority;
      return row;
    });

    const csv = Papa.unparse(exportData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.setAttribute('download', `course-leads-filtered-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 inline ml-1" />;
    }
    return sortDir === 'asc' ? (
      <ArrowUp className="w-3.5 h-3.5 text-blue-600 inline ml-1" />
    ) : (
      <ArrowDown className="w-3.5 h-3.5 text-blue-600 inline ml-1" />
    );
  };

  const toggleColumn = (key: string) => {
    setVisibleColumns((prev) => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  return (
    <section
      aria-label="Detailed CRM Lead Records Table"
      className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden"
    >
      {/* Table Header Bar */}
      <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold text-navy-900">
            Detailed Lead Records & Calculated Scores
          </h2>
          <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-blue-600 shrink-0" />
            <span>
              Original CRM fields are preserved verbatim. Source rows are not automatically deduplicated by name; KPIs count CRM records rather than verified unique individuals.
            </span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          {/* Column Visibility Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowColumnMenu((p) => !p)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-medium text-slate-700 transition-colors cursor-pointer"
            >
              <Columns className="w-3.5 h-3.5" />
              Columns
            </button>
            {showColumnMenu && (
              <div className="absolute right-0 mt-1.5 w-56 bg-white rounded-xl shadow-lg border border-slate-200 p-2.5 z-20 space-y-1">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 px-2 py-1">
                  Toggle Visible Columns
                </p>
                {[
                  { key: 'name', label: 'Name' },
                  { key: 'email', label: 'Email' },
                  ...(hasCourseColumn ? [{ key: 'course', label: 'Course' }] : []),
                  { key: 'createdAt', label: 'Created At' },
                  { key: 'updatedAt', label: 'Updated At' },
                  { key: 'leadCategory', label: 'Lead Category' },
                  { key: 'city', label: 'City' },
                  { key: 'funnelStatus', label: 'IS / MAT Funnel' },
                  { key: 'lastCallSubDisposition', label: 'Last Call Sub Disposition' },
                  { key: 'leadStage', label: 'Lead Stage' },
                  { key: 'stageScore', label: 'Stage Score' },
                  { key: 'categoryScore', label: 'Category Score' },
                  { key: 'totalLeadScore', label: 'Total Lead Score' },
                  { key: 'leadPriority', label: 'Lead Priority' }
                ].map((col) => (
                  <label
                    key={col.key}
                    className="flex items-center gap-2 px-2 py-1 rounded hover:bg-slate-50 text-xs text-slate-700 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={Boolean(visibleColumns[col.key])}
                      onChange={() => toggleColumn(col.key)}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    {col.label}
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Export Filtered CSV */}
          <button
            type="button"
            onClick={handleExportCsv}
            disabled={sortedLeads.length === 0}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-navy-800 hover:bg-navy-900 disabled:bg-slate-300 text-white text-xs font-semibold transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            Export Filtered CSV ({sortedLeads.length})
          </button>
        </div>
      </div>

      {/* Empty State */}
      {sortedLeads.length === 0 ? (
        <div className="p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <SearchX className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-navy-900">No Matching Lead Records</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            No CRM records matched your active search query or filter criteria. Try clearing one or more filters to restore visibility.
          </p>
          <button
            type="button"
            onClick={onResetFilters}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition-colors cursor-pointer"
          >
            Reset All Filters
          </button>
        </div>
      ) : (
        <>
          {/* Scrollable Data Table Container */}
          <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 sticky top-0 z-10 shadow-xs">
                <tr className="text-slate-600 font-semibold whitespace-nowrap">
                  <th
                    onClick={() => handleSort('rowNumber')}
                    className="py-3 px-3 cursor-pointer hover:bg-slate-100 transition-colors"
                  >
                    # {renderSortIcon('rowNumber')}
                  </th>
                  {visibleColumns.name && (
                    <th
                      onClick={() => handleSort('name')}
                      className="py-3 px-3.5 cursor-pointer hover:bg-slate-100 transition-colors"
                    >
                      Name {renderSortIcon('name')}
                    </th>
                  )}
                  {visibleColumns.email && (
                    <th
                      onClick={() => handleSort('email')}
                      className="py-3 px-3.5 cursor-pointer hover:bg-slate-100 transition-colors"
                    >
                      Email {renderSortIcon('email')}
                    </th>
                  )}
                  {hasCourseColumn && visibleColumns.course && (
                    <th
                      onClick={() => handleSort('course')}
                      className="py-3 px-3.5 cursor-pointer hover:bg-slate-100 transition-colors"
                    >
                      Course {renderSortIcon('course')}
                    </th>
                  )}
                  {visibleColumns.createdAt && (
                    <th
                      onClick={() => handleSort('createdAt')}
                      className="py-3 px-3.5 cursor-pointer hover:bg-slate-100 transition-colors"
                    >
                      Created At {renderSortIcon('createdAt')}
                    </th>
                  )}
                  {visibleColumns.updatedAt && (
                    <th
                      onClick={() => handleSort('updatedAt')}
                      className="py-3 px-3.5 cursor-pointer hover:bg-slate-100 transition-colors"
                    >
                      Updated At {renderSortIcon('updatedAt')}
                    </th>
                  )}
                  {visibleColumns.leadCategory && (
                    <th
                      onClick={() => handleSort('leadCategory')}
                      className="py-3 px-3.5 cursor-pointer hover:bg-slate-100 transition-colors"
                    >
                      Lead Category {renderSortIcon('leadCategory')}
                    </th>
                  )}
                  {visibleColumns.city && (
                    <th
                      onClick={() => handleSort('city')}
                      className="py-3 px-3.5 cursor-pointer hover:bg-slate-100 transition-colors"
                    >
                      City {renderSortIcon('city')}
                    </th>
                  )}
                  {visibleColumns.funnelStatus && (
                    <th
                      onClick={() => handleSort('funnelStatus')}
                      className="py-3 px-3.5 cursor-pointer hover:bg-slate-100 transition-colors"
                    >
                      IS / MAT Funnel {renderSortIcon('funnelStatus')}
                    </th>
                  )}
                  {visibleColumns.lastCallSubDisposition && (
                    <th
                      onClick={() => handleSort('lastCallSubDisposition')}
                      className="py-3 px-3.5 cursor-pointer hover:bg-slate-100 transition-colors"
                    >
                      Last Call Sub Disposition {renderSortIcon('lastCallSubDisposition')}
                    </th>
                  )}
                  {visibleColumns.leadStage && (
                    <th
                      onClick={() => handleSort('leadStage')}
                      className="py-3 px-3.5 cursor-pointer hover:bg-slate-100 transition-colors"
                    >
                      Lead Stage {renderSortIcon('leadStage')}
                    </th>
                  )}
                  {visibleColumns.stageScore && (
                    <th
                      onClick={() => handleSort('stageScore')}
                      className="py-3 px-3 text-center cursor-pointer hover:bg-slate-100 transition-colors"
                    >
                      Stage Score {renderSortIcon('stageScore')}
                    </th>
                  )}
                  {visibleColumns.categoryScore && (
                    <th
                      onClick={() => handleSort('categoryScore')}
                      className="py-3 px-3 text-center cursor-pointer hover:bg-slate-100 transition-colors"
                    >
                      Category Score {renderSortIcon('categoryScore')}
                    </th>
                  )}
                  {visibleColumns.totalLeadScore && (
                    <th
                      onClick={() => handleSort('totalLeadScore')}
                      className="py-3 px-3 text-center cursor-pointer hover:bg-slate-100 transition-colors"
                    >
                      Total Lead Score {renderSortIcon('totalLeadScore')}
                    </th>
                  )}
                  {showPriorityBands && visibleColumns.leadPriority && (
                    <th
                      onClick={() => handleSort('leadPriority')}
                      className="py-3 px-3.5 cursor-pointer hover:bg-slate-100 transition-colors"
                    >
                      Lead Priority {renderSortIcon('leadPriority')}
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedLeads.map((lead) => (
                  <tr
                    key={lead.id}
                    className={`hover:bg-blue-50/40 transition-colors ${
                      lead.totalLeadScore === 'Unscored' ? 'bg-rose-50/30' : ''
                    }`}
                  >
                    <td className="py-2.5 px-3 text-slate-400 font-mono text-[11px]">
                      {lead.rowNumber}
                    </td>

                    {visibleColumns.name && (
                      <td className="py-2.5 px-3.5 font-semibold text-navy-900 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span>{lead.name || <em className="text-slate-400 font-normal">Missing</em>}</span>
                          {lead.anomalies.length > 0 && (
                            <span
                              title={lead.anomalies.join(' | ')}
                              className="inline-flex items-center text-amber-600 cursor-help"
                            >
                              <AlertTriangle className="w-3.5 h-3.5" />
                            </span>
                          )}
                        </div>
                      </td>
                    )}

                    {visibleColumns.email && (
                      <td className="py-2.5 px-3.5 text-slate-600 whitespace-nowrap">
                        {lead.email || <em className="text-slate-400">Missing</em>}
                      </td>
                    )}

                    {hasCourseColumn && visibleColumns.course && (
                      <td className="py-2.5 px-3.5 text-slate-700 whitespace-nowrap">
                        {lead.course || <em className="text-slate-400">—</em>}
                      </td>
                    )}

                    {visibleColumns.createdAt && (
                      <td className="py-2.5 px-3.5 text-slate-600 whitespace-nowrap font-mono text-[11px]">
                        {lead.createdAt || <em className="text-slate-400">—</em>}
                      </td>
                    )}

                    {visibleColumns.updatedAt && (
                      <td className="py-2.5 px-3.5 text-slate-600 whitespace-nowrap font-mono text-[11px]">
                        {lead.updatedAt || <em className="text-slate-400">—</em>}
                      </td>
                    )}

                    {visibleColumns.leadCategory && (
                      <td className="py-2.5 px-3.5 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold border ${getCategoryBadgeClass(
                            lead.leadCategory
                          )}`}
                        >
                          {lead.leadCategory || 'Missing'}
                        </span>
                      </td>
                    )}

                    {visibleColumns.city && (
                      <td className="py-2.5 px-3.5 text-slate-700 whitespace-nowrap">
                        {lead.city || <em className="text-slate-400">—</em>}
                      </td>
                    )}

                    {visibleColumns.funnelStatus && (
                      <td className="py-2.5 px-3.5 whitespace-nowrap">
                        <span className="inline-flex items-center px-2 py-0.5 rounded bg-slate-100 text-slate-800 font-semibold text-[11px]">
                          {lead.funnelStatus || 'Missing'}
                        </span>
                      </td>
                    )}

                    {visibleColumns.lastCallSubDisposition && (
                      <td className="py-2.5 px-3.5 text-slate-700 whitespace-nowrap">
                        {lead.lastCallSubDisposition || <em className="text-slate-400">—</em>}
                      </td>
                    )}

                    {visibleColumns.leadStage && (
                      <td className="py-2.5 px-3.5 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold border ${getStageBadgeClass(
                            lead.leadStage
                          )}`}
                        >
                          {lead.leadStage || 'Missing'}
                        </span>
                      </td>
                    )}

                    {visibleColumns.stageScore && (
                      <td className="py-2.5 px-3 text-center whitespace-nowrap">
                        {lead.stageScore === 'Unscored' ? (
                          <span className="text-[11px] font-semibold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                            Unscored
                          </span>
                        ) : (
                          <span className="font-semibold text-slate-700">{lead.stageScore}</span>
                        )}
                      </td>
                    )}

                    {visibleColumns.categoryScore && (
                      <td className="py-2.5 px-3 text-center whitespace-nowrap">
                        {lead.categoryScore === 'Unscored' ? (
                          <span className="text-[11px] font-semibold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                            Unscored
                          </span>
                        ) : (
                          <span className="font-semibold text-slate-700">{lead.categoryScore}</span>
                        )}
                      </td>
                    )}

                    {visibleColumns.totalLeadScore && (
                      <td className="py-2.5 px-3 text-center whitespace-nowrap">
                        {lead.totalLeadScore === 'Unscored' ? (
                          <span className="text-[11px] font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded border border-rose-200">
                            Unscored
                          </span>
                        ) : (
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-navy-800 text-white font-bold text-xs">
                            {lead.totalLeadScore}
                          </span>
                        )}
                      </td>
                    )}

                    {showPriorityBands && visibleColumns.leadPriority && (
                      <td className="py-2.5 px-3.5 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${getPriorityBadgeClass(
                            lead.leadPriority
                          )}`}
                        >
                          {lead.leadPriority}
                        </span>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          <div className="p-4 border-t border-slate-200 bg-slate-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-600">
            <div className="flex items-center gap-3">
              <span>
                Showing{' '}
                <strong className="text-navy-900">
                  {(safePage - 1) * pageSize + 1}–{Math.min(safePage * pageSize, sortedLeads.length)}
                </strong>{' '}
                of <strong className="text-navy-900">{sortedLeads.length}</strong> records
              </span>
              <div className="flex items-center gap-1.5">
                <label htmlFor="pageSizeSelect" className="text-slate-500">
                  Rows per page:
                </label>
                <select
                  id="pageSizeSelect"
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setPage(1);
                  }}
                  className="rounded border border-slate-300 bg-white px-2 py-1 text-xs font-medium text-navy-900 focus:outline-none focus:border-blue-500"
                >
                  {[10, 20, 50, 100, 200].map((size) => (
                    <option key={size} value={size}>
                      {size}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={safePage <= 1}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded border border-slate-300 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed font-medium text-navy-900 cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                Prev
              </button>
              <span className="px-2.5 py-1 font-semibold text-navy-900">
                Page {safePage} of {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={safePage >= totalPages}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded border border-slate-300 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed font-medium text-navy-900 cursor-pointer"
              >
                Next
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </>
      )}
    </section>
  );
};

