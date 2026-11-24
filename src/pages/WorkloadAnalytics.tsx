import { useEffect, useMemo, useState } from 'react';
import {
  Presentation,
  RotateCcw,
  AlertTriangle,
  Info,
  CheckCircle2,
  Users,
  Layers,
  Award,
  TrendingUp,
  X,
  Download,
  Loader2,
  SlidersHorizontal,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { DEFAULT_WORKLOAD_SETTINGS, getSchoolWorkloadSettings } from '../lib/autoAssignEngine';
import { computeWorkloadAnalytics } from '../utils/workloadAnalytics';
import {
  generateWorkloadPresentationPptx,
  type PptxExportConfig,
} from '../utils/exportWorkloadPptx';

export default function WorkloadAnalytics() {
  const [isLoading, setIsLoading] = useState(true);
  const [schoolName, setSchoolName] = useState('Sekolah Menengah Kebangsaan');
  const [defaultSession, setDefaultSession] = useState('2026/2027');
  const [presenterName, setPresenterName] = useState('Pentadbiran Sekolah');

  const [rawStaffList, setRawStaffList] = useState<any[]>([]);
  const [committeesList, setCommitteesList] = useState<any[]>([]);
  const [referencePoints, setReferencePoints] = useState(DEFAULT_WORKLOAD_SETTINGS.reference_points);

  // Active Report Filters
  const [selectedSession, setSelectedSession] = useState<string>('Semua');
  const [selectedCategory, setSelectedCategory] = useState<string>('Semua');
  const [selectedCommitteeId, setSelectedCommitteeId] = useState<string>('Semua');
  const [selectedStaffType, setSelectedStaffType] = useState<string>('Semua');
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>('Semua');
  const [chartSortOrder, setChartSortOrder] = useState<'desc' | 'asc'>('desc');
  const [showAllTeachersInChart, setShowAllTeachersInChart] = useState(false);

  // PPTX Export Review Modal State
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isExportingPptx, setIsExportingPptx] = useState(false);
  const [pptxTitle, setPptxTitle] = useState('Analisis Pemberatan & Taburan Beban Tugas Guru');
  const [meetingContext, setMeetingContext] = useState(
    'Pembentangan Mesyuarat Pengurusan & Pentadbiran Sekolah'
  );
  const [includedSections, setIncludedSections] = useState({
    executiveOverview: true,
    teacherDistribution: true,
    categoryAndRoles: true,
    extremesTable: true,
    insightsAndActions: true,
  });

  useEffect(() => {
    async function loadAnalyticsData() {
      setIsLoading(true);
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user) {
        setIsLoading(false);
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('school_id, full_name')
        .eq('id', session.user.id)
        .single();

      if (profile?.full_name) setPresenterName(profile.full_name);

      if (!profile?.school_id) {
        setIsLoading(false);
        return;
      }

      const currentSchoolId = profile.school_id;
      const [settings, { data: schoolProfile }, { data: staff }, { data: committees }] =
        await Promise.all([
          getSchoolWorkloadSettings(currentSchoolId),
          supabase
            .from('school_profile')
            .select('*')
            .eq('school_id', currentSchoolId)
            .maybeSingle(),
          supabase
            .from('staff')
            .select(
              `
              id, name, type, jawatan, gred, department,
              staff_committees ( id, workload_weightage, committee_id, role, academic_session, committees ( id, name, category ) )
            `
            )
            .eq('school_id', currentSchoolId)
            .neq('status', 'Tidak Aktif')
            .order('name'),
          supabase
            .from('committees')
            .select('id, name, category, sub_category, parent_committee_id')
            .eq('school_id', currentSchoolId)
            .order('name'),
        ]);

      setReferencePoints(settings.reference_points || 40);
      if (schoolProfile?.school_name || schoolProfile?.name) {
        setSchoolName(schoolProfile.school_name || schoolProfile.name);
      }
      if (schoolProfile?.current_session || schoolProfile?.academic_session) {
        setDefaultSession(schoolProfile.current_session || schoolProfile.academic_session);
      }

      setRawStaffList(staff || []);
      setCommitteesList(committees || []);
      setIsLoading(false);
    }

    loadAnalyticsData();
  }, []);

  // Extract distinct academic sessions present in assignments
  const availableSessions = useMemo(() => {
    const sessions = new Set<string>();
    rawStaffList.forEach((s) => {
      s.staff_committees?.forEach((sc: any) => {
        if (sc.academic_session) sessions.add(sc.academic_session);
      });
    });
    return Array.from(sessions).sort().reverse();
  }, [rawStaffList]);

  const analytics = useMemo(
    () =>
      computeWorkloadAnalytics({
        staffList: rawStaffList,
        committeesList,
        referencePoints,
        selectedSession,
        selectedCategory,
        selectedCommitteeId,
        selectedStaffType,
        selectedTeacherId,
      }),
    [
      rawStaffList,
      committeesList,
      referencePoints,
      selectedSession,
      selectedCategory,
      selectedCommitteeId,
      selectedStaffType,
      selectedTeacherId,
    ]
  );

  // Filter committee dropdown options when category changes
  const committeeOptions = useMemo(() => {
    if (selectedCategory === 'Semua') return committeesList;
    return committeesList.filter(
      (c) => ((c.category || '').trim() || 'Lain-lain') === selectedCategory
    );
  }, [committeesList, selectedCategory]);

  const hasActiveFilters =
    selectedSession !== 'Semua' ||
    selectedCategory !== 'Semua' ||
    selectedCommitteeId !== 'Semua' ||
    selectedStaffType !== 'Semua' ||
    selectedTeacherId !== 'Semua';

  const resetFilters = () => {
    setSelectedSession('Semua');
    setSelectedCategory('Semua');
    setSelectedCommitteeId('Semua');
    setSelectedStaffType('Semua');
    setSelectedTeacherId('Semua');
  };

  // Teacher comparison chart items
  const chartTeachers = useMemo(() => {
    const sorted = [...analytics.staffItems].sort((a, b) =>
      chartSortOrder === 'desc' ? b.percentage - a.percentage : a.percentage - b.percentage
    );
    return showAllTeachersInChart ? sorted : sorted.slice(0, 15);
  }, [analytics.staffItems, chartSortOrder, showAllTeachersInChart]);

  const maxChartScale = useMemo(() => {
    const highest = Math.max(120, ...chartTeachers.map((t) => t.percentage));
    return Math.ceil(highest / 20) * 20;
  }, [chartTeachers]);

  const maxCategoryPoints = useMemo(
    () => Math.max(1, ...analytics.categoryBreakdown.map((c) => c.totalPoints)),
    [analytics.categoryBreakdown]
  );

  const activeFiltersSummary = useMemo(() => {
    const parts: string[] = [];
    if (selectedSession !== 'Semua') parts.push(`Sesi: ${selectedSession}`);
    if (selectedCategory !== 'Semua') parts.push(`Kategori: ${selectedCategory}`);
    if (selectedCommitteeId !== 'Semua') {
      const cName = committeesList.find((c) => c.id === selectedCommitteeId)?.name;
      if (cName) parts.push(`Unit: ${cName}`);
    }
    if (selectedStaffType !== 'Semua') parts.push(`Warga: ${selectedStaffType}`);
    if (selectedTeacherId !== 'Semua') {
      const tName = rawStaffList.find((s) => s.id === selectedTeacherId)?.name;
      if (tName) parts.push(`Individu: ${tName}`);
    }
    return parts.length > 0 ? parts.join(' • ') : 'Semua Warga & Jawatankuasa';
  }, [
    selectedSession,
    selectedCategory,
    selectedCommitteeId,
    selectedStaffType,
    selectedTeacherId,
    committeesList,
    rawStaffList,
  ]);

  const handleExportPptx = async () => {
    setIsExportingPptx(true);
    try {
      const todayFormatted = new Date().toLocaleDateString('ms-MY', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });

      const config: PptxExportConfig = {
        schoolName,
        academicSession: selectedSession !== 'Semua' ? selectedSession : defaultSession,
        presentationTitle: pptxTitle.trim() || 'Analisis Pemberatan & Beban Tugas Guru',
        meetingContext: meetingContext.trim(),
        presenterName: presenterName.trim() || 'Pentadbiran Sekolah',
        reportDate: todayFormatted,
        activeFiltersLabel: activeFiltersSummary,
        sections: includedSections,
      };

      await generateWorkloadPresentationPptx(analytics, config);
      setIsExportModalOpen(false);
    } catch (err: any) {
      alert('Gagal menjana fail PowerPoint: ' + (err?.message || 'Ralat tidak dijangka'));
    } finally {
      setIsExportingPptx(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-[75vh] items-center justify-center text-slate-500 text-xs gap-2">
        <Loader2 size={16} className="animate-spin text-ink" />
        Menyediakan papan pemuka analisis pemberatan tugas...
      </div>
    );
  }

  return (
    <div className="max-w-384 mx-auto space-y-5 lg:space-y-6 relative">
      {/* Header & PPTX Export Trigger */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 px-1">
        <div>
          <h2 className="text-2xl sm:text-3xl font-semibold text-ink tracking-tight">
            Analisis & Laporan Beban Tugas
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Penilaian taburan pemberatan tugas, kepekatan peranan dan keseimbangan warga sekolah ({schoolName}).
          </p>
        </div>

        <button
          onClick={() => setIsExportModalOpen(true)}
          disabled={analytics.staffItems.length === 0}
          className="bg-ink hover:opacity-90 text-white rounded-lg font-medium h-10 px-4 text-xs flex items-center gap-2 transition-all shrink-0 disabled:opacity-50"
        >
          <Presentation size={15} />
          Eksport Pembentangan (.PPTX)
        </button>
      </div>

      {/* Interactive Report Filters Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-semibold text-ink">
            <SlidersHorizontal size={14} className="text-slate-500" />
            <span>Parameter & Tapisan Analisis</span>
            <span className="text-[11px] font-normal text-slate-400">
              (Semua carta dan eksport .PPTX mengikut tapisan ini)
            </span>
          </div>
          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="text-xs font-semibold text-rose hover:underline inline-flex items-center gap-1"
            >
              <RotateCcw size={12} /> Set Semula
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {availableSessions.length > 0 && (
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Sesi Akademik
              </label>
              <select
                value={selectedSession}
                onChange={(e) => setSelectedSession(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-medium text-ink outline-none focus:border-ink/40"
              >
                <option value="Semua">Semua Sesi ({defaultSession})</option>
                {availableSessions.map((ses) => (
                  <option key={ses} value={ses}>
                    Sesi {ses}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Kategori Jawatankuasa
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setSelectedCommitteeId('Semua');
              }}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-medium text-ink outline-none focus:border-ink/40"
            >
              <option value="Semua">Semua Kategori</option>
              {analytics.majorCategories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Jawatankuasa / Unit
            </label>
            <select
              value={selectedCommitteeId}
              onChange={(e) => setSelectedCommitteeId(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-medium text-ink outline-none focus:border-ink/40"
            >
              <option value="Semua">Semua Jawatankuasa ({committeeOptions.length})</option>
              {committeeOptions.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Kategori Warga
            </label>
            <select
              value={selectedStaffType}
              onChange={(e) => setSelectedStaffType(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-medium text-ink outline-none focus:border-ink/40"
            >
              <option value="Semua">Semua Warga</option>
              <option value="Guru">Guru Sahaja</option>
              <option value="Sokongan">Staf Sokongan (AKP)</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Fokus Individu
            </label>
            <select
              value={selectedTeacherId}
              onChange={(e) => setSelectedTeacherId(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-medium text-ink outline-none focus:border-ink/40"
            >
              <option value="Semua">Semua Individu</option>
              {rawStaffList.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* SECTION A: OVERALL OVERVIEW KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Warga Sekolah</span>
            <Users size={16} />
          </div>
          <p className="text-3xl font-bold text-ink">{analytics.kpis.totalStaff}</p>
          <p className="text-xs text-slate-500 mt-1">
            {analytics.kpis.guruCount} Guru • {analytics.kpis.sokonganCount} Staf Sokongan
          </p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">
              Jawatankuasa & Lantikan
            </span>
            <Layers size={16} />
          </div>
          <p className="text-3xl font-bold text-ink">{analytics.kpis.totalAssignments}</p>
          <p className="text-xs text-slate-500 mt-1">
            {analytics.kpis.activeCommittees}/{analytics.kpis.totalCommittees} unit aktif • Purata{' '}
            {analytics.kpis.avgAssignmentsPerGuru} tugas/guru
          </p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Purata Beban Guru</span>
            <TrendingUp size={16} />
          </div>
          <p className="text-3xl font-bold text-forest">{analytics.kpis.avgWorkloadPctGuru}%</p>
          <p className="text-xs text-slate-500 mt-1">
            Median {analytics.kpis.medianWorkloadPctGuru}% • Sisihan piawai ±
            {analytics.kpis.stdDevPctGuru}%
          </p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">
              Jumlah Mata Pemberatan
            </span>
            <Award size={16} />
          </div>
          <p className="text-3xl font-bold text-ink">{analytics.kpis.totalPointsAssigned}</p>
          <p className="text-xs text-slate-500 mt-1">
            Rujukan penuh: {analytics.referencePoints} mata (100%)
          </p>
        </div>
      </div>

      {/* SECTION D: DATA-DRIVEN WORKLOAD INSIGHTS (TOP PRIORITY FOR DECISION MAKING) */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-base font-semibold text-ink">
              Pemerhatian & Dapatan Keseimbangan Tugas
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Analisis automatik berasaskan mata pemberatan sebenar dan struktur jawatankuasa semasa.
            </p>
          </div>
          <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md self-start">
            {analytics.insights.length} Dapatan Dikesan
          </span>
        </div>

        {analytics.insights.length === 0 ? (
          <p className="text-xs text-slate-400 py-4">
            Tiada pemerhatian khas untuk tapisan semasa.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {analytics.insights.map((insight) => {
              const styles =
                insight.severity === 'warning'
                  ? {
                      border: 'border-rose/25 bg-rose/[0.03]',
                      badge: 'bg-rose/10 text-rose border-rose/20',
                      icon: <AlertTriangle size={16} className="text-rose shrink-0 mt-0.5" />,
                    }
                  : insight.severity === 'positive'
                  ? {
                      border: 'border-forest/25 bg-forest/[0.03]',
                      badge: 'bg-forest/10 text-forest border-forest/20',
                      icon: <CheckCircle2 size={16} className="text-forest shrink-0 mt-0.5" />,
                    }
                  : {
                      border: 'border-sky/25 bg-sky/[0.03]',
                      badge: 'bg-sky/10 text-sky border-sky/20',
                      icon: <Info size={16} className="text-sky shrink-0 mt-0.5" />,
                    };

              return (
                <div
                  key={insight.id}
                  className={`rounded-xl border p-4 flex flex-col justify-between gap-2.5 ${styles.border}`}
                >
                  <div className="space-y-1.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2">
                        {styles.icon}
                        <h4 className="text-xs font-bold text-ink leading-snug">{insight.title}</h4>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded border text-[10px] font-bold shrink-0 ${styles.badge}`}
                      >
                        {insight.metric}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed pl-6">
                      {insight.explanation}
                    </p>
                  </div>

                  {insight.affectedEntities && insight.affectedEntities.length > 0 && (
                    <div className="pl-6 flex flex-wrap gap-1.5 pt-1">
                      {insight.affectedEntities.map((entity, idx) => (
                        <span
                          key={idx}
                          className="text-[10px] font-medium bg-white border border-slate-200 text-slate-700 px-2 py-0.5 rounded"
                        >
                          {entity}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* SECTION B: WORKLOAD DISTRIBUTION ACROSS TEACHERS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
        {/* Horizontal Bar Chart */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-5 flex flex-col">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div>
              <h3 className="text-base font-semibold text-ink">
                Perbandingan Beban Tugas Individu (%)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Garis rujukan: 50% (Minimum) dan 100% ({analytics.referencePoints} mata penuh)
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() =>
                  setChartSortOrder((prev) => (prev === 'desc' ? 'asc' : 'desc'))
                }
                className="px-2.5 py-1.5 text-[11px] font-semibold bg-slate-100 hover:bg-slate-200 text-ink rounded-lg transition-colors"
              >
                {chartSortOrder === 'desc' ? 'Tertinggi → Terendah' : 'Terendah → Tertinggi'}
              </button>
              {analytics.staffItems.length > 15 && (
                <button
                  onClick={() => setShowAllTeachersInChart((prev) => !prev)}
                  className="px-2.5 py-1.5 text-[11px] font-semibold bg-white border border-slate-200 hover:bg-slate-50 text-ink rounded-lg transition-colors"
                >
                  {showAllTeachersInChart
                    ? 'Papar 15 Sahaja'
                    : `Semua (${analytics.staffItems.length})`}
                </button>
              )}
            </div>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-600 mb-4 pb-3 border-b border-slate-100">
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-rose"></span> Tinggi (&gt;100%)
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-forest"></span> Seimbang (50%–100%)
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-sky"></span> Rendah (&lt;50%)
            </span>
          </div>

          {chartTeachers.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400">
              Tiada data warga untuk dipaparkan.
            </div>
          ) : (
            <div className="space-y-2.5 max-h-120 overflow-y-auto pr-1">
              {chartTeachers.map((teacher) => {
                const widthPct = Math.min(100, Math.round((teacher.percentage / maxChartScale) * 100));
                const ref100Pos = Math.round((100 / maxChartScale) * 100);
                const ref50Pos = Math.round((50 / maxChartScale) * 100);

                const barColor =
                  teacher.percentage > 100
                    ? 'bg-rose'
                    : teacher.percentage < 50
                    ? 'bg-sky'
                    : 'bg-forest';

                return (
                  <div key={teacher.id} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <div className="min-w-0 pr-3">
                        <span className="font-semibold text-ink truncate inline-block max-w-64 sm:max-w-96 align-bottom">
                          {teacher.name}
                        </span>
                        <span className="text-[10px] text-slate-400 ml-2">
                          ({teacher.assignments.length} JK)
                        </span>
                      </div>
                      <span className="font-bold text-ink shrink-0">
                        {teacher.percentage}%{' '}
                        <span className="font-normal text-slate-400 text-[10px]">
                          ({teacher.points}m)
                        </span>
                      </span>
                    </div>

                    <div className="relative w-full h-3 bg-slate-100 rounded-sm overflow-hidden">
                      {/* 50% marker */}
                      <div
                        className="absolute top-0 bottom-0 w-px bg-slate-300 z-10"
                        style={{ left: `${ref50Pos}%` }}
                        title="50% Minimum"
                      />
                      {/* 100% marker */}
                      <div
                        className="absolute top-0 bottom-0 w-0.5 bg-ink/40 z-10"
                        style={{ left: `${ref100Pos}%` }}
                        title="100% Sasaran Rujukan"
                      />
                      <div
                        className={`h-full rounded-sm transition-all duration-500 ${barColor}`}
                        style={{ width: `${widthPct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Tier Distribution & Highest/Lowest Spotlight */}
        <div className="space-y-4">
          {/* Tier Breakdown Card */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-ink">Komposisi Tahap Beban</h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Pecahan warga mengikut julat peratusan
              </p>
            </div>

            {analytics.kpis.totalStaff > 0 && (
              <div className="w-full h-4 rounded-md overflow-hidden flex bg-slate-100">
                <div
                  className="bg-rose h-full transition-all"
                  style={{
                    width: `${(analytics.kpis.highCount / analytics.kpis.totalStaff) * 100}%`,
                  }}
                  title={`Tinggi: ${analytics.kpis.highCount}`}
                />
                <div
                  className="bg-forest h-full transition-all"
                  style={{
                    width: `${(analytics.kpis.balancedCount / analytics.kpis.totalStaff) * 100}%`,
                  }}
                  title={`Seimbang: ${analytics.kpis.balancedCount}`}
                />
                <div
                  className="bg-sky h-full transition-all"
                  style={{
                    width: `${(analytics.kpis.lowCount / analytics.kpis.totalStaff) * 100}%`,
                  }}
                  title={`Rendah: ${analytics.kpis.lowCount}`}
                />
              </div>
            )}

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between py-1 border-b border-slate-100">
                <span className="flex items-center gap-2 text-slate-600">
                  <span className="w-2.5 h-2.5 rounded-sm bg-rose"></span> Tinggi (&gt;100%)
                </span>
                <span className="font-bold text-ink">{analytics.kpis.highCount} warga</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-slate-100">
                <span className="flex items-center gap-2 text-slate-600">
                  <span className="w-2.5 h-2.5 rounded-sm bg-forest"></span> Seimbang (50%–100%)
                </span>
                <span className="font-bold text-ink">{analytics.kpis.balancedCount} warga</span>
              </div>
              <div className="flex items-center justify-between py-1">
                <span className="flex items-center gap-2 text-slate-600">
                  <span className="w-2.5 h-2.5 rounded-sm bg-sky"></span> Rendah (&lt;50%)
                </span>
                <span className="font-bold text-ink">{analytics.kpis.lowCount} warga</span>
              </div>
            </div>
          </div>

          {/* Role Composition Card */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-3">
            <div>
              <h3 className="text-sm font-semibold text-ink">Taburan Mengikut Hierarki Peranan</h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Perbandingan lantikan kepimpinan, penyelaras & pelaksana
              </p>
            </div>

            <div className="space-y-3">
              {analytics.roleBuckets.map((rb) => (
                <div key={rb.bucket} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-ink">{rb.bucket}</span>
                    <span className="text-slate-600 font-medium">
                      {rb.count} lantikan ({rb.totalPoints} mata)
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-ink rounded-full"
                      style={{ width: `${rb.percentageOfAssignments}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-slate-400">{rb.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* SECTION C: CATEGORY BREAKDOWN & HIGHEST/LOWEST COMPARISON */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
        {/* Category Distribution */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
          <div>
            <h3 className="text-base font-semibold text-ink">
              Pemberatan Mengikut Kategori Jawatankuasa
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Jumlah mata pemberatan dan bilangan lantikan bagi setiap kategori utama
            </p>
          </div>

          {analytics.categoryBreakdown.length === 0 ? (
            <p className="text-xs text-slate-400 py-8 text-center">Tiada kategori ditemui.</p>
          ) : (
            <div className="space-y-3.5">
              {analytics.categoryBreakdown.map((cat) => {
                const barWidth = Math.round((cat.totalPoints / maxCategoryPoints) * 100);
                return (
                  <div key={cat.category} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <div>
                        <span className="font-semibold text-ink">{cat.category}</span>
                        <span className="text-[11px] text-slate-400 ml-2">
                          ({cat.committeeCount} unit • {cat.assignmentCount} lantikan)
                        </span>
                      </div>
                      <span className="font-bold text-forest">{cat.totalPoints} mata</span>
                    </div>
                    <div className="w-full h-2.5 bg-slate-100 rounded-sm overflow-hidden">
                      <div
                        className="h-full bg-forest rounded-sm transition-all duration-500"
                        style={{ width: `${barWidth}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Highest vs Lowest Teacher Table */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
          <div>
            <h3 className="text-base font-semibold text-ink">
              Perbandingan Beban Tertinggi vs. Terendah
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Rujukan pantas untuk mengimbangi semula tugas guru
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Highest */}
            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <div className="px-3 py-2 bg-rose/5 border-b border-slate-200 text-[11px] font-bold text-rose uppercase">
                5 Tertinggi
              </div>
              <div className="divide-y divide-slate-100">
                {analytics.highestTeachers.map((t) => (
                  <div key={t.id} className="p-2.5 flex items-center justify-between gap-2 text-xs">
                    <div className="min-w-0">
                      <p className="font-semibold text-ink truncate">{t.name}</p>
                      <p className="text-[10px] text-slate-400 truncate">
                        {t.assignments.length} JK • {t.points} mata
                      </p>
                    </div>
                    <span className="font-bold text-rose shrink-0">{t.percentage}%</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Lowest */}
            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <div className="px-3 py-2 bg-sky/5 border-b border-slate-200 text-[11px] font-bold text-sky uppercase">
                5 Terendah
              </div>
              <div className="divide-y divide-slate-100">
                {analytics.lowestTeachers.map((t) => (
                  <div key={t.id} className="p-2.5 flex items-center justify-between gap-2 text-xs">
                    <div className="min-w-0">
                      <p className="font-semibold text-ink truncate">{t.name}</p>
                      <p className="text-[10px] text-slate-400 truncate">
                        {t.assignments.length} JK • {t.points} mata
                      </p>
                    </div>
                    <span className="font-bold text-sky shrink-0">{t.percentage}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* PRE-EXPORT POWERPOINT REVIEW MODAL */}
      {isExportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-[2px]">
          <div className="bg-white rounded-xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] shadow-2xl">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-ink/10 text-ink flex items-center justify-center">
                  <Presentation size={16} />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-ink">
                    Semakan & Eksport Pembentangan (.PPTX)
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Menjana slaid PowerPoint boleh sunting berserta carta dan jadual sebenar.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsExportModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-ink rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4 text-xs">
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                <p className="text-[10px] font-bold text-slate-400 uppercase">
                  Skop Data Dipilih
                </p>
                <p className="font-semibold text-ink mt-0.5">{activeFiltersSummary}</p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {analytics.kpis.totalStaff} warga • {analytics.kpis.totalAssignments} lantikan •{' '}
                  {analytics.kpis.totalPointsAssigned} jumlah mata
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Tajuk Pembentangan
                  </label>
                  <input
                    type="text"
                    value={pptxTitle}
                    onChange={(e) => setPptxTitle(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-ink"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Tujuan / Mesyuarat
                  </label>
                  <input
                    type="text"
                    value={meetingContext}
                    onChange={(e) => setMeetingContext(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-ink"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Nama Pembentang
                  </label>
                  <input
                    type="text"
                    value={presenterName}
                    onChange={(e) => setPresenterName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-ink"
                  />
                </div>
              </div>

              <div className="space-y-2 pt-1">
                <label className="block text-[11px] font-semibold text-slate-700">
                  Kandungan Slaid Untuk Dijana
                </label>
                {[
                  {
                    key: 'executiveOverview' as const,
                    label: 'Slaid 2: Ringkasan Eksekutif & Carta Status Beban',
                  },
                  {
                    key: 'teacherDistribution' as const,
                    label: 'Slaid 3: Carta Perbandingan Beban Individu (%)',
                  },
                  {
                    key: 'categoryAndRoles' as const,
                    label: 'Slaid 4: Analisis Mengikut Kategori Jawatankuasa (Carta & Jadual)',
                  },
                  {
                    key: 'extremesTable' as const,
                    label: 'Slaid 5: Jadual Perbandingan 5 Guru Tertinggi & 5 Terendah',
                  },
                  {
                    key: 'insightsAndActions' as const,
                    label: 'Slaid 6: Dapatan Utama & Pemerhatian Pengurusan',
                  },
                ].map((sec) => (
                  <label
                    key={sec.key}
                    className="flex items-center gap-2.5 p-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={includedSections[sec.key]}
                      onChange={(e) =>
                        setIncludedSections((prev) => ({
                          ...prev,
                          [sec.key]: e.target.checked,
                        }))
                      }
                      className="rounded border-slate-300 text-ink focus:ring-ink"
                    />
                    <span className="font-medium text-ink">{sec.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="px-5 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-2.5">
              <button
                onClick={() => setIsExportModalOpen(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-100"
              >
                Batal
              </button>
              <button
                onClick={handleExportPptx}
                disabled={isExportingPptx}
                className="px-5 py-2 text-xs font-bold text-white bg-ink rounded-lg hover:opacity-90 flex items-center gap-2 disabled:opacity-50"
              >
                {isExportingPptx ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Download size={14} />
                )}
                Muat Turun Fail .PPTX
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}