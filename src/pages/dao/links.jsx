import React from 'react'
import { walletPreview } from '@utils/string'
import { TOKENS } from '@constants'
import styles from '@style'

export function TeiaUserLink({ address, alias, shorten, className, children }) {
  return (
    <a href={`/tz/${address}`} className={className ? className : ''}>
      {children}
      {alias ? alias : shorten ? walletPreview(address) : address}
    </a>
  )
}

export function DefaultLink({ href, className, children }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className={className ? className : ''}
    >
      {children}
    </a>
  )
}

export function TzktLink({ link, className, children }) {
  return (
    <DefaultLink
      href={`https://tzkt.io/${link}`}
      className={className ? className : ''}
    >
      {children}
    </DefaultLink>
  )
}

export function TezosAddressLink({
  address,
  alias,
  shorten,
  className,
  children,
}) {
  return (
    <TzktLink link={address} className={className ? className : ''}>
      {children}
      {alias ? alias : shorten ? walletPreview(address) : address}
    </TzktLink>
  )
}

export function TokenLink({ fa2, id, className, children }) {
  const token = TOKENS.find((token) => token.fa2 === fa2)

  if (token?.website) {
    return (
      <DefaultLink
        href={token.website + id}
        className={className ? className : ''}
      >
        {children}
      </DefaultLink>
    )
  } else {
    return (
      <TzktLink
        link={`${fa2}/tokens/${id}`}
        className={className ? className : ''}
      >
        {children}
      </TzktLink>
    )
  }
}

export function IpfsLink({ cid, className, children }) {
  return (
    <DefaultLink
      href={`https://ipfs.io/ipfs/${cid}`}
      className={styles.ipfs_link + ' ' + (className ? className : '')}
    >
      {children ? children : cid}
    </DefaultLink>
  )
}
