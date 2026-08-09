import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Page, Container } from '@atoms/layout'
import Button from '@atoms/button/Button'
import { Input } from '@atoms/input'
import { Loading } from '@atoms/loading'
import { PATH } from '@constants'
import {
  useCuration,
  useCurationContent,
  useCurationTokens,
  useCurationRoles,
  createCuration,
  updateCuration,
  tokenKey,
} from '@data/curations'
import { uploadMsgFileToIPFS, msgIpfsToUrl } from '@data/messaging/ipfs'
import { useUserStore } from '@context/userStore'
import { useModalStore } from '@context/modalStore'
import TokenPicker from './TokenPicker'
import SelectedTray from './SelectedTray'
import styles from '@style'

const tezToMutez = (tez) => {
  const n = parseFloat(tez)
  return Number.isFinite(n) && n > 0 ? Math.round(n * 1_000_000) : 0
}
const mutezToTez = (mutez) => (mutez ? String(mutez / 1_000_000) : '')

export default function CurationEditor() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = id !== undefined
  const curationId = isEdit ? Number(id) : undefined
  const address = useUserStore((st) => st.address)

  const {
    curation,
    error: curationError,
    isLoading: curationLoading,
  } = useCuration(curationId)
  const { data: content } = useCurationContent(curation?.cid)
  const { data: existingTokens } = useCurationTokens(content?.tokens)
  const { data: roles } = useCurationRoles(address)

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [coverImage, setCoverImage] = useState('')
  const [coverUploading, setCoverUploading] = useState(false)
  const [feeMode, setFeeMode] = useState('global')
  const [globalFeeTez, setGlobalFeeTez] = useState('')
  const [selected, setSelected] = useState([])
  const [submitting, setSubmitting] = useState(false)

  const prefilled = useRef(false)
  useEffect(() => {
    if (!isEdit || prefilled.current || !content) return
    setTitle(content.title || '')
    setDescription(content.description || '')
    setCoverImage(content.cover_image || '')
    setFeeMode(content.fee?.mode || 'global')
    setGlobalFeeTez(mutezToTez(content.fee?.global_mutez))

    const byKey = new Map((existingTokens || []).map((t) => [tokenKey(t), t]))
    setSelected(
      (content.tokens || []).map((t) => {
        const enriched = byKey.get(tokenKey(t))
        return {
          fa2_address: t.fa2_address,
          token_id: String(t.token_id),
          name: enriched?.name || `#${t.token_id}`,
          display_uri: enriched?.display_uri,
          artist_address: enriched?.artist_address,
          feeTez: t.fee_mutez ? mutezToTez(t.fee_mutez) : undefined,
        }
      })
    )
    prefilled.current = true
  }, [isEdit, content, existingTokens])

  useEffect(() => {
    if (!isEdit || !existingTokens?.length) return
    const byKey = new Map(existingTokens.map((t) => [tokenKey(t), t]))
    setSelected((prev) =>
      prev.map((t) => {
        const enriched = byKey.get(tokenKey(t))
        return enriched
          ? {
              ...t,
              name: enriched.name || t.name,
              display_uri: t.display_uri ?? enriched.display_uri,
              artist_address: t.artist_address ?? enriched.artist_address,
            }
          : t
      })
    )
  }, [isEdit, existingTokens])

  const selectedKeys = useMemo(
    () => new Set(selected.map(tokenKey)),
    [selected]
  )

  const toggleToken = useCallback((token) => {
    const key = tokenKey(token)
    setSelected((prev) =>
      prev.some((t) => tokenKey(t) === key)
        ? prev.filter((t) => tokenKey(t) !== key)
        : [...prev, token]
    )
  }, [])
  const removeToken = useCallback(
    (key) => setSelected((prev) => prev.filter((t) => tokenKey(t) !== key)),
    []
  )
  const moveToken = useCallback((index, dir) => {
    setSelected((prev) => {
      const next = [...prev]
      const target = index + dir
      if (target < 0 || target >= next.length) return prev
      ;[next[index], next[target]] = [next[target], next[index]]
      return next
    })
  }, [])
  const setTokenFee = useCallback((key, tez) => {
    setSelected((prev) =>
      prev.map((t) => (tokenKey(t) === key ? { ...t, feeTez: tez } : t))
    )
  }, [])

  const onCoverFile = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setCoverUploading(true)
    try {
      const cid = await uploadMsgFileToIPFS(file)
      setCoverImage(`ipfs://${cid}`)
    } catch (err) {
      useModalStore.getState().showError('Cover Upload', err)
    } finally {
      setCoverUploading(false)
    }
  }
  const isOwner = isEdit && address === curation?.owner
  const canEdit = isEdit ? isOwner || roles?.canModerate : roles?.canCreate

  const onSubmit = async () => {
    if (!title.trim() || submitting) return
    setSubmitting(true)
    try {
      const tokens = selected.map((t) => {
        const fee = feeMode === 'per_token' ? tezToMutez(t.feeTez) : 0
        return {
          fa2_address: t.fa2_address,
          token_id: t.token_id,
          ...(feeMode === 'per_token' && fee > 0 ? { fee_mutez: fee } : {}),
        }
      })
      const input = {
        title: title.trim(),
        description: description.trim(),
        coverImage: coverImage || undefined,
        layout: 'masonry',
        tokens,
        fee: { mode: feeMode, global_mutez: tezToMutez(globalFeeTez) },
        owner: isEdit ? curation.owner : address,
      }

      if (isEdit) {
        await updateCuration(curationId, input, { asModerator: !isOwner })
        navigate(`${PATH.CURATIONS}/${curationId}`)
      } else {
        await createCuration(input)
        navigate(PATH.CURATIONS)
      }
    } catch {
      // Errors surface through the modal store; keep the form editable.
    } finally {
      setSubmitting(false)
    }
  }

  if (isEdit && !curation) {
    return (
      <Page title="Edit curation">
        <Container>
          {curationLoading ? (
            <Loading message="Loading curation" />
          ) : (
            <p className={styles.empty}>
              {curationError
                ? 'Could not load curation.'
                : 'Curation not found.'}
            </p>
          )}
        </Container>
      </Page>
    )
  }

  if (canEdit === false) {
    return (
      <Page title={isEdit ? 'Edit curation' : 'New curation'}>
        <Container>
          <p className={styles.empty}>
            {isEdit
              ? 'Only the owner or a moderator can edit this curation.'
              : 'You must hold Teia (TEIA) tokens to create a curation.'}
          </p>
        </Container>
      </Page>
    )
  }

  return (
    <Page title={isEdit ? 'Edit curation' : 'New curation'}>
      <Container>
        <h1>{isEdit ? 'Edit curation' : 'New curation'}</h1>

        <div className={styles.editor}>
          <Input
            type="text"
            label="Title"
            placeholder="Curation title"
            value={title}
            onChange={(v) => setTitle(typeof v === 'string' ? v : '')}
          />

          <div>
            <span className={styles.field_label}>Description</span>
            <textarea
              className={styles.textarea}
              placeholder="What is this curation about?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div>
            <span className={styles.field_label}>Cover image (optional)</span>
            {coverImage && (
              <img
                className={styles.cover}
                style={{ maxWidth: 200, aspectRatio: '1 / 1' }}
                src={msgIpfsToUrl(coverImage)}
                alt="cover"
              />
            )}
            <input type="file" accept="image/*" onChange={onCoverFile} />
            {coverUploading && <Loading message="Uploading cover" />}
          </div>

          <div>
            <span className={styles.field_label}>Add tokens</span>
            <TokenPicker selectedKeys={selectedKeys} onToggle={toggleToken} />
          </div>

          <div>
            <span className={styles.field_label}>
              Selected ({selected.length})
            </span>
            <SelectedTray
              selected={selected}
              perToken={feeMode === 'per_token'}
              onRemove={removeToken}
              onMove={moveToken}
              onFeeChange={setTokenFee}
            />
          </div>

          <div>
            <span className={styles.field_label}>Curation fee</span>
            <div className={styles.fee_row}>
              <label>
                <input
                  type="radio"
                  name="feeMode"
                  checked={feeMode === 'global'}
                  onChange={() => setFeeMode('global')}
                />{' '}
                Global
              </label>
              <label>
                <input
                  type="radio"
                  name="feeMode"
                  checked={feeMode === 'per_token'}
                  onChange={() => setFeeMode('per_token')}
                />{' '}
                Per token
              </label>
              <input
                className={`${styles.textarea} ${styles.tray_fee}`}
                type="number"
                min="0"
                step="0.1"
                placeholder="ꜩ"
                value={globalFeeTez}
                onChange={(e) => setGlobalFeeTez(e.target.value)}
              />
              <span className={styles.card_meta}>
                {feeMode === 'per_token'
                  ? 'default fee; override per token above'
                  : 'applies to every token'}
              </span>
            </div>
            <p className={styles.card_meta}>
              Not charged yet — stored for a future buy-via-curation payout.
            </p>
          </div>

          <div className={styles.header}>
            <Button
              shadow_box
              disabled={!title.trim() || submitting}
              onClick={onSubmit}
            >
              {submitting
                ? 'Saving…'
                : isEdit
                ? 'Save changes'
                : 'Create curation'}
            </Button>
            <Button
              onClick={() =>
                navigate(
                  isEdit ? `${PATH.CURATIONS}/${curationId}` : PATH.CURATIONS
                )
              }
            >
              Cancel
            </Button>
          </div>
        </div>
      </Container>
    </Page>
  )
}
