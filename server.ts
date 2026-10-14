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
- Title: Concise, authoritative statement starting with strong audit verbs
- Amount: PKR formatted string, e.g. "Rs. 14,500,000/-"
- Amount Numeric: exact integer/float value in PKR
- Statement of Facts: Clear, objective, timeline-based description of what transpired based on the evidence.
- Rule Violated: Specific Clause/Rule number, section, and rulebook title.
- Auditor Recommendation: Clear directive for recovery, fixation of responsibility, or disciplinary action.
- Statutory Reference URL: Exact web reference URL from internet search where the rule was retrieved.
- Risk Level: "Critical", "High", or "Medium".

Tone: Extremely formal, objective, legally sound, and compliant with Federal Government auditing standards in Pakistan.
`;

// Helper to call OpenRouter API
async function callOpenRouter(model: string, prompt: string, apiKey: string) {
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'HTTP-Referer': process.env.APP_URL || 'https://aisudio.google.com',
      'X-Title': 'Government of Pakistan CAP-AI Audit Workbench',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: model,
      messages: [
        { role: 'system', content: AUDIT_SYSTEM_PROMPT },
        { role: 'user', content: prompt }
      ],
      response_format: { type: 'json_object' },
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`OpenRouter API error (${model}): ${response.status} - ${errText}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || '{}';
}

// Audit Para Analysis Endpoint
app.post('/api/audit/analyze', async (req: Request, res: Response) => {
  try {
    const { sessionName, entityName, financialYear, auditScope, documents, query, selectedModel } = req.body;

    if (!documents || documents.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No evidence documents attached. Please upload financial vouchers, ledgers, or procurement files to audit.',
      });
    }

    const modelToUse = selectedModel || 'nvidia/nemotron-3.5-lightning:free';
    const isOpenRouterModel = modelToUse.includes(':free') || modelToUse.includes('/') || modelToUse.includes('cohere') || modelToUse.includes('liquid') || modelToUse.includes('nvidia');

    const evidenceSummary = (documents || [])
      .map((d: any, idx: number) => `--- DOCUMENT ${idx + 1}: ${d.name} (${d.type || 'file'}) ---\n${d.content || d.extractedText || 'No text content available.'}`)
      .join('\n\n');

    const userPrompt = `
Entity / Department Name: ${entityName || 'Public Sector Enterprise'}
Financial Year: ${financialYear || '2023-24'}
Audit Scope: ${auditScope || 'Commercial Compliance & Procurement Regularity Audit'}
Specific Auditor Directive / Command: ${query || 'Perform comprehensive compliance and financial regularity audit. Search the web for exact statutory rule references, sections, and authoritative citations (e.g. PPRA Rules, GFR, Income Tax Ordinance).'}

EVIDENCE DOCUMENTS TO AUDIT:
${evidenceSummary}

Cross-reference these transactions against verified statutory regulations. Provide exact statutory rule references along with web reference URLs and citations. Return strict JSON matching the schema with executiveSummary, totalIrregularityAmount, and auditParas array.
`;

    let responseText = '';

    if (isOpenRouterModel) {
      const openRouterKey = process.env.API_KEY || process.env.OPENROUTER_API_KEY || '';
      if (!openRouterKey) {
        return res.status(500).json({
          success: false,
          error: 'OpenRouter API Key (API_KEY) is not configured in environment variables.',
        });
      }
      responseText = await callOpenRouter(modelToUse, userPrompt, openRouterKey);
    } else {
      // Gemini Model (e.g. gemini-3.1-flash, gemini-3.8-flash)
      const geminiKey = process.env.GEMINI_API_KEY || '';
      if (!geminiKey) {
        return res.status(500).json({
          success: false,
          error: 'GEMINI_API_KEY is not configured in environment variables.',
        });
      }

      const geminiRes = await ai.models.generateContent({
        model: modelToUse.startsWith('gemini-') ? modelToUse : 'gemini-3.1-flash',
        contents: userPrompt,
        config: {
          systemInstruction: AUDIT_SYSTEM_PROMPT,
          tools: [{ googleSearch: {} }],
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              executiveSummary: { type: Type.STRING },
              totalIrregularityAmount: { type: Type.STRING },
              auditParas: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING },
                    paoNumber: { type: Type.STRING },
                    title: { type: Type.STRING },
                    entityName: { type: Type.STRING },
                    financialYear: { type: Type.STRING },
                    category: { type: Type.STRING },
                    riskLevel: { type: Type.STRING },
                    amountFormatted: { type: Type.STRING },
                    amountNumeric: { type: Type.NUMBER },
                    statementOfFacts: { type: Type.STRING },
                    ruleViolated: { type: Type.STRING },
                    auditorRecommendation: { type: Type.STRING },
                    statutoryReferenceUrl: { type: Type.STRING },
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
                  required: ['paoNumber', 'title', 'entityName', 'financialYear', 'amountFormatted', 'statementOfFacts', 'ruleViolated', 'auditorRecommendation', 'citations'],
                },
              },
            },
            required: ['executiveSummary', 'totalIrregularityAmount', 'auditParas'],
          },
        },
      });

      responseText = geminiRes.text || '{}';
    }

    const parsedData = JSON.parse(responseText);
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
    const { action, text, context, selectedModel } = req.body;
    const modelToUse = selectedModel || 'nvidia/nemotron-3.5-lightning:free';
    const isOpenRouterModel = modelToUse.includes(':free') || modelToUse.includes('/') || modelToUse.includes('cohere') || modelToUse.includes('liquid') || modelToUse.includes('nvidia');

    let systemPrompt = 'You are an expert Government Audit Officer drafting the final Audit Report for the Public Accounts Committee (PAC) of Pakistan.';
    let prompt = '';

    if (action === 'rephrase_audit_tone') {
      prompt = `Rewrite the following text into the formal, stringent, legally defensible tone prescribed by the Auditor General of Pakistan (AGP):\n\n"${text}"`;
    } else if (action === 'convert_urdu') {
      prompt = `Translate the following audit observation into formal Official Government Urdu (دفتر آڈیٹر جنرل آف پاکستان کی سرکاری اردو زبان) maintaining all financial numbers, references, and rule sections:\n\n"${text}"`;
    } else if (action === 'compliance_check') {
      prompt = `Audit check the following para against PPRA Rules and GFR. Point out any weak arguments or missing citations:\n\n"${text}"`;
    } else {
      prompt = `Enhance the following audit text: "${text}" with context: ${context || 'Audit observation'}`;
    }

    let resultText = '';
    if (isOpenRouterModel) {
      const openRouterKey = process.env.API_KEY || process.env.OPENROUTER_API_KEY || '';
      if (!openRouterKey) {
        return res.status(500).json({ success: false, error: 'OpenRouter API Key (API_KEY) is not configured.' });
      }
      const raw = await callOpenRouter(modelToUse, prompt, openRouterKey);
      try {
        const parsed = JSON.parse(raw);
        resultText = parsed.result || parsed.response || parsed.content || raw;
      } catch {
        resultText = raw;
      }
    } else {
      const geminiKey = process.env.GEMINI_API_KEY || '';
      if (!geminiKey) {
        return res.status(500).json({ success: false, error: 'GEMINI_API_KEY is not configured.' });
      }
      const geminiRes = await ai.models.generateContent({
        model: modelToUse.startsWith('gemini-') ? modelToUse : 'gemini-3.1-flash',
        contents: prompt,
        config: { systemInstruction: systemPrompt },
      });
      resultText = geminiRes.text || '';
    }

    return res.json({ success: true, result: resultText });
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
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Government of Pakistan CAP-AI server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
