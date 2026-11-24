import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FileText,
  Download,
  History,
  FileSpreadsheet,
  Edit3,
  BookOpen,
  Loader2,
  Layers,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { exportEditorHtmlToDocx } from '../utils/exportBookDocx';

const bookTemplates = [
  {
    id: 'buku-pengurusan-lengkap',
    title: 'Buku Pengurusan Sekolah (Lengkap)',
    description:
      'Jana dan sunting draf lengkap Buku Pengurusan (Profil Sekolah, Carta Organisasi, Direktori Warga, Jawatankuasa & Takwim) dalam Editor Laras.',
    icon: BookOpen,
    color: 'text-forest',
    bg: 'bg-forest/10',
    border: 'border-forest/20',
    options: ['Sesi 2026/2027', 'Sesi 2025/2026'],
    path: '/book-builder',
    actionText: 'Buka Editor Laras',
  },
  {
    id: 'lampiran-jawatankuasa',
    title: 'Lampiran Senarai Jawatankuasa & Bidang Tugas',
    description:
      'Susun atur khas bahagian Jawatankuasa Pentadbiran, Kurikulum, HEM dan Kokurikulum sedia untuk cetakan DOCX/PDF.',
    icon: Layers,
    color: 'text-sky',
    bg: 'bg-sky/10',
    border: 'border-sky/20',
    options: ['Semua Kategori', 'Kurikulum & HEM Sahaja'],
    path: '/book-builder',
    actionText: 'Sunting dalam Book Builder',
  },
];

