export const CollaboratorType = {
  ADMIN: 'admin',
  CREATOR: 'creator',
  BENEFICIARY: 'benefactor', // Haha - we used the wrong word. Thanks Golan Levin for correcting us ^1x1
  CORE_PARTICIPANT: 'core_participant',
}

export const TabIndex = {
  CREATIONS: 0,
  COLLECTION: 1,
  COLLABS: 2,
}

// TODO - get this manageable on-chain
export const ossProjects = [
  {
    name: 'WG3.2 (collab contract team)',
    address: 'KT1BBYzfuYjgRdeHJ79vG3fZd8cHW9ueCEcN',
  },
  {
    name: 'Processing',
    address: 'tz1aPHze1U5BEEKrGYt3dvY6aAQEeiWm8jjK',
  },
  {
    name: 'three.js',
    address: 'tz1ZUohCAkGjp7vPjQcC4VWcpgYZR1t3Si5C',
  },
  {
    name: 'Teia infrastructure run by TezTools (servers, indexer, maintenance)',
    address: 'tz1Q7fCeswrECCZthfzx2joqkoTdyin8DDg8',
  },
  {
    name: 'Teia Fountain Donations (Multisig)',
    address: 'KT1EsvmkijLKPQmcJMbjDeKRXdwky1LWvwpG',
  },
  {
    name: 'Community Representation/Equity Donations (Multisig)',
    address: 'KT1TGJGjh9oMntcny4J7eVn1NDPgCXimHqss',
  },
  {
    name: 'Ukraine Relief Smart Contract',
    address: 'KT1DWnLiUkNtAQDErXxudFEH63JC6mqg3HEx',
  },
  {
    name: 'Pakistan Relief Smart Contract',
    address: 'KT1Jpf2TAcZS7QfBraQMBeCxjFhH6kAdDL4z',
  },
  {
    name: 'Tezos for Iran',
    address: 'KT1KYfj97fpdomqyKsZSBdSVvh9afh93b4Ge',
  },
]

export const collaboratorTemplate = {
  address: '',
  tezAddress: '',
  shares: undefined,
}

export const tipOptions = [1, 5, 10]

export const mockData = [
  {
    address: 'tz1YJvMiZyXnzvV9pxtAiuCFvaG7XoBZhbUQ',
    shares: 50,
  },
  {
    address: 'tz1LKpeN8ZSSFNyTWiBNaE4u4sjaq7J1Vz2z',
    shares: 50,
  },
  {
    address: 'tz1f94uZ7SF2fLKnMjFzGQTbznd8qpAZ12is',
    shares: 50,
  },
]

export const createProxySchema = `
(map address (pair (bool %isCore) (nat %share))))
`

export const teiaSwapSchema = `
(pair (address %marketplaceAddress)
  (pair %params (address %fa2)
    (pair (nat %objkt_id)
      (pair (nat %objkt_amount)
        (pair (mutez %xtz_per_objkt)
          (pair (nat %royalties) (address %creator)))))))
`

export const teiaCancelSwapSchema = `
(pair (address %marketplaceAddress) (nat %swap_id))
`
