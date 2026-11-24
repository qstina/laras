export type StandardizedJawatan =
  | 'PENGETUA'
  | 'PK_PENTADBIRAN'
  | 'PK_HEM'
  | 'PK_KOKURIKULUM'
  | 'PK_PETANG'
  | 'PK_PPKI'
  | 'PK_T6'
  | 'GKMP'
  | 'KETUA_PANITIA'
  | 'GPM'
  | 'SU_KURIKULUM'
  | 'SU_PEPERIKSAAN'
  | 'KAUNSELOR'
  | 'GURU_BIASA'
  | 'AKP';

export interface TeacherProfile {
  id: string;
  name: string;
  jawatan: string;
  type: 'Guru' | 'AKP' | string;
  gred?: string;
  department?: string; // e.g., 'Sains & Matematik', 'Bahasa', 'Sains Sosial', 'TVET'
  opsyen?: string[]; // e.g., ['Matematik', 'Matematik Tambahan']
  subjek_mengajar?: string[]; // e.g., ['Matematik', 'Sains']
  sesi?: 'Pagi' | 'Petang' | 'Semua' | null;
  tingkatan_mengajar?: string[]; // e.g., ['T4', 'T5']
  kepakaran?: string[]; // e.g., ['ICT', 'KBAT', 'STEM', 'Sukan']
  status?: 'Aktif' | 'Cuti' | 'Bersara' | string;
}

export interface ExistingCommittee {
  id: string;
  category: string;
  sub_category?: string | null;
  unit_code?: string | null;
  name: string;
  parent_committee_id?: string | null;
  default_positions?: string[];
  position_slots?: PositionSlotRule[];
}

export interface ExistingAssignment {
  id?: string;
  staff_id: string;
  committee_id: string;
  role: string;
  workload_weightage: number;
  academic_session: string;
  is_locked?: boolean;
  is_auto_assigned?: boolean;
  slot_order?: number;
}

export interface PositionSlotRule {
  slotKey: string;
  slotOrder: number;
  role: string;
  weightage: number;
  isMandatory?: boolean;
  isLeadershipRole?: boolean;
  requiresDomainMatch?: boolean;
  teachingStaffOnly?: boolean;
  requiredJawatan?: StandardizedJawatan[];
  preferredJawatan?: StandardizedJawatan[];
  excludedJawatan?: StandardizedJawatan[];
  preferredDepartments?: string[];
  preferredSubjects?: string[];
  preferredExpertise?: string[];
  requiredSession?: 'Pagi' | 'Petang';
  preferredForms?: string[];
  allowParentBridge?: boolean;
}

export interface ScoreBreakdown {
  leadershipScore: number;
  expertiseScore: number;
  workloadScore: number;
  hierarchyScore: number;
  conflictPenalty: number;
  totalScore: number;
}

export interface CandidateEvaluation {
  staffId: string;
  staffName: string;
  jawatan: string;
  department: string;
  matchedSubjects: string[];
  matchedLeadership: string | null;
  currentWorkloadPct: number;
  projectedWorkloadPct: number;
  score: ScoreBreakdown;
  reasons: string[];
  warnings: string[];
}

export interface AssignmentProposal {
  proposalId: string;
  committeeId: string;
  committeeName: string;
  category: string;
  subCategory?: string | null;
  parentCommitteeName?: string | null;
  slotKey: string;
  slotOrder: number;
  role: string;
  weightage: number;
  isMandatory: boolean;
  isLocked: boolean;
  status: 'assigned' | 'vacant';
  selectedCandidate: CandidateEvaluation | null;
  alternatives: CandidateEvaluation[];
  unassignedReason?: string;
}

export interface TeacherWorkloadSummary {
  staffId: string;
  staffName: string;
  jawatan: string;
  beforePoints: number;
  beforePct: number;
  afterPoints: number;
  afterPct: number;
  committeeCountBefore: number;
  committeeCountAfter: number;
  isOverloaded: boolean;
}

export interface AutoAssignRunResult {
  proposals: AssignmentProposal[];
  workloadComparison: TeacherWorkloadSummary[];
  stats: {
    totalSlots: number;
    assignedCount: number;
    lockedPreservedCount: number;
    vacantCount: number;
    averageWorkloadPctAfter: number;
    maxWorkloadPctAfter: number;
  };
}

export interface AssignmentRuleConfig {
  referencePoints: number; // Default 20 (= 100%)
  maxWorkloadPercent: number; // Default 120 (%)
  minSuitabilityScore: number; // Default 30 (prevents forced mismatches)
  maxMajorLeadershipRolesPerTeacher: number; // Default 2
  weights: {
    leadershipMax: number; // Default 35
    expertiseMax: number; // Default 35
    workloadMax: number; // Default 20
    hierarchyMax: number; // Default 10
  };
  exemptTopManagementFromRoutineSlots: boolean; // Default true
  avoidDuplicateSubcommitteeChair: boolean; // Default true
}