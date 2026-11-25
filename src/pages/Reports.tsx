import { useState, useEffect, useCallback } from 'react';
import {
  FileText,
  Download,
  Eye,
  Clock,
  CheckCircle2,
  Loader2,
  Search,
  BookOpen,
  UserCheck,
  Trash2,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

interface GenerationRecord {
  id: string;
  school_id?: string | null;
  user_id?: string | null;
  title: string;
  file_type: string;
  file_size: string;
  status: string;
  snapshot_json?: any;
  created_at: string;
  creator_name?: string;
}

export default function Reports() {
  const navigate = useNavigate();

  useEffect(() => {
    document.title = 'Sejarah Janaan Buku | LARAS';
  }, []);

  const [history, setHistory] = useState<GenerationRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'ALL' | 'DOCX' | 'PDF'>('ALL');
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);
  const [schoolId, setSchoolId] = useState<string | null>(null);
  const [creatorMap, setCreatorMap] = useState<Record<string, string>>({});

  const resolveCreatorNames = useCallback(
    async (
      records: GenerationRecord[],
      activeSchoolId: string,
      existingMap: Record<string, string>
    ) => {
      const mergedMap = { ...existingMap };
      const missingUserIds = Array.from(
        new Set(
          records
            .map((r) => r.user_id)
            .filter((uid): uid is string => Boolean(uid) && !mergedMap[uid!])
        )
      );

      if (missingUserIds.length > 0) {
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, full_name')
          .eq('school_id', activeSchoolId)
          .in('id', missingUserIds);

        if (profilesData) {
          for (const p of profilesData) {
            if (p.id && p.full_name) {
              mergedMap[p.id] = p.full_name;
            }
          }
          setCreatorMap(mergedMap);
        }
      }

      return records.map((rec) => ({
        ...rec,
        creator_name:
          (rec.user_id && mergedMap[rec.user_id]) ||
          rec.snapshot_json?.generatedByName ||
          'Warga Sekolah',
      }));
    },
    []
  );

  const fetchHistory = useCallback(async () => {
    setIsLoading(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user) {
        setHistory([]);
        setIsLoading(false);
        return;
      }

      setCurrentUserId(session.user.id);

      const { data: userProfile } = await supabase
        .from('profiles')
        .select('id, school_id, role, full_name')
        .eq('id', session.user.id)
        .single();

      if (!userProfile?.school_id) {
        setHistory([]);
        setIsLoading(false);
        return;
      }

      const activeSchoolId = userProfile.school_id;
      setSchoolId(activeSchoolId);
      setCurrentUserRole(userProfile.role || null);

      const { data: schoolMembers } = await supabase
        .from('profiles')
        .select('id, full_name')
        .eq('school_id', activeSchoolId);

      const initialMap: Record<string, string> = {};
      if (schoolMembers) {
        for (const m of schoolMembers) {
          if (m.id && m.full_name) {
            initialMap[m.id] = m.full_name;
          }
        }
      }
      if (userProfile.id && userProfile.full_name) {
        initialMap[userProfile.id] = userProfile.full_name;
      }
      setCreatorMap(initialMap);

      const { data, error } = await supabase
        .from('book_generations')
        .select('*')
        .eq('school_id', activeSchoolId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[LARAS Sejarah Janaan] Query error:', error);
        setHistory([]);
      } else if (data) {
        const enriched = await resolveCreatorNames(
          data as GenerationRecord[],
          activeSchoolId,
          initialMap
        );
        setHistory(enriched);
      }
    } catch (err) {
      console.error('[LARAS Sejarah Janaan] Unexpected error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [resolveCreatorNames]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  useEffect(() => {
    if (!schoolId) return;

    const channel = supabase
      .channel(`school-book-generations-${schoolId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'book_generations',
          filter: `school_id=eq.${schoolId}`,
        },
        async (payload) => {
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const incoming = payload.new as GenerationRecord;
            const [enriched] = await resolveCreatorNames([incoming], schoolId, creatorMap);

            setHistory((prev) => {
              const exists = prev.some((item) => item.id === enriched.id);
              if (exists) {
                return prev.map((item) => (item.id === enriched.id ? enriched : item));
              }
              return [enriched, ...prev];
            });
          } else if (payload.eventType === 'DELETE') {
            const removedId = (payload.old as { id?: string })?.id;
            if (removedId) {
              setHistory((prev) => prev.filter((item) => item.id !== removedId));
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [schoolId, creatorMap, resolveCreatorNames]);

  const handleLoadAndPreview = (item: GenerationRecord) => {
    if (item.snapshot_json) {
      sessionStorage.setItem('laras_restore_snapshot', JSON.stringify(item.snapshot_json));
    }
    navigate('/book-builder?preview=1');
  };

  const handleDownloadAgain = (item: GenerationRecord) => {
    setDownloadingId(item.id);
    if (item.snapshot_json) {
      sessionStorage.setItem('laras_restore_snapshot', JSON.stringify(item.snapshot_json));
    }
    setTimeout(() => {
      setDownloadingId(null);
      navigate(`/book-builder?download=${item.file_type.toLowerCase()}`);
    }, 300);
  };

  const handleDeleteRecord = async (item: GenerationRecord) => {
    if (!schoolId || deletingId) return;
    setDeletingId(item.id);
    try {
      const { error } = await supabase
        .from('book_generations')
        .delete()
        .eq('id', item.id)
        .eq('school_id', schoolId);

      if (!error) {
        setHistory((prev) => prev.filter((rec) => rec.id !== item.id));
      }
    } catch (err) {
      console.error('[LARAS Sejarah Janaan] Delete error:', err);
    } finally {
      setDeletingId(null);
    }
  };

  const filteredHistory = history.filter((item) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      item.title.toLowerCase().includes(q) ||
      (item.creator_name || '').toLowerCase().includes(q);
    const matchesType = filterType === 'ALL' || item.file_type?.toUpperCase() === filterType;
    return matchesSearch && matchesType;
  });

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return (
      d.toLocaleDateString('ms-MY', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }) +
      ' • ' +
      d.toLocaleTimeString('ms-MY', { hour: '2-digit', minute: '2-digit' })
    );
  };

  return (
    <div className="max-w-384 mx-auto pb-8 font-sans">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold text-ink tracking-tight">
            Sejarah Janaan Buku
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Arkib dan rekod buku pengurusan sekolah yang pernah dijana dalam format DOCX dan PDF
            oleh warga sekolah.
          </p>
        </div>

        <button
          onClick={() => navigate('/book-builder')}
          className="bg-ink hover:opacity-90 text-white px-4 py-2 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all self-start md:self-auto"
        >
          <BookOpen size={14} /> Jana Buku Baharu
        </button>
      </div>

      {/* Filters & Search Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-3.5 mb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="text"
            placeholder="Cari tajuk buku atau nama penjanaan guru..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-ink outline-none focus:border-ink/40 focus:bg-white transition-all"
          />
        </div>

        <div className="flex items-center gap-1.5">
          {(['ALL', 'DOCX', 'PDF'] as const).map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                filterType === type
                  ? 'bg-ink text-white'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/80'
              }`}
            >
              {type === 'ALL' ? 'Semua' : type}
            </button>
          ))}
        </div>
      </div>

      {/* History List */}
      {isLoading ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 flex flex-col items-center justify-center text-slate-400 gap-2">
          <Loader2 className="w-6 h-6 animate-spin" />
          <p className="text-xs font-medium">Memuatkan rekod janaan sekolah...</p>
        </div>
      ) : filteredHistory.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-14 text-center">
          <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
            <FileText size={22} />
          </div>
          <h3 className="text-sm font-semibold text-ink">Tiada Rekod Janaan Dijumpai</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {searchQuery || filterType !== 'ALL'
              ? 'Tiada dokumen sepadan dengan carian atau penapis anda.'
              : 'Setiap kali admin atau guru menjana dokumen DOCX atau PDF di Pembina Buku, rekod akan disimpan di sini secara automatik.'}
          </p>
          {!searchQuery && filterType === 'ALL' && (
            <button
              onClick={() => navigate('/book-builder')}
              className="mt-4 px-4 py-2 bg-ink text-white rounded-lg text-xs font-medium hover:opacity-90 transition-opacity"
            >
              Pergi ke Pembina Buku
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100">
          {filteredHistory.map((item) => {
            const isPdf = item.file_type?.toUpperCase() === 'PDF';
            const isMine = Boolean(currentUserId && item.user_id === currentUserId);
            const canDelete = isMine || currentUserRole === 'admin';

            return (
              <div
                key={item.id}
                className="p-4 sm:px-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/70 transition-colors"
              >
                <div className="flex items-start gap-3.5 min-w-0">
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 font-bold text-[10px] border ${
                      isPdf
                        ? 'bg-rose/10 text-rose border-rose/20'
                        : 'bg-sky/10 text-sky border-sky/20'
                    }`}
                  >
                    {item.file_type?.toUpperCase() || 'DOC'}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm font-semibold text-ink truncate">{item.title}</h3>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-forest/10 text-forest text-[10px] font-semibold">
                        <CheckCircle2 size={10} /> {item.status || 'Selesai'}
                      </span>
                    </div>

                    <div className="flex items-center flex-wrap gap-x-3 gap-y-1 mt-1 text-xs text-slate-500">
                      <span className="inline-flex items-center gap-1 text-slate-600 font-medium">
                        <UserCheck size={12} className="text-slate-400" />
                        Dijana oleh{' '}
                        <strong className="font-semibold text-ink">{item.creator_name}</strong>
                        {isMine && (
                          <span className="ml-1 px-1.5 py-0.2 rounded bg-slate-100 text-[10px] font-semibold text-slate-600">
                            Anda
                          </span>
                        )}
                      </span>
                      <span>&bull;</span>
                      <span className="inline-flex items-center gap-1">
                        <Clock size={12} className="text-slate-400" />
                        {formatDate(item.created_at)}
                      </span>
                      {item.file_size && (
                        <>
                          <span>&bull;</span>
                          <span>{item.file_size}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  <button
                    onClick={() => handleLoadAndPreview(item)}
                    className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-ink rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors"
                  >
                    <Eye size={13} className="text-slate-500" /> Pratonton
                  </button>

                  <button
                    onClick={() => handleDownloadAgain(item)}
                    disabled={downloadingId === item.id}
                    className="px-3 py-1.5 bg-ink hover:opacity-90 text-white rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all disabled:opacity-50"
                  >
                    {downloadingId === item.id ? (
                      <Loader2 size={13} className="animate-spin" />
                    ) : (
                      <Download size={13} />
                    )}
                    Muat Turun
                  </button>

                  {canDelete && (
                    <button
                      type="button"
                      onClick={() => handleDeleteRecord(item)}
                      disabled={deletingId === item.id}
                      title="Padam rekod janaan"
                      className="p-1.5 border border-slate-200 hover:border-rose/30 hover:bg-rose/10 text-slate-400 hover:text-rose rounded-lg transition-colors disabled:opacity-50"
                    >
                      {deletingId === item.id ? (
                        <Loader2 size={13} className="animate-spin" />
                      ) : (
                        <Trash2 size={13} />
                      )}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}