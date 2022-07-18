import { useEffect, useState } from 'react'
import InfiniteScroll from 'react-infinite-scroll-component'
import { Button } from '../../button'
import { Container, Padding } from '../../layout'
import { renderMediaType } from '../../media-types'
import { ResponsiveMasonry } from '../../responsive-masonry'
import { PATH } from '../../../constants'
import { fetchGraphQL, getCollabTokensForAddress } from '../../../data/hicdex'
import collabStyles from '../styles.module.scss'
import classNames from 'classnames'

const _ = require('lodash')

function EmptyTab({ children }) {
  return (
    <Container>
      <Padding>
        <h1>{children}</h1>
      </Padding>
    </Container>
  )
}

export const CollabsTab = ({ wallet, onLoaded }) => {
  const chunkSize = 20
  const [objkts, setObjkts] = useState([])
  const [loading, setLoading] = useState(true)
  const [items, setItems] = useState([])
  const [showUnverified, setShowUnverified] = useState(false)
  const [offset, setOffset] = useState(0)

  useEffect(() => {
    setLoading(true)
    fetchGraphQL(getCollabTokensForAddress, 'GetCollabTokens', {
      address: wallet,
    })
      .then(({ errors, data }) => {
        if (errors) {
          console.error(errors)
        }

        let tokens = []
        const result = data.shareholder

        if (result) {
          result.forEach(
            (contract) =>
              (tokens = tokens.concat(contract.split_contract.contract.tokens))
          )
        }
        tokens = _.orderBy(tokens, ['timestamp'], ['desc'])
        setObjkts(tokens)
        setLoading(false)
        onLoaded()
      })
      .catch((err) => {
        console.error(err)
        setLoading(false)
        onLoaded()
      })
  }, [wallet, onLoaded])

  useEffect(() => {
    if (objkts.length === 0) {
      return
    }

    setItems(objkts.slice(0, offset + chunkSize))
  }, [offset, objkts])

  const loadMore = () => {
    setOffset(offset + chunkSize)
  }

  const hasMore = items.length < objkts.length

  const toolbarStyles = classNames(collabStyles.flex, collabStyles.mb2)

  // Only show unverified objkts if the user chooses to see them
  const itemsToShow = showUnverified
    ? items
    : items.filter((item) => item.is_signed)

  const hasUnverifiedObjkts = items.some((i) => !i.is_signed).length > 0

  if (!loading && !objkts.length) {
    return <EmptyTab>No collabs</EmptyTab>
  }

  return (
    <Container xlarge>
      {hasUnverifiedObjkts && (
        <div className={toolbarStyles}>
          <label>
            <input
              type="checkbox"
              onChange={() => setShowUnverified(!showUnverified)}
              checked={showUnverified}
            />
            include unverified OBJKTs
          </label>
        </div>
      )}

      <InfiniteScroll
        dataLength={itemsToShow.length}
        next={loadMore}
        hasMore={hasMore}
        loader={undefined}
        endMessage={undefined}
      >
        <ResponsiveMasonry>
          {itemsToShow.map((nft) => {
            return (
              <Button key={nft.id} to={`${PATH.OBJKT}/${nft.id}`}>
                {renderMediaType({
                  mimeType: nft.mime,
                  artifactUri: nft.artifact_uri,
                  displayUri: nft.display_uri,
                  displayView: true,
                })}
              </Button>
            )
          })}
        </ResponsiveMasonry>
      </InfiniteScroll>
    </Container>
  )
}
