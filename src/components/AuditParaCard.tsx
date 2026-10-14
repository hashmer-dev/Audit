import React, { useState } from 'react';
import {
  FileText,
  AlertOctagon,
  Scale,
  Copy,
  Check,
  Languages,
  ArrowUpRight,
  ShieldCheck,
  ExternalLink,
} from 'lucide-react';
import { AuditPara, Citation } from '../types/audit';

interface AuditParaCardProps {
  para: AuditPara;
  index: number;
  onSelectCitation: (citation: Citation) => void;
  onOpenInWord: (para: AuditPara) => void;
  onAppendToWord: (para: AuditPara) => void;
  isTransferred?: boolean;
}

export const AuditParaCard: React.FC<AuditParaCardProps> = ({
  para,
  index,
  onSelectCitation,
  onOpenInWord,
  onAppendToWord,
  isTransferred = false,
}) => {
  const [showUrdu, setShowUrdu] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [loadingUrdu, setLoadingUrdu] = useState<boolean>(false);
  const [urduContent, setUrduContent] = useState<string>(para.urduTranslation || '');

  const handleCopy = () => {
    const text = `PARA NO. ${index + 1} (${para.paoNumber}): ${para.title}
ENTITY: ${para.entityName} | FY: ${para.financialYear}
AMOUNT INVOLVED: ${para.amountFormatted}
CATEGORY: ${para.category} | RISK: ${para.riskLevel}

1. STATEMENT OF FACTS:
${para.statementOfFacts}

2. RULE / AUTHORITY VIOLATED:
${para.ruleViolated}

3. AUDITOR'S RECOMMENDATION:
${para.auditorRecommendation}
`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleFetchUrdu = async () => {
    if (urduContent) {
      setShowUrdu(!showUrdu);
      return;
    }

    setLoadingUrdu(true);
    try {
      const res = await fetch('/api/audit/editor-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'convert_urdu',
          text: `${para.title}\n${para.statementOfFacts}\n${para.ruleViolated}\n${para.auditorRecommendation}`,
        }),
      });
      const data = await res.json();
      if (data.success && data.result) {
        setUrduContent(data.result);
        setShowUrdu(true);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingUrdu(false);
    }
  };

  const getRiskBadge = (risk: string) => {
    switch (risk) {
      case 'Critical':
        return 'bg-rose-50 text-rose-800 border-rose-200';
      case 'High':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      default:
        return 'bg-blue-50 text-blue-800 border-blue-200';
    }
  };

  return (
    <article className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs hover:border-slate-300 transition-all duration-150">
      {/* Top Header: DP/PAO Number & Title */}
      <div className="flex flex-wrap items-start justify-between gap-3 pb-3 border-b border-slate-200">
        <div className="space-y-1.5 flex-1 min-w-[280px]">
          <div className="flex flex-wrap items-center gap-2">
            <span className="bg-emerald-50 text-emerald-900 font-mono text-xs font-bold px-2.5 py-0.5 rounded border border-emerald-300">
              {para.paoNumber}
            </span>
            <span className={`text-[11px] font-bold px-2 py-0.5 rounded border ${getRiskBadge(para.riskLevel)}`}>
              {para.riskLevel} Risk
            </span>
            <span className="bg-slate-100 text-slate-700 text-[11px] font-medium px-2 py-0.5 rounded border border-slate-200">
              {para.category}
            </span>
            <span className="text-slate-500 text-xs font-medium">
              Para #{index + 1}
            </span>
          </div>

          <h3 className="text-base font-bold text-slate-900 leading-snug tracking-tight">
            {para.title}
          </h3>
        </div>

        {/* Amount Box */}
        <div className="bg-rose-50 border border-rose-200 rounded-lg px-3.5 py-2 text-right shrink-0">
          <span className="block text-[10px] uppercase font-bold tracking-wider text-rose-700">
            Amount Involved / Recovery
          </span>
          <span className="text-base md:text-lg font-black text-rose-800 font-mono tracking-tight">
            {para.amountFormatted}
          </span>
        </div>
      </div>

      {/* Main Body: Statement of Facts */}
      <div className="mt-4 space-y-3.5 text-xs text-slate-800">
        <div>
          <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1 flex items-center gap-1.5">
            <AlertOctagon className="w-3.5 h-3.5 text-amber-600" />
            <span>1. Statement of Facts</span>
          </h4>
          <p className="bg-slate-50 p-3 rounded-lg border border-slate-200 leading-relaxed text-slate-800">
            {para.statementOfFacts}
          </p>
        </div>

        {/* Rule Violated & Web Search Reference */}
        <div>
          <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1 flex items-center gap-1.5">
            <Scale className="w-3.5 h-3.5 text-emerald-700" />
            <span>2. Statutory Authority & Rule Violated (Searched & Verified via Internet)</span>
          </h4>
          <div className="bg-emerald-50/70 p-2.5 rounded-lg border-l-4 border-emerald-700 border border-emerald-200 text-emerald-950 font-medium text-xs space-y-1.5">
            <p>{para.ruleViolated}</p>
            {para.statutoryReferenceUrl && (
              <div className="pt-1 border-t border-emerald-200/60 flex items-center gap-1 text-[11px]">
                <span className="font-bold text-emerald-900">Reference Source:</span>
                <a
                  href={para.statutoryReferenceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-700 hover:underline font-mono truncate flex items-center gap-1"
                >
                  <span>{para.statutoryReferenceUrl}</span>
                  <ExternalLink className="w-3 h-3 shrink-0" />
                </a>
              </div>
            )}
          </div>
        </div>

        {/* Auditor's Recommendation */}
        <div>
          <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-700" />
            <span>3. Auditor's Recommendation & Action Required</span>
          </h4>
          <p className="bg-slate-50 p-3 rounded-lg border border-slate-200 leading-relaxed text-slate-800">
            {para.auditorRecommendation}
          </p>
        </div>

        {/* Citations Pill Section (Click to Source) */}
        {para.citations && para.citations.length > 0 && (
          <div className="pt-1">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              Evidentiary Cross-References (Click to Inspect Source Document):
            </span>
            <div className="flex flex-wrap gap-2">
              {para.citations.map((cit, cIdx) => (
                <button
                  key={cIdx}
                  onClick={() => onSelectCitation(cit)}
                  className="group flex items-center gap-2 bg-slate-50 hover:bg-emerald-50 border border-slate-300 hover:border-emerald-400 text-slate-800 hover:text-emerald-950 px-3 py-1.5 rounded-md text-xs font-mono transition text-left cursor-pointer"
                  title="Click to view file and highlight coordinates"
                >
                  <span className="text-amber-600">📍</span>
                  <span className="font-semibold text-emerald-900 truncate max-w-[180px]">
                    {cit.sourceFile}
                  </span>
                  <span className="text-slate-400">|</span>
                  <span>Pg {cit.pageNumber}</span>
                  {cit.lineNumber && (
                    <>
                      <span className="text-slate-400">|</span>
                      <span>Ln {cit.lineNumber}</span>
                    </>
                  )}
                  <ArrowUpRight className="w-3 h-3 text-slate-400 group-hover:text-emerald-800 shrink-0" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Urdu View Drawer (Optional) */}
        {showUrdu && (
          <div className="mt-3 p-3.5 bg-amber-50/60 border border-amber-300 rounded-lg text-amber-950 font-urdu text-sm leading-loose text-right dir-rtl animate-fadeIn">
            <div className="flex items-center justify-between pb-1.5 mb-2 border-b border-amber-200 text-xs font-mono text-amber-900 text-left">
              <span>OFFICIAL GOVERNMENT URDU DRAFT (سرکاری اردو مسودہ)</span>
              <button
                onClick={() => setShowUrdu(false)}
                className="hover:text-slate-900 transition text-xs font-sans cursor-pointer"
              >
                بند کریں &times;
              </button>
            </div>
            <p className="whitespace-pre-line font-medium">{urduContent}</p>
          </div>
        )}
      </div>

      {/* Card Action Footer */}
      <div className="mt-5 pt-3.5 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex items-center gap-2">
          {/* Open in Word Editor */}
          <button
            onClick={() => onOpenInWord(para)}
            className="flex items-center gap-1.5 bg-blue-800 hover:bg-blue-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg shadow-xs transition border border-blue-900 cursor-pointer"
            title="Open dedicated editor with this Para"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Open in Commercial Audit Word</span>
          </button>

          {/* Append to Active Report */}
          <button
            onClick={() => onAppendToWord(para)}
            className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border transition cursor-pointer ${
              isTransferred
                ? 'bg-emerald-50 border-emerald-400 text-emerald-800'
                : 'bg-white hover:bg-slate-50 border-slate-300 text-slate-700'
            }`}
          >
            <Check className={`w-3.5 h-3.5 ${isTransferred ? 'text-emerald-700' : 'text-slate-500'}`} />
            <span>{isTransferred ? 'Appended to Report' : 'Append to Report'}</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          {/* Translate to Urdu */}
          <button
            onClick={handleFetchUrdu}
            disabled={loadingUrdu}
            className="flex items-center gap-1.5 bg-white hover:bg-slate-50 text-slate-700 text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 transition cursor-pointer font-medium"
            title="Translate to Pakistani Government Urdu"
          >
            <Languages className="w-3.5 h-3.5 text-amber-700" />
            <span>{loadingUrdu ? 'Translating...' : showUrdu ? 'Hide Urdu' : 'Urdu (اردو)'}</span>
          </button>

          {/* Copy Para */}
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 bg-white hover:bg-slate-50 text-slate-700 text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 transition cursor-pointer font-medium"
            title="Copy para text to clipboard"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-700" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
        </div>
      </div>
    </article>
  );
};
