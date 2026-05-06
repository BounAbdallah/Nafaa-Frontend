import { useMemo } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import TextAlign from '@tiptap/extension-text-align'
import { TextStyle } from '@tiptap/extension-text-style'
import { Color } from '@tiptap/extension-color'
import Placeholder from '@tiptap/extension-placeholder'
import { Table } from '@tiptap/extension-table'
import { TableRow } from '@tiptap/extension-table-row'
import { TableHeader } from '@tiptap/extension-table-header'
import { TableCell } from '@tiptap/extension-table-cell'
import {
  Bold, Italic, UnderlineIcon, Strikethrough,
  AlignLeft, AlignCenter, AlignRight, AlignJustify,
  List, ListOrdered, Table as TableIcon,
  Undo, Redo, Minus, Type, ChevronDown,
} from 'lucide-react'
import { cn } from '@/utils/cn'

/**
 * Éditeur de document riche basé sur TipTap.
 *
 * Props :
 *   content      – string HTML initial
 *   onChange     – (html: string) => void
 *   placeholder  – string
 *   editable     – boolean (default true)
 *   minHeight    – string CSS (default '400px')
 */
export default function DocumentEditor({
  content = '',
  onChange,
  placeholder = 'Commencez à rédiger votre document…',
  editable = true,
  minHeight = '400px',
}) {
  const extensions = useMemo(() => [
    StarterKit.configure({ heading: { levels: [1, 2, 3] }, underline: false }),
    Underline,
    TextStyle,
    Color,
    TextAlign.configure({ types: ['heading', 'paragraph'] }),
    Placeholder.configure({ placeholder }),
    Table.configure({ resizable: true }),
    TableRow,
    TableHeader,
    TableCell,
  ], [placeholder])

  const editor = useEditor({
    extensions,
    content,
    editable,
    onUpdate: ({ editor }) => onChange?.(editor.getHTML()),
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none px-6 py-5',
        style: `min-height: ${minHeight}`,
      },
    },
  })

  if (!editor) return null

  return (
    <div className="border border-muted-300 rounded-card overflow-hidden bg-white">
      {editable && <Toolbar editor={editor} />}
      <EditorContent editor={editor} />
    </div>
  )
}

// ── Barre d'outils ────────────────────────────────────────────────────────────

