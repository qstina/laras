import type { CoverConfig } from '../components/book-builder/coverTemplates';

export type SectionMode = 'Live' | 'Manual' | 'Template';
export type BookPart = 'cover' | 'preliminary' | 'main';

export interface BookSection {
  id: string;
  title: string;
  chapterNum: string;
  shortTitle: string;
  mode: SectionMode;
  part: BookPart;
  hasDivider?: boolean;
  dividerTagline?: string;
}

export const bookSections: BookSection[] = [
  { id: 'setup', title: 'Muka Hadapan Korporat', chapterNum: '00', shortTitle: 'Muka Hadapan', mode: 'Live', part: 'cover' },
  { id: 'toc', title: '1.0 Kandungan', chapterNum: '01', shortTitle: 'Kandungan', mode: 'Template', part: 'preliminary' },
  { id: 'carta', title: '2.0 Carta Organisasi Induk', chapterNum: '02', shortTitle: 'Carta Organisasi', mode: 'Live', part: 'preliminary' },
  { id: 'identiti', title: '3.0 Identiti & Maklumat Sekolah', chapterNum: '03', shortTitle: 'Identiti Sekolah', mode: 'Live', part: 'preliminary' },
  {
    id: 'direktori',
    title: '4.0 Direktori Warga Sekolah',
    chapterNum: '04',
    shortTitle: 'Direktori Warga',
    mode: 'Live',
    part: 'main',
    hasDivider: true,
    dividerTagline: 'Senarai Rasmi Pegawai Perkhidmatan Pendidikan & Anggota Kumpulan Pelaksana',
  },
  {
    id: 'beban',
    title: '5.0 Ringkasan Pemberatan Tugas',
    chapterNum: '05',
    shortTitle: 'Pemberatan Tugas',
    mode: 'Live',
    part: 'main',
    hasDivider: true,
    dividerTagline: 'Analisis Agihan Jawatankuasa & Keseimbangan Beban Tugas Warga Sekolah',
  },
  {
    id: 'sop',
    title: '6.0 Pengurusan & SOP Pendidik',
    chapterNum: '06',
    shortTitle: 'Pengurusan & SOP',
    mode: 'Template',
    part: 'main',
    hasDivider: true,
    dividerTagline: 'Garis Panduan Perkhidmatan, Tatakerja & Prosedur Operasi Standard',
  },
  {
    id: 'pentadbiran',
    title: '7.0 Pengurusan Pentadbiran',
    chapterNum: '07',
    shortTitle: 'Pentadbiran',
    mode: 'Live',
    part: 'main',
    hasDivider: true,
    dividerTagline: 'Jawatankuasa Induk Pentadbiran, Kewangan, Sumber Manusia & Pembangunan Fizikal',
  },
  {
    id: 'kurikulum',
    title: '8.0 Pengurusan Kurikulum',
    chapterNum: '08',
    shortTitle: 'Kurikulum',
    mode: 'Live',
    part: 'main',
    hasDivider: true,
    dividerTagline: 'Pengurusan Akademik, Panitia Mata Pelajaran, Peperiksaan & Kecemerlangan PdPc',
  },
  {
    id: 'hem',
    title: '9.0 Pengurusan Hal Ehwal Murid',
    chapterNum: '09',
    shortTitle: 'Hal Ehwal Murid',
    mode: 'Live',
    part: 'main',
    hasDivider: true,
    dividerTagline: 'Kebajikan, Disiplin, Bimbingan & Kaunseling serta Pembangunan Sahsiah Murid',
  },
  {
    id: 'koko',
    title: '10.0 Pengurusan Kokurikulum',
    chapterNum: '10',
    shortTitle: 'Kokurikulum',
    mode: 'Live',
    part: 'main',
    hasDivider: true,
    dividerTagline: 'Unit Beruniform, Kelab & Persatuan, Sukan & Permainan serta Pembangunan Bakat',
  },
  {
    id: 'tingkatan6',
    title: '11.0 Pengurusan Tingkatan 6',
    chapterNum: '11',
    shortTitle: 'Tingkatan 6',
    mode: 'Live',
    part: 'main',
    hasDivider: true,
    dividerTagline: 'Pengurusan Akademik, Hal Ehwal Pelajar & Kokurikulum Pra-Universiti',
  },
  {
    id: 'ppki',
    title: '12.0 Pengurusan PPKI',
    chapterNum: '12',
    shortTitle: 'PPKI',
    mode: 'Live',
    part: 'main',
    hasDivider: true,
    dividerTagline: 'Program Pendidikan Khas Integrasi — Pengurusan PdPc, Rancangan Pendidikan Individu & Kebajikan',
  },
  { id: 'glosari', title: '13.0 Glosari & Singkatan', chapterNum: '13', shortTitle: 'Glosari', mode: 'Template', part: 'main' },
];

