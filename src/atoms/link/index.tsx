import { CIDToURL } from '@utils/index'
import { walletPreview } from '@utils/string'
import { TOKENS } from '@constants'
import styles from '@style'
import { ReactNode } from 'react'

interface LinkProps {
  className?: string
  children?: ReactNode
}

interface HrefLinkProps extends LinkProps {
  href: string
}

interface AddressLinkProps extends LinkProps {
  address: string
  alias?: string
  shorten?: boolean
}

interface TzktLinkProps extends LinkProps {
  link: string
}

interface TokenLinkProps extends LinkProps {
  fa2: string
  id: string
}

interface IpfsLinkProps extends LinkProps {
  cid: string
  type?: string
}

export function TeiaUserLink({ address, alias, shorten, className, children }: AddressLinkProps) {
  return (
    <a href={`/tz/${address}`} className={className ?? ''}>
      {children ?? alias ?? (shorten ? walletPreview(address) : address)}
    </a>
  )
}

export function DefaultLink({ href, className, children }: HrefLinkProps) {
  return (
    <a href={href} target="_blank" rel="noreferrer" className={className ?? ''}>
      {children ?? 'link'}
    </a>
  )
}

export function TzktLink({ link, className, children }: TzktLinkProps) {
  return (
    <DefaultLink href={`https://tzkt.io/${link}`} className={className}>
      {children ?? 'TzKT link'}
    </DefaultLink>
  )
}

export function TezosAddressLink({
  address,
  alias,
  shorten,
  className,
  children,
}: AddressLinkProps) {
  return (
    <TzktLink link={address} className={className}>
      {children ?? alias ?? (shorten ? walletPreview(address) : address)}
    </TzktLink>
  )
}

export function TokenLink({ fa2, id, className, children }: TokenLinkProps) {
  const token = TOKENS.find((token) => token.fa2 === fa2)
  const tokenFullName = token
    ? token.multiasset
      ? `${token.name}#${id}`
      : token.name
    : `token #${id}`

  if (token?.website) {
    return (
      <DefaultLink href={`${token.website}${id}`} className={className}>
        {children ?? tokenFullName}
      </DefaultLink>
    )
  } else {
    return (
      <TzktLink link={`${fa2}/tokens/${id}`} className={className}>
        {children ?? tokenFullName}
      </TzktLink>
    )
  }
}

export function IpfsLink({ cid, type, className, children }: IpfsLinkProps) {
  return (
    <DefaultLink
      href={CIDToURL(cid, (type ?? 'IPFS') as any, { size: 'raw' })}
      className={`${styles.ipfs_link} ${className ?? ''}`}
    >
      {children ?? cid}
    </DefaultLink>
  )
}