function Toolbar({ editor }) {
  const btn = (action, active, title, children) => (
    <button
      key={title}
      type="button"
      onMouseDown={(e) => { e.preventDefault(); action() }}
      title={title}
      className={cn(
        'p-1.5 rounded hover:bg-muted-100 transition-colors',
        active ? 'bg-primary-100 text-primary-700' : 'text-muted-600'
      )}
    >
      {children}
    </button>
  )

  const insertVariable = (variable) => {
    editor.chain().focus().insertContent(`<span class="variable">{{${variable}}}</span> `).run()
  }

  const VARIABLES = [
    { label: 'Nom client',       value: 'nom_client' },
    { label: 'Adresse client',   value: 'adresse_client' },
    { label: 'Email client',     value: 'email_client' },
    { label: 'Téléphone client', value: 'telephone_client' },
    { label: 'Référence',        value: 'reference' },
    { label: 'Date',             value: 'date' },
    { label: 'Date signature',   value: 'date_signature' },
    { label: 'Date début',       value: 'date_debut' },
    { label: 'Date fin',         value: 'date_fin' },
    { label: 'Montant total',    value: 'montant_total' },
    { label: 'Nom prestataire',  value: 'nom_prestataire' },
  ]

  return (
    <div className="border-b border-muted-200 bg-muted-50 px-3 py-2 flex flex-wrap items-center gap-0.5">
      {/* Historique */}
      <Group>
        {btn(() => editor.chain().focus().undo().run(), false, 'Annuler', <Undo size={15} />)}
        {btn(() => editor.chain().focus().redo().run(), false, 'Rétablir', <Redo size={15} />)}
      </Group>

      <Sep />

      {/* Titres */}
      <Group>
        {[1, 2, 3].map(l => btn(
          () => editor.chain().focus().toggleHeading({ level: l }).run(),
          editor.isActive('heading', { level: l }),
          `Titre ${l}`,
          <span className="text-[11px] font-bold w-5 text-center">H{l}</span>
        ))}
        {btn(
          () => editor.chain().focus().setParagraph().run(),
          editor.isActive('paragraph'),
          'Paragraphe',
          <Type size={15} />
        )}
      </Group>

      <Sep />

      {/* Formatage inline */}
      <Group>
        {btn(() => editor.chain().focus().toggleBold().run(),          editor.isActive('bold'),          'Gras',       <Bold size={15} />)}
        {btn(() => editor.chain().focus().toggleItalic().run(),        editor.isActive('italic'),        'Italique',   <Italic size={15} />)}
        {btn(() => editor.chain().focus().toggleUnderline().run(),     editor.isActive('underline'),     'Souligné',   <UnderlineIcon size={15} />)}
        {btn(() => editor.chain().focus().toggleStrike().run(),        editor.isActive('strike'),        'Barré',      <Strikethrough size={15} />)}
      </Group>

      <Sep />

      {/* Alignement */}
      <Group>
        {btn(() => editor.chain().focus().setTextAlign('left').run(),    editor.isActive({ textAlign: 'left' }),    'Gauche',   <AlignLeft size={15} />)}
        {btn(() => editor.chain().focus().setTextAlign('center').run(),  editor.isActive({ textAlign: 'center' }),  'Centré',   <AlignCenter size={15} />)}
        {btn(() => editor.chain().focus().setTextAlign('right').run(),   editor.isActive({ textAlign: 'right' }),   'Droite',   <AlignRight size={15} />)}
        {btn(() => editor.chain().focus().setTextAlign('justify').run(), editor.isActive({ textAlign: 'justify' }), 'Justifié', <AlignJustify size={15} />)}
      </Group>

      <Sep />

      {/* Listes */}
      <Group>
        {btn(() => editor.chain().focus().toggleBulletList().run(),  editor.isActive('bulletList'),  'Liste à puces',    <List size={15} />)}
        {btn(() => editor.chain().focus().toggleOrderedList().run(), editor.isActive('orderedList'), 'Liste numérotée',  <ListOrdered size={15} />)}
      </Group>

      <Sep />

      {/* Tableau */}
      <Group>
        {btn(
          () => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run(),
          false, 'Insérer un tableau',
          <TableIcon size={15} />
        )}
        {btn(() => editor.chain().focus().setHorizontalRule().run(), false, 'Séparateur', <Minus size={15} />)}
      </Group>

      <Sep />

      {/* Variables dynamiques */}
      <div className="relative group">
        <button
          type="button"
          className="flex items-center gap-1 px-2 py-1.5 rounded text-[11px] font-semibold text-primary-700 bg-primary-50 hover:bg-primary-100 transition-colors border border-primary-200"
        >
          {'{ }'} Variable <ChevronDown size={11} />
        </button>
        <div className="absolute top-full left-0 mt-1 w-48 bg-white border border-muted-200 rounded-lg shadow-lg z-50 hidden group-hover:block py-1">
          {VARIABLES.map(v => (
            <button
              key={v.value}
              type="button"
              onMouseDown={(e) => { e.preventDefault(); insertVariable(v.value) }}
              className="w-full text-left px-3 py-1.5 text-xs hover:bg-primary-50 text-muted-700 hover:text-primary-700 transition-colors"
            >
              <span className="font-mono text-primary-600">{`{{${v.value}}}`}</span>
              <span className="ml-1.5 text-muted-400">{v.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

const Group = ({ children }) => <div className="flex items-center gap-0.5">{children}</div>
const Sep   = () => <div className="w-px h-5 bg-muted-200 mx-1" />
