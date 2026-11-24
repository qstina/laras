import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { 
  AlertCircle, CheckCircle2, ChevronLeft,
  Settings, Copy, FileText, Network, BookOpen, 
  Plus, MoreHorizontal, QrCode, Loader2, Edit3, Save, Trash2, Sparkles
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import AssignStaffModal from '../components/AssignStaffModal';
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

export default function CommitteeWorkspace() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const committeeId = searchParams.get('id');

  const [activeTab, setActiveTab] = useState('struktur');
  const [committee, setCommittee] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Edit Header State
  const [isEditingHeader, setIsEditingHeader] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [isSavingHeader, setIsSavingHeader] = useState(false);

  // Edit Tugas & KPI State
  const [isEditingTugas, setIsEditingTugas] = useState(false);
  const [editSenaraiTugas, setEditSenaraiTugas] = useState('');
  const [editSasaranKerja, setEditSasaranKerja] = useState('');
  const [isSavingTugas, setIsSavingTugas] = useState(false);

  // Action Menu State
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

  // Assignment Modal State
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [assignRolePreset, setAssignRolePreset] = useState<string | undefined>(undefined);
  const [editMemberData, setEditMemberData] = useState<any>(null);

  // Single-Committee Auto-Assign State
  const [isAutoAssignOpen, setIsAutoAssignOpen] = useState(false);
  const [isPreparingAutoAssign, setIsPreparingAutoAssign] = useState(false);
  const [autoTeachers, setAutoTeachers] = useState<TeacherProfile[]>([]);
  const [autoAllAssignments, setAutoAllAssignments] = useState<ExistingAssignment[]>([]);
  const [academicSession, setAcademicSession] = useState('2026/2027');
  const [ruleConfig, setRuleConfig] = useState<AssignmentRuleConfig>(DEFAULT_ASSIGNMENT_CONFIG);
  const [workloadWeights, setWorkloadWeights] = useState<Record<string, number>>(
    DEFAULT_WORKLOAD_SETTINGS.weights
  );

  // Structural Sync & Deletion State
  const [isSyncing, setIsSyncing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const tabs = [
    { id: 'overview', name: 'Overview', icon: Settings },
    { id: 'struktur', name: 'Struktur & Ahli', icon: Network },
    { id: 'tugas', name: 'Tugas & KPI', icon: FileText },
    { id: 'dokumen', name: 'Dokumen & QR', icon: QrCode },
    { id: 'preview', name: 'Book Preview', icon: BookOpen },
  ];

  async function fetchCommitteeData() {
    setIsLoading(true);
    let targetId = committeeId;
    
    if (!targetId) {
      const { data: firstCom } = await supabase.from('committees').select('id').limit(1).single();
      if (firstCom) targetId = firstCom.id;
      else { setIsLoading(false); return; }
    }

    const { data, error } = await supabase
      .from('committees')
      .select(`
        *,
        staff_committees (
          id, role, workload_weightage, kpi_notes,
          staff ( id, name, jawatan, gred, department, avatar_url )
        )
      `)
      .eq('id', targetId)
      .single();

    if (!error && data) {
      setCommittee(data);
      setMembers(data.staff_committees || []);
      setEditName(data.name || '');
      setEditDesc(data.description || '');
      setEditSenaraiTugas(data.senarai_tugas || '');
      setEditSasaranKerja(data.sasaran_kerja || '');
    } else {
      console.error("Error fetching workspace:", error);
    }
    setIsLoading(false);
  }

  useEffect(() => {
    fetchCommitteeData();
  }, [committeeId]);

  useEffect(() => {
    const handleClickOutside = () => setOpenDropdownId(null);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const handleOpenCommitteeAutoAssign = async () => {
    if (!committee?.school_id) return;
    setIsPreparingAutoAssign(true);
    try {
      const [
        { data: staffData },
        { data: allAssignData },
        { data: schoolProfile },
      ] = await Promise.all([
        supabase
          .from('staff')
          .select('*')
          .eq('school_id', committee.school_id)
          .neq('status', 'Tidak Aktif'),
        supabase
          .from('staff_committees')
          .select('*')
          .eq('school_id', committee.school_id),
        supabase
          .from('school_profile')
          .select('current_session, workload_settings')
          .eq('school_id', committee.school_id)
          .single(),
      ]);

      const settings = schoolProfile?.workload_settings
        ? { ...DEFAULT_WORKLOAD_SETTINGS, ...schoolProfile.workload_settings }
        : DEFAULT_WORKLOAD_SETTINGS;

      setAutoTeachers((staffData || []) as TeacherProfile[]);
      setAutoAllAssignments((allAssignData || []) as ExistingAssignment[]);
      setAcademicSession(schoolProfile?.current_session || '2026/2027');
      setWorkloadWeights(settings.weights || DEFAULT_WORKLOAD_SETTINGS.weights);
      setRuleConfig({
        ...DEFAULT_ASSIGNMENT_CONFIG,
        referencePoints: settings.reference_points || 40,
      });
      setIsAutoAssignOpen(true);
    } finally {
      setIsPreparingAutoAssign(false);
    }
  };

  const handleConfirmCommitteeAutoAssign = async (
    approvedRows: ApprovedAssignmentRow[],
    mode: AutoAssignMode
  ) => {
    if (!committee?.id || !committee?.school_id) return;

    if (mode === 'regenerate_all') {
      await supabase
        .from('staff_committees')
        .delete()
        .eq('committee_id', committee.id);

      if (approvedRows.length > 0) {
        const { error } = await supabase.from('staff_committees').insert(
          approvedRows.map((r) => ({
            staff_id: r.staff_id,
            committee_id: committee.id,
            school_id: committee.school_id,
            role: r.role,
            workload_weightage: r.workload_weightage,
            academic_session: r.academic_session,
            is_auto_assigned: r.is_auto_assigned,
          }))
        );
        if (error) throw error;
      }
    } else {
      const newRows = approvedRows.filter((r) => !r.is_locked);
      if (newRows.length > 0) {
        const { error } = await supabase.from('staff_committees').insert(
          newRows.map((r) => ({
            staff_id: r.staff_id,
            committee_id: committee.id,
            school_id: committee.school_id,
            role: r.role,
            workload_weightage: r.workload_weightage,
            academic_session: r.academic_session,
            is_auto_assigned: true,
          }))
        );
        if (error) throw error;
      }
    }

    await fetchCommitteeData();
  };

  const saveHeader = async () => {
    if (!editName.trim()) return;
    setIsSavingHeader(true);
    const { error } = await supabase
      .from('committees')
      .update({ name: editName, description: editDesc })
      .eq('id', committee.id);

    setIsSavingHeader(false);
    if (!error) {
      setCommittee({ ...committee, name: editName, description: editDesc });
      setIsEditingHeader(false);
    } else {
      alert("Gagal mengemas kini maklumat jawatankuasa: " + error.message);
    }
  };

  const saveTugasDanKPI = async () => {
    setIsSavingTugas(true);
    const { error } = await supabase
      .from('committees')
      .update({ senarai_tugas: editSenaraiTugas, sasaran_kerja: editSasaranKerja })
      .eq('id', committee.id);

    setIsSavingTugas(false);
    if (!error) {
      setCommittee({ ...committee, senarai_tugas: editSenaraiTugas, sasaran_kerja: editSasaranKerja });
      setIsEditingTugas(false);
    } else {
      alert("Gagal mengemas kini tugas dan KPI: " + error.message);
    }
  };

  const handleSimpanStruktur = async () => {
    setIsSyncing(true);
    if (isEditingHeader) await saveHeader();
    if (isEditingTugas) await saveTugasDanKPI();
    await fetchCommitteeData();
    setIsSyncing(false);
    alert('Struktur, tugas, dan ahli telah disegerakkan sepenuhnya.');
  };

  const handleDeleteMember = async (memberId: string) => {
    if (!window.confirm('Adakah anda pasti mahu membuang ahli ini dari jawatankuasa?')) return;
    
    const { error } = await supabase.from('staff_committees').delete().eq('id', memberId);
    if (!error) {
      fetchCommitteeData();
    } else {
      alert('Gagal membuang ahli: ' + error.message);
    }
  };

  const handleDeleteCommittee = async () => {
    const confirmDelete = window.confirm(
      `Adakah anda pasti mahu membuang jawatankuasa "${committee.name}"?\n\nTindakan ini juga akan memadam semua struktur hierarki, ahli, tugas, dan sasaran kerja di dalamnya secara kekal. Rekod warga pendidik tidak akan terjejas.`
    );
    if (!confirmDelete) return;

    setIsDeleting(true);
    
    try {
      const { error: staffError } = await supabase
        .from('staff_committees')
        .delete()
        .eq('committee_id', committee.id);
        
      if (staffError) throw staffError;

      const { error: committeeError } = await supabase
        .from('committees')
        .delete()
        .eq('id', committee.id);
        
      if (committeeError) throw committeeError;

      navigate('/committees');
    } catch (error: any) {
      alert('Gagal membuang jawatankuasa: ' + error.message);
      setIsDeleting(false);
    }
  };

  const openAssignModal = (rolePreset?: string, editData?: any) => {
    setAssignRolePreset(rolePreset);
    setEditMemberData(editData || null);
    setIsAssignModalOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex h-[80vh] items-center justify-center text-slate-500">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-ink" />
          <p className="text-sm font-medium">Memuatkan Ruang Kerja Jawatankuasa...</p>
        </div>
      </div>
    );
  }

  if (!committee) {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh] text-slate-500 space-y-4">
        <AlertCircle size={48} className="text-slate-300" />
        <h2 className="text-lg font-semibold text-ink">Jawatankuasa Tidak Dijumpai</h2>
        <p className="text-xs text-slate-500">Sila pilih jawatankuasa dari halaman utama organisasi.</p>
        <button onClick={() => navigate('/committees')} className="px-5 py-2.5 bg-ink text-white rounded-lg text-xs font-bold hover:opacity-90 transition-all">Kembali ke Organisasi</button>
      </div>
    );
  }

  const hasLead = members.some((m) => {
    const r = m.role.toLowerCase();
    return r.includes('pengerusi') || r.includes('penasihat') || r.includes('penyelaras') || r.includes('ketua');
  });
  const isHealthy = hasLead && members.length > 0;

  const ActionDropdown = ({ member }: { member: any }) => (
    <div className="relative inline-block text-left">
      <button 
        onClick={(e) => { e.stopPropagation(); setOpenDropdownId(openDropdownId === member.id ? null : member.id); }}
        className="p-1.5 text-slate-400 hover:text-ink hover:bg-slate-100 rounded-md transition-colors"
      >
        <MoreHorizontal size={16} />
      </button>
      {openDropdownId === member.id && (
        <div className="absolute right-0 mt-1 w-36 bg-white border border-slate-200 rounded-lg shadow-[0_4px_12px_rgba(16,24,40,0.08)] py-1 z-20" onClick={e => e.stopPropagation()}>
          <button 
            onClick={() => { setOpenDropdownId(null); openAssignModal(undefined, member); }}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
          >
            <Edit3 size={14} /> Kemas Kini
          </button>
          <button 
            onClick={() => { setOpenDropdownId(null); handleDeleteMember(member.id); }}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-rose hover:bg-rose/5"
          >
            <Trash2 size={14} /> Buang Ahli
          </button>
        </div>
      )}
    </div>
  );

  return (
    <div className="max-w-384 mx-auto space-y-4 lg:space-y-6 relative">
      {/* Top Navigation & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-sm px-1">
        <button 
          onClick={() => navigate('/committees')} 
          className="flex items-center gap-2 text-slate-500 hover:text-ink transition-colors font-semibold group w-fit outline-none"
        >
          <ChevronLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
          <span className="text-sm">Kembali ke Senarai Jawatankuasa</span>
        </button>

        <div className="flex items-center gap-2 shrink-0">
          <button 
            onClick={handleDeleteCommittee}
            disabled={isDeleting || isSyncing}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose bg-white border border-rose/20 rounded-lg hover:bg-rose/5 transition-colors disabled:opacity-50"
            title="Buang Jawatankuasa"
          >
            {isDeleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
            <span className="hidden sm:inline">Buang</span>
          </button>
          <button 
            onClick={() => alert('Fungsi duplikasi sesi akan datang pada kemas kini seterusnya.')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
          >
            <Copy size={14} /> Duplikasi Sesi
          </button>
          <button 
            onClick={handleSimpanStruktur}
            disabled={isSyncing || isDeleting}
            className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-ink rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {isSyncing ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            Simpan Struktur
          </button>
        </div>
      </div>

      {/* Main Header Card */}
      <div className="bg-white p-5 lg:p-6 rounded-xl border border-slate-200 flex flex-col md:flex-row md:items-start justify-between gap-6">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-3">
            <span className="px-2 py-1 bg-sky/10 text-sky text-[10px] font-bold uppercase tracking-wide rounded-md border border-sky/20">{committee.category}</span>
            <span className="px-2 py-1 bg-forest/10 text-forest text-[10px] font-bold uppercase tracking-wide rounded-md border border-forest/20">Aktif</span>
            
            {!isEditingHeader && (
              <button onClick={() => setIsEditingHeader(true)} className="ml-2 text-slate-400 hover:text-ink p-1 rounded-md transition-colors">
                <Edit3 size={14} />
              </button>
            )}
          </div>
          
          {isEditingHeader ? (
            <div className="space-y-3 max-w-2xl">
              <input 
                type="text" 
                value={editName}
                onChange={e => setEditName(e.target.value)}
                className="w-full px-3 py-2 text-lg font-semibold text-ink border border-slate-200 rounded-lg outline-none focus:border-ink/40 focus:ring-4 focus:ring-ink/5"
              />
              <textarea 
                value={editDesc}
                onChange={e => setEditDesc(e.target.value)}
                rows={2}
                className="w-full px-3 py-2 text-xs text-slate-600 border border-slate-200 rounded-lg outline-none focus:border-ink/40 focus:ring-4 focus:ring-ink/5 resize-none"
              />
              <div className="flex items-center gap-2">
                <button onClick={saveHeader} disabled={isSavingHeader || !editName.trim()} className="px-3 py-1.5 bg-ink text-white text-xs font-semibold rounded-lg hover:opacity-90 disabled:opacity-50 flex items-center gap-1.5">
                   {isSavingHeader ? <Loader2 size={12} className="animate-spin"/> : null} Simpan Maklumat
                </button>
                <button onClick={() => setIsEditingHeader(false)} className="px-3 py-1.5 bg-white border border-slate-200 text-slate-600 text-xs font-semibold rounded-lg hover:bg-slate-50">
                   Batal
                </button>
              </div>
            </div>
          ) : (
            <>
              <h2 className="text-xl lg:text-2xl font-semibold text-ink mb-2">{committee.name}</h2>
              <p className="text-xs text-slate-500 max-w-2xl leading-relaxed whitespace-pre-wrap">
                {committee.description || "Tiada deskripsi disediakan untuk jawatankuasa ini."}
              </p>
            </>
          )}
        </div>

        {/* Dynamic Committee Health Status */}
        <div className={`${isHealthy ? 'bg-forest/10 border-forest/20' : 'bg-amber/10 border-amber/20'} border rounded-xl p-4 w-full md:w-80 shrink-0 transition-colors`}>
          <div className="flex items-center gap-2 mb-3">
            {isHealthy ? <CheckCircle2 size={16} className="text-forest" /> : <AlertCircle size={16} className="text-amber" />}
            <h3 className={`text-sm font-semibold ${isHealthy ? 'text-forest' : 'text-amber-800'}`}>
              {isHealthy ? 'Struktur Lengkap' : 'Perhatian Diperlukan'}
            </h3>
          </div>
          <ul className={`space-y-2 text-[11px] font-medium ${isHealthy ? 'text-forest/80' : 'text-amber-800/80'}`}>
            {!hasLead && (
              <li className="flex items-center justify-between">
                <span>• Ketua / Penyelaras belum ditetapkan</span>
                <button onClick={() => openAssignModal('Pengerusi')} className="underline hover:opacity-70">Tetapkan</button>
              </li>
            )}
            {isHealthy && (
              <li>• Sedia untuk dijana ke Buku Pengurusan</li>
            )}
          </ul>
        </div>
      </div>

      {/* Workspace Navigation */}
      <div className="flex items-center gap-1 bg-slate-100 p-1.5 rounded-xl overflow-x-auto no-scrollbar border border-slate-200">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-2 text-xs font-semibold rounded-lg transition-all whitespace-nowrap ${
                isActive 
                  ? 'bg-white text-ink border border-slate-200' 
                  : 'text-slate-500 hover:text-ink hover:bg-slate-50 border border-transparent'
              }`}
            >
              <Icon size={14} className={isActive ? 'text-ink' : 'text-slate-400'} />
              {tab.name}
            </button>
          );
        })}
      </div>

      {/* ================= TAB: STRUKTUR & AHLI ================= */}
      {activeTab === 'struktur' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden min-h-80">
          <div className="p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2 bg-slate-50">
            <h3 className="text-sm font-semibold text-ink">Hierarki & Keahlian ({members.length} Ahli)</h3>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={isPreparingAutoAssign}
                onClick={handleOpenCommitteeAutoAssign}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-ink bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50"
              >
                <Sparkles size={14} className="text-forest" />
                {isPreparingAutoAssign ? 'Menjana...' : 'Auto Agih Kekosongan'}
              </button>
              <button onClick={() => openAssignModal('Ahli Jawatankuasa')} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-ink rounded-lg hover:opacity-90 transition-opacity">
                <Plus size={14} /> Tambah Posisi / Ahli
              </button>
            </div>
          </div>

          <div className="overflow-x-auto pb-10">
            <table className="w-full text-left min-w-3xl">
              <thead>
                <tr className="border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase bg-slate-50/50 tracking-wider">
                  <th className="px-5 py-3 w-64">Posisi (Hierarki)</th>
                  <th className="px-5 py-3">Penyandang (Guru/Staf)</th>
                  <th className="px-5 py-3">Pemberatan Tugas</th>
                  <th className="px-5 py-3 text-right">Tindakan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(() => {
                  const defaultPositions: string[] = committee.default_positions || ['Pengerusi', 'Timbalan Pengerusi', 'Setiausaha', 'AJK'];
                  const existingRoles = members.map(m => m.role);
                  const allRoles = Array.from(new Set([...defaultPositions, ...existingRoles]));

                  return allRoles.map((role, roleIdx) => {
                    const roleMembers = members.filter(m => m.role === role);
                    const lowerRole = role.toLowerCase();
                    const isTier1 =
                      roleIdx === 0 ||
                      lowerRole.includes('pengerusi') ||
                      lowerRole.includes('penasihat') ||
                      lowerRole.includes('ydp');
                    const isAjk =
                      lowerRole === 'ajk' ||
                      lowerRole === 'ahli' ||
                      lowerRole.startsWith('ajk ') ||
                      lowerRole.includes('guru penasihat') ||
                      lowerRole.includes('juruaudit');
                    const isIndented = !isTier1;

                    if (roleMembers.length === 0) {
                      return (
                        <tr key={`empty-${role}`} className="hover:bg-slate-50 transition-colors group bg-amber/5">
                          <td className={`px-5 py-3 ${isIndented ? 'pl-10 relative' : ''}`}>
                            {isIndented && <div className="absolute left-4 top-0 bottom-1/2 w-4 border-l-2 border-b-2 border-slate-200 rounded-bl-lg"></div>}
                            <span className="text-xs font-semibold text-ink">{role}</span>
                          </td>
                          <td className="px-5 py-3">
                            <button onClick={() => openAssignModal(role)} className="px-3 py-1.5 text-[11px] font-bold text-amber bg-amber/10 border border-amber/20 border-dashed rounded-lg flex items-center gap-1.5 hover:bg-amber/20 transition-colors uppercase tracking-wide">
                              <Plus size={12} /> Tugaskan Individu
                            </button>
                          </td>
                          <td className="px-5 py-3 text-xs text-slate-500">-</td>
                          <td className="px-5 py-3 text-right"><MoreHorizontal size={16} className="text-slate-400 inline-block opacity-50 cursor-not-allowed" /></td>
                        </tr>
                      );
                    }

                    if (isAjk) {
                      return (
                        <tr key={`group-${role}`} className="hover:bg-slate-50 transition-colors group">
                          <td className="px-5 py-3 pl-10 relative align-top">
                            <div className="absolute left-4 top-0 bottom-0 w-4 border-l-2 border-slate-200"></div>
                            <div className="absolute left-4 top-6 w-4 border-b-2 border-slate-200"></div>
                            <span className="text-xs font-medium text-slate-700 mt-2 block">{role}</span>
                          </td>
                          <td className="px-5 py-3">
                            <div className="space-y-4">
                              {roleMembers.map(a => (
                                <div key={a.id} className="flex items-center gap-3 h-9">
                                  <div className="w-8 h-8 rounded-md bg-slate-100 text-slate-600 flex items-center justify-center text-[10px] font-bold border border-slate-200 shrink-0 overflow-hidden">
                                    {a.staff?.avatar_url ? <img src={a.staff.avatar_url} className="w-full h-full object-cover" /> : a.staff?.name.substring(0,2).toUpperCase()}
                                  </div>
                                  <div className="min-w-0">
                                    <p className="text-xs font-medium text-ink truncate">{a.staff?.name}</p>
                                    <p className="text-[10px] text-slate-500 mt-0.5 truncate">
                                      {a.staff?.jawatan}{a.staff?.department ? ` • ${a.staff.department}` : ''}
                                    </p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </td>
                          <td className="px-5 py-3 align-top pt-5">
                            <div className="space-y-4">
                              {roleMembers.map(a => (
                                <div key={`weight-${a.id}`} className="h-9 flex items-center">
                                  <span className="text-[11px] font-medium text-slate-700 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md">{a.workload_weightage}%</span>
                                </div>
                              ))}
                            </div>
                          </td>
                          <td className="px-5 py-3 text-right align-top pt-5">
                            <div className="space-y-4">
                              {roleMembers.map(a => (
                                <div key={`action-${a.id}`} className="h-9 flex items-center justify-end">
                                   <ActionDropdown member={a} />
                                </div>
                              ))}
                            </div>
                          </td>
                        </tr>
                      );
                    }

                    return roleMembers.map(member => (
                      <tr key={member.id} className="hover:bg-slate-50 transition-colors group">
                        <td className={`px-5 py-3 ${isIndented ? 'pl-10 relative' : ''}`}>
                          {isIndented && <div className="absolute left-4 top-0 bottom-1/2 w-4 border-l-2 border-b-2 border-slate-200 rounded-bl-lg"></div>}
                          <span className={`text-xs ${isTier1 ? 'font-semibold text-ink' : 'font-medium text-slate-700'}`}>{role}</span>
                        </td>
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-md flex items-center justify-center text-[10px] font-bold overflow-hidden shrink-0 ${isTier1 ? 'bg-sky/10 text-sky border border-sky/20' : 'bg-forest/10 text-forest border border-forest/20'}`}>
                              {member.staff?.avatar_url ? <img src={member.staff.avatar_url} className="w-full h-full object-cover" /> : member.staff?.name.substring(0,2).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-medium text-ink truncate">{member.staff?.name}</p>
                              <p className="text-[10px] text-slate-500 mt-0.5 truncate">
                                {member.staff?.jawatan}{member.staff?.department ? ` • ${member.staff.department}` : ''}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3"><span className="text-[11px] font-medium text-slate-700 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md">{member.workload_weightage}%</span></td>
                        <td className="px-5 py-3 text-right">
                          <ActionDropdown member={member} />
                        </td>
                      </tr>
                    ));
                  });
                })()}
              </tbody>
            </table>
          </div>
          
          {members.length === 0 && (
             <div className="p-10 text-center text-slate-500 text-xs">
                Tiada ahli dijumpai untuk jawatankuasa ini. Sila tambah posisi baru atau gunakan Auto Agih Kekosongan.
             </div>
          )}
        </div>
      )}

      {/* ================= TAB: TUGAS & KPI ================= */}
      {activeTab === 'tugas' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="text-sm font-semibold text-ink">Senarai Tugas & Tanggungjawab</h3>
              {!isEditingTugas && (
                <button 
                  onClick={() => setIsEditingTugas(true)} 
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  <Edit3 size={14} /> Kemas Kini Dokumen
                </button>
              )}
            </div>
            
            <div className="p-5 lg:p-6">
              {isEditingTugas ? (
                <textarea
                  value={editSenaraiTugas}
                  onChange={(e) => setEditSenaraiTugas(e.target.value)}
                  className="w-full h-48 p-4 text-sm text-ink bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-ink/40 focus:ring-4 focus:ring-ink/5 transition-all resize-none"
                  placeholder="Masukkan senarai tugas untuk jawatankuasa ini..."
                />
              ) : (
                <div className="prose prose-sm max-w-none text-slate-600 whitespace-pre-line">
                  {committee.senarai_tugas ? committee.senarai_tugas : <span className="italic text-slate-400">Tiada senarai tugas ditetapkan. Klik 'Kemas Kini Dokumen' untuk menetapkan data.</span>}
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="text-sm font-semibold text-ink">Sasaran Kerja Tahunan (SKT)</h3>
            </div>
            
            <div className="p-5 lg:p-6">
              {isEditingTugas ? (
                <textarea
                  value={editSasaranKerja}
                  onChange={(e) => setEditSasaranKerja(e.target.value)}
                  className="w-full h-48 p-4 text-sm text-ink bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-ink/40 focus:ring-4 focus:ring-ink/5 transition-all resize-none"
                  placeholder="Masukkan Sasaran Kerja Tahunan (SKT)..."
                />
              ) : (
                <div className="prose prose-sm max-w-none text-slate-600 whitespace-pre-line">
                  {committee.sasaran_kerja ? committee.sasaran_kerja : <span className="italic text-slate-400">Tiada Sasaran Kerja Tahunan ditetapkan. Klik 'Kemas Kini Dokumen' untuk menetapkan data.</span>}
                </div>
              )}
            </div>
            
            {isEditingTugas && (
              <div className="px-5 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                <button 
                  onClick={() => {
                    setIsEditingTugas(false);
                    setEditSenaraiTugas(committee.senarai_tugas || '');
                    setEditSasaranKerja(committee.sasaran_kerja || '');
                  }} 
                  className="px-4 py-2 text-xs font-bold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  Batal
                </button>
                <button 
                  onClick={saveTugasDanKPI}
                  disabled={isSavingTugas}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-ink rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {isSavingTugas ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                  Simpan Perubahan
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {(activeTab === 'overview' || activeTab === 'dokumen' || activeTab === 'preview') && (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-500 text-sm">
          Fungsi untuk tab "{tabs.find(t => t.id === activeTab)?.name}" sedang dibangunkan.
        </div>
      )}

      {committee && (
        <AssignStaffModal 
          isOpen={isAssignModalOpen}
          onClose={() => { setIsAssignModalOpen(false); setEditMemberData(null); }}
          committeeId={committee.id}
          schoolId={committee.school_id}
          initialRole={assignRolePreset}
          editData={editMemberData}
          onSuccess={fetchCommitteeData}
        />
      )}

      {committee && (
        <AutoAssignReviewModal
          isOpen={isAutoAssignOpen}
          onClose={() => setIsAutoAssignOpen(false)}
          title={`Agihan Automatik: ${committee.name}`}
          teachers={autoTeachers}
          committees={[committee as ExistingCommittee]}
          existingAssignments={autoAllAssignments}
          academicSession={academicSession}
          config={ruleConfig}
          weights={workloadWeights}
          onConfirmSave={handleConfirmCommitteeAutoAssign}
        />
      )}
    </div>
  );
}