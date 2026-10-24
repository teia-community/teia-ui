import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Page, Container } from '@atoms/layout'
import { Button } from '@atoms/button'
import { Input } from '@atoms/input'
import { Loading } from '@atoms/loading'
import {
  PATH,
  CURATION_CREATE_FEE,
  CURATION_EDIT_FEE,
  CURATIONS_CONTRACT,
} from '@constants'
import { useContractFee } from '@data/contract-fees'
import {
  useCuration,
  useCurationContent,
  useCurationTokens,
  useCurationRoles,
  createCuration,
  updateCuration,
  tokenKey,
  pickerThumb,
  tokenThumb,
  normalizeFee,
  MAX_FEE_TEZ,
  MAX_FEE_PERCENT,
} from '@data/curations'
import { uploadMsgFileToIPFS, msgIpfsToUrl } from '@data/messaging/ipfs'
import { useChannelList } from '@data/messaging/channels'
import { useCalendarEvents } from '@hooks/use-calendar'
import { useUserStore } from '@context/userStore'
import { useModalStore } from '@context/modalStore'
import { useCurationDraftStore } from '@context/curationDraftStore'
import RelatedPicker from '@components/calendar/RelatedPicker'
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

const parseList = (str) => {
  const seen = new Set()
  const out = []
  for (const raw of (str || '').split(',')) {
    const t = raw.trim()
    if (t && !seen.has(t)) {
      seen.add(t)
      out.push(t)
    }
  }
  return out
}

const previewOf = (t) =>
  t?.preview_uri || t?.teia_meta?.preview_uri || undefined

// We can use the preview to load faster, but we need to find a way to support old tokens (no thumbnail/displayuri)
const coverUriOf = (t) => t?.display_uri || t?.thumbnail_uri

const eventImageUrl = (url) =>
  !url ? undefined : url.startsWith('ipfs://') ? msgIpfsToUrl(url) : url

