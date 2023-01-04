/* eslint-disable react-hooks/exhaustive-deps */
import React, { useContext, useMemo, useState } from 'react'
import set from 'lodash/set'
import { useParams } from 'react-router-dom'
import useSWR from 'swr'
import { TeiaContext } from '@context/TeiaContext'
import { MIMETYPE, METADATA_CONTENT_RATING_MATURE } from '@constants'
import { fetchObjktDetails } from '@data/api'
import { Loading } from '@atoms/loading'
import { Button, Primary } from '@atoms/button'
import { Page, Container } from '@atoms/layout'
import { renderMediaType } from '@components/media-types'
import { ItemInfo } from '@components/item-info'
import { Info, Collectors, Swap, Burn, History, Transfer } from './tabs'
import styles from '@style'
import './style.css'
import useSettings from '@hooks/use-settings'

const TABS = [
  { title: 'Info', component: Info },
  { title: 'Listings', component: Collectors },
  { title: 'History', component: History },
  { title: 'Swap', component: Swap, private: true, restricted: true }, // private tab (users only see if they are the creators or own a copy)
  { title: 'Burn', component: Burn, private: true }, // private tab (users only see if they are the creators or own a copy)
  { title: 'Transfer', component: Transfer, private: true }, // private tab (users only see if they are the creators or own a copy)
]

export const ObjktDisplay = () => {
  const { id } = useParams()
  const context = useContext(TeiaContext)
  const { walletBlockMap } = useSettings()
  const [tabIndex, setTabIndex] = useState(0)
  const address = context.acc?.address
  const proxy = context.getProxy()
  const { nsfwMap, underReviewMap } = useSettings()

  const { data: nft, error } = useSWR(
    ['/token', id],
    async () => {
      const objkt = await fetchObjktDetails(id)

      if (!objkt) {
        throw new Error('unknown objkt')
      }

      if (nsfwMap.get(objkt.token_id) === 1) {
        set(objkt, 'teia_meta.content_rating', METADATA_CONTENT_RATING_MATURE)
      }

      // TODO: is really needed?
      await context.setAccount()

      objkt.restricted = walletBlockMap.get(objkt.artist_address) === 1
      objkt.underReview = underReviewMap.get(objkt.artist_address) === 1
      objkt.listings = objkt.listings.filter(
        ({ seller_address }) => walletBlockMap.get(seller_address) !== 1
      )

      return objkt
    },
    {
      revalidateIfStale: false,
      revalidateOnFocus: false,
    }
  )

  const loading = !nft && !error
  const Tab = TABS[tabIndex].component

  const objkt_classes = useMemo(() => {
    if (!nft) {
      return []
    }

    const classes = []

    if (
      nft.mime_type === MIMETYPE.DIRECTORY ||
      nft.mime_type === MIMETYPE.SVG
      // nft.mime === MIMETYPE.MD
    ) {
      classes.push('objktview-zipembed')
      classes.push('objktview')
      classes.push(styles.objktview)
    } else if (
      [
        MIMETYPE.MP4,
        MIMETYPE.OGV,
        MIMETYPE.QUICKTIME,
        MIMETYPE.WEBM,
        MIMETYPE.PDF,
      ].includes(nft.mime_type)
    ) {
      classes.push('no-fullscreen')
    } else {
      classes.push('objktview')
      classes.push(styles.objktview)
    }

    return classes
  }, [nft])

  return (
    <Page title={nft?.name}>
      {loading && <Loading />}

      {error && (
        <Container>
          <p>{error}</p>
          <Button href="https://github.com/teia-community/teia-ui/issues">
            <Primary>
              <strong>Report</strong>
            </Primary>
          </Button>
        </Container>
      )}

      {!loading &&
        (!context.progress ? (
          <>
            <Container>
              {nft.restricted && (
                <div className={styles.restricted}>
                  Restricted OBJKT. Contact the Teia moderators on{' '}
                  <a
                    href="https://discord.gg/TKeybhYhNe"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Discord
                  </a>{' '}
                  to resolve the status. See the{' '}
                  <a
                    href="https://github.com/teia-community/teia-docs/wiki/Core-Values-Code-of-Conduct-Terms-and-Conditions#content-moderation"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Teia Terms and Conditions
                  </a>
                  .
                </div>
              )}
              {nft.underReview && (
                <div className={styles.restricted}>
                  OBJKT under review. Contact the Teia moderators on{' '}
                  <a
                    href="https://discord.gg/TKeybhYhNe"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Discord
                  </a>{' '}
                  to resolve the status.
                </div>
              )}
            </Container>
            <div
              style={{
                position: 'relative',
                display: 'block',
                width: '100%',
              }}
              className="objkt-display"
            >
              <div className={objkt_classes}>
                {renderMediaType({
                  nft,
                  interactive: true,
                  displayView: false,
                })}
              </div>
              <div>
                <Container>
                  <ItemInfo nft={nft} />
                </Container>

                <Container>
                  {TABS.map((tab, index) => {
                    // if nft.owners exist and this is a private route, try to hide the tab.
                    // if nft.owners fails, always show route!

                    if (nft?.restricted && tab.restricted) {
                      return null
                    }

                    if (nft?.holdings && tab.private) {
                      let holders_arr = nft.holdings.map(
                        (e) => e.holder_address
                      )

                      if (
                        holders_arr.includes(address) === false &&
                        nft.artist_address !== address &&
                        nft.artist_address !== proxy
                      ) {
                        // user is not the creator now owns a copy of the object. hide

                        return null
                      }
                    }

                    return (
                      <Button
                        key={tab.title}
                        onClick={() => setTabIndex(index)}
                      >
                        <Primary
                          className={styles.tab}
                          selected={tabIndex === index}
                        >
                          {tab.title}
                        </Primary>
                      </Button>
                    )
                  })}
                </Container>

                <Tab nft={nft} viewer_address={address} />
              </div>
            </div>
          </>
        ) : (
          <Container>
            <div>
              <p
                style={{
                  position: 'absolute',
                  left: '46%',
                  top: '45%',
                }}
              >
                {context.message}
              </p>
              {context.progress && <Loading />}
            </div>
          </Container>
        ))}
      <div style={{ height: '40px' }}></div>
    </Page>
  )
}
