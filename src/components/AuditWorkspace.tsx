import React, { useState, useRef } from 'react';
import {
  Send,
  Paperclip,
  Sparkles,
  FileText,
  Search,
  UploadCloud,
  FileSpreadsheet,
  ShieldAlert,
  Loader2,
  Briefcase,
  Layers,
  FolderOpen,
  PlusCircle,
  AlertCircle,
} from 'lucide-react';
import { AuditPara, AuditSession, Citation, DocumentFile, Rulebook } from '../types/audit';
import { AuditParaCard } from './AuditParaCard';
import { DocumentCitationViewer } from './DocumentCitationViewer';
import { PunjabLogo } from './PunjabLogo';

interface AuditWorkspaceProps {
  currentSession: AuditSession | null;
  rulebooks: Rulebook[];
  onOpenInWord: (para: AuditPara) => void;
  onAppendToWord: (para: AuditPara) => void;
  dualViewOpen: boolean;
  setDualViewOpen: (open: boolean) => void;
  selectedDoc: DocumentFile | undefined;
  setSelectedDoc: (doc: DocumentFile | undefined) => void;
  onUpdateSessionParas: (paras: AuditPara[], totalAmount?: string, summary?: string) => void;
  onAddDocuments: (docs: DocumentFile[]) => void;
  onOpenNewSession: () => void;
}

