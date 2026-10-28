import React from 'react';
import {
  BarChart3,
  Upload,
  FileSpreadsheet,
  RotateCcw,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';

interface HeaderProps {
  datasetName: string;
  totalLoadedRecords: number;
  filteredRecordCount: number;
  anomalousCount: number;
  onUploadClick: () => void;
  onLoadReferenceDataset: () => void;
  isUsingReferenceData: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  datasetName,
  totalLoadedRecords,
  filteredRecordCount,
  anomalousCount,
  onUploadClick,
  onLoadReferenceDataset,
  isUsingReferenceData
}) => {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-navy-800 text-white flex items-center justify-center shadow-sm shrink-0">
              <BarChart3 className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-xl sm:text-2xl font-bold text-navy-900 tracking-tight">
                  Course Lead Analytics Dashboard
                </h1>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                  Executive Review
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
                Admissions funnel conversion, lead quality scoring rubric, and CRM record hygiene
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-700">
              <FileSpreadsheet className="w-4 h-4 text-blue-600 shrink-0" />
              <div>
                <span className="font-semibold text-navy-900">{datasetName}</span>
                <span className="mx-1.5 text-slate-300">|</span>
                <span>
                  Showing <strong className="text-navy-900">{filteredRecordCount}</strong> of{' '}
                  <strong>{totalLoadedRecords}</strong> records
                </span>
              </div>
              {anomalousCount > 0 ? (
                <span
                  title={`${anomalousCount} record(s) have missing, unsupported, or contradictory CRM fields`}
                  className="ml-1 inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-medium bg-amber-100 text-amber-800"
                >
                  <AlertTriangle className="w-3 h-3" />
                  {anomalousCount} flagged
                </span>
              ) : (
                <span className="ml-1 inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-medium bg-emerald-100 text-emerald-800">
                  <CheckCircle2 className="w-3 h-3" />
                  Verified
                </span>
              )}
            </div>

            {!isUsingReferenceData && (
              <button
                type="button"
                onClick={onLoadReferenceDataset}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Restore Reference Data
              </button>
            )}

            <button
              type="button"
              onClick={onUploadClick}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 shadow-sm transition-colors cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5" />
              Import CRM CSV / TSV
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

