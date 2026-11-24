import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  BookOpen,
  Users,
  Target,
  Briefcase,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  GraduationCap,
  Heart,
  Info,
  Layers,
  FileUp,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import CreateCommitteeModal from '../components/CreateCommitteeModal';
import BulkCommitteeSetupModal from '../components/BulkCommitteeSetupModal';
import DocumentImportModal from '../components/DocumentImportModal';
import {
  AutoAssignReviewModal,
  type ApprovedAssignmentRow,
} from '../components/AutoAssignReviewModal';
import {
  DEFAULT_ASSIGNMENT_CONFIG,
  DEFAULT_WORKLOAD_SETTINGS,
  type AutoAssignMode,
} from '../lib/autoAssignEngine';
import type {
  AssignmentRuleConfig,
  ExistingAssignment,
  ExistingCommittee,
  TeacherProfile,
} from '../types/autoAssign';

const categories = [
  { id: 'Pentadbiran', icon: Briefcase, color: 'text-violet', bg: 'bg-violet/10', border: 'border-violet/20' },
  { id: 'Kurikulum', icon: BookOpen, color: 'text-sky', bg: 'bg-sky/10', border: 'border-sky/20' },
  { id: 'Hal Ehwal Murid', icon: Users, color: 'text-rose', bg: 'bg-rose/10', border: 'border-rose/20' },
  { id: 'Kokurikulum', icon: Target, color: 'text-forest', bg: 'bg-forest/10', border: 'border-forest/20' },
  { id: 'Tingkatan 6', icon: GraduationCap, color: 'text-amber', bg: 'bg-amber/10', border: 'border-amber/20' },
  { id: 'PPKI', icon: Heart, color: 'text-coral', bg: 'bg-coral/10', border: 'border-coral/20' },
];

