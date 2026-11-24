import { DEFAULT_WORKLOAD_SETTINGS } from '../lib/autoAssignEngine';

export interface StaffCommitteeRecord {
  id: string;
  committee_id: string;
  role: string;
  workload_weightage: number;
  academic_session?: string | null;
  is_auto_assigned?: boolean;
  committees?: {
    id: string;
    name: string;
    category: string;
    sub_category?: string | null;
    parent_committee_id?: string | null;
  } | null;
}

export interface StaffWorkloadItem {
  id: string;
  name: string;
  type: 'Guru' | 'Sokongan' | string;
  jawatan: string;
  gred: string;
  department: string | null;
  points: number;
  percentage: number;
  status: 'Tinggi' | 'Seimbang' | 'Rendah';
  assignments: StaffCommitteeRecord[];
  leadershipCount: number;
  coordinatorCount: number;
  memberCount: number;
}

export interface CategorySummary {
  category: string;
  committeeCount: number;
  assignmentCount: number;
  uniqueStaffCount: number;
  totalPoints: number;
  avgPointsPerAssignment: number;
}

export interface CommitteeSummary {
  id: string;
  name: string;
  category: string;
  memberCount: number;
  totalPoints: number;
  hasSecretary: boolean;
  hasChair: boolean;
  roles: string[];
}

export interface RoleBucketSummary {
  bucket: 'Kepimpinan Induk' | 'Penyelaras & Setiausaha' | 'Ahli & Pelaksana';
  description: string;
  count: number;
  totalPoints: number;
  percentageOfAssignments: number;
}

export interface WorkloadInsight {
  id: string;
  severity: 'warning' | 'info' | 'positive';
  title: string;
  metric: string;
  explanation: string;
  affectedEntities?: string[];
}

export interface WorkloadAnalyticsSummary {
  referencePoints: number;
  majorCategories: string[];
  staffItems: StaffWorkloadItem[];
  kpis: {
    totalStaff: number;
    guruCount: number;
    sokonganCount: number;
    totalCommittees: number;
    activeCommittees: number;
    emptyCommittees: number;
    totalAssignments: number;
    totalPointsAssigned: number;
    avgWorkloadPctAll: number;
    avgWorkloadPctGuru: number;
    medianWorkloadPctGuru: number;
    stdDevPctGuru: number;
    minGuruPct: number;
    maxGuruPct: number;
    avgAssignmentsPerGuru: number;
    highCount: number;
    balancedCount: number;
    lowCount: number;
    zeroAssignmentGuruCount: number;
  };
  categoryBreakdown: CategorySummary[];
  committeeBreakdown: CommitteeSummary[];
  roleBuckets: RoleBucketSummary[];
  highestTeachers: StaffWorkloadItem[];
  lowestTeachers: StaffWorkloadItem[];
  insights: WorkloadInsight[];
}

const PREFERRED_CATEGORY_ORDER = [
  'Pengurusan Pentadbiran',
  'Pengurusan Kurikulum',
  'Pengurusan Hal Ehwal Murid',
  'Pengurusan Kokurikulum',
  'Tingkatan 6',
  'PPKI',
];

export function sortMajorCategories(categories: string[]): string[] {
  const unique = Array.from(new Set(categories.map((c) => (c || '').trim() || 'Lain-lain')));
  return unique.sort((a, b) => {
    const idxA = PREFERRED_CATEGORY_ORDER.findIndex((p) => p.toLowerCase() === a.toLowerCase());
    const idxB = PREFERRED_CATEGORY_ORDER.findIndex((p) => p.toLowerCase() === b.toLowerCase());
    if (idxA !== -1 && idxB !== -1) return idxA - idxB;
    if (idxA !== -1) return -1;
    if (idxB !== -1) return 1;
    return a.localeCompare(b, 'ms');
  });
}

