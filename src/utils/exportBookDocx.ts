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
  WidthType,
  BorderStyle,
  ShadingType,
  PageBreak,
  Header,
  Footer,
  PageNumber,
  ImageRun,
  VerticalAlign,
} from 'docx';

export interface ExportDocxResult {
  fileName: string;
  sizeBytes: number;
  sizeLabel: string;
}

function hexClean(color?: string | null, fallback = '1E3A8A'): string {
  if (!color) return fallback;
  const clean = color.replace('#', '').trim();
  return /^[0-9a-fA-F]{6}$/.test(clean) ? clean.toUpperCase() : fallback;
}

function tintHex(hex: string, factor = 0.9): string {
  const clean = hexClean(hex, '1E3A8A');
  const r = Math.round(parseInt(clean.slice(0, 2), 16) * (1 - factor) + 255 * factor);
  const g = Math.round(parseInt(clean.slice(2, 4), 16) * (1 - factor) + 255 * factor);
  const b = Math.round(parseInt(clean.slice(4, 6), 16) * (1 - factor) + 255 * factor);
  return [r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('').toUpperCase();
}

async function fetchImageBytes(
  url: string
): Promise<{ data: Uint8Array; width: number; height: number; type: 'jpg' | 'png' | 'gif' | 'bmp' } | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const blob = await res.blob();
    const arrayBuffer = await blob.arrayBuffer();
    const mimeType = blob.type.toLowerCase();
    const type =
      mimeType === 'image/jpeg'
        ? 'jpg'
        : mimeType === 'image/gif'
        ? 'gif'
        : mimeType === 'image/bmp'
        ? 'bmp'
        : 'png';

    const dimensions = await new Promise<{ width: number; height: number }>((resolve) => {
      const img = new Image();
      const objUrl = URL.createObjectURL(blob);
      img.onload = () => {
        const w = img.naturalWidth || 200;
        const h = img.naturalHeight || 200;
        URL.revokeObjectURL(objUrl);
        resolve({ width: w, height: h });
      };
      img.onerror = () => {
        URL.revokeObjectURL(objUrl);
        resolve({ width: 200, height: 200 });
      };
      img.src = objUrl;
    });

    return {
      data: new Uint8Array(arrayBuffer),
      width: dimensions.width,
      height: dimensions.height,
      type,
    };
  } catch {
    return null;
  }
}

function getAlignment(el: Element): (typeof AlignmentType)[keyof typeof AlignmentType] {
  const style = (el.getAttribute('style') || '').toLowerCase();
  if (style.includes('text-align: center')) return AlignmentType.CENTER;
  if (style.includes('text-align: right')) return AlignmentType.RIGHT;
  if (style.includes('text-align: justify')) return AlignmentType.JUSTIFIED;
  return AlignmentType.LEFT;
}

function extractTextRuns(
  node: Node,
  bodyFont: string,
  inherited: { bold?: boolean; italics?: boolean; underline?: boolean; color?: string; size?: number } = {}
): TextRun[] {
  const runs: TextRun[] = [];

  node.childNodes.forEach((child) => {
    if (child.nodeType === Node.TEXT_NODE) {
      const text = child.textContent || '';
      if (text) {
        runs.push(
          new TextRun({
            text,
            bold: inherited.bold,
            italics: inherited.italics,
            underline: inherited.underline ? {} : undefined,
            color: inherited.color,
            font: bodyFont,
            size: inherited.size || 21,
          })
        );
      }
    } else if (child.nodeType === Node.ELEMENT_NODE) {
      const el = child as HTMLElement;
      const tag = el.tagName.toLowerCase();
      if (tag === 'br') {
        runs.push(new TextRun({ break: 1 }));
        return;
      }
      const next = { ...inherited };
      if (tag === 'strong' || tag === 'b') next.bold = true;
      if (tag === 'em' || tag === 'i') next.italics = true;
      if (tag === 'u') next.underline = true;
      if (el.style?.color && el.style.color.startsWith('#')) {
        next.color = hexClean(el.style.color);
      }
      runs.push(...extractTextRuns(el, bodyFont, next));
    }
  });

  return runs;
}

