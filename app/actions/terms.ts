// app/actions/terms.ts
'use server';

import { getTermsContent, getTermsVersion } from '@/app/lib/getTerms';

export async function fetchTermsContent() {
  return await getTermsContent();
}

export async function getTermsVersionAction() {
  return getTermsVersion();
}