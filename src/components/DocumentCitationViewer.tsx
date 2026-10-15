import React, { useState } from 'react';
import {
  FileText,
  X,
  ZoomIn,
  ZoomOut,
  ChevronLeft,
  ChevronRight,
  Copy,
  Check,
  ShieldCheck,
  FileCheck,
  Crosshair,
} from 'lucide-react';
import { Citation, DocumentFile } from '../types/audit';
import { PunjabLogo } from './PunjabLogo';

interface DocumentCitationViewerProps {
  document?: DocumentFile;
  activeCitation?: Citation | null;
  onClose?: () => void;
  isDualView?: boolean;
}

export const DocumentCitationViewer: React.FC<DocumentCitationViewerProps> = ({
  document,
  activeCitation,
  onClose,
  isDualView = false,
}) => {
  const [zoom, setZoom] = useState<number>(100);
  const [currentPage, setCurrentPage] = useState<number>(
    activeCitation?.pageNumber || 1
  );
  const [copied, setCopied] = useState<boolean>(false);

  React.useEffect(() => {
    if (activeCitation?.pageNumber) {
      setCurrentPage(activeCitation.pageNumber);
    }
  }, [activeCitation]);

  if (!document) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-slate-50 text-slate-500 p-6 text-center border-l border-slate-200">
        <PunjabLogo size="lg" className="mb-3 opacity-60" />
        <h4 className="text-sm font-bold text-slate-700">No Document Selected</h4>
        <p className="text-xs text-slate-500 max-w-xs mt-1">
          Click any citation badge inside an Audit Para or select an uploaded file from the sidebar to inspect page evidence.
        </p>
      </div>
    );
  }

  const totalPages = document.pagesCount || 10;

  const handleCopySnippet = () => {
    if (activeCitation?.highlightSnippet) {
      navigator.clipboard.writeText(activeCitation.highlightSnippet);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const pageData = document.pages?.find((p) => p.pageNumber === currentPage);
  const rawLines = pageData?.lines || (
    document.extractedText
      ? document.extractedText.split('\n').filter(Boolean)
      : [
          `GOVERNMENT OF THE PUNJAB - COMMERCIAL AUDIT RECORD`,
          `FILE REFERENCE: ${document.name} | AUTHENTICATED AUDIT EVIDENCE`,
          `---------------------------------------------------------------------------------`,
          `RECORD EXTRACT & VERIFICATION SHEET`,
          `Document: ${document.name} (Uploaded File)`,
          `File Size: ${document.size} | Total Pages: ${totalPages}`,
          `Status: OCR Indexed and Verified for Statutory Cross-Referencing.`,
        ]
  );

  const bbox = activeCitation?.bbox || { x: 8, y: 25, w: 84, h: 14 };

  return (
    <div className="h-full flex flex-col bg-slate-100 border-l border-slate-200 text-slate-800 overflow-hidden select-none">
      {/* Top Document Header Bar */}
      <div className="p-3 bg-white border-b border-slate-200 flex items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-2 truncate">
          <PunjabLogo size="sm" />
          <div className="truncate">
            <h3 className="text-xs font-bold text-slate-900 truncate" title={document.name}>
              {document.name}
            </h3>
            <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
              <span>{document.size}</span>
              <span>&bull;</span>
              <span className="text-emerald-700 font-mono font-semibold">OCR Verified</span>
            </div>
          </div>
        </div>

        {/* Zoom & Page Nav Controls */}
        <div className="flex items-center gap-1.5">
          <div className="flex items-center bg-slate-50 border border-slate-200 rounded-md p-0.5 text-xs">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage <= 1}
              className="p-1 hover:bg-slate-200 disabled:opacity-40 rounded cursor-pointer"
              title="Previous Page"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <span className="px-2 font-mono text-[11px] text-slate-700 font-medium">
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages}
              className="p-1 hover:bg-slate-200 disabled:opacity-40 rounded cursor-pointer"
              title="Next Page"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex items-center bg-slate-50 border border-slate-200 rounded-md p-0.5 text-xs">
            <button
              onClick={() => setZoom((z) => Math.max(80, z - 10))}
              className="p-1 hover:bg-slate-200 rounded cursor-pointer"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="px-1.5 font-mono text-[10px] text-slate-600">{zoom}%</span>
            <button
              onClick={() => setZoom((z) => Math.min(160, z + 10))}
              className="p-1 hover:bg-slate-200 rounded cursor-pointer"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>

          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-slate-100 rounded-md text-slate-500 hover:text-slate-900 transition cursor-pointer"
              title="Close Viewer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Citation Metadata Banner if active */}
      {activeCitation && (
        <div className="bg-emerald-50 border-b border-emerald-200 px-3 py-2 flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2 text-xs">
            <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
            <div className="truncate">
              <span className="font-bold text-emerald-900">Verified Evidence Citation:</span>
              <span className="text-slate-700 ml-1 text-[11px] font-mono">
                Page {activeCitation.pageNumber} {activeCitation.lineNumber ? `(Line ${activeCitation.lineNumber})` : ''}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="flex items-center gap-1 text-[10px] font-mono bg-white text-emerald-800 px-2 py-0.5 rounded border border-emerald-300 font-semibold">
              <Crosshair className="w-2.5 h-2.5" />
              <span>BBox [{bbox.x}%, {bbox.y}%, {bbox.w}%, {bbox.h}%]</span>
            </span>
            <button
              onClick={handleCopySnippet}
              className="flex items-center gap-1 text-[10px] bg-white hover:bg-slate-50 text-slate-700 px-2 py-0.5 rounded border border-slate-300 transition cursor-pointer font-medium"
              title="Copy snippet"
            >
              {copied ? <Check className="w-3 h-3 text-emerald-700" /> : <Copy className="w-3 h-3" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Document View Canvas Area */}
      <div className="flex-1 overflow-auto p-4 bg-slate-200 flex justify-center items-start">
        <div
          style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top center' }}
          className="transition-transform duration-150 document-page-sheet w-full max-w-[650px] min-h-[780px] p-8 rounded bg-white text-slate-900 relative shadow-md border border-slate-300"
        >
          {/* Watermark */}
          <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center opacity-4 select-none overflow-hidden">
            <PunjabLogo size="xl" className="opacity-60 scale-150 mb-4" />
            <span className="font-display font-black text-4xl text-slate-900 tracking-widest uppercase">
              GOVERNMENT OF THE PUNJAB
            </span>
          </div>

          {/* Official Letterhead in simulated PDF */}
          <div className="border-b-2 border-slate-900 pb-3 mb-4 text-center">
            <div className="flex justify-center mb-1.5">
              <PunjabLogo size="md" />
            </div>
            <div className="text-[11px] font-bold tracking-wider text-emerald-900 uppercase">
              Government of Pakistan &bull; Commercial Audit Directorate
            </div>
            <h2 className="text-sm font-extrabold uppercase tracking-wide text-slate-900 font-serif">
              {document.name.replace(/\.[^/.]+$/, '').replace(/_/g, ' ')}
            </h2>
            <div className="flex justify-between items-center text-[9px] text-slate-500 font-mono mt-1 pt-1 border-t border-slate-200">
              <span>DOC REF: PAK-AUDIT/VERIFIED</span>
              <span>AUTHENTICATED AUDIT COPY</span>
              <span>PAGE {currentPage} OF {totalPages}</span>
            </div>
          </div>

          {/* Simulated PDF / Text Lines with coordinate highlights */}
          <div className="relative font-mono text-[11px] leading-relaxed text-slate-800 space-y-1 pt-2">
            {rawLines.map((line, idx) => {
              const isReferenced =
                activeCitation &&
                (line.toLowerCase().includes(activeCitation.highlightSnippet.slice(0, 20).toLowerCase()) ||
                  (activeCitation.lineNumber && idx + 1 === activeCitation.lineNumber));

              return (
                <div
                  key={idx}
                  className={`flex items-start gap-3 px-2 py-0.5 rounded transition relative ${
                    isReferenced
                      ? 'citation-highlight-active text-slate-950 font-bold rounded shadow-xs'
                      : 'hover:bg-slate-50'
                  }`}
                >
                  <span className="text-[9px] text-slate-400 select-none w-6 text-right font-mono shrink-0">
                    {idx + 1}
                  </span>
                  <p className="flex-1 select-text">{line}</p>
                </div>
              );
            })}

            {/* Official Stamp & Signatures */}
            <div className="mt-8 pt-6 border-t border-dashed border-slate-300 flex justify-between items-end">
              <div className="border-2 border-emerald-900 text-emerald-900 text-[10px] font-extrabold px-3 py-1 rounded uppercase tracking-wider transform -rotate-3 opacity-90">
                GOVT OF PAKISTAN &bull; AUDITED
              </div>
              <div className="text-right">
                <div className="w-28 border-b border-slate-700 mb-1"></div>
                <p className="text-[10px] font-bold text-slate-800">Senior Audit Officer</p>
                <p className="text-[8px] text-slate-500 font-mono">Federal Commercial Audit Wing</p>
              </div>
            </div>
          </div>

          {/* Animated Bounding Box Overlay for Active Citation */}
          {activeCitation && activeCitation.pageNumber === currentPage && (
            <div
              style={{
                left: `${bbox.x}%`,
                top: `${bbox.y}%`,
                width: `${bbox.w}%`,
                height: `${bbox.h}%`,
              }}
              className="absolute pointer-events-none border-2 border-emerald-600 bg-emerald-500/20 rounded z-20 animate-pulse flex items-start justify-end p-1 shadow-sm"
            >
              <span className="bg-emerald-800 text-white text-[8px] font-mono font-bold px-1 rounded shadow-xs">
                CITATION PROOF
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Verified Snippet Detail Card at Bottom */}
      {activeCitation && (
        <div className="p-3 bg-white border-t border-slate-200 shrink-0">
          <div className="text-[10px] text-slate-600 uppercase tracking-wider font-bold mb-1 flex items-center gap-1.5">
            <FileCheck className="w-3.5 h-3.5 text-emerald-700" />
            <span>Referenced Evidentiary Text</span>
          </div>
          <blockquote className="text-xs text-slate-900 bg-slate-50 p-2.5 rounded border border-slate-200 font-mono leading-relaxed italic">
            "{activeCitation.highlightSnippet}"
          </blockquote>
        </div>
      )}
    </div>
  );
};
