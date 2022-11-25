import {
  IRAN_FUNDING_CONTRACT,
  PAKISTAN_FUNDING_CONTRACT,
  UKRAINE_FUNDING_CONTRACT,
} from '../../constants'
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
      namepsace="iran-feed"
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
      namepsace="pakistan-feed"
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
      namepsace="ukraine-feed"
      infoUrl="https://github.com/teia-community/teia-docs/wiki/Ukranian-Fundraising"
    />
  )
}
