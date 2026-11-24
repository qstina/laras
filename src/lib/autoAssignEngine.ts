import { supabase } from './supabase';
import { committeeTemplates } from './committeeTemplates';
import type {
  AssignmentProposal,
  AssignmentRuleConfig,
  AutoAssignRunResult,
  CandidateEvaluation,
  ExistingAssignment,
  ExistingCommittee,
  PositionSlotRule,
  StandardizedJawatan,
  TeacherProfile,
  TeacherWorkloadSummary,
} from '../types/autoAssign';

export type AutoAssignMode = 'fill_vacancies' | 'regenerate_all';

export interface ApplyAutoAssignmentsOptions {
  schoolId: string;
  academicSession?: string;
  mode?: AutoAssignMode;
}

export interface AutoAssignPreviewResult extends AutoAssignRunResult {
  academicSession: string;
  teachers: TeacherProfile[];
  committees: ExistingCommittee[];
  existingAssignments: ExistingAssignment[];
  assignedCount: number;
  vacantCount: number;
  totalSlots: number;
}

export const DEFAULT_WORKLOAD_SETTINGS: {
  reference_points: number;
  weights: Record<string, number>;
} = {
  reference_points: 40, // 40 points = 100% workload
  weights: {
    'Pengerusi': 10,
    'Timbalan Pengerusi': 7,
    'Setiausaha': 8,
    'Penolong Setiausaha': 5,
    'Penyelaras': 8,
    'Ketua Panitia': 10,
    'Ahli Jawatankuasa': 2,
    'Guru Penasihat': 5,
    'EX_OFFICIO_PENGERUSI': 2,
    'EX_OFFICIO_TIMBALAN': 3,
  },
};

export const DEFAULT_ASSIGNMENT_CONFIG: AssignmentRuleConfig = {
  referencePoints: 40,
  maxWorkloadPercent: 120,
  minSuitabilityScore: 28,
  maxMajorLeadershipRolesPerTeacher: 2,
  weights: {
    leadershipMax: 35,
    expertiseMax: 35,
    workloadMax: 20,
    hierarchyMax: 10,
  },
  exemptTopManagementFromRoutineSlots: true,
  avoidDuplicateSubcommitteeChair: true,
};

const TOP_MANAGEMENT: StandardizedJawatan[] = [
  'PENGETUA',
  'PK_PENTADBIRAN',
  'PK_HEM',
  'PK_KOKURIKULUM',
  'PK_PETANG',
  'PK_PPKI',
  'PK_T6',
];

const MIDDLE_LEADERSHIP: StandardizedJawatan[] = [
  'GKMP',
  'KETUA_PANITIA',
  'GPM',
  'SU_KURIKULUM',
  'SU_PEPERIKSAAN',
];

export async function getSchoolWorkloadSettings(schoolId: string) {
  const { data } = await supabase
    .from('school_profile')
    .select('workload_settings')
    .eq('school_id', schoolId)
    .single();
  if (data?.workload_settings) {
    return { ...DEFAULT_WORKLOAD_SETTINGS, ...data.workload_settings };
  }
  return DEFAULT_WORKLOAD_SETTINGS;
}

/**
 * Normalizes Malaysian e-Operasi / HRMIS JAWATAN, GRED, and staff type
 * into standardized hierarchy roles.
 */
export function standardizeJawatan(
  raw: string | undefined | null,
  staffType?: string | null,
  gred?: string | null
): StandardizedJawatan {
  const upperType = (staffType || '').toUpperCase().trim();
  const cleanGred = (gred || '').toUpperCase().trim();
  const j = (raw || '').toLowerCase().trim();

  // Detect support staff (AKP / Sokongan) from type, non-DG grade, or post title
  const isNonTeachingGrade =
    cleanGred.length > 0 && !cleanGred.startsWith('DG') && !cleanGred.startsWith('DGA');
  if (
    upperType === 'AKP' ||
    upperType === 'SOKONGAN' ||
    isNonTeachingGrade ||
    j.includes('pembantu') ||
    j.includes('kerani') ||
    j.includes('juruteknik') ||
    j.includes('pemandu') ||
    j.includes('operasi')
  ) {
    return 'AKP';
  }

  if (!j) return 'GURU_BIASA';

  if (j.includes('pengetua') || j.includes('guru besar')) return 'PENGETUA';
  if (j.includes('pk hem') || j.includes('penolong kanan hem') || j.includes('hal ehwal murid') || j.includes('pk 2')) {
    return 'PK_HEM';
  }
  if (
    j.includes('pk koko') ||
    j.includes('penolong kanan koko') ||
    (j.includes('kokurikulum') && j.includes('penolong kanan')) ||
    j.includes('pk 3')
  ) {
    return 'PK_KOKURIKULUM';
  }
  if (j.includes('pk petang') || j.includes('penolong kanan petang') || j.includes('penyelia petang')) {
    return 'PK_PETANG';
  }
  if (j.includes('pk tingkatan 6') || j.includes('penolong kanan tingkatan 6') || j.includes('pk t6')) {
    return 'PK_T6';
  }
  if (j.includes('pk pendidikan khas') || j.includes('penolong kanan pendidikan khas') || j.includes('pk ppki')) {
    return 'PK_PPKI';
  }
  if (
    j === 'penolong kanan' ||
    j.includes('pk pentadbiran') ||
    j.includes('penolong kanan pentadbiran') ||
    j.includes('pk 1') ||
    j.includes('pk kurikulum')
  ) {
    return 'PK_PENTADBIRAN';
  }

  if (j.includes('gkmp') || j.includes('guru kanan mata pelajaran') || j.includes('ketua bidang')) {
    return 'GKMP';
  }
  if (j.includes('ketua panitia')) return 'KETUA_PANITIA';
  if (j.includes('perpustakaan') || j.includes('gpm') || j.includes('guru media')) return 'GPM';
  if (j.includes('su kurikulum') || j.includes('setiausaha kurikulum')) return 'SU_KURIKULUM';
  if (j.includes('su peperiksaan') || j.includes('setiausaha peperiksaan')) return 'SU_PEPERIKSAAN';
  if (j.includes('kaunselor') || j.includes('kaunseling') || j.includes('bimbingan')) return 'KAUNSELOR';

  return 'GURU_BIASA';
}