function mergeHistoryWithSnapshots(rows: any[], prof: any): any[] {
  const snapshotsObj = (prof?.cover_config as any)?._generation_snapshots || {};
  const uniqueSnapshots = new Map<string, any>();

  Object.values(snapshotsObj).forEach((item: any) => {
    if (item && typeof item === 'object' && item.id && item.name) {
      uniqueSnapshots.set(item.id, item);
    }
  });

  const combined = [...rows];
  uniqueSnapshots.forEach((snap) => {
    const exists = combined.some((r) => r.id === snap.id || r.name === snap.name);
    if (!exists) {
      combined.push({
        id: snap.id,
        name: snap.name,
        type: snap.type || 'docx',
        size: snap.size || '-',
        created_at: snap.created_at || new Date().toISOString(),
        metadata: snap,
      });
    }
  });

  return combined.sort(
    (a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
  );
}

export default function Reports() {
  const navigate = useNavigate();
  const [schoolId, setSchoolId] = useState<string>('');
  const [recentExports, setRecentExports] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [schoolProfile, setSchoolProfile] = useState<any>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>(() =>
    Object.fromEntries(bookTemplates.map((t) => [t.id, t.options[0]]))
  );

  const loadHistoryRows = async (sid: string) => {
    const scoped = await supabase
      .from('document_history')
      .select('*')
      .eq('school_id', sid)
      .order('created_at', { ascending: false })
      .limit(20);

    if (!scoped.error && scoped.data) {
      return scoped.data;
    }

    const fallback = await supabase
      .from('document_history')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);

    return fallback.data || [];
  };

  useEffect(() => {
    let active = true;

    async function fetchExportHistory() {
      setIsLoading(true);
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session) {
          if (active) setIsLoading(false);
          return;
        }

        const { data: userProfile } = await supabase
          .from('profiles')
          .select('school_id')
          .eq('id', session.user.id)
          .maybeSingle();

        const sid = userProfile?.school_id;
        if (!sid) {
          if (active) setIsLoading(false);
          return;
        }

        if (active) setSchoolId(sid);

        const [historyRows, { data: prof }] = await Promise.all([
          loadHistoryRows(sid),
          supabase.from('school_profile').select('*').eq('school_id', sid).limit(1).maybeSingle(),
        ]);

        if (!active) return;

        setRecentExports(mergeHistoryWithSnapshots(historyRows, prof));
        if (prof) {
          setSchoolProfile(prof);
          if (prof.current_session) {
            const sessionOption = `Sesi ${prof.current_session}`;
            setSelectedOptions((prev) => ({
              ...prev,
              'buku-pengurusan-lengkap': bookTemplates[0].options.includes(sessionOption)
                ? sessionOption
                : prev['buku-pengurusan-lengkap'],
            }));
          }
        }
      } finally {
        if (active) setIsLoading(false);
      }
    }

    fetchExportHistory();

    return () => {
      active = false;
    };
  }, []);

  // Live refresh when a new book generation is recorded
  useEffect(() => {
    if (!schoolId) return;

    const channel = supabase
      .channel(`reports-history-${schoolId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'document_history',
        },
        async () => {
          const [rows, { data: prof }] = await Promise.all([
            loadHistoryRows(schoolId),
            supabase.from('school_profile').select('*').eq('school_id', schoolId).limit(1).maybeSingle(),
          ]);
          if (prof) setSchoolProfile(prof);
          setRecentExports(mergeHistoryWithSnapshots(rows, prof));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [schoolId]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ms-MY', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getSnapshotForHistory = (file: any) => {
    const profileSnapshots = (schoolProfile?.cover_config as any)?._generation_snapshots || {};
    return file?.metadata || profileSnapshots[file.id] || profileSnapshots[file.name] || {};
  };

  const handleOpenHistoryVersion = (file: any) => {
    navigate(`/book-builder?historyId=${encodeURIComponent(file.id)}`);
  };

  const handleDownloadHistoryVersion = async (e: React.MouseEvent, file: any) => {
    e.stopPropagation();
    const meta = getSnapshotForHistory(file);
    const snapshotHtml = meta?.html_snapshot || file?.content || schoolProfile?.book_draft;
    const snapshotCover = meta?.cover_config || schoolProfile?.cover_config;

    if (file.type === 'docx' && snapshotHtml) {
      setDownloadingId(file.id);
      try {
        await exportEditorHtmlToDocx(snapshotHtml, {
          ...(schoolProfile || {}),
          ...(meta?.session ? { current_session: meta.session } : {}),
          cover_config: snapshotCover,
        });
      } finally {
        setDownloadingId(null);
      }
      return;
    }

    navigate(
      `/book-builder?historyId=${encodeURIComponent(file.id)}${
        file.type === 'pdf' ? '&autoPrint=1' : ''
      }`
    );
  };

  return (
    <div className="max-w-384 mx-auto space-y-4 lg:space-y-6 relative">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 px-1">
        <div>
          <h2 className="text-2xl sm:text-3xl font-semibold text-ink tracking-tight">
            Janaan Buku Pengurusan
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Susun kandungan, sunting susun atur rasmi dan eksport Buku Pengurusan Sekolah ke format DOCX atau PDF.
          </p>
        </div>

        <Link
          to="/book-builder"
          className="bg-ink hover:opacity-90 text-white rounded-lg font-medium h-9 px-4 text-xs flex items-center gap-1.5 transition-all shrink-0"
        >
          <Edit3 size={14} />
          Buka Book Builder
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
        <div className="lg:col-span-2 space-y-3">
          <h3 className="text-sm font-semibold text-ink px-1">Templat Penerbitan Buku</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {bookTemplates.map((tpl) => {
              const Icon = tpl.icon;
              const chosenOption = selectedOptions[tpl.id] || tpl.options[0];
              const targetUrl = `${tpl.path}?template=${encodeURIComponent(
                tpl.id
              )}&session=${encodeURIComponent(chosenOption)}`;

              return (
                <div
                  key={tpl.id}
                  className="p-5 bg-white rounded-xl border border-slate-200 flex flex-col justify-between hover:border-slate-300 transition-colors"
                >
                  <div>
                    <div className="flex items-start gap-3.5 mb-3">
                      <div
                        className={`w-10 h-10 rounded-lg ${tpl.bg} ${tpl.border} border flex items-center justify-center ${tpl.color} shrink-0`}
                      >
                        <Icon size={18} strokeWidth={2} />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-sm font-semibold text-ink leading-tight mb-1">
                          {tpl.title}
                        </h4>
                        <p className="text-xs text-slate-500 leading-relaxed">{tpl.description}</p>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 mt-2 border-t border-slate-100">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                      Sesi Penerbitan
                    </label>
                    <select
                      value={chosenOption}
                      onChange={(e) =>
                        setSelectedOptions((prev) => ({ ...prev, [tpl.id]: e.target.value }))
                      }
                      className="w-full bg-slate-50 border border-slate-200 text-ink font-medium text-xs rounded-lg px-3 py-2 outline-none focus:border-ink/40 transition-all cursor-pointer mb-3"
                    >
                      {tpl.options.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>

                    <Link
                      to={targetUrl}
                      className="w-full flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-ink bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg transition-colors"
                    >
                      <Edit3 size={14} />
                      {tpl.actionText}
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="lg:col-span-1 space-y-3">
          <h3 className="text-sm font-semibold text-ink px-1">Sejarah Penerbitan Buku</h3>

          <div className="bg-white rounded-xl border border-slate-200 p-5 flex flex-col min-h-88">
            <div className="flex items-center justify-between text-slate-500 mb-4 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <History size={16} className="text-slate-400" />
                <span className="text-xs font-semibold text-ink">Versi Terkini</span>
              </div>
              <span className="text-[10px] bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md font-bold text-slate-600">
                {recentExports.length} Rekod
              </span>
            </div>

            {isLoading ? (
              <div className="flex flex-col items-center justify-center flex-1 text-ink gap-2">
                <Loader2 size={20} className="animate-spin text-ink" />
                <p className="text-xs font-medium text-slate-500">Memuatkan sejarah...</p>
              </div>
            ) : recentExports.length === 0 ? (
              <div className="flex flex-col items-center justify-center flex-1 text-slate-400 gap-2">
                <FileText size={28} className="text-slate-300" />
                <p className="text-xs font-medium">Tiada rekod janaan buku.</p>
              </div>
            ) : (
              <div className="space-y-3 flex-1 overflow-y-auto pr-1">
                {recentExports.map((file) => {
                  const meta = getSnapshotForHistory(file);
                  const tooltipParts = [
                    meta.school_name,
                    meta.session ? `Sesi ${meta.session}` : null,
                    meta.generated_by ? `Dijana oleh ${meta.generated_by}` : null,
                    file.created_at ? formatDate(file.created_at) : null,
                  ].filter(Boolean);

                  return (
                    <div
                      key={file.id}
                      onClick={() => handleOpenHistoryVersion(file)}
                      title={
                        tooltipParts.length > 0
                          ? `${tooltipParts.join(' • ')} — Klik untuk buka dalam Book Builder`
                          : 'Klik untuk buka atau semak versi janaan ini dalam Book Builder'
                      }
                      className="flex items-start gap-3 group cursor-pointer p-1.5 rounded-lg hover:bg-slate-50 transition-colors"
                    >
                      <div className="w-8 h-8 rounded-md bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500 shrink-0">
                        {file.type === 'pdf' ? (
                          <FileText size={16} />
                        ) : (
                          <FileSpreadsheet size={16} className="text-forest" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-ink truncate group-hover:opacity-75 transition-opacity">
                          {file.name}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] font-medium text-slate-400 bg-slate-100 px-1.5 py-0.2 rounded">
                            {file.size}
                          </span>
                          <span className="text-[10px] text-slate-400 truncate">
                            {formatDate(file.created_at)}
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => handleDownloadHistoryVersion(e, file)}
                        disabled={downloadingId === file.id}
                        title="Muat turun semula versi ini"
                        className="text-slate-400 hover:text-ink transition-colors opacity-0 group-hover:opacity-100 p-1 disabled:opacity-50"
                      >
                        {downloadingId === file.id ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          <Download size={14} />
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}