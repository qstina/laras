import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import {
  Download,
  School,
  Loader2,
  RotateCcw,
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  List,
  ListOrdered,
  Undo2,
  Redo2,
  IndentIncrease,
  IndentDecrease,
  Table as TableIcon,
  SeparatorHorizontal,
  Highlighter,
  Palette,
  ArrowLeft,
  Printer,
  Minus,
  Plus,
  RemoveFormatting,
  MessageSquarePlus,
  MessageSquare,
  Trash2,
  Save,
  RefreshCw,
  CheckCircle2,
  Sparkles,
  AlertCircle,
  BookOpen,
  Check,
} from 'lucide-react';
import { useReactToPrint } from 'react-to-print';
import { supabase } from '../lib/supabase';

import {
  useEditor,
  useEditorState,
  EditorContent,
  NodeViewWrapper,
  ReactNodeViewRenderer,
  type NodeViewProps,
} from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import { TextAlign } from '@tiptap/extension-text-align';
import { TextStyle, Color, FontFamily } from '@tiptap/extension-text-style';
import { Highlight } from '@tiptap/extension-highlight';
import { TableKit } from '@tiptap/extension-table';

import {
  PageBreak,
  ParagraphFormat,
  FontSize,
  CommentMark,
  BookSectionNode,
  BookCoverNode,
  PreserveClasses,
} from './bookBuilderExtensions';
import {
  bookSections,
  buildAllSections,
  buildSection,
  sortCommitteeMembers,
  toRoman,
} from './bookBuilderSections';
import {
  CoverCanvas,
  buildDefaultCoverConfig,
  type AssetFieldKey,
  type CoverConfig,
} from '../components/book-builder/coverTemplates';
import { CoverDesignerDrawer } from '../components/book-builder/CoverDesignerDrawer';
import { exportEditorHtmlToDocx } from '../utils/exportBookDocx';

const PRESET_COLORS = [
  '#000000', '#434343', '#666666', '#999999', '#b7b7b7', '#cccccc', '#d9d9d9', '#efefef', '#f3f3f3', '#ffffff',
  '#980000', '#ff0000', '#ff9900', '#ffff00', '#00ff00', '#00ffff', '#4a86e8', '#0000ff', '#9900ff', '#ff00ff',
  '#e6b8af', '#f4cccc', '#fce5cd', '#fff2cc', '#d9ead3', '#d0e0e3', '#c9daf8', '#cfe2f3', '#d9d2e9', '#ead1dc',
  '#dd7e6b', '#ea9999', '#f9cb9c', '#ffe599', '#b6d7a8', '#a2c4c9', '#a4c2f4', '#9fc5e8', '#b4a7d6', '#d5a6bd',
  '#cc4125', '#e06666', '#f6b26b', '#ffd966', '#93c47d', '#76a5af', '#6d9eeb', '#6fa8dc', '#8e7cc3', '#c27ba0',
  '#a61c00', '#cc0000', '#e69138', '#f1c232', '#6aa84f', '#45818e', '#3c78d8', '#3d85c6', '#674ea7', '#a64d79',
  '#85200c', '#990000', '#b45f06', '#bf9000', '#38761d', '#134f5c', '#1155cc', '#0b5394', '#351c75', '#741b47',
  '#5b0f00', '#660000', '#783f04', '#7f6000', '#274e13', '#0c343d', '#1c4587', '#073763', '#20124d', '#4c1130',
];

const FONTS = ['Arial', 'Times New Roman', 'Georgia', 'Verdana', 'Tahoma', 'Courier New'];

function ColorPickerDropdown({ icon: Icon, color, onChange, tooltip }: any) {
  const [isOpen, setIsOpen] = useState(false);
  const [customColor, setCustomColor] = useState(color || '#000000');

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-center p-1.5 rounded-md cursor-pointer hover:bg-slate-100 transition-colors"
        title={tooltip}
      >
        <div className="flex flex-col items-center">
          <Icon size={16} className="text-slate-600" />
          <div
            className="w-4 h-1 mt-0.5 rounded-sm border border-slate-200"
            style={{ backgroundColor: color || '#000000' }}
          ></div>
        </div>
      </button>

      {isOpen && (
        <div className="absolute top-full mt-1 left-1/2 -translate-x-1/2 bg-white border border-slate-200 rounded-lg p-3 z-50 w-64 shadow-xl">
          <div className="grid grid-cols-10 gap-1 mb-3">
            {PRESET_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => {
                  onChange(c);
                  setIsOpen(false);
                }}
                className="w-5 h-5 rounded-md border border-slate-200 hover:scale-110 transition-transform"
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
          <div className="flex items-center justify-between border-t border-slate-100 pt-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Custom
            </span>
            <input
              type="color"
              value={customColor}
              onChange={(e) => {
                setCustomColor(e.target.value);
                onChange(e.target.value);
              }}
              className="w-6 h-6 p-0 border border-slate-300 rounded cursor-pointer"
            />
          </div>
        </div>
      )}
    </div>
  );
}

function getSectionHash(id: string, p: any, s: any[], c: any[]): string {
  let dataToHash = '';

  if (id === 'setup') {
    dataToHash = JSON.stringify({
      name: p?.name,
      code: p?.code,
      address: p?.address,
      phone: p?.phone,
      email: p?.email,
      motto: p?.motto,
      session: p?.current_session,
      logo: p?.logo_url,
      kpm: p?.kpm_logo_url,
      jpn: p?.jpn_logo_url,
      ppd: p?.ppd_logo_url,
      photo: p?.cover_photo_url,
      primary: p?.primary_color,
      accent: p?.accent_color,
    });
  } else if (id === 'identiti') {
    dataToHash = JSON.stringify({
      name: p?.name,
      code: p?.code,
      address: p?.address,
      phone: p?.phone,
      email: p?.email,
      motto: p?.motto,
      slogan: p?.slogan,
      session: p?.current_session,
      fpk: p?.fpk,
      vision: p?.vision,
      mission: p?.mission,
      songUrl: p?.school_song_url,
      songLyrics: p?.school_song_lyrics,
    });
  } else if (id === 'direktori') {
    dataToHash = JSON.stringify(
      s.map((st) => ({
        id: st.id,
        name: st.name,
        type: st.type,
        jawatan: st.jawatan,
        gred: st.gred,
        department: st.department,
        status: st.status,
      }))
    );
  } else if (id === 'beban') {
    dataToHash = JSON.stringify({
      ref: p?.workload_settings?.reference_points,
      staff: s.map((st) => st.id),
      weights: c.map((comm) => ({
        id: comm.id,
        members: (comm.staff_committees || []).map((sc: any) => ({
          staff_id: sc.staff_id,
          role: sc.role,
          w: sc.workload_weightage,
        })),
      })),
    });
  } else if (['pentadbiran', 'kurikulum', 'hem', 'koko', 'tingkatan6', 'ppki'].includes(id)) {
    const catMap: Record<string, string> = {
      pentadbiran: 'Pentadbiran',
      kurikulum: 'Kurikulum',
      hem: 'Hal Ehwal Murid',
      koko: 'Kokurikulum',
      tingkatan6: 'Tingkatan 6',
      ppki: 'PPKI',
    };
    const filtered = c.filter(
      (comm) =>
        comm.category === catMap[id] || comm.category === `Pengurusan ${catMap[id]}`
    );
    dataToHash = JSON.stringify(
      filtered.map((comm) => ({
        id: comm.id,
        name: comm.name,
        category: comm.category,
        senarai_tugas: comm.senarai_tugas,
        sasaran_kerja: comm.sasaran_kerja,
        members: sortCommitteeMembers(comm.staff_committees || []).map((sc: any) => ({
          role: sc.role,
          staff: sc.staff?.name,
        })),
      }))
    );
  }

  let hash = 0;
  for (let i = 0; i < dataToHash.length; i++) {
    hash = (hash << 5) - hash + dataToHash.charCodeAt(i);
    hash |= 0;
  }
  return hash.toString(36);
}

interface BookComment {
  id: string;
  text: string;
  author: string;
  authorId?: string;
  sectionId?: string;
  sectionTitle?: string;
  quote?: string;
  status: 'open' | 'resolved';
  createdAt: string;
  updatedAt?: string;
  isNew?: boolean;
}

type SaveStatus = 'idle' | 'unsaved' | 'saving' | 'saved' | 'error';

function buildCoverWrapperHTML(config: CoverConfig, hash: string, manualEdited = false): string {
  const encoded = encodeURIComponent(JSON.stringify(config));
  return `<div data-section-id="setup" id="section-setup" data-source-hash="${hash}" data-manual-edited="${
    manualEdited ? 'true' : 'false'
  }"><div data-book-cover="true" data-cover-config="${encoded}"></div></div>`;
}

function getSectionLabelById(sectionId?: string): string {
  if (!sectionId) return 'Dokumen Umum';
  const found = bookSections.find((s) => s.id === sectionId);
  return found ? found.shortTitle : sectionId;
}

function resolveTemplateSectionIds(
  templateParam: string | null,
  sessionParam: string | null
): Set<string> | null {
  if (templateParam !== 'lampiran-jawatankuasa') return null;
  if (sessionParam === 'Kurikulum & HEM Sahaja') {
    return new Set(['setup', 'toc', 'kurikulum', 'hem']);
  }
  return new Set(['setup', 'toc', 'pentadbiran', 'kurikulum', 'hem', 'koko', 'tingkatan6', 'ppki']);
}

