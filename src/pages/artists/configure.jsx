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
  profileAvatarUrl,
  setProfile,
  setProfileHidden,
  uploadProfileAvatar,
  useChainProfile,
} from '@data/profiles'
import { useGateRoles } from '@data/roles'
import { useUserStore } from '@context/userStore'
import { useModalStore } from '@context/modalStore'
import ArtistCard, {
  CARD_FIELDS,
  DEFAULT_SHOW,
  MAX_TAGS,
  parseTags,
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
    text: 'Save your card on-chain. You can update it any time.',
  },
]

/**
 * "Customize my card": the wallet's on-chain profile card (see
 * @data/profiles), with a live preview. The card carries its own name, bio
 * and avatar plus which fields and tags to show. Only the owner can save it;
 * moderators and multisig users can hide or unhide it.
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
  const { profile, isLoading: profileLoading } = useChainProfile(address)
  const me = useUserStore((st) => st.address)
  const isOwner = Boolean(address) && me === address
  const { data: gate } = useGateRoles(me)
  const canModerate = Boolean(gate?.canModerate)
  const [cardName, setCardName] = useState('')
  const [bio, setBio] = useState('')
  const [avatar, setAvatar] = useState('')
  const [avatarUploading, setAvatarUploading] = useState(false)
  const { data: extras } = useArtistExtras(address ? [address] : [], true)
  const { data: tokens } = useArtistPreviews(address)

  const [show, setShow] = useState(null)
  // Raw comma-separated input; parseTags() normalises it for the card/draft.
  const [tagInput, setTagInput] = useState('')
  const [tagLimitHit, setTagLimitHit] = useState(false)

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
    bio: Boolean(bio),
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
    // The on-chain card is the only source: no SUBJKT data.
    const content = profile?.content
    setShow(content?.card?.show ?? DEFAULT_SHOW)
    setTagInput((content?.card?.tags ?? []).join(', '))
    setCardName(content?.name ?? '')
    setBio(content?.description ?? '')
    setAvatar(content?.identicon ?? '')
    // Re-seeding on every profile refetch would discard unsaved edits.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address, profileLoading])

  if (error) return <Page title="Customize card">User not found.</Page>
  if (!user || !show) return <Loading message="Loading profile" />

  const artist = {
    address,
    name: cardName,
    description: bio,
    identicon: profileAvatarUrl(avatar),
    href: `/tz/${address}`,
    tokens: tokens ?? [],
  }
  const toggle = (key) => {
    setShow((s) => (s.includes(key) ? s.filter((k) => k !== key) : [...s, key]))
  }
  const tags = parseTags(tagInput)
  const countTags = (s) => s.split(',').filter((t) => t.trim()).length
  const onTagInput = (e) => {
    const next = e.target.value
    // Hard limit: refuse the change instead of silently dropping extras.
    if (countTags(next) > MAX_TAGS) return setTagLimitHit(true)
    setTagLimitHit(false)
    setTagInput(next)
  }
  const saveOnChain = () => {
    if (!isOwner) return
    setProfile({
      name: cardName.trim(),
      description: bio.trim(),
      identicon: avatar,
      card: { show, tags },
    }).catch(() => {}) // surfaced via modal
  }
  const onAvatar = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setAvatarUploading(true)
    try {
      setAvatar(await uploadProfileAvatar(file))
    } catch {
      useModalStore.getState().showError('Avatar', 'Upload failed')
    } finally {
      setAvatarUploading(false)
    }
  }
  const toggleHidden = () =>
    setProfileHidden({ address, hidden: !profile.hidden }).catch(() => {})

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
              <label className={styles.configure_tags}>
                <span>Name</span>
                <input
                  className={styles.tag_input}
                  value={cardName}
                  onChange={(e) => setCardName(e.target.value)}
                />
              </label>
              <label className={styles.configure_tags}>
                <span>Bio</span>
                <textarea
                  className={styles.tag_input}
                  value={bio}
                  rows={3}
                  onChange={(e) => setBio(e.target.value)}
                />
              </label>
              <label className={styles.configure_tags}>
                <span>Avatar{avatarUploading ? ' (uploading…)' : ''}</span>
                <input type="file" accept="image/*" onChange={onAvatar} />
              </label>
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
                <Button
                  shadow_box
                  disabled={!isOwner || avatarUploading}
                  title={isOwner ? '' : 'Sync the wallet that owns this card'}
                  onClick={saveOnChain}
                >
                  {profile ? 'Update card' : 'Create card'}
                </Button>
                {profile?.hidden && (
                  <span className={styles.configure_error}>
                    Hidden by moderators
                  </span>
                )}
                {canModerate && profile && (
                  <Button shadow_box onClick={toggleHidden}>
                    {profile.hidden ? 'Unhide card' : 'Hide card'}
                  </Button>
                )}
              </div>
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
