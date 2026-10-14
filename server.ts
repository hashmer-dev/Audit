import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Server-side Gemini initialization
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || '',
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// System Prompt for Commercial Audit of Pakistan
const AUDIT_SYSTEM_PROMPT = `
You are CAP-AI, the official Senior Audit Officer AI developed for the Commercial Audit Department of Pakistan (Auditor General of Pakistan - AGP).
Your core responsibility is to inspect financial records, bank statements, procurement bills, tenders, contracts, and ledgers uploaded by auditors, and evaluate them against official Pakistani statutory regulations (such as PPRA Rules 2004, General Financial Rules GFR Vol I & II, Treasury Rules, Federal Audit Manual, Income Tax Ordinance 2001, Sales Tax Act 1990).

CRITICAL AUDIT RULES:
1. Examine all uploaded evidence files thoroughly.
2. Cross-reference every transaction, voucher date, payment amount, and approval signature against the relevant rulebooks.
3. Identify irregularities including:
   - Misclassification of expenditure or incurring unauthorized expenses.
   - Expenditure without sanction or beyond designated financial delegation powers.
   - Violation of PPRA rules (splitting tenders to avoid open competition, lack of competitive bidding, improper evaluation, advance payments without bank guarantee).
   - Non-deduction / short deduction of Withholding Income Tax (WHT u/s 153) or General Sales Tax (GST).
   - Overpayments, fake or duplicate vouchers, disbursement without technical inspection certificates.
   - Non-recovery of mobilization advances or government dues.

OUTPUT FORMAT REQUIREMENTS:
For each detected irregularity, return a structured Audit Para object strictly conforming to the requested schema.
- DP/PAO Number format: e.g. "DP-2024/COMM-[3 digits]" or "PAO-2024/EXP-[3 digits]"
- Title: Concise, authoritative statement starting with strong audit verbs ("Unauthorized Payment...", "Irregular Award of Contract...", "Non-Recovery of...", "Loss to Public Exchequor...")
- Amount: PKR formatted string, e.g. "Rs. 14,500,000/-"
- Amount Numeric: exact integer/float value in PKR
- Statement of Facts: Clear, objective, timeline-based description of what transpired based on the evidence.
- Rule Violated: Specific Clause/Rule number, section, and rulebook title (e.g. "Rule 12 & Rule 36(b) of PPRA Rules 2004", "Rule 148 of GFR Vol-I").
- Auditor Recommendation: Clear directive for recovery, fixation of responsibility, or disciplinary action under E&D rules.
- Citation Metadata: source_file, page_number, line_number, highlight_snippet, and bounding box coordinates [x, y, width, height] in percentage (0 to 100) for visual overlay.
- Risk Level: "Critical", "High", or "Medium".

Tone: Extremely formal, objective, legally sound, and compliant with Federal Government auditing standards in Pakistan.
`;