export const esc = (value: unknown): string =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

export function toRoman(num: number): string {
  if (num <= 0) return 'i';
  const lookup: Array<[string, number]> = [
    ['x', 10],
    ['ix', 9],
    ['v', 5],
    ['iv', 4],
    ['i', 1],
  ];
  let n = num;
  let out = '';
  for (const [sym, val] of lookup) {
    while (n >= val) {
      out += sym;
      n -= val;
    }
  }
  return out;
}

const ROLE_PRIORITY: Array<{ match: string; rank: number }> = [
  { match: 'penasihat', rank: 1 },
  { match: 'pengerusi', rank: 2 },
  { match: 'timbalan pengerusi', rank: 3 },
  { match: 'naib pengerusi', rank: 4 },
  { match: 'setiausaha', rank: 5 },
  { match: 'penolong setiausaha', rank: 6 },
  { match: 'bendahari', rank: 7 },
  { match: 'penyelaras', rank: 8 },
  { match: 'penolong penyelaras', rank: 9 },
  { match: 'ketua', rank: 10 },
  { match: 'ahli', rank: 11 },
];

function getRoleRank(role: string): number {
  const lower = (role || '').toLowerCase();
  if (lower.includes('timbalan pengerusi') || lower.includes('timb. pengerusi') || lower.includes('timb.pengerusi')) return 3;
  if (lower.includes('naib pengerusi')) return 4;
  if (lower.includes('penolong setiausaha') || lower.includes('pen. setiausaha') || lower.includes('pen.setiausaha')) return 6;
  if (lower.includes('penolong penyelaras') || lower.includes('pen. penyelaras') || lower.includes('pen.penyelaras')) return 9;
  const hit = ROLE_PRIORITY.find((r) => lower.includes(r.match));
  return hit ? hit.rank : 20;
}

export function sortCommitteeMembers(members: any[]): any[] {
  return [...(members || [])].sort((a, b) => {
    const rankDiff = getRoleRank(a.role) - getRoleRank(b.role);
    if (rankDiff !== 0) return rankDiff;
    const nameA = a.staff?.name || '';
    const nameB = b.staff?.name || '';
    return nameA.localeCompare(nameB, 'ms');
  });
}

function getStaffLeadershipRank(jawatan: string): number {
  const j = (jawatan || '').toLowerCase();
  if (j.includes('pengetua') || j.includes('guru besar')) return 1;
  if (j.includes('penolong kanan pentadbiran') || j.includes('pk pentadbiran') || j.includes('pk1')) return 2;
  if (j.includes('penolong kanan hal ehwal murid') || j.includes('penolong kanan hem') || j.includes('pk hem')) return 3;
  if (j.includes('penolong kanan kokurikulum') || j.includes('pk kokurikulum') || j.includes('pk koko')) return 4;
  if (j.includes('penolong kanan petang') || j.includes('pk petang')) return 5;
  if (j.includes('penolong kanan tingkatan 6') || j.includes('penolong kanan t6') || j.includes('pk t6')) return 6;
  if (j.includes('penolong kanan pendidikan khas') || j.includes('penolong kanan ppki') || j.includes('pk ppki')) return 7;
  if (j.includes('guru kanan') || j.includes('gkmp')) return 8;
  if (j.includes('kaunseling') || j.includes('kaunselor')) return 9;
  return 20;
}

export function sortStaffByHierarchy(list: any[]): any[] {
  return [...(list || [])].sort((a, b) => {
    const rankDiff = getStaffLeadershipRank(a.jawatan) - getStaffLeadershipRank(b.jawatan);
    if (rankDiff !== 0) return rankDiff;
    return (a.name || '').localeCompare(b.name || '', 'ms');
  });
}

function renderChapterHeader(section?: BookSection, subtitle?: string): string {
  if (!section) return '';
  return (
    `<p class="bb-chapter-kicker">BAHAGIAN ${esc(section.chapterNum)}</p>` +
    `<h1>${esc(section.title)}</h1>` +
    (subtitle ? `<p class="bb-chapter-subtitle">${esc(subtitle)}</p>` : '')
  );
}

