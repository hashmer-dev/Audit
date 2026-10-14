import React from 'react';
import {
  FileText,
  PlusCircle,
  Database,
  BookOpen,
  Briefcase,
  Paperclip,
  FileSpreadsheet,
  CheckCircle2,
  FolderOpen,
} from 'lucide-react';
import { ActiveView, AuditSession, DocumentFile } from '../types/audit';
import { PunjabLogo } from './PunjabLogo';

interface SidebarProps {
  currentSession: AuditSession | null;
  activeView: ActiveView;
  setActiveView: (view: ActiveView) => void;
  onOpenNewSession: () => void;
  onOpenVault: () => void;
  onSelectDocument: (doc: DocumentFile) => void;
  selectedDocId?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentSession,
  activeView,
  setActiveView,
  onOpenNewSession,
  onOpenVault,
  onSelectDocument,
  selectedDocId,
}) => {
  return (
    <aside className="no-print w-64 md:w-72 bg-slate-50 border-r border-slate-200 flex flex-col shrink-0 text-slate-700 h-screen select-none">
      {/* Top Header Branding with Official Punjab Government Logo */}
      <div className="p-4 border-b border-slate-200 bg-white">
        <div className="flex items-center gap-3">
          <PunjabLogo size="lg" />
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-display font-extrabold text-base tracking-wide text-slate-900">
                CAP-AI
              </span>
              <span className="text-[10px] bg-emerald-100 text-emerald-800 font-mono px-1.5 py-0.2 rounded font-bold border border-emerald-300">
                PAKISTAN
              </span>
            </div>
            <p className="text-[11px] text-emerald-900 font-bold leading-tight">
              Government of Pakistan
            </p>
            <p className="text-[10px] text-slate-500 font-medium leading-tight">
              Commercial Audit Directorate
            </p>
          </div>
        </div>

        {/* Start New Audit Session Button */}
        <button
          onClick={onOpenNewSession}
          className="mt-3.5 w-full flex items-center justify-center gap-2 bg-emerald-800 hover:bg-emerald-700 text-white font-semibold text-xs py-2 px-3 rounded-lg shadow-xs transition cursor-pointer"
        >
          <PlusCircle className="w-4 h-4" />
          <span>New Audit Session</span>
        </button>
      </div>

      {/* Main Navigation Links */}
      <div className="p-3 space-y-1">
        <button
          onClick={() => setActiveView('workspace')}
          className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition cursor-pointer ${
            activeView === 'workspace'
              ? 'bg-white text-emerald-800 border border-slate-300 shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <Briefcase className="w-4 h-4 text-emerald-700" />
            <span>Audit Workspace</span>
          </div>
          {currentSession && (
            <span className="bg-emerald-50 text-emerald-800 text-[10px] font-mono px-1.5 py-0.5 rounded border border-emerald-200 font-bold">
              {currentSession.paras.length} Paras
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveView('word_editor')}
          className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition cursor-pointer ${
            activeView === 'word_editor'
              ? 'bg-white text-blue-900 border border-slate-300 shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <FileText className="w-4 h-4 text-blue-700" />
            <span>Commercial Audit Word</span>
          </div>
          <span className="text-[10px] bg-blue-50 text-blue-800 px-1.5 py-0.5 rounded font-mono border border-blue-200">
            Editor
          </span>
        </button>

        <button
          onClick={onOpenVault}
          className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition cursor-pointer"
        >
          <div className="flex items-center gap-2.5">
            <Database className="w-4 h-4 text-amber-700" />
            <span>Audit Sessions Vault</span>
          </div>
          <span className="text-[10px] text-slate-500 font-mono">Records</span>
        </button>
      </div>

      {/* Active Session Evidence Documents list */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-3 border-t border-slate-200 bg-white">
        <div>
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-600 px-2 py-1 uppercase tracking-wider">
            <div className="flex items-center gap-1.5">
              <Paperclip className="w-3.5 h-3.5 text-emerald-700" />
              <span>Evidence Files ({currentSession?.documents.length || 0})</span>
            </div>
            <span className="text-[10px] text-slate-400 font-mono">Audit Pack</span>
          </div>

          <div className="mt-1 space-y-1">
            {!currentSession || currentSession.documents.length === 0 ? (
              <div className="p-3 text-center border border-dashed border-slate-200 rounded-lg text-[11px] text-slate-400 bg-slate-50">
                <FolderOpen className="w-5 h-5 mx-auto mb-1 text-slate-300" />
                No evidence files uploaded yet.
              </div>
            ) : (
              currentSession.documents.map((doc) => {
                const isSelected = selectedDocId === doc.id;
                return (
                  <div
                    key={doc.id}
                    onClick={() => onSelectDocument(doc)}
                    className={`group p-2 rounded-lg text-xs cursor-pointer transition border ${
                      isSelected
                        ? 'bg-emerald-50 border-emerald-400 text-emerald-950 font-medium'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-1.5">
                      <div className="flex items-center gap-1.5 truncate">
                        {doc.type === 'xlsx' ? (
                          <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                        ) : (
                          <FileText className="w-3.5 h-3.5 text-blue-700 shrink-0" />
                        )}
                        <span className="font-semibold truncate text-[11px]" title={doc.name}>
                          {doc.name}
                        </span>
                      </div>
                      <span className="text-[9px] font-mono text-slate-400 shrink-0">
                        {doc.size}
                      </span>
                    </div>

                    <div className="flex items-center justify-between mt-1 text-[10px] text-slate-500">
                      <span className="flex items-center gap-1 text-emerald-700 font-medium">
                        <CheckCircle2 className="w-2.5 h-2.5" />
                        <span>OCR Ready ({doc.pagesCount} pp)</span>
                      </span>
                      <span className="text-slate-400 group-hover:text-emerald-700 transition text-[9px] font-semibold">
                        Inspect &rarr;
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Current Active Entity Summary if exists */}
        {currentSession && (
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-[11px] space-y-1.5">
            <div className="text-slate-500 font-bold uppercase text-[10px] tracking-wider flex items-center justify-between">
              <span>Audited Enterprise</span>
              <span className="text-emerald-800 font-mono font-bold">{currentSession.financialYear}</span>
            </div>
            <p className="text-slate-900 font-bold truncate" title={currentSession.entityName}>
              {currentSession.entityName}
            </p>
            <p className="text-slate-600 text-[10px] line-clamp-2 leading-relaxed">
              {currentSession.auditScope}
            </p>
            <div className="pt-1 flex items-center justify-between text-[10px] text-slate-500 border-t border-slate-200">
              <span>Sector:</span>
              <span className="text-slate-800 font-semibold">{currentSession.sector}</span>
            </div>
          </div>
        )}
      </div>

      {/* Footer System Notice */}
      <div className="p-3 border-t border-slate-200 bg-slate-100 text-[10px] text-slate-600 flex flex-col gap-0.5">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
            <span className="text-slate-800 font-bold">Punjab Government Portal</span>
          </span>
          <span className="font-mono text-emerald-800 font-bold">COMMERCIAL AUDIT</span>
        </div>
        <p className="text-[9px] text-slate-500 truncate">
          Government of the Punjab &bull; Finance & Audit Division
        </p>
      </div>
    </aside>
  );
};
