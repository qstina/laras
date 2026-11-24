import PptxGenJS from 'pptxgenjs';
import type { WorkloadAnalyticsSummary } from './workloadAnalytics';

export interface PptxExportConfig {
  schoolName: string;
  academicSession: string;
  presentationTitle: string;
  meetingContext: string;
  presenterName: string;
  reportDate: string;
  activeFiltersLabel: string;
  sections: {
    executiveOverview: boolean;
    teacherDistribution: boolean;
    categoryAndRoles: boolean;
    extremesTable: boolean;
    insightsAndActions: boolean;
  };
}

const COLORS = {
  ink: '101828',
  slateDark: '334155',
  slateMuted: '64748B',
  slateLight: 'CBD5E1',
  canvas: 'F8FAFC',
  white: 'FFFFFF',
  forest: '0F766E',
  forestBg: 'CCFBF1',
  amber: 'D97706',
  amberBg: 'FEF3C7',
  rose: 'E11D48',
  roseBg: 'FFE4E6',
  sky: '0284C7',
  skyBg: 'E0F2FE',
};

function addSlideHeader(
  slide: PptxGenJS.Slide,
  title: string,
  subtitle: string,
  schoolName: string,
  slideNumber: number
) {
  // Top accent bar
  slide.addShape('rect', {
    x: 0,
    y: 0,
    w: 13.33,
    h: 0.08,
    fill: { color: COLORS.ink },
  });

  slide.addText(title, {
    x: 0.6,
    y: 0.32,
    w: 9.5,
    h: 0.42,
    fontFace: 'Segoe UI',
    fontSize: 20,
    bold: true,
    color: COLORS.ink,
  });

  slide.addText(subtitle, {
    x: 0.6,
    y: 0.74,
    w: 9.5,
    h: 0.28,
    fontFace: 'Segoe UI',
    fontSize: 10.5,
    color: COLORS.slateMuted,
  });

  slide.addText(schoolName.toUpperCase(), {
    x: 10.2,
    y: 0.35,
    w: 2.53,
    h: 0.25,
    align: 'right',
    fontFace: 'Segoe UI',
    fontSize: 8.5,
    bold: true,
    color: COLORS.slateMuted,
  });

  slide.addShape('line', {
    x: 0.6,
    y: 1.1,
    w: 12.13,
    h: 0,
    line: { color: COLORS.slateLight, width: 0.75 },
  });

  // Footer
  slide.addText('Dijana secara automatik oleh Sistem Pengurusan Sekolah LARAS', {
    x: 0.6,
    y: 7.12,
    w: 8.5,
    h: 0.24,
    fontFace: 'Segoe UI',
    fontSize: 8.5,
    color: COLORS.slateMuted,
  });

  slide.addText(`Slaid ${slideNumber}`, {
    x: 11.2,
    y: 7.12,
    w: 1.53,
    h: 0.24,
    align: 'right',
    fontFace: 'Segoe UI',
    fontSize: 8.5,
    bold: true,
    color: COLORS.slateMuted,
  });
}

