import React, { Component } from 'react'
import { Page, Container, Padding } from '@components/layout'
import { HicetnuncContext } from '@context/HicetnuncContext'

import { Input } from '@components/input'
import { FeedItem } from '@components/feed-item'

import { fetchRandomObjkts, getLastObjktId } from '@data/hicdex'
import InfiniteScroll from 'react-infinite-scroll-component'

import styles from './styles.module.scss'

import { getWalletBlockList } from '@constants'
import { getObjktsByShare } from '@data/hicdex'
import { IconCache } from '@utils/with-icon'
const _ = require('lodash')

async function fetchFeed(lastId, offset) {
  const { errors, data } = await fetchGraphQL(
    `
query LatestFeed {
  token(order_by: {id: desc}, limit: 15, offset : ${offset},where: {id: {_lt: ${lastId}}, artifact_uri: {_neq: ""}}) {
    artifact_uri
    display_uri
    creator_id
    id
    mime
    thumbnail_uri
    timestamp
    title
    creator {
      name
      address
    }
    content_rating
  }
}`,
    'LatestFeed',
    {}
  )
  if (errors) {
    console.error(errors)
  }
  const result = data.token
  return result
}

async function fetchGLB(offset) {
  const { data } = await fetchGraphQL(
    `
  query GLBObjkts {
    token(where : { mime : {_in : ["model/gltf-binary"] }, supply : { _neq : 0 }}, limit : 15, offset : ${offset}, order_by: {id: desc}) {
      id
      artifact_uri
      display_uri
      mime
      creator_id
      creator {
        address
        name
      }
      content_rating
      title
    }
  }
  `,
    'GLBObjkts',
    {}
  )
  try {
    return data.token
  } catch (e) {
    return undefined
  }
}

async function fetchInteractive(offset) {
  const { data } = await fetchGraphQL(
    `
    query InteractiveObjkts {
      token(where: { mime: {_in : [ "application/x-directory", "image/svg+xml" ]}, supply : { _neq : 0 } }, limit : 30, offset : ${offset}, order_by: {id: desc}) {
        id
        artifact_uri
        display_uri
        mime
        creator_id
        creator {
          name
          address
        }
        content_rating
        title
      }
    }
  `,
    'InteractiveObjkts',
    {}
  )

  try {
    return data.token
  } catch (e) {
    return undefined
  }
}
async function fetchVideo(offset) {
  const { data } = await fetchGraphQL(
    `
  query Videos {
    token(where : { mime : {_in : ["video/mp4"] }, supply : { _neq : 0 }}, limit : 15, offset : ${offset}, order_by: {id: desc}) {
      id
      artifact_uri
      display_uri
      mime
      creator_id
      creator {
        address
        name
      }
      content_rating
      title
    }
  }
  `,
    'Videos',
    {}
  )
  try {
    return data.token
  } catch (e) {
    return undefined
  }
}
async function fetchGifs(offset) {
  const { data } = await fetchGraphQL(
    `
    query Gifs ($offset: Int = 0) {
      token(where: { mime: {_in : [ "image/gif" ]}, supply : { _neq : 0 }}, order_by: {id: desc}, limit: 15, offset: ${offset}) {
        id
        artifact_uri
        display_uri
        mime
        creator_id
        creator {
          name
          address
        }
        content_rating
        title
      }
    }
  `,
    'Gifs',
    {}
  )

  try {
    return data.token
  } catch (e) {
    return undefined
  }
}

async function fetchMusic(offset) {
  const { data } = await fetchGraphQL(
    `
  query AudioObjkts {
    token(where: {mime: {_in: ["audio/ogg", "audio/wav", "audio/mpeg"]}, supply : { _neq : 0 }}, limit : 15, offset : ${offset}, order_by: {id: desc}) {
      id
      artifact_uri
      display_uri
      mime
      creator_id
      creator {
        address
        name
      }
      content_rating
      title
    }
  }
  `,
    'AudioObjkts',
    {}
  )

  try {
    return data.token
  } catch (e) {
    return undefined
  }
}

async function fetchSales(offset) {
  const { errors, data } = await fetchGraphQL(
    `
  query sales {
    trade(order_by: {timestamp: desc}, limit : 15, offset : ${offset}, where: {swap: {price: {_gte: "0"}}}) {
      timestamp
      swap {
        price
      }
      token {
        artifact_uri
        display_uri
        id
        mime
        creator_id
        creator {
          name
          address
        }
        content_rating
        title
      }
    }
  }`,
    'sales',
    {}
  )

  if (errors) {
    console.error(errors)
  }

  let result = []

  try {
    result = data.trade
  } catch (e) {}

  return result
}

async function fetchSubjkts(subjkt) {
  const { errors, data } = await fetchGraphQL(
    `
  query subjktsQuery {
    holder(where: { name: {_ilike: "%${subjkt}%"}}, order_by: {hdao_balance: desc}) {
      address
      name
      hdao_balance
      metadata
    }
  }
  `,
    'subjktsQuery',
    {}
  )
  if (errors) {
    console.error(errors)
  }

  let result = []

  try {
    result = data.holder
  } catch (e) {}

  return result
}

