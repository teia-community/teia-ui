import React, { Component } from 'react'
import { Page, Container, Padding } from '@components/layout'
import { HicetnuncContext } from '@context/HicetnuncContext'

import { Input } from '@components/input'
import { FeedItem } from '@components/feed-item'

import { fetchRandomObjkts, getLastObjktId } from '@data/hicdex'
import InfiniteScroll from 'react-infinite-scroll-component'

import './style.css'
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

async function fetchDay(day, offset) {
  const { errors, data } = await fetchGraphQL(
    `query dayTrades {
    trade(where: {timestamp: {_gte: "${day}"}}, order_by: {swap: {price: desc}}, limit : 15, offset : ${offset}) {
      timestamp
      swap {
        price
      }
      token {
        artifact_uri
        display_uri
        id
        mime
        creator {
          name
          address
        }
      }
    }
  }`,
    'dayTrades',
    {}
  )

  if (errors) {
    console.log(errors)
  }

  let result = []

  try {
    result = data.trade
  } catch (e) {}

  return result
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
      }
    }
  }`,
    'sales',
    {}
  )

  if (errors) {
    console.log(errors)
  }

  let result = []

  try {
    result = data.trade
  } catch (e) {}

  return result
}

async function fetchSubjkts(subjkt) {
  //console.log(subjkt)
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

const query_hdao = `query hDAOFeed($offset: Int = 0) {
  token(order_by: {hdao_balance: desc}, limit: 15, where: {hdao_balance: {_gt: 100}}, offset: $offset) {
    artifact_uri
    display_uri
    creator_id
    id
    mime
    thumbnail_uri
    timestamp
    title
    hdao_balance
    creator {
      name
      address
    }
  }
}`

async function fetchHdao(offset) {
  const { errors, data } = await fetchGraphQL(query_hdao, 'hDAOFeed', {
    offset: offset,
  })
  if (errors) {
    console.error(errors)
  }
  const result = data.token
  return result
}

export class Search extends Component {
  static contextType = HicetnuncContext

  state = {
    subjkt: [],
    items: [],
    feed: [],
    search: '',
    prev: '',
    reset: false,
    flag: false,
    lastId: undefined,
    tags: [
      { id: 11, value: '🇺🇦 ukraine' },
      { id: 12, value: 'tezospride' },
      { id: 0, value: '○ hDAO' },
      { id: 1, value: 'random' },
      { id: 2, value: 'glb' },
      { id: 3, value: 'music' },
      { id: 12, value: 'video' },
      { id: 4, value: 'html/svg' }, // algorithimc?
      { id: 5, value: 'gif' },
      { id: 6, value: 'new OBJKTs' },
      { id: 7, value: 'recent sales' },
      { id: 8, value: '1D' },
      { id: 9, value: '1W' },
      { id: 10, value: '1M' },
    ],
    select: [],
    mouse: false,
    hasMore: true,
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
    //this.latest(999999)
  }

  handleChange = (e) => {
    this.setState({ [e.target.name]: e.target.value })

    //if (this.state.search.length >= 1) this.search()
  }

  update = async (e, reset) => {
    let arr = getWalletBlockList()

    this.setState({ select: e })
    if (reset) {
      this.setState({
        feed: [],
        offset: 0,
        lastId: await getLastObjktId(),
      })
    }

    if (e === '1D') {
      let list = await fetchDay(
        new Date(new Date().getTime() - 60 * 60 * 24 * 1000).toISOString(),
        this.state.offset
      )
      list = list.map((e) => e.token)
      list = [...this.state.feed, ...list]
      list = list.filter((e) => !arr.includes(e.creator.address))
      list = _.uniqBy(list, 'id')

      this.setState({
        feed: list,
      })
    }

    if (e === '1W') {
      let list = await fetchDay(
        new Date(new Date().getTime() - 60 * 60 * 24 * 7 * 1000).toISOString(),
        this.state.offset
      )
      list = list.map((e) => e.token)
      list = [...this.state.feed, ...list]
      list = list.filter((e) => !arr.includes(e.creator.address))

      list = _.uniqBy(list, 'id')

      this.setState({
        feed: list,
      })
    }

    if (e === '1M') {
      let list = await fetchDay(
        new Date(new Date().getTime() - 60 * 60 * 24 * 30 * 1000).toISOString(),
        this.state.offset
      )
      list = list.map((e) => e.token)
      list = [...this.state.feed, ...list]
      list = list.filter((e) => !arr.includes(e.creator.address))

      list = _.uniqBy(list, 'id')

      this.setState({
        feed: list,
      })
    }

    if (e === 'num') {
      let res = await fetchFeed(
        Number(this.state.search) + 1 - this.state.offset
      )
      res = res.filter((e) => !arr.includes(e.creator_id))
      this.setState({
        feed: [...this.state.feed, ...res],
      })
    }

    if (e === '○ hDAO') {
      this.setState({
        feed: _.uniqBy(
          _.uniqBy(
            [...this.state.feed, ...(await fetchHdao(this.state.offset))],
            'id'
          ),
          'creator_id'
        ),
        hdao: true,
      })
    }

    if (e === 'music') {
      this.setState({
        feed: _.uniqBy(
          [...this.state.feed, ...(await fetchMusic(this.state.offset))],
          'creator_id'
        ),
      })
    }

    if (e === 'video') {
      this.setState({
        feed: _.uniqBy(
          [...this.state.feed, ...(await fetchVideo(this.state.offset))],
          'creator_id'
        ),
      })
    }

    if (e === 'glb') {
      this.setState({
        feed: _.uniqBy(
          [...this.state.feed, ...(await fetchGLB(this.state.offset))],
          'creator_id'
        ),
      })
    }

    if (e === 'tezospride') {
      let res = await fetchTag('tezospride', this.state.offset)
      res = res.filter((e) => !arr.includes(e.creator_id))
      this.setState({
        feed: _.uniqBy([...this.state.feed, ...res], 'creator_id'),
      })
    }

    if (e === 'html/svg') {
      let res = await fetchInteractive(this.state.offset)
      res = res.filter((e) => !arr.includes(e.creator_id))
      this.setState({
        feed: _.uniqBy([...this.state.feed, ...res], 'creator_id'),
      })
    }

    if (e === '🇺🇦 ukraine') {
      let ukr = await getObjktsByShare(
        ['KT1DWnLiUkNtAQDErXxudFEH63JC6mqg3HEx'],
        '50'
      )

      this.setState({
        feed: ukr,
      })
    }
    if (e === 'random') {
      let res = await fetchRandomObjkts(15)
      res = res.filter((e) => !arr.includes(e.creator_id))
      this.setState({ feed: [...this.state.feed, ...res] })
    }

    if (e === 'gif') {
      this.setState({
        feed: _.uniqBy(
          [...this.state.feed, ...(await fetchGifs(this.state.offset))],
          'creator_id'
        ),
      })
    }

    if (e === 'illustration') {
      console.log(await fetchTag('illustration'))
    }

    if (e === 'tag') {
      let res = await fetchTag(
        this.state.search,
        this.state.feed[this.state.feed.length - 1].id
      )
      res = res.filter((e) => !arr.includes(e.creator_id))
      this.setState({
        feed: _.uniqBy([...this.state.feed, ...res], 'creator_id'),
      })
    }

    if (e === 'recent sales') {
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

    if (e === 'new OBJKTs') {
      let tokens = await fetchFeed(this.state.lastId, this.state.offset)
      tokens = tokens.filter((e) => !arr.includes(e.creator_id))
      this.setState({
        feed: _.uniqBy(
          _.uniqBy([...this.state.feed, ...tokens], 'id'),
          'creator_id'
        ),
      })
    }

    // new listings

    this.setState({ reset: false })
  }

  search = async (e) => {
    console.log(e)

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

    console.log(this.state.feed)
  }

  hoverState = (bool) => this.setState({ mouse: bool })

  select = (id) => this.setState({ select: [...this.state.select, id] })

  loadMore = () => {
    this.setState({ offset: this.state.offset + 15 })
    this.update(this.state.select, false)
  }

  handleKey = (e) => {
    console.log(this.state.search)
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
                onChange={this.handleChange}
                label="Search ↵"
                placeholder="Search ↵"
                onKeyPress={this.handleKey}
              />
              {
                <div style={{ marginTop: '15px' }}>
                  {this.state.tags.map((e) => (
                    // eslint-disable-next-line jsx-a11y/anchor-is-valid
                    <a
                      key={e.value}
                      className="tag"
                      href="#"
                      onClick={() => {
                        this.update(e.value, true)
                      }}
                    >
                      {e.value}{' '}
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
            {this.state.feed.length > 0 ? (
              <InfiniteScroll
                dataLength={this.state.feed.length}
                next={this.loadMore}
                hasMore={this.state.hasMore}
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
