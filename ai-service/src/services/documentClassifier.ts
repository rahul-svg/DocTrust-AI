import { ChatOpenAI } from '@langchain/openai';
import { PromptTemplate } from '@langchain/core/prompts';
import { JsonOutputParser } from '@langchain/core/output_parsers';

export const DOCUMENT_TYPES = [
  'identity_card',
  'passport',
  'drivers_license',
  'invoice',
  'contract',
  'certificate',
  'bank_statement',
  'tax_document',
  'medical_record',
  'unknown',
] as const;

export type DocumentType = (typeof DOCUMENT_TYPES)[number];

const classificationPrompt = PromptTemplate.fromTemplate(
  `You are a document classification expert. Analyse the OCR text below and identify the document type.

Allowed types: {types}

Reply with ONLY a JSON object — no markdown, no explanation.
Example: {{"documentType":"passport","confidence":0.92}}

OCR Text:
{text}`
);

export async function classifyDocument(
  ocrText: string
): Promise<{ documentType: DocumentType; confidence: number }> {
  if (!process.env.OPENAI_API_KEY) {
    return { documentType: 'unknown', confidence: 0.5 };
  }

  try {
    const model = new ChatOpenAI({
      model: 'gpt-4o-mini',
      temperature: 0,
      apiKey: process.env.OPENAI_API_KEY,
    });
    const parser = new JsonOutputParser<{ documentType: string; confidence: number }>();
    const chain = classificationPrompt.pipe(model).pipe(parser);

    const result = await chain.invoke({
      types: DOCUMENT_TYPES.join(', '),
      text: ocrText.slice(0, 3000),
    });

    return {
      documentType: (DOCUMENT_TYPES as readonly string[]).includes(result.documentType)
        ? (result.documentType as DocumentType)
        : 'unknown',
      confidence: Math.min(1, Math.max(0, Number(result.confidence) || 0.5)),
    };
  } catch {
    return { documentType: 'unknown', confidence: 0.5 };
  }
}