/**
 * Generates an editorial full-page Section Divider for major chapters.
 * Uses clean semantic HTML compatible with Tiptap, CSS themes, and DOCX export.
 */
export function buildSectionDividerHTML(
  section: BookSection,
  profile: any,
  staff: any[],
  committees: any[]
): string {
  const cleanTitle = section.title.replace(/^\d+\.\d+\s*/, '');
  const session = profile?.current_session || '2026/2027';

  let scopeMeta = '';
  if (section.id === 'direktori') {
    const activeCount = staff.filter((s) => s.status !== 'Tidak Aktif').length;
    scopeMeta = `Jumlah Perjawatan Aktif: ${activeCount} Orang Warga Sekolah`;
  } else if (['pentadbiran', 'kurikulum', 'hem', 'koko', 'tingkatan6', 'ppki'].includes(section.id)) {
    const catMap: Record<string, string> = {
      pentadbiran: 'Pentadbiran',
      kurikulum: 'Kurikulum',
      hem: 'Hal Ehwal Murid',
      koko: 'Kokurikulum',
      tingkatan6: 'Tingkatan 6',
      ppki: 'PPKI',
    };
    const target = catMap[section.id];
    const count = committees.filter(
      (c) => c.category === target || c.category === `Pengurusan ${target}`
    ).length;
    scopeMeta = `Merangkumi ${count} Jawatankuasa & Unit Pengurusan`;
  }

  return (
    `<div data-section-divider="true" data-divider-for="${esc(section.id)}">` +
    `<p class="bb-div-session">BUKU PENGURUSAN SEKOLAH • SESI ${esc(session)}</p>` +
    `<p class="bb-div-num">${esc(section.chapterNum)}</p>` +
    `<p class="bb-div-kicker">BAHAGIAN ${esc(section.chapterNum)}</p>` +
    `<h1 class="bb-div-title">${esc(cleanTitle)}</h1>` +
    (section.dividerTagline
      ? `<p class="bb-div-tagline">${esc(section.dividerTagline)}</p>`
      : '') +
    (scopeMeta ? `<p class="bb-div-meta">${esc(scopeMeta)}</p>` : '') +
    `</div>`
  );
}

function formatStructuredTextHTML(rawText: string): string {
  const lines = rawText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  if (lines.length === 0) return '';

  const categoryPrefixes = [
    'perancangan',
    'pelaksanaan',
    'pemantauan',
    'penilaian',
    'pelaporan',
    'pengurusan',
    'tindakan susulan',
    'objektif',
    'sasaran',
  ];

  const blocks: string[] = [];
  let listItems: string[] = [];
  let seenPerancanganInCurrentGroup = false;

  const flushList = () => {
    if (listItems.length > 0) {
      blocks.push(`<ul>${listItems.map((li) => `<li><p>${li}</p></li>`).join('')}</ul>`);
      listItems = [];
      seenPerancanganInCurrentGroup = false;
    }
  };

  lines.forEach((rawLine, idx) => {
    const line = rawLine.replace(/^(\d+[\.\)]\s*|[-•*]\s*)/, '').trim();
    const colonIdx = line.indexOf(':');

    // 1. Standalone category header (e.g., "Perancangan:")
    if (colonIdx > 0 && colonIdx === line.length - 1 && line.length <= 42) {
      flushList();
      blocks.push(`<p class="bb-role-label">${esc(line)}</p>`);
      return;
    }

    // 2. All-caps role/portfolio subheader (e.g., "SETIAUSAHA PENGURUSAN KANAN SEKOLAH")
    const isUpperRoleHeader =
      line.length >= 6 &&
      line.length <= 75 &&
      line === line.toUpperCase() &&
      /[A-Z]/.test(line) &&
      !line.endsWith('.') &&
      idx < lines.length - 1;

    if (isUpperRoleHeader) {
      flushList();
      blocks.push(`<p class="bb-role-label">${esc(line)}</p>`);
      return;
    }

    // 3. Inline PDCA prefix (e.g., "Perancangan: Membina Pelan Strategik...")
    if (colonIdx > 0 && colonIdx <= 32) {
      const prefix = line.slice(0, colonIdx).trim();
      const body = line.slice(colonIdx + 1).trim();
      const lowerPrefix = prefix.toLowerCase();
      const isKnownPrefix = categoryPrefixes.some((kw) => lowerPrefix.startsWith(kw));

      if (isKnownPrefix && body.length > 0) {
        if (lowerPrefix.startsWith('perancangan') && seenPerancanganInCurrentGroup) {
          flushList();
        }
        if (lowerPrefix.startsWith('perancangan')) {
          seenPerancanganInCurrentGroup = true;
        }
        listItems.push(`<strong>${esc(prefix)}:</strong> ${esc(body)}`);
        return;
      }
    }

    // 4. Plain target or description line
    if (lines.length === 1 || (blocks.length > 0 && listItems.length === 0)) {
      blocks.push(`<p>${esc(line)}</p>`);
    } else {
      listItems.push(esc(line));
    }
  });

  flushList();
  return blocks.join('');
}

