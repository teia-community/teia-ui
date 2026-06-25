import { useState, lazy, Suspense } from 'react'
import { useNavigate, useOutletContext } from 'react-router-dom'
import { Button } from '@atoms/button'
import { Input } from '@atoms/input'
import { useLocalSettings } from '@context/localSettingsStore'
import { PATH } from '@constants'
import {
  createPage,
  updatePage,
  proposeNewPage,
  createEditProposal,
} from '@data/wiki'
import styles from '@style'

const MDEditor = lazy(() => import('@uiw/react-md-editor'))

const AUDIO_EXTENSIONS = /\.(mp3|wav|ogg|flac|aac|m4a|opus|webm)(\?|$)/i
const previewComponents = {
  img: ({ alt, src, ...props }) => {
    if (alt === 'Audio' || AUDIO_EXTENSIONS.test(src)) {
      return <audio controls src={src} style={{ width: '100%' }} />
    }
    return <img alt={alt} src={src} {...props} />
  },
}

export function slugify(text) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

/**
 * Shared create/edit form. The submitted action depends on role:
 *  - moderators write directly (create_page / update_page)
 *  - token holders submit a community proposal (prop_new_page / create_proposal)
 *
 * Each page is identified by its integer `pageId`; the slug only lives
 * in the IPFS doc (for pretty links + parent hierarchy) and is derived from the
 * title for new pages.
 */
export default function WikiEditor({ mode, pageId, initial }) {
  const navigate = useNavigate()
  const { wiki, canModerate, canPropose } = useOutletContext()
  const theme = useLocalSettings((st) => st.theme)

  const [title, setTitle] = useState(initial?.title || '')
  const [parent, setParent] = useState(initial?.parent || '')
  const [content, setContent] = useState(initial?.content || '')
  const [summary, setSummary] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const isEdit = mode === 'edit'
  const canSubmit = canModerate || canPropose

  // For edits the slug is fixed; for new pages it's derived from the title.
  const slug = isEdit ? initial?.slug || '' : slugify(title)

  const onTitleChange = (v) => {
    const next = typeof v === 'string' ? v : v?.target?.value || ''
    setTitle(next)
  }

  const parentOptions = (wiki?.pages || [])
    .filter((p) => p.id !== pageId)
    .map((p) => ({
      slug: wiki.meta[p.id]?.slug || '',
      title: wiki.meta[p.id]?.title || `Page ${p.id}`,
    }))
    .filter((opt) => opt.slug)
    .sort((a, b) => a.title.localeCompare(b.title))

  // The contract has no duplicate-name check, so the UI owns it.
  const titleTaken =
    !isEdit &&
    title.trim().length > 0 &&
    (wiki?.pages || []).some(
      (p) =>
        (wiki.meta[p.id]?.title || '').trim().toLowerCase() ===
        title.trim().toLowerCase()
    )

  if (!canSubmit) {
    return (
      <p className={styles.notice}>
        Connect a wallet that holds TEIA tokens to propose wiki changes.
      </p>
    )
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!title.trim() || !content.trim() || titleTaken) return
    setSubmitting(true)
    const input = {
      title: title.trim(),
      slug: slug.trim(),
      parent: parent || null,
      content,
      summary: summary.trim() || undefined,
    }
    try {
      if (isEdit) {
        if (canModerate) await updatePage(pageId, input)
        else await createEditProposal(pageId, input)
      } else {
        if (canModerate) await createPage(input)
        else await proposeNewPage(input)
      }
      // Direct moderator edits land on the page immediately; new pages (id
      // assigned on-chain) and community proposals go back to the wiki home.
      if (isEdit && canModerate) {
        navigate(`${PATH.WIKI}/${pageId}`)
      } else {
        navigate(PATH.WIKI)
      }
    } catch {
      // friendlyError already surfaced via modal
    } finally {
      setSubmitting(false)
    }
  }

  const verb = canModerate ? (isEdit ? 'Update' : 'Create') : 'Submit proposal'

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <h2>{isEdit ? `Edit: ${title || slug}` : 'New wiki page'}</h2>
      {!canModerate && (
        <p className={styles.notice}>
          Your change will be submitted as a proposal for moderator review.
        </p>
      )}

      <div className={styles.field}>
        <label htmlFor="wiki-title">Title</label>
        <Input
          id="wiki-title"
          type="text"
          placeholder="Page title"
          value={title}
          onChange={onTitleChange}
        />
        {!isEdit && (
          <small className={styles.hint}>
            Pretty link: /wiki/{slug || 'page-title'}
          </small>
        )}
        {titleTaken && (
          <small className={styles.error}>
            A page titled “{title.trim()}” already exists — choose a different
            title.
          </small>
        )}
      </div>

      <div className={styles.field}>
        <label htmlFor="wiki-parent">Parent page</label>
        <select
          id="wiki-parent"
          className={styles.select}
          value={parent}
          onChange={(e) => setParent(e.target.value)}
        >
          <option value="">(none — top level)</option>
          {parentOptions.map((opt) => (
            <option key={opt.slug} value={opt.slug}>
              {opt.title}
            </option>
          ))}
        </select>
      </div>

      <div className={styles.field}>
        <label htmlFor="wiki-content">Content</label>
        <div
          className={styles.editor_wrapper}
          data-color-mode={theme === 'dark' ? 'dark' : 'light'}
        >
          <Suspense fallback={<div>Loading editor…</div>}>
            <MDEditor
              id="wiki-content"
              value={content}
              onChange={setContent}
              preview="live"
              height={420}
              textareaProps={{ placeholder: 'Write the page in Markdown…' }}
              previewOptions={{ components: previewComponents }}
            />
          </Suspense>
        </div>
      </div>

      <div className={styles.field}>
        <label htmlFor="wiki-summary">Edit summary (optional)</label>
        <Input
          id="wiki-summary"
          type="text"
          placeholder="What changed?"
          value={summary}
          onChange={(v) =>
            setSummary(typeof v === 'string' ? v : v?.target?.value || '')
          }
        />
      </div>

      <div className={styles.actions}>
        <Button
          type="submit"
          shadow_box
          disabled={
            submitting || !title.trim() || !content.trim() || titleTaken
          }
        >
          {submitting ? 'Submitting…' : verb}
        </Button>
        <Button secondary onClick={() => navigate(-1)} type="button">
          Cancel
        </Button>
      </div>
    </form>
  )
}
