import express, { Request, Response } from 'express';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Helper to resolve OpenRouter API Key from various possible env var names
function getOpenRouterApiKey(): string {
  const key =
    process.env.API_KEY ||
    process.env.OPENROUTER_API_KEY ||
    process.env.OPEN_ROUTER_API_KEY ||
    process.env.OPENROUTER_KEY ||
    process.env.VITE_API_KEY ||
    process.env.VITE_OPENROUTER_API_KEY ||
    '';
  return key.trim().replace(/^["']|["']$/g, '');
}

// Helper to resolve Gemini API Key
function getGeminiApiKey(): string {
  const key =
    process.env.GEMINI_API_KEY ||
    process.env.API_KEY_GEMINI ||
    process.env.GOOGLE_API_KEY ||
    process.env.VITE_GEMINI_API_KEY ||
    '';
  return key.trim().replace(/^["']|["']$/g, '');
}

// Lazy Gemini client initialization
function getGeminiClient() {
  const apiKey = getGeminiApiKey();
  if (!apiKey) return null;
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

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

// Helper to extract JSON safely from LLM text output (with code fence and edge-case handling)
function extractJsonObject(raw: string): any {
  if (!raw || typeof raw !== 'string') return {};

  const trimmed = raw.trim();

  // Direct parse attempt
  try {
    return JSON.parse(trimmed);
  } catch {}

  // Markdown code fence extraction: ```json ... ``` or ``` ... ```
  const codeBlockMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (codeBlockMatch && codeBlockMatch[1]) {
    try {
      return JSON.parse(codeBlockMatch[1].trim());
    } catch {}
  }

  // Bracket substring search
  const firstBrace = trimmed.indexOf('{');
  const lastBrace = trimmed.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    const candidate = trimmed.slice(firstBrace, lastBrace + 1);
    try {
      return JSON.parse(candidate);
    } catch {}
  }

  // Fallback structure if LLM returned plain text instead of JSON
  return {
    executiveSummary: trimmed.slice(0, 500) || 'Audit analysis conducted based on submitted records.',
    totalIrregularityAmount: 'Under Assessment',
    auditParas: [
      {
        id: 'para-gen-1',
        paoNumber: 'DP-2024/COMM-001',
        title: 'Statutory Compliance Observation - Federal Audit Directorate',
        entityName: 'Public Sector Organization',
        financialYear: '2023-24',
        category: 'Statutory Regularity & Compliance',
        riskLevel: 'High',
        amountFormatted: 'Under Verification',
        amountNumeric: 0,
        statementOfFacts: trimmed,
        ruleViolated: 'PPRA Rules 2004 / GFR Vol I & II',
        auditorRecommendation: 'Conduct formal departmental inquiry and effect recovery where applicable.',
        statutoryReferenceUrl: 'https://ppra.org.pk',
        citations: []
      }
    ]
  };
}

// Backup models sequence for OpenRouter
const OPENROUTER_BACKUPS = [
  'nvidia/nemotron-3.5-lightning:free',
  'liquid/lfm-2.5-2.6b:free',
  'cohere/north-mini-code:free'
];

interface CallOpenRouterOptions {
  isJson?: boolean;
  systemPrompt?: string;
  allowRetryBackups?: boolean;
}

// Helper to call OpenRouter API with timeout, retry, and JSON fallback
async function callOpenRouter(
  model: string,
  prompt: string,
  apiKey: string,
  options: CallOpenRouterOptions = {}
): Promise<string> {
  const { isJson = false, systemPrompt = AUDIT_SYSTEM_PROMPT, allowRetryBackups = true } = options;

  // Models that don't support response_format: { type: 'json_object' }
  const jsonUnsupported = model.includes('cohere') || model.includes('liquid');
  const sendJsonFormat = isJson && !jsonUnsupported;

  const modelsToTry = allowRetryBackups
    ? [model, ...OPENROUTER_BACKUPS.filter(m => m !== model)]
    : [model];

  let lastError: Error | null = null;

  for (const currentModel of modelsToTry) {
    try {
      // 45-second timeout controller so serverless invocations never hang indefinitely
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 45000);

      const requestBody: any = {
        model: currentModel,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ],
      };

      if (sendJsonFormat && !currentModel.includes('cohere') && !currentModel.includes('liquid')) {
        requestBody.response_format = { type: 'json_object' };
      }

      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'HTTP-Referer': process.env.APP_URL || 'https://openrouter.ai',
          'X-Title': 'Government of Pakistan CAP-AI Audit Workbench',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errText = await response.text();

        // If response_format caused a 400 error, retry once without response_format
        if (response.status === 400 && errText.includes('response_format')) {
          const retryController = new AbortController();
          const retryTimeoutId = setTimeout(() => retryController.abort(), 40000);

          delete requestBody.response_format;
          const retryRes = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${apiKey}`,
              'HTTP-Referer': process.env.APP_URL || 'https://openrouter.ai',
              'X-Title': 'Government of Pakistan CAP-AI Audit Workbench',
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody),
            signal: retryController.signal,
          });

          clearTimeout(retryTimeoutId);

          if (retryRes.ok) {
            const data = await retryRes.json();
            return data.choices?.[0]?.message?.content || '{}';
          }
        }

        throw new Error(`OpenRouter API status ${response.status} (${currentModel}): ${errText}`);
      }

      const data = await response.json();
      return data.choices?.[0]?.message?.content || '{}';
    } catch (err: any) {
      console.warn(`OpenRouter model ${currentModel} failed:`, err.message);
      lastError = err;
      // If aborted/timeout or rate-limited (429/503), try the next backup model
      continue;
    }
  }

  throw lastError || new Error('All OpenRouter models failed to respond.');
}

// Health Check Endpoint
app.get(['/api/health', '/health'], (_req: Request, res: Response) => {
  const hasOpenRouter = Boolean(getOpenRouterApiKey());
  const hasGemini = Boolean(getGeminiApiKey());
  res.json({
    status: 'ok',
    configured: {
      openrouter: hasOpenRouter,
      gemini: hasGemini,
    },
    service: 'Government of Pakistan CAP-AI Server',
  });
});

// Audit Para Analysis Endpoint
app.post(['/api/audit/analyze', '/audit/analyze'], async (req: Request, res: Response) => {
  try {
    const { sessionName, entityName, financialYear, auditScope, documents, query, selectedModel } = req.body;

    if (!documents || documents.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No evidence documents attached. Please upload financial vouchers, ledgers, or procurement files to audit.',
      });
    }

    const modelToUse = selectedModel || 'nvidia/nemotron-3.5-lightning:free';
    const isOpenRouterModel =
      modelToUse.includes(':free') ||
      modelToUse.includes('/') ||
      modelToUse.includes('cohere') ||
      modelToUse.includes('liquid') ||
      modelToUse.includes('nvidia');

    const evidenceSummary = (documents || [])
      .map(
        (d: any, idx: number) =>
          `--- DOCUMENT ${idx + 1}: ${d.name} (${d.type || 'file'}) ---\n${d.content || d.extractedText || 'No text content available.'}`
      )
      .join('\n\n');

    const userPrompt = `
Entity / Department Name: ${entityName || 'Public Sector Enterprise'}
Financial Year: ${financialYear || '2023-24'}
Audit Scope: ${auditScope || 'Commercial Compliance & Procurement Regularity Audit'}
Specific Auditor Directive / Command: ${query || 'Perform comprehensive compliance and financial regularity audit. Search for exact statutory rule references, sections, and authoritative citations (e.g. PPRA Rules, GFR, Income Tax Ordinance).'}

EVIDENCE DOCUMENTS TO AUDIT:
${evidenceSummary}

Cross-reference these transactions against verified statutory regulations of Pakistan. Provide exact statutory rule references along with web reference URLs and citations. Return strict JSON matching the schema with executiveSummary, totalIrregularityAmount, and auditParas array.
`;

    let responseText = '';

    if (isOpenRouterModel) {
      const openRouterKey = getOpenRouterApiKey();
      if (!openRouterKey) {
        // If Gemini is available as fallback, use it
        const geminiKey = getGeminiApiKey();
        if (geminiKey) {
          console.log('OpenRouter key missing, falling back to Gemini...');
          const geminiClient = getGeminiClient();
          if (geminiClient) {
            const geminiRes = await geminiClient.models.generateContent({
              model: 'gemini-3.1-flash',
              contents: userPrompt,
              config: {
                systemInstruction: AUDIT_SYSTEM_PROMPT,
                tools: [{ googleSearch: {} }],
                responseMimeType: 'application/json',
              },
            });
            responseText = geminiRes.text || '{}';
          }
        } else {
          return res.status(400).json({
            success: false,
            error:
              'OpenRouter API Key is not configured in Vercel environment variables. Please add "API_KEY" or "OPENROUTER_API_KEY" in your Vercel Project Settings > Environment Variables, or set "GEMINI_API_KEY".',
          });
        }
      } else {
        try {
          responseText = await callOpenRouter(modelToUse, userPrompt, openRouterKey, {
            isJson: true,
            systemPrompt: AUDIT_SYSTEM_PROMPT,
          });
        } catch (openRouterErr: any) {
          // If OpenRouter free queue is congested or failed and Gemini is available, failover to Gemini
          const geminiClient = getGeminiClient();
          if (geminiClient) {
            console.warn('OpenRouter failed, falling back to Gemini:', openRouterErr.message);
            const geminiRes = await geminiClient.models.generateContent({
              model: 'gemini-3.1-flash',
              contents: userPrompt,
              config: {
                systemInstruction: AUDIT_SYSTEM_PROMPT,
                tools: [{ googleSearch: {} }],
                responseMimeType: 'application/json',
              },
            });
            responseText = geminiRes.text || '{}';
          } else {
            throw openRouterErr;
          }
        }
      }
    } else {
      // Gemini Model (e.g. gemini-3.1-flash, gemini-2.5-flash)
      const geminiClient = getGeminiClient();
      if (!geminiClient) {
        return res.status(400).json({
          success: false,
          error:
            'GEMINI_API_KEY is not configured in environment variables. Please add GEMINI_API_KEY in Vercel Project Settings.',
        });
      }

      const geminiRes = await geminiClient.models.generateContent({
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
                  ],
                },
              },
            },
            required: ['executiveSummary', 'totalIrregularityAmount', 'auditParas'],
          },
        },
      });

      responseText = geminiRes.text || '{}';
    }

    const parsedData = extractJsonObject(responseText);
    return res.json({ success: true, data: parsedData });
  } catch (error: any) {
    console.error('Error during audit analysis:', error);
    return res.status(500).json({
      success: false,
      error:
        error?.message ||
        'Audit processing error. If using OpenRouter free models, the service may be congested. Try switching model to Gemini or wait a moment.',
    });
  }
});

// In-Editor AI Assistant Endpoint
app.post(['/api/audit/editor-ai', '/audit/editor-ai'], async (req: Request, res: Response) => {
  try {
    const { action, text, context, selectedModel } = req.body;
    const modelToUse = selectedModel || 'nvidia/nemotron-3.5-lightning:free';
    const isOpenRouterModel =
      modelToUse.includes(':free') ||
      modelToUse.includes('/') ||
      modelToUse.includes('cohere') ||
      modelToUse.includes('liquid') ||
      modelToUse.includes('nvidia');

    const systemPrompt =
      'You are an expert Government Audit Officer drafting the final Audit Report for the Public Accounts Committee (PAC) of Pakistan.';
    let prompt = '';

    if (action === 'rephrase_audit_tone') {
      prompt = `Rewrite the following text into the formal, stringent, legally defensible tone prescribed by the Auditor General of Pakistan (AGP):\n\n"${text}"`;
    } else if (action === 'convert_urdu') {
      prompt = `Translate the following audit observation into formal Official Government Urdu (دفتر آڈیٹر جنرل آف پاکستان کی سرکاری اردو زبان) maintaining all financial numbers, references, and rule sections:\n\n"${text}"`;
    } else if (action === 'compliance_check') {
      prompt = `Audit check the following para against PPRA Rules 2004 and GFR. Point out any weak arguments or missing citations:\n\n"${text}"`;
    } else {
      prompt = `Enhance the following audit text: "${text}" with context: ${context || 'Audit observation'}`;
    }

    let resultText = '';
    if (isOpenRouterModel) {
      const openRouterKey = getOpenRouterApiKey();
      if (!openRouterKey) {
        const geminiClient = getGeminiClient();
        if (geminiClient) {
          const geminiRes = await geminiClient.models.generateContent({
            model: 'gemini-3.1-flash',
            contents: prompt,
            config: { systemInstruction: systemPrompt },
          });
          resultText = geminiRes.text || '';
        } else {
          return res.status(400).json({
            success: false,
            error:
              'OpenRouter API Key is not configured. Please add API_KEY in your Vercel Project Settings.',
          });
        }
      } else {
        try {
          resultText = await callOpenRouter(modelToUse, prompt, openRouterKey, {
            isJson: false,
            systemPrompt,
          });
        } catch (openRouterErr: any) {
          const geminiClient = getGeminiClient();
          if (geminiClient) {
            const geminiRes = await geminiClient.models.generateContent({
              model: 'gemini-3.1-flash',
              contents: prompt,
              config: { systemInstruction: systemPrompt },
            });
            resultText = geminiRes.text || '';
          } else {
            throw openRouterErr;
          }
        }
      }
    } else {
      const geminiClient = getGeminiClient();
      if (!geminiClient) {
        return res.status(400).json({
          success: false,
          error: 'GEMINI_API_KEY is not configured in environment variables.',
        });
      }
      const geminiRes = await geminiClient.models.generateContent({
        model: modelToUse.startsWith('gemini-') ? modelToUse : 'gemini-3.1-flash',
        contents: prompt,
        config: { systemInstruction: systemPrompt },
      });
      resultText = geminiRes.text || '';
    }

    return res.json({ success: true, result: resultText });
  } catch (err: any) {
    console.error('Error in editor-ai:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// General Chatbot Endpoint
const CHAT_SYSTEM_PROMPT = `
You are CAP-AI, the official intelligent digital assistant for the Government of Pakistan Commercial Audit Department.
You assist auditors, officers, and administrators with statutory compliance inquiries, general auditing procedures, procurement rules (PPRA Rules 2004), General Financial Rules (GFR), and general questions.
Provide authoritative, polite, well-formatted responses using Markdown (including **bold**, *italics*, bullet lists, and clear paragraphs).
`;

app.post(['/api/chat', '/chat'], async (req: Request, res: Response) => {
  try {
    const { message, selectedModel } = req.body;
    if (!message || !message.trim()) {
      return res.status(400).json({ success: false, error: 'Message cannot be empty.' });
    }

    const modelToUse = selectedModel || 'nvidia/nemotron-3.5-lightning:free';
    const isOpenRouterModel =
      modelToUse.includes(':free') ||
      modelToUse.includes('/') ||
      modelToUse.includes('cohere') ||
      modelToUse.includes('liquid') ||
      modelToUse.includes('nvidia');

    let responseText = '';

    if (isOpenRouterModel) {
      const openRouterKey = getOpenRouterApiKey();
      if (!openRouterKey) {
        const geminiClient = getGeminiClient();
        if (geminiClient) {
          const geminiRes = await geminiClient.models.generateContent({
            model: 'gemini-3.1-flash',
            contents: message,
            config: { systemInstruction: CHAT_SYSTEM_PROMPT },
          });
          responseText = geminiRes.text || '';
        } else {
          return res.status(400).json({
            success: false,
            error:
              'OpenRouter API Key (API_KEY) is not configured in Vercel environment variables. Please add "API_KEY" or "OPENROUTER_API_KEY" in Vercel Project Settings.',
          });
        }
      } else {
        try {
          responseText = await callOpenRouter(modelToUse, message, openRouterKey, {
            isJson: false,
            systemPrompt: CHAT_SYSTEM_PROMPT,
          });
        } catch (openRouterErr: any) {
          const geminiClient = getGeminiClient();
          if (geminiClient) {
            console.warn('Chat OpenRouter call failed, falling back to Gemini:', openRouterErr.message);
            const geminiRes = await geminiClient.models.generateContent({
              model: 'gemini-3.1-flash',
              contents: message,
              config: { systemInstruction: CHAT_SYSTEM_PROMPT },
            });
            responseText = geminiRes.text || '';
          } else {
            throw openRouterErr;
          }
        }
      }
    } else {
      const geminiClient = getGeminiClient();
      if (!geminiClient) {
        return res.status(400).json({
          success: false,
          error:
            'GEMINI_API_KEY is not configured in environment variables. Please add GEMINI_API_KEY in Vercel Project Settings.',
        });
      }
      const geminiRes = await geminiClient.models.generateContent({
        model: modelToUse.startsWith('gemini-') ? modelToUse : 'gemini-3.1-flash',
        contents: message,
        config: { systemInstruction: CHAT_SYSTEM_PROMPT },
      });
      responseText = geminiRes.text || '';
    }

    return res.json({ success: true, response: responseText });
  } catch (err: any) {
    console.error('Error in chat:', err);
    return res.status(500).json({
      success: false,
      error:
        err.message ||
        'Failed to generate response. OpenRouter free models may be congested. Try switching models or check your API key.',
    });
  }
});

// Server Initialization
async function startServer() {
  if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
    const { createServer: createViteServer } = await import('vite');
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

// In local dev and full-stack mode, start the HTTP server.
// In Vercel serverless environment (process.env.VERCEL), the exported app handles requests.
if (!process.env.VERCEL) {
  startServer();
}

export default app;
