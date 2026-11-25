import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  CheckCheck,
  Loader2,
  BookOpen,
  Users,
  Calendar,
  CheckSquare,
  Clock,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

export interface NotificationRecord {
  id: string;
  school_id: string;
  recipient_id: string;
  actor_id: string | null;
  title: string;
  description: string | null;
  module: string;
  link: string | null;
  is_read: boolean;
  created_at: string;
}

interface NotificationsPopoverProps {
  userId: string | null;
  schoolId: string | null;
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
}

function formatRelativeTimeMY(dateStr: string): string {
  const date = new Date(dateStr);
  const diffSec = Math.floor((Date.now() - date.getTime()) / 1000);
  if (diffSec < 60) return 'Baru sebentar tadi';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} minit lalu`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour} jam lalu`;
  return date.toLocaleDateString('ms-MY', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function NotificationsPopover({
  userId,
  schoolId,
  isOpen,
  onToggle,
  onClose,
}: NotificationsPopoverProps) {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<NotificationRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isMarkingAll, setIsMarkingAll] = useState(false);

  const loadNotifications = useCallback(async () => {
    if (!userId || !schoolId) return;
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('recipient_id', userId)
        .eq('school_id', schoolId)
        .order('created_at', { ascending: false })
        .limit(30);

      if (!error && data) {
        setNotifications(data as NotificationRecord[]);
      }
    } finally {
      setIsLoading(false);
    }
  }, [userId, schoolId]);

  useEffect(() => {
    if (isOpen) {
      loadNotifications();
    }
  }, [isOpen, loadNotifications]);

  // Realtime subscription for incoming notifications targeted to this user
  useEffect(() => {
    if (!userId || !schoolId) return;

    const channel = supabase
      .channel(`user-notifications-${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `recipient_id=eq.${userId}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const incoming = payload.new as NotificationRecord;
            if (incoming.school_id !== schoolId) return;
            setNotifications((prev) => {
              if (prev.some((n) => n.id === incoming.id)) return prev;
              return [incoming, ...prev];
            });
          } else if (payload.eventType === 'UPDATE') {
            const updated = payload.new as NotificationRecord;
            setNotifications((prev) =>
              prev.map((n) => (n.id === updated.id ? updated : n))
            );
          } else if (payload.eventType === 'DELETE') {
            const deletedId = (payload.old as { id?: string })?.id;
            if (deletedId) {
              setNotifications((prev) => prev.filter((n) => n.id !== deletedId));
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, schoolId]);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const markAsRead = async (item: NotificationRecord) => {
    if (!item.is_read && userId && schoolId) {
      setNotifications((prev) =>
        prev.map((n) => (n.id === item.id ? { ...n, is_read: true } : n))
      );
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', item.id)
        .eq('recipient_id', userId)
        .eq('school_id', schoolId);
    }

    if (item.link) {
      navigate(item.link);
      onClose();
    }
  };

  const handleMarkAllRead = async () => {
    if (!userId || !schoolId || unreadCount === 0 || isMarkingAll) return;
    setIsMarkingAll(true);
    try {
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('recipient_id', userId)
        .eq('school_id', schoolId)
        .eq('is_read', false);
    } finally {
      setIsMarkingAll(false);
    }
  };

  const moduleIcon = (mod: string) => {
    const m = mod.toLowerCase();
    if (m.includes('buku')) return <BookOpen size={14} className="text-sky" />;
    if (m.includes('takwim') || m.includes('jadual'))
      return <Calendar size={14} className="text-amber" />;
    if (m.includes('jawatankuasa')) return <CheckSquare size={14} className="text-forest" />;
    return <Users size={14} className="text-ink" />;
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={onToggle}
        className="relative w-11 h-11 flex items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-ink hover:border-ink/50 transition-colors shadow-sm"
        aria-label="Notifikasi"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-4.5 h-4.5 px-1 rounded-full bg-coral text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-white">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-14 w-80 sm:w-96 bg-white border border-slate-200 shadow-[0_8px_30px_rgba(16,24,40,0.08)] rounded-xl z-40 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-bold text-ink">Notifikasi</h3>
              {unreadCount > 0 && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-coral/10 text-coral">
                  {unreadCount} baharu
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                disabled={isMarkingAll}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-ink hover:underline disabled:opacity-50"
              >
                <CheckCheck size={13} /> Tandai semua dibaca
              </button>
            )}
          </div>

          {isLoading ? (
            <div className="py-10 flex items-center justify-center gap-2 text-xs text-slate-400">
              <Loader2 size={15} className="animate-spin text-ink" />
              <span>Memuatkan notifikasi...</span>
            </div>
          ) : notifications.length === 0 ? (
            <div className="py-10 px-4 text-center">
              <Bell size={22} className="mx-auto text-slate-300 mb-2" />
              <p className="text-xs font-semibold text-ink">Tiada notifikasi baharu</p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Pemberitahuan mengenai janaan buku, jemputan staf dan takwim akan muncul di sini.
              </p>
            </div>
          ) : (
            <div className="max-h-96 overflow-y-auto divide-y divide-slate-100">
              {notifications.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => markAsRead(item)}
                  className={`w-full px-4 py-3 text-left flex items-start gap-3 transition-colors ${
                    item.is_read ? 'bg-white hover:bg-slate-50/70' : 'bg-slate-50/90 hover:bg-slate-100/70'
                  }`}
                >
                  <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center shrink-0 mt-0.5">
                    {moduleIcon(item.module)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p
                        className={`text-xs leading-snug ${
                          item.is_read ? 'font-medium text-slate-700' : 'font-bold text-ink'
                        }`}
                      >
                        {item.title}
                      </p>
                      {!item.is_read && (
                        <span className="w-2 h-2 rounded-full bg-coral shrink-0 mt-1" />
                      )}
                    </div>
                    {item.description && (
                      <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2 leading-relaxed">
                        {item.description}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-1.5 text-[10px] text-slate-400">
                      <span className="font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded">
                        {item.module}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Clock size={10} />
                        {formatRelativeTimeMY(item.created_at)}
                      </span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}