/**
 * Extracts numeric seniority score from SSPA (DG7-DG14) or SSM (DG41-DG54) grades.
 * Returns a normalized seniority tier: 1 (junior) to 4 (senior/pakar).
 */
function parseGradeSeniority(gred?: string | null): { tier: number; label: string } {
  if (!gred) return { tier: 2, label: '' };
  const match = gred.toUpperCase().match(/DG\s*(\d+)/);
  if (!match) return { tier: 2, label: gred };

  const num = parseInt(match[1], 10);
  // SSPA Grades: DG7, DG9, DG10, DG12, DG13, DG14
  if (num <= 14) {
    if (num >= 13) return { tier: 4, label: `DG${num}` };
    if (num >= 12) return { tier: 3, label: `DG${num}` };
    if (num >= 10) return { tier: 2, label: `DG${num}` };
    return { tier: 1, label: `DG${num}` };
  }
  // Legacy SSM Grades: DG41, DG44, DG48, DG52, DG54
  if (num >= 52) return { tier: 4, label: `DG${num}` };
  if (num >= 48) return { tier: 3, label: `DG${num}` };
  if (num >= 44) return { tier: 2, label: `DG${num}` };
  return { tier: 1, label: `DG${num}` };
}

/**
 * Derives rich subject, department, form-level, and functional domain tokens
 * from `OPSYEN DOMINAN` (`department`) and `JAWATAN`.
 */
function extractTeacherDomainProfile(teacher: TeacherProfile): {
  subjectTokens: string[];
  domainTags: string[];
  isTingkatan6: boolean;
  isPPKI: boolean;
  isDataTeacher: boolean;
  isLabAssistant: boolean;
} {
  const rawOpsyen = (teacher.department || '').trim();
  const rawJawatan = (teacher.jawatan || '').trim();
  const combined = `${rawOpsyen} ${rawJawatan}`.toLowerCase();

  const subjectTokens: string[] = [];
  const domainTags: string[] = [];

  if (rawOpsyen && rawOpsyen !== '-') {
    subjectTokens.push(rawOpsyen);
    rawOpsyen
      .split(/[-–,/()]/)
      .map((part) => part.trim())
      .filter((part) => part.length >= 2 && !['guru', 'mpei', 't6', 'kelas integrasi'].includes(part.toLowerCase()))
      .forEach((part) => subjectTokens.push(part));
  }

  (teacher.opsyen || []).forEach((o) => subjectTokens.push(o));
  (teacher.subjek_mengajar || []).forEach((s) => subjectTokens.push(s));
  (teacher.kepakaran || []).forEach((k) => domainTags.push(k));

  const isTingkatan6 =
    combined.includes('tingkatan 6') ||
    combined.includes('pra universiti') ||
    /\bt6\b/i.test(rawOpsyen);
  const isPPKI =
    combined.includes('pend khas') ||
    combined.includes('pendidikan khas') ||
    combined.includes('ppki');
  const isDataTeacher =
    combined.includes('pengurusan data') ||
    combined.includes('maklumat') ||
    combined.includes('ict');
  const isLabAssistant = combined.includes('pembantu makmal');

  if (
    combined.includes('bahasa melayu') ||
    combined.includes('bahasa inggeris') ||
    combined.includes('bahasa iban') ||
    combined.includes('bahasa cina') ||
    combined.includes('bahasa tamil') ||
    combined.includes('kesusasteraan') ||
    combined.includes('bidang bahasa') ||
    combined.includes('tesl')
  ) {
    domainTags.push('Bahasa', 'Bidang Bahasa');
  }

  if (
    combined.includes('matematik') ||
    combined.includes('mathematics') ||
    combined.includes('sains') ||
    combined.includes('science') ||
    combined.includes('fizik') ||
    combined.includes('physics') ||
    combined.includes('kimia') ||
    combined.includes('chemistry') ||
    combined.includes('biologi') ||
    combined.includes('biology') ||
    combined.includes('bidang sains dan matematik')
  ) {
    domainTags.push('Sains & Matematik', 'Bidang Sains dan Matematik');
  }

  if (
    combined.includes('sejarah') ||
    combined.includes('geografi') ||
    combined.includes('pendidikan islam') ||
    combined.includes('pendidikan moral') ||
    combined.includes('seni visual') ||
    combined.includes('pendidikan seni') ||
    combined.includes('tassawur') ||
    combined.includes('pengajian am') ||
    combined.includes('kemanusiaan')
  ) {
    domainTags.push('Sains Sosial', 'Kemanusiaan');
  }

  if (
    combined.includes('reka bentuk') ||
    combined.includes('rbt') ||
    combined.includes('sains komputer') ||
    combined.includes('ask') ||
    combined.includes('ict') ||
    combined.includes('perakaunan') ||
    combined.includes('ekonomi') ||
    combined.includes('perniagaan') ||
    combined.includes('pertanian') ||
    combined.includes('sains rumah tangga') ||
    combined.includes('teknik & vokasional') ||
    combined.includes('tvet')
  ) {
    domainTags.push('TVET', 'Teknik & Vokasional');
  }

  if (combined.includes('jasmani') || combined.includes('pjpk') || combined.includes('sukan')) {
    domainTags.push('PJPK', 'Sukan');
  }

  if (isDataTeacher) {
    domainTags.push('Data', 'ICT', 'IDME', 'e-Operasi', 'APDM', 'Jadual Waktu');
  }

  if (isTingkatan6) {
    domainTags.push('Tingkatan 6', 'T6', 'STPM');
  }

  if (isPPKI) {
    domainTags.push('PPKI', 'Pendidikan Khas');
  }

  if (isLabAssistant) {
    domainTags.push('Makmal', 'Amali Sains', 'PEKA');
  }

  return {
    subjectTokens: Array.from(new Set(subjectTokens)),
    domainTags: Array.from(new Set(domainTags)),
    isTingkatan6,
    isPPKI,
    isDataTeacher,
    isLabAssistant,
  };
}

function normalizeToken(val: string): string {
  return val.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
}

