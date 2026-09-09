import { ChatOpenAI } from '@langchain/openai';
import { PromptTemplate } from '@langchain/core/prompts';
import { JsonOutputParser } from '@langchain/core/output_parsers';
import type { DocumentType } from './documentClassifier';

const FIELD_SCHEMAS: Partial<Record<DocumentType, string[]>> = {
  identity_card: ['name', 'dateOfBirth', 'documentNumber', 'expiryDate', 'nationality', 'address'],
  passport: ['name', 'dateOfBirth', 'documentNumber', 'expiryDate', 'nationality', 'issuingCountry'],
  drivers_license: ['name', 'dateOfBirth', 'documentNumber', 'expiryDate', 'address', 'licenseClass'],
  invoice: ['invoiceNumber', 'date', 'dueDate', 'totalAmount', 'vendor', 'recipient', 'currency'],
  contract: ['parties', 'contractDate', 'effectiveDate', 'expiryDate', 'jurisdiction'],
  certificate: ['recipientName', 'certificateTitle', 'issueDate', 'issuingAuthority', 'certificateNumber'],
  bank_statement: ['accountHolder', 'accountNumber', 'bankName', 'statementDate', 'openingBalance', 'closingBalance'],
  tax_document: ['taxpayerName', 'taxId', 'taxYear', 'totalIncome', 'taxAmount'],
  medical_record: ['patientName', 'dateOfBirth', 'recordDate', 'diagnosis', 'physician'],
};

const DEFAULT_FIELDS = ['name', 'date', 'referenceNumber'];

/** The fields the schema expects for a document type — used for confidence scoring. */
export function getExpectedFields(documentType: DocumentType | string): string[] {
  return FIELD_SCHEMAS[documentType as DocumentType] ?? DEFAULT_FIELDS;
}

const extractionPrompt = PromptTemplate.fromTemplate(
  `You are a document data extraction specialist.

Extract the following fields from the OCR text of a {documentType} document.
Fields: {fields}

Return ONLY a JSON object where each key is a field name and the value is the extracted string.
Use null for fields not found. No markdown, no extra text.

OCR Text:
{text}`
);

export async function extractFields(
  ocrText: string,
  documentType: DocumentType
): Promise<Record<string, string>> {
  if (!process.env.OPENAI_API_KEY) {
    return {};
  }

  const fields = getExpectedFields(documentType);

  try {
    const model = new ChatOpenAI({
      model: 'gpt-4o-mini',
      temperature: 0,
      apiKey: process.env.OPENAI_API_KEY,
    });
    const parser = new JsonOutputParser<Record<string, string | null>>();
    const chain = extractionPrompt.pipe(model).pipe(parser);

    const raw = await chain.invoke({
      documentType,
      fields: fields.join(', '),
      text: ocrText.slice(0, 3000),
    });

    return Object.fromEntries(
      Object.entries(raw).filter(([, v]) => v !== null && v !== undefined && v !== '')
    ) as Record<string, string>;
  } catch {
    return {};
  }
}