// Audit Para Analysis Endpoint
app.post('/api/audit/analyze', async (req: Request, res: Response) => {
  try {
    const { sessionName, entityName, financialYear, auditScope, documents, rulebooks, query } = req.body;

    if (!documents || documents.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No evidence documents attached. Please upload financial vouchers, ledgers, or procurement files to audit.',
      });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        success: false,
        error: 'GEMINI_API_KEY is not configured on the server. Please attach your API key in the Settings > Secrets panel.',
      });
    }

    const evidenceSummary = (documents || [])
      .map((d: any, idx: number) => `--- DOCUMENT ${idx + 1}: ${d.name} (${d.type || 'file'}) ---\n${d.content || d.extractedText || 'No text content available.'}`)
      .join('\n\n');

    const rulesSummary = (rulebooks || [])
      .map((r: any, idx: number) => `--- RULEBOOK ${idx + 1}: ${r.title} ---\n${r.summary || r.content || ''}`)
      .join('\n\n');

    const userPrompt = `
Entity / Department Name: ${entityName || 'Public Sector Enterprise'}
Financial Year: ${financialYear || '2023-24'}
Audit Scope: ${auditScope || 'Commercial Compliance & Procurement Regularity Audit'}
Specific Auditor Directive / Command: ${query || 'Perform comprehensive compliance and financial regularity audit. Identify all statutory violations, unauthorized expenditures, and tax non-compliance.'}

RULES & REGULATIONS REFERENCE:
${rulesSummary}

EVIDENCE DOCUMENTS TO AUDIT:
${evidenceSummary}

Analyze the uploaded evidence documents against the statutory regulations. Generate structured Draft Audit Paras (DP / PAO) with exact citations, monetary figures, and specific regulatory breach details.
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: userPrompt,
      config: {
        systemInstruction: AUDIT_SYSTEM_PROMPT,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            executiveSummary: {
              type: Type.STRING,
              description: 'Executive summary of audit findings, total financial impact, and systemic irregularities.',
            },
            totalIrregularityAmount: {
              type: Type.STRING,
              description: 'Total cumulative amount of detected irregularities formatted as Rs. X,XXX,XXX/-',
            },
            auditParas: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  paoNumber: { type: Type.STRING, description: 'e.g. DP-2024/COMM-01' },
                  title: { type: Type.STRING },
                  entityName: { type: Type.STRING },
                  financialYear: { type: Type.STRING },
                  category: { type: Type.STRING, description: 'PPRA Violation | Tax Non-Deduction | Unauthorized Expense | Splitting of Purchases | Fake Vouchers' },
                  riskLevel: { type: Type.STRING, description: 'Critical | High | Medium' },
                  amountFormatted: { type: Type.STRING, description: 'Rs. 14,500,000/-' },
                  amountNumeric: { type: Type.NUMBER },
                  statementOfFacts: { type: Type.STRING },
                  ruleViolated: { type: Type.STRING },
                  auditorRecommendation: { type: Type.STRING },
                  citations: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        sourceFile: { type: Type.STRING },
                        pageNumber: { type: Type.INTEGER },
                        lineNumber: { type: Type.INTEGER },
                        highlightSnippet: { type: Type.STRING },
                        bbox: {
                          type: Type.OBJECT,
                          properties: {
                            x: { type: Type.NUMBER },
                            y: { type: Type.NUMBER },
                            w: { type: Type.NUMBER },
                            h: { type: Type.NUMBER },
                          },
                        },
                      },
                    },
                  },
                },
                required: [
                  'paoNumber',
                  'title',
                  'entityName',
                  'financialYear',
                  'amountFormatted',
                  'statementOfFacts',
                  'ruleViolated',
                  'auditorRecommendation',
                  'citations',
                ],
              },
            },
          },
          required: ['executiveSummary', 'totalIrregularityAmount', 'auditParas'],
        },
      },
    });

    const parsedData = JSON.parse(response.text || '{}');
    return res.json({ success: true, data: parsedData });
  } catch (error: any) {
    console.error('Error during audit analysis:', error);
    return res.status(500).json({
      success: false,
      error: error?.message || 'Internal audit processing error.',
    });
  }
});

// In-Editor AI Assistant Endpoint
app.post('/api/audit/editor-ai', async (req: Request, res: Response) => {
  try {
    const { action, text, context } = req.body;

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        success: false,
        error: 'GEMINI_API_KEY is not configured on the server.',
      });
    }

    let systemPrompt = 'You are an expert Government Audit Officer drafting the final Audit Report for the Public Accounts Committee (PAC) of Pakistan.';
    let prompt = '';

    if (action === 'rephrase_audit_tone') {
      prompt = `Rewrite the following text into the formal, stringent, legally defensible tone prescribed by the Auditor General of Pakistan (AGP):\n\n"${text}"`;
    } else if (action === 'convert_urdu') {
      prompt = `Translate the following audit observation into formal Official Government Urdu (دفتر آڈیٹر جنرل آف پاکستان کی سرکاری اردو زبان) maintaining all financial numbers, references, and rule sections:\n\n"${text}"`;
    } else if (action === 'summarize_amounts') {
      prompt = `Extract all monetary values from the following text and provide a concise tabulated statement of financial recovery and recovery directives in PKR:\n\n"${text}"`;
    } else if (action === 'compliance_check') {
      prompt = `Audit check the following para against PPRA Rules 2004 and GFR Vol-I. Point out any weak arguments or missing citations:\n\n"${text}"`;
    } else {
      prompt = `Enhance the following audit text: "${text}" with context: ${context || 'Audit observation'}`;
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction: systemPrompt,
      },
    });

    return res.json({ success: true, result: response.text });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// In development, hook up Vite dev server middleware
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // In production, serve dist static files
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Commercial Audit of Pakistan AI (CAP-AI) server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