export function classifyRoleBucket(
  role: string
): 'Kepimpinan Induk' | 'Penyelaras & Setiausaha' | 'Ahli & Pelaksana' {
  const lower = (role || '').toLowerCase();
  if (
    lower.includes('pengerusi') ||
    lower.includes('penasihat') ||
    lower.includes('pengetua') ||
    lower.includes('timbalan') ||
    lower.includes('naib')
  ) {
    return 'Kepimpinan Induk';
  }
  if (
    lower.includes('setiausaha') ||
    lower.includes('penyelaras') ||
    lower.includes('ketua panitia') ||
    lower.includes('ketua unit') ||
    lower.includes('bendahari') ||
    lower.includes('sue')
  ) {
    return 'Penyelaras & Setiausaha';
  }
  return 'Ahli & Pelaksana';
}

function isPentadbirExOfficio(jawatan: string): boolean {
  const j = (jawatan || '').toLowerCase();
  return (
    j.includes('pengetua') ||
    j.includes('guru besar') ||
    j.includes('penolong kanan') ||
    j.startsWith('pk ') ||
    j.includes('pk pentadbiran') ||
    j.includes('pk hem') ||
    j.includes('pk koko')
  );
}

export function computeWorkloadAnalytics(params: {
  staffList: any[];
  committeesList: any[];
  referencePoints?: number;
  selectedSession?: string;
  selectedCategory?: string;
  selectedCommitteeId?: string;
  selectedStaffType?: string;
  selectedTeacherId?: string;
}): WorkloadAnalyticsSummary {
  const {
    staffList,
    committeesList,
    referencePoints = DEFAULT_WORKLOAD_SETTINGS.reference_points,
    selectedSession = 'Semua',
    selectedCategory = 'Semua',
    selectedCommitteeId = 'Semua',
    selectedStaffType = 'Semua',
    selectedTeacherId = 'Semua',
  } = params;

  const safeRef = referencePoints > 0 ? referencePoints : 40;

  // Filter committees according to active category/committee filters
  const filteredCommittees = committeesList.filter((c) => {
    const cat = (c.category || '').trim() || 'Lain-lain';
    if (selectedCategory !== 'Semua' && cat !== selectedCategory) return false;
    if (selectedCommitteeId !== 'Semua' && c.id !== selectedCommitteeId) return false;
    return true;
  });

  const allowedCommitteeIds = new Set(filteredCommittees.map((c) => c.id));
  const majorCategories = sortMajorCategories(
    committeesList.map((c) => (c.category || '').trim() || 'Lain-lain')
  );

  // Filter staff by type or individual selection
  const filteredStaff = staffList.filter((s) => {
    if (selectedStaffType !== 'Semua' && (s.type || 'Guru') !== selectedStaffType) return false;
    if (selectedTeacherId !== 'Semua' && s.id !== selectedTeacherId) return false;
    return true;
  });

  const staffItems: StaffWorkloadItem[] = filteredStaff
    .map((s) => {
      const rawAssignments: StaffCommitteeRecord[] = Array.isArray(s.staff_committees)
        ? s.staff_committees
        : [];

      const activeAssignments = rawAssignments.filter((sc) => {
        if (selectedSession !== 'Semua' && sc.academic_session && sc.academic_session !== selectedSession) {
          return false;
        }
        if (selectedCategory !== 'Semua' || selectedCommitteeId !== 'Semua') {
          return allowedCommitteeIds.has(sc.committee_id);
        }
        return true;
      });

      let points = 0;
      let leadershipCount = 0;
      let coordinatorCount = 0;
      let memberCount = 0;

      activeAssignments.forEach((sc) => {
        points += Number(sc.workload_weightage) || 0;
        const bucket = classifyRoleBucket(sc.role);
        if (bucket === 'Kepimpinan Induk') leadershipCount++;
        else if (bucket === 'Penyelaras & Setiausaha') coordinatorCount++;
        else memberCount++;
      });

      const percentage = Math.round((points / safeRef) * 100);
      let status: 'Tinggi' | 'Seimbang' | 'Rendah' = 'Seimbang';
      if (percentage > 100) status = 'Tinggi';
      else if (percentage < 50) status = 'Rendah';

      return {
        id: s.id,
        name: s.name,
        type: s.type || 'Guru',
        jawatan: s.jawatan || '-',
        gred: s.gred || '-',
        department: s.department || null,
        points,
        percentage,
        status,
        assignments: activeAssignments,
        leadershipCount,
        coordinatorCount,
        memberCount,
      };
    })
    .sort((a, b) => b.percentage - a.percentage || b.points - a.points || a.name.localeCompare(b.name, 'ms'));

  const guruItems = staffItems.filter((s) => s.type === 'Guru');
  const sokonganItems = staffItems.filter((s) => s.type === 'Sokongan');

  const totalAssignments = staffItems.reduce((sum, s) => sum + s.assignments.length, 0);
  const totalPointsAssigned = staffItems.reduce((sum, s) => sum + s.points, 0);

  const avgWorkloadPctAll =
    staffItems.length > 0
      ? Math.round(staffItems.reduce((sum, s) => sum + s.percentage, 0) / staffItems.length)
      : 0;

  const avgWorkloadPctGuru =
    guruItems.length > 0
      ? Math.round(guruItems.reduce((sum, s) => sum + s.percentage, 0) / guruItems.length)
      : 0;

  const sortedGuruPcts = [...guruItems.map((g) => g.percentage)].sort((a, b) => a - b);
  const medianWorkloadPctGuru =
    sortedGuruPcts.length === 0
      ? 0
      : sortedGuruPcts.length % 2 === 1
      ? sortedGuruPcts[Math.floor(sortedGuruPcts.length / 2)]
      : Math.round(
          (sortedGuruPcts[sortedGuruPcts.length / 2 - 1] +
            sortedGuruPcts[sortedGuruPcts.length / 2]) /
            2
        );

  const varianceGuru =
    guruItems.length > 0
      ? guruItems.reduce((acc, g) => acc + Math.pow(g.percentage - avgWorkloadPctGuru, 2), 0) /
        guruItems.length
      : 0;
  const stdDevPctGuru = Math.round(Math.sqrt(varianceGuru));

  const minGuruPct = sortedGuruPcts.length > 0 ? sortedGuruPcts[0] : 0;
  const maxGuruPct = sortedGuruPcts.length > 0 ? sortedGuruPcts[sortedGuruPcts.length - 1] : 0;
  const avgAssignmentsPerGuru =
    guruItems.length > 0
      ? Number(
          (
            guruItems.reduce((sum, g) => sum + g.assignments.length, 0) / guruItems.length
          ).toFixed(1)
        )
      : 0;

  // Category breakdown
  const activeCategories = sortMajorCategories(
    filteredCommittees.map((c) => (c.category || '').trim() || 'Lain-lain')
  );

  const categoryBreakdown: CategorySummary[] = activeCategories.map((cat) => {
    const commsInCat = filteredCommittees.filter(
      (c) => ((c.category || '').trim() || 'Lain-lain') === cat
    );
    const commIds = new Set(commsInCat.map((c) => c.id));
    let assignmentCount = 0;
    let totalPoints = 0;
    const staffSet = new Set<string>();

    staffItems.forEach((s) => {
      s.assignments.forEach((a) => {
        if (commIds.has(a.committee_id)) {
          assignmentCount++;
          totalPoints += Number(a.workload_weightage) || 0;
          staffSet.add(s.id);
        }
      });
    });

    return {
      category: cat,
      committeeCount: commsInCat.length,
      assignmentCount,
      uniqueStaffCount: staffSet.size,
      totalPoints,
      avgPointsPerAssignment:
        assignmentCount > 0 ? Number((totalPoints / assignmentCount).toFixed(1)) : 0,
    };
  });

  // Committee breakdown
  const committeeBreakdown: CommitteeSummary[] = filteredCommittees
    .map((c) => {
      const members: { role: string; weight: number }[] = [];
      staffItems.forEach((s) => {
        s.assignments.forEach((a) => {
          if (a.committee_id === c.id) {
            members.push({ role: a.role, weight: Number(a.workload_weightage) || 0 });
          }
        });
      });

      const hasSecretary = members.some((m) => m.role.toLowerCase().includes('setiausaha'));
      const hasChair = members.some(
        (m) =>
          m.role.toLowerCase().includes('pengerusi') ||
          m.role.toLowerCase().includes('penasihat') ||
          m.role.toLowerCase().includes('ketua')
      );

      return {
        id: c.id,
        name: c.name,
        category: (c.category || '').trim() || 'Lain-lain',
        memberCount: members.length,
        totalPoints: members.reduce((sum, m) => sum + m.weight, 0),
        hasSecretary,
        hasChair,
        roles: members.map((m) => m.role),
      };
    })
    .sort((a, b) => b.totalPoints - a.totalPoints || b.memberCount - a.memberCount);

  // Role buckets
  const bucketMap: Record<
    'Kepimpinan Induk' | 'Penyelaras & Setiausaha' | 'Ahli & Pelaksana',
    { count: number; totalPoints: number }
  > = {
    'Kepimpinan Induk': { count: 0, totalPoints: 0 },
    'Penyelaras & Setiausaha': { count: 0, totalPoints: 0 },
    'Ahli & Pelaksana': { count: 0, totalPoints: 0 },
  };

  staffItems.forEach((s) => {
    s.assignments.forEach((a) => {
      const b = classifyRoleBucket(a.role);
      bucketMap[b].count++;
      bucketMap[b].totalPoints += Number(a.workload_weightage) || 0;
    });
  });

  const roleBuckets: RoleBucketSummary[] = [
    {
      bucket: 'Kepimpinan Induk',
      description: 'Pengerusi, Timbalan Pengerusi, Penasihat',
      count: bucketMap['Kepimpinan Induk'].count,
      totalPoints: bucketMap['Kepimpinan Induk'].totalPoints,
      percentageOfAssignments:
        totalAssignments > 0
          ? Math.round((bucketMap['Kepimpinan Induk'].count / totalAssignments) * 100)
          : 0,
    },
    {
      bucket: 'Penyelaras & Setiausaha',
      description: 'Setiausaha, Penyelaras, Ketua Panitia, Bendahari',
      count: bucketMap['Penyelaras & Setiausaha'].count,
      totalPoints: bucketMap['Penyelaras & Setiausaha'].totalPoints,
      percentageOfAssignments:
        totalAssignments > 0
          ? Math.round((bucketMap['Penyelaras & Setiausaha'].count / totalAssignments) * 100)
          : 0,
    },
    {
      bucket: 'Ahli & Pelaksana',
      description: 'Ahli Jawatankuasa (AJK), Guru Penasihat',
      count: bucketMap['Ahli & Pelaksana'].count,
      totalPoints: bucketMap['Ahli & Pelaksana'].totalPoints,
      percentageOfAssignments:
        totalAssignments > 0
          ? Math.round((bucketMap['Ahli & Pelaksana'].count / totalAssignments) * 100)
          : 0,
    },
  ];

  // Highest & Lowest teachers (prioritize Guru so AKP doesn't skew bottom list)
  const rankingPool = guruItems.length > 0 ? guruItems : staffItems;
  const highestTeachers = rankingPool.slice(0, 5);
  const lowestTeachers = [...rankingPool]
    .sort((a, b) => a.percentage - b.percentage || a.points - b.points || a.name.localeCompare(b.name, 'ms'))
    .slice(0, 5);

  // --- DATA-DRIVEN INSIGHTS ---
  const insights: WorkloadInsight[] = [];

  // 1. Overloaded teachers (> 100%)
  const overloadedTeachers = staffItems.filter((s) => s.percentage > 100);
  if (overloadedTeachers.length > 0) {
    const nonAdminOverloaded = overloadedTeachers.filter((s) => !isPentadbirExOfficio(s.jawatan));
    insights.push({
      id: 'overloaded-staff',
      severity: 'warning',
      title: `${overloadedTeachers.length} Warga Melebihi Had Rujukan 100%`,
      metric: `Maksimum ${overloadedTeachers[0].percentage}% (${overloadedTeachers[0].points}/${safeRef} mata)`,
      explanation:
        nonAdminOverloaded.length > 0
          ? `Terdapat ${nonAdminOverloaded.length} guru bukan pentadbir melebihi 100% mata pemberatan. Semakan semula peranan berwajaran tinggi (Setiausaha/Penyelaras) disyorkan bagi mengelakkan ketepuan tugas.`
          : `Kesemua rekod melebihi 100% melibatkan barisan Pentadbir (Pengetua/PK) hasil lantikan ex-officio merentas jawatankuasa induk.`,
      affectedEntities: overloadedTeachers.slice(0, 6).map((s) => `${s.name} (${s.percentage}%)`),
    });
  }

  // 2. Concentration of workload points among top 20% of Guru
  if (guruItems.length >= 5 && totalPointsAssigned > 0) {
    const top20Count = Math.max(1, Math.ceil(guruItems.length * 0.2));
    const guruTotalPoints = guruItems.reduce((sum, g) => sum + g.points, 0);
    if (guruTotalPoints > 0) {
      const top20Points = guruItems.slice(0, top20Count).reduce((sum, g) => sum + g.points, 0);
      const sharePct = Math.round((top20Points / guruTotalPoints) * 100);
      if (sharePct >= 38) {
        insights.push({
          id: 'workload-concentration',
          severity: 'warning',
          title: 'Kepekatan Pemberatan Tugas pada Kelompok Kecil Guru',
          metric: `${sharePct}% jumlah mata dipegang oleh ${top20Count} guru teratas (20%)`,
          explanation: `Kumpulan 20% guru teratas menanggung ${top20Points} daripada ${guruTotalPoints} jumlah mata keseluruhan guru. Pengagihan semula peranan Penyelaras atau Setiausaha kepada guru berbeban rendah dapat meningkatkan keseimbangan.`,
          affectedEntities: guruItems
            .slice(0, top20Count)
            .map((g) => `${g.name} (${g.points} mata / ${g.percentage}%)`),
        });
      }
    }
  }

  // 3. Under-utilized Guru (< 50% or 0 assignments)
  const lowGuru = guruItems.filter((g) => g.percentage < 50);
  const zeroGuru = guruItems.filter((g) => g.assignments.length === 0);
  if (lowGuru.length > 0) {
    insights.push({
      id: 'underutilized-guru',
      severity: 'info',
      title: `${lowGuru.length} Guru Berada di Bawah Tahap Beban Minimum (< 50%)`,
      metric:
        zeroGuru.length > 0
          ? `${zeroGuru.length} guru belum mempunyai sebarang lantikan`
          : `Purata kumpulan ini: ${Math.round(
              lowGuru.reduce((s, g) => s + g.percentage, 0) / lowGuru.length
            )}%`,
      explanation: `Kumpulan guru ini mempunyai kapasiti mata pemberatan yang masih terbuka (kurang daripada ${Math.round(
        safeRef * 0.5
      )} mata) dan boleh dipertimbangkan untuk mengisi slot Jawatankuasa yang masih kosong.`,
      affectedEntities: lowGuru.slice(0, 6).map((g) => `${g.name} (${g.percentage}%)`),
    });
  }

  // 4. Coordinator / Secretary role concentration (>= 3 heavy administrative roles on 1 teacher)
  const heavyCoordinators = guruItems.filter(
    (g) => !isPentadbirExOfficio(g.jawatan) && g.coordinatorCount >= 3
  );
  if (heavyCoordinators.length > 0) {
    insights.push({
      id: 'heavy-coordinators',
      severity: 'warning',
      title: `${heavyCoordinators.length} Guru Memegang ≥ 3 Peranan Setiausaha / Penyelaras`,
      metric: `Maksimum ${Math.max(...heavyCoordinators.map((g) => g.coordinatorCount))} jawatan utama`,
      explanation: `Peranan Setiausaha dan Penyelaras memerlukan penyelarasan dokumentasi dan mesyuarat berkala. Memegang tiga atau lebih peranan utama serentak berisiko meningkatkan beban pentadbiran walaupun jumlah jawatankuasa kelihatan sederhana.`,
      affectedEntities: heavyCoordinators
        .slice(0, 5)
        .map((g) => `${g.name} (${g.coordinatorCount} peranan utama)`),
    });
  }

  // 5. Incomplete or empty committees
  const emptyComms = committeeBreakdown.filter((c) => c.memberCount === 0);
  const noSecretaryComms = committeeBreakdown.filter(
    (c) => c.memberCount > 0 && !c.hasSecretary
  );
  if (emptyComms.length > 0 || noSecretaryComms.length > 0) {
    insights.push({
      id: 'incomplete-committees',
      severity: 'info',
      title: 'Jawatankuasa Tidak Lengkap atau Tanpa Setiausaha',
      metric: `${emptyComms.length} kosong • ${noSecretaryComms.length} tiada Setiausaha`,
      explanation: `Jawatankuasa yang tidak mempunyai Setiausaha atau ahli akan menyukarkan penyediaan minit mesyuarat dan pelaporan dalam Buku Pengurusan Sekolah.`,
      affectedEntities: [
        ...emptyComms.slice(0, 3).map((c) => `${c.name} (Tiada ahli)`),
        ...noSecretaryComms.slice(0, 3).map((c) => `${c.name} (Tiada Setiausaha)`),
      ],
    });
  }

  // 6. Positive balance indicator if distribution is healthy
  if (
    guruItems.length > 0 &&
    overloadedTeachers.length === 0 &&
    stdDevPctGuru <= 22 &&
    totalAssignments > 0
  ) {
    insights.push({
      id: 'healthy-balance',
      severity: 'positive',
      title: 'Taburan Beban Tugas Guru Terkawal dan Seimbang',
      metric: `Sisihan piawai ${stdDevPctGuru}% • Tiada guru melebihi 100%`,
      explanation: `Purata beban tugas guru berada pada ${avgWorkloadPctGuru}% (median ${medianWorkloadPctGuru}%) tanpa sebarang lebihan had rujukan ${safeRef} mata.`,
    });
  }

  const activeCommitteesCount = committeeBreakdown.filter((c) => c.memberCount > 0).length;

  return {
    referencePoints: safeRef,
    majorCategories,
    staffItems,
    kpis: {
      totalStaff: staffItems.length,
      guruCount: guruItems.length,
      sokonganCount: sokonganItems.length,
      totalCommittees: filteredCommittees.length,
      activeCommittees: activeCommitteesCount,
      emptyCommittees: filteredCommittees.length - activeCommitteesCount,
      totalAssignments,
      totalPointsAssigned,
      avgWorkloadPctAll,
      avgWorkloadPctGuru,
      medianWorkloadPctGuru,
      stdDevPctGuru,
      minGuruPct,
      maxGuruPct,
      avgAssignmentsPerGuru,
      highCount: staffItems.filter((s) => s.status === 'Tinggi').length,
      balancedCount: staffItems.filter((s) => s.status === 'Seimbang').length,
      lowCount: staffItems.filter((s) => s.status === 'Rendah').length,
      zeroAssignmentGuruCount: zeroGuru.length,
    },
    categoryBreakdown,
    committeeBreakdown,
    roleBuckets,
    highestTeachers,
    lowestTeachers,
    insights,
  };
}