/* eslint-disable react-hooks/exhaustive-deps */
import React, { useContext, useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'

import sortBy from 'lodash/sortBy'

import { HicetnuncContext } from '@context/HicetnuncContext'
import { getWalletBlockList, SUPPORTED_MARKETPLACE_CONTRACTS } from '@constants'
import { fetchObjktDetails } from '@data/hicdex'
import { fetchObjktcomAsks } from '@data/objktcom'
import { Loading } from '@components/loading'
import { Button, Primary } from '@components/button'
import { Page, Container, Padding } from '@components/layout'
import { renderMediaType } from '@components/media-types'
import { ItemInfo } from '@components/item-info'
import { Menu } from '@components/menu'
import { Info, Collectors, Swap, Burn, History } from './tabs'
import styles from './styles.module.scss'
import './style.css'
import { Transfer } from '@components/collab/show/Transfer'

const TABS = [
  { title: 'Info', component: Info }, // public tab
  { title: 'Listings', component: Collectors }, // public tab
  { title: 'History', component: History },
  { title: 'Swap', component: Swap, private: true, restricted: true }, // private tab (users only see if they are the creators or own a copy)
  { title: 'Burn', component: Burn, private: true }, // private tab (users only see if they are the creators or own a copy)
  { title: 'Transfer', component: Transfer, private: true }, // private tab (users only see if they are the creators or own a copy)
]

export const ObjktDisplay = () => {
  const { id } = useParams()
  const context = useContext(HicetnuncContext)

  const [loading, setLoading] = useState(true)
  const [tabIndex, setTabIndex] = useState(0)
  const [nft, setNFT] = useState()
  const [error] = useState(false)
  const [restricted, setRestricted] = useState(false)

  const address = context.acc?.address
  const proxy = context.getProxy()

  useEffect(async () => {
    const [objkt, objktcomAsks] = await Promise.all([
      fetchObjktDetails(id),
      fetchObjktcomAsks(id),
    ])

    const listings = sortBy(
      [
        ...objkt.swaps
          .filter(
            (swap) =>
              SUPPORTED_MARKETPLACE_CONTRACTS.includes(swap.contract_address) &&
              parseInt(swap.status) === 0 &&
              swap.is_valid
          )
          .map((swap) => ({
            ...swap,
            token: { id: id, creator_id: objkt.creator.address },
            key: `${swap.contract_address}-${swap.id}`,
            type: 'swap',
          })),
        ...objktcomAsks.map((ask) => ({
          ...ask,
          key: `objktcom_ask_${ask.id}`,
          type: 'objktcom_ask',
        })),
      ],
      ({ price }) => price
    )

    objkt.listings = listings

    await context.setAccount()

    if (getWalletBlockList().includes(objkt.creator.address)) {
      setRestricted(true)
      objkt.restricted = true
      setNFT(objkt)
    } else {
      objkt.ban = getWalletBlockList()
      objkt.restricted = false
      // filter swaps from banned account
      if (objkt.swaps && objkt.ban)
        objkt.swaps = objkt.swaps.filter(
          (s) => s.status > 0 || !objkt.ban.includes(s.creator_id)
        )
      setNFT(objkt)
    }
    setLoading(false)
    /*     GetOBJKT({ id })
      .then(async (objkt) => {
        if (Array.isArray(objkt)) {
          setError(
            "There's a problem loading this OBJKT. Please report it on Github."
          )
          setLoading(false)
        } else {
          await context.setAccount()
          setNFT(objkt)

          setLoading(false)
        }
      })
      .catch((e) => {
        if (e.response && e.response.data.error) {
          setError(
            `(http ${e.response.data.error.http_status}) ${e.response.data.error.message}`
          )
        } else if (e.response && e.response.data) {
          setError(`(http ${e.response.status}) ${e.response.data}`)
        } else if (e.request) {
          setError(
            `There's a problem loading this OBJKT. Please report it on Github. ${e.message}`
          )
        } else {
          setError(
            `There's a problem loading this OBJKT. Please report it on Github. ${e}`
          )
        }
        setLoading(false)
      }) */
  }, [])

  const Tab = TABS[tabIndex].component
  return (
    <Page title={nft?.title}>
      {loading && (
        <Container>
          <Padding>
            <Loading />
          </Padding>
        </Container>
      )}

      {error && (
        <Container>
          <Padding>
            <p>{error}</p>
          </Padding>
          <Padding>
            <Button href="https://github.com/teia-community/teia-ui/issues">
              <Primary>
                <strong>Report</strong>
              </Primary>
            </Button>
          </Padding>
        </Container>
      )}

      {!loading &&
        (!context.progress ? (
          <>
            <Container>
              <Padding>
                {restricted && (
                  <div
                    style={{
                      color: 'white',
                      background: 'black',
                      textAlign: 'center',
                    }}
                  >
                    Restricted OBJKT
                  </div>
                )}
              </Padding>
            </Container>
            <div
              style={{
                position: 'relative',
                display: 'block',
                width: '100%',
              }}
              className="objkt-display"
            >
              <div
                className={
                  nft.mime === 'application/x-directory' ||
                  nft.mime === 'image/svg+xml'
                    ? 'objktview-zipembed objktview ' + styles.objktview
                    : [
                        nft.mime === 'video/mp4' ||
                        nft.mime === 'video/ogv' ||
                        nft.mime === 'video/quicktime' ||
                        nft.mime === 'video/webm' ||
                        nft.mime === 'application/pdf'
                          ? 'no-fullscreen'
                          : 'objktview ' + styles.objktview,
                      ]
                }
              >
                {renderMediaType({
                  mimeType: nft.mime,
                  artifactUri: nft.artifact_uri,
                  displayUri: nft.display_uri,
                  creator: nft.creator,
                  objkt: nft.id,
                  interactive: true,
                  displayView: false,
                })}
              </div>
              <div>
                <Container>
                  <Padding>
                    <ItemInfo {...nft} isDetailView />
                  </Padding>
                </Container>

                <Container>
                  <Padding>
                    <Menu>
                      {TABS.map((tab, index) => {
                        // if nft.owners exist and this is a private route, try to hide the tab.
                        // if nft.owners fails, always show route!

                        if (nft?.restricted && tab.restricted) {
                          return null
                        }

                        if (nft?.token_holders && tab.private) {
                          let holders_arr = nft.token_holders.map(
                            (e) => e.holder_id
                          )

                          if (
                            holders_arr.includes(address) === false &&
                            nft.creator.address !== address &&
                            nft.creator.address !== proxy
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
                            <Primary selected={tabIndex === index}>
                              {tab.title}
                            </Primary>
                          </Button>
                        )
                      })}
                    </Menu>
                  </Padding>
                </Container>

                <Tab {...nft} address={address} />
              </div>
            </div>
          </>
        ) : (
          <Container>
            <Padding>
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
            </Padding>
          </Container>
        ))}
      <div style={{ height: '40px' }}></div>
    </Page>
  )
}