export default function Committees() {
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState(() => {
    return sessionStorage.getItem('laras_committees_tab') || 'Pentadbiran';
  });

  const [committeesList, setCommitteesList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [schoolId, setSchoolId] = useState<string | null>(null);

  // Modal States
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  // Auto-Assign Review Modal States
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [isPreparingReview, setIsPreparingReview] = useState(false);
  const [reviewTeachers, setReviewTeachers] = useState<TeacherProfile[]>([]);
  const [reviewCommittees, setReviewCommittees] = useState<ExistingCommittee[]>([]);
  const [reviewExistingAssignments, setReviewExistingAssignments] = useState<ExistingAssignment[]>([]);
  const [academicSession, setAcademicSession] = useState('2026/2027');
  const [ruleConfig, setRuleConfig] = useState<AssignmentRuleConfig>(DEFAULT_ASSIGNMENT_CONFIG);
  const [workloadWeights, setWorkloadWeights] = useState<Record<string, number>>(
    DEFAULT_WORKLOAD_SETTINGS.weights
  );

  useEffect(() => {
    sessionStorage.setItem('laras_committees_tab', activeTab);
  }, [activeTab]);

  async function fetchCommittees() {
    setIsLoading(true);

    const { data: { session } } = await supabase.auth.getSession();
    let currentSchoolId = null;

    if (session?.user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('school_id')
        .eq('id', session.user.id)
        .single();
      if (profile) currentSchoolId = profile.school_id;
      setSchoolId(currentSchoolId);
    }

    if (!currentSchoolId) {
      setIsLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('committees')
      .select(`
        id, category, name, description, default_positions,
        staff_committees ( role, staff ( name ) )
      `)
      .eq('school_id', currentSchoolId)
      .order('created_at', { ascending: true });

    if (!error && data) {
      const mapped = data.map((c) => {
        const members = c.staff_committees || [];
        const getStaffName = (member: any) => {
          const staff = member?.staff;
          if (Array.isArray(staff)) return staff[0]?.name || 'Belum Ditetapkan';
          return staff?.name || 'Belum Ditetapkan';
        };

        const leadMember =
          members.find((m: any) => m.role.toLowerCase() === 'pengerusi') ||
          members.find((m: any) => m.role.toLowerCase().includes('penasihat')) ||
          members.find((m: any) => m.role.toLowerCase().includes('ketua penyelaras')) ||
          members.find((m: any) => m.role.toLowerCase().startsWith('penyelaras'));

        const secMember =
          members.find((m: any) => m.role.toLowerCase().startsWith('setiausaha')) ||
          members.find((m: any) => m.role.toLowerCase().includes('penolong penyelaras'));

        return {
          ...c,
          leadLabel: leadMember?.role || 'Pengerusi',
          pengerusi: getStaffName(leadMember),
          secLabel: secMember?.role || 'Setiausaha',
          setiausaha: secMember ? getStaffName(secMember) : 'Tiada (Kekosongan)',
          membersCount: members.length,
          status: members.length > 0 ? 'Lengkap' : 'Tidak Lengkap',
        };
      });
      setCommitteesList(mapped);
    }
    setIsLoading(false);
  }

  useEffect(() => {
    fetchCommittees();
  }, []);

  useEffect(() => {
    if (!isLoading) {
      const savedScroll = sessionStorage.getItem('laras_committees_scroll');
      if (savedScroll) {
        setTimeout(() => {
          window.scrollTo({ top: parseInt(savedScroll, 10), behavior: 'instant' });
          sessionStorage.removeItem('laras_committees_scroll');
        }, 10);
      }
    }
  }, [isLoading, activeTab]);

  const handleOpenAutoAssignReview = async () => {
    if (!schoolId) return;
    setIsPreparingReview(true);

    try {
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
        alert('Gagal memuatkan data untuk agihan automatik. Sila cuba lagi.');
        return;
      }

      if (!staffData || staffData.length === 0) {
        alert('Tiada rekod warga pendidik ditemui. Sila tambah atau import warga sekolah terlebih dahulu.');
        return;
      }

      if (!commData || commData.length === 0) {
        alert('Tiada struktur jawatankuasa ditemui. Sila jana jawatankuasa terlebih dahulu.');
        return;
      }

      const sessionStr = schoolProfile?.current_session || '2026/2027';
      const settings = schoolProfile?.workload_settings
        ? { ...DEFAULT_WORKLOAD_SETTINGS, ...schoolProfile.workload_settings }
        : DEFAULT_WORKLOAD_SETTINGS;

      setReviewTeachers(staffData as TeacherProfile[]);
      setReviewCommittees(commData as ExistingCommittee[]);
      setReviewExistingAssignments((assignData || []) as ExistingAssignment[]);
      setAcademicSession(sessionStr);
      setWorkloadWeights(settings.weights || DEFAULT_WORKLOAD_SETTINGS.weights);
      setRuleConfig({
        ...DEFAULT_ASSIGNMENT_CONFIG,
        referencePoints: settings.reference_points || 40,
      });

      setIsReviewModalOpen(true);
    } finally {
      setIsPreparingReview(false);
    }
  };

  const handleConfirmAutoAssignments = async (
    approvedRows: ApprovedAssignmentRow[],
    mode: AutoAssignMode
  ) => {
    if (!schoolId) return;

    if (mode === 'regenerate_all') {
      const targetIds = reviewCommittees.map((c) => c.id);
      if (targetIds.length > 0) {
        await supabase
          .from('staff_committees')
          .delete()
          .eq('school_id', schoolId)
          .in('committee_id', targetIds);
      }

      if (approvedRows.length > 0) {
        const dbPayload = approvedRows.map((row) => ({
          staff_id: row.staff_id,
          committee_id: row.committee_id,
          school_id: schoolId,
          role: row.role,
          workload_weightage: row.workload_weightage,
          academic_session: row.academic_session,
          is_auto_assigned: row.is_auto_assigned,
        }));
        const { error } = await supabase.from('staff_committees').insert(dbPayload);
        if (error) {
          alert(`Ralat semasa menyimpan lantikan: ${error.message}`);
          throw error;
        }
      }
    } else {
      // 'fill_vacancies': preserve existing rows untouched and insert only newly filled slots
      const newRowsToInsert = approvedRows.filter((row) => !row.is_locked);
      if (newRowsToInsert.length > 0) {
        const dbPayload = newRowsToInsert.map((row) => ({
          staff_id: row.staff_id,
          committee_id: row.committee_id,
          school_id: schoolId,
          role: row.role,
          workload_weightage: row.workload_weightage,
          academic_session: row.academic_session,
          is_auto_assigned: true,
        }));

        const { error } = await supabase.from('staff_committees').insert(dbPayload);
        if (error) {
          alert(`Ralat semasa menyimpan lantikan: ${error.message}`);
          throw error;
        }
      }
    }

    await fetchCommittees();
  };

  const handleNavigateToWorkspace = (committeeId: string) => {
    sessionStorage.setItem('laras_committees_scroll', window.scrollY.toString());
    navigate(`/committee-workspace?id=${committeeId}`);
  };

  const filteredCommittees = committeesList.filter((c) => c.category === activeTab);
  const activeCategoryStyle = categories.find((c) => c.id === activeTab);

  if (isLoading) {
    return <div className="p-8 text-center text-slate-500 text-sm font-medium">Memuatkan Organisasi...</div>;
  }

  return (
    <div className="max-w-384 mx-auto space-y-4 lg:space-y-6 relative">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 px-1">
        <div>
          <h2 className="text-2xl sm:text-3xl font-semibold text-ink tracking-tight">Jawatankuasa & panitia</h2>
          <p className="text-sm text-slate-500 mt-1">Urus struktur organisasi, ahli, tanggungjawab, dan KPI sekolah.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            disabled={isPreparingReview}
            onClick={handleOpenAutoAssignReview}
            className="bg-white border border-slate-200 text-ink hover:bg-slate-50 rounded-lg font-medium h-9 px-4 text-xs flex items-center gap-1.5 transition-colors disabled:opacity-50"
          >
            <Sparkles size={14} className="text-forest" />
            {isPreparingReview ? 'Menjana Cadangan...' : 'Agihan Automatik'}
          </button>
          <button
            type="button"
            onClick={() => setIsImportModalOpen(true)}
            className="bg-white border border-slate-200 text-ink hover:bg-slate-50 rounded-lg font-medium h-9 px-4 text-xs flex items-center gap-1.5 transition-colors"
          >
            <FileUp size={14} className="text-sky" /> Import Dokumen
          </button>
          <button
            type="button"
            onClick={() => setIsBulkModalOpen(true)}
            className="bg-white border border-slate-200 text-ink hover:bg-slate-50 rounded-lg font-medium h-9 px-4 text-xs flex items-center gap-1.5 transition-colors"
          >
            <Layers size={14} /> Penetapan Pukal
          </button>
          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-ink hover:opacity-90 text-white rounded-lg font-medium h-9 px-4 text-xs flex items-center gap-1.5 transition-all"
          >
            <Plus size={14} /> Tambah Jawatankuasa
          </button>
        </div>
      </div>

      <div className="p-2.5 bg-white rounded-xl border border-slate-200 flex flex-col xl:flex-row gap-4 items-center justify-between">
        <div className="flex items-center gap-1 bg-slate-100 p-1.5 rounded-lg w-full xl:w-auto overflow-x-auto no-scrollbar">
          {categories.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-5 py-2 text-xs font-semibold rounded-md transition-all shrink-0 ${
                  isActive
                    ? 'bg-white text-ink border border-slate-200 shadow-sm'
                    : 'text-slate-500 hover:text-ink hover:bg-slate-50 border border-transparent'
                }`}
              >
                <Icon size={14} className={isActive ? tab.color : 'text-slate-400'} /> {tab.id}
              </button>
            );
          })}
        </div>
      </div>

      {filteredCommittees.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 text-center bg-white border border-slate-200 rounded-xl min-h-80">
          <div
            className={`w-16 h-16 rounded-xl flex items-center justify-center mb-4 border ${activeCategoryStyle?.bg} ${activeCategoryStyle?.border} ${activeCategoryStyle?.color}`}
          >
            {activeCategoryStyle && <activeCategoryStyle.icon size={24} />}
          </div>
          <h3 className="text-base font-semibold text-ink">Tiada Jawatankuasa Direkodkan</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mb-6">
            Belum ada jawatankuasa untuk kategori <strong>{activeTab}</strong>. Jana daripada templat, import dokumen sedia ada, atau bina manual.
          </p>

          <div className="flex flex-wrap justify-center items-center gap-3">
            <button
              onClick={() => setIsImportModalOpen(true)}
              className="px-5 py-2.5 text-xs font-bold text-white bg-ink rounded-lg hover:opacity-90 transition-opacity flex items-center gap-2"
            >
              <FileUp size={14} /> Import Dokumen (.docx / .pdf)
            </button>
            <button
              onClick={() => setIsBulkModalOpen(true)}
              className="px-5 py-2.5 text-xs font-bold text-ink bg-slate-100 border border-slate-200 rounded-lg hover:bg-slate-200 transition-colors flex items-center gap-2"
            >
              <Sparkles size={14} /> Jana Pukal (Templat)
            </button>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="px-5 py-2.5 text-xs font-bold text-ink bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-2"
            >
              <Plus size={14} /> Tambah Manual
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-6">
          {filteredCommittees.map((committee) => (
            <div
              key={committee.id}
              className="p-5 lg:p-6 bg-white rounded-xl border border-slate-200 flex flex-col group hover:border-slate-300 transition-colors"
            >
              <div className="flex items-start justify-between mb-4">
                <div
                  className={`w-10 h-10 rounded-lg ${activeCategoryStyle?.bg} ${activeCategoryStyle?.border} border flex items-center justify-center ${activeCategoryStyle?.color}`}
                >
                  {activeCategoryStyle && <activeCategoryStyle.icon size={18} strokeWidth={2} />}
                </div>
                <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[10px] font-bold border border-slate-200 bg-slate-50 uppercase tracking-wide">
                  {committee.status === 'Lengkap' ? (
                    <>
                      <CheckCircle2 size={12} className="text-forest" />{' '}
                      <span className="text-slate-700">Aktif</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle size={12} className="text-rose" />{' '}
                      <span className="text-slate-700">Kosong</span>
                    </>
                  )}
                </div>
              </div>

              <div className="flex items-start justify-between gap-3 mb-5">
                <h3 className="text-base font-semibold text-ink leading-tight">{committee.name}</h3>
                {committee.description && (
                  <div
                    title={committee.description}
                    className="text-slate-400 hover:text-slate-600 cursor-help shrink-0 mt-0.5 transition-colors"
                  >
                    <Info size={16} />
                  </div>
                )}
              </div>

              <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 space-y-3 mb-5 mt-auto">
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    {committee.leadLabel}
                  </span>
                  <span className="text-sm font-medium text-ink mt-0.5">{committee.pengerusi}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    {committee.secLabel}
                  </span>
                  <span
                    className={`text-sm font-medium mt-0.5 ${
                      committee.setiausaha.includes('Kekosongan') ? 'text-rose' : 'text-ink'
                    }`}
                  >
                    {committee.setiausaha}
                  </span>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-lg font-bold text-ink leading-none">{committee.membersCount}</span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase mt-1">Ahli</span>
                </div>
                <button
                  onClick={() => handleNavigateToWorkspace(committee.id)}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-ink bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
                >
                  Urus <ArrowRight size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {schoolId && (
        <CreateCommitteeModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          schoolId={schoolId}
          defaultCategory={activeTab}
          onSuccess={fetchCommittees}
        />
      )}

      {schoolId && (
        <BulkCommitteeSetupModal
          isOpen={isBulkModalOpen}
          onClose={() => setIsBulkModalOpen(false)}
          schoolId={schoolId}
          existingCommittees={committeesList}
          onSuccess={fetchCommittees}
        />
      )}

      {schoolId && (
        <DocumentImportModal
          isOpen={isImportModalOpen}
          onClose={() => setIsImportModalOpen(false)}
          schoolId={schoolId}
          defaultCategory={activeTab}
          existingCommittees={committeesList}
          onSuccess={fetchCommittees}
        />
      )}

      <AutoAssignReviewModal
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        teachers={reviewTeachers}
        committees={reviewCommittees}
        existingAssignments={reviewExistingAssignments}
        academicSession={academicSession}
        config={ruleConfig}
        weights={workloadWeights}
        onConfirmSave={handleConfirmAutoAssignments}
      />
    </div>
  );
}