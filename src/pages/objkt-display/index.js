/* eslint-disable react-hooks/exhaustive-deps */
import React, { useContext, useMemo } from 'react'
import set from 'lodash/set'
import { Route, Routes, useParams } from 'react-router-dom'
import useSWR from 'swr'
import { TeiaContext } from '@context/TeiaContext'
import { MIMETYPE, METADATA_CONTENT_RATING_MATURE, PATH } from '@constants'
import { fetchObjktDetails } from '@data/api'
import { Loading } from '@atoms/loading'
import { Page } from '@atoms/layout'
import { RenderMediaType } from '@components/media-types'
import { ItemInfo } from '@components/item-info'
import { Info, Collectors, Swap, Burn, History, Transfer } from './tabs'
import styles from '@style'
import './style.css'
import useSettings from '@hooks/use-settings'
import { ErrorComponent } from '@atoms/error'
import { Tabs } from '@atoms/tab/Tabs'

export const ObjktDisplay = () => {
  const { id } = useParams()
  const context = useContext(TeiaContext)
  const { walletBlockMap } = useSettings()
  const address = context.acc?.address
  const proxy = context.proxyAddress
  const { nsfwMap, underReviewMap } = useSettings()

  /** @type {{data:import('@types').NFT, error:Error}} */
  const { data: nft, error } = useSWR(
    ['/token', id],
    async () => {
      /** @type {import('@types').NFT}*/
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

  if (loading) {
    return <Page title={nft?.name}>{loading && <Loading />}</Page>
  }
  if (context.progress) {
    return (
      <Page title={nft?.name}>
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
      </Page>
    )
  }
  const shared_props = { nft, viewer_address: address }
  const TABS = [
    {
      title: 'Info',
      to: ``,
      component: <Info {...shared_props} />,
      index: true,
    },
    {
      title: 'Listings',
      to: `/listings`,
      component: <Collectors {...shared_props} />,
    },
    {
      title: 'History',
      to: `/history`,
      component: <History {...shared_props} />,
    },
    {
      title: 'Swap',
      to: `/swap`,
      component: <Swap {...shared_props} />,
      private: true,
      restricted: true,
    },
    {
      title: 'Burn',
      to: `/burn`,
      component: <Burn {...shared_props} />,
      private: true,
    },
    {
      title: 'Transfer',
      to: `/transfer`,
      component: <Transfer {...shared_props} />,
      private: true,
    },
  ]

  return (
    <Page className={styles.profile_page} title={nft?.name}>
      {error && (
        <ErrorComponent title="Error Fetching OBJKTs" message={error} />
      )}
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
      <div
        style={{
          position: 'relative',
          display: 'block',
          width: '100%',
        }}
        className="objkt-display"
      >
        <div className={objkt_classes}>
          <RenderMediaType nft={nft} displayView />
        </div>
        <ItemInfo nft={nft} />
      </div>
      <Tabs
        tabs={TABS.map((t) => ({
          ...t,
          to: `${PATH.OBJKT}/${nft.token_id}${t.to}`,
        }))}
        className={styles.profile_tabs}
        filter={(tab, index) => {
          // if nft.owners exist and this is a private route, try to hide the tab.
          // if nft.owners fails, always show route!

          if (nft?.restricted && tab.restricted) {
            return null
          }

          if (nft?.holdings && tab.private) {
            let holders_arr = nft.holdings.map((e) => e.holder_address)

            if (
              holders_arr.includes(address) === false &&
              nft.artist_address !== address &&
              nft.artist_address !== proxy
            ) {
              // user is not the creator now owns a copy of the object. hide

              return null
            }
          }
          return tab
        }}
      />

      <Routes>
        {TABS.map((tab) => (
          <Route
            key={tab.title}
            index={tab?.index}
            path={tab.to}
            element={tab.component}
          />
        ))}
      </Routes>
    </Page>
  )
}
