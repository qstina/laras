import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  AlertTriangle,
  Plus,
  Upload,
  Loader2,
  Video,
  MapPin,
  Clock,
  UserX,
  ChevronRight,
  CheckCircle2,
  ClipboardList,
  Pencil,
  Trash2,
  X,
  AlertCircle,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import MonthCalendar, { toKey, type CalendarEvent } from '../components/MonthCalendar';

type StaffRow = {
  id: string | number;
  name: string;
  jawatan?: string;
  gred?: string;
  type?: string;
  total: number;
  committeeCount: number;
  categories: string[];
  issues: string[];
};

type EventTone = 'forest' | 'violet' | 'amber' | 'coral';

type SchoolEventRow = {
  id: string;
  school_id: string;
  created_by: string;
  title: string;
  event_date: string;
  start_time: string | null;
  end_time: string | null;
  description: string | null;
  tone: EventTone;
};

function initials(name?: string) {
  if (!name) return '–';
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Selamat pagi';
  if (h < 15) return 'Selamat tengah hari';
  if (h < 19) return 'Selamat petang';
  return 'Selamat malam';
}

function formatTimeShort(t?: string | null) {
  if (!t) return '';
  return t.slice(0, 5);
}

function Cross({ className = '' }: { className?: string }) {
  return (
    <div className={`absolute pointer-events-none opacity-[0.03] ${className}`} aria-hidden>
      <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-1/3 rounded-lg bg-current" />
      <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-1/3 rounded-lg bg-current" />
    </div>
  );
}
function Disc({ className = '' }: { className?: string }) {
  return (
    <div
      className={`absolute rounded-full pointer-events-none opacity-[0.03] bg-current ${className}`}
      aria-hidden
    />
  );
}
function Ring({ className = '' }: { className?: string }) {
  return (
    <div
      className={`absolute rounded-full pointer-events-none opacity-[0.03] border-10 border-current ${className}`}
      aria-hidden
    />
  );
}

function Stat({
  value,
  label,
  caption,
  light = false,
}: {
  value: number | string;
  label: string;
  caption?: string;
  light?: boolean;
}) {
  return (
    <div className="min-w-0 flex flex-col justify-end">
      <p className="flex items-baseline gap-1.5">
        <span className={`font-semibold text-2xl tracking-tight ${light ? 'text-ink' : 'text-ink'}`}>
          {value}
        </span>
      </p>
      <p className={`font-medium text-xs mt-0.5 ${light ? 'text-ink/70' : 'text-slate-500'}`}>
        {label}
      </p>
      {caption && (
        <p
          className={`text-[10px] font-semibold uppercase tracking-wider mt-1.5 ${
            light ? 'text-ink/60' : 'text-slate-400'
          }`}
        >
          {caption}
        </p>
      )}
    </div>
  );
}

