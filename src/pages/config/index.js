/* eslint-disable */
import get from 'lodash/get'
import React, { Component } from 'react'
import { HicetnuncContext } from '@context/HicetnuncContext'
import { Container, Padding, Page } from '@components/layout'
import { Input } from '@components/input'
import { Button, Purchase } from '@components/button'
import { Identicon } from '@components/identicons'
import { fetchGraphQL } from '@data/api'
import { uploadFileToIPFSProxy } from '@data/ipfs'

const ls = require('local-storage')

const query_tz = `
query addressQuery($address: String!) {
  teia_users(where: { user_address: {_eq: $address}}) {
    user_address
    name
    metadata {
      data
    }
  }
}
`

const query_name_exist = `
query nameExists($name: String!) {
  teia_users(where: { name: {_eq: $name}}) {
    user_address
  }
}
`

async function fetchTz(address) {
  const { errors, data } = await fetchGraphQL(query_tz, 'addressQuery', {
    address,
  })
  if (errors) {
    console.error(errors)
  }

  return get(data, 'teia_users.0', { user_address: address })
}

export class Config extends Component {
  static contextType = HicetnuncContext

  state = {
    loading: true,
    vote: 0,
    address: '',
    subjkt: '',
    description: '',
    social_media: '',
    identicon: '',
    subjktUri: '', // uploads image
    cid: undefined,
    selectedFile: undefined,
    toogled: false,
  }

  componentDidMount = async () => {
    await this.context.syncTaquito()

    const { acc, proxyAddress } = this.context

    // Maybe use proxy address here
    const address = proxyAddress || acc.address

    this.setState({ address })
    const res = await fetchTz(address)

    this.context.subjktInfo = res
    console.debug('Subjkt Infos:', this.context.subjktInfo)

    if (this.context.subjktInfo) {
      let { metadata, name } = this.context.subjktInfo

      if (name) this.setState({ subjkt: name })

      // FOR V6
      if (metadata && !_.isEmpty(get(metadata, 'data'))) {
        if (get(metadata, 'data.description'))
          this.setState({ description: get(metadata, 'data.description') })
        if (get(metadata, 'data.identicon'))
          this.setState({ identicon: get(metadata, 'data.identicon') })
      }
      // FALLBACK FOR V5
      /*
      TODO: is this still needed after teztok migration?
      else if (metadata_file) {
        const metadata_uri = HashToURL(metadata_file)
        metadata = await axios
          .get(metadata_uri)
          .then((res) => res.data)
          .catch((err) => {
            console.error(err)
          })

        if (metadata.description)
          this.setState({ description: metadata.description })
        if (metadata.identicon) this.setState({ identicon: metadata.identicon })
      }
      */
    }
    this.setState({ loading: false })
  }

  handleChange = (e) => {
    if (e.target.name == 'subjkt' && !e.target.checkValidity()) {
      console.debug(e.target.pattern)
      e.target.value = e.target.value.replace(/[^a-z0-9-._]/g, '')
    }
    console.debug('set', e.target.name, 'to', e.target.value)
    this.setState({ [e.target.name]: e.target.value })
  }

  name_exists = async () => {
    if (!this.state.subjkt) return false

    const { errors, data } = await fetchGraphQL(
      query_name_exist,
      'nameExists',
      {
        name: this.state.subjkt,
      }
    )
    if (errors) {
      console.error(errors)
      return false
    }

    if (data.teia_users.length === 0) return false

    const holder = data.teia_users[0]

    if (holder.user_address == this.state.address) return false

    console.error(`name exists and is registered to ${holder.user_address}`)

    this.context.setFeedback({
      visible: true,
      message: `The provided name is already registered by ${holder.user_address}`,
      progress: false,
      confirm: true,
      confirmCallback: () => {
        this.context.setFeedback({ visible: false })
      },
    })

    return true
  }

