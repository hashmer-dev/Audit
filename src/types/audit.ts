export interface Citation {
  sourceFile: string;
  pageNumber: number;
  lineNumber?: number;
  highlightSnippet: string;
  bbox?: {
    x: number; // percentage 0-100
    y: number; // percentage 0-100
    w: number; // percentage 0-100
    h: number; // percentage 0-100
  };
}

export interface AuditPara {
  id: string;
  paoNumber: string; // e.g., DP-2024/COMM-014
  title: string;
  entityName: string;
  financialYear: string;
  category: 'PPRA Violation' | 'Tax Non-Deduction' | 'Unauthorized Expense' | 'Splitting of Purchases' | 'Fake Vouchers' | 'Mobilization Advance';
  riskLevel: 'Critical' | 'High' | 'Medium';
  amountFormatted: string; // e.g., "Rs. 18,450,000/-"
  amountNumeric: number;
  statementOfFacts: string;
  ruleViolated: string;
  auditorRecommendation: string;
  statutoryReferenceUrl?: string;
  citations: Citation[];
  urduTranslation?: string;
  transferredToWord?: boolean;
}

export interface DocumentFile {
  id: string;
  name: string;
  size: string;
  type: 'pdf' | 'docx' | 'xlsx' | 'scan' | 'img';
  pagesCount: number;
  uploadProgress: number; // 0-100
  status: 'extracting' | 'ocr_done' | 'ready' | 'error';
  extractedText: string;
  uploadedAt: string;
  pages?: {
    pageNumber: number;
    lines: string[];
  }[];
}

export interface Rulebook {
  id: string;
  title: string;
  shortCode: string;
  authority: string;
  year: string;
  clausesCount: number;
  summary: string;
  content: string;
  sections: {
    sectionNumber: string;
    title: string;
    text: string;
  }[];
}

export interface AuditSession {
  id: string;
  name: string;
  entityName: string;
  financialYear: string;
  auditScope: string;
  sector: string;
  createdAt: string;
  documents: DocumentFile[];
  paras: AuditPara[];
  executiveSummary?: string;
  totalIrregularityAmount?: string;
}

export type ActiveView = 'workspace' | 'word_editor' | 'vault' | 'rules_library';