async function buildDocxCoverParagraphs(
  coverCfg: any,
  primaryHex: string,
  accentHex: string,
  headingFont: string,
  bodyFont: string
): Promise<(Paragraph | Table)[]> {
  const items: (Paragraph | Table)[] = [];
  const isDarkExec = coverCfg?.templateId === 'executive-dark';

  // Top color accent bar
  items.push(
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          children: [
            new TableCell({
              shading: { type: ShadingType.CLEAR, fill: primaryHex, color: 'auto' },
              borders: {
                top: { style: BorderStyle.NONE },
                bottom: { style: BorderStyle.NONE },
                left: { style: BorderStyle.NONE },
                right: { style: BorderStyle.NONE },
              },
              children: [new Paragraph({ spacing: { before: 40, after: 40 }, children: [] })],
            }),
            new TableCell({
              width: { size: 28, type: WidthType.PERCENTAGE },
              shading: { type: ShadingType.CLEAR, fill: accentHex, color: 'auto' },
              borders: {
                top: { style: BorderStyle.NONE },
                bottom: { style: BorderStyle.NONE },
                left: { style: BorderStyle.NONE },
                right: { style: BorderStyle.NONE },
              },
              children: [new Paragraph({ spacing: { before: 40, after: 40 }, children: [] })],
            }),
          ],
        }),
      ],
    })
  );

  items.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 260, after: 140 },
      children: [
        new TextRun({
          text: (coverCfg?.kpmLabel || 'KEMENTERIAN PENDIDIKAN MALAYSIA').toUpperCase(),
          bold: true,
          font: headingFont,
          size: 20,
          color: '475569',
        }),
      ],
    })
  );

  // Logos row (KPM, JPN, PPD, School Logo)
  const logoUrls = [
    coverCfg?.showRegionalLogos !== false ? coverCfg?.kpm_logo_url : '',
    coverCfg?.showRegionalLogos !== false ? coverCfg?.jpn_logo_url : '',
    coverCfg?.showRegionalLogos !== false ? coverCfg?.ppd_logo_url : '',
    coverCfg?.logo_url || '',
  ].filter(Boolean);

  if (logoUrls.length > 0) {
    const logoRuns: ImageRun[] = [];
    for (const url of logoUrls) {
      const asset = await fetchImageBytes(url);
      if (asset) {
        const targetH = 68;
        const ratio = asset.width / (asset.height || 1);
        logoRuns.push(
          new ImageRun({
            data: asset.data,
            type: asset.type,
            transformation: { width: Math.round(targetH * ratio), height: targetH },
          })
        );
      }
    }
    if (logoRuns.length > 0) {
      items.push(
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 100, after: 180 },
          children: logoRuns,
        })
      );
    }
  }

  // School Name
  items.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 80, after: 240 },
      children: [
        new TextRun({
          text: (coverCfg?.schoolName || 'NAMA SEKOLAH').toUpperCase(),
          bold: true,
          font: headingFont,
          size: 30,
          color: primaryHex,
        }),
      ],
    })
  );

  // Title Callout Card
  items.push(
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          children: [
            new TableCell({
              shading: {
                type: ShadingType.CLEAR,
                fill: isDarkExec ? primaryHex : tintHex(primaryHex, 0.93),
                color: 'auto',
              },
              margins: { top: 240, bottom: 240, left: 280, right: 280 },
              borders: {
                left: { style: BorderStyle.SINGLE, size: 24, color: accentHex },
                top: { style: BorderStyle.NONE },
                right: { style: BorderStyle.NONE },
                bottom: { style: BorderStyle.NONE },
              },
              children: [
                new Paragraph({
                  spacing: { after: 80 },
                  children: [
                    new TextRun({
                      text: (coverCfg?.session || 'SESI AKADEMIK 2026/2027').toUpperCase(),
                      bold: true,
                      font: headingFont,
                      size: 22,
                      color: accentHex,
                    }),
                  ],
                }),
                new Paragraph({
                  spacing: { after: 100 },
                  children: [
                    new TextRun({
                      text: (coverCfg?.title || 'BUKU PENGURUSAN SEKOLAH').toUpperCase(),
                      bold: true,
                      font: headingFont,
                      size: 44,
                      color: isDarkExec ? 'FFFFFF' : primaryHex,
                    }),
                  ],
                }),
                ...(coverCfg?.subtitle
                  ? [
                      new Paragraph({
                        spacing: { after: 0 },
                        children: [
                          new TextRun({
                            text: coverCfg.subtitle.toUpperCase(),
                            bold: true,
                            font: bodyFont,
                            size: 18,
                            color: isDarkExec ? 'E2E8F0' : '475569',
                          }),
                        ],
                      }),
                    ]
                  : []),
              ],
            }),
          ],
        }),
      ],
    })
  );

  // School Photograph if uploaded
  if (coverCfg?.cover_photo_url) {
    const photoAsset = await fetchImageBytes(coverCfg.cover_photo_url);
    if (photoAsset) {
      const targetW = 470;
      const ratio = photoAsset.height / (photoAsset.width || 1);
      items.push(
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 240, after: 180 },
          children: [
            new ImageRun({
              data: photoAsset.data,
              type: photoAsset.type,
              transformation: {
                width: targetW,
                height: Math.min(Math.round(targetW * ratio), 220),
              },
            }),
          ],
        })
      );
    }
  }

  // Motto & Footer Address
  if (coverCfg?.motto) {
    items.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 180, after: 120 },
        children: [
          new TextRun({
            text: `"${coverCfg.motto}"`,
            italics: true,
            bold: true,
            font: bodyFont,
            size: 21,
            color: primaryHex,
          }),
        ],
      })
    );
  }

  const contactParts = [
    coverCfg?.schoolCode ? `Kod Sekolah: ${coverCfg.schoolCode}` : '',
    coverCfg?.phone ? `Tel: ${coverCfg.phone}` : '',
    coverCfg?.email ? `Emel: ${coverCfg.email}` : '',
  ].filter(Boolean);

  items.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 220, after: 60 },
      border: { top: { style: BorderStyle.SINGLE, size: 12, color: primaryHex } },
      children: [
        new TextRun({
          text: (coverCfg?.address || '').toUpperCase(),
          bold: true,
          font: bodyFont,
          size: 19,
          color: '1E293B',
        }),
      ],
    })
  );

  if (contactParts.length > 0) {
    items.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 0 },
        children: [
          new TextRun({
            text: contactParts.join('  •  '),
            font: bodyFont,
            size: 18,
            color: '64748B',
          }),
        ],
      })
    );
  }

  return items;
}

