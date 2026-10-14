import React, { useState } from 'react';
import { X, PlusCircle, Building2, Calendar, FileText, Scale } from 'lucide-react';
import { AuditSession } from '../types/audit';

interface NewSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateSession: (session: AuditSession) => void;
}

export const NewSessionModal: React.FC<NewSessionModalProps> = ({
  isOpen,
  onClose,
  onCreateSession,
}) => {
  const [entityName, setEntityName] = useState<string>('');
  const [sessionName, setSessionName] = useState<string>('');
  const [financialYear, setFinancialYear] = useState<string>('2023-24');
  const [sector, setSector] = useState<string>('Public Sector Enterprise');
  const [auditScope, setAuditScope] = useState<string>(
    'Commercial Procurement, Propriety, and Financial Regularity Audit'
  );

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!entityName) return;

    const newSession: AuditSession = {
      id: `session-${Date.now()}`,
      name: sessionName || `${entityName} Audit (${financialYear})`,
      entityName,
      financialYear,
      auditScope,
      sector,
      createdAt: new Date().toLocaleDateString('en-GB'),
      documents: [],
      paras: [],
      executiveSummary: '',
      totalIrregularityAmount: 'Rs. 0/-',
    };

    onCreateSession(newSession);
    setEntityName('');
    setSessionName('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs select-none">
      <div className="bg-white border border-slate-300 rounded-2xl w-full max-w-lg flex flex-col shadow-xl overflow-hidden animate-scaleUp">
        {/* Header */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-800 text-white flex items-center justify-center">
              <Scale className="w-5 h-5 text-emerald-100" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Initiate Commercial Audit Session</h2>
              <p className="text-xs text-slate-500">Department of the Auditor General of Pakistan</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-200 rounded-lg text-slate-500 hover:text-slate-900 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs text-slate-700">
          {/* Entity Name */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1 uppercase tracking-wider">
              Entity / Ministry / Department Name *
            </label>
            <div className="relative">
              <Building2 className="w-4 h-4 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                placeholder="e.g. National Transmission & Despatch Company, PSO, CDA..."
                value={entityName}
                onChange={(e) => {
                  setEntityName(e.target.value);
                  if (!sessionName) setSessionName(`${e.target.value} Audit (${financialYear})`);
                }}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg pl-9 pr-3 py-2 text-slate-900 outline-none focus:border-emerald-700 text-xs font-medium"
              />
            </div>
          </div>

          {/* Session Name */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1 uppercase tracking-wider">
              Audit Session / Assignment Title
            </label>
            <input
              type="text"
              placeholder="e.g. Procurement & Financial Regularity Audit 2023-24"
              value={sessionName}
              onChange={(e) => setSessionName(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-900 outline-none focus:border-emerald-700 text-xs font-medium"
            />
          </div>

          {/* FY and Sector */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1 uppercase tracking-wider">Financial Year *</label>
              <select
                value={financialYear}
                onChange={(e) => setFinancialYear(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-900 outline-none focus:border-emerald-700 text-xs cursor-pointer font-medium"
              >
                <option value="2024-25">2024-25</option>
                <option value="2023-24">2023-24</option>
                <option value="2022-23">2022-23</option>
                <option value="2021-22">2021-22</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1 uppercase tracking-wider">Audit Sector *</label>
              <select
                value={sector}
                onChange={(e) => setSector(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-900 outline-none focus:border-emerald-700 text-xs cursor-pointer font-medium"
              >
                <option value="Power & Energy">Power & Energy</option>
                <option value="Oil & Gas">Oil & Gas</option>
                <option value="Communications & Aviation">Communications & Aviation</option>
                <option value="Infrastructure & Works">Infrastructure & Works</option>
                <option value="Autonomous & Statutory Bodies">Autonomous & Statutory Bodies</option>
                <option value="Revenue & Taxation">Revenue & Taxation</option>
                <option value="Finance & Banking">Finance & Banking</option>
                <option value="Defense Production">Defense Production</option>
              </select>
            </div>
          </div>

          {/* Audit Scope */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1 uppercase tracking-wider">Audit Scope & Focus</label>
            <textarea
              rows={2}
              value={auditScope}
              onChange={(e) => setAuditScope(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-900 outline-none focus:border-emerald-700 text-xs font-medium"
            />
          </div>

          {/* Actions */}
          <div className="pt-2 flex justify-end gap-2 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition cursor-pointer font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-emerald-800 hover:bg-emerald-700 text-white font-semibold rounded-lg shadow-xs transition cursor-pointer"
            >
              Start Official Audit
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