  // upload to profile pic + subjkt meta to IPFS & call the SUBJKT registry
  subjkt_config = async () => {
    if (await this.name_exists()) {
      return
    }

    this.context.setFeedback({
      visible: true,
      message: 'uploading SUBJKT',
      progress: true,
      confirm: false,
    })

    if (this.state.selectedFile) {
      const [file] = this.state.selectedFile

      this.context.setFeedback({
        message: 'uploading indenticon',
      })

      const buffer = Buffer.from(await file.arrayBuffer())
      const picture_cid = await uploadFileToIPFSProxy({
        blob: new Blob([buffer]),
        path: file.name,
      })
      this.setState({ identicon: `ipfs://${picture_cid}` })
    }
    const meta = JSON.stringify({
      description: this.state.description,
      identicon: this.state.identicon,
    })
    this.context.setFeedback({
      message: 'uploading metadatas',
    })

    console.debug('Uploading metadatas file to IPFS', JSON.parse(meta))

    const subjkt_meta_cid = await uploadFileToIPFSProxy({
      blob: new Blob([Buffer.from(meta)]),
      path: 'profile_metadata.json',
    })

    if (subjkt_meta_cid == null) {
      this.context.setFeedback({
        confirm: true,
        message: 'Error uploading metadatas',
        confirmCallback: () => {
          this.context.setFeedback({ visible: false })
        },
      })
      console.error('Error uploading metadatas file to IPFS')
      return
    }
    console.debug('Uploaded metadatas file to IPFS', subjkt_meta_cid)

    this.context.setFeedback({
      message: 'minting SUBJKT',
      progress: true,
      confirm: false,
    })

    await this.context.registry(this.state.subjkt, subjkt_meta_cid)

    this.context.setFeedback({
      message: 'SUBJKT Minted',
      progress: false,
      confirm: true,
      confirmCallback: () => {
        this.context.setFeedback({ visible: false })
      },
    })
  }

  // upload file

  onFileChange = async (event) => {
    this.setState({
      selectedFile: event.target.files,
      fileTitle: event.target.files[0].name,
    })

    const [file] = event.target.files

    const buffer = Buffer.from(await file.arrayBuffer())
    const picture_cid = await uploadFileToIPFSProxy({
      blob: new Blob([buffer]),
      path: file.name,
    })
    this.setState({ identicon: `ipfs://${picture_cid}` })
  }

  hDAO_operators = () => {
    this.context.hDAO_update_operators(this.context.acc.address)
  }

  unregister = () => this.context.unregister()

  hDAO_config = () => {
    // convert float to 10^6
    ls.set('hDAO_config', this.state.vote)
  }

  toggle = () => this.setState({ toogled: !this.state.toogled })
  /*

   signature studies

   const bytes =
         '05' +
         char2Bytes(
           JSON.stringify({
             alias: this.state.alias,
             description: this.state.description,
           })
         )
       console.log(bytes)
       const payload = {
         signingType: SigningType.MICHELINE,
         payload: bytes,
         sourceAddress: this.context.addr,
       }
       console.log(payload)
       this.context.sign(payload)

  */

  sign = () => {
    this.context.signStr({
      /*       payload : "05" + char2Bytes(this.state.str) */
      payload: this.state.str
        .split('')
        .reduce(
          (hex, c) => (hex += c.charCodeAt(0).toString(16).padStart(2, '0')),
          ''
        ),
      /*         sourceAddress: this.context.addr,
       */
    })
  }

  // delete account

  render() {
    return (
      !this.state.loading && (
        <Page large={this.context.banner != null}>
          <Container>
            <Identicon
              address={this.state.address}
              logo={this.state.identicon}
            />
            <input
              type="file"
              onChange={this.onFileChange}
              title="avatar file"
            />
            <Padding>
              <Input
                name="subjkt"
                value={this.state.subjkt}
                onChange={this.handleChange}
                placeholder="can contain letters (a-z), numbers (0-9), . (dot), - (dash), _ (underscore)"
                label="Username"
                pattern="^[a-z0-9-._]*$"
              />
              <Input
                name="description"
                onChange={this.handleChange}
                placeholder="(Max length 500 characters)"
                label="Description"
                value={this.state.description}
              />
              <Button onClick={this.subjkt_config}>
                <Purchase>Save Profile</Purchase>
              </Button>
            </Padding>
            <div style={{ display: 'inline' }}>
              <p style={{ paddingTop: '7.5px' }}>
                <span>
                  Link your Twitter, Discord, GitHub, and website with{' '}
                </span>
                <span>
                  <a
                    style={{ fontWeight: 'bold' }}
                    target="_blank"
                    href="https://tzprofiles.com"
                  >
                    Tezos Profiles
                  </a>
                </span>
              </p>
            </div>
          </Container>
          {/*         <BottomBanner>
          The dApp has been temporarily disabled for a contract migration. Follow <a href="https://twitter.com/hicetnunc2000" target="_blank">@hicetnunc2000</a> or <a href="https://discord.gg/jKNy6PynPK" target="_blank">join the discord</a> for updates.
        </BottomBanner> */}
        </Page>
      )
    )
  }
}
