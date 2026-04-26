// lib/getTerms.ts
import fs from 'fs';
import path from 'path';
import { marked } from 'marked';

const TERMS_VERSION = "1.0";

export async function getTermsContent(): Promise<string> {
  try {
    const filePath = path.join(process.cwd(), 'app/content/terms.md');
    const fileContents = fs.readFileSync(filePath, 'utf8');
    return await marked(fileContents);
  } catch (error) {
    console.error('Failed to load terms:', error);
    return '<p>Error loading terms. Please try again.</p>';
  }
}

export function getTermsVersion(): string {
  return TERMS_VERSION;
}