function formatMultilineToParagraphs(text: string, centered = false): string {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length === 0) return '';
  const alignAttr = centered ? ' style="text-align: center"' : '';
  return lines.map((line) => `<p${alignAttr}>${esc(line)}</p>`).join('');
}

export function buildSection(
  id: string,
  profile: any,
  staff: any[],
  committees: any[],
  coverConfig?: Partial<CoverConfig>
): string {
  const section = bookSections.find((s) => s.id === id);
  const enableDividers = coverConfig?.enableSectionDividers ?? true;

  const maybeDivider =
    section?.hasDivider && enableDividers
      ? buildSectionDividerHTML(section, profile, staff, committees) +
        '<div data-page-break="true"></div>'
      : '';

  switch (id) {
    case 'toc': {
      let tocHtml =
        renderChapterHeader(section, 'Indeks Bahagian Utama Buku Pengurusan Sekolah') +
        '<table class="toc-table"><tbody>';
      bookSections
        .filter((s) => s.id !== 'setup' && s.id !== 'toc')
        .forEach((s) => {
          if (s.id === 'tingkatan6' || s.id === 'ppki') {
            const categoryComms = committees.filter((c) =>
              c.category
                ?.toLowerCase()
                .includes(s.id === 'tingkatan6' ? 'tingkatan 6' : 'ppki')
            );
            if (categoryComms.length === 0) return;
          }
          tocHtml +=
            `<tr>` +
            `<td style="white-space: nowrap; padding-right: 12px;"><p><a href="#section-${s.id}">${esc(
              s.title
            )}</a></p></td>` +
            `<td class="toc-leader"></td>` +
            `<td style="text-align: right; padding-left: 12px;"><p style="text-align: right">-</p></td>` +
            `</tr>`;
        });
      return tocHtml + '</tbody></table>';
    }

    case 'carta': {
      const leaders = sortStaffByHierarchy(
        staff.filter(
          (s) => s.status !== 'Tidak Aktif' && getStaffLeadershipRank(s.jawatan) <= 8
        )
      );

      let html = renderChapterHeader(
        section,
        'Struktur Hierarki Kepimpinan & Barisan Pengurusan Tertinggi Sekolah'
      );

      if (leaders.length > 0) {
        const rows = leaders
          .map(
            (l, i) =>
              `<tr>` +
              `<td style="width: 8%; text-align: center"><p style="text-align: center">${i + 1}</p></td>` +
              `<td style="width: 44%; text-align: left"><p><strong>${esc(l.name)}</strong></p></td>` +
              `<td style="width: 34%; text-align: left"><p>${esc(l.jawatan || '-')}</p></td>` +
              `<td style="width: 14%; text-align: center"><p style="text-align: center">${esc(l.gred || '-')}</p></td>` +
              `</tr>`
          )
          .join('');

        html +=
          `<h2>2.1 Barisan Kepimpinan &amp; Pengurusan Induk</h2>` +
          `<table><thead><tr>` +
          `<th style="width: 8%; text-align: center"><p style="text-align: center">Bil</p></th>` +
          `<th style="width: 44%; text-align: left"><p>Nama Pegawai</p></th>` +
          `<th style="width: 34%; text-align: left"><p>Jawatan Pentadbiran</p></th>` +
          `<th style="width: 14%; text-align: center"><p style="text-align: center">Gred</p></th>` +
          `</tr></thead><tbody>${rows}</tbody></table>`;
      }

      html +=
        `<h2>2.2 Rajah Carta Organisasi Sekolah</h2>` +
        `<blockquote><p style="text-align: center"><em>Ruang Rajah Carta Organisasi Induk. Klik di sini untuk menyisip imej carta organisasi rasmi sekolah atau melengkapkan struktur organisasi.</em></p></blockquote>`;

      return html;
    }

    case 'identiti': {
      const parts: string[] = [
        renderChapterHeader(
          section,
          'Profil Rasmi, Falsafah, Hala Tuju & Identiti Korporat Sekolah'
        ),
      ];

      parts.push(
        `<h2>3.1 Maklumat Asas &amp; Perhubungan Rasmi</h2>` +
          `<table><tbody>` +
          `<tr><th style="width: 30%; text-align: left"><p>Nama Rasmi Sekolah</p></th><td style="width: 70%; text-align: left"><p><strong>${esc(
            profile?.name || '-'
          )}</strong></p></td></tr>` +
          `<tr><th style="text-align: left"><p>Kod Sekolah</p></th><td style="text-align: left"><p>${esc(
            profile?.code || '-'
          )}</p></td></tr>` +
          `<tr><th style="text-align: left"><p>Sesi Akademik</p></th><td style="text-align: left"><p>${esc(
            profile?.current_session || '-'
          )}</p></td></tr>` +
          `<tr><th style="text-align: left"><p>Alamat Surat-Menyurat</p></th><td style="text-align: left"><p>${esc(
            profile?.address || '-'
          )}</p></td></tr>` +
          (profile?.phone
            ? `<tr><th style="text-align: left"><p>No. Telefon Rasmi</p></th><td style="text-align: left"><p>${esc(
                profile.phone
              )}</p></td></tr>`
            : '') +
          (profile?.email
            ? `<tr><th style="text-align: left"><p>Alamat Emel Rasmi</p></th><td style="text-align: left"><p>${esc(
                profile.email
              )}</p></td></tr>`
            : '') +
          (profile?.motto
            ? `<tr><th style="text-align: left"><p>Motto / Cogankata</p></th><td style="text-align: left"><p><em>&ldquo;${esc(
                profile.motto
              )}&rdquo;</em></p></td></tr>`
            : '') +
          (profile?.slogan
            ? `<tr><th style="text-align: left"><p>Slogan Sekolah</p></th><td style="text-align: left"><p>${esc(
                profile.slogan
              )}</p></td></tr>`
            : '') +
          `</tbody></table>`
      );

      if (profile?.fpk) {
        parts.push(
          `<h2 style="text-align: center">3.2 Falsafah Pendidikan Kebangsaan</h2>` +
            `<blockquote><p>${esc(profile.fpk)}</p></blockquote>`
        );
      }

      parts.push(
        `<h2 style="text-align: center">3.3 Visi Sekolah</h2>` +
          `<blockquote><p style="text-align: center"><strong>&ldquo;${esc(
            profile?.vision || 'Pendidikan Berkualiti Insan Terdidik Negara Sejahtera'
          )}&rdquo;</strong></p></blockquote>`
      );

      parts.push(
        `<h2 style="text-align: center">3.4 Misi Sekolah</h2>` +
          `<blockquote><p style="text-align: center"><strong>&ldquo;${esc(
            profile?.mission ||
              'Melestarikan Sistem Pendidikan Yang Berkualiti Untuk Membangunkan Potensi Individu Bagi Memenuhi Aspirasi Negara'
          )}&rdquo;</strong></p></blockquote>`
      );

      if (profile?.school_song_lyrics) {
        parts.push(
          `<h2 style="text-align: center">3.5 Lagu Rasmi Sekolah</h2>` +
            `<blockquote>${formatMultilineToParagraphs(profile.school_song_lyrics, true)}</blockquote>`
        );
      } else if (profile?.school_song_url) {
        parts.push(
          `<h2 style="text-align: center">3.5 Lagu Rasmi Sekolah</h2>` +
            `<p style="text-align: center">Pautan Audio / Video Rasmi: <a href="${esc(
              profile.school_song_url
            )}">${esc(profile.school_song_url)}</a></p>`
        );
      }

      return parts.join('');
    }

    case 'direktori': {
      const activeStaff = staff.filter((s) => s.status !== 'Tidak Aktif');
      const guruList = sortStaffByHierarchy(
        activeStaff.filter((s) => (s.type || 'Guru') === 'Guru')
      );
      const akpList = sortStaffByHierarchy(
        activeStaff.filter((s) => s.type === 'Sokongan')
      );

      const renderStaffTable = (list: any[]) => {
        const rows = list
          .map(
            (s, i) =>
              `<tr>` +
              `<td style="width: 7%; text-align: center"><p style="text-align: center">${i + 1}</p></td>` +
              `<td style="width: 40%; text-align: left"><p>${esc(s.name)}</p></td>` +
              `<td style="width: 28%; text-align: left"><p>${esc(s.jawatan || '-')}${
                s.gred ? ` (${esc(s.gred)})` : ''
              }</p></td>` +
              `<td style="width: 25%; text-align: left"><p>${esc(s.department || '-')}</p></td>` +
              `</tr>`
          )
          .join('');

        return (
          `<table><thead><tr>` +
          `<th style="width: 7%; text-align: center"><p style="text-align: center">Bil</p></th>` +
          `<th style="width: 40%; text-align: left"><p>Nama Penuh</p></th>` +
          `<th style="width: 28%; text-align: left"><p>Jawatan &amp; Gred</p></th>` +
          `<th style="width: 25%; text-align: left"><p>Opsyen Dominan / Unit</p></th>` +
          `</tr></thead><tbody>${rows}</tbody></table>`
        );
      };

      let html =
        maybeDivider +
        renderChapterHeader(
          section,
          `Senarai Rasmi Warga Pendidik & Anggota Kumpulan Pelaksana (${activeStaff.length} Orang)`
        );
      html += `<p>Komposisi perjawatan aktif semasa merangkumi <strong>${guruList.length} orang Pegawai Perkhidmatan Pendidikan (Guru)</strong> dan <strong>${akpList.length} orang Anggota Kumpulan Pelaksana (Staf Sokongan)</strong>.</p>`;

      if (guruList.length > 0) {
        html +=
          `<h2>4.1 Senarai Pegawai Perkhidmatan Pendidikan (Guru)</h2>` +
          renderStaffTable(guruList);
      }
      if (akpList.length > 0) {
        html +=
          `<h2>4.2 Senarai Anggota Kumpulan Pelaksana (Staf Sokongan)</h2>` +
          renderStaffTable(akpList);
      }
      return html;
    }

    case 'beban': {
      const refPts = Number(profile?.workload_settings?.reference_points) || 40;
      const activeStaff = staff
        .filter((s) => s.status !== 'Tidak Aktif')
        .map((s) => {
          const assignments: { committeeName: string; role: string; weight: number }[] = [];
          committees.forEach((c) => {
            (c.staff_committees || []).forEach((sc: any) => {
              if (sc.staff_id === s.id || sc.staff?.id === s.id) {
                assignments.push({
                  committeeName: c.name,
                  role: sc.role,
                  weight: Number(sc.workload_weightage) || 0,
                });
              }
            });
          });
          const totalPoints = assignments.reduce((sum, a) => sum + a.weight, 0);
          const pct = Math.round((totalPoints / refPts) * 100);
          return { ...s, assignments, totalPoints, pct };
        })
        .sort((a, b) => b.pct - a.pct || a.name.localeCompare(b.name, 'ms'));

      const rows = activeStaff
        .map(
          (s, idx) =>
            `<tr>` +
            `<td style="width: 7%; text-align: center"><p style="text-align: center">${idx + 1}</p></td>` +
            `<td style="width: 37%; text-align: left"><p>${esc(s.name)}</p></td>` +
            `<td style="width: 24%; text-align: left"><p>${esc(s.jawatan || '-')}${
              s.gred ? ` (${esc(s.gred)})` : ''
            }</p></td>` +
            `<td style="width: 10%; text-align: center"><p style="text-align: center">${s.assignments.length}</p></td>` +
            `<td style="width: 11%; text-align: center"><p style="text-align: center">${s.totalPoints} / ${refPts}</p></td>` +
            `<td style="width: 11%; text-align: center"><p style="text-align: center"><strong>${s.pct}%</strong></p></td>` +
            `</tr>`
        )
        .join('');

      return (
        maybeDivider +
        renderChapterHeader(
          section,
          `Taburan Pemberatan Tugas Berdasarkan Kadar Rujukan ${refPts} Mata (100%)`
        ) +
        `<p>Jadual berikut memaparkan rumusan agihan tugas jawatankuasa dan mata pemberatan semasa bagi memastikan keseimbangan beban tugas dalam kalangan semua warga sekolah.</p>` +
        `<table><thead><tr>` +
        `<th style="width: 7%; text-align: center"><p style="text-align: center">Bil</p></th>` +
        `<th style="width: 37%; text-align: left"><p>Nama Warga</p></th>` +
        `<th style="width: 24%; text-align: left"><p>Jawatan &amp; Gred</p></th>` +
        `<th style="width: 10%; text-align: center"><p style="text-align: center">Bil. JK</p></th>` +
        `<th style="width: 11%; text-align: center"><p style="text-align: center">Mata</p></th>` +
        `<th style="width: 11%; text-align: center"><p style="text-align: center">Beban (%)</p></th>` +
        `</tr></thead><tbody>${rows}</tbody></table>`
      );
    }

    case 'sop':
      return (
        maybeDivider +
        renderChapterHeader(
          section,
          'Garis Panduan Perkhidmatan, Tatakerja & Prosedur Operasi Standard'
        ) +
        '<h2>6.1 Arahan Am &amp; Tatasusila Perkhidmatan</h2><ul>' +
        '<li><p><strong>Tatasusila Profesion:</strong> Selaku pegawai perkhidmatan awam, semua guru dan staf tertakluk kepada Perintah Am Kerajaan, Peraturan-Peraturan Pegawai Awam (Kelakuan dan Tatatertib), serta pekeliling ikhtisas Kementerian Pendidikan Malaysia yang berkuat kuasa.</p></li>' +
        '<li><p><strong>Kehadiran &amp; Waktu Bertugas Rasmi:</strong> Warga sekolah dikehendaki berada di kawasan sekolah sebelum waktu rasmi bermula dan merekodkan kehadiran melalui sistem yang ditetapkan.</p></li></ul>' +
        '<h2>6.2 Pengurusan Cuti, Mesyuarat &amp; Dokumen Rasmi</h2><ul>' +
        '<li><p><strong>Permohonan Cuti:</strong> Semua permohonan cuti rehat khas atau cuti sakit hendaklah direkodkan dalam sistem HRMIS dan dimaklumkan kepada Pengetua / Guru Besar serta Penolong Kanan Pentadbiran lebih awal bagi penyusunan jadual guru ganti.</p></li>' +
        '<li><p><strong>Pengurusan Mesyuarat &amp; Minit:</strong> Setiausaha setiap jawatankuasa bertanggungjawab mengeluarkan notis panggilan mesyuarat sekurang-kurangnya 7 hari sebelum mesyuarat dan mengedarkan minit mesyuarat dalam tempoh 7 hari bekerja selepas mesyuarat berlangsung.</p></li>' +
        '<li><p><strong>Pengurusan Fail &amp; Rekod PdPc:</strong> Semua fail jawatankuasa hendaklah dikemas kini mengikut piawaian sistem fail sekolah manakala Rekod Pengajaran dan Pembelajaran (e-RPH) dilengkapkan mengikut jadual penyeliaan.</p></li></ul>'
      );

    case 'pentadbiran':
    case 'kurikulum':
    case 'hem':
    case 'koko':
    case 'tingkatan6':
    case 'ppki': {
      const catMap: Record<string, string> = {
        pentadbiran: 'Pentadbiran',
        kurikulum: 'Kurikulum',
        hem: 'Hal Ehwal Murid',
        koko: 'Kokurikulum',
        tingkatan6: 'Tingkatan 6',
        ppki: 'PPKI',
      };

      const targetCategory = catMap[id];
      const categoryCommittees = committees.filter(
        (c) =>
          c.category === targetCategory ||
          c.category === `Pengurusan ${targetCategory}`
      );

      if (categoryCommittees.length === 0 && (id === 'tingkatan6' || id === 'ppki')) return '';

      const baseNum = section?.title.split('.')[0] || '';
      let html =
        maybeDivider +
        renderChapterHeader(
          section,
          `Struktur Jawatankuasa, Agihan Peranan, Bidang Tugas & Sasaran Kerja Tahunan (${categoryCommittees.length} Jawatankuasa)`
        );

      if (categoryCommittees.length === 0) {
        return html + `<p><em>Tiada jawatankuasa direkodkan bagi kategori ini.</em></p>`;
      }

      categoryCommittees.forEach((c, cIdx) => {
        const subHeadingPrefix = baseNum ? `${baseNum}.${cIdx + 1} ` : '';
        html += `<h2>${esc(subHeadingPrefix + c.name)}</h2>`;

        const sortedMembers = sortCommitteeMembers(c.staff_committees || []);
        if (sortedMembers.length > 0) {
          html +=
            `<table><thead><tr>` +
            `<th style="width: 8%; text-align: center"><p style="text-align: center">Bil</p></th>` +
            `<th style="width: 34%; text-align: left"><p>Jawatan / Peranan</p></th>` +
            `<th style="width: 58%; text-align: left"><p>Nama Ahli</p></th>` +
            `</tr></thead><tbody>`;
          sortedMembers.forEach((sc: any, idx: number) => {
            html +=
              `<tr>` +
              `<td style="width: 8%; text-align: center"><p style="text-align: center">${idx + 1}</p></td>` +
              `<td style="width: 34%; text-align: left"><p>${esc(sc.role)}</p></td>` +
              `<td style="width: 58%; text-align: left"><p>${esc(
                sc.staff?.name || 'Belum Ditetapkan'
              )}</p></td>` +
              `</tr>`;
          });
          html += `</tbody></table>`;
        } else {
          html += `<p><em>Belum ada ahli ditetapkan bagi jawatankuasa ini.</em></p>`;
        }

        if (c.senarai_tugas) {
          html +=
            `<h3>Bidang Tugas &amp; Tanggungjawab</h3>` +
            formatStructuredTextHTML(c.senarai_tugas);
        }
        if (c.sasaran_kerja) {
          html +=
            `<h3>Sasaran Kerja Tahunan (SKT)</h3>` +
            formatStructuredTextHTML(c.sasaran_kerja);
        }
      });

      return html;
    }

    case 'glosari': {
      const entries: Array<[string, string]> = [
        ['KPM', 'Kementerian Pendidikan Malaysia'],
        ['JPN', 'Jabatan Pendidikan Negeri'],
        ['PPD', 'Pejabat Pendidikan Daerah'],
        ['GPK / PK', 'Guru Penolong Kanan / Penolong Kanan'],
        ['GKMP', 'Guru Kanan Mata Pelajaran'],
        ['KP', 'Ketua Panitia'],
        ['AKP', 'Anggota Kumpulan Pelaksana'],
        ['HEM', 'Hal Ehwal Murid'],
        ['PdPc', 'Pengajaran dan Pemudahcaraan'],
        ['PBD', 'Pentaksiran Bilik Darjah'],
        ['PAJSK', 'Pentaksiran Aktiviti Jasmani, Sukan dan Kokurikulum'],
        ['PPKI', 'Program Pendidikan Khas Integrasi'],
        ['RPI', 'Rancangan Pendidikan Individu'],
        ['SKT', 'Sasaran Kerja Tahunan'],
        ['KPI', 'Petunjuk Prestasi Utama (Key Performance Indicator)'],
        ['PIBG', 'Persatuan Ibu Bapa dan Guru'],
        ['HRMIS', 'Sistem Maklumat Pengurusan Sumber Manusia'],
        ['SPLKPM', 'Sistem Pengurusan Latihan Kementerian Pendidikan Malaysia'],
      ];

      const rows = entries
        .map(
          ([abbr, desc]) =>
            `<tr><td style="width: 24%; text-align: center"><p style="text-align: center"><strong>${esc(
              abbr
            )}</strong></p></td><td style="width: 76%; text-align: left"><p>${esc(
              desc
            )}</p></td></tr>`
        )
        .join('');

      return (
        renderChapterHeader(
          section,
          'Senarai Singkatan & Istilah Rasmi Pengurusan Sekolah'
        ) +
        `<table><thead><tr>` +
        `<th style="width: 24%; text-align: center"><p style="text-align: center">Singkatan</p></th>` +
        `<th style="width: 76%; text-align: left"><p>Maksud Penuh</p></th>` +
        `</tr></thead><tbody>${rows}</tbody></table>`
      );
    }

    default:
      return renderChapterHeader(section) + `<p>Sila masukkan kandungan di sini...</p>`;
  }
}

export function buildAllSections(
  profile: any,
  staff: any[],
  committees: any[],
  coverConfig?: Partial<CoverConfig>
): Record<string, string> {
  const out: Record<string, string> = {};
  bookSections.forEach(
    (s) => (out[s.id] = buildSection(s.id, profile, staff, committees, coverConfig))
  );
  return out;
}