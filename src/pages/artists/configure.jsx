import { useEffect, useState } from 'react'
import { useAccountRoles } from '@data/roles'
import { resolveVerifiedBluesky } from '@utils/bsky'
import { useParams, Link } from 'react-router-dom'
import useSWR from 'swr'
import { Page, Container } from '@atoms/layout'
import { Button } from '@atoms/button'
import { Loading } from '@atoms/loading'
import { Checkbox } from '@atoms/input'
import { getUser } from '@data/api'
import { useArtistExtras, useArtistPreviews } from '@data/artists'
import {
  claimHandle,
  releaseHandle,
  setProfile,
  useChainProfile,
  useHandleStatus,
} from '@data/profiles'
import { REGISTRIES_ENABLED } from '@data/registries'
import { useUserStore } from '@context/userStore'
import ArtistCard, {
  CARD_FIELDS,
  DEFAULT_SHOW,
  MAX_TAGS,
  draftKey,
  parseTags,
  readDraft,
} from './ArtistCard'
import Tour from '@components/tour'
import styles from './index.module.scss'

const CONFIGURE_TOUR = [
  { target: 'fields', text: 'Tick the fields you want on your card.' },
  {
    target: 'tags',
    text: 'Add up to 6 tags, comma separated. They show as chips.',
  },
  { target: 'preview', text: 'Your card updates here as you go.' },
  {
    target: 'save',
    text: 'Save a draft. It lives in this browser until on-chain save lands.',
  },
]

const HANDLE_STATUS = {
  invalid: 'Use 1-32 lowercase letters, numbers, "_" or "-"',
  taken: 'Already taken',
  blocked: 'Reserved',
  available: 'Available',
}

/**
 * "Customize my card": pick which profile fields show on your artist card,
 * with a live preview. Saves a local draft; in shadownet test mode the owner
 * can also save it to the on-chain profile registry (see @data/profiles) and
 * claim a handle there.
 */
