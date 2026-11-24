import { Extension, Node, Mark, mergeAttributes } from '@tiptap/core';
import type { CommandProps } from '@tiptap/core';
import '@tiptap/extension-text-style';

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    pageBreak: { setPageBreak: () => ReturnType };
    paragraphFormat: {
      indentBlock: () => ReturnType;
      outdentBlock: () => ReturnType;
      setLineSpacing: (value: string) => ReturnType;
      unsetLineSpacing: () => ReturnType;
    };
    fontSize: {
      setFontSize: (size: string) => ReturnType;
      unsetFontSize: () => ReturnType;
    };
    comment: {
      setComment: (commentId: string) => ReturnType;
      unsetComment: () => ReturnType;
    };
  }
}

/**
 * Preserves semantic publication classes (bb-chapter-kicker, bb-role-label, toc-table, etc.)
 * across Tiptap parseHTML / renderHTML cycles.
 */
export const PreserveClasses = Extension.create({
  name: 'preserveClasses',

  addGlobalAttributes() {
    return [
      {
        types: ['paragraph', 'heading', 'table', 'tableCell', 'tableHeader', 'blockquote'],
        attributes: {
          class: {
            default: null,
            parseHTML: (el) => el.getAttribute('class') || null,
            renderHTML: (attrs) => (attrs.class ? { class: attrs.class } : {}),
          },
        },
      },
    ];
  },
});

/**
 * Wraps each book section with sync hash & manual-edit state so live school updates
 * never silently clobber administrator edits.
 */
export const BookSectionNode = Node.create({
  name: 'bookSection',
  group: 'block',
  content: 'block+',
  parseHTML() {
    return [{ tag: 'div[data-section-id]' }];
  },
  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes), 0];
  },
  addAttributes() {
    return {
      'data-section-id': { default: null },
      'data-source-hash': { default: null },
      'data-manual-edited': { default: 'false' },
      id: { default: null },
    };
  },
});

export const PageBreak = Node.create({
  name: 'pageBreak',
  group: 'block',
  atom: true,
  selectable: true,

  parseHTML() {
    return [{ tag: 'div[data-page-break]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-page-break': 'true' })];
  },

  addCommands() {
    return {
      setPageBreak:
        () =>
        ({ commands }: CommandProps) =>
          commands.insertContent({ type: this.name }),
    };
  },

  addKeyboardShortcuts() {
    return {
      'Mod-Enter': () => this.editor.commands.setPageBreak(),
    };
  },
});

const BLOCK_TYPES = ['paragraph', 'heading'];
const INDENT_PT = 36;
const MAX_INDENT = 8;

function updateBlocks(props: CommandProps, fn: (attrs: Record<string, any>) => Record<string, any>) {
  const { state, tr, dispatch } = props;
  const { from, to } = state.selection;
  let found = false;
  state.doc.nodesBetween(from, to, (node, pos) => {
    if (BLOCK_TYPES.includes(node.type.name)) {
      found = true;
      if (dispatch) tr.setNodeMarkup(pos, undefined, { ...node.attrs, ...fn(node.attrs) });
    }
  });
  return found;
}

export const ParagraphFormat = Extension.create({
  name: 'paragraphFormat',

  addGlobalAttributes() {
    return [
      {
        types: BLOCK_TYPES,
        attributes: {
          indent: {
            default: 0,
            parseHTML: (el) => Number(el.getAttribute('data-indent')) || 0,
            renderHTML: (attrs) =>
              attrs.indent
                ? { 'data-indent': attrs.indent, style: `margin-left:${attrs.indent * INDENT_PT}pt` }
                : {},
          },
          lineSpacing: {
            default: null,
            parseHTML: (el) => el.getAttribute('data-line-spacing') || null,
            renderHTML: (attrs) =>
              attrs.lineSpacing
                ? { 'data-line-spacing': attrs.lineSpacing, style: `line-height:${attrs.lineSpacing}` }
                : {},
          },
        },
      },
    ];
  },

  addCommands() {
    return {
      indentBlock: () => (props: CommandProps) =>
        updateBlocks(props, (a) => ({ indent: Math.min(MAX_INDENT, (a.indent || 0) + 1) })),
      outdentBlock: () => (props: CommandProps) =>
        updateBlocks(props, (a) => ({ indent: Math.max(0, (a.indent || 0) - 1) })),
      setLineSpacing: (value) => (props: CommandProps) =>
        updateBlocks(props, () => ({ lineSpacing: value })),
      unsetLineSpacing: () => (props: CommandProps) =>
        updateBlocks(props, () => ({ lineSpacing: null })),
    };
  },
});

export const FontSize = Extension.create({
  name: 'fontSize',
  addOptions() {
    return { types: ['textStyle'] };
  },
  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          fontSize: {
            default: null,
            parseHTML: (element) => element.style.fontSize.replace(/['"]+/g, ''),
            renderHTML: (attributes) => {
              if (!attributes.fontSize) return {};
              return { style: `font-size: ${attributes.fontSize}` };
            },
          },
        },
      },
    ];
  },
  addCommands() {
    return {
      setFontSize:
        (fontSize) =>
        ({ chain }: CommandProps) =>
          chain().setMark('textStyle', { fontSize }).run(),
      unsetFontSize:
        () =>
        ({ chain }: CommandProps) =>
          chain().setMark('textStyle', { fontSize: null }).removeEmptyTextStyle().run(),
    };
  },
});

export interface CommentOptions {
  HTMLAttributes: Record<string, any>;
}

export const CommentMark = Mark.create<CommentOptions>({
  name: 'comment',
  inclusive: false,
  addOptions() {
    return { HTMLAttributes: { class: 'bg-violet/20 border-b-2 border-violet cursor-pointer' } };
  },
  addAttributes() {
    return {
      commentId: {
        default: null,
        parseHTML: (element) => element.getAttribute('data-comment-id'),
        renderHTML: (attributes) =>
          attributes.commentId ? { 'data-comment-id': attributes.commentId } : {},
      },
    };
  },
  parseHTML() {
    return [{ tag: 'span[data-comment-id]' }];
  },
  renderHTML({ HTMLAttributes }) {
    return ['span', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes), 0];
  },
  addCommands() {
    return {
      setComment:
        (commentId: string) =>
        ({ commands }: CommandProps) =>
          commands.setMark(this.name, { commentId }),
      unsetComment:
        () =>
        ({ commands }: CommandProps) =>
          commands.unsetMark(this.name),
    };
  },
});

export const BookCoverNode = Node.create({
  name: 'bookCover',
  group: 'block',
  atom: true,
  selectable: true,
  draggable: false,

  addAttributes() {
    return {
      config: {
        default: null,
        parseHTML: (el) => {
          const raw = el.getAttribute('data-cover-config');
          if (!raw) return null;
          try {
            return JSON.parse(decodeURIComponent(raw));
          } catch {
            return null;
          }
        },
        renderHTML: (attrs) => {
          if (!attrs.config) return {};
          return {
            'data-cover-config': encodeURIComponent(JSON.stringify(attrs.config)),
          };
        },
      },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-book-cover]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-book-cover': 'true' })];
  },

  addNodeView() {
    // Bound dynamically in BookBuilder.tsx via BookCoverNode.extend({ addNodeView })
    return () => {
      const dom = document.createElement('div');
      return { dom };
    };
  },
});

export const SectionDividerNode = Node.create({
  name: 'sectionDivider',
  group: 'block',
  content: 'block+',
  defining: true,

  addAttributes() {
    return {
      'data-section-divider': { default: 'true' },
      'data-divider-for': { default: '' },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-section-divider]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-section-divider': 'true' }), 0];
  },
});