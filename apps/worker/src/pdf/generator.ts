import puppeteer, { Browser } from 'puppeteer';
import { createClient } from '@supabase/supabase-js';
import { renderReportHTML, AuditWithResults } from './report-renderer';
import { prisma } from '../lib/db';

const PDF_TIMEOUT_MS = 30_000;
const PDF_BUCKET = 'reports';

let browserInstance: Browser | null = null;

async function getBrowser(): Promise<Browser> {
  if (browserInstance && browserInstance.connected) return browserInstance;
  browserInstance = await puppeteer.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--no-first-run',
      '--no-zygote',
      '--single-process',
    ],
  });
  return browserInstance;
}

function getSupabaseAdmin() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Supabase env vars not configured');
  return createClient(url, key);
}

/**
 * Generate a PDF report for an audit and upload to Supabase Storage.
 * Returns the public URL of the uploaded PDF.
 */
export async function generatePDF(auditId: string): Promise<string> {
  const audit = await prisma.audit.findUniqueOrThrow({
    where: { id: auditId },
    include: {
      user: { select: { name: true, email: true } },
      auditResult: true,
      aiRecommendations: { orderBy: { severity: 'asc' }, take: 5 },
      reports: { select: { shareToken: true }, take: 1 },
    },
  });

  const auditData: AuditWithResults = {
    id: audit.id,
    url: audit.url,
    createdAt: audit.createdAt,
    completedAt: audit.completedAt,
    user: audit.user,
    auditResult: audit.auditResult
      ? {
          performanceScore: audit.auditResult.performanceScore,
          accessibilityScore: audit.auditResult.accessibilityScore,
          seoScore: audit.auditResult.seoScore,
          bestPracticesScore: audit.auditResult.bestPracticesScore,
          issues: (audit.auditResult.issues as any[]) ?? [],
        }
      : null,
    aiRecommendations: audit.aiRecommendations.map((r) => ({
      title: r.title,
      severity: r.severity,
      description: r.description,
      fix_suggestion: r.fixSuggestion,
    })),
    report: audit.reports[0] ?? null,
  };

  const html = renderReportHTML(auditData);
  const browser = await getBrowser();
  const page = await browser.newPage();

  try {
    await page.setViewport({ width: 1200, height: 900 });
    await page.setContent(html, {
      waitUntil: 'networkidle0',
      timeout: PDF_TIMEOUT_MS,
    });

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '20px', bottom: '20px', left: '20px', right: '20px' },
    });

    // Upload to Supabase Storage (public bucket)
    const supabase = getSupabaseAdmin();
    const storagePath = `${audit.userId}/${auditId}/report.pdf`;

    const { error: uploadError } = await supabase.storage
      .from(PDF_BUCKET)
      .upload(storagePath, pdfBuffer, {
        contentType: 'application/pdf',
        upsert: true,
        cacheControl: '3600',
      });

    if (uploadError) {
      throw new Error(`Supabase Storage upload failed: ${uploadError.message}`);
    }

    // Get permanent public URL (not signed — bucket must be public)
    const { data: urlData } = supabase.storage.from(PDF_BUCKET).getPublicUrl(storagePath);
    const pdfUrl = urlData.publicUrl;

    // Persist PDF URL on the report record
    await prisma.report.updateMany({
      where: { auditId },
      data: { pdfUrl },
    });

    console.log(`[PDF] Generated for audit ${auditId}: ${pdfUrl} (${pdfBuffer.length} bytes)`);
    return pdfUrl;
  } finally {
    await page.close();
  }
}

// Graceful browser cleanup on worker shutdown
process.on('SIGTERM', async () => {
  if (browserInstance) {
    await browserInstance.close();
    browserInstance = null;
  }
});