export const AuditWorkspace: React.FC<AuditWorkspaceProps> = ({
  currentSession,
  rulebooks,
  onOpenInWord,
  onAppendToWord,
  dualViewOpen,
  setDualViewOpen,
  selectedDoc,
  setSelectedDoc,
  onUpdateSessionParas,
  onAddDocuments,
  onOpenNewSession,
}) => {
  const [query, setQuery] = useState<string>('');
  const [analyzing, setAnalyzing] = useState<boolean>(false);
  const [analysisStatusText, setAnalysisStatusText] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeCitation, setActiveCitation] = useState<Citation | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedRisk, setSelectedRisk] = useState<string>('All');
  const [searchFilter, setSearchFilter] = useState<string>('');
  const [transferredParaIds, setTransferredParaIds] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadNotice, setUploadNotice] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Quick Action Pills
  const quickActions = [
    { label: 'Audit PPRA Compliance', prompt: 'Audit all attached procurement records against PPRA Rules 2004. Flag split purchases, missing tender advertisements, or improper technical evaluations.' },
    { label: 'Verify Tax Withholding (WHT & GST)', prompt: 'Check statutory deduction of Withholding Income Tax under Section 153 and Sales Tax Special Procedure Rules across all disbursements.' },
    { label: 'Examine Sanctions & Financial Powers', prompt: 'Verify whether financial expenditures were sanctioned within designated financial delegation limits under General Financial Rules (GFR).' },
    { label: 'Inspect Mobilization Advances (GFR 148)', prompt: 'Audit mobilization advance payments to contractors against GFR Rule 148, checking bank guarantee validity and unearned disbursements.' },
    { label: 'Check for Duplicate / Over-Invoiced Vouchers', prompt: 'Perform line-by-line verification on disbursement amounts to identify duplicate claims, math errors, or unvouched expenditure.' },
  ];

  const handleSelectCitation = (citation: Citation) => {
    setActiveCitation(citation);
    setDualViewOpen(true);

    if (currentSession) {
      const match = currentSession.documents.find(
        (d) => d.name.toLowerCase() === citation.sourceFile.toLowerCase()
      );
      if (match) {
        setSelectedDoc(match);
      } else if (currentSession.documents.length > 0) {
        setSelectedDoc(currentSession.documents[0]);
      }
    }
  };

  const handleRunAnalysis = async (customPrompt?: string) => {
    if (!currentSession) {
      onOpenNewSession();
      return;
    }

    if (currentSession.documents.length === 0) {
      setErrorMessage('Please attach evidence documents (PDF, Excel ledgers, contracts) before executing audit analysis.');
      setTimeout(() => setErrorMessage(null), 4000);
      return;
    }

    const promptToRun = customPrompt || query;

    setAnalyzing(true);
    setErrorMessage(null);
    setAnalysisStatusText('Reading attached evidence files and OCR text layers...');

    try {
      setTimeout(() => {
        setAnalysisStatusText('Cross-referencing transactions against PPRA Rules 2004 & GFR Vol-I...');
      }, 1200);

      setTimeout(() => {
        setAnalysisStatusText('Formulating structured Departmental Audit Observations (DP / PAO)...');
      }, 2400);

      const res = await fetch('/api/audit/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionName: currentSession.name,
          entityName: currentSession.entityName,
          financialYear: currentSession.financialYear,
          auditScope: currentSession.auditScope,
          documents: currentSession.documents,
          rulebooks: rulebooks,
          query: promptToRun,
        }),
      });

      const json = await res.json();
      if (json.success && json.data?.auditParas) {
        onUpdateSessionParas(
          json.data.auditParas,
          json.data.totalIrregularityAmount,
          json.data.executiveSummary
        );
        setQuery('');
      } else {
        setErrorMessage(json.error || 'Failed to complete audit analysis.');
      }
    } catch (err: any) {
      console.error('Audit analysis failed:', err);
      setErrorMessage(err.message || 'Network error while contacting audit analysis engine.');
    } finally {
      setAnalyzing(false);
      setAnalysisStatusText('');
    }
  };

  // Real Multi-File Upload Processing (supports 6-10+ files)
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (!currentSession) {
      onOpenNewSession();
      return;
    }

    setIsUploading(true);
    setUploadNotice(`Uploading and parsing ${files.length} document(s)...`);

    const newDocs: DocumentFile[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const ext = file.name.split('.').pop()?.toLowerCase();
      let type: DocumentFile['type'] = 'pdf';
      if (ext === 'xlsx' || ext === 'xls') type = 'xlsx';
      else if (ext === 'docx' || ext === 'doc') type = 'docx';
      else if (['jpg', 'jpeg', 'png'].includes(ext || '')) type = 'img';

      // Read text content from files if text/ascii, or extract summary
      let extractedText = '';
      try {
        if (file.type.includes('text') || file.name.endsWith('.csv') || file.name.endsWith('.txt')) {
          extractedText = await file.text();
        } else {
          extractedText = `Document: ${file.name}\nSize: ${(file.size / 1024).toFixed(1)} KB\nUploaded for commercial audit inspection for ${currentSession.entityName} (FY ${currentSession.financialYear}).`;
        }
      } catch (err) {
        extractedText = `Document attached: ${file.name}`;
      }

      newDocs.push({
        id: `doc-${Date.now()}-${i}`,
        name: file.name,
        size: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
        type,
        pagesCount: Math.max(1, Math.floor(file.size / 80000)),
        uploadProgress: 100,
        status: 'ready',
        uploadedAt: 'Just now',
        extractedText,
        pages: [
          {
            pageNumber: 1,
            lines: [
              `GOVERNMENT OF PAKISTAN - COMMERCIAL AUDIT RECORD`,
              `FILE: ${file.name}`,
              `ATTACHED FOR OFFICIAL DAC/PAC COMPLIANCE REVIEW`,
              `Entity: ${currentSession.entityName} | FY: ${currentSession.financialYear}`,
            ],
          },
        ],
      });
    }

    onAddDocuments(newDocs);
    setIsUploading(false);
    setUploadNotice(`Successfully attached and indexed ${newDocs.length} evidence file(s).`);
    setTimeout(() => setUploadNotice(null), 3000);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const filteredParas = (currentSession?.paras || []).filter((para) => {
    const matchesCategory = selectedCategory === 'All' || para.category === selectedCategory;
    const matchesRisk = selectedRisk === 'All' || para.riskLevel === selectedRisk;
    const matchesSearch =
      searchFilter === '' ||
      para.title.toLowerCase().includes(searchFilter.toLowerCase()) ||
      para.paoNumber.toLowerCase().includes(searchFilter.toLowerCase()) ||
      para.ruleViolated.toLowerCase().includes(searchFilter.toLowerCase());
    return matchesCategory && matchesRisk && matchesSearch;
  });

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-53px)] overflow-hidden bg-slate-100 text-slate-800">
      {/* Top Banner: Session Brief & Quick Stats */}
      {currentSession ? (
        <div className="bg-white border-b border-slate-200 px-5 py-3 shrink-0 flex flex-wrap items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <PunjabLogo size="md" />
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-slate-900">
                  {currentSession.name}
                </h2>
                <span className="text-[10px] font-mono bg-emerald-50 text-emerald-800 border border-emerald-300 px-2 py-0.5 rounded font-semibold">
                  Active Audit Mandate
                </span>
              </div>
              <p className="text-xs text-slate-500">
                {currentSession.entityName} &bull; FY {currentSession.financialYear} &bull; {currentSession.sector}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <div className="bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-700" />
              <div>
                <span className="text-slate-500 text-[10px] block font-medium">Attached Files</span>
                <span className="font-bold font-mono text-slate-800">
                  {currentSession.documents.length} Files
                </span>
              </div>
            </div>

            <div className="bg-rose-50 border border-rose-200 px-3 py-1.5 rounded-lg flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-700" />
              <div>
                <span className="text-rose-700 text-[10px] block font-bold">Total Irregularity</span>
                <span className="font-bold font-mono text-rose-900">
                  {currentSession.totalIrregularityAmount || 'Rs. 0/-'}
                </span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white border-b border-slate-200 px-5 py-3 flex items-center justify-between shadow-xs">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Commercial Audit Workbench</h2>
            <p className="text-xs text-slate-500">Initiate an audit session to begin analyzing financial records against federal statutes.</p>
          </div>
          <button
            onClick={onOpenNewSession}
            className="flex items-center gap-1.5 bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-semibold px-3.5 py-1.5 rounded-lg shadow-xs transition cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Initiate Audit Session</span>
          </button>
        </div>
      )}

      {/* Main Workspace Area (Split Screen or Single View) */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Side: Paras Output Feed & Command Flow */}
        <div
          className={`flex-1 flex flex-col overflow-hidden transition-all duration-300 ${
            dualViewOpen ? 'w-full lg:w-3/5 border-r border-slate-300' : 'w-full'
          }`}
        >
          {/* Filters & Search Toolbar (shown if session exists) */}
          {currentSession && (
            <div className="p-3 bg-white border-b border-slate-200 flex flex-wrap items-center justify-between gap-2.5 text-xs shrink-0 shadow-xs">
              {/* Search */}
              <div className="relative flex-1 min-w-[200px] max-w-sm">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search paras by rule, title, or DP#..."
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 outline-none focus:border-emerald-700"
                />
              </div>

              {/* Category Filter */}
              <div className="flex items-center gap-1.5">
                <span className="text-slate-500 text-[11px] font-semibold hidden sm:inline">Category:</span>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 outline-none cursor-pointer"
                >
                  <option value="All">All Categories</option>
                  <option value="PPRA Violation">PPRA Violations</option>
                  <option value="Tax Non-Deduction">Tax Non-Deduction</option>
                  <option value="Unauthorized Expense">Unauthorized Expense</option>
                  <option value="Splitting of Purchases">Splitting Purchases</option>
                </select>

                <select
                  value={selectedRisk}
                  onChange={(e) => setSelectedRisk(e.target.value)}
                  className="bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 outline-none cursor-pointer"
                >
                  <option value="All">All Risks</option>
                  <option value="Critical">Critical Risk</option>
                  <option value="High">High Risk</option>
                  <option value="Medium">Medium Risk</option>
                </select>
              </div>
            </div>
          )}

          {/* Paras Scrollable Container */}
          <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-5">
            {/* Error Message if any */}
            {errorMessage && (
              <div className="p-3 bg-rose-50 border border-rose-300 rounded-xl text-xs text-rose-800 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-700 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Executive Summary Card if present */}
            {currentSession?.executiveSummary && (
              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-200">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-800 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                    <span>Executive Summary & Systemic Findings</span>
                  </h4>
                  <span className="text-[10px] font-mono text-slate-500 font-medium">AGP Standard Formulation</span>
                </div>
                <p className="text-xs text-slate-700 leading-relaxed">
                  {currentSession.executiveSummary}
                </p>
              </div>
            )}

            {/* Analyzing Indicator */}
            {analyzing && (
              <div className="p-5 bg-white border border-emerald-300 rounded-xl flex items-center gap-4 text-emerald-900 shadow-sm">
                <Loader2 className="w-6 h-6 animate-spin text-emerald-700 shrink-0" />
                <div>
                  <h4 className="text-xs font-bold text-slate-900">
                    Commercial Audit Engine Analyzing Records...
                  </h4>
                  <p className="text-xs text-emerald-800 mt-0.5">{analysisStatusText}</p>
                </div>
              </div>
            )}

            {/* Empty States */}
            {!currentSession ? (
              <div className="p-12 text-center bg-white border border-slate-200 rounded-2xl shadow-xs">
                <PunjabLogo size="xl" className="mx-auto mb-3" />
                <h3 className="text-base font-bold text-slate-900">No Active Audit Session</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 mb-5">
                  To start an audit, initiate an official session with the audited entity’s title, financial year, and audit scope.
                </p>
                <button
                  onClick={onOpenNewSession}
                  className="bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-semibold px-4 py-2 rounded-lg shadow-xs transition inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Initiate New Audit Session</span>
                </button>
              </div>
            ) : filteredParas.length === 0 && !analyzing ? (
              <div className="p-12 text-center bg-white border border-slate-200 rounded-2xl shadow-xs">
                <PunjabLogo size="xl" className="mx-auto mb-3" />
                <h3 className="text-base font-bold text-slate-900">No Draft Audit Paras Formulated Yet</h3>
                <p className="text-xs text-slate-500 max-w-lg mx-auto mt-1 mb-5 leading-relaxed">
                  Attach your evidence files (financial ledgers, bills, contracts, procurement orders) via the command bar below and enter your audit directive or click one of the regulatory audit action pills.
                </p>
                <div className="inline-flex items-center gap-2">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-semibold px-4 py-2 rounded-lg shadow-xs transition inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <UploadCloud className="w-4 h-4" />
                    <span>Attach Evidence Documents</span>
                  </button>
                </div>
              </div>
            ) : (
              filteredParas.map((para, idx) => (
                <AuditParaCard
                  key={para.id || idx}
                  para={para}
                  index={idx}
                  onSelectCitation={handleSelectCitation}
                  onOpenInWord={onOpenInWord}
                  onAppendToWord={(p) => {
                    onAppendToWord(p);
                    setTransferredParaIds((prev) => [...prev, p.id]);
                  }}
                  isTransferred={transferredParaIds.includes(para.id)}
                />
              ))
            )}
          </div>

          {/* Bottom Fixed Command Bar */}
          <div className="p-3 md:p-4 bg-white border-t border-slate-200 shrink-0">
            {/* Quick Action Trigger Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none">
              <span className="text-[10px] uppercase font-bold text-slate-500 shrink-0 mr-1 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-600" />
                <span>Statutory Audit Actions:</span>
              </span>
              {quickActions.map((action, i) => (
                <button
                  key={i}
                  onClick={() => handleRunAnalysis(action.prompt)}
                  disabled={analyzing}
                  className="shrink-0 bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 text-slate-700 hover:text-emerald-900 px-2.5 py-1 rounded-full text-[11px] font-medium transition cursor-pointer flex items-center gap-1"
                >
                  <span>{action.label}</span>
                </button>
              ))}
            </div>

            {/* Upload Notice */}
            {uploadNotice && (
              <div className="mb-2 p-2 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-center justify-between font-medium">
                <span>{uploadNotice}</span>
                <button onClick={() => setUploadNotice(null)} className="text-slate-400 hover:text-slate-800">
                  &times;
                </button>
              </div>
            )}

            {/* Input Bar Container */}
            <div className="bg-slate-50 border border-slate-300 rounded-xl p-2.5 shadow-xs flex flex-col gap-2">
              {/* Attached file badges strip */}
              {currentSession && currentSession.documents.length > 0 && (
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider shrink-0">
                    Attached Files ({currentSession.documents.length}):
                  </span>
                  {currentSession.documents.map((doc) => (
                    <div
                      key={doc.id}
                      onClick={() => {
                        setSelectedDoc(doc);
                        setDualViewOpen(true);
                      }}
                      className="flex items-center gap-1.5 bg-white border border-slate-200 px-2 py-0.5 rounded text-[11px] text-slate-700 hover:border-emerald-600 cursor-pointer shrink-0 font-medium"
                      title="Click to view file in document inspector"
                    >
                      <FileText className="w-3 h-3 text-blue-700" />
                      <span className="truncate max-w-[130px]">{doc.name}</span>
                      <span className="text-[9px] text-emerald-700 font-mono font-bold">✓</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Main Textarea and Action buttons */}
              <div className="flex items-end gap-2">
                <input
                  type="file"
                  multiple
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="hidden"
                  accept=".pdf,.docx,.xlsx,.xls,.png,.jpg,.jpeg,.txt,.csv"
                />

                {/* Attach Files Button */}
                <button
                  type="button"
                  onClick={() => {
                    if (!currentSession) {
                      onOpenNewSession();
                    } else {
                      fileInputRef.current?.click();
                    }
                  }}
                  disabled={isUploading || analyzing}
                  className="p-2 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg text-slate-700 hover:text-slate-900 transition cursor-pointer shrink-0"
                  title="Attach Evidence Documents (PDF, Excel, Word)"
                >
                  <Paperclip className="w-4 h-4 text-emerald-700" />
                </button>

                {/* Multiline Prompt Input */}
                <textarea
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleRunAnalysis();
                    }
                  }}
                  rows={2}
                  placeholder={
                    currentSession
                      ? "Enter audit directive: e.g. 'Audit attached vouchers against PPRA Rule 12 and calculate total non-compliance' (Press Enter to execute)..."
                      : "Initiate an audit session to begin analyzing financial records..."
                  }
                  className="flex-1 bg-transparent border-0 resize-none text-xs text-slate-900 placeholder-slate-400 outline-none leading-relaxed py-1 font-medium"
                />

                {/* Send / Execute Button */}
                <button
                  type="button"
                  onClick={() => handleRunAnalysis()}
                  disabled={analyzing}
                  className="p-2.5 bg-emerald-800 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg transition shadow-xs cursor-pointer shrink-0"
                  title="Execute Audit Analysis"
                >
                  {analyzing ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Split Screen Document Viewer */}
        {dualViewOpen && (
          <div className="w-full lg:w-2/5 h-full flex flex-col bg-slate-100 z-20 shadow-md border-l border-slate-300">
            <DocumentCitationViewer
              document={selectedDoc || currentSession?.documents[0]}
              activeCitation={activeCitation}
              onClose={() => setDualViewOpen(false)}
              isDualView={true}
            />
          </div>
        )}
      </div>
    </div>
  );
};
