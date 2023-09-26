import React from 'react'
import { TOKENS } from '@constants'
import styles from '@style'

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
      href={`https://tzkt.io/${props.address}`}
      className={props.className ? props.className : ''}
    >
      {props.children}
    </DefaultLink>
  )
}

export function TezosAddressLink(props) {
  return (
    <TzktLink
      address={props.address}
      className={
        styles.tezos_address + ' ' + (props.className ? props.className : '')
      }
    >
      {props.children}
      {props.shorten
        ? props.address.slice(0, 5) + '...' + props.address.slice(-5)
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
        className={
          styles.token_link + ' ' + (props.className ? props.className : '')
        }
      >
        {props.children}
      </DefaultLink>
    )
  } else {
    return (
      <TzktLink
        address={props.fa2}
        className={
          styles.token_link + ' ' + (props.className ? props.className : '')
        }
      >
        {props.children}
      </TzktLink>
    )
  }
}

export function IpfsLink(props) {
  return (
    <DefaultLink
      href={`https://ipfs.io/ipfs/${props.path}`}
      className={
        styles.ipfs_link + ' ' + (props.className ? props.className : '')
      }
    >
      {props.children ? props.children : props.path}
    </DefaultLink>
  )
}