function listMatches(
  candidateValues: string[] | undefined,
  targetValues: string[] | undefined
): string[] {
  if (!candidateValues?.length || !targetValues?.length) return [];
  const matches: string[] = [];

  for (const target of targetValues) {
    const normTarget = normalizeToken(target);
    if (!normTarget) continue;

    for (const cand of candidateValues) {
      const normCand = normalizeToken(cand);
      if (!normCand) continue;
      if (normCand === normTarget || normCand.includes(normTarget) || normTarget.includes(normCand)) {
        if (!matches.includes(cand)) matches.push(cand);
      }
    }
  }
  return matches;
}

function inferWeightForRole(
  role: string,
  weights: Record<string, number> = DEFAULT_WORKLOAD_SETTINGS.weights
): number {
  const lower = role.toLowerCase();
  if (lower.includes('penasihat') || lower === 'pengerusi' || lower === 'pengetua') {
    return weights['EX_OFFICIO_PENGERUSI'] || 2;
  }
  if (lower.includes('timbalan') || lower.includes('tim.') || lower.includes('naib')) {
    return weights['EX_OFFICIO_TIMBALAN'] || 3;
  }
  if (lower.includes('ketua panitia')) return weights['Ketua Panitia'] || 10;
  if (lower.includes('penolong setiausaha') || lower.includes('pen. setiausaha')) {
    return weights['Penolong Setiausaha'] || 5;
  }
  if (lower.includes('setiausaha') || lower.includes('sue')) return weights['Setiausaha'] || 8;
  if (
    lower.includes('penyelaras') ||
    lower.includes('ketua unit') ||
    lower.includes('ketua guru') ||
    lower.includes('guru perpustakaan') ||
    lower.includes('penyelia kanan')
  ) {
    return weights['Penyelaras'] || 8;
  }
  return weights['Ahli Jawatankuasa'] || 2;
}

function inferKeywordsFromCommitteeAndRole(committeeName: string, roleName: string): string[] {
  const n = `${committeeName} ${roleName}`.toLowerCase();
  const keywords: string[] = [];

  if (n.includes('matematik') || n.includes('mate')) keywords.push('Matematik', 'Matematik Tambahan', 'Sains & Matematik');
  if (n.includes('sains') || n.includes('amali') || n.includes('peka') || n.includes('stem') || n.includes('makmal')) {
    keywords.push('Sains', 'Fizik', 'Kimia', 'Biologi', 'Sains & Matematik');
  }
  if (n.includes('bahasa melayu') || n.includes('literasi bm') || n.includes('kmk') || n.includes('kesusasteraan')) {
    keywords.push('Bahasa Melayu', 'Kesusasteraan Melayu', 'Bahasa');
  }
  if (n.includes('bahasa inggeris') || n.includes('hip') || n.includes('dlp')) {
    keywords.push('Bahasa Inggeris', 'Bahasa');
  }
  if (n.includes('bahasa iban')) keywords.push('Bahasa Iban', 'Bahasa');
  if (n.includes('bidang bahasa')) keywords.push('Bahasa', 'Bidang Bahasa');
  if (n.includes('sains sosial') || n.includes('kemanusiaan')) keywords.push('Sains Sosial', 'Kemanusiaan');
  if (n.includes('tvet') || n.includes('teknik dan vokasional')) keywords.push('TVET', 'Teknik & Vokasional');
  if (n.includes('pendidikan islam') || n.includes('surau')) keywords.push('Pendidikan Islam', 'Sains Sosial');
  if (n.includes('pendidikan moral')) keywords.push('Pendidikan Moral', 'Sains Sosial');
  if (n.includes('sejarah')) keywords.push('Sejarah', 'Sains Sosial');
  if (n.includes('geografi')) keywords.push('Geografi', 'Sains Sosial');
  if (n.includes('seni visual') || n.includes('psv')) keywords.push('Seni Visual', 'Pendidikan Seni');
  if (n.includes('sukan') || n.includes('segak') || n.includes('pjpk')) {
    keywords.push('PJPK', 'Pendidikan Jasmani', 'Sukan');
  }
  if (n.includes('pusat sumber') || n.includes('nilam') || n.includes('perpustakaan') || n.includes('media')) {
    keywords.push('Perpustakaan', 'Bahasa');
  }
  if (n.includes('kaunseling') || n.includes('disiplin') || n.includes('ppda')) {
    keywords.push('Bimbingan & Kaunseling');
  }
  if (
    n.includes('kewangan') ||
    n.includes('aset') ||
    n.includes('koperasi') ||
    n.includes('bendahari') ||
    n.includes('perniagaan') ||
    n.includes('ekonomi')
  ) {
    keywords.push('Prinsip Perakaunan', 'Ekonomi', 'Perniagaan');
  }
  if (
    n.includes('maklumat') ||
    n.includes('ict') ||
    n.includes('digital') ||
    n.includes('idme') ||
    n.includes('e-rph') ||
    n.includes('jadual waktu') ||
    n.includes('headcount')
  ) {
    keywords.push('ICT', 'Sains Komputer', 'ASK', 'Data');
  }
  if (n.includes('tingkatan 6') || n.includes('t6') || n.includes('stpm')) {
    keywords.push('Tingkatan 6', 'T6');
  }
  if (n.includes('ppki') || n.includes('pendidikan khas')) {
    keywords.push('PPKI', 'Pendidikan Khas');
  }

  return Array.from(new Set(keywords));
}

/**
 * Resolves structured slots for a committee from DB position_slots, matching committeeTemplates,
 * or synthesized rules from default_positions (including imported document slots).
 */
