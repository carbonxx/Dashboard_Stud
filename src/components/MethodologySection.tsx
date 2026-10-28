import React from 'react';
import { BookOpen, CheckCircle, HelpCircle, ShieldCheck } from 'lucide-react';

export const MethodologySection: React.FC = () => {
  return (
    <section
      aria-label="Methodology, Scoring Rubric, and CRM Definitions"
      className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-sm space-y-5"
    >
      <div className="flex items-start gap-2.5 pb-3 border-b border-slate-100">
        <div className="p-2 rounded-lg bg-navy-800 text-white mt-0.5">
          <BookOpen className="w-4 h-4 text-blue-300" />
        </div>
        <div>
          <h2 className="text-sm sm:text-base font-bold text-navy-900">
            Methodology, Precedence Logic & CRM Field Definitions
          </h2>
          <p className="text-xs text-slate-500">
            Source-of-truth definitions for KPI calculation precedence, lead scoring rules, and CRM funnel states
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 text-xs">
        {/* Column 1: Primary KPI Precedence & Deduplication Policy */}
        <div className="space-y-3 bg-slate-50/70 rounded-xl p-4 border border-slate-200/80">
          <h3 className="font-bold text-navy-900 flex items-center gap-1.5 text-xs uppercase tracking-wider">
            <CheckCircle className="w-4 h-4 text-emerald-600" />
            1. KPI Precedence & Fallback Logic
          </h3>
          <p className="text-slate-600 leading-relaxed">
            Every qualifying lead record is counted <strong>strictly once per KPI</strong>. Overlapping signals are never added together:
          </p>
          <ul className="space-y-2 text-slate-700">
            <li>
              <strong className="text-navy-900">No. of Leads:</strong> Total CRM records matching active filters. Rows are not deduplicated by name; KPIs count CRM records rather than verified unique individuals.
            </li>
            <li>
              <strong className="text-navy-900">IS Booked:</strong>
              <ol className="list-decimal list-inside pl-2 mt-0.5 text-[11px] text-slate-600 space-y-0.5">
                <li>
                  <strong>Primary:</strong> IS Funnel status is <code>Registered</code>, <code>RNA</code>, <code>ANS</code>, or <code>Scanned</code>.
                </li>
                <li>
                  <strong>Fallback:</strong> Last Call Sub Disposition is <code>IS Booked</code> when the funnel status does not establish a booking.
                </li>
              </ol>
            </li>
            <li>
              <strong className="text-navy-900">IS Attended:</strong> Counts leads whose IS Funnel status is <code>ANS</code> or <code>Scanned</code>.
            </li>
            <li>
              <strong className="text-navy-900">MAT Booked:</strong>
              <ol className="list-decimal list-inside pl-2 mt-0.5 text-[11px] text-slate-600 space-y-0.5">
                <li>
                  <strong>Precedence 1:</strong> MAT Funnel status is <code>TS</code>.
                </li>
                <li>
                  <strong>Precedence 2:</strong> Last Call Sub Disposition is <code>MAT Booked</code>.
                </li>
                <li>
                  <strong>Precedence 3 (Fallback):</strong> Lead Stage = <code>MAT</code> <em>only</em> when booking status (funnel & sub disposition) is missing.
                </li>
              </ol>
            </li>
          </ul>
          <div className="pt-2 border-t border-slate-200/80 text-[11px] text-slate-600 space-y-1">
            <p><strong>IS Booking Rate:</strong> IS Booked ÷ Total Leads × 100</p>
            <p><strong>IS Attendance Rate:</strong> IS Attended ÷ IS Booked × 100</p>
            <p><strong>MAT Booking Rate:</strong> MAT Booked ÷ Total Leads × 100</p>
          </div>
        </div>

        {/* Column 2: Official Scoring Rubric */}
        <div className="space-y-3 bg-slate-50/70 rounded-xl p-4 border border-slate-200/80">
          <h3 className="font-bold text-navy-900 flex items-center gap-1.5 text-xs uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4 text-purple-600" />
            2. Official Lead Scoring Rubric
          </h3>
          <p className="text-slate-600 leading-relaxed">
            <strong>Total Lead Score = Stage Score + Category Score</strong> (Range: 1 to 5 for valid combinations).
          </p>
          <div className="grid grid-cols-2 gap-2.5">
            <div className="bg-white p-2.5 rounded-lg border border-slate-200">
              <p className="font-bold text-navy-900 mb-1">Lead Stage Score</p>
              <ul className="space-y-1 text-slate-600 text-[11px]">
                <li className="flex justify-between"><span>MAT</span><strong className="text-navy-900">2</strong></li>
                <li className="flex justify-between"><span>IS</span><strong className="text-navy-900">1</strong></li>
                <li className="flex justify-between"><span>NI / Not Interested</span><strong className="text-navy-900">0</strong></li>
              </ul>
            </div>
            <div className="bg-white p-2.5 rounded-lg border border-slate-200">
              <p className="font-bold text-navy-900 mb-1">Lead Category Score</p>
              <ul className="space-y-1 text-slate-600 text-[11px]">
                <li className="flex justify-between"><span>High</span><strong className="text-navy-900">3</strong></li>
                <li className="flex justify-between"><span>Upper Medium</span><strong className="text-navy-900">2</strong></li>
                <li className="flex justify-between"><span>Medium</span><strong className="text-navy-900">1</strong></li>
              </ul>
            </div>
          </div>
          <div className="bg-amber-50/80 border border-amber-200 rounded-lg p-2.5 text-[11px] text-amber-900 space-y-1">
            <p className="font-bold">Unscored & Missing Value Policy:</p>
            <p>
              Case and whitespace are normalized during matching while preserving original CRM text. Missing or unsupported values (such as Lead Stage = <code>"v"</code>) are strictly marked <strong>Unscored</strong> rather than silently assigned zero. If either component is Unscored, Total Lead Score is marked <strong>Unscored</strong>.
            </p>
          </div>
        </div>

        {/* Column 3: CRM Field Definitions */}
        <div className="space-y-3 bg-slate-50/70 rounded-xl p-4 border border-slate-200/80">
          <h3 className="font-bold text-navy-900 flex items-center gap-1.5 text-xs uppercase tracking-wider">
            <HelpCircle className="w-4 h-4 text-blue-600" />
            3. CRM Field & Status Glossary
          </h3>
          <div className="space-y-2 text-slate-700 text-[11px]">
            <div>
              <p className="font-bold text-navy-900">IS Funnel Statuses (Info Session):</p>
              <ul className="list-disc list-inside pl-1 mt-0.5 space-y-0.5 text-slate-600">
                <li><strong>NRIS:</strong> Not Registered for Info Session (not booked).</li>
                <li><strong>Registered:</strong> Registered for Info Session (booked, attendance pending).</li>
                <li><strong>RNA:</strong> Registered, No Attendance (booked, did not attend).</li>
                <li><strong>ANS:</strong> Attended, Not Scanned (booked & attended IS).</li>
                <li><strong>Scanned:</strong> Attended & QR Scanned (booked & attended IS).</li>
              </ul>
            </div>
            <div>
              <p className="font-bold text-navy-900">MAT Funnel Statuses (Admissions Test):</p>
              <ul className="list-disc list-inside pl-1 mt-0.5 space-y-0.5 text-slate-600">
                <li><strong>TS:</strong> Test Scheduled / MAT Booked in the funnel.</li>
              </ul>
            </div>
            <div>
              <p className="font-bold text-navy-900">Last Call Sub Dispositions:</p>
              <ul className="list-disc list-inside pl-1 mt-0.5 space-y-0.5 text-slate-600">
                <li><strong>IS Booked / MAT Booked:</strong> Explicit call outcome confirming booking.</li>
                <li><strong>Callback:</strong> Lead requested follow-up call.</li>
                <li><strong>DNP / Switched Off:</strong> Did Not Pick / Phone Switched Off.</li>
                <li><strong>Not Interested:</strong> Lead declined further progression on call.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

