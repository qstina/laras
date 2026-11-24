import { useEffect, useState } from 'react';
import {
  X,
  Upload,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Plus,
  Trash2,
  ChevronRight,
  Users,
  Search,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import {
  commitConfirmedImportDrafts,
  extractCommitteesFromDocument,
  type ExtractedCommitteeDraft,
  type ExtractedSlot,
  type StaffLookupRecord,
} from '../lib/documentExtractor';

interface DocumentImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  schoolId: string;
  defaultCategory: string;
  existingCommittees: Array<{ id: string; name: string }>;
  onSuccess: () => void;
}

const CATEGORIES = [
  'Pentadbiran',
  'Kurikulum',
  'Hal Ehwal Murid',
  'Kokurikulum',
  'Tingkatan 6',
  'PPKI',
];

export default function DocumentImportModal({
  isOpen,
  onClose,
  schoolId,
  defaultCategory,
  existingCommittees,
  onSuccess,
}: DocumentImportModalProps) {
  const [step, setStep] = useState<'upload' | 'review'>('upload');
  const [targetCategory, setTargetCategory] = useState(defaultCategory || 'Kurikulum');
  const [academicSession, setAcademicSession] = useState('2026/2027');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [staffList, setStaffList] = useState<StaffLookupRecord[]>([]);
  const [drafts, setDrafts] = useState<ExtractedCommitteeDraft[]>([]);
  const [activeDraftIndex, setActiveDraftIndex] = useState<number>(0);
  const [activeDetailTab, setActiveDetailTab] = useState<'members' | 'tugas'>('members');
  const [filterMode, setFilterMode] = useState<'all' | 'attention'>('all');

  useEffect(() => {
    if (isOpen && schoolId) {
      setStep('upload');
      setTargetCategory(defaultCategory || 'Kurikulum');
      setSelectedFile(null);
      setDrafts([]);
      setActiveDraftIndex(0);
      setErrorMessage(null);
      loadStaffAndSession();
    }
  }, [isOpen, schoolId, defaultCategory]);

  async function loadStaffAndSession() {
    const [{ data: staffData }, { data: profile }] = await Promise.all([
      supabase
        .from('staff')
        .select('id, name, jawatan, gred, department')
        .eq('school_id', schoolId)
        .neq('status', 'Tidak Aktif')
        .order('name'),
      supabase
        .from('school_profile')
        .select('current_session')
        .eq('school_id', schoolId)
        .single(),
    ]);

    if (staffData) setStaffList(staffData);
    if (profile?.current_session) setAcademicSession(profile.current_session);
  }

  const handleExtract = async () => {
    if (!selectedFile) return;
    setIsExtracting(true);
    setErrorMessage(null);

    try {
      const extracted = await extractCommitteesFromDocument({
        file: selectedFile,
        targetCategory,
        staffList,
        existingCommittees,
      });
      setDrafts(extracted);
      setActiveDraftIndex(0);
      setActiveDetailTab('members');
      setStep('review');
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal mengekstrak kandungan dokumen.');
    } finally {
      setIsExtracting(false);
    }
  };

  const updateDraft = (index: number, patch: Partial<ExtractedCommitteeDraft>) => {
    setDrafts((prev) =>
      prev.map((d, i) => (i === index ? { ...d, ...patch } : d))
    );
  };

  const updateSlot = (draftIdx: number, slotIdx: number, patch: Partial<ExtractedSlot>) => {
    setDrafts((prev) =>
      prev.map((d, i) => {
        if (i !== draftIdx) return d;
        const updatedSlots = d.slots.map((s, si) => (si === slotIdx ? { ...s, ...patch } : s));
        return { ...d, slots: updatedSlots };
      })
    );
  };

  const handleAddSlot = (draftIdx: number) => {
    setDrafts((prev) =>
      prev.map((d, i) => {
        if (i !== draftIdx) return d;
        const newSlot: ExtractedSlot = {
          slot_no: d.slots.length + 1,
          role: 'Ahli Jawatankuasa',
          raw_member_text: '',
          assignment_type: 'vacant',
          matched_staff_id: null,
          matched_staff_name: null,
          match_confidence: 'high',
          candidate_suggestions: [],
          collective_rule: null,
          position_duties: null,
          weightage: 2,
          slot_warning: null,
        };
        return { ...d, slots: [...d.slots, newSlot] };
      })
    );
  };

  const handleRemoveSlot = (draftIdx: number, slotIdx: number) => {
    setDrafts((prev) =>
      prev.map((d, i) => {
        if (i !== draftIdx) return d;
        const filtered = d.slots
          .filter((_, si) => si !== slotIdx)
          .map((s, idx) => ({ ...s, slot_no: idx + 1 }));
        return { ...d, slots: filtered };
      })
    );
  };

  const handleConfirmImport = async () => {
    const selectedCount = drafts.filter((d) => d.selected_for_import).length;
    if (selectedCount === 0) {
      alert('Sila pilih sekurang-kurangnya satu jawatankuasa untuk diimport.');
      return;
    }

    setIsImporting(true);
    try {
      const summary = await commitConfirmedImportDrafts({
        drafts,
        schoolId,
        academicSession,
      });
      alert(
        `Berjaya mengimport ${summary.importedCommittees} jawatankuasa dan ${summary.importedAssignments} lantikan ahli ke dalam sistem.`
      );
      onSuccess();
      onClose();
    } catch (err: any) {
      alert('Ralat semasa mengimport jawatankuasa: ' + err.message);
    } finally {
      setIsImporting(false);
    }
  };

  if (!isOpen) return null;

  const activeDraft = drafts[activeDraftIndex] || null;
  const selectedCommitteesCount = drafts.filter((d) => d.selected_for_import).length;
  const attentionCount = drafts.filter((d) => d.confidence_level !== 'high').length;

  const visibleDraftIndices = drafts
    .map((d, idx) => ({ d, idx }))
    .filter(({ d }) => (filterMode === 'attention' ? d.confidence_level !== 'high' : true));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 p-4 backdrop-blur-[2px]">
      <div className="flex max-h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-6 py-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-ink">
              <FileText size={18} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-ink">
                Import Dokumen Jawatankuasa & Bidang Tugas
              </h3>
              <p className="text-[11px] text-slate-500">
                {step === 'upload'
                  ? 'Muat naik fail Word (.docx) atau PDF sedia ada untuk pengekstrakan automatik.'
                  : `Semakan & Pengesahan (${selectedCommitteesCount}/${drafts.length} jawatankuasa dipilih untuk import)`}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200 hover:text-ink transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* STEP 1: UPLOAD */}
        {step === 'upload' && (
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Kategori Pengurusan Sasaran
                </label>
                <select
                  value={targetCategory}
                  onChange={(e) => setTargetCategory(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-xs font-semibold text-ink outline-none focus:border-ink/40"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Sesi Akademik
                </label>
                <input
                  type="text"
                  value={academicSession}
                  onChange={(e) => setAcademicSession(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-xs font-semibold text-ink outline-none focus:border-ink/40"
                />
              </div>
            </div>

            <div className="rounded-xl border-2 border-dashed border-slate-300 bg-slate-50/70 p-8 text-center">
              <input
                id="jk-doc-upload"
                type="file"
                accept=".docx,.pdf"
                onChange={(e) => {
                  const f = e.target.files?.[0] || null;
                  setSelectedFile(f);
                  setErrorMessage(null);
                }}
                className="hidden"
              />
              <label
                htmlFor="jk-doc-upload"
                className="mx-auto flex max-w-md cursor-pointer flex-col items-center"
              >
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl border border-slate-200 bg-white text-ink shadow-xs">
                  <Upload size={20} />
                </div>
                <span className="text-sm font-semibold text-ink">
                  {selectedFile ? selectedFile.name : 'Klik untuk pilih fail Jawatankuasa (.docx / .pdf)'}
                </span>
                <span className="mt-1 text-xs text-slate-500">
                  Menyokong struktur jadual Bil / Nama Ahli / Jawatan, Perincian Bidang Tugas (4P), dan Sasaran Kerja Tahunan.
                </span>
              </label>
            </div>

            {errorMessage && (
              <div className="flex items-start gap-2.5 rounded-xl border border-rose/30 bg-rose/5 p-4 text-xs text-rose">
                <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                <div>{errorMessage}</div>
              </div>
            )}

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-600 space-y-1.5">
              <p className="font-semibold text-ink">Bagaimana proses import berfungsi:</p>
              <ul className="list-disc pl-4 space-y-1 text-[11px]">
                <li>Sistem mengekstrak setiap unit/jawatankuasa, senarai posisi, ahli, Bidang Tugas, dan SKT.</li>
                <li>Nama ahli dipadankan secara automatik dengan rekod <strong>Warga Sekolah ({staffList.length} staf aktif)</strong>.</li>
                <li>Tiada data dimasukkan ke pangkalan data sehingga anda menyemak dan mengesahkan senarai di langkah seterusnya.</li>
              </ul>
            </div>
          </div>
        )}

        {/* STEP 2: REVIEW & CONFIRM */}
        {step === 'review' && (
          <div className="flex flex-1 overflow-hidden">
            {/* Left Sidebar: Extracted Committees List */}
            <div className="flex w-80 shrink-0 flex-col border-r border-slate-200 bg-slate-50/70">
              <div className="border-b border-slate-200 p-3 space-y-2">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-bold uppercase tracking-wider text-slate-500">
                    Dikesan ({drafts.length})
                  </span>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => setFilterMode('all')}
                      className={`rounded px-2 py-0.5 font-semibold ${
                        filterMode === 'all' ? 'bg-ink text-white' : 'bg-white text-slate-600 border border-slate-200'
                      }`}
                    >
                      Semua
                    </button>
                    <button
                      type="button"
                      onClick={() => setFilterMode('attention')}
                      className={`rounded px-2 py-0.5 font-semibold ${
                        filterMode === 'attention'
                          ? 'bg-amber-600 text-white'
                          : 'bg-white text-amber-800 border border-amber-200'
                      }`}
                    >
                      Semak ({attentionCount})
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
                {visibleDraftIndices.map(({ d, idx }) => {
                  const isActive = idx === activeDraftIndex;
                  return (
                    <div
                      key={d.temp_id}
                      onClick={() => setActiveDraftIndex(idx)}
                      className={`cursor-pointer rounded-lg border p-2.5 transition ${
                        isActive
                          ? 'border-ink bg-white shadow-xs'
                          : 'border-slate-200/80 bg-white/60 hover:bg-white'
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <input
                          type="checkbox"
                          checked={d.selected_for_import}
                          onChange={(e) => {
                            e.stopPropagation();
                            updateDraft(idx, { selected_for_import: e.target.checked });
                          }}
                          className="mt-1 rounded border-slate-300 text-ink"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-[10px] font-bold text-slate-400">
                              {d.unit_code ? `${d.unit_code} • ` : ''}
                              {d.slots.length} slot
                            </span>
                            {d.confidence_level === 'high' ? (
                              <CheckCircle2 size={13} className="text-forest shrink-0" />
                            ) : (
                              <AlertTriangle size={13} className="text-amber-600 shrink-0" />
                            )}
                          </div>
                          <p className="mt-0.5 text-xs font-semibold text-ink line-clamp-2 leading-snug">
                            {d.committee_name}
                          </p>
                          {d.review_flags.length > 0 && (
                            <p className="mt-1 text-[10px] text-amber-800 line-clamp-1">
                              {d.review_flags[0]}
                            </p>
                          )}
                        </div>
                        <ChevronRight size={14} className="mt-1 text-slate-300 shrink-0" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right Pane: Active Committee Editor */}
            {activeDraft ? (
              <div className="flex-1 overflow-y-auto p-6 space-y-5">
                {/* Alert Banner if Review Flags Exist */}
                {activeDraft.review_flags.length > 0 && (
                  <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-3.5 text-xs text-amber-900">
                    <div className="flex items-center gap-2 font-semibold">
                      <AlertTriangle size={15} className="text-amber-600" />
                      Perkara Perlu Disemak Sebelum Import:
                    </div>
                    <ul className="mt-1 list-disc pl-5 space-y-0.5 text-[11px]">
                      {activeDraft.review_flags.map((flag, i) => (
                        <li key={i}>{flag}</li>
                      ))}
                    </ul>
                    {activeDraft.existing_committee_id && (
                      <div className="mt-2 flex items-center gap-3 pt-2 border-t border-amber-200/70">
                        <span className="font-semibold">Tindakan untuk jawatankuasa sedia ada:</span>
                        <select
                          value={activeDraft.resolution_action}
                          onChange={(e) =>
                            updateDraft(activeDraftIndex, {
                              resolution_action: e.target.value as 'create' | 'merge_update',
                            })
                          }
                          className="rounded border border-amber-300 bg-white px-2 py-1 text-[11px] font-semibold text-ink"
                        >
                          <option value="merge_update">Kemas kini rekod sedia ada</option>
                          <option value="create">Cipta sebagai rekod baharu berasingan</option>
                        </select>
                      </div>
                    )}
                  </div>
                )}

                {/* Committee Name & Category */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div className="sm:col-span-2 space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Nama Jawatankuasa / Unit
                    </label>
                    <input
                      type="text"
                      value={activeDraft.committee_name}
                      onChange={(e) =>
                        updateDraft(activeDraftIndex, { committee_name: e.target.value })
                      }
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-ink outline-none focus:border-ink/40"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Kategori
                    </label>
                    <select
                      value={activeDraft.category}
                      onChange={(e) =>
                        updateDraft(activeDraftIndex, { category: e.target.value })
                      }
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-ink outline-none focus:border-ink/40"
                    >
                      {CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Sub-tabs: Members vs Bidang Tugas & SKT */}
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setActiveDetailTab('members')}
                      className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                        activeDetailTab === 'members'
                          ? 'bg-ink text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      <Users size={14} /> Ahli & Posisi ({activeDraft.slots.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveDetailTab('tugas')}
                      className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                        activeDetailTab === 'tugas'
                          ? 'bg-ink text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      <FileText size={14} /> Perincian Bidang Tugas & SKT
                    </button>
                  </div>

                  {activeDetailTab === 'members' && (
                    <button
                      type="button"
                      onClick={() => handleAddSlot(activeDraftIndex)}
                      className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-ink hover:bg-slate-50"
                    >
                      <Plus size={13} /> Tambah Slot
                    </button>
                  )}
                </div>

                {activeDetailTab === 'members' ? (
                  <div className="overflow-x-auto rounded-xl border border-slate-200">
                    <table className="w-full text-left text-xs">
                      <thead className="border-b border-slate-200 bg-slate-50 text-[10px] font-bold uppercase text-slate-500">
                        <tr>
                          <th className="px-3 py-2.5 w-10">#</th>
                          <th className="px-3 py-2.5">Jawatan / Posisi</th>
                          <th className="px-3 py-2.5">Teks Asal Dokumen</th>
                          <th className="px-3 py-2.5">Padanan Warga Sekolah</th>
                          <th className="px-3 py-2.5 w-20">Wajaran</th>
                          <th className="px-3 py-2.5 w-10"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {activeDraft.slots.map((slot, sIdx) => (
                          <tr key={sIdx} className="align-top hover:bg-slate-50/70">
                            <td className="px-3 py-2.5 font-semibold text-slate-400">
                              {slot.slot_no}
                            </td>
                            <td className="px-3 py-2.5">
                              <input
                                type="text"
                                value={slot.role}
                                onChange={(e) =>
                                  updateSlot(activeDraftIndex, sIdx, { role: e.target.value })
                                }
                                className="w-full rounded border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-ink"
                              />
                            </td>
                            <td className="px-3 py-2.5">
                              <div className="text-xs text-slate-700">
                                {slot.raw_member_text || <span className="italic text-slate-400">(Kosong)</span>}
                              </div>
                              {slot.collective_rule && (
                                <span className="mt-1 inline-block rounded bg-sky/10 px-2 py-0.5 text-[10px] font-semibold text-sky">
                                  Kumpulan / Ex-Officio
                                </span>
                              )}
                            </td>
                            <td className="px-3 py-2.5 space-y-1">
                              {slot.assignment_type === 'collective_rule' ? (
                                <div className="rounded-md border border-sky/20 bg-sky/5 px-2.5 py-1.5 text-[11px] font-medium text-sky">
                                  Keahlian Kolektif: {slot.collective_rule}
                                </div>
                              ) : (
                                <>
                                  <div className="relative">
                                    <Search
                                      size={12}
                                      className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"
                                    />
                                    <select
                                      value={slot.matched_staff_id || ''}
                                      onChange={(e) => {
                                        const chosenId = e.target.value || null;
                                        const chosenStaff = staffList.find((st) => st.id === chosenId);
                                        updateSlot(activeDraftIndex, sIdx, {
                                          assignment_type: chosenId ? 'individual' : 'vacant',
                                          matched_staff_id: chosenId,
                                          matched_staff_name: chosenStaff?.name || null,
                                          match_confidence: 'high',
                                          slot_warning: null,
                                        });
                                      }}
                                      className={`w-full rounded border pl-7 pr-2 py-1.5 text-xs font-medium ${
                                        slot.matched_staff_id
                                          ? 'border-slate-200 bg-white text-ink'
                                          : 'border-amber-300 bg-amber-50/50 text-amber-900'
                                      }`}
                                    >
                                      <option value="">-- Biarkan Kosong (Isi Kemudian) --</option>
                                      {slot.candidate_suggestions.length > 0 && (
                                        <optgroup label="Cadangan Padanan Terdekat">
                                          {slot.candidate_suggestions.map((cand) => (
                                            <option key={`sug-${cand.id}`} value={cand.id}>
                                              {cand.name} ({Math.round(cand.score * 100)}%)
                                            </option>
                                          ))}
                                        </optgroup>
                                      )}
                                      <optgroup label="Semua Warga Sekolah">
                                        {staffList.map((st) => (
                                          <option key={st.id} value={st.id}>
                                            {st.name} {st.jawatan ? `(${st.jawatan})` : ''}
                                          </option>
                                        ))}
                                      </optgroup>
                                    </select>
                                  </div>
                                  {slot.slot_warning && (
                                    <p className="text-[10px] text-amber-700">{slot.slot_warning}</p>
                                  )}
                                </>
                              )}
                            </td>
                            <td className="px-3 py-2.5">
                              <input
                                type="number"
                                min={0}
                                max={100}
                                value={slot.weightage}
                                onChange={(e) =>
                                  updateSlot(activeDraftIndex, sIdx, {
                                    weightage: Number(e.target.value),
                                  })
                                }
                                className="w-16 rounded border border-slate-200 bg-white px-2 py-1.5 text-xs text-ink"
                              />
                            </td>
                            <td className="px-3 py-2.5 text-right">
                              <button
                                type="button"
                                onClick={() => handleRemoveSlot(activeDraftIndex, sIdx)}
                                className="rounded p-1 text-slate-400 hover:bg-rose/10 hover:text-rose"
                                title="Buang slot"
                              >
                                <Trash2 size={14} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Perincian Bidang Tugas
                      </label>
                      <textarea
                        rows={7}
                        value={activeDraft.senarai_tugas_verbatim}
                        onChange={(e) =>
                          updateDraft(activeDraftIndex, {
                            senarai_tugas_verbatim: e.target.value,
                          })
                        }
                        placeholder="Perancangan, Pelaksanaan, Pemantauan, Pelaporan..."
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3.5 text-xs leading-relaxed text-ink outline-none focus:border-ink/40 focus:bg-white"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Sasaran Kerja Tahunan (SKT)
                      </label>
                      <textarea
                        rows={4}
                        value={activeDraft.sasaran_kerja_verbatim}
                        onChange={(e) =>
                          updateDraft(activeDraftIndex, {
                            sasaran_kerja_verbatim: e.target.value,
                          })
                        }
                        placeholder="Sasaran kerja tahunan yang boleh diukur..."
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3.5 text-xs leading-relaxed text-ink outline-none focus:border-ink/40 focus:bg-white"
                      />
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-1 items-center justify-center text-xs text-slate-400">
                Tiada jawatankuasa dipilih.
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-6 py-4 shrink-0">
          {step === 'upload' ? (
            <>
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={!selectedFile || isExtracting}
                onClick={handleExtract}
                className="flex items-center gap-2 rounded-lg bg-ink px-5 py-2 text-xs font-bold text-white hover:opacity-90 disabled:opacity-50"
              >
                {isExtracting ? <Loader2 size={14} className="animate-spin" /> : <FileText size={14} />}
                {isExtracting ? 'Mengekstrak Dokumen...' : 'Ekstrak & Semak Dokumen'}
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setStep('upload')}
                className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100"
              >
                Muat Naik Fail Lain
              </button>
              <button
                type="button"
                disabled={isImporting || selectedCommitteesCount === 0}
                onClick={handleConfirmImport}
                className="flex items-center gap-2 rounded-lg bg-forest px-5 py-2 text-xs font-bold text-white hover:opacity-90 disabled:opacity-50"
              >
                {isImporting ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                {isImporting
                  ? 'Mengimport...'
                  : `Sahkan & Import ${selectedCommitteesCount} Jawatankuasa`}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}