export function resolveCommitteeSlotRules(
  committee: ExistingCommittee,
  weights: Record<string, number> = DEFAULT_WORKLOAD_SETTINGS.weights
): PositionSlotRule[] {
  if (Array.isArray(committee.position_slots) && committee.position_slots.length > 0) {
    return [...committee.position_slots].sort((a, b) => a.slotOrder - b.slotOrder);
  }

  const hasCustomPositions =
    Array.isArray(committee.default_positions) && committee.default_positions.length > 0;

  const matchedTemplate = committeeTemplates.find(
    (t) => normalizeToken(t.name) === normalizeToken(committee.name)
  );
  if (!hasCustomPositions && matchedTemplate?.position_slots && matchedTemplate.position_slots.length > 0) {
    return matchedTemplate.position_slots;
  }

  const positions = hasCustomPositions
    ? committee.default_positions!
    : matchedTemplate?.default_positions || ['Pengerusi', 'Timbalan Pengerusi', 'Setiausaha', 'AJK'];

  return positions
    .filter((role) => !role.toLowerCase().includes('ibu bapa'))
    .map((role, index) => {
      const lowerRole = role.toLowerCase();
      const isPengerusi =
        lowerRole === 'pengerusi' || lowerRole === 'pengetua' || lowerRole.includes('penasihat');
      const isTimbalan =
        lowerRole.includes('timbalan') ||
        lowerRole.includes('tim.') ||
        lowerRole.includes('naib') ||
        lowerRole.includes('penolong pengerusi');
      const isLeadership =
        isPengerusi ||
        isTimbalan ||
        lowerRole.includes('setiausaha') ||
        lowerRole.includes('sue') ||
        lowerRole.includes('penyelaras') ||
        lowerRole.includes('ketua') ||
        lowerRole.includes('bendahari') ||
        lowerRole.includes('guru perpustakaan') ||
        lowerRole.includes('penyelia kanan');

      const inferredSubjects = inferKeywordsFromCommitteeAndRole(committee.name, role);
      const allowsLabAssistant =
        lowerRole.includes('makmal') ||
        lowerRole.includes('radas') ||
        committee.name.toLowerCase().includes('amali sains');

      let requiredJawatan: StandardizedJawatan[] | undefined;
      let preferredJawatan: StandardizedJawatan[] | undefined;

      if (isPengerusi) {
        requiredJawatan = ['PENGETUA'];
      } else if (isTimbalan) {
        if (committee.category.includes('Hal Ehwal') || committee.category === 'HEM') {
          preferredJawatan = ['PK_HEM', 'PK_PENTADBIRAN', 'PK_PETANG'];
        } else if (committee.category.includes('Kokurikulum')) {
          preferredJawatan = ['PK_KOKURIKULUM', 'PK_PENTADBIRAN', 'PK_PETANG'];
        } else if (committee.category === 'PPKI') {
          preferredJawatan = ['PK_PPKI', 'PK_PENTADBIRAN'];
        } else if (committee.category === 'Tingkatan 6') {
          preferredJawatan = ['PK_T6', 'PK_PENTADBIRAN'];
        } else {
          preferredJawatan = ['PK_PENTADBIRAN', 'PK_HEM', 'PK_KOKURIKULUM', 'PK_PETANG'];
        }
      } else if (lowerRole.includes('guru perpustakaan')) {
        preferredJawatan = ['GPM'];
      } else if (lowerRole.includes('guru kanan') || lowerRole.includes('penyelia kanan')) {
        preferredJawatan = ['GKMP'];
      } else if (lowerRole.includes('ketua panitia')) {
        preferredJawatan = ['KETUA_PANITIA', 'GKMP'];
      }

      return {
        slotKey: `${committee.id}-slot-${index + 1}`,
        slotOrder: index + 1,
        role,
        weightage: inferWeightForRole(role, weights),
        isMandatory: isPengerusi || isTimbalan,
        isLeadershipRole: isLeadership,
        requiresDomainMatch:
          inferredSubjects.length > 0 &&
          !isPengerusi &&
          !isTimbalan &&
          (isLeadership || lowerRole.includes('panitia') || lowerRole.includes('bidang')),
        teachingStaffOnly: !allowsLabAssistant,
        requiredJawatan,
        preferredJawatan: preferredJawatan || requiredJawatan,
        preferredSubjects: inferredSubjects,
        preferredDepartments: inferredSubjects,
      };
    });
}

/**
 * Evaluates a single teacher against a specific committee slot using updated
 * Warga Sekolah attributes: JAWATAN, GRED, OPSYEN DOMINAN (department), and status.
 */
