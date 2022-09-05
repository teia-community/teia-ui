/* eslint-disable react-hooks/exhaustive-deps */
import React, { useContext, useEffect, useState } from 'react'
import InfiniteScroll from 'react-infinite-scroll-component'
import { useParams } from 'react-router'
import { Button } from '@components/button'
import { ResponsiveMasonry } from '@components/responsive-masonry'
import { renderMediaType } from '@components/media-types'
import { Page, Container } from '@components/layout'
import { PATH } from '@constants'
import styles from './styles.module.scss'
import { HicetnuncContext } from '@context/HicetnuncContext'

const _ = require('lodash')

async function fetchGraphQL(operationsDoc, operationName, variables) {
  const result = await fetch(process.env.REACT_APP_TEIA_GRAPHQL_API, {
    method: 'POST',
    body: JSON.stringify({
      query: operationsDoc,
      variables: variables,
      operationName: operationName,
    }),
  })
  return await result.json()
}

async function fetchTag(tag, offset) {
  const { data } = await fetchGraphQL(
    `query ObjktsByTag($tag: String = "3d", $lastId: bigint = 99999999) {
    token(where: {token_tags: {tag: {tag: {_eq: ${tag}}}}, id: {_lt: $lastId}, supply: {_gt: "0"}}, order_by: {id: desc}, limit : 35, offset : ${offset}) {
      id
      artifact_uri
      display_uri
      creator_id
      mime
      creator {
        address
        name
      }
    }
  }`,
    'ObjktsByTag',
    {}
  )

  try {
    return data.token
  } catch (e) {
    return undefined
  }
}

export const Tags = () => {
  const context = useContext(HicetnuncContext)
  const { id } = useParams()
  const [feed, setFeed] = useState([])
  const [count, setCount] = useState(0)
  const [hasMore] = useState(true)
  const [offset, setOffset] = useState(0)

  const loadMore = async () => {
    setOffset(offset + 35)
    const arr = await fetchTag(id, offset + 35)
    setFeed(
      _.uniqBy(
        [...feed, ...arr].filter(
          (e) => !context.block_list.includes(e.creator_id)
        ),
        'creator_id'
      )
    )
    setCount(count + 15)
  }

  useEffect(async () => {
    const arr = await fetchTag(id, offset)

    setFeed(
      _.uniqBy(
        arr.filter((e) => !context.block_list.includes(e.creator_id)),
        'creator_id'
      )
    )
  }, [])

  return (
    <Page title={`Tag ${id}`}>
      <div className="tag-view">
        <InfiniteScroll
          dataLength={feed.length}
          next={loadMore}
          hasMore={hasMore}
          loader={undefined}
        >
          <div className={styles.container}>
            <Container xlarge>
              <ResponsiveMasonry>
                {feed.map((nft, index) => {
                  return (
                    <Button
                      key={`${nft.id}-${index}`}
                      to={`${PATH.OBJKT}/${nft.id}`}
                    >
                      <div className={styles.container}>
                        {renderMediaType({
                          nft,
                          displayView: true,
                        })}
                      </div>
                    </Button>
                  )
                })}
              </ResponsiveMasonry>
            </Container>
          </div>
        </InfiniteScroll>
        {/*         <BottomBanner>
                v2 migration: All OBJKTs listed on market before June 28th must be relisted on market due smart contract migration. managed assets > v1 swaps > batch cancel > relist.
        </BottomBanner> */}
      </div>
    </Page>
  )
}
