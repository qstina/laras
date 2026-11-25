import React, { useEffect, useMemo, useState } from 'react';
import {
  Lock,
  Building,
  Check,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Users,
  Mail,
  Trash2,
  ShieldAlert,
  RefreshCw,
  Copy,
  Send,
  Clock,
  Calendar,
} from 'lucide-react';
import { supabase } from '../lib/supabase';

type InviteFilter = 'all' | 'pending' | 'accepted' | 'expired';

function formatDateMY(dateStr?: string | null): string {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('ms-MY', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export default function Settings() {
  const [activeTab, setActiveTab] = useState<'profil' | 'staf'>('profil');
  const [isLoading, setIsLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [school, setSchool] = useState<any>(null);
  const [email, setEmail] = useState('');

  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Staff & Invitation Management States
  const [staffList, setStaffList] = useState<any[]>([]);
  const [invitations, setInvitations] = useState<any[]>([]);
  const [inviteEmail, setInviteEmail] = useState('');
  const [isInviting, setIsInviting] = useState(false);
  const [inviteFeedback, setInviteFeedback] = useState<{
    text: string;
    type: 'success' | 'error';
  } | null>(null);
  const [inviteFilter, setInviteFilter] = useState<InviteFilter>('all');
  const [resendingId, setResendingId] = useState<string | null>(null);
  const [confirmRevokeId, setConfirmRevokeId] = useState<string | null>(null);
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    fetchCoreData();
  }, []);

  async function fetchCoreData() {
    setIsLoading(true);
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (session?.user) {
      setEmail(session.user.email || '');

      const { data: userProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (userProfile) {
        setProfile(userProfile);

        const { data: schoolData } = await supabase
          .from('schools')
          .select('*')
          .eq('id', userProfile.school_id)
          .single();
        if (schoolData) setSchool(schoolData);

        if (userProfile.role === 'admin' && userProfile.school_id) {
          await fetchAdminData(userProfile.school_id);
        }
      }
    }
    setIsLoading(false);
  }

  async function fetchAdminData(schoolId: string) {
    const { data: sData } = await supabase
      .from('profiles')
      .select('*')
      .eq('school_id', schoolId)
      .order('full_name');
    if (sData) setStaffList(sData);

    const { data: iData } = await supabase
      .from('invitations')
      .select('*')
      .eq('school_id', schoolId)
      .order('created_at', { ascending: false });
    if (iData) setInvitations(iData);
  }

  const invitationCounts = useMemo(() => {
    const now = new Date();
    let pending = 0;
    let accepted = 0;
    let expired = 0;

    for (const inv of invitations) {
      if (inv.used) {
        accepted++;
      } else if (new Date(inv.expires_at) <= now) {
        expired++;
      } else {
        pending++;
      }
    }

    return {
      all: invitations.length,
      pending,
      accepted,
      expired,
    };
  }, [invitations]);

  const filteredInvitations = useMemo(() => {
    const now = new Date();
    return invitations.filter((inv) => {
      const isExpired = !inv.used && new Date(inv.expires_at) <= now;
      if (inviteFilter === 'accepted') return Boolean(inv.used);
      if (inviteFilter === 'expired') return isExpired;
      if (inviteFilter === 'pending') return !inv.used && !isExpired;
      return true;
    });
  }, [invitations, inviteFilter]);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword)
      return setMessage({ text: 'Kata laluan tidak sepadan.', type: 'error' });
    if (newPassword.length < 6)
      return setMessage({ text: 'Kata laluan mestilah sekurang-kurangnya 6 aksara.', type: 'error' });

    setIsSaving(true);
    setMessage(null);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      setMessage({ text: error.message, type: 'error' });
    } else {
      setMessage({ text: 'Kata laluan berjaya dikemaskini.', type: 'success' });
      setNewPassword('');
      setConfirmPassword('');
    }
    setIsSaving(false);
  };

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = inviteEmail.trim().toLowerCase();
    if (!cleanEmail || !school) return;

    setIsInviting(true);
    setInviteFeedback(null);

    try {
      const { data, error } = await supabase.functions.invoke('send-teacher-invitation', {
        body: {
          action: 'create',
          email: cleanEmail,
        },
      });

      if (error) {
        let errMsg = error.message || 'Gagal menghantar e-mel jemputan.';
        try {
          const ctxBody = await (error as any).context?.json?.();
          if (ctxBody?.error) errMsg = ctxBody.error;
        } catch {
          // ignore
        }
        throw new Error(errMsg);
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      setInviteEmail('');
      setInviteFeedback({
        text: `E-mel jemputan rasmi telah berjaya dihantar ke ${cleanEmail}.`,
        type: 'success',
      });
      await fetchAdminData(school.id);
    } catch (err: any) {
      setInviteFeedback({
        text: err?.message || 'Gagal menghantar jemputan. Sila cuba semula.',
        type: 'error',
      });
    } finally {
      setIsInviting(false);
    }
  };

  const handleResendInvite = async (inv: any) => {
    if (!school || resendingId) return;
    setResendingId(inv.id);
    setInviteFeedback(null);

    try {
      const { data, error } = await supabase.functions.invoke('send-teacher-invitation', {
        body: {
          action: 'resend',
          invitationId: inv.id,
          email: inv.email,
        },
      });

      if (error) {
        let errMsg = error.message || 'Gagal menghantar semula jemputan.';
        try {
          const ctxBody = await (error as any).context?.json?.();
          if (ctxBody?.error) errMsg = ctxBody.error;
        } catch {
          // ignore
        }
        throw new Error(errMsg);
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      setInviteFeedback({
        text: `Pautan jemputan baharu (sah 7 hari) telah dihantar semula ke ${inv.email}.`,
        type: 'success',
      });
      await fetchAdminData(school.id);
    } catch (err: any) {
      setInviteFeedback({
        text: err?.message || 'Gagal menghantar semula e-mel jemputan.',
        type: 'error',
      });
    } finally {
      setResendingId(null);
    }
  };

  const handleRevokeInvite = async (id: string) => {
    if (!school) return;
    setRevokingId(id);
    setInviteFeedback(null);

    const { error } = await supabase.from('invitations').delete().eq('id', id);

    if (error) {
      setInviteFeedback({
        text: 'Gagal membatalkan jemputan: ' + error.message,
        type: 'error',
      });
    } else {
      setConfirmRevokeId(null);
      setInviteFeedback({
        text: 'Jemputan telah dibatalkan dan pautan tersebut dinyahaktifkan.',
        type: 'success',
      });
      await fetchAdminData(school.id);
    }
    setRevokingId(null);
  };

  const handleCopyInviteLink = async (inv: any) => {
    const link = `${window.location.origin}/accept-invitation?token=${inv.token}`;
    await navigator.clipboard.writeText(link);
    setCopiedId(inv.id);
    window.setTimeout(() => setCopiedId(null), 2000);
  };

  if (isLoading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-ink" />
      </div>
    );
  }

  return (
    <div className="max-w-384 mx-auto space-y-4 lg:space-y-6 relative">
      <div className="px-1">
        <h2 className="text-2xl sm:text-3xl font-semibold text-ink tracking-tight">Tetapan Sistem</h2>
        <p className="text-sm text-slate-500 mt-1">
          Urus profil akaun, keselamatan, dan akses organisasi anda.
        </p>
      </div>

      {/* Tabs */}
      {profile?.role === 'admin' && (
        <div className="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-lg w-fit border border-slate-200">
          <button
            onClick={() => setActiveTab('profil')}
            className={`px-4 py-2 text-xs font-semibold rounded-md transition-all ${
              activeTab === 'profil'
                ? 'bg-white text-ink border border-slate-200'
                : 'text-slate-500 hover:text-ink hover:bg-slate-50 border border-transparent'
            }`}
          >
            Profil Anda
          </button>
          <button
            onClick={() => setActiveTab('staf')}
            className={`px-4 py-2 text-xs font-semibold rounded-md transition-all flex items-center gap-2 ${
              activeTab === 'staf'
                ? 'bg-white text-ink border border-slate-200'
                : 'text-slate-500 hover:text-ink hover:bg-slate-50 border border-transparent'
            }`}
          >
            <Users size={14} /> Pengurusan Staf (Admin)
          </button>
        </div>
      )}

      {/* Profile & Security Tab */}
      {activeTab === 'profil' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6">
          <div className="md:col-span-1 space-y-4">
            <div className="bg-white p-5 lg:p-6 rounded-xl border border-slate-200">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-ink/10 text-ink rounded-lg border border-slate-200 flex items-center justify-center font-bold text-base shrink-0">
                  {profile?.full_name ? profile.full_name.substring(0, 2).toUpperCase() : 'U'}
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold text-ink leading-tight truncate">
                    {profile?.full_name}
                  </h3>
                  <p className="text-xs text-slate-500 truncate mt-0.5">{email}</p>
                  <span
                    className={`px-2 py-0.5 mt-2 border rounded-md text-[10px] font-bold uppercase tracking-wider inline-block ${
                      profile?.role === 'admin'
                        ? 'bg-sky/10 text-sky border-sky/20'
                        : 'bg-slate-100 text-slate-600 border-slate-200'
                    }`}
                  >
                    Peranan: {profile?.role}
                  </span>
                </div>
              </div>

              <div className="pt-4 mt-5 border-t border-slate-100">
                <div className="flex items-start gap-3">
                  <Building size={16} className="text-slate-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Institusi Semasa
                    </p>
                    <p className="text-sm font-semibold text-ink mt-0.5">{school?.name}</p>
                    <p className="text-xs text-slate-500">{school?.code}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="md:col-span-2">
            <div className="bg-white p-5 lg:p-6 rounded-xl border border-slate-200">
              <h3 className="text-base font-semibold text-ink mb-5 flex items-center gap-2">
                <Lock size={18} className="text-ink" /> Keselamatan Akaun
              </h3>

              {message && (
                <div
                  className={`p-3 mb-5 rounded-lg border flex items-start gap-2.5 text-xs ${
                    message.type === 'error'
                      ? 'bg-rose/10 border-rose/20 text-rose'
                      : 'bg-forest/10 border-forest/20 text-forest'
                  }`}
                >
                  <AlertCircle size={16} className="shrink-0 mt-0.5" />
                  <span className="font-medium">{message.text}</span>
                </div>
              )}

              <form onSubmit={handleUpdatePassword} className="space-y-4 max-w-md">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Kata Laluan Baru
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Minima 6 aksara"
                    className="w-full bg-white border border-slate-200 rounded-lg px-3.5 py-2 text-xs text-ink outline-none focus:border-ink/40 focus:ring-4 focus:ring-ink/5 transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Sahkan Kata Laluan Baru
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Taip semula kata laluan"
                    className="w-full bg-white border border-slate-200 rounded-lg px-3.5 py-2 text-xs text-ink outline-none focus:border-ink/40 focus:ring-4 focus:ring-ink/5 transition-all"
                  />
                </div>
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isSaving || !newPassword || !confirmPassword}
                    className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-ink rounded-lg hover:opacity-90 transition-opacity disabled:opacity-40"
                  >
                    {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}{' '}
                    Kemas Kini Kata Laluan
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Staff Management Tab (Admin Only) */}
      {activeTab === 'staf' && profile?.role === 'admin' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6">
          {/* Left 7 Cols: Invite Form + Invitation History */}
          <div className="lg:col-span-7 space-y-4 lg:space-y-6">
            {/* Send Invitation Card */}
            <div className="bg-white p-5 lg:p-6 rounded-xl border border-slate-200">
              <h3 className="text-base font-semibold text-ink mb-1">Jemput Guru / Staf Baru</h3>
              <p className="text-xs text-slate-500 mb-4">
                Sistem akan menghantar e-mel jemputan rasmi berserta pautan pendaftaran terus ke
                peti masuk guru (sah selama 7 hari).
              </p>

              {inviteFeedback && (
                <div
                  className={`p-3 mb-4 rounded-lg border flex items-start gap-2.5 text-xs ${
                    inviteFeedback.type === 'error'
                      ? 'bg-rose/10 border-rose/20 text-rose'
                      : 'bg-forest/10 border-forest/20 text-forest'
                  }`}
                >
                  {inviteFeedback.type === 'error' ? (
                    <AlertCircle size={16} className="shrink-0 mt-0.5" />
                  ) : (
                    <CheckCircle2 size={16} className="shrink-0 mt-0.5" />
                  )}
                  <span className="font-medium">{inviteFeedback.text}</span>
                </div>
              )}

              <form onSubmit={handleSendInvite} className="flex flex-col sm:flex-row sm:items-end gap-2.5">
                <div className="flex-1 space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Alamat E-mel Rasmi Guru
                  </label>
                  <div className="relative">
                    <Mail
                      size={14}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                    <input
                      type="email"
                      required
                      disabled={isInviting}
                      value={inviteEmail}
                      onChange={(e) => {
                        setInviteEmail(e.target.value);
                        if (inviteFeedback) setInviteFeedback(null);
                      }}
                      placeholder="guru@moe-dl.edu.my atau guru@gmail.com"
                      className="w-full pl-8 pr-3.5 py-2 bg-white border border-slate-200 rounded-lg text-xs font-medium outline-none focus:border-ink/40 focus:ring-4 focus:ring-ink/5 transition-all disabled:bg-slate-50"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={isInviting || !inviteEmail.trim()}
                  className="bg-ink text-white px-4 py-2 rounded-lg text-xs font-semibold hover:opacity-90 transition-opacity disabled:opacity-40 h-8.5 flex items-center justify-center gap-1.5 shrink-0"
                >
                  {isInviting ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      <span>Menghantar...</span>
                    </>
                  ) : (
                    <>
                      <Send size={13} />
                      <span>Hantar Jemputan</span>
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Invitation List Card */}
            <div className="bg-white p-5 lg:p-6 rounded-xl border border-slate-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <div>
                  <h3 className="text-sm font-semibold text-ink">Sejarah & Status Jemputan</h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Pantau status jemputan, hantar semula pautan, atau batalkan jemputan aktif.
                  </p>
                </div>

                {/* Status Filter Pills */}
                <div className="flex flex-wrap items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200/80">
                  {(
                    [
                      { key: 'all', label: 'Semua', count: invitationCounts.all },
                      { key: 'pending', label: 'Menunggu', count: invitationCounts.pending },
                      { key: 'accepted', label: 'Diterima', count: invitationCounts.accepted },
                      { key: 'expired', label: 'Luput', count: invitationCounts.expired },
                    ] as const
                  ).map((tab) => (
                    <button
                      key={tab.key}
                      type="button"
                      onClick={() => setInviteFilter(tab.key)}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors ${
                        inviteFilter === tab.key
                          ? 'bg-white text-ink shadow-2xs border border-slate-200/80'
                          : 'text-slate-500 hover:text-ink'
                      }`}
                    >
                      {tab.label} ({tab.count})
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2.5 max-h-104 overflow-y-auto pr-1 no-scrollbar">
                {filteredInvitations.length === 0 ? (
                  <p className="text-xs text-slate-400 italic text-center py-6">
                    Tiada rekod jemputan dalam kategori ini.
                  </p>
                ) : (
                  filteredInvitations.map((inv) => {
                    const isExpired = !inv.used && new Date(inv.expires_at) <= new Date();
                    const isPending = !inv.used && !isExpired;
                    const isResendingThis = resendingId === inv.id;
                    const isRevokingThis = revokingId === inv.id;

                    return (
                      <div
                        key={inv.id}
                        className="p-3.5 border border-slate-200 rounded-lg bg-slate-50/70 space-y-2.5"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="text-xs font-semibold text-ink truncate">{inv.email}</p>
                              {inv.used ? (
                                <span className="text-[10px] font-bold text-forest bg-forest/10 border border-forest/20 px-2 py-0.5 rounded uppercase tracking-wide">
                                  Diterima
                                </span>
                              ) : isExpired ? (
                                <span className="text-[10px] font-bold text-rose bg-rose/10 border border-rose/20 px-2 py-0.5 rounded uppercase tracking-wide">
                                  Luput
                                </span>
                              ) : (
                                <span className="text-[10px] font-bold text-amber bg-amber/10 border border-amber/20 px-2 py-0.5 rounded uppercase tracking-wide">
                                  Menunggu
                                </span>
                              )}
                            </div>

                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5 text-[11px] text-slate-500">
                              <span className="inline-flex items-center gap-1">
                                <Calendar size={11} className="text-slate-400" />
                                Dijemput: <strong className="font-medium text-slate-700">{formatDateMY(inv.created_at)}</strong>
                              </span>
                              {inv.used ? (
                                <span className="inline-flex items-center gap-1 text-forest">
                                  <CheckCircle2 size={11} />
                                  Disertai: <strong>{formatDateMY(inv.accepted_at || inv.created_at)}</strong>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1">
                                  <Clock size={11} className="text-slate-400" />
                                  {isExpired ? 'Tamat pada:' : 'Sah hingga:'}{' '}
                                  <strong className={`font-medium ${isExpired ? 'text-rose' : 'text-slate-700'}`}>
                                    {formatDateMY(inv.expires_at)}
                                  </strong>
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Actions for Pending & Expired Invitations */}
                          {!inv.used && (
                            <div className="flex items-center gap-1.5 shrink-0">
                              {isPending && (
                                <button
                                  type="button"
                                  onClick={() => handleCopyInviteLink(inv)}
                                  title="Salin pautan jemputan"
                                  className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-white border border-slate-200 rounded-md text-[11px] font-semibold text-slate-600 hover:text-ink hover:bg-slate-50 transition-colors"
                                >
                                  {copiedId === inv.id ? (
                                    <>
                                      <Check size={12} className="text-forest" />
                                      <span className="text-forest">Disalin</span>
                                    </>
                                  ) : (
                                    <>
                                      <Copy size={12} />
                                      <span>Salin</span>
                                    </>
                                  )}
                                </button>
                              )}

                              <button
                                type="button"
                                disabled={isResendingThis}
                                onClick={() => handleResendInvite(inv)}
                                title="Hantar semula e-mel jemputan dengan tempoh 7 hari baharu"
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-white border border-slate-200 rounded-md text-[11px] font-semibold text-ink hover:bg-slate-50 transition-colors disabled:opacity-50"
                              >
                                <RefreshCw
                                  size={12}
                                  className={isResendingThis ? 'animate-spin' : ''}
                                />
                                <span>{isResendingThis ? 'Menghantar...' : 'Hantar Semula'}</span>
                              </button>

                              {confirmRevokeId === inv.id ? (
                                <div className="flex items-center gap-1 bg-rose/10 border border-rose/20 rounded-md px-2 py-1">
                                  <button
                                    type="button"
                                    disabled={isRevokingThis}
                                    onClick={() => handleRevokeInvite(inv.id)}
                                    className="text-[11px] font-bold text-rose hover:underline"
                                  >
                                    {isRevokingThis ? 'Memadam...' : 'Sahkan Batal'}
                                  </button>
                                  <span className="text-slate-300">|</span>
                                  <button
                                    type="button"
                                    onClick={() => setConfirmRevokeId(null)}
                                    className="text-[11px] font-medium text-slate-500 hover:text-ink"
                                  >
                                    Tidak
                                  </button>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => setConfirmRevokeId(inv.id)}
                                  title="Batalkan jemputan"
                                  className="p-1.5 text-slate-400 hover:text-rose hover:bg-rose/10 rounded-md transition-colors"
                                >
                                  <Trash2 size={14} />
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Right 5 Cols: Active School Staff Accounts */}
          <div className="lg:col-span-5 bg-white p-5 lg:p-6 rounded-xl border border-slate-200 h-fit">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-base font-semibold text-ink">Akaun Staf Aktif</h3>
              <span className="px-2.5 py-0.5 bg-slate-100 border border-slate-200 text-slate-600 text-[10px] font-bold rounded-md">
                {staffList.length} Akaun
              </span>
            </div>

            <div className="space-y-2 max-h-128 overflow-y-auto pr-1 no-scrollbar">
              {staffList.map((staff) => (
                <div
                  key={staff.id}
                  className="flex items-center gap-3 p-2.5 border border-slate-100 rounded-lg hover:border-slate-200 hover:bg-slate-50 transition-colors"
                >
                  <div
                    className={`w-8 h-8 rounded-md flex items-center justify-center font-bold text-xs shrink-0 ${
                      staff.role === 'admin'
                        ? 'bg-ink/10 text-ink border border-slate-200'
                        : 'bg-slate-100 text-slate-600 border border-slate-200'
                    }`}
                  >
                    {staff.full_name ? staff.full_name.substring(0, 2).toUpperCase() : 'ST'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-ink truncate">{staff.full_name}</p>
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider mt-0.5">
                      {staff.role}
                    </p>
                  </div>
                  {staff.role === 'admin' && staff.id !== profile.id && (
                    <ShieldAlert size={14} className="text-sky" aria-label="Rakan Pentadbir" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}