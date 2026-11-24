import JSZip from 'jszip';
import { supabase } from './supabase';
import { DEFAULT_WORKLOAD_SETTINGS } from './autoAssignEngine';

export interface StaffLookupRecord {
  id: string;
  name: string;
  jawatan?: string | null;
  gred?: string | null;
  department?: string | null;
}

export interface ExtractedSlot {
  slot_no: number;
  role: string;
  raw_member_text: string;
  assignment_type: 'individual' | 'collective_rule' | 'vacant';
  matched_staff_id: string | null;
  matched_staff_name: string | null;
  match_confidence: 'high' | 'medium' | 'low';
  candidate_suggestions: Array<{ id: string; name: string; jawatan?: string | null; score: number }>;
  collective_rule: string | null;
  position_duties: string | null;
  weightage: number;
  slot_warning?: string | null;
}

export interface ExtractedCommitteeDraft {
  temp_id: string;
  selected_for_import: boolean;
  sort_order: number;
  category: string;
  sub_category: string | null;
  unit_code: string | null;
  committee_name: string;
  parent_committee_name: string | null;
  description: string | null;
  bidang_tugas_structured: {
    perancangan?: string;
    pelaksanaan?: string;
    pemantauan?: string;
    pelaporan?: string;
    lain_lain?: string;
  };
  senarai_tugas_verbatim: string;
  sasaran_kerja_list: string[];
  sasaran_kerja_verbatim: string;
  slots: ExtractedSlot[];
  confidence_level: 'high' | 'medium' | 'low';
  review_flags: string[];
  existing_committee_id: string | null;
  resolution_action: 'create' | 'merge_update';
}

/**
 * Redacts Malaysian NRIC (e.g., 850101-13-5123) and phone numbers before processing
 */
export function redactSensitivePII(text: string): string {
  return text
    .replace(/\b\d{6}-?\d{2}-?\d{4}\b/g, '[NO_KP_DIRAHSIAAKAN]')
    .replace(/\b(?:\+?60|0)1[0-9]-?\d{7,8}\b/g, '[NO_TEL_DIRAHSIAAKAN]');
}

/**
 * Extracts structured blocks from a .docx file while preserving exact table rows
 */
export async function parseDocxToStructuredText(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const zip = await JSZip.loadAsync(arrayBuffer);
  const documentXml = await zip.file('word/document.xml')?.async('string');

  if (!documentXml) {
    throw new Error('Fail .docx tidak sah atau rosak (word/document.xml tidak ditemui).');
  }

  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(documentXml, 'application/xml');
  const body = xmlDoc.getElementsByTagName('w:body')[0];
  if (!body) throw new Error('Kandungan dokumen kosong.');

  const lines: string[] = [];

  for (const node of Array.from(body.childNodes)) {
    if (node.nodeName === 'w:p') {
      const textNodes = (node as Element).getElementsByTagName('w:t');
      const paragraphText = Array.from(textNodes)
        .map((t) => t.textContent || '')
        .join('')
        .trim();
      if (paragraphText) lines.push(paragraphText);
    } else if (node.nodeName === 'w:tbl') {
      lines.push('[TABLE_START]');
      const rows = (node as Element).getElementsByTagName('w:tr');
      for (const row of Array.from(rows)) {
        const cells = row.getElementsByTagName('w:tc');
        const cellValues = Array.from(cells).map((cell) => {
          const cellTexts = cell.getElementsByTagName('w:t');
          return Array.from(cellTexts)
            .map((t) => t.textContent || '')
            .join(' ')
            .replace(/\s+/g, ' ')
            .trim();
        });
        if (cellValues.some(Boolean)) {
          lines.push(cellValues.join(' | '));
        }
      }
      lines.push('[TABLE_END]');
    }
  }

  return redactSensitivePII(lines.join('\n'));
}

/**
 * Extracts readable text lines from an uncompressed or standard text-based PDF file.
 */
