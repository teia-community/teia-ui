import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import MDEditor from '@uiw/react-md-editor'
import { useUserStore } from '@context/userStore'
import { useModalStore } from '@context/modalStore'
import { useLocalSettings } from '@context/localSettingsStore'
import { Button } from '@atoms/button'
import { Input } from '@atoms/input'
import {
  LICENSE_TYPES_OPTIONS,
  MIN_ROYALTIES,
  MAX_ROYALTIES,
  MAX_EDITIONS,
} from '@constants'
import { prepareFile } from '@data/ipfs'
import {
  convertFileToFileForm,
  generateTypedArtCoverImage,
  generateCoverAndThumbnail,
} from '@utils/mint'
import styles from './index.module.scss'

export default function NewPost() {
  const navigate = useNavigate()
  const address = useUserStore((st) => st.address)
  const proxyAddress = useUserStore((st) => st.proxyAddress)
  const mint = useUserStore((st) => st.mint)
  const theme = useLocalSettings((st) => st.theme)

  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [tags, setTags] = useState('')
  const [editions, setEditions] = useState(1)
  const [royalties, setRoyalties] = useState(MIN_ROYALTIES)
  const [license, setLicense] = useState(LICENSE_TYPES_OPTIONS[0])
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Redirect to blog if not connected
  if (!address) {
    return <Navigate to="/blog" replace />
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!content.trim()) {
      useModalStore
        .getState()
        .show('Error', 'Please write some content for your post.')
      return
    }

    if (editions < 1 || editions > MAX_EDITIONS) {
      useModalStore
        .getState()
        .show('Error', `Editions must be between 1 and ${MAX_EDITIONS}`)
      return
    }

    if (royalties < MIN_ROYALTIES || royalties > MAX_ROYALTIES) {
      useModalStore
        .getState()
        .show(
          'Error',
          `Royalties must be between ${MIN_ROYALTIES}% and ${MAX_ROYALTIES}%`
        )
      return
    }

    setIsSubmitting(true)

    try {
      const step = useModalStore.getState().step
      const show = useModalStore.getState().show

      step('Preparing Blog Post', 'Creating markdown file...')

      // Create markdown file
      const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' })
      const file = new File([blob], 'blog-post.md', {
        type: 'text/markdown',
        lastModified: Date.now(),
      })

      // Convert to FileForm format
      const artifact = await convertFileToFileForm(file)
      artifact.reader = URL.createObjectURL(blob)

      step('Preparing Blog Post', 'Generating cover image...')

      // Generate cover image from content
      const coverFile = await generateTypedArtCoverImage(content, false)
      const cover = await convertFileToFileForm(coverFile)

      // Generate thumbnail
      const { thumbnail } = await generateCoverAndThumbnail(cover)

      step('Preparing Blog Post', 'Uploading to IPFS...')

      const tagList = tags
        .split(',')
        .map((t) => t.trim())
        .filter((t) => t)
      if (!tagList.includes('blog')) {
        tagList.push('blog')
      }
      const finalTags = tagList.join(',')

      // Show the first 500 chars of content
      const description = content.slice(0, 500).replace(/\n+/g, ' ').trim()

      const minterAddress = proxyAddress || address

      // Upload to IPFS
      const cid = await prepareFile({
        name: title || 'Untitled Post',
        description,
        tags: finalTags,
        address: minterAddress,
        file: artifact,
        cover,
        thumbnail,
        rights: license?.value || '',
        rightsUri: undefined,
        language: undefined,
        accessibility: '',
        contentRating: '',
        formats: [
          {
            mimeType: 'text/markdown',
            fileSize: file.size,
            fileName: file.name,
          },
        ],
      })

      if (!cid) {
        throw new Error('Failed to upload to IPFS')
      }

      step('Minting Blog Post', 'Please confirm the transaction...')

      // Mint
      await mint(minterAddress, editions, cid, royalties)

      show('Success!', 'Blog post has been minted successfully.')

      // Reset form and navigate to created posts
      setTitle('')
      setContent('')
      setTags('')
      setEditions(1)
      setRoyalties(MIN_ROYALTIES)

      // Navigate to posts. delay added
      setTimeout(() => {
        useModalStore.getState().close()
        navigate('/blog/yourposts')
      }, 2000)
    } catch (error) {
      console.error('Mint error:', error)
      useModalStore
        .getState()
        .show(
          'Mint Failed',
          error.message || 'An error occurred while minting your post.'
        )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className={styles.newpost_form}>
      <div className={styles.field}>
        <label htmlFor="title">Title</label>
        <Input
          id="title"
          type="text"
          placeholder="Give your post a title (optional)"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={500}
        />
      </div>

      <div className={styles.field}>
        <label htmlFor="content">Content</label>
        <div
          className={styles.editor_wrapper}
          data-color-mode={theme === 'dark' ? 'dark' : 'light'}
        >
          <MDEditor
            id="content"
            value={content}
            onChange={setContent}
            preview="live"
            height={400}
            textareaProps={{
              placeholder: 'Write your blog post in Markdown...',
            }}
          />
        </div>
      </div>

      <div className={styles.field}>
        <label htmlFor="tags">Tags</label>
        <Input
          id="tags"
          type="text"
          placeholder="Comma separated, e.g.: art, thoughts, tutorial"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
        />
        <small className={styles.hint}>
          The "blog" tag will be added automatically
        </small>
      </div>

      <div className={styles.field_row}>
        <div className={styles.field}>
          <label htmlFor="editions">Editions</label>
          <Input
            id="editions"
            type="number"
            min={1}
            max={MAX_EDITIONS}
            value={editions}
            onChange={(e) => setEditions(parseInt(e.target.value) || 1)}
          />
        </div>

        <div className={styles.field}>
          <label htmlFor="royalties">Royalties (%)</label>
          <Input
            id="royalties"
            type="number"
            min={MIN_ROYALTIES}
            max={MAX_ROYALTIES}
            value={royalties}
            onChange={(e) =>
              setRoyalties(parseInt(e.target.value) || MIN_ROYALTIES)
            }
          />
        </div>
      </div>

      <div className={styles.field}>
        <label htmlFor="license">License</label>
        <select
          id="license"
          className={styles.select}
          value={license?.value || ''}
          onChange={(e) => {
            const selected = LICENSE_TYPES_OPTIONS.find(
              (opt) => opt.value === e.target.value
            )
            setLicense(selected)
          }}
        >
          {LICENSE_TYPES_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <div className={styles.actions}>
        <Button
          type="submit"
          disabled={isSubmitting || !content.trim()}
          shadow_box
        >
          {isSubmitting ? 'Minting...' : 'Mint Post'}
        </Button>
      </div>
    </form>
  )
}
