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
  pickerThumb,
  normalizeFee,
  MAX_FEE_TEZ,
  MAX_FEE_PERCENT,
} from '@data/curations'
import { uploadMsgFileToIPFS } from '@data/messaging/ipfs'
import { useUserStore } from '@context/userStore'
import { useModalStore } from '@context/modalStore'
import TokenPicker from './TokenPicker'
import SelectedTray from './SelectedTray'
import CurationCover from './CurationCover'
import styles from '@style'

const tezToMutez = (tez) => {
  const n = parseFloat(tez)
  if (!Number.isFinite(n) || n <= 0) return 0
  return Math.min(Math.round(n * 1_000_000), MAX_FEE_TEZ * 1_000_000)
}
const mutezToTez = (mutez) => (mutez ? String(mutez / 1_000_000) : '')

/** Percentages are stored as integer basis points: 2.5% -> 250. */
const percentToBps = (percent) => {
  const n = parseFloat(percent)
  if (!Number.isFinite(n) || n <= 0) return 0
  return Math.min(Math.round(n * 100), MAX_FEE_PERCENT * 100)
}
const bpsToPercent = (bps) => (bps ? String(bps / 100) : '')

/**
 * Cover uploads hidden
 */
const COVER_UPLOAD_ENABLED = false

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
  const [feeUnit, setFeeUnit] = useState('tez')
  const [globalFeeTez, setGlobalFeeTez] = useState('')
  const [globalFeePercent, setGlobalFeePercent] = useState('')
  const [selected, setSelected] = useState([])
  const [submitting, setSubmitting] = useState(false)

  const coverFileRef = useRef(null)
  const prefilled = useRef(false)
  useEffect(() => {
    if (!isEdit || prefilled.current || !content) return
    setTitle(content.title || '')
    setDescription(content.description || '')
    setCoverImage(content.cover_image || '')
    const fee = normalizeFee(content.fee)
    setFeeMode(fee.mode)
    setFeeUnit(fee.unit)
    setGlobalFeeTez(mutezToTez(fee.globalMutez))
    setGlobalFeePercent(bpsToPercent(fee.globalBps))

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
          feePercent: t.fee_bps ? bpsToPercent(t.fee_bps) : undefined,
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
  const coverChoices = useMemo(
    () => selected.filter((t) => t.display_uri),
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
  const setTokenFee = useCallback(
    (key, value) => {
      const field = feeUnit === 'percent' ? 'feePercent' : 'feeTez'
      setSelected((prev) =>
        prev.map((t) => (tokenKey(t) === key ? { ...t, [field]: value } : t))
      )
    },
    [feeUnit]
  )

  const onCoverFile = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
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
      const perToken = feeMode === 'per_token'
      const asPercent = feeUnit === 'percent'
      const tokens = selected.map((t) => {
        const base = { fa2_address: t.fa2_address, token_id: t.token_id }
        if (!perToken) return base
        const fee = asPercent
          ? percentToBps(t.feePercent)
          : tezToMutez(t.feeTez)
        if (fee <= 0) return base
        return {
          ...base,
          ...(asPercent ? { fee_bps: fee } : { fee_mutez: fee }),
        }
      })
      const input = {
        title: title.trim(),
        description: description.trim(),
        coverImage: coverImage || undefined,
        layout: 'masonry',
        tokens,
        fee: {
          mode: feeMode,
          unit: feeUnit,
          global_mutez: !perToken && !asPercent ? tezToMutez(globalFeeTez) : 0,
          global_bps:
            !perToken && asPercent ? percentToBps(globalFeePercent) : 0,
        },
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
              <CurationCover
                className={styles.cover}
                style={{ maxWidth: 200, aspectRatio: '1 / 1' }}
                uri={coverImage}
                alt="cover"
              />
            )}
            {(COVER_UPLOAD_ENABLED || coverImage) && (
              <div className={styles.cover_actions}>
                {COVER_UPLOAD_ENABLED && (
                  <Button onClick={() => coverFileRef.current?.click()}>
                    {coverImage ? 'Replace image' : 'Upload image'}
                  </Button>
                )}
                {coverImage && (
                  <Button onClick={() => setCoverImage('')}>Remove</Button>
                )}
              </div>
            )}
            <input
              ref={coverFileRef}
              className={styles.hidden_input}
              type="file"
              accept="image/*"
              onChange={onCoverFile}
            />
            {coverUploading && <Loading message="Uploading cover" />}

            {coverChoices.length === 0 && (
              <span className={styles.card_meta}>
                Select tokens below to pick a cover.
              </span>
            )}
            {coverChoices.length > 0 && (
              <>
                <span className={styles.card_meta}>
                  Use one of your selected tokens
                </span>
                <div className={styles.cover_options}>
                  {coverChoices.map((token) => (
                    <button
                      key={tokenKey(token)}
                      type="button"
                      className={`${styles.cover_option} ${
                        coverImage === token.display_uri
                          ? styles.cover_option_active
                          : ''
                      }`}
                      onClick={() => setCoverImage(token.display_uri)}
                      title={token.name}
                    >
                      <img src={pickerThumb(token)} alt={token.name} />
                    </button>
                  ))}
                </div>
              </>
            )}
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
              feeUnit={feeUnit}
              onRemove={removeToken}
              onMove={moveToken}
              onFeeChange={setTokenFee}
            />
          </div>

          <div>
            <span className={styles.field_label}>Curation fee</span>
            <div className={styles.fee_row}>
              <div className={styles.seg} role="group" aria-label="Fee mode">
                <button
                  type="button"
                  className={`${styles.seg_btn} ${
                    feeMode === 'global' ? styles.seg_btn_active : ''
                  }`}
                  aria-pressed={feeMode === 'global'}
                  onClick={() => setFeeMode('global')}
                >
                  Global
                </button>
                <button
                  type="button"
                  className={`${styles.seg_btn} ${
                    feeMode === 'per_token' ? styles.seg_btn_active : ''
                  }`}
                  aria-pressed={feeMode === 'per_token'}
                  onClick={() => setFeeMode('per_token')}
                >
                  Per token
                </button>
              </div>
              <div className={styles.seg} role="group" aria-label="Fee unit">
                <button
                  type="button"
                  className={`${styles.seg_btn} ${
                    feeUnit === 'tez' ? styles.seg_btn_active : ''
                  }`}
                  aria-pressed={feeUnit === 'tez'}
                  onClick={() => setFeeUnit('tez')}
                >
                  ꜩ
                </button>
                <button
                  type="button"
                  className={`${styles.seg_btn} ${
                    feeUnit === 'percent' ? styles.seg_btn_active : ''
                  }`}
                  aria-pressed={feeUnit === 'percent'}
                  onClick={() => setFeeUnit('percent')}
                >
                  %
                </button>
              </div>
              {feeMode === 'global' && (
                <div className={styles.fee_field}>
                  <input
                    className={styles.fee_input}
                    type="number"
                    min="0"
                    max={feeUnit === 'percent' ? MAX_FEE_PERCENT : MAX_FEE_TEZ}
                    step="0.1"
                    placeholder="0.00"
                    aria-label="Curation fee"
                    value={
                      feeUnit === 'percent' ? globalFeePercent : globalFeeTez
                    }
                    onChange={(e) =>
                      feeUnit === 'percent'
                        ? setGlobalFeePercent(e.target.value)
                        : setGlobalFeeTez(e.target.value)
                    }
                  />
                  <span className={styles.fee_unit}>
                    {feeUnit === 'percent' ? '%' : 'ꜩ'}
                  </span>
                </div>
              )}
              <span className={styles.card_meta}>
                {feeMode === 'per_token'
                  ? 'set a fee on each token above'
                  : feeUnit === 'percent'
                  ? 'share of the listing price of every token'
                  : 'applies to every token'}
              </span>
            </div>
            <p className={styles.card_meta}>
              Selected Fees will be added on top of the normal sale
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