async function fetchTag(tag, offset) {
  const { errors, data } = await fetchGraphQL(
    `query ObjktsByTag {
  token(where: {token_tags: {tag: {tag: {_eq: "${tag}"}}}, supply: {_neq: "0"}}, offset: ${offset}, limit: 15, order_by: {id: desc}) {
    id
    artifact_uri
    display_uri
    mime
    creator_id
    token_tags {
      tag {
        tag
      }
    }
    creator {
      address
      name
    }
    content_rating
    title
  }
}`,
    'ObjktsByTag',
    {}
  )
  if (errors) {
    console.error(errors)
  }
  const result = data.token
  return result
}

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

export class Search extends Component {
  static contextType = HicetnuncContext

  state = {
    subjkt: [],
    items: [],
    feed: [],
    search: '',
    current: '',
    reset: false,
    flag: false,
    lastId: undefined,
    tags: [
      {
        id: 10,
        value: 'pakistan',
        label: '🇵🇰 pakistan',
        aria: 'Pakistan Fund Feed',
      },
      {
        id: 11,
        value: 'ukraine',
        label: '🇺🇦 ukraine',
        aria: 'Ukraine Fund Feed',
      },
      {
        id: 12,
        value: 'tezos-pride',
        label: '🏳️‍🌈 tezospride',
        aria: 'Tezos Pride Feed',
      },
      { id: 6, value: 'new', label: 'new OBJKTs' },
      { id: 7, value: 'recent-sales', label: 'recent sales' },
      { id: 1, value: 'random' },
      { id: 2, value: 'glb', aria: 'GLB Models' },
      { id: 3, value: 'music' },
      { id: 12, value: 'video' },
      { id: 4, value: 'html/svg', label: 'HTML & SVG' }, // algorithimc?
      { id: 5, value: 'gif' },
    ],
    select: [],
    mouse: false,
    offset: 0,
  }

  componentWillMount = async () => {
    let arr = getWalletBlockList()
    this.setState({ select: 'recent sales' })
    let tokens = await fetchSales(this.state.offset)
    tokens = tokens.map((e) => e.token)
    tokens = tokens.filter((e) => !arr.includes(e.creator_id))
    this.setState({
      feed: _.uniqBy(
        _.uniqBy([...this.state.feed, ...tokens], 'id'),
        'creator_id'
      ),
    })
  }
  componentDidMount = () => {
    window.twemoji.parse(
      document.body,
      { folder: 'svg', ext: '.svg' } // This is to specify to Twemoji to use SVGs and not PNGs
    )
  }
  handleChange = (e) => {
    this.setState({ [e.target.name]: e.target.value })

    //if (this.state.search.length >= 1) this.search()
  }

  update = async (e, reset) => {
    const arr = getWalletBlockList()
    const banFilter = (nfts) => !arr.includes(nfts.creator_id)
    this.setState({ select: 0, current: e })
    if (reset) {
      this.setState({
        feed: [],
        offset: 0,
        lastId: await getLastObjktId(),
      })
    }
    switch (e) {
      case 'num': {
        let res = await fetchFeed(
          Number(this.state.search) + 1 - this.state.offset
        )
        res = res.filter(banFilter)
        this.setState({
          feed: [...this.state.feed, ...res],
        })
        break
      }
      case 'video': {
        this.setState({
          feed: _.uniqBy(
            [...this.state.feed, ...(await fetchVideo(this.state.offset))],
            'creator_id'
          ).filter(banFilter),
        })
        break
      }

      case 'glb': {
        this.setState({
          feed: _.uniqBy(
            [...this.state.feed, ...(await fetchGLB(this.state.offset))],
            'creator_id'
          ).filter(banFilter),
        })
        break
      }

      case 'music': {
        this.setState({
          feed: _.uniqBy(
            [...this.state.feed, ...(await fetchMusic(this.state.offset))],
            'creator_id'
          ).filter(banFilter),
        })
        break
      }
      case 'html/svg': {
        let res = await fetchInteractive(this.state.offset)
        res = res.filter(banFilter)
        this.setState({
          feed: _.uniqBy([...this.state.feed, ...res], 'creator_id').filter(
            banFilter
          ),
        })
        break
      }
      case 'random': {
        let res = await fetchRandomObjkts(15)
        res = res.filter(banFilter)
        this.setState({ feed: [...this.state.feed, ...res] })
        break
      }

      case 'gif': {
        this.setState({
          feed: _.uniqBy(
            [...this.state.feed, ...(await fetchGifs(this.state.offset))],
            'creator_id'
          ).filter(banFilter),
        })
        break
      }
      case 'ukraine': {
        const ukr = await getObjktsByShare(
          ['KT1DWnLiUkNtAQDErXxudFEH63JC6mqg3HEx'],
          '50'
        )

        this.setState({
          feed: ukr.filter(banFilter),
        })
        break
      }
      case 'pakistan': {
        const pak = await getObjktsByShare(
          ['KT1Jpf2TAcZS7QfBraQMBeCxjFhH6kAdDL4z'],
          '50'
        )

        this.setState({
          feed: pak.filter(banFilter),
        })
        break
      }
      case 'tezos-pride': {
        let res = await fetchTag('tezospride', this.state.offset)
        res = res.filter(banFilter)
        this.setState({
          feed: _.uniqBy([...this.state.feed, ...res], 'creator_id'),
        })
        break
      }
      case 'new': {
        let tokens = await fetchFeed(this.state.lastId, this.state.offset)
        tokens = tokens.filter(banFilter)
        this.setState({
          feed: _.uniqBy(
            _.uniqBy([...this.state.feed, ...tokens], 'id'),
            'creator_id'
          ),
        })
        break
      }
      case 'recent-sales': {
        let tokens = await fetchSales(this.state.offset)
        tokens = tokens.map((e) => e.token)
        tokens = tokens.filter(banFilter)
        this.setState({
          feed: _.uniqBy(
            _.uniqBy([...this.state.feed, ...tokens], 'id'),
            'creator_id'
          ),
        })
        break
      }
      default:
        break
    }

    // TODO: Remove? Not used at least.
    if (e === 'tag') {
      let res = await fetchTag(
        this.state.search,
        this.state.feed[this.state.feed.length - 1].id
      )
      res = res.filter(banFilter)
      this.setState({
        feed: _.uniqBy([...this.state.feed, ...res], 'creator_id'),
      })
    }

    this.setState({ reset: false })
  }