export async function parsePdfToStructuredText(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  const decoder = new TextDecoder('latin1');
  const rawBinary = decoder.decode(bytes);

  // Extract parenthesized PDF text literals inside BT...ET blocks
  const textChunks: string[] = [];
  const literalRegex = /\(([^()\\]*(?:\\.[^()\\]*)*)\)\s*(?:Tj|'|")/g;
  let match: RegExpExecArray | null;
  while ((match = literalRegex.exec(rawBinary)) !== null) {
    const unescaped = match[1]
      .replace(/\\n/g, '\n')
      .replace(/\\r/g, '')
      .replace(/\\t/g, ' ')
      .replace(/\\\(/g, '(')
      .replace(/\\\)/g, ')')
      .replace(/\\\\/g, '\\')
      .trim();
    if (unescaped) textChunks.push(unescaped);
  }

  const combined = textChunks.join('\n').trim();
  if (combined.length < 40) {
    throw new Error(
      'Fail PDF ini menggunakan pengekodan imej/mampatan binari. Sila muat naik fail Word (.docx) asal atau PDF berasaskan teks.'
    );
  }

  return redactSensitivePII(combined);
}

/**
 * Normalizes Malaysian teacher names for fuzzy matching against `public.staff`
 */
export function normalizeMalayName(raw: string): string {
  return raw
    .replace(/\([^)]*\)/g, ' ') // strip parenthetical role notes e.g. "(Guru Media)"
    .toLowerCase()
    .replace(
      /\b(encik|en|puan|pn|cik|ustaz|ustazah|dr|prof|ir|ts|haji|hj|hajjah|hjh|datuk|dato|datin)\b\.?/gi,
      ''
    )
    .replace(/\b(bin|binti|b|bt|a\/l|a\/p|anak)\b\.?/gi, ' ')
    .replace(/[^a-z\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function tokenSimilarity(a: string, b: string): number {
  const tokensA = new Set(a.split(' ').filter(Boolean));
  const tokensB = new Set(b.split(' ').filter(Boolean));
  if (tokensA.size === 0 || tokensB.size === 0) return 0;

  let overlap = 0;
  tokensA.forEach((t) => {
    if (tokensB.has(t)) overlap++;
  });
  return overlap / Math.max(tokensA.size, tokensB.size);
}

function inferWeightageFromRole(role: string): number {
  const lower = role.toLowerCase();
  const w = DEFAULT_WORKLOAD_SETTINGS.weights;
  if (lower.includes('penasihat') || lower === 'pengerusi' || lower === 'pengetua') {
    return w['EX_OFFICIO_PENGERUSI'] || 2;
  }
  if (lower.includes('timbalan') || lower.includes('tim.') || lower.includes('naib') || lower.includes('penolong pengerusi')) {
    return w['EX_OFFICIO_TIMBALAN'] || 3;
  }
  if (lower.includes('ketua panitia')) return w['Ketua Panitia'] || 10;
  if (lower.includes('penolong setiausaha') || lower.includes('pen. setiausaha')) {
    return w['Penolong Setiausaha'] || 5;
  }
  if (lower.includes('setiausaha') || lower.includes('sue')) return w['Setiausaha'] || 8;
  if (
    lower.includes('penyelaras') ||
    lower.includes('ketua unit') ||
    lower.includes('guru perpustakaan') ||
    lower.includes('penyelia kanan')
  ) {
    return w['Penyelaras'] || 8;
  }
  return w['Ahli Jawatankuasa'] || 2;
}

export function matchStaffMember(
  rawMemberText: string,
  staffList: StaffLookupRecord[]
): Pick<
  ExtractedSlot,
  | 'assignment_type'
  | 'matched_staff_id'
  | 'matched_staff_name'
  | 'match_confidence'
  | 'candidate_suggestions'
  | 'collective_rule'
  | 'slot_warning'
> {
  const cleaned = rawMemberText.trim();
  const lower = cleaned.toLowerCase();

  // 1. Vacant / template placeholder detection
  if (
    !cleaned ||
    cleaned === '-' ||
    cleaned === '—' ||
    lower === 'staff name' ||
    lower.startsWith('staff name ') ||
    lower.includes('[name]') ||
    lower.includes('kosong') ||
    lower.includes('guru baru') ||
    lower.includes('akan dilantik')
  ) {
    return {
      assignment_type: 'vacant',
      matched_staff_id: null,
      matched_staff_name: null,
      match_confidence: 'low',
      candidate_suggestions: [],
      collective_rule: null,
      slot_warning: 'Slot kosong / templat tanpa nama guru — boleh diisi manual atau melalui Auto Agih.',
    };
  }

  // 2. Collective / Ex-Officio group rule detection
  if (
    lower.startsWith('semua ') ||
    lower.startsWith('kp ') ||
    lower.startsWith('su ') ||
    lower.includes('pembantu makmal') ||
    lower.includes('ketua panitia') ||
    lower.includes('guru kanan mata pelajaran') ||
    lower.includes('guru tingkatan') ||
    lower.includes('guru subjek') ||
    lower.includes('unit pendigitalan')
  ) {
    return {
      assignment_type: 'collective_rule',
      matched_staff_id: null,
      matched_staff_name: null,
      match_confidence: 'high',
      candidate_suggestions: [],
      collective_rule: cleaned,
      slot_warning: null,
    };
  }

  // 3. Individual teacher fuzzy matching
  const normInput = normalizeMalayName(cleaned);
  const scored: Array<{ id: string; name: string; jawatan?: string | null; score: number }> = [];

  for (const s of staffList) {
    const normStaff = normalizeMalayName(s.name);
    if (!normStaff) continue;
    const score = normInput === normStaff ? 1 : tokenSimilarity(normInput, normStaff);
    if (score >= 0.45) {
      scored.push({ id: s.id, name: s.name, jawatan: s.jawatan, score });
    }
  }

  scored.sort((a, b) => b.score - a.score);
  const top = scored[0] || null;
  const second = scored[1] || null;
  const isAmbiguous = Boolean(top && second && top.score < 1 && top.score - second.score < 0.12);

  if (top && top.score >= 0.85 && !isAmbiguous) {
    return {
      assignment_type: 'individual',
      matched_staff_id: top.id,
      matched_staff_name: top.name,
      match_confidence: 'high',
      candidate_suggestions: scored.slice(0, 4),
      collective_rule: null,
      slot_warning: null,
    };
  }

  if (top && top.score >= 0.55) {
    return {
      assignment_type: 'individual',
      matched_staff_id: top.id,
      matched_staff_name: top.name,
      match_confidence: 'medium',
      candidate_suggestions: scored.slice(0, 4),
      collective_rule: null,
      slot_warning: isAmbiguous
        ? `Padanan samar antara "${top.name}" dan "${second?.name}" — sila sahkan.`
        : `Padanan separa (${Math.round(top.score * 100)}%) — sila sahkan nama penuh.`,
    };
  }

  return {
    assignment_type: 'individual',
    matched_staff_id: null,
    matched_staff_name: null,
    match_confidence: 'low',
    candidate_suggestions: scored.slice(0, 4),
    collective_rule: null,
    slot_warning: `Nama "${cleaned}" tidak ditemui dalam direktori Warga Sekolah.`,
  };
}

/**
 * Deterministic parser for Malaysian school Jawatankuasa & Bidang Tugas documents.
 * Recognizes group headers, numbered/unnumbered committee titles, tables, 4P Bidang Tugas,
 * and Sasaran Kerja Tahunan across varying layouts.
 */
export function parseStructuredDocumentToCommittees(params: {
  structuredText: string;
  targetCategory: string;
  staffList: StaffLookupRecord[];
  existingCommittees: Array<{ id: string; name: string }>;
}): ExtractedCommitteeDraft[] {
  const { structuredText, targetCategory, staffList, existingCommittees } = params;
  const lines = structuredText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  const drafts: ExtractedCommitteeDraft[] = [];
  let currentSubCategory: string | null = null;
  let currentDraft: {
    unit_code: string | null;
    committee_name: string;
    sub_category: string | null;
    rawRows: Array<{ bil: string; member: string; role: string }>;
    bidang_tugas_structured: ExtractedCommitteeDraft['bidang_tugas_structured'];
    bidangLines: string[];
    sasaranLines: string[];
  } | null = null;

  type ParseSection = 'header' | 'table' | 'bidang_tugas' | 'sasaran';
  let section: ParseSection = 'header';
  let inTable = false;

  const groupHeadingRegex = /^(?:kumpulan\s*\d+\s*:|\d+\s*:)\s*(.+)$/i;
  const committeeHeadingRegex =
    /^(?:(\d+(?:\.\d+)+)\s+)?((?:JAWATANKUASA|UNIT|BIDANG|PANITIA|MAJLIS|PASUKAN|KELAB)\b.+)$/;

  const flushCurrentDraft = () => {
    if (!currentDraft) return;

    const existingMatch = existingCommittees.find(
      (ec) => ec.name.trim().toLowerCase() === currentDraft!.committee_name.trim().toLowerCase()
    );

    const seenStaffIds = new Set<string>();
    const slots: ExtractedSlot[] = currentDraft.rawRows.map((row, idx) => {
      const roleText = (row.role || 'Ahli Jawatankuasa').trim();
      const memberText = (row.member || '').trim();
      const matchRes = matchStaffMember(memberText, staffList);

      let slotWarning = matchRes.slot_warning || null;
      if (matchRes.matched_staff_id) {
        if (seenStaffIds.has(matchRes.matched_staff_id)) {
          slotWarning = `Duplikasi: ${matchRes.matched_staff_name} disenaraikan lebih dari sekali dalam jawatankuasa ini.`;
        }
        seenStaffIds.add(matchRes.matched_staff_id);
      }

      return {
        slot_no: idx + 1,
        role: roleText,
        raw_member_text: memberText,
        position_duties: null,
        weightage: inferWeightageFromRole(roleText),
        ...matchRes,
        slot_warning: slotWarning,
      };
    });

    const flags: string[] = [];
    if (existingMatch) {
      flags.push(`Jawatankuasa sedia ada ditemui: "${existingMatch.name}"`);
    }
    const unmatchedIndividuals = slots.filter(
      (s) => s.assignment_type === 'individual' && !s.matched_staff_id
    ).length;
    const ambiguousIndividuals = slots.filter(
      (s) => s.assignment_type === 'individual' && s.match_confidence === 'medium'
    ).length;
    const duplicateCount = slots.filter((s) => s.slot_warning?.startsWith('Duplikasi:')).length;

    if (unmatchedIndividuals > 0) {
      flags.push(`${unmatchedIndividuals} nama guru tidak ditemui dalam Warga Sekolah`);
    }
    if (ambiguousIndividuals > 0) {
      flags.push(`${ambiguousIndividuals} padanan nama perlu pengesahan`);
    }
    if (duplicateCount > 0) {
      flags.push(`${duplicateCount} pertindihan ahli dalam jawatankuasa yang sama`);
    }
    if (slots.length === 0) {
      flags.push('Tiada jadual ahli dikesan — semak struktur jawatankuasa');
    }

    const confidenceLevel: 'high' | 'medium' | 'low' =
      unmatchedIndividuals > 0 || duplicateCount > 0 || slots.length === 0
        ? 'low'
        : existingMatch || ambiguousIndividuals > 0
          ? 'medium'
          : 'high';

    const senaraiTugasVerbatim = currentDraft.bidangLines.join('\n').trim();
    const sasaranKerjaVerbatim = currentDraft.sasaranLines.join('\n').trim();
    const sasaranKerjaList = sasaranKerjaVerbatim
      ? sasaranKerjaVerbatim
          .split(/\n|;\s*/)
          .map((s) => s.trim())
          .filter(Boolean)
      : [];

    drafts.push({
      temp_id: `import-jk-${drafts.length + 1}-${Date.now()}`,
      selected_for_import: true,
      sort_order: drafts.length + 1,
      category: targetCategory,
      sub_category: currentDraft.sub_category,
      unit_code: currentDraft.unit_code,
      committee_name: currentDraft.committee_name.trim(),
      parent_committee_name: null,
      description: currentDraft.sub_category
        ? `${currentDraft.sub_category} (${currentDraft.committee_name.trim()})`
        : null,
      bidang_tugas_structured: currentDraft.bidang_tugas_structured,
      senarai_tugas_verbatim: senaraiTugasVerbatim,
      sasaran_kerja_list: sasaranKerjaList,
      sasaran_kerja_verbatim: sasaranKerjaVerbatim,
      slots,
      confidence_level: confidenceLevel,
      review_flags: flags,
      existing_committee_id: existingMatch?.id || null,
      resolution_action: existingMatch ? 'merge_update' : 'create',
    });

    currentDraft = null;
  };

  for (const line of lines) {
    if (line === '[TABLE_START]') {
      inTable = true;
      section = 'table';
      continue;
    }
    if (line === '[TABLE_END]') {
      inTable = false;
      continue;
    }

    // Group / Sub-category heading (e.g., "1: Pengurusan Induk..." or "Kumpulan 2: ...")
    const groupMatch = !inTable ? line.match(groupHeadingRegex) : null;
    if (groupMatch && line === line.replace(/^kumpulan\s*\d+\s*:\s*/i, (m) => m) && !/^(JAWATANKUASA|UNIT|BIDANG|PANITIA)\b/.test(groupMatch[1])) {
      flushCurrentDraft();
      currentSubCategory = groupMatch[1].trim();
      continue;
    }

    // Committee / Unit / Bidang heading
    const commMatch = !inTable ? line.match(committeeHeadingRegex) : null;
    if (commMatch && line === line.toUpperCase()) {
      flushCurrentDraft();
      currentDraft = {
        unit_code: commMatch[1] ? commMatch[1].trim() : null,
        committee_name: commMatch[2].trim(),
        sub_category: currentSubCategory,
        rawRows: [],
        bidang_tugas_structured: {},
        bidangLines: [],
        sasaranLines: [],
      };
      section = 'header';
      continue;
    }

    if (!currentDraft) continue;

    // Section markers
    const upperLine = line.toUpperCase();
    if (upperLine.startsWith('PERINCIAN BIDANG TUGAS') || upperLine === 'BIDANG TUGAS' || upperLine === 'SENARAI TUGAS') {
      section = 'bidang_tugas';
      continue;
    }
    if (upperLine.startsWith('SASARAN KERJA TAHUNAN') || upperLine === 'SKT' || upperLine === 'KPI') {
      section = 'sasaran';
      continue;
    }

    // Table row parsing (supports both `[TABLE_START]` pipe rows and plain pipe-delimited rows)
    if (inTable || line.includes(' | ')) {
      const cells = line.split('|').map((c) => c.trim());
      if (cells.length >= 2) {
        const firstLower = cells[0].toLowerCase();
        const secondLower = (cells[1] || '').toLowerCase();
        // Skip header row ("Bil | Nama Ahli | Jawatan")
        if (
          firstLower === 'bil' ||
          firstLower === 'no' ||
          secondLower === 'nama ahli' ||
          secondLower === 'nama'
        ) {
          continue;
        }
        if (cells.length >= 3) {
          currentDraft.rawRows.push({
            bil: cells[0],
            member: cells[1],
            role: cells.slice(2).join(' | '),
          });
        } else {
          currentDraft.rawRows.push({
            bil: '',
            member: cells[0],
            role: cells[1],
          });
        }
        continue;
      }
    }

    // Bidang Tugas content
    if (section === 'bidang_tugas') {
      currentDraft.bidangLines.push(line);
      const kvMatch = line.match(/^(Perancangan|Pelaksanaan|Pemantauan|Pelaporan)\s*:\s*(.+)$/i);
      if (kvMatch) {
        const key = kvMatch[1].toLowerCase() as 'perancangan' | 'pelaksanaan' | 'pemantauan' | 'pelaporan';
        currentDraft.bidang_tugas_structured[key] = kvMatch[2].trim();
      } else {
        currentDraft.bidang_tugas_structured.lain_lain = currentDraft.bidang_tugas_structured.lain_lain
          ? `${currentDraft.bidang_tugas_structured.lain_lain}\n${line}`
          : line;
      }
      continue;
    }

    // Sasaran Kerja Tahunan content
    if (section === 'sasaran') {
      currentDraft.sasaranLines.push(line);
      continue;
    }
  }

  flushCurrentDraft();
  return drafts;
}

/**
 * Extracts and prepares review drafts from an uploaded .docx or .pdf document.
 * Uses deterministic parsing first, and optionally enriches via Edge Function if deployed.
 */
export async function extractCommitteesFromDocument(params: {
  file: File;
  targetCategory: string;
  staffList: StaffLookupRecord[];
  existingCommittees: Array<{ id: string; name: string }>;
}): Promise<ExtractedCommitteeDraft[]> {
  const { file, targetCategory, staffList, existingCommittees } = params;
  const lowerName = file.name.toLowerCase();

  let structuredText = '';
  if (lowerName.endsWith('.docx')) {
    structuredText = await parseDocxToStructuredText(file);
  } else if (lowerName.endsWith('.pdf')) {
    structuredText = await parsePdfToStructuredText(file);
  } else {
    throw new Error('Format fail tidak disokong. Sila muat naik fail Word (.docx) atau PDF (.pdf).');
  }

  const deterministicDrafts = parseStructuredDocumentToCommittees({
    structuredText,
    targetCategory,
    staffList,
    existingCommittees,
  });

  if (deterministicDrafts.length > 0) {
    return deterministicDrafts;
  }

  // Fallback to Supabase Edge Function for unstructured layouts if deterministic parser found 0 blocks
  const { data: extracted, error: fnError } = await supabase.functions.invoke('extract-bidang-tugas', {
    body: {
      documentText: structuredText,
      targetCategory,
      fileName: file.name,
    },
  });

  if (fnError || !Array.isArray(extracted?.committees) || extracted.committees.length === 0) {
    throw new Error(
      'Tiada struktur Jawatankuasa atau Unit dapat dikesan dalam dokumen ini. Pastikan tajuk jawatankuasa dan jadual ahli jelas.'
    );
  }

  return extracted.committees.map((c: any, idx: number) => {
    const existingMatch = existingCommittees.find(
      (ec) => ec.name.trim().toLowerCase() === (c.committee_name || '').trim().toLowerCase()
    );
    const slots: ExtractedSlot[] = (c.slots || []).map((slot: any, sIdx: number) => {
      const matchRes = matchStaffMember(slot.raw_member_text || '', staffList);
      return {
        slot_no: Number(slot.slot_no) || sIdx + 1,
        role: (slot.role || 'Ahli Jawatankuasa').trim(),
        raw_member_text: (slot.raw_member_text || '').trim(),
        position_duties: slot.position_duties || null,
        weightage: Number(slot.weightage) || inferWeightageFromRole(slot.role || ''),
        ...matchRes,
      };
    });

    return {
      temp_id: `import-ai-${idx + 1}-${Date.now()}`,
      selected_for_import: true,
      sort_order: idx + 1,
      category: targetCategory,
      sub_category: c.sub_category || null,
      unit_code: c.unit_code || null,
      committee_name: (c.committee_name || '').trim(),
      parent_committee_name: c.parent_committee_name || null,
      description: c.description || null,
      bidang_tugas_structured: c.bidang_tugas_structured || {},
      senarai_tugas_verbatim: c.senarai_tugas_verbatim || '',
      sasaran_kerja_list: Array.isArray(c.sasaran_kerja_list) ? c.sasaran_kerja_list : [],
      sasaran_kerja_verbatim: c.sasaran_kerja_verbatim || '',
      slots,
      confidence_level: 'medium',
      review_flags: c.review_flags || [],
      existing_committee_id: existingMatch?.id || null,
      resolution_action: existingMatch ? 'merge_update' : 'create',
    };
  });
}

/**
 * Commits confirmed review drafts directly into the unified production tables
 * (`public.committees` and `public.staff_committees`).
 */
export async function commitConfirmedImportDrafts(params: {
  drafts: ExtractedCommitteeDraft[];
  schoolId: string;
  academicSession: string;
}): Promise<{ importedCommittees: number; importedAssignments: number }> {
  const { drafts, schoolId, academicSession } = params;
  const selectedDrafts = drafts.filter((d) => d.selected_for_import && d.committee_name.trim());

  let importedCommittees = 0;
  let importedAssignments = 0;

  for (const draft of selectedDrafts) {
    const defaultPositions = Array.from(
      new Set(draft.slots.map((s) => s.role.trim()).filter(Boolean))
    );

    const committeePayload = {
      school_id: schoolId,
      category: draft.category,
      name: draft.committee_name.trim(),
      description:
        draft.description ||
        (draft.sub_category ? `${draft.sub_category}` : null),
      senarai_tugas: draft.senarai_tugas_verbatim,
      sasaran_kerja: draft.sasaran_kerja_verbatim,
      default_positions: defaultPositions.length > 0 ? defaultPositions : ['Pengerusi', 'Setiausaha', 'AJK'],
    };

    let targetCommitteeId = draft.existing_committee_id;

    if (targetCommitteeId && draft.resolution_action === 'merge_update') {
      const { error: updateErr } = await supabase
        .from('committees')
        .update({
          category: committeePayload.category,
          name: committeePayload.name,
          description: committeePayload.description,
          senarai_tugas: committeePayload.senarai_tugas,
          sasaran_kerja: committeePayload.sasaran_kerja,
          default_positions: committeePayload.default_positions,
        })
        .eq('id', targetCommitteeId);

      if (updateErr) throw new Error(updateErr.message);

      // Replace existing assignments for this committee with confirmed imported slots
      await supabase.from('staff_committees').delete().eq('committee_id', targetCommitteeId);
    } else {
      const { data: insertedCom, error: insertErr } = await supabase
        .from('committees')
        .insert(committeePayload)
        .select('id')
        .single();

      if (insertErr || !insertedCom) {
        throw new Error(insertErr?.message || `Gagal mencipta ${draft.committee_name}`);
      }
      targetCommitteeId = insertedCom.id;
    }

    importedCommittees++;

    // Deduplicate matched staff within the same committee before inserting into `staff_committees`
    const seenStaffIds = new Set<string>();
    const memberRows = draft.slots
      .filter((slot) => {
        if (!slot.matched_staff_id) return false;
        if (seenStaffIds.has(slot.matched_staff_id)) return false;
        seenStaffIds.add(slot.matched_staff_id);
        return true;
      })
      .map((slot) => ({
        staff_id: slot.matched_staff_id!,
        committee_id: targetCommitteeId!,
        school_id: schoolId,
        role: slot.role.trim() || 'Ahli Jawatankuasa',
        workload_weightage: Number(slot.weightage) || 2,
        academic_session: academicSession,
        is_auto_assigned: false,
      }));

    if (memberRows.length > 0) {
      const { error: memberErr } = await supabase.from('staff_committees').insert(memberRows);
      if (memberErr) {
        throw new Error(`Gagal memasukkan ahli bagi ${draft.committee_name}: ${memberErr.message}`);
      }
      importedAssignments += memberRows.length;
    }
  }

  return { importedCommittees, importedAssignments };
}