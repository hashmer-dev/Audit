import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

export function getOpenRouterKey(): string {
  return process.env.API_KEY || process.env.OPENROUTER_API_KEY || process.env.OPEN_ROUTER_API_KEY || '';
}

export function getGeminiKey(): string {
  return process.env.API_FOR_GEMINI || process.env.GEMINI_API_KEY || process.env.GEMINI_API || process.env.API_KEY_GEMINI || '';
}

export const AUDIT_SYSTEM_PROMPT = `
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

export async function callOpenRouter(
  model: string,
  prompt: string,
  apiKey: string,
  systemPrompt: string = AUDIT_SYSTEM_PROMPT,
  jsonMode: boolean = true
) {
  const bodyPayload: any = {
    model: model,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: prompt },
    ],
  };

  if (jsonMode) {
    bodyPayload.response_format = { type: 'json_object' };
  }

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'HTTP-Referer': process.env.APP_URL || 'https://aistudio.google.com',
      'X-Title': 'Government of Pakistan CAP-AI Audit Workbench',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(bodyPayload),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`OpenRouter API error (${model}): ${response.status} - ${errText}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || (jsonMode ? '{}' : '');
}

export function createGeminiClient(geminiKey: string) {
  return new GoogleGenAI({
    apiKey: geminiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// 1. Audit Analysis Handler
export async function handleAuditAnalysis(body: any) {
  const { entityName, financialYear, auditScope, documents, query, selectedModel } = body;

  if (!documents || documents.length === 0) {
    throw new Error('No evidence documents attached. Please upload financial vouchers, ledgers, or procurement files to audit.');
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
    const openRouterKey = getOpenRouterKey();
    if (!openRouterKey) {
      throw new Error('OpenRouter API Key is missing. In Vercel Environment Variables, please add API_KEY.');
    }
    responseText = await callOpenRouter(modelToUse, userPrompt, openRouterKey, AUDIT_SYSTEM_PROMPT, true);
  } else {
    const geminiKey = getGeminiKey();
    if (!geminiKey) {
      throw new Error('Gemini API Key is missing. In Vercel Environment Variables, please add API_FOR_GEMINI or GEMINI_API_KEY.');
    }

    const ai = createGeminiClient(geminiKey);
    const geminiRes = await ai.models.generateContent({
      model: modelToUse.startsWith('gemini-') ? modelToUse : 'gemini-1.5-flash',
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
  return parsedData;
}

// 2. In-Editor AI Handler
export async function handleEditorAi(body: any) {
  const { action, text, context, selectedModel } = body;
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
    const openRouterKey = getOpenRouterKey();
    if (!openRouterKey) {
      throw new Error('OpenRouter API Key is missing. In Vercel Environment Variables, please add API_KEY.');
    }
    const raw = await callOpenRouter(modelToUse, prompt, openRouterKey, systemPrompt, false);
    try {
      const parsed = JSON.parse(raw);
      resultText = parsed.result || parsed.response || parsed.content || raw;
    } catch {
      resultText = raw;
    }
  } else {
    const geminiKey = getGeminiKey();
    if (!geminiKey) {
      throw new Error('Gemini API Key is missing. In Vercel Environment Variables, please add API_FOR_GEMINI or GEMINI_API_KEY.');
    }
    const ai = createGeminiClient(geminiKey);
    const geminiRes = await ai.models.generateContent({
      model: modelToUse.startsWith('gemini-') ? modelToUse : 'gemini-1.5-flash',
      contents: prompt,
      config: { systemInstruction: systemPrompt },
    });
    resultText = geminiRes.text || '';
  }

  return resultText;
}

// 3. General Chatbot Handler
export async function handleChat(body: any) {
  const { message, selectedModel } = body;
  if (!message || !message.trim()) {
    throw new Error('Message cannot be empty.');
  }

  const modelToUse = selectedModel || 'nvidia/nemotron-3.5-lightning:free';
  const isOpenRouterModel = modelToUse.includes(':free') || modelToUse.includes('/') || modelToUse.includes('cohere') || modelToUse.includes('liquid') || modelToUse.includes('nvidia');

  let responseText = '';

  if (isOpenRouterModel) {
    const openRouterKey = getOpenRouterKey();
    if (!openRouterKey) {
      throw new Error('OpenRouter API Key is missing. In Vercel Environment Variables, please add API_KEY.');
    }
    responseText = await callOpenRouter(
      modelToUse,
      message,
      openRouterKey,
      'You are a helpful, knowledgeable Government of Pakistan Commercial Audit assistant. Answer questions clearly with rich formatting including bold, italics, tables, and bullet points where helpful.',
      false
    );
  } else {
    const geminiKey = getGeminiKey();
    if (!geminiKey) {
      throw new Error('Gemini API Key is missing. In Vercel Environment Variables, please add API_FOR_GEMINI or GEMINI_API_KEY.');
    }
    const ai = createGeminiClient(geminiKey);
    const geminiRes = await ai.models.generateContent({
      model: modelToUse.startsWith('gemini-') ? modelToUse : 'gemini-1.5-flash',
      contents: message,
    });
    responseText = geminiRes.text || '';
  }

  return responseText;
}