export default function BookBuilder() {
  const [searchParams] = useSearchParams();
  const templateParam = searchParams.get('template');
  const sessionParam = searchParams.get('session');
  const historyIdParam = searchParams.get('historyId');
  const autoPrintParam = searchParams.get('autoPrint');

  const [schoolId, setSchoolId] = useState<string>('');
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [currentUserName, setCurrentUserName] = useState<string>('Pentadbir');
  const [profile, setProfile] = useState<any>(null);
  const [staffData, setStaffData] = useState<any[]>([]);
  const [committeeData, setCommitteeData] = useState<any[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isExportingDocx, setIsExportingDocx] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);

  // Unified draft save & autosave status
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [saveErrorMsg, setSaveErrorMsg] = useState<string | null>(null);
  const [viewingHistoryRecord, setViewingHistoryRecord] = useState<any | null>(null);

  const [activeSection, setActiveSection] = useState<string>('setup');
  const [outdatedSections, setOutdatedSections] = useState<Record<string, boolean>>({});
  const [manuallyEditedSections, setManuallyEditedSections] = useState<Record<string, boolean>>({});

  // Cover Designer State
  const [coverConfig, setCoverConfig] = useState<CoverConfig>(() => buildDefaultCoverConfig(null));
  const [isCoverDrawerOpen, setIsCoverDrawerOpen] = useState(false);
  const [focusedAssetField, setFocusedAssetField] = useState<AssetFieldKey | null>(null);

  const [comments, setComments] = useState<BookComment[]>([]);
  const [showComments, setShowComments] = useState(false);
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});

  const printRef = useRef<HTMLDivElement>(null);
  const isProgrammaticUpdateRef = useRef(false);
  const initializedEditorRef = useRef<any>(null);
  const coverConfigRef = useRef<CoverConfig>(coverConfig);
  coverConfigRef.current = coverConfig;
  const commentsRef = useRef<BookComment[]>(comments);
  commentsRef.current = comments;
  const profileRef = useRef<any>(profile);
  profileRef.current = profile;
  const schoolIdRef = useRef<string>(schoolId);
  schoolIdRef.current = schoolId;
  const editorRef = useRef<any>(null);

  // Autosave & concurrency refs
  const isDirtyRef = useRef(false);
  const autosaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const saveSeqRef = useRef(0);
  const isSaveInFlightRef = useRef(false);
  const queuedSaveTriggerRef = useRef<'auto' | 'manual' | null>(null);
  const lastSavedDigestRef = useRef<string>('');
  const suppressNextProfileSyncRef = useRef(false);

  const computeStateDigest = useCallback(
    (html: string, cfg: CoverConfig, commentList: BookComment[]) => {
      const cleanComments = commentList.map(({ isNew, ...rest }) => rest);
      return `${html.length}:${html}::${JSON.stringify(cfg)}::${JSON.stringify(cleanComments)}`;
    },
    []
  );

  // Safe write helper for school_profile (avoids ON CONFLICT errors and gracefully strips optional missing columns)
  const saveToSchoolProfile = useCallback(
    async (sid: string, payload: Record<string, any>) => {
      let existingId: string | null = profileRef.current?.id || null;

      if (!existingId) {
        const { data: foundRow } = await supabase
          .from('school_profile')
          .select('id')
          .eq('school_id', sid)
          .limit(1)
          .maybeSingle();
        existingId = foundRow?.id || null;
      }

      const executeWrite = async (writePayload: Record<string, any>): Promise<any> => {
        if (existingId) {
          const { data, error } = await supabase
            .from('school_profile')
            .update(writePayload)
            .eq('id', existingId)
            .select()
            .maybeSingle();

          if (error) {
            const missingColMatch = error.message?.match(/Could not find the '([^']+)' column/i);
            if (missingColMatch && missingColMatch[1] in writePayload) {
              const trimmed = { ...writePayload };
              delete trimmed[missingColMatch[1]];
              return executeWrite(trimmed);
            }
            throw error;
          }
          return data || { ...(profileRef.current || {}), id: existingId, school_id: sid, ...writePayload };
        } else {
          const insertPayload: Record<string, any> = {
            school_id: sid,
            name: coverConfigRef.current.schoolName || 'Sekolah',
            ...writePayload,
          };
          const { data, error } = await supabase
            .from('school_profile')
            .insert(insertPayload)
            .select()
            .maybeSingle();

          if (error) {
            const missingColMatch = error.message?.match(/Could not find the '([^']+)' column/i);
            if (missingColMatch && missingColMatch[1] in insertPayload) {
              const trimmed = { ...insertPayload };
              delete trimmed[missingColMatch[1]];
              return executeWrite(trimmed);
            }
            throw error;
          }
          return data || { ...(profileRef.current || {}), ...insertPayload };
        }
      };

      const merged = await executeWrite(payload);
      profileRef.current = merged;
      setProfile(merged);
      return merged;
    },
    []
  );

  // Interactive NodeView extension for the Corporate Cover inside Tiptap
  const InteractiveBookCoverExtension = useMemo(() => {
    const CoverNodeView = (props: NodeViewProps) => {
      const cfg: CoverConfig = props.node.attrs.config || coverConfigRef.current;
      return (
        <NodeViewWrapper className="bb-cover-wrapper" contentEditable={false}>
          <CoverCanvas
            config={cfg}
            onAssetClick={(field) => {
              setFocusedAssetField(field);
              setIsCoverDrawerOpen(true);
            }}
            onOpenEditor={() => {
              setFocusedAssetField(null);
              setIsCoverDrawerOpen(true);
            }}
          />
        </NodeViewWrapper>
      );
    };

    return BookCoverNode.extend({
      addNodeView() {
        return ReactNodeViewRenderer(CoverNodeView);
      },
    });
  }, []);

  const persistDraftRecord = useCallback(
    async (
      trigger: 'auto' | 'manual',
      options?: { htmlOverride?: string; silentAlert?: boolean }
    ): Promise<boolean> => {
      const activeEditor = editorRef.current;
      const sid = schoolIdRef.current;
      if (!activeEditor || activeEditor.isDestroyed || !sid) return false;

      if (viewingHistoryRecord && trigger === 'auto') {
        return false;
      }

      const html = options?.htmlOverride ?? activeEditor.getHTML();
      const currentCfg = coverConfigRef.current;
      const sanitizedComments = commentsRef.current.map(({ isNew, ...rest }) => rest);
      const digest = computeStateDigest(html, currentCfg, sanitizedComments);

      if (trigger === 'auto' && !isDirtyRef.current && digest === lastSavedDigestRef.current) {
        return true;
      }

      if (isSaveInFlightRef.current) {
        queuedSaveTriggerRef.current =
          queuedSaveTriggerRef.current === 'manual' || trigger === 'manual' ? 'manual' : 'auto';
        return false;
      }

      isSaveInFlightRef.current = true;
      const seq = ++saveSeqRef.current;
      setSaveStatus('saving');
      setSaveErrorMsg(null);
      if (trigger === 'manual') setIsSaving(true);

      const nowIso = new Date().toISOString();
      const existingCoverJson = (profileRef.current?.cover_config as any) || {};
      const prevMeta = existingCoverJson._draft_meta || {};
      const nextRevision = (Number(prevMeta.revision) || 0) + 1;

      const enrichedCoverConfig: Record<string, any> = {
        ...currentCfg,
        _comments: sanitizedComments,
        ...(existingCoverJson._generation_snapshots
          ? { _generation_snapshots: existingCoverJson._generation_snapshots }
          : {}),
        _draft_meta: {
          revision: nextRevision,
          lastSavedAt: nowIso,
          lastSavedBy: currentUserName,
          lastSavedById: currentUserId,
          saveTrigger: trigger,
          templateId: templateParam || prevMeta.templateId || 'buku-pengurusan-lengkap',
          session:
            (sessionParam && sessionParam.startsWith('Sesi ')
              ? sessionParam.replace(/^Sesi\s+/i, '')
              : profileRef.current?.current_session) || '2026/2027',
        },
      };

      const payload = {
        book_draft: html,
        cover_config: enrichedCoverConfig,
        primary_color: currentCfg.primaryColor,
        accent_color: currentCfg.accentColor,
      };

      try {
        suppressNextProfileSyncRef.current = true;
        await saveToSchoolProfile(sid, payload);

        if (seq === saveSeqRef.current) {
          lastSavedDigestRef.current = digest;
          isDirtyRef.current = false;
          setLastSavedAt(new Date());
          setSaveStatus('saved');
          setSaveErrorMsg(null);
          if (viewingHistoryRecord && trigger === 'manual') {
            setViewingHistoryRecord(null);
          }
          try {
            sessionStorage.removeItem(`laras_bb_unsaved_${sid}`);
          } catch {
            // Ignore storage errors
          }
        }
        return true;
      } catch (err: any) {
        const message = err?.message || 'Ralat rangkaian semasa menyimpan draf.';
        setSaveStatus('error');
        setSaveErrorMsg(message);
        isDirtyRef.current = true;
        try {
          sessionStorage.setItem(
            `laras_bb_unsaved_${sid}`,
            JSON.stringify({
              html,
              coverConfig: currentCfg,
              comments: sanitizedComments,
              failedAt: nowIso,
            })
          );
        } catch {
          // Ignore storage quota errors
        }
        if (trigger === 'manual' && !options?.silentAlert) {
          alert('Gagal menyimpan draf: ' + message);
        }
        return false;
      } finally {
        isSaveInFlightRef.current = false;
        if (trigger === 'manual') setIsSaving(false);
        setTimeout(() => {
          suppressNextProfileSyncRef.current = false;
        }, 800);

        if (queuedSaveTriggerRef.current) {
          const nextTrigger = queuedSaveTriggerRef.current;
          queuedSaveTriggerRef.current = null;
          void persistDraftRecord(nextTrigger, { silentAlert: true });
        }
      }
    },
    [
      computeStateDigest,
      currentUserId,
      currentUserName,
      saveToSchoolProfile,
      sessionParam,
      templateParam,
      viewingHistoryRecord,
    ]
  );

  const scheduleAutosave = useCallback(() => {
    isDirtyRef.current = true;
    setSaveStatus((prev) => (prev === 'saving' ? prev : 'unsaved'));

    const activeEditor = editorRef.current;
    const sid = schoolIdRef.current;
    if (activeEditor && !activeEditor.isDestroyed && sid) {
      try {
        sessionStorage.setItem(
          `laras_bb_unsaved_${sid}`,
          JSON.stringify({
            html: activeEditor.getHTML(),
            coverConfig: coverConfigRef.current,
            comments: commentsRef.current.map(({ isNew, ...rest }) => rest),
            updatedAt: new Date().toISOString(),
          })
        );
      } catch {
        // Ignore storage errors
      }
    }

    if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
    autosaveTimerRef.current = setTimeout(() => {
      void persistDraftRecord('auto', { silentAlert: true });
    }, 2500);
  }, [persistDraftRecord]);

  const flushAutosaveNow = useCallback(() => {
    if (autosaveTimerRef.current) {
      clearTimeout(autosaveTimerRef.current);
      autosaveTimerRef.current = null;
    }
    if (isDirtyRef.current) {
      void persistDraftRecord('auto', { silentAlert: true });
    }
  }, [persistDraftRecord]);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Image.configure({ inline: false, allowBase64: true }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      TextStyle,
      Color,
      FontFamily,
      Highlight.configure({ multicolor: true }),
      TableKit.configure({ table: { resizable: true } }),
      ParagraphFormat,
      PageBreak,
      FontSize,
      CommentMark,
      PreserveClasses,
      BookSectionNode,
      InteractiveBookCoverExtension,
    ],
    content: '',
    editorProps: {
      attributes: { class: 'bb-content focus:outline-none min-h-[1000px]', spellcheck: 'true' },
    },
    onUpdate: ({ editor: ed }) => {
      if (isProgrammaticUpdateRef.current) return;
      const { $from } = ed.state.selection;
      for (let d = $from.depth; d > 0; d--) {
        const node = $from.node(d);
        if (node.type.name === 'bookSection') {
          const secId = node.attrs['data-section-id'];
          if (secId && secId !== 'setup' && node.attrs['data-manual-edited'] !== 'true') {
            const pos = $from.before(d);
            isProgrammaticUpdateRef.current = true;
            ed.view.dispatch(
              ed.state.tr.setNodeMarkup(pos, undefined, {
                ...node.attrs,
                'data-manual-edited': 'true',
              })
            );
            isProgrammaticUpdateRef.current = false;
            setManuallyEditedSections((prev) => ({ ...prev, [secId]: true }));
          }
          break;
        }
      }
      scheduleAutosave();
    },
  });

  editorRef.current = editor;

  const ui = useEditorState({
    editor,
    selector: ({ editor: e }) => {
      if (!e) return null;
      const ts = e.getAttributes('textStyle');
      return {
        bold: e.isActive('bold'),
        italic: e.isActive('italic'),
        underline: e.isActive('underline'),
        strike: e.isActive('strike'),
        align:
          (['left', 'center', 'right', 'justify'] as const).find((a) =>
            e.isActive({ textAlign: a })
          ) ?? 'left',
        bullet: e.isActive('bulletList'),
        ordered: e.isActive('orderedList'),
        color: (ts.color as string) ?? '',
        fontSize: (ts.fontSize as string) ?? '11pt',
        fontFamily: (ts.fontFamily as string) ?? 'Arial',
        canUndo: e.can().undo(),
        canRedo: e.can().redo(),
      };
    },
  });

  // Sync updated CoverConfig into the Tiptap BookCoverNode + setup section wrapper
  const applyCoverConfigToEditor = useCallback(
    (nextCfg: CoverConfig, markManual = true, nextHash?: string) => {
      setCoverConfig(nextCfg);
      coverConfigRef.current = nextCfg;
      if (!editor || editor.isDestroyed) return;

      isProgrammaticUpdateRef.current = true;
      let updatedNode = false;

      editor.state.doc.descendants((node, pos) => {
        if (node.type.name === 'bookCover') {
          editor.view.dispatch(
            editor.state.tr.setNodeMarkup(pos, undefined, {
              ...node.attrs,
              config: nextCfg,
            })
          );
          updatedNode = true;
        }
        if (node.type.name === 'bookSection' && node.attrs['data-section-id'] === 'setup') {
          editor.view.dispatch(
            editor.state.tr.setNodeMarkup(pos, undefined, {
              ...node.attrs,
              ...(nextHash ? { 'data-source-hash': nextHash } : {}),
              'data-manual-edited': markManual ? 'true' : 'false',
            })
          );
        }
      });

      if (!updatedNode) {
        const hash = nextHash || getSectionHash('setup', profile, staffData, committeeData);
        let replacedSetup = false;
        editor.state.doc.descendants((node, pos) => {
          if (node.type.name === 'bookSection' && node.attrs['data-section-id'] === 'setup') {
            editor.commands.insertContentAt(
              { from: pos, to: pos + node.nodeSize },
              buildCoverWrapperHTML(nextCfg, hash, markManual)
            );
            replacedSetup = true;
            return false;
          }
        });
        if (!replacedSetup) {
          editor.commands.insertContentAt(
            0,
            buildCoverWrapperHTML(nextCfg, hash, markManual) + '<div data-page-break="true"></div>'
          );
        }
      }

      isProgrammaticUpdateRef.current = false;
      if (markManual) {
        setManuallyEditedSections((prev) => ({ ...prev, setup: true }));
        scheduleAutosave();
      }
    },
    [editor, profile, staffData, committeeData, scheduleAutosave]
  );

  // Persist uploaded logos, building photos & cover styling centrally to school_profile
  const handlePersistAssetsToProfile = useCallback(
    async (partialProfile: Record<string, any>) => {
      if (!schoolId) return;
      suppressNextProfileSyncRef.current = true;
      try {
        await saveToSchoolProfile(schoolId, partialProfile);
      } finally {
        setTimeout(() => {
          suppressNextProfileSyncRef.current = false;
        }, 800);
      }
    },
    [schoolId, saveToSchoolProfile]
  );

  // Save draft & cover_config JSON when closing Cover Designer Drawer
  const handleCloseCoverDrawer = useCallback(async () => {
    setIsCoverDrawerOpen(false);
    setFocusedAssetField(null);
    await persistDraftRecord('auto', { silentAlert: true });
  }, [persistDraftRecord]);

  // Fetch latest school_profile, staff, and committees
  const fetchLatestSchoolData = useCallback(async (silent = false) => {
    if (!silent) setIsSyncing(true);
    setSyncError(null);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        setLoaded(true);
        setIsSyncing(false);
        return null;
      }

      setCurrentUserId(session.user.id);

      const { data: userProfile, error: profErr } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .maybeSingle();

      if (profErr || !userProfile?.school_id) {
        setLoaded(true);
        setIsSyncing(false);
        return null;
      }

      const resolvedAuthor =
        userProfile.full_name ||
        userProfile.name ||
        session.user.user_metadata?.full_name ||
        session.user.email?.split('@')[0] ||
        'Pentadbir';
      setCurrentUserName(resolvedAuthor);

      const sid = userProfile.school_id;
      setSchoolId(sid);
      schoolIdRef.current = sid;

      const [{ data: prof }, { data: staff }, { data: committees }] = await Promise.all([
        supabase
          .from('school_profile')
          .select('*')
          .eq('school_id', sid)
          .limit(1)
          .maybeSingle(),
        supabase.from('staff').select('*').eq('school_id', sid).order('name'),
        supabase
          .from('committees')
          .select('*, staff_committees(id, staff_id, role, workload_weightage, staff(id, name))')
          .eq('school_id', sid)
          .order('created_at'),
      ]);

      const fetchedStaff = staff || [];
      const fetchedCommittees = committees || [];

      if (prof && !suppressNextProfileSyncRef.current) {
        setProfile(prof);
        profileRef.current = prof;
      }
      setStaffData(fetchedStaff);
      setCommitteeData(fetchedCommittees);
      setLastSyncedAt(new Date());
      setLoaded(true);
      setIsSyncing(false);

      return { sid, prof, fetchedStaff, fetchedCommittees };
    } catch (err: any) {
      setSyncError(err?.message || 'Gagal menyelaraskan data terkini.');
      setLoaded(true);
      setIsSyncing(false);
      return null;
    }
  }, []);

  const buildDocumentFromSource = useCallback(
    (
      activeProf: any,
      fetchedStaff: any[],
      fetchedCommittees: any[],
      cfg: CoverConfig,
      allowedSections: Set<string> | null
    ) => {
      const sectionsHTML = buildAllSections(activeProf, fetchedStaff, fetchedCommittees, cfg);
      const setupHash = getSectionHash('setup', activeProf, fetchedStaff, fetchedCommittees);

      return bookSections
        .filter((s) => !allowedSections || allowedSections.has(s.id))
        .map((s) => {
          if (s.id === 'setup') {
            return (
              buildCoverWrapperHTML(cfg, setupHash, false) +
              '<div data-page-break="true"></div>'
            );
          }
          if (!sectionsHTML[s.id]) return '';
          const hash = getSectionHash(s.id, activeProf, fetchedStaff, fetchedCommittees);
          return `<div data-section-id="${s.id}" id="section-${s.id}" data-source-hash="${hash}" data-manual-edited="false">${sectionsHTML[s.id]}</div><div data-page-break="true"></div>`;
        })
        .join('');
    },
    []
  );

  // StrictMode-safe initial document population
  useEffect(() => {
    if (!editor || editor.isDestroyed || initializedEditorRef.current === editor) return;

    let cancelled = false;

    (async () => {
      const res = await fetchLatestSchoolData(false);
      if (cancelled || !res || !editor || editor.isDestroyed) return;

      initializedEditorRef.current = editor;
      const activeProf = res.prof || {};
      const { sid, fetchedStaff, fetchedCommittees } = res;
      const initialCover = buildDefaultCoverConfig(activeProf);

      if (sessionParam && sessionParam.startsWith('Sesi ')) {
        const cleanSession = sessionParam.replace(/^Sesi\s+/i, '').trim();
        initialCover.session = `SESI AKADEMIK ${cleanSession}`;
      }
      if (templateParam === 'lampiran-jawatankuasa') {
        initialCover.title = 'LAMPIRAN JAWATANKUASA & BIDANG TUGAS';
        if (sessionParam) {
          initialCover.subtitle = sessionParam.toUpperCase();
        }
      }

      setCoverConfig(initialCover);
      coverConfigRef.current = initialCover;

      // 1. Reopen historical generated version if requested (?historyId=...)
      if (historyIdParam) {
        const profileSnapshots = (activeProf?.cover_config as any)?._generation_snapshots || {};
        let histMeta = profileSnapshots[historyIdParam] || null;
        let histRow: any = histMeta;

        if (!histMeta) {
          const { data: fetchedRow } = await supabase
            .from('document_history')
            .select('*')
            .eq('id', historyIdParam)
            .maybeSingle();
          if (fetchedRow) {
            histRow = fetchedRow;
            histMeta = profileSnapshots[fetchedRow.id] || profileSnapshots[fetchedRow.name] || null;
          }
        }

        const snapshotHtml = histMeta?.html_snapshot || histRow?.content;
        if (histRow && snapshotHtml) {
          setViewingHistoryRecord(histRow);
          const histCover = {
            ...initialCover,
            ...(histMeta?.cover_config || {}),
          };
          setCoverConfig(histCover);
          coverConfigRef.current = histCover;

          const histComments: BookComment[] = Array.isArray(histMeta?.comments)
            ? histMeta.comments
            : [];
          setComments(histComments);

          isProgrammaticUpdateRef.current = true;
          editor.commands.setContent(snapshotHtml);
          isProgrammaticUpdateRef.current = false;

          lastSavedDigestRef.current = computeStateDigest(snapshotHtml, histCover, histComments);
          setSaveStatus('saved');
          if (histRow.created_at) setLastSavedAt(new Date(histRow.created_at));
          return;
        }
      }

      // 2. Recover any un-synced local backup from an interrupted save
      let recoveredPayload: any = null;
      try {
        const rawBackup = sessionStorage.getItem(`laras_bb_unsaved_${sid}`);
        if (rawBackup) {
          const parsedBackup = JSON.parse(rawBackup);
          const dbSavedAt = activeProf?.cover_config?._draft_meta?.lastSavedAt;
          const backupTime = parsedBackup.failedAt || parsedBackup.updatedAt;
          if (
            parsedBackup?.html &&
            backupTime &&
            (!dbSavedAt || new Date(backupTime).getTime() > new Date(dbSavedAt).getTime() + 2000)
          ) {
            recoveredPayload = parsedBackup;
          } else {
            sessionStorage.removeItem(`laras_bb_unsaved_${sid}`);
          }
        }
      } catch {
        // Ignore storage errors
      }

      const savedComments: BookComment[] = Array.isArray(activeProf?.cover_config?._comments)
        ? activeProf.cover_config._comments
        : [];
      const savedMetaTime = activeProf?.cover_config?._draft_meta?.lastSavedAt;
      if (savedMetaTime) {
        setLastSavedAt(new Date(savedMetaTime));
        setSaveStatus('saved');
      }

      isProgrammaticUpdateRef.current = true;

      if (recoveredPayload) {
        const mergedRecoverCover = { ...initialCover, ...(recoveredPayload.coverConfig || {}) };
        const recoveredComments: BookComment[] = Array.isArray(recoveredPayload.comments)
          ? recoveredPayload.comments
          : savedComments;
        setCoverConfig(mergedRecoverCover);
        coverConfigRef.current = mergedRecoverCover;
        setComments(recoveredComments);
        editor.commands.setContent(recoveredPayload.html);
        isProgrammaticUpdateRef.current = false;
        isDirtyRef.current = true;
        setSaveStatus('unsaved');
        void persistDraftRecord('auto', { silentAlert: true });
        return;
      }

      const allowedSections = resolveTemplateSectionIds(templateParam, sessionParam);

      if (allowedSections || !activeProf.book_draft || activeProf.book_draft.length <= 15) {
        const finalHTML = buildDocumentFromSource(
          activeProf,
          fetchedStaff,
          fetchedCommittees,
          initialCover,
          allowedSections
        );
        setComments(savedComments);
        editor.commands.setContent(finalHTML);
        isProgrammaticUpdateRef.current = false;
        lastSavedDigestRef.current = computeStateDigest(finalHTML, initialCover, savedComments);
        return;
      }

      editor.commands.setContent(activeProf.book_draft);

      const temp = document.createElement('div');
      temp.innerHTML = activeProf.book_draft;
      const coverEl = temp.querySelector('[data-book-cover]');
      let resolvedCover = initialCover;

      if (coverEl?.getAttribute('data-cover-config')) {
        try {
          const parsed = JSON.parse(
            decodeURIComponent(coverEl.getAttribute('data-cover-config')!)
          );
          resolvedCover = {
            ...initialCover,
            ...parsed,
            logo_url: activeProf.logo_url || parsed.logo_url || '',
            kpm_logo_url: activeProf.kpm_logo_url || parsed.kpm_logo_url || '',
            jpn_logo_url: activeProf.jpn_logo_url || parsed.jpn_logo_url || '',
            ppd_logo_url: activeProf.ppd_logo_url || parsed.ppd_logo_url || '',
            cover_photo_url: activeProf.cover_photo_url || parsed.cover_photo_url || '',
          };
          setCoverConfig(resolvedCover);
          coverConfigRef.current = resolvedCover;
        } catch {
          // Keep default cover config
        }
      } else {
        const setupHash = getSectionHash('setup', activeProf, fetchedStaff, fetchedCommittees);
        editor.state.doc.descendants((node, pos) => {
          if (node.type.name === 'bookSection' && node.attrs['data-section-id'] === 'setup') {
            editor.commands.insertContentAt(
              { from: pos, to: pos + node.nodeSize },
              buildCoverWrapperHTML(initialCover, setupHash, false)
            );
            return false;
          }
        });
      }

      const domCommentIds = new Set<string>();
      temp.querySelectorAll('span[data-comment-id]').forEach((span) => {
        const cid = span.getAttribute('data-comment-id');
        if (cid) domCommentIds.add(cid);
      });

      const reconciledComments: BookComment[] = [...savedComments];
      domCommentIds.forEach((cid) => {
        if (!reconciledComments.some((c) => c.id === cid)) {
          const span = temp.querySelector(`span[data-comment-id="${cid}"]`);
          const secEl = span?.closest('[data-section-id]');
          const secId = secEl?.getAttribute('data-section-id') || undefined;
          reconciledComments.push({
            id: cid,
            text: '',
            author: currentUserName,
            sectionId: secId,
            sectionTitle: getSectionLabelById(secId),
            quote: span?.textContent?.trim() || '',
            status: 'open',
            createdAt: savedMetaTime || new Date().toISOString(),
            isNew: true,
          });
        }
      });

      setComments(reconciledComments);

      const editedMap: Record<string, boolean> = {};
      temp.querySelectorAll('[data-section-id]').forEach((el) => {
        const sidAttr = el.getAttribute('data-section-id');
        if (sidAttr && el.getAttribute('data-manual-edited') === 'true') {
          editedMap[sidAttr] = true;
        }
      });
      setManuallyEditedSections(editedMap);

      isProgrammaticUpdateRef.current = false;
      lastSavedDigestRef.current = computeStateDigest(
        editor.getHTML(),
        resolvedCover,
        reconciledComments
      );
    })();

    return () => {
      cancelled = true;
    };
  }, [
    editor,
    fetchLatestSchoolData,
    buildDocumentFromSource,
    computeStateDigest,
    currentUserName,
    historyIdParam,
    persistDraftRecord,
    sessionParam,
    templateParam,
  ]);

  // Auto-trigger print when opened from history with ?autoPrint=1
  const autoPrintedRef = useRef(false);
  useEffect(() => {
    if (loaded && viewingHistoryRecord && autoPrintParam === '1' && !autoPrintedRef.current) {
      autoPrintedRef.current = true;
      setTimeout(() => {
        executePrint();
      }, 400);
    }
  }, [loaded, viewingHistoryRecord, autoPrintParam]);

  // Flush autosave on visibility change / unmount & warn before closing tab with unsaved changes
  useEffect(() => {
    const handleVisibilitySave = () => {
      if (document.visibilityState === 'hidden') {
        flushAutosaveNow();
      }
    };

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirtyRef.current || saveStatus === 'error' || saveStatus === 'saving') {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    document.addEventListener('visibilitychange', handleVisibilitySave);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilitySave);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
      if (isDirtyRef.current) {
        void persistDraftRecord('auto', { silentAlert: true });
      }
    };
  }, [flushAutosaveNow, persistDraftRecord, saveStatus]);

  // Real-time Supabase subscriptions + tab-focus revalidation
  useEffect(() => {
    if (!schoolId) return;

    let debounceTimer: ReturnType<typeof setTimeout> | null = null;
    const scheduleRefresh = () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        fetchLatestSchoolData(true);
      }, 600);
    };

    const channel = supabase
      .channel(`book-builder-sync-${schoolId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'school_profile', filter: `school_id=eq.${schoolId}` },
        () => {
          if (!suppressNextProfileSyncRef.current) scheduleRefresh();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'staff', filter: `school_id=eq.${schoolId}` },
        scheduleRefresh
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'committees', filter: `school_id=eq.${schoolId}` },
        scheduleRefresh
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'staff_committees' },
        scheduleRefresh
      )
      .subscribe();

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchLatestSchoolData(true);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      supabase.removeChannel(channel);
    };
  }, [schoolId, fetchLatestSchoolData]);

  // Auto-sync unedited Live sections when DB records change; flag manually edited ones
  useEffect(() => {
    if (!loaded || !editor || editor.isDestroyed || !profile || viewingHistoryRecord) return;

    const timer = setTimeout(() => {
      const currentHtml = editor.getHTML();
      const temp = document.createElement('div');
      temp.innerHTML = currentHtml;

      const newOutdated: Record<string, boolean> = {};
      const autoRefreshIds: string[] = [];

      bookSections.forEach((s) => {
        if (s.mode !== 'Live') return;
        const el = temp.querySelector(`[data-section-id="${s.id}"]`);
        if (el) {
          const embeddedHash = el.getAttribute('data-source-hash');
          const isManual = el.getAttribute('data-manual-edited') === 'true';
          const currentHash = getSectionHash(s.id, profile, staffData, committeeData);

          if (embeddedHash && currentHash && embeddedHash !== currentHash) {
            if (isManual) {
              newOutdated[s.id] = true;
            } else {
              autoRefreshIds.push(s.id);
            }
          }
        }
      });

      if (autoRefreshIds.length > 0) {
        isProgrammaticUpdateRef.current = true;
        autoRefreshIds.forEach((secId) => {
          const newHash = getSectionHash(secId, profile, staffData, committeeData);

          if (secId === 'setup') {
            const refreshedCover = buildDefaultCoverConfig(profile);
            setCoverConfig(refreshedCover);
            coverConfigRef.current = refreshedCover;
            editor.state.doc.descendants((node, pos) => {
              if (node.type.name === 'bookSection' && node.attrs['data-section-id'] === 'setup') {
                editor.commands.insertContentAt(
                  { from: pos, to: pos + node.nodeSize },
                  buildCoverWrapperHTML(refreshedCover, newHash, false)
                );
                return false;
              }
            });
            return;
          }

          const newHTML = buildSection(
            secId,
            profile,
            staffData,
            committeeData,
            coverConfigRef.current
          );
          editor.state.doc.descendants((node, pos) => {
            if (node.type.name === 'bookSection' && node.attrs['data-section-id'] === secId) {
              editor.commands.insertContentAt(
                { from: pos, to: pos + node.nodeSize },
                `<div data-section-id="${secId}" id="section-${secId}" data-source-hash="${newHash}" data-manual-edited="false">${newHTML}</div>`
              );
              return false;
            }
          });
        });
        isProgrammaticUpdateRef.current = false;
      }

      setOutdatedSections(newOutdated);
    }, 450);

    return () => clearTimeout(timer);
  }, [staffData, committeeData, profile, loaded, editor, viewingHistoryRecord]);

  // Scroll spy for sidebar active section
  useEffect(() => {
    const container = document.getElementById('scroll-container');
    if (!container) return;

    const handleScroll = () => {
      const sections = Array.from(document.querySelectorAll('[data-section-id]'));
      let current = activeSection;

      sections.forEach((sec) => {
        const rect = sec.getBoundingClientRect();
        if (rect.top >= 0 && rect.top < 400) {
          current = sec.getAttribute('data-section-id') || activeSection;
        }
      });

      if (current && current !== activeSection) {
        setActiveSection(current);
      }
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [activeSection]);

  const updateTOC = () => {
    if (!editor || editor.isDestroyed || !printRef.current) return;
    const editorDom = printRef.current;
    const useRoman = coverConfigRef.current.romanPreliminaries ?? true;

    const firstMainEl = editorDom.querySelector('[data-section-id="direktori"]') as HTMLElement;
    const mainStartPage = firstMainEl ? Math.floor(firstMainEl.offsetTop / 1123) + 1 : 2;

    let tocHtml =
      `<p class="bb-chapter-kicker">BAHAGIAN 01</p>` +
      `<h1>1.0 Kandungan</h1>` +
      `<p class="bb-chapter-subtitle">Indeks Bahagian Utama Buku Pengurusan Sekolah</p>` +
      `<table class="toc-table"><tbody>`;

    bookSections
      .filter((s) => s.id !== 'setup' && s.id !== 'toc')
      .forEach((s) => {
        const el = editorDom.querySelector(`[data-section-id="${s.id}"]`) as HTMLElement;
        if (el) {
          const rawPage = Math.floor(el.offsetTop / 1123) + 1;
          let displayPage = String(rawPage);
          if (useRoman) {
            if (s.part === 'preliminary') {
              displayPage = toRoman(Math.max(1, rawPage - 1));
            } else {
              displayPage = String(Math.max(1, rawPage - mainStartPage + 1));
            }
          }
          tocHtml +=
            `<tr>` +
            `<td style="white-space: nowrap; padding-right: 12px;"><p><a href="#section-${s.id}">${s.title}</a></p></td>` +
            `<td class="toc-leader"></td>` +
            `<td style="text-align: right; padding-left: 12px;"><p style="text-align: right">${displayPage}</p></td>` +
            `</tr>`;
        }
      });
    tocHtml += '</tbody></table>';

    isProgrammaticUpdateRef.current = true;
    editor.state.doc.descendants((node, pos) => {
      if (node.type.name === 'bookSection' && node.attrs['data-section-id'] === 'toc') {
        const from = pos + 1;
        const to = pos + node.nodeSize - 1;
        editor.commands.insertContentAt({ from, to }, tocHtml);
        return false;
      }
    });
    isProgrammaticUpdateRef.current = false;
  };

  const saveDraft = async () => {
    if (!editor) return;
    if (autosaveTimerRef.current) {
      clearTimeout(autosaveTimerRef.current);
      autosaveTimerRef.current = null;
    }
    setIsSaving(true);
    updateTOC();

    setTimeout(async () => {
      const ok = await persistDraftRecord('manual');
      if (ok) {
        alert('Draf Buku Pengurusan telah berjaya disimpan!');
      }
    }, 200);
  };

  const recordBookGeneration = useCallback(
    async (format: 'docx' | 'pdf', fileName: string, sizeLabel: string) => {
      const sid = schoolIdRef.current;
      const activeEditor = editorRef.current;
      if (!sid || !activeEditor || activeEditor.isDestroyed) return;

      try {
        const existingCoverJson = (profileRef.current?.cover_config as any) || {};
        const prevSnapshots: Record<string, any> = existingCoverJson._generation_snapshots || {};
        const nextVersion = Object.keys(prevSnapshots).length + 1;

        const sessionLabel =
          coverConfigRef.current.session?.replace(/^SESI AKADEMIK\s+/i, '').trim() ||
          profileRef.current?.current_session ||
          '2026/2027';
        const bookTitle = coverConfigRef.current.title || 'Buku Pengurusan Sekolah';
        const displayName = `${bookTitle} (${sessionLabel}) — v${nextVersion}`;
        const htmlSnapshot = activeEditor.getHTML();
        const snapshotId = uuidv4();
        const createdAtIso = new Date().toISOString();

        const snapshotPayload = {
          id: snapshotId,
          name: displayName,
          type: format,
          size: sizeLabel,
          created_at: createdAtIso,
          version: nextVersion,
          title: bookTitle,
          school_name: coverConfigRef.current.schoolName || profileRef.current?.name || '',
          session: sessionLabel,
          template_id:
            templateParam ||
            prevSnapshots?._draft_meta?.templateId ||
            coverConfigRef.current.templateId,
          generated_by: currentUserName,
          generated_by_id: currentUserId,
          file_name: fileName,
          html_snapshot: htmlSnapshot,
          cover_config: coverConfigRef.current,
          comments: commentsRef.current.map(({ isNew, ...rest }) => rest),
        };

        // Keep the latest 10 generation snapshots inside school_profile.cover_config
        const entries = Object.entries(prevSnapshots).slice(-9);
        const updatedSnapshots = {
          ...Object.fromEntries(entries),
          [snapshotId]: snapshotPayload,
          [displayName]: snapshotPayload,
        };

        await saveToSchoolProfile(sid, {
          cover_config: {
            ...existingCoverJson,
            ...coverConfigRef.current,
            _comments: commentsRef.current.map(({ isNew, ...rest }) => rest),
            _generation_snapshots: updatedSnapshots,
          },
        });

        // Insert clean row into document_history without unknown columns
        const { error: scopedErr } = await supabase.from('document_history').insert({
          school_id: sid,
          name: displayName,
          type: format,
          size: sizeLabel,
        });

        if (scopedErr) {
          await supabase.from('document_history').insert({
            name: displayName,
            type: format,
            size: sizeLabel,
          });
        }
      } catch {
        // Keep export non-blocking if history insert fails
      }
    },
    [currentUserId, currentUserName, saveToSchoolProfile, templateParam]
  );

  const regenerateAll = () => {
    if (!editor) return;
    if (
      !window.confirm(
        'Adakah anda pasti mahu menjana semula keseluruhan dokumen daripada data terkini sistem? Semua suntingan manual anda akan digantikan.'
      )
    )
      return;

    const activeProf = profile || {};
    const freshCover = buildDefaultCoverConfig(activeProf);
    setCoverConfig(freshCover);
    coverConfigRef.current = freshCover;

    isProgrammaticUpdateRef.current = true;
    const finalHTML = buildDocumentFromSource(
      activeProf,
      staffData,
      committeeData,
      freshCover,
      null
    );
    editor.commands.setContent(finalHTML);
    isProgrammaticUpdateRef.current = false;
    setOutdatedSections({});
    setManuallyEditedSections({});
    setViewingHistoryRecord(null);
    scheduleAutosave();
  };

  const regenerateSection = (sectionId: string) => {
    if (!editor) return;
    if (
      !window.confirm(
        'Bahagian ini mempunyai suntingan manual dan data sumber di sistem telah berubah. Muat semula data terbaharu daripada pangkalan data?'
      )
    )
      return;

    const activeProf = profile || {};
    const newHash = getSectionHash(sectionId, activeProf, staffData, committeeData);

    if (sectionId === 'setup') {
      const freshCover = buildDefaultCoverConfig(activeProf);
      applyCoverConfigToEditor(freshCover, false, newHash);
      setOutdatedSections((prev) => {
        const n = { ...prev };
        delete n.setup;
        return n;
      });
      setManuallyEditedSections((prev) => {
        const n = { ...prev };
        delete n.setup;
        return n;
      });
      scheduleAutosave();
      scrollToSection('setup');
      return;
    }

    const newHTML = buildSection(
      sectionId,
      activeProf,
      staffData,
      committeeData,
      coverConfigRef.current
    );
    let found = false;
    isProgrammaticUpdateRef.current = true;

    editor.state.doc.descendants((node, pos) => {
      if (node.type.name === 'bookSection' && node.attrs['data-section-id'] === sectionId) {
        const from = pos;
        const to = pos + node.nodeSize;
        editor.commands.insertContentAt(
          { from, to },
          `<div data-section-id="${sectionId}" id="section-${sectionId}" data-source-hash="${newHash}" data-manual-edited="false">${newHTML}</div>`
        );
        found = true;
        return false;
      }
    });

    if (!found && newHTML) {
      editor.commands.insertContent(
        `<div data-section-id="${sectionId}" id="section-${sectionId}" data-source-hash="${newHash}" data-manual-edited="false">${newHTML}</div><div data-page-break="true"></div>`
      );
    }
    isProgrammaticUpdateRef.current = false;

    setOutdatedSections((prev) => {
      const n = { ...prev };
      delete n[sectionId];
      return n;
    });
    setManuallyEditedSections((prev) => {
      const n = { ...prev };
      delete n[sectionId];
      return n;
    });
    scheduleAutosave();
    scrollToSection(sectionId);
  };

  const scrollToSection = (id: string) => {
    flushAutosaveNow();
    const el = document.querySelector(`[data-section-id="${id}"]`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const resolveCommentSection = useCallback((commentId: string, fallbackSecId?: string) => {
    const span = document.querySelector(`span[data-comment-id="${commentId}"]`);
    const secEl = span?.closest('[data-section-id]');
    const secId = secEl?.getAttribute('data-section-id') || fallbackSecId;
    return {
      sectionId: secId,
      sectionTitle: getSectionLabelById(secId),
    };
  }, []);

  const addComment = () => {
    if (!editor || editor.state.selection.empty) {
      alert('Sila highlight teks untuk menambah komen.');
      return;
    }
    const { from, to, $from } = editor.state.selection;
    const selectedQuote = editor.state.doc.textBetween(from, to, ' ').trim();

    let secId: string | undefined;
    for (let d = $from.depth; d > 0; d--) {
      const node = $from.node(d);
      if (node.type.name === 'bookSection') {
        secId = node.attrs['data-section-id'];
        break;
      }
    }

    const id = uuidv4();
    editor.chain().focus().setComment(id).run();

    const newItem: BookComment = {
      id,
      text: '',
      author: currentUserName,
      authorId: currentUserId,
      sectionId: secId,
      sectionTitle: getSectionLabelById(secId),
      quote: selectedQuote.slice(0, 120),
      status: 'open',
      createdAt: new Date().toISOString(),
      isNew: true,
    };

    const nextComments = [newItem, ...commentsRef.current];
    setComments(nextComments);
    commentsRef.current = nextComments;
    setCommentDrafts((prev) => ({ ...prev, [id]: '' }));
    setShowComments(true);
    scheduleAutosave();
  };

  const saveComment = (id: string, text: string) => {
    const trimmed = text.trim();
    if (!trimmed) {
      alert('Sila masukkan isi komen sebelum menyimpan.');
      return;
    }
    const nextComments = commentsRef.current.map((c) => {
      if (c.id !== id) return c;
      const loc = resolveCommentSection(id, c.sectionId);
      return {
        ...c,
        text: trimmed,
        sectionId: loc.sectionId,
        sectionTitle: loc.sectionTitle,
        updatedAt: new Date().toISOString(),
        isNew: false,
      };
    });
    setComments(nextComments);
    commentsRef.current = nextComments;
    setCommentDrafts((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    scheduleAutosave();
  };

  const toggleResolveComment = (id: string) => {
    const nextComments = commentsRef.current.map((c) => {
      if (c.id !== id) return c;
      return {
        ...c,
        status: c.status === 'resolved' ? ('open' as const) : ('resolved' as const),
        updatedAt: new Date().toISOString(),
      };
    });
    setComments(nextComments);
    commentsRef.current = nextComments;
    scheduleAutosave();
  };

  const deleteComment = (id: string) => {
    if (editor && !editor.isDestroyed) {
      isProgrammaticUpdateRef.current = true;
      const tr = editor.state.tr;
      let removedAny = false;
      editor.state.doc.descendants((node, pos) => {
        if (!node.isText) return;
        const targetMark = node.marks.find(
          (m) => m.type.name === 'comment' && m.attrs?.commentId === id
        );
        if (targetMark) {
          tr.removeMark(pos, pos + node.nodeSize, targetMark);
          removedAny = true;
        }
      });
      if (removedAny) {
        editor.view.dispatch(tr);
      }
      isProgrammaticUpdateRef.current = false;
    }

    const nextComments = commentsRef.current.filter((x) => x.id !== id);
    setComments(nextComments);
    commentsRef.current = nextComments;
    setCommentDrafts((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    scheduleAutosave();
  };

  const scrollToComment = (id: string) => {
    const el = document.querySelector(`span[data-comment-id="${id}"]`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const executePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Buku_Pengurusan_${profile?.current_session?.replace('/', '_') || 'Laras'}`,
    onAfterPrint: () => {
      const sessionSlug =
        coverConfigRef.current.session
          ?.replace(/^SESI AKADEMIK\s+/i, '')
          .replace(/[^a-zA-Z0-9_-]+/g, '_') ||
        profileRef.current?.current_session?.replace('/', '_') ||
        'Laras';
      const approxBytes = new Blob([editorRef.current?.getHTML() || '']).size;
      const sizeLabel = `${Math.max(1, Math.round(approxBytes / 1024))} KB`;
      void recordBookGeneration('pdf', `Buku_Pengurusan_${sessionSlug}.pdf`, sizeLabel);
    },
  });

  const handlePrintPdfWithTOC = () => {
    flushAutosaveNow();
    updateTOC();
    setTimeout(() => {
      executePrint();
    }, 300);
  };

  const handleExportDocx = async () => {
    if (!editor) return;
    setIsExportingDocx(true);
    flushAutosaveNow();
    updateTOC();
    setTimeout(async () => {
      try {
        const result = await exportEditorHtmlToDocx(editor.getHTML(), {
          ...(profile || {}),
          cover_config: coverConfigRef.current,
          primary_color: coverConfigRef.current.primaryColor,
          accent_color: coverConfigRef.current.accentColor,
        });
        await recordBookGeneration('docx', result.fileName, result.sizeLabel);
      } catch (err: any) {
        alert('Gagal menjana fail DOCX: ' + (err?.message || 'Ralat tidak dijangka'));
      } finally {
        setIsExportingDocx(false);
      }
    }, 250);
  };

  const changeFontSize = (delta: number) => {
    if (!editor) return;
    const currentSize = ui?.fontSize ? parseInt(ui.fontSize.replace('pt', ''), 10) : 11;
    let newSize = currentSize + delta;
    if (newSize < 8) newSize = 8;
    if (newSize > 72) newSize = 72;
    editor.chain().focus().setMark('textStyle', { fontSize: `${newSize}pt` }).run();
  };

  const outdatedCount = Object.keys(outdatedSections).length;
  const activeBtnClass = 'bg-slate-100 border border-slate-200 text-ink';
  const inactiveBtnClass = 'border border-transparent text-slate-500 hover:text-ink hover:bg-slate-50';

  return (
    <div className="flex h-full w-full flex-col bg-canvas font-sans overflow-hidden">
      {/* Top Action Bar */}
      <div className="z-20 shrink-0 border-b border-slate-200 bg-white flex flex-col">
        <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-2.5">
            <Link
              className="p-1.5 rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-slate-500 hover:text-ink transition-colors"
              to="/reports"
            >
              <ArrowLeft size={14} />
            </Link>
            <div>
              <h1 className="text-xs font-bold text-ink">
                Buku Pengurusan Sesi {profile?.current_session || '2026/2027'}
              </h1>
              <div className="flex items-center gap-2 text-[10px] text-slate-500">
                {syncError ? (
                  <span className="text-rose flex items-center gap-1">
                    <AlertCircle size={11} /> {syncError}
                  </span>
                ) : (
                  <span className="text-forest flex items-center gap-1">
                    <CheckCircle2 size={11} /> Pautan Data Langsung Aktif
                    {lastSyncedAt &&
                      ` (${lastSyncedAt.toLocaleTimeString('ms-MY', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })})`}
                  </span>
                )}
                {saveStatus === 'saving' && (
                  <span className="text-slate-500 flex items-center gap-1">
                    • <Loader2 size={10} className="animate-spin" /> Menyimpan draf...
                  </span>
                )}
                {saveStatus === 'saved' && lastSavedAt && (
                  <span className="text-slate-500">
                    • Draf disimpan (
                    {lastSavedAt.toLocaleTimeString('ms-MY', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                    )
                  </span>
                )}
                {saveStatus === 'unsaved' && (
                  <span className="text-amber-600">• Perubahan belum disimpan</span>
                )}
                {saveStatus === 'error' && (
                  <span className="text-rose font-medium" title={saveErrorMsg || undefined}>
                    • Gagal menyimpan draf
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setFocusedAssetField(null);
                setIsCoverDrawerOpen(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold text-ink bg-amber/15 border border-amber/30 rounded-lg hover:bg-amber/25 transition-colors"
            >
              <BookOpen size={13} className="text-amber-700" />
              Reka Muka Hadapan
            </button>

            <button
              type="button"
              onClick={() => fetchLatestSchoolData(false)}
              disabled={isSyncing}
              className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50"
              title="Semak data terkini daripada pangkalan data"
            >
              <RefreshCw size={13} className={isSyncing ? 'animate-spin' : ''} />
              Semak Data Terkini
            </button>

            <button
              type="button"
              onClick={handleExportDocx}
              disabled={isExportingDocx}
              className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold text-ink bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50"
            >
              {isExportingDocx ? (
                <Loader2 size={13} className="animate-spin" />
              ) : (
                <Download size={13} />
              )}
              Eksport .DOCX
            </button>

            <button
              type="button"
              onClick={handlePrintPdfWithTOC}
              className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold text-ink bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
            >
              <Printer size={13} /> Cetak / PDF
            </button>

            <button
              type="button"
              onClick={regenerateAll}
              className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
            >
              <RotateCcw size={13} /> Jana Semula Semua
            </button>

            <button
              type="button"
              onClick={saveDraft}
              disabled={isSaving}
              className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold text-white bg-ink rounded-lg hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              {isSaving ? <Loader2 className="animate-spin" size={14} /> : <Save size={14} />}
              Simpan Draf
            </button>
          </div>
        </div>

        {/* Outdated Manual-Edited Sections Banner */}
        {outdatedCount > 0 && (
          <div className="px-4 py-2 bg-sky/10 border-b border-sky/20 flex items-center justify-between text-xs">
            <span className="text-sky-900 font-medium flex items-center gap-2">
              <Sparkles size={14} className="text-sky shrink-0" />
              Terdapat <strong>{outdatedCount} seksyen</strong> yang mempunyai kemas kini baharu dalam pangkalan data tetapi dilindungi kerana telah disunting secara manual. Klik ikon <RefreshCw size={12} className="inline mx-0.5" /> pada panel kiri jika mahu memuat semula.
            </span>
          </div>
        )}

        {/* Formatting Toolbar */}
        <div className="flex flex-wrap items-center px-4 py-2 gap-1 min-h-12">
          {editor && ui && (
            <>
              <button
                type="button"
                onClick={() => editor.chain().focus().undo().run()}
                className={`p-1.5 rounded-md ${inactiveBtnClass}`}
                title="Buat Asal"
              >
                <Undo2 size={16} />
              </button>
              <button
                type="button"
                onClick={() => editor.chain().focus().redo().run()}
                className={`p-1.5 rounded-md ${inactiveBtnClass}`}
                title="Buat Semula"
              >
                <Redo2 size={16} />
              </button>

              <div className="w-px h-5 bg-slate-200 mx-1.5 shrink-0"></div>

              <select
                className="bg-transparent text-xs font-semibold text-ink outline-none cursor-pointer hover:bg-slate-50 border border-transparent hover:border-slate-200 rounded-md px-1.5 py-1 w-32 transition-all"
                value={ui.fontFamily.replace(/["']/g, '')}
                onChange={(e) =>
                  e.target.value
                    ? editor.chain().focus().setFontFamily(e.target.value).run()
                    : editor.chain().focus().unsetFontFamily().run()
                }
              >
                <option value="">Arial</option>
                {FONTS.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>

              <div className="w-px h-5 bg-slate-200 mx-1.5 shrink-0"></div>

              <div className="flex items-center bg-slate-50 border border-slate-200 rounded-md overflow-hidden shrink-0">
                <button
                  type="button"
                  onClick={() => changeFontSize(-1)}
                  className="px-2 py-1 text-slate-500 hover:bg-slate-100 hover:text-ink"
                >
                  <Minus size={14} />
                </button>
                <input
                  type="text"
                  value={ui.fontSize ? ui.fontSize.replace('pt', '') : 11}
                  readOnly
                  className="w-8 text-center text-[11px] font-semibold bg-transparent outline-none text-ink"
                />
                <button
                  type="button"
                  onClick={() => changeFontSize(1)}
                  className="px-2 py-1 text-slate-500 hover:bg-slate-100 hover:text-ink"
                >
                  <Plus size={14} />
                </button>
              </div>

              <div className="w-px h-5 bg-slate-200 mx-1.5 shrink-0"></div>

              <button
                type="button"
                onClick={() => editor.chain().focus().toggleBold().run()}
                className={`p-1.5 rounded-md ${ui.bold ? activeBtnClass : inactiveBtnClass}`}
              >
                <Bold size={16} />
              </button>
              <button
                type="button"
                onClick={() => editor.chain().focus().toggleItalic().run()}
                className={`p-1.5 rounded-md ${ui.italic ? activeBtnClass : inactiveBtnClass}`}
              >
                <Italic size={16} />
              </button>
              <button
                type="button"
                onClick={() => editor.chain().focus().toggleUnderline().run()}
                className={`p-1.5 rounded-md ${ui.underline ? activeBtnClass : inactiveBtnClass}`}
              >
                <UnderlineIcon size={16} />
              </button>
              <button
                type="button"
                onClick={() => editor.chain().focus().toggleStrike().run()}
                className={`p-1.5 rounded-md ${ui.strike ? activeBtnClass : inactiveBtnClass}`}
              >
                <Strikethrough size={16} />
              </button>
              <button
                type="button"
                onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()}
                className={`p-1.5 rounded-md ${inactiveBtnClass}`}
                title="Buang Format"
              >
                <RemoveFormatting size={16} />
              </button>

              <ColorPickerDropdown
                icon={Palette}
                color={ui.color}
                onChange={(c: string) => editor.chain().focus().setColor(c).run()}
                tooltip="Warna Teks"
              />
              <ColorPickerDropdown
                icon={Highlighter}
                color="#FFF59D"
                onChange={(c: string) => editor.chain().focus().setHighlight({ color: c }).run()}
                tooltip="Serlahan Teks"
              />

              <div className="w-px h-5 bg-slate-200 mx-1.5 shrink-0"></div>

              <button
                type="button"
                onClick={() => editor.chain().focus().setTextAlign('left').run()}
                className={`p-1.5 rounded-md ${ui.align === 'left' ? activeBtnClass : inactiveBtnClass}`}
              >
                <AlignLeft size={16} />
              </button>
              <button
                type="button"
                onClick={() => editor.chain().focus().setTextAlign('center').run()}
                className={`p-1.5 rounded-md ${ui.align === 'center' ? activeBtnClass : inactiveBtnClass}`}
              >
                <AlignCenter size={16} />
              </button>
              <button
                type="button"
                onClick={() => editor.chain().focus().setTextAlign('right').run()}
                className={`p-1.5 rounded-md ${ui.align === 'right' ? activeBtnClass : inactiveBtnClass}`}
              >
                <AlignRight size={16} />
              </button>
              <button
                type="button"
                onClick={() => editor.chain().focus().setTextAlign('justify').run()}
                className={`p-1.5 rounded-md ${ui.align === 'justify' ? activeBtnClass : inactiveBtnClass}`}
              >
                <AlignJustify size={16} />
              </button>

              <div className="w-px h-5 bg-slate-200 mx-1.5 shrink-0"></div>

              <button
                type="button"
                onClick={() => editor.chain().focus().toggleBulletList().run()}
                className={`p-1.5 rounded-md ${ui.bullet ? activeBtnClass : inactiveBtnClass}`}
              >
                <List size={16} />
              </button>
              <button
                type="button"
                onClick={() => editor.chain().focus().toggleOrderedList().run()}
                className={`p-1.5 rounded-md ${ui.ordered ? activeBtnClass : inactiveBtnClass}`}
              >
                <ListOrdered size={16} />
              </button>
              <button
                type="button"
                onClick={() =>
                  (editor.isActive('listItem')
                    ? editor.chain().focus().liftListItem('listItem')
                    : editor.chain().focus().outdentBlock()
                  ).run()
                }
                className={`p-1.5 rounded-md ${inactiveBtnClass}`}
              >
                <IndentDecrease size={16} />
              </button>
              <button
                type="button"
                onClick={() =>
                  (editor.isActive('listItem')
                    ? editor.chain().focus().sinkListItem('listItem')
                    : editor.chain().focus().indentBlock()
                  ).run()
                }
                className={`p-1.5 rounded-md ${inactiveBtnClass}`}
              >
                <IndentIncrease size={16} />
              </button>

              <div className="w-px h-5 bg-slate-200 mx-1.5 shrink-0"></div>

              <button
                type="button"
                onClick={() =>
                  editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
                }
                className={`p-1.5 rounded-md ${inactiveBtnClass}`}
                title="Sisip Jadual"
              >
                <TableIcon size={16} />
              </button>
              <button
                type="button"
                onClick={() => editor.chain().focus().setPageBreak().run()}
                className={`p-1.5 rounded-md ${inactiveBtnClass}`}
                title="Pemisah Halaman"
              >
                <SeparatorHorizontal size={16} />
              </button>

              <div className="w-px h-5 bg-slate-200 mx-1.5 shrink-0"></div>

              <button
                type="button"
                onClick={addComment}
                className="flex items-center gap-1.5 px-2.5 py-1.5 bg-violet/10 text-violet border border-violet/20 hover:bg-violet/20 rounded-md text-[11px] font-bold uppercase tracking-wide transition-colors ml-auto shrink-0"
              >
                <MessageSquarePlus size={14} /> Tambah Komen
              </button>
              <button
                type="button"
                onClick={() => setShowComments(!showComments)}
                className="p-1.5 text-slate-500 hover:text-ink hover:bg-slate-50 rounded-md border border-transparent relative shrink-0"
              >
                <MessageSquare size={16} />
                {comments.length > 0 && (
                  <span className="absolute top-0.5 right-0.5 w-1.5 h-1.5 bg-violet rounded-full"></span>
                )}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Main Workspace */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar: Structure & Sync Status */}
        <aside className="z-10 flex w-72 shrink-0 flex-col overflow-y-auto border-r border-slate-200 bg-white">
          <div className="p-4 flex items-center justify-between border-b border-slate-100 bg-slate-50/50">
            <h2 className="text-xs font-semibold text-ink">Struktur Buku</h2>
            <School size={16} className="text-slate-400" />
          </div>

          <div className="px-4 py-2 border-b border-slate-100 flex items-center gap-3 text-[10px] text-slate-500 bg-slate-50/30">
            <span className="inline-flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-forest"></span> Pautan Langsung
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-amber"></span> Disunting
            </span>
          </div>

          <nav className="flex-1 py-2">
            {bookSections.map((section) => {
              if (section.id === 'tingkatan6' || section.id === 'ppki') {
                const categoryComms = committeeData.filter((c) =>
                  c.category
                    ?.toLowerCase()
                    .includes(section.id === 'tingkatan6' ? 'tingkatan 6' : 'ppki')
                );
                if (categoryComms.length === 0) return null;
              }

              const isEdited = Boolean(manuallyEditedSections[section.id]);
              const isOutdated = Boolean(outdatedSections[section.id]);

              return (
                <div
                  key={section.id}
                  className={`w-full flex items-center justify-between gap-2 px-4 py-2.5 text-left text-xs font-medium transition-colors border-l-2 group cursor-pointer ${
                    activeSection === section.id
                      ? 'border-ink bg-slate-50 text-ink'
                      : 'border-transparent text-slate-600 hover:bg-slate-50 hover:border-slate-300'
                  }`}
                  onClick={() => scrollToSection(section.id)}
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate">{section.title}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1.5">
                      {isEdited ? (
                        <span className="text-amber font-semibold">Disunting Manual</span>
                      ) : section.mode === 'Live' ? (
                        <span className="text-forest">Pautan Langsung</span>
                      ) : (
                        <span>Templat</span>
                      )}
                    </p>
                  </div>

                  {section.id === 'setup' && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setFocusedAssetField(null);
                        setIsCoverDrawerOpen(true);
                      }}
                      className="text-[10px] font-bold text-ink bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded transition-colors shrink-0"
                    >
                      Ubah Suai
                    </button>
                  )}

                  {isOutdated && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        regenerateSection(section.id);
                      }}
                      title="Data sumber telah berubah. Klik untuk selaraskan (sync) seksyen ini."
                      className="text-sky hover:text-sky-700 bg-sky/10 p-1.5 rounded-md transition-colors shrink-0"
                    >
                      <RefreshCw size={13} />
                    </button>
                  )}
                </div>
              );
            })}
          </nav>
        </aside>

        {/* Center Document Canvas */}
        <main
          className="flex min-w-0 flex-1 flex-col bg-canvas overflow-y-auto p-6 lg:p-8 relative scroll-smooth"
          id="scroll-container"
        >
          {!loaded ? (
            <div className="mt-20 flex flex-col items-center justify-center gap-3 text-ink">
              <Loader2 size={24} className="animate-spin" />
              <p className="text-xs text-slate-500">Menyelaraskan data sekolah terkini...</p>
            </div>
          ) : (
            <div className="flex justify-center w-full">
              <div
                ref={printRef}
                data-cover-theme={coverConfig.templateId}
                data-table-style={coverConfig.tableStyle || 'corporate-tint'}
                style={
                  {
                    '--bb-primary': coverConfig.primaryColor || '#1E3A8A',
                    '--bb-accent': coverConfig.accentColor || '#D97706',
                    '--bb-heading-font': `'${coverConfig.headingFont || 'Arial'}', sans-serif`,
                    '--bb-body-font': `'${coverConfig.bodyFont || 'Arial'}', sans-serif`,
                  } as React.CSSProperties
                }
                className="w-[210mm] min-h-[297mm] bg-white border border-slate-200 bb-editor shadow-sm relative"
              >
                <EditorContent editor={editor} />
              </div>
            </div>
          )}
        </main>

        {/* Right Sidebar (Comments) */}
        {showComments && (
          <aside className="w-80 shrink-0 flex-col border-l border-slate-200 bg-slate-50 overflow-y-auto flex">
            <div className="p-4 flex items-center justify-between border-b border-slate-200 bg-white sticky top-0 z-10">
              <h3 className="text-xs font-semibold text-ink">Semua Komen</h3>
              <span className="bg-violet/10 text-violet border border-violet/20 text-[10px] font-bold px-2 py-0.5 rounded-md">
                {comments.length}
              </span>
            </div>
            <div className="p-4 space-y-4">
              {comments.length === 0 ? (
                <p className="text-[11px] text-slate-500 text-center italic">
                  Tiada komen. Highlight teks dan klik butang Tambah Komen.
                </p>
              ) : (
                comments.map((c) => {
                  const isResolved = c.status === 'resolved';
                  const draftVal = commentDrafts[c.id] ?? c.text ?? '';
                  const authorInitial = (c.author || 'A').trim().charAt(0).toUpperCase();
                  const formattedTime = c.createdAt
                    ? new Date(c.createdAt).toLocaleDateString('ms-MY', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : '';

                  return (
                    <div
                      key={c.id}
                      onClick={() => scrollToComment(c.id)}
                      className={`bg-white p-4 rounded-xl border transition-colors cursor-pointer ${
                        isResolved
                          ? 'border-slate-200 opacity-75'
                          : 'border-slate-200 hover:border-violet/40'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-6 h-6 rounded-md bg-violet/10 text-violet border border-violet/20 flex items-center justify-center text-[10px] font-bold shrink-0">
                            {authorInitial}
                          </div>
                          <div className="min-w-0">
                            <span className="text-[11px] font-semibold text-ink block truncate">
                              {c.author}
                            </span>
                            {(c.sectionTitle || formattedTime) && (
                              <span className="text-[9px] text-slate-400 block truncate">
                                {[c.sectionTitle, formattedTime].filter(Boolean).join(' • ')}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          {!c.isNew && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleResolveComment(c.id);
                              }}
                              title={isResolved ? 'Buka semula komen' : 'Tandakan selesai'}
                              className={`p-1 rounded transition-colors ${
                                isResolved
                                  ? 'text-forest bg-forest/10 hover:bg-forest/20'
                                  : 'text-slate-400 hover:text-forest hover:bg-forest/10'
                              }`}
                            >
                              <Check size={12} />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteComment(c.id);
                            }}
                            title="Padam komen"
                            className="text-slate-400 hover:text-rose hover:bg-rose/10 p-1 rounded transition-colors"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>

                      {c.quote && (
                        <p className="text-[10px] text-slate-500 italic border-l-2 border-violet/40 pl-2 mb-1.5 line-clamp-2">
                          “{c.quote}”
                        </p>
                      )}

                      {c.isNew ? (
                        <div className="flex flex-col gap-2 mt-2">
                          <textarea
                            autoFocus
                            value={draftVal}
                            onChange={(e) =>
                              setCommentDrafts((prev) => ({ ...prev, [c.id]: e.target.value }))
                            }
                            onClick={(e) => e.stopPropagation()}
                            className="w-full text-xs p-2.5 border border-slate-200 rounded-lg outline-none focus:border-violet/50 focus:ring-4 focus:ring-violet/10 resize-none transition-all"
                            rows={3}
                            placeholder="Taip komen anda..."
                          ></textarea>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              saveComment(c.id, draftVal);
                            }}
                            className="bg-violet hover:opacity-90 text-white text-[11px] font-bold py-1.5 rounded-md transition-opacity"
                          >
                            Simpan
                          </button>
                        </div>
                      ) : (
                        <p
                          className={`text-[11px] mt-1 leading-relaxed ${
                            isResolved ? 'line-through text-slate-400' : 'text-slate-700'
                          }`}
                        >
                          {c.text}
                        </p>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </aside>
        )}
      </div>

      {/* Corporate Cover Designer Drawer */}
      <CoverDesignerDrawer
        isOpen={isCoverDrawerOpen}
        onClose={handleCloseCoverDrawer}
        schoolId={schoolId}
        config={coverConfig}
        onChange={(nextCfg) => applyCoverConfigToEditor(nextCfg, true)}
        onPersistAssetsToProfile={handlePersistAssetsToProfile}
        focusedAssetField={focusedAssetField}
      />

      {/* Publication Typesetting & Print Styles */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
        .bb-editor {
          --bb-primary: #1E3A8A;
          --bb-accent: #D97706;
          --bb-heading-font: Arial, sans-serif;
          --bb-body-font: Arial, sans-serif;
          font-family: var(--bb-body-font);
          font-size: 10pt;
          line-height: 1.5;
          color: #1e293b;
          background-color: #ffffff;
        }

        /* Screen canvas padding */
        .bb-editor [data-section-id="setup"] { padding: 0; }
        .bb-editor [data-section-id]:not([data-section-id="setup"]) {
          padding: 18mm 20mm;
          background-color: #ffffff;
        }

        /* Chapter Header Hierarchy */
        .bb-editor p.bb-chapter-kicker {
          font-family: var(--bb-heading-font);
          font-size: 8.5pt;
          font-weight: 700;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: var(--bb-accent);
          margin: 0 0 2pt 0;
          break-after: avoid;
          page-break-after: avoid;
        }

        .bb-editor [data-section-id]:not([data-section-id="setup"]) h1 {
          font-family: var(--bb-heading-font);
          font-size: 15pt;
          font-weight: 800;
          margin: 0 0 6pt 0;
          text-transform: uppercase;
          color: var(--bb-primary);
          break-after: avoid;
          page-break-after: avoid;
        }

        .bb-editor p.bb-chapter-subtitle {
          font-size: 9.5pt;
          color: #64748b;
          margin: 0 0 18pt 0;
          break-after: avoid;
          page-break-after: avoid;
        }

        /* Committee Heading (h2) — clean, borderless above tables, never orphaned */
        .bb-editor [data-section-id]:not([data-section-id="setup"]) h2 {
          font-family: var(--bb-heading-font);
          font-size: 11.5pt;
          font-weight: 700;
          margin-top: 22pt;
          margin-bottom: 7pt;
          color: var(--bb-primary);
          border-bottom: none;
          padding-bottom: 0;
          break-after: avoid;
          page-break-after: avoid;
        }

        .bb-editor [data-section-id]:not([data-section-id="setup"]) h1 + h2,
        .bb-editor [data-section-id]:not([data-section-id="setup"]) p.bb-chapter-subtitle + h2 {
          margin-top: 10pt;
        }

        /* Bidang Tugas & SKT Subheadings (h3) */
        .bb-editor [data-section-id]:not([data-section-id="setup"]) h3 {
          font-family: var(--bb-heading-font);
          font-size: 9.8pt;
          font-weight: 700;
          margin-top: 12pt;
          margin-bottom: 5pt;
          color: #0f172a;
          border-left: 3px solid var(--bb-accent);
          padding-left: 8pt;
          line-height: 1.3;
          break-after: avoid;
          page-break-after: avoid;
        }

        /* Template-Specific Chapter Title Treatments */
        .bb-editor[data-cover-theme="corporate-diagonal"] [data-section-id]:not([data-section-id="setup"]) h1 {
          border-left: 4px solid var(--bb-accent);
          border-bottom: 1.5px solid var(--bb-primary);
          padding: 3pt 0 5pt 10pt;
        }
        .bb-editor[data-cover-theme="editorial-minimal"] [data-section-id]:not([data-section-id="setup"]) p.bb-chapter-kicker,
        .bb-editor[data-cover-theme="editorial-minimal"] [data-section-id]:not([data-section-id="setup"]) h1,
        .bb-editor[data-cover-theme="editorial-minimal"] [data-section-id]:not([data-section-id="setup"]) p.bb-chapter-subtitle {
          text-align: center;
        }
        .bb-editor[data-cover-theme="editorial-minimal"] [data-section-id]:not([data-section-id="setup"]) h1 {
          border-bottom: 1.5px solid var(--bb-accent);
          padding-bottom: 6pt;
        }
        .bb-editor[data-cover-theme="executive-dark"] [data-section-id]:not([data-section-id="setup"]) h1 {
          background-color: color-mix(in srgb, var(--bb-primary) 6%, #ffffff);
          border-left: 4px solid var(--bb-primary);
          padding: 6pt 10pt;
        }
        .bb-editor[data-cover-theme="photo-showcase"] [data-section-id]:not([data-section-id="setup"]) h1 {
          border-top: 2px solid var(--bb-primary);
          border-bottom: 1px solid #cbd5e1;
          padding: 6pt 0 5pt 0;
        }

        /* Clean Left-Aligned Body & Lists */
        .bb-editor [data-section-id]:not([data-section-id="setup"]) > p {
          margin: 0 0 6pt 0;
          text-align: left;
        }

        /* Role / Cycle Sub-header inside Bidang Tugas or SKT stays glued to next paragraph */
        .bb-editor p.bb-role-label {
          margin: 8pt 0 2pt 0 !important;
          font-size: 9.2pt;
          font-weight: 700;
          color: var(--bb-primary);
          text-transform: uppercase;
          letter-spacing: 0.03em;
          break-after: avoid;
          page-break-after: avoid;
        }

        .bb-editor [data-section-id]:not([data-section-id="setup"]) ul,
        .bb-editor [data-section-id]:not([data-section-id="setup"]) ol {
          margin: 0 0 10pt 0;
          padding-left: 15pt;
        }

        .bb-editor [data-section-id]:not([data-section-id="setup"]) li {
          margin-bottom: 3.5pt;
          line-height: 1.48;
          break-inside: avoid;
          page-break-inside: avoid;
        }

        .bb-editor [data-section-id]:not([data-section-id="setup"]) li > p {
          margin: 0 !important;
          line-height: 1.48;
          text-align: left !important;
        }

        /* Formal Statement Callout (FPK, Visi, Misi, Lagu Sekolah) */
        .bb-editor blockquote {
          margin: 8pt 8pt 14pt 8pt;
          padding: 10pt 14pt;
          border-left: 3.5px solid var(--bb-accent);
          border-top: 1px solid #e2e8f0;
          border-right: 1px solid #e2e8f0;
          border-bottom: 1px solid #e2e8f0;
          background-color: #fafafa;
          border-radius: 3px;
          break-inside: avoid;
          page-break-inside: avoid;
        }
        .bb-editor blockquote p { margin-bottom: 3pt; }
        .bb-editor blockquote p:last-child { margin-bottom: 0; }

        /* Publication Tables */
        .bb-editor [data-section-id]:not([data-section-id="setup"]) table {
          border-collapse: collapse;
          width: 100%;
          table-layout: fixed;
          margin: 0 0 12pt 0;
          page-break-inside: auto;
        }
        .bb-editor thead {
          display: table-header-group;
          break-after: avoid;
          page-break-after: avoid;
        }
        .bb-editor tr {
          break-inside: avoid;
          page-break-inside: avoid;
        }
        .bb-editor [data-section-id]:not([data-section-id="setup"]) th,
        .bb-editor [data-section-id]:not([data-section-id="setup"]) td {
          border: 1px solid #cbd5e1;
          padding: 5.5pt 8pt;
          vertical-align: middle;
          word-wrap: break-word;
          overflow-wrap: break-word;
        }
        .bb-editor [data-section-id]:not([data-section-id="setup"]) th p,
        .bb-editor [data-section-id]:not([data-section-id="setup"]) td p {
          margin: 0 !important;
          line-height: 1.4;
        }
        .bb-editor [data-section-id]:not([data-section-id="setup"]) th {
          font-family: var(--bb-heading-font);
          font-weight: 700;
          font-size: 9pt;
        }

        /* Table Style Variants */
        .bb-editor[data-table-style="corporate-tint"] [data-section-id]:not([data-section-id="setup"]) th {
          background-color: color-mix(in srgb, var(--bb-primary) 9%, #ffffff);
          color: var(--bb-primary);
          border-top: 1.5px solid var(--bb-primary);
          border-bottom: 1.5px solid var(--bb-primary);
        }
        .bb-editor[data-table-style="corporate-tint"] [data-section-id]:not([data-section-id="setup"]) tbody tr:nth-child(even) {
          background-color: #fafbfc;
        }
        .bb-editor[data-table-style="classic-grid"] [data-section-id]:not([data-section-id="setup"]) th {
          background-color: #f1f5f9;
          color: #0f172a;
        }
        .bb-editor[data-table-style="minimal-lines"] [data-section-id]:not([data-section-id="setup"]) th,
        .bb-editor[data-table-style="minimal-lines"] [data-section-id]:not([data-section-id="setup"]) td {
          border-left: none;
          border-right: none;
          border-color: #e2e8f0;
        }
        .bb-editor[data-table-style="minimal-lines"] [data-section-id]:not([data-section-id="setup"]) th {
          background-color: transparent;
          color: var(--bb-primary);
          border-top: 1.5px solid var(--bb-primary);
          border-bottom: 1.5px solid var(--bb-accent);
        }

        /* Major Section Divider Page */
        .bb-editor [data-section-divider="true"] {
          min-height: 245mm;
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding: 20mm 14mm;
          border-left: 6px solid var(--bb-primary);
          background-color: #ffffff;
          break-inside: avoid;
          page-break-inside: avoid;
        }
        .bb-editor [data-section-divider="true"] p.bb-div-session {
          font-family: var(--bb-heading-font);
          font-size: 8.5pt;
          font-weight: 700;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: #64748b;
          margin: 0 0 24pt 0;
        }
        .bb-editor [data-section-divider="true"] p.bb-div-num {
          font-family: var(--bb-heading-font);
          font-size: 54pt;
          font-weight: 800;
          line-height: 1;
          color: color-mix(in srgb, var(--bb-primary) 18%, #ffffff);
          margin: 0 0 6pt 0;
        }
        .bb-editor [data-section-divider="true"] p.bb-div-kicker {
          font-family: var(--bb-heading-font);
          font-size: 9.5pt;
          font-weight: 700;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: var(--bb-accent);
          margin: 0 0 6pt 0;
        }
        .bb-editor [data-section-divider="true"] h1.bb-div-title {
          font-family: var(--bb-heading-font);
          font-size: 22pt !important;
          font-weight: 800;
          line-height: 1.2;
          color: var(--bb-primary);
          border: none !important;
          background: transparent !important;
          padding: 0 !important;
          margin: 0 0 12pt 0 !important;
        }
        .bb-editor [data-section-divider="true"] p.bb-div-tagline {
          font-size: 10.5pt;
          line-height: 1.5;
          color: #475569;
          max-width: 145mm;
          margin: 0 0 18pt 0;
        }
        .bb-editor [data-section-divider="true"] p.bb-div-meta {
          font-family: var(--bb-heading-font);
          font-size: 9pt;
          font-weight: 700;
          color: var(--bb-primary);
          border-top: 1.5px solid var(--bb-accent);
          padding-top: 8pt;
          display: inline-block;
          margin: 0;
        }

        .bb-editor [data-page-break] {
          break-after: page;
          page-break-after: always;
          border-bottom: 2px dashed #cbd5e1;
          margin: 0;
        }
        
        .bb-editor table.toc-table { table-layout: auto !important; }
        .bb-editor table.toc-table, .bb-editor table.toc-table tr, .bb-editor table.toc-table td {
          border: none !important;
          background: transparent !important;
          padding: 4pt 0 !important;
        }
        .bb-editor td.toc-leader {
          border-bottom: 1.5px dotted #94a3b8 !important;
          width: 100%;
          position: relative;
          bottom: 4px;
        }

        /* Named cover page = 0 margin; ALL inner pages = 20mm top/bottom margins */
        @page {
          size: A4;
          margin: 20mm 18mm 20mm 18mm;
        }
        @page cover {
          size: A4;
          margin: 0;
        }

        @media print { 
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .bb-editor [data-page-break] { border: none; margin: 0; } 
          .bb-editor { border: none !important; padding: 0 !important; box-shadow: none !important; width: 100% !important; }
          .bb-editor span[data-comment-id] { background: transparent !important; border-bottom: none !important; }
          .bb-editor [data-section-id="setup"] {
            page: cover;
            padding: 0 !important;
            height: 297mm !important;
          }
          .bb-editor [data-section-id]:not([data-section-id="setup"]) {
            padding: 0 !important;
          }
        }
      `,
        }}
      />
    </div>
  );
}