export function evaluateCandidateForSlot(params: {
  teacher: TeacherProfile;
  committee: ExistingCommittee;
  allCommittees: ExistingCommittee[];
  slot: PositionSlotRule;
  activeAssignments: ExistingAssignment[];
  config: AssignmentRuleConfig;
}): CandidateEvaluation | null {
  const { teacher, committee, allCommittees, slot, activeAssignments, config } = params;

  if (teacher.status && teacher.status === 'Tidak Aktif') return null;

  const stdJawatan = standardizeJawatan(teacher.jawatan, teacher.type, teacher.gred);
  const domainProfile = extractTeacherDomainProfile(teacher);
  const gradeInfo = parseGradeSeniority(teacher.gred);

  // Hard Rule 1: Support staff (Sokongan/AKP) excluded from pedagogical slots unless explicitly allowed
  if (
    slot.teachingStaffOnly !== false &&
    stdJawatan === 'AKP' &&
    !slot.requiredJawatan?.includes('AKP')
  ) {
    return null;
  }

  // If slot explicitly allows non-teaching (e.g. lab committee), restrict AKP strictly to lab assistants
  if (slot.teachingStaffOnly === false && stdJawatan === 'AKP' && !domainProfile.isLabAssistant) {
    return null;
  }

  // Hard Rule 2: Explicit role exclusion
  if (slot.excludedJawatan?.includes(stdJawatan)) {
    return null;
  }

  // Hard Rule 3: Prevent duplicate membership in the same committee
  const alreadyInSameCommittee = activeAssignments.some(
    (a) => a.staff_id === teacher.id && a.committee_id === committee.id
  );
  if (alreadyInSameCommittee) return null;

  // Hard Rule 4: Top management exemption from routine operational slots
  const isTopMgmt = TOP_MANAGEMENT.includes(stdJawatan);
  const explicitlyAllowsTopMgmt =
    slot.requiredJawatan?.some((j) => TOP_MANAGEMENT.includes(j)) ||
    slot.preferredJawatan?.some((j) => TOP_MANAGEMENT.includes(j));
  if (config.exemptTopManagementFromRoutineSlots && isTopMgmt && !explicitlyAllowsTopMgmt) {
    return null;
  }

  // Hard Rule 5: Strict session compatibility
  if (
    slot.requiredSession &&
    teacher.sesi &&
    teacher.sesi !== 'Semua' &&
    teacher.sesi !== slot.requiredSession
  ) {
    return null;
  }

  // Hard Rule 6: 120% Workload Ceiling Check (Top management exempt for ex-officio roles)
  const teacherAssignments = activeAssignments.filter((a) => a.staff_id === teacher.id);
  const currentPoints = teacherAssignments.reduce(
    (sum, a) => sum + (Number(a.workload_weightage) || 0),
    0
  );
  const currentWorkloadPct = Math.round((currentPoints / config.referencePoints) * 100);
  const projectedPoints = currentPoints + slot.weightage;
  const projectedWorkloadPct = Math.round((projectedPoints / config.referencePoints) * 100);

  if (!isTopMgmt && projectedWorkloadPct > config.maxWorkloadPercent) {
    return null;
  }

  // --- SOFT SCORING FACTORS (Explainable) ---
  const reasons: string[] = [];
  const warnings: string[] = [];

  // 1. Leadership, Official Post (JAWATAN) & Grade Seniority (GRED) (0 - 35)
  let leadershipScore = 0;
  let matchedLeadership: string | null = null;

  if (slot.requiredJawatan?.includes(stdJawatan)) {
    leadershipScore = config.weights.leadershipMax;
    matchedLeadership = teacher.jawatan;
    reasons.push(`Jawatan hakiki sepadan (${teacher.jawatan})`);
  } else if (slot.preferredJawatan?.includes(stdJawatan)) {
    leadershipScore = Math.round(config.weights.leadershipMax * 0.85);
    matchedLeadership = teacher.jawatan;
    reasons.push(`Jawatan kepimpinan sesuai (${teacher.jawatan})`);
  } else if (slot.isLeadershipRole && MIDDLE_LEADERSHIP.includes(stdJawatan)) {
    leadershipScore = Math.round(config.weights.leadershipMax * 0.6);
    matchedLeadership = teacher.jawatan;
    reasons.push(`Kepimpinan pertengahan (${teacher.jawatan})`);
  } else if (slot.isLeadershipRole) {
    if (gradeInfo.tier >= 3) {
      leadershipScore = Math.round(config.weights.leadershipMax * 0.48);
      reasons.push(`Kekananan gred ${gradeInfo.label} sesuai untuk peranan penyelaras/setiausaha`);
    } else if (gradeInfo.tier === 2) {
      leadershipScore = Math.round(config.weights.leadershipMax * 0.32);
    } else {
      leadershipScore = Math.round(config.weights.leadershipMax * 0.15);
      warnings.push(`Gred ${gradeInfo.label || 'permulaan'} — keutamaan diberi kepada guru lebih kanan jika ada`);
    }
  } else if (!slot.isLeadershipRole && stdJawatan === 'GURU_BIASA') {
    leadershipScore = Math.round(config.weights.leadershipMax * 0.42);
    reasons.push(`Sesuai untuk pelaksanaan peringkat operasi/AJK${gradeInfo.label ? ` (${gradeInfo.label})` : ''}`);
  }

  // 2. Opsyen Dominan, Subject & Functional Expertise Fit (0 - 35)
  let expertiseScore = 0;
  const matchedSubjects = listMatches(domainProfile.subjectTokens, slot.preferredSubjects);
  const matchedDomains = listMatches(
    domainProfile.domainTags,
    [...(slot.preferredDepartments || []), ...(slot.preferredExpertise || []), ...(slot.preferredSubjects || [])]
  );

  if (matchedSubjects.length > 0) {
    expertiseScore += Math.round(config.weights.expertiseMax * 0.68);
    reasons.push(`Opsyen Dominan sepadan: ${teacher.department || matchedSubjects[0]}`);
  }
  if (matchedDomains.length > 0) {
    expertiseScore += Math.round(config.weights.expertiseMax * 0.35);
    if (matchedSubjects.length === 0) {
      reasons.push(`Bidang kepakaran/opsyen relevan (${matchedDomains.slice(0, 2).join(', ')})`);
    }
  }

  // Dedicated Data/ICT Teacher boost for system/data/timetable committees
  if (
    domainProfile.isDataTeacher &&
    (committee.name.toLowerCase().includes('data') ||
      committee.name.toLowerCase().includes('idme') ||
      committee.name.toLowerCase().includes('maklumat') ||
      committee.name.toLowerCase().includes('jadual') ||
      slot.role.toLowerCase().includes('sistem'))
  ) {
    expertiseScore += 10;
    reasons.push(`Peranan hakiki ${teacher.jawatan} menyokong pengurusan data & sistem`);
  }

  // Dedicated T6 / PPKI cohort alignment
  if (
    (committee.category === 'Tingkatan 6' ||
      committee.name.toLowerCase().includes('t6') ||
      slot.role.toLowerCase().includes('t6')) &&
    domainProfile.isTingkatan6
  ) {
    expertiseScore += 12;
    reasons.push('Guru Tingkatan 6 / Pra-Universiti');
  }
  if (
    (committee.category === 'PPKI' ||
      committee.name.toLowerCase().includes('ppki') ||
      slot.role.toLowerCase().includes('ppki')) &&
    domainProfile.isPPKI
  ) {
    expertiseScore += 12;
    reasons.push('Guru Pendidikan Khas Integrasi (PPKI)');
  }

  expertiseScore = Math.min(config.weights.expertiseMax, expertiseScore);

  // 3. Workload & Fair Distribution (0 - 20)
  const loadRatio = Math.max(0, 1 - currentWorkloadPct / config.maxWorkloadPercent);
  let workloadScore = Math.round(config.weights.workloadMax * loadRatio);

  const majorRolesCount = teacherAssignments.filter(
    (a) => (Number(a.workload_weightage) || 0) >= 8
  ).length;
  if (slot.isLeadershipRole && majorRolesCount >= config.maxMajorLeadershipRolesPerTeacher) {
    workloadScore = Math.max(0, workloadScore - 10);
    warnings.push(`Sudah memegang ${majorRolesCount} jawatan utama`);
  }

  if (projectedWorkloadPct >= 100) {
    warnings.push(`Beban tugas selepas lantikan menghampiri had (${projectedWorkloadPct}%)`);
  } else {
    reasons.push(`Beban tugas seimbang (${currentWorkloadPct}% → ${projectedWorkloadPct}%)`);
  }

  // 4. Committee Hierarchy & Conflict Avoidance (0 - 10)
  let hierarchyScore = 0;
  let conflictPenalty = 0;

  if (committee.parent_committee_id) {
    const parentAssign = teacherAssignments.find(
      (a) => a.committee_id === committee.parent_committee_id
    );
    if (parentAssign && slot.allowParentBridge) {
      hierarchyScore += config.weights.hierarchyMax;
      reasons.push(`Penyelaras penghubung daripada jawatankuasa induk (${parentAssign.role})`);
    }

    if (config.avoidDuplicateSubcommitteeChair && slot.isLeadershipRole) {
      const siblingIds = allCommittees
        .filter(
          (c) => c.parent_committee_id === committee.parent_committee_id && c.id !== committee.id
        )
        .map((c) => c.id);
      const chairsSibling = teacherAssignments.some(
        (a) => siblingIds.includes(a.committee_id) && (Number(a.workload_weightage) || 0) >= 7
      );
      if (chairsSibling) {
        conflictPenalty += 15;
        warnings.push('Sudah mengetuai sub-unit lain di bawah jawatankuasa induk yang sama');
      }
    }
  }

  // Avoid assigning senior middle leaders (GKMP/GPM) to routine AJK slots when regular teachers exist
  if (!slot.isLeadershipRole && !slot.requiredJawatan && MIDDLE_LEADERSHIP.includes(stdJawatan)) {
    conflictPenalty += 14;
    warnings.push(`${teacher.jawatan} lebih sesuai disimpan untuk peranan penyelaras/ketua`);
  }

  // Avoid assigning T6/PPKI-dedicated staff to mainstream-only committees unless needed
  if (
    (domainProfile.isTingkatan6 &&
      committee.category !== 'Tingkatan 6' &&
      !committee.name.toLowerCase().includes('t6')) ||
    (domainProfile.isPPKI &&
      committee.category !== 'PPKI' &&
      !committee.name.toLowerCase().includes('ppki'))
  ) {
    conflictPenalty += 10;
    warnings.push('Penempatan hakiki berfokus kepada unit khusus (T6/PPKI)');
  }

  const totalScore = Math.max(
    0,
    leadershipScore + expertiseScore + workloadScore + hierarchyScore - conflictPenalty
  );

  return {
    staffId: teacher.id,
    staffName: teacher.name,
    jawatan: teacher.jawatan,
    department: teacher.department || '-',
    matchedSubjects: matchedSubjects.length > 0 ? matchedSubjects : matchedDomains,
    matchedLeadership,
    currentWorkloadPct,
    projectedWorkloadPct,
    score: {
      leadershipScore,
      expertiseScore,
      workloadScore,
      hierarchyScore,
      conflictPenalty,
      totalScore,
    },
    reasons,
    warnings,
  };
}