const parseEventDate = (s) =>
  !s ? NaN : Date.parse(/^\d{4}-\d{2}-\d{2}$/.test(s) ? `${s}T00:00:00` : s)

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

  const [draft] = useState(() =>
    isEdit ? null : useCurationDraftStore.getState().drafts.new
  )

  const [title, setTitle] = useState(draft?.title || '')
  const [description, setDescription] = useState(draft?.description || '')
  const [coverImage, setCoverImage] = useState(draft?.coverImage || '')
  const [coverUploading, setCoverUploading] = useState(false)
  const [coverTokenKey, setCoverTokenKey] = useState(draft?.coverTokenKey || '')
  const [feeMode, setFeeMode] = useState(draft?.feeMode || 'global')
  const [feeUnit, setFeeUnit] = useState(draft?.feeUnit || 'tez')
  const [globalFeeTez, setGlobalFeeTez] = useState(draft?.globalFeeTez || '')
  const [globalFeePercent, setGlobalFeePercent] = useState(
    draft?.globalFeePercent || ''
  )
  const [selected, setSelected] = useState(draft?.selected || [])
  const [tagsInput, setTagsInput] = useState(draft?.tagsInput || '')
  const [channels, setChannels] = useState(draft?.channels || [])
  const [events, setEvents] = useState(draft?.events || [])
  const [activePicker, setActivePicker] = useState(null) // 'channels' | 'events' | null
  const [submitting, setSubmitting] = useState(false)

  const coverFileRef = useRef(null)
  const prefilled = useRef(false)
  useEffect(() => {
    if (!isEdit || prefilled.current || !content) return
    setTitle(content.title || '')
    setDescription(content.description || '')
    setCoverImage(content.cover_image || '')
    setTagsInput((content.tags || []).join(', '))
    setChannels(content.channels || [])
    setEvents(content.events || [])
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
          thumbnail_uri: enriched?.thumbnail_uri,
          preview_uri: previewOf(enriched),
          artist_address: enriched?.artist_address,
          feeTez: t.fee_mutez ? mutezToTez(t.fee_mutez) : undefined,
          feePercent: t.fee_bps ? bpsToPercent(t.fee_bps) : undefined,
        }
      })
    )
    prefilled.current = true
  }, [isEdit, content, existingTokens])

  // Drafts land in localStorage via zustand
  const draftTimer = useRef(null)
  useEffect(() => {
    if (isEdit) return
    clearTimeout(draftTimer.current)
    draftTimer.current = setTimeout(() => {
      useCurationDraftStore.getState().setDraft('new', {
        title,
        description,
        coverImage,
        coverTokenKey,
        feeMode,
        feeUnit,
        globalFeeTez,
        globalFeePercent,
        selected,
        tagsInput,
        channels,
        events,
      })
    }, 500)
    return () => clearTimeout(draftTimer.current)
  }, [
    isEdit,
    title,
    description,
    coverImage,
    coverTokenKey,
    feeMode,
    feeUnit,
    globalFeeTez,
    globalFeePercent,
    selected,
    tagsInput,
    channels,
    events,
  ])

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
              thumbnail_uri: t.thumbnail_uri ?? enriched.thumbnail_uri,
              preview_uri: t.preview_uri ?? previewOf(enriched),
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
    () => selected.filter((t) => coverUriOf(t)),
    [selected]
  )
  const featuredToken = useMemo(() => {
    if (!selected.length) return null
    return (
      (coverTokenKey && selected.find((t) => tokenKey(t) === coverTokenKey)) ||
      selected[0]
    )
  }, [selected, coverTokenKey])

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

  // --- linked channels & calendar events ----------------------------------
  const { data: channelList } = useChannelList()
  const { events: allEvents } = useCalendarEvents({
    enabled: activePicker === 'events',
  })

  const channelItems = useMemo(
    () =>
      (channelList || []).map((ch) => ({
        key: String(ch.id),
        id: ch.id,
        name: ch.metadata?.name || `Channel #${ch.id}`,
        meta: ch.metadata?.description || '',
        image: ch.metadata?.image ? msgIpfsToUrl(ch.metadata.image) : undefined,
      })),
    [channelList]
  )
  const channelImageById = useMemo(
    () => new Map(channelItems.map((it) => [it.key, it.image])),
    [channelItems]
  )
  const eventItems = useMemo(() => {
    const now = Date.now()
    // Recurring events repeat one slug across many occurrences, gathered in one.
    const bySlug = new Map()
    for (const ev of allEvents || []) {
      const slug =
        ev.slug || (ev.eventId != null ? `chain-${ev.eventId}` : String(ev.id))
      const ts = parseEventDate(ev.startDate)
      const e = bySlug.get(slug) || {
        slug,
        name: ev.title || slug,
        image: undefined,
        soonestUpcoming: Infinity,
        latest: -Infinity,
      }
      if (!e.image) e.image = eventImageUrl(ev.images?.[0])
      if (!Number.isNaN(ts)) {
        if (ts >= now && ts < e.soonestUpcoming) e.soonestUpcoming = ts
        if (ts > e.latest) e.latest = ts
      }
      bySlug.set(slug, e)
    }

    const items = [...bySlug.values()].map((e) => {
      const upcoming = e.soonestUpcoming !== Infinity
      const repTs = upcoming
        ? e.soonestUpcoming
        : e.latest !== -Infinity
        ? e.latest
        : NaN
      return { ...e, upcoming, repTs }
    })

    items.sort((a, b) => {
      if (a.upcoming !== b.upcoming) return a.upcoming ? -1 : 1
      return a.upcoming ? a.repTs - b.repTs : b.repTs - a.repTs
    })

    return items.map((e) => ({
      key: e.slug,
      id: e.slug,
      name: e.name,
      meta: Number.isNaN(e.repTs)
        ? ''
        : new Date(e.repTs).toISOString().slice(0, 10),
      image: e.image,
      startDate: Number.isNaN(e.repTs)
        ? undefined
        : new Date(e.repTs).toISOString(),
    }))
  }, [allEvents])
  const selectedChannelKeys = useMemo(
    () => new Set(channels.map((c) => String(c.id))),
    [channels]
  )
  const selectedEventKeys = useMemo(
    () => new Set(events.map((e) => e.slug)),
    [events]
  )

  const toggleChannel = (item, on) =>
    setChannels((prev) =>
      on
        ? prev.some((c) => String(c.id) === String(item.id))
          ? prev
          : [...prev, { id: item.id, name: item.name }]
        : prev.filter((c) => String(c.id) !== String(item.id))
    )
  const toggleEvent = (item, on) =>
    setEvents((prev) =>
      on
        ? prev.some((e) => e.slug === item.id)
          ? prev
          : [
              ...prev,
              {
                slug: item.id,
                title: item.name,
                image: item.image,
                startDate: item.startDate,
              },
            ]
        : prev.filter((e) => e.slug !== item.id)
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
  const canEdit = isEdit ? isOwner : roles?.canCreate
  // Quoted from the contract, so the figure shown is the one charged.
  const liveFee = useContractFee(
    CURATIONS_CONTRACT,
    isEdit ? 'edit_fee' : 'create_fee',
    isEdit ? CURATION_EDIT_FEE : CURATION_CREATE_FEE
  )
  const platformFee = mutezToTez(liveFee)

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
        coverThumbnail: coverImage ? undefined : coverUriOf(featuredToken),
        layout: 'masonry',
        tokens,
        tags: parseList(tagsInput).slice(0, 20),
        channels,
        events,
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
        await updateCuration(curationId, input)
        navigate(`${PATH.CURATIONS}/${curationId}`)
      } else {
        await createCuration(input)
        clearTimeout(draftTimer.current)
        useCurationDraftStore.getState().clearDraft('new')
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
              ? 'Only the owner can edit this curation.'
              : 'Sync your wallet to create a curation.'}
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
            <span className={styles.field_label}>Cover (optional)</span>
            {coverImage ? (
              <CurationCover
                className={styles.cover}
                style={{ maxWidth: 200, aspectRatio: '1 / 1' }}
                uri={coverImage}
                alt="cover"
              />
            ) : (
              featuredToken &&
              tokenThumb(coverUriOf(featuredToken)) && (
                <img
                  className={styles.cover}
                  style={{ maxWidth: 200, aspectRatio: '1 / 1' }}
                  src={tokenThumb(coverUriOf(featuredToken))}
                  alt="cover"
                />
              )
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

            {!coverImage && coverChoices.length === 0 && (
              <span className={styles.card_meta}>
                Select tokens below — the first becomes the cover.
              </span>
            )}
            {!coverImage && coverChoices.length > 0 && (
              <>
                <span className={styles.card_meta}>
                  Pick which selected token is the cover
                </span>
                <div className={styles.cover_options}>
                  {coverChoices.map((token) => {
                    const key = tokenKey(token)
                    const active =
                      featuredToken && tokenKey(featuredToken) === key
                    return (
                      <button
                        key={key}
                        type="button"
                        className={`${styles.cover_option} ${
                          active ? styles.cover_option_active : ''
                        }`}
                        onClick={() => setCoverTokenKey(key)}
                        title={token.name}
                      >
                        <img src={pickerThumb(token)} alt={token.name} />
                      </button>
                    )
                  })}
                </div>
              </>
            )}
          </div>

          <div>
            <span className={styles.field_label}>Tags (optional, max 20)</span>
            <Input
              type="text"
              placeholder="tag1, tag2, …"
              value={tagsInput}
              onChange={(v) => setTagsInput(typeof v === 'string' ? v : '')}
            />
          </div>

          <div>
            <span className={styles.field_label}>Channels (optional)</span>
            <div className={styles.section_actions}>
              <Button
                small
                secondary
                type="button"
                onClick={() => setActivePicker('channels')}
              >
                Link channels
              </Button>
            </div>
            {channels.length > 0 && (
              <ul className={styles.related_list}>
                {channels.map((c) => (
                  <li className={styles.related_row} key={`ch-${c.id}`}>
                    {channelImageById.get(String(c.id)) ? (
                      <span className={styles.related_thumb}>
                        <img
                          src={channelImageById.get(String(c.id))}
                          alt=""
                          loading="lazy"
                          onError={(e) =>
                            (e.currentTarget.style.display = 'none')
                          }
                        />
                      </span>
                    ) : (
                      <span
                        className={styles.related_thumb}
                        aria-hidden="true"
                      />
                    )}
                    <span className={styles.related_name}>{c.name}</span>
                    <button
                      type="button"
                      className={styles.icon_btn}
                      aria-label={`Unlink ${c.name}`}
                      onClick={() =>
                        setChannels((prev) =>
                          prev.filter((x) => String(x.id) !== String(c.id))
                        )
                      }
                    >
                      ✕
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div>
            <span className={styles.field_label}>
              Calendar events (optional)
            </span>
            <div className={styles.section_actions}>
              <Button
                small
                secondary
                type="button"
                onClick={() => setActivePicker('events')}
              >
                Link events
              </Button>
            </div>
            {events.length > 0 && (
              <ul className={styles.related_list}>
                {events.map((e) => (
                  <li className={styles.related_row} key={`ev-${e.slug}`}>
                    {e.image ? (
                      <span className={styles.related_thumb}>
                        <img
                          src={e.image}
                          alt=""
                          loading="lazy"
                          onError={(ev) =>
                            (ev.currentTarget.style.display = 'none')
                          }
                        />
                      </span>
                    ) : (
                      <span
                        className={styles.related_thumb}
                        aria-hidden="true"
                      />
                    )}
                    <span className={styles.related_name}>{e.title}</span>
                    <button
                      type="button"
                      className={styles.icon_btn}
                      aria-label={`Unlink ${e.title}`}
                      onClick={() =>
                        setEvents((prev) =>
                          prev.filter((x) => x.slug !== e.slug)
                        )
                      }
                    >
                      ✕
                    </button>
                  </li>
                ))}
              </ul>
            )}
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
              Selected fees will be added on top of the normal sale.
            </p>
          </div>

          <p className={styles.card_meta}>
            {isEdit
              ? `Saving changes costs ${platformFee} ꜩ (charged on every edit).`
              : `Creating a curation costs ${platformFee} ꜩ.`}
          </p>
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

        {activePicker === 'channels' && (
          <RelatedPicker
            title="Channels"
            items={channelItems}
            loading={!channelList}
            emptyMessage="No channels found."
            selectedKeys={selectedChannelKeys}
            onToggle={toggleChannel}
            onClose={() => setActivePicker(null)}
          />
        )}
        {activePicker === 'events' && (
          <RelatedPicker
            title="Calendar events"
            items={eventItems}
            loading={!allEvents}
            emptyMessage="No events found."
            selectedKeys={selectedEventKeys}
            onToggle={toggleEvent}
            onClose={() => setActivePicker(null)}
          />
        )}
      </Container>
    </Page>
  )
}
