import {
  ART4ARTIST_BREADFOND_CONTRACT,
  TEZ4PAL_FUNDING_ADDRESS,
  IRAN_FUNDING_CONTRACT,
  MOROCCO_QUAKE_FUNDING_CONTRACT,
  PAKISTAN_FUNDING_CONTRACT,
  QUAKE_FUNDING_CONTRACT,
  UKRAINE_FUNDING_CONTRACT,
} from '@constants'
import FundFeed from './fund-feed'

export function IranFeed() {
  return (
    <FundFeed
      introText={
        <>
          This feed shows OBJKTs minted with the Iran donation address as
          beneficiary of at least 50% of sales volume or tagged with #Tezos4Iran
        </>
      }
      contractAddress={IRAN_FUNDING_CONTRACT}
      cause="Iran"
      namespace="iran-feed"
      tags={['tezos4iran', '#tezos4iran']}
      infoUrl="https://github.com/teia-community/teia-docs/wiki/Tezos-for-Iran"
    />
  )
}

export function PakistanFeed() {
  return (
    <FundFeed
      introText={
        <>
          This feed shows OBJKTs minted with the Pakistan donation address as
          beneficiary of at least 50% of sales volume.
        </>
      }
      contractAddress={PAKISTAN_FUNDING_CONTRACT}
      cause="Pakistan"
      namespace="pakistan-feed"
      infoUrl="https://github.com/teia-community/teia-docs/wiki/Pakistan-Fundraiser"
    />
  )
}

export function UkraineFeed() {
  return (
    <FundFeed
      introText={
        <>
          This feed shows OBJKTs minted with the Ukraine donation address as
          beneficiary of at least 50% of sales volume.
        </>
      }
      contractAddress={UKRAINE_FUNDING_CONTRACT}
      cause="Ukraine"
      namespace="ukraine-feed"
      infoUrl="https://github.com/teia-community/teia-docs/wiki/Ukranian-Fundraising"
    />
  )
}

export function QuakeFeed() {
  return (
    <FundFeed
      introText={
        <>
          Tezos community initiative to support those affected by the recent
          earthquake in Turkey and Syria. Given the events in Morocco, we are
          channeling our current support toward emergency relief there.
        </>
      }
      contractAddress={QUAKE_FUNDING_CONTRACT}
      cause="Morocco, Turkey and Syria Earthquakes"
      namespace="quake-feed"
      tags={['TezQuakeAid', '#TezQuakeAid']}
      infoUrl="https://app.joyn.xyz/space/tezquakeaid-ec7f1f650671"
    />
  )
}

export function MoroccoQuakeFeed() {
  return (
    <FundFeed
      introText={
        <>
          Tezos community initiative to support those affected by the recent
          earthquake in Morocco.
        </>
      }
      contractAddress={MOROCCO_QUAKE_FUNDING_CONTRACT}
      cause="Morocco Earthquakes"
      namespace="morocco-quake-feed"
      tags={['TezQuakeAid', '#TezQuakeAid']}
      infoUrl="https://app.joyn.xyz/space/tezquakeaid-ec7f1f650671"
    />
  )
}

export function Tez4PalFeed() {
  return (
    <FundFeed
      introText={<>The Tezos Fundraiser #Tez4Pal, supporting Gaza civilians.</>}
      contractAddress={TEZ4PAL_FUNDING_ADDRESS}
      cause="Supporting Gaza civilians"
      namespace="tez4pal"
      tags={['Tez4Pal', '#Tez4Pal', 'tez4pal', '#tez4pal']}
      infoUrl="https://twitter.com/LN0ir/status/1745946304742576400"
    />
  )
}

export function Art4ArtistFeed() {
  return (
    <FundFeed
      introText={<>#Art4Artist Breadfond</>}
      contractAddress={ART4ARTIST_BREADFOND_CONTRACT}
      cause="Art4Artist"
      namespace="art4artist"
      tags={['Art4Artist', '#Art4Artist']}
      infoUrl="https://x.com/EggsUnknow/status/1848805355620602309"
    />
  )
}