/**
 * Pure deterministic proposal generator supporting both:
 * - 'fill_vacancies' (default): Preserves all existing assignments (manual or imported) 1-to-1 and fills only vacant slots.
 * - 'regenerate_all': Re-evaluates all unlocked slots across the selected committees.
 */
export function generateAssignmentProposals(params: {
  teachers: TeacherProfile[];
  committees: ExistingCommittee[];
  existingAssignments: ExistingAssignment[];
  lockedOverrides?: Record<string, string | null>;
  mode?: AutoAssignMode;
  config?: AssignmentRuleConfig;
  weights?: Record<string, number>;
}): AutoAssignRunResult {
  const {
    teachers,
    committees,
    existingAssignments,
    lockedOverrides = {},
    mode = 'fill_vacancies',
    config = DEFAULT_ASSIGNMENT_CONFIG,
    weights = DEFAULT_WORKLOAD_SETTINGS.weights,
  } = params;

  const targetCommitteeIds = new Set(committees.map((c) => c.id));

  // In 'regenerate_all' mode, keep assignments outside the target committees + explicitly locked assignments
  const baselineAssignments: ExistingAssignment[] =
    mode === 'regenerate_all'
      ? existingAssignments.filter((a) => !targetCommitteeIds.has(a.committee_id) || a.is_locked)
      : existingAssignments.map((a) => ({ ...a }));

  const workingAssignments: ExistingAssignment[] = baselineAssignments.map((a) => ({ ...a }));
  const consumedAssignmentIndices = new Set<number>();
  const proposals: AssignmentProposal[] = [];

  const orderedCommittees = [...committees].sort((a, b) => {
    const aIsChild = a.parent_committee_id ? 1 : 0;
    const bIsChild = b.parent_committee_id ? 1 : 0;
    return aIsChild - bIsChild;
  });

  for (const committee of orderedCommittees) {
    const slots = resolveCommitteeSlotRules(committee, weights);
    const parentCommittee = committee.parent_committee_id
      ? committees.find((c) => c.id === committee.parent_committee_id)
      : null;

    for (const slot of slots) {
      const proposalId = `${committee.id}::${slot.slotKey}`;

      // 1-to-1 match against unconsumed existing assignments in this committee with the same role
      let matchedExistingIndex = -1;
      if (mode === 'fill_vacancies') {
        matchedExistingIndex = workingAssignments.findIndex(
          (a, idx) =>
            !consumedAssignmentIndices.has(idx) &&
            a.committee_id === committee.id &&
            normalizeToken(a.role) === normalizeToken(slot.role)
        );
      } else {
        matchedExistingIndex = workingAssignments.findIndex(
          (a, idx) =>
            !consumedAssignmentIndices.has(idx) &&
            a.committee_id === committee.id &&
            a.is_locked &&
            normalizeToken(a.role) === normalizeToken(slot.role)
        );
      }

      const existingRoleAssignment =
        matchedExistingIndex >= 0 ? workingAssignments[matchedExistingIndex] : undefined;
      if (matchedExistingIndex >= 0) {
        consumedAssignmentIndices.add(matchedExistingIndex);
      }

      const hasUiOverride = Object.prototype.hasOwnProperty.call(lockedOverrides, proposalId);

      if (hasUiOverride || existingRoleAssignment) {
        const lockedStaffId = hasUiOverride
          ? lockedOverrides[proposalId]
          : existingRoleAssignment?.staff_id || null;

        const lockedTeacher = lockedStaffId
          ? teachers.find((t) => t.id === lockedStaffId) || null
          : null;

        if (lockedTeacher && !existingRoleAssignment) {
          workingAssignments.push({
            staff_id: lockedTeacher.id,
            committee_id: committee.id,
            role: slot.role,
            workload_weightage: slot.weightage,
            academic_session: '2026/2027',
            is_locked: true,
            is_auto_assigned: false,
            slot_order: slot.slotOrder,
          });
        }

        const currentPts = lockedTeacher
          ? workingAssignments
              .filter((a) => a.staff_id === lockedTeacher.id)
              .reduce((s, a) => s + (Number(a.workload_weightage) || 0), 0)
          : 0;
        const pct = Math.round((currentPts / config.referencePoints) * 100);

        proposals.push({
          proposalId,
          committeeId: committee.id,
          committeeName: committee.name,
          category: committee.category,
          subCategory: committee.sub_category,
          parentCommitteeName: parentCommittee?.name || null,
          slotKey: slot.slotKey,
          slotOrder: slot.slotOrder,
          role: slot.role,
          weightage: existingRoleAssignment?.workload_weightage ?? slot.weightage,
          isMandatory: Boolean(slot.isMandatory),
          isLocked: true,
          status: lockedTeacher ? 'assigned' : 'vacant',
          selectedCandidate: lockedTeacher
            ? {
                staffId: lockedTeacher.id,
                staffName: lockedTeacher.name,
                jawatan: lockedTeacher.jawatan,
                department: lockedTeacher.department || '-',
                matchedSubjects: lockedTeacher.department ? [lockedTeacher.department] : [],
                matchedLeadership: lockedTeacher.jawatan,
                currentWorkloadPct: pct,
                projectedWorkloadPct: pct,
                score: {
                  leadershipScore: 0,
                  expertiseScore: 0,
                  workloadScore: 0,
                  hierarchyScore: 0,
                  conflictPenalty: 0,
                  totalScore: 100,
                },
                reasons: [
                  existingRoleAssignment
                    ? 'Lantikan sedia ada (manual/import) dikekalkan'
                    : 'Ditetapkan & dikunci secara manual oleh pentadbir',
                ],
                warnings:
                  pct > config.maxWorkloadPercent ? ['Melebihi had beban 120% (pilihan manual)'] : [],
              }
            : null,
          alternatives: [],
          unassignedReason: lockedTeacher ? undefined : 'Dikunci sebagai kosong oleh pentadbir.',
        });
        continue;
      }

      // Vacant slot: evaluate all eligible staff
      const evaluations: CandidateEvaluation[] = [];
      for (const teacher of teachers) {
        const evalResult = evaluateCandidateForSlot({
          teacher,
          committee,
          allCommittees: committees,
          slot,
          activeAssignments: workingAssignments,
          config,
        });
        if (evalResult) evaluations.push(evalResult);
      }

      evaluations.sort((a, b) => {
        if (b.score.totalScore !== a.score.totalScore) {
          return b.score.totalScore - a.score.totalScore;
        }
        if (a.currentWorkloadPct !== b.currentWorkloadPct) {
          return a.currentWorkloadPct - b.currentWorkloadPct;
        }
        return a.staffName.localeCompare(b.staffName);
      });

      const topCandidate = evaluations[0] || null;
      const effectiveMinScore = slot.requiresDomainMatch ? config.minSuitabilityScore : 10;

      if (!topCandidate || topCandidate.score.totalScore < effectiveMinScore) {
        const reason = !topCandidate
          ? 'Tiada guru layak (semua calon sama ada sudah berada dalam jawatankuasa ini, dikecualikan mengikut jawatan, atau akan melebihi had beban 120%).'
          : `Skor kesesuaian tertinggi (${topCandidate.score.totalScore} mata oleh ${topCandidate.staffName}) di bawah ambang minimum (${effectiveMinScore} mata) bagi keperluan bidang ini.`;

        proposals.push({
          proposalId,
          committeeId: committee.id,
          committeeName: committee.name,
          category: committee.category,
          subCategory: committee.sub_category,
          parentCommitteeName: parentCommittee?.name || null,
          slotKey: slot.slotKey,
          slotOrder: slot.slotOrder,
          role: slot.role,
          weightage: slot.weightage,
          isMandatory: Boolean(slot.isMandatory),
          isLocked: false,
          status: 'vacant',
          selectedCandidate: null,
          alternatives: evaluations.slice(0, 4),
          unassignedReason: reason,
        });
        continue;
      }

      workingAssignments.push({
        staff_id: topCandidate.staffId,
        committee_id: committee.id,
        role: slot.role,
        workload_weightage: slot.weightage,
        academic_session: '2026/2027',
        is_locked: false,
        is_auto_assigned: true,
        slot_order: slot.slotOrder,
      });

      proposals.push({
        proposalId,
        committeeId: committee.id,
        committeeName: committee.name,
        category: committee.category,
        subCategory: committee.sub_category,
        parentCommitteeName: parentCommittee?.name || null,
        slotKey: slot.slotKey,
        slotOrder: slot.slotOrder,
        role: slot.role,
        weightage: slot.weightage,
        isMandatory: Boolean(slot.isMandatory),
        isLocked: false,
        status: 'assigned',
        selectedCandidate: topCandidate,
        alternatives: evaluations.slice(1, 5),
      });
    }
  }

  const workloadComparison: TeacherWorkloadSummary[] = teachers
    .filter((t) => !t.status || t.status !== 'Tidak Aktif')
    .map((teacher) => {
      const beforeAssigns = existingAssignments.filter((a) => a.staff_id === teacher.id);
      const afterAssigns = workingAssignments.filter((a) => a.staff_id === teacher.id);

      const beforePoints = beforeAssigns.reduce((s, a) => s + (Number(a.workload_weightage) || 0), 0);
      const afterPoints = afterAssigns.reduce((s, a) => s + (Number(a.workload_weightage) || 0), 0);
      const beforePct = Math.round((beforePoints / config.referencePoints) * 100);
      const afterPct = Math.round((afterPoints / config.referencePoints) * 100);

      return {
        staffId: teacher.id,
        staffName: teacher.name,
        jawatan: teacher.jawatan,
        beforePoints,
        beforePct,
        afterPoints,
        afterPct,
        committeeCountBefore: beforeAssigns.length,
        committeeCountAfter: afterAssigns.length,
        isOverloaded: afterPct > config.maxWorkloadPercent,
      };
    })
    .sort((a, b) => b.afterPct - a.afterPct);

  const assignedCount = proposals.filter((p) => p.status === 'assigned').length;
  const lockedPreservedCount = proposals.filter((p) => p.isLocked).length;
  const vacantCount = proposals.filter((p) => p.status === 'vacant').length;
  const avgPct =
    workloadComparison.length > 0
      ? Math.round(workloadComparison.reduce((s, w) => s + w.afterPct, 0) / workloadComparison.length)
      : 0;
  const maxPct =
    workloadComparison.length > 0 ? Math.max(...workloadComparison.map((w) => w.afterPct)) : 0;

  return {
    proposals,
    workloadComparison,
    stats: {
      totalSlots: proposals.length,
      assignedCount,
      lockedPreservedCount,
      vacantCount,
      averageWorkloadPctAfter: avgPct,
      maxWorkloadPctAfter: maxPct,
    },
  };
}

