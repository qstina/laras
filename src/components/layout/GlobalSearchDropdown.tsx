import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  X,
  Users,
  CheckSquare,
  Calendar,
  BookOpen,
  FileText,
  Loader2,
  ArrowUpRight,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

export type SearchScopeKey = 'warga' | 'jawatankuasa' | 'jadual';

export interface SearchResultItem {
  id: string;
  title: string;
  subtitle: string;
  category: string;
  scope: SearchScopeKey | 'dokumen';
  to: string;
}

interface GlobalSearchDropdownProps {
  schoolId: string | null;
  query: string;
  scope: SearchScopeKey;
  isOpen: boolean;
  onClose: () => void;
  onClear: () => void;
}

function HighlightMatch({ text, query }: { text: string; query: string }) {
  const clean = query.trim();
  if (!clean) return <>{text}</>;
  const escaped = clean.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const parts = text.split(new RegExp(`(${escaped})`, 'gi'));

  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === clean.toLowerCase() ? (
          <mark
            key={i}
            className="bg-amber/25 text-ink font-semibold rounded px-0.5"
          >
            {part}
          </mark>
        ) : (
          <React.Fragment key={i}>{part}</React.Fragment>
        )
      )}
    </>
  );
}

export default function GlobalSearchDropdown({
  schoolId,
  query,
  scope,
  isOpen,
  onClose,
  onClear,
}: GlobalSearchDropdownProps) {
  const navigate = useNavigate();
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);

  const trimmedQuery = query.trim();

  // Debounced cross-module school search
  useEffect(() => {
    if (!isOpen || !schoolId || trimmedQuery.length < 1) {
      setResults([]);
      setSearchError(null);
      setIsSearching(false);
      return;
    }

    let cancelled = false;
    setIsSearching(true);
    setSearchError(null);

    const timer = window.setTimeout(async () => {
      try {
        const pattern = `%${trimmedQuery}%`;

        const [staffRes, commRes, eventsRes, docsRes] = await Promise.all([
          supabase
            .from('staff')
            .select('id, name, jawatan, gred, type')
            .eq('school_id', schoolId)
            .or(`name.ilike.${pattern},jawatan.ilike.${pattern},gred.ilike.${pattern}`)
            .limit(6),
          supabase
            .from('committees')
            .select('id, name, category, description')
            .eq('school_id', schoolId)
            .or(`name.ilike.${pattern},category.ilike.${pattern},description.ilike.${pattern}`)
            .limit(6),
          supabase
            .from('school_events')
            .select('id, title, event_date, description')
            .eq('school_id', schoolId)
            .or(`title.ilike.${pattern},description.ilike.${pattern}`)
            .order('event_date', { ascending: true })
            .limit(5),
          supabase
            .from('document_history')
            .select('id, name, type, created_at')
            .eq('school_id', schoolId)
            .ilike('name', pattern)
            .order('created_at', { ascending: false })
            .limit(4),
        ]);

        if (cancelled) return;

        if (staffRes.error && commRes.error && eventsRes.error && docsRes.error) {
          throw new Error('Gagal mendapatkan keputusan carian.');
        }

        const mapped: SearchResultItem[] = [];

        (staffRes.data || []).forEach((s: any) => {
          mapped.push({
            id: `staff-${s.id}`,
            title: s.name || 'Staf Sekolah',
            subtitle:
              [s.jawatan, s.gred, s.type].filter(Boolean).join(' • ') || 'Direktori Warga Sekolah',
            category: 'Warga Sekolah',
            scope: 'warga',
            to: `/teachers?q=${encodeURIComponent(s.name || trimmedQuery)}`,
          });
        });

        (commRes.data || []).forEach((c: any) => {
          mapped.push({
            id: `comm-${c.id}`,
            title: c.name || 'Jawatankuasa',
            subtitle:
              [c.category, c.description].filter(Boolean).join(' • ') || 'Pengurusan Jawatankuasa',
            category: 'Jawatankuasa',
            scope: 'jawatankuasa',
            to: `/committees?q=${encodeURIComponent(c.name || trimmedQuery)}`,
          });
        });

        (eventsRes.data || []).forEach((ev: any) => {
          const dateLabel = ev.event_date
            ? new Date(ev.event_date).toLocaleDateString('ms-MY', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })
            : '';
          mapped.push({
            id: `event-${ev.id}`,
            title: ev.title,
            subtitle: [dateLabel, ev.description].filter(Boolean).join(' • ') || 'Takwim Sekolah',
            category: 'Takwim & Jadual',
            scope: 'jadual',
            to: `/`,
          });
        });

        (docsRes.data || []).forEach((doc: any) => {
          mapped.push({
            id: `doc-${doc.id}`,
            title: doc.name || 'Buku Pengurusan',
            subtitle: `Dokumen ${(doc.type || 'DOCX').toUpperCase()} • Sejarah Janaan Buku`,
            category: 'Janaan Buku',
            scope: 'dokumen',
            to: `/book-builder?historyId=${encodeURIComponent(doc.id)}`,
          });
        });

        // Prioritize results matching the active scope pill first, while still showing cross-module hits
        const sorted = [...mapped].sort((a, b) => {
          const aMatch = a.scope === scope ? 0 : 1;
          const bMatch = b.scope === scope ? 0 : 1;
          return aMatch - bMatch;
        });

        setResults(sorted);
        setActiveIndex(0);
      } catch (err: any) {
        if (!cancelled) {
          setSearchError(err?.message || 'Ralat semasa mencari rekod sekolah.');
        }
      } finally {
        if (!cancelled) setIsSearching(false);
      }
    }, 250);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [trimmedQuery, scope, isOpen, schoolId]);

  // Keyboard navigation (ArrowUp, ArrowDown, Enter, Escape)
  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        onClose();
        return;
      }
      if (results.length === 0) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIndex((prev) => (prev + 1) % results.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIndex((prev) => (prev - 1 + results.length) % results.length);
      } else if (e.key === 'Enter' && trimmedQuery.length > 0 && results[activeIndex]) {
        e.preventDefault();
        const chosen = results[activeIndex];
        navigate(chosen.to);
        onClose();
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, results, activeIndex, trimmedQuery, navigate, onClose]);

  const iconForScope = useMemo(
    () => (s: SearchResultItem['scope']) => {
      switch (s) {
        case 'warga':
          return <Users size={15} className="text-ink" />;
        case 'jawatankuasa':
          return <CheckSquare size={15} className="text-forest" />;
        case 'jadual':
          return <Calendar size={15} className="text-amber" />;
        case 'dokumen':
          return <BookOpen size={15} className="text-sky" />;
        default:
          return <FileText size={15} className="text-slate-500" />;
      }
    },
    []
  );

  if (!isOpen || trimmedQuery.length === 0) return null;

  return (
    <div
      ref={listRef}
      className="absolute left-0 right-0 top-14 bg-white border border-slate-200 shadow-[0_12px_36px_rgba(16,24,40,0.10)] rounded-xl z-40 overflow-hidden"
    >
      {/* Header bar */}
      <div className="px-4 py-2.5 bg-slate-50/80 border-b border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
        <span>
          Keputusan carian untuk <strong className="text-ink">"{trimmedQuery}"</strong>
        </span>
        <div className="flex items-center gap-3">
          <span className="hidden sm:inline text-[10px] text-slate-400">
            ↑↓ Pilih &bull; Enter Buka &bull; Esc Tutup
          </span>
          <button
            type="button"
            onClick={onClear}
            className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 hover:text-ink"
          >
            <X size={12} /> Padam
          </button>
        </div>
      </div>

      {/* Body */}
      {isSearching ? (
        <div className="py-8 flex items-center justify-center gap-2 text-xs text-slate-400">
          <Loader2 size={15} className="animate-spin text-ink" />
          <span>Mencari rekod sekolah...</span>
        </div>
      ) : searchError ? (
        <div className="py-6 px-4 text-center text-xs text-rose font-medium">{searchError}</div>
      ) : results.length === 0 ? (
        <div className="py-8 px-4 text-center">
          <Search size={20} className="mx-auto text-slate-300 mb-2" />
          <p className="text-xs font-semibold text-ink">Tiada rekod sepadan dijumpai</p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Cuba kata kunci lain seperti nama guru, nama jawatankuasa, acara takwim atau tajuk buku.
          </p>
        </div>
      ) : (
        <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
          {results.map((item, idx) => {
            const isActive = idx === activeIndex;
            return (
              <button
                key={item.id}
                type="button"
                onMouseEnter={() => setActiveIndex(idx)}
                onClick={() => {
                  navigate(item.to);
                  onClose();
                }}
                className={`w-full px-4 py-3 text-left flex items-center justify-between gap-3 transition-colors ${
                  isActive ? 'bg-slate-50' : 'bg-white hover:bg-slate-50/70'
                }`}
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200/80 flex items-center justify-center shrink-0 mt-0.5">
                    {iconForScope(item.scope)}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-xs font-semibold text-ink truncate">
                        <HighlightMatch text={item.title} query={trimmedQuery} />
                      </p>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 shrink-0">
                        {item.category}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 truncate mt-0.5">
                      <HighlightMatch text={item.subtitle} query={trimmedQuery} />
                    </p>
                  </div>
                </div>
                <ArrowUpRight size={14} className="text-slate-400 shrink-0" />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}