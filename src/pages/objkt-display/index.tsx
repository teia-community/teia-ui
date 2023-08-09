/* eslint-disable react-hooks/exhaustive-deps */
import { Outlet, useOutletContext, useParams } from 'react-router-dom'

import {
  METADATA_ACCESSIBILITY_HAZARDS_PHOTOSENS,
  METADATA_CONTENT_RATING_MATURE,
} from '@constants'
import { apiSWR } from '@data/api'
import { Loading } from '@atoms/loading'
import { Page } from '@atoms/layout'
import { RenderMediaType } from '@components/media-types'
import { ItemInfo } from '@components/item-info'
import styles from '@style'
import './style.css'
import useSettings from '@hooks/use-settings'
import type { TabOptions } from '@atoms/tab/Tabs'
import { Tabs } from '@atoms/tab/Tabs'
import { useUserStore } from '@context/userStore'
import type { NFT } from '@types'
import laggy from '@utils/swr-laggy-middleware'
import { useMemo } from 'react'

type ObjktDisplayContext = {
  nft: NFT
  viewer_address: string
}

export const useObjktDisplayContext = () => {
  return useOutletContext<ObjktDisplayContext>()
}

const TABS = [
  {
    title: 'Info',
    to: '',
  },
  {
    title: 'Listings',
    to: 'listings',
  },
  {
    title: 'History',
    to: 'history',
  },
  {
    title: 'Swap',
    to: 'swap',
    private: true,
    restricted: true,
  },
  {
    title: 'Burn',
    to: 'burn',
    private: true,
  },
  {
    title: 'Transfer',
    to: 'transfer',
    private: true,
  },
]

export const ObjktDisplay = () => {
  const { id } = useParams()

  const address = useUserStore((st) => st.address)
  const proxy = useUserStore((st) => st.proxyAddress)

  const { walletBlockMap, nsfwMap, photosensitiveMap, underReviewMap } =
    useSettings()

  const { data, error } = apiSWR.useObjkt(
    ['/token', id],
    { id: id ? id : '-1' },
    {
      revalidateIfStale: false,
      revalidateOnFocus: false,
      use: [laggy],
    }
  )
  const nft = useMemo(() => {
    if (data) {
      const objkt = data.tokens_by_pk as NFT
      if (!objkt && id) {
        const isNum = /^\d+$/.test(id)
        if (isNum) {
          throw new Error(`Cannot find an OBJKT with id: ${id}`, {
            cause: 'Unknown OBJKT',
          })
        }

        throw new Error(
          `Received a non numeric token_id: ${id}.
          This can happen if the requested SUBJKT is conflicting with a protected route.
          You can still access it by its address (tz/<tz-address>)`,
          { cause: 'Conflicting route' }
        )
      }

      if (
        nsfwMap.get(objkt.token_id) === 1 ||
        objkt.teia_meta?.content_rating === METADATA_CONTENT_RATING_MATURE
      ) {
        objkt.isNSFW = true
      }
      if (
        photosensitiveMap.get(objkt.token_id) === 1 ||
        objkt.teia_meta?.accessibility?.hazards.includes(
          METADATA_ACCESSIBILITY_HAZARDS_PHOTOSENS
        )
      ) {
        objkt.isPhotosensitive = true
      }

      objkt.restricted = walletBlockMap.get(objkt.artist_address) === 1
      objkt.underReview = underReviewMap.get(objkt.artist_address) === 1
      objkt.listings = objkt.listings.filter(
        ({ seller_address }: { seller_address: string }) =>
          walletBlockMap.get(seller_address) !== 1
      )

      return objkt
    }
  }, [data?.tokens_by_pk])
  if (!id) return

  if (error) {
    throw error //new Error('Error Fetching OBJKTs for {}')
  }

  if (!nft) {
    return (
      <Page title="loading">
        <Loading message="Loading OBJKT" />
      </Page>
    )
  }

  return (
    <Page className={styles.profile_page} title={nft.name}>
      <>
        {nft.restricted ? (
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
        ) : null}
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
          <div>
            <RenderMediaType nft={nft} displayView />
          </div>
          <ItemInfo nft={nft} />
        </div>
        <Tabs
          tabs={TABS}
          className={styles.profile_tabs}
          filter={(tab: TabOptions) => {
            // if nft.owners exist and this is a private route, try to hide the tab.
            // if nft.owners fails, always show route!
            if (nft?.restricted && tab.restricted) {
              return null
            }

            if (nft?.holdings && tab.private) {
              const holders_arr = nft.holdings.map((e) => e.holder_address)

              if (
                holders_arr.includes(address || 'UNSYNCED') === false &&
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
        <div className={styles.tab_area}>
          <Outlet context={{ nft, viewer_address: address }} />
        </div>
      </>
    </Page>
  )
}
