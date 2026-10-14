import React, { useState, useRef, useEffect } from 'react';
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  List,
  ListOrdered,
  Table as TableIcon,
  BarChart2,
  PieChart as PieChartIcon,
  TrendingUp,
  Download,
  Printer,
  Sparkles,
  Languages,
  RotateCcw,
  Shield,
  FileCheck,
  Maximize2,
  Minimize2,
  FileText,
} from 'lucide-react';
import { AuditPara, AuditSession } from '../types/audit';
import { exportReportToDocx } from '../utils/docxExport';

interface CommercialAuditWordProps {
  currentSession: AuditSession | null;
  activeParas: AuditPara[];
  onBackToWorkspace?: () => void;
}

export const CommercialAuditWord: React.FC<CommercialAuditWordProps> = ({
  currentSession,
  activeParas,
  onBackToWorkspace,
}) => {
  const [activeTab, setActiveTab] = useState<'home' | 'insert' | 'ai' | 'file'>('home');
  const [fontFamily, setFontFamily] = useState<string>('Times New Roman');
  const [fontSize, setFontSize] = useState<string>('12pt');
  const [lineSpacing, setLineSpacing] = useState<string>('1.5');
  const [fullScreen, setFullScreen] = useState<boolean>(false);
  const [classification, setClassification] = useState<string>('CONFIDENTIAL');
  const [showWatermark, setShowWatermark] = useState<boolean>(true);
  const [aiLoading, setAiLoading] = useState<boolean>(false);
  const [aiNotification, setAiNotification] = useState<string | null>(null);

  // Dynamic embedded charts state
  const [embeddedCharts, setEmbeddedCharts] = useState<('bar' | 'pie')[]>(['bar']);

  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (editorRef.current && !editorRef.current.innerHTML.trim()) {
      populateInitialReport();
    }
  }, [currentSession]);

  const populateInitialReport = () => {
    if (!editorRef.current) return;

    if (!currentSession) {
      editorRef.current.innerHTML = `
        <div style="text-align: center; padding: 40px; color: #64748B;">
          <h2 style="font-size: 16pt; color: #0F172A; font-weight: bold;">Commercial Audit Report Suite</h2>
          <p>Please initiate an audit session in the workspace to automatically compile draft paras here.</p>
        </div>
      `;
      return;
    }

    let parasHtml = '';
    if (activeParas.length === 0) {
      parasHtml = `
        <div style="padding: 24px; border: 1px dashed #CBD5E1; border-radius: 6px; text-align: center; color: #64748B; margin: 20px 0;">
          No Draft Paras compiled yet. Attach evidence documents in the Audit Workspace and run analysis to populate observations.
        </div>
      `;
    } else {
      activeParas.forEach((p, idx) => {
        parasHtml += `
          <div class="audit-para-block my-6 pb-6 border-b border-slate-300">
            <div style="font-size: 13pt; font-weight: bold; color: #065F46; margin-bottom: 4px;">
              PARA NO. ${idx + 1} (${p.paoNumber}): ${p.title.toUpperCase()}
            </div>
            <div style="font-size: 11pt; margin-bottom: 8px; color: #1E293B;">
              <strong>Amount Involved / Recovery:</strong> <span style="color: #B91C1C; font-weight: bold;">${p.amountFormatted}</span>
              &nbsp;|&nbsp; <strong>Category:</strong> ${p.category}
              &nbsp;|&nbsp; <strong>Risk:</strong> ${p.riskLevel}
            </div>
            <div style="margin-top: 8px; text-align: justify; line-height: 1.5;">
              <strong>1. Statement of Facts:</strong><br/>
              ${p.statementOfFacts}
            </div>
            <div style="margin-top: 8px; text-align: justify; line-height: 1.5; background-color: #F8FAFC; padding: 8px; border-left: 3px solid #065F46;">
              <strong>2. Statutory Authority / Rule Violated:</strong><br/>
              ${p.ruleViolated}
            </div>
            <div style="margin-top: 8px; text-align: justify; line-height: 1.5;">
              <strong>3. Auditor's Recommendation:</strong><br/>
              ${p.auditorRecommendation}
            </div>
            ${
              p.citations && p.citations.length > 0
                ? `<div style="margin-top: 6px; font-size: 9.5pt; color: #64748B; font-style: italic;">
                    <strong>Evidentiary Source:</strong> [${p.citations[0].sourceFile} | Page ${p.citations[0].pageNumber}] "${p.citations[0].highlightSnippet}"
                   </div>`
                : ''
            }
          </div>
        `;
      });
    }

    const initialHtml = `
      <div style="text-align: center; margin-bottom: 24px;">
        <p style="font-size: 11pt; font-weight: bold; color: #475569; letter-spacing: 1px; margin: 0;">GOVERNMENT OF PAKISTAN</p>
        <h1 style="font-size: 16pt; font-weight: bold; color: #0A192F; margin: 4px 0;">DEPARTMENT OF THE AUDITOR GENERAL OF PAKISTAN</h1>
        <p style="font-size: 11pt; font-style: italic; color: #065F46; margin: 0;">DIRECTORATE GENERAL COMMERCIAL AUDIT (FEDERAL WING)</p>
        <hr style="border: 0; border-top: 2px solid #0A192F; margin: 16px 0;" />
        <h2 style="font-size: 14pt; font-weight: bold; color: #0F172A; text-decoration: underline; margin: 10px 0;">
          DRAFT AUDIT REPORT (DAR) FOR THE FINANCIAL YEAR ${currentSession.financialYear}
        </h2>
        <h3 style="font-size: 13pt; font-weight: 600; color: #1E3A8A; margin: 4px 0;">
          ON THE COMMERCIAL ACCOUNTS & PROCUREMENTS OF
        </h3>
        <h3 style="font-size: 14pt; font-weight: bold; color: #065F46; margin: 4px 0;">
          ${currentSession.entityName.toUpperCase()}
        </h3>
      </div>

      <div style="margin-bottom: 20px;">
        <table style="width: 100%; border-collapse: collapse; font-size: 11pt; margin-bottom: 16px;">
          <tr style="background-color: #F8FAFC;">
            <td style="border: 1px solid #CBD5E1; padding: 6px 10px; font-weight: bold; width: 30%;">Audited Organization:</td>
            <td style="border: 1px solid #CBD5E1; padding: 6px 10px;">${currentSession.entityName}</td>
          </tr>
          <tr>
            <td style="border: 1px solid #CBD5E1; padding: 6px 10px; font-weight: bold; background-color: #F8FAFC;">Financial Year:</td>
            <td style="border: 1px solid #CBD5E1; padding: 6px 10px;">${currentSession.financialYear}</td>
          </tr>
          <tr>
            <td style="border: 1px solid #CBD5E1; padding: 6px 10px; font-weight: bold; background-color: #F8FAFC;">Audit Mandate / Scope:</td>
            <td style="border: 1px solid #CBD5E1; padding: 6px 10px;">${currentSession.auditScope}</td>
          </tr>
          <tr style="background-color: #FEF2F2;">
            <td style="border: 1px solid #CBD5E1; padding: 6px 10px; font-weight: bold; color: #991B1B;">Total Irregularities Involved:</td>
            <td style="border: 1px solid #CBD5E1; padding: 6px 10px; font-weight: bold; color: #991B1B;">${currentSession.totalIrregularityAmount || 'Rs. 0/-'}</td>
          </tr>
        </table>
      </div>

      <div style="margin-bottom: 24px;">
        <h3 style="font-size: 13pt; font-weight: bold; color: #0A192F; border-bottom: 1px solid #94A3B8; padding-bottom: 4px;">
          1. EXECUTIVE SUMMARY & SYSTEMIC DEFICIENCIES
        </h3>
        <p style="text-align: justify; line-height: 1.5; font-size: 11.5pt;">
          ${currentSession.executiveSummary || 'Audit of the financial statements and procurement records was conducted in accordance with the Federal Audit Manual and statutory auditing standards of Pakistan. Observations requiring Departmental Audit Committee (DAC) scrutiny are formulated hereunder.'}
        </p>
      </div>

      <div>
        <h3 style="font-size: 13pt; font-weight: bold; color: #0A192F; border-bottom: 1px solid #94A3B8; padding-bottom: 4px;">
          2. DETAILED DRAFT AUDIT OBSERVATIONS & PARAS
        </h3>
        ${parasHtml}
      </div>
    `;

    editorRef.current.innerHTML = initialHtml;
  };

  const execCmd = (command: string, value: string | undefined = undefined) => {
    document.execCommand(command, false, value);
    if (editorRef.current) {
      editorRef.current.focus();
    }
  };

  const handleInsertTable = () => {
    const tableHtml = `
      <table style="width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 11pt;">
        <thead>
          <tr style="background-color: #0A192F; color: white;">
            <th style="border: 1px solid #334155; padding: 8px; text-align: left;">Voucher / File Ref #</th>
            <th style="border: 1px solid #334155; padding: 8px; text-align: left;">Particulars / Description</th>
            <th style="border: 1px solid #334155; padding: 8px; text-align: left;">Statutory Violation</th>
            <th style="border: 1px solid #334155; padding: 8px; text-align: right;">Amount Involved (PKR)</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="border: 1px solid #CBD5E1; padding: 6px 8px;">VR-01</td>
            <td style="border: 1px solid #CBD5E1; padding: 6px 8px;">Procurement of supplies without competitive bidding</td>
            <td style="border: 1px solid #CBD5E1; padding: 6px 8px;">PPRA Rule 12</td>
            <td style="border: 1px solid #CBD5E1; padding: 6px 8px; text-align: right;">Rs. 2,500,000/-</td>
          </tr>
          <tr style="background-color: #F8FAFC; font-weight: bold;">
            <td colspan="3" style="border: 1px solid #CBD5E1; border-bottom: 3px double #0A192F; padding: 8px; text-align: right;">
              TOTAL AUDIT OBJECTED EXPENDITURE:
            </td>
            <td style="border: 1px solid #CBD5E1; border-bottom: 3px double #0A192F; padding: 8px; text-align: right; color: #B91C1C;">
              Rs. 2,500,000/-
            </td>
          </tr>
        </tbody>
      </table>
      <p><br/></p>
    `;
    execCmd('insertHTML', tableHtml);
  };

  const handleAiAction = async (action: string) => {
    const selection = window.getSelection();
    let textToProcess = selection?.toString().trim();

    if (!textToProcess) {
      textToProcess = editorRef.current?.innerText.slice(0, 800) || '';
    }

    if (!textToProcess) {
      alert('Please select text inside the document to rephrase or convert.');
      return;
    }

    setAiLoading(true);
    setAiNotification('Processing request using official AGP audit standards...');

    try {
      const res = await fetch('/api/audit/editor-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          text: textToProcess,
          context: currentSession?.entityName || 'Commercial Audit',
        }),
      });
      const data = await res.json();
      if (data.success && data.result) {
        if (selection && selection.rangeCount > 0 && selection.toString().length > 0) {
          const range = selection.getRangeAt(0);
          range.deleteContents();
          const node = document.createElement('span');
          node.innerHTML = data.result.replace(/\n/g, '<br/>');
          range.insertNode(node);
        } else {
          if (editorRef.current) {
            editorRef.current.innerHTML += `<div style="margin-top: 16px; padding: 12px; background: #F0FDF4; border-left: 4px solid #16A34A;"><strong>Official AGP Formulation:</strong><br/>${data.result.replace(/\n/g, '<br/>')}</div>`;
          }
        }
        setAiNotification('Text successfully updated!');
        setTimeout(() => setAiNotification(null), 3000);
      } else {
        alert(data.error || 'Failed to process AI request.');
      }
    } catch (e: any) {
      console.error(e);
      setAiNotification('Error processing AI request.');
      setTimeout(() => setAiNotification(null), 3000);
    } finally {
      setAiLoading(false);
    }
  };

  const handleExportDocx = () => {
    if (!currentSession) return;
    exportReportToDocx({
      entityName: currentSession.entityName,
      financialYear: currentSession.financialYear,
      auditScope: currentSession.auditScope,
      executiveSummary: currentSession.executiveSummary,
      totalAmount: currentSession.totalIrregularityAmount,
      paras: activeParas,
    });
  };

  return (
    <div
      className={`flex flex-col bg-slate-200 text-slate-800 ${
        fullScreen ? 'fixed inset-0 z-50' : 'h-[calc(100vh-53px)]'
      }`}
    >
      {/* Top Word Ribbon Bar */}
      <div className="no-print bg-slate-100 border-b border-slate-300 shrink-0 shadow-xs">
        {/* Ribbon Tabs Header */}
        <div className="flex items-center justify-between px-4 pt-1.5 border-b border-slate-200">
          <div className="flex items-center gap-1">
            <span className="text-xs font-bold text-blue-900 mr-3 flex items-center gap-1">
              <FileText className="w-4 h-4 text-blue-700" />
              <span>Commercial Audit Word</span>
            </span>

            <button
              onClick={() => setActiveTab('home')}
              className={`px-3 py-1 text-xs font-semibold rounded-t-md transition cursor-pointer ${
                activeTab === 'home'
                  ? 'bg-white text-emerald-800 border-t-2 border-emerald-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Home
            </button>
            <button
              onClick={() => setActiveTab('insert')}
              className={`px-3 py-1 text-xs font-semibold rounded-t-md transition cursor-pointer ${
                activeTab === 'insert'
                  ? 'bg-white text-emerald-800 border-t-2 border-emerald-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Insert
            </button>
            <button
              onClick={() => setActiveTab('ai')}
              className={`px-3 py-1 text-xs font-semibold rounded-t-md transition cursor-pointer ${
                activeTab === 'ai'
                  ? 'bg-white text-emerald-800 border-t-2 border-emerald-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              AI Audit Assistant
            </button>
            <button
              onClick={() => setActiveTab('file')}
              className={`px-3 py-1 text-xs font-semibold rounded-t-md transition cursor-pointer ${
                activeTab === 'file'
                  ? 'bg-white text-emerald-800 border-t-2 border-emerald-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              File & Export
            </button>
          </div>

          <div className="flex items-center gap-2 pb-1">
            {onBackToWorkspace && (
              <button
                onClick={onBackToWorkspace}
                className="text-xs bg-white hover:bg-slate-50 text-slate-700 px-2.5 py-1 rounded border border-slate-300 font-semibold cursor-pointer"
              >
                &larr; Return to Workspace
              </button>
            )}
            <button
              onClick={() => setFullScreen(!fullScreen)}
              className="p-1 hover:bg-slate-200 text-slate-600 hover:text-slate-900 rounded cursor-pointer"
              title={fullScreen ? 'Exit Full Screen' : 'Full Screen'}
            >
              {fullScreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Ribbon Tools Panel */}
        <div className="p-2 px-4 bg-white flex flex-wrap items-center gap-3 text-xs min-h-[44px]">
          {activeTab === 'home' && (
            <>
              {/* Typography */}
              <div className="flex items-center gap-1.5 border-r border-slate-200 pr-3">
                <select
                  value={fontFamily}
                  onChange={(e) => {
                    setFontFamily(e.target.value);
                    execCmd('fontName', e.target.value);
                  }}
                  className="bg-slate-50 border border-slate-300 text-slate-800 text-xs rounded px-2 py-1 outline-none font-medium cursor-pointer"
                >
                  <option value="Times New Roman">Times New Roman (Standard)</option>
                  <option value="Calibri">Calibri</option>
                  <option value="Arial">Arial</option>
                  <option value="Inter">Inter</option>
                  <option value="Noto Nastaliq Urdu">Urdu Nastaliq (اردو)</option>
                  <option value="JetBrains Mono">JetBrains Mono</option>
                </select>

                <select
                  value={fontSize}
                  onChange={(e) => {
                    setFontSize(e.target.value);
                    execCmd('fontSize', '3');
                  }}
                  className="bg-slate-50 border border-slate-300 text-slate-800 text-xs rounded px-2 py-1 outline-none cursor-pointer"
                >
                  <option value="10pt">10 pt</option>
                  <option value="11pt">11 pt</option>
                  <option value="12pt">12 pt (Body)</option>
                  <option value="14pt">14 pt (H3)</option>
                  <option value="16pt">16 pt (H2)</option>
                  <option value="18pt">18 pt (H1)</option>
                  <option value="24pt">24 pt (Title)</option>
                </select>
              </div>

              {/* Formatting buttons */}
              <div className="flex items-center gap-1 border-r border-slate-200 pr-3">
                <button
                  onClick={() => execCmd('bold')}
                  className="p-1.5 hover:bg-slate-100 rounded text-slate-700 hover:text-slate-900 cursor-pointer font-bold"
                  title="Bold (Ctrl+B)"
                >
                  <Bold className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => execCmd('italic')}
                  className="p-1.5 hover:bg-slate-100 rounded text-slate-700 hover:text-slate-900 cursor-pointer italic"
                  title="Italic (Ctrl+I)"
                >
                  <Italic className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => execCmd('underline')}
                  className="p-1.5 hover:bg-slate-100 rounded text-slate-700 hover:text-slate-900 cursor-pointer underline"
                  title="Underline (Ctrl+U)"
                >
                  <Underline className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => execCmd('strikeThrough')}
                  className="p-1.5 hover:bg-slate-100 rounded text-slate-700 hover:text-slate-900 cursor-pointer"
                  title="Strikethrough"
                >
                  <Strikethrough className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Alignments */}
              <div className="flex items-center gap-1 border-r border-slate-200 pr-3">
                <button
                  onClick={() => execCmd('justifyLeft')}
                  className="p-1.5 hover:bg-slate-100 rounded text-slate-700 cursor-pointer"
                  title="Align Left"
                >
                  <AlignLeft className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => execCmd('justifyCenter')}
                  className="p-1.5 hover:bg-slate-100 rounded text-slate-700 cursor-pointer"
                  title="Align Center"
                >
                  <AlignCenter className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => execCmd('justifyRight')}
                  className="p-1.5 hover:bg-slate-100 rounded text-slate-700 cursor-pointer"
                  title="Align Right"
                >
                  <AlignRight className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => execCmd('justifyFull')}
                  className="p-1.5 hover:bg-slate-100 rounded text-slate-700 cursor-pointer"
                  title="Justify (Government Standard)"
                >
                  <AlignJustify className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Lists */}
              <div className="flex items-center gap-1">
                <button
                  onClick={() => execCmd('insertUnorderedList')}
                  className="p-1.5 hover:bg-slate-100 rounded text-slate-700 cursor-pointer"
                  title="Bullet List"
                >
                  <List className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => execCmd('insertOrderedList')}
                  className="p-1.5 hover:bg-slate-100 rounded text-slate-700 cursor-pointer"
                  title="Numbered List"
                >
                  <ListOrdered className="w-3.5 h-3.5" />
                </button>
              </div>
            </>
          )}

          {activeTab === 'insert' && (
            <>
              {/* Insert Table */}
              <button
                onClick={handleInsertTable}
                className="flex items-center gap-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-300 px-3 py-1 rounded text-slate-800 transition cursor-pointer font-medium"
              >
                <TableIcon className="w-3.5 h-3.5 text-emerald-700" />
                <span>Audit Statement Table</span>
              </button>

              {/* Insert Dynamic Charts */}
              <button
                onClick={() => setEmbeddedCharts((prev) => (prev.includes('bar') ? prev : [...prev, 'bar']))}
                className="flex items-center gap-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-300 px-3 py-1 rounded text-slate-800 transition cursor-pointer font-medium"
              >
                <BarChart2 className="w-3.5 h-3.5 text-blue-700" />
                <span>Category Breakdown Chart</span>
              </button>

              <button
                onClick={() => setEmbeddedCharts((prev) => (prev.includes('pie') ? prev : [...prev, 'pie']))}
                className="flex items-center gap-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-300 px-3 py-1 rounded text-slate-800 transition cursor-pointer font-medium"
              >
                <PieChartIcon className="w-3.5 h-3.5 text-amber-700" />
                <span>Risk Distribution Chart</span>
              </button>
            </>
          )}

          {activeTab === 'ai' && (
            <>
              <button
                onClick={() => handleAiAction('rephrase_audit_tone')}
                disabled={aiLoading}
                className="flex items-center gap-1.5 bg-emerald-800 hover:bg-emerald-700 text-white font-medium px-3 py-1 rounded transition cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>Rephrase in Official AGP Tone</span>
              </button>

              <button
                onClick={() => handleAiAction('convert_urdu')}
                disabled={aiLoading}
                className="flex items-center gap-1.5 bg-amber-800 hover:bg-amber-700 text-white font-medium px-3 py-1 rounded transition cursor-pointer"
              >
                <Languages className="w-3.5 h-3.5" />
                <span>Convert to Urdu (ترجمہ سرکاری اردو میں)</span>
              </button>

              <button
                onClick={() => handleAiAction('compliance_check')}
                disabled={aiLoading}
                className="flex items-center gap-1.5 bg-blue-800 hover:bg-blue-700 text-white font-medium px-3 py-1 rounded transition cursor-pointer"
              >
                <FileCheck className="w-3.5 h-3.5" />
                <span>Check PPRA / GFR Compliance</span>
              </button>
            </>
          )}

          {activeTab === 'file' && (
            <>
              <button
                onClick={handleExportDocx}
                className="flex items-center gap-1.5 bg-blue-800 hover:bg-blue-700 px-3 py-1 rounded text-white font-semibold transition cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Microsoft Word (.docx)</span>
              </button>

              <button
                onClick={() => window.print()}
                className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 px-3 py-1 rounded text-slate-800 font-semibold border border-slate-300 transition cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Official Report (PDF)</span>
              </button>

              <button
                onClick={populateInitialReport}
                className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 px-3 py-1 rounded text-slate-700 transition cursor-pointer"
                title="Reset to generated paras"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Re-sync with Active Paras</span>
              </button>
            </>
          )}

          {/* Classification & Watermark controls on right */}
          <div className="ml-auto flex items-center gap-2">
            <div className="flex items-center gap-1 text-[11px] text-slate-600">
              <Shield className="w-3.5 h-3.5 text-amber-700" />
              <select
                value={classification}
                onChange={(e) => setClassification(e.target.value)}
                className="bg-slate-50 border border-slate-300 text-amber-900 text-[10px] font-mono font-bold rounded px-1.5 py-0.5 outline-none cursor-pointer"
              >
                <option value="CONFIDENTIAL">CONFIDENTIAL</option>
                <option value="RESTRICTED">RESTRICTED</option>
                <option value="FOR OFFICIAL USE ONLY">FOR OFFICIAL USE ONLY</option>
                <option value="DAC ADVANCE DRAFT">DAC ADVANCE DRAFT</option>
              </select>
            </div>

            <label className="flex items-center gap-1 text-[11px] text-slate-600 cursor-pointer font-medium">
              <input
                type="checkbox"
                checked={showWatermark}
                onChange={(e) => setShowWatermark(e.target.checked)}
                className="rounded border-slate-300 text-emerald-700 focus:ring-0"
              />
              <span>Seal Watermark</span>
            </label>
          </div>
        </div>

        {/* AI Notification Banner */}
        {aiNotification && (
          <div className="bg-emerald-50 border-b border-emerald-200 px-4 py-1 text-xs text-emerald-800 font-medium flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
              <span>{aiNotification}</span>
            </span>
          </div>
        )}
      </div>

      {/* Editor Main Canvas: Official Printable Sheet */}
      <div className="flex-1 overflow-y-auto p-6 md:p-10 flex justify-center items-start bg-slate-200">
        <div
          className="document-page-sheet w-full max-w-[850px] min-h-[1100px] p-12 md:p-16 rounded bg-white text-slate-900 relative shadow-md border border-slate-300"
          style={{ fontFamily, lineHeight: lineSpacing }}
        >
          {/* Header Tag */}
          <div className="flex justify-between items-center text-[10px] text-slate-500 font-mono border-b border-slate-300 pb-2 mb-8 uppercase tracking-widest font-semibold">
            <span className="text-amber-800 font-bold">{classification}</span>
            <span>Commercial Audit Wing &bull; Islamabad</span>
            <span>Page 1 of 2</span>
          </div>

          {/* Watermark Overlay */}
          {showWatermark && (
            <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center opacity-3 select-none overflow-hidden z-0">
              <div className="font-display font-black text-7xl text-slate-900 transform -rotate-45 tracking-widest uppercase text-center leading-tight">
                AUDITOR GENERAL<br />OF PAKISTAN
              </div>
            </div>
          )}

          {/* Editable Content Region */}
          <div
            ref={editorRef}
            contentEditable
            suppressContentEditableWarning
            className="outline-none relative z-10 text-slate-900 leading-relaxed text-[12pt] min-h-[600px]"
          />

          {/* Embedded Dynamic Charts Section if enabled */}
          {embeddedCharts.length > 0 && activeParas.length > 0 && (
            <div className="mt-8 pt-6 border-t-2 border-slate-300 relative z-10">
              <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wide mb-3">
                STATISTICAL ANNEXURE & GRAPHICAL AUDIT ANALYSIS
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {embeddedCharts.includes('bar') && (
                  <div className="p-4 bg-slate-50 border border-slate-300 rounded">
                    <div className="text-xs font-bold text-slate-700 mb-2 flex items-center justify-between">
                      <span>Irregularities by Statutory Category</span>
                      <span className="text-[10px] text-slate-500 font-mono">Amount (PKR)</span>
                    </div>
                    <div className="space-y-2 text-xs">
                      {activeParas.slice(0, 3).map((p, i) => (
                        <div key={i}>
                          <div className="flex justify-between text-[11px] mb-0.5">
                            <span className="truncate max-w-[180px]">{p.category}</span>
                            <span className="font-bold text-rose-800 font-mono">{p.amountFormatted}</span>
                          </div>
                          <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                            <div className="bg-emerald-700 h-full rounded-full" style={{ width: `${80 - i * 20}%` }}></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {embeddedCharts.includes('pie') && (
                  <div className="p-4 bg-slate-50 border border-slate-300 rounded">
                    <div className="text-xs font-bold text-slate-700 mb-2 flex items-center justify-between">
                      <span>Risk Severity Breakdown</span>
                      <span className="text-[10px] text-slate-500 font-mono">PAC Criteria</span>
                    </div>
                    <div className="flex items-center justify-center gap-6 pt-2">
                      <div className="w-20 h-20 rounded-full border-4 border-rose-700 border-t-amber-500 border-l-blue-700 flex items-center justify-center font-bold text-xs text-slate-900">
                        {activeParas.length} Paras
                      </div>
                      <div className="text-[11px] space-y-1">
                        <div className="flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full bg-rose-700"></span>
                          <span>Critical / Recovery</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                          <span>High / Procedural</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full bg-blue-700"></span>
                          <span>Medium Regularity</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Official Document Footer */}
          <div className="mt-16 pt-6 border-t border-slate-300 flex justify-between items-end text-[10px] text-slate-600 font-mono">
            <div>
              <p className="font-bold text-slate-900">DEPARTMENT OF COMMERCIAL AUDIT</p>
              <p>Government of Pakistan &bull; Constitution of 1973</p>
            </div>
            <div className="text-right">
              <p className="font-bold text-slate-900">DIRECTOR GENERAL COMMERCIAL AUDIT</p>
              <p>Islamabad, Pakistan</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
