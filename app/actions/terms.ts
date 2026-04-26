// app/actions/terms.ts
'use server';

import { getTermsContent, getTermsVersion } from '@/lib/getTerms';

export async function fetchTermsContent() {
  return await getTermsContent();
}

export function getTermsVersionAction() {
  return getTermsVersion();
}