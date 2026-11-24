import React, { useMemo, useState } from 'react';
import type {
  AssignmentRuleConfig,
  AutoAssignRunResult,
  ExistingAssignment,
  ExistingCommittee,
  TeacherProfile,
} from '../types/autoAssign';
import {
  DEFAULT_ASSIGNMENT_CONFIG,
  DEFAULT_WORKLOAD_SETTINGS,
  generateAssignmentProposals,
  type AutoAssignMode,
} from '../lib/autoAssignEngine';

export interface ApprovedAssignmentRow {
  staff_id: string;
  committee_id: string;
  role: string;
  workload_weightage: number;
  academic_session: string;
  is_locked: boolean;
  is_auto_assigned: boolean;
  slot_order: number;
  assignment_reason: string;
}

interface AutoAssignReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  teachers: TeacherProfile[];
  committees: ExistingCommittee[];
  existingAssignments: ExistingAssignment[];
  academicSession: string;
  title?: string;
  config?: AssignmentRuleConfig;
  weights?: Record<string, number>;
  onConfirmSave: (approvedRows: ApprovedAssignmentRow[], mode: AutoAssignMode) => Promise<void>;
}

export const AutoAssignReviewModal: React.FC<AutoAssignReviewModalProps> = ({
  isOpen,
  onClose,
  teachers,
  committees,
  existingAssignments,
  academicSession,
  title,
  config = DEFAULT_ASSIGNMENT_CONFIG,
  weights = DEFAULT_WORKLOAD_SETTINGS.weights,
  onConfirmSave,
}) => {
  const [lockedOverrides, setLockedOverrides] = useState<Record<string, string | null>>({});
  const [mode, setMode] = useState<AutoAssignMode>('fill_vacancies');
  const [activeTab, setActiveTab] = useState<'proposals' | 'workload'>('proposals');
  const [filterStatus, setFilterStatus] = useState<'all' | 'assigned' | 'vacant' | 'locked'>('all');
  const [isSaving, setIsSaving] = useState(false);

  const teacherMap = useMemo(() => {
    const map = new Map<string, TeacherProfile>();
    teachers.forEach((t) => map.set(t.id, t));
    return map;
  }, [teachers]);

  const result: AutoAssignRunResult = useMemo(
    () =>
      generateAssignmentProposals({
        teachers,
        committees,
        existingAssignments,
        lockedOverrides,
        mode,
        config,
        weights,
      }),
    [teachers, committees, existingAssignments, lockedOverrides, mode, config, weights]
  );

  if (!isOpen) return null;

  const filteredProposals = result.proposals.filter((p) => {
    if (filterStatus === 'assigned') return p.status === 'assigned';
    if (filterStatus === 'vacant') return p.status === 'vacant';
    if (filterStatus === 'locked') return p.isLocked;
    return true;
  });

  const handleSelectTeacher = (proposalId: string, staffId: string | null) => {
    setLockedOverrides((prev) => ({
      ...prev,
      [proposalId]: staffId,
    }));
  };

  const handleToggleLock = (
    proposalId: string,
    currentStaffId: string | null,
    currentlyLocked: boolean
  ) => {
    setLockedOverrides((prev) => {
      const next = { ...prev };
      if (currentlyLocked) {
        delete next[proposalId];
      } else {
        next[proposalId] = currentStaffId;
      }
      return next;
    });
  };

  const handleModeChange = (nextMode: AutoAssignMode) => {
    setMode(nextMode);
    setLockedOverrides({});
  };

  const handleApproveAndSave = async () => {
    setIsSaving(true);
    try {
      const approvedRows: ApprovedAssignmentRow[] = result.proposals
        .filter((p) => p.status === 'assigned' && p.selectedCandidate)
        .map((p) => ({
          staff_id: p.selectedCandidate!.staffId,
          committee_id: p.committeeId,
          role: p.role,
          workload_weightage: p.weightage,
          academic_session: academicSession,
          is_locked: p.isLocked,
          is_auto_assigned: !p.isLocked,
          slot_order: p.slotOrder,
          assignment_reason: p.selectedCandidate!.reasons.join(' | '),
        }));

      await onConfirmSave(approvedRows, mode);
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  const newlyProposedCount = result.proposals.filter(
    (p) => p.status === 'assigned' && !p.isLocked
  ).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/50 p-4 backdrop-blur-xs">
      <div className="flex max-h-[90vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-stone-200 bg-[#FAF9F6] shadow-2xl">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-stone-200 bg-white px-6 py-4">
          <div>
            <h2 className="text-lg font-bold text-stone-900">
              {title || `Semakan Cadangan Agihan Jawatankuasa (${academicSession})`}
            </h2>
            <p className="text-xs text-stone-500">
              Padanan pintar berasaskan Jawatan Hakiki, Gred, Opsyen Dominan & keseimbangan beban tugas.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex rounded-lg border border-stone-200 bg-stone-100 p-0.5">
              <button
                type="button"
                onClick={() => handleModeChange('fill_vacancies')}
                className={`rounded-md px-2.5 py-1 text-xs font-semibold transition ${
                  mode === 'fill_vacancies'
                    ? 'bg-white text-stone-900 shadow-xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                Isi Kekosongan Sahaja
              </button>
              <button
                type="button"
                onClick={() => handleModeChange('regenerate_all')}
                className={`rounded-md px-2.5 py-1 text-xs font-semibold transition ${
                  mode === 'regenerate_all'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                Jana Semula Semua
              </button>
            </div>

            <button
              type="button"
              onClick={() => setActiveTab('proposals')}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                activeTab === 'proposals'
                  ? 'bg-emerald-900 text-white'
                  : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
              }`}
            >
              Cadangan Slot ({result.stats.assignedCount}/{result.stats.totalSlots})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('workload')}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                activeTab === 'workload'
                  ? 'bg-emerald-900 text-white'
                  : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
              }`}
            >
              Perbandingan Beban Tugas
            </button>
          </div>
        </div>

        {/* Summary KPI Bar */}
        <div className="grid grid-cols-2 gap-3 border-b border-stone-200 bg-stone-50/80 px-6 py-3 sm:grid-cols-5">
          <div className="rounded-lg border border-stone-200 bg-white px-3 py-2">
            <div className="text-[11px] text-stone-500">Jumlah Slot</div>
            <div className="text-base font-bold text-stone-900">{result.stats.totalSlots}</div>
          </div>
          <div className="rounded-lg border border-emerald-200 bg-emerald-50/60 px-3 py-2">
            <div className="text-[11px] text-emerald-800">Cadangan Baharu</div>
            <div className="text-base font-bold text-emerald-900">{newlyProposedCount}</div>
          </div>
          <div className="rounded-lg border border-amber-200 bg-amber-50/60 px-3 py-2">
            <div className="text-[11px] text-amber-800">Sedia Ada / Dikunci</div>
            <div className="text-base font-bold text-amber-900">{result.stats.lockedPreservedCount}</div>
          </div>
          <div className="rounded-lg border border-rose-200 bg-rose-50/60 px-3 py-2">
            <div className="text-[11px] text-rose-800">Kekal Kosong</div>
            <div className="text-base font-bold text-rose-900">{result.stats.vacantCount}</div>
          </div>
          <div className="rounded-lg border border-stone-200 bg-white px-3 py-2">
            <div className="text-[11px] text-stone-500">Purata / Maks Beban</div>
            <div className="text-base font-bold text-stone-900">
              {result.stats.averageWorkloadPctAfter}% / {result.stats.maxWorkloadPctAfter}%
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {activeTab === 'proposals' ? (
            <div className="space-y-4">
              {/* Filter Pills */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex gap-1.5">
                  {(['all', 'assigned', 'vacant', 'locked'] as const).map((status) => (
                    <button
                      key={status}
                      type="button"
                      onClick={() => setFilterStatus(status)}
                      className={`rounded-full px-3 py-1 text-xs font-medium ${
                        filterStatus === status
                          ? 'bg-emerald-900 text-white'
                          : 'border border-stone-200 bg-white text-stone-600 hover:bg-stone-100'
                      }`}
                    >
                      {status === 'all' && 'Semua'}
                      {status === 'assigned' && 'Diisi'}
                      {status === 'vacant' && 'Kosong / Tiada Calon'}
                      {status === 'locked' && 'Sedia Ada / Dikunci'}
                    </button>
                  ))}
                </div>
                {mode === 'regenerate_all' && (
                  <span className="rounded-md bg-amber-100 px-2.5 py-1 text-[11px] font-medium text-amber-900">
                    Mod Jana Semula Aktif: Lantikan sedia ada yang tidak dikunci akan diganti.
                  </span>
                )}
              </div>

              {/* Proposal Cards */}
              {filteredProposals.map((p) => {
                const candidateTeacher = p.selectedCandidate
                  ? teacherMap.get(p.selectedCandidate.staffId)
                  : undefined;

                return (
                  <div
                    key={p.proposalId}
                    className={`rounded-xl border p-4 transition ${
                      p.status === 'vacant'
                        ? 'border-rose-200 bg-rose-50/30'
                        : p.isLocked
                          ? 'border-amber-300 bg-amber-50/20'
                          : 'border-stone-200 bg-white'
                    }`}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs font-semibold uppercase tracking-wide text-emerald-800">
                            {p.committeeName}
                          </span>
                          {p.parentCommitteeName && (
                            <span className="rounded bg-stone-100 px-2 py-0.5 text-[11px] text-stone-600">
                              Induk: {p.parentCommitteeName}
                            </span>
                          )}
                          <span className="rounded bg-stone-100 px-2 py-0.5 text-[11px] font-medium text-stone-700">
                            Wajaran: {p.weightage} mata
                          </span>
                        </div>
                        <h3 className="mt-1 text-sm font-bold text-stone-900">{p.role}</h3>
                        {candidateTeacher && (
                          <p className="mt-0.5 text-[11px] text-stone-500">
                            {candidateTeacher.jawatan}
                            {candidateTeacher.gred ? ` • Gred ${candidateTeacher.gred}` : ''}
                            {candidateTeacher.department ? ` • Opsyen: ${candidateTeacher.department}` : ''}
                          </p>
                        )}
                      </div>

                      {/* Teacher Selector & Lock Control */}
                      <div className="flex flex-wrap items-center gap-2">
                        <select
                          value={p.selectedCandidate?.staffId || ''}
                          onChange={(e) =>
                            handleSelectTeacher(p.proposalId, e.target.value ? e.target.value : null)
                          }
                          className="max-w-xs rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-xs font-medium text-stone-800"
                        >
                          <option value="">-- Biarkan Kosong --</option>
                          {p.selectedCandidate && (
                            <option value={p.selectedCandidate.staffId}>
                              {p.selectedCandidate.staffName} (Skor: {p.selectedCandidate.score.totalScore})
                            </option>
                          )}
                          {p.alternatives.map((alt) => (
                            <option key={alt.staffId} value={alt.staffId}>
                              Alternatif: {alt.staffName} (Skor: {alt.score.totalScore} | Beban: {alt.projectedWorkloadPct}%)
                            </option>
                          ))}
                          <optgroup label="Semua Warga Sekolah Aktif">
                            {teachers.map((t) => (
                              <option key={t.id} value={t.id}>
                                {t.name} ({t.jawatan}{t.department ? ` - ${t.department}` : ''})
                              </option>
                            ))}
                          </optgroup>
                        </select>

                        <button
                          type="button"
                          onClick={() =>
                            handleToggleLock(
                              p.proposalId,
                              p.selectedCandidate?.staffId || null,
                              p.isLocked
                            )
                          }
                          className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold ${
                            p.isLocked
                              ? 'bg-amber-600 text-white'
                              : 'border border-stone-300 bg-white text-stone-700 hover:bg-stone-100'
                          }`}
                        >
                          {p.isLocked ? 'Dikunci' : 'Kunci'}
                        </button>
                      </div>
                    </div>

                    {/* Explanation Panel */}
                    {p.selectedCandidate ? (
                      <div className="mt-3 rounded-lg border border-stone-100 bg-stone-50 p-3 text-xs">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="font-semibold text-stone-800">
                            Sebab Pemilihan (Skor Kesesuaian: {p.selectedCandidate.score.totalScore}/100)
                          </span>
                          <span className="text-stone-500">
                            Jawatan/Gred: +{p.selectedCandidate.score.leadershipScore} | Opsyen/Kepakaran: +
                            {p.selectedCandidate.score.expertiseScore} | Beban: +
                            {p.selectedCandidate.score.workloadScore} | Hierarki: +
                            {p.selectedCandidate.score.hierarchyScore}
                          </span>
                        </div>
                        <ul className="mt-1.5 list-disc space-y-0.5 pl-4 text-stone-700">
                          {p.selectedCandidate.reasons.map((r, idx) => (
                            <li key={idx}>{r}</li>
                          ))}
                        </ul>
                        {p.selectedCandidate.warnings.length > 0 && (
                          <div className="mt-2 rounded bg-amber-100/70 px-2.5 py-1 text-amber-900">
                            <strong>Perhatian:</strong> {p.selectedCandidate.warnings.join('; ')}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-900">
                        <strong>Dibiarkan Kosong:</strong> {p.unassignedReason}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            /* Before vs After Workload Table */
            <div className="overflow-x-auto rounded-xl border border-stone-200 bg-white">
              <table className="min-w-full divide-y divide-stone-200 text-left text-xs">
                <thead className="bg-stone-50 font-semibold text-stone-700">
                  <tr>
                    <th className="px-4 py-3">Nama Guru</th>
                    <th className="px-4 py-3">Jawatan & Opsyen</th>
                    <th className="px-4 py-3">Bil. JK (Sebelum → Selepas)</th>
                    <th className="px-4 py-3">Beban Sebelum</th>
                    <th className="px-4 py-3">Beban Selepas</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {result.workloadComparison.map((w) => {
                    const t = teacherMap.get(w.staffId);
                    return (
                      <tr key={w.staffId}>
                        <td className="px-4 py-2.5 font-medium text-stone-900">{w.staffName}</td>
                        <td className="px-4 py-2.5 text-stone-600">
                          <div>{w.jawatan}</div>
                          {t?.department && (
                            <div className="text-[11px] text-stone-400">{t.department}</div>
                          )}
                        </td>
                        <td className="px-4 py-2.5 text-stone-700">
                          {w.committeeCountBefore} → <strong>{w.committeeCountAfter}</strong>
                        </td>
                        <td className="px-4 py-2.5 text-stone-600">{w.beforePct}%</td>
                        <td className="px-4 py-2.5 font-bold text-stone-900">{w.afterPct}%</td>
                        <td className="px-4 py-2.5">
                          {w.isOverloaded ? (
                            <span className="rounded-full bg-rose-100 px-2.5 py-0.5 font-semibold text-rose-800">
                              Melebihi 120%
                            </span>
                          ) : w.afterPct >= 100 ? (
                            <span className="rounded-full bg-amber-100 px-2.5 py-0.5 font-semibold text-amber-800">
                              Optimum Tinggi
                            </span>
                          ) : (
                            <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 font-semibold text-emerald-800">
                              Seimbang
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-stone-200 bg-white px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-stone-300 px-4 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-100"
          >
            Batal
          </button>
          <button
            type="button"
            disabled={isSaving}
            onClick={handleApproveAndSave}
            className="rounded-lg bg-emerald-900 px-5 py-2 text-xs font-semibold text-white hover:bg-emerald-800 disabled:opacity-50"
          >
            {isSaving
              ? 'Menyimpan...'
              : mode === 'regenerate_all'
                ? `Ganti & Simpan ${result.stats.assignedCount} Lantikan`
                : `Sahkan & Simpan ${newlyProposedCount} Lantikan Baharu`}
          </button>
        </div>
      </div>
    </div>
  );
};