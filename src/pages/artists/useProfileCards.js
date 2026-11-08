import { profileAvatarUrl, useChainProfiles } from '@data/profiles'

/**
 * On-chain profile cards for a page of artists. An artist with a card shows
 * the card's name, bio, avatar and settings (and links by address, since a
 * card name need not be a SUBJKT); hidden cards are left out by
 * useChainProfiles.
 */
export default function useProfileCards(artists) {
  const { data: profiles } = useChainProfiles(
    artists?.map((a) => a.address) ?? []
  )
  const contentOf = (artist) => profiles?.[artist.address]?.content
  const artistOf = (artist) => {
    const content = contentOf(artist)
    if (!content) return artist
    return {
      ...artist,
      name: content.name || artist.name,
      description: content.description,
      identicon: profileAvatarUrl(content.identicon),
      href: `/tz/${artist.address}`,
    }
  }
  const cardOf = (artist) => contentOf(artist)?.card
  return { artistOf, cardOf }
}