export async function generateWorkloadPresentationPptx(
  analytics: WorkloadAnalyticsSummary,
  config: PptxExportConfig
): Promise<void> {
  const pres = new PptxGenJS();
  pres.layout = 'LAYOUT_WIDE'; // 13.33 x 7.5 inches
  pres.author = config.presenterName || 'Pentadbir Sekolah';
  pres.company = config.schoolName;
  pres.subject = `Analisis Pemberatan & Beban Tugas (${config.academicSession})`;
  pres.title = config.presentationTitle;

  let slideCount = 1;

  // =========================================================================
  // SLIDE 1: TITLE SLIDE
  // =========================================================================
  const titleSlide = pres.addSlide();
  titleSlide.background = { color: COLORS.ink };

  // Left vertical accent strip
  titleSlide.addShape('rect', {
    x: 0,
    y: 0,
    w: 0.28,
    h: 7.5,
    fill: { color: COLORS.forest },
  });

  titleSlide.addText(`LAPORAN PEMBERATAN TUGAS • ${config.academicSession.toUpperCase()}`, {
    x: 0.9,
    y: 1.35,
    w: 11.2,
    h: 0.35,
    fontFace: 'Segoe UI',
    fontSize: 11,
    bold: true,
    color: '5EEAD4',
    charSpacing: 1.5,
  });

  titleSlide.addText(config.presentationTitle, {
    x: 0.9,
    y: 1.85,
    w: 11.2,
    h: 1.35,
    fontFace: 'Segoe UI',
    fontSize: 34,
    bold: true,
    color: COLORS.white,
    valign: 'top',
  });

  titleSlide.addText(config.schoolName, {
    x: 0.9,
    y: 3.35,
    w: 11.2,
    h: 0.45,
    fontFace: 'Segoe UI',
    fontSize: 18,
    bold: true,
    color: 'E2E8F0',
  });

  if (config.meetingContext) {
    titleSlide.addText(config.meetingContext, {
      x: 0.9,
      y: 3.85,
      w: 11.2,
      h: 0.38,
      fontFace: 'Segoe UI',
      fontSize: 13,
      color: '94A3B8',
    });
  }

  // Metadata card at bottom
  titleSlide.addShape('roundRect', {
    x: 0.9,
    y: 5.15,
    w: 11.5,
    h: 1.45,
    rectRadius: 0.08,
    fill: { color: '1E293B' },
    line: { color: '334155', width: 1 },
  });

  const metaCols = [
    { label: 'DISEDIAKAN OLEH', value: config.presenterName || 'Pentadbiran Sekolah' },
    { label: 'TARIKH PEMBENTANGAN', value: config.reportDate },
    { label: 'SKOP TAPISAN DATA', value: config.activeFiltersLabel || 'Semua Warga & Jawatankuasa' },
  ];

  metaCols.forEach((m, i) => {
    const xPos = 1.2 + i * 3.75;
    titleSlide.addText(m.label, {
      x: xPos,
      y: 5.38,
      w: 3.5,
      h: 0.25,
      fontFace: 'Segoe UI',
      fontSize: 8.5,
      bold: true,
      color: '94A3B8',
    });
    titleSlide.addText(m.value, {
      x: xPos,
      y: 5.68,
      w: 3.5,
      h: 0.65,
      fontFace: 'Segoe UI',
      fontSize: 11.5,
      bold: true,
      color: COLORS.white,
      valign: 'top',
    });
  });

  // =========================================================================
  // SLIDE 2: RINGKASAN EKSEKUTIF (EXECUTIVE OVERVIEW)
  // =========================================================================
  if (config.sections.executiveOverview) {
    slideCount++;
    const slide = pres.addSlide();
    slide.background = { color: COLORS.canvas };
    addSlideHeader(
      slide,
      'Ringkasan Eksekutif Pemberatan Tugas',
      `Asas Pengiraan: ${analytics.referencePoints} mata = 100% beban tugas penuh (${config.academicSession})`,
      config.schoolName,
      slideCount
    );

    const { kpis } = analytics;
    const kpiCards = [
      {
        title: 'WARGA AKTIF',
        value: `${kpis.totalStaff}`,
        sub: `${kpis.guruCount} Guru • ${kpis.sokonganCount} Staf Sokongan`,
        accent: COLORS.ink,
      },
      {
        title: 'JAWATANKUASA & LANTIKAN',
        value: `${kpis.totalAssignments}`,
        sub: `Merentas ${kpis.activeCommittees}/${kpis.totalCommittees} unit aktif`,
        accent: COLORS.sky,
      },
      {
        title: 'PURATA BEBAN GURU',
        value: `${kpis.avgWorkloadPctGuru}%`,
        sub: `Median ${kpis.medianWorkloadPctGuru}% (Julat ${kpis.minGuruPct}%–${kpis.maxGuruPct}%)`,
        accent: COLORS.forest,
      },
      {
        title: 'STATUS BEBAN TINGGI (>100%)',
        value: `${kpis.highCount}`,
        sub: `Seimbang: ${kpis.balancedCount} • Rendah (<50%): ${kpis.lowCount}`,
        accent: kpis.highCount > 0 ? COLORS.rose : COLORS.forest,
      },
    ];

    kpiCards.forEach((card, idx) => {
      const x = 0.6 + idx * 3.1;
      slide.addShape('roundRect', {
        x,
        y: 1.35,
        w: 2.88,
        h: 1.55,
        rectRadius: 0.08,
        fill: { color: COLORS.white },
        line: { color: COLORS.slateLight, width: 0.75 },
      });
      slide.addShape('rect', {
        x,
        y: 1.35,
        w: 0.08,
        h: 1.55,
        fill: { color: card.accent },
      });
      slide.addText(card.title, {
        x: x + 0.22,
        y: 1.5,
        w: 2.5,
        h: 0.25,
        fontFace: 'Segoe UI',
        fontSize: 8.5,
        bold: true,
        color: COLORS.slateMuted,
      });
      slide.addText(card.value, {
        x: x + 0.22,
        y: 1.78,
        w: 2.5,
        h: 0.55,
        fontFace: 'Segoe UI',
        fontSize: 28,
        bold: true,
        color: card.accent,
      });
      slide.addText(card.sub, {
        x: x + 0.22,
        y: 2.38,
        w: 2.5,
        h: 0.38,
        fontFace: 'Segoe UI',
        fontSize: 9.5,
        color: COLORS.slateDark,
      });
    });

    // Left: Native Doughnut Chart of Workload Status Tiers
    if (kpis.totalStaff > 0) {
      slide.addShape('roundRect', {
        x: 0.6,
        y: 3.15,
        w: 5.8,
        h: 3.7,
        rectRadius: 0.08,
        fill: { color: COLORS.white },
        line: { color: COLORS.slateLight, width: 0.75 },
      });
      slide.addText('Taburan Status Beban Warga', {
        x: 0.85,
        y: 3.3,
        w: 5.3,
        h: 0.3,
        fontFace: 'Segoe UI',
        fontSize: 12,
        bold: true,
        color: COLORS.ink,
      });

      slide.addChart(
        pres.ChartType.doughnut,
        [
          {
            name: 'Bilangan Warga',
            labels: ['Tinggi (>100%)', 'Seimbang (50%–100%)', 'Rendah (<50%)'],
            values: [kpis.highCount, kpis.balancedCount, kpis.lowCount],
          },
        ],
        {
          x: 0.85,
          y: 3.68,
          w: 5.3,
          h: 2.95,
          chartColors: [COLORS.rose, COLORS.forest, COLORS.sky],
          showLegend: true,
          legendPos: 'r',
          legendFontSize: 10,
          showValue: true,
          dataLabelColor: COLORS.white,
          dataLabelFontSize: 10,
          holeSize: 55,
        }
      );
    }

    // Right: Native Bar Chart of Role Distribution
    if (analytics.roleBuckets.some((r) => r.count > 0)) {
      slide.addShape('roundRect', {
        x: 6.65,
        y: 3.15,
        w: 6.08,
        h: 3.7,
        rectRadius: 0.08,
        fill: { color: COLORS.white },
        line: { color: COLORS.slateLight, width: 0.75 },
      });
      slide.addText('Komposisi Peranan & Jumlah Mata Pemberatan', {
        x: 6.9,
        y: 3.3,
        w: 5.6,
        h: 0.3,
        fontFace: 'Segoe UI',
        fontSize: 12,
        bold: true,
        color: COLORS.ink,
      });

      slide.addChart(
        pres.ChartType.bar,
        [
          {
            name: 'Bilangan Lantikan',
            labels: analytics.roleBuckets.map((r) => r.bucket),
            values: analytics.roleBuckets.map((r) => r.count),
          },
          {
            name: 'Jumlah Mata',
            labels: analytics.roleBuckets.map((r) => r.bucket),
            values: analytics.roleBuckets.map((r) => r.totalPoints),
          },
        ],
        {
          x: 6.9,
          y: 3.68,
          w: 5.6,
          h: 2.95,
          barDir: 'col',
          barGrouping: 'clustered',
          chartColors: [COLORS.ink, COLORS.amber],
          showLegend: true,
          legendPos: 'b',
          legendFontSize: 9.5,
          showValue: true,
          dataLabelFontSize: 9,
          valAxisHidden: false,
          catAxisLabelFontSize: 9.5,
          valAxisLabelFontSize: 9,
        }
      );
    }
  }

  // =========================================================================
  // SLIDE 3: TABURAN BEBAN TUGAS GURU (HORIZONTAL BAR CHART)
  // =========================================================================
  if (config.sections.teacherDistribution && analytics.staffItems.length > 0) {
    slideCount++;
    const slide = pres.addSlide();
    slide.background = { color: COLORS.canvas };

    const topSample = analytics.staffItems.slice(0, 15);
    addSlideHeader(
      slide,
      'Perbandingan Beban Tugas Individu (%)',
      `Menampilkan ${topSample.length} warga teratas mengikut peratus pemberatan (Rujukan: ${analytics.referencePoints} mata = 100%)`,
      config.schoolName,
      slideCount
    );

    slide.addShape('roundRect', {
      x: 0.6,
      y: 1.3,
      w: 12.13,
      h: 5.55,
      rectRadius: 0.08,
      fill: { color: COLORS.white },
      line: { color: COLORS.slateLight, width: 0.75 },
    });

    slide.addChart(
      pres.ChartType.bar,
      [
        {
          name: 'Peratus Beban (%)',
          labels: topSample.map((s) =>
            s.name.length > 28 ? `${s.name.slice(0, 26)}…` : s.name
          ),
          values: topSample.map((s) => s.percentage),
        },
      ],
      {
        x: 0.85,
        y: 1.48,
        w: 11.6,
        h: 5.15,
        barDir: 'bar',
        chartColors: [COLORS.ink],
        showLegend: false,
        showValue: true,
        dataLabelPosition: 'outEnd',
        dataLabelFontSize: 9,
        dataLabelColor: COLORS.ink,
        catAxisLabelFontSize: 9.5,
        valAxisLabelFontSize: 9,
        valAxisTitle: 'Peratus Beban (%)',
        showValAxisTitle: true,
        valAxisTitleFontSize: 9.5,
      }
    );
  }

  // =========================================================================
  // SLIDE 4: ANALISIS MENGIKUT KATEGORI JAWATANKUASA
  // =========================================================================
  if (config.sections.categoryAndRoles && analytics.categoryBreakdown.length > 0) {
    slideCount++;
    const slide = pres.addSlide();
    slide.background = { color: COLORS.canvas };
    addSlideHeader(
      slide,
      'Taburan Tugas Mengikut Kategori Jawatankuasa',
      'Perbandingan bilangan jawatankuasa, jumlah lantikan dan pemberatan mata setiap bidang utama',
      config.schoolName,
      slideCount
    );

    // Left: Native Bar Chart
    slide.addShape('roundRect', {
      x: 0.6,
      y: 1.3,
      w: 6.15,
      h: 5.55,
      rectRadius: 0.08,
      fill: { color: COLORS.white },
      line: { color: COLORS.slateLight, width: 0.75 },
    });

    slide.addChart(
      pres.ChartType.bar,
      [
        {
          name: 'Jumlah Mata',
          labels: analytics.categoryBreakdown.map((c) => c.category),
          values: analytics.categoryBreakdown.map((c) => c.totalPoints),
        },
        {
          name: 'Bil. Lantikan',
          labels: analytics.categoryBreakdown.map((c) => c.category),
          values: analytics.categoryBreakdown.map((c) => c.assignmentCount),
        },
      ],
      {
        x: 0.8,
        y: 1.5,
        w: 5.75,
        h: 5.1,
        barDir: 'bar',
        barGrouping: 'clustered',
        chartColors: [COLORS.forest, COLORS.sky],
        showLegend: true,
        legendPos: 'b',
        legendFontSize: 9.5,
        showValue: true,
        dataLabelFontSize: 9,
        catAxisLabelFontSize: 9.5,
        valAxisLabelFontSize: 9,
      }
    );

    // Right: Editable Table
    const tableRows: PptxGenJS.TableRow[] = [
      [
        { text: 'Kategori Jawatankuasa', options: { bold: true, color: COLORS.white, fill: { color: COLORS.ink } } },
        { text: 'Unit', options: { bold: true, align: 'center', color: COLORS.white, fill: { color: COLORS.ink } } },
        { text: 'Lantikan', options: { bold: true, align: 'center', color: COLORS.white, fill: { color: COLORS.ink } } },
        { text: 'Mata', options: { bold: true, align: 'center', color: COLORS.white, fill: { color: COLORS.ink } } },
        { text: 'Purata', options: { bold: true, align: 'center', color: COLORS.white, fill: { color: COLORS.ink } } },
      ],
      ...analytics.categoryBreakdown.map((cat, i) => {
        const bg = i % 2 === 1 ? COLORS.canvas : COLORS.white;
        return [
          { text: cat.category, options: { bold: true, color: COLORS.ink, fill: { color: bg } } },
          { text: String(cat.committeeCount), options: { align: 'center' as const, color: COLORS.slateDark, fill: { color: bg } } },
          { text: String(cat.assignmentCount), options: { align: 'center' as const, color: COLORS.slateDark, fill: { color: bg } } },
          { text: String(cat.totalPoints), options: { align: 'center' as const, bold: true, color: COLORS.forest, fill: { color: bg } } },
          { text: `${cat.avgPointsPerAssignment}`, options: { align: 'center' as const, color: COLORS.slateMuted, fill: { color: bg } } },
        ];
      }),
    ];

    slide.addTable(tableRows, {
      x: 7.0,
      y: 1.3,
      w: 5.73,
      colW: [2.53, 0.7, 0.85, 0.8, 0.85],
      fontFace: 'Segoe UI',
      fontSize: 9.5,
      border: { type: 'solid', pt: 0.5, color: COLORS.slateLight },
      valign: 'middle',
      rowH: 0.44,
    });
  }

  // =========================================================================
  // SLIDE 5: GURU BEBAN TERTINGGI & TERENDAH (COMPARISON TABLES)
  // =========================================================================
  if (config.sections.extremesTable && analytics.highestTeachers.length > 0) {
    slideCount++;
    const slide = pres.addSlide();
    slide.background = { color: COLORS.canvas };
    addSlideHeader(
      slide,
      'Perbandingan Beban Tertinggi & Terendah',
      'Senarai guru untuk rujukan penyelarasan semula agihan tugas peringkat pengurusan',
      config.schoolName,
      slideCount
    );

    // Top 5 Highest
    slide.addText('5 Guru Dengan Pemberatan Tertinggi', {
      x: 0.6,
      y: 1.28,
      w: 5.85,
      h: 0.3,
      fontFace: 'Segoe UI',
      fontSize: 12,
      bold: true,
      color: COLORS.rose,
    });

    const highRows: PptxGenJS.TableRow[] = [
      [
        { text: 'Nama Guru', options: { bold: true, color: COLORS.white, fill: { color: COLORS.ink } } },
        { text: 'JK', options: { bold: true, align: 'center', color: COLORS.white, fill: { color: COLORS.ink } } },
        { text: 'Mata', options: { bold: true, align: 'center', color: COLORS.white, fill: { color: COLORS.ink } } },
        { text: 'Beban', options: { bold: true, align: 'center', color: COLORS.white, fill: { color: COLORS.ink } } },
      ],
      ...analytics.highestTeachers.map((t, i) => {
        const bg = i % 2 === 1 ? COLORS.canvas : COLORS.white;
        return [
          { text: `${t.name}\n(${t.jawatan})`, options: { color: COLORS.ink, fill: { color: bg } } },
          { text: String(t.assignments.length), options: { align: 'center' as const, color: COLORS.slateDark, fill: { color: bg } } },
          { text: `${t.points}/${analytics.referencePoints}`, options: { align: 'center' as const, color: COLORS.slateDark, fill: { color: bg } } },
          {
            text: `${t.percentage}%`,
            options: {
              align: 'center' as const,
              bold: true,
              color: t.percentage > 100 ? COLORS.rose : COLORS.forest,
              fill: { color: bg },
            },
          },
        ];
      }),
    ];

    slide.addTable(highRows, {
      x: 0.6,
      y: 1.65,
      w: 5.85,
      colW: [3.35, 0.65, 0.95, 0.9],
      fontFace: 'Segoe UI',
      fontSize: 9,
      border: { type: 'solid', pt: 0.5, color: COLORS.slateLight },
      valign: 'middle',
      rowH: 0.72,
    });

    // Top 5 Lowest
    slide.addText('5 Guru Dengan Pemberatan Terendah', {
      x: 6.88,
      y: 1.28,
      w: 5.85,
      h: 0.3,
      fontFace: 'Segoe UI',
      fontSize: 12,
      bold: true,
      color: COLORS.sky,
    });

    const lowRows: PptxGenJS.TableRow[] = [
      [
        { text: 'Nama Guru', options: { bold: true, color: COLORS.white, fill: { color: COLORS.ink } } },
        { text: 'JK', options: { bold: true, align: 'center', color: COLORS.white, fill: { color: COLORS.ink } } },
        { text: 'Mata', options: { bold: true, align: 'center', color: COLORS.white, fill: { color: COLORS.ink } } },
        { text: 'Beban', options: { bold: true, align: 'center', color: COLORS.white, fill: { color: COLORS.ink } } },
      ],
      ...analytics.lowestTeachers.map((t, i) => {
        const bg = i % 2 === 1 ? COLORS.canvas : COLORS.white;
        return [
          { text: `${t.name}\n(${t.jawatan})`, options: { color: COLORS.ink, fill: { color: bg } } },
          { text: String(t.assignments.length), options: { align: 'center' as const, color: COLORS.slateDark, fill: { color: bg } } },
          { text: `${t.points}/${analytics.referencePoints}`, options: { align: 'center' as const, color: COLORS.slateDark, fill: { color: bg } } },
          {
            text: `${t.percentage}%`,
            options: {
              align: 'center' as const,
              bold: true,
              color: t.percentage < 50 ? COLORS.sky : COLORS.forest,
              fill: { color: bg },
            },
          },
        ];
      }),
    ];

    slide.addTable(lowRows, {
      x: 6.88,
      y: 1.65,
      w: 5.85,
      colW: [3.35, 0.65, 0.95, 0.9],
      fontFace: 'Segoe UI',
      fontSize: 9,
      border: { type: 'solid', pt: 0.5, color: COLORS.slateLight },
      valign: 'middle',
      rowH: 0.72,
    });
  }

  // =========================================================================
  // SLIDE 6: DAPATAN UTAMA & SYOR TINDAKAN PENGURUSAN
  // =========================================================================
  if (config.sections.insightsAndActions && analytics.insights.length > 0) {
    slideCount++;
    const slide = pres.addSlide();
    slide.background = { color: COLORS.canvas };
    addSlideHeader(
      slide,
      'Dapatan Utama & Pemerhatian Keseimbangan Tugas',
      'Rumusan analitik berasaskan data pemberatan sebenar untuk pertimbangan mesyuarat pengurusan',
      config.schoolName,
      slideCount
    );

    const visibleInsights = analytics.insights.slice(0, 4);
    visibleInsights.forEach((item, idx) => {
      const y = 1.32 + idx * 1.38;
      const badgeColor =
        item.severity === 'warning'
          ? COLORS.rose
          : item.severity === 'positive'
          ? COLORS.forest
          : COLORS.sky;

      slide.addShape('roundRect', {
        x: 0.6,
        y,
        w: 12.13,
        h: 1.22,
        rectRadius: 0.08,
        fill: { color: COLORS.white },
        line: { color: COLORS.slateLight, width: 0.75 },
      });

      slide.addShape('rect', {
        x: 0.6,
        y,
        w: 0.1,
        h: 1.22,
        fill: { color: badgeColor },
      });

      slide.addText(item.title, {
        x: 0.88,
        y: y + 0.1,
        w: 7.8,
        h: 0.28,
        fontFace: 'Segoe UI',
        fontSize: 11.5,
        bold: true,
        color: COLORS.ink,
      });

      slide.addText(item.metric, {
        x: 8.8,
        y: y + 0.1,
        w: 3.7,
        h: 0.28,
        align: 'right',
        fontFace: 'Segoe UI',
        fontSize: 10,
        bold: true,
        color: badgeColor,
      });

      const detailLine = item.affectedEntities?.length
        ? `${item.explanation}  [Rekod berkaitan: ${item.affectedEntities.join(', ')}]`
        : item.explanation;

      slide.addText(detailLine, {
        x: 0.88,
        y: y + 0.42,
        w: 11.6,
        h: 0.68,
        fontFace: 'Segoe UI',
        fontSize: 9.5,
        color: COLORS.slateDark,
        valign: 'top',
      });
    });
  }

  const safeFileSchool = config.schoolName.replace(/[^a-zA-Z0-9_-]+/g, '_');
  const safeSession = config.academicSession.replace(/[^a-zA-Z0-9_-]+/g, '_');
  await pres.writeFile({
    fileName: `Analisis_Beban_Tugas_${safeFileSchool}_${safeSession}.pptx`,
  });
}