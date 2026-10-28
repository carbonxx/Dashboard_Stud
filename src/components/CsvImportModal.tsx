import React, { useState, useRef } from 'react';
import {
  Upload,
  X,
  FileSpreadsheet,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import { ColumnMappingInfo } from '../types/lead';

interface CsvImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportText: (text: string, fileName: string) => {
    success: boolean;
    errorMessages: string[];
    mapping?: ColumnMappingInfo;
  };
}

export const CsvImportModal: React.FC<CsvImportModalProps> = ({
  isOpen,
  onClose,
  onImportText
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [errorList, setErrorList] = useState<string[]>([]);
  const [mappingPreview, setMappingPreview] = useState<ColumnMappingInfo | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const handleFile = (file: File) => {
    setErrorList([]);
    setMappingPreview(null);
    setSuccessMsg(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result;
      if (typeof content !== 'string') {
        setErrorList(['Could not read file text content.']);
        return;
      }

      const result = onImportText(content, file.name);
      if (result.mapping) {
        setMappingPreview(result.mapping);
      }

      if (!result.success) {
        setErrorList(result.errorMessages);
      } else {
        setSuccessMsg(`Successfully loaded and validated "${file.name}".`);
        setTimeout(() => {
          onClose();
          setSuccessMsg(null);
          setMappingPreview(null);
        }, 900);
      }
    };
    reader.onerror = () => {
      setErrorList(['Failed to read file from disk.']);
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-900/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-lg w-full overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-blue-600" />
            <h2 className="text-base font-bold text-navy-900">
              Import CRM Lead Dataset (CSV / TSV)
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <p className="text-xs text-slate-600 leading-relaxed">
            Upload a CRM export file (`.csv` or `.tsv`). All parsing, column validation, KPI calculations, and scoring occur <strong>100% client-side</strong> in your browser—no lead data is sent to external servers.
          </p>

          <div
            onDragOver={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setDragActive(true);
            }}
            onDragLeave={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setDragActive(false);
            }}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
              dragActive
                ? 'border-blue-500 bg-blue-50/60'
                : 'border-slate-300 bg-slate-50/70 hover:bg-slate-100/70 hover:border-slate-400'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.tsv,.txt"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleFile(e.target.files[0]);
                }
              }}
              className="hidden"
            />
            <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mx-auto mb-3">
              <Upload className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-navy-900">
              Click to select a file or drag and drop here
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Supports standard CRM CSV or Tab-Separated (TSV) files
            </p>
          </div>

          <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200 text-xs space-y-1.5">
            <p className="font-semibold text-navy-900">Supported CRM Column Variations:</p>
            <p className="text-slate-600 text-[11px]">
              <code>Name</code>, <code>Email</code>, <code>Course</code> (optional), <code>Created At</code>, <code>Updated At</code>, <code>Lead Category</code>, <code>City</code>, <code>IS / MAT Funnel</code> (or separate <code>IS Funnel</code> / <code>MAT Funnel</code>), <code>Last Call Sub Disposition</code>, and <code>Lead Stage</code>.
            </p>
          </div>

          {errorList.length > 0 && (
            <div className="rounded-xl bg-rose-50 border border-rose-200 p-3.5 text-xs text-rose-800 space-y-1.5">
              <div className="flex items-center gap-1.5 font-bold text-rose-900">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>Validation Error</span>
              </div>
              <ul className="list-disc list-inside space-y-0.5 pl-1">
                {errorList.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </div>
          )}

          {successMsg && (
            <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3.5 text-xs text-emerald-900 flex items-center gap-2 font-semibold">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {mappingPreview && !mappingPreview.isValid && (
            <div className="text-[11px] text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-200">
              <p className="font-semibold text-navy-900 mb-1">Detected Columns:</p>
              <p>
                Mapped: {Object.values(mappingPreview.mappedColumns).join(', ') || 'None'}
              </p>
            </div>
          )}
        </div>

        <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg border border-slate-300 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

