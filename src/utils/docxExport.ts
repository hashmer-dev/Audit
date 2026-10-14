import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  HeadingLevel,
  AlignmentType,
  BorderStyle,
  WidthType,
  ShadingType,
} from 'docx';
import { AuditPara } from '../types/audit';

export async function exportReportToDocx(params: {
  entityName: string;
  financialYear: string;
  auditScope: string;
  executiveSummary?: string;
  totalAmount?: string;
  paras: AuditPara[];
  reportTitle?: string;
}) {
  const { entityName, financialYear, auditScope, executiveSummary, totalAmount, paras, reportTitle } = params;

  // Title section
  const docChildren: any[] = [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 120 },
      children: [
        new TextRun({
          text: 'GOVERNMENT OF PAKISTAN',
          bold: true,
          size: 28,
          color: '0A192F',
          font: 'Times New Roman',
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 120 },
      children: [
        new TextRun({
          text: 'DEPARTMENT OF THE AUDITOR GENERAL OF PAKISTAN',
          bold: true,
          size: 24,
          color: '065F46',
          font: 'Times New Roman',
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 240 },
      children: [
        new TextRun({
          text: 'COMMERCIAL AUDIT WING - DIRECTORATE GENERAL COMMERCIAL AUDIT',
          italics: true,
          size: 20,
          color: '475569',
          font: 'Times New Roman',
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 },
      children: [
        new TextRun({
          text: reportTitle || `DRAFT AUDIT REPORT (DAR) FOR THE FINANCIAL YEAR ${financialYear}`,
          bold: true,
          underline: {},
          size: 26,
          color: '0F172A',
          font: 'Times New Roman',
        }),
      ],
    }),

    // Entity & Metadata Table
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          children: [
            new TableCell({
              width: { size: 30, type: WidthType.PERCENTAGE },
              shading: { type: ShadingType.CLEAR, fill: 'F1F5F9' },
              children: [new Paragraph({ children: [new TextRun({ text: 'Name of Entity / PSE:', bold: true })] })],
            }),
            new TableCell({
              width: { size: 70, type: WidthType.PERCENTAGE },
              children: [new Paragraph({ children: [new TextRun({ text: entityName })] })],
            }),
          ],
        }),
        new TableRow({
          children: [
            new TableCell({
              width: { size: 30, type: WidthType.PERCENTAGE },
              shading: { type: ShadingType.CLEAR, fill: 'F1F5F9' },
              children: [new Paragraph({ children: [new TextRun({ text: 'Financial Year Audited:', bold: true })] })],
            }),
            new TableCell({
              width: { size: 70, type: WidthType.PERCENTAGE },
              children: [new Paragraph({ children: [new TextRun({ text: financialYear })] })],
            }),
          ],
        }),
        new TableRow({
          children: [
            new TableCell({
              width: { size: 30, type: WidthType.PERCENTAGE },
              shading: { type: ShadingType.CLEAR, fill: 'F1F5F9' },
              children: [new Paragraph({ children: [new TextRun({ text: 'Audit Scope / Assignment:', bold: true })] })],
            }),
            new TableCell({
              width: { size: 70, type: WidthType.PERCENTAGE },
              children: [new Paragraph({ children: [new TextRun({ text: auditScope })] })],
            }),
          ],
        }),
        new TableRow({
          children: [
            new TableCell({
              width: { size: 30, type: WidthType.PERCENTAGE },
              shading: { type: ShadingType.CLEAR, fill: 'F1F5F9' },
              children: [new Paragraph({ children: [new TextRun({ text: 'Total Detected Irregularities:', bold: true })] })],
            }),
            new TableCell({
              width: { size: 70, type: WidthType.PERCENTAGE },
              children: [new Paragraph({ children: [new TextRun({ text: totalAmount || 'Calculated in Report', bold: true, color: 'B91C1C' })] })],
            }),
          ],
        }),
      ],
    }),

    new Paragraph({ spacing: { before: 300, after: 120 } }),

    // Executive Summary
    new Paragraph({
      heading: HeadingLevel.HEADING_2,
      children: [
        new TextRun({
          text: '1. EXECUTIVE SUMMARY & SYSTEMIC DEFICIENCIES',
          bold: true,
          size: 22,
          color: '0A192F',
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 300 },
      children: [
        new TextRun({
          text: executiveSummary || 'During the commercial compliance and proprietary audit, multiple instances of non-compliance with the Public Procurement Rules 2004, General Financial Rules, and statutory tax obligations were identified. Immediate fixation of responsibility upon delinquent officers and recovery is directed.',
          font: 'Times New Roman',
          size: 22,
        }),
      ],
    }),

    // Section 2: Audit Paras
    new Paragraph({
      heading: HeadingLevel.HEADING_2,
      children: [
        new TextRun({
          text: '2. DETAILED DRAFT AUDIT PARAS (DP / PAO)',
          bold: true,
          size: 22,
          color: '0A192F',
        }),
      ],
    }),
  ];

  // Append each Para in official Pakistan Audit format
  paras.forEach((para, index) => {
    docChildren.push(
      new Paragraph({
        spacing: { before: 240, after: 100 },
        children: [
          new TextRun({
            text: `PARA NO. ${index + 1} (${para.paoNumber}): ${para.title.toUpperCase()}`,
            bold: true,
            size: 22,
            color: '065F46',
            font: 'Times New Roman',
          }),
        ],
      }),

      // Financial Impact Box
      new Paragraph({
        spacing: { after: 100 },
        children: [
          new TextRun({ text: 'AMOUNT INVOLVED: ', bold: true, size: 20 }),
          new TextRun({ text: `${para.amountFormatted}`, bold: true, color: 'B91C1C', size: 20 }),
          new TextRun({ text: `   |   CATEGORY: ${para.category}   |   RISK: ${para.riskLevel}`, italics: true, size: 18 }),
        ],
      }),

      // Statement of Facts
      new Paragraph({
        spacing: { before: 80, after: 60 },
        children: [new TextRun({ text: 'Statement of Facts:', bold: true, size: 20, underline: {} })],
      }),
      new Paragraph({
        alignment: AlignmentType.JUSTIFIED,
        spacing: { after: 100 },
        children: [new TextRun({ text: para.statementOfFacts, font: 'Times New Roman', size: 21 })],
      }),

      // Rule Violated
      new Paragraph({
        spacing: { before: 60, after: 60 },
        children: [new TextRun({ text: 'Rule / Authority Violated:', bold: true, size: 20, underline: {} })],
      }),
      new Paragraph({
        alignment: AlignmentType.JUSTIFIED,
        spacing: { after: 100 },
        children: [new TextRun({ text: para.ruleViolated, font: 'Times New Roman', size: 21, bold: true, color: '1E3A8A' })],
      }),

      // Recommendation
      new Paragraph({
        spacing: { before: 60, after: 60 },
        children: [new TextRun({ text: "Auditor's Recommendation & Action Required:", bold: true, size: 20, underline: {} })],
      }),
      new Paragraph({
        alignment: AlignmentType.JUSTIFIED,
        spacing: { after: 120 },
        children: [new TextRun({ text: para.auditorRecommendation, font: 'Times New Roman', size: 21 })],
      })
    );

    // Citations
    if (para.citations && para.citations.length > 0) {
      docChildren.push(
        new Paragraph({
          spacing: { after: 60 },
          children: [new TextRun({ text: 'Evidentiary Cross-References (Click-to-Source):', bold: true, size: 18, color: '475569' })],
        })
      );
      para.citations.forEach((cit) => {
        docChildren.push(
          new Paragraph({
            spacing: { after: 40 },
            bullet: { level: 0 },
            children: [
              new TextRun({
                text: `[Ref: ${cit.sourceFile} | Page ${cit.pageNumber}${cit.lineNumber ? ` | Line ${cit.lineNumber}` : ''}] "${cit.highlightSnippet}"`,
                size: 18,
                italics: true,
                color: '334155',
              }),
            ],
          })
        );
      });
    }

    // Divider line between paras
    docChildren.push(
      new Paragraph({
        spacing: { before: 120, after: 200 },
        border: { bottom: { color: 'CBD5E1', space: 1, style: BorderStyle.SINGLE, size: 6 } },
        children: [],
      })
    );
  });

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: docChildren,
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const sanitizedName = entityName.replace(/[^a-zA-Z0-9]/g, '_');
  const filename = `DAR_${sanitizedName}_${financialYear}.docx`;

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