  search = async (e) => {
    this.setState({ items: [], feed: [], search: e })
    this.setState({ subjkt: await fetchSubjkts(this.state.search) })

    if (!isNaN(this.state.search)) {
      this.setState({
        feed: await fetchFeed(Number(this.state.search) + 1),
        select: 'num',
      })
    } else {
      this.setState({
        feed: _.uniqBy(
          await fetchTag(this.state.search.toLowerCase(), 9999999),
          'creator_id'
        ),
        select: 'tag',
      })
    }
  }

  hoverState = (bool) => this.setState({ mouse: bool })

  select = (id) => this.setState({ select: [...this.state.select, id] })

  loadMore = () => {
    this.setState({ offset: this.state.offset + 30 })
    this.update(this.state.select, false)
  }

  handleKey = (e) => {
    console.debug('Searching for', this.state.search)
    if (e.key === 'Enter') this.search(this.state.search)
  }

  render() {
    return (
      <Page>
        <IconCache.Provider value={{}}>
          <Container>
            <Padding>
              <Input
                type="text"
                name="search"
                value={this.state.search}
                onChange={this.handleChange}
                label=""
                placeholder="Search ↵"
                onKeyPress={this.handleKey}
              />
              {
                <div style={{ marginTop: '15px' }}>
                  {this.state.tags.map((e) => (
                    // eslint-disable-next-line jsx-a11y/anchor-is-valid
                    <a
                      key={e.value}
                      className={styles.tag}
                      href="#"
                      onClick={() => {
                        this.update(e.value, true)
                      }}
                      aria-label={e.aria || e.label || e.value}
                    >
                      {e.label || e.value}{' '}
                    </a>
                  ))}
                </div>
              }
              {this.state.subjkt.length > 0 && this.state.search !== '' ? (
                <div style={{ maxHeight: '200px', overflow: 'scroll' }}>
                  {this.state.subjkt.map((e) => (
                    <div style={{ marginTop: '10px' }}>
                      <a href={`/${e.name}`}>{e.name}</a>{' '}
                      {e.metadata.description}
                    </div>
                  ))}
                </div>
              ) : undefined}
            </Padding>
          </Container>
          <Container xlarge>
            {this.state.current === 'pakistan' && (
              <div className={styles.feed_info}>
                <p>
                  This feed shows OBJKTs minted with the Pakistan donation
                  adress as beneficiary of at least 50% of sales volume
                </p>

                <a
                  href="https://github.com/teia-community/teia-docs/wiki/Pakistan-Fundraiser"
                  target="_blank"
                  rel="noreferrer"
                >
                  <strong>(more info here)</strong>
                </a>
              </div>
            )}
            {this.state.feed.length > 0 ? (
              <InfiniteScroll
                dataLength={this.state.feed.length}
                next={this.loadMore}
                hasMore={true}
                loader={undefined}
                endMessage={undefined}
              >
                <Container>
                  <Padding>
                    {this.state.feed.map((item, index) => (
                      <div key={`${item.id}-${index}`}>
                        <FeedItem {...item} />
                      </div>
                    ))}
                  </Padding>
                </Container>
              </InfiniteScroll>
            ) : undefined}
          </Container>
        </IconCache.Provider>
      </Page>
    )
  }
}