export default function AdminDashboard() {
  const [isLoading, setIsLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [stats, setStats] = useState({ staff: 0, committees: 0, highWorkload: 0, readiness: 0 });
  const [readinessDetails, setReadinessDetails] = useState({
    staffComplete: 0,
    commsAssigned: 0,
    totalStaff: 0,
    totalComms: 0,
  });
  const [workloadBalance, setWorkloadBalance] = useState({
    tinggi: 0,
    seimbang: 0,
    rendah: 0,
    tiada: 0,
  });
  const [categoryData, setCategoryData] = useState<
    { name: string; Purata: number; Share: number }[]
  >([]);
  const [attentionList, setAttentionList] = useState<StaffRow[]>([]);
  const [attentionCount, setAttentionCount] = useState(0);
  const [selectedStaffId, setSelectedStaffId] = useState<string | number | null>(null);

  const [viewMonth, setViewMonth] = useState(
    () => new Date(new Date().getFullYear(), new Date().getMonth(), 1)
  );
  const [selectedDate, setSelectedDate] = useState(() => new Date());

  // Persisted School Calendar Events
  const [schoolEvents, setSchoolEvents] = useState<SchoolEventRow[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<SchoolEventRow | null>(null);
  const [eventTitle, setEventTitle] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventStartTime, setEventStartTime] = useState('');
  const [eventEndTime, setEventEndTime] = useState('');
  const [eventDescription, setEventDescription] = useState('');
  const [eventTone, setEventTone] = useState<EventTone>('forest');
  const [isSavingEvent, setIsSavingEvent] = useState(false);
  const [deletingEventId, setDeletingEventId] = useState<string | null>(null);
  const [eventError, setEventError] = useState<string | null>(null);

  async function fetchSchoolEvents(schoolId: string) {
    const { data, error } = await supabase
      .from('school_events')
      .select('*')
      .eq('school_id', schoolId)
      .order('event_date', { ascending: true })
      .order('start_time', { ascending: true, nullsFirst: false });

    if (!error && data) {
      setSchoolEvents(data as SchoolEventRow[]);
    }
  }

  useEffect(() => {
    async function fetchDashboardData() {
      setIsLoading(true);
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        let schoolId: string | null = null;
        if (session?.user) {
          const { data: userProfile } = await supabase
            .from('profiles')
            .select('id, full_name, school_id, role')
            .eq('id', session.user.id)
            .single();
          if (userProfile) {
            setProfile(userProfile);
            schoolId = userProfile.school_id;
          }
        }

        const staffQuery = supabase.from('staff').select('name, jawatan, gred, type');
        const commQuery = supabase.from('committees').select('id, staff_committees(id)');
        const workloadQuery = supabase
          .from('staff')
          .select(
            `id, name, jawatan, gred, type, staff_committees ( workload_weightage, committees ( category ) )`
          );

        if (schoolId) {
          staffQuery.eq('school_id', schoolId);
          commQuery.eq('school_id', schoolId);
          workloadQuery.eq('school_id', schoolId);
        }

        const [{ data: staffList }, { data: commList }, { data: workload }] = await Promise.all([
          staffQuery,
          commQuery,
          workloadQuery,
        ]);

        if (schoolId) {
          await fetchSchoolEvents(schoolId);
        }

        const totalStaff = staffList?.length || 0;
        const validStaff = staffList?.filter((s) => s.jawatan && s.gred && s.type) || [];

        const totalComms = commList?.length || 0;
        const validComms =
          commList?.filter((c) => c.staff_committees && c.staff_committees.length > 0) || [];

        const staffReadiness = totalStaff > 0 ? (validStaff.length / totalStaff) * 100 : 0;
        const commReadiness = totalComms > 0 ? (validComms.length / totalComms) * 100 : 0;
        const overallReadiness =
          totalStaff > 0 && totalComms > 0 ? Math.round((staffReadiness + commReadiness) / 2) : 0;

        let tinggi = 0,
          seimbang = 0,
          rendah = 0,
          tiada = 0;
        let totalSystemWeight = 0;
        const catTotals: Record<string, number> = {
          Kurikulum: 0,
          'Hal Ehwal Murid': 0,
          Kokurikulum: 0,
          Pentadbiran: 0,
        };
        const rows: StaffRow[] = [];

        workload?.forEach((s: any) => {
          let total = 0;
          const cats = new Set<string>();
          const links = s.staff_committees || [];

          if (links.length === 0) {
            tiada++;
          } else {
            links.forEach((sc: any) => {
              const weight = sc.workload_weightage || 0;
              const cat = sc.committees?.category;
              total += weight;
              totalSystemWeight += weight;
              if (cat) {
                cats.add(cat);
                if (cat in catTotals) catTotals[cat] += weight;
              }
            });
            if (total > 85) tinggi++;
            else if (total < 40) rendah++;
            else seimbang++;
          }

          const issues: string[] = [];
          if (!s.jawatan) issues.push('Jawatan kosong');
          if (!s.gred) issues.push('Gred kosong');
          if (links.length === 0) issues.push('Tiada jawatankuasa');
          if (total > 85) issues.push('Beban tinggi');

          rows.push({
            id: s.id,
            name: s.name,
            jawatan: s.jawatan,
            gred: s.gred,
            type: s.type,
            total,
            committeeCount: links.length,
            categories: Array.from(cats),
            issues,
          });
        });

        const needing = rows
          .filter((r) => r.issues.length > 0)
          .sort((a, b) => b.issues.length - a.issues.length || b.total - a.total);
        const fallback = [...rows].sort((a, b) => b.total - a.total);
        const list = (needing.length > 0 ? needing : fallback).slice(0, 6);

        setStats({
          staff: totalStaff,
          committees: totalComms,
          highWorkload: tinggi,
          readiness: overallReadiness,
        });
        setReadinessDetails({
          staffComplete: validStaff.length,
          commsAssigned: validComms.length,
          totalStaff,
          totalComms,
        });
        setWorkloadBalance({ tinggi, seimbang, rendah, tiada });
        setAttentionList(list);
        setAttentionCount(needing.length);
        setSelectedStaffId(list[0]?.id ?? null);

        const pct = (n: number) =>
          totalSystemWeight ? Math.round((n / totalSystemWeight) * 100) : 0;
        const avg = (n: number) => (totalStaff ? Math.round(n / totalStaff) : 0);
        setCategoryData([
          {
            name: 'Kurikulum',
            Purata: avg(catTotals['Kurikulum']),
            Share: pct(catTotals['Kurikulum']),
          },
          {
            name: 'HEM',
            Purata: avg(catTotals['Hal Ehwal Murid']),
            Share: pct(catTotals['Hal Ehwal Murid']),
          },
          {
            name: 'Koko',
            Purata: avg(catTotals['Kokurikulum']),
            Share: pct(catTotals['Kokurikulum']),
          },
          {
            name: 'Admin',
            Purata: avg(catTotals['Pentadbiran']),
            Share: pct(catTotals['Pentadbiran']),
          },
        ]);
      } catch (error) {
        console.error('Failed to load dashboard data', error);
      }
      setIsLoading(false);
    }
    fetchDashboardData();
  }, []);

  // Map persisted DB events into MonthCalendar's CalendarEvent format
  const calendarEvents: CalendarEvent[] = useMemo(
    () =>
      schoolEvents.map((ev) => ({
        date: ev.event_date,
        label: ev.title,
        tone: (ev.tone || 'forest') as CalendarEvent['tone'],
      })),
    [schoolEvents]
  );

  const selectedDateKey = toKey(selectedDate);
  const selectedDayEvents = useMemo(
    () => schoolEvents.filter((ev) => ev.event_date === selectedDateKey),
    [schoolEvents, selectedDateKey]
  );

  const openAddModal = () => {
    setEditingEvent(null);
    setEventTitle('');
    setEventDate(selectedDateKey);
    setEventStartTime('');
    setEventEndTime('');
    setEventDescription('');
    setEventTone('forest');
    setEventError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (ev: SchoolEventRow) => {
    setEditingEvent(ev);
    setEventTitle(ev.title);
    setEventDate(ev.event_date);
    setEventStartTime(formatTimeShort(ev.start_time));
    setEventEndTime(formatTimeShort(ev.end_time));
    setEventDescription(ev.description || '');
    setEventTone((ev.tone || 'forest') as EventTone);
    setEventError(null);
    setIsModalOpen(true);
  };

  const handleSaveEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.school_id || !profile?.id) return;

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
        school_id: profile.school_id,
        title: cleanTitle,
        event_date: eventDate,
        start_time: eventStartTime ? `${eventStartTime}:00` : null,
        end_time: eventEndTime ? `${eventEndTime}:00` : null,
        description: eventDescription.trim() || null,
        tone: eventTone,
      };

      if (editingEvent) {
        const { error } = await supabase
          .from('school_events')
          .update(payload)
          .eq('id', editingEvent.id)
          .eq('school_id', profile.school_id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('school_events').insert({
          ...payload,
          created_by: profile.id,
        });
        if (error) throw error;
      }

      const [y, m, d] = eventDate.split('-').map(Number);
      if (y && m && d) {
        setSelectedDate(new Date(y, m - 1, d));
        setViewMonth(new Date(y, m - 1, 1));
      }

      await fetchSchoolEvents(profile.school_id);
      setIsModalOpen(false);
    } catch (err: any) {
      setEventError(err?.message || 'Gagal menyimpan acara. Sila cuba semula.');
    } finally {
      setIsSavingEvent(false);
    }
  };

  const handleDeleteEvent = async (ev: SchoolEventRow) => {
    if (!profile?.school_id || deletingEventId) return;
    setDeletingEventId(ev.id);

    try {
      const { error } = await supabase
        .from('school_events')
        .delete()
        .eq('id', ev.id)
        .eq('school_id', profile.school_id);
      if (error) throw error;
      await fetchSchoolEvents(profile.school_id);
    } catch (err) {
      console.error('Failed to delete event', err);
    } finally {
      setDeletingEventId(null);
    }
  };

  const canModifyEvent = (ev: SchoolEventRow) =>
    profile?.role === 'admin' || ev.created_by === profile?.id;

  const firstName = profile?.full_name?.split(' ')[0] || 'Admin';
  const maxCategory = Math.max(...categoryData.map((item) => item.Purata), 8);
  const selectedStaff = attentionList.find((s) => s.id === selectedStaffId) || attentionList[0];

  const isStaffComplete =
    readinessDetails.totalStaff > 0 &&
    readinessDetails.staffComplete === readinessDetails.totalStaff;
  const isCommsComplete =
    readinessDetails.totalComms > 0 &&
    readinessDetails.commsAssigned === readinessDetails.totalComms;

  const summary =
    stats.staff === 0
      ? 'Mulakan dengan menambah staf dan jawatankuasa untuk membina buku pengurusan sekolah.'
      : `${stats.staff} warga sekolah dalam sistem. ${
          attentionCount > 0 ? `${attentionCount} staf perlu disemak` : 'Semua maklumat staf kemas'
        }${stats.highWorkload > 0 ? `, ${stats.highWorkload} berbeban tinggi.` : '.'}`;

  const vibrantCategoryColors = ['bg-violet', 'bg-sky', 'bg-amber', 'bg-rose'];

  let donutOffset = 0;
  const workloadSegments = [
    { label: 'Tiada', value: workloadBalance.tiada, color: '#e2e8f0', dot: 'bg-slate-200' },
    { label: 'Rendah', value: workloadBalance.rendah, color: '#3BA0E6', dot: 'bg-sky' },
    { label: 'Seimbang', value: workloadBalance.seimbang, color: '#187A54', dot: 'bg-forest' },
    { label: 'Tinggi', value: workloadBalance.tinggi, color: '#F472B6', dot: 'bg-rose' },
  ].filter((s) => s.value > 0);

  if (isLoading) {
    return (
      <div className="flex h-full min-h-[60vh] items-center justify-center text-slate-400">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
          <p className="text-sm font-medium">Memuatkan ruang kerja...</p>
        </div>
      </div>
    );
  }

  const steps = [
    {
      label: 'Profil staf',
      detail: `${readinessDetails.staffComplete} / ${readinessDetails.totalStaff} lengkap`,
      done: isStaffComplete,
      active: !isStaffComplete,
    },
    {
      label: 'Jawatankuasa',
      detail: `${readinessDetails.commsAssigned} / ${readinessDetails.totalComms} diagihkan`,
      done: isCommsComplete,
      active: isStaffComplete && !isCommsComplete,
    },
    {
      label: 'Sedia dijana',
      detail: 'Bersedia untuk dicetak',
      done: stats.readiness === 100,
      active: false,
    },
  ];

  const loadTone = (total: number) => (total > 85 ? 'bg-rose' : total < 40 ? 'bg-sky' : 'bg-forest');

  return (
    <div className="max-w-384 mx-auto grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6 pb-6">
      {/* ================= LEFT / MAIN ================= */}
      <div className="lg:col-span-8 xl:col-span-9 min-w-0 space-y-4 lg:space-y-6">
        {/* Greeting */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-3 px-1">
          <div className="min-w-0">
            <h1 className="text-2xl sm:text-3xl font-semibold text-ink tracking-tight">
              {greeting()}, {firstName}
            </h1>
            <p className="text-sm text-slate-500 mt-1 max-w-xl">{summary}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Link
              to="/committees"
              className="bg-ink hover:opacity-90 text-white rounded-lg font-medium h-9 px-4 text-xs flex items-center gap-1.5 transition-all"
            >
              <Plus size={14} /> Tambah projek
            </Link>
            <Link
              to="/book-builder"
              className="bg-white border border-slate-200 text-ink hover:bg-slate-50 rounded-lg font-medium h-9 px-4 text-xs flex items-center gap-1.5 transition-colors"
            >
              <Upload size={14} /> Jana buku
            </Link>
          </div>
        </div>

        {/* Row 1: staff overview + category weighting */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 lg:gap-6">
          <section className="md:col-span-2 relative overflow-hidden bg-white border border-slate-200 rounded-xl p-4 lg:p-5 flex flex-col">
            <h2 className="text-sm font-semibold text-ink mb-1">Beban Tugas</h2>
            <p className="text-[11px] text-slate-500 mb-2">Agihan kapasiti kerja warga sekolah</p>

            <div className="flex-1 flex flex-col items-center justify-center">
              <div className="relative w-32 h-32 lg:w-40 lg:h-40">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                  {stats.staff === 0 ? (
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="none"
                      stroke="#f1f5f9"
                      strokeWidth="12"
                    />
                  ) : (
                    workloadSegments.map((seg) => {
                      const circ = 2 * Math.PI * 40;
                      const length = (seg.value / Math.max(stats.staff, 1)) * circ;
                      const dash = Math.max(
                        0.1,
                        length - (workloadSegments.length > 1 ? 14 : 0)
                      );
                      const offset = donutOffset;
                      donutOffset += length;

                      return (
                        <circle
                          key={seg.label}
                          cx="50"
                          cy="50"
                          r="40"
                          fill="none"
                          stroke={seg.color}
                          strokeWidth="12"
                          strokeLinecap="round"
                          strokeDasharray={`${dash} ${circ}`}
                          strokeDashoffset={-offset}
                          className="transition-all duration-1000 ease-out"
                        />
                      );
                    })
                  )}
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl lg:text-3xl font-bold text-ink tracking-tight">
                    {stats.staff}
                  </span>
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mt-0.5">
                    Warga
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 mt-4">
              {workloadSegments.map((seg) => (
                <div key={seg.label} className="flex items-center gap-1.5">
                  <span className={`w-2.5 h-2.5 rounded-full ${seg.dot}`} />
                  <span className="text-[11px] font-medium text-slate-600">{seg.label}</span>
                  <span className="text-[11px] font-bold text-ink ml-0.5">{seg.value}</span>
                </div>
              ))}
              {workloadSegments.length === 0 && (
                <span className="text-[11px] font-medium text-slate-400">Tiada data</span>
              )}
            </div>
          </section>

          <section className="md:col-span-3 relative overflow-hidden bg-white border border-slate-200 rounded-xl p-4 lg:p-5 min-h-56 flex flex-col">
            <Ring className="w-36 h-36 -right-10 -top-12 text-ink" />
            <div className="relative z-10 flex-1 flex flex-col">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <h2 className="text-sm font-semibold text-ink">Pemberatan tugas</h2>
                  <p className="text-xs text-slate-500 mt-0.5">Purata mata beban setiap staf</p>
                </div>
                <Link
                  to="/analytics"
                  className="shrink-0 text-xs font-medium text-ink bg-slate-100 px-3 py-1.5 rounded-lg hover:bg-slate-200 transition-colors"
                >
                  Analisis
                </Link>
              </div>
              <div className="mt-auto flex items-end justify-between gap-4 h-28">
                {categoryData.map((item, index) => {
                  const height = Math.max(15, Math.round((item.Purata / maxCategory) * 100));
                  return (
                    <div
                      key={item.name}
                      className="flex-1 h-full flex flex-col items-center justify-end gap-1.5"
                    >
                      <span className="text-xs font-semibold text-ink">{item.Purata}</span>
                      <div
                        className={`w-full max-w-12 rounded-sm ${
                          vibrantCategoryColors[index % vibrantCategoryColors.length]
                        }`}
                        style={{ height: `${height}%` }}
                      />
                      <span className="text-[11px] font-medium text-slate-600 mt-0.5">
                        {item.name}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        </div>

        {/* Row 2: book readiness, committees, high workload */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6">
          <section className="relative overflow-hidden rounded-xl bg-ink text-white p-4 lg:p-5">
            <Disc className="w-28 h-28 -right-8 -bottom-10 text-white" />
            <div className="relative z-10">
              <div className="flex items-start justify-between">
                <h2 className="text-sm font-semibold text-slate-100">Buku pengurusan</h2>
                <span className="text-2xl font-semibold leading-none">{stats.readiness}%</span>
              </div>
              <div className="h-2 rounded-sm bg-white/10 overflow-hidden mt-4">
                <div
                  className="h-full rounded-sm bg-sky transition-all"
                  style={{ width: `${Math.max(stats.readiness, 4)}%` }}
                />
              </div>
              <ul className="mt-4 space-y-2.5">
                {steps.map((step) => (
                  <li key={step.label} className="flex items-center gap-2.5">
                    <span
                      className={`w-4 h-4 rounded-md flex items-center justify-center shrink-0 ${
                        step.done
                          ? 'bg-forest text-white'
                          : step.active
                            ? 'bg-white/20 text-white'
                            : 'bg-white/5 text-white/30'
                      }`}
                    >
                      {step.done ? (
                        <CheckCircle2 size={10} strokeWidth={3} />
                      ) : (
                        <span className="w-1.5 h-1.5 rounded-sm bg-current" />
                      )}
                    </span>
                    <div className="min-w-0">
                      <p
                        className={`text-xs font-medium leading-none ${
                          step.done || step.active ? 'text-white' : 'text-slate-400'
                        }`}
                      >
                        {step.label}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          <section className="relative overflow-hidden rounded-xl bg-amber p-4 lg:p-5 text-ink flex flex-col">
            <Cross className="w-16 h-16 -right-3 -bottom-3 -rotate-12 text-ink" />
            <div className="relative z-10 flex-1 flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold tracking-wide text-ink/80">Jawatankuasa</h2>
                <div className="w-6 h-6 rounded-md bg-white/40 flex items-center justify-center">
                  <ClipboardList size={12} className="text-ink" />
                </div>
              </div>
              <div className="flex gap-4 mb-4">
                <Stat value={stats.committees} label="Jumlah" light />
                <Stat value={readinessDetails.commsAssigned} label="Diagih" light />
              </div>
              <Link
                to="/committees"
                className="mt-auto inline-flex items-center justify-center gap-1.5 text-xs font-medium text-ink bg-transparent border border-ink/20 py-2 rounded-lg hover:bg-ink/5 transition-colors"
              >
                Urus tugasan
              </Link>
            </div>
          </section>

          <section className="relative overflow-hidden bg-white border border-slate-200 rounded-xl p-4 lg:p-5 flex flex-col">
            <div className="relative z-10 flex-1">
              <div className="flex items-center gap-2 mb-3">
                <h2 className="text-sm font-semibold text-ink">Beban tinggi</h2>
                <AlertTriangle size={14} className="text-rose" />
              </div>
              <div className="flex items-end gap-2">
                <span className="text-3xl font-semibold leading-none text-rose">
                  {stats.highWorkload}
                </span>
                <span className="text-xs font-medium text-slate-500 mb-1">staf ({'>'}85 mata)</span>
              </div>
              <p className="text-xs text-slate-500 mt-2.5 leading-relaxed">
                {stats.highWorkload > 0
                  ? 'Pertimbangkan mengagih semula tugasan untuk mengimbangi beban.'
                  : 'Tiada staf melebihi had beban buat masa ini.'}
              </p>
            </div>
            {stats.highWorkload > 0 && (
              <div className="mt-3">
                <Link
                  to="/workload"
                  className="inline-flex items-center gap-1 text-xs font-medium text-rose hover:brightness-90 transition-all"
                >
                  Semak beban <ChevronRight size={14} />
                </Link>
              </div>
            )}
          </section>
        </div>

        {/* Row 3: attention list + detail panel */}
        <section>
          <div className="flex items-center justify-between mb-3 px-1">
            <h2 className="text-base font-semibold text-ink tracking-tight">
              {attentionCount > 0 ? 'Staf perlu perhatian' : 'Beban staf tertinggi'}
              <span className="ml-2 text-slate-500 font-medium text-sm">
                ({attentionCount > 0 ? attentionCount : attentionList.length})
              </span>
            </h2>
            <Link
              to="/teachers"
              className="text-xs font-medium text-slate-600 bg-white border border-slate-200 px-3 py-1.5 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Direktori pasukan
            </Link>
          </div>

          {attentionList.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-xl text-center py-8 text-slate-400">
              <UserX className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm font-medium">Tiada staf direkodkan.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-5 gap-0 bg-white border border-slate-200 rounded-xl overflow-hidden min-w-0">
              {/* list */}
              <div className="xl:col-span-2 flex flex-col border-b xl:border-b-0 xl:border-r border-slate-100 min-w-0">
                {attentionList.map((member) => {
                  const active = member.id === selectedStaff?.id;
                  return (
                    <button
                      key={member.id}
                      type="button"
                      onClick={() => setSelectedStaffId(member.id)}
                      className={`w-full flex items-center gap-2.5 px-4 py-3.5 text-left transition-colors border-l-2 ${
                        active
                          ? 'bg-slate-50 border-ink'
                          : 'bg-white border-transparent hover:bg-slate-50'
                      }`}
                    >
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-medium shrink-0 ${
                          active ? 'bg-ink/10 text-ink' : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {initials(member.name)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p
                          className={`text-sm font-medium truncate ${
                            active ? 'text-ink' : 'text-slate-700'
                          }`}
                        >
                          {member.name}
                        </p>
                        <p className="text-[11px] text-slate-500 truncate mt-0.5">
                          {member.jawatan || 'Jawatan tidak ditetapkan'}
                        </p>
                      </div>
                      {member.issues.length > 0 ? (
                        <span
                          className={`text-[11px] font-medium px-2 py-0.5 rounded-md shrink-0 ${
                            active ? 'bg-rose/10 text-rose' : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {member.issues.length} isu
                        </span>
                      ) : (
                        <span className="text-[11px] font-medium px-2 py-0.5 rounded-md shrink-0 bg-slate-100 text-slate-500">
                          {member.total}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* detail */}
              {selectedStaff && (
                <div className="xl:col-span-3 bg-white p-5 lg:p-6 relative flex flex-col min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-base font-semibold text-ink truncate">
                        {selectedStaff.name}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        {[selectedStaff.jawatan, selectedStaff.gred, selectedStaff.type]
                          .filter(Boolean)
                          .join(' • ') || 'Maklumat belum lengkap'}
                      </p>
                    </div>
                    <span className="shrink-0 px-2.5 py-1 rounded-md bg-slate-100 text-ink text-xs font-semibold border border-slate-200">
                      {selectedStaff.total} mata
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-2 mt-4">
                    {selectedStaff.issues.length > 0 ? (
                      selectedStaff.issues.map((issue) => (
                        <span
                          key={issue}
                          className="px-2 py-1 rounded-md bg-rose/10 text-rose border border-rose/20 text-[11px] font-medium"
                        >
                          {issue}
                        </span>
                      ))
                    ) : (
                      <span className="px-2 py-1 rounded-md bg-forest-soft text-forest border border-forest/20 text-[11px] font-medium">
                        Maklumat lengkap
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-x-4 gap-y-3 mt-6 border-t border-slate-100 pt-5">
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                        Jawatankuasa
                      </p>
                      <p className="text-sm font-medium text-ink mt-0.5">
                        {selectedStaff.committeeCount} tugasan
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                        Kategori
                      </p>
                      <p className="text-sm font-medium text-ink mt-0.5 leading-snug">
                        {selectedStaff.categories.length > 0
                          ? selectedStaff.categories.join(', ')
                          : '—'}
                      </p>
                    </div>
                  </div>

                  <div className="mt-auto pt-6">
                    <div className="flex items-center justify-between text-[11px] font-medium text-slate-500 mb-1.5">
                      <span>Beban kerja</span>
                      <span className="text-ink">{selectedStaff.total} / 85</span>
                    </div>
                    <div className="h-1.5 rounded-sm bg-slate-100 overflow-hidden">
                      <div
                        className={`h-full rounded-sm transition-all ${loadTone(
                          selectedStaff.total
                        )}`}
                        style={{
                          width: `${Math.min(100, Math.round((selectedStaff.total / 85) * 100))}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </section>
      </div>

      {/* ================= RIGHT RAIL ================= */}
      <aside className="lg:col-span-4 xl:col-span-3 min-w-0 space-y-4 lg:space-y-6">
        <section className="bg-white border border-slate-200 rounded-xl p-4 lg:p-5">
          <MonthCalendar
            month={viewMonth}
            selectedDate={selectedDate}
            events={calendarEvents}
            onPrev={() =>
              setViewMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))
            }
            onNext={() =>
              setViewMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))
            }
            onSelectDate={setSelectedDate}
          />
        </section>

        <section className="bg-white border border-slate-200 rounded-xl p-4 lg:p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-sm font-semibold text-ink">
                {selectedDate.toLocaleDateString('ms-MY', { day: 'numeric', month: 'long' })}
              </h2>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {selectedDate.toLocaleDateString('ms-MY', { weekday: 'long' })}
              </p>
            </div>
            <button
              type="button"
              onClick={openAddModal}
              title="Tambah acara pada tarikh ini"
              className="w-7 h-7 rounded-md border border-slate-200 flex items-center justify-center text-ink hover:bg-slate-50 transition-colors"
            >
              <span className="sr-only">Tambah acara</span>
              <Plus size={14} />
            </button>
          </div>

          {selectedDayEvents.length > 0 ? (
            <div className="space-y-2">
              {selectedDayEvents.map((ev) => {
                const iconBase =
                  ev.tone === 'coral'
                    ? 'text-coral bg-coral/10 border-coral/10'
                    : ev.tone === 'violet'
                      ? 'text-violet bg-violet/10 border-violet/10'
                      : ev.tone === 'amber'
                        ? 'text-amber bg-amber/10 border-amber/10'
                        : 'text-forest bg-forest/10 border-forest/10';

                const timeRange =
                  ev.start_time && ev.end_time
                    ? `${formatTimeShort(ev.start_time)} - ${formatTimeShort(ev.end_time)}`
                    : ev.start_time
                      ? formatTimeShort(ev.start_time)
                      : 'Sepanjang hari';

                return (
                  <div
                    key={ev.id}
                    className="flex items-start gap-3 p-2.5 rounded-lg border border-slate-100 hover:border-slate-200 transition-colors group"
                  >
                    <div
                      className={`w-9 h-9 rounded-md flex items-center justify-center shrink-0 border ${iconBase}`}
                    >
                      {ev.tone === 'coral' ? (
                        <MapPin size={16} />
                      ) : ev.tone === 'violet' ? (
                        <Video size={16} />
                      ) : (
                        <Users size={16} />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-ink leading-snug truncate">
                        {ev.title}
                      </p>
                      <div className="flex items-center gap-1 mt-0.5 text-[11px] text-slate-500">
                        <Clock size={10} />
                        <span>{timeRange}</span>
                      </div>
                      {ev.description && (
                        <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">
                          {ev.description}
                        </p>
                      )}
                    </div>

                    {canModifyEvent(ev) && (
                      <div className="flex items-center gap-0.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => openEditModal(ev)}
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
                );
              })}
            </div>
          ) : (
            <button
              type="button"
              onClick={openAddModal}
              className="w-full rounded-lg border border-dashed border-slate-200 hover:border-slate-300 hover:bg-slate-50/60 py-5 text-center transition-colors"
            >
              <p className="text-[11px] text-slate-400">
                Tiada program rasmi hari ini. Klik + untuk tambah.
              </p>
            </button>
          )}
        </section>

        <section className="bg-white border border-slate-200 rounded-xl p-4 lg:p-5 flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <h2 className="text-sm font-semibold text-ink">Warga sekolah</h2>
            <div className="mt-2 flex items-baseline gap-2">
              <p className="text-2xl font-semibold text-ink leading-none">{stats.staff}</p>
            </div>
          </div>
          <Link
            to="/teachers"
            className="w-9 h-9 rounded-lg border border-slate-200 flex items-center justify-center text-slate-400 hover:bg-slate-50 hover:text-ink transition-colors"
            aria-label="Pasukan"
          >
            <ChevronRight size={16} />
          </Link>
        </section>
      </aside>

      {/* Add / Edit Event Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-ink/40 backdrop-blur-[1px] flex items-center justify-center p-4"
          onClick={() => !isSavingEvent && setIsModalOpen(false)}
        >
          <div
            className="bg-white border border-slate-200 rounded-xl max-w-md w-full p-5 shadow-xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-ink">
                {editingEvent ? 'Sunting Acara Takwim' : 'Tambah Acara Takwim'}
              </h3>
              <button
                type="button"
                disabled={isSavingEvent}
                onClick={() => setIsModalOpen(false)}
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

            <form onSubmit={handleSaveEvent} className="space-y-3">
              <div className="space-y-1">
                <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  Tajuk Acara *
                </label>
                <input
                  type="text"
                  required
                  disabled={isSavingEvent}
                  value={eventTitle}
                  onChange={(e) => setEventTitle(e.target.value)}
                  placeholder="Contoh: Mesyuarat Panitia / Mesyuarat PIBG"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-ink outline-none focus:border-ink/40"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
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
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
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
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
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
                <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  Label Warna
                </label>
                <div className="flex items-center gap-2">
                  {(
                    [
                      { key: 'forest', label: 'Umum', dot: 'bg-forest' },
                      { key: 'violet', label: 'Mesyuarat', dot: 'bg-violet' },
                      { key: 'amber', label: 'Peringatan', dot: 'bg-amber' },
                      { key: 'coral', label: 'Lokasi / Luar', dot: 'bg-coral' },
                    ] as const
                  ).map((t) => (
                    <button
                      key={t.key}
                      type="button"
                      onClick={() => setEventTone(t.key)}
                      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-[11px] font-medium transition-colors ${
                        eventTone === t.key
                          ? 'border-ink bg-slate-50 text-ink'
                          : 'border-slate-200 text-slate-500 hover:bg-slate-50'
                      }`}
                    >
                      <span className={`w-2 h-2 rounded-full ${t.dot}`} />
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  Catatan (Pilihan)
                </label>
                <textarea
                  rows={2}
                  disabled={isSavingEvent}
                  value={eventDescription}
                  onChange={(e) => setEventDescription(e.target.value)}
                  placeholder="Contoh: Bilik Gerakan • Kehadiran semua guru"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-ink outline-none focus:border-ink/40 resize-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  disabled={isSavingEvent}
                  onClick={() => setIsModalOpen(false)}
                  className="px-3.5 py-2 border border-slate-200 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSavingEvent}
                  className="px-4 py-2 bg-ink text-white rounded-lg text-xs font-medium hover:opacity-90 disabled:opacity-50 inline-flex items-center gap-1.5"
                >
                  {isSavingEvent && <Loader2 size={13} className="animate-spin" />}
                  {editingEvent ? 'Simpan Perubahan' : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}