export async function exportEditorHtmlToDocx(
  editorHtml: string,
  profile: any
): Promise<ExportDocxResult> {
  const coverCfg = profile?.cover_config || {};
  const primaryHex = hexClean(coverCfg.primaryColor || profile?.primary_color, '1E3A8A');
  const accentHex = hexClean(coverCfg.accentColor || profile?.accent_color, 'D97706');
  const headerTintHex = tintHex(primaryHex, 0.9);
  const headingFont = coverCfg.headingFont || 'Arial';
  const bodyFont = coverCfg.bodyFont || 'Arial';
  const tableStyle = coverCfg.tableStyle || 'corporate-tint';
  const isCenteredEditorial = coverCfg.templateId === 'editorial-minimal';
  const showRunningHeaders = coverCfg.showRunningHeaders !== false;

  const schoolName = coverCfg.schoolName || profile?.name || 'Buku Pengurusan Sekolah';
  const session = profile?.current_session || '2026/2027';

  const container = document.createElement('div');
  container.innerHTML = editorHtml;

  const children: (Paragraph | Table)[] = [];

  const processElement = async (el: Element) => {
    const tag = el.tagName.toLowerCase();

    if (el.hasAttribute('data-book-cover')) {
      let parsedCfg = coverCfg;
      const raw = el.getAttribute('data-cover-config');
      if (raw) {
        try {
          parsedCfg = { ...coverCfg, ...JSON.parse(decodeURIComponent(raw)) };
        } catch {
          // fallback to coverCfg
        }
      }
      const coverItems = await buildDocxCoverParagraphs(
        parsedCfg,
        primaryHex,
        accentHex,
        headingFont,
        bodyFont
      );
      children.push(...coverItems);
      return;
    }

    if (el.hasAttribute('data-page-break')) {
      children.push(new Paragraph({ children: [new PageBreak()] }));
      return;
    }

    if (tag === 'div') {
      for (const child of Array.from(el.children)) {
        await processElement(child);
      }
      return;
    }

    if (el.hasAttribute('data-section-divider')) {
      const sessionLine = el.querySelector('.bb-div-session')?.textContent?.trim() || '';
      const bigNum = el.querySelector('.bb-div-num')?.textContent?.trim() || '';
      const kicker = el.querySelector('.bb-div-kicker')?.textContent?.trim() || '';
      const title = el.querySelector('.bb-div-title')?.textContent?.trim() || '';
      const tagline = el.querySelector('.bb-div-tagline')?.textContent?.trim() || '';
      const meta = el.querySelector('.bb-div-meta')?.textContent?.trim() || '';

      children.push(
        new Paragraph({
          spacing: { before: 1800, after: 400 },
          children: [
            new TextRun({
              text: sessionLine.toUpperCase(),
              bold: true,
              font: headingFont,
              size: 17,
              color: '64748B',
            }),
          ],
        }),
        new Paragraph({
          spacing: { before: 200, after: 80 },
          children: [
            new TextRun({
              text: bigNum,
              bold: true,
              font: headingFont,
              size: 96,
              color: tintHex(primaryHex, 0.72),
            }),
          ],
        }),
        new Paragraph({
          spacing: { before: 60, after: 80 },
          children: [
            new TextRun({
              text: kicker.toUpperCase(),
              bold: true,
              font: headingFont,
              size: 20,
              color: accentHex,
            }),
          ],
        }),
        new Paragraph({
          spacing: { before: 40, after: 220 },
          border: {
            left: { style: BorderStyle.SINGLE, size: 24, color: accentHex },
          },
          indent: { left: 160 },
          children: [
            new TextRun({
              text: title.toUpperCase(),
              bold: true,
              font: headingFont,
              size: 44,
              color: primaryHex,
            }),
          ],
        })
      );

      if (tagline) {
        children.push(
          new Paragraph({
            spacing: { before: 0, after: 260 },
            children: [
              new TextRun({
                text: tagline,
                font: bodyFont,
                size: 22,
                color: '475569',
              }),
            ],
          })
        );
      }

      if (meta) {
        children.push(
          new Paragraph({
            spacing: { before: 120, after: 0 },
            border: {
              top: { style: BorderStyle.SINGLE, size: 10, color: accentHex },
            },
            children: [
              new TextRun({
                text: meta,
                bold: true,
                font: headingFont,
                size: 18,
                color: primaryHex,
              }),
            ],
          })
        );
      }
      return;
    }

    if (tag === 'h1') {
      children.push(
        new Paragraph({
          heading: HeadingLevel.HEADING_1,
          alignment: isCenteredEditorial ? AlignmentType.CENTER : AlignmentType.LEFT,
          keepNext: true,
          spacing: { before: 120, after: 140 },
          border: {
            bottom: { style: BorderStyle.SINGLE, size: 10, color: primaryHex },
          },
          children: [
            new TextRun({
              text: (el.textContent || '').trim().toUpperCase(),
              bold: true,
              color: primaryHex,
              font: headingFont,
              size: 30,
            }),
          ],
        })
      );
      return;
    }

    if (tag === 'h2') {
      const nextIsTable = el.nextElementSibling?.tagName.toLowerCase() === 'table';
      children.push(
        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          alignment: getAlignment(el),
          keepNext: true,
          spacing: { before: 280, after: nextIsTable ? 90 : 110 },
          border: nextIsTable
            ? undefined
            : {
                bottom: { style: BorderStyle.SINGLE, size: 6, color: 'CBD5E1' },
              },
          children: [
            new TextRun({
              text: (el.textContent || '').trim(),
              bold: true,
              color: primaryHex,
              font: headingFont,
              size: 23,
            }),
          ],
        })
      );
      return;
    }

    if (tag === 'h3') {
      children.push(
        new Paragraph({
          heading: HeadingLevel.HEADING_3,
          keepNext: true,
          spacing: { before: 160, after: 70 },
          border: {
            left: { style: BorderStyle.SINGLE, size: 16, color: accentHex },
          },
          indent: { left: 100 },
          children: [
            new TextRun({
              text: ' ' + (el.textContent || '').trim(),
              bold: true,
              color: '1E293B',
              font: headingFont,
              size: 21,
            }),
          ],
        })
      );
      return;
    }

    if (tag === 'blockquote') {
      const runs = extractTextRuns(el, bodyFont);
      children.push(
        new Paragraph({
          alignment: getAlignment(el.querySelector('p') || el),
          spacing: { before: 120, after: 160 },
          indent: { left: 240, right: 240 },
          border: {
            left: { style: BorderStyle.SINGLE, size: 20, color: accentHex },
          },
          shading: { type: ShadingType.CLEAR, fill: 'F8FAFC', color: 'auto' },
          children: runs,
        })
      );
      return;
    }

    if (tag === 'ul' || tag === 'ol') {
      const items = Array.from(el.querySelectorAll(':scope > li'));
      items.forEach((li, idx) => {
        const prefix = tag === 'ol' ? `${idx + 1}. ` : '•  ';
        const runs = extractTextRuns(li, bodyFont);
        children.push(
          new Paragraph({
            alignment: getAlignment(li.querySelector('p') || li),
            spacing: { after: 70 },
            indent: { left: 360 },
            children: [
              new TextRun({ text: prefix, bold: true, font: bodyFont, size: 21, color: accentHex }),
              ...runs,
            ],
          })
        );
      });
      return;
    }

    if (tag === 'p') {
      if (el.classList.contains('bb-chapter-kicker')) {
        children.push(
          new Paragraph({
            alignment: isCenteredEditorial ? AlignmentType.CENTER : AlignmentType.LEFT,
            keepNext: true,
            spacing: { before: 60, after: 30 },
            children: [
              new TextRun({
                text: (el.textContent || '').trim().toUpperCase(),
                bold: true,
                font: headingFont,
                size: 17,
                color: accentHex,
              }),
            ],
          })
        );
        return;
      }

      if (el.classList.contains('bb-chapter-subtitle')) {
        children.push(
          new Paragraph({
            alignment: isCenteredEditorial ? AlignmentType.CENTER : AlignmentType.LEFT,
            keepNext: true,
            spacing: { before: 0, after: 160 },
            children: [
              new TextRun({
                text: (el.textContent || '').trim(),
                font: bodyFont,
                size: 19,
                color: '64748B',
              }),
            ],
          })
        );
        return;
      }

      const img = el.querySelector('img');
      if (img && img.getAttribute('src')) {
        const imgAsset = await fetchImageBytes(img.getAttribute('src')!);
        if (imgAsset) {
          const targetW = 450;
          const ratio = imgAsset.height / (imgAsset.width || 1);
          const targetH = Math.round(targetW * ratio);
          children.push(
            new Paragraph({
              alignment: AlignmentType.CENTER,
              spacing: { before: 120, after: 120 },
              children: [
                new ImageRun({
                  data: imgAsset.data,
                  type: imgAsset.type,
                  transformation: { width: targetW, height: Math.min(targetH, 240) },
                }),
              ],
            })
          );
        }
        return;
      }

      const runs = extractTextRuns(el, bodyFont);
      if (runs.length > 0) {
        children.push(
          new Paragraph({
            alignment: getAlignment(el),
            spacing: { after: 90 },
            children: runs,
          })
        );
      }
      return;
    }

    if (tag === 'table') {
      const isToc = el.classList.contains('toc-table');
      const trs = Array.from(el.querySelectorAll('tr'));
      if (trs.length === 0) return;

      const docRows = trs.map((tr) => {
        const cells = Array.from(tr.querySelectorAll('th, td'));
        const isHeaderRow = cells.some((c) => c.tagName.toLowerCase() === 'th');

        return new TableRow({
          tableHeader: isHeaderRow,
          cantSplit: true,
          children: cells.map((cell) => {
            const isTh = cell.tagName.toLowerCase() === 'th';
            const cellStyle = cell.getAttribute('style') || '';
            const widthMatch = cellStyle.match(/width:\s*(\d+)%/i);
            const colWidthPct = widthMatch ? Number(widthMatch[1]) : undefined;

            const cellRuns = extractTextRuns(cell, isTh ? headingFont : bodyFont, {
              bold: isTh,
              size: isTh ? 19 : 20,
              color: isTh && tableStyle !== 'classic-grid' ? primaryHex : undefined,
            });

            const headerFill =
              tableStyle === 'corporate-tint'
                ? headerTintHex
                : tableStyle === 'classic-grid'
                ? 'F1F5F9'
                : undefined;

            return new TableCell({
              width: colWidthPct
                ? { size: colWidthPct, type: WidthType.PERCENTAGE }
                : undefined,
              verticalAlign: VerticalAlign.CENTER,
              shading:
                isTh && headerFill
                  ? { type: ShadingType.CLEAR, fill: headerFill, color: 'auto' }
                  : undefined,
              margins: { top: 85, bottom: 85, left: 120, right: 120 },
              borders: isToc
                ? {
                    top: { style: BorderStyle.NONE },
                    bottom: { style: BorderStyle.DOTTED, size: 4, color: 'CBD5E1' },
                    left: { style: BorderStyle.NONE },
                    right: { style: BorderStyle.NONE },
                  }
                : tableStyle === 'minimal-lines'
                ? {
                    top: {
                      style: BorderStyle.SINGLE,
                      size: isTh ? 10 : 4,
                      color: isTh ? primaryHex : 'E2E8F0',
                    },
                    bottom: {
                      style: BorderStyle.SINGLE,
                      size: isTh ? 8 : 4,
                      color: isTh ? accentHex : 'E2E8F0',
                    },
                    left: { style: BorderStyle.NONE },
                    right: { style: BorderStyle.NONE },
                  }
                : {
                    top: {
                      style: BorderStyle.SINGLE,
                      size: isTh ? 10 : 4,
                      color: isTh ? primaryHex : 'CBD5E1',
                    },
                    bottom: {
                      style: BorderStyle.SINGLE,
                      size: isTh ? 10 : 4,
                      color: isTh ? primaryHex : 'CBD5E1',
                    },
                    left: { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1' },
                    right: { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1' },
                  },
              children: [
                new Paragraph({
                  alignment: getAlignment(cell.querySelector('p') || cell),
                  spacing: { before: 0, after: 0 },
                  children:
                    cellRuns.length > 0
                      ? cellRuns
                      : [new TextRun({ text: ' ', font: bodyFont, size: 20 })],
                }),
              ],
            });
          }),
        });
      });

      children.push(
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: docRows,
        })
      );
      children.push(new Paragraph({ spacing: { before: 0, after: 120 }, children: [] }));
    }
  };

  for (const child of Array.from(container.children)) {
    await processElement(child);
  }

  const doc = new Document({
    sections: [
      {
        properties: {
          titlePage: true, // Suppresses running header/footer on the cover page
          page: {
            margin: {
              top: 1080,
              bottom: 1080,
              left: 1134,
              right: 1134,
            },
          },
        },
        ...(showRunningHeaders
          ? {
              headers: {
                default: new Header({
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.RIGHT,
                      border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: 'E2E8F0' } },
                      children: [
                        new TextRun({
                          text: `${schoolName.toUpperCase()}   •   BUKU PENGURUSAN SESI ${session}`,
                          font: headingFont,
                          size: 15,
                          color: '64748B',
                        }),
                      ],
                    }),
                  ],
                }),
              },
              footers: {
                default: new Footer({
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      border: { top: { style: BorderStyle.SINGLE, size: 4, color: 'E2E8F0' } },
                      children: [
                        new TextRun({
                          text: 'Halaman ',
                          font: bodyFont,
                          size: 16,
                          color: '64748B',
                        }),
                        new TextRun({
                          children: [PageNumber.CURRENT],
                          font: headingFont,
                          size: 16,
                          bold: true,
                          color: primaryHex,
                        }),
                      ],
                    }),
                  ],
                }),
              },
            }
          : {}),
        children,
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const fileName = `Buku_Pengurusan_${session.replace(/[^a-zA-Z0-9_-]+/g, '_')}.docx`;
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  const sizeBytes = blob.size;
  const sizeLabel =
    sizeBytes >= 1024 * 1024
      ? `${(sizeBytes / (1024 * 1024)).toFixed(2)} MB`
      : `${Math.max(1, Math.round(sizeBytes / 1024))} KB`;

  return { fileName, sizeBytes, sizeLabel };
}