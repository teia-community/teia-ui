/* eslint-disable react-hooks/exhaustive-deps */
import get from 'lodash/get'
import { type ChangeEvent, useEffect, useState } from 'react'
import { Page } from '@atoms/layout'
import { Input } from '@atoms/input'
import { Button } from '@atoms/button'
import { Identicon } from '@atoms/identicons'
import { fetchGraphQL } from '@data/api'
import { uploadFileToIPFSProxy } from '@data/ipfs'
import { useUserStore } from '@context/userStore'
import { useModalStore } from '@context/modalStore'
import _ from 'lodash'
import styles from '@style'
import { Line } from '@atoms/line'
import { Buffer } from 'buffer'
import { gql } from 'graphql-request'

const query_tz = gql`
  query addressQuery($address: String!) {
    teia_users(where: { user_address: { _eq: $address } }) {
      user_address
      name
      metadata {
        data
      }
    }
  }
`

const query_name_exist = gql`
  query nameExists($name: String!) {
    teia_users(where: { name: { _eq: $name } }) {
      user_address
    }
  }
`

async function fetchTz(address: string) {
  const { errors, data } = await fetchGraphQL(query_tz, 'addressQuery', {
    address,
  })
  if (errors) {
    console.error(errors)
  }

  return get(data, 'teia_users.0', { user_address: address })
}

export const Subjkt = () => {
  const [loading, setLoading] = useState(true)
  // const [address, setAddress] = useState('')
  const [subjkt, setSubjkt] = useState('')
  const [description, setDescription] = useState('')
  const [identicon, setIdenticon] = useState('')
  const [selectedFile, setSelectedFile] = useState<FileList | null>()
  const [preview, setPreview] = useState('')

  const feedback_title = 'Editing Profile'

  const [address, proxyAddress, registry] = useUserStore((st) => [
    st.address,
    st.proxyAddress,
    st.registry,
  ])

  const show = useModalStore((st) => st.show)

  const cur_address = proxyAddress || address
  useEffect(() => {
    const init = async () => {
      if (cur_address) {
        const res = await fetchTz(cur_address)
        console.debug('Subjkt Infos:', res)

        if (res) {
          let { metadata, name } = res

          if (name) setSubjkt(name)

          if (metadata && !_.isEmpty(metadata?.data)) {
            if (metadata?.data?.description)
              setDescription(metadata.data.description)
            if (metadata?.data?.identicon) setIdenticon(metadata.data.identicon)
          }
        }
      }
      setLoading(false)
    }
    init() //.catch((e) => throw new Error(e.message))
  }, [])

  const name_exists = async () => {
    if (!subjkt) return false

    const { errors, data } = await fetchGraphQL(
      query_name_exist,
      'nameExists',
      {
        name: subjkt,
      }
    )
    if (errors) {
      console.error(errors)
      return false
    }

    if (data.teia_users.length === 0) return false

    const holder = data.teia_users[0]

    if (holder.user_address === address || holder.user_address === proxyAddress)
      return false

    console.error(`name exists and is registered to ${holder.user_address}`)

    show(
      'Subjkt',
      `The provided name is already registered by ${holder.user_address}`
    )

    return true
  }

  // upload to profile pic + subjkt meta to IPFS & call the SUBJKT registry
  const subjkt_config = async () => {
    if (await name_exists()) {
      return
    }

    let updated_identicon = identicon

    const show = useModalStore.getState().show
    const step = useModalStore.getState().step

    step(feedback_title, 'uploading SUBJKT')

    if (selectedFile) {
      const [file] = selectedFile

      step(feedback_title, 'uploading identicon')

      const buffer = Buffer.from(await file.arrayBuffer())
      const picture_cid = await uploadFileToIPFSProxy(
        {
          blob: new Blob([buffer]),
          path: file.name,
        },
        feedback_title
      )
      updated_identicon = `ipfs://${picture_cid}`
    }
    const meta = JSON.stringify({
      description,
      identicon: updated_identicon,
    })

    step(feedback_title, 'uploading metadatas')

    console.debug('Uploading metadatas file to IPFS', JSON.parse(meta))

    const subjkt_meta_cid = await uploadFileToIPFSProxy({
      blob: new Blob([Buffer.from(meta)]),
      path: 'profile_metadata.json',
    })

    if (subjkt_meta_cid == null) {
      show(`${feedback_title} (Error)`, 'Error uploading SUBJKT')
      console.error('Error uploading metadatas file to IPFS')
      return
    }
    console.debug('Uploaded metadatas file to IPFS', subjkt_meta_cid)

    step(feedback_title, 'Minting SUBJKT')

    setIdenticon(updated_identicon)

    await registry(subjkt, subjkt_meta_cid)
  }

  // upload file

  const onFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const [file] = event.target.files
      setPreview(URL.createObjectURL(file))
      setSelectedFile(event.target.files)
    }
    // const close = useModalStore.getState().close
    //const file_title = event.target.files[0].name

    // const blob = await file.arrayBuffer()
    // setPreview(file.data.toString('base64'))

    // const picture_cid = await uploadFileToIPFSProxy(
    //   {
    //     blob: new Blob([buffer]),
    //     path: file.name,
    //   },
    //   feedback_title
    // )

    // setIdenticon(`ipfs://${picture_cid}`)
    // close()
  }

  // const unregister = () => context.unregister()

  // const toggle = () => setToggled(!toggled)
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

  // const sign = () => {
  //   context.signStr({
  //     /*       payload : "05" + char2Bytes(this.state.str) */
  //     payload: str
  //       .split('')
  //       .reduce(
  //         (hex, c) => (hex += c.charCodeAt(0).toString(16).padStart(2, '0')),
  //         ''
  //       ),
  //     /*         sourceAddress: this.context.addr,
  //      */
  //   })
  // }

  // delete account

  return (
    !loading && (
      <Page>
        <h1>Subjkt Settings</h1>

        <Line className={styles.title_line} />
        <div className={styles.subjkt_editor}>
          <div className={styles.fields}>
            <Identicon
              className={styles.identicon}
              address={address}
              logo={preview || identicon}
            />
            <input type="file" onChange={onFileChange} title="avatar file" />
          </div>
          <div className={styles.fields}>
            <Input
              name="subjkt"
              value={subjkt}
              onChange={setSubjkt}
              onBlur={(e) => {
                setSubjkt(e.target.value.replace(/[^a-z0-9-._]/g, ''))
              }}
              placeholder="can contain letters (a-z), numbers (0-9), . (dot), - (dash), _ (underscore)"
              label="Username"
              pattern="^[a-z0-9-._]*$"
            />
            <Input
              name="description"
              value={description}
              onChange={setDescription}
              placeholder="(Max length 500 characters)"
              label="Description"
            />
          </div>
        </div>
        <Button shadow_box onClick={subjkt_config}>
          Save Profile
        </Button>
        <div style={{ display: 'inline' }}>
          <p style={{ paddingTop: '7.5px' }}>
            <span>Link your Twitter, Discord, GitHub, and website with </span>
            <span>
              <a
                style={{ fontWeight: 'bold' }}
                target="_blank"
                href="https://tzprofiles.com"
                rel="noreferrer"
              >
                Tezos Profiles
              </a>
            </span>
          </p>
        </div>
      </Page>
    )
  )
}
