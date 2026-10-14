import React from 'react';
import {
  FileText,
  Download,
  Printer,
  Shield,
  Split,
  Briefcase,
} from 'lucide-react';
import { ActiveView, AuditSession } from '../types/audit';
import { PunjabLogo } from './PunjabLogo';

interface HeaderProps {
  currentSession: AuditSession | null;
  activeView: ActiveView;
  setActiveView: (view: ActiveView) => void;
  dualViewOpen: boolean;
  setDualViewOpen: (open: boolean) => void;
  onExportDocx: () => void;
  onPrintPdf: () => void;
  parasCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  currentSession,
  activeView,
  setActiveView,
  dualViewOpen,
  setDualViewOpen,
  onExportDocx,
  onPrintPdf,
  parasCount,
}) => {
  return (
    <header className="no-print bg-white border-b border-slate-200 text-slate-800 px-5 py-2.5 flex flex-wrap items-center justify-between gap-3 shadow-xs sticky top-0 z-40">
      {/* Left: Official Government of Punjab Logo & Session Info */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-3">
          <PunjabLogo size="md" />
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 font-sans">
                Government of the Punjab
              </span>
              <span className="bg-amber-100 text-amber-900 text-[10px] font-mono px-2 py-0.5 rounded border border-amber-300 font-bold">
                COMMERCIAL AUDIT WING
              </span>
            </div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-bold text-slate-900 flex items-center gap-1.5 truncate max-w-[320px] sm:max-w-[450px]">
                {currentSession ? (
                  <>
                    <span className="text-slate-900 font-bold">{currentSession.entityName}</span>
                    <span className="text-slate-500 text-xs font-mono">({currentSession.financialYear})</span>
                  </>
                ) : (
                  <span className="text-slate-500 font-normal italic">No Active Audit Session Selected</span>
                )}
              </h1>
            </div>
          </div>
        </div>
      </div>

      {/* Center: Security Classification Banner */}
      {currentSession && (
        <div className="hidden xl:flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-md px-3 py-1 text-xs text-slate-700">
          <Shield className="w-3.5 h-3.5 text-amber-700" />
          <span className="font-mono text-amber-800 font-bold text-[11px] tracking-wider">CONFIDENTIAL</span>
          <span className="text-slate-300">|</span>
          <span className="text-slate-500">Total Irregularity:</span>
          <span className="text-rose-700 font-bold font-mono">
            {currentSession.totalIrregularityAmount || 'Rs. 0/-'}
          </span>
          <span className="text-slate-300">|</span>
          <span className="text-emerald-800 font-semibold">{parasCount} Draft Paras</span>
        </div>
      )}

      {/* Right: View Switches & Actions */}
      <div className="flex items-center gap-2 ml-auto">
        {/* Toggle Workspace vs Word Editor */}
        <div className="bg-slate-100 p-0.5 rounded-lg border border-slate-200 flex items-center text-xs">
          <button
            onClick={() => setActiveView('workspace')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-semibold transition cursor-pointer ${
              activeView === 'workspace'
                ? 'bg-white text-emerald-800 shadow-xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
            title="Interactive Audit Analysis Workspace"
          >
            <Briefcase className="w-3.5 h-3.5 text-emerald-700" />
            <span className="hidden sm:inline">Audit Workspace</span>
          </button>
          <button
            onClick={() => setActiveView('word_editor')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-semibold transition cursor-pointer ${
              activeView === 'word_editor'
                ? 'bg-white text-blue-900 shadow-xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
            title="Commercial Audit Word Report Suite"
          >
            <FileText className="w-3.5 h-3.5 text-blue-700" />
            <span className="hidden sm:inline">Commercial Audit Word</span>
          </button>
        </div>

        {/* Dual Split View Toggle (when in workspace) */}
        {activeView === 'workspace' && currentSession && (
          <button
            onClick={() => setDualViewOpen(!dualViewOpen)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition cursor-pointer ${
              dualViewOpen
                ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
            }`}
            title="Toggle Split-Screen Document & PDF Viewer"
          >
            <Split className="w-3.5 h-3.5 text-emerald-700" />
            <span className="hidden md:inline">Dual View</span>
          </button>
        )}

        {/* Export to Word .docx */}
        {currentSession && (
          <button
            onClick={onExportDocx}
            className="flex items-center gap-1.5 bg-blue-800 hover:bg-blue-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg shadow-xs border border-blue-900 transition cursor-pointer"
            title="Export official Draft Audit Report to MS Word"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export .DOCX</span>
          </button>
        )}

        {/* Print / PDF */}
        {currentSession && (
          <button
            onClick={onPrintPdf}
            className="flex items-center gap-1.5 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-300 transition cursor-pointer"
            title="Print Official Government Audit Report"
          >
            <Printer className="w-3.5 h-3.5 text-slate-600" />
            <span className="hidden sm:inline">Print / PDF</span>
          </button>
        )}
      </div>
    </header>
  );
};
