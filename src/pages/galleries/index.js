import { useEffect, useState } from 'react'
import { Button, Primary } from '@components/button'
import { Page, Container, Padding } from '@components/layout'
import { renderMediaType } from '@components/media-types'
import { PATH } from '@constants'
import { ResponsiveMasonry } from '@components/responsive-masonry'
import styles from './styles.module.scss'
import { fetchObjkts } from '@data/hicdex'
const _ = require('lodash')

export const Galleries = () => {
  const [data, setData] = useState([])

  useEffect(() => {
    // loads gallery to check endpoint file
    fetch('/galleries/galleries.json')
      .then((e) => e.json())
      .then(async (galleries) => {
        console.log(galleries)
        let res = await fetchObjkts(galleries.map((e) => e.id))

        let merged = _.merge(
          _.keyBy(galleries, 'id'),
          _.merge(_.keyBy(res, 'id'))
        )

        let values = _.values(merged)

        setData(values.reverse())
      })

    return () => {
      document.body.style = {}
    }
  }, [])

  return (
    <Page title="Galleries">
      <Container xlarge>
        <Padding>
          <ResponsiveMasonry>
            {data.map((nft) => {
              return (
                <Button key={nft.id} to={`${PATH.GALLERY}/${nft.id}`}>
                  <div className={styles.item}>
                    {renderMediaType({
                      nft,
                      interactive: false,
                      displayView: true,
                    })}
                    <Button>
                      <Primary>
                        <div className={styles.number}>{nft.name}</div>
                      </Primary>
                    </Button>
                  </div>
                </Button>
              )
            })}
          </ResponsiveMasonry>
        </Padding>
      </Container>
      {/*       <BottomBanner>
        Collecting has been temporarily disabled. Follow <a href="https://twitter.com/hicetnunc2000" target="_blank">@hicetnunc2000</a> or <a href="https://discord.gg/jKNy6PynPK" target="_blank">join the discord</a> for updates.
      </BottomBanner> */}
    </Page>
  )
}
