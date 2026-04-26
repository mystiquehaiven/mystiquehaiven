// app/terms/page.tsx
import fs from 'fs';
import path from 'path';
import { marked } from 'marked'; // npm install marked

export default async function TermsPage() {
  const filePath = path.join(process.cwd(), 'app/content/terms.md');
  const fileContents = fs.readFileSync(filePath, 'utf8');
  const html = await marked(fileContents);

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  );
}