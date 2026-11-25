import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  Mail,
  Send,
  Plus,
  ArrowLeft,
  Loader2,
  User,
  MessageSquare,
  AlertCircle,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface SchoolMember {
  id: string;
  full_name: string;
  role: string;
  position?: string | null;
}

interface ConversationRow {
  id: string;
  school_id: string;
  participant_a: string;
  participant_b: string;
  last_message_text: string | null;
  last_message_at: string;
}

interface MessageRow {
  id: string;
  conversation_id: string;
  school_id: string;
  sender_id: string;
  recipient_id: string;
  body: string;
  is_read: boolean;
  created_at: string;
}

interface MessagesPopoverProps {
  userId: string | null;
  schoolId: string | null;
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
}

function formatMsgTime(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const isToday =
    d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear();

  if (isToday) {
    return d.toLocaleTimeString('ms-MY', { hour: '2-digit', minute: '2-digit' });
  }
  return d.toLocaleDateString('ms-MY', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function MessagesPopover({
  userId,
  schoolId,
  isOpen,
  onToggle,
}: MessagesPopoverProps) {
  const [members, setMembers] = useState<SchoolMember[]>([]);
  const [conversations, setConversations] = useState<ConversationRow[]>([]);
  const [unreadByConv, setUnreadByConv] = useState<Record<string, number>>({});
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [isComposingNew, setIsComposingNew] = useState(false);

  const [draftBody, setDraftBody] = useState('');
  const [isLoadingList, setIsLoadingList] = useState(false);
  const [isLoadingThread, setIsLoadingThread] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const totalUnread = Object.values(unreadByConv).reduce((sum, n) => sum + n, 0);

  const loadSchoolMembersAndConversations = useCallback(async () => {
    if (!userId || !schoolId) return;
    setIsLoadingList(true);
    try {
      const [membersRes, convsRes, unreadRes] = await Promise.all([
        supabase
          .from('profiles')
          .select('id, full_name, role, position')
          .eq('school_id', schoolId)
          .neq('id', userId)
          .order('full_name', { ascending: true }),
        supabase
          .from('school_conversations')
          .select('*')
          .eq('school_id', schoolId)
          .or(`participant_a.eq.${userId},participant_b.eq.${userId}`)
          .order('last_message_at', { ascending: false }),
        supabase
          .from('school_messages')
          .select('id, conversation_id')
          .eq('school_id', schoolId)
          .eq('recipient_id', userId)
          .eq('is_read', false),
      ]);

      if (membersRes.data) setMembers(membersRes.data as SchoolMember[]);
      if (convsRes.data) setConversations(convsRes.data as ConversationRow[]);

      const counts: Record<string, number> = {};
      (unreadRes.data || []).forEach((m: any) => {
        counts[m.conversation_id] = (counts[m.conversation_id] || 0) + 1;
      });
      setUnreadByConv(counts);
    } finally {
      setIsLoadingList(false);
    }
  }, [userId, schoolId]);

  useEffect(() => {
    loadSchoolMembersAndConversations();
  }, [loadSchoolMembersAndConversations]);

  // Load thread messages & mark incoming unread messages as read
  const openConversation = useCallback(
    async (convId: string) => {
      if (!userId || !schoolId) return;
      setActiveConvId(convId);
      setIsComposingNew(false);
      setErrorMsg(null);
      setIsLoadingThread(true);

      try {
        const { data, error } = await supabase
          .from('school_messages')
          .select('*')
          .eq('conversation_id', convId)
          .eq('school_id', schoolId)
          .order('created_at', { ascending: true });

        if (!error && data) {
          setMessages(data as MessageRow[]);
        }

        // Mark unread messages in this thread as read
        if ((unreadByConv[convId] || 0) > 0) {
          setUnreadByConv((prev) => ({ ...prev, [convId]: 0 }));
          await supabase
            .from('school_messages')
            .update({ is_read: true })
            .eq('conversation_id', convId)
            .eq('recipient_id', userId)
            .eq('is_read', false);
        }
      } finally {
        setIsLoadingThread(false);
      }
    },
    [userId, schoolId, unreadByConv]
  );

  useEffect(() => {
    if (isOpen && activeConvId) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [isOpen, activeConvId, messages.length]);

  // Realtime subscription for incoming/outgoing school messages
  useEffect(() => {
    if (!userId || !schoolId) return;

    const channel = supabase
      .channel(`school-messages-${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'school_messages',
          filter: `school_id=eq.${schoolId}`,
        },
        async (payload) => {
          const msg = payload.new as MessageRow;
          if (msg.sender_id !== userId && msg.recipient_id !== userId) return;

          // Refresh conversation ordering
          await loadSchoolMembersAndConversations();

          if (activeConvId === msg.conversation_id) {
            setMessages((prev) => {
              if (prev.some((m) => m.id === msg.id)) return prev;
              return [...prev, msg];
            });

            if (msg.recipient_id === userId && isOpen) {
              setUnreadByConv((prev) => ({ ...prev, [msg.conversation_id]: 0 }));
              await supabase
                .from('school_messages')
                .update({ is_read: true })
                .eq('id', msg.id)
                .eq('recipient_id', userId);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, schoolId, activeConvId, isOpen, loadSchoolMembersAndConversations]);

  const startConversationWithMember = async (member: SchoolMember) => {
    if (!userId || !schoolId) return;
    setErrorMsg(null);

    // Reuse existing conversation if already created
    const existing = conversations.find(
      (c) =>
        (c.participant_a === userId && c.participant_b === member.id) ||
        (c.participant_b === userId && c.participant_a === member.id)
    );

    if (existing) {
      await openConversation(existing.id);
      return;
    }

    const [pA, pB] = [userId, member.id].sort();
    const { data: created, error } = await supabase
      .from('school_conversations')
      .insert({
        school_id: schoolId,
        participant_a: pA,
        participant_b: pB,
      })
      .select('*')
      .single();

    if (error || !created) {
      setErrorMsg('Gagal memulakan perbualan baharu.');
      return;
    }

    setConversations((prev) => [created as ConversationRow, ...prev]);
    await openConversation(created.id);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId || !schoolId || !activeConvId || isSending) return;

    const cleanBody = draftBody.trim();
    if (!cleanBody) return;

    const activeConv = conversations.find((c) => c.id === activeConvId);
    if (!activeConv) return;

    const recipientId =
      activeConv.participant_a === userId ? activeConv.participant_b : activeConv.participant_a;

    setIsSending(true);
    setErrorMsg(null);

    try {
      const { data: inserted, error } = await supabase
        .from('school_messages')
        .insert({
          conversation_id: activeConvId,
          school_id: schoolId,
          sender_id: userId,
          recipient_id: recipientId,
          body: cleanBody,
        })
        .select('*')
        .single();

      if (error) throw error;

      setDraftBody('');
      if (inserted) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === inserted.id)) return prev;
          return [...prev, inserted as MessageRow];
        });
      }
      await loadSchoolMembersAndConversations();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Gagal menghantar mesej.');
    } finally {
      setIsSending(false);
    }
  };

  const getOtherMember = (conv: ConversationRow): SchoolMember => {
    const otherId = conv.participant_a === userId ? conv.participant_b : conv.participant_a;
    return (
      members.find((m) => m.id === otherId) || {
        id: otherId,
        full_name: 'Warga Sekolah',
        role: 'staff',
      }
    );
  };

  const activeConversation = conversations.find((c) => c.id === activeConvId) || null;
  const activePartner = activeConversation ? getOtherMember(activeConversation) : null;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={onToggle}
        className="relative flex w-11 h-11 items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-ink hover:border-ink/50 transition-colors shadow-sm"
        aria-label="Mesej"
      >
        <Mail size={18} />
        {totalUnread > 0 && (
          <span className="absolute -top-1 -right-1 min-w-4.5 h-4.5 px-1 rounded-full bg-ink text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-white">
            {totalUnread > 99 ? '99+' : totalUnread}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-14 w-80 sm:w-96 bg-white border border-slate-200 shadow-[0_8px_30px_rgba(16,24,40,0.08)] rounded-xl z-40 overflow-hidden flex flex-col">
          {/* Header */}
          <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
            {activeConversation || isComposingNew ? (
              <div className="flex items-center gap-2 min-w-0">
                <button
                  type="button"
                  onClick={() => {
                    setActiveConvId(null);
                    setIsComposingNew(false);
                    setErrorMsg(null);
                  }}
                  className="p-1 rounded-lg text-slate-500 hover:text-ink hover:bg-slate-100"
                  aria-label="Kembali"
                >
                  <ArrowLeft size={14} />
                </button>
                <div className="min-w-0">
                  <h3 className="text-xs font-bold text-ink truncate">
                    {isComposingNew ? 'Mesej Baharu' : activePartner?.full_name}
                  </h3>
                  {!isComposingNew && activePartner && (
                    <p className="text-[10px] text-slate-400 truncate">
                      {activePartner.role === 'admin' ? 'Pentadbir Sekolah' : 'Staf / Guru'}
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-bold text-ink">Mesej Sekolah</h3>
                  {totalUnread > 0 && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-ink text-white">
                      {totalUnread}
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsComposingNew(true);
                    setErrorMsg(null);
                  }}
                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-ink text-white rounded-lg text-[11px] font-semibold hover:opacity-90"
                >
                  <Plus size={12} /> Baharu
                </button>
              </>
            )}
          </div>

          {errorMsg && (
            <div className="px-4 py-2 bg-rose/10 border-b border-rose/20 flex items-center gap-1.5 text-[11px] text-rose font-medium">
              <AlertCircle size={13} className="shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* View 1: Select Colleague to Start Conversation */}
          {isComposingNew ? (
            <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
              <div className="px-4 py-2 bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Pilih Warga Sekolah
              </div>
              {members.length === 0 ? (
                <div className="py-8 px-4 text-center text-xs text-slate-400">
                  Tiada ahli lain berdaftar di sekolah ini lagi.
                </div>
              ) : (
                members.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => startConversationWithMember(m)}
                    className="w-full px-4 py-3 text-left flex items-center gap-3 hover:bg-slate-50 transition-colors"
                  >
                    <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-ink shrink-0">
                      <User size={14} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-ink truncate">{m.full_name}</p>
                      <p className="text-[11px] text-slate-400 truncate">
                        {m.role === 'admin' ? 'Pentadbir Sekolah' : m.position || 'Staf / Guru'}
                      </p>
                    </div>
                  </button>
                ))
              )}
            </div>
          ) : activeConversation ? (
            /* View 2: Active Conversation Thread */
            <>
              <div className="h-72 overflow-y-auto p-3.5 space-y-2.5 bg-slate-50/50">
                {isLoadingThread ? (
                  <div className="h-full flex items-center justify-center text-xs text-slate-400 gap-2">
                    <Loader2 size={15} className="animate-spin text-ink" />
                    <span>Memuatkan perbualan...</span>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center px-4 text-slate-400">
                    <MessageSquare size={20} className="mb-1.5 text-slate-300" />
                    <p className="text-xs font-medium text-ink">Mulakan perbualan</p>
                    <p className="text-[11px] mt-0.5">
                      Hantar mesej pertama kepada {activePartner?.full_name}.
                    </p>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isMine = msg.sender_id === userId;
                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}
                      >
                        <div
                          className={`max-w-[82%] px-3 py-2 rounded-xl text-xs leading-relaxed ${
                            isMine
                              ? 'bg-ink text-white rounded-br-sm'
                              : 'bg-white border border-slate-200 text-ink rounded-bl-sm'
                          }`}
                        >
                          {msg.body}
                        </div>
                        <span className="text-[10px] text-slate-400 mt-1 px-1">
                          {formatMsgTime(msg.created_at)}
                        </span>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              <form
                onSubmit={handleSendMessage}
                className="p-2.5 bg-white border-t border-slate-100 flex items-center gap-2"
              >
                <input
                  type="text"
                  value={draftBody}
                  onChange={(e) => setDraftBody(e.target.value)}
                  disabled={isSending}
                  placeholder="Tulis mesej..."
                  className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-ink outline-none focus:border-ink/40 focus:bg-white"
                />
                <button
                  type="submit"
                  disabled={isSending || !draftBody.trim()}
                  className="w-8 h-8 rounded-lg bg-ink text-white flex items-center justify-center hover:opacity-90 disabled:opacity-40 shrink-0"
                  aria-label="Hantar mesej"
                >
                  {isSending ? (
                    <Loader2 size={13} className="animate-spin" />
                  ) : (
                    <Send size={13} />
                  )}
                </button>
              </form>
            </>
          ) : (
            /* View 3: Conversation List */
            <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
              {isLoadingList ? (
                <div className="py-10 flex items-center justify-center gap-2 text-xs text-slate-400">
                  <Loader2 size={15} className="animate-spin text-ink" />
                  <span>Memuatkan mesej...</span>
                </div>
              ) : conversations.length === 0 ? (
                <div className="py-10 px-4 text-center">
                  <Mail size={22} className="mx-auto text-slate-300 mb-2" />
                  <p className="text-xs font-semibold text-ink">Tiada perbualan lagi</p>
                  <p className="text-[11px] text-slate-400 mt-0.5 mb-3">
                    Hubungi pentadbir atau rakan guru di sekolah anda secara terus.
                  </p>
                  <button
                    type="button"
                    onClick={() => setIsComposingNew(true)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-ink text-white rounded-lg text-[11px] font-semibold hover:opacity-90"
                  >
                    <Plus size={12} /> Mula Perbualan
                  </button>
                </div>
              ) : (
                conversations.map((conv) => {
                  const partner = getOtherMember(conv);
                  const unread = unreadByConv[conv.id] || 0;
                  return (
                    <button
                      key={conv.id}
                      type="button"
                      onClick={() => openConversation(conv.id)}
                      className={`w-full px-4 py-3 text-left flex items-start justify-between gap-3 transition-colors ${
                        unread > 0 ? 'bg-slate-50/90 hover:bg-slate-100/70' : 'hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-start gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-ink text-xs font-bold shrink-0">
                          {partner.full_name.substring(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p
                            className={`text-xs truncate ${
                              unread > 0 ? 'font-bold text-ink' : 'font-semibold text-slate-700'
                            }`}
                          >
                            {partner.full_name}
                          </p>
                          <p className="text-[11px] text-slate-500 truncate mt-0.5">
                            {conv.last_message_text || 'Perbualan baharu'}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <span className="text-[10px] text-slate-400">
                          {formatMsgTime(conv.last_message_at)}
                        </span>
                        {unread > 0 && (
                          <span className="min-w-4 h-4 px-1 rounded-full bg-ink text-white text-[10px] font-bold flex items-center justify-center">
                            {unread}
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}