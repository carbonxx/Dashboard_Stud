import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { ColumnMappingInfo, FilterState, ProcessedLead } from './types/lead';
import { parseDelimitedText, processLeadRows } from './utils/csvParser';
import { calculateKpiMetrics } from './utils/kpi';
import {
  filterLeads,
  generateLeadershipInsights,
  INITIAL_FILTER_STATE
} from './utils/filters';
import { Header } from './components/Header';
import { FilterToolbar } from './components/FilterToolbar';
import { KpiCards } from './components/KpiCards';
import { ChartsSection } from './components/ChartsSection';
import { ScoringAnalysis } from './components/ScoringAnalysis';
import { LeadershipInsights } from './components/LeadershipInsights';
import { LeadTable } from './components/LeadTable';
import { MethodologySection } from './components/MethodologySection';
import { CsvImportModal } from './components/CsvImportModal';
import { AlertCircle, Upload, LayoutDashboard, Award } from 'lucide-react';

export type DashboardTab = 'overview' | 'scoring-insights';

export function App() {
  const [activeTab, setActiveTab] = useState<DashboardTab>('overview');
  const [leads, setLeads] = useState<ProcessedLead[]>([]);
  const [mappingInfo, setMappingInfo] = useState<ColumnMappingInfo>({
    hasCourseColumn: false,
    hasSeparateIsMatColumns: false,
    mappedColumns: {},
    unmappedColumns: [],
    missingRequiredColumns: [],
    isValid: true
  });
  const [datasetName, setDatasetName] = useState<string>('data.tsv (Reference Dataset)');
  const [isUsingReferenceData, setIsUsingReferenceData] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [filters, setFilters] = useState<FilterState>(INITIAL_FILTER_STATE);
  const [showPriorityBands, setShowPriorityBands] = useState<boolean>(true);
  const [isImportModalOpen, setIsImportModalOpen] = useState<boolean>(false);

  const loadFromText = useCallback(
    (text: string, sourceName: string, isRef: boolean) => {
      const parsed = parseDelimitedText(text);
      if (!parsed.mapping.isValid) {
        return {
          success: false,
          errorMessages: [
            `Missing required CRM columns: ${parsed.mapping.missingRequiredColumns.join(', ')}`
          ],
          mapping: parsed.mapping
        };
      }

      if (parsed.rows.length === 0) {
        return {
          success: false,
          errorMessages: ['The uploaded file contains no data rows.'],
          mapping: parsed.mapping
        };
      }

      const processed = processLeadRows(parsed.rows, parsed.mapping);
      setLeads(processed);
      setMappingInfo(parsed.mapping);
      setDatasetName(sourceName);
      setIsUsingReferenceData(isRef);
      setFilters(INITIAL_FILTER_STATE);
      setLoadError(null);

      return {
        success: true,
        errorMessages: [],
        mapping: parsed.mapping
      };
    },
    []
  );

  const fetchReferenceDataset = useCallback(async () => {
    try {
      setLoading(true);
      setLoadError(null);
      const response = await fetch('/data.tsv');
      if (!response.ok) {
        throw new Error(`HTTP ${response.status} when fetching reference data.tsv`);
      }
      const text = await response.text();
      const res = loadFromText(text, 'data.tsv (Reference CRM Dataset)', true);
      if (!res.success) {
        setLoadError(res.errorMessages.join(' '));
      }
    } catch (err) {
      setLoadError(
        err instanceof Error
          ? err.message
          : 'Unable to automatically fetch reference dataset. Please import a CRM CSV/TSV file.'
      );
    } finally {
      setLoading(false);
    }
  }, [loadFromText]);

  useEffect(() => {
    fetchReferenceDataset();
  }, [fetchReferenceDataset]);

  const handleFilterChange = <K extends keyof FilterState>(
    key: K,
    value: FilterState[K]
  ) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value
    }));
  };

  const handleResetFilters = () => {
    setFilters(INITIAL_FILTER_STATE);
  };

  const handleQuickFilterScore = (scoreStr: string) => {
    setFilters((prev) => ({
      ...prev,
      totalLeadScore: prev.totalLeadScore === scoreStr ? 'ALL' : scoreStr
    }));
  };

  const filteredLeads = useMemo(() => {
    return filterLeads(leads, filters);
  }, [leads, filters]);

  const kpiMetrics = useMemo(() => {
    return calculateKpiMetrics(filteredLeads);
  }, [filteredLeads]);

  const insights = useMemo(() => {
    return generateLeadershipInsights(
      filteredLeads,
      kpiMetrics.isBookedCount,
      kpiMetrics.isAttendedCount,
      kpiMetrics.matBookedCount,
      kpiMetrics.isBookingRate,
      kpiMetrics.isAttendanceRate,
      kpiMetrics.matBookingRate
    );
  }, [filteredLeads, kpiMetrics]);

  const anomalousCount = useMemo(() => {
    return filteredLeads.filter((l) => l.anomalies.length > 0).length;
  }, [filteredLeads]);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <Header
        datasetName={datasetName}
        totalLoadedRecords={leads.length}
        filteredRecordCount={filteredLeads.length}
        anomalousCount={anomalousCount}
        onUploadClick={() => setIsImportModalOpen(true)}
        onLoadReferenceDataset={fetchReferenceDataset}
        isUsingReferenceData={isUsingReferenceData}
      />

      <main className="flex-1 max-w-[1440px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {loading ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3 shadow-sm">
            <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-sm font-semibold text-navy-900">
              Loading Course Lead Analytics Dashboard...
            </p>
          </div>
        ) : loadError && leads.length === 0 ? (
          <div className="bg-white rounded-2xl border border-rose-200 p-8 text-center space-y-4 shadow-sm">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-bold text-navy-900">No CRM Dataset Loaded</h2>
              <p className="text-xs text-slate-600 mt-1 max-w-md mx-auto">{loadError}</p>
            </div>
            <button
              type="button"
              onClick={() => setIsImportModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 cursor-pointer"
            >
              <Upload className="w-4 h-4" />
              Upload CRM CSV / TSV File
            </button>
          </div>
        ) : (
          <>
            {/* Navigation Tabs */}
            <div className="bg-white rounded-xl border border-slate-200 p-1.5 shadow-sm flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveTab('overview')}
                className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                  activeTab === 'overview'
                    ? 'bg-navy-900 text-white shadow-sm'
                    : 'text-slate-600 hover:text-navy-900 hover:bg-slate-100'
                }`}
              >
                <LayoutDashboard className="w-4 h-4" />
                Dashboard
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('scoring-insights')}
                className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                  activeTab === 'scoring-insights'
                    ? 'bg-navy-900 text-white shadow-sm'
                    : 'text-slate-600 hover:text-navy-900 hover:bg-slate-100'
                }`}
              >
                <Award className="w-4 h-4" />
                Glossary &amp; Insights
              </button>
            </div>

            {activeTab === 'overview' ? (
              <>
                {/* 1. Filter Toolbar */}
                <FilterToolbar
                  leads={leads}
                  filters={filters}
                  hasCourseColumn={mappingInfo.hasCourseColumn}
                  filteredCount={filteredLeads.length}
                  onChangeFilter={handleFilterChange}
                  onResetFilters={handleResetFilters}
                />

                {/* 2. Four Primary KPIs */}
                <KpiCards metrics={kpiMetrics} totalDatasetCount={leads.length} />

                {/* 3. Visualizations */}
                <ChartsSection
                  leads={filteredLeads}
                  showPriorityBands={showPriorityBands}
                />

                {/* 4. Detailed Lead Table */}
                <LeadTable
                  leads={filteredLeads}
                  hasCourseColumn={mappingInfo.hasCourseColumn}
                  showPriorityBands={showPriorityBands}
                  onResetFilters={handleResetFilters}
                />
              </>
            ) : (
              <>
                {/* Lead Scoring Analysis & Provisional Priority Bands */}
                <ScoringAnalysis
                  leads={filteredLeads}
                  showPriorityBands={showPriorityBands}
                  onTogglePriorityBands={() => setShowPriorityBands((p) => !p)}
                  onQuickFilterScore={handleQuickFilterScore}
                />

                {/* Executive Leadership Insights */}
                <LeadershipInsights
                  insights={insights}
                  totalLeads={filteredLeads.length}
                />

                {/* Methodology & Definitions Section */}
                <MethodologySection />
              </>
            )}
          </>
        )}
      </main>

      <footer className="bg-white border-t border-slate-200 mt-10 py-4">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
          <p className="font-medium text-navy-900">
            Course Lead Analytics Dashboard · Executive Admissions Review
          </p>
          <p>
            100% Client-Side Processing · Official Scoring Rubric & Precedence Verified
          </p>
        </div>
      </footer>

      <CsvImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImportText={(text, fileName) => loadFromText(text, fileName, false)}
      />
    </div>
  );
}

export default App;

