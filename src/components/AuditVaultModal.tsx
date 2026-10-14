import React from 'react';
import {
  X,
  Building2,
  Calendar,
  Download,
  ArrowRight,
  FolderOpen,
} from 'lucide-react';
import { AuditSession } from '../types/audit';
import { exportReportToDocx } from '../utils/docxExport';
import { PunjabLogo } from './PunjabLogo';

interface AuditVaultModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessions: AuditSession[];
  activeSessionId: string;
  onSelectSession: (session: AuditSession) => void;
}

export const AuditVaultModal: React.FC<AuditVaultModalProps> = ({
  isOpen,
  onClose,
  sessions,
  activeSessionId,
  onSelectSession,
}) => {
  if (!isOpen) return null;

  const handleExportSessionDocx = (session: AuditSession, e: React.MouseEvent) => {
    e.stopPropagation();
    exportReportToDocx({
      entityName: session.entityName,
      financialYear: session.financialYear,
      auditScope: session.auditScope,
      executiveSummary: session.executiveSummary,
      totalAmount: session.totalIrregularityAmount,
      paras: session.paras,
      reportTitle: `GOVERNMENT OF THE PUNJAB - DRAFT AUDIT REPORT (${session.financialYear})`,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs select-none">
      <div className="bg-white border border-slate-300 rounded-2xl w-full max-w-3xl max-h-[85vh] flex flex-col shadow-xl overflow-hidden animate-scaleUp">
        {/* Modal Header with Punjab Logo */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <PunjabLogo size="md" />
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <span>Audit Sessions Vault</span>
                <span className="text-[10px] bg-emerald-50 text-emerald-800 font-mono px-2 py-0.5 rounded border border-emerald-300 font-bold">
                  Official Records
                </span>
              </h2>
              <p className="text-xs text-slate-500">
                Government of the Punjab &bull; Commercial Audit Directorate Archives
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-500 hover:text-slate-900 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sessions List */}
        <div className="p-5 overflow-y-auto space-y-3.5 bg-slate-100">
          {sessions.length === 0 ? (
            <div className="p-12 text-center bg-white border border-slate-200 rounded-xl">
              <FolderOpen className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <h4 className="text-sm font-bold text-slate-700">Vault is Empty</h4>
              <p className="text-xs text-slate-500 mt-1">
                Completed and active Punjab commercial audit sessions will appear in this repository for historical cross-referencing and PAC defense.
              </p>
            </div>
          ) : (
            sessions.map((session) => {
              const isActive = session.id === activeSessionId;
              return (
                <div
                  key={session.id}
                  onClick={() => {
                    onSelectSession(session);
                    onClose();
                  }}
                  className={`p-4 rounded-xl border transition cursor-pointer group bg-white ${
                    isActive
                      ? 'border-emerald-700 shadow-sm ring-1 ring-emerald-700/50'
                      : 'border-slate-200 hover:border-slate-300 shadow-xs'
                  }`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900 group-hover:text-emerald-800 transition">
                          {session.name}
                        </span>
                        {isActive && (
                          <span className="text-[10px] bg-emerald-50 text-emerald-800 border border-emerald-300 px-2 py-0.5 rounded font-mono font-bold">
                            Active in Workspace
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 flex items-center gap-2">
                        <Building2 className="w-3.5 h-3.5 text-blue-700" />
                        <span className="font-semibold text-slate-700">{session.entityName}</span>
                        <span>&bull;</span>
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span className="font-mono">FY {session.financialYear}</span>
                        <span>&bull;</span>
                        <span className="text-slate-500">{session.sector}</span>
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-slate-500 uppercase font-bold block">
                        Irregularity Amount
                      </span>
                      <span className="text-sm font-bold font-mono text-rose-800">
                        {session.totalIrregularityAmount || 'Rs. 0/-'}
                      </span>
                    </div>
                  </div>

                  {session.executiveSummary && (
                    <p className="text-xs text-slate-600 line-clamp-2 bg-slate-50 p-2.5 rounded-lg border border-slate-200 mb-3">
                      {session.executiveSummary}
                    </p>
                  )}

                  <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-200">
                    <div className="flex items-center gap-3 text-slate-500 text-[11px]">
                      <span>
                        <strong className="text-slate-800 font-bold">{session.paras.length}</strong> Draft Paras
                      </span>
                      <span>&bull;</span>
                      <span>
                        <strong className="text-slate-800 font-bold">{session.documents.length}</strong> Evidence Files
                      </span>
                      <span>&bull;</span>
                      <span className="text-slate-400 font-mono">Date: {session.createdAt}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      {session.paras.length > 0 && (
                        <button
                          onClick={(e) => handleExportSessionDocx(session, e)}
                          className="flex items-center gap-1 text-[11px] bg-slate-50 hover:bg-slate-100 text-slate-700 px-2.5 py-1 rounded transition border border-slate-300 cursor-pointer font-semibold"
                          title="Download Word Report"
                        >
                          <Download className="w-3 h-3 text-blue-700" />
                          <span>Export .DOCX</span>
                        </button>
                      )}
                      <span className="text-xs text-emerald-800 font-bold flex items-center gap-1">
                        <span>Load Session</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
