import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  Loader2,
  AlertTriangle,
  X,
  CheckCircle2,
  Save,
  Edit3,
  Settings2,
  ArrowRight,
  Trash2,
  AlertCircle,
  Search,
  PieChart,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import {
  generateAutoAssignPreview,
  getSchoolWorkloadSettings,
  DEFAULT_WORKLOAD_SETTINGS,
} from '../lib/autoAssignEngine';
import {
  computeWorkloadAnalytics,
  type StaffWorkloadItem,
  type StaffCommitteeRecord,
} from '../utils/workloadAnalytics';

export default function WorkloadManager() {
  const [statusFilter, setStatusFilter] = useState<'Semua' | 'Tinggi' | 'Seimbang' | 'Rendah'>('Semua');
  const [typeFilter, setTypeFilter] = useState<'Semua' | 'Guru' | 'Sokongan'>('Semua');
  const [searchQuery, setSearchQuery] = useState('');

  const [rawStaffList, setRawStaffList] = useState<any[]>([]);
  const [committeesList, setCommitteesList] = useState<any[]>([]);
  const [baseWorkloads, setBaseWorkloads] = useState<Record<string, number>>({});
  const [workloadSettings, setWorkloadSettings] = useState(DEFAULT_WORKLOAD_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);
  const [schoolId, setSchoolId] = useState<string | null>(null);

  // Auto-assign preview state
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSavingProposals, setIsSavingProposals] = useState(false);
  const [proposals, setProposals] = useState<any[] | null>(null);

  // Settings drawer state
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [editSettings, setEditSettings] = useState(DEFAULT_WORKLOAD_SETTINGS);
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  // Teacher details & reassign modal state
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState<StaffWorkloadItem | null>(null);
  const [teacherCommittees, setTeacherCommittees] = useState<StaffCommitteeRecord[]>([]);
  const [editingAssignmentId, setEditingAssignmentId] = useState<string | null>(null);

  async function calculateWorkloads() {
    setIsLoading(true);
    const {
      data: { session },
    } = await supabase.auth.getSession();
    let currentSchoolId: string | null = null;

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

    const currentSettings = await getSchoolWorkloadSettings(currentSchoolId);
    setWorkloadSettings(currentSettings);
    setEditSettings(currentSettings);

    const [{ data: staff, error: staffErr }, { data: committees }] = await Promise.all([
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
        .eq('school_id', currentSchoolId),
    ]);

    if (!staffErr && staff) {
      setRawStaffList(staff);
      setCommitteesList(committees || []);

      const bw: Record<string, number> = {};
      staff.forEach((s: any) => {
        let pts = 0;
        s.staff_committees?.forEach((sc: any) => (pts += Number(sc.workload_weightage) || 0));
        bw[s.id] = pts;
      });
      setBaseWorkloads(bw);
    }
    setIsLoading(false);
  }

  useEffect(() => {
    calculateWorkloads();
  }, []);

  // Derive analytics & dynamic major Jawatankuasa columns from single source of truth
  const analytics = useMemo(
    () =>
      computeWorkloadAnalytics({
        staffList: rawStaffList,
        committeesList,
        referencePoints: workloadSettings.reference_points,
        selectedStaffType: typeFilter,
      }),
    [rawStaffList, committeesList, workloadSettings.reference_points, typeFilter]
  );

  const majorCategories = analytics.majorCategories;

  const filteredData = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return analytics.staffItems.filter((item) => {
      if (statusFilter !== 'Semua' && item.status !== statusFilter) return false;
      if (!q) return true;
      const inName = item.name.toLowerCase().includes(q);
      const inJawatan = item.jawatan.toLowerCase().includes(q);
      const inRole = item.assignments.some(
        (a) =>
          a.role.toLowerCase().includes(q) ||
          (a.committees?.name || '').toLowerCase().includes(q)
      );
      return inName || inJawatan || inRole;
    });
  }, [analytics.staffItems, statusFilter, searchQuery]);

  // --- AUTO ASSIGN LOGIC ---
  const handleGeneratePreview = async () => {
    if (!schoolId) return;
    setIsGenerating(true);
    try {
      const result = await generateAutoAssignPreview(schoolId);
      const editableRows = result.proposals
        .filter((p) => p.status === 'assigned' && !p.isLocked && p.selectedCandidate)
        .map((p) => ({
          proposalId: p.proposalId,
          staff_id: p.selectedCandidate!.staffId,
          staff_name: p.selectedCandidate!.staffName,
          staff_jawatan: p.selectedCandidate!.jawatan,
          committee_id: p.committeeId,
          committee_name: p.committeeName,
          committee_category: p.category,
          role: p.role,
          workload_weightage: p.weightage,
          is_manual_override: false,
          reason: p.selectedCandidate!.reasons.slice(0, 2).join(' • '),
        }));
      setProposals(editableRows);
    } catch (err: any) {
      alert('Peringatan Sistem:\n\n' + err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleStaffSwap = (proposalIndex: number, newStaffId: string) => {
    if (!proposals) return;
    const newStaff = rawStaffList.find((s) => s.id === newStaffId);
    if (!newStaff) return;

    const targetProposal = proposals[proposalIndex];
    const existsInDb = newStaff.staff_committees?.some(
      (sc: any) => sc.committee_id === targetProposal.committee_id
    );
    const existsInProposals = proposals.some(
      (p, i) =>
        i !== proposalIndex &&
        p.committee_id === targetProposal.committee_id &&
        p.staff_id === newStaffId
    );

    if (existsInDb || existsInProposals) {
      alert('Ralat Pertindihan: Warga ini sudah menganggotai jawatankuasa ini.');
      return;
    }

    const updatedProposals = [...proposals];
    updatedProposals[proposalIndex] = {
      ...targetProposal,
      staff_id: newStaff.id,
      staff_name: newStaff.name,
      staff_jawatan: newStaff.jawatan ? `${newStaff.jawatan} (${newStaff.gred || '-'})` : '-',
      is_manual_override: true,
      reason: 'Disunting secara manual oleh Pentadbir',
    };

    setProposals(updatedProposals);
  };

  const getDynamicProjectedLoad = (staffId: string) => {
    const basePts = baseWorkloads[staffId] || 0;
    const proposedPts =
      proposals
        ?.filter((p) => p.staff_id === staffId)
        .reduce((sum, p) => sum + p.workload_weightage, 0) || 0;
    return Math.round(((basePts + proposedPts) / workloadSettings.reference_points) * 100);
  };

  const handleApplyProposals = async () => {
    if (!proposals || !schoolId) return;
    setIsSavingProposals(true);
    try {
      const rowsToInsert = proposals.map((p) => ({
        staff_id: p.staff_id,
        committee_id: p.committee_id,
        school_id: schoolId,
        role: p.role,
        workload_weightage: p.workload_weightage,
        academic_session: '2026/2027',
        is_auto_assigned: !p.is_manual_override,
      }));
      const { error } = await supabase.from('staff_committees').insert(rowsToInsert);
      if (error) throw error;
      setProposals(null);
      calculateWorkloads();
    } catch (err: any) {
      alert('Gagal menyimpan agihan: ' + err.message);
    } finally {
      setIsSavingProposals(false);
    }
  };

  // --- SETTINGS LOGIC ---
  const saveSettings = async () => {
    setIsSavingSettings(true);
    const { error } = await supabase
      .from('school_profile')
      .update({ workload_settings: editSettings })
      .eq('school_id', schoolId);
    setIsSavingSettings(false);

    if (!error) {
      setIsSettingsOpen(false);
      calculateWorkloads();
    } else {
      alert('Gagal menyimpan tetapan: ' + error.message);
    }
  };

  // --- DETAILS & REASSIGN LOGIC ---
  const openDetails = (teacher: StaffWorkloadItem) => {
    setSelectedTeacher(teacher);
    setTeacherCommittees(teacher.assignments || []);
    setEditingAssignmentId(null);
    setDetailsModalOpen(true);
  };

  const handleReassign = async (assignmentId: string, newStaffId: string, newRole: string) => {
    const isExOfficio = ['PENGETUA', 'PK_PENTADBIRAN', 'PK_HEM', 'PK_KOKO'].includes(
      rawStaffList.find((s) => s.id === newStaffId)?.jawatan?.toUpperCase() || ''
    );
    let newWeight = (workloadSettings.weights as Record<string, number>)[newRole] || 5;
    if (isExOfficio && newRole === 'Pengerusi')
      newWeight = workloadSettings.weights['EX_OFFICIO_PENGERUSI'] || 2;
    if (isExOfficio && newRole === 'Timbalan Pengerusi')
      newWeight = workloadSettings.weights['EX_OFFICIO_TIMBALAN'] || 3;

    const { error } = await supabase
      .from('staff_committees')
      .update({ staff_id: newStaffId, role: newRole, workload_weightage: newWeight })
      .eq('id', assignmentId);

    if (error) {
      alert('Gagal mengemas kini tugasan: ' + error.message);
    } else {
      setEditingAssignmentId(null);
      calculateWorkloads();

      const updatedList = teacherCommittees.filter((c) => c.id !== assignmentId);
      if (selectedTeacher && newStaffId === selectedTeacher.id) {
        const commToUpdate = teacherCommittees.find((c) => c.id === assignmentId);
        if (commToUpdate)
          updatedList.push({ ...commToUpdate, role: newRole, workload_weightage: newWeight });
      }
      setTeacherCommittees(updatedList);

      if (selectedTeacher) {
        const newPoints = updatedList.reduce((sum, c) => sum + (c.workload_weightage || 0), 0);
        setSelectedTeacher({
          ...selectedTeacher,
          points: newPoints,
          percentage: Math.round((newPoints / workloadSettings.reference_points) * 100),
        });
      }
    }
  };

  const handleRemoveAssignment = async (assignmentId: string) => {
    if (!window.confirm('Pasti mahu membuang tugasan ini?')) return;
    const { error } = await supabase.from('staff_committees').delete().eq('id', assignmentId);
    if (!error) {
      const updatedList = teacherCommittees.filter((c) => c.id !== assignmentId);
      setTeacherCommittees(updatedList);
      calculateWorkloads();

      if (selectedTeacher) {
        const newPoints = updatedList.reduce((sum, c) => sum + (c.workload_weightage || 0), 0);
        setSelectedTeacher({
          ...selectedTeacher,
          points: newPoints,
          percentage: Math.round((newPoints / workloadSettings.reference_points) * 100),
        });
      }
    }
  };

  if (isLoading) {
    return <div className="p-8 text-center text-slate-500 text-xs">Mengira taburan beban tugas...</div>;
  }

  return (
    <div className="max-w-384 mx-auto space-y-4 lg:space-y-6 relative">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 px-1">
        <div>
          <h2 className="text-2xl sm:text-3xl font-semibold text-ink tracking-tight">
            Pengurus Beban Tugas
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Semak pecahan peranan mengikut Jawatankuasa utama, selaraskan pemberatan, dan kawal keseimbangan guru.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <Link
            to="/analytics"
            className="bg-white border border-slate-200 text-ink hover:bg-slate-50 rounded-lg font-medium h-9 px-4 text-xs flex items-center gap-1.5 transition-colors"
          >
            <PieChart size={14} /> Analisis & Eksport PPTX
          </Link>
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="bg-white border border-slate-200 text-slate-600 hover:text-ink hover:bg-slate-50 rounded-lg font-medium h-9 px-4 text-xs flex items-center gap-1.5 transition-colors"
          >
            <Settings2 size={14} /> Tetapan Beban
          </button>
          <button
            onClick={handleGeneratePreview}
            disabled={isGenerating}
            className="bg-ink hover:opacity-90 text-white rounded-lg font-medium h-9 px-4 text-xs flex items-center gap-1.5 transition-all disabled:opacity-50"
          >
            {isGenerating ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
            Jana Agihan Automatik
          </button>
        </div>
      </div>

      {/* Compact Decision-Support Summary Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-[11px] font-semibold text-slate-500">Purata Beban Guru</p>
          <div className="flex items-baseline justify-between mt-1.5">
            <p className="text-2xl font-bold text-ink">{analytics.kpis.avgWorkloadPctGuru}%</p>
            <span className="text-[11px] text-slate-400">
              Julat {analytics.kpis.minGuruPct}%–{analytics.kpis.maxGuruPct}%
            </span>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-[11px] font-semibold text-slate-500">Taburan Status Warga</p>
          <div className="flex items-center gap-2 mt-2 text-xs font-semibold">
            <span className="px-2 py-0.5 rounded bg-rose/10 text-rose border border-rose/20">
              Tinggi: {analytics.kpis.highCount}
            </span>
            <span className="px-2 py-0.5 rounded bg-forest/10 text-forest border border-forest/20">
              Seimbang: {analytics.kpis.balancedCount}
            </span>
            <span className="px-2 py-0.5 rounded bg-sky/10 text-sky border border-sky/20">
              Rendah: {analytics.kpis.lowCount}
            </span>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-[11px] font-semibold text-slate-500">Pemberatan Tertinggi</p>
          {analytics.highestTeachers[0] ? (
            <div className="mt-1.5">
              <p className="text-xs font-bold text-ink truncate">
                {analytics.highestTeachers[0].name}
              </p>
              <p className="text-[11px] text-rose font-semibold mt-0.5">
                {analytics.highestTeachers[0].points} mata ({analytics.highestTeachers[0].percentage}%)
              </p>
            </div>
          ) : (
            <p className="text-xs text-slate-400 mt-2">Tiada data</p>
          )}
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-[11px] font-semibold text-slate-500">Pemberatan Terendah (Guru)</p>
          {analytics.lowestTeachers[0] ? (
            <div className="mt-1.5">
              <p className="text-xs font-bold text-ink truncate">
                {analytics.lowestTeachers[0].name}
              </p>
              <p className="text-[11px] text-sky font-semibold mt-0.5">
                {analytics.lowestTeachers[0].points} mata ({analytics.lowestTeachers[0].percentage}%)
              </p>
            </div>
          ) : (
            <p className="text-xs text-slate-400 mt-2">Tiada data</p>
          )}
        </div>
      </div>

      {/* 1. AUTO ASSIGN INTERACTIVE PREVIEW MODAL */}
      {proposals && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-[2px]">
          <div className="bg-white rounded-xl border border-slate-200 w-full max-w-6xl overflow-hidden flex flex-col max-h-[90vh] shadow-2xl">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-ink/10 text-ink flex items-center justify-center border border-ink/20">
                  <Sparkles size={16} />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-ink">Semakan & Suntingan Agihan</h3>
                  <p className="text-[11px] text-slate-500">
                    {proposals.length} cadangan dijana. Anda boleh menukar guru sebelum pengesahan.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setProposals(null)}
                className="p-1.5 text-slate-400 hover:text-ink hover:bg-slate-200 rounded-lg transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-auto bg-slate-50 p-5">
              {proposals.length === 0 ? (
                <div className="text-center py-12 text-slate-500">
                  <CheckCircle2 size={48} className="mx-auto mb-3 text-slate-300" />
                  <p className="text-sm font-medium">Tiada tugasan baharu dijana.</p>
                  <p className="text-xs mt-1">Semua jawatan sudah diisi atau tiada padanan baharu.</p>
                </div>
              ) : (
                <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left table-fixed">
                    <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-400 uppercase tracking-wider sticky top-0 z-10 shadow-sm">
                      <tr>
                        <th className="px-4 py-3 w-1/4">Pilih Warga Pendidik</th>
                        <th className="px-4 py-3 w-1/4">Jawatankuasa (Penempatan)</th>
                        <th className="px-4 py-3 w-1/6">Peranan</th>
                        <th className="px-4 py-3 w-1/4 hidden md:table-cell">Asas Pertimbangan</th>
                        <th className="px-4 py-3 w-24 text-right">Beban (%)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs">
                      {proposals.map((p, idx) => {
                        const currentDynamicLoad = getDynamicProjectedLoad(p.staff_id);
                        return (
                          <tr
                            key={idx}
                            className={`hover:bg-slate-50 transition-colors ${
                              p.is_manual_override ? 'bg-sky/5' : ''
                            }`}
                          >
                            <td className="px-4 py-3">
                              <div className="relative">
                                <select
                                  value={p.staff_id}
                                  onChange={(e) => handleStaffSwap(idx, e.target.value)}
                                  className={`w-full appearance-none border rounded-lg pl-3 pr-8 py-2 outline-none transition-colors cursor-pointer text-xs font-semibold text-ellipsis overflow-hidden whitespace-nowrap
                                    ${
                                      p.is_manual_override
                                        ? 'border-sky/30 bg-white text-sky-800'
                                        : 'border-slate-200 bg-white text-ink hover:border-slate-300'
                                    }
                                  `}
                                >
                                  {rawStaffList.map((s) => (
                                    <option key={s.id} value={s.id}>
                                      {s.name} ({s.jawatan || '-'})
                                    </option>
                                  ))}
                                </select>
                                <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none text-slate-400">
                                  <Edit3 size={12} />
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <p className="font-medium text-slate-700 truncate">{p.committee_name}</p>
                              <p className="text-[10px] text-slate-400 mt-0.5 truncate">
                                {p.committee_category}
                              </p>
                            </td>
                            <td className="px-4 py-3">
                              <span className="px-2 py-1 bg-slate-100 border border-slate-200 rounded-md font-medium text-slate-700 truncate block">
                                {p.role}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-slate-500 hidden md:table-cell text-[11px] leading-tight pr-4">
                              {p.reason}
                            </td>
                            <td className="px-4 py-3 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                {currentDynamicLoad > 100 && (
                                  <span title="Beban Tinggi">
                                    <AlertTriangle size={12} className="text-rose" />
                                  </span>
                                )}
                                <span
                                  className={`font-bold ${
                                    currentDynamicLoad > 100 ? 'text-rose' : 'text-ink'
                                  }`}
                                >
                                  {currentDynamicLoad}%
                                </span>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="px-5 py-4 border-t border-slate-100 bg-white flex items-center justify-between shrink-0">
              <p className="text-[11px] text-slate-500 flex items-center gap-1.5">
                <AlertCircle size={14} /> Tugas manual sedia ada dilindungi dan tidak akan dipadamkan.
              </p>
              <div className="flex items-center gap-2.5">
                <button
                  onClick={() => setProposals(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors"
                >
                  Batal
                </button>
                <button
                  onClick={handleApplyProposals}
                  disabled={isSavingProposals || proposals.length === 0}
                  className="flex items-center gap-1.5 px-5 py-2.5 text-xs font-bold text-white bg-ink rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {isSavingProposals ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Save size={14} />
                  )}
                  Sah & Simpan {proposals.length > 0 ? `(${proposals.length})` : ''}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. SETTINGS MODAL */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div
            className="absolute inset-0 bg-ink/40 backdrop-blur-[2px]"
            onClick={() => setIsSettingsOpen(false)}
          />
          <div className="relative w-full max-w-sm h-full bg-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
            <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-semibold text-ink">Tetapan Formula Beban</h3>
              <button
                onClick={() => setIsSettingsOpen(false)}
                className="p-1 text-slate-400 hover:text-ink"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-5 flex-1 overflow-y-auto space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-600 uppercase">
                  Mata Rujukan 100%
                </label>
                <input
                  type="number"
                  value={editSettings.reference_points}
                  onChange={(e) =>
                    setEditSettings({ ...editSettings, reference_points: Number(e.target.value) })
                  }
                  className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-ink/20"
                />
                <p className="text-[10px] text-slate-400 leading-tight">
                  Berapa mata yang dianggap sebagai beban tugas penuh (100%) bagi seorang guru di sekolah anda.
                </p>
              </div>
              <div className="space-y-3">
                <label className="text-xs font-bold text-slate-600 uppercase">
                  Pemberatan Mengikut Jawatan (Mata)
                </label>
                {(Object.keys(editSettings.weights) as Array<keyof typeof editSettings.weights>).map(
                  (key) => (
                    <div key={key} className="flex items-center justify-between gap-3">
                      <span className="text-xs text-slate-600">{String(key).replace(/_/g, ' ')}</span>
                      <input
                        type="number"
                        value={editSettings.weights[key]}
                        onChange={(e) =>
                          setEditSettings({
                            ...editSettings,
                            weights: { ...editSettings.weights, [key]: Number(e.target.value) },
                          })
                        }
                        className="w-16 p-1.5 text-center bg-slate-50 border border-slate-200 rounded-md text-xs outline-none focus:border-ink"
                      />
                    </div>
                  )
                )}
              </div>
            </div>
            <div className="p-5 border-t border-slate-100 bg-slate-50 flex gap-2">
              <button
                onClick={() => setIsSettingsOpen(false)}
                className="flex-1 py-2 text-xs font-bold text-slate-600 bg-white border border-slate-200 rounded-lg"
              >
                Batal
              </button>
              <button
                onClick={saveSettings}
                disabled={isSavingSettings}
                className="flex-1 py-2 text-xs font-bold text-white bg-ink rounded-lg flex justify-center items-center gap-2"
              >
                {isSavingSettings ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}{' '}
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. DETAILS & REASSIGN MODAL */}
      {detailsModalOpen && selectedTeacher && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-[2px]">
          <div className="bg-white rounded-xl border border-slate-200 w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh] shadow-xl">
            <div className="p-5 border-b border-slate-100 flex justify-between items-start bg-slate-50">
              <div>
                <h3 className="text-lg font-semibold text-ink">{selectedTeacher.name}</h3>
                <p className="text-xs text-slate-500 mt-1">
                  {selectedTeacher.jawatan} ({selectedTeacher.gred}) •{' '}
                  {selectedTeacher.department || 'Tiada Opsyen'}
                </p>
              </div>
              <button
                onClick={() => setDetailsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:bg-slate-200 rounded-md"
              >
                <X size={18} />
              </button>
            </div>

            <div className="px-5 py-3 bg-white border-b border-slate-100 flex gap-6">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase">Jumlah Beban</p>
                <p
                  className={`text-xl font-bold ${
                    selectedTeacher.percentage > 100 ? 'text-rose' : 'text-ink'
                  }`}
                >
                  {selectedTeacher.percentage}%
                </p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase">Jumlah Mata</p>
                <p className="text-xl font-semibold text-slate-700">
                  {selectedTeacher.points}{' '}
                  <span className="text-sm font-normal text-slate-400">
                    / {workloadSettings.reference_points}
                  </span>
                </p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase">
                  Tugasan Jawatankuasa
                </p>
                <p className="text-xl font-semibold text-slate-700">{teacherCommittees.length}</p>
              </div>
            </div>

            <div className="p-5 overflow-y-auto flex-1 bg-slate-50">
              {teacherCommittees.length === 0 ? (
                <p className="text-center text-slate-400 text-sm py-8">
                  Tiada tugasan jawatankuasa untuk guru ini.
                </p>
              ) : (
                <div className="space-y-3">
                  {teacherCommittees.map((tc) => (
                    <div
                      key={tc.id}
                      className="bg-white border border-slate-200 rounded-lg p-4 flex flex-col md:flex-row md:items-center justify-between gap-4"
                    >
                      {editingAssignmentId === tc.id ? (
                        <div className="w-full flex flex-col md:flex-row gap-3">
                          <div className="flex-1 space-y-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase">
                              Pilih Warga Pengganti
                            </label>
                            <select
                              id={`staff-${tc.id}`}
                              defaultValue={selectedTeacher.id}
                              className="w-full p-2 text-xs border border-slate-200 rounded-md outline-none focus:border-ink"
                            >
                              {rawStaffList.map((rs) => (
                                <option key={rs.id} value={rs.id}>
                                  {rs.name} ({rs.department || '-'})
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="flex-1 space-y-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase">
                              Peranan
                            </label>
                            <select
                              id={`role-${tc.id}`}
                              defaultValue={tc.role}
                              className="w-full p-2 text-xs border border-slate-200 rounded-md outline-none focus:border-ink"
                            >
                              {Object.keys(workloadSettings.weights)
                                .filter((k) => !k.includes('EX_OFFICIO'))
                                .map((role) => (
                                  <option key={role} value={role}>
                                    {role}
                                  </option>
                                ))}
                            </select>
                          </div>
                          <div className="flex items-end gap-2 shrink-0">
                            <button
                              onClick={() => setEditingAssignmentId(null)}
                              className="px-3 py-2 text-xs font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 rounded-md"
                            >
                              Batal
                            </button>
                            <button
                              onClick={() => {
                                const newStaff = (
                                  document.getElementById(`staff-${tc.id}`) as HTMLSelectElement
                                ).value;
                                const newRole = (
                                  document.getElementById(`role-${tc.id}`) as HTMLSelectElement
                                ).value;
                                handleReassign(tc.id, newStaff, newRole);
                              }}
                              className="px-3 py-2 text-xs font-bold text-white bg-ink hover:opacity-90 rounded-md flex items-center gap-1"
                            >
                              <Save size={14} /> Simpan
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="min-w-0">
                            <h4 className="text-sm font-semibold text-ink truncate">
                              {tc.committees?.name}
                            </h4>
                            <p className="text-[10px] text-slate-500 mt-0.5">
                              {tc.committees?.category}
                            </p>
                          </div>
                          <div className="flex items-center gap-4 shrink-0">
                            <span className="px-2.5 py-1 bg-slate-100 border border-slate-200 text-xs font-medium text-slate-700 rounded-md">
                              {tc.role} ({tc.workload_weightage} mata)
                            </span>
                            <div className="flex items-center gap-1 border-l border-slate-100 pl-4">
                              <button
                                onClick={() => setEditingAssignmentId(tc.id)}
                                className="p-1.5 text-slate-400 hover:text-ink bg-white border border-slate-200 rounded hover:bg-slate-50"
                                title="Edit Tugasan"
                              >
                                <Edit3 size={14} />
                              </button>
                              <button
                                onClick={() => handleRemoveAssignment(tc.id)}
                                className="p-1.5 text-rose/50 hover:text-rose bg-white border border-slate-200 rounded hover:bg-rose/5"
                                title="Buang Tugasan"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 4. MAIN WORKLOAD TABLE WITH DYNAMIC MAJOR JAWATANKUASA COLUMNS */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {/* Filter & Search Toolbar */}
        <div className="p-3 border-b border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-slate-50">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 bg-slate-200/60 p-1 rounded-lg">
              {(['Semua', 'Tinggi', 'Seimbang', 'Rendah'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setStatusFilter(tab)}
                  className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                    statusFilter === tab
                      ? 'bg-white text-ink shadow-sm'
                      : 'text-slate-500 hover:text-ink'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1 bg-slate-200/60 p-1 rounded-lg">
              {(['Semua', 'Guru', 'Sokongan'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTypeFilter(t)}
                  className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                    typeFilter === t
                      ? 'bg-white text-ink shadow-sm'
                      : 'text-slate-500 hover:text-ink'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="relative w-full lg:w-72">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama, peranan atau jawatankuasa..."
              className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs outline-none focus:border-ink/40"
            />
          </div>
        </div>

        {/* Horizontal Scrollable Matrix Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase bg-slate-50 tracking-wider">
                <th className="sticky left-0 z-20 bg-slate-50 px-3 py-3 w-12 text-center border-r border-slate-100">
                  Bil.
                </th>
                <th className="sticky left-12 z-20 bg-slate-50 px-4 py-3 min-w-60 max-w-64 border-r border-slate-200">
                  Nama & Jawatan
                </th>
                {majorCategories.map((category) => (
                  <th
                    key={category}
                    className="px-3.5 py-3 min-w-44 max-w-56 border-r border-slate-100 leading-snug"
                  >
                    {category}
                  </th>
                ))}
                <th className="px-3.5 py-3 text-center whitespace-nowrap min-w-28 border-r border-slate-100">
                  Mata Semasa
                </th>
                <th className="px-3.5 py-3 text-center whitespace-nowrap min-w-24 border-r border-slate-100">
                  Beban (%)
                </th>
                <th className="px-4 py-3 text-right whitespace-nowrap min-w-32">Tindakan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredData.length === 0 ? (
                <tr>
                  <td
                    colSpan={majorCategories.length + 5}
                    className="px-6 py-10 text-center text-slate-400"
                  >
                    Tiada rekod warga sepadan dengan tapisan semasa.
                  </td>
                </tr>
              ) : (
                filteredData.map((row, idx) => (
                  <tr key={row.id} className="group hover:bg-slate-50 transition-colors align-top">
                    {/* Sticky Bil. */}
                    <td className="sticky left-0 z-10 bg-white group-hover:bg-slate-50 px-3 py-3 text-center text-slate-400 font-semibold border-r border-slate-100">
                      {idx + 1}
                    </td>

                    {/* Sticky Nama & Jawatan */}
                    <td className="sticky left-12 z-10 bg-white group-hover:bg-slate-50 px-4 py-3 min-w-60 max-w-64 border-r border-slate-200">
                      <p className="font-semibold text-ink leading-snug">{row.name}</p>
                      <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                        {row.jawatan} ({row.gred})
                      </p>
                    </td>

                    {/* Dynamic Major Jawatankuasa Columns */}
                    {majorCategories.map((category) => {
                      const categoryAssignments = row.assignments.filter(
                        (a) => ((a.committees?.category || '').trim() || 'Lain-lain') === category
                      );

                      return (
                        <td
                          key={category}
                          className="px-3.5 py-3 min-w-44 max-w-56 border-r border-slate-100"
                        >
                          {categoryAssignments.length === 0 ? (
                            <span className="text-slate-300 select-none">–</span>
                          ) : (
                            <div className="space-y-1.5">
                              {categoryAssignments.map((assign) => {
                                const lowerRole = assign.role.toLowerCase();
                                const isChairOrCoord =
                                  lowerRole.includes('pengerusi') ||
                                  lowerRole.includes('setiausaha') ||
                                  lowerRole.includes('penyelaras') ||
                                  lowerRole.includes('ketua');

                                return (
                                  <div
                                    key={assign.id}
                                    className="leading-tight"
                                    title={`${assign.role} — ${assign.committees?.name || ''} (${assign.workload_weightage} mata)`}
                                  >
                                    <span
                                      className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                                        isChairOrCoord
                                          ? 'bg-ink/8 text-ink border border-ink/15'
                                          : 'bg-slate-100 text-slate-700 border border-slate-200/80'
                                      }`}
                                    >
                                      {assign.role}
                                    </span>
                                    {assign.committees?.name && (
                                      <p className="text-[10px] text-slate-500 mt-0.5 line-clamp-1">
                                        {assign.committees.name}
                                      </p>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </td>
                      );
                    })}

                    {/* Mata Semasa */}
                    <td className="px-3.5 py-3 text-center font-medium text-slate-600 whitespace-nowrap border-r border-slate-100">
                      {row.points} / {workloadSettings.reference_points}
                    </td>

                    {/* Beban (%) */}
                    <td className="px-3.5 py-3 text-center whitespace-nowrap border-r border-slate-100">
                      <span
                        className={`px-2.5 py-1 border font-bold rounded-md inline-block text-[11px] ${
                          row.percentage > 100
                            ? 'bg-rose/10 text-rose border-rose/20'
                            : row.percentage < 50
                            ? 'bg-sky/10 text-sky border-sky/20'
                            : 'bg-forest/10 text-forest border-forest/20'
                        }`}
                      >
                        {row.percentage}%
                      </span>
                    </td>

                    {/* Tindakan */}
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <button
                        onClick={() => openDetails(row)}
                        className="px-3 py-1.5 text-xs font-semibold text-ink bg-slate-100 border border-slate-200 rounded hover:bg-slate-200 transition-colors inline-flex items-center gap-1.5"
                      >
                        Lihat Butiran <ArrowRight size={12} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}