import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import ReactMarkdown from 'react-markdown';
import { phaseConfigs } from '@/constants/phases';
import type { Project } from '@/types';

interface ExportOptions {
  project: Project;
  phaseOutputs: Record<string, string>;
  phaseStatus: Record<string, string>;
}

const PRINT_STYLES = `
  * { box-sizing: border-box; }
  html, body {
    margin: 0;
    padding: 0;
    background: #ffffff;
    color: #111827;
    font-family: 'DM Sans', system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
    line-height: 1.55;
    font-size: 12pt;
  }
  .doc {
    padding: 32px 40px;
    max-width: 920px;
    margin: 0 auto;
  }
  .cover {
    page-break-after: always;
    text-align: center;
    padding-top: 120px;
  }
  .cover h1 {
    font-size: 36pt;
    margin: 0 0 12px;
    font-family: 'Syne', system-ui, sans-serif;
    color: #1A6FD4;
  }
  .cover p { color: #4b5563; margin: 6px 0; }
  .cover .meta {
    margin-top: 48px;
    font-size: 11pt;
    color: #6b7280;
  }
  .toc { page-break-after: always; }
  .toc h2 {
    font-family: 'Syne', system-ui, sans-serif;
    color: #1A6FD4;
    border-bottom: 2px solid #1A6FD4;
    padding-bottom: 6px;
  }
  .toc ol { padding-left: 24px; }
  .toc li { margin: 6px 0; font-size: 12pt; }
  .toc .status {
    margin-left: 8px;
    font-size: 10pt;
    color: #6b7280;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }
  .phase {
    page-break-before: always;
  }
  .phase-header {
    border-bottom: 2px solid #1A6FD4;
    padding-bottom: 8px;
    margin-bottom: 16px;
  }
  .phase-header .step {
    font-size: 10pt;
    color: #F97316;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    font-weight: 700;
  }
  .phase-header h1 {
    font-family: 'Syne', system-ui, sans-serif;
    margin: 4px 0;
    font-size: 22pt;
    color: #111827;
  }
  .phase-header .desc {
    color: #4b5563;
    font-size: 11pt;
    margin: 0;
  }
  .phase-empty {
    color: #9ca3af;
    font-style: italic;
    padding: 24px;
    border: 1px dashed #d1d5db;
    border-radius: 8px;
    text-align: center;
  }
  h1, h2, h3, h4 { font-family: 'Syne', system-ui, sans-serif; color: #111827; }
  h2 { font-size: 16pt; margin-top: 18px; }
  h3 { font-size: 13pt; margin-top: 14px; }
  p { margin: 8px 0; }
  ul, ol { padding-left: 22px; margin: 8px 0; }
  li { margin: 3px 0; }
  table { border-collapse: collapse; width: 100%; margin: 12px 0; }
  th, td { border: 1px solid #d1d5db; padding: 6px 8px; text-align: left; font-size: 10.5pt; }
  th { background: #f3f4f6; }
  code {
    background: #f3f4f6;
    padding: 1px 4px;
    border-radius: 3px;
    font-size: 10.5pt;
  }
  pre {
    background: #f9fafb;
    border: 1px solid #e5e7eb;
    border-radius: 6px;
    padding: 10px;
    overflow: auto;
    page-break-inside: avoid;
  }
  blockquote {
    border-left: 4px solid #1A6FD4;
    margin: 12px 0;
    padding: 4px 12px;
    color: #4b5563;
    background: #f9fafb;
  }
  @media print {
    .doc { padding: 0 12px; }
    .no-print { display: none !important; }
    a { color: #1A6FD4; text-decoration: none; }
  }
  @page { margin: 18mm; }
`;

const renderMarkdown = (md: string): string => {
  try {
    return renderToStaticMarkup(<ReactMarkdown>{md}</ReactMarkdown>);
  } catch (err) {
    console.error('Markdown render failed', err);
    const escaped = md
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    return `<pre>${escaped}</pre>`;
  }
};

const escapeHtml = (s: string): string =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export const exportFullProjectPdf = ({ project, phaseOutputs, phaseStatus }: ExportOptions): boolean => {
  const isCompleted = (id: string) =>
    (phaseStatus[id] || '').toLowerCase() === 'completed';

  const completedWithContent = phaseConfigs.filter(
    (p) => isCompleted(p.id) && phaseOutputs[p.id]
  );
  // Prefer completed phases. Fall back to any phase with content so users
  // can still export an in-progress project rather than getting nothing.
  const includedPhases = completedWithContent.length
    ? completedWithContent
    : phaseConfigs.filter((p) => phaseOutputs[p.id]);
  if (!includedPhases.length) {
    return false;
  }

  const exportDate = new Date().toLocaleString();

  const tocItems = includedPhases
    .map((p, idx) => {
      const status = (phaseStatus[p.id] || '').toLowerCase().replace('_', ' ');
      const statusLabel = status ? `<span class="status">— ${escapeHtml(status)}</span>` : '';
      return `<li>${idx + 1}. ${escapeHtml(p.title)}${statusLabel}</li>`;
    })
    .join('');

  const phaseSections = includedPhases
    .map((p) => {
      const md = phaseOutputs[p.id] || '';
      const body = md
        ? renderMarkdown(md)
        : '<div class="phase-empty">No content generated for this phase yet.</div>';
      return `
        <section class="phase">
          <div class="phase-header">
            <div class="step">Phase ${p.stepNumber}</div>
            <h1>${escapeHtml(p.title)}</h1>
            <p class="desc">${escapeHtml(p.description || '')}</p>
          </div>
          ${body}
        </section>
      `;
    })
    .join('\n');

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(project.name)} — Full Project Export</title>
  <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&family=Syne:wght@600;700&display=swap" rel="stylesheet" />
  <style>${PRINT_STYLES}</style>
</head>
<body>
  <div class="doc">
    <section class="cover">
      <h1>${escapeHtml(project.name)}</h1>
      ${project.description ? `<p>${escapeHtml(project.description)}</p>` : ''}
      <div class="meta">
        <p>Owner: ${escapeHtml(project.owner_name || 'Unassigned')}</p>
        <p>Type: ${escapeHtml((project.template_type || '').replace('_', ' '))}</p>
        <p>Status: ${escapeHtml(project.status || '')}</p>
        <p>Generated: ${escapeHtml(exportDate)}</p>
      </div>
    </section>
    <section class="toc">
      <h2>Table of Contents</h2>
      <ol>${tocItems}</ol>
    </section>
    ${phaseSections}
  </div>
  <script>
    window.addEventListener('load', function () {
      setTimeout(function () {
        window.focus();
        window.print();
      }, 400);
    });
  </script>
</body>
</html>`;

  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    return false;
  }
  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
  return true;
};