export default function ConfigureArtistCard() {
  const { name } = useParams()
  // `name` is a SUBJKT name, or a wallet address (which may have no SUBJKT).
  const byAddress = /^(tz|KT)1/.test(name)
  const { data: user, error } = useSWR(['configure-artist', name], async () =>
    byAddress
      ? (await getUser(name)) ?? { user_address: name }
      : getUser(name, 'name')
  )
  const address = user?.user_address
  const { profile, isLoading: profileLoading } = useChainProfile(
    REGISTRIES_ENABLED ? address : undefined
  )
  const isOwner = useUserStore(
    (st) => Boolean(address) && st.address === address
  )
  const [handleInput, setHandleInput] = useState('')
  const handleStatus = useHandleStatus(handleInput)
  const { data: extras } = useArtistExtras(address ? [address] : [], true)
  const { data: tokens } = useArtistPreviews(address)

  const [show, setShow] = useState(null)
  // Raw comma-separated input; parseTags() normalises it for the card/draft.
  const [tagInput, setTagInput] = useState('')
  const [tagLimitHit, setTagLimitHit] = useState(false)
  const [saved, setSaved] = useState(false)

  // What this artist actually has linked, so each checkbox can warn when
  // turning it on would show nothing.
  const roles = useAccountRoles(address)
  const [bsky, setBsky] = useState(undefined)
  useEffect(() => {
    if (!address) return
    resolveVerifiedBluesky(address).then(setBsky)
  }, [address])
  const ex = extras?.[address] ?? {}
  const available = {
    bio: Boolean(user?.metadata?.data?.description),
    roles: Boolean(
      roles.isModerator || roles.isMultisig || roles.isTokenHolder
    ),
    domain: Boolean(ex.domain),
    website: Boolean(ex.website),
    twitter: Boolean(ex.twitter),
    bluesky: bsky === undefined ? undefined : Boolean(bsky?.handle),
    discord: Boolean(ex.discord),
    github: Boolean(ex.github),
    baker: Boolean(ex.baker),
    teia: (ex.teia ?? 0) > 0,
    since: Boolean(ex.since),
  }
  useEffect(() => {
    if (!address || profileLoading) return
    const draft = readDraft(address)
    const card = profile?.content?.card ?? user.metadata?.data?.card
    setShow(draft?.show ?? card?.show ?? DEFAULT_SHOW)
    setTagInput((draft?.tags ?? card?.tags ?? []).join(', '))
    // Re-seeding on every profile refetch would discard unsaved edits.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address, user, profileLoading])

  if (error) return <Page title="Customize card">User not found.</Page>
  if (!user || !show) return <Loading message="Loading profile" />

  const artist = {
    address,
    name: user.name,
    description: user.metadata?.data?.description,
    identicon: user.metadata?.data?.identicon,
    tokens: tokens ?? [],
  }
  const toggle = (key) => {
    setSaved(false)
    setShow((s) => (s.includes(key) ? s.filter((k) => k !== key) : [...s, key]))
  }
  const tags = parseTags(tagInput)
  const countTags = (s) => s.split(',').filter((t) => t.trim()).length
  const onTagInput = (e) => {
    const next = e.target.value
    // Hard limit: refuse the change instead of silently dropping extras.
    if (countTags(next) > MAX_TAGS) return setTagLimitHit(true)
    setTagLimitHit(false)
    setSaved(false)
    setTagInput(next)
  }
  const saveDraft = () => {
    localStorage.setItem(draftKey(address), JSON.stringify({ show, tags }))
    setSaved(true)
  }
  // The rest of the document carries over from the existing on-chain profile,
  // or from SUBJKT metadata the first time.
  const saveOnChain = async () => {
    if (!isOwner) return
    const previous = profile?.content ?? {
      name: user.name,
      description: user.metadata?.data?.description,
      identicon: user.metadata?.data?.identicon,
    }
    try {
      await setProfile({ ...previous, card: { show, tags } })
      // The on-chain card is now the source of truth.
      localStorage.removeItem(draftKey(address))
    } catch {
      // surfaced via modal
    }
  }
  const claim = () =>
    handleStatus === 'available' &&
    claimHandle(handleInput)
      .then(() => setHandleInput(''))
      .catch(() => {})

  return (
    <Page title="Customize card">
      <Tour name="customize" steps={CONFIGURE_TOUR} />
      <Container>
        <div className={styles.page}>
          <h1 className={styles.heading}>Customize my card</h1>
          <p className={styles.subheading}>
            Choose what shows on your card in the{' '}
            <Link to="/artist-directory">Artists</Link> directory.
          </p>
          <div className={styles.configure}>
            <div className={styles.configure_options}>
              <div data-tour="fields" className={styles.configure_options}>
                {CARD_FIELDS.map((f) => (
                  <div key={f.key} className={styles.configure_field}>
                    <Checkbox
                      checked={show.includes(f.key)}
                      onCheck={() => toggle(f.key)}
                      label={f.label}
                    />
                    {extras && available[f.key] === false && (
                      <span className={styles.configure_warn}>
                        nothing linked
                      </span>
                    )}
                  </div>
                ))}
              </div>
              <label data-tour="tags" className={styles.configure_tags}>
                <span>Tags (up to {MAX_TAGS}, comma separated)</span>
                <input
                  className={styles.tag_input}
                  value={tagInput}
                  onChange={onTagInput}
                  placeholder="e.g. glitch, photography, 3d"
                />
                {tagLimitHit && (
                  <span className={styles.configure_error}>
                    Maximum {MAX_TAGS} tags
                  </span>
                )}
              </label>
              <div data-tour="save" className={styles.configure_actions}>
                <Button shadow_box onClick={saveDraft}>
                  {saved ? 'Saved' : 'Save draft'}
                </Button>
                {REGISTRIES_ENABLED ? (
                  <Button
                    shadow_box
                    disabled={!isOwner}
                    title={isOwner ? '' : 'Sync the wallet that owns this card'}
                    onClick={saveOnChain}
                  >
                    Save on-chain
                  </Button>
                ) : (
                  <Button shadow_box disabled title="On-chain save coming next">
                    Save on-chain
                  </Button>
                )}
              </div>
              <p className={styles.note}>
                Draft is stored in this browser only. Saving on-chain will write
                it to your{' '}
                {REGISTRIES_ENABLED ? 'Teia profile' : 'subjkt metadata'}.
              </p>
              {REGISTRIES_ENABLED && isOwner && profile && (
                <label className={styles.configure_tags}>
                  <span>
                    Handle{profile.handle ? `: @${profile.handle}` : ' (none)'}
                  </span>
                  <input
                    className={styles.tag_input}
                    value={handleInput}
                    onChange={(e) => setHandleInput(e.target.value)}
                    placeholder="e.g. my-name"
                  />
                  {handleStatus && (
                    <span
                      className={
                        handleStatus === 'available'
                          ? undefined
                          : styles.configure_error
                      }
                    >
                      {HANDLE_STATUS[handleStatus]}
                    </span>
                  )}
                  <div className={styles.configure_actions}>
                    <Button
                      shadow_box
                      disabled={handleStatus !== 'available'}
                      onClick={claim}
                    >
                      Claim handle
                    </Button>
                    {profile.handle && (
                      <Button
                        shadow_box
                        onClick={() => releaseHandle().catch(() => {})}
                      >
                        Release handle
                      </Button>
                    )}
                  </div>
                </label>
              )}
            </div>
            <div data-tour="preview" className={styles.configure_preview}>
              <ArtistCard
                artist={artist}
                extras={extras?.[address]}
                show={show}
                tags={tags}
              />
            </div>
          </div>
        </div>
      </Container>
    </Page>
  )
}
