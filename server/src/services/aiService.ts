import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';

const AI_BASE = process.env.AI_SERVICE_URL || 'http://localhost:8000';

export async function runOcr(filePath: string, mimeType: string): Promise<string> {
  const form = new FormData();
  form.append('file', fs.createReadStream(filePath), { contentType: mimeType });

  const { data } = await axios.post<{ text: string }>(`${AI_BASE}/ocr`, form, {
    headers: form.getHeaders(),
    timeout: 120_000,
  });

  return data.text;
}
