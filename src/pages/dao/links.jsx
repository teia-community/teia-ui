import React from 'react'
import { walletPreview } from '@utils/string'
import { TOKENS } from '@constants'
import styles from '@style'

export function TeiaUserLink(props) {
  return (
    <a
      href={`/tz/${props.address}`}
      className={props.className ? props.className : ''}
    >
      {props.children}
      {props.alias
        ? props.alias
        : props.shorten
        ? walletPreview(props.address)
        : props.address}
    </a>
  )
}

export function DefaultLink(props) {
  return (
    <a
      href={props.href}
      target="_blank"
      rel="noreferrer"
      className={props.className ? props.className : ''}
    >
      {props.children}
    </a>
  )
}

export function TzktLink(props) {
  return (
    <DefaultLink
      href={`https://tzkt.io/${props.link}`}
      className={props.className ? props.className : ''}
    >
      {props.children}
    </DefaultLink>
  )
}

export function TezosAddressLink(props) {
  return (
    <TzktLink
      link={props.address}
      className={props.className ? props.className : ''}
    >
      {props.children}
      {props.alias
        ? props.alias
        : props.shorten
        ? walletPreview(props.address)
        : props.address}
    </TzktLink>
  )
}

export function TokenLink(props) {
  const token = TOKENS.find((token) => token.fa2 === props.fa2)

  if (token?.website) {
    return (
      <DefaultLink
        href={token.website + props.id}
        className={props.className ? props.className : ''}
      >
        {props.children}
      </DefaultLink>
    )
  } else {
    return (
      <TzktLink
        link={`${props.fa2}/tokens/${props.id}`}
        className={props.className ? props.className : ''}
      >
        {props.children}
      </TzktLink>
    )
  }
}

export function IpfsLink(props) {
  return (
    <DefaultLink
      href={`https://ipfs.io/ipfs/${props.cid}`}
      className={
        styles.ipfs_link + ' ' + (props.className ? props.className : '')
      }
    >
      {props.children ? props.children : props.cid}
    </DefaultLink>
  )
}