/**
 * Generates an auto-assignment preview for WorkloadManager.tsx without mutating the database.
 */
export async function generateAutoAssignPreview(
  schoolIdOrOptions: string | ApplyAutoAssignmentsOptions,
  modeArg: AutoAssignMode = 'fill_vacancies'
): Promise<AutoAssignPreviewResult> {
  const schoolId =
    typeof schoolIdOrOptions === 'string' ? schoolIdOrOptions : schoolIdOrOptions.schoolId;
  const mode =
    typeof schoolIdOrOptions === 'string'
      ? modeArg
      : schoolIdOrOptions.mode || 'fill_vacancies';

  const [
    { data: staffData, error: staffError },
    { data: commData, error: commError },
    { data: assignData, error: assignError },
    { data: schoolProfile },
  ] = await Promise.all([
    supabase
      .from('staff')
      .select('*')
      .eq('school_id', schoolId)
      .neq('status', 'Tidak Aktif'),
    supabase
      .from('committees')
      .select('*')
      .eq('school_id', schoolId),
    supabase
      .from('staff_committees')
      .select('*')
      .eq('school_id', schoolId),
    supabase
      .from('school_profile')
      .select('current_session, workload_settings')
      .eq('school_id', schoolId)
      .single(),
  ]);

  if (staffError || commError || assignError) {
    throw new Error(
      staffError?.message || commError?.message || assignError?.message || 'Gagal memuatkan data pratonton agihan.'
    );
  }

  const academicSession =
    (typeof schoolIdOrOptions === 'object' && schoolIdOrOptions.academicSession) ||
    schoolProfile?.current_session ||
    '2026/2027';

  const settings = schoolProfile?.workload_settings
    ? { ...DEFAULT_WORKLOAD_SETTINGS, ...schoolProfile.workload_settings }
    : DEFAULT_WORKLOAD_SETTINGS;

  const config: AssignmentRuleConfig = {
    ...DEFAULT_ASSIGNMENT_CONFIG,
    referencePoints: settings.reference_points || 40,
  };

  const teachers = (staffData || []) as TeacherProfile[];
  const committees = (commData || []) as ExistingCommittee[];
  const existingAssignments = (assignData || []) as ExistingAssignment[];

  const result = generateAssignmentProposals({
    teachers,
    committees,
    existingAssignments,
    mode,
    config,
    weights: settings.weights || DEFAULT_WORKLOAD_SETTINGS.weights,
  });

  const newlyProposedCount = result.proposals.filter(
    (p) => p.status === 'assigned' && !p.isLocked
  ).length;

  return {
    ...result,
    academicSession,
    teachers,
    committees,
    existingAssignments,
    assignedCount: mode === 'regenerate_all' ? result.stats.assignedCount : newlyProposedCount,
    vacantCount: result.stats.vacantCount,
    totalSlots: result.stats.totalSlots,
  };
}

