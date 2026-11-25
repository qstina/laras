import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  Sparkles,
  BarChart3,
  ChevronRight,
  ChevronLeft,
  ArrowUpRight,
  Loader2,
  Plus,
  Pencil,
  Trash2,
  Clock,
  X,
  Calendar as CalendarIcon,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { supabase } from '../lib/supabase';

interface SchoolEvent {
  id: string;
  school_id: string;
  created_by: string;
  title: string;
  event_date: string; // YYYY-MM-DD
  start_time: string | null; // HH:MM:SS or HH:MM
  end_time: string | null;
  description: string | null;
  category: string;
  created_at: string;
}

const MONTH_NAMES_MY = [
  'Januari',
  'Februari',
  'Mac',
  'April',
  'Mei',
  'Jun',
  'Julai',
  'Ogos',
  'September',
  'Oktober',
  'November',
  'Disember',
];

const WEEKDAYS_SHORT_MY = ['AHD', 'ISN', 'SEL', 'RAB', 'KHA', 'JUM', 'SAB'];

function toDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function formatTimeShort(timeStr?: string | null): string {
  if (!timeStr) return '';
  return timeStr.slice(0, 5);
}

function formatDisplayDateMY(dateKey: string): string {
  const [y, m, d] = dateKey.split('-').map(Number);
  if (!y || !m || !d) return dateKey;
  return `${d} ${MONTH_NAMES_MY[m - 1]} ${y}`;
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [school, setSchool] = useState<any>(null);

  // Core school data
  const [staffList, setStaffList] = useState<any[]>([]);
  const [committees, setCommittees] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [rosters, setRosters] = useState<any[]>([]);

  // Calendar & Events State
  const todayKey = useMemo(() => toDateKey(new Date()), []);
  const [viewDate, setViewDate] = useState<Date>(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [selectedDateKey, setSelectedDateKey] = useState<string>(() => toDateKey(new Date()));
  const [events, setEvents] = useState<SchoolEvent[]>([]);
  const [isLoadingEvents, setIsLoadingEvents] = useState(false);

  // Add / Edit Event Modal State
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<SchoolEvent | null>(null);
  const [eventTitle, setEventTitle] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventStartTime, setEventStartTime] = useState('');
  const [eventEndTime, setEventEndTime] = useState('');
  const [eventDescription, setEventDescription] = useState('');
  const [isSavingEvent, setIsSavingEvent] = useState(false);
  const [deletingEventId, setDeletingEventId] = useState<string | null>(null);
  const [eventError, setEventError] = useState<string | null>(null);
  const [eventToast, setEventToast] = useState<string | null>(null);

  useEffect(() => {
    async function loadDashboard() {
      setIsLoading(true);
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!session?.user) return;

        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (!profile?.school_id) return;
        setUserProfile(profile);

        const [schoolRes, staffRes, commRes, assignRes, rosterRes] = await Promise.all([
          supabase.from('schools').select('*').eq('id', profile.school_id).single(),
          supabase.from('profiles').select('*').eq('school_id', profile.school_id),
          supabase.from('committees').select('*').eq('school_id', profile.school_id),
          supabase.from('committee_assignments').select('*').eq('school_id', profile.school_id),
          supabase.from('duty_rosters').select('*').eq('school_id', profile.school_id),
        ]);

        if (schoolRes.data) setSchool(schoolRes.data);
        if (staffRes.data) setStaffList(staffRes.data);
        if (commRes.data) setCommittees(commRes.data);
        if (assignRes.data) setAssignments(assignRes.data);
        if (rosterRes.data) setRosters(rosterRes.data);

        await fetchSchoolEvents(profile.school_id);
      } catch (err) {
        console.error('[LARAS Dashboard] Load error:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadDashboard();
  }, []);

  async function fetchSchoolEvents(schoolId: string) {
    setIsLoadingEvents(true);
    const { data, error } = await supabase
      .from('school_events')
      .select('*')
      .eq('school_id', schoolId)
      .order('event_date', { ascending: true })
      .order('start_time', { ascending: true, nullsFirst: false });

    if (!error && data) {
      setEvents(data);
    }
    setIsLoadingEvents(false);
  }

  // Group events by YYYY-MM-DD
  const eventsByDate = useMemo(() => {
    const map: Record<string, SchoolEvent[]> = {};
    for (const ev of events) {
      if (!map[ev.event_date]) map[ev.event_date] = [];
      map[ev.event_date].push(ev);
    }
    return map;
  }, [events]);

  // Selected date events
  const selectedDateEvents = useMemo(
    () => eventsByDate[selectedDateKey] || [],
    [eventsByDate, selectedDateKey]
  );

  // Build calendar grid for viewDate
  const calendarCells = useMemo(() => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const firstDayOfWeek = new Date(year, month, 1).getDay(); // 0 = Sun
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const cells: Array<{ day: number | null; dateKey: string | null }> = [];
    for (let i = 0; i < firstDayOfWeek; i++) {
      cells.push({ day: null, dateKey: null });
    }
    for (let d = 1; d <= daysInMonth; d++) {
      const cellDate = new Date(year, month, d);
      cells.push({ day: d, dateKey: toDateKey(cellDate) });
    }
    return cells;
  }, [viewDate]);

  // Upcoming events for Takwim Minggu Ini (within next 7 days, fallback to next upcoming events)
  const upcomingTakwim = useMemo(() => {
    const upcoming = events.filter((ev) => ev.event_date >= todayKey);
    return upcoming.slice(0, 4);
  }, [events, todayKey]);

  const handlePrevMonth = () => {
    setViewDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setViewDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const handleJumpToday = () => {
    const now = new Date();
    setViewDate(new Date(now.getFullYear(), now.getMonth(), 1));
    setSelectedDateKey(toDateKey(now));
  };

  const openAddEventModal = (targetDateKey?: string) => {
    setEditingEvent(null);
    setEventTitle('');
    setEventDate(targetDateKey || selectedDateKey || todayKey);
    setEventStartTime('');
    setEventEndTime('');
    setEventDescription('');
    setEventError(null);
    setIsEventModalOpen(true);
  };

  const openEditEventModal = (ev: SchoolEvent) => {
    setEditingEvent(ev);
    setEventTitle(ev.title);
    setEventDate(ev.event_date);
    setEventStartTime(formatTimeShort(ev.start_time));
    setEventEndTime(formatTimeShort(ev.end_time));
    setEventDescription(ev.description || '');
    setEventError(null);
    setIsEventModalOpen(true);
  };

  const handleSaveEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userProfile?.school_id || !userProfile?.id) return;

    const cleanTitle = eventTitle.trim();
    if (!cleanTitle) {
      setEventError('Sila masukkan tajuk acara atau peringatan.');
      return;
    }
    if (!eventDate) {
      setEventError('Sila pilih tarikh acara.');
      return;
    }
    if (eventStartTime && eventEndTime && eventEndTime < eventStartTime) {
      setEventError('Masa tamat tidak boleh lebih awal daripada masa mula.');
      return;
    }

    setIsSavingEvent(true);
    setEventError(null);

    try {
      const payload = {
        school_id: userProfile.school_id,
        title: cleanTitle,
        event_date: eventDate,
        start_time: eventStartTime ? `${eventStartTime}:00` : null,
        end_time: eventEndTime ? `${eventEndTime}:00` : null,
        description: eventDescription.trim() || null,
      };

      if (editingEvent) {
        const { error: updateErr } = await supabase
          .from('school_events')
          .update(payload)
          .eq('id', editingEvent.id)
          .eq('school_id', userProfile.school_id);

        if (updateErr) throw updateErr;
        setEventToast('Acara berjaya dikemaskini.');
      } else {
        const { error: insertErr } = await supabase.from('school_events').insert({
          ...payload,
          created_by: userProfile.id,
        });

        if (insertErr) throw insertErr;
        setEventToast('Acara baharu berjaya disimpan ke takwim.');
      }

      // Sync selected date & visible month to saved event date
      setSelectedDateKey(eventDate);
      const [y, m] = eventDate.split('-').map(Number);
      if (y && m) {
        setViewDate(new Date(y, m - 1, 1));
      }

      await fetchSchoolEvents(userProfile.school_id);
      setIsEventModalOpen(false);
      window.setTimeout(() => setEventToast(null), 3000);
    } catch (err: any) {
      setEventError(err?.message || 'Gagal menyimpan acara. Sila cuba semula.');
    } finally {
      setIsSavingEvent(false);
    }
  };

  const handleDeleteEvent = async (ev: SchoolEvent) => {
    if (!userProfile?.school_id || deletingEventId) return;
    setDeletingEventId(ev.id);

    try {
      const { error: delErr } = await supabase
        .from('school_events')
        .delete()
        .eq('id', ev.id)
        .eq('school_id', userProfile.school_id);

      if (delErr) throw delErr;

      await fetchSchoolEvents(userProfile.school_id);
      setEventToast('Acara telah dipadam daripada takwim.');
      window.setTimeout(() => setEventToast(null), 3000);
    } catch (err: any) {
      setEventError(err?.message || 'Gagal memadam acara.');
    } finally {
      setDeletingEventId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="h-[80vh] flex flex-col items-center justify-center gap-3 text-ink font-sans">
        <Loader2 size={28} className="animate-spin text-ink" />
        <p className="text-xs font-medium text-slate-400">Menyediakan ringkasan sekolah...</p>
      </div>
    );
  }

  // Real metrics (no hardcoded fake counts)
  const totalStaff = staffList.length;
  const activeAssignCount = assignments.length;
  const assignedStaffIds = new Set(assignments.map((a) => a.staff_id).filter(Boolean));
  const assignedStaffCount = assignedStaffIds.size;
  const allocationRate =
    totalStaff > 0 ? Math.min(100, Math.round((assignedStaffCount / totalStaff) * 100)) : 0;

  const firstName = userProfile?.full_name?.split(' ')[0] || 'Pentadbir';

  // Display top 4 staff members with real workload tags
  const displayedStaff = staffList.slice(0, 4).map((st) => {
    const count = assignments.filter((a) => a.staff_id === st.id).length;
    const isAdmin = st.role === 'admin';
    return {
      id: st.id,
      name: st.full_name,
      role: st.position || (isAdmin ? 'Pentadbir Sekolah' : 'Guru Akademik'),
      status: isAdmin ? 'Pentadbir' : count > 0 ? `${count} Tugas` : 'Sedia',
      statusColor: isAdmin
        ? 'bg-sky/10 text-sky border-sky/20'
        : count > 0
          ? 'bg-forest/10 text-forest border-forest/20'
          : 'bg-amber/10 text-amber border-amber/20',
      initials: st.full_name ? st.full_name.substring(0, 2).toUpperCase() : 'GR',
    };
  });

  const canModifyEvent = (ev: SchoolEvent) =>
    userProfile?.role === 'admin' || ev.created_by === userProfile?.id;

  return (
    <div className="max-w-384 mx-auto space-y-4 lg:space-y-6 font-sans">
      {/* Feedback Toast Banner */}
      {eventToast && (
        <div className="p-3 bg-forest/10 border border-forest/20 rounded-xl flex items-center justify-between text-forest text-xs font-medium">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={15} className="shrink-0" />
            <span>{eventToast}</span>
          </div>
          <button
            type="button"
            onClick={() => setEventToast(null)}
            className="text-forest/70 hover:text-forest"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Top Welcome Banner */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 px-1">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold text-ink tracking-tight">
            Selamat kembali, {firstName}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Ringkasan pengurusan {school?.name || 'sekolah'} &bull;{' '}
            {new Date().toLocaleDateString('ms-MY', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </p>
        </div>

        {/* Quick Action Pills */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => navigate('/book-builder')}
            className="flex items-center gap-2 px-3.5 py-2 bg-white border border-slate-200 hover:border-slate-300 rounded-lg text-xs font-semibold text-ink transition-all hover:bg-slate-50"
          >
            <FileText size={14} className="text-slate-500" />
            Jana Buku Pengurusan
          </button>
          <button
            type="button"
            onClick={() => navigate('/workload')}
            className="flex items-center gap-2 px-3.5 py-2 bg-white border border-slate-200 hover:border-slate-300 rounded-lg text-xs font-semibold text-ink transition-all hover:bg-slate-50"
          >
            <Sparkles size={14} className="text-amber" />
            Agihan Tugas
          </button>
          <button
            type="button"
            onClick={() => navigate('/analytics')}
            className="flex items-center gap-2 px-3.5 py-2 bg-ink hover:opacity-90 rounded-lg text-xs font-semibold text-white transition-opacity"
          >
            <BarChart3 size={14} />
            Analisis
          </button>
        </div>
      </div>

      {/* Main 12-Col Bento Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6">
        {/* Left 8 Columns */}
        <div className="lg:col-span-8 flex flex-col gap-4 lg:gap-6">
          {/* Top Row: 3 KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 lg:gap-6">
            {/* KPI 1 */}
            <div
              onClick={() => navigate('/teachers')}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && navigate('/teachers')}
              className="bg-white border border-slate-200 hover:border-slate-300 rounded-xl p-5 flex flex-col justify-between transition-colors cursor-pointer"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-slate-500">Jumlah Guru & Staf</span>
                <span className="text-[11px] font-bold text-forest bg-forest/10 border border-forest/20 px-2 py-0.5 rounded-md">
                  Aktif
                </span>
              </div>
              <div className="text-2xl lg:text-3xl font-bold text-ink tracking-tight">
                {totalStaff}
              </div>
              <div className="flex items-center justify-between text-xs text-slate-400 mt-4 pt-3 border-t border-slate-100">
                <span>Kakitangan berdaftar</span>
                <ChevronRight size={14} />
              </div>
            </div>

            {/* KPI 2 */}
            <div
              onClick={() => navigate('/committees')}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && navigate('/committees')}
              className="bg-white border border-slate-200 hover:border-slate-300 rounded-xl p-5 flex flex-col justify-between transition-colors cursor-pointer"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-slate-500">Jawatankuasa Aktif</span>
                <span className="text-[11px] font-bold text-sky bg-sky/10 border border-sky/20 px-2 py-0.5 rounded-md">
                  Unit
                </span>
              </div>
              <div className="text-2xl lg:text-3xl font-bold text-ink tracking-tight">
                {committees.length || 0}
              </div>
              <div className="flex items-center justify-between text-xs text-slate-400 mt-4 pt-3 border-t border-slate-100">
                <span>Kurikulum & HEM</span>
                <ChevronRight size={14} />
              </div>
            </div>

            {/* KPI 3 */}
            <div
              onClick={() => navigate('/reports')}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && navigate('/reports')}
              className="bg-white border border-slate-200 hover:border-slate-300 rounded-xl p-5 flex flex-col justify-between transition-colors cursor-pointer"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-slate-500">Semakan Tugas</span>
                <span className="text-[11px] font-bold text-amber bg-amber/10 border border-amber/20 px-2 py-0.5 rounded-md">
                  {rosters.length} Jadual
                </span>
              </div>
              <div className="text-2xl lg:text-3xl font-bold text-ink tracking-tight">
                {activeAssignCount}
              </div>
              <div className="flex items-center justify-between text-xs text-slate-400 mt-4 pt-3 border-t border-slate-100">
                <span>Lantikan & laporan</span>
                <ChevronRight size={14} />
              </div>
            </div>
          </div>

          {/* Middle Row: Status Agihan Tugas */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 lg:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-5">
              <div>
                <h2 className="text-sm font-semibold text-ink">Status Agihan Tugas</h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Peratusan pengagihan jawatankuasa dan tugas rasmi sekolah
                </p>
              </div>
              <button
                type="button"
                onClick={() => navigate('/workload')}
                className="text-xs font-semibold text-ink hover:underline flex items-center gap-1 self-start sm:self-auto"
              >
                Lihat Semua <ArrowUpRight size={14} />
              </button>
            </div>

            {/* Segmented Bar */}
            <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden flex gap-0.5">
              <div
                style={{ width: `${allocationRate}%` }}
                className="h-full bg-forest transition-all duration-500 rounded-l-full"
              ></div>
              <div
                style={{ width: `${Math.max(0, 100 - allocationRate)}%` }}
                className="h-full bg-amber transition-all duration-500 rounded-r-full"
              ></div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4 mt-4 pt-3 border-t border-slate-100 text-xs">
              <div className="flex items-center gap-5">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-forest"></span>
                  <span className="text-slate-600 font-medium">
                    Telah Diagih ({assignedStaffCount}/{totalStaff} staf &bull; {allocationRate}%)
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber"></span>
                  <span className="text-slate-600 font-medium">
                    Belum Diagih ({Math.max(0, totalStaff - assignedStaffCount)} staf)
                  </span>
                </div>
              </div>
              <span className="text-slate-400 font-medium">
                {activeAssignCount} lantikan direkodkan
              </span>
            </div>
          </div>

          {/* Bottom Row: 2 Sub-Cards (Senarai Guru + Takwim Minggu Ini) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6 flex-1">
            {/* Left Sub-Card: Senarai Guru */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-ink">Senarai Guru</h3>
                  <button
                    type="button"
                    onClick={() => navigate('/teachers')}
                    className="w-7 h-7 rounded-lg border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 hover:text-ink transition-colors"
                    title="Lihat direktori penuh"
                  >
                    <ArrowUpRight size={14} />
                  </button>
                </div>

                {displayedStaff.length === 0 ? (
                  <p className="text-xs text-slate-400 py-6 text-center">
                    Tiada rekod kakitangan dijumpai.
                  </p>
                ) : (
                  <div className="space-y-2.5">
                    {displayedStaff.map((staff) => (
                      <div
                        key={staff.id}
                        onClick={() => navigate('/teachers')}
                        className="flex items-center justify-between p-2.5 rounded-lg border border-slate-100 hover:border-slate-200 hover:bg-slate-50/70 transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 text-ink flex items-center justify-center text-[11px] font-bold shrink-0">
                            {staff.initials}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-ink truncate">{staff.name}</p>
                            <p className="text-[11px] text-slate-400 truncate">{staff.role}</p>
                          </div>
                        </div>
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border shrink-0 ml-2 ${staff.statusColor}`}
                        >
                          {staff.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => navigate('/teachers')}
                className="w-full mt-4 pt-3 border-t border-slate-100 text-xs font-semibold text-slate-500 hover:text-ink flex items-center justify-center gap-1 transition-colors"
              >
                Lihat Direktori Penuh <ChevronRight size={14} />
              </button>
            </div>

            {/* Right Sub-Card: Takwim & Acara Terdekat */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-ink">Takwim Terdekat</h3>
                    <span className="w-5 h-5 rounded-full bg-ink text-white text-[10px] font-bold flex items-center justify-center">
                      {upcomingTakwim.length}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => openAddEventModal(selectedDateKey)}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-ink hover:underline"
                  >
                    <Plus size={12} /> Tambah
                  </button>
                </div>

                {upcomingTakwim.length === 0 ? (
                  <div className="py-6 text-center space-y-2">
                    <p className="text-xs text-slate-400">
                      Tiada acara akan datang dijadualkan.
                    </p>
                    <button
                      type="button"
                      onClick={() => openAddEventModal(todayKey)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[11px] font-semibold text-ink hover:bg-slate-100"
                    >
                      <Plus size={12} /> Cipta Peringatan Pertama
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {upcomingTakwim.map((ev) => (
                      <div
                        key={ev.id}
                        onClick={() => {
                          setSelectedDateKey(ev.event_date);
                          const [y, m] = ev.event_date.split('-').map(Number);
                          if (y && m) setViewDate(new Date(y, m - 1, 1));
                        }}
                        className="flex items-start gap-2.5 p-2.5 rounded-lg border border-slate-100 hover:border-slate-200 hover:bg-slate-50/70 transition-colors cursor-pointer"
                      >
                        <div className="w-1.5 h-1.5 rounded-full bg-forest mt-1.5 shrink-0"></div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-ink truncate">{ev.title}</p>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            {formatDisplayDateMY(ev.event_date)}
                            {ev.start_time ? ` • ${formatTimeShort(ev.start_time)}` : ''}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => navigate('/roster')}
                className="w-full mt-4 pt-3 border-t border-slate-100 text-xs font-semibold text-slate-500 hover:text-ink flex items-center justify-center gap-1 transition-colors"
              >
                Lihat Jadual Bertugas <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>

        {/* Right 4 Columns: Interactive Kalendar Sekolah */}
        <div className="lg:col-span-4 bg-white border border-slate-200 rounded-xl p-5 lg:p-6 flex flex-col justify-between">
          <div>
            {/* Calendar Header */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-semibold text-ink">
                  {MONTH_NAMES_MY[viewDate.getMonth()]} {viewDate.getFullYear()}
                </h2>
                <button
                  type="button"
                  onClick={handleJumpToday}
                  className="text-[11px] font-medium text-slate-400 hover:text-ink transition-colors"
                >
                  Hari Ini &bull; {formatDisplayDateMY(todayKey)}
                </button>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={handlePrevMonth}
                  aria-label="Bulan sebelumnya"
                  className="w-7 h-7 rounded-lg border border-slate-200 flex items-center justify-center text-slate-500 hover:text-ink hover:bg-slate-50 transition-colors"
                >
                  <ChevronLeft size={14} />
                </button>
                <button
                  type="button"
                  onClick={handleNextMonth}
                  aria-label="Bulan seterusnya"
                  className="w-7 h-7 rounded-lg border border-slate-200 flex items-center justify-center text-slate-500 hover:text-ink hover:bg-slate-50 transition-colors"
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>

            {/* Weekdays Row */}
            <div className="grid grid-cols-7 gap-1 text-center mb-1.5">
              {WEEKDAYS_SHORT_MY.map((day) => (
                <span
                  key={day}
                  className="text-[10px] font-bold text-slate-400 uppercase tracking-wider py-1"
                >
                  {day}
                </span>
              ))}
            </div>

            {/* Dates Matrix */}
            <div className="grid grid-cols-7 gap-1 text-center">
              {calendarCells.map((cell, idx) => {
                if (!cell.day || !cell.dateKey) {
                  return <div key={`empty-${idx}`} className="h-9" />;
                }

                const isToday = cell.dateKey === todayKey;
                const isSelected = cell.dateKey === selectedDateKey;
                const dayEvents = eventsByDate[cell.dateKey] || [];
                const hasEvents = dayEvents.length > 0;

                return (
                  <button
                    key={cell.dateKey}
                    type="button"
                    onClick={() => setSelectedDateKey(cell.dateKey!)}
                    title={
                      hasEvents
                        ? `${dayEvents.length} acara pada ${formatDisplayDateMY(cell.dateKey)}`
                        : formatDisplayDateMY(cell.dateKey)
                    }
                    className={`h-9 rounded-lg flex flex-col items-center justify-center text-xs font-medium relative transition-all ${
                      isSelected
                        ? 'bg-ink text-white font-semibold'
                        : isToday
                          ? 'bg-forest/10 text-forest border border-forest/30 font-bold'
                          : hasEvents
                            ? 'bg-slate-50 text-ink border border-slate-200/80 font-semibold hover:bg-slate-100'
                            : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span>{cell.day}</span>
                    {hasEvents && (
                      <span
                        className={`w-1 h-1 rounded-full mt-0.5 ${
                          isSelected ? 'bg-white' : 'bg-forest'
                        }`}
                      />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Selected Date Event Summary */}
            <div className="mt-5 pt-4 border-t border-slate-100">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Ringkasan Tarikh Dipilih
                  </p>
                  <p className="text-xs font-semibold text-ink mt-0.5">
                    {formatDisplayDateMY(selectedDateKey)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => openAddEventModal(selectedDateKey)}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-ink text-white rounded-lg text-[11px] font-semibold hover:opacity-90 transition-opacity"
                >
                  <Plus size={12} /> Acara
                </button>
              </div>

              {isLoadingEvents ? (
                <div className="py-4 flex justify-center">
                  <Loader2 size={16} className="animate-spin text-slate-400" />
                </div>
              ) : selectedDateEvents.length === 0 ? (
                <div className="p-3.5 rounded-lg bg-slate-50/80 border border-slate-100 text-center">
                  <p className="text-xs text-slate-400">
                    Tiada acara atau peringatan pada tarikh ini.
                  </p>
                </div>
              ) : (
                <div className="space-y-2 max-h-56 overflow-y-auto pr-0.5 no-scrollbar">
                  {selectedDateEvents.map((ev) => (
                    <div
                      key={ev.id}
                      className="p-2.5 rounded-lg border border-slate-200/90 bg-slate-50/70 space-y-1"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-xs font-semibold text-ink leading-snug">{ev.title}</p>
                        {canModifyEvent(ev) && (
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => openEditEventModal(ev)}
                              title="Sunting acara"
                              className="p-1 text-slate-400 hover:text-ink rounded transition-colors"
                            >
                              <Pencil size={12} />
                            </button>
                            <button
                              type="button"
                              disabled={deletingEventId === ev.id}
                              onClick={() => handleDeleteEvent(ev)}
                              title="Padam acara"
                              className="p-1 text-slate-400 hover:text-rose rounded transition-colors disabled:opacity-50"
                            >
                              {deletingEventId === ev.id ? (
                                <Loader2 size={12} className="animate-spin" />
                              ) : (
                                <Trash2 size={12} />
                              )}
                            </button>
                          </div>
                        )}
                      </div>

                      {(ev.start_time || ev.end_time) && (
                        <p className="text-[11px] text-slate-500 flex items-center gap-1">
                          <Clock size={11} className="text-slate-400" />
                          <span>
                            {formatTimeShort(ev.start_time)}
                            {ev.end_time ? ` – ${formatTimeShort(ev.end_time)}` : ''}
                          </span>
                        </p>
                      )}

                      {ev.description && (
                        <p className="text-[11px] text-slate-500 leading-relaxed">
                          {ev.description}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Calendar Footer Legend */}
          <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-forest"></span> Hari Ini / Acara
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-ink"></span> Dipilih
              </span>
            </div>
            <span>{events.length} acara sekolah</span>
          </div>
        </div>
      </div>

      {/* Add / Edit Calendar Event Modal */}
      {isEventModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-ink/40 backdrop-blur-[1px] flex items-center justify-center p-4"
          onClick={() => !isSavingEvent && setIsEventModalOpen(false)}
        >
          <div
            className="bg-white border border-slate-200 rounded-xl max-w-md w-full p-5 sm:p-6 shadow-xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-ink text-white flex items-center justify-center">
                  <CalendarIcon size={15} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-ink">
                    {editingEvent ? 'Sunting Acara Takwim' : 'Tambah Acara / Peringatan'}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Dikongsi bersama warga {school?.name || 'sekolah'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                disabled={isSavingEvent}
                onClick={() => setIsEventModalOpen(false)}
                className="text-slate-400 hover:text-ink"
              >
                <X size={16} />
              </button>
            </div>

            {eventError && (
              <div className="p-2.5 bg-rose/10 border border-rose/20 rounded-lg flex items-start gap-2 text-rose text-xs font-medium">
                <AlertCircle size={14} className="shrink-0 mt-0.5" />
                <span>{eventError}</span>
              </div>
            )}

            <form onSubmit={handleSaveEvent} className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Tajuk Acara / Mesyuarat *
                </label>
                <input
                  type="text"
                  required
                  disabled={isSavingEvent}
                  value={eventTitle}
                  onChange={(e) => setEventTitle(e.target.value)}
                  placeholder="Contoh: Mesyuarat Agung PIBG / Taklimat Kurikulum"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-ink outline-none focus:border-ink/40 focus:ring-4 focus:ring-ink/5"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Tarikh *
                  </label>
                  <input
                    type="date"
                    required
                    disabled={isSavingEvent}
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    className="w-full px-2.5 py-2 bg-white border border-slate-200 rounded-lg text-xs text-ink outline-none focus:border-ink/40"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Masa Mula
                  </label>
                  <input
                    type="time"
                    disabled={isSavingEvent}
                    value={eventStartTime}
                    onChange={(e) => setEventStartTime(e.target.value)}
                    className="w-full px-2.5 py-2 bg-white border border-slate-200 rounded-lg text-xs text-ink outline-none focus:border-ink/40"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Masa Tamat
                  </label>
                  <input
                    type="time"
                    disabled={isSavingEvent}
                    value={eventEndTime}
                    onChange={(e) => setEventEndTime(e.target.value)}
                    className="w-full px-2.5 py-2 bg-white border border-slate-200 rounded-lg text-xs text-ink outline-none focus:border-ink/40"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Catatan / Lokasi (Pilihan)
                </label>
                <textarea
                  rows={3}
                  disabled={isSavingEvent}
                  value={eventDescription}
                  onChange={(e) => setEventDescription(e.target.value)}
                  placeholder="Contoh: Bilik Gerakan • Kehadiran semua ketua panitia diwajibkan."
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-ink outline-none focus:border-ink/40 focus:ring-4 focus:ring-ink/5 resize-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  disabled={isSavingEvent}
                  onClick={() => setIsEventModalOpen(false)}
                  className="px-3.5 py-2 border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSavingEvent}
                  className="px-4 py-2 bg-ink text-white rounded-lg text-xs font-semibold hover:opacity-90 disabled:opacity-50 inline-flex items-center gap-1.5"
                >
                  {isSavingEvent && <Loader2 size={13} className="animate-spin" />}
                  {editingEvent ? 'Simpan Perubahan' : 'Simpan Acara'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}