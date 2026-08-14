import { useParams, useNavigate, Link } from 'react-router-dom'
import { Page, Container } from '@atoms/layout'
import Button from '@atoms/button/Button'
import { Loading } from '@atoms/loading'
import { Identicon } from '@atoms/identicons'
import { ResponsiveMasonry } from '@components/responsive-masonry'
import { FeedItem } from '@components/feed-item'
import { PATH } from '@constants'
import {
  useCuration,
  useCurationContent,
  useCurationTokens,
  useCurationRoles,
  setCurationHidden,
} from '@data/curations'
import { useUserProfiles } from '@data/roles'
import { useUserStore } from '@context/userStore'
import { walletPreview } from '@utils/string'
import { HashToURL } from '@utils'
import CurationCover from './CurationCover'
import { isPlayableAudio } from './CurationPlayer'
import styles from '@style'

export default function CurationDetail() {
  const { id } = useParams()
  const curationId = Number(id)
  const navigate = useNavigate()
  const address = useUserStore((st) => st.address)

  const { curation, isLoading } = useCuration(curationId)
  const { data: content } = useCurationContent(curation?.cid)
  const { data: tokens } = useCurationTokens(content?.tokens)
  const { data: roles } = useCurationRoles(address)
  const { data: profiles = {} } = useUserProfiles(
    curation?.owner ? [curation.owner] : []
  )

  if (isLoading) {
    return (
      <Page title="Curation">
        <Container>
          <Loading message="Loading curation" />
        </Container>
      </Page>
    )
  }

  if (!curation) {
    return (
      <Page title="Curation">
        <Container>
          <p className={styles.empty}>Curation not found.</p>
        </Container>
      </Page>
    )
  }

  const canEdit = address === curation.owner || roles?.canModerate

  if (curation.hidden && !canEdit) {
    return (
      <Page title="Curation">
        <Container>
          <p className={styles.empty}>This curation has been hidden.</p>
        </Container>
      </Page>
    )
  }

  const playerPath = `${PATH.CURATIONS}/${curation.id}/play`
  const hasMusic = tokens?.some(isPlayableAudio)

  const openPlayer = () => {
    const popup = window.open(
      playerPath,
      `teia-player-${curation.id}`,
      'width=420,height=640,popup=yes'
    )
    if (!popup) navigate(playerPath)
  }

  const cover = content?.cover_image
  const headerThumb =
    !cover && tokens?.[0]?.display_uri
      ? HashToURL(tokens[0].display_uri, 'CDN', { size: 'small' })
      : ''

  return (
    <Page title={content?.title || `Curation ${curation.id}`}>
      <Container>
        <div className={styles.detail_head}>
          <div className={styles.header}>
            <div className={styles.detail_title_group}>
              {cover ? (
                <CurationCover
                  className={styles.detail_cover}
                  uri={cover}
                  alt={content?.title || `Curation ${curation.id}`}
                />
              ) : (
                headerThumb && (
                  <img
                    className={styles.detail_cover}
                    src={headerThumb}
                    alt={content?.title || `Curation ${curation.id}`}
                  />
                )
              )}
              <h1>{content?.title || `Curation ${curation.id}`}</h1>
            </div>
            {(hasMusic || canEdit) && (
              <div className={styles.detail_actions}>
                {hasMusic && (
                  <Button shadow_box onClick={openPlayer}>
                    Listen
                  </Button>
                )}
                {canEdit && (
                  <>
                    <Button
                      shadow_box
                      to={`${PATH.CURATIONS}/${curation.id}/edit`}
                    >
                      Edit
                    </Button>
                    <Button
                      shadow_box
                      onClick={() =>
                        setCurationHidden({
                          curationId: curation.id,
                          hidden: !curation.hidden,
                        })
                      }
                    >
                      {curation.hidden ? 'Unhide' : 'Hide'}
                    </Button>
                  </>
                )}
              </div>
            )}
          </div>

          {content?.description && (
            <p className={styles.detail_desc}>{content.description}</p>
          )}

          <div className={styles.detail_meta}>
            <Link
              className={styles.owner_link}
              to={`${PATH.ISSUER}/${curation.owner}/curations`}
            >
              <Identicon
                address={curation.owner}
                logo={profiles[curation.owner]?.logo}
                className={styles.owner_avatar}
              />
              <span>
                by{' '}
                {profiles[curation.owner]?.alias ||
                  walletPreview(curation.owner)}
              </span>
            </Link>
            <span>
              {content?.tokens?.length ?? 0} token
              {content?.tokens?.length === 1 ? '' : 's'}
            </span>
            {curation.hidden && <span>hidden</span>}
          </div>
        </div>

        {!content ? (
          <Loading message="Loading tokens" />
        ) : (content.tokens?.length ?? 0) === 0 ? (
          <p className={styles.empty}>This curation has no tokens yet.</p>
        ) : !tokens ? (
          <Loading message="Loading tokens" />
        ) : (
          <ResponsiveMasonry>
            {tokens.map((token) => (
              <FeedItem key={token.key} nft={token} />
            ))}
          </ResponsiveMasonry>
        )}
      </Container>
    </Page>
  )
}