/**
 * Applies auto-assigned committee placements to `staff_committees` for WorkloadManager.tsx.
 */
export async function applyAutoAssignments(
  schoolIdOrOptions: string | ApplyAutoAssignmentsOptions,
  academicSessionArg?: string,
  modeArg: AutoAssignMode = 'fill_vacancies'
): Promise<{
  assignedCount: number;
  vacantCount: number;
  totalSlots: number;
}> {
  const schoolId =
    typeof schoolIdOrOptions === 'string' ? schoolIdOrOptions : schoolIdOrOptions.schoolId;
  const mode =
    typeof schoolIdOrOptions === 'string'
      ? modeArg
      : schoolIdOrOptions.mode || 'fill_vacancies';

  const preview = await generateAutoAssignPreview({
    schoolId,
    academicSession:
      typeof schoolIdOrOptions === 'string'
        ? academicSessionArg
        : schoolIdOrOptions.academicSession,
    mode,
  });

  if (mode === 'regenerate_all') {
    await supabase.from('staff_committees').delete().eq('school_id', schoolId);

    const allRows = preview.proposals
      .filter((p) => p.status === 'assigned' && p.selectedCandidate)
      .map((p) => ({
        staff_id: p.selectedCandidate!.staffId,
        committee_id: p.committeeId,
        school_id: schoolId,
        role: p.role,
        workload_weightage: p.weightage,
        academic_session: preview.academicSession,
        is_auto_assigned: !p.isLocked,
      }));

    if (allRows.length > 0) {
      const { error: insertError } = await supabase.from('staff_committees').insert(allRows);
      if (insertError) throw new Error(insertError.message);
    }

    return {
      assignedCount: allRows.length,
      vacantCount: preview.stats.vacantCount,
      totalSlots: preview.stats.totalSlots,
    };
  }

  // Default ('fill_vacancies'): keep existing assignments untouched and insert newly filled slots
  const newRows = preview.proposals
    .filter((p) => p.status === 'assigned' && !p.isLocked && p.selectedCandidate)
    .map((p) => ({
      staff_id: p.selectedCandidate!.staffId,
      committee_id: p.committeeId,
      school_id: schoolId,
      role: p.role,
      workload_weightage: p.weightage,
      academic_session: preview.academicSession,
      is_auto_assigned: true,
    }));

  if (newRows.length > 0) {
    const { error: insertError } = await supabase.from('staff_committees').insert(newRows);
    if (insertError) throw new Error(insertError.message);
  }

  return {
    assignedCount: newRows.length,
    vacantCount: preview.stats.vacantCount,
    totalSlots: preview.stats.totalSlots,
  };
}